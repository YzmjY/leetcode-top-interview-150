import {invariant,array,numbers,integer,text,sorted} from './lesson-kit.js';

export const lessonsA=[];
const C=(input,expected)=>({input,expected});
const A=(e,v,title,lines,vars={},extra={})=>e({kind:'array',values:v,...extra},title,'观察指针、已处理位置与本轮更新。',lines,vars);
const T=(e,s,title,lines,vars={},extra={})=>{const {description='观察当前字符、标记位置与变量的变化。',...options}=extra;return e({kind:'text',text:s,...options},title,description,lines,vars);};
const S=(e,v,title,lines,vars={},extra={})=>e({kind:'stack',values:v,...extra},title,'栈底在下，栈顶在上；同步观察当前操作。',lines,vars);
const nonneg=(v,name)=>{numbers(v,name,60);invariant(v.every(x=>x>=0),`${name}必须是非负整数。`);};
const ascii=(s,name='字符串')=>{text(s,name,120);invariant(/^[\x20-\x7e]*$/.test(s),`${name}请使用可打印 ASCII 字符。`);};
function bounded(v,budget={chars:0}){if(Array.isArray(v)){array(v,'输入数组',60);v.forEach(x=>bounded(x,budget));}else if(v&&typeof v==='object'){Object.values(v).forEach(x=>bounded(x,budget));}else if(typeof v==='string'){ascii(v);budget.chars+=v.length;invariant(budget.chars<=1200,'输入字符总量不能超过 1200，请缩小演示规模。');}else if(typeof v==='number'){invariant(Number.isSafeInteger(v)&&Math.abs(v)<=1e9,'输入数字须为绝对值不超过 10⁹ 的整数。');}}

// Go names belong to their actual sequence. Chinese labels identify teaching
// cursors and derived quantities that are deliberately absent from the Go code.
const traceNames={
  27:{k:'write',i:'读取位置'},26:{k:'write',i:'读取位置',limit:'每值保留上限'},80:{k:'write',i:'读取位置',limit:'每值保留上限'},
  189:{l:'left',r:'right'},122:{delta:'相邻差价'},
  380:{index:'s.index',result:'操作返回',output:'逐步结果'},
  42:{l:'left',r:'right',lm:'leftMax',rm:'rightMax'},13:{delta:'本轮增量'},
  12:{remaining:'num',symbol:'当前罗马符号'},58:{n:'length'},14:{other:'strs[j]',prefix:'公共前缀'},
  6:{d:'direction',char:'当前字符'},68:{w:'maxWidth',l:'left',r:'right',lines:'已输出行数',width:'行字符数'},
  125:{l:'left',r:'right'},15:{l:'left',r:'right',found:'result'},3:{l:'left'},30:{found:'result'},
  383:{char:'当前字符'},242:{s:'s[i]',t:'t[i]'},49:{i:'读取位置',groups:'分组数量'},
  1:{need:'所需补数'},202:{repeated:'是否成环'},219:{distance:'下标间距'},
  128:{unique:'去重值集合',start:'value'},228:{ranges:'result'},
  56:{i:'读取位置',merged:'result',processed:'已处理区间数'},452:{count:'arrows'},
  20:{char:'c'},71:{path:'当前规范路径'},155:{result:'操作返回',output:'逐步结果'},224:{char:'c'}
};
const rangeAnnotations={
  55:{rangeLabel:'已确认可达下标',rangeNote:'范围外尚未被当前 far 覆盖，后续可能继续扩张；far 超过末尾时只高亮实际下标。'},
  45:{rangeLabel:'当前跳跃次数可覆盖下标',rangeNote:'范围右端由 end 决定；far 用于计算下一层能到达的最远位置。'},
  28:{rangeLabel:'已匹配字符下标',rangeNote:'这段字符已与 needle 的前缀匹配；start 是起点，matched 是已匹配长度。'},
  68:{rangeLabel:'当前行已装入单词下标',rangeNote:'本行使用 [left,right)；right 指向下一待检查单词，不包含在当前行内。'},
  11:{rangeLabel:'当前容器左右边界下标',rangeNote:'以 left 和 right 为两边计算容量；已移出的边界不再参与后续容器。'},
  209:{rangeLabel:'当前求和窗口下标',rangeNote:'闭区间 [left,right] 内的元素参与 sum；尚未扫描的右侧元素可在后续进入窗口。'},
  3:{rangeLabel:'当前无重复窗口下标',rangeNote:'闭区间 [left,right] 内的字符互不重复；窗口随扫描继续移动。'},
  30:{rangeLabel:'当前有效单词窗口下标',rangeNote:'高亮完整单词覆盖的字符；right 指向本轮单词起点，窗口包含该单词的全部字符。'},
  76:{rangeLabel:'当前覆盖窗口下标',rangeNote:'闭区间 [left,right] 是当前窗口；remaining 为 0 时已覆盖 t 的全部字符及其次数。'},
  228:{rangeLabel:'当前连续整数段下标',rangeNote:'高亮本次压缩的连续整数段；此前的段已写入 result，后面的段仍待处理。'}
};
function alignTrace(id,input,emit){
  let magazineAt=0,noteAt=0,tokenAt=0;
  let previousValues=[];
  return (scene,title,description,lines,vars={},anchor=null)=>{
    const view={...scene},v={};
    for(const [name,value]of Object.entries(vars))v[traceNames[id]?.[name]??name]=value;
    const pointers={},secondaryPointers={},rowPointers={};
    const at=(bindings,name,value=v[name])=>{if(Number.isInteger(value)){bindings[name]=value;v[name]=value;}};
    const p=(name,value)=>at(pointers,name,value),q=(name,value)=>at(secondaryPointers,name,value),r=(name,value)=>at(rowPointers,name,value);
    const active=scene.active??[],range=scene.range;
    if((id===242||id===383)&&view.kind==='array'){
      view.indexLabels=[...'abcdefghijklmnopqrstuvwxyz'];
      view.indexNote='字母桶：下标 0 对应 a，依次递增至下标 25 对应 z；格内数字表示该字母的计数。';
    }
    if(range){
      Object.assign(view,rangeAnnotations[id]);
      if(id===30&&title==='非法单词重置窗口'){
        view.rangeLabel='本轮非法单词下标';
        view.rangeNote='该单词使窗口重置为空；left 指向它之后的下一段扫描起点。';
      }
    }
    const arrayLabel={27:'nums',26:'nums',80:'nums',169:'nums',189:'nums',121:'prices',122:'prices',55:'nums',45:'nums',274:'citations',380:'s.values',238:'nums',134:'gas',135:'ratings',42:'height',151:'words',6:'rows',68:'words',167:'numbers',11:'height',15:'nums',209:'nums',383:'count',290:'words',242:'counts',49:'strs',1:'nums',219:'nums',128:'nums',228:'nums'};
    if(view.kind==='array'&&arrayLabel[id])view.label=arrayLabel[id];
    switch(id){
      case 27:case 26:case 80:
        p('write');p('读取位置');
        if(Number.isInteger(v['读取位置'])&&!('value'in v))v.value=scene.values[v['读取位置']];
        description+=' write 是下一次写入的位置；读取位置是演示游标，Go 的 range 用 _ 忽略该下标。';
        break;
      case 169:
        if(active.length){p('读取位置',active[0]);v.value=scene.values[active[0]];}
        break;
      case 189:p('left');p('right');break;
      case 121:
        if(active.length){p('读取位置',active[0]);v.price=scene.values[active[0]];}
        break;
      case 122:
        if(active.length)p('i',active.at(-1));
        break;
      case 55:p('i');p('far');if(Number.isInteger(v.i))v.jump=scene.values[v.i];break;
      case 45:p('i');p('end');p('far');break;
      case 274:
        if(active.length){p('i',active[0]);v.count=scene.values[active[0]];}
        break;
      case 380:{
        const {name:op,args:[val]}=scene.operation;
        if(op==='insert'||op==='remove')v.val=val;
        if(op==='insert'&&v['操作返回'])p('追加位置',scene.values.length-1);
        if(op==='remove'&&v['操作返回']){p('i',previousValues.indexOf(val));v.last=previousValues.at(-1);}
        if(op==='getRandom')p('随机选中位置',scene.values.indexOf(v['操作返回']));
        break;
      }
      case 238:
        p('i');q('i');view.secondaryLabel='answer';
        if(lines.every(n=>n<8))delete v.right;
        break;
      case 134:
        p('i');q('i');p('start');view.secondaryLabel='cost';
        break;
      case 135:
        p('i');q('i');view.secondaryLabel='candies';
        break;
      case 42:
        p('left',v.left??0);p('right',v.right??scene.values.length-1);
        break;
      case 13:
        view.label='s';
        if(active.length){p('i',active[0]);v.value=Math.abs(v['本轮增量']);}
        break;
      case 12:
        view.label='result';v.result=scene.text;
        break;
      case 58:view.label='s';p('i');break;
      case 14:
        view.label='strs[0]';view.secondaryLabel='strs[j]';p('i');q('i');
        break;
      case 151:p('left');p('right');break;
      case 6:
        if(view.kind==='array'){
          p('row');view.secondary=[...input.s];view.secondaryLabel='s';q('i');
        }else view.label='s';
        break;
      case 28:
        view.label='haystack';view.secondaryLabel='needle';p('start');q('matched');
        if(Number.isInteger(v.start)&&Number.isInteger(v.matched))p('下一比较位置',v.start+v.matched);
        break;
      case 68:
        if(view.kind==='array'){p('left');p('right');}
        else{view.label='line';v.line=scene.text;}
        break;
      case 125:
        view.label='s';p('left');p('right');
        break;
      case 392:
        view.label='t';view.secondaryLabel='s';p('j');q('i');
        break;
      case 167:
        p('left',scene.pointers?.left??0);p('right',scene.pointers?.right??scene.values.length-1);
        break;
      case 11:
        p('left',active[0]??0);p('right',active[1]??scene.values.length-1);
        if('area'in v)v.low=Math.min(scene.values[v.left],scene.values[v.right]);
        break;
      case 15:p('i');p('left');p('right');break;
      case 209:
        p('left',range?.[0]??0);
        if(range){p('right',range[1]);v.value=scene.values[v.right];}
        break;
      case 3:view.label='s';p('left');p('right');break;
      case 30:
        view.label='s';p('left');
        if(range){p('right',range[1]-input.words[0].length+1);v.offset=v.right%input.words[0].length;}
        break;
      case 76:
        view.label='s';view.secondaryLabel='t';p('left',range?.[0]??0);
        if(range)p('right',range[1]);
        break;
      case 383:
        if(active.length){
          const counting=title==='登记杂志中的字母',source=counting?'magazine':'ransomNote';
          view.secondary=[...input[source]];view.secondaryLabel=source;
          q('i',counting?magazineAt++:noteAt++);
          if(counting)p('字母槽位',active[0]);else p('index',active[0]);
        }
        break;
      case 205:
        view.label='s';view.secondaryLabel='t';p('i');q('i');
        break;
      case 290:
        p('i');view.secondary=[...input.pattern];view.secondaryLabel='pattern';q('i');
        break;
      case 242:
        if(active.length){p('s字母槽位',active[0]);p('t字母槽位',active[1]);}
        break;
      case 49:
        if(view.kind==='table'){
          v.word=input.strs[v['读取位置']];v.group=scene.rows.findIndex(row=>row[0]===v.key);
          r('group');
        }
        break;
      case 1:
        p('i');
        if(v.seen&&Object.hasOwn(v.seen,v['所需补数']))p('j',v.seen[v['所需补数']]);
        break;
      case 202:p('当前变换结果',scene.values.length-1);break;
      case 219:
        if(Number.isInteger(v.previous))v.j=v.previous;else if('previous'in v)v['上次出现位置']=v.previous;
        delete v.previous;p('i');p('j');
        if(Number.isInteger(v.i))v.value=scene.values[v.i];
        break;
      case 128:
        if('value'in v)p('起点在原数组的位置',scene.values.indexOf(v.value));
        break;
      case 228:
        if(range){p('left',range[0]);p('right',range[1]);}
        break;
      case 56:
        if('读取位置'in v){r('读取位置');v.current=scene.intervals[v['读取位置']];}
        else if(active.length)r('合并结果末尾',active[0]);
        break;
      case 57:
        if('i'in v)r('i');
        break;
      case 452:
        if(active.length){r('读取位置',active[0]);v.point=scene.intervals[active[0]];}
        break;
      case 20:case 224:q('i');break;
      case 71:break;
      case 155:{
        const {name:op,args:[val]}=scene.operation;
        if(op==='push'){v.val=val;v.low=Number(scene.values.at(-1).split('min=')[1]);}
        break;
      }
      case 150:
        if('token'in v){
          q('读取位置',tokenAt++);
          v.value=scene.values.at(-1);
          if(['+','-','*','/'].includes(v.token)){v.left=previousValues.at(-2);v.right=previousValues.at(-1);}
        }
        break;
    }
    if(view.kind==='array'||view.kind==='text')view.pointers=pointers;
    if(Object.keys(secondaryPointers).length)view.secondaryPointers=secondaryPointers;
    if(Object.keys(rowPointers).length)view.rowPointers=rowPointers;
    previousValues=Array.isArray(scene.values)?[...scene.values]:[];
    emit(view,title,description,lines,v,anchor);
  };
}
function add(id,summary,rule,steps,time,space,input,expected,cases,code,solve,validate=()=>{}){
 lessonsA.push({id,summary,rule,steps:steps.map(([title,body])=>({title,body})),time,space,input,expected,cases,code:code.trim(),solve(input,emit){return solve(input,alignTrace(id,input,emit));},validate(v){invariant(v&&typeof v==='object'&&!Array.isArray(v),'请输入 JSON 对象。');bounded(v);validate(v);}});
}
const scanSteps=[['读指针扫描','逐个检查原数组中的元素。'],['写入有效前缀','满足保留条件时写到 write 指向的位置，然后推进 write。'],['返回前缀长度','write 就是有效元素个数，数组的剩余位置无需处理。']];
add(27,'给定整数数组 nums 和整数 val，原地移除所有等于 val 的元素，返回有效前缀的长度及内容。','元素顺序可以改变；只检查返回长度以内的位置。',scanSteps,'O(n)','O(1)',{nums:[3,2,2,3],val:3},{k:2,nums:[2,2]},[C({nums:[],val:1},{k:0,nums:[]}),C({nums:[1,1,1],val:1},{k:0,nums:[]})],`
func removeElement(nums []int, val int) int {
    write := 0
    for _, value := range nums {
        if value != val {
            nums[write] = value
            write++
        }
    }
    return write
}`,({nums,val},e)=>{let k=0;A(e,nums,'初始化读写指针',[2],{k});for(let i=0;i<nums.length;i++){const v=nums[i];if(v!==val)nums[k++]=v;A(e,nums,v===val?'跳过目标值':'保留当前元素',[4,5,6],{i,k,value:v},{active:[i],pointers:{read:i,write:k}});}return{k,nums:nums.slice(0,k)};},v=>{numbers(v.nums);integer(v.val,-1e9,1e9,'val');});
for(const [id,limit,input,expected,cases] of [
 [26,1,{nums:[0,0,1,1,1,2,2,3,3,4]},{k:5,nums:[0,1,2,3,4]},[C({nums:[]},{k:0,nums:[]}),C({nums:[1,1,1]},{k:1,nums:[1]})]],
 [80,2,{nums:[0,0,1,1,1,1,2,3,3]},{k:7,nums:[0,0,1,1,2,3,3]},[C({nums:[]},{k:0,nums:[]}),C({nums:[1,1,1]},{k:2,nums:[1,1]})]]]){
 add(id,`给定非递减整数数组 nums，原地删除多余重复项，使每个值最多保留 ${limit} 次，返回有效前缀长度和内容。`,'数组已排序；保留元素的相对顺序不变。',scanSteps,'O(n)','O(1)',input,expected,cases,`
func removeDuplicates(nums []int) int {
    write := 0
    for _, value := range nums {
        if write < ${limit} || nums[write-${limit}] != value {
            nums[write] = value
            write++
        }
    }
    return write
}`,({nums},e)=>{let k=0;A(e,nums,'初始化有效前缀',[2],{k});for(let i=0;i<nums.length;i++){const v=nums[i],keep=k<limit||nums[k-limit]!==v;if(keep)nums[k++]=v;A(e,nums,keep?'追加允许保留的值':'跳过多余重复值',[4,5,6],{i,k,limit},{active:[i],done:Array.from({length:k},(_,j)=>j),pointers:{read:i,write:k}});}return{k,nums:nums.slice(0,k)};},v=>sorted(v.nums));
}
add(169,'给定非空整数数组，找出出现次数严格超过数组长度一半的多数元素并返回。','题目保证多数元素存在；演示输入也需满足该保证。',[['选择候选人','票数为零时，把当前数字选作新候选人。'],['抵消不同元素','遇到候选人加一票，遇到其他数字减一票。'],['保留多数元素','多数元素比其他所有元素总和还多，最后的候选人就是答案。']],'O(n)','O(1)',{nums:[2,2,1,1,1,2,2]},2,[C({nums:[1]},1),C({nums:[3,3,4]},3)],`
func majorityElement(nums []int) int {
    candidate, votes := 0, 0
    for _, value := range nums {
        if votes == 0 { candidate = value }
        if value == candidate { votes++ } else { votes-- }
    }
    return candidate
}`,({nums},e)=>{let candidate=0,votes=0;A(e,nums,'初始化候选人和票数',[2],{candidate,votes});nums.forEach((v,i)=>{if(!votes)candidate=v;votes+=v===candidate?1:-1;A(e,nums,'投票与抵消',[4,5],{candidate,votes},{active:[i]});});return candidate;},v=>{numbers(v.nums);invariant(v.nums.length>0,'数组不能为空。');const counts=new Map();v.nums.forEach(n=>counts.set(n,(counts.get(n)||0)+1));invariant([...counts.values()].some(n=>n>v.nums.length/2),'输入必须存在多数元素。');});
add(189,'给定数组 nums 和非负整数 k，将数组中的元素向右轮转 k 个位置，返回轮转后的数组。','k 可以大于数组长度；使用原地反转完成轮转。',[['归一化位移','用 k 对数组长度取余。'],['反转整个数组','原来的后段移动到前面，段内顺序暂时反转。'],['反转两个分段','分别反转前 k 项和后面的项，恢复段内顺序。']],'O(n)','O(1)',{nums:[1,2,3,4,5,6,7],k:3},[5,6,7,1,2,3,4],[C({nums:[1],k:10},[1]),C({nums:[],k:0},[])],`
func rotate(nums []int, k int) {
    if len(nums) == 0 { return }
    k %= len(nums)
    reverse := func(left, right int) {
        for left < right {
            nums[left], nums[right] = nums[right], nums[left]
            left++; right--
        }
    }
    reverse(0, len(nums)-1)
    reverse(0, k-1)
    reverse(k, len(nums)-1)
}`,({nums,k},e)=>{if(!nums.length)return nums;k%=nums.length;A(e,nums,'轮转前',[3],{k});const rev=(l,r)=>{while(l<r){[nums[l],nums[r]]=[nums[r],nums[l]];A(e,nums,'交换对称位置',[6],{k,l,r},{active:[l,r]});l++;r--;}};rev(0,nums.length-1);rev(0,k-1);rev(k,nums.length-1);return nums;},v=>{numbers(v.nums);integer(v.k,0,1e9,'k');});
add(121,'给定每天的股票价格，只允许买入一次并在之后卖出一次，返回能获得的最大利润；不能获利时返回 0。','价格为非负整数；必须先买后卖，可以不交易。',[['维护最低买价','扫描时记录到当天为止最低的历史价格。'],['计算今天卖出','用当前价格减去最低买价计算可得利润。'],['更新最大利润','每一天都比较，保留最大利润。']],'O(n)','O(1)',{prices:[7,1,5,3,6,4]},5,[C({prices:[7,6,4,3,1]},0),C({prices:[1]},0)],`
func maxProfit(prices []int) int {
    if len(prices) == 0 { return 0 }
    low, best := prices[0], 0
    for _, price := range prices {
        if price < low { low = price }
        if price-low > best { best = price-low }
    }
    return best
}`,({prices},e)=>{let low=prices[0]??0,best=0;A(e,prices,'开始记录最低价',[3],{low,best});prices.forEach((p,i)=>{low=Math.min(low,p);best=Math.max(best,p-low);A(e,prices,'比较当天卖出利润',[5,6],{low,best},{active:[i]});});return best;},v=>nonneg(v.prices,'prices'));
add(122,'给定每天的股票价格，可以多次买卖但任意时刻最多持有一股，返回能够获得的最大利润。','可以买入并在同一天卖出；没有手续费，价格非负。',[['查看相邻两天','每一天的价格变化都可独立分析。'],['收集上涨差价','今天比昨天贵时，将上涨差额计入利润。'],['合并连续交易','连续上涨的每日差价之和等于低买高卖的总利润。']],'O(n)','O(1)',{prices:[7,1,5,3,6,4]},7,[C({prices:[1,2,3,4,5]},4),C({prices:[5,4,3]},0)],`
func maxProfit(prices []int) int {
    profit := 0
    for i := 1; i < len(prices); i++ {
        if prices[i] > prices[i-1] {
            profit += prices[i] - prices[i-1]
        }
    }
    return profit
}`,({prices},e)=>{let profit=0;A(e,prices,'累计利润置零',[2],{profit});for(let i=1;i<prices.length;i++){const delta=prices[i]-prices[i-1];profit+=Math.max(0,delta);A(e,prices,delta>0?'收集上涨差价':'略过下跌',[4,5],{profit,delta},{active:[i-1,i]});}return profit;},v=>nonneg(v.prices,'prices'));
add(55,'给定非负整数数组，每个数表示从该位置最多可跳的距离，判断从下标 0 能否到达最后一个下标。','数组非空；可以选择不超过最大跳距的任意距离。',[['维护最远可达位置','初始只能到达下标 0。'],['扫描可达位置','若当前位置超过最远可达位置，说明出现无法跨过的断点。'],['扩展覆盖范围','用 i + nums[i] 更新最远位置，判断是否覆盖终点。']],'O(n)','O(1)',{nums:[2,3,1,1,4]},true,[C({nums:[3,2,1,0,4]},false),C({nums:[0]},true)],`
func canJump(nums []int) bool {
    far := 0
    for i, jump := range nums {
        if i > far { return false }
        if i+jump > far { far = i+jump }
    }
    return far >= len(nums)-1
}`,({nums},e)=>{let far=0;A(e,nums,'起点可达',[2],{far});for(let i=0;i<nums.length;i++){if(i>far){A(e,nums,'遇到不可达位置',[4],{i,far},{active:[i]});return false;}far=Math.max(far,i+nums[i]);A(e,nums,'扩展可达范围',[5],{i,far},{active:[i],range:[0,Math.min(far,nums.length-1)]});}return true;},v=>{nonneg(v.nums,'nums');invariant(v.nums.length>0,'数组不能为空。');});
add(45,'给定非负跳跃数组，每项是当前位置的最大跳距，返回从下标 0 到最后一个下标所需的最少跳跃次数。','题目保证终点可达；数组非空。',[['把一次跳跃看成一层','end 表示当前跳跃次数可覆盖的最右边界。'],['寻找下一层边界','扫描本层中的位置，维护下一跳能够到达的最远点 far。'],['到边界时跳跃','扫描到 end 时增加一次跳跃，并把 end 扩到 far。']],'O(n)','O(1)',{nums:[2,3,1,1,4]},2,[C({nums:[0]},0),C({nums:[1,1,1,1]},3)],`
func jump(nums []int) int {
    end, far, steps := 0, 0, 0
    for i := 0; i < len(nums)-1; i++ {
        if i+nums[i] > far { far = i+nums[i] }
        if i == end {
            steps++
            end = far
        }
    }
    return steps
}`,({nums},e)=>{let end=0,far=0,steps=0;A(e,nums,'初始化当前层',[2],{end,far,steps});for(let i=0;i<nums.length-1;i++){far=Math.max(far,i+nums[i]);if(i===end){steps++;end=far;}A(e,nums,'扫描一层并扩展下一层',[4,5,6,7],{i,end,far,steps},{active:[i],range:[0,Math.min(end,nums.length-1)]});}return steps;},v=>{nonneg(v.nums,'nums');invariant(v.nums.length>0,'数组不能为空。');let far=0;for(let i=0;i<v.nums.length;i++){invariant(i<=far,'本题要求终点可达。');far=Math.max(far,i+v.nums[i]);}});
add(274,'给定研究者每篇论文的引用次数 citations，返回最大整数 h，使至少 h 篇论文分别被引用至少 h 次。','引用次数为非负整数；h 不超过论文总数。',[['按引用次数降序排列','引用最多的论文放在最前面。'],['逐篇提高候选 h','第 i 篇的引用数至少为 i+1 时，已有 i+1 篇满足要求。'],['在不满足时停止','后面的论文引用更少，无法继续提高 h。']],'O(n log n)','O(log n) 排序栈',{citations:[3,0,6,1,5]},3,[C({citations:[]},0),C({citations:[100]},1)],`
import "sort"

func hIndex(citations []int) int {
    sort.Sort(sort.Reverse(sort.IntSlice(citations)))
    h := 0
    for i, count := range citations {
        if count < i+1 { break }
        h = i+1
    }
    return h
}`,({citations},e)=>{A(e,citations,'排序前',[4]);citations.sort((a,b)=>b-a);let h=0;A(e,citations,'引用次数降序',[4],{h});for(let i=0;i<citations.length;i++){if(citations[i]<i+1){A(e,citations,'无法进一步提高 h',[7],{h},{active:[i]});break;}h=i+1;A(e,citations,'提高 h 指数',[8],{h},{active:[i]});}return h;},v=>nonneg(v.citations,'citations'));
add(380,'设计集合，支持平均 O(1) 的插入、删除和等概率获取随机元素。输入 operations 数组，返回每步的操作结果。','每项格式为 [操作,值]；RandomizedSet 构造，insert/remove 返回布尔值，getRandom 要求集合非空。getRandom 可附 0 到 999 的千分位随机样本 ticket 用于回放；省略时使用真实随机数抽取下标。',[['数组保存元素','哈希表记录每个值在数组中的位置，插入时追加到末尾。'],['交换后删除','删除时让末尾元素填补空位，同时更新它的位置。'],['随机索引取值','从数组所有下标等概率抽取一个，直接返回该元素。']],'每次平均 O(1)','O(n)',{operations:[['RandomizedSet'],['insert',1],['remove',2],['insert',2],['getRandom',750],['remove',1],['getRandom',0]]},[null,true,false,true,2,true,2],[C({operations:[['RandomizedSet'],['insert',1],['insert',1],['remove',1]]},[null,true,false,true]),C({operations:[['RandomizedSet'],['remove',9]]},[null,false])],`
import "math/rand"

type RandomizedSet struct {
    values []int
    index map[int]int
}
func Constructor() RandomizedSet {
    return RandomizedSet{index: make(map[int]int)}
}
func (s *RandomizedSet) Insert(val int) bool {
    if _, ok := s.index[val]; ok { return false }
    s.index[val] = len(s.values)
    s.values = append(s.values, val)
    return true
}
func (s *RandomizedSet) Remove(val int) bool {
    i, ok := s.index[val]
    if !ok { return false }
    last := s.values[len(s.values)-1]
    s.values[i] = last
    s.index[last] = i
    s.values = s.values[:len(s.values)-1]
    delete(s.index, val)
    return true
}
func (s *RandomizedSet) GetRandom() int {
    return s.values[rand.Intn(len(s.values))]
}`,({operations},e)=>{let values=[],pos=new Map();const out=[];for(const [operationIndex,command]of operations.entries()){const [op,v]=command;let r=null;if(op==='RandomizedSet'){values=[];pos=new Map();}else if(op==='insert'){r=!pos.has(v);if(r){pos.set(v,values.length);values.push(v);}}else if(op==='remove'){r=pos.has(v);if(r){const i=pos.get(v),last=values.at(-1);values[i]=last;pos.set(last,i);values.pop();pos.delete(v);}}else{invariant(values.length>0,'getRandom 需要非空集合。');r=values[Math.min(values.length-1,Math.floor((v===undefined?Math.random():v/1000)*values.length))];}out.push(r);A(e,values,`执行 ${op}`,[op==='insert'?12:op==='remove'?19:op==='getRandom'?27:8],{result:r,index:Object.fromEntries(pos),output:out},{operation:{index:operationIndex,name:op,args:command.slice(1),returns:op!=='RandomizedSet',complete:true,value:r}});}return out;},v=>{array(v.operations,'operations',40);invariant(v.operations.length&&Array.isArray(v.operations[0])&&v.operations[0][0]==='RandomizedSet','首个操作必须构造 RandomizedSet。');for(const a of v.operations){invariant(Array.isArray(a)&&['RandomizedSet','insert','remove','getRandom'].includes(a[0]),'操作名称无效。');if(a[0]==='getRandom'&&a[1]!==undefined)integer(a[1],0,999,'ticket');if(['insert','remove'].includes(a[0]))integer(a[1],-1e9,1e9,'值');}});
add(238,'给定整数数组 nums，返回新数组 answer，其中 answer[i] 等于 nums 中除 nums[i] 以外所有元素的乘积。','不使用除法；前缀与后缀乘积应在安全整数范围内。',[['写入左侧乘积','从左到右，answer[i] 保存 i 左边全部数字的乘积。'],['维护右侧乘积','从右到左维护一个滚动的后缀乘积。'],['组合左右两侧','answer[i] 乘上后缀乘积，得到排除自己的结果。']],'O(n)','O(1)，不计输出',{nums:[1,2,3,4]},[24,12,8,6],[C({nums:[0,1,2]},[2,0,0]),C({nums:[0,0]},[0,0])],`
func productExceptSelf(nums []int) []int {
    answer := make([]int, len(nums))
    left := 1
    for i, value := range nums {
        answer[i] = left
        left *= value
    }
    right := 1
    for i := len(nums)-1; i >= 0; i-- {
        answer[i] *= right
        right *= nums[i]
    }
    return answer
}`,({nums},e)=>{const out=Array(nums.length).fill(1);let left=1,right=1;A(e,nums,'初始化乘积数组',[2],{left,right},{secondary:out,secondaryLabel:'answer'});nums.forEach((v,i)=>{out[i]=left;left*=v;A(e,nums,'写入前缀乘积',[5,6],{i,left},{active:[i],secondary:out});});for(let i=nums.length-1;i>=0;i--){out[i]*=right;right*=nums[i];A(e,nums,'合并后缀乘积',[10,11],{i,right},{active:[i],secondary:out});}return out.map(x=>x===0?0:x);},v=>{numbers(v.nums);invariant(v.nums.length>=2,'至少需要两个数。');let bound=1;for(const n of v.nums){bound*=Math.max(1,Math.abs(n));invariant(bound<=2**31-1,'请缩小数字，确保乘积在 32 位整数内。');}});
add(134,'环形路线上每站可获得 gas[i] 的汽油，前往下一站消耗 cost[i]，返回可绕行一周的出发站；无法完成返回 -1。','gas 和 cost 等长且非空，数值非负；有解时题目保证唯一。',[['检查总油量','总供给不足总消耗时一定无解。'],['累计当前路段余油','从候选起点出发累计 gas[i]-cost[i]。'],['亏空后更换起点','若余油变负，本段任何起点都不可行，下一个站成为新候选。']],'O(n)','O(1)',{gas:[1,2,3,4,5],cost:[3,4,5,1,2]},3,[C({gas:[2,3,4],cost:[3,4,3]},-1),C({gas:[5],cost:[4]},0)],`
func canCompleteCircuit(gas []int, cost []int) int {
    total, tank, start := 0, 0, 0
    for i := range gas {
        delta := gas[i] - cost[i]
        total += delta; tank += delta
        if tank < 0 { start = i+1; tank = 0 }
    }
    if total < 0 { return -1 }
    return start
}`,({gas,cost},e)=>{let total=0,tank=0,start=0;A(e,gas,'开始环形路线',[2],{total,tank,start},{secondary:cost,secondaryLabel:'cost'});for(let i=0;i<gas.length;i++){total+=gas[i]-cost[i];tank+=gas[i]-cost[i];if(tank<0){start=i+1;tank=0;}A(e,gas,'累计余油并检验候选起点',[4,5,6],{i,total,tank,start},{active:[i],secondary:cost});}return total<0?-1:start;},v=>{nonneg(v.gas,'gas');nonneg(v.cost,'cost');invariant(v.gas.length>0&&v.gas.length===v.cost.length,'gas 和 cost 必须等长且非空。');});
add(135,'给每个孩子至少一颗糖果，评分高于相邻孩子时糖果也必须更多，返回满足条件的最少糖果总数。','只比较相邻孩子；相同评分不要求糖果数相同。',[['从左满足左邻居','若评分比左边高，糖果数至少比左边多一颗。'],['从右满足右邻居','反向扫描，取已有数和右邻居加一的较大值。'],['求和得到最小值','每个位置同时满足两边约束，累计最少糖果。']],'O(n)','O(n)',{ratings:[1,0,2]},5,[C({ratings:[1,2,2]},4),C({ratings:[5]},1)],`
func candy(ratings []int) int {
    n := len(ratings)
    candies := make([]int, n)
    for i := range candies { candies[i] = 1 }
    for i := 1; i < n; i++ {
        if ratings[i] > ratings[i-1] { candies[i] = candies[i-1]+1 }
    }
    total := 0
    for i := n-1; i >= 0; i-- {
        if i+1 < n && ratings[i] > ratings[i+1] && candies[i] <= candies[i+1] {
            candies[i] = candies[i+1]+1
        }
        total += candies[i]
    }
    return total
}`,({ratings},e)=>{const candy=ratings.map(()=>1);A(e,ratings,'每人先分一颗',[4],{},{secondary:candy,secondaryLabel:'糖果'});for(let i=1;i<ratings.length;i++){if(ratings[i]>ratings[i-1])candy[i]=candy[i-1]+1;A(e,ratings,'满足左侧约束',[6],{i},{active:[i],secondary:candy});}let total=0;for(let i=ratings.length-1;i>=0;i--){if(i+1<ratings.length&&ratings[i]>ratings[i+1])candy[i]=Math.max(candy[i],candy[i+1]+1);total+=candy[i];A(e,ratings,'满足右侧约束并累加',[10,11,13],{i,total},{active:[i],secondary:candy});}return total;},v=>{numbers(v.ratings);invariant(v.ratings.length>0,'至少需要一个孩子。');});
add(42,'给定每根柱子的非负高度，每根柱子宽度为 1，计算下雨后柱子之间能接多少雨水。','水位由左右最高边界中较矮的一侧决定。',[['两端维护最高柱','leftMax 和 rightMax 记录左右已见的最高高度。'],['处理较低边界','较低一侧的最高柱已足以决定这一格的水位。'],['逐格累积雨水','将边界高度减去当前柱高加入答案，再向内移动。']],'O(n)','O(1)',{height:[0,1,0,2,1,0,1,3,2,1,2,1]},6,[C({height:[2,0,2]},2),C({height:[1,2,3]},0)],`
func trap(height []int) int {
    left, right := 0, len(height)-1
    leftMax, rightMax, water := 0, 0, 0
    for left <= right {
        if height[left] <= height[right] {
            if height[left] > leftMax { leftMax = height[left] }
            water += leftMax-height[left]; left++
        } else {
            if height[right] > rightMax { rightMax = height[right] }
            water += rightMax-height[right]; right--
        }
    }
    return water
}`,({height},e)=>{let l=0,r=height.length-1,lm=0,rm=0,water=0;A(e,height,'两端开始夹逼',[2,3],{water},{bars:true});while(l<=r){if(height[l]<=height[r]){lm=Math.max(lm,height[l]);water+=lm-height[l];A(e,height,'按左边界计算积水',[6,7],{l,r,lm,rm,water},{active:[l],pointers:{left:l,right:r},bars:true});l++;}else{rm=Math.max(rm,height[r]);water+=rm-height[r];A(e,height,'按右边界计算积水',[9,10],{l,r,lm,rm,water},{active:[r],pointers:{left:l,right:r},bars:true});r--;}}return water;},v=>nonneg(v.height,'height'));
add(13,'给定一个有效罗马数字字符串，按罗马计数规则转换为整数并返回。','仅接受 1 到 3999 的规范罗马数字；较小值在较大值左侧时要减去。',[['建立字符数值表','把 I、V、X、L、C、D、M 映射到对应整数。'],['比较下一个字符','当前值小于右侧值时减去，否则加上。'],['累积得到整数','扫描全部字符，返回累计值。']],'O(n)','O(1)',{s:'MCMXCIV'},1994,[C({s:'III'},3),C({s:'LVIII'},58)],`
func romanToInt(s string) int {
    values := map[byte]int{'I':1,'V':5,'X':10,'L':50,'C':100,'D':500,'M':1000}
    total := 0
    for i := 0; i < len(s); i++ {
        value := values[s[i]]
        if i+1 < len(s) && value < values[s[i+1]] { total -= value } else { total += value }
    }
    return total
}`,({s},e)=>{const m={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};let total=0;T(e,s,'读取罗马数字',[2,3],{total});for(let i=0;i<s.length;i++){const delta=i+1<s.length&&m[s[i]]<m[s[i+1]]?-m[s[i]]:m[s[i]];total+=delta;T(e,s,delta<0?'应用减法规则':'累加当前数值',[5,6],{total,delta},{active:[i]});}return total;},v=>{ascii(v.s);invariant(v.s.length>0&&/^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(v.s),'请输入 1 到 3999 的规范罗马数字。');});
add(12,'给定 1 到 3999 的整数 num，将其转换为使用最少规范符号的罗马数字字符串。','使用 I、V、X、L、C、D、M，并按规范使用 IV、IX 等减法组合。',[['准备降序数值表','把普通符号与 900、400、90、40、9、4 的减法组合一起排序。'],['贪心取最大符号','当前数不小于某个符号值时追加该符号并减去其数值。'],['继续处理余数','从大到小遍历，直到余数为零。']],'O(1)，输入限 1..3999','O(1)',{num:1994},'MCMXCIV',[C({num:1},'I'),C({num:3999},'MMMCMXCIX')],`
func intToRoman(num int) string {
    values := []int{1000,900,500,400,100,90,50,40,10,9,5,4,1}
    symbols := []string{"M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"}
    result := ""
    for i, value := range values {
        for num >= value {
            result += symbols[i]
            num -= value
        }
    }
    return result
}`,({num},e)=>{const values=[1000,900,500,400,100,90,50,40,10,9,5,4,1],symbols=['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];let out='';T(e,out,'开始编码',[4],{remaining:num});for(let i=0;i<values.length;i++)while(num>=values[i]){out+=symbols[i];num-=values[i];T(e,out,'追加当前最大符号',[7,8],{remaining:num,symbol:symbols[i]});}return out;},v=>integer(v.num,1,3999,'num'));
add(58,'给定由英文单词和空格组成的字符串，返回最后一个单词的字符长度。','单词是连续非空格字符；输入至少包含一个单词。',[['跳过末尾空格','从字符串末尾向左移动直到遇到非空格字符。'],['向左统计单词','继续向左，遇到空格或者越过开头时停止。'],['返回统计长度','已扫描的连续非空格字符数就是最后一个单词的长度。']],'O(n)','O(1)',{s:'   fly me   to   the moon  '},4,[C({s:'a'},1),C({s:'Hello World'},5)],`
func lengthOfLastWord(s string) int {
    i := len(s)-1
    for i >= 0 && s[i] == ' ' { i-- }
    length := 0
    for i >= 0 && s[i] != ' ' {
        length++; i--
    }
    return length
}`,({s},e)=>{let i=s.length-1,n=0;T(e,s,'从右端开始',[2],{i,n});while(i>=0&&s[i]===' '){T(e,s,'略过末尾空格',[3],{i,n},{active:[i]});i--;}while(i>=0&&s[i]!==' '){n++;T(e,s,'计数最后一个单词',[6],{i,n},{active:[i]});i--;}return n;},v=>{ascii(v.s);invariant(v.s.trim().length>0,'字符串必须包含一个单词。');});
add(14,'给定字符串数组 strs，返回所有字符串共有的最长前缀；不存在公共前缀时返回空字符串。','字符串只含小写英文字母，数组不能为空，单个字符串允许为空。',[['从首个字符串取候选','首个字符串的每个字符依次作为待检查位置。'],['逐列比较所有字符串','任一字符串长度不足或当前字符不同，就到达公共前缀边界。'],['返回边界之前的内容','全部列都一致时，首个字符串本身就是最长公共前缀。']],'O(nm)，m 为首串长度','O(1)，不计输出',{strs:['flower','flow','flight']},'fl',[C({strs:['dog','racecar','car']},''),C({strs:['','abc']},'')],`
func longestCommonPrefix(strs []string) string {
    if len(strs) == 0 { return "" }
    for i := 0; i < len(strs[0]); i++ {
        for j := 1; j < len(strs); j++ {
            if i >= len(strs[j]) || strs[j][i] != strs[0][i] { return strs[0][:i] }
        }
    }
    return strs[0]
}`,({strs},e)=>{T(e,strs[0],'按列扫描前缀',[3],{strs});for(let i=0;i<strs[0].length;i++){for(let j=1;j<strs.length;j++){T(e,strs[0],'比较同一列字符',[5],{i,j,other:strs[j],prefix:strs[0].slice(0,i)},{active:[i],secondary:strs[j],secondaryActive:[i]});if(i>=strs[j].length||strs[j][i]!==strs[0][i])return strs[0].slice(0,i);}}return strs[0];},v=>{array(v.strs,'strs',30);invariant(v.strs.length>0,'strs 不能为空。');v.strs.forEach(s=>{ascii(s);invariant(/^[a-z]*$/.test(s),'仅支持小写英文字母。');});});
add(151,'给定含单词与空格的字符串，反转单词的出现顺序，去除首尾空格并将单词间隔统一为一个空格。','保留每个单词内部字符顺序，连续空格不形成空单词。',[['按空白提取单词','得到没有空项的单词列表。'],['交换首尾单词','用双指针原地反转单词数组。'],['以单空格连接','输出中每两个相邻单词之间恰好有一个空格。']],'O(n)','O(n)',{s:'  the sky   is blue '},'blue is sky the',[C({s:'hello'},'hello'),C({s:' a  b '},'b a')],`
import "strings"

func reverseWords(s string) string {
    words := strings.Fields(s)
    for left, right := 0, len(words)-1; left < right; left, right = left+1, right-1 {
        words[left], words[right] = words[right], words[left]
    }
    return strings.Join(words, " ")
}`,({s},e)=>{const words=s.trim()?s.trim().split(/ +/):[];A(e,words,'提取单词',[4]);for(let l=0,r=words.length-1;l<r;l++,r--){[words[l],words[r]]=[words[r],words[l]];A(e,words,'交换两端单词',[6],{left:l,right:r},{active:[l,r]});}return words.join(' ');},v=>ascii(v.s));
add(6,'将字符串按从上到下、再斜向上的 Z 字形写入 numRows 行，最后逐行读取，返回转换后的字符串。','numRows 为正整数；只有一行或行数不少于字符数时结果不变。',[['维护当前行和方向','从第 0 行向下开始移动。'],['到边界折返','触及第一行或最后一行就改变方向，每次将字符加入当前行。'],['按行连接','从上到下连接各行，得到 Z 字形读取结果。']],'O(n)','O(n)',{s:'PAYPALISHIRING',numRows:3},'PAHNAPLSIIGYIR',[C({s:'AB',numRows:1},'AB'),C({s:'ABC',numRows:5},'ABC')],`
import "strings"

func convert(s string, numRows int) string {
    if numRows == 1 || numRows >= len(s) { return s }
    rows := make([][]byte, numRows)
    row, direction := 0, -1
    for i := 0; i < len(s); i++ {
        rows[row] = append(rows[row], s[i])
        if row == 0 || row == numRows-1 { direction = -direction }
        row += direction
    }
    var result strings.Builder
    for _, row := range rows { result.Write(row) }
    return result.String()
}`,({s,numRows},e)=>{if(numRows===1||numRows>=s.length){T(e,s,'单行即可读取',[4]);return s;}const rows=Array(numRows).fill('');let row=0,d=-1;A(e,rows,'初始化各行',[5],{row,d});for(let i=0;i<s.length;i++){rows[row]+=s[i];A(e,rows,'将字符写入当前行',[8],{i,row,d,char:s[i]},{active:[row]});if(row===0||row===numRows-1)d=-d;row+=d;}return rows.join('');},v=>{ascii(v.s);integer(v.numRows,1,30,'numRows');});
add(28,'在字符串 haystack 中找出 needle 第一次出现的起始下标；不存在时返回 -1。','字符为小写英文字母；空 needle 的匹配位置定义为 0。',[['枚举起始下标','只枚举剩余长度足够容纳 needle 的位置。'],['逐字符比较','从当前起点开始，比较两个串对应字符。'],['返回第一个完整匹配','匹配长度达到 needle 长度时立即返回起点。']],'O(nm)','O(1)',{haystack:'sadbutsad',needle:'sad'},0,[C({haystack:'leetcode',needle:'leeto'},-1),C({haystack:'abc',needle:''},0)],`
func strStr(haystack string, needle string) int {
    for start := 0; start+len(needle) <= len(haystack); start++ {
        matched := 0
        for matched < len(needle) && haystack[start+matched] == needle[matched] {
            matched++
        }
        if matched == len(needle) { return start }
    }
    return -1
}`,({haystack,needle},e)=>{T(e,haystack,'准备寻找第一次匹配',[2],{needle},{secondary:needle});for(let start=0;start+needle.length<=haystack.length;start++){let j=0;while(j<needle.length&&haystack[start+j]===needle[j]){j++;T(e,haystack,'匹配一个字符',[4,5],{start,matched:j},{range:[start,start+j-1],secondary:needle,secondaryActive:[j-1]});}if(j===needle.length)return start;T(e,haystack,'当前起点不匹配',[7],{start,matched:j},{active:[start+j],secondary:needle});}return-1;},v=>{ascii(v.haystack);ascii(v.needle);});
add(68,'给定单词数组和每行宽度 maxWidth，将单词排成左右对齐的文本，返回每一行字符串。','每个单词非空且长度不超过行宽；普通行尽可能均匀分配空格，多余空格靠左；最后一行左对齐。',[['贪心装入一行','在单词之间至少留一格，尽可能放入更多单词。'],['计算每个间隙空格','非末行将剩余空格均分，余数分配给靠左的间隙。'],['补齐并输出','末行或单词独占一行时左对齐，并在右侧补空格。']],'O(输出字符总数)','O(maxWidth) 临时空间，不计输出',{words:['This','is','an','example','of','text','justification.'],maxWidth:16},['This    is    an','example  of text','justification.  '],[C({words:['a'],maxWidth:3},['a  ']),C({words:['a','b','c','d'],maxWidth:3},['a b','c d'])],`
import "strings"

func fullJustify(words []string, maxWidth int) []string {
    result := []string{}
    for left := 0; left < len(words); {
        right, letters := left, 0
        for right < len(words) && letters+len(words[right])+right-left <= maxWidth {
            letters += len(words[right]); right++
        }
        gaps := right-left-1
        var line strings.Builder
        if right == len(words) || gaps == 0 {
            line.WriteString(strings.Join(words[left:right], " "))
            line.WriteString(strings.Repeat(" ", maxWidth-line.Len()))
        } else {
            spaces, extra := (maxWidth-letters)/gaps, (maxWidth-letters)%gaps
            for i := left; i < right; i++ {
                line.WriteString(words[i])
                if i+1 < right {
                    count := spaces
                    if i-left < extra { count++ }
                    line.WriteString(strings.Repeat(" ", count))
                }
            }
        }
        result = append(result, line.String())
        left = right
    }
    return result
}`,({words,maxWidth:w},e)=>{const out=[];A(e,words,'从首个单词开始排版',[5],{w});for(let l=0;l<words.length;){let r=l,letters=0;while(r<words.length&&letters+words[r].length+r-l<=w){letters+=words[r].length;r++;A(e,words,'贪心加入当前行',[7,8],{l,r,letters},{range:[l,r-1]});}let line='';const gaps=r-l-1;if(r===words.length||!gaps)line=words.slice(l,r).join(' ').padEnd(w,' ');else{const base=Math.floor((w-letters)/gaps),extra=(w-letters)%gaps;for(let i=l;i<r;i++)line+=words[i]+(i<r-1?' '.repeat(base+(i-l<extra?1:0)):'');}out.push(line);T(e,line,'分配空格并完成一行',[12,16,26],{lines:out.length,width:line.length});l=r;}return out;},v=>{array(v.words,'words',40);integer(v.maxWidth,1,60,'maxWidth');invariant(v.words.length>0,'words 不能为空。');v.words.forEach(s=>{ascii(s);invariant(s.length>0&&!s.includes(' ')&&s.length<=v.maxWidth,'单词非空且不能含空格，长度不能超过行宽。');});});
add(125,'给定字符串，只保留字母数字并忽略大小写后，判断它是否为正读反读相同的回文串。','本演示输入使用 ASCII 字符；空串视为回文。',[['两端向内扫描','左右指针分别从字符串两端出发。'],['略过非字母数字','遇到标点和空格时单独移动相应指针。'],['忽略大小写比较','有效字符不相等即可返回 false，否则继续夹逼。']],'O(n)','O(1)',{s:'A man, a plan, a canal: Panama'},true,[C({s:'race a car'},false),C({s:' '},true)],`
func isPalindrome(s string) bool {
    valid := func(c byte) bool { return c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c >= '0' && c <= '9' }
    lower := func(c byte) byte { if c >= 'A' && c <= 'Z' { return c+32 }; return c }
    for left, right := 0, len(s)-1; left < right; {
        if !valid(s[left]) { left++; continue }
        if !valid(s[right]) { right--; continue }
        if lower(s[left]) != lower(s[right]) { return false }
        left++; right--
    }
    return true
}`,({s},e)=>{let l=0,r=s.length-1;const valid=c=>/[A-Za-z0-9]/.test(c);T(e,s,'从两端比较',[4],{l,r});while(l<r){T(e,s,'检查两端有效字符',[5,6,7],{l,r},{active:[l,r],pointers:{left:l,right:r}});if(!valid(s[l])){l++;continue;}if(!valid(s[r])){r--;continue;}if(s[l].toLowerCase()!==s[r].toLowerCase())return false;l++;r--;}return true;},v=>ascii(v.s));
add(392,'给定字符串 s 和 t，判断能否从 t 中删除若干字符而不改变剩余字符顺序，得到 s。','允许删除零个或全部字符；空字符串是任意字符串的子序列。',[['分别指向两个串','i 表示 s 中下一个待匹配字符。'],['顺序扫描较长串','t 中字符等于 s[i] 时，推进 i；否则只扫描 t。'],['检查是否全部匹配','i 到达 s 的末尾时，说明 s 是 t 的子序列。']],'O(|t|)','O(1)',{s:'abc',t:'ahbgdc'},true,[C({s:'axc',t:'ahbgdc'},false),C({s:'',t:'abc'},true)],`
func isSubsequence(s string, t string) bool {
    i := 0
    for j := 0; j < len(t) && i < len(s); j++ {
        if s[i] == t[j] { i++ }
    }
    return i == len(s)
}`,({s,t},e)=>{let i=0;T(e,t,'开始匹配子序列',[2],{i},{secondary:s});for(let j=0;j<t.length&&i<s.length;j++){if(s[i]===t[j])i++;T(e,t,'扫描目标串并推进匹配',[4],{i,j},{active:[j],secondary:s,secondaryActive:i?[i-1]:[]});}return i===s.length;},v=>{ascii(v.s);ascii(v.t);});
add(167,'给定非递减整数数组 numbers 和目标值 target，返回两项之和等于目标值的两个下标，下标从 1 开始。','不能重复使用同一元素；题目保证恰有一个解。',[['两端设置指针','较小数从左端取，较大数从右端取。'],['按和调整指针','当前和太小就增加左指针，太大就减少右指针。'],['相等时返回','将两个零基下标分别加一后返回。']],'O(n)','O(1)',{numbers:[2,7,11,15],target:9},[1,2],[C({numbers:[-1,0],target:-1},[1,2]),C({numbers:[2,3,4],target:6},[1,3])],`
func twoSum(numbers []int, target int) []int {
    left, right := 0, len(numbers)-1
    for left < right {
        sum := numbers[left]+numbers[right]
        if sum == target { return []int{left+1, right+1} }
        if sum < target { left++ } else { right-- }
    }
    return []int{}
}`,({numbers:a,target},e)=>{let l=0,r=a.length-1;A(e,a,'初始化双指针',[2],{target});while(l<r){const sum=a[l]+a[r];A(e,a,'比较两端之和',[4,5,6],{sum,target},{active:[l,r],pointers:{left:l,right:r}});if(sum===target)return[l+1,r+1];if(sum<target)l++;else r--;}return[];},v=>{sorted(v.numbers);integer(v.target,-1e9,1e9,'target');let n=0;for(let i=0;i<v.numbers.length;i++)for(let j=i+1;j<v.numbers.length;j++)if(v.numbers[i]+v.numbers[j]===v.target)n++;invariant(n===1,'本题要求恰好一对下标满足目标和。');});
add(11,'给定各条竖线的高度，选两条竖线与横轴构成容器，返回能容纳的最大水量。','容器不能倾斜；容量等于两线间距乘以较矮高度。',[['从最宽的容器开始','左右指针位于数组两端，计算当前面积。'],['移动较矮的竖线','移动较高边只会缩小宽度，无法突破当前矮边限制。'],['维护最大面积','不断夹逼，保存遍历过程中最大的面积。']],'O(n)','O(1)',{height:[1,8,6,2,5,4,8,3,7]},49,[C({height:[1,1]},1),C({height:[0,0,0]},0)],`
func maxArea(height []int) int {
    left, right, best := 0, len(height)-1, 0
    for left < right {
        low := height[left]
        if height[right] < low { low = height[right] }
        area := low*(right-left)
        if area > best { best = area }
        if height[left] < height[right] { left++ } else { right-- }
    }
    return best
}`,({height},e)=>{let l=0,r=height.length-1,best=0;A(e,height,'从最大宽度开始',[2],{best},{bars:true});while(l<r){const area=Math.min(height[l],height[r])*(r-l);best=Math.max(best,area);A(e,height,'计算容量并移动矮边',[4,5,6,7,8],{area,best},{active:[l,r],range:[l,r],bars:true});if(height[l]<height[r])l++;else r--;}return best;},v=>{nonneg(v.height,'height');invariant(v.height.length>=2,'至少需要两条竖线。');});
add(15,'给定整数数组 nums，返回所有由三个不同下标组成且元素之和为零的三元组，结果中不能出现重复三元组。','输出三元组内部升序，演示结果按扫描顺序排列；同值元素允许来自不同下标。',[['排序并固定第一个数','跳过重复的固定值，避免生成重复组合。'],['剩余部分双指针','比较三数和，小于零移动左边，大于零移动右边。'],['命中后去重','记录三元组，并跳过左右两边的相同值。']],'O(n²)','O(log n) 排序栈，不计输出',{nums:[-1,0,1,2,-1,-4]},[[-1,-1,2],[-1,0,1]],[C({nums:[0,0,0,0]},[[0,0,0]]),C({nums:[1,2,-2,-1]},[])],`
import "sort"

func threeSum(nums []int) [][]int {
    sort.Ints(nums)
    result := [][]int{}
    for i := 0; i+2 < len(nums); i++ {
        if i > 0 && nums[i] == nums[i-1] { continue }
        left, right := i+1, len(nums)-1
        for left < right {
            sum := nums[i]+nums[left]+nums[right]
            if sum < 0 { left++ } else if sum > 0 { right-- } else {
                result = append(result, []int{nums[i],nums[left],nums[right]})
                a, b := nums[left], nums[right]
                for left < right && nums[left] == a { left++ }
                for left < right && nums[right] == b { right-- }
            }
        }
    }
    return result
}`,({nums},e)=>{A(e,nums,'排序前的数组',[4]);nums.sort((a,b)=>a-b);const out=[];A(e,nums,'排序后固定第一个数',[4]);for(let i=0;i+2<nums.length;i++){if(i&&nums[i]===nums[i-1])continue;let l=i+1,r=nums.length-1;while(l<r){const sum=nums[i]+nums[l]+nums[r];A(e,nums,'比较三数之和',[10,11],{i,l,r,sum,found:out},{active:[i,l,r],pointers:{fixed:i,left:l,right:r}});if(sum<0)l++;else if(sum>0)r--;else{out.push([nums[i],nums[l],nums[r]]);A(e,nums,'记录不重复的三元组',[12],{i,l,r,sum,found:out},{active:[i,l,r]});const a=nums[l],b=nums[r];while(l<r&&nums[l]===a)l++;while(l<r&&nums[r]===b)r--;}}}return out;},v=>numbers(v.nums,'nums',40));
add(209,'给定正整数数组 nums 和正整数 target，返回总和大于等于 target 的最短连续子数组长度；不存在时返回 0。','所有数组元素必须严格大于零，因此扩大窗口会增加总和。',[['右端扩张窗口','把新元素加入窗口总和。'],['满足条件时收缩','总和达到目标后更新最短长度，并不断删除左端元素。'],['返回最小长度','遍历过程中保留最短可行窗口，没有找到时返回零。']],'O(n)','O(1)',{target:7,nums:[2,3,1,2,4,3]},2,[C({target:4,nums:[1,4,4]},1),C({target:11,nums:[1,1,1,1]},0)],`
func minSubArrayLen(target int, nums []int) int {
    left, sum, best := 0, 0, len(nums)+1
    for right, value := range nums {
        sum += value
        for sum >= target {
            if right-left+1 < best { best = right-left+1 }
            sum -= nums[left]; left++
        }
    }
    if best > len(nums) { return 0 }
    return best
}`,({nums,target},e)=>{let l=0,sum=0,best=nums.length+1;A(e,nums,'初始化空窗口',[2],{sum,target});for(let r=0;r<nums.length;r++){sum+=nums[r];A(e,nums,'向右扩张窗口',[4],{sum,best},{range:[l,r],active:[r]});while(sum>=target){best=Math.min(best,r-l+1);A(e,nums,'更新答案后缩小窗口',[6,7],{sum,best},{range:[l,r],active:[l]});sum-=nums[l++];}}return best>nums.length?0:best;},v=>{numbers(v.nums);invariant(v.nums.every(x=>x>0),'nums 必须只含正整数。');integer(v.target,1,1e9,'target');});
add(3,'给定字符串 s，返回不包含重复字符的最长连续子串的长度。','子串必须连续；空字符串的答案为 0。',[['记录字符最后位置','哈希表保存每个字符最近出现的下标。'],['移动窗口左边界','重复字符仍在窗口内时，把 left 跳到上次出现位置之后。'],['计算最长窗口','每次用 right-left+1 更新答案。']],'O(n)','O(字符集大小)',{s:'abcabcbb'},3,[C({s:''},0),C({s:'abba'},2)],`
func lengthOfLongestSubstring(s string) int {
    last := map[byte]int{}
    left, best := 0, 0
    for right := 0; right < len(s); right++ {
        if at, ok := last[s[right]]; ok && at >= left { left = at+1 }
        last[s[right]] = right
        if right-left+1 > best { best = right-left+1 }
    }
    return best
}`,({s},e)=>{const last=new Map();let l=0,best=0;T(e,s,'初始化无重复窗口',[2,3],{l,best});for(let r=0;r<s.length;r++){if(last.has(s[r]))l=Math.max(l,last.get(s[r])+1);last.set(s[r],r);best=Math.max(best,r-l+1);T(e,s,'避免重复并更新最长长度',[5,6,7],{left:l,right:r,best,last:Object.fromEntries(last)},{range:[l,r],active:[r],pointers:{left:l,right:r}});}return best;},v=>ascii(v.s));
add(30,'给定字符串 s 和等长单词数组 words，返回所有恰好由 words 中每个单词各出现一次而串联得到的子串起始下标。','单词可以按任意顺序串联；重复单词必须满足给定次数；输出下标升序。',[['按单词长度分组扫描','分别从每个余数位置出发，窗口按单词长度移动。'],['维护词频窗口','遇到非法单词就清空；某词过量时从左删除直到数量合法。'],['记录完整串联','窗口单词数等于 words 长度时记录左边界，最终排序下标。']],'O(|s|·k)，k 为单词长度（含切片与哈希）','O(|words|·k + 输出)',{s:'barfoothefoobarman',words:['foo','bar']},[0,9],[C({s:'wordgoodgoodgoodbestword',words:['word','good','best','good']},[8]),C({s:'abc',words:['d']},[])],`
import "sort"

func findSubstring(s string, words []string) []int {
    result := []int{}
    if len(words) == 0 { return result }
    width, need := len(words[0]), map[string]int{}
    for _, word := range words { need[word]++ }
    for offset := 0; offset < width; offset++ {
        left, count, have := offset, 0, map[string]int{}
        for right := offset; right+width <= len(s); right += width {
            word := s[right:right+width]
            if need[word] == 0 { have = map[string]int{}; count = 0; left = right+width; continue }
            have[word]++; count++
            for have[word] > need[word] {
                have[s[left:left+width]]--; left += width; count--
            }
            if count == len(words) { result = append(result, left) }
        }
    }
    sort.Ints(result)
    return result
}`,({s,words},e)=>{const out=[],w=words[0].length,need=new Map();words.forEach(x=>need.set(x,(need.get(x)||0)+1));T(e,s,'按词长划分扫描起点',[6,7],{width:w,need:Object.fromEntries(need)});for(let offset=0;offset<w;offset++){let l=offset,count=0;const have=new Map();for(let r=offset;r+w<=s.length;r+=w){const word=s.slice(r,r+w);if(!need.has(word)){have.clear();count=0;l=r+w;T(e,s,'非法单词重置窗口',[12],{left:l,word},{range:[r,r+w-1]});continue;}have.set(word,(have.get(word)||0)+1);count++;while(have.get(word)>need.get(word)){const old=s.slice(l,l+w);have.set(old,have.get(old)-1);l+=w;count--;}if(count===words.length)out.push(l);T(e,s,'校验窗口词频并记录起点',[13,14,15,17],{left:l,count,have:Object.fromEntries(have),found:out},{range:[l,r+w-1]});}}return out.sort((a,b)=>a-b);},v=>{ascii(v.s);array(v.words,'words',25);invariant(v.words.length>0,'至少需要一个单词。');v.words.forEach(s=>ascii(s));const w=v.words[0].length;invariant(w>0&&v.words.every(s=>s.length===w),'单词必须非空且等长。');});
add(76,'给定字符串 s 和 t，返回 s 中覆盖 t 所有字符且满足重复次数的最短连续子串；不存在时返回空串。','区分大小写；t 中重复字符需要分别覆盖；同长度时保留最早发现的窗口。',[['建立目标字符频率','remaining 表示仍缺少的字符总数。'],['右端加入字符','消耗目标频数，所需字符到齐后开始从左收缩。'],['收缩到刚好失效','每次收缩前更新最优窗口，删除必要字符后重新扩张。']],'O(|s|+|t|)','O(字符集大小)',{s:'ADOBECODEBANC',t:'ABC'},'BANC',[C({s:'a',t:'aa'},''),C({s:'aa',t:'aa'},'aa')],`
func minWindow(s string, t string) string {
    if len(t) == 0 { return "" }
    need := map[byte]int{}
    for i := range t { need[t[i]]++ }
    left, remaining, bestStart, bestLen := 0, len(t), 0, len(s)+1
    for right := 0; right < len(s); right++ {
        if need[s[right]] > 0 { remaining-- }
        need[s[right]]--
        for remaining == 0 {
            if right-left+1 < bestLen { bestStart = left; bestLen = right-left+1 }
            need[s[left]]++
            if need[s[left]] > 0 { remaining++ }
            left++
        }
    }
    if bestLen > len(s) { return "" }
    return s[bestStart:bestStart+bestLen]
}`,({s,t},e)=>{if(!t.length)return'';const need=new Map();for(const c of t)need.set(c,(need.get(c)||0)+1);let l=0,missing=t.length,bestStart=0,bestLen=s.length+1;T(e,s,'初始化目标频率',[3,4,5],{remaining:missing},{secondary:t});for(let r=0;r<s.length;r++){if((need.get(s[r])||0)>0)missing--;need.set(s[r],(need.get(s[r])||0)-1);T(e,s,'加入右侧字符',[7,8],{remaining:missing,bestLen},{range:[l,r],secondary:t});while(!missing){if(r-l+1<bestLen){bestStart=l;bestLen=r-l+1;}T(e,s,'覆盖全部字符，收缩左端',[10,11,12,13],{remaining:missing,bestStart,bestLen},{range:[l,r],active:[l],secondary:t});need.set(s[l],need.get(s[l])+1);if(need.get(s[l])>0)missing++;l++;}}return bestLen>s.length?'':s.slice(bestStart,bestStart+bestLen);},v=>{ascii(v.s);ascii(v.t);});
add(383,'给定赎金信 ransomNote 和杂志 magazine，判断能否从杂志取出字符组成赎金信，每个字符只能使用一次。','两个字符串只含小写英文字母；杂志中的字符顺序不影响可用次数。',[['统计杂志字符','用 26 项计数数组保存每个字母的库存。'],['逐个消耗信件字符','每取一个字符就将相应库存减一。'],['检查是否短缺','任一库存不足即无法构成，否则全部取完后返回 true。']],'O(m+n)','O(1)',{ransomNote:'aa',magazine:'aab'},true,[C({ransomNote:'aa',magazine:'ab'},false),C({ransomNote:'',magazine:''},true)],`
func canConstruct(ransomNote string, magazine string) bool {
    count := [26]int{}
    for i := range magazine { count[magazine[i]-'a']++ }
    for i := range ransomNote {
        index := ransomNote[i]-'a'
        if count[index] == 0 { return false }
        count[index]--
    }
    return true
}`,({ransomNote,magazine},e)=>{const count=Array(26).fill(0);A(e,count,'初始化字母库存',[2],{magazine});for(const c of magazine){count[c.charCodeAt(0)-97]++;A(e,count,'登记杂志中的字母',[3],{char:c},{active:[c.charCodeAt(0)-97]});}for(const c of ransomNote){const i=c.charCodeAt(0)-97;if(!count[i]){A(e,count,'所需字母库存不足',[6],{char:c},{active:[i]});return false;}count[i]--;A(e,count,'使用一枚字母',[7],{char:c},{active:[i]});}return true;},v=>{for(const s of[v.ransomNote,v.magazine]){ascii(s);invariant(/^[a-z]*$/.test(s),'仅支持小写英文字母。');}});
add(205,'给定字符串 s 和 t，判断是否存在一一对应的字符替换，使 s 的每个字符替换后恰好得到 t。','不同源字符不能映射到同一目标字符；字符可以映射到自己。',[['同时建立两个映射','分别保存 s 到 t 和 t 到 s 的映射。'],['逐位置检查冲突','已有映射必须与当前字符对一致。'],['登记未见字符对','任何一边出现冲突就返回 false，扫描结束返回 true。']],'O(n)','O(字符集大小)',{s:'paper',t:'title'},true,[C({s:'foo',t:'bar'},false),C({s:'ab',t:'aa'},false)],`
func isIsomorphic(s string, t string) bool {
    if len(s) != len(t) { return false }
    forward, backward := map[byte]byte{}, map[byte]byte{}
    for i := range s {
        a, b := s[i], t[i]
        if v, ok := forward[a]; ok && v != b { return false }
        if v, ok := backward[b]; ok && v != a { return false }
        forward[a] = b; backward[b] = a
    }
    return true
}`,({s,t},e)=>{if(s.length!==t.length)return false;const f=new Map(),b=new Map();T(e,s,'准备双向字符映射',[3],{},{secondary:t});for(let i=0;i<s.length;i++){T(e,s,'检查双向映射是否一致',[5,6,7],{i,forward:Object.fromEntries(f),backward:Object.fromEntries(b)},{active:[i],secondary:t,secondaryActive:[i]});if(f.has(s[i])&&f.get(s[i])!==t[i]||b.has(t[i])&&b.get(t[i])!==s[i])return false;f.set(s[i],t[i]);b.set(t[i],s[i]);T(e,s,'登记字符对应关系',[8],{i,forward:Object.fromEntries(f)},{active:[i],secondary:t,secondaryActive:[i]});}return true;},v=>{ascii(v.s);ascii(v.t);});
add(290,'给定模式 pattern 和由空格分隔的单词串 s，判断模式中的字母与单词能否建立一一对应关系。','pattern 只含小写字母；每个字母映射一个完整单词，不同字母不能映射到同一单词。',[['拆出所有单词','单词数必须等于模式长度。'],['建立双向对应','同时维护字母到单词和单词到字母的映射。'],['逐个检查一致性','任一映射冲突就返回 false，否则匹配成功。']],'O(|s|+|pattern|)','O(|s|+|pattern|)',{pattern:'abba',s:'dog cat cat dog'},true,[C({pattern:'abba',s:'dog cat cat fish'},false),C({pattern:'ab',s:'dog dog'},false)],`
import "strings"

func wordPattern(pattern string, s string) bool {
    words := strings.Fields(s)
    if len(words) != len(pattern) { return false }
    forward, backward := map[byte]string{}, map[string]byte{}
    for i := range pattern {
        char, word := pattern[i], words[i]
        if v, ok := forward[char]; ok && v != word { return false }
        if v, ok := backward[word]; ok && v != char { return false }
        forward[char] = word; backward[word] = char
    }
    return true
}`,({pattern,s},e)=>{const words=s.trim()?s.trim().split(/ +/):[];if(words.length!==pattern.length)return false;const f=new Map(),b=new Map();A(e,words,'拆分单词并检查长度',[4,5],{pattern});for(let i=0;i<words.length;i++){const a=pattern[i],w=words[i];A(e,words,'检查字母与单词双向对应',[8,9,10],{i,char:a,word:w,forward:Object.fromEntries(f)},{active:[i]});if(f.has(a)&&f.get(a)!==w||b.has(w)&&b.get(w)!==a)return false;f.set(a,w);b.set(w,a);A(e,words,'登记对应关系',[11],{forward:Object.fromEntries(f)},{active:[i]});}return true;},v=>{ascii(v.pattern);ascii(v.s);invariant(/^[a-z]*$/.test(v.pattern),'pattern 只能含小写字母。');});
add(242,'给定两个字符串 s 和 t，判断 t 是否能通过重新排列 s 中的字母得到，即是否互为字母异位词。','只含小写英文字母；每个字母的出现次数都必须相同。',[['先比较总长度','长度不同一定不是字母异位词。'],['统计一个串再抵消','为 s 中字符加一，为 t 中字符减一。'],['检查计数是否全零','全部为零说明字母种类和次数完全一致。']],'O(n)','O(1)',{s:'anagram',t:'nagaram'},true,[C({s:'rat',t:'car'},false),C({s:'',t:''},true)],`
func isAnagram(s string, t string) bool {
    if len(s) != len(t) { return false }
    counts := [26]int{}
    for i := range s {
        counts[s[i]-'a']++
        counts[t[i]-'a']--
    }
    for _, count := range counts { if count != 0 { return false } }
    return true
}`,({s,t},e)=>{if(s.length!==t.length)return false;const c=Array(26).fill(0);A(e,c,'字母计数归零',[3]);for(let i=0;i<s.length;i++){c[s.charCodeAt(i)-97]++;c[t.charCodeAt(i)-97]--;A(e,c,'增加与抵消字母计数',[5,6],{i,s:s[i],t:t[i]},{active:[s.charCodeAt(i)-97,t.charCodeAt(i)-97]});}return c.every(x=>x===0);},v=>{for(const s of[v.s,v.t]){ascii(s);invariant(/^[a-z]*$/.test(s),'仅支持小写英文字母。');}});
add(49,'将字符串数组中的所有字母异位词分为同一组，返回分组结果，每个输入字符串都必须保留。','每个字符串仅含小写字母，允许空串与重复串；演示按组首次出现顺序返回。',[['将单词内部排序','字母异位词排序后具有相同的键。'],['哈希表定位分组','键第一次出现时建立新组，之后追加到已有组。'],['输出所有分组','保留组内输入顺序，以及组首次出现的顺序。']],'O(nk log k)，k 为最长单词长度','O(nk)',{strs:['eat','tea','tan','ate','nat','bat']},[['eat','tea','ate'],['tan','nat'],['bat']],[C({strs:['']},[['']]),C({strs:[]},[])],`
import "sort"

func groupAnagrams(strs []string) [][]string {
    result := [][]string{}
    index := map[string]int{}
    for _, word := range strs {
        chars := []byte(word)
        sort.Slice(chars, func(i, j int) bool { return chars[i] < chars[j] })
        key := string(chars)
        group, ok := index[key]
        if !ok { group = len(result); index[key] = group; result = append(result, []string{}) }
        result[group] = append(result[group], word)
    }
    return result
}`,({strs},e)=>{const out=[],index=new Map();A(e,strs,'准备按排序键分组',[4,5]);strs.forEach((word,i)=>{const key=[...word].sort().join('');if(!index.has(key)){index.set(key,out.length);out.push([]);}out[index.get(key)].push(word);e({kind:'table',columns:['排序键','组内单词'],rows:[...index].map(([k,g])=>[k,out[g].join(', ')])},'将当前单词归入对应组',`「${word}」排序后的键为「${key}」。`,[7,8,11,12],{i,key,groups:out.length});});return out;},v=>{array(v.strs,'strs',40);v.strs.forEach(s=>{ascii(s);invariant(/^[a-z]*$/.test(s),'仅支持小写英文字母。');});});
add(1,'给定整数数组 nums 和整数 target，返回数组中两个不同元素相加等于 target 的下标，下标从 0 开始。','同一个元素不能使用两次；题目保证只有一组解。',[['扫描并查询补数','当前数 value 需要与 target-value 配对。'],['先查询再登记','补数已在哈希表中时返回，避免重复使用当前下标。'],['保存当前位置','未找到补数时记录当前值和下标，继续扫描。']],'O(n) 平均','O(n)',{nums:[2,7,11,15],target:9},[0,1],[C({nums:[3,3],target:6},[0,1]),C({nums:[3,2,4],target:6},[1,2])],`
func twoSum(nums []int, target int) []int {
    seen := map[int]int{}
    for i, value := range nums {
        if j, ok := seen[target-value]; ok { return []int{j,i} }
        seen[value] = i
    }
    return []int{}
}`,({nums,target},e)=>{const seen=new Map();A(e,nums,'初始化数值下标表',[2],{target});for(let i=0;i<nums.length;i++){const need=target-nums[i];A(e,nums,'查询当前数字所需补数',[4],{i,value:nums[i],need,seen:Object.fromEntries(seen)},{active:[i]});if(seen.has(need))return[seen.get(need),i];seen.set(nums[i],i);}return[];},v=>{numbers(v.nums);integer(v.target,-1e9,1e9,'target');let n=0;for(let i=0;i<v.nums.length;i++)for(let j=i+1;j<v.nums.length;j++)if(v.nums[i]+v.nums[j]===v.target)n++;invariant(n===1,'本题需要恰好一组解。');});
add(202,'给定正整数 n，反复将它替换为各位数字平方和，判断最终是否能得到 1；若陷入循环则返回 false。','n 必须为正整数；重复出现同一数就意味着进入循环。',[['记录已见数字','用集合存储每次变换前的数。'],['计算数位平方和','逐位取末位数字，将它的平方加入新值。'],['识别终点或环','到达 1 即成功，遇到已见数则失败。']],'O(log n + C)，C 为有限循环状态数','O(log n + C)',{n:19},true,[C({n:2},false),C({n:1},true)],`
func isHappy(n int) bool {
    seen := map[int]bool{}
    for n != 1 && !seen[n] {
        seen[n] = true
        next := 0
        for value := n; value > 0; value /= 10 {
            digit := value%10
            next += digit*digit
        }
        n = next
    }
    return n == 1
}`,({n},e)=>{const seen=new Set(),path=[n];A(e,path,'从输入数字出发',[2],{n});while(n!==1&&!seen.has(n)){seen.add(n);let next=0;for(let v=n;v>0;v=Math.floor(v/10))next+=(v%10)**2;n=next;path.push(n);A(e,path,'计算各位数字平方和',[6,7,8,10],{n,repeated:seen.has(n)},{active:[path.length-1]});}return n===1;},v=>integer(v.n,1,1e9,'n'));
add(219,'给定数组 nums 和非负整数 k，判断是否存在两个不同下标 i、j，使 nums[i] 等于 nums[j] 且 |i-j| 不超过 k。','只需返回是否存在；k 为 0 时无法使用两个不同下标。',[['记录最近一次出现','哈希表保存每个值的最近下标。'],['检查重复距离','遇到相同数字时计算当前下标与最近下标的差。'],['更新最近下标','最近一次距离最短，若仍超过 k 就登记当前下标继续扫描。']],'O(n) 平均','O(n)',{nums:[1,2,3,1],k:3},true,[C({nums:[1,2,3,1,2,3],k:2},false),C({nums:[1,1],k:0},false)],`
func containsNearbyDuplicate(nums []int, k int) bool {
    last := map[int]int{}
    for i, value := range nums {
        if j, ok := last[value]; ok && i-j <= k { return true }
        last[value] = i
    }
    return false
}`,({nums,k},e)=>{const last=new Map();A(e,nums,'准备记录最近位置',[2],{k});for(let i=0;i<nums.length;i++){const j=last.get(nums[i]);A(e,nums,'检查最近相同元素距离',[4],{i,previous:j??'无',distance:j===undefined?'无':i-j,k},{active:j===undefined?[i]:[j,i]});if(j!==undefined&&i-j<=k)return true;last.set(nums[i],i);}return false;},v=>{numbers(v.nums);integer(v.k,0,1e9,'k');});
add(128,'给定未排序整数数组，找出数值连续的最长序列长度，序列元素不要求在原数组中相邻。','重复数字不延长序列；要求平均 O(n) 时间。',[['哈希集合去重','所有数字加入集合，支持平均常数时间查询。'],['只从序列开头延伸','存在 value-1 时跳过，避免重复扫描同一段序列。'],['连续查询下一个数','从起点逐个延伸，更新最长序列长度。']],'O(n) 平均','O(n)',{nums:[100,4,200,1,3,2]},4,[C({nums:[]},0),C({nums:[0,0,1]},2)],`
func longestConsecutive(nums []int) int {
    set := map[int]bool{}
    for _, value := range nums { set[value] = true }
    best := 0
    for value := range set {
        if set[value-1] { continue }
        length := 0
        for set[value+length] { length++ }
        if length > best { best = length }
    }
    return best
}`,({nums},e)=>{const set=new Set(nums);let best=0;A(e,nums,'建立去重集合',[2,3],{unique:[...set]});for(const start of set){if(set.has(start-1)){A(e,nums,'跳过不是起点的值',[6],{start,best},{active:[nums.indexOf(start)]});continue;}let length=0;while(set.has(start+length)){length++;best=Math.max(best,length);A(e,nums,'从序列起点向后延伸',[8,9],{start,length,best},{active:nums.flatMap((n,i)=>n>=start&&n<start+length?[i]:[])});}}return best;},v=>numbers(v.nums));
add(228,'给定严格递增且无重复的整数数组，将每段连续整数压缩为区间字符串，返回覆盖所有元素的最小有序区间列表。','单点写成 a，多个连续整数写成 a->b；不得覆盖输入中没有的整数。',[['标记一段的起点','left 指向当前还未输出的最小元素。'],['延伸连续整数段','只要下一个值恰好比当前值大一就继续。'],['输出单点或区间','根据首尾下标是否相同选择格式，然后处理下一段。']],'O(n)','O(1)，不计输出',{nums:[0,1,2,4,5,7]},['0->2','4->5','7'],[C({nums:[]},[]),C({nums:[-1]},['-1'])],`
import "strconv"

func summaryRanges(nums []int) []string {
    result := []string{}
    for left := 0; left < len(nums); {
        right := left
        for right+1 < len(nums) && nums[right+1]-nums[right] == 1 { right++ }
        item := strconv.Itoa(nums[left])
        if right > left { item += "->"+strconv.Itoa(nums[right]) }
        result = append(result, item)
        left = right+1
    }
    return result
}`,({nums},e)=>{const out=[];A(e,nums,'寻找连续区间',[5]);for(let l=0;l<nums.length;){let r=l;while(r+1<nums.length&&nums[r+1]-nums[r]===1){r++;A(e,nums,'延伸当前连续区间',[7],{left:l,right:r},{range:[l,r]});}out.push(l===r?String(nums[l]):`${nums[l]}->${nums[r]}`);A(e,nums,'完成并输出区间',[8,9,10],{ranges:out},{range:[l,r],done:Array.from({length:r+1},(_,i)=>i)});l=r+1;}return out;},v=>{sorted(v.nums);invariant(v.nums.every((x,i)=>!i||v.nums[i-1]<x),'数组必须严格递增，不能重复。');});
const intervals=v=>{array(v,'区间数组',50);v.forEach(p=>{numbers(p,'区间',2);invariant(p.length===2&&p[0]<=p[1],'每个区间须为 [起点,终点] 且起点不大于终点。');});};
const I=(e,v,title,lines,vars={},extra={})=>e({kind:'intervals',intervals:v,...extra},title,'横轴表示区间端点，当前区间与已形成的结果同步变化。',lines,vars);
add(56,'给定若干闭区间 intervals，合并所有互相重叠的区间，返回覆盖原来所有区间且互不重叠的区间列表。','端点相接也算重叠，例如 [1,4] 和 [4,5] 合并为 [1,5]。',[['按左端点排序','排序后只需与最后一个已合并区间比较。'],['重叠就扩展右端点','当前左端点不超过上一段右端点时，合并为更大的区间。'],['不重叠就新增区间','当前段与前面的结果分离，直接加入结果。']],'O(n log n)','O(log n) 排序栈，不计输出',{intervals:[[1,3],[2,6],[8,10],[15,18]]},[[1,6],[8,10],[15,18]],[C({intervals:[[1,4],[4,5]]},[[1,5]]),C({intervals:[]},[])],`
import "sort"

func merge(intervals [][]int) [][]int {
    sort.Slice(intervals, func(i, j int) bool { return intervals[i][0] < intervals[j][0] })
    result := [][]int{}
    for _, current := range intervals {
        n := len(result)
        if n == 0 || current[0] > result[n-1][1] {
            result = append(result, []int{current[0], current[1]})
        } else if current[1] > result[n-1][1] {
            result[n-1][1] = current[1]
        }
    }
    return result
}`,({intervals:a},e)=>{I(e,a,'按左端点排序前',[4]);a.sort((x,y)=>x[0]-y[0]);const out=[];for(let i=0;i<a.length;i++){const p=a[i];if(!out.length||p[0]>out.at(-1)[1])out.push([...p]);else out.at(-1)[1]=Math.max(out.at(-1)[1],p[1]);I(e,a,'合并当前区间',[8,9,10,11],{i,merged:out},{active:[i]});I(e,out,'当前合并结果',[14],{processed:i+1},{active:[out.length-1]});}return out;},v=>intervals(v.intervals));
add(57,'给定按起点排序且互不重叠的闭区间数组 intervals 和新区间 newInterval，插入新区间并合并必要的重叠段。','原区间互不重叠，端点相接按重叠处理；结果继续按起点升序排列。',[['保留新区间左侧部分','右端点小于新区间起点的区间不会受影响。'],['合并所有重叠部分','当前区间起点不超过新区间右端点时扩展新区间。'],['追加新区间和右侧部分','重叠段处理结束后直接保留剩余区间。']],'O(n)','O(1)，不计输出',{intervals:[[1,2],[3,5],[6,7],[8,10],[12,16]],newInterval:[4,8]},[[1,2],[3,10],[12,16]],[C({intervals:[],newInterval:[5,7]},[[5,7]]),C({intervals:[[1,5]],newInterval:[2,3]},[[1,5]])],`
func insert(intervals [][]int, newInterval []int) [][]int {
    result := [][]int{}
    i := 0
    start, end := newInterval[0], newInterval[1]
    for i < len(intervals) && intervals[i][1] < start {
        result = append(result, intervals[i]); i++
    }
    for i < len(intervals) && intervals[i][0] <= end {
        if intervals[i][0] < start { start = intervals[i][0] }
        if intervals[i][1] > end { end = intervals[i][1] }
        i++
    }
    result = append(result, []int{start,end})
    return append(result, intervals[i:]...)
}`,({intervals:a,newInterval:p},e)=>{const out=[];let i=0,[start,end]=p;I(e,[...a,[start,end]],'观察待插入区间',[4],{start,end},{active:[a.length]});while(i<a.length&&a[i][1]<start){out.push([...a[i]]);I(e,a,'保留左侧区间',[5,6],{i,result:out},{active:[i++]});}while(i<a.length&&a[i][0]<=end){start=Math.min(start,a[i][0]);end=Math.max(end,a[i][1]);I(e,[...a,[start,end]],'扩展待插入区间',[8,9,10],{i,start,end},{active:[i,a.length]});i++;}out.push([start,end]);out.push(...a.slice(i).map(x=>[...x]));I(e,out,'插入完成并保留右侧区间',[13,14],{result:out});return out;},v=>{intervals(v.intervals);intervals([v.newInterval]);invariant(v.intervals.every((p,i)=>!i||v.intervals[i-1][1]<p[0]),'原区间必须按起点排序且互不重叠。');});
add(452,'每个闭区间表示一个气球的水平范围，一支竖直向上的箭能引爆包含其横坐标的所有气球，返回最少需要多少支箭。','箭可以射在端点，端点相同的气球可以共用一支箭。',[['按右端点升序排序','优先处理结束最早的气球。'],['在最早右端点射箭','该位置尽可能靠右，便于覆盖后续气球。'],['遇到未覆盖气球再射箭','若下一气球起点大于箭位置，必须增加一支箭。']],'O(n log n)','O(log n) 排序栈',{points:[[10,16],[2,8],[1,6],[7,12]]},2,[C({points:[]},0),C({points:[[1,2],[2,3],[3,4],[4,5]]},2)],`
import "sort"

func findMinArrowShots(points [][]int) int {
    if len(points) == 0 { return 0 }
    sort.Slice(points, func(i, j int) bool { return points[i][1] < points[j][1] })
    arrows, end := 1, points[0][1]
    for _, point := range points[1:] {
        if point[0] > end { arrows++; end = point[1] }
    }
    return arrows
}`,({points:a},e)=>{if(!a.length)return 0;I(e,a,'按右端点排序',[5]);a.sort((x,y)=>x[1]-y[1]);let count=1,end=a[0][1];const arrows=[end];I(e,a,'在首个气球右端射箭',[6],{count,end},{points:arrows,active:[0]});for(let i=1;i<a.length;i++){if(a[i][0]>end){count++;end=a[i][1];arrows.push(end);}I(e,a,'判断已有箭能否覆盖气球',[8],{count,end},{active:[i],points:arrows});}return count;},v=>intervals(v.points));
add(20,'给定只包含三种括号的字符串，判断所有括号能否按相同种类正确闭合且嵌套顺序合法。','左括号必须由同类型右括号匹配；空字符串合法。',[['左括号入栈','栈保存尚未匹配的左括号。'],['右括号匹配栈顶','右括号必须与最近出现且未闭合的左括号对应。'],['检查最终栈是否为空','扫描结束还有左括号时说明缺少闭合。']],'O(n)','O(n)',{s:'{[()]}()'},true,[C({s:'(]'},false),C({s:'(('},false)],`
func isValid(s string) bool {
    stack := []byte{}
    matching := map[byte]byte{')':'(', ']':'[', '}':'{'}
    for i := range s {
        c := s[i]
        if c == '(' || c == '[' || c == '{' { stack = append(stack, c) } else {
            if len(stack) == 0 || stack[len(stack)-1] != matching[c] { return false }
            stack = stack[:len(stack)-1]
        }
    }
    return len(stack) == 0
}`,({s},e)=>{const st=[],match={')':'(',']':'[','}':'{'};S(e,st,'初始化括号栈',[2]);for(let i=0;i<s.length;i++){const c=s[i];if('([{'.includes(c))st.push(c);else{if(!st.length||st.at(-1)!==match[c]){e({kind:'stack',values:st,secondary:[...s],secondaryLabel:'括号输入'},'栈顶无法匹配右括号','当前右括号与最近的未匹配左括号种类不一致。',[7],{i,char:c});return false;}st.pop();}e({kind:'stack',values:st,secondary:[...s],secondaryLabel:'括号输入'},'处理当前括号','左括号入栈，正确匹配的右括号使栈顶出栈。',[6,8],{i,char:c});}return!st.length;},v=>{ascii(v.s);invariant(/^[()[\]{}]*$/.test(v.s),'字符串只能含括号。');});
add(71,'给定 Unix 风格的绝对路径，返回它的规范路径，合并多余斜杠并处理当前目录和上一级目录。','路径必须以 / 开头；. 表示当前目录，.. 表示父目录，根目录的父目录仍是根。其他点号名称按普通目录处理。',[['按斜杠拆分路径','忽略空片段以及单独一个点。'],['目录名入栈','普通目录名加入栈，遇到 .. 时弹出一层。'],['重新连接规范路径','在所有目录之间放一个斜杠，根目录表示为 /。']],'O(n)','O(n)',{path:'/a/./b/../../c/'},'/c',[C({path:'/../'},'/'),C({path:'/home//foo/'},'/home/foo')],`
import "strings"

func simplifyPath(path string) string {
    stack := []string{}
    for _, part := range strings.Split(path, "/") {
        if part == "" || part == "." { continue }
        if part == ".." {
            if len(stack) > 0 { stack = stack[:len(stack)-1] }
        } else { stack = append(stack, part) }
    }
    return "/"+strings.Join(stack, "/")
}`,({path},e)=>{const st=[];S(e,st,'从根目录开始',[4]);for(const part of path.split('/')){if(part==='..'){if(st.length)st.pop();}else if(part&&part!=='.')st.push(part);S(e,st,part==='..'?'返回父目录':'处理路径片段',[6,7,8,9],{part,path:'/'+st.join('/')});}return'/'+st.join('/');},v=>{ascii(v.path);invariant(v.path.startsWith('/'),'请输入以 / 开头的绝对路径。');});
add(155,'设计支持 push、pop、top、getMin 的栈，每种操作都在常数时间内完成，返回 JSON 操作列表的逐项结果。','首项为 [MinStack]，push 附整数；pop、top 和 getMin 只允许在非空栈执行；构造与修改操作返回 null。',[['保存数值与当前最小值','每一层同时记录入栈值以及截至本层的最小值。'],['同步维护两个状态','push 计算新的最小值，pop 一起移除值和本层最小值。'],['直接读取栈顶','top 读取当前值，getMin 读取栈顶保存的最小值。']],'每次 O(1)','O(n)',{operations:[['MinStack'],['push',-2],['push',0],['push',-3],['getMin'],['pop'],['top'],['getMin']]},[null,null,null,null,-3,null,0,-2],[C({operations:[['MinStack'],['push',1],['getMin'],['pop']]},[null,null,1,null]),C({operations:[['MinStack'],['push',2],['push',2],['pop'],['getMin']]},[null,null,null,null,2])],`
type MinStack struct { values [][2]int }
func Constructor() MinStack { return MinStack{} }
func (s *MinStack) Push(val int) {
    low := val
    if len(s.values) > 0 && s.values[len(s.values)-1][1] < low { low = s.values[len(s.values)-1][1] }
    s.values = append(s.values, [2]int{val,low})
}
func (s *MinStack) Pop() { s.values = s.values[:len(s.values)-1] }
func (s *MinStack) Top() int { return s.values[len(s.values)-1][0] }
func (s *MinStack) GetMin() int { return s.values[len(s.values)-1][1] }
`,({operations},e)=>{let stack=[];const out=[];for(const [operationIndex,command]of operations.entries()){const [op,v]=command;let r=null;if(op==='MinStack')stack=[];else if(op==='push')stack.push([v,Math.min(v,stack.at(-1)?.[1]??v)]);else{invariant(stack.length>0,'栈为空，无法执行此操作。');if(op==='pop')stack.pop();else if(op==='top')r=stack.at(-1)[0];else r=stack.at(-1)[1];}out.push(r);S(e,stack.map(([v,m])=>`${v} / min=${m}`),`执行 ${op}`,[op==='push'?6:op==='pop'?8:op==='top'?9:op==='getMin'?10:2],{result:r,output:out},{operation:{index:operationIndex,name:op,args:command.slice(1),returns:op==='top'||op==='getMin',complete:true,value:r}});}return out;},v=>{array(v.operations,'operations',50);invariant(v.operations.length&&Array.isArray(v.operations[0])&&v.operations[0][0]==='MinStack','首项必须构造 MinStack。');for(const p of v.operations){invariant(Array.isArray(p)&&['MinStack','push','pop','top','getMin'].includes(p[0]),'未知栈操作。');if(p[0]==='push')integer(p[1],-1e9,1e9,'入栈值');}});
add(150,'给定逆波兰表达式 tokens，按后缀表达式规则计算并返回整数结果，支持加减乘除四种运算。','操作数是整数；除法向零截断，除数不能为零；表达式必须合法且结果在 32 位整数范围内。',[['数字入栈','扫描到整数时压入操作数栈。'],['运算符弹出两个数','先弹出的为右操作数，再弹出的为左操作数，顺序不能反。'],['计算后压回结果','所有符号处理结束时栈内唯一的值就是结果。']],'O(n)','O(n)',{tokens:['2','1','+','3','*']},9,[C({tokens:['4','13','5','/','+']},6),C({tokens:['-7','3','/']},-2)],`
import "strconv"

func evalRPN(tokens []string) int {
    stack := []int{}
    for _, token := range tokens {
        if value, err := strconv.Atoi(token); err == nil { stack = append(stack,value); continue }
        right, left := stack[len(stack)-1], stack[len(stack)-2]
        stack = stack[:len(stack)-2]
        value := 0
        switch token {
        case "+": value = left+right
        case "-": value = left-right
        case "*": value = left*right
        case "/": value = left/right
        }
        stack = append(stack,value)
    }
    return stack[0]
}`,({tokens},e)=>{const st=[];S(e,st,'初始化操作数栈',[4]);for(const token of tokens){if(/^-?\d+$/.test(token))st.push(Number(token));else{const b=st.pop(),a=st.pop();invariant(token!=='/'||b!==0,'除数不能为零。');const value=token==='+'?a+b:token==='-'?a-b:token==='*'?a*b:Math.trunc(a/b);invariant(Number.isSafeInteger(value)&&value>=-2147483648&&value<=2147483647,'中间结果超出 32 位整数范围。');st.push(value===0?0:value);}e({kind:'stack',values:st,secondary:tokens,secondaryLabel:'后缀表达式'},'处理当前符号',`当前符号 ${token}，数字压栈，运算结果也压回栈。`,[/^-?\d+$/.test(token)?6:7,16],{token});}return st[0];},v=>{array(v.tokens,'tokens',60);let depth=0;for(const t of v.tokens){invariant(typeof t==='string'&&(/^-?\d+$/.test(t)||['+','-','*','/'].includes(t)),'仅允许整数和 + - * /。');if(/^-?\d+$/.test(t)){integer(Number(t),-2147483648,2147483647,'操作数');depth++;}else{invariant(depth>=2,'运算符缺少操作数。');depth--;}}invariant(depth===1,'表达式必须恰好得到一个结果。');});
function validateExpression(s){ascii(s);invariant(s.trim().length>0&&/^[\d+() -]+$/.test(s),'仅支持整数、加减号、括号与空格。');let at=0;const skip=()=>{while(s[at]===' ')at++;};function expr(){operand();skip();while(s[at]==='+'||s[at]==='-'){at++;skip();invariant(s[at]!=='-'&&s[at]!=='+','不允许连续运算符，请用括号包围一元负数。');operand();skip();}}function operand(){skip();if(s[at]==='-'){at++;skip();}if(s[at]==='('){at++;expr();skip();invariant(s[at]===')','括号必须配对。');at++;}else{const start=at;while(at<s.length&&/\d/.test(s[at]))at++;invariant(at>start,'此处需要一个整数或括号表达式。');integer(Number(s.slice(start,at)),0,1e9,'操作数');}skip();}expr();skip();invariant(at===s.length,'表达式格式不合法。');}
add(224,'给定含非负整数、加减号、括号和空格的有效表达式字符串 s，计算并返回整数结果；支持一元负号。','不使用 eval；括号可嵌套。演示限制在 120 字符内，中间值须保持安全整数。',[['累计当前括号层结果','读取多位数字，并按当前符号加入结果。'],['遇到左括号保存上下文','将外层结果与符号入栈，在新括号内从零开始。'],['遇到右括号合并','弹出外层符号与结果，计算 外层结果 + 符号 × 内层结果。']],'O(n)','O(n)',{s:'(1+(4+5+2)-3)+(6+8)'},23,[C({s:'- (3 + (4 + 5))'},-12),C({s:'1-(-2)'},3)],`
func calculate(s string) int {
    result, sign := 0, 1
    stack := []int{}
    for i := 0; i < len(s); i++ {
        c := s[i]
        if c >= '0' && c <= '9' {
            number := 0
            for i < len(s) && s[i] >= '0' && s[i] <= '9' { number = number*10+int(s[i]-'0'); i++ }
            i--; result += sign*number
        } else if c == '+' { sign = 1
        } else if c == '-' { sign = -1
        } else if c == '(' {
            stack = append(stack, result, sign)
            result, sign = 0, 1
        } else if c == ')' {
            outerSign, outer := stack[len(stack)-1], stack[len(stack)-2]
            stack = stack[:len(stack)-2]
            result = outer+outerSign*result
        }
    }
    return result
}`,({s},e)=>{let result=0,sign=1;const stack=[];S(e,stack,'初始化表达式上下文',[2,3],{result,sign});for(let i=0;i<s.length;i++){const c=s[i];if(/\d/.test(c)){let n=0;while(i<s.length&&/\d/.test(s[i]))n=n*10+Number(s[i++]);i--;result+=sign*n;}else if(c==='+')sign=1;else if(c==='-')sign=-1;else if(c==='('){stack.push(result,sign);result=0;sign=1;}else if(c===')'){const os=stack.pop(),outer=stack.pop();result=outer+os*result;}else continue;e({kind:'stack',values:stack,secondary:[...s],secondaryLabel:'表达式'},c==='('? '进入新括号层':c===')'?'合并括号结果':'更新当前层计算','栈中成对保存外层结果与进入括号时的符号。',[/\d/.test(c)?9:c==='('?13:c===')'?18:c==='+'?10:11],{i,char:c,result,sign});}return result;},v=>validateExpression(v.s));
