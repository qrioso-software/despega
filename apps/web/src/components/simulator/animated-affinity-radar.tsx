'use client';

import { AFFINITY_AXES, AFFINITY_LABELS, type AffinityAxis, type AffinityVector } from '@despega/simulator';
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'motion/react';
import { useEffect } from 'react';
import { RADAR_SERIES, RADAR_VIEW, RadarGrid, RadarLabels, radarPoint } from './affinity-radar';

/** El radar crece desde el perfil anterior hasta el actual (resúmenes de sesión). */
export function AnimatedAffinityRadar({
  from,
  to,
  size = 320,
  unavailable = [],
  className = '',
}: {
  from: AffinityVector;
  to: AffinityVector;
  size?: number;
  unavailable?: readonly AffinityAxis[];
  className?: string;
}) {
  const { center, radius } = RADAR_VIEW;
  const reduceMotion = useReducedMotion();
  const progress = useMotionValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      progress.set(1);
      return;
    }
    progress.set(0);
    const controls = animate(progress, 1, { duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 });
    return () => controls.stop();
  }, [from, to, progress, reduceMotion]);

  const points = useTransform(progress, (value) =>
    AFFINITY_AXES.map((axis, index) => radarPoint(index, ratio(from[axis] + (to[axis] - from[axis]) * value), center, radius).join(',')).join(' '),
  );
  const description = AFFINITY_AXES.map((axis) => `${AFFINITY_LABELS[axis]}: ${unavailable.includes(axis) ? 'sin datos aún' : `${to[axis]} de 100`}`).join('; ');

  return (
    <svg viewBox={`0 0 ${RADAR_VIEW.width} ${RADAR_VIEW.height}`} width={size} height={(size * RADAR_VIEW.height) / RADAR_VIEW.width} className={`h-auto max-w-full ${className}`} role="img" aria-label={`Perfil de afinidad. ${description}.`}>
      <RadarGrid center={center} radius={radius} />
      <motion.polygon points={points} fill={RADAR_SERIES} fillOpacity={0.12} stroke={RADAR_SERIES} strokeWidth={2} strokeLinejoin="round" />
      {AFFINITY_AXES.map((axis, index) => (
        <RadarVertex key={axis} index={index} fromValue={from[axis]} toValue={to[axis]} progress={progress} center={center} radius={radius} />
      ))}
      <RadarLabels values={to} center={center} radius={radius} unavailable={unavailable} />
    </svg>
  );
}

function RadarVertex({
  index,
  fromValue,
  toValue,
  progress,
  center,
  radius,
}: {
  index: number;
  fromValue: number;
  toValue: number;
  progress: MotionValue<number>;
  center: { x: number; y: number };
  radius: number;
}) {
  const x = useTransform(progress, (value) => radarPoint(index, ratio(fromValue + (toValue - fromValue) * value), center, radius)[0]);
  const y = useTransform(progress, (value) => radarPoint(index, ratio(fromValue + (toValue - fromValue) * value), center, radius)[1]);
  return <motion.circle cx={x} cy={y} r={4.5} fill={RADAR_SERIES} stroke="#fff" strokeWidth={2} />;
}

function ratio(value: number): number {
  return Math.min(1, Math.max(0, value / 100));
}
