// Configuración compartida de las funciones de Cloudflare Pages.

// Enlace de donación de Stripe (cantidad libre). Para cambiarlo basta con editar esta línea:
// las apps y la web van a /donar, que redirige aquí.
export const DONATE_URL = 'https://donate.stripe.com/test_3cI7sLcIf8Jtc4g6gV0x200';

// Supabase: clave pública (anon). Solo puede llamar a fluxy_track y fluxy_stats.
const SUPABASE_URL = 'https://dcepxcltgzipkmzpptzn.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjZXB4Y2x0Z3ppcGttenBwdHpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5Nzc4MjcsImV4cCI6MjEwNjU1MzgyN30.67hgXvgyngQvsGK2w82iDk6WMCLGfLshhoZgyH-Fw0c';

// Dónde está el instalador de cada programa (GitHub Releases públicas).
export const APPS = {
  flux: { name: 'FLUX', repo: 'flux-releases', asset: /^FLUX-Setup\.exe$/i, fallback: 'https://github.com/cristiancordova1207/flux-releases/releases/latest/download/FLUX-Setup.exe' },
  captly: { name: 'CaptLY', repo: 'CaptLY', asset: /Setup.*\.exe$/i, fallback: 'https://github.com/cristiancordova1207/CaptLY/releases/latest' },
  micly: { name: 'MicLY', repo: 'MicLY-releases', asset: /Setup.*\.exe$/i, fallback: 'https://github.com/cristiancordova1207/MicLY-releases/releases/latest' },
  cutlify: { name: 'Cutlify', repo: 'CUTLIFLY', asset: /^CUTLIFY-Setup\.exe$/i, prerelease: true, fallback: 'https://github.com/cristiancordova1207/CUTLIFLY/releases' },
};

// Última versión publicada de un programa (con caché de 15 min para no gastar el límite de la API de GitHub).
export async function latest(id, ctx) {
  const a = APPS[id];
  const cache = caches.default;
  const key = new Request(`https://cache.fluxy/v2/${id}`);
  const hit = await cache.match(key);
  if (hit) return hit.json();
  let info = { id, name: a.name, url: a.fallback, version: null, size: null, date: null };
  try {
    const r = await fetch(`https://api.github.com/repos/cristiancordova1207/${a.repo}/releases?per_page=10`, {
      headers: { 'User-Agent': 'fluxy-pages', Accept: 'application/vnd.github+json' },
    });
    if (r.ok) {
      const rel = (await r.json()).find((x) => !x.draft && (a.prerelease || !x.prerelease) && x.assets.some((s) => a.asset.test(s.name)));
      if (rel) {
        const asset = rel.assets.find((s) => a.asset.test(s.name));
        info = { ...info, url: asset.browser_download_url, version: rel.tag_name.replace(/^v/, ''), size: asset.size, date: rel.published_at };
      }
    }
  } catch {}
  const res = new Response(JSON.stringify(info), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=900' } });
  ctx.waitUntil(cache.put(key, res.clone()));
  return info;
}

// Guarda un evento con la ubicación aproximada que da Cloudflare (no se guarda la IP).
export function track(request, ctx, ev) {
  const cf = request.cf || {};
  const ua = request.headers.get('User-Agent') || '';
  const os = ev.os || (/Windows NT 10/.test(ua) ? 'Windows 10/11' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : 'Otro');
  let ref = request.headers.get('Referer') || '';
  try { ref = ref ? new URL(ref).hostname : ''; } catch { ref = ''; }
  const body = {
    p_app: ev.app, p_kind: ev.kind, p_version: ev.version || null, p_country: cf.country || null, p_region: cf.region || null,
    p_city: cf.city || null, p_lat: cf.latitude ? Number(cf.latitude) : null, p_lon: cf.longitude ? Number(cf.longitude) : null,
    p_os: os, p_referrer: ev.referrer ?? ref, p_install_id: ev.install_id || null,
  };
  ctx.waitUntil(fetch(`${SUPABASE_URL}/rest/v1/rpc/fluxy_track`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {}));
}

export const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
});
