import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

const MODEL = 'claude-sonnet-4-5';

const SYSTEM_PROMPT = `You are an intelligent personal executive assistant for a Managing Director. You help manage email and calendar with precision and discretion.

PRIORITY TRIAGE SYSTEM:
🔴 P1 CRITICAL — Reply today: client escalations, board matters, legal/financial decisions, urgent deadlines
🟡 P2 TODAY — Review today: team updates needing response, proposals, meeting confirmations
🟢 P3 FYI — Can wait: newsletters, CC'd items, automated notifications

When triaging emails, respond with JSON: { "priority": "P1"|"P2"|"P3", "summary": "2-3 sentence summary", "suggestedAction": "brief action" }

When drafting replies: write professional, decisive, concise executive-style emails.

When creating meeting prep briefs, format as:
**Meeting:** [title]
**Purpose:** [1 sentence]
**Key Points:** [bullets]
**Decisions Needed:** [bullets]
**Prep:** [any prep needed]

Always use Markdown formatting in your responses.`;

/**
 * Triage an email — returns { priority, summary, suggestedAction }
 */
export async function triageEmail(email) {
  const content = `Please triage this email and respond with only valid JSON:

From: ${email.from}
Subject: ${email.subject}
Date: ${email.date}

Body:
${(email.body || email.snippet || '').slice(0, 2000)}`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  });

  const text = message.content[0]?.text || '{}';

  try {
    // Extract JSON from the response (may be wrapped in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { priority: 'P3', summary: text, suggestedAction: 'Review' };
  } catch {
    return { priority: 'P3', summary: text, suggestedAction: 'Review' };
  }
}

/**
 * Draft a reply to an email
 */
export async function draftReply(email, instruction = '') {
  const content = `Please draft a professional executive-style reply to this email.
${instruction ? `\nInstruction: ${instruction}` : ''}

Original Email:
From: ${email.from}
Subject: ${email.subject}
Date: ${email.date}

Body:
${(email.body || email.snippet || '').slice(0, 3000)}`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  });

  return message.content[0]?.text || '';
}

/**
 * Generate a meeting prep brief for a calendar event
 */
export async function getMeetingPrep(event, context = '') {
  const content = `Please create a meeting prep brief for the following calendar event:

Title: ${event.title || event.subject || 'Untitled Meeting'}
Time: ${event.start} — ${event.end}
Location: ${event.location || 'N/A'}
Attendees: ${Array.isArray(event.attendees) ? event.attendees.map((a) => a.name || a.emailAddress?.name || a).join(', ') : event.attendees || 'N/A'}
Description: ${event.description || event.bodyPreview || 'N/A'}
${context ? `\nAdditional context: ${context}` : ''}`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  });

  return message.content[0]?.text || '';
}

/**
 * Generate an executive morning briefing
 */
export async function getDailyBriefing(emails, events) {
  const p1Emails = emails.filter((e) => e.priority === 'P1');
  const todayEvents = events.filter((e) => {
    const start = new Date(e.start);
    const today = new Date();
    return start.toDateString() === today.toDateString();
  });

  const content = `Please generate a concise executive morning briefing.

EMAIL SUMMARY:
- Total unread: ${emails.filter((e) => e.isUnread).length}
- P1 Critical: ${p1Emails.length} email(s)
- P2 Today: ${emails.filter((e) => e.priority === 'P2').length} email(s)

${p1Emails.length > 0 ? `TOP PRIORITY EMAILS:\n${p1Emails.slice(0, 3).map((e) => `• From ${e.from}: "${e.subject}" — ${e.aiSummary || e.snippet}`).join('\n')}` : ''}

TODAY'S MEETINGS (${todayEvents.length}):
${todayEvents.map((e) => `• ${e.start} — ${e.title || e.subject}`).join('\n') || 'No meetings today'}

Generate a brief, punchy executive briefing with the most important items to address today.`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  });

  return message.content[0]?.text || '';
}

/**
 * Chat with the assistant, with email and calendar context injected
 */
export async function chatWithAssistant(messages, emailsContext = [], calendarContext = []) {
  const contextBlock =
    emailsContext.length > 0 || calendarContext.length > 0
      ? `\n\n[CURRENT CONTEXT]\nEmails in inbox: ${emailsContext.length} (${emailsContext.filter((e) => e.isUnread).length} unread, ${emailsContext.filter((e) => e.priority === 'P1').length} P1 critical)\nToday's meetings: ${calendarContext.filter((e) => new Date(e.start).toDateString() === new Date().toDateString()).length}\nNext meeting: ${calendarContext[0] ? `${calendarContext[0].title || calendarContext[0].subject} at ${calendarContext[0].start}` : 'None scheduled'}`
      : '';

  const apiMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    system: SYSTEM_PROMPT + contextBlock,
    messages: apiMessages,
  });

  return message.content[0]?.text || '';
}
