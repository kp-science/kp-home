/* ยศและการคิดแต้ม — ใช้ร่วมกันทั้งหน้าเกมและหน้ารวม
   ยศมาจาก "คะแนนความสามารถ" = ผลรวมความชำนาญทุกระดับของหัวข้อนั้น
   จึงขึ้นเพราะเก่งขึ้นจริง ไม่ใช่เพราะนั่งทำนาน ส่วน "แต้ม" คือของสะสม ไม่มีวันลด */
window.KPRANK = (function(){
"use strict";

/* at = สัดส่วนของคะแนนความสามารถเต็ม จึงใช้ได้กับทุกหัวข้อไม่ว่าจะมีกี่ระดับ */
const RANKS = [
  {at:0.00, name:'ผู้เริ่มต้น',        note:'เพิ่งเปิดหัวข้อนี้'},
  {at:0.10, name:'ผู้ฝึกหัด',         note:'เริ่มจับหลักได้แล้ว'},
  {at:0.25, name:'นักแก้โจทย์',       note:'ทำโจทย์พื้นฐานได้เอง'},
  {at:0.45, name:'นักแก้โจทย์ชำนาญ',  note:'เขียนแรงครบ เลือกจุดหมุนเป็น'},
  {at:0.65, name:'นายช่าง',           note:'โจทย์หลายขั้นก็เอาอยู่'},
  {at:0.85, name:'วิศวกร',            note:'เหลืออีกนิดเดียวจะเต็ม'},
  {at:1.00, name:'ปรมาจารย์',         note:'ครบทุกระดับเต็ม 100'},
];

/* คืนยศปัจจุบันและระยะห่างถึงยศถัดไป */
function of(score, max){
  const f = max > 0 ? score / max : 0;
  let i = 0;
  for (let k = 0; k < RANKS.length; k++) if (f + 1e-9 >= RANKS[k].at) i = k;
  const cur = RANKS[i], nx = RANKS[i+1] || null;
  const from = cur.at * max, to = nx ? nx.at * max : max;
  return {
    i, name: cur.name, note: cur.note, next: nx ? nx.name : null,
    need: nx ? Math.max(0, Math.ceil(to - score)) : 0,
    pct: nx ? Math.max(0, Math.min(100, (score - from) / (to - from) * 100)) : 100,
    score: Math.round(score), max: Math.round(max), top: !nx,
  };
}

/* แต้มของหนึ่งข้อ — ระดับยากให้แต้มมากกว่า ไม่งั้นเด็กจะวนทำระดับ 1 เอาแต้ม */
function points({level = 1, hint = false, streak = 0, review = false}){
  const base  = hint ? 5 : 10;
  const byLv  = 1 + (level - 1) * 0.2;            // ระดับ 8 ได้ 2.4 เท่าของระดับ 1
  const combo = 1 + Math.min(streak, 10) * 0.1;   // ถูกติดกันสูงสุด ×2
  const rev   = review ? 1.5 : 1;                 // ข้อทวนให้มากกว่า เพราะยากกว่าในแง่ความจำ
  const total = Math.round(base * byLv * combo * rev);
  const parts = ['ฐาน ' + base];
  if (level > 1) parts.push('ระดับ ' + level + ' ×' + byLv.toFixed(1));
  if (combo > 1) parts.push('ถูกติดกัน ×' + combo.toFixed(1));
  if (review)    parts.push('ข้อทวน ×1.5');
  return {total, why: parts.join(' · ')};
}

/* อ่านความคืบหน้าของทุกหัวข้อที่เครื่องนี้เคยเล่น */
function scan(){
  const out = {topics: {}, score: 0, max: 0, points: 0, done: 0};
  let keys = [];
  try { for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i)); } catch(e) { return out; }
  for (const k of keys) {
    if (!k || k.indexOf('kp-drill:') !== 0) continue;
    let o; try { o = JSON.parse(localStorage.getItem(k)); } catch(e) { continue; }
    if (!o || !o.m) continue;
    const ls = Object.keys(o.m);
    if (!ls.length) continue;
    const sum = ls.reduce((a, n) => a + Math.round(o.m[n] || 0), 0);
    const max = ls.length * 100;
    out.topics[k.slice(9)] = {score: sum, max, lv: o.lv || 1, points: o.score || 0, levels: ls.length};
    out.score += sum; out.max += max; out.points += (o.score || 0);
    if (sum >= max) out.done++;
  }
  return out;
}

/* แถบยศ ใช้ทั้งในหน้าเกมและหน้ารวม */
function barHTML(r){
  const badge = (window.KPART && KPART.rank) ? KPART.rank(r.i) : '';
  return '<div class="rk">' + badge + '<div class="rk-main">' +
    '<div class="rk-row"><div class="rk-name">' + r.name + '</div>' +
    '<div class="rk-sc">ความสามารถ <b>' + r.score + '</b> / ' + r.max + '</div></div>' +
    '<div class="rk-bar"><i style="width:' + r.pct.toFixed(1) + '%"></i></div>' +
    '<div class="rk-next">' + (r.top ? 'ยศสูงสุดแล้ว · ' + r.note
        : r.note + ' · อีก ' + r.need + ' คะแนนถึงยศ ' + r.next) + '</div></div></div>';
}

/* ---------- รหัสผล: ให้นักเรียนคัดลอกส่งครู ----------
   รูปแบบ  KPS1|ชื่อ|หัวข้อ|ระดับ|ความชำนาญแต่ละระดับ|แต้ม|จำนวนข้อ|วันที่|เลขตรวจ
   เลขตรวจกันพิมพ์ผิดหรือแก้เลขเล่น ๆ ได้ แต่ไม่ใช่ระบบกันโกง เพราะรหัสสร้างในเครื่องนักเรียน */
function crc(s){ let h=7; for(let i=0;i<s.length;i++) h=(h*31 + s.charCodeAt(i)) % 65536; return h.toString(16).padStart(4,'0'); }

function pack(o){
  const who = String(o.who||'ไม่ระบุชื่อ').replace(/[|\r\n]+/g,' ').trim().slice(0,24) || 'ไม่ระบุชื่อ';
  const body = ['KPS1', who, o.topic, o.lv, o.m.map(x=>Math.round(x)).join(','),
                Math.round(o.points), Math.round(o.tries), o.date].join('|');
  return body + '|' + crc(body);
}

function unpack(line){
  const p = String(line).trim().split('|');
  if (p.length !== 9 || p[0] !== 'KPS1') return null;
  const m = p[4].split(',').map(Number);
  if (!m.length || m.some(x => !Number.isFinite(x))) return null;
  const score = m.reduce((a,b)=>a+b,0);
  return {who:p[1], topic:p[2], lv:+p[3]||1, m, points:+p[5]||0, tries:+p[6]||0, date:p[7],
          ok: crc(p.slice(0,8).join('|')) === p[8], score, max: m.length*100, raw: String(line).trim()};
}

return {RANKS, of, points, scan, barHTML, pack, unpack};
})();
