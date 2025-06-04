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

  async getUserMemberships(): Promise<any[]> {
    try {
      const session = atClient.getSession()
      if (!session) return []

      // Get posts from the user's repo that indicate group memberships
      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: session.did,
        collection: POST_RECORD_TYPE,
        limit: 100,
      })

      // Filter for group membership posts
      const membershipPosts = response.data.records.filter(
        (record: any) => record.value.text && record.value.text.startsWith(GROUP_MEMBER_PREFIX),
      )

      return membershipPosts.map((record: any) => ({
        uri: record.uri,
        value: {
          groupUri: record.value.text.replace(GROUP_MEMBER_PREFIX, "").trim(),
          role: "member",
          joinedAt: record.value.createdAt,
        },
      }))
    } catch (error) {
      console.error("Failed to fetch user memberships:", error)
      return []
    }
  }

  async getUserPageFollows(): Promise<any[]> {
    try {
      const session = atClient.getSession()
      if (!session) return []

      // Get posts from the user's repo that indicate page follows
      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: session.did,
        collection: POST_RECORD_TYPE,
        limit: 100,
      })

      // Filter for page follow posts
      const followPosts = response.data.records.filter(
        (record: any) => record.value.text && record.value.text.startsWith(PAGE_FOLLOW_PREFIX),
      )

      return followPosts.map((record: any) => ({
        uri: record.uri,
        value: {
          pageUri: record.value.text.replace(PAGE_FOLLOW_PREFIX, "").trim(),
          followedAt: record.value.createdAt,
        },
      }))
    } catch (error) {
      console.error("Failed to fetch user page follows:", error)
      return []
    }
  }

  async getGroup(uri: string): Promise<any> {
    try {
      const [repo, collection, rkey] = uri.replace("at://", "").split("/")

      const response = await atClient["agent"].com.atproto.repo.getRecord({
        repo,
        collection,
        rkey,
      })

      // Parse the group data from the post text
      const text = response.data.value.text
      const lines = text.split("\n")
      const name = lines[0].replace(GROUP_POST_PREFIX, "").trim()
      const description = lines.slice(2).join("\n").trim()

      return {
        value: {
          name,
          description,
          privacy: text.includes("Privacy: private") ? "private" : "public",
          createdAt: response.data.value.createdAt,
          admins: [repo], // The repo owner is the admin
        },
      }
    } catch (error) {
      console.error("Failed to fetch group:", error)
      throw error
    }
  }

  async getPage(uri: string): Promise<any> {
    try {
      const [repo, collection, rkey] = uri.replace("at://", "").split("/")

      const response = await atClient["agent"].com.atproto.repo.getRecord({
        repo,
        collection,
        rkey,
      })

      // Parse the page data from the post text
      const text = response.data.value.text
      const lines = text.split("\n")
      const name = lines[0].replace(PAGE_POST_PREFIX, "").trim()
      const description = lines.slice(2).join("\n").trim()

      return {
        value: {
          name,
          description,
          category: "General", // Could parse from text if needed
          createdAt: response.data.value.createdAt,
          admins: [repo], // The repo owner is the admin
        },
      }
    } catch (error) {
      console.error("Failed to fetch page:", error)
      throw error
    }
  }

  async commentOnGroupPost(groupPostUri: string, text: string, parentCommentUri?: string): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      const session = atClient.getSession()

      // Create a reply post
      const replyPost = {
        $type: POST_RECORD_TYPE,
        text: text,
        createdAt: new Date().toISOString(),
        reply: {
          root: { uri: groupPostUri, cid: "placeholder" }, // In real implementation, you'd need the actual CID
          parent: { uri: parentCommentUri || groupPostUri, cid: "placeholder" },
        },
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: session.did,
        collection: POST_RECORD_TYPE,
        record: replyPost,
      })

      return response.data
    } catch (error) {
      console.error("Failed to comment on group post:", error)
      throw error
    }
  }

  async commentOnPagePost(pagePostUri: string, text: string, parentCommentUri?: string): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      const session = atClient.getSession()

      // Create a reply post
      const replyPost = {
        $type: POST_RECORD_TYPE,
        text: text,
        createdAt: new Date().toISOString(),
        reply: {
          root: { uri: pagePostUri, cid: "placeholder" }, // In real implementation, you'd need the actual CID
          parent: { uri: parentCommentUri || pagePostUri, cid: "placeholder" },
        },
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: session.did,
        collection: POST_RECORD_TYPE,
        record: replyPost,
      })

      return response.data
    } catch (error) {
      console.error("Failed to comment on page post:", error)
      throw error
    }
  }

  async getGroupPostComments(groupPostUri: string): Promise<any[]> {
    try {
      // In a real implementation, you'd need to query for replies to the specific post
      // For now, return empty array since AT Protocol doesn't have a direct way to query replies
      return []
    } catch (error) {
      console.error("Failed to get group post comments:", error)
      return []
    }
  }

  async getPagePostComments(pagePostUri: string): Promise<any[]> {
    try {
      // In a real implementation, you'd need to query for replies to the specific post
      // For now, return empty array since AT Protocol doesn't have a direct way to query replies
      return []
    } catch (error) {
      console.error("Failed to get page post comments:", error)
      return []
    }
  }

  async isUserGroupAdmin(groupUri: string, userDid?: string): Promise<boolean> {
    try {
      const session = atClient.getSession()
      const targetUser = userDid || session?.did
      if (!targetUser) return false

      // Parse the group URI to get the creator's DID
      const [creatorDid] = groupUri.replace("at://", "").split("/")

      // The creator is always an admin
      return creatorDid === targetUser
    } catch (error) {
      console.error("Failed to check group admin status:", error)
      return false
    }
  }

  async isUserPageAdmin(pageUri: string, userDid?: string): Promise<boolean> {
    try {
      const session = atClient.getSession()
      const targetUser = userDid || session?.did
      if (!targetUser) return false

      // Parse the page URI to get the creator's DID
      const [creatorDid] = pageUri.replace("at://", "").split("/")

      // The creator is always an admin
      return creatorDid === targetUser
    } catch (error) {
      console.error("Failed to check page admin status:", error)
      return false
    }
  }

  async updateGroup(groupUri: string, data: any): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      const session = atClient.getSession()
      const [repo, collection, rkey] = groupUri.replace("at://", "").split("/")

      // Only allow the creator to update
      if (repo !== session.did) {
        throw new Error("Only the group creator can update the group")
      }

      // Create updated group post
      const updatedGroupPost = {
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

      const response = await atClient["agent"].com.atproto.repo.putRecord({
        repo: session.did,
        collection,
        rkey,
        record: updatedGroupPost,
      })

      return response.data
    } catch (error) {
      console.error("Failed to update group:", error)
      throw error
    }
  }

  async updatePage(pageUri: string, data: any): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      const session = atClient.getSession()
      const [repo, collection, rkey] = pageUri.replace("at://", "").split("/")

      // Only allow the creator to update
      if (repo !== session.did) {
        throw new Error("Only the page creator can update the page")
      }

      // Create updated page post
      const updatedPagePost = {
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

      const response = await atClient["agent"].com.atproto.repo.putRecord({
        repo: session.did,
        collection,
        rkey,
        record: updatedPagePost,
      })

      return response.data
    } catch (error) {
      console.error("Failed to update page:", error)
      throw error
    }
  }

  async addGroupAdmin(groupUri: string, adminDid: string): Promise<any> {
    // In this simplified implementation, only the creator can be an admin
    // In a full implementation, you'd need a more complex admin management system
    throw new Error("Admin management not implemented in this simplified version")
  }

  async addPageAdmin(pageUri: string, adminDid: string): Promise<any> {
    // In this simplified implementation, only the creator can be an admin
    // In a full implementation, you'd need a more complex admin management system
    throw new Error("Admin management not implemented in this simplified version")
  }

  async removeGroupMember(groupUri: string, memberDid: string): Promise<any> {
    // In this simplified implementation, members manage their own membership
    // In a full implementation, you'd need admin controls to remove members
    throw new Error("Member removal not implemented in this simplified version")
  }

  getSession() {
    return atClient.getSession()
  }
}

export const atGroupsClient = new ATProtocolGroupsClient()
