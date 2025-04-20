import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AdminDashboard } from "@/components/admin-dashboard"
import { getUserData, getAllUsers } from "@/lib/data-utils"

export default async function AdminPage() {
  const cookieStore = cookies()
  const authCookie = cookieStore.get("auth")

  if (!authCookie) {
    redirect("/")
  }

  const userData = await getUserData(authCookie.value)

  if (!userData || userData.role !== "admin") {
    redirect("/dashboard")
  }

  const users = await getAllUsers()

  return (
    <main className="min-h-screen">
      <AdminDashboard currentUser={userData} users={users} />
    </main>
  )
}
