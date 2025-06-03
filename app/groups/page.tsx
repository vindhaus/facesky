"use client"

import { GroupCard } from "@/components/group-card"
import { CreateGroupDialog } from "@/components/create-group-dialog"
import { useGroups } from "@/hooks/use-groups"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function GroupsPage() {
  const { groups, loading, error, refresh } = useGroups()

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load groups: {error}
            <Button variant="outline" size="sm" onClick={refresh} className="ml-2">
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Groups</h1>
        <CreateGroupDialog />
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No groups found. Create your first group!</p>
          <CreateGroupDialog />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <GroupCard key={group.uri} group={group} />
          ))}
        </div>
      )}
    </div>
  )
}
