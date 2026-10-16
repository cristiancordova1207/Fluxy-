import { APPS, latest, json } from '../_lib.js';

// Versión, tamaño y fecha de cada programa para mostrarlos en la web.
export async function onRequestGet({ waitUntil }) {
  const list = await Promise.all(Object.keys(APPS).map((id) => latest(id, { waitUntil })));
  return json(Object.fromEntries(list.map((x) => [x.id, { version: x.version, size: x.size, date: x.date }])));
}
