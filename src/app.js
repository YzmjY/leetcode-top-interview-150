import {catalog} from './catalog-data.js';
import {lessons,getLesson} from './lessons.js';
import {traceLesson} from './lesson-kit.js';
import {escapeHtml as esc,display} from './scenes.js';
import {updateScene} from './scene-player.js';
import {readable,displayCode,highlightLines} from './presentation.js';
import {getStrategy} from './strategies.js';
import {renderTeaching} from './explainers.js';
import {getReasoning} from './reasoning.js';

const $=(selector)=>document.querySelector(selector);
const inline=(text)=>esc(text).replace(/`([^`]+)`/g,'<code>$1</code>');
const pretty=(value)=>JSON.stringify(value,null,2);
const sceneNames={array:'数组与指针',text:'字符与窗口',matrix:'矩阵网格',table:'状态表',tree:'树结构',graph:'图与遍历',linked:'链表与指针',trie:'字典树',intervals:'区间数轴',stack:'栈状态',bits:'二进制位',state:'计算状态'};
let current,trace,index=0,timer=null,playing=false,input,toastTimer;
const completedCount=lessons.filter(x=>typeof x.solve==='function').length;

$('.collection-link')?.remove();
$('.header-inner').insertAdjacentHTML('beforeend','<button id="catalog-open" class="catalog-trigger" aria-haspopup="dialog" aria-label="打开150题题目索引"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h2m3 0h9M3 10h2m3 0h9M3 15h2m3 0h9"/></svg><span class="catalog-entry-text">题目索引</span><span class="catalog-entry-count">150</span><span class="catalog-chevron">⌄</span></button>');
document.body.insertAdjacentHTML('beforeend',`<dialog id="catalog-dialog" class="catalog-dialog" aria-labelledby="catalog-title"><div class="catalog-top"><div><div class="eyebrow">THE INTERVIEW COLLECTION</div><h2 id="catalog-title">面试经典 150 题</h2><p>23 个知识分组 · ${completedCount} 个交互实验</p></div><button id="catalog-close" class="close-button" aria-label="关闭目录">×</button></div><div class="catalog-filters"><input id="catalog-search" type="search" autocomplete="off" placeholder="搜索题号、题目或算法分类" aria-label="搜索题目"><label><span class="sr-only">题目难度</span><select id="difficulty-filter" aria-label="题目难度"><option value="">全部难度</option><option>简单</option><option>中等</option><option>困难</option></select></label></div><div id="catalog-results" class="catalog-results"></div><div class="catalog-bottom"><span id="catalog-count"></span><a href="https://leetcode.cn/studyplan/top-interview-150/" target="_blank" rel="noreferrer">官方题单 ↗</a></div></dialog>`);

$('.array-stage').innerHTML='<div id="scene-canvas"></div>';
$('.array-stage').classList.add('scene-stage');
$('.legend').innerHTML='<span><i class="legend-dot a-color"></i>正在处理</span><span><i class="legend-dot b-color"></i>辅助状态</span><span><i class="legend-dot k-color"></i>目标 / 指针</span>';
$('.comparison-strip>.micro-label').textContent='当前状态';
$('#lab-title').textContent='算法实验台';
$('#edit').innerHTML='<svg><use href="#icon-edit"/></svg>编辑输入';
$('#result-label').textContent='实际输出';
$('#speed').insertAdjacentHTML('beforeend','<option value="4">4×</option>');
$('#edit-dialog').innerHTML=`<form id="edit-form" novalidate><div class="dialog-heading"><div><div class="eyebrow">YOUR OWN EXAMPLE</div><h2 id="dialog-title">换一组输入，试试看。</h2></div><button class="close-button" type="button" id="close-dialog" aria-label="关闭编辑">×</button></div><p id="input-help">使用 JSON 参数。数组、矩阵与树的格式可参考当前示例。</p><label for="lesson-input">输入参数</label><textarea id="lesson-input" spellcheck="false" autocomplete="off" aria-describedby="input-help form-error"></textarea><div class="presets" id="lesson-presets"></div><p class="form-error" id="form-error" role="alert"></p><div class="dialog-actions"><button type="button" class="subtle-button" id="cancel-edit">取消</button><button type="submit" class="play-button">应用并重置 ↗</button></div></form>`;
$('footer').insertAdjacentHTML('beforebegin','<div class="lesson-navigation"><button id="previous-lesson"><span>← 上一题</span><strong></strong></button><span id="lesson-position"></span><button id="next-lesson"><span>下一题 →</span><strong></strong></button></div>');

function highlight(line) {
 return line.split(/(\/\/.*$|"[^"\n]*"|`[^`]*`|\b(?:func|for|if|else|return|range|type|struct|map|make|append|delete|switch|case|default|break|continue|import|package|nil|true|false|int|int64|uint32|byte|rune|string|bool|float64|len|cap)\b|\b\d+\b)/g).map(token=>{
  const cls=token.startsWith('//')?'syntax-comment':token.startsWith('"')||token.startsWith('`')?'syntax-string':/^(func|for|if|else|return|range|type|struct|switch|case|default|break|continue|import|package)$/.test(token)?'syntax-keyword':/^(int|int64|uint32|byte|rune|string|bool|float64|map|make|append|delete|len|cap)$/.test(token)?'syntax-type':/^(\d+|nil|true|false)$/.test(token)?'syntax-number':'';
  return cls?`<span class="${cls}">${esc(token)}</span>`:esc(token);
 }).join('');
}
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3000);}

function renderCatalog(){
 const term=$('#catalog-search').value.trim().toLocaleLowerCase();const difficulty=$('#difficulty-filter').value;
 const filtered=catalog.filter(q=>(!difficulty||q.difficulty===difficulty)&&`${q.id} ${q.title} ${q.en} ${q.category}`.toLocaleLowerCase().includes(term));
 const groups=[...new Set(filtered.map(q=>q.category))];
 $('#catalog-results').innerHTML=groups.map(group=>{
  const questions=filtered.filter(q=>q.category===group);
  return `<details class="catalog-group" ${term||difficulty||group===current?.category?'open':''}><summary>${esc(group)}<span>${questions.length}</span></summary><div>${questions.map(q=>`<button class="catalog-item${q.id===current?.id?' selected':''}" data-problem="${q.id}"${q.id===current?.id?' aria-current="page"':''}><span class="catalog-number">${String(q.ordinal).padStart(3,'0')}</span><span><strong>${esc(q.title)}</strong><small>LEETCODE ${q.id}</small></span><em class="difficulty-label ${q.difficulty==='简单'?'easy':q.difficulty==='中等'?'medium':'hard'}">${q.difficulty}</em></button>`).join('')}</div></details>`;
 }).join('')||'<div class="catalog-empty">没有找到匹配的题目。试试题号、中文名或分类名称。</div>';
 $('#catalog-count').textContent=`${filtered.length} / 150 题`;
}

function loadLesson(id,{historyMode='push',scroll=true}={}){
 const lesson=getLesson(id)||getLesson(88);
 if(typeof lesson.solve!=='function'){toast('这道题的内容尚在加载，请稍后再试。');return;}
 const nextInput=structuredClone(lesson.input),nextTrace=traceLesson(lesson,nextInput);
 setPlaying(false);current=lesson;input=nextInput;trace=nextTrace;index=0;
 $('#title').innerHTML=`${esc(lesson.title)} <span>${esc(lesson.en)}</span>`;
 document.title=`${lesson.title} · 序场算法实验室`;
 $('.problem-meta').innerHTML=`<span>INTERVIEW 150</span><i></i><span>${String(lesson.ordinal).padStart(3,'0')} / 150</span><span class="difficulty difficulty-${lesson.difficulty==='简单'?'easy':lesson.difficulty==='中等'?'medium':'hard'}">${lesson.difficulty}</span>`;
 $('.brief-heading').innerHTML=`<span>题目说明</span><span>LEETCODE ${lesson.id}</span>`;
 $('.hero-description').innerHTML=inline(lesson.summary);
 $('.problem-rule').innerHTML=inline(lesson.rule);
 $('.example-summary').innerHTML=`<div><span>示例输入</span><pre>${esc(readable(lesson.input))}</pre></div><div class="example-result"><span>预期结果</span><pre>${esc(readable(lesson.expected))}</pre></div>`;
 $('.tags').innerHTML=[lesson.category,sceneNames[nextTrace.frames[0].scene.kind]||'算法演示',lesson.time].map((value,i)=>`<span${i===2?' class="blue-tag"':''}>${esc(value)}</span>`).join('');
 $('.problem-link').href=`https://leetcode.cn/problems/${lesson.slug}/`;$('.problem-link').innerHTML=`LeetCode ${lesson.id} <span>↗</span>`;
 const strategy=getStrategy(lesson);$('.strategy-grid').classList.add('teaching-host');$('.strategy-grid').innerHTML=renderTeaching(lesson,strategy,getReasoning(lesson));
 $('.strategy-section .section-note').textContent=({insight:'关键观察',flow:'逐步建立答案',vertical:'沿结构推进',decision:'判断依据与分支',comparison:'两种角色，分清职责',recurrence:'状态定义 · 转移 · 边界'})[strategy.layout];
 $('.complexity-note p').innerHTML=`时间复杂度 <code>${esc(lesson.time)}</code>；额外空间 <code>${esc(lesson.space)}</code>。`;
 $('.invariant').textContent=lesson.category;
 $('#lab-title').textContent=`${({matrix:'网格',tree:'树结构',graph:'图结构',linked:'链表',trie:'字典树',table:'状态表',bits:'二进制',stack:'栈',intervals:'区间'})[nextTrace.frames[0].scene.kind]||'算法'}实验台`;
 const code=displayCode(lesson).split('\n');
 $('#source-code').innerHTML=code.map((line,i)=>`<span class="code-line" data-line="${i+1}"><span class="line-number" aria-hidden="true">${i+1}</span><code>${highlight(line)||' '}</code></span>`).join('');
 $('.file-tab').innerHTML=`<span class="file-dot"></span><span class="source-filename">${esc(lesson.slug.replaceAll('-','_'))}.go</span><span>GO</span>`;
 $('.code-foot>span:last-child').textContent=`${lesson.time} / ${lesson.space}`;
 $('.walkthrough-note').textContent='先预测下一步，再点击演示。观察结构如何变化，也观察当前高亮的 Go 语句。';
 $('.footer-brand span').textContent=`ALGO FIELD / FIELDNOTES ${String(lesson.id).padStart(3,'0')}`;
 $('footer>span').textContent=`面试经典 150 · 第 ${String(lesson.ordinal).padStart(3,'0')} 篇`;
 $('#previous-lesson').disabled=lesson.ordinal===1;$('#next-lesson').disabled=lesson.ordinal===150;
 $('#previous-lesson strong').textContent=catalog[lesson.ordinal-2]?.title||'从第一题开始';
 $('#next-lesson strong').textContent=catalog[lesson.ordinal]?.title||'已到最后一题';
 $('#lesson-position').textContent=`${String(lesson.ordinal).padStart(3,'0')} / 150`;
 render();setPlaying(false);renderCatalog();
 const url=new URL(location.href);url.searchParams.set('problem',lesson.id);url.hash='';
 if(historyMode==='push')history.pushState({},'',url);else if(historyMode==='replace')history.replaceState({},'',url);
 if(scroll)window.scrollTo({top:0,behavior:'instant'});
}

function render(){
 const f=trace.frames[index],done=f.phase==='done';
 updateScene($('#scene-canvas'),f.scene,{key:trace,duration:Math.min(420,850/Number($('#speed').value))});
  const focus=$('#scene-canvas').querySelector('.matrix-cell.active,.node-circle.active,.array-cell.scene-active,.state-table td.active,.stack-cell.active,.bit-cell.active,.k-pointer,.j-pointer,.i-pointer');
  if(focus){for(const viewport of [focus.closest('.matrix-scroll,.node-scroll,.array-scroll,.table-scroll,.bits-scroll'),$('.scene-stage')].filter(Boolean)){const rect=focus.getBoundingClientRect(),box=viewport.getBoundingClientRect();if(rect.right>box.right-12)viewport.scrollLeft+=rect.right-box.right+20;else if(rect.left<box.left+12)viewport.scrollLeft-=box.left-rect.left+20;if(rect.bottom>box.bottom-15)viewport.scrollTop+=rect.bottom-box.bottom+25;else if(rect.top<box.top+15)viewport.scrollTop-=box.top-rect.top+25;}}
 $('#input-caption').innerHTML=`<span>实验</span><code>${esc(sceneNames[f.scene.kind]||'计算状态')}</code><span>LEETCODE ${current.id}</span>`;
 const variables=Object.entries(f.vars||{});
 $('#comparison').innerHTML=variables.length?variables.slice(0,8).map(([key,value])=>`<span class="variable-chip"><small>${esc(key)}</small><b>${esc(display(value))}</b></span>`).join(''):`<span class="scene-type-label">${esc(sceneNames[f.scene.kind]||'观察结构变化')}</span>`;
 $('#phase-badge').textContent=done?'✓ 已完成':'执行中';$('#phase-badge').classList.toggle('complete',done);
 $('#step-number').textContent=String(index+1).padStart(2,'0');$('#step-total').textContent=trace.frames.length;
 $('#event-title').textContent=f.title;$('#event-description').textContent=f.description;
 $('#result').textContent=done?readable(trace.result):'逐步执行，观察上方状态变化';
 $('#result').classList.toggle('final-result',done);
 $('#metrics').innerHTML=`<span>${index+1}<small>当前帧</small></span><span>${trace.frames.length}<small>总帧数</small></span>`;
 $('#prev').disabled=index===0;$('#next').disabled=index===trace.frames.length-1;
 $('#timeline').max=trace.frames.length-1;$('#timeline').value=index;
 $('#timeline').setAttribute('aria-valuetext',`${index+1} / ${trace.frames.length}，${f.title}`);
 $('#timeline').style.setProperty('--progress',`${index/Math.max(1,trace.frames.length-1)*100}%`);
 $('#progress-count').textContent=`${index+1} / ${trace.frames.length}`;
 const shownLines=highlightLines(current,f);
 document.querySelectorAll('.code-line').forEach(line=>{const active=shownLines.includes(Number(line.dataset.line));line.classList.toggle('active-line',active);if(active)line.setAttribute('aria-current','step');else line.removeAttribute('aria-current');});
 $('#line-label').textContent=`第 ${shownLines.join('、')} 行`;
 const active=$('.active-line'),pane=$('#code-pane');if(active){const offset=active.getBoundingClientRect().top-pane.getBoundingClientRect().top+pane.scrollTop;if(offset<pane.scrollTop||offset+active.offsetHeight>pane.scrollTop+pane.clientHeight)pane.scrollTop=Math.max(0,offset-pane.clientHeight/3);}
}
function setPlaying(value){playing=value;clearTimeout(timer);timer=null;$('#play span').textContent=playing?'暂停播放':trace&&index===trace.frames.length-1?'重新播放':'自动播放';$('#play use').setAttribute('href',playing?'#icon-pause':'#icon-play');$('#play').setAttribute('aria-pressed',String(playing));if(playing)schedule();}
function schedule(){timer=setTimeout(()=>{if(index<trace.frames.length-1){index++;render();}if(index===trace.frames.length-1)setPlaying(false);else schedule();},1100/Number($('#speed').value));}
function stepTo(value){setPlaying(false);index=Math.min(trace.frames.length-1,Math.max(0,value));render();setPlaying(false);}
$('#play').addEventListener('click',()=>{if(!playing&&index===trace.frames.length-1){index=0;render();}setPlaying(!playing);});
$('#prev').addEventListener('click',()=>stepTo(index-1));$('#next').addEventListener('click',()=>stepTo(index+1));$('#reset').addEventListener('click',()=>stepTo(0));
$('#timeline').addEventListener('input',e=>stepTo(Number(e.target.value)));$('#speed').addEventListener('change',()=>{if(playing)setPlaying(true);});
$('#previous-lesson').addEventListener('click',()=>loadLesson(catalog[current.ordinal-2].id));$('#next-lesson').addEventListener('click',()=>loadLesson(catalog[current.ordinal].id));

const editDialog=$('#edit-dialog');
$('#edit').addEventListener('click',()=>{setPlaying(false);$('#lesson-input').value=pretty(input);$('#form-error').textContent='';$('#lesson-input').removeAttribute('aria-invalid');$('#lesson-presets').innerHTML='<span>快速试试</span><button type="button" data-case="-1">默认示例</button>'+(current.cases||[]).slice(0,4).map((c,i)=>`<button type="button" data-case="${i}">${esc(c.name||`示例 ${i+2}`)}</button>`).join('');editDialog.showModal();});
$('#lesson-presets').addEventListener('click',e=>{const button=e.target.closest('[data-case]');if(!button)return;const c=Number(button.dataset.case);$('#lesson-input').value=pretty(c<0?current.input:current.cases[c].input);$('#form-error').textContent='';});
for(const id of ['cancel-edit','close-dialog'])$(`#${id}`).addEventListener('click',()=>editDialog.close());
function validateSize(value,depth=0,budget={count:0}){if(++budget.count>2400||depth>15)throw Error('输入结构太大，请使用更小的示例。');if(typeof value==='number'&&!Number.isFinite(value))throw Error('请输入有限的数值。');if(typeof value==='string'&&value.length>600)throw Error('演示字符串最多支持 600 个字符。');if(Array.isArray(value)&&value.length>200)throw Error('单个演示数组最多支持 200 项。');if(value&&typeof value==='object')for(const child of Object.values(value))validateSize(child,depth+1,budget);}
$('#edit-form').addEventListener('submit',e=>{e.preventDefault();try{const raw=$('#lesson-input').value;if(raw.length>22000)throw Error('输入过长，请缩小示例。');let next;try{next=JSON.parse(raw);}catch{throw Error('JSON 格式不正确，请检查括号、双引号和逗号。');}validateSize(next);if(current.input&&typeof current.input==='object'&&!Array.isArray(current.input)){if(!next||typeof next!=='object'||Array.isArray(next))throw Error('请输入包含各参数的 JSON 对象。');for(const key of Object.keys(current.input))if(!(key in next))throw Error(`缺少参数：${key}`);}
 const nextTrace=traceLesson(current,next);input=next;trace=nextTrace;stepTo(0);editDialog.close();toast('新输入已就绪。');
 }catch(error){$('#form-error').textContent=error instanceof TypeError?'输入结构与示例不一致，请检查各参数的类型。':error.message;$('#lesson-input').setAttribute('aria-invalid','true');}});
$('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(displayCode(current));toast('Go 代码已复制。');}catch{toast('浏览器未允许复制，请选中代码复制。');}});

const catalogue=$('#catalog-dialog');$('#catalog-open').addEventListener('click',()=>{setPlaying(false);renderCatalog();catalogue.showModal();$('#catalog-search').focus();});$('#catalog-close').addEventListener('click',()=>catalogue.close());
$('#catalog-search').addEventListener('input',renderCatalog);$('#difficulty-filter').addEventListener('change',renderCatalog);
$('#catalog-results').addEventListener('click',e=>{const button=e.target.closest('[data-problem]');if(!button)return;catalogue.close();if(Number(button.dataset.problem)!==current.id)loadLesson(Number(button.dataset.problem));});
for(const dialog of [editDialog,catalogue])dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
document.addEventListener('keydown',e=>{if(editDialog.open||catalogue.open||e.ctrlKey||e.altKey||e.metaKey||e.target.closest('input,textarea,select,button,a,[tabindex],[contenteditable="true"]'))return;if(e.key==='ArrowLeft'){e.preventDefault();stepTo(index-1);}else if(e.key==='ArrowRight'){e.preventDefault();stepTo(index+1);}else if(e.code==='Space'){e.preventDefault();$('#play').click();}});
window.addEventListener('popstate',()=>{const id=Number(new URLSearchParams(location.search).get('problem'))||88;if(id!==current.id)loadLesson(id,{historyMode:'none'});});
const navLinks=[...document.querySelectorAll('nav a')];const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)navLinks.forEach(link=>link.classList.toggle('current',link.hash===`#${entry.target.id}`));},{rootMargin:'-15% 0px -65% 0px'});document.querySelectorAll('main>section').forEach(section=>observer.observe(section));
loadLesson(Number(new URLSearchParams(location.search).get('problem'))||88,{historyMode:'replace',scroll:false});
