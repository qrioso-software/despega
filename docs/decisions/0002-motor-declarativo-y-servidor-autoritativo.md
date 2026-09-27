# ADR 0002: motor declarativo y servidor autoritativo

- Estado: aceptado
- Fecha: 2026-09-26

## Contexto

El piloto es la plantilla de 14 carreras: misma mecánica, distinto escenario. El
puntaje (desempeño y afinidad) se usará para orientar decisiones vocacionales y se
mostrará a orientadores, así que no puede depender de lo que diga el navegador.

## Decisión

- El contenido de cada carrera es data (`CareerModule`): escenas, interacciones,
  condiciones y resultados. El motor en `packages/simulator` es puro y la interpreta.
- El navegador recibe una escena pública sin claves de respuesta y envía solo la
  respuesta. El servidor reevalúa con el mismo motor y persiste estado y evento en una
  transacción con concurrencia optimista.
- Toda respuesta, incluido el tiempo agotado, tiene un resultado declarado.
  `validateModule` rechaza módulos incompletos.

## Alternativas consideradas

- **Lógica de escenas en componentes React**: más rápido de prototipar, pero cada
  carrera duplicaría código y el puntaje quedaría en el cliente.
- **Motor de guiones externo (Ink, Twine)**: resuelve narrativa, pero no las
  interacciones propias (clasificación, emparejamiento, dashboard) ni la afinidad.
- **Evaluación en el cliente con verificación posterior**: más compleja y aun así
  filtraría las respuestas en el paquete del cliente.

## Consecuencias

- Una carrera nueva es un archivo de contenido y sus pruebas.
- Cada decisión espera una ida y vuelta al servidor (latencia baja en SSR regional). El
  reproductor muestra el estado de envío y permite reintentar sin perder la respuesta.
- El backoffice muestra el guión y sus puntajes desde la misma fuente que ejecuta el
  motor, lo que facilita validar supuestos con el cliente.
