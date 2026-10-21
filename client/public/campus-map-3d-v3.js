if (new URLSearchParams(location.search).get('background') === '1') {
  document.documentElement.classList.add('map-background');
}

const CATS = {
  acad: ['College Buildings', '#d4a017'],
  basic: ['Basic Education', '#bfe4e2'],
  admin: ['Administrative Buildings', '#0f2d52'],
  campus: ['Student Activity Areas', '#79aeb4'],
  health: ['Campus Service Facilities', '#1f6f78'],
  park: ['Parking Areas', '#dce6ee'],
};
const LABEL_INK = {
  acad: '#082038',
  basic: '#0f2d52',
  admin: '#ffffff',
  campus: '#082038',
  health: '#ffffff',
  park: '#163548',
};
const LABEL_OUTLINE = {
  acad: 'rgba(255,255,255,.78)',
  basic: 'rgba(255,255,255,.82)',
  admin: 'rgba(8,32,56,.78)',
  campus: 'rgba(255,255,255,.78)',
  health: 'rgba(8,32,56,.78)',
  park: 'rgba(255,255,255,.82)',
};
const B = [
  ['CHARM|BLDG.', 'acad', 272, 90, 490, 193, 3],
  ['PARKING|AREA', 'park', 224, 194, 490, 244, 0],
  ['TCC|GYMNASIUM', 'campus', 129, 245, 490, 368, 2, 'gym'],
  ['CANTEEN', 'campus', 74, 382, 263, 432, 2],
  ['OFFICE OF THE|STUDENT|AFFAIRS', 'admin', 263, 382, 373, 432, 2],
  ["GSP DEAN'S|OFFICE", 'admin', 373, 382, 490, 432, 2],
  ['SCIENCE|LABORATORY', 'campus', 168, 432, 490, 497, 2],
  ['PARKING AREA', 'park', 431, 572, 490, 952, 0, 'v'],
  ['D.H. SORIANO|HALL (AVR)', 'campus', 567, 226, 720, 308, 2],
  ['BASIC EDUCATION BLDG.', 'basic', 720, 264, 1218, 308, 2],
  ["BASIC EDUCATION|PRINCIPAL'S OFFICE", 'basic', 1218, 264, 1456, 308, 1, '#bfe4e2'],
  ['PARKING AREA', 'park', 1099, 90, 1397, 128, 0],
  ['CRIMINOLOGY & LAW|BLDG.', 'acad', 1099, 128, 1397, 225, 3],
  ['INFORMATION & TECHNOLOGY|BLDG.', 'acad', 567, 364, 873, 408, 2],
  ['INFORMATION & TECHNOLOGY|BLDG.', 'acad', 892, 364, 1200, 408, 2],
  ['MEDICAL / DENTAL|CLINIC', 'health', 985, 440, 1107, 484, 1],
  ['EDUCATION|BLDG.', 'acad', 567, 497, 873, 572, 2],
  ['PARKING|AREA', 'park', 567, 572, 873, 622, 0],
  ['BUSINESS &|ACCOUNTANCY BLDG.', 'acad', 892, 497, 1200, 572, 2],
  ['BASIC EDUCATION BLDG.|(9 CLASSROOMS)', 'basic', 892, 597, 1200, 657, 2],
  ['BASIC EDUCATION HIGH SCHOOL BLDG.', 'basic', 1218, 365, 1608, 408, 2],
  ['BASIC EDUCATION ELEMENTARY BLDG.', 'basic', 1218, 426, 1792, 468, 2],
  ['PHYSICAL THERAPY|BLDG.', 'acad', 1218, 497, 1420, 572, 2],
  ['BASIC EDUCATION|SENIOR HIGH SCHOOL BLDG.|(12 CLASSROOMS)', 'basic', 1420, 497, 1695, 572, 2],
  ['BASIC EDUCATION|HIGH SCHOOL|BLDG.', 'basic', 1715, 497, 1817, 572, 2],
  ['BASIC EDUCATION|LIBRARY', 'basic', 1817, 497, 1920, 572, 2],
  ['WORKSHOP', 'health', 1584, 597, 1766, 647, 2],
  ['PARKING|AREA', 'park', 1766, 597, 1972, 647, 0],
  ['CHAPEL', 'campus', 1177, 693, 1231, 730, 1],
  ['NURSING|BLDG.', 'acad', 1177, 730, 1270, 833, 2],
  ['CAREGIVING|BLDG.', 'admin', 1177, 833, 1270, 885, 2, '#79aeb4'],
  ['NURSING|BLDG.', 'acad', 1177, 885, 1270, 1000, 2],
  ['J.B. ANGELES BLDG.|(ADMIN BLDG.)', 'admin', 698, 748, 1139, 839, 3],
  ['PARKING|AREA', 'park', 698, 839, 1139, 898, 0],
  ['GUARD|HOUSE', 'health', 567, 952, 660, 1018, 1],
];
const P = 0.06;
const FH = 2.6;
const cv = document.getElementById('c');
const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
R.setPixelRatio(Math.min(devicePixelRatio, 2));
R.shadowMap.enabled = true;
R.shadowMap.type = THREE.PCFSoftShadowMap;
const AN = R.capabilities.getMaxAnisotropy();
const S = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(36, 1, 1, 700);
const home = { p: new THREE.Vector3(66, 86, 94), t: new THREE.Vector3(61, 0, 31) };
cam.position.copy(home.p);
const ctl = new THREE.OrbitControls(cam, cv);
ctl.target.copy(home.t);
ctl.enableDamping = true;
ctl.maxPolarAngle = 1.3;
ctl.minDistance = 25;
ctl.maxDistance = 280;
ctl.autoRotateSpeed = 0.6;
S.add(new THREE.HemisphereLight(0xffffff, 0x8a94a6, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(20, 90, -20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = sun.shadow.camera;
sc.left = -100;
sc.right = 100;
sc.top = 100;
sc.bottom = -100;
sc.near = 1;
sc.far = 260;
sun.target.position.set(62, 0, 36);
S.add(sun, sun.target);
const W = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o));
function box(w, h, d, x, y, z, mat, sh) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = sh !== false;
  m.receiveShadow = true;
  S.add(m);
  return m;
}
const sl = (x1, y1, x2, y2, mat, h, y) => box((x2 - x1) * P, h, (y2 - y1) * P, (x1 + x2) / 2 * P, y, (y1 + y2) / 2 * P, mat, false);
sl(-20, -20, 2070, 1095, W(0xeef1f5), 2, -1);
const road = W(0x4a5160, { roughness: 0.95 });
[[0, 1018, 2048, 1075], [490, 175, 567, 1018], [490, 175, 1100, 224], [975, 25, 1025, 224], [975, 25, 1972, 77], [1062, 90, 1099, 224], [1920, 25, 1972, 597], [1218, 572, 1972, 597], [74, 368, 490, 382], [373, 497, 490, 510], [873, 308, 892, 735], [1200, 308, 1218, 680], [567, 735, 1160, 748], [1158, 658, 1177, 1000], [1140, 692, 1177, 732], [567, 848, 698, 898], [1200, 308, 1294, 321]].forEach((r) => sl(...r, road, 0.12, 0.06));
const dash = W(0xf5f5f5);
for (let x = 20; x < 2048; x += 140) sl(x, 1044, x + 70, 1049, dash, 0.14, 0.14);
function paint(txt, Wc, Hc, fill, rot, bump, ink = '#1c2636', outline = 'rgba(255,255,255,.78)') {
  const c = document.createElement('canvas');
  c.width = Wc;
  c.height = Hc;
  const g = c.getContext('2d');
  g.fillStyle = bump ? '#000' : fill;
  g.fillRect(0, 0, Wc, Hc);
  g.translate(Wc / 2, Hc / 2);
  g.rotate(rot);
  const w = rot ? Hc : Wc;
  const h = rot ? Wc : Hc;
  const L = txt.split('|');
  let fs = Math.min(h / (L.length * 1.45), w * 0.2) * 0.68;
  const fit = () => {
    g.font = '900 ' + fs + 'px Outfit,"Segoe UI",Arial,sans-serif';
    return Math.max(...L.map((t) => g.measureText(t).width));
  };
  while (fit() > w * 0.88) fs *= 0.93;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const draw = (dx, dy, col) => {
    g.fillStyle = col;
    L.forEach((t, i) => g.fillText(t, dx, dy + (i - (L.length - 1) / 2) * fs * 1.22));
  };
  if (bump) {
    g.shadowColor = '#fff';
    g.shadowBlur = fs * 0.07;
    draw(0, 0, '#fff');
  } else {
    g.lineJoin = 'round';
    g.lineWidth = Math.max(1, fs * 0.08);
    g.strokeStyle = outline;
    L.forEach((line, i) => g.strokeText(line, 0, (i - (L.length - 1) / 2) * fs * 1.22));
    draw(0, 0, ink);
  }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = AN;
  return t;
}
const wcache = {};
function winTex(wu, hu, fl, col) {
  const k = [wu.toFixed(1), fl, col].join();
  if (wcache[k]) return wcache[k];
  const scale = 18;
  const c = document.createElement('canvas');
  c.width = Math.max(8, Math.ceil(wu * scale));
  c.height = Math.max(8, Math.ceil(hu * scale));
  const g = c.getContext('2d');
  g.fillStyle = col;
  g.fillRect(0, 0, c.width, c.height);
  const n = Math.max(1, Math.round(wu / 2.6));
  const cw = c.width / n;
  const fh = c.height / fl;
  g.fillStyle = 'rgba(0,0,0,.18)';
  g.fillRect(0, c.height - 4, c.width, 4);
  g.fillStyle = '#27354d';
  for (let r = 0; r < fl; r++) for (let i = 0; i < n; i++) g.fillRect(i * cw + cw * 0.2, r * fh + fh * 0.28, cw * 0.6, fh * 0.42);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = AN;
  return wcache[k] = t;
}
const meshes = [];
B.forEach((b) => {
  const [name, category, x1, y1, x2, y2, floors, extra] = b;
  const w = (x2 - x1) * P;
  const d = (y2 - y1) * P;
  const cx = (x1 + x2) / 2 * P;
  const cz = (y1 + y2) / 2 * P;
  const park = category === 'park';
  const h = park ? 0.3 : floors * FH;
  const col = new THREE.Color(extra && extra[0] === '#' ? extra : CATS[category][1]);
  const roofCol = '#' + col.clone().offsetHSL(0, -0.04, 0.1).getHexString();
  const wall = '#' + col.getHexString();
  const userData = { n: name.replace(/\|/g, ' '), c: category, f: floors, mats: [] };
  const add = (mesh) => { mesh.userData = userData; meshes.push(mesh); };
  const textMat = (Wc, Hc, rot) => {
    const mat = W(0xffffff, { roughness: 0.65, map: paint(name, Wc, Hc, roofCol, rot, false, LABEL_INK[category], LABEL_OUTLINE[category]), bumpMap: paint(name, Wc, Hc, '#000', rot, true), bumpScale: 3 });
    userData.mats.push(mat);
    return mat;
  };
  const SC = 30;
  const CW = Math.min(2048, Math.ceil(w * SC));
  const CH = Math.min(2048, Math.ceil(d * SC));
  if (extra === 'gym') {
    const bh = FH * 0.9;
    const bm = W(col);
    const r = d / 2;
    const arc = Math.PI * r;
    const gw = Math.ceil(arc * SC);
    const gh = Math.ceil(w * SC);
    userData.mats.push(bm);
    add(box(w, bh, d, cx, bh / 2, cz, bm));
    const tm = textMat(gw, gh, Math.PI / 2);
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 40, 1, false, 0, Math.PI), [tm, bm, bm]);
    cyl.rotation.z = Math.PI / 2;
    cyl.position.set(cx, bh, cz);
    cyl.castShadow = true;
    S.add(cyl);
    add(cyl);
    return;
  }
  const rot = extra === 'v' ? -Math.PI / 2 : 0;
  const roof = textMat(CW, CH, rot);
  const mk = (wu) => {
    const mat = W(0xffffff, { roughness: 0.75, map: winTex(wu, h, Math.max(floors, 1), wall) });
    userData.mats.push(mat);
    return mat;
  };
  const side = park ? W(0x80879a) : mk(d);
  const front = park ? W(0x80879a) : mk(w);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, roof, side, front, front]);
  mesh.position.set(cx, h / 2, cz);
  mesh.castShadow = mesh.receiveShadow = true;
  S.add(mesh);
  add(mesh);
});
const pil = W(0xdfe4ec);
box(2.2, 5, 1.6, 500 * P, 2.5, 1014 * P, pil);
box(2.2, 5, 1.6, 558 * P, 2.5, 1014 * P, pil);
box(4.6, 1, 1.6, 529 * P, 5, 1014 * P, W(0x2fb36d));
box(0.3, 9, 0.3, 918 * P, 4.5, 928 * P, W(0xffffff));
box(2.6, 1.6, 0.2, 918 * P + 1.4, 8.2, 928 * P, W(0x2fb36d));
const tg = new THREE.ConeGeometry(1.1, 3.2, 8);
const tt = new THREE.CylinderGeometry(0.18, 0.22, 1, 6);
const gm = W(0x3f9a4a);
const tm = W(0x7a5a3a);
function tree(px, py) {
  const a = new THREE.Mesh(tt, tm);
  const b = new THREE.Mesh(tg, gm);
  a.position.set(px * P, 0.5, py * P);
  b.position.set(px * P, 2.4, py * P);
  b.castShadow = true;
  S.add(a, b);
}
for (let x = 585; x < 680; x += 35) tree(x, 795);
for (let x = 720; x < 1130; x += 60) tree(x, 960);
for (let y = 700; y < 960; y += 55) tree(1300, y);
for (let x = 600; x < 860; x += 60) tree(x, 670);
[[1500, 150], [1580, 210], [1660, 140], [1750, 230], [1840, 160], [1860, 330], [1660, 300], [1480, 250]].forEach((p) => tree(...p));
const labels = [];
const lab = document.getElementById('labels');
[['MAIN GATE ENTRANCE', 440, 995], ['← TO MORONG TOWN PROPER', 130, 1046], ['TO TERESA, RIZAL →', 1860, 1046], ['FLAG POLE', 918, 975]].forEach(([text, x, y]) => {
  const el = document.createElement('div');
  el.className = 'lbl';
  el.textContent = text;
  lab.appendChild(el);
  labels.push({ e: el, pos: new THREE.Vector3(x * P, 0.3, y * P) });
});
const heatLayer = document.getElementById('heatmap');
const ticketLayer = document.getElementById('ticketLayer');
const heatItems = [];
const ticketItems = [];
function worldPointFromDepartment(department) {
  if (department.map_x == null || department.map_x === '' || department.map_y == null || department.map_y === '') return null;
  const x = Number(department.map_x);
  const y = Number(department.map_y);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100) return null;
  return new THREE.Vector3(x / 100 * 2048 * P, 3.2, y / 100 * 1095 * P);
}
function makeHeatCloud(department, count) {
  const cloud = document.createElement('div');
  cloud.className = 'heat-dot';
  const size = Math.min(190, 96 + Math.sqrt(count) * 20);
  cloud.style.width = size + 'px';
  cloud.style.height = size + 'px';
  cloud.style.opacity = String(Math.min(1, 0.9 + count * 0.02));
  cloud.title = department.name + ' · ' + count + ' ticket' + (count === 1 ? '' : 's');
  heatLayer.appendChild(cloud);
  return cloud;
}
function makeTicketPin(ticket, department, position, offsetX, offsetY) {
  const btn = document.createElement('button');
  btn.type = 'button';
  const priority = ['low', 'medium', 'urgent'].includes(ticket.priority) ? ticket.priority : 'medium';
  btn.className = 'ticket-pin ' + priority;
  const status = String(ticket.status || 'open').replace(/_/g, ' ');
  btn.title = department.name + ' · ' + status + ' · ' + priority + ' priority';
  btn.setAttribute('aria-label', 'Ticket location at ' + department.name + ', ' + status + ', ' + priority + ' priority');
  btn.addEventListener('click', () => {
    const heading = document.createElement('b');
    heading.textContent = department.name;
    const detail = document.createElement('span');
    detail.textContent = status + ' · ' + priority.toUpperCase() + ' priority';
    info.replaceChildren(heading, detail);
  });
  ticketLayer.appendChild(btn);
  return { el: btn, position, offsetX, offsetY };
}
function syncLayers() {
  const v = new THREE.Vector3();
  const positionItem = ({ el, position, offsetX = 0, offsetY = 0 }) => {
    v.copy(position).project(cam);
    const visible = v.z > -1 && v.z < 1 && Math.abs(v.x) <= 1.1 && Math.abs(v.y) <= 1.1;
    el.style.display = visible ? '' : 'none';
    if (!visible) return;
    el.style.left = ((v.x * 0.5 + 0.5) * innerWidth + offsetX) + 'px';
    el.style.top = ((-v.y * 0.5 + 0.5) * innerHeight + offsetY) + 'px';
  };
  heatItems.forEach(positionItem);
  ticketItems.forEach(positionItem);
}
function setMapData(data) {
  heatItems.length = 0;
  ticketItems.length = 0;
  heatLayer.replaceChildren();
  ticketLayer.replaceChildren();
  const departments = Array.isArray(data.departments) ? data.departments : [];
  const ticketCounts = Array.isArray(data.ticketCounts) ? data.ticketCounts : [];
  const departmentsById = new Map(departments.map((department) => [String(department.id), department]));
  const counts = new Map();
  ticketCounts.forEach((ticketGroup) => counts.set(
    String(ticketGroup.department_id),
    (counts.get(String(ticketGroup.department_id)) || 0) + (Number(ticketGroup.count) || 0),
  ));
  departments.forEach((department) => {
    const count = counts.get(String(department.id)) || 0;
    const position = worldPointFromDepartment(department);
    if (!count || !position) return;
    heatItems.push({ el: makeHeatCloud(department, count), position });
  });
  const ticketOffsets = new Map();
  ticketCounts.forEach((ticketGroup) => {
    const department = departmentsById.get(String(ticketGroup.department_id));
    const base = department && worldPointFromDepartment(department);
    if (!department || !base) return;
    const departmentKey = String(ticketGroup.department_id);
    let index = ticketOffsets.get(departmentKey) || 0;
    const pinCount = Math.max(0, Number(ticketGroup.count) || 0);
    for (let pin = 0; pin < pinCount; pin += 1) {
      const angle = index * 2.39996;
      const radius = index === 0 ? 0 : Math.min(96, 18 + Math.sqrt(index) * 16);
      ticketItems.push(makeTicketPin(ticketGroup, department, base, Math.cos(angle) * radius, Math.sin(angle) * radius));
      index += 1;
    }
    ticketOffsets.set(departmentKey, index);
  });
  syncLayers();
}
addEventListener('message', (event) => {
  if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'assistdesk:campus-map-data') return;
  document.documentElement.setAttribute('data-theme', event.data.darkMode ? 'dark' : 'light');
  setMapData(event.data);
});
const act = new Set(Object.keys(CATS));
const chips = document.getElementById('chips');
Object.entries(CATS).forEach(([key, [name, color]]) => {
  const button = document.createElement('button');
  button.className = 'chip';
  button.innerHTML = '<i style="background:' + color + '"></i>' + name;
  button.onclick = () => {
    act.has(key) ? act.delete(key) : act.add(key);
    button.classList.toggle('off', !act.has(key));
    meshes.forEach((mesh) => { mesh.visible = act.has(mesh.userData.c); });
  };
  chips.appendChild(button);
});
const info = document.getElementById('info');
const ray = new THREE.Raycaster();
const mp = new THREE.Vector2();
let sel = null;
let showL = true;
const paintSel = (userData, on) => userData.mats.forEach((mat) => mat.emissive.set(on ? 0x555555 : 0x000000));
let down = null;
cv.addEventListener('pointerdown', (event) => { down = [event.clientX, event.clientY]; });
cv.addEventListener('pointerup', (event) => {
  if (!down || Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 5) return;
  mp.set(event.clientX / innerWidth * 2 - 1, -(event.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(mp, cam);
  const hit = ray.intersectObjects(meshes.filter((mesh) => mesh.visible))[0];
  if (sel) paintSel(sel, false);
  if (hit) {
    sel = hit.object.userData;
    paintSel(sel, true);
    info.innerHTML = '<b>' + sel.n + '</b><span>' + CATS[sel.c][0] + (sel.c === 'park' ? '' : ' · ' + sel.f + ' floor' + (sel.f > 1 ? 's' : '')) + '</span>';
  } else {
    sel = null;
    info.innerHTML = '<b>Tap a building</b><span>Drag to rotate, scroll or pinch to zoom.</span>';
  }
});
const bl = document.getElementById('bl');
const br = document.getElementById('br');
bl.onclick = () => { showL = !showL; bl.setAttribute('aria-pressed', showL); };
br.onclick = () => { ctl.autoRotate = !ctl.autoRotate; br.setAttribute('aria-pressed', ctl.autoRotate); };
document.getElementById('bz').onclick = () => { cam.position.copy(home.p); ctl.target.copy(home.t); };
function size() {
  R.setSize(innerWidth, innerHeight, false);
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
  syncLayers();
}
addEventListener('resize', size);
size();
const v = new THREE.Vector3();
(function loop() {
  requestAnimationFrame(loop);
  ctl.update();
  R.render(S, cam);
  labels.forEach((label) => {
    v.copy(label.pos).project(cam);
    label.e.style.display = showL && v.z < 1 ? 'block' : 'none';
    label.e.style.left = (v.x * 0.5 + 0.5) * innerWidth + 'px';
    label.e.style.top = (-v.y * 0.5 + 0.5) * innerHeight + 'px';
  });
  syncLayers();
})();
if (parent !== window) parent.postMessage({ type: 'assistdesk:campus-map-ready' }, location.origin);
