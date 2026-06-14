/** @type {import('tailwindcss').Config} */
// The token values live in src/design/tokens.ts; they are mirrored here so
// Tailwind utilities (bg-warm, text-ink, ...) stay in sync with the design system.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        warm: '#FBF6EE',
        'warm-deep': '#F1E7D6',
        ink: '#2B2A26',
        'ink-soft': '#6B655B',
        'subject-pop': '#E8743B',
        'calm-1': '#6FA8A0',
        'reward-glow': '#FCE3A8',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      borderRadius: {
        soft: '1.5rem',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.025)' },
        },
        wag: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '35%': { transform: 'translateY(-6%) scale(1.04)' },
          '70%': { transform: 'translateY(0) scale(0.99)' },
        },
        peek: {
          '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
          '40%': { transform: 'rotate(-6deg) scale(1.05)' },
          '60%': { transform: 'rotate(4deg) scale(1.03)' },
        },
        glow: {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '30%': { opacity: '0.85' },
          '100%': { opacity: '0', transform: 'scale(1.6)' },
        },
        fadein: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        breathe: 'breathe 4.5s ease-in-out infinite',
        glow: 'glow 700ms ease-out forwards',
        fadein: 'fadein 450ms ease-out both',
      },
    },
  },
  plugins: [],
}
