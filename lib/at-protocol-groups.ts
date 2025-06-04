import { atClient } from "./at-protocol"

// Use existing AT Protocol record types
export const POST_RECORD_TYPE = "app.bsky.feed.post"
export const FOLLOW_RECORD_TYPE = "app.bsky.graph.follow"
export const PROFILE_RECORD_TYPE = "app.bsky.actor.profile"

// Use app.bsky.graph.list for groups/pages (lists don't appear in feeds)
export const LIST_RECORD_TYPE = "app.bsky.graph.list"

// Special list purposes for our groups and pages
export const GROUP_LIST_PURPOSE = "app.facesky.group"
export const PAGE_LIST_PURPOSE = "app.facesky.page"

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

      // Create a list record for the group (lists don't appear in feeds)
      const groupList = {
        $type: "app.bsky.graph.list",
        name: data.name,
        description: `${data.description}\n\n---FACESKY-GROUP---\nPrivacy: ${data.privacy}${data.rules ? `\nRules: ${data.rules}` : ""}`,
        purpose: GROUP_LIST_PURPOSE,
        avatar: data.image ? await this.uploadImageBlob(data.image) : undefined,
        createdAt: new Date().toISOString(),
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: session.did,
        collection: LIST_RECORD_TYPE,
        record: groupList,
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

      // Create a list record for the page (lists don't appear in feeds)
      const pageList = {
        $type: "app.bsky.graph.list",
        name: data.name,
        description: `${data.description}\n\n---FACESKY-PAGE---\nCategory: ${data.category}${data.website ? `\nWebsite: ${data.website}` : ""}${data.location ? `\nLocation: ${data.location}` : ""}`,
        purpose: PAGE_LIST_PURPOSE,
        avatar: data.image ? await this.uploadImageBlob(data.image) : undefined,
        createdAt: new Date().toISOString(),
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: session.did,
        collection: LIST_RECORD_TYPE,
        record: pageList,
      })

      return response.data
    } catch (error) {
      console.error("Failed to create page:", error)
      throw error
    }
  }

  private async uploadImageBlob(imageUrl: string): Promise<any> {
    try {
      // If it's already a blob reference, return it
      if (typeof imageUrl === "object" && imageUrl.$type) {
        return imageUrl
      }

      // For now, return undefined - in a real implementation you'd convert URL to blob
      return undefined
    } catch (error) {
      console.error("Failed to upload image:", error)
      return undefined
    }
  }

  async joinGroup(groupUri: string): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      const session = atClient.getSession()

      // Create a listitem record (adds user to the group list)
      const listItem = {
        $type: "app.bsky.graph.listitem",
        subject: session.did,
        list: groupUri,
        createdAt: new Date().toISOString(),
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: session.did,
        collection: "app.bsky.graph.listitem",
        record: listItem,
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

      // Create a listitem record (adds user to the page followers list)
      const listItem = {
        $type: "app.bsky.graph.listitem",
        subject: session.did,
        list: pageUri,
        createdAt: new Date().toISOString(),
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: session.did,
        collection: "app.bsky.graph.listitem",
        record: listItem,
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

      // Create a post with special labels that won't appear in main feeds
      const groupPost = {
        $type: "app.bsky.feed.post",
        text: text,
        embed,
        createdAt: new Date().toISOString(),
        // Use labels to mark this as a group post (won't appear in main feed algorithms)
        labels: {
          $type: "com.atproto.label.defs#selfLabels",
          values: [
            {
              val: "facesky-group-post",
            },
            {
              val: "no-promote", // Prevents algorithmic promotion
            },
          ],
        },
        // Add group reference in facets (hidden from display)
        facets: [
          {
            index: { byteStart: text.length, byteEnd: text.length },
            features: [
              {
                $type: "app.bsky.richtext.facet#link",
                uri: groupUri,
              },
            ],
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

      // Create a post with special labels that won't appear in main feeds
      const pagePost = {
        $type: "app.bsky.feed.post",
        text: text,
        embed,
        createdAt: new Date().toISOString(),
        // Use labels to mark this as a page post (won't appear in main feed algorithms)
        labels: {
          $type: "com.atproto.label.defs#selfLabels",
          values: [
            {
              val: "facesky-page-post",
            },
            {
              val: "no-promote", // Prevents algorithmic promotion
            },
          ],
        },
        // Add page reference in facets (hidden from display)
        facets: [
          {
            index: { byteStart: text.length, byteEnd: text.length },
            features: [
              {
                $type: "app.bsky.richtext.facet#link",
                uri: pageUri,
              },
            ],
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

      // Get list records from the user's repo
      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: session.did,
        collection: LIST_RECORD_TYPE,
        limit,
      })

      // Filter for group lists
      const groupLists = response.data.records.filter(
        (record: any) =>
          record.value.purpose === GROUP_LIST_PURPOSE || record.value.description?.includes("---FACESKY-GROUP---"),
      )

      // Transform into group format
      return groupLists.map((record: any) => {
        const description = record.value.description || ""
        const lines = description.split("\n")
        const mainDescription = lines[0]
        const privacy = description.includes("Privacy: private") ? "private" : "public"
        const rules = description.match(/Rules: (.+)/)?.[1] || ""

        return {
          uri: record.uri,
          cid: record.cid,
          value: {
            name: record.value.name,
            description: mainDescription,
            privacy,
            rules,
            createdAt: record.value.createdAt,
            creator: session.did,
          },
          creatorHandle: session.handle,
          creatorDisplayName: session.displayName,
          memberCount: 1,
          isJoined: true,
          isAdmin: true,
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

      // Get list records from the user's repo
      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: session.did,
        collection: LIST_RECORD_TYPE,
        limit,
      })

      // Filter for page lists
      const pageLists = response.data.records.filter(
        (record: any) =>
          record.value.purpose === PAGE_LIST_PURPOSE || record.value.description?.includes("---FACESKY-PAGE---"),
      )

      // Transform into page format
      return pageLists.map((record: any) => {
        const description = record.value.description || ""
        const lines = description.split("\n")
        const mainDescription = lines[0]
        const category = description.match(/Category: (.+)/)?.[1] || "General"
        const website = description.match(/Website: (.+)/)?.[1] || ""
        const location = description.match(/Location: (.+)/)?.[1] || ""

        return {
          uri: record.uri,
          cid: record.cid,
          value: {
            name: record.value.name,
            description: mainDescription,
            category,
            website,
            location,
            createdAt: record.value.createdAt,
            creator: session.did,
          },
          creatorHandle: session.handle,
          creatorDisplayName: session.displayName,
          followerCount: 1,
          isFollowing: true,
          isAdmin: true,
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

      // Get posts from the user's repo
      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: session.did,
        collection: POST_RECORD_TYPE,
        limit,
      })

      // Filter for posts that reference this group
      const groupPosts = response.data.records.filter((record: any) => {
        // Check if post has group labels and references this group
        const hasGroupLabel = record.value.labels?.values?.some((label: any) => label.val === "facesky-group-post")
        const referencesGroup = record.value.facets?.some((facet: any) =>
          facet.features?.some((feature: any) => feature.uri === groupUri),
        )
        return hasGroupLabel && referencesGroup
      })

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

      // Get posts from the user's repo
      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: session.did,
        collection: POST_RECORD_TYPE,
        limit,
      })

      // Filter for posts that reference this page
      const pagePosts = response.data.records.filter((record: any) => {
        // Check if post has page labels and references this page
        const hasPageLabel = record.value.labels?.values?.some((label: any) => label.val === "facesky-page-post")
        const referencesPage = record.value.facets?.some((facet: any) =>
          facet.features?.some((feature: any) => feature.uri === pageUri),
        )
        return hasPageLabel && referencesPage
      })

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

      // Get listitem records from the user's repo
      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: session.did,
        collection: "app.bsky.graph.listitem",
        limit: 100,
      })

      // Filter for group memberships
      const memberships = response.data.records.filter(async (record: any) => {
        try {
          // Check if the list is a group
          const listUri = record.value.list
          const [repo, collection, rkey] = listUri.replace("at://", "").split("/")
          const listRecord = await atClient["agent"].com.atproto.repo.getRecord({
            repo,
            collection,
            rkey,
          })
          return (
            listRecord.data.value.purpose === GROUP_LIST_PURPOSE ||
            listRecord.data.value.description?.includes("---FACESKY-GROUP---")
          )
        } catch {
          return false
        }
      })

      return memberships.map((record: any) => ({
        uri: record.uri,
        value: {
          groupUri: record.value.list,
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

      // Get listitem records from the user's repo
      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: session.did,
        collection: "app.bsky.graph.listitem",
        limit: 100,
      })

      // Filter for page follows
      const follows = response.data.records.filter(async (record: any) => {
        try {
          // Check if the list is a page
          const listUri = record.value.list
          const [repo, collection, rkey] = listUri.replace("at://", "").split("/")
          const listRecord = await atClient["agent"].com.atproto.repo.getRecord({
            repo,
            collection,
            rkey,
          })
          return (
            listRecord.data.value.purpose === PAGE_LIST_PURPOSE ||
            listRecord.data.value.description?.includes("---FACESKY-PAGE---")
          )
        } catch {
          return false
        }
      })

      return follows.map((record: any) => ({
        uri: record.uri,
        value: {
          pageUri: record.value.list,
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

      const description = response.data.value.description || ""
      const lines = description.split("\n")
      const mainDescription = lines[0]
      const privacy = description.includes("Privacy: private") ? "private" : "public"
      const rules = description.match(/Rules: (.+)/)?.[1] || ""

      return {
        uri: uri,
        value: {
          name: response.data.value.name,
          description: mainDescription,
          privacy,
          rules,
          createdAt: response.data.value.createdAt,
          admins: [repo],
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

      const description = response.data.value.description || ""
      const lines = description.split("\n")
      const mainDescription = lines[0]
      const category = description.match(/Category: (.+)/)?.[1] || "General"
      const website = description.match(/Website: (.+)/)?.[1] || ""
      const location = description.match(/Location: (.+)/)?.[1] || ""

      return {
        uri: uri,
        value: {
          name: response.data.value.name,
          description: mainDescription,
          category,
          website,
          location,
          createdAt: response.data.value.createdAt,
          admins: [repo],
        },
      }
    } catch (error) {
      console.error("Failed to fetch page:", error)
      throw error
    }
  }

  // Rest of the methods remain the same...
  async commentOnGroupPost(groupPostUri: string, text: string, parentCommentUri?: string): Promise<any> {
    return atClient.reply(text, groupPostUri, "placeholder-cid", parentCommentUri)
  }

  async commentOnPagePost(pagePostUri: string, text: string, parentCommentUri?: string): Promise<any> {
    return atClient.reply(text, pagePostUri, "placeholder-cid", parentCommentUri)
  }

  async getGroupPostComments(groupPostUri: string): Promise<any[]> {
    return []
  }

  async getPagePostComments(pagePostUri: string): Promise<any[]> {
    return []
  }

  async isUserGroupAdmin(groupUri: string, userDid?: string): Promise<boolean> {
    try {
      const session = atClient.getSession()
      const targetUser = userDid || session?.did
      if (!targetUser) return false

      const [creatorDid] = groupUri.replace("at://", "").split("/")
      return creatorDid === targetUser
    } catch (error) {
      return false
    }
  }

  async isUserPageAdmin(pageUri: string, userDid?: string): Promise<boolean> {
    try {
      const session = atClient.getSession()
      const targetUser = userDid || session?.did
      if (!targetUser) return false

      const [creatorDid] = pageUri.replace("at://", "").split("/")
      return creatorDid === targetUser
    } catch (error) {
      return false
    }
  }

  async updateGroup(groupUri: string, data: any): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      const session = atClient.getSession()
      const [repo, collection, rkey] = groupUri.replace("at://", "").split("/")

      if (repo !== session.did) {
        throw new Error("Only the group creator can update the group")
      }

      const updatedList = {
        $type: "app.bsky.graph.list",
        name: data.name,
        description: `${data.description}\n\n---FACESKY-GROUP---\nPrivacy: ${data.privacy}${data.rules ? `\nRules: ${data.rules}` : ""}`,
        purpose: GROUP_LIST_PURPOSE,
        createdAt: new Date().toISOString(),
      }

      const response = await atClient["agent"].com.atproto.repo.putRecord({
        repo: session.did,
        collection,
        rkey,
        record: updatedList,
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

      if (repo !== session.did) {
        throw new Error("Only the page creator can update the page")
      }

      const updatedList = {
        $type: "app.bsky.graph.list",
        name: data.name,
        description: `${data.description}\n\n---FACESKY-PAGE---\nCategory: ${data.category}${data.website ? `\nWebsite: ${data.website}` : ""}${data.location ? `\nLocation: ${data.location}` : ""}`,
        purpose: PAGE_LIST_PURPOSE,
        createdAt: new Date().toISOString(),
      }

      const response = await atClient["agent"].com.atproto.repo.putRecord({
        repo: session.did,
        collection,
        rkey,
        record: updatedList,
      })

      return response.data
    } catch (error) {
      console.error("Failed to update page:", error)
      throw error
    }
  }

  async addGroupAdmin(groupUri: string, adminDid: string): Promise<any> {
    throw new Error("Admin management not implemented in this simplified version")
  }

  async addPageAdmin(pageUri: string, adminDid: string): Promise<any> {
    throw new Error("Admin management not implemented in this simplified version")
  }

  async removeGroupMember(groupUri: string, memberDid: string): Promise<any> {
    throw new Error("Member removal not implemented in this simplified version")
  }

  getSession() {
    return atClient.getSession()
  }
}

export const atGroupsClient = new ATProtocolGroupsClient()
