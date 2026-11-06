// Builds guardados por usuario: se guardan en PostgreSQL (tabla build_guardado).
// Solo el "borrador" (lo que vas armando) queda en el navegador para no perderlo al recargar.
import { ComponentCategory } from '../types/pc-component';
import { api } from './api';

export type PartIds = { [key in ComponentCategory]?: string };
export interface SavedBuildEntry { id: string; name: string; date: string; parts: PartIds }

export const listBuilds = (): Promise<SavedBuildEntry[]> => api<SavedBuildEntry[]>('builds');
export const saveBuildEntry = (name: string, parts: PartIds) => api('builds', { method: 'POST', body: { nombre: name, piezas: parts } });
export const deleteBuildEntry = (id: string) => api(`builds?id=${encodeURIComponent(id)}`, { method: 'DELETE' });

const draftKey = (email: string) => `t27.builds.draft.${email}`;
export function loadDraft(email: string): PartIds {
  try { return JSON.parse(localStorage.getItem(draftKey(email)) || '{}'); } catch { return {}; }
}
export function saveDraft(email: string, parts: PartIds) {
  try { localStorage.setItem(draftKey(email), JSON.stringify(parts)); } catch { /* sin espacio */ }
}
