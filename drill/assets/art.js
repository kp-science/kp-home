/* ภาพประกอบทั้งเว็บ — วาดด้วย SVG ล้วน ไม่มีไฟล์รูป จึงคมทุกขนาดและเปลี่ยนสีตามโหมดมืดได้เอง
   ใช้ชุดสีและข้อตกลงการวาดเดียวกับรูปคานในโจทย์ (คานสีไม้ · ลูกศรแรงสีส้ม · เส้นบอกระยะสีเขียว)
   เพื่อให้เด็กเห็นภาพไหนก็อ่านได้ด้วยกติกาเดียวกัน */
window.KPART = (function(){
"use strict";

const svg = (w,h,body,cls) =>
  '<svg class="'+(cls||'art')+'" viewBox="0 0 '+w+' '+h+'" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'+body+'</svg>';

/* ลูกศรวาดเป็นรูปทรงตรง ๆ ไม่ใช้ marker เพราะ marker ต้องมี id ซึ่งจะชนกันเมื่อมีหลายภาพในหน้าเดียว */
const arrDown = (x,y0,y1) =>
  '<path class="ffl" d="M'+x+' '+y0+'V'+(y1-5)+'"/><path class="ff" d="M'+(x-4)+' '+(y1-6)+'L'+(x+4)+' '+(y1-6)+'L'+x+' '+y1+'z"/>';
const arrUp = (x,y0,y1) =>
  '<path class="ffl" d="M'+x+' '+y0+'V'+(y1+5)+'"/><path class="ff" d="M'+(x-4)+' '+(y1+6)+'L'+(x+4)+' '+(y1+6)+'L'+x+' '+y1+'z"/>';
const dim = (x0,x1,y) =>
  '<path class="fdl" d="M'+x0+' '+y+'H'+x1+'M'+x0+' '+(y-3.5)+'V'+(y+3.5)+'M'+x1+' '+(y-3.5)+'V'+(y+3.5)+'"/>';
const beam = (x0,x1,y,t) => '<rect class="fbeam" x="'+x0+'" y="'+(y-(t||5)/2)+'" width="'+(x1-x0)+'" height="'+(t||5)+'" rx="1.5"/>';
const ful  = (x,y,s) => { s=s||9; return '<path class="fful" d="M'+x+' '+y+'L'+(x+s)+' '+(y+s*1.25)+'H'+(x-s)+'z"/>'; };
const box  = (x,y,w,h) => '<rect class="fbox" x="'+(x-w/2)+'" y="'+y+'" width="'+w+'" height="'+(h||10)+'" rx="1.5"/>';
const txt  = (x,y,s,cls,sz) => '<text x="'+x+'" y="'+y+'" class="'+(cls||'fts')+'" font-size="'+(sz||10)+'" text-anchor="middle">'+s+'</text>';

/* ---------- ตราประจำยศ 7 ขั้น ----------
   แผ่นป้ายทรงเดียวกันทุกขั้น แต่ลายข้างในบอกว่าทำอะไรได้แล้ว
   ขั้นต้นคานเอียง ขั้นสูงคานได้ระดับและมีเครื่องมือครบขึ้นเรื่อย ๆ */
const PLATE = '<path class="bd-bg" d="M22 2 L39 9.5 V24 C39 33 31.5 39.5 22 42 C12.5 39.5 5 33 5 24 V9.5 Z"/>' +
              '<path class="bd-ed" d="M22 2 L39 9.5 V24 C39 33 31.5 39.5 22 42 C12.5 39.5 5 33 5 24 V9.5 Z"/>';

const MOTIF = [
  /* 0 ผู้เริ่มต้น — ยังไม่มีอะไร มีแค่จุดหมุน */
  ful(22,25,7),
  /* 1 ผู้ฝึกหัด — คานเอียง เริ่มจับหลักได้ */
  '<g transform="rotate(-12 22 22)">'+beam(9,35,21,4.5)+'</g>'+ful(22,23,7),
  /* 2 นักแก้โจทย์ — คานได้ระดับ */
  beam(9,35,20,4.5)+ful(22,22,7),
  /* 3 นักแก้โจทย์ชำนาญ — คานได้ระดับพร้อมน้ำหนักหนึ่งข้าง */
  beam(8,36,20,4.5)+ful(22,22,7)+box(13,22.6,7,6),
  /* 4 นายช่าง — เพิ่มเส้นบอกระยะ คิดอาร์มเป็นแล้ว */
  dim(13,31,12)+beam(8,36,19,4.5)+ful(22,21,7)+box(13,21.5,7,6)+box(31,21.5,7,6),
  /* 5 วิศวกร — คานงัดพร้อมแรงที่ออกแรงเอง */
  beam(8,36,21,4.5)+ful(15,23,6)+box(9,23.5,7,6)+arrDown(32,10,19),
  /* 6 ปรมาจารย์ — ครบทุกอย่าง และมีดาว */
  '<path class="bd-st" d="M22 5.5l2.1 4.4 4.8.7-3.5 3.4.8 4.8-4.2-2.3-4.2 2.3.8-4.8-3.5-3.4 4.8-.7z"/>'+
  dim(13,31,22)+beam(8,36,29,4.5)+ful(22,31,6)+box(13,31.5,7,5.5)+box(31,31.5,7,5.5),
];

function rank(i){
  i = Math.max(0, Math.min(MOTIF.length-1, i|0));
  return svg(44,44, PLATE + MOTIF[i], 'badge t'+i);
}

/* ---------- รูปบนบัตรความรู้ 8 ใบ ----------
   หนึ่งใบหนึ่งหลักการ รูปจึงต้องบอกหลักการนั้นให้เห็นโดยไม่ต้องอ่าน */
const CARD = [
  /* 1 M = F d */
  dim(34,104,16) + txt(69,13,'d') + beam(18,132,34) + ful(34,37) + arrDown(104,20,32) + txt(116,27,'F','ff2'),
  /* 2 ย้อนสูตร — รู้ M กับ d หาแรง */
  dim(34,104,16) + txt(69,13,'d') + beam(18,132,34) + ful(34,37) + arrDown(104,20,32) + txt(116,26,'?','ff2',13),
  /* 3 แปลงหน่วยก่อนคิด */
  '<rect class="fbox" x="20" y="22" width="110" height="16" rx="2"/>' +
  '<path class="fkl" d="M34 22v7M48 22v5M62 22v7M76 22v5M90 22v7M104 22v5M118 22v7"/>' +
  txt(44,50,'120 cm','fts',11) + txt(75,48,'→','ft',13) + txt(106,50,'1.2 m','fdt',11),
  /* 4 คานเบาสมดุล */
  beam(16,134,32) + ful(75,35) + box(36,19,15,12) + box(114,19,15,12) +
  '<path class="fdl" d="M75 10v8"/>' + txt(75,8,'สมดุล','fdt',9),
  /* 5 เขียนแรงให้ครบ — คานมีน้ำหนักตัวเอง */
  beam(16,134,30,7) + ful(40,34) + arrDown(16,16,27) + arrDown(130,16,27) +
  '<path class="fdash" d="M75 20v8"/>' + arrDown(75,28,46) + txt(75,16,'น้ำหนักคาน','fts',9),
  /* 6 เลือกจุดหมุนให้ฉลาด — เป้าเล็งทับแรงที่ยังไม่รู้ค่า */
  beam(16,134,30) + ful(30,33) + ful(120,33) + arrDown(90,12,27) +
  '<circle class="fdash" cx="30" cy="30" r="11" fill="none"/>' +
  '<path class="ffl" d="M30 17v26M17 30h26"/>' +
  '<text x="30" y="13" class="ff2" font-size="11" text-anchor="middle">?</text>' +
  txt(82,52,'ตั้งจุดหมุนตรงเป้า','fts',9),
  /* 7 การได้เปรียบเชิงกล */
  beam(16,134,32) + ful(44,35) + box(24,21,16,12) + arrDown(120,14,29) +
  dim(16,44,13) + dim(44,120,13) + txt(30,10,'สั้น','fts',9) + txt(82,10,'ยาว','fts',9),
  /* 8 จุดศูนย์ถ่วง ของคานไม่สม่ำเสมอ */
  '<path class="fbeam" d="M16 28h118v10H16z"/>' +
  '<path class="fbeam" d="M16 22h46v6H16z"/>' + ful(58,41) +
  '<circle class="fdot" cx="52" cy="31" r="6"/>' + txt(52,34.5,'G','ft',9) + arrDown(52,6,24),
];

function card(i){
  const b = CARD[i|0];
  return b ? svg(150,56, b, 'cdart') : '';
}

/* ---------- ไอคอนภารกิจ ---------- */
const ICON = {
  q8:  '<path class="i-l" d="M4 12.5l5 5L20 6"/>',
  nh5: '<path class="i-l" d="M12 3a6 6 0 0 0-3.5 10.9V17h7v-3.1A6 6 0 0 0 12 3zM9 20h6"/><path class="i-l" d="M3 3l18 18"/>',
  st5: '<path class="i-f" d="M13 2c.5 4-3.5 5-3.5 8.5A3.5 3.5 0 0 0 13 14c0-2 1-3 1-3 2 1.5 3 3.4 3 5.4A5.9 5.9 0 0 1 11 22a6 6 0 0 1-6-6C5 10 11 8 13 2z"/>',
  rv3: '<path class="i-l" d="M20 12a8 8 0 1 1-2.3-5.6M20 3v5h-5"/>',
  gd2: '<path class="i-f" d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.2-5.9 3.2 1.2-6.5L2.5 9.5l6.6-.9z"/>',
  up1: '<path class="i-l" d="M12 20V5M5 12l7-7 7 7"/>',
};
function quest(id){ return ICON[id] ? svg(24,24, ICON[id], 'qico') : ''; }
function gold(){ return svg(24,24, ICON.gd2, 'qico gold'); }

/* ---------- ภาพเปิดหน้ารวม ----------
   คานกระดกที่กำลังจะได้ระดับ สื่อเนื้อหาและสื่อระบบของเว็บไปพร้อมกัน */
function hero(){
  /* คานเอียงกำลังจะได้ระดับ · เส้นบอกระยะอยู่เหนือคาน · ลูกศรแรงตั้งฉากกับพื้นเสมอ
     วางตามข้อตกลงเดียวกับรูปในโจทย์ เด็กจึงอ่านภาพนี้ได้ก่อนเริ่มเล่น */
  const bg = '<rect class="h-grid" x="0" y="0" width="420" height="180" rx="14"/>';
  const scene =
    '<g transform="translate(210 100) rotate(-7)">' +
      '<rect class="fbeam" x="-112" y="-5" width="224" height="10" rx="2.5"/>' +
      dim(-108,-6,-30) + dim(6,108,-30) +
      '<text x="-57" y="-36" class="fdt" font-size="13" text-anchor="middle">d₁</text>' +
      '<text x="57" y="-36" class="fdt" font-size="13" text-anchor="middle">d₂</text>' +
    '</g>' +
    arrDown(114,86,104) + arrDown(306,62,81) +
    '<text x="129" y="100" class="ff2" font-size="12">F₁</text>' +
    '<text x="283" y="77" class="ff2" font-size="12">F₂</text>' +
    '<path class="fful" d="M210 101L225 124H195z"/>' +
    '<path class="fkl" d="M168 124h84"/>';
  /* แถบระดับ 8 ขั้นมุมล่างซ้าย บอกว่าเกมนี้ไต่ไปทีละขั้น */
  const steps = [0,1,2,3,4,5,6,7].map(i=>
    '<rect class="h-step'+(i<4?' on':'')+'" x="'+(26+i*15)+'" y="152" width="11" height="9" rx="2"/>').join('');
  const spark = '<path class="h-spark" d="M372 30l2.2 5.4 5.4 2.2-5.4 2.2-2.2 5.4-2.2-5.4-5.4-2.2 5.4-2.2zM350 62l1.5 3.7 3.7 1.5-3.7 1.5-1.5 3.7-1.5-3.7-3.7-1.5 3.7-1.5z"/>';
  return svg(420,180, bg + scene + steps + spark, 'heroart');
}

return {rank, card, quest, gold, hero};
})();
