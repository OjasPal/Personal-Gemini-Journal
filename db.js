const admin = require("firebase-admin");

// Secure Zero-File Pattern for Production Cloud Deployment
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

module.exports = { db };
