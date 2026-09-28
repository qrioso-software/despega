# ADR 0007: aplicaciones locales con DynamoDB de DEV

- Estado: aceptado
- Fecha: 2026-09-28

## Contexto

El operador solicita usar en localhost la base de datos AWS de `qrioso-dev`, como
en sus otros proyectos, y retirar el contenedor de Docker. Es una decisión técnica
de operación, no un cambio al documento funcional ni al motor del simulador.

## Decisión

- Mantener `STAGE=local`, los orígenes localhost y el proveedor de identidad local.
- Usar `despega_dev_core` y `despega_dev_simulation` en `us-east-1`, cuenta
  `779926948601`, con el perfil SSO `qrioso-dev` fijado en el cliente local.
- Rechazar endpoints personalizados, tablas ajenas a DEV y otras regiones en local.
- Verificar cuenta SSO y tablas antes de `pnpm dev`; no crearlas, vaciarlas ni copiar
  datos automáticamente. CDK sigue siendo la autoridad de infraestructura.
- Eliminar Compose, el creador de tablas locales y los comandos Docker/reset.
  Retirar el contenedor y la red; conservar el volumen anterior como respaldo
  inactivo, sin migrarlo a AWS.
- En Amplify continuar usando Cognito y los roles SSR, sin perfiles locales.

## Alternativas

- DynamoDB Local: aislaba los datos y permitía trabajar sin AWS, pero requiere el
  contenedor que el operador decidió retirar.
- Tablas AWS exclusivas para localhost: dan aislamiento, pero no cumplen la
  decisión de compartir la base DEV existente y añaden infraestructura.

## Consecuencias

- Se requiere internet y una sesión SSO vigente; si vence, renovar con
  `aws sso login --profile qrioso-dev`.
- Las pruebas locales afectan datos compartidos de DEV y generan consumo AWS.
- Las identidades locales `local-<hash>` no equivalen a usuarios de Cognito.
  El backoffice local puede operar sobre datos DEV con el rol local elegido:
  reservarlo para operadores de confianza y no usar datos reales de menores.
- No hay migración automática del volumen antiguo ni borrado de datos de AWS.
