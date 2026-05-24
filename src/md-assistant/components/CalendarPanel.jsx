import { useState } from 'react';
import { format, parseISO, isToday, isTomorrow, addDays, startOfDay } from 'date-fns';
import { Clock, MapPin, Users, Sparkles, X } from 'lucide-react';
import { getMeetingPrep } from '../api/assistantApi.js';

function formatTime(dt) {
  try {
    const d = typeof dt === 'string' ? parseISO(dt) : new Date(dt);
    return format(d, 'HH:mm');
  } catch {
    return '';
  }
}

function getDayLabel(date) {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEEE, MMMM d');
}

/**
 * CalendarPanel — 7-day event view with meeting prep
 * @param {{ events: Array, googleToken: string|null, msToken: string|null }} props
 */
export default function CalendarPanel({ events }) {
  const [prepTarget, setPrepTarget] = useState(null);
  const [prep, setPrep] = useState('');
  const [loadingPrep, setLoadingPrep] = useState(false);

  // Group events by day
  const days = Array.from({ length: 7 }, (_, i) => addDays(startOfDay(new Date()), i));

  const grouped = days.map((day) => ({
    day,
    events: events.filter((e) => {
      try {
        const dt = e.startTime || e.start;
        const d = typeof dt === 'string' ? parseISO(dt) : new Date(dt);
        return startOfDay(d).getTime() === day.getTime();
      } catch {
        return false;
      }
    }),
  }));

  async function handleMeetingPrep(event) {
    setPrepTarget(event);
    setLoadingPrep(true);
    setPrep('');
    try {
      const text = await getMeetingPrep(event);
      setPrep(text);
    } catch (err) {
      setPrep('Error: ' + err.message);
    } finally {
      setLoadingPrep(false);
    }
  }

  return (
    <div className="flex flex-1 min-h-0 gap-0">
      {/* Calendar days */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {grouped.map(({ day, events: dayEvents }) => (
          <div key={day.toISOString()} className="bg-white rounded-xl border border-gray-100 shadow-sm">
            {/* Day header */}
            <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 rounded-t-xl ${
              isToday(day) ? 'bg-navy' : ''
            }`}>
              <div className={`flex flex-col items-center w-10 h-10 rounded-lg ${
                isToday(day) ? 'bg-cyan-400/20' : 'bg-slate-100'
              } justify-center shrink-0`}>
                <span className={`text-lg font-bold leading-none ${isToday(day) ? 'text-white' : 'text-slate-700'}`}>
                  {format(day, 'd')}
                </span>
                <span className={`text-[9px] uppercase tracking-wide ${isToday(day) ? 'text-cyan-300' : 'text-slate-400'}`}>
                  {format(day, 'EEE')}
                </span>
              </div>
              <div>
                <p className={`text-sm font-semibold ${isToday(day) ? 'text-white' : 'text-slate-700'}`}>
                  {getDayLabel(day)}
                </p>
                <p className={`text-xs ${isToday(day) ? 'text-slate-300' : 'text-slate-400'}`}>
                  {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Events for this day */}
            {dayEvents.length === 0 ? (
              <p className="px-4 py-4 text-xs text-slate-300 text-center">No events</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors group border-l-2 ${
                      event.provider === 'outlook' ? 'border-purple-300' : 'border-blue-300'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(event.startTime || event.start)}</span>
                        {(event.endTime || event.end) && (
                          <span className="text-slate-300">–{formatTime(event.endTime || event.end)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {event.title || event.subject}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {event.location && (
                          <span className="flex items-center gap-1 text-xs text-slate-400 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {event.location}
                          </span>
                        )}
                        {event.attendees?.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                            <Users className="w-3 h-3" />
                            {event.attendees.length}
                          </span>
                        )}
                        <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          event.provider === 'outlook' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {event.provider === 'outlook' ? 'Outlook' : 'Google'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleMeetingPrep(event)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs font-semibold text-navy hover:text-cyan-600 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Prep
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Meeting prep slide-out */}
      {prepTarget && (
        <div className="w-80 shrink-0 border-l border-gray-100 bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Meeting Prep</p>
              <p className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">
                {prepTarget.title || prepTarget.subject}
              </p>
            </div>
            <button
              onClick={() => { setPrepTarget(null); setPrep(''); }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loadingPrep ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                <span className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                Generating prep brief...
              </div>
            ) : (
              <div className="prose prose-sm max-w-none text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {prep}
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => handleMeetingPrep(prepTarget)}
              disabled={loadingPrep}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-steel transition-colors disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Regenerate Brief
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
