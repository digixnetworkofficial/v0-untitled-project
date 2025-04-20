"use server"

import fs from "fs/promises"
import path from "path"
import { cookies } from "next/headers"

const DATA_DIR = path.join(process.cwd(), "data")
const FILES_DIR = path.join(DATA_DIR, "files")

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.access(DATA_DIR)
  } catch (error) {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }

  try {
    await fs.access(FILES_DIR)
  } catch (error) {
    await fs.mkdir(FILES_DIR, { recursive: true })
  }
}

// Create a folder
export async function createFolder(userId: string, currentPath: string, folderName: string) {
  await ensureDirectories()

  try {
    const userDir = path.join(FILES_DIR, userId)

    // Ensure user directory exists
    try {
      await fs.access(userDir)
    } catch (error) {
      await fs.mkdir(userDir, { recursive: true })
    }

    // Create the new folder
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

// Delete an item (file or folder)
export async function deleteItem(userId: string, itemPath: string) {
  await ensureDirectories()

  try {
    const userDir = path.join(FILES_DIR, userId)
    const fullPath = path.join(userDir, itemPath.replace(/^\//, ""))

    // Check if item exists
    try {
      await fs.access(fullPath)
    } catch (error) {
      return { success: false, error: "Item not found" }
    }

    // Check if it's a directory
    const stats = await fs.stat(fullPath)

    if (stats.isDirectory()) {
      // Remove directory recursively
      await fs.rm(fullPath, { recursive: true })
    } else {
      // Remove file
      await fs.unlink(fullPath)
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting item:", error)
    return { success: false, error: "Failed to delete item" }
  }
}

// Rename an item
export async function renameItem(userId: string, itemPath: string, newName: string) {
  await ensureDirectories()

  try {
    const userDir = path.join(FILES_DIR, userId)
    const fullPath = path.join(userDir, itemPath.replace(/^\//, ""))

    // Get the directory of the item
    const itemDir = path.dirname(fullPath)
    const newPath = path.join(itemDir, newName)

    // Rename the item
    await fs.rename(fullPath, newPath)

    // Get the new relative path
    const newRelativePath = path.join(path.dirname(itemPath), newName).replace(/\\/g, "/")

    return {
      success: true,
      data: {
        path: newRelativePath,
      },
    }
  } catch (error) {
    console.error("Error renaming item:", error)
    return { success: false, error: "Failed to rename item" }
  }
}

// Copy an item
export async function copyItem(userId: string, sourcePath: string, targetPath: string) {
  await ensureDirectories()

  try {
    const userDir = path.join(FILES_DIR, userId)
    const sourceFullPath = path.join(userDir, sourcePath.replace(/^\//, ""))
    const targetFullPath = path.join(userDir, targetPath.replace(/^\//, ""))

    // Check if source exists
    try {
      await fs.access(sourceFullPath)
    } catch (error) {
      return { success: false, error: "Source item not found" }
    }

    // Create target directory if it doesn't exist
    try {
      await fs.access(path.dirname(targetFullPath))
    } catch (error) {
      await fs.mkdir(path.dirname(targetFullPath), { recursive: true })
    }

    // Check if source is a directory
    const stats = await fs.stat(sourceFullPath)

    if (stats.isDirectory()) {
      // Copy directory recursively (simplified implementation)
      await fs.cp(sourceFullPath, targetFullPath, { recursive: true })
    } else {
      // Copy file
      await fs.copyFile(sourceFullPath, targetFullPath)
    }

    return { success: true }
  } catch (error) {
    console.error("Error copying item:", error)
    return { success: false, error: "Failed to copy item" }
  }
}

// Move an item
export async function moveItem(userId: string, sourcePath: string, targetPath: string) {
  await ensureDirectories()

  try {
    const userDir = path.join(FILES_DIR, userId)
    const sourceFullPath = path.join(userDir, sourcePath.replace(/^\//, ""))
    const targetFullPath = path.join(userDir, targetPath.replace(/^\//, ""))

    // Check if source exists
    try {
      await fs.access(sourceFullPath)
    } catch (error) {
      return { success: false, error: "Source item not found" }
    }

    // Create target directory if it doesn't exist
    try {
      await fs.access(path.dirname(targetFullPath))
    } catch (error) {
      await fs.mkdir(path.dirname(targetFullPath), { recursive: true })
    }

    // Move the item
    await fs.rename(sourceFullPath, targetFullPath)

    return { success: true }
  } catch (error) {
    console.error("Error moving item:", error)
    return { success: false, error: "Failed to move item" }
  }
}

// Upload a file
export async function uploadFile(userId: string, currentPath: string, file: File) {
  await ensureDirectories()

  try {
    const userDir = path.join(FILES_DIR, userId)
    const uploadDir = path.join(userDir, currentPath.replace(/^\//, ""))

    // Ensure upload directory exists
    try {
      await fs.access(uploadDir)
    } catch (error) {
      await fs.mkdir(uploadDir, { recursive: true })
    }

    // In a real implementation, we would save the file here
    // For this example, we'll create an empty file with the same name
    const filePath = path.join(uploadDir, file.name)

    // Check if file already exists
    try {
      await fs.access(filePath)
      // If file exists, append timestamp to make it unique
      const fileExt = path.extname(file.name)
      const fileName = path.basename(file.name, fileExt)
      const timestamp = Date.now()
      const newFileName = `${fileName}_${timestamp}${fileExt}`
      const newFilePath = path.join(uploadDir, newFileName)

      // Create empty file (in a real app, we'd save the actual file content)
      await fs.writeFile(newFilePath, "")

      return {
        success: true,
        data: {
          id: `${userId}-${path.join(currentPath, newFileName).replace(/\\/g, "/")}`,
          name: newFileName,
          type: "file",
          path: path.join(currentPath, newFileName).replace(/\\/g, "/"),
          size: file.size,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ownerId: userId,
        },
      }
    } catch (error) {
      // File doesn't exist, create it
      await fs.writeFile(filePath, "")

      return {
        success: true,
        data: {
          id: `${userId}-${path.join(currentPath, file.name).replace(/\\/g, "/")}`,
          name: file.name,
          type: "file",
          path: path.join(currentPath, file.name).replace(/\\/g, "/"),
          size: file.size,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ownerId: userId,
        },
      }
    }
  } catch (error) {
    console.error("Error uploading file:", error)
    return { success: false, error: "Failed to upload file" }
  }
}

// Download a file
export async function downloadFile(userId: string, filePath: string) {
  await ensureDirectories()

  try {
    const userDir = path.join(FILES_DIR, userId)
    const fullPath = path.join(userDir, filePath.replace(/^\//, ""))

    // Check if file exists
    try {
      await fs.access(fullPath)
    } catch (error) {
      return { success: false, error: "File not found" }
    }

    // Check if it's a file
    const stats = await fs.stat(fullPath)

    if (!stats.isFile()) {
      return { success: false, error: "Not a file" }
    }

    // Read the file
    const fileData = await fs.readFile(fullPath)

    return {
      success: true,
      data: fileData,
    }
  } catch (error) {
    console.error("Error downloading file:", error)
    return { success: false, error: "Failed to download file" }
  }
}

// Share a file
export async function shareFile(userId: string, filePath: string, targetEmail: string) {
  // In a real implementation, we would store sharing information in a database
  // For this example, we'll just return success
  return { success: true }
}

// Search for items
export async function searchItems(userId: string, query: string) {
  await ensureDirectories()

  try {
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ownerId: userId,
          })
        }

        if (entry.isDirectory()) {
          await searchDir(fullPath, results)
        }
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

// Get all items
export async function getAllItems(userId: string, currentPath: string) {
  await ensureDirectories()

  try {
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

// Logout user
export async function logoutUser() {
  cookies().delete("auth")
  return { success: true }
}
