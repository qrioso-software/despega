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
        title="Estudiantes"
        description="Progreso en la carrera piloto. Abre un estudiante para ver su perfil, sus sesiones y cada decisión."
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <form method="get" className="flex w-full items-center gap-2 sm:w-auto" role="search">
          <SearchField name="q" defaultValue={query} aria-label="Buscar estudiantes" className="min-w-0 flex-1 sm:w-80 sm:flex-none">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Nombre, correo o colegio" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <Button type="submit" variant="secondary">Buscar</Button>
        </form>
        {!failed && (
          <p className="text-sm text-muted-ink" aria-live="polite">
            {query ? (
              <>
                {rows.length === 1 ? '1 resultado' : `${rows.length} resultados`} para «{query}» ·{' '}
                <Link href="/estudiantes" className="font-semibold text-accent hover:underline">Limpiar</Link>
              </>
            ) : (
              `${rows.length === 1 ? '1 estudiante' : `${rows.length} estudiantes`}${cursor || nextCursor ? ' en esta página' : ''}`
            )}
          </p>
        )}
      </div>

      {failed ? (
        <DataUnavailable what="los estudiantes" />
      ) : (
        <div className="grid gap-4">
          <StudentsTable
            rows={rows}
            label="Estudiantes"
            empty={query ? `Ningún estudiante coincide con «${query}».` : 'Todavía no hay estudiantes registrados.'}
          />
          {(cursor || nextCursor) && (
            <div className="flex items-center justify-between gap-3">
              {cursor ? (
                <Link href="/estudiantes" className="text-sm font-semibold text-accent hover:underline">Volver al inicio</Link>
              ) : (
                <span />
              )}
              {nextCursor && (
                <Link href={`/estudiantes?cursor=${encodeURIComponent(nextCursor)}`} className="flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
                  Siguientes {PAGE_SIZE} <ArrowRight className="size-4" aria-hidden />
                </Link>
              )}
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
