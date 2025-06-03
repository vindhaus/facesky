// Simple analytics for alpha testing
export class Analytics {
  static track(event: string, properties?: Record<string, any>) {
    if (typeof window !== "undefined") {
      console.log("Analytics:", event, properties)

      // You can integrate with services like:
      // - Google Analytics
      // - Mixpanel
      // - PostHog
      // - Plausible

      // For now, we'll just log to console
      // In production, replace with your analytics service
    }
  }

  static identify(userId: string, traits?: Record<string, any>) {
    if (typeof window !== "undefined") {
      console.log("Analytics Identify:", userId, traits)
    }
  }

  static page(name: string, properties?: Record<string, any>) {
    if (typeof window !== "undefined") {
      console.log("Analytics Page:", name, properties)
    }
  }
}
