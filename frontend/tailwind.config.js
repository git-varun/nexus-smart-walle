export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: ['class'],
    theme: {
        extend: {
            fontFamily: {
                'jakarta': ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
                'manrope': ['Manrope', 'system-ui', 'sans-serif'],
                'satoshi': ['Satoshi', 'system-ui', 'sans-serif'],
                'mono': ['JetBrains Mono', 'monospace'],
            },
            colors: {
                // Web3 Color System - Dark Mode First
                space: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    900: '#0f172a',
                    950: '#020617',
                },
                neon: {
                    cyan: '#06b6d4',
                    purple: '#8b5cf6',
                    green: '#10b981',
                    orange: '#f59e0b',
                    pink: '#ec4899',
                },
                web3: {
                    primary: '#8b5cf6', // Neon purple
                    secondary: '#06b6d4', // Neon cyan
                    accent: '#10b981', // Neon green
                    warning: '#f59e0b', // Neon orange
                    danger: '#ef4444', // Neon red
                    success: '#10b981', // Neon green
                },
                // Existing system colors
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
            },
            backgroundImage: {
                'web3-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'neon-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                'space-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
                'cyber-gradient': 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
            },
            borderRadius: {
                'web3': '1rem',
                'cyber': '0.75rem',
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            boxShadow: {
                'neon': '0 0 20px rgba(139, 92, 246, 0.3)',
                'neon-cyan': '0 0 20px rgba(6, 182, 212, 0.3)',
                'neon-green': '0 0 20px rgba(16, 185, 129, 0.3)',
                'cyber': '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 40px rgba(139, 92, 246, 0.1)',
                'glass': '0 8px 32px rgba(0, 0, 0, 0.37)',
            },
            animation: {
                'fade-in': 'fade-in 0.5s ease-in-out',
                'slide-in': 'slide-in 0.3s ease-out',
                'slide-up': 'slide-up 0.4s ease-out',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'pulse-neon': 'pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 3s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                'fade-in': {
                    '0%': {opacity: '0', transform: 'translateY(10px)'},
                    '100%': {opacity: '1', transform: 'translateY(0)'}
                },
                'slide-in': {
                    '0%': {opacity: '0', transform: 'translateX(-10px)'},
                    '100%': {opacity: '1', transform: 'translateX(0)'}
                },
                'slide-up': {
                    '0%': {opacity: '0', transform: 'translateY(20px)'},
                    '100%': {opacity: '1', transform: 'translateY(0)'}
                },
                'glow': {
                    '0%': {boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)'},
                    '100%': {boxShadow: '0 0 30px rgba(139, 92, 246, 0.6)'}
                },
                'pulse-neon': {
                    '0%, 100%': {boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)'},
                    '50%': {boxShadow: '0 0 40px rgba(139, 92, 246, 0.8)'}
                },
                'float': {
                    '0%, 100%': {transform: 'translateY(0px)'},
                    '50%': {transform: 'translateY(-10px)'}
                },
                'shimmer': {
                    '0%': {backgroundPosition: '-200% 0'},
                    '100%': {backgroundPosition: '200% 0'}
                }
            },
            backdropBlur: {
                'cyber': '12px',
            },
            typography: {
                DEFAULT: {
                    css: {
                        color: '#f8fafc',
                        fontSize: '1rem',
                        lineHeight: '1.75',
                        fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
                    },
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
        require('@tailwindcss/forms'),
    ],
};
