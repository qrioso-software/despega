# Modelo de datos (DynamoDB)

Fuente única del esquema: `packages/data/src/schema.ts`. CDK
(`infra/lib/constructs/database.ts`) y los repositorios lo consumen. Nombres físicos:
`despega_<stage>_<tabla>` (`dev`, `prd`). Las apps locales comparten las tablas `dev`
de `qrioso-dev`; no se crean tablas `local` ni se usa DynamoDB Local.

Todas las tablas: clave `pk`/`sk` (string), on-demand, cifrado administrado por AWS.
En `prd`: PITR de 35 días, protección contra borrado y `RETAIN`.

## Tabla `core` — identidades y perfiles

| Ítem | `pk` | `sk` | Atributos |
| --- | --- | --- | --- |
| Perfil de estudiante | `STUDENT#<studentId>` | `PROFILE` | `studentId`, `email`, `givenName`, `familyName?`, `grade?`, `school?`, `authProvider`, `createdAt`, `updatedAt` |

`studentId` es el `sub` de Cognito (pool de estudiantes) o `local-<hash del correo>` en
desarrollo local. Ambos tipos de perfil pueden coexistir en DEV, pero sus IDs y
sesiones son distintos. No se guardan contraseñas ni tokens.

**Índice `students-by-created-at-index`** (proyección `ALL`)
`studentsByCreatedPk = "STUDENTS"`, `studentsByCreatedSk = <createdAt>#<studentId>`.
Patrón: backoffice lista estudiantes del más reciente al más antiguo y los cuenta.
Costo: una escritura extra por alta de estudiante (evento poco frecuente). Partición
única aceptable a la escala del piloto; con volumen alto, repartir por colegio o shard.

## Tabla `simulation` — progreso y decisiones

| Ítem | `pk` | `sk` | Contenido |
| --- | --- | --- | --- |
| Progreso por carrera | `STUDENT#<studentId>` | `CAREER#<careerId>` | Resumen (`status`, `performance`, `affinity`, `completedSessions`, `currentSessionNumber`, `runId`, `attempt`, `previousRunIds`, fechas) + `state` completo del motor + `version` |
| Evento de decisión | `RUN#<runId>` | `EVENT#<secuencia de 6 dígitos>` | `sceneId`, `sessionId`, `response` original, `outcomeId`, `label`, `timedOut`, `elapsedMs`, desempeño antes/después, `affinityDelta`, `createdAt` |

- **Por carrera desde el inicio**: desempeño y perfil de afinidad son atributos del ítem
  de progreso de cada carrera (requisito del documento funcional). Comparar carreras es
  un `Query` sobre `pk = STUDENT#<id>` con `begins_with(sk, "CAREER#")`.
- **Intentos**: `runId` identifica el intento. Un reinicio administrativo crea un
  `runId` nuevo, sube `attempt` y conserva los anteriores en `previousRunIds`. Los
  eventos viejos no se borran.
- **Concurrencia optimista**: toda escritura exige `version` y `runId` leídos. Guardar
  estado + evento es una `TransactWriteItems` (progreso con condición; evento con
  `attribute_not_exists`). Un conflicto devuelve `CONFLICT` y la interfaz relee.

**Índice `progress-by-career-index`** (proyección `INCLUDE` del resumen, sin `state`)
`progressByCareerPk = CAREER#<careerId>`, `progressByCareerSk = <updatedAt>#<studentId>`.
Patrón: panel del backoffice (iniciados, completados, promedios, avance por sesión y
actividad reciente). Costo: cada avance reescribe la entrada del índice (el resumen
cambia en cada escena de todos modos).

## Patrones de acceso

| Caso | Operación |
| --- | --- |
| Perfil del estudiante al ingresar | `GetItem core STUDENT#id/PROFILE`; `PutItem` condicional si no existe |
| Progreso de una carrera (reproductor) | `GetItem` consistente `simulation STUDENT#id/CAREER#c` |
| Carreras de un estudiante (`/inicio`) | `Query simulation pk=STUDENT#id, begins_with(sk,"CAREER#")` |
| Guardar decisión | `TransactWriteItems`: `Put` progreso (condición versión) + `Put` evento |
| Registro de decisiones (backoffice) | `Query simulation pk=RUN#runId` |
| Listado de estudiantes | `Query core` índice por fecha (paginado, descendente) |
| Progreso de la página de estudiantes | `BatchGetItem simulation` con proyección de resumen |
| Panel del piloto | `Query simulation` índice por carrera (paginado hasta 1.000) |
| Nombres para la actividad reciente | `BatchGetItem core` |

No existe ningún `Scan`. El synth falla si una política IAM lo concede.

## Permisos por rol SSR (Amplify)

| Rol | `core` | `simulation` |
| --- | --- | --- |
| Web | `GetItem`, `PutItem`, `UpdateItem` | `GetItem`, `PutItem`, `Query` |
| Admin | `GetItem`, `BatchGetItem`, `Query` (+ índices) | `GetItem`, `BatchGetItem`, `Query` (+ índices), `PutItem` (reinicio) |

Las transacciones se autorizan con las acciones de ítem subyacentes.

## Evolución prevista

- Colegios y cohortes: ítems `ORG#<orgId>` en `core` y un índice por colegio, cuando el
  cliente confirme cómo se asocian estudiantes y orientadores.
- Contadores agregados por carrera, mantenidos en la misma transacción de escritura,
  para reemplazar la paginación del panel cuando crezca el volumen.
