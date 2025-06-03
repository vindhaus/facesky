"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { atClient } from "@/lib/at-protocol"

interface AuthContextType {
  user: any | null
  login: (identifier: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        const restored = await atClient.restoreSession()
        if (restored) {
          const session = atClient.getSession()
          setUser(session)
        }
      } catch (error) {
        console.error("Failed to restore session:", error)
        // Clear any invalid session data
        localStorage.removeItem("at-session")
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = async (identifier: string, password: string) => {
    setIsLoading(true)
    try {
      const session = await atClient.login(identifier, password)
      setUser(session)
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await atClient.logout()
      setUser(null)
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
