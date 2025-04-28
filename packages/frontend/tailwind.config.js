/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
 
    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--background-primary)',
        'bg-secondary': 'var(--background-secondary)',
        'bg-tertiary': 'var(--background-tertiary)',
        'fg-primary': 'var(--foreground-primary)',
        'fg-secondary': 'var(--foreground-secondary)',
        'fg-tertiary': 'var(--foreground-tertiary)',
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'accent-tertiary': 'var(--accent-tertiary)',
        'success': 'var(--success)',
        'warning': 'var(--warning)',
        'error': 'var(--error)',
        'border': 'var(--border-color)',
      },
      boxShadow: {
        'card': '0 4px 6px var(--shadow-color)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}