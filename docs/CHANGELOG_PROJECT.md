# Changelog del proyecto

## 2026-09-28 — Rediseño del backoffice como app

- El admin adopta el sistema visual de la web de estudiantes sobre HeroUI v3: radio
  base de 8 px (`--radius`), campos y botones de 12 px, tarjetas y tablas de 16 px
  con borde fino y sombra mínima. Los ajustes a componentes de HeroUI viven en
  `@layer components` de `styles.css`; no se agrega otra librería de UI.
- `AdminShell` a pantalla completa: barra lateral con secciones, acceso directo al
  guion de cada módulo y cuenta al pie; barra superior con migas derivadas de la ruta
  y aviso «Modo local · datos de DEV». En móvil: «atrás», menú de cuenta y pestañas
  inferiores. Las páginas ya no repiten enlaces de «volver».
- Acceso en pantalla dividida (panel oscuro con los usos del backoffice y tarjeta del
  formulario); campos con ícono y botón para mostrar u ocultar la contraseña
  (`InputGroup` de HeroUI), también en el cambio de contraseña del primer ingreso.
- Panel: indicadores con ícono, avance por sesión y estados vacíos. Estudiantes:
  buscador compacto con conteo, paginación con regreso al inicio y lista de filas en
  móvil. Ficha: avatar de iniciales, datos en una franja, sesiones con estado e
  íconos, radar más grande y decisiones como tarjetas en móvil. Módulos: jugables y
  «Próximamente» separados. Guion: personajes, saltos a cada sesión y escenas con
  número, pantalla e interacción.
- Íconos de carrera compartidos: `CAREER_ICONS` pasa de la web a `@despega/brand`
  (dependencia par `lucide-react` 1.48.0); web y admin lo usan en su `CareerIcon` y
  el admin deja de mostrar emojis.
- Sin cambios de rutas, datos, permisos, puntajes ni guion. Validación: `typecheck`,
  `lint`, 72 pruebas y `build:web`/`build:admin` pasan. Capturas del admin en
  1440 px y 390 px (acceso, panel, estudiantes, ficha, módulos y guion), menú de
  cuenta en móvil, escena desplegada, diálogo de reinicio abierto y cancelado, y rol
  de orientación sin botón de reinicio; todo en solo lectura, con los POST
  bloqueados salvo el ingreso local, que solo firma una cookie. El campo de
  contraseña (solo Cognito) no se vio en pantalla: el entorno local no lo muestra.

## 2026-09-28 — Rediseño de la web de estudiantes como app

- `/inicio` y el hub de carrera usan un shell a pantalla completa (`AppShell`):
  barra lateral con inicio y carreras, migas en la barra superior, cuenta y cierre
  de sesión; en móvil, barra superior con «atrás» y menú de cuenta. La navegación de
  la landing ya no aparece dentro de la app.
- Sistema visual unificado en `globals.css`: escala de radios (8/12/16 px), sombras
  más suaves, botones con variantes y tamaños, campos con ícono y botón para mostrar
  la contraseña. Íconos de carrera de línea (`CareerIcon`) en lugar de emojis.
- Inicio: tarjeta de carrera con sesiones sin textos truncados, panel de desempeño y
  afinidad en barras, y grilla de próximas carreras. Hub: portada, equipo, sesiones con
  sinopsis y progreso en una sola tarjeta; resultados con el recorrido en lista.
- Acceso: tarjeta con cabecera e insignia, enlace «¿La olvidaste?» junto a la
  contraseña, panel lateral con los tres ejes del juego. Saludo sin género.
- Reproductor a pantalla completa: HUD de una fila (salir, escena, estado del mundo,
  desempeño, perfil) con barra de avance de escenas. Las escenas de oficina son un
  espacio de trabajo de dos paneles (herramienta de PixelForge | «Tu respuesta/tarea»)
  con desplazamiento propio y la consecuencia acoplada al panel del jugador; en móvil
  se apilan. Cinemática y notificación ocupan todo el escenario. Mini-juegos con
  container queries para adaptarse al ancho del panel.
- Sin cambios de rutas, datos, puntajes ni guion. Validación: `typecheck` y `lint` de
  web; capturas en escritorio (1440 px) y móvil (390 px) de acceso, inicio, hub,
  reproductor y landing. El reproductor se revisó en solo lectura (POST bloqueados).

## 2026-09-28 — Local conectado a DynamoDB DEV, sin contenedor

- Decisión solicitada: localhost usa las tablas existentes `despega_dev_core` y
  `despega_dev_simulation` en `qrioso-dev` (`779926948601`, `us-east-1`). Se conserva
  `STAGE=local` y la identidad local por correo. ADR 0007 documenta alternativas y
  el efecto de las escrituras locales sobre datos compartidos de DEV.
- Actualizados `.env.example` y los `.env.local` ignorados de ambas apps. El SDK
  fija el perfil SSO local; Amplify conserva los roles SSR. Se rechazan endpoints
  personalizados y, en local, tablas de producción/ajenas a DEV u otras regiones.
- `local:setup` prepara los archivos locales que falten y valida cuenta/tablas,
  sin crear ni borrar registros. Los comandos `dev` lo ejecutan antes de arrancar.
- Eliminados Compose, creación de tablas locales y comandos Docker/reset. Retirados
  únicamente el contenedor `despega-dynamodb` y su red; volumen
  `despega-local_dynamodb-data` conservado, sin migración automática.
- Mensajes del acceso local actualizados para indicar DynamoDB DEV y renovación SSO.
- Validación: `typecheck`, `lint`, 72 pruebas y synth de ambos stages pasan. Lecturas
  reales `GetItem` en las dos tablas desde las configuraciones de web/admin, sin
  escrituras de prueba. Apps locales reiniciadas en puertos 3000/3001.
- Navegador: el ingreso con un correo sintético inexistente devuelve cuenta no
  registrada en DEV, no fallo de conexión; el panel admin carga su estado vacío
  real sin `DataUnavailable`. No se crea ningún usuario ni registro de prueba.
- Al revisar AWS se verificó que los jobs `4` de web/admin ya están `SUCCEED` en
  `9cbd877`. Esta tarea no inicia otro deploy, no hace commit/push ni modifica PRD.

## 2026-09-28 — Reducción del artefacto SSR sin aumentar capacidad

- Comparado el empaquetado con INAP: se conserva la materialización de dependencias
  y el filtrado después del build; no se copian exclusiones de UI específicas de INAP.
- Verificados los artefactos de los jobs `3` de ambas Apps: los mapas de Next ocupan
  93.715.552 bytes en cada uno. Sin esos mapas, web queda en 155.323.215 bytes y admin
  en 156.022.644, por debajo del límite de 230.686.720.
- Las pruebas de empaquetado se ejecutan para `apps/web` y `apps/admin`: 71 pruebas
  totales pasan, incluido infra (12); typecheck de infra y `diff:dev` pasan.
- Se mantiene `STANDARD_8GB` en ambas Apps. La infraestructura sigue en
  `CREATE_COMPLETE`; publicación pendiente de commit/push y nuevos jobs exitosos.

## 2026-09-27 — Infraestructura desplegada en `qrioso-dev`

- Cuenta `779926948601`, bootstrap v31, dominios `AVAILABLE` y commit `8764be9` en
  `develop` remoto verificados. `typecheck`, `lint` y las 65 pruebas previas pasaron.
- El primer `Despega-dev` terminó en `ROLLBACK_COMPLETE`: la respuesta completa de
  `Amplify.UpdateApp` excedió el límite de CloudFormation (`Response object is too long`).
- `ExistingAmplifyApp` filtra con `outputPaths` las respuestas de `updateApp` y
  `updateBranch` a sus identificadores, tanto al crear como al actualizar.
- El siguiente intento falló con `AccessDenied` en `UpdateBranch`, aunque el ARN y
  la política eran correctos: la dependencia entre constructs retrasaba la creación
  de los permisos de rama hasta después de invocar el proveedor compartido. La
  dependencia se aplica ahora solo al recurso de la llamada; la política se puede
  crear antes. No se amplían acciones ni recursos IAM.
- Pruebas de regresión para web/admin en `dev` y `prd`: las 8 pruebas de infra,
  `typecheck` y ambos `synth` pasan.
- Tras retirar con autorización los stacks revertidos, `Despega-dev` quedó en
  `CREATE_COMPLETE`. Se verificaron las variables efectivas de ambas ramas y sus
  roles SSR, y se lanzaron los builds `3` con el commit `8764be9`.
- Los builds automáticos `2` de Amplify fallaron antes de compilar por no disponer
  todavía de `AUTH_PROVIDER=cognito`. En los jobs `3`, ambos `next build` y TypeScript
  terminaron correctamente; Amplify rechazó después los artefactos por tamaño:
  249.038.767 bytes web y 249.738.196 admin, frente al máximo de 230.686.720 bytes.
- `prepare-amplify-next-runtime.mjs` retira únicamente los source maps de la copia
  materializada de Next.js y sus referencias en trazas. Conserva todos los archivos
  ejecutables, los binarios nativos y los mapas de la aplicación. Rechaza un Next
  enlazado para no modificar el almacén compartido de pnpm.
- Validación contra el artefacto real de web del job `3`: 2.693 mapas retirados
  (93.715.552 bytes), 7.670 archivos de runtime sin cambios; cómputo SSR reducido a
  155.323.215 bytes. Dos pruebas cubren integridad, trazas, idempotencia y protección
  del paquete enlazado. Las 10 pruebas de infra pasan; corrección pendiente de push.
- El build local de esta sesión sigue bloqueado por `EPERM` al abrir un puerto de
  Turbopack; no se toma como evidencia de un build exitoso ni de un defecto de la app.

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
