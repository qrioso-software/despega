# Web de estudiantes y simulador

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Alcance

- Next.js 16 App Router, puerto local `3000`, desplegada en AWS Amplify (SSR).
- Landing pública, registro/ingreso de estudiantes, `/inicio` y el simulador en
  `/simulador/[careerId]` (hub y resultados) y `/simulador/[careerId]/jugar` (reproductor).
- No hay API Gateway: Server Components leen DynamoDB con `@despega/data` y las
  mutaciones son Server Actions. Nunca se accede a AWS desde el navegador.

## Reglas

- Priorizar Server Components. Client Components solo para interacción, animación,
  temporizadores o APIs del navegador (el reproductor y sus pantallas).
- El servidor es la autoridad del simulador: el cliente envía **la respuesta** del
  jugador (`SceneResponse`), nunca puntajes. `submitSceneAction` valida con Zod,
  autentica, evalúa con el motor y persiste con concurrencia optimista.
- La escena que recibe el cliente es `PublicScene`: sin claves de respuesta ni
  puntajes. No agregar al cliente datos del guión que revelen la respuesta correcta.
- El guión y los puntajes viven en `packages/simulator`; aquí no se escriben textos de
  historia ni reglas de puntaje. Las pantallas son genéricas por tipo (`screen`) e
  interacción (`interaction.kind`) para servir a los 14 módulos previstos.
- Toda decisión muestra consecuencia narrativa (`OutcomeSheet`); nunca solo
  «correcto/incorrecto». Ningún error bloquea el avance sin opción de reintento.
- Interacciones de arrastre: usar `DragBoard` y `DraggableCard` de `dnd.tsx`, nunca un
  `DndContext` suelto. Aseguran tocar (de cualquier duración) o teclado como
  alternativa al arrastre, y anuncios en español para lectores de pantalla.
- Gráficas: serie única, trazo de 2 px, textos en tokens de tinta y su gemelo
  accesible en barras (`AffinityBars`). No colorear texto con el color de la serie.
- Identidad: `src/lib/auth.ts` (server-only) y `src/proxy.ts`. Cognito en dev/prd; el
  proveedor `local` solo existe con `STAGE=local` y host loopback.
- `.env.example` es el contrato de variables. Mantener las mismas keys en `.env.local`,
  `.env.develop` y `.env.production`; CDK carga los dos últimos según el stage.
  No poner secretos en estos archivos.
- Tailwind CSS 4: los tokens de marca están en `src/app/globals.css` (`@theme`).
