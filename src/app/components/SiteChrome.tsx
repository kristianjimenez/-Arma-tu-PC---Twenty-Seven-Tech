import { MapPin, LogOut, FolderOpen, User } from 'lucide-react';
import logo from '../../imports/twenty_seven_tech_logo.png';
import { STORE } from '../data/store-info';
import { InstagramIcon, WhatsAppIcon } from './SocialLinks';

interface HeaderProps {
  userName?: string;
  savedCount: number;
  onLogin: () => void;
  onLogout: () => void;
  onMyBuilds: () => void;
}

const links = [
  { href: '#equipos', label: 'Equipos listos' },
  { href: '#armar', label: 'Arma tu PC' },
  { href: '#como-comprar', label: 'Cómo comprar' },
  { href: '#tienda', label: 'La tienda' },
];

export function SiteHeader({ userName, savedCount, onLogin, onLogout, onMyBuilds }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40">
      <div className="bg-[var(--t27-red)] text-white">
        <div className="mx-auto flex max-w-[1300px] items-center justify-between gap-4 px-4 py-1.5 text-xs sm:text-sm lg:px-8">
          <a href={STORE.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:underline">
            <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="hidden sm:inline">{STORE.address}</span><span className="sm:hidden">Caracas, CPC Local LM11</span>
          </a>
          <span className="hidden font-medium md:inline">{STORE.warranty}</span>
          <a href={STORE.whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-medium hover:underline">
            <WhatsAppIcon className="h-3.5 w-3.5" /> {STORE.whatsappDisplay}
          </a>
        </div>
      </div>
      <div className="border-b border-white/15 bg-black">
        <div className="mx-auto flex h-16 max-w-[1300px] items-center justify-between gap-6 px-4 lg:px-8">
          <a href="#inicio" aria-label="Twenty Seven Tech, inicio"><img src={logo} alt={STORE.name} className="h-9 w-auto lg:h-11" /></a>
          <nav aria-label="Principal" className="hidden items-center gap-7 text-[15px] md:flex">
            {links.map((l) => <a key={l.href} href={l.href} className="text-gray-300 transition hover:text-white">{l.label}</a>)}
          </nav>
          <div className="flex items-center gap-2 text-sm">
            <a href={STORE.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hidden h-9 w-9 items-center justify-center text-gray-300 hover:text-white sm:flex"><InstagramIcon className="h-5 w-5" /></a>
            {userName ? (
              <>
                <button onClick={onMyBuilds} className="flex items-center gap-1.5 border border-white/25 px-3 py-2 hover:bg-white hover:text-black">
                  <FolderOpen className="h-4 w-4" /> <span className="hidden sm:inline">Mis builds</span>{savedCount > 0 && <span className="bg-[var(--t27-red)] px-1.5 text-xs text-white">{savedCount}</span>}
                </button>
                <button onClick={onLogout} aria-label={`Salir (${userName})`} title={`Salir (${userName})`} className="flex items-center gap-1.5 px-2 py-2 text-gray-400 hover:text-white"><LogOut className="h-4 w-4" /></button>
              </>
            ) : (
              <button onClick={onLogin} className="flex items-center gap-1.5 border border-white/25 px-3 py-2 hover:bg-white hover:text-black"><User className="h-4 w-4" /> Ingresar</button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
