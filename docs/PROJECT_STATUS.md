# Estado del proyecto

Última actualización: 2026-09-28.

## Fase

**Infraestructura DEV desplegada; apps pendientes por tamaño del artefacto.** El módulo piloto
(Ingeniería de Software) se juega de principio a fin con persistencia real en
DynamoDB Local. `Despega-dev` está en `CREATE_COMPLETE` en `qrioso-dev`
(`779926948601`, `us-east-1`), con tablas, dos pools de Cognito y roles SSR. Los builds
`3` de web y admin compilaron el commit `8764be9`, pero Amplify rechazó los artefactos
por superar 220 MiB. La corrección local del empaquetado está probada contra el
artefacto real: web baja de 249.038.767 a 155.323.215 bytes, sin cambiar el runtime.
Falta subirla, relanzar los builds y verificar las URLs públicas.

## Hecho y verificado

| Área | Estado | Evidencia |
| --- | --- | --- |
| Monorepo pnpm (web, admin, simulator, data, auth, brand, infra) | Listo | `pnpm typecheck`, `pnpm lint` en verde |
| Motor del simulador + guión completo (3 sesiones, 19 escenas, 10 tipos de interacción; guión v2) | Listo | 40 pruebas: mejor camino 91 pts, peor camino 32 pts, ramificación y memoria; cada mini-juego con todas sus respuestas posibles y 600 partidas aleatorias |
| Web: landing, registro/ingreso, `/inicio`, hub, reproductor y resultados | Listo | E2E en navegador: módulo completo en escritorio y móvil (390 px), sin errores de consola. Mini-juegos verificados con toques (de cualquier duración), arrastre con mouse y con el dedo, y solo teclado |
| Relojes reales (45, 15, 20, 60 s) con consecuencia al vencer | Listo | E2E del peor camino dejando vencer los cuatro relojes |
| Backoffice HeroUI: panel, estudiantes, detalle con decisiones, reinicio, visor del guión | Listo | E2E con roles de administración y orientación |
| Capa de datos DynamoDB (transacciones, concurrencia optimista, sin Scan) | Listo | Pruebas de datos + uso real contra DynamoDB Local |
| Identidad local (web y admin) | Listo | E2E |
| Identidad Cognito (registro, confirmación, ingreso, recuperación, contraseña nueva de staff, refresh, revocación) | Implementada, **sin probar contra un pool real** | Pruebas unitarias de sesión y errores |
| CDK: tablas, dos pools, roles SSR mínimos, config de Apps Amplify, validación IAM | Desplegado en `qrioso-dev` | `Despega-dev CREATE_COMPLETE`; 12 pruebas de infra/empaquetado, `synth:dev` y `synth:prd` pasan; `diff:dev` sin diferencias; variables efectivas y roles de ambas ramas verificados |
| Flujo de deploy igual al del proyecto de referencia | Listo | `validate-amplify-domains.ts` idéntico; `cdk.json` con cuenta, perfil, rama y App IDs por stage |
| Builds de producción de web y admin | Compilan; publicación pendiente | Jobs `3`: Next compila y pasa TypeScript; Amplify rechaza el tamaño del artefacto. Corrección local comparada con INAP; cuatro pruebas de regresión cubren ambas apps sin aumentar capacidad |
| Identidad visual desde el logo (`@despega/brand`: logo vectorial, paleta, íconos) en web y admin | Listo | Contraste WCAG AA de cada par texto/fondo en uso; capturas de landing (escritorio y 390 px), ingreso, `/inicio`, hub, reproductor y backoffice; `favicon.ico`, `icon.svg` y `apple-icon.png` servidos en ambas apps |

## Pendiente / bloqueos

1. **Publicación de web/admin**: commit/push de la corrección de empaquetado (pendiente
   de autorización), relanzar los builds y verificar HTTP y navegador. Crear el primer
   usuario del staff cuando se indique su correo. Los intentos fallidos
   del stack se retiraron con autorización, conservando Apps, dominios y logs. Las
   correcciones de infraestructura y la documentación siguen pendientes de commit/push.
2. **Cuentas AWS**: `dev` = `qrioso-dev` (`779926948601`). Falta `prd` y la cuenta
   principal de DESPEGA; registrar sus IDs en `infra/cdk.json`.
3. **Retirar `Despega-dev` de la cuenta de Zendo** (`746914061512`): se desplegó ahí el
   2026-09-26 antes de elegir `qrioso-dev`. Solo tablas vacías y dos pools sin usuarios;
   `cdk destroy` pendiente de autorización.
4. **Dominios de `prd`** en `.env.production` (hoy `*.despega.example`).
5. **Validar Cognito** en `dev` (registro, confirmación, recuperación, primer ingreso
   de staff) y configurar SES para correos.
6. **Validación del cliente** de los supuestos de puntaje y de las preguntas abiertas
   (`docs/architecture/functional-analysis.md`).
7. **Repositorio Git remoto**: `qrioso-software/despega`, conectado a las Apps de
   Amplify de `dev` sobre `develop`.

## Siguiente paso recomendado

Subir la corrección de empaquetado y completar la publicación/verificación en Amplify.
Luego crear el primer administrador y validar los flujos reales de Cognito y una
sesión del simulador en DEV. Las correcciones y esta documentación están aún locales;
el último commit remoto es `8764be9`.
