import { knowledgeStore } from "../knowledge/store.js";
import { tokenHarborClient } from "./client.js";

export interface ChatRequest {
  message: string;
}

export interface ChatSource {
  id: string;
  title: string;
  category: string;
  url: string;
  excerpt: string;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
  model: string;
  retrieval: {
    query: string;
    matchedCount: number;
    grounded: boolean;
  };
}

export async function handleChatMessage(message: string): Promise<ChatResponse> {
  const trimmed = (message ?? "").trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty.");
  }
  if (trimmed.length > 1000) {
    throw new Error("Message exceeds maximum length of 1000 characters.");
  }

  // 1. Retrieve relevant knowledge records from VGIL knowledge store
  const results = knowledgeStore.search(trimmed, { limit: 4, minScore: 5 });

  const sources: ChatSource[] = results.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    url: r.url,
    excerpt: r.excerpt
  }));

  // 2. If no relevant information was found, handle gracefully without calling LLM or hallucinating
  if (results.length === 0) {
    return {
      answer: "The official Virtual Galaxy Infotech Limited (VGIL) knowledge base does not contain verified records regarding this question. Please reach out directly to VGIL at info@vginfotech.ai or visit https://vgipl-website.vercel.app/ for more information.",
      sources: [],
      model: tokenHarborClient.getModel(),
      retrieval: {
        query: trimmed,
        matchedCount: 0,
        grounded: false
      }
    };
  }

  // 3. Format grounded context from retrieved records
  const contextSections = results.map((r, i) => {
    const fullItem = knowledgeStore.getById(r.id);
    const features = fullItem?.features?.map((f) => `- ${f.title}: ${f.description}`).join("\n") || "";
    const metrics = fullItem?.metrics?.map((m) => `- ${m.label}: ${m.value}`).join("\n") || "";

    return `[Source ${i + 1}] Title: ${r.title} (${r.category})
URL: ${r.url}
Content: ${fullItem?.content || r.excerpt}
${features ? `Key Features:\n${features}` : ""}
${metrics ? `Metrics:\n${metrics}` : ""}`;
  }).join("\n\n");

  const systemPrompt = `You are QORVEX, an enterprise AI assistant for Virtual Galaxy Infotech Limited (VGIL), an Indian banking and IT software solutions company listed on NSE India.

STRICT GROUNDING INSTRUCTIONS:
1. Base your answer EXCLUSIVELY on the verified VGIL source context provided below.
2. Do NOT invent or infer unmentioned products, metrics, features, certifications, or statistics.
3. If a specific detail is not stated in the context, explicitly say that the official VGIL documentation does not mention it.
4. Always mention the relevant source URL (e.g., https://vgipl-website.vercel.app/products/...) when citing specific products or services.
5. Maintain a professional, enterprise-grade tone.

VERIFIED VGIL CONTEXT:
${contextSections}`;

  // 4. Send request to DeepSeek via TokenHarbor
  try {
    const completion = await tokenHarborClient.createChatCompletion({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: trimmed }
      ],
      temperature: 0.2,
      maxTokens: 800,
      timeoutMs: 30000
    });

    return {
      answer: completion.content,
      sources,
      model: completion.model,
      retrieval: {
        query: trimmed,
        matchedCount: results.length,
        grounded: true
      }
    };
  } catch (err) {
    console.error("TokenHarbor chat completion error:", (err as Error).message);
    // If LLM provider fails (e.g. network issue), return a grounded fallback using the retrieved excerpts
    return {
      answer: `[Grounded Knowledge Summary (LLM Gateway Fallback)]:\n\nBased on official VGIL records for "${trimmed}":\n\n` +
        results.map(r => `• **${r.title}**: ${r.excerpt}\nSource: ${r.url}`).join("\n\n") +
        `\n\n*(Note: LLM inference temporarily unavailable: ${(err as Error).message})*`,
      sources,
      model: tokenHarborClient.getModel(),
      retrieval: {
        query: trimmed,
        matchedCount: results.length,
        grounded: true
      }
    };
  }
}
