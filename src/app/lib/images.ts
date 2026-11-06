// Imágenes de productos: se suben desde el panel admin y se guardan en PostgreSQL (tabla imagen, columna bytea).
// Prioridad al mostrar: imagen de la base de datos → /img/components/<id>.webp → ilustración de respaldo.
import { api } from './api';

let versions: Record<string, number> = {};

export function setImageVersions(map: Record<string, number>) { versions = map; window.dispatchEvent(new Event('t27-images')); }

/** URL de la imagen guardada en la base de datos (con la versión para refrescar la caché al cambiarla). */
export function getImage(id: string): string | undefined { return versions[id] ? `/api/imagen/${encodeURIComponent(id)}?v=${versions[id]}` : undefined; }
export function readImages(): Record<string, string> {
  return Object.fromEntries(Object.keys(versions).map((id) => [id, getImage(id)!]));
}

export async function uploadImage(id: string, dataUrl: string) {
  await api(`imagen/${encodeURIComponent(id)}`, { method: 'PUT', body: { dataUrl } });
  versions = { ...versions, [id]: Date.now() };
  window.dispatchEvent(new Event('t27-images'));
}
export async function removeImage(id: string) {
  await api(`imagen/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const { [id]: _gone, ...rest } = versions;
  versions = rest;
  window.dispatchEvent(new Event('t27-images'));
}

/** Reduce a 600px máx. y convierte a WebP (≈20–60 KB) */
export function fileToWebp(file: File, max = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/webp', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen.')); };
    img.src = url;
  });
}
