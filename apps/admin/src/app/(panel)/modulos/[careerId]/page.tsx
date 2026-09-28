import { AFFINITY_LABELS, findModule, type Scene } from '@despega/simulator';
import { Accordion, Card, Chip } from '@heroui/react';
import { Clock3, Info } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CareerIcon } from '@/components/career-icon';
import { Initials } from '@/components/initials';
import { PageHeader } from '@/components/ui';
import { SCREEN_LABELS, deltaText, describeCondition, interactionLabel, outcomeLines, sceneCount, textVariants } from '@/lib/script';

export async function generateMetadata({ params }: PageProps<'/modulos/[careerId]'>): Promise<Metadata> {
  const { careerId } = await params;
  return { title: findModule(careerId)?.title ?? 'Módulo' };
}

export default async function ModuleScriptPage({ params }: PageProps<'/modulos/[careerId]'>) {
  const { careerId } = await params;
  const careerModule = findModule(careerId);
  if (!careerModule) notFound();
  const names = Object.fromEntries(Object.values(careerModule.characters).map((character) => [character.id, character.name]));

  return (
    <>
      <PageHeader
        leading={<CareerIcon careerId={careerModule.careerId} />}
        eyebrow={`${careerModule.title} · versión ${careerModule.version}`}
        title={careerModule.tagline}
        description={`${careerModule.sessions.length} sesiones · ${sceneCount(careerModule)} escenas · desempeño inicial ${careerModule.initialPerformance}`}
      />

      <div className="grid gap-8">
        <p className="flex items-start gap-2.5 rounded-xl border border-accent/20 bg-accent-soft px-4 py-3 text-sm text-accent-soft-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          Este es el guion que ejecuta el motor. Cualquier cambio de texto o de puntaje se hace en el paquete del simulador y se refleja aquí.
        </p>

        <section className="grid gap-3" aria-labelledby="equipo">
          <h2 id="equipo" className="text-lg font-bold text-ink">Personajes</h2>
          <ul className="grid gap-3 md:grid-cols-3">
            {Object.values(careerModule.characters).map((character) => (
              <li key={character.id} className="flex gap-3 rounded-xl border border-line bg-surface p-4">
                <Initials name={character.name} tone="soft" />
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{character.name}</p>
                  <p className="text-xs font-medium text-muted-ink">{character.role}</p>
                  <p className="mt-2 text-sm text-muted-ink">{character.bio}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <nav aria-label="Sesiones del módulo" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ol className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
            {careerModule.sessions.map((session) => (
              <li key={session.id}>
                <a
                  href={`#session-${session.id}`}
                  className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:border-line-strong hover:bg-surface-secondary"
                >
                  <span className="grid size-5 place-items-center rounded-md bg-accent-soft text-xs font-bold text-accent-soft-foreground">{session.number}</span>
                  {session.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {careerModule.sessions.map((session) => (
          <section key={session.id} className="grid scroll-mt-24 gap-3" id={`session-${session.id}`} aria-labelledby={`session-title-${session.id}`}>
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
              <div className="min-w-0">
                <p className="label-caps">Sesión {session.number}</p>
                <h2 id={`session-title-${session.id}`} className="text-xl font-bold text-ink">{session.title}</h2>
                <p className="mt-0.5 text-sm text-muted-ink">{session.synopsis}</p>
              </div>
              <span className="flex items-center gap-1.5 text-sm text-muted-ink">
                <Clock3 className="size-4" aria-hidden /> ~{session.estimatedMinutes} min · {session.scenes.length} escenas
              </span>
            </div>
            <Card className="overflow-hidden p-0">
              <Accordion allowsMultipleExpanded>
                {session.scenes.map((scene) => (
                  <Accordion.Item key={scene.id} id={scene.id}>
                    <Accordion.Heading>
                      <Accordion.Trigger className="gap-3 px-4 py-3.5 sm:px-5">
                        <span className="grid h-6 min-w-9 shrink-0 place-items-center self-start rounded-md bg-surface-secondary px-1.5 text-xs font-bold tabular-nums text-ink-soft sm:self-center">
                          {scene.id}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col items-start gap-1.5 text-left sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                          <span className="font-display text-[0.9375rem] font-bold text-ink">{scene.title}</span>
                          <span className="flex flex-wrap gap-1.5">
                            <Chip size="sm" variant="soft"><Chip.Label>{SCREEN_LABELS[scene.screen]}</Chip.Label></Chip>
                            <Chip size="sm" color="accent" variant="soft"><Chip.Label>{interactionLabel(scene.interaction)}</Chip.Label></Chip>
                          </span>
                        </span>
                        <Accordion.Indicator />
                      </Accordion.Trigger>
                    </Accordion.Heading>
                    <Accordion.Panel>
                      <Accordion.Body className="px-4 pb-6 sm:px-5">
                        <SceneDetail scene={scene} names={names} />
                      </Accordion.Body>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Card>
          </section>
        ))}
      </div>
    </>
  );
}

function SceneDetail({ scene, names }: { scene: Scene; names: Record<string, string> }) {
  const outcomes = outcomeLines(scene);
  return (
    <div className="grid gap-5 text-sm">
      {scene.clock && <p className="text-muted-ink">Hora en la historia: <strong className="text-ink">{scene.clock}</strong></p>}
      {(scene.lines?.length || scene.notification || scene.email) && (
        <div className="grid gap-2">
          <p className="label-caps">Guion</p>
          {scene.notification && (
            <p className="rounded-lg bg-surface-secondary px-3 py-2"><strong>Notificación · {scene.notification.app}:</strong> {textVariants(scene.notification.body)[0]?.text}</p>
          )}
          {scene.lines?.map((line, index) => (
            <div key={index} className="rounded-lg bg-surface-secondary px-3 py-2">
              <p className="font-semibold text-ink">
                {line.speaker === 'narrator' ? 'Narración' : (names[line.speaker] ?? line.speaker)}
                {line.when && <span className="ml-2 font-normal text-muted-ink">(solo si {describeCondition(line.when)})</span>}
              </p>
              {textVariants(line.text).map((variant, variantIndex) => (
                <p key={variantIndex} className="text-muted-ink">
                  {variant.condition && <span className="mr-1 font-semibold text-accent">[{variant.condition}]</span>}
                  {variant.text}
                </p>
              ))}
            </div>
          ))}
          {scene.email && (
            <div className="rounded-lg bg-surface-secondary px-3 py-2">
              <p className="font-semibold text-ink">Correo de {names[scene.email.from] ?? scene.email.from}: «{scene.email.subject}»</p>
              {textVariants(scene.email.body).map((variant, index) => (
                <p key={index} className="text-muted-ink">
                  {variant.condition && <span className="mr-1 font-semibold text-accent">[{variant.condition}]</span>}
                  {variant.text}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {scene.interaction.kind === 'message-builder' && (
        <div className="grid gap-2">
          <p className="label-caps">Banco de frases</p>
          <ul className="grid gap-1.5">
            {scene.interaction.blocks.map((block) => (
              <li key={block.id} className="flex flex-wrap items-start gap-2">
                <Chip size="sm" variant="soft" color={block.tags.some((tag) => ['professional', 'positive', 'proposal'].includes(tag)) ? 'success' : 'warning'}>
                  <Chip.Label>{block.tags.join(', ')}</Chip.Label>
                </Chip>
                <span className="text-ink">{block.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {outcomes.length > 0 && (
        <div className="grid gap-2">
          <p className="label-caps">Consecuencias (en orden de evaluación)</p>
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="data-table min-w-[720px]">
              <thead>
                <tr>
                  <th scope="col">Si el estudiante…</th>
                  <th scope="col">Resultado</th>
                  <th scope="col">Puntaje</th>
                  <th scope="col">Memoria</th>
                </tr>
              </thead>
              <tbody>
                {outcomes.map((line, index) => (
                  <tr key={index}>
                    <td className="max-w-72">{line.trigger}{line.extra && <span className="mt-1 block text-xs text-muted-ink">{line.extra}</span>}</td>
                    <td>
                      <span className="block font-semibold text-ink">{line.outcome.label}</span>
                      {line.outcome.reactions?.[0] && <span className="mt-1 block text-xs text-muted-ink">«{textVariants(line.outcome.reactions[0].text)[0]?.text}»</span>}
                    </td>
                    <td className="whitespace-nowrap">{deltaText(line.outcome.performance, line.outcome.affinity)}</td>
                    <td className="text-xs text-muted-ink">
                      {Object.entries(line.outcome.flags ?? {}).map(([flag, value]) => `${flag} = ${String(value)}`).join(', ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {scene.interaction.kind === 'timeline' && (
        <div className="grid gap-2">
          <p className="label-caps">Caminos y ejes que los alinean</p>
          <ul className="grid gap-1.5">
            {scene.interaction.branches.map((branch) => (
              <li key={branch.id}>
                <strong className="text-ink">{branch.title}</strong> ({branch.path}) — promedio de {branch.axes.map((axis) => AFFINITY_LABELS[axis].toLowerCase()).join(' y ')}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
