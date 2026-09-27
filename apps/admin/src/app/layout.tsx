import type { Metadata } from 'next';
import { Bricolage_Grotesque, Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import './styles.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'DESPEGA · Backoffice', template: '%s · DESPEGA Backoffice' },
  description: 'Backoffice de DESPEGA: estudiantes, resultados por carrera y contenido de los módulos.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${bricolage.variable} light`} data-theme="light">
      <body>{children}</body>
    </html>
  );
}
