"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  analyzeSeo,
  stripHtml,
  countWords,
  countSentences,
  type SeoScoreResult,
  type SeoAnalysisInput,
  type SeoCheckItem,
} from "@/lib/seo-scorer";
import {
  analyzeUrl,
  isValidUrl,
  type SiteAnalysisResult,
} from "@/lib/url-analyzer";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Target,
  Type,
  FileText,
  Clock,
  AlignLeft,
  Link2,
  Wrench,
  Star,
  BookOpen,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Globe,
  Hash,
  ChevronDown,
  ChevronUp,
  Search,
  Loader2,
  FileSearch,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Sample Data ──────────────────────────────────────────────────────────────

const SAMPLE_KEYWORD = "seo tools";
const SAMPLE_TITLE = "Best SEO Tools for 2024 - Complete Guide";
const SAMPLE_META =
  "Discover the best SEO tools for 2024. Our comprehensive guide covers keyword research, backlink analysis, rank tracking, and content optimization tools.";
const SAMPLE_SLUG = "/blog/best-seo-tools-2024";
const SAMPLE_CONTENT = `<h1>Best SEO Tools for 2024 - Complete Guide</h1>

<p>Search engine optimization is the backbone of any successful digital marketing strategy. In this comprehensive guide, we explore the best <strong>SEO tools</strong> available in 2024 to help you improve your website's rankings, drive organic traffic, and outperform your competitors.</p>

<h2>Why You Need SEO Tools</h2>

<p>SEO tools are essential for any website owner or digital marketer who wants to improve their search engine rankings. These tools help you analyze your website's performance, identify technical issues, research keywords, track your rankings, and monitor your backlink profile. Without the right SEO tools, optimizing your website for search engines becomes a guessing game.</p>

<p>The landscape of search engine optimization is constantly evolving. Google updates its algorithm hundreds of times per year, and staying on top of these changes requires powerful SEO tools that can adapt and provide actionable insights.</p>

<h2>Top Keyword Research Tools</h2>

<p>Keyword research is the foundation of any successful SEO campaign. The best SEO tools for keyword research include Ahrefs, SEMrush, and Google Keyword Planner. These tools help you discover high-volume, low-competition keywords that your target audience is searching for.</p>

<p><img src="https://example.com/seo-tools-dashboard.png" alt="SEO tools dashboard showing keyword research metrics and ranking data" /></p>

<p>Ahrefs is widely regarded as one of the most comprehensive SEO tools on the market. Its keyword explorer provides detailed metrics including keyword difficulty, search volume, and click-through rates. For more information, visit <a href="https://ahrefs.com">Ahrefs</a>.</p>

<h2>Backlink Analysis Tools</h2>

<p>Backlinks remain one of the most important ranking factors in Google's algorithm. Tools like <a href="/tools/backlink-checker">our backlink checker</a> and <a href="https://moz.com">Moz</a> help you analyze your backlink profile, identify toxic links, and discover new link building opportunities.</p>

<p>A healthy backlink profile is crucial for SEO success. The right SEO tools can help you monitor your domain authority, track new and lost backlinks, and analyze the anchor text distribution of your links.</p>

<h2>Technical SEO and Site Auditing</h2>

<p>Technical SEO tools like Screaming Frog and Google Search Console help you identify crawl errors, duplicate content, missing meta tags, and other technical issues that can hurt your rankings. These SEO tools crawl your website just like a search engine would, providing a detailed report of issues that need to be fixed.</p>

<p>Regular technical audits using these tools ensure that your website remains accessible and indexable by search engines.</p>

<h2>Content Optimization Tools</h2>

<p>Content optimization is where modern SEO tools truly shine. Tools like SurferSEO, Clearscope, and our own content optimization module analyze top-ranking pages for your target keyword and provide specific recommendations for word count, heading structure, keyword density, and related terms to include.</p>

<p>By using these content optimization SEO tools, you can create content that is both user-friendly and search engine optimized, giving you the best chance of ranking on the first page of Google.</p>`;

// ─── Helper: Extract headings from content ────────────────────────────────────

function extractHeadings(content: string): string[] {
  const regex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
  const headings: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    headings.push(match[2].trim());
  }
  return headings;
}

// ─── Helper: Extract text from HTML (for fetched content) ─────────────────────

function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/&\w+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Helper: Extract structured content with headings from fetched HTML ────────

function extractStructuredContent(html: string): string {
  const parts: string[] = [];

  // Extract body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : html;

  // Extract headings with their surrounding content
  const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;

  let h1Match;
  const h1Matches: string[] = [];
  while ((h1Match = h1Regex.exec(bodyHtml)) !== null) {
    h1Matches.push(h1Match[1].replace(/<[^>]+>/g, "").trim());
  }

  let h2Match;
  const h2Matches: string[] = [];
  while ((h2Match = h2Regex.exec(bodyHtml)) !== null) {
    h2Matches.push(h2Match[1].replace(/<[^>]+>/g, "").trim());
  }

  // Build structured HTML
  for (const h1 of h1Matches) {
    parts.push(`<h1>${h1}</h1>`);
  }
  for (const h2 of h2Matches) {
    parts.push(`<h2>${h2}</h2>`);
  }

  // Get plain text content for the paragraphs
  const plainText = extractTextFromHtml(bodyHtml);

  // If we have headings and text, combine them
  if (parts.length > 0 && plainText.length > 0) {
    return parts.join("\n\n") + "\n\n" + plainText;
  }

  // Fallback: just return the plain text
  return plainText;
}

// ─── Helper: Traffic Light Dot ────────────────────────────────────────────────

function TrafficDot({ status }: { status: "good" | "ok" | "poor" }) {
  const colors = {
    good: "bg-emerald-500",
    ok: "bg-amber-500",
    poor: "bg-red-500",
  };
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${colors[status]}`}
    />
  );
}

// ─── Helper: Score Color ──────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function getScoreLabel(status: "good" | "ok" | "poor"): string {
  switch (status) {
    case "good":
      return "Good";
    case "ok":
      return "OK";
    case "poor":
      return "Poor";
  }
}

function getStatusBadgeClass(status: "good" | "ok" | "poor"): string {
  switch (status) {
    case "good":
      return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800";
    case "ok":
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800";
    case "poor":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800";
  }
}

// ─── Circular Score Gauge ─────────────────────────────────────────────────────

function ScoreGauge({ score, status }: { score: number; status: "good" | "ok" | "poor" }) {
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span
          className="text-3xl font-bold tabular-nums"
          style={{ color }}
        >
          {score}
        </span>
        <span className="text-[11px] text-muted-foreground font-medium">/ 100</span>
      </div>
    </div>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────

interface CategorySectionProps {
  title: string;
  icon: React.ReactNode;
  score: number;
  max: number;
  checks: SeoCheckItem[];
  defaultOpen?: boolean;
}

function CategorySection({
  title,
  icon,
  score,
  max,
  checks,
  defaultOpen = true,
}: CategorySectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const barColor = score / max >= 0.7 ? "#10b981" : score / max >= 0.4 ? "#f59e0b" : "#ef4444";

  return (
    <div className="border border-border/60 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-sm font-semibold">{title}</span>
          <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground ml-1">
            {score}/{max}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tabular-nums" style={{ color: barColor }}>
            {pct}%
          </span>
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {open && (
        <>
          <div className="px-4 pb-2">
            <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ backgroundColor: barColor, width: `${pct}%` }}
              />
            </div>
          </div>
          <div className="px-4 pb-4 space-y-2">
            {checks.map((check) => (
              <div key={check.id} className="flex items-start gap-2.5">
                <TrafficDot status={check.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">{check.label}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                      {check.points}/{check.maxPoints}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                    {check.message}
                  </p>
                  {check.suggestion && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                      {check.suggestion}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Readability Section ──────────────────────────────────────────────────────

function ReadabilitySection({
  readability,
}: {
  readability: SeoScoreResult["readability"];
}) {
  const { fleschScore, level, wordCount, sentenceCount, avgSentenceLength, readingTime } =
    readability;

  const levelColor =
    level === "easy"
      ? "#10b981"
      : level === "moderate"
        ? "#f59e0b"
        : "#ef4444";

  const levelLabel = level === "easy" ? "Easy" : level === "moderate" ? "Moderate" : "Hard";

  return (
    <div className="border border-border/60 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Readability</span>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] font-medium ${getStatusBadgeClass(level === "easy" ? "good" : level === "moderate" ? "ok" : "poor")}`}
        >
          {levelLabel}
        </Badge>
      </div>

      {/* Flesch Score Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Flesch Reading Ease</span>
          <span className="text-xs font-bold tabular-nums" style={{ color: levelColor }}>
            {fleschScore}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ backgroundColor: levelColor, width: `${Math.min(100, fleschScore)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Hard</span>
          <span>Moderate</span>
          <span>Easy</span>
        </div>
      </div>

      <Separator />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/20">
          <Type className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <p className="text-[10px] text-muted-foreground">Words</p>
            <p className="text-xs font-semibold tabular-nums">{wordCount.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/20">
          <AlignLeft className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <p className="text-[10px] text-muted-foreground">Sentences</p>
            <p className="text-xs font-semibold tabular-nums">{sentenceCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/20">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <p className="text-[10px] text-muted-foreground">Avg. Sentence</p>
            <p className="text-xs font-semibold tabular-nums">{avgSentenceLength} words</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/20">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <p className="text-[10px] text-muted-foreground">Reading Time</p>
            <p className="text-xs font-semibold tabular-nums">{readingTime} min</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Analyze URL Mode ─────────────────────────────────────────────────────────

function AnalyzeUrlMode({
  onContentLoaded,
}: {
  onContentLoaded: (data: {
    title: string;
    metaDescription: string;
    urlSlug: string;
    content: string;
    keyword: string;
    domain: string;
  }) => void;
}) {
  const [fetchUrl, setFetchUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const { toast } = useToast();

  const handleFetch = async () => {
    setFetchError("");

    const validation = isValidUrl(fetchUrl);
    if (!validation.valid) {
      setFetchError(validation.error || "Invalid URL.");
      return;
    }

    const url = validation.normalized;
    setFetching(true);

    try {
      const result: SiteAnalysisResult = await analyzeUrl(url);

      let domain = "";
      try {
        domain = new URL(url).hostname;
      } catch {
        domain = url;
      }

      // Extract structured content from the fetched HTML
      const structuredContent = extractStructuredContent(
        `<title>${result.onPage.title}</title><meta name="description" content="${result.onPage.metaDescription}">${result.onPage.h1.map(h => `<h1>${h}</h1>`).join("")}${result.onPage.h2.map(h => `<h2>${h}</h2>`).join("")}`
      );

      // Extract keyword from page title (first 3 words or meaningful phrase)
      const titleWords = result.onPage.title
        .replace(/[|—–-].*$/, "")
        .trim()
        .split(/\s+/)
        .filter(w => w.length > 2);
      const keyword = titleWords.slice(0, 3).join(" ") || domain.split(".")[0];

      let urlSlug = "";
      try {
        urlSlug = new URL(url).pathname || "/";
      } catch {
        urlSlug = "/";
      }

      onContentLoaded({
        title: result.onPage.title || "",
        metaDescription: result.onPage.metaDescription || "",
        urlSlug,
        content: structuredContent || result.onPage.title,
        keyword,
        domain,
      });

      toast({
        title: "Content fetched successfully",
        description: `Loaded page data from ${domain}`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch the URL. Please try again.";
      setFetchError(message);
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="max-w-lg w-full">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
            <FileSearch className="h-8 w-8 text-emerald-600" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="text-center mb-8">
          <h3 className="text-lg font-bold text-foreground">Analyze Any URL</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Enter a URL to fetch its page content and analyze it with our live SEO scoring engine.
            The title, meta description, and content will be loaded into the editor automatically.
          </p>
        </div>

        {/* URL Input */}
        <div className="space-y-3">
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="https://example.com/blog/your-article"
              value={fetchUrl}
              onChange={(e) => {
                setFetchUrl(e.target.value);
                setFetchError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !fetching) {
                  handleFetch();
                }
              }}
              className="pl-10 h-11 text-sm"
              disabled={fetching}
            />
          </div>

          {fetchError && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20">
              <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-400">{fetchError}</p>
            </div>
          )}

          <Button
            onClick={handleFetch}
            disabled={fetching || !fetchUrl.trim()}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            {fetching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Fetching & Analyzing...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Fetch & Analyze
              </>
            )}
          </Button>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 rounded-lg border border-border/60 bg-muted/20 space-y-3">
          <h4 className="text-xs font-semibold text-foreground">How it works</h4>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold shrink-0">1</span>
              <p className="text-xs text-muted-foreground">Enter any publicly accessible URL</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold shrink-0">2</span>
              <p className="text-xs text-muted-foreground">We fetch the page content via CORS proxy and analyze it</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold shrink-0">3</span>
              <p className="text-xs text-muted-foreground">Title, meta description, and content auto-fill the editor</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold shrink-0">4</span>
              <p className="text-xs text-muted-foreground">Edit and optimize the content with live SEO scoring</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ContentOptimization() {
  const [mode, setMode] = useState<"editor" | "analyze">("editor");
  const [keyword, setKeyword] = useState(SAMPLE_KEYWORD);
  const [title, setTitle] = useState(SAMPLE_TITLE);
  const [metaDescription, setMetaDescription] = useState(SAMPLE_META);
  const [urlSlug, setUrlSlug] = useState(SAMPLE_SLUG);
  const [content, setContent] = useState(SAMPLE_CONTENT);
  const { toast } = useToast();

  // ── Handle content loaded from Analyze URL mode ──
  const handleContentLoaded = useCallback((data: {
    title: string;
    metaDescription: string;
    urlSlug: string;
    content: string;
    keyword: string;
    domain: string;
  }) => {
    setTitle(data.title);
    setMetaDescription(data.metaDescription);
    setUrlSlug(data.urlSlug);
    setContent(data.content);
    setKeyword(data.keyword);
    setMode("editor");
  }, []);

  // ── Initial analysis ──
  const computeResult = useCallback((): SeoScoreResult => {
    const headings = extractHeadings(content);
    const input: SeoAnalysisInput = {
      content,
      keyword,
      title,
      metaDescription,
      urlSlug,
      headings,
    };
    return analyzeSeo(input);
  }, [content, keyword, title, metaDescription, urlSlug]);

  const [scoreResult, setScoreResult] = useState<SeoScoreResult>(() => {
    const headings = extractHeadings(SAMPLE_CONTENT);
    const input: SeoAnalysisInput = {
      content: SAMPLE_CONTENT,
      keyword: SAMPLE_KEYWORD,
      title: SAMPLE_TITLE,
      metaDescription: SAMPLE_META,
      urlSlug: SAMPLE_SLUG,
      headings,
    };
    return analyzeSeo(input);
  });

  // ── Debounced updates after initial render ──
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setScoreResult(computeResult());
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [computeResult]);

  // ── Live content stats ──
  const contentStats = useMemo(() => {
    const plainText = stripHtml(content);
    const words = countWords(plainText);
    const chars = plainText.length;
    const readingTime = Math.max(1, Math.ceil(words / 200));
    const sentences = countSentences(plainText);
    const paragraphs = plainText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0).length;
    return { words, chars, readingTime, sentences, paragraphs };
  }, [content]);

  // ── Category configs ──
  const categories = scoreResult
    ? [
        {
          key: "keywordOptimization" as const,
          title: "Keyword Optimization",
          icon: <Target className="h-4 w-4" />,
          maxPts: 30,
          defaultOpen: true,
        },
        {
          key: "contentQuality" as const,
          title: "Content Quality",
          icon: <FileText className="h-4 w-4" />,
          maxPts: 25,
          defaultOpen: true,
        },
        {
          key: "technicalSeo" as const,
          title: "Technical SEO",
          icon: <Wrench className="h-4 w-4" />,
          maxPts: 20,
          defaultOpen: false,
        },
        {
          key: "linking" as const,
          title: "Linking",
          icon: <Link2 className="h-4 w-4" />,
          maxPts: 15,
          defaultOpen: false,
        },
        {
          key: "bonus" as const,
          title: "Bonus",
          icon: <Star className="h-4 w-4" />,
          maxPts: 10,
          defaultOpen: false,
        },
      ]
    : [];

  // ── Render ──
  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            On-Page SEO Assistant
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Live SEO analysis with real-time scoring. Edit content or fetch from any URL.
          </p>
        </div>
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800 text-sm font-medium self-start"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Live Analysis
        </Badge>
      </div>

      {/* Tab Bar: Editor | Analyze URL */}
      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as "editor" | "analyze")}
      >
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="editor" className="flex-1 gap-2">
            <FileText className="h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="analyze" className="flex-1 gap-2">
            <Globe className="h-4 w-4" />
            Analyze URL
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Analyze URL Mode */}
      {mode === "analyze" && (
        <Card>
          <CardContent className="pt-6">
            <AnalyzeUrlMode onContentLoaded={handleContentLoaded} />
          </CardContent>
        </Card>
      )}

      {/* Editor Mode */}
      {mode === "editor" && (
        <>
          {/* Top Bar: Meta Inputs */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="focus-keyword" className="text-xs font-medium flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-emerald-600" />
                    Focus Keyword
                  </Label>
                  <Input
                    id="focus-keyword"
                    placeholder="e.g. seo tools"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="page-title" className="text-xs font-medium flex items-center gap-1.5">
                    <Type className="h-3.5 w-3.5 text-muted-foreground" />
                    Page Title
                  </Label>
                  <Input
                    id="page-title"
                    placeholder="Page title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="meta-desc" className="text-xs font-medium flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    Meta Description
                  </Label>
                  <Input
                    id="meta-desc"
                    placeholder="Meta description (150-160 chars)"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="url-slug" className="text-xs font-medium flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    URL Slug
                  </Label>
                  <Input
                    id="url-slug"
                    placeholder="/blog/your-post-slug"
                    value={urlSlug}
                    onChange={(e) => setUrlSlug(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Area: Two-Panel Layout */}
          <div className="flex-1 min-h-0">
            <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-xl border border-border/60 overflow-hidden">
              {/* LEFT PANEL — Content Editor (60%) */}
              <ResizablePanel defaultSize={60} minSize={35}>
                <div className="flex flex-col h-full bg-background">
                  {/* Editor Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-semibold">Content Editor</span>
                      <span className="text-[10px] text-muted-foreground">(HTML supported)</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-medium">
                      {contentStats.words.toLocaleString()} words
                    </Badge>
                  </div>

                  {/* Textarea */}
                  <div className="flex-1 min-h-0 p-4">
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write or paste your content here... HTML tags like <h1>, <h2>, <a>, <img> are supported for SEO analysis."
                      className="w-full h-full resize-none rounded-lg border border-input bg-transparent px-4 py-3 text-sm leading-relaxed shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring transition-all font-mono"
                      spellCheck={false}
                    />
                  </div>

                  {/* Live Stats Bar */}
                  <div className="flex items-center gap-1 px-4 py-2.5 border-t border-border/60 bg-muted/20">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-background border border-border/60 text-xs">
                          <Type className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium tabular-nums">{contentStats.words.toLocaleString()}</span>
                          <span className="text-muted-foreground">words</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Word count</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-background border border-border/60 text-xs">
                          <Hash className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium tabular-nums">{contentStats.chars.toLocaleString()}</span>
                          <span className="text-muted-foreground">chars</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Character count</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-background border border-border/60 text-xs">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium tabular-nums">{contentStats.readingTime}</span>
                          <span className="text-muted-foreground">min read</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Estimated reading time</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-background border border-border/60 text-xs">
                          <AlignLeft className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium tabular-nums">{contentStats.paragraphs}</span>
                          <span className="text-muted-foreground">paragraphs</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Paragraph count</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-background border border-border/60 text-xs">
                          <AlignLeft className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium tabular-nums">{contentStats.sentences}</span>
                          <span className="text-muted-foreground">sentences</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Sentence count</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </ResizablePanel>

              {/* Resizable Handle */}
              <ResizableHandle withHandle />

              {/* RIGHT PANEL — Live SEO Analysis Sidebar (40%) */}
              <ResizablePanel defaultSize={40} minSize={30}>
                <div className="flex flex-col h-full bg-background border-l border-border/60">
                  {/* Sidebar Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-semibold">Live SEO Analysis</span>
                    </div>
                    {scoreResult && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium ${getStatusBadgeClass(scoreResult.status)}`}
                      >
                        {getScoreLabel(scoreResult.status)}
                      </Badge>
                    )}
                  </div>

                  {/* Scrollable Content */}
                  <ScrollArea className="flex-1 min-h-0">
                    {scoreResult ? (
                      <div className="p-4 space-y-4">
                        {/* Score Gauge */}
                        <div className="flex flex-col items-center gap-2 py-2">
                          <ScoreGauge score={scoreResult.score} status={scoreResult.status} />
                          <div className="text-center">
                            <p className="text-sm font-bold" style={{ color: getScoreColor(scoreResult.score) }}>
                              SEO Score
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {scoreResult.score >= 80
                                ? "Great job! Your content is well optimized."
                                : scoreResult.score >= 50
                                  ? "Not bad, but there's room for improvement."
                                  : "Needs significant work to rank well."}
                            </p>
                          </div>
                        </div>

                        <Separator />

                        {/* Quick Stats Row */}
                        <div className="grid grid-cols-3 gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex flex-col items-center p-2.5 rounded-lg border border-border/60 bg-muted/10">
                                <span className="text-lg font-bold text-emerald-600 tabular-nums">
                                  {scoreResult.categoryScores.keywordOptimization.score}
                                </span>
                                <span className="text-[10px] text-muted-foreground">Keyword</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Keyword Optimization: {scoreResult.categoryScores.keywordOptimization.score}/30</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex flex-col items-center p-2.5 rounded-lg border border-border/60 bg-muted/10">
                                <span className="text-lg font-bold text-emerald-600 tabular-nums">
                                  {scoreResult.categoryScores.contentQuality.score}
                                </span>
                                <span className="text-[10px] text-muted-foreground">Content</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Content Quality: {scoreResult.categoryScores.contentQuality.score}/25</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex flex-col items-center p-2.5 rounded-lg border border-border/60 bg-muted/10">
                                <span className="text-lg font-bold text-emerald-600 tabular-nums">
                                  {scoreResult.categoryScores.technicalSeo.score}
                                </span>
                                <span className="text-[10px] text-muted-foreground">Technical</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Technical SEO: {scoreResult.categoryScores.technicalSeo.score}/20</TooltipContent>
                          </Tooltip>
                        </div>

                        <Separator />

                        {/* Category Breakdowns */}
                        <div className="space-y-2">
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Category Breakdown
                          </h3>
                          {categories.map((cat) => (
                            <CategorySection
                              key={cat.key}
                              title={cat.title}
                              icon={cat.icon}
                              score={scoreResult.categoryScores[cat.key].score}
                              max={cat.maxPts}
                              checks={scoreResult.categoryScores[cat.key].checks}
                              defaultOpen={cat.defaultOpen}
                            />
                          ))}
                        </div>

                        <Separator />

                        {/* Readability */}
                        <ReadabilitySection readability={scoreResult.readability} />

                        <Separator />

                        {/* Issues & Suggestions */}
                        <div className="space-y-3">
                          {/* Issues */}
                          {scoreResult.issues.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <span className="text-sm font-semibold">
                                  Issues ({scoreResult.issues.length})
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                {scoreResult.issues.map((issue, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-start gap-2 p-2.5 rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20"
                                  >
                                    <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                                    <span className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                                      {issue}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Suggestions */}
                          {scoreResult.suggestions.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-amber-500" />
                                <span className="text-sm font-semibold">
                                  Suggestions ({scoreResult.suggestions.length})
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                {scoreResult.suggestions.map((suggestion, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-start gap-2 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20"
                                  >
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                    <span className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                                      {suggestion}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* All checks passed */}
                          {scoreResult.issues.length === 0 && scoreResult.suggestions.length === 0 && (
                            <div className="flex flex-col items-center gap-2 py-4">
                              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                              <p className="text-sm font-medium text-emerald-600">
                                All checks passed!
                              </p>
                              <p className="text-xs text-muted-foreground text-center">
                                Your content is fully optimized. Keep up the great work!
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Bottom Spacer */}
                        <div className="h-4" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48">
                        <p className="text-sm text-muted-foreground">Analyzing...</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </>
      )}
    </div>
  );
}
