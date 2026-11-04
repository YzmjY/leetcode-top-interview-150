import test from 'node:test';
import assert from 'node:assert/strict';
import {getLesson} from '../src/lessons.js';
import {traceLesson} from '../src/lesson-kit.js';
test('数独拒绝混用数字和字符，避免画面重复1却判为有效',()=>{const board=Array.from({length:9},()=>Array(9).fill('.'));board[0][0]='1';board[0][1]=1;assert.throws(()=>traceLesson(getLesson(36),{board}),/字符|字符串|数独/);});
test('累计比值溢出给出错误，不能静默显示为null',()=>{assert.throws(()=>traceLesson(getLesson(399),{equations:[['a','b'],['b','c'],['c','d']],values:[1e308,1e308,1e-308],queries:[['a','d']]}),/范围|有限|数值/);});
