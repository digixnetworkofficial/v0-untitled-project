"use server"

import fs from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

const DATA_DIR = path.join(process.cwd(), "data")
const USERS_FILE = path.join(DATA_DIR, "users.json")
const FILES_DIR = path.join(DATA_DIR, "files")

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch (error) {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

// Get all users
async function getUsers() {
  await ensureDataDir()

  try {
    const data = await fs.readFile(USERS_FILE, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    // If file doesn't exist, create it with an admin user
    const adminPassword = await bcrypt.hash("admin123", 10)
    const initialUsers = [
      {
        id: uuidv4(),
        name: "Admin",
        email: "admin@example.com",
        password: adminPassword,
        role: "admin",
      },
    ]

    await fs.writeFile(USERS_FILE, JSON.stringify(initialUsers, null, 2))
    return initialUsers
  }
}

// Save users
async function saveUsers(users: any[]) {
  await ensureDataDir()
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2))
}

// Add a new user
export async function addUser(userData: { name: string; email: string; password: string; role: string }) {
  try {
    const users = await getUsers()

    // Check if email already exists
    if (users.some((user: any) => user.email === userData.email)) {
      return { success: false, error: "Email already in use" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10)

    // Create new user
    const newUser = {
      id: uuidv4(),
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
    }

    // Add user to users array
    users.push(newUser)

    // Save updated users
    await saveUsers(users)

    // Create user directory
    const userDir = path.join(FILES_DIR, newUser.id)
    await fs.mkdir(userDir, { recursive: true })

    // Return user without password
    const { password, ...userWithoutPassword } = newUser
    return { success: true, data: userWithoutPassword }
  } catch (error) {
    console.error("Add user error:", error)
    return { success: false, error: "Failed to add user" }
  }
}

// Edit a user
export async function editUser(userData: {
  id: string
  name: string
  email: string
  role: string
  password?: string
}) {
  try {
    const users = await getUsers()

    // Find user index
    const userIndex = users.findIndex((user: any) => user.id === userData.id)

    if (userIndex === -1) {
      return { success: false, error: "User not found" }
    }

    // Check if email is already in use by another user
    if (users.some((user: any) => user.email === userData.email && user.id !== userData.id)) {
      return { success: false, error: "Email already in use" }
    }

    // Update user
    const updatedUser = {
      ...users[userIndex],
      name: userData.name,
      email: userData.email,
      role: userData.role,
    }

    // Update password if provided
    if (userData.password) {
      updatedUser.password = await bcrypt.hash(userData.password, 10)
    }

    // Update users array
    users[userIndex] = updatedUser

    // Save updated users
    await saveUsers(users)

    // Return user without password
    const { password, ...userWithoutPassword } = updatedUser
    return { success: true, data: userWithoutPassword }
  } catch (error) {
    console.error("Edit user error:", error)
    return { success: false, error: "Failed to edit user" }
  }
}

// Remove a user
export async function removeUser(userId: string) {
  try {
    const users = await getUsers()

    // Find user index
    const userIndex = users.findIndex((user: any) => user.id === userId)

    if (userIndex === -1) {
      return { success: false, error: "User not found" }
    }

    // Remove user from array
    users.splice(userIndex, 1)

    // Save updated users
    await saveUsers(users)

    // Remove user directory
    const userDir = path.join(FILES_DIR, userId)
    try {
      await fs.rm(userDir, { recursive: true })
    } catch (error) {
      // Ignore if directory doesn't exist
    }

    return { success: true }
  } catch (error) {
    console.error("Remove user error:", error)
    return { success: false, error: "Failed to remove user" }
  }
}

// Get all files for a user
export async function getUserFiles(userId: string) {
  try {
    const userDir = path.join(FILES_DIR, userId)

    // Ensure user directory exists
    try {
      await fs.access(userDir)
    } catch (error) {
      await fs.mkdir(userDir, { recursive: true })
      return { success: true, data: [] }
    }

    // Function to recursively get all files
    async function getAllFiles(dir: string, results: any[] = []) {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        const relativePath = fullPath.replace(userDir, "").replace(/\\/g, "/")
        const stats = await fs.stat(fullPath)

        results.push({
          id: `${userId}-${relativePath}`,
          name: entry.name,
          type: entry.isDirectory() ? "folder" : "file",
          path: relativePath,
          size: entry.isFile() ? stats.size : undefined,
          createdAt: stats.birthtime.toISOString(),
          updatedAt: stats.mtime.toISOString(),
          ownerId: userId,
        })

        if (entry.isDirectory()) {
          await getAllFiles(fullPath, results)
        }
      }

      return results
    }

    const files = await getAllFiles(userDir)
    return { success: true, data: files }
  } catch (error) {
    console.error("Get user files error:", error)
    return { success: false, error: "Failed to get user files" }
  }
}

// Logout user
export async function logoutUser() {
  cookies().delete("auth")
  return { success: true }
}
