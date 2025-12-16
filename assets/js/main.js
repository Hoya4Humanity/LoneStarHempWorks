document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const navList = document.querySelector('nav ul');
  if (menuToggle && navList) {
    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!expanded));
      navList.classList.toggle('open');
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
    window.location.href = '/not-eligible.html';
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
      window.location.href = '/not-eligible.html';
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
