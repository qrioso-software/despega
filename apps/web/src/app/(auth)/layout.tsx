import { MessagesSquare, Radar, Timer } from 'lucide-react';
import type { ReactNode } from 'react';
import { CharacterAvatar } from '@/components/characters/character-avatar';
import { BrandLink } from '@/components/site/brand';

const HIGHLIGHTS = [
  { icon: MessagesSquare, title: 'Conversa con tu equipo', text: 'Chats y videollamadas con personajes que reaccionan a lo que decides.' },
  { icon: Timer, title: 'Decide con el reloj corriendo', text: 'Algunas decisiones tienen segundos. El juego nunca se detiene.' },
  { icon: Radar, title: 'Descubre cómo decides', text: 'Tu desempeño y un perfil de afinidad en 5 ejes, por carrera.' },
] as const;

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden bg-night text-white lg:block">
        <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-accent/35 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-40 -left-24 size-96 rounded-full bg-brand/20 blur-3xl" aria-hidden />

        <div className="relative flex h-full min-h-dvh flex-col px-10 py-10 xl:px-16">
          <BrandLink light height={28} />

          <div className="my-auto max-w-xl py-12">
            <div className="flex items-end gap-3">
              <CharacterAvatar characterId="andres" mood="serious" size={64} decorative />
              <CharacterAvatar characterId="marisol" mood="happy" talking size={88} className="animate-float" decorative />
              <CharacterAvatar characterId="camila" mood="neutral" size={64} decorative />
            </div>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-sun">Ingeniería de Software · PixelForge</p>
            <h2 className="mt-3 max-w-lg text-4xl font-bold leading-[1.1] xl:text-[2.75rem]">Tu primer día empieza con la app caída. ¿Qué haces?</h2>
            <p className="mt-4 max-w-md text-white/65">
              Marisol, Andrés y Camila te esperan. Cada decisión cambia lo que pasa después y construye tu perfil.
            </p>

            <ul className="mt-10 grid max-w-md gap-5">
              {HIGHLIGHTS.map((item) => (
                <li key={item.title} className="flex items-start gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-sun">
                    <item.icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-0.5 text-sm text-white/55">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/45">PixelForge y sus personajes son ficticios.</p>
        </div>
      </aside>

      <main className="flex min-h-dvh flex-col px-4 py-6 sm:px-8 lg:py-10">
        <div className="flex justify-center lg:hidden">
          <BrandLink height={26} />
        </div>
        <div className="m-auto w-full max-w-[28rem] py-8">{children}</div>
        <p className="text-center text-xs text-muted">Solo guardamos lo necesario para mostrarte tus resultados.</p>
      </main>
    </div>
  );
}
