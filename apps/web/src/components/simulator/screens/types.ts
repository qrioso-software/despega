import type { PublicScene, ResolvedLine } from '@despega/simulator';
import type { ReactNode } from 'react';
import type { ModuleView } from '@/lib/simulation-types';

export type LineReveal = {
  readonly visibleLines: readonly ResolvedLine[];
  readonly nextLine?: ResolvedLine;
  readonly done: boolean;
  readonly skip: () => void;
};

export type ScreenProps = {
  readonly scene: PublicScene;
  readonly module: ModuleView;
  readonly playerName: string;
  readonly reveal: LineReveal;
  /** La interacción de la escena; la pantalla decide dónde y cuándo mostrarla. */
  readonly interaction: ReactNode;
};
