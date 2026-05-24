import { Lock } from 'lucide-react';

/**
 * AuthScreen — OAuth login for Google and/or Microsoft
 * Props: onGoogleLogin, onMsLogin, googleConnected, msConnected, isLoading
 */
export default function AuthScreen({ onGoogleLogin, onMsLogin, googleConnected, msConnected, isLoading }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  const MicrosoftIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022"/>
      <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00"/>
      <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF"/>
      <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900"/>
    </svg>
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1B3A5C 100%)' }}
    >
      {/* Background subtle grid */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, #fff 0px, transparent 1px, transparent 60px)'
      }} />

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Top accent line */}
        <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 rounded-t-2xl" />

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-b-2xl p-10 shadow-2xl">
          {/* Logo mark */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mb-4 shadow-lg">
              <span className="text-white text-2xl font-bold tracking-tight">MD</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {greeting}
            </h1>
            <p className="text-slate-400 mt-1 text-sm">Your Executive Assistant is ready</p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-500 uppercase tracking-widest">Connect Accounts</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google Button */}
          <button
            onClick={onGoogleLogin}
            disabled={isLoading || googleConnected}
            className="w-full flex items-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-medium px-5 py-3.5 rounded-xl border border-gray-200 transition-all duration-200 mb-3 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            <GoogleIcon />
            <span className="flex-1 text-left">
              {googleConnected ? '✓ Google Connected' : 'Continue with Google'}
            </span>
            {googleConnected && (
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-400" />
            )}
          </button>

          {/* Microsoft Button */}
          <button
            onClick={onMsLogin}
            disabled={isLoading || msConnected}
            className="w-full flex items-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-medium px-5 py-3.5 rounded-xl border border-gray-200 transition-all duration-200 mb-3 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            <MicrosoftIcon />
            <span className="flex-1 text-left">
              {msConnected ? '✓ Microsoft Connected' : 'Continue with Microsoft'}
            </span>
            {msConnected && (
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-400" />
            )}
          </button>

          {/* Helper text */}
          <p className="text-center text-slate-500 text-xs mt-4">
            Connect one or both accounts to get started
          </p>

          {/* Continue button if any connected */}
          {(googleConnected || msConnected) && (
            <button
              onClick={() => {}}
              className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg"
            >
              Open Dashboard →
            </button>
          )}

          {/* Security note */}
          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-600">
            <Lock size={12} />
            <span>Secure OAuth — we never store your credentials</span>
          </div>
        </div>
      </div>
    </div>
  );
}
