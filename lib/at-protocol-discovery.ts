import { atClient } from "./at-protocol"
import {
  GROUP_RECORD_TYPE,
  PAGE_RECORD_TYPE,
  GROUP_POST_RECORD_TYPE,
  PAGE_POST_RECORD_TYPE,
  GROUP_MEMBERSHIP_RECORD_TYPE,
  PAGE_FOLLOW_RECORD_TYPE,
} from "./at-protocol-groups"

export class ATProtocolDiscoveryClient {
  private knownUsers: Set<string> = new Set()

  // In a real implementation, this would connect to the AT Protocol firehose
  // For now, we'll use a simplified approach with known users
  async discoverUsers(): Promise<string[]> {
    try {
      // This would ideally use the AT Protocol firehose or a discovery service
      // For now, we'll use a combination of:
      // 1. Users we follow
      // 2. Users who follow us
      // 3. Users mentioned in our timeline

      const session = atClient.getSession()
      if (!session) return []

      // Get our profile to find followers/following
      const profile = await atClient["agent"].getProfile({ actor: session.did })

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

      // In a real app, you'd also:
      // - Connect to AT Protocol firehose
      // - Use a discovery service
      // - Crawl the network more systematically

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

      // Query each discovered user's repository for groups
      for (const userDid of users) {
        try {
          const response = await atClient["agent"].com.atproto.repo.listRecords({
            repo: userDid,
            collection: GROUP_RECORD_TYPE,
            limit: 50,
          })

          // Add user context to each group
          const groupsWithContext = response.data.records.map((record: any) => ({
            ...record,
            creatorDid: userDid,
            creatorHandle: null, // We'll resolve this separately
          }))

          allGroups.push(...groupsWithContext)
        } catch (error) {
          // User might not have any groups or repo might be private
          console.log(`No groups found for user ${userDid}`)
        }
      }

      // Resolve creator handles
      await this.resolveCreatorHandles(allGroups)

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

      // Query each discovered user's repository for pages
      for (const userDid of users) {
        try {
          const response = await atClient["agent"].com.atproto.repo.listRecords({
            repo: userDid,
            collection: PAGE_RECORD_TYPE,
            limit: 50,
          })

          // Add user context to each page
          const pagesWithContext = response.data.records.map((record: any) => ({
            ...record,
            creatorDid: userDid,
            creatorHandle: null, // We'll resolve this separately
          }))

          allPages.push(...pagesWithContext)
        } catch (error) {
          // User might not have any pages or repo might be private
          console.log(`No pages found for user ${userDid}`)
        }
      }

      // Resolve creator handles
      await this.resolveCreatorHandles(allPages)

      return allPages
    } catch (error) {
      console.error("Failed to discover pages across network:", error)
      return []
    }
  }

  async getGroupPostsAcrossNetwork(groupUri: string): Promise<any[]> {
    try {
      const users = await this.discoverUsers()
      const allPosts: any[] = []

      // Query each user's repository for posts to this group
      for (const userDid of users) {
        try {
          const response = await atClient["agent"].com.atproto.repo.listRecords({
            repo: userDid,
            collection: GROUP_POST_RECORD_TYPE,
            limit: 50,
          })

          // Filter posts for this specific group
          const groupPosts = response.data.records.filter((record: any) => record.value.groupUri === groupUri)

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

      // Query each user's repository for posts to this page
      for (const userDid of users) {
        try {
          const response = await atClient["agent"].com.atproto.repo.listRecords({
            repo: userDid,
            collection: PAGE_POST_RECORD_TYPE,
            limit: 50,
          })

          // Filter posts for this specific page
          const pagePosts = response.data.records.filter((record: any) => record.value.pageUri === pageUri)

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

      // Count memberships across all users
      for (const userDid of users) {
        try {
          const response = await atClient["agent"].com.atproto.repo.listRecords({
            repo: userDid,
            collection: GROUP_MEMBERSHIP_RECORD_TYPE,
            limit: 100,
          })

          const memberships = response.data.records.filter((record: any) => record.value.groupUri === groupUri)

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

      // Count follows across all users
      for (const userDid of users) {
        try {
          const response = await atClient["agent"].com.atproto.repo.listRecords({
            repo: userDid,
            collection: PAGE_FOLLOW_RECORD_TYPE,
            limit: 100,
          })

          const follows = response.data.records.filter((record: any) => record.value.pageUri === pageUri)

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
        collection: GROUP_MEMBERSHIP_RECORD_TYPE,
        limit: 100,
      })

      return response.data.records.some((record: any) => record.value.groupUri === groupUri)
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
        collection: PAGE_FOLLOW_RECORD_TYPE,
        limit: 100,
      })

      return response.data.records.some((record: any) => record.value.pageUri === pageUri)
    } catch (error) {
      console.error("Failed to check page follow:", error)
      return false
    }
  }

  private async resolveCreatorHandles(items: any[]): Promise<void> {
    // Resolve creator handles in batches to avoid rate limiting
    const batchSize = 10
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (item) => {
          try {
            const profile = await atClient["agent"].getProfile({ actor: item.creatorDid })
            item.creatorHandle = profile.data.handle
            item.creatorDisplayName = profile.data.displayName
            item.creatorAvatar = profile.data.avatar
          } catch (error) {
            item.creatorHandle = item.creatorDid
            item.creatorDisplayName = "Unknown User"
            item.creatorAvatar = null
          }
        }),
      )
    }
  }

  async searchGroups(query: string): Promise<any[]> {
    try {
      const allGroups = await this.discoverGroupsAcrossNetwork()

      // Simple text search - in a real app you'd want more sophisticated search
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

      // Simple text search - in a real app you'd want more sophisticated search
      return allPages.filter((page) => {
        const searchText = `${page.value.name} ${page.value.description} ${page.value.category}`.toLowerCase()
        return searchText.includes(query.toLowerCase())
      })
    } catch (error) {
      console.error("Failed to search pages:", error)
      return []
    }
  }
}

export const atDiscoveryClient = new ATProtocolDiscoveryClient()
