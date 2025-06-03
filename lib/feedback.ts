// Simple feedback collection for alpha testing
export class FeedbackCollector {
  static submitFeedback(feedback: {
    type: "bug" | "feature" | "general"
    message: string
    userAgent?: string
    url?: string
    userId?: string
  }) {
    if (typeof window !== "undefined") {
      // For alpha testing, you can:
      // 1. Send to a simple form service like Formspree
      // 2. Use Airtable as a database
      // 3. Send to Discord webhook
      // 4. Use GitHub Issues API

      console.log("Feedback submitted:", feedback)

      // Example: Send to a webhook
      // fetch('YOUR_WEBHOOK_URL', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(feedback)
      // })
    }
  }
}
