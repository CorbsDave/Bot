import { useGoogleLogin } from '@react-oauth/google';
import { useMsal } from '@azure/msal-react';

import useMdStore from './store/mdStore.js';
import { GOOGLE_SCOPES } from './config/google.js';
import { MS_SCOPES } from './config/microsoft.js';

import { getGoogleUserProfile, listGmailMessages, getGmailMessage, parseGmailMessage, listCalendarEvents } from './api/googleApi.js';
import { getMsUserProfile, listOutlookMessages, parseOutlookMessage, listOutlookCalendarEvents } from './api/microsoftApi.js';
import { triageEmail, chatWithAssistant } from './api/assistantApi.js';

import AuthScreen from './components/AuthScreen.jsx';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import Dashboard from './components/Dashboard.jsx';
import EmailPanel from './components/EmailPanel.jsx';
import EmailDetail from './components/EmailDetail.jsx';
import CalendarPanel from './components/CalendarPanel.jsx';
import AiAssistant from './components/AiAssistant.jsx';

export default function MdAssistantApp() {
  const { instance: msalInstance } = useMsal();

  const {
    googleAuth, msAuth,
    emails, calendarEvents,
    activeView, selectedEmail,
    aiMessages, isLoading,
    isFetchingEmails, isFetchingCalendar,
    setGoogleAuth, setMsAuth,
    setEmails, setCalendarEvents,
    setActiveView, selectEmail,
    addAiMessage,
    setLoading, setFetchingEmails, setFetchingCalendar,
    updateEmailTriage,
  } = useMdStore();

  // ─── Google OAuth ───────────────────────────────────────────────────────────
  const googleLogin = useGoogleLogin({
    scope: GOOGLE_SCOPES,
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const token = tokenResponse.access_token;
        const user = await getGoogleUserProfile(token);
        setGoogleAuth({ token, user, connected: true });
        await loadGoogleData(token);
      } catch (err) {
        console.error('Google login error:', err);
      } finally {
        setLoading(false);
      }
    },
    onError: (err) => console.error('Google OAuth error:', err),
  });

  // ─── Microsoft OAuth ─────────────────────────────────────────────────────────
  async function msLogin() {
    setLoading(true);
    try {
      const result = await msalInstance.loginPopup({ scopes: MS_SCOPES });
      const token = result.accessToken;
      const user = await getMsUserProfile(token);
      setMsAuth({ token, user, connected: true });
      await loadMsData(token);
    } catch (err) {
      console.error('Microsoft login error:', err);
    } finally {
      setLoading(false);
    }
  }

  // ─── Load Google data ────────────────────────────────────────────────────────
  async function loadGoogleData(token) {
    try {
      setFetchingEmails(true);
      const msgList = await listGmailMessages(token, 'in:inbox', 30);
      const rawMsgs = await Promise.allSettled(
        msgList.slice(0, 20).map((m) => getGmailMessage(token, m.id))
      );
      const parsed = rawMsgs
        .filter((r) => r.status === 'fulfilled')
        .map((r) => parseGmailMessage(r.value));
      setEmails(mergeEmails(useMdStore.getState().emails, parsed));
    } catch (err) {
      console.error('Google emails error:', err);
    } finally {
      setFetchingEmails(false);
    }

    try {
      setFetchingCalendar(true);
      const events = await listCalendarEvents(token, 7);
      const normalized = events.map((e) => ({
        id: e.id,
        provider: 'google',
        title: e.summary || '(no title)',
        startTime: e.start?.dateTime || e.start?.date,
        endTime: e.end?.dateTime || e.end?.date,
        location: e.location || '',
        description: e.description || '',
        attendees: (e.attendees || []).map((a) => a.email || a.displayName).filter(Boolean),
      }));
      setCalendarEvents(mergeEvents(useMdStore.getState().calendarEvents, normalized));
    } catch (err) {
      console.error('Google calendar error:', err);
    } finally {
      setFetchingCalendar(false);
    }
  }

  // ─── Load Microsoft data ─────────────────────────────────────────────────────
  async function loadMsData(token) {
    try {
      setFetchingEmails(true);
      const msgs = await listOutlookMessages(token, 30);
      const parsed = msgs.map(parseOutlookMessage);
      setEmails(mergeEmails(useMdStore.getState().emails, parsed));
    } catch (err) {
      console.error('MS emails error:', err);
    } finally {
      setFetchingEmails(false);
    }

    try {
      setFetchingCalendar(true);
      const events = await listOutlookCalendarEvents(token, 7);
      const normalized = events.map((e) => ({
        id: e.id,
        provider: 'outlook',
        title: e.subject || '(no title)',
        startTime: e.start?.dateTime,
        endTime: e.end?.dateTime,
        location: e.location?.displayName || '',
        description: e.bodyPreview || '',
        attendees: (e.attendees || []).map((a) => a.emailAddress?.address || '').filter(Boolean),
      }));
      setCalendarEvents(mergeEvents(useMdStore.getState().calendarEvents, normalized));
    } catch (err) {
      console.error('MS calendar error:', err);
    } finally {
      setFetchingCalendar(false);
    }
  }

  // ─── Merge helpers ────────────────────────────────────────────────────────────
  function mergeEmails(existing, incoming) {
    const map = new Map(existing.map((e) => [e.id, e]));
    incoming.forEach((e) => { if (!map.has(e.id)) map.set(e.id, e); });
    return Array.from(map.values());
  }

  function mergeEvents(existing, incoming) {
    const map = new Map(existing.map((e) => [e.id, e]));
    incoming.forEach((e) => map.set(e.id, e));
    return Array.from(map.values());
  }

  // ─── Triage all ──────────────────────────────────────────────────────────────
  async function handleTriageAll() {
    const untriaged = emails.filter((e) => !e.triage);
    for (const email of untriaged.slice(0, 15)) {
      try {
        const triage = await triageEmail(email);
        updateEmailTriage(email.id, triage);
      } catch (err) {
        console.error('Triage error for', email.id, err);
      }
    }
  }

  // ─── Refresh ──────────────────────────────────────────────────────────────────
  async function handleRefresh() {
    setLoading(true);
    try {
      if (googleAuth.connected && googleAuth.token) await loadGoogleData(googleAuth.token);
      if (msAuth.connected && msAuth.token) await loadMsData(msAuth.token);
    } finally {
      setLoading(false);
    }
  }

  // ─── AI Chat ──────────────────────────────────────────────────────────────────
  async function handleAiSend(text) {
    addAiMessage({ role: 'user', content: text });
    setLoading(true);
    try {
      const history = [...aiMessages, { role: 'user', content: text }].map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const reply = await chatWithAssistant(history, emails, calendarEvents);
      addAiMessage({ role: 'assistant', content: reply });
    } catch (err) {
      addAiMessage({ role: 'assistant', content: `Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  // ─── Current user ─────────────────────────────────────────────────────────────
  const currentUser = googleAuth.user || msAuth.user;
  const isConnected = googleAuth.connected || msAuth.connected;

  // ─── Render ───────────────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <AuthScreen
        onGoogleLogin={googleLogin}
        onMsLogin={msLogin}
        googleConnected={googleAuth.connected}
        msConnected={msAuth.connected}
        isLoading={isLoading}
      />
    );
  }

  const p1Count = emails.filter((e) => e.triage?.priority === 'P1').length;
  const unreadCount = emails.filter((e) => e.isUnread).length;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar
        activeView={activeView}
        onNav={setActiveView}
        emailCount={unreadCount}
        p1Count={p1Count}
        googleConnected={googleAuth.connected}
        msConnected={msAuth.connected}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <Header
          user={currentUser}
          onRefresh={handleRefresh}
          isLoading={isLoading || isFetchingEmails || isFetchingCalendar}
        />

        <main className="flex flex-1 min-h-0 overflow-hidden">
          {/* Main content area */}
          <div className="flex flex-col flex-1 min-w-0 min-h-0">
            {activeView === 'dashboard' && (
              <Dashboard
                emails={emails}
                calendarEvents={calendarEvents}
                onEmailClick={(email) => {
                  selectEmail(email);
                  setActiveView('email');
                }}
                onEventClick={() => setActiveView('calendar')}
              />
            )}

            {activeView === 'email' && (
              selectedEmail ? (
                <EmailDetail
                  email={selectedEmail}
                  onBack={() => selectEmail(null)}
                  googleToken={googleAuth.token}
                  msToken={msAuth.token}
                />
              ) : (
                <EmailPanel
                  emails={emails}
                  selectedEmail={selectedEmail}
                  onSelectEmail={selectEmail}
                  onTriageAll={handleTriageAll}
                  isFetching={isFetchingEmails}
                />
              )
            )}

            {activeView === 'calendar' && (
              <CalendarPanel
                events={calendarEvents}
                googleToken={googleAuth.token}
                msToken={msAuth.token}
              />
            )}

            {activeView === 'ai' && (
              <div className="flex flex-1 items-stretch min-h-0">
                {/* Full-width AI in this view */}
                <AiAssistant
                  messages={aiMessages}
                  onSend={handleAiSend}
                  isLoading={isLoading}
                  emails={emails}
                  calendarEvents={calendarEvents}
                />
                <div className="flex-1 flex items-center justify-center text-slate-300 text-sm">
                  {/* Spacer */}
                </div>
              </div>
            )}
          </div>

          {/* Persistent AI panel (hidden in AI view to avoid duplication) */}
          {activeView !== 'ai' && (
            <AiAssistant
              messages={aiMessages}
              onSend={handleAiSend}
              isLoading={isLoading}
              emails={emails}
              calendarEvents={calendarEvents}
            />
          )}
        </main>
      </div>
    </div>
  );
}
