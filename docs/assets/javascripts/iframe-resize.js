// Auto-resize iframes to fit their content height
(function() {
  'use strict';

  function resizeIframe(iframe) {
    if (!iframe || iframe.dataset.resized) return;
    try {
      var doc = iframe.contentDocument || iframe.contentWindow.document;
      if (!doc) return;
      var body = doc.body;
      var html = doc.documentElement;
      if (!body || !html) return;
      // Use the larger of scrollHeight vs offsetHeight
      var h = Math.max(
        body.scrollHeight, body.offsetHeight,
        html.scrollHeight, html.offsetHeight
      );
      if (h > 0) {
        iframe.style.height = h + 'px';
        iframe.dataset.resized = '1';
      }
    } catch(e) {
      // cross-origin iframe, leave default height
    }
  }

  function handleIframe(iframe) {
    iframe.addEventListener('load', function() {
      // Small delay to let full layout settle
      setTimeout(function() { resizeIframe(iframe); }, 100);
    });
    // If already loaded
    if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
      setTimeout(function() { resizeIframe(iframe); }, 100);
    }
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
