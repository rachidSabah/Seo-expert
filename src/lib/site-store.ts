/**
 * Site Store — Client-side Site & Analysis Management
 *
 * Manages sites and their analysis history using localStorage.
 * All operations are synchronous and run entirely client-side.
 *
 * Storage keys:
 *   - seo_sites: JSON array of Site objects
 *   - seo_analyses: JSON object keyed by siteId, each value is SiteAnalysis[]
 */

import type { AnalysisIssue } from './url-analyzer';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Site {
  id: string;
  url: string;
  domain: string;
  name: string;
  addedAt: string;
  lastAnalysisAt: string | null;
  seoScore: number | null;
  analysisCount: number;
}

export interface SiteAnalysis {
  id: string;
  siteId: string;
  url: string;
  analyzedAt: string;
  score: number;
  status: 'good' | 'ok' | 'poor';
  issues: AnalysisIssue[];
  quickStats: {
    performance: number | null;
    contentScore: number;
    technicalScore: number;
    linksScore: number;
    wordCount: number;
    titleLength: number;
    metaDescLength: number;
    imageCount: number;
    internalLinks: number;
    externalLinks: number;
  };
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────

const SITES_KEY = 'seo_sites';
const ANALYSES_KEY = 'seo_analyses';

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

// ─── Site CRUD ────────────────────────────────────────────────────────────────

/**
 * Get all saved sites.
 */
export function getSites(): Site[] {
  return readJson<Site[]>(SITES_KEY, []);
}

/**
 * Add a new site to the store.
 * If no name is provided, the domain is used as the name.
 * If the URL already exists, returns the existing site instead of creating a duplicate.
 */
export function addSite(url: string, name?: string): Site {
  const sites = getSites();

  // Check for duplicate URL
  const existing = sites.find(s => s.url === url || s.url === url.replace(/\/+$/, ''));
  if (existing) return existing;

  let domain = '';
  try {
    domain = new URL(url.startsWith('http') ? url : 'https://' + url).hostname;
  } catch {
    domain = url;
  }

  const site: Site = {
    id: generateId(),
    url: url.replace(/\/+$/, ''),
    domain,
    name: name || domain,
    addedAt: new Date().toISOString(),
    lastAnalysisAt: null,
    seoScore: null,
    analysisCount: 0,
  };

  sites.push(site);
  writeJson(SITES_KEY, sites);
  return site;
}

/**
 * Remove a site and all its analyses from the store.
 */
export function removeSite(id: string): void {
  // Remove site
  const sites = getSites().filter(s => s.id !== id);
  writeJson(SITES_KEY, sites);

  // Remove associated analyses
  const allAnalyses = readJson<Record<string, SiteAnalysis[]>>(ANALYSES_KEY, {});
  delete allAnalyses[id];
  writeJson(ANALYSES_KEY, allAnalyses);
}

/**
 * Get a single site by ID.
 */
export function getSite(id: string): Site | null {
  const sites = getSites();
  return sites.find(s => s.id === id) || null;
}

/**
 * Update a site's metadata after a new analysis is saved.
 */
function updateSiteAfterAnalysis(siteId: string, score: number, analyzedAt: string): void {
  const sites = getSites();
  const site = sites.find(s => s.id === siteId);
  if (!site) return;

  site.lastAnalysisAt = analyzedAt;
  site.seoScore = score;
  site.analysisCount += 1;

  writeJson(SITES_KEY, sites);
}

// ─── Analysis Operations ──────────────────────────────────────────────────────

/**
 * Get all analyses for a site.
 */
export function getAnalyses(siteId: string): SiteAnalysis[] {
  const all = readJson<Record<string, SiteAnalysis[]>>(ANALYSES_KEY, {});
  return all[siteId] || [];
}

/**
 * Save a new analysis for a site.
 * Automatically updates the site's lastAnalysisAt and seoScore.
 */
export function saveAnalysis(
  siteId: string,
  analysis: Omit<SiteAnalysis, 'id'>
): SiteAnalysis {
  const newAnalysis: SiteAnalysis = {
    ...analysis,
    id: generateId(),
  };

  const all = readJson<Record<string, SiteAnalysis[]>>(ANALYSES_KEY, {});
  if (!all[siteId]) {
    all[siteId] = [];
  }

  all[siteId].unshift(newAnalysis); // newest first

  // Keep max 50 analyses per site to prevent localStorage bloat
  if (all[siteId].length > 50) {
    all[siteId] = all[siteId].slice(0, 50);
  }

  writeJson(ANALYSES_KEY, all);

  // Update site metadata
  updateSiteAfterAnalysis(siteId, analysis.score, analysis.analyzedAt);

  return newAnalysis;
}

/**
 * Get the most recent analysis for a site.
 */
export function getLatestAnalysis(siteId: string): SiteAnalysis | null {
  const analyses = getAnalyses(siteId);
  return analyses.length > 0 ? analyses[0] : null;
}

/**
 * Get score history for a site (for charting).
 * Returns { date, score } pairs sorted by date ascending.
 */
export function getScoreHistory(siteId: string): { date: string; score: number }[] {
  const analyses = getAnalyses(siteId);
  return analyses
    .map(a => ({
      date: a.analyzedAt,
      score: a.score,
    }))
    .reverse(); // oldest first for charts
}

/**
 * Get the latest analysis for every site.
 * Useful for dashboard overview.
 */
export function getAllLatestAnalyses(): (SiteAnalysis & { siteName: string; domain: string })[] {
  const sites = getSites();
  const all = readJson<Record<string, SiteAnalysis[]>>(ANALYSES_KEY, {});

  const results: (SiteAnalysis & { siteName: string; domain: string })[] = [];

  for (const site of sites) {
    const analyses = all[site.id];
    if (analyses && analyses.length > 0) {
      results.push({
        ...analyses[0],
        siteName: site.name,
        domain: site.domain,
      });
    }
  }

  // Sort by most recent analysis first
  results.sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime());

  return results;
}
