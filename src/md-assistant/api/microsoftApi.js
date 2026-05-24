const GRAPH = 'https://graph.microsoft.com/v1.0/me';

/**
 * Get Microsoft user profile
 */
export async function getMsUserProfile(token) {
  const res = await fetch(`${GRAPH}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`MS profile error: ${res.status}`);
  return res.json();
}

/**
 * List Outlook inbox messages
 */
export async function listOutlookMessages(token, top = 30) {
  const params = new URLSearchParams({
    $top: top,
    $orderby: 'receivedDateTime desc',
    $select:
      'id,conversationId,subject,from,toRecipients,receivedDateTime,bodyPreview,isRead,body',
  });
  const res = await fetch(`${GRAPH}/mailFolders/inbox/messages?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Outlook list error: ${res.status}`);
  const data = await res.json();
  return data.value || [];
}

/**
 * Send a reply to an Outlook message
 */
export async function sendOutlookReply(token, messageId, comment) {
  const res = await fetch(`${GRAPH}/messages/${messageId}/reply`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment }),
  });
  if (!res.ok) throw new Error(`Outlook reply error: ${res.status}`);
  return res.ok;
}

/**
 * List Outlook calendar events for the next N days
 */
export async function listOutlookCalendarEvents(token, daysAhead = 7) {
  const now = new Date();
  const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    startDateTime: now.toISOString(),
    endDateTime: future.toISOString(),
    $select: 'id,subject,start,end,location,attendees,organizer,bodyPreview,isOnlineMeeting,onlineMeetingUrl',
    $orderby: 'start/dateTime',
    $top: '50',
  });
  const res = await fetch(`${GRAPH}/calendarView?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Prefer: `outlook.timezone="UTC"`,
    },
  });
  if (!res.ok) throw new Error(`Outlook calendar error: ${res.status}`);
  const data = await res.json();
  return data.value || [];
}

/**
 * Parse an Outlook message into a normalized shape (same as Gmail)
 */
export function parseOutlookMessage(msg) {
  const fromName = msg.from?.emailAddress?.name || '';
  const fromEmail = msg.from?.emailAddress?.address || '';
  const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

  const toRecipients = (msg.toRecipients || [])
    .map((r) => r.emailAddress?.address || '')
    .join(', ');

  return {
    id: msg.id,
    threadId: msg.conversationId || msg.id,
    provider: 'outlook',
    from,
    to: toRecipients,
    subject: msg.subject || '(no subject)',
    date: msg.receivedDateTime || '',
    body: msg.body?.content || msg.bodyPreview || '',
    snippet: msg.bodyPreview || '',
    isUnread: msg.isRead === false,
    triage: null,
  };
}
