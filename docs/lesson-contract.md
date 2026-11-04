# Lesson implementation contract

Continue the new `feat/algorithm-lab` branch. Never inspect or copy old `master` code. User authorized all 150 problems, keeping the accepted design and making structure-specific animations. Root owns shared UI, catalogue metadata, server and kit. Workers own only their assigned module and tests. No Git commits, browser use or server changes by workers.

## Module

Export `lessonsA`, `lessonsB` or `lessonsC`, an array of lesson objects:

```js
{
 id: 27,
 summary: 'Original Chinese task description, including what to return or modify.',
 rule: 'Input assumptions and important rules; concise, accurate Chinese.',
 steps: [ {title:'...',body:'...'}, /* natural number of foundational notes */ ],
 time: 'O(n)', space: 'O(1)',
 input: {nums:[3,2,2,3],val:3},
 expected: {k:2,nums:[2,2]},
 code: 'func removeElement(...) ...', // complete Go solution as a string or line array
 validate(input) {}, // optional, reject unsafe / malformed examples in Chinese
 solve(input,emit) { /* real algorithm; emit meaningful changing states; return actual result */ },
 cases: [ {input:{...}, expected: ...} ] // at least two extra cases, including relevant edge case
}
```

Metadata `id`, title, English title, official category and order are in `src/catalog-data.js`; do not duplicate them. All solutions must be original, complete, correct algorithms, not hardcoded output or a generic slideshow. Give each question its own explanatory steps and Go implementation. Include needed Go imports and helper functions/types, except platform-supplied ListNode / TreeNode / Node declarations. Stateful design problems can use JSON operations arrays and return per-operation results (null for constructor and mutators).

`solve` receives a deep copy of the input. Return the result appropriate to the question. Mutation questions should return the resulting structure (for remove-element / dedup, use `{k,nums:validPrefix}`); stateful operations return their output list. Use small illustrative examples and validate custom inputs to avoid runaway search. Default result must deep-equal `expected`; examples must reflect the problem, not be artificially trivial.

## Trace

Import only needed helpers from `./lesson-kit.js`. `emit(scene,title,description,lines,vars)` records an independent snapshot. `title` / `description` are Chinese. `lines` are accurate 1-based highlighted Go source lines; `vars` is a plain object showing relevant live variables. No DOM, timeouts or browser dependencies. Use `traceLesson(lesson,input)` in tests; it returns `{frames,result}` and automatically adds a final frame. Trace limit is 1600 frames and exceeding it throws explicitly. Emit significant steps inside the actual computation; don't just emit a static input and answer.

Available helpers: `clone(value)`, `invariant(condition,chineseMessage)`, `array(value,name,max=80)`, `numbers(value,name,max=80)` (integers ±1e9), `integer(value,min=0,max=100,name)`, `text(value,name,max=160)`, `matrix(value,name,max=15)` (rectangular), `sorted(value,name)`; `treeFromLevel(values)` -> `{id,val,left,right}`, `treeToLevel(root)`; `treeView(root,options)`, `listView(values,options)`, `graphView(1BasedAdjacency,options)`.

Use these scene schemas, not invented field names:

- Array: `{kind:'array',values:[...],label:'nums',active:[indices],done:[indices],pointers:{i:0,j:2},range:[left,right],secondary:[...],secondaryLabel:'...',bars:true}` (only values is required; remaining fields optional).
- Text: `{kind:'text',text:'abc',active:[indices],range:[left,right],pointers:{left:0},secondary:'...',secondaryActive:[indices]}`.
- Matrix: `{kind:'matrix',matrix:[[...]],active:[[r,c]],done:[[r,c]],rowLabels:[...],colLabels:[...]}`.
- Table / DP: `{kind:'table',columns:['state','value'],rows:[[...],[...]],active:[[r,c]]}`; use a matrix when row/column dependencies matter.
- Tree / graph / linked / trie: `{kind:'tree'|'graph'|'linked'|'trie',nodes:[{id:'0',label:'3'}],edges:[{from:'0',to:'1',label:'L',directed:true}],active:['0'],done:['1']}`. Stable node IDs, not values. Tree edges point parent -> child; renderer handles layout. `treeView(root,{active:['0'],done:['1']})` builds this for binary nodes. `listView(values,{...})` creates sequential IDs; custom edges can show reversal / cycles / random pointers. Root renders arrows for linked and directed graphs.
- Intervals: `{kind:'intervals',intervals:[[start,end],...],active:[rowIndices],done:[rowIndices],points:[number,...]}`.
- Stack: `{kind:'stack',values:[bottom,...,top],active:[topIndex],secondary:[input tokens],secondaryLabel:'输入'}`.
- Bits: `{kind:'bits',values:['00101','00100'],labels:['n','result'],active:[bitIndices]}`.
- Scalar math / auxiliary state: `{kind:'state',items:[['variable',value],...]}`. Do not use this as a substitute for required trees, graphs, matrices or arrays.

`treeFromLevel` follows LeetCode compact level-order null serialization, not heap indices. Never dereference -1 or show a null child as a real node. Duplicated node values must remain distinct. Tree `next` and `random` edges are auxiliary and must not determine parent/child layout.

## Teaching and presentation

The user explicitly rejected a fixed three-horizontal-card template. `getStrategy` selects 1–5 natural steps and six reasoning layouts per problem. `getReasoning` explains why the algorithm works, its invariant/state meaning, and at least two relevant boundaries per problem. Essential diagrams explain real relationships rather than decorating every question uniformly. Pointer labels and expressions must match the Go source. The displayed Go is formatted and source-mapped; short example arrays remain on one line, while actual matrices can use meaningful row breaks.

## Verification

Read the TDD skill as needed. Write meaningful tests before implementation, verify RED, then implement and get GREEN. Test every default example and at least two additional cases per problem. Assert actual result, scene type, more than one meaningful frame on a nontrivial example, and valid line numbers. Add algorithm-specific edge tests where appropriate; don't mirror the algorithm to compute expected outputs. You may run `node --test tests/lessons-X.test.js` independently. Root will run full suite and compile Go code. Ensure Go code and JS algorithm use the same strategy. Send progress at sensible milestones and finish only when every assigned ID exists and tests pass.
