import { DespegaLogo } from '@despega/brand';

/** Logo con la etiqueta «Backoffice» a la derecha (barras) o debajo (acceso). */
export function Brand({ light = false, height = 24, stacked = false }: { light?: boolean; height?: number; stacked?: boolean }) {
  return (
    <span className={`inline-flex ${stacked ? 'flex-col items-start gap-1.5' : 'items-center gap-2.5'} ${light ? 'text-white' : 'text-ink'}`}>
      <DespegaLogo height={height} title="DESPEGA" />
      <span
        className={`rounded-md px-1.5 py-0.5 text-[0.625rem] font-bold uppercase leading-none tracking-[0.14em] ${
          light ? 'bg-white/10 text-white/70' : 'bg-surface-secondary text-muted-ink'
        }`}
      >
        Backoffice
      </span>
    </span>
  );
}
