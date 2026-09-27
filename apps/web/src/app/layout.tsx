import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'DESPEGA · Vive una carrera antes de elegirla',
    template: '%s · DESPEGA',
  },
  description:
    'Simulaciones interactivas para estudiantes de 15 a 18 años: vive una profesión con personajes, decisiones y consecuencias antes de elegir qué estudiar.',
  openGraph: {
    title: 'DESPEGA · Vive una carrera antes de elegirla',
    description: 'No es un test vocacional: es una historia jugable donde decides como profesional.',
    locale: 'es_LA',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#fbf8f3',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${bricolage.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
