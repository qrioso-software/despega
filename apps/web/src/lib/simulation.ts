import 'server-only';

import { moduleFor, type CareerProgressRecord } from '@despega/data';
import { progressSnapshot, type CareerModule } from '@despega/simulator';
import type { ModuleView, ProgressView } from './simulation-types';

export function toProgressView(module: CareerModule, record: CareerProgressRecord): ProgressView {
  const snapshot = progressSnapshot(module, record.state);
  return {
    careerId: record.careerId,
    runId: record.runId,
    version: record.version,
    status: snapshot.status,
    performance: snapshot.performance,
    affinity: snapshot.affinity,
    currentSessionNumber: snapshot.currentSessionNumber,
    completedSessions: snapshot.completedSessions,
    alignedBranchId: snapshot.alignedBranchId,
    sessions: snapshot.sessions.map((session) => ({
      number: session.number,
      title: session.title,
      synopsis: session.synopsis,
      estimatedMinutes: session.estimatedMinutes,
      status: session.status,
      performanceStart: session.performanceStart,
      performanceEnd: session.performanceEnd,
    })),
  };
}

export function toModuleView(module: CareerModule): ModuleView {
  return {
    careerId: module.careerId,
    title: module.title,
    tagline: module.tagline,
    company: module.company,
    playerRole: module.playerRole,
    characters: Object.fromEntries(
      Object.values(module.characters).map((character) => [character.id, { name: character.name, role: character.role }]),
    ),
  };
}

/** Módulo jugable de la carrera, o `null` si la carrera no existe o aún no tiene módulo. */
export function playableModule(careerId: string): CareerModule | null {
  try {
    return moduleFor(careerId);
  } catch {
    return null;
  }
}
