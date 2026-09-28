import { Alert, Card, Chip } from '@heroui/react';
import { AFFINITY_AXES, AFFINITY_LABELS, AFFINITY_SHORT_LABELS, type AffinityAxis, type AffinityVector } from '@despega/simulator';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Encabezado de cada pantalla. La sección ya aparece en las migas de la barra superior,
 * así que el título va directo; `leading` admite un avatar o el ícono de la carrera.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  leading,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  leading?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 lg:mb-8">
      <div className="flex min-w-0 items-center gap-4">
        {leading}
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
          <h1 className="text-2xl font-bold leading-tight text-ink sm:text-[1.75rem]">{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-sm text-muted-ink sm:text-[0.9375rem]">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Título de un bloque dentro de la página, con enlace o acción opcional a la derecha. */
export function SectionHeader({
  id,
  title,
  description,
  action,
  level = 2,
}: {
  id?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  level?: 2 | 3;
}) {
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
      <div className="min-w-0">
        <Heading id={id} className="text-lg font-bold text-ink">{title}</Heading>
        {description && <p className="text-sm text-muted-ink">{description}</p>}
      </div>
      {action}
    </div>
  );
}

const STAT_TONES = {
  accent: 'bg-accent-soft text-accent-soft-foreground',
  brand: 'bg-brand-soft text-brand-strong',
  sun: 'bg-warning-soft text-warning-soft-foreground',
} as const;

/** Ficha de indicador: ícono, etiqueta, valor con cifras tabulares y una nota opcional. */
export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'accent',
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: keyof typeof STAT_TONES;
}) {
  return (
    <Card>
      <Card.Content className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold leading-5 text-muted-ink">{label}</p>
          <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${STAT_TONES[tone]}`} aria-hidden>
            <Icon className="size-[1.125rem]" />
          </span>
        </div>
        <div>
          <p className="font-display text-3xl font-bold leading-none tabular-nums text-ink">{value}</p>
          {hint && <p className="mt-2 text-xs text-muted-ink">{hint}</p>}
        </div>
      </Card.Content>
    </Card>
  );
}

/** Estado vacío dentro de una tarjeta: ícono, título y una línea de contexto. */
export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="grid justify-items-center gap-2 px-4 py-10 text-center">
      <span className="grid size-11 place-items-center rounded-xl bg-surface-secondary text-muted-ink" aria-hidden>
        <Icon className="size-5" />
      </span>
      <p className="font-semibold text-ink">{title}</p>
      {children && <p className="max-w-sm text-sm text-muted-ink">{children}</p>}
    </div>
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
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-secondary" aria-hidden="true">
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
