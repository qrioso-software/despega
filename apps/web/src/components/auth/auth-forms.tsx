'use client';

import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  FlaskConical,
  GraduationCap,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  RefreshCw,
  School,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useActionState, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import {
  confirmSignUpAction,
  passwordResetAction,
  resendCodeAction,
  signInAction,
  signUpAction,
  type AuthFormState,
} from '@/app/(auth)/actions';

type Mode = 'cognito' | 'local';

const PASSWORD_HINT = 'Mínimo 8 caracteres, con letras minúsculas y al menos un número.';

export function FormMessage({ state }: { state: AuthFormState }) {
  if (!state.message) return null;
  const error = state.status === 'error';
  const Icon = error ? CircleAlert : CircleCheck;
  return (
    <p
      role={error ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium ${
        error ? 'border-bad/20 bg-bad-soft text-bad-strong' : 'border-good/20 bg-good-soft text-good-strong'
      }`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{state.message}</span>
    </p>
  );
}

function Submit({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <button type="submit" className="btn btn-primary btn-lg w-full" disabled={pending}>
      {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

function Field({ id, label, hint, aside, children }: { id: string; label: string; hint?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="field-label">{label}</label>
        {aside}
      </div>
      {children}
      {hint && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
    </div>
  );
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & { id: string; className?: string };

function TextInput({ icon: Icon, className = '', ...props }: InputProps & { icon: LucideIcon }) {
  return (
    <div className="field-control">
      <Icon className="field-icon" aria-hidden />
      <input name={props.id} {...props} className={`field-input has-icon ${className}`} />
    </div>
  );
}

/** Contraseña con botón para mostrarla u ocultarla; el valor nunca sale del formulario. */
function PasswordInput(props: Omit<InputProps, 'type'>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="field-control">
      <LockKeyhole className="field-icon" aria-hidden />
      <input name={props.id} {...props} type={visible ? 'text' : 'password'} className="field-input has-icon has-action" />
      <button
        type="button"
        className="field-action"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-controls={props.id}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="size-4.5" aria-hidden /> : <Eye className="size-4.5" aria-hidden />}
      </button>
    </div>
  );
}

export function SignInForm({ mode, next, defaultEmail }: { mode: Mode; next: string; defaultEmail?: string }) {
  const [state, action, pending] = useActionState(signInAction, { status: 'idle', email: defaultEmail });
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="next" value={next} />
      <Field id="email" label="Correo">
        <TextInput id="email" icon={Mail} type="email" autoComplete="email" required defaultValue={state.email ?? defaultEmail} placeholder="tu@correo.com" />
      </Field>
      {mode === 'cognito' && (
        <Field
          id="password"
          label="Contraseña"
          aside={<Link href="/recuperar" className="text-xs font-semibold text-accent hover:underline">¿La olvidaste?</Link>}
        >
          <PasswordInput id="password" autoComplete="current-password" required placeholder="Tu contraseña" />
        </Field>
      )}
      <FormMessage state={state} />
      <Submit pending={pending}>Entrar <ArrowRight className="size-4" aria-hidden /></Submit>
    </form>
  );
}

export function SignUpForm({ mode }: { mode: Mode }) {
  const [state, action, pending] = useActionState(signUpAction, { status: 'idle' });
  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="givenName" label="Nombre" hint="Así te llamarán los personajes.">
          <TextInput id="givenName" icon={UserRound} autoComplete="given-name" required maxLength={40} placeholder="Ej.: Sofía" aria-describedby="givenName-hint" />
        </Field>
        <Field id="familyName" label="Apellido (opcional)">
          <TextInput id="familyName" icon={UserRound} autoComplete="family-name" maxLength={60} />
        </Field>
      </div>
      <Field id="email" label="Correo">
        <TextInput id="email" icon={Mail} type="email" autoComplete="email" required defaultValue={state.email} placeholder="tu@correo.com" />
      </Field>
      {mode === 'cognito' && (
        <Field id="password" label="Contraseña" hint={PASSWORD_HINT}>
          <PasswordInput id="password" autoComplete="new-password" required minLength={8} aria-describedby="password-hint" />
        </Field>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="grade" label="Curso (opcional)">
          <TextInput id="grade" icon={GraduationCap} maxLength={40} placeholder="Ej.: 5.º año" />
        </Field>
        <Field id="school" label="Colegio (opcional)">
          <TextInput id="school" icon={School} maxLength={80} />
        </Field>
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-paper p-4 text-sm leading-6 text-ink-soft transition-colors has-checked:border-brand has-checked:bg-brand-soft/50">
        <input type="checkbox" name="consent" required className="mt-1 size-4 shrink-0 accent-accent" />
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
    <div className="grid gap-5">
      <form action={action} className="grid gap-5">
        <Field id="email" label="Correo">
          <TextInput id="email" icon={Mail} type="email" required defaultValue={state.email ?? email} />
        </Field>
        <Field id="code" label="Código de verificación">
          <TextInput id="code" icon={KeyRound} inputMode="numeric" autoComplete="one-time-code" required minLength={4} maxLength={10} className="font-semibold tracking-[0.4em]" placeholder="000000" />
        </Field>
        <FormMessage state={state} />
        <Submit pending={pending}>Confirmar cuenta</Submit>
      </form>
      <form action={resend} className="grid gap-3 border-t border-line pt-5">
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
    <form action={action} className="grid gap-5">
      <input type="hidden" name="intent" value={onCodeStep ? 'confirm' : 'request'} />
      <Field id="email" label="Correo">
        <TextInput id="email" icon={Mail} type="email" required defaultValue={state.email ?? defaultEmail} readOnly={onCodeStep} placeholder="tu@correo.com" />
      </Field>
      {onCodeStep && (
        <>
          <Field id="code" label="Código de verificación">
            <TextInput id="code" icon={KeyRound} inputMode="numeric" autoComplete="one-time-code" required className="font-semibold tracking-[0.4em]" placeholder="000000" />
          </Field>
          <Field id="password" label="Contraseña nueva" hint={PASSWORD_HINT}>
            <PasswordInput id="password" autoComplete="new-password" required minLength={8} aria-describedby="password-hint" />
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
    <p className="flex items-start gap-3 rounded-xl border border-dashed border-accent/35 bg-accent-soft/50 px-4 py-3 text-xs leading-5 text-ink-soft">
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
      <span>
        <strong className="text-ink">Modo local de desarrollo.</strong> El acceso usa solo correo y los datos se guardan en
        DynamoDB de DEV (qrioso-dev), compartido con el entorno de pruebas. Las apps publicadas usan Amazon Cognito con contraseña.
      </span>
    </p>
  );
}
