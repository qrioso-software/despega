# Estado del proyecto

Última actualización: 2026-09-28.

## Fase

**Infraestructura y apps DEV desplegadas; localhost usa DynamoDB de DEV.** El módulo
piloto (Ingeniería de Software) se juega de principio a fin. `Despega-dev` está
desplegado en `qrioso-dev` (`779926948601`, `us-east-1`), con tablas, dos pools de
Cognito y roles SSR. Los jobs `4` de web y admin terminaron `SUCCEED` con el commit
`9cbd877`, que corrige el tamaño del artefacto sin aumentar capacidad.
Por solicitud del operador, las apps locales ahora usan las tablas DEV mediante
SSO, conservando la identidad local por correo. El contenedor Docker fue retirado
y su volumen se conserva sin migración. Falta validar los flujos Cognito en AWS.

## Hecho y verificado

| Área | Estado | Evidencia |
| --- | --- | --- |
| Monorepo pnpm (web, admin, simulator, data, auth, brand, infra) | Listo | `pnpm typecheck`, `pnpm lint` en verde |
| Motor del simulador + guión completo (3 sesiones, 19 escenas, 10 tipos de interacción; guión v2) | Listo | 40 pruebas: mejor camino 91 pts, peor camino 32 pts, ramificación y memoria; cada mini-juego con todas sus respuestas posibles y 600 partidas aleatorias |
| Web: landing, registro/ingreso, `/inicio`, hub, reproductor y resultados | Listo | E2E en navegador: módulo completo en escritorio y móvil (390 px), sin errores de consola. Mini-juegos verificados con toques (de cualquier duración), arrastre con mouse y con el dedo, y solo teclado |
| Relojes reales (45, 15, 20, 60 s) con consecuencia al vencer | Listo | E2E del peor camino dejando vencer los cuatro relojes |
| Backoffice HeroUI: panel, estudiantes, detalle con decisiones, reinicio, visor del guión | Listo | E2E con roles de administración y orientación |
| Capa de datos DynamoDB (transacciones, concurrencia optimista, sin Scan) | Listo | 9 pruebas de datos; lecturas reales `GetItem` desde ambas configuraciones locales contra las dos tablas DEV, sin escrituras de prueba |
| Identidad local (web y admin) | Listo | E2E |
| Identidad Cognito (registro, confirmación, ingreso, recuperación, contraseña nueva de staff, refresh, revocación) | Implementada, **sin probar contra un pool real** | Pruebas unitarias de sesión y errores |
| CDK: tablas, dos pools, roles SSR mínimos, config de Apps Amplify, validación IAM | Desplegado en `qrioso-dev` | `Despega-dev CREATE_COMPLETE`; 12 pruebas de infra/empaquetado, `synth:dev` y `synth:prd` pasan; `diff:dev` sin diferencias; variables efectivas y roles de ambas ramas verificados |
| Flujo de deploy igual al del proyecto de referencia | Listo | `validate-amplify-domains.ts` idéntico; `cdk.json` con cuenta, perfil, rama y App IDs por stage |
| Builds de producción de web y admin | Publicados en DEV | Jobs `4` de ambas Apps `SUCCEED`, commit `9cbd877`; empaquetado corregido sin aumentar capacidad. Flujos autenticados en AWS pendientes |
| Web de estudiantes como app: shell a pantalla completa, sistema visual unificado (radios, botones, campos con ícono) | Listo | Capturas en 1440 px y 390 px de acceso, `/inicio`, hub, reproductor y landing; `typecheck` y `lint` de web |
| Backoffice como app: shell a pantalla completa, escala de radios de la web sobre HeroUI, acceso con campos con ícono, listas en móvil | Listo | Capturas en 1440 px y 390 px de acceso, panel, estudiantes, ficha, módulos y guion; menú de cuenta, reinicio (cancelado) y rol de orientación; `typecheck`, `lint`, pruebas y `build:admin` |
| Identidad visual desde el logo (`@despega/brand`: logo vectorial, paleta, íconos de app y de carrera) en web y admin | Listo | Contraste WCAG AA de cada par texto/fondo en uso; capturas de landing (escritorio y 390 px), ingreso, `/inicio`, hub, reproductor y backoffice; `favicon.ico`, `icon.svg` y `apple-icon.png` servidos en ambas apps |

## Pendiente / bloqueos

1. **Validación funcional en AWS**: jobs `4` publicados; verificar las URLs y los
   flujos autenticados. Crear el primer usuario del staff cuando se indique su correo.
   El cambio de conexión local a DEV y su documentación todavía no están en Git remoto.
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
8. **Revisión visual del reproductor rediseñado**: solo se vio la escena de chat 1.4.
   Faltan clasificación, tablero, dashboard en vivo, videollamada, cinemática,
   notificación, resúmenes y la consecuencia acoplada; avanzar el juego escribe en
   las tablas compartidas de DEV, así que requiere una cuenta de prueba autorizada.

## Siguiente paso recomendado

Validar los flujos reales de Cognito y una sesión del simulador en DEV. Para trabajar
en localhost: `aws sso login --profile qrioso-dev` y `pnpm dev`; las escrituras van a
la base compartida de DEV. El cambio local no implica otro deploy ni migración de datos.
