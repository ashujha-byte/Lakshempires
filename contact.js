document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('callback-form');
  const success = document.getElementById('form-success');
  const errorBox = document.getElementById('form-error');
  const submitBtn = document.getElementById('form-submit');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.classList.add('hidden');

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });

      if (!res.ok) throw new Error('Request failed');

      success.classList.remove('hidden');
      form.reset();
      setTimeout(() => { success.classList.add('hidden'); }, 5000);
    } catch (err) {
      errorBox.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });
});
