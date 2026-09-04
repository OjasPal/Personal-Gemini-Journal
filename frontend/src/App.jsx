import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginScreen } from './components/LoginScreen';
import { JournalInput } from './components/JournalInput';
import { JournalStream } from './components/JournalStream';
import { AskJournalModal } from './components/AskJournalModal';
import { Shield, LogOut, RefreshCw, Layers, Sun, Moon, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE_URL = 'http://localhost:5000';
const THEME_STORAGE_KEY = 'journal_theme';

export default function App() {
  const { user, loading: authLoading, login, logout, getIdToken } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);

  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

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
      console.warn("Unable to persist theme:", e.message);
    }
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    setLoadingEntries(true);
    setStreamError(null);

    try {
      const token = await getIdToken(true);
      const response = await fetch(`${API_BASE_URL}/api/journal`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setEntries(data.entries || []);
    } catch (err) {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gemini is temporarily unavailable. Please try again.");
      }

      const newEntry = {
        id: data.entryId || String(Date.now()),
        userPrompt: promptText,
        aiSummary: data.reply,
        createdAt: new Date().toISOString()
      };

      setEntries((prev) => [newEntry, ...prev]);
    } catch (err) {
      alert(err.message || "Gemini is temporarily busy. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-[#08090D] flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/30 flex items-center justify-center animate-pulse mb-3">
          <Shield className="w-5 h-5 text-indigo-600 dark:text-brand-400" />
        </div>
        <span className="text-xs font-mono text-slate-500">Verifying session context...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white dark:bg-[#0D0F15] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 shadow-sm cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
        <LoginScreen onLogin={login} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#08090D] text-slate-900 dark:text-slate-200 flex flex-col font-sans transition-colors">
      {/* Navigation Header */}
      <nav className="h-16 border-b border-slate-200 dark:border-white/[0.08] bg-white/80 dark:bg-[#0D0F15]/80 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-brand-500/20 border border-indigo-200 dark:border-brand-500/40 flex items-center justify-center">
            <Shield className="w-4 h-4 text-indigo-600 dark:text-brand-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-slate-100">
              Personal Gemini Journal
            </span>
            <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-brand-500/10 border border-indigo-200 dark:border-brand-500/20 text-[10px] font-mono font-medium text-indigo-700 dark:text-brand-400">
              v2.0 Memories
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Ask My Journal Trigger Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAskModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-brand-500/10 hover:bg-indigo-100 dark:hover:bg-brand-500/20 border border-indigo-200 dark:border-brand-500/30 text-xs font-medium text-indigo-700 dark:text-brand-300 transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Ask My Journal</span>
          </motion.button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          <button
            onClick={fetchEntries}
            disabled={loadingEntries}
            className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingEntries ? 'animate-spin text-indigo-600 dark:text-brand-400' : ''}`} />
          </button>

          <div className="h-5 w-[1px] bg-slate-200 dark:bg-white/10 mx-1" />

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/[0.08] text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
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

          <JournalStream
            entries={entries}
            setEntries={setEntries}
            isLoading={loadingEntries}
            error={streamError}
            onRetry={fetchEntries}
          />
        </div>
      </main>

      {/* Grounded Search Modal */}
      <AskJournalModal
        isOpen={isAskModalOpen}
        onClose={() => setIsAskModalOpen(false)}
      />
    </div>
  );
}