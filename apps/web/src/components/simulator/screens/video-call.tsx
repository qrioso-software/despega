'use client';

import type { Mood } from '@despega/simulator';
import { Mic, MicOff, MonitorUp, PhoneOff, VideoOff } from 'lucide-react';
import { motion } from 'motion/react';
import { CharacterAvatar } from '@/components/characters/character-avatar';
import { NarrationLine, SkipButton, TypingIndicator, speakerName } from '../conversation';
import { OfficeWindow } from '../office-window';
import type { ScreenProps } from './types';

/** Videollamada tipo reunión, reutilizable para Marisol, Andrés o el grupo. */
export function VideoCallScreen({ scene, module, playerName, reveal, interaction }: ScreenProps) {
  const lastLine = reveal.visibleLines.at(-1);
  const speaking = !reveal.done ? lastLine?.speaker : undefined;
  const moods = new Map<string, Mood>();
  for (const line of reveal.visibleLines) moods.set(line.speaker, line.mood);
  const initials = playerName.slice(0, 2).toUpperCase();

  return (
    <OfficeWindow app="call" subtitle={scene.participants.map((id) => speakerName(module, id)).join(', ')} clock={scene.clock}>
      <div className={`grid gap-2 bg-night p-2 sm:p-3 ${scene.participants.length > 1 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'}`}>
        {scene.participants.map((id) => {
          const active = speaking === id;
          return (
            <div
              key={id}
              className={`relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-night-soft transition-shadow ${active ? 'ring-4 ring-sun' : ''}`}
            >
              <CharacterAvatar characterId={id} mood={moods.get(id) ?? 'neutral'} talking={active} size={124} />
              <span className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white">
                {active ? <Mic className="size-3.5 text-sun" aria-hidden /> : <MicOff className="size-3.5 opacity-60" aria-hidden />}
                {speakerName(module, id)}
                <span className="hidden font-normal opacity-70 sm:inline">· {module.characters[id]?.role}</span>
              </span>
            </div>
          );
        })}
        <div className="relative grid aspect-[4/3] place-items-center rounded-2xl bg-ink-soft">
          <span className="grid size-16 place-items-center rounded-full bg-accent font-display text-xl font-bold text-white">{initials}</span>
          <span className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white">
            <VideoOff className="size-3.5 opacity-70" aria-hidden /> {playerName} (tú)
          </span>
        </div>
      </div>

      <div className="grid gap-2 border-b border-line bg-paper px-4 py-3" aria-live="polite">
        {reveal.visibleLines.map((line, index) =>
          line.speaker === 'narrator' ? (
            <NarrationLine key={index} text={line.text} />
          ) : (
            <motion.p key={index} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`text-[0.95rem] ${index === reveal.visibleLines.length - 1 ? 'text-ink' : 'text-muted'}`}>
              <strong className="font-bold text-ink">{speakerName(module, line.speaker)}:</strong> {line.text}
            </motion.p>
          ),
        )}
        {reveal.nextLine && <TypingIndicator speaker={reveal.nextLine.speaker} module={module} />}
        {!reveal.done && (
          <div className="flex justify-end">
            <SkipButton onSkip={reveal.skip} />
          </div>
        )}
      </div>

      {reveal.done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-5">
          {interaction}
        </motion.div>
      )}

      <div className="flex items-center justify-center gap-3 border-t border-line bg-mist/70 py-2.5" aria-hidden>
        {[Mic, VideoOff, MonitorUp].map((Icon, index) => (
          <span key={index} className="grid size-9 place-items-center rounded-full bg-white text-ink-soft ring-1 ring-line">
            <Icon className="size-4" />
          </span>
        ))}
        <span className="grid size-9 place-items-center rounded-full bg-bad text-white"><PhoneOff className="size-4" /></span>
      </div>
    </OfficeWindow>
  );
}
