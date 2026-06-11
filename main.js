import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('game');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 700, 4500);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 12000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

const sun = new THREE.DirectionalLight(0xffffff, 2.5);
sun.position.set(300, 800, 400);
scene.add(sun);

const ambient = new THREE.HemisphereLight(0xbfe9ff, 0x35651f, 1.4);
scene.add(ambient);

const groundGeo = new THREE.PlaneGeometry(9000, 9000, 160, 160);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x2f8f3a, roughness: 0.9 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const runway = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 1400),
  new THREE.MeshStandardMaterial({ color: 0x252525, roughness: 0.7 })
);
runway.rotation.x = -Math.PI / 2;
runway.position.y = 0.03;
runway.position.z = -220;
scene.add(runway);

for (let i = -650; i <= 450; i += 100) {
  const mark = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 45),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  mark.rotation.x = -Math.PI / 2;
  mark.position.set(0, 0.05, i);
  scene.add(mark);
}

function makeBuilding(x, z, w, h, d, color) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.65 })
  );
  mesh.position.set(x, h / 2, z);
  scene.add(mesh);
}

for (let i = 0; i < 130; i++) {
  const x = (Math.random() - 0.5) * 4500;
  const z = -1200 - Math.random() * 4200;
  const h = 20 + Math.random() * 150;
  makeBuilding(x, z, 25 + Math.random() * 45, h, 25 + Math.random() * 45, new THREE.Color().setHSL(0.58, 0.18, 0.35 + Math.random() * 0.35));
}

function createPlane() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 12),
    new THREE.MeshStandardMaterial({ color: 0xe8e8e8, metalness: 0.25, roughness: 0.35 })
  );
  group.add(body);

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(1.35, 3, 24),
    new THREE.MeshStandardMaterial({ color: 0xd92f2f, metalness: 0.15, roughness: 0.35 })
  );
  nose.rotation.x = Math.PI / 2;
  nose.position.z = -7.5;
  group.add(nose);

  const wing = new THREE.Mesh(
    new THREE.BoxGeometry(18, 0.25, 3),
    new THREE.MeshStandardMaterial({ color: 0xf5f5f5, metalness: 0.2, roughness: 0.4 })
  );
  wing.position.z = -1;
  group.add(wing);

  const tailWing = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.2, 2),
    new THREE.MeshStandardMaterial({ color: 0xf5f5f5, metalness: 0.2, roughness: 0.4 })
  );
  tailWing.position.z = 5;
  group.add(tailWing);

  const rudder = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 3, 2),
    new THREE.MeshStandardMaterial({ color: 0xd92f2f, roughness: 0.4 })
  );
  rudder.position.set(0, 1.7, 5.2);
  group.add(rudder);

  const cockpit = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 24, 12),
    new THREE.MeshStandardMaterial({ color: 0x1b3d5a, transparent: true, opacity: 0.72, roughness: 0.15 })
  );
  cockpit.scale.set(0.85, 0.45, 1.3);
  cockpit.position.set(0, 1.05, -3.1);
  group.add(cockpit);

  const prop = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 5.5, 0.18),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  prop.position.z = -9.05;
  group.add(prop);
  group.userData.prop = prop;

  return group;
}

const plane = createPlane();
plane.position.set(0, 3, 260);
scene.add(plane);

const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === 'r') resetPlane();
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

const state = {
  throttle: 0,
  speed: 0,
  altitude: 3,
  pitch: 0,
  roll: 0,
  yaw: 0,
  verticalSpeed: 0,
  crashed: false
};

function resetPlane() {
  plane.position.set(0, 3, 260);
  plane.rotation.set(0, 0, 0);
  state.throttle = 0;
  state.speed = 0;
  state.altitude = 3;
  state.pitch = 0;
  state.roll = 0;
  state.yaw = 0;
  state.verticalSpeed = 0;
  state.crashed = false;
}

function updateFlight(dt) {
  if (state.crashed) {
    state.throttle *= 0.985;
    state.speed *= 0.98;
    return;
  }

  if (keys['w']) state.throttle += 0.45 * dt;
  if (keys['s']) state.throttle -= 0.65 * dt;
  state.throttle = THREE.MathUtils.clamp(state.throttle, 0, 1);

  const pitchInput = (keys['arrowup'] ? 1 : 0) - (keys['arrowdown'] ? 1 : 0);
  const rollInput = (keys['arrowleft'] ? 1 : 0) - (keys['arrowright'] ? 1 : 0);
  const yawInput = (keys['a'] ? 1 : 0) - (keys['d'] ? 1 : 0);

  state.pitch += pitchInput * 0.9 * dt;
  state.roll += rollInput * 1.5 * dt;
  state.yaw += yawInput * 0.75 * dt + state.roll * 0.22 * dt;

  state.pitch *= 0.985;
  state.roll *= 0.975;

  state.pitch = THREE.MathUtils.clamp(state.pitch, -0.55, 0.55);
  state.roll = THREE.MathUtils.clamp(state.roll, -1.05, 1.05);

  const targetSpeed = state.throttle * 330;
  state.speed += (targetSpeed - state.speed) * 0.42 * dt;

  const speedMS = state.speed / 3.6;
  const lift = Math.max(0, (state.speed - 80) / 150) * (0.5 + Math.max(state.pitch, -0.1));
  const gravity = 0.75;

  state.verticalSpeed += (lift - gravity + state.pitch * 1.35) * dt * 9;
  state.verticalSpeed *= 0.985;

  const forward = new THREE.Vector3(
    Math.sin(state.yaw),
    Math.sin(state.pitch),
    -Math.cos(state.yaw)
  ).normalize();

  plane.position.addScaledVector(forward, speedMS * dt * 1.65);
  plane.position.y += state.verticalSpeed * dt;

  if (plane.position.y < 3) {
    if (Math.abs(state.verticalSpeed) > 9 || Math.abs(state.roll) > 0.65 || state.speed > 235) {
      state.crashed = true;
      plane.position.y = 2;
      state.speed *= 0.25;
    } else {
      plane.position.y = 3;
      state.verticalSpeed = 0;
      if (state.speed < 90) {
        state.pitch *= 0.92;
        state.roll *= 0.88;
      }
    }
  }

  plane.rotation.order = 'YXZ';
  plane.rotation.y = state.yaw;
  plane.rotation.x = -state.pitch;
  plane.rotation.z = state.roll;

  plane.userData.prop.rotation.z += state.throttle * 45 * dt + 3 * dt;

  state.altitude = Math.max(0, plane.position.y - 3);
}

function updateCamera(dt) {
  const behind = new THREE.Vector3(0, 8, 28);
  behind.applyEuler(plane.rotation);
  const desired = plane.position.clone().add(behind);
  camera.position.lerp(desired, 1 - Math.pow(0.001, dt));
  camera.lookAt(plane.position.x, plane.position.y + 2, plane.position.z - 8);
}

function updateHUD() {
  document.getElementById('speed').textContent = Math.round(state.speed);
  document.getElementById('altitude').textContent = Math.round(state.altitude);
  document.getElementById('throttle').textContent = Math.round(state.throttle * 100);

  let status = 'Na pista';
  if (state.crashed) status = 'Acidente! Pressione R';
  else if (state.altitude > 8) status = 'Voando';
  else if (state.speed > 110) status = 'Decolando';
  document.getElementById('status').textContent = status;
}

let last = performance.now();
function animate(now) {
  const dt = Math.min((now - last) / 1000, 0.04);
  last = now;

  updateFlight(dt);
  updateCamera(dt);
  updateHUD();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
