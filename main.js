(() => {
  "use strict";

  if (!window.THREE) {
    document.getElementById("loading").innerHTML =
      "<div><h1>Erro</h1><p>Three.js não carregou. Confira sua internet ou publique no GitHub Pages.</p></div>";
    return;
  }

  const MAP_SIZE = 5000;
  const HALF = MAP_SIZE / 2;

  const QUALITY = [
    { name: "Ultra leve", pixel: 0.45, buildings: 20, trees: 40, clouds: 5, fog: 3600 },
    { name: "Baixa", pixel: 0.62, buildings: 38, trees: 80, clouds: 8, fog: 4800 },
    { name: "Alta", pixel: 0.88, buildings: 75, trees: 150, clouds: 15, fog: 7000 }
  ];

  const AIRPORTS = [
    { id: "OFC", name: "Aeroporto Central OFC", x: 0, z: 850, heading: 180, length: 1600 },
    { id: "ILHA", name: "Aeroporto Ilha Azul", x: -1850, z: -1450, heading: 45, length: 950 },
    { id: "SERRA", name: "Aeroporto Serra Norte", x: 1850, z: -1600, heading: 315, length: 1050 },
    { id: "CIDADE", name: "Aeroporto Cidade Leste", x: 1450, z: 900, heading: 90, length: 1250 }
  ];

  const MISSIONS = [
    { title: "Voo regional", from: "OFC", to: "ILHA", reward: 1200, text: "Decole do Central OFC e pouse na Ilha Azul." },
    { title: "Carga expressa", from: "ILHA", to: "SERRA", reward: 1800, text: "Leve carga leve até Serra Norte." },
    { title: "Executivo VIP", from: "SERRA", to: "CIDADE", reward: 2400, text: "Pouse com suavidade na Cidade Leste." },
    { title: "Retorno para base", from: "CIDADE", to: "OFC", reward: 3200, text: "Volte para o Aeroporto Central OFC." }
  ];

  let qualityIndex = 2;
  let quality = QUALITY[qualityIndex];

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.pixel));
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x82d9ff);
  scene.fog = new THREE.Fog(0x82d9ff, 1200, quality.fog);

  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    18000
  );

  scene.add(new THREE.HemisphereLight(0xffffff, 0x3b7f3b, 1.95));

  const sun = new THREE.DirectionalLight(0xffffff, 2.15);
  sun.position.set(900, 1700, 700);
  scene.add(sun);

  let dynamicObjects = [];
  let keys = {};
  let pressed = {};
  let cameraMode = 0;
  let activeMission = null;
  let missionIndex = -1;
  let money = 0;
  let completed = 0;

  function el(id) {
    return document.getElementById(id);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function dist2(x1, z1, x2, z2) {
    const dx = x1 - x2;
    const dz = z1 - z2;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function airport(id) {
    return AIRPORTS.find(a => a.id === id);
  }

  function fmtMoney(value) {
    return "$" + Math.round(value).toLocaleString("en-US");
  }

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
    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(18000, 18000, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0x1d73b7 })
    );
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -0.1;
    scene.add(ocean);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE, 32, 32),
      new THREE.MeshLambertMaterial({ color: 0x2e9b43 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    AIRPORTS.forEach(createAirport);
    createMountains();
  }

  function createAirport(airportData) {
    const group = new THREE.Group();

    const runway = new THREE.Mesh(
      new THREE.PlaneGeometry(90, airportData.length, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0x242424 })
    );
    runway.rotation.x = -Math.PI / 2;
    runway.position.y = 0.04;
    group.add(runway);

    const white = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let z = -airportData.length / 2 + 80; z < airportData.length / 2; z += 120) {
      const mark = new THREE.Mesh(new THREE.PlaneGeometry(5, 50, 1, 1), white);
      mark.rotation.x = -Math.PI / 2;
      mark.position.set(0, 0.07, z);
      group.add(mark);
    }

    [-48, 48].forEach(x => {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(3, airportData.length, 1, 1), white);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.065, 0);
      group.add(line);
    });

    const terminal = new THREE.Mesh(
      new THREE.BoxGeometry(170, 34, 70),
      new THREE.MeshLambertMaterial({ color: 0x9aa8b2 })
    );
    terminal.position.set(150, 17, -120);
    group.add(terminal);

    const tower = new THREE.Mesh(
      new THREE.BoxGeometry(25, 90, 25),
      new THREE.MeshLambertMaterial({ color: 0xc9d5db })
    );
    tower.position.set(120, 45, 80);
    group.add(tower);

    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffff66 });
    for (let i = -airportData.length / 2; i < airportData.length / 2; i += 140) {
      [-58, 58].forEach(x => {
        const light = new THREE.Mesh(new THREE.SphereGeometry(5, 8, 6), lightMat);
        light.position.set(x, 4, i);
        group.add(light);
      });
    }

    group.position.set(airportData.x, 0, airportData.z);
    group.rotation.y = -THREE.Math.degToRad(airportData.heading);
    scene.add(group);
  }

  function createMountains() {
    const geometry = new THREE.ConeGeometry(1, 1, 6);
    const material = new THREE.MeshLambertMaterial({ color: 0x757960 });
    const mesh = new THREE.InstancedMesh(geometry, material, 22);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < 22; i++) {
      const h = 170 + Math.random() * 460;
      const r = 120 + Math.random() * 280;
      const side = Math.random() < 0.5 ? -1 : 1;

      dummy.position.set(
        side * (1550 + Math.random() * 900),
        h / 2,
        -1700 + Math.random() * 1300
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

    const trees = createTrees(quality.trees);
    dynamicObjects.push(trees.trunks, trees.tops);

    dynamicObjects.push(createClouds(quality.clouds));
  }

  function createBuildings(count) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial({ color: 0xb8c4ca });
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 1400 + 1050;
      const z = (Math.random() - 0.5) * 1800 - 500;
      const h = 20 + Math.random() * 160;

      dummy.position.set(x, h / 2, z);
      dummy.scale.set(24 + Math.random() * 55, h, 24 + Math.random() * 55);
      dummy.rotation.y = Math.random() * Math.PI;
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
      const x = (Math.random() - 0.5) * 4700;
      const z = (Math.random() - 0.5) * 4700;

      let nearAirport = false;
      for (const a of AIRPORTS) {
        if (Math.abs(x - a.x) < 190 && Math.abs(z - a.z) < 900) nearAirport = true;
      }
      if (nearAirport) continue;

      const s = 0.75 + Math.random() * 1.25;

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
      const puffs = 3 + Math.floor(Math.random() * 4);

      for (let j = 0; j < puffs; j++) {
        const puff = new THREE.Mesh(geometry, material);
        puff.scale.set(
          55 + Math.random() * 75,
          13 + Math.random() * 10,
          35 + Math.random() * 50
        );
        puff.position.set((j - puffs / 2) * 45, Math.random() * 12, Math.random() * 20);
        cloud.add(puff);
      }

      cloud.position.set(
        (Math.random() - 0.5) * 5800,
        520 + Math.random() * 760,
        (Math.random() - 0.5) * 5800
      );
      cloud.rotation.y = Math.random() * Math.PI;
      group.add(cloud);
    }

    scene.add(group);
    return group;
  }

  function createPlane() {
    const group = new THREE.Group();

    const white = new THREE.MeshLambertMaterial({ color: 0xf7f7f7 });
    const red = new THREE.MeshLambertMaterial({ color: 0xe02828 });
    const dark = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const glassMaterial = new THREE.MeshBasicMaterial({
      color: 0x174a78,
      transparent: true,
      opacity: 0.75
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 12), white);

    const wing = new THREE.Mesh(new THREE.BoxGeometry(20, 0.22, 3.2), white);
    wing.position.z = -1;

    const tail = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 2), white);
    tail.position.z = 5.1;

    const rudder = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.1, 2), red);
    rudder.position.set(0, 1.75, 5.2);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.35, 3, 18), red);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = -7.5;

    const glass = new THREE.Mesh(new THREE.SphereGeometry(1.15, 16, 8), glassMaterial);
    glass.scale.set(0.85, 0.45, 1.25);
    glass.position.set(0, 1.05, -3);

    const prop = new THREE.Mesh(new THREE.BoxGeometry(0.16, 5.8, 0.16), dark);
    prop.position.z = -9.05;

    group.add(body, wing, tail, rudder, nose, glass, prop);
    group.userData.prop = prop;

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
    maxThrust: 5400,
    dragArea: 0.78,
    inducedDrag: 0.052,
    stallAngle: 15,

    throttle: 0,
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
    onGround: true
  };

  function resetToAirport(a) {
    aircraft.throttle = 0;
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
    aircraft.onGround = true;
    syncPlane();
  }

  function updatePhysics(dt) {
    if (aircraft.crashed) {
      aircraft.velocity.multiplyScalar(Math.pow(0.2, dt));
      aircraft.throttle *= Math.pow(0.08, dt);
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

    let cl = 0.25 + 4.8 * aoa;
    aircraft.stall = speed > 32 && absAoa > aircraft.stallAngle;

    if (aircraft.stall) {
      cl *= clamp(1 - (absAoa - aircraft.stallAngle) / 20, 0.18, 1);
    }

    cl = clamp(cl, -1.1, 1.55);

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
      aircraft.angularPitch -= 0.75 * dt;
      aircraft.angularRoll += Math.sin(performance.now() * 0.006) * 0.9 * dt;
      aircraft.angularYaw += Math.cos(performance.now() * 0.005) * 0.35 * dt;
    }

    aircraft.angularPitch *= Math.pow(0.22, dt);
    aircraft.angularRoll *= Math.pow(0.16, dt);
    aircraft.angularYaw *= Math.pow(0.28, dt);

    aircraft.pitch += aircraft.angularPitch * dt;
    aircraft.roll += aircraft.angularRoll * dt;
    aircraft.yaw += aircraft.angularYaw * dt;

    aircraft.pitch = clamp(aircraft.pitch, -1.05, 1.05);
    aircraft.roll = clamp(aircraft.roll, -1.45, 1.45);

    aircraft.position.addScaledVector(aircraft.velocity, dt);

    if (aircraft.position.y < 3) {
      const verticalImpact = Math.abs(aircraft.velocity.y);
      const bank = Math.abs(aircraft.roll);
      const nose = Math.abs(aircraft.pitch);

      if (verticalImpact > 6.8 || bank > 0.78 || nose > 0.58 || speed > 88) {
        aircraft.crashed = true;
        aircraft.velocity.multiplyScalar(0.12);
      } else {
        aircraft.position.y = 3;
        aircraft.velocity.y = 0;
        aircraft.onGround = true;

        const friction = aircraft.throttle > 0.05 ? 0.988 : 0.95;
        aircraft.velocity.x *= Math.pow(friction, dt * 60);
        aircraft.velocity.z *= Math.pow(friction, dt * 60);

        aircraft.pitch *= Math.pow(0.32, dt);
        aircraft.roll *= Math.pow(0.18, dt);
        aircraft.yaw += rudder * clamp(speed / 35, 0.1, 1) * 0.75 * dt;
      }
    } else {
      aircraft.onGround = false;
    }

    syncPlane();
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
    }
  }

  function speedKmh() {
    return aircraft.velocity.length() * 3.6;
  }

  function altitude() {
    return Math.max(0, aircraft.position.y - 3);
  }

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

    const distance = dist2(
      aircraft.position.x,
      aircraft.position.z,
      activeMission.to.x,
      activeMission.to.z
    );

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
    else if (cameraMode === 1) offset = new THREE.Vector3(0, 2.4, 9);
    else offset = new THREE.Vector3(0, 70, 10);

    offset.applyEuler(plane.rotation);

    const desired = plane.position.clone().add(offset);
    camera.position.lerp(desired, 1 - Math.pow(0.001, dt));

    if (cameraMode === 1) {
      const look = new THREE.Vector3(0, 1.8, -80).applyEuler(plane.rotation).add(plane.position);
      camera.lookAt(look);
    } else {
      camera.lookAt(plane.position.x, plane.position.y + 1.5, plane.position.z - 8);
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

    let status = "Na pista";

    if (aircraft.crashed) status = "Acidente! Aperte R";
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
      const distance = dist2(
        aircraft.position.x,
        aircraft.position.z,
        activeMission.to.x,
        activeMission.to.z
      );

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
    }

    if (once("c")) cameraMode = (cameraMode + 1) % 3;

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
