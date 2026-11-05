// =========================================================================
// Smart Auto-Hiding & Quick-Return Navbar Engine (Facebook N)
// - Hides header & buttons when scrolling down into feed (clean fullscreen)
// - Instantly and stylishly reveals header & buttons on slight scroll-up
// =========================================================================
(function() {
  'use strict';
  if (window._fbnSmartNavbarInitialized) return;
  window._fbnSmartNavbarInitialized = true;

  // 1. Inject styling for fixed positioning and smooth 60fps transitions
  const styleEl = document.createElement('style');
  styleEl.id = 'fbn-smart-navbar-style';
  styleEl.textContent = `
    .fbn-nav-spacer {
      display: none;
      width: 100%;
      margin: 0 !important;
      padding: 0 !important;
    }
    .fbn-nav-fixed-base {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      width: 100% !important;
      z-index: 99999 !important;
      background-color: var(--card-background, var(--surface-background, #FFFFFF)) !important;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22) !important;
      transition: transform 0.26s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease !important;
      will-change: transform, opacity !important;
    }
    .fbn-nav-hidden {
      transform: translateY(-120%) !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
    .fbn-nav-visible {
      transform: translateY(0) !important;
      opacity: 1 !important;
      pointer-events: auto !important;
    }
    .fbn-btn-transition {
      transition: transform 0.26s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease !important;
      will-change: transform, opacity !important;
    }
    .fbn-btn-hidden {
      transform: translateY(-80px) !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
    .fbn-btn-visible {
      transform: translateY(0) !important;
      opacity: 1 !important;
      pointer-events: auto !important;
    }
  `;
  if (!document.getElementById('fbn-smart-navbar-style')) {
    (document.head || document.documentElement).appendChild(styleEl);
  }

  let isFloating = false;
  let isHidden = false;
  let lastScrollY = 0;
  let scrollDownAccum = 0;
  let scrollUpAccum = 0;
  let spacer = null;

  function getScrollTop() {
    const docTop = document.documentElement ? document.documentElement.scrollTop : 0;
    const bodyTop = document.body ? document.body.scrollTop : 0;
    const vscroller = document.querySelector('div[data-type="vscroller"]');
    const vscrollerTop = vscroller ? vscroller.scrollTop : 0;
    return Math.max(window.scrollY || 0, docTop, bodyTop, vscrollerTop);
  }

  function getHeaderBundle() {
    const header = document.querySelector('#header, header, [role="banner"]');
    const tablist = document.querySelector('div[role="tablist"], div:has(> [role="tab"])');
    const settingsBtn = document.getElementById('custom-settings-btn');
    const accountBtn = document.getElementById('custom-account-btn');

    let navContainer = null;
    if (header) {
      if (tablist && header.parentElement && header.parentElement.contains(tablist) && header.parentElement.children.length <= 4) {
        navContainer = header.parentElement;
      } else {
        navContainer = header;
      }
    } else if (tablist) {
      navContainer = tablist.parentElement || tablist;
    } else {
      const root = document.getElementById('root');
      if (root && root.firstElementChild) {
        const fc = root.firstElementChild;
        if (fc.offsetHeight > 30 && fc.offsetHeight < 150) {
          navContainer = fc;
        }
      }
    }

    return { navContainer, settingsBtn, accountBtn };
  }

  function getOrCreateSpacer(target) {
    if (!spacer) {
      spacer = document.createElement('div');
      spacer.className = 'fbn-nav-spacer';
    }
    if (target && target.parentElement && spacer.parentElement !== target.parentElement) {
      target.parentElement.insertBefore(spacer, target);
    }
    return spacer;
  }

  function showNavbar(isTop) {
    const { navContainer, settingsBtn, accountBtn } = getHeaderBundle();
    if (!navContainer) return;

    const sp = getOrCreateSpacer(navContainer);

    if (isTop) {
      // Returned to top of document -> revert to natural flow without shadow
      navContainer.classList.remove('fbn-nav-fixed-base', 'fbn-nav-hidden');
      navContainer.classList.add('fbn-nav-visible');
      navContainer.style.boxShadow = 'none';
      if (sp) {
        sp.style.display = 'none';
        sp.style.height = '0px';
      }
      isFloating = false;
      isHidden = false;
    } else {
      // Floating quick-return in viewport
      const h = navContainer.offsetHeight || 52;
      if (sp && sp.offsetHeight !== h) {
        sp.style.display = 'block';
        sp.style.height = h + 'px';
      }
      navContainer.classList.add('fbn-nav-fixed-base');
      navContainer.classList.remove('fbn-nav-hidden');
      navContainer.classList.add('fbn-nav-visible');
      isFloating = true;
      isHidden = false;
    }

    // Restore action buttons
    [settingsBtn, accountBtn].forEach(btn => {
      if (btn) {
        btn.classList.add('fbn-btn-transition');
        btn.classList.remove('fbn-btn-hidden');
        btn.classList.add('fbn-btn-visible');
      }
    });
  }

  function hideNavbar() {
    const currentY = getScrollTop();
    if (currentY <= 30) return;
    if (document.activeElement && document.activeElement.matches('input, textarea')) return;

    const { navContainer, settingsBtn, accountBtn } = getHeaderBundle();
    if (!navContainer) return;

    const sp = getOrCreateSpacer(navContainer);
    const h = navContainer.offsetHeight || 52;
    if (sp && sp.offsetHeight !== h) {
      sp.style.display = 'block';
      sp.style.height = h + 'px';
    }

    navContainer.classList.add('fbn-nav-fixed-base');
    navContainer.classList.remove('fbn-nav-visible');
    navContainer.classList.add('fbn-nav-hidden');

    // Slide away action buttons
    [settingsBtn, accountBtn].forEach(btn => {
      if (btn) {
        btn.classList.add('fbn-btn-transition');
        btn.classList.remove('fbn-btn-visible');
        btn.classList.add('fbn-btn-hidden');
      }
    });

    isFloating = true;
    isHidden = true;
  }

  function handleScroll() {
    const currentY = getScrollTop();

    if (currentY <= 20) {
      showNavbar(true);
      scrollDownAccum = 0;
      scrollUpAccum = 0;
      lastScrollY = currentY;
      return;
    }

    const diff = currentY - lastScrollY;
    lastScrollY = currentY;

    if (diff > 5) {
      // Scrolling DOWN
      scrollDownAccum += diff;
      scrollUpAccum = 0;
      if (scrollDownAccum > 20) {
        hideNavbar();
      }
    } else if (diff < -5) {
      // Scrolling UP (even slight scroll)
      scrollUpAccum += Math.abs(diff);
      scrollDownAccum = 0;
      if (scrollUpAccum > 10) {
        showNavbar(false);
      }
    }
  }

  // Touch listener for instant tactile scroll-up response
  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      const curY = e.touches[0].clientY;
      const deltaY = curY - touchStartY; // positive = dragged down = user scrolled UP!
      if (deltaY > 12 && isHidden) {
        showNavbar(false);
        scrollDownAccum = 0;
        scrollUpAccum = 0;
      } else if (deltaY < -22 && !isHidden && getScrollTop() > 30) {
        hideNavbar();
        scrollDownAccum = 0;
        scrollUpAccum = 0;
      }
      touchStartY = curY;
    }
  }, { passive: true });

  window.addEventListener('scroll', handleScroll, { passive: true });
  document.addEventListener('scroll', handleScroll, { passive: true, capture: true });

  // Initial show on load
  setTimeout(() => showNavbar(true), 400);
})();
