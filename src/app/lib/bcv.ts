import { useEffect, useState } from 'react';
import { api } from './api';

// Tasa oficial del BCV (Bs por USD). El servidor la consulta a DolarAPI y la guarda en PostgreSQL (tabla tasa_cambio);
// el navegador solo pide /api/bcv. Se conserva la última tasa para mostrarla aunque no haya internet.
export interface BcvRate { rate: number; updatedAt: string; fetchedAt: number }

const KEY = 't27.bcv';
const FRESH_MS = 30 * 60 * 1000; // vuelve a consultar cada 30 min

function readCache(): BcvRate | null {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null') as BcvRate | null; } catch { return null; }
}

let current: BcvRate | null = readCache();
const listeners = new Set<(r: BcvRate | null) => void>();
let inflight: Promise<void> | null = null;

function publish(r: BcvRate) {
  current = r;
  try { localStorage.setItem(KEY, JSON.stringify(r)); } catch { /* sin espacio */ }
  listeners.forEach((l) => l(r));
}

export function refreshBcv(force = false): Promise<void> {
  if (!force && current && Date.now() - current.fetchedAt < FRESH_MS) return Promise.resolve();
  if (inflight) return inflight;
  inflight = api<BcvRate | null>('bcv')
    .then((d) => { if (d && Number.isFinite(d.rate) && d.rate > 0) publish(d); })
    .catch(() => { /* se conserva la última tasa guardada */ })
    .finally(() => { inflight = null; });
  return inflight;
}

/** Tasa BCV actual (o null si nunca se pudo consultar). Se actualiza sola. */
export function useBcv(): BcvRate | null {
  const [rate, setRate] = useState<BcvRate | null>(current);
  useEffect(() => {
    listeners.add(setRate);
    refreshBcv();
    const id = setInterval(() => refreshBcv(), FRESH_MS);
    return () => { listeners.delete(setRate); clearInterval(id); };
  }, []);
  return rate;
}

export const fmtBs = (n: number) => `Bs. ${n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmtDate = (iso: string) => { try { return new Date(iso).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit' }); } catch { return ''; } };
