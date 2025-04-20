import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { FileManager } from "@/components/file-manager"
import { getUserData } from "@/lib/data-utils"

export default async function DashboardPage() {
  const cookieStore = cookies()
  const authCookie = cookieStore.get("auth")

  if (!authCookie) {
    redirect("/")
  }

  const userData = await getUserData(authCookie.value)

  if (!userData) {
    redirect("/")
  }

  return (
    <main className="min-h-screen">
      <FileManager user={userData} />
    </main>
  )
}
