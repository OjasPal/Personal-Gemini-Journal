// Import modern tree-shakable Firebase modules
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Public infrastructure identifiers (Safe to expose in frontend client code)
const firebaseConfig = {
  apiKey: "AIzaSyBsKU-4Ll2Ljqhz9MDPMlRJoepU4Orb8EI",
  authDomain: "personal-gemini-journal-f790a.firebaseapp.com",
  projectId: "personal-gemini-journal-f790a",
  storageBucket: "personal-gemini-journal-f790a.firebasestorage.app",
  messagingSenderId: "931033287675",
  appId: "1:931033287675:web:a9f5176cf6f2f0c62ed95e",
  measurementId: "G-MPR9L2HJBQ"
};

// Initialize the Firebase container core
const app = initializeApp(firebaseConfig);

// Export instances to be used by our authentication UI views
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Custom high-performance wrapper to login and catch the ID token
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Force cryptographic server token extraction
    const idToken = await result.user.getIdToken(true);
    return { user: result.user, idToken };
  } catch (error) {
    console.error("Authentication handshake failed:", error);
    throw error;
  }
}
