import { ComponentCategory, PCComponent } from '../types/pc-component';

export type PerformanceTier = 'ultra' | 'high' | 'mid-high' | 'mid';

export interface GameCapability {
  name: string;
  settings: string;
}

export interface BuildPerformance {
  tier: PerformanceTier;
  tierLabel: string;
  games: GameCapability[];
  tasks: string[];
}

function getGpuTier(gpu: PCComponent): PerformanceTier {
  // Umbrales según el catálogo real de la tienda (RTX 5070 Ti / 9070 XT / 5070 / 5060...)
  if (gpu.price >= 800) return 'ultra';
  if (gpu.price >= 600) return 'high';
  if (gpu.price >= 280) return 'mid-high';
  return 'mid';
}

const TIER_LABELS: Record<PerformanceTier, string> = {
  ultra: 'ULTRA GAMING 4K',
  high: 'HIGH PERFORMANCE',
  'mid-high': 'MID-HIGH GAMING',
  mid: 'GAMING ESTÁNDAR',
};

const GAMES: Record<PerformanceTier, GameCapability[]> = {
  ultra: [
    { name: 'Cyberpunk 2077', settings: '4K Ultra + Ray Tracing' },
    { name: 'Alan Wake 2', settings: '4K Ultra Ray Tracing' },
    { name: 'Microsoft Flight Simulator', settings: '4K Ultra' },
    { name: 'The Witcher 3', settings: '4K Ultra + RT' },
    { name: 'Hogwarts Legacy', settings: '4K Ultra' },
  ],
  high: [
    { name: 'Cyberpunk 2077', settings: '1440p Ultra + Ray Tracing' },
    { name: 'Forza Horizon 5', settings: '4K Ultra' },
    { name: 'Baldur\'s Gate 3', settings: '4K Ultra' },
    { name: 'Call of Duty: MW3', settings: '4K Ultra' },
    { name: 'Starfield', settings: '1440p Ultra' },
  ],
  'mid-high': [
    { name: 'Cyberpunk 2077', settings: '1440p High' },
    { name: 'Apex Legends', settings: '1440p Ultra' },
    { name: 'God of War', settings: '1440p High' },
    { name: 'GTA V', settings: '1440p Ultra' },
    { name: 'Valorant', settings: '4K Ultra' },
  ],
  mid: [
    { name: 'Valorant', settings: '1080p Ultra' },
    { name: 'CS2', settings: '1080p Ultra' },
    { name: 'Fortnite', settings: '1080p Alto' },
    { name: 'GTA V', settings: '1080p Alto' },
    { name: 'Minecraft', settings: '1080p Ultra' },
  ],
};

const TASKS: Record<PerformanceTier, string[]> = {
  ultra: [
    'Edición de video 8K en tiempo real',
    'Render 3D y VFX profesional',
    'Streaming 4K a múltiples plataformas',
    'Machine Learning & IA local',
    'Diseño gráfico y animación 3D',
  ],
  high: [
    'Edición de video 4K sin interrupciones',
    'Render 3D semi-profesional',
    'Streaming 1080p/1440p de alta calidad',
    'Diseño gráfico profesional',
    'Desarrollo de software avanzado',
  ],
  'mid-high': [
    'Edición de video 4K fluida',
    'Streaming 1080p estable',
    'Programación y multitarea intensiva',
    'Diseño gráfico y edición de fotos',
    'Home office de alto rendimiento',
  ],
  mid: [
    'Edición de video 1080p',
    'Streaming 1080p básico',
    'Oficina y productividad avanzada',
    'Diseño gráfico básico',
    'Programación y desarrollo web',
  ],
};

export function analyzeBuildPerformance(
  components: Partial<Record<ComponentCategory, PCComponent>>
): BuildPerformance {
  const gpu = components.gpu;
  const tier: PerformanceTier = gpu ? getGpuTier(gpu) : 'mid';

  return {
    tier,
    tierLabel: TIER_LABELS[tier],
    games: GAMES[tier],
    tasks: TASKS[tier],
  };
}
