/**
 * Microsoft Graph API helpers (Outlook Mail + Calendar)
 */

const BASE = 'https://graph.microsoft.com/v1.0/me';

async function apiFetch(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Microsoft Graph API error ${res.status}: ${err}`);
  }
  return res.json();
}

/** GET /me — user profile */
export async function getMsUserProfile(token) {
  return apiFetch(`${BASE}`, token);
}

/** List inbox messages ordered by receivedDateTime desc */
export async function listOutlookMessages(token, top = 30) {
  const params = new URLSearchParams({
    $top: top,
    $orderby: 'receivedDateTime desc',
    $select:
      'id,conversationId,subject,from,toRecipients,receivedDateTime,bodyPreview,isRead,body',
  });
  return apiFetch(`${BASE}/mailFolders/inbox/messages?${params}`, token);
}

/** Reply to a message */
export async function sendOutlookReply(token, messageId, comment) {
  return apiFetch(`${BASE}/messages/${messageId}/reply`, token, {
    method: 'POST',
    body: JSON.stringify({ comment }),
  });
}

/** List calendar events via calendarView for the next N days */
export async function listOutlookCalendarEvents(token, daysAhead = 7) {
  const now = new Date();
  const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    startDateTime: now.toISOString(),
    endDateTime: future.toISOString(),
    $select: 'id,subject,start,end,location,attendees,bodyPreview,organizer',
    $orderby: 'start/dateTime',
    $top: 50,
  });
  return apiFetch(`${BASE}/calendarView?${params}`, token);
}

/**
 * Parse an Outlook message into the same normalised shape as parseGmailMessage.
 * Returns { id, threadId, from, to, subject, date, body, snippet, isUnread, provider }
 */
export function parseOutlookMessage(msg) {
  const from = msg.from?.emailAddress
    ? `${msg.from.emailAddress.name || ''} <${msg.from.emailAddress.address}>`
    : '';

  const to = (msg.toRecipients || [])
    .map((r) => `${r.emailAddress?.name || ''} <${r.emailAddress?.address || ''}>`)
    .join(', ');

  const body =
    msg.body?.contentType === 'html'
      ? stripHtml(msg.body?.content || '')
      : msg.body?.content || msg.bodyPreview || '';

  return {
    id: msg.id,
    threadId: msg.conversationId,
    from,
    to,
    subject: msg.subject || '(No subject)',
    date: msg.receivedDateTime ? new Date(msg.receivedDateTime) : new Date(),
    body,
    snippet: msg.bodyPreview || '',
    isUnread: !msg.isRead,
    provider: 'outlook',
    priority: null,
    aiSummary: null,
    suggestedAction: null,
  };
}

/** Strip HTML tags for plain-text body fallback */
function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
