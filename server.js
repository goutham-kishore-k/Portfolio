const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env.local") });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free";

  if (!apiKey) {
    console.error("❌ API key not configured. Available env vars:", Object.keys(process.env).filter(k => k.includes("OPEN")));
    return res.status(500).json({ error: "API key not configured" });
  }

  console.log("📨 Chat request:", message.substring(0, 50) + "...");

  try {
    const requestBody = {
      model,
      messages: [
        {
          role: "system",
          content:
            "You are Goutham's AI assistant. Answer questions about his 4+ years of data engineering experience, projects, skills in Apache NiFi, Kafka, Python, SQL, Power BI, and Tableau. Be professional, concise, and default to 80-120 words unless the user asks for more detail.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.4,
      max_tokens: 220,
    };

    console.log("🔄 Calling OpenRouter API...");
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 25000);
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Goutham's AI Assistant",
      },
      body: JSON.stringify(requestBody),
      signal: abortController.signal,
    });
    clearTimeout(timeout);

    console.log("📊 OpenRouter response status:", response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ OpenRouter API error:", error);
      return res.status(response.status).json({ 
        error: error.message || error.error?.message || "API error",
        details: error 
      });
    }

    const data = await response.json();
    console.log("✅ Got response from OpenRouter");
    const reply = data.choices[0].message.content;

    res.status(200).json({ reply });
  } catch (error) {
    console.error("❌ Chat API error:", error.message);
    res.status(500).json({ error: "Failed to get response: " + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
