// Datos reales de la empresa (tomados de su perfil de Instagram).
// Si algún enlace cambia, se modifica SOLO aquí.
export const STORE = {
  name: 'Twenty Seven Tech',
  tagline: 'Computadoras · Laptops · Gaming · Diseño',
  rif: 'J-506103656',
  whatsappNumber: '584142869332',
  whatsappDisplay: '+58 414-2869332',
  instagramUser: 'twentyseventech',
  instagramUrl: 'https://www.instagram.com/twentyseventech/',
  whatsappUrl: 'https://wa.me/584142869332',
  address: 'Caracas, C.C. Parque Carabobo (CPC), Planta Baja, Sector Feria, Local LM11',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Centro Parque Carabobo CPC Caracas'),
  warranty: 'Garantía de 6 meses en equipos armados',
} as const;

export type PayMethod = 'whatsapp' | 'local';
export const PAY_METHODS: { id: PayMethod; title: string; text: string }[] = [
  { id: 'whatsapp', title: 'Pagar por WhatsApp', text: 'Te enviamos los datos de pago y coordinamos el retiro por mensaje.' },
  { id: 'local', title: 'Pagar en el local', text: 'Pasas por la tienda con tu código de pedido y pagas allá.' },
];

// Tasa de IVA usada en TODA la app (antes había 16% en el cálculo y 21% en las etiquetas).
export const TAX_RATE = 0.16;

export function whatsappLink(message: string) {
  return `${STORE.whatsappUrl}?text=${encodeURIComponent(message)}`;
}
