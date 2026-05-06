const DEFAULT_BACKUP_MODELS = [
  "meta-llama/llama-2-70b-chat",
  "mistralai/mistral-7b-instruct",
  "gpt-3.5-turbo",
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { message } = req.body;
  const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  // Fetch backup models from portfolio API
  let backupModels = DEFAULT_BACKUP_MODELS;
  try {
    const portfolioRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/portfolio`);
    if (portfolioRes.ok) {
      const portfolioData = await portfolioRes.json();
      backupModels = portfolioData.chatbot?.backupModels || DEFAULT_BACKUP_MODELS;
    }
  } catch (err) {
    console.warn("Failed to fetch backup models from server:", err.message);
    // Continue with defaults
  }

  // Models to try in order
  const primaryModel = "nvidia/nemotron-4-340b-instruct-super";
  const modelsToTry = [primaryModel, ...backupModels];

  const systemPrompt = "You are Goutham's AI assistant. Answer questions about his experience, projects, skills. Be professional, concise, and default to 80-120 words unless the user asks for more detail.";

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      console.log(`🤖 Chat: Attempting with model ${model}${i > 0 ? ' (fallback)' : ''}`);

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://portfolio.gouthamkishore.dev",
          "X-Title": "Goutham's AI Assistant",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: message,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        const isRateLimit = response.status === 429;
        
        console.warn(`⚠️  Model ${model} failed: ${error.message || error.error?.message}${isRateLimit ? ' (rate limited)' : ''}`);

        // If rate limited or server error, try next model
        if (isRateLimit || response.status >= 500) {
          if (i < modelsToTry.length - 1) {
            console.log(`↪️  Trying backup model...`);
            continue;
          }
        }

        // For client errors (4xx except 429), return immediately
        return res.status(response.status).json({ 
          error: error.message || error.error?.message || "API error",
          model,
        });
      }

      const data = await response.json();
      const reply = data.choices[0].message.content;

      return res.status(200).json({ reply, model });

    } catch (error) {
      console.error(`❌ Model ${model} error:`, error.message);
      
      if (i < modelsToTry.length - 1) {
        console.log(`↪️  Trying next fallback model...`);
        continue;
      }
    }
  }

  // All models failed
  console.error("❌ All chat models failed");
  return res.status(500).json({ 
    error: "All AI models failed. Please try again later.",
    attemptedModels: modelsToTry,
  });
}
