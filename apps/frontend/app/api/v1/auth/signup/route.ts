import { type NextRequest, NextResponse } from "next/server"
import type { SignUpRequest } from "@/types"

export async function POST(request: NextRequest) {
  try {
    const body: SignUpRequest = await request.json()
    const { email, password, firstName, lastName, phoneNo } = body

    // Validate input
    if (!email || !password || !firstName || !lastName || !phoneNo) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Invalid email format" }, { status: 400 })
    }

    // In a real application, you would:
    // 1. Check if user already exists
    // 2. Hash the password
    // 3. Store user in database
    // For demo purposes, we'll simulate successful registration
    console.log("New user registration:", { email, firstName, lastName, phoneNo })

    return NextResponse.json({
      message: "Account created successfully",
      user: {
        id: `user-${Date.now()}`,
        email,
        firstName,
        lastName,
        phoneNo,
      },
    })
  } catch (error) {
    console.error("Sign up error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
