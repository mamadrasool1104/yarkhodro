/* لایه‌ی ذخیره‌سازی نسخه‌دار. UI هرگز مستقیم به localStorage دست نمی‌زند. */
(function(root){
const SCHEMA=3,KEY='yk3',OLD='yk2';
const adapter=(s=>({get:k=>s.getItem(k),set:(k,v)=>s.setItem(k,v),keys:()=>Object.keys(s)}))(root.localStorage||{getItem(){return null},setItem(){},});
const uid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const defaults=()=>({schema:SCHEMA,activeVehicleId:null,settings:{theme:'auto',remindersOn:true,odometerReminder:'7d',warnKmDefault:2000,warnDaysDefault:30},vehicles:[],mechanics:[],visits:[],operations:[],inspections:[],rules:[],reminders:[]});
/* مهاجرت‌ها: هر تابع یک نسخه را به بعدی می‌برد؛ شناسه‌ها حفظ و هیچ رکوردی حذف نمی‌شود. */
const migrations={2(o){const d=defaults();d.activeVehicleId=o.active||null;
 d.vehicles=(o.vehicles||[]).map(v=>({...v,family:(v.model||'').includes('پراید')?'pride':(v.model||'').includes('تیبا')?'tiba':'other',initialOdometer:null,currentOdometer:v.mileage}));
 d.mechanics=(o.techs||[]).map(t=>({id:t.id,name:t.name,shop:t.shop||'',phone:t.phone||'',specialty:t.spec||''}));
 d.visits=(o.visits||[]).map(x=>({...x,mechanicId:x.techId||null,description:'',notes:''}));
 d.operations=(o.ops||[]).map(x=>({...x,mechanicId:x.techId||null,description:x.desc||'',notes:''}));
 d.inspections=(o.ins||[]).map(x=>({...x,description:x.result||'',notes:''}));
 d.rules=Object.entries(o.life||{}).map(([k,l])=>{const[vehicleId,partId]=k.split('|');return{id:uid('r'),vehicleId,partId,intervalKm:l.km||null,intervalMonths:l.months||null,warnKm:null,source:l.src||'ورودی کاربر'}});
 return d}};
function migrate(raw){let d=raw,v=raw.v||raw.schema||1;if(v>SCHEMA)throw new Error('نسخه‌ی داده از برنامه جدیدتر است');while(v<SCHEMA){if(!migrations[v])throw new Error('مهاجرت از نسخه '+v+' تعریف نشده');d=migrations[v](d);v=d.schema}return d}
/* اعتبارسنجی: مشکلات گزارش می‌شوند؛ داده بی‌صدا حذف نمی‌شود. */
function validate(d){const e=[],ids=new Set(),vs=new Set((d.vehicles||[]).map(v=>v.id)),vis=new Set((d.visits||[]).map(v=>v.id));
 ['vehicles','mechanics','visits','operations','inspections','rules','reminders'].forEach(k=>{if(!Array.isArray(d[k]))e.push('فهرست '+k+' نامعتبر است')});if(e.length)return e;
 d.operations.forEach(o=>{if(!vs.has(o.vid))e.push('عملیات '+o.id+' خودرو ندارد');if(o.visitId&&!vis.has(o.visitId))e.push('عملیات '+o.id+' مراجعه ندارد');if(!o.pid)e.push('عملیات '+o.id+' قطعه ندارد');if(!(o.km>=0))e.push('کیلومتر نامعتبر در '+o.id);if(!(o.partCost>=0)||!(o.labor>=0))e.push('هزینه نامعتبر در '+o.id)});
 [...d.vehicles,...d.operations,...d.visits].forEach(x=>{if(ids.has(x.id))e.push('شناسه تکراری '+x.id);ids.add(x.id)});return e}
function load(){const cur=adapter.get(KEY);
 if(cur){try{const d=JSON.parse(cur);return{ok:true,data:migrate(d),migrated:false}}catch(err){return{ok:false,error:'داده‌ی ذخیره‌شده خراب است؛ نسخه‌ی اصلی دست‌نخورده ماند.',raw:cur}}}
 const old=adapter.get(OLD);if(!old)return{ok:true,data:defaults(),migrated:false};
 try{adapter.set('yk2.backup.'+Date.now(),old);/* پشتیبان پیش از مهاجرت */
  const d=migrate(JSON.parse(old)),issues=validate(d);if(issues.length)return{ok:false,error:'مهاجرت متوقف شد: '+issues.join('؛ '),raw:old};
  adapter.set(KEY,JSON.stringify(d));return{ok:true,data:d,migrated:true}}
 catch(err){return{ok:false,error:'مهاجرت ناموفق بود؛ داده‌ی قدیمی دست‌نخورده است. ('+err.message+')',raw:old}}}
function save(d){const issues=validate(d);if(issues.length)return{ok:false,issues};adapter.set(KEY,JSON.stringify(d));return{ok:true}}
const exportAll=d=>JSON.stringify({app:'yarkhodro',...d});
function importAll(text){let d;try{d=migrate(JSON.parse(text))}catch(e){return{ok:false,issues:['فایل پشتیبان معتبر نیست']}}const i=validate(d);return i.length?{ok:false,issues:i}:{ok:true,data:d}}
const api={SCHEMA,defaults,migrate,validate,load,save,exportAll,importAll,uid};
if(typeof module!=='undefined')module.exports=api;else root.YKStore=api;
})(typeof window!=='undefined'?window:globalThis);
