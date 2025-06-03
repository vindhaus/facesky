import { BskyAgent, RichText } from "@atproto/api"

export class ATProtocolClient {
  private agent: BskyAgent
  private session: any = null

  constructor() {
    this.agent = new BskyAgent({
      service: "https://bsky.social",
    })
  }

  async login(identifier: string, password: string) {
    try {
      const response = await this.agent.login({
        identifier,
        password,
      })
      this.session = response.data
      // Store session in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("at-session", JSON.stringify(response.data))
      }
      return response.data
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  async restoreSession() {
    if (typeof window === "undefined") return false

    try {
      const storedSession = localStorage.getItem("at-session")
      if (!storedSession) return false

      const sessionData = JSON.parse(storedSession)

      // Resume session with the agent
      await this.agent.resumeSession(sessionData)
      this.session = sessionData
      return true
    } catch (error) {
      console.error("Failed to restore session:", error)
      // Clear invalid session
      localStorage.removeItem("at-session")
      return false
    }
  }

  async logout() {
    this.session = null
    // Clear stored session data
    if (typeof window !== "undefined") {
      localStorage.removeItem("at-session")
    }
  }

  async getTimeline(limit = 50, cursor?: string) {
    if (!this.session) {
      throw new Error("Not authenticated")
    }

    try {
      const response = await this.agent.getTimeline({
        limit,
        cursor,
      })
      return response.data
    } catch (error) {
      console.error("Failed to fetch timeline:", error)
      throw error
    }
  }

  async createPost(text: string, images?: File[]) {
    if (!this.session) throw new Error("Not authenticated")

    try {
      const rt = new RichText({ text })
      await rt.detectFacets(this.agent)

      let embed = undefined
      if (images && images.length > 0) {
        const uploadedImages = await Promise.all(
          images.map(async (image) => {
            const response = await this.agent.uploadBlob(image, {
              encoding: image.type,
            })
            return {
              alt: "",
              image: response.data.blob,
            }
          }),
        )

        embed = {
          $type: "app.bsky.embed.images",
          images: uploadedImages,
        }
      }

      const response = await this.agent.post({
        text: rt.text,
        facets: rt.facets,
        embed,
        createdAt: new Date().toISOString(),
      })

      return response
    } catch (error) {
      console.error("Failed to create post:", error)
      throw error
    }
  }

  async likePost(uri: string, cid: string) {
    if (!this.session) throw new Error("Not authenticated")

    try {
      const response = await this.agent.like(uri, cid)
      return response
    } catch (error) {
      console.error("Failed to like post:", error)
      throw error
    }
  }

  async repost(uri: string, cid: string) {
    if (!this.session) throw new Error("Not authenticated")

    try {
      const response = await this.agent.repost(uri, cid)
      return response
    } catch (error) {
      console.error("Failed to repost:", error)
      throw error
    }
  }

  async reply(text: string, parentUri: string, parentCid: string, rootUri?: string, rootCid?: string) {
    if (!this.session) throw new Error("Not authenticated")

    try {
      const rt = new RichText({ text })
      await rt.detectFacets(this.agent)

      // For group and page posts, we need to handle replies differently
      // In a real implementation, you'd have specialized record types
      // For now, we'll use the standard reply mechanism
      const response = await this.agent.post({
        text: rt.text,
        facets: rt.facets,
        reply: {
          root: {
            uri: rootUri || parentUri,
            cid: rootCid || parentCid,
          },
          parent: {
            uri: parentUri,
            cid: parentCid,
          },
        },
        createdAt: new Date().toISOString(),
      })

      return response
    } catch (error) {
      console.error("Failed to reply:", error)
      throw error
    }
  }

  async getPostThread(uri: string) {
    try {
      const response = await this.agent.getPostThread({ uri })
      return response.data
    } catch (error) {
      console.error("Failed to fetch thread:", error)
      throw error
    }
  }

  async searchUsers(query: string, limit = 25) {
    try {
      const response = await this.agent.searchActors({
        term: query,
        limit,
      })
      return response.data
    } catch (error) {
      console.error("Failed to search users:", error)
      throw error
    }
  }

  async getProfile(actor: string) {
    try {
      const response = await this.agent.getProfile({ actor })
      return response.data
    } catch (error) {
      console.error("Failed to get profile:", error)
      throw error
    }
  }

  async followUser(did: string) {
    if (!this.session) throw new Error("Not authenticated")

    try {
      const response = await this.agent.follow(did)
      return response
    } catch (error) {
      console.error("Failed to follow user:", error)
      throw error
    }
  }

  async unfollowUser(followUri: string) {
    if (!this.session) throw new Error("Not authenticated")

    try {
      const response = await this.agent.deleteFollow(followUri)
      return response
    } catch (error) {
      console.error("Failed to unfollow user:", error)
      throw error
    }
  }

  getSession() {
    return this.session
  }

  isAuthenticated() {
    return !!this.session
  }
}

// Singleton instance
export const atClient = new ATProtocolClient()
