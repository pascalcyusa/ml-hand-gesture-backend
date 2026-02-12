/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx}",
    ],
    theme: {
        extend: {
            /* ── Gruvbox Dark Palette ── */
            colors: {
                gruvbox: {
                    'bg-hard': '#1d2021',
                    'bg': '#282828',
                    'bg-soft': '#32302f',
                    'bg1': '#3c3836',
                    'bg2': '#504945',
                    'bg3': '#665c54',
                    'bg4': '#7c6f64',
                    'fg': '#ebdbb2',
                    'fg-dim': '#a89984',
                    'fg-muted': '#928374',
                    'red': '#fb4934',
                    'red-dim': '#cc241d',
                    'green': '#b8bb26',
                    'green-dim': '#98971a',
                    'yellow': '#fabd2f',
                    'yellow-dim': '#d79921',
                    'blue': '#83a598',
                    'blue-dim': '#458588',
                    'purple': '#d3869b',
                    'purple-dim': '#b16286',
                    'aqua': '#8ec07c',
                    'aqua-dim': '#689d6a',
                    'orange': '#fe8019',
                    'orange-dim': '#d65d0e',
                },
            },
            fontFamily: {
                ui: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            borderRadius: {
                sm: '4px',
                md: '8px',
                lg: '12px',
                xl: '16px',
            },
            boxShadow: {
                sm: '0 1px 3px rgba(0, 0, 0, 0.3)',
                md: '0 4px 12px rgba(0, 0, 0, 0.4)',
                lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
                'glow-green': '0 0 20px rgba(184, 187, 38, 0.3)',
                'glow-orange': '0 0 20px rgba(254, 128, 25, 0.3)',
            },
            transitionDuration: {
                fast: '150ms',
                normal: '250ms',
                slow: '400ms',
            },
            keyframes: {
                'fade-in': {
                    from: { opacity: '0', transform: 'translateY(8px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
            },
            animation: {
                'fade-in': 'fade-in 0.3s ease forwards',
            },
        },
    },
    plugins: [],
};
