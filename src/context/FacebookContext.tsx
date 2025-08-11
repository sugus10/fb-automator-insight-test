import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { FacebookCredentials, FacebookPost } from "@/types/facebook";
import { fetchPagePosts } from "@/lib/facebookApi";
import { useQuery } from "@tanstack/react-query";

interface FacebookContextValue {
  credentials: FacebookCredentials | null;
  setCredentials: (creds: FacebookCredentials | null) => void;
  // data
  posts: FacebookPost[] | undefined;
  isLoadingPosts: boolean;
  postsError: unknown;
  refetchPosts: () => void;
}

const FacebookContext = createContext<FacebookContextValue | undefined>(undefined);

  // Environment-based token setup (optional)
  const ENV_TOKEN_SETUP = {
    pageId: import.meta.env.VITE_FB_PAGE_ID,
    accessToken: import.meta.env.VITE_FB_ACCESS_TOKEN
  };

export function FacebookProvider({ children }: { children: React.ReactNode }) {
  const [credentials, setCredentials] = useState<FacebookCredentials | null>(null);

  // load persisted credentials OR use direct token setup
  useEffect(() => {
    try {
      // Clear old credentials first
      localStorage.removeItem("fbCreds");
      console.log("🗑️ Cleared old credentials from localStorage");
      
      // Use environment-based token setup if available
      if (ENV_TOKEN_SETUP.pageId && ENV_TOKEN_SETUP.accessToken) {
        console.log("🚀 Using environment-based token setup");
        setCredentials(ENV_TOKEN_SETUP);
      }
    } catch (error) {
      console.error("❌ Error loading credentials from localStorage:", error);
    }
  }, []);

  // persist on change
  useEffect(() => {
    try {
      if (credentials) {
        localStorage.setItem("fbCreds", JSON.stringify(credentials));
        console.log("💾 Saved credentials to localStorage");
      } else {
        // Only remove if we're explicitly setting to null, not on initial load
        if (credentials === null) {
          localStorage.removeItem("fbCreds");
          console.log("🗑️ Removed credentials from localStorage");
        }
      }
    } catch (error) {
      console.error("❌ Error saving credentials to localStorage:", error);
    }
  }, [credentials]);

  const {
    data: posts,
    isLoading: isLoadingPosts,
    error: postsError,
    refetch,
  } = useQuery({
    queryKey: ["fb-posts", credentials?.pageId],
    queryFn: async () => {
      if (!credentials) {
        console.log("⚠️ No credentials available, returning empty posts array");
        return [] as FacebookPost[];
      }
      console.log("🚀 Starting Facebook API query with credentials:", { pageId: credentials.pageId, tokenLength: credentials.accessToken.length });
      return fetchPagePosts({ pageId: credentials.pageId, accessToken: credentials.accessToken, limit: 100 });
    },
    enabled: !!credentials?.pageId && !!credentials?.accessToken,
    staleTime: 1000 * 60, // 1 min
    retry: 1,
  });

  // Auto-refetch when credentials change and are valid
  useEffect(() => {
    if (credentials?.pageId && credentials?.accessToken) {
      console.log("🔁 Credentials changed — refetching posts");
      void refetch();
    }
  }, [credentials, refetch]);

  const value = useMemo<FacebookContextValue>(
    () => ({
      credentials,
      setCredentials: (creds) => {
        const stack = new Error().stack;
        console.log("🔧 Setting credentials:", creds ? { pageId: creds.pageId, tokenLength: creds.accessToken.length } : "null");
        console.log("📍 Called from:", stack?.split('\n')[2] || 'unknown');
        setCredentials(creds);
      },
      posts,
      isLoadingPosts,
      postsError,
      refetchPosts: () => {
        console.log("🔄 Manual refetch triggered");
        void refetch();
      },
    }),
    [credentials, isLoadingPosts, posts, postsError, refetch]
  );

  return <FacebookContext.Provider value={value}>{children}</FacebookContext.Provider>;
}

export function useFacebook() {
  const ctx = useContext(FacebookContext);
  if (!ctx) throw new Error("useFacebook must be used within FacebookProvider");
  return ctx;
}

