import { useMemo } from "react";
import type { FacebookPost } from "@/types/facebook";

export interface AiSuggestion {
  id: string;
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  category: string;
  icon: string; // lucide icon name as string placeholder
}

export function useAiSuggestions(posts: FacebookPost[] | undefined) {
  // Placeholder heuristic; replace with real AI integration later
  return useMemo<AiSuggestion[]>(() => {
    if (!posts || posts.length === 0) return [];

    const avgEngagement = posts.reduce((sum, p) => sum + p.likes + p.comments + p.shares, 0) / posts.length;
    const topHasImage = posts.some((p) => (p.fullPictureUrl ? 1 : 0) > 0);

    const suggestions: AiSuggestion[] = [];
    suggestions.push({
      id: "1",
      title: "Post More Around Peak Days",
      description: "Your engagement spikes on specific days. Schedule more posts around those peaks to maximize reach.",
      priority: "High",
      category: "Timing",
      icon: "Clock",
    });
    if (topHasImage) {
      suggestions.push({
        id: "2",
        title: "Leverage Visuals",
        description: "Posts with images perform better. Maintain a consistent visual style to reinforce brand recall.",
        priority: "High",
        category: "Content",
        icon: "Image",
      });
    }
    suggestions.push({
      id: "3",
      title: "Target Comments",
      description: `Average engagement is ${Math.round(avgEngagement)}. Prompt users with questions to drive comments and boost ranking.`,
      priority: "Medium",
      category: "Engagement",
      icon: "MessageCircle",
    });

    return suggestions;
  }, [posts]);
}

