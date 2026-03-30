/**
 * Audit Scheduler — Browser-based Scheduled Audit System
 *
 * Manages scheduled SEO audits using localStorage timestamps.
 * Designed to be called periodically via setInterval from React components.
 *
 * Storage keys:
 *   - seo_scheduled_audits: JSON array of ScheduledAudit objects
 *   - seo_audit_logs: JSON array of AuditLog objects
 */

import type { SiteAnalysisResult } from './url-analyzer';
import { analyzeUrl } from './url-analyzer';
import { getSites, saveAnalysis } from './site-store';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScheduledAudit {
  id: string;
  siteId: string;
  url: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  lastRun: string | null;
  nextRun: string;
  runCount: number;
  lastScore: number | null;
  status: 'idle' | 'running' | 'success' | 'failed';
  error: string | null;
}

export interface AuditLog {
  id: string;
  scheduledAuditId: string;
  url: string;
  triggeredAt: string;
  completedAt: string | null;
  score: number | null;
  status: 'running' | 'success' | 'failed';
  error: string | null;
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────

const AUDITS_KEY = 'seo_scheduled_audits';
const LOGS_KEY = 'seo_audit_logs';

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

// ─── Next Run Calculation ─────────────────────────────────────────────────────

/**
 * Calculate the next run time based on frequency.
 */
function calculateNextRun(frequency: string, from: Date): string {
  const next = new Date(from);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    default:
      next.setDate(next.getDate() + 1);
  }

  return next.toISOString();
}

// ─── Scheduled Audit CRUD ────────────────────────────────────────────────────

/**
 * Get all scheduled audits.
 */
export function getScheduledAudits(): ScheduledAudit[] {
  return readJson<ScheduledAudit[]>(AUDITS_KEY, []);
}

/**
 * Add a new scheduled audit.
 */
export function addScheduledAudit(
  siteId: string,
  url: string,
  frequency: 'daily' | 'weekly' | 'monthly'
): ScheduledAudit {
  const audits = getScheduledAudits();

  const audit: ScheduledAudit = {
    id: generateId(),
    siteId,
    url: url.replace(/\/+$/, ''),
    frequency,
    enabled: true,
    lastRun: null,
    nextRun: calculateNextRun(frequency, new Date()),
    runCount: 0,
    lastScore: null,
    status: 'idle',
    error: null,
  };

  audits.push(audit);
  writeJson(AUDITS_KEY, audits);
  return audit;
}

/**
 * Update a scheduled audit with partial data.
 */
export function updateScheduledAudit(id: string, updates: Partial<ScheduledAudit>): void {
  const audits = getScheduledAudits();
  const index = audits.findIndex(a => a.id === id);
  if (index === -1) return;

  audits[index] = { ...audits[index], ...updates };
  writeJson(AUDITS_KEY, audits);
}

/**
 * Remove a scheduled audit.
 */
export function removeScheduledAudit(id: string): void {
  const audits = getScheduledAudits().filter(a => a.id !== id);
  writeJson(AUDITS_KEY, audits);

  // Also remove associated logs
  const logs = getAuditLogs().filter(l => l.scheduledAuditId !== id);
  writeJson(LOGS_KEY, logs);
}

/**
 * Toggle a scheduled audit's enabled state.
 */
export function toggleScheduledAudit(id: string): void {
  const audits = getScheduledAudits();
  const audit = audits.find(a => a.id === id);
  if (!audit) return;

  audit.enabled = !audit.enabled;

  // If re-enabled, recalculate next run
  if (audit.enabled && audit.status !== 'running') {
    audit.nextRun = calculateNextRun(
      audit.frequency,
      audit.lastRun ? new Date(audit.lastRun) : new Date()
    );
  }

  writeJson(AUDITS_KEY, audits);
}

// ─── Audit Log Operations ─────────────────────────────────────────────────────

/**
 * Get all audit logs.
 */
export function getAuditLogs(): AuditLog[] {
  return readJson<AuditLog[]>(LOGS_KEY, []);
}

/**
 * Get audit logs for a specific scheduled audit.
 */
export function getAuditLogsForAudit(auditId: string): AuditLog[] {
  return getAuditLogs().filter(l => l.scheduledAuditId === auditId);
}

/**
 * Clear all audit logs.
 */
export function clearAuditLogs(): void {
  writeJson(LOGS_KEY, []);
}

// ─── Due Audit Execution ─────────────────────────────────────────────────────

/**
 * Check for due scheduled audits and run them.
 * Designed to be called periodically (e.g., every minute via setInterval).
 *
 * Returns the number of audits run and their log entries.
 */
export async function checkAndRunDueAudits(): Promise<{ ran: number; results: AuditLog[] }> {
  const audits = getScheduledAudits();
  const now = new Date();
  const results: AuditLog[] = [];
  let ran = 0;

  for (const audit of audits) {
    // Skip disabled or currently running audits
    if (!audit.enabled || audit.status === 'running') continue;

    // Check if audit is due
    const nextRunDate = new Date(audit.nextRun);
    if (nextRunDate > now) continue;

    // Set status to running
    updateScheduledAudit(audit.id, { status: 'running', error: null });

    // Create running log entry
    const logEntry: AuditLog = {
      id: generateId(),
      scheduledAuditId: audit.id,
      url: audit.url,
      triggeredAt: now.toISOString(),
      completedAt: null,
      score: null,
      status: 'running',
      error: null,
    };

    try {
      // Run the analysis
      const analysisResult: SiteAnalysisResult = await analyzeUrl(audit.url);

      // Save to site store
      const sites = getSites();
      const site = sites.find(s => s.id === audit.siteId);
      if (site) {
        saveAnalysis(audit.siteId, {
          siteId: audit.siteId,
          url: audit.url,
          analyzedAt: analysisResult.analyzedAt,
          score: analysisResult.score,
          status: analysisResult.status,
          issues: analysisResult.issues,
          quickStats: {
            performance: analysisResult.performance.mobileScore,
            contentScore: analysisResult.score,
            technicalScore: analysisResult.onPage.hasHttps ? 90 : 40,
            linksScore: analysisResult.onPage.internalLinks >= 3 ? 85 : 50,
            wordCount: analysisResult.onPage.wordCount,
            titleLength: analysisResult.onPage.titleLength,
            metaDescLength: analysisResult.onPage.metaDescriptionLength,
            imageCount: analysisResult.onPage.imageCount,
            internalLinks: analysisResult.onPage.internalLinks,
            externalLinks: analysisResult.onPage.externalLinks,
          },
        });
      }

      // Calculate next run
      const completedAt = new Date();
      const nextRun = calculateNextRun(audit.frequency, completedAt);

      // Update audit status
      updateScheduledAudit(audit.id, {
        status: 'success',
        lastRun: completedAt.toISOString(),
        nextRun,
        runCount: audit.runCount + 1,
        lastScore: analysisResult.score,
        error: null,
      });

      // Update log entry
      logEntry.completedAt = completedAt.toISOString();
      logEntry.score = analysisResult.score;
      logEntry.status = 'success';
      logEntry.error = null;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';

      // Update audit status
      const completedAt = new Date();
      updateScheduledAudit(audit.id, {
        status: 'failed',
        lastRun: completedAt.toISOString(),
        nextRun: calculateNextRun(audit.frequency, completedAt),
        error: errorMsg,
      });

      // Update log entry
      logEntry.completedAt = completedAt.toISOString();
      logEntry.score = null;
      logEntry.status = 'failed';
      logEntry.error = errorMsg;
    }

    results.push(logEntry);
    ran++;

    // Save the log entry
    const logs = getAuditLogs();
    logs.unshift(logEntry);
    // Keep max 200 logs to prevent localStorage bloat
    if (logs.length > 200) {
      logs.length = 200;
    }
    writeJson(LOGS_KEY, logs);
  }

  return { ran, results };
}
