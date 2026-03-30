"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppStore } from "@/store/app-store";
import { getSites, getAllLatestAnalyses } from "@/lib/site-store";
import type { Site, SiteAnalysis } from "@/lib/site-store";
import {
  Search,
  Target,
  ArrowRight,
  Globe,
  FileText,
  Sparkles,
  TrendingUp,
  Link2,
  Users,
  Key,
  Zap,
  Download,
  Eye,
  RefreshCw,
  BarChart3,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  CircleDot,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalysisWithSite extends SiteAnalysis {
  siteName: string;
  domain: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SCORE_COLORS = {
  good: "#10b981",
  ok: "#f59e0b",
  poor: "#ef4444",
} as const;

const SCORE_THRESHOLDS = { good: 80, ok: 50, poor: 0 } as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.good) return SCORE_COLORS.good;
  if (score >= SCORE_THRESHOLDS.ok) return SCORE_COLORS.ok;
  return SCORE_COLORS.poor;
}

function getScoreBadgeClass(score: number): string {
  if (score >= SCORE_THRESHOLDS.good) {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
  }
  if (score >= SCORE_THRESHOLDS.ok) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-800";
  }
  return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800";
}

function getScoreLabel(score: number): string {
  if (score >= SCORE_THRESHOLDS.good) return "Good";
  if (score >= SCORE_THRESHOLDS.ok) return "OK";
  return "Poor";
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatRelativeTime(dateStr: string): string {
  try {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
}

function safeDisplay(value: number, fallback: string = "--"): string {
  if (value === 0 || value === null || value === undefined || isNaN(value))
    return fallback;
  return value.toString();
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}

function PieTooltipContent({ active, payload }: PieTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: entry.payload.color }}
        />
        <span className="font-medium text-popover-foreground">{entry.name}</span>
        <span className="text-muted-foreground">{entry.value} site{entry.value !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}

// ─── Platform Feature Cards ───────────────────────────────────────────────────

const PLATFORM_FEATURES = [
  {
    icon: Key,
    title: "Keyword Research",
    description:
      "Discover high-value keywords with volume, CPC, and difficulty analysis",
    status: "live" as const,
  },
  {
    icon: Link2,
    title: "Backlink Analysis",
    description:
      "Analyze your link profile and detect toxic backlinks",
    status: "live" as const,
  },
  {
    icon: TrendingUp,
    title: "Rank Tracking",
    description:
      "Track keyword positions across multiple geographies",
    status: "live" as const,
  },
  {
    icon: FileText,
    title: "On-Page SEO",
    description:
      "Real-time scoring with Rank Math-style checklist",
    status: "live" as const,
  },
  {
    icon: Sparkles,
    title: "AI Content Writer",
    description:
      "Generate SEO articles with Puter.js AI",
    status: "coming" as const,
  },
  {
    icon: Users,
    title: "Competitor Analysis",
    description:
      "Compare your domain against competitors",
    status: "coming" as const,
  },
];

function PlatformFeaturesSection() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Platform Capabilities
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Everything you need for comprehensive SEO management
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORM_FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card
              key={feature.title}
              className="group hover:shadow-md transition-shadow duration-200 border-border/60"
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
                    <Icon className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">
                        {feature.title}
                      </h4>
                      {feature.status === "coming" ? (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-4 font-medium"
                        >
                          Coming Soon
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-4 font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0"
                        >
                          Live ✓
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── KPI Card Component ───────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  iconBg?: string;
  subtitle?: string;
  trend?: { value: string; positive: boolean };
}

function KpiCard({ label, value, icon: Icon, iconBg = "bg-emerald-50 dark:bg-emerald-950/50", subtitle, trend }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1.5 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-foreground tracking-tight">
                {value}
              </span>
              {trend && (
                <span
                  className={`text-xs font-medium ${
                    trend.positive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-500"
                  }`}
                >
                  {trend.value}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div
            className={`h-10 w-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}
          >
            <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Score Distribution Chart ─────────────────────────────────────────────────

interface ScoreDistributionProps {
  analyses: AnalysisWithSite[];
}

function ScoreDistribution({ analyses }: ScoreDistributionProps) {
  const good = analyses.filter((a) => a.score >= 80).length;
  const ok = analyses.filter((a) => a.score >= 50 && a.score < 80).length;
  const poor = analyses.filter((a) => a.score < 50).length;

  const data = [
    { name: "Good (80-100)", value: good, color: SCORE_COLORS.good },
    { name: "OK (50-79)", value: ok, color: SCORE_COLORS.ok },
    { name: "Poor (0-49)", value: poor, color: SCORE_COLORS.poor },
  ].filter((d) => d.value > 0);

  const hasData = data.length > 0;
  const totalAnalyzed = analyses.length;

  if (!hasData) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">Score Distribution</CardTitle>
          <CardDescription>No analyzed sites yet</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[240px]">
          <div className="text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Analyze sites to see distribution
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Score Distribution</CardTitle>
            <CardDescription>
              {totalAnalyzed} site{totalAnalyzed !== 1 ? "s" : ""} analyzed
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs">
            {totalAnalyzed} total
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="h-[180px] w-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<PieTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {data.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-1.5 text-xs"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">{item.name}</span>
                <span className="font-semibold text-foreground">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Get Started Hero (No Sites) ──────────────────────────────────────────────

function GetStartedHero() {
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative rounded-2xl border border-border bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-emerald-950/20 dark:via-background dark:to-emerald-950/20 p-8 sm:p-12 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/40 via-transparent to-transparent dark:from-emerald-900/20 dark:via-transparent dark:to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-lg mx-auto">
          <div className="h-16 w-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-6">
            <Target className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Welcome to SEO Expert
          </h2>
          <p className="text-muted-foreground mt-3 text-base leading-relaxed max-w-md mx-auto">
            Enter a website URL in the SEO Audit tool to get started with
            real-time analysis, scoring, and actionable recommendations.
          </p>
          <Button
            onClick={() => setCurrentPage("audit")}
            className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 text-sm font-medium shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all duration-200"
          >
            Go to SEO Audit
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="group hover:shadow-md transition-shadow duration-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
                <Globe className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Real Website Analysis
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Analyze any URL with Google PageSpeed Insights API and
                  comprehensive HTML parsing
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-md transition-shadow duration-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  AI-Powered Scoring
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Rank Math-style 100-point scoring system with performance,
                  content, and technical analysis
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-md transition-shadow duration-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
                <Download className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Actionable Reports
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Export CSV and PDF reports with detailed issue breakdowns and
                  prioritized recommendations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Features */}
      <PlatformFeaturesSection />
    </div>
  );
}

// ─── Real Dashboard (Has Sites) ───────────────────────────────────────────────

function RealDashboard({
  sites,
  analyses,
}: {
  sites: Site[];
  analyses: AnalysisWithSite[];
}) {
  const { setCurrentPage, setSelectedProject } = useAppStore();
  const [selectedSiteId, setSelectedSiteId] = useState<string>("all");

  // ── KPI Calculations ──
  const scores = analyses.map((a) => a.score);
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : 0;
  const totalIssues = analyses.reduce((sum, a) => sum + a.issues.length, 0);
  const topScore = scores.length > 0 ? Math.max(...scores) : 0;

  // ── Score Distribution ──
  const scoreDistribution = analyses.filter((a) => a.score >= 80).length;
  const scoreOk = analyses.filter((a) => a.score >= 50 && a.score < 80).length;
  const scorePoor = analyses.filter((a) => a.score < 50).length;

  // ── Filtered analyses for recent list ──
  const recentAnalyses = analyses.slice(0, 10);

  // ── Navigation helpers ──
  const goToAudit = useCallback(() => {
    setCurrentPage("audit");
  }, [setCurrentPage]);

  const goToAuditWithUrl = useCallback(
    (url: string) => {
      setSelectedProject(url);
      setCurrentPage("audit");
    },
    [setSelectedProject, setCurrentPage]
  );

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard Overview
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track your SEO performance across{" "}
            {sites.length} site{sites.length !== 1 ? "s" : ""}.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select
            value={selectedSiteId}
            onValueChange={setSelectedSiteId}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.domain}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground"
          >
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            All Time
          </Button>
          <Button
            onClick={goToAudit}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Zap className="h-4 w-4 mr-1.5" />
            Quick Analyze
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Sites Analyzed"
          value={String(sites.length)}
          icon={Globe}
          subtitle={`${sites.filter((s) => s.lastAnalysisAt).length} with analysis`}
        />
        <KpiCard
          label="Avg SEO Score"
          value={safeDisplay(avgScore)}
          icon={Shield}
          subtitle={avgScore > 0 ? getScoreLabel(avgScore) : "No data yet"}
        />
        <KpiCard
          label="Total Issues"
          value={safeDisplay(totalIssues)}
          icon={AlertTriangle}
          subtitle={
            totalIssues > 0
              ? `Across ${analyses.length} analyses`
              : "No issues found"
          }
        />
        <KpiCard
          label="Top Score"
          value={safeDisplay(topScore)}
          icon={TrendingUp}
          subtitle={
            topScore > 0
              ? getScoreLabel(topScore)
              : "Analyze a site to see score"
          }
        />
      </div>

      {/* Main Grid: Sites Table + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analyzed Sites Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Analyzed Sites</CardTitle>
                <CardDescription>
                  {analyses.length} site{analyses.length !== 1 ? "s" : ""} with
                  analysis data
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                {sites.length} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {analyses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Search className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  No analyses yet
                </p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Run your first SEO audit to see data here
                </p>
                <Button
                  onClick={goToAudit}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Analyze a Site
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto pr-1 space-y-2">
                {analyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="flex items-center gap-4 rounded-lg border border-border/60 p-3.5 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center justify-center h-11 w-11 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 shrink-0">
                      <Globe className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {analysis.domain}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 h-4 font-semibold border ${getScoreBadgeClass(analysis.score)}`}
                        >
                          {analysis.score}/100
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(analysis.analyzedAt)}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {analysis.issues.length} issue
                          {analysis.issues.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => goToAuditWithUrl(analysis.url)}
                              className="h-8 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View Details</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => goToAuditWithUrl(analysis.url)}
                              className="h-8 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1" />
                              Re-analyze
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Re-analyze this site</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <ScoreDistribution analyses={analyses} />
      </div>

      {/* Recent Analyses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Analyses</CardTitle>
              <CardDescription>
                Latest SEO audit results across all sites
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              Last {recentAnalyses.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {recentAnalyses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CircleDot className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                No analyses to show
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto pr-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background z-10">
                  <tr className="border-b border-border">
                    <th className="text-left py-2.5 font-medium text-muted-foreground text-xs">
                      Site
                    </th>
                    <th className="text-center py-2.5 font-medium text-muted-foreground text-xs">
                      Score
                    </th>
                    <th className="text-center py-2.5 font-medium text-muted-foreground text-xs">
                      Status
                    </th>
                    <th className="text-center py-2.5 font-medium text-muted-foreground text-xs">
                      Issues
                    </th>
                    <th className="text-right py-2.5 font-medium text-muted-foreground text-xs">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentAnalyses.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-2.5 font-medium text-foreground truncate max-w-[200px]">
                        {a.domain}
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`inline-flex items-center justify-center h-6 px-2 rounded-md text-xs font-semibold ${getScoreBadgeClass(a.score)}`}
                        >
                          {a.score}
                        </span>
                      </td>
                      <td className="py-2.5 text-center">
                        {a.status === "good" ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                        ) : a.status === "ok" ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500 mx-auto" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="py-2.5 text-center text-muted-foreground">
                        {a.issues.length}
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground text-xs">
                        {formatDate(a.analyzedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions Row */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground shrink-0">
              Quick Actions
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={goToAudit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <Search className="h-4 w-4 mr-2" />
                Analyze New Site
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export All Reports
              </Button>
              <Button variant="outline" onClick={goToAudit}>
                <Eye className="h-4 w-4 mr-2" />
                View All Sites
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Features */}
      <PlatformFeaturesSection />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardOverview() {
  const [sites, setSites] = useState<Site[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisWithSite[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    function syncData() {
      const loadedSites = getSites();
      const loadedAnalyses = getAllLatestAnalyses();
      setSites(loadedSites);
      setAnalyses(loadedAnalyses);
      setIsHydrated(true);
    }

    // Schedule initial load to avoid synchronous setState in effect
    const rafId = requestAnimationFrame(syncData);

    // Cross-tab sync via storage event
    window.addEventListener("storage", syncData);
    // Poll every 3 seconds for same-tab changes (e.g. new analysis saved)
    const interval = setInterval(syncData, 3000);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("storage", syncData);
      clearInterval(interval);
    };
  }, []);

  // Show skeleton while hydrating
  if (!isHydrated) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="h-8 w-48 bg-muted rounded-md animate-pulse" />
            <div className="h-4 w-72 bg-muted rounded-md animate-pulse mt-2" />
          </div>
          <div className="flex gap-3">
            <div className="h-9 w-[220px] bg-muted rounded-md animate-pulse" />
            <div className="h-9 w-32 bg-muted rounded-md animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[100px] bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-[300px] bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  const hasSites = sites.length > 0;

  if (!hasSites) {
    return <GetStartedHero />;
  }

  return <RealDashboard sites={sites} analyses={analyses} />;
}
