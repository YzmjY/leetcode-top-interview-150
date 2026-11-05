import {clone,invariant,array,numbers,integer,text,matrix,sorted,treeFromLevel,treeToLevel,treeView,graphView} from './lesson-kit.js';

export const lessonsB=[];
function add(id,summary,rule,steps,time,space,input,expected,code,solve,cases,validate=()=>{}) {
 lessonsB.push({id,summary,rule,steps:steps.map(([title,body])=>({title,body})),time,space,input,expected,code,solve,cases:cases.map(([input,expected])=>({input,expected})),validate});
}
const grid=(m,active=[],done=[])=>({kind:'matrix',matrix:m,active,done});
const shot=(emit,scene,title,vars={},lines=[3],anchor=null)=>emit(scene,title,Object.entries(vars).map(([k,v])=>`${k} = ${JSON.stringify(v)}`).join('；'),lines,vars,anchor);
function numericMatrix(m,nonempty=false){matrix(m);invariant(m.every(r=>r.every(Number.isFinite)),'矩阵必须包含数字。');if(nonempty)invariant(m.length&&m[0].length,'矩阵不能为空。');}
function binaryMatrix(m,chars=false){matrix(m);invariant(m.every(r=>r.every(x=>chars?x==='0'||x==='1':x===0||x===1)),'网格只能包含 0 和 1。');}
function rootInput(v){array(v,'层序树',63);invariant(v.every(x=>x===null||Number.isInteger(x)&&Math.abs(x)<=1e9),'树节点须为 -10⁹ 到 10⁹ 的整数或 null。');invariant(v[0]!==null||v.every(x=>x===null),'空根节点之后不能包含没有父节点的非空节点。');treeFromLevel(v);}
const nodesOf=root=>{const out=[];function visit(n){if(n){out.push(n);visit(n.left);visit(n.right);}}visit(root);return out;};
function makeList(values,prefix=''){numbers(values,'链表',45);const nodes=values.map((val,i)=>({id:prefix+i,val,next:null}));nodes.forEach((n,i)=>n.next=nodes[i+1]??null);return {head:nodes[0]??null,nodes};}
// Chains are disjoint layout walks over real next pointers. A walk stops when
// it meets an already placed identity; edges still show that join or cycle.
// Removed identities keep their actual pointers, but never enter a live walk.
function linked(nodes,active=[],{roots=[],pointers={},removed=[]}={}){
 const byId=new Map(nodes.map(n=>[n.id,n])),removedIds=new Set(removed.map(n=>typeof n==='string'?n:n.id)),placed=new Set(),chains=[];
 const walk=(label,head)=>{
  const ids=[];
  for(let n=head;n&&byId.has(n.id)&&!placed.has(n.id)&&!removedIds.has(n.id);n=n.next){placed.add(n.id);ids.push(n.id);}
  chains.push({label,ids});
 };
 for(const {label,head} of roots)walk(label,head);
 const incoming=new Set(nodes.filter(n=>!removedIds.has(n.id)&&n.next).map(n=>n.next.id));
 for(const n of nodes)if(!placed.has(n.id)&&!removedIds.has(n.id)&&!incoming.has(n.id))walk(n.sentinel?'哨兵':'待处理',n);
 for(const n of nodes)if(!placed.has(n.id)&&!removedIds.has(n.id))walk(n.sentinel?'哨兵':'待处理',n);
 return {kind:'linked',nodes:nodes.map(n=>({id:n.id,label:String(n.val),...(n.sentinel?{sentinel:true}:{}),...(removedIds.has(n.id)?{removed:true}:{})})),
  edges:nodes.flatMap(n=>['next','random','prev'].flatMap(label=>n[label]&&byId.has(n[label].id)?[{from:n.id,to:n[label].id,label,directed:true}]:[])),
  chains,pointers:Object.fromEntries(Object.entries(pointers).map(([name,n])=>[name,typeof n==='string'?n:n?.id??null])),removed:[...removedIds],
  active:active.filter(Boolean).map(n=>typeof n==='string'?n:n.id)};
}
function listValues(head){const a=[];for(let n=head;n;n=n.next){a.push(n.val);invariant(a.length<=100,'链表意外成环。');}return a;}
const listCheck=i=>numbers(i.head,'head',45);
const treeCheck=i=>rootInput(i.root);

add(36,'判断一个 9×9 数独棋盘已填入的数字是否满足行、列和宫内不重复。','空位用 "." 表示；只判断当前有效性，不要求求出完整数独。',[
 ['准备三个集合','分别记录每行、每列和每个 3×3 宫已经出现的数字。'],['逐格检查','空位跳过；数字若在任一对应集合中出现就产生冲突。'],['登记数字','无冲突时加入三个集合；遍历结束返回 true。']], 'O(81)','O(81)',
 {board:['53..7....','6..195...','.98....6.','8...6...3','4..8.3..1','7...2...6','.6....28.','...419..5','....8..79'].map(s=>s.split(''))},true,
`func isValidSudoku(board [][]byte) bool {
 var rows, cols, boxes [9][9]bool
 for r := 0; r < 9; r++ {
  for c := 0; c < 9; c++ {
   if board[r][c] == '.' { continue }
   d, b := board[r][c]-'1', r/3*3+c/3
   if rows[r][d] || cols[c][d] || boxes[b][d] { return false }
   rows[r][d], cols[c][d], boxes[b][d] = true, true, true
  }
 }
 return true
}`,(i,e)=>{const rows=Array.from({length:9},()=>new Set()),cols=rows.map(()=>new Set()),boxes=rows.map(()=>new Set());shot(e,grid(i.board),'建立行、列、宫集合');for(let r=0;r<9;r++)for(let c=0;c<9;c++){const d=i.board[r][c];if(d==='.')continue;const b=Math.floor(r/3)*3+Math.floor(c/3),conflict=rows[r].has(d)||cols[c].has(d)||boxes[b].has(d);shot(e,grid(i.board,[[r,c]]),conflict?'发现重复数字':'检查数字',{数字:d,宫:b},[7]);if(conflict)return false;rows[r].add(d);cols[c].add(d);boxes[b].add(d);}return true;},
 [[{board:Array.from({length:9},()=>Array(9).fill('.'))},true],[{board:['11.......',...Array(8).fill('.........')].map(s=>s.split(''))},false]],i=>{matrix(i.board);invariant(i.board.length===9&&i.board[0].length===9&&i.board.every(r=>r.every(c=>typeof c==="string"&&/^[1-9.]$/.test(c))),'数独须为 9×9 的数字字符或点。');});

add(54,'按顺时针螺旋顺序返回矩阵的全部元素。','矩阵可为空；每个位置恰好访问一次。',[
 ['设定边界','用上、下、左、右四条边界框住未读取区域。'],['绕一圈','依次读取上行、右列、下行、左列，读取后收缩对应边界。'],['避免重复','反向边存在时才读取，直到边界交错。']], 'O(mn)','O(1)，不计输出',
 {matrix:[[1,2,3,4],[5,6,7,8],[9,10,11,12]]},[1,2,3,4,8,12,11,10,9,5,6,7],
`func spiralOrder(matrix [][]int) []int {
 ans := []int{}
 if len(matrix)==0 || len(matrix[0])==0 { return ans }
 top,bottom,left,right := 0,len(matrix)-1,0,len(matrix[0])-1
 for top<=bottom && left<=right {
  for c:=left;c<=right;c++ { ans=append(ans,matrix[top][c]) }; top++
  for r:=top;r<=bottom;r++ { ans=append(ans,matrix[r][right]) }; right--
  if top<=bottom { for c:=right;c>=left;c-- { ans=append(ans,matrix[bottom][c]) }; bottom-- }
  if left<=right { for r:=bottom;r>=top;r-- { ans=append(ans,matrix[r][left]) }; left++ }
 }
 return ans
}`,(i,e)=>{let t=0,b=i.matrix.length-1,l=0,r=(i.matrix[0]?.length??0)-1;const out=[],done=[];shot(e,grid(i.matrix),'框定未访问区域');const read=(a,c,line)=>{out.push(i.matrix[a][c]);done.push([a,c]);shot(e,grid(i.matrix,[[a,c]],done),'沿边读取',{结果:out},[line]);};while(t<=b&&l<=r){for(let c=l;c<=r;c++)read(t,c,6);t++;for(let a=t;a<=b;a++)read(a,r,7);r--;if(t<=b){for(let c=r;c>=l;c--)read(b,c,8);b--;}if(l<=r){for(let a=b;a>=t;a--)read(a,l,9);l++;}}return out;},[[{matrix:[]},[]],[{matrix:[[1],[2],[3]]},[1,2,3]]],i=>numericMatrix(i.matrix));

add(48,'将 n×n 图像矩阵原地顺时针旋转 90 度，并返回旋转后的矩阵。','输入必须是正方形；先转置，再反转每一行。',[
 ['沿主对角线转置','交换 (r,c) 与 (c,r)，只处理对角线一侧。'],['翻转每一行','每行左右对称交换，将转置后的列方向改为顺时针。'],['完成原地旋转','每个元素只交换常数次，不另建结果矩阵。']], 'O(n²)','O(1)',{matrix:[[1,2,3],[4,5,6],[7,8,9]]},[[7,4,1],[8,5,2],[9,6,3]],
`func rotate(matrix [][]int) {
 n:=len(matrix)
 for r:=0;r<n;r++ {
  for c:=r+1;c<n;c++ { matrix[r][c],matrix[c][r]=matrix[c][r],matrix[r][c] }
 }
 for r:=0;r<n;r++ {
  for l,h:=0,n-1;l<h;l,h=l+1,h-1 { matrix[r][l],matrix[r][h]=matrix[r][h],matrix[r][l] }
 }
}`,(i,e)=>{const m=i.matrix,n=m.length;shot(e,grid(m),'旋转前');for(let r=0;r<n;r++)for(let c=r+1;c<n;c++){[m[r][c],m[c][r]]=[m[c][r],m[r][c]];shot(e,grid(m,[[r,c],[c,r]]),'转置对称位置',{r,c},[4]);}for(let r=0;r<n;r++)for(let l=0,h=n-1;l<h;l++,h--){[m[r][l],m[r][h]]=[m[r][h],m[r][l]];shot(e,grid(m,[[r,l],[r,h]]),'反转当前行',{r,l,h},[7]);}return m;},[[{matrix:[[5]]},[[5]]],[{matrix:[[1,2],[3,4]]},[[3,1],[4,2]]]],i=>{numericMatrix(i.matrix);invariant(i.matrix.every(r=>r.length===i.matrix.length),'旋转矩阵须为正方形。');});

add(73,'若矩阵某个位置为 0，将该位置所在整行和整列置为 0，并返回矩阵。','所有清零依据原始零位置；用首行首列存标记。',[
 ['保存首行首列状态','先记录它们原来是否含零，避免标记覆盖信息。'],['在边界写标记','扫描内部零，将对应首列与首行位置置零。'],['按标记清零','处理内部，再根据原状态清零首行首列。']], 'O(mn)','O(1)',{matrix:[[1,1,1],[1,0,1],[1,1,1]]},[[1,0,1],[0,0,0],[1,0,1]],
`func setZeroes(matrix [][]int) {
 if len(matrix)==0 || len(matrix[0])==0 { return }
 m,n:=len(matrix),len(matrix[0]); row,col:=false,false
 for c:=0;c<n;c++ { if matrix[0][c]==0 { row=true } }
 for r:=0;r<m;r++ { if matrix[r][0]==0 { col=true } }
 for r:=1;r<m;r++ { for c:=1;c<n;c++ { if matrix[r][c]==0 { matrix[r][0]=0;matrix[0][c]=0 } } }
 for r:=1;r<m;r++ { for c:=1;c<n;c++ { if matrix[r][0]==0 || matrix[0][c]==0 { matrix[r][c]=0 } } }
 if row { for c:=0;c<n;c++ { matrix[0][c]=0 } }
 if col { for r:=0;r<m;r++ { matrix[r][0]=0 } }
}`,(i,e)=>{const m=i.matrix,R=m.length,C=m[0]?.length??0;shot(e,grid(m),'记录原始矩阵');if(!R||!C)return m;const row=m[0].includes(0),col=m.some(r=>r[0]===0);for(let r=1;r<R;r++)for(let c=1;c<C;c++)if(m[r][c]===0){m[r][0]=m[0][c]=0;shot(e,grid(m,[[r,0],[0,c]]),'在首行首列登记零',{row,col},[6]);}for(let r=1;r<R;r++)for(let c=1;c<C;c++)if(m[r][0]===0||m[0][c]===0){m[r][c]=0;shot(e,grid(m,[[r,c]]),'根据标记清零',{},[7]);}if(row)m[0].fill(0);if(col)m.forEach(r=>r[0]=0);shot(e,grid(m),'恢复首行首列语义',{row,col},[8,9]);return m;},[[{matrix:[]},[]],[{matrix:[[0,1,2],[3,4,5]]},[[0,0,0],[0,4,5]]]],i=>numericMatrix(i.matrix));

add(289,'根据生命游戏规则同步更新细胞网格，返回下一代。','活细胞邻居少于2或多于3会死亡；恰有3个活邻居时死细胞复活。',[
 ['保留旧状态位','最低位保存原代，第二位记录下一代。'],['计数八邻居','只读取最低位，避免先更新的格子影响后续判断。'],['统一换代','右移每个格子，得到同步演化后的网格。']], 'O(mn)','O(1)',{board:[[0,1,0],[0,0,1],[1,1,1],[0,0,0]]},[[0,0,0],[1,0,1],[0,1,1],[0,1,0]],
`func gameOfLife(board [][]int) {
 if len(board)==0 { return }; m,n:=len(board),len(board[0])
 for r:=0;r<m;r++ { for c:=0;c<n;c++ {
  count:=0
  for dr:=-1;dr<=1;dr++ { for dc:=-1;dc<=1;dc++ { a,b:=r+dr,c+dc; if (dr!=0||dc!=0)&&a>=0&&a<m&&b>=0&&b<n { count+=board[a][b]&1 } } }
  if count==3 || (board[r][c]&1==1 && count==2) { board[r][c]|=2 }
 } }
 for r:=0;r<m;r++ { for c:=0;c<n;c++ { board[r][c]>>=1 } }
}`,(i,e)=>{const m=i.board,R=m.length,C=m[0]?.length??0;shot(e,grid(m),'读取当前一代');for(let r=0;r<R;r++)for(let c=0;c<C;c++){let count=0;for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if((dr||dc)&&r+dr>=0&&r+dr<R&&c+dc>=0&&c+dc<C)count+=m[r+dr][c+dc]&1;if(count===3||((m[r][c]&1)&&count===2))m[r][c]|=2;shot(e,grid(m,[[r,c]]),'编码下一代（0/1旧态，2/3新活）',{邻居:count},[5,6]);}for(let r=0;r<R;r++)for(let c=0;c<C;c++)m[r][c]>>=1;shot(e,grid(m),'全部格子同步换代',{},[8]);return m;},[[{board:[[1]]},[[0]]],[{board:[[1,1],[1,0]]},[[1,1],[1,1]]]],i=>binaryMatrix(i.board));

add(141,'判断链表是否含有环。','head 是节点值数组；pos 为尾节点连接到的下标，-1 表示不连接。',[
 ['建立快慢指针','慢指针每次走一步，快指针每次走两步。'],['比较节点身份','相同值不代表相同节点；只有指针指向同一节点才算相遇。'],['给出结论','相遇说明存在环，快指针抵达空指针则无环。']], 'O(n)','O(1)',{head:[3,2,0,-4],pos:1},true,
`func hasCycle(head *ListNode) bool {
 slow,fast:=head,head
 for fast!=nil && fast.Next!=nil {
  slow=slow.Next;fast=fast.Next.Next
  if slow==fast { return true }
 }
 return false
}`,(i,e)=>{const {head,nodes}=makeList(i.head);if(nodes.length&&i.pos>=0)nodes.at(-1).next=nodes[i.pos];let slow=head,fast=head;const scene=()=>linked(nodes,[slow,fast],{roots:[{label:'链表',head}],pointers:{head,slow,fast}});shot(e,scene(),'设置快慢指针');while(fast&&fast.next){slow=slow.next;fast=fast.next.next;shot(e,scene(),'快走两步，慢走一步',{slow:slow?.id??null,fast:fast?.id??null},[4,5]);if(slow===fast)return true;}return false;},[[{head:[],pos:-1},false],[{head:[1,1],pos:-1},false]],i=>{listCheck(i);integer(i.pos,-1,i.head.length-1,'pos');});

add(2,'两个逆序链表分别表示非负整数，返回相加结果的逆序链表。','每个节点为一位数字；保留最后的进位。',[
 ['按位相加','从两个头节点出发，取当前位和上次进位。'],['新建结果节点','和的个位写入新节点，十位留作下次进位。'],['处理剩余位','任一链表未结束或仍有进位时继续。']], 'O(m+n)','O(m+n)',{l1:[2,4,3],l2:[5,6,4]},[7,0,8],
`func addTwoNumbers(l1 *ListNode,l2 *ListNode) *ListNode {
 dummy:=&ListNode{};tail:=dummy;carry:=0
 for l1!=nil || l2!=nil || carry>0 {
  sum:=carry
  if l1!=nil { sum+=l1.Val;l1=l1.Next }
  if l2!=nil { sum+=l2.Val;l2=l2.Next }
  tail.Next=&ListNode{Val:sum%10};tail=tail.Next;carry=sum/10
 }
 return dummy.Next
}`,(i,e)=>{
 const a=makeList(i.l1,'a'),b=makeList(i.l2,'b'),out=[],dummy={id:'dummy',val:'哨兵',sentinel:true,next:null};
 let l1=a.head,l2=b.head,tail=dummy,carry=0;
 const scene=()=>linked([...a.nodes,...b.nodes,dummy,...out],[tail],{roots:[{label:'结果',head:dummy.next},{label:'输入 A',head:a.head},{label:'输入 B',head:b.head}],pointers:{dummy,tail,l1,l2}});
 shot(e,scene(),'两条输入链表');
 while(l1||l2||carry){const sum=(l1?.val??0)+(l2?.val??0)+carry,n={id:'s'+out.length,val:sum%10,next:null};tail.next=n;tail=n;out.push(n);carry=Math.floor(sum/10);l1=l1?.next??null;l2=l2?.next??null;shot(e,scene(),'追加结果位',{carry},[7],'tail.Next=&ListNode{Val:sum%10}');}
 return listValues(dummy.next);
},[[{l1:[0],l2:[0]},[0]],[{l1:[9,9],l2:[1]},[0,0,1]]],i=>{for(const k of ['l1','l2']){numbers(i[k],k,40);invariant(i[k].length&&i[k].every(v=>v>=0&&v<=9),'数字链表须含 0 到 9 的数字。');}});

add(21,'将两个非递减链表合并为一条非递减链表。','复用输入节点；空链表允许。',[
 ['建立哨兵','用 dummy 简化首节点接入。'],['选择较小头节点','比较两个待合并头，接到结果尾部，再移动对应指针。'],['接上剩余链','一条用完后直接接上另一条剩余部分。']], 'O(m+n)','O(1)',{list1:[1,2,4],list2:[1,3,4]},[1,1,2,3,4,4],
`func mergeTwoLists(list1 *ListNode,list2 *ListNode) *ListNode {
 dummy:=&ListNode{};tail:=dummy
 for list1!=nil && list2!=nil {
  if list1.Val<=list2.Val { tail.Next=list1;list1=list1.Next } else { tail.Next=list2;list2=list2.Next }
  tail=tail.Next
 }
 if list1!=nil { tail.Next=list1 } else { tail.Next=list2 }
 return dummy.Next
}`,(i,e)=>{
 const a=makeList(i.list1,'a'),b=makeList(i.list2,'b'),dummy={id:'dummy',val:'哨兵',sentinel:true,next:null},all=[dummy,...a.nodes,...b.nodes];
 let list1=a.head,list2=b.head,tail=dummy;
 const scene=()=>linked(all,[tail,list1,list2],{roots:[{label:'结果',head:dummy.next},{label:'待合并 A',head:list1},{label:'待合并 B',head:list2}],pointers:{dummy,tail,list1,list2}});
 shot(e,scene(),'两条有序链');
 while(list1&&list2){if(list1.val<=list2.val){tail.next=list1;list1=list1.next;}else{tail.next=list2;list2=list2.next;}tail=tail.next;shot(e,scene(),'接入较小节点',{list1:list1?.id??null,list2:list2?.id??null},[4,5]);}
 tail.next=list1??list2;shot(e,scene(),'接入剩余链',{},[7],list1?'tail.Next=list1':'tail.Next=list2');return listValues(dummy.next);
},[[{list1:[],list2:[0]},[0]],[{list1:[-2,2],list2:[-1,3]},[-2,-1,2,3]]],i=>{sorted(i.list1);sorted(i.list2);});

add(138,'深拷贝带 next 和 random 指针的链表，返回副本的值与 random 下标。','nodes 每项为 [值,random下标或null]；副本不能引用原节点。',[
 ['建立身份映射','每个原节点对应一个新节点，值相同仍分别创建。'],['复制两类指针','根据映射连接 next 与 random。'],['返回副本','序列化副本，random 仍表示副本内节点下标。']], 'O(n)','O(n)',{nodes:[[7,null],[13,0],[11,4],[10,2],[1,0]]},[[7,null],[13,0],[11,4],[10,2],[1,0]],
`func copyRandomList(head *Node) *Node {
 copies:=map[*Node]*Node{nil:nil}
 for p:=head;p!=nil;p=p.Next { copies[p]=&Node{Val:p.Val} }
 for p:=head;p!=nil;p=p.Next {
  copies[p].Next=copies[p.Next];copies[p].Random=copies[p.Random]
 }
 return copies[head]
}`,(i,e)=>{
 const orig=makeList(i.nodes.map(x=>x[0]),'o');orig.nodes.forEach((n,k)=>n.random=i.nodes[k][1]===null?null:orig.nodes[i.nodes[k][1]]);const copies=[];let p=null;
 const scene=()=>linked([...orig.nodes,...copies],[p],{roots:[{label:'结果',head:copies[0]},{label:'原链表',head:orig.head}],pointers:{head:orig.head,p}});
 shot(e,scene(),'原链表的随机边');
 for(const n of orig.nodes){p=n;copies.push({id:'c'+copies.length,val:n.val,next:null,random:null});shot(e,scene(),'创建独立副本节点',{},[3],'copies[p]=&Node{Val:p.Val}');}
 for(let k=0;k<copies.length;k++){p=orig.nodes[k];copies[k].next=copies[k+1]??null;shot(e,scene(),'映射副本 next',{},[5],'copies[p].Next=copies[p.Next]');copies[k].random=i.nodes[k][1]===null?null:copies[i.nodes[k][1]];shot(e,scene(),'映射副本 random',{},[5],'copies[p].Random=copies[p.Random]');}
 return copies.map(n=>[n.val,n.random?copies.indexOf(n.random):null]);
},[[{nodes:[]},[]],[{nodes:[[1,1],[1,1]]},[[1,1],[1,1]]]],i=>{array(i.nodes,'nodes',40);invariant(i.nodes.every(n=>Array.isArray(n)&&n.length===2&&Number.isInteger(n[0])&&(n[1]===null||Number.isInteger(n[1])&&n[1]>=0&&n[1]<i.nodes.length)),'节点须为 [整数,合法随机下标或null]。');});

add(92,'反转链表中第 left 到第 right 个节点，返回链表。','位置从 1 开始；只改变该区间的链接。',[
 ['找到区间前驱','哨兵保证反转从头开始时也有前驱。'],['头插反转','不断摘下区间第二个节点，插到区间最前方。'],['保留区间尾部','原区间头成为尾，始终接回尚未反转部分。']], 'O(n)','O(1)',{head:[1,2,3,4,5],left:2,right:4},[1,4,3,2,5],
`func reverseBetween(head *ListNode,left int,right int) *ListNode {
 dummy:=&ListNode{Next:head};pre:=dummy
 for j:=1;j<left;j++ { pre=pre.Next }
 cur:=pre.Next
 for j:=0;j<right-left;j++ {
  move:=cur.Next;cur.Next=move.Next;move.Next=pre.Next;pre.Next=move
 }
 return dummy.Next
}`,(i,e)=>{
 const {head,nodes}=makeList(i.head),dummy={id:'dummy',val:'哨兵',sentinel:true,next:head};let pre=dummy;
 for(let j=1;j<i.left;j++)pre=pre.next;
 const cur=pre.next;let move=null;
 const scene=()=>linked([dummy,...nodes],[pre,cur,move],{roots:[{label:'结果',head:dummy.next},{label:'反转中',head:move}],pointers:{dummy,head,pre,cur,move}});
 shot(e,scene(),'定位反转区间',{},[4],'cur:=pre.Next');
 for(let j=0;j<i.right-i.left;j++){
  move=cur.next;shot(e,scene(),'记录即将头插的节点',{j},[6],'move:=cur.Next');
  cur.next=move.next;shot(e,scene(),'摘下 move：cur 跳过该节点',{j},[6],'cur.Next=move.Next');
  move.next=pre.next;shot(e,scene(),'move 指向区间原来的首节点',{j},[6],'move.Next=pre.Next');
  pre.next=move;shot(e,scene(),'前驱接入 move，完成一次头插',{j},[6],'pre.Next=move');
 }
 return listValues(dummy.next);
},[[{head:[5],left:1,right:1},[5]],[{head:[1,2,2,3],left:1,right:3},[2,2,1,3]]],i=>{listCheck(i);integer(i.left,1,i.head.length,'left');integer(i.right,i.left,i.head.length,'right');});

add(25,'每 k 个节点一组反转链表，剩余不足 k 个的节点保持顺序。','k 为正整数；仅改变指针，不能只交换节点值。',[
 ['先确认整组','从前驱向后找第 k 个节点，不够时停止。'],['反转当前组','以组后节点为初始前驱，逐个反转组内 next。'],['接回并推进','前驱连接新组头，原组头成为下一组前驱。']], 'O(n)','O(1)',{head:[1,2,3,4,5],k:2},[2,1,4,3,5],
`func reverseKGroup(head *ListNode,k int) *ListNode {
 dummy:=&ListNode{Next:head};pre:=dummy
 for {
  end:=pre;for j:=0;j<k && end!=nil;j++ { end=end.Next };if end==nil { break }
  after,first:=end.Next,pre.Next;prev,cur:=after,first
  for cur!=after { next:=cur.Next;cur.Next=prev;prev=cur;cur=next }
  pre.Next=end;pre=first
 }
 return dummy.Next
}`,(i,e)=>{
 const {head,nodes}=makeList(i.head),dummy={id:'dummy',val:'哨兵',sentinel:true,next:head};
 let pre=dummy,end=null,after=null,first=null,prev=null,cur=null,next=null;
 const scene=(reverseHead=prev)=>linked([dummy,...nodes],[pre,end,cur,prev],{roots:[{label:'结果',head:dummy.next},{label:'反转中',head:reverseHead},{label:'待处理',head:cur}],pointers:{dummy,head,pre,end,after,first,prev,cur,next}});
 shot(e,scene(),'检查完整分组',{},[2],'dummy:=&ListNode{Next:head}');
 while(true){
  end=pre;
  for(let j=0;j<i.k&&end;j++){end=end.next;shot(e,scene(),'向后寻找本组第 k 个节点',{j:j+1,k:i.k},[4],'end=end.Next');}
  if(!end){shot(e,scene(),'剩余不足 k 个，保留原顺序',{},[4],'end==nil');break;}
  after=end.next;first=pre.next;prev=after;cur=first;next=null;
  shot(e,scene(),'确定完整组与组后节点',{},[5],'after,first:=end.Next,pre.Next');
  while(cur!==after){
   next=cur.next;cur.next=prev;shot(e,scene(cur),'将当前节点的 next 反向',{},[6],'cur.Next=prev');
   prev=cur;cur=next;shot(e,scene(),'推进反转指针',{},[6],'prev=cur;cur=next');
  }
  pre.next=end;shot(e,scene(),'前驱接入反转后的组头',{},[7],'pre.Next=end');
  pre=first;shot(e,scene(),'原组头成为下一组前驱',{},[7],'pre=first');
 }
 return listValues(dummy.next);
},[[{head:[1,2],k:3},[1,2]],[{head:[1,2,3,4,5,6],k:3},[3,2,1,6,5,4]]],i=>{listCheck(i);integer(i.k,1,45,'k');});

add(19,'删除链表倒数第 n 个节点，返回新的头节点。','n 在 1 到链表长度之间；使用快慢双指针。',[
 ['拉开固定间距','快指针从哨兵先走 n 步。'],['同步前进','快指针到尾时，慢指针恰在待删节点前。'],['绕过目标','让慢指针的 next 跳过一个节点。']], 'O(n)','O(1)',{head:[1,2,3,4,5],n:2},[1,2,3,5],
`func removeNthFromEnd(head *ListNode,n int) *ListNode {
 dummy:=&ListNode{Next:head};fast,slow:=dummy,dummy
 for j:=0;j<n;j++ { fast=fast.Next }
 for fast.Next!=nil { fast=fast.Next;slow=slow.Next }
 slow.Next=slow.Next.Next
 return dummy.Next
}`,(i,e)=>{
 const {head,nodes}=makeList(i.head),dummy={id:'dummy',val:'哨兵',sentinel:true,next:head},removed=[];let fast=dummy,slow=dummy;
 const scene=()=>linked([dummy,...nodes],[fast,slow],{roots:[{label:'结果',head:dummy.next}],pointers:{head,dummy,fast,slow},removed});
 shot(e,scene(),'创建哨兵');
 for(let j=0;j<i.n;j++){fast=fast.next;shot(e,scene(),'拉开间距',{j:j+1},[3],'fast=fast.Next');}
 while(fast.next){fast=fast.next;slow=slow.next;shot(e,scene(),'同步移动',{},[4],'fast=fast.Next;slow=slow.Next');}
 const node=slow.next;slow.next=node.next;removed.push(node);shot(e,scene(),'绕过待删节点',{},[5],'slow.Next=slow.Next.Next');return listValues(dummy.next);
},[[{head:[1],n:1},[]],[{head:[1,2],n:2},[2]]],i=>{listCheck(i);integer(i.n,1,i.head.length,'n');});

add(82,'删除有序链表中所有重复值节点，仅保留出现一次的值。','输入非递减排序；重复值整段删除。',[
 ['观察相邻节点','相同值在有序链表中必连续出现。'],['跳过重复整段','遇到重复时记住该值，越过所有同值节点。'],['保留独立节点','否则前驱推进一个位置。']], 'O(n)','O(1)',{head:[1,2,3,3,4,4,5]},[1,2,5],
`func deleteDuplicates(head *ListNode) *ListNode {
 dummy:=&ListNode{Next:head};pre:=dummy
 for pre.Next!=nil && pre.Next.Next!=nil {
  if pre.Next.Val==pre.Next.Next.Val {
   value:=pre.Next.Val;for pre.Next!=nil && pre.Next.Val==value { pre.Next=pre.Next.Next }
  } else { pre=pre.Next }
 }
 return dummy.Next
}`,(i,e)=>{
 const {head,nodes}=makeList(i.head),dummy={id:'dummy',val:'哨兵',sentinel:true,next:head},removed=[];let pre=dummy;
 const scene=()=>linked([dummy,...nodes],[pre],{roots:[{label:'结果',head:dummy.next}],pointers:{head,dummy,pre},removed});
 shot(e,scene(),'观察有序链表');
 while(pre.next&&pre.next.next){if(pre.next.val===pre.next.next.val){const value=pre.next.val;while(pre.next&&pre.next.val===value){const node=pre.next;pre.next=node.next;removed.push(node);shot(e,scene(),'删除重复段中的节点',{value},[5],'pre.Next=pre.Next.Next');}}else{pre=pre.next;shot(e,scene(),'保留独立节点',{},[6],'pre=pre.Next');}}
 return listValues(dummy.next);
},[[{head:[1,1,1]},[]],[{head:[1,2,2]},[1]]],i=>{sorted(i.head);});

add(61,'将链表向右旋转 k 个位置，返回新的头节点。','k 为非负整数；旋转次数取模链表长度。',[
 ['计算长度','找到尾节点，将 k 对长度取模。'],['连接成环','旧尾指向旧头，循环上的任何切点都形成旋转。'],['找到新尾并断环','从旧头走 n-k-1 步；新尾的下一节点成为新头。']], 'O(n)','O(1)',{head:[1,2,3,4,5],k:2},[4,5,1,2,3],
`func rotateRight(head *ListNode,k int) *ListNode {
 if head==nil || head.Next==nil { return head }
 n:=1;tail:=head
 for tail.Next!=nil { tail=tail.Next;n++ }
 k%=n;if k==0 { return head };tail.Next=head
 pre:=head;for j:=0;j<n-k-1;j++ { pre=pre.Next }
 result:=pre.Next;pre.Next=nil
 return result
}`,(i,e)=>{
 const {head,nodes}=makeList(i.head);let tail=nodes.at(-1)??null,pre=null,result=null;
 const scene=()=>linked(nodes,[pre,result],{roots:[{label:'结果',head:result??head}],pointers:{head,tail,pre,result}});
 shot(e,scene(),'读取原链');if(nodes.length<2)return i.head;const k=i.k%nodes.length;if(!k)return i.head;
 tail.next=head;shot(e,scene(),'尾部接回头部形成环',{k},[5],'tail.Next=head');
 pre=head;for(let j=0;j<nodes.length-k-1;j++){pre=pre.next;shot(e,scene(),'寻找新尾',{},[6],'pre=pre.Next');}
 result=pre.next;shot(e,scene(),'记录新的头节点',{},[7],'result:=pre.Next');
 pre.next=null;shot(e,scene(),'从新尾断开环',{},[7],'pre.Next=nil');return listValues(result);
},[[{head:[],k:10},[]],[{head:[0,1,2],k:4},[2,0,1]]],i=>{listCheck(i);integer(i.k,0,1e9,'k');});

add(86,'稳定分隔链表，使所有小于 x 的节点位于大于等于 x 的节点之前。','两部分内部都保持原始相对顺序。',[
 ['建立两条结果链','分别保存小于 x 与大于等于 x 的节点。'],['按值接入','依次取出原节点，断开旧 next，接到对应链尾。'],['连接两段','小值链尾连接大值链头。']], 'O(n)','O(1)',{head:[1,4,3,2,5,2],x:3},[1,2,2,4,3,5],
`func partition(head *ListNode,x int) *ListNode {
 small,big:=&ListNode{},&ListNode{};a,b:=small,big
 for head!=nil {
  next:=head.Next;head.Next=nil
  if head.Val<x { a.Next=head;a=head } else { b.Next=head;b=head }
  head=next
 }
 a.Next=big.Next
 return small.Next
}`,(i,e)=>{
 const list=makeList(i.head),nodes=list.nodes,small={id:'small',val:'小值哨兵',sentinel:true,next:null},big={id:'big',val:'大值哨兵',sentinel:true,next:null};
 let a=small,b=big,head=list.head,next=null,joined=false;
 const scene=()=>linked([small,big,...nodes],[head,a,b],{roots:joined?[{label:'结果',head:small.next}]:[{label:'小值链',head:small.next},{label:'大值链',head:big.next},{label:'待处理',head}],pointers:{small,big,a,b,head,next}});
 shot(e,scene(),'准备两条稳定分区链');
 while(head){
  next=head.next;head.next=null;shot(e,scene(),'摘下当前节点，保留后继',{},[4],'head.Next=nil');
  if(head.val<i.x){a.next=head;a=head;}else{b.next=head;b=head;}
  shot(e,scene(),'节点接到对应分区尾部',{x:i.x,分区:head.val<i.x?'小':'大'},[5]);
  head=next;shot(e,scene(),'推进到下一个待分区节点',{},[6],'head=next');
 }
 a.next=big.next;joined=true;shot(e,scene(),'拼接两个分区',{},[8],'a.Next=big.Next');return listValues(small.next);
},[[{head:[],x:1},[]],[{head:[2,1,2,1],x:2},[1,1,2,2]]],i=>{listCheck(i);integer(i.x,-1e9,1e9,'x');});

add(146,'实现容量受限的 LRU 缓存，get 命中和 put 写入都会将节点提升为最近使用。','ops 为 ["LRUCache",容量]、["put",键,值]、["get",键]；构造和写入输出 null。',[
 ['哈希表定位','键映射到双向链表节点，常数时间找到缓存项。'],['维护最近顺序','访问后移到表头，尾部代表最久未使用。'],['满容量淘汰','新增超容量时，删除尾节点并清除哈希映射。']], '每次 O(1)','O(capacity)',{ops:[['LRUCache',2],['put',1,1],['put',2,2],['get',1],['put',3,3],['get',2],['get',3]]},[null,null,null,1,null,-1,3],
`type entry struct { key,value int; prev,next *entry }
 type LRUCache struct { capacity int; items map[int]*entry; head,tail *entry }
 func Constructor(capacity int) LRUCache {
  h,t:=&entry{},&entry{};h.next=t;t.prev=h
  return LRUCache{capacity:capacity,items:map[int]*entry{},head:h,tail:t}
 }
 func (c *LRUCache) detach(n *entry) { n.prev.next=n.next;n.next.prev=n.prev }
 func (c *LRUCache) front(n *entry) { n.next=c.head.next;n.prev=c.head;c.head.next.prev=n;c.head.next=n }
 func (c *LRUCache) Get(key int) int {
  n,ok:=c.items[key];if !ok { return -1 };c.detach(n);c.front(n);return n.value
 }
 func (c *LRUCache) Put(key int,value int) {
  if n,ok:=c.items[key];ok { n.value=value;c.detach(n);c.front(n);return }
  n:=&entry{key:key,value:value};c.items[key]=n;c.front(n)
  if len(c.items)>c.capacity { old:=c.tail.prev;c.detach(old);delete(c.items,old.key) }
 }`,(i,e)=>{
 let cap=0,uid=0,n=null,old=null;
 const map=new Map(),h={id:'h',val:'最近',sentinel:true},t={id:'t',val:'最旧',sentinel:true},nodes=[h,t],removed=[],result=[];h.next=t;t.prev=h;
 const scene=()=>linked(nodes,[n,old],{roots:[{label:'缓存',head:h}],pointers:{'c.head':h,'c.tail':t,n,old},removed});
 const detach=node=>{node.prev.next=node.next;node.next.prev=node.prev;};
 const front=node=>{node.next=h.next;node.prev=h;h.next.prev=node;h.next=node;};
 shot(e,scene(),'初始化双向链表');
 for(const [op,k,v] of i.ops){
  let r=null;n=null;old=null;
  if(op==='LRUCache')cap=k;
  else if(op==='get'){n=map.get(k)??null;r=n?Number(n.value):-1;if(n){detach(n);front(n);}}
  else{
   n=map.get(k)??null;
   if(n){n.value=v;n.val=`${k}:${v}`;detach(n);}else{n={id:'c'+uid++,key:k,value:v,val:`${k}:${v}`};map.set(k,n);nodes.push(n);}
   front(n);
   if(map.size>cap){old=t.prev;detach(old);map.delete(old.key);removed.push(old);}
  }
  result.push(r);shot(e,scene(),op==='get'?'访问并提升节点':'写入并检查淘汰',{操作:op,key:k,返回:r},op==='get'?[10]:[13,14,15]);
 }
 return result;
},[[{ops:[['LRUCache',1],['put',1,2],['put',1,3],['get',1]]},[null,null,null,3]],[{ops:[['LRUCache',1],['get',9],['put',2,4],['put',3,5],['get',2]]},[null,-1,null,null,-1]]],i=>{array(i.ops,'ops',80);invariant(i.ops.length&&i.ops[0][0]==='LRUCache','首个操作须构造 LRUCache。');integer(i.ops[0][1],1,20,'容量');for(let at=0;at<i.ops.length;at++){const item=i.ops[at];invariant(Array.isArray(item),'操作格式错误。');const [op,k,v]=item;invariant(['LRUCache','get','put'].includes(op),'未知缓存操作。');invariant(at===0||op!=='LRUCache','构造操作只能出现在首项。');invariant(item.length===(op==='put'?3:2),'操作格式错误。');integer(k,-1e9,1e9,'键/容量');if(op==='put')integer(v,-1e9,1e9,'值');}});

add(104,'返回二叉树从根到最深叶子所经过的节点数。','空树深度为 0；root 使用紧凑层序数组，null 表示缺失子节点。',[
 ['深入左右子树','递归求出当前节点的左右子树深度。'],['合并高度','当前高度等于两侧较大值加一。'],['回到根节点','根的高度即整棵树最大深度。']], 'O(n)','O(h)',{root:[3,9,20,null,null,15,7]},3,
`func maxDepth(root *TreeNode) int {
 if root==nil { return 0 }
 left,right:=maxDepth(root.Left),maxDepth(root.Right)
 if left>right { return left+1 };return right+1
}`,(i,e)=>{const root=treeFromLevel(i.root);shot(e,treeView(root),'从根开始');function dfs(n){if(!n)return 0;const l=dfs(n.left),r=dfs(n.right),depth=Math.max(l,r)+1;shot(e,treeView(root,{active:[n.id]}),'回传子树高度',{左:l,右:r,高度:depth},[3,4]);return depth;}return dfs(root);},[[{root:[]},0],[{root:[1,null,2,3]},3]],treeCheck);

function forest(roots,active=[]){const scenes=roots.map(r=>treeView(r));return {kind:'tree',nodes:scenes.flatMap(s=>s.nodes),edges:scenes.flatMap(s=>s.edges),active:active.filter(Boolean).map(n=>n.id)};}
function prefixedRoot(level,prefix){const r=treeFromLevel(level);for(const n of nodesOf(r))n.id=prefix+n.id;return r;}
add(100,'判断两棵二叉树结构和值是否完全相同。','两个空节点相同；单侧为空或节点值不同均不相同。',[
 ['比较空结构','双空返回 true，单空立即失败。'],['比较当前值','节点值必须相等，重复值仍是不同节点。'],['递归比较两侧','对应左右子树都相同才通过。']], 'O(min(m,n))','O(h)',{p:[1,2,3],q:[1,2,4]},false,
`func isSameTree(p *TreeNode,q *TreeNode) bool {
 if p==nil || q==nil { return p==q }
 if p.Val!=q.Val { return false }
 return isSameTree(p.Left,q.Left) && isSameTree(p.Right,q.Right)
}`,(i,e)=>{const p=prefixedRoot(i.p,'p'),q=prefixedRoot(i.q,'q');shot(e,forest([p,q]),'对照两棵树');function same(a,b){shot(e,forest([p,q],[a,b]),'比较对应位置',{左:a?.val??null,右:b?.val??null},[2,3]);if(!a||!b)return a===b;return a.val===b.val&&same(a.left,b.left)&&same(a.right,b.right);}return same(p,q);},[[{p:[],q:[]},true],[{p:[1,2],q:[1,null,2]},false]],i=>{rootInput(i.p);rootInput(i.q);});

add(226,'将二叉树每个节点的左右子树交换，返回翻转后的树。','输出紧凑层序数组；直接修改原树指针。',[
 ['交换当前子树','左指针和右指针互换。'],['递归翻转后继','对交换后的左右子树重复处理。'],['返回根','节点值与身份不变，父子边方向位置改变。']], 'O(n)','O(h)',{root:[4,2,7,1,3,6,9]},[4,7,2,9,6,3,1],
`func invertTree(root *TreeNode) *TreeNode {
 if root==nil { return nil }
 root.Left,root.Right=root.Right,root.Left
 invertTree(root.Left);invertTree(root.Right)
 return root
}`,(i,e)=>{const root=treeFromLevel(i.root);shot(e,treeView(root),'原始父子边');function dfs(n){if(!n)return;[n.left,n.right]=[n.right,n.left];shot(e,treeView(root,{active:[n.id]}),'交换左右边',{},[3]);dfs(n.left);dfs(n.right);}dfs(root);return treeToLevel(root);},[[{root:[]},[]],[{root:[1,null,2,3]},[1,2,null,null,3]]],treeCheck);

add(101,'判断二叉树是否关于根节点左右镜像对称。','镜像要求外侧子树对应、内侧子树对应，值也相等。',[
 ['成对比较','从根的左右孩子开始同时向下。'],['核对空节点和值','双空通过，单空或值不同失败。'],['交叉递归','左的左与右的右对应，左的右与右的左对应。']], 'O(n)','O(h)',{root:[1,2,2,3,4,4,3]},true,
`func isSymmetric(root *TreeNode) bool {
 var mirror func(*TreeNode,*TreeNode) bool
 mirror=func(a,b *TreeNode) bool {
  if a==nil || b==nil { return a==b }
  return a.Val==b.Val && mirror(a.Left,b.Right) && mirror(a.Right,b.Left)
 }
 return root==nil || mirror(root.Left,root.Right)
}`,(i,e)=>{const r=treeFromLevel(i.root);shot(e,treeView(r),'关于根比较镜像');function mirror(a,b){shot(e,treeView(r,{active:[a?.id,b?.id].filter(x=>x!==undefined)}),'核对镜像节点',{a:a?.val??null,b:b?.val??null},[4,5]);return !a||!b?a===b:a.val===b.val&&mirror(a.left,b.right)&&mirror(a.right,b.left);}return !r||mirror(r.left,r.right);},[[{root:[]},true],[{root:[1,2,2,null,3,null,3]},false]],treeCheck);

function traversalsCheck(i,last){numbers(i.inorder,'inorder',45);numbers(i[last],last,45);invariant(i.inorder.length===i[last].length&&new Set(i.inorder).size===i.inorder.length&&new Set(i[last]).size===i[last].length&&i[last].every(v=>i.inorder.includes(v)),'遍历须含相同的互异节点值。');}
add(105,'根据前序和中序遍历重建二叉树，返回紧凑层序表示。','节点值互不相同；前序顺序为根、左、右，中序为左、根、右。',[
 ['取前序首项为根','用游标消费前序数组。'],['中序定位分区','根左边属于左子树，右边属于右子树。'],['先左后右构建','在各自中序区间递归构造并接回父节点。']], 'O(n)','O(n)',{preorder:[3,9,20,15,7],inorder:[9,3,15,20,7]},[3,9,20,null,null,15,7],
`func buildTree(preorder []int,inorder []int) *TreeNode {
 positions:=map[int]int{};for i,v:=range inorder { positions[v]=i };next:=0
 var build func(int,int)*TreeNode
 build=func(lo,hi int)*TreeNode {
  if lo>hi { return nil };value:=preorder[next];next++;mid:=positions[value]
  root:=&TreeNode{Val:value};root.Left=build(lo,mid-1);root.Right=build(mid+1,hi);return root
 }
 return build(0,len(inorder)-1)
}`,(i,e)=>{const pos=new Map(i.inorder.map((v,k)=>[v,k]));let next=0,root=null;shot(e,treeView(root),'准备重建空树');function build(lo,hi,parent,side){if(lo>hi)return null;invariant(next<i.preorder.length,'遍历不匹配。');const id=String(next),val=i.preorder[next++],mid=pos.get(val);invariant(mid>=lo&&mid<=hi,'前序和中序不匹配。');const n={id,val,left:null,right:null};if(parent)parent[side]=n;else root=n;shot(e,treeView(root,{active:[id]}),'取前序根并连接父节点',{中序左界:lo,右界:hi,根位置:mid},[5,6]);build(lo,mid-1,n,'left');build(mid+1,hi,n,'right');return n;}build(0,i.inorder.length-1);return treeToLevel(root);},[[{preorder:[],inorder:[]},[]],[{preorder:[1,2,3],inorder:[2,3,1]},[1,2,null,null,3]]],i=>traversalsCheck(i,'preorder'));

add(106,'根据中序和后序遍历重建二叉树。','节点值互不相同；倒着读取后序时顺序为根、右、左。',[
 ['取后序末项为根','从数组末端递减游标。'],['中序划分范围','通过哈希表找到根的中序位置。'],['先右后左构造','倒序后序必须先消费右子树，再消费左子树。']], 'O(n)','O(n)',{inorder:[9,3,15,20,7],postorder:[9,15,7,20,3]},[3,9,20,null,null,15,7],
`func buildTree(inorder []int,postorder []int) *TreeNode {
 positions:=map[int]int{};for i,v:=range inorder { positions[v]=i };next:=len(postorder)-1
 var build func(int,int)*TreeNode
 build=func(lo,hi int)*TreeNode {
  if lo>hi { return nil };value:=postorder[next];next--;mid:=positions[value]
  root:=&TreeNode{Val:value};root.Right=build(mid+1,hi);root.Left=build(lo,mid-1);return root
 }
 return build(0,len(inorder)-1)
}`,(i,e)=>{const pos=new Map(i.inorder.map((v,k)=>[v,k]));let next=i.postorder.length-1,root=null;shot(e,treeView(root),'准备后序重建');function build(lo,hi,parent,side){if(lo>hi)return;invariant(next>=0,'遍历不匹配。');const id=String(next),val=i.postorder[next--],mid=pos.get(val);invariant(mid>=lo&&mid<=hi,'中序和后序不匹配。');const n={id,val,left:null,right:null};if(parent)parent[side]=n;else root=n;shot(e,treeView(root,{active:[id]}),'后序末项成为当前根',{lo,hi,mid},[5,6]);build(mid+1,hi,n,'right');build(lo,mid-1,n,'left');}build(0,i.inorder.length-1);return treeToLevel(root);},[[{inorder:[],postorder:[]},[]],[{inorder:[2,3,1],postorder:[3,2,1]},[1,2,null,null,3]]],i=>traversalsCheck(i,'postorder'));

add(117,'填充二叉树每个节点的 next，使它指向同层右侧节点。','每层最后节点 next 为 null；输出每层值数组，图中 next 边以文字标注。',[
 ['沿当前层 next 遍历','根层起始 next 为空。'],['串联下一层','用哨兵和尾指针依次接入非空左右孩子。'],['切换层头','下一层哨兵的 next 成为新的层起点。']], 'O(n)','O(1)',{root:[1,2,3,4,5,null,7]},[[1],[2,3],[4,5,7]],
`func connect(root *Node) *Node {
 for level:=root;level!=nil; {
  dummy:=&Node{};tail:=dummy
  for p:=level;p!=nil;p=p.Next {
   if p.Left!=nil { tail.Next=p.Left;tail=tail.Next }
   if p.Right!=nil { tail.Next=p.Right;tail=tail.Next }
  }
  tail.Next=nil;level=dummy.Next
 }
 return root
}`,(i,e)=>{const root=treeFromLevel(i.root),all=nodesOf(root),result=[];const scene=active=>{const s=treeView(root,{active});for(const n of all)if(n.next)s.edges.push({from:n.id,to:n.next.id,label:'next',directed:true});return s;};shot(e,scene([]),'初始 next 全为空');for(let level=root;level;){const vals=[],dummy={next:null};let tail=dummy;for(let p=level;p;p=p.next){vals.push(p.val);for(const child of [p.left,p.right])if(child){tail.next=child;tail=child;shot(e,scene([p.id,child.id]),'串联下一层孩子',{},[5,6]);}}tail.next=null;result.push(vals);level=dummy.next;shot(e,scene(level?[level.id]:[]),'移动到下一层',{已完成层:result.length},[8]);}return result;},[[{root:[]},[]],[{root:[1,null,2,3,4]},[[1],[2],[3,4]]]],treeCheck);

add(114,'把二叉树原地展开为先序顺序的单向链，所有 left 置空，right 指向后继。','返回展开后树的紧凑层序数组；复用原节点。',[
 ['寻找左子树最右节点','它将在展开后接到原右子树。'],['搬移左子树','最右节点接上右子树，再把左子树移到右侧并清空左边。'],['沿右链推进','每个节点重复上述操作，形成先序链。']], 'O(n)','O(1)',{root:[1,2,5,3,4,null,6]},[1,null,2,null,3,null,4,null,5,null,6],
`func flatten(root *TreeNode) {
 for cur:=root;cur!=nil;cur=cur.Right {
  if cur.Left!=nil {
   pre:=cur.Left;for pre.Right!=nil { pre=pre.Right }
   pre.Right=cur.Right;cur.Right=cur.Left;cur.Left=nil
  }
 }
}`,(i,e)=>{const r=treeFromLevel(i.root);shot(e,treeView(r),'展开前');for(let cur=r;cur;cur=cur.right){if(cur.left){let pre=cur.left;while(pre.right)pre=pre.right;pre.right=cur.right;cur.right=cur.left;cur.left=null;}shot(e,treeView(r,{active:[cur.id]}),'将左子树搬到右链',{},[4,5]);}return treeToLevel(r);},[[{root:[]},[]],[{root:[1,2]},[1,null,2]]],treeCheck);

add(112,'判断是否存在根到叶的路径，使路径上节点值之和等于 targetSum。','路径必须从根到叶；空树不存在路径。',[
 ['携带剩余目标','每经过一个节点，从目标中减去节点值。'],['在叶子判断','只有到达叶子且剩余为零才成功。'],['搜索任一分支','左右子树任一成功即可返回 true。']], 'O(n)','O(h)',{root:[5,4,8,11,null,13,4,7,2,null,null,null,1],targetSum:22},true,
`func hasPathSum(root *TreeNode,targetSum int) bool {
 if root==nil { return false }
 targetSum-=root.Val
 if root.Left==nil && root.Right==nil { return targetSum==0 }
 return hasPathSum(root.Left,targetSum)||hasPathSum(root.Right,targetSum)
}`,(i,e)=>{const root=treeFromLevel(i.root);shot(e,treeView(root),'从目标和开始');function dfs(n,left,path){if(!n)return false;left-=n.val;const p=[...path,n.id];shot(e,treeView(root,{active:[n.id],done:p}),'减去路径节点值',{剩余:left},[3,4]);if(!n.left&&!n.right)return left===0;return dfs(n.left,left,p)||dfs(n.right,left,p);}return dfs(root,i.targetSum,[]);},[[{root:[],targetSum:0},false],[{root:[1,2],targetSum:1},false]],i=>{treeCheck(i);integer(i.targetSum,-1e9,1e9,'目标和');});

add(129,'根到叶的节点数字依次连接成十进制数，返回所有路径数字之和。','每个节点为 0 到 9；演示限制深度不超过 12，保证整数精度。',[
 ['维护路径数字','到达节点时，用旧值乘十再加当前数字。'],['叶子贡献答案','根到叶才是一条完整数字，将其加入总和。'],['合并两侧结果','左右子树返回值相加。']], 'O(n)','O(h)',{root:[4,9,0,5,1]},1026,
`func sumNumbers(root *TreeNode) int {
 var dfs func(*TreeNode,int)int
 dfs=func(n *TreeNode,value int)int {
  if n==nil { return 0 };value=value*10+n.Val
  if n.Left==nil && n.Right==nil { return value }
  return dfs(n.Left,value)+dfs(n.Right,value)
 }
 return dfs(root,0)
}`,(i,e)=>{const root=treeFromLevel(i.root);shot(e,treeView(root),'路径数字从零开始');function dfs(n,v){if(!n)return 0;v=v*10+n.val;shot(e,treeView(root,{active:[n.id]}),'追加一位十进制数字',{路径数字:v},[4]);return !n.left&&!n.right?v:dfs(n.left,v)+dfs(n.right,v);}return dfs(root,0);},[[{root:[]},0],[{root:[1,0,2]},22]],i=>{treeCheck(i);invariant(i.root.every(x=>x===null||x>=0&&x<=9),'节点须为一位数字。');function depth(n){return n?1+Math.max(depth(n.left),depth(n.right)):0;}invariant(depth(treeFromLevel(i.root))<=12,'数字路径深度最多为 12。');});

add(124,'返回二叉树任意非空简单路径的最大节点和。','路径可从任意节点开始结束，但不能重复经过节点。',[
 ['求单侧贡献','子树向父节点只允许贡献一条分支，负贡献当作零。'],['尝试当前节点作拐点','左贡献加节点值加右贡献更新全局最大值。'],['返回一侧最优','向上返回节点值加两侧较大贡献，避免路径分叉。']], 'O(n)','O(h)',{root:[-10,9,20,null,null,15,7]},42,
`func maxPathSum(root *TreeNode) int {
 best:=root.Val
 var gain func(*TreeNode)int
 gain=func(n *TreeNode)int {
  if n==nil { return 0 };l,r:=gain(n.Left),gain(n.Right)
  if l<0 { l=0 };if r<0 { r=0 }
  if n.Val+l+r>best { best=n.Val+l+r }
  if l>r { return n.Val+l };return n.Val+r
 }
 gain(root);return best
}`,(i,e)=>{const root=treeFromLevel(i.root);let best=root.val;shot(e,treeView(root),'允许任意节点成为拐点');function dfs(n){if(!n)return 0;const l=Math.max(0,dfs(n.left)),r=Math.max(0,dfs(n.right));best=Math.max(best,n.val+l+r);shot(e,treeView(root,{active:[n.id]}),'评估拐点与向上贡献',{左贡献:l,右贡献:r,全局最佳:best},[6,7,8]);return n.val+Math.max(l,r);}dfs(root);return best;},[[{root:[-3]},-3],[{root:[2,-1]},2]],i=>{treeCheck(i);invariant(i.root.length&&i.root[0]!==null,'最大路径和要求非空树。');});

add(173,'实现二叉搜索树中序迭代器，next 返回下一个最小值，hasNext 判断是否还有节点。','输入 root 与 ops；构造不写入 ops，ops 只含 next 或 hasNext。next 调用时必须存在节点。',[
 ['压入整条左链','栈顶保存尚未返回的最小节点。'],['弹出下一个','弹出栈顶作为返回值，再压入该节点右子树的左链。'],['检查栈是否为空','栈非空即存在后续节点。']], 'next 均摊 O(1)，hasNext O(1)','O(h)',{root:[7,3,15,null,null,9,20],ops:['next','next','hasNext','next','hasNext','next','next','hasNext']},[3,7,true,9,true,15,20,false],
`type BSTIterator struct { stack []*TreeNode }
 func Constructor(root *TreeNode) BSTIterator { it:=BSTIterator{};it.pushLeft(root);return it }
 func (it *BSTIterator) pushLeft(n *TreeNode) { for n!=nil { it.stack=append(it.stack,n);n=n.Left } }
 func (it *BSTIterator) Next() int {
  k:=len(it.stack)-1;n:=it.stack[k];it.stack=it.stack[:k];it.pushLeft(n.Right);return n.Val
 }
 func (it *BSTIterator) HasNext() bool { return len(it.stack)>0 }`,(i,e)=>{const root=treeFromLevel(i.root),stack=[],out=[],done=[];const push=n=>{for(;n;n=n.left){stack.push(n);shot(e,treeView(root,{active:[n.id],done}), '压入左链节点',{栈:stack.map(n=>n.val)},[3]);}};shot(e,treeView(root),'初始化中序迭代器');push(root);for(const op of i.ops){if(op==='next'){invariant(stack.length,'next 调用时已经没有节点。');const n=stack.pop();done.push(n.id);push(n.right);out.push(n.val);}else out.push(stack.length>0);shot(e,treeView(root,{active:stack.map(n=>n.id),done}), '执行迭代器操作',{操作:op,返回:out.at(-1)},op==='next'?[5]:[7]);}return out;},[[{root:[],ops:['hasNext']},[false]],[{root:[2,1,3],ops:['next','next','next','hasNext']},[1,2,3,false]]],i=>{treeCheck(i);array(i.ops,'ops',90);invariant(i.ops.every(x=>['next','hasNext'].includes(x)),'未知迭代器操作。');validateBSTInput(i.root);});

add(222,'统计完全二叉树的节点个数。','最后一层向左连续填充，其余层全满；输入会检查完全性。',[
 ['比较左右边界高度','沿最左和最右路径计算高度。'],['满树直接求和','高度相同说明该子树全满，节点数为 2^h-1。'],['递归不满子树','否则分别统计左右子树，再加根节点。']], 'O(log² n)','O(log n)',{root:[1,2,3,4,5,6]},6,
`func countNodes(root *TreeNode) int {
 if root==nil { return 0 };l,r:=0,0
 for p:=root;p!=nil;p=p.Left { l++ }
 for p:=root;p!=nil;p=p.Right { r++ }
 if l==r { return (1<<l)-1 }
 return 1+countNodes(root.Left)+countNodes(root.Right)
}`,(i,e)=>{const root=treeFromLevel(i.root);shot(e,treeView(root),'从完全树根开始');function count(n){if(!n)return 0;let l=0,r=0;for(let p=n;p;p=p.left)l++;for(let p=n;p;p=p.right)r++;shot(e,treeView(root,{active:[n.id]}),'比较两条边界高度',{左高:l,右高:r,满树:l===r},[3,4,5]);return l===r?2**l-1:1+count(n.left)+count(n.right);}return count(root);},[[{root:[]},0],[{root:[1,2,3,4,5,6,7]},7]],i=>{treeCheck(i);const r=treeFromLevel(i.root),q=[r];let seenEmpty=false;for(let k=0;k<q.length;k++){const n=q[k];if(!n)seenEmpty=true;else{invariant(!seenEmpty,'输入必须是完全二叉树。');q.push(n.left,n.right);}}});

add(236,'找出二叉树中两个指定节点的最近公共祖先，返回该祖先的值。','p、q 使用层序序列位置 ID（从 0 开始），以区分相同值节点；两节点必须存在。',[
 ['寻找目标节点','遇到 p 或 q 就向上返回该节点。'],['汇合左右结果','左右各找到一个目标时，当前节点就是最近公共祖先。'],['向上传递单侧','只有一侧非空时，继续将该结果传给父节点。']], 'O(n)','O(h)',{root:[3,5,1,6,2,0,8,null,null,7,4],p:1,q:10},5,
`func lowestCommonAncestor(root,p,q *TreeNode) *TreeNode {
 if root==nil || root==p || root==q { return root }
 left:=lowestCommonAncestor(root.Left,p,q);right:=lowestCommonAncestor(root.Right,p,q)
 if left!=nil && right!=nil { return root }
 if left!=nil { return left };return right
}`,(i,e)=>{const root=treeFromLevel(i.root),ns=nodesOf(root),p=ns.find(n=>n.id===String(i.p)),q=ns.find(n=>n.id===String(i.q));shot(e,treeView(root,{done:[p.id,q.id]}),'标记两个目标身份');function dfs(n){if(!n||n===p||n===q)return n;const l=dfs(n.left),r=dfs(n.right),answer=l&&r?n:l??r;shot(e,treeView(root,{active:[n.id],done:[p.id,q.id]}),'合并两侧搜索结果',{左:l?.id??null,右:r?.id??null,返回:answer?.id??null},[3,4,5]);return answer;}return dfs(root).val;},[[{root:[1,1,2],p:1,q:2},1],[{root:[1,null,2,3],p:2,q:3},2]],i=>{treeCheck(i);const ids=new Set(nodesOf(treeFromLevel(i.root)).map(n=>Number(n.id)));invariant(ids.has(i.p)&&ids.has(i.q),'p 和 q 须为存在节点的层序位置 ID。');});

function levelTraverse(i,e,mode){const root=treeFromLevel(i.root),out=[],done=[];let queue=root?[root]:[],depth=0;shot(e,treeView(root),'从根层开始');while(queue.length){const next=[],values=[];for(const n of queue){values.push(n.val);done.push(n.id);if(n.left)next.push(n.left);if(n.right)next.push(n.right);shot(e,treeView(root,{active:[n.id],done}), '访问当前层节点',{层:depth,当前层:values},[5]);}if(mode==='right')out.push(values.at(-1));else if(mode==='average')out.push(values.reduce((a,b)=>a+b,0)/values.length);else out.push(mode==='zigzag'&&depth%2?values.reverse():values);queue=next;depth++;shot(e,treeView(root,{active:queue.map(n=>n.id),done}),'推进下一层',{已完成:out},[7]);}return out;}
add(199,'从右侧观察二叉树，返回每一层最右节点的值。','按从上到下顺序输出；空树返回空数组。',[
 ['按层遍历','队列每轮只处理本层开始时已有的节点。'],['记录最后节点','本层最后出队的节点就是右视图可见点。'],['进入下一层','依次加入非空左右孩子，保持从左到右顺序。']], 'O(n)','O(w)',{root:[1,2,3,null,5,null,4]},[1,3,4],
`func rightSideView(root *TreeNode) []int {
 ans:=[]int{};if root==nil { return ans };queue:=[]*TreeNode{root}
 for len(queue)>0 {
  size:=len(queue)
  for j:=0;j<size;j++ { n:=queue[0];queue=queue[1:];if j==size-1 { ans=append(ans,n.Val) }
   if n.Left!=nil { queue=append(queue,n.Left) };if n.Right!=nil { queue=append(queue,n.Right) }
  }
 }
 return ans
}`,(i,e)=>levelTraverse(i,e,'right'),[[{root:[]},[]],[{root:[1,2,null,3]},[1,2,3]]],treeCheck);

add(637,'返回二叉树每一层节点值的平均数。','使用浮点除法，允许负数节点。',[
 ['固定本层长度','每轮队列开始时的长度是本层节点数。'],['累计本层总和','取出本层所有节点，并将孩子加入队列。'],['除以节点个数','将浮点平均值追加到输出。']], 'O(n)','O(w)',{root:[3,9,20,null,null,15,7]},[3,14.5,11],
`func averageOfLevels(root *TreeNode) []float64 {
 ans:=[]float64{};if root==nil { return ans };queue:=[]*TreeNode{root}
 for len(queue)>0 {
  size:=len(queue);sum:=0.0
  for j:=0;j<size;j++ { n:=queue[0];queue=queue[1:];sum+=float64(n.Val)
   if n.Left!=nil { queue=append(queue,n.Left) };if n.Right!=nil { queue=append(queue,n.Right) }
  };ans=append(ans,sum/float64(size))
 }
 return ans
}`,(i,e)=>levelTraverse(i,e,'average'),[[{root:[]},[]],[{root:[1,-2,3]},[1,0.5]]],treeCheck);

add(102,'按从上到下、每层从左到右返回二叉树层序遍历。','每层单独保存为数组，空树返回 []。',[
 ['初始化根队列','先让队列只包含根节点。'],['分层取出','固定层大小，逐个取出本层节点并记录值。'],['入队下一层','左右孩子按顺序入队，下一轮再处理。']], 'O(n)','O(w)',{root:[3,9,20,null,null,15,7]},[[3],[9,20],[15,7]],
`func levelOrder(root *TreeNode) [][]int {
 ans:=[][]int{};if root==nil { return ans };queue:=[]*TreeNode{root}
 for len(queue)>0 {
  size:=len(queue);row:=[]int{}
  for j:=0;j<size;j++ { n:=queue[0];queue=queue[1:];row=append(row,n.Val)
   if n.Left!=nil { queue=append(queue,n.Left) };if n.Right!=nil { queue=append(queue,n.Right) }
  };ans=append(ans,row)
 }
 return ans
}`,(i,e)=>levelTraverse(i,e,'normal'),[[{root:[]},[]],[{root:[1,null,2,3]},[[1],[2],[3]]]],treeCheck);

add(103,'按层交替从左到右、从右到左输出二叉树节点。','第一层从左到右，之后每层反向；树的边始终保持原结构。',[
 ['正常广度遍历','队列始终按从左到右顺序扩展孩子。'],['隔层反转结果','奇数层反转当层值数组，偶数层保持。'],['切换方向','每层处理后增加深度，交替输出方向。']], 'O(n)','O(w)',{root:[3,9,20,null,null,15,7]},[[3],[20,9],[15,7]],
`func zigzagLevelOrder(root *TreeNode) [][]int {
 ans:=[][]int{};if root==nil { return ans };queue:=[]*TreeNode{root}
 for depth:=0;len(queue)>0;depth++ {
  size:=len(queue);row:=make([]int,size)
  for j:=0;j<size;j++ { n:=queue[0];queue=queue[1:];idx:=j;if depth%2==1 { idx=size-1-j };row[idx]=n.Val
   if n.Left!=nil { queue=append(queue,n.Left) };if n.Right!=nil { queue=append(queue,n.Right) }
  };ans=append(ans,row)
 }
 return ans
}`,(i,e)=>levelTraverse(i,e,'zigzag'),[[{root:[]},[]],[{root:[1,2,3,4,null,null,5]},[[1],[3,2],[4,5]]]],treeCheck);

function validateBSTInput(level,minNodes=0){rootInput(level);let count=0,prev=-Infinity;function visit(n){if(!n)return;visit(n.left);invariant(n.val>prev,'输入必须是严格二叉搜索树。');prev=n.val;count++;visit(n.right);}visit(treeFromLevel(level));invariant(count>=minNodes,`至少需要 ${minNodes} 个节点。`);return count;}
add(530,'返回二叉搜索树任意两个不同节点值之间的最小绝对差。','严格 BST 且至少有两个节点；中序遍历产生递增序列。',[
 ['中序访问','先左、再根、再右，得到严格递增值。'],['只比较前驱','有序序列最小差必来自相邻节点。'],['维护最小差','每次更新前驱并缩小答案。']], 'O(n)','O(h)',{root:[4,2,6,1,3]},1,
`func getMinimumDifference(root *TreeNode) int {
 prev:=0;hasPrev:=false;best:=int(^uint(0)>>1)
 var visit func(*TreeNode)
 visit=func(n *TreeNode) {
  if n==nil { return };visit(n.Left)
  if hasPrev && n.Val-prev<best { best=n.Val-prev };prev=n.Val;hasPrev=true
  visit(n.Right)
 };visit(root);return best
}`,(i,e)=>{const root=treeFromLevel(i.root);let prev=null,best=Infinity;shot(e,treeView(root),'开始中序遍历');function visit(n){if(!n)return;visit(n.left);if(prev!==null)best=Math.min(best,n.val-prev);shot(e,treeView(root,{active:[n.id]}),'比较中序相邻值',{前驱:prev,当前:n.val,最小差:Number.isFinite(best)?best:null},[6]);prev=n.val;visit(n.right);}visit(root);return best;},[[{root:[1,null,5]},4],[{root:[10,3,20,null,8]},2]],i=>validateBSTInput(i.root,2));

add(230,'返回二叉搜索树中第 k 小的节点值。','k 从 1 开始，且不能超过节点数。',[
 ['沿左链入栈','栈顶为尚未访问的最小节点。'],['逐个中序弹出','每弹出一次就将 k 减一，为零时返回。'],['扩展右子树','将弹出节点右子树的左链压栈。']], 'O(h+k)','O(h)',{root:[5,3,6,2,4,null,null,1],k:3},3,
`func kthSmallest(root *TreeNode,k int) int {
 stack:=[]*TreeNode{}
 for root!=nil || len(stack)>0 {
  for root!=nil { stack=append(stack,root);root=root.Left }
  n:=stack[len(stack)-1];stack=stack[:len(stack)-1];k--
  if k==0 { return n.Val };root=n.Right
 }
 return 0
}`,(i,e)=>{const root=treeFromLevel(i.root),stack=[],done=[];let cur=root,k=i.k;shot(e,treeView(root),'寻找第 k 小');while(cur||stack.length){while(cur){stack.push(cur);shot(e,treeView(root,{active:stack.map(n=>n.id),done}),'左链入栈',{},[4]);cur=cur.left;}const n=stack.pop();done.push(n.id);k--;shot(e,treeView(root,{active:[n.id],done}),'中序计数减一',{剩余:k},[5,6]);if(!k)return n.val;cur=n.right;}return null;},[[{root:[1],k:1},1],[{root:[3,1,4,null,2],k:4},4]],i=>{const n=validateBSTInput(i.root,1);integer(i.k,1,n,'k');});

add(98,'判断二叉树是否满足严格二叉搜索树性质。','每个节点必须大于左子树所有值、小于右子树所有值；重复值不合法。',[
 ['传递合法区间','根初始范围无限，向孩子传递祖先约束。'],['验证当前值','节点必须严格位于上下界之间。'],['缩小子树边界','左子树上界为当前值，右子树下界为当前值。']], 'O(n)','O(h)',{root:[5,1,4,null,null,3,6]},false,
`func isValidBST(root *TreeNode) bool {
 var valid func(*TreeNode,*TreeNode,*TreeNode)bool
 valid=func(n,low,high *TreeNode)bool {
  if n==nil { return true }
  if (low!=nil && n.Val<=low.Val)||(high!=nil && n.Val>=high.Val) { return false }
  return valid(n.Left,low,n)&&valid(n.Right,n,high)
 }
 return valid(root,nil,nil)
}`,(i,e)=>{const root=treeFromLevel(i.root);shot(e,treeView(root),'上下界初始无限');function valid(n,low,high){if(!n)return true;const ok=n.val>low&&n.val<high;shot(e,treeView(root,{active:[n.id]}),ok?'当前值满足祖先边界':'当前值越过合法边界',{下界:Number.isFinite(low)?low:'负无穷',上界:Number.isFinite(high)?high:'正无穷'},[5]);return ok&&valid(n.left,low,n.val)&&valid(n.right,n.val,high);}return valid(root,-Infinity,Infinity);},[[{root:[]},true],[{root:[2,2,3]},false]],treeCheck);

const directions=[[1,0],[-1,0],[0,1],[0,-1]];
add(200,'统计由水平或竖直相邻陆地组成的岛屿数量。','grid 中字符 "1" 为陆地，"0" 为水；不连接对角。',[
 ['扫描未访问陆地','每次遇到未访问的 1，岛屿数量加一。'],['深度优先淹没','将该格改为 0，并递归探索四个方向。'],['继续扫描','同一连通块不会再次计数。']], 'O(mn)','O(mn)',{grid:['11000','11000','00100','00011'].map(s=>s.split(''))},3,
`func numIslands(grid [][]byte) int {
 if len(grid)==0 { return 0 };m,n:=len(grid),len(grid[0]);count:=0
 var flood func(int,int)
 flood=func(r,c int) {
  if r<0||r>=m||c<0||c>=n||grid[r][c]!='1' { return };grid[r][c]='0'
  flood(r+1,c);flood(r-1,c);flood(r,c+1);flood(r,c-1)
 }
 for r:=0;r<m;r++ { for c:=0;c<n;c++ { if grid[r][c]=='1' { count++;flood(r,c) } } }
 return count
}`,(i,e)=>{const g=i.grid,R=g.length,C=g[0]?.length??0,done=[];let count=0;shot(e,grid(g),'扫描海陆网格');function flood(r,c){if(r<0||r>=R||c<0||c>=C||g[r][c]!=='1')return;g[r][c]='0';done.push([r,c]);shot(e,grid(g,[[r,c]],done),'访问并标记该岛陆地',{岛屿数:count},[5]);for(const [dr,dc]of directions)flood(r+dr,c+dc);}for(let r=0;r<R;r++)for(let c=0;c<C;c++)if(g[r][c]==='1'){count++;flood(r,c);}return count;},[[{grid:[]},0],[{grid:[['1','0'],['0','1']]},2]],i=>binaryMatrix(i.grid,true));

add(130,'将所有被 X 完全包围的 O 区域填成 X，返回棋盘。','四方向连通边界的 O 不被包围；输入只包含 X 和 O。',[
 ['从边界出发','边界 O 必安全，沿四方向搜索所有相连 O。'],['临时标记安全区','安全 O 改成 #，防止重复探索。'],['统一翻转恢复','剩余 O 改成 X，# 恢复为 O。']], 'O(mn)','O(mn)',{board:['XXXX','XOOX','XXOX','XOXX'].map(s=>s.split(''))},['XXXX','XXXX','XXXX','XOXX'].map(s=>s.split('')),
`func solve(board [][]byte) {
 if len(board)==0||len(board[0])==0 { return };m,n:=len(board),len(board[0])
 var mark func(int,int)
 mark=func(r,c int) {
  if r<0||r>=m||c<0||c>=n||board[r][c]!='O' { return };board[r][c]='#'
  mark(r+1,c);mark(r-1,c);mark(r,c+1);mark(r,c-1)
 }
 for r:=0;r<m;r++ { mark(r,0);mark(r,n-1) };for c:=0;c<n;c++ { mark(0,c);mark(m-1,c) }
 for r:=0;r<m;r++ { for c:=0;c<n;c++ { if board[r][c]=='O' { board[r][c]='X' } else if board[r][c]=='#' { board[r][c]='O' } } }
}`,(i,e)=>{const b=i.board,R=b.length,C=b[0]?.length??0;shot(e,grid(b),'查找与边界相连的 O');function mark(r,c){if(r<0||r>=R||c<0||c>=C||b[r][c]!=='O')return;b[r][c]='#';shot(e,grid(b,[[r,c]]),'标记安全区域',{},[5]);for(const [dr,dc]of directions)mark(r+dr,c+dc);}for(let r=0;r<R;r++){mark(r,0);mark(r,C-1);}for(let c=0;c<C;c++){mark(0,c);mark(R-1,c);}for(let r=0;r<R;r++)for(let c=0;c<C;c++)if(b[r][c]!=='X'){b[r][c]=b[r][c]==='#'?'O':'X';shot(e,grid(b,[[r,c]]),'恢复安全格并捕获内部格',{},[9]);}return b;},[[{board:[]},[]],[{board:[['O','O'],['O','O']]},[['O','O'],['O','O']]]],i=>{matrix(i.board);invariant(i.board.every(r=>r.every(x=>x==='X'||x==='O')),'棋盘只支持 X 与 O。');});

add(133,'返回无向连通图的深拷贝，用邻接表表示副本。','adj 第 i 行记录编号 i+1 的邻居；节点编号唯一，空图返回 []。',[
 ['复制起点','哈希表将原图节点身份映射到独立副本。'],['递归复制邻居','未见邻居先建立副本，再复制邻边，避免环上无限递归。'],['返回新图','图中同时显示原图与逐步建立的副本。']], 'O(V+E)','O(V+E)',{adj:[[2,4],[1,3],[2,4],[1,3]]},[[2,4],[1,3],[2,4],[1,3]],
`func cloneGraph(node *Node) *Node {
 copies:=map[*Node]*Node{}
 var copyNode func(*Node)*Node
 copyNode=func(n *Node)*Node {
  if n==nil { return nil };if c,ok:=copies[n];ok { return c }
  c:=&Node{Val:n.Val};copies[n]=c
  for _,next:=range n.Neighbors { c.Neighbors=append(c.Neighbors,copyNode(next)) }
  return c
 }
 return copyNode(node)
}`,(i,e)=>{const copied=new Map(),base=graphView(i.adj);base.nodes=base.nodes.map(n=>({...n,id:'o'+n.id}));base.edges=base.edges.map(x=>({...x,from:'o'+x.from,to:'o'+x.to}));const scene=active=>({kind:'graph',nodes:[...base.nodes,...[...copied.keys()].map(k=>({id:'c'+k,label:String(k+1)}))],edges:[...base.edges,...[...copied.entries()].flatMap(([k,ns])=>ns.map(v=>({from:'c'+k,to:'c'+v,label:'副本',directed:true})))],active});shot(e,scene([]),'原图与尚未建立的副本');function copy(k){if(copied.has(k))return;copied.set(k,[]);shot(e,scene(['c'+k]),'创建副本节点',{},[6]);for(const v of i.adj[k]){copy(v-1);copied.get(k).push(v-1);shot(e,scene(['c'+k,'c'+(v-1)]),'追加副本邻边',{},[7]);}}if(i.adj.length)copy(0);return i.adj.map((_,k)=>copied.get(k).map(v=>v+1));},[[{adj:[]},[]],[{adj:[[]]},[[]]]],i=>{array(i.adj,'adj',30);i.adj.forEach((row,k)=>{array(row,'邻居',30);invariant(row.every(v=>Number.isInteger(v)&&v>=1&&v<=i.adj.length&&v!==k+1)&&new Set(row).size===row.length,'邻居编号无效或重复。');});for(let k=0;k<i.adj.length;k++)for(const v of i.adj[k])invariant(i.adj[v-1].includes(k+1),'无向图的边须双向给出。');if(i.adj.length){const seen=new Set([0]),q=[0];for(let j=0;j<q.length;j++)for(const v of i.adj[q[j]])if(!seen.has(v-1)){seen.add(v-1);q.push(v-1);}invariant(seen.size===i.adj.length,'输入图须连通。');}});

add(399,'给定变量间的除法等式，计算每个查询的比值；无法确定时返回 -1。','equations 与 values 一一对应；值为正且等式一致；未出现的变量不可用于自除。',[
 ['建立带权双向图','a/b=v 对应 a→b 权重 v，以及 b→a 权重 1/v。'],['搜索查询路径','从分子出发，沿途乘边权。'],['判定可达','到达分母返回累计乘积，未知或不连通返回 -1。']], 'O(E+Q(V+E))','O(V+E)',{equations:[['a','b'],['b','c']],values:[2,3],queries:[['a','c'],['b','a'],['a','e'],['a','a'],['x','x']]},[6,0.5,-1,1,-1],
`func calcEquation(equations [][]string,values []float64,queries [][]string) []float64 {
 type edge struct { to string; weight float64 };graph:=map[string][]edge{}
 for j,p:=range equations { a,b:=p[0],p[1];graph[a]=append(graph[a],edge{b,values[j]});graph[b]=append(graph[b],edge{a,1/values[j]}) }
 ans:=make([]float64,len(queries))
 for j,q:=range queries {
  seen:=map[string]bool{};var dfs func(string,float64)float64
  dfs=func(v string,value float64)float64 {
   if v==q[1] { return value };seen[v]=true
   for _,e:=range graph[v] { if !seen[e.to] { if x:=dfs(e.to,value*e.weight);x!=-1 { return x } } };return -1
  }
  _,a:=graph[q[0]];_,b:=graph[q[1]];ans[j]=-1;if a&&b { ans[j]=dfs(q[0],1) }
 }
 return ans
}`,(i,e)=>{const g=new Map(),edges=[];for(let k=0;k<i.equations.length;k++){const [a,b]=i.equations[k],v=i.values[k];if(!g.has(a))g.set(a,[]);if(!g.has(b))g.set(b,[]);g.get(a).push([b,v]);g.get(b).push([a,1/v]);edges.push({from:a,to:b,label:String(v),directed:true},{from:b,to:a,label:String(1/v),directed:true});}const scene=(active=[],done=[])=>({kind:'graph',nodes:[...g.keys()].map(id=>({id,label:id})),edges,active,done});shot(e,scene(),'建立带权双向边');return i.queries.map(([a,b])=>{const seen=new Set();function dfs(v,value){shot(e,scene([v],[...seen]),'沿路径累计比值',{查询:`${a}/${b}`,乘积:value},[8,9]);if(v===b)return value;seen.add(v);for(const [n,w]of g.get(v))if(!seen.has(n)){const answer=dfs(n,value*w);if(answer!==-1)return answer;}return -1;}if(!g.has(a)||!g.has(b)){shot(e,scene(),'查询包含未知变量',{查询:`${a}/${b}`},[11]);return -1;}return dfs(a,1);});},[[{equations:[],values:[],queries:[['a','a']]},[-1]],[{equations:[['x','y'],['a','b']],values:[4,5],queries:[['y','x'],['x','b']]},[0.25,-1]]],i=>{array(i.equations,'equations',40);array(i.values,'values',40);array(i.queries,'queries',40);invariant(i.equations.length===i.values.length&&i.values.every(v=>Number.isFinite(v)&&v>0),'等式和值须一一对应，权重为正。');for(const p of [...i.equations,...i.queries])invariant(Array.isArray(p)&&p.length===2&&p.every(s=>typeof s==='string'&&/^[a-zA-Z0-9]{1,8}$/.test(s)),'变量对格式不正确。');});

function courseCheck(i){integer(i.numCourses,0,50,'课程数');array(i.prerequisites,'先修边',100);invariant(i.prerequisites.every(p=>Array.isArray(p)&&p.length===2&&p.every(v=>Number.isInteger(v)&&v>=0&&v<i.numCourses)),'先修边须包含两个合法课程编号。');}
function courseSolve(i,e,wantOrder){const n=i.numCourses,g=Array.from({length:n},()=>[]),indeg=Array(n).fill(0),done=[],edges=[];for(const [v,u]of i.prerequisites){g[u].push(v);indeg[v]++;edges.push({from:String(u),to:String(v),directed:true});}const scene=active=>({kind:'graph',nodes:g.map((_,k)=>({id:String(k),label:`${k} · 入${indeg[k]}`})),edges,active:active.map(String),done:done.map(String)});shot(e,scene([]),'统计课程入度',{入度:indeg});const q=[];indeg.forEach((d,k)=>{if(!d)q.push(k);});for(let h=0;h<q.length;h++){const u=q[h];done.push(u);shot(e,scene([u]),'选修入度为零课程',{课程顺序:done},[5]);for(const v of g[u]){indeg[v]--;if(!indeg[v])q.push(v);shot(e,scene([v]),'解除一条先修约束',{入度:indeg},[6]);}}return wantOrder?(done.length===n?done:[]):done.length===n;}
add(207,'判断能否完成所有课程，先修条件 [a,b] 表示先学 b 再学 a。','课程编号 0 到 numCourses-1；有向图存在环时无法全部完成。',[
 ['统计入度','每条先修边从前置课指向后续课。'],['依次移除零入度','选择无未完成先修课的课程，并减少后继入度。'],['检查处理数量','能处理全部节点即无环，否则剩余节点处于依赖环中。']], 'O(V+E)','O(V+E)',{numCourses:4,prerequisites:[[1,0],[2,0],[3,1],[3,2]]},true,
`func canFinish(numCourses int,prerequisites [][]int) bool {
 graph:=make([][]int,numCourses);degree:=make([]int,numCourses)
 for _,p:=range prerequisites { graph[p[1]]=append(graph[p[1]],p[0]);degree[p[0]]++ }
 queue:=[]int{};for v,d:=range degree { if d==0 { queue=append(queue,v) } };count:=0
 for h:=0;h<len(queue);h++ { u:=queue[h];count++
  for _,v:=range graph[u] { degree[v]--;if degree[v]==0 { queue=append(queue,v) } }
 }
 return count==numCourses
}`,(i,e)=>courseSolve(i,e,false),[[{numCourses:2,prerequisites:[[1,0],[0,1]]},false],[{numCourses:1,prerequisites:[]},true]],courseCheck);

add(210,'返回一种完成全部课程的学习顺序，若不可能则返回空数组。','先修关系 [a,b] 表示 b 必须出现在 a 之前；本演示按编号初始化可选队列。',[
 ['构造依赖图','记录每门课程后继与入度。'],['收集可学课程','零入度课程入队，出队时加入学习顺序。'],['消除依赖','减少后继入度并解锁新课程；输出不足总数表示有环。']], 'O(V+E)','O(V+E)',{numCourses:4,prerequisites:[[1,0],[2,0],[3,1],[3,2]]},[0,1,2,3],
`func findOrder(numCourses int,prerequisites [][]int) []int {
 graph:=make([][]int,numCourses);degree:=make([]int,numCourses)
 for _,p:=range prerequisites { graph[p[1]]=append(graph[p[1]],p[0]);degree[p[0]]++ }
 queue,ans:=[]int{},[]int{};for v,d:=range degree { if d==0 { queue=append(queue,v) } }
 for h:=0;h<len(queue);h++ { u:=queue[h];ans=append(ans,u)
  for _,v:=range graph[u] { degree[v]--;if degree[v]==0 { queue=append(queue,v) } }
 }
 if len(ans)!=numCourses { return []int{} };return ans
}`,(i,e)=>courseSolve(i,e,true),[[{numCourses:2,prerequisites:[[1,0],[0,1]]},[]],[{numCourses:3,prerequisites:[[0,2],[1,0]]},[2,0,1]]],courseCheck);

add(909,'在蛇梯棋棋盘上，从编号 1 出发掷骰前进，返回到终点的最少次数。','编号从左下开始蛇形排列；每次走 1 到 6 格，落到蛇或梯只跳一次，-1 表示普通格。',[
 ['转换编号坐标','按从下往上的行号判断当前行的左右方向。'],['广度优先掷骰','队列记录到达每个编号的最少掷骰次数。'],['应用一次跳转','落点有蛇梯则跳到指定编号；首次到达终点即最优。']], 'O(n²)','O(n²)',{board:[[-1,-1,-1,-1,-1,-1],[-1,-1,-1,-1,-1,-1],[-1,-1,-1,-1,-1,-1],[-1,35,-1,-1,13,-1],[-1,-1,-1,-1,-1,-1],[-1,15,-1,-1,-1,-1]]},4,
`func snakesAndLadders(board [][]int) int {
 n:=len(board);target:=n*n;dist:=make([]int,target+1);for j:=range dist { dist[j]=-1 };dist[1]=0;queue:=[]int{1}
 for h:=0;h<len(queue);h++ {
  u:=queue[h];if u==target { return dist[u] }
  for landing:=u+1;landing<=u+6 && landing<=target;landing++ {
   rowFromBottom:=(landing-1)/n;c:=(landing-1)%n;if rowFromBottom%2==1 { c=n-1-c };r:=n-1-rowFromBottom
   v:=landing;if board[r][c]!=-1 { v=board[r][c] }
   if dist[v]==-1 { dist[v]=dist[u]+1;queue=append(queue,v) }
  }
 }
 return -1
}`,(i,e)=>{const b=i.board,n=b.length,target=n*n,dist=Array(target+1).fill(-1),q=[1],done=[];dist[1]=0;const cell=v=>{const r=Math.floor((v-1)/n),c=(v-1)%n;return [n-1-r,r%2?n-1-c:c];};shot(e,grid(b,[cell(1)]),'从编号 1 开始掷骰');for(let h=0;h<q.length;h++){const u=q[h];if(u===target)return dist[u];for(let landing=u+1;landing<=Math.min(u+6,target);landing++){const [r,c]=cell(landing),v=b[r][c]===-1?landing:b[r][c];if(dist[v]!==-1)continue;dist[v]=dist[u]+1;q.push(v);done.push(cell(v));shot(e,grid(b,[cell(landing),cell(v)],done),landing===v?'掷骰到达新位置':'落点触发一次蛇梯跳转',{起点:u,掷骰:landing-u,终点:v,次数:dist[v]},[6,7,8]);}}return -1;},[[{board:[[-1,-1],[-1,-1]]},1],[{board:[[-1,1],[-1,-1]]},1]],i=>{numericMatrix(i.board,true);const n=i.board.length;invariant(n>=2&&n<=10&&i.board.every(r=>r.length===n&&r.every(v=>Number.isInteger(v)&&(v===-1||v>=1&&v<=n*n))),'棋盘须为 2 到 10 阶正方形，跳转编号合法。');const endCol=n%2? n-1:0;invariant(i.board[n-1][0]===-1&&i.board[0][endCol]===-1,'起点与终点不能有蛇梯。');});

function wordGraphSolve(start,end,words,e,gene){const all=[...new Set([start,...words])],adj=all.map(()=>[]),edges=[];for(let a=0;a<all.length;a++)for(let b=a+1;b<all.length;b++){let diff=0;for(let j=0;j<start.length;j++)if(all[a][j]!==all[b][j])diff++;if(diff===1){adj[a].push(b);adj[b].push(a);edges.push({from:String(a),to:String(b)});}}const dist=all.map(()=>-1),q=[0],done=[];dist[0]=0;const scene=active=>({kind:'graph',nodes:all.map((label,k)=>({id:String(k),label})),edges,active:active.map(String),done:done.map(String)});shot(e,scene([0]),'连接只差一个字符的状态');if(start===end)return gene?0:1;if(!words.includes(end)){shot(e,scene([]),'目标不在允许字典中',{},[3]);return gene?-1:0;}for(let h=0;h<q.length;h++){const u=q[h];done.push(u);shot(e,scene([u]),'取出最短距离状态',{当前:all[u],距离:dist[u]},[8]);if(all[u]===end)return dist[u]+(gene?0:1);for(const v of adj[u])if(dist[v]===-1){dist[v]=dist[u]+1;q.push(v);shot(e,scene([u,v]),'发现一个字符变化的邻居',{新状态:all[v],距离:dist[v]},[9]);}}return gene?-1:0;}
function wordGraphCheck(i,gene){const start=gene?i.startGene:i.beginWord,end=gene?i.endGene:i.endWord,words=gene?i.bank:i.wordList;text(start,'起点',10);text(end,'终点',10);array(words,'字典',40);invariant(start.length>0&&start.length===end.length&&(!gene||start.length===8),'起终点长度须一致，基因长度须为 8。');const pattern=gene?/^[ACGT]+$/:/^[a-z]+$/;invariant([start,end,...words].every(s=>typeof s==='string'&&s.length===start.length&&pattern.test(s)),'所有状态须同长且字符合法。');}
add(433,'从 startGene 变为 endGene，每次改变一个字符，返回最少变化次数。','字符限 A/C/G/T，长度为 8；每个变化后基因必须在 bank 中；不可达返回 -1。',[
 ['建立基因图','任意两个只差一位的基因相连，包含起始基因。'],['按距离逐层搜索','BFS 首次发现节点就记录变化次数。'],['到达终点返回','起点等于终点需要零次，未到达则为 -1。']], 'O(B²L)','O(B²)',{startGene:'AACCGGTT',endGene:'AAACGGTA',bank:['AACCGGTA','AACCGCTA','AAACGGTA']},2,
`func minMutation(startGene string,endGene string,bank []string) int {
 if startGene==endGene { return 0 };found:=false
 for _,s:=range bank { if s==endGene { found=true } };if !found { return -1 }
 words:=append([]string{startGene},bank...);graph:=make([][]int,len(words))
 for a:=0;a<len(words);a++ { for b:=a+1;b<len(words);b++ { diff:=0;for j:=range startGene { if words[a][j]!=words[b][j] { diff++ } };if diff==1 { graph[a]=append(graph[a],b);graph[b]=append(graph[b],a) } } }
 dist:=make([]int,len(words));for j:=range dist { dist[j]=-1 };dist[0]=0;queue:=[]int{0}
 for h:=0;h<len(queue);h++ {
  u:=queue[h];if words[u]==endGene { return dist[u] }
  for _,v:=range graph[u] { if dist[v]==-1 { dist[v]=dist[u]+1;queue=append(queue,v) } }
 };return -1
}`,(i,e)=>wordGraphSolve(i.startGene,i.endGene,i.bank,e,true),[[{startGene:'AACCGGTT',endGene:'AACCGGTT',bank:[]},0],[{startGene:'AACCGGTT',endGene:'AACCGGTA',bank:[]},-1]],i=>wordGraphCheck(i,true));

add(127,'将 beginWord 转成 endWord，每次只改一个字母，返回最短转换序列中的单词个数。','变化后的每个词必须在 wordList；不可达返回 0，序列长度包含首尾。',[
 ['连接相邻单词','只有一处字符不同的词之间可直接转换。'],['从起始词 BFS','队列按转换次数扩展，已访问词不重复入队。'],['换算序列长度','边数加一即单词数；找不到终点输出 0。']], 'O(W²L)','O(W²)',{beginWord:'hit',endWord:'cog',wordList:['hot','dot','dog','lot','log','cog']},5,
`func ladderLength(beginWord string,endWord string,wordList []string) int {
 if beginWord==endWord { return 1 };found:=false
 for _,s:=range wordList { if s==endWord { found=true } };if !found { return 0 }
 words:=append([]string{beginWord},wordList...);graph:=make([][]int,len(words))
 for a:=0;a<len(words);a++ { for b:=a+1;b<len(words);b++ { diff:=0;for j:=range beginWord { if words[a][j]!=words[b][j] { diff++ } };if diff==1 { graph[a]=append(graph[a],b);graph[b]=append(graph[b],a) } } }
 dist:=make([]int,len(words));for j:=range dist { dist[j]=-1 };dist[0]=0;queue:=[]int{0}
 for h:=0;h<len(queue);h++ {
  u:=queue[h];if words[u]==endWord { return dist[u]+1 }
  for _,v:=range graph[u] { if dist[v]==-1 { dist[v]=dist[u]+1;queue=append(queue,v) } }
 };return 0
}`,(i,e)=>wordGraphSolve(i.beginWord,i.endWord,i.wordList,e,false),[[{beginWord:'hit',endWord:'cog',wordList:['hot','dot','dog']},0],[{beginWord:'a',endWord:'c',wordList:['a','b','c']},2]],i=>wordGraphCheck(i,false));

function makeTrie(){return {id:'t0',char:'根',end:false,children:new Map()};}
function trieScene(root,active=[]){const nodes=[],edges=[];function visit(n){nodes.push({id:n.id,label:n.char+(n.end?' ●':'')});for(const [ch,c]of n.children){edges.push({from:n.id,to:c.id,label:ch,directed:true});visit(c);}}visit(root);return {kind:'trie',nodes,edges,active};}
function trieOpsCheck(i,wild=false){array(i.ops,'ops',50);invariant(i.ops.length&&i.ops[0][0]===(wild?'WordDictionary':'Trie'),'首个操作须构造字典树。');let total=0;for(let k=0;k<i.ops.length;k++){const op=i.ops[k];invariant(Array.isArray(op)&&((k===0&&op.length===1)||(k>0&&op.length===2)),'操作格式错误。');if(!k)continue;invariant((wild?['addWord','search']:['insert','search','startsWith']).includes(op[0]),'未知字典树操作。');text(op[1],'单词',12);invariant((wild&&op[0]==='search'?/^[a-z.]+$/:/^[a-z]+$/).test(op[1]),'单词须为非空小写字母，通配搜索可含点。');total+=op[1].length;}invariant(total<=240,'操作总字符数最多 240。');}
function trieOpsSolve(i,e,wild){const root=makeTrie(),out=[];let uid=1;shot(e,trieScene(root),'空字典树');for(const [op,word]of i.ops){if(op==='Trie'||op==='WordDictionary'){out.push(null);continue;}if(op==='insert'||op==='addWord'){let n=root;for(const ch of word){if(!n.children.has(ch))n.children.set(ch,{id:'t'+uid++,char:ch,end:false,children:new Map()});n=n.children.get(ch);shot(e,trieScene(root,[n.id]),'沿字符建立前缀节点',{字符:ch},[4]);}n.end=true;out.push(null);shot(e,trieScene(root,[n.id]),'标记单词结束',{单词:word},[5]);}else{function search(n,k){shot(e,trieScene(root,[n.id]),'匹配当前前缀',{模式:word,已匹配:k},wild?[9]:[8]);if(k===word.length)return op==='startsWith'||n.end;if(wild&&word[k]==='.')return [...n.children.values()].some(c=>search(c,k+1));const child=n.children.get(word[k]);return !!child&&search(child,k+1);}out.push(search(root,0));shot(e,trieScene(root),'完成查询',{操作:op,返回:out.at(-1)},wild?[11]:[9]);}}return out;}
add(208,'实现前缀树的插入、完整单词查询和前缀查询。','ops 首项为 ["Trie"]，后续为 [操作,小写单词]；构造、插入返回 null。',[
 ['按字符建树','共享前缀复用同一路径，每条边标记一个字母。'],['记录完整单词','插入完最后字母后设置结束标志。'],['区分两种查询','search 必须命中结束标志，startsWith 只需路径存在。']], '每次 O(L)','O(总插入字符数)',{ops:[['Trie'],['insert','apple'],['search','apple'],['search','app'],['startsWith','app'],['insert','app'],['search','app']]},[null,null,true,false,true,null,true],
`type Trie struct { children [26]*Trie; end bool }
 func Constructor() Trie { return Trie{} }
 func (t *Trie) Insert(word string) {
  n:=t;for j:=0;j<len(word);j++ { k:=word[j]-'a';if n.children[k]==nil { n.children[k]=&Trie{} };n=n.children[k] }
  n.end=true
 }
 func (t *Trie) find(s string) *Trie {
  n:=t;for j:=0;j<len(s);j++ { n=n.children[s[j]-'a'];if n==nil { return nil } }
  return n
 }
 func (t *Trie) Search(word string) bool { n:=t.find(word);return n!=nil&&n.end }
 func (t *Trie) StartsWith(prefix string) bool { return t.find(prefix)!=nil }`,(i,e)=>trieOpsSolve(i,e,false),[[{ops:[['Trie'],['search','a'],['startsWith','a']]},[null,false,false]],[{ops:[['Trie'],['insert','a'],['insert','ab'],['search','a'],['search','abc']]},[null,null,null,true,false]]],i=>trieOpsCheck(i));

add(211,'实现添加单词及含点通配符的完整匹配搜索。','ops 首项为 ["WordDictionary"]；addWord 插入小写词，search 中 "." 恰匹配一个字符。',[
 ['构建前缀树','添加单词时逐字符连接节点并标记结尾。'],['普通字符定向搜索','沿对应孩子前进，缺失即失败。'],['点号枚举分支','对所有孩子递归匹配，必须在模式末尾遇到单词结束。']], '添加 O(L)，搜索最坏 O(26^L)','O(总字符数+L)',{ops:[['WordDictionary'],['addWord','bad'],['addWord','dad'],['addWord','mad'],['search','pad'],['search','bad'],['search','.ad'],['search','b..']]},[null,null,null,null,false,true,true,true],
`type WordDictionary struct { children [26]*WordDictionary; end bool }
 func Constructor() WordDictionary { return WordDictionary{} }
 func (t *WordDictionary) AddWord(word string) {
  n:=t;for j:=0;j<len(word);j++ { k:=word[j]-'a';if n.children[k]==nil { n.children[k]=&WordDictionary{} };n=n.children[k] }
  n.end=true
 }
 func (t *WordDictionary) Search(word string) bool {
  var match func(*WordDictionary,int)bool
  match=func(n *WordDictionary,j int)bool {
   if j==len(word) { return n.end };if word[j]=='.' { for _,c:=range n.children { if c!=nil&&match(c,j+1) { return true } };return false }
   c:=n.children[word[j]-'a'];return c!=nil&&match(c,j+1)
  };return match(t,0)
 }`,(i,e)=>trieOpsSolve(i,e,true),[[{ops:[['WordDictionary'],['addWord','a'],['search','.'],['search','..']]},[null,null,true,false]],[{ops:[['WordDictionary'],['addWord','ab'],['search','a'],['search','a.'],['search','b.']]},[null,null,false,true,false]]],i=>trieOpsCheck(i,true));

add(212,'在字母棋盘中找出 words 中所有可由相邻格路径拼成的单词。','只可上下左右移动，同一条路径不能重复用格子；每个单词只输出一次，演示按字典序输出。',[
 ['将词表放入前缀树','多个词的公共前缀共享节点，便于同时匹配。'],['棋盘 DFS 与前缀同步','每走一格向对应字符分支前进，无分支立即剪枝。'],['标记回溯与去重','路径格临时占用，返回时恢复；找到完整词后清除终止标记。']], 'O(总词长+mn·4^L)','O(总词长+L)',{board:['oaan','etae','ihkr','iflv'].map(s=>s.split('')),words:['oath','pea','eat','rain']},['eat','oath'],
`import "sort"
 type wordTrie struct { children [26]*wordTrie; word string }
 func findWords(board [][]byte,words []string) []string {
  root:=&wordTrie{};for _,word:=range words { n:=root;for j:=0;j<len(word);j++ { k:=word[j]-'a';if n.children[k]==nil { n.children[k]=&wordTrie{} };n=n.children[k] };n.word=word }
  ans:=[]string{};if len(board)==0 { return ans };m,n:=len(board),len(board[0]);var dfs func(int,int,*wordTrie)
  dfs=func(r,c int,p *wordTrie) {
   if r<0||r>=m||c<0||c>=n||board[r][c]=='#' { return };ch:=board[r][c];next:=p.children[ch-'a'];if next==nil { return }
   if next.word!="" { ans=append(ans,next.word);next.word="" };board[r][c]='#'
   dfs(r+1,c,next);dfs(r-1,c,next);dfs(r,c+1,next);dfs(r,c-1,next)
   board[r][c]=ch
  }
  for r:=0;r<m;r++ { for c:=0;c<n;c++ { dfs(r,c,root) } };sort.Strings(ans);return ans
 }`,(i,e)=>{const root=makeTrie();let uid=1;for(const w of i.words){let n=root;for(const ch of w){if(!n.children.has(ch))n.children.set(ch,{id:'t'+uid++,char:ch,end:false,children:new Map()});n=n.children.get(ch);}n.word=w;n.end=true;}const b=i.board,R=b.length,C=b[0]?.length??0,found=[],path=[];let explored=0;shot(e,grid(b),'在棋盘上寻找前缀');shot(e,trieScene(root),'词表共享前缀树');function dfs(r,c,p){if(r<0||r>=R||c<0||c>=C||b[r][c]==='#')return;const ch=b[r][c],next=p.children.get(ch);if(!next)return;invariant(++explored<=700,'搜索步骤过多，请减少棋盘或词表规模。');if(next.word){found.push(next.word);next.word='';next.end=false;}b[r][c]='#';path.push([r,c]);shot(e,grid(b,[[r,c]],path),'匹配前缀并占用路径格',{前缀节点:next.id,已找到:found},[7,8]);for(const [dr,dc]of directions)dfs(r+dr,c+dc,next);path.pop();b[r][c]=ch;shot(e,grid(b,path.at(-1)?[path.at(-1)]:[],path),'回溯并释放格子',{已找到:found},[10]);}for(let r=0;r<R;r++)for(let c=0;c<C;c++)dfs(r,c,root);return found.sort();},[[{board:[['a','b']],words:['ab','aba','b']},['ab','b']],[{board:[],words:['a']},[]]],i=>{matrix(i.board,'棋盘',6);invariant(i.board.every(r=>r.every(ch=>typeof ch==='string'&&/^[a-z]$/.test(ch))),'棋盘须包含小写字母。');array(i.words,'words',20);invariant(i.words.every(s=>typeof s==='string'&&/^[a-z]{1,8}$/.test(s))&&i.words.reduce((n,s)=>n+s.length,0)<=100,'单词须为 1 到 8 个小写字母，总长度最多 100。');});
