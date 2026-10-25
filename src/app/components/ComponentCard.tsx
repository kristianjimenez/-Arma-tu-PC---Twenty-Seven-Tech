import { PCComponent } from '../types/pc-component';
import { Check, Ban } from 'lucide-react';
import { ComponentImage } from './ComponentImage';

interface ComponentCardProps {
  component: PCComponent;
  isSelected: boolean;
  /** Motivo de incompatibilidad con lo ya elegido (null = compatible) */
  conflict?: string | null;
  onAdd: (component: PCComponent) => void;
}

export function ComponentCard({ component, isSelected, conflict, onAdd }: ComponentCardProps) {
  const { name, brand, price, specs, stock, tag } = component;
  const soldOut = stock === 0;
  const blocked = soldOut || !!conflict;

  return (
    <article className={`flex flex-col border bg-black ${isSelected ? 'border-[var(--t27-red)]' : 'border-white/15'} ${conflict ? 'opacity-60' : ''}`}>
      <div className={`h-1 ${isSelected ? 'bg-[var(--t27-red)]' : 'bg-transparent'}`} />
      <div className="relative h-40 border-b border-white/10 bg-[#0d0d0d]">
        <ComponentImage id={component.id} name={name} brand={brand} category={component.category} />
        {tag && !isSelected && <span className="absolute left-0 top-3 bg-white px-2.5 py-0.5 text-xs font-semibold text-[var(--t27-red)]">{tag}</span>}
        {stock > 0 && stock < 6 && <span className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 text-xs text-gray-200">Quedan {stock}</span>}
        {soldOut && <div className="absolute inset-0 flex items-center justify-center bg-black/80 font-semibold">Agotado</div>}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <p className="text-xs text-gray-500">{brand}</p>
          <h3 className="font-cond text-xl leading-tight">{name}</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-400">{specs}</p>
        </div>

        {conflict && (
          <p className="flex items-start gap-1.5 border-l-2 border-[var(--t27-red)] bg-[var(--t27-red)]/10 px-2 py-1.5 text-xs leading-snug text-red-200">
            <Ban className="mt-px h-3.5 w-3.5 shrink-0" /> {conflict}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <span className="font-display price-tag text-3xl">{price}$</span>
          <button
            onClick={() => onAdd(component)}
            disabled={blocked}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition ${
              blocked ? 'cursor-not-allowed bg-white/10 text-gray-500'
                : isSelected ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-[var(--t27-red)] text-white hover:bg-red-500'
            }`}
          >
            {isSelected && <Check className="h-4 w-4" />}
            {soldOut ? 'Agotado' : conflict ? 'No compatible' : isSelected ? 'Elegido' : 'Elegir'}
          </button>
        </div>
      </div>
    </article>
  );
}
