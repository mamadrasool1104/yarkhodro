/* ===== Domain types & constants ===== */
const STATUS={ok:'انجام‌شده',upcoming:'پیش رو',due:'موعد رسیده',overdue:'عقب‌افتاده',unknown:'نامشخص'};
const CATS=['سرویس دوره‌ای','تعمیر','قطعات','روغن و فیلتر','لاستیک','سوخت','بیمه','سایر'];
const USAGE=['شهری','جاده‌ای','ترکیبی','ترافیک سنگین','استفاده کم'];
const fa=n=>Number(n).toLocaleString('fa-IR');
const day=n=>new Date(Date.now()+n*864e5).toISOString();
const dt=d=>d?new Date(d).toLocaleDateString('fa-IR-u-ca-persian',{year:'numeric',month:'long',day:'numeric'}):'—';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ===== Business logic (kept apart from UI; later moves to backend) ===== */
const rules={compute(i,v){const h=v.usage==='ترافیک سنگین'?.5:1,ik=i.intervalKm?Math.round(i.intervalKm*h):null,im=i.intervalMonths?Math.round(i.intervalMonths*h):null;
 const nextKm=ik&&i.lastKm!=null?i.lastKm+ik:null;let nextDate=null;if(im&&i.lastDate){const d=new Date(i.lastDate);d.setMonth(d.getMonth()+im);nextDate=d.toISOString()}
 const rk=nextKm==null?null:nextKm-v.mileage,rd=nextDate==null?null:(new Date(nextDate)-Date.now())/864e5;let status='unknown';
 if(rk!=null||rd!=null){const lv=(rk!=null&&rk<0)||(rd!=null&&rd<0)?3:(rk!=null&&rk<=500)||(rd!=null&&rd<=15)?2:(rk!=null&&rk<=2000)||(rd!=null&&rd<=45)?1:0;status=['ok','upcoming','due','overdue'][lv]}
 return{nextKm,nextDate,status,effKm:ik,effMonths:im}},
 score(tasks){const c=s=>tasks.filter(t=>t.status===s).length;return Math.max(0,Math.min(100,100-c('overdue')*20-c('due')*10-c('upcoming')*3-c('unknown')*1))},
 label(s){return s>=90?['عالی','var(--ok)']:s>=75?['خوب','var(--primary)']:s>=55?['نیازمند توجه','var(--warn)']:['نیازمند بررسی فوری','var(--danger)']}};

/* ===== Mock API layer (swap with REST via API_BASE later) ===== */
const API_BASE='';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function buildItems(modelId,vid,last={}){const m=CATALOG.find(x=>x.id===modelId);return BASE_ITEMS.map(b=>{const l=last[b.key];return{...b,...(m?.overrides?.[b.key]||{}),id:vid+'-'+b.key,lastKm:l?l[0]:null,lastDate:l?day(-l[1]):null}})}
const mkV=(o,last)=>({...o,items:buildItems(o.modelId,o.id,last),records:[],expenses:[]});
let db={user:null,active:'saba',vehicles:[
 mkV({id:'saba',modelId:'saipa-saba',brand:'سایپا',model:'پراید صبا',trim:'',year:1389,engine:'',transmission:'دنده‌ای',mileage:185000,usage:'شهری'},{oil:[181000,50],'oil-filter':[181000,50],plugs:[160000,500],timing:[140000,900]}),
 mkV({id:'pars',modelId:'ikco-pars',brand:'ایران‌خودرو',model:'پژو پارس',trim:'',year:1395,engine:'',transmission:'دنده‌ای',mileage:140000,usage:'ترکیبی'},{timing:[100000,700]})]};
db.vehicles[0].records.push({id:'r1',itemId:'saba-oil',name:'تعویض روغن موتور',date:day(-50),km:181000,cost:3500000,shop:'نمونه',note:''});
db.vehicles[0].expenses.push({id:'e1',cat:'روغن و فیلتر',amount:3500000,date:day(-50)},{id:'e2',cat:'سوخت',amount:600000,date:day(-8)});
db.vehicles[1].expenses.push({id:'e3',cat:'بیمه',amount:5200000,date:day(-60)});
const cur=()=>db.vehicles.find(v=>v.id===db.active);
const api={
 async login(name){await sleep(250);db.user={name};return db.user},
 async snapshot(){await sleep(150);const v=cur();return{user:db.user,vehicle:v,vehicles:db.vehicles,tasks:v.items.map(i=>({...i,...rules.compute(i,v)})),records:[...v.records].sort((a,b)=>b.date.localeCompare(a.date)),expenses:v.expenses}},
 async select(id){db.active=id},
 async addVehicle(d){await sleep(250);const id='v'+Date.now();db.vehicles.push({...d,id,items:buildItems(d.modelId,id),records:[],expenses:[]});db.active=id},
 async saveVehicle(p){await sleep(150);Object.assign(cur(),p)},
 async setPlan({itemId,intervalKm,intervalMonths}){const it=cur().items.find(i=>i.id===itemId);Object.assign(it,{intervalKm,intervalMonths,source:'ورودی کاربر (دفترچه‌ی خودرو)'})},
 async markDone({itemId,km,cost,shop,date}){await sleep(200);const v=cur(),it=v.items.find(i=>i.id===itemId);it.lastKm=km;it.lastDate=date;
  v.records.push({id:'r'+Date.now(),itemId,name:it.name,date,km,cost,shop,note:''});if(cost)v.expenses.push({id:'e'+Date.now(),cat:'سرویس دوره‌ای',amount:cost,date});v.mileage=Math.max(v.mileage,km)},
 async addExpense(e){await sleep(150);cur().expenses.push({id:'e'+Date.now(),...e})},
 notifications:{async list(){return[]}} /* ready for future reminder/notification system */
};

/* ===== UI components ===== */
const badge=s=>`<span class="badge s-${s}">${STATUS[s]}</span>`;
const loading=()=>`<div class="empty" role="status">در حال بارگذاری…</div>`;
const field=(id,label,type='text',val='',extra='')=>`<div class="fld"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" value="${esc(val)}" ${extra}><div class="err" id="${id}-e" aria-live="polite"></div></div>`;
const taskCard=t=>`<div class="row"><div><strong>${esc(t.name)}</strong> ${badge(t.status)}<div class="muted">${t.nextKm?`سررسید: ${fa(t.nextKm)} کیلومتر`:'سررسید مشخص نیست'}${t.nextDate?` · ${dt(t.nextDate)}`:''}</div>${t.note?`<div class="muted">${esc(t.note)}</div>`:''}</div><button class="btn sm" data-act="done" data-id="${t.id}">ثبت انجام سرویس</button></div>`;
const vsel=s=>`<label for="vsel" class="muted">خودروی فعال</label><select id="vsel" style="margin-bottom:10px">${s.vehicles.map(v=>`<option value="${v.id}" ${v.id===s.vehicle.id?'selected':''}>${esc(v.brand)} ${esc(v.model)} · ${fa(v.year)}</option>`).join('')}</select>`;
const NAV=[['dashboard','داشبورد','▦'],['maintenance','سرویس‌ها','⚙'],['history','تاریخچه','☰'],['expenses','هزینه‌ها','◔'],['vehicle','خودرو','⛟']];
function shell(page,body){const links=NAV.map(([h,l,i])=>`<a href="#${h}" class="${page===h?'on':''}"><span aria-hidden="true">${i}</span>${l}</a>`).join('');
 return `<header class="top"><div class="wrap"><a class="logo" href="#dashboard">یارخودرو</a><span class="sp"></span><button class="btn sm" data-act="theme" aria-label="تغییر تم">◐</button><button class="btn sm" data-act="logout">خروج</button></div></header>
 <div class="shell"><nav class="side" aria-label="منو">${links}</nav><main class="main fade">${body}</main></div><nav class="bn" aria-label="منوی پایین">${links}</nav>`}
function publicShell(body){return `<header class="top"><div class="wrap"><a class="logo" href="#home">یارخودرو</a><nav class="nav-l"><a href="#home">خدمات</a><a href="#how">چطور کار می‌کند؟</a><a href="#home">درباره ما</a></nav><span class="sp"></span><a class="btn sm" href="#login">ورود</a><a class="btn sm pri" href="#register">شروع رایگان</a></div></header><main class="fade">${body}</main>
<footer><div class="wrap"><strong class="logo">یارخودرو</strong><a href="#home">درباره یارخودرو</a><a href="#home">حریم خصوصی</a><a href="#home">قوانین</a><a href="#home">تماس با ما</a></div></footer>`}

/* ===== Views ===== */
const views={
home(){return publicShell(`<div class="wrap"><section class="hero"><div><h1>قبل از اینکه خرابی خودرو به خرج بزرگ تبدیل شود، یارخودرو بهت خبر می‌دهد.</h1><p class="muted" style="font-size:18px">نگهداری، سرویس‌ها و وضعیت خودروی خود را یکجا مدیریت کن.</p><div class="cta-row"><a class="btn pri" href="#register">خودرویم را اضافه می‌کنم</a><a class="btn" href="#how">یارخودرو چطور کار می‌کند؟</a></div></div>
 <div class="card" aria-hidden="true"><div class="ring" style="--p:78;--c:var(--warn)"><div>${fa(78)}<small class="muted" style="font-size:12px">نیازمند توجه</small></div></div><div class="row"><span>فیلتر هوا</span>${badge('due')}</div><div class="row"><span>تعویض روغن موتور</span>${badge('upcoming')}</div></div></section>
 <section class="band"><h2>نگهداری خودرو نباید سخت باشد</h2><div class="grid g4">${['فراموش کردن زمان سرویس','گم شدن سابقه تعمیرات','هزینه‌های ناگهانی','بی‌خبر بودن از سرویس‌های مهم'].map(x=>`<div class="card">✗ ${x}</div>`).join('')}</div><p style="margin-top:14px"><strong>یارخودرو اطلاعات خودرو را مرتب می‌کند و زمان اقدامات مهم را به شما یادآوری می‌کند.</strong></p></section>
 <section class="band"><div class="grid g4">${[['داشبورد سلامت خودرو','وضعیت کلی خودرو را در یک نگاه ببین.'],['یادآوری سرویس','زمان سرویس‌های مهم را فراموش نکن.'],['تاریخچه خودرو','سوابق سرویس و تعمیرات را همیشه همراه خود داشته باش.'],['مدیریت هزینه','هزینه‌های نگهداری خودرو را ثبت و بررسی کن.']].map(([a,b])=>`<div class="card"><h3>${a}</h3><p class="muted">${b}</p></div>`).join('')}</div></section>
 <section class="band" id="how"><h2>چطور کار می‌کند؟</h2><div class="grid g4">${['خودرویت را ثبت کن','اطلاعات سرویس و کارکرد را وارد کن','یارخودرو وضعیت خودرو را بررسی می‌کند','اقدامات مهم را به تو یادآوری می‌کند'].map((s,i)=>`<div class="card"><span class="badge s-upcoming">${fa(i+1)}</span><p style="margin-top:8px">${s}</p></div>`).join('')}</div></section>
 <section class="band card" style="text-align:center"><h2>از امروز مراقبت از خودرویت را ساده‌تر کن.</h2><a class="btn pri" href="#register">شروع رایگان</a></section></div>`)},
auth(mode){const reg=mode==='register';return publicShell(`<div class="wrap" style="max-width:440px;padding-top:36px"><form class="card" id="authf" novalidate><h2>${reg?'ساخت حساب':'ورود به یارخودرو'}</h2>${reg?field('name','نام','text','','autocomplete="name"'):''}${field('email','ایمیل','email','','autocomplete="email" dir="ltr"')}${field('pass','رمز عبور','password','','autocomplete="current-password" dir="ltr"')}<button class="btn pri" style="width:100%" type="submit">${reg?'ثبت‌نام':'ورود'}</button><p class="muted" style="margin-top:12px">${reg?'حساب دارید؟ <a href="#login"><u>ورود</u></a>':'حساب ندارید؟ <a href="#register"><u>ثبت‌نام</u></a>'}</p><p class="muted">نسخه‌ی آزمایشی: ورود با احراز هویت نمونه انجام می‌شود.</p></form></div>`)},
async dashboard(){const s=await api.snapshot(),sc=rules.score(s.tasks),[lb,col]=rules.label(sc);
 const urgent=s.tasks.filter(t=>t.status==='overdue'||t.status==='due'),up=s.tasks.filter(t=>t.status==='upcoming'||t.status==='ok').sort((a,b)=>(a.nextKm??1e9)-(b.nextKm??1e9)).slice(0,4);
 return shell('dashboard',`<h2>سلام ${esc(s.user?.name||'دوست عزیز')} 👋</h2><p class="muted">امروز برای خودرویت چه کاری لازم است؟</p>
 <div class="card" style="margin-bottom:14px">${vsel(s)}<strong>${esc(s.vehicle.brand)} ${esc(s.vehicle.model)}</strong> · مدل ${fa(s.vehicle.year)} · ${fa(s.vehicle.mileage)} کیلومتر <button class="btn sm" data-act="km" style="margin-inline-start:8px">به‌روزرسانی کیلومتر</button></div>
 <div class="grid g2"><div class="card" style="text-align:center"><h3>وضعیت خودرو</h3><div class="ring" style="--p:${sc};--c:${col}"><div>${fa(sc)}</div></div><p style="margin-top:8px;font-weight:800;color:${col}">${lb}</p></div>
 <div class="card"><h3>اقدامات مهم</h3>${urgent.length?urgent.map(taskCard).join(''):'<div class="empty">✓ اقدام فوری وجود ندارد.</div>'}</div>
 <div class="card"><h3>سرویس‌های پیش رو</h3>${up.map(taskCard).join('')}</div>
 <div class="card"><h3>آخرین فعالیت‌ها</h3>${s.records.slice(0,3).map(r=>`<div class="row"><span>${esc(r.name)}</span><span class="muted">${dt(r.date)}</span></div>`).join('')||'<div class="empty">هنوز فعالیتی ثبت نشده.</div>'}</div></div>
 <div class="card" style="margin-top:14px"><h3>هزینه‌های نگهداری</h3>${expenseSummary(s.expenses)}</div>`)},
async maintenance(){const s=await api.snapshot(),v=s.vehicle;return shell('maintenance',`<h2>دفترچه‌ی سرویس · ${esc(v.brand)} ${esc(v.model)}</h2><p class="muted">بازه‌ها فقط از منبع ثبت‌شده یا مقداری هستند که خودتان از دفترچه‌ی خودرو وارد می‌کنید. ${v.usage==='ترافیک سنگین'?'چون نوع استفاده «ترافیک سنگین» است، بازه‌ها نصف شده‌اند (توصیه‌ی ایران‌خودرو برای شرایط سخت).':''}</p><div class="card">${s.tasks.map(t=>`<div class="row"><div><strong>${esc(t.name)}</strong> ${badge(t.status)}<div class="muted">${t.effKm||t.effMonths?'بازه: '+[t.effKm&&fa(t.effKm)+' کیلومتر',t.effMonths&&fa(t.effMonths)+' ماه'].filter(Boolean).join(' / '):'بازه‌ی سرویس هنوز تعریف نشده'}</div><div class="muted">آخرین سرویس: ${t.lastKm!=null?fa(t.lastKm)+' کم · ':''}${dt(t.lastDate)}${t.nextKm?' · بعدی: '+fa(t.nextKm)+' کم':''}${t.nextDate?' · '+dt(t.nextDate):''}</div>${t.source?`<div class="muted">منبع: ${esc(t.source)}</div>`:''}${t.note?`<div class="muted">${esc(t.note)}</div>`:''}</div><div class="cta-row" style="margin:0"><button class="btn sm" data-act="interval" data-id="${t.id}">تنظیم بازه</button><button class="btn sm pri" data-act="done" data-id="${t.id}">ثبت انجام</button></div></div>`).join('')}</div>`)},
async history(){const s=await api.snapshot();return shell('history',`<h2>تاریخچه‌ی سرویس‌ها</h2>${s.records.length?`<div class="card scroll"><table style="width:100%;border-collapse:collapse;min-width:520px"><thead><tr style="text-align:right"><th>سرویس</th><th>تاریخ</th><th>کیلومتر</th><th>هزینه (تومان)</th><th>تعمیرگاه</th></tr></thead><tbody>${s.records.map(r=>`<tr style="border-top:1px solid var(--line)"><td>${esc(r.name)}</td><td>${dt(r.date)}</td><td>${fa(r.km)}</td><td>${fa(r.cost||0)}</td><td>${esc(r.shop||'—')}</td></tr>`).join('')}</tbody></table></div><p class="muted">آپلود تصویر فاکتور در نسخه‌های بعدی اضافه می‌شود.</p>`:'<div class="card empty">هنوز سرویسی ثبت نشده است.</div>'}`)},
async expenses(){const s=await api.snapshot();return shell('expenses',`<div class="row" style="border:0"><h2>هزینه‌ها</h2><button class="btn pri sm" data-act="exp">ثبت هزینه</button></div><div class="card">${expenseSummary(s.expenses)}</div><div class="card" style="margin-top:14px">${[...s.expenses].sort((a,b)=>b.date.localeCompare(a.date)).map(e=>`<div class="row"><span>${esc(e.cat)}</span><span class="muted">${dt(e.date)}</span><strong>${fa(e.amount)} تومان</strong></div>`).join('')}</div>`)},
async vehicle(){const s=await api.snapshot(),v=s.vehicle;return shell('vehicle',`<h2>خودروهای من</h2><div class="grid g2">${s.vehicles.map(x=>`<div class="card"><strong>${esc(x.brand)} ${esc(x.model)}</strong> · ${fa(x.year)} ${x.id===v.id?'<span class="badge s-upcoming">فعال</span>':''}<div class="muted">${fa(x.mileage)} کیلومتر · ${esc(x.usage)}</div>${x.id===v.id?'':`<button class="btn sm" style="margin-top:8px" data-act="pick" data-id="${x.id}">انتخاب</button>`}</div>`).join('')}</div><a class="btn pri" style="margin-top:14px" href="#vehicle-new">افزودن خودرو</a>`)},
'vehicle-new'(){const c=CATALOG[0];return shell('vehicle',`<h2>ثبت خودرو</h2><div class="steps" id="steps"><i class="on"></i><i></i><i></i></div><form id="vf" class="card" novalidate><div data-step="0"><label for="modelId">مدل خودرو</label><select id="modelId" name="modelId">${CATALOG.map(m=>`<option value="${m.id}">${esc(m.brand)} ${esc(m.model)}</option>`).join('')}<option value="other">سایر (بدون برنامه‌ی سرویس آماده)</option></select>${field('brand','برند','text',c.brand)}${field('model','مدل','text',c.model)}</div><div data-step="1" hidden>${field('year','سال ساخت (شمسی)','number',c.defaultYear,'inputmode="numeric"')}${field('engine','موتور (اختیاری)','text','','data-opt="1"')}${field('transmission','گیربکس','text','دنده‌ای')}</div><div data-step="2" hidden>${field('mileage','کیلومتر فعلی','number','','inputmode="numeric"')}<label>نوع استفاده</label><div class="chips" id="usage">${USAGE.map((u,i)=>`<button type="button" class="chip ${i===2?'on':''}" data-u="${u}">${u}</button>`).join('')}</div></div><div class="cta-row"><button type="button" class="btn" id="back" hidden>قبلی</button><button type="submit" class="btn pri" id="next">ادامه</button></div></form>`)}
};
function expenseSummary(ex){const now=new Date(),m=ex.filter(e=>{const d=new Date(e.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()}).reduce((a,e)=>a+e.amount,0),y=ex.reduce((a,e)=>a+e.amount,0),by={};ex.forEach(e=>by[e.cat]=(by[e.cat]||0)+e.amount);
 const top=Object.entries(by).sort((a,b)=>b[1]-a[1]),mx=top[0]?.[1]||1;
 return `<div class="grid g4"><div><div class="muted">این ماه</div><strong>${fa(m)}</strong></div><div><div class="muted">این سال</div><strong>${fa(y)}</strong></div><div><div class="muted">میانگین ماهانه</div><strong>${fa(Math.round(y/12))}</strong></div><div><div class="muted">بیشترین دسته</div><strong>${top[0]?esc(top[0][0]):'—'}</strong></div></div><div style="margin-top:14px" role="img" aria-label="نمودار هزینه بر اساس دسته">${top.map(([c,v])=>`<div style="display:grid;grid-template-columns:90px 1fr;gap:8px;align-items:center;margin:6px 0"><span class="muted">${esc(c)}</span><div style="background:var(--line);border-radius:8px;height:14px"><div style="width:${v/mx*100}%;height:14px;border-radius:8px;background:var(--primary)"></div></div></div>`).join('')}</div><p class="muted">مبالغ به تومان</p>`}

/* ===== Router ===== */
const AUTHED=['dashboard','maintenance','history','expenses','vehicle','vehicle-new'];
async function route(){const h=(location.hash||'#home').slice(1)||'home',app=document.getElementById('app');
 if(AUTHED.includes(h)&&!db.user){location.hash='#login';return}
 if(h==='how'){app.innerHTML=views.home();document.getElementById('how')?.scrollIntoView();return}
 let v=h==='login'||h==='register'?()=>views.auth(h):views[h]||views.home;
 app.innerHTML=AUTHED.includes(h)?shell(h,loading()):'';
 try{app.innerHTML=await v();}catch(e){app.innerHTML=`<div class="wrap"><div class="card empty">مشکلی پیش آمد. دوباره تلاش کنید.</div></div>`}
 if(h==='vehicle-new')wizard();window.scrollTo(0,0)}
addEventListener('hashchange',route);

function wizard(){let s=0,usage='ترکیبی';const f=document.getElementById('vf'),st=[...f.querySelectorAll('[data-step]')];
 const show=()=>{st.forEach((x,i)=>x.hidden=i!==s);document.querySelectorAll('#steps i').forEach((x,i)=>x.classList.toggle('on',i<=s));document.getElementById('back').hidden=!s;document.getElementById('next').textContent=s===2?'ذخیره':'ادامه'};
 const sel=f.elements.modelId;sel.onchange=()=>{const m=CATALOG.find(c=>c.id===sel.value);if(m){f.elements.brand.value=m.brand;f.elements.model.value=m.model;f.elements.year.value=m.defaultYear}};
 f.querySelector('#usage').onclick=e=>{const b=e.target.closest('[data-u]');if(!b)return;usage=b.dataset.u;f.querySelectorAll('.chip').forEach(c=>c.classList.toggle('on',c===b))};
 document.getElementById('back').onclick=()=>{s--;show()};
 f.onsubmit=async e=>{e.preventDefault();let ok=true;st[s].querySelectorAll('input').forEach(i=>{const bad=(!i.value.trim()&&!i.dataset.opt)||(i.type==='number'&&i.value&&+i.value<=0);document.getElementById(i.id+'-e').textContent=bad?'این فیلد را درست پر کنید.':'';if(bad)ok=false});if(!ok)return;
  if(s<2){s++;show();return}
  const d=Object.fromEntries(new FormData(f));await api.addVehicle({...d,trim:'',year:+d.year,mileage:+d.mileage,usage});location.hash='#dashboard'}}

/* ===== Events ===== */
document.addEventListener('submit',async e=>{if(e.target.id!=='authf')return;e.preventDefault();const f=e.target;let ok=true;
 const chk=(id,bad,msg)=>{const el=f.elements[id];if(!el)return;document.getElementById(id+'-e').textContent=bad(el.value)?msg:'';if(bad(el.value))ok=false};
 chk('name',v=>!v.trim(),'نام را وارد کنید.');chk('email',v=>!/^\S+@\S+\.\S+$/.test(v),'ایمیل معتبر وارد کنید.');chk('pass',v=>v.length<6,'رمز عبور دست‌کم ۶ نویسه باشد.');
 if(!ok)return;await api.login(f.elements.name?.value.trim()||'کاربر');location.hash=f.elements.name?'#vehicle-new':'#dashboard'});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,dlg=document.getElementById('dlg');
 if(a==='theme'){const r=document.documentElement,dark=r.dataset.theme==='dark'||(!r.dataset.theme&&matchMedia('(prefers-color-scheme:dark)').matches);r.dataset.theme=dark?'light':'dark'}
 if(a==='logout'){db.user=null;location.hash='#home'}
 if(a==='done'){const it=cur().items.find(i=>i.id===b.dataset.id);dlg.innerHTML=`<form id="df" novalidate><h3>ثبت انجام «${esc(it.name)}»</h3>${field('dkm','کیلومتر فعلی','number',cur().mileage)}${field('dcost','هزینه (تومان)','number','0')}${field('dshop','تعمیرگاه')}<div class="cta-row"><button class="btn pri" type="submit">ثبت</button><button class="btn" type="button" data-act="close">انصراف</button></div></form>`;dlg.showModal();
  document.getElementById('df').onsubmit=async ev=>{ev.preventDefault();const km=+dkm.value,cost=+dcost.value||0;if(!(km>0)){document.getElementById('dkm-e').textContent='کیلومتر معتبر وارد کنید.';return}await api.markDone({itemId:it.id,km,cost,shop:dshop.value,date:new Date().toISOString()});dlg.close();route()}}
 if(a==='km'){dlg.innerHTML=`<form id="kf" novalidate><h3>کیلومتر فعلی</h3>${field('nkm','کیلومتر','number',cur().mileage)}<div class="cta-row"><button class="btn pri" type="submit">ذخیره</button><button class="btn" type="button" data-act="close">انصراف</button></div></form>`;dlg.showModal();
  document.getElementById('kf').onsubmit=async ev=>{ev.preventDefault();const k=+nkm.value;if(!(k>0)){document.getElementById('nkm-e').textContent='عدد معتبر وارد کنید.';return}await api.saveVehicle({mileage:k});dlg.close();route()}}
 if(a==='exp'){dlg.innerHTML=`<form id="xf" novalidate><h3>ثبت هزینه</h3><label for="xc">دسته</label><select id="xc">${CATS.map(c=>`<option>${c}</option>`).join('')}</select>${field('xa','مبلغ (تومان)','number','')}<div class="cta-row"><button class="btn pri" type="submit">ثبت</button><button class="btn" type="button" data-act="close">انصراف</button></div></form>`;dlg.showModal();
  document.getElementById('xf').onsubmit=async ev=>{ev.preventDefault();const v=+xa.value;if(!(v>0)){document.getElementById('xa-e').textContent='مبلغ معتبر وارد کنید.';return}await api.addExpense({cat:xc.value,amount:v,date:new Date().toISOString()});dlg.close();route()}}
 if(a==='interval'){const it=cur().items.find(i=>i.id===b.dataset.id);dlg.innerHTML=`<form id="pf" novalidate><h3>بازه‌ی «${esc(it.name)}»</h3><p class="muted">مقدار را از دفترچه‌ی سرویس خودرو وارد کنید.</p>${field('pkm','هر چند کیلومتر','number',it.intervalKm||'')}${field('pmo','هر چند ماه (اختیاری)','number',it.intervalMonths||'')}<div class="cta-row"><button class="btn pri" type="submit">ذخیره</button><button class="btn" type="button" data-act="close">انصراف</button></div></form>`;dlg.showModal();
  document.getElementById('pf').onsubmit=async ev=>{ev.preventDefault();const k=+pkm.value||null,m=+pmo.value||null;if(!k&&!m){document.getElementById('pkm-e').textContent='دست‌کم یکی از دو مقدار را وارد کنید.';return}await api.setPlan({itemId:it.id,intervalKm:k,intervalMonths:m});dlg.close();route()}}
 if(a==='pick'){await api.select(b.dataset.id);route()}
 if(a==='close')dlg.close()});
document.addEventListener('change',async e=>{if(e.target.id==='vsel'){await api.select(e.target.value);route()}});
route();
