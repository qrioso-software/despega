import { CAREERS, MODULES } from '@despega/simulator';
import { Card, Chip } from '@heroui/react';
import { ArrowRight, Clock3 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CareerIcon } from '@/components/career-icon';
import { PageHeader, SectionHeader } from '@/components/ui';
import { sceneCount } from '@/lib/script';

export const metadata: Metadata = { title: 'Módulos' };

export default function ModulesPage() {
  const playable = CAREERS.filter((career) => MODULES[career.id]);
  const upcoming = CAREERS.filter((career) => !MODULES[career.id]);

  return (
    <>
      <PageHeader
        title="Módulos"
        description="Cada carrera usa la misma mecánica con su propio escenario. El guion jugable vive en el paquete @despega/simulator."
      />

      <div className="grid gap-8">
        <section className="grid gap-3" aria-labelledby="jugables">
          <SectionHeader id="jugables" title="Jugables" description="Abre un módulo para revisar su guion, sus consecuencias y sus puntajes." />
          <div className="grid gap-4 lg:grid-cols-2">
            {playable.map((career) => {
              const careerModule = MODULES[career.id]!;
              const minutes = careerModule.sessions.reduce((total, session) => total + session.estimatedMinutes, 0);
              return (
                <Link key={career.id} href={`/modulos/${career.id}`} className="group rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
                  <Card className="h-full transition-colors group-hover:border-line-strong">
                    <Card.Header className="flex-row items-start gap-4">
                      <CareerIcon careerId={career.id} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Card.Title className="text-lg">{career.name}</Card.Title>
                          <Chip size="sm" variant="soft" color="success"><Chip.Label>Jugable</Chip.Label></Chip>
                          <Chip size="sm" variant="soft"><Chip.Label>Versión {careerModule.version}</Chip.Label></Chip>
                        </div>
                        <Card.Description>{careerModule.tagline} · {career.area}</Card.Description>
                      </div>
                    </Card.Header>
                    <Card.Content>
                      <p className="text-sm text-muted-ink">{career.description}</p>
                    </Card.Content>
                    <Card.Footer className="flex-wrap justify-between gap-3 border-t border-line pt-4">
                      <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                        <Fact label="Sesiones" value={careerModule.sessions.length} />
                        <Fact label="Escenas" value={sceneCount(careerModule)} />
                        <div className="flex items-center gap-1.5 text-muted-ink">
                          <dt className="sr-only">Duración</dt>
                          <Clock3 className="size-4" aria-hidden />
                          <dd>~{minutes} min</dd>
                        </div>
                      </dl>
                      <span className="flex items-center gap-1 text-sm font-semibold text-accent">
                        Ver guion y puntajes <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </Card.Footer>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {upcoming.length > 0 && (
          <section className="grid gap-3" aria-labelledby="proximamente">
            <SectionHeader id="proximamente" title="Próximamente" description={`${upcoming.length} carreras con la misma mecánica, aún sin guion.`} />
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {upcoming.map((career) => (
                <li key={career.id} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4">
                  <CareerIcon careerId={career.id} tone="muted" size="sm" />
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{career.name}</p>
                    <p className="text-xs text-muted-ink">{career.area}</p>
                    <p className="mt-1.5 text-sm text-muted-ink">{career.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-row-reverse items-baseline justify-end gap-1.5">
      <dt className="text-muted-ink">{label.toLowerCase()}</dt>
      <dd className="font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  );
}
