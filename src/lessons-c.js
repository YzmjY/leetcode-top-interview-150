import {invariant,numbers,integer,text,matrix,sorted,treeToLevel,treeView,listView} from './lesson-kit.js';

export const lessonsC=[];
function add(spec){
  const run=spec.solve,code=spec.code.trim();
  spec.code=code; spec.steps=spec.steps.map(([title,body])=>({title,body}));
  spec.solve=(input,emit)=>run(input,(scene,title,description,needle,vars={})=>{
    const line=code.split('\n').findIndex(s=>s.includes(needle));
    invariant(line>=0,`题目 ${spec.id} 的高亮位置不存在：${needle}`);
    emit(scene,title,description,[line+1],vars,needle);
  });lessonsC.push(spec);
}
const nonempty=(a,name='nums',max=40)=>{numbers(a,name,max);invariant(a.length>0,`${name}不能为空。`);};
const distinct=a=>invariant(new Set(a).size===a.length,'元素须互不相同。');
const ascii=(s,name,max=25)=>{text(s,name,max);invariant(/^[\x00-\x7f]*$/.test(s),`${name}使用ASCII字符演示。`);};
const grid=(g,max=12)=>{matrix(g,'矩阵',max);invariant(g.length>0&&g[0].length>0,'矩阵不能为空。');};
const btScene=(path,choices=[])=>({kind:'stack',values:path.slice(),secondary:choices,secondaryLabel:'候选选择'});
const dpScene=(dp,active=[],pointers={})=>({kind:'table',columns:['状态下标','dp'],rows:dp.map((v,i)=>[i,v]),active:active.map(i=>[i,1]),rowPointers:pointers,cellPointers:Object.fromEntries(Object.entries(pointers).map(([name,i])=>[name,[i,1]]))});
const matrixDP=(data,rowName,row,colName,col,dependencies={})=>{
  const cellPointers={['dp['+rowName+']['+colName+']']:[row,col],...dependencies};
  return {kind:'matrix',matrix:data,active:Object.values(cellPointers),rowPointers:{[rowName]:row},colPointers:{[colName]:col},cellPointers};
};
const bits=n=>(n>>>0).toString(2).padStart(32,'0');

add({id:17,summary:'给定仅含2到9的电话号码字符串，返回每位按键选择一个字母能够组成的全部字符串。',rule:'按电话键盘映射；空输入返回空数组，演示最多4位。',steps:[['映射按键','每个数字对应一个字母候选集合。'],['逐位选择','递归深度表示已处理位数，路径记录已选字母。'],['收集并撤销','路径长度等于数字长度时保存结果，再撤销最后一次选择。']],time:'O(4ⁿ·n)',space:'O(n)，不计结果',input:{digits:'23'},expected:['ad','ae','af','bd','be','bf','cd','ce','cf'],cases:[{input:{digits:''},expected:[]},{input:{digits:'7'},expected:['p','q','r','s']}],validate:({digits})=>{text(digits,'digits',4);invariant(/^[2-9]*$/.test(digits),'digits仅能包含2到9。');},code:`func letterCombinations(digits string) []string {
    ans := []string{}
    if len(digits) == 0 { return ans }
    keys := []string{"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"}
    path := []byte{}
    var dfs func(int)
    dfs = func(i int) {
        if i == len(digits) { ans = append(ans, string(path)); return }
        for _, c := range []byte(keys[digits[i]-'0']) {
            path = append(path, c)
            dfs(i+1)
            path = path[:len(path)-1]
        }
    }
    dfs(0)
    return ans
}`,solve:({digits},e)=>{const keys=['','','abc','def','ghi','jkl','mno','pqrs','tuv','wxyz'],ans=[],p=[];if(!digits)return ans;function dfs(i){if(i===digits.length){ans.push(p.join(''));e(btScene(p),'保存组合','所有数字都已选择一个字母。','ans = append',{组合数:ans.length});return;}for(const c of keys[+digits[i]]){p.push(c);e(btScene(p,[...keys[+digits[i]]]),'选择字母',`按键${digits[i]}选择${c}。`,'path = append',{深度:i});dfs(i+1);p.pop();e(btScene(p),'撤销选择','返回上层尝试下一个字母。','path = path[:');}}dfs(0);return ans;}});

add({id:77,summary:'从整数1到n中选出k个数，返回所有不重复组合。',rule:'组合内部递增；0≤k≤n，演示n≤8。',steps:[['递增路径','用起点保证每个组合只枚举一次。'],['剪去不足分支','剩余数字数量不足以填满k个位置时不再选择。'],['记录与回退','选满k个数保存副本，再逐层撤销选择。']],time:'O(C(n,k)·k)',space:'O(k)，不计结果',input:{n:4,k:2},expected:[[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]],cases:[{input:{n:1,k:1},expected:[[1]]},{input:{n:3,k:0},expected:[[]]}],validate:({n,k})=>{integer(n,1,8,'n');integer(k,0,n,'k');},code:`func combine(n int, k int) [][]int {
    ans := [][]int{}; path := []int{}
    var dfs func(int)
    dfs = func(start int) {
        if len(path) == k { ans = append(ans, append([]int{}, path...)); return }
        for x := start; x <= n-(k-len(path))+1; x++ {
            path = append(path, x)
            dfs(x+1)
            path = path[:len(path)-1]
        }
    }
    dfs(1)
    return ans
}`,solve:({n,k},e)=>{const p=[],ans=[];function dfs(start){if(p.length===k){ans.push([...p]);e(btScene(p),'保存组合','路径已包含k个数。','ans = append');return;}for(let x=start;x<=n-(k-p.length)+1;x++){p.push(x);e(btScene(p),'选择数字','下层只考虑更大的数字。','path = append',{start,x});dfs(x+1);p.pop();e(btScene(p),'撤销数字','恢复选择前的路径。','path = path[:');}}dfs(1);return ans;}});

add({id:46,summary:'给定互不相同的整数数组，返回这些整数的所有排列。',rule:'每个元素在每个排列中恰好出现一次；演示最多5项。',steps:[['记录使用状态','used标记哪些输入位置已经在路径中。'],['选择未用元素','依次尝试每个未使用元素并递归。'],['撤销占用','生成完整排列后回退，恢复used以探索其他顺序。']],time:'O(n!·n)',space:'O(n)，不计结果',input:{nums:[1,2,3]},expected:[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]],cases:[{input:{nums:[0]},expected:[[0]]},{input:{nums:[]},expected:[[]]}],validate:({nums})=>{numbers(nums,'nums',5);distinct(nums);},code:`func permute(nums []int) [][]int {
    ans := [][]int{}; path := []int{}; used := make([]bool, len(nums))
    var dfs func()
    dfs = func() {
        if len(path) == len(nums) { ans = append(ans, append([]int{}, path...)); return }
        for i, x := range nums {
            if used[i] { continue }
            used[i] = true; path = append(path, x)
            dfs()
            used[i] = false; path = path[:len(path)-1]
        }
    }
    dfs()
    return ans
}`,solve:({nums},e)=>{const used=nums.map(()=>false),p=[],ans=[];function dfs(){if(p.length===nums.length){ans.push([...p]);e(btScene(p),'保存排列','每个输入元素均已使用。','ans = append');return;}nums.forEach((x,i)=>{if(used[i])return;used[i]=true;p.push(x);e(btScene(p,nums.filter((_,j)=>!used[j])),'占用元素','选择尚未使用的位置。','used[i] = true',{used});dfs();used[i]=false;p.pop();e(btScene(p),'撤销占用','下一分支可以重新使用该元素。','used[i] = false',{used});});}dfs();return ans;}});

add({id:39,summary:'给定不同的正整数候选和目标和，返回和等于目标的全部组合；每个候选可以重复选择。',rule:'候选互异且为正数；演示候选≤6、target≤18且target/最小候选≤10。',steps:[['排序剪枝','候选升序后，超过剩余目标的候选可直接停止。'],['允许重复','递归保持当前索引，因此当前数字可以再次选择。'],['收集合法组合','剩余值为零时保存路径；回溯撤销末尾元素。']],time:'O(n^(T/m)·T/m)，m为最小候选',space:'O(T/m)，不计结果',input:{candidates:[2,3,6,7],target:7},expected:[[2,2,3],[7]],cases:[{input:{candidates:[2],target:1},expected:[]},{input:{candidates:[2,3],target:0},expected:[[]]}],validate:({candidates,target})=>{nonempty(candidates,'candidates',6);distinct(candidates);invariant(candidates.every(x=>x>0),'候选须为正整数。');integer(target,0,18,'target');invariant(target/Math.min(...candidates)<=10,'目标与最小候选比值最多10。');},code:`import "sort"
func combinationSum(candidates []int, target int) [][]int {
    sort.Ints(candidates)
    ans := [][]int{}; path := []int{}
    var dfs func(int, int)
    dfs = func(start, rest int) {
        if rest == 0 { ans = append(ans, append([]int{}, path...)); return }
        for i := start; i < len(candidates) && candidates[i] <= rest; i++ {
            path = append(path, candidates[i])
            dfs(i, rest-candidates[i])
            path = path[:len(path)-1]
        }
    }
    dfs(0, target)
    return ans
}`,solve:({candidates:a,target},e)=>{a.sort((x,y)=>x-y);const p=[],ans=[];function dfs(start,rest){if(!rest){ans.push([...p]);e(btScene(p),'找到目标和','剩余目标为零，保存组合。','ans = append',{rest});return;}for(let i=start;i<a.length&&a[i]<=rest;i++){p.push(a[i]);e(btScene(p,a.slice(i)),'选择可重复候选','下层从当前索引继续搜索。','path = append',{rest:rest-a[i]});dfs(i,rest-a[i]);p.pop();e(btScene(p),'撤销候选','恢复剩余目标，尝试下一候选。','path = path[:',{rest});}}dfs(0,target);return ans;}});

add({id:52,summary:'在n×n棋盘放置n个互不攻击的皇后，返回不同摆放方案的数量。',rule:'皇后不能同行、同列或同一对角线；演示1≤n≤6。',steps:[['逐行放置','每层递归为一行选择一列。'],['检查冲突','利用列、行列差、行列和集合排除攻击位置。'],['统计与撤销','所有行放好后计数，随后移除皇后和占用标记。']],time:'O(n!)',space:'O(n)',input:{n:4},expected:2,cases:[{input:{n:1},expected:1},{input:{n:2},expected:0}],validate:({n})=>integer(n,1,6,'n'),code:`func totalNQueens(n int) int {
    cols := map[int]bool{}; d1 := map[int]bool{}; d2 := map[int]bool{}; ans := 0
    var dfs func(int)
    dfs = func(r int) {
        if r == n { ans++; return }
        for c := 0; c < n; c++ {
            if cols[c] || d1[r-c] || d2[r+c] { continue }
            cols[c] = true; d1[r-c] = true; d2[r+c] = true
            dfs(r+1)
            delete(cols,c); delete(d1,r-c); delete(d2,r+c)
        }
    }
    dfs(0)
    return ans
}`,solve:({n},e)=>{let ans=0;const b=Array.from({length:n},()=>Array(n).fill('·')),cols=new Set(),d1=new Set(),d2=new Set();function dfs(r){if(r===n){ans++;e({kind:'matrix',matrix:b},'完成一个布局','所有皇后互不攻击。','ans++',{方案数:ans});return;}for(let c=0;c<n;c++){if(cols.has(c)||d1.has(r-c)||d2.has(r+c))continue;cols.add(c);d1.add(r-c);d2.add(r+c);b[r][c]='♛';e({kind:'matrix',matrix:b,active:[[r,c]]},'放置皇后','当前列与两条对角线均未占用。','cols[c] = true',{r,c});dfs(r+1);cols.delete(c);d1.delete(r-c);d2.delete(r+c);b[r][c]='·';e({kind:'matrix',matrix:b,active:[[r,c]]},'撤销皇后','恢复棋盘和攻击集合。','delete(cols,c)');}}dfs(0);return ans;}});

add({id:22,summary:'生成由n对括号组成的所有有效括号字符串。',rule:'任意前缀中右括号不能多于左括号；演示n≤5。',steps:[['记录两类数量','left、right表示路径中两类括号已用数量。'],['只走合法分支','左括号不足n可继续放；右括号只有少于左括号时可放。'],['到达完整长度','左右各n个时收集路径，其余分支通过撤销探索。']],time:'O(Cₙ·n)，Cₙ为卡特兰数',space:'O(n)，不计结果',input:{n:3},expected:['((()))','(()())','(())()','()(())','()()()'],cases:[{input:{n:1},expected:['()']},{input:{n:0},expected:['']}],validate:({n})=>integer(n,0,5,'n'),code:`func generateParenthesis(n int) []string {
    ans := []string{}; path := []byte{}
    var dfs func(int,int)
    dfs = func(left,right int) {
        if right == n { ans = append(ans,string(path)); return }
        if left < n {
            path = append(path,'('); dfs(left+1,right); path = path[:len(path)-1]
        }
        if right < left {
            path = append(path,')'); dfs(left,right+1); path = path[:len(path)-1]
        }
    }
    dfs(0,0)
    return ans
}`,solve:({n},e)=>{const ans=[],p=[];function dfs(l,r){if(r===n){ans.push(p.join(''));e(btScene(p),'收集括号串','左右括号均已用完。','ans = append',{l,r});return;}for(const c of ['(',')']){if(c==='('?l>=n:r>=l)continue;p.push(c);e(btScene(p),'添加括号',c==='('?'左括号数量尚未达到n。':'右括号不会超过左括号。',c==='('?'dfs(left+1,right)':'dfs(left,right+1)',{left:l+(c==='('?1:0),right:r+(c===')'?1:0)});dfs(l+(c==='('?1:0),r+(c===')'?1:0));p.pop();e(btScene(p),'回退路径','撤销本次括号。','path = path[:');}}dfs(0,0);return ans;}});

add({id:79,summary:'判断字符网格中是否存在沿上下左右相邻格组成给定单词的路径。',rule:'每格与单词仅限英文字母，同一格在一条路径中不能重复使用；演示网格≤4×4、单词≤8，最多搜索650个匹配状态。',steps:[['尝试起点','从每一格开始匹配单词第一个字符。'],['匹配并占用','当前字符一致时标记已访问，再检查四个邻格。'],['失败时恢复','分支失败即撤销占用，允许其他路径再次使用该格。']],time:'O(mn·3ᴸ)',space:'O(mn+L)',input:{board:[['A','B','C','E'],['S','F','C','S'],['A','D','E','E']],word:'ABCCED'},expected:true,cases:[{input:{board:[['A']],word:'B'},expected:false},{input:{board:[['A','A']],word:'AAA'},expected:false}],validate:({board,word})=>{grid(board,4);invariant(board.flat().every(c=>typeof c==='string'&&/^[A-Za-z]$/.test(c)),'每格须为单个英文字母。');text(word,'word',8);invariant(/^[A-Za-z]+$/.test(word),'单词须为非空英文字母串。');},code:`func exist(board [][]byte, word string) bool {
    m,n := len(board),len(board[0]); used := make([][]bool,m)
    for i := range used { used[i] = make([]bool,n) }
    var dfs func(int,int,int) bool
    dfs = func(r,c,k int) bool {
        if r<0 || r>=m || c<0 || c>=n || used[r][c] || board[r][c]!=word[k] { return false }
        used[r][c] = true
        if k == len(word)-1 { return true }
        for _,d := range [][2]int{{1,0},{-1,0},{0,1},{0,-1}} {
            if dfs(r+d[0],c+d[1],k+1) { return true }
        }
        used[r][c] = false
        return false
    }
    for r:=0;r<m;r++ { for c:=0;c<n;c++ { if dfs(r,c,0) { return true } } }
    return false
}`,solve:({board:b,word},e)=>{let explored=0;const m=b.length,n=b[0].length,used=Array.from({length:m},()=>Array(n).fill(false)),p=[];function dfs(r,c,k){if(r<0||r>=m||c<0||c>=n||used[r][c]||b[r][c]!==word[k])return false;invariant(++explored<=650,'搜索分支过多，请缩小网格或单词长度。');used[r][c]=true;p.push([r,c]);e({kind:'matrix',matrix:b,active:[[r,c]],done:p,rowPointers:{r},colPointers:{c},cellPointers:{'board[r][c]':[r,c]}},'匹配一个字符',`已匹配 ${word.slice(0,k+1)}。`,'used[r][c] = true',{r,c,k,路径:p});if(k===word.length-1)return true;for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]])if(dfs(r+dr,c+dc,k+1))return true;used[r][c]=false;p.pop();e({kind:'matrix',matrix:b,active:[[r,c]],done:p,rowPointers:{r},colPointers:{c},cellPointers:{'board[r][c]':[r,c]}},'撤销访问','这个方向无法拼出剩余单词。','used[r][c] = false',{r,c,k});return false;}for(let r=0;r<m;r++)for(let c=0;c<n;c++){e({kind:'matrix',matrix:b,active:[[r,c]],rowPointers:{r},colPointers:{c},cellPointers:{'board[r][c]':[r,c]}},'尝试起点','从当前格开始完整匹配。','if dfs(r,c,0)',{r,c});if(dfs(r,c,0))return true;}return false;}});

add({id:108,summary:'将严格递增的有序数组转换为高度平衡的二叉搜索树，返回层序序列。',rule:'左右子树高度差不超过1；选取区间下中点作为根。',steps:[['中点作根','有序区间中点将元素均匀分为两部分。'],['递归左右区间','较小元素构建左子树，较大元素构建右子树。'],['连接子树','每层连接两个子问题的根节点，得到平衡搜索树。']],time:'O(n)',space:'O(log n)，不计输出树',input:{nums:[-10,-3,0,5,9]},expected:[0,-10,5,null,-3,null,9],cases:[{input:{nums:[]},expected:[]},{input:{nums:[1]},expected:[1]}],validate:({nums})=>{sorted(nums);invariant(nums.length<=40,'最多40项。');distinct(nums);},code:`func sortedArrayToBST(nums []int) *TreeNode {
    var build func(int,int) *TreeNode
    build = func(l,r int) *TreeNode {
        if l > r { return nil }
        m := l+(r-l)/2
        root := &TreeNode{Val:nums[m]}
        root.Left = build(l,m-1)
        root.Right = build(m+1,r)
        return root
    }
    return build(0,len(nums)-1)
}`,solve:({nums},e)=>{let root=null;function build(l,r,parent,side){if(l>r)return null;const m=(l+r)>>1,node={id:String(m),val:nums[m],left:null,right:null};if(parent)parent[side]=node;else root=node;e(treeView(root,{active:[node.id]}),'建立区间根节点',`索引${m}的值作为[${l},${r}]的根。`,'root := &TreeNode',{l,r,m});node.left=build(l,m-1,node,'left');node.right=build(m+1,r,node,'right');e(treeView(root,{done:[node.id]}),'子树连接完成','左右区间已经递归构建。','return root');return node;}build(0,nums.length-1,null,'');return treeToLevel(root);}});

const mergeValues=(a,b,visit)=>{let i=0,j=0;const out=[];while(i<a.length&&j<b.length){out.push(a[i]<=b[j]?a[i++]:b[j++]);visit(out,a.slice(i),b.slice(j));}return out.concat(a.slice(i),b.slice(j));};
add({id:148,summary:'给定链表的值序列，按升序排序并返回排序后的链表值序列。',rule:'采用链表归并排序；演示最多40个节点。',steps:[['快慢指针分半','将链表从中间断开，缩小排序规模。'],['递归排序','分别对前后两段排序。'],['合并有序链表','反复取两段当前较小的节点，重新连接为有序链表。']],time:'O(n log n)',space:'O(log n)，递归栈',input:{head:[4,2,1,3]},expected:[1,2,3,4],cases:[{input:{head:[]},expected:[]},{input:{head:[-1,0,-1]},expected:[-1,-1,0]}],validate:({head})=>numbers(head,'head',40),code:`func sortList(head *ListNode) *ListNode {
    if head == nil || head.Next == nil { return head }
    slow,fast := head,head.Next
    for fast != nil && fast.Next != nil { slow=slow.Next; fast=fast.Next.Next }
    right := slow.Next; slow.Next = nil
    left := sortList(head); right = sortList(right)
    dummy := &ListNode{}; tail := dummy
    for left != nil && right != nil {
        if left.Val <= right.Val { tail.Next=left; left=left.Next } else { tail.Next=right; right=right.Next }
        tail=tail.Next
    }
    if left != nil { tail.Next=left } else { tail.Next=right }
    return dummy.Next
}`,solve:({head},e)=>{function sort(a){if(a.length<2)return a;const m=Math.ceil(a.length/2);e(listView(a,{active:[String(m-1),String(m)]}),'断开链表','在中间切成两段，分别排序。','right := slow.Next',{左段:a.slice(0,m),右段:a.slice(m)});const l=sort(a.slice(0,m)),r=sort(a.slice(m));const out=mergeValues(l,r,(out,left,right)=>e(listView(out),'连接较小节点','输出链逐步增长。','tail=tail.Next',{剩余左链:left,剩余右链:right}));e(listView(out),'合并完成','剩余部分可直接接到尾部。','return dummy.Next');return out;}return sort(head);}});
const leaf=v=>({val:v,isLeaf:true});
add({id:427,summary:'将0/1正方形网格压缩为四叉树；同值区域生成叶节点，否则划分为四个象限。',rule:'边长为2的幂且≤8；结果为嵌套JSON，非叶val统一取1，四个孩子依次对应四象限。',steps:[['检查区域同值','扫描当前正方形是否全部等于左上角。'],['同值直接压缩','全0或全1区域表示为一个叶节点。'],['分成四象限','否则递归构造左上、右上、左下、右下并连接。']],time:'O(n² log n)',space:'O(log n)，不计输出树',input:{grid:[[1,1],[1,0]]},expected:{val:1,isLeaf:false,topLeft:leaf(1),topRight:leaf(1),bottomLeft:leaf(1),bottomRight:leaf(0)},cases:[{input:{grid:[[0]]},expected:leaf(0)},{input:{grid:[[1,1],[1,1]]},expected:leaf(1)}],validate:({grid:g})=>{grid(g,8);invariant(g.length===g[0].length&&(g.length&(g.length-1))===0,'边长须为2的幂的正方形。');invariant(g.flat().every(v=>v===0||v===1),'网格只能包含0或1。');},code:`func construct(grid [][]int) *Node {
    var build func(int,int,int) *Node
    build = func(r,c,size int) *Node {
        same := true
        for i:=r;i<r+size;i++ { for j:=c;j<c+size;j++ { if grid[i][j]!=grid[r][c] { same=false } } }
        if same { return &Node{Val:grid[r][c]==1,IsLeaf:true} }
        half:=size/2
        return &Node{Val:true,IsLeaf:false,TopLeft:build(r,c,half),TopRight:build(r,c+half,half),BottomLeft:build(r+half,c,half),BottomRight:build(r+half,c+half,half)}
    }
    return build(0,0,len(grid))
}`,solve:({grid:g},e)=>{function build(r,c,size){const cells=[];let same=true;for(let i=r;i<r+size;i++)for(let j=c;j<c+size;j++){cells.push([i,j]);if(g[i][j]!==g[r][c])same=false;}e({kind:'matrix',matrix:g,active:cells},'检查正方形区域',same?'区域同值，压缩为叶。':'包含两种值，需要继续划分。','if same',{r,c,size,same});if(same)return leaf(g[r][c]);const h=size/2,out={val:1,isLeaf:false,topLeft:build(r,c,h),topRight:build(r,c+h,h),bottomLeft:build(r+h,c,h),bottomRight:build(r+h,c+h,h)};e({kind:'matrix',matrix:g,done:cells},'连接四个子树','四象限递归结果组成非叶节点。','return &Node{Val:true',{r,c,size});return out;}return build(0,0,g.length);}});

add({id:23,summary:'合并k条升序链表，返回包含全部节点的升序链表值序列。',rule:'lists每项是一条升序链表；演示总节点数≤60。',steps:[['按链表区间分治','将k条链表平分为两组。'],['递归得到有序结果','每组递归合并为一条有序链表。'],['两两归并','比较两个表头，连接较小节点直到全部合并。']],time:'O(N log k)',space:'O(log k)，不计输出',input:{lists:[[1,4,5],[1,3,4],[2,6]]},expected:[1,1,2,3,4,4,5,6],cases:[{input:{lists:[]},expected:[]},{input:{lists:[[],[-2,-1],[]]},expected:[-2,-1]}],validate:({lists})=>{invariant(Array.isArray(lists)&&lists.length<=12,'最多12条链表。');lists.forEach(a=>sorted(a));invariant(lists.flat().length<=60,'总节点数最多60。');},code:`func mergeKLists(lists []*ListNode) *ListNode {
    var merge func(*ListNode,*ListNode) *ListNode
    merge = func(a,b *ListNode) *ListNode {
        dummy:=&ListNode{}; tail:=dummy
        for a!=nil && b!=nil {
            if a.Val<=b.Val { tail.Next=a; a=a.Next } else { tail.Next=b; b=b.Next }
            tail=tail.Next
        }
        if a!=nil { tail.Next=a } else { tail.Next=b }
        return dummy.Next
    }
    var divide func(int,int) *ListNode
    divide = func(l,r int) *ListNode {
        if l>r { return nil }; if l==r { return lists[l] }
        m:=(l+r)/2
        return merge(divide(l,m),divide(m+1,r))
    }
    return divide(0,len(lists)-1)
}`,solve:({lists},e)=>{function divide(l,r){if(l>r)return [];if(l===r)return lists[l];const m=(l+r)>>1;e({kind:'table',columns:['链表','节点值'],rows:lists.map((a,i)=>[i,a.join(' → ')]),active:[[l,1],[r,1]]},'分治链表区间','左右两组将分别合并。','m:=(l+r)/2',{l,r,m});const a=divide(l,m),b=divide(m+1,r),out=mergeValues(a,b,(out,left,right)=>e(listView(out),'接入较小表头','已连接节点构成有序前缀。','tail=tail.Next',{left,right}));e(listView(out),'当前区间合并完成','合并结果交给上一层。','return dummy.Next');return out;}return divide(0,lists.length-1);}});

add({id:53,summary:'返回非空整数数组中连续非空子数组的最大和。',rule:'允许负数；子数组必须连续且至少包含一个元素。',steps:[['定义结尾状态','end表示必须以当前位置结尾的最大子数组和。'],['延续或重开','在当前值和上一个end加当前值之间取较大值。'],['更新全局最优','每个结尾状态都有机会成为最大答案。']],time:'O(n)',space:'O(1)',input:{nums:[-2,1,-3,4,-1,2,1,-5,4]},expected:6,cases:[{input:{nums:[-5]},expected:-5},{input:{nums:[-3,-2,-7]},expected:-2}],validate:({nums})=>nonempty(nums),code:`func maxSubArray(nums []int) int {
    end,best:=nums[0],nums[0]
    for i:=1;i<len(nums);i++ {
        if end<0 { end=nums[i] } else { end+=nums[i] }
        if end>best { best=end }
    }
    return best
}`,solve:({nums},e)=>{
  let end=nums[0],best=end,start=0;
  e({kind:'array',label:'nums',values:nums,active:[0]},'初始化结尾状态','第一项自身构成非空子数组。','end,best:=',{end,best});
  for(let i=1;i<nums.length;i++){
    if(end<0){end=nums[i];start=i;}else end+=nums[i];best=Math.max(best,end);
    e({kind:'array',label:'nums',values:nums,active:[i],pointers:{i},range:[start,i]},'延续或重新开始','i指向当前结尾；负的前缀和会被舍弃。','if end<0',{i,end,best});
  }
  return best;
}});
add({id:918,summary:'数组首尾相连形成环，返回连续非空环形子数组的最大和，每个元素至多使用一次。',rule:'非跨边界取最大子数组；跨边界可视为总和减去中间最小子数组。',steps:[['同时维护最大和最小','分别用Kadane计算以每项结尾的最大与最小和。'],['计算跨边界方案','总和减去最小连续段，剩下部分首尾相连。'],['处理全负数组','若最大和为负，只能取最大单项，避免选到空数组。']],time:'O(n)',space:'O(1)',input:{nums:[5,-3,5]},expected:10,cases:[{input:{nums:[-3,-2,-3]},expected:-2},{input:{nums:[3,-1,2,-1]},expected:4}],validate:({nums})=>nonempty(nums),code:`func maxSubarraySumCircular(nums []int) int {
    maxEnd,minEnd,best,worst,total:=nums[0],nums[0],nums[0],nums[0],nums[0]
    for i:=1;i<len(nums);i++ {
        x:=nums[i]
        maxEnd=max(x,maxEnd+x); minEnd=min(x,minEnd+x)
        best=max(best,maxEnd); worst=min(worst,minEnd); total+=x
    }
    if best<0 { return best }
    return max(best,total-worst)
}`,solve:({nums},e)=>{
  let maxEnd=nums[0],minEnd=maxEnd,best=maxEnd,worst=maxEnd,total=maxEnd;
  e({kind:'array',label:'nums',values:nums,active:[0]},'初始化两种结尾和','同时追踪最大和最小连续段。','maxEnd,minEnd,best',{maxEnd,minEnd,best,worst,total});
  for(let i=1;i<nums.length;i++){
    const x=nums[i];maxEnd=Math.max(x,maxEnd+x);minEnd=Math.min(x,minEnd+x);best=Math.max(best,maxEnd);worst=Math.min(worst,minEnd);total+=x;
    e({kind:'array',label:'nums',values:nums,active:[i],pointers:{i}},'更新双Kadane','i是当前处理的真实数组下标；同时维护最大和最小结尾状态。','maxEnd=max',{i,x,maxEnd,minEnd,best,worst,total});
  }
  e({kind:'state',items:[['非跨边界',best],['总和',total],['最小段',worst],['跨边界',total-worst]]},'比较两类答案','全负时保留非空最大段。','if best<0',{best,worst,total});
  return best<0?best:Math.max(best,total-worst);
}});

add({id:35,summary:'在升序互异数组中查找target，返回其索引；不存在则返回保持升序的插入位置。',rule:'使用左闭右开区间寻找第一个不小于target的位置。',steps:[['设定候选区间','答案属于[0,n]，搜索区间为[lo,hi)。'],['比较中点','中点值过小则丢掉左半，否则保留中点为上界。'],['区间收敛','lo等于hi时就是下界，也是插入位置。']],time:'O(log n)',space:'O(1)',input:{nums:[1,3,5,6],target:5},expected:2,cases:[{input:{nums:[1,3,5,6],target:2},expected:1},{input:{nums:[],target:7},expected:0}],validate:({nums,target})=>{sorted(nums);distinct(nums);integer(target,-1e9,1e9,'target');},code:`func searchInsert(nums []int,target int) int {
    lo,hi:=0,len(nums)
    for lo<hi {
        mid:=lo+(hi-lo)/2
        if nums[mid]<target { lo=mid+1 } else { hi=mid }
    }
    return lo
}`,solve:({nums,target},e)=>{
  let lo=0,hi=nums.length;
  while(lo<hi){
    const mid=(lo+hi)>>1;
    e({kind:'array',label:'nums',values:nums,range:[lo,hi-1],active:[mid],pointers:{lo,mid,hi}},'比较中点','候选元素在[lo,hi)内；hi是右侧开边界。','if nums[mid]<target',{lo,mid,hi,target});
    if(nums[mid]<target)lo=mid+1;else hi=mid;
  }
  e({kind:'array',label:'nums',values:nums,range:[lo,hi-1],pointers:{lo,hi}},'下界收敛','lo等于hi，候选区间为空；lo就是插入位置，允许位于数组末尾之外。','return lo',{lo,hi,target});
  return lo;
}});
add({id:74,summary:'给定每行升序且下一行首项大于上一行末项的矩阵，判断target是否存在。',rule:'整个矩阵可映射成有序的一维序列；演示≤12×12。',steps:[['虚拟展平','虚拟索引i对应行i/列数和列i%列数。'],['在虚拟索引二分','比较中点格与目标，保留可能命中的半边。'],['返回查找结果','命中返回true，区间耗尽返回false。']],time:'O(log(mn))',space:'O(1)',input:{matrix:[[1,3,5,7],[10,11,16,20],[23,30,34,60]],target:3},expected:true,cases:[{input:{matrix:[[1]],target:0},expected:false},{input:{matrix:[[1,2],[3,4]],target:4},expected:true}],validate:({matrix:g,target})=>{grid(g);sorted(g.flat());integer(target,-1e9,1e9,'target');},code:`func searchMatrix(matrix [][]int,target int) bool {
    m,n:=len(matrix),len(matrix[0]); lo,hi:=0,m*n-1
    for lo<=hi {
        mid:=lo+(hi-lo)/2; x:=matrix[mid/n][mid%n]
        if x==target { return true }
        if x<target { lo=mid+1 } else { hi=mid-1 }
    }
    return false
}`,solve:({matrix:g,target},e)=>{
  const n=g[0].length,total=g.length*n;let lo=0,hi=total-1;
  const scene=(mid)=>({kind:'matrix',matrix:g,range:[lo,hi],rangeCells:Array.from({length:Math.max(0,hi-lo+1)},(_,i)=>[Math.floor((lo+i)/n),(lo+i)%n]),cellPointers:Object.fromEntries(Object.entries(mid===undefined?{lo,hi}:{lo,mid,hi}).filter(([,i])=>i>=0&&i<total).map(([key,i])=>[key,[Math.floor(i/n),i%n]])),...(mid===undefined?{}:{active:[[Math.floor(mid/n),mid%n]]})});
  while(lo<=hi){
    const mid=(lo+hi)>>1,row=Math.floor(mid/n),col=mid%n;
    e(scene(mid),'检查虚拟中点','虚拟索引mid对应matrix[mid/n][mid%n]；标记同时显示当前闭区间的两端。','mid:=lo+',{lo,mid,hi,row,col,n,target});
    if(g[row][col]===target)return true;
    if(g[row][col]<target)lo=mid+1;else hi=mid-1;
  }
  e(scene(),'搜索区间已空','lo大于hi，剩余区间中没有目标。','return false',{lo,hi,n,target});
  return false;
}});
add({id:162,summary:'寻找一个严格大于相邻元素的峰值，返回其索引；数组边界外视为负无穷。',rule:'相邻元素不相等；有多个峰值时返回二分上坡方向所到达的峰。',steps:[['查看中点斜率','比较mid与mid+1。'],['沿上坡保留区间','右边更高则右侧必有峰，否则左侧含mid必有峰。'],['单点即峰值','区间缩成一点后返回该索引。']],time:'O(log n)',space:'O(1)',input:{nums:[1,2,1,3,5,6,4]},expected:5,cases:[{input:{nums:[1]},expected:0},{input:{nums:[3,2,1]},expected:0}],validate:({nums})=>{nonempty(nums);invariant(nums.every((x,i)=>!i||x!==nums[i-1]),'相邻元素不能相同。');},code:`func findPeakElement(nums []int) int {
    lo,hi:=0,len(nums)-1
    for lo<hi {
        mid:=lo+(hi-lo)/2
        if nums[mid]<nums[mid+1] { lo=mid+1 } else { hi=mid }
    }
    return lo
}`,solve:({nums},e)=>{
  let lo=0,hi=nums.length-1;
  while(lo<hi){
    const mid=(lo+hi)>>1;
    e({kind:'array',label:'nums',values:nums,range:[lo,hi],pointers:{lo,mid,hi},active:[mid,mid+1],bars:true},'观察中点坡度','比较nums[mid]与nums[mid+1]，沿上坡方向保留包含峰值的闭区间。','if nums[mid]<nums[mid+1]',{lo,mid,hi});
    if(nums[mid]<nums[mid+1])lo=mid+1;else hi=mid;
  }
  e({kind:'array',label:'nums',values:nums,range:[lo,hi],pointers:{lo,hi},active:[lo],done:[lo],bars:true},'找到峰值','lo与hi收敛到同一位置，该位置为峰值。','return lo',{lo,hi});
  return lo;
}});
const rotation=a=>{nonempty(a);distinct(a);let drops=0;for(let i=0;i<a.length;i++)if(a[i]>a[(i+1)%a.length])drops++;invariant(drops<=1,'输入须为升序数组的一次旋转。');};
add({id:33,summary:'互异升序数组经过旋转，查找target并返回索引；不存在返回-1。',rule:'每次二分至少有一半区间有序，利用有序范围判断目标位置。',steps:[['检查中点','中点等于目标时立即返回。'],['识别有序半段','比较左端和中点可判断左半是否有序。'],['缩短区间','判断目标是否位于有序半段内，否则转向另一半。']],time:'O(log n)',space:'O(1)',input:{nums:[4,5,6,7,0,1,2],target:0},expected:4,cases:[{input:{nums:[1],target:0},expected:-1},{input:{nums:[1,3],target:3},expected:1}],validate:({nums,target})=>{rotation(nums);integer(target,-1e9,1e9,'target');},code:`func search(nums []int,target int) int {
    lo,hi:=0,len(nums)-1
    for lo<=hi {
        mid:=lo+(hi-lo)/2
        if nums[mid]==target { return mid }
        if nums[lo]<=nums[mid] {
            if nums[lo]<=target && target<nums[mid] { hi=mid-1 } else { lo=mid+1 }
        } else {
            if nums[mid]<target && target<=nums[hi] { lo=mid+1 } else { hi=mid-1 }
        }
    }
    return -1
}`,solve:({nums:a,target},e)=>{
  let lo=0,hi=a.length-1;
  while(lo<=hi){
    const mid=(lo+hi)>>1;
    e({kind:'array',label:'nums',values:a,range:[lo,hi],active:[mid],pointers:{lo,mid,hi}},'确定有序半段','闭区间[lo,hi]内，检查中点并判断哪一半有序。','if nums[lo]<=nums[mid]',{lo,mid,hi,target});
    if(a[mid]===target)return mid;
    if(a[lo]<=a[mid]){if(a[lo]<=target&&target<a[mid])hi=mid-1;else lo=mid+1;}
    else{if(a[mid]<target&&target<=a[hi])lo=mid+1;else hi=mid-1;}
  }
  e({kind:'array',label:'nums',values:a,range:[lo,hi],pointers:{lo,hi}},'搜索区间已空','lo大于hi，目标不在数组中；保留越界端点以展示退出条件。','return -1',{lo,hi,target});
  return -1;
}});
add({id:34,summary:'返回升序数组中target第一次和最后一次出现的索引；不存在返回[-1,-1]。',rule:'允许重复值；分别二分第一个≥target和第一个>target的位置。',steps:[['寻找左边界','第一个不小于目标的位置是可能的起点。'],['寻找右开边界','第一个严格大于目标的位置减一得到终点。'],['验证目标存在','左边界越界或值不等于目标时返回两个-1。']],time:'O(log n)',space:'O(1)',input:{nums:[5,7,7,8,8,10],target:8},expected:[3,4],cases:[{input:{nums:[],target:0},expected:[-1,-1]},{input:{nums:[2,2,2],target:2},expected:[0,2]}],validate:({nums,target})=>{sorted(nums);integer(target,-1e9,1e9,'target');},code:`func searchRange(nums []int,target int) []int {
    bound:=func(strict bool) int {
        lo,hi:=0,len(nums)
        for lo<hi {
            mid:=lo+(hi-lo)/2
            if nums[mid]<target || (strict && nums[mid]==target) { lo=mid+1 } else { hi=mid }
        }
        return lo
    }
    left:=bound(false); right:=bound(true)-1
    if left==len(nums) || nums[left]!=target { return []int{-1,-1} }
    return []int{left,right}
}`,solve:({nums,target},e)=>{
  function bound(strict){
    let lo=0,hi=nums.length;
    while(lo<hi){
      const mid=(lo+hi)>>1;
      e({kind:'array',label:'nums',values:nums,range:[lo,hi-1],active:[mid],pointers:{lo,mid,hi}},strict?'查找右开边界':'查找左边界','搜索区间为[lo,hi)，相等时是否继续向右由strict决定。','if nums[mid]<target',{lo,mid,hi,strict,target});
      if(nums[mid]<target||(strict&&nums[mid]===target))lo=mid+1;else hi=mid;
    }
    e({kind:'array',label:'nums',values:nums,range:[lo,hi-1],pointers:{lo,hi}},'边界查找收敛','lo等于hi，返回当前下界位置。','return lo',{lo,hi,strict,target});
    return lo;
  }
  const left=bound(false),right=bound(true)-1,found=left<nums.length&&nums[left]===target;
  e({kind:'array',label:'nums',values:nums,range:[left,right],pointers:{left,right}},found?'确定目标起止位置':'目标不存在',found?'left和right分别对应目标第一次与最后一次出现。':'left越界或没有命中目标，返回两个-1。',found?'return []int{left,right}':'if left==len(nums)',{left,right,target});
  return found?[left,right]:[-1,-1];
}});
add({id:153,summary:'返回互异升序数组旋转后数组中的最小值。',rule:'数组非空且无重复值；最小值位于旋转断点。',steps:[['比较中点与右端','中点大于右端说明断点严格在中点右侧。'],['保留断点候选','否则中点可能是最小值，保留左半含中点。'],['收敛最小位置','左右端重合时返回该位置的值。']],time:'O(log n)',space:'O(1)',input:{nums:[3,4,5,1,2]},expected:1,cases:[{input:{nums:[1]},expected:1},{input:{nums:[1,2,3]},expected:1}],validate:({nums})=>rotation(nums),code:`func findMin(nums []int) int {
    lo,hi:=0,len(nums)-1
    for lo<hi {
        mid:=lo+(hi-lo)/2
        if nums[mid]>nums[hi] { lo=mid+1 } else { hi=mid }
    }
    return nums[lo]
}`,solve:({nums},e)=>{
  let lo=0,hi=nums.length-1;
  while(lo<hi){
    const mid=(lo+hi)>>1;
    e({kind:'array',label:'nums',values:nums,range:[lo,hi],pointers:{lo,mid,hi},active:[mid,hi]},'比较中点与右端','候选最小值位于闭区间[lo,hi]，用nums[mid]与nums[hi]决定保留哪一半。','if nums[mid]>nums[hi]',{lo,mid,hi});
    if(nums[mid]>nums[hi])lo=mid+1;else hi=mid;
  }
  e({kind:'array',label:'nums',values:nums,range:[lo,hi],pointers:{lo,hi},done:[lo]},'定位最小值','lo与hi收敛到同一个最小值位置。','return nums[lo]',{lo,hi});
  return nums[lo];
}});
add({id:4,summary:'给定两个升序整数数组，返回所有元素合并后的中位数。',rule:'两个数组不能同时为空；在短数组上二分划分点，保持左右两侧数量平衡。',steps:[['选择较短数组','只二分较短数组的左半元素个数i。'],['对齐两个划分','令j使左侧总数为总长度的一半向上取整，比较交叉边界。'],['得到中位数','两个左边界都不大于右边界时，根据奇偶取中间一项或两项平均。']],time:'O(log min(m,n))',space:'O(1)',input:{nums1:[1,3],nums2:[2]},expected:2,cases:[{input:{nums1:[1,2],nums2:[3,4]},expected:2.5},{input:{nums1:[],nums2:[0]},expected:0}],validate:({nums1,nums2})=>{sorted(nums1);sorted(nums2);invariant(nums1.length+nums2.length>0,'两个数组不能都为空。');},code:`import "math"
func findMedianSortedArrays(a []int,b []int) float64 {
    if len(a)>len(b) { return findMedianSortedArrays(b,a) }
    m,n:=len(a),len(b); lo,hi:=0,m
    for lo<=hi {
        i:=(lo+hi)/2; j:=(m+n+1)/2-i
        al,ar,bl,br:=math.Inf(-1),math.Inf(1),math.Inf(-1),math.Inf(1)
        if i>0 { al=float64(a[i-1]) }; if i<m { ar=float64(a[i]) }
        if j>0 { bl=float64(b[j-1]) }; if j<n { br=float64(b[j]) }
        if al<=br && bl<=ar {
            if (m+n)%2==1 { return math.Max(al,bl) }
            return (math.Max(al,bl)+math.Min(ar,br))/2
        }
        if al>br { hi=i-1 } else { lo=i+1 }
    }
    return 0
}`,solve:({nums1:a,nums2:b},e)=>{
  if(a.length>b.length)[a,b]=[b,a];const m=a.length,n=b.length;let lo=0,hi=m;
  while(lo<=hi){
    const i=(lo+hi)>>1,j=Math.floor((m+n+1)/2)-i,al=i?a[i-1]:-Infinity,ar=i<m?a[i]:Infinity,bl=j?b[j-1]:-Infinity,br=j<n?b[j]:Infinity;
    const scene={kind:'array',label:'a',values:a,secondary:b,secondaryLabel:'b',range:[lo,hi],pointers:{lo,i,hi},secondaryPointers:{j},active:[i-1,i].filter(x=>x>=0&&x<m),secondaryActive:[j-1,j].filter(x=>x>=0&&x<n)};
    const vars={lo,hi,i,j,m,n,al:String(al),ar:String(ar),bl:String(bl),br:String(br)};
    e(scene,'调整平衡划分','i是a左半元素数，j是b左半元素数；i/j可位于数组末尾边界。','if al<=br && bl<=ar',vars);
    if(al<=br&&bl<=ar){
      const median=(m+n)%2?Math.max(al,bl):(Math.max(al,bl)+Math.min(ar,br))/2;
      e(scene,'划分有效','左右数量平衡且交叉边界有序，按总长度奇偶读取中位数。','if (m+n)%2==1',{...vars,median});
      return median;
    }
    if(al>br)hi=i-1;else lo=i+1;
  }
  return 0;
}});

class Heap {
  constructor(less=(a,b)=>a<b){this.a=[];this.less=less;}
  push(x){const a=this.a;a.push(x);let i=a.length-1;while(i){const p=(i-1)>>1;if(!this.less(a[i],a[p]))break;[a[i],a[p]]=[a[p],a[i]];i=p;}}
  pop(){const a=this.a,top=a[0],last=a.pop();if(a.length){a[0]=last;let i=0;while(true){let j=i,l=2*i+1,r=l+1;if(l<a.length&&this.less(a[l],a[j]))j=l;if(r<a.length&&this.less(a[r],a[j]))j=r;if(j===i)break;[a[i],a[j]]=[a[j],a[i]];i=j;}}return top;}
}
const heapScene=(h,label='堆')=>({kind:'tree',nodes:[{id:'label',label},...h.a.map((x,i)=>({id:String(i),label:Array.isArray(x)?x.join(','):String(x)}))],edges:h.a.map((_,i)=>({from:i?String((i-1)>>1):'label',to:String(i),directed:true})),active:h.a.length?['0']:[]});
const intHeapGo=`type IntHeap []int
func(h IntHeap) Len() int { return len(h) }
func(h IntHeap) Less(i,j int) bool { return h[i]<h[j] }
func(h IntHeap) Swap(i,j int) { h[i],h[j]=h[j],h[i] }
func(h *IntHeap) Push(x any) { *h=append(*h,x.(int)) }
func(h *IntHeap) Pop() any { a:=*h; x:=a[len(a)-1]; *h=a[:len(a)-1]; return x }`;
add({id:215,summary:'返回整数数组中按降序排列后的第k个元素，重复元素分别计数。',rule:'用大小最多k的小根堆保存当前最大的k项。',steps:[['建立候选堆','逐项放入小根堆。'],['只保留k项','堆超过k时删除最小项，剩余的是最大k项。'],['读取堆顶','最终堆顶即这些候选中最小的一项，也就是第k大。']],time:'O(n log k)',space:'O(k)',input:{nums:[3,2,1,5,6,4],k:2},expected:5,cases:[{input:{nums:[1],k:1},expected:1},{input:{nums:[2,2,1],k:2},expected:2}],validate:({nums,k})=>{nonempty(nums);integer(k,1,nums.length,'k');},code:`import "container/heap"
${intHeapGo}
func findKthLargest(nums []int,k int) int {
    h:=&IntHeap{}; heap.Init(h)
    for _,x:=range nums {
        heap.Push(h,x)
        if h.Len()>k { heap.Pop(h) }
    }
    return (*h)[0]
}`,solve:({nums,k},e)=>{const h=new Heap();for(const x of nums){h.push(x);e(heapScene(h,'最大k项候选的小根堆'),'加入候选','新数字先进入候选堆。','heap.Push(h,x)',{x,k});if(h.a.length>k){const removed=h.pop();e(heapScene(h),'移除最小候选','只保留目前最大的k项。','if h.Len()>k',{removed});}}return h.a[0];}});
add({id:502,summary:'从若干项目中至多执行k个，项目需达到启动资本且完成后获得利润，返回最大最终资本。',rule:'每个项目最多一次，利润和启动资本非负；演示项目≤30。',steps:[['按门槛排序','资本门槛从低到高排列项目。'],['解锁可执行项目','将门槛不超过当前资本的项目加入利润大根堆。'],['贪心取最大利润','执行堆顶项目增加资本；重复直到k次或没有可做项目。']],time:'O(n log n+k log n)',space:'O(n)',input:{k:2,w:0,profits:[1,2,3],capital:[0,1,1]},expected:4,cases:[{input:{k:1,w:0,profits:[1],capital:[2]},expected:0},{input:{k:0,w:3,profits:[5],capital:[0]},expected:3}],validate:({k,w,profits,capital})=>{numbers(profits,'profits',30);numbers(capital,'capital',30);invariant(profits.length===capital.length&&[...profits,...capital].every(x=>x>=0),'项目数组等长且非负。');integer(k,0,30,'k');integer(w,0,1e9,'w');},code:`import ("container/heap"; "sort")
${intHeapGo}
func findMaximizedCapital(k int,w int,profits []int,capital []int) int {
    projects:=make([][2]int,len(profits))
    for i:=range profits { projects[i]=[2]int{capital[i],profits[i]} }
    sort.Slice(projects,func(i,j int) bool { return projects[i][0]<projects[j][0] })
    h:=&IntHeap{}; heap.Init(h); i:=0
    for step:=0;step<k;step++ {
        for i<len(projects) && projects[i][0]<=w { heap.Push(h,-projects[i][1]); i++ }
        if h.Len()==0 { break }
        w-=heap.Pop(h).(int)
    }
    return w
}`,solve:({k,w,profits,capital},e)=>{const p=profits.map((v,i)=>[capital[i],v]).sort((a,b)=>a[0]-b[0]),h=new Heap((a,b)=>a>b);let i=0;for(let t=0;t<k;t++){while(i<p.length&&p[i][0]<=w){h.push(p[i++][1]);e(heapScene(h,'已解锁利润大根堆'),'解锁项目','资本满足启动门槛，加入可选项目。','heap.Push(h,-projects[i][1])',{w,已解锁:i});}if(!h.a.length)break;const profit=h.pop();w+=profit;e(heapScene(h),'执行最赚钱项目','增加资本后，下一轮可能解锁更多项目。','w-=heap.Pop(h)',{profit,w,已执行:t+1});}return w;}});
add({id:373,summary:'从两个升序数组各取一项组成数对，返回和最小的前k个数对。',rule:'相同值按不同索引计数；同和数对按索引(i,j)排序以固定演示输出。',steps:[['每行首项入堆','固定nums1索引i时，数对和随nums2索引增加而不减。'],['弹出全局最小','小根堆保存各行尚未输出的最小数对。'],['推进同一行','弹出(i,j)后只需加入(i,j+1)，直到产生k项。']],time:'O(k log min(k,m))',space:'O(min(k,m))，不计结果',input:{nums1:[1,7,11],nums2:[2,4,6],k:3},expected:[[1,2],[1,4],[1,6]],cases:[{input:{nums1:[],nums2:[1],k:2},expected:[]},{input:{nums1:[1,1],nums2:[1,2],k:3},expected:[[1,1],[1,1],[1,2]]}],validate:({nums1,nums2,k})=>{sorted(nums1);sorted(nums2);integer(k,0,50,'k');},code:`import "container/heap"
type Pair struct { Sum,I,J int }
type PairHeap []Pair
func(h PairHeap) Len() int { return len(h) }
func(h PairHeap) Less(i,j int) bool { a,b:=h[i],h[j]; if a.Sum!=b.Sum { return a.Sum<b.Sum }; if a.I!=b.I { return a.I<b.I }; return a.J<b.J }
func(h PairHeap) Swap(i,j int) { h[i],h[j]=h[j],h[i] }
func(h *PairHeap) Push(x any) { *h=append(*h,x.(Pair)) }
func(h *PairHeap) Pop() any { a:=*h;x:=a[len(a)-1];*h=a[:len(a)-1];return x }
func kSmallestPairs(a []int,b []int,k int) [][]int {
    ans:=[][]int{}; if len(b)==0 { return ans }
    h:=&PairHeap{}; heap.Init(h)
    for i:=0;i<len(a)&&i<k;i++ { heap.Push(h,Pair{a[i]+b[0],i,0}) }
    for len(ans)<k && h.Len()>0 {
        p:=heap.Pop(h).(Pair); ans=append(ans,[]int{a[p.I],b[p.J]})
        if p.J+1<len(b) { heap.Push(h,Pair{a[p.I]+b[p.J+1],p.I,p.J+1}) }
    }
    return ans
}`,solve:({nums1:a,nums2:b,k},e)=>{const ans=[],h=new Heap((x,y)=>x[0]!==y[0]?x[0]<y[0]:x[1]!==y[1]?x[1]<y[1]:x[2]<y[2]);if(!b.length)return ans;for(let i=0;i<a.length&&i<k;i++){h.push([a[i]+b[0],i,0]);e(heapScene(h,'节点：和,i,j'),'加入行首候选','各行的第一个数对是本行最小。','heap.Push(h,Pair{a[i]+b[0]');}while(ans.length<k&&h.a.length){const [sum,i,j]=h.pop();ans.push([a[i],b[j]]);e(heapScene(h),'弹出最小数对',`选择(${a[i]},${b[j]})，和为${sum}。`,'p:=heap.Pop(h)',{已输出:ans});if(j+1<b.length){h.push([a[i]+b[j+1],i,j+1]);e(heapScene(h),'推进这一行','同一行的下一个数对进入候选。','if p.J+1<len(b)');}}return ans;}});
add({id:295,summary:'设计数据流中位数结构，支持添加整数及随时查询当前所有数的中位数。',rule:'JSON为operations数组，如["MedianFinder"],["addNum",1],["findMedian"]；空流不可查询。',steps:[['维护两个堆','小的一半放大根堆，大的一半放小根堆。'],['添加并平衡','先将数送入左堆，再把左堆最大值送入右堆，必要时移回使左边最多多一个。'],['读取中间边界','奇数取左堆顶，偶数取两堆顶平均。']],time:'addNum O(log n)，findMedian O(1)',space:'O(n)',input:{operations:[['MedianFinder'],['addNum',1],['addNum',2],['findMedian'],['addNum',3],['findMedian']]},expected:[null,null,null,1.5,null,2],cases:[{input:{operations:[['MedianFinder'],['addNum',-1],['findMedian']]},expected:[null,null,-1]},{input:{operations:[['MedianFinder'],['addNum',2],['addNum',2],['findMedian']]},expected:[null,null,null,2]}],validate:({operations:ops})=>{invariant(Array.isArray(ops)&&ops.length<=60&&ops[0]?.[0]==='MedianFinder','operations须从构造开始且最多60项。');let n=0;ops.forEach((op,i)=>{invariant(Array.isArray(op),'操作须为数组。');if(i===0)return;if(op[0]==='addNum'){integer(op[1],-1e9,1e9,'num');n++;}else invariant(op[0]==='findMedian'&&n>0,'仅支持addNum及非空流的findMedian。');});},code:`import "container/heap"
${intHeapGo}
type MedianFinder struct { low,high IntHeap }
func Constructor() MedianFinder { return MedianFinder{} }
func(m *MedianFinder) AddNum(num int) {
    heap.Push(&m.low,-num)
    heap.Push(&m.high,-heap.Pop(&m.low).(int))
    if m.high.Len()>m.low.Len() { heap.Push(&m.low,-heap.Pop(&m.high).(int)) }
}
func(m *MedianFinder) FindMedian() float64 {
    if m.low.Len()>m.high.Len() { return float64(-m.low[0]) }
    return float64(-m.low[0]+m.high[0])/2
}`,solve:({operations},e)=>{const l=new Heap((a,b)=>a>b),h=new Heap(),out=[];const scene=()=>{const a=heapScene(l,'左半大根堆'),b=heapScene(h,'右半小根堆');return {kind:'tree',nodes:a.nodes.map(n=>({...n,id:'l'+n.id})).concat(b.nodes.map(n=>({...n,id:'r'+n.id}))),edges:a.edges.map(x=>({...x,from:'l'+x.from,to:'l'+x.to})).concat(b.edges.map(x=>({...x,from:'r'+x.from,to:'r'+x.to})))};};for(const [op,x] of operations){if(op==='MedianFinder'){out.push(null);continue;}if(op==='addNum'){l.push(x);e(scene(),'添加到较小半区','暂时将新值加入左侧。','heap.Push(&m.low,-num)',{num:x});h.push(l.pop());if(h.a.length>l.a.length)l.push(h.pop());e(scene(),'平衡两堆','左堆数量等于右堆或多一个，且左堆顶不超过右堆顶。','if m.high.Len()>m.low.Len()');out.push(null);}else{const median=l.a.length>h.a.length?l.a[0]:(l.a[0]+h.a[0])/2;out.push(median);e(scene(),'读取中位数','按两堆数量关系读取边界。','if m.low.Len()>m.high.Len()',{median});}}return out;}});

add({id:67,summary:'给定两个二进制非空字符串，返回它们相加后的二进制字符串。',rule:'只能含0和1；从低位开始逐位相加并携带进位。',steps:[['对齐最低位','双指针从两串末尾向前移动。'],['计算本位与进位','当前总和的模2为结果位，除2向下取整为下一位进位。'],['反转结果','低位先产生，最后反转得到正常顺序。']],time:'O(max(m,n))',space:'O(max(m,n))',input:{a:'1010',b:'1011'},expected:'10101',cases:[{input:{a:'0',b:'0'},expected:'0'},{input:{a:'111',b:'1'},expected:'1000'}],validate:({a,b})=>{for(const s of [a,b]){text(s,'二进制串',40);invariant(/^(0|1[01]*)$/.test(s),'须为无多余前导零的二进制字符串。');}},code:`func addBinary(a string,b string) string {
    i,j,carry:=len(a)-1,len(b)-1,0; out:=[]byte{}
    for i>=0 || j>=0 || carry>0 {
        sum:=carry
        if i>=0 { sum+=int(a[i]-'0'); i-- }; if j>=0 { sum+=int(b[j]-'0'); j-- }
        out=append(out,byte(sum%2)+'0'); carry=sum/2
    }
    for l,r:=0,len(out)-1;l<r;l,r=l+1,r-1 { out[l],out[r]=out[r],out[l] }
    return string(out)
}`,solve:({a,b},e)=>{let i=a.length-1,j=b.length-1,carry=0;const out=[];while(i>=0||j>=0||carry){let sum=carry;if(i>=0)sum+=+a[i--];if(j>=0)sum+=+b[j--];out.push(String(sum%2));carry=Math.floor(sum/2);e({kind:'bits',values:[a,b,[...out].reverse().join('')],labels:['a','b','已算低位']},'逐位相加','本位取余2，向高位传递进位。','out=append(out',{i,j,sum,carry});}return out.reverse().join('');}});
add({id:190,summary:'颠倒一个32位无符号整数的所有二进制位，返回新的无符号整数。',rule:'固定处理32位，输入0≤n≤2³²−1。',steps:[['读取最低位','n与1按位与得到当前最低位。'],['结果左移并追加','结果左移腾出新位置，再合入最低位。'],['输入右移','无符号右移输入，重复32轮保留前导零信息。']],time:'O(32)=O(1)',space:'O(1)',input:{n:43261596},expected:964176192,cases:[{input:{n:0},expected:0},{input:{n:4294967295},expected:4294967295}],validate:({n})=>integer(n,0,4294967295,'n'),code:`func reverseBits(num uint32) uint32 {
    var ans uint32
    for i:=0;i<32;i++ {
        ans=(ans<<1)|(num&1)
        num>>=1
    }
    return ans
}`,solve:({n},e)=>{let ans=0;for(let i=0;i<32;i++){ans=((ans<<1)|(n&1))>>>0;n>>>=1;e({kind:'bits',values:[bits(n),bits(ans)],labels:['剩余输入','反转结果'],active:[31-i]},'搬运最低位','结果向左移动一位，再追加本轮取出的位。','ans=(ans<<1)',{轮次:i+1,ans});}return ans;}});
add({id:191,summary:'统计给定32位非负整数的二进制表示中1的数量。',rule:'每轮n&(n−1)会消去最低的一个1。',steps:[['计数从零开始','n为尚未计入的二进制位。'],['消去一个1','将n与n−1按位与，恰好清除最低有效1。'],['直到全部清零','每清除一次计数加一，n为零即结束。']],time:'O(popcount(n))，最多32轮',space:'O(1)',input:{n:11},expected:3,cases:[{input:{n:0},expected:0},{input:{n:128},expected:1}],validate:({n})=>integer(n,0,4294967295,'n'),code:`func hammingWeight(n uint32) int {
    count:=0
    for n!=0 {
        n&=n-1
        count++
    }
    return count
}`,solve:({n},e)=>{let count=0;while(n){const before=n;n=(n&(n-1))>>>0;count++;e({kind:'bits',values:[bits(before),bits(before-1),bits(n)],labels:['n','n−1','n & (n−1)']},'消除最低的1','每轮恰好消除一个1。','n&=n-1',{count});}return count;}});
add({id:136,summary:'数组中除一个整数出现一次外，其余整数都出现两次，返回只出现一次的整数。',rule:'异或满足交换结合律，相同数异或为0；使用32位有符号整数。',steps:[['累积异或','从0开始依次异或每个数。'],['相同数抵消','出现两次的所有位会两两抵消。'],['保留唯一项','最后结果就是只出现一次的数字。']],time:'O(n)',space:'O(1)',input:{nums:[4,1,2,1,2]},expected:4,cases:[{input:{nums:[-7]},expected:-7},{input:{nums:[0,1,0]},expected:1}],validate:({nums})=>{nonempty(nums);const counts=new Map();nums.forEach(x=>counts.set(x,(counts.get(x)||0)+1));invariant([...counts.values()].filter(x=>x===1).length===1&&[...counts.values()].every(x=>x===1||x===2),'须恰有一项出现一次，其余出现两次。');},code:`func singleNumber(nums []int) int {
    ans:=0
    for _,x:=range nums { ans^=x }
    return ans
}`,solve:({nums},e)=>{let ans=0;for(const x of nums){const before=ans;ans^=x;e({kind:'bits',values:[bits(before),bits(x),bits(ans)],labels:['之前累积','当前整数','异或结果']},'异或累积','相同二进制位出现两次便抵消。','ans^=x',{x,ans});}return ans;}});
add({id:137,summary:'数组中除一个整数出现一次外，其余整数出现三次，返回只出现一次的整数。',rule:'逐位统计1的数量并对3取余，按32位补码恢复负数。',steps:[['逐位计数','对每个二进制位统计所有输入在这一位的1。'],['对3取余','三次出现的数贡献是3的倍数，余数属于唯一项。'],['拼回答案','将余数写回对应位，最高位按有符号补码解释。']],time:'O(32n)=O(n)',space:'O(1)',input:{nums:[2,2,3,2]},expected:3,cases:[{input:{nums:[-2,-2,-2,-7]},expected:-7},{input:{nums:[0,1,1,1]},expected:0}],validate:({nums})=>{nonempty(nums);const c=new Map();nums.forEach(x=>c.set(x,(c.get(x)||0)+1));invariant([...c.values()].filter(x=>x===1).length===1&&[...c.values()].every(x=>x===1||x===3),'须恰有一项出现一次，其余出现三次。');},code:`func singleNumber(nums []int) int {
    var ans uint32
    for bit:=0;bit<32;bit++ {
        count:=0
        for _,x:=range nums { count+=int((uint32(x)>>bit)&1) }
        ans|=uint32(count%3)<<bit
    }
    return int(int32(ans))
}`,solve:({nums},e)=>{let ans=0;for(let bit=0;bit<32;bit++){let count=0;for(const x of nums)count+=(x>>>bit)&1;ans|=(count%3)<<bit;e({kind:'bits',values:nums.map(bits).concat(bits(ans)),labels:nums.map((_,i)=>`nums[${i}]`).concat('恢复结果'),active:[31-bit]},'按位统计并取余','出现三次的数字在当前位的贡献被模3消去。','ans|=uint32(count%3)',{bit,count,余数:count%3,ans});}return ans;}});
add({id:201,summary:'返回闭区间[left,right]内所有整数按位与的结果。',rule:'0≤left≤right≤2³¹−1；变化过的低位最终都会变为0。',steps:[['寻找公共前缀','左右端同时右移，直到两者相等。'],['记录移位次数','每右移一位就确认一个低位无法保留。'],['补回零低位','公共前缀左移同样次数，得到整个范围的按位与。']],time:'O(log right)',space:'O(1)',input:{left:5,right:7},expected:4,cases:[{input:{left:0,right:0},expected:0},{input:{left:1,right:2147483647},expected:0}],validate:({left,right})=>{integer(left,0,2147483647,'left');integer(right,left,2147483647,'right');},code:`func rangeBitwiseAnd(left int,right int) int {
    shift:=0
    for left<right {
        left>>=1; right>>=1; shift++
    }
    return left<<shift
}`,solve:({left,right},e)=>{let shift=0;while(left<right){left>>>=1;right>>>=1;shift++;e({kind:'bits',values:[bits(left),bits(right)],labels:['left右移后','right右移后']},'剥离变化的低位','当两端相等时，剩下的就是公共高位前缀。','left>>=1',{shift});}const out=(left*2**shift)>>>0;e({kind:'bits',values:[bits(left),bits(out)],labels:['公共前缀','补零后的答案']},'恢复公共前缀位置','被移走的低位全部补0。','return left<<shift',{shift});return out;}});

add({id:9,summary:'判断一个整数的十进制表示是否从左向右和从右向左相同。',rule:'负数不是回文；除0外以0结尾的整数也不是回文，不转字符串。',steps:[['排除不可能输入','负数与非零尾零整数直接返回false。'],['反转数字后一半','每轮取最低十进制位，接到reversed末尾。'],['比较两个半段','偶数位比较两半；奇数位忽略反转部分的中间位。']],time:'O(log x)',space:'O(1)',input:{x:12321},expected:true,cases:[{input:{x:-121},expected:false},{input:{x:10},expected:false}],validate:({x})=>integer(x,-2147483648,2147483647,'x'),code:`func isPalindrome(x int) bool {
    if x<0 || (x!=0 && x%10==0) { return false }
    reversed:=0
    for x>reversed {
        reversed=reversed*10+x%10
        x/=10
    }
    return x==reversed || x==reversed/10
}`,solve:({x},e)=>{if(x<0||(x!==0&&x%10===0)){e({kind:'state',items:[['输入',x]]},'排除不可能回文','负号或尾零使正反读法不同。','if x<0');return false;}let reversed=0;while(x>reversed){reversed=reversed*10+x%10;x=Math.trunc(x/10);e({kind:'table',columns:['尚未反转的前段','反转的后段'],rows:[[x,reversed]]},'反转末尾一位','只处理后一半，避免完整反转溢出。','reversed=reversed*10',{x,reversed});}return x===reversed||x===Math.trunc(reversed/10);}});
add({id:66,summary:'用高位在前的十进制数字数组表示非负整数，对该整数加一并返回数字数组。',rule:'每项0到9；除数字0本身外没有前导零。',steps:[['从最低位开始','末位加一最先影响个位。'],['传播进位','遇到9则改为0并继续向左；遇到小于9的位加一即可结束。'],['处理最高位溢出','若所有位都是9，在最前面补1。']],time:'O(n)',space:'O(1)，不计新增结果',input:{digits:[9,9,9]},expected:[1,0,0,0],cases:[{input:{digits:[0]},expected:[1]},{input:{digits:[1,2,9]},expected:[1,3,0]}],validate:({digits})=>{nonempty(digits,'digits');invariant(digits.every(v=>v>=0&&v<=9)&&(digits.length===1||digits[0]!==0),'须为无多余前导零的十进制数字数组。');},code:`func plusOne(digits []int) []int {
    for i:=len(digits)-1;i>=0;i-- {
        if digits[i]<9 { digits[i]++; return digits }
        digits[i]=0
    }
    return append([]int{1},digits...)
}`,solve:({digits:d},e)=>{
  for(let i=d.length-1;i>=0;i--){
    if(d[i]<9){d[i]++;e({kind:'array',label:'digits',values:d,active:[i],pointers:{i}},'本位加一结束','i对应当前十进制位，本位不再产生进位。','digits[i]++',{i});return d;}
    d[i]=0;e({kind:'array',label:'digits',values:d,active:[i],pointers:{i}},'9归零并进位','i向左移动后继续处理进位。','digits[i]=0',{i});
  }
  d.unshift(1);e({kind:'array',label:'digits',values:d,done:[0]},'补上最高位','原数全为9，结果多一位。','return append');return d;
}});
add({id:172,summary:'返回n!的十进制表示末尾连续0的数量。',rule:'不计算阶乘本身；每个0来自一对2和5，因子5的数量更少。',steps:[['计算5的倍数','每个5的倍数至少提供一个因子5。'],['继续统计高次幂','25、125等还提供额外因子，反复除以5累计。'],['返回因子总数','所有5的数量就是可配成的10的数量。']],time:'O(log₅ n)',space:'O(1)',input:{n:125},expected:31,cases:[{input:{n:0},expected:0},{input:{n:5},expected:1}],validate:({n})=>integer(n,0,1e9,'n'),code:`func trailingZeroes(n int) int {
    ans:=0
    for n>0 {
        n/=5
        ans+=n
    }
    return ans
}`,solve:({n},e)=>{let ans=0,power=1;while(n>0){n=Math.floor(n/5);power*=5;ans+=n;e({kind:'table',columns:['因子层级','贡献','累计零'],rows:[[power,n,ans]]},'累加一层因子5','继续除以5可统计更高次幂额外贡献。','ans+=n',{n,ans});}return ans;}});
add({id:69,summary:'返回非负整数x的平方根向下取整后的整数值。',rule:'不调用平方根函数；通过mid≤x/mid比较以避免乘法溢出。',steps:[['建立整数候选区间','答案在0到x之间。'],['二分可行边界','若mid²≤x记录候选并向右找更大值，否则向左。'],['返回最后可行值','区间耗尽时记录值即整数平方根。']],time:'O(log x)',space:'O(1)',input:{x:8},expected:2,cases:[{input:{x:0},expected:0},{input:{x:2147395600},expected:46340}],validate:({x})=>integer(x,0,2147483647,'x'),code:`func mySqrt(x int) int {
    lo,hi,ans:=1,x,0
    for lo<=hi {
        mid:=lo+(hi-lo)/2
        if mid<=x/mid { ans=mid; lo=mid+1 } else { hi=mid-1 }
    }
    return ans
}`,solve:({x},e)=>{let lo=1,hi=x,ans=0;while(lo<=hi){const mid=Math.floor((lo+hi)/2),valid=mid<=Math.floor(x/mid);e({kind:'table',columns:['lo','mid','hi','mid²','可行'],rows:[[lo,mid,hi,mid*mid,valid]]},'二分整数平方根','可行时尝试更大整数，不可行时缩小上界。','if mid<=x/mid',{x,ans});if(valid){ans=mid;lo=mid+1;}else hi=mid-1;}return ans;}});
add({id:50,summary:'计算实数x的整数n次幂，支持负指数。',rule:'负指数等价于倒数的正指数幂；演示指数绝对值≤10000，且结果须为有限数。',steps:[['转换负指数','指数为负时令底数取倒数，并把指数转为非负int64。'],['处理当前二进制位','指数最低位是1时将当前底数乘入答案。'],['平方与右移','底数自乘、指数除2，直到指数为0。']],time:'O(log |n|)',space:'O(1)',input:{x:2,n:-3},expected:0.125,cases:[{input:{x:2,n:0},expected:1},{input:{x:2,n:10},expected:1024}],validate:({x,n})=>{invariant(typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=100,'x须为有限实数且绝对值≤100。');integer(n,-10000,10000,'n');invariant(!(x===0&&n<0)&&Number.isFinite(x**n),'幂结果须为有限数。');},code:`func myPow(x float64,n int) float64 {
    exp:=int64(n)
    if exp<0 { x=1/x; exp=-exp }
    ans:=1.0
    for exp>0 {
        if exp&1==1 { ans*=x }
        x*=x; exp>>=1
    }
    return ans
}`,solve:({x,n},e)=>{let exp=n;if(exp<0){x=1/x;exp=-exp;}let ans=1;while(exp>0){const odd=exp%2;if(odd)ans*=x;e({kind:'bits',values:[exp.toString(2)],labels:['剩余指数'],active:[exp.toString(2).length-1]},'检查指数最低位',odd?'当前位是1，乘入本轮底数。':'当前位是0，不改变答案。','if exp&1==1',{底数:x,ans,exp});x*=x;exp=Math.floor(exp/2);}return ans;}});
add({id:149,summary:'给定平面上互不相同的整数坐标点，返回位于同一条直线上的最大点数。',rule:'固定锚点后，用约分且方向规范化的(dx,dy)表示斜率，避免浮点误差。',steps:[['枚举锚点','每条最优直线一定通过某个输入点。'],['规范化斜率','差值除以最大公约数，并固定符号，竖线和水平线也可统一表示。'],['统计同方向点数','同斜率最多点数加锚点即当前最佳直线。']],time:'O(n² log C)，C为坐标差上界',space:'O(n)',input:{points:[[1,1],[2,2],[3,3],[3,1]]},expected:3,cases:[{input:{points:[[0,0]]},expected:1},{input:{points:[[0,0],[0,1],[0,-1],[1,0]]},expected:3}],validate:({points})=>{matrix(points,'points',30);invariant(points.length>0&&points.every(p=>p.length===2&&p.every(Number.isInteger)),'points须为非空整数坐标对。');invariant(points.flat().every(v=>Math.abs(v)<=10000),'坐标绝对值≤10000。');invariant(new Set(points.map(p=>p.join(','))).size===points.length,'坐标点互不相同。');},code:`func maxPoints(points [][]int) int {
    var gcd func(int,int) int
    gcd=func(a,b int) int { if a<0 { a=-a }; if b<0 { b=-b }; for b!=0 { a,b=b,a%b }; return a }
    best:=1
    for i:=range points {
        counts:=map[[2]int]int{}
        for j:=i+1;j<len(points);j++ {
            dx,dy:=points[j][0]-points[i][0],points[j][1]-points[i][1]
            g:=gcd(dx,dy); dx/=g;dy/=g
            if dx<0 || (dx==0 && dy<0) { dx=-dx;dy=-dy }
            key:=[2]int{dx,dy};counts[key]++
            best=max(best,counts[key]+1)
        }
    }
    return best
}`,solve:({points:p},e)=>{let best=1;const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a;};for(let i=0;i<p.length;i++){const counts=new Map();for(let j=i+1;j<p.length;j++){let dx=p[j][0]-p[i][0],dy=p[j][1]-p[i][1];const g=gcd(dx,dy);dx/=g;dy/=g;if(dx<0||(dx===0&&dy<0)){dx=-dx;dy=-dy;}const key=`${dx},${dy}`;counts.set(key,(counts.get(key)||0)+1);best=Math.max(best,counts.get(key)+1);e({kind:'table',columns:['约分方向(dx,dy)','其他点数'],rows:[...counts]},'累计同斜率点','相同方向键对应同一条经过锚点的直线。','key:=[2]int{dx,dy}',{锚点:p[i],目标点:p[j],best});}}return best;}});

add({id:70,summary:'每次可以爬1或2级台阶，返回恰好爬到第n级的不同方法数。',rule:'1≤n≤45；最后一步只能来自n−1级或n−2级。',steps:[['定义前缀状态','dp[i]为到达第i级的方法数，dp[0]=dp[1]=1。'],['两种来源相加','到i级的最后一步来自i−1或i−2，两种情况不重叠。'],['按级数填表','从小到大计算，返回dp[n]。']],time:'O(n)',space:'O(n)',input:{n:5},expected:8,cases:[{input:{n:1},expected:1},{input:{n:2},expected:2}],validate:({n})=>integer(n,1,45,'n'),code:`func climbStairs(n int) int {
    dp:=make([]int,n+1);dp[0]=1;dp[1]=1
    for i:=2;i<=n;i++ { dp[i]=dp[i-1]+dp[i-2] }
    return dp[n]
}`,solve:({n},e)=>{
  const dp=Array(n+1).fill(0);dp[0]=dp[1]=1;
  e(dpScene(dp,[0,1]),'初始化基础状态','空路径和一级台阶都只有一种走法。','dp:=make');
  for(let i=2;i<=n;i++){
    dp[i]=dp[i-1]+dp[i-2];
    e(dpScene(dp,[i-2,i-1,i],{i,'i-1':i-1,'i-2':i-2}),'合并两种前驱','状态i依赖标出的i−1和i−2两行。','dp[i]=dp[i-1]+dp[i-2]',{i,依赖:[i-1,i-2]});
  }
  return dp[n];
}});
add({id:198,summary:'一排房屋各存有非负金额，不能偷相邻房屋，返回可偷的最大金额。',rule:'nums可为空；dp[i]表示前i间房屋的最优收益。',steps:[['定义前缀收益','dp[0]=0，不处理任何房屋时收益为0。'],['比较偷与不偷','不偷继承dp[i−1]；偷则加上dp[i−2]避免相邻冲突。'],['逐间更新','按房屋顺序填表，最后一格即最大收益。']],time:'O(n)',space:'O(n)',input:{nums:[2,7,9,3,1]},expected:12,cases:[{input:{nums:[]},expected:0},{input:{nums:[0,0]},expected:0}],validate:({nums})=>{numbers(nums);invariant(nums.every(x=>x>=0),'金额须非负。');},code:`func rob(nums []int) int {
    dp:=make([]int,len(nums)+1)
    for i,x:=range nums {
        take:=x
        if i>0 { take+=dp[i-1] }
        dp[i+1]=max(dp[i],take)
    }
    return dp[len(nums)]
}`,solve:({nums},e)=>{
  const dp=Array(nums.length+1).fill(0);
  for(let i=0;i<nums.length;i++){
    const x=nums[i],take=x+(i?dp[i-1]:0);dp[i+1]=Math.max(dp[i],take);
    e(dpScene(dp,[i,i+1,...(i?[i-1]:[])],{i,'i+1':i+1,...(i?{'i-1':i-1}:{})}),'选择偷或跳过','当前房屋下标i写入dp[i+1]，选择偷时读取dp[i−1]。','dp[i+1]=max',{i,x,take,skip:dp[i]});
  }
  return dp[nums.length];
}});
add({id:139,summary:'判断字符串能否拆分为若干字典单词的连续拼接；字典单词可重复使用。',rule:'输入使用ASCII；dp[i]表示前i个字符能否完全拆分，空串可拆分。',steps:[['空前缀可达','dp[0]=true作为所有拆分的起点。'],['尝试最后一个词','枚举j<i，若前j字符可拆且s[j:i]在字典中，则i可达。'],['返回完整前缀状态','按i递增更新，dp[n]决定整个字符串是否可拆。']],time:'O(n³)，包含子串构造与哈希成本',space:'O(n+D)，D为字典总字符数',input:{s:'leetcode',wordDict:['leet','code']},expected:true,cases:[{input:{s:'catsandog',wordDict:['cats','dog','sand','and','cat']},expected:false},{input:{s:'',wordDict:['a']},expected:true}],validate:({s,wordDict})=>{ascii(s,'s',30);invariant(Array.isArray(wordDict)&&wordDict.length<=30,'字典最多30词。');wordDict.forEach(w=>{ascii(w,'单词',30);invariant(w.length>0,'字典单词不能为空。');});},code:`func wordBreak(s string,wordDict []string) bool {
    words:=map[string]bool{};for _,w:=range wordDict { words[w]=true }
    dp:=make([]bool,len(s)+1);dp[0]=true
    for i:=1;i<=len(s);i++ {
        for j:=0;j<i;j++ {
            if dp[j] && words[s[j:i]] { dp[i]=true;break }
        }
    }
    return dp[len(s)]
}`,solve:({s,wordDict},e)=>{
  const words=new Set(wordDict),dp=Array(s.length+1).fill(false);dp[0]=true;
  for(let i=1;i<=s.length;i++)for(let j=0;j<i;j++){
    const hit=dp[j]&&words.has(s.slice(j,i));if(hit)dp[i]=true;
    e(dpScene(dp,[j,i],{i,j}),'尝试前缀拆分','dp[j]可达并且s[j:i]为字典词时，dp[i]可达。','if dp[j] && words',{i,j,子串:s.slice(j,i),命中:hit});
    if(hit)break;
  }
  return dp[s.length];
}});
add({id:322,summary:'给定可无限使用的正整数硬币面额和总金额，返回凑出总金额的最少硬币数；无法凑出返回-1。',rule:'amount≤80、面额最多10个，dp[a]表示金额a的最少硬币数。',steps:[['初始化金额0','dp[0]=0，其他金额设为不可达。'],['枚举最后一枚硬币','对每个金额a，尝试dp[a−coin]+1。'],['取最少或不可达','选择所有合法来源中最小值，最终仍不可达返回-1。']],time:'O(amount·k)',space:'O(amount)',input:{coins:[1,2,5],amount:11},expected:3,cases:[{input:{coins:[2],amount:3},expected:-1},{input:{coins:[1],amount:0},expected:0}],validate:({coins,amount})=>{nonempty(coins,'coins',10);invariant(coins.every(c=>c>0),'面额须为正数。');integer(amount,0,80,'amount');},code:`func coinChange(coins []int,amount int) int {
    dp:=make([]int,amount+1);for a:=1;a<=amount;a++ { dp[a]=amount+1 }
    for a:=1;a<=amount;a++ {
        for _,coin:=range coins {
            if coin<=a { dp[a]=min(dp[a],dp[a-coin]+1) }
        }
    }
    if dp[amount]>amount { return -1 }
    return dp[amount]
}`,solve:({coins,amount},e)=>{
  const dp=Array(amount+1).fill(amount+1);dp[0]=0;
  for(let a=1;a<=amount;a++)for(const coin of coins){
    if(coin>a)continue;dp[a]=Math.min(dp[a],dp[a-coin]+1);
    e(dpScene(dp.map(v=>v>amount?'∞':v),[a-coin,a],{a,'a-coin':a-coin}),'尝试最后一枚硬币','a是目标金额下标，coin是面额；只将a与a−coin标为DP行位置。','if coin<=a',{a,coin,依赖:a-coin});
  }
  return dp[amount]>amount?-1:dp[amount];
}});
add({id:300,summary:'返回整数数组中最长严格递增子序列的长度；子序列可以跳过元素。',rule:'严格递增不允许相等；dp[i]必须以nums[i]结尾。',steps:[['每项单独成序列','每个dp[i]至少是1。'],['枚举更小前驱','对j<i且nums[j]<nums[i]，尝试接在该序列后面。'],['取最大结尾状态','答案是所有dp[i]中的最大值。']],time:'O(n²)',space:'O(n)',input:{nums:[10,9,2,5,3,7,101,18]},expected:4,cases:[{input:{nums:[]},expected:0},{input:{nums:[2,2,2]},expected:1}],validate:({nums})=>numbers(nums,'nums',35),code:`func lengthOfLIS(nums []int) int {
    dp:=make([]int,len(nums));best:=0
    for i:=range nums {
        dp[i]=1
        for j:=0;j<i;j++ { if nums[j]<nums[i] { dp[i]=max(dp[i],dp[j]+1) } }
        best=max(best,dp[i])
    }
    return best
}`,solve:({nums},e)=>{
  const dp=Array(nums.length).fill(1);let best=0;
  for(let i=0;i<nums.length;i++){
    e(dpScene(dp,[i],{i}),'初始化当前结尾','nums[i]自己构成长度1的序列。','dp[i]=1',{i,值:nums[i]});
    for(let j=0;j<i;j++){
      if(nums[j]<nums[i])dp[i]=Math.max(dp[i],dp[j]+1);
      e(dpScene(dp,[j,i],{i,j}),'检查较早的结尾','仅当nums[j]严格小于nums[i]时，才能把dp[j]接到当前位置。','if nums[j]<nums[i]',{i,j,前驱值:nums[j],当前值:nums[i]});
    }
    best=Math.max(best,dp[i]);
  }
  return best;
}});

add({id:120,summary:'从三角形顶端到底部，每步移动到下一行相邻的一个位置，返回最小路径和。',rule:'第r行包含r+1项，从(r,c)只能到(r+1,c)或(r+1,c+1)。',steps:[['复制底行状态','底行每格到达底部的最小和就是该格本身。'],['自底向上转移','当前值加上下方两个相邻状态中的较小值。'],['读取顶端','所有依赖均来自下一行，最终顶格即全局最优。']],time:'O(n²)，n为行数',space:'O(n²)',input:{triangle:[[2],[3,4],[6,5,7],[4,1,8,3]]},expected:11,cases:[{input:{triangle:[[-10]]},expected:-10},{input:{triangle:[[1],[2,3]]},expected:3}],validate:({triangle:t})=>{invariant(Array.isArray(t)&&t.length>0&&t.length<=15,'三角形行数须为1到15。');t.forEach((row,i)=>{numbers(row,'三角形行',15);invariant(row.length===i+1,'第r行须包含r+1项。');});},code:`func minimumTotal(triangle [][]int) int {
    n:=len(triangle); dp:=make([][]int,n)
    for r:=range triangle { dp[r]=append([]int{},triangle[r]...) }
    for r:=n-2;r>=0;r-- {
        for c:=0;c<=r;c++ { dp[r][c]=triangle[r][c]+min(dp[r+1][c],dp[r+1][c+1]) }
    }
    return dp[0][0]
}`,solve:({triangle:t},e)=>{
  const n=t.length,dp=t.map(row=>row.slice()),padded=()=>dp.map(row=>row.concat(Array(n-row.length).fill('·')));
  e({kind:'matrix',matrix:padded(),active:t[n-1].map((_,c)=>[n-1,c])},'初始化底层','底层无需再走，状态等于本身。','for r:=range triangle');
  for(let r=n-2;r>=0;r--)for(let c=0;c<=r;c++){
    dp[r][c]=t[r][c]+Math.min(dp[r+1][c],dp[r+1][c+1]);
    e(matrixDP(padded(),'r',r,'c',c,{'dp[r+1][c]':[r+1,c],'dp[r+1][c+1]':[r+1,c+1]}),'向上合并两条路径','当前dp[r][c]只依赖下一行两个相邻格。','dp[r][c]=triangle[r][c]',{r,c});
  }
  return dp[0][0];
}});
add({id:64,summary:'在非负数网格中，从左上角走到右下角，每次只能向右或向下，返回最小路径和。',rule:'路径包含起点和终点；dp[r][c]为到该格的最小总和。',steps:[['确定起点边界','起点状态等于起点值，其余位置初始不可达。'],['选择上方或左方','每格从上方和左方最小路径中取较小者。'],['加上当前代价','按行遍历保证依赖已算，终点状态就是答案。']],time:'O(mn)',space:'O(mn)',input:{grid:[[1,3,1],[1,5,1],[4,2,1]]},expected:7,cases:[{input:{grid:[[5]]},expected:5},{input:{grid:[[1,2,3]]},expected:6}],validate:({grid:g})=>{grid(g);invariant(g.flat().every(x=>Number.isInteger(x)&&x>=0&&x<=10000),'网格须为非负整数，单格≤10000。');},code:`func minPathSum(grid [][]int) int {
    m,n:=len(grid),len(grid[0]);dp:=make([][]int,m)
    for r:=range dp { dp[r]=make([]int,n) }
    for r:=0;r<m;r++ { for c:=0;c<n;c++ {
        if r==0 && c==0 { dp[r][c]=grid[r][c];continue }
        best:=int(1<<60)
        if r>0 { best=min(best,dp[r-1][c]) };if c>0 { best=min(best,dp[r][c-1]) }
        dp[r][c]=grid[r][c]+best
    } }
    return dp[m-1][n-1]
}`,solve:({grid:g},e)=>{
  const m=g.length,n=g[0].length,dp=Array.from({length:m},()=>Array(n).fill(null));
  for(let r=0;r<m;r++)for(let c=0;c<n;c++){
    dp[r][c]=g[r][c]+(r===0&&c===0?0:Math.min(r?dp[r-1][c]:Infinity,c?dp[r][c-1]:Infinity));
    const deps={...(r?{'dp[r-1][c]':[r-1,c]}:{}),...(c?{'dp[r][c-1]':[r,c-1]}:{})};
    e(matrixDP(dp,'r',r,'c',c,deps),'更新到达当前格的最小和','从标出的上方或左方最小路径，加上本格代价。','dp[r][c]=grid[r][c]+best',{r,c,本格代价:g[r][c]});
  }
  return dp[m-1][n-1];
}});
add({id:63,summary:'在含障碍的网格中，从左上角只向右或下移动到右下角，返回不同路径数。',rule:'1表示障碍，0表示可通行；障碍格的路径数恒为0。',steps:[['初始化起点','起点没有障碍时有一条空路径。'],['遇到障碍归零','障碍阻断所有经过该格的路径。'],['累加两个来源','可通行格的路径数等于上方和左方路径数之和。']],time:'O(mn)',space:'O(mn)',input:{obstacleGrid:[[0,0,0],[0,1,0],[0,0,0]]},expected:2,cases:[{input:{obstacleGrid:[[1]]},expected:0},{input:{obstacleGrid:[[0,1,0]]},expected:0}],validate:({obstacleGrid:g})=>{grid(g);invariant(g.flat().every(v=>v===0||v===1),'障碍网格只能是0或1。');},code:`func uniquePathsWithObstacles(obstacleGrid [][]int) int {
    m,n:=len(obstacleGrid),len(obstacleGrid[0]);dp:=make([][]int,m)
    for r:=range dp { dp[r]=make([]int,n) }
    for r:=0;r<m;r++ { for c:=0;c<n;c++ {
        if obstacleGrid[r][c]==1 { dp[r][c]=0;continue }
        if r==0 && c==0 { dp[r][c]=1;continue }
        if r>0 { dp[r][c]+=dp[r-1][c] };if c>0 { dp[r][c]+=dp[r][c-1] }
    } }
    return dp[m-1][n-1]
}`,solve:({obstacleGrid:g},e)=>{
  const m=g.length,n=g[0].length,dp=Array.from({length:m},()=>Array(n).fill(0));
  for(let r=0;r<m;r++)for(let c=0;c<n;c++){
    if(g[r][c])dp[r][c]=0;else if(!r&&!c)dp[r][c]=1;else dp[r][c]=(r?dp[r-1][c]:0)+(c?dp[r][c-1]:0);
    const deps=g[r][c]?{}:{...(r?{'dp[r-1][c]':[r-1,c]}:{}),...(c?{'dp[r][c-1]':[r,c-1]}:{})};
    e(matrixDP(dp.map((row,i)=>row.map((v,j)=>g[i][j]?'障碍':v)),'r',r,'c',c,deps),g[r][c]?'障碍阻断路径':'累加上方和左方',g[r][c]?'该格不可进入，路径数为0。':'dp[r][c]从标出的前驱格累加得到。',g[r][c]?'if obstacleGrid[r][c]==1':'dp[r][c]+=dp[r-1][c]',{r,c,路径数:dp[r][c]});
  }
  return dp[m-1][n-1];
}});
add({id:5,summary:'返回字符串中最长的连续回文子串；相同长度有多个时返回最先发现的一个。',rule:'ASCII字符串；dp[l][r]表示闭区间子串是否为回文。',steps:[['单字符必回文','长度1的区间作为最小基础状态。'],['从短到长扩展','首尾相同且内部区间为回文时，当前区间才是回文。'],['记录最长区间','遇到更长回文更新起点和长度，最后截取原串。']],time:'O(n²)',space:'O(n²)',input:{s:'babad'},expected:'bab',cases:[{input:{s:''},expected:''},{input:{s:'cbbd'},expected:'bb'}],validate:({s})=>ascii(s,'s',25),code:`func longestPalindrome(s string) string {
    n:=len(s);if n==0 { return "" }
    dp:=make([][]bool,n);for i:=range dp { dp[i]=make([]bool,n) }
    start,best:=0,1
    for length:=1;length<=n;length++ {
        for l:=0;l+length<=n;l++ {
            r:=l+length-1
            dp[l][r]=s[l]==s[r] && (length<=2 || dp[l+1][r-1])
            if dp[l][r] && length>best { start=l;best=length }
        }
    }
    return s[start:start+best]
}`,solve:({s},e)=>{
  const n=s.length;if(!n)return '';const dp=Array.from({length:n},()=>Array(n).fill(false));let start=0,best=1;
  for(let length=1;length<=n;length++)for(let l=0;l+length<=n;l++){
    const r=l+length-1;dp[l][r]=s[l]===s[r]&&(length<=2||dp[l+1][r-1]);
    if(dp[l][r]&&length>best){start=l;best=length;}
    e({...matrixDP(dp,'l',l,'r',r,length>2?{'dp[l+1][r-1]':[l+1,r-1]}:{}),rowLabels:[...s],colLabels:[...s]},'检查一个回文区间','行l与列r确定子串端点，长度大于2时读取内部dp[l+1][r−1]。','dp[l][r]=s[l]==s[r]',{l,r,length,start,best,首尾:[s[l],s[r]],当前最长:s.slice(start,start+best)});
  }
  return s.slice(start,start+best);
}});
add({id:97,summary:'判断s3是否可以由s1与s2交错组成，同时保持各自字符原有相对顺序。',rule:'使用ASCII；dp[i][j]表示s1前i字符和s2前j字符能否组成s3前i+j字符。',steps:[['长度先校验','长度不匹配直接失败，空前缀dp[0][0]为true。'],['选择最后一个来源','若最后字符来自s1则看上格；来自s2则看左格。'],['合并可行性','任一合法来源可达就设为true，返回右下格。']],time:'O(mn)',space:'O(mn)',input:{s1:'aabcc',s2:'dbbca',s3:'aadbbcbcac'},expected:true,cases:[{input:{s1:'aabcc',s2:'dbbca',s3:'aadbbbaccc'},expected:false},{input:{s1:'',s2:'',s3:''},expected:true}],validate:({s1,s2,s3})=>{ascii(s1,'s1',20);ascii(s2,'s2',20);ascii(s3,'s3',40);},code:`func isInterleave(s1 string,s2 string,s3 string) bool {
    m,n:=len(s1),len(s2);if m+n!=len(s3) { return false }
    dp:=make([][]bool,m+1);for i:=range dp { dp[i]=make([]bool,n+1) };dp[0][0]=true
    for i:=0;i<=m;i++ { for j:=0;j<=n;j++ {
        if i>0 { dp[i][j]=dp[i][j] || (dp[i-1][j] && s1[i-1]==s3[i+j-1]) }
        if j>0 { dp[i][j]=dp[i][j] || (dp[i][j-1] && s2[j-1]==s3[i+j-1]) }
    } }
    return dp[m][n]
}`,solve:({s1:a,s2:b,s3:c},e)=>{
  if(a.length+b.length!==c.length)return false;const m=a.length,n=b.length,dp=Array.from({length:m+1},()=>Array(n+1).fill(false));dp[0][0]=true;
  for(let i=0;i<=m;i++)for(let j=0;j<=n;j++){
    const fromA=i>0&&dp[i-1][j]&&a[i-1]===c[i+j-1],fromB=j>0&&dp[i][j-1]&&b[j-1]===c[i+j-1];dp[i][j]=dp[i][j]||fromA||fromB;
    const deps={...(i?{'dp[i-1][j]':[i-1,j]}:{}),...(j?{'dp[i][j-1]':[i,j-1]}:{})};
    e({...matrixDP(dp,'i',i,'j',j,deps),rowLabels:['∅',...a],colLabels:['∅',...b]},'选择交错字符串的末字符','i和j分别是两串已取字符数；从上方或左方前驱转移。','if i>0',{i,j,目标字符:c[i+j-1]??'∅',fromA,fromB});
  }
  return dp[m][n];
}});
add({id:72,summary:'返回把word1变成word2所需的最少编辑次数，可插入、删除或替换一个字符。',rule:'ASCII；每种操作代价均为1，空字符串允许输入。',steps:[['初始化空前缀','变为空串需删除全部，空串变目标需逐个插入。'],['匹配或三选一','字符相同时沿用左上；不同时对替换、删除、插入三种来源取最小再加1。'],['按前缀填表','按行从短前缀推到完整字符串，右下角就是距离。']],time:'O(mn)',space:'O(mn)',input:{word1:'horse',word2:'ros'},expected:3,cases:[{input:{word1:'',word2:'abc'},expected:3},{input:{word1:'same',word2:'same'},expected:0}],validate:({word1,word2})=>{ascii(word1,'word1',25);ascii(word2,'word2',25);},code:`func minDistance(word1 string,word2 string) int {
    m,n:=len(word1),len(word2);dp:=make([][]int,m+1)
    for i:=range dp { dp[i]=make([]int,n+1);dp[i][0]=i }
    for j:=0;j<=n;j++ { dp[0][j]=j }
    for i:=1;i<=m;i++ { for j:=1;j<=n;j++ {
        if word1[i-1]==word2[j-1] { dp[i][j]=dp[i-1][j-1] } else {
            dp[i][j]=1+min(dp[i-1][j-1],min(dp[i-1][j],dp[i][j-1]))
        }
    } }
    return dp[m][n]
}`,solve:({word1:a,word2:b},e)=>{
  const m=a.length,n=b.length,dp=Array.from({length:m+1},()=>Array(n+1).fill(0));
  for(let i=0;i<=m;i++)dp[i][0]=i;for(let j=0;j<=n;j++)dp[0][j]=j;
  e({kind:'matrix',matrix:dp,rowLabels:['∅',...a],colLabels:['∅',...b],active:[[0,0]]},'初始化空前缀边界','首行是逐个插入，首列是逐个删除。','for j:=0;j<=n');
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){
    const same=a[i-1]===b[j-1];dp[i][j]=same?dp[i-1][j-1]:1+Math.min(dp[i-1][j-1],dp[i-1][j],dp[i][j-1]);
    const deps={'dp[i-1][j-1]':[i-1,j-1],...(same?{}:{'dp[i-1][j]':[i-1,j],'dp[i][j-1]':[i,j-1]})};
    e({...matrixDP(dp,'i',i,'j',j,deps),rowLabels:['∅',...a],colLabels:['∅',...b]},same?'字符相同直接继承':'比较替换、删除、插入',same?'本字符无需操作，读取左上角前驱。':'当前dp[i][j]依赖左上、上、左三个已计算单元格。',same?'if word1[i-1]==word2[j-1]':'dp[i][j]=1+min',{i,j,替换:dp[i-1][j-1],删除:dp[i-1][j],插入:dp[i][j-1]});
  }
  return dp[m][n];
}});
function stockLesson(id,fixed){const head=fixed?'func maxProfit(prices []int) int {\n    k:=2':'func maxProfit(k int,prices []int) int {';add({id,summary:fixed?'给定每日股价，最多完成两笔买卖交易，返回最大利润。':'给定每日股价与交易次数上限k，返回最多k笔买卖的最大利润。',rule:'必须先卖掉手中股票才能再次买入；每笔交易为一次买入加一次卖出，不能同时持有多股。',steps:[['定义交易阶段','状态0为空仓，奇数阶段为第几次买后持股，偶数阶段为对应卖后空仓。'],['只依赖前一天','买入从前一空仓状态减股价，卖出从前一持股状态加股价；也可保持。'],['返回最终空仓收益','初始化所有空仓阶段为0允许少做交易，返回第2k阶段。']],time:fixed?'O(n)':'O(nk)',space:fixed?'O(n)':'O(nk)',input:fixed?{prices:[3,3,5,0,0,3,1,4]}:{k:2,prices:[3,2,6,5,0,3]},expected:fixed?6:7,cases:[{input:fixed?{prices:[]}:{k:0,prices:[1,2]},expected:0},{input:fixed?{prices:[5,4,3]}:{k:3,prices:[1,2,3]},expected:fixed?0:2}],validate:({prices,k})=>{numbers(prices,'prices',35);invariant(prices.every(p=>p>=0),'股价须非负。');if(!fixed)integer(k,0,8,'k');},code:`${head}
    n:=len(prices);dp:=make([][]int,n+1)
    for day:=range dp { dp[day]=make([]int,2*k+1);for s:=1;s<=2*k;s+=2 { dp[day][s]= -1<<60 } }
    for day,price:=range prices {
        for s:=1;s<=2*k;s++ {
            delta:=price;if s%2==1 { delta=-price }
            dp[day+1][s]=max(dp[day][s],dp[day][s-1]+delta)
        }
    }
    return dp[n][2*k]
}`,solve:({prices,k},e)=>{if(fixed)k=2;const neg=-1e15,dp=Array.from({length:prices.length+1},()=>Array.from({length:2*k+1},(_,s)=>s%2?neg:0));const labels=['初始空仓',...Array.from({length:2*k},(_,i)=>`${Math.floor(i/2)+1}${i%2?'卖出':'买入'}`)];for(let d=0;d<prices.length;d++){for(let s=1;s<=2*k;s++){const delta=s%2?-prices[d]:prices[d];dp[d+1][s]=Math.max(dp[d][s],dp[d][s-1]+delta);e({kind:'table',columns:['天数',...labels],rows:dp.map((row,i)=>[i,...row.map(v=>v<=neg/2?'−∞':v)]),active:[[d+1,s+1],[d,s+1],[d,s]],rowPointers:{day:d,'day+1':d+1},cellPointers:{'dp[day+1][s]':[d+1,s+1],'dp[day][s]':[d,s+1],'dp[day][s-1]':[d,s]}},s%2?'买入或继续持有':'卖出或继续空仓','当前阶段只读取前一天本阶段与前一阶段，避免当天串联多笔交易。','dp[day+1][s]=max',{day:d,s,price:prices[d],保持:dp[d][s],交易前:dp[d][s-1],delta});}if(!k)e(dpScene([0]),'没有交易额度','所有日期收益都为0。','return dp[n][2*k]');}return dp[prices.length][2*k];}});}
stockLesson(123,true);stockLesson(188,false);
add({id:221,summary:'在0/1矩阵中找到只由1组成的最大正方形，返回其面积。',rule:'dp[r][c]为以该位置作右下角的最大正方形边长；输入格可为数字或字符串0/1。',steps:[['增加零边界','额外首行首列为0，统一处理边缘格。'],['三个邻居取最小','当前格为1时，由左、上、左上可扩展的最小边长决定新边长。'],['维护最大面积','更新最大边长，最后平方作为面积。']],time:'O(mn)',space:'O(mn)',input:{matrix:[['1','0','1','0','0'],['1','0','1','1','1'],['1','1','1','1','1'],['1','0','0','1','0']]},expected:4,cases:[{input:{matrix:[['0']]},expected:0},{input:{matrix:[[1,1],[1,1]]},expected:4}],validate:({matrix:g})=>{grid(g);invariant(g.flat().every(v=>[0,1,'0','1'].includes(v)),'格子须为0或1。');},code:`func maximalSquare(matrix [][]byte) int {
    m,n:=len(matrix),len(matrix[0]);dp:=make([][]int,m+1)
    for r:=range dp { dp[r]=make([]int,n+1) };best:=0
    for r:=1;r<=m;r++ { for c:=1;c<=n;c++ {
        if matrix[r-1][c-1]=='1' {
            dp[r][c]=1+min(dp[r-1][c-1],min(dp[r-1][c],dp[r][c-1]))
            best=max(best,dp[r][c])
        }
    } }
    return best*best
}`,solve:({matrix:g},e)=>{
  const m=g.length,n=g[0].length,dp=Array.from({length:m+1},()=>Array(n+1).fill(0));let best=0;
  for(let r=1;r<=m;r++)for(let c=1;c<=n;c++){
    const one=+g[r-1][c-1]===1;
    if(one){dp[r][c]=1+Math.min(dp[r-1][c-1],dp[r-1][c],dp[r][c-1]);best=Math.max(best,dp[r][c]);}
    const deps=one?{'dp[r-1][c-1]':[r-1,c-1],'dp[r-1][c]':[r-1,c],'dp[r][c-1]':[r,c-1]}:{};
    e(matrixDP(dp,'r',r,'c',c,deps),one?'扩展全1正方形':'零格阻断正方形','r、c是带零边界的DP下标，对应输入格matrix[r−1][c−1]。',one?'dp[r][c]=1+min':"if matrix[r-1][c-1]=='1'",{r,c,输入格:g[r-1][c-1],best,最大面积:best*best});
  }
  return best*best;
}});
