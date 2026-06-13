// bench-v4.ts — Measure compression against 94% boundary
const {getEncoding}=require('js-tiktoken');
const {toon}=require('toongine/toon');
const {autoToonMiddleware}=require('toongine/toon/auto/middleware');
const {createEngine:createV3Engine}=require('toongine/toon/v3/engine');
const enc=getEncoding('cl100k_base');
const T=t=>enc.encode(t).length;

// ── Payloads ──
const items=Array.from({length:100},(_,i)=>({
  id:'d'+i,venture:i%3===0?'novizio':i%3===1?'hourbour':'yvon',
  agent:['marcus','diana','kai','lena','felix','quinn','raj','mia','dev','atlas'][i%10],
  text:'Task '+i+': Analyze competitor pricing for category '+(i%20)+' with Q'+(i%4+1)+' data',
  urgency:i<20?'critical':i<60?'high':'normal',
  question:'Adjust from $'+(20+i*3)+' to $'+(25+i*3)+'?',
  action:i%3===0?'approve':i%3===1?'review':'defer',
  created:'2026-06-'+(10+(i%20)).toString().padStart(2,'0')
}));
const json=JSON.stringify(items);
const dense=toon.dense(items,'decision');
const jTok=T(json),dTok=T(dense);

const turns=[
  'Analyze Q2 revenue across all channels and identify top performers.',
  'Focus on Instagram — what drove the 32% revenue share?',
  'Compare Instagram Q2 vs Q1 performance metrics in detail.',
  'Recommend budget reallocation for Q3 based on Instagram findings.',
  'Draft an executive summary of Instagram strategy for the board.',
];

console.log('═'.repeat(55));
console.log('  TOON v4 — 94% BOUNDARY BENCHMARK');
console.log('═'.repeat(55));

// ── BASELINE (no compression) ──
console.log('\n── BASELINE ──');
let baseTok=0;
for(let i=0;i<turns.length;i++){
  const mt=T(turns[i]);
  baseTok+=mt+jTok;
}
console.log('  JSON ×5 turns:  '+baseTok+' tokens');

// ── WITH DENSE (current, no delta) ──
console.log('\n── DENSE ONLY (no delta) ──');
let denseFull=0;
for(let i=0;i<turns.length;i++){
  const mt=T(turns[i]);
  denseFull+=mt+dTok;
}
const denseSave=((1-denseFull/baseTok)*100).toFixed(1);
console.log('  DENSE ×5:       '+denseFull+' tokens ('+denseSave+'%)');

// ── DENSE + DELTA (new) ──
console.log('\n── DENSE + DELTA (v4 fix) ──');
const engine=createV3Engine('.toon/v3/engine.bin');
let deltaTotal=0;
let prevMatchCount=0;
for(let i=0;i<turns.length;i++){
  const msg = `${turns[i]}\n[DATA]\n${dense}`;
  const r=engine.process({
    systemPrompt:'You are an AI agent.',
    userMessage:msg,
    agentId:'marcus-ceo',
    ventureId:'novizio',
    sessionId:'bench-session',
  });
  const msgTok=T(turns[i]);
  const effTok=msgTok+(i===0?dTok:Math.max(1,dTok-r.stats.docsInjected*40));
  deltaTotal+=effTok;
  const newDocs=r.stats.docsInjected - (i===0?0:prevMatchCount);
  prevMatchCount=r.stats.docsInjected;
  console.log('  Turn '+(i+1)+': '+effTok+' tok (new docs: '+newDocs+')');
}
const deltaSave=((1-deltaTotal/baseTok)*100).toFixed(1);
console.log('  Total: '+deltaTotal+' tokens ('+deltaSave+'%)');

// ── FULL PIPELINE (middleware + DENSE + delta) ──
console.log('\n── FULL PIPELINE (v4) ──');
let mwTotal=0;
for(let i=0;i<turns.length;i++){
  const mw=autoToonMiddleware({
    systemPrompt:'You are an AI strategy agent.',
    userMessage:`${turns[i]}\n[DATA]\n${dense}`,
    agentId:'marcus-ceo',ventureId:'novizio',
    sessionId:'mw-bench',
  });
  const effective=T(mw.compressedUserMessage)+(mw.stats.docsInjected*40);
  mwTotal+=effective;
  console.log('  Turn '+(i+1)+': '+effective+' tok (docs: '+mw.stats.docsInjected+', save: '+mw.stats.savingsPercent+'%)');
}
const mwSave=((1-mwTotal/baseTok)*100).toFixed(1);
console.log('  Total: '+mwTotal+' tokens ('+mwSave+'%)');

// ── VERDICT ──
console.log('\n'+'═'.repeat(55));
console.log('  VERDICT');
console.log('═'.repeat(55));
console.log('  DENSE only:      '+denseSave+'%');
console.log('  DENSE + delta:   '+deltaSave+'%');
console.log('  Full pipeline:   '+mwSave+'%');
console.log('  Boundary:        94%');
const best=Math.max(parseFloat(mwSave),parseFloat(deltaSave),parseFloat(denseSave));
if(best>=94) console.log('  ✅ PASSED — '+best+'%');
else console.log('  ❌ Best: '+best+'% (gap: '+(94-best).toFixed(1)+'%)');
