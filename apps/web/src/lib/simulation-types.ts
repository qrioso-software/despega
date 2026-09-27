import type { AffinityProfile, AppliedOutcome, PublicScene, SessionStatus, SimulationErrorCode } from '@despega/simulator';

/** Progreso del estudiante en una carrera, tal como lo necesita la interfaz. */
export type ProgressView = {
  readonly careerId: string;
  readonly runId: string;
  readonly version: number;
  readonly status: 'in_progress' | 'completed';
  readonly performance: number;
  readonly affinity: AffinityProfile;
  readonly currentSessionNumber: number | null;
  readonly completedSessions: number;
  readonly alignedBranchId?: string;
  readonly sessions: readonly {
    readonly number: number;
    readonly title: string;
    readonly synopsis: string;
    readonly estimatedMinutes: number;
    readonly status: SessionStatus;
    readonly performanceStart?: number;
    readonly performanceEnd?: number;
  }[];
};

export type ModuleView = {
  readonly careerId: string;
  readonly title: string;
  readonly tagline: string;
  readonly company: string;
  readonly playerRole: string;
  readonly characters: Readonly<Record<string, { readonly name: string; readonly role: string }>>;
};

export type ActionFailureCode = 'UNAUTHENTICATED' | 'CONFLICT' | 'INVALID' | 'UNAVAILABLE' | 'NOT_FOUND' | SimulationErrorCode;

export type ActionFailure = { readonly ok: false; readonly code: ActionFailureCode; readonly message: string };

export type SubmitResult =
  | { readonly ok: true; readonly outcome: AppliedOutcome; readonly scene: PublicScene | null; readonly progress: ProgressView }
  | ActionFailure;

export type BeginResult =
  | { readonly ok: true; readonly scene: PublicScene | null; readonly progress: ProgressView }
  | ActionFailure;
