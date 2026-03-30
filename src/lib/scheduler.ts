export interface AuditSchedule {
  id: string;
  name: string;
  siteId: string;
  siteUrl: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  lastRun: string | null;
  nextRun: string;
  createdAt: string;
  totalRuns: number;
}

const STORAGE_KEY = 'seo_schedules';
let schedulerInterval: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function loadSchedules(): AuditSchedule[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSchedules(schedules: AuditSchedule[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
}

export function getSchedules(): AuditSchedule[] {
  return loadSchedules();
}

export function addSchedule(data: {
  name: string;
  siteId: string;
  siteUrl: string;
  frequency: 'daily' | 'weekly' | 'monthly';
}): AuditSchedule {
  const schedules = loadSchedules();
  const schedule: AuditSchedule = {
    id: genId(),
    name: data.name,
    siteId: data.siteId,
    siteUrl: data.siteUrl,
    frequency: data.frequency,
    enabled: true,
    lastRun: null,
    nextRun: calculateNextRun(data.frequency),
    createdAt: new Date().toISOString(),
    totalRuns: 0,
  };
  schedules.push(schedule);
  saveSchedules(schedules);
  return schedule;
}

export function toggleSchedule(id: string): void {
  const schedules = loadSchedules();
  const idx = schedules.findIndex((s) => s.id === id);
  if (idx !== -1) {
    schedules[idx].enabled = !schedules[idx].enabled;
    if (schedules[idx].enabled) {
      schedules[idx].nextRun = calculateNextRun(schedules[idx].frequency);
    }
    saveSchedules(schedules);
  }
}

export function removeSchedule(id: string): void {
  const schedules = loadSchedules().filter((s) => s.id !== id);
  saveSchedules(schedules);
}

export function getDueSchedules(): AuditSchedule[] {
  const now = new Date().toISOString();
  return loadSchedules().filter((s) => s.enabled && s.nextRun <= now);
}

export function markScheduleRun(id: string): void {
  const schedules = loadSchedules();
  const idx = schedules.findIndex((s) => s.id === id);
  if (idx !== -1) {
    schedules[idx].lastRun = new Date().toISOString();
    schedules[idx].totalRuns += 1;
    schedules[idx].nextRun = calculateNextRun(schedules[idx].frequency);
    saveSchedules(schedules);
  }
}

function calculateNextRun(frequency: string): string {
  const now = new Date();
  const msPerDay = 86400000;
  switch (frequency) {
    case 'daily':
      return new Date(now.getTime() + msPerDay).toISOString();
    case 'weekly':
      return new Date(now.getTime() + 7 * msPerDay).toISOString();
    case 'monthly':
      return new Date(now.getTime() + 30 * msPerDay).toISOString();
    default:
      return new Date(now.getTime() + 7 * msPerDay).toISOString();
  }
}

export function startScheduler(): () => void {
  if (schedulerInterval) return; // already running

  const checkAndRun = async () => {
    if (isRunning) return;
    const due = getDueSchedules();
    if (due.length === 0) return;

    isRunning = true;
    // Dynamic import to avoid circular dependency
    const { analyzeUrl } = await import('./url-analyzer');
    const { saveAnalysis } = await import('./site-store');

    for (const schedule of due) {
      try {
        const result = await analyzeUrl(schedule.siteUrl);
        saveAnalysis(schedule.siteId, {
          siteId: schedule.siteId,
          url: schedule.siteUrl,
          analyzedAt: result.analyzedAt,
          score: result.score,
          status: result.status,
          issues: result.issues,
          quickStats: {
            performance: result.performance.mobileScore,
            contentScore: null,
            technicalScore: null,
            linksScore: null,
            wordCount: result.onPage.wordCount,
            titleLength: result.onPage.titleLength,
            metaDescLength: result.onPage.metaDescriptionLength,
            imageCount: result.onPage.imageCount,
            internalLinks: result.onPage.internalLinks,
            externalLinks: result.onPage.externalLinks,
          },
        });
        markScheduleRun(schedule.id);
      } catch {
        // Skip failed analysis, try again next interval
      }
    }
    isRunning = false;
  };

  schedulerInterval = setInterval(checkAndRun, 60000); // check every minute

  // Return cleanup function
  return () => {
    if (schedulerInterval) {
      clearInterval(schedulerInterval);
      schedulerInterval = null;
    }
  };
}
