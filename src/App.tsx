import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Overview from "./pages/Overview";
import PostPerformance from "./pages/PostPerformance";
import AISuggestions from "./pages/AISuggestions";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { FacebookProvider } from "@/context/FacebookContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <FacebookProvider>
        <BrowserRouter future={{ 
          v7_relativeSplatPath: true,
          v7_startTransition: true 
        }}>
          <Routes>
            <Route path="/" element={
              <DashboardLayout>
                <Overview />
              </DashboardLayout>
            } />
            <Route path="/posts" element={
              <DashboardLayout>
                <PostPerformance />
              </DashboardLayout>
            } />
            <Route path="/suggestions" element={
              <DashboardLayout>
                <AISuggestions />
              </DashboardLayout>
            } />
            <Route path="/settings" element={
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </FacebookProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
