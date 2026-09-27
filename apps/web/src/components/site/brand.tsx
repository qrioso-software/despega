import Link from 'next/link';

/** Marca DESPEGA: un cohete que despega dentro de un bloque naranja. */
export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" className="shrink-0">
      <rect width="40" height="40" rx="12" fill="#ff5b2e" />
      <path d="M20 7c5.5 3.6 8 9.3 7 16.2l-3.6 3.3h-6.8L13 23.2C12 16.3 14.5 10.6 20 7Z" fill="#fff" />
      <circle cx="20" cy="17" r="3" fill="#5b3df5" />
      <path d="M13.4 21.5 9.5 25.8l1.3 3.4 4.4-2.4M26.6 21.5l3.9 4.3-1.3 3.4-4.4-2.4" fill="#ffd9cc" />
      <path d="M17.4 28.3h5.2L20 34.5Z" fill="#ffb400" />
    </svg>
  );
}

export function BrandLink({ href = '/', light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label="DESPEGA, ir al inicio">
      <BrandMark />
      <span className={`font-display text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>DESPEGA</span>
    </Link>
  );
}
