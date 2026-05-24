import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';

const QUICK_PROMPTS = [
  "What's my day look like?",
  "Any urgent emails?",
  "Draft a reply to the latest P1",
  "Meeting prep for next event",
];

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center mr-2 shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-navy text-white rounded-tr-sm'
            : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-sm'
        }`}
      >
        <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
      </div>
    </div>
  );
}

/**
 * AI Assistant chat panel
 * @param {{ messages: Array, onSend: (text: string) => void, isLoading: boolean, emails: Array, calendarEvents: Array }} props
 */
export default function AiAssistant({ messages, onSend, isLoading, emails, calendarEvents }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    onSend(text);
    setInput('');
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const todayCount = calendarEvents.filter((e) => {
    try {
      return new Date(e.startTime || e.start).toDateString() === new Date().toDateString();
    } catch { return false; }
  }).length;

  return (
    <div className="flex flex-col w-72 shrink-0 border-l border-gray-100 bg-slate-50 min-h-0">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">AI Assistant</p>
            <p className="text-xs text-slate-400">
              {emails.length} emails · {todayCount} meetings today
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-navy/40" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Your Executive AI</p>
            <p className="text-xs text-slate-400">Ask anything about your emails and calendar</p>
          </div>
        ) : (
          messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)
        )}

        {isLoading && (
          <div className="flex items-start mb-3">
            <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center mr-2 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-3 pb-2 shrink-0">
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onSend(prompt)}
              disabled={isLoading}
              className="text-[11px] px-2 py-1 rounded-full bg-white border border-gray-200 text-slate-600 hover:bg-navy hover:text-white hover:border-navy transition-colors disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-3 pb-3 shrink-0">
        <div className="flex items-end gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/30 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask your AI assistant..."
            rows={1}
            className="flex-1 text-sm text-gray-700 resize-none outline-none bg-transparent placeholder-slate-400 max-h-24"
            style={{ minHeight: '22px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-navy text-white hover:bg-steel disabled:opacity-40 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
