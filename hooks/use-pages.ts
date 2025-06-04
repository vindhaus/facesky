"use client"

import { useState, useEffect, useCallback } from "react"
import { atGroupsClient } from "@/lib/at-protocol-groups"
import { atDiscoveryClient } from "@/lib/at-protocol-discovery"
import { useAuth } from "@/contexts/auth-context"

export function usePages() {
  const [pages, setPages] = useState<any[]>([])
  const [userFollows, setUserFollows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()

  const fetchPages = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      setLoading(true)
      setError(null)

      // Fetch pages from across the network, not just current user
      const [networkPages, followsData] = await Promise.all([
        atDiscoveryClient.discoverPagesAcrossNetwork(),
        atGroupsClient.getUserPageFollows(),
      ])

      // Enhance pages with follower counts and user follow status
      const enhancedPages = await Promise.all(
        networkPages.map(async (page) => {
          const [followerCount, isFollowing, isAdmin] = await Promise.all([
            atDiscoveryClient.getPageFollowersCount(page.uri),
            atDiscoveryClient.isUserFollowingPage(page.uri),
            atGroupsClient.isUserPageAdmin(page.uri),
          ])

          return {
            ...page,
            followerCount,
            isFollowing,
            isAdmin,
          }
        }),
      )

      setPages(enhancedPages)
      setUserFollows(followsData)
    } catch (err: any) {
      setError(err.message || "Failed to fetch pages")
      console.error("Pages fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      fetchPages()
    }
  }, [isAuthenticated, fetchPages])

  const createPage = async (pageData: any) => {
    try {
      const result = await atGroupsClient.createPage(pageData)
      await fetchPages() // Refresh the list immediately
      return result
    } catch (error) {
      console.error("Failed to create page:", error)
      throw error
    }
  }

  const followPage = async (pageUri: string) => {
    try {
      const result = await atGroupsClient.followPage(pageUri)
      await fetchPages() // Refresh the list immediately
      return result
    } catch (error) {
      console.error("Failed to follow page:", error)
      throw error
    }
  }

  const searchPages = async (query: string) => {
    try {
      return await atDiscoveryClient.searchPages(query)
    } catch (error) {
      console.error("Failed to search pages:", error)
      return []
    }
  }

  return {
    pages,
    userFollows,
    loading,
    error,
    createPage,
    followPage,
    searchPages,
    refresh: fetchPages,
  }
}

export function usePagePosts(pageUri: string) {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()

  const fetchPosts = useCallback(async () => {
    if (!isAuthenticated || !pageUri) return

    try {
      setLoading(true)
      setError(null)

      // Fetch posts from across the network, not just current user
      const postsData = await atDiscoveryClient.getPagePostsAcrossNetwork(pageUri)
      setPosts(postsData)
    } catch (err: any) {
      setError(err.message || "Failed to fetch page posts")
      console.error("Page posts fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, pageUri])

  useEffect(() => {
    if (isAuthenticated && pageUri) {
      fetchPosts()
    }
  }, [isAuthenticated, pageUri, fetchPosts])

  const postToPage = async (text: string, images?: File[]) => {
    try {
      const result = await atGroupsClient.postToPage(pageUri, text, images)
      await fetchPosts() // Refresh posts immediately
      return result
    } catch (error) {
      console.error("Failed to post to page:", error)
      throw error
    }
  }

  return {
    posts,
    loading,
    error,
    postToPage,
    refresh: fetchPosts,
  }
}

export function usePageDetails(pageUri: string) {
  const [page, setPage] = useState<any>(null)
  const [followerCount, setFollowerCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()

  const fetchPageDetails = useCallback(async () => {
    if (!isAuthenticated || !pageUri) return

    try {
      setLoading(true)
      setError(null)

      const [pageData, followerCountData, isFollowingData, isAdminData] = await Promise.all([
        atGroupsClient.getPage(pageUri),
        atDiscoveryClient.getPageFollowersCount(pageUri),
        atDiscoveryClient.isUserFollowingPage(pageUri),
        atGroupsClient.isUserPageAdmin(pageUri),
      ])

      setPage(pageData)
      setFollowerCount(followerCountData)
      setIsFollowing(isFollowingData)
      setIsAdmin(isAdminData)
    } catch (err: any) {
      setError(err.message || "Failed to fetch page details")
      console.error("Page details fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [pageUri, isAuthenticated])

  useEffect(() => {
    fetchPageDetails()
  }, [fetchPageDetails])

  return {
    page,
    followerCount,
    isFollowing,
    isAdmin,
    loading,
    error,
    refresh: fetchPageDetails,
  }
}
