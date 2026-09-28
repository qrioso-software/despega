'use client';

import type { Mood } from '@despega/simulator';
import { Mic, MicOff, MonitorUp, PhoneOff, VideoOff } from 'lucide-react';
import { motion } from 'motion/react';
import { CharacterAvatar } from '@/components/characters/character-avatar';
import { NarrationLine, TypingIndicator, speakerName } from '../conversation';
import { OfficeWindow } from '../office-window';
import { SceneWorkspace } from '../stage';
import type { ScreenProps } from './types';

/** Videollamada tipo reunión, reutilizable para Marisol, Andrés o el grupo. */
export function VideoCallScreen({ scene, module, playerName, reveal, interaction, outcome }: ScreenProps) {
  const lastLine = reveal.visibleLines.at(-1);
  const speaking = !reveal.done ? lastLine?.speaker : undefined;
  const moods = new Map<string, Mood>();
  for (const line of reveal.visibleLines) moods.set(line.speaker, line.mood);
  const initials = playerName.slice(0, 2).toUpperCase();
  const tiles = scene.participants.length + 1;
  const grid = tiles >= 4 ? 'grid-cols-2 @3xl:grid-cols-4' : tiles === 3 ? 'grid-cols-2 @xl:grid-cols-3' : 'grid-cols-2';
  const tile = 'relative aspect-[4/3] overflow-hidden rounded-xl @2xl:aspect-video';

  return (
    <SceneWorkspace
      kind={scene.interaction.kind}
      ready={reveal.done}
      onSkip={reveal.skip}
      interaction={interaction}
      outcome={outcome}
      world={
        <OfficeWindow
          app="call"
          subtitle={scene.participants.map((id) => speakerName(module, id)).join(', ')}
          scrollKey={reveal.visibleLines.length}
          toolbar={
            <div className="@container bg-night p-2 sm:p-3">
              <div className={`mx-auto grid max-w-4xl gap-2 ${grid}`}>
                {scene.participants.map((id) => {
                  const active = speaking === id;
                  return (
                    <div key={id} className={`${tile} bg-night-soft transition-shadow ${active ? 'ring-4 ring-sun' : ''}`}>
                      <CharacterAvatar
                        characterId={id}
                        mood={moods.get(id) ?? 'neutral'}
                        talking={active}
                        size={124}
                        className="absolute inset-0 m-auto h-[72%] w-auto"
                      />
                      <span className="absolute bottom-2 left-2 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white">
                        {active ? <Mic className="size-3.5 shrink-0 text-sun" aria-hidden /> : <MicOff className="size-3.5 shrink-0 opacity-60" aria-hidden />}
                        <span className="truncate">
                          {speakerName(module, id)}
                          <span className="hidden font-normal opacity-70 @xl:inline"> · {module.characters[id]?.role}</span>
                        </span>
                      </span>
                    </div>
                  );
                })}
                <div className={`${tile} grid place-items-center bg-ink-soft`}>
                  <span className="grid size-16 place-items-center rounded-full bg-accent font-display text-xl font-bold text-white">{initials}</span>
                  <span className="absolute bottom-2 left-2 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white">
                    <VideoOff className="size-3.5 shrink-0 opacity-70" aria-hidden /> <span className="truncate">{playerName} (tú)</span>
                  </span>
                </div>
              </div>
            </div>
          }
          footer={
            <div className="flex items-center justify-center gap-3 bg-paper py-2.5" aria-hidden>
              {[Mic, VideoOff, MonitorUp].map((Icon, index) => (
                <span key={index} className="grid size-9 place-items-center rounded-full bg-surface text-ink-soft ring-1 ring-line">
                  <Icon className="size-4" />
                </span>
              ))}
              <span className="grid size-9 place-items-center rounded-full bg-bad text-white"><PhoneOff className="size-4" /></span>
            </div>
          }
        >
          <div className="grid max-w-3xl gap-3 px-4 py-5 sm:px-6" aria-live="polite">
            <p className="text-xs font-semibold text-muted">Transcripción</p>
            {reveal.visibleLines.map((line, index) =>
              line.speaker === 'narrator' ? (
                <NarrationLine key={index} text={line.text} />
              ) : (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-[0.95rem] leading-relaxed ${index === reveal.visibleLines.length - 1 ? 'text-ink' : 'text-muted'}`}
                >
                  <strong className="font-bold text-ink">{speakerName(module, line.speaker)}:</strong> {line.text}
                </motion.p>
              ),
            )}
            {reveal.nextLine && <TypingIndicator speaker={reveal.nextLine.speaker} module={module} />}
          </div>
        </OfficeWindow>
      }
    />
  );
}
