"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { GroupHeader } from "@/components/group-header"
import { GroupPostForm } from "@/components/group-post-form"
import { PostCard } from "@/components/post-card"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useGroupPosts, useGroupDetails } from "@/hooks/use-groups"
import { GroupAdminPanel } from "@/components/group-admin-panel"

export default function GroupPage() {
  const params = useParams()
  const id = params.id as string
  const { isAuthenticated } = useAuth()
  const [groupUri, setGroupUri] = useState<string>("")

  // Set up the group URI once we have the authenticated user's DID
  useEffect(() => {
    if (isAuthenticated && id) {
      // This is a simplified approach - in a real app, you'd need to look up the full URI
      const userDid = localStorage.getItem("at-session")
        ? JSON.parse(localStorage.getItem("at-session") || "{}").did
        : ""

      if (userDid) {
        setGroupUri(`at://${userDid}/app.atsocial.group/${id}`)
      }
    }
  }, [isAuthenticated, id])

  const {
    group,
    isJoined,
    isAdmin,
    loading: groupLoading,
    error: groupError,
    refresh: refreshGroup,
  } = useGroupDetails(groupUri)

  const { posts, loading: postsLoading, error: postsError, refresh: refreshPosts } = useGroupPosts(groupUri)

  if (!isAuthenticated) {
    return <div className="max-w-4xl mx-auto p-4">Please log in to view groups.</div>
  }

  if (groupLoading || !groupUri) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (groupError || !group) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>{groupError || "Group not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleRefresh = () => {
    refreshGroup()
    refreshPosts()
  }

  const groupName = group.value?.name || "Group"

  return (
    <div className="max-w-4xl mx-auto p-4">
      <GroupHeader
        group={group}
        isJoined={isJoined}
        isAdmin={isAdmin}
        memberCount={group.memberCount || 0}
        onRefresh={handleRefresh}
      />

      {isAdmin && <GroupAdminPanel group={group} onUpdate={handleRefresh} />}

      <div className="mt-6 max-w-2xl mx-auto space-y-6">
        {isJoined && <GroupPostForm groupUri={groupUri} groupName={groupName} />}

        {postsLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : postsError ? (
          <Alert variant="destructive">
            <AlertDescription>{postsError}</AlertDescription>
          </Alert>
        ) : posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No posts in this group yet. {isJoined ? "Be the first to post!" : "Join the group to post!"}
          </div>
        ) : (
          posts.map((post: any, index: number) => (
            <PostCard key={`${post.uri || post.id || index}`} post={post} onRefresh={refreshPosts} />
          ))
        )}
      </div>
    </div>
  )
}
