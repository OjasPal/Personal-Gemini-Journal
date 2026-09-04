import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginScreen } from './components/LoginScreen';
import { JournalInput } from './components/JournalInput';
import { JournalStream } from './components/JournalStream';
import { Shield, LogOut, RefreshCw, Layers, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE_URL = 'http://localhost:5000';
const THEME_STORAGE_KEY = 'journal_theme';

export default function App() {
  const { user, loading: authLoading, login, logout, getIdToken } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [streamError, setStreamError] = useState(null);

  // Initialize theme with safe allowlist validation (Rule 4)
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  // Synchronize 'dark' class on <html> root and persist choice in localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.warn("Unable to persist theme to localStorage:", e.message);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  /**
   * Loads past entries via GET /api/journal (Rule 1 & Rule 2)
   */
  const fetchEntries = useCallback(async () => {
    if (!user) return;
    setLoadingEntries(true);
    setStreamError(null);

    try {
      const token = await getIdToken(true);
      const response = await fetch(`${API_BASE_URL}/api/journal`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setEntries(data.entries || []);
    } catch (err) {
      console.error("Journal retrieval failure:", err.message);
      setStreamError("Failed to synchronize journal stream from isolated storage.");
    } finally {
      setLoadingEntries(false);
    }
  }, [user, getIdToken]);

  useEffect(() => {
    if (user) {
      fetchEntries();
    } else {
      setEntries([]);
    }
  }, [user, fetchEntries]);

  /**
   * Submits a new journal entry via POST /api/journal
   */
  const handlePostEntry = async (promptText) => {
    setSubmitting(true);
    try {
      const token = await getIdToken(true);
      const response = await fetch(`${API_BASE_URL}/api/journal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: promptText })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Transmission error (${response.status})`);
      }

      const data = await response.json();

      const newEntry = {
        id: data.entryId || String(Date.now()),
        userPrompt: promptText,
        aiSummary: data.reply,
        createdAt: new Date().toISOString()
      };

      setEntries((prev) => [newEntry, ...prev]);
    } catch (err) {
      console.error("Transmission failure:", err.message);
      alert("Security pipeline alert: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Initial Fullscreen Authentication Loader
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-[#08090D] flex flex-col items-center justify-center transition-colors">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/30 dark:border-brand-500/40 flex items-center justify-center animate-pulse mb-3">
          <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        </div>
        <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Verifying session context...</span>
      </div>
    );
  }

  // Unauthenticated State
  if (!user) {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2.5 rounded-xl bg-white dark:bg-[#0D0F15] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        </div>
        <LoginScreen onLogin={login} />
      </div>
    );
  }

  // Authenticated Dashboard Layout
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#08090D] text-slate-900 dark:text-slate-200 flex flex-col font-sans transition-colors">
      {/* SaaS Navigation Header */}
      <nav className="h-16 border-b border-slate-200 dark:border-white/[0.08] bg-white/80 dark:bg-[#0D0F15]/80 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-brand-500/20 border border-indigo-200 dark:border-brand-500/40 flex items-center justify-center shadow-sm dark:shadow-glow-indigo">
            <Shield className="w-4 h-4 text-indigo-600 dark:text-brand-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-slate-100">
              Personal Gemini Journal
            </span>
            <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-brand-500/10 border border-indigo-200 dark:border-brand-500/20 text-[10px] font-mono font-medium text-indigo-700 dark:text-brand-400">
              Isolated v1.2
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            aria-label="Toggle Color Theme"
            className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </motion.button>

          {/* Refresh Stream Button */}
          <button
            onClick={fetchEntries}
            disabled={loadingEntries}
            title="Refresh stream"
            className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingEntries ? 'animate-spin text-indigo-600 dark:text-brand-400' : ''}`} />
          </button>

          <div className="h-5 w-[1px] bg-slate-200 dark:bg-white/10 mx-1" />

          {/* User Profile & Sign Out */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium max-w-[140px] truncate hidden sm:inline">
              {user.displayName || user.email}
            </span>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/[0.08] text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Sign Out</span>
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
        <JournalInput onSubmit={handlePostEntry} isSubmitting={submitting} />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Isolated Journal Stream</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-500">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'} synced
            </span>
          </div>

          {/* Connected setEntries prop for real-time deletion synchronization */}
          <JournalStream
            entries={entries}
            setEntries={setEntries}
            isLoading={loadingEntries}
            error={streamError}
            onRetry={fetchEntries}
          />
        </div>
      </main>
    </div>
  );
}