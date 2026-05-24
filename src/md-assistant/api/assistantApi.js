import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

const MD_SYSTEM_PROMPT = `You are an intelligent personal executive assistant for a Managing Director. You help manage email and calendar with precision and discretion.

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
  const content = `Triage this email and respond with JSON only:

From: ${email.from}
Subject: ${email.subject}
Date: ${email.date}
Body: ${email.body?.slice(0, 1500) || email.snippet}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 300,
    system: MD_SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  });

  const text = response.content[0]?.text || '';
  try {
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {
    // fallback
  }
  return { priority: 'P3', summary: text.slice(0, 200), suggestedAction: 'Review' };
}

/**
 * Draft a reply to an email
 */
export async function draftReply(email, instruction = '') {
  const content = `Draft a professional executive reply to this email.
${instruction ? `Instruction: ${instruction}` : ''}

From: ${email.from}
Subject: ${email.subject}
Body: ${email.body?.slice(0, 2000) || email.snippet}

Write only the email body (no subject line, no "Dear/Hi" unless appropriate, no signature).`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 600,
    system: MD_SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  });

  return response.content[0]?.text || '';
}

/**
 * Generate a meeting prep brief
 */
export async function getMeetingPrep(event, context = '') {
  const attendees = event.attendees?.length
    ? `Attendees: ${event.attendees.slice(0, 5).join(', ')}`
    : '';

  const content = `Create a meeting prep brief for this event:

Title: ${event.title || event.subject}
Time: ${event.startTime} - ${event.endTime}
${event.location ? `Location: ${event.location}` : ''}
${attendees}
${event.description ? `Description: ${event.description}` : ''}
${context ? `Additional context: ${context}` : ''}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 800,
    system: MD_SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  });

  return response.content[0]?.text || '';
}

/**
 * Generate a daily morning briefing
 */
export async function getDailyBriefing(emails, events) {
  const p1Emails = emails.filter((e) => e.triage?.priority === 'P1');
  const todayEvents = events.filter((e) => {
    const today = new Date().toDateString();
    return new Date(e.startTime || e.start).toDateString() === today;
  });

  const emailSummary = p1Emails
    .slice(0, 5)
    .map((e) => `- [P1] From ${e.from}: "${e.subject}"`)
    .join('\n');

  const eventSummary = todayEvents
    .slice(0, 5)
    .map((e) => `- ${e.startTime || e.start}: ${e.title || e.subject}`)
    .join('\n');

  const content = `Generate an executive morning briefing for today.

UNREAD EMAILS: ${emails.filter((e) => e.isUnread).length} total, ${p1Emails.length} P1 critical
P1 EMAILS:
${emailSummary || 'None'}

TODAY'S MEETINGS: ${todayEvents.length}
${eventSummary || 'No meetings today'}

Write a concise, actionable morning briefing. Lead with the most critical items. Use markdown formatting.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 800,
    system: MD_SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  });

  return response.content[0]?.text || '';
}

/**
 * General chat with the assistant, with email + calendar context
 */
export async function chatWithAssistant(messages, emailsContext = [], calendarContext = []) {
  const p1Emails = emailsContext.filter((e) => e.triage?.priority === 'P1');
  const unreadCount = emailsContext.filter((e) => e.isUnread).length;
  const today = new Date().toDateString();
  const todayEvents = calendarContext.filter(
    (e) => new Date(e.startTime || e.start).toDateString() === today
  );

  const contextBlock = `
CURRENT CONTEXT:
- Unread emails: ${unreadCount} (${p1Emails.length} P1 critical)
- Today's meetings: ${todayEvents.length}
${todayEvents
  .slice(0, 3)
  .map((e) => `  • ${e.startTime || e.start}: ${e.title || e.subject}`)
  .join('\n')}
${p1Emails
  .slice(0, 3)
  .map((e) => `  • P1 from ${e.from}: "${e.subject}"`)
  .join('\n')}
`;

  const systemWithContext = `${MD_SYSTEM_PROMPT}\n\n${contextBlock}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1000,
    system: systemWithContext,
    messages,
  });

  return response.content[0]?.text || '';
}
