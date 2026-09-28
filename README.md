# DESPEGA

Simulador de inmersión de carreras para estudiantes de 15 a 18 años: una historia
jugable donde viven una profesión antes de elegir qué estudiar. El piloto es
**Ingeniería de Software — «Tu semana en PixelForge»**.

## Estructura

```text
apps/
  web/          Next.js 16 · landing, estudiantes y simulador (puerto 3000)
  admin/        Next.js 16 + HeroUI v3 · backoffice (puerto 3001)
packages/
  simulator/    motor puro + guiones de carrera
  data/         DynamoDB: esquema, repositorios y casos de uso (server-only)
  auth/         Cognito del lado del servidor + sesión local
infra/          AWS CDK v2 (Amplify, DynamoDB, Cognito) y verificación de acceso local
docs/           documento funcional, arquitectura, ADRs y estado
```

## Requisitos

- Node.js 24 LTS (`.nvmrc`) y pnpm 12 (se descarga solo por `packageManager`).
- AWS CLI y perfil SSO `qrioso-dev` (cuenta `779926948601`). No requiere Docker.

## Arrancar en local

```sh
pnpm install
aws sso login --profile qrioso-dev
pnpm local:setup   # prepara .env.local si falta y verifica cuenta/tablas DEV
pnpm dev           # web http://localhost:3000 · admin http://localhost:3001
```

Las apps corren en tu equipo y usan `despega_dev_core` y `despega_dev_simulation` en
DynamoDB de `qrioso-dev` (`us-east-1`). `pnpm dev`, `dev:web` y `dev:admin` verifican
cuenta y tablas antes de arrancar. Se requiere internet y una sesión SSO vigente.

El acceso conserva el proveedor local (solo correo; en el backoffice eliges el rol),
limitado a loopback. Crea una cuenta de prueba en <http://localhost:3000/registro>.
**Las escrituras afectan datos compartidos de DEV.** Los usuarios locales tienen
identificadores distintos de Cognito; no reutilizan sus sesiones ni sus contraseñas.
No hay comandos de creación o reset de tablas locales. Los datos antiguos del
contenedor no se migran ni se borran automáticamente.

## Validar

```sh
pnpm typecheck && pnpm lint && pnpm test
pnpm build:web && pnpm build:admin
pnpm infra:synth:dev && pnpm infra:synth:prd
```

## Documentación

- Reglas para agentes y versiones: [`AGENTS.md`](AGENTS.md)
- Documento funcional del cliente: [`docs/funtional.md`](docs/funtional.md)
- Estado y pendientes: [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md)
- Arquitectura: [`docs/architecture/`](docs/architecture/)
- Decisiones: [`docs/decisions/`](docs/decisions/)
