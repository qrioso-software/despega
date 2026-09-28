'use client';

import { Alert, Button, InputGroup, Label, TextField, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { Eye, EyeOff, KeyRound, LockKeyhole, LogIn, Mail } from 'lucide-react';
import { useActionState, useState } from 'react';
import { staffNewPasswordAction, staffSignInAction, type LoginState } from '@/app/login/actions';
import { STAFF_ROLE_LABELS, type StaffGroup } from '@/lib/staff';

/** Campo de contraseña con ícono y botón para mostrarla u ocultarla. */
function PasswordField({ name, label, autoComplete }: { name: string; label: string; autoComplete: 'current-password' | 'new-password' }) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField name={name} type={visible ? 'text' : 'password'} isRequired autoComplete={autoComplete} fullWidth>
      <Label className="label-caps">{label}</Label>
      <InputGroup fullWidth className="h-12">
        <InputGroup.Prefix>
          <LockKeyhole className="size-[1.125rem]" aria-hidden />
        </InputGroup.Prefix>
        <InputGroup.Input />
        <InputGroup.Suffix className="pr-1.5">
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            onPress={() => setVisible((value) => !value)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
          >
            {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </Button>
        </InputGroup.Suffix>
      </InputGroup>
    </TextField>
  );
}

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
        <form action={setPassword} className="grid gap-5">
          <p className="text-sm text-muted-ink">
            Es tu primer ingreso: reemplaza la contraseña temporal. Usa al menos 12 caracteres con mayúsculas, minúsculas y números.
          </p>
          <PasswordField name="password" label="Contraseña nueva" autoComplete="new-password" />
          <PasswordField name="confirmation" label="Confirmar contraseña" autoComplete="new-password" />
          <Button type="submit" variant="primary" size="lg" fullWidth isPending={savingPassword}>
            {!savingPassword && <KeyRound className="size-4" aria-hidden />} Guardar y entrar
          </Button>
        </form>
      ) : (
        <form action={signIn} className="grid gap-5">
          <TextField name="email" type="email" isRequired autoComplete="email" defaultValue={signInState.email} fullWidth>
            <Label className="label-caps">Correo</Label>
            <InputGroup fullWidth className="h-12">
              <InputGroup.Prefix>
                <Mail className="size-[1.125rem]" aria-hidden />
              </InputGroup.Prefix>
              <InputGroup.Input placeholder="nombre@despega.app" />
            </InputGroup>
          </TextField>
          {mode === 'cognito' ? (
            <PasswordField name="password" label="Contraseña" autoComplete="current-password" />
          ) : (
            <div className="grid gap-2">
              <span id="local-role" className="label-caps">Rol para esta sesión local</span>
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
          <Button type="submit" variant="primary" size="lg" fullWidth isPending={signingIn} className="mt-1">
            {!signingIn && <LogIn className="size-4" aria-hidden />} Entrar al backoffice
          </Button>
        </form>
      )}
    </div>
  );
}
