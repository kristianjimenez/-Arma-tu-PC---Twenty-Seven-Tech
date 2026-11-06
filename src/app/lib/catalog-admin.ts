// Catálogo: viene de PostgreSQL (tablas componente, equipo_preconfigurado y equipo_pieza).
// Los datos estáticos de data/pc-components.ts solo sirven de respaldo si la API no responde.
import type { PCComponent } from '../types/pc-component';
import type { Preset } from '../data/presets';
import { api } from './api';
import { setImageVersions } from './images';

const inactive = new Set<string>();

/** ¿La pieza está disponible para los clientes? (por defecto sí) */
export function isActive(id: string): boolean { return !inactive.has(id); }

interface CatalogResponse {
  componentes: (PCComponent & { active: boolean })[];
  equipos: Preset[];
  imagenes: Record<string, number>;
}

/** Descarga el catálogo de la base de datos y actualiza en sitio los arreglos que usa toda la interfaz. */
export async function loadCatalog(parts: PCComponent[], presets: Preset[]): Promise<boolean> {
  try {
    const r = await api<CatalogResponse>('catalogo');
    const byId = new Map(parts.map((p) => [p.id, p]));
    inactive.clear();
    for (const row of r.componentes) {
      const { active, ...data } = row;
      if (!active) inactive.add(row.id);
      const cur = byId.get(row.id);
      if (cur) Object.assign(cur, { tag: undefined, igpu: undefined }, data);
      else parts.push(data as PCComponent);
    }
    if (r.equipos.length) presets.splice(0, presets.length, ...r.equipos);
    setImageVersions(r.imagenes);
    window.dispatchEvent(new Event('t27-catalog'));
    return true;
  } catch {
    return false; // sin API: se queda el catálogo de respaldo
  }
}

/** Cambia precio, existencias o disponibilidad de una pieza en la base de datos. */
export async function updatePart(part: PCComponent, patch: { active?: boolean; price?: number; stock?: number }) {
  await api(`componentes/${encodeURIComponent(part.id)}`, {
    method: 'PATCH',
    body: { ...(patch.price !== undefined ? { precio: patch.price } : {}), ...(patch.stock !== undefined ? { existencias: patch.stock } : {}), ...(patch.active !== undefined ? { activo: patch.active } : {}) },
  });
  if (patch.price !== undefined) part.price = patch.price;
  if (patch.stock !== undefined) part.stock = patch.stock;
  if (patch.active !== undefined) { if (patch.active) inactive.delete(part.id); else inactive.add(part.id); }
  window.dispatchEvent(new Event('t27-catalog'));
}
