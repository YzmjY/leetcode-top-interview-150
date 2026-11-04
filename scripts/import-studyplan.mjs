import { readFile, writeFile } from 'node:fs/promises';
const source = JSON.parse((await readFile(new URL('../.local/official-plan.json', import.meta.url), 'utf8')).replace(/^\uFEFF/, ''));
const groups = source.data.studyPlanV2Detail.planSubGroups;
const questions = groups.flatMap((group) => group.questions.map((q) => ({id:Number(q.questionFrontendId),title:q.translatedTitle.trim(),en:q.title,slug:q.titleSlug,category:group.name,group:group.slug,difficulty:({EASY:'简单',MEDIUM:'中等',HARD:'困难'})[q.difficulty]}))).map((q,index)=>({...q,ordinal:index+1}));
if(questions.length!==150 || new Set(questions.map(q=>q.id)).size!==150) throw Error('Expected 150 unique official questions');
await writeFile(new URL('../src/catalog-data.js',import.meta.url),`// Source: https://leetcode.cn/studyplan/top-interview-150/ (official GraphQL studyPlanV2Detail)\nexport const catalog = ${JSON.stringify(questions,null,2)};\n`);
console.log(`${questions.length} questions / ${groups.length} groups imported`);
