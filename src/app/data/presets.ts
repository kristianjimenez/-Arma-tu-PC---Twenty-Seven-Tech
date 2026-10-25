import { ComponentCategory } from '../types/pc-component';

export interface Preset {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
  parts: { [key in ComponentCategory]: string }; // ids del catálogo
}

// Todos verificados como compatibles entre sí (ver README).
export const PRESETS: Preset[] = [
  {
    id: 'economico', name: 'Gamer Económico', tagline: 'Juega esports y títulos ligeros en 1080p',
    parts: { cpu: 'cpu-1', motherboard: 'mb-1', ram: 'ram-1', gpu: 'gpu-1', storage: 'st-1', power: 'psu-1', case: 'case-1' },
  },
  {
    id: '1080p', name: 'Gamer 1080p', tagline: 'El equilibrio perfecto precio / rendimiento', badge: 'Más pedido',
    parts: { cpu: 'cpu-5', motherboard: 'mb-6', ram: 'ram-3', gpu: 'gpu-3', storage: 'st-2', power: 'psu-2', case: 'case-2' },
  },
  {
    id: '1440p', name: 'Gamer 1440p', tagline: 'Alto framerate y mucho detalle',
    parts: { cpu: 'cpu-3', motherboard: 'mb-3', ram: 'ram-4', gpu: 'gpu-4', storage: 'st-2', power: 'psu-2', case: 'case-3' },
  },
  {
    id: 'ultra', name: 'Ultra 4K', tagline: 'Lo máximo: gaming 4K y creación de contenido',
    parts: { cpu: 'cpu-4', motherboard: 'mb-4', ram: 'ram-5', gpu: 'gpu-6', storage: 'st-4', power: 'psu-3', case: 'case-4' },
  },
];
