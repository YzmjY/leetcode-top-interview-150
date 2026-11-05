// Abstract, input-independent visual motifs for the lesson header.
// Concrete values and execution steps belong to the interactive workbench.
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const has=(ids,id)=>ids.includes(id);
const f=n=>Math.round(n*100)/100;
const attrs=o=>Object.entries(o).map(([k,v])=>`${k}="${esc(typeof v==='number'?f(v):v)}"`).join(' ');
const el=(tag,o)=>`<${tag} ${attrs(o)}/>`;
const line=(a,b,o={})=>el('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],...o});
const path=(d,o={})=>el('path',{d,...o});
const dot=(x,y,r=5,o={})=>el('circle',{cx:x,cy:y,r,fill:'white',...o});
const box=(x,y,w,h,o={})=>el('rect',{x,y,width:w,height:h,rx:3,...o});
const group=(role,body,o={})=>`<g data-role="${role}" ${attrs(o)}>${body}</g>`;
const accent={'stroke-width':2.1,opacity:.9};
const faint={opacity:.3};
const dashed={'stroke-dasharray':'3 5'};
const arrow=(mark,a,b,o={})=>line(a,b,{'marker-end':`url(#${mark})`,...o});
const poly=(points,o={})=>el('polyline',{points:points.map(p=>p.map(f).join(',')).join(' '),...o});
function kindOf(l){
 const id=Number(l.id),c=l.category??'',g=l.group??'';
 if(has([121,122,123,188],id))return 'stock';
 if(id===88)return 'merge';if(id===25)return 'reverse-groups';if(id===92)return 'reverse-range';if(id===155)return 'min-stack';
 if(has([228,56,57,452],id))return 'intervals';if(has([215,502,373,295],id))return 'heap';if(has([208,211],id))return 'trie';if(id===427)return 'quadtree';
 if(has([141,2,21,138,19,82,61,86,146,148,23],id))return 'linked';if(/二叉/.test(c)||id===108)return 'tree';
 if(has([200,130,909,79,212],id)||c==='矩阵')return 'matrix';if(/图/.test(c))return 'graph';if(c==='栈')return 'stack';
 if(/位运算/.test(c)||has([67,190,191,136,137,201,50],id))return 'bits';if(/动态规划/.test(c)||has([53,918],id))return 'dp';
 if(has([35,74,162,33,34,153,4,69],id))return 'binary-search';if(g==='sliding-window')return 'window';if(has([42,11],id))return 'bars';if(g==='two-pointers')return 'two-pointers';
 if(g==='hashmap')return 'hash';if(/回溯/.test(c))return 'backtrack';if(has([55,45],id))return 'greedy';if(id===238)return 'prefix';if(has([27,26,80],id))return 'compact';
 if(has([13,12,58,14,151,6,28,68],id))return 'text';if(c==='数学')return 'math';return 'array';
}
function stock(id,m){
 const rises=id===121?1:id===122?4:id===123?2:3,points=[[44,173]],peaks=[];
 for(let j=0;j<rises;j++){
  const x=54+j*292/rises,low=168-(j%2)*19,top=54+(j%3)*17+(id%7)*2,end=x+215/rises;
  if(j)points.push([x-8,low]);points.push([x,low],[end,top]);peaks.push([[x,low],[end,top]]);
 }
 points.push([354,80+(id%9)*5]);
 return group('price-curve',poly(points))+peaks.map(([a,b])=>group('profit-rise',line(a,b,accent)+arrow(m,[a[0],a[1]-13],[b[0],b[1]-13],{opacity:.55}))).join('')+line([43,195],[359,195],faint);
}
function merge(id,m){
 const n=4+id%3,gap=27+id%5;let s='';
 for(let j=0;j<n;j++){
  const y=50+j*gap,join=178+j*8;
  s+=path(`M 49 ${y} C 124 ${y},131 ${119+j*8},${join} ${126+j*7} S 274 ${126+j*7},350 ${126+j*7}`,{opacity:.32+j*.08});
  s+=path(`M 49 ${211-j*gap} C 118 ${211-j*gap},138 ${124+j*7},${join} ${126+j*7}`,{opacity:.45});
 }
 return group('ordered-streams',s)+dot(195,140,5)+arrow(m,[297,148],[349,148]);
}
function compact(id,m){
 const n=id===80?8:7,step=36,start=200-(n-1)*step/2;let s='';
 for(let j=0;j<n;j++){
  const x=start+j*step,remove=id===27?j%3===1:id===80?j===3||j===6:j%3===2;
  s+=dot(x,78,7,remove?faint:{});
  if(remove)s+=path(`M ${x-7} 96 L ${x+7} 110 M ${x+7} 96 L ${x-7} 110`,faint);
  else s+=path(`M ${x} 95 Q ${x} 136 ${111+j*23} 166`,{'marker-end':`url(#${m})`,opacity:.65});
 }
 if(id===80)s+=path('M 80 52 V 42 H 124 V 52 M 152 52 V 42 H 196 V 52 M 224 52 V 42 H 268 V 52',faint);
 return group(id===80?'duplicate-limit':'filter-gate',s);
}
function array(id,m){
 if(id===169){let s='';for(let j=0;j<8;j++){const angle=j*Math.PI/4;s+=dot(137+Math.cos(angle)*37,121+Math.sin(angle)*37,6,{fill:j%3?'currentColor':'white',opacity:.55});}for(let j=0;j<4;j++)s+=dot(260+(j%2)*25,99+Math.floor(j/2)*30,5,faint);return group('majority-cluster',s+path('M 195 83 Q 211 121 195 159',faint)+dot(137,121,10,accent));}
 if(id===189)return group('rotation-ring',ring(200,120,78,7,id,m)+path('M 134 55 A 94 94 0 1 1 109 136',{'marker-end':`url(#${m})`,...accent}));
 if(id===134)return group('supply-cycle',ring(200,120,75,6,id,m)+[0,1,2,3,4,5].map(j=>{const a=j*Math.PI/3,x=200+Math.cos(a)*105,y=120+Math.sin(a)*85;return line([x-5,y],[x+5,y])+line([x,y-5],[x,y+5]);}).join('')+arrow(m,[110,185],[153,200]));
 if(id===135){let s='';for(let j=0;j<8;j++){const x=58+j*40,h=j<4?22+j*19:22+(7-j)*19;s+=line([x,181],[x,181-h],{'stroke-width':4,opacity:.55})+dot(x,181-h-14,3);}return group('gradient-allocation',s+poly([[52,188],[174,67],[215,67],[348,188]],faint));}
 if(id===274){let s='';for(let j=0;j<7;j++)s+=line([77+j*40,188],[77+j*40,54+j*18],{'stroke-width':8,opacity:.4});return group('rank-threshold',s+line([52,119],[350,119],dashed)+line([231,49],[231,190],dashed));}
 if(id===380){const p=[[90,83],[157,66],[139,155],[76,162]],q=[[266,62],[304,105],[268,155],[322,182]];return group('set-index',p.map((a,j)=>line(a,q[j],{opacity:.35})+dot(...a,7)+dot(...q[j],5)).join('')+path('M 55 59 V 193 H 167',faint)+path('M 245 44 H 342 V 200',faint));}
 return group('sequence-relation',path(`M 54 ${65+id%15} H 346 M 54 ${166+id%11} H 346`,faint)+[0,1,2,3,4,5].map(j=>dot(70+j*52,115+(j%2)*(14+id%9),5)+line([70+j*52,86],[70+j*52,153],faint)).join(''));
}
function ring(cx,cy,r,n,id,m){
 const p=Array.from({length:n},(_,j)=>{const a=-Math.PI/2+j*2*Math.PI/n;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r*.8];});
 return p.map((a,j)=>{const b=p[(j+1)%n],mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];return line(a,b,faint)+arrow(m,mid,[(mid[0]+b[0])/2,(mid[1]+b[1])/2],{opacity:.6})+dot(...a,5+id%3);}).join('');
}
function linked(id,m,kind){
 if(id===146){let s='';for(let j=0;j<5;j++){const x=66+j*67;s+=box(x-10,109,20,24,{fill:'white'});if(j<4)s+=arrow(m,[x+13,115],[x+51,115])+arrow(m,[x+51,127],[x+13,127],{opacity:.45});}return group('cache-recency',s+path('M 269 100 C 269 39,115 39,115 100',{'marker-end':`url(#${m})`,...accent}));}
 const n=6+(id%2),step=43,start=200-(n-1)*step/2,y=120;let s='';
 for(let j=0;j<n;j++){s+=dot(start+j*step,y,7);if(j<n-1)s+=arrow(m,[start+j*step+10,y],[start+(j+1)*step-12,y],{opacity:.55});}
 if(kind==='reverse-groups')for(let j=0;j<n-2;j+=2)s+=group('group-twist',path(`M ${start+j*step-12} 94 Q ${start+(j+.5)*step} 36 ${start+(j+1)*step+12} 94 M ${start+(j+1)*step+12} 146 Q ${start+(j+.5)*step} 204 ${start+j*step-12} 146`,{'marker-end':`url(#${m})`})+path(`M ${start+j*step-15} 83 V 72 H ${start+(j+1)*step+15} V 83`,faint));
 else if(kind==='reverse-range')s+=group('range-twist',path(`M ${start+step-9} 91 C ${start+step} 37,${start+4*step} 37,${start+4*step+9} 91 M ${start+4*step+9} 150 C ${start+4*step} 204,${start+step} 204,${start+step-9} 150`,{'marker-end':`url(#${m})`,...accent}));
 else if(id===141)s+=path(`M ${start+(n-1)*step} 144 C 336 217,91 217,${start+step} 144`,{'marker-end':`url(#${m})`});
 else if(id===61)s+=path(`M ${start+(n-1)*step} 144 C 351 217,49 217,${start} 144`,{'marker-end':`url(#${m})`})+path(`M ${start+3.5*step-6} 105 L ${start+3.5*step+6} 135`,dashed);
 else if(id===138)s+=path(`M ${start} 100 Q 200 15 ${start+4*step} 100 M ${start+step} 143 Q 219 218 ${start+(n-1)*step} 143`,{...dashed,'marker-end':`url(#${m})`});
 else if(has([21,148,23,2],id))s+=path(`M 67 ${49+id%12} C 139 49,161 88,196 110 M 333 ${190-id%17} C 270 190,248 147,223 130`,{'marker-end':`url(#${m})`});
 else if(id===86)s+=path('M 164 99 C 152 56,103 56,89 82 M 239 145 C 258 190,305 190,321 160',dashed);
 else s+=path(`M ${start+2*step} 96 Q ${200+id%17} 49 ${start+4*step} 96`,{'marker-end':`url(#${m})`,...dashed});
 return group('pointer-topology',s);
}
function tree(id,m,heap=false){
 if(id===100||id===101){const tiny=(cx,mirror)=>{let s='';const pts=[[cx,60],[cx-40,117],[cx+40,117],[cx+(mirror?65:-65),177]];for(const [a,b]of [[0,1],[0,2],[mirror?2:1,3]])s+=line(pts[a],pts[b]);return s+pts.map(p=>dot(...p,6)).join('');};return tiny(105,false)+tiny(295,id===101)+line([200,44],[200,193],dashed);}
 if(id===295){const half=cx=>line([cx,62],[cx-35,124])+line([cx,62],[cx+35,124])+dot(cx,62,8)+dot(cx-35,124,5)+dot(cx+35,124,5);return group('paired-heaps',half(111)+half(289)+line([159,165],[241,165],faint)+arrow(m,[145,82],[188,150])+arrow(m,[255,82],[212,150])+dot(200,165,7));}
 const spread=66+id%17,levels=heap?3:3,dy=59+id%9,top=40+(id%5),nodes=[[200,top]],edges=[];let s='';
 for(let level=1;level<levels;level++){const count=2**level;for(let j=0;j<count;j++){const x=200+(j-(count-1)/2)*spread*2/2**(level-1),y=top+level*dy,idx=nodes.length,parent=Math.floor((idx-1)/2);nodes.push([x,y]);edges.push([parent,idx]);}}
 s+=edges.map(([a,b])=>group(heap?'heap-level':'tree-branch',line(nodes[a],nodes[b],{opacity:.5}))).join('')+nodes.map((p,j)=>dot(...p,j?4.8:7)).join('');
 if(heap){s+=path(`M ${200-spread} ${top+dy-20} Q 200 ${top-18} ${200+spread} ${top+dy-20}`,faint);if(id===502)s+=arrow(m,[336,184],[336,72]);if(id===373)s+=line(nodes[3],nodes[5],dashed);if(id===215)s+=path(`M 183 ${top-19} H 217`,accent);}
 else if(has([104,112,129,173,230,530],id))s+=poly([nodes[0],nodes[1],nodes[3]],accent);
 else if(has([117,199,637,102,103],id)){for(let level=1;level<3;level++)s+=path(`M ${48+level*10} ${top+level*dy+15} H ${351-level*10}`,{...dashed,opacity:.5});if(id===103)s+=arrow(m,[335,103],[266,103]);}
 else if(id===124||id===236)s+=poly([nodes[3],nodes[1],nodes[0],nodes[2],nodes[6]],accent);
 else if(id===114)s+=path(`M 288 ${top} Q 340 115 288 ${top+2*dy}`,{'marker-end':`url(#${m})`});
 else if(id===226)s+=path(`M ${200-spread} ${top+dy-21} Q 200 3 ${200+spread} ${top+dy-21}`,{'marker-start':`url(#${m})`,'marker-end':`url(#${m})`});
 else if(id===98)s+=path(`M ${200-spread-15} ${top+dy+20} H 200 V ${top-20} M 200 ${top+dy+20} H ${200+spread+15}`,faint);
 else if(has([105,106,108],id))s+=path(`M ${105+id%9} 204 H ${295-id%9}`,{...dashed,'marker-end':`url(#${m})`});
 return s;
}
function graph(id,m){
 if(id===133){const part=cx=>{const p=[[cx-34,78],[cx+34,78],[cx+34,154],[cx-34,154]];return [[0,1],[1,2],[2,3],[3,0]].map(([a,b])=>group('graph-link',line(p[a],p[b]))).join('')+p.map(q=>dot(...q,5)).join('');};return part(105)+part(295)+[78,154].map(y=>line([146,y],[254,y],dashed)).join('');}
 const n=id===207?5:id===210?6:5+id%3,p=Array.from({length:n},(_,j)=>{const a=-Math.PI/2+j*Math.PI*2/n;return [200+Math.cos(a)*(93+id%16),121+Math.sin(a)*(75+id%11)];});let s='';
 for(let j=0;j<n;j++){const next=(j+1)%n;s+=group('graph-link',line(p[j],p[next],has([207,210,399],id)?{'marker-end':`url(#${m})`}:{}));if(j%2===0)s+=line(p[j],p[(j+2)%n],faint);}
 if(id===399)s+=path(`M ${p[0][0]-10} ${p[0][1]} Q 85 85 ${p[2][0]-10} ${p[2][1]}`,{...dashed,'marker-end':`url(#${m})`});
 if(has([433,127],id))s+=poly([p[0],p[1],p[2]],accent);
 return s+p.map((q,j)=>dot(...q,j===0?7:5)).join('');
}
function matrix(id,m,quad=false){
 if(quad){const x=117,w=166;return box(x,40,w,153)+line([200,40],[200,193])+line([x,116],[x+w,116])+box(207,124,66,59,faint)+line([240,124],[240,183],faint)+line([207,154],[273,154],faint);}
 const rows=id===36?6:4+(id%2),cols=id===54?6:4+(id%3),size=22+id%3,x=200-cols*size/2,y=120-rows*size/2;let s='';
 for(let r=0;r<=rows;r++)s+=line([x,y+r*size],[x+cols*size,y+r*size],{opacity:.45});for(let c=0;c<=cols;c++)s+=line([x+c*size,y],[x+c*size,y+rows*size],{opacity:.45});
 if(id===54)s+=path(`M ${x-12} ${y-11} H ${x+cols*size+11} V ${y+rows*size+11} H ${x-11} V ${y+size} H ${x+(cols-1)*size}`,{'marker-end':`url(#${m})`,...accent});
 else if(id===48)s+=path(`M ${x-22} ${y+25} Q ${x-16} ${y-26} ${x+48} ${y-22}`,{'marker-end':`url(#${m})`})+path(`M ${x+cols*size+22} ${y+rows*size-25} Q ${x+cols*size+16} ${y+rows*size+26} ${x+cols*size-48} ${y+rows*size+22}`,{'marker-end':`url(#${m})`});
 else if(id===73)s+=line([x,y+size*2],[x+cols*size,y+size*2],accent)+line([x+size*2,y],[x+size*2,y+rows*size],accent);
 else if(id===909)s+=poly(Array.from({length:rows},(_,r)=>r%2?[[x+cols*size-8,y+r*size+size/2],[x+8,y+r*size+size/2]]:[[x+8,y+r*size+size/2],[x+cols*size-8,y+r*size+size/2]]).flat(),{'marker-end':`url(#${m})`,opacity:.65});
 else if(has([79,212],id))s+=poly([[x+size/2,y+size/2],[x+size*1.5,y+size/2],[x+size*1.5,y+size*2.5],[x+size*2.5,y+size*2.5]],accent);
 else if(id===200||id===130)s+=path(`M ${x+9} ${y+9} H ${x+size*2-7} V ${y+size*2-7} H ${x+9} Z M ${x+size*3+5} ${y+size+5} H ${x+cols*size-5} V ${y+rows*size-7}`,accent);
 else if(id===289)for(const [r,c]of [[1,1],[1,2],[2,1],[2,2]])s+=dot(x+(c+.5)*size,y+(r+.5)*size,3,{fill:'currentColor',opacity:.6});
 else s+=box(x,y,size*3,size*3,accent)+box(x+size*3,y+size*3,size*(cols-3),size*(rows-3),faint);
 return group('grid-geometry',s);
}
function heap(id,m){return tree(id,m,true);}
function trie(id,m){
 const spread=70+id%11,p=[[200,40],[200-spread,103],[200+spread,103],[200-spread-34,169],[200-spread+34,169],[200+spread,169]],edges=[[0,1],[0,2],[1,3],[1,4],[2,5]];
 return edges.map(([a,b])=>line(p[a],p[b],a===1?accent:{})).join('')+p.map((q,j)=>dot(...q,j>2?6:4,j>2?{fill:'currentColor',opacity:.55}:{})).join('')+(id===211?path(`M ${p[1][0]-21} 123 Q ${p[1][0]} 193 ${p[1][0]+40} 134`,dashed):path(`M ${p[0][0]-8} 56 L ${p[1][0]+8} 89`,dashed));
}
function stack(id,m,minimum=false){
 const n=4+(id%2),bottom=192,gap=25+id%5,left=129+id%7,right=271-id%7;let s=path(`M ${left} 47 V ${bottom} H ${right} V 47`);
 for(let j=0;j<n;j++){const y=bottom-12-j*gap;s+=line([left+11,y],[right-11,y],{opacity:.5});if(minimum)s+=line([201,y-10],[201,y+10],faint);}
 if(minimum)return group('paired-stack',s+path(`M ${right+21} ${bottom-9} V ${bottom-gap*(n-1)-12}`,{'marker-end':`url(#${m})`})+Array.from({length:n},(_,j)=>dot(right-24,bottom-17-j*gap,2.5)).join(''));
 if(id===20)s+=path('M 87 70 Q 65 120 87 170 M 313 70 Q 335 120 313 170',accent);
 else if(id===71)s+=path('M 67 82 H 103 V 62 H 125 M 278 63 H 308 V 86 H 337',faint);
 else if(id===150)s+=arrow(m,[80,89],[left-7,89])+arrow(m,[right+7,89],[329,89]);
 else s+=path('M 65 80 H 100 M 82 63 V 97 M 298 80 H 333',accent);
 return s+arrow(m,[240,30],[240,64])+arrow(m,[285,64],[285,30]);
}
function intervals(id,m){
 const spans=id===228?[[58,132],[139,202],[244,294],[301,347]]:id===452?[[61,215],[117,292],[173,343]]:id===57?[[55,132],[170,256],[278,348],[109,304]]:[[55,191],[133,279],[238,348]];let s='';
 spans.forEach(([a,b],j)=>{const y=58+j*35;s+=line([a,y],[b,y],{'stroke-width':j===spans.length-1&&id===57?3:2})+line([a,y-5],[a,y+5])+line([b,y-5],[b,y+5]);});
 if(id===452)s+=arrow(m,[191,204],[191,36],dashed);else if(id===228)s+=path('M 59 90 V 102 H 202 V 90 M 244 161 V 173 H 348 V 161',dashed);else s+=box(id===57?170:142,40,id===57?86:47,147,{...faint,...dashed});
 return group('interval-overlap',s);
}
function search(id,m){
 const center=185+id%31,span=130+id%13;let s='';
 for(let j=0;j<4;j++){const half=span/2**j,y=49+j*46;s+=line([center-half,y],[center+half,y],{opacity:.35+j*.12})+dot(center+(j%2?1:-1)*half/3,y,3+j*.5);if(j<3)s+=line([center-half,y+8],[center-half/2,y+37],faint)+line([center+half,y+8],[center+half/2,y+37],faint);}
 if(id===33||id===153)s+=path(`M ${center-span} 30 Q ${center} -2 ${center+span} 30`,dashed);if(id===4)s+=line([65,218],[200,218])+line([214,218],[340,218])+dot(207,218,4);if(id===74)s+=box(61,36,278,170,faint);
 return group('convergence',s);
}
function windowArt(id,m){
 const x=65+id%17,w=125+id%31,y=73,h=88;let s='';for(let j=0;j<10;j++)s+=line([49+j*33,113+(j%3)*6],[49+j*33,132+(j%3)*6],{opacity:.3});
 s+=box(x,y,w,h,accent)+box(x+35,y+18,w,h,{...faint,...dashed})+arrow(m,[x+20,y-20],[x+w-10,y-20]);
 if(id===76)s+=path(`M ${x+22} ${y+25} H ${x+w-22} V ${y+h-25}`,{...dashed,opacity:.6});if(id===30)s+=line([x+w/3,y],[x+w/3,y+h],faint)+line([x+w*2/3,y],[x+w*2/3,y+h],faint);if(id===209)s+=path(`M ${x} 188 H ${x+w} M ${x} 181 V 195 M ${x+w} 181 V 195`,faint);
 return group('window-region',s);
}
function pointers(id,m){
 const n=7+(id%2),step=37,start=200-(n-1)*step/2;let s='';for(let j=0;j<n;j++)s+=dot(start+j*step,115,3.5,{opacity:.35});s+=arrow(m,[start,78],[start+82,78])+arrow(m,[start+(n-1)*step,154],[start+(n-1)*step-82,154]);
 if(id===125)s+=path('M 200 43 V 193',dashed)+path('M 111 88 Q 200 30 289 88',faint);if(id===392)s+=path('M 100 55 L 143 93 M 186 55 L 229 93 M 272 55 L 315 93',faint);if(id===167)s+=path('M 102 177 Q 200 221 298 177',dashed);if(id===15)s+=dot(200,115,13,accent)+line([200,41],[200,77],faint);
 return group('pointer-contraction',s);
}
function bars(id,m){
 const heights=id===42?[39,89,55,126,68,110,43]:[44,118,66,91,135,57,88],start=65;let s='';heights.forEach((h,j)=>{s+=line([start+j*45,192],[start+j*45,192-h],{'stroke-width':4,opacity:.5});});s+=line([57,100+id%13],[347,100+id%13],dashed);
 if(id===11)s+=path('M 110 65 V 199 H 245 V 65',accent);else s+=path('M 155 117 H 195 M 155 128 H 195 M 245 131 H 290',faint);
 return group('bounding-height',s);
}
function hash(id,m){
 const n=4+id%3,left=82+id%9;let s='';for(let j=0;j<n;j++){const y=44+j*153/(n-1),dest=60+((j+id)%3)*57;s+=path(`M ${left+8} ${y} C 170 ${y},196 ${dest},269 ${dest}`,{opacity:.3+(j%3)*.13})+dot(left,y,4)+path(`M 274 ${dest-13} H 315 V ${dest+13} H 274`,faint);}
 if(id===1)s+=path('M 108 66 Q 186 8 263 65',dashed);if(has([205,290],id))s+=line([328,52],[328,185],faint);if(has([49,242],id))s+=box(65,28,37,187,{...dashed,opacity:.35});if(id===202)s+=path('M 312 199 Q 197 246 92 199',{'marker-end':`url(#${m})`});if(id===128)s+=path('M 273 191 H 338',accent);
 return group('key-association',s);
}
function backtrack(id,m){
 const spread=78+id%13,p=[[200,37],[200-spread,104],[200+spread,104],[200-spread-32,173],[200-spread+32,173],[200+spread-32,173],[200+spread+32,173]];let s=[[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]].map(([a,b])=>line(p[a],p[b],{opacity:.4})).join('')+p.map(q=>dot(...q,4.5)).join('');
 s+=path(`M ${p[3][0]-12} 171 Q ${p[3][0]-38} 97 ${p[1][0]-13} 99`,{'marker-end':`url(#${m})`,...dashed});if(id===52)s+=box(249,151,44,43,faint)+line([249,151],[293,194],faint);if(id===39)s+=path('M 275 119 Q 331 114 310 73',{'marker-end':`url(#${m})`});if(id===22)s+=path('M 170 86 Q 157 111 170 136 M 230 86 Q 243 111 230 136',faint);
 return group('choice-and-return',s);
}
function bits(id,m){
 const n=8,x=60+id%7,step=39,y=82;let s='';for(let j=0;j<n;j++){const h=(j+id)%3?18:38;s+=line([x+j*step,y-h/2],[x+j*step,y+h/2],{opacity:j%2?.8:.35});}
 if(id===190)for(let j=0;j<4;j++)s+=path(`M ${x+j*step} 111 Q 200 ${161+j*13} ${x+(7-j)*step} 111`,{opacity:.35+j*.1});
 else if(id===67)s+=path(`M ${x+step*5} 130 Q ${x+step*4.5} 187 ${x+step*4} 130 M ${x+step*4} 130 Q ${x+step*3.5} 172 ${x+step*3} 130`,{'marker-end':`url(#${m})`});
 else if(id===201)s+=path(`M ${x-9} 52 H ${x+step*3+9} V 113 H ${x-9} Z M ${x+step*4} 139 H ${x+step*7}`,dashed);
 else if(id===191)s+=path(`M ${x+step*6-8} 113 L ${x+step*6+8} 137 M ${x+step*6+8} 113 L ${x+step*6-8} 137`,accent);
 else if(id===50)s+=path(`M ${x+step*7} 136 Q 200 210 ${x} 136`,{'marker-end':`url(#${m})`});
 else for(let j=0;j<4;j++)s+=path(`M ${x+j*step} 127 L ${x+j*step+24} 157 L ${x+j*step+48} 127`,{opacity:.4});
 return group('bit-relations',s);
}
function dp(id,m){
 if(has([53,918,70,198,139,322,300],id)){let s='';const n=6,step=48,start=80;for(let j=0;j<n;j++){const y=125+(j%2)*(id%7);s+=dot(start+j*step,y,5);if(j<n-1)s+=arrow(m,[start+j*step+9,y],[start+(j+1)*step-10,125+((j+1)%2)*(id%7)],{opacity:.5});if(j<n-2)s+=path(`M ${start+j*step} 105 Q ${start+(j+1)*step} ${37+id%23} ${start+(j+2)*step} 105`,{opacity:.35});}if(id===918)s+=path('M 321 153 Q 200 231 79 153',dashed);if(id===198)s+=path('M 92 174 H 124 M 188 174 H 220 M 284 174 H 316',accent);if(id===139)s+=path('M 76 169 V 182 H 175 V 169 M 185 169 V 182 H 271 V 169 M 281 169 V 182 H 327 V 169',dashed);if(id===300)s+=poly([[79,194],[128,179],[224,167],[320,151]],accent);return group('state-flow',s);}
 const rows=4,cols=5,step=35+id%4,x=200-(cols-1)*step/2,y=49+id%11;let s='';for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const p=[x+c*step,y+r*step];if(c<cols-1)s+=line(p,[p[0]+step,p[1]],faint);if(r<rows-1)s+=line(p,[p[0],p[1]+step],faint);s+=dot(...p,2.5);}
 const a=[x+2*step,y+2*step],b=[x+3*step,y+3*step];s+=arrow(m,a,b,accent)+arrow(m,[a[0]+step,a[1]],b,{opacity:.7})+arrow(m,[a[0],a[1]+step],b,{opacity:.7});if(id===5)s+=line([x,y],[x+4*step,y+3*step],dashed);if(id===221)s+=box(x+step,y+step,step*2,step*2,dashed);if(id===120)s+=poly([[x+2*step,y-15],[x-15,y+3*step+14],[x+4*step+15,y+3*step+14],[x+2*step,y-15]],faint);
 return group('state-flow',s);
}
function prefix(id,m){
 let s='';for(let j=0;j<6;j++)s+=dot(69+j*52,120,5);s+=path('M 68 81 H 191 Q 200 81 200 107',{'marker-end':`url(#${m})`})+path('M 332 159 H 209 Q 200 159 200 133',{'marker-end':`url(#${m})`})+dot(200,120,15,accent);return group('prefix-suffix',s);
}
function textArt(id,m){
 if(id===6){const p=Array.from({length:9},(_,j)=>[57+j*35,64+(j%4<3?j%4:4-j%4)*53]);return poly(p,faint)+p.map(q=>line([q[0]-6,q[1]-7],[q[0]+6,q[1]+7])).join('');}
 if(id===13||id===12){let s=path('M 86 61 V 124 M 125 61 L 145 124 L 165 61 M 208 61 L 249 124 M 249 61 L 208 124');s+=id===13?arrow(m,[277,91],[331,91])+path('M 305 139 V 183 M 283 161 H 327',faint):path('M 286 67 V 117 M 266 92 H 306',faint)+arrow(m,[77,169],[245,169]);return s;}
 if(id===14){let s='';for(let r=0;r<3;r++){const y=66+r*50;s+=line([70,y],[170,y],accent)+line([184,y],[327-r*20,y],faint);}return s+box(56,43,128,146,dashed);}
 if(id===151)return path('M 61 76 H 144 M 169 76 H 231 M 256 76 H 339 M 61 164 H 144 M 169 164 H 231 M 256 164 H 339',faint)+path('M 103 91 C 103 130,297 106,297 149 M 297 91 C 297 130,103 106,103 149',{'marker-end':`url(#${m})`});
 if(id===58)return path('M 57 100 H 108 M 128 100 H 200 M 224 100 H 344',faint)+path('M 222 83 V 124 H 345 V 83',accent)+line([224,161],[344,161],dashed);
 if(id===28)return path('M 57 77 H 344 M 57 111 H 344',faint)+box(142,64,104,62,dashed)+path('M 143 167 H 246',accent)+arrow(m,[194,147],[194,131]);
 return path('M 62 59 H 132 M 149 59 H 224 M 249 59 H 339 M 62 110 H 170 M 195 110 H 339 M 62 162 H 135 M 163 162 H 238 M 269 162 H 339',faint)+line([48,42],[48,183])+line([353,42],[353,183])+path('M 137 199 H 257',dashed);
}
function mathArt(id,m){
 if(id===149)return line([62,190],[348,190],faint)+line([62,190],[62,32],faint)+line([94,171],[313,53],accent)+[[111,162],[172,129],[246,89],[290,66],[277,158],[129,64]].map(p=>dot(...p,4)).join('');
 if(id===66)return [0,1,2,3].map(j=>dot(82+j*77,142,6)+path(`M ${82+j*77} 125 Q ${120+j*77} ${50-j*5} ${159+j*77} 125`,j<3?{'marker-end':`url(#${m})`}:faint)).join('');
 if(id===172)return [0,1,2,3].map(j=>box(87+j*31,42+j*24,225-j*62,155-j*46,{opacity:.3+j*.12})).join('');
 return line([200,38],[200,201],dashed)+[0,1,2].map(j=>{const x=89+j*36,y=71+j*42;return dot(x,y,5)+dot(400-x,y,5)+path(`M ${x+9} ${y} Q 200 ${y-31} ${391-x} ${y}`,faint);}).join('');
}
function greedy(id,m){
 const n=id===55?5:6,p=Array.from({length:n},(_,j)=>[65+j*270/(n-1),165]);let s=p.map(q=>dot(...q,5)).join('');for(let j=0;j<n-1;j++){const end=Math.min(n-1,j+(id===55?2:3)),a=p[j],b=p[end];s+=path(`M ${a[0]} 145 Q ${(a[0]+b[0])/2} ${45+j*13} ${b[0]} 145`,{opacity:.65,'marker-end':`url(#${m})`});}return group('reachable-frontier',s);
}
function specificArt(id,m){
 if(id===200||id===130){const size=30,x=125,y=45;let s='';for(let j=0;j<=5;j++)s+=line([x,y+j*size],[x+150,y+j*size],faint)+line([x+j*size,y],[x+j*size,y+150],faint);s+=box(x,y,150,150,{opacity:.65});const cells=points=>points.map(([r,c])=>box(x+c*size+4,y+r*size+4,22,22,{fill:'currentColor',opacity:.12})).join('');if(id===200){for(const points of [[[0,0],[0,1],[1,0]],[[1,3],[2,3],[2,4]],[[4,0],[4,1]]])s+=group('island-component',cells(points));s+=path('M 129 49 H 181 V 71 H 151 V 101 H 129 Z M 219 79 H 241 V 109 H 271 V 131 H 219 Z M 129 169 H 181 V 191 H 129 Z',accent);return group('island-components',s);}s+=cells([[0,0],[1,0],[1,1],[2,2],[2,3],[3,2],[3,4],[4,4]])+poly([[170,90],[140,90],[140,60],[140,23]],{'marker-end':`url(#${m})`,...accent})+poly([[260,150],[260,180],[260,213]],{'marker-end':`url(#${m})`})+box(181,101,62,62,dashed);return group('boundary-escape',s);}
 if(id===212){const base=matrix(id,m);return group('prefix-board-branches',base+path('M 272 157 C 296 158,294 97,319 97 M 272 157 C 296 158,294 188,319 188')+dot(324,97,4)+dot(324,188,4)+path('M 324 97 L 351 77 M 324 97 L 351 117 M 324 188 L 351 168 M 324 188 L 351 208',faint));}
 if(id===53||id===918){let s='';for(let j=0;j<8;j++){const x=53+j*42;s+=dot(x,116,4.5);if(j<7)s+=line([x+8,116],[x+34,116],faint);}if(id===53)s+=path('M 87 142 V 164 H 263 V 142',accent)+line([95,116],[263,116],accent);else s+=path('M 52 143 C 25 216,375 216,347 143',{'marker-end':`url(#${m})`,...accent})+path('M 48 92 V 74 H 100 V 92 M 300 92 V 74 H 352 V 92',accent);return group(id===53?'contiguous-run':'circular-contiguous',s);}
 if(id===120){let s='';const points=[];for(let r=0;r<4;r++)for(let c=0;c<=r;c++){const p=[200+(c-r/2)*70,41+r*52];points.push(p);s+=dot(...p,4);if(r<3){s+=arrow(m,[p[0]-6,p[1]+9],[p[0]-29,p[1]+43],{opacity:.6})+arrow(m,[p[0]+6,p[1]+9],[p[0]+29,p[1]+43],{opacity:.6});}}return group('triangle-adjacency',s);}
 if(id===5){let s='';for(let j=0;j<7;j++)s+=dot(68+j*44,139,4);for(let r=1;r<=3;r++)s+=path(`M ${200-r*44} 125 Q 200 ${96-r*25} ${200+r*44} 125`,{opacity:.35+r*.15});return group('palindromic-interval',s+path('M 152 165 V 184 H 248 V 165',accent)+line([200,99],[200,154],dashed));}
 if(id===909){const x=110,y=28,size=30,n=6;let s='';for(let j=0;j<=n;j++)s+=line([x,y+j*size],[x+n*size,y+j*size],faint)+line([x+j*size,y],[x+j*size,y+n*size],faint);const p=[];for(let level=0;level<n;level++){const cy=y+(n-level-.5)*size;p.push([level%2?x+(n-.5)*size:x+size/2,cy],[level%2?x+size/2:x+(n-.5)*size,cy]);}s+=poly(p,{'marker-end':`url(#${m})`,opacity:.65})+dot(...p[0],6)+path('M 155 193 Q 178 106 245 103',{'marker-end':`url(#${m})`,...accent})+path('M 274 44 Q 326 113 217 133',{'marker-end':`url(#${m})`,...dashed});return group('snake-and-shortcuts',s);}
 if(id===148){const p=[[64,121],[119,121],[189,60],[189,181],[262,60],[262,181],[333,121]],edges=[[0,1],[1,2],[1,3],[2,4],[3,5],[4,6],[5,6]];return group('split-then-merge',edges.map(([a,b])=>arrow(m,p[a],p[b],{opacity:.6})).join('')+p.map(q=>dot(...q,6)).join('')+path('M 173 34 V 24 H 278 V 34 M 173 207 V 217 H 278 V 207',dashed));}
 if(id===52){const size=30,x=125,y=45;let s='';for(let j=0;j<=5;j++)s+=line([x,y+j*size],[x+150,y+j*size],faint)+line([x+j*size,y],[x+j*size,y+150],faint);const cx=200,cy=120;s+=line([x,cy],[x+150,cy],accent)+line([cx,y],[cx,y+150],accent)+line([x,y],[x+150,y+150],dashed)+line([x+150,y],[x,y+150],dashed)+dot(cx,cy,10,{fill:'white'})+path('M 193 116 L 190 104 L 199 110 L 207 104 L 205 116 Z');return group('queen-attack-lines',s);}
 if(id===4){let s='';for(const [y,cut]of [[77,175],[159,236]]){s+=line([58,y],[342,y])+path(`M ${cut} ${y-21} V ${y+21}`,accent)+dot(cut-16,y,4)+dot(cut+16,y,4);for(let j=0;j<6;j++)s+=line([74+j*49,y-5],[74+j*49,y+5],faint);}s+=path('M 175 99 L 236 137 M 175 55 H 59 M 236 181 H 342',dashed)+dot(205.5,118,7);return group('balanced-partitions',s);}
 if(id===74){const base=search(id,m);let s='';for(let j=1;j<4;j++)s+=line([61+j*69.5,36],[61+j*69.5,206],faint);for(let j=1;j<3;j++)s+=line([61,36+j*56.67],[339,36+j*56.67],faint);return group('matrix-convergence',base+s);}
 if(id===1)return group('complement-pair',dot(87,86,13)+dot(313,86,13)+path('M 103 91 Q 167 103 189 153 M 297 91 Q 233 103 211 153',{'marker-end':`url(#${m})`,...accent})+dot(200,169,12)+path('M 110 62 Q 200 14 290 62',dashed));
 if(id===202){let s='';const p=[[58,106],[116,106],[174,106],[233,106]];p.forEach((q,j)=>{s+=dot(...q,5)+box(q[0]-6,64,12,12,faint);if(j<3)s+=arrow(m,[q[0]+9,q[1]],[p[j+1][0]-11,p[j+1][1]],{opacity:.65});});s+=path('M 242 106 C 318 24,383 138,301 175 C 258 198,224 157,244 121',{'marker-end':`url(#${m})`})+dot(320,100,5)+dot(306,168,5)+dot(250,155,5);return group('square-cycle',s);}
 if(id===219){let s='';for(let j=0;j<7;j++)s+=dot(65+j*45,106,4,j===1||j===4?{fill:'currentColor'}:{opacity:.35});return group('duplicate-distance',s+dot(110,106,12)+dot(245,106,12)+box(93,71,170,77,dashed)+arrow(m,[114,177],[240,177],{'marker-start':`url(#${m})`})+path('M 110 168 V 187 M 245 168 V 187',faint));}
 if(id===128){const scattered=[[58,63],[111,88],[67,153],[131,181],[152,51]];let s=scattered.map(p=>dot(...p,5)).join('');for(let j=0;j<5;j++){const x=209+j*34;s+=dot(x,119,5);if(j)s+=line([x-26,119],[x-8,119]);}return group('consecutive-membership',s+path('M 135 112 C 163 98,173 126,197 119',{'marker-end':`url(#${m})`,...dashed})+path('M 207 149 V 164 H 348 V 149',accent));}
 if(id===242){const p=[[68,174],[68,127],[99,127],[99,72],[132,72],[132,112],[165,112],[165,54],[198,54],[198,147],[231,147],[231,90],[264,90],[264,123],[299,123],[299,164],[332,164]];return group('frequency-overlap',poly(p,accent)+poly(p.map(([x,y])=>[x,y+6]),{...dashed,opacity:.55})+line([52,194],[348,194],faint)+dot(45,120,5)+dot(355,120,5));}
 if(id===49){let s='';const centers=[[91,115],[234,63],[278,160]];centers.forEach(([x,y],j)=>{s+=el('ellipse',{cx:x,cy:y,rx:44+j*4,ry:34+j*2,...dashed});for(let k=0;k<3;k++)s+=dot(x+(k-1)*20,y+(k%2)*12,4+j*.7);});s+=path('M 142 100 Q 172 75 184 68 M 139 135 Q 191 164 220 162',{'marker-end':`url(#${m})`,opacity:.55});return group('anagram-clusters',s);}
 if(id===383)return group('available-symbol-pool',el('ellipse',{cx:200,cy:120,rx:128,ry:79})+el('ellipse',{cx:169,cy:120,rx:66,ry:50,...dashed})+[[120,102],[165,92],[201,125],[143,143],[252,78],[284,119],[248,162]].map((p,j)=>dot(...p,4.5,j<4?{fill:'currentColor',opacity:.55}:{})).join(''));
 if(id===2){let s='';for(let j=0;j<5;j++){const x=72+j*63;s+=dot(x,78,4)+dot(x,126,4)+line([x,92],[x,111],faint)+line([x-10,169],[x+10,169]);if(j>1)s+=path(`M ${x} 58 Q ${x-31} ${20+j*4} ${x-63} 58`,{'marker-end':`url(#${m})`,opacity:.65});}return group('positional-addition',s+line([53,149],[348,149])+arrow(m,[350,100],[350,137],faint));}
 if(id===19||id===82){let s='';const n=7,start=62,step=46,skip=id===19?[4]:[2,3,4];for(let j=0;j<n;j++){const x=start+j*step;s+=dot(x,112,6,skip.includes(j)?{opacity:.25,...dashed}:{});if(j<n-1&&!skip.includes(j)&&!skip.includes(j+1))s+=arrow(m,[x+9,112],[x+step-12,112],{opacity:.6});}const a=id===19?3:1,b=5;s+=path(`M ${start+a*step} 96 Q ${(start+a*step+start+b*step)/2} 39 ${start+b*step} 96`,{'marker-end':`url(#${m})`,...accent});if(id===19)s+=path('M 247 151 V 165 H 338 V 151 M 294 158 V 171',dashed)+arrow(m,[332,186],[258,186],faint);else s+=box(139,87,118,49,{...dashed,opacity:.35});return group(id===19?'skip-single-node':'skip-duplicate-cluster',s);}
 if(id===114){const p=[[108,45],[70,104],[147,104],[48,165],[92,165]];let s=[[0,1],[0,2],[1,3],[1,4]].map(([a,b])=>group('tree-branch',line(p[a],p[b],faint))).join('')+p.map(q=>dot(...q,4)).join('');for(let j=0;j<5;j++){const y=39+j*40;s+=dot(303,y,5);if(j<4)s+=arrow(m,[303,y+9],[303,y+28]);}return group('flattened-spine',s+path('M 172 88 Q 231 70 279 89',{'marker-end':`url(#${m})`})+path('M 170 154 Q 227 183 280 153',faint));}
 if(id===222)return tree(id,m)+group('complete-subtree-block',box(58,85,146,112,dashed)+box(224,85,118,112,faint)+path('M 55 211 H 204 M 226 211 H 345',accent));
 if(id===63){const rows=4,cols=5,step=45,x=106,y=48,blocked=(r,c)=>r===1&&c===2;let s='';for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const a=[x+c*step,y+r*step];if(blocked(r,c)){s+=group('obstacle',box(a[0]-10,a[1]-10,20,20,{fill:'currentColor',opacity:.14})+path(`M ${a[0]-6} ${a[1]-6} L ${a[0]+6} ${a[1]+6} M ${a[0]+6} ${a[1]-6} L ${a[0]-6} ${a[1]+6}`,accent));continue;}s+=dot(...a,3);if(c<cols-1&&!blocked(r,c+1))s+=arrow(m,[a[0]+7,a[1]],[a[0]+step-7,a[1]],{opacity:.5});if(r<rows-1&&!blocked(r+1,c))s+=arrow(m,[a[0],a[1]+7],[a[0],a[1]+step-7],{opacity:.5});}return group('obstacle-paths',s);}
 if(id===392){let s='';for(let j=0;j<5;j++){const x=70+j*65;s+=dot(x,78,4.5)+line([x,88],[55+j*72,146],{opacity:.4,...dashed});}for(let j=0;j<9;j++)s+=dot(55+j*36,157,3.5,{opacity:.6});return group('codirectional-subsequence',s+arrow(m,[58,43],[342,43],accent)+arrow(m,[55,196],[343,196],accent));}
 if(id===205||id===290){const n=id===205?3:4,left=112,right=288;let s='';for(let j=0;j<n;j++){const y=49+j*142/(n-1),target=id===205?49+((j+1)%n)*71:y;s+=group('bijection-pair',dot(left,y,7)+line([left+12,y],[right-16,target],{'marker-start':`url(#${m})`,'marker-end':`url(#${m})`,opacity:.6})+(id===205?box(right-8,target-8,16,16,{fill:'white'}):path(`M ${right-18} ${target-5} H ${right+24} M ${right-18} ${target+5} H ${right+11}`)));}return group(id===205?'character-bijection':'pattern-word-bijection',s);}
 if(id===36){const size=21,x=105.5,y=25.5,w=size*9;let s=box(x,y+size*4,w,size,{fill:'currentColor',stroke:'none',opacity:.07})+box(x+size,y,size,w,{fill:'currentColor',stroke:'none',opacity:.07});for(let j=0;j<=9;j++){const o=j%3===0?{'stroke-width':1.9,opacity:.75}:{opacity:.35};s+=line([x,y+j*size],[x+w,y+j*size],o)+line([x+j*size,y],[x+j*size,y+w],o);}s+=box(x+size*3,y+size*3,size*3,size*3,{'stroke-width':2.3,opacity:.8});return group('sudoku-nine-grid',s);}
 if(id===236){const p=[[200,42],[119,105],[281,105],[78.5,168],[159.5,168],[240.5,168],[321.5,168]];let s=[[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]].map(([a,b])=>group('tree-branch',line(p[a],p[b],{opacity:.5}))).join('')+p.map(q=>dot(...q,5)).join('');s+=dot(...p[3],13,dashed)+dot(...p[6],13,dashed)+dot(...p[0],12,accent)+poly([[66,152],[102,99],[182,46]],{'marker-end':`url(#${m})`,...accent})+poly([[334,152],[298,99],[218,46]],{'marker-end':`url(#${m})`,...accent});return group('ancestor-convergence',s);}
 if(id===433){let s=path('M 149 30 C 91 76,209 122,149 168 S 149 211,149 216 M 251 30 C 309 76,191 122,251 168 S 251 211,251 216');for(let j=0;j<7;j++){const y=38+j*26,offset=Math.sin(j*Math.PI/3)*21;s+=line([149+offset,y],[251-offset,y],j===3?accent:{opacity:.4});}s+=path('M 193 101 L 207 115 M 207 101 L 193 115',faint)+arrow(m,[284,116],[331,116])+dot(341,116,5);return group('gene-site-replacement',s);}
 if(id===127){let s='';const points=[[68,178],[151,134],[234,90],[317,46]];for(let j=0;j<4;j++){const [x,y]=points[j];s+=line([x-16,y],[x+16,y],accent)+line([x-16,y+31],[x+16,y+31],faint);if(j<3)s+=path(`M ${x+20} ${y-3} L ${points[j+1][0]-20} ${points[j+1][1]+3}`,{'marker-end':`url(#${m})`,opacity:.7})+line([x+20,y+31],[points[j+1][0]-20,points[j+1][1]+31],faint);}return group('word-ladder',s+path('M 49 193 H 109 V 149 H 192 V 105 H 275 V 61 H 347',dashed));}
 if(id===210){const p=[[58,73],[58,166],[151,49],[151,136],[254,105],[340,156]],links=[[0,2],[0,3],[1,3],[2,4],[3,4],[4,5]];return group('topological-dag',links.map(([a,b])=>group('graph-link',arrow(m,p[a],p[b],{opacity:.65}))).join('')+p.map(q=>dot(...q,6)).join('')+line([43,205],[355,205],dashed));}
 if(id===66){let s='';for(let j=0;j<4;j++){const x=82+j*77;s+=dot(x,145,6);if(j>0)s+=path(`M ${x} 128 Q ${x-38} ${54+j*8} ${x-77} 128`,{'marker-end':`url(#${m})`,opacity:.7});}return group('carry-left',s);}
 if(id===136){let s='';for(const y of [74,164])s+=dot(68,y,6)+dot(104,y,6)+line([75,y-4],[164,y-4],faint)+line([111,y+4],[164,y+4],faint)+path(`M 162 ${y-8} L 178 ${y+8} M 178 ${y-8} L 162 ${y+8}`,accent);return group('pair-cancellation',s+dot(293,119,10,accent)+path('M 214 61 V 177',dashed));}
 if(id===137){let s='';for(const y of [53,117,181])s+=dot(75,y,6)+path(`M 85 ${y} Q 165 ${y} 211 117`,{opacity:.65});return group('triple-cancellation',s+dot(220,117,14,dashed)+path('M 210 107 L 230 127 M 230 107 L 210 127',faint)+dot(318,117,9,accent));}
 if(id===153)return group('rotated-minimum',poly([[55,104],[101,78],[147,52],[188,30],[214,181],[259,153],[304,125],[349,97]])+dot(214,181,9,accent)+arrow(m,[214,218],[214,197])+path('M 187 27 L 214 180',dashed));
 if(has([117,199,637,102],id)){
  const spread=66+id%17,top=40+id%5,dy=59+id%9,p=[[200,top],[200-spread,top+dy],[200+spread,top+dy],[200-spread*1.5,top+dy*2],[200-spread*.5,top+dy*2],[200+spread*.5,top+dy*2],[200+spread*1.5,top+dy*2]];let extra='',role='level-detail';
  if(id===117){role='level-successors';for(const [a,b]of [[1,2],[3,4],[4,5],[5,6]])extra+=path(`M ${p[a][0]+5} ${p[a][1]-14} Q ${(p[a][0]+p[b][0])/2} ${p[a][1]-33} ${p[b][0]-5} ${p[b][1]-14}`,{'marker-end':`url(#${m})`});}
  if(id===199){role='right-contour';extra=poly([p[0],p[2],p[6]],accent)+[0,2,6].map(j=>line([p[j][0]+12,p[j][1]],[355,p[j][1]],dashed)).join('')+path('M 363 32 V 190',faint);}
  if(id===637){role='level-aggregation';for(const [level,nodes]of [[0,[0]],[1,[1,2]],[2,[3,4,5,6]]]){const y=top+level*dy;extra+=nodes.map(j=>path(`M ${p[j][0]+8} ${y+8} Q 345 ${y+33} 360 ${y}`,{opacity:.55})).join('')+dot(360,y,6);}}
  if(id===102){role='breadth-flow';for(const [a,b]of [[1,2],[3,4],[4,5],[5,6]])extra+=arrow(m,[p[a][0]+7,p[a][1]+19],[p[b][0]-8,p[b][1]+19]);extra+=path(`M ${p[2][0]+14} ${p[2][1]+21} Q 359 148 ${p[3][0]-15} ${p[3][1]+17}`,{...dashed,opacity:.45});}
  return tree(id,m)+group(role,extra);
 }
 if(id===23){let s='';for(const y of [57,120,183]){s+=dot(58,y,5)+dot(100,y,5)+line([65,y],[93,y])+path(`M 107 ${y} C 165 ${y},164 120,215 120`,{'marker-end':`url(#${m})`});}for(let j=0;j<4;j++)s+=dot(237+j*34,120,5)+(j?line([210+j*34,120],[230+j*34,120],faint):'');return group('multiway-merge',s);}
 if(has([104,530,105,106,112,129,230,173],id)){
  const spread=66+id%17,top=40+id%5,dy=59+id%9,p=[[200,top],[200-spread,top+dy],[200+spread,top+dy],[200-spread*1.5,top+dy*2],[200-spread*.5,top+dy*2],[200+spread*.5,top+dy*2],[200+spread*1.5,top+dy*2]];let extra='',role='tree-detail';
  if(id===104){role='depth-spine';extra=path(`M 49 ${top} H 59 M 49 ${top} V ${top+dy*2} H 59`,accent)+[0,1,2].map(j=>line([43,top+j*dy],[64,top+j*dy],faint)).join('');}
  if(id===530){role='inorder-neighbours';const order=[3,1,4,0,5,2,6];extra=order.slice(1).map((b,j)=>{const a=order[j];return path(`M ${p[a][0]} ${p[a][1]+11} Q ${(p[a][0]+p[b][0])/2} ${Math.max(p[a][1],p[b][1])+28} ${p[b][0]} ${p[b][1]+11}`,{...dashed,'marker-end':`url(#${m})`});}).join('')+line([p[3][0],215],[p[4][0],215],accent);}
  if(id===105||id===106){role=id===105?'preorder-construction':'postorder-construction';const side=id===105?1:2;extra=poly([p[0],p[side],p[side===1?3:6]],accent)+arrow(m,[id===105?75:325,19],[id===105?156:244,19])+path(`M ${p[side][0]-12} ${p[side][1]-24} L ${p[side][0]} ${p[side][1]-38} L ${p[side][0]+12} ${p[side][1]-24}`,dashed);}
  if(id===112){role='target-leaf';extra=dot(...p[3],18,{...dashed,opacity:.65})+dot(...p[3],11,accent)+line([p[3][0],p[3][1]+22],[p[3][0],219],faint);}
  if(id===129){role='leaf-contributions';extra=[3,4,5,6].map(j=>path(`M ${p[j][0]} ${p[j][1]+10} Q ${p[j][0]} 219 200 219`,{opacity:.55,'marker-end':`url(#${m})`})).join('')+dot(200,219,6);}
  if(id===230){role='rank-selection';extra=dot(...p[1],15,accent)+path(`M ${p[1][0]-23} ${p[1][1]} H ${p[1][0]-17} M ${p[1][0]+17} ${p[1][1]} H ${p[1][0]+23} M ${p[1][0]} ${p[1][1]-23} V ${p[1][1]-17}`,accent)+path(`M ${p[3][0]} 212 H ${p[6][0]}`,dashed);}
  if(id===173){role='iterator-spine';extra=[0,1,2].map(j=>line([326,98+j*28],[355,98+j*28])).join('')+path(`M ${p[3][0]} ${p[3][1]+10} Q 155 225 342 190`,{'marker-end':`url(#${m})`,...dashed});}
  return tree(id,m)+group(role,extra);
 }
 if(id===17){let s='';for(let r=0;r<3;r++)for(let c=0;c<3;c++)s+=dot(71+c*36,68+r*48,4);s+=dot(107,116,14,accent);for(const y of [56,116,176]){s+=path(`M 126 116 Q 212 116 265 ${y}`)+dot(268,y,5);for(let j=0;j<3;j++)s+=line([275,y],[323,y+(j-1)*16],faint)+dot(326,y+(j-1)*16,3);}return group('keypad-branching',s);}
 if(id===46){let s='';const order=[3,0,2,1];for(let j=0;j<4;j++){const y=56+j*43,target=56+order[j]*43;s+=dot(66,y,5)+dot(334,target,5)+path(`M 75 ${y} C 153 ${y},247 ${target},325 ${target}`,{opacity:.5});}return group('permutation-weave',s+line([200,31],[200,215],faint));}
 if(id===34){let s=line([55,41],[345,41],faint);for(const cx of [115,285]){s+=line([200,48],[cx,84],faint);for(let j=0;j<3;j++){const y=89+j*42,half=52/2**j;s+=line([cx-half,y],[cx+half,y])+line([cx-half,y+6],[cx-half/2,y+35],faint)+line([cx+half,y+6],[cx+half/2,y+35],faint);}}return group('dual-boundaries',s+path('M 115 188 V 205 H 285 V 188',accent));}
 if(id===162)return group('peak-search',poly([[49,183],[91,137],[135,156],[202,48],[248,121],[292,102],[350,171]])+arrow(m,[86,201],[190,76],faint)+arrow(m,[315,201],[214,76],faint)+dot(202,48,7,accent));
 if(id===69)return group('square-root',line([64,194],[348,194],faint)+line([64,194],[64,32],faint)+box(111,75,119,119)+line([111,75],[230,194],dashed)+path('M 111 193 A 178 178 0 0 1 289 15',faint)+line([111,210],[230,210],accent)+line([111,204],[111,216])+line([230,204],[230,216]));
 if(id===70){let s='';for(let j=0;j<5;j++){const x=67+j*52,y=190-j*30;s+=path(`M ${x} ${y} H ${x+52} V ${y-30}`);if(j<4)s+=path(`M ${x+26} ${y-10} Q ${x+52} ${y-65} ${x+78} ${y-40}`,{'marker-end':`url(#${m})`,opacity:.5});if(j<3)s+=path(`M ${x+26} ${y-16} Q ${x+78} ${y-128} ${x+130} ${y-76}`,{...dashed,opacity:.35});}return group('step-recurrence',s);}
 if(id===322){let s='';for(let j=0;j<3;j++){const y=62+j*59,r=8+j*4;s+=dot(82,y,r)+el('ellipse',{cx:82,cy:y+4,rx:r,ry:r*.7,opacity:.3})+path(`M ${95+j*4} ${y} Q 172 ${y} 222 153`,{opacity:.5,'marker-end':`url(#${m})`});}for(let j=0;j<4;j++)s+=dot(222+j*37,166,4)+(j?line([193+j*37,166],[215+j*37,166],faint):'');return group('coin-sources',s);}
 if(id===64){let s='';for(let r=0;r<4;r++)for(let c=0;c<5;c++){const x=106+c*47,y=48+r*47;if(c<4)s+=line([x,y],[x+47,y],faint);if(r<3)s+=line([x,y],[x,y+47],faint);s+=dot(x,y,2.5);}return group('minimum-route',s+poly([[106,48],[153,48],[153,95],[247,95],[247,189],[294,189]],accent));}
 if(id===97){let s='';for(let j=0;j<4;j++){const y=53+j*24;s+=line([53,y],[130,y],{opacity:.4})+path(`M 130 ${y} C 185 ${y},185 ${105+j*12},240 ${105+j*12}`,{opacity:.55});s+=line([53,153+j*18],[130,153+j*18],faint)+path(`M 130 ${153+j*18} C 185 ${153+j*18},185 ${111+j*12},240 ${111+j*12}`,{opacity:.4});}return group('interleave-streams',s+path('M 244 100 H 345 M 244 113 H 345 M 244 126 H 345 M 244 139 H 345 M 244 152 H 345',faint));}
 if(id===72){const p=[[100,59],[240,59],[100,180],[240,180]];return group('edit-dependencies',line(p[0],p[1],faint)+line(p[0],p[2],faint)+line(p[1],p[3],faint)+line(p[2],p[3],faint)+p.slice(0,3).map(a=>arrow(m,[a[0]+8,a[1]+5],[p[3][0]-10,p[3][1]-8],accent)).join('')+p.map((a,j)=>dot(...a,j===3?12:6)).join(''));}
 return null;
}
export function renderHeroArt(lesson={}){
 const n=Number(lesson.id)||0,kind=kindOf(lesson),safe=String(lesson.id??'example').replace(/[^a-zA-Z0-9_-]/g,''),m=`hero-arrow-${safe}`;
 let draw=kind==='stock'?stock(n,m):kind==='merge'?merge(n,m):kind==='compact'?compact(n,m):kind==='array'?array(n,m):['linked','reverse-groups','reverse-range'].includes(kind)?linked(n,m,kind):kind==='tree'?tree(n,m):kind==='heap'?heap(n,m):kind==='graph'?graph(n,m):kind==='matrix'||kind==='quadtree'?matrix(n,m,kind==='quadtree'):kind==='trie'?trie(n,m):kind==='stack'||kind==='min-stack'?stack(n,m,kind==='min-stack'):kind==='intervals'?intervals(n,m):kind==='binary-search'?search(n,m):kind==='window'?windowArt(n,m):kind==='two-pointers'?pointers(n,m):kind==='bars'?bars(n,m):kind==='hash'?hash(n,m):kind==='backtrack'?backtrack(n,m):kind==='bits'?bits(n,m):kind==='dp'?dp(n,m):kind==='prefix'?prefix(n,m):kind==='text'?textArt(n,m):kind==='math'?mathArt(n,m):greedy(n,m);
 const specific=specificArt(n,m);if(specific)draw=group('state-flow',specific);
 return `<svg viewBox="0 0 400 240" fill="none" role="img" aria-label="${esc(lesson.title??'算法意象')}" data-art-kind="${kind}" data-problem="${esc(lesson.id??'')}"><title>${esc(lesson.title??'算法意象')}</title><defs><marker id="${m}" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1 L6 4 L1 7" fill="none" stroke="currentColor" stroke-width="1"/></marker></defs><g stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity=".85">${draw}</g></svg>`;
}
