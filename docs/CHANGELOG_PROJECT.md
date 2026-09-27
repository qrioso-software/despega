# Changelog del proyecto

## 2026-09-27 — Identidad visual desde el logo

- Nuevo paquete `@despega/brand`: el logo original (movido desde la raíz), su versión
  vectorial `despega-logo.svg` (17,6 KB frente a 60 KB del JPEG, fondo transparente),
  el isotipo, los íconos y el componente `DespegaLogo`, que reemplaza en web y admin el
  cohete provisional dibujado en código.
- Paleta derivada del logo en `@despega/brand/palette.css`: navy `#17233b`, verde de la
  llama `#75be65` para la acción principal y el logro, azul `#2564d0` del tono del navy
  para la interacción. Reemplaza la paleta provisional (naranja, violeta y crema). La
  web la mapea en su `@theme` y el admin en las variables de HeroUI (ADR 0006).
- Web: los tokens `violet` pasan a `accent`; nuevos `brand-hover` y `good`/`bad`/`sun`
  `-strong` para texto sobre fondos suaves. Radar, reloj, medidor de riesgo, ventanas
  de oficina, gráfico de quejas y degradados usan tokens en lugar de hex. Sobre el verde
  el texto va en tinta. `good` pasa de verde azulado al verde de la marca.
- Web y admin sirven `favicon.ico`, `icon.svg` y `apple-icon.png` (isotipo sobre navy);
  antes no había ícono y la consola registraba un 404.

## 2026-09-27 — Dominios de `dev` y preparación del primer deploy

- Apps de Amplify de `dev` registradas en `infra/cdk.json`: web `dwc3j5j9ebtdk` y admin
  `d20sgf4s7cvg7l`, `WEB_COMPUTE`, raíces monorepo `apps/web` y `apps/admin`, rama
  `develop`.
- Dominios `https://despega.qrioso.do` (web) y `https://despega.admin.qrioso.do` (admin):
  zonas de Route 53 en `qrioso-dev`, delegadas por NS desde `qrioso.do`
  (`qrioso-main`), y asociaciones de Amplify en estado `AVAILABLE`. `.env.develop` de
  ambas apps usa esos orígenes.
- `amplify.yml` verificado con una simulación completa del build de web y admin desde
  una copia limpia del repositorio. Los jobs `1` fallaron en `write-amplify-env.mjs`,
  como se esperaba, porque las variables de rama llegan con `deploy:dev`.

## 2026-09-26 — Verificación de los mini-juegos

- Batería exhaustiva del motor (`packages/simulator/src/minigames.test.ts`): cada
  mini-juego con todas sus respuestas posibles (81 tableros de clasificación, 20
  mensajes en cualquier orden, 12 secuencias, 24 tableros, 209 emparejamientos, umbrales
  del dashboard), entradas inválidas y 600 partidas aleatorias que alcanzan todos los
  resultados del guión sin filtrar respuestas en la escena pública.
- E2E en navegador de los siete mini-juegos: toques, arrastre con mouse y con el dedo,
  solo teclado, los cuatro relojes vencidos y celular de 390 px.
- Corregido: en pantallas táctiles, tocar una tarjeta arrastrable durante 160 ms o más
  no hacía nada (dnd-kit lo convertía en un arrastre sin movimiento y bloqueaba el
  clic). `DragBoard` y `DraggableCard` lo resuelven como toque.
- Corregido: las instrucciones y los anuncios de arrastre para lectores de pantalla
  estaban en inglés y describían un arrastre con teclado que no existe.
- Guión v2, sin cambios de puntaje: tres reacciones contradecían la jugada (1.3 «Se nos
  fue el tiempo» sin tiempo agotado; 1.5 Andrés pregunta la hora que el correo ya
  prometía; 2.3 Camila agradece «ideas» que no se propusieron).

## 2026-09-26 — Ambiente `dev` en la cuenta de Qrioso

- `dev` usa la cuenta de desarrollo de Qrioso (`779926948601`, perfil `qrioso-dev`) en
  `infra/cdk.json` y en los scripts de `infra`. Los App IDs de Amplify quedan vacíos hasta
  crear las Apps.
- El deploy sigue el flujo del proyecto de referencia: `validate-amplify-domains.ts`
  exige cuenta, App IDs y dominios disponibles antes de `cdk deploy`.
- Un primer `Despega-dev` (tablas y pools, sin datos) quedó en la cuenta de Zendo
  (`746914061512`) antes de elegir `qrioso-dev`; está pendiente retirarlo.

## 2026-09-26 — Inicio del proyecto y prototipo funcional

- Documento funcional del cliente guardado en `docs/funtional.md`.
- Monorepo pnpm basado en la arquitectura de Librería El Maestro, sin API Gateway:
  `apps/web`, `apps/admin`, `packages/simulator`, `packages/data`, `packages/auth`, `infra`.
- Política de versiones: última estable con excepciones documentadas (TypeScript 6,
  ESLint 9, `@dnd-kit/core`, Node 24 LTS). ADR 0005.
- Motor declarativo del simulador y guión completo de «Tu semana en PixelForge». ADR 0002.
- Web de estudiantes: landing, registro/ingreso, panel, reproductor con las 5 mecánicas,
  relojes, HUD, personajes animados, resúmenes con radar y proyección de carrera.
- Backoffice con HeroUI v3: panel del piloto, estudiantes, detalle con registro de
  decisiones, reinicio de intentos y visor del guión con puntajes.
- DynamoDB: tablas `core` y `simulation`, progreso por carrera y eventos por intento.
  ADR 0003.
- Identidad: Cognito con pools de estudiantes y staff, y proveedor local para
  desarrollo. ADR 0004.
- CDK: stack `Despega-<stage>` con roles SSR de mínimo privilegio y feature flags
  recomendadas; DynamoDB Local para desarrollo.
