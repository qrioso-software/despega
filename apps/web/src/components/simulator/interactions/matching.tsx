'use client';

import { Bug, CheckCircle2, Send, Wrench, XCircle } from 'lucide-react';
import { useState } from 'react';
import { CountdownRing, useCountdown } from '../countdown';
import type { InteractionProps } from './types';

/**
 * Emparejamiento con reloj (escena 3.2), sin pistas. Toca un error y luego su solución;
 * cada pareja se identifica con un número, no solo con color.
 */
export function MatchingInteraction({ interaction, active, locked, outcome, onSubmit }: InteractionProps<'matching'>) {
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);
  const { remaining, fraction } = useCountdown(interaction.timeLimitSeconds, active && !locked, () => {
    if (!locked) onSubmit({ kind: 'matching', matches, timedOut: true });
  });
  const reveal = outcome?.detail.kind === 'matching' ? outcome.detail : null;
  const complete = Object.keys(matches).length === interaction.problems.length;
  const pairNumber = (problemId: string) => interaction.problems.findIndex((problem) => problem.id === problemId) + 1;
  const problemForSolution = (solutionId: string) => Object.entries(matches).find(([, value]) => value === solutionId)?.[0];

  function selectProblem(problemId: string) {
    if (locked) return;
    if (matches[problemId]) {
      setMatches((current) => {
        const next = { ...current };
        delete next[problemId];
        return next;
      });
      setSelectedProblem(problemId);
      return;
    }
    setSelectedProblem((current) => (current === problemId ? null : problemId));
  }

  function selectSolution(solutionId: string) {
    if (locked || !selectedProblem) return;
    setMatches((current) => {
      const next = Object.fromEntries(Object.entries(current).filter(([, value]) => value !== solutionId));
      next[selectedProblem] = solutionId;
      return next;
    });
    setSelectedProblem(null);
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-4 rounded-2xl bg-sun-soft p-3 pr-4">
        <CountdownRing remaining={remaining} fraction={fraction} size={64} />
        <div>
          <p className="text-sm font-bold text-sun-strong">{interaction.prompt}</p>
          <p className="mt-0.5 text-xs text-sun-strong/80">
            {Object.keys(matches).length} de {interaction.problems.length} emparejados · Toca un error y luego la solución que lo resuelve.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid content-start gap-2" role="group" aria-label="Errores">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted"><Bug className="size-4" aria-hidden /> Errores</p>
          {interaction.problems.map((problem) => {
            const paired = Boolean(matches[problem.id]);
            const selected = selectedProblem === problem.id;
            const verdict = reveal ? (reveal.correctProblemIds.includes(problem.id) ? 'correct' : 'wrong') : undefined;
            const expected = reveal && verdict === 'wrong' ? interaction.solutions.find((solution) => solution.id === reveal.expected[problem.id]) : undefined;
            return (
              <button
                key={problem.id}
                type="button"
                disabled={locked}
                onClick={() => selectProblem(problem.id)}
                aria-pressed={selected}
                className={`rounded-2xl border-2 p-3 text-left transition-colors disabled:cursor-default ${
                  verdict === 'correct'
                    ? 'border-good bg-good-soft'
                    : verdict === 'wrong'
                      ? 'border-bad bg-bad-soft'
                      : selected
                        ? 'border-accent bg-accent-soft'
                        : paired
                          ? 'border-accent/40 bg-white'
                          : 'border-line bg-white hover:border-accent/50'
                }`}
              >
                <span className="flex items-start gap-3">
                  <PairBadge number={paired ? pairNumber(problem.id) : undefined} />
                  <span className="flex-1 font-semibold text-ink">{problem.text}</span>
                  {verdict === 'correct' && <CheckCircle2 className="size-5 shrink-0 text-good" aria-label="Bien emparejado" />}
                  {verdict === 'wrong' && <XCircle className="size-5 shrink-0 text-bad" aria-label="Mal emparejado" />}
                </span>
                {expected && <span className="mt-2 block text-sm text-bad-strong">Solución: {expected.text}</span>}
              </button>
            );
          })}
        </div>
        <div className="grid content-start gap-2" role="group" aria-label="Soluciones">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted"><Wrench className="size-4" aria-hidden /> Soluciones</p>
          {interaction.solutions.map((solution) => {
            const owner = problemForSolution(solution.id);
            return (
              <button
                key={solution.id}
                type="button"
                disabled={locked || !selectedProblem}
                onClick={() => selectSolution(solution.id)}
                className={`rounded-2xl border-2 p-3 text-left transition-colors disabled:cursor-default ${
                  owner ? 'border-accent/40 bg-accent-soft/40' : selectedProblem && !locked ? 'border-accent/50 bg-white hover:bg-accent-soft' : 'border-line bg-white'
                }`}
              >
                <span className="flex items-start gap-3">
                  <PairBadge number={owner ? pairNumber(owner) : undefined} />
                  <span className="flex-1 text-ink">{solution.text}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {reveal ? (
        <p className="rounded-2xl bg-mist px-4 py-3 text-sm font-semibold text-ink">
          Emparejaste bien {reveal.correctCount} de {reveal.total} errores.
        </p>
      ) : (
        <button
          type="button"
          className="btn btn-accent justify-self-end"
          disabled={!complete || locked}
          onClick={() => onSubmit({ kind: 'matching', matches, timedOut: false })}
        >
          <Send className="size-4" aria-hidden /> Aplicar las soluciones
        </button>
      )}
    </div>
  );
}

function PairBadge({ number }: { number?: number }) {
  return (
    <span className={`grid size-7 shrink-0 place-items-center rounded-lg text-sm font-bold ${number ? 'bg-accent text-white' : 'border-2 border-dashed border-line text-transparent'}`} aria-label={number ? `Pareja ${number}` : undefined}>
      {number ?? '·'}
    </span>
  );
}
