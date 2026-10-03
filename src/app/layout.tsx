import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ShellSwitch } from '@/components/layout/ShellSwitch';
import '@/styles/globals.scss';
import { Providers } from './providers';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin', 'cyrillic'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'Team Finder — find the people to build with', template: '%s · Team Finder' },
  description: 'Find teammates, join projects and build together. Real-time team chat and AI matching.',
};

export const viewport: Viewport = {
  themeColor: '#050507',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Providers>
          <ShellSwitch>{children}</ShellSwitch>
        </Providers>
      </body>
    </html>
  );
}
