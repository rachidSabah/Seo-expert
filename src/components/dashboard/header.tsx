"use client";

import React from "react";
import { useAppStore } from "@/store/app-store";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const notifications = [
  { id: 1, title: "Ranking dropped for 'seo tools'", time: "2h ago", severity: "warning" },
  { id: 2, title: "New backlink from moz.com", time: "5h ago", severity: "success" },
  { id: 3, title: "Audit completed successfully", time: "1d ago", severity: "info" },
];

const pageTitle: Record<string, string> = {
  dashboard: "Dashboard Overview",
  audit: "SEO Audit",
  keywords: "Keyword Research",
  backlinks: "Backlink Analysis",
  rankings: "Rank Tracking",
  competitors: "Competitor Analysis",
  content: "On-Page SEO Assistant",
  "ai-writer": "AI Content Writer",
  "internal-links": "Internal Linking Engine",
  automation: "SEO Automation",
  reports: "Reports",
  settings: "Settings",
};

export function AppHeader() {
  const { currentPage } = useAppStore();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      <SidebarTrigger className="-ml-1" />
      <div className="flex-1">
        <h1 className="text-lg font-semibold">{pageTitle[currentPage] || "Dashboard"}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="hidden sm:flex">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-emerald-600 text-white border-0">
                3
              </Badge>
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            {notifications.map((n) => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-3">
                <span className="text-sm font-medium">{n.title}</span>
                <span className="text-xs text-muted-foreground">{n.time}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <ThemeToggle />
      </div>
    </header>
  );
}
