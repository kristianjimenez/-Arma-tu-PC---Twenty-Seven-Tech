import { useState } from 'react';
import { Check, MapPin, MessageCircle, Store, FileDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { PCBuild, ComponentCategory } from '../types/pc-component';
import { PAY_METHODS, PayMethod, STORE, TAX_RATE, whatsappLink } from '../data/store-info';
import { Order, newOrderCode, orderMessage, saveOrder } from '../lib/orders';

const LABELS: Record<ComponentCategory, string> = {
  cpu: 'Procesador', motherboard: 'Placa base', ram: 'Memoria RAM', gpu: 'Tarjeta gráfica',
  storage: 'Almacenamiento', power: 'Fuente de poder', case: 'Case',
};
const ORDER: ComponentCategory[] = ['cpu', 'motherboard', 'ram', 'gpu', 'storage', 'power', 'case'];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  build: PCBuild;
  defaultName?: string;
  onDownloadBudget: () => void;
}

const input = 'w-full border border-white/20 bg-black px-3 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[var(--t27-red)]';

export function CheckoutDialog({ open, onOpenChange, build, defaultName = '', onDownloadBudget }: Props) {
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<PayMethod>('whatsapp');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [order, setOrder] = useState<Order | null>(null);

  const subtotal = build.totalPrice;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) setTimeout(() => { setOrder(null); setError(''); }, 250);
  };

  const confirm = () => {
    if (name.trim().length < 2) return setError('Escribe tu nombre.');
    if (phone.replace(/\D/g, '').length < 10) return setError('Escribe un teléfono válido, con código de área.');
    const o: Order = {
      code: newOrderCode(), date: new Date().toLocaleString('es-VE'),
      customer: name.trim(), phone: phone.trim(), method, note: note.trim(),
      items: ORDER.filter((c) => build.components[c]).map((c) => ({ label: LABELS[c], name: build.components[c]!.name, price: build.components[c]!.price })),
      subtotal, tax, total,
    };
    saveOrder(o);
    setOrder(o);
    window.open(whatsappLink(orderMessage(o, STORE.name)), '_blank', 'noopener');
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[92vh] overflow-y-auto !rounded-none border-white/20 bg-black p-0 text-white sm:max-w-xl [&>button]:text-white">
        {!order ? (
          <div>
            <DialogHeader className="border-b border-white/15 p-6 text-left">
              <DialogTitle className="font-display text-4xl text-white">Finalizar pedido</DialogTitle>
              <DialogDescription className="text-gray-400">
                Te llevamos a WhatsApp con tu equipo ya escrito. Solo tienes que enviarlo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 p-6">
              <ul className="divide-y divide-white/10 border border-white/15 text-sm">
                {ORDER.filter((c) => build.components[c]).map((c) => (
                  <li key={c} className="flex items-baseline justify-between gap-3 px-3 py-2">
                    <span><span className="text-gray-500">{LABELS[c]}</span> <span className="ml-2">{build.components[c]!.name}</span></span>
                    <span className="shrink-0 tabular-nums">${build.components[c]!.price}</span>
                  </li>
                ))}
                <li className="flex justify-between px-3 py-2 text-gray-400"><span>IVA ({Math.round(TAX_RATE * 100)}%)</span><span className="tabular-nums">${tax.toFixed(2)}</span></li>
                <li className="flex items-baseline justify-between bg-white px-3 py-3 text-black">
                  <span className="font-semibold">Total</span>
                  <span className="font-display text-3xl text-[var(--t27-red)]">${total.toFixed(2)}</span>
                </li>
              </ul>

              <fieldset>
                <legend className="mb-2 text-sm font-medium">¿Cómo quieres pagar?</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PAY_METHODS.map((m) => (
                    <label key={m.id} className={`cursor-pointer border p-3 text-sm transition ${method === m.id ? 'border-[var(--t27-red)] bg-[var(--t27-red)]/10' : 'border-white/20 hover:border-white/50'}`}>
                      <input type="radio" name="pay" className="sr-only" checked={method === m.id} onChange={() => setMethod(m.id)} />
                      <span className="flex items-center gap-2 font-medium">
                        {m.id === 'whatsapp' ? <MessageCircle className="h-4 w-4" /> : <Store className="h-4 w-4" />} {m.title}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-gray-400">{m.text}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm"><span className="mb-1 block">Tu nombre</span>
                  <input className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
                <label className="block text-sm"><span className="mb-1 block">Tu teléfono</span>
                  <input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="0414 000 0000" /></label>
              </div>
              <label className="block text-sm"><span className="mb-1 block">Nota para la tienda (opcional)</span>
                <input className={input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej: lo busco el sábado" /></label>

              {error && <p role="alert" className="border border-[var(--t27-red)] bg-[var(--t27-red)]/10 px-3 py-2 text-sm text-red-300">{error}</p>}

              <button onClick={confirm} className="cut flex w-full items-center justify-center gap-2 bg-[var(--t27-red)] py-3.5 text-base font-semibold text-white transition hover:bg-red-500">
                <MessageCircle className="h-5 w-5" /> Enviar pedido por WhatsApp
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center bg-[var(--t27-red)]"><Check className="h-6 w-6" /></span>
              <div>
                <DialogTitle className="font-display text-4xl text-white">Pedido listo</DialogTitle>
                <DialogDescription className="text-gray-400">Código {order.code}</DialogDescription>
              </div>
            </div>

            <p className="mt-5 border-l-4 border-[var(--t27-red)] pl-3 text-sm leading-relaxed text-gray-200">
              Se abrió WhatsApp con tu pedido. <b>La tienda lo recibe cuando tú envías ese mensaje.</b> Si no se abrió, usa el botón de abajo.
            </p>

            <div className="mt-5 border border-white/15 p-4 text-sm leading-relaxed">
              {order.method === 'whatsapp' ? (
                <p>Te responderemos por WhatsApp con los datos de pago. Cuando confirmes el pago, coordinamos el retiro.</p>
              ) : (
                <>
                  <p>Pasa por la tienda y dile al equipo tu código <b>{order.code}</b>. Pagas en el local.</p>
                  <p className="mt-3 flex gap-2 text-gray-300"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--t27-red)]" /> {STORE.address}</p>
                  <a href={STORE.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[var(--t27-red)] underline underline-offset-4">Ver en el mapa</a>
                </>
              )}
              <p className="mt-3 text-xs text-gray-500">El stock y el precio final se confirman con la tienda.</p>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <a href={whatsappLink(orderMessage(order, STORE.name))} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-[var(--t27-red)] py-3 text-sm font-semibold text-white hover:bg-red-500">
                <MessageCircle className="h-4 w-4" /> Abrir WhatsApp otra vez
              </a>
              <button onClick={onDownloadBudget} className="flex items-center justify-center gap-2 border border-white/30 py-3 text-sm hover:bg-white hover:text-black">
                <FileDown className="h-4 w-4" /> Descargar presupuesto
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
