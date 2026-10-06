import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { DialogProvider } from '../components/dialog';
import { ToastProvider } from '../components/toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Beampad',
  description: 'Type here, it appears on every device on your network',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f8fafc' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-slate-50 font-sans text-[15px] leading-relaxed text-slate-900 antialiased">
        <ToastProvider>
          <DialogProvider>{children}</DialogProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
