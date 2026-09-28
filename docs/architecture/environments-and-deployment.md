# Ambientes y despliegue

Estado: `dev` apunta a la cuenta de desarrollo de Qrioso (`779926948601`, perfil
`qrioso-dev`), con sus Apps de Amplify registradas en `infra/cdk.json` y sus dominios
`AVAILABLE`. `Despega-dev` está en `CREATE_COMPLETE` tras corregir el configurador de
Amplify. Tras el rechazo por tamaño de los jobs `3`, los jobs `4` de ambas apps
(`9cbd877`, rama `develop`) terminaron `SUCCEED`, sin aumentar capacidad.
`prd` sintetiza pero no tiene cuenta ni despliegue.

## Matriz

| Rol | Stage CDK | Perfil AWS | Cuenta | Rama Amplify |
| --- | --- | --- | --- | --- |
| desarrollo | `dev` | `qrioso-dev` | `779926948601` | `develop` |
| producción | `prd` | `despega-prd` | pendiente | `main` |
| principal/DNS | — | `despega-main` | pendiente | — |

Región `us-east-1`. Cuentas separadas con AWS Control Tower, como en el proyecto de
referencia. Nunca se comparten tablas, pools ni roles entre cuentas: se promueve código,
no recursos.

El perfil de cada stage vive en `infra/cdk.json` y en los scripts de `infra/package.json`;
`.envrc` (direnv) exporta `AWS_PROFILE=qrioso-dev` para la AWS CLI local, igual que en el
proyecto de referencia. Los recursos de DESPEGA se distinguen por el stack
`Despega-<stage>`, el prefijo `despega_<stage>_` y la etiqueta `Project=despega`.

## Desarrollo local con DynamoDB de DEV

| Pieza | Local |
| --- | --- |
| Datos | DynamoDB administrado en `qrioso-dev` (`779926948601`, `us-east-1`) |
| Tablas | `despega_dev_core` y `despega_dev_simulation`, existentes y administradas por CDK |
| Credenciales | Perfil SSO `qrioso-dev` fijado por el cliente de datos con `STAGE=local` |
| Identidad | `AUTH_PROVIDER=local`: correo sin contraseña (web) y correo + rol (admin), cookies firmadas, solo desde localhost |

```sh
pnpm install
aws sso login --profile qrioso-dev
pnpm local:setup      # prepara .env.local si falta y verifica cuenta/tablas
pnpm dev              # http://localhost:3000 (web) y http://localhost:3001 (admin)
```

`pnpm dev`, `dev:web` y `dev:admin` ejecutan la verificación antes de arrancar; no
crean ni borran tablas. `DYNAMODB_ENDPOINT` debe estar vacío. La configuración de
datos rechaza tablas ajenas a DESPEGA DEV y otras regiones cuando `STAGE=local`.
El SDK resuelve las credenciales SSO; nunca se copian claves a `.env.local`.

Las escrituras y reinicios de intentos desde localhost afectan **datos compartidos
de DEV**. El acceso local por correo sigue limitado a loopback y crea identidades
`local-<hash>` distintas de Cognito. No se migran registros del contenedor anterior.
Se retira el contenedor y su red, conservando el volumen `despega-local_dynamodb-data`
como respaldo inactivo. Decisión técnica solicitada: [ADR 0007](../decisions/0007-local-con-dynamodb-dev.md).

## Variables de aplicación

| Uso | Archivo |
| --- | --- |
| local | `apps/<app>/.env.local` |
| `dev` | `apps/<app>/.env.develop` |
| `prd` | `apps/<app>/.env.production` |

`apps/<app>/.env.example` es el contrato versionado; los otros tres están ignorados por
Git y deben tener **exactamente** las mismas keys (el synth falla si no).

| Key | Web | Admin | En `dev`/`prd` |
| --- | --- | --- | --- |
| `AMPLIFY_MONOREPO_APP_ROOT` | `apps/web` | `apps/admin` | validado por CDK |
| `AMPLIFY_NEXTJS_EXPERIMENTAL_TRACE` | `true` | `true` | — |
| `STAGE` | ✔ | ✔ | debe ser `dev` o `prd` |
| `SITE_URL`, `NEXT_PUBLIC_APP_URL` | ✔ | `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_WEB_APP_URL` | orígenes HTTPS reales |
| `AUTH_PROVIDER` | ✔ | ✔ | debe ser `cognito` |
| `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID` | pool de estudiantes | pool de staff | CDK los reemplaza con outputs |
| `DATA_REGION`, `DYNAMODB_TABLE_CORE`, `DYNAMODB_TABLE_SIMULATION` | ✔ | ✔ | CDK los reemplaza con outputs |
| `DYNAMODB_ENDPOINT` | vacío | vacío | debe estar vacío |

Dominios de `dev`: web `https://despega.qrioso.do` (App `dwc3j5j9ebtdk`) y admin
`https://despega.admin.qrioso.do` (App `d20sgf4s7cvg7l`), ambos sobre la rama `develop`.
Cada uno tiene su zona pública de Route 53 en `qrioso-dev`, delegada con un registro NS
desde la zona `qrioso.do` de la cuenta principal de Qrioso (perfil `qrioso-main`), igual
que los demás subdominios de la cuenta. Amplify crea en esas zonas los registros de
validación del certificado y de tráfico. `.env.production` todavía usa marcadores
(`*.despega.example`): reemplazarlos cuando exista `prd`.

En Amplify, `infra/scripts/write-amplify-env.mjs` genera `.env.production` durante el
build solo con las keys del contrato y los valores de la rama. También rechaza
`AUTH_PROVIDER` distinto de `cognito` y cualquier `DYNAMODB_ENDPOINT`.

## Empaquetado SSR

Amplify [limita el artefacto SSR a 220 MiB](https://docs.aws.amazon.com/amplify/latest/userguide/troubleshooting-SSR.html).
Después de `next build`, `amplify.yml` materializa `apps/<app>/node_modules` y ejecuta
`prepare-amplify-next-runtime.mjs`: resuelve los alias de Turbopack, completa las
dependencias de runtime y las trazas, y retira los `.map` de la copia de Next.js.
El script rechaza un paquete Next enlazado para no borrar archivos del almacén de
pnpm; debe ejecutarse después de la materialización, nunca contra los enlaces del
entorno de desarrollo.

Solo se omiten mapas de depuración de la dependencia Next, no código ejecutable ni
binarios como Sharp; los mapas de la aplicación se conservan. Las trazas `.nft.json`
se limpian de referencias a los mapas eliminados. El artefacto real del job `3` de
web pasó de 249.038.767 a 155.323.215 bytes en la verificación local; esta medición no
sustituye un job exitoso y un smoke test del siguiente despliegue.

La comparación con INAP (2026-09-28) confirma el mismo patrón de materialización y
filtrado del runtime después del build. Sus exclusiones de HeroUI/PrimeReact son
específicas de aquella aplicación y no se trasladan a DESPEGA. En ambos artefactos
fallidos de DESPEGA hay 2.693 mapas de Next (93.715.552 bytes); retirarlos deja el
cómputo en 155.323.215 bytes para web y 156.022.644 para admin. No se cambia el
tipo de cómputo `STANDARD_8GB` ni la capacidad de las Apps. Las pruebas cubren las
dos raíces del monorepo, preservación del runtime, trazas, idempotencia y protección
del almacén compartido de pnpm.

## Qué crea el stack

- Tablas `core` y `simulation` con sus índices.
- Pool de estudiantes (registro propio, verificación por código, contraseña ≥ 8 con
  minúsculas y números) y su App Client `web-client`.
- Pool de staff (sin registro propio, contraseña ≥ 12), App Client `admin-client` y
  grupos `despega/admin` y `despega/counselor`.
- Por cada App Amplify existente: rol de servicio (logs) y **rol de cómputo SSR** con
  los permisos DynamoDB de `data-model.md`. Un custom resource configura el App como
  `WEB_COMPUTE` y actualiza la rama y sus variables; no crea ni borra el App.
  Sus llamadas `updateApp` y `updateBranch` devuelven a CloudFormation únicamente
  `app.appId` y `branch.branchName` mediante `outputPaths`, en creación y actualización.
  La respuesta completa (incluido el buildspec) puede superar el límite de 4.096 bytes
  de los custom resources; [AWS documenta este filtro](https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk.custom_resources/README.html#restricting-the-output-of-the-custom-resource).
  La llamada de rama depende de la configuración del App, pero su política IAM no:
  debe poder crearse antes de la primera invocación del proveedor Lambda compartido.
  Una dependencia sobre el construct entero retrasaba esa política y produjo un
  `AccessDenied` por visibilidad de permisos durante el primer despliegue. Las pruebas
  verifican este orden, sin ampliar los permisos sobre Apps, ramas o `PassRole`.
- Validación de synth: ninguna política puede incluir `dynamodb:Scan` ni acciones fuera
  de la lista permitida.

## Primer despliegue

Mismo flujo que el proyecto de referencia: las Apps de Amplify y sus dominios existen
antes del deploy, y `deploy:<stage>` corre primero `validate-amplify-domains.ts`, que
exige la cuenta correcta, ambos App IDs y que cada `SITE_URL`/`NEXT_PUBLIC_APP_URL` sea un
dominio `AVAILABLE` de la rama del stage.

1. Cuenta y perfil SSO del stage registrados en `infra/cdk.json` y en `AGENTS.md`
   (`dev` ya lo está: `qrioso-dev`; `prd` y `despega-main` pendientes).
2. Crear en cada cuenta dos Apps de Amplify conectadas al repositorio (raíz monorepo
   `apps/web` y `apps/admin`) sobre la rama del stage. Copiar sus IDs en
   `webAmplifyAppId` y `adminAmplifyAppId` de `infra/cdk.json`.
3. Completar los dominios reales en `.env.develop` y `.env.production` de ambas apps y
   asociarlos en Amplify (el deploy valida que estén `AVAILABLE`).
4. Con autorización explícita: `pnpm infra:bootstrap:dev`, `pnpm infra:diff:dev` y
   `pnpm infra:deploy:dev`.
5. Crear el primer usuario del staff en el pool de staff (contraseña temporal) y
   agregarlo al grupo `despega/admin`. Al ingresar, el backoffice pedirá la contraseña
   nueva.
6. Verificar: registro y confirmación de estudiante, una sesión completa, panel y
   detalle en el backoffice.
7. Para producción, repetir con `prd` solo con autorización explícita en esa tarea.

Antes de abrir el piloto a estudiantes reales, configurar SES para los correos de
Cognito (el envío por defecto tiene un límite diario bajo) y revisar la retención de
logs.

## Comandos

```sh
pnpm infra:synth:dev   # sin credenciales: valida plantilla, contrato de variables e IAM
pnpm infra:synth:prd
pnpm infra:diff:dev    # requiere sesión SSO: aws sso login --profile qrioso-dev
pnpm infra:deploy:dev  # requiere autorización explícita
```
