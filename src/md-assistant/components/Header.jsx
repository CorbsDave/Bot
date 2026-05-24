import { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

/**
 * Top header bar
 * @param {{ user: object|null, onRefresh: () => void, isLoading: boolean }} props
 */
export default function Header({ user, onRefresh, isLoading }) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const today = format(new Date(), 'EEEE, MMMM d, yyyy');
  const name = user?.name || user?.displayName || user?.email || 'Director';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="flex items-center px-6 py-3 bg-white border-b border-gray-100 shadow-sm gap-4 shrink-0">
      {/* Left: greeting */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">
          {greeting},{' '}
          <span className="text-navy font-semibold">{name.split(' ')[0]}</span>
        </p>
        <p className="text-xs text-gray-400">Ready for your executive briefing</p>
      </div>

      {/* Center: date */}
      <div className="hidden md:flex flex-col items-center">
        <p className="text-sm font-medium text-gray-700">{today}</p>
      </div>

      {/* Right: refresh + avatar */}
      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh emails & calendar"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2">
          {user?.picture || user?.photo ? (
            <img
              src={user.picture || user.photo}
              alt={name}
              className="w-8 h-8 rounded-full object-cover border-2 border-slate-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
          )}
          <span className="hidden lg:block text-sm text-gray-600 max-w-[120px] truncate">{name}</span>
        </div>
      </div>
    </header>
  );
}
