"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MessageSquare, Send } from "lucide-react"
import { FeedbackCollector } from "@/lib/feedback"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

export function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<"bug" | "feature" | "general">("general")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()

  const handleSubmit = async () => {
    if (!message.trim()) return

    setSubmitting(true)
    try {
      FeedbackCollector.submitFeedback({
        type,
        message,
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: user?.did || "anonymous",
      })

      toast({
        title: "Feedback sent!",
        description: "Thank you for helping improve Facesky.",
      })

      setMessage("")
      setOpen(false)
    } catch (error) {
      toast({
        title: "Failed to send feedback",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="fixed bottom-4 right-4 z-50 shadow-lg">
          <MessageSquare className="h-4 w-4 mr-2" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve Facesky! Report bugs, suggest features, or share your thoughts.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Select value={type} onValueChange={(value: any) => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">🐛 Bug Report</SelectItem>
                <SelectItem value="feature">💡 Feature Request</SelectItem>
                <SelectItem value="general">💬 General Feedback</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Describe your feedback..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!message.trim() || submitting}>
            <Send className="h-4 w-4 mr-2" />
            {submitting ? "Sending..." : "Send Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
