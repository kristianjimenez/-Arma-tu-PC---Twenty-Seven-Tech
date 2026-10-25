import { FolderOpen, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { SavedBuildEntry } from '../lib/builds';
import { pcComponents } from '../data/pc-components';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  builds: SavedBuildEntry[];
  onLoad: (b: SavedBuildEntry) => void;
  onDelete: (id: string) => void;
}

export function MyBuildsSheet({ open, onOpenChange, builds, onLoad, onDelete }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full border-white/20 bg-black sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-4xl text-white">Mis builds guardados</SheetTitle>
        </SheetHeader>
        <div className="space-y-3 overflow-y-auto px-4 pb-6">
          {builds.length === 0 && (
            <p className=" border border-dashed border-white/10 p-6 text-center text-sm text-gray-500">
              Aún no has guardado ninguno. Arma tu PC y pulsa “Guardar build”.
            </p>
          )}
          {builds.map((b) => {
            const total = Object.values(b.parts).reduce((t, id) => t + (pcComponents.find((c) => c.id === id)?.price ?? 0), 0);
            return (
              <div key={b.id} className=" border border-white/10 bg-black/40 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-cond text-xl text-white">{b.name}</p>
                    <p className="text-xs text-gray-500">{b.date} • {Object.keys(b.parts).length}/7 componentes</p>
                  </div>
                  <p className="font-display text-3xl text-[var(--t27-red)]">${total}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => onLoad(b)} className="inline-flex flex-1 items-center justify-center gap-2  bg-[var(--t27-red)] py-2 text-sm text-white hover:bg-red-500">
                    <FolderOpen className="h-4 w-4" /> Abrir
                  </button>
                  <button onClick={() => onDelete(b.id)} aria-label="Eliminar build" className=" border border-white/10 px-3 text-gray-400 hover:border-red-500/60 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
