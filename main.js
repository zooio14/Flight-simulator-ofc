import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let scene, camera, renderer, plane, propeller;
const clock = new THREE.Clock();
const keys = {};
const chunks = new Map();

const CHUNK = 850;
const RENDER = 4;

let aircraftType = "cessna";
let speed = 0;
let throttle = 0;
let fuel = 100;
let pitch = 0;
let roll = 0;
let yaw = 0;
let camMode = 0;

const aircraftData = {
  cessna: { name: "Cessna 172", max: 8.8, lift: 4.7, mass: 1.0 },
  boeing: { name: "Boeing 737", max: 12.8, lift: 3.2, mass: 1.8 },
  fighter: { name: "Caça F-16", max: 18.0, lift: 5.8, mass: 0.8 }
};

const hud = {
  aircraftName: document.getElementById("aircraftName"),
  speed: document.getElementById("speed"),
  alt: document.getElementById("alt"),
  thr: document.getElementById("thr"),
  fuel: document.getElementById("fuel"),
  cam: document.getElementById("cam")
};

document.getElementById("start").onclick = () => {
  aircraftType = document.getElementById("aircraftSelect").value;
  document.getElementById("menu").style.display = "none";
  init();
  animate();
};

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8ed5ff);
  scene.fog = new THREE.Fog(0x8ed5ff, 1300, 5600);

  camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 15000);
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xdff6ff, 0x36542e, 1.15));

  const sun = new THREE.DirectionalLight(0xffffff, 1.7);
  sun.position.set(900, 1300, 500);
  scene.add(sun);

  createOcean();
  createAirport();
  createClouds();
  createAircraft(aircraftType);

  plane.position.set(0, 8, 240);

  addEvents();
  updateWorld();
}

function createTexture(colors) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(256, 256);

  for (let i = 0; i < img.data.length; i += 4) {
    const x = (i / 4) % 256;
    const y = Math.floor(i / 4 / 256);
    const n = Math.sin(x * .11) + Math.cos(y * .09) + Math.sin((x + y) * .035);
    const c = colors[Math.abs(Math.floor(n * 10)) % colors.length];
    img.data[i] = c[0];
    img.data[i+1] = c[1];
    img.data[i+2] = c[2];
    img.data[i+3] = 255;
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  return tex;
}

const grassTex = createTexture([[50,125,45],[63,150,54],[42,104,38],[91,145,65]]);
const dirtTex = createTexture([[120,98,67],[98,78,54],[145,125,88],[81,70,52]]);
const cityTex = createTexture([[78,82,88],[110,116,124],[48,52,58],[150,155,160]]);
const glassTex = createTexture([[55,110,145],[85,150,180],[35,75,115],[120,180,210]]);

function createOcean() {
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(36000, 36000),
    new THREE.MeshStandardMaterial({
      color: 0x2d82d8,
      roughness: .42,
      metalness: .15,
      transparent: true,
      opacity: .82
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -8;
  scene.add(water);
}

function h(x,z) {
  const mountains = Math.sin(x*.0018) * Math.cos(z*.0016) * 85;
  const hills = Math.sin((x+z)*.004) * 18;
  const detail = Math.sin(x*.013 + z*.009) * 5;
  const airportFlat = Math.max(0, 1 - Math.hypot(x,z)/900);
  return (mountains + hills + detail) * (1 - airportFlat);
}

function createChunk(cx, cz) {
  const key = cx + "," + cz;
  if (chunks.has(key)) return;

  const geo = new THREE.PlaneGeometry(CHUNK, CHUNK, 40, 40);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;

  for (let i=0; i<pos.count; i++) {
    const wx = pos.getX(i) + cx * CHUNK;
    const wz = pos.getZ(i) + cz * CHUNK;
    pos.setY(i, h(wx,wz));
  }

  geo.computeVertexNormals();

  const dist = Math.hypot(cx,cz);
  const tex = dist > 5 && ((cx*17+cz*9)%5===0) ? dirtTex : grassTex;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: .96 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(cx*CHUNK,0,cz*CHUNK);
  scene.add(mesh);

  const group = new THREE.Group();
  const seed = Math.abs(cx*9127 + cz*6151);
  const city = seed % 8 === 0 && dist > 2;
  const forest = seed % 3 === 0 && !city;

  if (city) addRealisticCity(group, cx, cz, seed);
  if (forest) addForest(group, cx, cz, seed);

  scene.add(group);
  chunks.set(key, { mesh, group });
}

function pseudo(n) {
  return Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;
}

function addRealisticCity(group, cx, cz, seed) {
  const wallMat = new THREE.MeshStandardMaterial({ map: cityTex, roughness: .75, metalness: .08 });
  const glassMat = new THREE.MeshStandardMaterial({ map: glassTex, color: 0x9bdcff, roughness: .15, metalness: .35, transparent: true, opacity: .82 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x3c3f42, roughness: .8 });

  for (let i=0; i<32; i++) {
    const x = cx*CHUNK + (pseudo(seed+i)-.5)*CHUNK*.78;
    const z = cz*CHUNK + (pseudo(seed+i*8)-.5)*CHUNK*.78;
    const height = 18 + pseudo(seed+i*3)*110;
    const w = 18 + pseudo(seed+i)*34;
    const d = 18 + pseudo(seed+i+2)*34;

    const building = new THREE.Group();

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), wallMat);
    body.position.y = height / 2;
    building.add(body);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 1.2, 1.4, d + 1.2), roofMat);
    roof.position.y = height + .8;
    building.add(roof);

    const rows = Math.max(2, Math.floor(height / 12));
    const colsX = Math.max(2, Math.floor(w / 8));
    const colsZ = Math.max(2, Math.floor(d / 8));

    for (let r=0; r<rows; r++) {
      for (let c=0; c<colsX; c++) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, .18), glassMat);
        win.position.set(-w/2 + 4 + c*(w-8)/(colsX-1), 6 + r*10, -d/2 - .11);
        building.add(win);

        const win2 = win.clone();
        win2.position.z = d/2 + .11;
        building.add(win2);
      }

      for (let c=0; c<colsZ; c++) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(.18, 3.2, 2.4), glassMat);
        win.position.set(-w/2 - .11, 6 + r*10, -d/2 + 4 + c*(d-8)/(colsZ-1));
        building.add(win);

        const win2 = win.clone();
        win2.position.x = w/2 + .11;
        building.add(win2);
      }
    }

    if (height > 70) {
      const antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(.4, .4, 18, 8),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
      );
      antenna.position.y = height + 10;
      building.add(antenna);
    }

    building.position.set(x, h(x,z), z);
    group.add(building);
  }
}

function addForest(group, cx, cz, seed) {
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6a421f });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1f6d2c });

  for (let i=0; i<55; i++) {
    const x = cx*CHUNK + (pseudo(seed+i)-.5)*CHUNK*.86;
    const z = cz*CHUNK + (pseudo(seed+i*11)-.5)*CHUNK*.86;
    if (Math.hypot(x,z) < 950) continue;

    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.5,10,7), trunkMat);
    trunk.position.y = 5;

    const leaf = new THREE.Mesh(new THREE.ConeGeometry(8,20,8), leafMat);
    leaf.position.y = 20;

    tree.add(trunk, leaf);
    tree.position.set(x,h(x,z),z);
    group.add(tree);
  }
}

function createAircraft(type) {
  if (plane) scene.remove(plane);

  if (type === "cessna") plane = modelCessna();
  if (type === "boeing") plane = modelBoeing737();
  if (type === "fighter") plane = modelF16();

  scene.add(plane);
  hud.aircraftName.textContent = aircraftData[type].name;
}

function modelCessna() {
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xf5ead4, roughness:.36, metalness:.05 });
  const red = new THREE.MeshStandardMaterial({ color: 0xb80017, roughness:.32, metalness:.12 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x72c8ff, transparent:true, opacity:.65, roughness:.05, metalness:.25 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2,1.25,9), white);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(.85,1.9,28), white);
  nose.rotation.x = Math.PI/2;
  nose.position.z = -5.35;

  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.55,.72,1.45), glass);
  cockpit.position.set(0,.74,-2.05);

  const wing = new THREE.Mesh(new THREE.BoxGeometry(15,.22,2.2), red);
  wing.position.z = .25;

  const strutL = makeStrut(-3.4);
  const strutR = makeStrut(3.4);

  const tail = new THREE.Mesh(new THREE.BoxGeometry(5.7,.18,1.25), red);
  tail.position.set(0,.55,4.1);

  const rudder = new THREE.Mesh(new THREE.BoxGeometry(.25,2.2,1.25), red);
  rudder.position.set(0,1.15,4.25);

  propeller = new THREE.Mesh(new THREE.BoxGeometry(.16,4.3,.12), dark);
  propeller.position.z = -6.25;

  g.add(body,nose,cockpit,wing,strutL,strutR,tail,rudder,propeller);
  return g;
}

function makeStrut(x) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xdedede, roughness:.45 });
  const strut = new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,3.4,8), mat);
  strut.position.set(x,-.25,.05);
  strut.rotation.z = x > 0 ? .65 : -.65;
  return strut;
}

function modelBoeing737() {
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness:.28, metalness:.15 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x0a4fa3, roughness:.25, metalness:.12 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x8edcff, transparent:true, opacity:.7, roughness:.04, metalness:.3 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x222222, roughness:.45 });

  const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(1.25, 14.5, 8, 24), white);
  fuselage.rotation.x = Math.PI/2;
  g.add(fuselage);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.65,.18,11.5), blue);
  stripe.position.set(0,.12,-.5);
  g.add(stripe);

  const noseGlass = new THREE.Mesh(new THREE.BoxGeometry(1.6,.38,.18), glass);
  noseGlass.position.set(0,.72,-8.25);
  g.add(noseGlass);

  for (let i=0;i<12;i++) {
    const winL = new THREE.Mesh(new THREE.BoxGeometry(.12,.28,.42), glass);
    winL.position.set(-1.28,.55,-5.8+i*.85);
    g.add(winL);
    const winR = winL.clone();
    winR.position.x = 1.28;
    g.add(winR);
  }

  const wing = new THREE.Mesh(new THREE.BoxGeometry(18,.22,3.2), white);
  wing.position.z = -.2;
  wing.rotation.z = .05;
  g.add(wing);

  const wingTipL = new THREE.Mesh(new THREE.BoxGeometry(.25,1.7,.35), blue);
  wingTipL.position.set(-9,.75,-.2);
  wingTipL.rotation.z = -.25;
  g.add(wingTipL);

  const wingTipR = wingTipL.clone();
  wingTipR.position.x = 9;
  wingTipR.rotation.z = .25;
  g.add(wingTipR);

  for (const x of [-4.8, 4.8]) {
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(.65,.65,1.5,24), dark);
    engine.rotation.x = Math.PI/2;
    engine.position.set(x,-.7,-1.3);
    g.add(engine);
  }

  const tailWing = new THREE.Mesh(new THREE.BoxGeometry(7,.2,1.4), white);
  tailWing.position.set(0,.7,6.5);
  g.add(tailWing);

  const tail = new THREE.Mesh(new THREE.BoxGeometry(.35,3.5,2.1), blue);
  tail.position.set(0,1.85,6.9);
  g.add(tail);

  propeller = new THREE.Mesh(new THREE.BoxGeometry(.01,.01,.01), dark);
  g.add(propeller);
  g.scale.set(.75,.75,.75);
  return g;
}

function modelF16() {
  const g = new THREE.Group();
  const gray = new THREE.MeshStandardMaterial({ color: 0x8f969e, roughness:.32, metalness:.22 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x20242a, roughness:.28, metalness:.2 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x6bbcff, transparent:true, opacity:.58, roughness:.03, metalness:.35 });

  const body = new THREE.Mesh(new THREE.ConeGeometry(1.05, 10.8, 24), gray);
  body.rotation.x = -Math.PI/2;
  body.position.z = -.7;
  g.add(body);

  const rear = new THREE.Mesh(new THREE.CylinderGeometry(.95,1.15,2.4,24), dark);
  rear.rotation.x = Math.PI/2;
  rear.position.z = 4.7;
  g.add(rear);

  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(.9,16,8), glass);
  cockpit.scale.set(.75,.35,1.25);
  cockpit.position.set(0,.65,-2.3);
  g.add(cockpit);

  const wing = new THREE.Mesh(new THREE.BoxGeometry(8.8,.16,2.7), gray);
  wing.position.z = .9;
  wing.rotation.y = .06;
  g.add(wing);

  const noseWingL = new THREE.Mesh(new THREE.BoxGeometry(2.7,.13,1.2), gray);
  noseWingL.position.set(-1.95,.05,-2.3);
  noseWingL.rotation.z = -.22;
  g.add(noseWingL);

  const noseWingR = noseWingL.clone();
  noseWingR.position.x = 1.95;
  noseWingR.rotation.z = .22;
  g.add(noseWingR);

  const tail = new THREE.Mesh(new THREE.BoxGeometry(.32,2.8,1.5), gray);
  tail.position.set(0,1.35,4.15);
  g.add(tail);

  const tailL = new THREE.Mesh(new THREE.BoxGeometry(2.4,.12,1.1), gray);
  tailL.position.set(-1.25,.6,4.3);
  tailL.rotation.z = -.12;
  g.add(tailL);

  const tailR = tailL.clone();
  tailR.position.x = 1.25;
  tailR.rotation.z = .12;
  g.add(tailR);

  propeller = new THREE.Mesh(new THREE.BoxGeometry(.01,.01,.01), dark);
  g.add(propeller);
  return g;
}

function createAirport() {
  const asphalt = new THREE.MeshStandardMaterial({ color:0x2a2a2a, roughness:.8 });
  const white = new THREE.MeshStandardMaterial({ color:0xffffff });

  const runway = new THREE.Mesh(new THREE.BoxGeometry(95,1,1450), asphalt);
  runway.position.set(0,.4,-330);
  scene.add(runway);

  for(let z=-990; z<310; z+=80) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(7,1.2,38), white);
    line.position.set(0,1.1,z);
    scene.add(line);
  }

  const apron = new THREE.Mesh(new THREE.BoxGeometry(260,1,210), asphalt);
  apron.position.set(-190,.38,150);
  scene.add(apron);

  const hangarMat = new THREE.MeshStandardMaterial({color:0x79838d});
  for(let i=0;i<4;i++){
    const hangar = new THREE.Mesh(new THREE.BoxGeometry(45,25,35), hangarMat);
    hangar.position.set(-280-i*58,12.5,150);
    scene.add(hangar);
  }

  const tower = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(18,60,18), new THREE.MeshStandardMaterial({color:0xd8d8d8}));
  base.position.y = 30;
  const top = new THREE.Mesh(new THREE.BoxGeometry(34,14,34), new THREE.MeshStandardMaterial({color:0x76b6e8, transparent:true, opacity:.85}));
  top.position.y = 67;
  tower.add(base,top);
  tower.position.set(165,0,120);
  scene.add(tower);
}

function createClouds() {
  const mat = new THREE.MeshStandardMaterial({ color:0xffffff, transparent:true, opacity:.78, roughness:1 });
  for(let i=0;i<70;i++){
    const c = new THREE.Group();
    for(let p=0;p<5;p++){
      const puff = new THREE.Mesh(new THREE.SphereGeometry(22+Math.random()*30,12,8), mat);
      puff.scale.y = .45;
      puff.position.set(p*25, Math.random()*10, Math.random()*25);
      c.add(puff);
    }
    c.position.set((Math.random()-.5)*6000, 350+Math.random()*800, (Math.random()-.5)*6000);
    scene.add(c);
  }
}

function updateWorld() {
  const cx = Math.floor(plane.position.x / CHUNK);
  const cz = Math.floor(plane.position.z / CHUNK);

  for(let x=cx-RENDER; x<=cx+RENDER; x++) {
    for(let z=cz-RENDER; z<=cz+RENDER; z++) createChunk(x,z);
  }

  for(const [key, obj] of chunks) {
    const [x,z] = key.split(",").map(Number);
    if(Math.abs(x-cx)>RENDER+2 || Math.abs(z-cz)>RENDER+2) {
      scene.remove(obj.mesh);
      scene.remove(obj.group);
      obj.mesh.geometry.dispose();
      obj.mesh.material.dispose();
      chunks.delete(key);
    }
  }
}

function flight(dt) {
  const data = aircraftData[aircraftType];

  if(keys.w) throttle += 40*dt;
  if(keys.s) throttle -= 55*dt;
  throttle = THREE.MathUtils.clamp(throttle,0,100);

  if(fuel <= 0) throttle = 0;
  fuel = Math.max(0, fuel - throttle*.0011*dt);

  const target = throttle * data.max / 100;
  speed += (target-speed) * .55 * dt / data.mass;
  speed = Math.max(0, speed - Math.abs(pitch)*.012);

  if(keys.arrowup) pitch += .75*dt / data.mass;
  if(keys.arrowdown) pitch -= .75*dt / data.mass;
  if(keys.arrowleft) roll += 1.05*dt / data.mass;
  if(keys.arrowright) roll -= 1.05*dt / data.mass;
  if(keys.a) yaw += .75*dt;
  if(keys.d) yaw -= .75*dt;

  pitch = THREE.MathUtils.clamp(pitch,-.55,.55);
  roll = THREE.MathUtils.clamp(roll,-.95,.95);
  pitch *= .985;
  roll *= .982;
  yaw *= .94;

  const ground = h(plane.position.x, plane.position.z) + 3;
  const lift = Math.max(0, speed-2.5) * pitch * data.lift + Math.max(0, speed-3.8)*.025;
  const gravity = plane.position.y <= ground+.2 && speed < 3.3 ? 0 : .065 * data.mass;

  plane.position.y += (lift-gravity)*60*dt;

  if(plane.position.y < ground) {
    plane.position.y = ground;
    if(pitch < -.12 && speed > 3.7) speed *= .82;
  }

  plane.rotation.x = pitch;
  plane.rotation.z = roll;
  plane.rotation.y += (yaw + roll*.55)*dt;

  const forward = new THREE.Vector3(0,0,-1).applyQuaternion(plane.quaternion);
  plane.position.add(forward.multiplyScalar(speed*64*dt));

  if(propeller) propeller.rotation.z += (throttle+speed*8)*dt*12;
}

function updateCamera() {
  const labels = ["Externa","Cockpit","Cinema"];
  hud.cam.textContent = labels[camMode];

  let offset;
  if(camMode===0) offset = new THREE.Vector3(0,7,23);
  else if(camMode===1) offset = new THREE.Vector3(0,2.15,-1.9);
  else offset = new THREE.Vector3(0,50,85);

  offset.applyQuaternion(plane.quaternion);
  camera.position.lerp(plane.position.clone().add(offset), .13);

  if(camMode===1) {
    const target = new THREE.Vector3(0,1.7,-90).applyQuaternion(plane.quaternion).add(plane.position);
    camera.lookAt(target);
  } else {
    camera.lookAt(plane.position);
  }
}

function updateHud() {
  hud.aircraftName.textContent = aircraftData[aircraftType].name;
  hud.speed.textContent = Math.round(speed*95);
  hud.alt.textContent = Math.round(Math.max(0, plane.position.y - h(plane.position.x, plane.position.z)));
  hud.thr.textContent = Math.round(throttle);
  hud.fuel.textContent = Math.round(fuel);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .033);
  flight(dt);
  updateWorld();
  updateCamera();
  updateHud();
  renderer.render(scene,camera);
}

function reset() {
  plane.position.set(0,8,240);
  plane.rotation.set(0,0,0);
  speed=0; throttle=0; fuel=100; pitch=0; roll=0; yaw=0;
}

function switchAircraft(type) {
  aircraftType = type;
  const oldPosition = plane.position.clone();
  const oldRotation = plane.rotation.clone();
  scene.remove(plane);
  createAircraft(type);
  plane.position.copy(oldPosition);
  plane.rotation.copy(oldRotation);
  speed *= .8;
}

function addEvents() {
  document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;

    if(e.key.toLowerCase()==="c") camMode=(camMode+1)%3;
    if(e.key.toLowerCase()==="r") reset();
    if(e.key==="1") switchAircraft("cessna");
    if(e.key==="2") switchAircraft("boeing");
    if(e.key==="3") switchAircraft("fighter");
  });

  document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

  bind("up","arrowup");
  bind("down","arrowdown");
  bind("left","arrowleft");
  bind("right","arrowright");
  bind("power","w");
  bind("brake","s");

  document.getElementById("camera").onclick = () => camMode=(camMode+1)%3;
  document.getElementById("reset").onclick = reset;
  document.getElementById("a1").onclick = () => switchAircraft("cessna");
  document.getElementById("a2").onclick = () => switchAircraft("boeing");
  document.getElementById("a3").onclick = () => switchAircraft("fighter");

  addEventListener("resize", () => {
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
  });
}

function bind(id,key) {
  const b = document.getElementById(id);
  const on = e => { e.preventDefault(); keys[key]=true; };
  const off = e => { e.preventDefault(); keys[key]=false; };

  b.addEventListener("touchstart",on,{passive:false});
  b.addEventListener("touchend",off,{passive:false});
  b.addEventListener("touchcancel",off,{passive:false});
  b.addEventListener("mousedown",on);
  b.addEventListener("mouseup",off);
  b.addEventListener("mouseleave",off);
}
