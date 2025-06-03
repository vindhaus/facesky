"use client"

import type React from "react"

import { useState } from "react"
import { ImageIcon, X, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { usePagePosts } from "@/hooks/use-pages"

interface PagePostFormProps {
  pageUri: string
  pageName: string
  pageImage?: string
}

export function PagePostForm({ pageUri, pageName, pageImage }: PagePostFormProps) {
  const [content, setContent] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [isPosting, setIsPosting] = useState(false)
  const { postToPage } = usePagePosts(pageUri)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setAttachments((prev) => [...prev, ...files].slice(0, 4)) // Max 4 images
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePost = async () => {
    if (!content.trim() && attachments.length === 0) return

    setIsPosting(true)
    try {
      await postToPage(content, attachments)
      setContent("")
      setAttachments([])
      toast({
        title: "Post created",
        description: `Your post has been shared as ${pageName}.`,
      })
    } catch (error: any) {
      console.error("Failed to post as page:", error)
      toast({
        title: "Failed to post",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar>
            <AvatarImage src={pageImage || "/placeholder.svg"} alt={pageName} />
            <AvatarFallback>{pageName[0] || "P"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="font-medium">{pageName}</span>
              <span className="text-xs text-muted-foreground">Posting as Page</span>
            </div>
            <Textarea
              placeholder={`Write something as ${pageName}...`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none border-none shadow-none text-lg placeholder:text-muted-foreground"
              maxLength={300}
            />

            {attachments.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {attachments.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file) || "/placeholder.svg"}
                      alt={`Attachment ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center space-x-2">
                <label htmlFor="page-image-upload">
                  <Button variant="ghost" size="sm" asChild>
                    <span>
                      <ImageIcon className="h-4 w-4 mr-1" />
                      Photo
                    </span>
                  </Button>
                </label>
                <input
                  id="page-image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">{content.length}/300</span>
                <Button disabled={(!content.trim() && attachments.length === 0) || isPosting} onClick={handlePost}>
                  {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Post as Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
