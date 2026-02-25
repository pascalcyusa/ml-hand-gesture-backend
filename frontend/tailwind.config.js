/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Semantic Backgrounds
                'bg-hard': 'var(--bg-hard)',
                'bg': 'var(--bg)',
                'bg-soft': 'var(--bg-soft)',
                'bg1': 'var(--bg1)',
                'bg2': 'var(--bg2)',
                'bg3': 'var(--bg3)',
                'bg4': 'var(--bg4)',

                // Semantic Foreground
                'fg': 'var(--fg)',
                'fg-dim': 'var(--fg-dim)',
                'fg-muted': 'var(--fg-muted)',

                // Brand Colors
                'primary': 'var(--primary)',
                'primary-dim': 'var(--primary-dim)',
                'primary-light': 'var(--primary-light)',

                // Functional Colors
                'red': 'var(--red)',
                'red-dim': 'var(--red-dim)',
                'yellow': 'var(--yellow)',
                'yellow-dim': 'var(--yellow-dim)',
                'blue': 'var(--blue)',
                'blue-dim': 'var(--blue-dim)',
                'aqua': 'var(--aqua)',
                'aqua-dim': 'var(--aqua-dim)',
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
                'glow-primary': 'var(--shadow-glow-primary)',
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
