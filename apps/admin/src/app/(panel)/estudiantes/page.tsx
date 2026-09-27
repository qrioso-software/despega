import { getCareerProgressMany, listStudents, type StudentProfile } from '@despega/data';
import { findModule } from '@despega/simulator';
import { Button, SearchField } from '@heroui/react';
import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { StudentsTable } from '@/components/tables';
import { DataUnavailable, PageHeader } from '@/components/ui';
import { dataConfig } from '@/lib/data';
import { fullName, studentRow } from '@/lib/students';

export const metadata: Metadata = { title: 'Estudiantes' };

const PAGE_SIZE = 50;
const SEARCH_CEILING = 500;

export default async function StudentsPage({ searchParams }: PageProps<'/estudiantes'>) {
  const params = await searchParams;
  const query = first(params.q)?.trim().toLowerCase() ?? '';
  const cursor = first(params.cursor);
  const pilot = findModule('ingenieria-software')!;

  let profiles: StudentProfile[] = [];
  let nextCursor: string | undefined;
  let failed = false;
  try {
    if (query) {
      // La búsqueda recorre el índice por fecha hasta un tope; a escala se reemplaza por
      // un índice de búsqueda dedicado (ver docs/architecture/data-model.md).
      let pageCursor: string | undefined;
      do {
        const page = await listStudents(dataConfig(), { limit: 200, cursor: pageCursor });
        profiles.push(...page.items);
        pageCursor = page.nextCursor;
      } while (pageCursor && profiles.length < SEARCH_CEILING);
      profiles = profiles.filter((profile) =>
        [fullName(profile), profile.email, profile.school ?? '', profile.grade ?? ''].some((value) => value.toLowerCase().includes(query)),
      );
    } else {
      const page = await listStudents(dataConfig(), { limit: PAGE_SIZE, cursor });
      profiles = page.items;
      nextCursor = page.nextCursor;
    }
  } catch (error) {
    console.error('No se pudo listar estudiantes.', error);
    failed = true;
  }

  let rows: ReturnType<typeof studentRow>[] = [];
  if (!failed) {
    try {
      const progress = await getCareerProgressMany(dataConfig(), profiles.map((profile) => profile.studentId), pilot.careerId);
      rows = profiles.map((profile) => studentRow(pilot, profile, progress.get(profile.studentId)));
    } catch (error) {
      console.error('No se pudo leer el progreso de los estudiantes.', error);
      failed = true;
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Estudiantes"
        title="Estudiantes registrados"
        description="Progreso en la carrera piloto. Abre un estudiante para ver su perfil, sus sesiones y cada decisión."
      />
      <form method="get" className="mb-6 flex flex-wrap items-end gap-3" role="search">
        <SearchField name="q" defaultValue={query} aria-label="Buscar estudiantes" className="w-full max-w-md">
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Nombre, correo, curso o colegio" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <Button type="submit" variant="secondary">Buscar</Button>
        {query && <Link href="/estudiantes" className="text-sm font-semibold text-accent hover:underline">Limpiar búsqueda</Link>}
      </form>

      {failed ? (
        <DataUnavailable what="los estudiantes" />
      ) : (
        <div className="grid gap-4">
          <StudentsTable
            rows={rows}
            label="Estudiantes"
            empty={query ? `Ningún estudiante coincide con «${query}».` : 'Todavía no hay estudiantes registrados.'}
          />
          {nextCursor && (
            <div className="flex justify-end">
              <Link href={`/estudiantes?cursor=${encodeURIComponent(nextCursor)}`} className="flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
                Siguientes {PAGE_SIZE} <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
