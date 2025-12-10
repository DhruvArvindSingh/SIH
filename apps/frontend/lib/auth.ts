export const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token")
  }
  return null
}

export const isAuthenticated = (): boolean => {
  return getToken() !== null
}

export const logout = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token")
    window.location.href = "/auth/signin"
  }
}

export const verifyToken = async (): Promise<{ isValid: boolean; email?: string }> => {
  const token = getToken()

  if (!token) {
    return { isValid: false }
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/v1/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token })
    })

    const data = await response.json()

    if (response.status === 200 && data.success) {
      return { isValid: true, email: data.data?.email }
    } else {
      // Invalid token or no token provided
      if (typeof window !== "undefined") {
        localStorage.removeItem("token")
      }
      return { isValid: false }
    }
  } catch (error) {
    console.error("Token verification failed:", error)
    return { isValid: false }
  }
}
