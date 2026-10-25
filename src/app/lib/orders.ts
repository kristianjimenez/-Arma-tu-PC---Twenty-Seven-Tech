// Pedidos de demo (localStorage). En producción: API + base de datos de la tienda.
export interface OrderItem { label: string; name: string; price: number }
export interface Order {
  code: string; date: string; customer: string; phone: string;
  method: 'whatsapp' | 'local'; note: string; items: OrderItem[];
  subtotal: number; tax: number; total: number;
}

export function newOrderCode(): string {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `T27-${ymd}-${rnd}`;
}

export function saveOrder(order: Order) {
  try {
    const all = JSON.parse(localStorage.getItem('t27.orders') || '[]');
    localStorage.setItem('t27.orders', JSON.stringify([order, ...all].slice(0, 50)));
  } catch { /* sin espacio */ }
}

export function orderMessage(o: Order, storeName: string): string {
  const lines = o.items.map((i) => `• ${i.label}: ${i.name} — $${i.price}`).join('\n');
  const how = o.method === 'whatsapp' ? 'Quiero pagar por WhatsApp' : 'Voy a pagar en el local';
  return `Hola ${storeName}, quiero hacer este pedido armado desde la web.\n\nPedido: ${o.code}\nNombre: ${o.customer}\nTeléfono: ${o.phone}\n\n${lines}\n\nSubtotal: $${o.subtotal.toFixed(2)}\nIVA: $${o.tax.toFixed(2)}\nTotal: $${o.total.toFixed(2)}\n\n${how}.${o.note ? `\nNota: ${o.note}` : ''}`;
}
