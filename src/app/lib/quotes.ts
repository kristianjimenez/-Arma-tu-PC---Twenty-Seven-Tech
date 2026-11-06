// Pedidos/cotizaciones para el panel de administración: se leen y actualizan en PostgreSQL (tablas pedido y pedido_item).
import { api } from './api';

export type QuoteStatus = 'pendiente' | 'atendida' | 'vendida' | 'cancelada';
export interface QuoteItem { id: string; label: string; name: string; price: number }
export interface Quote {
  id: number; code: string; createdAt: number; customer: string; email: string; phone: string; method: string;
  items: QuoteItem[]; subtotal: number; tax: number; total: number; status: QuoteStatus; stockApplied: boolean;
}

export const fetchQuotes = () => api<Quote[]>('admin/pedidos');
/** Al pasar a "vendida" el servidor descuenta 1 unidad de cada pieza (una sola vez). */
export const setQuoteStatus = (id: number, estado: QuoteStatus) => api(`pedidos/${id}`, { method: 'PATCH', body: { estado } });
export const deleteQuote = (id: number) => api(`pedidos/${id}`, { method: 'DELETE' });
