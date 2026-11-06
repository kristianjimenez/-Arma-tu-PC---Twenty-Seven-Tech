// Pedidos: el servidor (PostgreSQL) valida las piezas, calcula los precios y genera el código.
import { api } from './api';

export interface OrderItem { id?: string; label: string; name: string; price: number }
export interface Order {
  code: string; date: string; customer: string; phone: string;
  method: 'whatsapp' | 'local'; note: string; items: OrderItem[];
  subtotal: number; tax: number; total: number;
}

export interface OrderInput { cliente: string; telefono: string; metodo: 'whatsapp' | 'local'; nota: string; correo?: string; piezas: string[] }
export interface OrderResult { codigo: string; subtotal: number; iva: number; total: number; tasa: number | null }

/** Registra el pedido en la base de datos. Lanza un error con el motivo si algo no es válido (agotado, incompatible...). */
export const submitOrder = (input: OrderInput) => api<OrderResult>('pedidos', { method: 'POST', body: input });

export function orderMessage(o: Order, storeName: string): string {
  const lines = o.items.map((i) => `• ${i.label}: ${i.name} — $${i.price}`).join('\n');
  const how = o.method === 'whatsapp' ? 'Quiero pagar por WhatsApp' : 'Voy a pagar en el local';
  return `Hola ${storeName}, quiero hacer este pedido armado desde la web.\n\nPedido: ${o.code}\nNombre: ${o.customer}\nTeléfono: ${o.phone}\n\n${lines}\n\nSubtotal: $${o.subtotal.toFixed(2)}\nIVA: $${o.tax.toFixed(2)}\nTotal: $${o.total.toFixed(2)}\n\n${how}.${o.note ? `\nNota: ${o.note}` : ''}`;
}
