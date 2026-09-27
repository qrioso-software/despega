import type { Mood } from '@despega/simulator';
import { useId } from 'react';

/**
 * Personajes de PixelForge dibujados en SVG propio (sin assets externos). Parpadean,
 * cambian de gesto según su estado de ánimo y mueven la boca cuando hablan. Es un
 * componente puro: sirve en Server y Client Components.
 */
type CharacterLook = {
  readonly name: string;
  readonly background: string;
  readonly skin: string;
  readonly skinShade: string;
  readonly hair: string;
  readonly shirt: string;
  readonly accent: string;
  readonly style: 'curly' | 'short' | 'long';
  readonly glasses?: boolean;
  readonly stubble?: boolean;
  readonly headphones?: boolean;
};

export const CHARACTER_LOOKS: Readonly<Record<string, CharacterLook>> = {
  marisol: {
    name: 'Marisol',
    background: '#e8f0fc',
    skin: '#c98a5e',
    skinShade: '#b1734a',
    hair: '#2b1b17',
    shirt: '#2564d0',
    accent: '#ffb400',
    style: 'curly',
    glasses: true,
  },
  andres: {
    name: 'Andrés',
    background: '#fff4d6',
    skin: '#e2b48c',
    skinShade: '#c99a72',
    hair: '#3a2618',
    shirt: '#1f2a5a',
    accent: '#cfe0ff',
    style: 'short',
    stubble: true,
  },
  camila: {
    name: 'Camila',
    background: '#e8f5e5',
    skin: '#d9a07a',
    skinShade: '#c0865f',
    hair: '#171223',
    shirt: '#13b38a',
    accent: '#17233b',
    style: 'long',
    headphones: true,
  },
};

const BROWS: Record<Mood, [string, string]> = {
  neutral: ['M45 47 Q50.5 45 56 47', 'M64 47 Q69.5 45 75 47'],
  happy: ['M45 45.5 Q50.5 42.5 56 45.5', 'M64 45.5 Q69.5 42.5 75 45.5'],
  excited: ['M45 44.5 Q50.5 41 56 44.5', 'M64 44.5 Q69.5 41 75 44.5'],
  concerned: ['M45 47.5 L56 44.8', 'M64 44.8 L75 47.5'],
  sad: ['M45 48 L56 45', 'M64 45 L75 48'],
  serious: ['M45 47.2 L56 47.2', 'M64 47.2 L75 47.2'],
  defensive: ['M45 45 L56 48.2', 'M64 48.2 L75 45'],
};

function Mouth({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'happy':
      return <path d="M51.5 64.5 Q60 74 68.5 64.5 Z" fill="#7a2530" stroke="#7a2530" strokeWidth="1.5" strokeLinejoin="round" />;
    case 'excited':
      return (
        <g>
          <path d="M50 63.5 Q60 77 70 63.5 Z" fill="#7a2530" stroke="#7a2530" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M53 64.5 L67 64.5 L66 66.5 L54 66.5 Z" fill="#fff" />
        </g>
      );
    case 'concerned':
      return <path d="M54 68.5 Q60 66 66 68.5" fill="none" stroke="#5c2a24" strokeWidth="2" strokeLinecap="round" />;
    case 'sad':
      return <path d="M53 69.5 Q60 64.5 67 69.5" fill="none" stroke="#5c2a24" strokeWidth="2" strokeLinecap="round" />;
    case 'serious':
      return <path d="M54 67.5 L66 67.5" fill="none" stroke="#5c2a24" strokeWidth="2" strokeLinecap="round" />;
    case 'defensive':
      return <path d="M55 68 Q60 66.8 65 68" fill="none" stroke="#5c2a24" strokeWidth="2.2" strokeLinecap="round" />;
    default:
      return <path d="M53 66 Q60 70.5 67 66" fill="none" stroke="#5c2a24" strokeWidth="2" strokeLinecap="round" />;
  }
}

function BackHair({ look }: { look: CharacterLook }) {
  if (look.style === 'curly') {
    return (
      <g fill={look.hair}>
        {[
          [36, 42, 14], [46, 30, 15], [60, 25, 16], [74, 30, 15], [84, 42, 14],
          [32, 56, 12], [88, 56, 12], [34, 70, 10], [86, 70, 10],
        ].map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />)}
      </g>
    );
  }
  if (look.style === 'long') {
    return <path d="M33 52 C33 25 87 25 87 52 L89 96 C80 101 40 101 31 96 Z" fill={look.hair} />;
  }
  return null;
}

function FrontHair({ look }: { look: CharacterLook }) {
  if (look.style === 'curly') {
    return (
      <g fill={look.hair}>
        {[[44, 34, 7], [52, 31, 7], [60, 30, 7.5], [68, 31, 7], [76, 34, 7]].map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
        ))}
      </g>
    );
  }
  if (look.style === 'long') {
    return <path d="M38 47 C39 32 51 27 61 29 C72 27 82 33 83 47 C75 40 67 38 59 42 C51 38 44 41 38 47 Z" fill={look.hair} />;
  }
  return <path d="M37.5 50 C37 31 49 24 61 24 C75 24 84 32 83.5 49 C79 40 71 36 61 37 C51 37 43 41 37.5 50 Z" fill={look.hair} />;
}

export function CharacterAvatar({
  characterId,
  mood = 'neutral',
  talking = false,
  size = 96,
  className = '',
  decorative = false,
}: {
  characterId: string;
  mood?: Mood;
  talking?: boolean;
  size?: number;
  className?: string;
  decorative?: boolean;
}) {
  const look = CHARACTER_LOOKS[characterId];
  const clipId = `avatar-clip-${useId()}`;

  if (!look) {
    return (
      <span
        className={`grid shrink-0 place-items-center rounded-full bg-accent-soft font-display font-bold text-accent ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        aria-hidden={decorative || undefined}
      >
        {characterId.charAt(0).toUpperCase()}
      </span>
    );
  }

  const [leftBrow, rightBrow] = BROWS[mood];
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : look.name}
      aria-hidden={decorative || undefined}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="60" cy="60" r="60" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="120" height="120" fill={look.background} />
        <g className={talking ? 'avatar-bob' : undefined}>
          <BackHair look={look} />
          <path d="M16 122 C20 94 39 85 60 85 C81 85 100 94 104 122 Z" fill={look.shirt} />
          {look.style === 'short' && <path d="M50 86 L60 98 L70 86 Z" fill={look.accent} />}
          <rect x="52" y="70" width="16" height="17" rx="6" fill={look.skinShade} />
          {look.headphones && (
            <path d="M40 90 C40 78 80 78 80 90" fill="none" stroke={look.accent} strokeWidth="5" strokeLinecap="round" />
          )}
          <ellipse cx="37.5" cy="57" rx="4" ry="5.5" fill={look.skinShade} />
          <ellipse cx="82.5" cy="57" rx="4" ry="5.5" fill={look.skinShade} />
          <ellipse cx="60" cy="54" rx="22.5" ry="25.5" fill={look.skin} />
          {look.stubble && <path d="M41 60 C44 76 52 80 60 80 C68 80 76 76 79 60 C74 70 67 73 60 73 C53 73 46 70 41 60 Z" fill={look.hair} opacity="0.18" />}
          <FrontHair look={look} />
          <circle cx="47.5" cy="62.5" r="3.6" fill="#ff7a7a" opacity="0.22" />
          <circle cx="72.5" cy="62.5" r="3.6" fill="#ff7a7a" opacity="0.22" />
          <g className="avatar-eyes">
            <ellipse cx="51" cy="55" rx="2.6" ry="3.3" fill="#17233b" />
            <ellipse cx="69" cy="55" rx="2.6" ry="3.3" fill="#17233b" />
            <circle cx="51.9" cy="53.8" r="0.9" fill="#fff" />
            <circle cx="69.9" cy="53.8" r="0.9" fill="#fff" />
          </g>
          <path d={leftBrow} fill="none" stroke={look.hair} strokeWidth="2.4" strokeLinecap="round" />
          <path d={rightBrow} fill="none" stroke={look.hair} strokeWidth="2.4" strokeLinecap="round" />
          {look.glasses && (
            <g fill="none" stroke="#17233b" strokeWidth="1.8">
              <circle cx="51" cy="55" r="6.5" />
              <circle cx="69" cy="55" r="6.5" />
              <path d="M57.5 55 Q60 53.5 62.5 55" />
            </g>
          )}
          {look.style === 'curly' && <circle cx="37" cy="64" r="1.8" fill={look.accent} />}
          {talking ? (
            <ellipse className="avatar-talk" cx="60" cy="67" rx="5" ry="3.6" fill="#7a2530" />
          ) : (
            <Mouth mood={mood} />
          )}
        </g>
      </g>
    </svg>
  );
}
