import { type NextRequest, NextResponse } from "next/server"
import type { SignInRequest } from "@/types"

export async function POST(request: NextRequest) {
  try {
    const body: SignInRequest = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    // In a real application, you would:
    // 1. Hash the password and compare with stored hash
    // 2. Query your database for the user
    // 3. Generate a proper JWT token
    // For demo purposes, we'll use mock authentication
    if (email === "demo@example.com" && password === "password123") {
      const mockToken = `mock-jwt-token-${Date.now()}`
      return NextResponse.json({
        message: "Sign in successful",
        token: mockToken,
        user: {
          id: "user1",
          email: email,
          firstName: "Demo",
          lastName: "User",
        },
      })
    }

    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
  } catch (error) {
    console.error("Sign in error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
