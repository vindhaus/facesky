"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, UserPlus, UserX, Settings, ChevronUp, ChevronDown } from "lucide-react"
import { atGroupsClient } from "@/lib/at-protocol-groups"
import { toast } from "@/hooks/use-toast"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface GroupAdminPanelProps {
  group: any
  onUpdate: () => void
}

export function GroupAdminPanel({ group, onUpdate }: GroupAdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("settings")
  const [loading, setLoading] = useState(false)
  const [newMemberDid, setNewMemberDid] = useState("")
  const [newAdminDid, setNewAdminDid] = useState("")
  const [settings, setSettings] = useState({
    name: group.value.name || "",
    description: group.value.description || "",
    privacy: group.value.privacy || "public",
    rules: group.value.rules || "",
  })

  const handleSettingsUpdate = async () => {
    setLoading(true)
    try {
      await atGroupsClient.updateGroup(group.uri, settings)
      toast({
        title: "Group updated",
        description: "Group settings have been updated successfully.",
      })
      onUpdate()
    } catch (error: any) {
      toast({
        title: "Failed to update group",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddAdmin = async () => {
    if (!newAdminDid.trim()) return

    setLoading(true)
    try {
      await atGroupsClient.addGroupAdmin(group.uri, newAdminDid)
      setNewAdminDid("")
      toast({
        title: "Admin added",
        description: "New admin has been added to the group.",
      })
      onUpdate()
    } catch (error: any) {
      toast({
        title: "Failed to add admin",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberDid: string) => {
    setLoading(true)
    try {
      await atGroupsClient.removeGroupMember(group.uri, memberDid)
      toast({
        title: "Member removed",
        description: "Member has been removed from the group.",
      })
      onUpdate()
    } catch (error: any) {
      toast({
        title: "Failed to remove member",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-6">
      <CollapsibleTrigger asChild>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <CardTitle className="text-lg">Group Admin Panel</CardTitle>
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
            <CardDescription>
              {isOpen ? "Click to hide admin controls" : "Click to show admin controls"}
            </CardDescription>
          </CardHeader>
        </Card>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <Card className="mt-2">
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="admins">Admins</TabsTrigger>
              </TabsList>

              <TabsContent value="settings" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={settings.description}
                    onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="privacy">Privacy</Label>
                  <Select
                    value={settings.privacy}
                    onValueChange={(value: "public" | "private") => setSettings({ ...settings, privacy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rules">Group Rules</Label>
                  <Textarea
                    id="rules"
                    value={settings.rules}
                    onChange={(e) => setSettings({ ...settings, rules: e.target.value })}
                    placeholder="Set rules for your group"
                  />
                </div>
                <Button onClick={handleSettingsUpdate} disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </TabsContent>

              <TabsContent value="members" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Members</Label>
                  <div className="border rounded-md p-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Member management is simplified in this version. In a full implementation, you would see a list of
                      all members here.
                    </p>
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Enter member DID to remove"
                        value={newMemberDid}
                        onChange={(e) => setNewMemberDid(e.target.value)}
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveMember(newMemberDid)}
                        disabled={!newMemberDid.trim() || loading}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="admins" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Current Admins</Label>
                  <div className="border rounded-md p-4">
                    <ul className="space-y-2">
                      {group.value.admins.map((adminDid: string) => (
                        <li key={adminDid} className="text-sm">
                          {adminDid}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Add Admin</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Enter DID of new admin"
                      value={newAdminDid}
                      onChange={(e) => setNewAdminDid(e.target.value)}
                    />
                    <Button onClick={handleAddAdmin} disabled={!newAdminDid.trim() || loading}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Only group admins can see this panel. Changes will be visible to all group members.
            </p>
          </CardFooter>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  )
}
