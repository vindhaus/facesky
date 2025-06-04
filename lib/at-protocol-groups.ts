import { atClient } from "./at-protocol"
import { RichText } from "@atproto/api"

// Use existing AT Protocol record types only
export const POST_RECORD_TYPE = "app.bsky.feed.post"

// Use special text markers to identify our content
export const GROUP_MARKER = "🏢 FACESKY-GROUP:"
export const PAGE_MARKER = "📄 FACESKY-PAGE:"
export const GROUP_POST_MARKER = "👥 GROUP-POST:"
export const PAGE_POST_MARKER = "📰 PAGE-POST:"
export const GROUP_JOIN_MARKER = "🤝 JOINED-GROUP:"
export const PAGE_FOLLOW_MARKER = "👁️ FOLLOWING-PAGE:"

export interface GroupData {
  name: string
  description: string
  privacy: "public" | "private"
  rules?: string
}

export interface PageData {
  name: string
  description: string
  category: string
  website?: string
  location?: string
}

export class ATProtocolGroupsClient {
  // Update the createGroup function to make posts truly private
  async createGroup(data: GroupData): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      // Create a special post that defines the group
      // This post will be hidden from main feeds using labels AND special formatting
      const groupText = `${GROUP_MARKER} ${data.name}

${data.description}

Privacy: ${data.privacy}
${data.rules ? `Rules: ${data.rules}` : ""}

#FaceskyGroup #NoPromote #PrivateContent`

      const rt = new RichText({ text: groupText })
      await rt.detectFacets(atClient["agent"])

      // Add a reply-to reference to make this a self-reply
      // Self-replies are much less likely to appear in the main feed
      const dummyPostResponse = await this.createDummyAnchorPost()

      const groupPost = {
        $type: "app.bsky.feed.post",
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString(),
        // Use self-labels to keep this out of main feeds
        labels: {
          $type: "com.atproto.label.defs#selfLabels",
          values: [
            { val: "facesky-group" },
            { val: "no-promote" },
            { val: "!hide" }, // More aggressive hiding
            { val: "private" },
          ],
        },
        // Make this a reply to our dummy post
        reply: {
          root: {
            uri: dummyPostResponse.uri,
            cid: dummyPostResponse.cid,
          },
          parent: {
            uri: dummyPostResponse.uri,
            cid: dummyPostResponse.cid,
          },
        },
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: atClient.getSession().did,
        collection: POST_RECORD_TYPE,
        record: groupPost,
      })

      return response.data
    } catch (error) {
      console.error("Failed to create group:", error)
      throw error
    }
  }

  // Add a new helper function to create a dummy anchor post
  async createDummyAnchorPost(): Promise<any> {
    try {
      // Create an invisible anchor post that our content will reply to
      // This makes it much less likely to appear in feeds
      const anchorText = `🔒 FACESKY-ANCHOR

#FaceskyAnchor #NoPromote #PrivateContent`

      const rt = new RichText({ text: anchorText })
      await rt.detectFacets(atClient["agent"])

      const anchorPost = {
        $type: "app.bsky.feed.post",
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString(),
        labels: {
          $type: "com.atproto.label.defs#selfLabels",
          values: [{ val: "facesky-anchor" }, { val: "no-promote" }, { val: "!hide" }, { val: "private" }],
        },
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: atClient.getSession().did,
        collection: POST_RECORD_TYPE,
        record: anchorPost,
      })

      return response.data
    } catch (error) {
      console.error("Failed to create anchor post:", error)
      throw error
    }
  }

  // Update the createPage function to use the same approach
  async createPage(data: PageData): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      // Create a special post that defines the page
      const pageText = `${PAGE_MARKER} ${data.name}

${data.description}

Category: ${data.category}
${data.website ? `Website: ${data.website}` : ""}
${data.location ? `Location: ${data.location}` : ""}

#FaceskyPage #NoPromote #PrivateContent`

      const rt = new RichText({ text: pageText })
      await rt.detectFacets(atClient["agent"])

      // Add a reply-to reference to make this a self-reply
      const dummyPostResponse = await this.createDummyAnchorPost()

      const pagePost = {
        $type: "app.bsky.feed.post",
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString(),
        // Use self-labels to keep this out of main feeds
        labels: {
          $type: "com.atproto.label.defs#selfLabels",
          values: [{ val: "facesky-page" }, { val: "no-promote" }, { val: "!hide" }, { val: "private" }],
        },
        // Make this a reply to our dummy post
        reply: {
          root: {
            uri: dummyPostResponse.uri,
            cid: dummyPostResponse.cid,
          },
          parent: {
            uri: dummyPostResponse.uri,
            cid: dummyPostResponse.cid,
          },
        },
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: atClient.getSession().did,
        collection: POST_RECORD_TYPE,
        record: pagePost,
      })

      return response.data
    } catch (error) {
      console.error("Failed to create page:", error)
      throw error
    }
  }

  // Update the postToGroup function to use the same approach
  async postToGroup(groupUri: string, text: string, images?: File[]): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
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

      // Create the group post with special marker
      const groupPostText = `${GROUP_POST_MARKER} ${groupUri}

${text}

#FaceskyGroupPost #NoPromote #PrivateContent`

      const rt = new RichText({ text: groupPostText })
      await rt.detectFacets(atClient["agent"])

      // Add a reply-to reference to make this a self-reply
      const dummyPostResponse = await this.createDummyAnchorPost()

      const groupPost = {
        $type: "app.bsky.feed.post",
        text: rt.text,
        facets: rt.facets,
        embed,
        createdAt: new Date().toISOString(),
        labels: {
          $type: "com.atproto.label.defs#selfLabels",
          values: [{ val: "facesky-group-post" }, { val: "no-promote" }, { val: "!hide" }, { val: "private" }],
        },
        // Make this a reply to our dummy post
        reply: {
          root: {
            uri: dummyPostResponse.uri,
            cid: dummyPostResponse.cid,
          },
          parent: {
            uri: dummyPostResponse.uri,
            cid: dummyPostResponse.cid,
          },
        },
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: atClient.getSession().did,
        collection: POST_RECORD_TYPE,
        record: groupPost,
      })

      return response.data
    } catch (error) {
      console.error("Failed to post to group:", error)
      throw error
    }
  }

  // Update the postToPage function to use the same approach
  async postToPage(pageUri: string, text: string, images?: File[]): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
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

      // Create the page post with special marker
      const pagePostText = `${PAGE_POST_MARKER} ${pageUri}

${text}

#FaceskyPagePost #NoPromote #PrivateContent`

      const rt = new RichText({ text: pagePostText })
      await rt.detectFacets(atClient["agent"])

      // Add a reply-to reference to make this a self-reply
      const dummyPostResponse = await this.createDummyAnchorPost()

      const pagePost = {
        $type: "app.bsky.feed.post",
        text: rt.text,
        facets: rt.facets,
        embed,
        createdAt: new Date().toISOString(),
        labels: {
          $type: "com.atproto.label.defs#selfLabels",
          values: [{ val: "facesky-page-post" }, { val: "no-promote" }, { val: "!hide" }, { val: "private" }],
        },
        // Make this a reply to our dummy post
        reply: {
          root: {
            uri: dummyPostResponse.uri,
            cid: dummyPostResponse.cid,
          },
          parent: {
            uri: dummyPostResponse.uri,
            cid: dummyPostResponse.cid,
          },
        },
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: atClient.getSession().did,
        collection: POST_RECORD_TYPE,
        record: pagePost,
      })

      return response.data
    } catch (error) {
      console.error("Failed to post to page:", error)
      throw error
    }
  }

  // Update the joinGroup function to use the same approach
  async joinGroup(groupUri: string): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      // Create a membership post
      const joinText = `${GROUP_JOIN_MARKER} ${groupUri}

#FaceskyMembership #NoPromote #PrivateContent`

      const rt = new RichText({ text: joinText })
      await rt.detectFacets(atClient["agent"])

      // Add a reply-to reference to make this a self-reply
      const dummyPostResponse = await this.createDummyAnchorPost()

      const joinPost = {
        $type: "app.bsky.feed.post",
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString(),
        labels: {
          $type: "com.atproto.label.defs#selfLabels",
          values: [{ val: "facesky-membership" }, { val: "no-promote" }, { val: "!hide" }, { val: "private" }],
        },
        // Make this a reply to our dummy post
        reply: {
          root: {
            uri: dummyPostResponse.uri,
            cid: dummyPostResponse.cid,
          },
          parent: {
            uri: dummyPostResponse.uri,
            cid: dummyPostResponse.cid,
          },
        },
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: atClient.getSession().did,
        collection: POST_RECORD_TYPE,
        record: joinPost,
      })

      return response.data
    } catch (error) {
      console.error("Failed to join group:", error)
      throw error
    }
  }

  // Update the followPage function to use the same approach
  async followPage(pageUri: string): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      // Create a follow post
      const followText = `${PAGE_FOLLOW_MARKER} ${pageUri}

#FaceskyFollow #NoPromote #PrivateContent`

      const rt = new RichText({ text: followText })
      await rt.detectFacets(atClient["agent"])

      // Add a reply-to reference to make this a self-reply
      const dummyPostResponse = await this.createDummyAnchorPost()

      const followPost = {
        $type: "app.bsky.feed.post",
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString(),
        labels: {
          $type: "com.atproto.label.defs#selfLabels",
          values: [{ val: "facesky-follow" }, { val: "no-promote" }, { val: "!hide" }, { val: "private" }],
        },
        // Make this a reply to our dummy post
        reply: {
          root: {
            uri: dummyPostResponse.uri,
            cid: dummyPostResponse.cid,
          },
          parent: {
            uri: dummyPostResponse.uri,
            cid: dummyPostResponse.cid,
          },
        },
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: atClient.getSession().did,
        collection: POST_RECORD_TYPE,
        record: followPost,
      })

      return response.data
    } catch (error) {
      console.error("Failed to follow page:", error)
      throw error
    }
  }

  async getGroups(limit = 50): Promise<any[]> {
    try {
      const session = atClient.getSession()
      if (!session) return []

      // Get posts from the user's repo
      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: session.did,
        collection: POST_RECORD_TYPE,
        limit,
      })

      // Filter for group definition posts
      const groupPosts = response.data.records.filter((record: any) => record.value.text?.startsWith(GROUP_MARKER))

      // Transform into group format
      return groupPosts.map((record: any) => {
        const text = record.value.text
        const lines = text.split("\n")
        const name = lines[0].replace(GROUP_MARKER, "").trim()
        const description = lines[2] || ""
        const privacy = text.includes("Privacy: private") ? "private" : "public"
        const rules = text.match(/Rules: (.+)/)?.[1] || ""

        return {
          uri: record.uri,
          cid: record.cid,
          value: {
            name,
            description,
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

      // Get posts from the user's repo
      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: session.did,
        collection: POST_RECORD_TYPE,
        limit,
      })

      // Filter for page definition posts
      const pagePosts = response.data.records.filter((record: any) => record.value.text?.startsWith(PAGE_MARKER))

      // Transform into page format
      return pagePosts.map((record: any) => {
        const text = record.value.text
        const lines = text.split("\n")
        const name = lines[0].replace(PAGE_MARKER, "").trim()
        const description = lines[2] || ""
        const category = text.match(/Category: (.+)/)?.[1] || "General"
        const website = text.match(/Website: (.+)/)?.[1] || ""
        const location = text.match(/Location: (.+)/)?.[1] || ""

        return {
          uri: record.uri,
          cid: record.cid,
          value: {
            name,
            description,
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
      const groupPosts = response.data.records.filter((record: any) =>
        record.value.text?.includes(`${GROUP_POST_MARKER} ${groupUri}`),
      )

      return groupPosts.map((record: any) => {
        // Extract the actual post content (remove the marker line)
        const lines = record.value.text.split("\n")
        const contentLines = lines.slice(2, -2) // Remove marker and hashtags
        const actualContent = contentLines.join("\n").trim()

        return {
          ...record,
          value: {
            ...record.value,
            text: actualContent, // Show clean content to user
          },
          author: {
            did: session.did,
            handle: session.handle,
            displayName: session.displayName,
          },
        }
      })
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
      const pagePosts = response.data.records.filter((record: any) =>
        record.value.text?.includes(`${PAGE_POST_MARKER} ${pageUri}`),
      )

      return pagePosts.map((record: any) => {
        // Extract the actual post content (remove the marker line)
        const lines = record.value.text.split("\n")
        const contentLines = lines.slice(2, -2) // Remove marker and hashtags
        const actualContent = contentLines.join("\n").trim()

        return {
          ...record,
          value: {
            ...record.value,
            text: actualContent, // Show clean content to user
          },
          author: {
            did: session.did,
            handle: session.handle,
            displayName: session.displayName,
          },
        }
      })
    } catch (error) {
      console.error("Failed to fetch page posts:", error)
      return []
    }
  }

  async getUserMemberships(): Promise<any[]> {
    try {
      const session = atClient.getSession()
      if (!session) return []

      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: session.did,
        collection: POST_RECORD_TYPE,
        limit: 100,
      })

      const memberships = response.data.records.filter((record: any) =>
        record.value.text?.startsWith(GROUP_JOIN_MARKER),
      )

      return memberships.map((record: any) => {
        const groupUri = record.value.text.split("\n")[0].replace(GROUP_JOIN_MARKER, "").trim()
        return {
          uri: record.uri,
          value: {
            groupUri,
            role: "member",
            joinedAt: record.value.createdAt,
          },
        }
      })
    } catch (error) {
      console.error("Failed to fetch user memberships:", error)
      return []
    }
  }

  async getUserPageFollows(): Promise<any[]> {
    try {
      const session = atClient.getSession()
      if (!session) return []

      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: session.did,
        collection: POST_RECORD_TYPE,
        limit: 100,
      })

      const follows = response.data.records.filter((record: any) => record.value.text?.startsWith(PAGE_FOLLOW_MARKER))

      return follows.map((record: any) => {
        const pageUri = record.value.text.split("\n")[0].replace(PAGE_FOLLOW_MARKER, "").trim()
        return {
          uri: record.uri,
          value: {
            pageUri,
            followedAt: record.value.createdAt,
          },
        }
      })
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

      const text = response.data.value.text
      const lines = text.split("\n")
      const name = lines[0].replace(GROUP_MARKER, "").trim()
      const description = lines[2] || ""
      const privacy = text.includes("Privacy: private") ? "private" : "public"
      const rules = text.match(/Rules: (.+)/)?.[1] || ""

      return {
        uri: uri,
        value: {
          name,
          description,
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

      const text = response.data.value.text
      const lines = text.split("\n")
      const name = lines[0].replace(PAGE_MARKER, "").trim()
      const description = lines[2] || ""
      const category = text.match(/Category: (.+)/)?.[1] || "General"
      const website = text.match(/Website: (.+)/)?.[1] || ""
      const location = text.match(/Location: (.+)/)?.[1] || ""

      return {
        uri: uri,
        value: {
          name,
          description,
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

  // Simplified comment system using regular replies
  async commentOnGroupPost(groupPostUri: string, text: string): Promise<any> {
    try {
      const [repo, collection, rkey] = groupPostUri.replace("at://", "").split("/")
      const postRecord = await atClient["agent"].com.atproto.repo.getRecord({
        repo,
        collection,
        rkey,
      })

      return await atClient.reply(text, groupPostUri, postRecord.data.cid)
    } catch (error) {
      console.error("Failed to comment on group post:", error)
      throw error
    }
  }

  async commentOnPagePost(pagePostUri: string, text: string): Promise<any> {
    try {
      const [repo, collection, rkey] = pagePostUri.replace("at://", "").split("/")
      const postRecord = await atClient["agent"].com.atproto.repo.getRecord({
        repo,
        collection,
        rkey,
      })

      return await atClient.reply(text, pagePostUri, postRecord.data.cid)
    } catch (error) {
      console.error("Failed to comment on page post:", error)
      throw error
    }
  }

  async getGroupPostComments(groupPostUri: string): Promise<any[]> {
    try {
      const thread = await atClient.getPostThread(groupPostUri)
      return thread.thread.replies || []
    } catch (error) {
      console.error("Failed to get group post comments:", error)
      return []
    }
  }

  async getPagePostComments(pagePostUri: string): Promise<any[]> {
    try {
      const thread = await atClient.getPostThread(pagePostUri)
      return thread.thread.replies || []
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

      const groupText = `${GROUP_MARKER} ${data.name}

${data.description}

Privacy: ${data.privacy}
${data.rules ? `Rules: ${data.rules}` : ""}

#FaceskyGroup #NoPromote`

      const rt = new RichText({ text: groupText })
      await rt.detectFacets(atClient["agent"])

      const updatedPost = {
        $type: "app.bsky.feed.post",
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString(),
        labels: {
          $type: "com.atproto.label.defs#selfLabels",
          values: [{ val: "facesky-group" }, { val: "no-promote" }],
        },
      }

      const response = await atClient["agent"].com.atproto.repo.putRecord({
        repo: session.did,
        collection,
        rkey,
        record: updatedPost,
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

      const pageText = `${PAGE_MARKER} ${data.name}

${data.description}

Category: ${data.category}
${data.website ? `Website: ${data.website}` : ""}
${data.location ? `Location: ${data.location}` : ""}

#FaceskyPage #NoPromote`

      const rt = new RichText({ text: pageText })
      await rt.detectFacets(atClient["agent"])

      const updatedPost = {
        $type: "app.bsky.feed.post",
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString(),
        labels: {
          $type: "com.atproto.label.defs#selfLabels",
          values: [{ val: "facesky-page" }, { val: "no-promote" }],
        },
      }

      const response = await atClient["agent"].com.atproto.repo.putRecord({
        repo: session.did,
        collection,
        rkey,
        record: updatedPost,
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
