import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shruti Priya — AI Engineer & Researcher',
  description:
    'Interactive AI portfolio — talk to a digital clone of Shruti Priya, AI/ML engineer from NIT Jamshedpur.',
  keywords: ['AI', 'Machine Learning', 'Portfolio', 'NIT Jamshedpur', 'AI Engineer'],
  authors: [{ name: 'Shruti Priya' }],
  openGraph: {
    title: 'Shruti Priya — AI Engineer & Researcher',
    description:
      'Talk to my AI clone. Ask me anything about my projects, research, and experience.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* importmap — maps bare 'three' to esm.sh so all modules share ONE instance */}
        <script
          type="importmap"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              imports: {
                three: 'https://esm.sh/three@0.167.0',
              },
            }),
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
