"use client"

import { useAuth } from "@/contexts/auth-context"
import { LoginForm } from "@/components/login-form"
import { Feed } from "@/components/feed"
import { CreatePost } from "@/components/create-post"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginForm />
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <CreatePost />
      <Feed />
    </div>
  )
}
