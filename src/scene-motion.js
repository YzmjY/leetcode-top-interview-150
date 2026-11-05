// Geometry is shared by the static renderer and every animation frame.
export function edgeGeometry(a,b,{kind,directed=false,label='',self}={}) {
 const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;
 const x1=a.x+dx/d*23,y1=a.y+dy/d*23,x2=b.x-dx/d*(directed?28:23),y2=b.y-dy/d*(directed?28:23);
 const loop=self??(dx===0&&dy===0),auxiliary=/^(random|prev)$/i.test(label);
 const backward=kind==='linked'&&(dx!==0||dy!==0)&&(b.x<=a.x||auxiliary);
 const crossRow=kind==='linked'&&Math.abs(dy)>1;
 const bend=Math.min(a.y,b.y)-54;
 const rail=Math.max(7,Math.min(a.x,b.x)-42);
 const path=loop?`M ${a.x-15} ${a.y-18} C ${a.x-45} ${a.y-80},${a.x+45} ${a.y-80},${a.x+15} ${a.y-18}`:crossRow?`M ${a.x-23} ${a.y} C ${rail} ${a.y},${rail} ${b.y},${b.x-(directed?28:23)} ${b.y}`:backward?`M ${x1} ${y1-8} C ${x1} ${bend},${x2} ${bend},${x2} ${y2-8}`:`M ${x1} ${y1} L ${x2} ${y2}`;
 return {path,backward,labelX:crossRow?rail:(a.x+b.x)/2,labelY:crossRow?(a.y+b.y)/2:backward?bend+8:(a.y+b.y)/2-7};
}

export function interpolatePositions(from,to,t,bounds={}) {
 const all=[...from.values(),...to.values()];
 const right=bounds.width?bounds.width-28:Math.max(56,...all.map(p=>p.x+28));
 const bottom=bounds.height?bounds.height-28:Math.max(56,...all.map(p=>p.y+28));
 return new Map([...to].map(([id,end])=>{
  const start=from.get(id)||end;
  if(t>=1)return [id,{...end}];
  if(t<=0)return [id,{...start}];
  const dx=end.x-start.x,dy=end.y-start.y,d=Math.hypot(dx,dy)||1;
  const arc=Math.sin(Math.PI*t)*Math.min(56,d*.32);
  return [id,{x:Math.max(28,Math.min(right,start.x+dx*t+dy/d*arc)),y:Math.max(28,Math.min(bottom,start.y+dy*t-dx/d*arc))}];
 }));
}
