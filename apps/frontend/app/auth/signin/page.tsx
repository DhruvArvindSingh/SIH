"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface SignInRequest {
  email: string
  password: string
}

interface FieldErrors {
  email?: string
  password?: string
}

interface ApiError {
  success: boolean
  error: string
  code: string
}

interface ApiSuccess {
  success: true
  message: string
  data: {
    token: string
    email: string
  }
}

export default function SignInPage() {
  const [formData, setFormData] = useState<SignInRequest>({
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const router = useRouter()

  const validateFields = (): boolean => {
    const errors: FieldErrors = {}
    let isValid = true

    // Check if email is filled and valid
    if (!formData.email.trim()) {
      errors.email = "Email is required"
      isValid = false
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        errors.email = "Please enter a valid email address"
        isValid = false
      }
    }

    // Check if password is filled
    if (!formData.password.trim()) {
      errors.password = "Password is required"
      isValid = false
    }

    setFieldErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setFieldErrors({})

    // Validate all fields before submitting
    if (!validateFields()) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/v1/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data: ApiSuccess = await response.json()
        localStorage.setItem("token", data.data.token)
        router.push("/main")
      } else {
        const errorData: ApiError = await response.json()

        // Handle specific error codes from backend
        switch (errorData.code) {
          case "MISSING_FIELDS":
            setError("Email and password are required")
            break
          case "INVALID_CREDENTIALS":
            setError("Invalid email or password")
            break
          case "DATABASE_UNAVAILABLE":
            setError("Database service unavailable. Please contact administrator.")
            break
          case "INTERNAL_ERROR":
            setError("Signin failed. Please try again later.")
            break
          default:
            setError(errorData.error || "Sign in failed")
        }
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>Access your civic reporting account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              {fieldErrors.email && <div className="text-destructive text-sm">{fieldErrors.email}</div>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              {fieldErrors.password && <div className="text-destructive text-sm">{fieldErrors.password}</div>}
            </div>
            {error && <div className="text-destructive text-sm">{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
