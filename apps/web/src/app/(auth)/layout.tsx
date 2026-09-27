import type { ReactNode } from 'react';
import { CharacterAvatar } from '@/components/characters/character-avatar';
import { BrandLink } from '@/components/site/brand';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-night p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-accent/40 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-brand/30 blur-3xl" aria-hidden />
        <BrandLink light />
        <div className="relative">
          <p className="eyebrow text-sun">Ingeniería de Software · PixelForge</p>
          <h2 className="mt-4 max-w-md text-4xl font-bold leading-tight">
            Tu primer día empieza con la app caída. ¿Qué haces?
          </h2>
          <p className="mt-4 max-w-md text-white/70">
            Marisol, Andrés y Camila te esperan. Cada decisión cambia lo que pasa después y construye tu perfil.
          </p>
          <div className="mt-10 flex items-end gap-4">
            <CharacterAvatar characterId="andres" mood="serious" size={84} />
            <CharacterAvatar characterId="marisol" mood="happy" talking size={120} className="animate-float" />
            <CharacterAvatar characterId="camila" mood="neutral" size={84} />
          </div>
        </div>
        <p className="relative text-xs text-white/50">PixelForge y sus personajes son ficticios.</p>
      </aside>
      <main className="flex flex-col px-4 py-8 sm:px-10">
        <div className="lg:hidden">
          <BrandLink />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
