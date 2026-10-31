import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Converto — Free, Privacy-First, All-in-One PDF Toolkit',
  description:
    'Convert, edit and fix any PDF, privately. 100% free, runs in your browser via Web Workers. No file uploads, no signup walls, no limits.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  keywords: [
    'pdf editor',
    'merge pdf',
    'compress pdf',
    'split pdf',
    'private pdf tools',
    'offline pdf',
    'local pdf converter',
    'smart fix pdf',
  ],
  authors: [{ name: 'Converto' }],
  openGraph: {
    title: 'Converto — Free, Privacy-First PDF Toolkit',
    description: 'Convert, edit and fix any PDF, privately on your device.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="antialiased flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />

        {/* Service Worker Registration for Offline Execution */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
