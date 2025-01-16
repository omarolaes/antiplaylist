import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        'spinner-line': 'spinner-line 1.2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'marquee': 'marquee 20s linear infinite',
        'circle-left': 'circle-left 2s ease-in-out infinite',
        'circle-right': 'circle-right 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'from-bottom': 'from-bottom 1s ease forwards',
        'shader-appear': 'shader-appear 2s ease-out forwards',
        'correct-answer': 'correct-answer 0.5s ease-out forwards',
        'appear': 'appear 0.5s ease-out forwards',
      },
      keyframes: {
        'spinner-line': {
          '0%': { opacity: '0.1' },
          '20%': { opacity: '1' },
          '80%': { opacity: '0.1' },
          '100%': { opacity: '0.1' },
        },
        'marquee': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'circle-left': {
          '0%': { transform: 'translateX(-25%)' },
          '25%': { transform: 'translateX(0%)' },
          '50%': { transform: 'translateX(25%)' },
          '75%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-25%)' },
        },
        'circle-right': {
          '0%': { transform: 'translateX(25%)' },
          '25%': { transform: 'translateX(0%)' },
          '50%': { transform: 'translateX(-25%)' },
          '75%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(25%)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'from-bottom': {
          '0%': { 
            transform: 'translateY(100%)',
            opacity: '0'
          },
          '50%': {
            transform: 'translateY(50%)',
            opacity: '0.5'
          },
          '100%': { 
            transform: 'translateY(0)',
            opacity: '1'
          },
        },
        'shader-appear': {
          '0%': { 
            opacity: '0',
            transform: 'translate(-50%, -50%) scale(1.1)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translate(-50%, -50%) scale(1)'
          },
        },
        'correct-answer': {
          '0%': { 
            opacity: '0',
            transform: 'translateY(20px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'appear': {
          '0%': { 
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
