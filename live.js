/* การ์ด 3D เล่นได้บนหน้าแรก: ย่อจากแลป KP Science จริง (117 ใยแสง · 162 ผสมแสงสี · 5 พื้นเอียง) ใช้ three.js r128 เหมือนแลป
   โหลด three.js เมื่อเลื่อนมาใกล้ · วาดเฉพาะการ์ดที่เห็น · ลากเพื่อหมุน (ปัดขึ้นลงบนมือถือยังเลื่อนหน้าได้) */
(function () {
  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const D2R = Math.PI / 180;
  const fmt = (n, d) => n.toLocaleString('th-TH', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 });
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z || 0);

  function mount(card, build) {
    const box = card.querySelector('.stage'), canvas = box.querySelector('canvas');
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
    catch (e) { box.classList.add('fail'); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(38, 1, .1, 200), pivot = new THREE.Group();
    scene.add(pivot);
    const view = { yaw: .4, pitch: .2, dist: 10, sway: 0 };
    const api = build({ scene, pivot, view, card });
    const place = () => { pivot.rotation.set(view.pitch, view.yaw + view.sway, 0); camera.position.set(0, 0, view.dist); camera.lookAt(0, 0, 0); };
    const size = () => { const w = box.clientWidth, h = box.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); draw(0); };
    const draw = dt => { place(); api.step(dt); renderer.render(scene, camera); };
    new ResizeObserver(size).observe(box);
    size();
    // ลากเพื่อหมุน
    let drag = null;
    box.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY]; box.setPointerCapture(e.pointerId); box.classList.add('grab'); });
    box.addEventListener('pointermove', e => {
      if (!drag) return;
      view.yaw += (e.clientX - drag[0]) * .008;
      view.pitch = Math.max(-.9, Math.min(1.1, view.pitch + (e.clientY - drag[1]) * .006));
      drag = [e.clientX, e.clientY];
      card.classList.add('touched');
      if (REDUCED) draw(0);
    });
    const end = () => { drag = null; box.classList.remove('grab'); };
    box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
    const inputs = [...card.querySelectorAll('input')], apply = () => api.set(...inputs.map(i => Number(i.value)));
    inputs.forEach(i => i.addEventListener('input', () => { apply(); if (REDUCED) draw(0); }));
    apply();
    // วาดเฉพาะตอนเห็นการ์ด และแท็บเปิดอยู่ · ฉากเป็นระนาบ จึงส่ายไปมาแทนการหมุนรอบ
    let visible = false, last = 0, swayT = 0;
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(box);
    const loop = now => {
      requestAnimationFrame(loop);
      const dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
      if (visible && !document.hidden && !REDUCED) { if (!drag) { swayT += dt; view.sway = Math.sin(swayT * .4) * .2; } draw(dt); }
    };
    requestAnimationFrame(loop);
    draw(0);
  }
  const lights = scene => { scene.add(new THREE.HemisphereLight(0xffffff, 0x1a2235, .9)); const s = new THREE.DirectionalLight(0xffffff, .75); s.position.set(4, 7, 6); scene.add(s); };
  const enamel = (color, roughness) => new THREE.MeshPhysicalMaterial({ color, roughness: roughness == null ? .42 : roughness, clearcoat: .35, clearcoatRoughness: .45 });
  const metal = color => new THREE.MeshStandardMaterial({ color: color == null ? 0xd8dde4 : color, metalness: .9, roughness: .25 });
  const UP = () => V3(0, 1, 0);
  function pose(m, p, q, r) { const d = q.clone().sub(p), len = d.length(); m.position.copy(p).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(UP(), d.normalize()); m.scale.set(r, len, r); }
  function woodTexture() {
    const c = document.createElement('canvas'); c.width = 512; c.height = 64; const g = c.getContext('2d');
    g.fillStyle = '#c99a63'; g.fillRect(0, 0, 512, 64); let s = 7; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 46; i++) { g.strokeStyle = `rgba(${90 + R() * 40},${55 + R() * 25},25,${.1 + R() * .22})`; g.lineWidth = .5 + R() * 1.4; const y = R() * 64; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(170, y + R() * 8 - 4, 340, y + R() * 8 - 4, 512, y + R() * 6 - 3); g.stroke(); }
    return new THREE.CanvasTexture(c);
  }
  function textSprite(col, h) {
    const c = document.createElement('canvas'); c.width = 320; c.height = 80; const g = c.getContext('2d'), t = new THREE.CanvasTexture(c);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false }));
    s.scale.set(h * 4, h, 1); s.renderOrder = 30;
    s.text = txt => { g.clearRect(0, 0, 320, 80); g.font = '700 50px -apple-system, "IBM Plex Sans Thai", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 8; g.strokeStyle = 'rgba(3,5,12,.85)'; g.lineJoin = 'round'; g.strokeText(txt, 160, 42); g.fillStyle = col; g.fillText(txt, 160, 42); t.needsUpdate = true; };
    return s;
  }

  /* ใยแสง (แลป 117): แกน n₁ = 1.50 หุ้มเปลือก n₂ · ไล่แสงตามจริงด้วยกฎของสเนลล์ และสัดส่วนสะท้อนจากสมการเฟรสเนล */
  const fresnel = (na, nb, ci, ct) => { const rs = (na * ci - nb * ct) / (na * ci + nb * ct), rp = (na * ct - nb * ci) / (na * ct + nb * ci); return (rs * rs + rp * rp) / 2; };
  function fibre({ scene, pivot, view, card }) {
    view.dist = 9.2; view.pitch = .16; view.yaw = .36; lights(scene);
    const N1 = 1.5, A = .24, B = .42, X0 = -1.7, X1 = 2.6, LEN = X1 - X0, MX = (X0 + X1) / 2;
    const tube = (r, mat) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, LEN, 40, 1, true), mat); m.rotation.z = Math.PI / 2; m.position.x = MX; return m; };
    const coreM = new THREE.MeshPhysicalMaterial({ color: 0xcfefff, transparent: true, opacity: .2, roughness: .05, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide });
    const cladM = new THREE.MeshPhysicalMaterial({ color: 0xffd27a, transparent: true, opacity: .16, roughness: .25, clearcoat: .6, depthWrite: false, side: THREE.DoubleSide });
    pivot.add(tube(A, coreM), tube(B, cladM));
    [X0, X1].forEach(x => { const f = new THREE.Mesh(new THREE.CircleGeometry(A, 36), new THREE.MeshPhysicalMaterial({ color: 0xe0f6ff, transparent: true, opacity: .3, depthWrite: false, side: THREE.DoubleSide })), r = new THREE.Mesh(new THREE.RingGeometry(A, B, 40), new THREE.MeshPhysicalMaterial({ color: 0xffd27a, transparent: true, opacity: .4, depthWrite: false, side: THREE.DoubleSide })); f.rotation.y = r.rotation.y = Math.PI / 2; f.position.x = r.position.x = x; pivot.add(f, r); });
    const laser = new THREE.Group(), body = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .95, 28), new THREE.MeshPhysicalMaterial({ color: 0x2b2f3a, metalness: .6, roughness: .32, clearcoat: .4 })), bez = new THREE.Mesh(new THREE.CylinderGeometry(.065, .105, .13, 28), metal()), tip = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .015, 12), new THREE.MeshBasicMaterial({ color: 0xff3b30 }));
    body.position.y = -.6; bez.position.y = -.065; laser.add(body, bez, tip); pivot.add(laser);
    // เส้นแสง: ไส้สว่าง + รัศมีเรือง ใช้ซ้ำจากชุดเดียวกัน
    const unit = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true), rays = [];
    for (let i = 0; i < 22; i++) {
      const mk = (c, r) => { const m = new THREE.Mesh(unit, new THREE.MeshBasicMaterial({ color: c, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending })); m.renderOrder = r; m.visible = false; pivot.add(m); return m; };
      rays.push({ core: mk(0xffc9c2, 12), glow: mk(0xff3b30, 11) });
    }
    const spots = []; for (let i = 0; i < 8; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff5a4d, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending })); s.visible = false; s.renderOrder = 13; pivot.add(s); spots.push(s); }
    const exitGlow = new THREE.Mesh(new THREE.SphereGeometry(.2, 18, 12), new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending })); exitGlow.position.x = X1; exitGlow.renderOrder = 13; pivot.add(exitGlow);
    const pulse = new THREE.Mesh(new THREE.SphereGeometry(.045, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthTest: false })); pulse.renderOrder = 14; pivot.add(pulse);
    const out = card.querySelector('output');
    let path = [], total = 1, s = 0;
    return {
      set(deg, n2) {
        const th = deg * D2R, tr = Math.asin(Math.sin(th) / N1), phi = 90 - tr / D2R, sinPhi = Math.cos(tr), tir = N1 * sinPhi >= n2;
        rays.forEach(r => { r.core.visible = r.glow.visible = false; }); spots.forEach(p => { p.visible = false; });
        let used = 0, spot = 0;
        const seg = (p, q, i) => { if (used >= rays.length) return; const v = Math.pow(Math.max(i, 0), .6), r = rays[used++]; if (v < .02) return; pose(r.core, p, q, .012); pose(r.glow, p, q, .04); r.core.material.opacity = v; r.glow.material.opacity = .34 * v; r.core.visible = r.glow.visible = true; };
        const E = V3(X0, 0), dir0 = V3(Math.cos(th), Math.sin(th)), start = E.clone().addScaledVector(dir0, -.55);
        laser.position.copy(start); laser.rotation.z = th - Math.PI / 2;
        seg(start, E, 1);
        path = [{ p: start, i: 1 }];
        const ct0 = Math.cos(tr), T = 1 - fresnel(1, N1, Math.cos(th), ct0);
        let I = T, x = X0, y = 0, sign = 1, hits = 0; const tan = Math.tan(tr);
        path.push({ p: E, i: I });
        while (true) {
          const dx = tan > 1e-6 ? (sign * A - y) * sign / tan : Infinity;
          if (x + dx >= X1) { const q = V3(X1, y + sign * tan * (X1 - x)); seg(V3(x, y), q, I); path.push({ p: q, i: I }); y = q.y; break; }
          const q = V3(x + dx, sign * A); seg(V3(x, y), q, I); hits++;
          let R = 1;
          if (!tir) {
            const st = N1 * sinPhi / n2, ct = Math.sqrt(1 - st * st); R = fresnel(N1, n2, Math.sin(tr), ct);
            // แสงส่วนที่รั่วทะลุเข้าเปลือก ในสายจริงปลอกนอกจะดูดกลืนไว้
            const w = V3(q.x + (B - A) * st / ct, sign * B), lost = I * (1 - R); seg(q, w, lost);
            if (spot < spots.length) { const p = spots[spot++]; p.position.copy(w); p.material.opacity = Math.pow(lost, .6) * .8; p.visible = lost > .02; }
          }
          I *= R; x = q.x; y = q.y; sign = -sign; path.push({ p: q, i: I });
        }
        const T1 = T, end = I * T1, exit = V3(X1, y); seg(exit, exit.clone().add(V3(Math.cos(th), sign * Math.sin(th)).multiplyScalar(.8)), end);
        path.push({ p: exit.clone().add(V3(Math.cos(th), sign * Math.sin(th)).multiplyScalar(.8)), i: end });
        exitGlow.position.y = y; exitGlow.material.opacity = .55 * Math.pow(end, .7); exitGlow.visible = end > .02;
        cladM.opacity = .05 + .16 * Math.min(1, (n2 - 1) / .46);
        total = 0; path.forEach((n, i) => { if (i) total += n.p.distanceTo(path[i - 1].p); }); s = 0;
        const pct = `แสงถึงปลาย ${fmt(end * 100)}%`, tc = n2 < N1 ? fmt(Math.asin(n2 / N1) / D2R, 1) : null;
        if (!hits) out.textContent = `แสงวิ่งเกือบตามแกน ยังไม่ชนผนัง · ${pct}`;
        else if (tc === null) out.textContent = `เปลือกมีดัชนีหักเหไม่น้อยกว่าแกน จึงไม่มีมุมวิกฤต แสงรั่ว · ${pct}`;
        else out.textContent = `มุมที่ผนัง ${fmt(phi, 1)}° ${tir ? 'มากกว่า' : 'น้อยกว่า'}มุมวิกฤต ${tc}° ${tir ? 'สะท้อนกลับหมด' : 'แสงรั่ว'} · ${pct}`;
      },
      step(dt) {
        s += dt * 1.5; if (s > total + .6) s = 0;
        let d = s; for (let i = 1; i < path.length; i++) { const l = path[i].p.distanceTo(path[i - 1].p); if (d <= l) { pulse.position.copy(path[i - 1].p).lerp(path[i].p, l ? d / l : 0); pulse.material.opacity = Math.pow(path[i - 1].i, .6); pulse.visible = pulse.material.opacity > .03; return; } d -= l; }
        pulse.visible = false;
      },
    };
  }

  /* ผสมแสงสี (แลป 162): แสงสามสีบวกกันบนจอ ใช้ additive blending จึงได้สีผสมจริงตรงส่วนที่ซ้อนกัน */
  function softDisc() {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    r.addColorStop(0, '#fff'); r.addColorStop(.84, '#fff'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }
  function colorName(r, g, b) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx < .03) return 'ดำ เพราะไม่มีแสง';
    if ((mx - mn) / mx < .14) return mx > .75 ? 'ขาว' : 'เทา';
    const d = mx - mn; let h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60;
    const names = [[15, 'แดง'], [45, 'ส้ม'], [72, 'เหลือง'], [105, 'เขียวอมเหลือง'], [150, 'เขียว'], [200, 'ฟ้าอมเขียว (ไซแอน)'], [255, 'น้ำเงิน'], [285, 'ม่วง'], [325, 'ม่วงแดง (แมเจนตา)'], [345, 'ชมพู'], [361, 'แดง']];
    return names.find(n => h < n[0])[1];
  }
  function mixing({ scene, pivot, view, card }) {
    view.dist = 10.4; view.pitch = .08; view.yaw = .4; lights(scene);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(5.2, 4, .12), enamel(0x14171d, .85)); screen.position.z = -1.2; pivot.add(screen);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(4.9, 3.7), new THREE.MeshBasicMaterial({ color: 0x060709 })); face.position.z = -1.13; pivot.add(face);
    [-2, 2].forEach(x => { const leg = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 1, 14), metal()); leg.position.set(x, -2.4, -1.2); const foot = new THREE.Mesh(new THREE.BoxGeometry(.2, .05, 1.1), enamel(0x1d2229)); foot.position.set(x, -2.88, -1.2); pivot.add(leg, foot); });
    const tex = softDisc(), SET = [[0xff0000, -.66, -.44, -2.1, -2, 2.6], [0x00ff00, .66, -.44, 2.1, -2, 2.6], [0x0000ff, 0, .7, 0, 2.15, 2.6]];
    const lamps = SET.map(([hex, cx, cy, lx, ly, lz], i) => {
      const col = new THREE.Color(hex);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(1.34, 56), new THREE.MeshBasicMaterial({ map: tex, color: col.clone(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); disc.position.set(cx, cy, -1.12 + i * .001); pivot.add(disc);
      const from = V3(lx, ly, lz), to = V3(cx, cy, -1.1), beam = new THREE.Mesh(new THREE.CylinderGeometry(.09, .98, 1, 36, 1, true), new THREE.MeshBasicMaterial({ color: col.clone(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); beam.renderOrder = 8;
      const d = to.clone().sub(from); beam.position.copy(from).addScaledVector(d, .5); beam.quaternion.setFromUnitVectors(UP(), d.clone().normalize().negate()); beam.scale.y = d.length(); pivot.add(beam);
      const head = new THREE.Group(), can = new THREE.Mesh(new THREE.CylinderGeometry(.16, .25, .52, 28), new THREE.MeshPhysicalMaterial({ color: 0x24272d, metalness: .6, roughness: .38, clearcoat: .3 })), lens = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .02, 24), new THREE.MeshBasicMaterial({ color: col.clone() })); lens.position.y = .265; can.rotation.x = Math.PI; head.add(can, lens); head.position.copy(from); head.quaternion.setFromUnitVectors(UP(), d.clone().normalize()); pivot.add(head);
      return { disc, beam, lens, col };
    });
    const out = card.querySelector('output');
    return {
      set(r, g, b) {
        [r, g, b].forEach((v, i) => { const l = lamps[i]; l.disc.material.color.copy(l.col).multiplyScalar(v); l.beam.material.opacity = .075 * v; l.beam.visible = v > .01; l.lens.material.color.copy(l.col).multiplyScalar(.2 + .8 * v); });
        const px = v => Math.round(v * 255);
        out.innerHTML = `<i class="sw" style="background:rgb(${px(r)},${px(g)},${px(b)})"></i>ตรงกลางจอเป็นสี${colorName(r, g, b)} · แดง ${fmt(r * 100)} เขียว ${fmt(g * 100)} น้ำเงิน ${fmt(b * 100)}`;
      },
      step() {},
    };
  }

  /* พื้นเอียง (แลป 5): แยกน้ำหนัก W เป็น W sinθ ตามพื้น และ W cosθ ตั้งฉากพื้น เชือกรับ W sinθ ส่วนพื้นดันกลับ N = W cosθ */
  function incline({ scene, pivot, view, card }) {
    view.dist = 10.2; view.pitch = .1; view.yaw = .26; lights(scene);
    const PX = -2.2, PY = -1.6, L = 4.6, T = .09, W = 1, S = 2.75, K = .085, FZ = W / 2 + .05;
    const table = new THREE.Mesh(new THREE.BoxGeometry(7.2, .1, 2.5), new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: .9 })); table.position.set(.5, PY - .13, 0); pivot.add(table);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, W + .3, 18), metal()); pin.rotation.x = Math.PI / 2; pin.position.set(PX, PY, 0); pivot.add(pin);
    const board = new THREE.Group(); board.position.set(PX, PY, 0); pivot.add(board);
    const plank = new THREE.Mesh(new THREE.BoxGeometry(L, T, W), new THREE.MeshPhysicalMaterial({ map: woodTexture(), roughness: .55, clearcoat: .45, clearcoatRoughness: .35 })); plank.position.set(L / 2, T / 2, 0); board.add(plank);
    const cart = new THREE.Group(); cart.position.x = S; board.add(cart);
    const WR = .09, BY = T + WR * 1.5 + .11, bodyM = new THREE.MeshPhysicalMaterial({ color: 0x1d4ed8, metalness: .2, roughness: .32, clearcoat: .7, clearcoatRoughness: .25 });
    const car = new THREE.Mesh(new THREE.BoxGeometry(.78, .22, .5), bodyM); car.position.y = BY; cart.add(car);
    [-.25, .25].forEach(x => [1, -1].forEach(z => { const t = new THREE.Mesh(new THREE.CylinderGeometry(WR, WR, .05, 24), new THREE.MeshStandardMaterial({ color: 0x141518, roughness: .9 })), h = new THREE.Mesh(new THREE.CylinderGeometry(WR * .55, WR * .55, .056, 16), metal()); t.rotation.x = h.rotation.x = Math.PI / 2; t.position.set(x, T + WR, z * .28); h.position.copy(t.position); cart.add(t, h); }));
    const bars = [-.2, 0, .2].map(x => { const b = new THREE.Mesh(new THREE.BoxGeometry(.16, .1, .38), new THREE.MeshStandardMaterial({ color: 0xc8a24a, metalness: .85, roughness: .3 })); b.position.set(x, BY + .16, 0); cart.add(b); return b; });
    const stop = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .42, 14), metal()); stop.position.set(L - .1, T + .21, 0); board.add(stop);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, L - .1 - S - .39, 8), new THREE.MeshStandardMaterial({ color: 0xd4b483, roughness: .8 })); rope.rotation.z = Math.PI / 2; rope.position.set((L - .1 + S + .39) / 2, BY, 0); board.add(rope);
    // ขาตั้งด้านหลัง: แคลมป์เลื่อนตามความสูงของกระดาน
    const RX = PX + .62, rod = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 3.6, 14), metal()); rod.position.set(RX, PY + 1.72, -.72); pivot.add(rod);
    const clamp = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .8, 12), metal()); clamp.rotation.x = Math.PI / 2; pivot.add(clamp);
    const arrow = col => {
      const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: col, depthTest: false, transparent: true }), sh = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1, 12), m), he = new THREE.Mesh(new THREE.ConeGeometry(.085, 1, 18), m);
      sh.renderOrder = he.renderOrder = 20; g.add(sh, he); pivot.add(g); g.set = (o, d, n) => { g.visible = n > .05; if (!g.visible) return; const hh = Math.min(.2, n * .45); g.position.copy(o); g.quaternion.setFromUnitVectors(UP(), d); sh.scale.y = n - hh; sh.position.y = (n - hh) / 2; he.scale.y = hh; he.position.y = n - hh / 2; };
      return g;
    };
    const AW = arrow(0xf87171), AN = arrow(0xfacc15), AS = arrow(0xfb923c), AC = arrow(0x818cf8);
    const LW = textSprite('#fca5a5', .3), LN = textSprite('#fde047', .3), LS = textSprite('#fdba74', .3), LC = textSprite('#c7d2fe', .3), LA = textSprite('#ffffff', .3);
    LW.text('W'); LN.text('N'); LS.text('W sinθ'); LC.text('W cosθ'); pivot.add(LW, LN, LS, LC, LA);
    const arcM = new THREE.MeshBasicMaterial({ color: 0xfb923c, depthTest: false, transparent: true }); let arc = null;
    const out = card.querySelector('output');
    const tw = (lx, ly, z) => { const c = board.rotation.z; return V3(PX + lx * Math.cos(c) - ly * Math.sin(c), PY + lx * Math.sin(c) + ly * Math.cos(c), z || 0); };
    return {
      set(deg, wt) {
        const a = deg * D2R, c = Math.cos(a), s = Math.sin(a), up = V3(c, s), nor = V3(-s, c), dn = V3(-c, -s), inn = V3(s, -c);
        board.rotation.z = a; clamp.position.set(RX, PY + .62 * Math.tan(a) - .05, -.34);
        bars.forEach((b, i) => { b.visible = i < Math.min(3, Math.floor(wt / 6)); });
        const cm = tw(S, BY, FZ), ct = tw(S, T, FZ), fs = wt * s, fc = wt * c;
        AW.set(cm, V3(0, -1), wt * K); AN.set(ct, nor, fc * K); AS.set(cm, dn, fs * K); AC.set(cm, inn, fc * K);
        const tag = (sp, ar, o, d, n, side) => { sp.visible = ar.visible; sp.position.copy(o).addScaledVector(d, n + .2).add(side); };
        tag(LW, AW, cm, V3(0, -1), wt * K, V3(.1, 0)); tag(LN, AN, ct, nor, fc * K, V3(0, 0)); tag(LS, AS, cm, dn, fs * K, V3(-.34, .16)); tag(LC, AC, cm, inn, fc * K, V3(.42, .04));
        if (arc) { arc.geometry.dispose(); pivot.remove(arc); arc = null; }
        if (a > .01) { arc = new THREE.Mesh(new THREE.TorusGeometry(1, .016, 8, 44, a), arcM); arc.position.set(PX, PY, FZ); arc.renderOrder = 20; pivot.add(arc); }
        LA.text(`${fmt(deg)}°`); LA.position.set(PX + 1.34 * Math.cos(Math.max(a / 2, .12)), PY + 1.34 * Math.sin(Math.max(a / 2, .12)) + .02, FZ);
        out.textContent = `เชือกต้องรับแรง W sinθ = ${fmt(fs, 1)} N · พื้นดันกลับ N = W cosθ = ${fmt(fc, 1)} N`;
      },
      step() {},
    };
  }

  const SCENES = { fibre, mixing, incline }, cards = document.querySelectorAll('.lab');
  if (!cards.length) return;
  const fail = () => cards.forEach(c => c.querySelector('.stage').classList.add('fail'));
  const start = () => {
    cards.forEach(c => { try { mount(c, SCENES[c.dataset.scene]); } catch (e) { console.warn('3D', e); c.querySelector('.stage').classList.add('fail'); } });
  };
  let begun = false;
  const go = () => { if (begun) return; begun = true; const s = document.createElement('script'); s.src = THREE_URL; s.onload = start; s.onerror = fail; document.head.appendChild(s); };
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); go(); } }, { rootMargin: '400px 0px' }); io.observe(document.getElementById('play')); } else go();
})();
