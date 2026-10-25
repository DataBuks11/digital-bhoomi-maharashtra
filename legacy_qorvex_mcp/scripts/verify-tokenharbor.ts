import "dotenv/config";

const baseUrl = process.env.LLM_BASE_URL || "https://tokenharbor.ai/v1";
const apiKey = process.env.LLM_API_KEY;

if (!apiKey) {
  console.error("LLM_API_KEY is not set in environment.");
  process.exit(1);
}

// Never print secret:
console.log(`Verifying TokenHarbor at ${baseUrl} (key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)})`);

async function testConnection() {
  try {
    console.log("Checking /models endpoint...");
    const modelsRes = await fetch(`${baseUrl}/models`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!modelsRes.ok) {
      console.warn(`Models endpoint returned HTTP ${modelsRes.status}: ${await modelsRes.text()}`);
    } else {
      const modelsData: any = await modelsRes.json();
      console.log(`Found ${modelsData.data?.length || 0} models:`);
      const deepseekModels = (modelsData.data || []).filter((m: any) =>
        m.id.toLowerCase().includes("deepseek") || m.id.toLowerCase().includes("flash")
      );
      for (const m of deepseekModels) {
        console.log(`- ${m.id}`);
      }
    }

    // Try a test completion with DeepSeek
    const modelCandidate = process.env.LLM_MODEL || "deepseek-v4-flash:free";
    console.log(`\nTesting chat completion with model: ${modelCandidate}...`);

    const chatRes = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelCandidate,
        messages: [
          { role: "system", content: "You are QORVEX, an enterprise AI connector for Virtual Galaxy Infotech Limited." },
          { role: "user", content: "Reply with 'CONNECTED' if you can receive this message." }
        ],
        max_tokens: 30,
        temperature: 0.1
      })
    });

    if (!chatRes.ok) {
      const errText = await chatRes.text();
      console.error(`Chat completion failed with status ${chatRes.status}:`, errText);
    } else {
      const chatData: any = await chatRes.json();
      const reply = chatData.choices?.[0]?.message?.content?.trim();
      console.log("Chat completion response:", reply);
      console.log("TokenHarbor + DeepSeek connection successful!");
    }
  } catch (err) {
    console.error("Connection failed:", (err as Error).message);
  }
}

testConnection();
