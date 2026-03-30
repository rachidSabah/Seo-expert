"use client";

import React, { useState } from "react";
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
import {
  Shield,
  ShieldAlert,
  Link2,
  Globe,
  ArrowUpRight,
  ExternalLink,
  Ban,
  Check,
  Download,
  RefreshCw,
  Eye,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
  Info,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// --- Mock Data ---

const backlinkGrowthData = [
  { month: "Jan", total: 8200, newLinks: 0 },
  { month: "Feb", total: 8500, newLinks: 300 },
  { month: "Mar", total: 8900, newLinks: 400 },
  { month: "Apr", total: 9400, newLinks: 500 },
  { month: "May", total: 9800, newLinks: 400 },
  { month: "Jun", total: 10200, newLinks: 400 },
  { month: "Jul", total: 10600, newLinks: 400 },
  { month: "Aug", total: 11000, newLinks: 400 },
  { month: "Sep", total: 11400, newLinks: 400 },
  { month: "Oct", total: 11900, newLinks: 500 },
  { month: "Nov", total: 12300, newLinks: 400 },
  { month: "Dec", total: 12847, newLinks: 547 },
];

const linkTypeData = [
  { name: "Dofollow", value: 10021, color: "#10b981", pct: 78 },
  { name: "Nofollow", value: 2312, color: "#6b7280", pct: 18 },
  { name: "Sponsored", value: 385, color: "#f59e0b", pct: 3 },
  { name: "UGC", value: 129, color: "#3b82f6", pct: 1 },
];

const topReferringDomains = [
  { domain: "moz.com", dr: 91, backlinks: 342, firstSeen: "Jan 2023", type: "Dofollow" },
  { domain: "searchengineland.com", dr: 85, backlinks: 218, firstSeen: "Mar 2023", type: "Dofollow" },
  { domain: "semrush.com", dr: 89, backlinks: 156, firstSeen: "Feb 2023", type: "Dofollow" },
  { domain: "ahrefs.com", dr: 90, backlinks: 134, firstSeen: "Jan 2023", type: "Dofollow" },
  { domain: "neilpatel.com", dr: 82, backlinks: 98, firstSeen: "Apr 2023", type: "Nofollow" },
  { domain: "backlinko.com", dr: 78, backlinks: 87, firstSeen: "Jun 2023", type: "Dofollow" },
  { domain: "techcrunch.com", dr: 95, backlinks: 45, firstSeen: "Aug 2023", type: "Nofollow" },
  { domain: "forbes.com", dr: 94, backlinks: 38, firstSeen: "Sep 2023", type: "Nofollow" },
  { domain: "wordstream.com", dr: 76, backlinks: 72, firstSeen: "May 2023", type: "Dofollow" },
  { domain: "searchenginejournal.com", dr: 83, backlinks: 95, firstSeen: "Feb 2023", type: "Dofollow" },
];

const allReferringDomains = [
  ...topReferringDomains,
  { domain: "hubspot.com", dr: 88, backlinks: 28, firstSeen: "Jul 2023", type: "Dofollow", status: "Active" },
  { domain: "entrepreneur.com", dr: 86, backlinks: 22, firstSeen: "Aug 2023", type: "Dofollow", status: "Active" },
  { domain: "moz.com/blog", dr: 80, backlinks: 35, firstSeen: "Jan 2023", type: "Dofollow", status: "Active" },
  { domain: "smashingmagazine.com", dr: 81, backlinks: 19, firstSeen: "Oct 2023", type: "Nofollow", status: "Active" },
  { domain: "wikipedia.org", dr: 100, backlinks: 2, firstSeen: "Nov 2023", type: "Nofollow", status: "Active" },
];

const anchorDistribution = [
  { name: "Branded", value: 30, color: "#10b981" },
  { name: "Keyword", value: 18, color: "#8b5cf6" },
  { name: "Naked URL", value: 20, color: "#6b7280" },
  { name: "Generic", value: 15, color: "#f59e0b" },
  { name: "Partial Match", value: 17, color: "#3b82f6" },
];

const anchorTextData = [
  { anchor: "seo tools", count: 156, pct: 12, type: "Exact Match", target: "/, /tools" },
  { anchor: "SEO Expert", count: 104, pct: 8, type: "Branded", target: "/" },
  { anchor: "click here", count: 65, pct: 5, type: "Generic", target: "Various" },
  { anchor: "https://seoexpert.com", count: 52, pct: 4, type: "Naked URL", target: "/" },
  { anchor: "keyword research tool", count: 48, pct: 4, type: "Exact Match", target: "/tools/keyword" },
  { anchor: "site audit tool", count: 42, pct: 3, type: "Exact Match", target: "/tools/audit" },
  { anchor: "best seo tools 2024", count: 38, pct: 3, type: "Partial Match", target: "/blog/seo-tools" },
  { anchor: "learn seo", count: 35, pct: 3, type: "Generic", target: "/blog/seo-guide" },
  { anchor: "https://seoexpert.com/tools", count: 30, pct: 2, type: "Naked URL", target: "/tools" },
  { anchor: "SEO Expert review", count: 28, pct: 2, type: "Branded", target: "/blog/reviews" },
  { anchor: "free seo analysis", count: 25, pct: 2, type: "Partial Match", target: "/tools/analyzer" },
  { anchor: "comprehensive seo guide", count: 22, pct: 2, type: "Partial Match", target: "/blog/seo-guide" },
  { anchor: "seo platform", count: 20, pct: 2, type: "Keyword", target: "/, /about" },
  { anchor: "read more", count: 18, pct: 1, type: "Generic", target: "Various" },
  { anchor: "official website", count: 15, pct: 1, type: "Generic", target: "/" },
];

interface ToxicLink {
  id: number;
  sourceDomain: string;
  sourceUrl: string;
  spamScore: number;
  reason: string;
  recommendation: string;
}

const toxicLinks: ToxicLink[] = [
  { id: 1, sourceDomain: "spam-link-site.com", sourceUrl: "/articles/seo", spamScore: 87, reason: "Link farm", recommendation: "Disavow" },
  { id: 2, sourceDomain: "free-backlinks-now.xyz", sourceUrl: "/profile/seoexpert", spamScore: 92, reason: "Link scheme", recommendation: "Disavow" },
  { id: 3, sourceDomain: "adult-content-site.net", sourceUrl: "/review/seo-tools", spamScore: 78, reason: "Adult content", recommendation: "Disavow" },
  { id: 4, sourceDomain: "casino-gambling.com", sourceUrl: "/seo-tools-review", spamScore: 95, reason: "Gambling", recommendation: "Disavow" },
  { id: 5, sourceDomain: "cheap-pharmacy.biz", sourceUrl: "/health-seo", spamScore: 98, reason: "Pharma spam", recommendation: "Disavow" },
  { id: 6, sourceDomain: "seo-agency-spam.info", sourceUrl: "/clients/seoexpert", spamScore: 85, reason: "Site-wide spam", recommendation: "Disavow" },
  { id: 7, sourceDomain: "low-quality-dir.com", sourceUrl: "/business/seoexpert", spamScore: 72, reason: "Low-quality directory", recommendation: "Review" },
  { id: 8, sourceDomain: "blog-comment-spam.net", sourceUrl: "/blog/seo", spamScore: 80, reason: "Comment spam", recommendation: "Disavow" },
  { id: 9, sourceDomain: "foreign-language-site.ru", sourceUrl: "/tools/seo", spamScore: 75, reason: "Foreign language", recommendation: "Review" },
  { id: 10, sourceDomain: "expired-domain-301.com", sourceUrl: "/ (301 redirect)", spamScore: 88, reason: "Expired domain abuse", recommendation: "Disavow" },
  { id: 11, sourceDomain: "private-blog-network.com", sourceUrl: "/seo-tips", spamScore: 91, reason: "PBN detection", recommendation: "Disavow" },
  { id: 12, sourceDomain: "keyword-stuffed.com", sourceUrl: "/seo-tools-reviews", spamScore: 82, reason: "Keyword stuffing", recommendation: "Review" },
  { id: 13, sourceDomain: "auto-generated-content.com", sourceUrl: "/seo-expert", spamScore: 76, reason: "Auto-generated", recommendation: "Review" },
  { id: 14, sourceDomain: "scraped-content-site.com", sourceUrl: "/seo-guide-plagiarized", spamScore: 84, reason: "Scraped content", recommendation: "Disavow" },
];

// --- Helpers ---

function DRBar({ dr }: { dr: number }) {
  const color = dr >= 90 ? "bg-emerald-500" : dr >= 70 ? "bg-blue-500" : dr >= 50 ? "bg-amber-500" : "bg-gray-400";
  const textColor = dr >= 90 ? "text-emerald-600" : dr >= 70 ? "text-blue-600" : dr >= 50 ? "text-amber-600" : "text-gray-500";

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 rounded-full bg-muted w-16 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${dr}%` }} />
      </div>
      <span className={`text-xs font-bold w-7 ${textColor}`}>{dr}</span>
    </div>
  );
}

function LinkTypeBadge({ type }: { type: string }) {
  const config: Record<string, string> = {
    Dofollow: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
    Nofollow: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
    Sponsored: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    UGC: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
  };
  return (
    <Badge variant="outline" className={`text-xs font-medium ${config[type] || config.Dofollow}`}>
      {type}
    </Badge>
  );
}

function AnchorTypeBadge({ type }: { type: string }) {
  const config: Record<string, string> = {
    "Exact Match": "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
    Branded: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
    "Naked URL": "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
    Generic: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    "Partial Match": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
    Keyword: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-400 dark:border-violet-800",
  };
  return (
    <Badge variant="outline" className={`text-xs font-medium ${config[type] || config.Generic}`}>
      {type}
    </Badge>
  );
}

function SpamScoreBar({ score }: { score: number }) {
  const color = score > 80 ? "bg-red-500" : "bg-amber-500";
  const bgColor = score > 80 ? "bg-red-100 dark:bg-red-950" : "bg-amber-100 dark:bg-amber-950";
  const textColor = score > 80 ? "text-red-600" : "text-amber-600";

  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 rounded-full ${bgColor} w-20 overflow-hidden`}>
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold w-14 ${textColor}`}>{score}/100</span>
    </div>
  );
}

function RecBadge({ rec }: { rec: string }) {
  if (rec === "Disavow") {
    return (
      <Badge variant="outline" className="text-xs font-medium bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800">
        Disavow
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs font-medium bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800">
      Review
    </Badge>
  );
}

const PieCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number; name: string }) => {
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

// --- Main Component ---

export function BacklinkAnalysis() {
  const [disavowedLinks, setDisavowedLinks] = useState<Set<number>>(new Set());

  const handleDisavow = (id: number) => {
    setDisavowedLinks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDisavowAllHighRisk = () => {
    const highRiskIds = toxicLinks.filter((l) => l.recommendation === "Disavow" && !disavowedLinks.has(l.id)).map((l) => l.id);
    setDisavowedLinks((prev) => new Set([...prev, ...highRiskIds]));
  };

  const totalToxic = toxicLinks.length;
  const disavowedCount = disavowedLinks.size;
  const highRiskRemaining = toxicLinks.filter((l) => l.recommendation === "Disavow" && !disavowedLinks.has(l.id)).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Backlink Analysis</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor your backlink profile, analyze referring domains, and manage toxic links.
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-muted-foreground">Total Backlinks</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">12,847</span>
                  <span className="flex items-center text-xs font-medium text-emerald-600">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    +342
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">this month</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                <Link2 className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-muted-foreground">Referring Domains</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">2,341</span>
                  <span className="flex items-center text-xs font-medium text-emerald-600">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    +56
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">this month</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                <Globe className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-muted-foreground">Domain Rating</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">65</span>
                  <span className="flex items-center text-xs font-medium text-emerald-600">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    +2
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">this month</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-violet-50 dark:bg-violet-950 flex items-center justify-center">
                <Shield className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-red-200 dark:border-red-900/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-muted-foreground">Toxic Links</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-red-600">{totalToxic}</span>
                  <span className="text-xs text-red-500 font-medium">needs attention!</span>
                </div>
                <p className="text-xs text-muted-foreground">{disavowedCount} disavowed</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-950 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-1.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="referring-domains">
            <Globe className="h-4 w-4 mr-1.5" />
            Referring Domains
            <Badge variant="secondary" className="ml-1.5 text-xs">{allReferringDomains.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="anchor-text">
            <PieChartIcon className="h-4 w-4 mr-1.5" />
            Anchor Text
          </TabsTrigger>
          <TabsTrigger value="toxic-links">
            <ShieldAlert className="h-4 w-4 mr-1.5" />
            Toxic Links
            <Badge variant="secondary" className="ml-1.5 text-xs bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">{totalToxic}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1 — Overview */}
        <TabsContent value="overview">
          <div className="flex flex-col gap-6">
            {/* Backlink Growth */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Backlink Growth</CardTitle>
                    <CardDescription>Monthly backlink acquisition over the last 12 months</CardDescription>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      Total
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                      New
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={backlinkGrowthData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="linkGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => (v / 1000).toFixed(0) + "K"}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === "total") return [value.toLocaleString(), "Total"];
                          return [value.toLocaleString(), "New Links"];
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, fill: "#10b981" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="newLinks"
                        stroke="#6ee7b7"
                        strokeWidth={1.5}
                        dot={false}
                        strokeDasharray="4 4"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bottom Row: Link Type + Top Domains */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Link Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Link Type Distribution</CardTitle>
                  <CardDescription>Breakdown of link attribute types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={linkTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          label={PieCustomLabel}
                        >
                          {linkTypeData.map((entry, index) => (
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
                          formatter={(value: number) => [value.toLocaleString(), "Links"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-2">
                    {linkTypeData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="font-semibold">{item.pct}% ({item.value.toLocaleString()})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top 10 Referring Domains */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Top 10 Referring Domains</CardTitle>
                      <CardDescription>Highest authority domains linking to you</CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-xs">Top 10</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[340px] overflow-y-auto rounded-md border">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead>Domain</TableHead>
                          <TableHead className="w-[120px]">DR</TableHead>
                          <TableHead className="w-[100px] text-right">Backlinks</TableHead>
                          <TableHead className="w-[100px]">First Seen</TableHead>
                          <TableHead className="w-[100px]">Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topReferringDomains.map((d) => (
                          <TableRow key={d.domain} className="group hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-sm font-medium group-hover:text-emerald-600 transition-colors cursor-pointer">
                                  {d.domain}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <DRBar dr={d.dr} />
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-sm font-semibold">{d.backlinks}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground">{d.firstSeen}</span>
                            </TableCell>
                            <TableCell>
                              <LinkTypeBadge type={d.type} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2 — Referring Domains */}
        <TabsContent value="referring-domains">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Referring Domains</CardTitle>
                  <CardDescription>
                    All domains linking to your site, sorted by Domain Rating
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {allReferringDomains.length} domains
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[600px] overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead className="w-[120px]">DR</TableHead>
                      <TableHead className="w-[100px] text-right">Backlinks</TableHead>
                      <TableHead className="w-[100px]">First Seen</TableHead>
                      <TableHead className="w-[100px]">Link Type</TableHead>
                      <TableHead className="w-[90px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...allReferringDomains].sort((a, b) => b.dr - a.dr).map((d) => (
                      <TableRow key={d.domain} className="group hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline transition-colors">
                              {d.domain}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DRBar dr={d.dr} />
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-semibold">{d.backlinks}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">{d.firstSeen}</span>
                        </TableCell>
                        <TableCell>
                          <LinkTypeBadge type={d.type} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-medium bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
                            Active
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3 — Anchor Text */}
        <TabsContent value="anchor-text">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Anchor Distribution Pie */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribution by Type</CardTitle>
                <CardDescription>Anchor text category breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={anchorDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        label={PieCustomLabel}
                      >
                        {anchorDistribution.map((entry, index) => (
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
                        formatter={(value: number) => [`${value}%`, "Share"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {anchorDistribution.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-semibold">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Anchor Text Table + Health Assessment */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Anchor Text Analysis</CardTitle>
                    <CardDescription>All anchor texts used in backlinks to your site</CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {anchorTextData.length} anchors
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-[380px] overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Anchor Text</TableHead>
                        <TableHead className="w-[80px] text-right">Count</TableHead>
                        <TableHead className="w-[60px] text-right">%</TableHead>
                        <TableHead className="w-[110px]">Type</TableHead>
                        <TableHead className="w-[140px]">Target Pages</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {anchorTextData.map((item) => (
                        <TableRow key={item.anchor} className="group hover:bg-muted/50">
                          <TableCell>
                            <span className="text-sm font-medium truncate block max-w-[200px]">
                              &quot;{item.anchor}&quot;
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-semibold">{item.count}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs font-medium text-muted-foreground">{item.pct}%</span>
                          </TableCell>
                          <TableCell>
                            <AnchorTypeBadge type={item.type} />
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground truncate block max-w-[130px]">
                              {item.target}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Health Assessment */}
                <div className="mt-6 rounded-lg border p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    <h4 className="text-sm font-semibold text-foreground">Anchor Profile Health Assessment</h4>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Overall Anchor Diversity</span>
                      <span className="font-bold text-emerald-600">78/100</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: "78%" }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-emerald-600">Good:</span> Branded anchors are well-distributed across your backlink profile.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-amber-600">Warning:</span> 5% &quot;click here&quot; generic anchors should be diversified.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-blue-600">Action:</span> Add more branded + partial-match anchors for a healthier profile.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4 — Toxic Links */}
        <TabsContent value="toxic-links">
          <div className="flex flex-col gap-6">
            {/* Alert Card */}
            <Card className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                        Toxic Backlinks Detected
                      </h3>
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800 text-xs">
                        {totalToxic} found
                      </Badge>
                    </div>
                    <p className="text-sm text-red-700/80 dark:text-red-400/80">
                      These links may harm your search rankings. Review and consider disavowing harmful ones via Google Search Console.
                    </p>
                    <div className="flex items-center gap-3 mt-4">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleDisavowAllHighRisk}
                        disabled={highRiskRemaining === 0}
                      >
                        <Ban className="h-4 w-4 mr-1.5" />
                        Disavow All High Risk ({highRiskRemaining})
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Toxicity Score Explanation */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">How Toxicity Score is Calculated</p>
                    <p>
                      The spam score (0-100) evaluates each linking domain based on factors like link density,
                      domain age, content quality, penalty history, and link patterns. Scores above 80 indicate
                      high-risk links that should typically be disavowed. Scores between 60-80 require manual review.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Toxic Links Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Toxic Links Report</CardTitle>
                    <CardDescription>
                      Detailed list of potentially harmful backlinks
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      disavowedCount === totalToxic
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                        : "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
                    }`}
                  >
                    {disavowedCount}/{totalToxic} disavowed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-[500px] overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Source Domain</TableHead>
                        <TableHead className="w-[140px]">Source URL</TableHead>
                        <TableHead className="w-[140px]">Spam Score</TableHead>
                        <TableHead className="w-[150px]">Reason</TableHead>
                        <TableHead className="w-[100px]">Recommendation</TableHead>
                        <TableHead className="w-[110px] text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {toxicLinks.map((link) => {
                        const isDisavowed = disavowedLinks.has(link.id);
                        return (
                          <TableRow
                            key={link.id}
                            className={`group ${isDisavowed ? "opacity-50" : "hover:bg-muted/50"}`}
                          >
                            <TableCell>
                              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                {link.sourceDomain}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground font-mono truncate block max-w-[130px]">
                                {link.sourceUrl}
                              </span>
                            </TableCell>
                            <TableCell>
                              <SpamScoreBar score={link.spamScore} />
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground">{link.reason}</span>
                            </TableCell>
                            <TableCell>
                              <RecBadge rec={link.recommendation} />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant={isDisavowed ? "outline" : "destructive"}
                                size="sm"
                                className={`text-xs h-7 ${isDisavowed ? "border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-400" : ""}`}
                                onClick={() => handleDisavow(link.id)}
                              >
                                {isDisavowed ? (
                                  <><Check className="h-3 w-3 mr-1" /> Disavowed ✓</>
                                ) : (
                                  <><Ban className="h-3 w-3 mr-1" /> Disavow</>
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
