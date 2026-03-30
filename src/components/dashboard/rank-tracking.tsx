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
import {
  Target,
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Minus,
  Globe,
  Plus,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  ArrowUpDown,
  Search,
  Star,
  Image as ImageIcon,
  HelpCircle,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// --- Mock Data ---

const GEO_OPTIONS = [
  { value: "us", label: "United States", flag: "🇺🇸" },
  { value: "uk", label: "United Kingdom", flag: "🇬🇧" },
  { value: "ca", label: "Canada", flag: "🇨🇦" },
  { value: "au", label: "Australia", flag: "🇦🇺" },
  { value: "de", label: "Germany", flag: "🇩🇪" },
];

const DATE_OPTIONS = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "12m", label: "Last 12 Months" },
];

interface KeywordRank {
  keyword: string;
  position: number;
  previousPosition: number;
  change: number;
  url: string;
  best: number;
}

const allKeywords: KeywordRank[] = [
  { keyword: "seo tools", position: 4, previousPosition: 6, change: 2, url: "/", best: 3 },
  { keyword: "keyword research", position: 7, previousPosition: 7, change: 0, url: "/blog/keyword-research", best: 5 },
  { keyword: "site audit", position: 12, previousPosition: 15, change: 3, url: "/tools/audit", best: 8 },
  { keyword: "rank tracker", position: 8, previousPosition: 11, change: 3, url: "/tools/rank-tracker", best: 6 },
  { keyword: "seo analyzer", position: 15, previousPosition: 18, change: 3, url: "/tools/analyzer", best: 12 },
  { keyword: "on page seo", position: 22, previousPosition: 19, change: -3, url: "/blog/on-page-seo", best: 14 },
  { keyword: "link building", position: 9, previousPosition: 9, change: 0, url: "/blog/link-building", best: 7 },
  { keyword: "content optimization", position: 18, previousPosition: 23, change: 5, url: "/blog/content-optimization", best: 11 },
  { keyword: "backlink checker", position: 6, previousPosition: 8, change: 2, url: "/tools/backlink-checker", best: 4 },
  { keyword: "domain authority", position: 31, previousPosition: 28, change: -3, url: "/resources/domain-authority", best: 22 },
  { keyword: "technical seo", position: 14, previousPosition: 17, change: 3, url: "/blog/technical-seo", best: 10 },
  { keyword: "free seo tools", position: 5, previousPosition: 5, change: 0, url: "/tools/free", best: 3 },
  { keyword: "serp checker", position: 25, previousPosition: 22, change: -3, url: "/tools/serp-checker", best: 16 },
  { keyword: "meta description", position: 19, previousPosition: 21, change: 2, url: "/blog/meta-description", best: 14 },
  { keyword: "local seo", position: 28, previousPosition: 32, change: 4, url: "/resources/local-seo", best: 19 },
  { keyword: "seo checklist", position: 11, previousPosition: 14, change: 3, url: "/blog/seo-checklist", best: 8 },
  { keyword: "competitor analysis", position: 16, previousPosition: 16, change: 0, url: "/tools/competitor", best: 12 },
  { keyword: "organic traffic", position: 33, previousPosition: 35, change: 2, url: "/blog/organic-traffic", best: 25 },
  { keyword: "site speed", position: 21, previousPosition: 19, change: -2, url: "/blog/site-speed", best: 15 },
  { keyword: "schema markup", position: 38, previousPosition: 42, change: 4, url: "/resources/schema-markup", best: 28 },
];

const distributionData = [
  { range: "1-3", count: 12, color: "#10b981", label: "Positions 1-3" },
  { range: "4-10", count: 34, color: "#34d399", label: "Positions 4-10" },
  { range: "11-20", count: 52, color: "#f59e0b", label: "Positions 11-20" },
  { range: "21-50", count: 38, color: "#fbbf24", label: "Positions 21-50" },
  { range: "51-100", count: 16, color: "#9ca3af", label: "Positions 51-100" },
  { range: ">100", count: 4, color: "#ef4444", label: "Positions >100" },
];

const pieDistributionData = [
  { name: "Positions 1-3", value: 12, color: "#10b981" },
  { name: "Positions 4-10", value: 34, color: "#34d399" },
  { name: "Positions 11-20", value: 52, color: "#f59e0b" },
  { name: "Positions 21-50", value: 38, color: "#fbbf24" },
  { name: "Positions 51-100", value: 16, color: "#9ca3af" },
  { name: "Positions >100", value: 4, color: "#ef4444" },
];

interface SerpFeatureRow {
  keyword: string;
  position: number;
  featuredIn: string[];
  owned: boolean;
}

const serpFeatureTable: SerpFeatureRow[] = [
  { keyword: "seo tools", position: 4, featuredIn: ["Featured Snippet"], owned: true },
  { keyword: "keyword research", position: 7, featuredIn: ["People Also Ask"], owned: false },
  { keyword: "free seo tools", position: 5, featuredIn: ["Featured Snippet"], owned: false },
  { keyword: "domain authority", position: 31, featuredIn: ["Knowledge Panel"], owned: false },
  { keyword: "on page seo", position: 22, featuredIn: ["People Also Ask"], owned: false },
  { keyword: "backlink checker", position: 6, featuredIn: ["Image Pack"], owned: false },
  { keyword: "meta description", position: 19, featuredIn: ["People Also Ask", "Image Pack"], owned: false },
  { keyword: "technical seo", position: 14, featuredIn: ["Featured Snippet"], owned: true },
  { keyword: "site audit", position: 12, featuredIn: ["People Also Ask"], owned: false },
];

const serpFeatureStats = [
  { label: "Featured Snippets", count: 3, icon: Star, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400" },
  { label: "People Also Ask", count: 12, icon: HelpCircle, color: "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400" },
  { label: "Knowledge Panel", count: 2, icon: Activity, color: "text-violet-600 bg-violet-50 dark:bg-violet-950 dark:text-violet-400" },
  { label: "Image Pack", count: 8, icon: ImageIcon, color: "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400" },
];

// --- Helpers ---

function getPositionColor(pos: number): string {
  if (pos <= 10) return "text-emerald-600 dark:text-emerald-400";
  if (pos <= 20) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getPositionBg(pos: number): string {
  if (pos <= 10) return "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400";
  if (pos <= 20) return "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400";
  return "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400";
}

function ChangeIndicator({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <ArrowUp className="h-3 w-3" />
        +{change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs font-semibold text-red-500 dark:text-red-400">
        <ArrowDown className="h-3 w-3" />
        {change}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
      <Minus className="h-3 w-3" />
      0 →
    </span>
  );
}

function ChangeBadge({ change }: { change: number }) {
  if (change > 1) {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
        +{change} ↑↑
      </Badge>
    );
  }
  if (change < -1) {
    return (
      <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800 text-xs font-semibold">
        {change} ↓↓
      </Badge>
    );
  }
  if (change > 0) {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
        +{change} ↑
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800 text-xs font-semibold">
      {change} ↓
    </Badge>
  );
}

type SortKey = "keyword" | "position" | "previousPosition" | "change" | "best";
type SortDir = "asc" | "desc";

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
  return sortDir === "asc" ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
}

const CustomBarTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium text-popover-foreground mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }} className="text-xs">
            Keywords: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number; name: string }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return percent > 0.06 ? (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

// --- Main Component ---

export function RankTracking() {
  const [geo, setGeo] = useState("us");
  const [dateRange, setDateRange] = useState("30d");
  const [sortKey, setSortKey] = useState<SortKey>("position");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [keywordInput, setKeywordInput] = useState("");

  const geoLabel = GEO_OPTIONS.find((g) => g.value === geo)?.label || "United States";
  const dateLabel = DATE_OPTIONS.find((d) => d.value === dateRange)?.label || "Last 30 Days";

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "position" || key === "previousPosition" || key === "best" ? "asc" : "desc");
    }
  };

  const sortedKeywords = useMemo(() => {
    return [...allKeywords].sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "keyword") return a.keyword.localeCompare(b.keyword) * mul;
      return (a[sortKey] - b[sortKey]) * mul;
    });
  }, [sortKey, sortDir]);

  const biggestWinners = useMemo(() => {
    return [...allKeywords].sort((a, b) => b.change - a.change).slice(0, 5);
  }, []);

  const biggestLosers = useMemo(() => {
    return [...allKeywords].sort((a, b) => a.change - b.change).slice(0, 5);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Rank Tracking</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor your keyword positions across search engines and track progress over time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Selectors Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Select value={geo} onValueChange={setGeo}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GEO_OPTIONS.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.flag} {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_OPTIONS.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <Input
            placeholder="Add keyword..."
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            className="h-9 text-sm"
          />
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Keyword
          </Button>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Updated 2 hours ago
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-muted-foreground">Total Tracked Keywords</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">156</span>
                </div>
                <p className="text-xs text-muted-foreground">tracked in {geoLabel}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-muted-foreground">Top 3 Positions</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">23</span>
                  <span className="flex items-center text-xs font-medium text-emerald-600">
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                    +3 this week
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">podium positions</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-muted-foreground">Top 10 Positions</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">67</span>
                  <span className="flex items-center text-xs font-medium text-emerald-600">
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                    +5 this week
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">first page positions</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                <Medal className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-muted-foreground">Average Position</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">12.4</span>
                  <span className="flex items-center text-xs font-medium text-emerald-600">
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                    -0.8 improved
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{dateLabel}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-violet-50 dark:bg-violet-950 flex items-center justify-center">
                <Activity className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all-keywords" className="w-full">
        <TabsList>
          <TabsTrigger value="all-keywords">
            <Target className="h-4 w-4 mr-1.5" />
            All Keywords
            <Badge variant="secondary" className="ml-1.5 text-xs">{allKeywords.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="movers">
            <Activity className="h-4 w-4 mr-1.5" />
            Movers &amp; Shakers
          </TabsTrigger>
          <TabsTrigger value="distribution">
            <BarChart3 className="h-4 w-4 mr-1.5" />
            Distribution
          </TabsTrigger>
          <TabsTrigger value="serp-features">
            <Sparkles className="h-4 w-4 mr-1.5" />
            SERP Features
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: All Keywords */}
        <TabsContent value="all-keywords">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">All Keywords</CardTitle>
                  <CardDescription>
                    Tracking {allKeywords.length} keywords in {geoLabel} · {dateLabel}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[600px] overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort("keyword")}>
                        <span className="flex items-center">Keyword <SortIcon col="keyword" sortKey={sortKey} sortDir={sortDir} /></span>
                      </TableHead>
                      <TableHead className="w-[100px] cursor-pointer select-none" onClick={() => handleSort("position")}>
                        <span className="flex items-center justify-end">Position <SortIcon col="position" sortKey={sortKey} sortDir={sortDir} /></span>
                      </TableHead>
                      <TableHead className="w-[100px] cursor-pointer select-none" onClick={() => handleSort("previousPosition")}>
                        <span className="flex items-center justify-end">Prev <SortIcon col="previousPosition" sortKey={sortKey} sortDir={sortDir} /></span>
                      </TableHead>
                      <TableHead className="w-[90px] cursor-pointer select-none" onClick={() => handleSort("change")}>
                        <span className="flex items-center justify-end">Change <SortIcon col="change" sortKey={sortKey} sortDir={sortDir} /></span>
                      </TableHead>
                      <TableHead className="w-[220px]">URL</TableHead>
                      <TableHead className="w-[80px] cursor-pointer select-none" onClick={() => handleSort("best")}>
                        <span className="flex items-center justify-end">Best <SortIcon col="best" sortKey={sortKey} sortDir={sortDir} /></span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedKeywords.map((kw) => (
                      <TableRow key={kw.keyword} className="group hover:bg-muted/50">
                        <TableCell>
                          <span className="text-sm font-medium group-hover:text-emerald-600 transition-colors">
                            {kw.keyword}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`inline-flex items-center justify-center h-7 w-9 rounded-md text-sm font-bold ${getPositionBg(kw.position)}`}>
                            {kw.position}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`text-sm font-medium ${getPositionColor(kw.previousPosition)}`}>
                            {kw.previousPosition}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <ChangeIndicator change={kw.change} />
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground font-mono truncate block max-w-[200px]">
                            {kw.url}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`text-sm font-semibold ${getPositionColor(kw.best)}`}>
                            #{kw.best}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Movers & Shakers */}
        <TabsContent value="movers">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Biggest Winners */}
            <Card className="border-emerald-200 dark:border-emerald-800/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Biggest Winners</CardTitle>
                    <CardDescription>Keywords with the largest position improvements</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {biggestWinners.map((kw, idx) => (
                    <div key={kw.keyword} className="flex items-center gap-4 p-3 rounded-lg border border-border/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-emerald-600">{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{kw.keyword}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{kw.url}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">#{kw.previousPosition}</span>
                        <ArrowUp className="h-4 w-4 text-emerald-600" />
                        <span className={`inline-flex items-center justify-center h-7 w-9 rounded-md text-sm font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400`}>
                          #{kw.position}
                        </span>
                        <ChangeBadge change={kw.change} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Biggest Losers */}
            <Card className="border-red-200 dark:border-red-800/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Biggest Losers</CardTitle>
                    <CardDescription>Keywords that dropped in rankings</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {biggestLosers.map((kw, idx) => (
                    <div key={kw.keyword} className="flex items-center gap-4 p-3 rounded-lg border border-border/50 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors">
                      <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-red-600">{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{kw.keyword}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{kw.url}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">#{kw.previousPosition}</span>
                        <ArrowDown className="h-4 w-4 text-red-500" />
                        <span className={`inline-flex items-center justify-center h-7 w-9 rounded-md text-sm font-bold bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400`}>
                          #{kw.position}
                        </span>
                        <ChangeBadge change={kw.change} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Distribution */}
        <TabsContent value="distribution">
          <div className="flex flex-col gap-6">
            {/* Position Distribution Bar Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Keyword Position Distribution</CardTitle>
                    <CardDescription>How your tracked keywords are distributed across SERP positions</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {distributionData.map((d) => (
                      <span key={d.range} className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        {d.label}
                      </span>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                      <XAxis
                        dataKey="range"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={50}>
                        {distributionData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} stroke="none" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bottom Row: Pie + Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Distribution Share</CardTitle>
                  <CardDescription>Percentage breakdown by position range</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          label={PieCustomLabel}
                        >
                          {pieDistributionData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value: number) => [`${value} keywords`, "Count"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-2">
                    {pieDistributionData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-muted-foreground text-xs">{item.name}</span>
                        </div>
                        <span className="font-semibold text-xs">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Distribution Summary */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Distribution Summary</CardTitle>
                  <CardDescription>Key insights about your keyword position distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className="h-4 w-4 text-emerald-600" />
                          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Top 10 Coverage</p>
                        </div>
                        <p className="text-2xl font-bold text-emerald-600">29.5%</p>
                        <p className="text-xs text-muted-foreground mt-1">46 of 156 keywords on page 1</p>
                      </div>
                      <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Medal className="h-4 w-4 text-amber-600" />
                          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Page 2 Potential</p>
                        </div>
                        <p className="text-2xl font-bold text-amber-600">33.3%</p>
                        <p className="text-xs text-muted-foreground mt-1">52 keywords in positions 11-20</p>
                      </div>
                      <div className="p-4 rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-red-600" />
                          <p className="text-sm font-semibold text-red-700 dark:text-red-400">Needs Improvement</p>
                        </div>
                        <p className="text-2xl font-bold text-red-600">37.2%</p>
                        <p className="text-xs text-muted-foreground mt-1">58 keywords beyond position 20</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium mb-1">Optimization Opportunity</p>
                          <p className="text-xs text-muted-foreground">
                            You have <span className="font-semibold text-amber-600">52 keywords on page 2</span> that could reach page 1 with targeted content improvements. 
                            Focus on the 14 keywords in positions 11-15 — they are closest to breaking through. 
                            Additionally, 12 keywords in positions 1-3 are strong candidates for Featured Snippet optimization.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: SERP Features */}
        <TabsContent value="serp-features">
          <div className="flex flex-col gap-6">
            {/* Feature Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {serpFeatureStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label} className="relative overflow-hidden">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-bold text-foreground">{stat.count}</span>
                            <span className="text-xs text-muted-foreground">keywords</span>
                          </div>
                        </div>
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* SERP Feature Table */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="text-base">SERP Feature Tracking</CardTitle>
                  <CardDescription>Special SERP features detected for your tracked keywords</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-[400px] overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Keyword</TableHead>
                        <TableHead className="w-[100px] text-right">Position</TableHead>
                        <TableHead className="w-[250px]">Featured In</TableHead>
                        <TableHead className="w-[100px] text-right">Owned?</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serpFeatureTable.map((row) => (
                        <TableRow key={row.keyword} className="group hover:bg-muted/50">
                          <TableCell>
                            <span className="text-sm font-medium group-hover:text-emerald-600 transition-colors">
                              {row.keyword}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`inline-flex items-center justify-center h-7 w-9 rounded-md text-sm font-bold ${getPositionBg(row.position)}`}>
                              {row.position}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              {row.featuredIn.map((feature) => (
                                <Badge
                                  key={feature}
                                  variant="outline"
                                  className={`text-xs ${
                                    feature === "Featured Snippet"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                                      : feature === "People Also Ask"
                                        ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800"
                                        : feature === "Knowledge Panel"
                                          ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-400 dark:border-violet-800"
                                          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800"
                                  }`}
                                >
                                  {feature}
                                  {feature === "Featured Snippet" && " ✅"}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {row.owned ? (
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
                                ✅ Yes
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800 text-xs font-medium">
                                ❌ No
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Opportunity Cards */}
            <Card className="border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20 dark:to-transparent">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                    <Lightbulb className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Featured Snippet Opportunities</CardTitle>
                    <CardDescription>Keywords where you are close to winning a featured snippet</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-background">
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">High Priority</p>
                    <p className="text-2xl font-bold text-foreground">3</p>
                    <p className="text-xs text-muted-foreground mt-1">Featured snippet opportunities where you rank #2-5</p>
                    <div className="mt-3 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="font-medium">seo tools</span>
                        <span className="text-muted-foreground">— Position 4</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="font-medium">free seo tools</span>
                        <span className="text-muted-foreground">— Position 5</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="font-medium">backlink checker</span>
                        <span className="text-muted-foreground">— Position 6</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-background">
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">Content Structure</p>
                    <p className="text-2xl font-bold text-foreground">5</p>
                    <p className="text-xs text-muted-foreground mt-1">People Also Ask boxes you could capture with FAQ content</p>
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground">
                        Add structured FAQ sections to your existing pages that already appear in PAA boxes.
                      </p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-800/50 bg-background">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Image Pack</p>
                    <p className="text-2xl font-bold text-foreground">8</p>
                    <p className="text-xs text-muted-foreground mt-1">Keywords showing Image Pack — optimize images with alt text</p>
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground">
                        Use descriptive alt text, high-quality images, and proper schema markup.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
