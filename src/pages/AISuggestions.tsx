import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  BarChart3,
  MessageSquare,
  Zap
} from "lucide-react";
import { useFacebook } from "@/context/FacebookContext";
import { analyzePosts, getOverallAnalysis, type PostAnalysis, type OverallAnalysis } from "@/lib/aiAnalysis";

export default function AISuggestions() {
  const { posts } = useFacebook();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [postAnalyses, setPostAnalyses] = useState<PostAnalysis[]>([]);
  const [overallAnalysis, setOverallAnalysis] = useState<OverallAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "posts" | "ideas">("overview");
  const [progress, setProgress] = useState<{current: number; total: number}>({ current: 0, total: 0 });

  const extractIdAndReason = (text: string): { id: string | null; reason: string } => {
    try {
      const match = text.match(/\b(\d+_\d+)\b/);
      const id = match ? match[1] : null;
      if (!id) return { id: null, reason: text };
      const reason = text.replace(id, "").replace(/^[\s:\-–]+|[\s:\-–]+$/g, "").trim();
      return { id, reason: reason || text };
    } catch {
      return { id: null, reason: text };
    }
  };

  const handleAnalyze = async () => {
    if (!posts || posts.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      console.log("🤖 Starting AI analysis for", posts.length, "posts");
      const maxPosts = Number(import.meta.env.VITE_AI_MAX_POSTS || 15);
      const total = Math.min(posts.length, Math.max(1, maxPosts));
      setProgress({ current: 0, total });

      // Batch analyze posts to reduce latency and control rate limits
      const batchSize = Number(import.meta.env.VITE_AI_BATCH_SIZE || 5);
      const targetPosts = posts
        .map(p => ({ ...p, _engagement: p.likes + p.comments + p.shares }))
        .sort((a, b) => b._engagement - a._engagement)
        .slice(0, total);

      const analyses: PostAnalysis[] = [];
      for (let i = 0; i < targetPosts.length; i += batchSize) {
        const batch = targetPosts.slice(i, i + batchSize);
        const res = await analyzePosts(batch);
        analyses.push(...res);
        setProgress({ current: Math.min(targetPosts.length, i + batch.length), total });
      }
      setPostAnalyses(analyses);
      
      // Add delay to avoid rate limiting
      console.log("⏳ Waiting 2 seconds before overall analysis...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get overall analysis
      const overall = await getOverallAnalysis(posts, analyses);
      setOverallAnalysis(overall);
      
      console.log("✅ AI analysis completed");
    } catch (error) {
      console.error("❌ AI analysis failed:", error);
      // Show user-friendly error message
      setOverallAnalysis({
        summary: "Analysis failed. Please check your internet connection and try again.",
        bestPosts: [],
        worstPosts: [],
        marketingHealthScore: 0,
        nextPostIdeas: [],
        recommendations: []
      });
    } finally {
      setIsAnalyzing(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  // Auto-analyze when posts are available (but avoid re-running if cached results exist)
  useEffect(() => {
    if (!posts || posts.length === 0) return;
    if (postAnalyses.length > 0 && overallAnalysis) return;
    // Defer and allow cache logic in analyzePosts/getOverallAnalysis to prevent API calls if unchanged
    handleAnalyze();
  }, [posts]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Suggestions</h1>
          <p className="text-muted-foreground">AI-powered insights and recommendations for your Facebook strategy</p>
        </div>
        <Button 
          onClick={handleAnalyze} 
          disabled={isAnalyzing || !posts || posts.length === 0}
          className="flex items-center gap-2"
        >
          {isAnalyzing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Brain className="h-4 w-4" />
          )}
          {isAnalyzing ? "Analyzing..." : "Analyze Posts"}
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 font-medium ${
            activeTab === "overview" 
              ? "border-b-2 border-primary text-primary" 
              : "text-muted-foreground"
          }`}
        >
          <BarChart3 className="h-4 w-4 inline mr-2" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab("posts")}
          className={`px-4 py-2 font-medium ${
            activeTab === "posts" 
              ? "border-b-2 border-primary text-primary" 
              : "text-muted-foreground"
          }`}
        >
          <MessageSquare className="h-4 w-4 inline mr-2" />
          Post Analysis
        </button>
        <button
          onClick={() => setActiveTab("ideas")}
          className={`px-4 py-2 font-medium ${
            activeTab === "ideas" 
              ? "border-b-2 border-primary text-primary" 
              : "text-muted-foreground"
          }`}
        >
          <Lightbulb className="h-4 w-4 inline mr-2" />
          Content Ideas
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && overallAnalysis && (
        <div className="space-y-6">
          {/* Marketing Health Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Marketing Health Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg ${getHealthBgColor(overallAnalysis.marketingHealthScore)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Performance</span>
                  <span className={`text-2xl font-bold ${getHealthColor(overallAnalysis.marketingHealthScore)}`}>
                    {overallAnalysis.marketingHealthScore}/100
                  </span>
                </div>
                <Progress value={overallAnalysis.marketingHealthScore} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  {overallAnalysis.summary}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Best & Worst Posts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Best Performing Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {overallAnalysis.bestPosts.map((entry, idx) => {
                    const { id, reason } = extractIdAndReason(entry);
                    const p = id ? posts?.find(x => x.id === id) : undefined;
                    return (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <div className="text-sm">
                          {p ? (
                            <div className="mb-1">
                              <div className="font-medium">{p.message ? p.message.slice(0, 100) : "(No message)"}</div>
                              <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                                <span>❤️ {p.likes}</span>
                                <span>💬 {p.comments}</span>
                                <span>📤 {p.shares}</span>
                                {p.permalinkUrl && (
                                  <a className="underline" href={p.permalinkUrl} target="_blank" rel="noreferrer">View</a>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="font-mono text-xs text-muted-foreground">{id ?? "Post"}</div>
                          )}
                          <div className="text-muted-foreground">{reason}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Posts Needing Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {overallAnalysis.worstPosts.map((entry, idx) => {
                    const { id, reason } = extractIdAndReason(entry);
                    const p = id ? posts?.find(x => x.id === id) : undefined;
                    return (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                        <div className="text-sm">
                          {p ? (
                            <div className="mb-1">
                              <div className="font-medium">{p.message ? p.message.slice(0, 100) : "(No message)"}</div>
                              <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                                <span>❤️ {p.likes}</span>
                                <span>💬 {p.comments}</span>
                                <span>📤 {p.shares}</span>
                                {p.permalinkUrl && (
                                  <a className="underline" href={p.permalinkUrl} target="_blank" rel="noreferrer">View</a>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="font-mono text-xs text-muted-foreground">{id ?? "Post"}</div>
                          )}
                          <div className="text-muted-foreground">{reason}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Strategic Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Strategic Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overallAnalysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm">{rec}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Post Analysis Tab */}
      {activeTab === "posts" && postAnalyses.length > 0 && (
        <div className="space-y-6">
          {postAnalyses.map((analysis, idx) => {
            const post = posts?.find(p => p.id === analysis.postId);
            return (
              <Card key={analysis.postId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Post Analysis #{idx + 1}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        Quality: {analysis.qualityScore}/10
                      </Badge>
                      <Badge variant="outline">
                        Engagement: {analysis.engagementScore}/10
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Post Preview */}
                  {post && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Post Preview:</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {post.message || "No message"}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>❤️ {post.likes}</span>
                        <span>💬 {post.comments}</span>
                        <span>📤 {post.shares}</span>
                      </div>
                    </div>
                  )}

                  {/* Problems Found */}
                  <div>
                    <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Problems Found
                    </h4>
                    <ul className="space-y-1">
                      {analysis.problems.map((problem, pIdx) => (
                        <li key={pIdx} className="text-sm flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                          {problem}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Improvements */}
                  <div>
                    <h4 className="font-medium text-blue-600 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Suggested Improvements
                    </h4>
                    <ul className="space-y-1">
                      {analysis.improvements.map((improvement, iIdx) => (
                        <li key={iIdx} className="text-sm flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Content Ideas Tab */}
      {activeTab === "ideas" && overallAnalysis && (
        <div className="space-y-6">
          {/* Next Post Ideas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Next Post Ideas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {overallAnalysis.nextPostIdeas.map((idea, idx) => (
                  <div key={idx} className="p-4 border rounded-lg hover:bg-muted transition-colors">
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Idea #{idx + 1}</p>
                        <p className="text-sm text-muted-foreground mt-1">{idea}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content Ideas from Post Analysis */}
          {postAnalyses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Content Ideas from Post Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {postAnalyses.slice(0, 3).map((analysis, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <p className="text-sm font-medium mb-2">Based on Post #{idx + 1}</p>
                      <div className="space-y-2">
                        {analysis.contentIdeas.map((idea, ideaIdx) => (
                          <div key={ideaIdx} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                            <span className="text-sm">{idea}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium">Analyzing your posts...</p>
            <p className="text-sm text-muted-foreground">This may take a few moments</p>
            {progress.total > 0 && (
              <p className="text-xs text-muted-foreground mt-2">{progress.current}/{progress.total} processed</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">If you see rate limit errors, please wait 30 seconds and try again</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {!isAnalyzing && overallAnalysis && overallAnalysis.summary.includes("Rate limit") && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-yellow-500" />
            <p className="text-lg font-medium">Rate Limit Reached</p>
            <p className="text-sm text-muted-foreground mb-4">
              Gemini API has rate limits. Please wait 30 seconds and try again.
            </p>
            <Button onClick={handleAnalyze} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry Analysis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No Posts State */}
      {!posts || posts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">No posts to analyze</p>
            <p className="text-sm text-muted-foreground">
              Connect your Facebook page and load some posts to get AI insights
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}