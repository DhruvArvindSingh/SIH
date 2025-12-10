"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { verifyToken } from "@/lib/auth"

interface AuthGuardProps {
    children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const router = useRouter()
    const pathname = usePathname()

    // Define public routes that don't require authentication
    const publicRoutes = ['/auth/signin', '/auth/signup']

    // Check if current path is a public route
    const isPublicRoute = publicRoutes.includes(pathname)

    useEffect(() => {
        const checkAuthentication = async () => {
            // If it's a public route, don't verify token
            if (isPublicRoute) {
                setIsAuthenticated(true)
                setIsLoading(false)
                return
            }

            // For protected routes, verify the token
            try {
                const { isValid } = await verifyToken()

                if (isValid) {
                    setIsAuthenticated(true)
                } else {
                    // Token is invalid or doesn't exist, redirect to signup
                    router.push('/auth/signup')
                    return
                }
            } catch (error) {
                console.error("Authentication check failed:", error)
                router.push('/auth/signup')
                return
            } finally {
                setIsLoading(false)
            }
        }

        checkAuthentication()
    }, [pathname, router, isPublicRoute])

    // Show loading spinner while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Verifying authentication...</p>
                </div>
            </div>
        )
    }

    // If authenticated or on public route, render children
    if (isAuthenticated) {
        return <>{children}</>
    }

    // This shouldn't happen as we redirect above, but just in case
    return null
}
