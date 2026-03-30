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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Search,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Hash,
  BarChart3,
  Target,
  Layers,
  Filter,
  ChevronDown,
  ChevronUp,
  Plus,
  Check,
} from "lucide-react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
  ZAxis,
} from "recharts";

// --- Mock Data ---

interface Keyword {
  keyword: string;
  volume: number;
  cpc: number;
  difficulty: number;
  intent: "informational" | "transactional" | "navigational" | "commercial";
  trend: number;
}

const keywords: Keyword[] = [
  { keyword: "seo tools", volume: 74000, cpc: 12.4, difficulty: 89, intent: "commercial", trend: 5 },
  { keyword: "keyword research", volume: 33000, cpc: 8.9, difficulty: 72, intent: "informational", trend: 3 },
  { keyword: "backlink checker", volume: 22000, cpc: 6.5, difficulty: 65, intent: "transactional", trend: 8 },
  { keyword: "site audit tool", volume: 18000, cpc: 9.2, difficulty: 58, intent: "transactional", trend: 12 },
  { keyword: "rank tracker", volume: 14000, cpc: 7.8, difficulty: 52, intent: "transactional", trend: 2 },
  { keyword: "seo analyzer", volume: 12000, cpc: 5.4, difficulty: 48, intent: "informational", trend: 6 },
  { keyword: "on page seo", volume: 9900, cpc: 4.2, difficulty: 42, intent: "informational", trend: 4 },
  { keyword: "content optimization", volume: 8100, cpc: 6.1, difficulty: 55, intent: "commercial", trend: 15 },
  { keyword: "serp checker", volume: 6600, cpc: 3.8, difficulty: 38, intent: "informational", trend: -2 },
  { keyword: "domain authority", volume: 40000, cpc: 11.5, difficulty: 85, intent: "informational", trend: 1 },
  { keyword: "link building", volume: 27000, cpc: 15.2, difficulty: 78, intent: "informational", trend: 7 },
  { keyword: "technical seo", volume: 15000, cpc: 7.4, difficulty: 62, intent: "informational", trend: 9 },
  { keyword: "competitor analysis", volume: 11000, cpc: 8.8, difficulty: 56, intent: "commercial", trend: 11 },
  { keyword: "organic traffic", volume: 8800, cpc: 5.6, difficulty: 44, intent: "informational", trend: 3 },
  { keyword: "meta description generator", volume: 5400, cpc: 3.2, difficulty: 32, intent: "transactional", trend: 18 },
  { keyword: "seo checklist", volume: 7200, cpc: 4.8, difficulty: 36, intent: "informational", trend: 14 },
  { keyword: "free seo tools", volume: 22000, cpc: 9.8, difficulty: 82, intent: "transactional", trend: 4 },
  { keyword: "local seo", volume: 31000, cpc: 13.6, difficulty: 71, intent: "commercial", trend: 6 },
];

interface ClusterKeyword {
  keyword: string;
  volume: string;
  cpc: string;
  difficulty: number;
}

interface Cluster {
  name: string;
  keywords: ClusterKeyword[];
  totalVol: string;
  avgDiff: number;
  color: string;
}

const keywordClusters: Cluster[] = [
  {
    name: "Technical SEO",
    keywords: [
      { keyword: "technical seo", volume: "15K", cpc: "$7.40", difficulty: 62 },
      { keyword: "site audit", volume: "18K", cpc: "$9.20", difficulty: 58 },
      { keyword: "page speed", volume: "12K", cpc: "$6.30", difficulty: 55 },
      { keyword: "core web vitals", volume: "6.1K", cpc: "$4.10", difficulty: 52 },
      { keyword: "robots.txt", volume: "0.5K", cpc: "$1.20", difficulty: 18 },
    ],
    totalVol: "51K",
    avgDiff: 58,
    color: "#10b981",
  },
  {
    name: "Content SEO",
    keywords: [
      { keyword: "content optimization", volume: "8.1K", cpc: "$6.10", difficulty: 55 },
      { keyword: "on page seo", volume: "9.9K", cpc: "$4.20", difficulty: 42 },
      { keyword: "seo copywriting", volume: "7.2K", cpc: "$5.30", difficulty: 38 },
      { keyword: "keyword density", volume: "4.1K", cpc: "$3.10", difficulty: 32 },
    ],
    totalVol: "29K",
    avgDiff: 42,
    color: "#3b82f6",
  },
  {
    name: "Link Building",
    keywords: [
      { keyword: "link building", volume: "27K", cpc: "$15.20", difficulty: 78 },
      { keyword: "backlink checker", volume: "22K", cpc: "$6.50", difficulty: 65 },
      { keyword: "anchor text", volume: "6.6K", cpc: "$3.40", difficulty: 52 },
      { keyword: "disavow links", volume: "2.4K", cpc: "$2.80", difficulty: 45 },
    ],
    totalVol: "58K",
    avgDiff: 65,
    color: "#8b5cf6",
  },
  {
    name: "Analytics & Tracking",
    keywords: [
      { keyword: "rank tracker", volume: "14K", cpc: "$7.80", difficulty: 52 },
      { keyword: "organic traffic", volume: "8.8K", cpc: "$5.60", difficulty: 44 },
      { keyword: "serp checker", volume: "6.6K", cpc: "$3.80", difficulty: 38 },
    ],
    totalVol: "29K",
    avgDiff: 45,
    color: "#f59e0b",
  },
  {
    name: "SEO Tools",
    keywords: [
      { keyword: "seo tools", volume: "74K", cpc: "$12.40", difficulty: 89 },
      { keyword: "seo analyzer", volume: "12K", cpc: "$5.40", difficulty: 48 },
      { keyword: "free seo tools", volume: "22K", cpc: "$9.80", difficulty: 82 },
      { keyword: "domain authority", volume: "40K", cpc: "$11.50", difficulty: 85 },
    ],
    totalVol: "148K",
    avgDiff: 76,
    color: "#ef4444",
  },
];

interface Opportunity {
  keyword: string;
  volume: string;
  volumeNum: number;
  diff: number;
  quadrant: string;
  intent: string;
}

const topOpportunities: Opportunity[] = [
  { keyword: "meta description generator", volume: "5.4K", volumeNum: 5400, diff: 32, quadrant: "Quick Win", intent: "transactional" },
  { keyword: "seo checklist", volume: "7.2K", volumeNum: 7200, diff: 36, quadrant: "Quick Win", intent: "informational" },
  { keyword: "serp checker", volume: "6.6K", volumeNum: 6600, diff: 38, quadrant: "Quick Win", intent: "informational" },
  { keyword: "on page seo", volume: "9.9K", volumeNum: 9900, diff: 42, quadrant: "High Value", intent: "informational" },
  { keyword: "organic traffic", volume: "8.8K", volumeNum: 8800, diff: 44, quadrant: "High Value", intent: "informational" },
];

// --- Helpers ---

function formatVolume(vol: number): string {
  if (vol >= 1000000) return (vol / 1000000).toFixed(1) + "M";
  if (vol >= 10000) return (vol / 1000).toFixed(0) + "K";
  if (vol >= 1000) return (vol / 1000).toFixed(1) + "K";
  return vol.toLocaleString("en-US");
}

function IntentBadge({ intent }: { intent: string }) {
  const config: Record<string, string> = {
    informational: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
    transactional: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
    navigational: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-400 dark:border-violet-800",
    commercial: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
  };
  return (
    <Badge variant="outline" className={`text-xs font-medium capitalize ${config[intent] || config.informational}`}>
      {intent}
    </Badge>
  );
}

function DifficultyBar({ difficulty }: { difficulty: number }) {
  const color = difficulty > 60 ? "bg-red-500" : difficulty >= 40 ? "bg-amber-500" : "bg-emerald-500";
  const bgColor = difficulty > 60 ? "bg-red-100 dark:bg-red-950" : difficulty >= 40 ? "bg-amber-100 dark:bg-amber-950" : "bg-emerald-100 dark:bg-emerald-950";
  const textColor = difficulty > 60 ? "text-red-600" : difficulty >= 40 ? "text-amber-600" : "text-emerald-600";

  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 rounded-full ${bgColor} w-20 overflow-hidden`}>
        <div className={`h-full rounded-full ${color}`} style={{ width: `${difficulty}%` }} />
      </div>
      <span className={`text-xs font-semibold w-6 text-right ${textColor}`}>{difficulty}</span>
    </div>
  );
}

function TrendIndicator({ trend }: { trend: number }) {
  if (trend > 0) {
    return (
      <span className="flex items-center text-xs font-medium text-emerald-600">
        <TrendingUp className="h-3 w-3 mr-0.5" />
        +{trend}%
      </span>
    );
  }
  if (trend < 0) {
    return (
      <span className="flex items-center text-xs font-medium text-red-500">
        <TrendingDown className="h-3 w-3 mr-0.5" />
        {trend}%
      </span>
    );
  }
  return (
    <span className="flex items-center text-xs font-medium text-muted-foreground">
      0%
    </span>
  );
}

function SortIcon({ col, currentSortKey, currentSortDir }: { col: keyof Keyword; currentSortKey: keyof Keyword; currentSortDir: "asc" | "desc" }) {
  if (currentSortKey !== col) return <span className="ml-1 opacity-30">↕</span>;
  return <span className="ml-1">{currentSortDir === "asc" ? "↑" : "↓"}</span>;
}

// --- Main Component ---

export function KeywordResearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [intentFilter, setIntentFilter] = useState("all");
  const [diffRange, setDiffRange] = useState("all");
  const [volRange, setVolRange] = useState("all");
  const [sortKey, setSortKey] = useState<keyof Keyword>("volume");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [trackedKeywords, setTrackedKeywords] = useState<Set<string>>(new Set());
  const [trackedClusters, setTrackedClusters] = useState<Set<string>>(new Set());
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set(["Technical SEO"]));

  const handleSort = (key: keyof Keyword) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filteredKeywords = useMemo(() => {
    const filtered = keywords.filter((kw) => {
      if (searchQuery && !kw.keyword.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (intentFilter !== "all" && kw.intent !== intentFilter) return false;
      if (diffRange === "easy" && kw.difficulty > 40) return false;
      if (diffRange === "medium" && (kw.difficulty <= 40 || kw.difficulty > 60)) return false;
      if (diffRange === "hard" && kw.difficulty <= 60) return false;
      if (volRange === "low" && kw.volume > 10000) return false;
      if (volRange === "medium" && (kw.volume <= 10000 || kw.volume > 20000)) return false;
      if (volRange === "high" && kw.volume <= 20000) return false;
      return true;
    });
    filtered.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return filtered;
  }, [searchQuery, intentFilter, diffRange, volRange, sortKey, sortDir]);

  const avgVol = Math.round(filteredKeywords.reduce((sum, kw) => sum + kw.volume, 0) / Math.max(filteredKeywords.length, 1));
  const avgDiff = Math.round(filteredKeywords.reduce((sum, kw) => sum + kw.difficulty, 0) / Math.max(filteredKeywords.length, 1));

  const toggleTrack = (keyword: string) => {
    setTrackedKeywords((prev) => {
      const next = new Set(prev);
      if (next.has(keyword)) next.delete(keyword);
      else next.add(keyword);
      return next;
    });
  };

  const toggleTrackCluster = (name: string) => {
    setTrackedClusters((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleCluster = (name: string) => {
    setExpandedClusters((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const scatterData = keywords.map((kw) => ({
    x: kw.volume,
    y: kw.difficulty,
    z: kw.cpc * 10,
    name: kw.keyword,
    intent: kw.intent,
  }));

  const SCATTER_COLORS: Record<string, string> = {
    informational: "#3b82f6",
    transactional: "#10b981",
    commercial: "#f59e0b",
    navigational: "#8b5cf6",
  };

  const quadrantBadge = (label: string) => {
    if (label === "Quick Win") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";
    if (label === "High Value") return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Keyword Research</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Discover high-value keywords and analyze opportunities for your SEO strategy.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Sparkles className="h-4 w-4 mr-1.5" />
            AI Suggestions
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Discover Keywords"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filter Row */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground shrink-0">
              <Filter className="h-4 w-4" />
              Filters:
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={intentFilter} onValueChange={setIntentFilter}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Intent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Intents</SelectItem>
                  <SelectItem value="informational">Informational</SelectItem>
                  <SelectItem value="transactional">Transactional</SelectItem>
                  <SelectItem value="navigational">Navigational</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
              <Select value={diffRange} onValueChange={setDiffRange}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulty</SelectItem>
                  <SelectItem value="easy">Easy (0-40)</SelectItem>
                  <SelectItem value="medium">Medium (41-60)</SelectItem>
                  <SelectItem value="hard">Hard (61-100)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={volRange} onValueChange={setVolRange}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Volume" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Volume</SelectItem>
                  <SelectItem value="low">Low (0-10K)</SelectItem>
                  <SelectItem value="medium">Medium (10K-20K)</SelectItem>
                  <SelectItem value="high">High (20K+)</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Search className="h-4 w-4 mr-1.5" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                <Hash className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Keywords Found</p>
                <p className="text-2xl font-bold text-foreground">{filteredKeywords.length.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Volume</p>
                <p className="text-2xl font-bold text-foreground">{formatVolume(avgVol)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
                <Target className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Difficulty</p>
                <p className="text-2xl font-bold text-foreground">{avgDiff}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="keywords" className="w-full">
        <TabsList>
          <TabsTrigger value="keywords">
            <Search className="h-4 w-4 mr-1.5" />
            Keywords
            <Badge variant="secondary" className="ml-1.5 text-xs">{filteredKeywords.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="clusters">
            <Layers className="h-4 w-4 mr-1.5" />
            Clusters
          </TabsTrigger>
          <TabsTrigger value="opportunities">
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Opportunities
          </TabsTrigger>
        </TabsList>

        {/* Tab 1 — Keywords */}
        <TabsContent value="keywords">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Keyword Results</CardTitle>
                  <CardDescription>
                    {filteredKeywords.length} keywords found matching your criteria
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Easy
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    Medium
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    Hard
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[600px] overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort("keyword")}>
                        Keyword <SortIcon col="keyword" currentSortKey={sortKey} currentSortDir={sortDir} />
                      </TableHead>
                      <TableHead className="w-[100px] text-right cursor-pointer select-none" onClick={() => handleSort("volume")}>
                        Volume <SortIcon col="volume" currentSortKey={sortKey} currentSortDir={sortDir} />
                      </TableHead>
                      <TableHead className="w-[80px] text-right cursor-pointer select-none" onClick={() => handleSort("cpc")}>
                        CPC <SortIcon col="cpc" currentSortKey={sortKey} currentSortDir={sortDir} />
                      </TableHead>
                      <TableHead className="w-[160px] cursor-pointer select-none" onClick={() => handleSort("difficulty")}>
                        Difficulty <SortIcon col="difficulty" currentSortKey={sortKey} currentSortDir={sortDir} />
                      </TableHead>
                      <TableHead className="w-[130px]">Intent</TableHead>
                      <TableHead className="w-[100px]">Trend</TableHead>
                      <TableHead className="w-[100px] text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKeywords.map((kw, idx) => {
                      const isTracked = trackedKeywords.has(kw.keyword);
                      return (
                        <TableRow key={kw.keyword} className="group hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-5">{idx + 1}</span>
                              <span className="text-sm font-medium group-hover:text-emerald-600 transition-colors">
                                {kw.keyword}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-semibold text-foreground">
                              {formatVolume(kw.volume)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-medium text-emerald-600">
                              ${kw.cpc.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <DifficultyBar difficulty={kw.difficulty} />
                          </TableCell>
                          <TableCell>
                            <IntentBadge intent={kw.intent} />
                          </TableCell>
                          <TableCell>
                            <TrendIndicator trend={kw.trend} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant={isTracked ? "outline" : "ghost"}
                              size="sm"
                              className={`text-xs h-7 ${isTracked ? "border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-400" : ""}`}
                              onClick={() => toggleTrack(kw.keyword)}
                            >
                              {isTracked ? (
                                <><Check className="h-3 w-3 mr-1" /> Tracking ✓</>
                              ) : (
                                <><Plus className="h-3 w-3 mr-1" /> Track</>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2 — Clusters */}
        <TabsContent value="clusters">
          <div className="space-y-4">
            {keywordClusters.map((cluster) => {
              const isExpanded = expandedClusters.has(cluster.name);
              const isTracked = trackedClusters.has(cluster.name);
              return (
                <Collapsible
                  key={cluster.name}
                  open={isExpanded}
                  onOpenChange={() => toggleCluster(cluster.name)}
                >
                  <Card>
                    <CollapsibleTrigger className="w-full text-left">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: cluster.color }} />
                            <div>
                              <CardTitle className="text-base">{cluster.name}</CardTitle>
                              <CardDescription className="mt-0.5">
                                {cluster.keywords.length} keywords · Total Vol: {cluster.totalVol} · Avg Diff: {cluster.avgDiff}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                cluster.avgDiff > 60
                                  ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
                                  : cluster.avgDiff >= 40
                                  ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800"
                                  : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                              }`}
                            >
                              Diff: {cluster.avgDiff}
                            </Badge>
                            <Button
                              variant={isTracked ? "outline" : "ghost"}
                              size="sm"
                              className={`text-xs h-7 ${isTracked ? "border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-400" : ""}`}
                              onClick={(e) => { e.stopPropagation(); toggleTrackCluster(cluster.name); }}
                            >
                              {isTracked ? (
                                <><Check className="h-3 w-3 mr-1" /> Tracking ✓</>
                              ) : (
                                <><Plus className="h-3 w-3 mr-1" /> Track Cluster</>
                              )}
                            </Button>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-4">
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Keyword</TableHead>
                                <TableHead className="w-[100px] text-right">Volume</TableHead>
                                <TableHead className="w-[80px] text-right">CPC</TableHead>
                                <TableHead className="w-[160px]">Difficulty</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {cluster.keywords.map((kw) => (
                                <TableRow key={kw.keyword} className="group hover:bg-muted/50">
                                  <TableCell>
                                    <span className="text-sm font-medium group-hover:text-emerald-600 transition-colors">
                                      {kw.keyword}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className="text-sm font-semibold text-foreground">{kw.volume}</span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className="text-sm font-medium text-emerald-600">{kw.cpc}</span>
                                  </TableCell>
                                  <TableCell>
                                    <DifficultyBar difficulty={kw.difficulty} />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab 3 — Opportunities */}
        <TabsContent value="opportunities">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Volume vs Difficulty Analysis</CardTitle>
                  <CardDescription>
                    Identify keyword opportunities by analyzing volume and difficulty relationship
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {Object.entries(SCATTER_COLORS).map(([intent, color]) => (
                    <span key={intent} className="flex items-center gap-1.5 capitalize">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                      {intent}
                    </span>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="Volume"
                      domain={[0, 80000]}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatVolume(v as number)}
                      label={{
                        value: "Search Volume",
                        position: "insideBottom",
                        offset: -10,
                        fontSize: 12,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="Difficulty"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: "Difficulty",
                        angle: -90,
                        position: "insideLeft",
                        offset: 10,
                        fontSize: 12,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                    <ZAxis type="number" dataKey="z" range={[60, 400]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === "Difficulty") return [value, "Difficulty"];
                        if (name === "Volume") return [formatVolume(value), "Volume"];
                        return [value, name];
                      }}
                      labelFormatter={(_, payload) => {
                        if (payload && payload.length > 0) {
                          const item = payload[0].payload;
                          return item.name;
                        }
                        return "";
                      }}
                    />
                    <ReferenceLine x={10000} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.5} />
                    <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.5} />
                    {/* Quadrant labels */}
                    <text x="5000" y="15" fill="hsl(var(--muted-foreground))" fontSize="10" opacity={0.4} textAnchor="middle">
                      Quick Wins
                    </text>
                    <text x="45000" y="15" fill="hsl(var(--muted-foreground))" fontSize="10" opacity={0.4} textAnchor="middle">
                      High Value
                    </text>
                    <text x="5000" y="95" fill="hsl(var(--muted-foreground))" fontSize="10" opacity={0.4} textAnchor="middle">
                      Hidden Gems
                    </text>
                    <text x="45000" y="95" fill="hsl(var(--muted-foreground))" fontSize="10" opacity={0.4} textAnchor="middle">
                      Competitive
                    </text>
                    <Scatter data={scatterData} fill="#10b981">
                      {scatterData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={SCATTER_COLORS[entry.intent] || "#10b981"}
                          fillOpacity={0.75}
                          stroke={SCATTER_COLORS[entry.intent] || "#10b981"}
                          strokeWidth={1}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top 5 Opportunities */}
          <div className="mt-6">
            <h3 className="text-base font-semibold text-foreground mb-4">Top 5 Opportunities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {topOpportunities.map((opp, idx) => (
                <Card key={opp.keyword} className="relative overflow-hidden">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                        {idx + 1}
                      </span>
                      <Badge variant="outline" className={`text-xs font-medium ${quadrantBadge(opp.quadrant)}`}>
                        {opp.quadrant}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-foreground mb-2 line-clamp-2">{opp.keyword}</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Volume</span>
                        <span className="font-semibold text-foreground">{opp.volume}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Difficulty</span>
                        <span className={`font-semibold ${opp.diff < 40 ? "text-emerald-600" : "text-amber-600"}`}>{opp.diff}</span>
                      </div>
                      <DifficultyBar difficulty={opp.diff} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
