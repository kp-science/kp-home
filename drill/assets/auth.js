/* ล็อกอินและซิงค์ความคืบหน้า — ใช้บัญชีเดียวกับเว็บคอร์ส (Firebase โปรเจกต์ kp-course)
   เด็กที่มีบัญชีคอร์สอยู่แล้วจึงไม่ต้องสมัครใหม่ และครูเห็นผลได้โดยไม่ต้องให้เด็กส่งรหัส

   หลักที่ยึดไว้: เว็บต้องเล่นได้เหมือนเดิมทุกอย่างแม้ไม่ล็อกอินหรือเน็ตล่ม
   ล็อกอินเป็นของแถม ไม่ใช่เงื่อนไข — ถ้าโหลด Firebase ไม่ได้ หน้าเกมต้องไม่พัง */
window.KPAUTH = (function(){
"use strict";

/* ค่าเชื่อมต่อชุดเดียวกับ course.kpscience.com — ไม่ใช่ความลับ ความปลอดภัยอยู่ที่ firestore.rules */
const CFG = {
  apiKey: "AIzaSyA1j8oFaZR33GIxaGccBzd1j65GrhnbrcY",
  authDomain: "kp-course.firebaseapp.com",
  projectId: "kp-course",
  storageBucket: "kp-course.firebasestorage.app",
  messagingSenderId: "744510272844",
  appId: "1:744510272844:web:89bdf91d7c97fa59048be9"
};
const SDK = 'https://www.gstatic.com/firebasejs/9.23.0/';
const COL = 'drill_scores';
/* กระดานอันดับแยกคนละที่กับผลเต็ม เพราะเพื่อนร่วมชั้นต้องอ่านได้
   จึงใส่เฉพาะชื่อที่ตั้งเอง ระดับ และแต้ม ไม่มีอีเมล ไม่มีเลือด ไม่มีจำนวนครั้งที่ตก */
const RANKCOL = 'drill_rank';

let fb=null, auth=null, db=null, user=null, ready=false, failed=false;
const subs=[];
const notify=()=>subs.forEach(f=>{try{f(user);}catch(e){}});

function load(src){
  return new Promise((ok,bad)=>{
    const s=document.createElement('script');
    s.src=src; s.async=false; s.onload=ok; s.onerror=()=>bad(new Error('โหลดไม่ได้ '+src));
    document.head.appendChild(s);
  });
}

/* โหลด SDK ตอนเปิดหน้า แต่ไม่บล็อกอะไรเลย ถ้าโหลดไม่ได้ก็แค่ไม่มีปุ่มล็อกอิน */
let booting=null;
function boot(){
  if(booting) return booting;
  booting = (async () => {
    try{
      if(!window.firebase) {
        await load(SDK+'firebase-app-compat.js');
        await load(SDK+'firebase-auth-compat.js');
        await load(SDK+'firebase-firestore-compat.js');
      }
      fb = window.firebase;
      const app = fb.apps && fb.apps.length ? fb.app() : fb.initializeApp(CFG);
      auth = fb.auth(app); db = fb.firestore(app);
      await auth.setPersistence(fb.auth.Auth.Persistence.LOCAL).catch(()=>{});
      auth.onAuthStateChanged(u=>{ user=u||null; ready=true; notify(); });
      return true;
    }catch(e){
      failed=true; ready=true; notify();
      console.warn('ล็อกอินใช้ไม่ได้ในตอนนี้', e);
      return false;
    }
  })();
  return booting;
}

const nameOf = u => u ? (u.displayName || (u.email||'').split('@')[0] || 'นักเรียน') : '';
const msg = e => {
  const c = (e && e.code) || '';
  if(c.indexOf('wrong-password')>=0 || c.indexOf('invalid-credential')>=0) return 'อีเมลหรือรหัสผ่านไม่ถูก';
  if(c.indexOf('user-not-found')>=0) return 'ยังไม่มีบัญชีนี้ สมัครที่เว็บคอร์สก่อน';
  if(c.indexOf('too-many-requests')>=0) return 'ลองผิดหลายครั้ง รอสักครู่แล้วลองใหม่';
  if(c.indexOf('popup-blocked')>=0) return 'เบราว์เซอร์บล็อกหน้าต่างล็อกอิน อนุญาตป๊อปอัปของเว็บนี้ก่อน';
  if(c.indexOf('popup-closed')>=0) return 'ปิดหน้าต่างล็อกอินไปก่อนจะเสร็จ';
  if(c.indexOf('unauthorized-domain')>=0) return 'โดเมนนี้ยังไม่ได้อนุญาตใน Firebase (ครูต้องเพิ่ม www.kpscience.com ใน Authorized domains)';
  return (e && e.message) || 'ล็อกอินไม่สำเร็จ';
};

async function loginGoogle(){
  await boot(); if(!auth) throw new Error('ระบบล็อกอินยังไม่พร้อม');
  try{ await auth.signInWithPopup(new fb.auth.GoogleAuthProvider()); }
  catch(e){ throw new Error(msg(e)); }
}
async function loginEmail(email, pass){
  await boot(); if(!auth) throw new Error('ระบบล็อกอินยังไม่พร้อม');
  try{ await auth.signInWithEmailAndPassword(String(email).trim(), pass); }
  catch(e){ throw new Error(msg(e)); }
}
async function logout(){ if(auth) await auth.signOut(); }

/* ---------- ความคืบหน้าบนคลาวด์ ----------
   หนึ่งหัวข้อหนึ่งเอกสาร ใช้ uid_topicId เป็นชื่อ เพื่อให้กฎความปลอดภัยตรวจเจ้าของได้ตรง ๆ */
const idOf = topic => (user ? user.uid : 'x') + '_' + topic;
const intMap = (o,max)=>{ const r={}; let n=0;
  for(const k in (o||{})){ if(n++>=max) break; const v=Math.round(Number(o[k])||0); if(v>0) r[k]=v; }
  return r; };

async function pull(topic){
  await boot(); if(!db || !user) return null;
  try{
    const s = await db.collection(COL).doc(idOf(topic)).get();
    return s.exists ? s.data() : null;
  }catch(e){ console.warn('อ่านความคืบหน้าจากคลาวด์ไม่ได้', e); return null; }
}

async function push(topic, S){
  await boot(); if(!db || !user) return false;
  const data = {
    uid: user.uid,
    email: (user.email||'').toLowerCase(),
    name: nameOf(user).slice(0,200),
    topicId: String(topic).slice(0,60),
    lv: Math.max(0, Math.min(50, Math.round(S.lv||1))),
    m: intMap(S.m, 40),
    tries: intMap(S.tries, 40),
    points: Math.max(0, Math.min(1000000, Math.round(S.score||0))),
    hp: Math.max(0, Math.min(1000, Math.round(S.hp||0))),
    downs: Math.max(0, Math.min(10000, Math.round(S.downs||0))),
    updatedAt: fb.firestore.FieldValue.serverTimestamp(),
  };
  try{ await db.collection(COL).doc(idOf(topic)).set(data); return true; }
  catch(e){ console.warn('บันทึกขึ้นคลาวด์ไม่ได้', e); return false; }
}

/* ---------- กระดานอันดับ ---------- */
async function pushRank(topic, S){
  await boot(); if(!db || !user) return false;
  const data = {
    uid: user.uid,
    name: nameOf(user).slice(0,60),
    topicId: String(topic).slice(0,60),
    lv: Math.max(0, Math.min(50, Math.round(S.lv||1))),
    points: Math.max(0, Math.min(1000000, Math.round(S.score||0))),
    updatedAt: fb.firestore.FieldValue.serverTimestamp(),
  };
  try{ await db.collection(RANKCOL).doc(idOf(topic)).set(data); return true; }
  catch(e){ console.warn('ส่งอันดับไม่ได้', e); return false; }
}

/* รายชื่อทั้งหัวข้อ เรียงระดับก่อน แล้วค่อยแต้ม ตามที่ครูเลือกไว้ */
async function rankList(topic){
  await boot(); if(!db || !user) return null;
  try{
    const s = await db.collection(RANKCOL).where('topicId','==',topic).get();
    const list = s.docs.map(d=>d.data()).filter(d=>d && d.name);
    list.sort((a,b)=> (b.lv||0)-(a.lv||0) || (b.points||0)-(a.points||0)
                      || String(a.name).localeCompare(String(b.name),'th'));
    return list;
  }catch(e){ console.warn('อ่านกระดานอันดับไม่ได้', e); return null; }
}

/* ส่งขึ้นคลาวด์แบบหน่วงไว้ ไม่ให้ยิงทุกครั้งที่กดตรวจคำตอบ */
let timer=null, pending=null;
function pushLater(topic, S, ms){
  pending={topic, S};
  if(timer) return;
  timer=setTimeout(()=>{ timer=null; const p=pending; pending=null;
    if(p){ push(p.topic, p.S); pushRank(p.topic, p.S); } }, ms||6000);
}
function flush(){ if(pending){ const p=pending; pending=null; clearTimeout(timer); timer=null;
  push(p.topic, p.S); pushRank(p.topic, p.S); } }

/* ---------- สำหรับหน้าครู ---------- */
async function classList(topic){
  await boot(); if(!db || !user) return null;
  try{
    let q = db.collection(COL);
    if(topic) q = q.where('topicId','==',topic);
    const s = await q.get();
    return s.docs.map(d=>d.data());
  }catch(e){ console.warn('ดึงผลนักเรียนไม่ได้', e); return null; }
}

function onChange(cb){ subs.push(cb); if(ready) cb(user); boot(); return ()=>{const i=subs.indexOf(cb); if(i>=0) subs.splice(i,1);}; }

/* ---------- ปุ่มล็อกอินและกล่องกรอก ----------
   วางไว้มุมหัวเรื่อง เล็ก ๆ ไม่แย่งที่โจทย์ ตอนยังไม่ล็อกอินเป็นแค่ปุ่มเดียว */
function esc(x){ return String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }

function mount(box){
  if(!box) return;
  let open=false, busy=false, err='';

  function draw(){
    if(failed){ box.innerHTML='<span class="acct-off" title="เชื่อมต่อระบบล็อกอินไม่ได้ ตอนนี้ความคืบหน้าเก็บในเครื่องอย่างเดียว">ออฟไลน์</span>'; return; }
    if(user){
      box.innerHTML='<div class="acct-in"><span class="acct-nm" title="'+esc(user.email||'')+'">'+esc(nameOf(user))+'</span>'+
        '<button type="button" class="acct-out">ออกจากระบบ</button></div>';
      box.querySelector('.acct-out').onclick=async()=>{ flush(); await logout(); };
      return;
    }
    box.innerHTML='<button type="button" class="acct-btn">เข้าสู่ระบบ</button>'+
      (open ? '<div class="acct-pop">'+
        '<div class="acct-h">ใช้บัญชีเดียวกับเว็บคอร์ส</div>'+
        '<button type="button" class="acct-g">เข้าด้วยบัญชี Google</button>'+
        '<div class="acct-or">หรือใช้อีเมล</div>'+
        '<input type="email" class="acct-e" placeholder="อีเมล" autocomplete="username">'+
        '<input type="password" class="acct-p" placeholder="รหัสผ่าน" autocomplete="current-password">'+
        '<button type="button" class="acct-go">เข้าสู่ระบบ</button>'+
        (err?'<div class="acct-err">'+esc(err)+'</div>':'')+
        '<div class="acct-note">ล็อกอินแล้วความคืบหน้าจะตามไปทุกเครื่อง และครูเห็นผลได้เลยโดยไม่ต้องส่งรหัส · ยังไม่มีบัญชี สมัครที่เว็บคอร์ส</div>'+
      '</div>' : '');
    box.querySelector('.acct-btn').onclick=()=>{ open=!open; err=''; draw(); };
    if(!open) return;
    const stop=b=>{ busy=b; const g=box.querySelector('.acct-g'), go=box.querySelector('.acct-go');
      if(g) g.disabled=b; if(go) go.disabled=b; };
    const run=async fn=>{ if(busy) return; stop(true); err='';
      try{ await fn(); open=false; }catch(e){ err=e.message||String(e); }
      stop(false); draw(); };
    box.querySelector('.acct-g').onclick=()=>run(()=>loginGoogle());
    box.querySelector('.acct-go').onclick=()=>run(()=>loginEmail(
      box.querySelector('.acct-e').value, box.querySelector('.acct-p').value));
    box.querySelector('.acct-p').onkeydown=e=>{ if(e.key==='Enter') box.querySelector('.acct-go').click(); };
  }

  onChange(()=>{ open=false; err=''; draw(); });
  draw();
}

return {
  boot, onChange, mount, loginGoogle, loginEmail, logout,
  pull, push, pushLater, flush, classList, pushRank, rankList,
  user: ()=>user, name: ()=>nameOf(user), ready: ()=>ready, failed: ()=>failed,
};
})();
