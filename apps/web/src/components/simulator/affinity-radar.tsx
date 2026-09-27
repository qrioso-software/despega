import { AFFINITY_AXES, AFFINITY_LABELS, AFFINITY_SHORT_LABELS, type AffinityAxis, type AffinityVector } from '@despega/simulator';

/**
 * Radar de afinidad (5 ejes, serie única). Sigue la guía de visualización del
 * proyecto: trazo de 2 px, relleno al ~12 %, marcadores con anillo del color de la
 * superficie, grilla sólida y tenue, y textos en tokens de tinta. Su gemelo
 * accesible es `AffinityBars`.
 */
export const RADAR_SERIES = '#5b3df5';
const GRID = '#e7e3f1';
/** Lienzo más ancho que alto: deja espacio a las etiquetas laterales sin recortarlas. */
export const RADAR_VIEW = { width: 440, height: 330, center: { x: 220, y: 172 }, radius: 104 } as const;

type Point = { readonly x: number; readonly y: number };

export function radarPoint(index: number, ratio: number, center: Point, radius: number): [number, number] {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AFFINITY_AXES.length;
  return [center.x + Math.cos(angle) * radius * ratio, center.y + Math.sin(angle) * radius * ratio];
}

export function radarPolygon(values: AffinityVector, center: Point, radius: number): string {
  return AFFINITY_AXES.map((axis, index) => radarPoint(index, clampRatio(values[axis]), center, radius).join(',')).join(' ');
}

export function AffinityRadar({
  values,
  size = 320,
  className = '',
  unavailable = [],
}: {
  values: AffinityVector;
  size?: number;
  className?: string;
  /** Ejes sin oportunidades todavía (p. ej. estructura tras la sesión 1). */
  unavailable?: readonly AffinityAxis[];
}) {
  const description = AFFINITY_AXES.map((axis) => `${AFFINITY_LABELS[axis]}: ${unavailable.includes(axis) ? 'sin datos aún' : `${values[axis]} de 100`}`).join('; ');

  return (
    <svg viewBox={`0 0 ${RADAR_VIEW.width} ${RADAR_VIEW.height}`} width={size} height={(size * RADAR_VIEW.height) / RADAR_VIEW.width} className={`h-auto max-w-full ${className}`} role="img" aria-label={`Perfil de afinidad. ${description}.`}>
      <RadarGrid center={RADAR_VIEW.center} radius={RADAR_VIEW.radius} />
      <polygon points={radarPolygon(values, RADAR_VIEW.center, RADAR_VIEW.radius)} fill={RADAR_SERIES} fillOpacity={0.12} stroke={RADAR_SERIES} strokeWidth={2} strokeLinejoin="round" />
      {AFFINITY_AXES.map((axis, index) => {
        const [x, y] = radarPoint(index, clampRatio(values[axis]), RADAR_VIEW.center, RADAR_VIEW.radius);
        return <circle key={axis} cx={x} cy={y} r={4.5} fill={RADAR_SERIES} stroke="#fff" strokeWidth={2} />;
      })}
      <RadarLabels values={values} center={RADAR_VIEW.center} radius={RADAR_VIEW.radius} unavailable={unavailable} />
    </svg>
  );
}

export function RadarGrid({ center, radius }: { center: Point; radius: number }) {
  return (
    <g aria-hidden="true">
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <polygon
          key={ring}
          points={AFFINITY_AXES.map((_, index) => radarPoint(index, ring, center, radius).join(',')).join(' ')}
          fill="none"
          stroke={GRID}
          strokeWidth={1}
        />
      ))}
      {AFFINITY_AXES.map((axis, index) => {
        const [x, y] = radarPoint(index, 1, center, radius);
        return <line key={axis} x1={center.x} y1={center.y} x2={x} y2={y} stroke={GRID} strokeWidth={1} />;
      })}
    </g>
  );
}

export function RadarLabels({
  values,
  center,
  radius,
  unavailable = [],
}: {
  values: AffinityVector;
  center: Point;
  radius: number;
  unavailable?: readonly AffinityAxis[];
}) {
  return (
    <g aria-hidden="true">
      {AFFINITY_AXES.map((axis, index) => {
        const [x, y] = radarPoint(index, 1.24, center, radius);
        const anchor = Math.abs(x - center.x) < 8 ? 'middle' : x > center.x ? 'start' : 'end';
        return (
          <text key={axis} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" className="font-sans">
            <tspan x={x} dy="-0.45em" fontSize="13" fontWeight="700" fill="#14123a">{AFFINITY_SHORT_LABELS[axis]}</tspan>
            <tspan x={x} dy="1.25em" fontSize="12" fill="#5d5a78">{unavailable.includes(axis) ? '—' : values[axis]}</tspan>
          </text>
        );
      })}
    </g>
  );
}

/** Gemelo accesible del radar: una barra por eje con su valor visible. */
export function AffinityBars({
  values,
  unavailable = [],
  deltas,
}: {
  values: AffinityVector;
  unavailable?: readonly AffinityAxis[];
  deltas?: Partial<Record<AffinityAxis, number>>;
}) {
  return (
    <ul className="grid gap-3">
      {AFFINITY_AXES.map((axis) => {
        const missing = unavailable.includes(axis);
        const delta = deltas?.[axis];
        return (
          <li key={axis}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-semibold text-ink">{AFFINITY_LABELS[axis]}</span>
              <span className="shrink-0 whitespace-nowrap tabular-nums text-muted">
                {missing ? 'Sin datos aún' : `${values[axis]} / 100`}
                {delta ? <span className="ml-2 font-semibold text-ink">{delta > 0 ? `+${delta}` : delta} pts</span> : null}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-violet-soft" aria-hidden="true">
              <div className="h-full rounded-full bg-violet transition-[width] duration-700" style={{ width: `${missing ? 0 : values[axis]}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function clampRatio(value: number): number {
  return Math.min(1, Math.max(0, value / 100));
}
