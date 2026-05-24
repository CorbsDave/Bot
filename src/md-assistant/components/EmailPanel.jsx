import { useState } from 'react';
import { format } from 'date-fns';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';

const PRIORITY_CONFIG = {
  P1: { label: '🔴 P1', bg: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  P2: { label: '🟡 P2', bg: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  P3: { label: '🟢 P3', bg: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
};

const TABS = ['All', 'P1', 'P2', 'P3'];

function formatEmailDate(dateStr) {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday ? format(d, 'HH:mm') : format(d, 'MMM d');
  } catch {
    return '';
  }
}

function extractName(from) {
  if (!from) return 'Unknown';
  const match = from.match(/^(.+?)\s*</);
  return match ? match[1].trim() : from;
}

/**
 * Email panel — list with triage filters
 * @param {{ emails: Array, selectedEmail: object|null, onSelectEmail: (e) => void, onTriageAll: () => void, isFetching: boolean }} props
 */
export default function EmailPanel({ emails, selectedEmail, onSelectEmail, onTriageAll, isFetching }) {
  const [activeTab, setActiveTab] = useState('All');

  const filtered = activeTab === 'All'
    ? emails
    : emails.filter((e) => e.triage?.priority === activeTab);

  const untriagedCount = emails.filter((e) => !e.triage).length;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
        <div className="flex gap-1 flex-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-navy text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {tab === 'All' ? `All (${emails.length})` : tab}
            </button>
          ))}
        </div>

        {untriagedCount > 0 && (
          <button
            onClick={onTriageAll}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-semibold hover:bg-amber-200 transition-colors disabled:opacity-60"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Triage All with AI ({untriagedCount})
          </button>
        )}

        {isFetching && (
          <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
        )}
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
            <RefreshCw className="w-6 h-6 opacity-40" />
            <p className="text-sm">
              {isFetching ? 'Loading emails...' : `No ${activeTab !== 'All' ? activeTab + ' ' : ''}emails`}
            </p>
          </div>
        ) : (
          filtered.map((email) => {
            const isSelected = selectedEmail?.id === email.id;
            const priority = email.triage?.priority;
            const pc = priority ? PRIORITY_CONFIG[priority] : null;

            return (
              <button
                key={email.id}
                onClick={() => onSelectEmail(email)}
                className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                  isSelected ? 'bg-cyan-50 border-l-2 border-cyan-400' : ''
                } ${email.isUnread ? 'bg-white' : 'bg-gray-50/50'}`}
              >
                <div className="flex items-start gap-3">
                  {/* Unread dot */}
                  <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${email.isUnread ? 'bg-cyan-500' : 'bg-transparent'}`} />

                  <div className="flex-1 min-w-0">
                    {/* Row 1: sender + time */}
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm ${email.isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'} truncate flex-1`}>
                        {extractName(email.from)}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">{formatEmailDate(email.date)}</span>
                    </div>

                    {/* Row 2: subject */}
                    <p className={`text-xs truncate ${email.isUnread ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                      {email.subject}
                    </p>

                    {/* Row 3: AI summary + badges */}
                    <div className="flex items-center gap-2 mt-1">
                      {pc && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${pc.bg}`}>
                          {pc.label}
                        </span>
                      )}
                      <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        email.provider === 'gmail'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-purple-50 text-purple-600'
                      }`}>
                        {email.provider === 'gmail' ? 'Gmail' : 'Outlook'}
                      </span>
                      {email.triage?.summary && (
                        <p className="text-[11px] text-slate-400 truncate flex-1">{email.triage.summary}</p>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
