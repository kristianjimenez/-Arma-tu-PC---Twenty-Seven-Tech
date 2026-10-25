import logo from '../../imports/twenty_seven_tech_logo.png';
import { STORE } from '../data/store-info';
import { InstagramIcon, WhatsAppIcon } from './SocialLinks';

export function Footer() {
  return (
    <footer className="bg-black">
      <div className="stripes stripes-red" aria-hidden />
      <div className="mx-auto grid max-w-[1300px] gap-8 px-4 py-10 md:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
        <div>
          <img src={logo} alt={STORE.name} className="h-12 w-auto" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-400">Tienda física de computación, periféricos y servicio técnico en Caracas.</p>
          <p className="mt-3 text-xs text-gray-600">RIF {STORE.rif}</p>
        </div>
        <div className="text-sm">
          <p className="font-cond text-lg">Escríbenos</p>
          <a href={STORE.whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-2 text-gray-300 hover:text-white"><WhatsAppIcon className="h-4 w-4" /> {STORE.whatsappDisplay}</a>
          <a href={STORE.instagramUrl} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-2 text-gray-300 hover:text-white"><InstagramIcon className="h-4 w-4" /> @{STORE.instagramUser}</a>
        </div>
        <div className="text-sm">
          <p className="font-cond text-lg">Visítanos</p>
          <p className="mt-3 leading-relaxed text-gray-400">{STORE.address}</p>
          <a href={STORE.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[var(--t27-red)] underline underline-offset-4">Cómo llegar</a>
        </div>
      </div>
      <p className="border-t border-white/10 px-4 py-4 text-center text-xs text-gray-600">Precios referenciales en USD. El precio y el stock finales se confirman con la tienda.</p>
    </footer>
  );
}
