"use client"

import { useTimeline } from "@/hooks/use-timeline"
import { PostCard } from "@/components/post-card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function Feed() {
  const { posts, loading, error, refresh, loadMore, hasMore } = useTimeline()

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error && posts.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load timeline: {error}
          <Button variant="outline" size="sm" onClick={refresh} className="ml-2">
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {posts.map((feedItem, index) => (
        <PostCard key={`${feedItem.post.uri}-${index}`} post={feedItem.post} />
      ))}

      {hasMore && (
        <div className="flex justify-center py-4">
          <Button onClick={loadMore} disabled={loading} variant="outline">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}
