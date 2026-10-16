import { APPS, latest, track } from '../../_lib.js';

// /api/download/<programa>: registra la descarga y lleva al instalador más reciente.
export async function onRequestGet({ request, params, waitUntil }) {
  const id = String(params.app || '').toLowerCase();
  if (!APPS[id]) return new Response('Programa desconocido', { status: 404 });
  const ctx = { waitUntil };
  const info = await latest(id, ctx);
  track(request, ctx, { app: id, kind: 'download', version: info.version });
  return Response.redirect(info.url, 302);
}
