import { DespegaLogo } from '@despega/brand';
import Link from 'next/link';

/** Logo de DESPEGA enlazado al inicio; `light` lo pasa a blanco sobre fondos `night`. */
export function BrandLink({ href = '/', light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className={`relative flex items-center ${light ? 'text-white' : 'text-ink'}`} aria-label="DESPEGA, ir al inicio">
      <DespegaLogo height={30} />
    </Link>
  );
}
