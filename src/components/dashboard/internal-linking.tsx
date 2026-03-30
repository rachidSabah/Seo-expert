"use client";

import React, { useState, useMemo } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Link2,
  AlertTriangle,
  CheckCircle2,
  Plus,
  FileText,
  Globe,
  ArrowRight,
  Search,
  Layers,
  Sparkles,
  Zap,
  Brain,
  ChevronRight,
  ChevronDown,
  CircleDot,
  Network,
  ArrowLeftRight,
  Shield,
  Lightbulb,
  TreePine,
  Type,
  BarChart3,
  Target,
  Download,
  Wrench,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LinkOpportunity {
  source: string;
  target: string;
  anchorText: string;
  relevance: number;
  priority: "high" | "medium" | "low";
  status: "pending" | "added";
}

interface OrphanPage {
  url: string;
  title: string;
  backlinks: number;
  lastCrawled: string;
  suggestedLinks: string[];
  status: "pending" | "fixed";
}

interface SiteNode {
  name: string;
  url: string;
  title?: string;
  children?: SiteNode[];
  internalLinks: number;
  isOrphan?: boolean;
}

interface TopicCluster {
  name: string;
  pageCount: number;
  pages: { url: string; label: string }[];
  suggestedLinks: number;
  strength: number;
  missingConnections: number;
  priorityLevel: "high" | "medium" | "low";
  description: string;
  crossLinks: { source: string; target: string; anchor: string }[];
}

interface AnchorRow {
  anchorText: string;
  occurrences: number;
  targetPages: number;
  type: "exact-match" | "partial-match" | "branded" | "generic" | "naked-url";
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const linkOpportunities: LinkOpportunity[] = [
  { source: "/blog/seo-guide", target: "/tools/audit", anchorText: "best SEO audit tool", relevance: 94, priority: "high", status: "pending" },
  { source: "/blog/keyword-research", target: "/tools/keyword-tool", anchorText: "keyword research tool", relevance: 89, priority: "high", status: "pending" },
  { source: "/blog/content-optimization", target: "/resources/writing-tips", anchorText: "content optimization tips", relevance: 78, priority: "medium", status: "pending" },
  { source: "/blog/seo-guide", target: "/tools/keyword-tool", anchorText: "keyword research tool", relevance: 87, priority: "high", status: "pending" },
  { source: "/blog/link-building", target: "/tools/audit", anchorText: "site audit tool", relevance: 82, priority: "medium", status: "pending" },
  { source: "/blog/technical-seo", target: "/tools/audit", anchorText: "technical SEO audit", relevance: 91, priority: "high", status: "pending" },
  { source: "/blog/on-page-seo", target: "/resources/writing-tips", anchorText: "on-page SEO tips", relevance: 75, priority: "medium", status: "pending" },
  { source: "/blog/seo-guide", target: "/blog/technical-seo", anchorText: "technical SEO guide", relevance: 85, priority: "medium", status: "pending" },
  { source: "/tools/audit", target: "/blog/technical-seo", anchorText: "learn about technical SEO", relevance: 80, priority: "medium", status: "pending" },
  { source: "/blog/seo-guide", target: "/blog/content-optimization", anchorText: "optimize your content", relevance: 73, priority: "low", status: "pending" },
  { source: "/blog/link-building", target: "/blog/seo-guide", anchorText: "SEO fundamentals", relevance: 72, priority: "low", status: "pending" },
  { source: "/resources/writing-tips", target: "/blog/content-optimization", anchorText: "content optimization guide", relevance: 77, priority: "low", status: "pending" },
  { source: "/blog/keyword-research", target: "/resources/keyword-tips", anchorText: "keyword research tips", relevance: 68, priority: "low", status: "pending" },
  { source: "/tools/keyword-tool", target: "/blog/keyword-research", anchorText: "keyword research guide", relevance: 84, priority: "medium", status: "pending" },
];

const orphanPagesData: OrphanPage[] = [
  { url: "/tools/analyzer", title: "SEO Analyzer Tool", backlinks: 12, lastCrawled: "Jan 15, 2024", suggestedLinks: ["/tools/audit", "/blog/seo-guide"], status: "pending" },
  { url: "/resources/advanced-seo", title: "Advanced SEO Guide", backlinks: 8, lastCrawled: "Jan 12, 2024", suggestedLinks: ["/blog/seo-guide", "/resources/"], status: "pending" },
  { url: "/case-studies/enterprise", title: "Enterprise Case Study", backlinks: 5, lastCrawled: "Jan 10, 2024", suggestedLinks: ["/about", "/pricing"], status: "pending" },
  { url: "/blog/seo-trends-2024", title: "SEO Trends 2024", backlinks: 3, lastCrawled: "Jan 8, 2024", suggestedLinks: ["/blog/seo-guide", "/blog/technical-seo"], status: "pending" },
  { url: "/resources/seo-checklist", title: "Complete SEO Checklist", backlinks: 7, lastCrawled: "Jan 5, 2024", suggestedLinks: ["/blog/seo-guide", "/tools/audit"], status: "pending" },
  { url: "/blog/schema-markup-guide", title: "Schema Markup Guide", backlinks: 4, lastCrawled: "Jan 3, 2024", suggestedLinks: ["/blog/technical-seo", "/tools/audit"], status: "pending" },
  { url: "/case-studies/small-business", title: "Small Business SEO", backlinks: 6, lastCrawled: "Dec 28, 2023", suggestedLinks: ["/blog/seo-guide", "/pricing"], status: "pending" },
  { url: "/resources/webinar-replays", title: "Webinar Replays", backlinks: 2, lastCrawled: "Dec 22, 2023", suggestedLinks: ["/resources/", "/blog/seo-guide"], status: "pending" },
];

const siteStructure: SiteNode[] = [
  {
    name: "/", title: "Home", url: "/", internalLinks: 8,
    children: [
      {
        name: "/blog", title: "Blog Hub", url: "/blog", internalLinks: 6,
        children: [
          { name: "/blog/seo-guide", title: "Complete SEO Guide", url: "/blog/seo-guide", internalLinks: 4 },
          { name: "/blog/keyword-research", title: "Keyword Research", url: "/blog/keyword-research", internalLinks: 3 },
          { name: "/blog/content-optimization", title: "Content Optimization", url: "/blog/content-optimization", internalLinks: 2 },
          { name: "/blog/link-building", title: "Link Building Guide", url: "/blog/link-building", internalLinks: 3 },
          { name: "/blog/technical-seo", title: "Technical SEO", url: "/blog/technical-seo", internalLinks: 2 },
          { name: "/blog/on-page-seo", title: "On-Page SEO Checklist", url: "/blog/on-page-seo", internalLinks: 1 },
        ],
      },
      {
        name: "/tools", title: "Tools Hub", url: "/tools", internalLinks: 4,
        children: [
          { name: "/tools/audit", title: "Site Audit Tool", url: "/tools/audit", internalLinks: 2 },
          { name: "/tools/analyzer", title: "SEO Analyzer", url: "/tools/analyzer", internalLinks: 0, isOrphan: true },
          { name: "/tools/keyword-tool", title: "Keyword Research Tool", url: "/tools/keyword-tool", internalLinks: 1 },
          { name: "/tools/rank-tracker", title: "Rank Tracker", url: "/tools/rank-tracker", internalLinks: 1 },
        ],
      },
      {
        name: "/resources", title: "Resources", url: "/resources", internalLinks: 5,
        children: [
          { name: "/resources/guides", title: "SEO Guides", url: "/resources/guides", internalLinks: 3 },
          { name: "/resources/advanced-seo", title: "Advanced SEO", url: "/resources/advanced-seo", internalLinks: 0, isOrphan: true },
          { name: "/resources/webinar-replays", title: "Webinar Replays", url: "/resources/webinar-replays", internalLinks: 1 },
        ],
      },
      {
        name: "/case-studies", title: "Case Studies", url: "/case-studies", internalLinks: 3,
        children: [
          { name: "/case-studies/enterprise", title: "Enterprise SEO", url: "/case-studies/enterprise", internalLinks: 0, isOrphan: true },
          { name: "/case-studies/small-business", title: "Small Business SEO", url: "/case-studies/small-business", internalLinks: 1 },
        ],
      },
      { name: "/pricing", title: "Pricing", url: "/pricing", internalLinks: 2 },
      { name: "/about", title: "About Us", url: "/about", internalLinks: 1 },
    ],
  },
];

const depthData = [
  { depth: "Depth 0", pages: 1, color: "#10b981" },
  { depth: "Depth 1", pages: 5, color: "#14b8a6" },
  { depth: "Depth 2", pages: 12, color: "#06b6d4" },
  { depth: "Depth 3", pages: 5, color: "#8b5cf6" },
];

const topicClusters: TopicCluster[] = [
  {
    name: "SEO Tools Cluster",
    pageCount: 5,
    pages: [
      { url: "/tools/audit", label: "Site Audit Tool" },
      { url: "/tools/analyzer", label: "SEO Analyzer" },
      { url: "/tools/keyword-tool", label: "Keyword Research Tool" },
      { url: "/tools/rank-tracker", label: "Rank Tracker" },
      { url: "/blog/seo-tools-review", label: "SEO Tools Review" },
    ],
    suggestedLinks: 12,
    strength: 72,
    missingConnections: 5,
    priorityLevel: "high",
    description: "Strong topical cluster with high interlinking potential. Missing cross-links between blog reviews and tool pages.",
    crossLinks: [
      { source: "/blog/seo-tools-review", target: "/tools/audit", anchor: "best SEO audit tool" },
      { source: "/tools/analyzer", target: "/tools/audit", anchor: "comprehensive site audit" },
      { source: "/tools/keyword-tool", target: "/blog/seo-tools-review", anchor: "tools we reviewed" },
    ],
  },
  {
    name: "Keyword Research Cluster",
    pageCount: 4,
    pages: [
      { url: "/blog/keyword-guide", label: "Keyword Guide" },
      { url: "/blog/keyword-research", label: "Keyword Research" },
      { url: "/tools/keyword-tool", label: "Keyword Tool" },
      { url: "/resources/keyword-tips", label: "Keyword Tips" },
    ],
    suggestedLinks: 8,
    strength: 65,
    missingConnections: 4,
    priorityLevel: "medium",
    description: "Good cluster foundation. Add links from keyword guide to tool page and resources.",
    crossLinks: [
      { source: "/blog/keyword-guide", target: "/tools/keyword-tool", anchor: "keyword research tool" },
      { source: "/resources/keyword-tips", target: "/blog/keyword-research", anchor: "keyword research guide" },
    ],
  },
  {
    name: "Content SEO Cluster",
    pageCount: 4,
    pages: [
      { url: "/blog/content-optimization", label: "Content Optimization" },
      { url: "/blog/on-page-seo", label: "On-Page SEO" },
      { url: "/resources/writing-tips", label: "Writing Tips" },
      { url: "/blog/copywriting-seo", label: "SEO Copywriting" },
    ],
    suggestedLinks: 9,
    strength: 58,
    missingConnections: 6,
    priorityLevel: "medium",
    description: "Moderate interlinking. Consider linking optimization guide to writing tips and copywriting.",
    crossLinks: [
      { source: "/blog/content-optimization", target: "/resources/writing-tips", anchor: "content optimization tips" },
      { source: "/blog/on-page-seo", target: "/blog/copywriting-seo", anchor: "SEO copywriting techniques" },
    ],
  },
  {
    name: "Technical SEO Cluster",
    pageCount: 3,
    pages: [
      { url: "/blog/technical-seo", label: "Technical SEO" },
      { url: "/tools/audit", label: "Site Audit Tool" },
      { url: "/resources/site-speed-guide", label: "Site Speed Guide" },
    ],
    suggestedLinks: 5,
    strength: 80,
    missingConnections: 2,
    priorityLevel: "low",
    description: "Well-connected cluster. Only a few missing connections between audit tool and speed guide.",
    crossLinks: [
      { source: "/resources/site-speed-guide", target: "/tools/audit", anchor: "run a site audit" },
    ],
  },
];

const anchorTexts: AnchorRow[] = [
  { anchorText: "seo tools", occurrences: 18, targetPages: 6, type: "exact-match" },
  { anchorText: "SEO Expert", occurrences: 14, targetPages: 8, type: "branded" },
  { anchorText: "keyword research", occurrences: 12, targetPages: 4, type: "exact-match" },
  { anchorText: "site audit", occurrences: 9, targetPages: 3, type: "exact-match" },
  { anchorText: "best seo", occurrences: 7, targetPages: 5, type: "partial-match" },
  { anchorText: "click here", occurrences: 8, targetPages: 8, type: "generic" },
  { anchorText: "read more", occurrences: 6, targetPages: 6, type: "generic" },
  { anchorText: "learn more", occurrences: 5, targetPages: 5, type: "generic" },
  { anchorText: "SEO Expert Pro", occurrences: 10, targetPages: 7, type: "branded" },
  { anchorText: "https://seoexpert.com", occurrences: 6, targetPages: 2, type: "naked-url" },
  { anchorText: "https://seoexpert.com/tools", occurrences: 4, targetPages: 1, type: "naked-url" },
  { anchorText: "our complete guide", occurrences: 4, targetPages: 3, type: "generic" },
  { anchorText: "free seo tools online", occurrences: 5, targetPages: 3, type: "partial-match" },
  { anchorText: "seo audit tool review", occurrences: 3, targetPages: 2, type: "partial-match" },
  { anchorText: "https://seoexpert.com/blog", occurrences: 2, targetPages: 1, type: "naked-url" },
];

const anchorTypeDistribution = [
  { name: "Branded", value: 30, color: "#8b5cf6" },
  { name: "Keyword", value: 18, color: "#10b981" },
  { name: "Naked URL", value: 20, color: "#6b7280" },
  { name: "Generic", value: 15, color: "#f59e0b" },
  { name: "Partial Match", value: 17, color: "#3b82f6" },
];

/* ------------------------------------------------------------------ */
/*  Helper Components                                                  */
/* ------------------------------------------------------------------ */

function PriorityBadge({ priority }: { priority: string }) {
  const cfg: Record<string, string> = {
    high: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
    medium: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    low: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
  };
  return (
    <Badge variant="outline" className={`text-xs font-medium capitalize ${cfg[priority] ?? cfg.low}`}>
      {priority}
    </Badge>
  );
}

function AnchorTypeBadge({ type }: { type: string }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    "exact-match": { cls: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800", label: "Exact Match" },
    "partial-match": { cls: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800", label: "Partial Match" },
    branded: { cls: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-400 dark:border-violet-800", label: "Branded" },
    generic: { cls: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800", label: "Generic" },
    "naked-url": { cls: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-400 dark:border-gray-800", label: "Naked URL" },
  };
  const c = cfg[type] ?? cfg.generic;
  return (
    <Badge variant="outline" className={`text-xs font-medium ${c.cls}`}>
      {c.label}
    </Badge>
  );
}

function RelevanceBar({ relevance }: { relevance: number }) {
  const colorClass = relevance >= 85 ? "bg-emerald-500" : relevance >= 70 ? "bg-blue-500" : "bg-amber-500";
  const textColor = relevance >= 85 ? "text-emerald-600" : relevance >= 70 ? "text-blue-600" : "text-amber-600";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 rounded-full bg-muted w-20 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${colorClass}`} style={{ width: `${relevance}%` }} />
      </div>
      <span className={`text-xs font-semibold w-8 ${textColor}`}>{relevance}%</span>
    </div>
  );
}

function StrengthBar({ value }: { value: number }) {
  const color = value >= 80 ? "#10b981" : value >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="h-2 rounded-full bg-muted flex-1 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ backgroundColor: color, width: `${value}%` }} />
      </div>
      <span className="font-semibold w-8 text-right" style={{ color }}>{value}%</span>
    </div>
  );
}

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number;
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return percent > 0.05 ? (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

/* ------------------------------------------------------------------ */
/*  Tree Node Component                                                */
/* ------------------------------------------------------------------ */

function TreeNode({ node, depth = 0 }: { node: SiteNode; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isOrphan = node.internalLinks === 0 && depth > 0;

  const depthColors = ["border-emerald-500", "border-amber-500", "border-cyan-500", "border-violet-500"];
  const dotColors = ["bg-emerald-500", "bg-amber-500", "bg-cyan-500", "bg-violet-500"];
  const borderColor = depthColors[depth] ?? depthColors[3];
  const dotColor = dotColors[depth] ?? dotColors[3];

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors group cursor-pointer"
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className={`w-0.5 self-stretch rounded-full ${borderColor} shrink-0`} />

        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )
        ) : (
          <div className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
        )}

        <span className="text-sm font-mono truncate flex-1 max-w-[200px]">{node.name}</span>

        {node.title && node.url !== "/" && (
          <span className="text-xs text-muted-foreground truncate hidden lg:inline">{node.title}</span>
        )}

        <Badge
          variant="outline"
          className={`text-[10px] shrink-0 ${isOrphan ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800" : "bg-muted"}`}
        >
          {node.internalLinks} {node.internalLinks === 1 ? "link" : "links"}
        </Badge>

        {isOrphan && (
          <Badge variant="outline" className="text-[10px] bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800 shrink-0">
            ORPHAN
          </Badge>
        )}
      </div>
      {expanded && hasChildren && (
        <div className="relative">
          <div className={`absolute left-[${depth * 24 + 20}px] top-0 bottom-0 w-px bg-border`} />
          {node.children!.map((child) => (
            <TreeNode key={child.url} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function InternalLinking() {
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [opportunities, setOpportunities] = useState<LinkOpportunity[]>(linkOpportunities);
  const [orphans, setOrphans] = useState<OrphanPage[]>(orphanPagesData);
  const [analyzing, setAnalyzing] = useState(false);
  const [domainUrl, setDomainUrl] = useState("https://seoexpert.com");
  const [expandedClusters, setExpandedClusters] = useState<Set<number>>(new Set([0]));
  const [appliedClusterIds, setAppliedClusterIds] = useState<Set<number>>(new Set());

  const filteredOpportunities = useMemo(() => {
    if (priorityFilter === "all") return opportunities;
    return opportunities.filter((o) => o.priority === priorityFilter);
  }, [opportunities, priorityFilter]);

  const highCount = opportunities.filter((o) => o.priority === "high").length;
  const medCount = opportunities.filter((o) => o.priority === "medium").length;
  const lowCount = opportunities.filter((o) => o.priority === "low").length;

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => setAnalyzing(false), 2000);
  };

  const handleMarkAdded = (idx: number) => {
    setOpportunities((prev) =>
      prev.map((o, i) => (i === idx ? { ...o, status: "added" as const } : o))
    );
  };

  const handleAddAllHigh = () => {
    setOpportunities((prev) =>
      prev.map((o) => (o.priority === "high" ? { ...o, status: "added" as const } : o))
    );
  };

  const handleFixOrphan = (idx: number) => {
    setOrphans((prev) =>
      prev.map((o, i) => (i === idx ? { ...o, status: "fixed" as const } : o))
    );
  };

  const handleAutoFixAll = () => {
    setOrphans((prev) => prev.map((o) => ({ ...o, status: "fixed" as const })));
  };

  const toggleCluster = (idx: number) => {
    setExpandedClusters((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleApplyCluster = (idx: number) => {
    setAppliedClusterIds((prev) => new Set(prev).add(idx));
  };

  const pendingCount = opportunities.filter((o) => o.status === "pending").length;
  const pendingOrphanCount = orphans.filter((o) => o.status === "pending").length;

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 p-6">
        {/* ---------- Header ---------- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Network className="h-6 w-6 text-emerald-600" />
              Internal Linking Engine
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered internal link analysis, topic clusters, and smart suggestions.
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            Export Report
          </Button>
        </div>

        {/* ---------- Top Bar: Input + KPIs ---------- */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter domain or project URL..."
                  value={domainUrl}
                  onChange={(e) => setDomainUrl(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap"
                onClick={handleAnalyze}
                disabled={analyzing}
              >
                {analyzing ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze Links
                  </>
                )}
              </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <Card className="p-4 border-0 shadow-none bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                    <Layers className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Pages</p>
                    <p className="text-xl font-bold">23</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 border-0 shadow-none bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                    <Link2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Link Opportunities</p>
                    <p className="text-xl font-bold text-emerald-600">16</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 border-0 shadow-none bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Orphan Pages</p>
                    <p className="text-xl font-bold text-red-600">8</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 border-0 shadow-none bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Click Depth</p>
                    <p className="text-xl font-bold">2.3</p>
                  </div>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* ---------- Tabs ---------- */}
        <Tabs defaultValue="opportunities" className="w-full">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="opportunities">
              <Plus className="h-4 w-4 mr-1.5" />
              Opportunities
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-xs">{pendingCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="orphans">
              <AlertTriangle className="h-4 w-4 mr-1.5" />
              Orphan Pages
              {pendingOrphanCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-xs">{pendingOrphanCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="structure">
              <TreePine className="h-4 w-4 mr-1.5" />
              Structure
            </TabsTrigger>
            <TabsTrigger value="smart">
              <Brain className="h-4 w-4 mr-1.5" />
              Smart Suggestions
            </TabsTrigger>
            <TabsTrigger value="anchor">
              <Type className="h-4 w-4 mr-1.5" />
              Anchor Analysis
            </TabsTrigger>
          </TabsList>

          {/* ====================================================== */}
          {/*  TAB 1 — Opportunities                                   */}
          {/* ====================================================== */}
          <TabsContent value="opportunities">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Link Opportunities</CardTitle>
                    <CardDescription>
                      {filteredOpportunities.length} internal link suggestions to strengthen site structure
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Priority filter buttons */}
                    {(["all", "high", "medium", "low"] as const).map((p) => {
                      const counts = { all: opportunities.length, high: highCount, medium: medCount, low: lowCount };
                      const active = priorityFilter === p;
                      return (
                        <Button
                          key={p}
                          size="sm"
                          variant={active ? "default" : "outline"}
                          className={active ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 text-xs" : "text-xs"}
                          onClick={() => setPriorityFilter(p)}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)} ({counts[p]})
                        </Button>
                      );
                    })}
                    <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />
                    <Button
                      size="sm"
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={handleAddAllHigh}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Add All High Priority
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[550px] rounded-md border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Source Page</TableHead>
                        <TableHead className="w-[40px]" />
                        <TableHead>Target Page</TableHead>
                        <TableHead>Suggested Anchor Text</TableHead>
                        <TableHead className="w-[130px]">Relevance Score</TableHead>
                        <TableHead className="w-[80px]">Priority</TableHead>
                        <TableHead className="w-[100px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOpportunities.map((opp, idx) => (
                        <TableRow
                          key={`${opp.source}-${opp.target}-${idx}`}
                          className={`group hover:bg-muted/50 ${opp.status === "added" ? "opacity-60" : ""}`}
                        >
                          <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell>
                            <span className="text-xs font-mono text-muted-foreground">{opp.source}</span>
                          </TableCell>
                          <TableCell>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-mono text-muted-foreground">{opp.target}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">&quot;{opp.anchorText}&quot;</span>
                          </TableCell>
                          <TableCell>
                            <RelevanceBar relevance={opp.relevance} />
                          </TableCell>
                          <TableCell>
                            <PriorityBadge priority={opp.priority} />
                          </TableCell>
                          <TableCell>
                            {opp.status === "added" ? (
                              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Added ✓
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => handleMarkAdded(idx)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Link
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====================================================== */}
          {/*  TAB 2 — Orphan Pages                                     */}
          {/* ====================================================== */}
          <TabsContent value="orphans">
            <div className="space-y-6">
              <Alert className="border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 dark:text-amber-400">
                  ⚠️ 8 orphan pages detected — these pages have no internal links pointing to them
                </AlertTitle>
                <AlertDescription className="text-amber-700/80 dark:text-amber-400/80">
                  Orphan pages are difficult for search engines to discover. Add internal links from relevant pages to improve crawlability.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">Orphan Pages</CardTitle>
                      <CardDescription>Pages with zero internal links pointing to them</CardDescription>
                    </div>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                      onClick={handleAutoFixAll}
                      disabled={pendingOrphanCount === 0}
                    >
                      <Zap className="h-4 w-4 mr-1.5" />
                      Auto-Fix All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[500px] rounded-md border">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead>URL</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead className="w-[90px] text-center">Backlinks</TableHead>
                          <TableHead className="w-[120px]">Last Crawled</TableHead>
                          <TableHead>Suggested Internal Links</TableHead>
                          <TableHead className="w-[100px]">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orphans.map((page, idx) => (
                          <TableRow
                            key={page.url}
                            className={`group hover:bg-muted/50 ${page.status === "fixed" ? "opacity-60" : ""}`}
                          >
                            <TableCell>
                              <span className="text-xs font-mono text-red-500">{page.url}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium">{page.title}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800">
                                {page.backlinks}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground">{page.lastCrawled}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {page.suggestedLinks.map((link) => (
                                  <Badge key={link} variant="outline" className="text-[10px] font-mono">
                                    {link}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              {page.status === "fixed" ? (
                                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Fixed
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                  onClick={() => handleFixOrphan(idx)}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Link
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ====================================================== */}
          {/*  TAB 3 — Structure                                       */}
          {/* ====================================================== */}
          <TabsContent value="structure">
            <div className="space-y-6">
              {/* Tree */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <TreePine className="h-4 w-4 text-emerald-600" />
                        Site Structure
                      </CardTitle>
                      <CardDescription>Interactive site hierarchy — click to expand/collapse nodes</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      3 orphans
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[520px] rounded-md border p-2">
                    {siteStructure.map((node) => (
                      <TreeNode key={node.url} node={node} depth={0} />
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Click Depth Chart + Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Click Depth Distribution</CardTitle>
                    <CardDescription>Number of clicks required to reach each page from the homepage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={depthData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                          <XAxis
                            dataKey="depth"
                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--popover))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                            formatter={(value: number) => [`${value} pages`, "Pages"]}
                          />
                          <Bar dataKey="pages" radius={[6, 6, 0, 0]} barSize={56}>
                            {depthData.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="space-y-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                        <Globe className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Homepage</p>
                        <p className="text-lg font-bold">Depth 0</p>
                      </div>
                      <Badge variant="outline" className="ml-auto text-xs">1 page</Badge>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-teal-100 dark:bg-teal-950 flex items-center justify-center">
                        <Layers className="h-4 w-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Main Sections</p>
                        <p className="text-lg font-bold">Depth 1</p>
                      </div>
                      <Badge variant="outline" className="ml-auto text-xs">5 pages</Badge>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Sub-pages</p>
                        <p className="text-lg font-bold">Depth 2</p>
                      </div>
                      <Badge variant="outline" className="ml-auto text-xs">12 pages</Badge>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-950 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Deep Pages</p>
                        <p className="text-lg font-bold">Depth 3</p>
                      </div>
                      <Badge variant="outline" className="ml-auto text-xs">5 pages</Badge>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ====================================================== */}
          {/*  TAB 4 — Smart Suggestions                                */}
          {/* ====================================================== */}
          <TabsContent value="smart">
            <div className="space-y-6">
              {/* Header */}
              <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                      <Brain className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">AI-Powered Topic Clusters</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Our engine detected 4 topic clusters with 34 cross-linking opportunities. Strengthen your topical authority by connecting related pages within each cluster.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Topic Cluster Cards */}
              {topicClusters.map((cluster, idx) => {
                const isExpanded = expandedClusters.has(idx);
                const isApplied = appliedClusterIds.has(idx);
                return (
                  <Card key={cluster.name} className={isApplied ? "opacity-60" : ""}>
                    <CardHeader className="pb-3">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleCluster(idx)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                            cluster.priorityLevel === "high"
                              ? "bg-red-100 dark:bg-red-950"
                              : cluster.priorityLevel === "medium"
                                ? "bg-amber-100 dark:bg-amber-950"
                                : "bg-emerald-100 dark:bg-emerald-950"
                          }`}>
                            <CircleDot className={`h-4 w-4 ${
                              cluster.priorityLevel === "high"
                                ? "text-red-600"
                                : cluster.priorityLevel === "medium"
                                  ? "text-amber-600"
                                  : "text-emerald-600"
                            }`} />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-semibold">{cluster.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {cluster.pageCount} pages &middot; {cluster.suggestedLinks} suggested links &middot;{" "}
                              <PriorityBadge priority={cluster.priorityLevel} />
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={(e) => { e.stopPropagation(); handleApplyCluster(idx); }}
                            disabled={isApplied}
                          >
                            {isApplied ? (
                              <><CheckCircle2 className="h-3 w-3 mr-1" />Applied</>
                            ) : (
                              <><Sparkles className="h-3 w-3 mr-1" />Apply All Suggestions</>
                            )}
                          </Button>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent className="pt-0 space-y-4">
                        {/* Cluster Strength */}
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground w-28 shrink-0">Cluster Strength</span>
                          <StrengthBar value={cluster.strength} />
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground w-28 shrink-0">Missing Connections</span>
                          <Badge variant="outline" className={`text-xs ${
                            cluster.missingConnections > 4
                              ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
                              : cluster.missingConnections > 2
                                ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800"
                                : "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                          }`}>
                            {cluster.missingConnections} connections
                          </Badge>
                        </div>

                        <Separator />

                        {/* Pages in cluster */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Pages in Cluster</p>
                          <div className="flex flex-wrap gap-2">
                            {cluster.pages.map((p) => (
                              <Badge key={p.url} variant="outline" className="text-xs font-mono">
                                {p.url}
                                <span className="ml-1 text-muted-foreground font-sans">({p.label})</span>
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Cross-links */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Suggested Cross-Links</p>
                          <div className="space-y-1.5">
                            {cluster.crossLinks.map((cl, ci) => (
                              <div key={ci} className="flex items-center gap-2 text-xs bg-muted/50 rounded-md px-3 py-2">
                                <span className="font-mono text-emerald-600 truncate max-w-[180px]">{cl.source}</span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="font-mono text-blue-600 truncate max-w-[180px]">{cl.target}</span>
                                <span className="text-muted-foreground mx-1">&mdash;</span>
                                <span className="font-medium text-foreground truncate">&quot;{cl.anchor}&quot;</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground italic">{cluster.description}</p>
                      </CardContent>
                    )}
                  </Card>
                );
              })}

              {/* Bulk Actions */}
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-emerald-600" />
                    Bulk Actions
                  </CardTitle>
                  <CardDescription>Apply fixes across all areas at once</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-200 dark:hover:border-red-800"
                      onClick={handleAutoFixAll}
                    >
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <span className="text-sm font-medium">Fix All Orphan Pages</span>
                      <span className="text-xs text-muted-foreground">Add links to 8 orphan pages</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:border-emerald-200 dark:hover:border-emerald-800"
                      onClick={() => setAppliedClusterIds(new Set(topicClusters.map((_, i) => i)))}
                    >
                      <Network className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm font-medium">Strengthen All Clusters</span>
                      <span className="text-xs text-muted-foreground">Apply 34 cross-link suggestions</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-amber-50 dark:hover:bg-amber-950 hover:border-amber-200 dark:hover:border-amber-800"
                    >
                      <BarChart3 className="h-5 w-5 text-amber-500" />
                      <span className="text-sm font-medium">Optimize Click Depth</span>
                      <span className="text-xs text-muted-foreground">Reduce avg depth from 2.3 to 1.8</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ====================================================== */}
          {/*  TAB 5 — Anchor Analysis                                  */}
          {/* ====================================================== */}
          <TabsContent value="anchor">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Anchor Text Table */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Type className="h-4 w-4 text-emerald-600" />
                    Anchor Text Distribution
                  </CardTitle>
                  <CardDescription>All internal link anchor texts across your site</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[480px] rounded-md border">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead>Anchor Text</TableHead>
                          <TableHead className="w-[100px]">Occurrences</TableHead>
                          <TableHead className="w-[100px]">Target Pages</TableHead>
                          <TableHead className="w-[120px]">Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {anchorTexts.map((row) => (
                          <TableRow key={row.anchorText} className="hover:bg-muted/50">
                            <TableCell>
                              <span className="text-sm font-medium font-mono">&quot;{row.anchorText}&quot;</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{row.occurrences}x</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">{row.targetPages}</span>
                            </TableCell>
                            <TableCell>
                              <AnchorTypeBadge type={row.type} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Donut Chart + Health Assessment */}
              <div className="space-y-6">
                {/* Donut Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Anchor Type Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={anchorTypeDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={95}
                            paddingAngle={3}
                            dataKey="value"
                            labelLine={false}
                            label={PieLabel}
                          >
                            {anchorTypeDistribution.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--popover))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                            formatter={(value: number) => [`${value}%`, "Share"]}
                          />
                          <Legend
                            verticalAlign="bottom"
                            iconType="circle"
                            iconSize={8}
                            formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Health Assessment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      Health Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Overall Score */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Anchor Health</span>
                      <Badge variant="outline" className="text-sm bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800 font-bold">
                        78/100
                      </Badge>
                    </div>
                    <Progress value={78} className="h-2" />

                    <Separator />

                    {/* Insights */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">Good:</span> Branded anchors are diverse with 8 unique variations
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-amber-700 dark:text-amber-400">Warning:</span> Too many generic &quot;click here&quot; and &quot;read more&quot; anchors (19 occurrences)
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Target className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-blue-700 dark:text-blue-400">Action:</span> Add more partial-match keyword anchors for better topical signals
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Progress bars */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Branded Diversity</span>
                          <span className="font-medium text-emerald-600">85%</span>
                        </div>
                        <Progress value={85} className="h-1.5" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Keyword Relevance</span>
                          <span className="font-medium text-blue-600">72%</span>
                        </div>
                        <Progress value={72} className="h-1.5" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Generic Overuse</span>
                          <span className="font-medium text-amber-600">45%</span>
                        </div>
                        <Progress value={45} className="h-1.5" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">URL Overuse</span>
                          <span className="font-medium text-emerald-600">78%</span>
                        </div>
                        <Progress value={78} className="h-1.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
