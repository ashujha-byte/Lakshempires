// --- MOBILE MENU TOGGLE ---
document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      mobileMenu.classList.toggle('hidden');
    });

    // Bahar click karne par menu apne aap band ho jaye
    document.addEventListener('click', (e) => {
      if (!mobileMenu.contains(e.target) && !menuBtn.contains(e.target)) {
        mobileMenu.classList.add('hidden');
      }
    });
  }
});
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();

  // Header shadow + backdrop on scroll
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 12) {
        header.classList.add('bg-navy-950/90', 'backdrop-blur', 'border-gold-500/10', 'shadow-lg');
      } else {
        header.classList.remove('bg-navy-950/90', 'backdrop-blur', 'border-gold-500/10', 'shadow-lg');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Mobile menu toggle
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const isOpen = !mobileMenu.classList.contains('hidden');
      mobileMenu.classList.toggle('hidden');
      menuBtn.setAttribute('aria-expanded', String(!isOpen));
      menuBtn.innerHTML = isOpen ? '<i data-lucide="menu" class="w-6 h-6"></i>' : '<i data-lucide="x" class="w-6 h-6"></i>';
      if (window.lucide) lucide.createIcons();
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.innerHTML = '<i data-lucide="menu" class="w-6 h-6"></i>';
        if (window.lucide) lucide.createIcons();
      });
    });
  }

  // Highlight the current page's nav link
  const currentPage = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('[data-nav-link]').forEach(link => {
    const target = link.getAttribute('href');
    if (target === currentPage || (currentPage === '' && target === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Scroll reveal via IntersectionObserver
  const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  if (revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  }
});
// --- WHATSAPP CLICK & RETURN LEAD MODAL LOGIC ---
const waBtn = document.getElementById('whatsapp-trigger');
const waModal = document.getElementById('wa-lead-modal');
const waModalClose = document.getElementById('wa-modal-close');
const waLeadForm = document.getElementById('wa-lead-form');

// 1. Jab client WhatsApp button dabaye toh trigger flag set karein
if (waBtn) {
  waBtn.addEventListener('click', () => {
    sessionStorage.setItem('wa_clicked', 'true');
  });
}

// 2. Function to show lead modal
function triggerLeadModal() {
  const hasClicked = sessionStorage.getItem('wa_clicked');
  const alreadySubmitted = localStorage.getItem('lead_submitted');

  if (hasClicked === 'true' && !alreadySubmitted && waModal) {
    waModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }
}

// Client jaise hi WhatsApp se wapas website/tab par focus kare ya page refresh kare
window.addEventListener('focus', () => {
  setTimeout(triggerLeadModal, 800);
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    setTimeout(triggerLeadModal, 800);
  }
});

// Close modal manual click
if (waModalClose) {
  waModalClose.addEventListener('click', () => {
    if (waModal) {
      waModal.style.display = 'none';
      document.body.style.overflow = '';
      sessionStorage.removeItem('wa_clicked');
    }
  });
}

// Form submit hone ke baad flag clear aur email direct
if (waLeadForm) {
  waLeadForm.addEventListener('submit', () => {
    localStorage.setItem('lead_submitted', 'true');
    sessionStorage.removeItem('wa_clicked');
  });
}