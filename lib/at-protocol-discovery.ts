import { atClient } from "./at-protocol"
import { GROUP_POST_PREFIX, PAGE_POST_PREFIX, POST_RECORD_TYPE } from "./at-protocol-groups"

export class ATProtocolDiscoveryClient {
  async discoverUsers(): Promise<string[]> {
    try {
      const session = atClient.getSession()
      if (!session) return []

      // Get our timeline to discover users
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

  async discoverGroupsAcrossNetwork(): Promise<any[]> {
    try {
      const users = await this.discoverUsers()
      const allGroups: any[] = []

      // Query each discovered user's repository for group posts
      for (const userDid of users) {
        try {
          const response = await atClient["agent"].com.atproto.repo.listRecords({
            repo: userDid,
            collection: POST_RECORD_TYPE,
            limit: 50,
          })

          // Filter for group definition posts
          const groupPosts = response.data.records.filter(
            (record: any) => record.value.text && record.value.text.startsWith(GROUP_POST_PREFIX),
          )

          // Transform into group format with creator info
          const groupsWithContext = await Promise.all(
            groupPosts.map(async (record: any) => {
              try {
                const authorProfile = await atClient["agent"].getProfile({ actor: userDid })
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
                    creator: userDid,
                  },
                  creatorDid: userDid,
                  creatorHandle: authorProfile.data.handle,
                  creatorDisplayName: authorProfile.data.displayName,
                  creatorAvatar: authorProfile.data.avatar,
                  memberCount: 1,
                  isJoined: false,
                }
              } catch (error) {
                return null
              }
            }),
          )

          allGroups.push(...groupsWithContext.filter(Boolean))
        } catch (error) {
          console.log(`No groups found for user ${userDid}`)
        }
      }

      return allGroups
    } catch (error) {
      console.error("Failed to discover groups across network:", error)
      return []
    }
  }

  async discoverPagesAcrossNetwork(): Promise<any[]> {
    try {
      const users = await this.discoverUsers()
      const allPages: any[] = []

      // Query each discovered user's repository for page posts
      for (const userDid of users) {
        try {
          const response = await atClient["agent"].com.atproto.repo.listRecords({
            repo: userDid,
            collection: POST_RECORD_TYPE,
            limit: 50,
          })

          // Filter for page definition posts
          const pagePosts = response.data.records.filter(
            (record: any) => record.value.text && record.value.text.startsWith(PAGE_POST_PREFIX),
          )

          // Transform into page format with creator info
          const pagesWithContext = await Promise.all(
            pagePosts.map(async (record: any) => {
              try {
                const authorProfile = await atClient["agent"].getProfile({ actor: userDid })
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
                    category: "General",
                    createdAt: record.value.createdAt,
                    creator: userDid,
                  },
                  creatorDid: userDid,
                  creatorHandle: authorProfile.data.handle,
                  creatorDisplayName: authorProfile.data.displayName,
                  creatorAvatar: authorProfile.data.avatar,
                  followerCount: 1,
                  isFollowing: false,
                }
              } catch (error) {
                return null
              }
            }),
          )

          allPages.push(...pagesWithContext.filter(Boolean))
        } catch (error) {
          console.log(`No pages found for user ${userDid}`)
        }
      }

      return allPages
    } catch (error) {
      console.error("Failed to discover pages across network:", error)
      return []
    }
  }

  async searchGroups(query: string): Promise<any[]> {
    try {
      const allGroups = await this.discoverGroupsAcrossNetwork()
      return allGroups.filter((group) => {
        const searchText = `${group.value.name} ${group.value.description}`.toLowerCase()
        return searchText.includes(query.toLowerCase())
      })
    } catch (error) {
      console.error("Failed to search groups:", error)
      return []
    }
  }

  async searchPages(query: string): Promise<any[]> {
    try {
      const allPages = await this.discoverPagesAcrossNetwork()
      return allPages.filter((page) => {
        const searchText = `${page.value.name} ${page.value.description}`.toLowerCase()
        return searchText.includes(query.toLowerCase())
      })
    } catch (error) {
      console.error("Failed to search pages:", error)
      return []
    }
  }

  async getGroupPostsAcrossNetwork(groupUri: string): Promise<any[]> {
    try {
      const users = await this.discoverUsers()
      const allPosts: any[] = []

      // Query each user's repository for posts that reference this group
      for (const userDid of users) {
        try {
          const response = await atClient["agent"].com.atproto.repo.listRecords({
            repo: userDid,
            collection: "app.bsky.feed.post",
            limit: 50,
          })

          // Filter posts that reference this group
          const groupPosts = response.data.records.filter(
            (record: any) => record.value.text && record.value.text.includes(groupUri),
          )

          // Add author context
          const postsWithContext = await Promise.all(
            groupPosts.map(async (record: any) => {
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

          allPosts.push(...postsWithContext)
        } catch (error) {
          console.log(`No group posts found for user ${userDid}`)
        }
      }

      // Sort posts by creation date (newest first)
      allPosts.sort((a, b) => new Date(b.value.createdAt).getTime() - new Date(a.value.createdAt).getTime())

      return allPosts
    } catch (error) {
      console.error("Failed to get group posts across network:", error)
      return []
    }
  }

  async getPagePostsAcrossNetwork(pageUri: string): Promise<any[]> {
    try {
      const users = await this.discoverUsers()
      const allPosts: any[] = []

      // Query each user's repository for posts that reference this page
      for (const userDid of users) {
        try {
          const response = await atClient["agent"].com.atproto.repo.listRecords({
            repo: userDid,
            collection: "app.bsky.feed.post",
            limit: 50,
          })

          // Filter posts that reference this page
          const pagePosts = response.data.records.filter(
            (record: any) => record.value.text && record.value.text.includes(pageUri),
          )

          // Add author context
          const postsWithContext = await Promise.all(
            pagePosts.map(async (record: any) => {
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

          allPosts.push(...postsWithContext)
        } catch (error) {
          console.log(`No page posts found for user ${userDid}`)
        }
      }

      // Sort posts by creation date (newest first)
      allPosts.sort((a, b) => new Date(b.value.createdAt).getTime() - new Date(a.value.createdAt).getTime())

      return allPosts
    } catch (error) {
      console.error("Failed to get page posts across network:", error)
      return []
    }
  }

  async getGroupMembersCount(groupUri: string): Promise<number> {
    try {
      const users = await this.discoverUsers()
      let memberCount = 0

      // Count membership posts across all users
      for (const userDid of users) {
        try {
          const response = await atClient["agent"].com.atproto.repo.listRecords({
            repo: userDid,
            collection: "app.bsky.feed.post",
            limit: 100,
          })

          const memberships = response.data.records.filter(
            (record: any) =>
              record.value.text &&
              record.value.text.startsWith("👥 JOINED GROUP:") &&
              record.value.text.includes(groupUri),
          )

          memberCount += memberships.length
        } catch (error) {
          // User might not have any memberships
        }
      }

      return memberCount
    } catch (error) {
      console.error("Failed to count group members:", error)
      return 0
    }
  }

  async getPageFollowersCount(pageUri: string): Promise<number> {
    try {
      const users = await this.discoverUsers()
      let followerCount = 0

      // Count follow posts across all users
      for (const userDid of users) {
        try {
          const response = await atClient["agent"].com.atproto.repo.listRecords({
            repo: userDid,
            collection: "app.bsky.feed.post",
            limit: 100,
          })

          const follows = response.data.records.filter(
            (record: any) =>
              record.value.text &&
              record.value.text.startsWith("👁️ FOLLOWING PAGE:") &&
              record.value.text.includes(pageUri),
          )

          followerCount += follows.length
        } catch (error) {
          // User might not have any follows
        }
      }

      return followerCount
    } catch (error) {
      console.error("Failed to count page followers:", error)
      return 0
    }
  }

  async isUserMemberOfGroup(groupUri: string, userDid?: string): Promise<boolean> {
    try {
      const session = atClient.getSession()
      const targetUser = userDid || session?.did
      if (!targetUser) return false

      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: targetUser,
        collection: "app.bsky.feed.post",
        limit: 100,
      })

      return response.data.records.some(
        (record: any) =>
          record.value.text && record.value.text.startsWith("👥 JOINED GROUP:") && record.value.text.includes(groupUri),
      )
    } catch (error) {
      console.error("Failed to check group membership:", error)
      return false
    }
  }

  async isUserFollowingPage(pageUri: string, userDid?: string): Promise<boolean> {
    try {
      const session = atClient.getSession()
      const targetUser = userDid || session?.did
      if (!targetUser) return false

      const response = await atClient["agent"].com.atproto.repo.listRecords({
        repo: targetUser,
        collection: "app.bsky.feed.post",
        limit: 100,
      })

      return response.data.records.some(
        (record: any) =>
          record.value.text && record.value.text.startsWith("👁️ FOLLOWING PAGE:") && record.value.text.includes(pageUri),
      )
    } catch (error) {
      console.error("Failed to check page follow:", error)
      return false
    }
  }
}

export const atDiscoveryClient = new ATProtocolDiscoveryClient()
