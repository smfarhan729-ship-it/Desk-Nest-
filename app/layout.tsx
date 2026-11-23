import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DeskNest — Architectural Desk Setup & Precision Hardware',
  description:
    'Interactive 3D architectural desk setup and precision productivity hardware showcase curated by DeskNest.',
  openGraph: {
    title: 'DeskNest — Architectural Desk Setup & Precision Hardware',
    description:
      'Explore five tactile, machined desk essentials in an interactive 3D studio diorama with studio daylight and deep focus night lighting.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DeskNest — Architectural Desk Setup & Precision Hardware',
    description:
      'Interactive 3D architectural desk setup and precision productivity hardware showcase curated by DeskNest.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="font-sans antialiased bg-[#08111A] text-[#F8FAFC] selection:bg-[#00C896]/25 selection:text-[#00C896] overflow-x-hidden"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
