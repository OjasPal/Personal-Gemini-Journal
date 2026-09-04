require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getAuth } = require('firebase-admin/auth');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { db } = require('./db');

const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const secretClient = new SecretManagerServiceClient();
let cachedGeminiKey = null;

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

app.post('/api/journal', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized: Missing Authorization Token" });
  }

  const idToken = authHeader.split('Bearer ')[1];
  let uid;

  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    uid = decodedToken.uid;
  } catch (authError) {
    return res.status(401).json({ error: "Unauthorized: Invalid or Expired Token" });
  }

  const { message } = req.body;
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: "Bad Request: Message payload cannot be empty" });
  }

  try {
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: "Server Configuration Error" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const result = await model.generateContent(message);
    const aiResponseText = result.response.text();

    const journalEntry = {
      userPrompt: message.trim(),
      aiSummary: aiResponseText,
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('users').doc(uid).collection('entries').add(journalEntry);

    res.json({
      success: true,
      entryId: docRef.id,
      reply: aiResponseText
    });

  } catch (serverError) {
    console.error("Internal Request Failure:", serverError);
    res.status(500).json({ error: "An internal processing error occurred" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Security-Hardened Backend running on port ${PORT}`);
});
