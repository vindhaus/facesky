"use client"

import Image from "next/image"
import Link from "next/link"
import { Users, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { usePages } from "@/hooks/use-pages"
import { toast } from "@/hooks/use-toast"

interface PageCardProps {
  page: any // AT Protocol page record
}

export function PageCard({ page }: PageCardProps) {
  const { followPage } = usePages()

  // Extract data from AT Protocol record structure
  const pageData = page.value || page
  const pageUri = page.uri || ""
  const pageId = pageUri.split("/").pop() || ""

  // Get page properties with fallbacks
  const name = pageData.name || "Unnamed Page"
  const description = pageData.description || ""
  const category = pageData.category || "Uncategorized"
  const image = pageData.image || "/placeholder.svg?height=200&width=300"
  const verified = pageData.verified || false

  // Use enhanced data from discovery
  const followersCount = page.followerCount || 0
  const isFollowing = page.isFollowing || false

  // Creator info
  const creatorHandle = page.creatorHandle || "unknown"
  const creatorDisplayName = page.creatorDisplayName || "Unknown User"

  const handleFollow = async () => {
    try {
      await followPage(pageUri)
      toast({
        title: isFollowing ? "Unfollowed page" : "Following page",
        description: `You are now ${isFollowing ? "no longer following" : "following"} ${name}`,
      })
    } catch (error) {
      console.error("Failed to follow page:", error)
      toast({
        title: "Failed to follow page",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative">
          <Image
            src={image || "/placeholder.svg"}
            alt={name}
            width={300}
            height={200}
            className="w-full h-32 object-cover"
          />
          <div className="absolute top-2 right-2">
            <Badge variant="secondary">{category}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="flex items-center space-x-2 mb-2">
          <h3 className="font-semibold">{name}</h3>
          {verified && <CheckCircle className="h-4 w-4 text-blue-500" />}
        </div>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{description}</p>
        <p className="text-xs text-muted-foreground mb-3">Created by @{creatorHandle}</p>
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="h-4 w-4 mr-1" />
          {followersCount} followers
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex space-x-2 w-full">
          <Link href={`/pages/${pageId}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Page
            </Button>
          </Link>
          <Button variant={isFollowing ? "secondary" : "default"} onClick={handleFollow}>
            {isFollowing ? "Following" : "Follow"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
