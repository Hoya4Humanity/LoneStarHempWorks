document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-nav');
  const body = document.body;

  if (menuToggle && nav) {
    const closeNav = () => {
      nav.classList.remove('open');
      body.classList.remove('menu-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    };

    const openNav = () => {
      nav.classList.add('open');
      body.classList.add('menu-open');
      menuToggle.setAttribute('aria-expanded', 'true');
    };

    const toggleNav = () => {
      if (nav.classList.contains('open')) {
        closeNav();
      } else {
        openNav();
      }
    };

    menuToggle.addEventListener('click', toggleNav);

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (nav.classList.contains('open')) {
          closeNav();
        }
      });
    });

    document.addEventListener('click', (event) => {
      if (
        nav.classList.contains('open') &&
        !nav.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        closeNav();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        closeNav();
        menuToggle.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (nav.classList.contains('open')) {
        closeNav();
      }
    });
  }

  handleAgeGate();
  handleFormSuccess();
});

function handleAgeGate() {
  const body = document.body;
  if (body.classList.contains('no-age-gate')) return;
  const ageStatus = localStorage.getItem('ageStatus');
  if (ageStatus === 'no') {
    window.location.href = 'not-eligible.html';
    return;
  }

  const modal = document.getElementById('age-gate');
  if (!modal) return;

  if (ageStatus === 'yes') {
    modal.classList.add('hidden');
    body.classList.remove('modal-open');
    return;
  }

  body.classList.add('modal-open');
  modal.classList.remove('hidden');

  const yesBtn = modal.querySelector('[data-age-yes]');
  const noBtn = modal.querySelector('[data-age-no]');

  if (yesBtn) {
    yesBtn.addEventListener('click', () => {
      localStorage.setItem('ageStatus', 'yes');
      modal.classList.add('hidden');
      body.classList.remove('modal-open');
    });
  }

  if (noBtn) {
    noBtn.addEventListener('click', () => {
      localStorage.setItem('ageStatus', 'no');
      window.location.href = 'not-eligible.html';
    });
  }
}

function handleFormSuccess() {
  const params = new URLSearchParams(window.location.search);
  const successTargets = document.querySelectorAll('[data-success-target]');
  if (!successTargets.length) return;

  if (params.get('sent') === '1') {
    successTargets.forEach((el) => el.classList.add('visible'));
  }
}
