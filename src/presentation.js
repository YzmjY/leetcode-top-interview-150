import {goDisplay} from './go-display.js';
export function readable(value,depth=0){
 if(value===null)return 'null';
 if(typeof value==='string')return JSON.stringify(value);
 if(typeof value==='number')return Number.isFinite(value)?String(value):value===Infinity?'∞':'−∞';
 if(typeof value!=='object')return String(value);
 if(Array.isArray(value)){
  if(!value.length)return '[]';
  if(value.every(v=>v===null||typeof v!=='object'))return `[${value.map(v=>readable(v,depth+1)).join(', ')}]`;
  const rows=value.map(v=>readable(v,depth+1));
  const one=`[${rows.join(', ')}]`;
  return one.length<=90&&!one.includes('\n')?one:`[\n${rows.map(v=>'  '+v.replaceAll('\n','\n  ')).join(',\n')}\n]`;
 }
 return Object.entries(value).map(([key,v])=>`${key} = ${readable(v,depth+1)}`).join('\n');
}
export const displayCode=(lesson)=>goDisplay[lesson.id]?.code??(Array.isArray(lesson.code)?lesson.code.join('\n'):lesson.code);
export function highlightLines(lesson,frame){
 const formatted=goDisplay[lesson.id],lines=displayCode(lesson).split('\n');
 if(frame.anchor){const needle=frame.anchor.replace(/\s/g,'');const found=lines.findIndex(line=>line.replace(/\s/g,'').includes(needle));if(found>=0)return [found+1];}
 const raw=Array.isArray(lesson.code)?lesson.code:lesson.code.split('\n');
 const mapped=frame.lines.flatMap(line=>{
  const group=formatted?.lineMap[line]||[Math.min(line,lines.length)];
  if(/^\s*(?:if|for|switch)\b/.test(raw[line-1]||'')&&group.length>1)return [group[0]];
  return group.filter(n=>!/^\s*}\s*$/.test(lines[n-1])) .length?group.filter(n=>!/^\s*}\s*$/.test(lines[n-1])):group;
 });
 return [...new Set(mapped)].sort((a,b)=>a-b);
}
