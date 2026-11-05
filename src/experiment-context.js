import {escapeHtml as esc} from './scenes.js';
import {readable} from './presentation.js';

function call(name,args){
 const shown=name==='getRandom'?[]:args;
 return `${name}(${shown.map(v=>readable(v)).join(', ')})`;
}

export function renderExperimentContext(input,result,scene){
 const operations=input?.operations||input?.ops;
 const operation=scene.operation;
 const parameters=Object.fromEntries(Object.entries(input||{}).filter(([name])=>name!=='operations'&&name!=='ops'));
 const inputHtml=Array.isArray(operations)?`${Object.keys(parameters).length?`<pre class="operation-parameters">${esc(readable(parameters))}</pre>`:''}<div class="operation-script">${operations.map((command,index)=>{const [name,...args]=Array.isArray(command)?command:[command];return `<span class="operation-call${index===operation?.index?' current-operation':''}"><small>${index}</small><code>${esc(call(name,args))}</code>${name==='getRandom'&&args.length?`<small>回放票据 ${esc(readable(args))}</small>`:''}</span>`;}).join('')}</div>`:`<pre>${esc(readable(input))}</pre>`;
 let current='';
 if(operation){
  const status=operation.complete===false?'执行中':operation.returns?`返回 <b>${esc(readable(operation.value))}</b>`:'已执行 · 无查询返回值（null 占位）';
  current=`<div class="operation-now"><span>当前操作 [${operation.index}]</span><code>${esc(call(operation.name,operation.args||[]))}</code><span>${status}</span></div>`;
 }
 return `<div class="experiment-context"><div class="experiment-input"><span class="context-label">本次输入</span>${inputHtml}</div><div class="experiment-output"><span class="context-label">本次输出 <small>完整运行结果</small></span><pre>${esc(readable(result))}</pre>${Array.isArray(operations)?'<p>结果按输入操作顺序排列；null 为构造或无查询值操作的占位。</p>':''}</div>${current}</div>`;
}
