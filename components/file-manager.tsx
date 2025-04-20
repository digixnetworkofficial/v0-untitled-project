"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  FileIcon,
  FolderIcon,
  SearchIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CopyIcon,
  MoveIcon,
  UploadIcon,
  DownloadIcon,
  ShareIcon,
  LogOutIcon,
  UserIcon,
  FileTextIcon,
  ImageIcon,
  FileArchiveIcon,
  FileCodeIcon,
  FileIcon as FilePresentationIcon,
  FileSpreadsheetIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  createFolder,
  deleteItem,
  renameItem,
  copyItem,
  moveItem,
  uploadFile,
  downloadFile,
  shareFile,
  searchItems,
  getAllItems,
  logoutUser,
} from "@/lib/file-actions"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import React from "react"
import { FilePreview } from "@/components/file-preview"

type User = {
  id: string
  name: string
  email: string
  role: string
}

type FileItem = {
  id: string
  name: string
  type: "file" | "folder"
  path: string
  size?: number
  createdAt: string
  updatedAt: string
  ownerId: string
}

type FileManagerProps = {
  user: User
}

export function FileManager({ user }: FileManagerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [items, setItems] = useState<FileItem[]>([])
  const [currentPath, setCurrentPath] = useState("/")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItem, setSelectedItem] = useState<FileItem | null>(null)
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  // Dialog states
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [copyOpen, setCopyOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  // Form states
  const [newFolderName, setNewFolderName] = useState("")
  const [newName, setNewName] = useState("")
  const [targetPath, setTargetPath] = useState("")
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)
  const [shareEmail, setShareEmail] = useState("")

  // Add these state variables inside the FileManager component
  const [storageUsed, setStorageUsed] = useState(0)
  const [storageLimit, setStorageLimit] = useState(1024 * 1024 * 100) // 100MB default limit

  // Load items on mount and when path changes
  useEffect(() => {
    loadItems()
  }, [currentPath])

  const loadItems = async () => {
    try {
      const result = await getAllItems(user.id, currentPath)
      if (result.success) {
        setItems(result.data)
      } else {
        toast({
          variant: "destructive",
          title: "Error loading items",
          description: result.error,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading items",
        description: "An unexpected error occurred",
      })
    }
  }

  // Add this function to calculate storage usage
  const calculateStorageUsage = useCallback(async () => {
    try {
      // In a real app, you would fetch this from the server
      // For now, we'll just calculate it from the loaded items
      let totalSize = 0
      items.forEach((item) => {
        if (item.type === "file" && item.size) {
          totalSize += item.size
        }
      })
      setStorageUsed(totalSize)
    } catch (error) {
      console.error("Error calculating storage usage:", error)
    }
  }, [items])

  // Call this function when items change
  useEffect(() => {
    calculateStorageUsage()
  }, [items, calculateStorageUsage])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadItems()
      return
    }

    try {
      const result = await searchItems(user.id, searchQuery)
      if (result.success) {
        setItems(result.data)
      } else {
        toast({
          variant: "destructive",
          title: "Search failed",
          description: result.error,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Search failed",
        description: "An unexpected error occurred",
      })
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid folder name",
        description: "Folder name cannot be empty",
      })
      return
    }

    try {
      const result = await createFolder(user.id, currentPath, newFolderName)
      if (result.success) {
        toast({
          title: "Folder created",
          description: `Folder "${newFolderName}" created successfully`,
        })
        setCreateFolderOpen(false)
        setNewFolderName("")
        loadItems()
      } else {
        toast({
          variant: "destructive",
          title: "Failed to create folder",
          description: result.error,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create folder",
        description: "An unexpected error occurred",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedItem) return

    try {
      const result = await deleteItem(user.id, selectedItem.path)
      if (result.success) {
        toast({
          title: "Item deleted",
          description: `"${selectedItem.name}" deleted successfully`,
        })
        setDeleteOpen(false)
        setSelectedItem(null)
        loadItems()
      } else {
        toast({
          variant: "destructive",
          title: "Failed to delete item",
          description: result.error,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete item",
        description: "An unexpected error occurred",
      })
    }
  }

  const handleRename = async () => {
    if (!selectedItem || !newName.trim()) return

    try {
      const result = await renameItem(user.id, selectedItem.path, newName)
      if (result.success) {
        toast({
          title: "Item renamed",
          description: `"${selectedItem.name}" renamed to "${newName}"`,
        })
        setRenameOpen(false)
        setSelectedItem(null)
        setNewName("")
        loadItems()
      } else {
        toast({
          variant: "destructive",
          title: "Failed to rename item",
          description: result.error,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to rename item",
        description: "An unexpected error occurred",
      })
    }
  }

  const handleCopy = async () => {
    if (!selectedItem || !targetPath.trim()) return

    try {
      const result = await copyItem(user.id, selectedItem.path, targetPath)
      if (result.success) {
        toast({
          title: "Item copied",
          description: `"${selectedItem.name}" copied to "${targetPath}"`,
        })
        setCopyOpen(false)
        setSelectedItem(null)
        setTargetPath("")
        loadItems()
      } else {
        toast({
          variant: "destructive",
          title: "Failed to copy item",
          description: result.error,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to copy item",
        description: "An unexpected error occurred",
      })
    }
  }

  const handleMove = async () => {
    if (!selectedItem || !targetPath.trim()) return

    try {
      const result = await moveItem(user.id, selectedItem.path, targetPath)
      if (result.success) {
        toast({
          title: "Item moved",
          description: `"${selectedItem.name}" moved to "${targetPath}"`,
        })
        setMoveOpen(false)
        setSelectedItem(null)
        setTargetPath("")
        loadItems()
      } else {
        toast({
          variant: "destructive",
          title: "Failed to move item",
          description: result.error,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to move item",
        description: "An unexpected error occurred",
      })
    }
  }

  const handleUpload = async () => {
    if (!fileToUpload) return

    try {
      const result = await uploadFile(user.id, currentPath, fileToUpload)
      if (result.success) {
        toast({
          title: "File uploaded",
          description: `"${fileToUpload.name}" uploaded successfully`,
        })
        setUploadOpen(false)
        setFileToUpload(null)
        loadItems()
      } else {
        toast({
          variant: "destructive",
          title: "Failed to upload file",
          description: result.error,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to upload file",
        description: "An unexpected error occurred",
      })
    }
  }

  const handleDownload = async (item: FileItem) => {
    if (item.type === "folder") {
      toast({
        variant: "destructive",
        title: "Cannot download folder",
        description: "Only files can be downloaded",
      })
      return
    }

    try {
      const result = await downloadFile(user.id, item.path)
      if (result.success) {
        // Create a download link
        const url = window.URL.createObjectURL(new Blob([result.data]))
        const link = document.createElement("a")
        link.href = url
        link.setAttribute("download", item.name)
        document.body.appendChild(link)
        link.click()
        link.remove()

        toast({
          title: "File downloaded",
          description: `"${item.name}" downloaded successfully`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "Failed to download file",
          description: result.error,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to download file",
        description: "An unexpected error occurred",
      })
    }
  }

  const handleShare = async () => {
    if (!selectedItem || !shareEmail.trim()) return

    try {
      const result = await shareFile(user.id, selectedItem.path, shareEmail)
      if (result.success) {
        toast({
          title: "Item shared",
          description: `"${selectedItem.name}" shared with ${shareEmail}`,
        })
        setShareOpen(false)
        setSelectedItem(null)
        setShareEmail("")
      } else {
        toast({
          variant: "destructive",
          title: "Failed to share item",
          description: result.error,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to share item",
        description: "An unexpected error occurred",
      })
    }
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
      router.push("/")
      router.refresh()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "An unexpected error occurred",
      })
    }
  }

  const handleFileClick = (item: FileItem) => {
    if (item.type === "folder") {
      navigateToFolder(item)
    } else {
      setPreviewFile(item)
      setPreviewOpen(true)
    }
  }

  const navigateToFolder = (item: FileItem) => {
    if (item.type === "folder") {
      setCurrentPath(item.path)
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase() || ""

    switch (extension) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "svg":
      case "webp":
        return <ImageIcon className="h-8 w-8 text-purple-500" />
      case "pdf":
        return <FilePresentationIcon className="h-8 w-8 text-red-500" />
      case "doc":
      case "docx":
      case "txt":
      case "md":
        return <FileTextIcon className="h-8 w-8 text-blue-500" />
      case "xls":
      case "xlsx":
      case "csv":
        return <FileSpreadsheetIcon className="h-8 w-8 text-green-500" />
      case "zip":
      case "rar":
      case "tar":
      case "gz":
        return <FileArchiveIcon className="h-8 w-8 text-amber-500" />
      case "js":
      case "ts":
      case "jsx":
      case "tsx":
      case "html":
      case "css":
      case "json":
        return <FileCodeIcon className="h-8 w-8 text-emerald-500" />
      default:
        return <FileIcon className="h-8 w-8 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const renderBreadcrumbs = () => {
    if (currentPath === "/") {
      return <span className="font-medium">Home</span>
    }

    const pathParts = currentPath.split("/").filter(Boolean)

    return (
      <div className="flex items-center space-x-1 text-sm">
        <span className="hover:underline cursor-pointer" onClick={() => setCurrentPath("/")}>
          Home
        </span>

        {pathParts.map((part, index) => {
          const pathToHere = "/" + pathParts.slice(0, index + 1).join("/")
          return (
            <React.Fragment key={pathToHere}>
              <span>/</span>
              <span className="hover:underline cursor-pointer" onClick={() => setCurrentPath(pathToHere)}>
                {part}
              </span>
            </React.Fragment>
          )
        })}
      </div>
    )
  }

  const navigateUp = () => {
    const pathParts = currentPath.split("/").filter(Boolean)
    if (pathParts.length > 0) {
      const newPath = "/" + pathParts.slice(0, -1).join("/")
      setCurrentPath(newPath === "/" ? "/" : newPath)
    }
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar>
          <SidebarHeader className="p-4">
            <h2 className="text-xl font-bold">File Manager</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setCurrentPath("/")} isActive={currentPath === "/"}>
                  <FolderIcon className="h-4 w-4" />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setCurrentPath("/shared")} isActive={currentPath === "/shared"}>
                  <ShareIcon className="h-4 w-4" />
                  <span>Shared with me</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {user.role === "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => router.push("/admin")} isActive={false}>
                    <UserIcon className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span>Storage</span>
                <span>
                  {formatFileSize(storageUsed)} / {formatFileSize(storageLimit)}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${Math.min(100, (storageUsed / storageLimit) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOutIcon className="h-4 w-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={navigateUp} disabled={currentPath === "/"}>
                  Back
                </Button>
                <div className="text-sm flex items-center">{renderBreadcrumbs()}</div>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search files and folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
                <Button variant="outline" size="icon" onClick={handleSearch}>
                  <SearchIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          <div className="p-4 flex space-x-2">
            <Button onClick={() => setCreateFolderOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <Button onClick={() => setUploadOpen(true)}>
              <UploadIcon className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </div>

          <div className="flex-1 p-4 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">No files or folders found</div>
              ) : (
                items.map((item) => (
                  <Card key={item.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1" onClick={() => handleFileClick(item)}>
                          {item.type === "folder" ? (
                            <FolderIcon className="h-8 w-8 text-blue-500" />
                          ) : (
                            getFileIcon(item.name)
                          )}
                          <div>
                            <p className="font-medium truncate max-w-[150px]">{item.name}</p>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                              {item.size !== undefined && <span>{formatFileSize(item.size)}</span>}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedItem(item)
                                setNewName(item.name)
                                setRenameOpen(true)
                              }}
                            >
                              <PencilIcon className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedItem(item)
                                setDeleteOpen(true)
                              }}
                            >
                              <TrashIcon className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedItem(item)
                                setTargetPath("")
                                setCopyOpen(true)
                              }}
                            >
                              <CopyIcon className="h-4 w-4 mr-2" />
                              Copy
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedItem(item)
                                setTargetPath("")
                                setMoveOpen(true)
                              }}
                            >
                              <MoveIcon className="h-4 w-4 mr-2" />
                              Move
                            </DropdownMenuItem>
                            {item.type === "file" && (
                              <DropdownMenuItem onClick={() => handleDownload(item)}>
                                <DownloadIcon className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedItem(item)
                                setShareEmail("")
                                setShareOpen(true)
                              }}
                            >
                              <ShareIcon className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <FilePreview
        file={previewFile}
        userId={user.id}
        onClose={() => {
          setPreviewOpen(false)
          setPreviewFile(null)
        }}
        open={previewOpen}
      />

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Enter a name for the new folder</DialogDescription>
          </DialogHeader>
          <Input placeholder="Folder name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Item</DialogTitle>
            <DialogDescription>Enter a new name for "{selectedItem?.name}"</DialogDescription>
          </DialogHeader>
          <Input placeholder="New name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedItem?.name}"?
              {selectedItem?.type === "folder" && " This will delete all contents inside the folder."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy Dialog */}
      <Dialog open={copyOpen} onOpenChange={setCopyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy Item</DialogTitle>
            <DialogDescription>Enter the destination path to copy "{selectedItem?.name}"</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Destination path (e.g., /documents)"
            value={targetPath}
            onChange={(e) => setTargetPath(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCopy}>Copy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Item</DialogTitle>
            <DialogDescription>Enter the destination path to move "{selectedItem?.name}"</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Destination path (e.g., /documents)"
            value={targetPath}
            onChange={(e) => setTargetPath(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMove}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>Select a file to upload to the current directory</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="file"
              onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
              className="cursor-pointer"
            />
            {fileToUpload && (
              <div className="text-sm">
                <p>
                  <span className="font-medium">Name:</span> {fileToUpload.name}
                </p>
                <p>
                  <span className="font-medium">Size:</span> {formatFileSize(fileToUpload.size)}
                </p>
                <p>
                  <span className="font-medium">Type:</span> {fileToUpload.type || "Unknown"}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!fileToUpload}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Item</DialogTitle>
            <DialogDescription>
              Enter the email of the user you want to share "{selectedItem?.name}" with
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Email address"
            type="email"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleShare}>Share</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
