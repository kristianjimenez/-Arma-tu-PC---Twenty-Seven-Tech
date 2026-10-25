import { MapPin } from 'lucide-react';
import { STORE } from '../data/store-info';

export function InstagramIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24s-3.7 8.24-8.24 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.16-.48-.29z" />
    </svg>
  );
}

interface Props { variant?: 'icons' | 'full'; className?: string }

/** Redes sociales de la tienda. 'icons' = botones compactos; 'full' = con texto y ubicación. */
export function SocialLinks({ variant = 'icons', className = '' }: Props) {
  const btn =
    'inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition hover:border-red-500/60 hover:bg-red-600/15 hover:text-white focus-visible:outline-2 focus-visible:outline-red-500';

  if (variant === 'icons') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <a href={STORE.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram de Twenty Seven Tech" title="Instagram" className={`${btn} h-9 w-9`}>
          <InstagramIcon className="h-4 w-4" />
        </a>
        <a href={STORE.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp de Twenty Seven Tech" title="WhatsApp" className={`${btn} h-9 w-9 hover:!border-green-500/60 hover:!bg-green-600/15`}>
          <WhatsAppIcon className="h-4 w-4" />
        </a>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <a href={STORE.instagramUrl} target="_blank" rel="noopener noreferrer" className={`${btn} w-full justify-start gap-3 rounded-xl px-4 py-2.5 text-sm`}>
        <InstagramIcon className="h-4 w-4 text-red-400" /> @{STORE.instagramUser}
      </a>
      <a href={STORE.whatsappUrl} target="_blank" rel="noopener noreferrer" className={`${btn} w-full justify-start gap-3 rounded-xl px-4 py-2.5 text-sm`}>
        <WhatsAppIcon className="h-4 w-4 text-green-400" /> {STORE.whatsappDisplay}
      </a>
      <p className="flex items-start gap-3 px-1 text-xs leading-relaxed text-gray-400">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-400" /> {STORE.address}
      </p>
    </div>
  );
}
