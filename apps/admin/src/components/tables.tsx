'use client';

import { Chip, Table } from '@heroui/react';
import { ChevronRight, ListChecks, Timer, Users } from 'lucide-react';
import Link from 'next/link';
import { Initials } from './initials';
import { EmptyState, ProgressChip, type ProgressStatus } from './ui';

export type StudentRow = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly grade?: string;
  readonly school?: string;
  readonly registeredAt: string;
  readonly status: ProgressStatus;
  readonly session: number | null;
  readonly performance: number | null;
  readonly strongest?: string;
  readonly updatedAt?: string;
};

/**
 * Estudiantes con su progreso en la carrera piloto: tabla en escritorio y lista de
 * filas tocables en móvil (la tabla no cabe en 390 px sin desplazamiento lateral).
 */
export function StudentsTable({ rows, label, empty }: { rows: readonly StudentRow[]; label: string; empty: string }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-surface">
        <EmptyState icon={Users} title="Sin estudiantes">{empty}</EmptyState>
      </div>
    );
  }

  return (
    <>
      <ul aria-label={label} className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface md:hidden">
        {rows.map((row) => (
          <li key={row.id}>
            <Link href={`/estudiantes/${row.id}`} className="flex items-center gap-3 px-4 py-3.5 active:bg-surface-secondary">
              <Initials name={row.name} tone="soft" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{row.name}</p>
                <p className="truncate text-xs text-muted-ink">{[row.grade, row.school].filter(Boolean).join(' · ') || row.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <ProgressChip status={row.status} session={row.session} />
                  {row.performance !== null && <span className="text-xs tabular-nums text-muted-ink">Desempeño {row.performance}</span>}
                </div>
              </div>
              <ChevronRight className="size-4 shrink-0 text-placeholder" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      <Table className="max-md:hidden">
        <Table.ScrollContainer>
          <Table.Content aria-label={label} className="min-w-[860px]">
            <Table.Header>
              <Table.Column isRowHeader>Estudiante</Table.Column>
              <Table.Column>Curso y colegio</Table.Column>
              <Table.Column>Ingeniería de Software</Table.Column>
              <Table.Column>Desempeño</Table.Column>
              <Table.Column>Eje más marcado</Table.Column>
              <Table.Column>Actividad</Table.Column>
            </Table.Header>
            <Table.Body>
              {rows.map((row) => (
                <Table.Row key={row.id} id={row.id}>
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      <Initials name={row.name} size="sm" tone="soft" />
                      <div className="min-w-0">
                        <Link href={`/estudiantes/${row.id}`} className="block truncate font-semibold text-ink hover:text-accent hover:underline">{row.name}</Link>
                        <span className="block truncate text-xs text-muted-ink">{row.email}</span>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="block text-sm">{row.grade || '—'}</span>
                    <span className="block text-xs text-muted-ink">{row.school || 'Sin colegio'}</span>
                  </Table.Cell>
                  <Table.Cell><ProgressChip status={row.status} session={row.session} /></Table.Cell>
                  <Table.Cell className="tabular-nums">{row.performance ?? '—'}</Table.Cell>
                  <Table.Cell>{row.strongest ?? '—'}</Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-sm text-muted-ink">{row.updatedAt ?? row.registeredAt}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </>
  );
}

export type DecisionRow = {
  readonly id: string;
  readonly scene: string;
  readonly sceneTitle: string;
  readonly session: string;
  readonly decision: string;
  readonly detail?: string;
  readonly timedOut: boolean;
  readonly elapsed: string;
  readonly performanceDelta: number;
  readonly affinity: readonly string[];
  readonly at: string;
};

function Delta({ value }: { value: number }) {
  if (value === 0) return <span className="text-muted-ink">—</span>;
  return <span className={`font-semibold tabular-nums ${value > 0 ? 'text-success-soft-foreground' : 'text-danger-soft-foreground'}`}>{value > 0 ? `+${value}` : value}</span>;
}

function TimedOut() {
  return (
    <Chip size="sm" color="warning" variant="soft" className="whitespace-nowrap">
      <Timer className="size-3" aria-hidden />
      <Chip.Label>Tiempo agotado</Chip.Label>
    </Chip>
  );
}

/** Registro de decisiones de un intento: tabla en escritorio, tarjetas en móvil. */
export function DecisionsTable({ rows }: { rows: readonly DecisionRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-surface">
        <EmptyState icon={ListChecks} title="Sin decisiones">Todavía no hay decisiones registradas en este intento.</EmptyState>
      </div>
    );
  }

  return (
    <>
      <ol aria-label="Registro de decisiones" className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="grid gap-2 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-ink">{row.scene} · {row.sceneTitle}</p>
                <p className="text-xs text-muted-ink">{row.session}</p>
              </div>
              <Delta value={row.performanceDelta} />
            </div>
            <div className="rounded-lg bg-surface-secondary px-3 py-2 text-sm">
              <p className="text-ink">{row.decision}</p>
              {row.detail && <p className="mt-0.5 text-xs text-muted-ink">{row.detail}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-ink">
              <span className="tabular-nums">{row.elapsed}</span>
              {row.timedOut && <TimedOut />}
              {row.affinity.map((item) => (
                <Chip key={item} size="sm" color="accent" variant="soft" className="whitespace-nowrap"><Chip.Label>{item}</Chip.Label></Chip>
              ))}
              <span className="ml-auto">{row.at}</span>
            </div>
          </li>
        ))}
      </ol>

      <Table className="max-md:hidden">
        <Table.ScrollContainer>
          <Table.Content aria-label="Registro de decisiones" className="min-w-[880px]">
            <Table.Header>
              <Table.Column isRowHeader>Escena</Table.Column>
              <Table.Column>Decisión</Table.Column>
              <Table.Column>Tiempo</Table.Column>
              <Table.Column>Desempeño</Table.Column>
              <Table.Column>Afinidad</Table.Column>
              <Table.Column>Fecha</Table.Column>
            </Table.Header>
            <Table.Body>
              {rows.map((row) => (
                <Table.Row key={row.id} id={row.id}>
                  <Table.Cell className="align-top">
                    <span className="block font-semibold text-ink">{row.scene} · {row.sceneTitle}</span>
                    <span className="block text-xs text-muted-ink">{row.session}</span>
                  </Table.Cell>
                  <Table.Cell className="align-top">
                    <span className="block">{row.decision}</span>
                    {row.detail && <span className="mt-0.5 block text-xs text-muted-ink">{row.detail}</span>}
                  </Table.Cell>
                  <Table.Cell className="align-top">
                    <div className="grid justify-items-start gap-1.5">
                      <span className="whitespace-nowrap tabular-nums">{row.elapsed}</span>
                      {row.timedOut && <TimedOut />}
                    </div>
                  </Table.Cell>
                  <Table.Cell className="align-top"><Delta value={row.performanceDelta} /></Table.Cell>
                  <Table.Cell className="align-top">
                    <div className="flex flex-wrap gap-1">
                      {row.affinity.length === 0 ? <span className="text-muted-ink">—</span> : row.affinity.map((item) => (
                        <Chip key={item} size="sm" color="accent" variant="soft" className="whitespace-nowrap"><Chip.Label>{item}</Chip.Label></Chip>
                      ))}
                    </div>
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap align-top text-sm text-muted-ink">{row.at}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </>
  );
}
