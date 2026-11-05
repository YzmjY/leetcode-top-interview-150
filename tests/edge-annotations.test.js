import test from 'node:test';
import assert from 'node:assert/strict';
import {edgeGeometry,interpolatePositions} from '../src/scene-motion.js';
import {updateScene} from '../src/scene-player.js';
import {nodeMetrics} from '../src/node-metrics.js';

const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,`${actual} 应接近 ${expected}`);
const endpoints=path=>{
  const values=path.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi).map(Number);
  return [{x:values[0],y:values[1]},{x:values.at(-2),y:values.at(-1)}];
};
function assertBoundary(point,centre,size,margin=0){
  const dx=point.x-centre.x,dy=point.y-centre.y,d=Math.hypot(dx,dy);
  const x=dx-dx/d*margin,y=dy-dy/d*margin;
  const rect=size.shape==='rect'||size.caption||size.lines?.length>1;
  close(rect?Math.max(Math.abs(x)/(size.width/2),Math.abs(y)/(size.height/2)):(x/(size.width/2))**2+(y/(size.height/2))**2,1);
}

test('默认46px圆节点保留原直线端点和5px箭头间隙',()=>{
  const a={x:52,y:104},b={x:136,y:104};
  assert.equal(edgeGeometry(a,b,{kind:'linked',directed:true}).path,'M 75 104 L 108 104');
  assert.equal(edgeGeometry(a,b,{kind:'tree'}).path,'M 75 104 L 113 104');
});

test('未传节点尺寸时，插值首尾保持调用方提供的原始坐标',()=>{
  const from=new Map([['a',{x:0,y:0}]]),to=new Map([['a',{x:10,y:10}]]);
  assert.deepEqual(interpolatePositions(from,to,0),from);
  assert.deepEqual(interpolatePositions(from,to,1),to);
});

test('长负数椭圆的水平及斜向连线止于真实边界',()=>{
  const fromSize=nodeMetrics({label:'-1000000000'}),toSize=nodeMetrics({label:'-2000000000'});
  for(const b of [{x:400,y:100},{x:400,y:240}]){
    const a={x:100,y:100},g=edgeGeometry(a,b,{kind:'tree',directed:true,fromSize,toSize});
    const [start,end]=endpoints(g.path);
    assertBoundary(start,a,fromSize);
    assertBoundary(end,b,toSize,5);
  }
});

test('tuple和caption连线按矩形而非椭圆边界裁剪',()=>{
  const a={x:150,y:100},b={x:450,y:180};
  const fromSize=nodeMetrics({labelLines:['sum=-2000000000','i=12 j=34']});
  const toSize=nodeMetrics({label:'较大一半的小顶堆',caption:true});
  const [start,end]=endpoints(edgeGeometry(a,b,{kind:'tree',directed:true,fromSize,toSize}).path);
  assertBoundary(start,a,fromSize);
  assertBoundary(end,b,toSize,5);
});

test('双向权重边走相反侧Q曲线，标签和真实节点边界分别保留',()=>{
  const a={x:150,y:120},b={x:450,y:120};
  const fromSize=nodeMetrics({label:'-1000000000'}),toSize=nodeMetrics({label:'2000000000'});
  const forward=edgeGeometry(a,b,{kind:'graph',directed:true,reciprocal:true,fromSize,toSize});
  const reverse=edgeGeometry(b,a,{kind:'graph',directed:true,reciprocal:true,fromSize:toSize,toSize:fromSize});
  assert.match(forward.path,/ Q /);assert.match(reverse.path,/ Q /);
  assert.ok(forward.labelY>120&&reverse.labelY<120);
  assert.ok(Math.hypot(forward.labelX-reverse.labelX,forward.labelY-reverse.labelY)>28);
  const [start,end]=endpoints(forward.path);
  assertBoundary(start,a,fromSize);assertBoundary(end,b,toSize,5);
  const vertical=edgeGeometry({x:150,y:100},{x:150,y:400},{kind:'graph',reciprocal:true});
  const verticalReverse=edgeGeometry({x:150,y:400},{x:150,y:100},{kind:'graph',reciprocal:true});
  assert.ok(vertical.labelX<150&&verticalReverse.labelX>150);
});

test('宽节点跨行、反向连接和自环均在真实形状边界出入',()=>{
  const a={x:200,y:120},size=nodeMetrics({labelLines:['sum=-2000000000','i=12 j=34']});
  for(const [b,label] of [[{x:200,y:320},'next'],[{x:420,y:120},'prev'],[a,'random']]){
    const g=edgeGeometry(a,b,{kind:'linked',directed:true,label,fromSize:size,toSize:size});
    assert.match(g.path,/ C /);assert.doesNotMatch(g.path,/NaN|Infinity/);
    const [start,end]=endpoints(g.path);
    assertBoundary(start,a,size);assertBoundary(end,b,size,5);
  }
});

test('宽节点沿弧线运动时按各自半宽半高留在画布内',()=>{
  const from=new Map([['wide',{x:135,y:300}],['small',{x:290,y:300}]]);
  const to=new Map([['wide',{x:135,y:70}],['small',{x:290,y:70}]]);
  const sizes=new Map([['wide',{width:260,height:100,shape:'rect'}],['small',{width:46,height:46,shape:'ellipse'}]]);
  for(const t of [0,.1,.25,.5,.75,.9,1]){
    const positions=interpolatePositions(from,to,t,{width:350,height:400},sizes);
    for(const [id,size] of sizes){
      const p=positions.get(id);
      assert.ok(p.x>=size.width/2+5&&p.x<=350-size.width/2-5);
      assert.ok(p.y>=size.height/2+5&&p.y<=400-size.height/2-5);
    }
  }
});

// A small DOM surface exercises animation forwarding without a browser or a
// dependency on a DOM library. The actual renderer supplies all attributes.
class Element{
  constructor(attrs={},owner=null){this.attrs=new Map(Object.entries(attrs));this.owner=owner;this.innerHTML='';}
  get attributes(){return [...this.attrs].map(([name,value])=>({name,value}));}
  get dataset(){return Object.fromEntries([...this.attrs].filter(([name])=>name.startsWith('data-')).map(([name,value])=>[name.slice(5).replace(/-([a-z])/g,(_,char)=>char.toUpperCase()),value]));}
  getAttribute(name){return this.attrs.get(name)??null;}
  setAttribute(name,value){this.attrs.set(name,String(value));}
  removeAttribute(name){this.attrs.delete(name);}
  replaceWith(node){const at=this.owner.nodes.indexOf(this);this.owner.nodes[at]=node;node.owner=this.owner;}
  querySelector(selector){return this.children?.[selector]??null;}
}
const attributes=html=>Object.fromEntries([...html.matchAll(/([\w-]+)="([^"]*)"/g)].map(([,name,value])=>[name,value]));
function fragment(html=''){
  const model={nodes:[],edges:[],svg:null,scroll:{scrollLeft:0,scrollTop:0}};
  model.nodes=[...html.matchAll(/<g (data-node="[^"]*"[^>]*)>/g)].map(([,attrs])=>new Element(attributes(attrs),model));
  model.edges=[...html.matchAll(/<g (data-edge-from="[^"]*"[^>]*)>([\s\S]*?)<\/g>/g)].map(([,attrs,body])=>{
    const element=new Element(attributes(attrs),model);
    element.children={path:new Element(attributes(body.match(/<path ([^>]*)>/)?.[1]??'')),text:new Element(attributes(body.match(/<text ([^>]*)>/)?.[1]??''))};
    return element;
  });
  const svgAttrs=html.match(/<svg ([^>]*)>/)?.[1];if(svgAttrs)model.svg=new Element(attributes(svgAttrs));
  model.querySelectorAll=selector=>selector==='[data-node]'?model.nodes:selector==='[data-edge-from]'?model.edges:[];
  model.querySelector=selector=>selector==='.node-scene'?model.svg:selector==='.node-scroll'?model.scroll:null;
  return model;
}
function container(){
  return {
    current:fragment(),dataset:{},
    ownerDocument:{createElement(){return {content:fragment(),set innerHTML(html){this.content=fragment(html);}};}},
    querySelectorAll(selector){return this.current.querySelectorAll(selector);},
    querySelector(selector){return this.current.querySelector(selector);},
    replaceChildren(content){this.current=content;},
  };
}

test('动画帧沿用节点尺寸、矩形shape和双向标记更新边和标签',()=>{
  const originalRequest=globalThis.requestAnimationFrame,originalCancel=globalThis.cancelAnimationFrame;
  const requests=[];
  globalThis.requestAnimationFrame=callback=>{requests.push(callback);return requests.length;};
  globalThis.cancelAnimationFrame=()=>{};
  try{
    const stage=container(),a={id:'a',labelLines:['sum=-2000000000','i=12 j=34']},b={id:'b',label:'-1000000000'};
    const edges=[{from:'a',to:'b',label:'2',directed:true},{from:'b',to:'a',label:'0.5',directed:true}];
    updateScene(stage,{kind:'graph',nodes:[a,b],edges},{key:'weights'});
    updateScene(stage,{kind:'graph',nodes:[b,a],edges},{key:'weights'});
    requests.shift()(0);requests.shift()(210);
    const group=id=>stage.current.nodes.find(node=>node.dataset.node===id);
    const position=node=>{
      const shift=(node.getAttribute('transform')??'translate(0 0)').match(/translate\(([^ ]+) ([^)]+)\)/);
      return {x:Number(node.dataset.x)+Number(shift[1]),y:Number(node.dataset.y)+Number(shift[2])};
    };
    const size=node=>({width:Number(node.dataset.width),height:Number(node.dataset.height),shape:node.dataset.shape});
    const expected=edgeGeometry(position(group('a')),position(group('b')),{kind:'graph',directed:true,reciprocal:true,fromSize:size(group('a')),toSize:size(group('b'))});
    const actual=stage.current.edges[0];
    assert.equal(actual.children.path.getAttribute('d'),expected.path);
    close(Number(actual.children.text.getAttribute('x')),expected.labelX);
    close(Number(actual.children.text.getAttribute('y')),expected.labelY);
    assert.match(actual.children.path.getAttribute('d'),/ Q /);
  }finally{
    if(originalRequest===undefined)delete globalThis.requestAnimationFrame;else globalThis.requestAnimationFrame=originalRequest;
    if(originalCancel===undefined)delete globalThis.cancelAnimationFrame;else globalThis.cancelAnimationFrame=originalCancel;
  }
});
