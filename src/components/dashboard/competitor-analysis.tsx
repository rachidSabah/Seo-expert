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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Globe,
  Search,
  RefreshCw,
  Trash2,
  GitCompareArrows,
  Zap,
  FileText,
  Shield,
  Link2,
  Eye,
  Download,
  Lightbulb,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ArrowRight,
  Loader2,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { analyzeUrl, type SiteAnalysisResult } from "@/lib/url-analyzer";
import {
  getSites,
  getLatestAnalysis,
  type Site,
} from "@/lib/site-store";
import {
  getCompetitors,
  addCompetitor,
  removeCompetitor,
  saveCompetitorAnalysis,
  generateComparison,
  type ComparisonResult,
  type Competitor,
} from "@/lib/competitor-store";
import { downloadComparisonPdf } from "@/lib/report-generator";
import { isPuterAvailable } from "@/lib/puter-ai";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

function scoreBgColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function scoreStrokeColor(score: number): string {
  if (score >= 80) return "stroke-emerald-500";
  if (score >= 50) return "stroke-amber-500";
  return "stroke-red-500";
}

function scoreBadgeClass(score: number): string {
  if (score >= 80)
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (score >= 50)
    return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function computeCategoryScores(
  result: SiteAnalysisResult
): {
  performance: number;
  content: number;
  technical: number;
  links: number;
  overall: number;
} {
  const op = result.onPage;
  const perf = result.performance;

  // Performance
  let perfScore = 0;
  if (perf.mobileScore !== null) {
    perfScore = perf.mobileScore;
  } else {
    let mScore = 0;
    let metrics = 0;
    if (perf.lcp !== null) {
      mScore += perf.lcp <= 2.5 ? 25 : perf.lcp <= 4 ? 12 : 0;
      metrics++;
    }
    if (perf.fcp !== null) {
      mScore += perf.fcp <= 1.8 ? 25 : perf.fcp <= 3 ? 12 : 0;
      metrics++;
    }
    if (perf.cls !== null) {
      mScore += perf.cls <= 0.1 ? 25 : perf.cls <= 0.25 ? 12 : 0;
      metrics++;
    }
    if (perf.ttfb !== null) {
      mScore += perf.ttfb <= 0.8 ? 25 : perf.ttfb <= 1.5 ? 12 : 0;
      metrics++;
    }
    perfScore = metrics > 0 ? Math.round((mScore / (metrics * 25)) * 100) : 50;
  }

  // Content
  let contentScore = 0;
  if (op.title && op.titleLength >= 30 && op.titleLength <= 60) contentScore += 25;
  else if (op.title) contentScore += 15;
  if (op.metaDescription && op.metaDescriptionLength >= 120 && op.metaDescriptionLength <= 160) contentScore += 20;
  else if (op.metaDescription) contentScore += 10;
  if (op.h1.length === 1) contentScore += 20;
  else if (op.h1.length > 1) contentScore += 10;
  if (op.wordCount >= 1000) contentScore += 20;
  else if (op.wordCount >= 600) contentScore += 15;
  else if (op.wordCount >= 300) contentScore += 10;
  else if (op.wordCount > 0) contentScore += 5;
  if (op.h2.length >= 2) contentScore += 15;
  else if (op.h2.length >= 1) contentScore += 8;

  // Technical
  let techScore = 0;
  if (op.hasHttps) techScore += 20;
  if (op.viewportMeta) techScore += 15;
  if (op.canonicalUrl) techScore += 15;
  if (op.hasSitemap) techScore += 20;
  if (op.hasRobotsTxt) techScore += 15;
  if (op.charset) techScore += 8;
  if (op.lang) techScore += 7;

  // Links
  let linkScore = 0;
  if (op.internalLinks >= 5) linkScore += 40;
  else if (op.internalLinks >= 3) linkScore += 30;
  else if (op.internalLinks >= 1) linkScore += 15;
  if (op.externalLinks >= 3) linkScore += 35;
  else if (op.externalLinks >= 1) linkScore += 20;
  const altRatio = op.imageCount > 0 ? op.imagesWithAlt / op.imageCount : 1;
  linkScore += Math.round(altRatio * 25);

  return {
    performance: Math.min(100, perfScore),
    content: Math.min(100, contentScore),
    technical: Math.min(100, techScore),
    links: Math.min(100, linkScore),
    overall: result.score,
  };
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ScoreGauge({
  score,
  size = 140,
  strokeWidth = 10,
  label,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className={scoreStrokeColor(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className={`text-3xl font-bold ${scoreColor(score)}`}>{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
        {label && (
          <span className="text-[10px] text-muted-foreground mt-0.5">{label}</span>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  score,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  score: number;
  color: string;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: color + "15" }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-bold ${scoreColor(score)}`}>{score}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${scoreBgColor(score)} transition-all duration-700`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, string> = {
    critical: "bg-red-100 text-red-700 border-red-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    info: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return (
    <Badge variant="outline" className={`text-[10px] font-medium ${config[severity] || config.info}`}>
      {severity}
    </Badge>
  );
}

// ─── Mock keyword gap data ────────────────────────────────────────────────────

const mockKeywordGaps = [
  { keyword: "long tail keywords", yourPos: null, compPos: 3, compDomain: "competitor.com", volume: "8.1K", difficulty: 42, opportunity: "Missing" },
  { keyword: "seo report tool", yourPos: null, compPos: 5, compDomain: "competitor.com", volume: "6.6K", difficulty: 38, opportunity: "Missing" },
  { keyword: "crawl budget optimization", yourPos: null, compPos: 2, compDomain: "competitor.com", volume: "5.4K", difficulty: 35, opportunity: "Missing" },
  { keyword: "domain authority checker", yourPos: 45, compPos: 8, compDomain: "competitor.com", volume: "9.9K", difficulty: 48, opportunity: "Weak" },
  { keyword: "link toxicity check", yourPos: 38, compPos: 4, compDomain: "competitor.com", volume: "7.2K", difficulty: 52, opportunity: "Weak" },
  { keyword: "keyword gap analysis", yourPos: null, compPos: 6, compDomain: "competitor.com", volume: "4.8K", difficulty: 44, opportunity: "Missing" },
  { keyword: "website structure seo", yourPos: null, compPos: 11, compDomain: "competitor.com", volume: "5.8K", difficulty: 36, opportunity: "Untapped" },
  { keyword: "backlink analysis free", yourPos: 28, compPos: 3, compDomain: "competitor.com", volume: "18K", difficulty: 65, opportunity: "Weak" },
  { keyword: "page authority checker", yourPos: null, compPos: 4, compDomain: "competitor.com", volume: "12K", difficulty: 58, opportunity: "Missing" },
  { keyword: "serp analysis tool", yourPos: null, compPos: 7, compDomain: "competitor.com", volume: "3.2K", difficulty: 32, opportunity: "Untapped" },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function CompetitorAnalysis() {
  // Core state
  const [sites, setSites] = useState<Site[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");

  // UI state
  const [competitorInput, setCompetitorInput] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [compareSiteId, setCompareSiteId] = useState<string>("");
  const [compareCompetitorId, setCompareCompetitorId] = useState<string>("");

  // Analysis state
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Derived data
  const currentSite = useMemo(
    () => sites.find((s) => s.id === selectedSiteId) || sites[0] || null,
    [sites, selectedSiteId]
  );

  const selectedCompetitor = useMemo(
    () => competitors.find((c) => c.id === selectedCompetitorId) || null,
    [competitors, selectedCompetitorId]
  );

  const compareSite = useMemo(
    () => sites.find((s) => s.id === compareSiteId) || null,
    [sites, compareSiteId]
  );

  const compareCompetitor = useMemo(
    () => competitors.find((c) => c.id === compareCompetitorId) || null,
    [competitors, compareCompetitorId]
  );

  // Load data from localStorage on mount
  useEffect(() => {
    const loadedSites = getSites();
    setSites(loadedSites);
    if (loadedSites.length > 0 && !selectedSiteId) {
      setSelectedSiteId(loadedSites[0].id);
    }

    if (selectedSiteId) {
      const loadedCompetitors = getCompetitors(selectedSiteId);
      setCompetitors(loadedCompetitors);
    }
  }, [selectedSiteId]);

  // Sync compare selectors when sites/competitors change
  useEffect(() => {
    if (sites.length > 0 && !compareSiteId) {
      setCompareSiteId(sites[0].id);
    }
  }, [sites, compareSiteId]);

  useEffect(() => {
    if (competitors.length > 0 && !compareCompetitorId) {
      setCompareCompetitorId(competitors[0].id);
    }
  }, [competitors, compareCompetitorId]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const refreshCompetitors = useCallback(() => {
    if (selectedSiteId) {
      const loaded = getCompetitors(selectedSiteId);
      setCompetitors(loaded);
    }
  }, [selectedSiteId]);

  const handleAddCompetitor = useCallback(async () => {
    const url = competitorInput.trim();
    if (!url || !currentSite) return;

    setIsLoading(true);
    setLoadingMessage("Adding competitor...");

    try {
      const comp = addCompetitor(currentSite.id, url);
      refreshCompetitors();
      setCompetitorInput("");
      setSelectedCompetitorId(comp.id);

      setLoadingMessage("Analyzing competitor site...");
      const result = await analyzeUrl(comp.url);
      saveCompetitorAnalysis(comp.id, result);
      refreshCompetitors();

      setActiveTab("overview");
    } catch (err) {
      console.error("Failed to add competitor:", err);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  }, [competitorInput, currentSite, refreshCompetitors]);

  const handleRemoveCompetitor = useCallback(
    (id: string) => {
      removeCompetitor(id);
      refreshCompetitors();
      if (selectedCompetitorId === id) {
        setSelectedCompetitorId("");
      }
      if (compareCompetitorId === id) {
        setCompareCompetitorId("");
      }
    },
    [selectedCompetitorId, compareCompetitorId, refreshCompetitors]
  );

  const handleReAnalyze = useCallback(
    async (comp: Competitor) => {
      setIsLoading(true);
      setLoadingMessage(`Re-analyzing ${comp.domain}...`);
      try {
        const result = await analyzeUrl(comp.url);
        saveCompetitorAnalysis(comp.id, result);
        refreshCompetitors();
      } catch (err) {
        console.error("Re-analysis failed:", err);
      } finally {
        setIsLoading(false);
        setLoadingMessage("");
      }
    },
    [refreshCompetitors]
  );

  const handleRunComparison = useCallback(async () => {
    const site = compareSite;
    const comp = compareCompetitor;
    if (!site || !comp) return;

    setIsLoading(true);
    setLoadingMessage("Preparing comparison...");

    try {
      // Get competitor result
      let compResult: SiteAnalysisResult;
      if (comp.analysisResult) {
        compResult = comp.analysisResult;
      } else {
        setLoadingMessage(`Analyzing ${comp.domain}...`);
        compResult = await analyzeUrl(comp.url);
        saveCompetitorAnalysis(comp.id, compResult);
        refreshCompetitors();
      }

      // Re-analyze user's site to get fresh SiteAnalysisResult
      setLoadingMessage(`Analyzing ${site.domain}...`);
      const siteResult = await analyzeUrl(site.url);

      setLoadingMessage("Generating comparison...");
      const result = generateComparison(siteResult, compResult, comp.url);
      setComparisonResult(result);
      setActiveTab("compare");
    } catch (err) {
      console.error("Comparison failed:", err);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  }, [compareSite, compareCompetitor, refreshCompetitors]);

  const handleDownloadPdf = useCallback(async () => {
    const site = compareSite;
    const comp = compareCompetitor;
    if (!site || !comp || !comparisonResult) return;

    setIsLoading(true);
    setLoadingMessage("Generating PDF report...");
    try {
      // Need fresh SiteAnalysisResult for the user's site
      let compResult: SiteAnalysisResult;
      if (comp.analysisResult) {
        compResult = comp.analysisResult;
      } else {
        compResult = await analyzeUrl(comp.url);
      }
      const siteResult = await analyzeUrl(site.url);
      downloadComparisonPdf(siteResult, compResult, comp.url, comparisonResult.insights);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  }, [compareSite, compareCompetitor, comparisonResult]);

  const handleGenerateAi = useCallback(async () => {
    if (!comparisonResult) return;

    setIsGeneratingAi(true);
    setAiRecommendations([]);

    try {
      if (isPuterAvailable()) {
        const puterWin = window as any;
        const response = await puterWin.puter.ai.chat(
          `You are an SEO expert. Based on this competitor comparison, provide 5 actionable SEO improvement recommendations.\n\n` +
            `Your Site: ${comparisonResult.yourSite.url} (Score: ${comparisonResult.yourSite.score}/100)\n` +
            `Competitor: ${comparisonResult.competitor.url} (Score: ${comparisonResult.competitor.score}/100)\n` +
            `Score Difference: ${comparisonResult.scoreDifference > 0 ? "+" : ""}${comparisonResult.scoreDifference}\n` +
            `Winner: ${comparisonResult.winner}\n\n` +
            `Insights:\n${comparisonResult.insights.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}\n\n` +
            `Return exactly 5 numbered recommendations. Each should be 1-2 sentences. Focus on actionable steps.`,
          { model: "gpt-4o-mini" }
        );
        const text =
          typeof response === "string"
            ? response
            : response?.message?.content || response?.toString() || "";
        const recs = text
          .split("\n")
          .filter((l: string) => l.trim().length > 0)
          .map((l: string) => l.replace(/^\d+[\.\)]\s*/, "").trim())
          .filter((l: string) => l.length > 0);
        setAiRecommendations(recs.length > 0 ? recs.slice(0, 5) : [text]);
      } else {
        // Built-in recommendations
        const builtIn: string[] = [];
        if (comparisonResult.scoreDifference < 0) {
          builtIn.push(
            "Focus on improving your Core Web Vitals — page speed is a key ranking factor that impacts both user experience and search rankings."
          );
          builtIn.push(
            "Review and expand your content depth — competitors with more comprehensive content tend to rank higher for informational queries."
          );
        }
        if (comparisonResult.winner === "competitor") {
          builtIn.push(
            "Strengthen your technical SEO foundation — ensure all pages have canonical URLs, proper meta tags, and structured data markup."
          );
          builtIn.push(
            "Build a more robust internal linking structure to distribute page authority and help search engines discover your content."
          );
        }
        if (comparisonResult.winner === "tie" || comparisonResult.winner === "you") {
          builtIn.push(
            "Maintain your competitive edge by regularly updating content and monitoring competitor changes."
          );
          builtIn.push(
            "Invest in building high-quality backlinks from authoritative domains in your niche."
          );
        }
        builtIn.push(
          "Implement schema markup (JSON-LD) to enhance search result appearances with rich snippets."
        );
        builtIn.push(
          "Create a content calendar focused on topics where your competitor outranks you, targeting long-tail keyword variations."
        );
        setAiRecommendations(builtIn.slice(0, 5));
      }
    } catch (err) {
      console.error("AI generation failed:", err);
      setAiRecommendations([
        "Unable to generate AI recommendations. Please try again.",
        "In the meantime, review the comparison insights above for actionable areas to improve.",
        "Focus on addressing critical issues first: page speed, content quality, and technical SEO fundamentals.",
      ]);
    } finally {
      setIsGeneratingAi(false);
    }
  }, [comparisonResult]);

  // ─── Computed values for Compare tab ────────────────────────────────────────

  const categoryBreakdown = useMemo(() => {
    if (!comparisonResult || !compareSite || !compareCompetitor) return null;

    // Derive category scores from comparison insights
    const insights = comparisonResult.insights.join(" ").toLowerCase();
    let perfYou = 50, perfComp = 50;
    let contentYou = 50, contentComp = 50;
    let techYou = 50, techComp = 50;
    let linksYou = 50, linksComp = 50;

    // Heuristic score assignment based on insights
    if (insights.includes("mobile performance") || insights.includes("mobile score")) {
      if (insights.includes("your mobile")) { perfYou = 78; perfComp = 65; }
      else { perfYou = 62; perfComp = 82; }
    }
    if (insights.includes("loads") && insights.includes("faster")) {
      if (insights.includes("your page loads")) { perfYou += 8; perfComp -= 5; }
      else { perfYou -= 5; perfComp += 8; }
    }
    if (insights.includes("desktop score")) {
      if (insights.includes("your desktop")) { perfYou += 5; }
      else { perfComp += 5; }
    }

    if (insights.includes("more words") || insights.includes("richer content")) {
      if (insights.includes("your page has")) { contentYou = 85; contentComp = 62; }
      else { contentYou = 58; contentComp = 88; }
    }
    if (insights.includes("title")) {
      if (insights.includes("your title")) { contentYou += 3; }
      else { contentComp += 3; }
    }
    if (insights.includes("h1 heading") || insights.includes("heading structure")) {
      if (insights.includes("you have") || insights.includes("your content has")) { contentYou += 4; }
      else { contentComp += 4; }
    }

    if (insights.includes("https")) {
      if (insights.includes("you have a security advantage")) { techYou += 8; techComp -= 5; }
      else { techYou -= 5; techComp += 8; }
    }
    if (insights.includes("viewport")) {
      if (insights.includes("you have better")) { techYou += 5; }
      else { techComp += 5; }
    }
    if (insights.includes("canonical")) {
      if (insights.includes("you have better") || insights.includes("you have a")) { techYou += 4; }
      else { techComp += 4; }
    }
    if (insights.includes("sitemap")) {
      if (insights.includes("you have a sitemap")) { techYou += 4; }
      else { techComp += 4; }
    }

    if (insights.includes("internal links") || insights.includes("internal link")) {
      if (insights.includes("you have")) { linksYou = 78; linksComp = 52; }
      else { linksYou = 48; linksComp = 80; }
    }
    if (insights.includes("external links")) {
      if (insights.includes("you have")) { linksYou += 5; }
      else { linksComp += 5; }
    }
    if (insights.includes("alt text")) {
      if (insights.includes("your image")) { linksYou += 4; }
      else { linksComp += 4; }
    }

    // Clamp all scores
    const clamp = (n: number) => Math.min(100, Math.max(0, n));

    return {
      performance: { you: clamp(perfYou), comp: clamp(perfComp) },
      content: { you: clamp(contentYou), comp: clamp(contentComp) },
      technical: { you: clamp(techYou), comp: clamp(techComp) },
      links: { you: clamp(linksYou), comp: clamp(linksComp) },
      overall: { you: comparisonResult.yourSite.score, comp: comparisonResult.competitor.score },
    };
  }, [comparisonResult, compareSite, compareCompetitor]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Loading overlay */}
      {isLoading && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="py-6 flex items-center gap-4">
            <Loader2 className="h-5 w-5 text-emerald-600 animate-spin shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800">{loadingMessage || "Processing..."}</p>
              <p className="text-xs text-emerald-600 mt-0.5">This may take a moment for real-time analysis</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <GitCompareArrows className="h-6 w-6 text-emerald-600" />
            Competitor Analysis
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Analyze competitors and compare SEO performance side-by-side.
          </p>
        </div>
      </div>

      {/* ─── Top Section: Your Site + Add Competitor ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Your Site Card */}
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-transparent lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Eye className="h-4 w-4 text-emerald-600" />
              Your Site
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {currentSite ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {currentSite.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {currentSite.domain}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {currentSite.seoScore !== null && (
                    <Badge variant="outline" className={scoreBadgeClass(currentSite.seoScore)}>
                      Score: {currentSite.seoScore}/100
                    </Badge>
                  )}
                  <span className="text-muted-foreground">
                    {currentSite.analysisCount} analyses
                  </span>
                </div>
                {currentSite.seoScore === null && (
                  <p className="text-xs text-amber-600 mt-1">
                    Analyze your site first in the SEO Audit tab for full comparison.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Globe className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No site analyzed yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Go to SEO Audit to analyze your first site
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Competitor */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Competitor
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter competitor URL (e.g., example.com)"
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isLoading && handleAddCompetitor()}
                  className="pl-9"
                  disabled={isLoading || !currentSite}
                />
              </div>
              <Button
                onClick={handleAddCompetitor}
                disabled={isLoading || !currentSite || !competitorInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-1.5" />
                )}
                Add &amp; Analyze
              </Button>
            </div>
            {!currentSite && (
              <p className="text-xs text-amber-600 mt-2">
                Analyze your own site first to enable competitor tracking.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Competitor List ──────────────────────────────────────────────── */}
      {competitors.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">
              Tracked Competitors ({competitors.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {competitors.map((comp) => (
              <Card
                key={comp.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedCompetitorId === comp.id
                    ? "border-emerald-300 ring-1 ring-emerald-200"
                    : "border-border/50"
                }`}
                onClick={() => setSelectedCompetitorId(comp.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {comp.domain}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          Added {formatDate(comp.addedAt)}
                        </p>
                      </div>
                    </div>
                    {comp.seoScore !== null ? (
                      <Badge variant="outline" className={scoreBadgeClass(comp.seoScore)}>
                        {comp.seoScore}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[10px]">
                        Not analyzed
                      </Badge>
                    )}
                  </div>

                  {comp.lastAnalysisAt && (
                    <p className="text-[10px] text-muted-foreground mb-3">
                      Last analyzed: {formatDate(comp.lastAnalysisAt)}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (comp.analysisResult) {
                          setSelectedCompetitorId(comp.id);
                          setActiveTab("overview");
                        }
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReAnalyze(comp);
                      }}
                      disabled={isLoading}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCompareCompetitorId(comp.id);
                        if (currentSite) setCompareSiteId(currentSite.id);
                        setActiveTab("compare");
                      }}
                    >
                      <GitCompareArrows className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCompetitor(comp.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {competitors.length === 0 && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <GitCompareArrows className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No competitors tracked yet
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Add competitor URLs above to start comparing SEO performance.
              We&apos;ll analyze their sites and show you side-by-side comparisons.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ─── Tabs ─────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">
            <BarChart3Icon className="h-4 w-4 mr-1.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="compare">
            <GitCompareArrows className="h-4 w-4 mr-1.5" />
            Compare
          </TabsTrigger>
          <TabsTrigger value="keyword-gap">
            <TargetIcon className="h-4 w-4 mr-1.5" />
            Keyword Gap
          </TabsTrigger>
          <TabsTrigger value="ai-insights">
            <Sparkles className="h-4 w-4 mr-1.5" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Overview ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="mt-6">
          {selectedCompetitor?.analysisResult ? (
            <div className="flex flex-col gap-6">
              {/* Score Gauge */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-emerald-600" />
                    <div>
                      <CardTitle className="text-base">
                        {selectedCompetitor.domain}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        SEO Analysis Overview
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-center gap-8">
                    <div className="relative">
                      <ScoreGauge
                        score={selectedCompetitor.seoScore || 0}
                        size={160}
                        strokeWidth={12}
                        label="Overall Score"
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <h4 className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                        Quick Stats
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 rounded-lg bg-muted/50">
                          <span className="text-muted-foreground text-xs">Title</span>
                          <p className="font-medium truncate max-w-[200px]">
                            {selectedCompetitor.analysisResult.onPage.title || "Missing"}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <span className="text-muted-foreground text-xs">Words</span>
                          <p className="font-medium">
                            {selectedCompetitor.analysisResult.onPage.wordCount.toLocaleString()}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <span className="text-muted-foreground text-xs">Internal Links</span>
                          <p className="font-medium">
                            {selectedCompetitor.analysisResult.onPage.internalLinks}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <span className="text-muted-foreground text-xs">External Links</span>
                          <p className="font-medium">
                            {selectedCompetitor.analysisResult.onPage.externalLinks}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  const catScores = computeCategoryScores(selectedCompetitor.analysisResult!);
                  return (
                    <>
                      <MetricCard
                        icon={Zap}
                        label="Performance"
                        score={catScores.performance}
                        color="#10b981"
                      />
                      <MetricCard
                        icon={FileText}
                        label="Content"
                        score={catScores.content}
                        color="#3b82f6"
                      />
                      <MetricCard
                        icon={Shield}
                        label="Technical"
                        score={catScores.technical}
                        color="#8b5cf6"
                      />
                      <MetricCard
                        icon={Link2}
                        label="Links"
                        score={catScores.links}
                        color="#f59e0b"
                      />
                    </>
                  );
                })()}
              </div>

              {/* Top 5 Issues */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Issues</CardTitle>
                  <CardDescription>
                    {selectedCompetitor.analysisResult.issues.length} issues found — showing top 5
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">Severity</TableHead>
                          <TableHead>Issue</TableHead>
                          <TableHead className="hidden sm:table-cell w-[100px]">Impact</TableHead>
                          <TableHead className="hidden md:table-cell w-[100px]">Effort</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCompetitor.analysisResult.issues
                          .sort((a, b) => {
                            const severityOrder = { critical: 0, warning: 1, info: 2 };
                            return (
                              (severityOrder[a.severity] ?? 2) -
                              (severityOrder[b.severity] ?? 2)
                            );
                          })
                          .slice(0, 5)
                          .map((issue) => (
                            <TableRow key={issue.id}>
                              <TableCell>
                                <SeverityBadge severity={issue.severity} />
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm font-medium">{issue.title}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                    {issue.description}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${
                                    issue.impact === "high"
                                      ? "bg-red-50 text-red-600 border-red-200"
                                      : issue.impact === "medium"
                                        ? "bg-amber-50 text-amber-600 border-amber-200"
                                        : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {issue.impact}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <span className="text-xs text-muted-foreground">
                                  {issue.effort}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Eye className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                {competitors.length === 0 ? (
                  <>
                    <p className="text-sm font-medium text-muted-foreground">
                      No competitor selected
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add a competitor above, then click &quot;View&quot; to see their analysis.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-muted-foreground">
                      No analysis yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click &quot;Add &amp; Analyze&quot; to analyze this competitor, or select a
                      different competitor from the list above.
                    </p>
                    <Button
                      className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                      size="sm"
                      disabled={!currentSite || isLoading}
                      onClick={() => {
                        if (selectedCompetitor) {
                          handleReAnalyze(selectedCompetitor);
                        }
                      }}
                    >
                      <Search className="h-4 w-4 mr-1.5" />
                      {selectedCompetitor
                        ? `Analyze ${selectedCompetitor.domain}`
                        : "Select a Competitor"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab 2: Compare ──────────────────────────────────────────────── */}
        <TabsContent value="compare" className="mt-6">
          <div className="flex flex-col gap-6">
            {/* Comparison Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Run Comparison</CardTitle>
                <CardDescription>
                  Select your site and a competitor to generate a detailed side-by-side comparison.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Your Site
                    </label>
                    <Select
                      value={compareSiteId}
                      onValueChange={setCompareSiteId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your site" />
                      </SelectTrigger>
                      <SelectContent>
                        {sites.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.domain}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Competitor
                    </label>
                    <Select
                      value={compareCompetitorId}
                      onValueChange={setCompareCompetitorId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select competitor" />
                      </SelectTrigger>
                      <SelectContent>
                        {competitors.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.domain}
                            {c.seoScore !== null ? ` (${c.seoScore})` : " (not analyzed)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Button
                      onClick={handleRunComparison}
                      disabled={isLoading || !compareSite || !compareCompetitor}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      ) : (
                        <GitCompareArrows className="h-4 w-4 mr-1.5" />
                      )}
                      Run Comparison
                    </Button>
                  </div>
                  {comparisonResult && (
                    <div>
                      <Button
                        onClick={handleDownloadPdf}
                        disabled={isLoading}
                        variant="outline"
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-1.5" />
                        Download Report
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Comparison Results */}
            {comparisonResult ? (
              <div className="flex flex-col gap-6">
                {/* Score Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Score Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 py-4">
                      {/* Your Score */}
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                          Your Site
                        </p>
                        <div className="relative">
                          <ScoreGauge
                            score={comparisonResult.yourSite.score}
                            size={150}
                            strokeWidth={12}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                          {comparisonResult.yourSite.url}
                        </p>
                      </div>

                      {/* Arrow & Winner Badge */}
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                          {comparisonResult.winner === "you" ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              You&apos;re ahead!
                            </Badge>
                          ) : comparisonResult.winner === "competitor" ? (
                            <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
                              <XCircle className="h-3 w-3 mr-1" />
                              Competitor leads
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
                              <MinusCircle className="h-3 w-3 mr-1" />
                              Tied
                            </Badge>
                          )}
                          <p
                            className={`text-sm font-bold ${
                              comparisonResult.scoreDifference > 0
                                ? "text-emerald-600"
                                : comparisonResult.scoreDifference < 0
                                  ? "text-red-600"
                                  : "text-amber-600"
                            }`}
                          >
                            {comparisonResult.scoreDifference > 0 ? "+" : ""}
                            {comparisonResult.scoreDifference} points
                          </p>
                        </div>
                      </div>

                      {/* Competitor Score */}
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Competitor
                        </p>
                        <div className="relative">
                          <ScoreGauge
                            score={comparisonResult.competitor.score}
                            size={150}
                            strokeWidth={12}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                          {comparisonResult.competitor.url}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Category Breakdown Table */}
                {categoryBreakdown && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Category Breakdown</CardTitle>
                      <CardDescription>
                        Detailed comparison across SEO categories
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Category</TableHead>
                              <TableHead className="text-center w-[120px]">
                                Your Site
                              </TableHead>
                              <TableHead className="text-center w-[120px]">
                                Competitor
                              </TableHead>
                              <TableHead className="text-center w-[100px]">
                                Winner
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(
                              [
                                {
                                  label: "Performance",
                                  icon: Zap,
                                  you: categoryBreakdown.performance.you,
                                  comp: categoryBreakdown.performance.comp,
                                },
                                {
                                  label: "Content",
                                  icon: FileText,
                                  you: categoryBreakdown.content.you,
                                  comp: categoryBreakdown.content.comp,
                                },
                                {
                                  label: "Technical",
                                  icon: Shield,
                                  you: categoryBreakdown.technical.you,
                                  comp: categoryBreakdown.technical.comp,
                                },
                                {
                                  label: "Links",
                                  icon: Link2,
                                  you: categoryBreakdown.links.you,
                                  comp: categoryBreakdown.links.comp,
                                },
                                {
                                  label: "Overall",
                                  icon: TrendingUp,
                                  you: categoryBreakdown.overall.you,
                                  comp: categoryBreakdown.overall.comp,
                                },
                              ] as const
                            ).map((row) => {
                              const Icon = row.icon;
                              const youWin = row.you > row.comp;
                              const compWin = row.comp > row.you;
                              const tied = row.you === row.comp;
                              return (
                                <TableRow
                                  key={row.label}
                                  className={
                                    row.label === "Overall"
                                      ? "bg-muted/30 font-semibold"
                                      : ""
                                  }
                                >
                                  <TableCell>
                                    <span className="flex items-center gap-2 text-sm">
                                      <Icon className="h-4 w-4 text-muted-foreground" />
                                      {row.label}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span
                                      className={`text-sm font-bold ${
                                        youWin
                                          ? "text-emerald-600"
                                          : compWin
                                            ? "text-red-400"
                                            : "text-foreground"
                                      }`}
                                    >
                                      {row.you}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span
                                      className={`text-sm font-bold ${
                                        compWin
                                          ? "text-emerald-600"
                                          : youWin
                                            ? "text-red-400"
                                            : "text-foreground"
                                      }`}
                                    >
                                      {row.comp}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {youWin ? (
                                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        You
                                      </span>
                                    ) : compWin ? (
                                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                        <XCircle className="h-3.5 w-3.5" />
                                        Comp
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-xs text-amber-500">
                                        <MinusCircle className="h-3.5 w-3.5" />
                                        Tie
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI Insights Panel */}
                {comparisonResult.insights.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        Comparison Insights
                      </CardTitle>
                      <CardDescription>
                        {comparisonResult.insights.length} actionable insights from the comparison
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {comparisonResult.insights.map((insight, idx) => {
                          const isAdvantage =
                            insight.toLowerCase().includes("your") &&
                            (insight.toLowerCase().includes("higher") ||
                              insight.toLowerCase().includes("better") ||
                              insight.toLowerCase().includes("more") ||
                              insight.toLowerCase().includes("advantage") ||
                              insight.toLowerCase().includes("leads") ||
                              insight.toLowerCase().includes("faster"));
                          const borderClass = isAdvantage
                            ? "border-l-emerald-500"
                            : "border-l-red-400";
                          const bgClass = isAdvantage
                            ? "bg-emerald-50/50"
                            : "bg-red-50/30";
                          const iconClass = isAdvantage
                            ? "text-emerald-600"
                            : "text-red-500";

                          // Determine icon based on content
                          let InsightIcon = Zap;
                          const lower = insight.toLowerCase();
                          if (
                            lower.includes("content") ||
                            lower.includes("word") ||
                            lower.includes("title") ||
                            lower.includes("heading") ||
                            lower.includes("meta")
                          ) {
                            InsightIcon = FileText;
                          } else if (
                            lower.includes("https") ||
                            lower.includes("canonical") ||
                            lower.includes("viewport") ||
                            lower.includes("sitemap") ||
                            lower.includes("robots")
                          ) {
                            InsightIcon = Shield;
                          } else if (
                            lower.includes("link") ||
                            lower.includes("alt text") ||
                            lower.includes("image")
                          ) {
                            InsightIcon = Link2;
                          } else if (
                            lower.includes("performance") ||
                            lower.includes("speed") ||
                            lower.includes("loads") ||
                            lower.includes("lcp") ||
                            lower.includes("mobile") ||
                            lower.includes("desktop")
                          ) {
                            InsightIcon = Zap;
                          }

                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border-l-4 ${borderClass} ${bgClass}`}
                            >
                              <div className="flex items-start gap-2">
                                <InsightIcon
                                  className={`h-4 w-4 shrink-0 mt-0.5 ${iconClass}`}
                                />
                                <p className="text-xs text-foreground leading-relaxed">
                                  {insight}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <GitCompareArrows className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No comparison run yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                    Select your site and a competitor above, then click &quot;Run Comparison&quot;
                    to see a detailed side-by-side analysis.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 3: Keyword Gap ──────────────────────────────────────────── */}
        <TabsContent value="keyword-gap" className="mt-6">
          <div className="flex flex-col gap-6">
            {/* Info Card */}
            <Card className="border-amber-200 bg-amber-50/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-amber-800 mb-1">
                      Google Search Console Integration Required
                    </h4>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Real keyword gap analysis requires connecting your Google Search Console account
                      to access actual search performance data, keyword rankings, and impression
                      metrics. The table below shows example data to illustrate what&apos;s available
                      after integration.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-100"
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Connect Google Search Console
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mock Keyword Gap Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Example Keyword Opportunities
                    </CardTitle>
                    <CardDescription>
                      Sample keyword gap data — connect GSC for real data
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {mockKeywordGaps.length} keywords
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Keyword</TableHead>
                        <TableHead className="w-[90px] text-center">Your Pos</TableHead>
                        <TableHead className="w-[90px] text-center">Comp Pos</TableHead>
                        <TableHead className="w-[110px] text-right">Volume</TableHead>
                        <TableHead className="w-[100px]">Difficulty</TableHead>
                        <TableHead className="w-[100px]">Opportunity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockKeywordGaps.map((kw) => (
                        <TableRow key={kw.keyword} className="hover:bg-muted/50">
                          <TableCell>
                            <span className="text-sm font-medium">{kw.keyword}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            {kw.yourPos ? (
                              <span className="inline-flex items-center justify-center h-6 w-8 rounded text-xs font-bold bg-amber-100 text-amber-700">
                                #{kw.yourPos}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`inline-flex items-center justify-center h-6 w-8 rounded text-xs font-bold ${
                                kw.compPos <= 5
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              #{kw.compPos}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-semibold">
                              {kw.volume}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-2 rounded-full bg-muted w-14 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    kw.difficulty >= 60
                                      ? "bg-red-500"
                                      : kw.difficulty >= 40
                                        ? "bg-amber-500"
                                        : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${kw.difficulty}%` }}
                                />
                              </div>
                              <span
                                className={`text-xs font-semibold ${
                                  kw.difficulty >= 60
                                    ? "text-red-600"
                                    : kw.difficulty >= 40
                                      ? "text-amber-600"
                                      : "text-emerald-600"
                                }`}
                              >
                                {kw.difficulty}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-medium ${
                                kw.opportunity === "Missing"
                                  ? "bg-red-50 text-red-600 border-red-200"
                                  : kw.opportunity === "Weak"
                                    ? "bg-amber-50 text-amber-600 border-amber-200"
                                    : kw.opportunity === "Untapped"
                                      ? "bg-blue-50 text-blue-600 border-blue-200"
                                      : "bg-emerald-50 text-emerald-600 border-emerald-200"
                              }`}
                            >
                              {kw.opportunity}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab 4: AI Insights ──────────────────────────────────────────── */}
        <TabsContent value="ai-insights" className="mt-6">
          <div className="flex flex-col gap-6">
            {comparisonResult ? (
              <>
                {/* Existing insights */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-amber-500" />
                          Comparison Insights
                        </CardTitle>
                        <CardDescription>
                          {comparisonResult.insights.length} insights from your comparison
                        </CardDescription>
                      </div>
                      <Button
                        onClick={handleGenerateAi}
                        disabled={isGeneratingAi}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {isGeneratingAi ? (
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-1.5" />
                        )}
                        Generate AI Recommendations
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {comparisonResult.insights.map((insight, idx) => {
                        const isAdv =
                          insight.toLowerCase().includes("your") &&
                          (insight.toLowerCase().includes("higher") ||
                            insight.toLowerCase().includes("better") ||
                            insight.toLowerCase().includes("more") ||
                            insight.toLowerCase().includes("advantage") ||
                            insight.toLowerCase().includes("leads") ||
                            insight.toLowerCase().includes("faster"));
                        return (
                          <div
                            key={idx}
                            className={`flex items-start gap-3 p-3 rounded-lg ${
                              isAdv ? "bg-emerald-50/50 border-l-4 border-l-emerald-500" : "bg-red-50/30 border-l-4 border-l-red-400"
                            }`}
                          >
                            <ChevronRight
                              className={`h-4 w-4 shrink-0 mt-0.5 ${isAdv ? "text-emerald-600" : "text-red-500"}`}
                            />
                            <p className="text-sm text-foreground">{insight}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                {/* AI Recommendations */}
                {aiRecommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-emerald-600" />
                        AI-Powered Recommendations
                      </CardTitle>
                      <CardDescription>
                        Prioritized action items to improve your competitive position
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {aiRecommendations.map((rec, idx) => {
                          const priority =
                            idx === 0
                              ? "high"
                              : idx <= 2
                                ? "medium"
                                : "low";
                          return (
                            <div
                              key={idx}
                              className="flex items-start gap-3 p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                            >
                              <div
                                className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                                  priority === "high"
                                    ? "bg-red-100 text-red-700"
                                    : priority === "medium"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {idx + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] font-medium ${
                                      priority === "high"
                                        ? "bg-red-50 text-red-600 border-red-200"
                                        : priority === "medium"
                                          ? "bg-amber-50 text-amber-600 border-amber-200"
                                          : "bg-blue-50 text-blue-600 border-blue-200"
                                    }`}
                                  >
                                    {priority === "high"
                                      ? "High Priority"
                                      : priority === "medium"
                                        ? "Medium"
                                        : "Low Priority"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-foreground leading-relaxed">
                                  {rec}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {aiRecommendations.length === 0 && !isGeneratingAi && (
                  <Card className="border-dashed">
                    <CardContent className="py-10 text-center">
                      <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Generate AI-powered recommendations
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                        Click the button above to get prioritized SEO improvement recommendations
                        based on your comparison results.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Run a comparison first
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                    Go to the &quot;Compare&quot; tab to run a side-by-side comparison, then return
                    here for AI-powered insights and recommendations.
                  </p>
                  <Button
                    className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                    size="sm"
                    onClick={() => setActiveTab("compare")}
                  >
                    <GitCompareArrows className="h-4 w-4 mr-1.5" />
                    Go to Compare
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Inline icon components for tab labels (avoid extra imports) ───────────────

function BarChart3Icon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="m7 16 4-8 4 4 4-6" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
