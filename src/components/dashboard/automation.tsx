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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Zap,
  Plus,
  Play,
  Clock,
  Bell,
  Calendar,
  History,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
  Eye,
  Activity,
  Gauge,
  Loader2,
  Search,
  Filter,
  RefreshCw,
  Shield,
  FileText,
  TrendingDown,
  Timer,
  Globe,
} from "lucide-react";
import { analyzeUrl, isValidUrl, type SiteAnalysisResult } from "@/lib/url-analyzer";
import {
  getSites,
  addSite,
  saveAnalysis,
  type Site,
  type SiteAnalysis,
} from "@/lib/site-store";
import {
  getScheduledAudits,
  addScheduledAudit,
  toggleScheduledAudit,
  removeScheduledAudit,
  getAuditLogs,
  checkAndRunDueAudits,
  clearAuditLogs,
  type ScheduledAudit,
  type AuditLog,
} from "@/lib/audit-scheduler";
import { useAppStore } from "@/store/app-store";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreBadgeClass(score: number): string {
  if (score >= 80) return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800";
  if (score >= 50) return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800";
  return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800";
}

function frequencyBadgeClass(freq: string): string {
  if (freq === "daily") return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400";
  if (freq === "weekly") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";
  return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "success":
    case "idle":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";
    case "running":
      return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400";
    case "failed":
      return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400";
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
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
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDuration(triggeredAt: string, completedAt: string | null): string {
  if (!completedAt) return "—";
  const ms = new Date(completedAt).getTime() - new Date(triggeredAt).getTime();
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  if (mins > 0) return `${mins}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// ─── Alert Rules Mock Data ────────────────────────────────────────────────────

interface AlertRule {
  id: number;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  enabled: boolean;
}

const MOCK_ALERT_RULES: AlertRule[] = [
  { id: 1, name: "SEO Score Drop", description: "Alert when a site's SEO score drops by 10+ points between audits", category: "SEO", icon: <TrendingDown className="h-4 w-4" />, enabled: true },
  { id: 2, name: "Broken Links Detected", description: "Notify when new broken links are found during scheduled audits", category: "Technical", icon: <AlertCircle className="h-4 w-4" />, enabled: true },
  { id: 3, name: "Content Freshness", description: "Flag pages that haven't been updated in 30+ days", category: "Content", icon: <FileText className="h-4 w-4" />, enabled: true },
  { id: 4, name: "Performance Regression", description: "Alert when Core Web Vitals metrics degrade significantly", category: "Performance", icon: <Gauge className="h-4 w-4" />, enabled: false },
  { id: 5, name: "SSL Certificate Expiry", description: "Warn when SSL certificate is expiring within 30 days", category: "Security", icon: <Shield className="h-4 w-4" />, enabled: true },
  { id: 6, name: "New Indexing Issues", description: "Monitor Google Search Console for coverage or indexing problems", category: "SEO", icon: <Search className="h-4 w-4" />, enabled: false },
];

// ─── Manual Audit Progress Steps ──────────────────────────────────────────────

const PROGRESS_STEPS = [
  { label: "Validating URL", icon: <Search className="h-4 w-4" /> },
  { label: "Fetching page content", icon: <Globe className="h-4 w-4" /> },
  { label: "Analyzing performance", icon: <Gauge className="h-4 w-4" /> },
  { label: "Checking SEO elements", icon: <FileText className="h-4 w-4" /> },
  { label: "Generating report", icon: <Activity className="h-4 w-4" /> },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Automation() {
  const { toast } = useToast();
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);

  // State
  const [schedules, setSchedules] = useState<ScheduledAudit[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Manual audit state
  const [manualUrl, setManualUrl] = useState("");
  const [manualRunning, setManualRunning] = useState(false);
  const [manualProgress, setManualProgress] = useState(0);
  const [manualResult, setManualResult] = useState<SiteAnalysisResult | null>(null);
  const [manualError, setManualError] = useState("");

  // Add schedule dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [selectedFrequency, setSelectedFrequency] = useState<"daily" | "weekly" | "monthly">("daily");

  // Run history filter
  const [historyFilter, setHistoryFilter] = useState<"all" | "success" | "failed">("all");

  // Alert rules state
  const [alertRules, setAlertRules] = useState<AlertRule[]>(MOCK_ALERT_RULES);

  // ── Data loading ──
  const refreshData = useCallback(() => {
    try {
      setSchedules(getScheduledAudits());
      setAuditLogs(getAuditLogs());
      setSites(getSites());
    } catch {
      // localStorage not available
    }
  }, []);

  useEffect(() => {
    refreshData();
    setHydrated(true);
  }, [refreshData]);

  // ── 60-second scheduler check ──
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await checkAndRunDueAudits();
        if (result.ran > 0) {
          refreshData();
          for (const log of result.results) {
            toast({
              title: log.status === "success" ? "Audit Completed" : "Audit Failed",
              description: `${log.url} — Score: ${log.score ?? "N/A"}`,
              variant: log.status === "success" ? "default" : "destructive",
            });
          }
        }
      } catch {
        // scheduler check failed silently
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [refreshData, toast]);

  // ── KPI calculations ──
  const activeSchedules = schedules.filter((s) => s.enabled).length;
  const runsThisWeek = auditLogs.filter((l) => {
    const weekAgo = Date.now() - 7 * 86400000;
    return new Date(l.triggeredAt).getTime() > weekAgo;
  }).length;
  const successfulRuns = auditLogs.filter((l) => l.status === "success").length;
  const failedRuns = auditLogs.filter((l) => l.status === "failed").length;

  // ── Handlers ──
  const handleToggleSchedule = useCallback((id: string) => {
    try {
      toggleScheduledAudit(id);
      refreshData();
      toast({ title: "Schedule updated" });
    } catch {
      toast({ title: "Failed to toggle schedule", variant: "destructive" });
    }
  }, [refreshData, toast]);

  const handleRemoveSchedule = useCallback((id: string) => {
    try {
      removeScheduledAudit(id);
      refreshData();
      toast({ title: "Schedule removed" });
    } catch {
      toast({ title: "Failed to remove schedule", variant: "destructive" });
    }
  }, [refreshData, toast]);

  const handleRunNow = useCallback(async (audit: ScheduledAudit) => {
    try {
      toast({ title: "Running audit...", description: audit.url });
      const result: SiteAnalysisResult = await analyzeUrl(audit.url);
      const site = sites.find((s) => s.id === audit.siteId);
      if (site) {
        saveAnalysis(audit.siteId, {
          siteId: audit.siteId,
          url: audit.url,
          analyzedAt: result.analyzedAt,
          score: result.score,
          status: result.status,
          issues: result.issues,
          quickStats: {
            performance: result.performance.mobileScore,
            contentScore: result.score,
            technicalScore: result.onPage.hasHttps ? 90 : 40,
            linksScore: result.onPage.internalLinks >= 3 ? 85 : 50,
            wordCount: result.onPage.wordCount,
            titleLength: result.onPage.titleLength,
            metaDescLength: result.onPage.metaDescriptionLength,
            imageCount: result.onPage.imageCount,
            internalLinks: result.onPage.internalLinks,
            externalLinks: result.onPage.externalLinks,
          },
        });
      }
      refreshData();
      toast({ title: "Audit complete", description: `Score: ${result.score}/100` });
    } catch (err) {
      toast({ title: "Audit failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    }
  }, [sites, refreshData, toast]);

  const handleAddSchedule = useCallback(() => {
    if (!selectedSiteId || !selectedFrequency) {
      toast({ title: "Please select a site and frequency", variant: "destructive" });
      return;
    }
    const site = sites.find((s) => s.id === selectedSiteId);
    if (!site) return;
    try {
      addScheduledAudit(site.id, site.url, selectedFrequency);
      refreshData();
      setAddDialogOpen(false);
      setSelectedSiteId("");
      setSelectedFrequency("daily");
      toast({ title: "Schedule created", description: `${site.domain} — ${selectedFrequency}` });
    } catch {
      toast({ title: "Failed to create schedule", variant: "destructive" });
    }
  }, [selectedSiteId, selectedFrequency, sites, refreshData, toast]);

  const handleClearHistory = useCallback(() => {
    try {
      clearAuditLogs();
      setAuditLogs([]);
      toast({ title: "History cleared" });
    } catch {
      toast({ title: "Failed to clear history", variant: "destructive" });
    }
  }, [toast]);

  // ── Manual audit ──
  const handleManualAudit = useCallback(async () => {
    const validation = isValidUrl(manualUrl);
    if (!validation.valid) {
      setManualError(validation.error || "Invalid URL");
      return;
    }
    setManualError("");
    setManualRunning(true);
    setManualProgress(0);
    setManualResult(null);

    const progressInterval = setInterval(() => {
      setManualProgress((prev) => Math.min(prev + 20, 90));
    }, 2000);

    try {
      const result = await analyzeUrl(validation.normalized);
      clearInterval(progressInterval);
      setManualProgress(100);

      // Save to store
      let site = sites.find((s) => s.url === validation.normalized || s.url === validation.normalized.replace(/\/+$/, ""));
      if (!site) {
        site = addSite(validation.normalized);
        setSites(getSites());
      }
      saveAnalysis(site.id, {
        siteId: site.id,
        url: validation.normalized,
        analyzedAt: result.analyzedAt,
        score: result.score,
        status: result.status,
        issues: result.issues,
        quickStats: {
          performance: result.performance.mobileScore,
          contentScore: result.score,
          technicalScore: result.onPage.hasHttps ? 90 : 40,
          linksScore: result.onPage.internalLinks >= 3 ? 85 : 50,
          wordCount: result.onPage.wordCount,
          titleLength: result.onPage.titleLength,
          metaDescLength: result.onPage.metaDescriptionLength,
          imageCount: result.onPage.imageCount,
          internalLinks: result.onPage.internalLinks,
          externalLinks: result.onPage.externalLinks,
        },
      });

      setManualResult(result);
      refreshData();
      toast({ title: "Audit complete", description: `Score: ${result.score}/100` });
    } catch (err) {
      clearInterval(progressInterval);
      setManualError(err instanceof Error ? err.message : "Audit failed");
      toast({ title: "Audit failed", variant: "destructive" });
    } finally {
      setManualRunning(false);
    }
  }, [manualUrl, sites, refreshData, toast]);

  // ── Alert rule toggle ──
  const toggleAlertRule = useCallback((id: number) => {
    setAlertRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  }, []);

  // ── Filtered logs ──
  const filteredLogs = auditLogs
    .filter((l) => historyFilter === "all" || l.status === historyFilter)
    .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());

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
            <Zap className="h-6 w-6 text-emerald-500" />
            SEO Automation
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule automated audits, monitor runs, and configure alert rules.
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-1.5" />
              Create Schedule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Audit Schedule</DialogTitle>
              <DialogDescription>Select a site and frequency to set up automated SEO audits.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Site</Label>
                <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                  <SelectTrigger><SelectValue placeholder="Select a site" /></SelectTrigger>
                  <SelectContent>
                    {sites.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.domain || s.name}</SelectItem>
                    ))}
                    {sites.length === 0 && <SelectItem value="none" disabled>No sites found</SelectItem>}
                  </SelectContent>
                </Select>
                {sites.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No sites yet. <button type="button" className="text-emerald-600 underline" onClick={() => { setCurrentPage("audit"); }}>Run an audit first</button> to add sites.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <div className="flex gap-3">
                  {(["daily", "weekly", "monthly"] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setSelectedFrequency(freq)}
                      className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-all ${
                        selectedFrequency === freq
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          : "border-border hover:border-emerald-300 text-muted-foreground"
                      }`}
                    >
                      <div className="capitalize">{freq}</div>
                      <div className="text-[11px] mt-0.5 opacity-70">
                        {freq === "daily" ? "Every day" : freq === "weekly" ? "Every 7 days" : "Every 30 days"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAddSchedule}>Create Schedule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ═══ KPI CARDS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Schedules", value: activeSchedules, sub: `of ${schedules.length} total`, icon: <Clock className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-50 dark:bg-emerald-950" },
          { label: "Runs This Week", value: runsThisWeek, sub: `Total: ${auditLogs.length}`, icon: <Activity className="h-5 w-5 text-blue-600" />, bg: "bg-blue-50 dark:bg-blue-950" },
          { label: "Successful", value: successfulRuns, sub: `${auditLogs.length > 0 ? Math.round((successfulRuns / auditLogs.length) * 100) : 0}% rate`, icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-50 dark:bg-emerald-950" },
          { label: "Failed", value: failedRuns, sub: failedRuns > 0 ? "Review needed" : "All clear", icon: <XCircle className="h-5 w-5 text-red-500" />, bg: "bg-red-50 dark:bg-red-950" },
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
      <Tabs defaultValue="scheduled">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="scheduled" className="text-sm"><Calendar className="h-4 w-4 mr-1.5" />Scheduled Audits</TabsTrigger>
          <TabsTrigger value="history" className="text-sm"><History className="h-4 w-4 mr-1.5" />Run History</TabsTrigger>
          <TabsTrigger value="manual" className="text-sm"><Play className="h-4 w-4 mr-1.5" />Manual Audit</TabsTrigger>
          <TabsTrigger value="alerts" className="text-sm"><Bell className="h-4 w-4 mr-1.5" />Alert Rules</TabsTrigger>
        </TabsList>

        {/* ═══════ TAB 1: SCHEDULED AUDITS ═══════ */}
        <TabsContent value="scheduled">
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Scheduled Audits</CardTitle>
                  <CardDescription>{schedules.length} schedule{schedules.length !== 1 ? "s" : ""} configured — checks run every 60 seconds</CardDescription>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
                  {activeSchedules} active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground/30" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">No schedules yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Create a schedule to automate recurring SEO audits</p>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setAddDialogOpen(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add Schedule
                  </Button>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>URL</TableHead>
                        <TableHead className="w-[90px]">Frequency</TableHead>
                        <TableHead className="w-[100px]">Last Run</TableHead>
                        <TableHead className="w-[100px]">Next Run</TableHead>
                        <TableHead className="w-[80px]">Status</TableHead>
                        <TableHead className="w-[70px]">Runs</TableHead>
                        <TableHead className="w-[70px]">Score</TableHead>
                        <TableHead className="w-[80px]">Enabled</TableHead>
                        <TableHead className="w-[160px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedules.map((sched) => (
                        <TableRow key={sched.id} className={!sched.enabled ? "opacity-50" : ""}>
                          <TableCell className="text-sm font-medium max-w-[200px] truncate">{sched.url}</TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] font-semibold ${frequencyBadgeClass(sched.frequency)}`}>
                              {sched.frequency}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatRelativeDate(sched.lastRun)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatRelativeDate(sched.nextRun)}</TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${statusBadgeClass(sched.status)}`}>
                              {sched.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs tabular-nums">{sched.runCount}</TableCell>
                          <TableCell>
                            {sched.lastScore !== null ? (
                              <Badge className={`text-[10px] font-bold border ${scoreBadgeClass(sched.lastScore)}`}>
                                {sched.lastScore}
                              </Badge>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            <Switch checked={sched.enabled} onCheckedChange={() => handleToggleSchedule(sched.id)} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleRunNow(sched)}>
                                <Play className="h-3 w-3 mr-1" />Run
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-500" onClick={() => handleRemoveSchedule(sched.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ TAB 2: RUN HISTORY ═══════ */}
        <TabsContent value="history">
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Run History</CardTitle>
                  <CardDescription>{auditLogs.length} audit run{auditLogs.length !== 1 ? "s" : ""} recorded</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {(["all", "success", "failed"] as const).map((f) => (
                      <Button
                        key={f}
                        variant={historyFilter === f ? "default" : "outline"}
                        size="sm"
                        className={`h-8 text-xs capitalize ${historyFilter === f ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                        onClick={() => setHistoryFilter(f)}
                      >
                        {f}
                      </Button>
                    ))}
                  </div>
                  {auditLogs.length > 0 && (
                    <Button variant="outline" size="sm" className="h-8 text-xs text-red-500" onClick={handleClearHistory}>
                      <Trash2 className="h-3 w-3 mr-1" />Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <History className="h-12 w-12 text-muted-foreground/30" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">No audit runs yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Create a schedule or run a manual audit to see history here.</p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>URL</TableHead>
                        <TableHead className="w-[100px]">Triggered</TableHead>
                        <TableHead className="w-[100px]">Completed</TableHead>
                        <TableHead className="w-[80px]">Duration</TableHead>
                        <TableHead className="w-[70px]">Score</TableHead>
                        <TableHead className="w-[80px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm font-medium max-w-[200px] truncate">{log.url}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDate(log.triggeredAt)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDate(log.completedAt)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground tabular-nums">{formatDuration(log.triggeredAt, log.completedAt)}</TableCell>
                          <TableCell>
                            {log.score !== null ? (
                              <Badge className={`text-[10px] font-bold border ${scoreBadgeClass(log.score)}`}>{log.score}</Badge>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${statusBadgeClass(log.status)}`}>{log.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ TAB 3: MANUAL AUDIT ═══════ */}
        <TabsContent value="manual">
          <div className="mt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Run Manual Audit</CardTitle>
                <CardDescription>Enter a URL to perform an instant SEO analysis.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="https://example.com"
                      value={manualUrl}
                      onChange={(e) => { setManualUrl(e.target.value); setManualError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && !manualRunning && handleManualAudit()}
                      disabled={manualRunning}
                    />
                    {manualError && <p className="text-xs text-red-500 mt-1.5">{manualError}</p>}
                  </div>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleManualAudit}
                    disabled={manualRunning || !manualUrl.trim()}
                  >
                    {manualRunning ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Play className="h-4 w-4 mr-1.5" />}
                    {manualRunning ? "Analyzing..." : "Run Audit Now"}
                  </Button>
                </div>

                {/* Progress */}
                {manualRunning && (
                  <div className="space-y-3 p-4 rounded-lg bg-muted/30 border">
                    <Progress value={manualProgress} className="h-2" />
                    <div className="flex justify-between">
                      {PROGRESS_STEPS.map((step, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-1.5 text-xs ${
                            manualProgress >= (idx + 1) * 20
                              ? "text-emerald-600 font-medium"
                              : manualProgress >= idx * 20
                              ? "text-blue-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {step.icon}
                          <span className="hidden sm:inline">{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Results */}
                {manualResult && !manualRunning && (
                  <div className="space-y-4 p-5 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950 dark:to-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-center">
                        <span className="text-5xl font-extrabold" style={{ color: manualResult.score >= 80 ? "#10b981" : manualResult.score >= 50 ? "#f59e0b" : "#ef4444" }}>
                          {manualResult.score}
                        </span>
                        <span className="text-sm font-semibold mt-1" style={{ color: manualResult.score >= 80 ? "#10b981" : manualResult.score >= 50 ? "#f59e0b" : "#ef4444" }}>
                          {manualResult.status.charAt(0).toUpperCase() + manualResult.status.slice(1)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">out of 100</span>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center p-2 rounded-lg bg-background/80">
                            <p className="text-[10px] text-muted-foreground uppercase">Issues</p>
                            <p className="text-lg font-bold">{manualResult.issues.length}</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-background/80">
                            <p className="text-[10px] text-muted-foreground uppercase">Words</p>
                            <p className="text-lg font-bold">{manualResult.onPage.wordCount.toLocaleString()}</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-background/80">
                            <p className="text-[10px] text-muted-foreground uppercase">Links</p>
                            <p className="text-lg font-bold">{manualResult.onPage.internalLinks + manualResult.onPage.externalLinks}</p>
                          </div>
                        </div>

                        {/* Top 3 issues */}
                        {manualResult.issues.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Top Issues</p>
                            {manualResult.issues.slice(0, 3).map((issue, idx) => (
                              <div key={issue.id || idx} className="flex items-center gap-2 text-xs p-1.5 rounded bg-background/60">
                                {issue.severity === "critical" ? <AlertCircle className="h-3 w-3 text-red-500 shrink-0" /> :
                                 issue.severity === "warning" ? <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" /> :
                                 <Info className="h-3 w-3 text-blue-500 shrink-0" />}
                                <span className="truncate">{issue.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setCurrentPage("audit")}>
                        <Eye className="h-4 w-4 mr-1.5" />
                        View Full Report
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════ TAB 4: ALERT RULES ═══════ */}
        <TabsContent value="alerts">
          <div className="mt-4 space-y-4">
            <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Alert rules coming soon</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      These rules will be automated in a future update. Currently, scheduled audits provide automated scanning — set up schedules in the &quot;Scheduled Audits&quot; tab to monitor your sites.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Alert Configuration</CardTitle>
                <CardDescription>Configure automated alerts for SEO issues. {alertRules.filter((r) => r.enabled).length} of {alertRules.length} rules enabled.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertRules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between gap-4 p-4 rounded-lg border hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                          {rule.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-foreground">{rule.name}</h4>
                            <Badge variant="outline" className="text-[10px]">{rule.category}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{rule.description}</p>
                        </div>
                      </div>
                      <Switch checked={rule.enabled} onCheckedChange={() => toggleAlertRule(rule.id)} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
