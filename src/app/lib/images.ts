// Imágenes de productos subidas desde el panel admin (DEMO: localStorage del navegador).
// Prioridad al mostrar: imagen subida → /img/components/<id>.webp → ilustración de respaldo.
const KEY = 't27.images';
type ImageMap = Record<string, string>;

export function readImages(): ImageMap {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') as ImageMap; } catch { return {}; }
}
export function getImage(id: string): string | undefined { return readImages()[id]; }

function save(map: ImageMap) {
  try { localStorage.setItem(KEY, JSON.stringify(map)); window.dispatchEvent(new Event('t27-images')); }
  catch { throw new Error('No hay espacio en el navegador. Exporta las imágenes y súbelas a public/img/components/.'); }
}
export function setImage(id: string, dataUrl: string) { save({ ...readImages(), [id]: dataUrl }); }
export function removeImage(id: string) { const m = readImages(); delete m[id]; save(m); }

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

// ---- ZIP sin compresión (store) para exportar a public/img/components/ ----
const crcTable = (() => { const t: number[] = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b: Uint8Array) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

export function exportImagesZip(): Blob | null {
  const entries = Object.entries(readImages());
  if (!entries.length) return null;
  const enc = new TextEncoder();
  const parts: Uint8Array[] = []; const central: Uint8Array[] = [];
  let offset = 0;
  for (const [id, dataUrl] of entries) {
    const bin = atob(dataUrl.split(',')[1]); const data = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
    const name = enc.encode(`${id}.webp`); const crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true);
    parts.push(new Uint8Array(lh.buffer), name, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint32(16, crc, true);
    ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true); ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const cdSize = central.reduce((t, p) => t + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)] as BlobPart[], { type: 'application/zip' });
}
