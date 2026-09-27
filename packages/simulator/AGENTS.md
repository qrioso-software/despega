# @despega/simulator

- Motor puro: sin frameworks, sin I/O, sin variables de entorno, sin `Date.now()`
  implícito (el tiempo llega por parámetro). Lo importan web, admin y `@despega/data`.
- Es la única autoridad de puntaje, ramificación y memoria. Ninguna app reimplementa
  reglas del guión.
- El contenido de cada carrera es data en `src/modules/<carrera>.ts`. Cambios de
  escenas o puntajes: subir `version`, correr `validateModule` y las pruebas, y
  actualizar `docs/architecture/functional-analysis.md` si cambia un supuesto.
- `getPublicScene` nunca debe exponer claves de respuesta ni puntajes (hay una prueba).
- Toda interacción debe tener resultado para cualquier respuesta válida, incluido el
  tiempo agotado: no existe condición de derrota.
- Node ejecuta las pruebas quitando tipos: usar solo sintaxis borrable
  (`erasableSyntaxOnly`), imports relativos con extensión `.ts` e `import type` para
  tipos.
- Pruebas: `pnpm --filter @despega/simulator test`. Un tipo de interacción nuevo se
  agrega a `randomResponse` y `declaredOutcomes` de `src/minigames.test.ts`.
- Diseño: `docs/architecture/simulator-engine.md`.
