# ChatBot Backend Setup Required

## Current Issue
The chatbot feature at `/chatBot` route is currently non-functional because:
- The API handler in `src/api/chat.js` is designed for Next.js API routes
- Create React App doesn't support `/api` directory routing
- The chatbot will fail when trying to POST to `/api/chat`

## Solutions

### Option 1: Deploy Separate Backend (Recommended)
Create a Node.js/Express backend:

```bash
# Create backend folder
mkdir backend
cd backend
npm init -y
npm install express cors dotenv @google/generative-ai
```

Create `backend/server.js`:
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const chatHistory = [];

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    chatHistory.push({ role: 'user', parts: [{ text: message }] });
    
    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);
    const response = result.response.text();
    
    chatHistory.push({ role: 'model', parts: [{ text: response }] });
    
    res.json({ reply: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));
```

Update `src/components/chatBot.js`:
```javascript
const res = await fetch("http://localhost:5000/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: input }),
});
```

### Option 2: Use Vercel Serverless Functions
If deploying to Vercel:
1. Move `src/api/chat.js` to `api/chat.js` (root level)
2. Install dependencies: `npm install @google/generative-ai`
3. Deploy to Vercel - it will auto-detect the API routes

### Option 3: Use Firebase Cloud Functions
Deploy the chat handler as a Firebase Cloud Function and update the fetch URL.

### Option 4: Remove ChatBot Feature
If not needed, remove:
- `/chatBot` route from `App.js`
- `src/components/chatBot.js` file
- `src/api/chat.js` file
- Navigation link (if any)

## Environment Variables Needed
Create `.env` file in backend:
```
GOOGLE_API_KEY=your_gemini_api_key_here
```

Get API key from: https://makersuite.google.com/app/apikey
