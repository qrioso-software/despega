'use client';

import { useEffect, useEffectEvent, useState } from 'react';

/**
 * Reloj de cuenta regresiva visible (15–60 s según la escena). Al llegar a cero avisa
 * una sola vez; el juego avanza con la consecuencia predefinida, nunca se bloquea.
 */
export function useCountdown(seconds: number | undefined, running: boolean, onExpire: () => void) {
  const total = (seconds ?? 0) * 1_000;
  const [remaining, setRemaining] = useState(total);
  const expire = useEffectEvent(onExpire);

  useEffect(() => {
    if (!seconds || !running) return;
    const startedAt = performance.now() - (total - remaining);
    let frame = 0;
    let fired = false;
    const tick = () => {
      const left = Math.max(0, total - (performance.now() - startedAt));
      setRemaining(left);
      if (left <= 0) {
        if (!fired) {
          fired = true;
          expire();
        }
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // `remaining` solo se usa para reanudar desde donde quedó.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, running, total]);

  return { remaining, fraction: total > 0 ? remaining / total : 0 };
}

export function CountdownRing({ remaining, fraction, size = 72, label = 'Tiempo restante' }: { remaining: number; fraction: number; size?: number; label?: string }) {
  const secondsLeft = Math.ceil(remaining / 1_000);
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const color = fraction > 0.5 ? '#5b3df5' : fraction > 0.25 ? '#ffb400' : '#e5484d';
  const urgent = fraction <= 0.25 && remaining > 0;

  return (
    <div
      className={`relative grid shrink-0 place-items-center rounded-full bg-white ${urgent ? 'animate-pulse-ring' : ''}`}
      style={{ width: size, height: size }}
      role="timer"
      aria-label={`${label}: ${secondsLeft} segundos`}
    >
      <svg viewBox="0 0 72 72" width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#ebe6ff" strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
        />
      </svg>
      <span className="relative font-sans text-xl font-bold text-ink" aria-hidden="true">{secondsLeft}</span>
    </div>
  );
}

/** Medidor de riesgo de la escena 2.2: sube mientras el jugador decide. */
export function RiskMeter({ fraction }: { fraction: number }) {
  const risk = 1 - fraction;
  const level = risk < 0.35 ? 'Bajo' : risk < 0.65 ? 'Medio' : risk < 0.9 ? 'Alto' : 'Crítico';
  const color = risk < 0.35 ? '#12966f' : risk < 0.65 ? '#ffb400' : '#e5484d';
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted">
        <span>Riesgo de la decisión</span>
        <span className="text-ink">{level}</span>
      </div>
      <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-mist" role="meter" aria-label="Riesgo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(risk * 100)}>
        <div className="h-full rounded-full transition-[width,background-color] duration-200" style={{ width: `${Math.max(4, risk * 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
