import fs from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import bcrypt from "bcryptjs"

// Use absolute path with process.cwd()
const DATA_DIR = path.join(process.cwd(), "data")
const USERS_FILE = path.join(DATA_DIR, "users.json")
const FILES_DIR = path.join(DATA_DIR, "files")

// Ensure data directory and initial files exist
export async function ensureDataStructure() {
  try {
    // Create data directory if it doesn't exist
    try {
      await fs.access(DATA_DIR)
    } catch (error) {
      console.log("Creating data directory...")
      await fs.mkdir(DATA_DIR, { recursive: true })
    }

    // Create files directory if it doesn't exist
    try {
      await fs.access(FILES_DIR)
    } catch (error) {
      console.log("Creating files directory...")
      await fs.mkdir(FILES_DIR, { recursive: true })
    }

    // Check if users file exists, if not create it with admin user
    try {
      await fs.access(USERS_FILE)
    } catch (error) {
      console.log("Creating users.json with admin user...")
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
      const adminDir = path.join(FILES_DIR, adminId)
      await fs.mkdir(adminDir, { recursive: true })

      // Create default folders for admin
      await fs.mkdir(path.join(adminDir, "Documents"), { recursive: true })
      await fs.mkdir(path.join(adminDir, "Images"), { recursive: true })
      await fs.mkdir(path.join(adminDir, "Downloads"), { recursive: true })

      await fs.writeFile(USERS_FILE, JSON.stringify(initialUsers, null, 2))
    }
  } catch (error) {
    console.error("Error ensuring data structure:", error)
  }
}

// Get user data by ID
export async function getUserData(userId: string) {
  try {
    // Ensure data structure exists before accessing files
    await ensureDataStructure()

    const data = await fs.readFile(USERS_FILE, "utf-8")
    const users = JSON.parse(data)
    return users.find((user: any) => user.id === userId) || null
  } catch (error) {
    console.error("Error getting user data:", error)
    return null
  }
}

// Get all users
export async function getAllUsers() {
  try {
    // Ensure data structure exists before accessing files
    await ensureDataStructure()

    const data = await fs.readFile(USERS_FILE, "utf-8")
    const users = JSON.parse(data)
    // Remove passwords before returning
    return users.map((user: any) => {
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword
    })
  } catch (error) {
    console.error("Error getting all users:", error)
    return []
  }
}

// Get all items for a user
export async function getAllItems(userId: string, currentPath: string) {
  try {
    // Ensure data structure exists before accessing files
    await ensureDataStructure()

    const userDir = path.join(FILES_DIR, userId)

    // Ensure user directory exists
    try {
      await fs.access(userDir)
    } catch (error) {
      await fs.mkdir(userDir, { recursive: true })
    }

    // Get the full path to the current directory
    const fullPath = path.join(userDir, currentPath.replace(/^\//, ""))

    // Ensure the directory exists
    try {
      await fs.access(fullPath)
    } catch (error) {
      await fs.mkdir(fullPath, { recursive: true })
    }

    // Read the directory
    const entries = await fs.readdir(fullPath, { withFileTypes: true })

    // Map entries to file items
    const items = await Promise.all(
      entries.map(async (entry) => {
        const itemPath = path.join(currentPath, entry.name).replace(/\\/g, "/")
        const entryFullPath = path.join(fullPath, entry.name)
        const stats = await fs.stat(entryFullPath)

        return {
          id: `${userId}-${itemPath}`,
          name: entry.name,
          type: entry.isDirectory() ? "folder" : "file",
          path: itemPath,
          size: entry.isFile() ? stats.size : undefined,
          createdAt: stats.birthtime.toISOString(),
          updatedAt: stats.mtime.toISOString(),
          ownerId: userId,
        }
      }),
    )

    return { success: true, data: items }
  } catch (error) {
    console.error("Error getting items:", error)
    return { success: false, error: "Failed to load items" }
  }
}

// Search items for a user
export async function searchItems(userId: string, query: string) {
  try {
    // Ensure data structure exists before accessing files
    await ensureDataStructure()

    const userDir = path.join(FILES_DIR, userId)

    // Ensure user directory exists
    try {
      await fs.access(userDir)
    } catch (error) {
      await fs.mkdir(userDir, { recursive: true })
      return { success: true, data: [] }
    }

    // Function to recursively search directories
    async function searchDir(dir: string, results: any[] = []) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          const relativePath = fullPath.replace(userDir, "").replace(/\\/g, "/")

          if (entry.name.toLowerCase().includes(query.toLowerCase())) {
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
          }

          if (entry.isDirectory()) {
            await searchDir(fullPath, results)
          }
        }
      } catch (error) {
        console.error("Error searching directory:", error)
      }

      return results
    }

    const results = await searchDir(userDir)
    return { success: true, data: results }
  } catch (error) {
    console.error("Error searching items:", error)
    return { success: false, error: "Failed to search items" }
  }
}

// The rest of the file operations will be implemented here
// For now, we'll create stub functions that return success

export async function createFolder(userId: string, currentPath: string, folderName: string) {
  try {
    // Ensure data structure exists before accessing files
    await ensureDataStructure()

    const userDir = path.join(FILES_DIR, userId)
    const folderPath = path.join(userDir, currentPath.replace(/^\//, ""), folderName)

    await fs.mkdir(folderPath, { recursive: true })

    return {
      success: true,
      data: {
        id: `${userId}-${path.join(currentPath, folderName).replace(/\\/g, "/")}`,
        name: folderName,
        type: "folder",
        path: path.join(currentPath, folderName).replace(/\\/g, "/"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: userId,
      },
    }
  } catch (error) {
    console.error("Error creating folder:", error)
    return { success: false, error: "Failed to create folder" }
  }
}

export async function deleteItem(userId: string, itemPath: string) {
  // Stub implementation
  return { success: true }
}

export async function renameItem(userId: string, itemPath: string, newName: string) {
  // Stub implementation
  return { success: true }
}

export async function copyItem(userId: string, sourcePath: string, targetPath: string) {
  // Stub implementation
  return { success: true }
}

export async function moveItem(userId: string, sourcePath: string, targetPath: string) {
  // Stub implementation
  return { success: true }
}

export async function uploadFile(userId: string, currentPath: string, file: File) {
  // Stub implementation
  return { success: true }
}

export async function downloadFile(userId: string, filePath: string) {
  // Stub implementation
  return { success: true, data: new Blob() }
}

export async function shareFile(userId: string, filePath: string, targetEmail: string) {
  // Stub implementation
  return { success: true }
}
