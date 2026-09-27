# Backoffice

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Alcance

- Next.js 16 App Router, puerto local `3001`, desplegado en AWS Amplify (SSR).
- Staff de DESPEGA y orientación: panel del piloto, estudiantes, detalle con registro
  de decisiones y visor del guión con sus puntajes (`/modulos/[careerId]`).
- Lee DynamoDB desde Server Components con `@despega/data`; la única escritura es el
  reinicio administrativo de un intento (Server Action, solo `despega/admin`).

## Reglas

- **HeroUI v3 es el sistema de componentes** (`@heroui/react` + `@heroui/styles`).
  No introducir otra librería de UI. Las variables de HeroUI en `src/app/styles.css`
  mapean la paleta de `@despega/brand`; los componentes usan esos tokens, nunca hex.
- El logo es `DespegaLogo` de `@despega/brand` (vía `Brand`). `favicon.ico`,
  `icon.svg` y `apple-icon.png` de `src/app/` son copias de
  `packages/brand/assets/icons/`.
- Usar la API compuesta de v3 (`Card.Header`, `Table.Content`, `Alert.Indicator`,
  `AlertDialog.Backdrop`…). Las tablas de datos usan `Table` de HeroUI dentro de
  componentes cliente (`src/components/tables.tsx`) que reciben filas serializables.
- Roles del pool de staff: `despega/admin` (todo, incluido reiniciar intentos) y
  `despega/counselor` (solo lectura). La autorización se valida en `proxy.ts`,
  en `requireStaff()` y dentro de cada Server Action; ocultar un botón no autoriza.
- El visor del guión lee el módulo del paquete `@despega/simulator`: no duplicar
  textos ni puntajes aquí.
- Sin datos de ejemplo: si DynamoDB falla, mostrar `DataUnavailable`.
- Listados sin `Scan`: índices documentados o `BatchGetItem` por claves exactas.
- `.env.example` es el contrato de variables; mismas keys en `.env.local`,
  `.env.develop` y `.env.production`. Sin secretos.
