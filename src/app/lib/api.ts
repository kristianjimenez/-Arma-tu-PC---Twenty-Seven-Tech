// Cliente de la API (/api/*): todo se guarda en PostgreSQL a través de funciones serverless.
// El token de sesión se guarda en el navegador solo para enviarlo en cada petición; el servidor guarda su hash.
const TOKEN_KEY = 't27.token';

export const getToken = (): string | null => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = (t: string) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* sin almacenamiento */ } };
export const clearToken = () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* sin almacenamiento */ } };

export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }

export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  let res: Response;
  try {
    res = await fetch(`/api/${path}`, { method: opts.method ?? 'GET', headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined });
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.');
  }
  let data: any = null;
  try { data = await res.json(); } catch { /* respuesta vacía */ }
  if (!res.ok) throw new ApiError(res.status, data?.error ?? `Respuesta inesperada del servidor (código ${res.status}).`);
  return data as T;
}
