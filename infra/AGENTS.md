# Infraestructura CDK

- `infra` es la única fuente de infraestructura AWS. Stages válidos: `dev` y `prd`.
- Perfiles: `dev` usa `qrioso-dev` (cuenta `779926948601`). Reservados: `despega-prd` y
  `despega-main` (Control Tower y DNS, no es un stage); esas cuentas aún no existen: al
  crearlas, registrar los IDs en `cdk.json`.
- `deploy:<stage>` corre `bin/validate-amplify-domains.ts` (idéntico al del proyecto de
  referencia): exige la cuenta, los dos App IDs de Amplify y dominios `AVAILABLE` en la
  rama del stage.
- No ejecutar `bootstrap`, `deploy` ni `destroy` sin solicitud explícita. Nunca `prd`
  sin autorización explícita en la tarea activa.
- Sin API Gateway ni Lambdas de dominio: los roles de cómputo SSR de Amplify reciben los
  permisos DynamoDB mínimos que usa cada app. La validación del synth rechaza
  `dynamodb:Scan` y acciones fuera de la lista permitida.
- Tablas e índices salen de `@despega/data/schema`; no definirlos a mano aquí.
- Producción: `RETAIN`, protección contra borrado, PITR y termination protection.
- Los Apps Amplify se crean fuera de CloudFormation; CDK los configura por `appId` y
  nunca recibe tokens de GitHub.
- Variables de apps: contrato en `apps/<app>/.env.example`; CDK carga `.env.develop` o
  `.env.production`, exige keys idénticas, `AUTH_PROVIDER=cognito`, `STAGE` correcto y
  `DYNAMODB_ENDPOINT` vacío, y reemplaza tablas, región e IDs de Cognito con outputs.
- Feature flags de CDK en `cdk.json` fijadas en sus valores recomendados; las pruebas
  leen el mismo contexto.
- Validar: `pnpm --filter @despega/infra typecheck test` y `pnpm infra:synth:dev|prd`.
