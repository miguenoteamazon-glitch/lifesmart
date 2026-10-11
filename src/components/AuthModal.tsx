import React, { useState, useMemo } from 'react';
import { 
  auth, 
  googleProvider, 
  browserPopupRedirectResolver,
  signInWithPopup, 
  signInWithRedirect,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  setGmailAccessToken,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  db
} from '../lib/firebase';
import { setGoogleCalendarToken } from '../lib/googleCalendar';
import { doc, setDoc } from 'firebase/firestore';
import { X, Mail, Lock, User as UserIcon, Sparkles, LogIn, UserPlus, AlertCircle, ArrowRight, ExternalLink, Tablet, RefreshCw, KeyRound, Check } from 'lucide-react';
import { APP_LOGO } from '../data/initialData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'register' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [technicalDetails, setTechnicalDetails] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  // Detect tablet / mobile and iframe environment
  const isInIframe = useMemo(() => {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch {
      return true;
    }
  }, []);

  const isTabletOrMobile = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isTouch = navigator.maxTouchPoints && navigator.maxTouchPoints > 1;
    return /iPad|Tablet|Android|iPhone|iPod|Mobile/i.test(ua) || Boolean(isTouch);
  }, []);

  if (!isOpen) return null;

  const handleOpenInNewTab = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    }
  };

  const saveUserProfile = async (uid: string, displayName: string, userEmail: string, photoURL?: string) => {
    try {
      await setDoc(doc(db, 'users', uid), {
        uid,
        displayName,
        email: userEmail,
        photoURL: photoURL || '',
        createdAt: new Date().toISOString(),
      }, { merge: true });
    } catch (e) {
      console.error('Error saving user document:', e);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTechnicalDetails(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) {
          setError('Por favor ingresa tu nombre completo.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden.');
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await saveUserProfile(userCredential.user.uid, name, userCredential.user.email || email);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      onClose();
    } catch (err: any) {
      console.error('Auth error:', err);
      const code = err?.code || '';
      setTechnicalDetails(code ? `Código: ${code}` : (err?.message || null));
      let msg = 'Ocurrió un error en la autenticación.';
      if (code === 'auth/operation-not-allowed') {
        msg = 'El inicio de sesión con correo y contraseña no está habilitado en Firebase para este proyecto. Por favor, usa el botón "Continuar con Google" arriba.';
      } else if (code === 'auth/email-already-in-use') {
        msg = 'El correo ya está registrado. Cambia a "Iniciar Sesión" con tu contraseña.';
      } else if (code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        msg = 'Correo o contraseña incorrectos. Verifica tus datos o crea una cuenta si eres nuevo.';
      } else if (code === 'auth/invalid-email') {
        msg = 'El formato del correo no es válido.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (useRedirect = false) => {
    setError(null);
    setTechnicalDetails(null);
    setLoading(true);
    try {
      if (useRedirect) {
        // In an iframe (like AI Studio preview), Google OAuth redirect is rejected by browser frame security.
        // Opening in a new standalone tab ensures Google OAuth works 100% on tablets.
        if (isInIframe) {
          handleOpenInNewTab();
          setLoading(false);
          return;
        }
        await signInWithRedirect(auth, googleProvider, browserPopupRedirectResolver);
        return;
      }

      const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleCalendarToken(credential.accessToken, result.user?.email || undefined, result.user?.uid || undefined);
        setGmailAccessToken(credential.accessToken);
      }
      const user = result.user;
      await saveUserProfile(user.uid, user.displayName || 'Usuario', user.email || '', user.photoURL || '');
      onClose();
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      const errCode = err?.code || '';
      const errMsg = err?.message || '';
      const combined = `${errCode} ${errMsg}`.toLowerCase();
      setTechnicalDetails(`${errCode}${errMsg ? ` — ${errMsg}` : ''}`);
      
      if (combined.includes('database is closing') || combined.includes('database is hidden') || combined.includes('indexeddb') || combined.includes('closing')) {
        setError('El navegador de tu tablet suspendió la conexión al abrir la ventana emergente ("database is closing/hidden"). Pulsa abajo "Abrir en Pestaña Completa" o usa la app sin cuenta.');
      } else if (errCode === 'auth/popup-closed-by-user') {
        setError('Cerraste la ventana emergente de Google antes de completar la autorización.');
      } else if (errCode === 'auth/unauthorized-domain') {
        setError('El dominio actual (*.run.app) no está registrado en los dominios autorizados de Google en Firebase.');
      } else if (errCode === 'auth/popup-blocked') {
        setError('El navegador de tu tablet bloqueó la ventana emergente. Prueba el botón de redirección completa abajo.');
      } else if (errCode === 'auth/network-request-failed') {
        setError('Fallo de conexión o bloqueo de cookies de terceros en el navegador.');
      } else if (errCode === 'auth/account-exists-with-different-credential') {
        setError('Ya existe una cuenta con este correo mediante contraseña. Ingresa usando tu contraseña.');
      } else {
        setError(`No se pudo completar el inicio de sesión con Google en esta ventana emergente (${errMsg || errCode || 'error de conexión'}).`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError('Escribe tu correo en el campo de abajo para enviarte el enlace de restablecimiento.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError('No se pudo enviar el correo de restablecimiento. Verifica que la dirección esté bien escrita.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#131b2e] border border-[#2d3449] rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Top Decorative Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#00f2ff] via-[#38ef7d] to-[#a78bfa]" />
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-900/50 hover:bg-slate-800 transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Header Branding */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl overflow-hidden border border-[#00f2ff]/50 shadow-xl shadow-[#00f2ff]/25 bg-[#0b1326] p-1 flex items-center justify-center">
              <img src={APP_LOGO} alt="LifeBlocks" referrerPolicy="no-referrer" className="w-full h-full object-cover rounded-xl" />
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight">
              {mode === 'register' ? 'Crear tu Cuenta en LifeBlocks' : 'Bienvenido de Nuevo'}
            </h2>
            <p className="text-xs text-slate-400">
              {mode === 'register'
                ? 'Sincroniza tus bloques de vida, metas y hábitos en la nube'
                : 'Accede a tus bloques de vida personales y métricas de avance'}
            </p>
          </div>

          {/* Tablet Guidance Note */}
          {(isTabletOrMobile || isInIframe) && (
            <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl text-[11px] text-cyan-200/90 flex items-start space-x-2.5">
              <Tablet className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="leading-snug">
                  <strong className="text-cyan-300 font-bold">Consejo para tablets:</strong> Si tu navegador bloquea la ventana emergente de Google, permite los pop-ups o abre la app en ventana completa.
                </p>
                {isInIframe && (
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="inline-flex items-center space-x-1 text-cyan-300 hover:text-white font-mono font-semibold underline text-[10px] cursor-pointer pt-0.5"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Abrir aplicación en pestaña nueva</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Password Reset Confirmation */}
          {resetSent && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/35 rounded-2xl text-emerald-200 text-xs flex items-start space-x-2.5 animate-in fade-in">
              <Check className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">¡Correo de recuperación enviado!</p>
                <p className="text-emerald-300/80 text-[11px]">Revisa tu bandeja de entrada o carpeta de spam para restablecer tu contraseña.</p>
              </div>
            </div>
          )}

          {/* Error Banner with Explicit Resolution Options */}
          {error && (
            <div className="p-3.5 bg-red-500/15 border border-red-500/35 rounded-2xl text-red-200 text-xs space-y-2.5 animate-in fade-in">
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="leading-relaxed font-medium">{error}</p>
                  {technicalDetails && (
                    <p className="font-mono text-[10px] text-red-300/75 bg-red-950/60 px-2 py-1 rounded-md border border-red-500/20 break-all">
                      {technicalDetails}
                    </p>
                  )}
                </div>
              </div>

              {/* Actionable Fallback Buttons */}
              <div className="pl-6 pt-1 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn(true)}
                  disabled={loading}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-200 border border-cyan-500/40 rounded-xl text-[11px] font-semibold transition-all cursor-pointer shadow-sm"
                >
                  <RefreshCw className="w-3 h-3 text-cyan-400" />
                  <span>Probar con Redirección Completa</span>
                </button>

                {isInIframe && (
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-200 border border-emerald-500/40 rounded-xl text-[11px] font-semibold transition-all cursor-pointer shadow-sm"
                  >
                    <ExternalLink className="w-3 h-3 text-emerald-400" />
                    <span>Abrir en Pestaña Nueva</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Main Cloud Sign-in: Google */}
          <div className="space-y-3 bg-[#0b1326] p-4 rounded-2xl border border-[#2d3449]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-cyan-300 font-bold flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Acceso Oficial con Google</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Recomendado
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              En este proyecto, la sincronización segura en la nube (Firestore, Google Calendar y métricas) está configurada a través de tu cuenta de Google.
            </p>

            <button
              type="button"
              onClick={() => handleGoogleSignIn(false)}
              disabled={loading}
              className="w-full min-h-[48px] py-3 px-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 hover:brightness-110 active:brightness-95 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2.5 cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="bg-white p-1 rounded-full shrink-0">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
              )}
              <span>{loading ? 'Conectando con Google...' : 'Continuar con Google'}</span>
            </button>

            {/* Tablet options */}
            <div className="pt-1 flex flex-col space-y-1.5">
              <button
                type="button"
                onClick={() => handleGoogleSignIn(true)}
                disabled={loading}
                className="w-full py-2 px-3 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 rounded-lg text-[11px] font-mono font-medium transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 text-cyan-400" />
                <span>¿En tablet? Iniciar por Redirección Directa (Sin ventanas emergentes)</span>
              </button>

              {isInIframe && (
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  className="w-full py-2 px-3 bg-slate-900/90 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-mono font-medium transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                  <span>Abrir en Pestaña Completa (Requerido si el navegador bloquea Google)</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Offline / Local Access */}
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-200">¿Deseas usar la app ya mismo en tu tablet?</p>
              <p className="text-[10px] text-slate-400">Puedes usar todas las funciones en modo local sin iniciar sesión.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs font-semibold rounded-lg border border-cyan-500/30 transition-all cursor-pointer shrink-0 ml-2"
            >
              Usar sin Cuenta
            </button>
          </div>

          {/* Secondary Collapsible / Email-Password Option */}
          <div className="pt-2 border-t border-[#2d3449]">
            <details className="group">
              <summary className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer font-mono flex items-center justify-between list-none select-none py-1">
                <span>¿Tienes usuario y contraseña? (Acceso alternativo)</span>
                <span className="text-cyan-400 group-open:rotate-180 transition-transform text-xs">▼</span>
              </summary>

              <div className="pt-3 space-y-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[10px] text-amber-200/90">
                  <strong>Nota técnica:</strong> En este proyecto de Firebase, el proveedor habilitado por defecto es Google OAuth. Si intentas registrarte con contraseña y tu proyecto no tiene activado "Email/Password" en Firebase Console, verás <em>auth/operation-not-allowed</em>. Te recomendamos usar el botón de Google arriba.
                </div>

                {/* Tab Switcher */}
                <div className="grid grid-cols-2 p-1 bg-[#0b1326] rounded-xl border border-[#2d3449] text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(null); setTechnicalDetails(null); setResetSent(false); }}
                    className={`py-1.5 rounded-lg font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                      mode === 'register'
                        ? 'bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-[#00363a] shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Registro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null); setTechnicalDetails(null); setResetSent(false); }}
                    className={`py-1.5 rounded-lg font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                      mode === 'login'
                        ? 'bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-[#00363a] shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Iniciar Sesión</span>
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleEmailAuth} className="space-y-3">
                  {mode === 'register' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                        Nombre Completo
                      </label>
                      <div className="relative">
                        <UserIcon className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ej. Miguel Patiño"
                          className="w-full pl-8 pr-3 py-2 bg-[#0b1326] border border-[#2d3449] focus:border-[#00f2ff] rounded-lg text-slate-100 placeholder-slate-500 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="miguelpatino0@gmail.com"
                        className="w-full pl-8 pr-3 py-2 bg-[#0b1326] border border-[#2d3449] focus:border-[#00f2ff] rounded-lg text-slate-100 placeholder-slate-500 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                        Contraseña
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={handlePasswordReset}
                          disabled={loading}
                          className="text-[9px] text-cyan-300 hover:text-cyan-200 font-mono underline cursor-pointer"
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-8 pr-3 py-2 bg-[#0b1326] border border-[#2d3449] focus:border-[#00f2ff] rounded-lg text-slate-100 placeholder-slate-500 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {mode === 'register' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                        Confirmar Contraseña
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-8 pr-3 py-2 bg-[#0b1326] border border-[#2d3449] focus:border-[#00f2ff] rounded-lg text-slate-100 placeholder-slate-500 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-[#1f293d] hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg border border-slate-600 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>{loading ? 'Procesando...' : mode === 'register' ? 'Registrar con Correo' : 'Ingresar con Correo'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </details>
          </div>

          {/* Guest fallback link */}
          <div className="text-center">
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-cyan-300 underline font-mono cursor-pointer"
            >
              Continuar como invitado por ahora
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
