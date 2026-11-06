// Cuentas de usuario: el registro, el inicio de sesión y el rol se validan en el SERVIDOR (PostgreSQL).
// El navegador solo guarda el token de sesión y una copia del nombre para pintar la pantalla al instante.
import { api, clearToken, getToken, setToken } from './api';

const SESSION_KEY = 't27.session';

export interface Session { name: string; email: string; role?: 'admin' }

// El administrador entra con el usuario "admin" (existe en la tabla usuario con rol 'admin').
export const ADMIN_EMAIL = 'admin';

const cache = (s: Session | null) => {
  try { if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s)); else localStorage.removeItem(SESSION_KEY); } catch { /* sin almacenamiento */ }
};

/** Copia local de la sesión (solo para dibujar la interfaz); la verdad la tiene el servidor. */
export function getSession(): Session | null {
  if (!getToken()) return null;
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}

/** Pregunta al servidor si la sesión sigue vigente (y qué rol tiene realmente). */
export async function verifySession(): Promise<Session | null> {
  if (!getToken()) { cache(null); return null; }
  try {
    const { session } = await api<{ session: Session | null }>('yo');
    if (!session) clearToken();
    cache(session);
    return session;
  } catch {
    return getSession(); // sin conexión: se conserva la copia local
  }
}

export function clearSession() {
  api('salir', { method: 'POST' }).catch(() => { /* ya no importa */ });
  clearToken();
  cache(null);
}

export async function registerUser(name: string, email: string, password: string): Promise<Session> {
  const r = await api<{ token: string; session: Session }>('registro', { method: 'POST', body: { nombre: name, correo: email, clave: password } });
  setToken(r.token); cache(r.session);
  return r.session;
}

export async function loginUser(email: string, password: string): Promise<Session> {
  const r = await api<{ token: string; session: Session }>('ingreso', { method: 'POST', body: { correo: email, clave: password } });
  setToken(r.token); cache(r.session);
  return r.session;
}

export function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return { score, label: ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte'][score] };
}
