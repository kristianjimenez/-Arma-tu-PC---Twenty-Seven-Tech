import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Mail, Image as ImageIcon, FileText, Loader2, Share2, ExternalLink, Info } from 'lucide-react';
import { PCBuild } from '../types/pc-component';
import { BuildBanner } from './BuildBanner';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { STORE, TAX_RATE } from '../data/store-info';
import { fmtBs, useBcv } from '../lib/bcv';
import { track } from '../lib/stats';
import { toast } from 'sonner';

interface SaveBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  build: PCBuild;
  onSave?: (email: string) => void;
  username?: string;
  defaultEmail?: string;
}

const LABELS: Array<[string, string]> = [
  ['cpu', 'Procesador'], ['motherboard', 'Placa base'], ['ram', 'Memoria RAM'], ['gpu', 'Tarjeta gráfica'],
  ['storage', 'Almacenamiento'], ['power', 'Fuente de poder'], ['case', 'Case'],
];
const BANNER_W = 1000;
const BANNER_H = 560;
const FILE_NAME = 'mi-build-twentyseventech';

export function SaveBudgetDialog({ open, onOpenChange, build, username, defaultEmail }: SaveBudgetDialogProps) {
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [busy, setBusy] = useState<'png' | 'pdf' | 'mail' | 'share' | null>(null);
  const [emailHint, setEmailHint] = useState('');
  const bannerRef = useRef<HTMLDivElement>(null);
  const rate = useBcv();

  // La vista previa se escala al ancho disponible (sirve en celular y en computadora).
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.5);
  useEffect(() => {
    if (!box) return;
    const fit = () => setScale(Math.min(1, box.clientWidth / BANNER_W));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [box]);
  useEffect(() => { if (open) setEmail((e) => e || defaultEmail || ''); }, [open, defaultEmail]);

  const subtotal = build.totalPrice;
  const totalUsd = subtotal * (1 + TAX_RATE);

  const captureBanner = async (): Promise<string> => {
    if (!bannerRef.current) throw new Error('Banner not ready');
    return toPng(bannerRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: '#080808' });
  };
  const captureBlob = async (): Promise<Blob> => (await fetch(await captureBanner())).blob();

  const summaryText = () => {
    const lines = LABELS.map(([cat, label]) => {
      const c = build.components[cat as keyof typeof build.components];
      return c ? `• ${label}: ${c.name} — $${c.price}` : null;
    }).filter(Boolean).join('\n');
    const bs = rate ? `\n(≈ ${fmtBs(totalUsd * rate.rate)} a tasa BCV ${rate.rate.toFixed(2)})` : '';
    return `Mi PC armada en ${STORE.name}\n\n${lines}\n\nSubtotal: $${subtotal.toFixed(2)}\nIVA (${Math.round(TAX_RATE * 100)}%): $${(subtotal * TAX_RATE).toFixed(2)}\nTotal: $${totalUsd.toFixed(2)}${bs}\n\nPrecios referenciales; existencias y precio final se confirman con la tienda.\n${STORE.instagramUrl ?? ''}`;
  };

  const handleDownloadPng = async () => {
    setBusy('png');
    try {
      const link = document.createElement('a');
      link.download = `${FILE_NAME}.png`;
      link.href = await captureBanner();
      link.click();
      track('banner');
      toast.success('Imagen descargada');
    } catch { toast.error('No se pudo generar la imagen'); }
    finally { setBusy(null); }
  };

  /** Comparte la imagen con las apps del teléfono/PC (Gmail, WhatsApp...) si el navegador lo permite. */
  const handleShare = async () => {
    setBusy('share');
    try {
      const file = new File([await captureBlob()], `${FILE_NAME}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Mi PC en ${STORE.name}`, text: summaryText() });
        track('banner');
      } else {
        toast.info('Tu navegador no permite compartir archivos. Usa «Descargar imagen».');
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) toast.error('No se pudo compartir');
    } finally { setBusy(null); }
  };

  /**
   * Correo: un navegador no puede adjuntar archivos por sí solo, así que:
   *  - en celular abre el menú de compartir con la imagen ya adjunta (elige Gmail);
   *  - en computadora descarga la imagen y abre el correo ya redactado para que la adjuntes.
   */
  const handleEmail = async (useMailApp = false) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setEmailHint('Escribe un correo válido.'); return; }
    setEmailHint(''); setBusy('mail');
    try {
      const blob = await captureBlob();
      const file = new File([blob], `${FILE_NAME}.png`, { type: 'image/png' });
      if (!useMailApp && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `Mi PC en ${STORE.name}`, text: summaryText() });
          track('banner');
          return;
        } catch (e) { if (e instanceof DOMException && e.name === 'AbortError') return; }
      }
      const a = document.createElement('a');
      a.download = `${FILE_NAME}.png`; a.href = URL.createObjectURL(blob); a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      const subject = encodeURIComponent(`Mi PC armada en ${STORE.name}`);
      const body = encodeURIComponent(`${summaryText()}\n\n(Adjunta aquí la imagen ${FILE_NAME}.png que se descargó)`);
      const to = encodeURIComponent(email.trim());
      if (useMailApp) window.location.href = `mailto:${email.trim()}?subject=${subject}&body=${body}`;
      else window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`, '_blank', 'noopener');
      track('banner');
      toast.success('Imagen descargada y correo preparado', { description: 'Adjunta la imagen descargada y pulsa Enviar.' });
    } catch { toast.error('No se pudo preparar el correo'); }
    finally { setBusy(null); }
  };

  const handleDownloadPdf = async () => {
    setBusy('pdf');
    try {
      const dataUrl = await captureBanner();

      // Page 1: banner (landscape, 1000x560 px proportions in mm)
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [297, 166] });
      pdf.addImage(dataUrl, 'PNG', 0, 0, 297, 166);

      // Page 2: detail sheet (A4 portrait)
      pdf.addPage('a4', 'portrait');
      const W = 210;

      // Header bar
      pdf.setFillColor(8, 8, 8);
      pdf.rect(0, 0, W, 297, 'F');
      pdf.setFillColor(220, 38, 38);
      pdf.rect(0, 0, W, 32, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TWENTY SEVEN TECH', 14, 14);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(255, 200, 200);
      pdf.text('ARMA TU PC — DETALLE DE PRESUPUESTO', 14, 22);

      const dateStr = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      pdf.setTextColor(255, 200, 200);
      pdf.setFontSize(9);
      pdf.text(dateStr, W - 14, 22, { align: 'right' });

      // Section: components
      let y = 44;
      pdf.setTextColor(220, 38, 38);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('COMPONENTES SELECCIONADOS', 14, y);
      y += 6;

      pdf.setDrawColor(220, 38, 38);
      pdf.setLineWidth(0.3);
      pdf.line(14, y, W - 14, y);
      y += 8;

      const categories: Array<{ cat: string; label: string }> = [
        { cat: 'cpu', label: 'Procesador (CPU)' },
        { cat: 'gpu', label: 'Tarjeta Gráfica (GPU)' },
        { cat: 'motherboard', label: 'Placa Base' },
        { cat: 'ram', label: 'Memoria RAM' },
        { cat: 'storage', label: 'Almacenamiento' },
        { cat: 'power', label: 'Fuente de Poder' },
        { cat: 'case', label: 'Case' },
      ];

      for (const { cat, label } of categories) {
        const comp = build.components[cat as keyof typeof build.components];
        if (!comp) continue;

        // Row bg
        pdf.setFillColor(18, 18, 18);
        pdf.rect(14, y - 5, W - 28, 14, 'F');

        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'normal');
        pdf.text(label.toUpperCase(), 18, y);

        pdf.setTextColor(230, 230, 230);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(comp.name, 18, y + 5);

        pdf.setTextColor(248, 113, 113);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text(`$${comp.price}`, W - 18, y + 5, { align: 'right' });

        pdf.setTextColor(100, 100, 100);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.text(comp.specs, 18, y + 10);

        y += 18;
      }

      // Pricing summary
      y += 4;
      pdf.setDrawColor(220, 38, 38);
      pdf.line(14, y, W - 14, y);
      y += 10;

      const subtotal = build.totalPrice;
      const tax = subtotal * TAX_RATE;
      const total = subtotal + tax;

      const priceRows = [
        { label: 'Subtotal', value: `$${subtotal.toFixed(2)}`, dark: false },
        { label: 'Envío estimado', value: '$0.00', dark: false },
        { label: `IVA (${Math.round(TAX_RATE * 100)}%)`, value: `$${tax.toFixed(2)}`, dark: false },
      ];

      for (const row of priceRows) {
        pdf.setTextColor(160, 160, 160);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9.5);
        pdf.text(row.label, 14, y);
        pdf.setTextColor(220, 220, 220);
        pdf.text(row.value, W - 14, y, { align: 'right' });
        y += 8;
      }

      // Total row
      pdf.setFillColor(40, 5, 5);
      pdf.rect(14, y - 5, W - 28, 14, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.text('TOTAL', 18, y + 4);
      pdf.setTextColor(248, 113, 113);
      pdf.setFontSize(15);
      pdf.text(`$${total.toFixed(2)}`, W - 18, y + 4, { align: 'right' });
      y += 22;

      // Footer
      pdf.setFillColor(220, 38, 38);
      pdf.rect(0, 283, W, 14, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('twentyseventech.com', W / 2, 291, { align: 'center' });

      pdf.save('mi-build-twentyseventech.pdf');
      track('banner');
      toast.success('PDF descargado correctamente');
    } catch (err) {
      console.error(err);
      toast.error('Error al generar el PDF');
    } finally {
      setBusy(null);
    }
  };

  const btn = 'flex h-12 items-center justify-center gap-2 px-4 text-sm font-semibold transition disabled:opacity-50';
  const disabled = busy !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] overflow-y-auto !rounded-none border-white/20 bg-black p-0 text-white sm:max-w-3xl [&>button]:text-white">
        <DialogHeader className="border-b border-white/15 p-5 text-left sm:p-6">
          <DialogTitle className="font-display text-3xl text-white sm:text-4xl">Tu presupuesto</DialogTitle>
          <DialogDescription className="text-gray-400">
            Descarga la imagen o el PDF, o envíatelo por correo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3 border border-white/15 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500">Total con IVA</p>
              <p className="font-display text-4xl text-[var(--t27-red)]">${totalUsd.toFixed(2)}</p>
            </div>
            {rate && <p className="text-right text-sm text-gray-300">≈ {fmtBs(totalUsd * rate.rate)}<span className="block text-xs text-gray-500">Tasa BCV {rate.rate.toFixed(2)}</span></p>}
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-gray-500">Vista previa</p>
            <div ref={setBox} className="w-full overflow-hidden border border-white/15 bg-black" style={{ height: BANNER_H * scale }}>
              <div style={{ width: BANNER_W, height: BANNER_H, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
                <BuildBanner ref={bannerRef} build={build} username={username} />
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <button onClick={handleDownloadPng} disabled={disabled} className={`${btn} cut bg-[var(--t27-red)] text-white hover:bg-red-500`}>
              {busy === 'png' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />} Descargar imagen
            </button>
            <button onClick={handleDownloadPdf} disabled={disabled} className={`${btn} border border-white/30 hover:bg-white hover:text-black`}>
              {busy === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Descargar PDF
            </button>
            <button onClick={handleShare} disabled={disabled} className={`${btn} border border-white/30 hover:bg-white hover:text-black`}>
              {busy === 'share' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />} Compartir
            </button>
          </div>

          <div className="border border-white/15 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold"><Mail className="h-4 w-4 text-[var(--t27-red)]" /> Enviar la imagen a un correo</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="email" inputMode="email" autoComplete="email" placeholder="tucorreo@gmail.com" value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailHint(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleEmail()}
                className="h-12 w-full border border-white/20 bg-black px-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[var(--t27-red)]"
              />
              <button onClick={() => handleEmail()} disabled={disabled} className={`${btn} cut shrink-0 bg-white text-black hover:bg-gray-200`}>
                {busy === 'mail' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />} Preparar correo
              </button>
            </div>
            {emailHint && <p role="alert" className="mt-2 text-sm text-red-300">{emailHint}</p>}
            <p className="mt-3 flex gap-2 text-xs leading-relaxed text-gray-500">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                En el celular se abre el menú de compartir con la imagen ya adjunta (elige Gmail). En computadora se descarga la imagen y se abre Gmail con el mensaje listo: solo adjunta la imagen y envía.{' '}
                <button type="button" onClick={() => handleEmail(true)} disabled={disabled} className="underline underline-offset-2 hover:text-white">Usar mi app de correo</button>
              </span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
