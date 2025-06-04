import { atClient } from "./at-protocol"

// Use existing AT Protocol record types
export const POST_RECORD_TYPE = "app.bsky.feed.post"
export const FOLLOW_RECORD_TYPE = "app.bsky.graph.follow"
export const PROFILE_RECORD_TYPE = "app.bsky.actor.profile"

// We'll use special post formats to represent groups and pages
export const GROUP_POST_PREFIX = "🏢 GROUP:"
export const PAGE_POST_PREFIX = "📄 PAGE:"
export const GROUP_MEMBER_PREFIX = "👥 JOINED GROUP:"
export const PAGE_FOLLOW_PREFIX = "👁️ FOLLOWING PAGE:"

export interface GroupData {
  name: string
  description: string
  privacy: "public" | "private"
  image?: string
  createdAt: string
  creator: string
  rules?: string
}

export interface PageData {
  name: string
  description: string
  category: string
  image?: string
  website?: string
  location?: string
  createdAt: string
  creator: string
}

export class ATProtocolGroupsClient {
  async createGroup(data: Omit<GroupData, "createdAt" | "creator">): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      const session = atClient.getSession()

      // Create a post that represents the group
      const groupPost = {
        $type: POST_RECORD_TYPE,
        text: `${GROUP_POST_PREFIX} ${data.name}\n\n${data.description}\n\nPrivacy: ${data.privacy}${data.rules ? `\n\nRules: ${data.rules}` : ""}`,
        createdAt: new Date().toISOString(),
        facets: [
          {
            index: { byteStart: 0, byteEnd: GROUP_POST_PREFIX.length + data.name.length },
            features: [{ $type: "app.bsky.richtext.facet#tag", tag: "group" }],
          },
        ],
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: session.did,
        collection: POST_RECORD_TYPE,
        record: groupPost,
      })

      return response.data
    } catch (error) {
      console.error("Failed to create group:", error)
      throw error
    }
  }

  async createPage(data: Omit<PageData, "createdAt" | "creator">): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      const session = atClient.getSession()

      // Create a post that represents the page
      const pagePost = {
        $type: POST_RECORD_TYPE,
        text: `${PAGE_POST_PREFIX} ${data.name}\n\n${data.description}\n\nCategory: ${data.category}${data.website ? `\nWebsite: ${data.website}` : ""}${data.location ? `\nLocation: ${data.location}` : ""}`,
        createdAt: new Date().toISOString(),
        facets: [
          {
            index: { byteStart: 0, byteEnd: PAGE_POST_PREFIX.length + data.name.length },
            features: [{ $type: "app.bsky.richtext.facet#tag", tag: "page" }],
          },
        ],
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: session.did,
        collection: POST_RECORD_TYPE,
        record: pagePost,
      })

      return response.data
    } catch (error) {
      console.error("Failed to create page:", error)
      throw error
    }
  }

  async joinGroup(groupUri: string): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      const session = atClient.getSession()

      // Create a post indicating group membership
      const membershipPost = {
        $type: POST_RECORD_TYPE,
        text: `${GROUP_MEMBER_PREFIX} ${groupUri}`,
        createdAt: new Date().toISOString(),
        facets: [
          {
            index: { byteStart: 0, byteEnd: GROUP_MEMBER_PREFIX.length },
            features: [{ $type: "app.bsky.richtext.facet#tag", tag: "groupmember" }],
          },
        ],
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: session.did,
        collection: POST_RECORD_TYPE,
        record: membershipPost,
      })

      return response.data
    } catch (error) {
      console.error("Failed to join group:", error)
      throw error
    }
  }

  async followPage(pageUri: string): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      const session = atClient.getSession()

      // Create a post indicating page follow
      const followPost = {
        $type: POST_RECORD_TYPE,
        text: `${PAGE_FOLLOW_PREFIX} ${pageUri}`,
        createdAt: new Date().toISOString(),
        facets: [
          {
            index: { byteStart: 0, byteEnd: PAGE_FOLLOW_PREFIX.length },
            features: [{ $type: "app.bsky.richtext.facet#tag", tag: "pagefollow" }],
          },
        ],
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: session.did,
        collection: POST_RECORD_TYPE,
        record: followPost,
      })

      return response.data
    } catch (error) {
      console.error("Failed to follow page:", error)
      throw error
    }
  }

  async postToGroup(groupUri: string, text: string, images?: File[]): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      const session = atClient.getSession()

      // Handle image uploads if any
      let embed = undefined
      if (images && images.length > 0) {
        const uploadedImages = await Promise.all(
          images.map(async (image) => {
            const response = await atClient["agent"].uploadBlob(image, {
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

      // Create a regular post with group reference
      const groupPost = {
        $type: POST_RECORD_TYPE,
        text: `📝 Group Post: ${text}\n\n#group ${groupUri}`,
        createdAt: new Date().toISOString(),
        embed,
        facets: [
          {
            index: { byteStart: text.length + 15, byteEnd: text.length + 21 },
            features: [{ $type: "app.bsky.richtext.facet#tag", tag: "group" }],
          },
        ],
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: session.did,
        collection: POST_RECORD_TYPE,
        record: groupPost,
      })

      return response.data
    } catch (error) {
      console.error("Failed to post to group:", error)
      throw error
    }
  }

  async postToPage(pageUri: string, text: string, images?: File[]): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      const session = atClient.getSession()

      // Handle image uploads if any
      let embed = undefined
      if (images && images.length > 0) {
        const uploadedImages = await Promise.all(
          images.map(async (image) => {
            const response = await atClient["agent"].uploadBlob(image, {
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

      // Create a regular post with page reference
      const pagePost = {
        $type: POST_RECORD_TYPE,
        text: `📄 Page Post: ${text}\n\n#page ${pageUri}`,
        createdAt: new Date().toISOString(),
        embed,
        facets: [
          {
            index: { byteStart: text.length + 14, byteEnd: text.length + 19 },
            features: [{ $type: "app.bsky.richtext.facet#tag", tag: "page" }],
          },
        ],
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: session.did,
        collection: POST_RECORD_TYPE,
        record: pagePost,
      })

      return response.data
    } catch (error) {
      console.error("Failed to post to page:", error)
      throw error
    }
  }

  async getGroups(limit = 50): Promise<any[]> {
    try {
      const session = atClient.getSession()
      if (!session) return []

      // Get posts from the user's repo that are group definitions
      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: session.did,
        collection: POST_RECORD_TYPE,
        limit,
      })

      // Filter for group posts
      const groupPosts = response.data.records.filter(
        (record: any) => record.value.text && record.value.text.startsWith(GROUP_POST_PREFIX),
      )

      // Transform into group format
      return groupPosts.map((record: any) => {
        const text = record.value.text
        const lines = text.split("\n")
        const name = lines[0].replace(GROUP_POST_PREFIX, "").trim()
        const description = lines.slice(2).join("\n").trim()

        return {
          uri: record.uri,
          cid: record.cid,
          value: {
            name,
            description,
            privacy: text.includes("Privacy: private") ? "private" : "public",
            createdAt: record.value.createdAt,
            creator: session.did,
          },
          creatorHandle: session.handle,
          creatorDisplayName: session.displayName,
          memberCount: 1, // At least the creator
          isJoined: true, // Creator is always joined
        }
      })
    } catch (error) {
      console.error("Failed to fetch groups:", error)
      return []
    }
  }

  async getPages(limit = 50): Promise<any[]> {
    try {
      const session = atClient.getSession()
      if (!session) return []

      // Get posts from the user's repo that are page definitions
      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: session.did,
        collection: POST_RECORD_TYPE,
        limit,
      })

      // Filter for page posts
      const pagePosts = response.data.records.filter(
        (record: any) => record.value.text && record.value.text.startsWith(PAGE_POST_PREFIX),
      )

      // Transform into page format
      return pagePosts.map((record: any) => {
        const text = record.value.text
        const lines = text.split("\n")
        const name = lines[0].replace(PAGE_POST_PREFIX, "").trim()
        const description = lines.slice(2).join("\n").trim()

        return {
          uri: record.uri,
          cid: record.cid,
          value: {
            name,
            description,
            category: "General", // Extract from text if needed
            createdAt: record.value.createdAt,
            creator: session.did,
          },
          creatorHandle: session.handle,
          creatorDisplayName: session.displayName,
          followerCount: 1, // At least the creator
          isFollowing: true, // Creator is always following
        }
      })
    } catch (error) {
      console.error("Failed to fetch pages:", error)
      return []
    }
  }

  async getGroupPosts(groupUri: string, limit = 50): Promise<any[]> {
    try {
      const session = atClient.getSession()
      if (!session) return []

      // Get posts that reference this group
      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: session.did,
        collection: POST_RECORD_TYPE,
        limit,
      })

      // Filter for posts that reference this group
      const groupPosts = response.data.records.filter(
        (record: any) => record.value.text && record.value.text.includes(groupUri),
      )

      return groupPosts.map((record: any) => ({
        ...record,
        author: {
          did: session.did,
          handle: session.handle,
          displayName: session.displayName,
        },
      }))
    } catch (error) {
      console.error("Failed to fetch group posts:", error)
      return []
    }
  }

  async getPagePosts(pageUri: string, limit = 50): Promise<any[]> {
    try {
      const session = atClient.getSession()
      if (!session) return []

      // Get posts that reference this page
      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: session.did,
        collection: POST_RECORD_TYPE,
        limit,
      })

      // Filter for posts that reference this page
      const pagePosts = response.data.records.filter(
        (record: any) => record.value.text && record.value.text.includes(pageUri),
      )

      return pagePosts.map((record: any) => ({
        ...record,
        author: {
          did: session.did,
          handle: session.handle,
          displayName: session.displayName,
        },
      }))
    } catch (error) {
      console.error("Failed to fetch page posts:", error)
      return []
    }
  }

  getSession() {
    return atClient.getSession()
  }
}

export const atGroupsClient = new ATProtocolGroupsClient()
