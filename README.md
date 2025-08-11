# Facebook Automation Insight (POC)

## Run locally

Requirements: Node.js 18+

```
npm i
npm run dev
```

## Facebook Graph API integration

This POC includes a minimal service and context to fetch Page posts using the Facebook Graph API.

- Configure credentials in Settings page:
  - Facebook Page ID
  - Access Token (with permissions to read page posts and insights)

- Service: `src/lib/facebookApi.ts`
  - `fetchPagePosts({ pageId, accessToken, limit })`: gets recent posts with reactions, comments, shares, and reach
  - `computeStatsSummary(posts)`: aggregates totals for stats cards
  - `buildEngagementSeries(posts, granularity)`: builds `{ name, engagement }` series for the chart

- Provider: `src/context/FacebookContext.tsx`
  - Stores credentials (persisted in localStorage) and exposes `posts`, `isLoadingPosts`, and `refetchPosts`

- Components updated to consume real data:
  - `Overview`: totals, engagement chart, and top post from fetched data
  - `PostPerformance`: feed and table views from fetched posts with search
  - `AISuggestions`: scaffold hook `useAiSuggestions` that derives suggestions from posts (replace with AI later)

## Sample Graph API request

List posts for a Page (replace placeholders):

```
GET https://graph.facebook.com/v19.0/{PAGE_ID}/posts?
  fields=id,created_time,message,full_picture,permalink_url,shares,
  insights.metric(post_impressions_unique),
  reactions.summary(total_count).limit(0),
  comments.summary(total_count).limit(0)&
  access_token={ACCESS_TOKEN}&limit=25
```

Response is mapped to `FacebookPost` in `src/types/facebook.ts`.

## Future AI module

- Use `useAiSuggestions(posts)` as the consumption point for AI-generated recommendations. Replace implementation to call your AI service and map results into the `AiSuggestion` shape.
