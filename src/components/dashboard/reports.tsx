"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Eye,
  Globe,
  FileBarChart,
  Gauge,
  Calendar,
  BarChart3,
  Shield,
  Link2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileSpreadsheet,
  Code,
  AlertCircle,
} from "lucide-react";
import {
  getAllLatestAnalyses,
  getSites,
  getLatestAnalysis,
  type SiteAnalysis,
  type Site,
} from "@/lib/site-store";
import {
  generateCsvReport,
  generateHtmlReport,
  generateIssuesCsv,
  downloadFile,
  generatePdfReport,
  downloadPdfReport,
} from "@/lib/report-generator";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/app-store";
import type { SiteAnalysisResult } from "@/lib/url-analyzer";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreBadgeClass(score: number): string {
  if (score >= 80) return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800";
  if (score >= 50) return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800";
  return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800";
}

function scoreColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeDate(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

function severityIcon(severity: string) {
  switch (severity) {
    case "critical": return <XCircle className="h-3.5 w-3.5 text-red-500" />;
    case "warning": return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
    default: return <Info className="h-3.5 w-3.5 text-blue-500" />;
  }
}

function severityBadgeClass(severity: string): string {
  if (severity === "critical") return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800";
  if (severity === "warning") return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800";
  return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800";
}

// ─── Build SiteAnalysisResult from SiteAnalysis ───────────────────────────────

function buildResult(analysis: SiteAnalysis & { siteName?: string; domain?: string }): SiteAnalysisResult {
  return {
    url: analysis.url,
    analyzedAt: analysis.analyzedAt,
    score: analysis.score,
    status: analysis.status,
    performance: {
      lcp: null, fid: null, cls: null, fcp: null, ttfb: null, tbt: null, speedIndex: null,
      mobileScore: analysis.quickStats?.performance ?? null,
      desktopScore: null,
    },
    onPage: {
      title: "", titleLength: analysis.quickStats?.titleLength ?? 0,
      metaDescription: "", metaDescriptionLength: analysis.quickStats?.metaDescLength ?? 0,
      h1: [], h2: [], h3: [], canonicalUrl: null, ogTitle: null, ogDescription: null, ogImage: null,
      robotsMeta: null, viewportMeta: true, charset: null, lang: null,
      wordCount: analysis.quickStats?.wordCount ?? 0,
      imageCount: analysis.quickStats?.imageCount ?? 0,
      imagesWithAlt: 0, imagesWithoutAlt: 0,
      internalLinks: analysis.quickStats?.internalLinks ?? 0,
      externalLinks: analysis.quickStats?.externalLinks ?? 0,
      totalLinks: (analysis.quickStats?.internalLinks ?? 0) + (analysis.quickStats?.externalLinks ?? 0),
      hasSitemap: true, hasRobotsTxt: true, hasHttps: true, isMobileFriendly: true,
    },
    issues: analysis.issues,
    suggestions: [],
    readability: {
      fleschScore: 0,
      readingTime: Math.max(1, Math.ceil((analysis.quickStats?.wordCount ?? 0) / 200)),
      level: "moderate" as const,
    },
  };
}

// ─── Report Type Descriptions ─────────────────────────────────────────────────

const REPORT_TYPES = [
  { id: "pdf", name: "PDF Report", icon: <FileText className="h-4 w-4" />, desc: "Professional multi-page PDF with cover page, performance tables, content analysis, and issues.", color: "text-emerald-600" },
  { id: "csv", name: "CSV Report", icon: <FileSpreadsheet className="h-4 w-4" />, desc: "Full analysis data in CSV format. Open in Excel, Google Sheets, or any spreadsheet tool.", color: "text-blue-600" },
  { id: "html", name: "HTML Report", icon: <Code className="h-4 w-4" />, desc: "Styled HTML report that can be viewed in a browser or printed to PDF.", color: "text-amber-600" },
  { id: "issues", name: "Issues CSV", icon: <AlertCircle className="h-4 w-4" />, desc: "Just the issues table in CSV. Great for tracking and triaging SEO issues.", color: "text-red-600" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Reports() {
  const { toast } = useToast();
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);

  const [analyses, setAnalyses] = useState<(SiteAnalysis & { siteName: string; domain: string })[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // View report dialog
  const [viewReport, setViewReport] = useState<(SiteAnalysis & { siteName: string; domain: string }) | null>(null);

  // Generate tab
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [generating, setGenerating] = useState<string | null>(null);

  // ── Load data ──
  const refreshData = useCallback(() => {
    try {
      setAnalyses(getAllLatestAnalyses());
      setSites(getSites());
    } catch {
      // localStorage not available
    }
  }, []);

  useEffect(() => {
    refreshData();
    setHydrated(true);

    const handleStorage = () => refreshData();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [refreshData]);

  // ── KPIs ──
  const stats = useMemo(() => {
    const total = analyses.length;
    const avgScore = total > 0 ? Math.round(analyses.reduce((sum, a) => sum + a.score, 0) / total) : 0;
    const totalIssues = analyses.reduce((sum, a) => sum + a.issues.length, 0);
    const topScore = total > 0 ? Math.max(...analyses.map((a) => a.score)) : 0;
    return { total, avgScore, totalIssues, topScore };
  }, [analyses]);

  // ── Download handlers ──
  const handleDownloadPdf = useCallback((analysis: SiteAnalysis & { siteName: string; domain: string }) => {
    try {
      const result = buildResult(analysis);
      downloadPdfReport(result, analysis.siteName || analysis.domain);
      toast({ title: "PDF downloaded", description: `Report for ${analysis.domain}` });
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
  }, [toast]);

  const handleDownloadCsv = useCallback((analysis: SiteAnalysis & { siteName: string; domain: string }) => {
    try {
      const result = buildResult(analysis);
      const csv = generateCsvReport(result);
      const domain = analysis.domain || "site";
      downloadFile(csv, `seo-report-${domain}.csv`, "text/csv");
      toast({ title: "CSV downloaded", description: `Report for ${domain}` });
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
  }, [toast]);

  const handleDownloadHtml = useCallback((analysis: SiteAnalysis & { siteName: string; domain: string }) => {
    try {
      const result = buildResult(analysis);
      const html = generateHtmlReport(result, analysis.siteName || analysis.domain);
      const domain = analysis.domain || "site";
      downloadFile(html, `seo-report-${domain}.html`, "text/html");
      toast({ title: "HTML report downloaded", description: `Open in browser and print to PDF.` });
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
  }, [toast]);

  const handleDownloadIssuesCsv = useCallback((analysis: SiteAnalysis & { siteName: string; domain: string }) => {
    try {
      const csv = generateIssuesCsv(analysis.issues);
      const domain = analysis.domain || "site";
      downloadFile(csv, `seo-issues-${domain}.csv`, "text/csv");
      toast({ title: "Issues CSV downloaded", description: `${analysis.issues.length} issues exported.` });
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
  }, [toast]);

  // ── Generate tab handlers ──
  const selectedSite = useMemo(() => sites.find((s) => s.id === selectedSiteId), [sites, selectedSiteId]);
  const selectedAnalysis = useMemo(() => {
    if (!selectedSiteId) return null;
    return getLatestAnalysis(selectedSiteId);
  }, [selectedSiteId]);

  const handleGenerate = useCallback((type: string) => {
    if (!selectedAnalysis || !selectedSite) {
      toast({ title: "No analysis data", description: "Run an audit first.", variant: "destructive" });
      return;
    }

    setGenerating(type);

    // Simulate brief loading for UX
    setTimeout(() => {
      const analysis = selectedAnalysis;
      const result = buildResult(analysis);
      const domain = selectedSite.domain || "site";

      try {
        switch (type) {
          case "pdf":
            downloadPdfReport(result, selectedSite.name || domain);
            toast({ title: "PDF Report Generated", description: `${domain} — Score ${analysis.score}/100` });
            break;
          case "csv":
            downloadFile(generateCsvReport(result), `seo-report-${domain}.csv`, "text/csv");
            toast({ title: "CSV Report Generated", description: `${domain} — Full analysis data` });
            break;
          case "html":
            downloadFile(generateHtmlReport(result, selectedSite.name || domain), `seo-report-${domain}.html`, "text/html");
            toast({ title: "HTML Report Generated", description: `${domain} — Open in browser to view` });
            break;
          case "issues":
            downloadFile(generateIssuesCsv(analysis.issues), `seo-issues-${domain}.csv`, "text/csv");
            toast({ title: "Issues CSV Generated", description: `${analysis.issues.length} issues exported` });
            break;
        }
      } catch {
        toast({ title: "Generation failed", variant: "destructive" });
      } finally {
        setGenerating(null);
      }
    }, 500);
  }, [selectedAnalysis, selectedSite, toast]);

  // ── Render ──
  if (!hydrated) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-4 w-3/4 rounded bg-muted animate-pulse" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileBarChart className="h-6 w-6 text-emerald-500" />
            Reports
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.total > 0
              ? `${stats.total} report${stats.total !== 1 ? "s" : ""} available — generate and download in multiple formats`
              : "Analyze sites first to generate reports"}
          </p>
        </div>
        {stats.total > 0 && (
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setCurrentPage("audit")}>
            <ArrowRight className="h-4 w-4 mr-1.5" />
            Run New Audit
          </Button>
        )}
      </div>

      {/* ═══ KPI CARDS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Reports", value: stats.total, sub: `${stats.totalIssues} total issues`, icon: <FileBarChart className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-50 dark:bg-emerald-950" },
          { label: "Avg Score", value: stats.avgScore, sub: `of 100`, icon: <BarChart3 className="h-5 w-5 text-blue-600" />, bg: "bg-blue-50 dark:bg-blue-950" },
          { label: "Total Issues", value: stats.totalIssues, sub: `Across all reports`, icon: <AlertCircle className="h-5 w-5 text-amber-600" />, bg: "bg-amber-50 dark:bg-amber-950" },
          { label: "Top Score", value: stats.topScore, sub: stats.topScore >= 80 ? "Excellent" : stats.topScore >= 50 ? "Good" : "Needs work", icon: <Gauge className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-50 dark:bg-emerald-950" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{kpi.value}</p>
                  <p className="text-xs mt-1 text-muted-foreground">{kpi.sub}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>{kpi.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ═══ TABS ═══ */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="text-sm"><FileText className="h-4 w-4 mr-1.5" />All Reports</TabsTrigger>
          <TabsTrigger value="generate" className="text-sm"><Download className="h-4 w-4 mr-1.5" />Generate New</TabsTrigger>
          <TabsTrigger value="scheduled" className="text-sm"><Clock className="h-4 w-4 mr-1.5" />Scheduled Reports</TabsTrigger>
        </TabsList>

        {/* ═══════ TAB 1: ALL REPORTS ═══════ */}
        <TabsContent value="all">
          {analyses.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="flex flex-col items-center text-center max-w-md mx-auto">
                  <div className="h-20 w-20 rounded-2xl bg-muted/40 flex items-center justify-center mb-6">
                    <FileBarChart className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">No reports generated yet</h3>
                  <p className="text-sm text-muted-foreground mt-2 mb-6">
                    Start by analyzing a website. Once analyzed, reports will appear here with full score breakdowns and downloadable exports.
                  </p>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={() => setCurrentPage("audit")}>
                    <ArrowRight className="h-4 w-4" />
                    Go to SEO Audit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {analyses.map((analysis) => {
                const isExpanded = expandedId === analysis.id;
                const criticalCount = analysis.issues.filter((i) => i.severity === "critical").length;
                const warningCount = analysis.issues.filter((i) => i.severity === "warning").length;
                const infoCount = analysis.issues.filter((i) => i.severity === "info").length;
                const topIssues = analysis.issues.slice(0, 5);

                return (
                  <Card key={analysis.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0">
                              <Globe className="h-5 w-5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-foreground truncate">
                                {analysis.domain || analysis.siteName}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{analysis.url}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={`text-xs font-bold border ${scoreBadgeClass(analysis.score)}`}>
                              {analysis.score}/100
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatRelativeDate(analysis.analyzedAt)}
                          </div>
                          <div className="flex items-center gap-2">
                            {criticalCount > 0 && <span className="flex items-center gap-1 text-red-600"><XCircle className="h-3 w-3" />{criticalCount}</span>}
                            {warningCount > 0 && <span className="flex items-center gap-1 text-amber-600"><AlertTriangle className="h-3 w-3" />{warningCount}</span>}
                            {infoCount > 0 && <span className="flex items-center gap-1 text-blue-600"><Info className="h-3 w-3" />{infoCount}</span>}
                            {analysis.issues.length === 0 && <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3 w-3" />No issues</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setViewReport(analysis)}>
                            <Eye className="h-3.5 w-3.5" />View
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => handleDownloadPdf(analysis)}>
                            <FileText className="h-3.5 w-3.5" />PDF
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => handleDownloadCsv(analysis)}>
                            <FileSpreadsheet className="h-3.5 w-3.5" />CSV
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => handleDownloadHtml(analysis)}>
                            <Code className="h-3.5 w-3.5" />HTML
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 text-xs ml-auto" onClick={() => setExpandedId(isExpanded ? null : analysis.id)}>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <>
                          <Separator />
                          <div className="p-5 bg-muted/20 space-y-4">
                            <div className="grid grid-cols-4 gap-3">
                              <div className="text-center p-3 rounded-lg bg-background border">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Performance</p>
                                <p className="text-lg font-bold tabular-nums mt-1" style={{ color: scoreColor(analysis.quickStats?.performance ?? 0) }}>
                                  {analysis.quickStats?.performance ?? "N/A"}
                                </p>
                              </div>
                              <div className="text-center p-3 rounded-lg bg-background border">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Content</p>
                                <p className="text-lg font-bold tabular-nums mt-1" style={{ color: scoreColor(analysis.quickStats?.contentScore ?? 0) }}>
                                  {analysis.quickStats?.contentScore ?? 0}
                                </p>
                              </div>
                              <div className="text-center p-3 rounded-lg bg-background border">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Technical</p>
                                <p className="text-lg font-bold tabular-nums mt-1" style={{ color: scoreColor(analysis.quickStats?.technicalScore ?? 0) }}>
                                  {analysis.quickStats?.technicalScore ?? 0}
                                </p>
                              </div>
                              <div className="text-center p-3 rounded-lg bg-background border">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Links</p>
                                <p className="text-lg font-bold tabular-nums mt-1" style={{ color: scoreColor(analysis.quickStats?.linksScore ?? 0) }}>
                                  {analysis.quickStats?.linksScore ?? 0}
                                </p>
                              </div>
                            </div>

                            {topIssues.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Top Issues</h4>
                                <div className="space-y-1.5">
                                  {topIssues.map((issue, idx) => (
                                    <div key={issue.id || idx} className="flex items-start gap-2 p-2 rounded-md bg-background border text-xs">
                                      {severityIcon(issue.severity)}
                                      <div className="min-w-0 flex-1">
                                        <span className="font-medium text-foreground">{issue.title}</span>
                                        <span className="text-muted-foreground ml-2">{issue.impact} impact</span>
                                      </div>
                                    </div>
                                  ))}
                                  {analysis.issues.length > 5 && (
                                    <p className="text-[11px] text-muted-foreground text-center pt-1">+{analysis.issues.length - 5} more issues</p>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-6 text-xs text-muted-foreground">
                              <span>{(analysis.quickStats?.wordCount ?? 0).toLocaleString()} words</span>
                              <span>{analysis.quickStats?.imageCount ?? 0} images</span>
                              <span>{analysis.quickStats?.internalLinks ?? 0} internal links</span>
                              <span>{analysis.quickStats?.externalLinks ?? 0} external links</span>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══════ TAB 2: GENERATE NEW ═══════ */}
        <TabsContent value="generate">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Generate Report</CardTitle>
                <CardDescription>Select a site and export format to generate a downloadable report.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Site</label>
                  <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                    <SelectTrigger><SelectValue placeholder="Choose a site..." /></SelectTrigger>
                    <SelectContent>
                      {sites.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.domain || s.name}</SelectItem>
                      ))}
                      {sites.length === 0 && <SelectItem value="none" disabled>No sites found</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                {selectedAnalysis ? (
                  <>
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{selectedSite?.domain}</p>
                          <p className="text-xs text-muted-foreground">Score: {selectedAnalysis.score}/100 — {selectedAnalysis.issues.length} issues</p>
                        </div>
                        <Badge className={`text-xs font-bold border ${scoreBadgeClass(selectedAnalysis.score)}`}>
                          {selectedAnalysis.score}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Export Format</label>
                      <div className="grid grid-cols-2 gap-3">
                        {REPORT_TYPES.map((rt) => (
                          <Button
                            key={rt.id}
                            variant="outline"
                            className={`h-auto p-3 flex flex-col items-start gap-1 justify-start text-left ${generating === rt.id ? "opacity-60" : ""}`}
                            onClick={() => handleGenerate(rt.id)}
                            disabled={generating !== null}
                          >
                            <div className="flex items-center gap-2">
                              {generating === rt.id ? <Loader2 className="h-4 w-4 animate-spin" /> : rt.icon}
                              <span className="text-sm font-medium">{rt.name}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : selectedSiteId ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <AlertCircle className="h-8 w-8 text-amber-500" />
                    <p className="text-sm font-medium text-muted-foreground">No analysis data</p>
                    <p className="text-xs text-muted-foreground">Run an audit first for this site.</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setCurrentPage("audit")}>
                      <ArrowRight className="h-3.5 w-3.5 mr-1.5" />Go to Audit
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <Globe className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Select a site above to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Report Formats</CardTitle>
                <CardDescription>Preview what&apos;s included in each report type.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {REPORT_TYPES.map((rt) => (
                    <div key={rt.id} className="flex items-start gap-3 p-3 rounded-lg border hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                      <div className={`h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0 ${rt.color}`}>
                        {rt.icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">{rt.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{rt.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════ TAB 3: SCHEDULED REPORTS ═══════ */}
        <TabsContent value="scheduled">
          <Card>
            <CardContent className="p-10">
              <div className="flex flex-col items-center text-center max-w-md mx-auto">
                <div className="h-16 w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mb-6">
                  <Clock className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Scheduled Reports</h3>
                <p className="text-sm text-muted-foreground mt-2 mb-6">
                  Schedule automated report generation with the Automation tool. Set up audit schedules and reports will be generated automatically.
                </p>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={() => setCurrentPage("automation")}>
                  <ArrowRight className="h-4 w-4" />
                  Go to Automation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══ VIEW REPORT DIALOG ═══ */}
      {viewReport && (
        <ViewReportDialog
          analysis={viewReport}
          open={!!viewReport}
          onClose={() => setViewReport(null)}
          onDownloadPdf={() => handleDownloadPdf(viewReport)}
          onDownloadCsv={() => handleDownloadCsv(viewReport)}
          onDownloadHtml={() => handleDownloadHtml(viewReport)}
          onDownloadIssues={() => handleDownloadIssuesCsv(viewReport)}
        />
      )}
    </div>
  );
}

// ─── View Report Dialog ───────────────────────────────────────────────────────

interface ViewReportDialogProps {
  analysis: SiteAnalysis & { siteName: string; domain: string };
  open: boolean;
  onClose: () => void;
  onDownloadPdf: () => void;
  onDownloadCsv: () => void;
  onDownloadHtml: () => void;
  onDownloadIssues: () => void;
}

function ViewReportDialog({ analysis, open, onClose, onDownloadPdf, onDownloadCsv, onDownloadHtml, onDownloadIssues }: ViewReportDialogProps) {
  const topIssues = analysis.issues.slice(0, 5);
  const criticalCount = analysis.issues.filter((i) => i.severity === "critical").length;
  const warningCount = analysis.issues.filter((i) => i.severity === "warning").length;
  const infoCount = analysis.issues.filter((i) => i.severity === "info").length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            SEO Report — {analysis.domain || analysis.siteName}
          </DialogTitle>
          <DialogDescription>
            Analysis performed on {formatDate(analysis.analyzedAt)}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
          <div className="space-y-6 pb-4">
            {/* Score header */}
            <div className="flex items-center gap-6 p-5 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950 dark:to-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
              <div className="flex flex-col items-center">
                <span className="text-5xl font-extrabold" style={{ color: scoreColor(analysis.score) }}>
                  {analysis.score}
                </span>
                <span className="text-sm font-semibold mt-1" style={{ color: scoreColor(analysis.score) }}>
                  {analysis.score >= 80 ? "Good" : analysis.score >= 50 ? "OK" : "Poor"}
                </span>
                <span className="text-[10px] text-muted-foreground">out of 100</span>
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-foreground">{analysis.url}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatRelativeDate(analysis.analyzedAt)}</span>
                  <span className="flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{analysis.issues.length} issues</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {criticalCount > 0 && <Badge className={`text-[10px] ${severityBadgeClass("critical")}`}>{criticalCount} Critical</Badge>}
                  {warningCount > 0 && <Badge className={`text-[10px] ${severityBadgeClass("warning")}`}>{warningCount} Warning</Badge>}
                  {infoCount > 0 && <Badge className={`text-[10px] ${severityBadgeClass("info")}`}>{infoCount} Info</Badge>}
                  {analysis.issues.length === 0 && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />All Clear</Badge>}
                </div>
              </div>
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Performance", value: analysis.quickStats?.performance ?? "—", icon: <Gauge className="h-5 w-5 text-emerald-500 mx-auto mb-1" /> },
                { label: "Content", value: analysis.quickStats?.contentScore ?? 0, icon: <FileText className="h-5 w-5 text-blue-500 mx-auto mb-1" /> },
                { label: "Technical", value: analysis.quickStats?.technicalScore ?? 0, icon: <Shield className="h-5 w-5 text-purple-500 mx-auto mb-1" /> },
                { label: "Links", value: analysis.quickStats?.linksScore ?? 0, icon: <Link2 className="h-5 w-5 text-amber-500 mx-auto mb-1" /> },
              ].map((stat) => (
                <Card key={stat.label} className="border-dashed">
                  <CardContent className="p-4 text-center">
                    {stat.icon}
                    <p className="text-2xl font-bold tabular-nums" style={{ color: scoreColor(typeof stat.value === "number" ? stat.value : 0) }}>
                      {stat.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Top issues */}
            {topIssues.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Top Issues
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[90px]">Severity</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead className="w-[80px]">Impact</TableHead>
                      <TableHead className="w-[80px]">Effort</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topIssues.map((issue, idx) => (
                      <TableRow key={issue.id || idx}>
                        <TableCell>
                          <Badge className={`text-[10px] font-semibold border ${severityBadgeClass(issue.severity)}`}>
                            {issue.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{issue.title}</TableCell>
                        <TableCell className="text-xs capitalize">{issue.impact}</TableCell>
                        <TableCell className="text-xs capitalize">{issue.effort}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {analysis.issues.length > 5 && (
                  <p className="text-[11px] text-muted-foreground text-center mt-2">
                    Showing 5 of {analysis.issues.length} issues
                  </p>
                )}
              </div>
            )}

            {analysis.issues.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-8">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <p className="text-sm font-semibold text-emerald-600">No Issues Found</p>
                <p className="text-xs text-muted-foreground text-center max-w-sm">Great job maintaining optimal SEO health!</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Download buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t">
          <Button variant="outline" className="gap-1.5 text-xs" onClick={onDownloadPdf}>
            <FileText className="h-3.5 w-3.5" />PDF
          </Button>
          <Button variant="outline" className="gap-1.5 text-xs" onClick={onDownloadCsv}>
            <FileSpreadsheet className="h-3.5 w-3.5" />CSV
          </Button>
          <Button variant="outline" className="gap-1.5 text-xs" onClick={onDownloadHtml}>
            <Code className="h-3.5 w-3.5" />HTML
          </Button>
          <Button variant="outline" className="gap-1.5 text-xs" onClick={onDownloadIssues}>
            <AlertCircle className="h-3.5 w-3.5" />Issues CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
