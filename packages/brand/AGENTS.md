# @despega/brand

Identidad visual compartida por `apps/web` y `apps/admin`: logo, paleta e íconos de
carrera.

## Contenido

- `assets/despega-logo.jpeg`: original entregado. Es la referencia; no se sirve.
- `assets/despega-logo.svg`: versión vectorial optimizada (fondo transparente, ~18 KB)
  para usos fuera de React (documentos, correos que acepten SVG, otros proyectos).
- `assets/despega-mark.svg`: isotipo (cohete + «D») del mismo trazo.
- `assets/icons/`: `favicon.ico` (16, 32 y 48 px), `icon.svg` y `apple-icon.png`
  (180 px, a sangre): isotipo blanco con llama verde sobre navy. Next.js solo los lee
  desde `app/`, así que `apps/web/src/app/` y `apps/admin/src/app/` guardan una copia;
  si cambian aquí, se copian a las dos apps.
- `src/logo.tsx` (`DespegaLogo`): el mismo trazo como componente. El navy es
  `currentColor` (`text-ink` sobre fondos claros, `text-white` sobre `night`); la
  llama conserva su verde. `tagline` agrega «Decide tu futuro» solo en tamaños grandes.
- `src/career-icons.ts` (`CAREER_ICONS`, `DEFAULT_CAREER_ICON`): ícono de
  `lucide-react` por `careerId`. Cada app lo envuelve en su `CareerIcon` con sus
  tokens. Se exporta como mapa, no como función, para cumplir
  `react-hooks/static-components`. Una carrera nueva agrega aquí su ícono.
- `src/palette.css` (`@despega/brand/palette.css`): variables `--despega-*`, fuente
  única de color. Web la mapea en el `@theme` de `globals.css` y admin en las variables
  de HeroUI de `styles.css`.

## Reglas

- Un color nuevo se agrega aquí y luego se mapea en cada app; los componentes usan los
  tokens de su app (`bg-accent`, `text-good-strong`, `--accent`…), nunca hex sueltos ni
  `--despega-*` directo.
- Todo par texto/fondo que usen las apps cumple WCAG AA (4.5:1 texto, 3:1 íconos y
  bordes). Sobre `brand` (verde) el texto va en tinta, no en blanco (2.3:1).
- El SVG se trazó con potrace desde el JPEG (desmezcla navy/verde y sobremuestreo 4×).
  Si llega un vector original del diseñador, reemplaza todos los trazos (SVG,
  isotipo, `logo.tsx` e íconos).
- Sin clases de Tailwind dentro del paquete: las apps no lo escanean.
- `lucide-react` es dependencia par (misma versión exacta que las apps).
