"use client"

import Image from "next/image"
import Link from "next/link"
import { Users, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useGroups } from "@/hooks/use-groups"
import { toast } from "@/hooks/use-toast"

interface GroupCardProps {
  group: any // AT Protocol group record
}

export function GroupCard({ group }: GroupCardProps) {
  const { joinGroup } = useGroups()

  // Extract data from AT Protocol record structure
  const groupData = group.value || group
  const groupUri = group.uri || ""
  const groupId = groupUri.split("/").pop() || ""

  // Get group properties with fallbacks
  const name = groupData.name || "Unnamed Group"
  const description = groupData.description || ""
  const privacy = groupData.privacy || "public"
  const image = groupData.image || "/placeholder.svg?height=200&width=300"

  // Use enhanced data from discovery
  const membersCount = group.memberCount || 0
  const isJoined = group.isJoined || false

  // Creator info
  const creatorHandle = group.creatorHandle || "unknown"
  const creatorDisplayName = group.creatorDisplayName || "Unknown User"

  const handleJoin = async () => {
    try {
      await joinGroup(groupUri)
      toast({
        title: "Joined group",
        description: `You have joined ${name}`,
      })
    } catch (error) {
      console.error("Failed to join group:", error)
      toast({
        title: "Failed to join group",
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
            <Badge variant={privacy === "private" ? "secondary" : "default"}>
              {privacy === "private" && <Lock className="h-3 w-3 mr-1" />}
              {privacy}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <h3 className="font-semibold mb-2">{name}</h3>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{description}</p>
        <p className="text-xs text-muted-foreground mb-3">Created by @{creatorHandle}</p>
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="h-4 w-4 mr-1" />
          {membersCount} members
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex space-x-2 w-full">
          {isJoined ? (
            <>
              <Link href={`/groups/${groupUri.split("/").pop()}`} className="flex-1">
                <Button variant="default" className="w-full">
                  View Group
                </Button>
              </Link>
              <Button variant="outline">Joined</Button>
            </>
          ) : (
            <Button className="w-full" onClick={handleJoin}>
              {privacy === "private" ? "Request to Join" : "Join Group"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
