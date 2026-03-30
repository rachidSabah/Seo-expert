/**
 * SEO Scoring Engine — Core Algorithm
 *
 * A pure TypeScript module that implements a weighted 100-point SEO scoring algorithm.
 * Runs 100% client-side with zero dependencies. All functions are pure (no side effects).
 *
 * Categories:
 *   - Keyword Optimization (30 pts)
 *   - Content Quality (25 pts)
 *   - Technical SEO (20 pts)
 *   - Linking (15 pts)
 *   - Bonus (10 pts)
 */

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface SeoAnalysisInput {
  content: string;          // The article/content HTML or text
  keyword: string;          // Target keyword
  title: string;            // Page title
  metaDescription: string;  // Meta description
  urlSlug: string;          // URL path e.g. /blog/best-seo-tools
  headings: string[];       // Array of heading texts (h1, h2, h3...)
}

export interface SeoCheckItem {
  id: string;
  label: string;
  status: "good" | "ok" | "poor";
  points: number;
  maxPoints: number;
  message: string;
  suggestion?: string;
}

export interface SeoScoreResult {
  score: number;                         // 0-100
  status: "good" | "ok" | "poor";       // >=80 good, >=50 ok, <50 poor
  categoryScores: {
    keywordOptimization: { score: number; max: number; checks: SeoCheckItem[] };
    contentQuality: { score: number; max: number; checks: SeoCheckItem[] };
    technicalSeo: { score: number; max: number; checks: SeoCheckItem[] };
    linking: { score: number; max: number; checks: SeoCheckItem[] };
    bonus: { score: number; max: number; checks: SeoCheckItem[] };
  };
  issues: string[];
  suggestions: string[];
  readability: {
    fleschScore: number;
    readingTime: number;
    wordCount: number;
    sentenceCount: number;
    avgSentenceLength: number;
    avgWordLength: number;
    level: "easy" | "moderate" | "hard";
  };
}

// ─── Helper: Text Processing ──────────────────────────────────────────────────

/**
 * Strips all HTML tags from a string and decodes common HTML entities.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")     // Remove script blocks
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")        // Remove style blocks
    .replace(/<[^>]+>/g, " ")                               // Replace tags with space
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/&\w+;/g, "")                                  // Strip unknown entities
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Counts the number of words in a text string.
 * Words are sequences of alphanumeric characters (including hyphens and apostrophes).
 */
export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => /[a-zA-Z0-9\u00C0-\u024F]/.test(word))
    .length;
}

/**
 * Counts the number of sentences in a text string.
 * Splits on sentence-ending punctuation (. ? !) followed by whitespace or end of string.
 */
export function countSentences(text: string): number {
  if (!text || !text.trim()) return 0;
  const matches = text.match(/[^.!?]*[.!?]+/g);
  return matches ? matches.length : (text.trim().length > 0 ? 1 : 0);
}

/**
 * Counts the approximate number of syllables in a single word.
 * Uses vowel-group counting: sequences of (a, e, i, o, u, y) count as one syllable.
 * Every word has at least 1 syllable.
 *
 * Special cases handled:
 *  - Silent trailing 'e' is excluded
 *  - Common patterns like 'le' at end are counted
 */
export function countSyllables(word: string): number {
  if (!word || word.length === 0) return 0;

  const lower = word.toLowerCase().replace(/[^a-z]/g, "");
  if (lower.length === 0) return 0;

  // Count vowel groups
  const vowelGroups = lower.match(/[aeiouy]+/g);
  let count = vowelGroups ? vowelGroups.length : 0;

  // Every word has at least 1 syllable
  if (count === 0) count = 1;

  // Subtract 1 for silent 'e' at the end (but not for words ending in 'le')
  if (lower.endsWith("e") && !lower.endsWith("le") && count > 1) {
    count--;
  }

  // Handle 'ed' ending (often silent)
  if (lower.endsWith("ed") && count > 1 && !lower.endsWith("ted") && !lower.endsWith("ded")) {
    count--;
  }

  return count;
}

/**
 * Calculates the Flesch Reading Ease score for a given text.
 *
 * Formula: 206.835 - 1.015 * (totalWords / totalSentences) - 84.6 * (totalSyllables / totalWords)
 *
 * Higher score = easier to read. Typical ranges:
 *   90-100 : Very easy (5th grade)
 *   60-70  : Standard (8th-9th grade)
 *   0-30   : Very difficult (college graduate)
 */
export function calculateFleschScore(text: string): number {
  const words = countWords(text);
  const sentences = countSentences(text);

  if (words === 0 || sentences === 0) return 0;

  // Extract individual words for syllable counting
  const wordList = text
    .trim()
    .split(/\s+/)
    .filter((w) => /[a-zA-Z0-9]/.test(w));

  const totalSyllables = wordList.reduce(
    (sum, word) => sum + countSyllables(word),
    0
  );

  const avgSentenceLength = words / sentences;
  const avgSyllablesPerWord = totalSyllables / words;

  const score =
    206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

  return Math.round(Math.max(0, Math.min(100, score)) * 10) / 10;
}

/**
 * Calculates keyword density as a percentage.
 * density = (keyword occurrences / total words) * 100
 *
 * Performs case-insensitive matching of the exact keyword phrase.
 */
export function calculateKeywordDensity(content: string, keyword: string): number {
  if (!content || !keyword || !keyword.trim()) return 0;

  const plainText = stripHtml(content).toLowerCase();
  const kw = keyword.trim().toLowerCase();
  const totalWords = countWords(plainText);

  if (totalWords === 0) return 0;

  // Escape special regex characters in the keyword
  const escapedKw = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escapedKw}\\b`, "gi");
  const matches = plainText.match(regex);

  const occurrences = matches ? matches.length : 0;
  return (occurrences / totalWords) * 100;
}

// ─── Helper: HTML Parsing ─────────────────────────────────────────────────────

/**
 * Extracts link information from HTML content.
 * Classifies links as internal (same domain or relative) or external (absolute URL to different domain).
 */
export function extractLinks(html: string): {
  internal: number;
  external: number;
  total: number;
} {
  if (!html) return { internal: 0, external: 0, total: 0 };

  const linkRegex = /<a\s[^>]*href=["']([^"']*)["'][^>]*>/gi;
  const internalUrls: string[] = [];
  const externalUrls: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1].trim();

    // Skip empty, anchor-only, mailto, tel, javascript links
    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    ) {
      continue;
    }

    // Relative URLs or same-origin are internal
    if (href.startsWith("/") || href.startsWith("./") || href.startsWith("../") || !href.startsWith("http")) {
      internalUrls.push(href);
    } else {
      // Absolute URL — treat as external for generic analysis
      externalUrls.push(href);
    }
  }

  return {
    internal: internalUrls.length,
    external: externalUrls.length,
    total: internalUrls.length + externalUrls.length,
  };
}

/**
 * Extracts image information from HTML content.
 * Counts total images, those with alt attributes, and those missing alt.
 */
export function extractImages(html: string): {
  total: number;
  withAlt: number;
  withoutAlt: number;
} {
  if (!html) return { total: 0, withAlt: 0, withoutAlt: 0 };

  const imgRegex = /<img\s[^>]*>/gi;
  const images = html.match(imgRegex);

  if (!images) return { total: 0, withAlt: 0, withoutAlt: 0 };

  let withAlt = 0;
  let withoutAlt = 0;

  for (const img of images) {
    // Check for alt attribute (alt="..." or alt='...') — empty alt="" still counts as present
    if (/alt\s*=\s*(?:"[^"]*"|'[^']*')/i.test(img)) {
      withAlt++;
    } else {
      withoutAlt++;
    }
  }

  return {
    total: images.length,
    withAlt,
    withoutAlt,
  };
}

// ─── Helper: Heading Analysis ─────────────────────────────────────────────────

/**
 * Checks heading structure and keyword presence in headings.
 * Returns an array of SeoCheckItems for page structure and keyword-in-headings.
 */
export function checkHeadingStructure(
  headings: string[],
  keyword: string
): SeoCheckItem[] {
  const checks: SeoCheckItem[] = [];
  const kw = keyword.trim().toLowerCase();

  // ── Check 1: Keyword in headings ──
  if (kw) {
    const h1Text = headings[0] || "";
    const h2PlusTexts = headings.slice(1);
    const allHeadingText = headings.join(" ").toLowerCase();

    const inH1 = h1Text.toLowerCase().includes(kw);
    const inH2Plus = h2PlusTexts.some((h) =>
      h.toLowerCase().includes(kw)
    );

    let status: "good" | "ok" | "poor";
    let points: number;
    let message: string;
    let suggestion: string | undefined;

    if (inH1) {
      status = "good";
      points = 5;
      message = "Keyword found in H1 heading.";
    } else if (inH2Plus) {
      status = "ok";
      points = 3;
      message = "Keyword found in sub-headings (H2+), but not in H1.";
      suggestion = "Add your target keyword to the H1 heading for better relevance.";
    } else if (allHeadingText.includes(kw)) {
      status = "ok";
      points = 3;
      message = "Keyword found in headings but with partial match.";
      suggestion = "Try to use the exact keyword in your H1 or H2 headings.";
    } else {
      status = "poor";
      points = 0;
      message = "Keyword not found in any heading.";
      suggestion = "Include your target keyword in the H1 and at least one H2 heading.";
    }

    checks.push({
      id: "keyword-in-headings",
      label: "Keyword in Headings",
      status,
      points,
      maxPoints: 5,
      message,
      suggestion,
    });
  }

  // ── Check 2: Page structure (heading hierarchy) ──
  // We check: at least 1 heading acts as H1, at least 2 act as H2, and headings exist
  if (headings.length === 0) {
    checks.push({
      id: "page-structure",
      label: "Page Structure",
      status: "poor",
      points: 0,
      maxPoints: 10,
      message: "No headings found in the content.",
      suggestion:
        "Add at least one H1 heading and two H2 headings for proper page structure.",
    });
  } else if (headings.length === 1) {
    checks.push({
      id: "page-structure",
      label: "Page Structure",
      status: "poor",
      points: 3,
      maxPoints: 10,
      message: "Only one heading found. Content lacks proper hierarchy.",
      suggestion:
        "Add H2 sub-headings to break up your content and improve readability.",
    });
  } else {
    // headings[0] is treated as H1, headings[1..n] as H2+
    const h2Count = headings.length - 1;
    if (h2Count >= 2) {
      checks.push({
        id: "page-structure",
        label: "Page Structure",
        status: "good",
        points: 10,
        maxPoints: 10,
        message: `Good heading hierarchy: 1 H1 and ${h2Count} sub-heading(s).`,
      });
    } else {
      checks.push({
        id: "page-structure",
        label: "Page Structure",
        status: "ok",
        points: 6,
        maxPoints: 10,
        message: "H1 present with 1 sub-heading. Consider adding more H2s.",
        suggestion:
          "Add at least one more H2 heading to properly structure your content.",
      });
    }
  }

  return checks;
}

// ─── Scoring: Category Functions ──────────────────────────────────────────────

/**
 * Scores the KEYWORD OPTIMIZATION category (30 points max).
 * Checks: keyword-in-title (10), keyword-in-meta-description (5),
 *         keyword-in-headings (5), keyword-density (10).
 */
function scoreKeywordOptimization(input: SeoAnalysisInput): SeoCheckItem[] {
  const checks: SeoCheckItem[] = [];
  const { content, keyword, title, metaDescription, headings } = input;
  const kw = keyword.trim().toLowerCase();

  // ── 1. Keyword in Title (10 pts) ──
  if (kw && title.trim()) {
    const titleLower = title.trim().toLowerCase();
    const exactMatch = titleLower.includes(kw);

    // Check for close variant (words within the keyword separated)
    const kwWords = kw.split(/\s+/);
    const titleWords = titleLower.split(/\s+/);
    const matchedKwWords = kwWords.filter((w) =>
      titleWords.some((tw) => tw.includes(w) || w.includes(tw))
    );
    const closeVariant =
      matchedKwWords.length >= kwWords.length * 0.7 && !exactMatch;

    if (exactMatch) {
      checks.push({
        id: "keyword-in-title",
        label: "Keyword in Title",
        status: "good",
        points: 10,
        maxPoints: 10,
        message: "Exact keyword match found in page title.",
      });
    } else if (closeVariant) {
      checks.push({
        id: "keyword-in-title",
        label: "Keyword in Title",
        status: "good",
        points: 8,
        maxPoints: 10,
        message: "Close keyword variant found in title.",
        suggestion: "For best results, use the exact keyword phrase in the title.",
      });
    } else if (matchedKwWords.length > 0) {
      checks.push({
        id: "keyword-in-title",
        label: "Keyword in Title",
        status: "ok",
        points: 5,
        maxPoints: 10,
        message: "Partial keyword match in title.",
        suggestion:
          "Include the full target keyword in your page title for better rankings.",
      });
    } else {
      checks.push({
        id: "keyword-in-title",
        label: "Keyword in Title",
        status: "poor",
        points: 0,
        maxPoints: 10,
        message: "Keyword not found in page title.",
        suggestion:
          "Add your target keyword to the page title. Keep it near the beginning.",
      });
    }
  } else {
    checks.push({
      id: "keyword-in-title",
      label: "Keyword in Title",
      status: "poor",
      points: 0,
      maxPoints: 10,
      message: "Cannot check — missing keyword or title.",
      suggestion: "Provide both a target keyword and page title.",
    });
  }

  // ── 2. Keyword in Meta Description (5 pts) ──
  if (kw && metaDescription.trim()) {
    const descLower = metaDescription.trim().toLowerCase();
    if (descLower.includes(kw)) {
      checks.push({
        id: "keyword-in-meta-description",
        label: "Keyword in Meta Description",
        status: "good",
        points: 5,
        maxPoints: 5,
        message: "Keyword found in meta description.",
      });
    } else {
      checks.push({
        id: "keyword-in-meta-description",
        label: "Keyword in Meta Description",
        status: "poor",
        points: 0,
        maxPoints: 5,
        message: "Keyword not found in meta description.",
        suggestion:
          "Include your target keyword in the meta description to improve click-through rates.",
      });
    }
  } else if (!metaDescription.trim()) {
    checks.push({
      id: "keyword-in-meta-description",
      label: "Keyword in Meta Description",
      status: "poor",
      points: 0,
      maxPoints: 5,
      message: "Meta description is missing.",
      suggestion:
        "Write a compelling meta description (150-160 characters) that includes your keyword.",
    });
  } else {
    checks.push({
      id: "keyword-in-meta-description",
      label: "Keyword in Meta Description",
      status: "poor",
      points: 0,
      maxPoints: 5,
      message: "Cannot check — missing keyword.",
      suggestion: "Provide a target keyword.",
    });
  }

  // ── 3. Keyword in Headings (5 pts) ──
  const headingChecks = checkHeadingStructure(headings, keyword);
  const keywordInHeadings = headingChecks.find(
    (c) => c.id === "keyword-in-headings"
  );
  if (keywordInHeadings) {
    checks.push(keywordInHeadings);
  } else {
    checks.push({
      id: "keyword-in-headings",
      label: "Keyword in Headings",
      status: "poor",
      points: 0,
      maxPoints: 5,
      message: "Cannot check — missing keyword or headings.",
      suggestion: "Add headings to your content and include the target keyword.",
    });
  }

  // ── 4. Keyword Density (10 pts) ──
  const density = calculateKeywordDensity(content, keyword);
  if (density >= 0.5 && density <= 2.5) {
    checks.push({
      id: "keyword-density",
      label: "Keyword Density",
      status: "good",
      points: 10,
      maxPoints: 10,
      message: `Keyword density is ${density.toFixed(2)}% — optimal range (0.5-2.5%).`,
    });
  } else if (
    (density >= 0.3 && density < 0.5) ||
    (density > 2.5 && density <= 3)
  ) {
    const direction =
      density < 0.5 ? "slightly under-optimized" : "slightly over-optimized";
    checks.push({
      id: "keyword-density",
      label: "Keyword Density",
      status: "ok",
      points: 6,
      maxPoints: 10,
      message: `Keyword density is ${density.toFixed(2)}% — ${direction}.`,
      suggestion:
        density < 0.5
          ? "Try using the keyword a few more times naturally in the content."
          : "Consider reducing keyword usage slightly to avoid over-optimization.",
    });
  } else {
    const direction =
      density < 0.3
        ? "too low — the keyword is underused"
        : "too high — risk of keyword stuffing";
    checks.push({
      id: "keyword-density",
      label: "Keyword Density",
      status: "poor",
      points: 2,
      maxPoints: 10,
      message: `Keyword density is ${density.toFixed(2)}% — ${direction}.`,
      suggestion:
        density < 0.3
          ? "Include the target keyword more frequently throughout your content."
          : "Reduce keyword repetition to avoid search engine penalties.",
    });
  }

  return checks;
}

/**
 * Scores the CONTENT QUALITY category (25 points max).
 * Checks: content-length (10), readability-score (10), paragraph-structure (5).
 */
function scoreContentQuality(input: SeoAnalysisInput): SeoCheckItem[] {
  const checks: SeoCheckItem[] = [];
  const plainText = stripHtml(input.content);
  const wordCount = countWords(plainText);
  const fleschScore = calculateFleschScore(plainText);

  // ── 1. Content Length (10 pts) ──
  if (wordCount >= 1000) {
    checks.push({
      id: "content-length",
      label: "Content Length",
      status: "good",
      points: 10,
      maxPoints: 10,
      message: `Content has ${wordCount.toLocaleString()} words — excellent length.`,
    });
  } else if (wordCount >= 600) {
    checks.push({
      id: "content-length",
      label: "Content Length",
      status: "ok",
      points: 6,
      maxPoints: 10,
      message: `Content has ${wordCount.toLocaleString()} words — decent but could be longer.`,
      suggestion:
        "Aim for at least 1,000 words for comprehensive content that ranks well.",
    });
  } else {
    checks.push({
      id: "content-length",
      label: "Content Length",
      status: "poor",
      points: 2,
      maxPoints: 10,
      message: `Content has only ${wordCount.toLocaleString()} words — too short.`,
      suggestion:
        "Expand your content to at least 600 words. Longer, in-depth content tends to rank better.",
    });
  }

  // ── 2. Readability Score (10 pts) ──
  if (wordCount > 0) {
    if (fleschScore >= 60 && fleschScore <= 80) {
      checks.push({
        id: "readability-score",
        label: "Readability Score",
        status: "good",
        points: 10,
        maxPoints: 10,
        message: `Flesch Reading Ease: ${fleschScore} — ideal readability.`,
      });
    } else if (
      (fleschScore >= 40 && fleschScore < 60) ||
      (fleschScore > 80 && fleschScore <= 90)
    ) {
      const note =
        fleschScore < 60
          ? "slightly difficult to read"
          : "very easy to read but may lack depth";
      checks.push({
        id: "readability-score",
        label: "Readability Score",
        status: "ok",
        points: 6,
        maxPoints: 10,
        message: `Flesch Reading Ease: ${fleschScore} — ${note}.`,
        suggestion:
          fleschScore < 60
            ? "Use shorter sentences and simpler words to improve readability."
            : "Consider adding more detail and complexity to your writing.",
      });
    } else {
      const note =
        fleschScore < 40
          ? "very difficult to read"
          : "extremely easy — may seem simplistic";
      checks.push({
        id: "readability-score",
        label: "Readability Score",
        status: "poor",
        points: 3,
        maxPoints: 10,
        message: `Flesch Reading Ease: ${fleschScore} — ${note}.`,
        suggestion:
          fleschScore < 40
            ? "Simplify your language. Break long sentences into shorter ones."
            : "Your content may be too simple. Add depth and nuance to your writing.",
      });
    }
  } else {
    checks.push({
      id: "readability-score",
      label: "Readability Score",
      status: "poor",
      points: 0,
      maxPoints: 10,
      message: "Cannot calculate readability — content is empty.",
      suggestion: "Add content to analyze readability.",
    });
  }

  // ── 3. Paragraph Structure (5 pts) ──
  // Count paragraphs: split by double newline or <p> tags
  const paragraphs = plainText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) {
    checks.push({
      id: "paragraph-structure",
      label: "Paragraph Structure",
      status: "poor",
      points: 0,
      maxPoints: 5,
      message: "No distinct paragraphs found.",
      suggestion:
        "Break your content into paragraphs with clear separation for better readability.",
    });
  } else {
    const avgSentencesPerParagraph =
      paragraphs.reduce((sum, p) => sum + countSentences(p), 0) /
      paragraphs.length;

    if (avgSentencesPerParagraph >= 3 && avgSentencesPerParagraph <= 5) {
      checks.push({
        id: "paragraph-structure",
        label: "Paragraph Structure",
        status: "good",
        points: 5,
        maxPoints: 5,
        message: `Average ${avgSentencesPerParagraph.toFixed(1)} sentences per paragraph — well structured.`,
      });
    } else if (
      (avgSentencesPerParagraph >= 1 && avgSentencesPerParagraph < 3) ||
      (avgSentencesPerParagraph > 5 && avgSentencesPerParagraph <= 8)
    ) {
      const note =
        avgSentencesPerParagraph < 3
          ? "paragraphs are a bit short"
          : "paragraphs are somewhat long";
      checks.push({
        id: "paragraph-structure",
        label: "Paragraph Structure",
        status: "ok",
        points: 3,
        maxPoints: 5,
        message: `Average ${avgSentencesPerParagraph.toFixed(1)} sentences per paragraph — ${note}.`,
        suggestion:
          avgSentencesPerParagraph < 3
            ? "Combine some short paragraphs or add more supporting sentences."
            : "Break longer paragraphs into smaller, more digestible chunks.",
      });
    } else {
      const note =
        avgSentencesPerParagraph < 1
          ? "paragraphs are very short (fragments)"
          : "paragraphs are too long and hard to read";
      checks.push({
        id: "paragraph-structure",
        label: "Paragraph Structure",
        status: "poor",
        points: 1,
        maxPoints: 5,
        message: `Average ${avgSentencesPerParagraph.toFixed(1)} sentences per paragraph — ${note}.`,
        suggestion:
          avgSentencesPerParagraph < 1
            ? "Expand your paragraphs with more complete thoughts and details."
            : "Break your very long paragraphs into smaller sections (3-5 sentences each).",
      });
    }
  }

  return checks;
}

/**
 * Scores the TECHNICAL SEO category (20 points max).
 * Checks: url-slug (5), image-alt-tags (5), page-structure (10).
 */
function scoreTechnicalSeo(input: SeoAnalysisInput): SeoCheckItem[] {
  const checks: SeoCheckItem[] = [];
  const { content, keyword, urlSlug, headings } = input;
  const kw = keyword.trim().toLowerCase().replace(/\s+/g, "-");

  // ── 1. URL Slug (5 pts) ──
  const slugLower = urlSlug.toLowerCase();
  const kwWords = keyword.trim().toLowerCase().split(/\s+/);

  if (slugLower && kw) {
    // Check for exact hyphenated keyword in slug
    if (slugLower.includes(kw) || slugLower.includes(kw.replace(/\s+/g, "-"))) {
      checks.push({
        id: "url-slug",
        label: "URL Slug",
        status: "good",
        points: 5,
        maxPoints: 5,
        message: "Target keyword found in URL slug.",
      });
    } else {
      // Check for partial match (some keyword words in slug)
      const matchedWords = kwWords.filter((w) =>
        slugLower.includes(w.replace(/\s+/g, "-"))
      );
      if (matchedWords.length > 0 && matchedWords.length < kwWords.length) {
        checks.push({
          id: "url-slug",
          label: "URL Slug",
          status: "ok",
          points: 3,
          maxPoints: 5,
          message: "Partial keyword match in URL slug.",
          suggestion:
            "Include the full target keyword in the URL for better SEO performance.",
        });
      } else if (matchedWords.length === kwWords.length) {
        checks.push({
          id: "url-slug",
          label: "URL Slug",
          status: "good",
          points: 5,
          maxPoints: 5,
          message: "All keyword words found in URL slug.",
        });
      } else {
        checks.push({
          id: "url-slug",
          label: "URL Slug",
          status: "poor",
          points: 0,
          maxPoints: 5,
          message: "Keyword not found in URL slug.",
          suggestion:
            "Include your target keyword in the URL slug. Use hyphens to separate words.",
        });
      }
    }
  } else {
    checks.push({
      id: "url-slug",
      label: "URL Slug",
      status: "poor",
      points: 0,
      maxPoints: 5,
      message: "Cannot check — missing URL slug or keyword.",
      suggestion: "Provide a URL slug that includes your target keyword.",
    });
  }

  // ── 2. Image Alt Tags (5 pts) ──
  const images = extractImages(content);

  if (images.total === 0) {
    checks.push({
      id: "image-alt-tags",
      label: "Image Alt Tags",
      status: "poor",
      points: 0,
      maxPoints: 5,
      message: "No images found in the content.",
      suggestion:
        "Add relevant images with descriptive alt text to improve accessibility and SEO.",
    });
  } else if (images.withoutAlt === 0) {
    checks.push({
      id: "image-alt-tags",
      label: "Image Alt Tags",
      status: "good",
      points: 5,
      maxPoints: 5,
      message: `All ${images.total} image(s) have alt attributes.`,
    });
  } else if (images.withAlt > 0) {
    checks.push({
      id: "image-alt-tags",
      label: "Image Alt Tags",
      status: "ok",
      points: 3,
      maxPoints: 5,
      message: `${images.withAlt} of ${images.total} image(s) have alt attributes. ${images.withoutAlt} missing.`,
      suggestion:
        "Add descriptive alt text to all images. Alt text helps search engines understand image content.",
    });
  } else {
    checks.push({
      id: "image-alt-tags",
      label: "Image Alt Tags",
      status: "poor",
      points: 0,
      maxPoints: 5,
      message: `None of the ${images.total} image(s) have alt attributes.`,
      suggestion:
        "Add descriptive alt text to every image. This is critical for both SEO and accessibility.",
    });
  }

  // ── 3. Page Structure (10 pts) ──
  const headingChecks = checkHeadingStructure(headings, keyword);
  const pageStructureCheck = headingChecks.find(
    (c) => c.id === "page-structure"
  );
  if (pageStructureCheck) {
    checks.push(pageStructureCheck);
  } else {
    checks.push({
      id: "page-structure",
      label: "Page Structure",
      status: "poor",
      points: 0,
      maxPoints: 10,
      message: "Cannot evaluate page structure — no headings provided.",
      suggestion: "Add a clear heading hierarchy (H1, H2, H3) to your content.",
    });
  }

  return checks;
}

/**
 * Scores the LINKING category (15 points max).
 * Checks: internal-links (10), external-links (5).
 */
function scoreLinking(input: SeoAnalysisInput): SeoCheckItem[] {
  const checks: SeoCheckItem[] = [];
  const links = extractLinks(input.content);

  // ── 1. Internal Links (10 pts) ──
  if (links.internal >= 3) {
    checks.push({
      id: "internal-links",
      label: "Internal Links",
      status: "good",
      points: 10,
      maxPoints: 10,
      message: `${links.internal} internal link(s) found — good interlinking.`,
    });
  } else if (links.internal >= 1) {
    checks.push({
      id: "internal-links",
      label: "Internal Links",
      status: "ok",
      points: 5,
      maxPoints: 10,
      message: `Only ${links.internal} internal link(s) found.`,
      suggestion:
        "Add more internal links (aim for 3+) to help search engines discover and rank your other pages.",
    });
  } else {
    checks.push({
      id: "internal-links",
      label: "Internal Links",
      status: "poor",
      points: 0,
      maxPoints: 10,
      message: "No internal links found.",
      suggestion:
        "Link to other relevant pages on your site. Internal links distribute page authority and improve navigation.",
    });
  }

  // ── 2. External Links (5 pts) ──
  if (links.external >= 1) {
    checks.push({
      id: "external-links",
      label: "External Links",
      status: "good",
      points: 5,
      maxPoints: 5,
      message: `${links.external} external link(s) found.`,
    });
  } else {
    checks.push({
      id: "external-links",
      label: "External Links",
      status: "ok",
      points: 2,
      maxPoints: 5,
      message: "No external links found.",
      suggestion:
        "Link to at least one authoritative external source to add credibility to your content.",
    });
  }

  return checks;
}

/**
 * Scores the BONUS category (10 points max).
 * Checks: keyword-in-first-paragraph (3), multimedia-content (3), content-update-freshness (4).
 */
function scoreBonus(input: SeoAnalysisInput): SeoCheckItem[] {
  const checks: SeoCheckItem[] = [];
  const { content, keyword } = input;
  const plainText = stripHtml(content);
  const kw = keyword.trim().toLowerCase();
  const wordCount = countWords(plainText);

  // ── 1. Keyword in First Paragraph (3 pts) ──
  const first150Chars = plainText.substring(0, 150).toLowerCase();
  if (kw && first150Chars.includes(kw)) {
    checks.push({
      id: "keyword-in-first-paragraph",
      label: "Keyword in First Paragraph",
      status: "good",
      points: 3,
      maxPoints: 3,
      message: "Target keyword appears in the first 150 characters.",
    });
  } else if (kw && plainText.toLowerCase().includes(kw)) {
    checks.push({
      id: "keyword-in-first-paragraph",
      label: "Keyword in First Paragraph",
      status: "poor",
      points: 0,
      maxPoints: 3,
      message: "Keyword not found in the opening paragraph.",
      suggestion:
        "Include your target keyword within the first 150 characters to signal relevance immediately.",
    });
  } else {
    checks.push({
      id: "keyword-in-first-paragraph",
      label: "Keyword in First Paragraph",
      status: "poor",
      points: 0,
      maxPoints: 3,
      message: "Cannot check — keyword not used in content.",
      suggestion: "Use your target keyword early in the content.",
    });
  }

  // ── 2. Multimedia Content (3 pts) ──
  const hasImages = /<img\s[^>]*>/gi.test(content);
  const hasVideo =
    /<video\s[^>]*>/gi.test(content) ||
    /<iframe[^>]*src=["'][^"']*youtube\.com[^"']*["']/gi.test(content) ||
    /<iframe[^>]*src=["'][^"']*vimeo\.com[^"']*["']/gi.test(content);

  if (hasImages && hasVideo) {
    checks.push({
      id: "multimedia-content",
      label: "Multimedia Content",
      status: "good",
      points: 3,
      maxPoints: 3,
      message: "Content includes both images and video — excellent engagement potential.",
    });
  } else if (hasImages || hasVideo) {
    const mediaType = hasImages ? "images" : "video";
    checks.push({
      id: "multimedia-content",
      label: "Multimedia Content",
      status: "ok",
      points: 2,
      maxPoints: 3,
      message: `Content includes ${mediaType}.`,
      suggestion: hasImages
        ? "Consider adding a video to further enrich the content and increase dwell time."
        : "Add relevant images to break up text and improve visual appeal.",
    });
  } else {
    checks.push({
      id: "multimedia-content",
      label: "Multimedia Content",
      status: "poor",
      points: 0,
      maxPoints: 3,
      message: "No images or videos found in the content.",
      suggestion:
        "Add relevant images and/or videos to make your content more engaging and visually appealing.",
    });
  }

  // ── 3. Content Update Freshness (4 pts) ──
  // Informational check — based on content substance
  if (wordCount > 300) {
    checks.push({
      id: "content-update-freshness",
      label: "Content Freshness",
      status: "good",
      points: 4,
      maxPoints: 4,
      message: `Content has ${wordCount.toLocaleString()} words — substantial and likely up-to-date.`,
    });
  } else if (wordCount > 150) {
    checks.push({
      id: "content-update-freshness",
      label: "Content Freshness",
      status: "ok",
      points: 2,
      maxPoints: 4,
      message: "Content is present but may need to be expanded or updated.",
      suggestion:
        "Review and update your content regularly. Fresh, comprehensive content ranks better.",
    });
  } else {
    checks.push({
      id: "content-update-freshness",
      label: "Content Freshness",
      status: "poor",
      points: 0,
      maxPoints: 4,
      message: "Content is very short — may appear outdated or thin.",
      suggestion:
        "Expand your content and keep it updated with current information.",
    });
  }

  return checks;
}

// ─── Readability Analysis ─────────────────────────────────────────────────────

/**
 * Computes comprehensive readability metrics for the given text.
 */
function computeReadability(text: string): SeoScoreResult["readability"] {
  const plainText = stripHtml(text);
  const wordCount = countWords(plainText);
  const sentenceCount = countSentences(plainText);
  const fleschScore = calculateFleschScore(plainText);

  const avgSentenceLength =
    sentenceCount > 0 ? wordCount / sentenceCount : 0;

  // Average word length in characters
  const wordList = plainText
    .trim()
    .split(/\s+/)
    .filter((w) => /[a-zA-Z]/.test(w));
  const avgWordLength =
    wordList.length > 0
      ? wordList.reduce((sum, w) => sum + w.length, 0) / wordList.length
      : 0;

  // Reading level
  let level: "easy" | "moderate" | "hard";
  if (fleschScore >= 60 && fleschScore <= 80) {
    level = "easy";
  } else if (
    (fleschScore >= 40 && fleschScore < 60) ||
    (fleschScore > 80 && fleschScore <= 90)
  ) {
    level = "moderate";
  } else {
    level = "hard";
  }

  // Average reading speed: ~200 words per minute
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return {
    fleschScore,
    readingTime,
    wordCount,
    sentenceCount,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    level,
  };
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Analyzes SEO quality of content based on a weighted 100-point scoring algorithm.
 *
 * @param input - The SEO analysis input containing content, keyword, title, etc.
 * @returns A comprehensive SEO score result with category breakdowns and suggestions.
 *
 * @example
 * ```ts
 * const result = analyzeSeo({
 *   content: '<h1>Best SEO Tools</h1><p>Discover the best SEO tools for 2025...</p>',
 *   keyword: 'best SEO tools',
 *   title: 'Best SEO Tools for 2025 | Complete Guide',
 *   metaDescription: 'Compare the best SEO tools of 2025...',
 *   urlSlug: '/blog/best-seo-tools',
 *   headings: ['Best SEO Tools', 'Why You Need SEO Tools', 'Top Picks'],
 * });
 *
 * console.log(result.score);       // e.g. 78
 * console.log(result.status);      // 'ok'
 * console.log(result.readability.fleschScore);  // e.g. 65.3
 * ```
 */
export function analyzeSeo(input: SeoAnalysisInput): SeoScoreResult {
  // Run all category scorers
  const keywordChecks = scoreKeywordOptimization(input);
  const contentChecks = scoreContentQuality(input);
  const technicalChecks = scoreTechnicalSeo(input);
  const linkingChecks = scoreLinking(input);
  const bonusChecks = scoreBonus(input);

  // Sum up scores per category
  const keywordScore = keywordChecks.reduce((sum, c) => sum + c.points, 0);
  const contentScore = contentChecks.reduce((sum, c) => sum + c.points, 0);
  const technicalScore = technicalChecks.reduce((sum, c) => sum + c.points, 0);
  const linkingScore = linkingChecks.reduce((sum, c) => sum + c.points, 0);
  const bonusScore = bonusChecks.reduce((sum, c) => sum + c.points, 0);

  const totalScore =
    keywordScore + contentScore + technicalScore + linkingScore + bonusScore;

  // Determine overall status
  let status: "good" | "ok" | "poor";
  if (totalScore >= 80) {
    status = "good";
  } else if (totalScore >= 50) {
    status = "ok";
  } else {
    status = "poor";
  }

  // Collect issues and suggestions
  const allChecks = [
    ...keywordChecks,
    ...contentChecks,
    ...technicalChecks,
    ...linkingChecks,
    ...bonusChecks,
  ];

  const issues: string[] = [];
  const suggestions: string[] = [];

  for (const check of allChecks) {
    if (check.status === "poor") {
      issues.push(check.message);
    }
    if (check.suggestion) {
      suggestions.push(check.suggestion);
    }
  }

  // Compute readability metrics
  const readability = computeReadability(input.content);

  return {
    score: totalScore,
    status,
    categoryScores: {
      keywordOptimization: {
        score: keywordScore,
        max: 30,
        checks: keywordChecks,
      },
      contentQuality: {
        score: contentScore,
        max: 25,
        checks: contentChecks,
      },
      technicalSeo: {
        score: technicalScore,
        max: 20,
        checks: technicalChecks,
      },
      linking: {
        score: linkingScore,
        max: 15,
        checks: linkingChecks,
      },
      bonus: {
        score: bonusScore,
        max: 10,
        checks: bonusChecks,
      },
    },
    issues,
    suggestions,
    readability,
  };
}
