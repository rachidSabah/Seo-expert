/**
 * Puter.js AI Integration Module
 *
 * A client-side module that wraps Puter.js AI capabilities for SEO content generation.
 * Dynamically loads the Puter.js SDK from CDN if not already present.
 *
 * CDN: https://js.puter.com/v2/
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AiGenerationOptions {
  /** The prompt describing what content to generate */
  prompt: string;
  /** Maximum tokens for the AI response (default: 4096) */
  maxTokens?: number;
  /** Temperature for creativity (0.0–1.0, default: 0.7) */
  temperature?: number;
}

export interface AiGeneratedContent {
  /** SEO-optimized page title */
  title: string;
  /** Meta description for search engines */
  metaDescription: string;
  /** Array of heading texts (H2, H3, etc.) */
  headings: string[];
  /** Full article content in markdown */
  content: string;
  /** Array of related keywords */
  keywords: string[];
}

// ─── Puter.js Global Type Declaration ─────────────────────────────────────────

declare global {
  interface Window {
    puter?: {
      ai: {
        chat(
          prompt: string,
          options?: Record<string, unknown>
        ): Promise<string>;
      };
    };
  }
}

// ─── Puter.js Script Loader ───────────────────────────────────────────────────

/**
 * Dynamically loads the Puter.js SDK from CDN if not already present.
 * Resolves immediately if `window.puter` already exists.
 *
 * @returns A promise that resolves when Puter.js is ready to use.
 * @throws Error if the script fails to load.
 */
function loadPuterScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.puter) {
      resolve();
      return;
    }

    if (typeof document === "undefined") {
      reject(new Error("Puter.js requires a browser environment."));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.puter.com/v2/";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Puter.js from CDN."));
    document.head.appendChild(script);
  });
}

// ─── Utility ──────────────────────────────────────────────────────────────────

/**
 * Safely extracts JSON from an AI response that may contain markdown code fences
 * or other wrapper text around the JSON payload.
 */
function extractJsonFromResponse(text: string): string {
  // Try to extract JSON from markdown code fences: ```json ... ```
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  // Try to find a JSON object in the response
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }

  return text.trim();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Checks whether Puter.js is available in the current environment.
 * Does not trigger a download — only checks if the SDK is already loaded.
 *
 * @returns `true` if `window.puter` exists, `false` otherwise.
 */
export function isPuterAvailable(): boolean {
  return typeof window !== "undefined" && !!window.puter;
}

/**
 * Generates a complete SEO-optimized article using Puter.js AI.
 *
 * The AI is prompted to return structured JSON containing a title, meta description,
 * headings, markdown content, and related keywords.
 *
 * @param options - Generation options including the prompt and AI parameters.
 * @returns The generated content, or `null` if Puter.js is unavailable or an error occurs.
 *
 * @example
 * ```ts
 * const result = await generateSeoContent({
 *   prompt: "Write about the best project management tools for remote teams",
 *   temperature: 0.8,
 * });
 *
 * if (result) {
 *   console.log(result.title);
 *   console.log(result.content);
 * }
 * ```
 */
export async function generateSeoContent(
  options: AiGenerationOptions
): Promise<AiGeneratedContent | null> {
  try {
    await loadPuterScript();

    if (!window.puter) {
      return null;
    }

    const systemPrompt = `You are an expert SEO content writer. Generate a comprehensive, SEO-optimized article based on the user's prompt.

You MUST respond with valid JSON in this exact format (no markdown, no extra text):
{
  "title": "SEO-optimized page title (50-60 characters, includes primary keyword)",
  "metaDescription": "Compelling meta description (150-160 characters, includes keyword, has a call to action)",
  "headings": ["H2 heading 1", "H2 heading 2", "H2 heading 3", "H3 heading under H2 2", "H2 heading 4"],
  "content": "Full article in markdown format. Include ## and ### headings, paragraphs, bullet lists, and bold text. Aim for 1000+ words.",
  "keywords": ["primary keyword", "secondary keyword 1", "secondary keyword 2", "LSI keyword 1", "LSI keyword 2", "LSI keyword 3"]
}

Requirements:
- Content must be comprehensive, original, and valuable
- Use proper heading hierarchy (H2 as main sections, H3 as subsections)
- Include at least 5 headings
- Write in a professional yet approachable tone
- Naturally incorporate the primary keyword throughout
- Aim for 1000+ words of high-quality content
- Return ONLY the JSON, no explanations before or after`;

    const response = await window.puter.ai.chat(
      `${systemPrompt}\n\nUser prompt: ${options.prompt}`,
      {
        maxTokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
      }
    );

    const jsonStr = extractJsonFromResponse(response);
    const parsed = JSON.parse(jsonStr) as AiGeneratedContent;

    // Validate required fields
    if (!parsed.title || !parsed.content) {
      console.warn("Puter AI returned incomplete content structure.");
      return null;
    }

    // Provide defaults for optional fields
    return {
      title: parsed.title,
      metaDescription: parsed.metaDescription || "",
      headings: Array.isArray(parsed.headings) ? parsed.headings : [],
      content: parsed.content,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    };
  } catch (error) {
    console.error("Failed to generate SEO content:", error);
    return null;
  }
}

/**
 * Rewrites existing content using Puter.js AI with a specified mode.
 *
 * @param content - The existing content to rewrite.
 * @param mode - The rewrite strategy:
 *   - `'expand'`: Make the content longer and more detailed.
 *   - `'summarize'`: Condense the content into a shorter, concise version.
 *   - `'rewrite'`: Rephrase the content while maintaining the same meaning and length.
 * @param tone - Optional writing tone (e.g., "professional", "casual", "academic").
 * @returns The rewritten content as a string, or `null` on failure.
 *
 * @example
 * ```ts
 * const expanded = await rewriteContent(
 *   "SEO is important for websites.",
 *   "expand",
 *   "professional"
 * );
 * ```
 */
export async function rewriteContent(
  content: string,
  mode: "expand" | "summarize" | "rewrite",
  tone?: string
): Promise<string | null> {
  try {
    await loadPuterScript();

    if (!window.puter) {
      return null;
    }

    const modeInstructions: Record<string, string> = {
      expand: `Expand and elaborate on the following content. Add more detail, examples, and explanations. Aim to at least double the length while maintaining quality and relevance. Keep the same core message.`,
      summarize: `Summarize the following content into a concise version. Capture the key points and main arguments. Aim to reduce the length by at least 50% while preserving the essential information.`,
      rewrite: `Rewrite the following content with different wording and sentence structures. Maintain the same meaning, length, and tone. Improve clarity and flow where possible.`,
    };

    const toneInstruction = tone
      ? `\n\nWriting tone: ${tone}`
      : "\n\nWriting tone: professional yet approachable";

    const prompt = `${modeInstructions[mode]}${toneInstruction}

Return ONLY the rewritten content — no explanations, no preamble, no markdown code fences.

Content to process:
${content}`;

    const response = await window.puter.ai.chat(prompt, {
      maxTokens: 4096,
      temperature: 0.7,
    });

    // Clean up any wrapping markdown code fences
    let result = response.trim();
    if (result.startsWith("```")) {
      result = result.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
    }

    return result.trim() || null;
  } catch (error) {
    console.error(`Failed to ${mode} content:`, error);
    return null;
  }
}

/**
 * Generates SEO-optimized title and meta description using Puter.js AI.
 *
 * @param title - The current or draft page title.
 * @param content - The page content or a summary of it.
 * @param keyword - The target SEO keyword.
 * @returns An object with `title` and `description`, or `null` on failure.
 *
 * @example
 * ```ts
 * const meta = await generateMetaTags(
 *   "Best SEO Tools 2025",
 *   "A comprehensive guide to the top SEO tools...",
 *   "best SEO tools"
 * );
 *
 * if (meta) {
 *   console.log(meta.title);       // "10 Best SEO Tools for 2025 (Expert Compared)"
 *   console.log(meta.description); // "Discover the best SEO tools..."
 * }
 * ```
 */
export async function generateMetaTags(
  title: string,
  content: string,
  keyword: string
): Promise<{ title: string; description: string } | null> {
  try {
    await loadPuterScript();

    if (!window.puter) {
      return null;
    }

    // Truncate content to avoid exceeding token limits
    const contentSnippet =
      content.length > 2000 ? content.substring(0, 2000) + "..." : content;

    const prompt = `You are an SEO expert. Generate an optimized page title and meta description.

Current title: ${title}
Target keyword: ${keyword}
Content summary: ${contentSnippet}

Requirements:
- Title: 50-60 characters, include the keyword near the beginning, compelling and click-worthy
- Meta description: 150-160 characters, include the keyword, add a call to action, accurately reflect the content

You MUST respond with valid JSON in this exact format (no markdown, no extra text):
{
  "title": "Your optimized title here",
  "description": "Your optimized meta description here"
}`;

    const response = await window.puter.ai.chat(prompt, {
      maxTokens: 512,
      temperature: 0.6,
    });

    const jsonStr = extractJsonFromResponse(response);
    const parsed = JSON.parse(jsonStr) as {
      title: string;
      description: string;
    };

    if (!parsed.title && !parsed.description) {
      console.warn("Puter AI returned empty meta tags.");
      return null;
    }

    return {
      title: parsed.title || "",
      description: parsed.description || "",
    };
  } catch (error) {
    console.error("Failed to generate meta tags:", error);
    return null;
  }
}

/**
 * Generate comprehensive SEO content for a specific site + keyword.
 *
 * Produces a full SEO content package including meta title, meta description,
 * structured content with HTML headings, internal link suggestions, and
 * competitor landscape insights.
 *
 * @param siteUrl - The target website URL.
 * @param keyword - The primary target keyword.
 * @param pageTitle - Optional current page title for context.
 * @returns Structured SEO content object, or `null` on failure.
 */
export async function generateFullSeoAnalysis(
  siteUrl: string,
  keyword: string,
  pageTitle?: string
): Promise<{
  metaTitle: string;
  metaDescription: string;
  content: string;
  headings: string[];
  internalLinkSuggestions: string[];
  competitorInsights: string;
} | null> {
  try {
    await loadPuterScript();

    if (!window.puter) {
      return null;
    }

    const prompt = `You are an SEO expert. Generate comprehensive SEO content for the website '${siteUrl}' targeting the keyword '${keyword}'. Current page title: '${pageTitle || "not provided"}'.

Return a JSON object with the following fields:
- "metaTitle": an SEO-optimized title under 60 characters that includes the target keyword
- "metaDescription": a compelling meta description between 150-160 characters with a call to action
- "content": 3-4 paragraphs of SEO-optimized content using HTML headings (include <h2> and <h3> tags within the content)
- "headings": an array of 5-8 H2/H3 heading strings to use on the page
- "internalLinkSuggestions": exactly 5 specific internal link suggestions as an array of strings, each describing a page to create and what anchor text to use
- "competitorInsights": a 1-2 paragraph analysis of the competitive landscape for this keyword, including who likely ranks and how to differentiate

Return ONLY valid JSON, no markdown fences, no extra text.`;

    const response = await window.puter.ai.chat(prompt, {
      maxTokens: 4096,
      temperature: 0.7,
    });

    const jsonStr = extractJsonFromResponse(response);
    const parsed = JSON.parse(jsonStr) as {
      metaTitle?: string;
      metaDescription?: string;
      content?: string;
      headings?: string[];
      internalLinkSuggestions?: string[];
      competitorInsights?: string;
    };

    if (!parsed.metaTitle && !parsed.content) {
      console.warn("Puter AI returned incomplete full SEO analysis.");
      return null;
    }

    return {
      metaTitle: parsed.metaTitle || "",
      metaDescription: parsed.metaDescription || "",
      content: parsed.content || "",
      headings: Array.isArray(parsed.headings) ? parsed.headings : [],
      internalLinkSuggestions: Array.isArray(parsed.internalLinkSuggestions)
        ? parsed.internalLinkSuggestions
        : [],
      competitorInsights: parsed.competitorInsights || "",
    };
  } catch (error) {
    console.error("Failed to generate full SEO analysis:", error);
    return null;
  }
}

/**
 * Generate competitor comparison insights between two websites.
 *
 * Analyzes strengths, weaknesses, opportunities, and provides actionable
 * recommendations for improving your site relative to a competitor.
 *
 * @param yourUrl - Your website URL.
 * @param yourScore - Your site's SEO score (0-100).
 * @param competitorUrl - Competitor's website URL.
 * @param competitorScore - Competitor's SEO score (0-100).
 * @param keyword - The target keyword for comparison.
 * @returns SWOT-style analysis object, or `null` on failure.
 */
export async function generateCompetitorInsights(
  yourUrl: string,
  yourScore: number,
  competitorUrl: string,
  competitorScore: number,
  keyword: string
): Promise<{
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  recommendations: string[];
} | null> {
  try {
    await loadPuterScript();

    if (!window.puter) {
      return null;
    }

    const prompt = `Compare these two websites for SEO performance targeting '${keyword}':
- Site A: ${yourUrl} (SEO score: ${yourScore}/100)
- Site B: ${competitorUrl} (SEO score: ${competitorScore}/100)

Analyze the strengths of each site, the weaknesses relative to each other, opportunities for Site A to improve, and give specific actionable recommendations for Site A to outrank Site B.

Return JSON in this exact format:
{
  "strengths": ["strength 1", "strength 2", "strength 3", "strength 4"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3", "weakness 4"],
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3", "opportunity 4"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3", "recommendation 4"]
}

Each array should have 3-5 items. Be specific and actionable. Return ONLY valid JSON.`;

    const response = await window.puter.ai.chat(prompt, {
      maxTokens: 2048,
      temperature: 0.6,
    });

    const jsonStr = extractJsonFromResponse(response);
    const parsed = JSON.parse(jsonStr) as {
      strengths?: string[];
      weaknesses?: string[];
      opportunities?: string[];
      recommendations?: string[];
    };

    if (!parsed.strengths && !parsed.recommendations) {
      console.warn("Puter AI returned incomplete competitor insights.");
      return null;
    }

    return {
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      opportunities: Array.isArray(parsed.opportunities)
        ? parsed.opportunities
        : [],
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : [],
    };
  } catch (error) {
    console.error("Failed to generate competitor insights:", error);
    return null;
  }
}

/**
 * Generate SEO improvement recommendations based on a site's score and issues.
 *
 * Provides prioritized action items, content ideas, and technical fixes
 * tailored to the specific issues found during analysis.
 *
 * @param siteUrl - The website URL being analyzed.
 * @param score - The site's current SEO score (0-100).
 * @param issues - Array of issue descriptions found during analysis.
 * @returns Structured recommendations object, or `null` on failure.
 */
export async function generateSeoRecommendations(
  siteUrl: string,
  score: number,
  issues: string[]
): Promise<{
  priorityActions: string[];
  contentIdeas: string[];
  technicalFixes: string[];
} | null> {
  try {
    await loadPuterScript();

    if (!window.puter) {
      return null;
    }

    const issuesText =
      issues.length > 0 ? issues.join(", ") : "No specific issues identified";

    const prompt = `You are an SEO consultant. Given a website ${siteUrl} with SEO score ${score}/100 and these issues: ${issuesText}.

Generate exactly:
- 3 priority actions (the most impactful things to fix first)
- 3 content ideas (specific content pieces or pages to create)
- 3 technical fixes (specific technical improvements to implement)

Return JSON in this exact format:
{
  "priorityActions": ["action 1", "action 2", "action 3"],
  "contentIdeas": ["idea 1", "idea 2", "idea 3"],
  "technicalFixes": ["fix 1", "fix 2", "fix 3"]
}

Be specific, actionable, and prioritize by impact. Return ONLY valid JSON.`;

    const response = await window.puter.ai.chat(prompt, {
      maxTokens: 1024,
      temperature: 0.6,
    });

    const jsonStr = extractJsonFromResponse(response);
    const parsed = JSON.parse(jsonStr) as {
      priorityActions?: string[];
      contentIdeas?: string[];
      technicalFixes?: string[];
    };

    if (!parsed.priorityActions && !parsed.contentIdeas && !parsed.technicalFixes) {
      console.warn("Puter AI returned incomplete SEO recommendations.");
      return null;
    }

    return {
      priorityActions: Array.isArray(parsed.priorityActions)
        ? parsed.priorityActions
        : [],
      contentIdeas: Array.isArray(parsed.contentIdeas) ? parsed.contentIdeas : [],
      technicalFixes: Array.isArray(parsed.technicalFixes)
        ? parsed.technicalFixes
        : [],
    };
  } catch (error) {
    console.error("Failed to generate SEO recommendations:", error);
    return null;
  }
}
