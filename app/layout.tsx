import type { Metadata } from 'next';
import { Inter, Merriweather } from 'next/font/google';
import 'ckeditor5/ckeditor5.css';
import 'katex/dist/katex.min.css';
import './globals.css';
import { StudioProvider } from '@/lib/studio-context';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-interface',
  display: 'swap',
});

const merriweather = Merriweather({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-editorial',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ScientificRadar Studio — Editorial CMS Prototype',
  description:
    'A modern, AI-assisted editorial CMS for ScientificRadar, featuring rich-text editing, scientific source verification, smart knowledge links, automated media optimization, and streamlined publishing workflows.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'ScientificRadar Studio — Editorial CMS Prototype',
    description:
      'Write science. Refine with confidence. Publish with control. Isolated P0 Next.js editorial prototype.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScientificRadar Studio — Editorial CMS Prototype',
    description:
      'Write science. Refine with confidence. Publish with control.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${merriweather.variable}`}
    >
      <body suppressHydrationWarning className="antialiased">
        <StudioProvider>{children}</StudioProvider>
      </body>
    </html>
  );
}

