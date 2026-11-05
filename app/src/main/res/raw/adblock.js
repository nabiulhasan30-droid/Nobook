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
    [data-fbn-is-ad="true"] {
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
    'được tài trợ', 'χορηগούμενη', 'реклама', 'спонсорирано', 'במימון',
    'سپانسرڈ', 'प्रायोजित', '광고', '贊助', '赞助内容', '広告', 'ditaja',
    'bersponsor', 'disponsori', 'paid partnership', 'paid promotion'
  ]);

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

  // Climbs up the DOM to find the top-level feed post container
  function findEnclosingPost(markerNode) {
    if (!markerNode || markerNode === document.body || markerNode === document.documentElement) return null;

    let curr = markerNode;
    let bestPost = null;

    while (curr && curr !== document.body && curr !== document.documentElement) {
      const tagName = curr.tagName;
      const role = curr.getAttribute('role');
      const mcomp = curr.getAttribute('data-mcomponent');
      const pagelet = curr.getAttribute('data-pagelet') || '';

      if (
        tagName === 'ARTICLE' ||
        role === 'article' ||
        pagelet.includes('FeedUnit') ||
        curr.getAttribute('data-tracking-duration-id') ||
        curr.classList?.contains('sponsored_ad') ||
        curr.parentElement?.getAttribute('data-type') === 'vscroller' ||
        curr.parentElement?.id === 'm_newsfeed_stream' ||
        curr.parentElement?.getAttribute('role') === 'feed'
      ) {
        return curr;
      }

      if (mcomp === 'MContainer' && curr.parentElement && curr.parentElement.getAttribute('data-type') === 'vscroller') {
        return curr;
      }

      if (mcomp === 'MContainer' && !bestPost) {
        bestPost = curr;
      }

      curr = curr.parentElement;
    }

    return bestPost || markerNode.closest('article, [role="article"], div[data-mcomponent="MContainer"]');
  }

  function eradicateElement(post) {
    if (!post) return;
    post.dataset.fbnAdChecked = 'true';
    post.dataset.fbnIsAd = 'true';
    post.setAttribute('data-fbn-is-ad', 'true');

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

    // 5. Follow button on suggested page
    const followBtn = container.querySelector('[aria-label*="Follow" i], [aria-label*="ফলো করুন" i]');
    if (followBtn && container.textContent.includes('•')) {
      const headerText = headerArea.textContent.toLowerCase();
      if (headerText.includes('suggested') || headerText.includes('সাজেস্ট')) {
        return true;
      }
    }

    return false;
  }

  function eradicateAllAds(root = document) {
    if (!root || !root.querySelectorAll) return;

    // A. Link-driven eradication: find legal ad transparency links and climb up
    const adLinks = root.querySelectorAll(
      'a[href*="/ads/about"], a[href*="about/ads"], a[href*="ad_preferences"], ' +
      'a[href*="ads_preferences"], a[href*="/adpreferences"], a[href*="facebook.com/ads/"], ' +
      'a[href*="ad_id="], a[href*="campaign_id="], a[href*="adset_id="], a[href*="ad_delivery="]'
    );
    for (let i = 0; i < adLinks.length; i++) {
      const post = findEnclosingPost(adLinks[i]);
      if (post) eradicateElement(post);
    }

    // B. Attribute-driven eradication: find sponsored data-ft elements and climb up
    const ftElements = root.querySelectorAll(
      '[data-ft*="is_sponsored"], [data-ft*="sponsored_ad"], [data-ft*="ad_id"], [data-ft*="commercial"]'
    );
    for (let i = 0; i < ftElements.length; i++) {
      const post = findEnclosingPost(ftElements[i]);
      if (post) eradicateElement(post);
    }

    // C. Aria-label eradication
    const ariaElements = root.querySelectorAll(
      '[aria-label*="Sponsored" i], [aria-label*="স্পন্সরড" i], ' +
      '[aria-label*="স্পনসর্ড" i], [aria-label*="বিজ্ঞাপন" i], ' +
      '[aria-label*="Promoted" i], [aria-label*="Paid partnership" i]'
    );
    for (let i = 0; i < ariaElements.length; i++) {
      const post = findEnclosingPost(ariaElements[i]);
      if (post) eradicateElement(post);
    }

    // D. Container inspection pass
    const containers = root.querySelectorAll(
      'article, [role="article"], div[data-pagelet*="FeedUnit"], div[data-tracking-duration-id], div.sponsored_ad, div[data-testid*="ad"], div[data-mcomponent="MContainer"].m'
    );
    for (let i = 0; i < containers.length; i++) {
      const c = containers[i];
      if (c.dataset?.fbnIsAd === 'true') {
        c.style.display = 'none';
        continue;
      }
      if (checkContainerForAd(c)) {
        eradicateElement(c);
      }
    }

    // E. Reels feed ads
    const reelContainers = root.querySelectorAll('div.vertically-snappable, div[data-pagelet*="Reels"]');
    reelContainers.forEach(reel => {
      if (reel.dataset?.fbnReelChecked) return;
      reel.dataset.fbnReelChecked = 'true';
      if (checkContainerForAd(reel) || reel.querySelector('a[href*="/ads/about"], a[href*="ad_preferences"]')) {
        reel.style.display = 'none';
        reel.innerHTML = '';
      }
    });
  }

  // Multi-pass scanning
  eradicateAllAds(document);
  setTimeout(() => eradicateAllAds(document), 300);
  setTimeout(() => eradicateAllAds(document), 800);
  setTimeout(() => eradicateAllAds(document), 1800);
  setTimeout(() => eradicateAllAds(document), 3500);

  let isScanning = false;
  const observer = new MutationObserver(mutations => {
    if (isScanning) return;
    isScanning = true;
    requestAnimationFrame(() => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1) {
            eradicateAllAds(node);
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

  let lastScrollTime = 0;
  window.addEventListener('scroll', () => {
    const now = Date.now();
    if (now - lastScrollTime > 500) {
      lastScrollTime = now;
      eradicateAllAds(document);
    }
  }, { passive: true });
})();
