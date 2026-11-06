import { useEffect, useState } from 'react';
import { getImage } from '../lib/images';
import { Cpu, MonitorPlay, CircuitBoard, MemoryStick, HardDrive, Zap, Box } from 'lucide-react';
import { ComponentCategory } from '../types/pc-component';

const ICONS = { cpu: Cpu, gpu: MonitorPlay, motherboard: CircuitBoard, ram: MemoryStick, storage: HardDrive, power: Zap, case: Box };

interface Props { id: string; name: string; brand: string; category: ComponentCategory }

const BASE = import.meta.env.BASE_URL;
/** Orden de búsqueda: foto real (.webp) → ilustración (.svg) → icono. Nunca se ve una imagen rota. */
const SOURCES = ['webp', 'svg'] as const;

export function ComponentImage({ id, name, brand, category }: Props) {
  const [stage, setStage] = useState(0);
  const [custom, setCustom] = useState<string | undefined>(() => getImage(id)); // foto subida desde el panel admin
  useEffect(() => {
    const sync = () => setCustom(getImage(id));
    window.addEventListener('t27-images', sync);
    return () => window.removeEventListener('t27-images', sync);
  }, [id]);
  const Icon = ICONS[category];

  if (custom) {
    return <img src={custom} alt={name} loading="lazy" decoding="async" width={400} height={300} className="h-full w-full object-contain p-2" />;
  }
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
