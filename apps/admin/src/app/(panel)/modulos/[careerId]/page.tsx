import { AFFINITY_LABELS, findModule, type Scene } from '@despega/simulator';
import { Accordion, Card, Chip } from '@heroui/react';
import { ArrowLeft, Clock3 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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

  return (
    <>
      <Link href="/modulos" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-ink hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Módulos
      </Link>
      <PageHeader
        eyebrow={`${careerModule.title} · versión ${careerModule.version}`}
        title={careerModule.tagline}
        description={`${careerModule.sessions.length} sesiones · ${sceneCount(careerModule)} escenas · desempeño inicial ${careerModule.initialPerformance}. Este es el guión que ejecuta el motor: cualquier cambio de puntaje se hace en el paquete del simulador y se refleja aquí.`}
      />

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {Object.values(careerModule.characters).map((character) => (
          <Card key={character.id} variant="secondary">
            <Card.Header>
              <Card.Title>{character.name}</Card.Title>
              <Card.Description>{character.role}</Card.Description>
            </Card.Header>
            <Card.Content>
              <p className="text-sm text-muted-ink">{character.bio}</p>
            </Card.Content>
          </Card>
        ))}
      </div>

      <div className="grid gap-8">
        {careerModule.sessions.map((session) => (
          <section key={session.id} aria-labelledby={`session-${session.id}`}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id={`session-${session.id}`} className="text-2xl font-bold text-ink">Sesión {session.number}: {session.title}</h2>
              <span className="flex items-center gap-1.5 text-sm text-muted-ink"><Clock3 className="size-4" aria-hidden /> ~{session.estimatedMinutes} min</span>
            </div>
            <p className="mb-4 text-muted-ink">{session.synopsis}</p>
            <Card>
              <Card.Content className="p-0">
                <Accordion allowsMultipleExpanded>
                  {session.scenes.map((scene) => (
                    <Accordion.Item key={scene.id} id={scene.id}>
                      <Accordion.Heading>
                        <Accordion.Trigger className="px-5">
                          <span className="flex flex-1 flex-wrap items-center gap-2 text-left">
                            <span className="font-display text-base font-bold text-ink">{scene.id} · {scene.title}</span>
                            <Chip size="sm" variant="soft"><Chip.Label>{SCREEN_LABELS[scene.screen]}</Chip.Label></Chip>
                            <Chip size="sm" color="accent" variant="soft"><Chip.Label>{interactionLabel(scene.interaction)}</Chip.Label></Chip>
                          </span>
                          <Accordion.Indicator />
                        </Accordion.Trigger>
                      </Accordion.Heading>
                      <Accordion.Panel>
                        <Accordion.Body className="px-5 pb-6">
                          <SceneDetail scene={scene} names={Object.fromEntries(Object.values(careerModule.characters).map((character) => [character.id, character.name]))} />
                        </Accordion.Body>
                      </Accordion.Panel>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </Card.Content>
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
          <p className="text-xs font-bold uppercase tracking-wider text-muted-ink">Guión</p>
          {scene.notification && (
            <p className="rounded-xl bg-surface-secondary px-3 py-2"><strong>Notificación · {scene.notification.app}:</strong> {textVariants(scene.notification.body)[0]?.text}</p>
          )}
          {scene.lines?.map((line, index) => (
            <div key={index} className="rounded-xl bg-surface-secondary px-3 py-2">
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
            <div className="rounded-xl bg-surface-secondary px-3 py-2">
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
          <p className="text-xs font-bold uppercase tracking-wider text-muted-ink">Banco de frases</p>
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
          <p className="text-xs font-bold uppercase tracking-wider text-muted-ink">Consecuencias (en orden de evaluación)</p>
          <div className="overflow-x-auto rounded-xl border border-line">
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
          <p className="text-xs font-bold uppercase tracking-wider text-muted-ink">Caminos y ejes que los alinean</p>
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
