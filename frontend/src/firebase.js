import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Public Firebase configuration identifiers (Rule 3 compliant)
const firebaseConfig = {
  apiKey: "AIzaSyBsKU-4Ll2Ljqhz9MDPMlRJoepU4Orb8EI",
  authDomain: "personal-gemini-journal-f790a.firebaseapp.com",
  projectId: "personal-gemini-journal-f790a",
  storageBucket: "personal-gemini-journal-f790a.firebasestorage.app",
  messagingSenderId: "931033287675",
  appId: "1:931033287675:web:a9f5176cf6f2f0c62ed95e",
  measurementId: "G-MPR9L2HJBQ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Executes secure OAuth sign-in and extracts an initial verified token.
 */
export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const token = await result.user.getIdToken(true);
  return { user: result.user, token };
}