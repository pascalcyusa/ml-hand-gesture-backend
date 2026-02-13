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
                    'gold': '#D5B664',
                    'gold-dim': '#B79A5C',
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
                'glow-gold': '0 0 20px rgba(213, 182, 100, 0.3)',
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
