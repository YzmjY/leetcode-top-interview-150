// Pointer names are local to each algorithm: head and tail do not have one
// shared meaning across reversal, partitioning, recursion and merging.
const pointerMeanings={
  2:{
    dummy:'结果哨兵',tail:'结果链尾',l1:'输入1当前位',l2:'输入2当前位',
  },
  19:{
    head:'原链头',dummy:'结果哨兵',fast:'先行指针',slow:'寻找待删前驱',
  },
  21:{
    dummy:'结果哨兵',tail:'结果接入尾',list1:'输入1待合并头',list2:'输入2待合并头',
  },
  23:{
    a:'左链待合并头',b:'右链待合并头',dummy:'本次合并哨兵',tail:'本次合并接入尾',
  },
  25:{
    dummy:'结果哨兵',head:'原链头',pre:'本组前驱',end:'组尾探查指针',
    after:'本组之后的节点',first:'本组原头',prev:'反转时的前驱',
    cur:'当前反转节点',next:'暂存原后继',
  },
  61:{
    head:'原链头',tail:'原链尾',pre:'寻找新链尾',result:'新链头',
  },
  82:{
    head:'原链头',dummy:'结果哨兵',pre:'已保留部分的尾',
  },
  86:{
    small:'小值链哨兵',big:'大值链哨兵',a:'小值链接入尾',b:'大值链接入尾',
    head:'当前待分区节点',next:'暂存未处理后继',
  },
  92:{
    dummy:'结果哨兵',head:'原链头',pre:'区间前驱',cur:'区间原头，反转后为尾',move:'本次头插节点',
  },
  138:{
    head:'原链头',p:'当前原节点',
  },
  141:{
    head:'链表入口',slow:'每轮走1步',fast:'每轮走2步',
  },
  146:{
    'c.head':'最近端哨兵','c.tail':'最旧端哨兵',n:'本次访问或写入节点',old:'本次淘汰节点',
  },
  148:{
    head:'本次递归子链的原头',slow:'分半慢指针',fast:'分半快指针',
    left:'左半段待合并头',right:'右半段当前表头',dummy:'本次合并哨兵',tail:'本次合并接入尾',
  },
};

export function getPointerMeaning(lessonId,name){
  const meanings=Object.hasOwn(pointerMeanings,lessonId)?pointerMeanings[lessonId]:null;
  return meanings&&Object.hasOwn(meanings,name)?meanings[name]:'代码中的指针';
}
