function dimensions(size={}){
 const width=Number(size?.width),height=Number(size?.height);
 return {
  width:Number.isFinite(width)&&width>0?width:46,
  height:Number.isFinite(height)&&height>0?height:46,
  rect:size?.shape==='rect'||size?.shape!=='ellipse'&&(size?.caption||size?.lines?.length>1),
 };
}

// Intersect a ray with the actual node outline. A directed edge stops another
// five pixels outside its target, leaving space for the arrow tip.
function boundary(centre,toward,size,margin=0){
 const dx=toward.x-centre.x,dy=toward.y-centre.y,d=Math.hypot(dx,dy);
 if(!d)return {...centre};
 const rx=size.width/2,ry=size.height/2;
 const scale=size.rect?Math.min(dx?rx/Math.abs(dx):Infinity,dy?ry/Math.abs(dy):Infinity):1/Math.hypot(dx/rx,dy/ry);
 return {x:centre.x+dx*scale+dx/d*margin,y:centre.y+dy*scale+dy/d*margin};
}

const point=p=>`${p.x} ${p.y}`;
const cubicMiddle=(a,c,d,b)=>({x:(a.x+3*c.x+3*d.x+b.x)/8,y:(a.y+3*c.y+3*d.y+b.y)/8});

// Geometry is shared by the static renderer and every animation frame.
export function edgeGeometry(a,b,{kind,directed=false,label='',self,fromSize,toSize,reciprocal=false}={}) {
 const from=dimensions(fromSize),to=dimensions(toSize),margin=directed?5:0;
 const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
 const loop=self??(dx===0&&dy===0),auxiliary=/^(random|prev)$/i.test(label);
 const backward=kind==='linked'&&(dx!==0||dy!==0)&&(b.x<=a.x||auxiliary);
 const crossRow=kind==='linked'&&Math.abs(dy)>1;
 if(loop){
  const top=Math.max(7,a.y-Math.max(from.height,to.height)/2-57);
  const c={x:a.x-from.width/2-22,y:top},e={x:a.x+to.width/2+22,y:top};
  const start=boundary(a,c,from),end=boundary(b,e,to,margin),middle=cubicMiddle(start,c,e,end);
  return {path:`M ${point(start)} C ${point(c)},${point(e)},${point(end)}`,backward,labelX:middle.x,labelY:middle.y-7};
 }
 if(kind==='graph'&&reciprocal&&d){
  const normal={x:-dy/d,y:dx/d},bend=Math.min(70,Math.max(36,d*.22));
  const control={x:(a.x+b.x)/2+normal.x*bend,y:(a.y+b.y)/2+normal.y*bend};
  const start=boundary(a,control,from),end=boundary(b,control,to,margin);
  const middle={x:(start.x+2*control.x+end.x)/4,y:(start.y+2*control.y+end.y)/4};
  return {path:`M ${point(start)} Q ${point(control)},${point(end)}`,backward,labelX:middle.x+normal.x*10,labelY:middle.y+normal.y*10};
 }
 if(crossRow){
  const rail=Math.max(7,Math.min(a.x-from.width/2,b.x-to.width/2)-19);
  const c={x:rail,y:a.y},e={x:rail,y:b.y};
  const start=boundary(a,c,from),end=boundary(b,e,to,margin);
  return {path:`M ${point(start)} C ${point(c)},${point(e)},${point(end)}`,backward,labelX:rail,labelY:(a.y+b.y)/2};
 }
 if(backward){
  const bend=Math.max(7,Math.min(a.y-from.height/2,b.y-to.height/2)-31);
  const c={x:a.x,y:bend},e={x:b.x,y:bend};
  const start=boundary(a,c,from),end=boundary(b,e,to,margin),middle=cubicMiddle(start,c,e,end);
  return {path:`M ${point(start)} C ${point(c)},${point(e)},${point(end)}`,backward,labelX:middle.x,labelY:middle.y-7};
 }
 const start=boundary(a,b,from),end=boundary(b,a,to,margin);
 return {path:`M ${point(start)} L ${point(end)}`,backward,labelX:(a.x+b.x)/2,labelY:(a.y+b.y)/2-7};
}

export function interpolatePositions(from,to,t,bounds={},nodeSizes=new Map()) {
 const all=[...from.values(),...to.values()];
 return new Map([...to].map(([id,end])=>{
  const start=from.get(id)||end,size=dimensions(nodeSizes.get(id));
  if(!nodeSizes.has(id)){
   if(t>=1)return [id,{...end}];
   if(t<=0)return [id,{...start}];
  }
  const insetX=size.width/2+5,insetY=size.height/2+5;
  const right=bounds.width?Math.max(insetX,bounds.width-insetX):Math.max(insetX*2,...all.map(p=>p.x+insetX));
  const bottom=bounds.height?Math.max(insetY,bounds.height-insetY):Math.max(insetY*2,...all.map(p=>p.y+insetY));
  const dx=end.x-start.x,dy=end.y-start.y,d=Math.hypot(dx,dy)||1;
  const progress=Math.max(0,Math.min(1,t)),arc=Math.sin(Math.PI*progress)*Math.min(56,d*.32);
  const p=t>=1?{...end}:t<=0?{...start}:{x:start.x+dx*progress+dy/d*arc,y:start.y+dy*progress-dx/d*arc};
  return [id,{...p,x:Math.max(insetX,Math.min(right,p.x)),y:Math.max(insetY,Math.min(bottom,p.y))}];
 }));
}
