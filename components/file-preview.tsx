"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileIcon, FileTextIcon, ImageIcon, XIcon } from "lucide-react"

type FilePreviewProps = {
  file: {
    name: string
    path: string
    type: "file" | "folder"
  } | null
  userId: string
  onClose: () => void
  open: boolean
}

export function FilePreview({ file, userId, onClose, open }: FilePreviewProps) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!file || file.type !== "file") {
    return null
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || ""

  const isImage = ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(extension)
  const isText = ["txt", "md", "json", "js", "ts", "html", "css", "csv"].includes(extension)
  const isPdf = extension === "pdf"

  // In a real app, you would fetch the file content from the server
  // For now, we'll just show a placeholder

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{file.name}</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <XIcon className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-[300px] flex items-center justify-center border rounded-md p-4">
          {isImage ? (
            <div className="text-center">
              <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Image preview would be shown here in a real application
              </p>
            </div>
          ) : isText ? (
            <div className="text-center">
              <FileTextIcon className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Text content would be shown here in a real application
              </p>
            </div>
          ) : isPdf ? (
            <div className="text-center">
              <FileIcon className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                PDF preview would be shown here in a real application
              </p>
            </div>
          ) : (
            <div className="text-center">
              <FileIcon className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">This file type cannot be previewed</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
