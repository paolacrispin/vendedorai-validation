const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function saveSurvey(data: object) {
  const res = await fetch(`${API}/surveys`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Error al guardar encuesta');
  return res.json();
}

export async function getMetrics() {
  const res = await fetch(`${API}/metrics`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar métricas');
  return res.json();
}

export async function getSampling() {
  const res = await fetch(`${API}/sampling`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar muestreo');
  return res.json();
}

export async function getSurveys() {
  const res = await fetch(`${API}/surveys`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar encuestas');
  return res.json();
}

export const EXPORT_CSV_URL  = `${API}/export/csv`;
export const EXPORT_JSON_URL = `${API}/export/json`;
