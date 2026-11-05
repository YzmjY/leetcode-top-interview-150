// Quiet, structural illustrations for the lesson header. These are static
// examples; the interactive trace remains the source of execution state.
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const has=(ids,id)=>ids.includes(Number(id));
const text=(x,y,value,size=11,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" fill="currentColor" stroke="none">${esc(value)}</text>`;
const path=(d,extra='')=>`<path d="${d}" ${extra}/>`;
const line=(x1,y1,x2,y2,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;
const rect=(x,y,w,h,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" ${extra}/>`;
const readable=value=>String(value??'·').length>6?'…':String(value??'·');
const circle=(x,y,value,extra='')=>`<circle cx="${x}" cy="${y}" r="14" fill="white" ${extra}/>${text(x,y+4,readable(value),11)}`;
const cell=(x,y,value,extra='')=>rect(x-15,y-15,30,30,`${/\bfill=/.test(extra)?'':'fill="white"'} ${extra}`)+text(x,y+4,readable(value),11);
const arrow=(id,x1,y1,x2,y2,extra='')=>line(x1,y1,x2,y2,`marker-end="url(#${id})" ${extra}`);
const row=(values,y,{phase='',start,step=40}={})=>{
  const x=start??(400-(values.length-1)*step)/2;
  return values.map((value,i)=>cell(x+i*step,y,value,phase?`data-phase="${phase}"`:'' )).join('');
};
const valuesOf=lesson=>{
  const i=lesson.input??{};
  const values=i.nums??i.digits??i.prices??i.nums1??i.head;
  if(Array.isArray(values)&&values.length)return values.slice(0,7);
  const str=i.s??i.word??i.word1??i.beginWord;
  return typeof str==='string'&&str.length?[...str].slice(0,7):[1,2,3,4,5];
};

function kindOf(lesson){
  const id=Number(lesson.id),category=lesson.category??'',group=lesson.group??'';
  if(id===88)return 'merge';
  if(id===25)return 'reverse-groups';
  if(id===92)return 'reverse-range';
  if(id===155)return 'min-stack';
  if(has([228,56,57,452],id))return 'intervals';
  if(has([215,502,373,295],id))return 'heap';
  if(has([208,211],id))return 'trie';
  if(id===427)return 'quadtree';
  if(has([141,2,21,138,19,82,61,86,146,148,23],id))return 'linked';
  if(/二叉/.test(category)||id===108)return 'tree';
  if(has([200,130,909,79,212],id)||category==='矩阵')return 'matrix';
  if(/图/.test(category))return 'graph';
  if(category==='栈')return 'stack';
  if(/位运算/.test(category)||has([67,190,191,136,137,201,50],id))return 'bits';
  if(/动态规划/.test(category)||has([53,918],id))return 'dp';
  if(has([35,74,162,33,34,153,4,69],id))return 'binary-search';
  if(group==='sliding-window')return 'window';
  if(has([42,11],id))return 'bars';
  if(group==='two-pointers')return 'two-pointers';
  if(group==='hashmap')return 'hash';
  if(/回溯/.test(category))return 'backtrack';
  if(has([55,45],id))return 'greedy';
  if(id===238)return 'prefix';
  if(has([27,26,80],id))return 'compact';
  if(has([13,12,58,14,151,6,28,68],id))return 'text';
  if(category==='数学')return 'math';
  return 'scan';
}

function chain(values,y,phase,id){
  const step=values.length>6?42:48,x=(400-(values.length-1)*step)/2;
  return values.map((v,i)=>(i?arrow(id,x+(i-1)*step+16,y,x+i*step-19,y):'')+circle(x+i*step,y,v,`data-phase="${phase}" data-value="${esc(v)}"`)).join('');
}
function listArt(lesson,id,kind){
  if(Number(lesson.id)===146)return cacheArt(lesson,id);
  const input=lesson.input??{},source=Array.isArray(input.head)&&input.head.length?input.head:input.lists?.flat().slice(0,6)??[1,2,3,4,5];
  const values=source.slice(0,7),after=[...values],n=values.length,step=n>6?42:48,start=(400-(n-1)*step)/2;
  let groups='';
  if(kind==='reverse-groups'){
    const k=Math.max(1,Math.trunc(input.k??2));
    for(let i=0;i<n;i+=k){
      const complete=i+k<=n,end=Math.min(i+k,n),x=start+i*step-20,w=(end-i-1)*step+40;
      if(complete)after.splice(i,k,...values.slice(i,end).reverse());
      groups+=`<g data-role="${complete?'reverse-group':'tail'}">${rect(x,47,w,44,'stroke-dasharray="3 4"')}${rect(x,147,w,44,'stroke-dasharray="3 4"')}${complete?arrow(id,x+w/2,104,x+w/2,132):text(x+w/2,216,'尾段保留',10)}</g>`;
    }
    groups+=text(200,26,'每组翻转',11);
  }else if(kind==='reverse-range'){
    const left=Math.max(0,(input.left??2)-1),right=Math.min(n,input.right??4);
    after.splice(left,right-left,...values.slice(left,right).reverse());
    const x=start+left*step-20,w=Math.max(40,(right-left-1)*step+40);
    groups=rect(x,47,w,44,'stroke-dasharray="3 4"')+rect(x,147,w,44,'stroke-dasharray="3 4"')+arrow(id,x+w/2,104,x+w/2,132)+text(200,26,'区间翻转');
  }else{
    const top=chain(values,96,'before',id);
    const auxiliary=Number(lesson.id)===138?path(`M ${start} 72 Q 200 7 ${start+(n-1)*step} 72`,`stroke-dasharray="4 4" marker-end="url(#${id})"`):Number(lesson.id)===141?path(`M ${start+(n-1)*step} 115 Q 200 188 ${start+step} 115`,`marker-end="url(#${id})"`):'';
    return top+auxiliary+text(200,205,Number(lesson.id)===138?'对应关系':Number(lesson.id)===141?'链接成环':'沿指针连接');
  }
  return groups+chain(values,69,'before',id)+chain(after,169,'after',id);
}

function mergeArt(lesson,id){
  const i=lesson.input??{},a=(i.nums1??[1,3,5]).slice(0,i.m??3).slice(0,3),b=(i.nums2??[2,4,6]).slice(0,i.n??3).slice(0,3),merged=[...a,...b].sort((x,y)=>x-y);
  return row(a,65,{start:72,step:35})+row(b,65,{start:248,step:35})+arrow(id,120,99,178,143)+arrow(id,282,99,224,143)+row(merged,174,{step:37})+text(200,222,'按序归并');
}
function intervalArt(lesson,id){
  const i=lesson.input??{},source=i.intervals??i.points??i.nums?.map(n=>[n,n])??[[1,4],[3,7],[9,12]],items=[...source,...(i.newInterval?[i.newInterval]:[])].filter(Array.isArray).slice(0,4),all=items.flat(),min=Math.min(0,...all),max=Math.max(1,...all),x=v=>58+(v-min)/(max-min)*285;
  const merged=[];for(const [a,b]of [...items].sort((a,b)=>a[0]-b[0])){const last=merged.at(-1);if(last&&a<=last[1]+(Number(lesson.id)===228?1:0))last[1]=Math.max(last[1],b);else merged.push([a,b]);}
  const span=(a,b,y)=>`<g data-role="interval">${line(x(a),y,x(b),y,'stroke-width="5" opacity=".7"')}<circle cx="${x(a)}" cy="${y}" r="2" fill="white"/><circle cx="${x(b)}" cy="${y}" r="2" fill="white"/></g>`;
  const before=items.map(([a,b],j)=>span(a,b,43+j*27)).join('');
  if(Number(lesson.id)===452){let end=-Infinity;const arrows=[];for(const [a,b]of [...items].sort((a,b)=>a[1]-b[1]))if(a>end){end=b;arrows.push(arrow(id,x(b),184,x(b),23,'stroke-dasharray="3 4"'));}return before+arrows.join('')+text(200,229,'寻找公共交点');}
  return before+arrow(id,200,150,200,171)+merged.map(([a,b])=>span(a,b,193)).join('')+text(200,229,Number(lesson.id)===228?'连续值归为区间':'合并重叠');
}
function stackArt(lesson,id,minimum=false){
  const ops=lesson.input?.operations??[],pushes=ops.filter(op=>op[0]==='push').map(op=>op[1]),values=(pushes.length?pushes:[2,0,-3]).slice(0,4);
  const column=(x,items,role)=>`<g data-role="${role}">${path(`M ${x-24} 48 V 194 H ${x+24} V 48`)}${items.map((v,i)=>cell(x,174-i*34,v)).join('')}</g>`;
  if(minimum){
    let best=Infinity;const mins=values.map(v=>best=Math.min(best,v));
    const entries=values.map((_,i)=>{const y=174-i*34;return rect(128,y-15,144,30,'fill="white" data-role="stack-entry"')+line(200,y-15,200,y+15);}).join('');
    return `<g data-role="paired-stack">${path('M 121 76 V 197 H 279 V 76')}${entries}<g data-role="value-column">${values.map((v,i)=>text(163,178-i*34,v)).join('')}</g><g data-role="minimum-column">${mins.map((v,i)=>text(237,178-i*34,v)).join('')}</g></g>`+text(200,26,'每层保存值与最小值')+text(163,62,'值',10)+text(237,62,'本层最小',10)+text(200,226,`当前最小 ${mins.at(-1)}`);
  }
  return column(200,values,'value-stack')+arrow(id,260,40,260,94)+arrow(id,293,94,293,40)+text(200,226,'后进先出');
}
function cacheArt(lesson,id){
  const ops=lesson.input?.ops??[],capacity=Math.max(1,ops[0]?.[1]??2),entries=new Map(),order=[];let before=null,selected=null;
  for(const [op,key,value]of ops){
    if(op==='put'){
      entries.set(key,value);const old=order.indexOf(key);if(old>=0)order.splice(old,1);order.unshift(key);
      if(order.length>capacity)entries.delete(order.pop());
    }else if(op==='get'&&entries.has(key)&&order.length>1){before=[...order];selected=key;break;}
  }
  before??=order.length?order:[2,1];selected??=before.at(-1);
  const after=[selected,...before.filter(key=>key!==selected)],label=key=>`${key}:${entries.get(key)??key}`;
  const sequence=(keys,y)=>{const labels=['头',...keys.slice(0,3).map(label),'尾'],step=labels.length>4?72:88,start=200-(labels.length-1)*step/2;
    return `<g data-role="cache-order">${labels.map((v,j)=>(j?arrow(id,start+(j-1)*step+17,y-4,start+j*step-20,y-4)+arrow(id,start+j*step-17,y+4,start+(j-1)*step+20,y+4,'data-role="previous-link"'):'')+circle(start+j*step,y,v)).join('')}</g>`;
  };
  return text(200,27,'键与值按访问顺序排列')+sequence(before,70)+arrow(id,200,106,200,135)+sequence(after,173)+text(200,225,'访问后移到表头');
}
function treeArt(lesson,id,heap=false){
  const problem=Number(lesson.id),input=lesson.input??{};
  if(heap&&problem===295){
    const values=(input.operations??[]).filter(op=>op[0]==='addNum').map(op=>op[1]).sort((a,b)=>a-b),split=Math.ceil(values.length/2),low=values.slice(0,split).reverse(),high=values.slice(split);
    const half=(items,cx,role,label)=>`<g data-role="${role}">${text(cx,30,label)}${items.slice(1,3).map((_,j)=>line(cx,70,cx-29+j*58,130)).join('')}${items.slice(0,3).map((v,j)=>circle(j?cx-29+(j-1)*58:cx,j?130:70,v)).join('')}</g>`;
    return half(low,115,'low-heap','较小半区')+half(high,285,'high-heap','较大半区')+arrow(id,138,88,180,166)+arrow(id,262,88,220,166)+cell(200,185,values.length%2?low[0]:(low[0]+high[0])/2)+text(200,229,'两堆边界确定中位数');
  }
  let values=input.root??(heap?input.nums:null)??[4,2,6,1,3,5,7];
  if(!Array.isArray(values)||!values.length||values[0]===null)values=[4,2,6,1,3,5,7];
  if(heap){
    if(problem===215)values=[...values].sort((a,b)=>b-a).slice(0,input.k??3).sort((a,b)=>a-b);
    else if(problem===502)values=[...(input.profits??values)].sort((a,b)=>b-a);
    else if(problem===373)values=(input.nums1??[1,7,11]).slice(0,3).map(v=>v+(input.nums2?.[0]??2)).sort((a,b)=>a-b);
    else values=[...values].sort((a,b)=>a-b);
  }
  const nodes=[{value:values[0],x:200,y:45,depth:0}],edges=[];let next=1;
  for(let q=0;q<nodes.length&&nodes.length<7&&next<values.length;q++){
    const parent=nodes[q];if(parent.depth>=2)break;
    for(const side of [-1,1]){const value=values[next++];if(value===undefined||value===null)continue;const child={value,x:parent.x+side*84/2**parent.depth,y:parent.y+64,depth:parent.depth+1};edges.push(line(parent.x,parent.y,child.x,child.y,`data-role="${heap?'heap':'tree'}-edge"`));nodes.push(child);}
  }
  return edges.join('')+nodes.map((n,j)=>circle(n.x,n.y,n.value,heap&&j===0?`data-role="heap-root" data-value="${esc(n.value)}"`:'')).join('')+text(200,224,heap?problem===215?'最大候选中的小根堆':problem===502?'最大利润在堆顶':'数对和最小者优先':'父子关系');
}
function graphArt(lesson,id){
  const points=[[100,62],[300,62],[300,166],[100,166]],input=lesson.input??{};
  if(Number(lesson.id)===133){
    const graph=(cx,label)=>{const p=[[cx-32,76],[cx+32,76],[cx+32,146],[cx-32,146]];return text(cx,39,label)+[[0,1],[1,2],[2,3],[3,0]].map(([a,b])=>line(...p[a],...p[b],'data-role="graph-edge"')).join('')+p.map(([x,y],i)=>circle(x,y,i+1)).join('');};
    return graph(100,'原图')+arrow(id,169,110,228,110)+graph(300,'副本')+text(200,222,'保留邻接关系');
  }
  const directed=Array.isArray(input.prerequisites),edges=directed?input.prerequisites.map(([to,from])=>[from%4,to%4]):[[0,1],[1,2],[2,3],[3,0],[0,2]];
  return edges.filter(([a,b])=>a!==b).map(([a,b])=>line(...points[a],...points[b],`data-role="graph-edge"${directed?` marker-end="url(#${id})"`:''}`)).join('')+points.map(([x,y],i)=>circle(x,y,directed?i:i+1)).join('')+text(200,224,directed?'前置依赖':'沿边访问');
}
function trieArt(id){
  const p=[[200,38,'根'],[134,98,'a'],[266,98,'b'],[103,159,'n'],[164,159,'t'],[266,159,'e']];
  return [[0,1],[0,2],[1,3],[1,4],[2,5]].map(([a,b])=>line(...p[a].slice(0,2),...p[b].slice(0,2),'data-role="trie-edge"')).join('')+p.map(([x,y,v],i)=>circle(x,y,v)+(i>2?`<circle cx="${x+17}" cy="${y-13}" r="3" fill="currentColor" stroke="none"/>`:'')).join('')+text(200,222,'共享前缀 · 圆点为词尾');
}
function matrixArt(lesson,id,quad=false){
  const i=lesson.input??{},source=i.matrix??i.board??i.grid??i.obstacleGrid??[[1,2,3],[4,5,6],[7,8,9]],grid=Array.isArray(source)&&source.length?source.slice(0,4).map(row=>[...row].slice(0,4)):[[1,0],[0,1]],cols=Math.max(1,...grid.map(r=>r.length)),start=200-(cols-1)*18;
  if(quad)return rect(117,35,166,146,'fill="white"')+line(200,35,200,181)+line(117,108,283,108)+circle(158,71,'1')+circle(242,71,'1')+circle(158,145,'1')+circle(242,145,'0')+text(200,222,'同值压缩 · 四象限');
  const cells=grid.map((r,y)=>r.map((v,x)=>cell(start+x*36,48+y*36,v)).join('')).join('');
  return cells+path(`M ${start-22} 25 H ${start+(cols-1)*36+22} V ${48+(grid.length-1)*36+24} H ${start-22}`,`stroke-dasharray="4 4" marker-end="url(#${id})"`)+text(200,225,Number(lesson.id)===54?'按边界访问':'网格与相邻位置');
}
function dpArt(lesson,id){
  const grid=/多维/.test(lesson.category??'')||has([120,64,63,5,97,72,123,188,221],lesson.id);
  if(grid){const x=152,y=73;return Array.from({length:3},(_,r)=>Array.from({length:3},(_,c)=>cell(x+c*48,y+r*48,r===2&&c===2?'?':r+c, r===2&&c===2?'fill="#f1f5ff"':'')).join('')).join('')+arrow(id,248,134,248,151)+arrow(id,215,169,230,169)+arrow(id,215,134,232,151)+text(200,227,'由相邻状态推导');}
  return row([1,1,2,3,5],151,{step:49})+path('M 151 129 Q 200 55 247 129',`marker-end="url(#${id})"`)+path('M 200 129 Q 224 88 247 129',`marker-end="url(#${id})"`)+text(200,218,'较小子问题 → 当前状态');
}
function bitsArt(lesson,id){
  const input=lesson.input??{},problem=Number(lesson.id),n=Number(input.n??input.left??input.nums?.[0]??13)>>>0,bin=v=>(v>>>0).toString(2).slice(-8).padStart(8,'0');
  if(problem===67){const a=String(input.a??'1010'),b=String(input.b??'1011'),sum=(BigInt(`0b${a}`)+BigInt(`0b${b}`)).toString(2),width=Math.min(8,Math.max(a.length,b.length,sum.length));return row([...a.padStart(width,'0').slice(-8)],45,{step:35})+row([...b.padStart(width,'0').slice(-8)],98,{step:35})+arrow(id,200,123,200,144)+row([...sum.padStart(width,'0').slice(-8)],174,{step:35})+text(200,225,'逐位相加与进位');}
  if(problem===201){const left=Number(input.left??5),right=Number(input.right??7);let a=left,b=right,shift=0;while(a<b){a>>>=1;b>>>=1;shift++;}const out=(a*2**shift)>>>0;return row([...bin(left)],45,{step:35})+row([...bin(right)],97,{step:35})+arrow(id,200,122,200,143)+row([...bin(out)],174,{step:35})+text(200,225,'公共前缀保留 · 低位补零');}
  const a=bin(problem===50?Math.abs(input.n??3):n),out=problem===190?[...a].reverse().join(''):problem===191?bin(n&(n-1)):problem===50?bin(Math.floor(Math.abs(input.n??3)/2)):problem===136?bin(n^(input.nums?.[1]??0)):bin(input.nums?.find(v=>input.nums.filter(x=>x===v).length===1)??3);
  const label=({190:'八位示意 · 高低位对调',191:'去除最低的一个一',50:'指数逐位分解',136:'相同位异或抵消',137:'各位计数对三取余'})[problem]??'逐位计算';
  return row([...a],70,{step:35})+arrow(id,200,103,200,136)+row([...out],171,{step:35})+text(200,224,label);
}
function searchArt(lesson,id,window=false,two=false){
  const values=valuesOf(lesson),n=values.length,step=42,start=200-(n-1)*step/2,mid=Math.floor(n/2);
  if(window){const a=Math.min(1,n-1),b=Math.min(n-1,a+2);return row(values,92,{step})+rect(start+a*step-20,66,(b-a)*step+40,53,'fill="none" stroke-width="2"')+arrow(id,start+a*step,144,start+Math.min(n-1,b+1)*step,144)+text(start+a*step,188,'左界',10)+text(start+b*step,188,'右界',10)+text(200,226,'维护窗口');}
  if(two)return row(values,103,{step})+arrow(id,start,160,start+Math.min(2,n-1)*step,160)+arrow(id,start+(n-1)*step,190,start+Math.max(0,n-3)*step,190)+text(200,224,'两端向内比较');
  return row(values,92,{step})+arrow(id,start+mid*step,34,start+mid*step,67)+rect(start+mid*step-20,129,(n-mid-1)*step+40,40,'stroke-dasharray="4 4" fill="none"')+text(200,219,'定位中点 · 缩小范围');
}
function hashArt(lesson,id){
  const values=valuesOf(lesson).slice(0,4),items=[...new Set(values)].slice(0,3);
  return row(values,53,{step:50})+items.map((v,j)=>{const y=114+j*31;return rect(115,y-14,170,29,'fill="white"')+line(190,y-14,190,y+15)+text(151,y+4,v)+text(235,y+4,'已记录',10);}).join('')+arrow(id,200,77,200,94)+text(200,227,'记录与查找');
}
function backtrackArt(id){
  const p=[[200,39,'∅'],[103,101,'1'],[200,101,'2'],[297,101,'3'],[65,169,'2'],[141,169,'3']];
  return [[0,1],[0,2],[0,3],[1,4],[1,5]].map(([a,b])=>line(...p[a].slice(0,2),...p[b].slice(0,2))).join('')+p.map(([x,y,v])=>circle(x,y,v)).join('')+path('M 48 167 Q 23 102 80 101',`stroke-dasharray="4 4" marker-end="url(#${id})"`)+text(200,224,'选择 · 递归 · 撤销');
}
function scanArt(lesson,id,kind){
  const values=valuesOf(lesson);
  if(kind==='compact'){
    const val=lesson.input?.val,counts=new Map(),out=values.filter(v=>{counts.set(v,(counts.get(v)??0)+1);return Number(lesson.id)===27?v!==val:counts.get(v)<=(Number(lesson.id)===80?2:1);});
    return row(values,61)+arrow(id,200,95,200,138)+row(out,171)+text(200,225,Number(lesson.id)===80?'重复值保留至多两项':'读取 · 保留 · 写入');
  }
  if(kind==='greedy')return row(values,162)+path('M 120 132 Q 160 44 200 132',`marker-end="url(#${id})"`)+path('M 160 132 Q 220 13 280 132',`marker-end="url(#${id})"`)+text(200,226,'扩展可达边界');
  if(kind==='prefix')return row(values.slice(0,5),110)+arrow(id,93,54,300,54)+arrow(id,300,169,93,169)+text(200,222,'前缀与后缀汇合');
  if(kind==='bars'){const heights=values.slice(0,7).map(v=>Math.abs(Number(v))||1),max=Math.max(...heights),start=200-(heights.length-1)*21;return heights.map((v,i)=>rect(start+i*42-14,184-v/max*118,28,v/max*118,'fill="#f1f5ff"')).join('')+line(58,125,343,125,'stroke-dasharray="4 4"')+text(200,225,'边界限制水位');}
  if(kind==='text')return textArt(lesson,id);
  if(kind==='math')return mathArt(lesson,id);
  return row(values,80)+arrow(id,80,135,320,135)+rect(145,169,110,35,'fill="white"')+text(200,192,'累计状态')+text(200,228,'依次读取与更新');
}

function textArt(lesson,id){
  const problem=Number(lesson.id),i=lesson.input??{};
  if(problem===14){const words=(i.strs??['flower','flow','flight']).slice(0,3);return words.map((word,j)=>row([...word].slice(0,7),54+j*51,{start:80,step:36})).join('')+rect(59,30,78,148,'stroke-dasharray="4 4"')+text(200,225,'共享前缀');}
  if(problem===151){const words=String(i.s??'hello world').trim().split(/\s+/).slice(0,3),wordsRow=(items,y)=>items.map((word,j)=>{const x=200+(j-(items.length-1)/2)*95;return rect(x-43,y-17,86,34,'fill="white"')+text(x,y+4,readable(word));}).join('');return wordsRow(words,66)+arrow(id,200,101,200,138)+wordsRow([...words].reverse(),174)+text(200,225,'反转单词顺序');}
  if(problem===58){const word=String(i.s??'Hello World').trim().split(/\s+/).at(-1)??'';return row([...word].slice(0,7),68)+arrow(id,200,100,200,140)+cell(200,174,word.length)+text(200,225,'定位最后一个单词');}
  if(problem===13){const chars=[...String(i.s??'MCMXCIV')].slice(0,7),weight={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};return row(chars,66)+arrow(id,200,99,200,140)+row(chars.map(c=>weight[c]),174)+text(200,225,'按相邻符号加减');}
  if(problem===12){return row([...String(i.num??1994)],66)+arrow(id,200,99,200,140)+row([...String(lesson.expected??'MCMXCIV')].slice(0,7),174)+text(200,225,'数值与符号对应');}
  if(problem===28){return row([...String(i.haystack??'sadbutsad')].slice(0,7),69)+row([...String(i.needle??'sad')].slice(0,7),157,{start:80})+arrow(id,80,103,80,127)+text(200,225,'匹配连续片段');}
  if(problem===6){const chars=[...String(i.s??'PAYPALISHIRING')].slice(0,7),r=Math.max(2,Math.min(3,i.numRows??3)),points=chars.map((c,j)=>[72+j*43,52+(j%(2*r-2)<r?j%(2*r-2):2*r-2-j%(2*r-2))*51,c]);return path('M '+points.map(([x,y])=>`${x} ${y}`).join(' L '),'stroke-dasharray="3 4"')+points.map(([x,y,c])=>circle(x,y,c)).join('')+text(200,225,'沿行折返排列');}
  const words=(i.words??['this','is','text']).slice(0,3);return words.map((word,j)=>rect(73+j*88,61,79,33,'fill="white"')+text(112+j*88,82,readable(word))).join('')+arrow(id,200,115,200,142)+rect(65,165,270,36,'fill="white"')+text(200,189,words.join('   '),10)+text(200,229,'分配单词间距');
}

function mathArt(lesson,id){
  const problem=Number(lesson.id),i=lesson.input??{};
  if(problem===66){const digits=i.digits??[9,9,9],sum=String(BigInt(digits.join(''))+1n);return row(digits.slice(0,7),66)+arrow(id,200,99,200,138)+row([...sum].slice(0,7),174)+text(200,225,'逐位进位');}
  if(problem===172){const values=[];for(let n=Number(i.n??125);n>0&&values.length<5;n=Math.floor(n/5))values.push(n);return chain(values,108,'before',id)+text(200,225,'逐层统计因子五');}
  if(problem===149){const points=(i.points??[[1,1],[2,2],[3,3],[3,1]]).slice(0,7),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),minX=Math.min(...xs),minY=Math.min(...ys),dx=Math.max(1,Math.max(...xs)-minX),dy=Math.max(1,Math.max(...ys)-minY),pos=([x,y])=>[85+(x-minX)/dx*235,181-(y-minY)/dy*140];const a=points[0],b=points[1]??[a[0]+1,a[1]+1],onLine=points.filter(p=>(p[0]-a[0])*(b[1]-a[1])===(p[1]-a[1])*(b[0]-a[0])).sort((p,q)=>p[0]-q[0]||p[1]-q[1]);return arrow(id,66,194,347,194)+arrow(id,66,194,66,28)+line(...pos(onLine[0]),...pos(onLine.at(-1)),'stroke-dasharray="4 4"')+points.map(p=>{const [x,y]=pos(p);return `<circle cx="${x}" cy="${y}" r="4" fill="white" data-role="coordinate-point"/>`;}).join('')+text(200,228,'同方向点归组');}
  const digits=[...String(Math.abs(i.x??12321))].slice(0,7);return row(digits,108)+arrow(id,90,165,153,165)+arrow(id,310,165,247,165)+text(200,224,'首尾对应');
}

export function renderHeroArt(lesson={}){
  const kind=kindOf(lesson),safeId=String(lesson.id??'example').replace(/[^a-zA-Z0-9_-]/g,''),id=`hero-arrow-${safeId}`;
  let drawing;
  if(['reverse-groups','reverse-range','linked'].includes(kind))drawing=listArt(lesson,id,kind);
  else if(kind==='merge')drawing=mergeArt(lesson,id);
  else if(kind==='intervals')drawing=intervalArt(lesson,id);
  else if(kind==='min-stack'||kind==='stack')drawing=stackArt(lesson,id,kind==='min-stack');
  else if(kind==='tree'||kind==='heap')drawing=treeArt(lesson,id,kind==='heap');
  else if(kind==='graph')drawing=graphArt(lesson,id);
  else if(kind==='trie')drawing=trieArt(id);
  else if(kind==='matrix'||kind==='quadtree')drawing=matrixArt(lesson,id,kind==='quadtree');
  else if(kind==='dp')drawing=dpArt(lesson,id);
  else if(kind==='bits')drawing=bitsArt(lesson,id);
  else if(['binary-search','window','two-pointers'].includes(kind))drawing=searchArt(lesson,id,kind==='window',kind==='two-pointers');
  else if(kind==='hash')drawing=hashArt(lesson,id);
  else if(kind==='backtrack')drawing=backtrackArt(id);
  else drawing=scanArt(lesson,id,kind);
  return `<svg viewBox="0 0 400 240" fill="none" role="img" aria-label="${esc(lesson.title??'算法关系示意')}" data-art-kind="${kind}" data-problem="${esc(lesson.id??'')}" font-family="ui-monospace, SFMono-Regular, Consolas, monospace"><title>${esc(lesson.title??'算法关系示意')}</title><defs><marker id="${id}" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1 L6 4 L1 7" fill="none" stroke="currentColor" stroke-width="1"/></marker></defs><g stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" opacity=".65">${drawing}</g></svg>`;
}
