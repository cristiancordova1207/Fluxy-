# Fluxy · Flux Vid

Web de descargas de FLUX, CaptLY, MicLY y Cutlify, con donaciones y estadísticas.

- Cloudflare Pages, proyecto `fluxy` → https://fluxy-8yg.pages.dev (sin build; se publica la carpeta tal cual).
- `functions/`: `/api/download/<app>` (registra y redirige al instalador más reciente de GitHub), `/api/event` (avisos anónimos de las apps), `/api/apps` (versiones) y `/donar` (enlace de Stripe en `functions/_lib.js`).
- Las estadísticas se guardan en Supabase (`fluxy_events`, funciones `fluxy_track` y `fluxy_stats`; ver `supabase/fluxy.sql`).

Publicar: `npx wrangler pages deploy . --project-name fluxy --branch main`
