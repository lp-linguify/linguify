// src/app/layout.tsx
import { Inter, Poppins, Montserrat } from 'next/font/google';
import type { Metadata } from "next";
import "@/styles/globals.css";
import Providers from "./Providers";

// Configurez Inter
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Configurez Poppins
const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

// Configurez Montserrat
const montserrat = Montserrat({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: {
    template: '%s | Linguify',
    default: 'Linguify',
  },
  description: "Language learning platform for everyone.",
  icons: {
    icon: [
      { url: '/logo/logo2.svg', type: 'image/svg+xml' },
    ],
  }
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo/logo2.svg" type="image/svg+xml" />
      </head>
      <body className="bg-white dark:bg-black text-black dark:text-white font-sans">
        <Providers>
          <main className="flex min-h-screen flex-col bg-white dark:bg-black text-[#374151] dark:text-white font-sans">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}