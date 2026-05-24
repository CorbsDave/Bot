import { useMemo } from 'react';

/** Google G colored SVG */
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

/** Microsoft logo SVG */
const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 21 21">
    <rect x="1" y="1" width="9" height="9" fill="#F35325"/>
    <rect x="11" y="1" width="9" height="9" fill="#81BC06"/>
    <rect x="1" y="11" width="9" height="9" fill="#05A6F0"/>
    <rect x="11" y="11" width="9" height="9" fill="#FFBA08"/>
  </svg>
);

/**
 * AuthScreen — OAuth sign-in for Google and/or Microsoft
 * @param {{ onGoogleLogin: () => void, onMsLogin: () => void, googleConnected: boolean, msConnected: boolean, isLoading: boolean }} props
 */
export default function AuthScreen({ onGoogleLogin, onMsLogin, googleConnected, msConnected, isLoading }) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1B3A5C 60%, #0D1B2A 100%)' }}
    >
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo / Heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/30 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/>
            </svg>
          </div>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-2">{greeting}</p>
          <h1 className="text-3xl font-bold text-white mb-1">MD Assistant</h1>
          <p className="text-slate-400 text-sm">Your Executive Email &amp; Calendar Assistant</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          <p className="text-center text-slate-300 text-sm mb-6">Connect one or both accounts to get started</p>

          <div className="space-y-3">
            {/* Google Button */}
            <button
              onClick={onGoogleLogin}
              disabled={isLoading}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                googleConnected
                  ? 'bg-green-500/20 border border-green-500/40 text-green-300 cursor-default'
                  : 'bg-white text-gray-800 hover:bg-gray-50 hover:shadow-lg active:scale-98 border border-gray-200'
              } disabled:opacity-60`}
            >
              <GoogleIcon />
              <span className="flex-1 text-left">
                {googleConnected ? 'Google Connected ✓' : 'Continue with Google'}
              </span>
              {isLoading && !googleConnected && (
                <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              )}
            </button>

            {/* Microsoft Button */}
            <button
              onClick={onMsLogin}
              disabled={isLoading}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                msConnected
                  ? 'bg-green-500/20 border border-green-500/40 text-green-300 cursor-default'
                  : 'bg-white text-gray-800 hover:bg-gray-50 hover:shadow-lg active:scale-98 border border-gray-200'
              } disabled:opacity-60`}
            >
              <MicrosoftIcon />
              <span className="flex-1 text-left">
                {msConnected ? 'Microsoft Connected ✓' : 'Continue with Microsoft'}
              </span>
              {isLoading && !msConnected && (
                <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              )}
            </button>
          </div>

          {/* Continue if already connected */}
          {(googleConnected || msConnected) && (
            <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-center">
              <p className="text-cyan-300 text-xs">
                {googleConnected && msConnected
                  ? 'Both accounts connected — loading your dashboard...'
                  : 'Account connected — you can also add the other provider'}
              </p>
            </div>
          )}

          {/* Security note */}
          <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Secure OAuth — we never store your credentials</span>
          </div>
        </div>
      </div>
    </div>
  );
}
