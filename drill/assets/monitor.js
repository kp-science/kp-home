/* หน้ามอนิเตอร์ — ดูนักเรียนทุกคนทุกหัวข้อในหน้าเดียว แยกกระดานอันดับรายหัวข้อ
   อ่านจาก drill_scores ซึ่งกฎความปลอดภัยเปิดให้เฉพาะแอดมินกับครูเท่านั้น
   หน้านี้จึงไม่ต้องเช็คสิทธิ์เอง ถ้าไม่มีสิทธิ์จะอ่านไม่ออกตั้งแต่ชั้นฐานข้อมูล */
(function(){
"use strict";
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const META = window.TOPICMETA || {};
const EVERY = 60000;                       /* รีเฟรชเองทุกหนึ่งนาที */

let docs = [], at = 0, timer = null, busy = false;

const topicName = t => (META[t] && META[t].name) || t;
const levelsOf  = t => (META[t] && META[t].levels) || [];
const num = n => Math.round(Number(n)||0).toLocaleString('th-TH');

function whoOf(d){ return d.name || (d.email||'').split('@')[0] || 'ไม่ระบุชื่อ'; }
function triesOf(d){ return Object.values(d.tries||{}).reduce((a,b)=>a+(Number(b)||0),0); }

/* เวลาล่าสุดที่เด็กคนนี้ขยับ — ใช้บอกว่าใครกำลังทำอยู่ตอนนี้ */
function tsOf(d){
  const t = d.updatedAt;
  if (t && t.toDate) return t.toDate().getTime();
  return 0;
}
function ago(ms){
  if (!ms) return '—';
  const s = Math.max(0, Math.round((Date.now()-ms)/1000));
  if (s < 90) return 'เมื่อครู่';
  const m = Math.round(s/60);
  if (m < 60) return m + ' นาทีที่แล้ว';
  const h = Math.round(m/60);
  if (h < 24) return h + ' ชม.ที่แล้ว';
  const dy = Math.round(h/24);
  return dy < 30 ? dy + ' วันที่แล้ว' : 'นานกว่าเดือน';
}

/* เรียงตามระดับที่ไปถึงก่อน ระดับเท่ากันจึงดูแต้ม — ตามที่ครูเลือกไว้ */
function rank(list){
  return list.slice().sort((a,b)=>
    (b.lv||0)-(a.lv||0) || (b.points||0)-(a.points||0) ||
    String(whoOf(a)).localeCompare(String(whoOf(b)),'th'));
}

/* แถบความชำนาญทุกระดับ เหมือนหน้าสรุปผลครู จะได้อ่านแบบเดียวกัน */
function cells(d){
  const L = levelsOf(d.topicId);
  const keys = L.length ? L.map(l=>l.n) : Object.keys(d.m||{}).map(Number).sort((a,b)=>a-b);
  if (!keys.length) return '';
  return '<div class="lvcells">' + keys.map((n,i)=>{
    const v = Math.round(Number((d.m||{})[n])||0);
    const cls = v >= 100 ? 'c-done' : n === d.lv ? 'c-now' : v > 0 ? 'c-part' : 'c-none';
    const t = (L[i] ? 'ระดับ ' + n + ' ' + L[i].t : 'ระดับ ' + n) + ' · ' + v + '/100';
    return '<i class="' + cls + '" title="' + esc(t) + '"><span style="height:' +
      Math.max(6, Math.min(100, v)) + '%"></span></i>';
  }).join('') + '</div>';
}

function board(topic, list){
  const rows = rank(list).map((d,i)=>
    '<tr class="' + (i<3?'rk-top':'') + '">' +
      '<td class="rk-n">' + (i+1) + '</td>' +
      '<td class="rk-w">' + esc(whoOf(d)) + '</td>' +
      '<td>' + (d.lv||1) + '</td>' +
      '<td>' + num(d.points) + '</td>' +
      '<td>' + num(triesOf(d)) + '</td>' +
      '<td class="rk-c">' + cells(d) + '</td>' +
      '<td class="rk-t">' + ago(tsOf(d)) + '</td>' +
    '</tr>').join('');
  const live = new Set(list.filter(d=>Date.now()-tsOf(d) < 15*60000).map(d=>d.uid)).size;
  return '<section class="bd">' +
    '<div class="bd-h"><h2>' + esc(topicName(topic)) + '</h2>' +
      '<span class="bd-c">' + list.length + ' คน' +
      (live ? ' · กำลังทำอยู่ ' + live : '') + '</span></div>' +
    '<div class="scroll"><table class="rk-tb"><thead><tr>' +
      '<th>อันดับ</th><th>ชื่อ</th><th>ระดับ</th><th>แต้ม</th><th>ข้อที่ทำ</th>' +
      '<th>ความชำนาญทุกระดับ</th><th>ขยับล่าสุด</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div></section>';
}

function draw(){
  const out = $('boards');
  if (!docs.length){
    out.innerHTML = '<p class="none">ยังไม่มีนักเรียนที่ล็อกอินเข้ามาทำโจทย์</p>';
    $('tot').textContent = '';
    return;
  }
  const by = new Map();
  for (const d of docs){
    const t = d.topicId || 'ไม่ระบุหัวข้อ';
    if (!by.has(t)) by.set(t, []);
    by.get(t).push(d);
  }
  /* หัวข้อที่มีคนทำมากที่สุดขึ้นก่อน ครูจะได้เห็นห้องที่กำลังเรียนอยู่ทันที */
  const order = [...by.keys()].sort((a,b)=> by.get(b).length - by.get(a).length ||
                                            topicName(a).localeCompare(topicName(b),'th'));
  out.innerHTML = order.map(t => board(t, by.get(t))).join('');
  const people = new Set(docs.map(d=>d.uid)).size;
  /* นับเป็นจำนวนคน ไม่ใช่จำนวนเอกสาร คนเดียวทำหลายหัวข้อต้องนับหนึ่ง */
  const live = new Set(docs.filter(d=>Date.now()-tsOf(d) < 15*60000).map(d=>d.uid)).size;
  $('tot').textContent = 'นักเรียน ' + people + ' คน · ' + by.size + ' หัวข้อ' +
                         (live ? ' · กำลังทำอยู่ ' + live + ' คน' : '');
}

async function pull(quiet){
  if (busy) return;
  const msg = $('mmsg'), btn = $('mrefresh');
  if (!window.KPAUTH || !KPAUTH.user()){
    if (!quiet && msg) msg.textContent = 'ต้องเข้าสู่ระบบด้วยบัญชีครูหรือแอดมินก่อน';
    return;
  }
  busy = true; if (btn) btn.disabled = true;
  if (msg && !quiet) msg.textContent = 'กำลังดึง…';
  const got = await KPAUTH.classList();
  busy = false; if (btn) btn.disabled = false;
  if (!got){
    if (msg) msg.textContent = 'ดึงไม่สำเร็จ — บัญชีนี้อาจไม่มีสิทธิ์ครู หรือกฎความปลอดภัยยังไม่ได้อัปเดต';
    return;
  }
  docs = got; at = Date.now();
  draw();
  if (msg) msg.textContent = 'อัปเดตล่าสุด ' + new Date(at).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'});
}

/* นาฬิกาของข้อความ "เมื่อครู่ / 5 นาทีที่แล้ว" ต้องเดินเองด้วย ไม่งั้นค้างอยู่ที่ตอนดึง */
function tick(){ if (docs.length) draw(); }

if (window.KPAUTH){
  KPAUTH.mount($('acct'));
  const btn = $('mrefresh');
  if (btn) btn.onclick = () => pull(false);
  let first = true;
  KPAUTH.onChange(u => {
    const bar = $('signinbar'), tools = $('mtools');
    if (bar) bar.classList.toggle('done', !!u);
    if (tools) tools.hidden = !u;
    if (u && first){ first = false; pull(true); timer = setInterval(()=>pull(true), EVERY); }
    if (!u){
      first = true; docs = []; $('boards').innerHTML = '';
      $('tot').textContent = '';
      if (timer){ clearInterval(timer); timer = null; }
    }
  });
}
setInterval(tick, 60000);
})();
