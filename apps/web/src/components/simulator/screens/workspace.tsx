'use client';

import { Archive, Inbox, Paperclip, Send, Star, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { CharacterAvatar } from '@/components/characters/character-avatar';
import { ChatLine, SkipButton, TypingIndicator, speakerName } from '../conversation';
import { OfficeWindow } from '../office-window';
import type { ScreenProps } from './types';

function Thread({ scene, module, reveal }: Pick<ScreenProps, 'scene' | 'module' | 'reveal'>) {
  if (reveal.visibleLines.length === 0 && !reveal.nextLine) return null;
  const lastIndex = reveal.visibleLines.length - 1;
  return (
    <div className="grid gap-3" aria-live="polite">
      {reveal.visibleLines.map((line, index) => (
        <ChatLine key={`${scene.id}-${index}`} line={line} module={module} talking={!reveal.done && index === lastIndex} />
      ))}
      {reveal.nextLine && <TypingIndicator speaker={reveal.nextLine.speaker} module={module} />}
      {!reveal.done && (
        <div className="flex justify-end">
          <SkipButton onSkip={reveal.skip} />
        </div>
      )}
    </div>
  );
}

function Reveal({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {children}
    </motion.div>
  );
}

/** Chat directo tipo mensajería de equipo (Marisol, Camila…). */
export function ChatScreen({ scene, module, reveal, interaction }: ScreenProps) {
  const participants = scene.participants;
  return (
    <OfficeWindow app="chat" subtitle={`Chat con ${participants.map((id) => speakerName(module, id)).join(', ')}`} clock={scene.clock}>
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <div className="flex -space-x-3">
          {participants.map((id) => (
            <CharacterAvatar key={id} characterId={id} size={40} className="rounded-full ring-2 ring-white" decorative />
          ))}
        </div>
        <div>
          <p className="font-bold text-ink">{participants.map((id) => speakerName(module, id)).join(', ')}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted"><span className="size-2 rounded-full bg-good" aria-hidden /> En línea</p>
        </div>
      </div>
      <div className="min-h-48 bg-surface p-4 sm:p-5">
        <Thread scene={scene} module={module} reveal={reveal} />
      </div>
      <div className="border-t border-line bg-paper p-4 sm:p-5">
        <Reveal show={reveal.done}>{interaction}</Reveal>
        {!reveal.done && <p className="text-sm text-muted">Esperando mensajes…</p>}
      </div>
    </OfficeWindow>
  );
}

/** Bandeja de entrada: reportes de soporte (1.3) o el correo de Andrés (1.5). */
export function InboxScreen({ scene, module, reveal, interaction }: ScreenProps) {
  const email = scene.email;
  const unread = scene.interaction.kind === 'classification' ? scene.interaction.items.length : 1;
  return (
    <OfficeWindow app="mail" subtitle="Bandeja de entrada" clock={scene.clock}>
      <div className="grid md:grid-cols-[190px_1fr]">
        <aside className="hidden border-r border-line bg-paper p-3 md:block" aria-label="Carpetas">
          <ul className="grid gap-1 text-sm">
            {[
              { icon: Inbox, label: 'Bandeja de entrada', count: unread, active: true },
              { icon: Star, label: 'Destacados' },
              { icon: Users, label: 'Soporte' },
              { icon: Send, label: 'Enviados' },
              { icon: Archive, label: 'Archivo' },
            ].map((folder) => (
              <li key={folder.label} className={`flex items-center gap-2 rounded-xl px-3 py-2 ${folder.active ? 'bg-brand-soft font-bold text-brand-strong' : 'text-ink-soft'}`}>
                <folder.icon className="size-4" aria-hidden />
                <span className="flex-1">{folder.label}</span>
                {folder.count ? <span className="rounded-full bg-brand px-2 text-xs font-bold text-white">{folder.count}</span> : null}
              </li>
            ))}
          </ul>
        </aside>
        <div className="grid gap-4 p-4 sm:p-5">
          <Thread scene={scene} module={module} reveal={reveal} />
          {email && (
            <article className="rounded-2xl border border-line bg-white p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <CharacterAvatar characterId={email.from} mood="serious" size={44} decorative />
                <div className="min-w-0">
                  <p className="font-bold text-ink">{speakerName(module, email.from)} <span className="font-normal text-muted">· {module.characters[email.from]?.role}</span></p>
                  <p className="text-xs text-muted">Para: ti · {scene.clock}</p>
                </div>
                <Paperclip className="ml-auto size-4 text-muted" aria-hidden />
              </div>
              <h3 className="mt-4 text-xl font-bold">{email.subject}</h3>
              <p className="mt-2 whitespace-pre-line text-ink-soft">{email.body}</p>
              {email.signature && <p className="mt-4 text-sm text-muted">— {email.signature}</p>}
            </article>
          )}
          <Reveal show={reveal.done}>{interaction}</Reveal>
        </div>
      </div>
    </OfficeWindow>
  );
}

/** Tablero de tareas simplificado: revisión de código, priorización y emparejamiento. */
export function TaskBoardScreen({ scene, module, reveal, interaction }: ScreenProps) {
  return (
    <OfficeWindow app="board" subtitle="Tablero del equipo" clock={scene.clock}>
      <div className="flex items-center justify-between gap-3 border-b border-line bg-good-soft/40 px-4 py-2.5">
        <p className="text-sm font-bold text-[#0b6e51]">Equipo {module.company}</p>
        <div className="flex -space-x-2">
          {Object.keys(module.characters).map((id) => (
            <CharacterAvatar key={id} characterId={id} size={30} className="rounded-full ring-2 ring-white" decorative />
          ))}
        </div>
      </div>
      <div className="grid gap-5 p-4 sm:p-5">
        <Thread scene={scene} module={module} reveal={reveal} />
        <Reveal show={reveal.done}>{interaction}</Reveal>
      </div>
    </OfficeWindow>
  );
}

/** Dashboard en vivo: la presión la ponen las reacciones de los usuarios. */
export function DashboardScreen({ scene, module, reveal, interaction }: ScreenProps) {
  return (
    <OfficeWindow app="pulse" subtitle="Reacciones de usuarios en vivo" clock={scene.clock}>
      <div className="grid gap-5 p-4 sm:p-5">
        <Thread scene={scene} module={module} reveal={reveal} />
        {interaction}
      </div>
    </OfficeWindow>
  );
}
