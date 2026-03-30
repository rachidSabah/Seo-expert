/**
 * Report Generator — SEO Analysis Report Export
 *
 * Generates downloadable reports from SiteAnalysisResult data.
 * Supports CSV and HTML formats (HTML can be printed to PDF).
 */

import type { SiteAnalysisResult, AnalysisIssue } from './url-analyzer';
import { jsPDF } from 'jspdf';

// ─── CSV Report ───────────────────────────────────────────────────────────────

/**
 * Generate a full CSV report from an SEO analysis.
 */
export function generateCsvReport(analysis: SiteAnalysisResult): string {
  const lines: string[] = [];
  const { url, analyzedAt, score, status, performance, onPage, readability } = analysis;

  // Header
  lines.push(`SEO Analysis Report - ${new URL(url).hostname}`);
  lines.push(`Generated: ${new Date(analyzedAt).toLocaleString()}`);
  lines.push(`Overall Score,${score},${capitalize(status)}`);
  lines.push('');
  lines.push('Category,Metric,Value,Status');

  // Performance metrics
  const perfMetrics = [
    ['Performance', 'Largest Contentful Paint', performance.lcp !== null ? `${performance.lcp}s` : 'N/A', perfStatus(performance.lcp, 2.5)],
    ['Performance', 'First Input Delay', performance.fid !== null ? `${performance.fid}ms` : 'N/A', perfStatusMs(performance.fid, 100)],
    ['Performance', 'Cumulative Layout Shift', performance.cls !== null ? String(performance.cls) : 'N/A', clsStatus(performance.cls)],
    ['Performance', 'First Contentful Paint', performance.fcp !== null ? `${performance.fcp}s` : 'N/A', perfStatus(performance.fcp, 1.8)],
    ['Performance', 'Time to First Byte', performance.ttfb !== null ? `${performance.ttfb}s` : 'N/A', perfStatus(performance.ttfb, 0.8)],
    ['Performance', 'Total Blocking Time', performance.tbt !== null ? `${performance.tbt}ms` : 'N/A', tbtStatus(performance.tbt)],
    ['Performance', 'Speed Index', performance.speedIndex !== null ? `${performance.speedIndex}s` : 'N/A', perfStatus(performance.speedIndex, 3.4)],
    ['Performance', 'Mobile Score', performance.mobileScore !== null ? `${performance.mobileScore}/100` : 'N/A', scoreToStatus(performance.mobileScore)],
    ['Performance', 'Desktop Score', performance.desktopScore !== null ? `${performance.desktopScore}/100` : 'N/A', scoreToStatus(performance.desktopScore)],
  ];

  for (const [cat, metric, value, st] of perfMetrics) {
    lines.push(`${cat},${metric},${value},${st}`);
  }

  // Content metrics
  const contentMetrics = [
    ['Content', 'Page Title', onPage.title || 'Missing', onPage.title ? (onPage.titleLength >= 30 && onPage.titleLength <= 60 ? 'Good' : 'Warning') : 'Critical'],
    ['Content', 'Title Length', `${onPage.titleLength} chars`, onPage.titleLength >= 30 && onPage.titleLength <= 60 ? 'Good' : 'Warning'],
    ['Content', 'Meta Description', onPage.metaDescription ? `${onPage.metaDescriptionLength} chars` : 'Missing', onPage.metaDescription ? (onPage.metaDescriptionLength >= 120 && onPage.metaDescriptionLength <= 160 ? 'Good' : 'Warning') : 'Critical'],
    ['Content', 'H1 Headings', `${onPage.h1.length} found`, onPage.h1.length === 1 ? 'Good' : onPage.h1.length === 0 ? 'Critical' : 'Warning'],
    ['Content', 'H2 Headings', `${onPage.h2.length} found`, onPage.h2.length >= 2 ? 'Good' : 'Warning'],
    ['Content', 'Word Count', `${onPage.wordCount} words`, onPage.wordCount >= 600 ? 'Good' : onPage.wordCount >= 300 ? 'OK' : 'Poor'],
    ['Content', 'Images', `${onPage.imageCount} total (${onPage.imagesWithAlt} with alt)`, onPage.imagesWithoutAlt === 0 ? 'Good' : 'Warning'],
  ];

  for (const [cat, metric, value, st] of contentMetrics) {
    lines.push(`${cat},${metric},"${value.replace(/"/g, '""')}",${st}`);
  }

  // Technical metrics
  const techMetrics = [
    ['Technical', 'HTTPS', onPage.hasHttps ? 'Yes' : 'No', onPage.hasHttps ? 'Good' : 'Critical'],
    ['Technical', 'Viewport Meta', onPage.viewportMeta ? 'Present' : 'Missing', onPage.viewportMeta ? 'Good' : 'Critical'],
    ['Technical', 'Canonical URL', onPage.canonicalUrl || 'Missing', onPage.canonicalUrl ? 'Good' : 'Warning'],
    ['Technical', 'Charset', onPage.charset || 'Missing', onPage.charset ? 'Good' : 'Info'],
    ['Technical', 'Language', onPage.lang || 'Missing', onPage.lang ? 'Good' : 'Info'],
    ['Technical', 'Sitemap', onPage.hasSitemap ? 'Found' : 'Not Found', onPage.hasSitemap ? 'Good' : 'Info'],
    ['Technical', 'Robots.txt', onPage.hasRobotsTxt ? 'Found' : 'Not Found', onPage.hasRobotsTxt ? 'Good' : 'Info'],
    ['Technical', 'Mobile Friendly', onPage.isMobileFriendly ? 'Yes' : 'No', onPage.isMobileFriendly ? 'Good' : 'Warning'],
  ];

  for (const [cat, metric, value, st] of techMetrics) {
    lines.push(`${cat},${metric},"${value.replace(/"/g, '""')}",${st}`);
  }

  // Link metrics
  const linkMetrics = [
    ['Links', 'Internal Links', String(onPage.internalLinks), onPage.internalLinks >= 3 ? 'Good' : 'Warning'],
    ['Links', 'External Links', String(onPage.externalLinks), onPage.externalLinks >= 1 ? 'Good' : 'Info'],
    ['Links', 'Total Links', String(onPage.totalLinks), onPage.totalLinks > 0 ? 'Good' : 'Warning'],
  ];

  for (const [cat, metric, value, st] of linkMetrics) {
    lines.push(`${cat},${metric},${value},${st}`);
  }

  // Readability
  lines.push(`Readability,Flesch Score,${readability.fleschScore},${capitalize(readability.level)}`);
  lines.push(`Readability,Reading Time,${readability.readingTime} min,`);
  lines.push('');

  // Issues
  lines.push('Issues:');
  lines.push('Severity,Title,Impact,Recommendation');
  for (const issue of analysis.issues) {
    lines.push(`${capitalize(issue.severity)},"${issue.title.replace(/"/g, '""')}","${capitalize(issue.impact)}","${issue.recommendation.replace(/"/g, '""')}"`);
  }

  lines.push('');
  lines.push('Suggestions:');
  for (const suggestion of analysis.suggestions) {
    lines.push(`"${suggestion.replace(/"/g, '""')}"`);
  }

  return lines.join('\n');
}

/**
 * Generate a CSV for just the issues table.
 */
export function generateIssuesCsv(issues: AnalysisIssue[]): string {
  const lines: string[] = [];

  lines.push('ID,Severity,Category,Title,Description,Impact,Effort,Recommendation');

  for (const issue of issues) {
    lines.push(
      `${issue.id},${capitalize(issue.severity)},${capitalize(issue.category)},` +
      `"${issue.title.replace(/"/g, '""')}","${issue.description.replace(/"/g, '""')}","${capitalize(issue.impact)}",` +
      `"${capitalize(issue.effort)}","${issue.recommendation.replace(/"/g, '""')}"`
    );
  }

  return lines.join('\n');
}

// ─── HTML Report ──────────────────────────────────────────────────────────────

/**
 * Generate a complete, styled HTML report for printing or saving as PDF.
 */
export function generateHtmlReport(analysis: SiteAnalysisResult, siteName: string): string {
  const { url, analyzedAt, score, status, performance, onPage, readability, issues, suggestions } = analysis;

  let domain = '';
  try { domain = new URL(url).hostname; } catch { domain = url; }

  const scoreColor = status === 'good' ? '#059669' : status === 'ok' ? '#d97706' : '#dc2626';
  const scoreBg = status === 'good' ? '#ecfdf5' : status === 'ok' ? '#fffbeb' : '#fef2f2';

  const issuesBySeverity = {
    critical: issues.filter(i => i.severity === 'critical'),
    warning: issues.filter(i => i.severity === 'warning'),
    info: issues.filter(i => i.severity === 'info'),
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEO Report - ${escapeHtml(siteName)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; background: #fff; line-height: 1.6; }
    .container { max-width: 960px; margin: 0 auto; padding: 24px; }

    /* Header */
    .header { text-align: center; padding: 40px 20px; border-bottom: 3px solid #10b981; margin-bottom: 32px; }
    .header h1 { font-size: 28px; font-weight: 700; color: #1a1a2e; margin-bottom: 8px; }
    .header .url { color: #6b7280; font-size: 14px; margin-bottom: 16px; }
    .header .meta { color: #9ca3af; font-size: 13px; }

    /* Score Gauge */
    .score-gauge { display: inline-flex; flex-direction: column; align-items: center; padding: 20px 40px; border-radius: 16px; background: ${scoreBg}; margin: 16px 0; }
    .score-gauge .score-value { font-size: 56px; font-weight: 800; color: ${scoreColor}; line-height: 1; }
    .score-gauge .score-label { font-size: 14px; font-weight: 600; color: ${scoreColor}; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
    .score-gauge .score-of { font-size: 12px; color: #9ca3af; }

    /* Sections */
    .section { margin-bottom: 32px; }
    .section h2 { font-size: 20px; font-weight: 700; color: #1a1a2e; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; margin-bottom: 16px; }
    .section h2 .icon { margin-right: 8px; }

    /* Stats Grid */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .stat-card { padding: 16px; border-radius: 10px; background: #f9fafb; border: 1px solid #e5e7eb; }
    .stat-card .label { font-size: 12px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-card .value { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-top: 4px; }
    .stat-card .status { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 12px; display: inline-block; margin-top: 6px; }
    .status-good { background: #ecfdf5; color: #059669; }
    .status-warning { background: #fffbeb; color: #d97706; }
    .status-poor { background: #fef2f2; color: #dc2626; }
    .status-info { background: #f0f9ff; color: #0284c7; }

    /* Tables */
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 10px 12px; background: #f9fafb; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    tr:hover { background: #f9fafb; }

    /* Severity badges */
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .badge-critical { background: #fef2f2; color: #dc2626; }
    .badge-warning { background: #fffbeb; color: #d97706; }
    .badge-info { background: #f0f9ff; color: #0284c7; }

    /* Issues list */
    .issues-summary { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .issues-summary .count { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; }
    .count-critical { background: #fef2f2; color: #dc2626; }
    .count-warning { background: #fffbeb; color: #d97706; }
    .count-info { background: #f0f9ff; color: #0284c7; }

    /* Suggestions */
    .suggestions-list { list-style: none; padding: 0; }
    .suggestions-list li { padding: 10px 14px; background: #f0fdf4; border-left: 3px solid #10b981; border-radius: 0 8px 8px 0; margin-bottom: 8px; font-size: 13px; color: #374151; }

    /* Footer */
    .footer { text-align: center; padding: 24px; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; margin-top: 32px; }

    /* Print */
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .container { max-width: 100%; padding: 0; }
      .section { page-break-inside: avoid; }
      .header { padding: 20px 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">

    <!-- Header -->
    <div class="header">
      <h1>${escapeHtml(siteName)}</h1>
      <div class="url">${escapeHtml(url)}</div>
      <div class="score-gauge">
        <div class="score-value">${score}</div>
        <div class="score-label">${capitalize(status)}</div>
        <div class="score-of">out of 100</div>
      </div>
      <div class="meta">Generated on ${new Date(analyzedAt).toLocaleString()} &bull; ${domain}</div>
    </div>

    <!-- Quick Stats -->
    <div class="section">
      <h2><span class="icon">&#9881;</span>Overview</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">Overall Score</div>
          <div class="value">${score}/100</div>
          <span class="status status-${status}">${capitalize(status)}</span>
        </div>
        <div class="stat-card">
          <div class="label">Mobile Score</div>
          <div class="value">${performance.mobileScore !== null ? performance.mobileScore : 'N/A'}${performance.mobileScore !== null ? '/100' : ''}</div>
          ${performance.mobileScore !== null ? `<span class="status ${performance.mobileScore >= 90 ? 'status-good' : performance.mobileScore >= 50 ? 'status-warning' : 'status-poor'}">${performance.mobileScore >= 90 ? 'Good' : performance.mobileScore >= 50 ? 'Needs Work' : 'Poor'}</span>` : ''}
        </div>
        <div class="stat-card">
          <div class="label">Desktop Score</div>
          <div class="value">${performance.desktopScore !== null ? performance.desktopScore : 'N/A'}${performance.desktopScore !== null ? '/100' : ''}</div>
          ${performance.desktopScore !== null ? `<span class="status ${performance.desktopScore >= 90 ? 'status-good' : performance.desktopScore >= 50 ? 'status-warning' : 'status-poor'}">${performance.desktopScore >= 90 ? 'Good' : performance.desktopScore >= 50 ? 'Needs Work' : 'Poor'}</span>` : ''}
        </div>
        <div class="stat-card">
          <div class="label">Word Count</div>
          <div class="value">${onPage.wordCount.toLocaleString()}</div>
          <span class="status ${onPage.wordCount >= 600 ? 'status-good' : onPage.wordCount >= 300 ? 'status-warning' : 'status-poor'}">${onPage.wordCount >= 600 ? 'Good' : onPage.wordCount >= 300 ? 'OK' : 'Thin'}</span>
        </div>
        <div class="stat-card">
          <div class="label">Readability</div>
          <div class="value">${readability.fleschScore}</div>
          <span class="status ${readability.level === 'easy' ? 'status-good' : readability.level === 'moderate' ? 'status-warning' : 'status-poor'}">${capitalize(readability.level)}</span>
        </div>
        <div class="stat-card">
          <div class="label">Reading Time</div>
          <div class="value">${readability.readingTime} min</div>
        </div>
      </div>
    </div>

    <!-- Performance -->
    <div class="section">
      <h2><span class="icon">&#9889;</span>Performance</h2>
      <table>
        <thead>
          <tr><th>Metric</th><th>Value</th><th>Target</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr><td>Largest Contentful Paint</td><td>${performance.lcp !== null ? performance.lcp + 's' : 'N/A'}</td><td>&lt; 2.5s</td><td>${perfBadge(performance.lcp, 2.5)}</td></tr>
          <tr><td>First Input Delay</td><td>${performance.fid !== null ? performance.fid + 'ms' : 'N/A'}</td><td>&lt; 100ms</td><td>${perfBadgeMs(performance.fid, 100)}</td></tr>
          <tr><td>Cumulative Layout Shift</td><td>${performance.cls !== null ? performance.cls : 'N/A'}</td><td>&lt; 0.1</td><td>${clsBadge(performance.cls)}</td></tr>
          <tr><td>First Contentful Paint</td><td>${performance.fcp !== null ? performance.fcp + 's' : 'N/A'}</td><td>&lt; 1.8s</td><td>${perfBadge(performance.fcp, 1.8)}</td></tr>
          <tr><td>Time to First Byte</td><td>${performance.ttfb !== null ? performance.ttfb + 's' : 'N/A'}</td><td>&lt; 0.8s</td><td>${perfBadge(performance.ttfb, 0.8)}</td></tr>
          <tr><td>Total Blocking Time</td><td>${performance.tbt !== null ? performance.tbt + 'ms' : 'N/A'}</td><td>&lt; 200ms</td><td>${tbtBadge(performance.tbt)}</td></tr>
          <tr><td>Speed Index</td><td>${performance.speedIndex !== null ? performance.speedIndex + 's' : 'N/A'}</td><td>&lt; 3.4s</td><td>${perfBadge(performance.speedIndex, 3.4)}</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Content -->
    <div class="section">
      <h2><span class="icon">&#128196;</span>Content Analysis</h2>
      <table>
        <thead>
          <tr><th>Element</th><th>Value</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr><td>Page Title</td><td>${escapeHtml(onPage.title || 'Missing')}${onPage.title ? ` (${onPage.titleLength} chars)` : ''}</td><td>${onPage.title ? (onPage.titleLength >= 30 && onPage.titleLength <= 60 ? goodBadge() : warningBadge()) : criticalBadge()}</td></tr>
          <tr><td>Meta Description</td><td>${escapeHtml(onPage.metaDescription || 'Missing')}${onPage.metaDescription ? ` (${onPage.metaDescriptionLength} chars)` : ''}</td><td>${onPage.metaDescription ? (onPage.metaDescriptionLength >= 120 && onPage.metaDescriptionLength <= 160 ? goodBadge() : warningBadge()) : criticalBadge()}</td></tr>
          <tr><td>H1 Headings</td><td>${onPage.h1.length} found${onPage.h1.length > 0 ? ': ' + escapeHtml(onPage.h1.slice(0, 3).join(', ')) + (onPage.h1.length > 3 ? '...' : '') : ''}</td><td>${onPage.h1.length === 1 ? goodBadge() : onPage.h1.length === 0 ? criticalBadge() : warningBadge()}</td></tr>
          <tr><td>H2 Headings</td><td>${onPage.h2.length} found</td><td>${onPage.h2.length >= 2 ? goodBadge() : onPage.h2.length === 1 ? warningBadge() : warningBadge()}</td></tr>
          <tr><td>H3 Headings</td><td>${onPage.h3.length} found</td><td>${onPage.h3.length >= 1 ? goodBadge() : infoBadge()}</td></tr>
          <tr><td>OG Title</td><td>${escapeHtml(onPage.ogTitle || 'Missing')}</td><td>${onPage.ogTitle ? goodBadge() : infoBadge()}</td></tr>
          <tr><td>OG Description</td><td>${escapeHtml(onPage.ogDescription || 'Missing')}</td><td>${onPage.ogDescription ? goodBadge() : infoBadge()}</td></tr>
          <tr><td>OG Image</td><td>${onPage.ogImage ? 'Present' : 'Missing'}</td><td>${onPage.ogImage ? goodBadge() : infoBadge()}</td></tr>
          <tr><td>Images</td><td>${onPage.imageCount} total, ${onPage.imagesWithAlt} with alt, ${onPage.imagesWithoutAlt} without</td><td>${onPage.imagesWithoutAlt === 0 ? goodBadge() : warningBadge()}</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Technical -->
    <div class="section">
      <h2><span class="icon">&#128295;</span>Technical SEO</h2>
      <table>
        <thead>
          <tr><th>Check</th><th>Value</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr><td>HTTPS</td><td>${onPage.hasHttps ? 'Enabled' : 'Not Enabled'}</td><td>${onPage.hasHttps ? goodBadge() : criticalBadge()}</td></tr>
          <tr><td>Viewport Meta</td><td>${onPage.viewportMeta ? 'Present' : 'Missing'}</td><td>${onPage.viewportMeta ? goodBadge() : criticalBadge()}</td></tr>
          <tr><td>Canonical URL</td><td>${escapeHtml(onPage.canonicalUrl || 'Missing')}</td><td>${onPage.canonicalUrl ? goodBadge() : warningBadge()}</td></tr>
          <tr><td>Charset</td><td>${escapeHtml(onPage.charset || 'Missing')}</td><td>${onPage.charset ? goodBadge() : infoBadge()}</td></tr>
          <tr><td>Language</td><td>${escapeHtml(onPage.lang || 'Missing')}</td><td>${onPage.lang ? goodBadge() : infoBadge()}</td></tr>
          <tr><td>Sitemap.xml</td><td>${onPage.hasSitemap ? 'Found' : 'Not Found'}</td><td>${onPage.hasSitemap ? goodBadge() : infoBadge()}</td></tr>
          <tr><td>Robots.txt</td><td>${onPage.hasRobotsTxt ? 'Found' : 'Not Found'}</td><td>${onPage.hasRobotsTxt ? goodBadge() : infoBadge()}</td></tr>
          <tr><td>Mobile Friendly</td><td>${onPage.isMobileFriendly ? 'Yes' : 'No'}</td><td>${onPage.isMobileFriendly ? goodBadge() : warningBadge()}</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Links -->
    <div class="section">
      <h2><span class="icon">&#128279;</span>Links</h2>
      <table>
        <thead>
          <tr><th>Type</th><th>Count</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr><td>Internal Links</td><td>${onPage.internalLinks}</td><td>${onPage.internalLinks >= 3 ? goodBadge() : warningBadge()}</td></tr>
          <tr><td>External Links</td><td>${onPage.externalLinks}</td><td>${onPage.externalLinks >= 1 ? goodBadge() : infoBadge()}</td></tr>
          <tr><td>Total Links</td><td>${onPage.totalLinks}</td><td>${onPage.totalLinks > 0 ? goodBadge() : warningBadge()}</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Issues -->
    <div class="section">
      <h2><span class="icon">&#9888;</span>Issues (${issues.length} found)</h2>
      <div class="issues-summary">
        <span class="count count-critical">${issuesBySeverity.critical.length} Critical</span>
        <span class="count count-warning">${issuesBySeverity.warning.length} Warnings</span>
        <span class="count count-info">${issuesBySeverity.info.length} Info</span>
      </div>
      ${issues.length > 0 ? `
      <table>
        <thead>
          <tr><th>Severity</th><th>Title</th><th>Impact</th><th>Recommendation</th></tr>
        </thead>
        <tbody>
          ${issues.map(issue => `
          <tr>
            <td><span class="badge badge-${issue.severity}">${capitalize(issue.severity)}</span></td>
            <td><strong>${escapeHtml(issue.title)}</strong><br><small style="color:#6b7280">${escapeHtml(issue.description)}</small></td>
            <td>${capitalize(issue.impact)}</td>
            <td>${escapeHtml(issue.recommendation)}</td>
          </tr>`).join('')}
        </tbody>
      </table>` : '<p style="color:#059669;font-weight:600;">No issues found! Great job.</p>'}
    </div>

    <!-- Suggestions -->
    ${suggestions.length > 0 ? `
    <div class="section">
      <h2><span class="icon">&#128161;</span>Recommendations</h2>
      <ul class="suggestions-list">
        ${suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
      </ul>
    </div>` : ''}

    <!-- Footer -->
    <div class="footer">
      <p>SEO Analysis Report &bull; Generated by SEO Expert &bull; ${new Date(analyzedAt).toLocaleDateString()}</p>
    </div>

  </div>
</body>
</html>`;
}

// ─── Download Helper ──────────────────────────────────────────────────────────

/**
 * Trigger a file download in the browser.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// CSV status helpers
function perfStatus(value: number | null, threshold: number): string {
  if (value === null) return 'N/A';
  return value <= threshold ? 'Good' : value <= threshold * 1.5 ? 'Warning' : 'Poor';
}

function perfStatusMs(value: number | null, threshold: number): string {
  if (value === null) return 'N/A';
  return value <= threshold ? 'Good' : value <= threshold * 3 ? 'Warning' : 'Poor';
}

function clsStatus(value: number | null): string {
  if (value === null) return 'N/A';
  return value <= 0.1 ? 'Good' : value <= 0.25 ? 'Warning' : 'Poor';
}

function tbtStatus(value: number | null): string {
  if (value === null) return 'N/A';
  return value <= 200 ? 'Good' : value <= 600 ? 'Warning' : 'Poor';
}

function scoreToStatus(value: number | null): string {
  if (value === null) return 'N/A';
  return value >= 90 ? 'Good' : value >= 50 ? 'Warning' : 'Poor';
}

// HTML badge helpers
function goodBadge(): string { return '<span class="badge badge-info" style="background:#ecfdf5;color:#059669">Good</span>'; }
function warningBadge(): string { return '<span class="badge badge-warning">Warning</span>'; }
function criticalBadge(): string { return '<span class="badge badge-critical">Critical</span>'; }
function infoBadge(): string { return '<span class="badge badge-info">Info</span>'; }

function perfBadge(value: number | null, threshold: number): string {
  if (value === null) return '<span class="badge badge-info">N/A</span>';
  return value <= threshold ? goodBadge() : value <= threshold * 1.5 ? warningBadge() : criticalBadge();
}

function perfBadgeMs(value: number | null, threshold: number): string {
  if (value === null) return '<span class="badge badge-info">N/A</span>';
  return value <= threshold ? goodBadge() : value <= threshold * 3 ? warningBadge() : criticalBadge();
}

function clsBadge(value: number | null): string {
  if (value === null) return '<span class="badge badge-info">N/A</span>';
  return value <= 0.1 ? goodBadge() : value <= 0.25 ? warningBadge() : criticalBadge();
}

function tbtBadge(value: number | null): string {
  if (value === null) return '<span class="badge badge-info">N/A</span>';
  return value <= 200 ? goodBadge() : value <= 600 ? warningBadge() : criticalBadge();
}

// ─── PDF Report Generation ──────────────────────────────────────────────────

/**
 * Helper: safely truncate text to fit within a given width in jsPDF.
 */
function pdfTruncate(doc: jsPDF, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && doc.getTextWidth(truncated + '...') > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

/**
 * Helper: wrap long text into multiple lines for jsPDF.
 */
function pdfWrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    if (doc.getTextWidth(testLine) > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Helper: get score color for PDF rendering.
 */
function pdfScoreColor(status: string): [number, number, number] {
  if (status === 'good') return [5, 150, 105];
  if (status === 'ok') return [217, 119, 6];
  return [220, 38, 38];
}

/**
 * Helper: get severity color for PDF.
 */
function pdfSeverityColor(severity: string): [number, number, number] {
  if (severity === 'critical') return [220, 38, 38];
  if (severity === 'warning') return [217, 119, 6];
  return [2, 132, 199];
}

/**
 * Helper: get performance metric rating.
 */
function pdfPerfRating(value: number | null, goodThreshold: number, isMs = false): string {
  if (value === null) return 'N/A';
  if (isMs) {
    if (value <= goodThreshold) return 'Good';
    if (value <= goodThreshold * 3) return 'Needs Work';
    return 'Poor';
  }
  if (value <= goodThreshold) return 'Good';
  if (value <= goodThreshold * 1.5) return 'Needs Work';
  return 'Poor';
}

/**
 * Generate a proper multi-page PDF report from an SEO analysis.
 */
export function generatePdfReport(analysis: SiteAnalysisResult, siteName: string): Blob {
  const doc = new jsPDF();
  const { url, analyzedAt, score, status, performance, onPage, readability, issues, suggestions } = analysis;
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = 0;

  // Helper to add new page if needed
  const ensureSpace = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      y = margin;
    }
  };

  // ─── PAGE 1: COVER ─────────────────────────────────────────────────────

  // Green accent bar at top
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, pageW, 6, 'F');

  y = 50;

  // Title
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 46);
  doc.text('SEO Analysis Report', pageW / 2, y, { align: 'center' });

  y += 16;

  // Subtitle
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(siteName, pageW / 2, y, { align: 'center' });

  y += 10;
  doc.setFontSize(11);
  doc.text(url, pageW / 2, y, { align: 'center' });

  y += 20;

  // Score circle (background)
  const scoreColor = pdfScoreColor(status);
  doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.setDrawColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.circle(pageW / 2, y + 15, 28, 'FD');

  // Score number
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(String(score), pageW / 2, y + 22, { align: 'center' });

  // Score label
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(status.toUpperCase(), pageW / 2, y + 32, { align: 'center' });

  y += 60;

  // Date and metadata
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(10);
  doc.text(`Analyzed: ${new Date(analyzedAt).toLocaleString()}`, pageW / 2, y, { align: 'center' });

  y += 8;
  doc.text(`Overall Score: ${score}/100`, pageW / 2, y, { align: 'center' });

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.text('Generated by SEO Expert', pageW / 2, 280, { align: 'center' });

  // ─── PAGE 2: PERFORMANCE ───────────────────────────────────────────────

  doc.addPage();
  y = margin;

  // Green header bar
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, pageW, 6, 'F');

  // Section title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 46);
  doc.text('Performance Analysis', margin, y + 10);
  y += 20;

  // Mobile & Desktop scores
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Mobile Score:', margin, y);
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(performance.mobileScore !== null ? `${performance.mobileScore}/100` : 'N/A', margin + 32, y);

  doc.setTextColor(75, 85, 99);
  doc.setFont('helvetica', 'normal');
  doc.text('Desktop Score:', margin + 80, y);
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(performance.desktopScore !== null ? `${performance.desktopScore}/100` : 'N/A', margin + 115, y);

  y += 15;

  // Core Web Vitals table
  const vitals = [
    ['Metric', 'Value', 'Target', 'Rating'],
    ['Largest Contentful Paint', performance.lcp !== null ? `${performance.lcp}s` : 'N/A', '< 2.5s', pdfPerfRating(performance.lcp, 2.5)],
    ['First Input Delay', performance.fid !== null ? `${performance.fid}ms` : 'N/A', '< 100ms', pdfPerfRating(performance.fid, 100, true)],
    ['Cumulative Layout Shift', performance.cls !== null ? String(performance.cls) : 'N/A', '< 0.1', performance.cls !== null ? (performance.cls <= 0.1 ? 'Good' : performance.cls <= 0.25 ? 'Needs Work' : 'Poor') : 'N/A'],
    ['First Contentful Paint', performance.fcp !== null ? `${performance.fcp}s` : 'N/A', '< 1.8s', pdfPerfRating(performance.fcp, 1.8)],
    ['Time to First Byte', performance.ttfb !== null ? `${performance.ttfb}s` : 'N/A', '< 0.8s', pdfPerfRating(performance.ttfb, 0.8)],
    ['Total Blocking Time', performance.tbt !== null ? `${performance.tbt}ms` : 'N/A', '< 200ms', pdfPerfRating(performance.tbt, 200, true)],
    ['Speed Index', performance.speedIndex !== null ? `${performance.speedIndex}s` : 'N/A', '< 3.4s', pdfPerfRating(performance.speedIndex, 3.4)],
  ];

  const colWidths = [70, 35, 30, 45];
  const tableX = margin;
  const rowH = 9;

  // Draw header row
  doc.setFillColor(16, 185, 129);
  doc.rect(tableX, y, contentW, rowH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  let cx = tableX;
  for (let i = 0; i < 4; i++) {
    doc.text(vitals[0][i], cx + 3, y + 6);
    cx += colWidths[i];
  }
  y += rowH;

  // Draw data rows
  for (let r = 1; r < vitals.length; r++) {
    ensureSpace(rowH + 4);
    // Alternate row background
    if (r % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(tableX, y, contentW, rowH, 'F');
    }

    doc.setTextColor(55, 65, 81);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    cx = tableX;
    for (let c = 0; c < 4; c++) {
      const val = vitals[r][c];
      if (c === 3) {
        // Color-code the rating
        if (val === 'Good') doc.setTextColor(5, 150, 105);
        else if (val === 'Needs Work') doc.setTextColor(217, 119, 6);
        else if (val === 'Poor') doc.setTextColor(220, 38, 38);
        else doc.setTextColor(156, 163, 175);
        doc.text(val, cx + 3, y + 6);
      } else {
        doc.setTextColor(55, 65, 81);
        doc.text(val, cx + 3, y + 6);
      }
      cx += colWidths[c];
    }
    y += rowH;
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('SEO Expert - Performance Analysis', pageW / 2, 280, { align: 'center' });

  // ─── PAGE 3: CONTENT ───────────────────────────────────────────────────

  doc.addPage();
  y = margin;

  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, pageW, 6, 'F');

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 46);
  doc.text('Content Analysis', margin, y + 10);
  y += 20;

  const contentData = [
    ['Element', 'Value', 'Status'],
    ['Page Title', `${onPage.title || 'Missing'} (${onPage.titleLength} chars)`, onPage.title ? (onPage.titleLength >= 30 && onPage.titleLength <= 60 ? 'Good' : 'Needs Work') : 'Critical'],
    ['Meta Description', onPage.metaDescription ? `${onPage.metaDescriptionLength} chars` : 'Missing', onPage.metaDescription ? (onPage.metaDescriptionLength >= 120 && onPage.metaDescriptionLength <= 160 ? 'Good' : 'Needs Work') : 'Critical'],
    ['H1 Headings', `${onPage.h1.length} found`, onPage.h1.length === 1 ? 'Good' : onPage.h1.length === 0 ? 'Critical' : 'Needs Work'],
    ['H2 Headings', `${onPage.h2.length} found`, onPage.h2.length >= 2 ? 'Good' : 'Needs Work'],
    ['H3 Headings', `${onPage.h3.length} found`, onPage.h3.length >= 1 ? 'Good' : 'Info'],
    ['Word Count', `${onPage.wordCount.toLocaleString()} words`, onPage.wordCount >= 600 ? 'Good' : onPage.wordCount >= 300 ? 'Needs Work' : 'Thin'],
    ['Reading Time', `${readability.readingTime} min`, ''],
    ['Images', `${onPage.imageCount} total (${onPage.imagesWithAlt} with alt)`, onPage.imagesWithoutAlt === 0 ? 'Good' : 'Needs Work'],
    ['Internal Links', String(onPage.internalLinks), onPage.internalLinks >= 3 ? 'Good' : 'Needs Work'],
    ['External Links', String(onPage.externalLinks), onPage.externalLinks >= 1 ? 'Good' : 'Info'],
  ];

  const contentColWidths = [55, 85, 40];

  // Header
  doc.setFillColor(16, 185, 129);
  doc.rect(margin, y, contentW, rowH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  cx = margin;
  for (let i = 0; i < 3; i++) {
    doc.text(contentData[0][i], cx + 3, y + 6);
    cx += contentColWidths[i];
  }
  y += rowH;

  // Rows
  for (let r = 1; r < contentData.length; r++) {
    ensureSpace(rowH + 4);
    if (r % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y, contentW, rowH, 'F');
    }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    cx = margin;
    for (let c = 0; c < 3; c++) {
      const val = contentData[r][c];
      if (c === 2 && val) {
        if (val === 'Good') doc.setTextColor(5, 150, 105);
        else if (val === 'Needs Work' || val === 'Thin') doc.setTextColor(217, 119, 6);
        else if (val === 'Critical') doc.setTextColor(220, 38, 38);
        else doc.setTextColor(2, 132, 199);
        doc.text(val, cx + 3, y + 6);
      } else {
        doc.setTextColor(55, 65, 81);
        doc.text(pdfTruncate(doc, val, contentColWidths[c] - 6), cx + 3, y + 6);
      }
      cx += contentColWidths[c];
    }
    y += rowH;
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('SEO Expert - Content Analysis', pageW / 2, 280, { align: 'center' });

  // ─── PAGE 4: ISSUES ────────────────────────────────────────────────────

  doc.addPage();
  y = margin;

  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, pageW, 6, 'F');

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 46);
  doc.text('Issues & Recommendations', margin, y + 10);
  y += 15;

  // Summary counts
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Critical count
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(margin, y, 40, 8, 2, 2, 'F');
  doc.setTextColor(220, 38, 38);
  doc.setFont('helvetica', 'bold');
  doc.text(`${criticalCount} Critical`, margin + 3, y + 5.5);

  // Warning count
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(margin + 46, y, 44, 8, 2, 2, 'F');
  doc.setTextColor(217, 119, 6);
  doc.text(`${warningCount} Warnings`, margin + 49, y + 5.5);

  // Info count
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(margin + 96, y, 34, 8, 2, 2, 'F');
  doc.setTextColor(2, 132, 199);
  doc.text(`${infoCount} Info`, margin + 99, y + 5.5);

  y += 16;

  // Issues table
  if (issues.length > 0) {
    const issueColWidths = [22, 50, 22, contentW - 94];
    const issueRowH = 14;

    // Header
    doc.setFillColor(16, 185, 129);
    doc.rect(margin, y, contentW, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Severity', margin + 2, y + 5.5);
    doc.text('Title', margin + 24, y + 5.5);
    doc.text('Impact', margin + 76, y + 5.5);
    doc.text('Recommendation', margin + 100, y + 5.5);
    y += 8;

    for (const issue of issues) {
      ensureSpace(issueRowH + 6);
      if (y > 260) break; // Safety limit

      // Row background
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, y, contentW, issueRowH, 'F');

      // Severity badge
      const sevColor = pdfSeverityColor(issue.severity);
      doc.setFillColor(sevColor[0], sevColor[1], sevColor[2]);
      doc.roundedRect(margin + 1, y + 1, 20, 5, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.text(issue.severity.toUpperCase(), margin + 3, y + 4.5);

      // Title
      doc.setTextColor(55, 65, 81);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      const titleLines = pdfWrapText(doc, issue.title, issueColWidths[1] - 4);
      doc.text(titleLines[0] || issue.title, margin + 24, y + 5);
      if (titleLines.length > 1) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text(titleLines[1], margin + 24, y + 10);
      }

      // Impact
      doc.setTextColor(55, 65, 81);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(issue.impact, margin + 76, y + 5);

      // Recommendation (truncated)
      doc.setFontSize(7);
      doc.setTextColor(75, 85, 99);
      const recLines = pdfWrapText(doc, issue.recommendation, issueColWidths[3] - 4);
      doc.text(recLines[0] || issue.recommendation, margin + 100, y + 5);
      if (recLines.length > 1) {
        doc.text(recLines[1], margin + 100, y + 10);
      }

      // Border
      doc.setDrawColor(243, 244, 246);
      doc.setLineWidth(0.3);
      doc.line(margin, y + issueRowH, margin + contentW, y + issueRowH);

      y += issueRowH;
    }
  } else {
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('No issues found! Great job.', margin, y + 10);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('SEO Expert - Issues & Recommendations', pageW / 2, 280, { align: 'center' });

  // ─── PAGE 5: READABILITY ───────────────────────────────────────────────

  doc.addPage();
  y = margin;

  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, pageW, 6, 'F');

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 46);
  doc.text('Readability Analysis', margin, y + 10);
  y += 25;

  // Flesch Score card
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, y, 80, 50, 4, 4, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Flesch Reading Ease', margin + 10, y + 14);

  const fleschColor = readability.level === 'easy' ? [5, 150, 105] : readability.level === 'moderate' ? [217, 119, 6] : [220, 38, 38];
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(fleschColor[0], fleschColor[1], fleschColor[2]);
  doc.text(String(readability.fleschScore), margin + 10, y + 35);

  doc.setFontSize(11);
  doc.text(readability.level.toUpperCase(), margin + 10, y + 44);

  // Reading Time card
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin + 90, y, 80, 50, 4, 4, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Estimated Reading Time', margin + 100, y + 14);

  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 46);
  doc.text(`${readability.readingTime}`, margin + 100, y + 35);

  doc.setFontSize(11);
  doc.text('MINUTES', margin + 100, y + 44);

  y += 65;

  // Word count card
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, y, 80, 50, 4, 4, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Total Word Count', margin + 10, y + 14);

  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 46);
  doc.text(onPage.wordCount.toLocaleString(), margin + 10, y + 35);

  doc.setFontSize(11);
  doc.setTextColor(onPage.wordCount >= 600 ? 5 : 217, onPage.wordCount >= 600 ? 150 : 119, onPage.wordCount >= 600 ? 105 : 6);
  doc.text(onPage.wordCount >= 600 ? 'GOOD LENGTH' : 'NEEDS MORE', margin + 10, y + 44);

  // Technical checklist
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin + 90, y, 80, 50, 4, 4, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Technical Checks', margin + 100, y + 14);

  const checks = [
    { label: 'HTTPS', ok: onPage.hasHttps },
    { label: 'Viewport', ok: onPage.viewportMeta },
    { label: 'Canonical', ok: !!onPage.canonicalUrl },
    { label: 'Sitemap', ok: onPage.hasSitemap },
  ];

  let checkY = y + 24;
  doc.setFontSize(9);
  for (const check of checks) {
    doc.setTextColor(check.ok ? 5 : 220, check.ok ? 150 : 38, check.ok ? 105 : 38);
    doc.text(`${check.ok ? '+' : '-'} ${check.label}: ${check.ok ? 'Pass' : 'Fail'}`, margin + 100, checkY);
    checkY += 8;
  }

  y += 70;

  // Suggestions section
  if (suggestions.length > 0) {
    ensureSpace(20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 26, 46);
    doc.text('Recommendations', margin, y);
    y += 10;

    for (const suggestion of suggestions) {
      ensureSpace(12);
      if (y > 260) break;

      // Green left border
      doc.setFillColor(16, 185, 129);
      doc.rect(margin, y, 2, 8, 'F');

      doc.setFillColor(240, 253, 244);
      doc.rect(margin + 2, y, contentW - 2, 8, 'F');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      doc.text(pdfTruncate(doc, suggestion, contentW - 10), margin + 6, y + 5.5);

      y += 10;
    }
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('SEO Expert - Readability Analysis', pageW / 2, 280, { align: 'center' });

  return doc.output('blob');
}

/**
 * Generate a side-by-side comparison PDF between your site and a competitor.
 */
export function generateComparisonPdf(
  yourResult: SiteAnalysisResult,
  compResult: SiteAnalysisResult,
  compUrl: string,
  insights: string[]
): Blob {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pageW - margin * 2;
  const halfW = contentW / 2;
  let y = 0;

  // ─── PAGE 1: SIDE-BY-SIDE COMPARISON ──────────────────────────────────

  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, pageW, 6, 'F');

  y = 20;
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 46);
  doc.text('SEO Comparison Report', pageW / 2, y, { align: 'center' });

  y += 14;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageW / 2, y, { align: 'center' });

  y += 18;

  // Your Site card (left)
  const yourScoreColor = pdfScoreColor(yourResult.status);
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(margin, y, halfW - 5, 55, 4, 4, 'F');
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, halfW - 5, 55, 4, 4, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('YOUR SITE', margin + 10, y + 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(pdfTruncate(doc, yourResult.url, halfW - 20), margin + 10, y + 20);

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(yourScoreColor[0], yourScoreColor[1], yourScoreColor[2]);
  doc.text(String(yourResult.score), margin + 10, y + 42);

  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`/100  ${yourResult.status.toUpperCase()}`, margin + 30, y + 42);

  // Competitor card (right)
  const compScoreColor = pdfScoreColor(compResult.status);
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(margin + halfW + 5, y, halfW - 5, 55, 4, 4, 'F');
  doc.setDrawColor(217, 119, 6);
  doc.roundedRect(margin + halfW + 5, y, halfW - 5, 55, 4, 4, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 119, 6);
  doc.text('COMPETITOR', margin + halfW + 15, y + 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(pdfTruncate(doc, compUrl, halfW - 20), margin + halfW + 15, y + 20);

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(compScoreColor[0], compScoreColor[1], compScoreColor[2]);
  doc.text(String(compResult.score), margin + halfW + 15, y + 42);

  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`/100  ${compResult.status.toUpperCase()}`, margin + halfW + 35, y + 42);

  y += 68;

  // Score comparison table
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 46);
  doc.text('Score Breakdown', margin, y);
  y += 10;

  const categories = [
    ['Category', 'Your Site', 'Competitor', 'Winner'],
    ['Overall Score', String(yourResult.score), String(compResult.score), yourResult.score > compResult.score ? 'You' : yourResult.score < compResult.score ? 'Comp' : 'Tie'],
    ['Mobile Score', yourResult.performance.mobileScore !== null ? String(yourResult.performance.mobileScore) : 'N/A', compResult.performance.mobileScore !== null ? String(compResult.performance.mobileScore) : 'N/A', (yourResult.performance.mobileScore ?? 0) > (compResult.performance.mobileScore ?? 0) ? 'You' : (yourResult.performance.mobileScore ?? 0) < (compResult.performance.mobileScore ?? 0) ? 'Comp' : 'Tie'],
    ['Desktop Score', yourResult.performance.desktopScore !== null ? String(yourResult.performance.desktopScore) : 'N/A', compResult.performance.desktopScore !== null ? String(compResult.performance.desktopScore) : 'N/A', (yourResult.performance.desktopScore ?? 0) > (compResult.performance.desktopScore ?? 0) ? 'You' : (yourResult.performance.desktopScore ?? 0) < (compResult.performance.desktopScore ?? 0) ? 'Comp' : 'Tie'],
    ['Word Count', String(yourResult.onPage.wordCount), String(compResult.onPage.wordCount), yourResult.onPage.wordCount > compResult.onPage.wordCount ? 'You' : yourResult.onPage.wordCount < compResult.onPage.wordCount ? 'Comp' : 'Tie'],
    ['Internal Links', String(yourResult.onPage.internalLinks), String(compResult.onPage.internalLinks), yourResult.onPage.internalLinks > compResult.onPage.internalLinks ? 'You' : yourResult.onPage.internalLinks < compResult.onPage.internalLinks ? 'Comp' : 'Tie'],
    ['External Links', String(yourResult.onPage.externalLinks), String(compResult.onPage.externalLinks), yourResult.onPage.externalLinks > compResult.onPage.externalLinks ? 'You' : yourResult.onPage.externalLinks < compResult.onPage.externalLinks ? 'Comp' : 'Tie'],
    ['HTTPS', yourResult.onPage.hasHttps ? 'Yes' : 'No', compResult.onPage.hasHttps ? 'Yes' : 'No', yourResult.onPage.hasHttps === compResult.onPage.hasHttps ? 'Tie' : yourResult.onPage.hasHttps ? 'You' : 'Comp'],
    ['Readability', `${yourResult.readability.fleschScore} (${yourResult.readability.level})`, `${compResult.readability.fleschScore} (${compResult.readability.level})`, ''],
  ];

  const catColWidths = [45, 45, 45, 45];
  const catRowH = 8;

  // Header
  doc.setFillColor(16, 185, 129);
  doc.rect(margin, y, contentW, catRowH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  let cx = margin;
  for (let i = 0; i < 4; i++) {
    doc.text(categories[0][i], cx + 3, y + 5.5);
    cx += catColWidths[i];
  }
  y += catRowH;

  // Data rows
  for (let r = 1; r < categories.length; r++) {
    if (y + catRowH > 260) {
      doc.addPage();
      y = margin;
    }

    if (r % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y, contentW, catRowH, 'F');
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    cx = margin;
    for (let c = 0; c < 4; c++) {
      const val = categories[r][c];
      if (c === 3 && val) {
        if (val === 'You') { doc.setTextColor(5, 150, 105); doc.setFont('helvetica', 'bold'); }
        else if (val === 'Comp') { doc.setTextColor(217, 119, 6); doc.setFont('helvetica', 'bold'); }
        else { doc.setTextColor(156, 163, 175); doc.setFont('helvetica', 'normal'); }
        doc.text(val, cx + 3, y + 5.5);
        doc.setFont('helvetica', 'normal');
      } else {
        doc.setTextColor(55, 65, 81);
        doc.text(val, cx + 3, y + 5.5);
      }
      cx += catColWidths[c];
    }
    y += catRowH;
  }

  // ─── PAGE 2: INSIGHTS ──────────────────────────────────────────────────

  doc.addPage();
  y = margin;

  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, pageW, 6, 'F');

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 46);
  doc.text('Comparison Insights', margin, y + 10);

  y += 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Actionable insights from comparing your site with the competitor:', margin, y);

  y += 14;

  for (let i = 0; i < insights.length; i++) {
    const insightLines = pdfWrapText(doc, insights[i], contentW - 20);
    const neededHeight = insightLines.length * 6 + 8;

    if (y + neededHeight > 265) {
      doc.addPage();
      y = margin;
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, pageW, 6, 'F');
    }

    // Number badge
    doc.setFillColor(16, 185, 129);
    doc.circle(margin + 6, y + 4, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(String(i + 1), margin + 6, y + 6, { align: 'center' });

    // Insight text
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    for (let j = 0; j < insightLines.length; j++) {
      doc.text(insightLines[j], margin + 16, y + 5 + j * 6);
    }

    y += neededHeight + 4;
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('SEO Expert - Comparison Report', pageW / 2, 280, { align: 'center' });

  return doc.output('blob');
}

// ─── Download Helpers ────────────────────────────────────────────────────────

/**
 * Download a Blob as a file.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Generate and download a PDF report.
 */
export function downloadPdfReport(analysis: SiteAnalysisResult, siteName: string): void {
  const blob = generatePdfReport(analysis, siteName);
  downloadBlob(blob, `seo-report-${siteName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}

/**
 * Generate and download a comparison PDF report.
 */
export function downloadComparisonPdf(
  yourResult: SiteAnalysisResult,
  compResult: SiteAnalysisResult,
  compUrl: string,
  insights: string[]
): void {
  const blob = generateComparisonPdf(yourResult, compResult, compUrl, insights);
  downloadBlob(blob, `seo-comparison-${Date.now()}.pdf`);
}
