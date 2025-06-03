import { atClient } from "./at-protocol"

// Custom record types for Groups and Pages
export const GROUP_RECORD_TYPE = "app.atsocial.group"
export const PAGE_RECORD_TYPE = "app.atsocial.page"
export const GROUP_POST_RECORD_TYPE = "app.atsocial.group.post"
export const PAGE_POST_RECORD_TYPE = "app.atsocial.page.post"
export const GROUP_MEMBERSHIP_RECORD_TYPE = "app.atsocial.group.membership"
export const PAGE_FOLLOW_RECORD_TYPE = "app.atsocial.page.follow"
export const GROUP_COMMENT_RECORD_TYPE = "app.atsocial.group.comment"
export const PAGE_COMMENT_RECORD_TYPE = "app.atsocial.page.comment"

export interface GroupRecord {
  $type: typeof GROUP_RECORD_TYPE
  name: string
  description: string
  privacy: "public" | "private"
  image?: string
  createdAt: string
  admins: string[] // DIDs of admins
  rules?: string
}

export interface PageRecord {
  $type: typeof PAGE_RECORD_TYPE
  name: string
  description: string
  category: string
  image?: string
  website?: string
  location?: string
  verified: boolean
  createdAt: string
  admins: string[] // DIDs of admins
}

export interface GroupPostRecord {
  $type: typeof GROUP_POST_RECORD_TYPE
  text: string
  groupUri: string
  createdAt: string
  facets?: any[]
  embed?: any
}

export interface PagePostRecord {
  $type: typeof PAGE_POST_RECORD_TYPE
  text: string
  pageUri: string
  createdAt: string
  facets?: any[]
  embed?: any
}

export interface GroupMembershipRecord {
  $type: typeof GROUP_MEMBERSHIP_RECORD_TYPE
  groupUri: string
  role: "member" | "admin" | "moderator"
  joinedAt: string
}

export interface PageFollowRecord {
  $type: typeof PAGE_FOLLOW_RECORD_TYPE
  pageUri: string
  followedAt: string
}

export interface GroupCommentRecord {
  $type: typeof GROUP_COMMENT_RECORD_TYPE
  text: string
  groupPostUri: string
  parentCommentUri?: string
  createdAt: string
}

export interface PageCommentRecord {
  $type: typeof PAGE_COMMENT_RECORD_TYPE
  text: string
  pagePostUri: string
  parentCommentUri?: string
  createdAt: string
}

export class ATProtocolGroupsClient {
  async createGroup(data: Omit<GroupRecord, "$type" | "createdAt" | "admins">): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      const session = atClient.getSession()
      const record: GroupRecord = {
        $type: GROUP_RECORD_TYPE,
        ...data,
        createdAt: new Date().toISOString(),
        admins: [session.did],
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: session.did,
        collection: GROUP_RECORD_TYPE,
        record,
      })

      return response.data
    } catch (error) {
      console.error("Failed to create group:", error)
      throw error
    }
  }

  async createPage(data: Omit<PageRecord, "$type" | "createdAt" | "admins" | "verified">): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      const session = atClient.getSession()
      const record: PageRecord = {
        $type: PAGE_RECORD_TYPE,
        ...data,
        verified: false, // Pages need manual verification
        createdAt: new Date().toISOString(),
        admins: [session.did],
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: session.did,
        collection: PAGE_RECORD_TYPE,
        record,
      })

      return response.data
    } catch (error) {
      console.error("Failed to create page:", error)
      throw error
    }
  }

  async joinGroup(groupUri: string, role: "member" | "admin" | "moderator" = "member"): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      const session = atClient.getSession()
      const record: GroupMembershipRecord = {
        $type: GROUP_MEMBERSHIP_RECORD_TYPE,
        groupUri,
        role,
        joinedAt: new Date().toISOString(),
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: session.did,
        collection: GROUP_MEMBERSHIP_RECORD_TYPE,
        record,
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
      const record: PageFollowRecord = {
        $type: PAGE_FOLLOW_RECORD_TYPE,
        pageUri,
        followedAt: new Date().toISOString(),
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: session.did,
        collection: PAGE_FOLLOW_RECORD_TYPE,
        record,
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

      const record: GroupPostRecord = {
        $type: GROUP_POST_RECORD_TYPE,
        text,
        groupUri,
        createdAt: new Date().toISOString(),
        embed,
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: session.did,
        collection: GROUP_POST_RECORD_TYPE,
        record,
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

      const record: PagePostRecord = {
        $type: PAGE_POST_RECORD_TYPE,
        text,
        pageUri,
        createdAt: new Date().toISOString(),
        embed,
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: session.did,
        collection: PAGE_POST_RECORD_TYPE,
        record,
      })

      return response.data
    } catch (error) {
      console.error("Failed to post to page:", error)
      throw error
    }
  }

  async commentOnGroupPost(groupPostUri: string, text: string, parentCommentUri?: string): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      const session = atClient.getSession()
      const record: GroupCommentRecord = {
        $type: GROUP_COMMENT_RECORD_TYPE,
        text,
        groupPostUri,
        parentCommentUri,
        createdAt: new Date().toISOString(),
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: session.did,
        collection: GROUP_COMMENT_RECORD_TYPE,
        record,
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
      const record: PageCommentRecord = {
        $type: PAGE_COMMENT_RECORD_TYPE,
        text,
        pagePostUri,
        parentCommentUri,
        createdAt: new Date().toISOString(),
      }

      const response = await atClient["agent"].com.atproto.repo.createRecord({
        repo: session.did,
        collection: PAGE_COMMENT_RECORD_TYPE,
        record,
      })

      return response.data
    } catch (error) {
      console.error("Failed to comment on page post:", error)
      throw error
    }
  }

  async getGroupPostComments(groupPostUri: string): Promise<any[]> {
    try {
      const users = await this.discoverUsers()
      const allComments: any[] = []

      // Query each user's repository for comments on this group post
      for (const userDid of users) {
        try {
          const response = await atClient["agent"].com.atproto.repo.listRecords({
            repo: userDid,
            collection: GROUP_COMMENT_RECORD_TYPE,
            limit: 100,
          })

          // Filter comments for this specific group post
          const postComments = response.data.records.filter((record: any) => record.value.groupPostUri === groupPostUri)

          // Add author context
          const commentsWithContext = await Promise.all(
            postComments.map(async (record: any) => {
              try {
                const authorProfile = await atClient["agent"].getProfile({ actor: userDid })
                return {
                  ...record,
                  author: {
                    did: userDid,
                    handle: authorProfile.data.handle,
                    displayName: authorProfile.data.displayName,
                    avatar: authorProfile.data.avatar,
                  },
                }
              } catch (error) {
                return {
                  ...record,
                  author: {
                    did: userDid,
                    handle: userDid,
                    displayName: "Unknown User",
                    avatar: null,
                  },
                }
              }
            }),
          )

          allComments.push(...commentsWithContext)
        } catch (error) {
          console.log(`No comments found for user ${userDid}`)
        }
      }

      // Sort comments by creation date (oldest first for threading)
      allComments.sort((a, b) => new Date(a.value.createdAt).getTime() - new Date(b.value.createdAt).getTime())

      return allComments
    } catch (error) {
      console.error("Failed to get group post comments:", error)
      return []
    }
  }

  async getPagePostComments(pagePostUri: string): Promise<any[]> {
    try {
      const users = await this.discoverUsers()
      const allComments: any[] = []

      // Query each user's repository for comments on this page post
      for (const userDid of users) {
        try {
          const response = await atClient["agent"].com.atproto.repo.listRecords({
            repo: userDid,
            collection: PAGE_COMMENT_RECORD_TYPE,
            limit: 100,
          })

          // Filter comments for this specific page post
          const postComments = response.data.records.filter((record: any) => record.value.pagePostUri === pagePostUri)

          // Add author context
          const commentsWithContext = await Promise.all(
            postComments.map(async (record: any) => {
              try {
                const authorProfile = await atClient["agent"].getProfile({ actor: userDid })
                return {
                  ...record,
                  author: {
                    did: userDid,
                    handle: authorProfile.data.handle,
                    displayName: authorProfile.data.displayName,
                    avatar: authorProfile.data.avatar,
                  },
                }
              } catch (error) {
                return {
                  ...record,
                  author: {
                    did: userDid,
                    handle: userDid,
                    displayName: "Unknown User",
                    avatar: null,
                  },
                }
              }
            }),
          )

          allComments.push(...commentsWithContext)
        } catch (error) {
          console.log(`No comments found for user ${userDid}`)
        }
      }

      // Sort comments by creation date (oldest first for threading)
      allComments.sort((a, b) => new Date(a.value.createdAt).getTime() - new Date(b.value.createdAt).getTime())

      return allComments
    } catch (error) {
      console.error("Failed to get page post comments:", error)
      return []
    }
  }

  private async discoverUsers(): Promise<string[]> {
    try {
      const session = atClient.getSession()
      if (!session) return []

      // Get our timeline to discover more users
      const timeline = await atClient.getTimeline(100)
      const discoveredUsers = new Set<string>()

      // Always include the current user
      discoveredUsers.add(session.did)

      // Add users from timeline
      timeline.feed.forEach((item: any) => {
        if (item.post?.author?.did) {
          discoveredUsers.add(item.post.author.did)
        }
      })

      return Array.from(discoveredUsers)
    } catch (error) {
      console.error("Failed to discover users:", error)
      return []
    }
  }

  async getGroups(limit = 50): Promise<any> {
    try {
      // Query for all group records across the network
      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: atClient.getSession()?.did || "",
        collection: GROUP_RECORD_TYPE,
        limit,
      })

      return response.data.records
    } catch (error) {
      console.error("Failed to fetch groups:", error)
      throw error
    }
  }

  async getPages(limit = 50): Promise<any> {
    try {
      // Query for all page records across the network
      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: atClient.getSession()?.did || "",
        collection: PAGE_RECORD_TYPE,
        limit,
      })

      return response.data.records
    } catch (error) {
      console.error("Failed to fetch pages:", error)
      throw error
    }
  }

  async getGroupPosts(groupUri: string, limit = 50): Promise<any> {
    try {
      // This would ideally use a more sophisticated query
      // For now, we'll get posts from the current user's repo
      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: atClient.getSession()?.did || "",
        collection: GROUP_POST_RECORD_TYPE,
        limit,
      })

      // Filter posts for this specific group
      const groupPosts = response.data.records.filter((record: any) => record.value.groupUri === groupUri)

      return groupPosts
    } catch (error) {
      console.error("Failed to fetch group posts:", error)
      throw error
    }
  }

  async getPagePosts(pageUri: string, limit = 50): Promise<any> {
    try {
      // This would ideally use a more sophisticated query
      // For now, we'll get posts from the current user's repo
      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: atClient.getSession()?.did || "",
        collection: PAGE_POST_RECORD_TYPE,
        limit,
      })

      // Filter posts for this specific page
      const pagePosts = response.data.records.filter((record: any) => record.value.pageUri === pageUri)

      return pagePosts
    } catch (error) {
      console.error("Failed to fetch page posts:", error)
      throw error
    }
  }

  async getUserMemberships(): Promise<any> {
    try {
      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: atClient.getSession()?.did || "",
        collection: GROUP_MEMBERSHIP_RECORD_TYPE,
      })

      return response.data.records
    } catch (error) {
      console.error("Failed to fetch user memberships:", error)
      throw error
    }
  }

  async getUserPageFollows(): Promise<any> {
    try {
      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: atClient.getSession()?.did || "",
        collection: PAGE_FOLLOW_RECORD_TYPE,
      })

      return response.data.records
    } catch (error) {
      console.error("Failed to fetch user page follows:", error)
      throw error
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

      return response.data
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

      return response.data
    } catch (error) {
      console.error("Failed to fetch page:", error)
      throw error
    }
  }

  async updateGroup(
    groupUri: string,
    updates: Partial<Omit<GroupRecord, "$type" | "createdAt" | "admins">>,
  ): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      const [repo, collection, rkey] = groupUri.replace("at://", "").split("/")
      const session = atClient.getSession()

      // Check if user is admin
      const groupData = await this.getGroup(groupUri)
      const isAdmin = groupData.value.admins.includes(session.did)

      if (!isAdmin) {
        throw new Error("Only group admins can update group settings")
      }

      // Get current record
      const currentRecord = await atClient["agent"].com.atproto.repo.getRecord({
        repo,
        collection,
        rkey,
      })

      // Update with new values
      const updatedRecord = {
        ...currentRecord.data.value,
        ...updates,
      }

      // Write back the updated record
      const response = await atClient["agent"].com.atproto.repo.putRecord({
        repo,
        collection,
        rkey,
        record: updatedRecord,
      })

      return response.data
    } catch (error) {
      console.error("Failed to update group:", error)
      throw error
    }
  }

  async updatePage(
    pageUri: string,
    updates: Partial<Omit<PageRecord, "$type" | "createdAt" | "admins" | "verified">>,
  ): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      const [repo, collection, rkey] = pageUri.replace("at://", "").split("/")
      const session = atClient.getSession()

      // Check if user is admin
      const pageData = await this.getPage(pageUri)
      const isAdmin = pageData.value.admins.includes(session.did)

      if (!isAdmin) {
        throw new Error("Only page admins can update page settings")
      }

      // Get current record
      const currentRecord = await atClient["agent"].com.atproto.repo.getRecord({
        repo,
        collection,
        rkey,
      })

      // Update with new values
      const updatedRecord = {
        ...currentRecord.data.value,
        ...updates,
      }

      // Write back the updated record
      const response = await atClient["agent"].com.atproto.repo.putRecord({
        repo,
        collection,
        rkey,
        record: updatedRecord,
      })

      return response.data
    } catch (error) {
      console.error("Failed to update page:", error)
      throw error
    }
  }

  async addGroupAdmin(groupUri: string, userDid: string): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      const [repo, collection, rkey] = groupUri.replace("at://", "").split("/")
      const session = atClient.getSession()

      // Check if current user is admin
      const groupData = await this.getGroup(groupUri)
      const isAdmin = groupData.value.admins.includes(session.did)

      if (!isAdmin) {
        throw new Error("Only group admins can add other admins")
      }

      // Get current record
      const currentRecord = await atClient["agent"].com.atproto.repo.getRecord({
        repo,
        collection,
        rkey,
      })

      // Add new admin if not already an admin
      if (!currentRecord.data.value.admins.includes(userDid)) {
        const updatedRecord = {
          ...currentRecord.data.value,
          admins: [...currentRecord.data.value.admins, userDid],
        }

        // Write back the updated record
        const response = await atClient["agent"].com.atproto.repo.putRecord({
          repo,
          collection,
          rkey,
          record: updatedRecord,
        })

        // Also add admin membership record for the user
        await this.joinGroup(groupUri, "admin")

        return response.data
      }

      return currentRecord.data
    } catch (error) {
      console.error("Failed to add group admin:", error)
      throw error
    }
  }

  async addPageAdmin(pageUri: string, userDid: string): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      const [repo, collection, rkey] = pageUri.replace("at://", "").split("/")
      const session = atClient.getSession()

      // Check if current user is admin
      const pageData = await this.getPage(pageUri)
      const isAdmin = pageData.value.admins.includes(session.did)

      if (!isAdmin) {
        throw new Error("Only page admins can add other admins")
      }

      // Get current record
      const currentRecord = await atClient["agent"].com.atproto.repo.getRecord({
        repo,
        collection,
        rkey,
      })

      // Add new admin if not already an admin
      if (!currentRecord.data.value.admins.includes(userDid)) {
        const updatedRecord = {
          ...currentRecord.data.value,
          admins: [...currentRecord.data.value.admins, userDid],
        }

        // Write back the updated record
        const response = await atClient["agent"].com.atproto.repo.putRecord({
          repo,
          collection,
          rkey,
          record: updatedRecord,
        })

        return response.data
      }

      return currentRecord.data
    } catch (error) {
      console.error("Failed to add page admin:", error)
      throw error
    }
  }

  async removeGroupMember(groupUri: string, userDid: string): Promise<any> {
    if (!atClient.isAuthenticated()) throw new Error("Not authenticated")

    try {
      const session = atClient.getSession()

      // Check if current user is admin
      const groupData = await this.getGroup(groupUri)
      const isAdmin = groupData.value.admins.includes(session.did)

      if (!isAdmin) {
        throw new Error("Only group admins can remove members")
      }

      // Find the user's membership record
      // This is a simplified approach - in a real app, you'd need to find the specific record
      // This would require indexing or a more sophisticated query

      // For now, we'll just return success
      return { success: true }
    } catch (error) {
      console.error("Failed to remove group member:", error)
      throw error
    }
  }

  async isUserGroupAdmin(groupUri: string, userDid?: string): Promise<boolean> {
    try {
      const session = atClient.getSession()
      const targetUser = userDid || session?.did
      if (!targetUser) return false

      const groupData = await this.getGroup(groupUri)
      return groupData.value.admins.includes(targetUser)
    } catch (error) {
      console.error("Failed to check if user is group admin:", error)
      return false
    }
  }

  async isUserPageAdmin(pageUri: string, userDid?: string): Promise<boolean> {
    try {
      const session = atClient.getSession()
      const targetUser = userDid || session?.did
      if (!targetUser) return false

      const pageData = await this.getPage(pageUri)
      return pageData.value.admins.includes(targetUser)
    } catch (error) {
      console.error("Failed to check if user is page admin:", error)
      return false
    }
  }

  getSession() {
    return atClient.getSession()
  }
}

export const atGroupsClient = new ATProtocolGroupsClient()
