import { DespegaLogo } from '@despega/brand';

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className={`grid justify-items-start gap-1 ${light ? 'text-white' : 'text-ink'}`}>
      <DespegaLogo height={28} title="DESPEGA" />
      <span className={`block text-[0.7rem] font-bold uppercase tracking-[0.16em] ${light ? 'text-white/60' : 'text-muted-ink'}`}>Backoffice</span>
    </span>
  );
}
