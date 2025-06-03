"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, UserPlus, Settings, ChevronUp, ChevronDown } from "lucide-react"
import { atGroupsClient } from "@/lib/at-protocol-groups"
import { toast } from "@/hooks/use-toast"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const PAGE_CATEGORIES = [
  "Business",
  "Technology",
  "Entertainment",
  "Food & Beverage",
  "Arts & Culture",
  "Sports",
  "Education",
  "Non-profit",
  "Government",
  "Other",
]

interface PageAdminPanelProps {
  page: any
  onUpdate: () => void
}

export function PageAdminPanel({ page, onUpdate }: PageAdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("settings")
  const [loading, setLoading] = useState(false)
  const [newAdminDid, setNewAdminDid] = useState("")
  const [settings, setSettings] = useState({
    name: page.value.name || "",
    description: page.value.description || "",
    category: page.value.category || "",
    website: page.value.website || "",
    location: page.value.location || "",
  })

  const handleSettingsUpdate = async () => {
    setLoading(true)
    try {
      await atGroupsClient.updatePage(page.uri, settings)
      toast({
        title: "Page updated",
        description: "Page settings have been updated successfully.",
      })
      onUpdate()
    } catch (error: any) {
      toast({
        title: "Failed to update page",
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
      await atGroupsClient.addPageAdmin(page.uri, newAdminDid)
      setNewAdminDid("")
      toast({
        title: "Admin added",
        description: "New admin has been added to the page.",
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

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-6">
      <CollapsibleTrigger asChild>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <CardTitle className="text-lg">Page Admin Panel</CardTitle>
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
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="admins">Admins</TabsTrigger>
              </TabsList>

              <TabsContent value="settings" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Page Name</Label>
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
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={settings.category}
                    onValueChange={(value) => setSettings({ ...settings, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={settings.website}
                    onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={settings.location}
                    onChange={(e) => setSettings({ ...settings, location: e.target.value })}
                    placeholder="City, State"
                  />
                </div>
                <Button onClick={handleSettingsUpdate} disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </TabsContent>

              <TabsContent value="admins" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Current Admins</Label>
                  <div className="border rounded-md p-4">
                    <ul className="space-y-2">
                      {page.value.admins.map((adminDid: string) => (
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
              Only page admins can see this panel. Changes will be visible to all page followers.
            </p>
          </CardFooter>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  )
}
