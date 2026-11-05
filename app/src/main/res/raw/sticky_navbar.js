// =========================================================================
// Smart Auto-Hiding & Quick-Return Navbar Engine (Facebook N)
// - Hides header & buttons when scrolling down into feed (clean fullscreen)
// - Instantly and stylishly reveals header & buttons on slight scroll-up
// =========================================================================
(function() {
  'use strict';
  if (window._fbnSmartNavbarInitialized) return;
  window._fbnSmartNavbarInitialized = true;

  let isHidden = false;
  let lastScrollY = 0;
  let scrollDownAccum = 0;
  let scrollUpAccum = 0;

  function getScrollTop() {
    const docTop = document.documentElement ? document.documentElement.scrollTop : 0;
    const bodyTop = document.body ? document.body.scrollTop : 0;
    const vscroller = document.querySelector('div[data-type="vscroller"]');
    const vscrollerTop = vscroller ? vscroller.scrollTop : 0;
    return Math.max(window.scrollY || 0, docTop, bodyTop, vscrollerTop);
  }

  function getNavbarElements() {
    const elements = [];

    // 1. Mobile top header (#header or header or div[role="banner"])
    const header = document.querySelector('#header') ||
                   document.querySelector('header') ||
                   document.querySelector('div[role="banner"]');
    if (header) elements.push(header);

    // 2. Tablist (Home, Friends, Videos, Notifications, Menu)
    const tablist = document.querySelector('div[role="tablist"]');
    if (tablist && (!header || !header.contains(tablist))) {
      elements.push(tablist);
    } else if (!tablist) {
      // Fallback: search for tab container
      const anyTab = document.querySelector('[role="tab"]');
      if (anyTab) {
        const parent = anyTab.parentElement?.parentElement;
        if (parent && parent !== document.body && (!header || !header.contains(parent))) {
          elements.push(parent);
        }
      }
    }

    // 3. Custom buttons
    const settingsBtn = document.getElementById('custom-settings-btn');
    const accountBtn = document.getElementById('custom-account-btn');
    if (settingsBtn) elements.push(settingsBtn);
    if (accountBtn) elements.push(accountBtn);

    return elements;
  }

  function showNavbar(isTop) {
    const elements = getNavbarElements();
    if (elements.length === 0) return;

    if (isTop) {
      // Near top of document -> revert to natural flow without shadow
      elements.forEach(el => {
        if (el.id === 'custom-settings-btn' || el.id === 'custom-account-btn') {
          el.style.removeProperty('transform');
          el.style.removeProperty('opacity');
          el.style.removeProperty('pointer-events');
          return;
        }
        el.style.removeProperty('position');
        el.style.removeProperty('top');
        el.style.removeProperty('left');
        el.style.removeProperty('right');
        el.style.removeProperty('width');
        el.style.removeProperty('z-index');
        el.style.removeProperty('box-shadow');
        el.style.removeProperty('transform');
        el.style.removeProperty('transition');
        el.style.removeProperty('background-color');
        el.style.removeProperty('opacity');
        el.style.removeProperty('pointer-events');
      });
      isHidden = false;
      return;
    }

    // Floating quick-return in viewport
    let currentTop = 0;
    elements.forEach(el => {
      if (el.id === 'custom-settings-btn' || el.id === 'custom-account-btn') {
        el.style.setProperty('transition', 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease', 'important');
        el.style.setProperty('transform', 'translateY(0)', 'important');
        el.style.setProperty('opacity', '1', 'important');
        el.style.setProperty('pointer-events', 'auto', 'important');
        return;
      }

      el.style.setProperty('position', 'fixed', 'important');
      el.style.setProperty('top', currentTop + 'px', 'important');
      el.style.setProperty('left', '0px', 'important');
      el.style.setProperty('right', '0px', 'important');
      el.style.setProperty('width', '100%', 'important');
      el.style.setProperty('z-index', '99998', 'important');
      el.style.setProperty('background-color', 'var(--card-background, var(--surface-background, #FFFFFF))', 'important');
      el.style.setProperty('box-shadow', '0 3px 14px rgba(0,0,0,0.22)', 'important');
      el.style.setProperty('transition', 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease', 'important');
      el.style.setProperty('transform', 'translateY(0)', 'important');
      el.style.setProperty('opacity', '1', 'important');
      el.style.setProperty('pointer-events', 'auto', 'important');

      currentTop += el.offsetHeight || 44;
    });

    isHidden = false;
  }

  function hideNavbar() {
    const currentY = getScrollTop();
    if (currentY <= 30) return;
    if (document.activeElement && document.activeElement.matches('input, textarea')) return;

    const elements = getNavbarElements();
    if (elements.length === 0) return;

    elements.forEach(el => {
      if (el.id === 'custom-settings-btn' || el.id === 'custom-account-btn') {
        el.style.setProperty('transition', 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease', 'important');
        el.style.setProperty('transform', 'translateY(-80px)', 'important');
        el.style.setProperty('opacity', '0', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
        return;
      }

      el.style.setProperty('transition', 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease', 'important');
      el.style.setProperty('transform', 'translateY(-120%)', 'important');
      el.style.setProperty('opacity', '0', 'important');
      el.style.setProperty('pointer-events', 'none', 'important');
    });

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

    if (diff > 0) {
      // Scrolling DOWN -> Accumulate downward scroll
      scrollDownAccum += diff;
      scrollUpAccum = 0;
      if (scrollDownAccum > 25) {
        hideNavbar();
      }
    } else if (diff < 0) {
      // Scrolling UP -> Accumulate upward scroll (even 1 pixel ticks!)
      scrollUpAccum += Math.abs(diff);
      scrollDownAccum = 0;
      if (scrollUpAccum > 12) {
        showNavbar(false);
      }
    }
  }

  // Touch listener for instant tactile scroll-up response
  let touchStartY = 0;
  let lastTouchY = 0;

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartY = e.touches[0].clientY;
      lastTouchY = touchStartY;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      const curY = e.touches[0].clientY;
      const totalDelta = curY - touchStartY; // positive = dragged down = scrolled UP!
      const frameDelta = curY - lastTouchY;
      lastTouchY = curY;

      // If user reversed touch direction, reset anchor
      if ((totalDelta > 0 && frameDelta < -4) || (totalDelta < 0 && frameDelta > 4)) {
        touchStartY = curY;
        return;
      }

      if (totalDelta > 15 && isHidden) {
        showNavbar(false);
        scrollDownAccum = 0;
        scrollUpAccum = 0;
      } else if (totalDelta < -30 && !isHidden && getScrollTop() > 30) {
        hideNavbar();
        scrollDownAccum = 0;
        scrollUpAccum = 0;
      }
    }
  }, { passive: true });

  window.addEventListener('scroll', handleScroll, { passive: true });
  document.addEventListener('scroll', handleScroll, { passive: true, capture: true });

  // Initial show on load
  setTimeout(() => showNavbar(true), 400);
})();
