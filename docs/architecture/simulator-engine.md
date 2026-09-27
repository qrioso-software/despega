# Motor del simulador

Paquete: `packages/simulator` (`@despega/simulator`). TypeScript puro: sin frameworks, sin
I/O, sin `Date.now()` implícito. La web, el backoffice y `packages/data` lo importan.

## Por qué un motor declarativo

El documento funcional pide que la mecánica sea una plantilla para 14 carreras. Por eso
la historia es **data** (`CareerModule`) y el motor solo la interpreta. Una carrera nueva
es un archivo nuevo en `src/modules/` más su registro en `src/modules/index.ts`; ni el
motor ni las pantallas cambian.

## Modelo de contenido

```text
CareerModule
├─ id, careerId, version, title, tagline, company, playerRole
├─ initialPerformance (50), initialFlags (memoria inicial del mundo)
├─ characters { id → nombre, rol, bio }
└─ sessions[]
   └─ scenes[]
      ├─ id ("1.3"), title, clock, screen, participants, hud, visual
      ├─ lines[]            diálogo/narración previa (con `when` opcional)
      ├─ notification?      push del celular (+ `caller` que llama después)
      ├─ email?             correo recibido
      └─ interaction        una de las 10 variantes
```

| `interaction.kind` | Uso en el piloto | Qué evalúa el motor |
| --- | --- | --- |
| `none` | 1.1, 1.6, 2.5, 3.1 | Avanza; puede escribir memoria (`outcome.flags`). `cutToBlack` para cliffhangers. |
| `dialogue` | 1.2, 1.4, 2.2, 3.4 | Opción elegida o `timeout` si hay `timeLimitSeconds`. |
| `classification` | 1.3 | Aciertos contra `correctCategoryId`; tramos por `minCorrect`. |
| `message-builder` | 1.5, 2.3 | Reglas por etiquetas de las frases (`only`, `includes`, `empty`, `always`); gana la primera. |
| `sequence` | 2.1 | Paso y posición de inserción contra `answer`. |
| `prioritization` | 2.4 | Tareas elegidas; guarda las descartadas en un flag. |
| `matching` | 3.2 | Aciertos por pareja; efecto por acierto (`perMatch`) + tramo narrativo. |
| `live-decision` | 3.3 | Opción + primera variante cuya condición cumple el estado (p. ej. desempeño ≥ 70). |
| `summary` | 1.7, 2.6, 3.5 | Vista de resultados; al continuar cierra la sesión. |
| `timeline` | 3.6 | Proyección de carrera; al continuar cierra el módulo. |

Un **resultado** (`Outcome`) declara `performance`, `affinity` (5 ejes), `flags`,
`reactions` (personajes con estado de ánimo) y `narration`. Los textos aceptan variantes
condicionadas (`Text`) y la marca `{nombre}`.

Las **condiciones** combinan `flag = valor`, `flag ∈ {…}`, `desempeño ≥ n`, `all`, `any`
y `not`.

## Ciclo de vida del estado

```text
createInitialState ─► sesión 1 "available"
startSession(s1)   ─► "in_progress", escena 0
applySceneResponse ─► evalúa, actualiza mundo, puntaje y memoria, avanza de escena
  última escena    ─► sesión "completed", siguiente "available" (sin fechas)
  última sesión    ─► módulo "completed"
```

`SimulationState` guarda: posición (sesión y escena), desempeño (0–100, acotado),
afinidad cruda por eje (puede ser negativa), flags, registro por sesión (inicio, fin,
desempeño inicial y final, tiempo activo) y un `log` compacto de decisiones.

Errores tipados (`SimulationError`): `SESSION_NOT_STARTED`, `SESSION_LOCKED`,
`SCENE_MISMATCH`, `MODULE_COMPLETED`, `INVALID_RESPONSE`, `MODULE_MISMATCH`.

## Autoridad y escena pública

- El cliente recibe `getPublicScene()`: textos resueltos con la memoria y el nombre, y
  la interacción **sin claves de respuesta ni puntajes** (sin `correctCategoryId`,
  `answer`, `tags` ni `outcome`). Hay una prueba que lo verifica.
- El cliente envía `SceneResponse`. El servidor reevalúa con el mismo motor; la
  consecuencia vuelve como `AppliedOutcome` (reacciones, narración, deltas efectivos y
  el detalle para revelar aciertos en pantalla).

## Mundo del juego (HUD)

- `complaints` / `complaintsTrend`: con `hud.complaints`, el motor suma 1 queja cada
  3 s de tiempo jugado mientras la tendencia es `rising`, **antes** de aplicar la
  consecuencia. Así, las quejas que llegaron mientras el estudiante decidía sí cuentan.
- `launchWindowSeconds`: con `hud.launchWindow`, descuenta el tiempo jugado hasta que
  existe `launchDecision` (se escribe al decidir en 3.3).
- El navegador anima estos contadores localmente; el servidor fija el valor real en
  cada escena.

## Afinidad y proyección

- `affinityMaximaBySession`: el máximo alcanzable por eje en cada escena (mejor
  resultado posible para ese eje), sumado por sesión.
- `buildAffinityProfile`: normaliza 0–100 contra el máximo acumulado hasta la sesión en
  curso, ordena los ejes y marca como `unavailable` los que aún no tuvieron
  oportunidades.
- `scoreBranches`: promedio normalizado de los ejes de cada camino de 3.6; se resalta
  el mayor.

## Pruebas

`node --test` con *type stripping* de Node 24 (sin compilación previa). Cubren: validez
del módulo, mejor y peor camino completos (91 y 32 puntos), bloqueo de sesiones, escena
equivocada, respuestas inválidas, ramificación de 1.3 → 1.4, contador de quejas,
reglas de mensajes, consecuencias de 2.4 en 3.1, emparejamiento proporcional, dashboard
según desempeño, ventana de lanzamiento, que la escena pública no filtre respuestas,
normalización del resumen y el nombre del protagonista.

`minigames.test.ts` prueba cada mini-juego de forma exhaustiva: todas las respuestas
posibles de clasificación, mensajes (en cualquier orden), secuencia, priorización y
emparejamiento, cada umbral del dashboard y los tiempos agotados. Exige consecuencia
narrativa coherente con la jugada y puntajes iguales a la tabla de
`functional-analysis.md`. Además juega 600 partidas aleatorias reproducibles en cada
módulo registrado: todas terminan, ninguna escena pública filtra respuestas y todos los
resultados declarados en el guión son alcanzables. Un tipo de interacción nuevo se
agrega a `randomResponse` y `declaredOutcomes` de ese archivo.

## Agregar una carrera

1. Crear `src/modules/<carrera>.ts` con un `CareerModule` (mismo `careerId` que en
   `src/careers.ts`) y registrarlo en `src/modules/index.ts`.
2. Cambiar el estado de la carrera en `src/careers.ts` a `available`.
3. `validateModule` debe devolver cero errores; agregar pruebas de mejor y peor camino.
4. Si el escenario necesita una pantalla nueva, agregar el `ScreenKind` y su componente
   en `apps/web/src/components/simulator/screens/`. No crear pantallas por carrera.
