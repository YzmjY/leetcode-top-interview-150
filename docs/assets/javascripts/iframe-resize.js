// Auto-resize iframes to fit their content height
(function() {
  'use strict';

  function measure(iframe, attempt) {
    attempt = attempt || 0;
    if (!iframe || !iframe.parentNode) return;
    try {
      var doc = iframe.contentDocument || iframe.contentWindow.document;
      if (!doc) return;
      var body = doc.body;
      var html = doc.documentElement;
      if (!body || !html) return;

      var h = Math.max(
        body.scrollHeight, body.offsetHeight,
        html.scrollHeight, html.offsetHeight
      );

      if (h > 50) {
        iframe.style.height = h + 'px';
        // Continue polling a few more times in case content shifts
        if (attempt < 2) {
          setTimeout(function() { measure(iframe, attempt + 1); }, 400);
        }
      } else if (attempt < 5) {
        // Content not ready yet, retry with increasing delay
        var delays = [150, 350, 600, 1000, 1500];
        setTimeout(function() { measure(iframe, attempt + 1); }, delays[attempt] || 1500);
      }
    } catch(e) {
      // cross-origin, leave as-is
    }
  }

  function handleIframe(iframe) {
    iframe.addEventListener('load', function() {
      requestAnimationFrame(function() {
        setTimeout(function() { measure(iframe, 0); }, 50);
      });
    });
    // If already loaded
    try {
      if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
        setTimeout(function() { measure(iframe, 0); }, 50);
      }
    } catch(e) {}
  }

  // Handle all existing iframes
  document.querySelectorAll('iframe').forEach(handleIframe);

  // Watch for new iframes (MkDocs page transitions)
  if (window.MutationObserver) {
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        m.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) {
            if (node.tagName === 'IFRAME') handleIframe(node);
            if (node.querySelectorAll) {
              node.querySelectorAll('iframe').forEach(handleIframe);
            }
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
