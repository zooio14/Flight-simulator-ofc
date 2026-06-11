import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let scene, camera, renderer, plane, propeller;
const clock = new THREE.Clock();
const keys = {};
const chunks = new Map();

const CHUNK = 800;
const RENDER = 4;

let speed = 0;
let throttle = 0;
let fuel = 100;
let pitch = 0;
let roll = 0;
let yaw = 0;
let camMode = 0;

const hud = {
  speed: document.getElementById("speed"),
  alt: document.getElementById("alt"),
  thr: document.getElementById("thr"),
  fuel: document.getElementById("fuel"),
  cam: document.getElementById("cam")
};

document.getElementById("start").onclick = () => {
  document.getElementById("menu").style.display = "none";
  init();
  animate();
};

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8ed5ff);
  scene.fog = new THREE.Fog(0x8ed5ff, 1200, 5200);

  camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 12000);
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xdff6ff, 0x36542e, 1.15));
  const sun = new THREE.DirectionalLight(0xffffff, 1.55);
  sun.position.set(900, 1300, 500);
  scene.add(sun);

  createOcean();
  createPlane();
  createAirport();
  createClouds();

  plane.position.set(0, 8, 240);

  addEvents();
  updateWorld(true);
}

function createTexture(colors) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");

  const img = ctx.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const x = (i / 4) % 256;
    const y = Math.floor(i / 4 / 256);
    const n = Math.sin(x * .11) + Math.cos(y * .09) + Math.sin((x+y) * .035);
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
const cityTex = createTexture([[90,93,98],[120,124,130],[70,73,78],[145,148,150]]);

function createOcean() {
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(30000, 30000),
    new THREE.MeshStandardMaterial({ color: 0x2d82d8, roughness: .42, metalness: .15, transparent: true, opacity: .82 })
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
  const city = seed % 9 === 0 && dist > 2;
  const forest = seed % 3 === 0 && !city;

  if (city) addCity(group, cx, cz, seed);
  if (forest) addForest(group, cx, cz, seed);

  scene.add(group);
  chunks.set(key, { mesh, group });
}

function pseudo(n) {
  return Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;
}

function addCity(group, cx, cz, seed) {
  const mat = new THREE.MeshStandardMaterial({ map: cityTex, roughness: .8 });
  for (let i=0; i<36; i++) {
    const x = cx*CHUNK + (pseudo(seed+i)-.5)*CHUNK*.78;
    const z = cz*CHUNK + (pseudo(seed+i*8)-.5)*CHUNK*.78;
    const height = 15 + pseudo(seed+i*3)*95;
    const b = new THREE.Mesh(new THREE.BoxGeometry(18+pseudo(seed+i)*30, height, 18+pseudo(seed+i+2)*30), mat);
    b.position.set(x, h(x,z)+height/2, z);
    group.add(b);
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

function createPlane() {
  plane = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf5ead4, roughness:.45 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xb80017, roughness:.42 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x72c8ff, transparent:true, opacity:.65, roughness:.1 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2,1.25,9), bodyMat);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(.85,1.9,28), bodyMat);
  nose.rotation.x = Math.PI/2;
  nose.position.z = -5.35;
  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.55,.72,1.45), glassMat);
  cockpit.position.set(0,.74,-2.05);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(15,.22,2.2), redMat);
  wing.position.z = .25;
  const tail = new THREE.Mesh(new THREE.BoxGeometry(5.7,.18,1.25), redMat);
  tail.position.set(0,.55,4.1);
  const rudder = new THREE.Mesh(new THREE.BoxGeometry(.25,2.2,1.25), redMat);
  rudder.position.set(0,1.15,4.25);
  propeller = new THREE.Mesh(new THREE.BoxGeometry(.16,4.3,.12), new THREE.MeshStandardMaterial({color:0x111111}));
  propeller.position.z = -6.25;
  plane.add(body,nose,cockpit,wing,tail,rudder,propeller);
  scene.add(plane);
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

function updateWorld(force=false) {
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
  if(keys.w) throttle += 40*dt;
  if(keys.s) throttle -= 55*dt;
  throttle = THREE.MathUtils.clamp(throttle,0,100);

  if(fuel <= 0) throttle = 0;
  fuel = Math.max(0, fuel - throttle*.0011*dt);

  const target = throttle*.088;
  speed += (target-speed)*.55*dt;
  speed = Math.max(0, speed - Math.abs(pitch)*.012);

  if(keys.arrowup) pitch += .75*dt;
  if(keys.arrowdown) pitch -= .75*dt;
  if(keys.arrowleft) roll += 1.05*dt;
  if(keys.arrowright) roll -= 1.05*dt;
  if(keys.a) yaw += .75*dt;
  if(keys.d) yaw -= .75*dt;

  pitch = THREE.MathUtils.clamp(pitch,-.55,.55);
  roll = THREE.MathUtils.clamp(roll,-.9,.9);
  pitch *= .985;
  roll *= .982;
  yaw *= .94;

  const ground = h(plane.position.x, plane.position.z) + 3;
  const lift = Math.max(0, speed-2.5)*pitch*4.5 + Math.max(0, speed-3.8)*.025;
  const gravity = plane.position.y <= ground+.2 && speed < 3.3 ? 0 : .065;
  plane.position.y += (lift-gravity)*60*dt;

  if(plane.position.y < ground) {
    plane.position.y = ground;
    if(pitch < -.12 && speed > 3.7) speed *= .82;
  }

  plane.rotation.x = pitch;
  plane.rotation.z = roll;
  plane.rotation.y += (yaw + roll*.55)*dt;

  const forward = new THREE.Vector3(0,0,-1).applyQuaternion(plane.quaternion);
  plane.position.add(forward.multiplyScalar(speed*60*dt));
  propeller.rotation.z += (throttle+speed*8)*dt*12;
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
  } else camera.lookAt(plane.position);
}

function updateHud() {
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

function addEvents() {
  document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    if(e.key.toLowerCase()==="c") camMode=(camMode+1)%3;
    if(e.key.toLowerCase()==="r") reset();
  });
  document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

  bind("up","arrowup"); bind("down","arrowdown"); bind("left","arrowleft"); bind("right","arrowright");
  bind("power","w"); bind("brake","s");
  document.getElementById("camera").onclick = () => camMode=(camMode+1)%3;
  document.getElementById("reset").onclick = reset;

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
