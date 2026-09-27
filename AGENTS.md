# Contexto para agentes — DESPEGA

Este archivo es la instrucción raíz del monorepo. Sus reglas aplican a todo el
repositorio; los `AGENTS.md` de cada workspace agregan reglas propias.

DESPEGA es un simulador de inmersión de carreras para estudiantes de colegio (15–18
años): una historia jugable con personajes, decisiones y consecuencias. El piloto es
**Ingeniería de Software — «Tu semana en PixelForge»**; el documento funcional prevé 14
carreras con la misma mecánica.

## Lectura obligatoria

Antes de proponer arquitectura, datos, contenido o flujos:

1. `docs/PROJECT_STATUS.md`: fase, decisiones vigentes y pendientes.
2. `docs/architecture/overview.md`: componentes, flujos y límites.
3. `docs/funtional.md` (documento del cliente, fuente de verdad del producto) y
   `docs/architecture/functional-analysis.md` (interpretaciones y supuestos).
4. Si la tarea toca el simulador o el guión: `docs/architecture/simulator-engine.md` y
   `packages/simulator/AGENTS.md`.
5. Si toca datos o permisos: `docs/architecture/data-model.md`.
6. Si toca AWS o variables: `docs/architecture/environments-and-deployment.md`.
7. Si toca colores, logo o íconos: `packages/brand/AGENTS.md`.
8. El `AGENTS.md` del workspace que se vaya a modificar.

Separar siempre: lo que dice el documento funcional, lo que es un supuesto registrado y
lo que es una decisión técnica nueva.

## Política de versiones

Regla del proyecto: **toda librería se incorpora y se actualiza a su última versión
estable.**

- Verificar la versión con el registro, no con la memoria: `npm view <paquete> version`
  (dist-tag `latest`). Un dist-tag `rc`, `beta`, `next`, `canary` o una serie `0.x` no es
  estable.
- Fijar versiones exactas (sin `^` ni `~`) en todos los `package.json`; el lockfile manda.
- Una excepción solo se acepta cuando la última estable rompe la compatibilidad
  **declarada o probada** del stack. Se registra en la tabla de excepciones con motivo y
  evidencia, y se reevalúa en cada actualización.
- Runtime: Node.js en su **última LTS** (no la rama Current). `@types/node` sigue la
  versión mayor del runtime.
- pnpm 12 aplica una edad mínima de publicación; si bloquea una versión recién publicada,
  deja la excepción en `minimumReleaseAgeExclude` de `pnpm-workspace.yaml`. No borrarla a
  mano sin reinstalar.

### Stack por área

| Área | Librerías |
| --- | --- |
| Web de estudiantes (`apps/web`) | Next.js (App Router, SSR, Server Actions), React, Tailwind CSS |
| Backoffice (`apps/admin`) | Next.js, **HeroUI v3** (`@heroui/react`, `@heroui/styles`), Tailwind CSS |
| Simulador | Motor propio en TypeScript puro (`packages/simulator`); en la web: `motion` (animación), `@dnd-kit/core` + `@dnd-kit/utilities` (arrastrar o tocar), `lucide-react` (iconos), `zod` (validación de Server Actions). Gráficas en SVG propio, sin librería de charts |
| Identidad y datos | AWS SDK v3 (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-cognito-identity-provider`), `aws-jwt-verify` |
| Infraestructura | AWS CDK v2 (`aws-cdk-lib`, `aws-cdk`, `constructs`), `tsx` |

### Versiones vigentes (verificadas el 2026-09-26)

| Paquete | Versión |
| --- | --- |
| Node.js | 24 LTS (24.21.0 al verificar) |
| pnpm | 12.6.0 |
| next / eslint-config-next | 16.3.6 |
| react / react-dom / @types/react(-dom) | 19.3.0 |
| @heroui/react / @heroui/styles | 3.2.6 |
| tailwindcss / @tailwindcss/postcss | 4.3.3 |
| motion | 13.4.4 |
| @dnd-kit/core / @dnd-kit/utilities | 6.3.1 / 3.2.2 |
| zod | 4.6.5 |
| lucide-react | 1.48.0 |
| @aws-sdk/* | 3.1141.0 |
| aws-jwt-verify | 5.2.1 |
| aws-cdk-lib / aws-cdk / constructs | 2.271.0 / 2.1143.0 / 10.8.1 |
| tsx | 4.23.15 |
| server-only | 0.0.1 |

### Excepciones vigentes

| Paquete | Última estable | Fijada | Motivo y evidencia |
| --- | --- | --- | --- |
| `typescript` | 7.0.2 | 6.0.3 | TypeScript 7 (compilador nativo) ya no expone la API JS clásica. `typescript-eslint` 8.70.1, que usa `eslint-config-next`, declara `typescript >=4.8.4 <6.1.0`. |
| `eslint` | 10.11.0 | 9.39.5 | Con ESLint 10 el lint se cae: `eslint-plugin-react` 7.37.5 (vía `eslint-config-next` 16.3.6) llama a `context.getFilename`, eliminado en v10. Probado el 2026-09-26. npm marca 9.x como *deprecated*: revisar en cada versión de `eslint-config-next`. |
| `@dnd-kit` | `@dnd-kit/react` 0.5.0 | `@dnd-kit/core` 6.3.1 | La API nueva sigue en serie 0.x (no estable). `core` es la última versión estable ≥ 1.0. |
| Node.js | 26 (Current) | 24 LTS | Producción y Amplify usan la última LTS, no la rama Current. |
| `@types/node` | 26.x | 24.19.0 | Los tipos deben coincidir con el runtime Node 24. |

## Arquitectura no negociable

- Monorepo `pnpm`: `apps/web`, `apps/admin`, `packages/simulator`, `packages/data`,
  `packages/auth`, `packages/brand` e `infra`.
- `apps/web` y `apps/admin`: Next.js 16 App Router con SSR, desplegados en **AWS Amplify
  Hosting** (`WEB_COMPUTE`). Server Components para leer; **Server Actions** para mutar.
- **Sin API Gateway ni Lambdas de dominio en esta etapa.** El SSR y las Server Actions
  leen y escriben DynamoDB con el rol de cómputo SSR de cada App Amplify, con permisos
  mínimos. Nunca se accede a AWS desde el navegador.
- `packages/simulator` es el motor: puro, sin frameworks, sin I/O. Es la única autoridad
  de puntajes y ramificación. El contenido de cada carrera es data declarativa.
- `packages/data` orquesta motor + DynamoDB (server-only). Las apps no duplican reglas.
- El servidor es la autoridad del simulador: el cliente envía la respuesta del
  jugador, nunca puntajes; la escena pública nunca incluye claves de respuesta.
- Desempeño y perfil de afinidad se guardan **por estudiante y por carrera** desde el
  inicio (requisito del documento funcional).
- Cognito con **dos pools separados**: estudiantes (registro propio) y staff (cuentas
  creadas por administración; grupos `despega/admin` y `despega/counselor`).
- El proveedor de identidad `local` existe solo con `STAGE=local` y host loopback. CDK y
  el build de Amplify lo rechazan.
- `infra` (CDK v2) es la única fuente de infraestructura.
- `packages/brand` es la única fuente de logo, íconos y paleta (derivada del logo). Las
  apps traducen la paleta a sus tokens y los componentes no usan hex de marca.
- DynamoDB por contexto acotado (`core`, `simulation`). Sin `Scan`: cada lectura usa
  `GetItem`, `Query`, `BatchGetItem` o un índice documentado. Un GSI nuevo exige
  registrar su patrón de acceso en `docs/architecture/data-model.md`.
- El esquema de tablas vive una sola vez en `packages/data/src/schema.ts`; CDK y
  DynamoDB Local lo consumen.

## Ambientes AWS

| Rol | Stage | Perfil AWS | Cuenta | Rama |
| --- | --- | --- | --- | --- |
| desarrollo | `dev` | `qrioso-dev` | `779926948601` | `develop` |
| producción | `prd` | `despega-prd` | pendiente | `main` |
| principal/DNS | — | `despega-main` | pendiente | Control Tower y dominios |

- Región inicial `us-east-1`.
- `dev` usa la cuenta de desarrollo de Qrioso (perfil SSO `qrioso-dev`; `.envrc` lo
  exporta como `AWS_PROFILE`). Las cuentas `prd` y principal todavía no existen; al
  crearlas, registrar los IDs en `infra/cdk.json` y en este archivo.
- El deploy sigue el flujo del proyecto de referencia: primero existen las Apps de
  Amplify y sus dominios; sus IDs van en `infra/cdk.json` y `deploy:<stage>` valida
  cuenta, App IDs y dominios antes de `cdk deploy`.
- Nunca desplegar sin `--profile` y `--context stage=<dev|prd>` explícitos.
- No ejecutar `deploy`, `destroy` ni `bootstrap` sin solicitud explícita del usuario.
  Nunca desplegar a `prd` sin autorización previa y explícita en la tarea activa.
- En producción: `RETAIN`, protección contra borrado y PITR.

## Variables de entorno de web y admin

- `apps/<web|admin>/.env.example` es el contrato completo de keys. Los valores viven en
  `.env.local` (local), `.env.develop` (`dev`) y `.env.production` (`prd`), ignorados por
  Git.
- Un key nuevo se agrega primero a `.env.example` y luego a los tres archivos; el synth
  falla si faltan o sobran keys.
- CDK reemplaza en el deploy los valores que son outputs del stack: tablas, región y los
  IDs de Cognito. En `dev` y `prd` exige `AUTH_PROVIDER=cognito`, `STAGE` igual al stage y
  `DYNAMODB_ENDPOINT` vacío.
- Estos archivos no admiten secretos: passwords, tokens o claves van a Secrets Manager o
  SSM. El cargador rechaza nombres sensibles y el prefijo `AWS`.

## Desarrollo local

```sh
pnpm install
pnpm local:setup   # DynamoDB Local en Docker + tablas
pnpm dev           # web :3000 y admin :3001
```

## Contenido del simulador

- Cada carrera es un archivo en `packages/simulator/src/modules/`. `validateModule` debe
  devolver cero errores y las pruebas del motor deben pasar.
- Un cambio de escenas o puntajes sube `version` del módulo y se registra en
  `docs/architecture/functional-analysis.md` si cambia un supuesto.
- Español neutro, tuteo y sin género gramatical para el protagonista (`{nombre}`).
- Ninguna decisión se resuelve solo con «correcto/incorrecto»: siempre hay reacción
  narrativa. No hay condición de derrota: toda respuesta, incluido el tiempo agotado,
  tiene un resultado definido.

## Documentación viva

Una tarea no está cerrada si cambia arquitectura, datos o comportamiento y deja la
documentación desactualizada:

- Actualizar `docs/PROJECT_STATUS.md`.
- Agregar una entrada en `docs/CHANGELOG_PROJECT.md` para cambios materiales.
- Actualizar el documento de arquitectura afectado.
- Crear o modificar un ADR en `docs/decisions/` cuando se acepte o reemplace una
  decisión con alternativas reales.

## Seguridad y privacidad

- Los usuarios son menores de edad: guardar solo lo necesario (nombre, correo, curso y
  colegio opcionales, decisiones del simulador). No registrar datos personales en logs.
- Contraseñas y tokens solo en Cognito y en cookies `httpOnly`; nunca en DynamoDB ni en
  el almacenamiento del navegador.
- Las Server Actions validan entrada (Zod), autentican y autorizan dentro de la acción;
  ocultar un botón no es autorización.
- Mínimo privilegio: cada rol SSR recibe solo las acciones DynamoDB que usa.

## Validación

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build:web && pnpm build:admin
pnpm infra:synth:dev && pnpm infra:synth:prd
```

Ejecutar solo el workspace afectado cuando una comprobación menor demuestra el cambio
(`pnpm --filter @despega/<workspace> <script>`). Un `synth` no prueba que una cuenta
pueda desplegar.
