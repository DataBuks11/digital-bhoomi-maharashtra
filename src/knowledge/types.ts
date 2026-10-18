export type KnowledgeCategory =
  | "company"
  | "product"
  | "service"
  | "resource"
  | "investor"
  | "career";

export interface KnowledgeItem {
  id: string;
  category: KnowledgeCategory;
  slug: string;
  title: string;
  subtitle?: string;
  url: string;
  summary: string;
  content: string;
  features?: Array<{ title: string; description: string }>;
  metrics?: Array<{ value: string; label: string }>;
  tags: string[];
  lastUpdated: string;
}

export interface SearchResult {
  id: string;
  category: KnowledgeCategory;
  slug: string;
  title: string;
  subtitle?: string;
  url: string;
  score: number;
  excerpt: string;
  features?: Array<{ title: string; description: string }>;
  metrics?: Array<{ value: string; label: string }>;
}

export interface SearchOptions {
  category?: KnowledgeCategory;
  limit?: number;
  minScore?: number;
}
