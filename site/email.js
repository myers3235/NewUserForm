// Turns form answers into a plain-text ticket email for the Service Desk.

export const SUPPORT_EMAIL = 'support@elevatedmsp.com';

// Some Windows mail handlers truncate mailto links around 2,000 characters.
export const MAILTO_SAFE_LENGTH = 1800;

const SECTIONS = [
  ['REQUESTER', [
    ['companyName', 'Company'],
    ['requesterName', 'Requested by'],
    ['requesterEmail', 'Requester email'],
    ['requesterPhone', 'Phone'],
  ]],
  ['NEW USER', [
    ['firstName', 'First name'],
    ['lastName', 'Last name'],
    ['displayName', 'Preferred name'],
    ['jobTitle', 'Job title'],
    ['department', 'Department'],
    ['manager', 'Manager'],
    ['startDate', 'Start date'],
    ['employmentType', 'Employment type'],
    ['location', 'Work location'],
    ['personalContact', 'Contact for first-day credentials'],
  ]],
  ['ACCESS', [
    ['license', 'Microsoft 365 license'],
    ['mirrorUser', 'Match access of existing user'],
    ['groups', 'Groups / shared mailboxes / folders'],
    ['applications', 'Applications'],
  ]],
  ['EQUIPMENT', [
    ['equipment', 'Equipment needed'],
    ['equipmentNotes', 'Equipment notes'],
  ]],
  ['OTHER', [
    ['notes', 'Notes'],
  ]],
];

const clean = (value) =>
  (Array.isArray(value) ? value.join(', ') : String(value ?? '')).trim();

export function buildSubject(data) {
  const name = `${clean(data.firstName)} ${clean(data.lastName)}`.trim();
  const start = clean(data.startDate);
  const parts = [name, clean(data.companyName), start && `Start ${start}`].filter(Boolean);
  return `New User Request: ${parts.join(' - ')}`;
}

export function buildBody(data) {
  const sections = SECTIONS
    .map(([title, fields]) => {
      const lines = fields
        .filter(([key]) => clean(data[key]))
        .map(([key, label]) => `${label}: ${clean(data[key])}`);
      return lines.length ? [title, ...lines].join('\n') : '';
    })
    .filter(Boolean);
  return [...sections, 'Submitted via the Elevated new user request form.'].join('\n\n');
}

export function buildMailto(subject, body) {
  const crlf = (text) => text.replace(/\r?\n/g, '\r\n');
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(crlf(body))}`;
}

export const isTooLong = (url) => url.length > MAILTO_SAFE_LENGTH;
