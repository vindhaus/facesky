"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Heart, MessageCircle, Share, MoreHorizontal, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { GroupPageCommentSection } from "@/components/group-page-comment-section"
import { atClient } from "@/lib/at-protocol"
import { atGroupsClient } from "@/lib/at-protocol-groups"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

interface PostCardProps {
  post: any // AT Protocol post object or mock post
  showReplies?: boolean // Whether to show nested replies
  onRefresh?: () => void
}

export function PostCard({ post, showReplies = false, onRefresh }: PostCardProps) {
  // Handle both real AT Protocol posts and mock posts
  const isRealPost = post.uri && post.cid
  const postData = isRealPost ? post : post
  const postRecord = isRealPost ? post.record : { text: post.content || "" }
  const postAuthor = isRealPost ? post.author : post.author

  const [liked, setLiked] = useState(isRealPost ? !!post.viewer?.like : false)
  const [reposted, setReposted] = useState(isRealPost ? !!post.viewer?.repost : false)
  const [showComments, setShowComments] = useState(false)
  const [comment, setComment] = useState("")
  const [likeCount, setLikeCount] = useState(isRealPost ? post.likeCount || 0 : post.likes || 0)
  const [replyCount, setReplyCount] = useState(isRealPost ? post.replyCount || 0 : 0)
  const [repostCount, setRepostCount] = useState(isRealPost ? post.repostCount || 0 : post.shares || 0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replies, setReplies] = useState<any[]>([])
  const [loadingReplies, setLoadingReplies] = useState(false)
  const { user } = useAuth()

  // Check if this is a group or page post
  const isGroupPost = post.value && post.value.groupUri
  const isPagePost = post.value && post.value.pageUri

  // Load replies if this is a real post and showReplies is true
  useEffect(() => {
    if (isRealPost && showReplies && !isGroupPost && !isPagePost) {
      loadReplies()
    }
  }, [isRealPost, showReplies, post.uri])

  const loadReplies = async () => {
    if (!isRealPost) return

    setLoadingReplies(true)
    try {
      const thread = await atClient.getPostThread(post.uri)
      if (thread.thread.replies) {
        setReplies(thread.thread.replies)
        setReplyCount(thread.thread.replies.length)
      }
    } catch (error) {
      console.error("Failed to load replies:", error)
    } finally {
      setLoadingReplies(false)
    }
  }

  // Update reply count when comments are loaded
  const handleCommentCountUpdate = (count: number) => {
    setReplyCount(count)
  }

  const handleLike = async () => {
    if (!isRealPost) return // Don't allow interactions on mock posts

    try {
      if (liked) {
        // Unlike logic would go here (requires tracking like URI)
        setLiked(false)
        setLikeCount((prev) => prev - 1)
      } else {
        await atClient.likePost(post.uri, post.cid)
        setLiked(true)
        setLikeCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Failed to like post:", error)
      toast({
        title: "Action failed",
        description: "Could not like the post. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRepost = async () => {
    if (!isRealPost) return // Don't allow interactions on mock posts

    try {
      if (!reposted) {
        await atClient.repost(post.uri, post.cid)
        setReposted(true)
        setRepostCount((prev) => prev + 1)
        toast({
          title: "Post shared",
          description: "You've reposted this content to your followers.",
        })
      }
    } catch (error) {
      console.error("Failed to repost:", error)
      toast({
        title: "Action failed",
        description: "Could not share the post. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleComment = async () => {
    if (!comment.trim()) return

    setIsSubmitting(true)
    try {
      if (isGroupPost) {
        // Comment on group post
        await atGroupsClient.commentOnGroupPost(post.uri, comment)
      } else if (isPagePost) {
        // Comment on page post
        await atGroupsClient.commentOnPagePost(post.uri, comment)
      } else if (isRealPost) {
        // Comment on regular post
        await atClient.reply(comment, post.uri, post.cid)
      }

      setComment("")
      setReplyCount((prev) => prev + 1)
      setShowComments(true) // Show comments after posting

      // Refresh replies for real posts
      if (isRealPost && showReplies) {
        await loadReplies()
      }

      // Refresh the post data if a callback was provided
      if (onRefresh) {
        onRefresh()
      }

      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully.",
      })
    } catch (error: any) {
      console.error("Failed to comment:", error)
      toast({
        title: "Comment failed",
        description: error.message || "Could not post your comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "now"

    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "now"
    if (diffInHours < 24) return `${diffInHours}h`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`
    return date.toLocaleDateString()
  }

  const getDisplayName = (author: any) => {
    return author?.displayName || author?.name || author?.handle || "Unknown"
  }

  const getHandle = (author: any) => {
    const handle = author?.handle || ""
    return handle.startsWith("@") ? handle : `@${handle}`
  }

  const getPostText = () => {
    return postRecord?.text || post?.content || post?.value?.text || ""
  }

  const getTimestamp = () => {
    return isRealPost ? post.indexedAt : post.timestamp || post.value?.createdAt
  }

  const renderReply = (reply: any, depth = 0) => {
    if (!reply.post) return null

    return (
      <div key={reply.post.uri} className={`mt-4 ${depth > 0 ? "ml-8" : "ml-4"} border-l-2 border-muted pl-4`}>
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={reply.post.author.avatar || "/placeholder.svg"}
              alt={reply.post.author.displayName || reply.post.author.handle}
            />
            <AvatarFallback>
              {(reply.post.author.displayName || reply.post.author.handle)
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-semibold text-sm">
                  {reply.post.author.displayName || reply.post.author.handle}
                </span>
                <span className="text-xs text-muted-foreground">{formatDate(reply.post.indexedAt)}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{reply.post.record.text}</p>
            </div>
            <div className="flex items-center space-x-4 px-3">
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <Heart className="h-3 w-3 mr-1" />
                {reply.post.likeCount || 0}
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <MessageCircle className="h-3 w-3 mr-1" />
                Reply
              </Button>
            </div>
          </div>
        </div>

        {reply.replies?.map((nestedReply: any) => renderReply(nestedReply, depth + 1))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={postAuthor?.avatar || "/placeholder.svg"} alt={getDisplayName(postAuthor)} />
              <AvatarFallback>
                {getDisplayName(postAuthor)
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{getDisplayName(postAuthor)}</p>
              <p className="text-sm text-muted-foreground">
                {getHandle(postAuthor)} • {formatDate(getTimestamp())}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Copy link</DropdownMenuItem>
              <DropdownMenuItem>Report post</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{getPostText()}</p>

        {/* Handle both real AT Protocol embeds and mock images */}
        {((isRealPost && post.embed?.images) || (!isRealPost && post.images)) && (
          <div className="grid gap-2">
            {(isRealPost ? post.embed.images : post.images).map((image: any, index: number) => (
              <div key={index} className="relative rounded-lg overflow-hidden">
                <Image
                  src={isRealPost ? image.fullsize || "/placeholder.svg" : image || "/placeholder.svg"}
                  alt={isRealPost ? image.alt || "Post image" : "Post image"}
                  width={600}
                  height={400}
                  className="w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* For group/page posts, show context */}
        {(isGroupPost || isPagePost) && (
          <div className="text-xs text-muted-foreground">
            Posted in {isGroupPost ? "group" : "page"}: {isGroupPost ? post.groupName : post.pageName}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={liked ? "text-red-500" : ""}
              disabled={!isRealPost}
            >
              <Heart className={`h-4 w-4 mr-1 ${liked ? "fill-current" : ""}`} />
              {likeCount}
            </Button>

            <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
              <MessageCircle className="h-4 w-4 mr-1" />
              {replyCount}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRepost}
              className={reposted ? "text-green-500" : ""}
              disabled={!isRealPost}
            >
              <Share className="h-4 w-4 mr-1" />
              {repostCount}
            </Button>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.displayName || user?.handle} />
            <AvatarFallback>{user?.displayName?.[0] || user?.handle?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[60px] resize-none"
            />
            <Button size="sm" disabled={!comment.trim() || isSubmitting} onClick={handleComment}>
              {isSubmitting ? "Posting..." : "Comment"}
            </Button>
          </div>
        </div>

        {/* Show nested replies for real posts */}
        {showReplies && isRealPost && !isGroupPost && !isPagePost && (
          <div className="space-y-2">
            {loadingReplies ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              replies.map((reply: any) => renderReply(reply))
            )}
          </div>
        )}

        {/* Show comments for group/page posts */}
        {showComments && (isGroupPost || isPagePost) && (
          <GroupPageCommentSection
            postUri={post.uri}
            isGroupPost={isGroupPost}
            isPagePost={isPagePost}
            onRefresh={onRefresh}
            onCommentCountUpdate={handleCommentCountUpdate}
          />
        )}
      </CardContent>
    </Card>
  )
}
