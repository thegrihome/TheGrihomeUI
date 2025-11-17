/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    screens: {
      // Mobile devices
      'xs': '360px',    // Small mobile (360px - 639px)
      'sm': '640px',    // Mobile landscape (640px - 767px)
      
      // Tablet devices
      'md': '768px',    // Tablet portrait (768px - 1023px)
      'lg': '1024px',   // Tablet landscape (1024px - 1279px)
      
      // Desktop devices
      'xl': '1280px',   // Desktop (1280px - 1535px)
      '2xl': '1536px',  // Large desktop (1536px - 1919px)
      
      // Ultra-wide and large screens
      '3xl': '1920px',  // Full HD (1920px - 2559px)
      '4xl': '2560px',  // 2K/QHD (2560px+)
      
      // Custom breakpoints for specific needs
      'tablet': '640px',
      'laptop': '1024px',
      'desktop': '1280px',
      'ultrawide': '2560px',
    },
    extend: {
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '128': '32rem',
      },
      fontSize: {
        'xxs': '0.625rem',
        '2xs': '0.6875rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
        '10xl': '104rem',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          md: '2rem',
          lg: '2.5rem',
          xl: '3rem',
          '2xl': '4rem',
          '3xl': '5rem',
          '4xl': '6rem',
        },
      },
    },
  },
  plugins: [],
}
