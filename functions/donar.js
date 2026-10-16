import { APPS, DONATE_URL, track } from './_lib.js';

// /donar?app=<programa>: cuenta el clic y lleva a Stripe, donde cada persona elige la cantidad.
export async function onRequestGet({ request, waitUntil }) {
  const app = new URL(request.url).searchParams.get('app');
  track(request, { waitUntil }, { app: APPS[app] ? app : 'flux', kind: 'donate' });
  return Response.redirect(DONATE_URL, 302);
}
