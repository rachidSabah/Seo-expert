"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Globe,
  Zap,
  FileText,
  BarChart3,
  Download,
  Shield,
  Smartphone,
  Monitor,
  ArrowRight,
  Trash2,
  ExternalLink,
  Search,
  Target,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

import { analyzeUrl, isValidUrl, type SiteAnalysisResult } from "@/lib/url-analyzer";
import { getSites, addSite, saveAnalysis, getLatestAnalysis, getScoreHistory, removeSite, type Site } from "@/lib/site-store";
import { generateCsvReport, generateHtmlReport, generateIssuesCsv, downloadFile } from "@/lib/report-generator";

// ─── Helper Functions ──────────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Good";
  if (score >= 50) return "OK";
  return "Poor";
}

function getCwvRating(metric: string, value: number | null): { label: string; color: string } {
  if (value === null) return { label: "N/A", color: "#6b7280" };
  const thresholds: Record<string, [number, number]> = {
    lcp: [2.5, 4],
    cls: [0.1, 0.25],
    fcp: [1.8, 3],
    ttfb: [0.8, 1.5],
    tbt: [200, 600],
    fid: [100, 300],
    speedIndex: [3.4, 5.8],
  };
  const [good, poor] = thresholds[metric] || [1, 2];
  if (value <= good) return { label: "Good", color: "#10b981" };
  if (value <= poor) return { label: "Needs Improvement", color: "#f59e0b" };
  return { label: "Poor", color: "#ef4444" };
}

function getCwvTarget(metric: string): string {
  const targets: Record<string, string> = {
    lcp: "< 2.5s",
    cls: "< 0.1",
    fcp: "< 1.8s",
    ttfb: "< 0.8s",
    tbt: "< 200ms",
    fid: "< 100ms",
    speedIndex: "< 3.4s",
  };
  return targets[metric] || "";
}

function formatCwvValue(metric: string, value: number | null): string {
  if (value === null) return "N/A";
  const msMetrics = ["tbt", "fid"];
  if (msMetrics.includes(metric)) return `${value}ms`;
  return `${value}s`;
}

function truncateUrl(url: string, maxLen: number = 50): string {
  if (url.length <= maxLen) return url;
  return url.slice(0, maxLen - 3) + "...";
}

function computeContentScore(r: SiteAnalysisResult): number {
  let s = 0;
  const op = r.onPage;
  if (op.title) {
    if (op.titleLength >= 30 && op.titleLength <= 60) s += 30;
    else if (op.titleLength >= 10) s += 15;
    else s += 5;
  }
  if (op.metaDescription) {
    if (op.metaDescriptionLength >= 120 && op.metaDescriptionLength <= 160) s += 25;
    else if (op.metaDescriptionLength >= 50) s += 15;
    else s += 5;
  }
  if (op.h1.length === 1) s += 20;
  else if (op.h1.length > 1) s += 10;
  if (op.wordCount >= 600) s += 25;
  else if (op.wordCount >= 300) s += 15;
  else if (op.wordCount > 0) s += 5;
  return Math.min(100, s);
}

function computeTechnicalScore(r: SiteAnalysisResult): number {
  let s = 0;
  const op = r.onPage;
  if (op.hasHttps) s += 20;
  if (op.viewportMeta) s += 20;
  if (op.canonicalUrl) s += 15;
  if (op.hasSitemap) s += 15;
  if (op.hasRobotsTxt) s += 10;
  if (op.charset) s += 10;
  if (op.lang) s += 10;
  return Math.min(100, s);
}

function computeLinkScore(r: SiteAnalysisResult): number {
  let s = 0;
  if (r.onPage.internalLinks >= 3) s += 60;
  else if (r.onPage.internalLinks >= 1) s += 30;
  if (r.onPage.externalLinks >= 1) s += 40;
  return Math.min(100, s);
}

function computeAccessibilityScore(r: SiteAnalysisResult): number {
  let s = 0;
  const op = r.onPage;
  if (op.imageCount === 0) {
    s += 50;
  } else {
    s += Math.round((op.imagesWithAlt / op.imageCount) * 50);
  }
  if (op.lang) s += 30;
  if (op.charset) s += 20;
  return Math.min(100, s);
}

// ─── Sub-Components ────────────────────────────────────────────────────────────

function ScoreGauge({ score, size = 200 }: { score: number; size?: number }) {
  const radius = (size - 28) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (score / 100) * circumference);
    }, 100);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          className="text-muted/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-[1500ms] ease-out"
          style={{ filter: `drop-shadow(0 0 8px ${color}50)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-bold text-foreground" style={{ fontSize: size * 0.22 }}>{score}</span>
        <span className="text-sm text-muted-foreground font-medium">/ 100</span>
        <Badge
          className={`mt-1.5 text-xs ${
            score >= 80
              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : score >= 50
              ? "bg-amber-100 text-amber-700 border-amber-200"
              : "bg-red-100 text-red-700 border-red-200"
          }`}
        >
          {label}
        </Badge>
      </div>
    </div>
  );
}

function MiniScoreGauge({ score, label, icon: Icon }: { score: number | null; label: string; icon: React.ElementType }) {
  if (score === null) {
    return (
      <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/50">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="text-lg font-bold text-muted-foreground">N/A</span>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
    );
  }
  const r = 42;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - score / 100);
  const color = getScoreColor(score);
  const statusText = getScoreLabel(score);

  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/50">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div className="relative flex items-center justify-center">
        <svg width="100" height="100" className="-rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} className="transition-all duration-1000" />
        </svg>
        <div className="absolute">
          <span className="text-xl font-bold">{score}</span>
        </div>
      </div>
      <span className="text-sm font-medium">{label}</span>
      <Badge variant="outline" className={`text-xs ${
        score >= 80
          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
          : score >= 50
          ? "bg-amber-100 text-amber-700 border-amber-200"
          : "bg-red-100 text-red-700 border-red-200"
      }`}>{statusText}</Badge>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, { className: string; icon: React.ReactNode }> = {
    critical: {
      className: "bg-red-100 text-red-700 border-red-200",
      icon: <XCircle className="h-3 w-3" />,
    },
    warning: {
      className: "bg-amber-100 text-amber-700 border-amber-200",
      icon: <AlertTriangle className="h-3 w-3" />,
    },
    info: {
      className: "bg-sky-100 text-sky-700 border-sky-200",
      icon: <Info className="h-3 w-3" />,
    },
  };
  const c = config[severity] || config.info;
  return (
    <Badge variant="outline" className={`text-xs font-medium gap-1 ${c.className}`}>
      {c.icon}
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    performance: "bg-purple-100 text-purple-700 border-purple-200",
    content: "bg-sky-100 text-sky-700 border-sky-200",
    technical: "bg-orange-100 text-orange-700 border-orange-200",
    links: "bg-teal-100 text-teal-700 border-teal-200",
    security: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <Badge variant="outline" className={`text-xs font-medium ${colors[category] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </Badge>
  );
}

function ImpactBadge({ impact }: { impact: string }) {
  const colors: Record<string, string> = {
    high: "text-red-600 font-semibold",
    medium: "text-amber-600 font-medium",
    low: "text-sky-600",
  };
  return (
    <span className={`text-xs capitalize ${colors[impact] || ""}`}>
      {impact.charAt(0).toUpperCase() + impact.slice(1)}
    </span>
  );
}

function ScoreBar({ value, label }: { value: number; label: string }) {
  const color = getScoreColor(value);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold" style={{ color }}>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Score header skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <Skeleton className="rounded-full" style={{ width: 200, height: 200 }} />
            <div className="flex-1 space-y-4 w-full">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-48" />
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-96 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Technical SEO",
      description: "Page speed, Core Web Vitals, HTTPS, mobile-friendliness, and server response analysis.",
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "On-Page SEO",
      description: "Title tags, meta descriptions, headings, content quality, image optimization, and link structure.",
    },
    {
      icon: <Lightbulb className="h-6 w-6" />,
      title: "Actionable Insights",
      description: "Prioritized issues with severity levels, impact scores, and specific fix recommendations.",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12 animate-in fade-in duration-500">
      <div className="h-20 w-20 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6">
        <Search className="h-10 w-10 text-emerald-600" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Enter a URL above to start your SEO analysis
      </h3>
      <p className="text-sm text-muted-foreground mb-10 max-w-md text-center">
        Get a comprehensive SEO audit with real-time data from Google PageSpeed, on-page analysis, and actionable recommendations.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
        {features.map((f) => (
          <Card key={f.title} className="border-dashed">
            <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                {f.icon}
              </div>
              <h4 className="font-semibold text-sm text-foreground">{f.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Loading State ─────────────────────────────────────────────────────────────

const LOADING_STEPS = [
  { emoji: "🔍", text: "Fetching page content..." },
  { emoji: "⚡", text: "Analyzing performance (PageSpeed)..." },
  { emoji: "📄", text: "Parsing on-page elements..." },
  { emoji: "🔗", text: "Checking links and resources..." },
  { emoji: "✨", text: "Calculating SEO score..." },
];

function LoadingState({ step }: { step: string }) {
  const stepIndex = LOADING_STEPS.findIndex((s) => s.text === step);
  const progress = stepIndex >= 0 ? ((stepIndex + 1) / LOADING_STEPS.length) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <LoadingSkeleton />
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-emerald-600 animate-spin shrink-0" />
            <p className="text-sm font-medium text-emerald-800">{step}</p>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="space-y-2">
            {LOADING_STEPS.map((s, i) => {
              const isDone = i < stepIndex;
              const isCurrent = i === stepIndex;
              return (
                <div
                  key={s.text}
                  className={`flex items-center gap-2 text-xs transition-colors ${
                    isDone
                      ? "text-emerald-600"
                      : isCurrent
                      ? "text-emerald-700 font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : isCurrent ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
                  )}
                  {s.emoji} {s.text}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sites Dialog ──────────────────────────────────────────────────────────────

function SitesDialog({
  open,
  onOpenChange,
  sites,
  onSelectSite,
  onRemoveSite,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sites: Site[];
  onSelectSite: (site: Site) => void;
  onRemoveSite: (id: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Sites</DialogTitle>
          <DialogDescription>Your saved sites and analysis history.</DialogDescription>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
          {sites.length === 0 ? (
            <div className="py-8 text-center">
              <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No sites analyzed yet. Enter a URL above to get started.
              </p>
            </div>
          ) : (
            sites.map((site) => (
              <div
                key={site.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
              >
                <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <Globe className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{site.domain}</p>
                  <p className="text-xs text-muted-foreground">
                    {site.lastAnalysisAt
                      ? `Last: ${new Date(site.lastAnalysisAt).toLocaleDateString()}`
                      : "Not analyzed"}
                  </p>
                </div>
                {site.seoScore !== null && (
                  <Badge
                    className={`text-xs shrink-0 ${
                      site.seoScore >= 80
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : site.seoScore >= 50
                        ? "bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-red-100 text-red-700 border-red-200"
                    }`}
                  >
                    {site.seoScore}
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs shrink-0"
                  onClick={() => {
                    onSelectSite(site);
                    onOpenChange(false);
                  }}
                >
                  Analyze
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-red-500 hover:text-red-700 shrink-0"
                  onClick={() => onRemoveSite(site.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function SeoAudit() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<SiteAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [sites, setSites] = useState<Site[]>([]);
  const [showSitesDialog, setShowSitesDialog] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [scoreHistory, setScoreHistory] = useState<{ date: string; score: number }[]>([]);
  const currentSiteIdRef = useRef<string | null>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load sites on mount
  useEffect(() => {
    setSites(getSites());
  }, []);

  const refreshSites = useCallback(() => {
    setSites(getSites());
  }, []);

  const handleAnalyze = useCallback(
    async (targetUrl?: string) => {
      const inputUrl = (targetUrl || url).trim();
      setError("");
      setActiveTab("overview");

      const validation = isValidUrl(inputUrl);
      if (!validation.valid) {
        setError(validation.error || "Invalid URL");
        toast.error("Invalid URL", { description: validation.error });
        return;
      }

      const normalizedUrl = validation.normalized;
      setUrl(normalizedUrl);
      setLoading(true);
      setLoadingStep(LOADING_STEPS[0].text);

      // Step through loading states
      let stepIdx = 0;
      const advanceStep = () => {
        stepIdx++;
        if (stepIdx < LOADING_STEPS.length) {
          setLoadingStep(LOADING_STEPS[stepIdx].text);
          loadingTimerRef.current = setTimeout(advanceStep, 2000);
        }
      };
      loadingTimerRef.current = setTimeout(advanceStep, 2000);

      try {
        const analysisResult = await analyzeUrl(normalizedUrl);

        // Clear the timer — analysis might finish before all steps
        if (loadingTimerRef.current) {
          clearTimeout(loadingTimerRef.current);
          loadingTimerRef.current = null;
        }

        // Save to store
        const site = addSite(normalizedUrl);
        currentSiteIdRef.current = site.id;
        saveAnalysis(site.id, {
          siteId: site.id,
          url: normalizedUrl,
          analyzedAt: analysisResult.analyzedAt,
          score: analysisResult.score,
          status: analysisResult.status,
          issues: analysisResult.issues,
          quickStats: {
            performance: analysisResult.performance.mobileScore,
            contentScore: computeContentScore(analysisResult),
            technicalScore: computeTechnicalScore(analysisResult),
            linksScore: computeLinkScore(analysisResult),
            wordCount: analysisResult.onPage.wordCount,
            titleLength: analysisResult.onPage.titleLength,
            metaDescLength: analysisResult.onPage.metaDescriptionLength,
            imageCount: analysisResult.onPage.imageCount,
            internalLinks: analysisResult.onPage.internalLinks,
            externalLinks: analysisResult.onPage.externalLinks,
          },
        });

        setResult(analysisResult);
        setScoreHistory(getScoreHistory(site.id));
        refreshSites();
        toast.success("Analysis Complete", {
          description: `${normalizedUrl} scored ${analysisResult.score}/100`,
        });
      } catch (err) {
        if (loadingTimerRef.current) {
          clearTimeout(loadingTimerRef.current);
          loadingTimerRef.current = null;
        }
        const message = err instanceof Error ? err.message : "Analysis failed. Please try again.";
        setError(message);
        toast.error("Analysis Failed", { description: message });
      } finally {
        setLoading(false);
        setLoadingStep("");
      }
    },
    [url, refreshSites],
  );

  const handleSelectSite = useCallback(
    (site: Site) => {
      setUrl(site.url);
      // Load latest analysis if available
      const latest = getLatestAnalysis(site.id);
      if (latest) {
        // We stored the raw analysis data, reconstruct a result-like display
        currentSiteIdRef.current = site.id;
        setScoreHistory(getScoreHistory(site.id));
        // Trigger a fresh analysis
        handleAnalyze(site.url);
      } else {
        handleAnalyze(site.url);
      }
    },
    [handleAnalyze],
  );

  const handleRemoveSite = useCallback(
    (id: string) => {
      removeSite(id);
      refreshSites();
      if (currentSiteIdRef.current === id) {
        setResult(null);
        setScoreHistory([]);
        currentSiteIdRef.current = null;
      }
      toast.success("Site removed");
    },
    [refreshSites],
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  // Filtered issues
  const filteredIssues = result
    ? result.issues.filter((issue) => {
        if (severityFilter !== "all" && issue.severity !== severityFilter) return false;
        if (categoryFilter !== "all" && issue.category !== categoryFilter) return false;
        return true;
      })
    : [];

  // ── Render ─────────────────────────────────────────────────────────────────

  const isInitial = !result && !loading && !error;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Top Bar: URL Input + Site Management ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="pl-10 h-11 text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) handleAnalyze();
            }}
            disabled={loading}
          />
        </div>
        <Button
          onClick={() => handleAnalyze()}
          disabled={loading || !url.trim()}
          className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white px-6 font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Analyze
            </>
          )}
        </Button>
        <Button
          variant="outline"
          className="h-11"
          onClick={() => setShowSitesDialog(true)}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Manage Sites
        </Button>
      </div>

      {/* Error message */}
      {error && !loading && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-red-600"
              onClick={() => setError("")}
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Sites Dialog ── */}
      <SitesDialog
        open={showSitesDialog}
        onOpenChange={setShowSitesDialog}
        sites={sites}
        onSelectSite={handleSelectSite}
        onRemoveSite={handleRemoveSite}
      />

      {/* ── State 1: Empty / Initial ── */}
      {isInitial && <EmptyState />}

      {/* ── State 2: Loading ── */}
      {loading && <LoadingState step={loadingStep} />}

      {/* ── State 3: Results ── */}
      {result && !loading && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* ── Score Header ── */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <ScoreGauge score={result.score} />
                <div className="flex-1 space-y-4 text-center lg:text-left w-full">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {truncateUrl(result.url, 60)}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5 justify-center lg:justify-start">
                      <Clock className="h-3.5 w-3.5" />
                      Last analyzed: {new Date(result.analyzedAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAnalyze()}
                    className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Re-analyze
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Quick Stats Row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Performance Score */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <span className="text-xs font-medium text-muted-foreground">Performance</span>
                </div>
                {result.performance.mobileScore !== null ? (
                  <>
                    <p className="text-2xl font-bold" style={{ color: getScoreColor(result.performance.mobileScore) }}>
                      {result.performance.mobileScore}
                    </p>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${result.performance.mobileScore}%`,
                          backgroundColor: getScoreColor(result.performance.mobileScore),
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-lg font-bold text-muted-foreground">N/A</p>
                )}
              </CardContent>
            </Card>

            {/* Content Score */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-sky-500" />
                  <span className="text-xs font-medium text-muted-foreground">Content</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: getScoreColor(computeContentScore(result)) }}>
                  {computeContentScore(result)}
                </p>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${computeContentScore(result)}%`,
                      backgroundColor: getScoreColor(computeContentScore(result)),
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Technical Score */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-orange-500" />
                  <span className="text-xs font-medium text-muted-foreground">Technical</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: getScoreColor(computeTechnicalScore(result)) }}>
                  {computeTechnicalScore(result)}
                </p>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${computeTechnicalScore(result)}%`,
                      backgroundColor: getScoreColor(computeTechnicalScore(result)),
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Links */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="h-4 w-4 text-teal-500" />
                  <span className="text-xs font-medium text-muted-foreground">Links</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {result.onPage.internalLinks}
                  <span className="text-sm font-normal text-muted-foreground"> / {result.onPage.externalLinks}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  internal / external
                </p>
              </CardContent>
            </Card>

            {/* Readability */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-medium text-muted-foreground">Readability</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{result.readability.fleschScore}</p>
                <Badge
                  variant="outline"
                  className={`text-xs mt-1 ${
                    result.readability.level === "easy"
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : result.readability.level === "moderate"
                      ? "bg-amber-100 text-amber-700 border-amber-200"
                      : "bg-red-100 text-red-700 border-red-200"
                  }`}
                >
                  {result.readability.level.charAt(0).toUpperCase() + result.readability.level.slice(1)}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* ── Tabs ── */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">
                <BarChart3 className="h-4 w-4 mr-1.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="performance">
                <Zap className="h-4 w-4 mr-1.5" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="content">
                <FileText className="h-4 w-4 mr-1.5" />
                Content
              </TabsTrigger>
              <TabsTrigger value="issues">
                <AlertCircle className="h-4 w-4 mr-1.5" />
                Issues
                <Badge variant="secondary" className="ml-1.5 text-xs">{result.issues.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="export">
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </TabsTrigger>
            </TabsList>

            {/* ── Tab 1: Overview ── */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Page Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Page Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-sm text-muted-foreground shrink-0">Title</span>
                        <span className="text-sm font-medium text-right break-all">{result.onPage.title || "—"}</span>
                      </div>
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-sm text-muted-foreground shrink-0">Meta Description</span>
                        <span className="text-sm font-medium text-right break-all">
                          {result.onPage.metaDescription || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">H1 Headings</span>
                        <span className="text-sm font-medium">{result.onPage.h1.length} found</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Word Count</span>
                        <span className="text-sm font-medium">{result.onPage.wordCount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Links</span>
                        <span className="text-sm font-medium">{result.onPage.totalLinks}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Images</span>
                        <span className="text-sm font-medium">{result.onPage.imageCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Reading Time</span>
                        <span className="text-sm font-medium">~{result.readability.readingTime} min</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Score Breakdown Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Score Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <ScoreBar
                        value={result.performance.mobileScore ?? 0}
                        label="Performance"
                      />
                      <ScoreBar
                        value={computeContentScore(result)}
                        label="Content"
                      />
                      <ScoreBar
                        value={computeTechnicalScore(result)}
                        label="Technical"
                      />
                      <ScoreBar
                        value={computeLinkScore(result)}
                        label="Links"
                      />
                      <ScoreBar
                        value={computeAccessibilityScore(result)}
                        label="Accessibility"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── Tab 2: Performance ── */}
            <TabsContent value="performance" className="space-y-6">
              {/* Mobile + Desktop Score Gauges */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Page Speed Scores</CardTitle>
                  <CardDescription>Google Lighthouse performance analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <MiniScoreGauge score={result.performance.mobileScore} label="Mobile" icon={Smartphone} />
                    <MiniScoreGauge score={result.performance.desktopScore} label="Desktop" icon={Monitor} />
                  </div>
                </CardContent>
              </Card>

              {/* Core Web Vitals Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Core Web Vitals</CardTitle>
                  <CardDescription>Real-user performance metrics from PageSpeed API</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Metric</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Target</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { key: "lcp", label: "Largest Contentful Paint" },
                          { key: "fcp", label: "First Contentful Paint" },
                          { key: "cls", label: "Cumulative Layout Shift" },
                          { key: "ttfb", label: "Time to First Byte" },
                          { key: "tbt", label: "Total Blocking Time" },
                          { key: "fid", label: "First Input Delay" },
                          { key: "speedIndex", label: "Speed Index" },
                        ].map((m) => {
                          const value = result.performance[m.key as keyof typeof result.performance] as number | null;
                          const rating = getCwvRating(m.key, value);
                          return (
                            <TableRow key={m.key}>
                              <TableCell className="font-medium text-sm">{m.label}</TableCell>
                              <TableCell className="text-sm font-semibold">{formatCwvValue(m.key, value)}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                  style={{
                                    color: rating.color,
                                    borderColor: rating.color + "40",
                                    backgroundColor: rating.color + "10",
                                  }}
                                >
                                  {rating.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{getCwvTarget(m.key)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab 3: Content ── */}
            <TabsContent value="content" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Title */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Title Tag</span>
                      {result.onPage.title && result.onPage.titleLength >= 30 && result.onPage.titleLength <= 60 ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Optimal
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                          <XCircle className="h-3 w-3 mr-1" /> Needs Fix
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm break-all mb-2">{result.onPage.title || <span className="text-muted-foreground italic">Missing</span>}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{result.onPage.titleLength} characters</span>
                      <span>Target: 30-60</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full transition-all ${
                          result.onPage.titleLength >= 30 && result.onPage.titleLength <= 60
                            ? "bg-emerald-500"
                            : result.onPage.titleLength > 0
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(100, (result.onPage.titleLength / 60) * 100)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Meta Description */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Meta Description</span>
                      {result.onPage.metaDescription && result.onPage.metaDescriptionLength >= 50 && result.onPage.metaDescriptionLength <= 160 ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Optimal
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                          <XCircle className="h-3 w-3 mr-1" /> Needs Fix
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm break-all mb-2">{result.onPage.metaDescription || <span className="text-muted-foreground italic">Missing</span>}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{result.onPage.metaDescriptionLength} characters</span>
                      <span>Target: 50-160</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full transition-all ${
                          result.onPage.metaDescriptionLength >= 50 && result.onPage.metaDescriptionLength <= 160
                            ? "bg-emerald-500"
                            : result.onPage.metaDescriptionLength > 0
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(100, (result.onPage.metaDescriptionLength / 160) * 100)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Headings */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Headings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">H1 Tags</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{result.onPage.h1.length}</span>
                          {result.onPage.h1.length === 1 ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          )}
                        </div>
                      </div>
                      {result.onPage.h1.length > 0 && (
                        <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 max-h-16 overflow-y-auto">
                          {result.onPage.h1.join(" | ")}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">H2 Tags</span>
                        <span className="text-sm font-semibold">{result.onPage.h2.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">H3 Tags</span>
                        <span className="text-sm font-semibold">{result.onPage.h3.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Stats */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Content Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Word Count</span>
                        <span className="text-sm font-semibold">{result.onPage.wordCount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Images</span>
                        <span className="text-sm font-semibold">
                          {result.onPage.imageCount}{" "}
                          <span className="text-muted-foreground font-normal">
                            ({result.onPage.imagesWithAlt} with alt, {result.onPage.imagesWithoutAlt} without)
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Internal Links</span>
                        <span className="text-sm font-semibold">{result.onPage.internalLinks}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">External Links</span>
                        <span className="text-sm font-semibold">{result.onPage.externalLinks}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Technical Checks */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Technical Checks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { label: "HTTPS", pass: result.onPage.hasHttps },
                        { label: "Viewport Meta", pass: result.onPage.viewportMeta },
                        { label: "Canonical", pass: !!result.onPage.canonicalUrl },
                        { label: "Sitemap", pass: result.onPage.hasSitemap },
                        { label: "Robots.txt", pass: result.onPage.hasRobotsTxt },
                        { label: "Charset", pass: !!result.onPage.charset },
                        { label: "Language", pass: !!result.onPage.lang },
                      ].map((check) => (
                        <div key={check.label} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{check.label}</span>
                          {check.pass ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Pass
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                              <XCircle className="h-3 w-3 mr-1" /> Fail
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* OG Tags */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Open Graph Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-sm text-muted-foreground shrink-0">OG Title</span>
                        <span className="text-sm text-right break-all">
                          {result.onPage.ogTitle || <span className="text-muted-foreground italic">Not set</span>}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-sm text-muted-foreground shrink-0">OG Description</span>
                        <span className="text-sm text-right break-all">
                          {result.onPage.ogDescription || <span className="text-muted-foreground italic">Not set</span>}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-sm text-muted-foreground shrink-0">OG Image</span>
                        <span className="text-sm text-right break-all max-w-[200px] truncate">
                          {result.onPage.ogImage || <span className="text-muted-foreground italic">Not set</span>}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── Tab 4: Issues ── */}
            <TabsContent value="issues" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">Issues Found</CardTitle>
                      <CardDescription>
                        {filteredIssues.length} of {result.issues.length} issues shown
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Severity Filter */}
                      <div className="flex items-center gap-1">
                        {(["all", "critical", "warning", "info"] as const).map((f) => {
                          const count = f === "all" ? result.issues.length : result.issues.filter((i) => i.severity === f).length;
                          return (
                            <Button
                              key={f}
                              variant={severityFilter === f ? "default" : "ghost"}
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => setSeverityFilter(f)}
                            >
                              {f.charAt(0).toUpperCase() + f.slice(1)}
                              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
                                {count}
                              </Badge>
                            </Button>
                          );
                        })}
                      </div>
                      {/* Category Filter */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {(["all", "performance", "content", "technical", "links", "security"] as const).map((f) => (
                          <Button
                            key={f}
                            variant={categoryFilter === f ? "default" : "ghost"}
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => setCategoryFilter(f)}
                          >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[500px] overflow-y-auto rounded-md border">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead className="w-[100px]">Severity</TableHead>
                          <TableHead className="w-[100px]">Category</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead className="w-[80px]">Impact</TableHead>
                          <TableHead className="w-[250px]">Recommendation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredIssues.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No issues match the current filters.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredIssues.map((issue) => (
                            <TableRow
                              key={issue.id}
                              className={
                                issue.severity === "critical"
                                  ? "border-l-4 border-l-red-500"
                                  : issue.severity === "warning"
                                  ? "border-l-4 border-l-amber-500"
                                  : "border-l-4 border-l-sky-400"
                              }
                            >
                              <TableCell>
                                <SeverityBadge severity={issue.severity} />
                              </TableCell>
                              <TableCell>
                                <CategoryBadge category={issue.category} />
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm font-medium">{issue.title}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">{issue.description}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <ImpactBadge impact={issue.impact} />
                              </TableCell>
                              <TableCell>
                                <p className="text-xs text-muted-foreground">{issue.recommendation}</p>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {filteredIssues.length > 0 && (
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const csv = generateIssuesCsv(filteredIssues);
                          let domain = "";
                          try { domain = new URL(result.url).hostname; } catch { domain = "site"; }
                          downloadFile(csv, `${domain}-issues.csv`, "text/csv");
                          toast.success("Issues CSV downloaded");
                        }}
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Export Issues CSV
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab 5: Export ── */}
            <TabsContent value="export" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Download className="h-7 w-7 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">CSV Report</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Full analysis data in spreadsheet format. Includes performance, content, technical, and issues.
                      </p>
                    </div>
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        const csv = generateCsvReport(result);
                        let domain = "";
                        try { domain = new URL(result.url).hostname; } catch { domain = "site"; }
                        downloadFile(csv, `${domain}-seo-report.csv`, "text/csv");
                        toast.success("CSV report downloaded");
                      }}
                    >
                      <Download className="h-4 w-4 mr-1.5" />
                      Download CSV
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-sky-100 flex items-center justify-center">
                      <FileText className="h-7 w-7 text-sky-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">HTML Report</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Styled HTML report you can print or save as PDF. Professional format for sharing.
                      </p>
                    </div>
                    <Button
                      className="w-full bg-sky-600 hover:bg-sky-700 text-white"
                      onClick={() => {
                        let domain = "";
                        try { domain = new URL(result.url).hostname; } catch { domain = "site"; }
                        const html = generateHtmlReport(result, domain);
                        downloadFile(html, `${domain}-seo-report.html`, "text/html");
                        toast.success("HTML report downloaded", { description: "Open and print to PDF" });
                      }}
                    >
                      <Download className="h-4 w-4 mr-1.5" />
                      Download HTML
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-amber-100 flex items-center justify-center">
                      <AlertCircle className="h-7 w-7 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Issues Only</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        CSV with just the issues table. Great for tracking and bug management tools.
                      </p>
                    </div>
                    <Button
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={() => {
                        const csv = generateIssuesCsv(result.issues);
                        let domain = "";
                        try { domain = new URL(result.url).hostname; } catch { domain = "site"; }
                        downloadFile(csv, `${domain}-issues-only.csv`, "text/csv");
                        toast.success("Issues CSV downloaded");
                      }}
                    >
                      <Download className="h-4 w-4 mr-1.5" />
                      Export Issues
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Report Preview Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Report Preview</CardTitle>
                  <CardDescription>What&apos;s included in the full report</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Performance</p>
                        <p className="text-xs text-muted-foreground">LCP, FCP, CLS, TTFB, TBT, Speed Index, Mobile & Desktop scores</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Content</p>
                        <p className="text-xs text-muted-foreground">Title, meta, headings, word count, images, OG tags</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Technical</p>
                        <p className="text-xs text-muted-foreground">HTTPS, viewport, canonical, sitemap, robots.txt</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Lightbulb className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Recommendations</p>
                        <p className="text-xs text-muted-foreground">{result.issues.length} issues with prioritized fixes</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* ── Score History Chart ── */}
          {scoreHistory.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Score History</CardTitle>
                <CardDescription>SEO score trend over time for this site</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scoreHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: string) => {
                          try { return new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
                          catch { return v; }
                        }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        labelFormatter={(v: string) => {
                          try { return new Date(v).toLocaleString(); } catch { return v; }
                        }}
                        formatter={(value: number) => [`${value}/100`, "SEO Score"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ fill: "#10b981", r: 4 }}
                        activeDot={{ r: 6, fill: "#10b981" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
