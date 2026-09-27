'use client';

import { Alert, Button, Input, Label, TextField, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { KeyRound, LogIn } from 'lucide-react';
import { useActionState, useState } from 'react';
import { staffNewPasswordAction, staffSignInAction, type LoginState } from '@/app/login/actions';
import { STAFF_ROLE_LABELS, type StaffGroup } from '@/lib/staff';

export function LoginForm({ mode, notice }: { mode: 'cognito' | 'local'; notice?: string }) {
  const [signInState, signIn, signingIn] = useActionState(staffSignInAction, { status: 'idle', step: 'credentials' } satisfies LoginState);
  const [passwordState, setPassword, savingPassword] = useActionState(staffNewPasswordAction, { status: 'idle', step: 'new-password' } satisfies LoginState);
  const [role, setRole] = useState<StaffGroup>('despega/admin');
  const needsNewPassword = signInState.step === 'new-password' && passwordState.step !== 'credentials';
  const error = needsNewPassword ? passwordState : signInState;

  return (
    <div className="grid gap-5">
      {notice && !error.message && (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{notice}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}
      {error.status === 'error' && error.message && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{error.message}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {needsNewPassword ? (
        <form action={setPassword} className="grid gap-4">
          <p className="text-sm text-muted-ink">
            Es tu primer ingreso: reemplaza la contraseña temporal. Usa al menos 12 caracteres con mayúsculas, minúsculas y números.
          </p>
          <TextField name="password" type="password" isRequired autoComplete="new-password" fullWidth>
            <Label>Contraseña nueva</Label>
            <Input />
          </TextField>
          <TextField name="confirmation" type="password" isRequired autoComplete="new-password" fullWidth>
            <Label>Confirmar contraseña</Label>
            <Input />
          </TextField>
          <Button type="submit" variant="primary" fullWidth isPending={savingPassword}>
            {!savingPassword && <KeyRound className="size-4" aria-hidden />} Guardar y entrar
          </Button>
        </form>
      ) : (
        <form action={signIn} className="grid gap-4">
          <TextField name="email" type="email" isRequired autoComplete="email" defaultValue={signInState.email} fullWidth>
            <Label>Correo</Label>
            <Input placeholder="nombre@despega.app" />
          </TextField>
          {mode === 'cognito' ? (
            <TextField name="password" type="password" isRequired autoComplete="current-password" fullWidth>
              <Label>Contraseña</Label>
              <Input />
            </TextField>
          ) : (
            <div className="grid gap-2">
              <span id="local-role" className="text-sm font-medium text-ink">Rol para esta sesión local</span>
              <ToggleButtonGroup
                aria-labelledby="local-role"
                selectionMode="single"
                disallowEmptySelection
                selectedKeys={[role]}
                onSelectionChange={(keys) => {
                  const [selected] = [...keys];
                  if (selected) setRole(String(selected) as StaffGroup);
                }}
                fullWidth
              >
                {(Object.entries(STAFF_ROLE_LABELS) as [StaffGroup, string][]).map(([value, label]) => (
                  <ToggleButton key={value} id={value}>{label}</ToggleButton>
                ))}
              </ToggleButtonGroup>
              <input type="hidden" name="role" value={role} />
            </div>
          )}
          <Button type="submit" variant="primary" fullWidth isPending={signingIn}>
            {!signingIn && <LogIn className="size-4" aria-hidden />} Entrar al backoffice
          </Button>
        </form>
      )}
    </div>
  );
}
