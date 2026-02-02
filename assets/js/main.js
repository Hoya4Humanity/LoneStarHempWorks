const INSTAGRAM_URL = 'https://instagram.com/lonestarhempworks';
const FACEBOOK_URL = 'https://www.facebook.com/share/1FrbUnXb5b/?mibextid=wwXIfr';
const PHONE_TEL = 'tel:+18308003213';
const DIRECTIONS_URL =
  'https://www.google.com/maps/search/?api=1&query=633+E+Court+St,+Seguin,+TX+78155';

const STORE_HOURS = [
  { day: 'Mon', hours: '9:00 AM – 11:00 PM' },
  { day: 'Tue', hours: '9:00 AM – 11:00 PM' },
  { day: 'Wed', hours: '9:00 AM – 11:00 PM' },
  { day: 'Thu', hours: '9:00 AM – 11:00 PM' },
  { day: 'Fri', hours: '9:00 AM – 12:00 AM' },
  { day: 'Sat', hours: '9:00 AM – 12:00 AM' },
  { day: 'Sun', hours: '11:00 AM – 9:00 PM' },
];

function renderStoreHours() {
  const hoursTableBody = document.querySelector('.hours tbody');
  if (hoursTableBody) {
    hoursTableBody.innerHTML = STORE_HOURS.map(
      (entry) => `<tr><th scope="row">${entry.day}</th><td>${entry.hours}</td></tr>`
    ).join('');
  }

  const hoursRows = document.querySelector('.hours-card__rows');
  if (hoursRows) {
    hoursRows.innerHTML = STORE_HOURS.map(
      (entry) => `<div class="hours-row"><span>${entry.day}</span><span>${entry.hours}</span></div>`
    ).join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-nav');
  const navOverlay = document.querySelector('.nav-overlay');
  const body = document.body;
  const instagramLinks = document.querySelectorAll('[data-instagram]');
  const facebookLinks = document.querySelectorAll('[data-facebook]');
  const phoneLinks = document.querySelectorAll('[data-phone]');
  const directionsLinks = document.querySelectorAll('[data-directions]');

  if (INSTAGRAM_URL) {
    instagramLinks.forEach((link) => {
      link.setAttribute('href', INSTAGRAM_URL);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });
  } else {
    instagramLinks.forEach((link) => {
      const listItem = link.closest('li');
      if (listItem) {
        listItem.remove();
      } else {
        link.remove();
      }
    });
  }

  if (FACEBOOK_URL) {
    facebookLinks.forEach((link) => {
      link.setAttribute('href', FACEBOOK_URL);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });
  } else {
    facebookLinks.forEach((link) => {
      const listItem = link.closest('li');
      if (listItem) {
        listItem.remove();
      } else {
        link.remove();
      }
    });
  }

  if (PHONE_TEL) {
    phoneLinks.forEach((link) => {
      link.setAttribute('href', PHONE_TEL);
    });
  }

  if (DIRECTIONS_URL) {
    directionsLinks.forEach((link) => {
      link.setAttribute('href', DIRECTIONS_URL);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener');
    });
  }


  if (menuToggle && nav) {
    let lastFocusedElement = null;
    const desktopQuery = window.matchMedia('(min-width: 769px)');

    const setAria = (isOpen) => {
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      nav.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      if (navOverlay) navOverlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    };

    const closeNav = ({ restoreFocus = true } = {}) => {
      nav.classList.remove('open');
      body.classList.remove('menu-open');
      if (navOverlay) navOverlay.classList.remove('visible');
      setAria(false);

      if (restoreFocus) {
        (lastFocusedElement || menuToggle).focus?.();
      }
      lastFocusedElement = null;
    };

    const openNav = () => {
      lastFocusedElement = document.activeElement;
      nav.classList.add('open');
      body.classList.add('menu-open');
      if (navOverlay) navOverlay.classList.add('visible');
      setAria(true);
    };

    const syncDesktopState = () => {
      if (desktopQuery.matches) {
        // Desktop: nav always visible; no overlay or body lock
        nav.classList.remove('open');
        body.classList.remove('menu-open');
        if (navOverlay) navOverlay.classList.remove('visible');

        nav.setAttribute('aria-hidden', 'false');
        menuToggle.setAttribute('aria-expanded', 'false');
        if (navOverlay) navOverlay.setAttribute('aria-hidden', 'true');
      } else {
        // Mobile: drawer closed by default unless opened
        if (!nav.classList.contains('open')) {
          nav.setAttribute('aria-hidden', 'true');
          if (navOverlay) navOverlay.setAttribute('aria-hidden', 'true');
        }
      }
    };

    syncDesktopState();
    desktopQuery.addEventListener('change', syncDesktopState);

    menuToggle.addEventListener('click', () => {
      const isOpen = nav.classList.contains('open');
      isOpen ? closeNav() : openNav();
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (!desktopQuery.matches && nav.classList.contains('open')) closeNav();
      });
    });

    if (navOverlay) navOverlay.addEventListener('click', () => closeNav());

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        closeNav();
        return;
      }
    });

    window.addEventListener('resize', () => {
      if (nav.classList.contains('open')) closeNav({ restoreFocus: false });
      syncDesktopState();
    });
  }

  handleAgeGate();
  handleFormSuccess();
  renderStoreHours();
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
