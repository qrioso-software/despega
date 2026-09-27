'use client';

import { AlertDialog, Button } from '@heroui/react';
import { RotateCcw } from 'lucide-react';
import { useState, useTransition } from 'react';
import { restartCareerAction } from '@/app/(panel)/estudiantes/[studentId]/actions';

export function RestartCareerButton({ studentId, careerId, studentName }: { studentId: string; careerId: string; studentName: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function restart() {
    setError(null);
    startTransition(async () => {
      const result = await restartCareerAction({ studentId, careerId });
      if (result.ok) setOpen(false);
      else setError(result.message);
    });
  }

  return (
    <>
      <Button variant="danger-soft" size="sm" onPress={() => setOpen(true)}>
        <RotateCcw className="size-4" aria-hidden /> Reiniciar intento
      </Button>
      <AlertDialog.Backdrop isOpen={open} onOpenChange={(value) => !pending && setOpen(value)} isDismissable={!pending}>
        <AlertDialog.Container placement="center">
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>¿Reiniciar la simulación de {studentName}?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body className="grid gap-3 text-sm text-muted-ink">
              <p>
                Empezará de nuevo en la sesión 1 con 50 puntos y un perfil vacío. El intento actual y todas sus decisiones quedan
                guardados como historial.
              </p>
              <p>Úsalo para pruebas o demostraciones: los estudiantes no repiten sesiones por su cuenta.</p>
              {error && <p role="alert" className="font-semibold text-danger">{error}</p>}
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant="tertiary" onPress={() => setOpen(false)} isDisabled={pending}>Cancelar</Button>
              <Button variant="danger" onPress={restart} isPending={pending}>Reiniciar intento</Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </>
  );
}
