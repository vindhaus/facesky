"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Loader2, RefreshCw } from "lucide-react"
import { atGroupsClient } from "@/lib/at-protocol-groups"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GroupPageCommentSectionProps {
  postUri: string
  isGroupPost?: boolean
  isPagePost?: boolean
  onRefresh?: () => void
  onCommentCountUpdate?: (count: number) => void
}

export function GroupPageCommentSection({
  postUri,
  isGroupPost = false,
  isPagePost = false,
  onRefresh,
  onCommentCountUpdate,
}: GroupPageCommentSectionProps) {
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchComments = async () => {
    try {
      setLoading(true)
      setError(null)

      let commentsData: any[] = []
      if (isGroupPost) {
        commentsData = await atGroupsClient.getGroupPostComments(postUri)
      } else if (isPagePost) {
        commentsData = await atGroupsClient.getPagePostComments(postUri)
      }

      setComments(commentsData)

      // Update the comment count in the parent component
      if (onCommentCountUpdate) {
        onCommentCountUpdate(commentsData.length)
      }
    } catch (err: any) {
      console.error("Failed to fetch comments:", err)
      setError(err.message || "Failed to load comments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [postUri, isGroupPost, isPagePost])

  // Auto-refresh comments when onRefresh is called
  useEffect(() => {
    if (onRefresh) {
      fetchComments()
    }
  }, [onRefresh])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-2">
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to load comments: {error}</span>
          <Button variant="outline" size="sm" onClick={fetchComments}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (comments.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No comments yet</div>
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "now"
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  const renderComment = (comment: any, depth = 0) => {
    return (
      <div key={comment.uri} className={`space-y-3 ${depth > 0 ? "ml-11" : ""}`}>
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={comment.author.avatar || "/placeholder.svg"}
              alt={comment.author.displayName || comment.author.handle}
            />
            <AvatarFallback>
              {(comment.author.displayName || comment.author.handle)
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-semibold text-sm">{comment.author.displayName || comment.author.handle}</span>
                <span className="text-xs text-muted-foreground">{formatDate(comment.value.createdAt)}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{comment.value.text}</p>
            </div>
            <div className="flex items-center space-x-4 px-3">
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <Heart className="h-3 w-3 mr-1" />0
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <MessageCircle className="h-3 w-3 mr-1" />
                Reply
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-4 border-t">
      {comments.map((comment: any) => renderComment(comment))}
      {comments.length > 0 && (
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={fetchComments}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh Comments
          </Button>
        </div>
      )}
    </div>
  )
}
