import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  BarChart3, Boxes, LogOut, Package, PackageX, RotateCcw, Search, Store, Users, MessageCircle, FolderOpen, AlertTriangle, DollarSign, ClipboardList, ImagePlus, Download, Trash2, Check,
} from 'lucide-react';
import logo from '../../imports/twenty_seven_tech_logo.png';
import { pcComponents } from '../data/pc-components';
import { applyOverrides, baseStock, basePrice, isActive, readOverrides, resetOverrides, setOverride } from '../lib/catalog-admin';
import { countUsers } from '../lib/auth';
import { readStats } from '../lib/stats';
import { STORE } from '../data/store-info';
import { deleteQuote, readQuotes, setQuoteStatus, type QuoteStatus } from '../lib/quotes';
import { exportImagesZip, fileToWebp, readImages, removeImage, setImage } from '../lib/images';
import type { ComponentCategory } from '../types/pc-component';

const CATEGORY_LABEL: Record<ComponentCategory, string> = {
  cpu: 'Procesadores', motherboard: 'Placas base', ram: 'Memoria RAM', gpu: 'Tarjetas gráficas',
  storage: 'Almacenamiento', power: 'Fuentes de poder', case: 'Cases',
};
const CATEGORY_ORDER = Object.keys(CATEGORY_LABEL) as ComponentCategory[];
const LOW_STOCK = 5;

interface AdminPanelProps {
  name: string;
  onLogout: () => void;
  onViewStore: () => void;
}

/** Lee todos los builds guardados por los clientes de este navegador (demo). */
function savedBuildsCount(): { total: number; topParts: { id: string; count: number }[] } {
  let total = 0;
  const counts = new Map<string, number>();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith('t27.builds.list.')) continue;
      const list = JSON.parse(localStorage.getItem(k) || '[]') as { parts: Record<string, string> }[];
      total += list.length;
      list.forEach((b) => Object.values(b.parts).forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1)));
    }
  } catch { /* datos ilegibles */ }
  const topParts = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, count]) => ({ id, count }));
  return { total, topParts };
}

const money = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

function Kpi({ icon: Icon, label, value, hint, tone = 'default' }: { icon: any; label: string; value: string | number; hint?: string; tone?: 'default' | 'warn' }) {
  return (
    <div className={`rounded-2xl border p-5 ${tone === 'warn' ? 'border-red-500/40 bg-red-500/10' : 'border-white/10 bg-white/5'}`}>
      <div className="flex items-center gap-2 text-sm text-gray-400"><Icon className="h-4 w-4 text-red-400" /> {label}</div>
      <p className="font-display mt-2 text-4xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function AdminPanel({ name, onLogout, onViewStore }: AdminPanelProps) {
  const [tab, setTab] = useState<'dashboard' | 'pending' | 'inventory'>('dashboard');
  // Cada cambio incrementa "version" para volver a leer el catálogo y los contadores.
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ComponentCategory | 'all'>('all');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive' | 'out' | 'low'>('all');

  const data = useMemo(() => {
    const active = pcComponents.filter((c) => isActive(c.id));
    const inactive = pcComponents.length - active.length;
    const inventoryValue = active.reduce((t, c) => t + c.price * c.stock, 0);
    const low = active.filter((c) => c.stock <= LOW_STOCK);
    const byCategory = CATEGORY_ORDER.map((cat) => {
      const all = pcComponents.filter((c) => c.category === cat);
      return { cat, total: all.length, active: all.filter((c) => isActive(c.id)).length };
    });
    const out = pcComponents.filter((c) => c.stock === 0).length;
    return { out, active, inactive, inventoryValue, low, byCategory, builds: savedBuildsCount(), users: countUsers(), stats: readStats() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pcComponents.filter((c) => {
      if (category !== 'all' && c.category !== category) return false;
      if (status === 'active' && !isActive(c.id)) return false;
      if (status === 'inactive' && isActive(c.id)) return false;
      if (status === 'out' && c.stock !== 0) return false;
      if (status === 'low' && !(c.stock > 0 && c.stock <= LOW_STOCK)) return false;
      return !q || `${c.brand} ${c.name} ${c.specs}`.toLowerCase().includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, status, version]);

  const update = (id: string, patch: { active?: boolean; price?: number; stock?: number }, message?: string) => {
    setOverride(id, patch);
    applyOverrides(pcComponents);
    refresh();
    if (message) toast.success(message);
  };

  const numberChange = (id: string, field: 'price' | 'stock', raw: string) => {
    const n = Number(raw);
    if (raw === '' || !Number.isFinite(n) || n < 0) return;
    update(id, { [field]: field === 'stock' ? Math.floor(n) : n });
  };

  const handleReset = () => {
    resetOverrides();
    applyOverrides(pcComponents);
    refresh();
    toast.info('Catálogo restablecido a los valores originales');
  };

  const quotes = useMemo(() => readQuotes(), [version]); // eslint-disable-line react-hooks/exhaustive-deps
  const pendingCount = quotes.filter((q) => q.status === 'pendiente').length;
  const images = useMemo(() => readImages(), [version]); // eslint-disable-line react-hooks/exhaustive-deps
  const [quoteFilter, setQuoteFilter] = useState<QuoteStatus | 'todas'>('pendiente');

  const changeQuote = (id: string, status: QuoteStatus) => {
    const q = quotes.find((x) => x.id === id);
    if (!q) return;
    if (status === 'vendida' && !q.stockApplied) {
      // Al marcar como vendida se descuenta 1 unidad de cada pieza de la cotización.
      q.items.forEach((it) => {
        const part = pcComponents.find((c) => c.id === it.id);
        if (part) setOverride(it.id, { stock: Math.max(0, part.stock - 1) });
      });
      applyOverrides(pcComponents);
      setQuoteStatus(id, status, true);
      toast.success('Venta registrada y existencias descontadas');
    } else {
      setQuoteStatus(id, status);
    }
    refresh();
  };

  const onPickImage = async (id: string, file?: File) => {
    if (!file) return;
    try { setImage(id, await fileToWebp(file)); refresh(); toast.success('Imagen guardada'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'No se pudo guardar la imagen'); }
  };
  const onExport = () => {
    const blob = exportImagesZip();
    if (!blob) return toast.info('Aún no has subido imágenes');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'components-images.zip'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const nameOf = (id: string) => pcComponents.find((c) => c.id === id)?.name ?? id;
  const overridesCount = Object.keys(readOverrides()).length;
  const maxTop = Math.max(1, ...data.builds.topParts.map((p) => p.count));

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <img src={logo} alt={STORE.name} className="h-9 w-auto lg:h-10" />
            <span className="font-display hidden rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold uppercase tracking-widest sm:inline">Administración</span>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            <span className="hidden text-sm text-gray-400 md:inline">Sesión: <b className="font-medium text-white">{name}</b></span>
            <button onClick={onViewStore} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 transition hover:border-red-500/60 hover:text-white">
              <Store className="h-4 w-4" /> <span className="hidden sm:inline">Ver tienda</span>
            </button>
            <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 transition hover:border-red-500/60 hover:text-white">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-16 pt-6 lg:px-8">
        <h1 className="font-display text-4xl font-bold uppercase tracking-tight lg:text-5xl">
          Panel <span className="text-red-500">administrativo</span>
        </h1>
        <p className="mt-1 text-gray-400">Controla qué piezas ven tus clientes y revisa la actividad de la tienda.</p>

        <div role="tablist" className="mt-6 flex gap-2">
          {([['dashboard', 'Dashboard', BarChart3], ['pending', 'Pendientes', ClipboardList], ['inventory', 'Inventario', Boxes]] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition ${
                tab === id ? 'border-red-500 bg-red-600 text-white shadow-lg shadow-red-600/30' : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
              {id === 'pending' && pendingCount > 0 && <span className="rounded-full bg-white px-1.5 text-xs font-bold text-red-600">{pendingCount}</span>}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && (
          <section className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <Kpi icon={Package} label="Piezas disponibles" value={`${data.active.length} / ${pcComponents.length}`} hint="Visibles para los clientes" />
              <Kpi icon={PackageX} label="Piezas desactivadas" value={data.inactive} hint="Ocultas en el configurador" tone={data.inactive > 0 ? 'warn' : 'default'} />
              <Kpi icon={DollarSign} label="Valor del inventario" value={money(data.inventoryValue)} hint="Precio × existencias, solo piezas disponibles" />
              <Kpi icon={PackageX} label="Agotadas" value={data.out} hint="Existencias en 0" tone={data.out > 0 ? 'warn' : 'default'} />
              <Kpi icon={AlertTriangle} label={`Stock bajo (${LOW_STOCK} o menos)`} value={data.low.length} hint="Piezas por reponer" tone={data.low.length > 0 ? 'warn' : 'default'} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Kpi icon={Users} label="Clientes registrados" value={data.users} hint="En este navegador" />
              <Kpi icon={FolderOpen} label="Builds guardados" value={data.builds.total} />
              <Kpi icon={MessageCircle} label="Cotizaciones por WhatsApp" value={data.stats.quote} />
              <Kpi icon={Store} label="Builds compartidos" value={data.stats.share} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="font-display text-xl font-bold uppercase">Piezas por categoría</h2>
                <p className="mb-4 text-xs text-gray-500">Disponibles sobre el total del catálogo</p>
                <ul className="space-y-3">
                  {data.byCategory.map(({ cat, total, active }) => (
                    <li key={cat}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-gray-300">{CATEGORY_LABEL[cat]}</span>
                        <span className="text-gray-400">{active} de {total}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-red-600 transition-all" style={{ width: `${(active / total) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="font-display text-xl font-bold uppercase">Piezas más guardadas</h2>
                <p className="mb-4 text-xs text-gray-500">Según los builds guardados por los clientes</p>
                {data.builds.topParts.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-gray-500">Aún no hay builds guardados.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.builds.topParts.map(({ id, count }) => (
                      <li key={id}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="truncate pr-3 text-gray-300">{nameOf(id)}</span>
                          <span className="text-gray-400">{count}</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-red-500" style={{ width: `${(count / maxTop) * 100}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="font-display text-xl font-bold uppercase">Por reponer</h2>
              {data.low.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">Todas las piezas disponibles tienen existencias suficientes.</p>
              ) : (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {data.low.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3 text-sm">
                      <span className="truncate text-gray-300">{c.brand} {c.name}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${c.stock === 0 ? 'bg-red-600 text-white' : 'bg-red-500/20 text-red-300'}`}>
                        {c.stock === 0 ? 'Agotado' : `${c.stock} und.`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {tab === 'pending' && (
          <section className="mt-6">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
              {(['pendiente', 'atendida', 'vendida', 'cancelada', 'todas'] as const).map((f) => (
                <button key={f} onClick={() => setQuoteFilter(f)}
                  className={`rounded-full border px-3 py-1.5 capitalize ${quoteFilter === f ? 'border-red-500 bg-red-600 text-white' : 'border-white/10 text-gray-400 hover:text-white'}`}>
                  {f === 'todas' ? 'Todas' : f + 's'} ({f === 'todas' ? quotes.length : quotes.filter((q) => q.status === f).length})
                </button>
              ))}
            </div>
            {quotes.filter((q) => quoteFilter === 'todas' || q.status === quoteFilter).length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-gray-500">
                No hay cotizaciones aquí. Aparecen cuando un cliente pulsa «Cotizar por WhatsApp».
              </p>
            ) : (
              <ul className="space-y-4">
                {quotes.filter((q) => quoteFilter === 'todas' || q.status === quoteFilter).map((q) => (
                  <li key={q.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-display text-lg font-bold">{q.id} · {q.customer || 'Cliente'}</p>
                        <p className="text-xs text-gray-500">{[q.code, q.phone, q.email].filter(Boolean).join(' · ')} · {new Date(q.createdAt).toLocaleString('es-VE')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-2xl font-bold">${q.total.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">con IVA · subtotal ${q.subtotal}</p>
                      </div>
                    </div>
                    <ul className="mt-3 grid gap-1 text-sm text-gray-300 sm:grid-cols-2">
                      {q.items.map((it) => {
                        const part = pcComponents.find((c) => c.id === it.id);
                        return (
                          <li key={it.id} className="flex justify-between gap-3">
                            <span className="truncate"><span className="text-gray-500">{it.label}:</span> {it.name}</span>
                            {part && part.stock === 0 && <span className="shrink-0 text-xs font-bold text-red-400">Agotado</span>}
                          </li>
                        );
                      })}
                    </ul>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                      <span className="mr-2 rounded-full bg-white/10 px-2.5 py-1 text-xs uppercase tracking-wider text-gray-300">{q.status}</span>
                      {q.status !== 'atendida' && q.status !== 'vendida' && <button onClick={() => changeQuote(q.id, 'atendida')} className="rounded-lg border border-white/10 px-3 py-1.5 hover:border-red-500/60">Marcar atendida</button>}
                      {q.status !== 'vendida' && <button onClick={() => changeQuote(q.id, 'vendida')} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 font-medium hover:bg-red-500"><Check className="h-4 w-4" /> Vendida (descuenta stock)</button>}
                      {q.status !== 'cancelada' && q.status !== 'vendida' && <button onClick={() => changeQuote(q.id, 'cancelada')} className="rounded-lg border border-white/10 px-3 py-1.5 text-gray-400 hover:text-white">Cancelar</button>}
                      <button onClick={() => { deleteQuote(q.id); refresh(); }} aria-label="Eliminar cotización" className="ml-auto text-gray-500 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-gray-500">La venta se cierra por WhatsApp; aquí solo llevas el control. Demo: las cotizaciones se guardan en este navegador.</p>
          </section>
        )}

        {tab === 'inventory' && (
          <section className="mt-6">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
              <div className="relative min-w-[220px] flex-1 sm:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar pieza"
                  aria-label="Buscar pieza"
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 py-2 pl-9 pr-3 text-gray-200 outline-none focus:border-red-500 sm:w-64"
                />
              </div>
              <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} aria-label="Filtrar por categoría"
                className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-gray-300 outline-none focus:border-red-500">
                <option value="all">Todas las categorías</option>
                {CATEGORY_ORDER.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
              </select>
              <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Filtrar por estado"
                className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-gray-300 outline-none focus:border-red-500">
                <option value="all">Todas</option>
                <option value="active">Disponibles</option>
                <option value="inactive">Desactivadas</option>
                <option value="out">Agotadas (0)</option>
                <option value="low">Stock bajo</option>
              </select>
              <span className="text-gray-500">{rows.length} de {pcComponents.length} piezas</span>
              <button onClick={handleReset} disabled={overridesCount === 0}
                className="ml-auto inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-gray-300 hover:border-red-500/60 hover:text-white disabled:opacity-40">
                <RotateCcw className="h-4 w-4" /> Restablecer catálogo
              </button>
              <button onClick={onExport} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-gray-300 hover:border-red-500/60 hover:text-white">
                <Download className="h-4 w-4" /> Exportar imágenes (.zip)
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-white/5 text-xs uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Imagen</th>
                    <th className="px-4 py-3">Pieza</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3">Precio (USD)</th>
                    <th className="px-4 py-3">Existencias</th>
                    <th className="px-4 py-3">Disponible</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => {
                    const on = isActive(c.id);
                    return (
                      <tr key={c.id} className={`border-t border-white/10 ${on ? '' : 'bg-white/[0.02] text-gray-500'}`}>
                        <td className="px-4 py-3">
                          <label className="group relative flex h-14 w-14 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/20 bg-black/40 hover:border-red-500" title="Subir imagen">
                            {images[c.id] ? <img src={images[c.id]} alt="" className="h-full w-full object-contain" /> : <ImagePlus className="h-5 w-5 text-gray-500" />}
                            <input type="file" accept="image/*" className="sr-only" aria-label={`Imagen de ${c.name}`} onChange={(e) => { onPickImage(c.id, e.target.files?.[0]); e.target.value = ''; }} />
                          </label>
                          {images[c.id] && <button onClick={() => { removeImage(c.id); refresh(); }} className="mt-1 text-[11px] text-gray-500 hover:text-red-400">Quitar</button>}
                        </td>
                        <td className="px-4 py-3">
                          <p className={`font-medium ${on ? 'text-white' : 'text-gray-500 line-through'}`}>{c.name}</p>
                          <p className="text-xs text-gray-500">{c.brand} · {c.id}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{CATEGORY_LABEL[c.category]}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number" min={0} step={1}
                            defaultValue={c.price}
                            key={`p-${c.id}-${c.price}`}
                            aria-label={`Precio de ${c.name}`}
                            onBlur={(e) => numberChange(c.id, 'price', e.target.value)}
                            className="w-24 rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-white outline-none focus:border-red-500"
                          />
                          {basePrice(c.id) !== undefined && basePrice(c.id) !== c.price && <span className="ml-2 text-xs text-red-400">antes ${basePrice(c.id)}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number" min={0} step={1}
                            defaultValue={c.stock}
                            key={`s-${c.id}-${c.stock}`}
                            aria-label={`Existencias de ${c.name}`}
                            onBlur={(e) => numberChange(c.id, 'stock', e.target.value)}
                            className="w-20 rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-white outline-none focus:border-red-500"
                          />
                          <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${c.stock === 0 ? 'bg-red-600 text-white' : c.stock <= LOW_STOCK ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>{c.stock === 0 ? 'Agotado' : c.stock <= LOW_STOCK ? 'Stock bajo' : 'En stock'}</span>
                          {baseStock(c.id) !== undefined && baseStock(c.id) !== c.stock && <span className="ml-2 text-xs text-gray-500">antes {baseStock(c.id)}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            role="switch"
                            aria-checked={on}
                            aria-label={`${on ? 'Desactivar' : 'Activar'} ${c.name}`}
                            onClick={() => update(c.id, { active: !on }, on ? `${c.name} desactivada` : `${c.name} disponible`)}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${on ? 'bg-red-600' : 'bg-white/15'}`}
                          >
                            <span className={`inline-block h-5 w-5 rounded-full bg-white transition ${on ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                          <span className="ml-2 text-xs text-gray-400">{on ? 'Sí' : 'No'}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No hay piezas con ese filtro.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Los cambios se aplican al instante en el configurador de los clientes. Las piezas desactivadas dejan de mostrarse en el catálogo.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
