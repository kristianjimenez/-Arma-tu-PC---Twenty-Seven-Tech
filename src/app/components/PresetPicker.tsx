import { Sparkles, Play } from 'lucide-react';
import { PRESETS, Preset } from '../data/presets';
import { pcComponents } from '../data/pc-components';

const priceOf = (p: Preset) =>
  Object.values(p.parts).reduce((t, id) => t + (pcComponents.find((c) => c.id === id)?.price ?? 0), 0);

interface Props { onLoad: (p: Preset) => void; onDemo: () => void; disabled?: boolean }

export function PresetPicker({ onLoad, onDemo, disabled }: Props) {
  return (
    <section aria-label="Builds listos" className="mb-8 rounded-2xl border border-white/10 bg-gradient-to-br from-red-950/40 via-zinc-950 to-zinc-950 p-4 lg:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display flex items-center gap-2 text-2xl font-bold uppercase">
            <Sparkles className="h-5 w-5 text-red-500" /> ¿No sabes por dónde empezar?
          </h2>
          <p className="text-sm text-gray-400">Carga un equipo recomendado por la tienda y personalízalo a tu gusto.</p>
        </div>
        <button onClick={onDemo} disabled={disabled} className="inline-flex items-center gap-2 rounded-lg border border-red-500/50 px-4 py-2 text-sm text-red-300 transition hover:bg-red-600/15 disabled:opacity-50">
          <Play className="h-4 w-4" /> Ver demo guiada
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {PRESETS.map((p) => (
          <button key={p.id} onClick={() => onLoad(p)} disabled={disabled}
            className="group relative rounded-xl border border-white/10 bg-black/40 p-4 text-left transition hover:-translate-y-0.5 hover:border-red-500/60 disabled:opacity-50">
            {p.badge && <span className="font-display absolute right-3 top-3 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">{p.badge}</span>}
            <p className="font-display text-xl font-bold uppercase">{p.name}</p>
            <p className="mt-1 min-h-[2.5rem] text-xs leading-relaxed text-gray-400">{p.tagline}</p>
            <p className="font-display mt-3 text-2xl font-bold text-red-400">${priceOf(p)}<span className="ml-1 text-xs font-normal text-gray-500">+ IVA</span></p>
            <p className="mt-1 text-xs text-gray-500 group-hover:text-gray-300">Clic para cargar →</p>
          </button>
        ))}
      </div>
    </section>
  );
}
