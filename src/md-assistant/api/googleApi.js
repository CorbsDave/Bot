const BASE = 'https://www.googleapis.com';

/**
 * Get Google user profile
 */
export async function getGoogleUserProfile(token) {
  const res = await fetch(`${BASE}/oauth2/v2/userinfo`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Google profile error: ${res.status}`);
  return res.json();
}

/**
 * List Gmail message IDs
 */
export async function listGmailMessages(token, query = 'is:unread', maxResults = 30) {
  const params = new URLSearchParams({ q: query, maxResults });
  const res = await fetch(`${BASE}/gmail/v1/users/me/messages?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Gmail list error: ${res.status}`);
  const data = await res.json();
  return data.messages || [];
}

/**
 * Get a full Gmail message by ID
 */
export async function getGmailMessage(token, messageId) {
  const res = await fetch(
    `${BASE}/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Gmail message error: ${res.status}`);
  return res.json();
}

/**
 * Send a Gmail reply
 */
export async function sendGmailReply(token, threadId, to, subject, body) {
  const emailContent = [
    `To: ${to}`,
    `Subject: ${subject.startsWith('Re:') ? subject : `Re: ${subject}`}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body,
  ].join('\r\n');

  const encoded = btoa(unescape(encodeURIComponent(emailContent)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch(`${BASE}/gmail/v1/users/me/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encoded, threadId }),
  });
  if (!res.ok) throw new Error(`Gmail send error: ${res.status}`);
  return res.json();
}

/**
 * List Google Calendar events for the next N days
 */
export async function listCalendarEvents(token, daysAhead = 7) {
  const now = new Date();
  const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  });
  const res = await fetch(
    `${BASE}/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Calendar events error: ${res.status}`);
  const data = await res.json();
  return data.items || [];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function decodeBase64(encoded) {
  try {
    const fixed = encoded.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(escape(atob(fixed)));
  } catch {
    return '';
  }
}

function extractBody(payload) {
  if (!payload) return '';

  // Direct body
  if (payload.body?.data) {
    return decodeBase64(payload.body.data);
  }

  // Multipart
  if (payload.parts) {
    // Prefer text/plain
    const textPart = payload.parts.find((p) => p.mimeType === 'text/plain');
    if (textPart?.body?.data) return decodeBase64(textPart.body.data);

    // Recurse into nested parts
    for (const part of payload.parts) {
      const nested = extractBody(part);
      if (nested) return nested;
    }
  }

  return '';
}

function getHeader(headers, name) {
  const h = headers?.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return h?.value || '';
}

/**
 * Parse a raw Gmail API message into a normalized shape
 */
export function parseGmailMessage(rawMessage) {
  const { id, threadId, labelIds = [], snippet, payload } = rawMessage;
  const headers = payload?.headers || [];

  return {
    id,
    threadId,
    provider: 'gmail',
    from: getHeader(headers, 'From'),
    to: getHeader(headers, 'To'),
    subject: getHeader(headers, 'Subject') || '(no subject)',
    date: getHeader(headers, 'Date'),
    body: extractBody(payload),
    snippet: snippet || '',
    isUnread: labelIds.includes('UNREAD'),
    triage: null,
  };
}
