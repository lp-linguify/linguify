import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
    darkMode: ["class"],
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            // Configuration des polices
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', "Segoe UI", 'Roboto', "Helvetica Neue", 'Arial', "Noto Sans", 'sans-serif'],
                poppins: ["var(--font-poppins)", ...fontFamily.sans],
                montserrat: ["var(--font-montserrat)", ...fontFamily.sans],
            },
            
            // Personnalisation des couleurs
            colors: {
                brand: {
                    purple: {
                        DEFAULT: '#5D3FD3',
                        light: '#8A45E0',
                        dark: '#6825B0',
                    },
                    gold: {
                        DEFAULT: '#fdd47c',
                        light: '#FFE4A3',
                        dark: '#E5B854',
                    }
                }
            },
            
            // Dégradés personnalisés
            backgroundImage: {
                'gradient-brand': 'linear-gradient(to right, #792FCE, #fdd47c)',
                'gradient-brand-vertical': 'linear-gradient(to bottom, #792FCE, #fdd47c)',
                'gradient-purple': 'linear-gradient(to right, #792FCE, #8A45E0)',
                'gradient-gold': 'linear-gradient(to right, #E5B854, #fdd47c)',
                'gradient-brand-subtle': 'linear-gradient(to right, rgba(121, 47, 206, 0.1), rgba(253, 212, 124, 0.1))',
                'gradient-dark': 'linear-gradient(to right, rgb(17, 24, 39), rgb(31, 41, 55))',
            },
            
            // Animations de dégradés
            animation: {
                'gradient-x': 'gradient-x 15s ease infinite',
                'gradient-y': 'gradient-y 15s ease infinite',
                'gradient-xy': 'gradient-xy 15s ease infinite',
            },
            
            keyframes: {
                'gradient-y': {
                    '0%, 100%': {
                        'background-size': '400% 400%',
                        'background-position': 'center top'
                    },
                    '50%': {
                        'background-size': '200% 200%',
                        'background-position': 'center center'
                    }
                },
                'gradient-x': {
                    '0%, 100%': {
                        'background-size': '200% 200%',
                        'background-position': 'left center'
                    },
                    '50%': {
                        'background-size': '200% 200%',
                        'background-position': 'right center'
                    }
                },
                'gradient-xy': {
                    '0%, 100%': {
                        'background-size': '400% 400%',
                        'background-position': 'left center'
                    },
                    '50%': {
                        'background-size': '200% 200%',
                        'background-position': 'right center'
                    }
                }
            },
            
            // Autres configurations
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
} satisfies Config;