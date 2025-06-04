"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { PagePostForm } from "@/components/page-post-form"
import { PostCard } from "@/components/post-card"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePagePosts, usePageDetails } from "@/hooks/use-pages"
import { PageAdminPanel } from "@/components/page-admin-panel"

export default function PageDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { isAuthenticated } = useAuth()
  const [pageUri, setPageUri] = useState<string>("")

  // Set up the page URI once we have the authenticated user's DID
  useEffect(() => {
    if (isAuthenticated && id) {
      // Since we're using regular posts, the URI should be a post URI, not a custom collection
      // The id parameter should be the rkey from the post URI
      const userDid = localStorage.getItem("at-session")
        ? JSON.parse(localStorage.getItem("at-session") || "{}").did
        : ""

      if (userDid) {
        // Construct the actual post URI using the standard post collection
        setPageUri(`at://${userDid}/app.bsky.feed.post/${id}`)
      }
    }
  }, [isAuthenticated, id])

  const {
    page,
    isFollowing,
    isAdmin,
    loading: pageLoading,
    error: pageError,
    refresh: refreshPage,
  } = usePageDetails(pageUri)

  const { posts, loading: postsLoading, error: postsError, refresh: refreshPosts } = usePagePosts(pageUri)

  if (!isAuthenticated) {
    return <div className="max-w-4xl mx-auto p-4">Please log in to view pages.</div>
  }

  if (pageLoading || !pageUri) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (pageError || !page) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>{pageError || "Page not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleRefresh = () => {
    refreshPage()
    refreshPosts()
  }

  const pageName = page.value?.name || "Page"
  const pageImage = page.value?.image

  return (
    <div className="max-w-4xl mx-auto p-4">
      <PageHeader
        page={page}
        isFollowing={isFollowing}
        isAdmin={isAdmin}
        followerCount={page.followerCount || 0}
        onRefresh={handleRefresh}
      />

      {isAdmin && <PageAdminPanel page={page} onUpdate={handleRefresh} />}

      <div className="mt-6 max-w-2xl mx-auto space-y-6">
        {isAdmin && <PagePostForm pageUri={pageUri} pageName={pageName} pageImage={pageImage} />}

        {postsLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : postsError ? (
          <Alert variant="destructive">
            <AlertDescription>{postsError}</AlertDescription>
          </Alert>
        ) : posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No posts from this page yet.</div>
        ) : (
          posts.map((post: any, index: number) => (
            <PostCard key={`${post.uri || post.id || index}`} post={post} onRefresh={refreshPosts} />
          ))
        )}
      </div>
    </div>
  )
}
