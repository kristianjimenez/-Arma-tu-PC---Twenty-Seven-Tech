import { PCComponent } from '../types/pc-component';

/**
 * Catálogo alineado con lo que vende Twenty Seven Tech (Ryzen 5 5600X / 8600G /
 * 8700F / 9800X3D, Core i5-12400F / 14400, RTX 3060 / 5060 / 5070 / 5070 Ti,
 * RX 6600 / 9070 XT, plataformas AM4, AM5 y LGA1700).
 *
 * ⚠️ Los PRECIOS son REFERENCIALES: confirmarlos con la tienda antes de la
 * defensa o cargarlos desde su lista de precios real.
 *
 * Imágenes: se busca /img/components/<id>.webp (carpeta public/). Si no existe,
 * la tarjeta muestra una ilustración de respaldo, así nada se ve roto.
 */
export const pcComponents: PCComponent[] = [
  // ───────── CPU ─────────
  { id: 'cpu-1', brand: 'AMD', name: 'Ryzen 5 5600X', category: 'cpu', price: 135, specs: '6 núcleos / 12 hilos • 4.6 GHz • Socket AM4', stock: 14, rating: 4, socket: 'AM4', tag: 'Mejor precio' },
  { id: 'cpu-2', brand: 'AMD', name: 'Ryzen 5 8600G', category: 'cpu', price: 215, specs: '6 núcleos / 12 hilos • 5.0 GHz • Gráficos Radeon 760M • AM5', stock: 10, rating: 4, socket: 'AM5', tag: 'Con video integrado' },
  { id: 'cpu-3', brand: 'AMD', name: 'Ryzen 7 8700F', category: 'cpu', price: 245, specs: '8 núcleos / 16 hilos • 5.0 GHz • Socket AM5', stock: 8, rating: 5, socket: 'AM5' },
  { id: 'cpu-4', brand: 'AMD', name: 'Ryzen 7 9800X3D', category: 'cpu', price: 520, specs: '8 núcleos / 16 hilos • 5.2 GHz • 3D V-Cache • AM5', stock: 4, rating: 5, socket: 'AM5', tag: 'El mejor para gaming' },
  { id: 'cpu-5', brand: 'Intel', name: 'Core i5-12400F', category: 'cpu', price: 125, specs: '6 núcleos / 12 hilos • 4.4 GHz • LGA1700 (sin video)', stock: 18, rating: 4, socket: 'LGA1700', tag: 'Más vendido' },
  { id: 'cpu-6', brand: 'Intel', name: 'Core i5-14400', category: 'cpu', price: 205, specs: '10 núcleos / 16 hilos • 4.7 GHz • LGA1700', stock: 9, rating: 5, socket: 'LGA1700' },

  // ───────── Placa base ─────────
  { id: 'mb-1', brand: 'ASRock', name: 'B450M Pro4', category: 'motherboard', price: 80, specs: 'AM4 • DDR4 • M.2 NVMe • mATX', stock: 12, rating: 4, socket: 'AM4', chipset: 'B450', ramType: 'DDR4', formFactor: 'mATX' },
  { id: 'mb-2', brand: 'MSI', name: 'A620M-B EVO', category: 'motherboard', price: 95, specs: 'AM5 • DDR5 • M.2 NVMe • mATX', stock: 15, rating: 4, socket: 'AM5', chipset: 'A620', ramType: 'DDR5', formFactor: 'mATX', tag: 'Mejor precio AM5' },
  { id: 'mb-3', brand: 'Gigabyte', name: 'B650M Gaming', category: 'motherboard', price: 135, specs: 'AM5 • DDR5 • PCIe 4.0 • mATX', stock: 9, rating: 4, socket: 'AM5', chipset: 'B650', ramType: 'DDR5', formFactor: 'mATX' },
  { id: 'mb-4', brand: 'MSI', name: 'MAG B850 Tomahawk WiFi', category: 'motherboard', price: 235, specs: 'AM5 • DDR5 • PCIe 5.0 • WiFi • ATX', stock: 5, rating: 5, socket: 'AM5', chipset: 'B850', ramType: 'DDR5', formFactor: 'ATX' },
  { id: 'mb-5', brand: 'ASRock', name: 'H610M-HVS', category: 'motherboard', price: 70, specs: 'LGA1700 • DDR4 • M.2 NVMe • mATX', stock: 14, rating: 4, socket: 'LGA1700', chipset: 'H610', ramType: 'DDR4', formFactor: 'mATX' },
  { id: 'mb-6', brand: 'ASRock', name: 'B760M Pro RS', category: 'motherboard', price: 125, specs: 'LGA1700 • DDR5 • PCIe 4.0 • mATX', stock: 11, rating: 4, socket: 'LGA1700', chipset: 'B760', ramType: 'DDR5', formFactor: 'mATX' },
  { id: 'mb-7', brand: 'ASUS', name: 'PRIME B760-Plus', category: 'motherboard', price: 175, specs: 'LGA1700 • DDR5 • PCIe 5.0 • ATX', stock: 6, rating: 5, socket: 'LGA1700', chipset: 'B760', ramType: 'DDR5', formFactor: 'ATX' },

  // ───────── RAM ─────────
  { id: 'ram-1', brand: 'Kingston', name: 'Fury Beast 16GB DDR4', category: 'ram', price: 35, specs: '16GB (2x8GB) • 3200MHz • CL16', stock: 30, rating: 4, ramType: 'DDR4' },
  { id: 'ram-2', brand: 'Corsair', name: 'Vengeance LPX 32GB DDR4', category: 'ram', price: 70, specs: '32GB (2x16GB) • 3200MHz • CL16', stock: 18, rating: 5, ramType: 'DDR4' },
  { id: 'ram-3', brand: 'Kingston', name: 'Fury Beast 16GB DDR5', category: 'ram', price: 55, specs: '16GB (2x8GB) • 5600MHz • CL40', stock: 25, rating: 4, ramType: 'DDR5', tag: 'Más vendido' },
  { id: 'ram-4', brand: 'Corsair', name: 'Vengeance 32GB DDR5', category: 'ram', price: 105, specs: '32GB (2x16GB) • 6000MHz • CL36', stock: 16, rating: 5, ramType: 'DDR5' },
  { id: 'ram-5', brand: 'G.Skill', name: 'Trident Z5 RGB 32GB DDR5', category: 'ram', price: 125, specs: '32GB (2x16GB) • 6000MHz • CL30 • RGB', stock: 8, rating: 5, ramType: 'DDR5' },

  // ───────── GPU ─────────
  { id: 'gpu-1', brand: 'AMD', name: 'Radeon RX 6600 8GB', category: 'gpu', price: 195, specs: '8GB GDDR6 • 1080p Ultra • Eficiente', stock: 10, rating: 4, minWattage: 500, tag: 'Mejor precio' },
  { id: 'gpu-2', brand: 'NVIDIA', name: 'GeForce RTX 3060 12GB', category: 'gpu', price: 285, specs: '12GB GDDR6 • DLSS • 1080p / 1440p', stock: 9, rating: 4, minWattage: 550 },
  { id: 'gpu-3', brand: 'NVIDIA', name: 'GeForce RTX 5060 8GB', category: 'gpu', price: 340, specs: '8GB GDDR7 • DLSS 4 • 1080p / 1440p', stock: 12, rating: 5, minWattage: 550, tag: 'Más vendido' },
  { id: 'gpu-4', brand: 'NVIDIA', name: 'GeForce RTX 5070 12GB', category: 'gpu', price: 610, specs: '12GB GDDR7 • DLSS 4 • 1440p Ultra', stock: 6, rating: 5, minWattage: 650 },
  { id: 'gpu-5', brand: 'AMD', name: 'Radeon RX 9070 XT 16GB', category: 'gpu', price: 720, specs: '16GB GDDR6 • FSR 4 • 1440p / 4K', stock: 4, rating: 5, minWattage: 750 },
  { id: 'gpu-6', brand: 'NVIDIA', name: 'GeForce RTX 5070 Ti 16GB', category: 'gpu', price: 880, specs: '16GB GDDR7 • DLSS 4 • 4K gaming', stock: 3, rating: 5, minWattage: 750 },

  // ───────── Almacenamiento ─────────
  { id: 'st-1', brand: 'Kingston', name: 'NV3 500GB NVMe M.2', category: 'storage', price: 35, specs: '500GB • NVMe PCIe 4.0 • hasta 5000 MB/s', stock: 30, rating: 4 },
  { id: 'st-2', brand: 'Kingston', name: 'NV3 1TB NVMe M.2', category: 'storage', price: 60, specs: '1TB • NVMe PCIe 4.0 • hasta 6000 MB/s', stock: 28, rating: 4, tag: 'Más vendido' },
  { id: 'st-3', brand: 'Addlink', name: 'S70 Lite 1TB NVMe M.2', category: 'storage', price: 65, specs: '1TB • NVMe PCIe 3.0 • hasta 3400 MB/s', stock: 15, rating: 4 },
  { id: 'st-4', brand: 'WD', name: 'Black SN850X 2TB', category: 'storage', price: 150, specs: '2TB • NVMe PCIe 4.0 • hasta 7300 MB/s', stock: 7, rating: 5 },

  // ───────── Fuente de poder ─────────
  { id: 'psu-1', brand: 'ASRock', name: 'Pro 550W 80+ Bronze', category: 'power', price: 45, specs: '550W • 80+ Bronze', stock: 20, rating: 4, wattage: 550 },
  { id: 'psu-2', brand: 'ASRock', name: 'Pro 650W 80+ Bronze', category: 'power', price: 55, specs: '650W • 80+ Bronze', stock: 22, rating: 4, wattage: 650, tag: 'Más vendido' },
  { id: 'psu-3', brand: 'MSI', name: 'MAG A750GL 750W Gold', category: 'power', price: 100, specs: '750W • 80+ Gold • Modular', stock: 10, rating: 5, wattage: 750 },
  { id: 'psu-4', brand: 'Corsair', name: 'RM850x 850W Gold', category: 'power', price: 140, specs: '850W • 80+ Gold • Full modular', stock: 6, rating: 5, wattage: 850 },

  // ───────── Case ─────────
  { id: 'case-1', brand: 'Generic', name: 'Gabinete Gamer mATX', category: 'case', price: 40, specs: 'Mini torre • Panel lateral • 1 ventilador', stock: 20, rating: 3, supportedForms: ['mATX'] },
  { id: 'case-2', brand: 'Gamdias', name: 'Gabinete Cristal + 4 Fans RGB', category: 'case', price: 75, specs: 'Media torre • Vidrio templado • 4 fans RGB', stock: 14, rating: 4, supportedForms: ['mATX', 'ATX'], tag: 'Más vendido' },
  { id: 'case-3', brand: 'Redragon', name: 'Gabinete Panorámico Dual Cámara', category: 'case', price: 95, specs: 'Media torre • Vista panorámica • Buen flujo de aire', stock: 8, rating: 5, supportedForms: ['mATX', 'ATX'] },
  { id: 'case-4', brand: 'Corsair', name: '4000D Airflow', category: 'case', price: 110, specs: 'Media torre • Malla frontal • Hasta ATX', stock: 7, rating: 5, supportedForms: ['mATX', 'ATX'] },
];

export function getCategoryComponents(category: string): PCComponent[] {
  return pcComponents.filter((component) => component.category === category);
}
