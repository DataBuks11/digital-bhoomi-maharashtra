import fs from "fs";
import path from "path";
import { KnowledgeItem, KnowledgeCategory, SearchResult, SearchOptions } from "./types.js";

const GENERIC_CATEGORY_STOPWORDS = new Set([
  "service",
  "services",
  "product",
  "products",
  "solution",
  "solutions",
  "platform",
  "system",
  "systems"
]);

const QUERY_STOPWORDS = new Set([
  "vgil",
  "virtual",
  "galaxy",
  "infotech",
  "limited",
  "company",
  "what",
  "which",
  "where",
  "when",
  "who",
  "whom",
  "whose",
  "why",
  "how",
  "can",
  "could",
  "would",
  "should",
  "does",
  "do",
  "did",
  "is",
  "are",
  "was",
  "were",
  "tell",
  "give",
  "show",
  "about",
  "for",
  "with",
  "from",
  "the",
  "and",
  "our",
  "me",
  "you",
  "they",
  "them",
  "it",
  "its",
  "any",
  "some",
  "all",
  "in",
  "to",
  "of",
  "on",
  "at"
]);

export class KnowledgeStore {
  private items: KnowledgeItem[] = [];
  private filePath: string;

  constructor(customPath?: string) {
    this.filePath = customPath ?? path.resolve(process.cwd(), "data", "vgil-knowledge.json");
    this.load();
  }

  public load(): void {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        this.items = JSON.parse(raw);
        console.log(`[KnowledgeStore] Loaded ${this.items.length} records from ${this.filePath}`);
      } catch (err) {
        console.error(`[KnowledgeStore] Failed to parse knowledge base: ${(err as Error).message}`);
        this.items = [];
      }
    } else {
      console.warn(`[KnowledgeStore] Knowledge file not found at ${this.filePath}. Run 'npm run ingest' first.`);
      this.items = [];
    }
  }

  public get count(): number {
    return this.items.length;
  }

  public getAll(): KnowledgeItem[] {
    return [...this.items];
  }

  public getById(id: string): KnowledgeItem | undefined {
    return this.items.find((i) => i.id.toLowerCase() === id.toLowerCase());
  }

  public getBySlug(slug: string, category?: KnowledgeCategory): KnowledgeItem | undefined {
    const normSlug = slug.toLowerCase().trim();
    return this.items.find((i) => {
      const matchSlug = i.slug.toLowerCase() === normSlug;
      return category ? matchSlug && i.category === category : matchSlug;
    });
  }

  public listByCategory(category: KnowledgeCategory): KnowledgeItem[] {
    return this.items.filter((i) => i.category === category);
  }

  public search(query: string, options: SearchOptions = {}): SearchResult[] {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const limit = options.limit ?? 5;
    const minScore = options.minScore ?? 3;
    const allTokens = trimmed
      .split(/[\s,.-]+/)
      .map((t) => t.replace(/[^a-z0-9]/g, ""))
      .filter((t) => t.length > 1);

    if (allTokens.length === 0) return [];

    // Tokens representing the specific topic/subject requested
    const subjectTokens = allTokens.filter((t) => !QUERY_STOPWORDS.has(t));

    const scored: Array<{ item: KnowledgeItem; score: number; excerpt: string }> = [];

    for (const item of this.items) {
      if (options.category && item.category !== options.category) {
        continue;
      }

      let score = 0;
      let subjectMatched = 0;
      const titleLower = item.title.toLowerCase();
      const subtitleLower = (item.subtitle || "").toLowerCase();
      const contentLower = item.content.toLowerCase();
      const tagsLower = item.tags.map((t) => t.toLowerCase());

      // 1. Exact phrase match boosts
      if (titleLower.includes(trimmed)) {
        score += 40;
      } else if (subtitleLower.includes(trimmed)) {
        score += 25;
      } else if (contentLower.includes(trimmed)) {
        score += 15;
      }

      // 2. Token matches
      let tokenMatches = 0;
      for (const token of allTokens) {
        let matched = false;
        const isGeneric = GENERIC_CATEGORY_STOPWORDS.has(token);
        const weightMult = isGeneric ? 0.3 : 1.0;

        if (item.slug.toLowerCase().includes(token)) {
          score += 15 * weightMult;
          matched = true;
        }

        const escToken = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const wordRegex = new RegExp(`\\b${escToken}\\b`, "i");

        if (wordRegex.test(titleLower)) {
          score += 12 * weightMult;
          matched = true;
        }
        if (wordRegex.test(subtitleLower)) {
          score += 6 * weightMult;
          matched = true;
        }
        if (tagsLower.includes(token)) {
          score += 8 * weightMult;
          matched = true;
        }
        if (wordRegex.test(contentLower)) {
          score += 3 * weightMult;
          matched = true;
        }

        if (matched) {
          tokenMatches++;
          if (subjectTokens.includes(token)) {
            subjectMatched++;
          }
        }
      }

      // If subject tokens were present in the query, require at least one subject token to match
      if (subjectTokens.length > 0 && subjectMatched === 0) {
        continue;
      }

      // Bonus if all query tokens matched
      if (allTokens.length > 1 && tokenMatches === allTokens.length) {
        score += 20;
      }

      if (score >= minScore) {
        const excerpt = this.extractExcerpt(item.content, allTokens, trimmed);
        scored.push({ item, score: Math.round(score), excerpt });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(({ item, score, excerpt }) => ({
      id: item.id,
      category: item.category,
      slug: item.slug,
      title: item.title,
      subtitle: item.subtitle,
      url: item.url,
      score,
      excerpt,
      features: item.features,
      metrics: item.metrics
    }));
  }

  private extractExcerpt(content: string, tokens: string[], phrase: string): string {
    const lowerContent = content.toLowerCase();
    let bestIndex = lowerContent.indexOf(phrase);

    if (bestIndex === -1) {
      for (const token of tokens) {
        const idx = lowerContent.indexOf(token);
        if (idx !== -1) {
          bestIndex = idx;
          break;
        }
      }
    }

    if (bestIndex === -1) {
      return content.length > 200 ? content.substring(0, 197) + "..." : content;
    }

    const start = Math.max(0, bestIndex - 60);
    const end = Math.min(content.length, bestIndex + 160);
    let excerpt = content.substring(start, end).trim();

    if (start > 0) excerpt = "..." + excerpt;
    if (end < content.length) excerpt = excerpt + "...";
    return excerpt;
  }
}

// Default singleton instance
export const knowledgeStore = new KnowledgeStore();
