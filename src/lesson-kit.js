export const clone = (value) => structuredClone(value);
export function invariant(condition, message) { if(!condition) throw new Error(message); }
export function array(value, name='数组', max=80) { invariant(Array.isArray(value),`${name}必须是数组。`); invariant(value.length<=max,`${name}演示最多支持 ${max} 项。`); return value; }
export function numbers(value,name='数组',max=80) { array(value,name,max); invariant(value.every(x=>Number.isFinite(x)&&Number.isInteger(x)&&Math.abs(x)<=1e9),`${name}必须包含 -10⁹ 到 10⁹ 的整数。`); return value; }
export function integer(value,min=0,max=100,name='参数') { invariant(Number.isInteger(value)&&value>=min&&value<=max,`${name}须为 ${min} 到 ${max} 的整数。`);return value; }
export function text(value,name='字符串',max=160) { invariant(typeof value==='string'&&value.length<=max,`${name}须为不超过 ${max} 个字符的字符串。`);return value; }
export function matrix(value,name='矩阵',max=15) { array(value,name,max); const width=value[0]?.length??0; invariant(value.every(row=>Array.isArray(row)&&row.length===width&&row.length<=max),`${name}须为规则矩阵，行列最多 ${max}。`);return value; }
export function sorted(value,name='数组') { numbers(value,name);invariant(value.every((v,i)=>!i||value[i-1]<=v),`${name}必须非递减排序。`);return value; }
export function treeFromLevel(values) {
  array(values,'树的层序数组',63);if(!values.length||values[0]===null)return null;
  const root={id:'0',val:values[0],left:null,right:null},queue=[root];let at=1;
  for(let q=0;q<queue.length&&at<values.length;q++)for(const side of ['left','right']){if(at>=values.length)break;const i=at++,v=values[i];if(v!==null){const node={id:String(i),val:v,left:null,right:null};queue[q][side]=node;queue.push(node);}}
  invariant(values.slice(at).every(v=>v===null),'层序数组包含没有父节点的非空节点。');return root;
}
export function treeToLevel(root) {if(!root)return [];const queue=[root],out=[];for(let i=0;i<queue.length;i++){const n=queue[i];out.push(n?n.val:null);if(n)queue.push(n.left,n.right);}while(out.at(-1)===null)out.pop();return out;}
export function treeView(root, options={}) {
  const nodes=[],edges=[],seen=new Set();function visit(node){if(!node||seen.has(node))return;seen.add(node);const id=String(node.id);nodes.push({id,label:String(node.val)});for(const side of ['left','right'])if(node[side]){edges.push({from:id,to:String(node[side].id),label:side==='left'?'L':'R'});visit(node[side]);}}visit(root);return {kind:'tree',nodes,edges,...options};
}
export function listView(values,options={}) {return {kind:'linked',nodes:values.map((v,i)=>({id:String(i),label:String(v)})),edges:values.slice(1).map((_,i)=>({from:String(i),to:String(i+1),directed:true})),...options};}
export function graphView(adj,options={}) {return {kind:'graph',nodes:adj.map((_,i)=>({id:String(i),label:String(i+1)})),edges:adj.flatMap((next,i)=>next.filter(j=>options.directed||i<j-1).map(j=>({from:String(i),to:String(j-1),directed:!!options.directed}))),...options};}

export function traceLesson(lesson,input) {
  const code=Array.isArray(lesson.code)?lesson.code:lesson.code.split('\n');
  const frames=[];const original=clone(input);
  const emit=(scene,title='观察当前状态',description='',lines=[1],vars={},anchor=null)=>{
    invariant(frames.length<1600,'演示步骤过多，请减小输入规模。');
    invariant(Array.isArray(lines)&&lines.length>0&&lines.every(n=>Number.isInteger(n)&&n>=1&&n<=code.length),`题目 ${lesson.id} 的代码高亮行号越界：${JSON.stringify(lines)}，代码共 ${code.length} 行。`);
    frames.push(clone({scene,title,description,lines,vars,anchor,result:null,phase:'step'}));
  };
  lesson.validate?.(original);
  const result=lesson.solve(original,emit);
  invariant(result!==undefined,'算法未产生结果。');
  function finite(value){if(typeof value==='number')invariant(Number.isFinite(value),'输入导致计算结果超出可表示的有限范围，请减小数值。');else if(value&&typeof value==='object')Object.values(value).forEach(finite);}finite(result);
  if(!frames.length)emit({kind:'state',items:Object.entries(original)},'初始化','读取输入并开始求解。');
  const last=frames.at(-1);
  frames.push(clone({...last,title:'计算完成',description:lesson.resultNote||'所有步骤执行完毕。下方展示本次输入的实际计算结果。',phase:'done',result,lines:[code.length]}));
  return {frames,result};
}
