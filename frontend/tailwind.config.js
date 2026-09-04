/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          // Light defaults with dark overrides
          DEFAULT: '#f8fafc',             // Light: crisp, soft off-white canvas
          subtle: '#ffffff',              // Light: pure white card surface
          elevated: '#f1f5f9',            // Light: subtle elevated/input surface
          border: '#e2e8f0',              // Light: visible slate border
          'border-focus': 'rgba(79, 70, 229, 0.4)',

          // Explicit dark mode tokens
          'dark-DEFAULT': '#08090D',
          'dark-subtle': '#0D0F15',
          'dark-elevated': '#121520',
          'dark-border': 'rgba(255, 255, 255, 0.08)',
          'dark-border-focus': 'rgba(99, 102, 241, 0.35)',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          glow: 'rgba(99, 102, 241, 0.18)',
        },
        accent: {
          emerald: '#059669', // Vivid emerald in light mode (high contrast)
          'emerald-dark': '#10b981',
          'emerald-glow': 'rgba(16, 185, 129, 0.15)',
          'emerald-light-bg': '#ecfdf5',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace'
        ]
      },
      boxShadow: {
        'subtle-elevated': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 4px 14px -2px rgba(0, 0, 0, 0.06)',
        'dark-subtle-elevated': '0 1px 2px 0 rgba(0, 0, 0, 0.4), 0 4px 16px -2px rgba(0, 0, 0, 0.6)',
        'glow-indigo': '0 0 24px -4px rgba(79, 70, 229, 0.25)',
      },
      letterSpacing: {
        tightest: '-0.035em',
        tighter: '-0.025em',
        tight: '-0.015em',
      }
    },
  },
  plugins: [],
};