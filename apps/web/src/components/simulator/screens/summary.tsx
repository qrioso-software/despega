'use client';

import { AFFINITY_LABELS, AFFINITY_SHORT_LABELS, emptyAffinity, type AffinityAxis, type PublicScene } from '@despega/simulator';
import { ArrowRight, CalendarClock, Timer } from 'lucide-react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect } from 'react';
import { CharacterAvatar } from '@/components/characters/character-avatar';
import type { ModuleView } from '@/lib/simulation-types';
import { AffinityBars } from '../affinity-radar';
import { AnimatedAffinityRadar } from '../animated-affinity-radar';
import { speakerName } from '../conversation';

/** «Tu semana en PixelForge»: desempeño, perfil de afinidad animado y lo que pasó. */
export function SummaryScreen({
  scene,
  module,
  locked,
  onContinue,
}: {
  scene: PublicScene;
  module: ModuleView;
  locked: boolean;
  onContinue: () => void;
}) {
  const interaction = scene.interaction;
  if (interaction.kind !== 'summary') return null;
  const { summary } = interaction;
  const delta = summary.performance - summary.performanceStart;
  const strongest = summary.affinity.ranking.filter((axis) => summary.affinity.normalized[axis] > 0).slice(0, 2);

  return (
    <section className="card overflow-hidden p-0">
      <div className="relative overflow-hidden bg-night px-6 py-8 text-white sm:px-10">
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-accent/40 blur-3xl" aria-hidden />
        <p className="eyebrow relative text-sun">{interaction.scope === 'module' ? 'Resultado final' : `Resumen · Sesión ${scene.session.number}`}</p>
        <h2 className="relative mt-2 text-3xl font-bold sm:text-4xl">{interaction.heading}</h2>
        <div className="relative mt-6 flex flex-wrap items-end gap-x-8 gap-y-3">
          <div>
            <p className="text-sm font-semibold text-white/70">Desempeño {interaction.scope === 'module' ? 'total' : 'acumulado'}</p>
            <p className="font-sans text-6xl font-bold"><CountUp from={summary.performanceStart} to={summary.performance} /><span className="text-2xl text-white/60"> / 100</span></p>
          </div>
          <span className={`chip mb-3 ${delta >= 0 ? 'bg-good text-white' : 'bg-bad text-white'}`}>
            {delta >= 0 ? `▲ +${delta}` : `▼ ${delta}`} {interaction.scope === 'module' ? 'en la semana' : 'en esta sesión'}
          </span>
        </div>
      </div>

      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_1fr]">
        <div>
          <h3 className="text-lg font-bold">Tu perfil de afinidad</h3>
          <p className="text-sm text-muted">Sin bien ni mal: muestra hacia dónde se inclinan tus decisiones.</p>
          <AnimatedAffinityRadar
            from={emptyAffinity()}
            to={summary.affinity.normalized}
            unavailable={summary.affinity.unavailable}
            size={320}
            className="mx-auto mt-2"
          />
          <AffinityBars values={summary.affinity.normalized} unavailable={summary.affinity.unavailable} />
          {strongest.length > 0 && (
            <p className="mt-4 rounded-2xl bg-accent-soft/60 px-4 py-3 text-sm text-ink">
              Tus ejes más marcados: <strong>{strongest.map((axis) => AFFINITY_LABELS[axis].toLowerCase()).join(' y ')}</strong>.
            </p>
          )}
        </div>

        <div className="grid content-start gap-6">
          {summary.closing && (
            <div className="flex items-end gap-3">
              <CharacterAvatar characterId={summary.closing.speaker} mood="happy" size={64} decorative />
              <div>
                <p className="text-xs font-bold text-muted">{speakerName(module, summary.closing.speaker)}</p>
                <p className="mt-1 rounded-2xl rounded-bl-md bg-mist px-4 py-3 text-ink">{summary.closing.text}</p>
              </div>
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold">{interaction.scope === 'module' ? 'Momentos que marcaron tu semana' : 'Lo que decidiste'}</h3>
            <ol className="mt-3 grid gap-2">
              {summary.highlights.map((highlight, index) => (
                <motion.li
                  key={`${highlight.sceneId}-${index}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.12 }}
                  className="rounded-2xl border border-line bg-paper px-4 py-3"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">Escena {highlight.sceneId} · {highlight.sceneTitle}</p>
                  <p className="font-semibold text-ink">
                    {highlight.label}
                    {highlight.timedOut && <Timer className="ml-1.5 inline size-4 text-sun-strong" aria-label="Tiempo agotado" />}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {highlight.performanceDelta !== 0 && (
                      <span className={`chip ${highlight.performanceDelta > 0 ? 'bg-good-soft text-good-strong' : 'bg-bad-soft text-bad-strong'}`}>
                        {highlight.performanceDelta > 0 ? `+${highlight.performanceDelta}` : highlight.performanceDelta} desempeño
                      </span>
                    )}
                    {(Object.entries(highlight.affinityDelta) as [AffinityAxis, number][]).filter(([, value]) => value).map(([axis, value]) => (
                      <span key={axis} className="chip bg-accent-soft text-accent-strong">{value > 0 ? `+${value}` : value} {AFFINITY_SHORT_LABELS[axis].toLowerCase()}</span>
                    ))}
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
          {summary.nextSession && (
            <div className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-brand/40 bg-brand-soft/50 p-4">
              <CalendarClock className="mt-0.5 size-5 shrink-0 text-brand-strong" aria-hidden />
              <p className="text-sm text-ink">
                <strong>Sesión {summary.nextSession.number} desbloqueada: «{summary.nextSession.title}».</strong> Puedes jugarla ahora u
                otro día; tu progreso queda guardado.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end border-t border-line bg-paper px-6 py-4">
        <button type="button" className="btn btn-primary min-h-12 px-6" disabled={locked} onClick={onContinue}>
          {interaction.continueLabel} <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}

function CountUp({ from, to }: { from: number; to: number }) {
  const value = useMotionValue(from);
  const rounded = useTransform(value, (latest) => Math.round(latest));
  useEffect(() => {
    value.set(from);
    const controls = animate(value, to, { duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 });
    return () => controls.stop();
  }, [from, to, value]);
  return <motion.span>{rounded}</motion.span>;
}
