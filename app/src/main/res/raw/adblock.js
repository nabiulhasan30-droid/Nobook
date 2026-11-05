// =========================================================================
// Facebook N Professional Ultra-Comprehensive Ad Blocker
// - Eradicates Sponsored posts, newsfeed ads, obfuscated decoy spans, reels ads,
//   promoted posts, and suggested clutter across mobile & desktop
// =========================================================================
(function() {
  'use strict';
  if (window._fbnAdBlockInitialized) return;
  window._fbnAdBlockInitialized = true;

  // 1. Instant Global CSS Rules for known ad signatures
  const styleEl = document.createElement('style');
  styleEl.id = 'fbn-ultra-adblock-style';
  styleEl.textContent = `
    /* Known ad container classes & attributes */
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

    /* Transparency / Ad Preferences Link Matches (100% legal ad signature) */
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

    /* Aria-Label Matches for sponsored posts */
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

  // Keywords that identify sponsored / promotional content across languages
  const SPONSORED_KEYWORDS = new Set([
    'sponsored', 'স্পন্সরড', 'স্পনসর্ড', 'বিজ্ঞাপন', 'বিজ্ঞাপনদাতা', 'ad', 'ads',
    'promoted', 'gesponsert', 'sponsorlu', 'sponsorowane', 'publicidad',
    'patrocinado', 'sponsorisée', 'sponsorisé', 'sponsorizzato', 'gesponsord',
    'sponset', 'sponsorizat', 'sponzorované', 'sponzorováno', 'sponsrat',
    'được tài trợ', 'χορηγούμενη', 'реклама', 'спонсорирано', 'במימון',
    'سپانسرڈ', 'प्रायोजित', '광고', '贊助', '赞助内容', '広告', 'ditaja',
    'bersponsor', 'disponsori', 'paid partnership', 'paid promotion'
  ]);

  // Suggested post markers to clean clutter
  const SUGGESTED_MARKERS = [
    'suggested for you', 'আপনার জন্য সাজেস্ট করা', 'সাজেস্ট করা পোস্ট',
    'suggested post', 'suggested page', 'suggested group', 'popular near you'
  ];

  const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF]/g;

  // TreeWalker that extracts genuinely human-visible characters (bypasses decoy spans!)
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

      // Check if parent or ancestor is hidden via inline style or computed style
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
        continue; // Decoy character inserted by Facebook! Skip!
      }
      chars += node.textContent;
    }
    return chars.replace(ZERO_WIDTH_REGEX, '').trim().toLowerCase();
  }

  function isAdKeyword(text) {
    if (!text || text.length < 2) return false;
    const clean = text.replace(ZERO_WIDTH_REGEX, '').trim().toLowerCase();

    // Direct match
    if (SPONSORED_KEYWORDS.has(clean)) return true;

    // Prefixed match (e.g. "Sponsored · Paid partnership", "স্পন্সরড ·")
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

    // 1. Direct check: Ad transparency and preference links
    const adLink = container.querySelector(
      'a[href*="/ads/about"], a[href*="about/ads"], a[href*="ad_preferences"], ' +
      'a[href*="ads_preferences"], a[href*="/adpreferences"], a[href*="facebook.com/ads/"], ' +
      'a[href*="ad_id="], a[href*="campaign_id="], a[href*="adset_id="], a[href*="ad_delivery="]'
    );
    if (adLink) return true;

    // 2. Direct check: data-ft JSON attributes
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

    // Also check child elements with data-ft
    const childWithFt = container.querySelector('[data-ft*="is_sponsored"], [data-ft*="sponsored_ad"], [data-ft*="ad_id"]');
    if (childWithFt) return true;

    // 3. Direct check: Aria-label for sponsored / ad
    const ariaEl = container.querySelector(
      '[aria-label*="Sponsored" i], [aria-label*="স্পন্সরড" i], ' +
      '[aria-label*="স্পনসর্ড" i], [aria-label*="বিজ্ঞাপন" i], ' +
      '[aria-label*="Promoted" i], [aria-label*="Paid partnership" i]'
    );
    if (ariaEl) return true;

    // 4. Header text inspection with De-obfuscation
    // Facebook places the Sponsored label near author name and timestamp
    const headerArea = container.querySelector('header, div[data-sigil*="header"]') || container;
    const candidateNodes = headerArea.querySelectorAll('div[data-mcomponent="TextArea"], div[dir="auto"], span, a, b, strong');

    for (const node of candidateNodes) {
      // Skip if inside the actual post body/message
      if (node.closest('[data-ad-preview="message"], [data-ad-comet-preview="message"]')) continue;

      const rawText = (node.innerText || node.textContent || '').trim();
      if (rawText.length > 0 && rawText.length <= 50) {
        if (isAdKeyword(rawText)) return true;
        if (isSuggestedClutter(rawText)) return true;

        // If rawText had decoy spans, run deep de-obfuscation
        if (node.children.length > 0) {
          const deobfuscated = getVisibleCleanText(node);
          if (deobfuscated.length > 0 && deobfuscated.length <= 40) {
            if (isAdKeyword(deobfuscated)) return true;
          }
        }
      }
    }

    // 5. Check if post has a "Follow" button next to an unknown page proposing sponsored reach
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

    // Complete obliteration
    post.style.setProperty('display', 'none', 'important');
    post.style.setProperty('visibility', 'hidden', 'important');
    post.style.setProperty('height', '0px', 'important');
    post.style.setProperty('min-height', '0px', 'important');
    post.style.setProperty('max-height', '0px', 'important');
    post.style.setProperty('margin', '0px', 'important');
    post.style.setProperty('padding', '0px', 'important');
    post.style.setProperty('overflow', 'hidden', 'important');
    post.style.setProperty('pointer-events', 'none', 'important');

    // Eradicate adjacent spacing/gap so no white blank space remains
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

    // Reels feed ads
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

  // Initial immediate pass
  scanFeedAds(document);

  // Subsequent delayed pass (for posts whose text/spans populate after initial skeleton)
  setTimeout(() => scanFeedAds(document), 400);
  setTimeout(() => scanFeedAds(document), 1000);
  setTimeout(() => scanFeedAds(document), 2500);

  // High-performance MutationObserver
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

  // Also hook into scroll for continuous background cleansing
  let lastScrollCheck = 0;
  window.addEventListener('scroll', () => {
    const now = Date.now();
    if (now - lastScrollCheck > 600) {
      lastScrollCheck = now;
      scanFeedAds(document);
    }
  }, { passive: true });
})();
