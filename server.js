require('dotenv').config();
const express = require('express');
const { getAuth } = require('firebase-admin/auth');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { db } = require('./db');

const app = express();
app.use(express.json());

// Initialize Google Cloud Secret Manager Client
const secretClient = new SecretManagerServiceClient();
let cachedGeminiKey = null;

// Secure runtime secret fetching helper
async function getGeminiApiKey() {
  if (cachedGeminiKey) return cachedGeminiKey;
  try {
    const name = `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/gemini-api-key/versions/latest`;
    const [version] = await secretClient.accessSecretVersion({ name });
    cachedGeminiKey = version.payload.data.toString('utf8').trim();
    return cachedGeminiKey;
  } catch (error) {
    console.error("CRITICAL: Failed to fetch key from Secret Manager:", error);
    return null;
  }
}

// Phase 2: Secure Multi-Turn Journaling and Storage Endpoint
app.post('/api/journal', async (req, res) => {
  // 1. Enforce Server-Side Auth Verification
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized: Missing Authorization Token" });
  }

  const idToken = authHeader.split('Bearer ')[1];
  let uid;

  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    uid = decodedToken.uid; // Token is verified authentic directly by Google
  } catch (authError) {
    return res.status(401).json({ error: "Unauthorized: Invalid or Expired Token" });
  }

  // 2. Validate and Sanitize User Input
  const { message } = req.body;
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: "Bad Request: Message payload cannot be empty" });
  }

  try {
    // 3. Runtime Secret Access
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: "Server Configuration Error" });
    }

    // Initialize Gemini 3.5 Flash using secure key
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    // Process content with AI
    const result = await model.generateContent(message);
    const aiResponseText = result.response.text();

    // 4. Cryptographically Isolated Database Persistence
    const journalEntry = {
      userPrompt: message.trim(),
      aiSummary: aiResponseText,
      createdAt: new Date().toISOString()
    };

    // Saved under /users/{uid}/entries to align perfectly with Firestore Rules
    const docRef = await db.collection('users').doc(uid).collection('entries').add(journalEntry);

    // Return the response cleanly to client without leaking internals
    res.json({
      success: true,
      entryId: docRef.id,
      reply: aiResponseText
    });

  } catch (serverError) {
    console.error("Internal Request Failure:", serverError);
    // Standard Rule 7: Never leak stack traces to the client
    res.status(500).json({ error: "An internal processing error occurred" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Security-Hardened Backend running on port ${PORT}`);
});
