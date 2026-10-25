import { useEffect, useRef, useState } from 'react';
import { ComponentCategory, PCComponent, PCBuild } from './types/pc-component';
import { getCategoryComponents, pcComponents } from './data/pc-components';
import { Preset, PRESETS } from './data/presets';
import { validateCompatibility, calculateTotal, getConflict } from './utils/compatibility';
import { analyzeBuildPerformance } from './utils/build-performance';
import { deleteBuildEntry, listBuilds, loadDraft, PartIds, saveBuildEntry, saveDraft, SavedBuildEntry } from './lib/builds';
import { clearSession, getSession, type Session } from './lib/auth';
import { STORE, TAX_RATE } from './data/store-info';
import { ComponentCard } from './components/ComponentCard';
import { BuildSummary } from './components/BuildSummary';
import { SaveBudgetDialog } from './components/SaveBudgetDialog';
import { CheckoutDialog } from './components/CheckoutDialog';
import { MyBuildsSheet } from './components/MyBuildsSheet';
import { LoginPage } from './components/LoginPage';
import { SiteHeader } from './components/SiteChrome';
import { Hero, ReadyBuilds, HowToBuy, StoreSection } from './components/Landing';
import { Footer } from './components/Footer';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './components/ui/sheet';
import { ChevronRight, ChevronLeft, ListChecks, Save, Trash2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';

// Orden de armado: la base (CPU → placa → RAM) define qué es compatible después.
const categories: { id: ComponentCategory; label: string; title: string; hint: string }[] = [
  { id: 'cpu', label: 'Procesador', title: 'Procesador (CPU)', hint: 'El cerebro del equipo. Su socket define qué placa puedes usar.' },
  { id: 'motherboard', label: 'Placa base', title: 'Placa base', hint: 'Debe tener el mismo socket que tu procesador. Las que no, aparecen bloqueadas.' },
  { id: 'ram', label: 'Memoria RAM', title: 'Memoria RAM', hint: 'DDR4 o DDR5, según lo que acepte tu placa.' },
  { id: 'gpu', label: 'Gráfica', title: 'Tarjeta gráfica (GPU)', hint: 'La pieza que más pesa para jugar.' },
  { id: 'storage', label: 'Disco', title: 'Almacenamiento', hint: 'SSD NVMe: el sistema y los juegos cargan mucho más rápido.' },
  { id: 'power', label: 'Fuente', title: 'Fuente de poder', hint: 'Tiene que alcanzar para tu tarjeta gráfica.' },
  { id: 'case', label: 'Case', title: 'Case', hint: 'Debe aceptar el formato de tu placa (mATX o ATX).' },
];

const emptyBuild: PCBuild = { components: {}, totalPrice: 0, compatibilityIssues: [] };
const FEATURED = PRESETS[1];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const goToBuilder = () => document.getElementById('armar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

function buildFromIds(ids: PartIds): PCBuild {
  const components: PCBuild['components'] = {};
  (Object.entries(ids) as [ComponentCategory, string][]).forEach(([cat, id]) => {
    const c = pcComponents.find((x) => x.id === id);
    if (c) components[cat] = c;
  });
  return { components, totalPrice: calculateTotal(components), compatibilityIssues: validateCompatibility({ components, totalPrice: 0, compatibilityIssues: [] }) };
}
const idsOf = (b: PCBuild): PartIds => {
  const ids: PartIds = {};
  (Object.entries(b.components) as [ComponentCategory, PCComponent][]).forEach(([k, c]) => (ids[k] = c.id));
  return ids;
};

export default function App() {
  const [session, setSession] = useState<Session | null>(() => getSession());
  const [view, setView] = useState<'site' | 'login'>('site');
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory>('cpu');
  const [build, setBuild] = useState<PCBuild>(() => buildFromIds(loadDraft(getSession()?.email ?? 'anon')));
  const [savedBuilds, setSavedBuilds] = useState<SavedBuildEntry[]>(() => { const s = getSession(); return s ? listBuilds(s.email) : []; });
  const [buildsOpen, setBuildsOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'asc' | 'desc'>('default');
  const [onlyCompatible, setOnlyCompatible] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const demoToken = useRef(0);

  const stepIndex = categories.findIndex((c) => c.id === selectedCategory);
  const current = categories[stepIndex];
  const allOptions = getCategoryComponents(selectedCategory);
  const options = allOptions
    .filter((c) => !onlyCompatible || !getConflict(c, build.components))
    .sort((a, b) => (sortBy === 'asc' ? a.price - b.price : sortBy === 'desc' ? b.price - a.price : 0));
  const chosen = Object.keys(build.components).length;
  const completion = Math.round((chosen / categories.length) * 100);
  const totalWithTax = build.totalPrice * (1 + TAX_RATE);

  useEffect(() => { saveDraft(session?.email ?? 'anon', idsOf(build)); }, [build, session]);

  const updateBuild = (components: PCBuild['components']) =>
    setBuild({ components, totalPrice: calculateTotal(components), compatibilityIssues: validateCompatibility({ components, totalPrice: 0, compatibilityIssues: [] }) });

  const handleAdd = (component: PCComponent) => {
    updateBuild({ ...build.components, [component.category]: component });
    toast.success(`${component.name} añadido`, { description: `$${component.price}` });
    if (stepIndex < categories.length - 1) setTimeout(() => setSelectedCategory(categories[stepIndex + 1].id), 300);
  };

  const handleRemove = (category: ComponentCategory) => {
    const rest = { ...build.components };
    delete rest[category];
    updateBuild(rest);
  };

  const handleLoadPreset = (preset: Preset) => {
    demoToken.current++; setDemoRunning(false);
    setBuild(buildFromIds(preset.parts));
    setSelectedCategory('case');
    toast.success(`Cargamos "${preset.name}"`, { description: 'Puedes cambiar cualquier pieza' });
    goToBuilder();
  };

  // Demo guiada: arma un PC paso a paso (útil para mostrar el flujo completo)
  const handleDemo = async () => {
    const token = ++demoToken.current;
    setDemoRunning(true);
    setBuild(emptyBuild);
    goToBuilder();
    let acc: PCBuild['components'] = {};
    for (const { id } of categories) {
      if (token !== demoToken.current) return;
      setSelectedCategory(id);
      await sleep(1100);
      if (token !== demoToken.current) return;
      const part = pcComponents.find((c) => c.id === FEATURED.parts[id])!;
      acc = { ...acc, [id]: part };
      updateBuild(acc);
      toast.success(part.name, { description: `$${part.price}`, duration: 900 });
      await sleep(700);
    }
    setDemoRunning(false);
    toast.success('Equipo completo y compatible', { description: 'Ya puedes finalizar tu pedido' });
  };

  const handleClear = () => { demoToken.current++; setDemoRunning(false); setBuild(emptyBuild); setSelectedCategory('cpu'); };

  const handleSaveBuild = () => {
    if (!session) { toast.info('Ingresa para guardar tus builds'); setView('login'); return; }
    if (chosen === 0) return;
    const label = build.components.gpu ? analyzeBuildPerformance(build.components).tierLabel : 'Build en progreso';
    setSavedBuilds(saveBuildEntry(session.email, `${label} • $${build.totalPrice}`, idsOf(build)));
    toast.success('Guardado en "Mis builds"');
  };

  const handleShare = async () => {
    const lines = categories.map(({ id, label }) => build.components[id] && `• ${label}: ${build.components[id]!.name}`).filter(Boolean).join('\n');
    const text = `Mi PC en ${STORE.name}:\n${lines}\nTotal con IVA: $${totalWithTax.toFixed(2)}\n${STORE.instagramUrl}`;
    if (navigator.share) { try { await navigator.share({ title: `Mi PC en ${STORE.name}`, text }); return; } catch { /* cancelado */ } }
    await navigator.clipboard.writeText(text);
    toast.success('Copiado. Pégalo donde quieras compartirlo');
  };

  const handleLogin = (s: Session) => {
    setSession(s);
    setSavedBuilds(listBuilds(s.email));
    if (Object.keys(build.components).length === 0) setBuild(buildFromIds(loadDraft(s.email)));
    setView('site');
    toast.success(`Hola, ${s.name.split(' ')[0]}`);
  };

  const handleLogout = () => {
    demoToken.current++; setDemoRunning(false);
    clearSession(); setSession(null); setSavedBuilds([]); setBuild(emptyBuild); setSelectedCategory('cpu');
    toast.info('Sesión cerrada');
  };

  if (view === 'login') return <><Toaster theme="dark" position="top-center" /><LoginPage onLogin={handleLogin} onBack={() => setView('site')} /></>;

  const summary = (
    <BuildSummary
      components={build.components} totalPrice={build.totalPrice} compatibilityIssues={build.compatibilityIssues}
      onRemove={handleRemove} completionPercentage={completion} onShare={handleShare}
      onSave={() => { setSummaryOpen(false); setSaveDialogOpen(true); }}
      onCheckout={() => { setSummaryOpen(false); setCheckoutOpen(true); }}
    />
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Toaster theme="dark" position="top-center" toastOptions={{ style: { borderRadius: 0 } }} />
      <SiteHeader userName={session?.name} savedCount={savedBuilds.length} onLogin={() => setView('login')} onLogout={handleLogout} onMyBuilds={() => setBuildsOpen(true)} />

      <Hero onStart={goToBuilder} onLoadFeatured={() => handleLoadPreset(FEATURED)} />
      <ReadyBuilds onLoad={handleLoadPreset} onDemo={handleDemo} disabled={demoRunning} />

      {/* Configurador */}
      <section id="armar" className="scroll-mt-28 border-b border-white/15">
        <div className="mx-auto grid max-w-[1300px] gap-8 px-4 py-14 lg:grid-cols-[1fr_380px] lg:px-8">
          <div className="min-w-0 pb-20 lg:pb-0">
            <h2 className="font-display text-5xl sm:text-6xl">Arma tu PC</h2>
            <p className="mt-2 text-gray-400">Elige una pieza por paso. Si algo no encaja con lo que ya elegiste, te lo decimos antes de agregarlo.</p>

            <nav aria-label="Pasos" className="-mx-4 mt-6 flex gap-px overflow-x-auto px-4 lg:mx-0 lg:px-0">
              {categories.map(({ id, label }, i) => {
                const active = id === selectedCategory;
                const done = !!build.components[id];
                return (
                  <button key={id} onClick={() => setSelectedCategory(id)} aria-current={active ? 'step' : undefined}
                    className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm transition ${active ? 'border-[var(--t27-red)] bg-white/10 text-white' : done ? 'border-white/40 text-white' : 'border-transparent text-gray-500 hover:text-white'}`}>
                    <span className={`font-display flex h-6 w-6 items-center justify-center text-base ${done ? 'bg-[var(--t27-red)] text-white' : 'bg-white/10'}`}>{i + 1}</span>{label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-6">
              <h3 className="font-cond text-3xl">{stepIndex + 1}. {current.title}</h3>
              <p className="text-sm text-gray-400">{current.hint}</p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} aria-label="Ordenar" className="border border-white/20 bg-black px-3 py-2 text-gray-200">
                <option value="default">Orden recomendado</option>
                <option value="asc">Precio: de menor a mayor</option>
                <option value="desc">Precio: de mayor a menor</option>
              </select>
              <label className="flex cursor-pointer items-center gap-2 border border-white/20 px-3 py-2 text-gray-200 has-[:checked]:border-[var(--t27-red)]">
                <input type="checkbox" checked={onlyCompatible} onChange={(e) => setOnlyCompatible(e.target.checked)} className="accent-[var(--t27-red)]" /> Solo compatibles
              </label>
              <span className="text-gray-500">{options.length} de {allOptions.length}</span>
              <div className="ml-auto flex gap-2">
                <button onClick={handleSaveBuild} disabled={chosen === 0} className="flex items-center gap-1.5 border border-white/20 px-3 py-2 hover:bg-white hover:text-black disabled:opacity-40"><Save className="h-4 w-4" /> Guardar</button>
                <button onClick={handleClear} disabled={chosen === 0} className="flex items-center gap-1.5 border border-white/20 px-3 py-2 text-gray-400 hover:text-white disabled:opacity-40"><Trash2 className="h-4 w-4" /> Vaciar</button>
              </div>
            </div>

            {options.length === 0 && <p className="mt-4 border border-dashed border-white/20 p-8 text-center text-gray-400">Ninguna opción encaja con lo que ya elegiste. Desmarca “Solo compatibles” o cambia otra pieza.</p>}

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {options.map((component) => (
                <ComponentCard key={component.id} component={component} isSelected={build.components[selectedCategory]?.id === component.id}
                  conflict={getConflict(component, build.components)} onAdd={handleAdd} />
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button onClick={() => setSelectedCategory(categories[stepIndex - 1].id)} disabled={stepIndex === 0} className="flex items-center gap-1 px-2 py-2 text-sm text-gray-400 hover:text-white disabled:invisible"><ChevronLeft className="h-4 w-4" /> Anterior</button>
              {stepIndex < categories.length - 1 && (
                <button onClick={() => setSelectedCategory(categories[stepIndex + 1].id)} className="flex items-center gap-1 bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-gray-200">Siguiente <ChevronRight className="h-4 w-4" /></button>
              )}
            </div>
          </div>

          <aside className="hidden lg:block"><div className="sticky top-28 h-[calc(100vh-8rem)]">{summary}</div></aside>
        </div>
      </section>

      <HowToBuy />
      <StoreSection />
      <Footer />

      {/* Barra inferior (móvil) */}
      {chosen > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/20 bg-black p-3 lg:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
            <div><p className="text-xs text-gray-400">{chosen} de 7 piezas • con IVA</p><p className="font-display text-3xl text-[var(--t27-red)]">${totalWithTax.toFixed(2)}</p></div>
            <button onClick={() => setSummaryOpen(true)} className="flex items-center gap-2 bg-[var(--t27-red)] px-5 py-3 text-sm font-semibold"><ListChecks className="h-4 w-4" /> Ver mi equipo</button>
          </div>
        </div>
      )}

      <Sheet open={summaryOpen} onOpenChange={setSummaryOpen}>
        <SheetContent side="bottom" className="h-[90vh] border-white/20 bg-black p-0">
          <SheetHeader className="sr-only"><SheetTitle>Tu equipo</SheetTitle></SheetHeader>
          {summary}
        </SheetContent>
      </Sheet>

      <MyBuildsSheet open={buildsOpen} onOpenChange={setBuildsOpen} builds={savedBuilds}
        onLoad={(b) => { setBuild(buildFromIds(b.parts)); setBuildsOpen(false); goToBuilder(); toast.success('Build cargado'); }}
        onDelete={(id) => session && setSavedBuilds(deleteBuildEntry(session.email, id))} />

      <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} build={build} defaultName={session?.name}
        onDownloadBudget={() => { setCheckoutOpen(false); setSaveDialogOpen(true); }} />

      <SaveBudgetDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen} build={build}
        onSave={(email) => console.log('Presupuesto para', email)} username={session?.name} defaultEmail={session?.email} />
    </div>
  );
}
