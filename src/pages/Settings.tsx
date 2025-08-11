import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Key, Bell, Globe, Shield, Copy, Check, AlertCircle, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useFacebook } from "@/context/FacebookContext";

export default function Settings() {
  const { credentials, setCredentials, refetchPosts, posts, isLoadingPosts, postsError } = useFacebook();
  const [pageId, setPageId] = useState(credentials?.pageId ?? "");
  const [token, setToken] = useState(credentials?.accessToken ?? "");
  const [copied, setCopied] = useState(false);

  // Environment-based credentials (optional)
  const envCredentials = {
    pageId: import.meta.env.VITE_FB_PAGE_ID || "",
    accessToken: import.meta.env.VITE_FB_ACCESS_TOKEN || ""
  };

  // Update local state when credentials change
  useEffect(() => {
    console.log("🔄 Settings: credentials changed:", credentials ? { pageId: credentials.pageId, tokenLength: credentials.accessToken.length } : "null");
    setPageId(credentials?.pageId ?? "");
    setToken(credentials?.accessToken ?? "");
  }, [credentials]);

  const handleUseEnvCredentials = () => {
    if (envCredentials.pageId && envCredentials.accessToken) {
      console.log("🎯 Using environment-based credentials and applying immediately");
      setPageId(envCredentials.pageId);
      setToken(envCredentials.accessToken);
      // Apply immediately so users don't have to click Save
      setCredentials({ pageId: envCredentials.pageId, accessToken: envCredentials.accessToken });
      refetchPosts();
    } else {
      console.warn("⚠️ Environment credentials not configured");
    }
  };

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy token');
    }
  };

  const handleSave = () => {
    console.log("💾 Save button clicked:", { pageId, tokenLength: token.length });
    if (!pageId || !token) {
      console.warn("⚠️ Page ID or Token missing — keeping existing credentials. Use Quick Setup or fill both fields.");
      return; // Do not clear existing credentials on partial/empty
    }
    console.log("✅ Setting credentials with:", { pageId, tokenLength: token.length });
    setCredentials({ pageId, accessToken: token });
    refetchPosts();
  };

  const getConnectionStatus = () => {
    if (!credentials) {
      // If user filled inputs but not saved/applied yet
      if (pageId && token) {
        return { status: 'disconnected', message: 'Credentials entered but not applied. Click Save API Settings.' };
      }
      return { status: 'disconnected', message: 'No credentials configured' };
    }
    if (isLoadingPosts) return { status: 'loading', message: 'Connecting to Facebook API...' };
    if (postsError) return { status: 'error', message: 'Failed to connect to Facebook API' };
    if (posts && posts.length > 0) return { status: 'connected', message: `Connected! Found ${posts.length} posts` };
    return { status: 'connected', message: 'Connected but no posts found' };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Configure your dashboard preferences and API settings</p>
      </div>

      {/* Debug Info - Development Only */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Debug Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div>Current credentials: {credentials ? 'Set' : 'None'}</div>
              <div>Page ID: {pageId || 'Not set'}</div>
              <div>Token length: {token.length}</div>
              <div>Loading: {isLoadingPosts ? 'Yes' : 'No'}</div>
              <div>Posts count: {posts?.length ?? 0}</div>
              <div>Error: {postsError ? 'Yes' : 'No'}</div>
              {postsError && <div className="text-red-600">Error: {String(postsError)}</div>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {connectionStatus.status === 'connected' && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            {connectionStatus.status === 'error' && (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            {connectionStatus.status === 'loading' && (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            )}
            {connectionStatus.status === 'disconnected' && (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            <span className="text-sm">{connectionStatus.message}</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Quick Setup - Environment Variables
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use credentials configured in your .env file (if available).
          </p>
          <Button onClick={handleUseEnvCredentials} disabled={!envCredentials.pageId || !envCredentials.accessToken}>
            Apply Environment Credentials
          </Button>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pageId">Facebook Page ID</Label>
            <Input 
              id="pageId" 
              placeholder="Enter your Facebook Page ID"
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="token">Access Token</Label>
            <div className="flex gap-2">
              <Input 
                id="token" 
                placeholder="Enter your Facebook Access Token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyToken}
                disabled={!token}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button onClick={handleSave} variant="outline">Save API Settings</Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Performance Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when posts perform exceptionally well or poorly
              </p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>AI Suggestions</Label>
              <p className="text-sm text-muted-foreground">
                Receive weekly AI-generated improvement suggestions
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Engagement Milestones</Label>
              <p className="text-sm text-muted-foreground">
                Celebrate when your posts reach engagement milestones
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Data & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Data Collection</Label>
              <p className="text-sm text-muted-foreground">
                Allow enhanced analytics data collection
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="space-y-4">
            <div>
              <Label>Data Retention Period</Label>
              <p className="text-sm text-muted-foreground mb-2">
                How long should we keep your analytics data?
              </p>
              <select className="w-full p-2 border border-input bg-background rounded-md">
                <option>6 months</option>
                <option>1 year</option>
                <option>2 years</option>
                <option>Indefinite</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Timezone</Label>
            <select className="w-full p-2 border border-input bg-background rounded-md">
              <option>UTC-8 (Pacific Time)</option>
              <option>UTC-5 (Eastern Time)</option>
              <option>UTC+0 (Greenwich Mean Time)</option>
              <option>UTC+1 (Central European Time)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Date Format</Label>
            <select className="w-full p-2 border border-input bg-background rounded-md">
              <option>MM/DD/YYYY</option>
              <option>DD/MM/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}