require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getAuth } = require('firebase-admin/auth');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { db } = require('./db');

const app = express();

// Rule 5: Least privilege CORS policy
const ALLOWED_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === ALLOWED_ORIGIN) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  methods: ['POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rule 4: Limit JSON body size to prevent payload exhaustion attacks
app.use(express.json({ limit: '16kb' }));

// Rule 3: Secret Manager with caching and TTL (1 hour rotation window)
const secretClient = new SecretManagerServiceClient();
let cachedGeminiKey = null;
let keyFetchedAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

async function getGeminiApiKey() {
  const now = Date.now();
  if (cachedGeminiKey && (now - keyFetchedAt < CACHE_TTL_MS)) {
    return cachedGeminiKey;
  }

  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) {
    console.error("CRITICAL: GOOGLE_CLOUD_PROJECT environment variable is missing.");
    return null;
  }

  try {
    const name = `projects/${projectId}/secrets/gemini-api-key/versions/latest`;
    const [version] = await secretClient.accessSecretVersion({ name });
    cachedGeminiKey = version.payload.data.toString('utf8').trim();
    keyFetchedAt = now;
    return cachedGeminiKey;
  } catch (error) {
    console.error("CRITICAL: Secret Manager access failed:", error.message);
    return null;
  }
}

// Validation constants
const MAX_MESSAGE_LENGTH = 4000; // Constrain prompt tokens

app.post('/api/journal', async (req, res, next) => {
  try {
    // Rule 1: Strict Auth token extraction and revocation check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized: Missing Authorization Token" });
    }

    const idToken = authHeader.substring(7).trim();
    let uid;

    try {
      // checkRevoked=true guarantees deactivated users cannot make requests
      const decodedToken = await getAuth().verifyIdToken(idToken, true);
      uid = decodedToken.uid;
    } catch (authError) {
      return res.status(401).json({ error: "Unauthorized: Invalid or Expired Token" });
    }

    // Rule 4: Rigorous input validation and boundaries
    const { message } = req.body;
    if (typeof message !== 'string') {
      return res.status(400).json({ error: "Bad Request: Invalid message format" });
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return res.status(400).json({ error: "Bad Request: Message cannot be empty" });
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        error: `Bad Request: Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`
      });
    }

    // Rule 3: Secure secret retrieval
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: "Server Configuration Error" });
    }

    // AI Generation
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const result = await model.generateContent(trimmedMessage);
    const aiResponseText = result.response.text();

    // Rule 2: Multi-tenant isolated storage path
    const journalEntry = {
      userPrompt: trimmedMessage,
      aiSummary: aiResponseText,
      createdAt: new Date().toISOString()
    };

    const docRef = await db
      .collection('users')
      .doc(uid)
      .collection('entries')
      .add(journalEntry);

    return res.status(201).json({
      success: true,
      entryId: docRef.id,
      reply: aiResponseText
    });

  } catch (error) {
    // Pass to global error middleware
    next(error);
  }
});

// Rule 4 & 5: Maximum limit of historical records returned in a single fetch
const MAX_JOURNAL_HISTORY_LIMIT = 50;

/**
 * GET /api/journal
 * Retrieves the authenticated user's journal entries in descending chronological order.
 */
app.get('/api/journal', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized: Missing Authorization Token" });
    }

    const idToken = authHeader.substring(7).trim();
    let uid;

    try {
      const decodedToken = await getAuth().verifyIdToken(idToken, true);
      uid = decodedToken.uid;
    } catch (authError) {
      return res.status(401).json({ error: "Unauthorized: Invalid or Expired Token" });
    }

    const snapshot = await db
      .collection('users')
      .doc(uid)
      .collection('entries')
      .orderBy('createdAt', 'desc')
      .limit(MAX_JOURNAL_HISTORY_LIMIT)
      .get();

    const entries = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userPrompt: typeof data.userPrompt === 'string' ? data.userPrompt : '',
        aiSummary: typeof data.aiSummary === 'string' ? data.aiSummary : '',
        createdAt: data.createdAt || null
      };
    });

    return res.status(200).json({
      success: true,
      count: entries.length,
      entries
    });

  } catch (error) {
    next(error);
  }
});

// Rule 7: Global error handler preventing any stack trace or internal path leak
app.use((err, req, res, next) => {
  console.error("Internal Request Failure:", err.message);
  res.status(500).json({ error: "An internal processing error occurred" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Security-Hardened Backend running on port ${PORT}`);
});