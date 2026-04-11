/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary Islamic greens
        emerald: {
          950: '#052e1c',
          900: '#0a4f2e',
          800: '#0d6b3d',
          700: '#108a4d',
          600: '#14a860',
          500: '#1cc97a',
          400: '#4dd992',
          300: '#7de8b0',
          200: '#adf3cd',
          100: '#d6f9e8',
          50:  '#edfcf3',
        },
        // Warm gold accents
        gold: {
          950: '#3b2500',
          900: '#7a4e00',
          800: '#a66c00',
          700: '#c9870a',
          600: '#d4a017',
          500: '#e8b832',
          400: '#f0cb5a',
          300: '#f5d98a',
          200: '#f9e8b5',
          100: '#fcf3d9',
          50:  '#fef9ee',
        },
        // Parchment/cream backgrounds
        parchment: {
          950: '#1a1410',
          900: '#2d2218',
          800: '#4a3828',
          700: '#6b5040',
          600: '#8c6e58',
          500: '#b09070',
          400: '#c8ae94',
          300: '#deccb8',
          200: '#ede3d6',
          100: '#f5efe6',
          50:  '#faf6f1',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        arabic: ['"Amiri"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'geometric': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230d6b3d' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-in': 'slideIn 0.3s ease forwards',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideIn: {
          '0%': { opacity: 0, transform: 'translateX(-16px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212, 160, 23, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(212, 160, 23, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.10), 0 8px 32px rgba(0,0,0,0.06)',
        'gold': '0 4px 20px rgba(212, 160, 23, 0.25)',
        'emerald': '0 4px 20px rgba(13, 107, 61, 0.25)',
      },
    },
  },
  plugins: [],
}
