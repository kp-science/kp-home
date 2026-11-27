/* หน้าสรุปผลครู — อ่าน "รหัสผล" ที่นักเรียนคัดลอกมาส่ง แล้วสรุปว่าใครติดระดับไหน
   ไม่มีเซิร์ฟเวอร์ รายชื่อที่วางแล้วเก็บไว้ในเครื่องครูเอง (localStorage) */
(function(){
"use strict";
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const META = window.TOPICMETA || {};
const KEY = 'kp-drill:class';

let rows = [];
let sortBy = 'score', desc = true;

/* ---------- เก็บ/อ่านรายชื่อในเครื่องครู ---------- */
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(rows.map(r=>r.raw))); }catch(e){} }
function load(){
  let raw = [];
  try{ raw = JSON.parse(localStorage.getItem(KEY)) || []; }catch(e){ raw = []; }
  rows = raw.map(KPRANK.unpack).filter(Boolean);
}

/* ชื่อเดียวหัวข้อเดียว เก็บผลใหม่สุด (วันเดียวกันเก็บอันที่คะแนนสูงกว่า) */
function keyOf(r){ return r.who.trim().toLowerCase() + '\u0000' + r.topic; }
function merge(list){
  const by = new Map();
  for (const r of rows.concat(list)){
    const k = keyOf(r), old = by.get(k);
    if (!old) { by.set(k, r); continue; }
    const newer = (r.date || '') > (old.date || '') ||
                  ((r.date || '') === (old.date || '') && r.score >= old.score);
    if (newer) by.set(k, r);
  }
  rows = [...by.values()];
}

/* ---------- วางรหัส ---------- */
function add(){
  const text = $('paste').value;
  const lines = text.split(/[\r\n]+/).map(s=>s.trim()).filter(Boolean);
  const good = [], bad = [];
  for (const ln of lines){
    const r = KPRANK.unpack(ln);
    if (r) good.push(r); else bad.push(ln);
  }
  merge(good);
  save(); draw();
  $('paste').value = bad.join('\n');
  const parts = [];
  if (good.length) parts.push('เพิ่ม/อัปเดต ' + good.length + ' คน');
  const edited = good.filter(r=>!r.ok).length;
  if (edited) parts.push('มี ' + edited + ' รหัสที่เลขตรวจไม่ตรง (อาจพิมพ์ตกหรือถูกแก้)');
  if (bad.length) parts.push('อ่านไม่ออก ' + bad.length + ' บรรทัด ยังค้างอยู่ในช่องให้แก้');
  if (!lines.length) parts.push('ยังไม่ได้วางรหัสอะไรลงไป');
  $('pmsg').textContent = parts.join(' · ');
}

/* ---------- ดึงผลจากคลาวด์ (นักเรียนที่ล็อกอินด้วยบัญชีคอร์ส) ----------
   แปลงเอกสารของคลาวด์ให้อยู่ในรูปเดียวกับรหัสที่นักเรียนส่งมา
   ตารางและสรุปผลด้านล่างจึงใช้โค้ดเดิมได้ทั้งหมด */
function pad(n){ return String(n).padStart(2,'0'); }
function dateOf(ts){
  const d = ts && ts.toDate ? ts.toDate() : new Date();
  return d.getFullYear() + pad(d.getMonth()+1) + pad(d.getDate());
}
function fromCloud(docs){
  return docs.map(d => {
    const lv = levelsOf(d.topicId).map(l => l.n);
    const keys = lv.length ? lv : Object.keys(d.m||{}).map(Number).sort((a,b)=>a-b);
    const m = keys.map(n => Math.round(Number((d.m||{})[n]) || 0));
    if (!m.length) return null;
    const tries = Object.values(d.tries||{}).reduce((a,b)=>a+(Number(b)||0), 0);
    const who = (d.name || (d.email||'').split('@')[0] || 'ไม่ระบุชื่อ');
    return KPRANK.unpack(KPRANK.pack({who, topic:d.topicId, lv:d.lv||1, m,
      points:d.points||0, tries, date:dateOf(d.updatedAt)}));
  }).filter(Boolean);
}

async function pullCloud(){
  const btn = $('cloudbtn'), msg = $('cmsg');
  if (!window.KPAUTH || !KPAUTH.user()){ if(msg) msg.textContent='ต้องล็อกอินด้วยบัญชีครูก่อน'; return; }
  btn.disabled = true; msg.textContent = 'กำลังดึง...';
  const docs = await KPAUTH.classList();
  btn.disabled = false;
  if (!docs){ msg.textContent = 'ดึงไม่สำเร็จ — บัญชีนี้อาจยังไม่มีสิทธิ์ครู หรือกฎความปลอดภัยยังไม่ได้อัปเดต'; return; }
  const list = fromCloud(docs);
  merge(list); save(); draw();
  msg.textContent = list.length ? ('ได้ผลจากคลาวด์ ' + list.length + ' รายการ') : 'ยังไม่มีนักเรียนที่ล็อกอินส่งผลเข้ามา';
}

/* ---------- ตาราง ---------- */
function levelsOf(topic){ return (META[topic] && META[topic].levels) || []; }
function topicName(topic){ return (META[topic] && META[topic].name) || topic; }

function cells(r){
  const L = levelsOf(r.topic);
  return '<div class="lvcells">' + r.m.map((v,i)=>{
    const n = i + 1;
    const cls = v >= 100 ? 'c-done' : n === r.lv ? 'c-now' : v > 0 ? 'c-part' : 'c-none';
    const t = (L[i] ? 'ระดับ ' + n + ' ' + L[i].t : 'ระดับ ' + n) + ' · ' + Math.round(v) + '/100';
    return '<i class="' + cls + '" title="' + esc(t) + '"><span style="height:' +
      Math.max(6, Math.min(100, v)) + '%"></span></i>';
  }).join('') + '</div>';
}

function view(){
  const f = $('ftopic').value;
  let list = f === '*' ? rows.slice() : rows.filter(r=>r.topic === f);
  const q = $('fname').value.trim().toLowerCase();
  if (q) list = list.filter(r=>r.who.toLowerCase().indexOf(q) >= 0);
  const val = {
    who:  r => r.who,
    topic:r => topicName(r.topic),
    lv:   r => r.lv,
    score:r => r.score / (r.max || 1),
    points:r => r.points,
    tries:r => r.tries,
    date: r => r.date || '',
  }[sortBy] || (r=>r.score);
  list.sort((a,b)=>{
    const x = val(a), y = val(b);
    const c = typeof x === 'string' ? x.localeCompare(y, 'th') : (x - y);
    return desc ? -c : c;
  });
  return list;
}

const COLS = [
  ['who','ชื่อ'], ['topic','หัวข้อ'], ['lv','ระดับที่ทำอยู่'], ['score','ความสามารถ'],
  ['points','แต้ม'], ['tries','ข้อที่ทำ'], ['date','ส่งเมื่อ'],
];

function draw(){
  /* ตัวเลือกหัวข้อ */
  const topics = [...new Set(rows.map(r=>r.topic))];
  const sel = $('ftopic'), keep = sel.value;
  sel.innerHTML = '<option value="*">ทุกหัวข้อ</option>' +
    topics.map(t=>'<option value="' + esc(t) + '">' + esc(topicName(t)) + '</option>').join('');
  sel.value = topics.indexOf(keep) >= 0 ? keep : '*';

  const list = view();
  if (!rows.length){
    $('out').innerHTML = '<div class="empty">ยังไม่มีผลของใคร วางรหัสที่นักเรียนส่งมาในช่องข้างบน วางทีเดียวหลายคนได้</div>';
    $('sum').innerHTML = ''; return;
  }

  const head = '<tr>' + COLS.map(([k,n])=>
      '<th data-k="' + k + '" class="' + (sortBy===k ? 'on ' + (desc?'dn':'up') : '') + '">' + n + '</th>'
    ).join('') + '<th>ความชำนาญแต่ละระดับ</th><th></th></tr>';

  const body = list.map((r,i)=>{
    const rk = KPRANK.of(r.score, r.max);
    return '<tr' + (r.ok ? '' : ' class="suspect"') + '>' +
      '<td class="who"><b>' + esc(r.who) + '</b><span class="rkname">' + esc(rk.name) + '</span>' +
        (r.ok ? '' : '<span class="warn" title="เลขตรวจไม่ตรง รหัสอาจพิมพ์ตกหรือถูกแก้">เลขตรวจไม่ตรง</span>') + '</td>' +
      '<td>' + esc(topicName(r.topic)) + '</td>' +
      '<td class="num"><b>' + r.lv + '</b> / ' + r.m.length + '</td>' +
      '<td class="num">' + r.score + ' <span class="of">/ ' + r.max + '</span></td>' +
      '<td class="num">' + r.points + '</td>' +
      '<td class="num">' + r.tries + '</td>' +
      '<td class="num small">' + esc(fmtDate(r.date)) + '</td>' +
      '<td>' + cells(r) + '</td>' +
      '<td><button class="del" data-i="' + rows.indexOf(r) + '" title="ลบคนนี้">✕</button></td>' +
      '</tr>';
  }).join('');

  $('out').innerHTML = '<div class="tbox"><table class="tt"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
  $('out').querySelectorAll('th[data-k]').forEach(th=>th.onclick = ()=>{
    const k = th.dataset.k;
    if (sortBy === k) desc = !desc; else { sortBy = k; desc = k !== 'who'; }
    draw();
  });
  $('out').querySelectorAll('button.del').forEach(b=>b.onclick = ()=>{
    rows.splice(+b.dataset.i, 1); save(); draw();
  });

  summary(list);
  const gi = $('goalin');
  if (gi) gi.onchange = () => {
    try{ localStorage.setItem(GOALKEY, String(Math.max(100, +gi.value || 0))); }catch(e){}
    draw();
  };
}

function fmtDate(d){
  if (!d || d.length !== 8) return d || '—';
  return +d.slice(6,8) + '/' + +d.slice(4,6) + '/' + (+d.slice(0,4) + 543 - 2500);
}

/* ---------- สรุปชั้นเรียน ---------- */
function summary(list){
  if (!list.length){ $('sum').innerHTML = ''; return; }
  const n = list.length;
  const avgLv = list.reduce((a,r)=>a+r.lv,0) / n;
  const avgPct = list.reduce((a,r)=>a+r.score/(r.max||1),0) / n * 100;
  const maxLv = Math.max(...list.map(r=>r.m.length));

  /* ค้างอยู่ระดับไหนกันมากที่สุด = นับคนที่ระดับปัจจุบันยังไม่ถึง 100 */
  const stuck = new Array(maxLv + 1).fill(0);
  /* คนที่เต็มทุกระดับแล้วไม่นับว่าค้าง */
  list.forEach(r=>{ if (r.score < r.max) stuck[r.lv] = (stuck[r.lv]||0) + 1; });
  const peak = Math.max(...stuck.slice(1));
  const worst = stuck.indexOf(peak);
  const L = levelsOf(list[0].topic);
  const done = list.filter(r=>r.score >= r.max).length;
  const totPts = list.reduce((a,r)=>a+r.points, 0);
  const few  = list.filter(r=>r.tries < 10).length;

  const bars = stuck.slice(1).map((c,i)=>{
    const h = peak ? Math.round(c / peak * 100) : 0;
    return '<div class="hb' + (i+1 === worst ? ' hot' : '') + '" title="ระดับ ' + (i+1) +
      (L[i] ? ' · ' + esc(L[i].t) : '') + ' · ' + c + ' คน">' +
      '<span>' + (c || '') + '</span>' +
      '<i style="height:' + (c ? Math.max(10, h) : 0) + '%"></i>' +
      '<b>' + (i+1) + '</b></div>';
  }).join('');

  $('sum').innerHTML = goalHTML(totPts, n) +
    '<div class="sgrid">' +
      stat('นักเรียนที่ส่งผล', n + ' คน', few ? few + ' คนทำไม่ถึง 10 ข้อ' : 'ทุกคนทำมากกว่า 10 ข้อ') +
      stat('ระดับเฉลี่ย', avgLv.toFixed(1), 'จาก ' + maxLv + ' ระดับ') +
      stat('ความสามารถเฉลี่ย', Math.round(avgPct) + '%', 'ของคะแนนเต็มทุกระดับ') +
      stat('ทำครบทุกระดับ', done + ' คน', done ? 'เต็ม 100 ทุกระดับ' : 'ยังไม่มีใครเต็ม') +
    '</div>' +
    '<div class="hist"><div class="hist-h">คนค้างอยู่ระดับใดบ้าง</div><div class="hbs">' + bars + '</div>' +
      '<div class="hist-n">' + (peak ? 'ค้างกันมากที่สุดคือ <b>ระดับ ' + worst +
      (L[worst-1] ? ' · ' + esc(L[worst-1].t) : '') + '</b> (' + peak + ' คน) — ' +
      'ระดับนี้ควรยกมาสอนซ้ำทั้งห้อง'
        : 'ทุกคนทำครบทุกระดับแล้ว ไม่มีใครค้าง') + '</div></div>';
}

/* เป้าแต้มรวมของห้อง — เป้าร่วม ไม่ใช่ตารางอันดับรายคน
   เด็กที่ตามหลังยังรู้สึกว่าแต้มของตัวเองมีส่วนช่วยห้อง */
const GOALKEY = 'kp-drill:goal';
function goalOf(){ try{ return +localStorage.getItem(GOALKEY) || 0; }catch(e){ return 0; } }
function goalHTML(tot, n){
  const g = goalOf() || Math.max(1000, Math.round(tot * 1.4 / 500) * 500);
  const pc = Math.max(0, Math.min(100, tot / g * 100));
  return '<div class="goal">' +
    '<div class="goal-row"><b>เป้าแต้มรวมของห้อง</b>' +
      '<span class="goal-v">' + tot.toLocaleString('th-TH') + ' / ' +
      '<input id="goalin" type="number" min="100" step="100" value="' + g + '"> แต้ม</span></div>' +
    '<div class="goal-bar"><i style="width:' + pc.toFixed(1) + '%"></i></div>' +
    '<div class="goal-n">' + (tot >= g
      ? 'ถึงเป้าแล้ว ตั้งเป้าใหม่ได้เลย'
      : 'เหลืออีก ' + (g - tot).toLocaleString('th-TH') + ' แต้ม · เฉลี่ยคนละ ' +
        Math.ceil((g - tot) / Math.max(1, n)).toLocaleString('th-TH') + ' แต้ม — ฉายหน้านี้ขึ้นจอให้ห้องเห็นได้') +
    '</div></div>';
}

function stat(k, v, n){
  return '<div class="st"><span class="k">' + k + '</span><b class="v">' + v + '</b><span class="n">' + n + '</span></div>';
}

/* ---------- ส่งออก ---------- */
function csv(){
  const L = [['ชื่อ','หัวข้อ','ระดับที่ทำอยู่','จำนวนระดับ','ความสามารถ','คะแนนเต็ม','ยศ','แต้ม','ข้อที่ทำ','ส่งเมื่อ','ความชำนาญรายระดับ','เลขตรวจ']];
  view().forEach(r=>{
    L.push([r.who, topicName(r.topic), r.lv, r.m.length, r.score, r.max,
            KPRANK.of(r.score, r.max).name, r.points, r.tries, r.date,
            r.m.map(x=>Math.round(x)).join(' '), r.ok ? 'ตรง' : 'ไม่ตรง']);
  });
  return L.map(row=>row.map(c=>{
    const s = String(c);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
  }).join(',')).join('\r\n');
}

function dl(){
  const blob = new Blob(['﻿' + csv()], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ผลฝึกทำโจทย์-' + new Date().toISOString().slice(0,10) + '.csv';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
}

/* ---------- เริ่ม ---------- */
load();
$('addbtn').onclick = add;
$('ftopic').onchange = draw;
$('fname').oninput = draw;
/* ในหน้า Artifact เบราว์เซอร์ไม่ยอมให้ดาวน์โหลดไฟล์ จึงเปลี่ยนปุ่มเป็นคัดลอกแทน */
if (window.KPNODL){
  $('csvbtn').textContent = 'คัดลอกเป็น CSV';
  $('csvbtn').onclick = () => copy(csv(), 'คัดลอก CSV แล้ว วางในไฟล์ .csv หรือในชีตได้');
} else {
  $('csvbtn').onclick = dl;
}
async function copy(text, okMsg){
  let ok = false;
  try{ await navigator.clipboard.writeText(text); ok = true; }catch(e){}
  if (!ok){  /* เบราว์เซอร์เก่าหรือไม่ให้สิทธิ์ ใช้วิธีเลือกข้อความแล้วสั่งคัดลอก */
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(ta); ta.select();
    try{ ok = document.execCommand('copy'); }catch(e){}
    ta.remove();
  }
  $('pmsg').textContent = ok ? okMsg : 'เบราว์เซอร์ไม่ยอมให้คัดลอก ลองลากเลือกข้อความในตารางแล้วคัดลอกเอง';
}
$('copybtn').onclick = () => copy(csv(), 'คัดลอกตารางแล้ว วางในชีตได้เลย');
$('clrbtn').onclick = function(){
  if (this.dataset.c){ rows = []; save(); draw(); this.textContent = 'ล้างรายชื่อทั้งหมด'; delete this.dataset.c; $('pmsg').textContent = 'ล้างแล้ว'; }
  else { this.dataset.c = 1; this.textContent = 'กดอีกครั้งเพื่อยืนยันการล้าง'; }
};
$('paste').addEventListener('paste', ()=>setTimeout(add, 0));

/* บัญชีครู — ล็อกอินแล้วปุ่มดึงผลจากคลาวด์จะโผล่ขึ้นมา และดึงให้รอบแรกเลย */
if (window.KPAUTH){
  KPAUTH.mount($('acct'));
  const btn = $('cloudbtn');
  if (btn) btn.onclick = pullCloud;
  let first = true;
  KPAUTH.onChange(u => {
    const box = $('cloudbox');
    if (box) box.hidden = !u;
    if (u && first){ first = false; pullCloud(); }
    if (!u) first = true;
  });
}
draw();
})();
