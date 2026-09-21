document.addEventListener('DOMContentLoaded', () => {
  // --- 1. FILTER FUNCTIONALITY ---
  const chips = document.querySelectorAll('.filter-chip');
  const articles = document.querySelectorAll('article[data-category]');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => {
        c.classList.remove('active', 'text-gold-500', 'border-gold-500/40');
        c.classList.add('text-cream/80', 'border-gold-500/30');
      });
      chip.classList.add('active', 'text-gold-500', 'border-gold-500/40');
      chip.classList.remove('text-cream/80');

      const filter = chip.getAttribute('data-filter') || 'all';

      articles.forEach(card => {
        const category = card.getAttribute('data-category') || '';
        const match = (filter === 'all' || category.toLowerCase() === filter.toLowerCase());
        card.style.display = match ? 'block' : 'none';
      });
    });
  });

  // --- 2. POPUP ENQUIRY FORM LOGIC ---
  const modal = document.getElementById('property-modal');
  const modalClose = document.getElementById('modal-close');
  const propNameEl = document.getElementById('modal-property-name');
  const propLocationEl = document.getElementById('modal-property-location');
  const modalBadge = document.getElementById('modal-badge');
  const formPropTitle = document.getElementById('form-prop-title');
  const formPropLocation = document.getElementById('form-prop-location');

  const openEnquiryModal = (card) => {
    if (!modal || !card) return;

    const title = card.getAttribute('data-title') || card.querySelector('h3')?.innerText || 'Exclusive Property';
    const location = card.getAttribute('data-location') || card.querySelector('p')?.innerText || 'Noida / Greater Noida';
    const category = (card.getAttribute('data-category') || 'SALE').toUpperCase();

    // Fill form visual details
    if (propNameEl) propNameEl.textContent = title;
    if (propLocationEl) propLocationEl.textContent = location;
    if (modalBadge) modalBadge.textContent = category;

    // Fill form hidden values for Email report
    if (formPropTitle) formPropTitle.value = title;
    if (formPropLocation) formPropLocation.value = location;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  };

  const closeEnquiryModal = () => {
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
  };

  // Event delegation to capture all "View Details" button clicks
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-view-details]');
    if (btn) {
      e.preventDefault();
      const card = btn.closest('article');
      if (card) {
        openEnquiryModal(card);
      }
    }
  });

  if (modalClose) {
    modalClose.addEventListener('click', closeEnquiryModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeEnquiryModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeEnquiryModal();
  });
});