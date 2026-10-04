import { DAY, stamp } from './analytics.js';
export const category = state => ({new:'pending', proposed:'pending', 'to do':'pending', active:'active', committed:'active', 'in progress':'active', resolved:'active', closed:'done', done:'done', removed:'removed'})[String(state || '').toLowerCase()] || 'unknown';
export function percentile(values, p) {
 if (!values.length) return null;
 const a=[...values].sort((a,b)=>a-b), index=(a.length-1)*p, low=Math.floor(index);
 return a[low]+(a[Math.ceil(index)]-a[low])*(index-low);
}
export function intervals(item, now) {
 if (!item.historyComplete || !item.history?.length) return [];
 const h=item.history.filter(r=>stamp(r.at)!==null).sort((a,b)=>stamp(a.at)-stamp(b.at));
 return h.map((r,n)=>({...r, start:stamp(r.at), end:Math.min(now, stamp(h[n+1]?.at)??now), category:r.category || category(r.state)})).filter(r=>r.end>=r.start);
}
export function flowMetrics(items, now, days=90) {
 const end=Math.floor(now/DAY)*DAY, start=end-(days-1)*DAY;
 const records=items.map(item=>{
  const spans=intervals(item,now), first=spans.find(s=>s.category==='active');
  const last=spans.at(-1);
  // Edits after closing must not move the completion date. Use the start of the final contiguous done run.
  let completion=spans.length-1;
  while(completion>0 && spans[completion].category==='done' && spans[completion-1].category==='done')completion--;
  const closedAt=last?.category==='done'?spans[completion].start:null;
  const done=closedAt!==null && closedAt>=start && closedAt<=now;
  const finish=done?closedAt:now;
  const cycle=done&&first&&finish>=first.start?(finish-first.start)/DAY:null;
  const current=last?.category==='active';
  return {item,spans,cycle,completedAt:done?finish:null,age:current&&first?(now-first.start)/DAY:null,
   blocked:spans.reduce((n,s)=>n+(s.blocked?Math.max(0,Math.min(s.end,now)-Math.max(s.start,start))/DAY:0),0)};
 });
 const cycles=records.filter(r=>r.cycle!==null), p85=percentile(cycles.map(r=>r.cycle),.85);
 const daily=Array.from({length:days},(_,n)=>{
  const at=start+n*DAY, snapshot=Math.min(at+DAY-1,now), row={date:new Date(at).toISOString().slice(0,10),Pendiente:0,WIP:0,Completado:0,Entregados:0,Iniciados:0};
  for(const r of records){const s=r.spans.find(s=>s.start<=snapshot && (snapshot<s.end || s.end===now&&snapshot===now));
   if(s){if(s.category==='pending')row.Pendiente++;if(s.category==='active')row.WIP++;if(s.category==='done')row.Completado++;}
   if(r.completedAt!==null&&r.completedAt>=at&&r.completedAt<at+DAY)row.Entregados++;
   row.Iniciados+=r.spans.filter(s=>s.category==='active'&&s.start>=at&&s.start<at+DAY&&r.spans[r.spans.indexOf(s)-1]?.category!=='active').length;
  }return row;
 });
 let active=0,total=0; const columns={};
 for(const r of records)for(const s of r.spans){const duration=Math.max(0,Math.min(s.end,now)-Math.max(s.start,start))/DAY;columns[s.column||s.state]=(columns[s.column||s.state]||0)+duration;
  if(s.category==='active'){total+=duration;if(!s.blocked && s.columnDone!==true)active+=duration;}}
 return {coverage:records.filter(r=>r.spans.length).length, total:items.length, daily, cycles:cycles.map(r=>({id:r.item.id,title:r.item.title,date:new Date(r.completedAt).toISOString().slice(0,10),days:r.cycle})),
  p50:percentile(cycles.map(r=>r.cycle),.5),p85,p95:percentile(cycles.map(r=>r.cycle),.95),
  averageWip:daily.reduce((n,r)=>n+r.WIP,0)/days,net:daily.reduce((n,r)=>n+r.Iniciados-r.Entregados,0),
  aging:records.filter(r=>r.age!==null).map(r=>({id:r.item.id,title:r.item.title,days:r.age,risk:p85!==null&&r.age>p85})),
  blockedDays:records.reduce((n,r)=>n+r.blocked,0),blockedNow:records.filter(r=>r.spans.at(-1)?.blocked&&r.spans.at(-1)?.category==='active').length,
  efficiency:total?active/total:null, columns:Object.entries(columns).map(([name,days])=>({name,days}))};
}
export function forecast(daily, remaining, now, simulations=1000, random=Math.random) {
 if(!daily.length||!Number.isInteger(remaining)||remaining<1||remaining>100000||!Number.isInteger(simulations)||simulations<1)return null;
 // Sample only complete UTC weeks, including weeks with no deliveries.
 const today=Math.floor(now/DAY)*DAY, monday=today-((new Date(today).getUTCDay()+6)%7)*DAY;
 const weeks=[];
 for(let at=monday-7*DAY;at>=stamp(daily[0]?.date);at-=7*DAY){const rows=daily.filter(r=>stamp(r.date)>=at&&stamp(r.date)<at+7*DAY);if(rows.length===7)weeks.push(rows.reduce((n,r)=>n+r.Entregados,0));}
 if(weeks.length<2||!weeks.some(n=>n>0))return null;
 const runs=[];let censored=0;
 for(let n=0;n<simulations;n++){let left=remaining,w=0;while(left>0&&w<520){left-=weeks[Math.floor(random()*weeks.length)];w++;}if(left>0)censored++;runs.push(left>0?Infinity:w);}
 return {weeks:weeks.length,censored,percentiles:[.5,.85,.95].map(p=>{const w=[...runs].sort((a,b)=>a-b)[Math.ceil(p*simulations)-1];return {p,weeks:Number.isFinite(w)?w:null,date:Number.isFinite(w)?new Date(now+w*7*DAY).toISOString().slice(0,10):null};})};
}
