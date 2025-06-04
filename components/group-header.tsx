"use client"

import Image from "next/image"
import { Users, Bell, Shield, Share, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { atGroupsClient } from "@/lib/at-protocol-groups"
import { toast } from "@/hooks/use-toast"
import { useState } from "react"

interface GroupHeaderProps {
  group: any // AT Protocol group record
  isJoined?: boolean
  isAdmin?: boolean
  memberCount?: number
  onRefresh?: () => void
}

export function GroupHeader({
  group,
  isJoined = false,
  isAdmin = false,
  memberCount = 0,
  onRefresh,
}: GroupHeaderProps) {
  const [joining, setJoining] = useState(false)

  // Extract data from AT Protocol record structure
  const groupData = group.value || group

  // Get group properties with fallbacks
  const name = groupData.name || "Unnamed Group"
  const description = groupData.description || ""
  const privacy = groupData.privacy || "public"
  const image = groupData.image || "/placeholder.svg?height=300&width=800"
  const rules = groupData.rules || ""

  const handleJoin = async () => {
    setJoining(true)
    try {
      await atGroupsClient.joinGroup(group.uri)
      toast({
        title: "Joined group",
        description: `You have joined ${name}`,
      })
      if (onRefresh) onRefresh()
    } catch (error: any) {
      toast({
        title: "Failed to join group",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setJoining(false)
    }
  }

  const handleInvite = () => {
    const groupUrl = `${window.location.origin}/groups/${group.uri.split("/").pop()}`
    navigator.clipboard.writeText(groupUrl)
    toast({
      title: "Link copied!",
      description: "Group link has been copied to your clipboard.",
    })
  }

  const handleShare = () => {
    const groupUrl = `${window.location.origin}/groups/${group.uri.split("/").pop()}`
    if (navigator.share) {
      navigator.share({
        title: `Join ${name} on Facesky`,
        text: `Check out this group: ${name}`,
        url: groupUrl,
      })
    } else {
      navigator.clipboard.writeText(groupUrl)
      toast({
        title: "Link copied!",
        description: "Group link has been copied to your clipboard.",
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
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold">{name}</h1>
            {isAdmin && <Shield className="h-5 w-5 text-yellow-400" title="You are an admin" />}
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary">{privacy}</Badge>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {memberCount} members
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-muted-foreground mb-4">{description}</p>

          {rules && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Group Rules</h3>
              <p className="text-sm whitespace-pre-wrap">{rules}</p>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {!isJoined ? (
            <Button onClick={handleJoin} disabled={joining}>
              {joining ? "Joining..." : "Join Group"}
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleInvite}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
