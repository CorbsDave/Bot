/**
 * Google Gmail + Calendar API helpers
 */

const BASE_GMAIL = 'https://gmail.googleapis.com/gmail/v1/users/me';
const BASE_CALENDAR = 'https://www.googleapis.com/calendar/v3';

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
    throw new Error(`Google API error ${res.status}: ${err}`);
  }
  return res.json();
}

/** GET https://www.googleapis.com/oauth2/v2/userinfo */
export async function getGoogleUserProfile(token) {
  return apiFetch('https://www.googleapis.com/oauth2/v2/userinfo', token);
}

/** List Gmail message IDs */
export async function listGmailMessages(token, query = 'is:unread', maxResults = 30) {
  const params = new URLSearchParams({ q: query, maxResults });
  return apiFetch(`${BASE_GMAIL}/messages?${params}`, token);
}

/** Get a full Gmail message */
export async function getGmailMessage(token, messageId) {
  return apiFetch(`${BASE_GMAIL}/messages/${messageId}?format=full`, token);
}

/** Send a Gmail reply */
export async function sendGmailReply(token, threadId, to, subject, body) {
  const subject_ = subject.startsWith('Re:') ? subject : `Re: ${subject}`;
  const rawEmail = [
    `To: ${to}`,
    `Subject: ${subject_}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    '',
    body,
  ].join('\r\n');

  const encoded = btoa(unescape(encodeURIComponent(rawEmail)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return apiFetch(`${BASE_GMAIL}/messages/send`, token, {
    method: 'POST',
    body: JSON.stringify({ raw: encoded, threadId }),
  });
}

/** List primary calendar events for the next N days */
export async function listCalendarEvents(token, daysAhead = 7) {
  const now = new Date();
  const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 50,
  });
  return apiFetch(`${BASE_CALENDAR}/calendars/primary/events?${params}`, token);
}

/** Decode base64url-encoded string */
function decodeBase64(str) {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return decodeURIComponent(escape(decoded));
  } catch {
    try {
      return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    } catch {
      return '';
    }
  }
}

/** Extract header value from Gmail headers array */
function getHeader(headers, name) {
  const h = headers?.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return h?.value || '';
}

/** Recursively extract text body from MIME parts */
function extractBody(payload) {
  if (!payload) return '';

  // Direct body
  if (payload.body?.data) {
    return decodeBase64(payload.body.data);
  }

  // Multipart
  if (payload.parts) {
    // Prefer text/plain
    const plain = payload.parts.find((p) => p.mimeType === 'text/plain');
    if (plain) return extractBody(plain);

    // Fallback to text/html
    const html = payload.parts.find((p) => p.mimeType === 'text/html');
    if (html) return extractBody(html);

    // Recurse through all parts
    for (const part of payload.parts) {
      const text = extractBody(part);
      if (text) return text;
    }
  }

  return '';
}

/**
 * Parse a raw Gmail message into a normalised email object.
 * Returns { id, threadId, from, to, subject, date, body, snippet, isUnread, provider }
 */
export function parseGmailMessage(rawMessage) {
  const { id, threadId, snippet, labelIds, payload } = rawMessage;
  const headers = payload?.headers || [];

  const from = getHeader(headers, 'From');
  const to = getHeader(headers, 'To');
  const subject = getHeader(headers, 'Subject');
  const dateStr = getHeader(headers, 'Date');
  const date = dateStr ? new Date(dateStr) : new Date();

  const body = extractBody(payload);
  const isUnread = labelIds?.includes('UNREAD') ?? false;

  return {
    id,
    threadId,
    from,
    to,
    subject,
    date,
    body,
    snippet,
    isUnread,
    provider: 'gmail',
    // triage fields populated later by AI
    priority: null,
    aiSummary: null,
    suggestedAction: null,
  };
}
