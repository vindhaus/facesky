"use client"

import Image from "next/image"
import { Users, MapPin, ExternalLink, CheckCircle, Bell, Share, Shield, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { atGroupsClient } from "@/lib/at-protocol-groups"
import { toast } from "@/hooks/use-toast"
import { useState } from "react"

interface PageHeaderProps {
  page: any // AT Protocol page record
  isFollowing?: boolean
  isAdmin?: boolean
  followerCount?: number
  onRefresh?: () => void
}

export function PageHeader({
  page,
  isFollowing = false,
  isAdmin = false,
  followerCount = 0,
  onRefresh,
}: PageHeaderProps) {
  const [following, setFollowing] = useState(false)

  // Extract data from AT Protocol record structure
  const pageData = page.value || page

  // Get page properties with fallbacks
  const name = pageData.name || "Unnamed Page"
  const description = pageData.description || ""
  const category = pageData.category || "Uncategorized"
  const image = pageData.image || "/placeholder.svg?height=300&width=800"
  const verified = pageData.verified || false
  const website = pageData.website || ""
  const location = pageData.location || ""

  const handleFollow = async () => {
    setFollowing(true)
    try {
      await atGroupsClient.followPage(page.uri)
      toast({
        title: "Following page",
        description: `You are now following ${name}`,
      })
      if (onRefresh) onRefresh()
    } catch (error: any) {
      toast({
        title: "Failed to follow page",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFollowing(false)
    }
  }

  const handleInvite = () => {
    const pageUrl = `${window.location.origin}/pages/${page.uri.split("/").pop()}`
    navigator.clipboard.writeText(pageUrl)
    toast({
      title: "Link copied!",
      description: "Page link has been copied to your clipboard.",
    })
  }

  const handleShare = () => {
    const pageUrl = `${window.location.origin}/pages/${page.uri.split("/").pop()}`
    if (navigator.share) {
      navigator.share({
        title: `Follow ${name} on Facesky`,
        text: `Check out this page: ${name}`,
        url: pageUrl,
      })
    } else {
      navigator.clipboard.writeText(pageUrl)
      toast({
        title: "Link copied!",
        description: "Page link has been copied to your clipboard.",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative rounded-lg overflow-hidden">
        <Image
          src={image || "/placeholder.svg"}
          alt={name}
          width={800}
          height={300}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-4 left-4 text-white">
          <div className="flex items-center space-x-2 mb-2">
            <h1 className="text-3xl font-bold">{name}</h1>
            {verified && <CheckCircle className="h-6 w-6 text-blue-400" />}
            {isAdmin && <Shield className="h-5 w-5 text-yellow-400" title="You are an admin" />}
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary">{category}</Badge>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {followerCount} followers
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <p className="text-muted-foreground">{description}</p>

          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            {location && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {location}
              </div>
            )}
            {website && (
              <div className="flex items-center">
                <ExternalLink className="h-4 w-4 mr-1" />
                <a href={website} className="hover:underline" target="_blank" rel="noopener noreferrer">
                  Website
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isAdmin && (
            <Button
              variant={isFollowing ? "secondary" : "default"}
              onClick={handleFollow}
              disabled={following || isFollowing}
            >
              {isFollowing ? "Following" : following ? "Following..." : "Follow"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleInvite}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          {isFollowing && (
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
