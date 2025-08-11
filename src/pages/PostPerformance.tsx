import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, Eye, Search, Grid, List, RefreshCw, Zap } from "lucide-react";
import { useFacebook } from "@/context/FacebookContext";
import { fetchPagePosts } from "@/lib/facebookApi";

export default function PostPerformance() {
  const { posts, isLoadingPosts, postsError, credentials, refetchPosts } = useFacebook();
  const [viewMode, setViewMode] = useState<"feed" | "table">("feed");
  const [searchTerm, setSearchTerm] = useState("");

  // Debug logging
  useEffect(() => {
    console.log("📊 PostPerformance render:", {
      postsCount: posts?.length ?? 0,
      isLoading: isLoadingPosts,
      error: postsError,
      hasCredentials: !!credentials,
      posts: posts?.slice(0, 2) // Log first 2 posts for debugging
    });
  }, [posts, isLoadingPosts, postsError, credentials]);

  const filteredPosts = useMemo(() => {
    const list = posts ?? [];
    const filtered = list.filter((post) => (post.message ?? "").toLowerCase().includes(searchTerm.toLowerCase()));
    console.log("🔍 Filtered posts:", { original: list.length, filtered: filtered.length, searchTerm });
    return filtered;
  }, [posts, searchTerm]);

  const handleTestAPI = () => {
    console.log("🧪 Manual API test triggered");
    console.log("Current credentials:", credentials);
    refetchPosts();
  };

  const handleDirectAPITest = async () => {
    console.log("⚡ Direct API test (bypassing context)");
    try {
      const testCreds = {
        pageId: import.meta.env.VITE_FB_PAGE_ID || "",
        accessToken: import.meta.env.VITE_FB_ACCESS_TOKEN || ""
      };
      
      if (!testCreds.pageId || !testCreds.accessToken) {
        alert("Environment credentials not configured. Please add VITE_FB_PAGE_ID and VITE_FB_ACCESS_TOKEN to your .env file.");
        return;
      }
      
      console.log("Testing with:", { pageId: testCreds.pageId, tokenLength: testCreds.accessToken.length });
      const result = await fetchPagePosts(testCreds);
      console.log("✅ Direct API test successful:", result.length, "posts");
      alert(`Direct API test successful! Found ${result.length} posts. Check console for details.`);
    } catch (error) {
      console.error("❌ Direct API test failed:", error);
      alert(`Direct API test failed: ${error}. Check console for details.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Debug Info - Development Only */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-blue-50 border-blue-200 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-blue-800">🔧 PostPerformance Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs sm:text-sm text-blue-700 space-y-1">
              <div>Credentials: {credentials ? 'Set' : 'None'}</div>
              <div>Posts loaded: {posts?.length ?? 0}</div>
              <div>Loading: {isLoadingPosts ? 'Yes' : 'No'}</div>
              <div>Error: {postsError ? 'Yes' : 'No'}</div>
              {postsError && <div className="text-red-600">Error: {String(postsError)}</div>}
              <div>Filtered posts: {filteredPosts.length}</div>
              {posts && posts.length > 0 && (
                <div>
                  <div>First post ID: {posts[0].id}</div>
                  <div className="break-all">First post message: {posts[0].message.substring(0, 50)}...</div>
                  <div>First post likes: {posts[0].likes}</div>
                </div>
              )}
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Button onClick={handleTestAPI} size="sm" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test API Call
                </Button>
                <Button onClick={handleDirectAPITest} size="sm" variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Direct API Test
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Post Performance</h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Track and analyze your Facebook posts</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant={viewMode === "feed" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("feed")}
            className="flex-1 sm:flex-none"
          >
            <Grid className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Feed View</span>
            <span className="sm:hidden">Feed</span>
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="flex-1 sm:flex-none"
          >
            <List className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Table View</span>
            <span className="sm:hidden">Table</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search posts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 text-sm"
        />
      </div>

      {/* No Posts Message */}
      {!isLoadingPosts && (!posts || posts.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              <p className="text-lg font-medium mb-2">No posts found</p>
              <p className="text-sm">
                {!credentials ? "Please configure your Facebook credentials in Settings." : "No posts were returned from the Facebook API."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content based on view mode */}
      {viewMode === "feed" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {(isLoadingPosts ? Array.from({ length: 4 }) : filteredPosts).map((post, idx) => (
            <Card key={(post as any)?.id ?? idx} className="transition-smooth hover:shadow-facebook-md">
              <CardContent className="p-3 sm:p-4 md:p-6">
                {!isLoadingPosts && (post as any)?.fullPictureUrl ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-3 sm:mb-4 max-h-32 sm:max-h-48 md:max-h-none">
                    <img 
                      src={(post as any).fullPictureUrl} 
                      alt="Post" 
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-primary text-primary-foreground hidden">
                      <span className="text-xs sm:text-sm font-medium">Post Image</span>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-primary rounded-lg flex items-center justify-center text-primary-foreground mb-3 sm:mb-4 max-h-32 sm:max-h-48 md:max-h-none">
                    <span className="text-xs sm:text-sm font-medium">No Image</span>
                  </div>
                )}
                
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-xs sm:text-sm text-foreground line-clamp-2 sm:line-clamp-3 break-words">{(post as any)?.message ?? ""}</p>
                  {!isLoadingPosts && (
                    <p className="text-xs text-muted-foreground break-words">
                      <span className="sm:hidden">
                        {new Date((post as any).createdTime).toLocaleDateString()}
                      </span>
                      <span className="hidden sm:inline">
                        Posted {new Date((post as any).createdTime).toLocaleDateString()} at {new Date((post as any).createdTime).toLocaleTimeString()}
                      </span>
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-destructive" />
                      <span className="text-xs sm:text-sm font-medium">{Number((post as any)?.likes ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      <span className="text-xs sm:text-sm font-medium">{Number((post as any)?.comments ?? 0)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-success" />
                      <span className="text-xs sm:text-sm font-medium">{Number((post as any)?.shares ?? 0)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-warning" />
                      <span className="text-xs sm:text-sm font-medium">{Number((post as any)?.reach ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Posts Table</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="text-xs md:text-sm">
                  <TableHead className="hidden md:table-cell">Post ID</TableHead>
                  <TableHead className="w-16 sm:w-20 md:w-auto">Date</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead className="w-12 sm:w-16 md:w-auto">Likes</TableHead>
                  <TableHead className="w-12 sm:w-16 md:w-auto hidden sm:table-cell">Comments</TableHead>
                  <TableHead className="w-12 sm:w-16 md:w-auto hidden sm:table-cell">Shares</TableHead>
                  <TableHead className="w-12 sm:w-16 md:w-auto hidden lg:table-cell">Reach</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isLoadingPosts ? [] : filteredPosts).map((post) => (
                  <TableRow key={post.id} className="text-xs md:text-sm">
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">{post.id}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="md:hidden">{new Date(post.createdTime).toLocaleDateString()}</div>
                      <div className="hidden md:block">{new Date(post.createdTime).toLocaleString()}</div>
                    </TableCell>
                    <TableCell className="max-w-[100px] sm:max-w-[150px] md:max-w-xs truncate">
                      {post.message}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-xs sm:text-sm">{post.likes.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="font-medium text-xs sm:text-sm">{post.comments}</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="font-medium text-xs sm:text-sm">{post.shares}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="font-medium text-xs sm:text-sm">{Number(post.reach ?? 0).toLocaleString()}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}