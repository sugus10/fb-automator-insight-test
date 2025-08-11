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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Overview</h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Performance metrics for your Facebook page</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground hidden sm:inline">Last:</span>
          <div className="flex border rounded-md flex-1 sm:flex-none overflow-hidden">
            <Button
              variant={dateRange === "1" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDateRange("1")}
              className="rounded-r-none flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3"
            >
              <span className="hidden sm:inline">1 Day</span>
              <span className="sm:hidden">1D</span>
            </Button>
            <Button
              variant={dateRange === "7" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDateRange("7")}
              className="rounded-none flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3"
            >
              <span className="hidden sm:inline">7 Days</span>
              <span className="sm:hidden">7D</span>
            </Button>
            <Button
              variant={dateRange === "30" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDateRange("30")}
              className="rounded-none flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3"
            >
              <span className="hidden sm:inline">30 Days</span>
              <span className="sm:hidden">30D</span>
            </Button>
            <Button
              variant={dateRange === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDateRange("all")}
              className="rounded-l-none flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3"
            >
              <span className="hidden sm:inline">All Time</span>
              <span className="sm:hidden">All</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <EngagementChart data={engagementSeries} />
        <TopPostCard post={topPost} />
      </div>
    </div>
  );
}