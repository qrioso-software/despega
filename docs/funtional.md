# DESPEGA — Documento de especificación funcional y guión narrativo

**Módulo:** Ingeniería de Software (v4 — para desarrollo de prototipo)

> Documento funcional entregado por el cliente. Es la fuente de verdad del producto.
> Nota para quien construye esto: este documento asume que no conoces DESPEGA. Empieza
> por la sección 0.
>
> Las interpretaciones, vacíos y decisiones tomadas para implementarlo se registran en
> [`docs/architecture/functional-analysis.md`](architecture/functional-analysis.md); este
> archivo se conserva tal como lo envió el cliente.

---

## 0. Qué es DESPEGA

DESPEGA es un simulador de inmersión de carreras para estudiantes de colegio (15–18 años),
pensado para que "vivan" una profesión antes de decidir qué estudiar en la universidad. No
es un test vocacional de preguntas — es una historia interactiva jugable, con personajes,
decisiones y consecuencias que se acumulan de una escena a otra.

Este documento cubre el primero de varios módulos de carrera planeados (14 en total, este
es el piloto de Ingeniería de Software). La estructura de este módulo es la plantilla que
se reutiliza para los demás — solo cambia el escenario profesional, no la mecánica.

**Formato de referencia:** el estilo de juego es una mezcla de dos géneros conocidos — un
juego de decisiones narrativo (tipo *The Walking Dead* de Telltale, donde tus elecciones
afectan lo que pasa después) combinado con tareas prácticas cortas integradas en la
historia (tipo *The Sims*, donde "haces" cosas concretas en vez de solo leer y elegir).

---

## 1. Personajes

| Personaje | Rol | Función en la historia |
| --- | --- | --- |
| [NOMBRE DEL ESTUDIANTE] | Protagonista / avatar del jugador | Practicante junior en PixelForge (empresa ficticia de desarrollo de software). El jugador toma todas sus decisiones. |
| Marisol | Líder técnica (tech lead) | Mentora del protagonista. Asigna tareas, da retroalimentación, representa la autoridad técnica del equipo. Aparece en casi todas las escenas. |
| Andrés | Product Manager (PM) | Representa la presión de negocio y del cliente. Pide actualizaciones de estado, empuja fechas de entrega. |
| Camila | Desarrolladora par | Compañera de trabajo del mismo nivel que el protagonista. Representa el trabajo entre pares (feedback horizontal, no jerárquico). |
| Cliente | Mencionado, nunca aparece en pantalla | Genera la presión de fondo ("el cliente está esperando"). No necesita diseño de personaje. |

(Josué, otro desarrollador, se menciona en la v1 del guión pero no tiene diálogo activo —
se puede omitir del prototipo inicial sin perder nada de la historia.)

---

## 2. Cómo funciona el simulador (mecánica general)

**Estructura:** el módulo tiene 3 sesiones jugables de ~30–35 min cada una. Pensadas para
jugarse en días distintos (ej. 3 veces por semana), pero el sistema no depende de fechas de
calendario reales — cada sesión se desbloquea al terminar la anterior.

**Persistencia entre sesiones:** lo que el estudiante decide en una sesión cambia el
contenido disponible en la siguiente (memoria de estado, no sesiones independientes entre
sí).

**Tipos de interacción que debe soportar el prototipo:**

- **Diálogo con opciones** — el jugador elige una de 2–3 respuestas en una conversación.
- **Decisión con tiempo límite** — igual que arriba, pero con un contador visible en
  pantalla (15–20 seg típico) que presiona al jugador a decidir rápido; si se acaba el
  tiempo, el juego avanza igual con una consecuencia predefinida (nunca bloquea el
  progreso).
- **Clasificación/ordenamiento** — el jugador arrastra o toca tarjetas para agruparlas en
  categorías, también con reloj visible (45–60 seg típico).
- **Construcción de mensaje** — el jugador arma una respuesta (correo o chat) seleccionando
  y combinando bloques de frase predefinidos, en vez de elegir un mensaje completo ya
  escrito.
- **Emparejamiento** — el jugador conecta un problema con su solución correspondiente entre
  varias opciones.

**Pantallas/herramientas de oficina simuladas dentro del juego:** una vista de
chat/videollamada tipo Microsoft Teams, una bandeja de entrada tipo Outlook, y un tablero de
tareas tipo Trello simplificado. Importante: no son ventanas reales de esas apps — son
recreaciones dentro del mismo mundo visual del juego (con los personajes animados
apareciendo ahí también, ej. Marisol "hablando" en la videollamada con su ícono animado), no
capturas de pantalla ni ventanas estilo Windows.

**Tensión y suspenso (elemento clave a no perder):** cada sesión abre con algo urgente ya
sucediendo (nunca un onboarding lento), incluye al menos un momento con reloj corriendo
visible, y cierra con un gancho narrativo que engancha con la siguiente sesión
(cliffhanger). La presión no viene de un diseño tipo "juego arcade" — viene de la situación
(un cliente esperando, quejas de usuarios subiendo en vivo, un compañero de equipo
pendiente de una respuesta).

**Sistema de puntuación — dos capas corriendo en paralelo:**

- **Puntos de desempeño:** un número de 0 a 100 (empieza en 50), visible todo el tiempo en
  una barra/HUD. Sube o baja con cada decisión/tarea.
- **Perfil de afinidad:** 5 ejes acumulativos, sin "bien o mal" — cada elección suma a uno o
  más ejes según su naturaleza, no según si fue "correcta":
  - Pensamiento analítico
  - Comunicación y trabajo en equipo
  - Atención al detalle
  - Tolerancia a la presión
  - Preferencia por lo estructurado vs. lo creativo

  Se muestra como gráfico (ej. radar o barras) al final de cada sesión y al final del
  módulo completo.

**Importante para TI — alcance de los datos:** los puntos de desempeño y el perfil de
afinidad de este módulo pertenecen únicamente a la carrera "Ingeniería de Software". Cuando
el estudiante juegue otro módulo de carrera (ej. Marketing, Medicina), ese módulo genera su
propio puntaje de desempeño y su propio perfil de afinidad de 5 ejes, independientes de
este. El modelo de datos debe guardar ambos (puntos + perfil) por carrera desde el inicio,
aunque este prototipo solo construya un módulo — para que más adelante el simulador pueda
comparar el perfil del estudiante entre varias carreras sin tener que rediseñar cómo se
guardan los datos.

**Consecuencia siempre visible:** ninguna decisión debe resolverse solo con un mensaje de
"correcto/incorrecto". Siempre hay una reacción narrativa (un personaje responde distinto,
un contador en pantalla sube o baja, una escena cambia según lo elegido antes).

**Sin condición de derrota:** el estudiante nunca pierde ni repite una sesión. Las malas
decisiones se reflejan en la historia (el bug sigue activo, un compañero queda incómodo) y
en el puntaje — pero el juego siempre sigue hacia adelante.

---

## 3. Guión — Sesión 1: "El primer fuego"

### ESCENA 1.1 — Apertura

[PANTALLA: Notificación tipo push, estilo celular, sobre el mundo del juego]
[INTERACCIÓN: Ninguna, solo avanzar]

Son las 9:02am. El protagonista apenas se sienta, su laptop todavía cargando, cuando aparece
la notificación: "5 usuarios reportan que la app se cayó hace 2 minutos." Sin más contexto,
Marisol llama por videollamada.

### ESCENA 1.2 — Llamada con Marisol

[PANTALLA: Videollamada tipo Teams, dentro del mundo del juego, con el personaje de Marisol
animado]
[INTERACCIÓN: Diálogo con opciones, sin tiempo límite]

—Hola, sé que es tu primer día y ya te tiro esto encima —dice Marisol—. El botón de
"Confirmar pedido" está fallando. ¿Cómo prefieres arrancar?

Opciones:

- A) "Dame 5 minutos para revisar los reportes antes de tocar nada" → +2 análisis, +1 detalle
- B) "Ya mismo lo reviso, dime en qué pantalla está el error" → +1 comunicación
- C) "Creo que ya sé qué puede ser, déjame intentar algo" → −1 análisis, +2 presión
  (impulsivo)

### ESCENA 1.3 — Los reportes

[PANTALLA: Bandeja de entrada del protagonista, con 4 tarjetas de reporte]
[INTERACCIÓN: Clasificación con reloj — 45 segundos visible en pantalla]
[RAMIFICACIÓN: el resultado de esta escena determina si la Escena 1.4 empieza con pista
clara o sin pista]

Cuatro reportes de soporte llegan: usuario con wifi público lento, usuario con datos móviles
débiles, usuario con fibra óptica sin problemas, usuario con mala señal. El jugador arrastra
cada tarjeta a una de dos categorías: "Conexión lenta" / "Conexión rápida". Mientras
trabaja, un contador de quejas de usuarios sube visiblemente en pantalla (simula que el
problema sigue activo mientras el jugador investiga).

- 3 de 4 bien clasificados → +6 análisis, +2 detalle
- 1–2 bien clasificados → +2 detalle
- 0 clasificados a tiempo → −2 desempeño

### ESCENA 1.4 — Diagnóstico

[PANTALLA: Chat con Marisol]
[INTERACCIÓN: Decisión con tiempo límite — 15 segundos, círculo/barra de conteo visible]

Marisol pregunta directo cuál es la causa. Tres hipótesis:

- "El botón no espera lo suficiente cuando la conexión es lenta" (correcta) → +8 análisis,
  el contador de quejas deja de subir en pantalla
- "El botón está mal diseñado visualmente" (incorrecta) → −3 desempeño, el contador sigue
  subiendo
- "Es problema del teléfono del usuario, no de la app" (incorrecta) → −3 desempeño, el
  contador sigue subiendo
- Si se acaba el tiempo sin elegir → −3 desempeño, +1 presión, Marisol decide sin el jugador
  ("vamos a intentar otra cosa")

### ESCENA 1.5 — Correo con Andrés

[PANTALLA: Bandeja de entrada, correo de Andrés]
[INTERACCIÓN: Construcción de mensaje — el jugador combina 2–3 bloques de frase de un banco
de 5 opciones]

Llega el correo: "¿Cómo vas con el botón? El cliente pregunta hoy en la tarde." El jugador
arma su respuesta combinando bloques (3 profesionales, 2 poco profesionales disponibles).

- Solo bloques profesionales → +6 comunicación, Andrés responde tranquilo
- Mezcla → +1 comunicación, Andrés responde neutro
- Bloques poco profesionales → −4 desempeño, Andrés escala a Marisol

### ESCENA 1.6 — Cierre / Cliffhanger

[PANTALLA: Chat con Marisol]
[INTERACCIÓN: Ninguna, solo avanzar — transición a Sesión 2]

A las 4:50pm, justo cuando parece resuelto: —Espera —escribe Marisol—. El bug volvió. Y esta
vez es distinto. Corte a negro.

### ESCENA 1.7 — Resumen de sesión

[PANTALLA: Pantalla de resultados, "Tu semana en PixelForge — Sesión 1"]
[INTERACCIÓN: Ninguna, solo visualización]

Se muestra el puntaje de desempeño acumulado y el gráfico de perfil de afinidad (5 ejes)
actualizándose con animación.

---

## 4. Guión — Sesión 2: "El código no miente"

### ESCENA 2.1 — Recap y revisión de código

[PANTALLA: Tablero de tareas + vista de "flujo" simplificado del código de Camila, sin
código real, solo bloques visuales de pasos]
[INTERACCIÓN: Reordenar/corregir bloques — el jugador debe insertar el paso faltante
("mostrar mensaje de carga") en la secuencia correcta]

Camila comparte su solución para que el protagonista la revise antes de publicarla. Falta
un paso: no hay ningún aviso de "cargando" para el usuario mientras espera.

- Inserta el paso correcto en la posición correcta → +5 análisis, +3 detalle

### ESCENA 2.2 — Dilema calidad vs. velocidad

[PANTALLA: Videollamada grupal (Marisol + Andrés)]
[INTERACCIÓN: Decisión con tiempo límite (20 seg) + "medidor de riesgo" que sube
visiblemente mientras el jugador decide]

Andrés quiere publicar hoy. Marisol prefiere esperar un día. Tres opciones:

- Publicar ya (alineado con Andrés) → +2 presión, riesgo narrativo que se resuelve en
  Sesión 3
- Esperar un día (alineado con Marisol) → +3 detalle, −1 presión
- Liberar primero a un grupo pequeño de usuarios (opción intermedia) → +4 análisis,
  +2 estructura

### ESCENA 2.3 — Feedback a Camila

[PANTALLA: Chat directo con Camila]
[INTERACCIÓN: Construcción de mensaje, igual mecánica que 1.5, pero aquí también dispara una
animación de reacción del personaje]

El jugador elige qué decirle a Camila sobre su código.

- Constructivo + propone algo → +4 comunicación, Camila responde agradecida (animación
  positiva)
- Solo crítica → +1 comunicación, Camila responde neutra/a la defensiva
- No dice nada → −3 comunicación

### ESCENA 2.4 — Priorizar el tablero

[PANTALLA: Tablero de tareas con 4 tareas nuevas pero solo 3 espacios disponibles]
[INTERACCIÓN: Arrastrar 3 de 4 tareas al tablero; la tarea descartada queda registrada para
reaparecer en Sesión 3]

No hay opción "correcta" — cualquier elección deja una tarea fuera, que se menciona como
consecuencia en la siguiente sesión (alguien más tuvo que resolverla, o sigue pendiente).

- +2 estructura por completar la priorización (independiente de cuál se descarta)

### ESCENA 2.5 — Cierre / Cliffhanger

[PANTALLA: Gráfico de quejas de usuarios en la esquina, subiendo levemente]
[INTERACCIÓN: Ninguna]

Corte a negro. Transición a Sesión 3.

---

## 5. Guión — Sesión 3: "Día de lanzamiento"

### ESCENA 3.1 — Apertura con contador ambiental

[PANTALLA: Contador visible "Ventana de lanzamiento: 28 minutos", permanece en pantalla
durante toda la sesión]
[INTERACCIÓN: Ninguna al inicio]

### ESCENA 3.2 — Emparejar error con solución

[PANTALLA: 4 tarjetas de error + 4 tarjetas de solución]
[INTERACCIÓN: Emparejamiento, sin ayuda de pistas esta vez, con reloj de 60 seg]

- Aciertos acumulados → suman a análisis y detalle proporcionalmente (no hay un solo bloque
  de puntos, es por cada acierto)

### ESCENA 3.3 — Decisión final de lanzamiento

[PANTALLA: Dashboard en vivo con reacciones de usuarios (👍/👎) actualizándose]
[INTERACCIÓN: Decisión sin tiempo límite (esta vez la tensión viene del dashboard
reaccionando en vivo, no de un reloj), 3 opciones: lanzar ahora / esperar / liberar por
partes]
[RAMIFICACIÓN: el resultado visual del dashboard depende del desempeño acumulado de las 3
sesiones, no solo de esta decisión]

### ESCENA 3.4 — Retro final

[PANTALLA: Videollamada de cierre con Marisol]
[INTERACCIÓN: Diálogo con 3 opciones de reflexión, ninguna incorrecta]

- "Investigar antes de actuar ahorra tiempo" → refuerza análisis
- "Comunicar a tiempo evita que los problemas crezcan" → refuerza comunicación
- "A veces hay que decidir rápido aunque falte información" → refuerza presión

### ESCENA 3.5 — Pantalla final del módulo

[PANTALLA: "Tu semana en PixelForge" — resultado final]
[INTERACCIÓN: Ninguna, solo visualización]

Puntaje de desempeño total, gráfico de perfil de afinidad final (5 ejes), mensaje de cierre
de Marisol (varía según desempeño, siempre honesto, nunca condescendiente).

### ESCENA 3.6 — Proyección de carrera (cierre motivacional)

[PANTALLA: Línea de tiempo animada, aparece justo después de la 3.5, antes de salir del
módulo]
[INTERACCIÓN: Ninguna, solo visualización — el jugador puede avanzar tocando/deslizando por
cada etapa]

Antes de cerrar, Marisol le dice algo que no es sobre el bug: —Lo que viviste esta semana es
el punto de partida, no el destino. Así se ve el camino desde acá.

Se despliega una línea de tiempo narrada, en primera persona, mostrando cómo luce crecer en
esta carrera — no para prometer nada, sino para que el estudiante entienda que "ser
ingeniero de software" no es una sola etapa fija:

- **Año 1 — Practicante/Junior:** lo que el estudiante acaba de vivir esta semana: aprender
  resolviendo problemas reales con acompañamiento cercano.
- **Año 2–4 — Developer Pleno:** ya no espera que le digan qué hacer paso a paso; empieza a
  proponer soluciones y a apoyar a los nuevos practicantes.
- **Año 5–8 — Senior / Líder técnico (el camino de Marisol):** lidera decisiones técnicas de
  un equipo completo, como Marisol ahora mismo.
- **Bifurcación** (a partir de aquí el camino se divide, no hay una sola respuesta):
  - **Camino técnico profundo:** Arquitecto/a de software — diseña cómo se construyen
    sistemas completos, no una sola función.
  - **Camino de liderazgo:** Gerente de Ingeniería / CTO — deja de escribir código todo el
    día y empieza a liderar personas y estrategia.
  - **Camino independiente:** Freelance o fundador/a de su propio producto — como
    PixelForge mismo, que alguna vez empezó siendo una idea de una sola persona.

(Nota de diseño: si el sistema lo permite, esta pantalla puede resaltar con un color
distinto la bifurcación que más se alinea con el perfil de afinidad que el estudiante
acumuló esta semana — ej. si su perfil tiene más "estructura" y "detalle", resaltar el
camino técnico; si tiene más "comunicación", resaltar el camino de liderazgo. Esto no es una
predicción ni una recomendación cerrada, es solo para que el estudiante vea que su forma de
decidir ya apunta hacia algo.)

---

## 6. Resumen técnico para estimar el prototipo

**Pantallas únicas a construir:** notificación push, videollamada (reutilizable para
Marisol/Andrés/grupo), chat directo (reutilizable), bandeja de entrada, tablero de tareas,
pantalla de clasificación con drag & drop, pantalla de construcción de mensaje por bloques,
pantalla de emparejamiento, dashboard de reacciones en vivo, pantalla de resumen/perfil,
línea de tiempo de proyección de carrera (escena 3.6).

**Componentes reutilizables clave:** reloj de cuenta regresiva (usado en 4 escenas distintas
con distintos tiempos), sistema de puntos de desempeño (HUD persistente), sistema de perfil
de afinidad de 5 ejes (HUD + pantalla de resumen), sistema de ramificación de estado (qué
pasó en escenas anteriores afecta el contenido de escenas posteriores).

**Personajes a diseñar/animar:** protagonista (o solo su perspectiva en primera persona, a
decidir según presupuesto de arte), Marisol, Andrés, Camila.

---

**Referencia visual y de producto indicada por el cliente:** <https://www.springpod.com>
