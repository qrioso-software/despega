'use client';

import { BellRing, Video } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { CharacterAvatar } from '@/components/characters/character-avatar';
import { NarrationLine, SkipButton, speakerName } from '../conversation';
import type { ScreenProps } from './types';

/** Escena de apertura: notificación push en el celular y, enseguida, la llamada entrante. */
export function NotificationScreen({ scene, module, reveal, interaction }: ScreenProps) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!reveal.done) return;
    const push = window.setTimeout(() => setStage(1), 500);
    const call = window.setTimeout(() => setStage(2), 2_300);
    return () => {
      window.clearTimeout(push);
      window.clearTimeout(call);
    };
  }, [reveal.done]);

  const time = scene.clock?.replace(/\s?[ap]\. m\./, '') ?? '';
  const caller = scene.notification?.caller;
  const hasCall = Boolean(caller);
  const ready = hasCall ? stage >= 2 : stage >= 1;

  return (
    <section className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
      <div className="grid gap-4">
        <p className="eyebrow">Sesión {scene.session.number} · {scene.session.title}</p>
        {reveal.visibleLines.map((line, index) => (
          <p key={index} className="font-display text-2xl font-bold leading-snug text-ink sm:text-3xl">{line.text}</p>
        ))}
        {!reveal.done && <SkipButton onSkip={reveal.skip} />}
        {ready && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>{interaction}</motion.div>}
        {stage === 1 && <NarrationLine text="Tu celular vibra sobre el escritorio…" />}
      </div>

      <div className="relative mx-auto h-[540px] w-[290px] overflow-hidden rounded-[2.75rem] border-[10px] border-night bg-gradient-to-b from-[#1b1840] via-[#3a2a8f] to-[#ff5b2e] shadow-pop" aria-label="Pantalla del celular">
        <div className="flex items-center justify-between px-6 pt-3 text-xs font-semibold text-white/90">
          <span>{time}</span>
          <span className="h-5 w-20 rounded-full bg-night" aria-hidden />
          <span>5G</span>
        </div>
        <div className="mt-12 text-center text-white">
          <p className="font-display text-6xl font-bold">{time}</p>
        </div>
        <AnimatePresence>
          {stage >= 1 && scene.notification && (
            <motion.div
              initial={{ y: -120, opacity: 0 }}
              animate={{ y: 0, opacity: 1, x: [0, -4, 4, -3, 3, 0] }}
              transition={{ type: 'spring', stiffness: 300, damping: 22, x: { duration: 0.5, delay: 0.35 } }}
              className="mx-3 mt-8 rounded-2xl bg-white/90 p-3 text-ink shadow-soft backdrop-blur"
              role="status"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-muted">
                <span className="grid size-5 place-items-center rounded-md bg-bad text-white"><BellRing className="size-3" aria-hidden /></span>
                {scene.notification.app}
                <span className="ml-auto font-medium">ahora</span>
              </div>
              <p className="mt-1.5 text-sm font-bold">{scene.notification.title}</p>
              <p className="text-sm text-ink-soft">{scene.notification.body}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {stage >= 2 && caller && (
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              className="absolute inset-x-3 bottom-4 rounded-3xl bg-night/90 p-4 text-center text-white backdrop-blur"
            >
              <div className="mx-auto w-fit animate-pulse-ring rounded-full">
                <CharacterAvatar characterId={caller} mood="concerned" size={64} decorative />
              </div>
              <p className="mt-2 font-display text-lg font-bold">{speakerName(module, caller)}</p>
              <p className="flex items-center justify-center gap-1.5 text-xs text-white/70"><Video className="size-3.5" aria-hidden /> Videollamada entrante…</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
