import { FacebookPost, FacebookStatsSummary, EngagementPoint } from "@/types/facebook";

// Prefer configured version; default to latest tested version
const GRAPH_VERSION = import.meta.env.VITE_FB_GRAPH_VERSION || "v23.0";
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;

function buildUrl(path: string, params: Record<string, string | number | undefined>) {
  const url = new URL(`${GRAPH_BASE_URL}/${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

export async function fetchPagePosts(args: {
  pageId: string;
  accessToken: string;
  limit?: number;
  sinceUnix?: number; // unix timestamp seconds
  untilUnix?: number; // unix timestamp seconds
}): Promise<FacebookPost[]> {
  console.log("🔍 Fetching Facebook posts for page:", args.pageId, "on", GRAPH_VERSION);
  
  // Debug: Check token type first
  try {
    const tokenDebugUrl = `https://graph.facebook.com/debug_token?input_token=${args.accessToken}&access_token=${args.accessToken}`;
    console.log("🔍 Debugging token type...");
    const debugResponse = await fetch(tokenDebugUrl);
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log("🔍 Token debug info:", {
        type: debugData.data?.type,
        scopes: debugData.data?.scopes,
        appId: debugData.data?.app_id,
        userId: debugData.data?.user_id,
        pageId: debugData.data?.page_id
      });
    }
  } catch (debugError) {
    console.log("🔍 Could not debug token:", debugError);
  }
  
  const fields = [
    "id",
    "created_time",
    "message",
    "full_picture",
    "permalink_url",
    "shares",
    "insights.metric(post_impressions_unique)",
    // reactions & comments summary
    "reactions.summary(total_count).limit(0)",
    "comments.summary(total_count).limit(0)",
  ].join(",");

  const url = buildUrl(`${args.pageId}/posts`, {
    fields,
    access_token: args.accessToken,
    limit: args.limit ?? 100,
    since: args.sinceUnix,
    until: args.untilUnix,
  });

  console.log("📡 Making request to:", url.replace(args.accessToken, "[TOKEN_HIDDEN]"));

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      mode: "cors",
    } as RequestInit);
    console.log("📊 Response status:", res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Facebook API error:", errorText);
      throw new Error(`Facebook API error: ${res.status} ${res.statusText} - ${errorText}`);
    }
    
    const json = await res.json();
    console.log("📦 Raw response:", json);
    
    if (json.error) {
      console.error("❌ Facebook API returned error:", json.error);
      throw new Error(`Facebook API error: ${json.error.message} (${json.error.code})`);
    }

    const posts: FacebookPost[] = (json.data ?? []).map((p: any) => {
      const reach = Array.isArray(p.insights?.data)
        ? p.insights.data.find((i: any) => i.name === "post_impressions_unique")?.values?.[0]?.value
        : undefined;
      const sharesCount = typeof p.shares?.count === "number" ? p.shares.count : 0;
      const likesCount = p.reactions?.summary?.total_count ?? 0;
      const commentsCount = p.comments?.summary?.total_count ?? 0;
      
      const post: FacebookPost = {
        id: p.id,
        createdTime: p.created_time,
        message: p.message ?? "",
        fullPictureUrl: p.full_picture,
        permalinkUrl: p.permalink_url,
        likes: likesCount,
        comments: commentsCount,
        shares: sharesCount,
        reach,
      };
      
      console.log("📝 Processed post:", { id: post.id, message: post.message.substring(0, 50) + "...", likes: post.likes, comments: post.comments, shares: post.shares });
      return post;
    });

    console.log("✅ Successfully fetched", posts.length, "posts");
    return posts;
  } catch (error) {
    console.error("💥 Error fetching Facebook posts:", error);
    throw error;
  }
}

export function computeStatsSummary(posts: FacebookPost[]): FacebookStatsSummary {
  const summary = posts.reduce<FacebookStatsSummary>(
    (acc, p) => {
      acc.totalPosts += 1;
      acc.totalLikes += p.likes;
      acc.totalComments += p.comments;
      acc.totalShares += p.shares;
      return acc;
    },
    { totalPosts: 0, totalLikes: 0, totalComments: 0, totalShares: 0 }
  );
  
  console.log("📊 Computed stats summary:", summary);
  return summary;
}

export function buildEngagementSeries(posts: FacebookPost[], granularity: "month" | "day" = "month"): EngagementPoint[] {
  const group = new Map<string, number>();
  for (const p of posts) {
    const date = new Date(p.createdTime);
    const key = granularity === "month"
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const engagement = p.likes + p.comments + p.shares;
    group.set(key, (group.get(key) ?? 0) + engagement);
  }
  const sortedKeys = Array.from(group.keys()).sort();
  const series = sortedKeys.map((k) => ({ name: k, engagement: group.get(k) ?? 0 }));
  
  console.log("📈 Built engagement series:", series);
  return series;
}

