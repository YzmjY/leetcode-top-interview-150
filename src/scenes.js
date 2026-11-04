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
    return `<div class="array-cell ${classes}" ${wide?`style="--digits:${Math.min(22,valueText.length)}"`:''} aria-label="下标 ${i}，值 ${esc(valueText)}"><span class="cell-index">${String(i).padStart(2,'0')}</span>${options.bars?`<span class="value-bar" style="height:${height}px"></span>`:''}<span class="cell-value">${reserved?'<span class="placeholder-zero">0</span>':esc(valueText)}</span><div class="pointer-tags">${tags.map(t=>`<span class="pointer-tag ${t.type}-tag">${esc(t.name)}</span>`).join('')}</div></div>`;
  }).join('');
  return `<div class="array-row${options.bars?' bars-row':''}"><div class="row-label"><strong>${esc(label||'序列')}</strong></div><div class="array-scroll" tabindex="0" aria-label="${esc(label||'序列')}，可横向滚动">${boundary('before')}${cells||empty('空数组')}${boundary('after')}</div></div>${options.range?`<div class="range-caption">候选下标 <code>${options.range[0]}…${options.range[1]}</code><span>淡色区域已排除</span></div>`:''}`;
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
  return `<div class="matrix-scroll" tabindex="0" aria-label="矩阵，可滚动查看"><div class="matrix-grid" style="--columns:${width+1}"><div class="grid-corner">r / c</div>${cols.map((v,c)=>`<div class="grid-label">${esc(v)}${axisTags(scene.colPointers,c)}</div>`).join('')}${grid.map((row,r)=>`<div class="grid-label">${esc(scene.rowLabels?.[r]??r)}${axisTags(scene.rowPointers,r)}</div>${row.map((value,c)=>{const bindings=Object.entries(scene.cellPointers||{}).filter(([,pos])=>pos[0]===r&&pos[1]===c);return `<div data-cell="${r},${c}" class="matrix-cell${coord(scene.active,r,c)?' active':''}${coord(scene.done,r,c)?' settled':''}${String(value)==='1'?' live-cell':''}${bindings.length?' has-pointer':''}${scene.rangeCells?.length&&!coord(scene.rangeCells,r,c)?' outside-range':''}" aria-label="第 ${r} 行，第 ${c} 列，值 ${esc(display(value))}"><span>${esc(display(value))}</span>${bindings.length?`<small class="grid-pointer">${bindings.map(([name])=>esc(name)).join(' · ')}</small>`:''}</div>`;}).join('')}`).join('')}</div></div>`;
}

function tables(scene) {
  if(!scene.rows?.length)return empty('暂无表格数据');
  const rowMarkers=Object.entries(scene.rowPointers||{}),hasMarkers=rowMarkers.length>0;
  return `<div class="table-scroll" tabindex="0" aria-label="状态表，可滚动查看"><table class="state-table">${scene.columns?.length?`<thead><tr>${hasMarkers?'<th>指针</th>':''}${scene.columns.map(v=>`<th>${esc(v)}</th>`).join('')}</tr></thead>`:''}<tbody>${scene.rows.map((row,r)=>`<tr>${hasMarkers?`<td class="table-index-pointer">${rowMarkers.filter(([,i])=>i===r).map(([name])=>esc(name)+' →').join(' ')}</td>`:''}${(Array.isArray(row)?row:[row]).map((v,c)=>`<td class="${coord(scene.active,r,c)?'active':''}">${esc(display(v))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function nodePositions(scene) {
  const nodes=scene.nodes||[],positions=new Map();
  if(scene.kind==='linked') {
    nodes.forEach((n,i)=>positions.set(String(n.id),{x:53+i*90,y:95}));
    return {positions,width:Math.max(350,nodes.length*90+20),height:185};
  }
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
  const radius=Math.min(175,55+nodes.length*12),size=radius*2+90;
  nodes.forEach((node,i)=>{const angle=-Math.PI/2+2*Math.PI*i/Math.max(1,nodes.length);positions.set(String(node.id),{x:size/2+radius*Math.cos(angle),y:size/2+radius*Math.sin(angle)});});
  return {positions,width:Math.max(350,size),height:Math.max(240,size)};
}

function nodes(scene) {
  if(!scene.nodes?.length)return empty('暂无节点');
  const {positions,width,height}=nodePositions(scene);
  const edges=(scene.edges||[]).map(edge=>{
    const a=positions.get(String(edge.from)),b=positions.get(String(edge.to));if(!a||!b)return '';
    const directed=scene.kind==='linked'||edge.directed;
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;
    const x1=a.x+dx/d*23,y1=a.y+dy/d*23,x2=b.x-dx/d*(directed?28:23),y2=b.y-dy/d*(directed?28:23);
    const backward=scene.kind==='linked'&&b.x<=a.x;
    const loop=String(edge.from)===String(edge.to);
    const path=loop?`M ${a.x-15} ${a.y-18} C ${a.x-45} ${a.y-80},${a.x+45} ${a.y-80},${a.x+15} ${a.y-18}`:backward?`M ${x1} ${y1-12} Q ${(a.x+b.x)/2} 0 ${x2} ${y2-12}`:`M ${x1} ${y1} L ${x2} ${y2}`;
    return `<path class="scene-edge${backward?' back-edge':''}${/^(next|random)$/i.test(edge.label||'')?' auxiliary-edge':''}" d="${path}"${directed?' marker-end="url(#scene-arrow)"':''}/><text class="edge-label" x="${(a.x+b.x)/2}" y="${backward?30:(a.y+b.y)/2-7}" text-anchor="middle">${esc(edge.label||'')}</text>`;
  }).join('');
  const circles=scene.nodes.map(node=>{
    const p=positions.get(String(node.id)),active=has(scene.active,node.id),done=has(scene.done,node.id),label=String(node.label??node.id);
    return `<g data-node="${esc(node.id)}"><circle class="node-shadow${active?' active':''}${done?' done':''}" cx="${p.x}" cy="${p.y+3}" r="23"/><circle class="node-circle${active?' active':''}${done?' done':''}" cx="${p.x}" cy="${p.y}" r="23"/><text class="node-label${active?' active':''}" x="${p.x}" y="${p.y+5}" text-anchor="middle"${label.length>5?' style="font-size:10px"':''}>${esc(label.length>12?label.slice(0,10)+'…':label)}</text><title>${esc(label)}</title></g>`;
  }).join('');
  return `<div class="node-scroll"><svg class="node-scene" role="img" aria-label="${esc(({tree:'树结构',trie:'字典树',linked:'链表',graph:'图结构'})[scene.kind])}，蓝色为当前节点" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><marker id="scene-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#758cb1"/></marker></defs>${edges}${circles}</svg></div>`;
}

function intervals(scene) {
  const items=scene.intervals||[];if(!items.length)return empty('没有区间');
  const values=items.flat().concat(scene.points||[]),min=Math.min(...values),max=Math.max(...values),span=max-min||1;
  const x=(v)=>50+(v-min)/span*440;
  const ticks=Array.from({length:6},(_,i)=>{const value=min+span*i/5;return `<line x1="${x(value)}" x2="${x(value)}" y1="25" y2="${items.length*43+38}" class="interval-guide"/><text x="${x(value)}" y="18" class="interval-number" text-anchor="middle">${Number(value.toFixed(1))}</text>`;}).join('');
  return `<div class="interval-scroll"><svg role="img" aria-label="区间数轴" width="540" height="${items.length*43+55}">${ticks}${items.map(([a,b],i)=>`<g><text x="8" y="${50+i*43}" class="interval-index-pointer">${Object.entries(scene.rowPointers||{}).filter(([,r])=>r===i).map(([name])=>esc(name)+' →').join(' ')}</text><rect class="interval-bar${has(scene.active,i)?' active':''}${has(scene.done,i)?' done':''}" x="${x(a)}" y="${37+i*43}" width="${Math.max(3,x(b)-x(a))}" height="16" rx="3"/><circle class="interval-end" cx="${x(a)}" cy="${45+i*43}" r="3"/><circle class="interval-end" cx="${x(b)}" cy="${45+i*43}" r="3"/><text class="interval-number" x="${(x(a)+x(b))/2}" y="${72+i*43}" text-anchor="middle">[${esc(a)}, ${esc(b)}]</text></g>`).join('')}${(scene.points||[]).map(v=>`<line x1="${x(v)}" x2="${x(v)}" y1="26" y2="${items.length*43+33}" class="interval-point"/>`).join('')}</svg></div>`;
}
function stacks(scene) {
  return `<div class="stack-wrap"><div class="stack-column">${(scene.values||[]).slice().reverse().map((v,i)=>`<div class="stack-cell${has(scene.active,scene.values.length-1-i)?' active':''}">${esc(display(v))}${i===0?'<span>TOP ←</span>':''}</div>`).join('')||empty('空栈')}<div class="stack-bottom">STACK · 底部</div></div></div>${scene.secondary?arrayRow(scene.secondary,scene.secondaryLabel||'输入',{pointers:scene.secondaryPointers,active:scene.secondaryActive}):''}`;
}
function bits(scene) {
  return `<div class="bits-scroll">${(scene.values||[]).map((value,row)=>`<div class="bits-row"><strong>${esc(scene.labels?.[row]??`bits ${row}`)}</strong><div>${String(value).split('').map((v,i)=>`<span class="bit-cell${has(scene.active,i)?' active':''}${v==='1'?' one':''}">${esc(v)}</span>`).join('')}</div></div>`).join('')}</div>`;
}
function state(scene) {
  return `<div class="state-cards">${(scene.items||[]).map(([key,value])=>`<div class="state-card"><span>${esc(key)}</span><strong>${esc(display(value))}</strong></div>`).join('')||empty('初始化')}</div>`;
}

export function renderScene(scene) {
  if(!scene)return empty();
  switch(scene.kind){
    case 'array':return arrays(scene);
    case 'text':return texts(scene);
    case 'matrix':return grids(scene);
    case 'table':return tables(scene);
    case 'tree':case 'graph':case 'linked':case 'trie':return nodes(scene);
    case 'intervals':return intervals(scene);
    case 'stack':return stacks(scene);
    case 'bits':return bits(scene);
    default:return state(scene);
  }
}
