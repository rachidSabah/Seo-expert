/**
 * URL Analyzer — Real Website SEO Analysis Engine
 *
 * Analyzes real websites using public APIs and HTML parsing.
 * All analysis happens client-side using CORS-enabled endpoints.
 *
 * Data sources:
 *   - Google PageSpeed Insights API (CORS-enabled, no auth)
 *   - Multiple CORS proxies for HTML fetching (fallback chain)
 *   - Regex-based HTML parsing for on-page elements
 */

// ─── Types & Interfaces ───────────────────────────────────────────────────────

export interface AnalysisIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'performance' | 'content' | 'technical' | 'links' | 'security';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface SiteAnalysisResult {
  url: string;
  analyzedAt: string;
  score: number;
  status: 'good' | 'ok' | 'poor';

  // Technical SEO (from PageSpeed)
  performance: {
    lcp: number | null;       // Largest Contentful Paint (seconds)
    fid: number | null;       // First Input Delay (ms)
    cls: number | null;       // Cumulative Layout Shift
    fcp: number | null;       // First Contentful Paint (seconds)
    ttfb: number | null;      // Time to First Byte (seconds)
    tbt: number | null;       // Total Blocking Time (ms)
    speedIndex: number | null;
    mobileScore: number | null;  // 0-100
    desktopScore: number | null; // 0-100
  };

  // On-page SEO (parsed from HTML)
  onPage: {
    title: string;
    titleLength: number;
    metaDescription: string;
    metaDescriptionLength: number;
    h1: string[];
    h2: string[];
    h3: string[];
    canonicalUrl: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    robotsMeta: string | null;
    viewportMeta: boolean;
    charset: string | null;
    lang: string | null;
    wordCount: number;
    imageCount: number;
    imagesWithAlt: number;
    imagesWithoutAlt: number;
    internalLinks: number;
    externalLinks: number;
    totalLinks: number;
    hasSitemap: boolean;
    hasRobotsTxt: boolean;
    hasHttps: boolean;
    isMobileFriendly: boolean;
  };

  // Issues found
  issues: AnalysisIssue[];
  suggestions: string[];

  // Readability
  readability: {
    fleschScore: number;
    readingTime: number;
    level: 'easy' | 'moderate' | 'hard';
  };
}

// Internal helper types
interface OnPageData {
  title: string;
  metaDescription: string;
  h1: string[];
  h2: string[];
  h3: string[];
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  robotsMeta: string | null;
  viewportMeta: boolean;
  charset: string | null;
  lang: string | null;
  wordCount: number;
  imageCount: number;
  imagesWithAlt: number;
  imagesWithoutAlt: number;
  internalLinks: number;
  externalLinks: number;
  totalLinks: number;
}

interface PerformanceData {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
  tbt: number | null;
  speedIndex: number | null;
  score: number | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * List of CORS proxy endpoints, tried in order until one succeeds.
 * Each entry has a name (for logging) and a function that builds the proxy URL.
 */
const CORS_PROXIES: Array<{ name: string; buildUrl: (targetUrl: string) => string }> = [
  {
    name: 'allorigins',
    buildUrl: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  },
  {
    name: 'corsproxy',
    buildUrl: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  },
  {
    name: 'codetabs',
    buildUrl: (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  },
];

const PROXY_TIMEOUT_MS = 10_000;

const VALID_TLDS = [
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'io', 'co', 'dev', 'app',
  'info', 'biz', 'me', 'tv', 'xyz', 'online', 'site', 'tech', 'store',
  'shop', 'blog', 'news', 'pro', 'int', 'arpa', 'aero', 'museum',
  'name', 'club', 'live', 'life', 'world', 'design', 'space', 'zone',
  'host', 'one', 'ai', 'cloud', 'digital', 'web', 'website',
];

// ─── URL Validation ───────────────────────────────────────────────────────────

export function isValidUrl(url: string): { valid: boolean; normalized: string; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, normalized: '', error: 'URL is required.' };
  }

  let normalized = url.trim();

  // Add https:// if no protocol
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = 'https://' + normalized;
  }

  // Remove trailing slash
  normalized = normalized.replace(/\/+$/, '');

  // Remove fragment
  normalized = normalized.replace(/#.*$/, '');

  try {
    const parsed = new URL(normalized);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, normalized: '', error: 'URL must use HTTP or HTTPS protocol.' };
    }

    const hostname = parsed.hostname;

    // Must have at least one dot
    if (!hostname.includes('.')) {
      return { valid: false, normalized: '', error: 'URL must include a domain name (e.g., example.com).' };
    }

    // Must have a valid TLD
    const parts = hostname.split('.');
    const tld = parts[parts.length - 1].toLowerCase();

    // Check if TLD is at least 2 chars (covers standard TLDs and ccTLDs)
    if (tld.length < 2) {
      return { valid: false, normalized: '', error: 'URL has an invalid top-level domain.' };
    }

    // Must have a non-empty domain name
    const domain = parts[parts.length - 2];
    if (!domain || !/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(domain)) {
      return { valid: false, normalized: '', error: 'URL contains an invalid domain name.' };
    }

    return { valid: true, normalized };
  } catch {
    return { valid: false, normalized: '', error: 'Invalid URL format.' };
  }
}

// ─── CORS Proxy Fetch with Fallback ──────────────────────────────────────────

/**
 * Fetch HTML through multiple CORS proxies in sequence.
 * Returns { html, proxyUsed } on success, or { html: '', proxyUsed: null } if all fail.
 * Each proxy gets PROXY_TIMEOUT_MS before we move on to the next.
 */
async function fetchWithProxyFallback(targetUrl: string): Promise<{ html: string; proxyUsed: string | null }> {
  for (const proxy of CORS_PROXIES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

      const proxyUrl = proxy.buildUrl(targetUrl);
      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`[url-analyzer] Proxy "${proxy.name}" returned HTTP ${response.status}`);
        continue;
      }

      const html = await response.text();

      // Validate that we got meaningful HTML back (not empty or error page)
      if (!html || html.trim().length === 0) {
        console.warn(`[url-analyzer] Proxy "${proxy.name}" returned empty content`);
        continue;
      }

      // Check if it looks like HTML (has at least one HTML tag)
      if (!/<[a-z][\s\S]*>/i.test(html)) {
        console.warn(`[url-analyzer] Proxy "${proxy.name}" returned non-HTML content (${html.trim().substring(0, 100)}...)`);
        continue;
      }

      console.log(`[url-analyzer] Successfully fetched HTML via proxy "${proxy.name}" (${html.length} bytes)`);
      return { html, proxyUsed: proxy.name };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.warn(`[url-analyzer] Proxy "${proxy.name}" failed: ${reason}`);
      // Continue to next proxy
    }
  }

  console.error(`[url-analyzer] ALL proxies failed for URL: ${targetUrl}`);
  return { html: '', proxyUsed: null };
}

// ─── HTML Parsing Helpers ─────────────────────────────────────────────────────

/**
 * Strip HTML tags and decode entities to get plain text.
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/&\w+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Count words in text (alphanumeric sequences).
 */
function countWordsInText(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(w => /[a-zA-Z0-9\u00C0-\u024F]/.test(w)).length;
}

/**
 * Count syllables in a word for Flesch score.
 */
function countSyllables(word: string): number {
  if (!word || word.length === 0) return 0;
  const lower = word.toLowerCase().replace(/[^a-z]/g, '');
  if (lower.length === 0) return 0;
  const vowelGroups = lower.match(/[aeiouy]+/g);
  let count = vowelGroups ? vowelGroups.length : 0;
  if (count === 0) count = 1;
  if (lower.endsWith('e') && !lower.endsWith('le') && count > 1) count--;
  if (lower.endsWith('ed') && count > 1 && !lower.endsWith('ted') && !lower.endsWith('ded')) count--;
  return count;
}

/**
 * Calculate Flesch Reading Ease score.
 */
function calculateFlesch(text: string): number {
  const words = countWordsInText(text);
  if (words === 0) return 0;

  const sentenceMatches = text.match(/[^.!?]*[.!?]+/g);
  const sentences = sentenceMatches ? sentenceMatches.length : (text.trim().length > 0 ? 1 : 0);
  if (sentences === 0) return 0;

  const wordList = text.trim().split(/\s+/).filter(w => /[a-zA-Z0-9]/.test(w));
  const totalSyllables = wordList.reduce((sum, w) => sum + countSyllables(w), 0);

  const avgSentenceLength = words / sentences;
  const avgSyllablesPerWord = totalSyllables / words;

  const score = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
  return Math.round(Math.max(0, Math.min(100, score)) * 10) / 10;
}

/**
 * Extract text content from an HTML tag, stripping inner HTML.
 */
function extractTagContent(html: string, tag: string): string {
  // Match both <tag>content</tag> and self-closing patterns
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const matches: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const content = stripHtmlTags(match[1]).trim();
    if (content) matches.push(content);
  }

  return matches.join(' | ');
}

/**
 * Extract all instances of a tag's text content.
 */
function extractAllTags(html: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const results: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const content = stripHtmlTags(match[1]).trim();
    if (content) results.push(content);
  }

  return results;
}

/**
 * Extract a meta tag's content by name or property.
 * Handles both name="description" and property="og:title" etc.
 */
function extractMetaContent(html: string, attr: string, value: string): string | null {
  // Try attr="value" content="..." first
  let regex = new RegExp(`<meta[^>]+${attr}\\s*=\\s*["']${value}["'][^>]+content\\s*=\\s*["']([^"']*)["']`, 'i');
  let match = regex.exec(html);
  if (match) return match[1] || null;

  // Try content="..." attr="value" (reversed order)
  regex = new RegExp(`<meta[^>]+content\\s*=\\s*["']([^"']*)["'][^>]+${attr}\\s*=\\s*["']${value}["']`, 'i');
  match = regex.exec(html);
  if (match) return match[1] || null;

  return null;
}

/**
 * Extract OG tag content.
 */
function extractOgTag(html: string, property: string): string | null {
  return extractMetaContent(html, 'property', `og:${property}`)
    || extractMetaContent(html, 'name', `og:${property}`);
}

/**
 * Check if a meta tag exists (for boolean checks like viewport).
 */
function metaTagExists(html: string, attr: string, value: string): boolean {
  const regex = new RegExp(`<meta[^>]+${attr}\\s*=\\s*["']${value}["']`, 'i');
  return regex.test(html);
}

/**
 * Extract charset from meta tag.
 */
function extractCharset(html: string): string | null {
  const match = html.match(/<meta[^>]+charset\s*=\s*["']([^"']+)["']/i);
  return match ? match[1] : null;
}

/**
 * Extract lang attribute from html tag.
 */
function extractLang(html: string): string | null {
  const match = html.match(/<html[^>]+lang\s*=\s*["']([^"']+)["']/i);
  return match ? match[1] : null;
}

/**
 * Extract canonical URL.
 */
function extractCanonical(html: string): string | null {
  const match = html.match(/<link[^>]+rel\s*=\s*["']canonical["'][^>]+href\s*=\s*["']([^"']+)["']/i);
  if (match) return match[1] || null;

  // Try reversed order
  const match2 = html.match(/<link[^>]+href\s*=\s*["']([^"']+)["'][^>]+rel\s*=\s*["']canonical["']/i);
  return match2 ? match2[1] : null;
}

/**
 * Extract robots meta content.
 */
function extractRobotsMeta(html: string): string | null {
  return extractMetaContent(html, 'name', 'robots');
}

/**
 * Count images and their alt attributes.
 */
function countImages(html: string): { total: number; withAlt: number; withoutAlt: number } {
  const imgRegex = /<img\s[^>]*>/gi;
  const images = html.match(imgRegex);
  if (!images) return { total: 0, withAlt: 0, withoutAlt: 0 };

  let withAlt = 0;
  let withoutAlt = 0;

  for (const img of images) {
    if (/alt\s*=\s*(?:"[^"]*"|'[^']*')/i.test(img)) {
      withAlt++;
    } else {
      withoutAlt++;
    }
  }

  return { total: images.length, withAlt, withoutAlt };
}

/**
 * Count and classify links as internal vs external.
 */
function countLinks(html: string, baseUrl: string): { internal: number; external: number; total: number } {
  const linkRegex = /<a\s[^>]*href\s*=\s*["']([^"']*)["'][^>]*>/gi;
  let internal = 0;
  let external = 0;
  let match: RegExpExecArray | null;

  let baseDomain = '';
  try {
    baseDomain = new URL(baseUrl).hostname;
  } catch {
    // fallback
  }

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1].trim();

    if (!href || href.startsWith('#') || href.startsWith('mailto:') ||
        href.startsWith('tel:') || href.startsWith('javascript:')) {
      continue;
    }

    if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../') || !href.startsWith('http')) {
      internal++;
    } else {
      try {
        const linkDomain = new URL(href).hostname;
        if (linkDomain === baseDomain) {
          internal++;
        } else {
          external++;
        }
      } catch {
        external++;
      }
    }
  }

  return { internal, external, total: internal + external };
}

// ─── Full HTML Parsing ────────────────────────────────────────────────────────

function parseHtmlContent(html: string, baseUrl: string): OnPageData {
  // When HTML is empty, return zeros/defaults so scoring can still run
  if (!html || html.trim().length === 0) {
    return {
      title: '',
      metaDescription: '',
      h1: [],
      h2: [],
      h3: [],
      canonicalUrl: null,
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
      robotsMeta: null,
      viewportMeta: false,
      charset: null,
      lang: null,
      wordCount: 0,
      imageCount: 0,
      imagesWithAlt: 0,
      imagesWithoutAlt: 0,
      internalLinks: 0,
      externalLinks: 0,
      totalLinks: 0,
    };
  }

  const title = extractTagContent(html, 'title');

  const metaDescription = extractMetaContent(html, 'name', 'description') || '';

  const h1 = extractAllTags(html, 'h1');
  const h2 = extractAllTags(html, 'h2');
  const h3 = extractAllTags(html, 'h3');

  const canonicalUrl = extractCanonical(html);

  const ogTitle = extractOgTag(html, 'title');
  const ogDescription = extractOgTag(html, 'description');
  const ogImage = extractOgTag(html, 'image');

  const robotsMeta = extractRobotsMeta(html);
  const viewportMeta = metaTagExists(html, 'name', 'viewport');
  const charset = extractCharset(html);
  const lang = extractLang(html);

  // Word count from body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;
  const plainText = stripHtmlTags(bodyContent);
  const wordCount = countWordsInText(plainText);

  const images = countImages(html);
  const links = countLinks(html, baseUrl);

  return {
    title,
    metaDescription,
    h1,
    h2,
    h3,
    canonicalUrl,
    ogTitle,
    ogDescription,
    ogImage,
    robotsMeta,
    viewportMeta,
    charset,
    lang,
    wordCount,
    imageCount: images.total,
    imagesWithAlt: images.withAlt,
    imagesWithoutAlt: images.withoutAlt,
    internalLinks: links.internal,
    externalLinks: links.external,
    totalLinks: links.total,
  };
}

// ─── PageSpeed API Parsing ────────────────────────────────────────────────────

function parsePageSpeedData(data: Record<string, unknown>): PerformanceData {
  const defaultResult: PerformanceData = {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    tbt: null,
    speedIndex: null,
    score: null,
  };

  try {
    const lighthouse = data.lighthouseResult as Record<string, unknown> | undefined;
    if (!lighthouse) return defaultResult;

    const audits = lighthouse.audits as Record<string, Record<string, unknown>> | undefined;
    const categories = lighthouse.categories as Record<string, Record<string, unknown>> | undefined;

    if (!audits || !categories) return defaultResult;

    // Overall performance score
    const perfCat = categories.performance;
    const score = typeof perfCat?.score === 'number'
      ? Math.round(perfCat.score * 100)
      : null;

    // Helper to extract numeric value from audit
    const getNumericValue = (auditId: string): number | null => {
      const audit = audits[auditId];
      if (!audit) return null;
      const numVal = audit.numericValue;
      return typeof numVal === 'number' ? numVal : null;
    };

    // LCP (milliseconds → seconds)
    const lcpMs = getNumericValue('largest-contentful-paint');
    const lcp = lcpMs !== null ? Math.round(lcpMs / 100) / 10 : null;

    // FID (already in ms)
    const fid = getNumericValue('max-potential-fid');

    // CLS (already unitless)
    const clsRaw = getNumericValue('cumulative-layout-shift');
    const cls = clsRaw !== null ? Math.round(clsRaw * 1000) / 1000 : null;

    // FCP (milliseconds → seconds)
    const fcpMs = getNumericValue('first-contentful-paint');
    const fcp = fcpMs !== null ? Math.round(fcpMs / 100) / 10 : null;

    // TTFB (milliseconds → seconds)
    const ttfbMs = getNumericValue('server-response-time');
    const ttfb = ttfbMs !== null ? Math.round(ttfbMs / 100) / 10 : null;

    // TBT (already in ms)
    const tbt = getNumericValue('total-blocking-time');

    // Speed Index (milliseconds → seconds)
    const siMs = getNumericValue('speed-index');
    const speedIndex = siMs !== null ? Math.round(siMs / 100) / 10 : null;

    return {
      lcp,
      fid,
      cls,
      fcp,
      ttfb,
      tbt,
      speedIndex,
      score,
    };
  } catch {
    return defaultResult;
  }
}

// ─── URL Existence Check ──────────────────────────────────────────────────────

async function checkUrlExists(url: string): Promise<boolean> {
  // Try each CORS proxy for the existence check too
  for (const proxy of CORS_PROXIES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const proxyUrl = proxy.buildUrl(url);
      const response = await fetch(proxyUrl, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeout);
      if (response.ok) return true;

      // Some proxies don't support HEAD, fall back to GET
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), 8000);
      const getResponse = await fetch(proxyUrl, {
        method: 'GET',
        signal: controller2.signal,
      });
      clearTimeout(timeout2);
      if (getResponse.ok) return true;
    } catch {
      // Try next proxy
    }
  }
  return false;
}

// ─── Issue Generation ─────────────────────────────────────────────────────────

function generateIssues(
  onPage: OnPageData,
  perf: PerformanceData,
  hasHttps: boolean,
  hasSitemap: boolean,
  hasRobotsTxt: boolean
): { issues: AnalysisIssue[]; suggestions: string[] } {
  const issues: AnalysisIssue[] = [];
  const suggestions: string[] = [];
  let issueId = 0;

  const addIssue = (
    severity: AnalysisIssue['severity'],
    category: AnalysisIssue['category'],
    title: string,
    description: string,
    impact: AnalysisIssue['impact'],
    effort: AnalysisIssue['effort'],
    recommendation: string
  ) => {
    issues.push({
      id: `issue-${++issueId}`,
      severity,
      category,
      title,
      description,
      impact,
      effort,
      recommendation,
    });
  };

  // ── Content Issues ──

  if (!onPage.title || onPage.title.trim().length === 0) {
    addIssue('critical', 'content', 'Missing Page Title',
      'The page does not have a <title> tag. This is essential for search engines and browser tabs.',
      'high', 'low', 'Add a descriptive title tag between 50-60 characters that includes your primary keyword.');
    suggestions.push('Add a page title tag (50-60 characters with target keyword)');
  } else if (onPage.title.length > 60) {
    addIssue('warning', 'content', 'Title Too Long',
      `The page title is ${onPage.title.length} characters. Google typically displays up to 60 characters.`,
      'medium', 'low', 'Shorten the title to under 60 characters while keeping it descriptive and keyword-rich.');
    suggestions.push('Shorten page title to under 60 characters');
  } else if (onPage.title.length < 30) {
    addIssue('warning', 'content', 'Title Too Short',
      `The page title is only ${onPage.title.length} characters. A longer title can convey more information.`,
      'low', 'low', 'Expand the title to 30-60 characters for better SEO coverage.');
    suggestions.push('Expand page title to 30-60 characters');
  }

  if (!onPage.metaDescription || onPage.metaDescription.trim().length === 0) {
    addIssue('critical', 'content', 'Missing Meta Description',
      'The page does not have a meta description. This hurts click-through rates from search results.',
      'high', 'low', 'Write a compelling meta description between 150-160 characters that includes your target keyword and a call to action.');
    suggestions.push('Add a meta description (150-160 characters)');
  } else if (onPage.metaDescription.length > 160) {
    addIssue('warning', 'content', 'Meta Description Too Long',
      `The meta description is ${onPage.metaDescription.length} characters. It may be truncated in search results.`,
      'medium', 'low', 'Shorten the meta description to 150-160 characters.');
    suggestions.push('Shorten meta description to 150-160 characters');
  } else if (onPage.metaDescription.length < 50) {
    addIssue('warning', 'content', 'Meta Description Too Short',
      `The meta description is only ${onPage.metaDescription.length} characters. It may not be descriptive enough.`,
      'medium', 'low', 'Expand the meta description to at least 120 characters for better click-through rates.');
    suggestions.push('Expand meta description to at least 120 characters');
  }

  if (onPage.h1.length === 0) {
    addIssue('critical', 'content', 'Missing H1 Heading',
      'The page does not have an H1 heading. H1 tags help search engines understand the page topic.',
      'high', 'low', 'Add a single H1 heading that includes your primary keyword and describes the page content.');
    suggestions.push('Add an H1 heading with your target keyword');
  } else if (onPage.h1.length > 1) {
    addIssue('warning', 'content', 'Multiple H1 Headings',
      `The page has ${onPage.h1.length} H1 headings. Best practice is to have only one H1 per page.`,
      'medium', 'low', 'Keep only one H1 heading and convert the others to H2 or H3 tags.');
    suggestions.push('Use only one H1 heading per page');
  }

  if (onPage.h2.length === 0 && onPage.wordCount > 300) {
    addIssue('warning', 'content', 'Missing H2 Headings',
      'The page has no H2 sub-headings. Proper heading hierarchy improves content structure and readability.',
      'medium', 'low', 'Add H2 headings to break up content into logical sections.');
    suggestions.push('Add H2 sub-headings to structure your content');
  }

  // ── Technical Issues ──

  if (!onPage.viewportMeta) {
    addIssue('critical', 'technical', 'Missing Viewport Meta Tag',
      'No viewport meta tag found. This means the page is not optimized for mobile devices.',
      'high', 'low', 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the <head> section.');
    suggestions.push('Add viewport meta tag for mobile optimization');
  }

  if (!hasHttps) {
    addIssue('critical', 'security', 'No HTTPS',
      'The page is not served over HTTPS. This is a security risk and a ranking signal for Google.',
      'high', 'medium', 'Install an SSL certificate and redirect all HTTP traffic to HTTPS.');
    suggestions.push('Enable HTTPS for your website');
  }

  if (!onPage.canonicalUrl) {
    addIssue('warning', 'technical', 'Missing Canonical URL',
      'No canonical link tag found. This may cause duplicate content issues with search engines.',
      'medium', 'low', 'Add a <link rel="canonical" href="..."> tag to specify the preferred URL for this page.');
    suggestions.push('Add canonical URL to prevent duplicate content issues');
  }

  if (!onPage.charset) {
    addIssue('info', 'technical', 'Missing Character Set',
      'No charset meta tag found. This may cause rendering issues for special characters.',
      'low', 'low', 'Add <meta charset="UTF-8"> to the <head> section.');
  }

  if (!onPage.lang) {
    addIssue('info', 'technical', 'Missing Language Attribute',
      'No lang attribute on the <html> tag. This helps search engines understand the page language.',
      'low', 'low', 'Add lang="en" (or appropriate language code) to the <html> tag.');
  }

  if (!hasSitemap) {
    addIssue('info', 'technical', 'No Sitemap Found',
      'No sitemap.xml was found at the expected URL. Sitemaps help search engines discover and crawl your pages.',
      'medium', 'medium', 'Create an XML sitemap and submit it to Google Search Console.');
    suggestions.push('Create and submit an XML sitemap');
  }

  if (!hasRobotsTxt) {
    addIssue('info', 'technical', 'No Robots.txt Found',
      'No robots.txt was found. This file helps guide search engine crawlers.',
      'low', 'low', 'Create a robots.txt file to control how search engines crawl your site.');
    suggestions.push('Create a robots.txt file');
  }

  // ── Performance Issues ──

  if (perf.lcp !== null && perf.lcp > 2.5) {
    const severity = perf.lcp > 4 ? 'critical' : 'warning';
    addIssue(severity, 'performance', 'Slow Largest Contentful Paint',
      `LCP is ${perf.lcp}s (target: < 2.5s). This is the time until the main content is visible.`,
      'high', 'high', 'Optimize images, use a CDN, reduce server response time, and eliminate render-blocking resources.');
    suggestions.push(`Optimize LCP (currently ${perf.lcp}s, target < 2.5s)`);
  }

  if (perf.cls !== null && perf.cls > 0.1) {
    addIssue('warning', 'performance', 'High Cumulative Layout Shift',
      `CLS is ${perf.cls} (target: < 0.1). The page has visual stability issues.`,
      'medium', 'medium', 'Set explicit dimensions on images/videos, avoid inserting content above existing content, and use CSS contain.');
    suggestions.push(`Reduce CLS (currently ${perf.cls}, target < 0.1)`);
  }

  if (perf.fcp !== null && perf.fcp > 1.8) {
    addIssue('warning', 'performance', 'Slow First Contentful Paint',
      `FCP is ${perf.fcp}s (target: < 1.8s). Users see a blank screen for too long.`,
      'medium', 'high', 'Reduce server response time, minimize render-blocking resources, and optimize CSS delivery.');
    suggestions.push(`Optimize FCP (currently ${perf.fcp}s, target < 1.8s)`);
  }

  if (perf.ttfb !== null && perf.ttfb > 0.8) {
    addIssue('warning', 'performance', 'Slow Server Response Time',
      `TTFB is ${perf.ttfb}s (target: < 0.8s). The server takes too long to respond.`,
      'medium', 'medium', 'Use a CDN, optimize server-side code, enable caching, and upgrade hosting if needed.');
    suggestions.push(`Reduce TTFB (currently ${perf.ttfb}s, target < 0.8s)`);
  }

  if (perf.tbt !== null && perf.tbt > 200) {
    addIssue('warning', 'performance', 'High Total Blocking Time',
      `TBT is ${perf.tbt}ms (target: < 200ms). The page has too much main-thread work.`,
      'medium', 'high', 'Reduce JavaScript execution time, break up long tasks, and use web workers for heavy computation.');
    suggestions.push(`Reduce TBT (currently ${perf.tbt}ms, target < 200ms)`);
  }

  if (perf.fid !== null && perf.fid > 100) {
    addIssue('warning', 'performance', 'High First Input Delay',
      `FID is ${perf.fid}ms (target: < 100ms). The page is slow to respond to user interactions.`,
      'medium', 'high', 'Minimize JavaScript that runs on page load and use code splitting to reduce main-thread blocking.');
    suggestions.push(`Reduce FID (currently ${perf.fid}ms, target < 100ms)`);
  }

  // ── Link Issues ──

  if (onPage.internalLinks < 3) {
    addIssue('warning', 'links', 'Few Internal Links',
      `Only ${onPage.internalLinks} internal link(s) found. Internal links help search engines discover and rank pages.`,
      'medium', 'medium', 'Add more internal links (aim for 3+) to connect related content and distribute page authority.');
    suggestions.push('Add more internal links (aim for at least 3)');
  }

  if (onPage.externalLinks < 1) {
    addIssue('info', 'links', 'No External Links',
      'No external links found. Linking to authoritative sources adds credibility.',
      'low', 'low', 'Link to at least one authoritative external source to add credibility to your content.');
    suggestions.push('Add external links to authoritative sources');
  }

  // ── Image Issues ──

  if (onPage.imagesWithoutAlt > 0) {
    const ratio = onPage.imageCount > 0
      ? Math.round((onPage.imagesWithoutAlt / onPage.imageCount) * 100)
      : 0;
    addIssue(
      ratio > 50 ? 'warning' : 'info',
      'content',
      'Images Missing Alt Text',
      `${onPage.imagesWithoutAlt} of ${onPage.imageCount} image(s) are missing alt attributes (${ratio}%).`,
      ratio > 50 ? 'medium' : 'low',
      'low',
      `Add descriptive alt text to all ${onPage.imagesWithoutAlt} image(s). Alt text improves accessibility and helps search engines understand images.`
    );
    if (onPage.imagesWithoutAlt > 0) {
      suggestions.push(`Add alt text to ${onPage.imagesWithoutAlt} image(s) missing it`);
    }
  }

  // ── OG Tag Issues ──

  if (!onPage.ogTitle && !onPage.ogDescription) {
    addIssue('info', 'content', 'Missing Open Graph Tags',
      'No Open Graph meta tags found. These improve how your page appears when shared on social media.',
      'low', 'low', 'Add og:title, og:description, and og:image meta tags for better social media sharing.');
    suggestions.push('Add Open Graph tags for better social sharing');
  } else {
    if (!onPage.ogTitle) {
      addIssue('info', 'content', 'Missing OG Title',
        'No og:title meta tag found.',
        'low', 'low', 'Add <meta property="og:title" content="..."> to the <head>.');
    }
    if (!onPage.ogImage) {
      addIssue('info', 'content', 'Missing OG Image',
        'No og:image meta tag found. Shared links on social media may not show a preview image.',
        'low', 'low', 'Add <meta property="og:image" content="..."> with a high-quality image URL.');
    }
  }

  // ── Content Length ──

  if (onPage.wordCount < 300 && onPage.wordCount > 0) {
    addIssue('warning', 'content', 'Thin Content',
      `Page has only ${onPage.wordCount} words. Thin content often ranks poorly.`,
      'medium', 'medium', 'Expand the content to at least 600 words with comprehensive, valuable information.');
    suggestions.push('Expand content to at least 600 words');
  } else if (onPage.wordCount === 0) {
    addIssue('critical', 'content', 'No Visible Content',
      'No text content could be extracted from the page.',
      'high', 'high', 'Ensure the page has meaningful, crawlable text content.');
  }

  return { issues, suggestions };
}

// ─── Score Calculation ────────────────────────────────────────────────────────

function calculateOverallScore(
  onPage: OnPageData,
  perf: PerformanceData,
  hasHttps: boolean,
  hasSitemap: boolean,
  hasRobotsTxt: boolean
): number {
  // ── Performance (25 pts) ──
  let perfScore = 0;
  if (perf.score !== null) {
    perfScore = Math.round((perf.score / 100) * 25);
  } else {
    // Fallback: estimate from individual metrics
    let metricScore = 0;
    let metricsChecked = 0;

    if (perf.lcp !== null) {
      metricScore += perf.lcp <= 2.5 ? 5 : perf.lcp <= 4 ? 2 : 0;
      metricsChecked++;
    }
    if (perf.fcp !== null) {
      metricScore += perf.fcp <= 1.8 ? 5 : perf.fcp <= 3 ? 2 : 0;
      metricsChecked++;
    }
    if (perf.cls !== null) {
      metricScore += perf.cls <= 0.1 ? 5 : perf.cls <= 0.25 ? 2 : 0;
      metricsChecked++;
    }
    if (perf.ttfb !== null) {
      metricScore += perf.ttfb <= 0.8 ? 5 : perf.ttfb <= 1.5 ? 2 : 0;
      metricsChecked++;
    }

    if (metricsChecked > 0) {
      perfScore = Math.round((metricScore / (metricsChecked * 5)) * 25);
    } else {
      perfScore = 12; // Default mid-score when no data
    }
  }

  // ── Content (30 pts) ──
  let contentScore = 0;

  // Title (8 pts)
  if (onPage.title) {
    if (onPage.title.length >= 30 && onPage.title.length <= 60) contentScore += 8;
    else if (onPage.title.length >= 10) contentScore += 4;
    else contentScore += 2;
  }

  // Meta description (7 pts)
  if (onPage.metaDescription) {
    if (onPage.metaDescription.length >= 120 && onPage.metaDescription.length <= 160) contentScore += 7;
    else if (onPage.metaDescription.length >= 50) contentScore += 4;
    else contentScore += 2;
  }

  // Headings (8 pts)
  if (onPage.h1.length === 1) contentScore += 4;
  else if (onPage.h1.length > 1) contentScore += 2;
  if (onPage.h2.length >= 2) contentScore += 4;
  else if (onPage.h2.length === 1) contentScore += 2;

  // Content length (7 pts)
  if (onPage.wordCount >= 1000) contentScore += 7;
  else if (onPage.wordCount >= 600) contentScore += 5;
  else if (onPage.wordCount >= 300) contentScore += 3;
  else if (onPage.wordCount > 0) contentScore += 1;

  // ── Technical (25 pts) ──
  let techScore = 0;

  if (hasHttps) techScore += 5;
  if (onPage.viewportMeta) techScore += 5;
  if (onPage.canonicalUrl) techScore += 4;
  if (onPage.charset) techScore += 2;
  if (onPage.lang) techScore += 2;
  if (hasSitemap) techScore += 4;
  if (hasRobotsTxt) techScore += 3;

  // ── Links (10 pts) ──
  let linksScore = 0;

  if (onPage.internalLinks >= 3) linksScore += 6;
  else if (onPage.internalLinks >= 1) linksScore += 3;
  if (onPage.externalLinks >= 1) linksScore += 4;

  // ── Accessibility (10 pts) ──
  let accessScore = 0;

  if (onPage.imageCount === 0) {
    accessScore += 5; // No images = no alt issues
  } else {
    const altRatio = onPage.imagesWithAlt / onPage.imageCount;
    accessScore += Math.round(altRatio * 5);
  }
  if (onPage.lang) accessScore += 3;
  if (onPage.charset) accessScore += 2;

  const total = perfScore + contentScore + techScore + linksScore + accessScore;
  return Math.min(100, Math.max(0, total));
}

// ─── Main Analysis Function ───────────────────────────────────────────────────

export async function analyzeUrl(url: string): Promise<SiteAnalysisResult> {
  // Validate URL first
  const validation = isValidUrl(url);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid URL');
  }

  const normalizedUrl = validation.normalized;
  const hasHttps = normalizedUrl.startsWith('https://');
  const startTime = Date.now();

  // ── Launch all API calls in parallel ──
  // HTML fetch uses the fallback proxy chain (sequential inside the promise)
  const mobilePsPromise = fetch(
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(normalizedUrl)}&strategy=mobile&category=performance`
  ).then(res => {
    if (!res.ok) throw new Error(`PageSpeed HTTP ${res.status}`);
    return res.json();
  });

  const desktopPsPromise = fetch(
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(normalizedUrl)}&strategy=desktop&category=performance`
  ).then(res => {
    if (!res.ok) throw new Error(`PageSpeed Desktop HTTP ${res.status}`);
    return res.json();
  });

  // HTML fetch with proxy fallback (runs independently)
  const htmlPromise = fetchWithProxyFallback(normalizedUrl);

  // Sitemap and robots.txt checks
  const sitemapPromise = checkUrlExists(normalizedUrl + '/sitemap.xml');
  const robotsPromise = checkUrlExists(normalizedUrl + '/robots.txt');

  const [htmlResult, mobilePsResult, desktopPsResult, sitemapResult, robotsResult] = await Promise.allSettled([
    htmlPromise,
    mobilePsPromise,
    desktopPsPromise,
    sitemapPromise,
    robotsPromise,
  ]);

  // ── Extract HTML ──
  let html = '';
  let htmlFetchFailed = false;
  if (htmlResult.status === 'fulfilled') {
    html = htmlResult.value.html;
    if (!html) {
      htmlFetchFailed = true;
    }
  } else {
    htmlFetchFailed = true;
    console.warn(`[url-analyzer] HTML fetch promise rejected:`, htmlResult.reason);
  }

  // ── Extract PageSpeed data ──
  let mobilePerf: PerformanceData = {
    lcp: null, fid: null, cls: null, fcp: null,
    ttfb: null, tbt: null, speedIndex: null, score: null,
  };
  let desktopPerf: PerformanceData = {
    lcp: null, fid: null, cls: null, fcp: null,
    ttfb: null, tbt: null, speedIndex: null, score: null,
  };

  if (mobilePsResult.status === 'fulfilled') {
    mobilePerf = parsePageSpeedData(mobilePsResult.value as Record<string, unknown>);
  }
  if (desktopPsResult.status === 'fulfilled') {
    desktopPerf = parsePageSpeedData(desktopPsResult.value as Record<string, unknown>);
  }

  const hasSitemap = sitemapResult.status === 'fulfilled' && sitemapResult.value;
  const hasRobotsTxt = robotsResult.status === 'fulfilled' && robotsResult.value;

  // ── Parse HTML (handles empty HTML gracefully with zeros/defaults) ──
  const onPage = parseHtmlContent(html, normalizedUrl);

  // ── Calculate readability ──
  let finalReadability: { fleschScore: number; readingTime: number; level: 'easy' | 'moderate' | 'hard' };

  if (html) {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : html;
    const plainText = stripHtmlTags(bodyContent);
    const fleschScore = calculateFlesch(plainText);
    const wordCount = onPage.wordCount;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    let level: 'easy' | 'moderate' | 'hard';
    if (fleschScore >= 60 && fleschScore <= 80) level = 'easy';
    else if ((fleschScore >= 40 && fleschScore < 60) || (fleschScore > 80 && fleschScore <= 90)) level = 'moderate';
    else level = 'hard';

    finalReadability = { fleschScore, readingTime, level };
  } else {
    finalReadability = { fleschScore: 0, readingTime: 0, level: 'hard' };
  }

  // ── Generate issues ──
  const { issues, suggestions } = generateIssues(onPage, mobilePerf, hasHttps, hasSitemap, hasRobotsTxt);

  // ── ALWAYS calculate score (even when HTML is empty) ──
  // When HTML is empty, on-page data will be zeros/defaults, but:
  //   - HTTPS check: +5 technical points
  //   - PageSpeed data: up to 25 performance points
  //   - Sitemap: +4 technical points
  //   - Robots.txt: +3 technical points
  //   - No images: +5 accessibility points (no images = no alt issues)
  // This means minimum score with PageSpeed working ≈ 12-30
  const score = calculateOverallScore(onPage, mobilePerf, hasHttps, hasSitemap, hasRobotsTxt);

  let status: 'good' | 'ok' | 'poor';
  if (score >= 80) status = 'good';
  else if (score >= 50) status = 'ok';
  else status = 'poor';

  // ── Determine mobile friendliness ──
  const isMobileFriendly = onPage.viewportMeta && hasHttps;

  // ── If HTML fetch failed, add an informational note ──
  const finalIssues = htmlFetchFailed
    ? [
        ...issues,
        {
          id: 'issue-html-fetch-failed',
          severity: 'warning' as const,
          category: 'technical' as const,
          title: 'HTML Fetch Failed — Partial Analysis',
          description: 'Could not fetch the page HTML through any proxy. On-page SEO data (title, headings, content, images, links) could not be analyzed. The score below is based only on PageSpeed performance data, HTTPS check, sitemap, and robots.txt.',
          impact: 'high' as const,
          effort: 'low' as const,
          recommendation: 'The page may block proxy requests or have strict CORS policies. Try analyzing again later, or check if the site is behind a firewall or CDN that blocks proxy traffic.',
        },
      ]
    : issues;

  const finalSuggestions = htmlFetchFailed
    ? [
        ...suggestions,
        'HTML could not be fetched — on-page SEO analysis is incomplete',
      ]
    : suggestions;

  return {
    url: normalizedUrl,
    analyzedAt: new Date().toISOString(),
    score,
    status,

    performance: {
      lcp: mobilePerf.lcp,
      fid: mobilePerf.fid,
      cls: mobilePerf.cls,
      fcp: mobilePerf.fcp,
      ttfb: mobilePerf.ttfb,
      tbt: mobilePerf.tbt,
      speedIndex: mobilePerf.speedIndex,
      mobileScore: mobilePerf.score,
      desktopScore: desktopPerf.score,
    },

    onPage: {
      title: onPage.title,
      titleLength: onPage.title.length,
      metaDescription: onPage.metaDescription,
      metaDescriptionLength: onPage.metaDescription.length,
      h1: onPage.h1,
      h2: onPage.h2,
      h3: onPage.h3,
      canonicalUrl: onPage.canonicalUrl,
      ogTitle: onPage.ogTitle,
      ogDescription: onPage.ogDescription,
      ogImage: onPage.ogImage,
      robotsMeta: onPage.robotsMeta,
      viewportMeta: onPage.viewportMeta,
      charset: onPage.charset,
      lang: onPage.lang,
      wordCount: onPage.wordCount,
      imageCount: onPage.imageCount,
      imagesWithAlt: onPage.imagesWithAlt,
      imagesWithoutAlt: onPage.imagesWithoutAlt,
      internalLinks: onPage.internalLinks,
      externalLinks: onPage.externalLinks,
      totalLinks: onPage.totalLinks,
      hasSitemap,
      hasRobotsTxt,
      hasHttps,
      isMobileFriendly,
    },

    issues: finalIssues,
    suggestions: finalSuggestions,
    readability: finalReadability,
  };
}
