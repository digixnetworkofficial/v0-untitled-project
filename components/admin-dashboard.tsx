"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserIcon, PlusIcon, TrashIcon, PencilIcon, FileIcon, LogOutIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { addUser, removeUser, editUser, getUserFiles, logoutUser } from "@/lib/admin-actions"
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

type AdminDashboardProps = {
  currentUser: User
  users: User[]
}

export function AdminDashboard({ currentUser, users: initialUsers }: AdminDashboardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userFiles, setUserFiles] = useState<FileItem[]>([])

  // Dialog states
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [editUserOpen, setEditUserOpen] = useState(false)
  const [removeUserOpen, setRemoveUserOpen] = useState(false)

  // Form states
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newUserRole, setNewUserRole] = useState("user")

  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: "All fields are required",
      })
      return
    }

    try {
      const result = await addUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      })

      if (result.success) {
        toast({
          title: "User added",
          description: `User "${newUserName}" added successfully`,
        })
        setAddUserOpen(false)
        setNewUserName("")
        setNewUserEmail("")
        setNewUserPassword("")
        setNewUserRole("user")
        setUsers([...users, result.data])
      } else {
        toast({
          variant: "destructive",
          title: "Failed to add user",
          description: result.error,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to add user",
        description: "An unexpected error occurred",
      })
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser || !newUserName.trim() || !newUserEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: "Name and email are required",
      })
      return
    }

    try {
      const result = await editUser({
        id: selectedUser.id,
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        password: newUserPassword || undefined,
      })

      if (result.success) {
        toast({
          title: "User updated",
          description: `User "${newUserName}" updated successfully`,
        })
        setEditUserOpen(false)
        setSelectedUser(null)
        setNewUserName("")
        setNewUserEmail("")
        setNewUserPassword("")
        setNewUserRole("user")

        // Update users list
        setUsers(users.map((user) => (user.id === result.data.id ? result.data : user)))
      } else {
        toast({
          variant: "destructive",
          title: "Failed to update user",
          description: result.error,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update user",
        description: "An unexpected error occurred",
      })
    }
  }

  const handleRemoveUser = async () => {
    if (!selectedUser) return

    try {
      const result = await removeUser(selectedUser.id)

      if (result.success) {
        toast({
          title: "User removed",
          description: `User "${selectedUser.name}" removed successfully`,
        })
        setRemoveUserOpen(false)
        setSelectedUser(null)

        // Update users list
        setUsers(users.filter((user) => user.id !== selectedUser.id))
      } else {
        toast({
          variant: "destructive",
          title: "Failed to remove user",
          description: result.error,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to remove user",
        description: "An unexpected error occurred",
      })
    }
  }

  const handleViewUserFiles = async (user: User) => {
    try {
      const result = await getUserFiles(user.id)

      if (result.success) {
        setSelectedUser(user)
        setUserFiles(result.data)
      } else {
        toast({
          variant: "destructive",
          title: "Failed to load user files",
          description: result.error,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load user files",
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

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar>
          <SidebarHeader className="p-4">
            <h2 className="text-xl font-bold">Admin Dashboard</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => router.push("/dashboard")}>
                  <FileIcon className="h-4 w-4" />
                  <span>File Manager</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={true}>
                  <UserIcon className="h-4 w-4" />
                  <span>Admin Panel</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground">{currentUser.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOutIcon className="h-4 w-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b p-4">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </header>

          <div className="p-4">
            <Button
              onClick={() => {
                setNewUserName("")
                setNewUserEmail("")
                setNewUserPassword("")
                setNewUserRole("user")
                setAddUserOpen(true)
              }}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>

          <div className="flex-1 p-4 overflow-auto">
            <Tabs defaultValue="users">
              <TabsList>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="files" disabled={!selectedUser}>
                  {selectedUser ? `${selectedUser.name}'s Files` : "User Files"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.role}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm" onClick={() => handleViewUserFiles(user)}>
                                  <FileIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setNewUserName(user.name)
                                    setNewUserEmail(user.email)
                                    setNewUserPassword("")
                                    setNewUserRole(user.role)
                                    setEditUserOpen(true)
                                  }}
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setRemoveUserOpen(true)
                                  }}
                                  disabled={user.id === currentUser.id}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="files" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedUser?.name}&apos;s Files</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userFiles.length === 0 ? (
                      <p className="text-center py-4 text-muted-foreground">No files found for this user</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Path</TableHead>
                            <TableHead>Last Modified</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userFiles.map((file) => (
                            <TableRow key={file.id}>
                              <TableCell>{file.name}</TableCell>
                              <TableCell>{file.type}</TableCell>
                              <TableCell>{file.path}</TableCell>
                              <TableCell>{new Date(file.updatedAt).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Enter details for the new user</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                placeholder="John Doe"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="role" className="text-sm font-medium">
                Role
              </label>
              <select
                id="role"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update details for {selectedUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="edit-name"
                placeholder="John Doe"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="edit-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="edit-email"
                type="email"
                placeholder="john@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="edit-password" className="text-sm font-medium">
                Password (leave blank to keep unchanged)
              </label>
              <Input
                id="edit-password"
                type="password"
                placeholder="••••••••"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="edit-role" className="text-sm font-medium">
                Role
              </label>
              <select
                id="edit-role"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser}>Update User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove User Dialog */}
      <Dialog open={removeUserOpen} onOpenChange={setRemoveUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove User</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedUser?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveUserOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveUser}>
              Remove User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
