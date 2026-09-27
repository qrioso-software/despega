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
infra/          AWS CDK v2 (Amplify, DynamoDB, Cognito) y DynamoDB Local
docs/           documento funcional, arquitectura, ADRs y estado
```

## Requisitos

- Node.js 24 LTS (`.nvmrc`) y pnpm 12 (se descarga solo por `packageManager`).
- Docker Desktop, para DynamoDB Local.

## Arrancar en local

```sh
pnpm install
pnpm local:setup   # DynamoDB Local + tablas
pnpm dev           # web http://localhost:3000 · admin http://localhost:3001
```

En local no hace falta AWS: el acceso usa un proveedor local (solo correo; en el
backoffice eliges el rol). Crea una cuenta en <http://localhost:3000/registro> y juega.

`pnpm local:reset` borra los datos locales y recrea las tablas vacías.

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
