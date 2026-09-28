import { CAREER_ICONS, DEFAULT_CAREER_ICON } from '@despega/brand';

const TONES = {
  brand: 'bg-brand-soft text-brand-strong',
  accent: 'bg-accent-soft text-accent-soft-foreground',
  muted: 'bg-surface-secondary text-muted-ink',
} as const;

const SIZES = {
  xs: { tile: 'size-7 rounded-md', icon: 'size-4' },
  sm: { tile: 'size-9 rounded-lg', icon: 'size-4' },
  md: { tile: 'size-11 rounded-xl', icon: 'size-5' },
} as const;

/** Ícono de línea de la carrera sobre una ficha de color (mismo mapa que la web). */
export function CareerIcon({
  careerId,
  tone = 'brand',
  size = 'md',
  className = '',
}: {
  careerId: string;
  tone?: keyof typeof TONES;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const Icon = CAREER_ICONS[careerId] ?? DEFAULT_CAREER_ICON;
  return (
    <span className={`grid shrink-0 place-items-center ${SIZES[size].tile} ${TONES[tone]} ${className}`} aria-hidden>
      <Icon className={SIZES[size].icon} strokeWidth={1.75} />
    </span>
  );
}
