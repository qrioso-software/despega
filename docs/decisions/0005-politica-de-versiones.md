# ADR 0005: última versión estable con excepciones documentadas

- Estado: aceptado
- Fecha: 2026-09-26

## Contexto

El usuario pidió que todas las librerías estén en su última versión estable: HeroUI en
el backoffice, Next.js en la web y las del simulador. Algunas versiones estables
recientes aún no son compatibles con el resto del ecosistema.

## Decisión

- Se fija la última versión estable (dist-tag `latest`, serie ≥ 1.0), verificada en el
  registro al incorporarla o actualizarla, con versiones exactas en `package.json`.
- Node.js en su última LTS.
- Una excepción solo se acepta con incompatibilidad declarada o probada. Se registra con
  evidencia en la tabla de `AGENTS.md` y se reevalúa en cada actualización.

Excepciones al 2026-09-26: TypeScript 6.0.3 (7.0.2 sin API JS para `typescript-eslint`),
ESLint 9.39.5 (el lint con ESLint 10 se cae en `eslint-plugin-react`, probado),
`@dnd-kit/core` 6.3.1 (la API nueva sigue en 0.x), Node 24 LTS y `@types/node` 24.

## Consecuencias

- El stack arranca al día y con evidencia de por qué algo no lo está.
- Cada actualización debe correr typecheck, lint, pruebas, builds y synth, y revisar la
  tabla de excepciones.
