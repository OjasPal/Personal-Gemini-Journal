import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  User,
  Calendar,
  CheckCircle2,
  Trash2,
  Loader2,
  MoreHorizontal,
  Copy,
  Check,
  Edit3,
  Bot
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({
  gfm: true,
  breaks: true,
});

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if ('target' in node) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export const JournalEntry = ({ entry, onDelete, onEdit }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Independent copy confirmation states
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedAi, setCopiedAi] = useState(false);

  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(entry.userPrompt);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  const sanitizedAiHtml = useMemo(() => {
    if (!entry.aiSummary) return '';
    const rawParsed = marked.parse(entry.aiSummary);
    return DOMPurify.sanitize(rawParsed, {
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'b', 'i', 'code', 'pre',
        'blockquote', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'a', 'span'
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
    });
  }, [entry.aiSummary]);

  const formattedDate = useMemo(() => {
    if (!entry.createdAt) return 'Recent';
    try {
      const d = new Date(entry.createdAt);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d);
    } catch {
      return 'Recent';
    }
  }, [entry.createdAt]);

  const copyPromptOnly = async () => {
    try {
      await navigator.clipboard.writeText(entry.userPrompt);
      setCopiedPrompt(true);
      setShowMenu(false);
      setTimeout(() => setCopiedPrompt(false), 1500);
    } catch (e) {
      console.error("Clipboard copy failed", e);
    }
  };

  const copyAiOnly = async () => {
    try {
      await navigator.clipboard.writeText(entry.aiSummary);
      setCopiedAi(true);
      setShowMenu(false);
      setTimeout(() => setCopiedAi(false), 1500);
    } catch (e) {
      console.error("Clipboard copy failed", e);
    }
  };

  const handleSaveEdit = async () => {
    if (!editedPrompt.trim() || isSavingEdit) return;
    setIsSavingEdit(true);
    setEditError(null);
    try {
      await onEdit(entry.id, editedPrompt.trim());
      setIsEditing(false);
    } catch (err) {
      setEditError(err.message || "Failed to save edits.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!showConfirmDelete) {
      setShowConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(entry.id);
    } catch {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group bg-white dark:bg-[#0D0F15] hover:bg-slate-50/80 dark:hover:bg-[#121520]/70 border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/15 rounded-2xl p-5 shadow-subtle-elevated dark:shadow-dark-subtle-elevated transition-all duration-200 mb-4 relative"
    >
      {/* Top Bar: User Badge, Timestamp, and ⋯ Menu */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center">
            <User className="w-3 h-3 text-slate-600 dark:text-slate-400" />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">
            You
          </span>
          {entry.editedAt && (
            <span className="text-[10px] font-mono text-indigo-600 dark:text-brand-400 bg-indigo-50 dark:bg-brand-500/10 px-1.5 py-0.5 rounded">
              Edited
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400 mr-1">
            <Calendar className="w-3 h-3" />
            <span>{formattedDate}</span>
          </div>

          {/* Independent Copy Indicator Feedback */}
          {copiedPrompt && (
            <span className="text-[10px] font-mono text-emerald-600 dark:text-accent-emerald flex items-center gap-1">
              <Check className="w-3 h-3" /> Prompt copied
            </span>
          )}
          {copiedAi && (
            <span className="text-[10px] font-mono text-emerald-600 dark:text-accent-emerald flex items-center gap-1">
              <Check className="w-3 h-3" /> Reply copied
            </span>
          )}

          {/* Delete Confirmation Alert */}
          {showConfirmDelete ? (
            <div className="flex items-center gap-1 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-1">
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="px-2 py-0.5 text-[10px] font-mono font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Wiping..." : "Confirm"}
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                disabled={isDeleting}
                className="px-1 py-0.5 text-[10px] font-mono text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            /* Overflow Menu ⋯ (Shows on hover) */
            <div className="relative">
              <button
                onClick={() => setShowMenu((prev) => !prev)}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
                title="Entry options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-30 py-1 text-xs font-sans overflow-hidden"
                  >
                    <button
                      onClick={copyPromptOnly}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy your prompt</span>
                    </button>

                    <button
                      onClick={copyAiOnly}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <Bot className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Gemini reply</span>
                    </button>

                    <div className="h-[1px] bg-slate-100 dark:bg-white/5 my-1" />

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setIsEditing(true);
                        setEditedPrompt(entry.userPrompt);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Edit & regenerate</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowConfirmDelete(true);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete entry</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* User Prompt (Normal or Inline Edit Mode) */}
      {isEditing ? (
        <div className="pl-7 mb-4">
          <textarea
            rows={3}
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            disabled={isSavingEdit}
            className="w-full bg-slate-50 dark:bg-[#08090D] border border-indigo-400 dark:border-brand-500/40 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-y"
          />
          {editError && (
            <p className="text-xs text-red-500 font-mono mt-1">{editError}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleSaveEdit}
              disabled={isSavingEdit || !editedPrompt.trim()}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSavingEdit ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Regenerating...</span>
                </>
              ) : (
                <span>Save & Regenerate</span>
              )}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditError(null);
              }}
              disabled={isSavingEdit}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap pl-7 mb-4">
          {entry.userPrompt}
        </p>
      )}

      {/* Divider */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-white/[0.08] to-transparent my-3.5" />

      {/* Gemini Companion Output */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-accent-emerald-glow border border-emerald-200 dark:border-accent-emerald/30 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-emerald-600 dark:text-accent-emerald" />
            </div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 dark:text-accent-emerald font-semibold flex items-center gap-1.5">
              <span>Gemini Companion</span>
              <CheckCircle2 className="w-3 h-3 opacity-70" />
            </span>
          </div>
        </div>

        <div
          className="gemini-prose pl-7"
          dangerouslySetInnerHTML={{ __html: sanitizedAiHtml }}
        />
      </div>
    </motion.div>
  );
};