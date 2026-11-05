import test from 'node:test';
import assert from 'node:assert/strict';
import {renderExperimentContext} from '../src/experiment-context.js';

test('实验台直接显示本次实际输入和完整输出',()=>{
 const html=renderExperimentContext({head:[1,2,3],k:2},[2,1,3],{});
 assert.match(html,/本次输入/);assert.match(html,/k = 2/);assert.match(html,/本次输出/);assert.match(html,/\[2, 1, 3\]/);
});

test('操作调用、执行状态和零或false返回不丢失',()=>{
 for(const value of [0,false]){
  const html=renderExperimentContext({operations:[['MinStack'],['top']]},[null,value],{operation:{index:1,name:'top',args:[],returns:true,complete:true,value}});
  assert.match(html,/top\(\)/);assert.match(html,/当前操作/);assert.match(html,/>返回/);assert.match(html,new RegExp('>'+value+'<'));
 }
});

test('void占位和执行中的查询不冒充已产生返回值',()=>{
 const base={ops:[['MinStack'],['push',2],['getMin']]};
 const empty=renderExperimentContext(base,[null,null,2],{operation:{index:1,name:'push',args:[2],returns:false,complete:true,value:null}});
 assert.match(empty,/无查询返回值/);assert.match(empty,/null/);
 const pending=renderExperimentContext(base,[null,null,2],{operation:{index:2,name:'getMin',args:[],returns:true,complete:false}});
 assert.match(pending,/执行中/);assert.doesNotMatch(pending,/当前操作[^]*>返回/);
});

test('字符串形式的迭代器操作与结构参数都保留',()=>{
 const html=renderExperimentContext({root:[7,3,15],ops:['next','hasNext']},[3,true],{});
 assert.match(html,/root = \[7, 3, 15\]/);assert.match(html,/next\(\)/);assert.match(html,/hasNext\(\)/);assert.doesNotMatch(html,/n\(&quot;e/);
 const cache=renderExperimentContext({capacity:2,ops:[['put',1,1]]},[null],{});
 assert.match(cache,/capacity = 2/);
});
