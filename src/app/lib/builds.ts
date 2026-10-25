// Guarda builds por usuario en el navegador (demo). Se guardan solo los ids.
import { ComponentCategory } from '../types/pc-component';

export type PartIds = { [key in ComponentCategory]?: string };
export interface SavedBuildEntry { id: string; name: string; date: string; parts: PartIds }

const key = (email: string, kind: 'list' | 'draft') => `t27.builds.${kind}.${email}`;

export function listBuilds(email: string): SavedBuildEntry[] {
  try { return JSON.parse(localStorage.getItem(key(email, 'list')) || '[]'); } catch { return []; }
}
export function saveBuildEntry(email: string, name: string, parts: PartIds): SavedBuildEntry[] {
  const entry = { id: String(Date.now()), name, date: new Date().toLocaleDateString('es-VE'), parts };
  const next = [entry, ...listBuilds(email)].slice(0, 12);
  localStorage.setItem(key(email, 'list'), JSON.stringify(next));
  return next;
}
export function deleteBuildEntry(email: string, id: string): SavedBuildEntry[] {
  const next = listBuilds(email).filter((b) => b.id !== id);
  localStorage.setItem(key(email, 'list'), JSON.stringify(next));
  return next;
}
export function loadDraft(email: string): PartIds {
  try { return JSON.parse(localStorage.getItem(key(email, 'draft')) || '{}'); } catch { return {}; }
}
export function saveDraft(email: string, parts: PartIds) {
  try { localStorage.setItem(key(email, 'draft'), JSON.stringify(parts)); } catch { /* sin espacio */ }
}
