// Ajustes del catálogo hechos desde el panel administrativo (demo, en el navegador).
// Se guardan SOLO las diferencias (disponible / precio / existencias) sobre el catálogo base.
// En producción esto vive en la base de datos (tabla COMPONENTE) y se edita vía API.
import type { PCComponent } from '../types/pc-component';

const KEY = 't27.catalog.overrides';

export interface CatalogOverride { active?: boolean; price?: number; stock?: number }
export type OverrideMap = Record<string, CatalogOverride>;

let cache: OverrideMap | null = null;
const base = new Map<string, { price: number; stock: number }>();

export function readOverrides(): OverrideMap {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { cache = {}; }
  return cache!;
}

function writeOverrides(map: OverrideMap) {
  cache = map;
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch { /* sin espacio */ }
}

/** ¿La pieza está disponible para los clientes? (por defecto sí) */
export function isActive(id: string): boolean {
  return readOverrides()[id]?.active !== false;
}

/** Cambia un ajuste de una pieza; si queda igual que el catálogo base, se borra el ajuste. */
export function setOverride(id: string, patch: CatalogOverride) {
  const map = { ...readOverrides() };
  const next = { ...map[id], ...patch };
  const b = base.get(id);
  if (next.active !== false) delete next.active;
  if (b && next.price === b.price) delete next.price;
  if (b && next.stock === b.stock) delete next.stock;
  if (Object.keys(next).length === 0) delete map[id];
  else map[id] = next;
  writeOverrides(map);
}

export function resetOverrides() { writeOverrides({}); }

/** Aplica precio y existencias guardados a los objetos del catálogo (se puede llamar varias veces). */
export function applyOverrides(parts: PCComponent[]) {
  const map = readOverrides();
  for (const p of parts) {
    if (!base.has(p.id)) base.set(p.id, { price: p.price, stock: p.stock });
    const b = base.get(p.id)!;
    p.price = map[p.id]?.price ?? b.price;
    p.stock = map[p.id]?.stock ?? b.stock;
  }
}

export function basePrice(id: string): number | undefined { return base.get(id)?.price; }
export function baseStock(id: string): number | undefined { return base.get(id)?.stock; }
