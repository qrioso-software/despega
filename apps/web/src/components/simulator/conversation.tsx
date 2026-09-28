'use client';

import type { ResolvedLine } from '@despega/simulator';
import { BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { CharacterAvatar } from '@/components/characters/character-avatar';
import type { ModuleView } from '@/lib/simulation-types';

export function speakerName(module: ModuleView, speaker: string): string {
  return module.characters[speaker]?.name ?? (speaker === 'narrator' ? 'Narración' : 'Sistema');
}

/** Burbuja de chat de un personaje, o nota de narración centrada. */
export function ChatLine({ line, module, talking = false }: { line: ResolvedLine; module: ModuleView; talking?: boolean }) {
  if (line.speaker === 'narrator' || line.speaker === 'system') return <NarrationLine text={line.text} />;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-end gap-2.5"
    >
      <CharacterAvatar characterId={line.speaker} mood={line.mood} talking={talking} size={40} decorative />
      <div className="max-w-[85%]">
        <p className="mb-1 text-xs font-bold text-muted">
          {speakerName(module, line.speaker)} <span className="font-medium">· {module.characters[line.speaker]?.role}</span>
        </p>
        <p className="rounded-xl rounded-bl-md bg-mist px-4 py-2.5 text-[0.95rem] text-ink">{line.text}</p>
      </div>
    </motion.div>
  );
}

export function PlayerLine({ text, playerName }: { text: string; playerName: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
      <div className="max-w-[85%]">
        <p className="mb-1 text-right text-xs font-bold text-muted">{playerName} (tú)</p>
        <p className="rounded-xl rounded-br-md bg-accent px-4 py-2.5 text-[0.95rem] text-white">{text}</p>
      </div>
    </motion.div>
  );
}

export function NarrationLine({ text, dark = false }: { text: string; dark?: boolean }) {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`mx-auto flex max-w-xl items-start justify-center gap-2 text-center text-sm italic ${dark ? 'text-white/80' : 'text-muted'}`}
    >
      <BookOpen className="mt-0.5 size-4 shrink-0 opacity-70" aria-hidden />
      <span>{text}</span>
    </motion.p>
  );
}

export function TypingIndicator({ speaker, module }: { speaker: string; module: ModuleView }) {
  if (speaker === 'narrator' || speaker === 'system') {
    return <span className="mx-auto block h-5 w-10 animate-pulse rounded-full bg-mist" aria-hidden />;
  }
  return (
    <div className="flex items-end gap-2.5" aria-live="polite">
      <CharacterAvatar characterId={speaker} size={32} decorative />
      <span className="sr-only">{speakerName(module, speaker)} está escribiendo…</span>
      <span className="flex gap-1 rounded-xl rounded-bl-md bg-mist px-4 py-3" aria-hidden>
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className="size-2 rounded-full bg-muted"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: dot * 0.18 }}
          />
        ))}
      </span>
    </div>
  );
}

export function SkipButton({ onSkip, dark = false }: { onSkip: () => void; dark?: boolean }) {
  return (
    <button
      type="button"
      onClick={onSkip}
      className={`text-xs font-bold uppercase tracking-wider underline-offset-4 hover:underline ${dark ? 'text-white/60' : 'text-muted'}`}
    >
      Mostrar todo
    </button>
  );
}
