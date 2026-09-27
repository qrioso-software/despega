import type { CareerModule } from '../types.ts';
import { ingenieriaSoftware } from './ingenieria-software.ts';

/** Módulos jugables por carrera. Una carrera sin módulo aparece como «Próximamente». */
export const MODULES: Readonly<Record<string, CareerModule>> = {
  [ingenieriaSoftware.careerId]: ingenieriaSoftware,
};

export function findModule(careerId: string): CareerModule | undefined {
  return Object.hasOwn(MODULES, careerId) ? MODULES[careerId] : undefined;
}

export { ingenieriaSoftware };
