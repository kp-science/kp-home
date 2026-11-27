/* เครื่องยนต์เกมฝึกทำโจทย์ KP Science — ใช้ร่วมกันทุกหัวข้อ
   หน้าหนึ่งโหลด drill.js แล้วตามด้วยไฟล์ข้อมูลหัวข้อ จากนั้นเรียก DRILL.start(TOPIC)
   กติกาความชำนาญอยู่ที่ตัวแปร RULE ด้านล่าง */
(function(){
"use strict";
let LEVELS = [], T = [], FIGS = {};

const U = {N:'N', NM:'N·m', M:'m', CM:'cm', KG:'kg', X:'เท่า'};
const UNITS = ['N','N·m','m','cm','kg','เท่า'];
const CCW = 'ทวนเข็มนาฬิกา', CW = 'ตามเข็มนาฬิกา';


/* ======================================================================
   รูปคาน — ใช้ข้อตกลงการวาดเดียวกับเล่มเรียน (ต้นฉบับ/fig.py)
   คานครีม · ลิ่มเทา · ลูกศรแรงส้ม · เส้นบอกระยะเขียว · หุ่นเส้นคน
   ====================================================================== */
const FW=340, FX0=44, FX1=296;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const n1=v=>Math.round(v*10)/10;

const G={
 svg:(w,h,b)=>'<svg class="figsvg" viewBox="0 0 '+w+' '+h+'" xmlns="http://www.w3.org/2000/svg" role="img">'+
   '<defs>'+
   '<marker id="ad" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="fd"/></marker>'+
   '<marker id="af" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="ff"/></marker>'+
   '<marker id="ak" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="fk"/></marker>'+
   '</defs>'+b+'</svg>',
 t:(x,y,s,size,cls,anchor,weight)=>'<text x="'+n1(x)+'" y="'+n1(y)+'" font-size="'+(size||10.5)+'" class="'+(cls||'ft')+'" text-anchor="'+(anchor||'middle')+'" font-weight="'+(weight||'400')+'">'+esc(s)+'</text>',
 beam:(x,y,w,h)=>'<rect x="'+n1(x)+'" y="'+n1(y)+'" width="'+n1(w)+'" height="'+h+'" rx="2" class="fbeam"/>',
 ful:(cx,yt)=>'<path d="M'+n1(cx)+','+n1(yt)+' L'+n1(cx-13)+','+n1(yt+19)+' L'+n1(cx+13)+','+n1(yt+19)+' z" class="fful"/>',
 hang:(cx,yt,lab)=>{const yb=yt+24;return '<line x1="'+n1(cx)+'" y1="'+n1(yt)+'" x2="'+n1(cx)+'" y2="'+n1(yb)+'" class="fkl"/>'+
   '<rect x="'+n1(cx-25)+'" y="'+n1(yb)+'" width="50" height="21" rx="3" class="fbox"/>'+G.t(cx,yb+14.5,lab,10.5,'fbt')},
 force:(x,y1,y2,lab,side)=>'<line x1="'+n1(x)+'" y1="'+n1(y1)+'" x2="'+n1(x)+'" y2="'+n1(y2)+'" class="ffl" marker-end="url(#af)"/>'+
   G.t(x+(side==='l'?-7:7),(y1+y2)/2+4,lab,10.5,'ff2',side==='l'?'end':'start','700'),
 ang:(x,y,dx,dy,lab)=>'<line x1="'+n1(x)+'" y1="'+n1(y)+'" x2="'+n1(x+dx)+'" y2="'+n1(y+dy)+'" class="ffl" marker-end="url(#af)"/>'+
   G.t(x+dx+(dx<0?-8:8),y+dy+4,lab,10.5,'ff2',dx<0?'end':'start','700'),
 dim:(x1,x2,y,lab)=>'<line x1="'+n1(x1)+'" y1="'+n1(y)+'" x2="'+n1(x2)+'" y2="'+n1(y)+'" class="fdl" marker-start="url(#ad)" marker-end="url(#ad)"/>'+
   '<line x1="'+n1(x1)+'" y1="'+n1(y-5)+'" x2="'+n1(x1)+'" y2="'+n1(y+5)+'" class="fdl"/>'+
   '<line x1="'+n1(x2)+'" y1="'+n1(y-5)+'" x2="'+n1(x2)+'" y2="'+n1(y+5)+'" class="fdl"/>'+
   G.t((x1+x2)/2,y-5,lab,10,'fdt'),
 dimv:(x,y1,y2,lab)=>'<line x1="'+n1(x)+'" y1="'+n1(y1)+'" x2="'+n1(x)+'" y2="'+n1(y2)+'" class="fdl" marker-start="url(#ad)" marker-end="url(#ad)"/>'+
   G.t(x-6,(y1+y2)/2+4,lab,10,'fdt','end'),
 ceil:(x1,x2,y)=>{let s='<line x1="'+n1(x1)+'" y1="'+n1(y)+'" x2="'+n1(x2)+'" y2="'+n1(y)+'" class="fkl2"/>';
   for(let x=x1+7;x<=x2;x+=9) s+='<line x1="'+n1(x)+'" y1="'+n1(y)+'" x2="'+n1(x-7)+'" y2="'+n1(y-7)+'" class="fh"/>'; return s},
 wall:(x,y1,y2)=>{let s='<line x1="'+n1(x)+'" y1="'+n1(y1)+'" x2="'+n1(x)+'" y2="'+n1(y2)+'" class="fkl2"/>';
   for(let y=y1;y<=y2;y+=9) s+='<line x1="'+n1(x)+'" y1="'+n1(y)+'" x2="'+n1(x-7)+'" y2="'+n1(y+7)+'" class="fh"/>'; return s},
 rope:(x,y1,y2)=>'<line x1="'+n1(x)+'" y1="'+n1(y1)+'" x2="'+n1(x)+'" y2="'+n1(y2)+'" class="fkl"/>',
 dot:(x,y,lab)=>'<circle cx="'+n1(x)+'" cy="'+n1(y)+'" r="3.4" class="fdot"/>'+(lab?G.t(x,y+17,lab,9.5,'ft'):''),
 tick:(x,y,lab)=>'<line x1="'+n1(x)+'" y1="'+n1(y-4)+'" x2="'+n1(x)+'" y2="'+n1(y+4)+'" class="fkl"/>'+G.t(x,y+15,lab,9,'fts'),
 dash:(x1,y1,x2,y2)=>'<line x1="'+n1(x1)+'" y1="'+n1(y1)+'" x2="'+n1(x2)+'" y2="'+n1(y2)+'" class="fdash"/>',
 person:(cx,feet)=>{const h=40,r=6.8,hy=feet-h+r;return '<circle cx="'+n1(cx)+'" cy="'+n1(hy)+'" r="'+r+'" class="fper"/>'+
   ['M'+n1(cx)+','+n1(hy+r)+'L'+n1(cx)+','+n1(feet-h*0.33),
    'M'+n1(cx)+','+n1(feet-h*0.33)+'L'+n1(cx-h*0.17)+','+n1(feet),
    'M'+n1(cx)+','+n1(feet-h*0.33)+'L'+n1(cx+h*0.17)+','+n1(feet),
    'M'+n1(cx-h*0.22)+','+n1(feet-h*0.55)+'L'+n1(cx+h*0.22)+','+n1(feet-h*0.55)].map(d=>'<path d="'+d+'" class="fper"/>').join('')},
};

/* คานแนวนอน — items: [ตำแหน่ง(m), ชนิด, ป้าย] ชนิด: hang down up person dot tick ang */
function beamFig(o){
  const L=o.L, h=o.h||170, yb=o.ybeam||78, th=12, sc=(FX1-FX0)/L, X=p=>FX0+p*sc;
  let s='';
  (o.dims||[]).forEach(d=>{ s+=G.dim(X(d[0]),X(d[1]),d[3]!==undefined?d[3]:yb-30,d[2]); });
  if(o.ceil!==undefined && o.ceil!==null){ s+=G.ceil(X(o.ceil)-34,X(o.ceil)+34,yb-46)+G.rope(X(o.ceil),yb-46,yb); }
  if(o.ropes){ s+=G.ceil(FX0-6,FX1+6,yb-48); o.ropes.forEach(p=>{ s+=G.rope(X(p),yb-48,yb); }); }
  if(o.wall!==undefined) s+=G.wall(FX0-2,yb-26,yb+34);
  s+=G.beam(FX0,yb,FX1-FX0,th);
  if(o.support){ const sp=X(o.support[0]);
    if(o.support[1]==='ลิ่ม') s+=G.ful(sp,yb+th)+G.t(sp,yb+th+32,'จุดหมุน',8.8,'fts');
    else s+=G.dot(sp,yb+th/2,'จุดหมุน'); }
  (o.items||[]).forEach(it=>{ const x=X(it[0]), k=it[1], lab=it[2];
    if(k==='hang') s+=G.hang(x,yb+th,lab);
    else if(k==='down') s+=G.force(x,yb+th,yb+th+36,lab);
    else if(k==='downtop') s+=G.force(x,yb-34,yb,lab,'l');
    else if(k==='up') s+=G.force(x,yb,yb-36,lab);
    else if(k==='person') s+=G.person(x,yb)+(lab?G.t(x,yb-46,lab,9.2,'fts'):'');
    else if(k==='dot') s+=G.dot(x,yb+th/2,lab);
    else if(k==='tick') s+=G.tick(x,yb+th+4,lab);
    else if(k==='tlabel') s+=G.t(x+(it[0]===0?10:-10),yb-42,lab,10.5,'ff2',it[0]===0?'start':'end','700');
    else if(k==='ang') s+=G.ang(x,yb+th/2,it[3],it[4],lab);
  });
  if(o.extra) s+=o.extra(X,yb,th);
  return G.svg(FW,h,s);
}

/* แขนหมุนเดี่ยว — ประตู ประแจ หรือคานที่สนใจแค่จุดหมุนกับแรงเดียว */
function armFig(o){
  const h=o.h||118, y=58, x0=FX0, x1=FX1, L=o.L, sc=(x1-x0)/L, X=p=>x0+p*sc;
  let s=G.dim(X(0),X(o.at),o.dimy||30,o.dim);
  if(o.full) s+=G.dim(X(0),X(L),o.dimy2||14,o.full);
  s+='<rect x="'+n1(x0)+'" y="'+n1(y)+'" width="'+n1(x1-x0)+'" height="9" rx="2" class="fbeam"/>';
  s+=G.dot(x0,y+4.5,o.pivot||'จุดหมุน');
  if(o.ang) s+=G.ang(X(o.at),y+4.5,o.ang[0],o.ang[1],o.force);
  else s+=G.force(X(o.at),y,y-34,o.force);
  if(o.hangAt!==undefined) s+=G.hang(X(o.hangAt),y+9,o.hangLab);
  if(o.extra) s+=o.extra(X,y);
  return G.svg(FW,h,s);
}

/* เหล็กฉากรูปตัว L — จุดหมุนที่มุม */
function lFig(o){
  const h=175, cx=120, cy=130, ph=o.h*110, pb=o.b*110;
  const hh=Math.min(ph,84), bb=Math.min(pb,150);
  let s='<rect x="'+n1(cx-5)+'" y="'+n1(cy-hh)+'" width="10" height="'+n1(hh+10)+'" rx="2" class="fbeam"/>'+
        '<rect x="'+n1(cx-5)+'" y="'+n1(cy)+'" width="'+n1(bb+5)+'" height="10" rx="2" class="fbeam"/>';
  s+=G.dot(cx,cy+5,'จุดหมุน');
  s+=G.dimv(cx-16,cy-hh,cy,o.hlab);
  s+=G.dim(cx,cx+bb,cy+34,o.blab);
  s+=G.ang(cx,cy-hh+4,46,0,o.flab);
  s+=G.force(cx+bb,cy+10,cy+10+30,o.wlab);
  return G.svg(FW,h,s);
}

/* แรงเอียง — ให้เห็นว่าอาร์มจริงคือระยะตั้งฉากจากจุดหมุนถึงแนวแรง ไม่ใช่ความยาวคาน */
function angleFig(e){
  const h=215, yb=62, th=12, ybm=yb+th/2, O=[FX0,ybm], P=[FX1,ybm];
  const a=20*Math.PI/180, ux=Math.cos(a), uy=-Math.sin(a);
  const k=(O[0]-P[0])*ux+(O[1]-P[1])*uy;          // ระยะตามแนวแรงจาก P ถึงเท้าตั้งฉาก
  const Ft=[P[0]+k*ux, P[1]+k*uy];                 // เท้าของเส้นตั้งฉาก
  let s=G.dim(FX0,FX1,28,'คานยาว '+e.L+' m');
  s+=G.beam(FX0,yb,FX1-FX0,th);
  s+=G.dash(Ft[0]-14*ux,Ft[1]-14*uy,P[0]+46*ux,P[1]+46*uy);
  s+=G.dot(O[0],ybm,'จุดหมุน');
  s+=G.ang(P[0],ybm,40*ux,40*uy,'F = '+e.F+' N');
  s+='<line x1="'+n1(O[0])+'" y1="'+n1(O[1])+'" x2="'+n1(Ft[0])+'" y2="'+n1(Ft[1])+'" class="fdl" marker-start="url(#ad)" marker-end="url(#ad)"/>';
  s+=G.t((O[0]+Ft[0])/2-6,(O[1]+Ft[1])/2+14,'อาร์มจริง '+e.d+' m',10,'fdt','start');
  s+=G.t(FW/2,h-8,'ระยะอาร์มวัดตั้งฉากจากจุดหมุนถึงแนวแรง ไม่ใช่ความยาวคาน',9.4,'fts');
  return G.svg(FW,h,s);
}


function figFor(tpl,env){
  const f=FIGS[tpl.id]; if(!f) return '';
  try{ return '<div class="fig">'+f(env)+'</div>'; }catch(err){ return ''; }
}


/* ======================================================================
   กฎการผ่าน — คะแนนความชำนาญ ขึ้นช้า ลงเร็ว
   ====================================================================== */
/* กติกาแบบเกมไต่เลเวล — ตอบถูกได้ EXP ตามความยากของข้อ ตอบผิดเสียเลือด
   เลือดหมดจึงตกเลเวล ไม่ใช่ผิดทีเดียวแล้วถอยหลังทันที
   แยกสองแกนแบบนี้เพราะ EXP คือ "ทำได้แค่ไหน" ส่วนเลือดคือ "ยังเดาสุ่มอยู่หรือเปล่า" */
const RULE = {
  right:20,            // EXP เมื่อตอบถูกโดยไม่ใช้คำใบ้
  rightHint:8,         // EXP เมื่อตอบถูกโดยใช้คำใบ้
  expReview:10,        // EXP ของข้อทวน
  expMulti:1.25,       // โจทย์หลายชั้น (ต้องหาหลายค่า) ได้ EXP มากกว่า
  expMC:0.8,           // ข้อเลือกตอบเดาได้ จึงได้ EXP น้อยกว่า
  pass:100,            // EXP เต็มหลอดของระดับนั้น
  minTries:5,          // และต้องทำในระดับนั้นมาแล้วไม่น้อยกว่า 5 ข้อ
  hp:100,              // เลือดเต็ม
  dmg:20,              // ตอบผิดเสียเลือดเท่านี้ (ผิด 5 ข้อสะสมคือเลือดหมด)
  dmgReview:28,        // ข้อทวนพลาด เจ็บกว่า เพราะเคยผ่านมาแล้ว
  heal:8,              // ตอบถูกฟื้นเลือดเท่านี้ (จำลองแล้ว: 50% แม่นยังไต่จบได้ 97% · 40% ไต่จบ 7% · 30% ไม่จบเลย)
  downHp:70,           // ตกเลเวลแล้วฟื้นเลือดมาให้เท่านี้
  downExp:60,          // และ EXP ของเลเวลที่ตกลงมาเหลือเท่านี้
  expLowNear:0.30,     // ต่ำกว่าตัวเอง 1 ระดับ ได้ EXP เท่านี้ของปกติ
  expLowFar:0.10,      // ต่ำกว่า 2 ระดับ
  expLowDeep:0.03,     // ต่ำกว่า 3 ระดับขึ้นไป ยิ่งด่านง่ายยิ่งแทบไม่ได้ EXP
  dmgLow:10,           // ตอบผิดในด่านเก่า เสียเลือดน้อยกว่า เพราะความเสี่ยงต่ำ รางวัลก็ต่ำ
  reviewEvery:8,       // (เลิกใช้แล้ว ตั้งแต่เปลี่ยนเป็นเลือกด่านเอง)
  reviewBack:60,
  wrong:-25,           // (เลิกใช้แล้ว เก็บไว้กันไฟล์หัวข้อเก่าอ้างถึง)
  reviewFail:-30,
};
let KEY = 'kp-drill:unset';

let S = null;
function fresh(){
  const m={}; LEVELS.forEach(l=>m[l.n]=0);
  /* lv = เลเวลตัวละคร (ด่านสูงสุดที่เปิดแล้ว) · map = ด่านที่กำลังเล่นอยู่ */
  return {m, tries:{}, lv:1, map:1, score:0, best:0, streak:0, wrong:0, since:0, lastSeen:{}, mode:'normal',
          quest:null, cards:{}, days:[], gold:0, hp:RULE.hp, downs:0};
}
function load(){
  try{const r=localStorage.getItem(KEY); if(r){const o=JSON.parse(r); if(o&&o.m) return Object.assign(fresh(),o);}}catch(e){}
  return fresh();
}
function save(){
  try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}
  /* ถ้าล็อกอินอยู่ ส่งขึ้นคลาวด์แบบหน่วง ไม่ยิงทุกข้อ */
  if(window.KPAUTH && KPAUTH.user()) KPAUTH.pushLater(TOPIC_ID, S);
}

/* รวมความคืบหน้าของเครื่องนี้กับของคลาวด์ โดยเอา "มากกว่า" ของแต่ละอย่าง
   เพราะเด็กอาจเล่นค้างไว้ทั้งสองที่ และการลดความคืบหน้าของใครลงคือสิ่งที่ยอมไม่ได้ */
function mergeCloud(c){
  if(!c) return false;
  let changed=false;
  const bump=(a,b)=>{ const v=Math.max(Number(a)||0, Number(b)||0); return v; };
  for(const l of LEVELS){
    const n=l.n;
    const m=bump(S.m[n], (c.m||{})[n]); if(m!==S.m[n]){ S.m[n]=m; changed=true; }
    const t=bump(S.tries[n], (c.tries||{})[n]); if(t!==(S.tries[n]||0)){ S.tries[n]=t; changed=true; }
  }
  const lv=Math.min(LEVELS.length, bump(S.lv, c.lv)); if(lv!==S.lv){ S.lv=lv; changed=true; }
  const sc=bump(S.score, c.points); if(sc!==S.score){ S.score=sc; S.best=Math.max(S.best||0,sc); changed=true; }
  const dn=bump(S.downs, c.downs); if(dn!==(S.downs||0)){ S.downs=dn; changed=true; }
  if(!S.map || S.map>S.lv) S.map=S.lv;
  return changed;
}

/* ---------- สุ่มโจทย์จาก template ---------- */
const rnd=(a,b,s)=>{const n=Math.round((b-a)/s); return +(a+s*Math.floor(Math.random()*(n+1))).toFixed(4);};
const nice=v=>Number.isFinite(v)&&v>=0&&Math.abs(v*100-Math.round(v*100))<1e-6&&v<=5000;
const fmt=v=>{if(typeof v!=='number')return v; const r=Math.round(v*100)/100; return String(r);};

function evalIn(expr,env){
  const k=Object.keys(env);
  try{ return Function(...k,'CCW','CW','"use strict";return ('+expr+')')(...k.map(x=>env[x]),CCW,CW); }
  catch(e){ return NaN; }
}

function build(tpl){
  for(let tryN=0;tryN<500;tryN++){
    const env={};
    /* ฉากของโจทย์ — โครงคิดเหมือนเดิม แต่เปลี่ยนของจริงที่พูดถึง
       ข้อเดียวกันจึงอ่านเป็นคนละข้อ และนักเรียนต้องอ่านโจทย์จริง ๆ ไม่ใช่จำรูปประโยค */
    if(tpl.vset && tpl.vset.length){
      const o=tpl.vset[Math.floor(Math.random()*tpl.vset.length)];
      for(const k in o) env[k]=o[k];
    }
    for(const k in tpl.p) env[k]=rnd(...tpl.p[k]);
    if(tpl.c) for(const k in tpl.c) env[k]=evalIn(tpl.c[k],env);
    if(tpl.ok && !evalIn(tpl.ok,env)) continue;
    const ans=(tpl.f||[]).map(f=>evalIn(f.e,env));
    if(ans.some(a=>typeof a==='number' ? !nice(a) : !a)) continue;
    if(tpl.need && !evalIn(tpl.need,env)) continue;
    if(tpl.c2) for(const k in tpl.c2) env[k]=evalIn(tpl.c2[k],env);
    ans.forEach((a,i)=>env['A'+(i+1)]=typeof a==='number'?fmt(a):a);
    if(tpl.id==='1e'){ env.M1=fmt(env.F1*env.d1); env.M2=fmt(env.F2*env.d2); }
    /* ข้อเลือกตอบ: สลับลำดับตัวเลือกทุกครั้ง เด็กจะได้จำไม่ได้ว่าข้อ ข ถูกเสมอ */
    let order=null;
    if(tpl.mc){
      order=tpl.mc.map((o,i)=>i);
      for(let k=order.length-1;k>0;k--){ const j=Math.floor(Math.random()*(k+1)); const t=order[k]; order[k]=order[j]; order[j]=t; }
    }
    return {tpl, env, ans, order};
  }
  return null;
}
function fill(str,env){ return String(str).replace(/\{(\w+)\}/g,(m,k)=>k in env?fmt(env[k]):m); }

/* จำว่าเพิ่งออกข้อไหนไปในระดับนั้น เพื่อไม่ให้โจทย์แบบเดิมโผล่ติดกัน
   ถ้าซ้ำติดกัน เด็กจะลอกวิธีจากข้อก่อนโดยไม่ได้อ่านโจทย์ */
const seen={};
function pickLevel(lv){
  const pool=T.filter(t=>t.lv===lv);
  if(!pool.length) return null;
  const hist=seen[lv]||(seen[lv]=[]);
  const keep=Math.min(pool.length-1, 4);
  let pick=pool.filter(t=>hist.indexOf(t.id)<0);
  if(!pick.length) pick=pool;
  const t=pick[Math.floor(Math.random()*pick.length)];
  hist.push(t.id); while(hist.length>keep) hist.shift();
  return build(t) || build(pool[0]);
}


/* ---------- ภารกิจวันนี้ · ข้อทอง · บัตรความรู้ ----------
   สามอย่างนี้คือชั้นแรงจูงใจ: ให้เลือกเองได้ (autonomy) · รางวัลที่ไม่รู้ล่วงหน้า
   (variable ratio) · และช่องว่างที่อยากเติม (curiosity gap)
   ทุกตัวผูกกับการทำโจทย์ถูกจริง ไม่ใช่เวลาที่นั่งอยู่หน้าจอ */
let CARDS = [];

function today(){
  const d=new Date();
  return d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');
}

const QUESTS=[
  {id:'q8',  name:'ตอบถูก 8 ข้อ',               need:8, pts:60,  step:ev=>ev.ok?1:0},
  {id:'nh5', name:'ตอบถูกโดยไม่เปิดคำใบ้ 5 ข้อ', need:5, pts:70,  step:ev=>(ev.ok&&!ev.hint)?1:0},
  {id:'st5', name:'ตอบถูกติดกัน 5 ข้อ',          need:5, pts:70,  step:(ev,p)=>Math.max(p,ev.streak||0)-p},
  {id:'rv3', name:'ตอบถูกในด่านเก่า 3 ข้อ',       need:3, pts:80,  needPassed:true, step:ev=>(ev.ok&&ev.review)?1:0},
  {id:'gd2', name:'เจอข้อทอง 2 ข้อ',             need:2, pts:80,  step:ev=>(ev.ok&&ev.gold)?1:0},
  {id:'up1', name:'ขึ้นระดับใหม่ 1 ระดับ',        need:1, pts:100, step:ev=>ev.up?1:0},
];

/* สุ่มแบบผูกกับวันที่ เปิดใหม่กี่ครั้งก็ได้ภารกิจชุดเดิมของวันนั้น */
function seedRnd(str){
  let h=2166136261;
  for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); }
  return ()=>{ h^=h<<13; h^=h>>>17; h^=h<<5; return ((h>>>0)%100000)/100000; };
}
function offerToday(){
  const passed=LEVELS.some(l=>(S.m[l.n]||0)>=RULE.pass && l.n<S.lv);
  const pool=QUESTS.filter(q=>!q.needPassed||passed).slice();
  const r=seedRnd(today()+':'+TOPIC_ID);
  for(let i=pool.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); const t=pool[i]; pool[i]=pool[j]; pool[j]=t; }
  return pool.slice(0,3).map(q=>q.id);
}
function quest(){
  if(!S.quest || S.quest.day!==today())
    S.quest={day:today(), offer:offerToday(), pick:null, prog:0, done:false};
  return S.quest;
}
function questEvent(ev){
  const q=quest();
  if(!q.pick || q.done) return;
  const def=QUESTS.find(x=>x.id===q.pick); if(!def) return;
  const add=def.step(ev, q.prog)||0;
  if(add<=0) return;
  q.prog=Math.min(def.need, q.prog+add);
  if(q.prog>=def.need){ q.done=true; S.score+=def.pts; questDone=def; }
  save(); questUI(); head();
}
let questDone=null;

function questUI(){
  const box=$('quest'); if(!box) return;
  const q=quest();
  const ic=id=>(window.KPART&&KPART.quest)?KPART.quest(id):'';
  if(!q.pick){
    box.className='quest pick';
    box.innerHTML='<div class="q-h">ภารกิจวันนี้ เลือกอย่างเดียว</div>'+
      '<div class="q-opts">'+q.offer.map(id=>{
        const d=QUESTS.find(x=>x.id===id); if(!d) return '';
        return '<button type="button" data-q="'+d.id+'">'+ic(d.id)+'<b>'+d.name+'</b><span>+'+d.pts+'</span></button>';
      }).join('')+'</div>';
    box.querySelectorAll('button[data-q]').forEach(b=>b.onclick=()=>{
      q.pick=b.dataset.q; q.prog=0; q.done=false; save(); questUI();
    });
    return;
  }
  const d=QUESTS.find(x=>x.id===q.pick);
  if(!d){ q.pick=null; questUI(); return; }
  box.className='quest'+(q.done?' done':'');
  box.innerHTML=ic(d.id)+'<span class="q-name">'+d.name+'</span>'+
    '<div class="q-bar"><i style="width:'+Math.round(q.prog/d.need*100)+'%"></i></div>'+
    '<span class="q-v">'+(q.done?'+'+d.pts+' แต้ม ✓':q.prog+'/'+d.need)+'</span>';
}

function cardsUI(open){
  const box=$('cards'); if(!box) return;
  if(!CARDS.length){ box.innerHTML=''; return; }
  const got=CARDS.filter((c,i)=>S.cards&&S.cards[i+1]).length;
  /* พับเก็บไว้ ไม่ให้บังโจทย์ แต่หัวข้อยังเห็นว่าขาดอีกกี่ใบ */
  const wasOpen = open || box.querySelector('details')?.open;
  box.innerHTML='<details'+(wasOpen?' open':'')+'>'+
    '<summary><b>คลังบัตรความรู้ '+got+' / '+CARDS.length+'</b>'+
      '<span>'+(got<CARDS.length?'ผ่านระดับไหน ได้บัตรของระดับนั้น':'ครบทุกใบแล้ว')+'</span></summary>'+
    '<div class="cd-grid">'+CARDS.map((c,i)=>{
      const on=!!(S.cards&&S.cards[i+1]);
      const art = (window.KPART && KPART.card) ? KPART.card(i) : '';
      return '<div class="cd'+(on?' on':'')+'"><b>'+(i+1)+'</b>'+art+
        (on ? '<h4>'+c.t+'</h4><p>'+c.d+'</p>'
            : '<h4>ยังไม่ได้</h4><p>ผ่านระดับ '+(i+1)+' แล้วบัตรใบนี้จะเปิด</p>')+'</div>';
    }).join('')+'</div></details>';
}

/* ---------- เลือกโจทย์ถัดไป: ปกติ / ข้อทวน / ข้อปรับพื้น ---------- */
let Q=null, usedHint=0, shownHint=0, subMode=false, review=false, basic=false, gold=false;

function next(opts){
  if(gateUI()) return;
  opts=opts||{};
  if(window.KPTOOLS) KPTOOLS.newq();   /* ขึ้นข้อใหม่ ล้างกระดานทดให้ */
  subMode=false; usedHint=0; shownHint=0;
  if(!S.map || S.map>S.lv || S.map<1) S.map=S.lv;
  /* ด่านเก่า = ด่านที่ต่ำกว่าเลเวลตัวเอง ได้ EXP น้อยลงและไม่มีข้อทอง */
  review = S.map < S.lv;
  basic = false;
  /* ข้อทอง: ราว 1 ใน 8 ข้อ แต้มคูณสาม แต่จะรู้ก็ต่อเมื่อตอบถูกแล้ว
     ถ้าบอกก่อนตอบ เด็กจะเกร็งกลัวพลาดข้อสำคัญ ซึ่งตรงข้ามกับที่ต้องการ */
  gold = !review && Math.random() < 0.125;

  if(opts.twin && Q){ Q=build(Q.tpl)||pickLevel(S.map); Q.lv=S.map; render(); return; }

  Q=pickLevel(S.map); Q.lv=S.map; render();
}

/* เลือกด่าน — เปิดเฉพาะด่านที่ปลดล็อกแล้ว (ไม่เกินเลเวลตัวเอง) */
function setMap(n){
  n=Math.max(1,Math.min(S.lv,n|0));
  if(n===S.map) return;
  S.map=n; save(); next({});
}

/* ---------- วาดหน้าจอ ---------- */
const $=id=>document.getElementById(id);

/* กล่องรายละเอียดหลังปุ่ม i — ชื่อระดับเต็ม กติกาคะแนน และประวัติเลือดหมด
   เก็บไว้ในนี้เพราะอ่านครั้งเดียวก็พอ ไม่ต้องกินที่หน้าจอทุกข้อ */
function moreHTML(info){
  const lvInfo=LEVELS.find(l=>l.n===S.lv)||LEVELS[0];
  const mapInfo=LEVELS.find(l=>l.n===S.map)||lvInfo;
  return '<b>เลเวล '+S.lv+' · '+lvInfo.t+'</b>'+
    '<span>กำลังเล่นด่าน '+S.map+' · '+mapInfo.t+
      (S.map<S.lv ? ' · ด่านเก่า ได้ EXP เพียง '+Math.round(mapRate()*100)+'% ของปกติ'
                  : ' · ด่านประจำเลเวล ได้ EXP เต็ม')+'</span>'+
    '<span>ตอบถูก +'+RULE.right+' EXP · เปิดคำใบ้แล้วถูก +'+RULE.rightHint+
    ' · ตอบผิดเสียเลือด '+RULE.dmg+' (ด่านเก่า '+RULE.dmgLow+')'+
    ' · เลือดหมดลดเลเวล · ขึ้นเลเวลต้องได้ EXP ครบ 100 ในด่านประจำเลเวล และทำอย่างน้อย '+RULE.minTries+' ข้อ</span>'+
    '<span>กดตัวเลขบนแถบด่านเพื่อย้ายด่านได้ตลอด ด่านที่ยังไม่ถึงจะล็อกไว้</span>'+
    (S.downs?'<span>เคยเลือดหมด '+S.downs+' ครั้ง</span>':'');
}

function head(){
  const info=LEVELS.find(l=>l.n===S.lv)||LEVELS[0];
  const m=S.m[S.lv]||0, tries=S.tries[S.lv]||0, pc=Math.max(0,Math.min(100,m));
  $('lvn').textContent=S.lv; $('lvt').textContent=info.t;
  $('mv').textContent=Math.round(m);
  const xf=$('xpf'); if(xf) xf.style.width=pc+'%';

  /* แถบสถานะต้องเตี้ยพอให้เห็นโจทย์ทันทีที่เปิดหน้า
     บรรทัดนี้จึงขึ้นเฉพาะตอนที่เปลี่ยนการตัดสินใจของเด็กจริง ๆ คือใกล้ขึ้นระดับ
     ส่วนกติกาคะแนนย้ายไปอยู่ในปุ่ม i ซึ่งเปิดดูเมื่อไหร่ก็ได้ */
  const oneMore = m<RULE.pass && m>=RULE.pass-RULE.right && tries+1>=RULE.minTries;
  const pn=$('pn');
  if(pn){
    pn.classList.toggle('close', oneMore);
    if(oneMore) pn.textContent='อีกข้อเดียวขึ้นระดับ';
    else if(m>=RULE.pass) pn.textContent = tries>=RULE.minTries
      ? 'EXP เต็มแล้ว ข้อถัดไปขึ้นระดับใหม่'
      : 'EXP เต็มแล้ว ขอให้ครบ '+RULE.minTries+' ข้อก่อน (ทำแล้ว '+tries+')';
    pn.hidden = !(oneMore || m>=RULE.pass);
  }
  const more=$('more');
  if(more && !more.hidden) more.innerHTML = moreHTML(info);

  /* หลอดเลือด — ผิดสะสมจนหมดคือตกเลเวล */
  const hp=Math.max(0,Math.min(RULE.hp,S.hp));
  const hpf=$('hpf'); if(hpf) hpf.style.width=(hp/RULE.hp*100).toFixed(1)+'%';
  const hpv=$('hpv'); if(hpv) hpv.textContent=Math.round(hp);
  const hpw=$('hpwrap');
  if(hpw){ hpw.classList.toggle('low',hp<=40); hpw.classList.toggle('crit',hp<=20); }

  /* มุมขวาบน: ยศ แต้ม และสตรีค รวมเป็นก้อนเดียว ไม่แยกเป็นการ์ดอีกใบ */
  const skill=LEVELS.reduce((a,l)=>a+Math.round(S.m[l.n]||0),0);
  const rk=KPRANK.of(skill, LEVELS.length*100);
  const box=$('rank');
  if(box) box.innerHTML =
    '<div class="me-id" title="'+(rk.top?rk.note:'อีก '+rk.need+' คะแนนถึงยศ '+rk.next)+'">'+
      ((window.KPART&&KPART.rank)?KPART.rank(rk.i).replace('class="badge','class="badge sm'):'')+
      '<div class="me-txt"><b>'+rk.name+'</b>'+
      '<span>'+(rk.top?'ยศสูงสุด':'อีก '+rk.need+' ถึง '+rk.next)+'</span></div></div>'+
    '<div class="me-num"><span>'+S.score+' แต้ม</span>'+
      (S.streak>=3?'<span class="hot">ถูกติดกัน '+S.streak+'</span>':'')+'</div>';

  /* แถบด่าน: กดเพื่อย้ายด่านได้เอง ด่านที่ยังไม่ปลดล็อกกดไม่ได้
     จุดที่เลือกอยู่มีวงรอบ ส่วนจุดทึบคือด่านประจำเลเวลตัวเอง (ที่ได้ EXP เต็ม) */
  $('map').innerHTML=LEVELS.map(l=>{
    const mm=S.m[l.n]||0, lock=l.n>S.lv;
    const cls=[ mm>=RULE.pass?'done':'', l.n===S.lv?'now':'', lock?'lock':'',
                l.n===S.map?'sel':'' ].filter(Boolean).join(' ');
    const rate = lock ? '' : l.n===S.lv ? ' · EXP เต็ม'
               : ' · EXP ' + Math.round(mapRate(S.lv,l.n)*100) + '%';
    const t = 'ด่าน '+l.n+' · '+l.t+(lock?' · ยังล็อก':rate);
    return '<li class="'+cls+'"><button type="button" data-m="'+l.n+'" title="'+t+'"'+
           (lock?' disabled aria-disabled="true"':'')+'>'+l.n+'</button></li>';
  }).join('');
}

function render(){
  head();
  const tpl=Q.tpl, env=Q.env;
  /* ป้ายระดับขึ้นเฉพาะตอนที่ไม่ใช่ระดับปัจจุบัน ไม่งั้นซ้ำกับแผงสถานะด้านบนเปล่า ๆ */
  const qlv=review?Q.lv:tpl.lv;
  const tags=[];
  if(review||basic||qlv!==S.lv) tags.push('<span class="tag lv">ด่าน '+qlv+'</span>');
  if(review) tags.push('<span class="tag rev">ด่านเก่า · ได้ EXP '+Math.round(mapRate()*100)+'%</span>');
  if(basic) tags.push('<span class="tag sub">ข้อปรับพื้น ไม่คิดคะแนน</span>');
  if(subMode) tags.push('<span class="tag sub">ขั้นย่อย ทำทีละขั้น</span>');

  const fields = subMode ? [{l:'คำตอบ', u:tpl.sub.u}] : tpl.f;
  const qtext = subMode ? fill(tpl.sub.q,env) : fill(tpl.q,env);
  const isMC = !!(tpl.mc && !subMode);
  /* กล่องสถานการณ์: เรื่องเล่าที่ต้องอ่านก่อน แยกออกจากคำถามให้ชัด */
  const scene = (!subMode && tpl.scene) ? '<div class="scene">'+fill(tpl.scene,env)+'</div>' : '';

  $('stage').innerHTML =
   '<div class="card">'+
    '<div class="tagrow">'+tags.join('')+'</div>'+
    scene+
    '<div class="qtext">'+qtext.replace(/(\d+(\.\d+)?)/g,'<b>$1</b>')+'</div>'+
    (subMode?'':figFor(tpl,env))+
    (isMC
      ? '<div class="choices" role="radiogroup" aria-label="เลือกคำตอบ">'+
        Q.order.map((oi,j)=>
          '<label class="ch" for="ch'+j+'"><input type="radio" name="mc" id="ch'+j+'" value="'+oi+'">'+
          '<span class="ch-k">'+'กขคง จฉชญ'.replace(/ /g,'').charAt(j)+'</span>'+
          '<span class="ch-t">'+fill(tpl.mc[oi].t,env)+'</span></label>').join('')+'</div>'
      : '<div class="fields">'+fields.map((f,i)=>
      '<div class="f">'+
      '<label for="in'+i+'">'+fill(f.l,env)+'</label>'+
      (f.opts
        ? '<select id="in'+i+'"><option value="">— เลือกคำตอบ —</option>'+f.opts.map(o=>'<option>'+o+'</option>').join('')+'</select>'
        : '<div class="row"><input id="in'+i+'" type="text" inputmode="decimal" autocomplete="off" placeholder="ตัวเลข">'+
          '<div class="units" role="radiogroup" aria-label="หน่วยของคำตอบ">'+
          UNITS.map((u,j)=>'<input type="radio" name="u'+i+'" id="u'+i+'_'+j+'" value="'+u+'"><label for="u'+i+'_'+j+'">'+u+'</label>').join('')+
          '</div></div>')+
      '</div>').join('')+'</div>')+
    '<div class="acts">'+
      '<button class="primary" id="go">ตรวจคำตอบ</button>'+
      (!subMode && tpl.h ? '<button id="hint">ขอคำใบ้</button>' : '')+
      '<span class="sp"></span>'+
      '<button id="skip">ข้ามข้อนี้</button>'+
    '</div>'+
    '<div id="hb"></div><div id="fb"></div>'+
   '</div>';

  $('go').onclick=check;
  $('skip').onclick=()=>{ S.streak=0; save(); next({}); };
  if($('hint')) $('hint').onclick=hint;
  const first=$('in0'); if(first) first.focus();
  if(isMC) $('stage').querySelectorAll('input[name=mc]').forEach(el=>el.addEventListener('keydown',e=>{if(e.key==='Enter')check();}));
  $('stage').querySelectorAll('input').forEach(el=>el.addEventListener('keydown',e=>{if(e.key==='Enter')check();}));
}

function hint(){
  const hs=Q.tpl.h||[];
  if(shownHint>=hs.length) return;
  usedHint=1; shownHint++;
  $('hb').innerHTML='<div class="hints">'+hs.slice(0,shownHint).map((h,i)=>'<p><b>คำใบ้ '+(i+1)+'</b> · '+fill(h,Q.env)+'</p>').join('')+'</div>';
  if(shownHint>=hs.length) $('hint').disabled=true;
}

function closeEnough(got,want){
  const g=parseFloat(String(got).replace(/,/g,'').trim());
  if(!Number.isFinite(g)) return false;
  return Math.abs(g-want) <= Math.max(0.01, Math.abs(want)*0.01);
}

let rankUp=null, mcPick=-1, lastExp=0, lastDmg=0, lastHeal=0, lastLeft=0, levelDown=null;
/* EXP ของข้อนี้ — ยากกว่าได้มากกว่า
   ข้อทวนให้น้อยเพราะเคยผ่านแล้ว · หลายชั้นให้มากเพราะต้องคิดต่อกันหลายทอด
   · เลือกตอบให้น้อยลงเพราะเดาได้ 1 ใน 4 */
/* ตัวคูณ EXP ตามด่านที่เลือก — ด่านเท่าเลเวลตัวเองได้เต็ม ด่านเก่าได้น้อยลงมาก
   เพื่อให้ "ย้อนไปทบ" ยังมีค่า แต่ไม่คุ้มถ้าจะอยู่ฟาร์มด่านง่ายแทนการขึ้นด่านใหม่ */
function mapRate(lv,map){
  const gap = (lv===undefined?S.lv:lv) - (map===undefined?(S.map||S.lv):map);
  if(gap<=0) return 1;
  if(gap===1) return RULE.expLowNear;
  if(gap===2) return RULE.expLowFar;
  return RULE.expLowDeep;
}

function expOf(){
  let g = usedHint ? RULE.rightHint : RULE.right;
  const tpl = Q.tpl;
  if(tpl.mc) g *= RULE.expMC;
  else if((tpl.f||[]).length >= 2) g *= RULE.expMulti;
  if(tpl.exp) g *= tpl.exp;        /* เผื่อให้ไฟล์หัวข้อตั้งน้ำหนักเองเป็นข้อ ๆ */
  g *= mapRate();
  return Math.max(1, Math.round(g));
}

/* เลือดหมด = ตกเลเวล ถอยลงหนึ่งขั้นแล้วได้เลือดใหม่
   ไม่ล้าง EXP ทิ้งทั้งหมด เพราะจุดประสงค์คือให้กลับไปทบ ไม่ใช่ลงโทษให้เลิกเล่น */
function dropLevel(){
  S.downs=(S.downs||0)+1;
  S.hp=RULE.downHp; S.wrong=0; S.streak=0;
  if(S.lv>1){
    S.lv--;
    S.map=S.lv;                                  /* ตกเลเวลแล้วกลับไปอยู่ด่านของเลเวลใหม่ */
    S.m[S.lv]=Math.min(S.m[S.lv]||0, RULE.downExp);
    S.tries[S.lv]=Math.min(S.tries[S.lv]||0, RULE.minTries-1);
    return {to:S.lv, first:false};
  }
  S.m[1]=Math.max(0,(S.m[1]||0)-RULE.downExp);   /* อยู่ระดับ 1 แล้ว ตกต่ำกว่านี้ไม่ได้ */
  return {to:1, first:true};
}

function check(){
  const tpl=Q.tpl, env=Q.env;
  const rankBefore=KPRANK.of(LEVELS.reduce((a,l)=>a+Math.round(S.m[l.n]||0),0), LEVELS.length*100).i;
  const isMC = !!(tpl.mc && !subMode);
  const fields = isMC ? [] : (subMode ? [{u:tpl.sub.u, e:tpl.sub.e}] : tpl.f);
  const want   = isMC ? [] : (subMode ? [evalIn(tpl.sub.e,env)] : Q.ans);

  let allOk=true, notes=[];
  if(isMC){
    const el=document.querySelector('input[name=mc]:checked');
    if(!el){ $('fb').innerHTML='<div class="tip">เลือกคำตอบสักข้อก่อน แล้วค่อยกดตรวจ</div>'; return; }
    mcPick=+el.value;
    allOk=!!tpl.mc[mcPick].ok;
  }
  fields.forEach((f,i)=>{
    const el=$('in'+i); const v=el?el.value:'';
    if(f.opts){ if(v!==want[i]) {allOk=false;} return; }
    if(!closeEnough(v,want[i])){ allOk=false; return; }
    const us=document.querySelector('input[name=u'+i+']:checked');
    if(!us){ allOk=false; notes.push('ยังไม่ได้เลือกหน่วยของคำตอบ'); }
    else if(us.value!==f.u){ allOk=false; notes.push('ตัวเลขถูกแล้ว แต่หน่วยยังไม่ถูก คำตอบนี้มีหน่วยเป็น '+f.u); }
  });

  if(basic){ // ข้อปรับพื้น ไม่คิดคะแนน
    showFb(allOk, fields, want, notes, true);
    return;
  }
  if(subMode){ // ขั้นย่อย: ถูกแล้วกลับไปทำข้อเต็ม
    if(allOk){ S.wrong=0; save(); subMode=false; feedbackSub(); }
    else showFb(false, fields, want, notes, true);
    return;
  }

  /* EXP เข้าที่เลเวลตัวเองเสมอ เล่นด่านเก่าก็ได้ EXP ของเลเวลตัวเอง เพียงแต่น้อยลง
     ส่วนจำนวนข้อที่นับเพื่อขึ้นเลเวล นับเฉพาะด่านประจำเลเวล จะได้ไม่ขึ้นเลเวลด้วยด่านง่าย */
  const lv = S.lv;
  lastExp=0; lastDmg=0; lastHeal=0; lastLeft=S.hp; levelDown=null;
  if(allOk){
    const gain = expOf();
    lastExp = gain;
    S.m[lv]=Math.min(100,(S.m[lv]||0)+gain);
    if(!review) S.tries[lv]=(S.tries[lv]||0)+1;
    S.streak++; S.wrong=0;
    /* ตอบถูกฟื้นเลือด แต่ไม่เกินเต็ม — เล่นต่อเนื่องแล้วเลือดกลับมาเอง */
    const before=S.hp; S.hp=Math.min(RULE.hp, S.hp+RULE.heal); lastHeal=S.hp-before;
    const P=KPRANK.points({level:lv, hint:!!usedHint, streak:S.streak, review:review});
    if(gold){ P.total*=3; P.why+=' · ข้อทอง ×3'; S.gold=(S.gold||0)+1; }
    S.lastPts=P.total; S.lastWhy=P.why;
    S.score+=P.total; S.best=Math.max(S.best,S.score);
    if(!review) S.since++;
    S.lastSeen[lv]=Date.now();
  }else{
    S.streak=0; S.wrong++;
    lastDmg = review ? RULE.dmgLow : RULE.dmg;
    S.hp = Math.max(0, S.hp - lastDmg);
    lastLeft = S.hp;                       /* เก็บเลือดที่เหลือก่อนตกเลเวล ไม่งั้นบรรทัดสรุปจะโชว์เลือดใหม่ */
    if(!review) S.tries[lv]=(S.tries[lv]||0)+1;
    if(S.hp<=0) levelDown = dropLevel();
  }
  const rankAfter=KPRANK.of(LEVELS.reduce((a,l)=>a+Math.round(S.m[l.n]||0),0), LEVELS.length*100);
  rankUp = rankAfter.i>rankBefore ? rankAfter.name : null;
  questDone=null;
  questEvent({ok:allOk, hint:!!usedHint, review:review, gold:gold, streak:S.streak, up:false});
  save();
  head();                       /* ให้แต้มกับคานขยับทันทีที่ตอบ ไม่ต้องรอข้อถัดไป */
  showFb(allOk, fields, want, notes, false);
}

function feedbackSub(){
  $('fb').innerHTML='<div class="fb good"><div class="h">✓ ขั้นย่อยถูกแล้ว</div>'+
    '<div>กลับไปทำข้อเต็มด้วยตัวเลขเดิม ใช้ค่านี้ต่อได้เลย</div></div>';
  $('go').disabled=true; if($('hint'))$('hint').disabled=true;
  const b=document.createElement('button'); b.className='primary'; b.textContent='ทำข้อเต็มต่อ';
  b.onclick=()=>{ subMode=false; render(); };
  $('fb').appendChild(b);
}


/* บรรทัดสรุปผลของข้อนี้แบบเกม: ได้ EXP เท่าไร เสียเลือดเท่าไร */
function statline(ok){
  if(ok){
    const h = lastHeal>0 ? '<span class="st-hp">เลือด +'+lastHeal+'</span>' : '';
    return '<div class="statline"><span class="st-xp">EXP +'+lastExp+'</span>'+h+'</div>';
  }
  return '<div class="statline"><span class="st-dm">เลือด −'+lastDmg+'</span>'+
    '<span class="st-left">เหลือ '+Math.round(lastLeft)+' / '+RULE.hp+'</span></div>';
}

function showFb(ok, fields, want, notes, noScore){
  const tpl=Q.tpl, env=Q.env;
  const isMC = !!(tpl.mc && !subMode);
  const right = isMC ? tpl.mc.findIndex(o=>o.ok) : -1;
  const ansLine = isMC
    ? '<span class="ansbox ans">'+fill(tpl.mc[right].t,env)+'</span>'
    : '<span class="ansbox ans">'+fields.map((f,i)=>(f.l?fill(f.l,env)+' = ':'')+fmt(want[i])+(f.u?' '+f.u:'')).join('  ·  ')+'</span>';
  /* ข้อเลือกตอบ: บอกด้วยว่าทำไมข้อที่เลือกถึงผิด ไม่ใช่แค่เฉลยข้อถูก */
  const why = isMC
    ? (ok ? (tpl.mc[right].why ? '<div class="why">'+fill(tpl.mc[right].why,env)+'</div>' : '')
          : (tpl.mc[mcPick] && tpl.mc[mcPick].why ? '<div class="why">ที่เลือกไป · '+fill(tpl.mc[mcPick].why,env)+'</div>' : '') +
            (tpl.mc[right].why ? '<div class="why">ข้อที่ถูก · '+fill(tpl.mc[right].why,env)+'</div>' : ''))
    : '';
  const stats = noScore ? '' : statline(ok);
  let html;

  if(ok){
    const gstar = (window.KPART && KPART.gold) ? KPART.gold() : '⭐';
    html=(gold&&!noScore?'<div class="goldbar">'+gstar+'ข้อทอง · แต้มข้อนี้คูณสาม</div>':'')+
      '<div class="fb good"><div class="h">✓ ถูก'+(noScore?'':' · ได้ '+S.lastPts+' แต้ม')+'</div>'+
      stats+
      (noScore?'':'<div class="why">'+S.lastWhy+'</div>')+
      '<div>'+ansLine+'</div>'+why+'</div>';
  }else{
    const steps=(subMode||noScore)?null:tpl.s;
    html='<div class="fb bad"><div class="h">✕ ยังไม่ถูก</div>'+
      stats+
      (notes.length?'<div>'+notes.join(' · ')+'</div>':'')+
      '<div>คำตอบที่ถูกคือ '+ansLine+'</div>'+why+
      (steps?'<ol class="steps">'+steps.map(x=>'<li>'+fill(x,env)+'</li>').join('')+'</ol>':'')+
      '</div>';
  }
  $('fb').innerHTML=html;
  $('go').disabled=true; if($('hint'))$('hint').disabled=true;
  $('skip').remove();

  const bar=document.createElement('div'); bar.className='acts';
  const add=(txt,fn,pri)=>{const b=document.createElement('button'); b.textContent=txt; if(pri)b.className='primary'; b.onclick=fn; bar.appendChild(b);};

  if(ok){
    const lv=review?Q.lv:S.lv;
    const up = !review && !noScore && S.m[S.lv]>=RULE.pass && (S.tries[S.lv]||0)>=RULE.minTries && S.lv<LEVELS.length;
    if(up){
      const passedLv=S.lv;
      S.cards=S.cards||{}; S.cards[passedLv]=1;
      S.lv++; S.since=0; S.map=S.lv;   /* ขึ้นเลเวลแล้วเปิดด่านใหม่ และพาไปด่านนั้นเลย */
      questEvent({up:true});
      save(); head(); cardsUI(true);
      $('fb').insertAdjacentHTML('beforeend','<div class="up">ขึ้นเลเวล '+S.lv+' แล้ว · เปิดด่านใหม่: '+LEVELS[S.lv-1].t+'</div>');
      const c=CARDS[passedLv-1];
      if(c){
        const art=(window.KPART&&KPART.card)?KPART.card(passedLv-1):'';
        $('fb').insertAdjacentHTML('beforeend',
          '<div class="cardwon"><div class="cw-art">'+art+'</div><div><span>ได้บัตรความรู้ใบที่ '+passedLv+'</span>'+
          '<h4>'+c.t+'</h4><p>'+c.d+'</p></div></div>');
      }
    }else if(!review && !noScore && S.m[S.lv]>=RULE.pass && S.lv===LEVELS.length && (S.tries[LEVELS.length]||0)>=RULE.minTries){
      $('fb').insertAdjacentHTML('beforeend','<div style="margin-top:.6rem;font-weight:600;color:var(--ok)">จบทั้ง 8 ระดับแล้ว ทำต่อเพื่อรักษาความชำนาญได้เลย</div>');
    }
    if(!noScore && questDone){
      $('fb').insertAdjacentHTML('beforeend','<div class="up">ภารกิจวันนี้สำเร็จ · '+questDone.name+' · +'+questDone.pts+' แต้ม</div>');
      questDone=null;
    }
    if(!noScore && rankUp) $('fb').insertAdjacentHTML('beforeend','<div class="up">เลื่อนยศเป็น '+rankUp+' แล้ว</div>');
    add('ข้อต่อไป',()=>next({}),true);
  }else{
    if(levelDown){
      $('fb').insertAdjacentHTML('beforeend','<div class="down">เลือดหมด · '+
        (levelDown.first ? 'ยังอยู่เลเวล 1 แต่ EXP ถูกหักลง'
                         : 'ตกลงไปเลเวล '+levelDown.to+' · กลับไปด่าน '+levelDown.to+' · '+LEVELS[levelDown.to-1].t)+
        ' · ได้เลือดใหม่ '+RULE.downHp+' แล้วเริ่มไต่ใหม่</div>');
      add('ลุยต่อที่ด่าน '+S.map,()=>next({}),true);
    }
    else if(noScore){ add('ลองข้อนี้อีกครั้ง',()=>next({twin:true}),true); }
    else if(S.wrong>=5 && S.map>1){
      $('fb').insertAdjacentHTML('beforeend','<div class="tip">ผิดติดกัน '+S.wrong+' ข้อ — ถอยไปด่านที่ง่ายกว่าก่อน พอมือเข้าที่แล้วค่อยกลับมา</div>');
      add('ไปด่าน '+(S.map-1),()=>setMap(S.map-1),true);
      add('ดื้ออยู่ด่านนี้ต่อ',()=>next({}));
    }else if(S.wrong>=3 && Q.tpl.sub){
      $('fb').insertAdjacentHTML('beforeend','<div class="tip">ลองทำทีละขั้นดู จะเห็นว่าติดที่ขั้นไหน</div>');
      add('ทำขั้นย่อย',()=>{subMode=true;render();},true);
      add('ข้อฝาแฝด เลขใหม่',()=>next({twin:true}));
    }else{
      add('ข้อฝาแฝด เลขใหม่',()=>next({twin:true}),true);
      add('ข้อต่อไป',()=>next({}));
    }
  }
  $('fb').appendChild(bar);
}

/* ---------- ส่งผลให้ครู: สร้างรหัสผลให้คัดลอกไปวางในไลน์ ---------- */
const WHOKEY = 'kp-drill:who';
let TOPIC_ID = 'unset';

function myCode(){
  const who = (($('who')&&$('who').value) || '').trim();
  try{ who ? localStorage.setItem(WHOKEY, who) : localStorage.removeItem(WHOKEY); }catch(e){}
  const d = new Date();
  const date = d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
  const tries = LEVELS.reduce((a,l)=>a+(S.tries[l.n]||0),0);
  return KPRANK.pack({who, topic:TOPIC_ID, lv:S.lv, m:LEVELS.map(l=>S.m[l.n]||0),
                      points:S.score, tries, date});
}

/* ---------- กระดานอันดับของหัวข้อนี้ ----------
   เด็กกดดูได้เองว่าตัวเองอยู่อันดับไหน ไม่ต้องรอครูประกาศ
   อ่านจากคลังอันดับที่มีแค่ชื่อ ระดับ แต้ม ผลเต็มของแต่ละคนยังอ่านได้เฉพาะเจ้าของกับครู */
function rankRows(list, meUid){
  const meAt = list.findIndex(r=>r.uid===meUid);
  /* โชว์ 10 อันดับแรก บวกคนที่อยู่ติดเราทั้งบนและล่าง จะได้รู้ว่ากำลังไล่ใครอยู่ */
  const keep = new Set();
  for(let i=0;i<Math.min(10,list.length);i++) keep.add(i);
  if(meAt>=0) for(let i=meAt-1;i<=meAt+1;i++) if(i>=0 && i<list.length) keep.add(i);
  const idx=[...keep].sort((a,b)=>a-b);
  let out='', prev=-1;
  for(const i of idx){
    if(prev>=0 && i>prev+1) out+='<li class="rk-gap">⋯</li>';
    prev=i;
    const r=list[i], me=r.uid===meUid;
    out += '<li class="'+(me?'rk-me':'')+(i<3?' rk-top':'')+'">'+
      '<span class="rk-n">'+(i+1)+'</span>'+
      '<span class="rk-w">'+esc(r.name)+(me?' <em>(เรา)</em>':'')+'</span>'+
      '<span class="rk-l">ระดับ '+(r.lv||1)+'</span>'+
      '<span class="rk-p">'+Math.round(r.points||0).toLocaleString('th-TH')+' แต้ม</span></li>';
  }
  return out;
}
async function rankUI(){
  const box=$('rankbox'); if(!box) return;
  const close='<button type="button" class="sh-x" id="rkx">ปิด</button>';
  box.hidden=false;
  box.innerHTML='<div class="sh-head"><b>อันดับในหัวข้อนี้</b>'+close+'</div>'+
                '<p class="sh-note">กำลังดึงอันดับ…</p>';
  $('rkx').onclick=()=>{ box.hidden=true; };
  if(!window.KPAUTH || KPAUTH.failed() || !KPAUTH.user()){
    box.innerHTML='<div class="sh-head"><b>อันดับในหัวข้อนี้</b>'+close+'</div>'+
      '<p class="sh-note">ต้องเข้าสู่ระบบก่อนถึงจะเห็นอันดับ</p>';
    $('rkx').onclick=()=>{ box.hidden=true; };
    return;
  }
  try{ KPAUTH.flush(); }catch(e){}        /* ส่งแต้มล่าสุดขึ้นก่อน จะได้ไม่ดูอันดับของเมื่อกี้ */
  const list = await KPAUTH.rankList(TOPIC_ID);
  const me = KPAUTH.user() ? KPAUTH.user().uid : null;
  if(!list){
    box.innerHTML='<div class="sh-head"><b>อันดับในหัวข้อนี้</b>'+close+'</div>'+
      '<p class="sh-note">ดึงอันดับไม่สำเร็จ ลองใหม่อีกครั้ง</p>';
  }else if(!list.length){
    box.innerHTML='<div class="sh-head"><b>อันดับในหัวข้อนี้</b>'+close+'</div>'+
      '<p class="sh-note">ยังไม่มีใครในกระดาน ทำโจทย์สักข้อแล้วกลับมาดูใหม่</p>';
  }else{
    const at = list.findIndex(r=>r.uid===me);
    const head = at>=0
      ? 'อันดับของเรา <b>'+(at+1)+'</b> จาก '+list.length+' คน'
      : 'ยังไม่มีชื่อเราในกระดาน ทำโจทย์สักข้อก่อน';
    box.innerHTML='<div class="sh-head"><b>อันดับในหัวข้อนี้</b>'+close+'</div>'+
      '<p class="rk-sum">'+head+'</p>'+
      '<ol class="rk">'+rankRows(list, me)+'</ol>'+
      '<p class="sh-note">เรียงตามระดับที่ไปถึงก่อน ระดับเท่ากันจึงดูแต้ม · อันดับขยับช้ากว่าที่ทำจริงไม่กี่วินาที</p>';
  }
  $('rkx').onclick=()=>{ box.hidden=true; };
  box.scrollIntoView({behavior:'smooth', block:'nearest'});
}

function shareUI(){
  const box = $('sharebox'); if(!box) return;
  let who=''; try{ who = localStorage.getItem(WHOKEY) || ''; }catch(e){}
  box.innerHTML =
    '<div class="sh-head"><b>ส่งผลให้ครู</b>' +
      '<button type="button" class="sh-x" id="shx">ปิด</button></div>' +
    '<label class="sh-row">ชื่อของฉัน <input id="who" maxlength="24" placeholder="ชื่อ-ชั้น เช่น สมชาย ม.3/1" value="' +
      who.replace(/"/g,'&quot;') + '"></label>' +
    '<textarea id="shcode" readonly rows="3" spellcheck="false"></textarea>' +
    '<div class="sh-act"><button type="button" class="go" id="shcopy">คัดลอกรหัสผล</button>' +
      '<span class="sh-msg" id="shmsg"></span></div>' +
    '<p class="sh-note">คัดลอกแล้วส่งให้ครูในไลน์ได้เลย รหัสนี้บอกชื่อ ระดับ ความชำนาญทุกระดับ และแต้มของเรา</p>';
  const ta = $('shcode'), re = () => { ta.value = myCode(); };
  re(); $('who').oninput = re;
  $('shx').onclick = () => { box.hidden = true; };
  $('shcopy').onclick = async () => {
    ta.select(); let ok=false;
    try{ await navigator.clipboard.writeText(ta.value); ok=true; }
    catch(e){ try{ ok = document.execCommand('copy'); }catch(e2){} }
    $('shmsg').textContent = ok ? 'คัดลอกแล้ว ไปวางในไลน์ได้' : 'คัดลอกไม่ได้ กดค้างที่รหัสเพื่อคัดลอกเอง';
  };
  box.hidden = false;
  box.scrollIntoView({behavior:'smooth', block:'nearest'});
}

/* ---------- ด่านล็อกอิน ----------
   ครูขอให้เข้าสู่ระบบก่อนทำโจทย์ เพื่อให้ผลของเด็กไปถึงครูทุกคนโดยไม่ต้องส่งรหัส
   แต่ถ้าต่อ Firebase ไม่ได้เลย (เน็ตล่ม โรงเรียนบล็อก) ต้องปล่อยให้ทำได้
   ไม่งั้นเด็กที่เน็ตไม่ดีจะถูกกันออกจากบทเรียนทั้งบท ซึ่งแย่กว่าการไม่มีผลส่งครู */
let gateOn = null;            /* null = ยังไม่เคยวาด */
function needLogin(){
  if(!window.KPAUTH) return false;          /* ไม่มีไฟล์ล็อกอิน ก็ให้ทำได้ */
  if(KPAUTH.failed()) return false;         /* ต่อไม่ได้จริง ๆ ปล่อยผ่าน */
  return !KPAUTH.user();
}
function gateHTML(waiting){
  if(waiting) return '<div class="gate-in"><div class="gate-wait">กำลังตรวจสอบบัญชี…</div></div>';
  return '<div class="gate-in">'+
    '<div class="gate-ic" aria-hidden="true">'+
      '<svg viewBox="0 0 48 48"><path d="M14 21v-5a10 10 0 0 1 20 0v5" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>'+
      '<rect x="9" y="21" width="30" height="20" rx="4.5" fill="currentColor"/>'+
      '<circle cx="24" cy="30" r="2.6" fill="var(--card)"/><path d="M24 32v4" stroke="var(--card)" stroke-width="2.6" stroke-linecap="round"/></svg>'+
    '</div>'+
    '<h2>เข้าสู่ระบบก่อนเริ่มทำโจทย์</h2>'+
    '<p>ใช้บัญชีเดียวกับเว็บคอร์ส ไม่ต้องสมัครใหม่ ล็อกอินแล้วความคืบหน้าจะตามไปทุกเครื่อง และครูเห็นผลได้เลยโดยไม่ต้องส่งรหัส</p>'+
    '<div class="gate-acct" id="gacct"></div>'+
    '<p class="gate-sm">ยังไม่มีบัญชี สมัครที่เว็บคอร์สก่อน แล้วกลับมาล็อกอินที่นี่</p>'+
  '</div>';
}
/* วาดหรือเก็บด่านล็อกอิน คืนค่า true ถ้าตอนนี้ยังเล่นไม่ได้ */
function gateUI(){
  const g=$('gate'), play=$('play');
  if(!g || !play) return false;
  const waiting = window.KPAUTH && !KPAUTH.ready() && !KPAUTH.failed();
  const lock = waiting || needLogin();
  const stateKey = lock ? (waiting?'wait':'lock') : 'open';
  if(gateOn !== stateKey){
    gateOn = stateKey;
    g.hidden = !lock; play.hidden = lock;
    const sh=$('share'), rs=$('reset'), rk=$('rankbtn');
    if(sh) sh.hidden = lock;
    if(rs) rs.hidden = lock;
    if(rk) rk.hidden = lock;
    if(lock){
      g.innerHTML = gateHTML(waiting);
      if(!waiting && window.KPAUTH){
        KPAUTH.mount($('gacct'));
        /* ในด่านนี้กางช่องกรอกให้เลย ไม่ต้องให้เด็กกดอีกชั้น */
        const b=$('gacct') && $('gacct').querySelector('.acct-btn');
        if(b) b.click();
      }
    } else g.innerHTML='';
  }
  return lock;
}

/* ---------- เริ่มเกมของหัวข้อหนึ่ง ---------- */
function start(topic){
  LEVELS = topic.levels; T = topic.templates; FIGS = topic.figs || {};
  CARDS = topic.cards || [];
  TOPIC_ID = topic.id;
  KEY = 'kp-drill:' + topic.id;
  S = load();
  const set=(id,v)=>{const el=$(id); if(el&&v) el.textContent=v;};
  set('title', topic.title); set('sub', topic.sub); set('note', topic.note);
  if(topic.title) document.title = topic.title + ' · KP Science';
  const rb=$('reset');
  if(rb) rb.onclick=()=>{
    if(rb.dataset.c){ S=fresh(); save(); next({}); rb.textContent='ล้างความคืบหน้า'; delete rb.dataset.c; }
    else { rb.dataset.c=1; rb.textContent='กดอีกครั้งเพื่อยืนยันการล้าง'; }
  };
  /* นับวันที่เข้ามาทำ สะสมอย่างเดียว ขาดวันไม่รีเซ็ต จะได้ไม่กลายเป็นภาระ */
  S.days=S.days||[];
  if(S.days.indexOf(today())<0){ S.days.push(today()); if(S.days.length>400) S.days.shift(); save(); }
  /* แถบบัญชี — ล็อกอินแล้วดึงความคืบหน้าจากคลาวด์มารวมกับของเครื่องนี้ */
  if(window.KPAUTH){
    KPAUTH.mount($('acct'));
    let lastUid=null;
    KPAUTH.onChange(async u=>{
      const was=gateOn;
      if(!gateUI() && was && was!=='open') next({});  /* เพิ่งล็อกอินผ่าน ก็เริ่มโจทย์ให้เลย */
      const uid=u?u.uid:null;
      if(uid===lastUid) return;
      lastUid=uid;
      if(!u) return;
      const cloud=await KPAUTH.pull(TOPIC_ID);
      const changed=mergeCloud(cloud);
      save();                       /* ไม่มีของเก่าบนคลาวด์ก็ถือว่าอัปของเครื่องนี้ขึ้นไป */
      if(changed){ head(); cardsUI(); }
      const n=$('note');
      if(n) n.textContent='ซิงค์กับบัญชี '+KPAUTH.name()+' แล้ว';
    });
    window.addEventListener('beforeunload',()=>{ try{KPAUTH.flush();}catch(e){} });
  }
  const mp=$('map');
  if(mp) mp.addEventListener('click', e=>{
    const b=e.target.closest('button[data-m]'); if(!b||b.disabled) return;
    setMap(+b.dataset.m);
  });
  const pi=$('pinfo'), mo=$('more');
  if(pi && mo) pi.onclick=()=>{
    const open = mo.hidden;
    mo.hidden = !open; pi.setAttribute('aria-expanded', open?'true':'false');
    pi.classList.toggle('on', open);
    if(open) mo.innerHTML = moreHTML(LEVELS.find(l=>l.n===S.lv)||LEVELS[0]);
  };
  gateUI();
  questUI(); cardsUI();
  const sh=$('share');
  if(sh) sh.onclick=()=>{ const b=$('sharebox'); if(b && !b.hidden){ b.hidden=true; } else { shareUI(); } };
  const rb2=$('rankbtn');
  if(rb2) rb2.onclick=()=>{ const b=$('rankbox'); if(b && !b.hidden){ b.hidden=true; } else { rankUI(); } };
  next({});
}

window.DRILL = Object.assign(window.DRILL||{}, {start, U, UNITS, CCW, CW, RULE,
  fig:{G, beamFig, armFig, lFig, angleFig, FW, FX0, FX1}});
})();
