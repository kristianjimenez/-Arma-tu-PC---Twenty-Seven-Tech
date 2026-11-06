// Actividad de la tienda. Las cotizaciones y los builds guardados ya quedan registrados en PostgreSQL
// (tablas pedido y build_guardado); aquí solo se envían los eventos "compartir" y "banner".
import { api } from './api';

export type StatEvent = 'quote' | 'save' | 'share' | 'banner';

export function track(event: StatEvent) {
  if (event !== 'share' && event !== 'banner') return;
  api('eventos', { method: 'POST', body: { tipo: event } }).catch(() => { /* no es crítico */ });
}
