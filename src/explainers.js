import {escapeHtml as esc} from './scenes.js';
const label=(x,y,value,cls='')=>`<text x="${x}" y="${y}" text-anchor="middle" class="${cls}">${esc(value)}</text>`;
const box=(x,y,w,h,value,cls='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" class="${cls}"/>${label(x+w/2,y+h/2+5,value)}`;
const circle=(x,y,value,cls='')=>`<circle cx="${x}" cy="${y}" r="24" class="${cls}"/>${label(x,y+5,value)}`;
const path=(d,cls='')=>`<path d="${d}" class="${cls}"/>`;
function illustration(kind){
 let drawing='',caption='',title='';
 if(kind==='binary-slope'){
  title='一段上坡，为什么右侧一定有峰？';caption='mid 右边更高时，继续上升会在末端遇到峰，途中转为下降也会形成峰，因此可以安全舍弃 mid 及其左侧。';
  drawing=[1,2,1,3,5,6,4].map((v,i)=>box(55+i*64,150-v*16,38,v*16,v,i===3?'active':'')).join('')+label(74,178,'lo')+label(266,178,'mid')+label(458,178,'hi')+path('M 276 91 L 310 59','accent-arrow')+label(365,30,'右侧必有峰')+label(280,212,'nums[mid] < nums[mid+1]  →  lo = mid + 1','formula-label');
 }else if(kind==='tree-gain'){
  title='经过当前节点的路径，与返回给父节点的贡献';caption='l、r 是截为非负的左右贡献。更新全局答案时可以连接两侧；向父节点返回时只能选一侧，才能保持路径没有分叉。';
  drawing=path('M 170 161 L 280 88 L 390 161','gain-path')+path('M 280 63 L 280 17','accent-arrow')+circle(280,83,'n.Val','active')+circle(170,163,'l')+circle(390,163,'r')+label(387,27,'n.Val + max(l, r)')+label(280,222,'更新全局：n.Val + l + r','formula-label')+label(101,124,'l ≥ 0')+label(458,124,'r ≥ 0');
 }else if(kind==='reverse-merge'){
  title='从右往左，把大的元素放到预留位置';caption='写入位置 k 始终在 nums1 尚未读取位置 i 的右侧，所以写入 6 不会覆盖仍需比较的 1、2、3。';
  drawing=label(46,63,'nums1')+label(46,161,'nums2')+[1,2,3,'·','·','·'].map((v,i)=>box(117+i*56,36,44,47,v,i===2?'active':i===5?'target':'')).join('')+[2,5,6].map((v,i)=>box(285+i*56,135,44,47,v,i===2?'aux':'')).join('')+path('M 419 130 L 419 89','accent-arrow')+label(251,109,'i')+label(419,25,'k')+label(419,207,'j');
 }else if(kind==='water-level'){
  title='水位由左右挡板中较矮的一侧决定';caption='当前柱顶上方到可达水位之间的差值就是积水高度。双指针每次结算已经能够确定水位的一侧。';
  drawing=[3,0,2,0,4].map((v,i)=>`<rect x="${106+i*65}" y="${173-3*32}" width="42" height="${Math.max(0,(3-v)*32)}" class="water-fill"/>`+box(106+i*65,173-v*32,42,Math.max(v*32,2),v)).join('')+path('M 95 77 L 444 77','water-line')+label(280,28,'水位 = min(左侧最高，右侧最高)')+label(280,212,'积水 = 水位 − 当前柱高','formula-label');
 }else if(kind==='window-cover'){
  title='覆盖以后，左边界才有资格继续收缩';caption='窗口需要满足目标字符的频次，而不只是出现过这些字符。每次删掉左端字符后，重新检查覆盖是否仍然成立。';
  drawing='ADOBECODEBANC'.split('').map((v,i)=>box(40+i*37,73,31,44,v,i>=9?'active':'')).join('')+label(388,145,'left')+label(499,145,'right')+label(280,34,'目标：A × 1，B × 1，C × 1')+label(280,202,'BANC 覆盖全部缺口，再尝试向右收缩','formula-label');
 }else if(kind==='grid-components'){
  title='四方向相连的陆地，属于同一座岛';caption='从一块未访问陆地出发，沿上下左右走完整个连通块。下次找到新的未访问陆地时，岛屿数才加一。';
  const cells=[[1,1,0,0,0,0],[1,0,0,2,2,0],[0,0,0,0,2,0],[3,0,0,0,0,0]];
  drawing=cells.map((row,r)=>row.map((v,c)=>box(150+c*43,23+r*43,35,35,v?'1':'0',v===1?'active':v===2?'aux':v===3?'target':'muted')).join('')).join('')+label(280,218,'3 个连通块 → 3 座岛；对角相接不合并','formula-label');
 }else if(kind==='topological'){
  title='先处理入度为 0 的课程，再解除后继依赖';caption='入度记录还没完成的前置课程数。只有它降到 0 时，课程才可加入队列；最终仍有节点未处理，说明有环。';
  drawing=path('M 133 108 L 251 57','accent-arrow')+path('M 133 108 L 251 159','accent-arrow')+path('M 299 57 L 417 108','accent-arrow')+path('M 299 159 L 417 108','accent-arrow')+circle(110,108,'0','active')+circle(275,47,'1')+circle(275,169,'2')+circle(440,108,'3')+label(110,158,'入度 0')+label(275,15,'入度 1')+label(275,213,'入度 1')+label(440,158,'入度 2')+label(475,35,'队列 [0]');
 }else if(kind==='edit-grid'){
  title='一个编辑状态，来自三个更短的前缀';caption='字符相同时直接沿用左上状态；不同时，在替换、删除、插入三种来源中选代价最小的一种，再加一次操作。';
  drawing=box(118,25,125,55,'dp[i-1][j-1]')+box(319,25,125,55,'dp[i-1][j]')+box(118,145,125,55,'dp[i][j-1]')+box(319,145,125,55,'dp[i][j]','active')+path('M 246 82 L 315 143','accent-arrow')+path('M 382 83 L 382 142','accent-arrow')+path('M 247 173 L 316 173','accent-arrow')+label(272,101,'替换')+label(415,118,'删除')+label(282,195,'插入');
 }else if(kind==='lru-order'){
  title='每次访问，把对应节点移到“最近使用”端';caption='哈希表负责 O(1) 找到节点，双向链表负责 O(1) 摘除与移动。容量不足时，淘汰另一端最久未使用的节点。';
  drawing=label(58,61,'访问前')+label(58,151,'get(2) 后')+[1,2,3,4].map((v,i)=>box(140+i*84,32,60,44,v,v===2?'active':'')).join('')+[1,3,4,2].map((v,i)=>box(140+i*84,124,60,44,v,v===2?'active':'')).join('')+label(174,207,'最久未用')+label(422,207,'最近使用')+path('M 243 83 Q 365 105 422 120','accent-arrow');
 }
 if(!drawing)return '';
 return `<figure class="teaching-visual"><figcaption><span>图解</span><strong>${esc(title)}</strong></figcaption><div class="teaching-svg-scroll"><svg class="teaching-svg" viewBox="0 0 560 240" role="img" aria-label="${esc(title)}"><defs><marker id="teaching-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#6c84dc"/></marker></defs>${drawing}</svg></div><p>${esc(caption)}</p></figure>`;
}

export function renderTeaching(lesson,strategy,reasoning){
 const step=(s,i)=>`<article class="teaching-step"><span class="teaching-number">${String(i+1).padStart(2,'0')}</span><div><h3>${esc(s.title)}</h3><p>${esc(s.body)}</p></div></article>`;
 const branchHtml=strategy.branches?.length?`<div class="teaching-branches">${strategy.branches.map(b=>`<article><code>${esc(b.condition)}</code><h3>${esc(b.title)}</h3><p>${esc(b.body)}</p></article>`).join('')}</div>`:'';
 return `<div class="teaching-body teaching-${strategy.layout}" data-layout="${strategy.layout}"><p class="teaching-lead">${esc(strategy.lead)}</p>${strategy.visual?illustration(strategy.visual):''}${strategy.formula?`<div class="teaching-formula"><span>关系与状态</span><pre>${esc(strategy.formula)}</pre></div>`:''}${branchHtml}<div class="teaching-steps">${strategy.steps.map(step).join('')}</div>${strategy.note?`<p class="teaching-note">↳ ${esc(strategy.note)}</p>`:''}${reasoning?`<div class="principle-explanation"><h3>为什么成立</h3><p>${esc(reasoning.principle)}</p>${reasoning.invariant?`<div class="invariant-line"><span>关键条件</span><p>${esc(reasoning.invariant)}</p></div>`:''}</div><details class="boundary-explanation" open><summary>边界与易错点 <span>${reasoning.boundaries.length}</span></summary><dl>${reasoning.boundaries.map(b=>`<div><dt>${esc(b.title)}</dt><dd>${esc(b.body)}</dd></div>`).join('')}</dl></details>`:''}</div>`;
}
