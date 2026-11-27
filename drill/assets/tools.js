/* กระดานทดเลข + เครื่องคิดเลข — เรียกออกมาเมื่อต้องการ ปิดไว้เป็นค่าตั้งต้น
   เหตุผลที่ต้องมี: โจทย์โมเมนต์คิดในใจไม่ได้ ถ้าไม่มีที่ทด เด็กจะเดาคำตอบ
   ซึ่งทำให้ระบบเลือดลงโทษผิดคน และเราจะอ่านไม่ออกว่าใครไม่เข้าใจจริง
   ออกแบบให้ไม่กินที่หน้าจอ: มีปุ่มกลมสองปุ่มมุมขวาล่าง กดแล้วแผ่นลอยขึ้นมา */
window.KPTOOLS = (function(){
"use strict";

const ICO = {
  pad: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3h11l5 5v13H4z"/><path d="M15 3v5h5"/><path d="M8 13.5l3 3 5.5-6"/></svg>',
  calc:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="2.5" width="16" height="19" rx="2.5"/><path d="M7.5 7h9"/><path d="M8 12h.01M12 12h.01M16 12h.01M8 16.5h.01M12 16.5h.01M16 16.5h.01"/></svg>',
  x:   '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  pen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l4-1 11-11-3-3L5 16z"/></svg>',
  er:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 20h12"/><path d="M15.5 6.5l3 3-8 8h-4l-2-2z"/></svg>',
  bin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13"/></svg>',
};

/* ---------- โครงหน้าจอ ---------- */
const dock = document.createElement('div');
dock.className = 'kt-dock';
dock.innerHTML =
  '<button type="button" class="kt-fab" data-v="pad" title="กระดานทด" aria-label="กระดานทด">'+ICO.pad+'</button>' +
  '<button type="button" class="kt-fab" data-v="calc" title="เครื่องคิดเลข" aria-label="เครื่องคิดเลข">'+ICO.calc+'</button>';

const panel = document.createElement('section');
panel.className = 'kt-panel';
panel.hidden = true;
panel.innerHTML =
  '<div class="kt-head">' +
    '<strong class="kt-title">กระดานทด</strong>' +
    '<div class="kt-act" id="kt-act"></div>' +
    '<button type="button" class="kt-close" aria-label="ปิด">'+ICO.x+'</button>' +
  '</div>' +
  '<div class="kt-body">' +
    '<div class="kt-pad" hidden><canvas id="kt-cv"></canvas></div>' +
    '<div class="kt-calc" hidden>' +
      '<input id="kt-out" class="kt-out num" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="ช่องคิดเลข">' +
      '<div class="kt-keys" id="kt-keys"></div>' +
    '</div>' +
  '</div>';

document.body.appendChild(panel);
document.body.appendChild(dock);
document.body.classList.add('has-kt');   /* เว้นที่ท้ายหน้าไม่ให้ปุ่มลอยทับปุ่มใน footer */

const $  = s => panel.querySelector(s);
const padBox = $('.kt-pad'), calcBox = $('.kt-calc'), title = $('.kt-title'), act = $('#kt-act');
let view = null;

/* ---------- กระดานทด ----------
   วาดด้วย pointer event ตัวเดียว จึงใช้ได้ทั้งเมาส์ นิ้ว และปากกา */
const cv = $('#kt-cv');
const ctx = cv.getContext('2d');
let drawing = false, erase = false, sized = false, inked = false, last = null;

function sizeCanvas(){
  const r = cv.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(240, Math.round(r.width)), h = Math.max(180, Math.round(r.height));
  if (sized && cv.width === Math.round(w*dpr) && cv.height === Math.round(h*dpr)) return;
  /* เก็บรอยเดิมไว้ก่อนเปลี่ยนขนาด ไม่งั้นที่ทดไว้หายตอนหมุนจอ */
  const old = sized && inked ? cv.toDataURL() : null;
  cv.width = Math.round(w*dpr); cv.height = Math.round(h*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  sized = true;
  if (old){ const im = new Image(); im.onload = () => ctx.drawImage(im,0,0,w,h); im.src = old; }
}

function ink(){ return getComputedStyle(panel).getPropertyValue('--ink').trim() || '#222'; }

function pt(e){ const r = cv.getBoundingClientRect(); return [e.clientX-r.left, e.clientY-r.top]; }

cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId);
  drawing = true; last = pt(e);
  ctx.strokeStyle = ink();
  ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
  ctx.lineWidth = erase ? 18 : 2.2;
  /* แตะทีเดียวให้เป็นจุด ไม่ใช่ไม่มีอะไรเกิดขึ้น */
  ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(last[0]+0.01, last[1]); ctx.stroke();
  if (!erase) inked = true;
  e.preventDefault();
});
cv.addEventListener('pointermove', e => {
  if (!drawing) return;
  const p = pt(e);
  ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
  last = p; e.preventDefault();
});
const stop = () => { drawing = false; };
cv.addEventListener('pointerup', stop);
cv.addEventListener('pointercancel', stop);
cv.addEventListener('pointerleave', stop);

function wipe(){
  if (!sized) return;
  const dpr = window.devicePixelRatio || 1;
  ctx.save(); ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,cv.width,cv.height); ctx.restore();
  ctx.setTransform(dpr,0,0,dpr,0,0);
  inked = false;
}

const PAD_ACT =
  '<button type="button" class="kt-tb on" data-t="pen" title="ปากกา" aria-label="ปากกา">'+ICO.pen+'</button>' +
  '<button type="button" class="kt-tb" data-t="er" title="ยางลบ" aria-label="ยางลบ">'+ICO.er+'</button>' +
  '<button type="button" class="kt-tb" data-t="clr" title="ล้างกระดาน" aria-label="ล้างกระดาน">'+ICO.bin+'</button>';

act.addEventListener('click', e => {
  const b = e.target.closest('.kt-tb'); if (!b) return;
  const t = b.dataset.t;
  if (t === 'clr'){ wipe(); return; }
  erase = (t === 'er');
  act.querySelectorAll('.kt-tb[data-t="pen"],.kt-tb[data-t="er"]')
     .forEach(x => x.classList.toggle('on', x.dataset.t === t));
});

/* ---------- เครื่องคิดเลข ----------
   คิดเฉพาะเลขคณิตและรากที่สอง พอกับโจทย์โมเมนต์ และไม่ต้องพึ่งไลบรารีข้างนอก */
const out = $('#kt-out'), keys = $('#kt-keys');
const KEYS = [
  ['C','k'],['←','k'],['(','k'],[')','k'],
  ['7','k'],['8','k'],['9','k'],['÷','k op'],
  ['4','k'],['5','k'],['6','k'],['×','k op'],
  ['1','k'],['2','k'],['3','k'],['−','k op'],
  ['0','k'],['.','k'],['√','k op'],['+','k op'],
  ['=','k eq wide4'],
];
keys.innerHTML = KEYS.map(([t,c]) =>
  '<button type="button" class="'+c+'" data-k="'+t+'">'+t+'</button>').join('');

function calc(){
  let s = out.value.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-')
                   .replace(/√/g,'S(').replace(/,/g,'');
  /* ปิด ( ที่ค้างให้เอง เด็กลืมปิดวงเล็บบ่อยและไม่ควรเจอคำว่า error เพราะเรื่องนี้ */
  const open = (s.match(/\(/g)||[]).length - (s.match(/\)/g)||[]).length;
  if (open > 0) s += ')'.repeat(open);
  if (!/^[0-9+\-*/().^ S]*$/.test(s) || !s.trim()) { out.value = ''; return; }
  s = s.replace(/\^/g,'**');
  let v;
  try { v = new Function('S','"use strict";return ('+s+')')(Math.sqrt); }
  catch(err){ return flash(); }
  if (typeof v !== 'number' || !isFinite(v)) return flash();
  out.value = String(Math.round(v*1e10)/1e10);
}
function flash(){ out.classList.add('bad'); setTimeout(()=>out.classList.remove('bad'), 320); }

keys.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const k = b.dataset.k;
  if (k === 'C') out.value = '';
  else if (k === '←') out.value = out.value.slice(0,-1);
  else if (k === '=') calc();
  else out.value += k;
  out.focus();
});
out.addEventListener('keydown', e => {
  if (e.key === 'Enter'){ e.preventDefault(); calc(); }
});

/* ---------- เปิด ปิด สลับ ---------- */
function show(v){
  if (view === v){ close(); return; }
  view = v;
  panel.hidden = false;
  panel.classList.toggle('calc-on', v === 'calc');
  padBox.hidden = v !== 'pad'; calcBox.hidden = v !== 'calc';
  title.textContent = v === 'pad' ? 'กระดานทด' : 'เครื่องคิดเลข';
  act.innerHTML = v === 'pad' ? PAD_ACT : '';
  dock.querySelectorAll('.kt-fab').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  if (v === 'pad') requestAnimationFrame(sizeCanvas); else out.focus();
}
function close(){
  view = null; panel.hidden = true;
  dock.querySelectorAll('.kt-fab').forEach(b => b.classList.remove('on'));
}

dock.addEventListener('click', e => {
  const b = e.target.closest('.kt-fab'); if (!b) return;
  show(b.dataset.v);
});
$('.kt-close').addEventListener('click', close);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && view) close(); });
window.addEventListener('resize', () => { if (view === 'pad') sizeCanvas(); });

/* โจทย์ข้อใหม่ ล้างกระดานให้ ที่ทดของข้อเก่าไม่มีประโยชน์และทำให้สับสน
   แต่ไม่แตะเครื่องคิดเลข เพราะเด็กมักเอาเลขจากข้อก่อนมาใช้ต่อ */
function newq(){ wipe(); }

return {open: show, close, wipe, newq};
})();
