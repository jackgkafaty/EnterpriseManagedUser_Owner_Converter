/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // GitHub Copilot Dark Theme Colors
        'gh-canvas-default': '#0d1117',
        'gh-canvas-subtle': '#161b22',
        'gh-border-default': '#30363d',
        'gh-fg-default': '#e6edf3',
        'gh-fg-muted': '#7d8590',
        'gh-accent-emphasis': '#58a6ff',
        'gh-accent-muted': '#1f6feb',
        'gh-success-emphasis': '#238636',
        'gh-success-muted': '#2ea043',
        'gh-danger-emphasis': '#da3633',
        'gh-danger-muted': '#f85149',
        'gh-neutral-emphasis': '#21262d',
        'gh-neutral-muted': '#30363d',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
      }
    },
  },
  plugins: [],
}
