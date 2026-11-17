import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSubject, buildBody, buildMailto, isTooLong, SUPPORT_EMAIL } from '../site/email.js';

const sample = {
  companyName: 'Contoso Ltd',
  requesterName: 'Pat Lee',
  requesterEmail: 'pat@contoso.example',
  requesterPhone: '',
  firstName: 'Sam',
  lastName: 'Rivera',
  jobTitle: 'Accountant',
  startDate: '2026-12-01',
  equipment: ['Laptop', 'Monitor'],
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
});

test('body omits blank fields', () => {
  assert.doesNotMatch(buildBody(sample), /Phone:/);
});

test('body joins multi-select values', () => {
  assert.match(buildBody(sample), /Equipment needed: Laptop, Monitor/);
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
