# ADR 0001: monorepo Next.js sin API Gateway

- Estado: aceptado
- Fecha: 2026-09-26

## Contexto

DESPEGA necesita una web para estudiantes con el simulador, un backoffice y su
infraestructura en AWS. El proyecto de referencia (Librería El Maestro) usa un monorepo
pnpm con Next.js en Amplify, API Gateway HTTP API, Lambdas en Go, DynamoDB, Cognito y
CDK. Para esta etapa se pidió simplificar: solo Next.js (SSR, Server Actions) y sin API
Gateway.

## Decisión

- Monorepo pnpm con `apps/web`, `apps/admin`, `packages/simulator`, `packages/data`,
  `packages/auth` e `infra`.
- Next.js 16 App Router en AWS Amplify Hosting (`WEB_COMPUTE`) para ambas apps.
- La lógica de servidor corre en Server Components, Server Actions y `proxy.ts`. Las
  reglas de dominio viven en paquetes TypeScript compartidos, no en las rutas.
- El rol de cómputo SSR de cada App accede directamente a DynamoDB con permisos
  mínimos y sin `Scan`.
- CDK v2 como única fuente de infraestructura. Se conservan los patrones de la
  referencia: Apps Amplify creados fuera de CloudFormation, contrato de variables
  `.env.example`, validación IAM en el synth y separación de cuentas por stage.

## Alternativas consideradas

- **API Gateway + Lambda (como la referencia)**: más piezas, más latencia y dos lenguajes
  para un prototipo cuyo dominio cabe en TypeScript. Queda como camino de crecimiento.
- **Route Handlers como API interna**: duplicaría la frontera que ya dan las Server
  Actions (validación de origen, serialización, autenticación en la acción).

## Consecuencias

- Menos infraestructura y un solo lenguaje; el motor se prueba sin AWS.
- Los roles SSR de Amplify tienen acceso a datos: el mínimo privilegio y la
  autorización dentro de cada acción son obligatorios.
- Si más adelante se agregan clientes móviles, se necesitará una API. El motor y
  `packages/data` están aislados para moverlos a Lambdas sin reescribir reglas.
