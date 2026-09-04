import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Lock, ArrowRight } from 'lucide-react';

export const LoginScreen = ({ onLogin }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSignIn = async () => {
    setErrorMsg(null);
    setIsAuthenticating(true);
    try {
      await onLogin();
    } catch (err) {
      setErrorMsg("Authorization intercept: " + (err.message || "Could not complete sign-in."));
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white dark:bg-[#0D0F15] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-8 shadow-subtle-elevated dark:shadow-dark-subtle-elevated relative overflow-hidden transition-colors"
      >
        {/* Glow accent */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500/10 dark:bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-brand-500/10 border border-indigo-200 dark:border-brand-500/30 flex items-center justify-center mb-6 shadow-sm dark:shadow-glow-indigo">
            <Shield className="w-7 h-7 text-indigo-600 dark:text-brand-400" />
          </div>

          <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-700 dark:text-brand-400 bg-indigo-50 dark:bg-brand-500/10 border border-indigo-200 dark:border-brand-500/20 px-2.5 py-1 rounded-full mb-3 font-semibold">
            Zero-Trust Workspace
          </span>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2.5">
            Personal Gemini Journal
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-8 max-w-sm">
            An isolated, cryptographically guarded journal environment. Continuity-aware AI companion with zero data leakage.
          </p>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 text-red-700 dark:text-red-300 text-xs text-left font-mono"
            >
              {errorMsg}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={handleSignIn}
            disabled={isAuthenticating}
            className="w-full py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 dark:bg-gradient-to-r dark:from-brand-600 dark:to-brand-500 dark:hover:from-brand-500 dark:hover:to-brand-400 text-white font-medium text-sm shadow-md dark:shadow-glow-indigo flex items-center justify-center gap-3 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isAuthenticating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4 opacity-75" />
              </>
            )}
          </motion.button>

          <div className="mt-6 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-brand-400" /> End-to-end Isolation
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-accent-emerald" /> Gemini Powered
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};