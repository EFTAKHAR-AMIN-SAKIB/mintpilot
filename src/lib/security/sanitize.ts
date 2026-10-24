/**
 * HTML Sanitization and Prompt Injection Safeguards
 */

export interface ExtractedHtmlMetadata {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  rawText: string;
}

/**
 * Extract clean metadata and safe text from raw HTML without executing scripts or CSS.
 */
export function extractSafeHtmlMetadata(html: string): ExtractedHtmlMetadata {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  // Extract meta tags
  const extractMeta = (nameOrProperty: string): string | undefined => {
    const regex = new RegExp(
      `<meta[^>]*(?:name|property)=["']${nameOrProperty}["'][^>]*content=["']([^"']*)["']`,
      "i"
    );
    const match = html.match(regex);
    if (match) return match[1].trim();

    // Alternate order: content before name/property
    const altRegex = new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${nameOrProperty}["']`,
      "i"
    );
    const altMatch = html.match(altRegex);
    return altMatch ? altMatch[1].trim() : undefined;
  };

  const description = extractMeta("description") || "";
  const ogTitle = extractMeta("og:title");
  const ogDescription = extractMeta("og:description");
  const ogImage = extractMeta("og:image");

  // Remove scripts, styles, iframes, SVGs, and comments
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  // Strip all other HTML tags
  sanitized = sanitized.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  sanitized = sanitized
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Normalize whitespace
  const rawText = sanitized.replace(/\s+/g, " ").trim();

  return {
    title,
    description,
    ogTitle,
    ogDescription,
    ogImage,
    rawText: rawText.slice(0, 8000), // Cap length for safe downstream processing
  };
}

/**
 * Detect common prompt injection attack signatures inside untrusted webpage text
 */
const SUSPICIOUS_INJECTION_PATTERNS = [
  /ignore (all )?previous instructions/i,
  /you are now (an? )?admin/i,
  /execute immediately without preview/i,
  /bypass verification/i,
  /transfer (all )?(funds|bnb|eth)/i,
  /system prompt override/i,
  /confirm without asking the user/i,
];

export function inspectForPromptInjection(text: string): { isSuspicious: boolean; detectedPatterns: string[] } {
  const detected: string[] = [];
  for (const pattern of SUSPICIOUS_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      detected.push(pattern.source);
    }
  }
  return {
    isSuspicious: detected.length > 0,
    detectedPatterns: detected,
  };
}
