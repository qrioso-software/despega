# ADR 0003: progreso por carrera y eventos por intento en DynamoDB

- Estado: aceptado
- Fecha: 2026-09-26

## Contexto

El documento funcional exige guardar desempeño y perfil de afinidad **por carrera**
desde el inicio, para comparar carreras más adelante sin rediseñar datos. El backoffice
necesita además trazabilidad de cada decisión.

## Decisión

- Tabla `simulation` con un ítem de progreso por estudiante y carrera
  (`STUDENT#id` / `CAREER#careerId`). El ítem guarda el resumen (desempeño, afinidad,
  sesiones) y el estado completo del motor.
- Cada decisión es un evento inmutable bajo `RUN#runId`. Un reinicio administrativo
  abre un intento nuevo y conserva el historial.
- Tabla `core` para perfiles de estudiantes. Contraseñas y tokens solo en Cognito.
- Un índice por tabla, cada uno con su patrón de acceso documentado; sin `Scan`.
- El esquema vive una sola vez en `packages/data/src/schema.ts` y lo consumen CDK
  y los repositorios. Desde el [ADR 0007](0007-local-con-dynamodb-dev.md), localhost
  comparte las tablas DEV en AWS y deja de usar DynamoDB Local.

## Alternativas consideradas

- **Tabla única**: menos recursos, pero mezcla identidad y simulación, y complica los
  permisos por rol SSR.
- **Solo eventos, derivando el estado**: auditoría perfecta, pero cada lectura
  reconstruiría el estado; se guardan ambos.
- **Base relacional (Aurora Serverless)**: consultas ad hoc más fáciles, más costo y
  operación para un piloto de patrones de acceso conocidos.

## Consecuencias

- Comparar carreras de un estudiante es un `Query` por prefijo.
- El panel pagina un índice hasta un tope; con volumen alto habrá que mantener
  contadores al escribir.
