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
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">🔧 PostPerformance Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-blue-700 space-y-1">
              <div>Credentials: {credentials ? 'Set' : 'None'}</div>
              <div>Posts loaded: {posts?.length ?? 0}</div>
              <div>Loading: {isLoadingPosts ? 'Yes' : 'No'}</div>
              <div>Error: {postsError ? 'Yes' : 'No'}</div>
              {postsError && <div className="text-red-600">Error: {String(postsError)}</div>}
              <div>Filtered posts: {filteredPosts.length}</div>
              {posts && posts.length > 0 && (
                <div>
                  <div>First post ID: {posts[0].id}</div>
                  <div>First post message: {posts[0].message.substring(0, 50)}...</div>
                  <div>First post likes: {posts[0].likes}</div>
                </div>
              )}
              <div className="mt-4 flex gap-2">
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

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Post Performance</h1>
          <p className="text-muted-foreground">Track and analyze your Facebook posts</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === "feed" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("feed")}
          >
            <Grid className="h-4 w-4 mr-2" />
            Feed View
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4 mr-2" />
            Table View
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search posts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(isLoadingPosts ? Array.from({ length: 4 }) : filteredPosts).map((post, idx) => (
            <Card key={(post as any)?.id ?? idx} className="transition-smooth hover:shadow-facebook-md">
              <CardContent className="p-6">
                {!isLoadingPosts && (post as any)?.fullPictureUrl ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-4">
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
                      <span className="text-sm font-medium">Post Image</span>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-primary rounded-lg flex items-center justify-center text-primary-foreground mb-4">
                    <span className="text-sm font-medium">No Image</span>
                  </div>
                )}
                
                <div className="space-y-4">
                  <p className="text-sm text-foreground">{(post as any)?.message ?? ""}</p>
                  {!isLoadingPosts && (
                    <p className="text-xs text-muted-foreground">
                      Posted {new Date((post as any).createdTime).toLocaleDateString()} at {new Date((post as any).createdTime).toLocaleTimeString()}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium">{Number((post as any)?.likes ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{Number((post as any)?.comments ?? 0)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">{Number((post as any)?.shares ?? 0)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-warning" />
                      <span className="text-sm font-medium">{Number((post as any)?.reach ?? 0).toLocaleString()}</span>
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
            <CardTitle>Posts Table</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Post ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Likes</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead>Reach</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isLoadingPosts ? [] : filteredPosts).map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <Badge variant="outline">{post.id}</Badge>
                    </TableCell>
                    <TableCell>{new Date(post.createdTime).toLocaleString()}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {post.message}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{post.likes.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{post.comments}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{post.shares}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{Number(post.reach ?? 0).toLocaleString()}</span>
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