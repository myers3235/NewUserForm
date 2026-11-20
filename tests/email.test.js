import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSubject, buildBody, buildMailto, isTooLong, suggestUsername, suggestEmail, SUPPORT_EMAIL,
} from '../site/email.js';

const sample = {
  companyName: 'Contoso Ltd',
  requesterName: 'Pat Lee',
  requesterEmail: 'pat@contoso.example',
  requesterPhone: '',
  firstName: 'Sam',
  lastName: 'Rivera',
  jobTitle: 'Accountant',
  startDate: '2026-12-01',
  remoteAccess: 'Yes',
  sharedDrives: 'Accounting share',
  notes: 'Line one\nLine two',
};

test('support address is the ticketing mailbox', () => {
  assert.equal(SUPPORT_EMAIL, 'support@elevatedmsp.com');
});

test('subject names the new user, company, and start date', () => {
  assert.equal(buildSubject(sample), 'New User Request: Sam Rivera - Contoso Ltd - Start 2026-12-01');
});

test('subject still reads cleanly when start date is missing', () => {
  assert.equal(buildSubject({ ...sample, startDate: '' }), 'New User Request: Sam Rivera - Contoso Ltd');
});

test('body includes filled fields with labels', () => {
  const body = buildBody(sample);
  assert.match(body, /Company: Contoso Ltd/);
  assert.match(body, /Requested by: Pat Lee/);
  assert.match(body, /Job title: Accountant/);
  assert.match(body, /Remote access needed: Yes/);
  assert.match(body, /Shared drive access: Accounting share/);
});

test('body omits blank fields', () => {
  assert.doesNotMatch(buildBody(sample), /Phone:/);
});

test('body drops a section whose fields are all blank', () => {
  const body = buildBody({ companyName: 'Contoso Ltd', firstName: 'Sam', lastName: 'Rivera' });
  assert.doesNotMatch(body, /ACCESS/);
});

test('body trims whitespace and keeps multi-line notes', () => {
  const body = buildBody({ ...sample, jobTitle: '  Accountant  ' });
  assert.match(body, /Job title: Accountant\r?\n/);
  assert.match(body, /Line one\r?\nLine two/);
});

test('mailto encodes subject and body', () => {
  const url = buildMailto('Hi & bye', 'a=b\nc');
  assert.equal(url, 'mailto:support@elevatedmsp.com?subject=Hi%20%26%20bye&body=a%3Db%0D%0Ac');
});

test('isTooLong flags links over the safe limit', () => {
  assert.equal(isTooLong('x'.repeat(1800)), false);
  assert.equal(isTooLong('x'.repeat(1801)), true);
});

test('suggestUsername builds first.last in lowercase', () => {
  assert.equal(suggestUsername('Sam', 'Rivera'), 'sam.rivera');
});

test('suggestUsername strips spaces, apostrophes, and accents', () => {
  assert.equal(suggestUsername(' Mary Ann ', "O'Brien-Núñez"), 'maryann.obrien-nunez');
});

test('suggestUsername is empty until both names exist', () => {
  assert.equal(suggestUsername('Sam', ''), '');
  assert.equal(suggestUsername('', 'Rivera'), '');
});

test('suggestEmail uses the requester company domain', () => {
  assert.equal(suggestEmail('sam.rivera', 'pat@contoso.example'), 'sam.rivera@contoso.example');
});

test('suggestEmail is empty without a username or a valid requester email', () => {
  assert.equal(suggestEmail('', 'pat@contoso.example'), '');
  assert.equal(suggestEmail('sam.rivera', 'not-an-email'), '');
});
