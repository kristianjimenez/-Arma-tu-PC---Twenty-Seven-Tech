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
    // si el administrador eliminó piezas, se quitan también de la lista local
    if (r.componentes.length) {
      const ids = new Set(r.componentes.map((c) => c.id));
      for (let i = parts.length - 1; i >= 0; i--) if (!ids.has(parts[i].id)) parts.splice(i, 1);
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
  await api(`componentes?id=${encodeURIComponent(part.id)}`, {
    method: 'PATCH',
    body: { ...(patch.price !== undefined ? { precio: patch.price } : {}), ...(patch.stock !== undefined ? { existencias: patch.stock } : {}), ...(patch.active !== undefined ? { activo: patch.active } : {}) },
  });
  if (patch.price !== undefined) part.price = patch.price;
  if (patch.stock !== undefined) part.stock = patch.stock;
  if (patch.active !== undefined) { if (patch.active) inactive.delete(part.id); else inactive.add(part.id); }
  window.dispatchEvent(new Event('t27-catalog'));
}

/** Datos del formulario de inventario (alta y edición de piezas). */
export interface PartInput {
  category: PCComponent['category'];
  brand: string; name: string; price: number; stock: number; rating: number; specs: string; tag?: string;
  socket?: string; chipset?: string; ramType?: string; wattage?: number; formFactor?: string;
  supportedForms?: string[]; minWattage?: number; igpu?: string;
}

const toApi = (p: PartInput) => ({
  categoria: p.category, marca: p.brand, nombre: p.name, precio: p.price, existencias: p.stock, calificacion: p.rating,
  especificaciones: p.specs, etiqueta: p.tag ?? '', socket: p.socket, chipset: p.chipset, tipo_ram: p.ramType,
  vatios: p.wattage, formato: p.formFactor, formatos_soportados: p.supportedForms, vatios_minimos: p.minWattage, gpu_integrada: p.igpu,
});

/** Agrega una pieza nueva al inventario (PostgreSQL) y vuelve a leer el catálogo. */
export async function createPart(input: PartInput, parts: PCComponent[], presets: Preset[]) {
  const r = await api<{ id: string }>('componentes', { method: 'POST', body: toApi(input) });
  await loadCatalog(parts, presets);
  return r.id;
}
/** Edita todos los datos de una pieza, incluida su compatibilidad. */
export async function savePart(id: string, input: PartInput, parts: PCComponent[], presets: Preset[]) {
  await api(`componentes?id=${encodeURIComponent(id)}`, { method: 'PUT', body: toApi(input) });
  await loadCatalog(parts, presets);
}
/** Elimina una pieza. Si ya tiene pedidos, equipos o builds, el servidor la rechaza (hay que desactivarla). */
export async function deletePart(id: string, parts: PCComponent[], presets: Preset[]) {
  await api(`componentes?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  await loadCatalog(parts, presets);
}
