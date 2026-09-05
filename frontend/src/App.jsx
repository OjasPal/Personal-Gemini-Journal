import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginScreen } from './components/LoginScreen';
import { JournalInput } from './components/JournalInput';
import { JournalStream } from './components/JournalStream';
import { AskJournalModal } from './components/AskJournalModal';
import {
  Shield,
  LogOut,
  RefreshCw,
  Layers,
  Sun,
  Moon,
  Search,
  BookOpen,
  Brain,
  Lock,
  Download,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'https://journal-backend-931033287675.us-central1.run.app';
const THEME_STORAGE_KEY = 'journal_theme';

export default function App() {
  const { user, loading: authLoading, login, logout, getIdToken } = useAuth();

  // Navigation State (Feature 3: Single-page conditional view)
  const [activeView, setActiveView] = useState('journal'); // 'journal' | 'memories' | 'privacy'

  // Journal State
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [streamError, setStreamError] = useState(null);

  // Memories Panel State
  const [memories, setMemories] = useState([]);
  const [loadingMemories, setLoadingMemories] = useState(false);

  // Export State (Feature 2)
  const [isExporting, setIsExporting] = useState(false);

  // Data Wipe State
  const [isWiping, setIsWiping] = useState(false);
  const [wipeSuccess, setWipeSuccess] = useState(false);

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

  // Load Entries
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

  // Load Memories for Memories View
  const fetchMemories = useCallback(async () => {
    if (!user) return;
    setLoadingMemories(true);
    try {
      const token = await getIdToken(true);
      const response = await fetch(`${API_BASE_URL}/api/journal/memories`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMemories(data.memories || []);
    } catch (err) {
      console.error("Memories fetch failed", err);
    } finally {
      setLoadingMemories(false);
    }
  }, [user, getIdToken]);

  useEffect(() => {
    if (user) {
      fetchEntries();
      if (activeView === 'memories') {
        fetchMemories();
      }
    } else {
      setEntries([]);
      setMemories([]);
    }
  }, [user, fetchEntries, fetchMemories, activeView]);

  // Post Entry
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

  // Feature 2: Client-side Markdown Export
  const handleExportJournal = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const token = await getIdToken(true);
      const response = await fetch(`${API_BASE_URL}/api/journal/export`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("Failed to compile complete export.");
      }

      const data = await response.json();
      const allEntries = data.entries || [];
      const dateStr = new Date().toISOString().split('T')[0];

      let mdContent = `# Personal Gemini Journal Export\n\n`;
      mdContent += `> Complete export of isolated personal journal data.\n`;
      mdContent += `> Generated on: ${new Date().toUTCString()}\n`;
      mdContent += `> Total entries: ${allEntries.length}\n`;
      mdContent += `> Tenant Identity: Verified Cryptographic Session\n\n`;
      mdContent += `---\n\n`;

      allEntries.forEach((entry, idx) => {
        const entryDate = entry.createdAt ? new Date(entry.createdAt).toUTCString() : 'Unknown Date';
        mdContent += `## Entry ${idx + 1} — ${entryDate}\n\n`;
        mdContent += `### Your Journal\n\n${entry.userPrompt}\n\n`;
        mdContent += `### Gemini Companion Analysis\n\n${entry.aiSummary}\n\n`;
        if (entry.editedAt) {
          mdContent += `*Last Edited: ${new Date(entry.editedAt).toUTCString()}*\n\n`;
        }
        mdContent += `---\n\n`;
      });

      // Trigger browser download
      const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personal-gemini-journal-export-${dateStr}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      alert("Export failure: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Feature 3: Delete All My Data
  const handleDeleteAllData = async () => {
    const confirmed = window.confirm(
      "CRITICAL: Are you sure you want to permanently delete all your journal entries and semantic memory vectors? This operation is irreversible."
    );
    if (!confirmed) return;

    setIsWiping(true);
    try {
      const token = await getIdToken(true);
      const response = await fetch(`${API_BASE_URL}/api/journal/all`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Data wipe request failed");

      setEntries([]);
      setMemories([]);
      setWipeSuccess(true);
      setTimeout(() => setWipeSuccess(false), 5000);
    } catch (err) {
      alert("Error wiping data: " + err.message);
    } finally {
      setIsWiping(false);
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
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#08090D] text-slate-900 dark:text-slate-200 flex font-sans transition-colors">
      {/* Feature 3: Slim Professional Navigation Sidebar */}
      <aside className="w-16 md:w-56 border-r border-slate-200 dark:border-white/[0.08] bg-white/70 dark:bg-[#0D0F15]/70 backdrop-blur-md sticky top-0 h-screen flex flex-col justify-between py-5 px-2 md:px-3 z-30 transition-all">
        <div className="flex flex-col gap-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-brand-500/20 border border-indigo-200 dark:border-brand-500/40 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-indigo-600 dark:text-brand-400" />
            </div>
            <div className="hidden md:flex flex-col">
              <span className="font-bold text-xs tracking-tight text-slate-900 dark:text-slate-100">
                Gemini Journal
              </span>
              <span className="text-[10px] font-mono text-indigo-600 dark:text-brand-400">
                Isolated Workspace
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col gap-1.5">
            <button
              onClick={() => setActiveView('journal')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeView === 'journal'
                  ? 'bg-indigo-50 dark:bg-brand-500/15 text-indigo-700 dark:text-brand-300 font-semibold border border-indigo-200 dark:border-brand-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Journal</span>
            </button>

            <button
              onClick={() => setActiveView('memories')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeView === 'memories'
                  ? 'bg-indigo-50 dark:bg-brand-500/15 text-indigo-700 dark:text-brand-300 font-semibold border border-indigo-200 dark:border-brand-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Brain className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Memories</span>
            </button>

            <button
              onClick={() => setActiveView('privacy')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeView === 'privacy'
                  ? 'bg-indigo-50 dark:bg-brand-500/15 text-indigo-700 dark:text-brand-300 font-semibold border border-indigo-200 dark:border-brand-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Privacy</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="flex flex-col gap-2 pt-4 border-t border-slate-200 dark:border-white/5">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            <span className="hidden md:inline">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Action Bar */}
        <header className="h-16 border-b border-slate-200 dark:border-white/[0.08] bg-white/80 dark:bg-[#0D0F15]/80 backdrop-blur-md sticky top-0 z-20 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-sm tracking-tight capitalize text-slate-900 dark:text-slate-100">
              {activeView}
            </h1>
            <span className="text-xs text-slate-400 font-mono">/</span>
            <span className="text-xs text-slate-500 font-mono">
              {user.displayName || user.email}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Ask My Journal Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAskModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-brand-500/10 hover:bg-indigo-100 dark:hover:bg-brand-500/20 border border-indigo-200 dark:border-brand-500/30 text-xs font-medium text-indigo-700 dark:text-brand-300 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Ask My Journal</span>
            </motion.button>

            {/* Refresh Stream Button */}
            {activeView === 'journal' && (
              <button
                onClick={fetchEntries}
                disabled={loadingEntries}
                className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 cursor-pointer"
                title="Refresh entries"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingEntries ? 'animate-spin text-indigo-600 dark:text-brand-400' : ''}`} />
              </button>
            )}
          </div>
        </header>

        {/* View Switcher Panels */}
        <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8">
          {/* 1. JOURNAL VIEW */}
          {activeView === 'journal' && (
            <div className="flex flex-col gap-6">
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
            </div>
          )}

          {/* 2. MEMORIES VIEW */}
          {activeView === 'memories' && (
            <div className="flex flex-col gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0D0F15] border border-slate-200 dark:border-white/[0.08] shadow-subtle-elevated">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-indigo-600 dark:text-brand-400" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Indexed Semantic Memories
                    </h3>
                  </div>
                  <button
                    onClick={fetchMemories}
                    disabled={loadingMemories}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingMemories ? 'animate-spin text-indigo-600' : ''}`} />
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  These memory snippets are vector-indexed in your isolated Firestore subcollection. They are retrieved to inform contextual continuity and "Ask My Journal" answers.
                </p>
              </div>

              {loadingMemories ? (
                <div className="p-8 text-center text-xs font-mono text-slate-500">
                  Loading indexed memory vectors...
                </div>
              ) : memories.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-xs text-slate-500">
                  No memory snippets indexed yet. Click "Ask My Journal" → "Index Past Entries" to backfill.
                </div>
              ) : (
                <div className="space-y-3">
                  {memories.map((mem) => (
                    <div
                      key={mem.id}
                      className="p-4 rounded-xl bg-white dark:bg-[#0D0F15] border border-slate-200 dark:border-white/[0.08] shadow-sm flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>Source: {mem.sourceEntryId || 'Direct'}</span>
                        <span>{mem.createdAt ? new Date(mem.createdAt).toLocaleDateString() : 'Recent'}</span>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                        {mem.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. PRIVACY & EXPORT VIEW */}
          {activeView === 'privacy' && (
            <div className="flex flex-col gap-6">
              {/* Privacy Architecture Audit Card */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0D0F15] border border-slate-200 dark:border-white/[0.08] shadow-subtle-elevated">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-indigo-600 dark:text-brand-400" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Constitutional Security Guarantees
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-accent-emerald shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Server-Side Auth Verification</h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Firebase ID tokens verified cryptographically on every request.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-accent-emerald shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Isolated Storage Scopes</h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">All records scoped under /users/&#123;uid&#125;/... with zero cross-tenant read/write paths.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-accent-emerald shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Secret Manager Isolation</h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Gemini credentials resolved at runtime via Google Cloud Secret Manager with TTL caching.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-accent-emerald shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Prompt Injection Boundaries</h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Historical entries isolated inside XML non-execution boundary envelopes.</p>
                    </div>
                  </div>
                </div>

                {/* Feature 2: Export Journal Action */}
                <div className="pt-4 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Export Complete Journal</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">Download your entire un-capped personal history as a formatted Markdown file.</p>
                  </div>
                  <button
                    onClick={handleExportJournal}
                    disabled={isExporting}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>{isExporting ? "Compiling..." : "Export Journal (.md)"}</span>
                  </button>
                </div>
              </div>

              {/* Data Deletion Card */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0D0F15] border border-red-200 dark:border-red-500/20 shadow-subtle-elevated">
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Delete All My Data
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  Permanently purge every entry in your <code className="font-mono text-[11px]">/users/&#123;uid&#125;/entries</code> subcollection and all associated memory vectors. This action cannot be reversed.
                </p>

                {wipeSuccess && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 font-mono">
                    All personal data successfully purged from Firestore.
                  </div>
                )}

                <button
                  onClick={handleDeleteAllData}
                  disabled={isWiping}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isWiping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>{isWiping ? "Purging data..." : "Delete All My Data"}</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Grounded Search Modal */}
      <AskJournalModal
        isOpen={isAskModalOpen}
        onClose={() => setIsAskModalOpen(false)}
      />
    </div>
  );
}