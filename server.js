const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env.local") });
const { put } = require('@vercel/blob');
const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');
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
const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_TIMEOUT_MS = Number(process.env.MONGODB_TIMEOUT_MS || 4000);
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || (() => {
  try {
    if (!MONGODB_URI) return 'portfolio';
    const pathname = new URL(MONGODB_URI).pathname.replace(/^\/+/, '');
    // Many Atlas URIs use /admin for auth; keep app data in a dedicated DB.
    if (!pathname || pathname.toLowerCase() === 'admin') return 'portfolio';
    return pathname;
  } catch (error) {
    return 'portfolio';
  }
})();
const PORTFOLIO_COLLECTION = 'portfolio_data';
const PORTFOLIO_DOCUMENT_ID = 'portfolio_data';
const RESUME_BUCKET_NAME = process.env.MONGODB_RESUME_BUCKET || 'resumes';

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

let mongoClient = null;
let mongoClientPromise = null;
let portfolioCache = defaultData;
let portfolioCacheSource = 'default';
let portfolioCacheUpdatedAt = new Date(0);
let portfolioBootstrapPromise = null;

const setPortfolioCache = (data, source, updatedAt = new Date()) => {
  if (data && Array.isArray(data.profiles)) {
    portfolioCache = data;
    portfolioCacheSource = source;
    portfolioCacheUpdatedAt = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
    console.log('[portfolio] cache updated', {
      source: portfolioCacheSource,
      activeProfileId: portfolioCache.activeProfileId,
      profileCount: portfolioCache.profiles.length,
    });
  }
};

const loadPortfolioFromMongo = async () => {
  const collection = await getPortfolioCollection();
  if (!collection) return null;

  const doc = await collection.findOne({ _id: PORTFOLIO_DOCUMENT_ID });
  if (doc?.data && Array.isArray(doc.data.profiles)) {
    setPortfolioCache(doc.data, 'mongo', doc.updatedAt || new Date());
    return doc.data;
  }
  return null;
};

const bootstrapPortfolioCache = async () => {
  if (portfolioBootstrapPromise) return portfolioBootstrapPromise;

  portfolioBootstrapPromise = (async () => {
    console.log('[portfolio] bootstrap start', { hasMongoUri: Boolean(MONGODB_URI), dbName: MONGODB_DB_NAME });

    if (!MONGODB_URI) {
      console.log('[portfolio] bootstrap using default profile because MONGODB_URI is missing');
      setPortfolioCache(defaultData, 'default');
      return portfolioCache;
    }

    try {
      const collection = await getPortfolioCollection();
      console.log('[portfolio] mongo connection ready', { dbName: MONGODB_DB_NAME, collection: PORTFOLIO_COLLECTION });

      const loaded = await loadPortfolioFromMongo();
      if (loaded) {
        console.log('[portfolio] bootstrap loaded portfolio from mongo');
        return loaded;
      }

      console.log('[portfolio] no mongo portfolio found, seeding default profile');
      await collection.updateOne(
        { _id: PORTFOLIO_DOCUMENT_ID },
        { $set: { data: defaultData, updatedAt: new Date() } },
        { upsert: true }
      );
      setPortfolioCache(defaultData, 'default-seeded-mongo');
      return defaultData;
    } catch (error) {
      console.error('[portfolio] bootstrap mongo failed:', error.message);
      setPortfolioCache(defaultData, 'default-fallback');
      return defaultData;
    }
  })();

  return portfolioBootstrapPromise;
};

setImmediate(() => {
  bootstrapPortfolioCache().catch((error) => {
    console.error('[portfolio] bootstrap unexpected error:', error.message);
  });
});

const getPortfolioCollection = async () => {
  if (!MONGODB_URI) return null;

  if (mongoClient) {
    return mongoClient.db(MONGODB_DB_NAME).collection(PORTFOLIO_COLLECTION);
  }

  if (!mongoClientPromise) {
    mongoClientPromise = MongoClient.connect(MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: MONGODB_TIMEOUT_MS,
      connectTimeoutMS: MONGODB_TIMEOUT_MS,
      socketTimeoutMS: MONGODB_TIMEOUT_MS,
    })
      .then((client) => {
        mongoClient = client;
        return client;
      })
      .catch((error) => {
        mongoClientPromise = null;
        throw error;
      });
  }

  const client = await mongoClientPromise;
  return client.db(MONGODB_DB_NAME).collection(PORTFOLIO_COLLECTION);
};

const getMongoDb = async () => {
  if (!MONGODB_URI) return null;
  if (mongoClient) {
    return mongoClient.db(MONGODB_DB_NAME);
  }

  if (!mongoClientPromise) {
    mongoClientPromise = MongoClient.connect(MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: MONGODB_TIMEOUT_MS,
      connectTimeoutMS: MONGODB_TIMEOUT_MS,
      socketTimeoutMS: MONGODB_TIMEOUT_MS,
    })
      .then((client) => {
        mongoClient = client;
        return client;
      })
      .catch((error) => {
        mongoClientPromise = null;
        throw error;
      });
  }

  const client = await mongoClientPromise;
  return client.db(MONGODB_DB_NAME);
};

const getResumeBucket = async () => {
  const db = await getMongoDb();
  if (!db) return null;
  return new GridFSBucket(db, { bucketName: RESUME_BUCKET_NAME });
};

const uploadResumePdfToMongo = async (file) => {
  const bucket = await getResumeBucket();
  if (!bucket) return null;

  const uploadStream = bucket.openUploadStream(file.name || `resume-${Date.now()}.pdf`, {
    contentType: file.mimetype || 'application/pdf',
    metadata: {
      originalName: file.name,
      uploadedAt: new Date(),
    },
  });

  await new Promise((resolve, reject) => {
    uploadStream.on('error', reject);
    uploadStream.on('finish', resolve);
    uploadStream.end(file.data);
  });

  const fileId = uploadStream.id.toString();
  return {
    fileId,
    url: `/api/resume/${fileId}`,
  };
};

const streamGridFsFile = async (fileId, req, res) => {
  const bucket = await getResumeBucket();
  if (!bucket) return false;

  let objectId;
  try {
    objectId = new ObjectId(fileId);
  } catch (error) {
    return false;
  }

  const files = await bucket.find({ _id: objectId }).toArray();
  if (!files.length) return false;

  const file = files[0];
  const uploadTime = new Date(file.uploadDate || Date.now());
  const etag = `"resume-${file._id.toString()}-${file.length || 0}-${uploadTime.getTime()}"`;

  res.set({
    'Content-Type': file.contentType || 'application/pdf',
    'Content-Disposition': `inline; filename="${file.filename || 'resume.pdf'}"`,
    ETag: etag,
    'Last-Modified': uploadTime.toUTCString(),
    'Cache-Control': 'public, max-age=31536000, immutable',
    'CDN-Cache-Control': 'public, s-maxage=31536000, stale-while-revalidate=86400',
    'Vercel-CDN-Cache-Control': 'public, s-maxage=31536000, stale-while-revalidate=86400',
  });

  if (req.headers['if-none-match'] === etag) {
    res.status(304).end();
    return true;
  }

  const ifModifiedSince = req.headers['if-modified-since'];
  if (ifModifiedSince) {
    const sinceTime = Date.parse(ifModifiedSince);
    if (!Number.isNaN(sinceTime) && uploadTime.getTime() <= sinceTime) {
      res.status(304).end();
      return true;
    }
  }

  await new Promise((resolve, reject) => {
    const downloadStream = bucket.openDownloadStream(objectId);
    downloadStream.on('error', reject);
    downloadStream.on('end', resolve);
    downloadStream.pipe(res);
  });

  return true;
};

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
    if (!portfolioBootstrapPromise) {
      bootstrapPortfolioCache().catch((error) => {
        console.error('[portfolio] bootstrap trigger failed:', error.message);
      });
    }

    console.log('[portfolio] returning cache', {
      source: portfolioCacheSource,
      activeProfileId: portfolioCache?.activeProfileId,
      profileCount: portfolioCache?.profiles?.length,
      updatedAt: portfolioCacheUpdatedAt instanceof Date ? portfolioCacheUpdatedAt.toISOString() : null,
    });

    getPortfolioData.lastUpdatedAt = portfolioCacheUpdatedAt;
    return portfolioCache || defaultData;
  } catch (error) {
    console.log("Error in getPortfolioData:", error.message);
  }
  return readBundledPortfolioData();
}

app.get("/api/portfolio", async (req, res) => {
  try {
    const data = await getPortfolioData();
    const updatedAt = getPortfolioData.lastUpdatedAt instanceof Date ? getPortfolioData.lastUpdatedAt : new Date(0);
    const etag = `"portfolio-${updatedAt.getTime()}-${JSON.stringify(data).length}"`;
    res.set({
      'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
      'CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
      ETag: etag,
      'Last-Modified': updatedAt.toUTCString(),
    });
    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }
    const ifModifiedSince = req.headers['if-modified-since'];
    if (ifModifiedSince) {
      const sinceTime = Date.parse(ifModifiedSince);
      if (!Number.isNaN(sinceTime) && updatedAt.getTime() <= sinceTime) {
        return res.status(304).end();
      }
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch portfolio data" });
  }
});

app.get('/api/resume/:fileId', async (req, res) => {
  try {
    const served = await streamGridFsFile(req.params.fileId, req, res);
    if (!served) {
      return res.status(404).json({ error: 'Resume file not found' });
    }
  } catch (error) {
    console.error('Resume download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to load resume file' });
    }
  }
});

// Dev-only helper: allow saving portfolio without Auth0 when running locally.
app.post("/api/portfolio/debug-save", async (req, res) => {
  try {
    if (!isLocalEnv) return res.status(403).json({ error: 'Forbidden' });
    const newData = req.body;

    const collection = await getPortfolioCollection();
    if (collection) {
      await collection.updateOne(
        { _id: PORTFOLIO_DOCUMENT_ID },
        { $set: { data: newData, updatedAt: new Date() } },
        { upsert: true }
      );
      setPortfolioCache(newData, 'mongo-write');
      console.log('Dev: portfolio data saved to mongo:', MONGODB_DB_NAME, PORTFOLIO_COLLECTION);
      return res.json({ success: true, message: 'Saved to mongo', data: newData });
    }

    fs.writeFileSync(LOCAL_DATA_PATH, JSON.stringify(newData, null, 2));
    console.log('Dev: portfolio data saved locally:', LOCAL_DATA_PATH);
    res.json({ success: true, message: 'Saved locally', data: newData });
  } catch (error) {
    console.error('Dev save error:', error);
    res.status(500).json({ error: 'Failed to save (dev)' });
  }
});

app.post("/api/portfolio/refresh", checkJwt, requireAdmin, async (req, res) => {
  try {
    const loaded = await loadPortfolioFromMongo();
    if (!loaded) {
      return res.status(404).json({ error: "No portfolio data found in MongoDB" });
    }

    res.json({
      success: true,
      message: "Portfolio data pulled from MongoDB",
      data: loaded,
      updatedAt: portfolioCacheUpdatedAt,
      source: portfolioCacheSource,
    });
  } catch (error) {
    console.error("Error refreshing portfolio from Mongo:", error);
    res.status(500).json({ error: "Failed to refresh portfolio from MongoDB" });
  }
});

app.post("/api/portfolio", checkJwt, requireAdmin, async (req, res) => {
  try {
    const newData = req.body;

    const collection = await getPortfolioCollection();
    if (collection) {
      await collection.updateOne(
        { _id: PORTFOLIO_DOCUMENT_ID },
        { $set: { data: newData, updatedAt: new Date() } },
        { upsert: true }
      );
      setPortfolioCache(newData, 'mongo-write');
      console.log('Portfolio data saved to mongo:', MONGODB_DB_NAME, PORTFOLIO_COLLECTION);
      return res.json({ success: true, message: "Data updated successfully", data: newData });
    }

    if (isLocalEnv) {
      fs.writeFileSync(LOCAL_DATA_PATH, JSON.stringify(newData, null, 2));
      setPortfolioCache(newData, 'local-write');
      return res.json({ success: true, message: "Data updated locally", data: newData });
    }
    return res.status(500).json({ error: "MongoDB not configured" });
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

    if (file.mimetype === 'application/pdf') {
      const storedResume = await uploadResumePdfToMongo(file);
      if (storedResume) {
        return res.json({ url: storedResume.url, fileId: storedResume.fileId });
      }
    }

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
      addRandomSuffix: true,
      contentType: file.mimetype,
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
    if (file.mimetype === 'application/pdf') {
      const storedResume = await uploadResumePdfToMongo(file);
      if (storedResume) {
        url = storedResume.url;
      }
    }

    if (!url && isLocalEnv) {
      const uploadDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
      const safeName = Date.now() + '-' + file.name.replace(/\s+/g, '_');
      const filePath = path.join(uploadDir, safeName);
      await file.mv(filePath);
      url = `http://localhost:${PORT}/uploads/${safeName}`;
    } else if (!url) {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return res.status(500).json({ error: "Vercel Blob token not configured" });
      }
      const blob = await put(file.name, file.data, {
        access: 'private',
        addRandomSuffix: true,
        contentType: file.mimetype,
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
