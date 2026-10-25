import { useState } from 'react';
import { Cpu, MonitorPlay, CircuitBoard, MemoryStick, HardDrive, Zap, Box } from 'lucide-react';
import { ComponentCategory } from '../types/pc-component';

const ICONS = { cpu: Cpu, gpu: MonitorPlay, motherboard: CircuitBoard, ram: MemoryStick, storage: HardDrive, power: Zap, case: Box };

interface Props { id: string; name: string; brand: string; category: ComponentCategory }

const BASE = import.meta.env.BASE_URL;
/** Orden de búsqueda: foto real (.webp) → ilustración (.svg) → icono. Nunca se ve una imagen rota. */
const SOURCES = ['webp', 'svg'] as const;

export function ComponentImage({ id, name, brand, category }: Props) {
  const [stage, setStage] = useState(0);
  const Icon = ICONS[category];

  if (stage < SOURCES.length) {
    return (
      <img key={stage} src={`${BASE}img/components/${id}.${SOURCES[stage]}`} alt={name} loading="lazy" decoding="async" width={400} height={300}
        onError={() => setStage((s) => s + 1)} className="h-full w-full object-contain p-2" />
    );
  }
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-600">
      <Icon className="h-12 w-12" strokeWidth={1.2} />
      <span className="font-cond text-lg tracking-wide text-gray-500">{brand}</span>
    </div>
  );
}
