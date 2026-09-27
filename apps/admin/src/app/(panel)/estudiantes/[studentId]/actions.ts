'use server';

import { DataError, getStudent, restartCareer } from '@despega/data';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireStaff } from '@/lib/auth';
import { dataConfig } from '@/lib/data';
import { canManageProgress } from '@/lib/staff';

const identifier = z.string().regex(/^[A-Za-z0-9_.:@+-]{1,128}$/);
const restartSchema = z.object({ studentId: identifier, careerId: identifier });

export type RestartResult = { ok: true } | { ok: false; message: string };

/** Reinicio administrativo de un intento (pruebas y demostraciones). El historial se conserva. */
export async function restartCareerAction(input: unknown): Promise<RestartResult> {
  const staff = await requireStaff();
  if (!canManageProgress(staff.groups)) return { ok: false, message: 'Solo el rol de administración puede reiniciar intentos.' };
  const parsed = restartSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Solicitud inválida.' };

  try {
    const profile = await getStudent(dataConfig(), parsed.data.studentId);
    if (!profile) return { ok: false, message: 'El estudiante no existe.' };
    await restartCareer(dataConfig(), {
      studentId: parsed.data.studentId,
      careerId: parsed.data.careerId,
      playerName: profile.givenName,
      now: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof DataError) return { ok: false, message: error.message };
    console.error('No se pudo reiniciar el intento.', error);
    return { ok: false, message: 'No pudimos reiniciar el intento. Intenta de nuevo.' };
  }
  revalidatePath(`/estudiantes/${parsed.data.studentId}`);
  return { ok: true };
}
