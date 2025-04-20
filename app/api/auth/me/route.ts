import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getUserData } from "@/lib/data-utils"

export async function GET() {
  try {
    const cookieStore = cookies()
    const authCookie = cookieStore.get("auth")

    if (!authCookie) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const userData = await getUserData(authCookie.value)

    if (!userData) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    // Don't send the password to the client
    const { password, ...userWithoutPassword } = userData

    return NextResponse.json({ user: userWithoutPassword })
  } catch (error) {
    console.error("Error in /api/auth/me:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
