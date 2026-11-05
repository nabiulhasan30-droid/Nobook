// =========================================================================
// Smart Auto-Hiding & Quick-Return Navbar (Facebook N)
// - Fullscreen while scrolling down into feed
// - Stylishly slides down on slight scroll-up for instant access to notifications & menu
// =========================================================================
(function() {
  const TRANSITION = 'transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.2s ease';
  let isBarsVisible = true;
  let lastScrollY = 0;
  let scrollUpDistance = 0;
  let scrollDownDistance = 0;

  let cachedNavbar = null;
  let cachedTabbar = null;
  let cachedScroller = null;
  let navbarHeight = 44;
  let tabbarHeight = 44;

  function findElements() {
    if (window.isDesktopMode?.()) {
      const banner = document.querySelector('div[role="banner"]');
      return { navbar: banner, tabbar: null, isDesktop: true };
    }

    // Top Header / Navbar (Facebook logo, search, icons)
    const navbar = document.querySelector('div[data-tti-phase="-1"][data-mcomponent="MContainer"][data-type="container"][data-focusable="true"].m') ||
                   document.querySelector('div[role="banner"]') ||
                   document.querySelector('div[data-mcomponent="MContainer"]:has(input[type="search"])') ||
                   document.querySelector('header');

    // Tabbar (Feed, Friends, Messages, Notifications, Video, Menu tabs)
    const tabbar = document.querySelector('div[role="tablist"][data-tti-phase="-1"][data-type="container"][data-mcomponent="MContainer"].m') ||
                   document.querySelector('div[role="tablist"]') ||
                   document.querySelector('div[data-mcomponent="MContainer"]:has(div[role="tab"])');

    // Scroller container
    const scroller = document.querySelector('div[data-type="vscroller"][data-is-pull-to-refresh-allowed="true"]') ||
                     document.querySelector('div[data-type="vscroller"]');

    return { navbar, tabbar, scroller, isDesktop: false };
  }

  function getScrollTop() {
    const docTop = document.documentElement ? document.documentElement.scrollTop : 0;
    const bodyTop = document.body ? document.body.scrollTop : 0;
    const vscroller = cachedScroller || document.querySelector('div[data-type="vscroller"]');
    const vscrollerTop = vscroller ? vscroller.scrollTop : 0;
    return Math.max(window.scrollY || 0, docTop, bodyTop, vscrollerTop);
  }

  function getCustomButtons() {
    return [
      document.getElementById('custom-settings-btn'),
      document.getElementById('custom-account-btn')
    ].filter(Boolean);
  }

  function showBars() {
    if (isBarsVisible) return;
    isBarsVisible = true;

    if (cachedNavbar) {
      cachedNavbar.style.transform = 'translateY(0)';
      cachedNavbar.style.opacity = '1';
    }
    if (cachedTabbar) {
      cachedTabbar.style.transform = 'translateY(0)';
      cachedTabbar.style.opacity = '1';
    }

    getCustomButtons().forEach(btn => {
      btn.style.transform = 'translateY(0)';
      btn.style.opacity = '1';
    });
  }

  function hideBars() {
    if (!isBarsVisible) return;

    // Do not hide if at top or typing in search/input
    if (getScrollTop() <= 20) return;
    if (document.activeElement && document.activeElement.matches('input, textarea')) return;

    isBarsVisible = false;
    const totalHeight = (navbarHeight || 48) + (cachedTabbar ? (tabbarHeight || 44) : 0);

    if (cachedNavbar) {
      cachedNavbar.style.transform = `translateY(-${totalHeight + 12}px)`;
    }
    if (cachedTabbar) {
      cachedTabbar.style.transform = `translateY(-${totalHeight + 12}px)`;
    }

    getCustomButtons().forEach(btn => {
      btn.style.transform = `translateY(-${totalHeight + 12}px)`;
    });
  }

  function setupElements() {
    const { navbar, tabbar, scroller, isDesktop } = findElements();
    cachedNavbar = navbar;
    cachedTabbar = tabbar;
    cachedScroller = scroller;

    if (isDesktop && navbar) {
      navbar.style.position = 'fixed';
      navbar.style.top = '0';
      navbar.style.left = '0';
      navbar.style.width = '100%';
      navbar.style.zIndex = '1000';
      navbar.style.transition = TRANSITION;
      return;
    }

    if (navbar) {
      const h = parseFloat(getComputedStyle(navbar).height) || parseFloat(navbar.style.height) || 0;
      if (h > 20) navbarHeight = h;

      Object.assign(navbar.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        zIndex: '1000',
        pointerEvents: 'auto',
        transition: TRANSITION,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      });
    }

    if (tabbar) {
      const th = parseFloat(getComputedStyle(tabbar).height) || parseFloat(tabbar.style.height) || 0;
      if (th > 20) tabbarHeight = th;

      Object.assign(tabbar.style, {
        position: 'fixed',
        top: `${navbarHeight}px`,
        left: '0',
        width: '100%',
        zIndex: '999',
        pointerEvents: 'auto',
        transition: TRANSITION,
        boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
      });
    }

    getCustomButtons().forEach(btn => {
      btn.style.transition = TRANSITION;
    });

    const totalHeight = (navbar ? navbarHeight : 0) + (tabbar ? tabbarHeight : 0);

    if (scroller && totalHeight > 0) {
      const scrollContent = scroller.querySelector(':scope > div:not(.pull-to-refresh-spinner-container)');
      if (scrollContent) {
        scrollContent.style.marginTop = `${totalHeight}px`;
      } else {
        scroller.style.paddingTop = `${totalHeight}px`;
      }
      if (window.isFeed?.()) scroller.style.paddingBottom = '0';
    } else if (totalHeight > 0) {
      document.body.style.paddingTop = `${totalHeight}px`;
    }

    Object.assign(document.body.style, {
      marginTop: '0',
      overflow: 'visible',
      height: '100%'
    });
  }

  // Handle scroll delta
  function onScrollDelta(delta) {
    const currentY = getScrollTop();

    // Always show when near top
    if (currentY <= 25) {
      showBars();
      scrollUpDistance = 0;
      scrollDownDistance = 0;
      return;
    }

    if (delta > 0) {
      // Scrolling DOWN into feed -> hide bars for fullscreen
      scrollDownDistance += delta;
      scrollUpDistance = 0;
      if (scrollDownDistance > 16) {
        hideBars();
      }
    } else if (delta < 0) {
      // Scrolling UP towards top -> stylishly show bars
      scrollUpDistance += Math.abs(delta);
      scrollDownDistance = 0;
      if (scrollUpDistance > 8) {
        showBars();
      }
    }
  }

  // Scroll listener
  function handleScroll() {
    const currentY = getScrollTop();
    const delta = currentY - lastScrollY;
    lastScrollY = currentY;
    onScrollDelta(delta);
  }

  // Touch listener for instant responsive feedback on mobile
  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      const touchY = e.touches[0].clientY;
      const delta = touchStartY - touchY; // positive = swipe up = scroll down
      touchStartY = touchY;
      onScrollDelta(delta);
    }
  }, { passive: true });

  window.addEventListener('scroll', handleScroll, { passive: true });
  document.addEventListener('scroll', handleScroll, { passive: true, capture: true });

  setupElements();
  new MutationObserver(() => {
    setupElements();
  }).observe(document.body, { childList: true, subtree: true });
})();
