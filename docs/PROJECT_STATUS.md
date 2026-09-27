# Estado del proyecto

Última actualización: 2026-09-26.

## Fase

**Prototipo funcional local.** El módulo piloto (Ingeniería de Software) se juega de
principio a fin con persistencia real en DynamoDB Local. El stage `dev` apunta a la
cuenta de desarrollo de Qrioso (`qrioso-dev`) y espera los IDs de sus Apps de Amplify y
sus dominios para el primer deploy.

## Hecho y verificado

| Área | Estado | Evidencia |
| --- | --- | --- |
| Monorepo pnpm (web, admin, simulator, data, auth, infra) | Listo | `pnpm typecheck`, `pnpm lint` en verde |
| Motor del simulador + guión completo (3 sesiones, 19 escenas, 10 tipos de interacción; guión v2) | Listo | 40 pruebas: mejor camino 91 pts, peor camino 32 pts, ramificación y memoria; cada mini-juego con todas sus respuestas posibles y 600 partidas aleatorias |
| Web: landing, registro/ingreso, `/inicio`, hub, reproductor y resultados | Listo | E2E en navegador: módulo completo en escritorio y móvil (390 px), sin errores de consola. Mini-juegos verificados con toques (de cualquier duración), arrastre con mouse y con el dedo, y solo teclado |
| Relojes reales (45, 15, 20, 60 s) con consecuencia al vencer | Listo | E2E del peor camino dejando vencer los cuatro relojes |
| Backoffice HeroUI: panel, estudiantes, detalle con decisiones, reinicio, visor del guión | Listo | E2E con roles de administración y orientación |
| Capa de datos DynamoDB (transacciones, concurrencia optimista, sin Scan) | Listo | Pruebas de datos + uso real contra DynamoDB Local |
| Identidad local (web y admin) | Listo | E2E |
| Identidad Cognito (registro, confirmación, ingreso, recuperación, contraseña nueva de staff, refresh, revocación) | Implementada, **sin probar contra un pool real** | Pruebas unitarias de sesión y errores |
| CDK: tablas, dos pools, roles SSR mínimos, config de Apps Amplify, validación IAM | Sintetiza en `dev` y `prd` | 6 pruebas de plantilla, `synth` limpio con feature flags recomendadas |
| Flujo de deploy igual al del proyecto de referencia | Listo | `validate-amplify-domains.ts` idéntico; `cdk.json` con cuenta, perfil, rama y App IDs por stage |
| Builds de producción de web y admin | Listo | `next build` sin errores |

## Pendiente / bloqueos

1. **Cuentas AWS**: `dev` = `qrioso-dev` (`779926948601`). Falta `prd` y la cuenta
   principal; registrar sus IDs en `infra/cdk.json`. Verificar el bootstrap de CDK en
   `qrioso-dev` antes del primer deploy.
2. **Apps Amplify** de `dev` (web y admin) conectadas al repositorio en la rama
   `develop`, con sus IDs en `infra/cdk.json` (requiere antes el repositorio remoto).
   Luego, deploy y primer usuario del staff.
3. **Retirar `Despega-dev` de la cuenta de Zendo** (`746914061512`): se desplegó ahí el
   2026-09-26 antes de elegir `qrioso-dev`. Solo tablas vacías y dos pools sin usuarios;
   `cdk destroy` pendiente de autorización.
4. **Dominios reales** en `.env.develop`/`.env.production` (hoy `*.despega.example`).
5. **Validar Cognito** en `dev` (registro, confirmación, recuperación, primer ingreso
   de staff) y configurar SES para correos.
6. **Validación del cliente** de los supuestos de puntaje y de las preguntas abiertas
   (`docs/architecture/functional-analysis.md`).
7. **Repositorio Git remoto**: el repositorio local está inicializado sin commits.

## Siguiente paso recomendado

Subir el repositorio a un remoto, crear las dos Apps de Amplify en `qrioso-dev` con sus
dominios, registrar los App IDs en `infra/cdk.json` y ejecutar `pnpm infra:deploy:dev`. En paralelo, revisar con
el cliente el guión y los puntajes desde el visor del backoffice
(`/modulos/ingenieria-software`).
