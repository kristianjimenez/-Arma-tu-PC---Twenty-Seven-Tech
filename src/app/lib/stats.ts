// Contadores simples de actividad para el dashboard (demo, en el navegador).
const KEY = 't27.stats';

export type StatEvent = 'quote' | 'save' | 'share' | 'banner';
export type Stats = Record<StatEvent, number>;

const empty: Stats = { quote: 0, save: 0, share: 0, banner: 0 };

export function readStats(): Stats {
  try { return { ...empty, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...empty }; }
}

export function track(event: StatEvent) {
  try {
    const s = readStats();
    s[event] += 1;
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch { /* sin espacio */ }
}
