import { CAREERS, MODULES } from '@despega/simulator';
import { Card, Chip } from '@heroui/react';
import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';

export const metadata: Metadata = { title: 'Módulos' };

export default function ModulesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Módulos"
        title="Carreras y módulos"
        description="Cada carrera usa la misma mecánica con su propio escenario. El guión jugable vive en el paquete @despega/simulator."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CAREERS.map((career) => {
          const careerModule = MODULES[career.id];
          const scenes = careerModule?.sessions.reduce((total, session) => total + session.scenes.length, 0) ?? 0;
          return (
            <Card key={career.id} variant={careerModule ? 'default' : 'secondary'}>
              <Card.Header className="flex-row items-start justify-between gap-3">
                <div>
                  <span className="text-3xl" aria-hidden>{career.emoji}</span>
                  <Card.Title className="mt-2 text-lg">{career.name}</Card.Title>
                  <Card.Description>{career.area}</Card.Description>
                </div>
                <Chip size="sm" variant="soft" color={careerModule ? 'success' : 'default'}>
                  <Chip.Label>{careerModule ? 'Jugable' : 'Próximamente'}</Chip.Label>
                </Chip>
              </Card.Header>
              <Card.Content>
                <p className="text-sm text-muted-ink">{career.description}</p>
                {careerModule && (
                  <p className="mt-3 text-sm text-ink">
                    <strong>{careerModule.tagline}</strong> · {careerModule.sessions.length} sesiones · {scenes} escenas · versión {careerModule.version}
                  </p>
                )}
              </Card.Content>
              {careerModule && (
                <Card.Footer>
                  <Link href={`/modulos/${career.id}`} className="flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
                    Ver guión y puntajes <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Card.Footer>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
