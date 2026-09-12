// 让嵌入式演示 iframe 的高度跟随内容自动伸缩。
// 演示在交互过程中内容高度会变化（切换步骤、展开面板），因此不能只在 load 时测一次。
(function () {
  'use strict';

  var MIN_HEIGHT = 200;

  function measure(iframe) {
    if (!iframe || !iframe.parentNode) return;
    var doc;
    try {
      doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
    } catch (e) {
      return; // 跨域，保持原样
    }
    if (!doc || !doc.body || !doc.documentElement) return;

    var body = doc.body;
    var html = doc.documentElement;
    var h = Math.max(
      body.scrollHeight, body.offsetHeight, body.getBoundingClientRect().height,
      html.scrollHeight, html.offsetHeight, html.getBoundingClientRect().height
    );
    if (h > MIN_HEIGHT) {
      iframe.style.height = Math.ceil(h) + 'px';
      iframe.style.minHeight = '0';
    }
  }

  function watch(iframe) {
    if (iframe.__demoResizeWatched) return;
    iframe.__demoResizeWatched = true;

    var schedule = function () {
      if (iframe.__demoResizeFrame) return;
      iframe.__demoResizeFrame = requestAnimationFrame(function () {
        iframe.__demoResizeFrame = null;
        measure(iframe);
      });
    };

    var doc;
    try {
      doc = iframe.contentDocument;
    } catch (e) {
      doc = null;
    }
    if (!doc) return;

    // 初次加载后可能还在渲染，多测几次
    [0, 60, 200, 500, 1200].forEach(function (delay) {
      setTimeout(function () { measure(iframe); }, delay);
    });

    // 内容尺寸变化
    if (window.ResizeObserver) {
      try {
        var ro = new ResizeObserver(schedule);
        ro.observe(doc.documentElement);
        if (doc.body) ro.observe(doc.body);
      } catch (e) { /* 忽略 */ }
    }

    // 结构变化（增删节点、改文案）
    if (window.MutationObserver) {
      try {
        new MutationObserver(schedule).observe(doc.body || doc.documentElement, {
          childList: true, subtree: true, attributes: true, characterData: true
        });
      } catch (e) { /* 忽略 */ }
    }

    // 用户交互后内容可能变化
    doc.addEventListener('click', schedule, true);
    doc.addEventListener('keyup', schedule, true);

    // 兜底轮询，覆盖 ResizeObserver 缺失或被忽略的场景
    var ticks = 0;
    var timer = setInterval(function () {
      measure(iframe);
      ticks += 1;
      if (ticks > 40) clearInterval(timer);
    }, 500);
  }

  function handleIframe(iframe) {
    iframe.addEventListener('load', function () {
      requestAnimationFrame(function () { measure(iframe); watch(iframe); });
    });
    try {
      if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
        measure(iframe);
        watch(iframe);
      }
    } catch (e) { /* 跨域 */ }
  }

  document.querySelectorAll('iframe').forEach(handleIframe);

  if (window.MutationObserver) {
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.tagName === 'IFRAME') handleIframe(node);
          if (node.querySelectorAll) node.querySelectorAll('iframe').forEach(handleIframe);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }
})();
