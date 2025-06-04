"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"
import { isDemoMode } from "@/lib/mock-data"

export function DemoBanner() {
  if (!isDemoMode()) return null

  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <strong>Demo Mode:</strong> You're viewing mock data since custom AT Protocol record types don't exist yet. In
        the full version, you'll see real groups and pages from other users across the network.
      </AlertDescription>
    </Alert>
  )
}
