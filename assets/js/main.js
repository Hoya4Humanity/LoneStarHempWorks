const INSTAGRAM_URL = 'https://instagram.com/lonestarhempworks'; // TODO: confirm handle.
const PHONE_TEL = 'tel:+18308003213'; // TODO: confirm phone number.
const DIRECTIONS_URL =
  'https://www.google.com/maps/search/?api=1&query=Lone+Star+Hempworks+Seguin+TX'; // TODO: confirm directions URL.

document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-nav');
  const navOverlay = document.querySelector('.nav-overlay');
  const body = document.body;
  const instagramLinks = document.querySelectorAll('[data-instagram]');
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
    const desktopQuery = window.matchMedia('(min-width: 960px)');

    const setHiddenState = (isHidden) => {
      nav.hidden = isHidden;
      nav.setAttribute('aria-hidden', isHidden ? 'true' : 'false');
    };

    const syncDesktopState = () => {
      const isDesktop = desktopQuery.matches;
      if (isDesktop) {
        nav.classList.remove('open');
        setHiddenState(false);
        nav.setAttribute('aria-modal', 'false');
        body.classList.remove('menu-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        if (navOverlay) {
          navOverlay.classList.remove('visible');
          navOverlay.setAttribute('aria-hidden', 'true');
        }
      } else if (!nav.classList.contains('open')) {
        setHiddenState(true);
      }
    };

    const closeNav = ({ restoreFocus = true } = {}) => {
      nav.classList.remove('open');
      setHiddenState(!desktopQuery.matches);
      nav.setAttribute('aria-modal', 'false');
      body.classList.remove('menu-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      if (navOverlay) {
        navOverlay.classList.remove('visible');
        navOverlay.setAttribute('aria-hidden', 'true');
      }
      if (restoreFocus) {
        if (lastFocusedElement instanceof HTMLElement) {
          lastFocusedElement.focus();
        } else {
          menuToggle.focus();
        }
      }
      lastFocusedElement = null;
    };

    const openNav = () => {
      lastFocusedElement = document.activeElement;
      nav.classList.add('open');
      setHiddenState(false);
      nav.setAttribute('aria-modal', 'true');
      body.classList.add('menu-open');
      menuToggle.setAttribute('aria-expanded', 'true');
      if (navOverlay) {
        navOverlay.classList.add('visible');
        navOverlay.setAttribute('aria-hidden', 'false');
      }
      nav.focus();
    };

    const toggleNav = () => {
      if (nav.classList.contains('open')) {
        closeNav();
      } else {
        openNav();
      }
    };

    syncDesktopState();
    desktopQuery.addEventListener('change', syncDesktopState);

    if (navOverlay) {
      navOverlay.setAttribute('aria-hidden', 'true');
    }

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

    if (navOverlay) {
      navOverlay.addEventListener('click', () => closeNav());
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        closeNav();
        return;
      }

      if (event.key === 'Tab' && nav.classList.contains('open')) {
        const focusables = [menuToggle, ...nav.querySelectorAll('a')];
        const visibleItems = focusables.filter((el) => el && el.offsetParent !== null);
        if (!visibleItems.length) return;

        const first = visibleItems[0];
        const last = visibleItems[visibleItems.length - 1];

        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      }
    });

    window.addEventListener('resize', () => {
      if (nav.classList.contains('open')) {
        closeNav({ restoreFocus: false });
      }
      syncDesktopState();
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
