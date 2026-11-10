import { useState } from 'react';
import { X } from 'lucide-react';
import type { ComponentCategory, PCComponent } from '../types/pc-component';
import type { PartInput } from '../lib/catalog-admin';

const CATEGORY_LABEL: Record<ComponentCategory, string> = {
  cpu: 'Procesador', motherboard: 'Placa base', ram: 'Memoria RAM', gpu: 'Tarjeta gráfica',
  storage: 'Almacenamiento', power: 'Fuente de poder', case: 'Case',
};
const CATS = Object.keys(CATEGORY_LABEL) as ComponentCategory[];
const FORMS = ['ATX', 'mATX', 'ITX'];

const field = 'w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-red-500';
const label = 'mb-1 block text-xs font-medium uppercase tracking-wider text-gray-400';

interface Props {
  /** Pieza a editar; si no hay, el formulario crea una nueva. */
  part?: PCComponent;
  /** Valores ya usados (sockets, chipsets) para sugerirlos y evitar errores de escritura. */
  known: { sockets: string[]; chipsets: string[] };
  onClose: () => void;
  onSave: (input: PartInput) => Promise<void>;
}

export function PartFormDialog({ part, known, onClose, onSave }: Props) {
  const editing = !!part;
  const [f, setF] = useState<PartInput>(() => part
    ? { category: part.category, brand: part.brand, name: part.name, price: part.price, stock: part.stock, rating: part.rating, specs: part.specs, tag: part.tag,
        socket: part.socket, chipset: part.chipset, ramType: part.ramType, wattage: part.wattage, formFactor: part.formFactor,
        supportedForms: part.supportedForms, minWattage: part.minWattage, igpu: part.igpu }
    : { category: 'cpu', brand: '', name: '', price: 0, stock: 0, rating: 4, specs: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = <K extends keyof PartInput>(k: K, v: PartInput[K]) => setF((p) => ({ ...p, [k]: v }));
  const c = f.category;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try { await onSave(f); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar'); }
    finally { setBusy(false); }
  };

  const toggleForm = (v: string) => {
    const cur = f.supportedForms ?? [];
    set('supportedForms', cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
  };
  const numOrUndef = (v: string) => (v === '' ? undefined : Number(v));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={editing ? 'Editar pieza' : 'Nueva pieza'}>
      <form onSubmit={submit} className="my-8 w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-950 p-6 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase">{editing ? 'Editar pieza' : 'Nueva pieza'}</h2>
            <p className="mt-1 text-sm text-gray-400">Los datos de compatibilidad definen con qué piezas se puede combinar en el configurador.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="pf-cat">Categoría</label>
            <select id="pf-cat" value={c} disabled={editing} onChange={(e) => set('category', e.target.value as ComponentCategory)} className={field}>
              {CATS.map((k) => <option key={k} value={k}>{CATEGORY_LABEL[k]}</option>)}
            </select>
            {editing && <p className="mt-1 text-[11px] text-gray-500">La categoría no se cambia; si te equivocaste, crea una pieza nueva.</p>}
          </div>
          <div>
            <label className={label} htmlFor="pf-brand">Marca</label>
            <input id="pf-brand" required value={f.brand} onChange={(e) => set('brand', e.target.value)} className={field} placeholder="AMD, MSI, Kingston…" />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="pf-name">Nombre / modelo</label>
            <input id="pf-name" required minLength={2} value={f.name} onChange={(e) => set('name', e.target.value)} className={field} placeholder="Ryzen 5 5600X" />
          </div>
          <div>
            <label className={label} htmlFor="pf-price">Precio (USD)</label>
            <input id="pf-price" type="number" min={0} step="0.01" required value={f.price} onChange={(e) => set('price', Number(e.target.value))} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="pf-stock">Existencias</label>
            <input id="pf-stock" type="number" min={0} step={1} required value={f.stock} onChange={(e) => set('stock', Math.floor(Number(e.target.value)))} className={field} />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="pf-specs">Especificaciones</label>
            <input id="pf-specs" value={f.specs} onChange={(e) => set('specs', e.target.value)} className={field} placeholder="6 núcleos / 12 hilos • 4.6 GHz • Socket AM4" />
          </div>
          <div>
            <label className={label} htmlFor="pf-tag">Etiqueta (opcional)</label>
            <input id="pf-tag" value={f.tag ?? ''} onChange={(e) => set('tag', e.target.value || undefined)} className={field} placeholder="Mejor precio, Más vendido…" />
          </div>
          <div>
            <label className={label} htmlFor="pf-rating">Calificación (1–5)</label>
            <input id="pf-rating" type="number" min={1} max={5} step={1} value={f.rating} onChange={(e) => set('rating', Number(e.target.value))} className={field} />
          </div>
        </div>

        <fieldset className="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <legend className="px-2 text-xs font-bold uppercase tracking-widest text-red-400">Compatibilidad · {CATEGORY_LABEL[c]}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {(c === 'cpu' || c === 'motherboard') && (
              <div>
                <label className={label} htmlFor="pf-socket">Socket</label>
                <input id="pf-socket" required list="pf-sockets" value={f.socket ?? ''} onChange={(e) => set('socket', e.target.value)} className={field} placeholder="AM4, AM5, LGA1700…" />
                <datalist id="pf-sockets">{known.sockets.map((s) => <option key={s} value={s} />)}</datalist>
              </div>
            )}
            {c === 'cpu' && (
              <div>
                <label className={label} htmlFor="pf-igpu">Gráficos integrados (opcional)</label>
                <input id="pf-igpu" value={f.igpu ?? ''} onChange={(e) => set('igpu', e.target.value || undefined)} className={field} placeholder="Radeon 760M" />
                <p className="mt-1 text-[11px] text-gray-500">Si lo llenas, la tarjeta gráfica pasa a ser opcional con este procesador.</p>
              </div>
            )}
            {c === 'motherboard' && (
              <>
                <div>
                  <label className={label} htmlFor="pf-chipset">Chipset</label>
                  <input id="pf-chipset" list="pf-chipsets" value={f.chipset ?? ''} onChange={(e) => set('chipset', e.target.value || undefined)} className={field} placeholder="B650, B760…" />
                  <datalist id="pf-chipsets">{known.chipsets.map((s) => <option key={s} value={s} />)}</datalist>
                </div>
                <div>
                  <label className={label} htmlFor="pf-form">Formato de la placa</label>
                  <select id="pf-form" required value={f.formFactor ?? ''} onChange={(e) => set('formFactor', e.target.value)} className={field}>
                    <option value="" disabled>Elige…</option>
                    {FORMS.map((x) => <option key={x} value={x}>{x}</option>)}
                  </select>
                </div>
              </>
            )}
            {(c === 'motherboard' || c === 'ram') && (
              <div>
                <label className={label} htmlFor="pf-ram">Tipo de RAM</label>
                <select id="pf-ram" required value={f.ramType ?? ''} onChange={(e) => set('ramType', e.target.value)} className={field}>
                  <option value="" disabled>Elige…</option>
                  <option value="DDR4">DDR4</option><option value="DDR5">DDR5</option>
                </select>
              </div>
            )}
            {c === 'gpu' && (
              <div>
                <label className={label} htmlFor="pf-min">Fuente mínima recomendada (W)</label>
                <input id="pf-min" type="number" min={1} value={f.minWattage ?? ''} onChange={(e) => set('minWattage', numOrUndef(e.target.value))} className={field} placeholder="550" />
              </div>
            )}
            {c === 'power' && (
              <div>
                <label className={label} htmlFor="pf-watt">Potencia (W)</label>
                <input id="pf-watt" type="number" min={1} required value={f.wattage ?? ''} onChange={(e) => set('wattage', numOrUndef(e.target.value))} className={field} placeholder="650" />
              </div>
            )}
            {c === 'case' && (
              <div className="sm:col-span-2">
                <span className={label}>Formatos de placa que acepta</span>
                <div className="flex flex-wrap gap-3">
                  {FORMS.map((x) => (
                    <label key={x} className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm">
                      <input type="checkbox" checked={(f.supportedForms ?? []).includes(x)} onChange={() => toggleForm(x)} /> {x}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {c === 'storage' && <p className="text-sm text-gray-400 sm:col-span-2">El almacenamiento no tiene restricciones de compatibilidad: solo se registran precio, existencias y especificaciones.</p>}
          </div>
        </fieldset>

        {error && <p role="alert" className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:text-white">Cancelar</button>
          <button type="submit" disabled={busy} className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 disabled:opacity-60">
            {busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Agregar pieza'}
          </button>
        </div>
      </form>
    </div>
  );
}
