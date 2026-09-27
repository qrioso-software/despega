# ADR 0006: identidad visual compartida desde el logo

- Estado: aceptado
- Fecha: 2026-09-27

## Contexto

Llegó el logo oficial (`despega-logo.jpeg`: cohete que forma la «D», navy y una llama
verde, lema «Decide tu futuro»). Web y admin usaban una paleta provisional (naranja,
violeta y crema) y un cohete dibujado en código, cada una con sus propios hex. El logo
es común a las dos apps.

## Decisión

- Paquete `@despega/brand` como fuente única de la identidad: el JPEG original, su
  versión vectorial (`despega-logo.svg`), el isotipo, los íconos de las apps, el
  componente `DespegaLogo` y la paleta `palette.css` (variables `--despega-*`).
- La paleta sale del logo: navy `#17233b` para tinta y superficies oscuras; verde
  `#75be65` de la llama para la acción principal y el logro. Como el logo no trae un
  color de interacción y el verde ya significa «bien», la selección, los enlaces y el
  foco usan un azul del tono del navy (`#2564d0`). Ámbar y rojo quedan solo como
  estados.
- Cada app traduce la paleta a su sistema: `@theme` de Tailwind en web (tokens `brand`,
  `accent`, `good`, `sun`, `bad`… con variantes `soft` y `strong`) y variables de HeroUI
  en admin. Los componentes usan esos tokens; no hay hex de marca en TSX.
- Todo par texto/fondo en uso cumple WCAG AA. Sobre el verde el texto va en tinta
  (6,9:1); en blanco no alcanza (2,3:1).

## Alternativas consideradas

- **Copiar logo y paleta en cada app**: dos fuentes que divergen; es lo que obligó a
  tocar hex sueltos en decenas de componentes para este cambio.
- **Un `@theme` de Tailwind compartido**: choca con los nombres de HeroUI en admin
  (`accent`, `surface`, `muted`) y forma ciclos de variables. Las variables con prefijo
  `--despega-*` evitan el choque.
- **Verde como color de selección**: se confunde con la respuesta correcta en los
  mini-juegos.

## Consecuencias

- Cambiar un color es editar `palette.css` (y su mapeo si cambia el rol).
- El SVG se trazó desde el JPEG; si llega el vector del diseñador, se reemplazan los
  trazos de `despega-logo.svg`, `despega-mark.svg`, `logo.tsx` y los íconos.
- Next.js solo lee `favicon.ico`, `icon.svg` y `apple-icon.png` desde `app/`: cada app
  guarda una copia de `packages/brand/assets/icons/`, que se actualiza junto con ella.
