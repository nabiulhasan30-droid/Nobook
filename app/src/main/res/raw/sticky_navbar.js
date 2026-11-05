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
  let cachedNavBundle = null;
  let navSpacer = null;

  function getScrollTop() {
    const docTop = document.documentElement ? document.documentElement.scrollTop : 0;
    const bodyTop = document.body ? document.body.scrollTop : 0;
    const vscroller = document.querySelector('div[data-type="vscroller"]');
    const vscrollerTop = vscroller ? vscroller.scrollTop : 0;
    return Math.max(window.scrollY || 0, docTop, bodyTop, vscrollerTop);
  }

  function isValidNav(el) {
    if (!el || !document.contains(el)) return false;
    const h = el.offsetHeight;
    const w = el.offsetWidth;
    return h >= 35 && h <= 140 && w >= window.innerWidth * 0.7;
  }

  // Robust Geometric & Semantic Top Bar Finder (works on all FB Web versions)
  function findNavBundle() {
    if (isValidNav(cachedNavBundle)) {
      return cachedNavBundle;
    }

    // 1. Tagged element
    const tagged = document.querySelector('[data-fbn-nav-bundle="true"]');
    if (isValidNav(tagged)) {
      cachedNavBundle = tagged;
      return tagged;
    }

    // 2. Semantic query selectors (ignore 0-height dummy elements)
    const semanticCandidates = document.querySelectorAll('#header, header, div[role="banner"]');
    for (let i = 0; i < semanticCandidates.length; i++) {
      const el = semanticCandidates[i];
      if (isValidNav(el)) {
        el.setAttribute('data-fbn-nav-bundle', 'true');
        cachedNavBundle = el;
        return el;
      }
    }

    // 3. Anchor by Menu icon 󱥊 (Facebook PUA Icon for mobile menu)
    const spans = document.querySelectorAll('span');
    for (let i = 0; i < spans.length; i++) {
      if (spans[i].textContent === '󱥊') {
        let p = spans[i].parentElement;
        while (p && p !== document.body && p !== document.documentElement) {
          if (isValidNav(p)) {
            const parent = p.parentElement;
            if (isValidNav(parent)) p = parent;
            p.setAttribute('data-fbn-nav-bundle', 'true');
            cachedNavBundle = p;
            return p;
          }
          p = p.parentElement;
        }
      }
    }

    // 4. Geometric detection based on document position (works even when scrolled down!)
    const curScroll = getScrollTop();
    const divs = document.querySelectorAll('#root > div, #viewport > div, body > div, .wbloks_1');
    for (let i = 0; i < divs.length; i++) {
      const el = divs[i];
      const rect = el.getBoundingClientRect();
      const docTop = rect.top + curScroll;
      if (docTop >= -10 && docTop <= 80 && isValidNav(el)) {
        el.setAttribute('data-fbn-nav-bundle', 'true');
        cachedNavBundle = el;
        return el;
      }
    }

    return null;
  }

  function getActionButtons() {
    const s = document.getElementById('custom-settings-btn');
    const a = document.getElementById('custom-account-btn');
    return [s, a].filter(Boolean);
  }

  function showNavbar(isTop) {
    const nav = findNavBundle();
    const buttons = getActionButtons();

    if (!nav) return;

    if (isTop) {
      // Near top of document (scrollY <= 20) -> restore to natural flow
      nav.style.removeProperty('position');
      nav.style.removeProperty('top');
      nav.style.removeProperty('left');
      nav.style.removeProperty('right');
      nav.style.removeProperty('width');
      nav.style.removeProperty('z-index');
      nav.style.removeProperty('box-shadow');
      nav.style.removeProperty('transform');
      nav.style.removeProperty('transition');
      nav.style.removeProperty('background-color');
      nav.style.removeProperty('opacity');
      nav.style.removeProperty('pointer-events');

      if (navSpacer) {
        navSpacer.style.display = 'none';
        navSpacer.style.height = '0px';
      }
      isHidden = false;
      return;
    }

    // Floating quick-return in viewport
    const h = nav.offsetHeight || 50;
    if (!navSpacer) {
      navSpacer = document.createElement('div');
      navSpacer.id = 'fbn-navbar-spacer';
      navSpacer.style.cssText = 'display:none;width:100%;margin:0;padding:0;';
    }
    if (nav.parentElement && navSpacer.parentElement !== nav.parentElement) {
      nav.parentElement.insertBefore(navSpacer, nav);
    }
    navSpacer.style.display = 'block';
    navSpacer.style.height = h + 'px';

    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    const navBg = (bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)' && bodyBg !== 'transparent') ? bodyBg : 'var(--card-background, var(--surface-background, #FFFFFF))';

    nav.style.setProperty('position', 'fixed', 'important');
    nav.style.setProperty('top', '0px', 'important');
    nav.style.setProperty('left', '0px', 'important');
    nav.style.setProperty('right', '0px', 'important');
    nav.style.setProperty('width', '100%', 'important');
    nav.style.setProperty('z-index', '999999', 'important');
    nav.style.setProperty('background-color', navBg, 'important');
    nav.style.setProperty('box-shadow', '0 4px 16px rgba(0,0,0,0.22)', 'important');
    nav.style.setProperty('transition', 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease', 'important');
    nav.style.setProperty('transform', 'translateY(0)', 'important');
    nav.style.setProperty('opacity', '1', 'important');
    nav.style.setProperty('pointer-events', 'auto', 'important');

    buttons.forEach(btn => {
      btn.style.setProperty('transition', 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease', 'important');
      btn.style.setProperty('transform', 'translateY(0)', 'important');
      btn.style.setProperty('opacity', '1', 'important');
      btn.style.setProperty('pointer-events', 'auto', 'important');
    });

    isHidden = false;
  }

  function hideNavbar() {
    const currentY = getScrollTop();
    if (currentY <= 30) return;
    if (document.activeElement && document.activeElement.matches('input, textarea')) return;

    const nav = findNavBundle();
    const buttons = getActionButtons();

    if (!nav) return;

    const h = nav.offsetHeight || 50;
    if (!navSpacer) {
      navSpacer = document.createElement('div');
      navSpacer.id = 'fbn-navbar-spacer';
      navSpacer.style.cssText = 'display:none;width:100%;margin:0;padding:0;';
    }
    if (nav.parentElement && navSpacer.parentElement !== nav.parentElement) {
      nav.parentElement.insertBefore(navSpacer, nav);
    }
    navSpacer.style.display = 'block';
    navSpacer.style.height = h + 'px';

    nav.style.setProperty('position', 'fixed', 'important');
    nav.style.setProperty('top', '0px', 'important');
    nav.style.setProperty('left', '0px', 'important');
    nav.style.setProperty('right', '0px', 'important');
    nav.style.setProperty('width', '100%', 'important');
    nav.style.setProperty('z-index', '999999', 'important');
    nav.style.setProperty('transition', 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease', 'important');
    nav.style.setProperty('transform', 'translateY(-120%)', 'important');
    nav.style.setProperty('opacity', '0', 'important');
    nav.style.setProperty('pointer-events', 'none', 'important');

    buttons.forEach(btn => {
      btn.style.setProperty('transition', 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease', 'important');
      btn.style.setProperty('transform', 'translateY(-80px)', 'important');
      btn.style.setProperty('opacity', '0', 'important');
      btn.style.setProperty('pointer-events', 'none', 'important');
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
      scrollDownAccum += diff;
      scrollUpAccum = 0;
      if (scrollDownAccum > 20) {
        hideNavbar();
      }
    } else if (diff < 0) {
      scrollUpAccum += Math.abs(diff);
      scrollDownAccum = 0;
      if (scrollUpAccum > 10) {
        showNavbar(false);
      }
    }
  }

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
      const totalDelta = curY - touchStartY; // positive = dragged finger down = scrolled UP!
      const frameDelta = curY - lastTouchY;
      lastTouchY = curY;

      if ((totalDelta > 0 && frameDelta < -4) || (totalDelta < 0 && frameDelta > 4)) {
        touchStartY = curY;
        return;
      }

      if (totalDelta > 15 && isHidden) {
        showNavbar(false);
        scrollDownAccum = 0;
        scrollUpAccum = 0;
      } else if (totalDelta < -25 && !isHidden && getScrollTop() > 30) {
        hideNavbar();
        scrollDownAccum = 0;
        scrollUpAccum = 0;
      }
    }
  }, { passive: true });

  window.addEventListener('scroll', handleScroll, { passive: true });
  document.addEventListener('scroll', handleScroll, { passive: true, capture: true });

  // Multiple detection passes on load
  setTimeout(findNavBundle, 200);
  setTimeout(findNavBundle, 600);
  setTimeout(findNavBundle, 1500);
  setTimeout(() => showNavbar(true), 400);
})();
