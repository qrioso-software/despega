/**
 * Catálogo de carreras del simulador. El documento funcional prevé 14 módulos; solo
 * Ingeniería de Software está construido. Las demás carreras son marcadores de
 * posición pendientes de confirmar con el cliente (ver
 * docs/architecture/functional-analysis.md).
 */
export type CareerStatus = 'available' | 'coming-soon';

export type Career = {
  readonly id: string;
  readonly name: string;
  readonly area: string;
  readonly description: string;
  readonly emoji: string;
  readonly status: CareerStatus;
  /** Título del módulo jugable, cuando existe. */
  readonly moduleTitle?: string;
};

export const CAREERS: readonly Career[] = [
  {
    id: 'ingenieria-software',
    name: 'Ingeniería de Software',
    area: 'Tecnología',
    description: 'Una semana como practicante en PixelForge: bugs en vivo, clientes esperando y un lanzamiento que no puede fallar.',
    emoji: '💻',
    status: 'available',
    moduleTitle: 'Tu semana en PixelForge',
  },
  { id: 'medicina', name: 'Medicina', area: 'Salud', description: 'Guardias, diagnósticos y decisiones que no esperan.', emoji: '🩺', status: 'coming-soon' },
  { id: 'marketing', name: 'Marketing', area: 'Negocios', description: 'Campañas, datos y audiencias que cambian de opinión en horas.', emoji: '📣', status: 'coming-soon' },
  { id: 'derecho', name: 'Derecho', area: 'Sociales', description: 'Casos, argumentos y clientes que confían en tu criterio.', emoji: '⚖️', status: 'coming-soon' },
  { id: 'arquitectura', name: 'Arquitectura', area: 'Diseño', description: 'Planos, obras y espacios pensados para las personas.', emoji: '📐', status: 'coming-soon' },
  { id: 'psicologia', name: 'Psicología', area: 'Salud', description: 'Escuchar, entender y acompañar procesos humanos.', emoji: '🧠', status: 'coming-soon' },
  { id: 'administracion', name: 'Administración de Empresas', area: 'Negocios', description: 'Equipos, presupuestos y decisiones que mueven una empresa.', emoji: '📊', status: 'coming-soon' },
  { id: 'diseno-grafico', name: 'Diseño Gráfico', area: 'Diseño', description: 'Ideas que se convierten en marcas, piezas y experiencias.', emoji: '🎨', status: 'coming-soon' },
  { id: 'ingenieria-civil', name: 'Ingeniería Civil', area: 'Ingeniería', description: 'Puentes, carreteras y obras que tienen que resistir.', emoji: '🏗️', status: 'coming-soon' },
  { id: 'finanzas', name: 'Contabilidad y Finanzas', area: 'Negocios', description: 'Números que cuentan la historia real de una organización.', emoji: '💹', status: 'coming-soon' },
  { id: 'comunicacion', name: 'Comunicación y Periodismo', area: 'Sociales', description: 'Historias, fuentes y cierres de edición contra el reloj.', emoji: '🎙️', status: 'coming-soon' },
  { id: 'enfermeria', name: 'Enfermería', area: 'Salud', description: 'Cuidado, protocolos y turnos donde cada detalle importa.', emoji: '💉', status: 'coming-soon' },
  { id: 'ingenieria-industrial', name: 'Ingeniería Industrial', area: 'Ingeniería', description: 'Procesos, fábricas y sistemas que funcionan mejor.', emoji: '🏭', status: 'coming-soon' },
  { id: 'educacion', name: 'Educación', area: 'Sociales', description: 'Aulas, planes y estudiantes que aprenden contigo.', emoji: '📚', status: 'coming-soon' },
];

export function findCareer(careerId: string): Career | undefined {
  return CAREERS.find((career) => career.id === careerId);
}
