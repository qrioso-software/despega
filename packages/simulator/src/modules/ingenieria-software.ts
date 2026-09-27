import type { CareerModule } from '../types.ts';

/**
 * Módulo piloto: Ingeniería de Software — «Tu semana en PixelForge».
 *
 * Fuente: docs/funtional.md (v4). Los puntajes de afinidad y las penalizaciones de
 * desempeño son los del documento. Los valores que el documento no define (subidas de
 * desempeño por aciertos, tiempo agotado en 2.2, resultados de 3.3, etc.) están
 * marcados como supuestos en docs/architecture/functional-analysis.md y se ajustan
 * aquí, no en el motor.
 */
export const ingenieriaSoftware: CareerModule = {
  id: 'ingenieria-software',
  careerId: 'ingenieria-software',
  version: 2,
  title: 'Ingeniería de Software',
  tagline: 'Tu semana en PixelForge',
  company: 'PixelForge',
  playerRole: 'Practicante junior',
  initialPerformance: 50,
  initialFlags: {
    complaints: 5,
    complaintsTrend: 'rising',
    launchWindowSeconds: 28 * 60,
  },
  characters: {
    marisol: {
      id: 'marisol',
      name: 'Marisol',
      role: 'Líder técnica',
      bio: 'Tu mentora. Directa, calmada bajo presión y buena explicando. Asigna tareas y te da retroalimentación.',
    },
    andres: {
      id: 'andres',
      name: 'Andrés',
      role: 'Product Manager',
      bio: 'Habla con el cliente todos los días y traduce la presión del negocio en fechas y prioridades.',
    },
    camila: {
      id: 'camila',
      name: 'Camila',
      role: 'Desarrolladora',
      bio: 'Tu par en el equipo. Revisan el trabajo del otro y se dan feedback de igual a igual.',
    },
  },
  sessions: [
    /* ============================================================== */
    /* Sesión 1 — El primer fuego                                      */
    /* ============================================================== */
    {
      id: 's1',
      number: 1,
      title: 'El primer fuego',
      synopsis: 'Tu primer día empieza con la app caída y un cliente esperando.',
      estimatedMinutes: 30,
      scenes: [
        {
          id: '1.1',
          title: 'Apertura',
          clock: '9:02 a. m.',
          screen: 'notification',
          hud: { complaints: true },
          lines: [
            {
              speaker: 'narrator',
              text: 'Lunes, 9:02 a. m. Es tu primer día como practicante en PixelForge. Apenas te sientas; tu laptop todavía está cargando…',
            },
          ],
          notification: {
            app: 'Soporte PixelForge',
            title: 'Alerta: usuarios afectados',
            body: '5 usuarios reportan que la app se cayó hace 2 minutos.',
            caller: 'marisol',
          },
          interaction: { kind: 'none', continueLabel: 'Contestar la videollamada de Marisol' },
        },
        {
          id: '1.2',
          title: 'Llamada con Marisol',
          clock: '9:04 a. m.',
          screen: 'video-call',
          participants: ['marisol'],
          hud: { complaints: true },
          lines: [
            { speaker: 'marisol', mood: 'serious', text: 'Hola, {nombre}. Sé que es tu primer día y ya te tiro esto encima.' },
            {
              speaker: 'marisol',
              mood: 'concerned',
              text: 'El botón de «Confirmar pedido» está fallando y la gente no puede terminar sus compras. ¿Cómo prefieres arrancar?',
            },
          ],
          interaction: {
            kind: 'dialogue',
            options: [
              {
                id: 'revisar',
                label: 'Dame 5 minutos para revisar los reportes antes de tocar nada.',
                outcome: {
                  id: 'revisar-primero',
                  label: 'Revisar los reportes antes de actuar',
                  affinity: { analytical: 2, detail: 1 },
                  flags: { s1Approach: 'analyze' },
                  reactions: [
                    { speaker: 'marisol', mood: 'happy', text: 'Buen instinto. Te reenvío los reportes ya mismo. Cinco minutos, no más.' },
                  ],
                },
              },
              {
                id: 'preguntar',
                label: 'Ya mismo lo reviso, dime en qué pantalla está el error.',
                outcome: {
                  id: 'pedir-contexto',
                  label: 'Pedir contexto y arrancar',
                  affinity: { communication: 1 },
                  flags: { s1Approach: 'ask' },
                  reactions: [
                    {
                      speaker: 'marisol',
                      mood: 'neutral',
                      text: 'En la pantalla de pago, justo al tocar el botón. Te paso los reportes de soporte para que tengas contexto.',
                    },
                  ],
                },
              },
              {
                id: 'intentar',
                label: 'Creo que ya sé qué puede ser, déjame intentar algo.',
                outcome: {
                  id: 'actuar-por-impulso',
                  label: 'Actuar por impulso',
                  affinity: { analytical: -1, pressure: 2 },
                  flags: { s1Approach: 'impulsive' },
                  reactions: [
                    {
                      speaker: 'marisol',
                      mood: 'concerned',
                      text: 'Mmm… antes de tocar producción, mira los reportes. Si nos equivocamos, el problema crece. Te los paso.',
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          id: '1.3',
          title: 'Los reportes',
          clock: '9:10 a. m.',
          screen: 'inbox',
          participants: ['marisol'],
          hud: { complaints: true },
          lines: [
            {
              speaker: 'marisol',
              mood: 'serious',
              text: 'Te reenvié 4 reportes de soporte. Agrúpalos según la conexión de cada usuario: puede que ahí esté la pista.',
            },
          ],
          interaction: {
            kind: 'classification',
            prompt: 'Arrastra o toca cada reporte y ubícalo en su categoría antes de que se acabe el tiempo.',
            timeLimitSeconds: 45,
            categories: [
              { id: 'lenta', label: 'Conexión lenta', emoji: '🐢' },
              { id: 'rapida', label: 'Conexión rápida', emoji: '⚡' },
            ],
            items: [
              {
                id: 'wifi-publico',
                from: 'Valentina R.',
                title: 'Wifi público de un café',
                body: '«Toqué “Confirmar pedido” y se quedó pensando… nunca confirmó.»',
                correctCategoryId: 'lenta',
              },
              {
                id: 'fibra',
                from: 'Sofía M.',
                title: 'Fibra óptica en casa',
                body: '«A mí me funcionó sin problemas. Pedido confirmado al instante.»',
                correctCategoryId: 'rapida',
              },
              {
                id: 'datos-debiles',
                from: 'Mateo G.',
                title: 'Datos móviles débiles',
                body: '«Tenía una rayita de señal. Me salió un error después de tocar el botón.»',
                correctCategoryId: 'lenta',
              },
              {
                id: 'mala-senal',
                from: 'Daniel P.',
                title: 'Zona con mala señal',
                body: '«Le di dos veces al botón y no pasó nada.»',
                correctCategoryId: 'lenta',
              },
            ],
            tiers: [
              {
                minCorrect: 3,
                outcome: {
                  id: 'patron-claro',
                  label: '3 o más reportes bien clasificados',
                  performance: 5,
                  affinity: { analytical: 6, detail: 2 },
                  flags: { s1Clue: 'clear' },
                  reactions: [
                    { speaker: 'marisol', mood: 'happy', text: '¡Ahí está el patrón! Los que fallan tienen conexión lenta. Los de buena señal, no.' },
                  ],
                },
              },
              {
                minCorrect: 1,
                outcome: {
                  id: 'patron-parcial',
                  label: '1–2 reportes bien clasificados',
                  performance: 1,
                  affinity: { detail: 2 },
                  flags: { s1Clue: 'partial' },
                  reactions: [
                    { speaker: 'marisol', mood: 'neutral', text: 'Algo tiene que ver con la conexión, pero todavía no está del todo claro.' },
                  ],
                },
              },
              {
                minCorrect: 0,
                outcome: {
                  id: 'sin-patron',
                  label: 'Ningún reporte bien clasificado a tiempo',
                  performance: -2,
                  flags: { s1Clue: 'none' },
                  reactions: [
                    { speaker: 'marisol', mood: 'concerned', text: 'Con esto no aparece ningún patrón. Seguimos sin pista; toca avanzar igual.' },
                  ],
                },
              },
            ],
          },
        },
        {
          id: '1.4',
          title: 'Diagnóstico',
          clock: '9:25 a. m.',
          screen: 'chat',
          participants: ['marisol'],
          hud: { complaints: true },
          lines: [
            {
              speaker: 'marisol',
              mood: 'serious',
              text: {
                variants: [
                  {
                    when: { flag: 's1Clue', equals: 'clear' },
                    text: 'Con lo que encontraste, todo apunta a la conexión lenta: los usuarios con buena señal no reportan nada.',
                  },
                  {
                    when: { flag: 's1Clue', equals: 'partial' },
                    text: 'Algo tiene que ver con la conexión, pero no estamos seguros de qué.',
                  },
                ],
                fallback: 'No tenemos una pista clara todavía. Toca apostar por una hipótesis.',
              },
            },
            { speaker: 'marisol', mood: 'concerned', text: 'Necesito tu diagnóstico ya: ¿cuál es la causa? El cliente está mirando.' },
          ],
          interaction: {
            kind: 'dialogue',
            prompt: '¿Cuál es la causa del fallo?',
            timeLimitSeconds: 15,
            hint: {
              when: { flag: 's1Clue', equals: 'clear' },
              text: 'Pista: en tu clasificación, todos los que fallan tienen conexión lenta.',
            },
            options: [
              {
                id: 'espera',
                label: 'El botón no espera lo suficiente cuando la conexión es lenta.',
                outcome: {
                  id: 'diagnostico-correcto',
                  label: 'Diagnóstico correcto',
                  performance: 8,
                  affinity: { analytical: 8 },
                  flags: { complaintsTrend: 'stopped', s1Diagnosis: 'correct' },
                  narration: 'El contador de quejas deja de subir.',
                  reactions: [
                    {
                      speaker: 'marisol',
                      mood: 'happy',
                      text: '¡Exacto! El tiempo de espera es demasiado corto para conexiones lentas. Lo ajusto ya mismo.',
                    },
                  ],
                },
              },
              {
                id: 'diseno',
                label: 'El botón está mal diseñado visualmente.',
                outcome: {
                  id: 'diagnostico-diseno',
                  label: 'Hipótesis incorrecta: el diseño',
                  performance: -3,
                  flags: { s1Diagnosis: 'wrong' },
                  narration: 'El contador de quejas sigue subiendo.',
                  reactions: [
                    {
                      speaker: 'marisol',
                      mood: 'concerned',
                      text: 'Mmm… el diseño no ha cambiado en semanas y antes funcionaba. No creo que sea eso.',
                    },
                  ],
                },
              },
              {
                id: 'telefono',
                label: 'Es problema del teléfono del usuario, no de la app.',
                outcome: {
                  id: 'diagnostico-telefono',
                  label: 'Hipótesis incorrecta: el teléfono del usuario',
                  performance: -3,
                  flags: { s1Diagnosis: 'wrong' },
                  narration: 'El contador de quejas sigue subiendo.',
                  reactions: [
                    {
                      speaker: 'marisol',
                      mood: 'serious',
                      text: 'Son demasiados usuarios con teléfonos distintos para que sea eso. El problema es nuestro.',
                    },
                  ],
                },
              },
            ],
            timeoutOutcome: {
              id: 'diagnostico-tiempo-agotado',
              label: 'Tiempo agotado: Marisol decide sin ti',
              performance: -3,
              affinity: { pressure: 1 },
              flags: { s1Diagnosis: 'timeout' },
              narration: 'Se acabó el tiempo. El contador de quejas sigue subiendo.',
              reactions: [{ speaker: 'marisol', mood: 'serious', text: 'Vamos a intentar otra cosa.' }],
            },
          },
        },
        {
          id: '1.5',
          title: 'Correo con Andrés',
          clock: '11:40 a. m.',
          screen: 'inbox',
          participants: ['andres'],
          hud: { complaints: true },
          email: {
            from: 'andres',
            subject: '¿Cómo vas con el botón?',
            body: {
              variants: [
                {
                  when: { flag: 'complaintsTrend', equals: 'stopped' },
                  text: 'Hola, {nombre}. Vi que las quejas se frenaron, ¿ya quedó? El cliente pregunta hoy en la tarde y necesito decirle algo concreto.',
                },
              ],
              fallback: 'Hola, {nombre}. ¿Cómo vas con el botón? Las quejas siguen llegando y el cliente pregunta hoy en la tarde.',
            },
            signature: 'Andrés · Product Manager',
          },
          interaction: {
            kind: 'message-builder',
            prompt: 'Arma tu respuesta combinando 2 o 3 frases del banco.',
            channel: 'email',
            recipient: 'andres',
            minBlocks: 2,
            maxBlocks: 3,
            blocks: [
              {
                id: 'estado',
                text: 'Hola, Andrés. Estamos trabajando con Marisol en el error del botón «Confirmar pedido».',
                tags: ['professional'],
              },
              { id: 'no-se', text: 'No sé, eso lo está viendo Marisol.', tags: ['unprofessional'] },
              {
                id: 'compromiso',
                text: 'Te envío una actualización antes de las 3:00 p. m. con el estado y los próximos pasos.',
                tags: ['professional'],
              },
              { id: 'relax', text: 'Tranqui, ya casi. Relax 😎', tags: ['unprofessional'] },
              {
                id: 'apoyo',
                text: 'Si necesitas algo para el cliente antes, avísame y te lo preparo.',
                tags: ['professional'],
              },
            ],
            rules: [
              {
                when: { kind: 'only', tags: ['professional'] },
                outcome: {
                  id: 'correo-profesional',
                  label: 'Respuesta con solo bloques profesionales',
                  performance: 6,
                  affinity: { communication: 6 },
                  flags: { andresMood: 'calm' },
                  reactions: [
                    { speaker: 'andres', mood: 'happy', text: 'Perfecto, gracias por avisar. Con esto le respondo al cliente con calma.' },
                  ],
                },
              },
              {
                when: { kind: 'only', tags: ['unprofessional'] },
                outcome: {
                  id: 'correo-poco-profesional',
                  label: 'Respuesta con bloques poco profesionales',
                  performance: -4,
                  flags: { andresMood: 'escalated' },
                  narration: 'Andrés reenvía tu correo a Marisol.',
                  reactions: [
                    { speaker: 'andres', mood: 'serious', text: 'Esto no me sirve para el cliente. Voy a hablar con Marisol directamente.' },
                  ],
                },
              },
              {
                when: { kind: 'always' },
                outcome: {
                  id: 'correo-mixto',
                  label: 'Respuesta mezclada',
                  performance: 1,
                  affinity: { communication: 1 },
                  flags: { andresMood: 'neutral' },
                  reactions: [{ speaker: 'andres', mood: 'neutral', text: 'Ok… todavía no me queda claro cómo va. Avísame apenas tengas algo concreto para el cliente.' }],
                },
              },
            ],
          },
        },
        {
          id: '1.6',
          title: 'Cierre',
          clock: '4:50 p. m.',
          screen: 'chat',
          participants: ['marisol'],
          hud: { complaints: true },
          lines: [
            {
              speaker: 'narrator',
              when: { not: { flag: 's1Diagnosis', equals: 'correct' } },
              text: 'Al mediodía, Marisol encontró la causa: el botón no esperaba lo suficiente con conexiones lentas.',
            },
            {
              speaker: 'narrator',
              text: '4:50 p. m. El ajuste ya está publicado, las quejas se detuvieron y todo parece resuelto. Empiezas a guardar tus cosas…',
            },
            { speaker: 'marisol', mood: 'serious', text: 'Espera.' },
            { speaker: 'marisol', mood: 'concerned', text: 'El bug volvió. Y esta vez es distinto.' },
          ],
          interaction: {
            kind: 'none',
            continueLabel: 'Continuar',
            cutToBlack: true,
            outcome: { id: 'cliffhanger-1', label: 'El bug volvió', flags: { complaintsTrend: 'stopped' } },
          },
        },
        {
          id: '1.7',
          title: 'Resumen de sesión',
          screen: 'summary',
          interaction: { kind: 'summary', scope: 'session', heading: 'Tu semana en PixelForge — Sesión 1' },
        },
      ],
    },

    /* ============================================================== */
    /* Sesión 2 — El código no miente                                  */
    /* ============================================================== */
    {
      id: 's2',
      number: 2,
      title: 'El código no miente',
      synopsis: 'El bug volvió. Toca revisar el código de Camila y elegir entre calidad y velocidad.',
      estimatedMinutes: 30,
      scenes: [
        {
          id: '2.1',
          title: 'Recap y revisión de código',
          clock: '9:15 a. m.',
          screen: 'task-board',
          participants: ['camila', 'marisol'],
          lines: [
            { speaker: 'narrator', text: 'Martes, 9:15 a. m. Ayer terminó con un mensaje de Marisol: «El bug volvió. Y esta vez es distinto».' },
            {
              speaker: 'narrator',
              text: {
                variants: [
                  {
                    when: { flag: 's1Diagnosis', equals: 'correct' },
                    text: 'Tú encontraste la causa del primer fallo: el botón no esperaba lo suficiente con conexiones lentas.',
                  },
                ],
                fallback: 'Marisol encontró la causa del primer fallo: el botón no esperaba lo suficiente con conexiones lentas.',
              },
            },
            {
              speaker: 'narrator',
              when: { flag: 'andresMood', equals: 'escalated' },
              text: 'Andrés sigue tenso por tu correo de ayer: tuvo que pedirle el estado a Marisol.',
            },
            {
              speaker: 'narrator',
              when: { flag: 'andresMood', equals: 'calm' },
              text: 'Tu correo de ayer le sirvió a Andrés: el cliente quedó tranquilo con la actualización.',
            },
            {
              speaker: 'marisol',
              mood: 'serious',
              text: 'El problema nuevo: el botón ahora sí espera, pero algunos usuarios tocan varias veces y terminan con pedidos duplicados.',
            },
            {
              speaker: 'camila',
              mood: 'neutral',
              text: 'Hola, {nombre}. Preparé una solución. ¿Me la revisas antes de publicarla? Siento que le falta algo y no logro ver qué.',
            },
          ],
          interaction: {
            kind: 'sequence',
            prompt: 'Este es el flujo de Camila. Elige el paso que falta e insértalo en la posición correcta.',
            steps: [
              { id: 'toca', text: 'El usuario toca «Confirmar pedido»' },
              { id: 'envia', text: 'La app envía el pedido y espera la respuesta del servidor (hasta 30 s)' },
              { id: 'confirma', text: 'La app muestra «¡Pedido confirmado!»' },
            ],
            candidates: [
              { id: 'color', text: 'Cambiar el color del botón a verde' },
              { id: 'carga', text: 'Mostrar «Procesando tu pedido…» con una animación de carga' },
              { id: 'reiniciar', text: 'Pedir al usuario que reinicie la app' },
            ],
            answer: { candidateId: 'carga', slot: 1 },
            outcomes: {
              correct: {
                id: 'revision-correcta',
                label: 'Paso de carga insertado en la posición correcta',
                performance: 6,
                affinity: { analytical: 5, detail: 3 },
                flags: { s2Review: 'correct' },
                reactions: [
                  {
                    speaker: 'camila',
                    mood: 'happy',
                    text: '¡Claro! Sin ese aviso la gente cree que no pasó nada y vuelve a tocar. Lo agrego ya mismo.',
                  },
                  { speaker: 'marisol', mood: 'happy', text: 'Buen ojo. Eso es revisar código: pensar en lo que vive el usuario.' },
                ],
              },
              incorrect: {
                id: 'revision-incompleta',
                label: 'El paso faltante no quedó en su lugar',
                performance: -2,
                flags: { s2Review: 'missed' },
                narration: 'Marisol señala lo que faltaba: un mensaje de carga justo después de tocar el botón.',
                reactions: [
                  { speaker: 'camila', mood: 'concerned', text: 'Mmm… no sé si eso resuelve los pedidos duplicados.' },
                  {
                    speaker: 'marisol',
                    mood: 'neutral',
                    text: 'Piensen en qué ve el usuario justo después de tocar el botón. Si no ve nada, vuelve a tocar.',
                  },
                ],
              },
            },
          },
        },
        {
          id: '2.2',
          title: 'Dilema calidad vs. velocidad',
          clock: '11:30 a. m.',
          screen: 'video-call',
          participants: ['andres', 'marisol'],
          lines: [
            {
              speaker: 'andres',
              mood: 'serious',
              text: 'El cliente quiere la corrección hoy mismo. Cada hora sin arreglo son pedidos duplicados y reclamos.',
            },
            {
              speaker: 'marisol',
              mood: 'concerned',
              text: 'Yo prefiero esperar un día y probarla bien. Si publicamos con prisa y falla otra vez, es peor.',
            },
            { speaker: 'andres', mood: 'neutral', text: '{nombre}, tú la revisaste. ¿Qué hacemos?' },
          ],
          interaction: {
            kind: 'dialogue',
            prompt: 'Decide antes de que el medidor de riesgo llegue al máximo.',
            timeLimitSeconds: 20,
            riskMeter: true,
            options: [
              {
                id: 'publicar',
                label: 'Publicar ya: el cliente no puede esperar.',
                outcome: {
                  id: 'publicar-ya',
                  label: 'Publicar ya (con Andrés)',
                  affinity: { pressure: 2 },
                  flags: { s2Release: 'now' },
                  reactions: [
                    { speaker: 'andres', mood: 'excited', text: '¡Eso! Le aviso al cliente que sale hoy.' },
                    { speaker: 'marisol', mood: 'concerned', text: 'Ok. Quedo pendiente de cualquier queja esta noche.' },
                  ],
                },
              },
              {
                id: 'esperar',
                label: 'Esperar un día y probarla bien.',
                outcome: {
                  id: 'esperar-un-dia',
                  label: 'Esperar un día (con Marisol)',
                  affinity: { detail: 3, pressure: -1 },
                  flags: { s2Release: 'wait' },
                  reactions: [
                    { speaker: 'marisol', mood: 'happy', text: 'Gracias. Mañana sale probada.' },
                    { speaker: 'andres', mood: 'concerned', text: 'Le explico al cliente… no le va a encantar.' },
                  ],
                },
              },
              {
                id: 'grupo',
                label: 'Liberarla primero a un grupo pequeño de usuarios.',
                outcome: {
                  id: 'grupo-pequeno',
                  label: 'Liberar primero a un grupo pequeño',
                  affinity: { analytical: 4, structure: 2 },
                  flags: { s2Release: 'canary' },
                  reactions: [
                    { speaker: 'marisol', mood: 'happy', text: 'Me gusta: un 10 % de los usuarios primero y vemos qué pasa.' },
                    { speaker: 'andres', mood: 'happy', text: 'Y el cliente ve avances hoy. Trato hecho.' },
                  ],
                },
              },
            ],
            timeoutOutcome: {
              id: 'decide-andres',
              label: 'Tiempo agotado: Andrés decide publicar',
              performance: -2,
              affinity: { pressure: 1 },
              flags: { s2Release: 'now', s2ReleaseDecidedBy: 'andres' },
              narration: 'Se acabó el tiempo y la decisión la tomó Andrés.',
              reactions: [{ speaker: 'andres', mood: 'serious', text: 'Sin respuesta… entonces publicamos ya.' }],
            },
          },
        },
        {
          id: '2.3',
          title: 'Feedback a Camila',
          clock: '2:10 p. m.',
          screen: 'chat',
          participants: ['camila'],
          lines: [
            {
              speaker: 'camila',
              mood: 'happy',
              when: { flag: 's2Review', equals: 'correct' },
              text: 'Gracias por encontrar lo del mensaje de carga, en serio.',
            },
            {
              speaker: 'camila',
              mood: 'neutral',
              text: 'Oye, {nombre}, ¿qué te pareció mi solución en general? Dímelo con confianza, quiero mejorar.',
            },
          ],
          interaction: {
            kind: 'message-builder',
            prompt: 'Arma tu mensaje para Camila con 2 o 3 frases, o elige no decir nada.',
            channel: 'chat',
            recipient: 'camila',
            minBlocks: 2,
            maxBlocks: 3,
            emptyOption: { label: 'No decir nada' },
            blocks: [
              { id: 'reconoce', text: 'Me gustó cómo organizaste el flujo, se entiende fácil.', tags: ['positive'] },
              { id: 'error-basico', text: 'Faltaba el mensaje de carga; eso fue un error básico.', tags: ['critique'] },
              { id: 'prueba', text: '¿Qué tal si lo probamos con conexión lenta antes de publicar?', tags: ['proposal'] },
              { id: 'esperaba-mas', text: 'La verdad, esperaba algo más completo.', tags: ['critique'] },
              { id: 'equipo', text: 'Podemos revisar con Marisol el caso del doble toque, en equipo.', tags: ['proposal'] },
            ],
            rules: [
              {
                when: { kind: 'empty' },
                outcome: {
                  id: 'feedback-silencio',
                  label: 'No le dijo nada a Camila',
                  performance: -2,
                  affinity: { communication: -3 },
                  flags: { camilaMood: 'distant' },
                  narration: 'Camila se queda esperando una respuesta que no llega.',
                  reactions: [{ speaker: 'camila', mood: 'sad', text: 'Ah… ok. Supongo que estaba bien.' }],
                },
              },
              {
                when: { kind: 'includes', all: ['proposal'], none: ['critique'] },
                outcome: {
                  id: 'feedback-constructivo',
                  label: 'Feedback constructivo con propuesta',
                  performance: 4,
                  affinity: { communication: 4 },
                  flags: { camilaMood: 'grateful' },
                  reactions: [{ speaker: 'camila', mood: 'happy', text: '¡Gracias! Me encanta la idea. ¿Lo hacemos esta tarde en equipo?' }],
                },
              },
              {
                when: { kind: 'only', tags: ['critique'] },
                outcome: {
                  id: 'feedback-solo-critica',
                  label: 'Solo crítica',
                  affinity: { communication: 1 },
                  flags: { camilaMood: 'defensive' },
                  narration: 'Camila responde corto y cierra el chat.',
                  reactions: [{ speaker: 'camila', mood: 'defensive', text: 'Ok… ya me quedó claro. Lo corrijo.' }],
                },
              },
              {
                when: { kind: 'always' },
                outcome: {
                  id: 'feedback-mixto',
                  label: 'Feedback mezclado',
                  performance: 1,
                  affinity: { communication: 2 },
                  flags: { camilaMood: 'neutral' },
                  reactions: [{ speaker: 'camila', mood: 'neutral', text: 'Gracias por decírmelo. Algunas cosas me dolieron un poco, pero las tomo.' }],
                },
              },
            ],
          },
        },
        {
          id: '2.4',
          title: 'Priorizar el tablero',
          clock: '4:00 p. m.',
          screen: 'task-board',
          participants: ['marisol'],
          lines: [
            {
              speaker: 'marisol',
              mood: 'neutral',
              text: 'Llegaron 4 tareas nuevas, pero esta semana solo hay espacio para 3. Tú decides cuáles entran al tablero.',
            },
          ],
          interaction: {
            kind: 'prioritization',
            prompt: 'Arrastra o toca 3 tareas para ubicarlas en el tablero de la semana.',
            slots: 3,
            discardedFlag: 's2Discarded',
            tasks: [
              {
                id: 'pruebas',
                title: 'Pruebas automáticas con conexión lenta',
                description: 'Para que el error no vuelva sin que nadie lo note.',
                label: 'Calidad',
              },
              {
                id: 'documentacion',
                title: 'Actualizar la documentación del botón de pago',
                description: 'Para que cualquiera del equipo entienda cómo funciona.',
                label: 'Equipo',
              },
              {
                id: 'ticket',
                title: 'Responder el ticket del cliente principal',
                description: 'Lleva dos días esperando respuesta.',
                label: 'Cliente',
              },
              {
                id: 'diseno',
                title: 'Mejorar la pantalla de confirmación',
                description: 'Algunos usuarios dicen que no se entiende.',
                label: 'Usuarios',
              },
            ],
            outcome: {
              id: 'priorizacion-completa',
              label: 'Priorización del tablero completada',
              affinity: { structure: 2 },
              narration: {
                variants: [
                  { when: { flag: 's2Discarded', equals: 'pruebas' }, text: 'Las pruebas automáticas quedan fuera del tablero esta semana.' },
                  { when: { flag: 's2Discarded', equals: 'documentacion' }, text: 'La documentación queda fuera del tablero esta semana.' },
                  { when: { flag: 's2Discarded', equals: 'ticket' }, text: 'El ticket del cliente principal queda fuera del tablero esta semana.' },
                ],
                fallback: 'La mejora de la pantalla de confirmación queda fuera del tablero esta semana.',
              },
              reactions: [
                { speaker: 'marisol', mood: 'neutral', text: 'Listo. Lo que queda fuera no desaparece: alguien lo va a sentir. Así es priorizar.' },
              ],
            },
          },
        },
        {
          id: '2.5',
          title: 'Cierre',
          clock: '11:48 p. m.',
          screen: 'cutscene',
          visual: 'complaints-chart',
          lines: [
            { speaker: 'narrator', text: 'Martes, 11:48 p. m. La oficina está vacía.' },
            {
              speaker: 'narrator',
              text: {
                variants: [
                  { when: { flag: 's2Release', equals: 'now' }, text: 'La corrección ya está publicada para todos los usuarios.' },
                  { when: { flag: 's2Release', equals: 'canary' }, text: 'La corrección está activa para el 10 % de los usuarios.' },
                ],
                fallback: 'La corrección sale mañana, después de las pruebas.',
              },
            },
            { speaker: 'narrator', text: 'En la esquina de la pantalla, el gráfico de quejas empieza a subir. Un poco. Luego, otro poco.' },
            { speaker: 'narrator', text: 'Mañana es el día de lanzamiento.' },
          ],
          interaction: { kind: 'none', continueLabel: 'Continuar', cutToBlack: true },
        },
        {
          id: '2.6',
          title: 'Resumen de sesión',
          screen: 'summary',
          interaction: { kind: 'summary', scope: 'session', heading: 'Tu semana en PixelForge — Sesión 2' },
        },
      ],
    },

    /* ============================================================== */
    /* Sesión 3 — Día de lanzamiento                                   */
    /* ============================================================== */
    {
      id: 's3',
      number: 3,
      title: 'Día de lanzamiento',
      synopsis: 'Hay una ventana de 28 minutos para lanzar. Todo lo que decidiste esta semana cuenta.',
      estimatedMinutes: 30,
      scenes: [
        {
          id: '3.1',
          title: 'Apertura',
          clock: '10:00 a. m.',
          screen: 'cutscene',
          participants: ['marisol'],
          hud: { launchWindow: true },
          lines: [
            {
              speaker: 'narrator',
              text: 'Miércoles, 10:00 a. m. Día de lanzamiento. La ventana para publicar la nueva versión acaba de abrirse.',
            },
            {
              speaker: 'narrator',
              text: {
                variants: [
                  {
                    when: { flag: 's2Release', equals: 'now' },
                    text: 'La corrección que salió ayer con prisa trajo efectos inesperados: en la noche aparecieron 4 errores nuevos.',
                  },
                  {
                    when: { flag: 's2Release', equals: 'canary' },
                    text: 'El grupo pequeño de usuarios destapó 4 errores antes de que llegaran a todos. Se encontraron a tiempo.',
                  },
                ],
                fallback: 'El día extra de pruebas destapó 4 errores que hay que resolver antes de lanzar.',
              },
            },
            {
              speaker: 'narrator',
              when: { flag: 's2Discarded', equals: 'pruebas' },
              text: 'Como las pruebas automáticas quedaron fuera del tablero, nadie vio venir uno de esos errores.',
            },
            {
              speaker: 'narrator',
              when: { flag: 's2Discarded', equals: 'documentacion' },
              text: 'Josué tuvo que preguntar tres veces cómo funcionaba el botón de pago: la documentación seguía desactualizada.',
            },
            {
              speaker: 'narrator',
              when: { flag: 's2Discarded', equals: 'ticket' },
              text: 'El cliente principal escribió molesto: su ticket seguía sin respuesta. Andrés tuvo que contestarlo de urgencia.',
            },
            {
              speaker: 'narrator',
              when: { flag: 's2Discarded', equals: 'diseno' },
              text: 'La pantalla de confirmación sigue igual y algunos usuarios todavía no la entienden. Queda para la próxima semana.',
            },
            { speaker: 'marisol', mood: 'serious', text: 'Tenemos 4 errores y 28 minutos. Vamos por partes, {nombre}.' },
          ],
          interaction: { kind: 'none', continueLabel: '¡Vamos!' },
        },
        {
          id: '3.2',
          title: 'Emparejar error con solución',
          clock: '10:06 a. m.',
          screen: 'task-board',
          participants: ['marisol'],
          hud: { launchWindow: true },
          lines: [
            { speaker: 'marisol', mood: 'serious', text: 'Empareja cada error con su solución. Esta vez no hay pistas: confío en tu criterio.' },
          ],
          interaction: {
            kind: 'matching',
            prompt: 'Conecta cada error con la solución que lo resuelve.',
            timeLimitSeconds: 60,
            problems: [
              { id: 'duplicado', text: 'El pedido se duplica si el usuario toca dos veces el botón.' },
              { id: 'envio', text: 'El total no incluye el costo de envío.' },
              { id: 'historial', text: 'La app se cierra al abrir un historial de pedidos vacío.' },
              { id: 'correo', text: 'El correo de confirmación llega dos horas tarde.' },
            ],
            solutions: [
              { id: 'sol-mensaje-vacio', text: 'Mostrar un mensaje amable cuando no hay pedidos, en vez de fallar.' },
              { id: 'sol-desactivar', text: 'Desactivar el botón mientras se procesa el pedido.' },
              { id: 'sol-correo-inmediato', text: 'Enviar el correo apenas se confirma el pedido, no en el lote de la noche.' },
              { id: 'sol-sumar-envio', text: 'Corregir el cálculo para sumar el envío al total.' },
            ],
            answer: {
              duplicado: 'sol-desactivar',
              envio: 'sol-sumar-envio',
              historial: 'sol-mensaje-vacio',
              correo: 'sol-correo-inmediato',
            },
            perMatch: { performance: 2, affinity: { analytical: 2, detail: 1 } },
            results: [
              {
                minCorrect: 4,
                outcome: {
                  id: 'emparejamiento-perfecto',
                  label: '4 de 4 errores bien emparejados',
                  reactions: [{ speaker: 'marisol', mood: 'excited', text: '¡Cuatro de cuatro! Así sí llegamos a la ventana.' }],
                },
              },
              {
                minCorrect: 2,
                outcome: {
                  id: 'emparejamiento-parcial',
                  label: '2–3 errores bien emparejados',
                  reactions: [{ speaker: 'marisol', mood: 'neutral', text: 'Vamos bien. Los que faltan los corregimos en el camino.' }],
                },
              },
              {
                minCorrect: 0,
                outcome: {
                  id: 'emparejamiento-bajo',
                  label: '0–1 errores bien emparejados',
                  narration: 'Marisol toma los errores pendientes; el tiempo de la ventana se aprieta.',
                  reactions: [{ speaker: 'marisol', mood: 'concerned', text: 'Uf, varios no calzan. Los reviso yo, no hay tiempo para más.' }],
                },
              },
            ],
          },
        },
        {
          id: '3.3',
          title: 'Decisión final de lanzamiento',
          clock: '10:24 a. m.',
          screen: 'dashboard',
          participants: ['andres', 'marisol'],
          hud: { launchWindow: true },
          lines: [
            {
              speaker: 'andres',
              mood: 'serious',
              text: 'La ventana está por cerrarse. El dashboard ya muestra lo que opinan los usuarios de la versión de prueba.',
            },
            { speaker: 'marisol', mood: 'neutral', text: 'Tu llamada, {nombre}. ¿Qué hacemos con la nueva versión?' },
          ],
          interaction: {
            kind: 'live-decision',
            prompt: 'Mira las reacciones en vivo y decide. Esta vez no hay reloj: la presión la ponen los usuarios.',
            baseline: [
              { when: { performanceAtLeast: 70 }, positivePct: 78, note: 'Los usuarios de prueba reaccionan bien.' },
              { when: { performanceAtLeast: 50 }, positivePct: 64, note: 'Las reacciones de los usuarios de prueba están divididas.' },
              { positivePct: 48, note: 'Los usuarios de prueba reportan bastantes problemas.' },
            ],
            options: [
              {
                id: 'lanzar',
                label: 'Lanzar ahora para todos',
                description: 'La versión sale hoy al 100 % de los usuarios.',
                results: [
                  {
                    when: { performanceAtLeast: 70 },
                    dashboard: { positivePct: 91, headline: '¡Las reacciones positivas se disparan!' },
                    outcome: {
                      id: 'lanzamiento-exitoso',
                      label: 'Lanzamiento total bien preparado',
                      performance: 4,
                      affinity: { pressure: 2 },
                      reactions: [
                        { speaker: 'andres', mood: 'excited', text: '¡Mira esos 👍! El cliente está feliz.' },
                        { speaker: 'marisol', mood: 'happy', text: 'Salió bien porque llegamos con la tarea hecha.' },
                      ],
                    },
                  },
                  {
                    when: { performanceAtLeast: 50 },
                    dashboard: { positivePct: 70, headline: 'Reacciones mixtas: a muchos les encanta, otros reportan detalles.' },
                    outcome: {
                      id: 'lanzamiento-mixto',
                      label: 'Lanzamiento total con detalles pendientes',
                      performance: 1,
                      affinity: { pressure: 2 },
                      reactions: [
                        { speaker: 'andres', mood: 'neutral', text: 'Hay de todo… pero salió.' },
                        { speaker: 'marisol', mood: 'concerned', text: 'Vamos a tener que corregir detalles en caliente.' },
                      ],
                    },
                  },
                  {
                    dashboard: { positivePct: 42, headline: 'Llueven los 👎: la versión salió con problemas.' },
                    outcome: {
                      id: 'lanzamiento-dificil',
                      label: 'Lanzamiento total antes de estar listos',
                      performance: -3,
                      affinity: { pressure: 2 },
                      reactions: [
                        { speaker: 'andres', mood: 'concerned', text: 'Esto no se ve bien… el cliente va a llamar.' },
                        { speaker: 'marisol', mood: 'serious', text: 'Salimos antes de estar listos. Toca contener y aprender.' },
                      ],
                    },
                  },
                ],
              },
              {
                id: 'esperar',
                label: 'Esperar y lanzar la próxima semana',
                description: 'Nadie ve la nueva versión hasta que esté pulida.',
                results: [
                  {
                    dashboard: { positivePct: 63, headline: 'Todo estable, pero los usuarios preguntan por la nueva versión.' },
                    outcome: {
                      id: 'lanzamiento-pospuesto',
                      label: 'Lanzamiento pospuesto',
                      affinity: { detail: 2 },
                      reactions: [
                        { speaker: 'andres', mood: 'concerned', text: 'El cliente esperaba verla hoy… se lo explico.' },
                        { speaker: 'marisol', mood: 'neutral', text: 'Es una decisión válida. Ganamos tiempo, perdemos impulso.' },
                      ],
                    },
                  },
                ],
              },
              {
                id: 'por-partes',
                label: 'Liberar por partes',
                description: 'Primero el 20 % de los usuarios; si todo va bien, el resto mañana.',
                results: [
                  {
                    when: { performanceAtLeast: 70 },
                    dashboard: { positivePct: 88, headline: 'El primer 20 % la adora; el resto la recibe mañana.' },
                    outcome: {
                      id: 'lanzamiento-gradual-exitoso',
                      label: 'Lanzamiento gradual bien preparado',
                      performance: 3,
                      affinity: { analytical: 2, structure: 2 },
                      reactions: [
                        { speaker: 'marisol', mood: 'happy', text: 'Controlado y con datos. Así se lanza.' },
                        { speaker: 'andres', mood: 'happy', text: 'El cliente ve la versión hoy y sin sustos.' },
                      ],
                    },
                  },
                  {
                    when: { performanceAtLeast: 50 },
                    dashboard: { positivePct: 77, headline: 'Aparece un detalle menor en el primer grupo y se corrige a tiempo.' },
                    outcome: {
                      id: 'lanzamiento-gradual',
                      label: 'Lanzamiento gradual con un detalle contenido',
                      performance: 3,
                      affinity: { analytical: 2, structure: 2 },
                      reactions: [
                        {
                          speaker: 'marisol',
                          mood: 'happy',
                          text: 'El primer grupo destapó un detalle y lo corregimos antes de que llegara a todos.',
                        },
                      ],
                    },
                  },
                  {
                    dashboard: { positivePct: 61, headline: 'Hay problemas, pero solo en el primer grupo: se contienen a tiempo.' },
                    outcome: {
                      id: 'lanzamiento-gradual-contenido',
                      label: 'Lanzamiento gradual que contuvo problemas',
                      performance: 1,
                      affinity: { analytical: 2, structure: 2 },
                      reactions: [
                        { speaker: 'marisol', mood: 'serious', text: 'Aparecieron problemas, pero solo en el 20 %. Menos mal que fuimos por partes.' },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        },
        {
          id: '3.4',
          title: 'Retro final',
          clock: '4:30 p. m.',
          screen: 'video-call',
          participants: ['marisol'],
          hud: { launchWindow: true },
          lines: [
            { speaker: 'marisol', mood: 'happy', text: 'Ya pasó lo más duro. Antes de cerrar la semana, hagamos una retro rápida.' },
            { speaker: 'marisol', mood: 'neutral', text: '¿Qué te llevas de estos días, {nombre}?' },
          ],
          interaction: {
            kind: 'dialogue',
            options: [
              {
                id: 'investigar',
                label: 'Investigar antes de actuar ahorra tiempo.',
                outcome: {
                  id: 'retro-analisis',
                  label: 'Reflexión: investigar antes de actuar',
                  affinity: { analytical: 3 },
                  reactions: [
                    { speaker: 'marisol', mood: 'happy', text: 'Totalmente. Cinco minutos de análisis a veces ahorran un día entero.' },
                  ],
                },
              },
              {
                id: 'comunicar',
                label: 'Comunicar a tiempo evita que los problemas crezcan.',
                outcome: {
                  id: 'retro-comunicacion',
                  label: 'Reflexión: comunicar a tiempo',
                  affinity: { communication: 3 },
                  reactions: [
                    { speaker: 'marisol', mood: 'happy', text: 'Sí. Un mensaje a tiempo le quita la mitad del estrés a un equipo.' },
                  ],
                },
              },
              {
                id: 'decidir',
                label: 'A veces hay que decidir rápido aunque falte información.',
                outcome: {
                  id: 'retro-presion',
                  label: 'Reflexión: decidir con información incompleta',
                  affinity: { pressure: 3 },
                  reactions: [
                    { speaker: 'marisol', mood: 'happy', text: 'Así es. Esperar la información perfecta también es una decisión.' },
                  ],
                },
              },
            ],
          },
        },
        {
          id: '3.5',
          title: 'Resultado final',
          screen: 'summary',
          interaction: {
            kind: 'summary',
            scope: 'module',
            heading: 'Tu semana en PixelForge',
            continueLabel: 'Ver el camino desde acá',
            closing: [
              {
                when: { performanceAtLeast: 75 },
                speaker: 'marisol',
                text: 'Tuviste una semana muy sólida, {nombre}. Investigaste antes de actuar, cuidaste al equipo y tomaste decisiones difíciles con criterio. Eso no es suerte: es una forma de trabajar.',
              },
              {
                when: { performanceAtLeast: 55 },
                speaker: 'marisol',
                text: 'Fue una semana con aciertos claros y algunos tropiezos, como la de cualquiera que empieza. Lo importante: cuando algo salió mal, lo viste y seguiste adelante. Eso se entrena.',
              },
              {
                speaker: 'marisol',
                text: 'Fue una semana difícil, y está bien decirlo. Varias decisiones complicaron las cosas, pero llegaste hasta el final y ahora sabes cómo se siente estar en medio de un incidente real. Ese aprendizaje vale mucho.',
              },
            ],
          },
        },
        {
          id: '3.6',
          title: 'Proyección de carrera',
          screen: 'timeline',
          participants: ['marisol'],
          lines: [
            {
              speaker: 'marisol',
              mood: 'happy',
              text: 'Lo que viviste esta semana es el punto de partida, no el destino. Así se ve el camino desde acá.',
            },
          ],
          interaction: {
            kind: 'timeline',
            continueLabel: 'Terminar el módulo',
            stages: [
              {
                id: 'junior',
                period: 'Año 1',
                title: 'Practicante / Junior',
                narration: 'Aprendo resolviendo problemas reales, con acompañamiento cercano. Justo lo que viví esta semana.',
              },
              {
                id: 'pleno',
                period: 'Años 2–4',
                title: 'Developer Pleno',
                narration: 'Ya no espero que me digan qué hacer paso a paso: propongo soluciones y apoyo a los nuevos practicantes.',
              },
              {
                id: 'senior',
                period: 'Años 5–8',
                title: 'Senior / Líder técnico',
                narration: 'Lidero las decisiones técnicas de un equipo completo, como Marisol ahora mismo.',
              },
            ],
            fork: {
              title: 'Bifurcación',
              narration: 'A partir de aquí el camino se divide. No hay una sola respuesta.',
            },
            branches: [
              {
                id: 'technical',
                path: 'Camino técnico profundo',
                title: 'Arquitecto/a de software',
                narration: 'Diseño cómo se construyen sistemas completos, no una sola función.',
                axes: ['detail', 'structure'],
              },
              {
                id: 'leadership',
                path: 'Camino de liderazgo',
                title: 'Gerente de Ingeniería / CTO',
                narration: 'Dejo de escribir código todo el día y empiezo a liderar personas y estrategia.',
                axes: ['communication'],
              },
              {
                id: 'independent',
                path: 'Camino independiente',
                title: 'Freelance o fundador/a',
                narration: 'Construyo mi propio producto, como PixelForge, que alguna vez empezó siendo la idea de una sola persona.',
                axes: ['pressure'],
              },
            ],
            alignmentNote:
              'Tu forma de decidir esta semana se parece a este camino. No es una predicción ni una recomendación cerrada: es una pista.',
          },
        },
      ],
    },
  ],
};
