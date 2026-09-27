'use client';

import { Chip, Table } from '@heroui/react';
import { Timer } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ProgressChip, type ProgressStatus } from './ui';

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

function EmptyRow({ children }: { children: ReactNode }) {
  return <p className="px-4 py-10 text-center text-sm text-muted-ink">{children}</p>;
}

export function StudentsTable({ rows, label, empty }: { rows: readonly StudentRow[]; label: string; empty: string }) {
  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label={label} className="min-w-[760px]">
          <Table.Header>
            <Table.Column isRowHeader>Estudiante</Table.Column>
            <Table.Column>Curso y colegio</Table.Column>
            <Table.Column>Ingeniería de Software</Table.Column>
            <Table.Column>Desempeño</Table.Column>
            <Table.Column>Eje más marcado</Table.Column>
            <Table.Column>Actividad</Table.Column>
          </Table.Header>
          <Table.Body renderEmptyState={() => <EmptyRow>{empty}</EmptyRow>}>
            {rows.map((row) => (
              <Table.Row key={row.id} id={row.id}>
                <Table.Cell>
                  <Link href={`/estudiantes/${row.id}`} className="font-semibold text-ink hover:text-accent hover:underline">{row.name}</Link>
                  <span className="block text-xs text-muted-ink">{row.email}</span>
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

export function DecisionsTable({ rows }: { rows: readonly DecisionRow[] }) {
  return (
    <Table>
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
          <Table.Body renderEmptyState={() => <EmptyRow>Todavía no hay decisiones registradas en este intento.</EmptyRow>}>
            {rows.map((row) => (
              <Table.Row key={row.id} id={row.id}>
                <Table.Cell>
                  <span className="block font-semibold text-ink">{row.scene} · {row.sceneTitle}</span>
                  <span className="block text-xs text-muted-ink">{row.session}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="block">{row.decision}</span>
                  {row.detail && <span className="mt-0.5 block text-xs text-muted-ink">{row.detail}</span>}
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">
                  {row.elapsed}
                  {row.timedOut && (
                    <Chip size="sm" color="warning" variant="soft" className="ml-2"><Timer className="size-3" aria-hidden /><Chip.Label>Tiempo agotado</Chip.Label></Chip>
                  )}
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {row.performanceDelta === 0 ? '—' : row.performanceDelta > 0 ? `+${row.performanceDelta}` : row.performanceDelta}
                </Table.Cell>
                <Table.Cell>
                  <div className="flex flex-wrap gap-1">
                    {row.affinity.length === 0 ? '—' : row.affinity.map((item) => (
                      <Chip key={item} size="sm" color="accent" variant="soft"><Chip.Label>{item}</Chip.Label></Chip>
                    ))}
                  </div>
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap text-sm text-muted-ink">{row.at}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
