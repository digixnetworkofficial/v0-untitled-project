"use server"

import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"
import fs from "fs/promises"
import path from "path"
import bcrypt from "bcryptjs"

const DATA_DIR = path.join(process.cwd(), "data")
const USERS_FILE = path.join(DATA_DIR, "users.json")

type User = {
  id: string
  name: string
  email: string
  password: string
  role: string
}

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch (error) {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

// Get all users
async function getUsers(): Promise<User[]> {
  await ensureDataDir()

  try {
    const data = await fs.readFile(USERS_FILE, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    // If file doesn't exist, create it with an admin user
    const adminPassword = await bcrypt.hash("admin123", 10)
    const adminId = uuidv4()
    const initialUsers = [
      {
        id: adminId,
        name: "Admin",
        email: "admin@example.com",
        password: adminPassword,
        role: "admin",
      },
    ]

    // Create admin directory
    const adminDir = path.join(DATA_DIR, "files", adminId)
    await fs.mkdir(adminDir, { recursive: true })

    // Create default folders for admin
    await fs.mkdir(path.join(adminDir, "Documents"), { recursive: true })
    await fs.mkdir(path.join(adminDir, "Images"), { recursive: true })
    await fs.mkdir(path.join(adminDir, "Downloads"), { recursive: true })

    await fs.writeFile(USERS_FILE, JSON.stringify(initialUsers, null, 2))
    return initialUsers
  }
}

// Save users
async function saveUsers(users: User[]) {
  await ensureDataDir()
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2))
}

// Register a new user
export async function registerUser(userData: { name: string; email: string; password: string }) {
  try {
    const users = await getUsers()

    // Check if email already exists
    if (users.some((user) => user.email === userData.email)) {
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
      role: "user", // Default role
    }

    // Add user to users array
    users.push(newUser)

    // Save updated users
    await saveUsers(users)

    // Create user directory and initial folder structure
    const userDir = path.join(DATA_DIR, "files", newUser.id)
    await fs.mkdir(userDir, { recursive: true })

    // Create default folders for the user
    await fs.mkdir(path.join(userDir, "Documents"), { recursive: true })
    await fs.mkdir(path.join(userDir, "Images"), { recursive: true })
    await fs.mkdir(path.join(userDir, "Downloads"), { recursive: true })

    return { success: true }
  } catch (error) {
    console.error("Registration error:", error)
    return { success: false, error: "Failed to register user" }
  }
}

// Login user
export async function loginUser(credentials: { email: string; password: string }) {
  try {
    const users = await getUsers()

    // Find user by email
    const user = users.find((user) => user.email === credentials.email)

    if (!user) {
      return { success: false, error: "Invalid email or password" }
    }

    // Check password
    const passwordMatch = await bcrypt.compare(credentials.password, user.password)

    if (!passwordMatch) {
      return { success: false, error: "Invalid email or password" }
    }

    // Set auth cookie
    cookies().set("auth", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "Failed to login" }
  }
}

// Logout user
export async function logoutUser() {
  cookies().delete("auth")
  return { success: true }
}
