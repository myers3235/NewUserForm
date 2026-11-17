import { buildSubject, buildBody, buildMailto, isTooLong, SUPPORT_EMAIL } from './email.js';

const form = document.getElementById('request');
const done = document.getElementById('done');
const errors = document.getElementById('errors');
let requestText = '';

function readForm() {
  const data = Object.fromEntries(new FormData(form));
  return { ...data, equipment: new FormData(form).getAll('equipment') };
}

function showErrors() {
  const missing = [...form.elements].filter((el) => el.willValidate && !el.checkValidity());
  missing.forEach((el) => el.setAttribute('aria-invalid', 'true'));
  errors.textContent = 'Please fill in the highlighted fields.';
  errors.hidden = false;
  missing[0]?.focus();
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

form.addEventListener('input', (event) => event.target.removeAttribute('aria-invalid'));

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.checkValidity()) return showErrors();
  errors.hidden = true;

  const data = readForm();
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
    doneMessage.innerHTML = 'Your email app should have opened with the request ready. Review it and click <strong>Send</strong>.';
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
  document.getElementById('copied').hidden = true;
  done.hidden = true;
  form.hidden = false;
  window.scrollTo(0, 0);
});
