# Project Guidance

## User Preferences

- Diseño responsivo y limpio optimizado para tablets y teléfonos Android usados en campo u oficina institucional.
- Paleta institucional en tonos azul marino y gris acero.
- Formularios rápidos con teclado numérico optimizado para reducir fricción en la captura diaria.
- Interfaz y textos de la aplicación en español.

## Accepted Requirements

[Filled after each deployed build — what the user asked for and the build delivered]

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- Frontend commands run from src/frontend/ (pnpm typecheck, pnpm fix); backend commands run from src/backend/ (mops check --fix, mops build); bindings are generated from the root with pnpm bindgen.
- The statistical week cycle is Viernes a Jueves: offset = (getDay()+2)%7 from any date gives the Friday week start, shared via src/frontend/src/lib/week.ts.
- The weekly domain lives in src/backend/lib/weeks.mo and src/backend/mixins/weeks-api.mo; the access domain in src/backend/lib/access.mo and src/backend/mixins/access-api.mo; the trámite catalogue in src/backend/lib/catalog.mo.
- The pending initial migration src/backend/migrations/00000000_000000.mo inlines the WeekRecord shape and must stay consistent with the real WeeksLib.State.
- Missing caffeineai-user-approval dependency is fixed with mops add caffeineai-user-approval@1.2.0, not by editing mops.toml.
- caffeineai-email 0.5.0 sendServiceEmail(fromUsername, recipients, subject, htmlBody) returns #ok/#err and never throws; the app exposes it as sendWeekReportEmail.
- Offline capture persists drafts to localStorage keyed by week and enqueues failed saves, flushing on the window 'online' event.
- react-query enabled:false yields isPending true but isLoading false; gate loading UI on isPending to avoid a false error flash.
- OQL manual-mode .payload resolves _toRow through top-level imports; NatValue/IntValue/TextValue/PrincipalValue must be imported in main.mo.
- A dependency-free .xlsx writer works via a stored (uncompressed) ZIP with CRC32 plus OOXML parts.
