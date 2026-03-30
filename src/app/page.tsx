"use client";

import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { LoginForm } from "@/components/dashboard/login-form";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppHeader } from "@/components/dashboard/header";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { SeoAudit } from "@/components/dashboard/seo-audit";
import { KeywordResearch } from "@/components/dashboard/keyword-research";
import { BacklinkAnalysis } from "@/components/dashboard/backlink-analysis";
import { RankTracking } from "@/components/dashboard/rank-tracking";
import { CompetitorAnalysis } from "@/components/dashboard/competitor-analysis";
import { ContentOptimization } from "@/components/dashboard/content-optimization";
import { AIWriter } from "@/components/dashboard/ai-writer";
import { InternalLinking } from "@/components/dashboard/internal-linking";
import { Automation } from "@/components/dashboard/automation";
import { Reports } from "@/components/dashboard/reports";
import { Settings } from "@/components/dashboard/settings";

function PageFallback() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[400px] rounded-xl" />
    </div>
  );
}

const pageComponents: Record<string, React.ComponentType> = {
  dashboard: DashboardOverview,
  audit: SeoAudit,
  keywords: KeywordResearch,
  backlinks: BacklinkAnalysis,
  rankings: RankTracking,
  competitors: CompetitorAnalysis,
  content: ContentOptimization,
  "ai-writer": AIWriter,
  "internal-links": InternalLinking,
  automation: Automation,
  reports: Reports,
  settings: Settings,
};

function DashboardLayout() {
  const { currentPage } = useAppStore();
  const PageComponent = pageComponents[currentPage];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          {PageComponent ? <PageComponent /> : <PageFallback />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function Home() {
  const { isAuthenticated, setIsAuthenticated, setUser } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("seo_token");
    const userStr = localStorage.getItem("seo_user");
    // Batch state updates after reading localStorage
    requestAnimationFrame(() => {
      setMounted(true);
    });
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsAuthenticated(true);
        setUser(user);
      } catch {
        localStorage.removeItem("seo_token");
        localStorage.removeItem("seo_user");
      }
    }
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <LoginForm />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <DashboardLayout />
    </ThemeProvider>
  );
}
