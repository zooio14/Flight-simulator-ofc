(() => {
  "use strict";

  if (!window.THREE) {
    document.getElementById("loading").innerHTML =
      "<div><h1>Erro</h1><p>Three.js não carregou. Confira sua internet ou publique no GitHub Pages.</p></div>";
    return;
  }

  const MAP_SIZE = 6000;
  const HALF = MAP_SIZE / 2;

  const QUALITY = [
    { name: "Ultra leve", pixel: 0.45, buildings: 30, trees: 60, clouds: 5, fog: 4200, particles: 24 },
    { name: "Baixa", pixel: 0.62, buildings: 55, trees: 120, clouds: 8, fog: 5600, particles: 38 },
    { name: "Alta", pixel: 0.9, buildings: 110, trees: 220, clouds: 16, fog: 8200, particles: 64 }
  ];

  const AIRPORTS = [
    { id: "OFC", name: "Aeroporto Central OFC", x: 0, z: 980, heading: 180, length: 1750 },
    { id: "ILHA", name: "Aeroporto Ilha Azul", x: -2200, z: -1700, heading: 45, length: 1050 },
    { id: "SERRA", name: "Aeroporto Serra Norte", x: 2200, z: -1850, heading: 315, length: 1150 },
    { id: "CIDADE", name: "Aeroporto Cidade Leste", x: 1700, z: 1150, heading: 90, length: 1350 }
  ];

  const MISSIONS = [
    { title: "Voo regional", from: "OFC", to: "ILHA", reward: 1600, text: "Decole do Central OFC e pouse na Ilha Azul." },
    { title: "Carga expressa", from: "ILHA", to: "SERRA", reward: 2200, text: "Leve carga leve até Serra Norte." },
    { title: "Executivo VIP", from: "SERRA", to: "CIDADE", reward: 2800, text: "Pouse com suavidade na Cidade Leste." },
    { title: "Retorno para base", from: "CIDADE", to: "OFC", reward: 3800, text: "Volte para o Aeroporto Central OFC." }
  ];

  let qualityIndex = 2;
  let quality = QUALITY[qualityIndex];

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.pixel));
  renderer.outputEncoding = THREE.sRGBEncoding;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x7ddcff);
  scene.fog = new THREE.Fog(0x7ddcff, 1200, quality.fog);

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 20000);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x397739, 2.05);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 2.25);
  sun.position.set(900, 1800, 700);
  scene.add(sun);

  let dynamicObjects = [];
  let keys = {};
  let pressed = {};
  let cameraMode = 0;
  let activeMission = null;
  let missionIndex = -1;
  let money = 0;
  let completed = 0;
  let explosions = [];

  const el = id => document.getElementById(id);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const dist2 = (x1, z1, x2, z2) => Math.hypot(x1 - x2, z1 - z2);
  const airport = id => AIRPORTS.find(a => a.id === id);
  const fmtMoney = value => "$" + Math.round(value).toLocaleString("en-US");

  window.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();
    if (!keys[key]) pressed[key] = true;
    keys[key] = true;
  });

  window.addEventListener("keyup", event => {
    keys[event.key.toLowerCase()] = false;
  });

  function down(key) {
    return !!keys[key.toLowerCase()];
  }

  function once(key) {
    key = key.toLowerCase();
    if (pressed[key]) {
      pressed[key] = false;
      return true;
    }
    return false;
  }

  function addStaticWorld() {
    createSkyDome();

    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(22000, 22000, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0x1d73b7 })
    );
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -0.1;
    scene.add(ocean);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE, 48, 48),
      new THREE.MeshLambertMaterial({ color: 0x2f9b43 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    createRoads();
    AIRPORTS.forEach(createAirport);
    createMountains();
  }

  function createSkyDome() {
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(9000, 32, 16),
      new THREE.MeshBasicMaterial({ color: 0x9be7ff, side: THREE.BackSide })
    );
    sky.position.y = 500;
    scene.add(sky);
  }

  function createRoads() {
    const mat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    for (let i = -2; i <= 2; i++) {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(28, 3600), mat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(900 + i * 260, 0.025, -350);
      scene.add(road);

      const cross = new THREE.Mesh(new THREE.PlaneGeometry(3600, 24), mat);
      cross.rotation.x = -Math.PI / 2;
      cross.position.set(900, 0.026, -350 + i * 260);
      scene.add(cross);
    }
  }

  function createAirport(a) {
    const group = new THREE.Group();

    const runway = new THREE.Mesh(
      new THREE.PlaneGeometry(95, a.length, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0x242424 })
    );
    runway.rotation.x = -Math.PI / 2;
    runway.position.y = 0.04;
    group.add(runway);

    const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const yellow = new THREE.MeshBasicMaterial({ color: 0xffd34d });

    for (let z = -a.length / 2 + 80; z < a.length / 2; z += 120) {
      const mark = new THREE.Mesh(new THREE.PlaneGeometry(5, 50), white);
      mark.rotation.x = -Math.PI / 2;
      mark.position.set(0, 0.07, z);
      group.add(mark);
    }

    [-50, 50].forEach(x => {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(3, a.length), white);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.065, 0);
      group.add(line);
    });

    const taxi = new THREE.Mesh(
      new THREE.PlaneGeometry(32, a.length * 0.55),
      new THREE.MeshLambertMaterial({ color: 0x303030 })
    );
    taxi.rotation.x = -Math.PI / 2;
    taxi.position.set(145, 0.05, 0);
    group.add(taxi);

    const terminal = new THREE.Mesh(
      new THREE.BoxGeometry(210, 38, 80),
      new THREE.MeshLambertMaterial({ color: 0xa7b2ba })
    );
    terminal.position.set(190, 19, -150);
    group.add(terminal);

    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(215, 20, 3),
      new THREE.MeshBasicMaterial({ color: 0x65c7ff, transparent: true, opacity: 0.45 })
    );
    glass.position.set(190, 28, -191);
    group.add(glass);

    const tower = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.BoxGeometry(24, 95, 24), new THREE.MeshLambertMaterial({ color: 0xd5dee3 }));
    stem.position.y = 47;
    const top = new THREE.Mesh(new THREE.BoxGeometry(50, 24, 50), new THREE.MeshLambertMaterial({ color: 0x7f98a8 }));
    top.position.y = 103;
    tower.add(stem, top);
    tower.position.set(130, 0, 90);
    group.add(tower);

    for (let i = -a.length / 2; i < a.length / 2; i += 140) {
      [-62, 62].forEach(x => {
        const light = new THREE.Mesh(new THREE.SphereGeometry(4.5, 8, 6), yellow);
        light.position.set(x, 4, i);
        group.add(light);
      });
    }

    group.position.set(a.x, 0, a.z);
    group.rotation.y = -THREE.Math.degToRad(a.heading);
    scene.add(group);
  }

  function createMountains() {
    const geometry = new THREE.ConeGeometry(1, 1, 6);
    const material = new THREE.MeshLambertMaterial({ color: 0x737861 });
    const mesh = new THREE.InstancedMesh(geometry, material, 26);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < 26; i++) {
      const h = 180 + Math.random() * 520;
      const r = 120 + Math.random() * 320;
      const side = Math.random() < 0.5 ? -1 : 1;

      dummy.position.set(
        side * (1700 + Math.random() * 1100),
        h / 2,
        -1900 + Math.random() * 1500
      );
      dummy.scale.set(r, h, r);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
  }

  function rebuildDynamicWorld() {
    dynamicObjects.forEach(object => scene.remove(object));
    dynamicObjects = [];

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.pixel));
    scene.fog.far = quality.fog;
    el("quality").textContent = quality.name;

    dynamicObjects.push(createBuildings(quality.buildings));

    const windows = createBuildingWindows(Math.floor(quality.buildings * 5));
    dynamicObjects.push(windows);

    const trees = createTrees(quality.trees);
    dynamicObjects.push(trees.trunks, trees.tops);

    dynamicObjects.push(createClouds(quality.clouds));
  }

  function createBuildings(count) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial({ color: 0xaab7c0 });
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 1600 + 1050;
      const z = (Math.random() - 0.5) * 1850 - 520;
      const h = 24 + Math.random() * 190;

      dummy.position.set(x, h / 2, z);
      dummy.scale.set(28 + Math.random() * 58, h, 28 + Math.random() * 58);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.updateMatrix();

      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
    return mesh;
  }

  function createBuildingWindows(count) {
    const geo = new THREE.PlaneGeometry(10, 5);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffe895, transparent: true, opacity: 0.62 });
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 1600 + 1050;
      const z = (Math.random() - 0.5) * 1850 - 520;
      const y = 20 + Math.random() * 150;
      dummy.position.set(x, y, z - 25);
      dummy.rotation.y = 0;
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
    return mesh;
  }

  function createTrees(count) {
    const trunkGeometry = new THREE.CylinderGeometry(1.2, 1.6, 10, 6);
    const topGeometry = new THREE.ConeGeometry(7, 20, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x75461f });
    const topMaterial = new THREE.MeshLambertMaterial({ color: 0x0f642c });

    const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, count);
    const tops = new THREE.InstancedMesh(topGeometry, topMaterial, count);
    const dummy = new THREE.Object3D();

    let placed = 0;
    while (placed < count) {
      const x = (Math.random() - 0.5) * 5600;
      const z = (Math.random() - 0.5) * 5600;

      let nearAirport = false;
      for (const a of AIRPORTS) {
        if (Math.abs(x - a.x) < 220 && Math.abs(z - a.z) < 1000) nearAirport = true;
      }
      if (nearAirport) continue;

      const s = 0.75 + Math.random() * 1.35;

      dummy.position.set(x, 5 * s, z);
      dummy.scale.set(s, s, s);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.updateMatrix();
      trunks.setMatrixAt(placed, dummy.matrix);

      dummy.position.set(x, 20 * s, z);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      tops.setMatrixAt(placed, dummy.matrix);

      placed++;
    }

    trunks.instanceMatrix.needsUpdate = true;
    tops.instanceMatrix.needsUpdate = true;

    scene.add(trunks, tops);
    return { trunks, tops };
  }

  function createClouds(count) {
    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(1, 10, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });

    for (let i = 0; i < count; i++) {
      const cloud = new THREE.Group();
      const puffs = 4 + Math.floor(Math.random() * 5);

      for (let j = 0; j < puffs; j++) {
        const puff = new THREE.Mesh(geometry, material);
        puff.scale.set(
          55 + Math.random() * 95,
          13 + Math.random() * 13,
          35 + Math.random() * 65
        );
        puff.position.set((j - puffs / 2) * 45, Math.random() * 16, Math.random() * 24);
        cloud.add(puff);
      }

      cloud.position.set(
        (Math.random() - 0.5) * 6800,
        560 + Math.random() * 850,
        (Math.random() - 0.5) * 6800
      );
      cloud.rotation.y = Math.random() * Math.PI;
      group.add(cloud);
    }

    scene.add(group);
    return group;
  }

  function createPlane() {
    const group = new THREE.Group();

    const white = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });
    const red = new THREE.MeshLambertMaterial({ color: 0xe02828 });
    const blue = new THREE.MeshLambertMaterial({ color: 0x2458d8 });
    const dark = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const glassMaterial = new THREE.MeshBasicMaterial({
      color: 0x174a78,
      transparent: true,
      opacity: 0.75
    });

    const fuselage = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.2, 13.5), white);
    group.add(fuselage);

    const belly = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.35, 10), blue);
    belly.position.y = -0.95;
    group.add(belly);

    const wing = new THREE.Mesh(new THREE.BoxGeometry(22, 0.22, 3.5), white);
    wing.position.z = -1.3;
    group.add(wing);

    const leftTip = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 3.7), red);
    leftTip.position.set(-11.1, 0.05, -1.3);
    group.add(leftTip);

    const rightTip = leftTip.clone();
    rightTip.position.x = 11.1;
    group.add(rightTip);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.2, 2.1), white);
    tail.position.z = 5.5;
    group.add(tail);

    const rudder = new THREE.Mesh(new THREE.BoxGeometry(0.38, 3.4, 2.2), red);
    rudder.position.set(0, 1.9, 5.6);
    group.add(rudder);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.45, 3.2, 22), red);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = -8.25;
    group.add(nose);

    const glass = new THREE.Mesh(new THREE.SphereGeometry(1.18, 18, 9), glassMaterial);
    glass.scale.set(0.9, 0.46, 1.3);
    glass.position.set(0, 1.08, -3.25);
    group.add(glass);

    const prop = new THREE.Mesh(new THREE.BoxGeometry(0.16, 6.2, 0.16), dark);
    prop.position.z = -9.85;
    group.add(prop);
    group.userData.prop = prop;

    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x151515 });
    const wheel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.35, 14), wheelMat);
    wheel1.rotation.z = Math.PI / 2;
    wheel1.position.set(-1.2, -1.35, -1);
    group.add(wheel1);

    const wheel2 = wheel1.clone();
    wheel2.position.x = 1.2;
    group.add(wheel2);

    const wheel3 = wheel1.clone();
    wheel3.scale.set(0.7, 0.7, 0.7);
    wheel3.position.set(0, -1.25, -6.1);
    group.add(wheel3);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(7, 24),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.18,
        depthWrite: false
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.08;
    scene.add(shadow);

    group.userData.shadow = shadow;
    scene.add(group);

    return group;
  }

  const plane = createPlane();

  const aircraft = {
    mass: 1100,
    wingArea: 16.2,
    maxThrust: 5600,
    dragArea: 0.75,
    inducedDrag: 0.052,
    stallAngle: 15,

    throttle: 0,
    health: 100,
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    pitch: 0,
    yaw: Math.PI,
    roll: 0,
    angularPitch: 0,
    angularYaw: 0,
    angularRoll: 0,
    aoa: 0,
    stall: false,
    crashed: false,
    exploded: false,
    onGround: true
  };

  function resetToAirport(a) {
    aircraft.throttle = 0;
    aircraft.health = 100;
    aircraft.position.set(a.x, 3, a.z);
    aircraft.velocity.set(0, 0, -2);
    aircraft.pitch = 0;
    aircraft.yaw = Math.PI - THREE.Math.degToRad(a.heading);
    aircraft.roll = 0;
    aircraft.angularPitch = 0;
    aircraft.angularYaw = 0;
    aircraft.angularRoll = 0;
    aircraft.aoa = 0;
    aircraft.stall = false;
    aircraft.crashed = false;
    aircraft.exploded = false;
    aircraft.onGround = true;
    plane.visible = true;
    syncPlane();
  }

  function updatePhysics(dt) {
    if (aircraft.crashed) {
      aircraft.velocity.multiplyScalar(Math.pow(0.18, dt));
      aircraft.throttle *= Math.pow(0.06, dt);
      syncPlane();
      return;
    }

    if (down("w")) aircraft.throttle += 0.42 * dt;
    if (down("s")) aircraft.throttle -= 0.7 * dt;
    aircraft.throttle = clamp(aircraft.throttle, 0, 1);

    const elevator = (down("arrowup") ? 1 : 0) - (down("arrowdown") ? 1 : 0);
    const aileron = (down("arrowleft") ? 1 : 0) - (down("arrowright") ? 1 : 0);
    const rudder = (down("a") ? 1 : 0) - (down("d") ? 1 : 0);

    const speed = aircraft.velocity.length();

    const euler = new THREE.Euler(aircraft.pitch, aircraft.yaw, aircraft.roll, "YXZ");
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(euler).normalize();
    const up = new THREE.Vector3(0, 1, 0).applyEuler(euler).normalize();

    const velDir = aircraft.velocity.clone().normalize();
    let aoa = Math.asin(clamp(forward.y - velDir.y, -1, 1));
    if (speed < 8) aoa = aircraft.pitch;
    aircraft.aoa = aoa;

    const aoaDeg = THREE.Math.radToDeg(aoa);
    const absAoa = Math.abs(aoaDeg);

    let cl = 0.25 + 4.9 * aoa;
    aircraft.stall = speed > 32 && absAoa > aircraft.stallAngle;

    if (aircraft.stall) {
      cl *= clamp(1 - (absAoa - aircraft.stallAngle) / 20, 0.16, 1);
    }

    cl = clamp(cl, -1.15, 1.58);

    const rho = 1.225 * Math.exp(-Math.max(0, aircraft.position.y) / 8500);
    const q = 0.5 * rho * speed * speed;

    const liftMag = q * aircraft.wingArea * cl;
    const dragCoeff = aircraft.dragArea + aircraft.inducedDrag * cl * cl;
    const dragMag = q * dragCoeff;

    const gravity = new THREE.Vector3(0, -9.81 * aircraft.mass, 0);
    const thrust = forward.clone().multiplyScalar(aircraft.throttle * aircraft.maxThrust);
    const lift = up.clone().multiplyScalar(liftMag);
    const drag = aircraft.velocity.clone().multiplyScalar(-1).normalize().multiplyScalar(dragMag);

    const force = new THREE.Vector3().add(gravity).add(thrust).add(lift).add(drag);
    aircraft.velocity.addScaledVector(force.multiplyScalar(1 / aircraft.mass), dt);

    const authority = clamp(speed / 55, 0.18, 1.35);

    aircraft.angularPitch += elevator * 0.95 * authority * dt;
    aircraft.angularRoll += aileron * 1.9 * authority * dt;
    aircraft.angularYaw += rudder * 0.7 * authority * dt;
    aircraft.angularYaw += Math.sin(aircraft.roll) * 0.24 * authority * dt;

    if (aircraft.stall) {
      aircraft.angularPitch -= 0.8 * dt;
      aircraft.angularRoll += Math.sin(performance.now() * 0.006) * 1.1 * dt;
      aircraft.angularYaw += Math.cos(performance.now() * 0.005) * 0.4 * dt;
    }

    aircraft.angularPitch *= Math.pow(0.22, dt);
    aircraft.angularRoll *= Math.pow(0.16, dt);
    aircraft.angularYaw *= Math.pow(0.28, dt);

    aircraft.pitch += aircraft.angularPitch * dt;
    aircraft.roll += aircraft.angularRoll * dt;
    aircraft.yaw += aircraft.angularYaw * dt;

    aircraft.pitch = clamp(aircraft.pitch, -1.08, 1.08);
    aircraft.roll = clamp(aircraft.roll, -1.5, 1.5);

    aircraft.position.addScaledVector(aircraft.velocity, dt);

    handleGroundCollision(speed);
    syncPlane();
  }

  function handleGroundCollision(speed) {
    if (aircraft.position.y >= 3) {
      aircraft.onGround = false;
      return;
    }

    const verticalImpact = Math.abs(aircraft.velocity.y);
    const bank = Math.abs(aircraft.roll);
    const nose = Math.abs(aircraft.pitch);
    const hardHit = verticalImpact > 6.5 || bank > 0.76 || nose > 0.58 || speed > 88;

    if (hardHit) {
      const damage = Math.round(verticalImpact * 9 + speed * 0.75 + bank * 35 + nose * 35);
      aircraft.health -= damage;

      if (aircraft.health <= 0 || verticalImpact > 10 || speed > 115) {
        explodePlane();
      } else {
        aircraft.crashed = true;
        aircraft.position.y = 3;
        aircraft.velocity.multiplyScalar(0.12);
      }
    } else {
      aircraft.position.y = 3;
      aircraft.velocity.y = 0;
      aircraft.onGround = true;

      const friction = aircraft.throttle > 0.05 ? 0.988 : 0.95;
      aircraft.velocity.x *= Math.pow(friction, 1);
      aircraft.velocity.z *= Math.pow(friction, 1);

      aircraft.pitch *= 0.985;
      aircraft.roll *= 0.95;
    }
  }

  function explodePlane() {
    if (aircraft.exploded) return;

    aircraft.health = 0;
    aircraft.crashed = true;
    aircraft.exploded = true;
    plane.visible = false;

    createExplosion(aircraft.position.clone());
    el("message").innerHTML = "BOOM! O avião explodiu. Aperte R para resetar.";
  }

  function createExplosion(position) {
    const group = new THREE.Group();
    const count = quality.particles;
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff7a00, transparent: true, opacity: 0.95 });
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.55 });

    for (let i = 0; i < count; i++) {
      const mat = i % 3 === 0 ? smokeMat : fireMat;
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(4 + Math.random() * 10, 8, 6), mat);
      sphere.position.copy(position);
      sphere.userData.vel = new THREE.Vector3(
        (Math.random() - 0.5) * 75,
        25 + Math.random() * 85,
        (Math.random() - 0.5) * 75
      );
      sphere.userData.life = 1.3 + Math.random() * 1.2;
      sphere.userData.maxLife = sphere.userData.life;
      group.add(sphere);
    }

    scene.add(group);
    explosions.push(group);
  }

  function updateExplosions(dt) {
    for (let i = explosions.length - 1; i >= 0; i--) {
      const group = explosions[i];
      let alive = false;

      group.children.forEach(p => {
        p.userData.life -= dt;
        if (p.userData.life > 0) {
          alive = true;
          p.userData.vel.y -= 35 * dt;
          p.position.addScaledVector(p.userData.vel, dt);
          const t = p.userData.life / p.userData.maxLife;
          p.material.opacity = t;
          p.scale.multiplyScalar(1 + dt * 1.25);
        }
      });

      if (!alive) {
        scene.remove(group);
        explosions.splice(i, 1);
      }
    }
  }

  function syncPlane() {
    plane.position.copy(aircraft.position);
    plane.rotation.order = "YXZ";
    plane.rotation.y = aircraft.yaw;
    plane.rotation.x = aircraft.pitch;
    plane.rotation.z = aircraft.roll;

    if (plane.userData.prop) {
      plane.userData.prop.rotation.z += 0.12 + aircraft.throttle * 1.1;
    }

    const shadow = plane.userData.shadow;
    if (shadow) {
      shadow.position.x = aircraft.position.x;
      shadow.position.z = aircraft.position.z;
      shadow.material.opacity = clamp(0.22 - aircraft.position.y / 850, 0.02, 0.18);
      shadow.scale.setScalar(clamp(1 + aircraft.position.y / 180, 1, 8));
      shadow.visible = plane.visible;
    }
  }

  const speedKmh = () => aircraft.velocity.length() * 3.6;
  const altitude = () => Math.max(0, aircraft.position.y - 3);

  const marker = createMarker();
  scene.add(marker);
  marker.visible = false;

  function createMarker() {
    const group = new THREE.Group();

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(85, 5, 8, 48),
      new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );
    ring.rotation.x = Math.PI / 2;

    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(35, 120, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd000, transparent: true, opacity: 0.55 })
    );
    cone.position.y = 100;

    group.add(ring, cone);
    return group;
  }

  function startMission(index) {
    missionIndex = index;
    const mission = MISSIONS[missionIndex];

    activeMission = {
      data: mission,
      from: airport(mission.from),
      to: airport(mission.to),
      airborne: false,
      completed: false
    };

    resetToAirport(activeMission.from);

    marker.visible = true;
    marker.position.set(activeMission.to.x, 12, activeMission.to.z);
  }

  function nextMission() {
    startMission((missionIndex + 1 + MISSIONS.length) % MISSIONS.length);
  }

  function randomMission() {
    startMission(Math.floor(Math.random() * MISSIONS.length));
  }

  function updateMission() {
    if (!activeMission) return;

    if (altitude() > 25) activeMission.airborne = true;

    const distance = dist2(aircraft.position.x, aircraft.position.z, activeMission.to.x, activeMission.to.z);

    if (
      activeMission.airborne &&
      distance < 190 &&
      aircraft.onGround &&
      speedKmh() < 120 &&
      !aircraft.crashed &&
      !activeMission.completed
    ) {
      activeMission.completed = true;
      completed++;
      money += activeMission.data.reward;
      marker.visible = false;
      el("message").innerHTML = "Missão concluída! Recompensa recebida. Aperte N ou M para outra missão.";
    }
  }

  function updateCamera(dt) {
    let offset;

    if (cameraMode === 0) offset = new THREE.Vector3(0, 9, 34);
    else if (cameraMode === 1) offset = new THREE.Vector3(0, 2.6, 9);
    else if (cameraMode === 2) offset = new THREE.Vector3(0, 75, 10);
    else offset = new THREE.Vector3(32, 15, 32);

    offset.applyEuler(plane.rotation);

    const desired = plane.visible ? plane.position.clone().add(offset) : aircraft.position.clone().add(new THREE.Vector3(0, 70, 90));
    camera.position.lerp(desired, 1 - Math.pow(0.001, dt));

    if (cameraMode === 1 && plane.visible) {
      const look = new THREE.Vector3(0, 1.8, -90).applyEuler(plane.rotation).add(plane.position);
      camera.lookAt(look);
    } else {
      camera.lookAt(aircraft.position.x, aircraft.position.y + 1.5, aircraft.position.z - 8);
    }
  }

  let fpsValue = 60;
  let fpsLast = performance.now();
  let fpsFrames = 0;

  function updateHUD() {
    fpsFrames++;
    const now = performance.now();

    if (now - fpsLast > 500) {
      fpsValue = Math.round(fpsFrames * 1000 / (now - fpsLast));
      fpsFrames = 0;
      fpsLast = now;
    }

    el("fps").textContent = fpsValue;
    el("speed").textContent = Math.round(speedKmh());
    el("altitude").textContent = Math.round(altitude());
    el("throttle").textContent = Math.round(aircraft.throttle * 100);
    el("aoa").textContent = THREE.Math.radToDeg(aircraft.aoa).toFixed(1);
    el("vertical").textContent = aircraft.velocity.y.toFixed(1);
    el("health").textContent = Math.max(0, Math.round(aircraft.health));

    let status = "Na pista";

    if (aircraft.exploded) status = "Explodiu! Aperte R";
    else if (aircraft.crashed) status = "Acidente! Aperte R";
    else if (aircraft.stall) status = "STALL! Baixe o nariz e ganhe velocidade";
    else if (altitude() > 12) status = "Voando";
    else if (speedKmh() > 95) status = "Decolando";

    if (Math.abs(aircraft.position.x) > HALF || Math.abs(aircraft.position.z) > HALF) {
      status += " / sobre oceano";
    }

    const statusEl = el("status");
    statusEl.textContent = status;
    statusEl.className = aircraft.crashed ? "bad" : aircraft.stall ? "warn" : altitude() > 12 ? "good" : "";

    if (activeMission) {
      const distance = dist2(aircraft.position.x, aircraft.position.z, activeMission.to.x, activeMission.to.z);

      el("missionTitle").textContent =
        activeMission.data.title + " — " + activeMission.from.name + " → " + activeMission.to.name;

      el("missionText").textContent =
        activeMission.completed ? "Concluída! Aperte N/M para outra." : activeMission.data.text;

      el("missionDistance").textContent = Math.round(distance);
    } else {
      el("missionTitle").textContent = "Pressione N para iniciar";
      el("missionText").textContent = "Voe de um aeroporto para outro.";
      el("missionDistance").textContent = "0";
    }

    el("money").textContent = fmtMoney(money) + " | Concluídas: " + completed;
  }

  function shortcuts() {
    if (once("r")) {
      if (activeMission) resetToAirport(activeMission.from);
      else resetToAirport(AIRPORTS[0]);
      el("message").innerHTML = "Avião resetado.";
    }

    if (once("c")) cameraMode = (cameraMode + 1) % 4;

    if (once("q")) {
      qualityIndex = (qualityIndex + 1) % QUALITY.length;
      quality = QUALITY[qualityIndex];
      rebuildDynamicWorld();
    }

    if (once("n")) randomMission();
    if (once("m")) nextMission();
  }

  addStaticWorld();
  rebuildDynamicWorld();
  resetToAirport(AIRPORTS[0]);

  let last = performance.now();

  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.033);
    last = now;

    shortcuts();
    updatePhysics(dt);
    updateMission();
    updateExplosions(dt);
    updateCamera(dt);
    updateHUD();

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  el("loading").style.display = "none";
  requestAnimationFrame(loop);
})();
