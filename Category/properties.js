document.addEventListener('DOMContentLoaded', () => {
  // --- 1. FILTER SYSTEM ---
  const chips = document.querySelectorAll('.filter-chip');
  const articles = document.querySelectorAll('article');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => {
        c.classList.remove('active', 'text-gold-300', 'border-gold-500/40');
        c.classList.add('text-ivory/80', 'border-gold-500/30');
      });
      chip.classList.add('active', 'text-gold-300', 'border-gold-500/40');
      chip.classList.remove('text-ivory/80');

      const filter = chip.getAttribute('data-filter') || 'all';

      articles.forEach(card => {
        const badge = card.querySelector('.crest-badge');
        const category = badge ? badge.textContent.trim().toLowerCase() : '';
        const match = (filter === 'all' || category === filter.toLowerCase());
        card.style.display = match ? 'block' : 'none';
      });
    });
  });

  // --- 2. MODAL POPUP SYSTEM ---
  const modal = document.getElementById('property-modal');
  const modalImg = document.getElementById('modal-img');
  const modalBadge = document.getElementById('modal-badge');
  const modalTitle = document.getElementById('modal-title');
  const modalLocation = document.getElementById('modal-location');
  const modalDesc = document.getElementById('modal-desc');
  const closeBtn = document.getElementById('modal-close');

  const openModalWithCard = (card) => {
    if (!modal || !card) return;

    // Card se live content nikalna
    const titleEl = card.querySelector('h3');
    const locationEl = card.querySelector('p');
    const imgEl = card.querySelector('img');
    const badgeEl = card.querySelector('.crest-badge');

    const title = titleEl ? titleEl.innerText : 'Exclusive Property';
    const location = locationEl ? locationEl.innerText : 'Noida / Greater Noida';
    const img = imgEl ? imgEl.src : '';
    const badge = badgeEl ? badgeEl.innerText : 'PROPERTY';

    if (modalTitle) modalTitle.textContent = title;
    if (modalLocation) modalLocation.textContent = location;
    if (modalImg) modalImg.src = img;
    if (modalBadge) modalBadge.textContent = badge;
    if (modalDesc) {
      modalDesc.textContent = `A prime ${badge.toLowerCase()} property situated in ${location}. Verified documents, clean titles, and premium construction under Laksh Empires assurance.`;
    }

    // Direct display flex trigger
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  };

  const closeModal = () => {
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
  };

  // Click listener on all View Details buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-view-details]');
    if (btn) {
      e.preventDefault();
      const card = btn.closest('article');
      if (card) {
        openModalWithCard(card);
      }
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
});