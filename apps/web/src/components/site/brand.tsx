import { DespegaLogo } from '@despega/brand';
import Link from 'next/link';

/** Logo de DESPEGA enlazado al inicio; `light` lo pasa a blanco sobre fondos `night`. */
export function BrandLink({ href = '/', light = false, height = 30 }: { href?: string; light?: boolean; height?: number }) {
  return (
    <Link href={href} className={`relative flex shrink-0 items-center ${light ? 'text-white' : 'text-ink'}`} aria-label="DESPEGA, ir al inicio">
      <DespegaLogo height={height} />
    </Link>
  );
}
