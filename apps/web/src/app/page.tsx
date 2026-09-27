import { AFFINITY_AXES, AFFINITY_DESCRIPTIONS, AFFINITY_LABELS, CAREERS, ingenieriaSoftware } from '@despega/simulator';
import {
  ArrowRight,
  BarChart3,
  Clock3,
  GitBranch,
  LayoutGrid,
  ListChecks,
  Mail,
  MessagesSquare,
  Puzzle,
  Rocket,
  School,
  Sparkles,
  Timer,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { CharacterAvatar } from '@/components/characters/character-avatar';
import { AffinityRadar } from '@/components/simulator/affinity-radar';
import { SiteFooter, SiteHeader } from '@/components/site/site-header';
import { currentStudent } from '@/lib/auth';

export default async function LandingPage() {
  const student = await safeCurrentStudent();
  const primaryHref = student ? '/inicio' : '/registro';

  return (
    <>
      <SiteHeader student={student} />
      <main>
        <Hero primaryHref={primaryHref} />
        <Stats />
        <HowItWorks />
        <PilotModule primaryHref={primaryHref} />
        <Mechanics />
        <Careers />
        <Profile />
        <Schools />
        <FinalCta primaryHref={primaryHref} />
      </main>
      <SiteFooter />
    </>
  );
}

async function safeCurrentStudent() {
  try {
    return await currentStudent();
  } catch {
    return null;
  }
}

function Hero({ primaryHref }: { primaryHref: string }) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -left-40 top-10 size-[28rem] rounded-full bg-brand/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-32 -top-10 size-[30rem] rounded-full bg-violet/15 blur-3xl" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-20">
        <div>
          <p className="chip bg-sun-soft text-[#8a5a00]">
            <Sparkles className="size-3.5" aria-hidden /> Para estudiantes de 15 a 18 años
          </p>
          <h1 className="mt-5 text-5xl font-extrabold leading-[1.02] sm:text-6xl">
            Vive una carrera <span className="text-brand">antes de elegirla.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-soft">
            No es un test vocacional. Es una historia jugable: entras a un equipo real, con personajes, presión y
            decisiones que cambian lo que pasa después. Al final, descubres cómo decides tú.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={primaryHref} className="btn btn-primary min-h-12 px-6 text-base">
              Empieza gratis <ArrowRight className="size-5" aria-hidden />
            </Link>
            <Link href="#como-funciona" className="btn btn-ghost min-h-12 px-6 text-base">
              Ver cómo funciona
            </Link>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-muted">
            <Clock3 className="size-4" aria-hidden /> 3 sesiones de ~30 minutos. Sin respuestas «correctas» en tu perfil.
          </p>
        </div>
        <HeroScene />
      </div>
    </section>
  );
}

/** Recreación estática de la escena 1.4: así se ve el simulador por dentro. */
function HeroScene() {
  return (
    <div className="relative mx-auto w-full max-w-lg" aria-label="Vista previa del simulador: chat con Marisol durante un incidente" role="img">
      <div className="card overflow-hidden p-0 shadow-pop">
        <div className="flex items-center justify-between border-b border-line bg-mist px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-ink-soft">
            <MessagesSquare className="size-4 text-violet" aria-hidden /> PixelChat · 9:25 a. m.
          </div>
          <div className="flex items-center gap-2">
            <span className="chip bg-bad-soft text-[#a1262b]"><TrendingUp className="size-3.5" aria-hidden /> 23 quejas</span>
            <span className="chip bg-violet-soft text-violet">Desempeño 55</span>
          </div>
        </div>
        <div className="grid gap-3 p-5 pb-20 sm:pb-24">
          <div className="flex items-end gap-3">
            <CharacterAvatar characterId="marisol" mood="concerned" talking size={52} decorative />
            <p className="max-w-[80%] rounded-2xl rounded-bl-md bg-mist px-4 py-3 text-sm text-ink">
              Necesito tu diagnóstico ya: ¿cuál es la causa? El cliente está mirando.
            </p>
          </div>
          <div className="mt-2 flex items-center gap-3 rounded-2xl bg-sun-soft px-4 py-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full border-4 border-brand font-display text-sm font-extrabold text-brand">12</span>
            <p className="text-sm font-semibold text-[#6b4700]">Tienes 15 segundos para decidir.</p>
          </div>
          {['El botón no espera lo suficiente cuando la conexión es lenta.', 'El botón está mal diseñado visualmente.', 'Es problema del teléfono del usuario.'].map((option, index) => (
            <div key={option} className={`rounded-2xl border-2 px-4 py-3 text-sm font-semibold ${index === 0 ? 'border-violet bg-violet-soft text-violet-strong' : 'border-line bg-white text-ink-soft'}`}>
              {option}
            </div>
          ))}
        </div>
      </div>
      <div className="card absolute -bottom-6 -left-4 hidden w-60 p-4 sm:block">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Tu perfil</p>
        <p className="mt-1 font-display text-lg font-bold">+8 Pensamiento analítico</p>
        <p className="text-xs text-muted">El contador de quejas deja de subir.</p>
      </div>
      <div className="absolute -right-3 -top-5 animate-float">
        <span className="chip bg-night px-3 py-2 text-white shadow-pop"><Timer className="size-4 text-sun" aria-hidden /> ¡Decide rápido!</span>
      </div>
    </div>
  );
}

function Stats() {
  const stats = [
    { value: '3', label: 'sesiones por carrera, pensadas para días distintos' },
    { value: '5', label: 'ejes de afinidad que se construyen con tus decisiones' },
    { value: '14', label: 'carreras en camino; la primera ya está lista' },
    { value: '0', label: 'formas de perder: el juego siempre avanza' },
  ];
  return (
    <section aria-label="DESPEGA en números" className="border-y border-line bg-surface">
      <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="sr-only">{stat.label}</dt>
            <dd className="font-display text-4xl font-extrabold text-ink">{stat.value}</dd>
            <dd className="mt-1 text-sm text-muted">{stat.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Rocket,
      title: 'Elige una carrera',
      text: 'Entras como practicante a un equipo profesional. Nada de onboarding lento: la primera escena ya está en llamas.',
    },
    {
      icon: Timer,
      title: 'Vive la semana',
      text: 'Conversas con tu equipo, clasificas reportes, armas correos y decides con el reloj corriendo. Todo tiene consecuencias.',
    },
    {
      icon: BarChart3,
      title: 'Descubre cómo decides',
      text: 'Recibes tu desempeño y un perfil de afinidad de 5 ejes, más una proyección de cómo crece esa carrera.',
    },
  ];
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <p className="eyebrow">Cómo funciona</p>
      <h2 className="mt-3 max-w-2xl text-4xl font-bold">Una mezcla de juego de decisiones y tareas reales</h2>
      <p className="mt-4 max-w-2xl text-ink-soft">
        Como en los juegos narrativos, tus elecciones cambian lo que viene. Como en los simuladores, «haces» cosas concretas
        en vez de solo leer.
      </p>
      <ol className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="card relative p-7">
            <span className="absolute right-6 top-6 font-display text-5xl font-extrabold text-mist">{index + 1}</span>
            <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
              <step.icon className="size-6" aria-hidden />
            </span>
            <h3 className="mt-5 text-xl font-bold">{step.title}</h3>
            <p className="mt-2 text-sm text-ink-soft">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function PilotModule({ primaryHref }: { primaryHref: string }) {
  const cast = Object.values(ingenieriaSoftware.characters);
  return (
    <section className="bg-night text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <p className="eyebrow text-sun">Módulo piloto · Ingeniería de Software</p>
          <h2 className="mt-3 text-4xl font-bold">Tu semana en PixelForge</h2>
          <p className="mt-4 text-white/75">
            Eres practicante junior en una empresa de software. El botón de «Confirmar pedido» falla, las quejas suben en vivo y
            el cliente espera. Tres sesiones, un lanzamiento y ningún camino igual a otro.
          </p>
          <ul className="mt-8 grid gap-4">
            {cast.map((character) => (
              <li key={character.id} className="flex items-center gap-4 rounded-2xl bg-white/5 p-3 pr-5">
                <CharacterAvatar characterId={character.id} mood="happy" size={56} decorative />
                <div>
                  <p className="font-display text-lg font-bold">{character.name} <span className="text-sm font-medium text-white/60">· {character.role}</span></p>
                  <p className="text-sm text-white/70">{character.bio}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link href={primaryHref} className="btn btn-primary mt-8 min-h-12 px-6">
            Empezar la semana <ArrowRight className="size-5" aria-hidden />
          </Link>
        </div>
        <ol className="grid gap-4">
          {ingenieriaSoftware.sessions.map((session) => (
            <li key={session.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-sun">Sesión {session.number} · ~{session.estimatedMinutes} min</p>
              <h3 className="mt-2 text-2xl font-bold">{session.title}</h3>
              <p className="mt-2 text-white/70">{session.synopsis}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Mechanics() {
  const mechanics = [
    { icon: MessagesSquare, title: 'Conversa y decide', text: 'Videollamadas y chats con tu equipo, con 2 o 3 respuestas posibles.' },
    { icon: Timer, title: 'Contra el reloj', text: 'Decisiones con 15–20 segundos visibles. Si no eliges, el juego sigue… con consecuencias.' },
    { icon: LayoutGrid, title: 'Clasifica y ordena', text: 'Arrastra o toca tarjetas para encontrar el patrón antes de que suban las quejas.' },
    { icon: Mail, title: 'Arma tus mensajes', text: 'Combina frases para responderle a tu jefe o dar feedback a una compañera.' },
    { icon: Puzzle, title: 'Empareja', text: 'Conecta cada error con su solución cuando la ventana de lanzamiento se cierra.' },
    { icon: ListChecks, title: 'Prioriza', text: 'Cuatro tareas, tres espacios. Lo que dejas fuera vuelve a aparecer.' },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <p className="eyebrow">Lo que vas a hacer</p>
      <h2 className="mt-3 max-w-2xl text-4xl font-bold">Herramientas de oficina, dentro del mundo del juego</h2>
      <p className="mt-4 max-w-2xl text-ink-soft">
        Chat, videollamadas, bandeja de entrada y tablero de tareas recreados en PixelForge. Nada de capturas: todo se juega.
      </p>
      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {mechanics.map((mechanic) => (
          <li key={mechanic.title} className="card flex gap-4 p-6">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-soft text-violet">
              <mechanic.icon className="size-5" aria-hidden />
            </span>
            <div>
              <h3 className="text-lg font-bold">{mechanic.title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{mechanic.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Careers() {
  return (
    <section id="carreras" className="scroll-mt-20 border-y border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="eyebrow">Carreras</p>
        <h2 className="mt-3 max-w-2xl text-4xl font-bold">Una carrera lista, 13 en camino</h2>
        <p className="mt-4 max-w-2xl text-ink-soft">
          Cada carrera usa la misma mecánica con su propio escenario profesional. Tu desempeño y tu perfil se guardan por
          carrera, para que algún día puedas compararlos.
        </p>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CAREERS.map((career) => {
            const available = career.status === 'available';
            return (
              <li
                key={career.id}
                className={`rounded-3xl border p-5 ${available ? 'border-brand/40 bg-brand-soft/60 shadow-soft sm:col-span-2' : 'border-line bg-paper'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-3xl" aria-hidden>{career.emoji}</span>
                  <span className={`chip ${available ? 'bg-brand text-white' : 'bg-mist text-muted'}`}>
                    {available ? 'Disponible' : 'Próximamente'}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{career.name}</h3>
                <p className="mt-1 text-sm text-ink-soft">{career.description}</p>
                {available && career.moduleTitle && (
                  <p className="mt-3 text-sm font-semibold text-brand-strong">{career.moduleTitle} →</p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Profile() {
  const example = { analytical: 82, communication: 64, detail: 58, pressure: 30, structure: 70 };
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
      <div>
        <p className="eyebrow">Tu perfil de afinidad</p>
        <h2 className="mt-3 text-4xl font-bold">Sin bien ni mal: solo tu forma de decidir</h2>
        <p className="mt-4 text-ink-soft">
          Dos capas corren en paralelo. Tu <strong>desempeño</strong> (0 a 100) sube o baja con cada tarea. Tu{' '}
          <strong>perfil de afinidad</strong> suma a cinco ejes según la naturaleza de cada elección, no según si fue la
          «correcta».
        </p>
        <ul className="mt-8 grid gap-3">
          {AFFINITY_AXES.map((axis) => (
            <li key={axis} className="flex gap-3">
              <GitBranch className="mt-0.5 size-4 shrink-0 text-violet" aria-hidden />
              <p className="text-sm text-ink-soft"><strong className="text-ink">{AFFINITY_LABELS[axis]}.</strong> {AFFINITY_DESCRIPTIONS[axis]}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="card p-6 sm:p-8">
        <p className="text-sm font-bold text-muted">Ejemplo de perfil al terminar la semana</p>
        <AffinityRadar values={example} size={360} className="mx-auto mt-4" />
      </div>
    </section>
  );
}

function Schools() {
  return (
    <section id="colegios" className="scroll-mt-20 px-4 pb-20 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-8 rounded-[2rem] bg-violet p-8 text-white sm:p-12 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <p className="eyebrow text-sun">Para colegios y orientadores</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Conversaciones vocacionales con evidencia</h2>
          <p className="mt-4 text-white/80">
            El equipo de orientación ve, por estudiante, el desempeño y el perfil de cada carrera jugada, junto con las
            decisiones que los explican. Una base concreta para conversar sobre qué estudiar.
          </p>
        </div>
        <ul className="grid gap-3 text-sm">
          {['Resultados por carrera y por sesión', 'Registro de decisiones escena por escena', 'Datos guardados por carrera desde el día uno'].map((item) => (
            <li key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
              <School className="size-5 text-sun" aria-hidden /> {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FinalCta({ primaryHref }: { primaryHref: string }) {
  return (
    <section className="px-4 pb-24 sm:px-6">
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <div className="flex -space-x-4">
          <CharacterAvatar characterId="camila" mood="happy" size={72} decorative className="rounded-full ring-4 ring-paper" />
          <CharacterAvatar characterId="marisol" mood="excited" size={72} decorative className="rounded-full ring-4 ring-paper" />
          <CharacterAvatar characterId="andres" mood="happy" size={72} decorative className="rounded-full ring-4 ring-paper" />
        </div>
        <h2 className="mt-6 text-4xl font-bold sm:text-5xl">¿Te animas a despegar?</h2>
        <p className="mt-4 max-w-xl text-ink-soft">
          Tu primer día en PixelForge empieza en cuanto creas tu cuenta. Marisol ya está llamando.
        </p>
        <Link href={primaryHref} className="btn btn-primary mt-8 min-h-12 px-8 text-base">
          Empieza gratis <ArrowRight className="size-5" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
