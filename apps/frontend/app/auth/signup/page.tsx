"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface SignUpRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNo: string
}

interface FieldErrors {
  firstName?: string
  lastName?: string
  email?: string
  phoneNo?: string
  password?: string
}

export default function SignUpPage() {
  const [formData, setFormData] = useState<SignUpRequest>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNo: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const router = useRouter()

  const validateFields = (): boolean => {
    const errors: FieldErrors = {}
    let isValid = true

    // Check if firstName is filled
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required"
      isValid = false
    }

    // Check if lastName is filled
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required"
      isValid = false
    }

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

    // Check if phoneNo is filled
    if (!formData.phoneNo.trim()) {
      errors.phoneNo = "Phone number is required"
      isValid = false
    }

    // Check if password is filled and meets minimum requirements
    if (!formData.password.trim()) {
      errors.password = "Password is required"
      isValid = false
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long"
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/v1/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push("/auth/signin")
      } else {
        const errorData = await response.json()

        // Handle specific error codes from backend
        switch (errorData.code) {
          case "DATABASE_UNAVAILABLE":
            setError("Database service unavailable. Please contact administrator.")
            break
          case "MISSING_FIELDS":
            setError("Email, password, firstName, lastName, and phoneNo are required")
            break
          case "EMAIL_EXISTS":
            setError("Email already exists. Please use a different email.")
            break
          case "INTERNAL_ERROR":
            setError("Signup failed. Please try again later.")
            break
          default:
            setError(errorData.error || errorData.message || "Sign up failed")
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
          <CardTitle className="text-2xl font-bold">Sign Up</CardTitle>
          <CardDescription>Create your civic reporting account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
                {fieldErrors.firstName && <div className="text-destructive text-sm">{fieldErrors.firstName}</div>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
                {fieldErrors.lastName && <div className="text-destructive text-sm">{fieldErrors.lastName}</div>}
              </div>
            </div>
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
              <Label htmlFor="phoneNo">Phone Number</Label>
              <Input
                id="phoneNo"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phoneNo}
                onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
                required
              />
              {fieldErrors.phoneNo && <div className="text-destructive text-sm">{fieldErrors.phoneNo}</div>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              {fieldErrors.password && <div className="text-destructive text-sm">{fieldErrors.password}</div>}
            </div>
            {error && <div className="text-destructive text-sm">{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
