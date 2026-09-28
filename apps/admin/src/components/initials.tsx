const SIZES = {
  sm: 'size-8 text-xs',
  md: 'size-9 text-sm',
  lg: 'size-14 text-lg',
} as const;

/** Iniciales en un círculo: identifica a una persona sin foto. */
export function Initials({ name, size = 'md', tone = 'accent' }: { name: string; size?: keyof typeof SIZES; tone?: 'accent' | 'soft' }) {
  const initials =
    name
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '?';
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-bold ${SIZES[size]} ${
        tone === 'accent' ? 'bg-accent text-accent-foreground' : 'bg-accent-soft text-accent-soft-foreground'
      }`}
      aria-hidden
    >
      {initials}
    </span>
  );
}
