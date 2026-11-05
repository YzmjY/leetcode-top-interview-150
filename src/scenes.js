import {layoutLinked} from './linked-layout.js';
import {layoutTree} from './tree-layout.js';
import {edgeGeometry} from './scene-motion.js';
import {createNodeLabels} from './annotations.js';
import {getPointerMeaning} from './pointer-meanings.js';
import {nodeMetrics} from './node-metrics.js';

export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export function display(value) {
  if(value === Infinity) return '∞'; if(value === -Infinity) return '−∞';
  if(value === undefined) return '—'; if(value === null) return 'null';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}
const esc=escapeHtml;
const has=(items,value)=>(items||[]).some(x=>String(x)===String(value));
const coord=(items,r,c)=>(items||[]).some(x=>Array.isArray(x)&&x[0]===r&&x[1]===c);
const empty=(label='空结构')=>`<div class="scene-empty"><span>∅</span>${esc(label)}</div>`;

function arrayRow(values,label,options={}) {
  const pointers=Object.entries(options.pointers||{});
  const pointerType=(name)=>/^(hi|high|r|right|k|write)$/.test(name)?'k':/^(mid|m|j|pivot|read)$/.test(name)?'j':'i';
  const boundary=(side)=>{const names=pointers.filter(([,idx])=>side==='before'?idx<0:idx>=values.length);return names.length?`<div class="boundary-marker" aria-label="${side==='before'?'左':'右'}侧边界">${names.map(([name,idx])=>`<span class="boundary-tag ${pointerType(name)}-tag">${esc(name)} = ${idx}</span>`).join('')}<small>${side==='before'?'已越过左端':'数组右侧边界'}</small></div>`:'';};
  const cells=values.map((value,i)=>{
    const at=pointers.filter(([,idx])=>idx===i);
    const tags=at.map(([name])=>{
      const type=pointerType(name);
      return {name,type};
    });
    const done=has(options.done,i),active=has(options.active,i),reserved=has(options.reserved,i);
    const ranged=options.range&&i>=options.range[0]&&i<=options.range[1];
    const valueText=display(value),wide=valueText.length>4;
    const classes=[...tags.map(t=>`${t.type}-pointer`),done&&'settled',active&&'scene-active',reserved&&'reserved',ranged&&'in-range',options.range&&!ranged&&'outside-range',has(options.consumed,i)&&'consumed',wide&&'wide-cell'].filter(Boolean).join(' ');
    const height=options.bars?Math.max(5,Math.min(110,Math.abs(Number(value)||0)/Math.max(1,...values.map(x=>Math.abs(Number(x)||0)))*100)):0;
    return `<div class="array-cell ${classes}" ${wide?`style="--digits:${Math.min(22,valueText.length)}"`:''} aria-label="下标 ${i}，值 ${esc(valueText===' '?'空格':valueText)}"><span class="cell-index">${String(i).padStart(2,'0')}${options.indexLabels?.[i]!==undefined?' · '+esc(options.indexLabels[i]):''}</span>${options.bars?`<span class="value-bar" style="height:${height}px"></span>`:''}<span class="cell-value">${reserved?'<span class="placeholder-zero">0</span>':valueText===' '?'<span class="space-glyph" title="空格">␠</span>':esc(valueText)}</span><div class="pointer-tags">${tags.map(t=>`<span class="pointer-tag ${t.type}-tag">${esc(t.name)}</span>`).join('')}</div></div>`;
  }).join('');
  return `<div class="array-row${options.bars?' bars-row':''}"><div class="row-label"><strong>${esc(label||'序列')}</strong></div><div class="array-scroll" tabindex="0" aria-label="${esc(label||'序列')}，可横向滚动">${boundary('before')}${cells||empty('空数组')}${boundary('after')}</div></div>${options.indexNote?`<p class="scene-reading-note">${esc(options.indexNote)}</p>`:''}${options.range?`<div class="range-caption">${esc(options.rangeLabel||'当前标记下标')} <code>${options.range[0]}…${options.range[1]}</code><span>${esc(options.rangeNote||'高亮表示当前观察的范围。')}</span></div>`:''}`;
}

function arrays(scene) {
  return arrayRow(scene.values||[],scene.label,scene)+(scene.secondary?arrayRow(scene.secondary,scene.secondaryLabel||'辅助', {pointers:scene.secondaryPointers,active:scene.secondaryActive,done:scene.secondaryDone,consumed:scene.secondaryConsumed}):'');
}
function texts(scene) {
  return arrayRow(Array.from(scene.text||''),scene.label||'字符',{...scene})+(scene.secondary!==undefined?arrayRow(Array.from(String(scene.secondary)),scene.secondaryLabel||'对照',{active:scene.secondaryActive,pointers:scene.secondaryPointers,done:scene.secondaryDone,range:scene.secondaryRange}):'');
}
function grids(scene) {
  const grid=scene.matrix||[];if(!grid.length||!grid[0]?.length)return empty('空矩阵');
  const width=grid[0].length;
  const cols=scene.colLabels||Array.from({length:width},(_,i)=>String(i));
  const axisTags=(bindings,index)=>Object.entries(bindings||{}).filter(([,v])=>v===index).map(([name])=>`<small class="axis-pointer">${esc(name)}</small>`).join('');
  const axis=(value,index,custom)=>custom?`<span>${index} · ${esc(value===' '?'␠':value)}</span>`:String(index);
  return `<div class="matrix-scroll" tabindex="0" aria-label="矩阵，可滚动查看"><div class="matrix-grid" style="--columns:${width+1}"><div class="grid-corner">行 / 列</div>${cols.map((v,c)=>`<div class="grid-label">${axis(v,c,scene.colLabels)}${axisTags(scene.colPointers,c)}</div>`).join('')}${grid.map((row,r)=>`<div class="grid-label">${axis(scene.rowLabels?.[r],r,scene.rowLabels)}${axisTags(scene.rowPointers,r)}</div>${row.map((value,c)=>{const bindings=Object.entries(scene.cellPointers||{}).filter(([,pos])=>pos[0]===r&&pos[1]===c);return `<div data-cell="${r},${c}" class="matrix-cell${coord(scene.active,r,c)?' active':''}${coord(scene.done,r,c)?' settled':''}${String(value)==='1'?' live-cell':''}${bindings.length?' has-pointer':''}${scene.rangeCells?.length&&!coord(scene.rangeCells,r,c)?' outside-range':''}" aria-label="第 ${r} 行，第 ${c} 列，值 ${esc(display(value))}"><span>${esc(display(value))}</span>${scene.cellLabels?.[r]?.[c]!==undefined?`<small class="matrix-cell-label">${esc(scene.cellLabels[r][c])}</small>`:''}${bindings.length?`<small class="grid-pointer">${bindings.map(([name])=>`<span>${esc(name)}</span>`).join('')}</small>`:''}</div>`;}).join('')}`).join('')}</div></div>`;
}

function tables(scene) {
  if(!scene.rows?.length)return empty('暂无表格数据');
  const rowMarkers=Object.entries(scene.rowPointers||{}),hasMarkers=rowMarkers.length>0;
  return `<div class="table-scroll" tabindex="0" aria-label="状态表，可滚动查看"><table class="state-table">${scene.columns?.length?`<thead><tr>${hasMarkers?'<th>指针</th>':''}${scene.columns.map(v=>`<th>${esc(v)}</th>`).join('')}</tr></thead>`:''}<tbody>${scene.rows.map((row,r)=>`<tr>${hasMarkers?`<td class="table-index-pointer">${rowMarkers.filter(([,i])=>i===r).map(([name])=>`<span>${esc(name)} →</span>`).join('')}</td>`:''}${(Array.isArray(row)?row:[row]).map((v,c)=>`<td class="${coord(scene.active,r,c)?'active':''}"><span>${esc(display(v))}</span>${Object.entries(scene.cellPointers||{}).filter(([,p])=>p[0]===r&&p[1]===c).map(([name])=>`<small class="table-cell-pointer">${esc(name)}</small>`).join('')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function nodePositions(scene) {
  const nodes=scene.nodes||[],positions=new Map();
  if(scene.kind==='linked') {
    return layoutLinked(scene);
  }
  if(scene.kind==='tree')return layoutTree(scene);
  if(scene.kind==='tree'||scene.kind==='trie') {
    const children=new Map(nodes.map(n=>[String(n.id),[]])),incoming=new Set();
    for(const e of scene.edges||[]){if(e.structural===false||/^(next|random)$/i.test(e.label||''))continue;children.get(String(e.from))?.push(String(e.to));incoming.add(String(e.to));}
    let leaves=0,maxDepth=0;const visiting=new Set();
    function place(id,depth) {
      if(visiting.has(id)||positions.has(id)||!children.has(id))return;
      visiting.add(id);maxDepth=Math.max(maxDepth,depth);
      for(const child of children.get(id))place(child,depth+1);
      const xs=children.get(id).map(child=>positions.get(child)?.x).filter(x=>x!==undefined);
      const x=xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:50+leaves++*82;
      positions.set(id,{x,y:45+depth*86});visiting.delete(id);
    }
    const roots=nodes.filter(n=>!incoming.has(String(n.id)));
    for(const node of roots.length?roots:nodes.slice(0,1))place(String(node.id),0);
    for(const node of nodes)if(!positions.has(String(node.id)))place(String(node.id),0);
    const width=Math.max(350,leaves*82+25),offset=(width-(leaves*82+25))/2;
    for(const pos of positions.values())pos.x+=offset;
    return {positions,width,height:Math.max(180,(maxDepth+1)*86+20)};
  }
  const grouped=nodes.some(n=>n.group),groups=grouped?[...new Set(nodes.map(n=>n.group||'节点'))]:[''];
  let width=350,height=0;
  for(const group of groups){
    const items=grouped?nodes.filter(n=>(n.group||'节点')===group):nodes;
    const maxWidth=Math.max(46,...items.map(n=>nodeMetrics(n).width));
    const radius=Math.max(55,Math.min(175,55+items.length*12),items.length*(maxWidth+25)/(2*Math.PI)),size=radius*2+maxWidth+55;
    width=Math.max(width,size);
    items.forEach((node,i)=>{const angle=-Math.PI/2+2*Math.PI*i/Math.max(1,items.length);positions.set(String(node.id),{x:size/2+radius*Math.cos(angle),y:height+size/2+radius*Math.sin(angle)+20});});
    height+=Math.max(240,size+35);
  }
  return {positions,width,height};
}

function pointerList(scene,presentation,labels){
 const entries=Object.entries(scene.pointers||{});if(!entries.length)return '';
 return `<section class="pointer-inspector" aria-label="变量与代码对照"><div class="annotation-title">变量与代码对照</div><div class="pointer-list">${entries.map(([name,id])=>{
  const node=id===null?null:scene.nodes?.find(n=>String(n.id)===String(id));
  const target=id===null?'空指针 <code>nil</code>':node?`${node.sentinel?'辅助':'节点'} ${esc(labels.get(String(id))||'?')} <small>${node.sentinel?'哨兵':'值 '+esc(node.label)}</small>`:'此帧未显示';
  return `<div class="pointer-entry"><code class="linked-pointer" data-pointer="${esc(name)}">${esc(name)}</code><span class="pointer-meaning">${esc(scene.pointerLabels?.[name]||getPointerMeaning(presentation.lessonId,name))}</span><span class="pointer-target">→ ${target}</span></div>`;
 }).join('')}</div></section>`;
}

function nodeScene(scene,presentation={}){
 const labels=presentation.nodeLabels||createNodeLabels([{scene}]);
 const identity=scene.kind==='linked'||scene.pointers||scene.nodes?.some(n=>n.group);
 return `<div class="${scene.kind==='linked'?'linked-scene':'structure-scene'}">${identity?'<p class="scene-reading-note">框内为节点值；A、B… 是固定节点标识，随节点一起移动。S 为辅助哨兵，不计入答案。</p>':''}${nodes(scene,{...presentation,nodeLabels:labels,showIdentity:identity})}${pointerList(scene,presentation,labels)}</div>`;
}

function nodes(scene,presentation={}) {
  if(!scene.nodes?.length)return empty('暂无节点');
  const {positions,width,height,chains=[]}=nodePositions(scene);
  const edges=(scene.edges||[]).map(edge=>{
    const a=positions.get(String(edge.from)),b=positions.get(String(edge.to));if(!a||!b)return '';
    const directed=scene.kind==='linked'||Boolean(edge.directed);
    const fromSize=nodeMetrics(scene.nodes.find(n=>String(n.id)===String(edge.from))),toSize=nodeMetrics(scene.nodes.find(n=>String(n.id)===String(edge.to)));
    const reciprocal=scene.kind==='graph'&&(scene.edges||[]).some(e=>String(e.from)===String(edge.to)&&String(e.to)===String(edge.from));
    const {path,backward,labelX,labelY}=edgeGeometry(a,b,{kind:scene.kind,directed,label:edge.label,self:String(edge.from)===String(edge.to),fromSize,toSize,reciprocal});
    const removed=has(scene.removed,edge.from)||has(scene.removed,edge.to);
    return `<g data-edge-from="${esc(edge.from)}" data-edge-to="${esc(edge.to)}" data-directed="${directed}" data-reciprocal="${reciprocal}" data-label="${esc(edge.label||'')}"><path class="scene-edge${backward?' back-edge':''}${removed?' removed-edge':''}${/^(prev|random)$/i.test(edge.label||'')||scene.kind!=='linked'&&/^next$/i.test(edge.label||'')?' auxiliary-edge':''}" d="${path}"${directed?' marker-end="url(#scene-arrow)"':''}/><text class="edge-label" x="${labelX}" y="${labelY}" text-anchor="middle">${esc(scene.kind==='linked'&&edge.label==='next'?'':edge.label||'')}</text></g>`;
  }).join('');
  const circles=scene.nodes.map(node=>{
    const p=positions.get(String(node.id)),active=has(scene.active,node.id),done=has(scene.done,node.id),label=String(node.label??node.id),size=nodeMetrics(node);
    const removed=has(scene.removed,node.id)||node.removed;
    const shape=(cls,dy)=>size.lines.length>1?`<rect class="${cls}" x="${p.x-size.width/2}" y="${p.y-size.height/2+dy}" width="${size.width}" height="${size.height}" rx="5"/>`:`<ellipse class="${cls}" cx="${p.x}" cy="${p.y+dy}" rx="${size.width/2}" ry="${size.height/2}"/>`;
    const classes=`${active?' active':''}${done?' done':''}`;
    return `<g data-node="${esc(node.id)}" data-x="${p.x}" data-y="${p.y}" data-width="${size.width}" data-height="${size.height}" data-shape="${size.caption||size.lines.length>1?'rect':'ellipse'}" class="scene-node${removed?' removed-node':''}${node.sentinel?' sentinel-node':''}${size.caption?' caption-node':''}">${size.caption?'':shape('node-shadow'+classes,3)+shape('node-circle'+classes,0)}<text class="node-label${active?' active':''}${size.caption?' node-caption':''}" x="${p.x}" y="${p.y+5-(size.lines.length-1)*9}" text-anchor="middle">${size.lines.map((line,i)=>`<tspan x="${p.x}" dy="${i?18:0}">${esc(line)}</tspan>`).join('')}</text>${presentation.showIdentity&&!size.caption?`<text class="node-identity" x="${p.x}" y="${p.y+size.height/2+18}" text-anchor="middle">${node.sentinel?'辅助':'节点'} ${esc(presentation.nodeLabels.get(String(node.id))||'?')}</text>`:''}<title>${esc(label)}</title></g>`;
  }).join('');
  const labels=chains.map(chain=>`<text class="linked-chain-label" x="28" y="${chain.y-62}">${esc(chain.label)}</text><line class="linked-chain-rule" x1="28" x2="${width-28}" y1="${chain.y-51}" y2="${chain.y-51}"/>`).join('');
  const groupLabels=[...new Set(scene.nodes.map(n=>n.group).filter(Boolean))].map(group=>{const ps=scene.nodes.filter(n=>n.group===group).map(n=>positions.get(String(n.id)));return `<text class="node-group-label" x="${(Math.min(...ps.map(p=>p.x))+Math.max(...ps.map(p=>p.x)))/2}" y="${Math.min(...ps.map(p=>p.y))-35}" text-anchor="middle">${esc(group)}</text>`;}).join('');
  return `<div class="node-scroll" tabindex="0" aria-label="节点结构，可滚动查看"><svg class="node-scene" role="img" aria-label="${esc(({tree:'树结构',trie:'字典树',linked:'链表',graph:'图结构'})[scene.kind])}，蓝色为当前节点" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><marker id="scene-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#758cb1"/></marker></defs>${labels}${groupLabels}${edges}${circles}</svg></div>`;
}

function intervals(scene) {
  const items=scene.intervals||[];if(!items.length)return empty('没有区间');
  const values=items.flat().concat(scene.points||[]),min=Math.min(...values),max=Math.max(...values),span=max-min||1;
  const x=(v)=>50+(v-min)/span*440;
  const ticks=Array.from({length:6},(_,i)=>{const value=min+span*i/5;return `<line x1="${x(value)}" x2="${x(value)}" y1="25" y2="${items.length*43+38}" class="interval-guide"/><text x="${x(value)}" y="18" class="interval-number" text-anchor="middle">${Number(value.toFixed(1))}</text>`;}).join('');
  return `<p class="scene-reading-note">左侧为区间下标（从 0 开始），上方为数值刻度。</p><div class="interval-scroll"><svg role="img" aria-label="区间数轴" width="540" height="${items.length*43+55}">${ticks}${items.map(([a,b],i)=>`<g><text x="18" y="${50+i*43}" class="interval-index-pointer">${i}</text><rect class="interval-bar${has(scene.active,i)?' active':''}${has(scene.done,i)?' done':''}" x="${x(a)}" y="${37+i*43}" width="${Math.max(3,x(b)-x(a))}" height="16" rx="3"/><circle class="interval-end" cx="${x(a)}" cy="${45+i*43}" r="3"/><circle class="interval-end" cx="${x(b)}" cy="${45+i*43}" r="3"/><text class="interval-number" x="${(x(a)+x(b))/2}" y="${72+i*43}" text-anchor="middle">[${esc(a)}, ${esc(b)}]</text></g>`).join('')}${(scene.points||[]).map(v=>`<line x1="${x(v)}" x2="${x(v)}" y1="26" y2="${items.length*43+33}" class="interval-point"/>`).join('')}</svg></div><div class="interval-pointer-map">${Object.entries(scene.rowPointers||{}).map(([name,row])=>`<span><code>${esc(name)}</code> → 区间[${esc(row)}] ${esc(display(items[row]??'边界'))}</span>`).join('')}</div>`;
}
function stacks(scene) {
  return `<div class="stack-wrap"><div class="stack-column">${(scene.values||[]).slice().reverse().map((v,i)=>`<div class="stack-cell${has(scene.active,scene.values.length-1-i)?' active':''}">${esc(display(v))}${i===0?'<span>栈顶 TOP</span>':''}</div>`).join('')||empty('空栈')}<div class="stack-bottom">栈底</div></div></div>${scene.secondary?arrayRow(scene.secondary,scene.secondaryLabel||'输入',{pointers:scene.secondaryPointers,active:scene.secondaryActive}):''}`;
}
function bits(scene) {
  const values=(scene.values||[]).map(String),width=Math.max(scene.bitWidth||0,...values.map(v=>v.length),1);
  return `<p class="scene-reading-note">左侧为高位，右侧为最低位；不足位宽时高位补 0 对齐。</p><div class="bits-scroll"><div class="bits-row bit-axis"><strong>位权</strong><div>${Array.from({length:width},(_,i)=>`<span>2^${width-1-i}</span>`).join('')}</div></div>${values.map((value,row)=>`<div class="bits-row"><strong>${esc(scene.labels?.[row]??`bits ${row}`)}</strong><div>${value.padStart(width,'0').split('').map((v,i)=>`<span class="bit-cell${has(scene.activeByRow?.[row]??scene.active,i)?' active':''}${v==='1'?' one':''}${i<width-value.length?' padded-bit':''}">${esc(v)}</span>`).join('')}</div></div>`).join('')}</div>`;
}
function state(scene) {
  return `<div class="state-cards">${(scene.items||[]).map(([key,value])=>`<div class="state-card"><span>${esc(key)}</span><strong>${esc(display(value))}</strong></div>`).join('')||empty('初始化')}</div>`;
}

export function renderScene(scene,presentation={}) {
  if(!scene)return empty();
  switch(scene.kind){
    case 'array':return '<p class="scene-reading-note">框内为数值，上方为下标（从 0 开始）。</p>'+arrays(scene);
    case 'text':return '<p class="scene-reading-note">上方为字符下标（从 0 开始）；␠ 代表一个空格。</p>'+texts(scene);
    case 'matrix':return '<p class="scene-reading-note">行、列下标均从 0 开始；字符轴同时显示下标与字符，␠ 表示空格。</p>'+grids(scene);
    case 'table':return tables(scene);
    case 'tree':return scene.sourceMatrix?`<div class="construction-scene"><div class="construction-label">输入网格 · 当前递归区域</div>${grids({kind:'matrix',matrix:scene.sourceMatrix,active:scene.sourceActive||[]})}<div class="construction-label">已构建的四叉树 <span>TL 左上 · TR 右上 · BL 左下 · BR 右下</span></div>${nodeScene(scene,presentation)}</div>`:nodeScene(scene,presentation);
    case 'graph':case 'linked':case 'trie':return nodeScene(scene,presentation);
    case 'intervals':return intervals(scene);
    case 'stack':return stacks(scene);
    case 'bits':return bits(scene);
    default:return state(scene);
  }
}
