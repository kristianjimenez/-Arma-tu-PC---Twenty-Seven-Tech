import { useState } from 'react';
import { Lock, Mail, User, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import logo from '../../imports/twenty_seven_tech_logo.png';
import { loginUser, registerUser, passwordStrength, type Session } from '../lib/auth';
import { STORE } from '../data/store-info';
import { SocialLinks } from './SocialLinks';

interface LoginPageProps { onLogin: (session: Session) => void; onBack: () => void }

const field =
  'w-full border border-black/30 bg-white py-3 pl-11 pr-11 text-sm text-black placeholder:text-gray-400 outline-none focus:border-[var(--t27-red)]';
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = passwordStrength(password);
  const isRegister = mode === 'register';

  const switchMode = (m: 'login' | 'register') => { setMode(m); setError(''); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isRegister && name.trim().length < 2) return setError('Escribe tu nombre.');
    if (!emailOk(email)) return setError('Ingresa un correo válido.');
    if (isRegister && password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (isRegister && password !== confirm) return setError('Las contraseñas no coinciden.');
    if (!password) return setError('Ingresa tu contraseña.');

    setLoading(true);
    try {
      const session = isRegister ? await registerUser(name, email, password) : await loginUser(email, password);
      onLogin(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between bg-black p-12 lg:flex">
        <img src={logo} alt={STORE.name} className="w-56" />
        <div>
          <h1 className="font-display text-6xl">Guarda tus equipos y retómalos cuando quieras</h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-gray-400">Con tu cuenta conservas tus builds, los comparas y los envías a la tienda en un clic. No necesitas cuenta para armar y pedir.</p>
        </div>
        <div>
          <div className="stripes stripes-red mb-5 w-40" aria-hidden />
          <SocialLinks variant="full" className="max-w-sm" />
        </div>
      </aside>

      <main className="flex items-center justify-center bg-[var(--t27-paper)] px-5 py-10 text-black">
        <div className="w-full max-w-md">
          <button onClick={onBack} className="mb-8 flex items-center gap-2 text-sm text-gray-600 hover:text-black"><ArrowLeft className="h-4 w-4" /> Volver a la tienda</button>
          <img src={logo} alt={STORE.name} className="mb-6 w-40 rounded bg-black p-2 lg:hidden" />

          <h2 className="font-display text-5xl">{isRegister ? 'Crea tu cuenta' : 'Ingresa a tu cuenta'}</h2>
          <p className="mt-2 text-sm text-gray-600">{isRegister ? 'Toma menos de un minuto.' : 'Para ver tus builds guardados.'}</p>

          <div role="tablist" className="mt-6 grid grid-cols-2 border border-black">
            {(['login', 'register'] as const).map((m) => (
              <button key={m} role="tab" aria-selected={mode === m} onClick={() => switchMode(m)}
                className={`py-2.5 text-sm font-medium transition ${mode === m ? 'bg-black text-white' : 'hover:bg-black/5'}`}>
                {m === 'login' ? 'Ya tengo cuenta' : 'Soy nuevo'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} noValidate className="mt-6 space-y-4">
            {isRegister && (
              <label className="block"><span className="mb-1.5 block text-sm">Nombre completo</span>
                <div className="relative"><User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input className={field} autoComplete="name" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} /></div></label>
            )}
            <label className="block"><span className="mb-1.5 block text-sm">Correo electrónico</span>
              <div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input className={field} type="email" autoComplete="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div></label>
            <label className="block"><span className="mb-1.5 block text-sm">Contraseña</span>
              <div className="relative"><Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input className={field} type={show ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder={isRegister ? 'Mínimo 8 caracteres' : 'Tu contraseña'} value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
              {isRegister && password && (
                <div className="mt-2"><div className="flex gap-1">{[1, 2, 3, 4].map((i) => <span key={i} className={`h-1 flex-1 ${i <= strength.score ? (strength.score <= 1 ? 'bg-[var(--t27-red)]' : strength.score === 2 ? 'bg-amber-500' : 'bg-green-600') : 'bg-black/15'}`} />)}</div>
                  <p className="mt-1 text-xs text-gray-600">Seguridad: {strength.label}</p></div>
              )}
            </label>
            {isRegister && (
              <label className="block"><span className="mb-1.5 block text-sm">Repite la contraseña</span>
                <div className="relative"><Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input className={field} type={show ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div></label>
            )}
            {error && <p role="alert" className="border-l-4 border-[var(--t27-red)] bg-[var(--t27-red)]/10 px-3 py-2 text-sm text-[var(--t27-red-dark)]">{error}</p>}
            <button type="submit" disabled={loading} className="cut flex h-12 w-full items-center justify-center gap-2 bg-[var(--t27-red)] font-semibold text-white transition hover:bg-red-500 disabled:opacity-60">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : isRegister ? 'Crear mi cuenta' : 'Ingresar'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
