"use client"

import { PageCard } from "@/components/page-card"
import { CreatePageDialog } from "@/components/create-page-dialog"
import { usePages } from "@/hooks/use-pages"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function PagesPage() {
  const { pages, loading, error, refresh } = usePages()

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
            Failed to load pages: {error}
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
        <h1 className="text-2xl font-bold">Pages</h1>
        <CreatePageDialog />
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No pages found. Create your first page!</p>
          <CreatePageDialog />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map((page) => (
            <PageCard key={page.uri} page={page} />
          ))}
        </div>
      )}
    </div>
  )
}
