import { MessageCircle, Store, Hammer } from 'lucide-react';
import { PRESETS, Preset } from '../data/presets';
import { pcComponents } from '../data/pc-components';
import { STORE } from '../data/store-info';

const part = (id: string) => pcComponents.find((c) => c.id === id)!;
const priceOf = (p: Preset) => Object.values(p.parts).reduce((t, id) => t + part(id).price, 0);

const SPEC_ROWS: [keyof Preset['parts'], string][] = [
  ['cpu', 'Procesador'], ['motherboard', 'Tarjeta madre'], ['ram', 'Memoria'], ['gpu', 'Gráfica'], ['storage', 'Almacenamiento'], ['power', 'Fuente'],
];

/** Portada: el flyer del equipo más pedido, como lo publican en Instagram. */
export function Hero({ onStart, onLoadFeatured }: { onStart: () => void; onLoadFeatured: () => void }) {
  const p = PRESETS[1];
  return (
    <section id="inicio" className="relative overflow-hidden border-b border-white/15">
      <div className="mx-auto grid max-w-[1300px] items-center gap-10 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
        <div>
          <h1 className="font-display text-[clamp(3rem,8vw,6.2rem)]">
            Arma tu PC con piezas que sí son compatibles
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-300">
            Elige procesador, placa, memoria y más. La página te avisa si algo no encaja, y al final envías tu pedido por WhatsApp a nuestra tienda de Caracas.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={onStart} className="cut bg-[var(--t27-red)] px-7 py-3.5 font-semibold text-white transition hover:bg-red-500">Empezar a armar mi PC</button>
            <a href="#equipos" className="border border-white/30 px-7 py-3.5 font-medium transition hover:bg-white hover:text-black">Ver equipos listos</a>
          </div>
          <p className="mt-6 text-sm text-gray-500">{STORE.warranty}. Retiro y pago en tienda o por WhatsApp.</p>
        </div>

        {/* Flyer */}
        <button onClick={onLoadFeatured} className="group relative mx-auto w-full max-w-md text-left" aria-label={`Cargar el equipo ${p.name} en el configurador`}>
          <div className="stripes absolute -left-3 -top-3 hidden w-24 sm:block" aria-hidden />
          <div className="cut relative border border-[var(--t27-red)]/60 bg-[#120000] p-6 transition group-hover:border-[var(--t27-red)]">
            <p className="font-display text-5xl text-white">{p.name}</p>
            <p className="mt-1 text-sm text-gray-400">{p.tagline}</p>
            <dl className="mt-5 space-y-3 border-l-2 border-[var(--t27-red)] pl-4 text-sm">
              {SPEC_ROWS.map(([k, label]) => (
                <div key={k}><dt className="text-xs text-gray-500">{label}</dt><dd className="text-gray-100">{part(p.parts[k]).name}</dd></div>
              ))}
            </dl>
            <div className="mt-6 flex items-end justify-between">
              <span className="font-display price-tag text-5xl">{priceOf(p)}$</span>
              <span className="text-sm text-gray-400 group-hover:text-white">Cargarlo y personalizarlo</span>
            </div>
          </div>
        </button>
      </div>
    </section>
  );
}

/** Equipos listos: sección blanca para separar del configurador oscuro. */
export function ReadyBuilds({ onLoad, onDemo, disabled }: { onLoad: (p: Preset) => void; onDemo: () => void; disabled?: boolean }) {
  return (
    <section id="equipos" className="bg-[var(--t27-paper)] text-black">
      <div className="mx-auto max-w-[1300px] px-4 py-14 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-5xl sm:text-6xl">Equipos listos para llevar</h2>
            <p className="mt-3 max-w-xl text-gray-700">Combinaciones que ya revisamos entre sí. Elige una y cámbiale lo que quieras en el configurador.</p>
          </div>
          <button onClick={onDemo} disabled={disabled} className="text-sm text-gray-700 underline underline-offset-4 hover:text-black disabled:opacity-50">Ver cómo se arma, paso a paso</button>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {PRESETS.map((p) => (
            <article key={p.id} className="flex flex-col border border-black/80 bg-white">
              <div className="bg-black p-4 text-white">
                <h3 className="font-display text-3xl">{p.name}</h3>
                {p.badge && <p className="mt-1 text-xs font-semibold text-[var(--t27-red)]">{p.badge}</p>}
              </div>
              <dl className="flex-1 divide-y divide-black/10 px-4 text-sm">
                {SPEC_ROWS.slice(0, 4).map(([k, label]) => (
                  <div key={k} className="py-2"><dt className="text-xs text-gray-500">{label}</dt><dd className="font-medium">{part(p.parts[k]).name}</dd></div>
                ))}
              </dl>
              <div className="flex items-center justify-between gap-3 border-t border-black/80 p-4">
                <span className="font-display text-4xl text-[var(--t27-red)]">{priceOf(p)}$</span>
                <button onClick={() => onLoad(p)} disabled={disabled} className="bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--t27-red)] disabled:opacity-50">Elegir este</button>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-500">Precios sin IVA. Se calculan con el catálogo de la tienda.</p>
      </div>
    </section>
  );
}

export function HowToBuy() {
  const steps = [
    { icon: Hammer, title: 'Arma tu PC', text: 'Elige las 7 piezas. Las que no encajan aparecen bloqueadas con el motivo.' },
    { icon: MessageCircle, title: 'Envía tu pedido', text: 'Un clic abre WhatsApp con tu equipo, tu nombre y el total ya escritos.' },
    { icon: Store, title: 'Paga y retira', text: 'Pagas por WhatsApp o directamente en el local. Armamos y probamos tu equipo.' },
  ];
  return (
    <section id="como-comprar" className="border-b border-white/15">
      <div className="mx-auto max-w-[1300px] px-4 py-16 lg:px-8">
        <h2 className="font-display text-5xl sm:text-6xl">Cómo comprar</h2>
        <ol className="mt-10 grid gap-px bg-white/15 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="bg-black p-6">
              <div className="flex items-center gap-3">
                <span className="font-display text-5xl text-[var(--t27-red)]">{i + 1}</span>
                <Icon className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="font-cond mt-3 text-2xl">{title}</h3>
              <p className="mt-2 max-w-xs leading-relaxed text-gray-400">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function StoreSection() {
  return (
    <section id="tienda" className="bg-[var(--t27-red)] text-white">
      <div className="mx-auto grid max-w-[1300px] gap-8 px-4 py-14 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="font-display text-5xl sm:text-6xl">Somos tienda física</h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-white/90">Ven a ver las piezas, pregunta lo que necesites y llévate tu equipo armado con {STORE.warranty.toLowerCase()}.</p>
        </div>
        <div className="bg-black p-6">
          <p className="font-cond text-2xl">{STORE.name}</p>
          <p className="mt-2 leading-relaxed text-gray-300">{STORE.address}</p>
          <p className="mt-1 text-sm text-gray-500">Frente a las mesas de la feria. Horarios: consúltalos por WhatsApp.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={STORE.mapsUrl} target="_blank" rel="noopener noreferrer" className="bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-gray-200">Cómo llegar</a>
            <a href={STORE.whatsappUrl} target="_blank" rel="noopener noreferrer" className="border border-white/40 px-5 py-2.5 text-sm hover:bg-white hover:text-black">Escribir por WhatsApp</a>
          </div>
        </div>
      </div>
    </section>
  );
}
