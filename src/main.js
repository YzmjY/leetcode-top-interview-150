import { buildMergeTrace, parseArray, GO_CODE } from './merge.js';

const $ = (selector) => document.querySelector(selector);
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const number = (value) => String(value).replace('-', '−');
const format = (values) => `[${values.join(', ')}]`;
let input = { a: [1, 2, 3], b: [2, 5, 6] };
let frames = traceFor(input);
let index = 0;
let timer = null;
let playing = false;
let toastTimer;

function traceFor({ a, b }) {
  return buildMergeTrace([...a, ...b.map(() => 0)], a.length, b, b.length);
}

function highlight(line) {
  return line.split(/(\/\/.*$|"[^"\n]*"|\b(?:func|for|if|else|return|int|len)\b|\b\d+\b)/g).map((token) => {
    const cls = token.startsWith('//') ? 'syntax-comment' : token.startsWith('"') ? 'syntax-string' : /^(func|for|if|else|return)$/.test(token) ? 'syntax-keyword' : /^(int|len)$/.test(token) ? 'syntax-type' : /^\d+$/.test(token) ? 'syntax-number' : '';
    return cls ? `<span class="${cls}">${escape(token)}</span>` : escape(token);
  }).join('');
}

$('#source-code').innerHTML = GO_CODE.map((line, i) => `<span class="code-line" data-line="${i + 1}"><span class="line-number" aria-hidden="true">${i + 1}</span><code>${highlight(line) || ' '}</code></span>`).join('');

function renderArray(values, name, frame) {
  if (values.length === 0) return '<span class="empty-array">[ ] <span>空数组</span></span>';
  return values.map((value, cellIndex) => {
    const isA = name === 'a';
    const settled = isA && cellIndex >= frame.sortedFrom;
    const reserved = isA && cellIndex >= input.a.length && !settled;
    const iPointer = isA && cellIndex === frame.i;
    const jPointer = !isA && cellIndex === frame.j;
    const kPointer = isA && cellIndex === frame.k && frame.phase !== 'done';
    const consumed = !isA && cellIndex > frame.j;
    const written = isA && cellIndex === frame.writeIndex && frame.phase === 'write';
    const selected = (isA ? iPointer : jPointer) && frame.selected === name && ['compare', 'write'].includes(frame.phase);
    const classes = [settled && 'settled', reserved && 'reserved', iPointer && 'i-pointer', jPointer && 'j-pointer', kPointer && 'k-pointer', consumed && 'consumed', written && 'just-written', selected && 'selected'].filter(Boolean).join(' ');
    const tags = `${iPointer ? '<span class="pointer-tag i-tag">i</span>' : ''}${jPointer ? '<span class="pointer-tag j-tag">j</span>' : ''}${kPointer ? '<span class="pointer-tag k-tag">k</span>' : ''}`;
    const wide = !reserved && String(value).length > 4;
    return `<div class="array-cell ${classes}${wide ? ' wide-cell' : ''}" ${wide ? `style="--digits:${String(value).length}"` : ''} aria-label="下标 ${cellIndex}，${reserved ? '预留位置' : `值 ${value}`}${iPointer ? '，第一组指针 i' : ''}${jPointer ? '，第二组指针 j' : ''}${kPointer ? '，写入位置 k' : ''}${settled ? '，已归位' : ''}"><div class="pointer-tags">${tags}</div><span class="cell-index">${String(cellIndex).padStart(2, '0')}</span><span class="cell-value">${reserved ? '<span class="placeholder-zero">0</span>' : number(value)}</span>${written ? '<span class="write-mark">↓ 写入</span>' : ''}</div>`;
  }).join('');
}

function render() {
  const frame = frames[index];
  const isDone = frame.phase === 'done';
  $('#array-a').innerHTML = renderArray(frame.a, 'a', frame);
  $('#array-b').innerHTML = renderArray(frame.b, 'b', frame);
  $('#input-caption').innerHTML = `<span>输入</span><code>m = ${input.a.length} &nbsp; / &nbsp; n = ${input.b.length}</code><span>从右向左，逐个归位</span>`;
  $('#comparison').innerHTML = isDone ? '<span class="finished-equation">合并完成 <span>✓</span></span>' : `<span class="value-a">${frame.i >= 0 ? number(frame.a[frame.i]) : '∅'}</span><span class="compare-symbol">${frame.i >= 0 && frame.j >= 0 ? frame.a[frame.i] > frame.b[frame.j] ? '>' : frame.a[frame.i] < frame.b[frame.j] ? '<' : '=' : '·'}</span><span class="value-b">${frame.j >= 0 ? number(frame.b[frame.j]) : '∅'}</span><span class="compare-arrow">→</span><span class="write-target">nums1[${frame.k}]</span>`;
  $('#comparison').classList.toggle('long-comparison', [frame.a[frame.i], frame.b[frame.j]].some((value) => typeof value === 'number' && String(value).length > 5));
  const badge = { initial: '准备就绪', compare: '比较末尾', write: '写入较大值', move: '指针左移', done: '✓ 已完成' }[frame.phase];
  $('#phase-badge').textContent = badge;
  $('#phase-badge').classList.toggle('complete', isDone);
  $('#step-number').textContent = String(index + 1).padStart(2, '0');
  $('#step-total').textContent = frames.length;
  $('#event-title').textContent = frame.title;
  $('#event-description').textContent = frame.description;
  $('#result-label').textContent = isDone ? '最终 nums1' : '已归位的后缀';
  $('#result').textContent = frame.sortedFrom < frame.a.length ? format(frame.a.slice(frame.sortedFrom)) : '等待写入';
  $('#metrics').innerHTML = `<span>${frame.comparisons}<small>次比较</small></span><span>${frame.writes}<small>次写入</small></span>`;
  $('#prev').disabled = index === 0;
  $('#next').disabled = index === frames.length - 1;
  $('#timeline').max = frames.length - 1;
  $('#timeline').value = index;
  $('#timeline').setAttribute('aria-valuetext', `${index + 1} / ${frames.length}，${frame.title}`);
  $('#timeline').style.setProperty('--progress', `${(index / Math.max(1, frames.length - 1)) * 100}%`);
  $('#progress-count').textContent = `${index + 1} / ${frames.length}`;
  const activeLines = frame.lines;
  document.querySelectorAll('.code-line').forEach((line) => {
    const active = activeLines.includes(Number(line.dataset.line));
    line.classList.toggle('active-line', active);
    if (active) line.setAttribute('aria-current', 'step'); else line.removeAttribute('aria-current');
  });
  $('#line-label').textContent = activeLines.length ? `第 ${activeLines[0]}${activeLines.length > 1 ? `–${activeLines.at(-1)}` : ''} 行` : '逆向双指针 · 原地合并';
  const pane = $('#code-pane');
  const active = $('.active-line');
  if (active) {
    const offset = active.getBoundingClientRect().top - pane.getBoundingClientRect().top + pane.scrollTop;
    if (offset < pane.scrollTop || offset + active.offsetHeight > pane.scrollTop + pane.clientHeight) pane.scrollTop = Math.max(0, offset - pane.clientHeight / 3);
  }
  for (const name of ['a', 'b']) {
    const row = $(`#array-${name}`);
    const pointer = row.querySelector(name === 'a' ? '.k-pointer' : '.j-pointer');
    if (pointer && (pointer.offsetLeft < row.scrollLeft || pointer.offsetLeft + pointer.offsetWidth > row.scrollLeft + row.clientWidth)) row.scrollLeft = pointer.offsetLeft - row.clientWidth / 2;
  }
}

function setPlaying(value) {
  playing = value;
  clearTimeout(timer);
  timer = null;
  $('#play span').textContent = playing ? '暂停播放' : index === frames.length - 1 ? '重新播放' : '自动播放';
  $('#play use').setAttribute('href', playing ? '#icon-pause' : '#icon-play');
  $('#play').setAttribute('aria-pressed', String(playing));
  if (playing) schedule();
}

function schedule() {
  timer = setTimeout(() => {
    if (index < frames.length - 1) { index++; render(); }
    if (index === frames.length - 1) setPlaying(false);
    else schedule();
  }, 1100 / Number($('#speed').value));
}

function stepTo(value) {
  setPlaying(false);
  index = Math.min(frames.length - 1, Math.max(0, value));
  render();
  setPlaying(false);
}

$('#play').addEventListener('click', () => {
  if (!playing && index === frames.length - 1) { index = 0; render(); }
  setPlaying(!playing);
});
$('#prev').addEventListener('click', () => stepTo(index - 1));
$('#next').addEventListener('click', () => stepTo(index + 1));
$('#reset').addEventListener('click', () => stepTo(0));
$('#timeline').addEventListener('input', (event) => stepTo(Number(event.target.value)));
$('#speed').addEventListener('change', () => { if (playing) setPlaying(true); });

const dialog = $('#edit-dialog');
$('#edit').addEventListener('click', () => {
  setPlaying(false);
  $('#input-a').value = format(input.a);
  $('#input-b').value = format(input.b);
  $('#form-error').textContent = '';
  dialog.showModal();
});
for (const id of ['close-dialog', 'cancel-edit']) $(`#${id}`).addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
const presets = { normal: [[1, 2, 3], [2, 5, 6]], 'empty-a': [[], [1]], 'empty-b': [[1], []], duplicates: [[-3, -1, 0], [-2, -1, 0]] };
document.querySelectorAll('[data-preset]').forEach((button) => button.addEventListener('click', () => {
  const [a, b] = presets[button.dataset.preset];
  $('#input-a').value = format(a);
  $('#input-b').value = format(b);
  $('#form-error').textContent = '';
}));
$('#edit-form').addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const next = { a: parseArray($('#input-a').value), b: parseArray($('#input-b').value) };
    const nextFrames = traceFor(next);
    input = next;
    frames = nextFrames;
    stepTo(0);
    dialog.close();
    toast('新数组已就绪，开始实验吧。');
  } catch (error) { $('#form-error').textContent = error.message; }
});

function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2800);
}

$('#copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(GO_CODE.join('\n'));
    $('#copy span').textContent = '已复制 ✓';
    toast('Go 代码已复制。');
    setTimeout(() => { $('#copy span').textContent = '复制代码'; }, 2200);
  } catch { toast('浏览器未允许复制，请选中右侧代码复制。'); }
});

document.addEventListener('keydown', (event) => {
  if (dialog.open || event.ctrlKey || event.altKey || event.metaKey || event.target.closest('input, textarea, select, button, a, [tabindex], [contenteditable="true"]')) return;
  if (event.key === 'ArrowLeft') { event.preventDefault(); stepTo(index - 1); }
  else if (event.key === 'ArrowRight') { event.preventDefault(); stepTo(index + 1); }
  else if (event.code === 'Space') { event.preventDefault(); $('#play').click(); }
});

const navLinks = [...document.querySelectorAll('nav a')];
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) if (entry.isIntersecting) navLinks.forEach((link) => link.classList.toggle('current', link.hash === `#${entry.target.id}`));
}, { rootMargin: '-15% 0px -65% 0px' });
document.querySelectorAll('main > section').forEach((section) => observer.observe(section));
render();
setPlaying(false);
