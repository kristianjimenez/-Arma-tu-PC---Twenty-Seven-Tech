import { ArrowRight, Cpu, Gauge, MessageCircle, ShieldCheck, SlidersHorizontal, Zap } from 'lucide-react';
import logo from '../../imports/twenty_seven_tech_logo.png';
import { STORE } from '../data/store-info';
import { PRESETS, type Preset } from '../data/presets';
import { pcComponents } from '../data/pc-components';
import { SocialLinks } from './SocialLinks';

interface WelcomePageProps {
  onStart: (preset?: Preset) => void;
  onLogin: () => void;
  onRegister: () => void;
}

const priceOf = (p: Preset) =>
  Object.values(p.parts).reduce((sum, id) => sum + (pcComponents.find((c) => c.id === id)?.price ?? 0), 0);

const steps = [
  { icon: SlidersHorizontal, title: 'Elige', text: 'Un equipo listo o arma el tuyo pieza por pieza.' },
  { icon: ShieldCheck, title: 'Valida', text: 'Solo ves piezas compatibles: socket, memoria, fuente y case.' },
  { icon: MessageCircle, title: 'Cotiza', text: 'Total con IVA y envío directo por WhatsApp.' },
];

export function WelcomePage({ onStart, onLogin, onRegister }: WelcomePageProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(220,38,38,0.32),transparent_55%),radial-gradient(ellipse_at_90%_60%,rgba(127,29,29,0.35),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:repeating-linear-gradient(135deg,#fff_0_2px,transparent_2px_14px)]" />

      <header className="relative z-10 mx-auto flex h-20 max-w-[1200px] items-center justify-between px-5 lg:px-8">
        <img src={logo} alt={STORE.name} className="h-10 w-auto drop-shadow-[0_0_24px_rgba(220,38,38,0.45)]" />
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={onLogin} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 transition hover:border-red-500/60 hover:text-white">Iniciar sesión</button>
          <button onClick={onRegister} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500">Registrarse</button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1200px] px-5 pb-16 lg:px-8">
        <section className="pb-14 pt-10 lg:pt-20">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-red-500">Módulo de presupuesto asistido</p>
          <h1 className="font-display mt-4 max-w-3xl text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            Arma tu PC <span className="text-red-500">a tu medida</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-300">
            Elige cada componente, verifica la compatibilidad en tiempo real y recibe tu cotización lista para enviar a la tienda.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button onClick={() => onStart()} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-base font-medium text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500">
              Comenzar a armar <ArrowRight className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-500">Sin cuenta. Si quieres guardar tus builds, regístrate después.</span>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-red-600 font-display text-lg font-bold">{i + 1}</span>
                <Icon className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="font-display mt-4 text-xl font-bold uppercase">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-400">{text}</p>
            </div>
          ))}
        </section>

        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-red-500">Equipos listos</p>
              <h2 className="font-display mt-1 text-3xl font-bold uppercase">Empieza desde uno armado</h2>
            </div>
            <button onClick={() => onStart()} className="hidden text-sm text-gray-400 transition hover:text-white sm:inline">Armar desde cero →</button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRESETS.map((p) => (
              <button key={p.id} onClick={() => onStart(p)} className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-red-500/60 hover:bg-white/[0.06]">
                <div className="flex items-center justify-between">
                  <Cpu className="h-5 w-5 text-red-400" />
                  {p.badge && <span className="rounded-full bg-red-600/20 px-2 py-0.5 text-[11px] font-medium text-red-300">{p.badge}</span>}
                </div>
                <h3 className="font-display mt-4 text-lg font-bold uppercase leading-tight">{p.name}</h3>
                <p className="mt-1 flex-1 text-sm text-gray-400">{p.tagline}</p>
                <p className="mt-4 text-sm text-gray-300">Desde <b className="font-display text-xl text-red-400">${priceOf(p)}</b></p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500 transition group-hover:text-red-300">Cargar y personalizar <ArrowRight className="h-3 w-3" /></span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:grid-cols-[1fr_auto] md:items-center">
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-red-500" /> Compatibilidad verificada automáticamente</li>
            <li className="flex items-center gap-3"><Gauge className="h-5 w-5 text-red-500" /> Te mostramos qué juegos y tareas soporta tu equipo</li>
            <li className="flex items-center gap-3"><Zap className="h-5 w-5 text-red-500" /> Presupuesto en tiempo real con IVA incluido</li>
          </ul>
          <div>
            <p className="font-display mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">Visítanos</p>
            <SocialLinks variant="full" />
          </div>
        </section>
      </main>
    </div>
  );
}
