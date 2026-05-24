import { useState } from 'react';
import { format, parseISO, isToday } from 'date-fns';
import { Mail, AlertTriangle, CalendarDays, Sparkles, Clock, X } from 'lucide-react';
import { getDailyBriefing } from '../api/assistantApi.js';

const PRIORITY_COLORS = {
  P1: 'bg-red-100 text-red-700 border-red-200',
  P2: 'bg-amber-100 text-amber-700 border-amber-200',
  P3: 'bg-green-100 text-green-700 border-green-200',
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border bg-white shadow-sm ${color}`}>
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-current/10">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs font-medium opacity-70 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/**
 * Dashboard — executive overview
 * @param {{ emails: Array, calendarEvents: Array, onEmailClick: (email) => void, onEventClick: (event) => void }} props
 */
export default function Dashboard({ emails, calendarEvents, onEmailClick }) {
  const [briefing, setBriefing] = useState('');
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);

  const unreadCount = emails.filter((e) => e.isUnread).length;
  const p1Count = emails.filter((e) => e.triage?.priority === 'P1').length;

  const todayEvents = calendarEvents.filter((e) => {
    try {
      const dt = e.startTime || e.start;
      return isToday(typeof dt === 'string' ? parseISO(dt) : new Date(dt));
    } catch {
      return false;
    }
  });

  const p1Emails = emails.filter((e) => e.triage?.priority === 'P1').slice(0, 5);

  async function handleBriefing() {
    setLoadingBriefing(true);
    setShowBriefing(true);
    try {
      const text = await getDailyBriefing(emails, calendarEvents);
      setBriefing(text);
    } catch (err) {
      setBriefing('Error generating briefing: ' + err.message);
    } finally {
      setLoadingBriefing(false);
    }
  }

  function formatEventTime(event) {
    try {
      const dt = event.startTime || event.start;
      return format(typeof dt === 'string' ? parseISO(dt) : new Date(dt), 'HH:mm');
    } catch {
      return '';
    }
  }

  function formatEmailTime(email) {
    try {
      return format(new Date(email.date), 'HH:mm');
    } catch {
      return '';
    }
  }

  function extractName(from) {
    const match = from?.match(/^(.+?)\s*</);
    return match ? match[1].trim() : from || 'Unknown';
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center gap-4 p-4 rounded-xl border bg-white shadow-sm border-blue-100">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-700">{unreadCount}</p>
            <p className="text-xs font-medium text-blue-500 mt-0.5">Unread Emails</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl border bg-white shadow-sm border-red-100">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-50">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-700">{p1Count}</p>
            <p className="text-xs font-medium text-red-500 mt-0.5">P1 Urgent</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl border bg-white shadow-sm border-emerald-100">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50">
            <CalendarDays className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-700">{todayEvents.length}</p>
            <p className="text-xs font-medium text-emerald-500 mt-0.5">Meetings Today</p>
          </div>
        </div>
      </div>

      {/* AI Briefing */}
      <div className="mb-6">
        <button
          onClick={handleBriefing}
          disabled={loadingBriefing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-medium hover:bg-steel transition-colors disabled:opacity-60 shadow-sm"
        >
          <Sparkles className={`w-4 h-4 ${loadingBriefing ? 'animate-pulse' : ''}`} />
          {loadingBriefing ? 'Generating briefing...' : 'Get AI Briefing'}
        </button>

        {showBriefing && (
          <div className="mt-3 p-4 bg-navy/5 border border-navy/10 rounded-xl relative">
            <button
              onClick={() => setShowBriefing(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
            {loadingBriefing ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                Generating your morning briefing...
              </div>
            ) : (
              <div className="prose prose-sm max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                {briefing}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Meetings */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-gray-800 text-sm">Today's Meetings</h2>
            <span className="ml-auto text-xs text-slate-400">{todayEvents.length} events</span>
          </div>
          <div className="divide-y divide-gray-50">
            {todayEvents.length === 0 ? (
              <p className="px-4 py-6 text-center text-slate-400 text-sm">No meetings scheduled today</p>
            ) : (
              todayEvents.map((event) => (
                <div key={event.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 shrink-0 w-12">
                      <Clock className="w-3 h-3" />
                      {formatEventTime(event)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {event.title || event.subject}
                      </p>
                      {event.attendees?.length > 0 && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                        </p>
                      )}
                      {event.location && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{event.location}</p>
                      )}
                    </div>
                    <span className={`shrink-0 ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      event.provider === 'outlook' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {event.provider === 'outlook' ? 'Outlook' : 'Google'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* P1 Emails */}
        <div className="bg-white rounded-xl border border-red-100 shadow-sm">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-red-50">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="font-semibold text-gray-800 text-sm">P1 — Critical Emails</h2>
            <span className="ml-auto text-xs text-red-400">{p1Emails.length} urgent</span>
          </div>
          <div className="divide-y divide-gray-50">
            {p1Emails.length === 0 ? (
              <p className="px-4 py-6 text-center text-slate-400 text-sm">
                No P1 emails — clear inbox!
              </p>
            ) : (
              p1Emails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => onEmailClick(email)}
                  className="w-full text-left px-4 py-3 hover:bg-red-50/50 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5 inline-block w-2 h-2 rounded-full bg-red-500" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {extractName(email.from)}
                        </p>
                        <span className="shrink-0 text-xs text-slate-400">{formatEmailTime(email)}</span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{email.subject}</p>
                      {email.triage?.summary && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{email.triage.summary}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
