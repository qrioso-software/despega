# @despega/data

- Solo servidor. Las apps lo importan detrás de `src/lib/data.ts` (`server-only`).
  Aquí no se importa `server-only` para que las pruebas corran en Node.
- `src/schema.ts` es la fuente única de tablas e índices; CDK y DynamoDB Local lo usan.
  Un índice nuevo exige su patrón de acceso en `docs/architecture/data-model.md`.
- Nunca `Scan`. Lecturas por `GetItem`, `Query`, `BatchGetItem` o índices documentados.
- Toda escritura de progreso es condicional (`version` + `runId`); estado y evento van
  en la misma transacción. Un conflicto se expone como `DataError('CONFLICT')`.
- Los eventos de decisión son inmutables; reiniciar un intento crea un `runId` nuevo.
- Las credenciales nunca vienen de variables de entorno: en AWS las aporta el rol SSR;
  `DYNAMODB_ENDPOINT` solo acepta DynamoDB Local en loopback.
- Pruebas: `pnpm --filter @despega/data test`.
