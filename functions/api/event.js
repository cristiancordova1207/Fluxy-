import { APPS, track, json } from '../_lib.js';

// Avisos anónimos de las apps: { app, kind: 'install' | 'open', version, os, install_id }.
export async function onRequestPost({ request, waitUntil }) {
  let ev;
  try { ev = await request.json(); } catch { return json({ ok: false }, 400); }
  if (!APPS[ev?.app] || !['install', 'open'].includes(ev?.kind)) return json({ ok: false }, 400);
  if (ev.install_id && !/^[0-9a-f-]{8,64}$/i.test(ev.install_id)) return json({ ok: false }, 400);
  track(request, { waitUntil }, { app: ev.app, kind: ev.kind, version: String(ev.version || '').slice(0, 32), os: String(ev.os || '').slice(0, 40), install_id: ev.install_id, referrer: '' });
  return json({ ok: true });
}
