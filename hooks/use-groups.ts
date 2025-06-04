"use client"

import { useState, useEffect, useCallback } from "react"
import { atGroupsClient } from "@/lib/at-protocol-groups"
import { atDiscoveryClient } from "@/lib/at-protocol-discovery"
import { useAuth } from "@/contexts/auth-context"

export function useGroups() {
  const [groups, setGroups] = useState<any[]>([])
  const [userMemberships, setUserMemberships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()

  const fetchGroups = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      setLoading(true)
      setError(null)

      // Fetch groups from across the network, not just current user
      const [networkGroups, membershipsData] = await Promise.all([
        atDiscoveryClient.discoverGroupsAcrossNetwork(),
        atGroupsClient.getUserMemberships(),
      ])

      // Enhance groups with membership counts and user membership status
      const enhancedGroups = await Promise.all(
        networkGroups.map(async (group) => {
          const [memberCount, isJoined, isAdmin] = await Promise.all([
            atDiscoveryClient.getGroupMembersCount(group.uri),
            atDiscoveryClient.isUserMemberOfGroup(group.uri),
            atGroupsClient.isUserGroupAdmin(group.uri),
          ])

          return {
            ...group,
            memberCount,
            isJoined,
            isAdmin,
          }
        }),
      )

      setGroups(enhancedGroups)
      setUserMemberships(membershipsData)
    } catch (err: any) {
      setError(err.message || "Failed to fetch groups")
      console.error("Groups fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      fetchGroups()
    }
  }, [isAuthenticated, fetchGroups])

  const createGroup = async (groupData: any) => {
    try {
      const result = await atGroupsClient.createGroup(groupData)

      // Automatically join the group as admin after creating it
      await atGroupsClient.joinGroup(result.uri, "admin")

      await fetchGroups() // Refresh the list
      return result
    } catch (error) {
      console.error("Failed to create group:", error)
      throw error
    }
  }

  const joinGroup = async (groupUri: string) => {
    try {
      const result = await atGroupsClient.joinGroup(groupUri)
      await fetchGroups() // Refresh the list immediately
      return result
    } catch (error) {
      console.error("Failed to join group:", error)
      throw error
    }
  }

  const searchGroups = async (query: string) => {
    try {
      return await atDiscoveryClient.searchGroups(query)
    } catch (error) {
      console.error("Failed to search groups:", error)
      return []
    }
  }

  return {
    groups,
    userMemberships,
    loading,
    error,
    createGroup,
    joinGroup,
    searchGroups,
    refresh: fetchGroups,
  }
}

export function useGroupPosts(groupUri: string) {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()

  const fetchPosts = useCallback(async () => {
    if (!isAuthenticated || !groupUri) return

    try {
      setLoading(true)
      setError(null)

      // Fetch posts from across the network, not just current user
      const postsData = await atDiscoveryClient.getGroupPostsAcrossNetwork(groupUri)
      setPosts(postsData)
    } catch (err: any) {
      setError(err.message || "Failed to fetch group posts")
      console.error("Group posts fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, groupUri])

  useEffect(() => {
    if (isAuthenticated && groupUri) {
      fetchPosts()
    }
  }, [isAuthenticated, groupUri, fetchPosts])

  const postToGroup = async (text: string, images?: File[]) => {
    try {
      const result = await atGroupsClient.postToGroup(groupUri, text, images)
      await fetchPosts() // Refresh posts immediately
      return result
    } catch (error) {
      console.error("Failed to post to group:", error)
      throw error
    }
  }

  return {
    posts,
    loading,
    error,
    postToGroup,
    refresh: fetchPosts,
  }
}

export function useGroupDetails(groupUri: string) {
  const [group, setGroup] = useState<any>(null)
  const [memberCount, setMemberCount] = useState(0)
  const [isJoined, setIsJoined] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()

  const fetchGroupDetails = useCallback(async () => {
    if (!isAuthenticated || !groupUri) return

    try {
      setLoading(true)
      setError(null)

      const [groupData, memberCountData, isJoinedData, isAdminData] = await Promise.all([
        atGroupsClient.getGroup(groupUri),
        atDiscoveryClient.getGroupMembersCount(groupUri),
        atDiscoveryClient.isUserMemberOfGroup(groupUri),
        atGroupsClient.isUserGroupAdmin(groupUri),
      ])

      setGroup(groupData)
      setMemberCount(memberCountData)
      setIsJoined(isJoinedData)
      setIsAdmin(isAdminData)
    } catch (err: any) {
      setError(err.message || "Failed to fetch group details")
      console.error("Group details fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [groupUri, isAuthenticated])

  useEffect(() => {
    fetchGroupDetails()
  }, [fetchGroupDetails])

  return {
    group,
    memberCount,
    isJoined,
    isAdmin,
    loading,
    error,
    refresh: fetchGroupDetails,
  }
}
