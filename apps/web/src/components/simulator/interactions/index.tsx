'use client';

import type { AppliedOutcome, PublicScene, SceneResponse } from '@despega/simulator';
import type { ModuleView } from '@/lib/simulation-types';
import { ClassificationInteraction } from './classification';
import { ContinueInteraction } from './continue';
import { DialogueInteraction } from './dialogue';
import { LiveDecisionInteraction } from './live-decision';
import { MatchingInteraction } from './matching';
import { MessageBuilderInteraction } from './message-builder';
import { PrioritizationInteraction } from './prioritization';
import { SequenceInteraction } from './sequence';

export type InteractionViewProps = {
  scene: PublicScene;
  active: boolean;
  locked: boolean;
  outcome: AppliedOutcome | null;
  onSubmit: (response: SceneResponse) => void;
  module: ModuleView;
  playerName: string;
  continueVariant?: 'primary' | 'light';
};

/** Elige la interacción de la escena. Resumen y proyección se dibujan como pantallas propias. */
export function InteractionView({ scene, continueVariant, ...common }: InteractionViewProps) {
  const interaction = scene.interaction;
  switch (interaction.kind) {
    case 'none':
      return <ContinueInteraction {...common} interaction={interaction} variant={continueVariant} />;
    case 'dialogue':
      return <DialogueInteraction key={scene.id} {...common} interaction={interaction} />;
    case 'classification':
      return <ClassificationInteraction key={scene.id} {...common} interaction={interaction} />;
    case 'message-builder':
      return <MessageBuilderInteraction key={scene.id} {...common} interaction={interaction} />;
    case 'sequence':
      return <SequenceInteraction key={scene.id} {...common} interaction={interaction} />;
    case 'prioritization':
      return <PrioritizationInteraction key={scene.id} {...common} interaction={interaction} />;
    case 'matching':
      return <MatchingInteraction key={scene.id} {...common} interaction={interaction} />;
    case 'live-decision':
      return <LiveDecisionInteraction key={scene.id} {...common} interaction={interaction} />;
    default:
      return null;
  }
}
