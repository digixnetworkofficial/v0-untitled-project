import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { RegisterForm } from "@/components/register-form"

export default function RegisterPage() {
  const cookieStore = cookies()
  const authCookie = cookieStore.get("auth")

  if (authCookie) {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <RegisterForm />
    </main>
  )
}
