import { useState } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Sparkles, Reply, Copy, Send, X } from 'lucide-react';
import { draftReply, triageEmail } from '../api/assistantApi.js';

const PRIORITY_CONFIG = {
  P1: { label: '🔴 P1 Critical', bg: 'bg-red-100 text-red-700 border border-red-200' },
  P2: { label: '🟡 P2 Today', bg: 'bg-amber-100 text-amber-700 border border-amber-200' },
  P3: { label: '🟢 P3 FYI', bg: 'bg-green-100 text-green-700 border border-green-200' },
};

function formatDate(dateStr) {
  try {
    return format(new Date(dateStr), 'EEEE, MMMM d, yyyy · HH:mm');
  } catch {
    return dateStr || '';
  }
}

/**
 * Email detail view
 * @param {{ email: object, onBack: () => void, googleToken: string|null, msToken: string|null }} props
 */
export default function EmailDetail({ email, onBack }) {
  const [summary, setSummary] = useState(email.triage?.summary || '');
  const [draft, setDraft] = useState('');
  const [instruction, setInstruction] = useState('');
  const [showReply, setShowReply] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [copied, setCopied] = useState(false);

  const priority = email.triage?.priority;
  const pc = priority ? PRIORITY_CONFIG[priority] : null;

  async function handleSummarize() {
    setLoadingSummary(true);
    try {
      const triage = await triageEmail(email);
      setSummary(triage.summary);
    } catch (err) {
      setSummary('Error: ' + err.message);
    } finally {
      setLoadingSummary(false);
    }
  }

  async function handleDraftReply() {
    setShowReply(true);
    setLoadingDraft(true);
    try {
      const text = await draftReply(email, instruction);
      setDraft(text);
    } catch (err) {
      setDraft('Error generating draft: ' + err.message);
    } finally {
      setLoadingDraft(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Sanitize HTML body for display
  const bodyIsHtml = email.body?.trim().startsWith('<');

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        {pc && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${pc.bg}`}>{pc.label}</span>
        )}
        {email.triage?.suggestedAction && (
          <span className="text-xs text-slate-500 italic">{email.triage.suggestedAction}</span>
        )}
      </div>

      {/* Email meta */}
      <div className="px-5 py-4 border-b border-gray-50 bg-slate-50/50 shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{email.subject}</h2>
        <div className="space-y-1 text-sm">
          <div className="flex gap-2">
            <span className="text-slate-400 w-8 shrink-0">From</span>
            <span className="text-gray-700 font-medium">{email.from}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-400 w-8 shrink-0">To</span>
            <span className="text-gray-600">{email.to || '—'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-400 w-8 shrink-0">Date</span>
            <span className="text-gray-600">{formatDate(email.date)}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 px-5 py-2 border-b border-gray-100 bg-white shrink-0">
        <button
          onClick={handleSummarize}
          disabled={loadingSummary}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-steel transition-colors disabled:opacity-60"
        >
          <Sparkles className={`w-3.5 h-3.5 ${loadingSummary ? 'animate-pulse' : ''}`} />
          {loadingSummary ? 'Summarizing...' : 'Summarize'}
        </button>
        <button
          onClick={() => { setShowReply(!showReply); if (!showReply && !draft) handleDraftReply(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-700 transition-colors"
        >
          <Reply className="w-3.5 h-3.5" />
          Draft Reply
        </button>
      </div>

      {/* AI Summary */}
      {summary && (
        <div className="mx-5 mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg shrink-0">
          <p className="text-xs font-semibold text-amber-700 mb-1">AI Summary</p>
          <p className="text-sm text-amber-800">{summary}</p>
        </div>
      )}

      {/* Reply composer */}
      {showReply && (
        <div className="mx-5 mt-3 border border-gray-200 rounded-xl shrink-0">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-slate-50 rounded-t-xl">
            <p className="text-xs font-semibold text-slate-600">Draft Reply</p>
            <button onClick={() => setShowReply(false)}>
              <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
            </button>
          </div>
          <div className="p-3">
            <input
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Optional: custom instruction (e.g. 'decline politely')"
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
            {loadingDraft ? (
              <div className="flex items-center gap-2 py-4 text-slate-400 text-sm">
                <span className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                Drafting reply...
              </div>
            ) : (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={6}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-400 resize-none"
                placeholder="Draft will appear here..."
              />
            )}
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleDraftReply}
                disabled={loadingDraft}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-steel transition-colors disabled:opacity-60"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Regenerate
              </button>
              <button
                onClick={handleCopy}
                disabled={!draft}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors disabled:opacity-40"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {bodyIsHtml ? (
          <div
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: email.body }}
          />
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
            {email.body || email.snippet || 'No content'}
          </pre>
        )}
      </div>
    </div>
  );
}
