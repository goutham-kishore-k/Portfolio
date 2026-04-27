const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env.local") });
const { put, list, get } = require('@vercel/blob');
const { Readable } = require('stream');
const fileUpload = require('express-fileupload');
const pdfParse = require('pdf-parse');

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "gouthamkishore.k@gmail.com")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(fileUpload());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve React build files in production
if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV) {
  app.use(express.static(path.join(__dirname, 'build')));
  // SPA routing: Redirect non-API requests to index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(__dirname, 'build', 'index.html'));
    }
  });
}

const isLocalEnv = !process.env.VERCEL_ENV && process.env.NODE_ENV !== 'production';
const LOCAL_DATA_PATH = path.join(__dirname, 'portfolio_data.json');

// Auth0 Middleware (Validates Opaque Tokens by calling /userinfo)
const checkJwt = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "No token provided" });
    
    const domain = process.env.REACT_APP_AUTH0_DOMAIN;
    const response = await fetch(`https://${domain}/userinfo`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    req.user = await response.json();
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

const requireAdmin = (req, res, next) => {
  const email = (req.user?.email || "").toLowerCase();
  if (!email || !ADMIN_EMAILS.includes(email)) {
    return res.status(403).json({ error: "Forbidden: admin access required" });
  }
  next();
};

// Helper to interact with Vercel Blob for data.json
const DATA_BLOB_NAME = 'portfolio_data.json';
const defaultData = {
  activeProfileId: "default-1",
  profiles: [
    {
      id: "default-1",
      name: "Data Engineer",
      roles: ["Data Scientist", "Data Engineer", "Full Stack Developer"],
      avatarUrl: "",
      resumeUrl: "",
      experienceBio: "",
      projects: [],
      systemPrompt: "You are Goutham's AI assistant. Answer questions about his 4+ years of data engineering experience, projects, skills in Apache NiFi, Kafka, Python, SQL, Power BI, and Tableau. Be professional, concise, and default to 80-120 words unless the user asks for more detail."
    }
  ],
  menuVisibility: {
    Home: true,
    About: true,
    Projects: true,
    Resume: true
  },
  chatbot: {
    model: process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free"
  }
};

const CHAT_SESSION_TTL_MS = 30 * 60 * 1000;
const MAX_SESSION_MESSAGES = 16;
const chatSessions = new Map();

const generateSessionId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const pruneExpiredChatSessions = () => {
  const now = Date.now();
  for (const [sessionId, session] of chatSessions.entries()) {
    if (now - session.updatedAt > CHAT_SESSION_TTL_MS) {
      chatSessions.delete(sessionId);
    }
  }
};

// Cache for Vercel Blob URL to avoid slow list() calls on every request
let cachedBlobPathname = null;
let cacheExpiresAt = 0;

const readBundledPortfolioData = () => {
  try {
    if (fs.existsSync(LOCAL_DATA_PATH)) {
      const fetchedData = JSON.parse(fs.readFileSync(LOCAL_DATA_PATH, 'utf8'));
      if (fetchedData.profiles && Array.isArray(fetchedData.profiles)) {
        return fetchedData;
      }
    }
  } catch (error) {
    console.log("Failed to read bundled portfolio data:", error.message);
  }

  return defaultData;
};

const getCachedBlobUrl = async () => {
  const now = Date.now();
  if (cachedBlobPathname && now < cacheExpiresAt) {
    return cachedBlobPathname;
  }

  try {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 2500);
    const { blobs } = await list({
      prefix: DATA_BLOB_NAME,
      limit: 1,
      abortSignal: abortController.signal,
    });
    clearTimeout(timeoutId);
    
    if (blobs.length > 0) {
      // store pathname so we can use `get()` server-side for private blobs
      cachedBlobPathname = blobs[0].pathname || blobs[0].path || null;
      cacheExpiresAt = now + 60000; // Cache for 1 minute
      return cachedBlobPathname;
    }
  } catch (error) {
    console.log("Failed to fetch blob URL:", error.message);
  }
  return null;
};

// Helper: convert various kinds of streams to string
const streamToString = async (stream) => {
  if (!stream) return '';
  // Node.js Readable
  if (stream instanceof Readable) {
    return await new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      stream.on('error', reject);
    });
  }

  // Web ReadableStream
  if (typeof stream.getReader === 'function') {
    const reader = stream.getReader();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks).toString('utf8');
  }

  // Fallback: try to stringify
  try {
    return String(stream);
  } catch (e) {
    return '';
  }
};

const buildProfileSystemPrompt = (portfolioData, activeProfileId) => {
  const genericPrompt = "You are an AI assistant. Answer questions helpfully and professionally. Be concise and default to 80-120 words unless asked for more detail.";
  const profiles = Array.isArray(portfolioData.profiles) ? portfolioData.profiles : [];
  const requestedProfile = profiles.find((p) => p.id === activeProfileId);
  const currentActiveProfile = profiles.find((p) => p.id === portfolioData.activeProfileId);
  const activeProfile = requestedProfile || currentActiveProfile || profiles[0] || null;

  const profileName = activeProfile?.name || "Goutham";
  const profileRoles = (activeProfile?.roles || []).filter(Boolean).join(", ");
  const profileBio = (activeProfile?.experienceBio || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const projectTitles = (activeProfile?.projects || [])
    .map((p) => p?.title)
    .filter(Boolean)
    .slice(0, 6)
    .join(", ");

  let personaPrompt = (activeProfile?.systemPrompt || "").trim();
  if (!personaPrompt || personaPrompt === genericPrompt) {
    personaPrompt = `You are the AI assistant for ${profileName}. Focus only on this profile's professional background.`;
  }

  const profileSummary = [
    `Profile Name: ${profileName}`,
    profileRoles ? `Roles: ${profileRoles}` : "",
    profileBio ? `Bio Summary: ${profileBio.slice(0, 1600)}` : "",
    projectTitles ? `Project Highlights: ${projectTitles}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const strictRules = [
    "Strict Guardrails:",
    `1. Answer ONLY questions related to ${profileName}'s professional experience, skills, roles, projects, education, resume, or career background.`,
    "2. If a question is unrelated, refuse briefly and ask the user to ask about this profile instead.",
    "3. Do not answer general trivia, coding puzzles, politics, health, finance, or any topic unrelated to this profile.",
    "4. Keep answers professional and concise, defaulting to 80-120 words unless more detail is requested.",
    `5. Even for related technologies (for example Java, SpringBoot, Kafka, Redis), answer in ${profileName}'s profile context. Do NOT provide generic tutorials or boilerplate code unless the user explicitly asks for code tied to ${profileName}'s work context.`,
    `6. Prefer response framing like: 'In ${profileName}'s experience...' or 'Based on ${profileName}'s profile...'.`,
    `7. If the profile data does not contain evidence for a claim, explicitly say that detail is not available in ${profileName}'s profile and avoid inventing specifics.`,
    "8. Do not append generic upsell follow-up lines such as offering broad topic explorations; keep the reply focused on the user's question.",
  ].join("\n");

  const resumeContext = (activeProfile?.resumeText || "").trim();
  const systemPrompt = [
    personaPrompt,
    profileSummary,
    strictRules,
    resumeContext ? `Resume Extracted Text:\n${resumeContext.slice(0, 10000)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    activeProfile,
    systemPrompt,
  };
};

async function getPortfolioData() {
  try {
    if (isLocalEnv) {
      if (fs.existsSync(LOCAL_DATA_PATH)) {
        const fetchedData = JSON.parse(fs.readFileSync(LOCAL_DATA_PATH, 'utf8'));
        if (!fetchedData.profiles || !Array.isArray(fetchedData.profiles)) {
          console.log("Old schema detected in local file. Using default multi-profile data.");
          return defaultData;
        }
        return fetchedData;
      }
      return defaultData;
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.log("No BLOB token found, using bundled data");
      return readBundledPortfolioData();
    }

    // Try to get blob pathname from cache or list and read it server-side
    const blobPathname = await getCachedBlobUrl();
    if (blobPathname) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const result = await get(blobPathname, { access: 'private', useCache: false, abortSignal: controller.signal });
        clearTimeout(timeoutId);

        if (result && result.stream) {
          const text = await streamToString(result.stream);
          const fetchedData = JSON.parse(text || '{}');
          // Schema Migration Check
          if (!fetchedData.profiles || !Array.isArray(fetchedData.profiles)) {
            console.log("Old schema detected in blob. Dropping and using default multi-profile data.");
            return defaultData;
          }
          return fetchedData;
        }
      } catch (error) {
        console.log("Error fetching from blob:", error.message);
      }
    }

    return readBundledPortfolioData();
  } catch (error) {
    console.log("Error in getPortfolioData:", error.message);
  }
  return readBundledPortfolioData();
}

app.get("/api/portfolio", async (req, res) => {
  try {
    const data = await getPortfolioData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch portfolio data" });
  }
});

app.post("/api/portfolio", checkJwt, requireAdmin, async (req, res) => {
  try {
    const newData = req.body;
    
    if (isLocalEnv) {
      fs.writeFileSync(LOCAL_DATA_PATH, JSON.stringify(newData, null, 2));
      return res.json({ success: true, message: "Data updated locally" });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ error: "Vercel Blob token not configured" });
    }
    
    const blob = await put(DATA_BLOB_NAME, JSON.stringify(newData), {
      access: 'private',
      addRandomSuffix: false,
      contentType: 'application/json'
    });
    
    // Update cache with the new blob pathname so subsequent reads use server-side get()
    cachedBlobPathname = blob.pathname || blob.path || null;
    cacheExpiresAt = Date.now() + 60000; // Cache for 1 minute
    
    res.json({ success: true, message: "Data updated successfully" });
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ error: "Failed to save portfolio data" });
  }
});

// (internal test endpoint removed)

app.post("/api/upload", checkJwt, requireAdmin, async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }
    const file = req.files.file;

    if (isLocalEnv) {
      const uploadDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
      
      const safeName = Date.now() + '-' + file.name.replace(/\s+/g, '_');
      const filePath = path.join(uploadDir, safeName);
      await file.mv(filePath);
      
      return res.json({ url: `http://localhost:${PORT}/uploads/${safeName}` });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ error: "Vercel Blob token not configured" });
    }

    const blob = await put(file.name, file.data, {
      access: 'private',
      contentType: file.mimetype
    });
    
    res.json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

app.post("/api/parse-resume", checkJwt, requireAdmin, async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }
    const file = req.files.file;
    
    // 1. Upload file
    let url = "";
    if (isLocalEnv) {
      const uploadDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
      const safeName = Date.now() + '-' + file.name.replace(/\s+/g, '_');
      const filePath = path.join(uploadDir, safeName);
      await file.mv(filePath);
      url = `http://localhost:${PORT}/uploads/${safeName}`;
    } else {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return res.status(500).json({ error: "Vercel Blob token not configured" });
      }
      const blob = await put(file.name, file.data, {
        access: 'private',
        contentType: file.mimetype
      });
      url = blob.url;
    }

    // 2. Parse PDF
    let resumeText = "";
    try {
      const pdfData = await pdfParse(file.data);
      resumeText = pdfData.text;
    } catch (e) {
      console.error("PDF parse error:", e);
      return res.json({ url, error: "Failed to extract text from PDF." });
    }

    // 3. AI Parsing
    const portfolioData = await getPortfolioData();
    const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY;
    const model = portfolioData.chatbot?.model || "nvidia/nemotron-3-super-120b-a12b:free";

    if (!apiKey) {
      return res.json({ url, error: "API key not configured." });
    }

    const systemPrompt = `You are a professional resume parser. I will provide you with the raw text extracted from a resume. 
You must analyze the text and return a JSON object with exactly this schema:
{
  "profileName": "Primary Job Title or Specialization",
  "roles": ["Role 1", "Role 2", "Role 3"],
  "experienceBio": "A 2-3 paragraph professional bio summarizing their experience, formatted with basic HTML tags like <p>, <strong>, etc.",
  "projects": [
    {
      "title": "Project Name",
      "description": "2-3 sentence description of the project.",
      "imgPath": "",
      "isWork": true
    }
  ]
}

- Extract "profileName" as the primary job title or specialization (e.g., "Data Engineer", "Full Stack Developer"). Use the most recent or prominent title.
- Extract up to 3 roles.
- Create a comprehensive 2-3 paragraph professional bio summarizing their experience, skills, and achievements. Use HTML tags like <p>, <strong>, <em>, <li> for formatting.
- Extract up to 4 significant projects with titles and descriptions.
- "imgPath" must always be an empty string "".
- "isWork" should be true if it was done at a job, false if a personal project.
- Do NOT wrap your response in markdown formatting (no \`\`\`json). Return raw JSON only.`;

    const requestBody = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here is the resume text:\n\n${resumeText.substring(0, 10000)}` }
      ],
      temperature: 0.2,
      max_tokens: 1500,
    };

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 35000);
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Goutham's AI Parser",
      },
      body: JSON.stringify(requestBody),
      signal: abortController.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.json({ url, error: "AI API error during parsing." });
    }

    const aiData = await response.json();
    let reply = aiData.choices[0].message.content.trim();
    
    if (reply.startsWith("\`\`\`json")) {
      reply = reply.replace(/^\`\`\`json/, "").replace(/\`\`\`$/, "").trim();
    } else if (reply.startsWith("\`\`\`")) {
      reply = reply.replace(/^\`\`\`/, "").replace(/\`\`\`$/, "").trim();
    }

    let parsedData = null;
    try {
      parsedData = JSON.parse(reply);
    } catch (e) {
      console.error("AI returned invalid JSON:", reply);
      return res.json({ url, error: "AI returned invalid JSON format." });
    }

    res.json({ url, parsedData, resumeText: resumeText.substring(0, 15000) });
  } catch (error) {
    console.error("Parse resume error:", error);
    res.status(500).json({ error: "Failed to parse resume" });
  }
});

app.post("/api/models", async (req, res) => {
  try {
    const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY;

    const fetchModels = async (key) => {
      const headers = {};
      if (key) headers.Authorization = `Bearer ${key}`;
      return fetch("https://openrouter.ai/api/v1/models", { headers });
    };

    // OpenRouter model listing is public. Try with key first (if provided), then fallback without key.
    let response = await fetchModels(apiKey);
    if (!response.ok && apiKey) {
      response = await fetchModels("");
    }

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Failed to fetch models: ${errorText}` });
    }

    const payload = await response.json();
    const models = Array.isArray(payload?.data)
      ? payload.data
          .map((model) => ({
            id: model.id,
            name: model.name || model.id,
          }))
          .filter((model) => model.id)
          .sort((a, b) => a.id.localeCompare(b.id))
      : [];

    res.json({ models });
  } catch (error) {
    console.error("Models API error:", error.message);
    res.status(500).json({ error: "Failed to fetch models" });
  }
});

app.post("/api/chat", async (req, res) => {
  const { message, activeProfileId, sessionId: incomingSessionId, resetSession } = req.body;

  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  pruneExpiredChatSessions();

  const portfolioData = await getPortfolioData();
  const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY;
  const model = portfolioData.chatbot?.model || "nvidia/nemotron-3-super-120b-a12b:free";

  const { activeProfile, systemPrompt } = buildProfileSystemPrompt(portfolioData, activeProfileId);
  const profileId = activeProfile?.id || "default";
  const profileName = activeProfile?.name || "Goutham";

  let sessionId = incomingSessionId;
  if (!sessionId) {
    sessionId = generateSessionId();
  }

  if (resetSession) {
    chatSessions.delete(sessionId);
  }

  const existingSession = chatSessions.get(sessionId);
  const shouldReuseSession = existingSession && existingSession.profileId === profileId;

  const session = shouldReuseSession
    ? existingSession
    : {
        profileId,
        systemPrompt,
        history: [],
        updatedAt: Date.now(),
      };

  if (!shouldReuseSession) {
    chatSessions.set(sessionId, session);
  }

  if (!apiKey) {
    console.error("❌ API key not configured.");
    return res.status(500).json({ error: "API key not configured" });
  }

  console.log("📨 Chat request:", String(message).substring(0, 50) + "...", "| session:", sessionId, "| profile:", profileId);

  try {
    const trimmedHistory = session.history.slice(-MAX_SESSION_MESSAGES);
    const userMessage = { role: "user", content: String(message).trim() };

    const requestBody = {
      model,
      messages: [
        {
          role: "system",
          content: session.systemPrompt,
        },
        ...trimmedHistory,
        userMessage,
      ],
      temperature: 0.4,
      max_tokens: 220,
    };

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

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ 
        error: error.message || error.error?.message || "API error",
        details: error 
      });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || "I couldn't generate a response this time.";

    session.history = [...trimmedHistory, userMessage, { role: "assistant", content: reply }].slice(-MAX_SESSION_MESSAGES);
    session.updatedAt = Date.now();
    chatSessions.set(sessionId, session);

    res.status(200).json({ reply, sessionId, profileId, profileName });
  } catch (error) {
    console.error("❌ Chat API error:", error.message);
    res.status(500).json({ error: "Failed to get response: " + error.message });
  }
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL_ENV) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
