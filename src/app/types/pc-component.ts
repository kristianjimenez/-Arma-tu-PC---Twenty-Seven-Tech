export type ComponentCategory = 'cpu' | 'gpu' | 'motherboard' | 'ram' | 'storage' | 'power' | 'case';

export interface PCComponent {
  id: string;
  name: string;
  brand: string;
  category: ComponentCategory;
  price: number; // USD, referencial (confirmar con la tienda)
  specs: string;
  stock: number;
  rating: number;
  /** Etiqueta opcional: "Más vendido", "Mejor precio"... */
  tag?: string;
  // Compatibilidad
  socket?: string;            // CPU y placa
  chipset?: string;           // placa
  ramType?: string;           // RAM y placa (DDR4 / DDR5)
  wattage?: number;           // fuente
  formFactor?: string;        // placa: ATX | mATX
  supportedForms?: string[];  // case: formatos de placa que acepta
  minWattage?: number;        // GPU: fuente mínima recomendada
}

export interface PCBuild {
  components: {
    [key in ComponentCategory]?: PCComponent;
  };
  totalPrice: number;
  compatibilityIssues: string[];
}

export interface SavedBuild {
  id: string;
  email: string;
  build: PCBuild;
  date: string;
}
