const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export const DIAGNOSTIC_SYSTEM_PROMPT = `You are MECH·IQ, an expert automotive diagnostic AI for Service Stop Ltd, an award-winning Irish independent workshop. Analyse diagnostic scans with deep knowledge of all makes including hybrid/EV/PHEV.

Structure responses using these headers: VEHICLE SUMMARY | FAULT CODE INVENTORY | CASCADE ANALYSIS | PRIORITY ASSIGNMENT | ROOT CAUSE HYPOTHESIS | RECOMMENDED TEST SEQUENCE | PARTS AT RISK | 12V SYSTEM FLAG | DATA CAPTURE FIELDS

For DATA CAPTURE FIELDS always use exactly:
VEHICLE: [details]
TOOL: [tool]
FAULT_CODES: [all codes]
CURRENT_CODES: [current only]
ROOT_CAUSE: [root cause]
HV_SAFETY_FLAG: YES/NO
COMEBACK_RISK: LOW/MEDIUM/HIGH
CONFIDENCE: LOW/MEDIUM/HIGH
PARTS_RECOMMENDED: [parts or NONE]
RECOMMENDED_ACTION: [one sentence]

Priority levels: P1=safety critical do not drive, P2=action needed this visit, P3=monitor clear and retest, P4=delete retest TSB harvested artefact, P5=history only.

Be direct and practical. Think like an experienced workshop technician. Flag HV safety issues prominently.`;

export const PROMPT_TYPES = [
  { id: '01', label: 'First scan', description: 'Initial diagnostic scan analysis' },
  { id: '02', label: 'Follow-up', description: 'Follow-up after initial diagnosis' },
  { id: '03', label: 'Cascade', description: 'Multiple related fault codes' },
  { id: '04', label: 'No codes', description: 'Symptom only, no fault codes stored' },
  { id: '05', label: 'Pre-parts', description: 'Confirm diagnosis before ordering parts' },
  { id: '06', label: 'Comeback', description: 'Vehicle returned after previous repair' },
  { id: '07', label: 'HV safety', description: 'High voltage system safety check' },
  { id: '08', label: 'Intermittent', description: 'Intermittent fault, not always present' },
  { id: '09', label: 'End of job', description: 'Post-repair verification' },
  { id: '10', label: 'Unknown code', description: 'Unfamiliar or manufacturer-specific code' },
];

export const DIAGNOSTIC_TOOLS = [
  'Thinkcar', 'Launch X431', 'Bosch KTS', 'Topdon', 'VAG ODIS',
  'BMW OAS', 'Ford FDRS', 'Volvo VIDA', 'XENTRY', 'Other'
];

export async function runDiagnostic(messages) {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: DIAGNOSTIC_SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

export function parseDiagnosticResponse(text) {
  const sections = [
    'VEHICLE SUMMARY',
    'FAULT CODE INVENTORY',
    'CASCADE ANALYSIS',
    'PRIORITY ASSIGNMENT',
    'ROOT CAUSE HYPOTHESIS',
    'RECOMMENDED TEST SEQUENCE',
    'PARTS AT RISK',
    '12V SYSTEM FLAG',
    'DATA CAPTURE FIELDS',
  ];

  const result = {};
  let remaining = text;

  for (let i = 0; i < sections.length; i++) {
    const header = sections[i];
    const nextHeader = sections[i + 1];
    const headerIdx = remaining.indexOf(header);
    if (headerIdx === -1) continue;

    const start = headerIdx + header.length;
    const end = nextHeader ? remaining.indexOf(nextHeader) : remaining.length;
    result[header] = remaining.slice(start, end !== -1 ? end : undefined).replace(/^[\s:*#-]+/, '').trim();
  }

  // Parse DATA CAPTURE FIELDS
  const dcf = result['DATA CAPTURE FIELDS'] || '';
  const fields = {};
  const fieldKeys = ['VEHICLE', 'TOOL', 'FAULT_CODES', 'CURRENT_CODES', 'ROOT_CAUSE',
    'HV_SAFETY_FLAG', 'COMEBACK_RISK', 'CONFIDENCE', 'PARTS_RECOMMENDED', 'RECOMMENDED_ACTION'];

  fieldKeys.forEach(key => {
    const regex = new RegExp(`${key}:\\s*([^\\n]+)`);
    const match = dcf.match(regex);
    if (match) fields[key] = match[1].trim();
  });

  result['_fields'] = fields;
  result['_raw'] = text;
  return result;
}

export function parsePriorityLines(text) {
  if (!text) return [];
  const lines = text.split('\n').filter(l => l.trim());
  return lines.map(line => {
    const p1 = line.match(/P([1-5])/);
    const priority = p1 ? parseInt(p1[1]) : null;
    return { text: line.trim(), priority };
  });
}
