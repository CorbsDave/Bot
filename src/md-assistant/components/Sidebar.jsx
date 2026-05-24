import { LayoutDashboard, Inbox, Calendar, MessageSquare, Briefcase } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'email', label: 'Inbox', icon: Inbox },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'ai', label: 'AI Assistant', icon: MessageSquare },
];

/**
 * Sidebar navigation
 * @param {{ activeView: string, onNav: (view: string) => void, emailCount: number, p1Count: number, googleConnected: boolean, msConnected: boolean }} props
 */
export default function Sidebar({ activeView, onNav, emailCount = 0, p1Count = 0, googleConnected, msConnected }) {
  return (
    <aside className="flex flex-col w-56 min-h-screen shrink-0" style={{ background: '#0D1B2A', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-400/20">
          <Briefcase className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">MD Assistant</p>
          <p className="text-slate-500 text-xs">Executive Suite</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span className="flex-1 text-left">{label}</span>

              {/* Badges */}
              {id === 'email' && emailCount > 0 && (
                <span className="flex items-center gap-1">
                  {p1Count > 0 && (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
                      {p1Count > 9 ? '9+' : p1Count}
                    </span>
                  )}
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-slate-600 text-slate-200 text-[10px] font-semibold">
                    {emailCount > 99 ? '99+' : emailCount}
                  </span>
                </span>
              )}

              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-400 rounded-r" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Connected accounts */}
      <div className="px-4 py-4 border-t border-white/5">
        <p className="text-slate-600 text-xs font-medium uppercase tracking-wider mb-2">Connected</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${googleConnected ? 'bg-green-400' : 'bg-slate-600'}`} />
            <span className="text-xs text-slate-500">
              Google {googleConnected ? '(active)' : '(not connected)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${msConnected ? 'bg-green-400' : 'bg-slate-600'}`} />
            <span className="text-xs text-slate-500">
              Microsoft {msConnected ? '(active)' : '(not connected)'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
