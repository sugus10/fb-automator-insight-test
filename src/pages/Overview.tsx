import { Heart, MessageCircle, Share2, Eye } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { EngagementChart } from "@/components/dashboard/EngagementChart";
import { TopPostCard } from "@/components/dashboard/TopPostCard";
import { useFacebook } from "@/context/FacebookContext";
import { buildEngagementSeries, computeStatsSummary } from "@/lib/facebookApi";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export default function Overview() {
  const { posts, isLoadingPosts } = useFacebook();
  const [dateRange, setDateRange] = useState<"1" | "7" | "30" | "all">("7");

  // Filter posts based on date range
  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    
    if (dateRange === "all") {
      return posts; // Return all posts for "All Time"
    }
    
    const now = new Date();
    const daysAgo = new Date(now.getTime() - parseInt(dateRange) * 24 * 60 * 60 * 1000);
    
    return posts.filter(post => {
      const postDate = new Date(post.createdTime);
      return postDate >= daysAgo;
    });
  }, [posts, dateRange]);

  const stats = computeStatsSummary(filteredPosts);
  const engagementSeries = buildEngagementSeries(filteredPosts, "day");
  const topPost = filteredPosts.slice().sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares))[0];

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview</h1>
          <p className="text-muted-foreground">Performance metrics for your Facebook page</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Last:</span>
          <div className="flex border rounded-md">
            <Button
              variant={dateRange === "1" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDateRange("1")}
              className="rounded-r-none"
            >
              1 Day
            </Button>
            <Button
              variant={dateRange === "7" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDateRange("7")}
              className="rounded-none"
            >
              7 Days
            </Button>
            <Button
              variant={dateRange === "30" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDateRange("30")}
              className="rounded-none"
            >
              30 Days
            </Button>
            <Button
              variant={dateRange === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDateRange("all")}
              className="rounded-l-none"
            >
              All Time
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Posts"
          value={isLoadingPosts ? "-" : stats.totalPosts}
          icon={Eye}
        />
        <StatCard
          title="Total Likes"
          value={isLoadingPosts ? "-" : stats.totalLikes.toLocaleString()}
          icon={Heart}
        />
        <StatCard
          title="Total Comments"
          value={isLoadingPosts ? "-" : stats.totalComments.toLocaleString()}
          icon={MessageCircle}
        />
        <StatCard
          title="Total Shares"
          value={isLoadingPosts ? "-" : stats.totalShares.toLocaleString()}
          icon={Share2}
        />
      </div>

      {/* Charts and Top Post */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <EngagementChart data={engagementSeries} />
        <TopPostCard post={topPost} />
      </div>
    </div>
  );
}