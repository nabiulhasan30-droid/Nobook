
// desktop mode identifier
(() => {
    window.isDesktopMode = () => {
        return document.querySelector('html[id="facebook"]') !== null;
    };
    window.isDesktop = window.isDesktopMode;
})();
var isDesktopMode = function() { return window.isDesktopMode ? window.isDesktopMode() : false; };

// Feed identifier
(() => {
    window.isFeed = () => {
        const isHomeUrl = window.location.pathname === '/' &&
            (window.location.hostname === 'm.facebook.com' || window.location.hostname === 'www.facebook.com');

        if (window.isDesktopMode()) return isHomeUrl;

        const hasSpecialButton = Array.from(document.querySelectorAll('[role="button"] span'))
            .some(span => span.textContent === '󱥆');

        return isHomeUrl && hasSpecialButton;
    };
})();





(function() {
    if (!window.isDesktopMode()) return;

    document.documentElement.style.fontSize = '18px';


    // do not stick the navbar by default
    (() => {
      const waitForBanner = () => new Promise(resolve => {
        const existing = document.querySelector('div[role="banner"]');
        if (existing) return resolve(existing);

        new MutationObserver((mutations, obs) => {
          for (const { addedNodes } of mutations) {
            for (const node of addedNodes) {
              if (node.nodeType === 1 && node.matches('div[role="banner"]')) {
                obs.disconnect();
                return resolve(node);
              }
            }
          }
        }).observe(document.body, { childList: true, subtree: true });
      });

      const forceAbsolute = el => {
        if (el?.classList.contains('xixxii4')) {
          el.style.setProperty('position', 'absolute', 'important');
        }
      };

      waitForBanner().then(banner => {
        const style = document.createElement('style');
        style.textContent = `
          div[role="banner"].xixxii4,
          div[role="banner"] .xixxii4 {
            position: absolute !important;
          }
        `;
        document.head.appendChild(style);

        forceAbsolute(banner);
        banner.querySelectorAll('.xixxii4').forEach(forceAbsolute);

        new MutationObserver(mutations => {
          for (const m of mutations) {
            if (m.type === 'childList') {
              m.addedNodes.forEach(n => {
                forceAbsolute(n);
                n.querySelectorAll?.('.xixxii4')?.forEach(forceAbsolute);
              });
            } else if (m.type === 'attributes' && m.attributeName === 'class') {
              forceAbsolute(m.target);
            }
          }
        }).observe(banner, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
      });
    })();


    // remove "send" button to save space
    // remove the third element in the interaction bar if nb is 4
    (function() {
      const parentSelector = '.xbmvrgn.x1diwwjn';
      const childSelector = '.x10b6aqq.x1yrsyyn.xs83m0k';

      function checkAndRemoveThird(parent) {
        const children = parent.querySelectorAll(childSelector);
        if (children.length === 4) children[2].remove();
      }

      document.querySelectorAll(parentSelector).forEach(checkAndRemoveThird);

      const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              if (node.matches(parentSelector)) {
                checkAndRemoveThird(node);
              }
              node.querySelectorAll(parentSelector).forEach(checkAndRemoveThird);
            }
          });
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    })();
})();


// Scroll to top on back-press at feed.
(() => {
    window.backHandlerNB = () => {

        const dialogs = document.querySelectorAll('div[role="dialog"]');
        const isMenu = document.querySelector('div[role="menu"]')

        function scrollToTop() {
            if (window.scrollY !== 0) {
              // to interrupt any current scroll event.
              document.body.style.overflow = 'hidden';
              setTimeout(() => {
                 document.body.style.overflow = '';
                 window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 30);
              return "scrolling";
           } else return "exit";
        }

        if (window.isDesktopMode()) {
            if (window.isFeed() && !isMenu && dialogs.length === 1)
                return scrollToTop();
            else if (isMenu || dialogs.length > 1) {
                const escapeEvent = new KeyboardEvent('keydown', {
                    key: 'Escape',
                    code: 'Escape',
                    keyCode: 27,
                    which: 27,
                    bubbles: true,
                    cancelable: true
                });
                window.dispatchEvent(escapeEvent);
                return "true";
            } else return "false"
        } else if (window.isFeed() && !isMenu && !dialogs.length) {
            return scrollToTop();
        } else return "false";
    }
})();

// Clean Native Text Selection for Facebook Posts, Comments & Captions (Scoped strictly to individual posts)
(() => {
  const selectionStyle = document.createElement('style');
  selectionStyle.id = 'fbn-clean-selection-style';
  selectionStyle.textContent = `
    /* Prevent whole page from being selected when tapping "Select All" */
    html, body, #root, #viewport, [role="banner"], [role="navigation"], [role="feed"], header, nav, footer {
      -webkit-user-select: none !important;
      user-select: none !important;
    }

    /* ONLY post bodies, comments, captions and user readable text are selectable */
    article div[dir="auto"],
    [role="article"] div[dir="auto"],
    [data-ad-preview="message"],
    [data-ad-preview="message"] *,
    [data-ad-comet-preview="message"],
    [data-ad-comet-preview="message"] *,
    div[dir="auto"] {
      -webkit-user-select: text !important;
      user-select: text !important;
      -webkit-touch-callout: default !important;
    }

    /* Never select action buttons, icons, tabs, toolbars */
    button, [role="button"], [role="button"] *, [role="tab"], [role="tab"] *,
    [role="toolbar"], [role="toolbar"] *, i, svg, [role="img"] {
      -webkit-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
    }

    /* Form input fields remain normal */
    input, textarea {
      -webkit-user-select: auto !important;
      user-select: auto !important;
    }

    ::selection {
      background: #1877F2 !important;
      color: #FFFFFF !important;
    }
    ::-webkit-selection {
      background: #1877F2 !important;
      color: #FFFFFF !important;
    }
  `;
  if (!document.getElementById('fbn-clean-selection-style')) {
    (document.head || document.documentElement).appendChild(selectionStyle);
  }

  // Active post containment helper so "Select All" ONLY selects the current post
  let activePostContainer = null;

  function findPostTarget(node) {
    if (!node || node === document.body || node === document.documentElement) return null;
    const el = node.nodeType === 1 ? node : node.parentElement;
    if (!el) return null;

    return el.closest('[data-ad-preview="message"]') ||
           el.closest('[data-ad-comet-preview="message"]') ||
           el.closest('article div[dir="auto"]') ||
           el.closest('[role="article"] div[dir="auto"]') ||
           (el.closest('div[dir="auto"]') && !el.closest('[role="banner"]') && !el.closest('[role="navigation"]') ? el.closest('div[dir="auto"]') : null) ||
           el.closest('article') ||
           el.closest('[role="article"]');
  }

  ['pointerdown', 'touchstart', 'mousedown'].forEach(eventType => {
    document.addEventListener(eventType, (e) => {
      const post = findPostTarget(e.target);
      if (post) {
        activePostContainer = post;
      }
    }, { passive: true, capture: true });
  });

  // Clamp selection strictly to active post when Android's "Select All" fires
  let isClamping = false;
  document.addEventListener('selectionchange', () => {
    if (isClamping) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

    const targetPost = activePostContainer || findPostTarget(sel.anchorNode);
    if (!targetPost) return;

    const range = sel.getRangeAt(0);
    const common = range.commonAncestorContainer;

    // If selection expanded beyond the target post (e.g. user pressed "Select All" on Android menu)
    if (!targetPost.contains(common) && common !== targetPost) {
      isClamping = true;
      try {
        const newRange = document.createRange();
        newRange.selectNodeContents(targetPost);
        sel.removeAllRanges();
        sel.addRange(newRange);
      } catch (err) {
      } finally {
        setTimeout(() => { isClamping = false; }, 60);
      }
    }
  });

  // Keyboard shortcut Ctrl+A / Cmd+A containment
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      const targetPost = activePostContainer || findPostTarget(window.getSelection()?.anchorNode);
      if (targetPost && !e.target.matches?.('input, textarea')) {
        e.preventDefault();
        e.stopPropagation();
        const sel = window.getSelection();
        sel.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(targetPost);
        sel.addRange(range);
      }
    }
  }, { capture: true });
})();

// Dynamic Custom Font Family Injection (Safe typography: strictly for post text, 100% preserving Facebook Icon Fonts)
(() => {
  window.applyFacebookFont = function(fontCss, importUrl, fontId) {
    let styleEl = document.getElementById('fbn-custom-font-style');

    // If default font or empty, remove any injected font overrides so Facebook uses 100% stock native fonts and icons!
    if (!fontCss || fontId === 'default') {
      if (styleEl) styleEl.remove();
      return;
    }

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'fbn-custom-font-style';
      (document.head || document.documentElement).appendChild(styleEl);
    }

    const importRule = (importUrl && importUrl !== 'null') ? `@import url('${importUrl}');\n` : '';
    styleEl.textContent = `
      ${importRule}
      /* Apply custom font ONLY to user post text, comments and readable body */
      article div[dir="auto"],
      [role="article"] div[dir="auto"],
      [data-ad-preview="message"],
      [data-ad-preview="message"] *,
      [data-ad-comet-preview="message"],
      [data-ad-comet-preview="message"] *,
      p,
      .native-text {
        font-family: ${fontCss} !important;
      }

      /* STRICTLY PRESERVE Facebook icon fonts, SVGs, reactions and badges - NEVER override */
      i, svg, [role="img"], [data-icon], [class*="icon"], [class*="sp_"], [class*="sx_"],
      [data-visualcompletion], [role="button"] span, [role="tab"] span, header span, nav span,
      [role="navigation"] span, [role="banner"] span {
        font-family: inherit !important;
      }
    `;
  };
})();

// Enhance Loading Overlay Script
(function() {
    function applyOverlayStyle() {
        const overlays = document.querySelectorAll('.loading-overlay');
        overlays.forEach(overlay => {
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
        });
    }
    applyOverlayStyle();

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length)
                applyOverlayStyle();
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();

// Hide facebook download button at login page.
(function() {
    const element = document.querySelector('div[data-bloks-name="bk.components.Flexbox"].wbloks_1');
    if (element) element.remove();
})();

// Hide annoying bottom banners
const observer = new MutationObserver(() => {

  if (location.pathname === '/'
  && document.querySelector('div[role="button"][aria-label*="Facebook"]') === null) return;

  const element = document.querySelector('.bottom.fixed-container');
  if (
    element &&
    !element.hasAttribute('data-shift-on-keyboard-shown')
  ) {
    const heightAttr = element.getAttribute('data-actual-height');
    if (heightAttr && parseInt(heightAttr, 10) < 80) {
      element.style.display = 'none';
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });


// Hold Effect Script
(function() {
  const style = document.createElement('style');
  style.innerHTML = '* { -webkit-tap-highlight-color: rgba(180, 180, 180, 0.35); }';
  document.head.appendChild(style);
})();


/* The below scripts are specific to com.ycngmn.Nobook application. */

(() => {
  const onReady = (fn) => {
    if (document.readyState === 'loading')
      document.addEventListener('DOMContentLoaded', fn);
     else fn();
  };

  onReady(() => {
    const BUTTON_ID = 'custom-settings-btn';
    const ACCOUNT_BTN_ID = 'custom-account-btn';

    const ICON_SVG = `
      <svg width="28" height="28" fill="%FILL%" viewBox="0 0 24 24">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M9.586 2.586A2 2 0 0 1 11 2h2a2 2 0 0 1 2 2v.089l.473.196.063-.063a2.002 2.002 0 0 1 2.828 0l1.414 1.414a2 2 0 0 1 0 2.827l-.063.064.196.473H20a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-.089l-.196.473.063.063a2.002 2.002 0 0 1 0 2.828l-1.414 1.414a2 2 0 0 1-2.828 0l-.063-.063-.473.196V20a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-.089l-.473-.196-.063.063a2.002 2.002 0 0 1-2.828 0l-1.414-1.414a2 2 0 0 1 0-2.827l.063-.064L4.089 15H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h.09l.195-.473-.063-.063a2 2 0 0 1 0-2.828l1.414-1.414a2 2 0 0 1 2.827 0l.064.063L9 4.089V4a2 2 0 0 1 .586-1.414ZM8 12a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"/>
      </svg>`;

    const ACCOUNT_ICON_SVG = `
      <svg width="28" height="28" fill="%FILL%" viewBox="0 0 24 24">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM6 19a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1H6v-1Zm14.5-9a3.5 3.5 0 1 0-2.8 5.6 5 5 0 0 1 2.3 2.4H22v-1a4 4 0 0 0-3.5-4h-.5a3.5 3.5 0 0 0 2.5-3Z"/>
      </svg>`;

    const getFillColor = () => {
      const color = document.querySelector('meta[name="theme-color"]')?.content?.toLowerCase();
      return color === '#ffffff' ? '#242526' : '#d0d0d0';
    };

    const updateButtonColor = () => {
      const fillColor = getFillColor();
      const svg = document.querySelector(`#${BUTTON_ID} svg`);
      if (svg) svg.setAttribute('fill', fillColor);
      const accSvg = document.querySelector(`#${ACCOUNT_BTN_ID} svg`);
      if (accSvg) accSvg.setAttribute('fill', fillColor);
    };

    const findInsertionPoint = () => {
      const iconSpan = Array.from(document.querySelectorAll('span'))
        .find(span => span.textContent === '󱥊');
      const container = iconSpan?.closest('div[role="button"]')?.parentNode;

      const desktopTarget = document.querySelector(
        '.x6s0dn4.x78zum5.x1s65kcs.x1n2onr6.x1ja2u2z'
      );

      return { container, desktopTarget };
    };

    const createButton = () => {
      const btn = document.createElement('button');
      btn.id = BUTTON_ID;
      btn.setAttribute('style', `
        position: ${findInsertionPoint().desktopTarget === null ? 'fixed' : 'block'};
        top: 8px;
        right: 104px;
        background: transparent;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        pointer-events: auto;
      `);
      btn.innerHTML = ICON_SVG.replace('%FILL%', getFillColor());
      btn.onclick = () => SettingsBridge?.onSettingsToggle?.();
      return btn;
    };

    const createAccountButton = () => {
      const btn = document.createElement('button');
      btn.id = ACCOUNT_BTN_ID;
      btn.setAttribute('style', `
        position: ${findInsertionPoint().desktopTarget === null ? 'fixed' : 'block'};
        top: 8px;
        right: 58px;
        background: transparent;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        pointer-events: auto;
      `);
      btn.innerHTML = ACCOUNT_ICON_SVG.replace('%FILL%', getFillColor());
      btn.onclick = () => AccountBridge?.onOpenSwitcher?.();
      return btn;
    };

    const insertButton = () => {
      const { container, desktopTarget } = findInsertionPoint();

      if (!document.getElementById(BUTTON_ID)) {
        const button = createButton();
        if (desktopTarget) desktopTarget.insertBefore(button, desktopTarget.firstChild);
        else if (container) container.insertBefore(button, container.firstChild);
      }

      if (!document.getElementById(ACCOUNT_BTN_ID)) {
        const accBtn = createAccountButton();
        if (desktopTarget) desktopTarget.insertBefore(accBtn, desktopTarget.firstChild);
        else if (container) container.insertBefore(accBtn, container.firstChild);
      }
    };

    insertButton();

    const observer = new MutationObserver(() => {
      if ((!document.getElementById(BUTTON_ID) || !document.getElementById(ACCOUNT_BTN_ID)) && isFeed()) {
        insertButton();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Observer for theme-color changes
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      new MutationObserver(updateButtonColor).observe(themeMeta, {
        attributes: true,
        attributeFilter: ['content'],
      });
    }
  });
})();


// Color Extraction Script
(function() {
    const meta = document.querySelector('meta[name="theme-color"]');
    const notify = () => window.ThemeBridge?.onThemeColorChanged?.(meta?.content ?? "null");
    if (meta) {
        notify();
        new MutationObserver(() => notify())
            .observe(meta, { attributes: true, attributeFilter: ['content'] });
    }
})();

// File Download Script
(function() {
    if (window._downloadBridgeInitialized) return;
    window._downloadBridgeInitialized = true;
    const originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = function(blob) {
        const reader = new FileReader();
        reader.onloadend = function() {
            if (reader.result)
                DownloadBridge.downloadBase64File(reader.result, blob.type);
        };
        reader.readAsDataURL(blob);
        return originalCreateObjectURL(blob);
    };
})();

// =========================================================================
// Pull-To-Refresh (Only active at the absolute top of the feed)
// =========================================================================
(() => {
  let startY = 0;
  let startX = 0;
  let isPulling = false;
  let isRefreshing = false;
  let indicatorEl = null;
  let spinnerEl = null;

  function ensureIndicator() {
    if (indicatorEl && indicatorEl.parentNode) return;

    indicatorEl = document.createElement('div');
    indicatorEl.id = 'fbn-ptr-widget';
    indicatorEl.innerHTML = `
      <style>
        #fbn-ptr-widget {
          position: fixed;
          top: 14px;
          left: 50%;
          transform: translate(-50%, -90px);
          z-index: 999999;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #FFFFFF;
          box-shadow: 0 4px 14px rgba(0,0,0,0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        #fbn-ptr-svg {
          width: 24px;
          height: 24px;
          transition: transform 0.08s linear;
        }
        @keyframes fbn-ptr-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .fbn-spinning {
          animation: fbn-ptr-spin 0.75s linear infinite !important;
        }
      </style>
      <svg id="fbn-ptr-svg" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" fill="none" stroke="#E4E6EB" stroke-width="2.8"></circle>
        <path d="M12 3 A 9 9 0 0 1 21 12" fill="none" stroke="#1877F2" stroke-width="2.8" stroke-linecap="round"></path>
      </svg>
    `;
    (document.body || document.documentElement).appendChild(indicatorEl);
    spinnerEl = indicatorEl.querySelector('#fbn-ptr-svg');
  }

  function getScrollTop() {
    const docTop = document.documentElement ? document.documentElement.scrollTop : 0;
    const bodyTop = document.body ? document.body.scrollTop : 0;
    const vscroller = document.querySelector('div[data-type="vscroller"]');
    const vscrollerTop = vscroller ? vscroller.scrollTop : 0;
    return Math.max(window.scrollY || 0, docTop, bodyTop, vscrollerTop);
  }

  function resetIndicator() {
    if (!indicatorEl) return;
    indicatorEl.style.transition = 'transform 0.25s cubic-bezier(0.2, 0, 0, 1), opacity 0.25s ease';
    indicatorEl.style.transform = 'translate(-50%, -90px)';
    indicatorEl.style.opacity = '0';
    if (spinnerEl) spinnerEl.classList.remove('fbn-spinning');
    setTimeout(() => {
      isPulling = false;
      isRefreshing = false;
      if (indicatorEl) indicatorEl.style.transition = '';
    }, 250);
  }

  function triggerRefresh() {
    isRefreshing = true;
    window._userInitiatedRefresh = true;
    if (indicatorEl) {
      indicatorEl.style.transition = 'transform 0.2s ease';
      indicatorEl.style.transform = 'translate(-50%, 26px)';
      indicatorEl.style.opacity = '1';
    }
    if (spinnerEl) spinnerEl.classList.add('fbn-spinning');

    setTimeout(() => {
      if (window.SettingsBridge?.onPullRefresh) {
        window.SettingsBridge.onPullRefresh();
      } else {
        const isHome = window.location.pathname === '/' || window.location.pathname === '' || window.location.pathname === '/home.php';
        const host = window.location.host || 'm.facebook.com';
        const ts = Date.now();
        if (isHome) {
          window.location.href = `https://${host}/?sk=h_chr&_ts=${ts}`;
        } else {
          const url = new URL(window.location.href);
          url.searchParams.set('_ts', ts.toString());
          window.location.href = url.toString();
        }
      }
      setTimeout(resetIndicator, 3500);
    }, 300);
  }

  window.addEventListener('touchstart', (e) => {
    if (isRefreshing) return;
    // ONLY activate if scroll position is at the absolute top (<= 0)
    if (getScrollTop() <= 0 && e.touches.length === 1) {
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      isPulling = true;
      ensureIndicator();
    } else {
      isPulling = false;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isPulling || isRefreshing) return;

    // If user scrolled down even slightly, cancel pull-to-refresh
    if (getScrollTop() > 0) {
      resetIndicator();
      return;
    }

    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = currentY - startY;
    const deltaX = currentX - startX;

    // Only pull if dragged downwards and more vertical than horizontal
    if (deltaY > 10 && deltaY > Math.abs(deltaX)) {
      const pullDist = Math.min(105, deltaY * 0.45);
      if (indicatorEl) {
        indicatorEl.style.transform = `translate(-50%, ${pullDist - 65}px)`;
        indicatorEl.style.opacity = Math.min(1, pullDist / 40).toString();
      }
      if (spinnerEl) {
        spinnerEl.style.transform = `rotate(${deltaY * 2.8}deg)`;
      }
    } else if (deltaY < 0) {
      resetIndicator();
    }
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (!isPulling || isRefreshing) return;
    isPulling = false;

    const endY = e.changedTouches[0]?.clientY || 0;
    const deltaY = endY - startY;

    if (deltaY >= 130 && getScrollTop() <= 0) {
      triggerRefresh();
    } else {
      resetIndicator();
    }
  }, { passive: true });

  window.addEventListener('touchcancel', resetIndicator, { passive: true });
})();

// =========================================================================
// Anti-Auto-Update & Reading Position Lock (Never auto-refresh while reading)
// =========================================================================
(() => {
  // 1. Enable CSS scroll-anchoring to prevent content injection jumps
  const anchorStyle = document.createElement('style');
  anchorStyle.id = 'fbn-scroll-anchor-style';
  anchorStyle.textContent = `
    html, body, [role="feed"], div[data-type="vscroller"], main {
      overflow-anchor: auto !important;
    }
  `;
  if (!document.getElementById('fbn-scroll-anchor-style')) {
    (document.head || document.documentElement).appendChild(anchorStyle);
  }

  function isScrolledDown() {
    const docTop = document.documentElement ? document.documentElement.scrollTop : 0;
    const bodyTop = document.body ? document.body.scrollTop : 0;
    const vscroller = document.querySelector('div[data-type="vscroller"]');
    const vscrollerTop = vscroller ? vscroller.scrollTop : 0;
    return (window.scrollY || 0) > 35 || docTop > 35 || bodyTop > 35 || vscrollerTop > 35;
  }

  // 2. Block automatic location.reload / replace when user is reading down the page
  const nativeReload = window.location.reload.bind(window.location);
  window.location.reload = function(force) {
    if (isScrolledDown() && !window._userInitiatedRefresh) {
      console.log("[Facebook N] Suppressed automatic background reload while user is reading a post.");
      return;
    }
    window._userInitiatedRefresh = false;
    nativeReload(force);
  };

  const nativeReplace = window.location.replace.bind(window.location);
  window.location.replace = function(url) {
    if (isScrolledDown() && !window._userInitiatedRefresh) {
      console.log("[Facebook N] Suppressed automatic background replace while user is reading a post.");
      return;
    }
    nativeReplace(url);
  };

  // 3. Block script-driven scroll-to-top (0, 0) unless initiated by user back button
  const nativeScrollTo = window.scrollTo.bind(window);
  window.scrollTo = function(...args) {
    let targetY = 0;
    if (typeof args[0] === 'object' && args[0] !== null) {
      targetY = args[0].top ?? 0;
    } else if (typeof args[1] === 'number') {
      targetY = args[1];
    }
    if (targetY === 0 && isScrolledDown() && !window._isUserRequestedScroll) {
      console.log("[Facebook N] Prevented automatic script scroll-to-top while user is reading.");
      return;
    }
    nativeScrollTo(...args);
  };

  // Update backHandlerNB to allow user-requested scroll to top
  const origBackHandler = window.backHandlerNB;
  if (typeof origBackHandler === 'function') {
    window.backHandlerNB = function() {
      window._isUserRequestedScroll = true;
      const res = origBackHandler();
      setTimeout(() => { window._isUserRequestedScroll = false; }, 1000);
      return res;
    };
  }

  // 4. Suppress visibilitychange auto-reload triggers when user is scrolled down
  document.addEventListener('visibilitychange', (e) => {
    if (document.visibilityState === 'visible' && isScrolledDown()) {
      // User returned to app while reading a post - prevent event bubbling to reload handlers
      e.stopImmediatePropagation();
    }
  }, { capture: true });
})();

// =========================================================================
// 2-3 Seconds Long-Press Post Copy Feature (with haptics & clean extraction)
// =========================================================================
(() => {
  let pressTimer = null;
  let startX = 0;
  let startY = 0;
  let targetElement = null;
  let didTriggerCopy = false;
  const LONG_PRESS_DURATION = 2000; // 2 seconds

  function cleanPostText(el) {
    if (!el) return '';
    const clone = el.cloneNode(true);

    // Remove "See more", "See translation", and similar action buttons
    const buttons = clone.querySelectorAll('a, button, [role="button"], span[role="button"]');
    buttons.forEach(b => {
      const txt = (b.textContent || '').trim().toLowerCase();
      if (txt === 'see more' || txt === 'see translation' ||
          txt === 'আরও দেখুন' || txt === 'আরও পড়ুন' ||
          txt.includes('see more') || txt.includes('আরও দেখুন')) {
        b.remove();
      }
    });

    // Remove script, style, svg, media
    clone.querySelectorAll('script, style, noscript, svg, img, video, audio').forEach(s => s.remove());

    const text = clone.innerText || clone.textContent || '';
    return text.trim();
  }

  function extractPostContent(target) {
    if (!target || target === document.body || target === document.documentElement) return null;

    // 1. Direct message element (Facebook post body attribute)
    const directMsg = target.closest('[data-ad-preview="message"], [data-ad-comet-preview="message"]');
    if (directMsg) {
      const text = cleanPostText(directMsg);
      if (text) return { text, el: directMsg };
    }

    // 2. Direct text element clicked by user (like a comment or paragraph)
    const directAuto = target.closest('div[dir="auto"], p, span[dir="auto"]');
    if (directAuto && !directAuto.closest('button, [role="button"], header, footer, [role="toolbar"]')) {
      const text = cleanPostText(directAuto);
      if (text && text.length > 3) {
        return { text, el: directAuto };
      }
    }

    // 3. Post container (article or role="article")
    const postContainer = target.closest('article, [role="article"], div[data-mcomponent="MContainer"]');
    if (postContainer) {
      // Look for message container inside postContainer
      const postMsg = postContainer.querySelector('[data-ad-preview="message"], [data-ad-comet-preview="message"]');
      if (postMsg) {
        const text = cleanPostText(postMsg);
        if (text) return { text, el: postMsg };
      }

      // Clone post container and strip action bars, headers, buttons
      const clone = postContainer.cloneNode(true);
      const removeSelectors = [
        'header', 'footer', 'nav', 'form',
        'button', '[role="button"]', '[role="toolbar"]',
        'svg', 'img', 'video', 'audio',
        '[data-sigil*="like"]', '[data-sigil*="comment"]', '[data-sigil*="share"]',
        '[aria-label*="Like" i]', '[aria-label*="Comment" i]', '[aria-label*="Share" i]',
        '[aria-label*="Reactions" i]', '[aria-label*="React" i]'
      ];
      removeSelectors.forEach(sel => {
        clone.querySelectorAll(sel).forEach(el => el.remove());
      });
      const text = cleanPostText(clone);
      if (text && text.length > 2) {
        return { text, el: postContainer };
      }
    }

    // 4. Fallback to any text inside target
    const fallbackText = cleanPostText(target);
    if (fallbackText && fallbackText.length > 2) {
      return { text: fallbackText, el: target };
    }

    return null;
  }

  function showToast(message, isSuccess = true) {
    let toast = document.getElementById('fbn-copy-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'fbn-copy-toast';
      toast.innerHTML = `
        <div id="fbn-copy-toast-content">
          <span id="fbn-copy-toast-badge">✓</span>
          <span id="fbn-copy-toast-msg"></span>
        </div>
        <style>
          #fbn-copy-toast {
            position: fixed;
            bottom: 34px;
            left: 50%;
            transform: translate(-50%, 60px);
            z-index: 10000000;
            opacity: 0;
            pointer-events: none;
            transition: transform 0.28s cubic-bezier(0.18, 0.89, 0.32, 1.28), opacity 0.25s ease;
          }
          #fbn-copy-toast.fbn-show {
            transform: translate(-50%, 0);
            opacity: 1;
          }
          #fbn-copy-toast-content {
            background: rgba(20, 20, 22, 0.94);
            color: #FFFFFF;
            padding: 10px 20px;
            border-radius: 26px;
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.36);
            border: 1px solid rgba(255,255,255,0.14);
          }
        </style>
      `;
      (document.body || document.documentElement).appendChild(toast);
    }
    const badge = toast.querySelector('#fbn-copy-toast-badge');
    const msg = toast.querySelector('#fbn-copy-toast-msg');
    if (msg) msg.textContent = message;
    if (badge) {
      badge.textContent = isSuccess ? '✓' : 'ℹ';
      badge.style.color = isSuccess ? '#4ade80' : '#f59e0b';
    }
    toast.classList.add('fbn-show');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
      toast.classList.remove('fbn-show');
    }, 2400);
  }

  function flashHighlight(el) {
    if (!el) return;
    const origBoxShadow = el.style.boxShadow;
    const origTransition = el.style.transition;
    const origBg = el.style.backgroundColor;
    el.style.transition = 'all 0.22s ease';
    el.style.backgroundColor = 'rgba(24, 119, 242, 0.18)';
    el.style.boxShadow = '0 0 0 3px #1877F2';
    el.style.borderRadius = '8px';

    setTimeout(() => {
      el.style.backgroundColor = origBg;
      el.style.boxShadow = origBoxShadow;
      setTimeout(() => {
        el.style.transition = origTransition;
      }, 250);
    }, 550);
  }

  function handleLongPress() {
    if (!targetElement) return;

    const result = extractPostContent(targetElement);
    if (!result || !result.text) {
      showToast('পোস্টে কোনো কপি করার মতো লেখা নেই', false);
      return;
    }

    didTriggerCopy = true;
    const textToCopy = result.text;

    // 1. Android Native Clipboard (with Haptic Vibration & Native Toast)
    if (window.ClipboardBridge?.copyTextToClipboard) {
      window.ClipboardBridge.copyTextToClipboard(textToCopy);
    } else if (window.SettingsBridge?.copyToClipboard) {
      window.SettingsBridge.copyToClipboard(textToCopy);
    }

    // 2. Web Clipboard API fallback
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy).catch(() => {});
    }

    // 3. Clear any native text selection ranges so UI stays clean
    try {
      window.getSelection()?.removeAllRanges();
    } catch (e) {}

    // 4. Visual Flash & In-App Toast
    flashHighlight(result.el || targetElement);
    showToast('পোস্টের লেখা কপি হয়েছে! 📋', true);

    setTimeout(() => { didTriggerCopy = false; }, 800);
  }

  // Prevent browser context menu when copy fires
  window.addEventListener('contextmenu', (e) => {
    if (didTriggerCopy) {
      e.preventDefault();
      e.stopPropagation();
      didTriggerCopy = false;
    }
  }, { capture: true });

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) {
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      return;
    }

    const target = e.target;
    // Don't intercept if user tapped form input, action buttons (Like, Comment, Share)
    if (target.closest('input, textarea, select')) return;
    const btn = target.closest('button, [role="button"]');
    if (btn) {
      const aria = (btn.getAttribute('aria-label') || '').toLowerCase();
      const txt = (btn.textContent || '').trim().toLowerCase();
      if (aria.includes('like') || aria.includes('comment') || aria.includes('share') ||
          aria.includes('react') || aria.includes('লাইক') || aria.includes('কমেন্ট') ||
          txt === 'like' || txt === 'comment' || txt === 'share' || txt === 'লাইক') {
        return;
      }
    }

    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    targetElement = target;

    pressTimer = setTimeout(() => {
      handleLongPress();
      pressTimer = null;
    }, LONG_PRESS_DURATION);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!pressTimer) return;
    const curX = e.touches[0].clientX;
    const curY = e.touches[0].clientY;
    // If finger moves more than 10px, it's a scroll gesture -> cancel copy
    if (Math.hypot(curX - startX, curY - startY) > 10) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  }, { passive: true });

  window.addEventListener('touchcancel', () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  }, { passive: true });
})();

// =========================================================================
// Smart Auto-Hiding & Quick-Return Navbar Engine (Facebook N)
// =========================================================================
(function() {
  'use strict';
  if (window._fbnSmartNavbarInitialized) return;
  window._fbnSmartNavbarInitialized = true;

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
      scrollDownAccum += diff;
      scrollUpAccum = 0;
      if (scrollDownAccum > 20) {
        hideNavbar();
      }
    } else if (diff < -5) {
      scrollUpAccum += Math.abs(diff);
      scrollDownAccum = 0;
      if (scrollUpAccum > 10) {
        showNavbar(false);
      }
    }
  }

  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      const curY = e.touches[0].clientY;
      const deltaY = curY - touchStartY;
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

  setTimeout(() => showNavbar(true), 400);
})();

// =========================================================================
// Facebook N Professional Ultra-Comprehensive Ad Blocker
// =========================================================================
(function() {
  'use strict';
  if (window._fbnAdBlockInitialized) return;
  window._fbnAdBlockInitialized = true;

  const styleEl = document.createElement('style');
  styleEl.id = 'fbn-ultra-adblock-style';
  styleEl.textContent = `
    div.sponsored_ad,
    article[data-ft*="sponsored_ad"],
    article[data-ft*='"is_sponsored":1'],
    article[data-ft*='"is_sponsored":true'],
    [role="article"][data-ft*='"is_sponsored":1'],
    [role="article"][data-ft*='"is_sponsored":true'],
    div[data-tracking-duration-id][data-ft*='"is_sponsored":1'],
    div[data-tracking-duration-id][data-ft*='"is_sponsored":true'],
    div[data-testid*="ad_capsule"],
    div[data-testid*="sponsored"],
    div[data-testid*="ad-"],
    article:has(a[href*="/ads/about"]),
    article:has(a[href*="about/ads"]),
    article:has(a[href*="ad_preferences"]),
    article:has(a[href*="ads_preferences"]),
    article:has(a[href*="/adpreferences"]),
    article:has(a[href*="facebook.com/ads/"]),
    article:has(a[href*="ad_id="]),
    [role="article"]:has(a[href*="/ads/about"]),
    [role="article"]:has(a[href*="about/ads"]),
    [role="article"]:has(a[href*="ad_preferences"]),
    [role="article"]:has(a[href*="ads_preferences"]),
    [role="article"]:has(a[href*="/adpreferences"]),
    [role="article"]:has(a[href*="facebook.com/ads/"]),
    [role="article"]:has(a[href*="ad_id="]),
    div[data-mcomponent="MContainer"]:has(a[href*="/ads/about"]),
    div[data-mcomponent="MContainer"]:has(a[href*="about/ads"]),
    div[data-mcomponent="MContainer"]:has(a[href*="ad_preferences"]),
    div[data-mcomponent="MContainer"]:has(a[href*="facebook.com/ads/"]),
    div[data-tracking-duration-id]:has(a[href*="/ads/about"]),
    div[data-tracking-duration-id]:has(a[href*="about/ads"]),
    div[data-tracking-duration-id]:has(a[href*="ad_preferences"]),
    article:has([aria-label*="Sponsored" i]),
    article:has([aria-label*="স্পন্সরড" i]),
    article:has([aria-label*="বিজ্ঞাপন" i]),
    [role="article"]:has([aria-label*="Sponsored" i]),
    [role="article"]:has([aria-label*="স্পন্সরড" i]),
    [role="article"]:has([aria-label*="বিজ্ঞাপন" i]),
    div[data-tracking-duration-id]:has([aria-label*="Sponsored" i]),
    div[data-tracking-duration-id]:has([aria-label*="স্পন্সরড" i]),
    div[data-mcomponent="MContainer"]:has([aria-label*="Sponsored" i]),
    div[data-mcomponent="MContainer"]:has([aria-label*="স্পন্সরড" i]) {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      min-height: 0 !important;
      max-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      pointer-events: none !important;
    }
  `;
  if (!document.getElementById('fbn-ultra-adblock-style')) {
    (document.head || document.documentElement).appendChild(styleEl);
  }

  const SPONSORED_KEYWORDS = new Set([
    'sponsored', 'স্পন্সরড', 'স্পনসর্ড', 'বিজ্ঞাপন', 'বিজ্ঞাপনদাতা', 'ad', 'ads',
    'promoted', 'gesponsert', 'sponsorlu', 'sponsorowane', 'publicidad',
    'patrocinado', 'sponsorisée', 'sponsorisé', 'sponsorizzato', 'gesponsord',
    'sponset', 'sponsorizat', 'sponzorované', 'sponzorováno', 'sponsrat',
    'được tài trợ', 'χορηγούμενη', 'реклама', 'спонсорирано', 'במימון',
    'سپانسرڈ', 'प्रायोजित', '광고', '贊助', '赞助内容', '広告', 'ditaja',
    'bersponsor', 'disponsori', 'paid partnership', 'paid promotion'
  ]);

  const SUGGESTED_MARKERS = [
    'suggested for you', 'আপনার জন্য সাজেস্ট করা', 'সাজেস্ট করা পোস্ট',
    'suggested post', 'suggested page', 'suggested group', 'popular near you'
  ];

  const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF]/g;

  function getVisibleCleanText(rootNode) {
    if (!rootNode) return '';
    let chars = '';
    const walker = document.createTreeWalker(
      rootNode,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent) continue;

      const s = window.getComputedStyle(parent);
      if (
        s.display === 'none' ||
        s.visibility === 'hidden' ||
        s.opacity === '0' ||
        s.fontSize === '0px' ||
        parseFloat(s.fontSize) === 0 ||
        s.clip === 'rect(0px, 0px, 0px, 0px)' ||
        (s.position === 'absolute' && (parseInt(s.left) < -500 || parseInt(s.top) < -500))
      ) {
        continue;
      }
      chars += node.textContent;
    }
    return chars.replace(ZERO_WIDTH_REGEX, '').trim().toLowerCase();
  }

  function isAdKeyword(text) {
    if (!text || text.length < 2) return false;
    const clean = text.replace(ZERO_WIDTH_REGEX, '').trim().toLowerCase();

    if (SPONSORED_KEYWORDS.has(clean)) return true;

    for (const kw of SPONSORED_KEYWORDS) {
      if (
        clean === kw ||
        clean.startsWith(kw + ' ·') ||
        clean.startsWith(kw + '•') ||
        clean.startsWith(kw + ' ') ||
        clean.endsWith(' ' + kw) ||
        clean.includes('sponsored ·') ||
        clean.includes('স্পন্সরড ·')
      ) {
        return true;
      }
    }
    return false;
  }

  function isSuggestedClutter(text) {
    if (!text) return false;
    const clean = text.replace(ZERO_WIDTH_REGEX, '').trim().toLowerCase();
    for (const marker of SUGGESTED_MARKERS) {
      if (clean.includes(marker)) return true;
    }
    return false;
  }

  function checkContainerForAd(container) {
    if (!container || container.dataset?.fbnIsAd === 'true') return true;

    const adLink = container.querySelector(
      'a[href*="/ads/about"], a[href*="about/ads"], a[href*="ad_preferences"], ' +
      'a[href*="ads_preferences"], a[href*="/adpreferences"], a[href*="facebook.com/ads/"], ' +
      'a[href*="ad_id="], a[href*="campaign_id="], a[href*="adset_id="], a[href*="ad_delivery="]'
    );
    if (adLink) return true;

    const ftAttr = container.getAttribute('data-ft') || '';
    if (
      ftAttr.includes('"is_sponsored":1') ||
      ftAttr.includes('"is_sponsored":true') ||
      ftAttr.includes('"sponsored_ad":1') ||
      ftAttr.includes('"sponsored_ad":true') ||
      ftAttr.includes('"ad_id"') ||
      ftAttr.includes('"ad_client_token"') ||
      ftAttr.includes('"commercial":true') ||
      ftAttr.includes('"commercial":1')
    ) {
      return true;
    }

    const childWithFt = container.querySelector('[data-ft*="is_sponsored"], [data-ft*="sponsored_ad"], [data-ft*="ad_id"]');
    if (childWithFt) return true;

    const ariaEl = container.querySelector(
      '[aria-label*="Sponsored" i], [aria-label*="স্পন্সরড" i], ' +
      '[aria-label*="স্পনসর্ড" i], [aria-label*="বিজ্ঞাপন" i], ' +
      '[aria-label*="Promoted" i], [aria-label*="Paid partnership" i]'
    );
    if (ariaEl) return true;

    const headerArea = container.querySelector('header, div[data-sigil*="header"]') || container;
    const candidateNodes = headerArea.querySelectorAll('div[data-mcomponent="TextArea"], div[dir="auto"], span, a, b, strong');

    for (const node of candidateNodes) {
      if (node.closest('[data-ad-preview="message"], [data-ad-comet-preview="message"]')) continue;

      const rawText = (node.innerText || node.textContent || '').trim();
      if (rawText.length > 0 && rawText.length <= 50) {
        if (isAdKeyword(rawText)) return true;
        if (isSuggestedClutter(rawText)) return true;

        if (node.children.length > 0) {
          const deobfuscated = getVisibleCleanText(node);
          if (deobfuscated.length > 0 && deobfuscated.length <= 40) {
            if (isAdKeyword(deobfuscated)) return true;
          }
        }
      }
    }

    const followBtn = container.querySelector('[aria-label*="Follow" i], [aria-label*="ফলো করুন" i]');
    if (followBtn && container.textContent.includes('•')) {
      const headerText = headerArea.textContent.toLowerCase();
      if (headerText.includes('suggested') || headerText.includes('সাজেস্ট')) {
        return true;
      }
    }

    return false;
  }

  function eradicateAd(post) {
    if (!post) return;
    post.dataset.fbnAdChecked = 'true';
    post.dataset.fbnIsAd = 'true';

    post.style.setProperty('display', 'none', 'important');
    post.style.setProperty('visibility', 'hidden', 'important');
    post.style.setProperty('height', '0px', 'important');
    post.style.setProperty('min-height', '0px', 'important');
    post.style.setProperty('max-height', '0px', 'important');
    post.style.setProperty('margin', '0px', 'important');
    post.style.setProperty('padding', '0px', 'important');
    post.style.setProperty('overflow', 'hidden', 'important');
    post.style.setProperty('pointer-events', 'none', 'important');

    const prev = post.previousElementSibling;
    if (prev && (prev.offsetHeight < 35 || prev.classList?.contains('post-gap') || prev.getAttribute('data-mcomponent') === 'MContainer')) {
      prev.style.setProperty('display', 'none', 'important');
    }
    const next = post.nextElementSibling;
    if (next && (next.offsetHeight < 35 || next.classList?.contains('post-gap'))) {
      next.style.setProperty('display', 'none', 'important');
    }
  }

  function findPostContainers(root = document) {
    const selectors = [
      'article',
      '[role="article"]',
      'div[data-pagelet*="FeedUnit"]',
      'div[data-tracking-duration-id]',
      'div.sponsored_ad',
      'div[data-testid*="ad"]',
      'div[data-mcomponent="MContainer"].m'
    ];
    return Array.from(root.querySelectorAll(selectors.join(', ')));
  }

  function scanFeedAds(root = document) {
    if (!root || !root.querySelectorAll) return;

    const posts = findPostContainers(root);
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      if (post.dataset?.fbnIsAd === 'true') {
        post.style.display = 'none';
        continue;
      }
      if (checkContainerForAd(post)) {
        eradicateAd(post);
      }
    }

    const reelContainers = root.querySelectorAll('div.vertically-snappable, div[data-pagelet*="Reels"]');
    reelContainers.forEach(reel => {
      if (reel.dataset?.fbnReelAdChecked) return;
      if (checkContainerForAd(reel)) {
        reel.dataset.fbnReelAdChecked = 'true';
        reel.innerHTML = '';
        reel.style.display = 'none';
      }
    });
  }

  scanFeedAds(document);
  setTimeout(() => scanFeedAds(document), 400);
  setTimeout(() => scanFeedAds(document), 1000);
  setTimeout(() => scanFeedAds(document), 2500);

  let isScanning = false;
  const observer = new MutationObserver(mutations => {
    if (isScanning) return;
    isScanning = true;
    requestAnimationFrame(() => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1) {
            scanFeedAds(node);
          }
        }
      }
      isScanning = false;
    });
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });

  let lastScrollCheck = 0;
  window.addEventListener('scroll', () => {
    const now = Date.now();
    if (now - lastScrollCheck > 600) {
      lastScrollCheck = now;
      scanFeedAds(document);
    }
  }, { passive: true });
})();

