// =========================================================================
// Smart Auto-Hiding & Quick-Return Navbar Engine (Facebook N)
// - Hides header & buttons when scrolling down into feed (clean fullscreen)
// - Instantly and stylishly reveals header & buttons on slight scroll-up
// =========================================================================
(function() {
  const isDesktop = typeof isDesktopMode === 'function' ? isDesktopMode() : (window.isDesktopMode ? window.isDesktopMode() : false);

  // CSS for smooth slide transitions without breaking layout
  const styleEl = document.createElement('style');
  styleEl.id = 'fbn-smart-navbar-style';
  styleEl.textContent = `
    .fbn-nav-transition {
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease !important;
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
  `;
  if (!document.getElementById('fbn-smart-navbar-style')) {
    (document.head || document.documentElement).appendChild(styleEl);
  }

  let isHidden = false;
  let lastScrollY = 0;
  let scrollUpDelta = 0;
  let scrollDownDelta = 0;

  function getScrollTop() {
    const docTop = document.documentElement ? document.documentElement.scrollTop : 0;
    const bodyTop = document.body ? document.body.scrollTop : 0;
    const vscroller = document.querySelector('div[data-type="vscroller"]');
    const vscrollerTop = vscroller ? vscroller.scrollTop : 0;
    return Math.max(window.scrollY || 0, docTop, bodyTop, vscrollerTop);
  }

  function getNavElements() {
    const elements = new Set();

    if (isDesktop) {
      const banner = document.querySelector('div[role="banner"]');
      if (banner) elements.add(banner);
    } else {
      // 1. Facebook top header / banner
      const banner = document.querySelector('header') ||
                     document.querySelector('div#header') ||
                     document.querySelector('div[role="banner"]') ||
                     document.querySelector('div[data-mcomponent="MContainer"]:has(input[type="search"])') ||
                     document.querySelector('div[data-tti-phase="-1"][data-mcomponent="MContainer"].m');
      if (banner) elements.add(banner);

      // 2. Tablist (if separate from header)
      const tablist = document.querySelector('div[role="tablist"]') ||
                      document.querySelector('div[data-mcomponent="MContainer"]:has(div[role="tab"])');
      if (tablist && (!banner || !banner.contains(tablist))) {
        elements.add(tablist);
      }

      // 3. Top-level fixed/sticky headers
      const candidates = document.querySelectorAll('div[data-mcomponent="MContainer"].m, div[data-type="container"].m');
      candidates.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 10 && rect.bottom > 30 && rect.bottom <= 130 && rect.width >= window.innerWidth * 0.7) {
          elements.add(el);
        }
      });
    }

    // Custom Nobook action buttons (Settings and Account switcher)
    const settingsBtn = document.getElementById('custom-settings-btn');
    const accountBtn = document.getElementById('custom-account-btn');
    if (settingsBtn) elements.add(settingsBtn);
    if (accountBtn) elements.add(accountBtn);

    return Array.from(elements);
  }

  function showNavbar() {
    if (!isHidden) return;
    isHidden = false;
    const els = getNavElements();
    els.forEach(el => {
      el.classList.add('fbn-nav-transition');
      el.classList.remove('fbn-nav-hidden');
      el.classList.add('fbn-nav-visible');
    });
  }

  function hideNavbar() {
    if (isHidden) return;
    // Never hide if near top or if user is interacting with an input
    if (getScrollTop() <= 30) return;
    if (document.activeElement && document.activeElement.matches('input, textarea')) return;

    isHidden = true;
    const els = getNavElements();
    els.forEach(el => {
      el.classList.add('fbn-nav-transition');
      el.classList.remove('fbn-nav-visible');
      el.classList.add('fbn-nav-hidden');
    });
  }

  function handleScrollUpdate() {
    const currentY = getScrollTop();

    // At top -> Always show
    if (currentY <= 25) {
      showNavbar();
      scrollUpDelta = 0;
      scrollDownDelta = 0;
      lastScrollY = currentY;
      return;
    }

    const diff = currentY - lastScrollY;
    lastScrollY = currentY;

    if (diff > 5) {
      // Scrolling DOWN
      scrollDownDelta += diff;
      scrollUpDelta = 0;
      if (scrollDownDelta > 20) {
        hideNavbar();
      }
    } else if (diff < -5) {
      // Scrolling UP (even slight scroll up)
      scrollUpDelta += Math.abs(diff);
      scrollDownDelta = 0;
      if (scrollUpDelta > 10) {
        showNavbar();
      }
    }
  }

  // Touch listener for instant tactile scroll-up response on touchscreens
  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      const touchY = e.touches[0].clientY;
      const swipeDelta = touchY - touchStartY; // positive = finger moved down = user scrolling UP
      if (swipeDelta > 12 && isHidden) {
        // Finger moved down by 12px -> INSTANTLY SHOW NAVBAR!
        showNavbar();
        scrollDownDelta = 0;
        scrollUpDelta = 0;
      } else if (swipeDelta < -25 && !isHidden && getScrollTop() > 30) {
        // Finger moved up by 25px -> hide navbar
        hideNavbar();
        scrollDownDelta = 0;
        scrollUpDelta = 0;
      }
      touchStartY = touchY;
    }
  }, { passive: true });

  window.addEventListener('scroll', handleScrollUpdate, { passive: true });
  document.addEventListener('scroll', handleScrollUpdate, { passive: true, capture: true });

  // Initial show
  setTimeout(showNavbar, 500);
})();
