/* قوانین سلامت؛ جدا از UI و با آستانه‌های قابل‌تنظیم. هیچ بازه‌ی جهانی ساختگی ندارد. */
(function(root){
const SEV={unknown:0,healthy:1,check:2,near:3,due:4,overdue:5,urgent:6};
const LABEL={unknown:'نامشخص',healthy:'سالم',check:'نیازمند بررسی',near:'نزدیک به سرویس',due:'سررسید سرویس',overdue:'عقب‌افتاده',urgent:'نیازمند رسیدگی فوری'};
const INS={ok:'healthy',check:'check',worn:'check',repair:'overdue',replace:'overdue',leak:'overdue',urgent:'urgent',unknown:'unknown'};
const worst=l=>l.reduce((a,b)=>SEV[b]>SEV[a]?b:a,'unknown');
/* ورودی: آخرین عملیات، قانون (بازه/منبع کاربر یا کاتالوگ)، آخرین بازدیدها، کیلومتر فعلی */
function partStatus({odometer,lastOp,rule,inspections=[],settings={}}){const out=[];
 if(rule&&rule.intervalKm&&lastOp){const next=lastOp.km+rule.intervalKm,left=next-odometer,warn=rule.warnKm??settings.warnKmDefault??2000;
  out.push(left<0?'overdue':left===0?'due':left<=warn?'near':'healthy')}
 /* هشدار جدی بازدید با بازدید عادی جدیدتر پنهان نمی‌شود مگر بعد از آن عملیات تعمیر/تعویض ثبت شده باشد. */
 inspections.forEach(i=>{const resolved=lastOp&&lastOp.type!=='بازدید'&&lastOp.date>i.date;if(!resolved||INS[i.status]==='healthy'||SEV[INS[i.status]]<SEV.overdue)out.push(INS[i.status]||'unknown');else if(i===inspections[0])out.push('healthy')});
 return worst(out.length?out:['unknown'])}
const assemblyStatus=ss=>{const k=ss.filter(s=>s!=='unknown');return k.length?worst(k):'unknown'};
const api={SEV,LABEL,partStatus,assemblyStatus,worst};
if(typeof module!=='undefined')module.exports=api;else root.YKRules=api;
})(typeof window!=='undefined'?window:globalThis);
