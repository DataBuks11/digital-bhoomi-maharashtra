import "dotenv/config";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export class TokenHarborClient {
  private baseUrl: string;
  private apiKey: string;
  private defaultModel: string;

  constructor() {
    this.baseUrl = (process.env.LLM_BASE_URL ?? "https://tokenharbor.ai/v1").replace(/\/+$/, "");
    this.apiKey = (process.env.LLM_API_KEY ?? "").trim();
    this.defaultModel = process.env.LLM_MODEL ?? "deepseek-v4.1-flash:free";
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  public getModel(): string {
    return this.defaultModel;
  }

  public async createChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    if (!this.isConfigured()) {
      throw new Error("LLM_API_KEY is not configured in environment variables.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 30000);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages: options.messages,
          temperature: options.temperature ?? 0.2,
          max_tokens: options.maxTokens ?? 800
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errDetail = "";
        try {
          const errJson: any = await response.json();
          errDetail = errJson.error?.message || JSON.stringify(errJson);
        } catch {
          errDetail = await response.text();
        }
        throw new Error(`TokenHarbor API returned HTTP ${response.status}: ${errDetail}`);
      }

      const data: any = await response.json();
      const choice = data.choices?.[0];
      if (!choice || !choice.message) {
        throw new Error("TokenHarbor response did not include a valid choice message.");
      }

      return {
        content: choice.message.content || "",
        model: data.model || this.defaultModel,
        usage: data.usage
      };
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        throw new Error(`TokenHarbor request timed out after ${options.timeoutMs ?? 30000}ms.`);
      }
      throw err;
    }
  }
}

export const tokenHarborClient = new TokenHarborClient();
