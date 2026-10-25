import { ComponentCategory, PCComponent } from '../types/pc-component';
import { CheckCircle2, AlertTriangle, X, FileDown, Share2, MessageCircle } from 'lucide-react';
import { TAX_RATE } from '../data/store-info';
import { analyzeBuildPerformance } from '../utils/build-performance';

interface BuildSummaryProps {
  components: { [key in ComponentCategory]?: PCComponent };
  totalPrice: number;
  compatibilityIssues: string[];
  onRemove: (category: ComponentCategory) => void;
  onSave: () => void;     // descargar presupuesto (PNG/PDF)
  onShare: () => void;
  onCheckout: () => void; // finalizar pedido
  completionPercentage: number;
}

const ORDER: { id: ComponentCategory; label: string }[] = [
  { id: 'cpu', label: 'Procesador' }, { id: 'motherboard', label: 'Placa base' }, { id: 'ram', label: 'Memoria RAM' },
  { id: 'gpu', label: 'Tarjeta gráfica' }, { id: 'storage', label: 'Almacenamiento' }, { id: 'power', label: 'Fuente' }, { id: 'case', label: 'Case' },
];

export function BuildSummary({ components, totalPrice, compatibilityIssues, onRemove, onSave, onShare, onCheckout, completionPercentage }: BuildSummaryProps) {
  const chosen = Object.keys(components).length;
  const isComplete = completionPercentage === 100;
  const isCompatible = compatibilityIssues.length === 0;
  const tax = totalPrice * TAX_RATE;
  const total = totalPrice + tax;
  const perf = components.gpu ? analyzeBuildPerformance(components) : null;
  const canOrder = isComplete && isCompatible;

  return (
    <div className="flex h-full flex-col overflow-y-auto border border-white/15 bg-black">
      <div className="border-b border-white/15 p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-3xl">Tu equipo</h2>
          <span className="text-sm text-gray-400">{chosen} de 7 piezas</span>
        </div>
        <div className="mt-3 h-1 bg-white/10"><div className="h-1 bg-[var(--t27-red)] transition-all" style={{ width: `${completionPercentage}%` }} /></div>
      </div>

      <ul className="divide-y divide-white/10">
        {ORDER.map(({ id, label }) => {
          const c = components[id];
          return (
            <li key={id} className="flex items-start justify-between gap-2 px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{label}</p>
                {c ? <p className="text-sm leading-snug">{c.name}</p> : <p className="text-sm text-gray-600">Sin elegir</p>}
              </div>
              {c && (
                <div className="flex shrink-0 items-center gap-2">
                  <span className="tabular-nums text-sm">${c.price}</span>
                  <button onClick={() => onRemove(id)} aria-label={`Quitar ${c.name}`} className="text-gray-500 hover:text-[var(--t27-red)]"><X className="h-4 w-4" /></button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {chosen > 0 && (
        <div className={`mx-4 mt-3 flex gap-2 border-l-2 px-3 py-2 text-sm ${isCompatible ? 'border-green-500 bg-green-500/10' : 'border-[var(--t27-red)] bg-[var(--t27-red)]/10'}`}>
          {isCompatible ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />}
          <div>
            <p className={isCompatible ? 'text-green-300' : 'text-red-300'}>{isCompatible ? 'Todo es compatible' : 'Hay piezas que no encajan'}</p>
            {!isCompatible && <ul className="mt-1 space-y-1 text-xs text-gray-300">{compatibilityIssues.map((i) => <li key={i}>{i}</li>)}</ul>}
          </div>
        </div>
      )}

      {perf && (
        <div className="mx-4 mt-3 border border-white/15 p-3">
          <p className="font-cond text-lg">{perf.tierLabel}</p>
          <ul className="mt-1 space-y-0.5 text-xs text-gray-400">
            {perf.games.slice(0, 3).map((g) => <li key={g.name} className="flex justify-between gap-2"><span className="text-gray-200">{g.name}</span><span>{g.settings}</span></li>)}
          </ul>
        </div>
      )}

      <div className="mt-auto space-y-1.5 p-4 text-sm">
        <div className="flex justify-between text-gray-400"><span>Subtotal</span><span className="tabular-nums">${totalPrice.toFixed(2)}</span></div>
        <div className="flex justify-between text-gray-400"><span>IVA ({Math.round(TAX_RATE * 100)}%)</span><span className="tabular-nums">${tax.toFixed(2)}</span></div>
        <div className="flex items-baseline justify-between border-t border-white/15 pt-2">
          <span>Total</span><span className="font-display text-4xl text-[var(--t27-red)]">${total.toFixed(2)}</span>
        </div>

        <button onClick={onCheckout} disabled={!canOrder} className="cut mt-3 flex w-full items-center justify-center gap-2 bg-[var(--t27-red)] py-3 font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-gray-500">
          <MessageCircle className="h-4 w-4" /> Finalizar pedido
        </button>
        {!canOrder && <p className="text-center text-xs text-gray-500">{!isComplete ? `Faltan ${7 - chosen} piezas para finalizar.` : 'Corrige la compatibilidad para finalizar.'}</p>}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button onClick={onSave} disabled={!isComplete} className="flex items-center justify-center gap-1.5 border border-white/25 py-2 text-xs hover:bg-white hover:text-black disabled:opacity-40"><FileDown className="h-3.5 w-3.5" /> Presupuesto</button>
          <button onClick={onShare} disabled={!isComplete} className="flex items-center justify-center gap-1.5 border border-white/25 py-2 text-xs hover:bg-white hover:text-black disabled:opacity-40"><Share2 className="h-3.5 w-3.5" /> Compartir</button>
        </div>
      </div>
    </div>
  );
}
