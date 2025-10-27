/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 爱马仕橙色系
        hermes: {
          orange: '#FF6B35',
          light: '#FF8C5A',
          dark: '#E55A2B',
          coral: '#FF9B7A',
        },
        // 奢华金色系
        luxury: {
          gold: '#D4AF37',
          champagne: '#F0E5D8',
          rose: '#B76E79',
        },
        // 中性色系
        elegant: {
          white: '#FFFFFF',
          cream: '#FAF8F5',
          beige: '#F5E6D3',
          sand: '#E8DCC8',
          gray: '#A39E93',
          charcoal: '#2C2C2C',
          black: '#1A1A1A',
        },
        // 强调色
        accent: {
          amber: '#FFBF69',
          terracotta: '#CB7B5C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        decorative: ['Cormorant Garamond', 'serif'],
      },
      boxShadow: {
        'luxury-sm': '0 2px 8px rgba(255, 107, 53, 0.08)',
        'luxury-md': '0 4px 16px rgba(255, 107, 53, 0.12)',
        'luxury-lg': '0 8px 32px rgba(255, 107, 53, 0.16)',
        'luxury-xl': '0 12px 48px rgba(255, 107, 53, 0.20)',
        'luxury': '0 20px 60px rgba(212, 175, 55, 0.15)',
      },
      backgroundImage: {
        'gradient-sunset': 'linear-gradient(135deg, #FF6B35 0%, #FF9B7A 50%, #FFBF69 100%)',
        'gradient-gold': 'linear-gradient(135deg, #D4AF37 0%, #F0E5D8 100%)',
        'gradient-elegant': 'linear-gradient(180deg, #FAF8F5 0%, #E8DCC8 100%)',
        'gradient-overlay': 'linear-gradient(180deg, rgba(26, 26, 26, 0) 0%, rgba(26, 26, 26, 0.7) 100%)',
      },
      animation: {
        'float-gentle': 'float-gentle 6s ease-in-out infinite',
        'luxury-spin': 'luxury-spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
        'shimmer': 'shimmer 1.5s linear infinite',
      },
      keyframes: {
        'float-gentle': {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-20px) translateX(10px)' },
        },
        'luxury-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        'luxury': '12px',
      },
    },
  },
  plugins: [],
};
