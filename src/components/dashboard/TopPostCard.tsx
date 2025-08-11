import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, MessageCircle, Share2, Eye } from "lucide-react";
import type { FacebookPost } from "@/types/facebook";

interface TopPostCardProps {
  post?: FacebookPost;
}

export function TopPostCard({ post }: TopPostCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Top Performing Post</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {post?.fullPictureUrl ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg max-h-32 sm:max-h-48 md:max-h-none">
            <img
              src={post.fullPictureUrl}
              alt="Top Post"
              className="h-full w-full object-cover"
              onError={(e) => {
                // Fallback if image fails to load
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
          <div className="aspect-video bg-gradient-primary rounded-lg flex items-center justify-center text-primary-foreground max-h-32 sm:max-h-48 md:max-h-none">
            <span className="text-xs sm:text-sm font-medium">No Image</span>
          </div>
        )}
        
        <div>
          <p className="text-xs sm:text-sm text-foreground line-clamp-2 sm:line-clamp-3">
            {post?.message || "No message available"}
          </p>
          {post?.createdTime && (
            <p className="text-xs text-muted-foreground mt-1 sm:mt-2">
              <span className="sm:hidden">
                {new Date(post.createdTime).toLocaleDateString()}
              </span>
              <span className="hidden sm:inline">
                Posted {new Date(post.createdTime).toLocaleDateString()} at {new Date(post.createdTime).toLocaleTimeString()}
              </span>
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-destructive" />
            <span className="text-xs sm:text-sm font-medium">{(post?.likes ?? 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium">{post?.comments ?? 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-success" />
            <span className="text-xs sm:text-sm font-medium">{post?.shares ?? 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-warning" />
            <span className="text-xs sm:text-sm font-medium">{(post?.reach ?? 0).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}