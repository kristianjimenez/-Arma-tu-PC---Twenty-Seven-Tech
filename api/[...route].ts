// API de "Arma tu PC · Twenty Seven Tech" — funciones serverless de Vercel + PostgreSQL (Neon).
// Un solo archivo con todas las rutas (el plan gratuito de Vercel limita el número de funciones).
// La conexión viene de la variable de entorno DATABASE_URL (se configura en Vercel, NUNCA en el código).
import { neon } from '@neondatabase/serverless';
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb) as (pw: string, salt: string, len: number) => Promise<Buffer>;

interface Req { method?: string; url?: string; headers: Record<string, string | string[] | undefined>; body?: any }
interface Res {
  status(code: number): Res; setHeader(k: string, v: string): void;
  json(body: unknown): void; send(body: unknown): void; end(): void;
}

const TAX_RATE = 0.16;
const SESSION_DAYS = 30;
const CATS = ['cpu', 'motherboard', 'ram', 'gpu', 'storage', 'power', 'case'] as const;
const STATES = ['pendiente', 'atendida', 'vendida', 'cancelada'];

let _sql: ReturnType<typeof neon> | null = null;
function db() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new HttpError(503, 'Falta configurar DATABASE_URL en Vercel.');
    _sql = neon(url);
  }
  return _sql;
}
async function q<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await db().query(text, params as any[])) as T[];
}

class HttpError extends Error { constructor(public code: number, msg: string) { super(msg); } }
const bad = (msg: string) => new HttpError(400, msg);

// ───────────── contraseñas y sesiones ─────────────
async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const h = (await scrypt(pw, salt, 64)).toString('hex');
  return `scrypt$${salt}$${h}`;
}
async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [alg, salt, h] = stored.split('$');
  if (alg !== 'scrypt' || !salt || !h) return false;
  const a = await scrypt(pw, salt, 64);
  const b = Buffer.from(h, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
const sha256 = (t: string) => createHash('sha256').update(t).digest('hex');

interface User { id: number; nombre: string; correo: string; rol: 'cliente' | 'admin' }

async function newSession(userId: number): Promise<string> {
  const token = randomBytes(32).toString('hex');
  await q('INSERT INTO sesion (token_hash, usuario_id, expira_en) VALUES ($1,$2, now() + ($3 || \' days\')::interval)', [sha256(token), userId, String(SESSION_DAYS)]);
  return token;
}
function bearer(req: Req): string | null {
  const h = req.headers['authorization'];
  const v = Array.isArray(h) ? h[0] : h;
  return v && v.startsWith('Bearer ') ? v.slice(7) : null;
}
async function getUser(req: Req): Promise<User | null> {
  const t = bearer(req);
  if (!t) return null;
  const r = await q<User>('SELECT u.id, u.nombre, u.correo, u.rol FROM sesion s JOIN usuario u ON u.id = s.usuario_id WHERE s.token_hash = $1 AND s.expira_en > now()', [sha256(t)]);
  return r[0] ?? null;
}
async function requireUser(req: Req): Promise<User> {
  const u = await getUser(req);
  if (!u) throw new HttpError(401, 'Inicia sesión para continuar.');
  return u;
}
async function requireAdmin(req: Req): Promise<User> {
  const u = await requireUser(req);
  if (u.rol !== 'admin') throw new HttpError(403, 'Solo el administrador puede hacer esto.');
  return u;
}
const publicUser = (u: User) => ({ name: u.nombre, email: u.correo, ...(u.rol === 'admin' ? { role: 'admin' as const } : {}) });

// ───────────── utilidades de validación ─────────────
function text(v: unknown, field: string, min: number, max: number): string {
  const s = typeof v === 'string' ? v.trim() : '';
  if (s.length < min || s.length > max) throw bad(`${field} no es válido.`);
  return s;
}
const num = (v: unknown) => Number(v);
const round2 = (n: number) => Math.round(n * 100) / 100;

// ───────────── catálogo ─────────────
const toPart = (r: any) => ({
  id: r.id, category: r.categoria, brand: r.marca, name: r.nombre, price: num(r.precio), specs: r.especificaciones,
  stock: r.existencias, rating: r.calificacion, active: r.activo,
  ...(r.etiqueta ? { tag: r.etiqueta } : {}),
  ...(r.socket ? { socket: r.socket } : {}), ...(r.chipset ? { chipset: r.chipset } : {}),
  ...(r.tipo_ram ? { ramType: r.tipo_ram } : {}), ...(r.vatios ? { wattage: r.vatios } : {}),
  ...(r.formato ? { formFactor: r.formato } : {}), ...(r.formatos_soportados ? { supportedForms: r.formatos_soportados } : {}),
  ...(r.vatios_minimos ? { minWattage: r.vatios_minimos } : {}), ...(r.gpu_integrada ? { igpu: r.gpu_integrada } : {}),
});

async function catalogo() {
  const [comps, equipos, piezas, imgs] = await Promise.all([
    q('SELECT * FROM componente ORDER BY categoria, length(id), id'),
    q('SELECT * FROM equipo_preconfigurado ORDER BY orden'),
    q('SELECT * FROM equipo_pieza'),
    q('SELECT componente_id, (extract(epoch FROM actualizado_en) * 1000)::bigint AS v FROM imagen'),
  ]);
  return {
    componentes: comps.map(toPart),
    equipos: equipos.map((e: any) => ({
      id: e.id, name: e.nombre, tagline: e.descripcion, ...(e.insignia ? { badge: e.insignia } : {}),
      parts: Object.fromEntries(piezas.filter((p: any) => p.equipo_id === e.id).map((p: any) => [p.categoria, p.componente_id])),
    })),
    imagenes: Object.fromEntries(imgs.map((i: any) => [i.componente_id, Number(i.v)])),
  };
}

// ───────────── compatibilidad (misma lógica que el cliente, pero validada en el servidor) ─────────────
function validarPiezas(rows: any[]): string[] {
  const p: Record<string, any> = {};
  for (const r of rows) {
    if (p[r.categoria]) throw bad(`Solo puedes elegir una pieza de tipo ${r.categoria}.`);
    p[r.categoria] = r;
  }
  const errs: string[] = [];
  const tieneIgpu = !!p.cpu?.gpu_integrada;
  for (const c of CATS) if (!p[c] && !(c === 'gpu' && tieneIgpu)) errs.push(`Falta elegir: ${c}.`);
  if (p.cpu && p.motherboard && p.cpu.socket !== p.motherboard.socket) errs.push('El socket del CPU no coincide con la placa base.');
  if (p.ram && p.motherboard && p.ram.tipo_ram !== p.motherboard.tipo_ram) errs.push('El tipo de RAM no coincide con la placa base.');
  if (p.gpu?.vatios_minimos && p.power?.vatios && p.power.vatios < p.gpu.vatios_minimos) errs.push('La fuente no alcanza para la tarjeta gráfica.');
  if (p.case?.formatos_soportados && p.motherboard?.formato && !p.case.formatos_soportados.includes(p.motherboard.formato)) errs.push('La placa base no cabe en el case.');
  return errs;
}

// ───────────── tasa BCV (consulta a DolarAPI desde el servidor y la guarda en PostgreSQL) ─────────────
const BCV_URL = 'https://ve.dolarapi.com/v1/dolares/oficial';
const BCV_FRESH_MS = 30 * 60 * 1000;

async function tasaBcv() {
  const last = (await q('SELECT id, tasa, publicada, consultada FROM tasa_cambio ORDER BY consultada DESC LIMIT 1'))[0];
  const fresh = last && Date.now() - new Date(last.consultada).getTime() < BCV_FRESH_MS;
  if (!fresh) {
    try {
      const r = await fetch(BCV_URL, { signal: AbortSignal.timeout(6000) });
      if (r.ok) {
        const d: any = await r.json();
        const rate = Number(d?.promedio ?? d?.venta ?? d?.compra);
        if (Number.isFinite(rate) && rate > 0) {
          const pub = d?.fechaActualizacion ? new Date(d.fechaActualizacion).toISOString() : new Date().toISOString();
          if (last && Math.abs(num(last.tasa) - rate) < 0.00005) await q('UPDATE tasa_cambio SET consultada = now(), publicada = $2 WHERE id = $1', [last.id, pub]);
          else await q('INSERT INTO tasa_cambio (fuente, tasa, publicada) VALUES ($1,$2,$3)', ['BCV', rate, pub]);
        }
      }
    } catch { /* sin conexión con DolarAPI: se usa la última tasa guardada */ }
  }
  const cur = (await q('SELECT tasa, publicada, consultada FROM tasa_cambio ORDER BY consultada DESC LIMIT 1'))[0];
  if (!cur) return null;
  return { rate: num(cur.tasa), updatedAt: new Date(cur.publicada ?? cur.consultada).toISOString(), fetchedAt: new Date(cur.consultada).getTime() };
}

// ───────────── pedidos ─────────────
const rnd = () => Math.random().toString(36).slice(2, 6).toUpperCase();
function codigoPedido(): string {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `T27-${ymd}-${rnd()}`;
}

async function crearPedido(req: Req) {
  const b = req.body ?? {};
  const user = await getUser(req);
  const cliente = text(b.cliente, 'El nombre', 2, 80);
  const telefono = text(b.telefono, 'El teléfono', 7, 30);
  if (telefono.replace(/\D/g, '').length < 10) throw bad('El teléfono debe tener al menos 10 dígitos.');
  const metodo = b.metodo === 'local' ? 'local' : 'whatsapp';
  const nota = typeof b.nota === 'string' ? b.nota.trim().slice(0, 500) : '';
  const correo = user?.correo ?? (typeof b.correo === 'string' ? b.correo.trim().toLowerCase().slice(0, 120) : null);
  const ids: string[] = Array.isArray(b.piezas) ? b.piezas.filter((x: unknown) => typeof x === 'string') : [];
  if (ids.length < 6 || ids.length > 7) throw bad('El pedido debe tener las piezas del equipo.');

  const rows = await q('SELECT * FROM componente WHERE id = ANY($1::text[])', [ids]);
  if (rows.length !== new Set(ids).size) throw bad('Alguna pieza ya no existe en el catálogo.');
  for (const r of rows) {
    if (!r.activo) throw bad(`${r.nombre} ya no está disponible.`);
    if (r.existencias < 1) throw bad(`${r.nombre} está agotado.`);
  }
  const errs = validarPiezas(rows);
  if (errs.length) throw bad(errs[0]);

  // El precio SIEMPRE se calcula en el servidor con los valores de la base de datos.
  const subtotal = round2(rows.reduce((t: number, r: any) => t + num(r.precio), 0));
  const iva = round2(subtotal * TAX_RATE);
  const total = round2(subtotal + iva);
  const tasa = (await q('SELECT tasa FROM tasa_cambio ORDER BY consultada DESC LIMIT 1'))[0]?.tasa ?? null;

  for (let intento = 0; intento < 4; intento++) {
    const codigo = codigoPedido();
    try {
      await q(
        `WITH p AS (
           INSERT INTO pedido (codigo, usuario_id, cliente, telefono, correo, metodo_pago, nota, subtotal, iva, total, tasa_bcv)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id)
         INSERT INTO pedido_item (pedido_id, componente_id, categoria, nombre, precio)
         SELECT p.id, x.cid, x.cat, x.nom, x.pre FROM p, unnest($12::text[], $13::text[], $14::text[], $15::numeric[]) AS x(cid, cat, nom, pre)`,
        [codigo, user?.id ?? null, cliente, telefono, correo, metodo, nota || null, subtotal, iva, total, tasa,
          rows.map((r: any) => r.id), rows.map((r: any) => r.categoria), rows.map((r: any) => r.nombre), rows.map((r: any) => num(r.precio))],
      );
      return { codigo, subtotal, iva, total, tasa: tasa ? num(tasa) : null };
    } catch (e: any) {
      if (e?.code !== '23505') throw e; // 23505 = código repetido: se genera otro
    }
  }
  throw new HttpError(500, 'No se pudo generar el código del pedido. Intenta de nuevo.');
}

const mapPedido = (p: any) => ({
  id: p.id, code: p.codigo, createdAt: new Date(p.creado_en).getTime(), customer: p.cliente, phone: p.telefono,
  email: p.correo ?? '', method: p.metodo_pago, note: p.nota ?? '', subtotal: num(p.subtotal), tax: num(p.iva), total: num(p.total),
  status: p.estado, stockApplied: p.stock_descontado,
  items: (p.items ?? []).map((i: any) => ({ id: i.id, label: i.categoria, name: i.nombre, price: num(i.precio) })),
});

async function listarPedidos() {
  const rows = await q(
    `SELECT p.*, COALESCE(json_agg(json_build_object('id', i.componente_id, 'categoria', i.categoria, 'nombre', i.nombre, 'precio', i.precio) ORDER BY i.id)
            FILTER (WHERE i.id IS NOT NULL), '[]') AS items
     FROM pedido p LEFT JOIN pedido_item i ON i.pedido_id = p.id
     GROUP BY p.id ORDER BY p.creado_en DESC LIMIT 300`,
  );
  return rows.map(mapPedido);
}

// Cambia el estado; al pasar a "vendida" descuenta existencias UNA sola vez, todo en una sentencia atómica.
async function cambiarEstado(id: number, estado: string) {
  if (!STATES.includes(estado)) throw bad('Estado no válido.');
  const r = await q(
    `WITH prev AS (SELECT id, stock_descontado FROM pedido WHERE id = $1),
          upd AS (UPDATE pedido SET estado = $2::text, stock_descontado = (stock_descontado OR $2::text = 'vendida') WHERE id = $1 RETURNING id),
          stk AS (UPDATE componente SET existencias = GREATEST(existencias - 1, 0)
                  WHERE $2::text = 'vendida' AND id IN (SELECT pi.componente_id FROM pedido_item pi JOIN prev ON prev.id = pi.pedido_id WHERE NOT prev.stock_descontado)
                  RETURNING id)
     SELECT (SELECT count(*) FROM upd)::int AS n`,
    [id, estado],
  );
  if (!r[0]?.n) throw new HttpError(404, 'Pedido no encontrado.');
}

// ───────────── imágenes (se guardan como bytea en PostgreSQL) ─────────────
async function guardarImagen(id: string, dataUrl: unknown) {
  const m = typeof dataUrl === 'string' ? /^data:(image\/(?:webp|png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl) : null;
  if (!m) throw bad('Imagen no válida (usa WebP, PNG o JPG).');
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 600 * 1024) throw bad('La imagen es muy pesada (máx. 600 KB).');
  const ok = await q('SELECT 1 FROM componente WHERE id = $1', [id]);
  if (!ok.length) throw new HttpError(404, 'Pieza no encontrada.');
  await q(
    `INSERT INTO imagen (componente_id, tipo_mime, datos) VALUES ($1,$2,decode($3,'hex'))
     ON CONFLICT (componente_id) DO UPDATE SET tipo_mime = EXCLUDED.tipo_mime, datos = EXCLUDED.datos, actualizado_en = now()`,
    [id, m[1], buf.toString('hex')],
  );
}

// ───────────── enrutador ─────────────
async function route(req: Req, res: Res, seg: string[]) {
  const m = req.method ?? 'GET';
  const [a, b] = seg;
  const ok = (body: unknown, code = 200) => res.status(code).json(body);

  // --- público ---
  if (a === 'catalogo' && m === 'GET') { res.setHeader('Cache-Control', 'no-store'); return ok(await catalogo()); }
  if (a === 'bcv' && m === 'GET') return ok(await tasaBcv());
  if (a === 'imagen' && b && m === 'GET') {
    const r = (await q("SELECT tipo_mime, encode(datos,'base64') AS d FROM imagen WHERE componente_id = $1", [b]))[0];
    if (!r) return ok({ error: 'Sin imagen' }, 404);
    res.setHeader('Content-Type', r.tipo_mime);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // la URL lleva ?v=<fecha> y cambia al subir otra
    return res.status(200).send(Buffer.from(r.d, 'base64'));
  }
  if (a === 'eventos' && m === 'POST') {
    const tipo = req.body?.tipo;
    if (tipo !== 'share' && tipo !== 'banner') throw bad('Evento no válido.');
    await q('INSERT INTO evento (tipo) VALUES ($1)', [tipo]);
    return ok({ ok: true });
  }
  if (a === 'pedidos' && !b && m === 'POST') return ok(await crearPedido(req), 201);

  // --- cuentas ---
  if (a === 'registro' && m === 'POST') {
    const nombre = text(req.body?.nombre, 'El nombre', 2, 80);
    const correo = text(req.body?.correo, 'El correo', 5, 120).toLowerCase();
    const clave = typeof req.body?.clave === 'string' ? req.body.clave : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw bad('Escribe un correo válido.');
    if (clave.length < 6 || clave.length > 100) throw bad('La contraseña debe tener al menos 6 caracteres.');
    let u: User;
    try {
      u = (await q<User>("INSERT INTO usuario (nombre, correo, clave_hash) VALUES ($1,$2,$3) RETURNING id, nombre, correo, rol", [nombre, correo, await hashPassword(clave)]))[0];
    } catch (e: any) {
      if (e?.code === '23505') throw new HttpError(409, 'Ya existe una cuenta con ese correo.');
      throw e;
    }
    return ok({ token: await newSession(u.id), session: publicUser(u) }, 201);
  }
  if (a === 'ingreso' && m === 'POST') {
    const correo = text(req.body?.correo, 'El correo', 1, 120).toLowerCase();
    const clave = typeof req.body?.clave === 'string' ? req.body.clave : '';
    const row = (await q('SELECT id, nombre, correo, rol, clave_hash FROM usuario WHERE correo = $1', [correo]))[0];
    const valido = row ? await verifyPassword(clave, row.clave_hash) : (await scrypt(clave, 'x'.repeat(32), 64), false);
    if (!row || !valido) throw new HttpError(401, 'Correo o contraseña incorrectos.');
    await q('DELETE FROM sesion WHERE expira_en < now()');
    return ok({ token: await newSession(row.id), session: publicUser(row) });
  }
  if (a === 'salir' && m === 'POST') {
    const t = bearer(req);
    if (t) await q('DELETE FROM sesion WHERE token_hash = $1', [sha256(t)]);
    return ok({ ok: true });
  }
  if (a === 'yo' && m === 'GET') {
    const u = await getUser(req);
    return ok({ session: u ? publicUser(u) : null });
  }

  // --- builds guardados del usuario ---
  if (a === 'builds') {
    const u = await requireUser(req);
    if (!b && m === 'GET') {
      const rows = await q('SELECT id, nombre, piezas, creado_en FROM build_guardado WHERE usuario_id = $1 ORDER BY creado_en DESC LIMIT 12', [u.id]);
      return ok(rows.map((r: any) => ({ id: String(r.id), name: r.nombre, date: new Date(r.creado_en).toLocaleDateString('es-VE'), parts: r.piezas })));
    }
    if (!b && m === 'POST') {
      const nombre = text(req.body?.nombre, 'El nombre', 1, 60);
      const piezas = req.body?.piezas;
      if (!piezas || typeof piezas !== 'object' || Array.isArray(piezas)) throw bad('Piezas no válidas.');
      const limpio: Record<string, string> = {};
      for (const c of CATS) if (typeof piezas[c] === 'string') limpio[c] = piezas[c];
      const ids = Object.values(limpio);
      if (!ids.length) throw bad('El equipo está vacío.');
      const found = await q('SELECT 1 FROM componente WHERE id = ANY($1::text[])', [ids]);
      if (found.length !== ids.length) throw bad('Alguna pieza no existe.');
      await q('INSERT INTO build_guardado (usuario_id, nombre, piezas) VALUES ($1,$2,$3::jsonb)', [u.id, nombre, JSON.stringify(limpio)]);
      await q('DELETE FROM build_guardado WHERE usuario_id = $1 AND id NOT IN (SELECT id FROM build_guardado WHERE usuario_id = $1 ORDER BY creado_en DESC LIMIT 12)', [u.id]);
      return ok({ ok: true }, 201);
    }
    if (b && m === 'DELETE') {
      await q('DELETE FROM build_guardado WHERE id = $1 AND usuario_id = $2', [Number(b), u.id]);
      return ok({ ok: true });
    }
  }

  // --- administración ---
  if (a === 'admin') {
    await requireAdmin(req);
    if (b === 'pedidos' && m === 'GET') return ok(await listarPedidos());
    if (b === 'resumen' && m === 'GET') {
      const r = (await q(
        `SELECT (SELECT count(*) FROM usuario WHERE rol = 'cliente')::int AS usuarios,
                (SELECT count(*) FROM pedido)::int AS cotizaciones,
                (SELECT count(*) FROM build_guardado)::int AS guardados,
                (SELECT count(*) FROM evento WHERE tipo = 'share')::int AS compartidos,
                (SELECT count(*) FROM evento WHERE tipo = 'banner')::int AS banners`))[0];
      const top = await q("SELECT value AS id, count(*)::int AS count FROM build_guardado, jsonb_each_text(piezas) GROUP BY value ORDER BY count DESC, value LIMIT 5");
      return ok({ ...r, top });
    }
  }
  if (a === 'pedidos' && b && m === 'PATCH') { await requireAdmin(req); await cambiarEstado(Number(b), String(req.body?.estado)); return ok({ ok: true }); }
  if (a === 'pedidos' && b && m === 'DELETE') { await requireAdmin(req); await q('DELETE FROM pedido WHERE id = $1', [Number(b)]); return ok({ ok: true }); }
  if (a === 'componentes' && b && m === 'PATCH') {
    await requireAdmin(req);
    const { precio, existencias, activo } = req.body ?? {};
    if (precio !== undefined && !(Number.isFinite(Number(precio)) && Number(precio) >= 0 && Number(precio) < 1e6)) throw bad('Precio no válido.');
    if (existencias !== undefined && !(Number.isInteger(Number(existencias)) && Number(existencias) >= 0 && Number(existencias) < 1e6)) throw bad('Existencias no válidas.');
    const r = await q(
      `UPDATE componente SET precio = COALESCE($2::numeric, precio), existencias = COALESCE($3::int, existencias), activo = COALESCE($4::boolean, activo)
       WHERE id = $1 RETURNING id`,
      [b, precio === undefined ? null : Number(precio), existencias === undefined ? null : Number(existencias), typeof activo === 'boolean' ? activo : null],
    );
    if (!r.length) throw new HttpError(404, 'Pieza no encontrada.');
    return ok({ ok: true });
  }
  if (a === 'imagen' && b && m === 'PUT') { await requireAdmin(req); await guardarImagen(b, req.body?.dataUrl); return ok({ ok: true }); }
  if (a === 'imagen' && b && m === 'DELETE') { await requireAdmin(req); await q('DELETE FROM imagen WHERE componente_id = $1', [b]); return ok({ ok: true }); }

  return ok({ error: 'Ruta no encontrada' }, 404);
}

export default async function handler(req: Req, res: Res) {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let seg = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    // El cliente usa rutas de UN solo segmento (/api/builds?id=5, /api/admin-pedidos): son las más seguras en Vercel.
    if (seg[0]?.startsWith('admin-')) seg = ['admin', seg[0].slice(6)];
    else if (seg.length === 1 && url.searchParams.get('id')) seg = [seg[0], url.searchParams.get('id')!];
    await route(req, res, seg);
  } catch (e: any) {
    if (e instanceof HttpError) return res.status(e.code).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Error del servidor. Intenta de nuevo.' });
  }
}
