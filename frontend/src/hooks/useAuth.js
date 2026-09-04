import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, loginWithGoogle } from '../firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    }, (error) => {
      console.error("Auth state observer failure:", error);
      setAuthError("Failed to synchronize authentication state.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async () => {
    setAuthError(null);
    try {
      return await loginWithGoogle();
    } catch (err) {
      console.error("Authentication handshake failure:", err.message);
      setAuthError(err.message || "Failed to sign in with Google.");
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Sign-out failure:", err);
    }
  }, []);

  /**
   * Rule 1: Always acquires fresh cryptographic ID token before server operations
   */
  const getIdToken = useCallback(async (forceRefresh = false) => {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken(forceRefresh);
  }, []);

  return {
    user,
    loading,
    authError,
    login,
    logout,
    getIdToken,
  };
}