import type { FacebookPost } from "@/types/facebook";
import { computeStableHash } from "@/lib/hash";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Debug logging
console.log("🔑 Gemini API Key loaded:", {
  hasKey: !!GEMINI_API_KEY,
  keyLength: GEMINI_API_KEY?.length || 0,
  keyStart: GEMINI_API_KEY?.substring(0, 10) + "..." || "none",
  envVars: {
    VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
    NODE_ENV: import.meta.env.NODE_ENV
  }
});

export interface PostAnalysis {
  postId: string;
  problems: string[];
  improvements: string[];
  contentIdeas: string[];
  qualityScore: number; // 1-10
  engagementScore: number; // 1-10
}

export interface OverallAnalysis {
  summary: string;
  bestPosts: string[];
  worstPosts: string[];
  marketingHealthScore: number; // 1-100
  nextPostIdeas: string[];
  recommendations: string[];
}

function formatPostData(posts: FacebookPost[]): string {
  return posts.map(post => {
    const engagement = post.likes + post.comments + post.shares;
    const date = new Date(post.createdTime).toLocaleDateString();
    return `
Post ID: ${post.id}
Date: ${date}
Message: ${post.message || "No message"}
Likes: ${post.likes}
Comments: ${post.comments}
Shares: ${post.shares}
Reach: ${post.reach || "Unknown"}
Total Engagement: ${engagement}
Has Image: ${post.fullPictureUrl ? "Yes" : "No"}
    `.trim();
  }).join('\n\n');
}

export async function analyzePosts(posts: FacebookPost[]): Promise<PostAnalysis[]> {
  if (!posts.length) return [];
  
  if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY not configured in environment variables");
    throw new Error("Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.");
  }

  // Performance knobs via env
  const maxPosts = Number(import.meta.env.VITE_AI_MAX_POSTS || 15);
  const truncateChars = Number(import.meta.env.VITE_AI_TRUNCATE_CHARS || 500);
  const batchSize = Number(import.meta.env.VITE_AI_BATCH_SIZE || 5);

  // Simple localStorage cache to avoid re-analyzing unchanged posts
  type CacheEntry = { key: string; analysis: PostAnalysis };
  const CACHE_STORAGE_KEY = "aiAnalysisCache_v1";
  const loadCache = (): Record<string, CacheEntry> => {
    try {
      const raw = localStorage.getItem(CACHE_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, CacheEntry>) : {};
    } catch {
      return {};
    }
  };
  const saveCache = (cache: Record<string, CacheEntry>) => {
    try {
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
    } catch {}
  };
  const makePostKey = (p: FacebookPost): string =>
    computeStableHash(
      [
        p.id,
        p.createdTime,
        String(p.likes),
        String(p.comments),
        String(p.shares),
        String(p.reach ?? ""),
        (p.message || "").slice(0, truncateChars)
      ].join("|")
    );
  const cache = loadCache();

  // Sort by engagement and pick top N
  const sorted = posts
    .map(p => ({
      ...p,
      _engagement: p.likes + p.comments + p.shares,
      message: (p.message || "").slice(0, truncateChars)
    }))
    .sort((a, b) => b._engagement - a._engagement)
    .slice(0, Math.max(1, maxPosts));

  const cachedAnalyses: PostAnalysis[] = [];
  const toAnalyze: FacebookPost[] = [];
  for (const p of sorted) {
    const key = makePostKey(p);
    const entry = cache[p.id];
    if (entry && entry.key === key) {
      cachedAnalyses.push(entry.analysis);
    } else {
      toAnalyze.push(p);
    }
  }

  // If everything is cached, return immediately without calling AI
  if (toAnalyze.length === 0) {
    console.log("🧠 Using cached post analyses only (no API call)");
    return cachedAnalyses;
  }

  const postData = formatPostData(toAnalyze);
  
  const prompt = `You are a professional Facebook marketing consultant. Analyze the following posts and provide detailed insights for each post.

For each post, provide:
1. Problems Found (2-3 specific issues)
2. Suggested Improvements (2-3 actionable improvements)
3. Content Ideas for Next Posts (2-3 ideas based on this post's performance)

Post Data:
${postData}

Analyze each post individually and provide structured feedback. Focus on:
- Caption quality and engagement
- Hashtag usage and relevance
- Posting timing
- Content type effectiveness
- Audience engagement patterns

Format your response as JSON with this structure:
{
  "analyses": [
    {
      "postId": "post_id",
      "problems": ["problem1", "problem2"],
      "improvements": ["improvement1", "improvement2"],
      "contentIdeas": ["idea1", "idea2"],
      "qualityScore": 7,
      "engagementScore": 6
    }
  ]
}`;

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 Making Gemini API request (attempt ${attempt}/${maxRetries})...`);
      console.log('🔍 Request details:', {
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY.substring(0, 10)}...`,
        hasApiKey: !!GEMINI_API_KEY,
        apiKeyLength: GEMINI_API_KEY?.length || 0
      });
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000
          }
        })
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API error response:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        if (response.status === 429) {
          // Check if it's a quota exceeded error
          try {
            const errorData = JSON.parse(errorText);
            console.log('🔍 Parsed error data:', errorData);
            
            const isQuotaExceeded = errorData.error?.details?.some((detail: any) => 
              detail.violations?.some((violation: any) => 
                violation.quotaId?.includes('PerDay') || violation.quotaId?.includes('PerMinute')
              )
            );
            
            if (isQuotaExceeded) {
              console.error('❌ Gemini API quota exceeded. Please try again tomorrow or use a different API key.');
              return [];
            }
            
            console.warn(`⚠️ Gemini rate limit reached (attempt ${attempt}/${maxRetries}). Retrying in ${attempt * 2} seconds...`);
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, attempt * 2000));
              lastError = new Error(`Gemini API error: ${response.status} - ${errorText}`);
              continue;
            }
            return [];
          } catch (parseError) {
            console.error('❌ Could not parse error response:', parseError);
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
          }
        }
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      
      try {
        // Clean the response - remove markdown formatting if present
        let cleanContent = content;
        if (content.includes('```json')) {
          cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }
        
        const parsed = JSON.parse(cleanContent);
        const freshAnalyses: PostAnalysis[] = parsed.analyses || [];
        // Merge into cache
        for (const analysis of freshAnalyses) {
          const source = toAnalyze.find(p => p.id === analysis.postId);
          if (source) {
            cache[source.id] = { key: makePostKey(source), analysis };
          }
        }
        saveCache(cache);
        return [...cachedAnalyses, ...freshAnalyses];
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.error('Raw content:', content);
        return cachedAnalyses;
      }
    } catch (error) {
      console.error(`AI analysis failed (attempt ${attempt}/${maxRetries}):`, error);
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        console.log(`🔄 Retrying in ${attempt * 2} seconds...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
  }
  
  console.error('AI analysis failed after all retries:', lastError);
  return [];
}

export async function getOverallAnalysis(posts: FacebookPost[], postAnalyses: PostAnalysis[]): Promise<OverallAnalysis> {
  if (!posts.length) {
    return {
      summary: "No posts available for analysis",
      bestPosts: [],
      worstPosts: [],
      marketingHealthScore: 0,
      nextPostIdeas: [],
      recommendations: []
    };
  }
  
  if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY not configured in environment variables");
    throw new Error("Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.");
  }

  const maxPosts = Number(import.meta.env.VITE_AI_MAX_POSTS || 15);
  const truncateChars = Number(import.meta.env.VITE_AI_TRUNCATE_CHARS || 500);
  const sorted = posts
    .map(p => ({
      ...p,
      _engagement: p.likes + p.comments + p.shares,
      message: (p.message || "").slice(0, truncateChars)
    }))
    .sort((a, b) => b._engagement - a._engagement)
    .slice(0, Math.max(1, maxPosts));

  const postData = formatPostData(sorted);

  // Cache for overall analysis keyed by summary of included posts + per-post analyses
  const overallKey = computeStableHash(
    JSON.stringify({
      posts: sorted.map(p => ({ id: p.id, ts: p.createdTime, l: p.likes, c: p.comments, s: p.shares, r: p.reach ?? 0 })),
      analyses: postAnalyses.map(a => ({ id: a.postId, q: a.qualityScore, e: a.engagementScore }))
    })
  );
  const OVERALL_CACHE_KEY = "aiOverallAnalysis_v1";
  try {
    const raw = localStorage.getItem(OVERALL_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, OverallAnalysis & { key: string }>;
      const hit = (parsed as any)[overallKey];
      if (hit) {
        console.log("🧠 Using cached overall analysis");
        const { key: _k, ...rest } = hit as any;
        return rest as OverallAnalysis;
      }
    }
  } catch {}
  const analysesData = postAnalyses.map(a => `Post ${a.postId}: Quality ${a.qualityScore}/10, Engagement ${a.engagementScore}/10`).join('\n');

  const prompt = `You are a professional Facebook marketing consultant. Based on the following post data and individual analyses, provide an overall marketing assessment.

Post Data:
${postData}

Individual Analyses:
${analysesData}

Provide a comprehensive analysis including:
1. Overall Summary (2-3 sentences)
2. Best Performing Posts (top 2-3 post IDs with reasons)
3. Worst Performing Posts (bottom 2-3 post IDs with reasons)
4. Marketing Health Score (1-100)
5. Next Post Ideas (5-7 specific content ideas)
6. Strategic Recommendations (3-5 actionable recommendations)

Format as JSON:
{
  "summary": "overall summary",
  "bestPosts": ["post_id with reason"],
  "worstPosts": ["post_id with reason"],
  "marketingHealthScore": 75,
  "nextPostIdeas": ["idea1", "idea2"],
  "recommendations": ["rec1", "rec2"]
}`;

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 Making Gemini API request for overall analysis (attempt ${attempt}/${maxRetries})...`);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500
          }
        })
      });

      console.log('📡 Overall analysis response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API error response for overall analysis:', errorText);
        
        if (response.status === 429) {
          // Check if it's a quota exceeded error
          const errorData = JSON.parse(errorText);
          const isQuotaExceeded = errorData.error?.details?.some((detail: any) => 
            detail.violations?.some((violation: any) => 
              violation.quotaId?.includes('PerDay') || violation.quotaId?.includes('PerMinute')
            )
          );
          
          if (isQuotaExceeded) {
            console.error('❌ Gemini API quota exceeded. Please try again tomorrow or use a different API key.');
            return {
              summary: "API quota exceeded. Please try again tomorrow or use a different API key.",
              bestPosts: [],
              worstPosts: [],
              marketingHealthScore: 0,
              nextPostIdeas: [],
              recommendations: []
            };
          }
          
          console.warn(`⚠️ Gemini rate limit reached (attempt ${attempt}/${maxRetries}). Retrying in ${attempt * 2} seconds...`);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, attempt * 2000));
            lastError = new Error(`Gemini API error: ${response.status} - ${errorText}`);
            continue;
          }
          return {
            summary: "Rate limit reached. Please wait and try again.",
            bestPosts: [],
            worstPosts: [],
            marketingHealthScore: 0,
            nextPostIdeas: [],
            recommendations: []
          };
        }
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      
      try {
        // Clean the response - remove markdown formatting if present
        let cleanContent = content;
        if (content.includes('```json')) {
          cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }
        
        const parsed = JSON.parse(cleanContent);
        const result: OverallAnalysis = {
          summary: parsed.summary || "Analysis completed",
          bestPosts: parsed.bestPosts || [],
          worstPosts: parsed.worstPosts || [],
          marketingHealthScore: parsed.marketingHealthScore || 50,
          nextPostIdeas: parsed.nextPostIdeas || [],
          recommendations: parsed.recommendations || []
        };
        // Save to cache
        try {
          const raw = localStorage.getItem(OVERALL_CACHE_KEY);
          const store = raw ? JSON.parse(raw) : {};
          store[overallKey] = { key: overallKey, ...result };
          localStorage.setItem(OVERALL_CACHE_KEY, JSON.stringify(store));
        } catch {}
        return result;
      } catch (parseError) {
        console.error('Failed to parse overall analysis:', parseError);
        console.error('Raw content:', content);
        return {
          summary: "Analysis completed",
          bestPosts: [],
          worstPosts: [],
          marketingHealthScore: 50,
          nextPostIdeas: [],
          recommendations: []
        };
      }
    } catch (error) {
      console.error(`Overall analysis failed (attempt ${attempt}/${maxRetries}):`, error);
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        console.log(`🔄 Retrying overall analysis in ${attempt * 2} seconds...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
  }
  
  console.error('Overall analysis failed after all retries:', lastError);
  return {
    summary: "Analysis failed after all retries",
    bestPosts: [],
    worstPosts: [],
    marketingHealthScore: 0,
    nextPostIdeas: [],
    recommendations: []
  };
} 