const $=s=>document.querySelector(s),app=$('#app');
const fa=n=>Number(n||0).toLocaleString('fa-IR');
const df=d=>d?new Date(d).toLocaleDateString('fa-IR'):'—';
const today=()=>new Date().toISOString().slice(0,10);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let DB={car:null,cars:{}};try{DB=JSON.parse(localStorage.getItem('yk3'))||DB}catch(e){}
const save=()=>{try{localStorage.setItem('yk3',JSON.stringify(DB))}catch(e){}};
const car=()=>CARS.find(c=>c.id==DB.car);
const D=()=>DB.cars[DB.car]??={km:0,parts:{},insp:[],recs:[]};
let V=DB.car?'home':'sel',Q='';
const go=v=>{V=v;draw();scrollTo(0,0)};
const head=(t,back='home')=>`<div class="bar"><button class="btn g s" onclick="go('${back}')">‹ بازگشت</button><h1>${t}</h1></div>`;
function st(p){ // وضعیت سرویس
  const l=D().parts[p[0]];if(!l)return{k:'none',t:'ثبت نشده'};
  const rk=p[4]?l.km+p[4]-D().km:null,rd=p[5]?Math.round((new Date(l.date).getTime()+p[5]*30.4*864e5-Date.now())/864e5):null;
  const late=(rk!==null&&rk<0)||(rd!==null&&rd<0),near=(rk!==null&&rk<=p[4]*.15)||(rd!==null&&rd<=30);
  const txt=[rk!==null?(rk<0?fa(-rk)+' کیلومتر گذشته':fa(rk)+' کیلومتر مانده'):'',rd!==null?(rd<0?fa(-rd)+' روز گذشته':fa(rd)+' روز مانده'):''].filter(Boolean).join(' • ');
  return{k:late?'bad':near?'warn':'ok',t:late?'عقب‌افتاده':near?'نزدیک موعد':'سالم',d:txt,l};
}
const tag=s=>`<span class="tag ${s.k}">${s.t}</span>`;
function sel(){return`<h1>به یارخودرو خوش آمدید</h1><p class="mu">خودروی خود را انتخاب کنید</p>`+CARS.map(c=>`<button class="big" onclick="pick('${c.id}')"><span class="e">${c.e}</span><b>${c.name}</b><span class="mu">مدل ${c.year}</span></button>`).join('')+`<div class="ft"><button class="btn g s" onclick="imp.click()">بازیابی نسخه پشتیبان</button></div>`}
function pick(id){DB.car=id;save();go('home')}
function home(){const c=car(),d=D(),late=P.filter(p=>st(p).k=='bad').length;
return`<div class="top"><p>سلام، <b>${esc(DB.name||'راننده عزیز')}</b></p><h1>یارخودرو</h1><p>دفترچه سلامت ${c.name} ${c.year}</p><div class="chips"><span>⭐ ${fa(score())}</span><span>🏅 ${fa(medals().filter(m=>m[2]).length)}</span><span>🛣️ ${fa(d.km)} کیلومتر</span></div><button class="start" onclick="go('insp')">شروع بازدید خودرو<small>${fa(health())}٪ سالم</small></button><div class="daily" onclick="go('serv')"><b>یادآور امروز 🔥</b><span>${late?fa(late)+' سرویس عقب‌افتاده دارید':'همه سرویس‌ها به‌روزند'}</span></div></div>
<div class="card row"><span>کیلومتر فعلی</span><span class="row"><b>${fa(d.km)}</b><button class="btn s" onclick="setKm()">ثبت</button></span></div>
<div class="grid">
<button class="win w1" onclick="go('insp')"><span class="e">🚗</span><b>بازدید خودرو</b><span>${d.insp.length?'آخرین: '+df(d.insp[0].date):'هنوز ثبت نشده'}</span></button>
<button class="win w2" onclick="go('serv')"><span class="e">📅⏱️</span><b>سرویس‌ها</b><span>${late?fa(late)+' مورد عقب‌افتاده':'همه به‌روز'}</span></button>
<button class="win w3" onclick="go('recs')"><span class="e">📋</span><b>سوابق خودرو</b><span>${fa(d.recs.length)} مراجعه</span></button>
<button class="win w4" onclick="go('parts')"><span class="e">⚙️</span><b>قطعات خودرو</b><span>${fa(P.length)} قطعه</span></button></div>
`}
function setKm(){const v=prompt('کیلومتر فعلی را وارد کنید:',D().km);if(v===null)return;const n=parseInt(String(v).replace(/[۰-۹]/g,x=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(x)),10);if(isNaN(n)||n<0)return alert('عدد معتبر وارد کنید');D().km=n;save();draw()}
function insp(){const d=D(),l=d.insp[0];
return head('بازدید خودرو')+`<div class="card"><label>تاریخ</label><input type="date" id="idt" value="${today()}"><label>کیلومتر</label><input type="number" id="ikm" value="${d.km}"></div>`+
P.map(p=>`<div class="card"><b>${p[1]}</b><div class="seg" style="margin:6px 0"><label><input type="radio" name="s_${p[0]}" value="ok" checked><span>✔ سالم</span></label><label class="b"><input type="radio" name="s_${p[0]}" value="chk"><span>⚠ نیازمند بررسی</span></label></div><input id="n_${p[0]}" placeholder="ایراد / توضیحات"></div>`).join('')+
`<button class="btn" style="width:100%" onclick="saveInsp()">ثبت بازدید</button>`+(l?`<h2>آخرین نتیجه (${df(l.date)}، ${fa(l.km)} کیلومتر)</h2>`+(P.filter(p=>l.items[p[0]]?.s=='chk').map(p=>`<div class="card"><span class="tag warn">نیازمند رسیدگی</span> <b>${p[1]}</b><p class="mu">${esc(l.items[p[0]].n)}</p></div>`).join('')||'<p class="mu">همه موارد سالم بود.</p>'):'')}
function saveInsp(){const d=D(),km=+$('#ikm').value||0,items={};P.forEach(p=>items[p[0]]={s:document.querySelector(`input[name=s_${p[0]}]:checked`).value,n:$('#n_'+p[0]).value});
d.insp.unshift({date:$('#idt').value||today(),km,items});d.km=Math.max(d.km,km);save();go('insp')}
function serv(){const o={bad:[],warn:[],ok:[],none:[]};P.forEach(p=>o[st(p).k].push(p));
const grp=(t,k)=>o[k].length?`<h2>${t}</h2>`+o[k].map(p=>{const s=st(p);return`<div class="card"><div class="row"><b>${p[1]}</b>${tag(s)}</div><p class="mu">${s.d||'اولین سرویس را ثبت کنید'}</p><div class="row"><span class="mu">${s.l?'آخرین: '+df(s.l.date)+' / '+fa(s.l.km)+' کیلومتر':''}</span><button class="btn s" onclick="done('${p[0]}')">ثبت انجام سرویس</button></div></div>`}).join(''):'';
return head('سرویس‌ها')+`<div class="card row"><span>کیلومتر فعلی: <b>${fa(D().km)}</b></span><button class="btn s" onclick="setKm()">ثبت</button></div>`+grp('عقب‌افتاده','bad')+grp('نزدیک موعد','warn')+grp('سالم','ok')+grp('ثبت نشده','none')+`<p class="mu">فواصل سرویس پیشنهادی است؛ با دفترچه رسمی خودرو تطبیق دهید.</p>`}
function done(id){const d=D();if(!d.km&&!confirm('کیلومتر فعلی ثبت نشده است. ادامه می‌دهید؟'))return;
d.parts[id]={km:d.km,date:today()};d.recs.unshift({id:Date.now(),date:today(),km:d.km,garage:'',notes:'ثبت از بخش سرویس‌ها',items:[{pid:id,act:'replace',price:0}],labor:0});save();draw()}
const ACT={replace:'تعویض',repair:'تعمیر',inspect:'بازدید'};
function recs(){const q=Q.trim(),d=D();
const L=d.recs.filter(r=>!q||JSON.stringify([r.garage,r.notes,r.items.map(i=>part(i.pid)?.[1])]).includes(q));
return head('سوابق خودرو')+`<button class="btn" style="width:100%" onclick="go('add')">+ ثبت مراجعه جدید</button><input placeholder="جست‌وجو در سوابق…" value="${esc(Q)}" oninput="Q=this.value;$('#rl').innerHTML=rl()" style="margin-top:10px"><div id="rl">${rl()}</div>`}
function rl(){const q=Q.trim();const L=D().recs.filter(r=>!q||JSON.stringify([r.garage,r.notes,r.items.map(i=>part(i.pid)?.[1])]).includes(q));
return L.map(r=>{const tot=r.items.reduce((a,i)=>a+(+i.price||0),0)+(+r.labor||0);return`<div class="card"><div class="row"><b>${df(r.date)}</b><span class="mu">${fa(r.km)} کیلومتر</span></div>${r.garage?`<p class="mu">تعمیرگاه: ${esc(r.garage)}</p>`:''}<p>${r.items.map(i=>`${ACT[i.act]} ${part(i.pid)?.[1]}${+i.price?' ('+fa(i.price)+' ت)':''}`).join('، ')}</p>${r.notes?`<p class="mu">${esc(r.notes)}</p>`:''}<div class="row"><span class="mu">جمع: ${fa(tot)} تومان</span><button class="btn g s" onclick="delRec(${r.id})">حذف</button></div></div>`}).join('')||'<p class="mu">مراجعه‌ای پیدا نشد.</p>'}
function delRec(id){if(!confirm('این مراجعه حذف شود؟ وضعیت قطعات تغییر نمی‌کند.'))return;D().recs=D().recs.filter(r=>r.id!=id);save();draw()}
function add(){return head('ثبت مراجعه','recs')+`<div class="card"><label>تاریخ</label><input type="date" id="rdt" value="${today()}"><label>کیلومتر</label><input type="number" id="rkm" value="${D().km}"><label>نام تعمیرکار / تعمیرگاه</label><input id="rg"><label>اجرت کل (تومان)</label><input type="number" id="rlb" value="0"><label>توضیحات</label><textarea id="rn" rows="2"></textarea></div><h2>قطعات این مراجعه</h2><div id="rows"></div><button class="btn g" onclick="addRow()">+ افزودن قطعه</button><button class="btn" style="width:100%;margin-top:14px" onclick="saveRec()">ذخیره مراجعه</button>`}
function addRow(){const d=document.createElement('div');d.className='card row-i';d.innerHTML=`<select class="rp">${P.map(p=>`<option value="${p[0]}">${p[1]}</option>`).join('')}</select><select class="ra">${Object.entries(ACT).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select><input class="rc" type="number" placeholder="قیمت قطعه (تومان)">`;$('#rows').appendChild(d)}
function saveRec(){const items=[...document.querySelectorAll('.row-i')].map(r=>({pid:r.querySelector('.rp').value,act:r.querySelector('.ra').value,price:+r.querySelector('.rc').value||0}));
if(!items.length)return alert('حداقل یک قطعه اضافه کنید');const d=D(),date=$('#rdt').value||today(),km=+$('#rkm').value||0;
items.forEach(i=>{if(i.act=='replace')d.parts[i.pid]={km,date}});d.km=Math.max(d.km,km);
d.recs.unshift({id:Date.now(),date,km,garage:$('#rg').value,notes:$('#rn').value,items,labor:+$('#rlb').value||0});d.recs.sort((a,b)=>b.date.localeCompare(a.date));save();go('recs')}
function parts(){const cats=[...new Set(P.map(p=>p[2]))];
return head('قطعات خودرو')+cats.map(c=>`<h2>${c}</h2>`+P.filter(p=>p[2]==c).map(p=>{const s=st(p);return`<div class="card"><div class="row"><b>${p[1]}</b>${tag(s)}</div><p class="mu">${p[3]}</p><p class="mu">عمر مفید تقریبی: ${p[4]?fa(p[4])+' کیلومتر یا ':''}${fa(p[5])} ماه</p><p class="mu">آخرین تغییر: ${s.l?df(s.l.date)+' / '+fa(s.l.km)+' کیلومتر':'ثبت نشده'}</p><details><summary>نشانه‌های خرابی</summary><p>${p[6]}</p></details></div>`}).join('')).join('')+`<p class="mu">اطلاعات پیشنهادی است و با منابع فنی همان خودرو باید تأیید شود.</p>`}
function exp(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(DB)],{type:'application/json'}));a.download='yarkhodro-backup.json';a.click()}
const imp=Object.assign(document.createElement('input'),{type:'file',accept:'.json',hidden:true,onchange(){const f=this.files[0];if(!f)return;f.text().then(t=>{try{const j=JSON.parse(t);if(!j.cars)throw 0;DB=j;save();V=DB.car?'home':'sel';draw()}catch(e){alert('فایل پشتیبان معتبر نیست')}})}});
document.body.appendChild(imp);
const tracked=()=>P.filter(p=>st(p).k!='none');
const health=()=>{const t=tracked();return t.length?Math.round(100*t.filter(p=>st(p).k!='bad').length/t.length):0};
const score=()=>D().recs.length*10+D().insp.length*20+tracked().filter(p=>st(p).k!='bad').length*5;
const medals=()=>{const d=D();return[['🛣️','کیلومتر ثبت‌شده',d.km>0,'کیلومتر فعلی را وارد کن'],['🔍','اولین بازدید',d.insp.length>0,'یک بازدید ثبت کن'],['🛠️','اولین سرویس',Object.keys(d.parts).length>0,'یک سرویس یا تعویض ثبت کن'],['📋','پرونده‌دار',d.recs.length>=5,'۵ مراجعه ثبت کن'],['✅','خودروی به‌روز',Object.keys(d.parts).length>=5&&P.every(p=>st(p).k!='bad'),'حداقل ۵ قطعه ثبت‌شده و بدون سرویس عقب‌افتاده']]};
function ach(){const m=medals(),n=m.filter(x=>x[2]).length;return`<h1>افتخارات</h1><p class="mu">هر مدال یک هدف دارد؛ یکی‌یکی بازشان کن.</p><div class="card"><div class="row"><b>${fa(n)} از ${fa(m.length)} مدال</b><span>⭐ ${fa(score())}</span></div><div class="bar2"><i style="width:${n/m.length*100}%"></i></div></div>`+m.map(x=>`<div class="card medal ${x[2]?'':'lock'}"><span class="e">${x[0]}</span><div><b>${x[1]}</b><p class="mu">${x[3]}</p></div></div>`).join('')}
function prof(){const c=car(),d=D();return`<h1>پروفایل</h1><div class="card"><div class="row"><b>${esc(DB.name||'راننده عزیز')}</b><button class="btn g s" onclick="setName()">✏️ تغییر نام</button></div><div class="row"><span class="mu">${c.name} ${c.year}</span><button class="btn g s" onclick="go('sel')">تغییر خودرو</button></div></div><div class="stat"><div class="card"><b>${fa(score())}</b>ستاره</div><div class="card"><b>${fa(medals().filter(m=>m[2]).length)}</b>مدال</div><div class="card"><b>${fa(d.recs.length)}</b>مراجعه ثبت‌شده</div><div class="card"><b>${fa(d.insp.length)}</b>بازدید</div></div><h2>سلامت کلی</h2><div class="card"><div class="row"><span>${fa(tracked().length)} از ${fa(P.length)} قطعه ثبت شده</span><b>${fa(health())}٪</b></div><div class="bar2"><i style="width:${health()}%"></i></div></div><div class="ft"><button class="btn g s" onclick="exp()">پشتیبان‌گیری</button><button class="btn g s" onclick="imp.click()">بازیابی</button></div>`}
function setName(){const v=prompt('نامی که می‌خواهی در برنامه دیده شود:',DB.name||'');if(v===null)return;DB.name=v.trim().slice(0,30);save();draw()}
const NAV=[['home','🏠','خانه'],['serv','📅','سرویس‌ها'],['ach','🏅','افتخارات'],['prof','👤','پروفایل']],TAB={insp:'home',recs:'home',add:'home',parts:'home'};
function draw(){app.innerHTML=({sel,home,insp,serv,recs,add,parts,ach,prof})[V]()+(V=='sel'?'':`<nav>${NAV.map(n=>`<button class="${(TAB[V]||V)==n[0]?'on':''}" onclick="go('${n[0]}')"><b>${n[1]}</b>${n[2]}</button>`).join('')}</nav>`);if(V=='add')addRow()}
draw();
