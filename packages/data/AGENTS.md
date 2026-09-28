# @despega/data

- Solo servidor. Las apps lo importan detrás de `src/lib/data.ts` (`server-only`).
  Aquí no se importa `server-only` para que las pruebas corran en Node.
- `src/schema.ts` es la fuente única de tablas e índices; CDK y los repositorios lo usan.
  Un índice nuevo exige su patrón de acceso en `docs/architecture/data-model.md`.
- Nunca `Scan`. Lecturas por `GetItem`, `Query`, `BatchGetItem` o índices documentados.
- Toda escritura de progreso es condicional (`version` + `runId`); estado y evento van
  en la misma transacción. Un conflicto se expone como `DataError('CONFLICT')`.
- Los eventos de decisión son inmutables; reiniciar un intento crea un `runId` nuevo.
- Las credenciales no se guardan en los archivos de entorno: en AWS las aporta el rol
  SSR; en local el SDK usa el perfil SSO `qrioso-dev`. `DYNAMODB_ENDPOINT` debe estar
  vacío en todos los ambientes. Con `STAGE=local` solo se aceptan las tablas DEV de
  DESPEGA en `us-east-1`; las escrituras afectan datos compartidos de DEV.
- Pruebas: `pnpm --filter @despega/data test`.
