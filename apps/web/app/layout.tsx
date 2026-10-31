import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Converto — Free, Privacy-First, All-in-One PDF Toolkit',
  description:
    'Convert, edit and fix any PDF, privately. 100% free, runs in your browser via Web Workers. No file uploads, no signup walls, no limits.',
  keywords: [
    'pdf editor',
    'merge pdf',
    'compress pdf',
    'split pdf',
    'private pdf tools',
    'offline pdf',
    'local pdf converter',
  ],
  authors: [{ name: 'Converto' }],
  openGraph: {
    title: 'Converto — Free, Privacy-First PDF Toolkit',
    description: 'Convert, edit and fix any PDF, privately on your device.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
