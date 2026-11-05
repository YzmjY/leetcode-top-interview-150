import {renderScene} from './scenes.js';
import {edgeGeometry,interpolatePositions} from './scene-motion.js';

const states=new WeakMap();

// Keep node elements keyed by entity id. Reordering a list moves the existing
// node; neither its value nor its identity is replaced by a different node.
export function updateScene(container,scene,{key,duration=420}={}) {
 const previous=states.get(container);
 if(previous?.request)cancelAnimationFrame(previous.request);
 const oldNodes=new Map([...container.querySelectorAll('[data-node]')].map(el=>[el.dataset.node,el]));
 const oldScroll=container.querySelector('.node-scroll');
 const scroll=previous?.key===key&&oldScroll?{left:oldScroll.scrollLeft,top:oldScroll.scrollTop}:null;
 const template=container.ownerDocument.createElement('template');
 template.innerHTML=renderScene(scene);
 const targets=new Map();
 for(const fresh of template.content.querySelectorAll('[data-node]')){
  const id=fresh.dataset.node;
  targets.set(id,{x:Number(fresh.dataset.x),y:Number(fresh.dataset.y)});
  const old=previous?.key===key&&previous.kind===scene.kind?oldNodes.get(id):null;
  if(old){
   for(const attr of [...old.attributes])old.removeAttribute(attr.name);
   for(const attr of fresh.attributes)old.setAttribute(attr.name,attr.value);
   old.innerHTML=fresh.innerHTML;
   fresh.replaceWith(old);
  }
 }
 container.replaceChildren(template.content);
 container.dataset.kind=scene.kind;
 const viewport=container.querySelector('.node-scroll');
 if(viewport&&scroll){viewport.scrollLeft=scroll.left;viewport.scrollTop=scroll.top;}
 const svg=container.querySelector('.node-scene');
 const targetSize={width:Number(svg?.getAttribute('width')||0),height:Number(svg?.getAttribute('height')||0)};
 const state={key,kind:scene.kind,positions:targets,...targetSize,request:null};states.set(container,state);
 const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const from=previous?.key===key&&previous.kind===scene.kind?previous.positions:new Map();
 const moved=[...targets].some(([id,end])=>{const start=from.get(id);return start&&(start.x!==end.x||start.y!==end.y);});
 if(!moved||reduced||duration<=0)return;
 const bounds={width:Math.max(targetSize.width,previous.width||0),height:Math.max(targetSize.height,previous.height||0)};
 function resize(size){svg.setAttribute('width',size.width);svg.setAttribute('height',size.height);svg.setAttribute('viewBox',`0 0 ${size.width} ${size.height}`);state.width=size.width;state.height=size.height;}
 resize(bounds);
 if(viewport&&scroll){viewport.scrollLeft=scroll.left;viewport.scrollTop=scroll.top;}
 const groups=[...container.querySelectorAll('[data-node]')];
 const edges=[...container.querySelectorAll('[data-edge-from]')];
 let start;
 function paint(t){
  const positions=interpolatePositions(from,targets,t,bounds);
  state.positions=positions;
  for(const group of groups){
   const target=targets.get(group.dataset.node),p=positions.get(group.dataset.node);
   group.setAttribute('transform',`translate(${p.x-target.x} ${p.y-target.y})`);
  }
  for(const edge of edges){
   const a=positions.get(edge.dataset.edgeFrom),b=positions.get(edge.dataset.edgeTo);
   if(!a||!b)continue;
   const g=edgeGeometry(a,b,{kind:scene.kind,directed:edge.dataset.directed==='true',label:edge.dataset.label,self:edge.dataset.edgeFrom===edge.dataset.edgeTo});
   edge.querySelector('path').setAttribute('d',g.path);
   const label=edge.querySelector('text');label.setAttribute('x',g.labelX);label.setAttribute('y',g.labelY);
  }
 }
 paint(0);
 function tick(now){
  start??=now;
  const t=Math.min(1,(now-start)/duration);
  paint(1-(1-t)**3);
  if(t<1)state.request=requestAnimationFrame(tick);
  else{state.request=null;for(const group of groups)group.removeAttribute('transform');resize(targetSize);}
 }
 state.request=requestAnimationFrame(tick);
}
