/**
 * Competitor Store — Client-side Competitor Management
 *
 * Manages competitors per site with localStorage persistence.
 * Provides CRUD operations and AI-style comparison insights.
 *
 * Storage keys:
 *   - seo_competitors: JSON object keyed by siteId, each value is Competitor[]
 */

import type { SiteAnalysisResult } from './url-analyzer';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Competitor {
  id: string;
  siteId: string;
  url: string;
  domain: string;
  addedAt: string;
  lastAnalysisAt: string | null;
  seoScore: number | null;
  analysisResult: SiteAnalysisResult | null;
}

export interface ComparisonResult {
  yourSite: { url: string; score: number; status: string };
  competitor: { url: string; score: number; status: string };
  scoreDifference: number;
  winner: 'you' | 'competitor' | 'tie';
  insights: string[];
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────

const COMPETITORS_KEY = 'seo_competitors';

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, data: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to write to localStorage key "${key}":`, err);
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : 'https://' + url).hostname;
  } catch {
    return url;
  }
}

// ─── CRUD Operations ──────────────────────────────────────────────────────────

/**
 * Get all competitors for a specific site.
 */
export function getCompetitors(siteId: string): Competitor[] {
  const all = readJson<Record<string, Competitor[]>>(COMPETITORS_KEY, {});
  return all[siteId] || [];
}

/**
 * Add a new competitor for a site.
 * If the URL already exists for that site, returns the existing competitor.
 */
export function addCompetitor(siteId: string, url: string): Competitor {
  const all = readJson<Record<string, Competitor[]>>(COMPETITORS_KEY, {});
  if (!all[siteId]) {
    all[siteId] = [];
  }

  const normalizedUrl = url.replace(/\/+$/, '');

  // Check for duplicate URL within the same site
  const existing = all[siteId].find(c => c.url === normalizedUrl);
  if (existing) return existing;

  const competitor: Competitor = {
    id: generateId(),
    siteId,
    url: normalizedUrl,
    domain: extractDomain(normalizedUrl),
    addedAt: new Date().toISOString(),
    lastAnalysisAt: null,
    seoScore: null,
    analysisResult: null,
  };

  all[siteId].push(competitor);
  writeJson(COMPETITORS_KEY, all);
  return competitor;
}

/**
 * Remove a competitor by ID.
 */
export function removeCompetitor(id: string): void {
  const all = readJson<Record<string, Competitor[]>>(COMPETITORS_KEY, {});
  for (const siteId of Object.keys(all)) {
    all[siteId] = all[siteId].filter(c => c.id !== id);
    if (all[siteId].length === 0) {
      delete all[siteId];
    }
  }
  writeJson(COMPETITORS_KEY, all);
}

/**
 * Get a single competitor by ID.
 */
export function getCompetitor(id: string): Competitor | null {
  const all = readJson<Record<string, Competitor[]>>(COMPETITORS_KEY, {});
  for (const siteId of Object.keys(all)) {
    const found = all[siteId].find(c => c.id === id);
    if (found) return found;
  }
  return null;
}

/**
 * Save analysis result for a competitor and update metadata.
 */
export function saveCompetitorAnalysis(competitorId: string, result: SiteAnalysisResult): void {
  const all = readJson<Record<string, Competitor[]>>(COMPETITORS_KEY, {});
  for (const siteId of Object.keys(all)) {
    const competitor = all[siteId].find(c => c.id === competitorId);
    if (competitor) {
      competitor.lastAnalysisAt = new Date().toISOString();
      competitor.seoScore = result.score;
      competitor.analysisResult = result;
      break;
    }
  }
  writeJson(COMPETITORS_KEY, all);
}

/**
 * Clear all competitors for a specific site.
 */
export function clearAllCompetitors(siteId: string): void {
  const all = readJson<Record<string, Competitor[]>>(COMPETITORS_KEY, {});
  delete all[siteId];
  writeJson(COMPETITORS_KEY, all);
}

// ─── Comparison Logic ─────────────────────────────────────────────────────────

/**
 * Generate a comparison between your site analysis and a competitor's analysis.
 * Produces AI-style actionable insights by comparing individual metrics.
 */
export function generateComparison(
  siteResult: SiteAnalysisResult,
  compResult: SiteAnalysisResult,
  compUrl: string
): ComparisonResult {
  const insights: string[] = [];

  // Determine winner
  const scoreDiff = siteResult.score - compResult.score;
  let winner: 'you' | 'competitor' | 'tie';
  if (Math.abs(scoreDiff) <= 2) {
    winner = 'tie';
  } else {
    winner = scoreDiff > 0 ? 'you' : 'competitor';
  }

  // ── Performance: compare mobile scores ──
  const yourMobile = siteResult.performance.mobileScore ?? 0;
  const compMobile = compResult.performance.mobileScore ?? 0;
  if (yourMobile > 0 && compMobile > 0) {
    const mobileDiff = yourMobile - compMobile;
    if (Math.abs(mobileDiff) >= 5) {
      if (mobileDiff > 0) {
        insights.push(`Your mobile performance score is ${mobileDiff} points higher (${yourMobile} vs ${compMobile}) — good performance advantage`);
      } else {
        insights.push(`Competitor's mobile score is ${Math.abs(mobileDiff)} points higher (${compMobile} vs ${yourMobile}) — optimize mobile performance`);
      }
    }

    // Compare LCP
    const yourLcp = siteResult.performance.lcp;
    const compLcp = compResult.performance.lcp;
    if (yourLcp !== null && compLcp !== null) {
      const lcpDiff = yourLcp - compLcp;
      if (Math.abs(lcpDiff) >= 0.5) {
        if (lcpDiff < 0) {
          insights.push(`Your page loads ${Math.abs(lcpDiff).toFixed(1)}s faster (LCP ${yourLcp}s vs ${compLcp}s) — good performance advantage`);
        } else {
          insights.push(`Competitor's page loads ${lcpDiff.toFixed(1)}s faster (LCP ${compLcp}s vs ${yourLcp}s) — optimize largest contentful paint`);
        }
      }
    }

    // Compare desktop score
    const yourDesktop = siteResult.performance.desktopScore ?? 0;
    const compDesktop = compResult.performance.desktopScore ?? 0;
    if (yourDesktop > 0 && compDesktop > 0 && Math.abs(yourDesktop - compDesktop) >= 5) {
      if (yourDesktop > compDesktop) {
        insights.push(`Your desktop score leads by ${yourDesktop - compDesktop} points (${yourDesktop} vs ${compDesktop})`);
      } else {
        insights.push(`Competitor's desktop score is ${compDesktop - yourDesktop} points higher (${compDesktop} vs ${yourDesktop})`);
      }
    }
  }

  // ── Content: compare word counts, title lengths, meta description lengths ──
  const wordDiff = siteResult.onPage.wordCount - compResult.onPage.wordCount;
  if (Math.abs(wordDiff) >= 100) {
    if (wordDiff > 0) {
      insights.push(`Your page has ${wordDiff} more words (${siteResult.onPage.wordCount} vs ${compResult.onPage.wordCount}) — richer content`);
    } else {
      insights.push(`Competitor has ${Math.abs(wordDiff)} more words (${compResult.onPage.wordCount} vs ${siteResult.onPage.wordCount}) — consider expanding content`);
    }
  }

  const titleLenDiff = siteResult.onPage.titleLength - compResult.onPage.titleLength;
  if (Math.abs(titleLenDiff) >= 10) {
    if (titleLenDiff > 0) {
      const yourGood = siteResult.onPage.titleLength >= 30 && siteResult.onPage.titleLength <= 60;
      insights.push(`Your title is ${titleLenDiff} chars longer (${siteResult.onPage.titleLength} vs ${compResult.onPage.titleLength})${yourGood ? '' : ' — consider shortening to 30-60 chars'}`);
    } else {
      const compGood = compResult.onPage.titleLength >= 30 && compResult.onPage.titleLength <= 60;
      insights.push(`Competitor title is ${Math.abs(titleLenDiff)} chars longer (${compResult.onPage.titleLength} vs ${siteResult.onPage.titleLength})${compGood ? '' : ' — their title may be too long'}`);
    }
  }

  const metaDiff = siteResult.onPage.metaDescriptionLength - compResult.onPage.metaDescriptionLength;
  if (Math.abs(metaDiff) >= 20) {
    if (metaDiff > 0) {
      insights.push(`Your meta description is ${metaDiff} chars longer (${siteResult.onPage.metaDescriptionLength} vs ${compResult.onPage.metaDescriptionLength}) — consider keeping it under 160 chars`);
    } else {
      insights.push(`Competitor meta description is ${Math.abs(metaDiff)} chars longer (${compResult.onPage.metaDescriptionLength} vs ${siteResult.onPage.metaDescriptionLength})`);
    }
  }

  // ── Technical: compare HTTPS, viewport, canonical, sitemap ──
  if (siteResult.onPage.hasHttps && !compResult.onPage.hasHttps) {
    insights.push('Competitor is not using HTTPS — you have a security advantage');
  } else if (!siteResult.onPage.hasHttps && compResult.onPage.hasHttps) {
    insights.push('Competitor uses HTTPS but your site does not — enable HTTPS immediately');
  }

  if (siteResult.onPage.viewportMeta && !compResult.onPage.viewportMeta) {
    insights.push('Competitor is missing viewport meta tag — you have better mobile optimization');
  } else if (!siteResult.onPage.viewportMeta && compResult.onPage.viewportMeta) {
    insights.push('Competitor has viewport meta but yours is missing — add it for mobile friendliness');
  }

  if (!siteResult.onPage.canonicalUrl && !compResult.onPage.canonicalUrl) {
    insights.push('Both sites missing canonical tags — add them to prevent duplicate content issues');
  } else if (siteResult.onPage.canonicalUrl && !compResult.onPage.canonicalUrl) {
    insights.push('Competitor is missing a canonical URL — you have better technical SEO');
  } else if (!siteResult.onPage.canonicalUrl && compResult.onPage.canonicalUrl) {
    insights.push('Competitor has a canonical URL but yours is missing — add a canonical tag');
  }

  if (!siteResult.onPage.hasSitemap && compResult.onPage.hasSitemap) {
    insights.push('Competitor has a sitemap but yours was not found — create an XML sitemap');
  } else if (siteResult.onPage.hasSitemap && !compResult.onPage.hasSitemap) {
    insights.push('You have a sitemap but competitor does not — crawling advantage');
  }

  // ── Links: compare internal/external link counts ──
  const internalDiff = siteResult.onPage.internalLinks - compResult.onPage.internalLinks;
  if (Math.abs(internalDiff) >= 3) {
    if (internalDiff > 0) {
      insights.push(`You have ${internalDiff} more internal links (${siteResult.onPage.internalLinks} vs ${compResult.onPage.internalLinks}) — better internal linking structure`);
    } else {
      insights.push(`Competitor has ${Math.abs(internalDiff)} more internal links (${compResult.onPage.internalLinks} vs ${siteResult.onPage.internalLinks}) — improve internal linking`);
    }
  }

  const externalDiff = siteResult.onPage.externalLinks - compResult.onPage.externalLinks;
  if (Math.abs(externalDiff) >= 2) {
    if (externalDiff > 0) {
      insights.push(`You have ${externalDiff} more external links — better authority signals`);
    } else {
      insights.push(`Competitor has ${Math.abs(externalDiff)} more external links — consider linking to authoritative sources`);
    }
  }

  // ── Images: compare alt text coverage ──
  const yourAltRatio = siteResult.onPage.imageCount > 0
    ? siteResult.onPage.imagesWithAlt / siteResult.onPage.imageCount
    : 1;
  const compAltRatio = compResult.onPage.imageCount > 0
    ? compResult.onPage.imagesWithAlt / compResult.onPage.imageCount
    : 1;
  const altRatioDiff = yourAltRatio - compAltRatio;
  if (Math.abs(altRatioDiff) >= 0.2) {
    if (altRatioDiff < 0) {
      insights.push(`Competitor has better image alt text coverage (${Math.round(compAltRatio * 100)}% vs ${Math.round(yourAltRatio * 100)}%) — add alt text to your images`);
    } else {
      insights.push(`Your image alt text coverage is better (${Math.round(yourAltRatio * 100)}% vs ${Math.round(compAltRatio * 100)}%)`);
    }
  }

  // ── Headings ──
  if (siteResult.onPage.h1.length === 1 && compResult.onPage.h1.length !== 1) {
    insights.push('You have exactly 1 H1 heading (best practice) — competitor has ' + compResult.onPage.h1.length);
  } else if (compResult.onPage.h1.length === 1 && siteResult.onPage.h1.length !== 1) {
    insights.push('Competitor follows best practice with 1 H1 heading — review your heading structure');
  }

  if (siteResult.onPage.h2.length >= 2 && compResult.onPage.h2.length < 2) {
    insights.push('Your content has better heading structure with H2 sub-sections');
  } else if (compResult.onPage.h2.length >= 2 && siteResult.onPage.h2.length < 2) {
    insights.push('Competitor uses more H2 sub-headings — add more to structure your content');
  }

  // Trim to 4-6 most impactful insights
  const finalInsights = insights.slice(0, 6);
  if (finalInsights.length === 0) {
    finalInsights.push('Both sites have very similar SEO profiles — focus on incremental improvements');
  }

  return {
    yourSite: {
      url: siteResult.url,
      score: siteResult.score,
      status: siteResult.status,
    },
    competitor: {
      url: compUrl,
      score: compResult.score,
      status: compResult.status,
    },
    scoreDifference: scoreDiff,
    winner,
    insights: finalInsights,
  };
}
