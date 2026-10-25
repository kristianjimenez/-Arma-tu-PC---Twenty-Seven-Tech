import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Mail, Download, CheckCircle, Image, FileText, Loader2 } from 'lucide-react';
import { PCBuild } from '../types/pc-component';
import { BuildBanner } from './BuildBanner';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { TAX_RATE } from '../data/store-info';
import { toast } from 'sonner';

interface SaveBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  build: PCBuild;
  onSave: (email: string) => void;
  username?: string;
  defaultEmail?: string;
}

export function SaveBudgetDialog({ open, onOpenChange, build, onSave, username, defaultEmail }: SaveBudgetDialogProps) {
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [saved, setSaved] = useState(false);
  const [loadingPng, setLoadingPng] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  const captureBanner = async (): Promise<string> => {
    if (!bannerRef.current) throw new Error('Banner not ready');
    return toPng(bannerRef.current, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: '#080808',
    });
  };

  const handleDownloadPng = async () => {
    setLoadingPng(true);
    try {
      const dataUrl = await captureBanner();
      const link = document.createElement('a');
      link.download = 'mi-build-twentyseventech.png';
      link.href = dataUrl;
      link.click();
      toast.success('Banner descargado como PNG');
    } catch {
      toast.error('Error al generar la imagen');
    } finally {
      setLoadingPng(false);
    }
  };

  const handleDownloadPdf = async () => {
    setLoadingPdf(true);
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
      toast.success('PDF descargado correctamente');
    } catch (err) {
      console.error(err);
      toast.error('Error al generar el PDF');
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleSave = () => {
    if (!email) return;
    onSave(email);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setEmail('');
      onOpenChange(false);
    }, 2500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-950 border-gray-800 text-white max-w-4xl p-0 overflow-hidden">
        {!saved ? (
          <div className="flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-800">
              <DialogTitle className="text-xl text-white">Compartir tu Build</DialogTitle>
              <p className="text-gray-400 text-sm mt-1">
                Descarga tu banner personalizado o guarda el presupuesto completo en PDF
              </p>
            </div>

            {/* Banner preview — rendered at full size, scaled with CSS */}
            <div className="px-6 pt-5 pb-2">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Vista previa del banner</p>
              <div className="overflow-hidden rounded-lg border border-gray-800 bg-black" style={{ height: '280px' }}>
                <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%', pointerEvents: 'none' }}>
                  <BuildBanner ref={bannerRef} build={build} username={username} />
                </div>
              </div>
            </div>

            {/* Download actions */}
            <div className="px-6 pb-4">
              <div className="flex gap-3">
                <Button
                  onClick={handleDownloadPng}
                  disabled={loadingPng || loadingPdf}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white h-11"
                >
                  {loadingPng
                    ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    : <Image className="w-4 h-4 mr-2" />
                  }
                  Descargar Banner PNG
                </Button>
                <Button
                  onClick={handleDownloadPdf}
                  disabled={loadingPng || loadingPdf}
                  variant="outline"
                  className="flex-1 border-red-600 text-red-400 hover:bg-red-600/10 h-11"
                >
                  {loadingPdf
                    ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    : <FileText className="w-4 h-4 mr-2" />
                  }
                  Descargar PDF Completo
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-6 border-t border-gray-800 mb-4" />

            {/* Email save */}
            <div className="px-6 pb-6 space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-widest">O recíbelo en tu correo</p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    className="pl-10 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-red-600 h-11"
                  />
                </div>
                <Button
                  onClick={handleSave}
                  disabled={!email}
                  className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 h-11 px-5"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-14 text-center space-y-4 px-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl text-white mb-2">¡Presupuesto Enviado!</h3>
              <p className="text-gray-400 leading-relaxed">
                Te enviamos el presupuesto a{' '}
                <span className="text-red-400">{email}</span> con el banner y el PDF descargable.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
