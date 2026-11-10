import { reactive } from 'vue';

// App-wide messages. iOS's WebView never shows the browser's own form-validation
// bubbles, so a form with an empty required field (or a short password) used to
// do nothing at all when submitted - e.g. Team → "Add member". Everything that
// can fail now says so here.
export const notices = reactive([]);
let seq = 0;

export function notify(text, kind = 'error', ttl = 4500) {
  if (!text) return;
  if (notices.some((n) => n.text === text)) return;
  const id = ++seq;
  notices.push({ id, text, kind });
  setTimeout(() => dismiss(id), ttl);
}

export function dismiss(id) {
  const i = notices.findIndex((n) => n.id === id);
  if (i !== -1) notices.splice(i, 1);
}

function fieldLabel(el) {
  const label = el.closest('label');
  const text = el.getAttribute('aria-label') || el.placeholder
    || (label && label.textContent.trim().split('\n')[0]) || el.name || 'This field';
  return text.replace(/\s+/g, ' ').slice(0, 40);
}

// Form fields the browser rejects (required, type=email, minlength...).
export function installFormFeedback() {
  let last = 0;
  document.addEventListener('invalid', (e) => {
    const el = e.target;
    const now = Date.now();
    if (now - last < 300) return; // one message per submit, for the first bad field
    last = now;
    notify(`${fieldLabel(el)}: ${el.validationMessage}`);
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setTimeout(() => el.focus({ preventScroll: true }), 50);
  }, true);
}

// Failed saves/deletes from the API. Reads aren't announced: pages show their
// own empty/error states for those.
export function apiErrorMessage(error) {
  return error?.response?.data?.error?.message
    || (error?.response ? `Something went wrong (${error.response.status})` : 'No connection. Check your internet and try again.');
}
