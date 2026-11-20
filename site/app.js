import {
  buildSubject, buildBody, buildMailto, isTooLong, suggestUsername, suggestEmail, SUPPORT_EMAIL,
} from './email.js';

const form = document.getElementById('request');
const done = document.getElementById('done');
const errors = document.getElementById('errors');
const { username, newEmail } = form.elements;
let requestText = '';

// Autofill username and email until the person types their own value.
function autofill() {
  if (!username.dataset.edited) username.value = suggestUsername(form.elements.firstName.value, form.elements.lastName.value);
  if (!newEmail.dataset.edited) newEmail.value = suggestEmail(username.value, form.elements.requesterEmail.value);
}

// Show follow-up questions (e.g. "Which mailboxes?") only when the answer above is Yes.
function updateFollowUps() {
  form.querySelectorAll('[data-when]').forEach((field) => {
    const [name, value] = field.dataset.when.split('=');
    const show = form.elements[name].value === value;
    field.hidden = !show;
    field.querySelectorAll('input, textarea').forEach((input) => { input.disabled = !show; });
  });
}

const fieldOf = (el) => el.closest('.field');

function markInvalidFields() {
  const invalid = [...form.elements].filter((el) => el.willValidate && !el.checkValidity());
  invalid.forEach((el) => fieldOf(el)?.classList.add('invalid'));
  errors.hidden = false;
  invalid[0]?.focus();
}

function clearIfValid(el) {
  const field = fieldOf(el);
  if (!field) return;
  const stillInvalid = [...field.querySelectorAll('input, textarea')].some((i) => i.willValidate && !i.checkValidity());
  field.classList.toggle('invalid', stillInvalid && field.classList.contains('invalid'));
  if (!form.querySelector('.invalid')) errors.hidden = true;
}

async function copyRequest() {
  try {
    await navigator.clipboard.writeText(requestText);
    document.getElementById('copied').hidden = false;
    return true;
  } catch {
    // Clipboard can be blocked; the request is still shown on screen to copy by hand.
    document.getElementById('copied').hidden = true;
    document.getElementById('summary').focus();
    return false;
  }
}

function onInput(event) {
  const el = event.target;
  if (el === username || el === newEmail) {
    if (el.value) el.dataset.edited = '1';
    else delete el.dataset.edited;
  }
  autofill();
  updateFollowUps();
  clearIfValid(el);
}

form.addEventListener('input', onInput);
form.addEventListener('change', onInput);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.checkValidity()) return markInvalidFields();
  errors.hidden = true;

  const data = Object.fromEntries(new FormData(form));
  const subject = buildSubject(data);
  requestText = buildBody(data);
  let mailto = buildMailto(subject, requestText);
  const doneMessage = document.getElementById('doneMessage');

  if (isTooLong(mailto)) {
    // Long requests get cut off in some mail apps, so copy the full text and send a short draft.
    mailto = buildMailto(subject, 'Please paste the copied request here (Ctrl+V), then click Send.');
    const copied = await copyRequest();
    doneMessage.textContent = copied
      ? `This request is long, so we copied it for you. Paste it into the email to ${SUPPORT_EMAIL}, then click Send.`
      : `This request is long. Copy the text below and paste it into the email to ${SUPPORT_EMAIL}, then click Send.`;
  } else {
    doneMessage.textContent = 'Your email app should have opened with the request ready. Review it and click Send.';
  }

  document.getElementById('summary').textContent = `Subject: ${subject}\n\n${requestText}`;
  document.getElementById('openAgain').href = mailto;
  form.hidden = true;
  done.hidden = false;
  window.location.href = mailto;
});

document.getElementById('copy').addEventListener('click', copyRequest);
document.getElementById('restart').addEventListener('click', () => {
  form.reset();
  delete username.dataset.edited;
  delete newEmail.dataset.edited;
  updateFollowUps();
  form.querySelectorAll('.invalid').forEach((f) => f.classList.remove('invalid'));
  document.getElementById('copied').hidden = true;
  done.hidden = true;
  form.hidden = false;
  window.scrollTo(0, 0);
});
