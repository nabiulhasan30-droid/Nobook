// =========================================================================
// Facebook N Professional Ultra-Comprehensive Ad Blocker
// - Eradicates Sponsored posts, newsfeed ads, obfuscated ad spans, and reels ads
// - Uses multi-lingual keyword recognition, transparency link matching & CSS rules
// =========================================================================
(function() {
  const isDesktop = typeof isDesktopMode === 'function' ? isDesktopMode() : (window.isDesktopMode ? window.isDesktopMode() : false);

  // 1. Comprehensive Instant CSS Ad-Block Rules
  const styleEl = document.createElement('style');
  styleEl.id = 'fbn-ultra-adblock-style';
  styleEl.textContent = `
    /* Direct Ad Container Classes & Attributes */
    div.sponsored_ad,
    article[data-ft*="sponsored_ad"],
    [data-ad-preview],
    [data-ad-comet-preview],
    div[data-testid*="ad_capsule"],
    div[data-testid*="sponsored"],
    div[data-testid*="ad-"],
    /* Transparency Link Matches (Legal Requirement on all FB Ads) */
    article:has(a[href*="/ads/about"]),
    article:has(a[href*="about/ads"]),
    article:has(a[href*="ad_preferences"]),
    article:has(a[href*="ads_preferences"]),
    [role="article"]:has(a[href*="/ads/about"]),
    [role="article"]:has(a[href*="about/ads"]),
    [role="article"]:has(a[href*="ad_preferences"]),
    [role="article"]:has(a[href*="ads_preferences"]),
    div[data-tracking-duration-id]:has(a[href*="/ads/about"]),
    div[data-tracking-duration-id]:has(a[href*="about/ads"]),
    div[data-tracking-duration-id]:has(a[href*="ad_preferences"]),
    /* Aria-Label Matches */
    article:has([aria-label*="Sponsored" i]),
    article:has([aria-label*="স্পন্সরড" i]),
    article:has([aria-label*="স্পনসর্ড" i]),
    article:has([aria-label*="বিজ্ঞাপন" i]),
    [role="article"]:has([aria-label*="Sponsored" i]),
    [role="article"]:has([aria-label*="স্পন্সরড" i]),
    [role="article"]:has([aria-label*="স্পনসর্ড" i]),
    div[data-tracking-duration-id]:has([aria-label*="Sponsored" i]),
    div[data-tracking-duration-id]:has([aria-label*="স্পন্সরড" i]),
    /* Obfuscated / Native MComponent Sponsored Containers */
    div[data-mcomponent="MContainer"]:has(a[href*="/ads/about"]),
    div[data-mcomponent="MContainer"]:has(a[href*="about/ads"]) {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      max-height: 0 !important;
      overflow: hidden !important;
      pointer-events: none !important;
    }
  `;
  if (!document.getElementById('fbn-ultra-adblock-style')) {
    (document.head || document.documentElement).appendChild(styleEl);
  }

  // Multi-lingual sponsored keyword list
  const SPONSORED_KEYWORDS = [
    'sponsored', 'স্পন্সরড', 'স্পনসর্ড', 'বিজ্ঞাপন', 'ad', 'promoted',
    'gesponsert', 'sponsorlu', 'sponsorowane', 'publicidad', 'patrocinado',
    'sponsorisée', 'sponsorisé', 'sponsorizzato', 'gesponsord', 'sponset',
    'sponsorizat', 'sponzorované', 'sponzorováno', 'sponsrat', 'được tài trợ',
    'χορηγούμενη', 'реклама', 'спонсорирано', 'במימון', 'سپانسرڈ', 'प्रायोजित',
    '광고', '贊助', '赞助内容', '広告', 'ditaja', 'bersponsor', 'disponsori'
  ];

  // Zero-width characters regex
  const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF]/g;

  function isAdText(text) {
    if (!text) return false;
    const clean = text.replace(ZERO_WIDTH_REGEX, '').trim().toLowerCase();
    if (clean.length < 2) return false;

    for (const kw of SPONSORED_KEYWORDS) {
      if (clean === kw ||
          clean.startsWith(kw + ' ·') ||
          clean.startsWith(kw + '•') ||
          clean.startsWith(kw + ' ') ||
          clean.endsWith(' ' + kw) ||
          clean.includes('sponsored ·') ||
          clean.includes('স্পন্সরড ·')) {
        return true;
      }
    }
    return false;
  }

  function checkContainerForAd(container) {
    if (!container || container.dataset?.fbnAdChecked) return false;

    // 1. Direct check: Ad transparency links
    const adLink = container.querySelector('a[href*="/ads/about"], a[href*="about/ads"], a[href*="ad_preferences"], a[href*="ads_preferences"], a[href*="facebook.com/ads/"]');
    if (adLink) return true;

    // 2. Direct check: Aria-label for sponsored / ad
    const ariaEl = container.querySelector('[aria-label*="Sponsored" i], [aria-label*="স্পন্সরড" i], [aria-label*="স্পনসর্ড" i], [aria-label*="বিজ্ঞাপন" i]');
    if (ariaEl) return true;

    // 3. Header/Metadata text inspection (where Facebook places the "Sponsored" tag)
    // Only check the top portion (header/author/time) to prevent false positives in post body
    const headerArea = container.querySelector('header, div[data-sigil*="header"], div[data-mcomponent="TextArea"], div:not([data-ad-preview])');
    const searchRoot = headerArea || container;

    // Look for spans and links with short text
    const textNodes = searchRoot.querySelectorAll('span, a, div[dir="auto"], b, strong');
    for (const node of textNodes) {
      // Don't check elements inside post message body
      if (node.closest('[data-ad-preview="message"], [data-ad-comet-preview="message"]')) continue;

      // Use innerText which evaluates actual human-visible text (bypassing display:none obfuscations)
      const visibleText = node.innerText || node.textContent || '';
      if (visibleText.length <= 40 && isAdText(visibleText)) {
        return true;
      }
    }

    return false;
  }

  function hideAdPost(post) {
    if (!post) return;
    post.dataset.fbnAdChecked = 'true';
    post.dataset.fbnIsAd = 'true';
    post.style.display = 'none';
    post.style.visibility = 'hidden';
    post.style.height = '0';
    post.style.maxHeight = '0';
    post.style.overflow = 'hidden';

    // Also hide adjacent gap / separator to prevent whitespace
    const prev = post.previousElementSibling;
    if (prev && (prev.classList.contains('post-gap') || prev.getAttribute('data-mcomponent') === 'MContainer')) {
      if (prev.offsetHeight < 25) prev.style.display = 'none';
    }
    const next = post.nextElementSibling;
    if (next && next.classList.contains('post-gap')) {
      next.style.display = 'none';
    }
  }

  function scanFeedAds(root = document) {
    // Post containers across mobile and desktop
    const selectors = [
      'article',
      '[role="article"]',
      'div[data-tracking-duration-id]',
      'div.sponsored_ad',
      'div[data-testid*="ad"]'
    ];

    const posts = root.querySelectorAll(selectors.join(', '));
    posts.forEach(post => {
      if (post.dataset?.fbnIsAd === 'true') {
        post.style.display = 'none';
        return;
      }
      if (checkContainerForAd(post)) {
        hideAdPost(post);
      }
    });

    // Reels Ads
    const reelContainers = root.querySelectorAll('div.vertically-snappable');
    reelContainers.forEach(reel => {
      if (reel.dataset?.fbnReelAdChecked) return;
      if (checkContainerForAd(reel)) {
        reel.dataset.fbnReelAdChecked = 'true';
        reel.innerHTML = '';
        reel.style.display = 'none';
      }
    });
  }

  // Initial scan
  scanFeedAds(document);

  // Debounced MutationObserver for smooth 60fps scrolling performance
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
})();
