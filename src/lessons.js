import {catalog} from './catalog-data.js';
import {lessonsA} from './lessons-a.js';
import {lessonsB} from './lessons-b.js';
import {lessonsC} from './lessons-c.js';
import {buildMergeTrace,GO_CODE} from './merge.js';
import {numbers} from './lesson-kit.js';

const mergeLesson={
 id:88,
 summary:'给你两个按非递减顺序排列的整数数组 nums1 和 nums2，以及各自的有效元素个数 m 和 n。请将 nums2 合并到 nums1 中，使合并后的数组仍然有序。',
 rule:'原地修改 nums1，无须返回值。下面编辑器填写两组有效元素，m、n 自动计算；nums1 的预留位置会自动补齐。有效元素中的零正常参与合并。',
 steps:[{title:'先看空间，再定方向',body:'nums1 的后面已有 n 个预留位置。从前往后写会覆盖未读元素；从后往前填，就能安全复用这些空间。'},{title:'比较末尾，大的先落位',body:'i、j 分别指向两组有效元素的末尾。比较后，将较大值写入 nums1[k]，再把对应指针和 k 左移。'},{title:'直到第二组全部归位',body:'当 j < 0，合并就已完成。第一组尚未移动的前缀天然有序，无须再复制；相等时取第二组。'}],
 time:'O(m + n)',space:'O(1)',input:{nums1:[1,2,3],nums2:[2,5,6]},expected:[1,2,2,3,5,6],code:GO_CODE,
 cases:[{input:{nums1:[],nums2:[1]},expected:[1]},{input:{nums1:[1],nums2:[]},expected:[1]},{input:{nums1:[0],nums2:[0,1]},expected:[0,0,1]}],
 solve({nums1,nums2},emit){
  numbers(nums1,'nums1',100);numbers(nums2,'nums2',100);
  const frames=buildMergeTrace([...nums1,...nums2.map(()=>0)],nums1.length,nums2,nums2.length);
  for(const f of frames){
   const pointers={i:f.i,k:f.k};
   const scene={kind:'array',values:f.a,label:'nums1',pointers,done:f.a.map((_,i)=>i).filter(i=>i>=f.sortedFrom),reserved:f.a.map((_,i)=>i).filter(i=>i>=nums1.length&&i<f.sortedFrom),active:f.writeIndex===null?[]:[f.writeIndex],secondary:f.b,secondaryLabel:'nums2',secondaryPointers:{j:f.j},secondaryConsumed:f.b.map((_,i)=>i).filter(i=>i>f.j)};
   emit(scene,f.title,f.description,f.lines,{i:f.i,j:f.j,k:f.k,比较:f.comparisons,写入:f.writes});
  }
  return frames.at(-1).a;
 }
};

const byId=new Map([mergeLesson,...lessonsA,...lessonsB,...lessonsC].map(lesson=>[lesson.id,lesson]));
export const lessons=catalog.map(meta=>({...meta,...byId.get(meta.id)}));
export const getLesson=(id)=>lessons.find(lesson=>lesson.id===Number(id));
