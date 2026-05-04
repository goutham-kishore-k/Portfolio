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

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://portfolio.gouthamkishore.dev",
        "X-Title": "Goutham's AI Assistant",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-4-340b-instruct-super",
        messages: [
          {
            role: "system",
            content:
              "You are Goutham's AI assistant. Answer questions about his experience, projects, skills. Be professional, concise, and default to 80-120 words unless the user asks for more detail.",
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
      console.error("OpenRouter error:", error);
      return res.status(response.status).json({ error: error.message || "API error" });
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    res.status(200).json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    res.status(500).json({ error: "Failed to get response" });
  }
}
