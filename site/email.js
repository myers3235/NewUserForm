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
    ['jobTitle', 'Job title'],
    ['manager', 'Manager'],
    ['startDate', 'Start date'],
    ['username', 'Username'],
    ['newEmail', 'Email address'],
    ['cellPhone', 'Cell phone (for MFA setup)'],
  ]],
  ['ACCESS', [
    ['additionalMailboxes', 'Needs additional mailboxes'],
    ['mailboxes', 'Mailboxes'],
    ['remoteAccess', 'Remote access needed'],
    ['mirrorAccess', 'Mirror an existing user'],
    ['mirrorUser', 'Mirror from'],
    ['sharedDrives', 'Shared drive access'],
    ['emailGroups', 'Email groups'],
    ['applications', 'Applications'],
  ]],
  ['OTHER', [
    ['notes', 'Additional comments'],
  ]],
];

const clean = (value) => String(value ?? '').trim();

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

// "Mary Ann" + "O'Brien-Núñez" -> "maryann.obrien-nunez"
const namePart = (name) =>
  clean(name).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9-]/g, '');

export function suggestUsername(firstName, lastName) {
  const first = namePart(firstName);
  const last = namePart(lastName);
  return first && last ? `${first}.${last}` : '';
}

// Uses the requester's own email domain, since new users usually share it.
export function suggestEmail(username, requesterEmail) {
  const domain = clean(requesterEmail).match(/^[^@\s]+@([^@\s]+\.[^@\s]+)$/)?.[1];
  return username && domain ? `${username}@${domain}` : '';
}
