/* ==========================================================================
   交互演示统一运行时 (demo.js)
   所有演示共用同一套外壳与交互逻辑：标题、步骤徽章、控制按钮、说明、进度条、
   图例、键盘快捷键与自动播放。各演示只负责「步骤数据」与「舞台渲染」。

   用法：
     <script src="demo.js"></script>
     <script>
       Demo.create({
         title: '1. 合并两个有序数组 — 逆向双指针',
         info: 'nums1 = [1,2,3,0,0,0], nums2 = [2,5,6]',
         steps: [...],
         desc: (s, i) => `第 ${i + 1} 步：${s.note}`,
         legend: [{ color: 'var(--demo-accent)', label: '当前比较' }],
         render(step, i, ctx) {
           ctx.stage.innerHTML = '...';   // 渲染可视化区域
         }
       });
     </script>
   ========================================================================== */

(function (global) {
  'use strict';

  var DEFAULT_AUTO_MS = 800;

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function el(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function resolve(value, step, index, fallback) {
    if (typeof value === 'function') {
      var out = value(step, index);
      return out == null ? fallback : out;
    }
    return value == null ? fallback : value;
  }

  function create(config) {
    if (!config || !config.title) {
      throw new Error('Demo.create 需要 title');
    }

    var host = typeof config.mount === 'string'
      ? document.querySelector(config.mount)
      : (config.mount || document.body);

    var steps = config.steps || [];
    var autoMs = config.autoMs || DEFAULT_AUTO_MS;
    var index = 0;
    var timer = null;
    var resizeHandlers = [];
    var stepHandlers = [];

    /* ---------- 构建外壳 ---------- */

    var root = el('div', 'demo');
    var header = el('div', 'demo__header');
    header.appendChild(el('span', 'demo__title', esc(config.title)));
    var stepBadge = el('span', 'demo__step', '步骤 0 / 0');
    header.appendChild(stepBadge);

    var controls = el('div', 'demo__controls');
    var buttons = {
      reset: el('button', null, '⟲ 重置'),
      prev: el('button', null, '◀ 上一步'),
      next: el('button', null, '下一步 ▶'),
      auto: el('button', 'is-primary', '▶ 自动播放'),
      end: el('button', null, '⏭ 跳到最后')
    };
    Object.keys(buttons).forEach(function (key) { controls.appendChild(buttons[key]); });

    var body = el('div', 'demo__body');
    var infoBox = el('div', 'demo__info');
    var descBox = el('div', 'demo__desc');
    var progress = el('div', 'demo__progress');
    var progressFill = el('div', 'demo__progress-fill');
    progress.appendChild(progressFill);
    var stage = el('div', 'demo__stage');
    if (config.stageHeight) stage.style.minHeight = config.stageHeight + 'px';

    body.appendChild(infoBox);
    body.appendChild(descBox);
    body.appendChild(progress);
    body.appendChild(stage);

    if (config.legend && config.legend.length) {
      var legend = el('div', 'demo__legend');
      config.legend.forEach(function (item) {
        var entry = el('div', 'demo__legend-item');
        var dot = el('div', 'demo__legend-dot');
        dot.style.background = item.color;
        entry.appendChild(dot);
        entry.appendChild(el('span', null, esc(item.label)));
        legend.appendChild(entry);
      });
      body.appendChild(legend);
    }

    body.appendChild(el('div', 'demo__hint', '键盘：← → 切换步骤 · 空格 自动播放'));

    root.appendChild(header);
    root.appendChild(controls);
    root.appendChild(body);
    host.appendChild(root);

    /* ---------- 内部逻辑 ---------- */

    var inst = {
      root: root,
      stage: stage,
      info: infoBox,
      desc: descBox
    };

    function currentStep() {
      return steps[Math.max(0, Math.min(index, steps.length - 1))];
    }

    function refreshChrome() {
      var total = steps.length;
      stepBadge.textContent = total ? '步骤 ' + (index + 1) + ' / ' + total : '步骤 0 / 0';
      progressFill.style.width = total ? ((index + 1) / total) * 100 + '%' : '0%';
      buttons.prev.disabled = index <= 0;
      buttons.next.disabled = total === 0 || index >= total - 1;
      buttons.end.disabled = total === 0 || index >= total - 1;
      buttons.auto.disabled = total <= 1;
    }

    function paint() {
      var step = currentStep();
      if (infoBox) {
        infoBox.innerHTML = resolve(config.info, step, index, '');
      }
      descBox.innerHTML = resolve(config.desc, step, index, '');
      if (typeof config.render === 'function') {
        config.render(step, index, inst);
      }
      refreshChrome();
      stepHandlers.forEach(function (fn) { fn(step, index, inst); });
    }

    function stopAuto() {
      if (timer) { clearInterval(timer); timer = null; }
      buttons.auto.classList.remove('is-primary');
      buttons.auto.textContent = '▶ 自动播放';
    }

    function startAuto() {
      stopAuto();
      if (steps.length <= 1) return;
      if (index >= steps.length - 1) index = 0;
      buttons.auto.classList.add('is-primary');
      buttons.auto.textContent = '⏸ 暂停';
      paint();
      timer = setInterval(function () {
        if (index < steps.length - 1) {
          index += 1;
          paint();
        } else {
          stopAuto();
        }
      }, autoMs);
    }

    function go(target) {
      stopAuto();
      if (!steps.length) return;
      index = Math.max(0, Math.min(steps.length - 1, target));
      paint();
    }

    function rebuild() {
      if (typeof config.buildSteps === 'function') {
        steps = config.buildSteps() || [];
      }
      if (typeof config.reset === 'function') config.reset();
      index = 0;
      stopAuto();
      paint();
    }

    buttons.reset.addEventListener('click', function () { rebuild(); });
    buttons.prev.addEventListener('click', function () { go(index - 1); });
    buttons.next.addEventListener('click', function () { go(index + 1); });
    buttons.end.addEventListener('click', function () { go(steps.length - 1); });
    buttons.auto.addEventListener('click', function () {
      if (timer) { stopAuto(); paint(); } else { startAuto(); }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight') { event.preventDefault(); go(index + 1); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); go(index - 1); }
      else if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        if (timer) { stopAuto(); paint(); } else { startAuto(); }
      }
    });

    window.addEventListener('resize', function () {
      resizeHandlers.forEach(function (fn) { fn(stage); });
      paint();
    });

    /* ---------- 对外接口 ---------- */

    inst.go = go;
    inst.next = function () { go(index + 1); };
    inst.prev = function () { go(index - 1); };
    inst.reset = rebuild;
    inst.jumpEnd = function () { go(steps.length - 1); };
    inst.play = startAuto;
    inst.pause = function () { stopAuto(); paint(); };
    inst.toggle = function () { if (timer) { stopAuto(); paint(); } else { startAuto(); } };
    inst.paint = paint;
    inst.setSteps = function (next) { steps = next || []; index = 0; stopAuto(); paint(); };
    inst.onResize = function (fn) { resizeHandlers.push(fn); };
    inst.onStep = function (fn) { stepHandlers.push(fn); };
    Object.defineProperty(inst, 'index', { get: function () { return index; } });
    Object.defineProperty(inst, 'steps', { get: function () { return steps; } });

    paint();
    instances.push(inst);
    global.__lastDemo = inst;
    return inst;
  }

  var instances = [];
  global.Demo = { create: create, esc: esc, el: el, instances: instances };
})(window);
