"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sparkles,
  Loader2,
  Copy,
  Download,
  FileText,
  Type,
  Hash,
  Clock,
  Target,
  CheckCircle2,
  AlertTriangle,
  PenLine,
  Eye,
  Heading1,
  Heading2,
  Settings2,
  BookOpen,
  Users,
  MessageSquare,
  Zap,
  RefreshCw,
  ArrowRight,
  Wand2,
  FileDown,
  BarChart3,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  generateSeoContent,
  rewriteContent,
  generateMetaTags,
  isPuterAvailable,
} from "@/lib/puter-ai";
import { analyzeSeo, countWords, stripHtml } from "@/lib/seo-scorer";
import type { SeoScoreResult } from "@/lib/seo-scorer";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface GeneratedArticle {
  title: string;
  metaDescription: string;
  content: string;
  headings: string[];
  keywords: string[];
}

interface DemoSection {
  h2: string;
  paragraphs: string[];
  h3s?: { heading: string; text: string }[];
}

// ─── Demo Content ──────────────────────────────────────────────────────────────

const demoTitle = "Best SEO Tools for 2024: The Ultimate Comparison Guide";
const demoMeta =
  "Discover the top SEO tools for 2024 ranked by features, pricing, and accuracy. Compare Semrush, Ahrefs, Moz, and more to find the perfect SEO toolkit for your business needs.";

const demoSections: DemoSection[] = [
  {
    h2: "Why Choosing the Right SEO Tool Matters in 2024",
    paragraphs: [
      "Search engine optimization continues to evolve rapidly, and having the right tools in your arsenal can make the difference between ranking on page one and getting lost in the noise. In 2024, SEO tools have become more sophisticated than ever, incorporating AI-powered features, real-time data analysis, and predictive analytics that were unimaginable just a few years ago. Whether you're a solo content creator, a growing agency, or an enterprise-level marketing team, selecting the right SEO platform is one of the most impactful decisions you'll make for your digital strategy.",
      "The modern SEO landscape demands comprehensive toolkits that go beyond simple keyword tracking. Today's leading platforms offer end-to-end solutions covering technical audits, content optimization, backlink analysis, competitor intelligence, and rank monitoring — all unified under a single dashboard. This guide breaks down the best SEO tools available in 2024, helping you make an informed decision based on your specific needs, budget, and growth objectives.",
    ],
  },
  {
    h2: "Top Picks: Our Recommended SEO Tools",
    paragraphs: [
      "After months of rigorous testing across over 50 SEO platforms, we've narrowed our recommendations to the tools that consistently deliver outstanding results. Each tool was evaluated on data accuracy, feature depth, user experience, pricing transparency, and customer support quality. Here are our top picks that stand out from the competition.",
    ],
    h3s: [
      {
        heading: "Semrush — Best All-in-One SEO Platform",
        text: "Semrush continues to dominate the SEO tool market with its unmatched database of over 25 billion keywords and 808 million domains. Its recently enhanced AI writing assistant, ContentShake AI, integrates directly with your content workflow, providing real-time SEO suggestions as you write. The platform's competitive intelligence features remain industry-leading, offering deep insights into any competitor's organic and paid search strategies.",
      },
      {
        heading: "Ahrefs — Best for Backlink Analysis",
        text: "Ahrefs maintains the most active web crawler in the industry, processing over 12 billion pages daily. This massive index powers its industry-leading backlink analysis capabilities, making it the go-to tool for link building campaigns. Their recently launched AI Content Helper provides intelligent content grading and topic suggestion features that help create search-optimized articles efficiently.",
      },
      {
        heading: "Moz Pro — Best for Beginners and Local SEO",
        text: "Moz Pro offers the most intuitive interface in the SEO tool space, making it ideal for teams new to search optimization. Their proprietary Domain Authority metric remains one of the most widely referenced authority scores in the industry. Moz's local SEO features are particularly strong, with excellent listing management, citation tracking, and local rank monitoring capabilities that help businesses dominate local search results.",
      },
    ],
  },
  {
    h2: "Key Features to Look For in an SEO Tool",
    paragraphs: [
      "When evaluating SEO tools for your workflow, certain features are non-negotiable in 2024. A comprehensive keyword research module with accurate search volume data and keyword difficulty scoring forms the foundation of any good platform. Look for tools that offer SERP feature analysis, showing which types of rich results appear for your target keywords. Technical SEO auditing capabilities should include comprehensive site crawl analysis, Core Web Vitals monitoring, and structured data validation.",
      "Content optimization features have become increasingly important, with AI-powered content scoring and natural language processing (NLP) recommendations now standard in premium tools. Rank tracking should offer daily updates across multiple devices and locations. Finally, robust reporting and dashboard customization options ensure you can present SEO performance data to stakeholders in clear, actionable formats.",
    ],
  },
  {
    h2: "Pricing and Value Comparison",
    paragraphs: [
      "SEO tool pricing varies dramatically, from free tiers with limited functionality to enterprise plans costing thousands per month. Semrush offers plans starting at $129.95/month for the Pro tier, which includes 5 projects and 500 keywords to track. Ahrefs begins at $99/month with access to their full feature set for a single user. Moz Pro starts at $99/month and includes their renowned Domain Authority metrics.",
      "For small businesses and freelancers, Ubersuggest offers excellent value at $29/month, while SERanking provides a solid all-in-one solution from $55/month. Enterprise users should consider Semrush's Business plan or Ahrefs's Advanced tier, both of which offer increased data limits, API access, and dedicated account management. Always take advantage of free trials before committing to ensure the tool aligns with your workflow.",
    ],
  },
];

// ─── Content Types ─────────────────────────────────────────────────────────────

const contentTypes = [
  { value: "blog-post", label: "Blog Post", icon: FileText },
  { value: "article", label: "Article", icon: BookOpen },
  { value: "product-description", label: "Product Desc", icon: Zap },
  { value: "landing-page", label: "Landing Page", icon: Target },
  { value: "meta-description", label: "Meta Description", icon: Eye },
  { value: "title-tag", label: "Title Tag", icon: Type },
];

const tones = ["Professional", "Casual", "Academic", "Conversational"];
const lengths = [
  { value: "short", label: "Short", words: "500w" },
  { value: "medium", label: "Medium", words: "1,000w" },
  { value: "long", label: "Long", words: "2,000w" },
];

const quickTemplates = [
  { name: "Product Description", topic: "Write a compelling product description for [product name]. Highlight key features, benefits, and unique selling points. Target audience: [audience]. Include calls to action." },
  { name: "FAQ Section", topic: "Create a comprehensive FAQ section about [topic]. Include 8-10 common questions with detailed, helpful answers. Address common pain points and objections." },
  { name: "Introduction Paragraph", topic: "Write an engaging introduction paragraph for an article about [topic]. Hook the reader, establish authority, and preview what the article covers." },
  { name: "Conclusion Paragraph", topic: "Write a strong conclusion paragraph for an article about [topic]. Summarize key points, reinforce the main message, and include a clear call to action." },
  { name: "Listicle Item", topic: "Write a detailed listicle item about [topic/item]. Include a catchy subtitle, key facts, statistics, and actionable tips in a structured format." },
];

// ─── Fallback Generator ────────────────────────────────────────────────────────

function generateFallbackContent(
  type: string,
  topic: string,
  tone: string,
  length: string
): GeneratedArticle {
  const toneAdj = tone.toLowerCase();
  const targetWords =
    length === "short" ? 500 : length === "long" ? 2000 : 1000;

  const title = `${topic}: The Complete ${new Date().getFullYear()} Guide`;
  const metaDescription = `Discover everything about ${topic.toLowerCase()} in this comprehensive guide. Expert insights, practical tips, and actionable strategies to help you succeed with ${topic.toLowerCase()} today.`;

  const h2s = [
    `Understanding ${topic}`,
    `Key Benefits of ${topic}`,
    `Best Practices for ${topic}`,
    `How to Get Started with ${topic}`,
  ];

  const paragraphs = [
    `${topic} has become an essential element in today's digital landscape. Whether you're a seasoned professional or just getting started, understanding the fundamentals of ${topic.toLowerCase()} can significantly impact your success. In this ${toneAdj} guide, we'll explore the core concepts, proven strategies, and practical tips that will help you master ${topic.toLowerCase()} and achieve your goals effectively.`,
    `The importance of ${topic.toLowerCase()} cannot be overstated in today's competitive environment. Organizations that prioritize ${topic.toLowerCase()} consistently outperform their peers, seeing measurable improvements in key performance indicators. According to recent industry research, companies that invest strategically in ${topic.toLowerCase()} experience up to 3x higher engagement rates and significantly better outcomes compared to those that don't.`,
    `When approaching ${topic.toLowerCase()}, it's crucial to start with a clear strategy. Begin by defining your specific objectives and identifying the metrics that matter most to your organization. This ${toneAdj} approach ensures that every effort is aligned with your broader goals and delivers tangible results. Consider conducting a thorough assessment of your current position to identify gaps and opportunities for improvement.`,
    `Best practices for ${topic.toLowerCase()} evolve continuously, and staying current with the latest trends and techniques is vital. Some proven strategies include setting measurable goals, maintaining consistent execution, leveraging data-driven insights, and fostering collaboration across teams. By implementing these approaches, you can build a sustainable and effective ${topic.toLowerCase()} practice that drives long-term success.`,
    `Getting started with ${topic.toLowerCase()} doesn't have to be overwhelming. Begin with the fundamentals: understand your audience, define clear objectives, and establish a realistic timeline. Start small, measure your results, and iterate based on what you learn. The most successful practitioners of ${topic.toLowerCase()} are those who combine strategic thinking with consistent, focused execution and a willingness to adapt.`,
  ];

  // Adjust paragraphs based on length
  const selectedParagraphs =
    length === "short"
      ? paragraphs.slice(0, 3)
      : length === "long"
        ? [...paragraphs, ...paragraphs.slice(0, 2).map((p) => p.replace(/\bSEO\b/g, topic))]
        : paragraphs;

  // Build markdown content
  let content = `## Understanding ${topic}\n\n${selectedParagraphs[0]}\n\n`;
  content += `## Key Benefits of ${topic}\n\n${selectedParagraphs[1]}\n\n`;
  content += `## Best Practices for ${topic}\n\n${selectedParagraphs[2]}\n\n`;
  content += `### Common Mistakes to Avoid\n\nMany teams encounter common pitfalls when implementing ${topic.toLowerCase()}. These include setting unrealistic expectations, neglecting proper measurement, and failing to adapt to changing conditions. By being aware of these challenges and planning accordingly, you can avoid costly mistakes and accelerate your progress significantly.\n\n`;
  content += `## How to Get Started with ${topic}\n\n${selectedParagraphs[3]}\n\n${selectedParagraphs[4] || ""}`;

  const headings = [title, ...h2s, "Common Mistakes to Avoid"];

  const keywords = [
    topic.toLowerCase(),
    `${topic.toLowerCase()} guide`,
    `${topic.toLowerCase()} best practices`,
    `${topic.toLowerCase()} tips`,
    `${topic.toLowerCase()} strategy`,
    `${topic.toLowerCase()} ${new Date().getFullYear()}`,
  ];

  return {
    title,
    metaDescription,
    content,
    headings,
    keywords,
  };
}

// ─── Helper: Render markdown to structured elements ───────────────────────────

function MarkdownToHtml({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={key++}
          className="text-base font-semibold text-foreground mt-6 mb-2 ml-4 pl-4 border-l-2 border-emerald-300 dark:border-emerald-700"
        >
          {line.replace("### ", "")}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={key++}
          className="text-lg font-semibold text-foreground mt-6 mb-2 flex items-center gap-2"
        >
          <Heading2 className="h-4 w-4 text-emerald-600 shrink-0" />
          {line.replace("## ", "")}
        </h2>
      );
    } else if (line.startsWith("- ")) {
      const items: string[] = [];
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith("- ")) {
        items.push(lines[j].trim().replace("- ", ""));
        j++;
      }
      elements.push(
        <ul key={key++} className="list-disc list-inside space-y-1 my-2 ml-4">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm text-muted-foreground leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      );
      i = j - 1;
    } else if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      let j = i;
      while (j < lines.length && /^\d+\.\s/.test(lines[j].trim())) {
        items.push(lines[j].trim().replace(/^\d+\.\s/, ""));
        j++;
      }
      elements.push(
        <ol key={key++} className="list-decimal list-inside space-y-1 my-2 ml-4">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm text-muted-foreground leading-relaxed">
              {item}
            </li>
          ))}
        </ol>
      );
      i = j - 1;
    } else {
      // Bold text processing
      const processed = line.replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="font-semibold text-foreground">$1</strong>'
      );
      elements.push(
        <p
          key={key++}
          className="text-sm text-muted-foreground leading-relaxed my-2"
          dangerouslySetInnerHTML={{ __html: processed }}
        />
      );
    }
  }

  return <>{elements}</>;
}

// ─── Helper: SEO Score Badge ───────────────────────────────────────────────────

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getScoreBg(score: number) {
  if (score >= 80)
    return "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800/50";
  if (score >= 50)
    return "bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800/50";
  return "bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800/50";
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 50) return "Fair";
  return "Needs Work";
}

function getScoreLabelBg(score: number) {
  if (score >= 80) return "bg-emerald-600";
  if (score >= 50) return "bg-amber-600";
  return "bg-red-600";
}

function getProgressBg(score: number) {
  if (score >= 80) return "[&>div]:bg-emerald-500";
  if (score >= 50) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-red-500";
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function AIWriter() {
  // Configuration state
  const [contentType, setContentType] = useState("blog-post");
  const [topic, setTopic] = useState("Best SEO Tools for 2024");
  const [targetKeyword, setTargetKeyword] = useState("seo tools");
  const [tone, setTone] = useState("Professional");
  const [length, setLength] = useState("medium");
  const [targetAudience, setTargetAudience] = useState("marketers");
  const [includeMeta, setIncludeMeta] = useState(true);
  const [includeHeadings, setIncludeHeadings] = useState(true);
  const [autoSeo, setAutoSeo] = useState(true);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [puterReady, setPuterReady] = useState(false);

  // Content state
  const [article, setArticle] = useState<GeneratedArticle>({
    title: demoTitle,
    metaDescription: demoMeta,
    content: demoSections
      .map((s) => {
        let md = `\n## ${s.h2}\n\n`;
        md += s.paragraphs.join("\n\n") + "\n";
        if (s.h3s) {
          s.h3s.forEach((h3) => {
            md += `\n### ${h3.heading}\n\n${h3.text}\n`;
          });
        }
        return md;
      })
      .join(""),
    headings: [
      demoTitle,
      ...demoSections.map((s) => s.h2),
      ...(demoSections
        .flatMap((s) => s.h3s?.map((h) => h.heading) || [])
        .filter(Boolean) as string[]),
    ],
    keywords: [
      "seo tools",
      "best seo tools 2024",
      "seo software comparison",
      "semrush vs ahrefs",
      "seo audit tools",
    ],
  });

  // Power tools state
  const [rewriteMode, setRewriteMode] = useState("expand");
  const [rewriteInput, setRewriteInput] = useState("");
  const [rewriteOutput, setRewriteOutput] = useState("");
  const [isRewriting, setIsRewriting] = useState(false);

  const [metaInput, setMetaInput] = useState("");
  const [metaOutput, setMetaOutput] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [isMetaGenerating, setIsMetaGenerating] = useState(false);

  const [powerTab, setPowerTab] = useState("rewrite");

  // UI state
  const [copied, setCopied] = useState<string | null>(null);
  const [metaExpanded, setMetaExpanded] = useState(true);
  const [hasGenerated, setHasGenerated] = useState(true); // starts with demo

  // Check Puter.js availability
  useEffect(() => {
    setPuterReady(isPuterAvailable());
    const interval = setInterval(() => {
      setPuterReady(isPuterAvailable());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // SEO scoring
  const seoResult = useMemo<SeoScoreResult>(() => {
    const plainContent = stripHtml(article.content);
    const allHeadings = article.headings.length > 0 ? article.headings : [article.title];
    return analyzeSeo({
      content: plainContent,
      keyword: targetKeyword || "seo tools",
      title: article.title,
      metaDescription: article.metaDescription,
      urlSlug: `/blog/${targetKeyword?.toLowerCase().replace(/\s+/g, "-") || "article"}`,
      headings: allHeadings,
    });
  }, [article, targetKeyword]);

  const wordCount = useMemo(() => countWords(stripHtml(article.content)), [article]);
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // ── Generate Handler ──
  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic or keywords");
      return;
    }

    setIsGenerating(true);

    try {
      const audienceMap: Record<string, string> = {
        marketers: "digital marketers and SEO professionals",
        developers: "software developers and engineers",
        "business-owners": "small business owners and entrepreneurs",
        beginners: "SEO beginners and newcomers",
        enterprise: "enterprise marketing teams",
      };

      const constructedPrompt = `Write a ${contentType.replace(/-/g, " ")} about: ${topic}
Target keyword: ${targetKeyword || topic}
Tone: ${tone}
Length: ${length === "short" ? "500 words" : length === "long" ? "2000 words" : "1000 words"}
Target audience: ${audienceMap[targetAudience] || "general audience"}
${includeMeta ? "Include an SEO-optimized meta description." : ""}
${includeHeadings ? "Use proper heading hierarchy (H1, H2, H3)." : ""}
${autoSeo ? "Optimize for SEO with natural keyword placement." : ""}`;

      // Try Puter.js first
      if (puterReady) {
        const result = await generateSeoContent({
          prompt: constructedPrompt,
          temperature: 0.7,
        });

        if (result) {
          setArticle({
            title: result.title,
            metaDescription: result.metaDescription,
            content: result.content,
            headings: result.headings,
            keywords: result.keywords,
          });
          setHasGenerated(true);
          toast.success("Content generated with Puter.js AI!");
          setIsGenerating(false);
          return;
        }
      }

      // Fallback generator
      await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));
      const fallback = generateFallbackContent(contentType, topic, tone, length);
      setArticle(fallback);
      setHasGenerated(true);

      if (!puterReady) {
        toast.info("Content generated with built-in engine (Puter.js unavailable)");
      } else {
        toast.info("Content generated with built-in engine (AI fallback)");
      }
    } catch {
      toast.error("Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [topic, targetKeyword, tone, length, contentType, targetAudience, includeMeta, includeHeadings, autoSeo, puterReady]);

  // ── Copy Handler ──
  const handleCopy = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }, []);

  // ── Export Handler ──
  const handleExport = useCallback(() => {
    const fullText = `${article.title}\n\n${article.metaDescription ? `Meta: ${article.metaDescription}\n\n` : ""}${article.content}`;
    const blob = new Blob([fullText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seo-content-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Content exported as TXT file");
  }, [article]);

  // ── Rewrite Handler ──
  const handleRewrite = useCallback(async () => {
    if (!rewriteInput.trim()) {
      toast.error("Please enter content to rewrite");
      return;
    }
    setIsRewriting(true);
    setRewriteOutput("");

    try {
      if (puterReady) {
        const mode = rewriteMode === "expand" ? "expand" : rewriteMode === "summarize" ? "summarize" : "rewrite";
        const toneStr = tone.toLowerCase();
        const result = await rewriteContent(rewriteInput, mode, toneStr);

        if (result) {
          setRewriteOutput(result);
          toast.success("Content rewritten with AI!");
          setIsRewriting(false);
          return;
        }
      }

      // Fallback rewrite
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 800));
      if (rewriteMode === "summarize") {
        const sentences = rewriteInput.match(/[^.!?]*[.!?]+/g) || [rewriteInput];
        const half = Math.ceil(sentences.length / 2);
        setRewriteOutput(sentences.slice(0, half).join("").trim());
      } else if (rewriteMode === "expand") {
        setRewriteOutput(
          `${rewriteInput}\n\nAdditionally, this point is worth exploring in greater detail. The implications extend beyond the immediate context, affecting broader strategic considerations that professionals should carefully evaluate. Industry experts consistently emphasize the importance of taking a comprehensive approach, as the interconnected nature of these factors means that addressing them holistically yields significantly better outcomes than piecemeal solutions.`
        );
      } else {
        // Rewrite - simple word shuffling for demo
        setRewriteOutput(
          rewriteInput
            .replace(/\bimportant\b/gi, "crucial")
            .replace(/\bgood\b/gi, "excellent")
            .replace(/\bbest\b/gi, "top-tier")
            .replace(/\bmany\b/gi, "numerous")
        );
      }
      toast.info("Content processed with built-in engine");
    } catch {
      toast.error("Failed to process content");
    } finally {
      setIsRewriting(false);
    }
  }, [rewriteInput, rewriteMode, puterReady, tone]);

  // ── Apply Rewrite to Editor ──
  const handleApplyRewrite = useCallback(() => {
    if (!rewriteOutput.trim()) return;
    setArticle((prev) => ({
      ...prev,
      content: prev.content + "\n\n" + rewriteOutput,
    }));
    toast.success("Rewritten content applied to editor");
  }, [rewriteOutput]);

  // ── Meta Generator Handler ──
  const handleMetaGenerate = useCallback(async () => {
    if (!metaInput.trim()) {
      toast.error("Please enter content to generate meta tags from");
      return;
    }
    setIsMetaGenerating(true);
    setMetaOutput(null);

    try {
      if (puterReady) {
        const result = await generateMetaTags(
          article.title || "Untitled",
          metaInput,
          targetKeyword || topic
        );
        if (result) {
          setMetaOutput(result);
          toast.success("Meta tags generated with AI!");
          setIsMetaGenerating(false);
          return;
        }
      }

      // Fallback meta generation
      await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 600));
      const words = metaInput.split(/\s+/).slice(0, 8).join(" ");
      setMetaOutput({
        title: `${topic} — Expert Guide ${new Date().getFullYear()}`.substring(0, 60),
        description: `Discover expert insights about ${words.toLowerCase()}. Comprehensive guide with actionable tips, proven strategies, and best practices to help you succeed.`,
      });
      toast.info("Meta tags generated with built-in engine");
    } catch {
      toast.error("Failed to generate meta tags");
    } finally {
      setIsMetaGenerating(false);
    }
  }, [metaInput, puterReady, article.title, targetKeyword, topic]);

  // ── Quick Template Handler ──
  const handleQuickTemplate = useCallback(
    (templateTopic: string) => {
      setTopic(templateTopic);
      toast.success("Template loaded! Click Generate to create content.");
    },
    []
  );

  // ── Regenerate Handler ──
  const handleRegenerate = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  // ── Analyze SEO Handler ──
  const handleAnalyzeSeo = useCallback(() => {
    toast.success(
      `SEO Analysis Complete — Score: ${seoResult.score}/100 (${getScoreLabel(seoResult.score)})`
    );
  }, [seoResult.score]);

  // ── Title/Meta char helpers ──
  const titleChars = article.title.length;
  const metaChars = article.metaDescription.length;

  const titleColor =
    titleChars >= 50 && titleChars <= 60
      ? "text-emerald-600 dark:text-emerald-400"
      : titleChars > 60
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground";

  const metaColor =
    metaChars >= 150 && metaChars <= 160
      ? "text-emerald-600 dark:text-emerald-400"
      : metaChars > 160
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground";

  // ── Render ──
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            AI Content Writer
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Generate SEO-optimized content with AI-powered writing assistance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {puterReady ? (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800 text-sm font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5 inline-block" />
              Puter.js AI Ready
            </Badge>
          ) : (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800 text-sm font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-500 mr-1.5 inline-block" />
              Using Built-in Generator
            </Badge>
          )}
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800 text-sm font-medium">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            AI-Powered
          </Badge>
        </div>
      </div>

      {/* Three-section layout */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Section 1: Left Sidebar — Configuration Panel */}
        <div className="w-full xl:w-[360px] shrink-0">
          <Card className="sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-emerald-600" />
                Content Settings
              </CardTitle>
              <CardDescription>Configure your content generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Content Type Selector — Button Group */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Content Type</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {contentTypes.map((ct) => (
                    <Button
                      key={ct.value}
                      variant={contentType === ct.value ? "default" : "outline"}
                      size="sm"
                      className={`h-9 text-xs justify-start gap-1.5 ${contentType === ct.value ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                      onClick={() => setContentType(ct.value)}
                    >
                      <ct.icon className="h-3.5 w-3.5" />
                      {ct.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Topic & Keywords */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Topic / Keywords</Label>
                <Textarea
                  placeholder="e.g., Best SEO tools for enterprise businesses..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="min-h-[90px] resize-none"
                />
              </div>

              {/* Target Keyword */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Target Keyword</Label>
                <Input
                  placeholder="Enter primary keyword"
                  value={targetKeyword}
                  onChange={(e) => setTargetKeyword(e.target.value)}
                />
              </div>

              <Separator />

              {/* Tone Selector — Toggle Buttons */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tone</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {tones.map((t) => (
                    <Button
                      key={t}
                      variant={tone === t ? "default" : "outline"}
                      size="sm"
                      className={`h-8 text-xs ${tone === t ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                      onClick={() => setTone(t)}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Length Selector */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Content Length</Label>
                <div className="flex gap-1.5">
                  {lengths.map((l) => (
                    <Button
                      key={l.value}
                      variant={length === l.value ? "default" : "outline"}
                      size="sm"
                      className={`flex-1 h-8 text-xs ${length === l.value ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                      onClick={() => setLength(l.value)}
                    >
                      {l.label} ({l.words})
                    </Button>
                  ))}
                </div>
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Target Audience</Label>
                <Select value={targetAudience} onValueChange={setTargetAudience}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketers">Digital Marketers</SelectItem>
                    <SelectItem value="developers">Developers</SelectItem>
                    <SelectItem value="business-owners">Business Owners</SelectItem>
                    <SelectItem value="beginners">SEO Beginners</SelectItem>
                    <SelectItem value="enterprise">Enterprise Teams</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="include-meta"
                    checked={includeMeta}
                    onCheckedChange={(v) => setIncludeMeta(v as boolean)}
                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                  />
                  <Label htmlFor="include-meta" className="text-sm font-normal cursor-pointer">
                    Include meta description
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="include-headings"
                    checked={includeHeadings}
                    onCheckedChange={(v) => setIncludeHeadings(v as boolean)}
                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                  />
                  <Label htmlFor="include-headings" className="text-sm font-normal cursor-pointer">
                    Include headings structure
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="auto-seo"
                    checked={autoSeo}
                    onCheckedChange={(v) => setAutoSeo(v as boolean)}
                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                  />
                  <Label htmlFor="auto-seo" className="text-sm font-normal cursor-pointer">
                    Auto-SEO optimize
                  </Label>
                </div>
              </div>

              {/* Puter.js Status */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                <span className={`h-2.5 w-2.5 rounded-full ${puterReady ? "bg-emerald-500" : "bg-amber-500"}`} />
                <span className="text-xs text-muted-foreground">
                  {puterReady ? "Puter.js AI Ready" : "Using Built-in Generator"}
                </span>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 font-medium"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating with AI...
                  </>
                ) : puterReady ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate with AI
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate (Fallback Mode)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Section 2 & 3: Main Content + Bottom Panel */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Section 2: Main Content Display */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Generated Content</CardTitle>
                  <CardDescription>Preview and manage your AI-generated content</CardDescription>
                </div>
                {hasGenerated && !isGenerating && (
                  <div className="flex items-center gap-1.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleCopy(
                                `${article.title}\n\n${article.metaDescription}\n\n${article.content}`,
                                "all"
                              )
                            }
                          >
                            {copied === "all" ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            <span className="ml-1.5">Copy All</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy all content to clipboard</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={handleExport}>
                            <FileDown className="h-3.5 w-3.5" />
                            <span className="ml-1.5">Export TXT</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Export content as text file</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={handleAnalyzeSeo}>
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span className="ml-1.5">Analyze</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Run full SEO analysis</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={handleRegenerate}>
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span className="ml-1.5">Regenerate</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Regenerate content with same settings</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-emerald-200 dark:border-emerald-900" />
                    <Loader2 className="h-16 w-16 text-emerald-600 animate-spin absolute top-0 left-0" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">Generating your content...</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      AI is crafting SEO-optimized content
                    </p>
                  </div>
                </div>
              ) : hasGenerated ? (
                <ScrollArea className="max-h-[700px]">
                  <div className="space-y-5 pr-3">
                    {/* SEO Score Bar */}
                    <div className={`flex items-center gap-4 p-4 rounded-lg border ${getScoreBg(seoResult.score)}`}>
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${seoResult.score >= 80 ? "bg-emerald-100 dark:bg-emerald-900" : seoResult.score >= 50 ? "bg-amber-100 dark:bg-amber-900" : "bg-red-100 dark:bg-red-900"}`}>
                        <Target className={`h-5 w-5 ${getScoreColor(seoResult.score)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-sm font-semibold ${getScoreColor(seoResult.score)}`}>
                            SEO Score: {seoResult.score}/100
                          </span>
                          <Badge className={`${getScoreLabelBg(seoResult.score)} text-white text-xs`}>
                            {getScoreLabel(seoResult.score)}
                          </Badge>
                        </div>
                        <Progress
                          value={seoResult.score}
                          className={`h-2 ${getProgressBg(seoResult.score)}`}
                        />
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="secondary" className="text-xs font-normal gap-1.5">
                        <Hash className="h-3 w-3" />
                        {wordCount.toLocaleString()} words
                      </Badge>
                      <Badge variant="secondary" className="text-xs font-normal gap-1.5">
                        <Clock className="h-3 w-3" />
                        {readingTime} min read
                      </Badge>
                      <Badge variant="secondary" className="text-xs font-normal gap-1.5">
                        <BookOpen className="h-3 w-3" />
                        Flesch: {seoResult.readability.fleschScore}
                      </Badge>
                      <Badge variant="secondary" className="text-xs font-normal gap-1.5">
                        <Heading2 className="h-3 w-3" />
                        {article.headings.length} headings
                      </Badge>
                    </div>

                    {/* SEO Meta Tags (collapsible) */}
                    <div className="rounded-lg border border-border/50 overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors"
                        onClick={() => setMetaExpanded(!metaExpanded)}
                      >
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                          <Eye className="h-3.5 w-3.5 text-emerald-600" />
                          SEO Meta Tags
                        </span>
                        {metaExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>

                      {metaExpanded && (
                        <div className="px-3.5 pb-3.5 space-y-3">
                          {/* Generated Title */}
                          <div className="p-3 rounded-md bg-muted/30 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Heading1 className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  Title Tag
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-medium ${titleColor}`}>
                                  {titleChars}/60
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleCopy(article.title, "title")}
                                >
                                  {copied === "title" ? (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-foreground">{article.title}</p>
                            <div className="flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${titleChars >= 50 && titleChars <= 60 ? "bg-emerald-500" : titleChars > 60 ? "bg-amber-500" : "bg-red-500"}`} />
                              <span className="text-xs text-muted-foreground">
                                {titleChars >= 50 && titleChars <= 60
                                  ? "Optimal title length"
                                  : titleChars > 60
                                    ? "Title may be truncated in search results"
                                    : "Title is too short for optimal SEO"}
                              </span>
                            </div>
                          </div>

                          {/* Generated Meta Description */}
                          <div className="p-3 rounded-md bg-muted/30 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Eye className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  Meta Description
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-medium ${metaColor}`}>
                                  {metaChars}/160
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleCopy(article.metaDescription, "meta")}
                                >
                                  {copied === "meta" ? (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {article.metaDescription}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${metaChars >= 150 && metaChars <= 160 ? "bg-emerald-500" : metaChars > 160 ? "bg-amber-500" : "bg-red-500"}`} />
                              <span className="text-xs text-muted-foreground">
                                {metaChars >= 150 && metaChars <= 160
                                  ? "Optimal description length"
                                  : metaChars > 160
                                    ? "Description may be truncated in search results"
                                    : "Description is too short for optimal SEO"}
                              </span>
                            </div>
                          </div>

                          {/* Keywords */}
                          {article.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {article.keywords.map((kw, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs font-normal">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Article Content */}
                    <div className="space-y-1">
                      {/* H1 */}
                      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Heading1 className="h-6 w-6 text-emerald-600 shrink-0" />
                        {article.title}
                      </h1>

                      {/* Body */}
                      <MarkdownToHtml markdown={article.content} />
                    </div>

                    {/* Bottom Stats */}
                    <Separator />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Type className="h-3.5 w-3.5" />
                          {wordCount.toLocaleString()} words
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {readingTime} min read
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Target className="h-3.5 w-3.5" />
                          SEO: {seoResult.score}/100
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleCopy(
                              `${article.title}\n\n${article.metaDescription}\n\n${article.content}`,
                              "all-bottom"
                            )
                          }
                        >
                          {copied === "all-bottom" ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mr-1" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExport}>
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <PenLine className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">No content generated yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Configure your settings and click Generate to create SEO content
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 3: Bottom Panel — AI Power Tools */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-600" />
                AI Power Tools
              </CardTitle>
              <CardDescription>
                Rewrite, summarize, generate meta tags, and more
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={powerTab} onValueChange={setPowerTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="rewrite" className="text-xs gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Rewrite
                  </TabsTrigger>
                  <TabsTrigger value="meta" className="text-xs gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    Meta Generator
                  </TabsTrigger>
                  <TabsTrigger value="quick" className="text-xs gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Quick Generate
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Rewrite */}
                <TabsContent value="rewrite" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Rewrite Mode</Label>
                        <Select value={rewriteMode} onValueChange={setRewriteMode}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="expand">Expand Content</SelectItem>
                            <SelectItem value="summarize">Summarize</SelectItem>
                            <SelectItem value="rewrite-professional">
                              Rewrite (Professional)
                            </SelectItem>
                            <SelectItem value="rewrite-casual">
                              Rewrite (Casual)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Content to Rewrite</Label>
                        <Textarea
                          placeholder="Paste content you want to rewrite here..."
                          value={rewriteInput}
                          onChange={(e) => setRewriteInput(e.target.value)}
                          className="min-h-[160px] resize-none text-sm"
                        />
                      </div>
                      <Button
                        onClick={handleRewrite}
                        disabled={isRewriting || !rewriteInput.trim()}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-9"
                      >
                        {isRewriting ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-3.5 w-3.5 mr-2" />
                            Process Content
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Result</Label>
                      <div className="min-h-[220px] rounded-lg border border-border/50 bg-muted/20 p-3 overflow-y-auto max-h-[260px]">
                        {rewriteOutput ? (
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {rewriteOutput}
                          </p>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full min-h-[180px] gap-2 text-center">
                            <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
                            <p className="text-xs text-muted-foreground">
                              Rewritten content will appear here
                            </p>
                          </div>
                        )}
                      </div>
                      {rewriteOutput && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={handleApplyRewrite}
                        >
                          <ArrowRight className="h-3.5 w-3.5 mr-2" />
                          Apply to Editor
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 2: Meta Generator */}
                <TabsContent value="meta" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Content / Summary</Label>
                        <Textarea
                          placeholder="Paste your content or a summary to generate optimized meta tags..."
                          value={metaInput}
                          onChange={(e) => setMetaInput(e.target.value)}
                          className="min-h-[160px] resize-none text-sm"
                        />
                      </div>
                      <Button
                        onClick={handleMetaGenerate}
                        disabled={isMetaGenerating || !metaInput.trim()}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-9"
                      >
                        {isMetaGenerating ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-3.5 w-3.5 mr-2" />
                            Generate Meta Tags
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Generated Meta Tags</Label>
                      {metaOutput ? (
                        <div className="space-y-3">
                          <div className="p-3 rounded-lg border border-border/50 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Title ({metaOutput.title.length}/60)
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleCopy(metaOutput.title, "meta-gen-title")}
                              >
                                {copied === "meta-gen-title" ? (
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            <p className="text-sm font-semibold text-foreground">{metaOutput.title}</p>
                            <div className="flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${metaOutput.title.length >= 50 && metaOutput.title.length <= 60 ? "bg-emerald-500" : metaOutput.title.length > 60 ? "bg-amber-500" : "bg-red-500"}`} />
                              <span className="text-xs text-muted-foreground">
                                {metaOutput.title.length >= 50 && metaOutput.title.length <= 60
                                  ? "Optimal"
                                  : metaOutput.title.length > 60
                                    ? "Slightly long"
                                    : "Too short"}
                              </span>
                            </div>
                          </div>
                          <div className="p-3 rounded-lg border border-border/50 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Description ({metaOutput.description.length}/160)
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleCopy(metaOutput.description, "meta-gen-desc")}
                              >
                                {copied === "meta-gen-desc" ? (
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {metaOutput.description}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${metaOutput.description.length >= 150 && metaOutput.description.length <= 160 ? "bg-emerald-500" : metaOutput.description.length > 160 ? "bg-amber-500" : "bg-red-500"}`} />
                              <span className="text-xs text-muted-foreground">
                                {metaOutput.description.length >= 150 && metaOutput.description.length <= 160
                                  ? "Optimal"
                                  : metaOutput.description.length > 160
                                    ? "Slightly long"
                                    : "Too short"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center min-h-[200px] rounded-lg border border-dashed border-border/50 gap-2 text-center">
                          <Eye className="h-8 w-8 text-muted-foreground/40" />
                          <p className="text-xs text-muted-foreground">
                            Generated meta tags will appear here
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 3: Quick Generate */}
                <TabsContent value="quick" className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Click a template to fill the topic field, then hit Generate.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {quickTemplates.map((tmpl) => (
                      <button
                        key={tmpl.name}
                        className="flex flex-col items-start gap-2 p-4 rounded-lg border border-border/50 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-colors text-left group"
                        onClick={() => handleQuickTemplate(tmpl.topic)}
                      >
                        <span className="text-sm font-medium flex items-center gap-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                          {tmpl.name}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {tmpl.topic}
                        </span>
                      </button>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
