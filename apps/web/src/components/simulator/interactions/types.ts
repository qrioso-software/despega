import type { AppliedOutcome, PublicInteraction, SceneResponse } from '@despega/simulator';
import type { ModuleView } from '@/lib/simulation-types';

export type InteractionProps<K extends PublicInteraction['kind']> = {
  readonly interaction: Extract<PublicInteraction, { kind: K }>;
  /** Los diálogos previos ya se mostraron: la interacción (y su reloj) puede empezar. */
  readonly active: boolean;
  /** La respuesta ya se envió: no se admiten más cambios. */
  readonly locked: boolean;
  /** Consecuencia recibida del servidor, para revelar aciertos en pantalla. */
  readonly outcome: AppliedOutcome | null;
  readonly onSubmit: (response: SceneResponse) => void;
  readonly module: ModuleView;
  readonly playerName: string;
};

export const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
