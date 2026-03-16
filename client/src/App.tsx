import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import UploadPage from "@/pages/upload";
import VideosListPage from "@/pages/videos-list";
import VideoDetailPage from "@/pages/video-detail";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing-page";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      
      {/* App Routes wrapped in Layout */}
      <Route path="/app">
        <Layout><UploadPage /></Layout>
      </Route>
      <Route path="/videos">
        <Layout><VideosListPage /></Layout>
      </Route>
      <Route path="/videos/:id">
        <Layout><VideoDetailPage /></Layout>
      </Route>
      <Route>
        <Layout><NotFound /></Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
