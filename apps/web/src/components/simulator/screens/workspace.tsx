'use client';

import { Archive, Inbox, Paperclip, Send, Star, Users } from 'lucide-react';
import { CharacterAvatar } from '@/components/characters/character-avatar';
import { ChatLine, SkipButton, TypingIndicator, speakerName } from '../conversation';
import { OfficeWindow } from '../office-window';
import { SceneWorkspace } from '../stage';
import type { ScreenProps } from './types';

/** Conversación que se revela línea a línea. El salto vive en el panel del jugador salvo que se indique. */
function Thread({ scene, module, reveal, showSkip = false }: Pick<ScreenProps, 'scene' | 'module' | 'reveal'> & { showSkip?: boolean }) {
  if (reveal.visibleLines.length === 0 && !reveal.nextLine) return null;
  const lastIndex = reveal.visibleLines.length - 1;
  return (
    <div className="grid gap-4" aria-live="polite">
      {reveal.visibleLines.map((line, index) => (
        <ChatLine key={`${scene.id}-${index}`} line={line} module={module} talking={!reveal.done && index === lastIndex} />
      ))}
      {reveal.nextLine && <TypingIndicator speaker={reveal.nextLine.speaker} module={module} />}
      {showSkip && !reveal.done && (
        <div className="flex justify-end">
          <SkipButton onSkip={reveal.skip} />
        </div>
      )}
    </div>
  );
}

/** Chat directo tipo mensajería de equipo (Marisol, Camila…). */
export function ChatScreen({ scene, module, reveal, interaction, outcome }: ScreenProps) {
  const names = scene.participants.map((id) => speakerName(module, id)).join(', ');
  return (
    <SceneWorkspace
      kind={scene.interaction.kind}
      ready={reveal.done}
      onSkip={reveal.skip}
      interaction={interaction}
      outcome={outcome}
      world={
        <OfficeWindow
          app="chat"
          subtitle={`Chat con ${names}`}
          scrollKey={reveal.visibleLines.length}
          toolbar={
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <div className="flex -space-x-3">
                {scene.participants.map((id) => (
                  <CharacterAvatar key={id} characterId={id} size={40} className="rounded-full ring-2 ring-surface" decorative />
                ))}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-ink">{names}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted"><span className="size-2 rounded-full bg-good" aria-hidden /> En línea</p>
              </div>
            </div>
          }
        >
          <div className="max-w-3xl px-4 py-5 sm:px-6 sm:py-6">
            <Thread scene={scene} module={module} reveal={reveal} />
          </div>
        </OfficeWindow>
      }
    />
  );
}

/** Bandeja de entrada: reportes de soporte (1.3) o el correo de Andrés (1.5). */
export function InboxScreen({ scene, module, reveal, interaction, outcome }: ScreenProps) {
  const email = scene.email;
  const unread = scene.interaction.kind === 'classification' ? scene.interaction.items.length : 1;
  return (
    <SceneWorkspace
      kind={scene.interaction.kind}
      ready={reveal.done}
      onSkip={reveal.skip}
      interaction={interaction}
      outcome={outcome}
      world={
        <OfficeWindow app="mail" subtitle="Bandeja de entrada" scrollKey={reveal.visibleLines.length}>
          <div className="grid @3xl:min-h-full @3xl:grid-cols-[13rem_minmax(0,1fr)]">
            <aside className="hidden border-r border-line bg-paper p-3 @3xl:block" aria-label="Carpetas">
              <ul className="grid gap-1 text-sm">
                {[
                  { icon: Inbox, label: 'Bandeja de entrada', count: unread, active: true },
                  { icon: Star, label: 'Destacados' },
                  { icon: Users, label: 'Soporte' },
                  { icon: Send, label: 'Enviados' },
                  { icon: Archive, label: 'Archivo' },
                ].map((folder) => (
                  <li key={folder.label} className={`flex items-center gap-2 rounded-lg px-3 py-2 ${folder.active ? 'bg-brand-soft font-bold text-brand-strong' : 'text-ink-soft'}`}>
                    <folder.icon className="size-4" aria-hidden />
                    <span className="flex-1">{folder.label}</span>
                    {folder.count ? <span className="rounded-full bg-brand px-2 text-xs font-bold text-ink">{folder.count}</span> : null}
                  </li>
                ))}
              </ul>
            </aside>
            <div className="grid content-start gap-5 px-4 py-5 sm:px-6 sm:py-6">
              <Thread scene={scene} module={module} reveal={reveal} />
              {email && (
                <article className="rounded-xl border border-line bg-surface p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <CharacterAvatar characterId={email.from} mood="serious" size={44} decorative />
                    <div className="min-w-0">
                      <p className="font-bold text-ink">{speakerName(module, email.from)} <span className="font-normal text-muted">· {module.characters[email.from]?.role}</span></p>
                      <p className="text-xs text-muted">Para: ti · {scene.clock}</p>
                    </div>
                    <Paperclip className="ml-auto size-4 text-muted" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-xl font-bold">{email.subject}</h3>
                  <p className="mt-2 whitespace-pre-line text-ink-soft">{email.body}</p>
                  {email.signature && <p className="mt-4 text-sm text-muted">— {email.signature}</p>}
                </article>
              )}
            </div>
          </div>
        </OfficeWindow>
      }
    />
  );
}

/** Tablero de tareas simplificado: revisión de código, priorización y emparejamiento. */
export function TaskBoardScreen({ scene, module, reveal, interaction, outcome }: ScreenProps) {
  return (
    <SceneWorkspace
      kind={scene.interaction.kind}
      ready={reveal.done}
      onSkip={reveal.skip}
      interaction={interaction}
      outcome={outcome}
      world={
        <OfficeWindow
          app="board"
          subtitle="Tablero del equipo"
          scrollKey={reveal.visibleLines.length}
          toolbar={
            <div className="flex items-center justify-between gap-3 bg-good-soft/50 px-4 py-2.5 sm:px-6">
              <p className="text-sm font-bold text-good-strong">Equipo {module.company}</p>
              <div className="flex -space-x-2">
                {Object.keys(module.characters).map((id) => (
                  <CharacterAvatar key={id} characterId={id} size={30} className="rounded-full ring-2 ring-surface" decorative />
                ))}
              </div>
            </div>
          }
        >
          <div className="max-w-3xl px-4 py-5 sm:px-6 sm:py-6">
            <Thread scene={scene} module={module} reveal={reveal} />
          </div>
        </OfficeWindow>
      }
    />
  );
}

/** Dashboard en vivo: la presión la ponen las reacciones de los usuarios, visibles desde el inicio. */
export function DashboardScreen({ scene, module, reveal, interaction, outcome }: ScreenProps) {
  return (
    <SceneWorkspace
      kind={scene.interaction.kind}
      ready
      interaction={interaction}
      outcome={outcome}
      world={
        <OfficeWindow app="pulse" subtitle="Reacciones de usuarios en vivo" scrollKey={reveal.visibleLines.length}>
          <div className="max-w-3xl px-4 py-5 sm:px-6 sm:py-6">
            <Thread scene={scene} module={module} reveal={reveal} showSkip />
          </div>
        </OfficeWindow>
      }
    />
  );
}
