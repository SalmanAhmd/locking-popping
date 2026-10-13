/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#050507',
        charcoal: '#0b0b12',
        smoke: '#14141f',
        neon: {
          purple: '#a855f7',
          blue: '#22d3ee',
          pink: '#ff2d95',
          green: '#b6ff3c',
          amber: '#ffb020',
        },
      },
      fontFamily: {
        display: ['Anton', 'Bebas Neue', 'Impact', 'system-ui', 'sans-serif'],
        ui: ['Rajdhani', 'Chakra Petch', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 6px currentColor, 0 0 18px currentColor',
        'neon-lg': '0 0 10px currentColor, 0 0 34px currentColor, 0 0 60px currentColor',
      },
      keyframes: {
        flicker: {
          '0%,100%': { opacity: '1' },
          '45%': { opacity: '1' },
          '47%': { opacity: '0.35' },
          '49%': { opacity: '1' },
          '70%': { opacity: '0.7' },
          '72%': { opacity: '1' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        gridpan: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 60px' },
        },
        fogdrift: {
          '0%': { transform: 'translate3d(-8%, 0, 0) scale(1.1)' },
          '50%': { transform: 'translate3d(8%, 2%, 0) scale(1.2)' },
          '100%': { transform: 'translate3d(-8%, 0, 0) scale(1.1)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        flicker: 'flicker 5s infinite',
        scan: 'scan 6s linear infinite',
        gridpan: 'gridpan 1.2s linear infinite',
        fogdrift: 'fogdrift 18s ease-in-out infinite',
        marquee: 'marquee 22s linear infinite',
        floaty: 'floaty 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
