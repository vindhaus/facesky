// Mock data for alpha testing since custom record types don't exist in AT Protocol yet
export const MOCK_GROUPS = [
  {
    uri: "at://did:plc:mock1/app.atsocial.group/group1",
    cid: "mock-cid-1",
    value: {
      $type: "app.atsocial.group",
      name: "Web Developers",
      description: "A community for web developers to share knowledge and collaborate on projects.",
      privacy: "public",
      image: "/placeholder.svg?height=200&width=300",
      createdAt: "2024-01-15T10:00:00Z",
      admins: ["did:plc:mock1"],
      rules: "Be respectful, share knowledge, and help each other grow.",
    },
    creatorDid: "did:plc:mock1",
    creatorHandle: "webdev.bsky.social",
    creatorDisplayName: "WebDev Community",
    memberCount: 156,
    isJoined: false,
    isAdmin: false,
  },
  {
    uri: "at://did:plc:mock2/app.atsocial.group/group2",
    cid: "mock-cid-2",
    value: {
      $type: "app.atsocial.group",
      name: "AT Protocol Enthusiasts",
      description: "Discussing the future of decentralized social media and the AT Protocol.",
      privacy: "public",
      image: "/placeholder.svg?height=200&width=300",
      createdAt: "2024-01-20T14:30:00Z",
      admins: ["did:plc:mock2"],
      rules: "Stay on topic, be constructive, and respect different viewpoints.",
    },
    creatorDid: "did:plc:mock2",
    creatorHandle: "atproto.bsky.social",
    creatorDisplayName: "AT Protocol Fan",
    memberCount: 89,
    isJoined: false,
    isAdmin: false,
  },
  {
    uri: "at://did:plc:mock3/app.atsocial.group/group3",
    cid: "mock-cid-3",
    value: {
      $type: "app.atsocial.group",
      name: "React Developers",
      description: "Everything React - hooks, components, state management, and best practices.",
      privacy: "public",
      image: "/placeholder.svg?height=200&width=300",
      createdAt: "2024-01-25T09:15:00Z",
      admins: ["did:plc:mock3"],
      rules: "Share code responsibly, help beginners, and keep discussions React-focused.",
    },
    creatorDid: "did:plc:mock3",
    creatorHandle: "reactdev.bsky.social",
    creatorDisplayName: "React Developer",
    memberCount: 234,
    isJoined: true,
    isAdmin: false,
  },
]

export const MOCK_PAGES = [
  {
    uri: "at://did:plc:mock4/app.atsocial.page/page1",
    cid: "mock-cid-4",
    value: {
      $type: "app.atsocial.page",
      name: "Vercel",
      description:
        "The platform for frontend developers, providing the speed and reliability innovators need to create at the moment of inspiration.",
      category: "Technology",
      image: "/placeholder.svg?height=200&width=300",
      website: "https://vercel.com",
      location: "San Francisco, CA",
      verified: true,
      createdAt: "2024-01-10T08:00:00Z",
      admins: ["did:plc:mock4"],
    },
    creatorDid: "did:plc:mock4",
    creatorHandle: "vercel.bsky.social",
    creatorDisplayName: "Vercel",
    followerCount: 1250,
    isFollowing: false,
    isAdmin: false,
  },
  {
    uri: "at://did:plc:mock5/app.atsocial.page/page2",
    cid: "mock-cid-5",
    value: {
      $type: "app.atsocial.page",
      name: "Next.js",
      description:
        "The React Framework for the Web. Used by some of the world's largest companies, Next.js enables you to create full-stack web applications.",
      category: "Technology",
      image: "/placeholder.svg?height=200&width=300",
      website: "https://nextjs.org",
      location: "Global",
      verified: true,
      createdAt: "2024-01-12T12:00:00Z",
      admins: ["did:plc:mock5"],
    },
    creatorDid: "did:plc:mock5",
    creatorHandle: "nextjs.bsky.social",
    creatorDisplayName: "Next.js",
    followerCount: 2100,
    isFollowing: true,
    isAdmin: false,
  },
  {
    uri: "at://did:plc:mock6/app.atsocial.page/page3",
    cid: "mock-cid-6",
    value: {
      $type: "app.atsocial.page",
      name: "Local Coffee Shop",
      description:
        "Your neighborhood coffee shop serving the best artisan coffee and pastries. Come join our community!",
      category: "Food & Beverage",
      image: "/placeholder.svg?height=200&width=300",
      website: "https://localcoffee.example",
      location: "Downtown, Your City",
      verified: false,
      createdAt: "2024-01-18T07:30:00Z",
      admins: ["did:plc:mock6"],
    },
    creatorDid: "did:plc:mock6",
    creatorHandle: "localcoffee.bsky.social",
    creatorDisplayName: "Local Coffee Shop",
    followerCount: 45,
    isFollowing: false,
    isAdmin: false,
  },
]

export const MOCK_GROUP_POSTS = [
  {
    uri: "at://did:plc:mock1/app.atsocial.group.post/post1",
    cid: "mock-post-cid-1",
    value: {
      $type: "app.atsocial.group.post",
      text: "Just discovered this amazing new CSS feature! Grid subgrid is finally getting better browser support. Who else is excited about this? 🎉",
      groupUri: "at://did:plc:mock1/app.atsocial.group/group1",
      createdAt: "2024-01-26T15:30:00Z",
    },
    author: {
      did: "did:plc:mock7",
      handle: "cssguru.bsky.social",
      displayName: "CSS Guru",
      avatar: "/placeholder.svg",
    },
  },
  {
    uri: "at://did:plc:mock2/app.atsocial.group.post/post2",
    cid: "mock-post-cid-2",
    value: {
      $type: "app.atsocial.group.post",
      text: "The latest AT Protocol updates are looking really promising. The federation features are going to change everything!",
      groupUri: "at://did:plc:mock2/app.atsocial.group/group2",
      createdAt: "2024-01-26T14:15:00Z",
    },
    author: {
      did: "did:plc:mock8",
      handle: "protocol.bsky.social",
      displayName: "Protocol Explorer",
      avatar: "/placeholder.svg",
    },
  },
]

export const MOCK_PAGE_POSTS = [
  {
    uri: "at://did:plc:mock4/app.atsocial.page.post/post1",
    cid: "mock-page-post-cid-1",
    value: {
      $type: "app.atsocial.page.post",
      text: "🚀 Excited to announce our new Edge Runtime features! Deploy faster than ever with improved cold start times.",
      pageUri: "at://did:plc:mock4/app.atsocial.page/page1",
      createdAt: "2024-01-26T16:00:00Z",
    },
    author: {
      did: "did:plc:mock4",
      handle: "vercel.bsky.social",
      displayName: "Vercel",
      avatar: "/placeholder.svg",
    },
  },
]

export const MOCK_COMMENTS = [
  {
    uri: "at://did:plc:mock9/app.atsocial.group.comment/comment1",
    cid: "mock-comment-cid-1",
    value: {
      $type: "app.atsocial.group.comment",
      text: "This is amazing! I've been waiting for subgrid support for years. Finally can build those complex layouts properly.",
      groupPostUri: "at://did:plc:mock1/app.atsocial.group.post/post1",
      createdAt: "2024-01-26T15:45:00Z",
    },
    author: {
      did: "did:plc:mock9",
      handle: "layoutmaster.bsky.social",
      displayName: "Layout Master",
      avatar: "/placeholder.svg",
    },
  },
]

// Helper function to check if we're in demo mode
export function isDemoMode(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname.includes("vercel.app") ||
      process.env.NODE_ENV === "development")
  )
}

// Helper to get current user's mock data
export function getCurrentUserMockData(userDid: string) {
  return {
    groups: MOCK_GROUPS.map((group) => ({
      ...group,
      isJoined: Math.random() > 0.7, // Randomly join some groups
      isAdmin: group.creatorDid === userDid,
    })),
    pages: MOCK_PAGES.map((page) => ({
      ...page,
      isFollowing: Math.random() > 0.6, // Randomly follow some pages
      isAdmin: page.creatorDid === userDid,
    })),
  }
}
