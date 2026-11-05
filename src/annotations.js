const cache=new WeakMap();
function letters(index){let out='';for(let n=index+1;n;n=Math.floor((n-1)/26))out=String.fromCharCode(65+(n-1)%26)+out;return out;}

// Names are assigned once per run, in creation order, independently of the
// current layout, value, linked-list order, or which nodes are still visible.
export function createNodeLabels(frames){
 const labels=new Map();let data=0,sentinels=0;
 for(const {scene} of frames)for(const node of scene?.nodes||[]){
  const id=String(node.id);if(labels.has(id)||node.caption)continue;
  labels.set(id,node.sentinel?'S'+(++sentinels):letters(data++));
 }
 return labels;
}

export function labelsForTrace(trace){
 if(!cache.has(trace))cache.set(trace,createNodeLabels(trace.frames));
 return cache.get(trace);
}
