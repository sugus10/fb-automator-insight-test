export interface FacebookPost {
  id: string;
  createdTime: string; // ISO string
  message: string;
  fullPictureUrl?: string;
  permalinkUrl?: string;
  likes: number;
  comments: number;
  shares: number;
  reach?: number; // impressions unique if available
}

export interface EngagementPoint {
  name: string; // label for chart (e.g., month/day)
  engagement: number;
}

export interface FacebookCredentials {
  pageId: string;
  accessToken: string;
}

export interface FacebookStatsSummary {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
}

