import { Alert, Card, Chip } from '@heroui/react';
import { AFFINITY_AXES, AFFINITY_LABELS, AFFINITY_SHORT_LABELS, type AffinityAxis, type AffinityVector } from '@despega/simulator';
import type { ReactNode } from 'react';

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-1 text-3xl font-bold text-ink sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 text-muted-ink">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

/** Ficha de indicador: etiqueta, valor con cifras proporcionales y una nota opcional. */
export function StatTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <Card.Content className="grid gap-1">
        <p className="text-sm font-semibold text-muted-ink">{label}</p>
        <p className="font-sans text-4xl font-bold text-ink">{value}</p>
        {hint && <p className="text-xs text-muted-ink">{hint}</p>}
      </Card.Content>
    </Card>
  );
}

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export function ProgressChip({ status, session }: { status: ProgressStatus; session?: number | null }) {
  if (status === 'completed') return <Chip size="sm" color="success" variant="soft"><Chip.Label>Completado</Chip.Label></Chip>;
  if (status === 'in_progress') {
    return <Chip size="sm" color="accent" variant="soft"><Chip.Label>{session ? `En la sesión ${session}` : 'En curso'}</Chip.Label></Chip>;
  }
  return <Chip size="sm" color="default" variant="soft"><Chip.Label>Sin empezar</Chip.Label></Chip>;
}

export function DataUnavailable({ what }: { what: string }) {
  return (
    <Alert status="danger">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>No pudimos cargar {what}</Alert.Title>
        <Alert.Description>DynamoDB no respondió. No mostramos datos de ejemplo: vuelve a intentar en unos segundos.</Alert.Description>
      </Alert.Content>
    </Alert>
  );
}

/** Barras de magnitud por eje (serie única): el gemelo accesible del radar. */
export function AffinityBars({ values, unavailable = [] }: { values: AffinityVector; unavailable?: readonly AffinityAxis[] }) {
  return (
    <ul className="grid gap-3">
      {AFFINITY_AXES.map((axis) => {
        const missing = unavailable.includes(axis);
        return (
          <li key={axis}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-semibold text-ink">{AFFINITY_LABELS[axis]}</span>
              <span className="shrink-0 whitespace-nowrap tabular-nums text-muted-ink">{missing ? 'Sin datos aún' : `${values[axis]} / 100`}</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-tertiary" aria-hidden="true">
              <div className="h-full rounded-full bg-accent" style={{ width: `${missing ? 0 : values[axis]}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const VIEW = { width: 440, height: 330, cx: 220, cy: 172, radius: 104 };

function point(index: number, ratio: number): [number, number] {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AFFINITY_AXES.length;
  return [VIEW.cx + Math.cos(angle) * VIEW.radius * ratio, VIEW.cy + Math.sin(angle) * VIEW.radius * ratio];
}

/** Radar de 5 ejes (serie única, trazo de 2 px, relleno tenue, etiquetas en tinta). */
export function AffinityRadar({ values, unavailable = [], width = 360 }: { values: AffinityVector; unavailable?: readonly AffinityAxis[]; width?: number }) {
  const ratio = (value: number) => Math.min(1, Math.max(0, value / 100));
  const polygon = AFFINITY_AXES.map((axis, index) => point(index, ratio(values[axis])).join(',')).join(' ');
  const label = AFFINITY_AXES.map((axis) => `${AFFINITY_LABELS[axis]} ${unavailable.includes(axis) ? 'sin datos' : values[axis]}`).join('; ');
  return (
    <svg viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} width={width} height={(width * VIEW.height) / VIEW.width} className="mx-auto h-auto max-w-full" role="img" aria-label={`Perfil de afinidad: ${label}`}>
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <polygon key={ring} points={AFFINITY_AXES.map((_, index) => point(index, ring).join(',')).join(' ')} fill="none" className="stroke-line" strokeWidth={1} />
      ))}
      {AFFINITY_AXES.map((axis, index) => {
        const [x, y] = point(index, 1);
        return <line key={axis} x1={VIEW.cx} y1={VIEW.cy} x2={x} y2={y} className="stroke-line" strokeWidth={1} />;
      })}
      <polygon points={polygon} className="fill-accent stroke-accent" fillOpacity={0.12} strokeWidth={2} strokeLinejoin="round" />
      {AFFINITY_AXES.map((axis, index) => {
        const [x, y] = point(index, ratio(values[axis]));
        return <circle key={axis} cx={x} cy={y} r={4.5} className="fill-accent" stroke="#fff" strokeWidth={2} />;
      })}
      {AFFINITY_AXES.map((axis, index) => {
        const [x, y] = point(index, 1.24);
        const anchor = Math.abs(x - VIEW.cx) < 8 ? 'middle' : x > VIEW.cx ? 'start' : 'end';
        return (
          <text key={axis} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" aria-hidden="true">
            <tspan x={x} dy="-0.45em" fontSize="13" fontWeight="700" className="fill-ink">{AFFINITY_SHORT_LABELS[axis]}</tspan>
            <tspan x={x} dy="1.25em" fontSize="12" className="fill-muted-ink">{unavailable.includes(axis) ? '—' : values[axis]}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
