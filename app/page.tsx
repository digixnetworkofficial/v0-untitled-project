import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { LoginForm } from "@/components/login-form"

export default function Home() {
  const cookieStore = cookies()
  const authCookie = cookieStore.get("auth")

  if (authCookie) {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <LoginForm />
    </main>
  )
}
