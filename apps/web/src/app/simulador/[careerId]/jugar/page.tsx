import { ensureCareerProgress } from '@despega/data';
import { getPublicScene } from '@despega/simulator';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { SimulatorPlayer } from '@/components/simulator/player';
import { requireStudent } from '@/lib/auth';
import { dataConfig } from '@/lib/data';
import { playableModule, toModuleView, toProgressView } from '@/lib/simulation';

export async function generateMetadata({ params }: PageProps<'/simulador/[careerId]/jugar'>): Promise<Metadata> {
  const { careerId } = await params;
  const careerModule = playableModule(careerId);
  return { title: careerModule ? `Jugando · ${careerModule.tagline}` : 'Simulador' };
}

export default async function PlayPage({ params }: PageProps<'/simulador/[careerId]/jugar'>) {
  const { careerId } = await params;
  const careerModule = playableModule(careerId);
  if (!careerModule) notFound();
  const student = await requireStudent(`/simulador/${careerId}/jugar`);

  const record = await ensureCareerProgress(dataConfig(), {
    studentId: student.studentId,
    careerId,
    playerName: student.givenName,
    now: new Date().toISOString(),
  });
  if (record.status === 'completed') redirect(`/simulador/${careerId}`);

  return (
    <SimulatorPlayer
      module={toModuleView(careerModule)}
      playerName={record.state.playerName}
      initialScene={getPublicScene(careerModule, record.state)}
      initialProgress={toProgressView(careerModule, record)}
    />
  );
}
