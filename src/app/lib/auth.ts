// Autenticación DEMO del lado del cliente (localStorage).
// Sirve para mostrar el flujo completo de login/registro en la defensa.
// En producción esto se reemplaza por un backend (Node/Express + BD) con
// hash de contraseña en servidor y tokens (JWT/sesión).

const USERS_KEY = 't27.users';
const SESSION_KEY = 't27.session';

export interface Session { name: string; email: string; role?: 'admin' }
interface StoredUser { name: string; email: string; passwordHash: string }

// Cuenta de administración de la tienda (DEMO). La clave se guarda como hash SHA-256.
// En producción el rol se valida en el servidor, nunca en el navegador.
export const ADMIN_EMAIL = 'admin';
const ADMIN_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';

async function hash(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function readUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
}

export function getSession(): Session | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}

export function clearSession() { localStorage.removeItem(SESSION_KEY); }

export async function registerUser(name: string, email: string, password: string): Promise<Session> {
  const users = readUsers();
  const mail = email.trim().toLowerCase();
  if (mail === ADMIN_EMAIL || users.some((u) => u.email === mail)) throw new Error('Ya existe una cuenta con ese correo.');
  const user: StoredUser = { name: name.trim(), email: mail, passwordHash: await hash(password) };
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  const session = { name: user.name, email: user.email };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function loginUser(email: string, password: string): Promise<Session> {
  const mail = email.trim().toLowerCase();
  if (mail === ADMIN_EMAIL) {
    if ((await hash(password)) !== ADMIN_HASH) throw new Error('Correo o contraseña incorrectos.');
    const admin: Session = { name: 'Administración', email: ADMIN_EMAIL, role: 'admin' };
    localStorage.setItem(SESSION_KEY, JSON.stringify(admin));
    return admin;
  }
  const user = readUsers().find((u) => u.email === mail);
  if (!user || user.passwordHash !== (await hash(password))) {
    throw new Error('Correo o contraseña incorrectos.');
  }
  const session = { name: user.name, email: user.email };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return { score, label: ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte'][score] };
}

export function countUsers(): number { return readUsers().length; }
