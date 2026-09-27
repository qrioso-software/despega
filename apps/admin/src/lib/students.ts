import 'server-only';

import type { CareerProgressSummary, StudentProfile } from '@despega/data';
import { AFFINITY_LABELS, buildAffinityProfile, cumulativeAffinityMaximum, type CareerModule } from '@despega/simulator';
import type { StudentRow } from '@/components/tables';
import { formatDate, formatDateTime } from './format';

export function fullName(profile: Pick<StudentProfile, 'givenName' | 'familyName'>): string {
  return [profile.givenName, profile.familyName].filter(Boolean).join(' ');
}

/** Índice de la última sesión jugada, para normalizar la afinidad contra lo alcanzable. */
export function lastPlayedSession(module: CareerModule, summary: Pick<CareerProgressSummary, 'status' | 'currentSessionNumber' | 'completedSessions'>): number {
  if (summary.status === 'completed') return module.sessions.length - 1;
  return Math.max(0, Math.min(module.sessions.length - 1, (summary.currentSessionNumber ?? summary.completedSessions + 1) - 1));
}

export function strongestAxis(module: CareerModule, summary: CareerProgressSummary): string | undefined {
  const profile = buildAffinityProfile(summary.affinity, cumulativeAffinityMaximum(module, lastPlayedSession(module, summary)));
  const axis = profile.ranking.find((candidate) => profile.normalized[candidate] > 0);
  return axis ? AFFINITY_LABELS[axis] : undefined;
}

export function studentRow(module: CareerModule, profile: StudentProfile, summary: CareerProgressSummary | undefined): StudentRow {
  return {
    id: profile.studentId,
    name: fullName(profile) || 'Estudiante',
    email: profile.email,
    grade: profile.grade,
    school: profile.school,
    registeredAt: `Registro: ${formatDate(profile.createdAt)}`,
    status: summary ? summary.status : 'not_started',
    session: summary?.currentSessionNumber ?? null,
    performance: summary?.performance ?? null,
    strongest: summary ? strongestAxis(module, summary) : undefined,
    updatedAt: summary ? formatDateTime(summary.updatedAt) : undefined,
  };
}
