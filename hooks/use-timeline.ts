"use client"

import { useState, useEffect } from "react"
import { atClient } from "@/lib/at-protocol"
import { useAuth } from "@/contexts/auth-context"

export function useTimeline() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | undefined>()
  const { isAuthenticated, user } = useAuth()

  const fetchTimeline = async (refresh = false) => {
    if (!isAuthenticated || !user) {
      setError("Not authenticated")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await atClient.getTimeline(50, refresh ? undefined : cursor)

      if (refresh) {
        setPosts(response.feed)
      } else {
        setPosts((prev) => [...prev, ...response.feed])
      }

      setCursor(response.cursor)
    } catch (err: any) {
      console.error("Timeline fetch error:", err)

      // Handle authentication errors
      if (err.message?.includes("Authentication") || err.status === 401) {
        setError("Session expired. Please log in again.")
      } else {
        setError(err.message || "Failed to fetch timeline")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTimeline(true)
    } else {
      setPosts([])
      setLoading(false)
    }
  }, [isAuthenticated, user])

  const refresh = () => fetchTimeline(true)
  const loadMore = () => fetchTimeline(false)

  return {
    posts,
    loading,
    error,
    refresh,
    loadMore,
    hasMore: !!cursor,
  }
}
