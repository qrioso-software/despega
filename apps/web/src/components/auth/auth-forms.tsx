'use client';

import { ArrowRight, KeyRound, LoaderCircle, Mail, RefreshCw, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useActionState, type ReactNode } from 'react';
import {
  confirmSignUpAction,
  passwordResetAction,
  resendCodeAction,
  signInAction,
  signUpAction,
  type AuthFormState,
} from '@/app/(auth)/actions';

type Mode = 'cognito' | 'local';

export function FormMessage({ state }: { state: AuthFormState }) {
  if (!state.message) return null;
  const error = state.status === 'error';
  return (
    <p
      role={error ? 'alert' : 'status'}
      className={`rounded-2xl px-4 py-3 text-sm font-medium ${error ? 'bg-bad-soft text-bad-strong' : 'bg-good-soft text-good-strong'}`}
    >
      {state.message}
    </p>
  );
}

function Submit({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <button type="submit" className="btn btn-primary w-full" disabled={pending}>
      {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      {children}
      {hint && <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function SignInForm({ mode, next, defaultEmail }: { mode: Mode; next: string; defaultEmail?: string }) {
  const [state, action, pending] = useActionState(signInAction, { status: 'idle', email: defaultEmail });
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <Field id="email" label="Correo">
        <input id="email" name="email" type="email" autoComplete="email" required className="field-input" defaultValue={state.email ?? defaultEmail} placeholder="tu@correo.com" />
      </Field>
      {mode === 'cognito' && (
        <Field id="password" label="Contraseña">
          <input id="password" name="password" type="password" autoComplete="current-password" required className="field-input" placeholder="Tu contraseña" />
        </Field>
      )}
      <FormMessage state={state} />
      <Submit pending={pending}>Entrar <ArrowRight className="size-4" aria-hidden /></Submit>
      {mode === 'cognito' && (
        <Link href="/recuperar" className="text-center text-sm font-semibold text-accent hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      )}
    </form>
  );
}

export function SignUpForm({ mode }: { mode: Mode }) {
  const [state, action, pending] = useActionState(signUpAction, { status: 'idle' });
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="givenName" label="Nombre" hint="Así te llamarán los personajes.">
          <input id="givenName" name="givenName" autoComplete="given-name" required maxLength={40} className="field-input" placeholder="Ej.: Sofía" aria-describedby="givenName-hint" />
        </Field>
        <Field id="familyName" label="Apellido (opcional)">
          <input id="familyName" name="familyName" autoComplete="family-name" maxLength={60} className="field-input" />
        </Field>
      </div>
      <Field id="email" label="Correo">
        <input id="email" name="email" type="email" autoComplete="email" required className="field-input" defaultValue={state.email} placeholder="tu@correo.com" />
      </Field>
      {mode === 'cognito' && (
        <Field id="password" label="Contraseña" hint="Mínimo 8 caracteres, con letras minúsculas y al menos un número.">
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="field-input" aria-describedby="password-hint" />
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="grade" label="Curso (opcional)">
          <input id="grade" name="grade" maxLength={40} className="field-input" placeholder="Ej.: 5.º de secundaria" />
        </Field>
        <Field id="school" label="Colegio (opcional)">
          <input id="school" name="school" maxLength={80} className="field-input" />
        </Field>
      </div>
      <label className="flex items-start gap-3 rounded-2xl bg-mist p-4 text-sm text-ink-soft">
        <input type="checkbox" name="consent" required className="mt-0.5 size-5 shrink-0 accent-accent" />
        <span>
          Acepto que DESPEGA guarde mis decisiones en el simulador para mostrarme mis resultados y mi perfil. Si soy menor
          de edad, cuento con el permiso de mi madre, padre o tutor.
        </span>
      </label>
      <FormMessage state={state} />
      <Submit pending={pending}>Crear mi cuenta <ArrowRight className="size-4" aria-hidden /></Submit>
    </form>
  );
}

export function ConfirmSignUpForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(confirmSignUpAction, { status: 'idle', email });
  const [resendState, resend, resending] = useActionState(resendCodeAction, { status: 'idle', email });
  return (
    <div className="grid gap-4">
      <form action={action} className="grid gap-4">
        <Field id="email" label="Correo">
          <input id="email" name="email" type="email" required className="field-input" defaultValue={state.email ?? email} />
        </Field>
        <Field id="code" label="Código de verificación">
          <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" required minLength={4} maxLength={10} className="field-input tracking-[0.4em]" placeholder="000000" />
        </Field>
        <FormMessage state={state} />
        <Submit pending={pending}>Confirmar cuenta</Submit>
      </form>
      <form action={resend} className="grid gap-2">
        <input type="hidden" name="email" value={state.email ?? email} />
        <button type="submit" className="btn btn-ghost w-full" disabled={resending}>
          <RefreshCw className={`size-4 ${resending ? 'animate-spin' : ''}`} aria-hidden /> Reenviar código
        </button>
        <FormMessage state={resendState} />
      </form>
    </div>
  );
}

export function PasswordResetForm({ defaultEmail }: { defaultEmail?: string }) {
  const [state, action, pending] = useActionState(passwordResetAction, { status: 'idle', step: 'request', email: defaultEmail });
  const onCodeStep = state.step === 'code';
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="intent" value={onCodeStep ? 'confirm' : 'request'} />
      <Field id="email" label="Correo">
        <input id="email" name="email" type="email" required className="field-input" defaultValue={state.email ?? defaultEmail} readOnly={onCodeStep} />
      </Field>
      {onCodeStep && (
        <>
          <Field id="code" label="Código de verificación">
            <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" required className="field-input tracking-[0.4em]" placeholder="000000" />
          </Field>
          <Field id="password" label="Contraseña nueva" hint="Mínimo 8 caracteres, con letras minúsculas y al menos un número.">
            <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="field-input" aria-describedby="password-hint" />
          </Field>
        </>
      )}
      <FormMessage state={state} />
      <Submit pending={pending}>
        {onCodeStep ? <><KeyRound className="size-4" aria-hidden /> Guardar contraseña</> : <><Mail className="size-4" aria-hidden /> Enviar código</>}
      </Submit>
    </form>
  );
}

export function LocalModeNotice() {
  return (
    <p className="flex items-start gap-2 rounded-2xl border border-dashed border-accent/40 bg-accent-soft/60 px-4 py-3 text-xs text-ink-soft">
      <UserRound className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
      <span>
        <strong className="text-ink">Modo local de desarrollo.</strong> Las cuentas se identifican solo por correo y viven en
        DynamoDB Local de este equipo. En los ambientes de AWS el acceso usa Amazon Cognito con contraseña.
      </span>
    </p>
  );
}
