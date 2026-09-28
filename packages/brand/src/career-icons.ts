import {
  Brain,
  BriefcaseBusiness,
  Calculator,
  CodeXml,
  Compass,
  DraftingCompass,
  Factory,
  GraduationCap,
  HardHat,
  HeartPulse,
  Megaphone,
  Mic,
  Palette,
  Scale,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';

/**
 * Ícono de línea por carrera, compartido por web y admin. El catálogo del motor trae un
 * emoji como dato, pero las interfaces usan un solo lenguaje visual (lucide) para no
 * mezclar estilos de ícono. Una carrera sin ícono propio usa `DEFAULT_CAREER_ICON`.
 * Se exporta como mapa (no como función) para que el componente se resuelva por acceso
 * y no se «cree durante el render» (regla `react-hooks/static-components`).
 */
export const CAREER_ICONS: Readonly<Record<string, LucideIcon>> = {
  'ingenieria-software': CodeXml,
  medicina: Stethoscope,
  marketing: Megaphone,
  derecho: Scale,
  arquitectura: DraftingCompass,
  psicologia: Brain,
  administracion: BriefcaseBusiness,
  'diseno-grafico': Palette,
  'ingenieria-civil': HardHat,
  finanzas: Calculator,
  comunicacion: Mic,
  enfermeria: HeartPulse,
  'ingenieria-industrial': Factory,
  educacion: GraduationCap,
};

export const DEFAULT_CAREER_ICON: LucideIcon = Compass;
