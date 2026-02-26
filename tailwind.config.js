/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Mediterranean Editorial Palette
        azure: '#2563eb',        // Deep Mediterranean blue
        ocean: '#0891b2',        // Coastal teal
        sand: '#f5e6d3',         // Sun-bleached sand
        terracotta: '#dc6b4a',   // Spanish roof tiles
        olive: '#6b7c59',        // Mediterranean olive
        navy: '#1e3a5f',         // Deep sea navy
        cream: '#faf8f5',        // Warm white
        coral: '#ff6b6b',        // Vibrant accent
        // Legacy colors for compatibility
        primary: '#0891b2',
        secondary: '#6b7c59',
        warm: '#f5e6d3',
        deep: '#1e3a5f',
        earth: '#dc6b4a',
        danger: '#ff6b6b',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Baskerville', 'Garamond', 'Georgia', 'serif'],
        display: ['Lora', 'Baskerville', 'Garamond', 'serif'],
      },
      animation: {
        'needle-sweep': 'needle-sweep 0.8s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'needle-sweep': {
          from: { transform: 'rotate(-90deg)' },
          to: { transform: 'rotate(var(--needle-angle))' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(1rem)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
