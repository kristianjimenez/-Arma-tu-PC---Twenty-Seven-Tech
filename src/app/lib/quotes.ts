// Cotizaciones ("pendientes") generadas al pulsar "Cotizar por WhatsApp".
// DEMO: se guardan en localStorage de este navegador. En producción irían a una base de datos.
export type QuoteStatus = 'pendiente' | 'atendida' | 'vendida' | 'cancelada';
export interface QuoteItem { id: string; label: string; name: string; price: number }
export interface Quote {
  id: string; createdAt: number; customer: string; email: string; phone?: string; code?: string; method?: string;
  items: QuoteItem[]; subtotal: number; total: number; status: QuoteStatus; stockApplied?: boolean;
}

const KEY = 't27.quotes';

export function readQuotes(): Quote[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') as Quote[]; } catch { return []; }
}
const write = (q: Quote[]) => { try { localStorage.setItem(KEY, JSON.stringify(q)); } catch { /* sin espacio */ } };

export function addQuote(q: Omit<Quote, 'id' | 'createdAt' | 'status'>): Quote {
  const quote: Quote = { ...q, id: `C-${Date.now().toString(36).toUpperCase()}`, createdAt: Date.now(), status: 'pendiente' };
  write([quote, ...readQuotes()]);
  return quote;
}
export function setQuoteStatus(id: string, status: QuoteStatus, stockApplied?: boolean) {
  write(readQuotes().map((q) => (q.id === id ? { ...q, status, ...(stockApplied !== undefined ? { stockApplied } : {}) } : q)));
}
export function deleteQuote(id: string) { write(readQuotes().filter((q) => q.id !== id)); }
