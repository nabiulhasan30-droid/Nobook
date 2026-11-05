// =========================================================================
// Facebook N - Hide Suggested Posts, Groups, and Pages
// =========================================================================
(function() {
  'use strict';

  const SUGGESTED_TERMS = [
    'suggested for you', 'আপনার জন্য সাজেস্ট করা', 'সাজেস্ট করা পোস্ট',
    'suggested post', 'suggested page', 'suggested group', 'popular near you',
    'suggested reels'
  ];

  function hideIfSuggested(container) {
    if (!container || container.dataset?.fbnSuggestedChecked) return;
    container.dataset.fbnSuggestedChecked = 'true';

    const header = container.querySelector('header, div[data-sigil*="header"]') || container;
    const txt = (header.textContent || '').toLowerCase();

    for (const term of SUGGESTED_TERMS) {
      if (txt.includes(term)) {
        container.style.setProperty('display', 'none', 'important');
        container.style.setProperty('height', '0px', 'important');
        const prev = container.previousElementSibling;
        if (prev && (prev.offsetHeight < 35 || prev.classList?.contains('post-gap'))) {
          prev.style.setProperty('display', 'none', 'important');
        }
        return;
      }
    }

    // Follow button on non-connected pages
    const followBtn = container.querySelector('[aria-label*="Follow" i], [aria-label*="ফলো করুন" i]');
    if (followBtn && txt.includes('•') && (txt.includes('suggested') || txt.includes('সাজেস্ট'))) {
      container.style.setProperty('display', 'none', 'important');
      container.style.setProperty('height', '0px', 'important');
    }
  }

  function scanSuggested(root = document) {
    const candidates = root.querySelectorAll(
      'article, [role="article"], div[data-pagelet*="FeedUnit"], div[data-tracking-duration-id], div[data-mcomponent="MContainer"].m'
    );
    candidates.forEach(hideIfSuggested);
  }

  scanSuggested(document);
  setTimeout(() => scanSuggested(document), 500);
  setTimeout(() => scanSuggested(document), 1500);

  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (n.nodeType === 1) scanSuggested(n);
      }
    }
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });
})();
