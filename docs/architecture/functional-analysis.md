# Análisis funcional del piloto

Fuente: `docs/funtional.md` (v4, Ingeniería de Software). Este documento traduce el guión a
decisiones de implementación y registra cada **supuesto** tomado donde el documento no
define algo. Todo supuesto vive como dato en
`packages/simulator/src/modules/ingenieria-software.ts` y se valida con el cliente sin
tocar el motor.

## Qué se implementó tal como lo pide el documento

| Requisito | Implementación |
| --- | --- |
| 3 sesiones que se desbloquean al terminar la anterior, sin fechas de calendario | `startSession` solo abre la sesión disponible; al cerrar el resumen se habilita la siguiente. |
| Memoria entre escenas y sesiones | `flags` del estado (p. ej. `s1Clue`, `andresMood`, `s2Release`, `s2Discarded`) condicionan textos y resultados posteriores. |
| Diálogo con opciones | `dialogue` sin reloj (1.2, 3.4). |
| Decisión con tiempo límite; si vence, avanza con consecuencia | `dialogue` con `timeLimitSeconds` y `timeoutOutcome` (1.4: 15 s; 2.2: 20 s con medidor de riesgo). |
| Clasificación con reloj | `classification` 45 s (1.3), arrastrar o tocar. |
| Construcción de mensaje por bloques | `message-builder` (1.5 correo, 2.3 chat con reacción animada de Camila). |
| Emparejamiento | `matching` 60 s sin pistas (3.2), puntaje por acierto. |
| Tablero con 4 tareas y 3 espacios | `prioritization` (2.4); la descartada reaparece en 3.1. |
| Dashboard en vivo sin reloj | `live-decision` (3.3); el resultado depende del desempeño acumulado. |
| Herramientas de oficina dentro del mundo del juego | PixelChat (chat y videollamada), PixelMail, PixelBoard y PixelPulse: recreaciones propias, no capturas. |
| Tensión: apertura urgente, reloj visible, cliffhanger | Cada sesión abre en crisis, tiene al menos un reloj y cierra con corte a negro (1.6, 2.5). |
| Contador de quejas en vivo | HUD de quejas que sube cada 3 s mientras el problema está activo y se detiene con el diagnóstico correcto. |
| Ventana de lanzamiento de 28 minutos en toda la sesión 3 | HUD `launchWindow` persistido con el tiempo jugado; marca «Lanzamiento decidido» tras 3.3. |
| Desempeño 0–100 que empieza en 50, visible siempre | HUD con barra y animación de cambios. |
| Perfil de 5 ejes, radar o barras al final de cada sesión y del módulo | Radar animado y su gemelo en barras en cada resumen, en `/inicio`, en resultados y en el backoffice. |
| Puntos y perfil por carrera | Ítem de progreso por estudiante y carrera (`data-model.md`). |
| Consecuencia siempre visible, sin «correcto/incorrecto» | Panel de consecuencia con reacción del personaje, narración y deltas. |
| Sin condición de derrota | Toda respuesta y todo tiempo agotado tienen resultado; el peor camino también completa el módulo (probado de punta a punta). |
| Mensaje de cierre honesto según desempeño | 3.5: tres tramos (≥ 75, ≥ 55, resto). |
| Proyección de carrera con bifurcación resaltada | 3.6: etapas navegables y el camino alineado con el perfil. |

## Decisiones de diseño tomadas

| Tema | Decisión | Motivo |
| --- | --- | --- |
| Protagonista | Perspectiva en primera persona; el estudiante no tiene avatar. Su nombre de pila aparece en los diálogos (`{nombre}`). | El documento lo deja «a decidir según presupuesto de arte». |
| Personajes | Marisol, Andrés y Camila en SVG propio: parpadean, cambian de gesto (alegre, preocupado, serio, triste, a la defensiva) y mueven la boca al hablar. | Animación ligera, sin assets externos ni costo de arte. |
| Josué | Solo se menciona en una consecuencia de la sesión 3, sin diálogo. | El documento permite omitirlo. |
| Resumen de la sesión 2 | Se agregó la escena 2.6 «Resumen de sesión». | El documento pide el gráfico al final de **cada** sesión, pero su guión no incluye resumen para la sesión 2. |
| Carreras «Próximamente» | Se listan 13 carreras de ejemplo (Medicina, Marketing, Derecho…). | El documento dice 14 módulos sin nombrarlos. **Confirmar la lista con el cliente.** |
| Eje «estructurado vs. creativo» | Se muestra como «Preferencia por lo estructurado»: más puntos significa más estructura. | El guión solo suma puntos hacia «estructura». |
| Normalización del perfil | Cada eje se expresa de 0 a 100 respecto del máximo alcanzable en las sesiones jugadas. Los ejes sin oportunidades aún (estructura tras la sesión 1) se muestran «Sin datos aún». | Hace comparables los ejes; los negativos se muestran como 0. |
| Camino resaltado en 3.6 | Técnico = promedio de detalle y estructura; liderazgo = comunicación; independiente = presión. Gana el mayor. | La nota de diseño del documento. El camino independiente no tiene regla en el documento: se asignó al eje de presión. |
| Contador de quejas | Empieza en 5 y sube 1 cada 3 s mientras el problema está activo. | El documento pide que «suba visiblemente» sin ritmo definido. |

## Supuestos de puntaje (validar con el cliente)

El documento indica que el desempeño **sube o baja** con cada decisión, pero solo define
penalizaciones. Se asignaron subidas explícitas a los resultados correctos. Los puntos
de afinidad son exactamente los del documento.

| Escena | Resultado | Desempeño | Afinidad | Origen |
| --- | --- | --- | --- | --- |
| 1.2 | Cualquier opción | 0 | Según documento | Documento (sin respuesta correcta) |
| 1.3 | ≥ 3 de 4 bien clasificados | **+5** | +6 análisis, +2 detalle | Desempeño: supuesto |
| 1.3 | 1–2 bien | **+1** | +2 detalle | Desempeño: supuesto |
| 1.3 | 0 bien (incluye no clasificar a tiempo) | −2 | — | Documento |
| 1.4 | Hipótesis correcta | **+8** | +8 análisis | Desempeño: supuesto |
| 1.4 | Hipótesis incorrecta / tiempo agotado | −3 | tiempo: +1 presión | Documento |
| 1.5 | Solo profesionales / mezcla | **+6 / +1** | +6 / +1 comunicación | Desempeño: supuesto |
| 1.5 | Solo poco profesionales | −4 | — | Documento |
| 2.1 | Paso de carga en la posición correcta | **+6** | +5 análisis, +3 detalle | Desempeño: supuesto |
| 2.1 | Paso o posición incorrectos | **−2** | — | Supuesto (el documento no lo define) |
| 2.2 | Publicar / esperar / grupo pequeño | 0 | Según documento | Documento |
| 2.2 | Tiempo agotado: decide Andrés publicar | **−2** | +1 presión | Supuesto |
| 2.3 | Constructivo con propuesta | **+4** | +4 comunicación | Desempeño: supuesto |
| 2.3 | Solo crítica | 0 | +1 comunicación | Documento |
| 2.3 | Mezcla de crítica y propuesta | **+1** | **+2 comunicación** | Supuesto (caso no previsto) |
| 2.3 | No dice nada | **−2** | −3 comunicación | Desempeño: supuesto |
| 2.4 | Cualquier priorización | 0 | +2 estructura | Documento |
| 3.2 | Por cada acierto | **+2** | +2 análisis, +1 detalle | Afinidad proporcional: documento; valores: supuesto |
| 3.3 | Lanzar ahora (desempeño ≥ 70 / ≥ 50 / menor) | **+4 / +1 / −3** | +2 presión | Supuesto |
| 3.3 | Esperar | 0 | **+2 detalle** | Supuesto |
| 3.3 | Liberar por partes (≥ 70 / ≥ 50 / menor) | **+3 / +3 / +1** | **+2 análisis, +2 estructura** | Supuesto |
| 3.4 | Cualquier reflexión | 0 | **+3** al eje correspondiente | Magnitud: supuesto |

Con estos valores, el mejor camino termina en 91 puntos y el peor en 32 (ambos
verificados por pruebas automáticas y en el navegador).

### Interpretaciones de detalle

- **1.3, «3 de 4 bien clasificados»**: se interpreta como 3 o más aciertos. «0
  clasificados a tiempo» incluye no ubicar ninguna tarjeta y ubicarlas todas mal.
- **2.1**: el paso correcto es «Mostrar "Procesando tu pedido…"», entre «el usuario toca»
  y «la app envía y espera». Hay dos pasos distractores.
- **2.2**: publicar ya abre en la sesión 3 un escenario con errores nacidos de la prisa;
  el grupo pequeño detecta los errores a tiempo; esperar gana un día de pruebas.
- **3.3**: el dashboard inicial y el resultado dependen del desempeño acumulado (≥ 70,
  ≥ 50 o menor), además de la opción elegida.
- **Consecuencias de 2.4 en 3.1**: pruebas descartadas → un error que nadie vio venir;
  documentación → Josué pregunta tres veces; ticket → el cliente escribe molesto;
  pantalla de confirmación → queda para la próxima semana.

## Preguntas abiertas para el cliente

1. ¿Aprueban las subidas de desempeño propuestas, o prefieren otra escala?
2. ¿Cuáles son las 13 carreras restantes y en qué orden se construirán?
3. ¿Los estudiantes se registran solos (implementado) o los da de alta el colegio?
4. ¿Qué verán los orientadores de colegio: solo sus estudiantes? Hoy el rol de
   orientación ve a todos; faltaría asociar estudiantes a colegios o cohortes.
5. ¿Hace falta consentimiento parental explícito para menores de cierta edad según el
   país de operación? Hoy se pide una declaración del estudiante en el registro.
6. ¿Se necesita un modo con más tiempo en los relojes, por accesibilidad?
7. ¿Qué duración real apuntan por sesión? Con el guión actual cada sesión se juega en
   5–10 minutos; los ~30 minutos del documento requieren más escenas.
