/* ===== Domain types & constants ===== */
const STATUS={ok:'انجام‌شده',upcoming:'پیش رو',due:'موعد رسیده',overdue:'عقب‌افتاده',unknown:'نامشخص'};
const CATS=['سرویس دوره‌ای','تعمیر','قطعات','روغن و فیلتر','لاستیک','سوخت','بیمه','سایر'];
const USAGE=['شهری','جاده‌ای','ترکیبی','ترافیک سنگین','استفاده کم'];
const fa=n=>Number(n).toLocaleString('fa-IR');
const day=n=>new Date(Date.now()+n*864e5).toISOString();
const dt=d=>d?new Date(d).toLocaleDateString('fa-IR-u-ca-persian',{year:'numeric',month:'long',day:'numeric'}):'—';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ===== Business logic (kept apart from UI; later moves to backend) ===== */
const rules={statusFor(t,km){if(t.nextKm==null)return'unknown';const r=t.nextKm-km;return r<0?'overdue':r<=500?'due':r<=2000?'upcoming':'ok'},
 score(tasks){const c=s=>tasks.filter(t=>t.status===s).length;return Math.max(0,Math.min(100,100-c('overdue')*20-c('due')*10-c('upcoming')*3-c('unknown')*2))},
 label(s){return s>=90?['عالی','var(--ok)']:s>=75?['خوب','var(--primary)']:s>=55?['نیازمند توجه','var(--warn)']:['نیازمند بررسی فوری','var(--danger)']}};

/* ===== Mock API layer (swap with REST via API_BASE later) ===== */
const API_BASE='';
const seed={user:null,
 vehicle:{id:'v1',brand:'پژو',model:'۲۰۶',trim:'تیپ ۵',year:1399,engine:'TU5',transmission:'دنده‌ای',mileage:118000,usage:'ترکیبی'},
 items:[
  {id:'m1',name:'تعویض روغن موتور',interval:7000,lastKm:111500,lastDate:day(-120),nextKm:118500,nextDate:day(20),note:'طبق فاصله‌ی معمول ۷٬۰۰۰ کیلومتر؛ دفترچه‌ی خودرو را ملاک قرار دهید.'},
  {id:'m2',name:'فیلتر هوا',interval:10000,lastKm:108000,lastDate:day(-300),nextKm:118000,nextDate:day(0),note:'فاصله‌ی معمول ۱۰٬۰۰۰ کیلومتر.'},
  {id:'m3',name:'بررسی ترمز',interval:15000,lastKm:102000,lastDate:day(-400),nextKm:117000,nextDate:day(-25),note:'بازدید لنت و دیسک هر ۱۵٬۰۰۰ کیلومتر.'},
  {id:'m4',name:'فیلتر کابین',interval:10000,lastKm:110000,lastDate:day(-200),nextKm:120000,nextDate:day(60),note:''},
  {id:'m5',name:'مایع خنک‌کننده',interval:40000,lastKm:90000,lastDate:day(-700),nextKm:130000,nextDate:day(240),note:''},
  {id:'m6',name:'باتری',interval:null,lastKm:null,lastDate:null,nextKm:null,nextDate:null,note:'سابقه‌ای ثبت نشده است.'}],
 records:[
  {id:'r1',itemId:'m1',name:'تعویض روغن موتور',date:day(-120),km:111500,cost:1450000,shop:'تعمیرگاه مرکزی',note:'روغن ۵W-40'},
  {id:'r2',itemId:'m2',name:'فیلتر هوا',date:day(-300),km:108000,cost:320000,shop:'تعمیرگاه مرکزی',note:''},
  {id:'r3',itemId:'m3',name:'بررسی ترمز',date:day(-400),km:102000,cost:900000,shop:'ترمز پارس',note:'تعویض لنت جلو'}],
 expenses:[
  {id:'e1',cat:'روغن و فیلتر',amount:1450000,date:day(-120)},{id:'e2',cat:'سوخت',amount:600000,date:day(-30)},
  {id:'e3',cat:'بیمه',amount:5200000,date:day(-60)},{id:'e4',cat:'لاستیک',amount:6400000,date:day(-90)},
  {id:'e5',cat:'سوخت',amount:520000,date:day(-8)},{id:'e6',cat:'تعمیر',amount:2100000,date:day(-15)}]};
let db=seed;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const api={
 async login(name){await sleep(250);db.user={name};return db.user},
 async snapshot(){await sleep(150);const v=db.vehicle;const tasks=db.items.map(i=>({...i,status:rules.statusFor(i,v.mileage)}));return{user:db.user,vehicle:v,tasks,records:[...db.records].sort((a,b)=>b.date.localeCompare(a.date)),expenses:db.expenses}},
 async saveVehicle(v){await sleep(250);db.vehicle={...db.vehicle,...v,id:'v1'};return db.vehicle},
 async markDone({itemId,km,cost,shop,date}){await sleep(200);const it=db.items.find(i=>i.id===itemId);it.lastKm=km;it.lastDate=date;if(it.interval){it.nextKm=km+it.interval;it.nextDate=null}else{it.nextKm=null}
  db.records.push({id:'r'+Date.now(),itemId,name:it.name,date,km,cost,shop,note:''});if(cost)db.expenses.push({id:'e'+Date.now(),cat:'سرویس دوره‌ای',amount:cost,date});db.vehicle.mileage=Math.max(db.vehicle.mileage,km)},
 async addExpense(e){await sleep(150);db.expenses.push({id:'e'+Date.now(),...e})},
 notifications:{async list(){return[]}} /* ready for future reminder/notification system */
};

/* ===== UI components ===== */
const badge=s=>`<span class="badge s-${s}">${STATUS[s]}</span>`;
const loading=()=>`<div class="empty" role="status">در حال بارگذاری…</div>`;
const field=(id,label,type='text',val='',extra='')=>`<div class="fld"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" value="${esc(val)}" ${extra}><div class="err" id="${id}-e" aria-live="polite"></div></div>`;
const taskCard=t=>`<div class="row"><div><strong>${esc(t.name)}</strong> ${badge(t.status)}<div class="muted">${t.nextKm?`سررسید: ${fa(t.nextKm)} کیلومتر`:'سررسید مشخص نیست'}${t.nextDate?` · ${dt(t.nextDate)}`:''}</div>${t.note?`<div class="muted">${esc(t.note)}</div>`:''}</div><button class="btn sm" data-act="done" data-id="${t.id}">ثبت انجام سرویس</button></div>`;
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
 <div class="card" style="margin-bottom:14px"><strong>${esc(s.vehicle.brand)} ${esc(s.vehicle.model)} ${esc(s.vehicle.trim)}</strong> · مدل ${fa(s.vehicle.year)} · ${fa(s.vehicle.mileage)} کیلومتر <button class="btn sm" data-act="km" style="margin-inline-start:8px">به‌روزرسانی کیلومتر</button></div>
 <div class="grid g2"><div class="card" style="text-align:center"><h3>وضعیت خودرو</h3><div class="ring" style="--p:${sc};--c:${col}"><div>${fa(sc)}</div></div><p style="margin-top:8px;font-weight:800;color:${col}">${lb}</p></div>
 <div class="card"><h3>اقدامات مهم</h3>${urgent.length?urgent.map(taskCard).join(''):'<div class="empty">✓ اقدام فوری وجود ندارد.</div>'}</div>
 <div class="card"><h3>سرویس‌های پیش رو</h3>${up.map(taskCard).join('')}</div>
 <div class="card"><h3>آخرین فعالیت‌ها</h3>${s.records.slice(0,3).map(r=>`<div class="row"><span>${esc(r.name)}</span><span class="muted">${dt(r.date)}</span></div>`).join('')||'<div class="empty">هنوز فعالیتی ثبت نشده.</div>'}</div></div>
 <div class="card" style="margin-top:14px"><h3>هزینه‌های نگهداری</h3>${expenseSummary(s.expenses)}</div>`)},
async maintenance(){const s=await api.snapshot();return shell('maintenance',`<h2>مدیریت سرویس‌ها</h2><p class="muted">توصیه‌ها بر اساس فاصله‌ی معمول سرویس و کیلومتر ثبت‌شده هستند؛ برای مقدار قطعی به دفترچه‌ی خودرو مراجعه کنید.</p><div class="card">${s.tasks.map(t=>`<div class="row"><div><strong>${esc(t.name)}</strong> ${badge(t.status)}<div class="muted">آخرین سرویس: ${dt(t.lastDate)}${t.lastKm?` (${fa(t.lastKm)} کم)`:''}</div><div class="muted">سرویس بعدی: ${t.nextKm?fa(t.nextKm)+' کیلومتر':'—'}${t.nextDate?' · '+dt(t.nextDate):''}</div></div><button class="btn sm" data-act="done" data-id="${t.id}">ثبت انجام سرویس</button></div>`).join('')}</div>`)},
async history(){const s=await api.snapshot();return shell('history',`<h2>تاریخچه‌ی سرویس‌ها</h2>${s.records.length?`<div class="card scroll"><table style="width:100%;border-collapse:collapse;min-width:520px"><thead><tr style="text-align:right"><th>سرویس</th><th>تاریخ</th><th>کیلومتر</th><th>هزینه (تومان)</th><th>تعمیرگاه</th></tr></thead><tbody>${s.records.map(r=>`<tr style="border-top:1px solid var(--line)"><td>${esc(r.name)}</td><td>${dt(r.date)}</td><td>${fa(r.km)}</td><td>${fa(r.cost||0)}</td><td>${esc(r.shop||'—')}</td></tr>`).join('')}</tbody></table></div><p class="muted">آپلود تصویر فاکتور در نسخه‌های بعدی اضافه می‌شود.</p>`:'<div class="card empty">هنوز سرویسی ثبت نشده است.</div>'}`)},
async expenses(){const s=await api.snapshot();return shell('expenses',`<div class="row" style="border:0"><h2>هزینه‌ها</h2><button class="btn pri sm" data-act="exp">ثبت هزینه</button></div><div class="card">${expenseSummary(s.expenses)}</div><div class="card" style="margin-top:14px">${[...s.expenses].sort((a,b)=>b.date.localeCompare(a.date)).map(e=>`<div class="row"><span>${esc(e.cat)}</span><span class="muted">${dt(e.date)}</span><strong>${fa(e.amount)} تومان</strong></div>`).join('')}</div>`)},
async vehicle(){const s=await api.snapshot(),v=s.vehicle;return shell('vehicle',`<h2>پروفایل خودرو</h2><div class="card">${[['برند',v.brand],['مدل',v.model],['تیپ',v.trim],['سال ساخت',fa(v.year)],['موتور',v.engine],['گیربکس',v.transmission],['کیلومتر',fa(v.mileage)],['نوع استفاده',v.usage]].map(([a,b])=>`<div class="row"><span class="muted">${a}</span><strong>${esc(b)}</strong></div>`).join('')}</div><a class="btn pri" style="margin-top:14px" href="#vehicle-new">ویرایش / افزودن خودرو</a>`)},
'vehicle-new'(){return shell('vehicle',`<h2>ثبت خودرو</h2><div class="steps" id="steps"><i class="on"></i><i></i><i></i></div><form id="vf" class="card" novalidate><div data-step="0">${field('brand','برند','text','پژو')}${field('model','مدل','text','۲۰۶')}${field('trim','تیپ','text','تیپ ۵')}</div><div data-step="1" hidden>${field('year','سال ساخت (شمسی)','number','1399','inputmode="numeric"')}${field('engine','موتور','text','TU5')}${field('transmission','گیربکس','text','دنده‌ای')}</div><div data-step="2" hidden>${field('mileage','کیلومتر فعلی','number','118000','inputmode="numeric"')}<label>نوع استفاده</label><div class="chips" id="usage">${USAGE.map((u,i)=>`<button type="button" class="chip ${i===2?'on':''}" data-u="${u}">${u}</button>`).join('')}</div></div><div class="cta-row"><button type="button" class="btn" id="back" hidden>قبلی</button><button type="submit" class="btn pri" id="next">ادامه</button></div></form>`)}
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
 f.querySelector('#usage').onclick=e=>{const b=e.target.closest('[data-u]');if(!b)return;usage=b.dataset.u;f.querySelectorAll('.chip').forEach(c=>c.classList.toggle('on',c===b))};
 document.getElementById('back').onclick=()=>{s--;show()};
 f.onsubmit=async e=>{e.preventDefault();let ok=true;st[s].querySelectorAll('input').forEach(i=>{const bad=!i.value.trim()||(i.type==='number'&&(+i.value<=0));document.getElementById(i.id+'-e').textContent=bad?'این فیلد را درست پر کنید.':'';if(bad)ok=false});if(!ok)return;
  if(s<2){s++;show();return}
  const d=Object.fromEntries(new FormData(f));await api.saveVehicle({...d,year:+d.year,mileage:+d.mileage,usage});location.hash='#dashboard'}}

/* ===== Events ===== */
document.addEventListener('submit',async e=>{if(e.target.id!=='authf')return;e.preventDefault();const f=e.target;let ok=true;
 const chk=(id,bad,msg)=>{const el=f.elements[id];if(!el)return;document.getElementById(id+'-e').textContent=bad(el.value)?msg:'';if(bad(el.value))ok=false};
 chk('name',v=>!v.trim(),'نام را وارد کنید.');chk('email',v=>!/^\S+@\S+\.\S+$/.test(v),'ایمیل معتبر وارد کنید.');chk('pass',v=>v.length<6,'رمز عبور دست‌کم ۶ نویسه باشد.');
 if(!ok)return;await api.login(f.elements.name?.value.trim()||'کاربر');location.hash=f.elements.name?'#vehicle-new':'#dashboard'});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,dlg=document.getElementById('dlg');
 if(a==='theme'){const r=document.documentElement,dark=r.dataset.theme==='dark'||(!r.dataset.theme&&matchMedia('(prefers-color-scheme:dark)').matches);r.dataset.theme=dark?'light':'dark'}
 if(a==='logout'){db.user=null;location.hash='#home'}
 if(a==='done'){const it=db.items.find(i=>i.id===b.dataset.id);dlg.innerHTML=`<form id="df" novalidate><h3>ثبت انجام «${esc(it.name)}»</h3>${field('dkm','کیلومتر فعلی','number',db.vehicle.mileage)}${field('dcost','هزینه (تومان)','number','0')}${field('dshop','تعمیرگاه')}<div class="cta-row"><button class="btn pri" type="submit">ثبت</button><button class="btn" type="button" data-act="close">انصراف</button></div></form>`;dlg.showModal();
  document.getElementById('df').onsubmit=async ev=>{ev.preventDefault();const km=+dkm.value,cost=+dcost.value||0;if(!(km>0)){document.getElementById('dkm-e').textContent='کیلومتر معتبر وارد کنید.';return}await api.markDone({itemId:it.id,km,cost,shop:dshop.value,date:new Date().toISOString()});dlg.close();route()}}
 if(a==='km'){dlg.innerHTML=`<form id="kf" novalidate><h3>کیلومتر فعلی</h3>${field('nkm','کیلومتر','number',db.vehicle.mileage)}<div class="cta-row"><button class="btn pri" type="submit">ذخیره</button><button class="btn" type="button" data-act="close">انصراف</button></div></form>`;dlg.showModal();
  document.getElementById('kf').onsubmit=async ev=>{ev.preventDefault();const k=+nkm.value;if(!(k>0)){document.getElementById('nkm-e').textContent='عدد معتبر وارد کنید.';return}await api.saveVehicle({mileage:k});dlg.close();route()}}
 if(a==='exp'){dlg.innerHTML=`<form id="xf" novalidate><h3>ثبت هزینه</h3><label for="xc">دسته</label><select id="xc">${CATS.map(c=>`<option>${c}</option>`).join('')}</select>${field('xa','مبلغ (تومان)','number','')}<div class="cta-row"><button class="btn pri" type="submit">ثبت</button><button class="btn" type="button" data-act="close">انصراف</button></div></form>`;dlg.showModal();
  document.getElementById('xf').onsubmit=async ev=>{ev.preventDefault();const v=+xa.value;if(!(v>0)){document.getElementById('xa-e').textContent='مبلغ معتبر وارد کنید.';return}await api.addExpense({cat:xc.value,amount:v,date:new Date().toISOString()});dlg.close();route()}}
 if(a==='close')dlg.close()});
route();
