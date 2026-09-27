export function BrandMark({ size = 34 }: { size?: number }) {
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

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      <span className="leading-tight">
        <span className={`block font-display text-lg font-extrabold ${light ? 'text-white' : 'text-ink'}`}>DESPEGA</span>
        <span className={`block text-[0.7rem] font-bold uppercase tracking-[0.16em] ${light ? 'text-white/60' : 'text-muted-ink'}`}>Backoffice</span>
      </span>
    </span>
  );
}
