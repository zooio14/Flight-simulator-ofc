(() => {
  "use strict";

  if (!window.THREE) {
    document.getElementById("loading").innerHTML =
      "<div><h1>Erro</h1><p>Three.js não carregou. Confira a internet ou publique no GitHub Pages.</p></div>";
    return;
  }

  const MAP_SIZE = 14000;
  const HALF = MAP_SIZE / 2;

  const QUALITY = [
    { name: "Ultra leve", pixel: 0.42, buildings: 35, trees: 80, clouds: 5, fog: 8400, particles: 24 },
    { name: "Baixa", pixel: 0.62, buildings: 75, trees: 170, clouds: 9, fog: 10800, particles: 38 },
    { name: "Alta", pixel: 0.9, buildings: 145, trees: 320, clouds: 18, fog: 15000, particles: 64 }
  ];

  const AIRCRAFT_TYPES = [
    {
      id: "cessna",
      name: "Leve inspirado no Cessna",
      model: "cessna",
      takeoff: 98,
      landingMax: 185,
      maxSpeed: 360,
      thrust: 66,
      boost: 1.22,
      drag: 0.00165,
      lift: 18.3,
      control: 1.25,
      stallAngle: 23,
      stallSpeed: 70,
      cameraBack: 34,
      hitboxRadius: 7
    },
    {
      id: "boeing",
      name: "Jato comercial inspirado no 737",
      model: "boeing",
      takeoff: 205,
      landingMax: 315,
      maxSpeed: 900,
      thrust: 94,
      boost: 1.16,
      drag: 0.00088,
      lift: 16.2,
      control: 0.72,
      stallAngle: 20,
      stallSpeed: 155,
      cameraBack: 55,
      hitboxRadius: 14
    },
    {
      id: "f22",
      name: "Caça stealth inspirado no F-22",
      model: "f22",
      takeoff: 145,
      landingMax: 260,
      maxSpeed: 1850,
      thrust: 168,
      boost: 1.42,
      drag: 0.00048,
      lift: 22.8,
      control: 1.85,
      stallAngle: 30,
      stallSpeed: 105,
      cameraBack: 42,
      hitboxRadius: 10
    }
  ];

  const AIRPORTS = [
    { id: "OFC", name: "Aeroporto Central OFC", x: 0, z: 1350, heading: 180, length: 2100 },
    { id: "ILHA", name: "Aeroporto Ilha Azul", x: -3600, z: -3000, heading: 45, length: 1300 },
    { id: "SERRA", name: "Aeroporto Serra Norte", x: 3650, z: -3300, heading: 315, length: 1450 },
    { id: "CIDADE", name: "Aeroporto Cidade Leste", x: 3150, z: 1900, heading: 90, length: 1700 },
    { id: "DESERTO", name: "Base Deserto Sul", x: -2900, z: 3200, heading: 270, length: 1600 },
    { id: "NAVAL", name: "Base Naval Costa", x: 0, z: -4300, heading: 0, length: 1500 },
    { id: "VALE", name: "Aeroporto Vale Verde", x: -4300, z: 200, heading: 135, length: 1200 },
    { id: "METRO", name: "Aeroporto Metropolitano", x: 4200, z: 250, heading: 90, length: 2300 }
  ];

  const MISSIONS = [
    { title: "Voo escola", from: "OFC", to: "VALE", reward: 1400, text: "Voo curto para treinar decolagem e pouso." },
    { title: "Voo regional", from: "OFC", to: "ILHA", reward: 2600, text: "Cruze o mapa até Ilha Azul." },
    { title: "Carga expressa", from: "ILHA", to: "SERRA", reward: 3300, text: "Leve carga leve até Serra Norte." },
    { title: "Executivo VIP", from: "SERRA", to: "CIDADE", reward: 4200, text: "Pouse com suavidade na Cidade Leste." },
    { title: "Operação militar", from: "NAVAL", to: "DESERTO", reward: 5200, text: "Use o caça e atravesse a rota rápida." },
    { title: "Linha comercial", from: "METRO", to: "OFC", reward: 6200, text: "Rota de jato comercial até a base central." }
  ];

  let qualityIndex = 2;
  let quality = QUALITY[qualityIndex];
  let aircraftIndex = 0;
  let aircraftType = AIRCRAFT_TYPES[aircraftIndex];

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.pixel));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.03;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8fd3ff);
  scene.fog = new THREE.Fog(0x9bd6ff, 2100, quality.fog);

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 26000);

  scene.add(new THREE.HemisphereLight(0xf7fbff, 0x4a7a4c, 1.55));
  const sun = new THREE.DirectionalLight(0xfff4df, 1.85);
  sun.position.set(1200, 2200, 800);
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
  let plane = null;
  let lastLanding = null;
  let showHitboxes = false;
  let hitboxHelpers = [];
  let planeHitboxHelper = null;
  let staticColliders = [];
  let dynamicColliders = [];

  const el = id => document.getElementById(id);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const dist2 = (x1, z1, x2, z2) => Math.hypot(x1 - x2, z1 - z2);
  const airport = id => AIRPORTS.find(a => a.id === id);
  const fmtMoney = value => "$" + Math.round(value).toLocaleString("en-US");
  const wrapDegrees = value => ((value + 540) % 360) - 180;

  window.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();
    if (!keys[key]) pressed[key] = true;
    keys[key] = true;
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
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

  const Y_AXIS = new THREE.Vector3(0, 1, 0);

  function airportWorldPosition(a, localX, localY, localZ) {
    const p = new THREE.Vector3(localX, localY, localZ);
    p.applyAxisAngle(Y_AXIS, -THREE.Math.degToRad(a.heading));
    return { x: a.x + p.x, y: localY, z: a.z + p.z };
  }

  function airportLocalPosition(a, x, z) {
    const p = new THREE.Vector3(x - a.x, 0, z - a.z);
    p.applyAxisAngle(Y_AXIS, THREE.Math.degToRad(a.heading));
    return p;
  }

  function isInRunwayZone(a, x, z, margin = 0) {
    const local = airportLocalPosition(a, x, z);
    return Math.abs(local.x) <= 74 + margin && Math.abs(local.z) <= a.length / 2 + margin;
  }

  function isAirportProtected(x, z, margin = 360) {
    return AIRPORTS.some(a => isInRunwayZone(a, x, z, margin) || dist2(x, z, a.x, a.z) < margin * 1.25);
  }

  function addCollider(list, label, x, y, z, halfX, halfY, halfZ, damage = 1) {
    list.push({ label, x, y, z, halfX, halfY, halfZ, damage });
  }

  function addAirportCollider(a, label, localX, localY, localZ, halfX, halfY, halfZ, damage = 1.15) {
    const p = airportWorldPosition(a, localX, localY, localZ);
    addCollider(staticColliders, label, p.x, p.y, p.z, halfX, halfY, halfZ, damage);
  }

  function addLayeredCollider(list, label, x, z, layers, damage = 1) {
    layers.forEach(layer => {
      addCollider(list, label, x, layer.y, z, layer.halfX, layer.halfY, layer.halfZ, damage);
    });
  }

  function allColliders() {
    return staticColliders.concat(dynamicColliders);
  }

  function clearHitboxHelpers() {
    hitboxHelpers.forEach(helper => scene.remove(helper));
    hitboxHelpers = [];
    if (planeHitboxHelper) {
      scene.remove(planeHitboxHelper);
      planeHitboxHelper = null;
    }
  }

  function rebuildHitboxHelpers() {
    clearHitboxHelpers();
    if (!showHitboxes) return;

    const mat = new THREE.MeshBasicMaterial({
      color: 0xff4d4d,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });

    allColliders().forEach(collider => {
      const helper = new THREE.Mesh(
        new THREE.BoxGeometry(collider.halfX * 2, collider.halfY * 2, collider.halfZ * 2),
        mat
      );
      helper.position.set(collider.x, collider.y, collider.z);
      scene.add(helper);
      hitboxHelpers.push(helper);
    });

    planeHitboxHelper = new THREE.Mesh(
      new THREE.SphereGeometry(aircraftType.hitboxRadius, 16, 10),
      new THREE.MeshBasicMaterial({ color: 0x4dd8ff, wireframe: true, transparent: true, opacity: 0.7 })
    );
    scene.add(planeHitboxHelper);
  }

  function addStaticWorld() {
    staticColliders = [];

    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(30000, 30000, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0x287fb5 })
    );
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -0.1;
    scene.add(ocean);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE, 80, 80),
      new THREE.MeshLambertMaterial({ color: 0x43a35b })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    createTerrainPatches();
    createRoads();
    createRivers();
    AIRPORTS.forEach(createAirport);
    createMountains();
  }

  function createTerrainPatches() {
    const colors = [0x3b9254, 0x58ad5d, 0x6eb86a, 0x4b9a63];

    for (let i = 0; i < 28; i++) {
      const patch = new THREE.Mesh(
        new THREE.PlaneGeometry(420 + Math.random() * 1100, 180 + Math.random() * 620),
        new THREE.MeshLambertMaterial({
          color: colors[Math.floor(Math.random() * colors.length)],
          transparent: true,
          opacity: 0.22,
          depthWrite: false
        })
      );
      patch.rotation.x = -Math.PI / 2;
      patch.rotation.z = Math.random() * Math.PI;
      patch.position.set((Math.random() - 0.5) * (MAP_SIZE * 0.86), 0.018, (Math.random() - 0.5) * (MAP_SIZE * 0.86));
      if (!isAirportProtected(patch.position.x, patch.position.z, 520)) scene.add(patch);
    }
  }

  function createRivers() {
    const mat = new THREE.MeshLambertMaterial({ color: 0x2d93ca });
    for (let i = 0; i < 3; i++) {
      const river = new THREE.Mesh(new THREE.PlaneGeometry(90, 5200), mat);
      river.rotation.x = -Math.PI / 2;
      river.rotation.z = (i - 1) * 0.35;
      river.position.set(-1200 + i * 1400, 0.032, -600 + i * 900);
      scene.add(river);
    }
  }

  function createRoads() {
    const mat = new THREE.MeshLambertMaterial({ color: 0x4c4d4f });
    for (let i = -4; i <= 4; i++) {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(28, 7200), mat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(1250 + i * 330, 0.035, -300);
      scene.add(road);

      const cross = new THREE.Mesh(new THREE.PlaneGeometry(7200, 24), mat);
      cross.rotation.x = -Math.PI / 2;
      cross.position.set(1250, 0.036, -300 + i * 330);
      scene.add(cross);
    }
  }

  function createAirport(a) {
    const group = new THREE.Group();

    const runway = new THREE.Mesh(
      new THREE.PlaneGeometry(105, a.length, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0x242424 })
    );
    runway.rotation.x = -Math.PI / 2;
    runway.position.y = 0.045;
    group.add(runway);

    const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const yellow = new THREE.MeshBasicMaterial({ color: 0xffd34d });

    for (let z = -a.length / 2 + 80; z < a.length / 2; z += 120) {
      const mark = new THREE.Mesh(new THREE.PlaneGeometry(5, 55), white);
      mark.rotation.x = -Math.PI / 2;
      mark.position.set(0, 0.075, z);
      group.add(mark);
    }

    [-55, 55].forEach(x => {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(3, a.length), white);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.07, 0);
      group.add(line);
    });

    const taxi = new THREE.Mesh(
      new THREE.PlaneGeometry(34, a.length * 0.52),
      new THREE.MeshLambertMaterial({ color: 0x303030 })
    );
    taxi.rotation.x = -Math.PI / 2;
    taxi.position.set(160, 0.055, 0);
    group.add(taxi);

    const terminal = new THREE.Mesh(
      new THREE.BoxGeometry(250, 44, 90),
      new THREE.MeshLambertMaterial({ color: 0xa7b2ba })
    );
    terminal.position.set(225, 22, -165);
    group.add(terminal);

    const terminalGlass = new THREE.Mesh(
      new THREE.BoxGeometry(252, 22, 4),
      new THREE.MeshBasicMaterial({ color: 0x66caff, transparent: true, opacity: 0.45 })
    );
    terminalGlass.position.set(225, 32, -212);
    group.add(terminalGlass);

    const tower = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.BoxGeometry(24, 105, 24), new THREE.MeshLambertMaterial({ color: 0xd5dee3 }));
    stem.position.y = 52;
    const top = new THREE.Mesh(new THREE.BoxGeometry(55, 26, 55), new THREE.MeshLambertMaterial({ color: 0x7f98a8 }));
    top.position.y = 113;
    tower.add(stem, top);
    tower.position.set(145, 0, 100);
    group.add(tower);

    addAirportCollider(a, "terminal do aeroporto", 225, 21, -165, 120, 21, 41, 1.2);
    addAirportCollider(a, "terminal do aeroporto", 225, 32, -212, 121, 10, 2.4, 1.2);
    addAirportCollider(a, "torre de controle", 145, 52, 100, 11, 52, 11, 1.35);
    addAirportCollider(a, "torre de controle", 145, 113, 100, 27, 13, 27, 1.35);

    for (let i = -a.length / 2; i < a.length / 2; i += 140) {
      [-68, 68].forEach(x => {
        const light = new THREE.Mesh(new THREE.SphereGeometry(1.65, 8, 6), yellow);
        light.position.set(x, 2.2, i);
        group.add(light);
      });
    }

    group.position.set(a.x, 0, a.z);
    group.rotation.y = -THREE.Math.degToRad(a.heading);
    scene.add(group);
  }

  function createMountains() {
    const geometry = new THREE.ConeGeometry(1, 1, 6);
    const material = new THREE.MeshLambertMaterial({ color: 0x78806d });
    const mesh = new THREE.InstancedMesh(geometry, material, 42);
    const dummy = new THREE.Object3D();

    let placed = 0;
    let attempts = 0;

    while (placed < 42 && attempts < 420) {
      attempts++;
      const h = 200 + Math.random() * 720;
      const r = 140 + Math.random() * 420;
      const angle = Math.random() * Math.PI * 2;
      const radius = 3300 + Math.random() * 2300;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      if (isAirportProtected(x, z, r + 620)) continue;

      dummy.position.set(x, h / 2, z);
      dummy.scale.set(r, h, r);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      addLayeredCollider(staticColliders, "montanha", x, z, [
        { y: h * 0.22, halfX: r * 0.58, halfY: h * 0.22, halfZ: r * 0.58 },
        { y: h * 0.58, halfX: r * 0.36, halfY: h * 0.17, halfZ: r * 0.36 },
        { y: h * 0.83, halfX: r * 0.2, halfY: h * 0.15, halfZ: r * 0.2 }
      ], 1.7);
      placed++;
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
  }

  function rebuildDynamicWorld() {
    dynamicObjects.forEach(object => scene.remove(object));
    dynamicObjects = [];
    dynamicColliders = [];
    clearHitboxHelpers();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.pixel));
    scene.fog.far = quality.fog;
    el("quality").textContent = quality.name;

    dynamicObjects.push(createBuildings(quality.buildings));

    const trees = createTrees(quality.trees);
    dynamicObjects.push(trees.trunks, trees.tops);

    dynamicObjects.push(createClouds(quality.clouds));
    rebuildHitboxHelpers();
  }

  function createBuildings(count) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const baseMesh = new THREE.InstancedMesh(geometry, material, count);
    const midMesh = new THREE.InstancedMesh(geometry, material, count);
    const topMesh = new THREE.InstancedMesh(geometry, material, count);
    const group = new THREE.Group();
    group.add(baseMesh, midMesh, topMesh);
    const dummy = new THREE.Object3D();
    const buildingColors = [0xb7c4cc, 0xcfd7d2, 0xaeb8c1, 0xc5bba8, 0xb9c7af, 0xd8d4c6];

    let placed = 0;
    let midPlaced = 0;
    let topPlaced = 0;
    let attempts = 0;

    function setBuildingLayer(mesh, index, x, y, z, w, h, d, color) {
      dummy.position.set(x, y, z);
      dummy.scale.set(w, h, d);
      dummy.rotation.y = 0;
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, color);
    }

    function addBuildingColliderLayer(x, y, z, w, h, d) {
      addCollider(dynamicColliders, "prédio", x, y, z, w * 0.46, h * 0.5, d * 0.46, 1.25);
    }

    while (placed < count && attempts < count * 12) {
      attempts++;
      const cluster = Math.random() < 0.65;
      const x = cluster ? (Math.random() - 0.5) * 2600 + 1800 : (Math.random() - 0.5) * (MAP_SIZE * 0.82);
      const z = cluster ? (Math.random() - 0.5) * 2600 - 350 : (Math.random() - 0.5) * (MAP_SIZE * 0.82);
      const h = cluster ? 35 + Math.random() * 260 : 15 + Math.random() * 90;
      const w = 30 + Math.random() * 75;
      const d = 30 + Math.random() * 75;

      if (isAirportProtected(x, z, 440)) continue;

      const color = new THREE.Color(buildingColors[Math.floor(Math.random() * buildingColors.length)]);
      const tall = h > 105;
      const baseH = tall ? h * 0.46 : h * 0.76;
      const midH = tall ? h * 0.34 : h * 0.24;
      const topH = tall ? h - baseH - midH : 0;
      const baseW = w;
      const baseD = d;
      const midW = w * (tall ? 0.76 : 0.84);
      const midD = d * (tall ? 0.76 : 0.84);
      const topW = w * 0.54;
      const topD = d * 0.54;

      setBuildingLayer(baseMesh, placed, x, baseH / 2, z, baseW, baseH, baseD, color);
      addBuildingColliderLayer(x, baseH / 2, z, baseW, baseH, baseD);

      setBuildingLayer(midMesh, midPlaced, x, baseH + midH / 2, z, midW, midH, midD, color);
      addBuildingColliderLayer(x, baseH + midH / 2, z, midW, midH, midD);
      midPlaced++;

      if (tall) {
        setBuildingLayer(topMesh, topPlaced, x, baseH + midH + topH / 2, z, topW, topH, topD, color);
        addBuildingColliderLayer(x, baseH + midH + topH / 2, z, topW, topH, topD);
        topPlaced++;
      }

      placed++;
    }

    baseMesh.count = placed;
    midMesh.count = midPlaced;
    topMesh.count = topPlaced;
    [baseMesh, midMesh, topMesh].forEach(mesh => {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
    scene.add(group);
    return group;
  }

  function createTrees(count) {
    const trunkGeometry = new THREE.CylinderGeometry(1.2, 1.6, 10, 6);
    const topGeometry = new THREE.ConeGeometry(7, 20, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x7a5129 });
    const topMaterial = new THREE.MeshLambertMaterial({ color: 0x1f7a3a });

    const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, count);
    const tops = new THREE.InstancedMesh(topGeometry, topMaterial, count);
    const dummy = new THREE.Object3D();

    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < count * 14) {
      attempts++;
      const x = (Math.random() - 0.5) * (MAP_SIZE * 0.9);
      const z = (Math.random() - 0.5) * (MAP_SIZE * 0.9);

      if (isAirportProtected(x, z, 320)) continue;

      const s = 0.75 + Math.random() * 1.55;

      dummy.position.set(x, 5 * s, z);
      dummy.scale.set(s, s, s);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.updateMatrix();
      trunks.setMatrixAt(placed, dummy.matrix);

      dummy.position.set(x, 20 * s, z);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      tops.setMatrixAt(placed, dummy.matrix);

      addLayeredCollider(dynamicColliders, "árvore", x, z, [
        { y: 5 * s, halfX: 1.8 * s, halfY: 5 * s, halfZ: 1.8 * s },
        { y: 20 * s, halfX: 5.4 * s, halfY: 9 * s, halfZ: 5.4 * s }
      ], 0.75);
      placed++;
    }

    trunks.count = placed;
    tops.count = placed;
    trunks.instanceMatrix.needsUpdate = true;
    tops.instanceMatrix.needsUpdate = true;
    scene.add(trunks, tops);
    return { trunks, tops };
  }

  function createClouds(count) {
    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(1, 10, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xf6fbff, transparent: true, opacity: 0.62, depthWrite: false });

    for (let i = 0; i < count; i++) {
      const cloud = new THREE.Group();
      const puffs = 4 + Math.floor(Math.random() * 5);
      for (let j = 0; j < puffs; j++) {
        const puff = new THREE.Mesh(geometry, material);
        puff.scale.set(65 + Math.random() * 120, 14 + Math.random() * 16, 45 + Math.random() * 80);
        puff.position.set((j - puffs / 2) * 50, Math.random() * 18, Math.random() * 26);
        cloud.add(puff);
      }
      cloud.position.set((Math.random() - 0.5) * 10500, 680 + Math.random() * 1100, (Math.random() - 0.5) * 10500);
      cloud.rotation.y = Math.random() * Math.PI;
      group.add(cloud);
    }

    scene.add(group);
    return group;
  }

  function makePlaneModel(type) {
    if (plane) {
      if (plane.userData.shadow) scene.remove(plane.userData.shadow);
      scene.remove(plane);
    }

    if (type.model === "boeing") plane = createBoeingLike();
    else if (type.model === "f22") plane = createF22Like();
    else plane = createCessnaLike();

    scene.add(plane);
    return plane;
  }

  function addShadow(group, radius) {
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(radius, 28),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.14, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.08;
    scene.add(shadow);
    group.userData.shadow = shadow;
  }

  function createCessnaLike() {
    const g = new THREE.Group();
    const white = new THREE.MeshLambertMaterial({ color: 0xf7f7f7 });
    const red = new THREE.MeshLambertMaterial({ color: 0xdd2020 });
    const dark = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const glass = new THREE.MeshBasicMaterial({ color: 0x174a78, transparent: true, opacity: 0.75 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.1, 13.5), white);
    g.add(body);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.35, 10), red);
    stripe.position.y = -0.65;
    g.add(stripe);

    const wing = new THREE.Mesh(new THREE.BoxGeometry(24, 0.22, 3.6), white);
    wing.position.set(0, 0.95, -1.2);
    g.add(wing);

    const strutMat = new THREE.MeshLambertMaterial({ color: 0xd9d9d9 });
    [-1, 1].forEach(side => {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 0.18), strutMat);
      strut.position.set(side * 5.5, -0.2, -1.2);
      strut.rotation.z = side * 0.35;
      g.add(strut);
    });

    const tail = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.2, 2.1), white);
    tail.position.z = 5.5;
    g.add(tail);

    const rudder = new THREE.Mesh(new THREE.BoxGeometry(0.38, 3.4, 2.2), red);
    rudder.position.set(0, 1.85, 5.6);
    g.add(rudder);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.45, 3.2, 22), red);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = -8.25;
    g.add(nose);

    const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.18, 18, 9), glass);
    canopy.scale.set(0.9, 0.46, 1.3);
    canopy.position.set(0, 1.12, -3.25);
    g.add(canopy);

    const prop = new THREE.Mesh(new THREE.BoxGeometry(0.16, 6.3, 0.16), dark);
    prop.position.z = -9.85;
    g.add(prop);
    g.userData.prop = prop;

    addWheels(g, 1.2);
    addShadow(g, 7);
    return g;
  }

  function createBoeingLike() {
    const g = new THREE.Group();
    const white = new THREE.MeshLambertMaterial({ color: 0xf2f2f2 });
    const blue = new THREE.MeshLambertMaterial({ color: 0x1c60d6 });
    const dark = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const glass = new THREE.MeshBasicMaterial({ color: 0x174a78, transparent: true, opacity: 0.78 });

    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 24, 24), white);
    fuselage.rotation.x = Math.PI / 2;
    g.add(fuselage);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.28, 18), blue);
    stripe.position.y = -0.25;
    g.add(stripe);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(1.55, 20, 10), white);
    nose.scale.set(1, 1, 0.75);
    nose.position.z = -12.4;
    g.add(nose);

    const tailCone = new THREE.Mesh(new THREE.ConeGeometry(1.55, 3.5, 20), white);
    tailCone.rotation.x = -Math.PI / 2;
    tailCone.position.z = 13.6;
    g.add(tailCone);

    const wing = new THREE.Mesh(new THREE.BoxGeometry(34, 0.28, 5.2), white);
    wing.position.z = -1.5;
    wing.rotation.z = 0.04;
    g.add(wing);

    const engineMat = new THREE.MeshLambertMaterial({ color: 0x444b55 });
    [-1, 1].forEach(side => {
      const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.2, 18), engineMat);
      engine.rotation.x = Math.PI / 2;
      engine.position.set(side * 8.5, -1.15, -3.2);
      g.add(engine);
    });

    const tail = new THREE.Mesh(new THREE.BoxGeometry(10, 0.25, 2.8), white);
    tail.position.z = 10.6;
    g.add(tail);

    const rudder = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5.2, 3.2), blue);
    rudder.position.set(0, 2.8, 10.6);
    g.add(rudder);

    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.7, 0.25), glass);
    cockpit.position.set(0, 0.8, -11.5);
    g.add(cockpit);

    const fakeProp = new THREE.Object3D();
    g.add(fakeProp);
    g.userData.prop = fakeProp;

    addWheels(g, 1.55);
    addShadow(g, 12);
    g.scale.set(1.15, 1.15, 1.15);
    return g;
  }

  function createF22Like() {
    const g = new THREE.Group();
    const grey = new THREE.MeshLambertMaterial({ color: 0x8c969e });
    const darkGrey = new THREE.MeshLambertMaterial({ color: 0x59626b });
    const glass = new THREE.MeshBasicMaterial({ color: 0x1b415f, transparent: true, opacity: 0.78 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.1, 15.5), grey);
    body.position.y = 0.2;
    g.add(body);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.35, 4.8, 4), grey);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = -10.1;
    nose.rotation.z = Math.PI / 4;
    g.add(nose);

    const mainWing = new THREE.Mesh(new THREE.BoxGeometry(24, 0.18, 4.6), grey);
    mainWing.position.z = -1.6;
    mainWing.rotation.y = 0;
    g.add(mainWing);

    const wingSweepL = new THREE.Mesh(new THREE.BoxGeometry(11, 0.16, 5), grey);
    wingSweepL.position.set(-7, 0.02, -0.2);
    wingSweepL.rotation.y = 0.45;
    g.add(wingSweepL);

    const wingSweepR = wingSweepL.clone();
    wingSweepR.position.x = 7;
    wingSweepR.rotation.y = -0.45;
    g.add(wingSweepR);

    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.2, 2.4), darkGrey);
    tailL.position.set(-2.1, 2.0, 5.8);
    tailL.rotation.z = -0.32;
    g.add(tailL);

    const tailR = tailL.clone();
    tailR.position.x = 2.1;
    tailR.rotation.z = 0.32;
    g.add(tailR);

    const rearWing = new THREE.Mesh(new THREE.BoxGeometry(10, 0.16, 2.2), grey);
    rearWing.position.z = 5.7;
    g.add(rearWing);

    const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.05, 16, 8), glass);
    canopy.scale.set(0.85, 0.34, 1.55);
    canopy.position.set(0, 1.02, -4.7);
    g.add(canopy);

    [-1, 1].forEach(side => {
      const exhaust = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.75, 1), darkGrey);
      exhaust.position.set(side * 0.8, 0, 8.1);
      g.add(exhaust);
    });

    const fakeProp = new THREE.Object3D();
    g.add(fakeProp);
    g.userData.prop = fakeProp;

    addShadow(g, 10);
    g.scale.set(1.05, 1.05, 1.05);
    return g;
  }

  function addWheels(group, size) {
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x151515 });
    const wheel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.45 * size, 0.45 * size, 0.35 * size, 14), wheelMat);
    wheel1.rotation.z = Math.PI / 2;
    wheel1.position.set(-1.2 * size, -1.25 * size, -1);
    group.add(wheel1);

    const wheel2 = wheel1.clone();
    wheel2.position.x = 1.2 * size;
    group.add(wheel2);

    const wheel3 = wheel1.clone();
    wheel3.scale.set(0.7, 0.7, 0.7);
    wheel3.position.set(0, -1.18 * size, -6.1);
    group.add(wheel3);
  }

  const aircraft = {
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
    stallPressure: 0,
    stall: false,
    crashed: false,
    exploded: false,
    onGround: true
  };

  function resetToAirport(a) {
    aircraft.throttle = 0;
    aircraft.health = 100;
    aircraft.position.set(a.x, 3, a.z);
    aircraft.velocity.set(0, 0, 0);
    aircraft.pitch = 0;
    aircraft.yaw = Math.PI - THREE.Math.degToRad(a.heading);
    aircraft.roll = 0;
    aircraft.angularPitch = 0;
    aircraft.angularYaw = 0;
    aircraft.angularRoll = 0;
    aircraft.aoa = 0;
    aircraft.stallPressure = 0;
    aircraft.stall = false;
    aircraft.crashed = false;
    aircraft.exploded = false;
    aircraft.onGround = true;
    lastLanding = null;
    plane.visible = true;
    syncPlane();
  }

  function switchAircraft(index) {
    const currentAirport = activeMission ? activeMission.from : AIRPORTS[0];
    aircraftIndex = index;
    aircraftType = AIRCRAFT_TYPES[aircraftIndex];
    makePlaneModel(aircraftType);
    resetToAirport(currentAirport);
    rebuildHitboxHelpers();
    el("message").innerHTML = "Aeronave trocada para: " + aircraftType.name;
  }

  function forwardVector() {
    return new THREE.Vector3(0, 0, -1)
      .applyEuler(new THREE.Euler(aircraft.pitch, aircraft.yaw, aircraft.roll, "YXZ"))
      .normalize();
  }

  function headingDegrees() {
    const fwd = forwardVector();
    return (THREE.Math.radToDeg(Math.atan2(fwd.x, -fwd.z)) + 360) % 360;
  }

  function bearingBetween(x1, z1, x2, z2) {
    return (THREE.Math.radToDeg(Math.atan2(x2 - x1, -(z2 - z1))) + 360) % 360;
  }

  function runwayHeadingError(a) {
    const heading = headingDegrees();
    const oneWay = Math.abs(wrapDegrees(heading - a.heading));
    const otherWay = Math.abs(wrapDegrees(heading - ((a.heading + 180) % 360)));
    return Math.min(oneWay, otherWay);
  }

  function runwayContact() {
    let nearest = null;
    let nearestDistance = Infinity;

    for (const a of AIRPORTS) {
      const distance = dist2(aircraft.position.x, aircraft.position.z, a.x, a.z);
      if (distance < nearestDistance) {
        nearest = a;
        nearestDistance = distance;
      }

      if (isInRunwayZone(a, aircraft.position.x, aircraft.position.z, 90)) {
        return { airport: a, distance, onRunway: true, alignment: runwayHeadingError(a) };
      }
    }

    return {
      airport: nearest,
      distance: nearestDistance,
      onRunway: false,
      alignment: nearest ? runwayHeadingError(nearest) : 180
    };
  }

  function recordLanding(info) {
    let score = 100;

    score -= clamp(info.verticalImpact - 1.4, 0, 10) * 8.5;
    score -= clamp(info.speedKmh - aircraftType.landingMax, 0, 360) * 0.12;
    score -= info.bank * 22;
    score -= info.nose * 16;
    score -= info.alignment > 35 ? clamp(info.alignment - 35, 0, 90) * 0.35 : 0;
    if (!info.onRunway) score -= 22;
    if (info.hardHit) score -= 20;

    score = Math.round(clamp(score, 0, 100));

    let label = "Pouso suave";
    let className = "good";
    if (score < 38) {
      label = info.onRunway ? "Pouso pesado" : "Fora da pista";
      className = "bad";
    } else if (score < 70) {
      label = info.onRunway ? "Pouso ok" : "Pouso fora da pista";
      className = "warn";
    } else if (score < 90) {
      label = "Bom pouso";
    }

    lastLanding = {
      score,
      label,
      className,
      bonus: info.onRunway ? Math.round(score * 12) : Math.round(score * 4),
      airportId: info.airport ? info.airport.id : null,
      text: label + " (" + score + "/100)"
    };

    el("message").innerHTML = lastLanding.text + (info.onRunway ? ". Boa!" : ". Tente alinhar na pista.");
  }

  function handleObjectCollisions(speedKmh) {
    const planeRadius = aircraftType.hitboxRadius;
    const colliders = allColliders();

    for (const collider of colliders) {
      const hit =
        Math.abs(aircraft.position.x - collider.x) <= collider.halfX + planeRadius &&
        Math.abs(aircraft.position.y - collider.y) <= collider.halfY + planeRadius &&
        Math.abs(aircraft.position.z - collider.z) <= collider.halfZ + planeRadius;

      if (!hit) continue;

      const impactSpeed = Math.max(speedKmh, aircraft.velocity.length() * 3.6);
      const damage = Math.round((18 + impactSpeed * 0.18) * collider.damage);
      aircraft.health -= damage;
      aircraft.crashed = true;
      aircraft.position.addScaledVector(aircraft.velocity.clone().normalize(), -8);
      aircraft.position.y = Math.max(3, aircraft.position.y);
      aircraft.velocity.multiplyScalar(-0.06);
      aircraft.angularPitch = 0;
      aircraft.angularRoll = 0;
      aircraft.angularYaw = 0;

      el("message").innerHTML = "Colisão com " + collider.label + ". Aperte R para resetar.";

      if (aircraft.health <= 0 || impactSpeed > 130 || collider.label === "montanha") {
        explodePlane();
      }

      return true;
    }

    return false;
  }

  function updatePhysics(dt) {
    if (aircraft.crashed) {
      aircraft.velocity.multiplyScalar(Math.pow(0.18, dt));
      aircraft.throttle *= Math.pow(0.06, dt);
      syncPlane();
      return;
    }

    if (down("w")) aircraft.throttle += 0.82 * dt;
    if (down("s")) aircraft.throttle -= 0.92 * dt;
    aircraft.throttle = clamp(aircraft.throttle, 0, 1);

    const elevator = (down("arrowup") ? 1 : 0) - (down("arrowdown") ? 1 : 0);
    const aileron = (down("arrowleft") ? 1 : 0) - (down("arrowright") ? 1 : 0);
    const rudder = (down("a") ? 1 : 0) - (down("d") ? 1 : 0);

    const fwd = forwardVector();
    const speed = aircraft.velocity.length();
    const speedKmh = speed * 3.6;
    const horizontalSpeed = Math.hypot(aircraft.velocity.x, aircraft.velocity.z);

    const boost = down("shift") ? aircraftType.boost : 1;
    const thrustAccel = aircraft.throttle * aircraftType.thrust * boost;
    aircraft.velocity.addScaledVector(fwd, thrustAccel * dt);

    // Limite suave de velocidade para cada modelo.
    const maxMS = aircraftType.maxSpeed / 3.6;
    if (speed > maxMS) {
      aircraft.velocity.multiplyScalar(1 - 0.45 * dt);
    }

    // Arrasto estável.
    const drag = aircraftType.drag * speed * speed + 0.018 * speed;
    if (speed > 0.01) {
      aircraft.velocity.addScaledVector(aircraft.velocity.clone().normalize(), -drag * dt);
    }

    // Gravidade
    aircraft.velocity.y -= 9.81 * dt;

    const velDir = aircraft.velocity.clone().normalize();
    let aoa = Math.asin(clamp(fwd.y - velDir.y, -1, 1));
    if (speed < 8) aoa = aircraft.pitch;
    aircraft.aoa = aoa;

    const aoaDeg = THREE.Math.radToDeg(aoa);
    const absAoa = Math.abs(aoaDeg);

    // Stall por velocidade: cada aeronave tem seu limite mínimo antes de perder sustentação.
    const stallSpeedMS = aircraftType.stallSpeed / 3.6;
    const airspeedRatio = speed / stallSpeedMS;
    const belowStallSpeed = !aircraft.onGround && speed < stallSpeedMS;
    const nearStallSpeed = !aircraft.onGround && speed < stallSpeedMS * 1.18;
    const pullingHard = elevator > 0 || aircraft.pitch > 0.18;
    const hardAngle = absAoa > aircraftType.stallAngle && pullingHard;
    let stallDemand = 0;

    if (belowStallSpeed) {
      const speedDeficit = clamp((1 - airspeedRatio) / 0.42, 0, 1);
      stallDemand = 0.38 + speedDeficit * 0.62;
      if (pullingHard) stallDemand = clamp(stallDemand + 0.18, 0, 1);
    }

    if (nearStallSpeed && hardAngle) {
      const angleDemand = clamp((absAoa - aircraftType.stallAngle) / 18, 0, 1);
      stallDemand = Math.max(stallDemand, 0.32 + angleDemand * 0.48);
    }

    const stallResponse = stallDemand > aircraft.stallPressure ? 1.85 : 3.3;
    aircraft.stallPressure += (stallDemand - aircraft.stallPressure) * clamp(stallResponse * dt, 0, 1);
    aircraft.stall = aircraft.stallPressure > 0.68;

    const speedLift = clamp((horizontalSpeed - stallSpeedMS * 0.45) / (stallSpeedMS * 1.15), 0, 1.75);
    const angleLift = clamp(0.55 + aircraft.pitch * 1.25 + aoa * 0.95, -0.25, 1.55);
    const stallLiftPenalty = 1 - aircraft.stallPressure * 0.42;
    const liftAccel = speedLift * angleLift * aircraftType.lift * stallLiftPenalty;

    aircraft.velocity.y += liftAccel * dt;

    const authorityBase = clamp(horizontalSpeed / (stallSpeedMS * 0.9), 0.18, 1.55);
    const stallControlPenalty = 1 - aircraft.stallPressure * 0.34;
    const authority = authorityBase * aircraftType.control * stallControlPenalty;

    aircraft.angularPitch += elevator * 1.25 * authority * dt;
    aircraft.angularRoll += aileron * 1.95 * authority * dt;
    aircraft.angularYaw += rudder * 0.82 * authority * dt;

    // Roll vira o avião, mas menos agressivo no Boeing.
    aircraft.angularYaw += Math.sin(aircraft.roll) * 0.34 * authority * dt;

    if (aircraft.stall) {
      aircraft.angularPitch -= 0.48 * dt;
      aircraft.angularRoll += Math.sin(performance.now() * 0.006) * 0.45 * dt;
      aircraft.angularYaw += Math.cos(performance.now() * 0.005) * 0.18 * dt;
    }

    aircraft.angularPitch *= Math.pow(0.16, dt);
    aircraft.angularRoll *= Math.pow(0.13, dt);
    aircraft.angularYaw *= Math.pow(0.22, dt);

    aircraft.pitch += aircraft.angularPitch * dt;
    aircraft.roll += aircraft.angularRoll * dt;
    aircraft.yaw += aircraft.angularYaw * dt;

    aircraft.pitch = clamp(aircraft.pitch, -0.9, 0.9);
    aircraft.roll = clamp(aircraft.roll, -1.55, 1.55);

    aircraft.position.addScaledVector(aircraft.velocity, dt);

    if (!handleObjectCollisions(speedKmh)) {
      handleGroundCollision(horizontalSpeed, speedKmh);
    }
    syncPlane();
  }

  function handleGroundCollision(horizontalSpeed, speedKmh) {
    if (aircraft.position.y >= 3) {
      aircraft.onGround = false;
      return;
    }

    const wasAirborne = !aircraft.onGround;
    const verticalImpact = Math.abs(aircraft.velocity.y);
    const bank = Math.abs(aircraft.roll);
    const nose = Math.abs(aircraft.pitch);
    const contact = runwayContact();

    const tooFast = speedKmh > aircraftType.landingMax;
    const unstableTouch = bank > 1.18 || nose > 0.95;
    const hardHit = verticalImpact > 11.5 || unstableTouch || (tooFast && (verticalImpact > 4.2 || !contact.onRunway));

    if (hardHit) {
      const damage = Math.round(verticalImpact * 7 + Math.max(0, speedKmh - aircraftType.landingMax) * 0.16 + bank * 28 + nose * 30);
      aircraft.health -= damage;
      if (wasAirborne) {
        recordLanding({
          airport: contact.airport,
          onRunway: contact.onRunway,
          alignment: contact.alignment,
          verticalImpact,
          speedKmh,
          bank,
          nose,
          hardHit: true
        });
      }

      aircraft.position.y = 3;
      aircraft.velocity.y = 0;
      aircraft.velocity.x *= 0.55;
      aircraft.velocity.z *= 0.55;
      aircraft.pitch *= 0.55;
      aircraft.roll *= 0.42;
      aircraft.onGround = true;
      aircraft.health = Math.max(5, aircraft.health);

      if (damage > 52 || verticalImpact > 18 || bank > 1.45 || nose > 1.18) {
        aircraft.crashed = true;
        aircraft.velocity.multiplyScalar(0.18);
        el("message").innerHTML = "Pouso muito pesado. O avião quebrou, mas não explodiu. Aperte R.";
      }
      return;
    }

    aircraft.position.y = 3;
    aircraft.velocity.y = 0;
    aircraft.onGround = true;

    if (wasAirborne) {
      recordLanding({
        airport: contact.airport,
        onRunway: contact.onRunway,
        alignment: contact.alignment,
        verticalImpact,
        speedKmh,
        bank,
        nose,
        hardHit: false
      });
    }

    const braking = down("s") ? 0.91 : 0.965;
    const friction = aircraft.throttle > 0.05 ? 0.992 : braking;
    aircraft.velocity.x *= friction;
    aircraft.velocity.z *= friction;

    aircraft.pitch *= 0.985;
    aircraft.roll *= 0.94;

    const rudder = (down("a") ? 1 : 0) - (down("d") ? 1 : 0);
    aircraft.yaw += rudder * clamp(horizontalSpeed / 30, 0.15, 1) * 0.024;
  }

  function explodePlane() {
    if (aircraft.exploded) return;

    aircraft.health = 0;
    aircraft.crashed = true;
    aircraft.exploded = true;
    aircraft.position.y = Math.max(3, aircraft.position.y);
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
        (Math.random() - 0.5) * 85,
        28 + Math.random() * 95,
        (Math.random() - 0.5) * 85
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
      plane.userData.prop.rotation.z += 0.18 + aircraft.throttle * 1.7;
    }

    const shadow = plane.userData.shadow;
    if (shadow) {
      shadow.position.x = aircraft.position.x;
      shadow.position.z = aircraft.position.z;
      shadow.material.opacity = clamp(0.23 - aircraft.position.y / 900, 0.02, 0.19);
      shadow.scale.setScalar(clamp(1 + aircraft.position.y / 180, 1, 10));
      shadow.visible = plane.visible;
    }

    if (planeHitboxHelper) {
      planeHitboxHelper.position.copy(aircraft.position);
      planeHitboxHelper.visible = showHitboxes && plane.visible;
    }
  }

  const speedKmh = () => aircraft.velocity.length() * 3.6;
  const altitude = () => Math.max(0, aircraft.position.y - 3);

  const marker = createMarker();
  scene.add(marker);
  marker.visible = false;

  function createMarker() {
    const group = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(90, 5, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
    ring.rotation.x = Math.PI / 2;
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(38, 135, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd000, transparent: true, opacity: 0.55 })
    );
    cone.position.y = 110;
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

    if (altitude() > 30) activeMission.airborne = true;

    const distance = dist2(aircraft.position.x, aircraft.position.z, activeMission.to.x, activeMission.to.z);

    if (
      activeMission.airborne &&
      distance < 300 &&
      aircraft.onGround &&
      speedKmh() < aircraftType.landingMax * 1.08 &&
      !aircraft.crashed &&
      !activeMission.completed
    ) {
      const landingBonus = lastLanding && lastLanding.airportId === activeMission.to.id ? lastLanding.bonus : 0;
      activeMission.completed = true;
      completed++;
      money += activeMission.data.reward + landingBonus;
      marker.visible = false;
      el("message").innerHTML =
        "Missão concluída! Recompensa " + fmtMoney(activeMission.data.reward) +
        (landingBonus ? " + bônus de pouso " + fmtMoney(landingBonus) : "") +
        ". Aperte N ou M para outra missão.";
    }
  }

  function updateCamera(dt) {
    let offset;

    if (cameraMode === 0) offset = new THREE.Vector3(0, 10, aircraftType.cameraBack);
    else if (cameraMode === 1) offset = new THREE.Vector3(0, 2.6, 9);
    else if (cameraMode === 2) offset = new THREE.Vector3(0, 95, 15);
    else offset = new THREE.Vector3(40, 18, 42);

    offset.applyEuler(plane.rotation);

    const desired = plane.visible
      ? plane.position.clone().add(offset)
      : aircraft.position.clone().add(new THREE.Vector3(0, 80, 110));

    camera.position.lerp(desired, 1 - Math.pow(0.001, dt));

    if (cameraMode === 1 && plane.visible) {
      const look = new THREE.Vector3(0, 1.8, -105).applyEuler(plane.rotation).add(plane.position);
      camera.lookAt(look);
    } else if (cameraMode === 2 && plane.visible) {
      camera.lookAt(aircraft.position.x, aircraft.position.y, aircraft.position.z);
    } else {
      const lookAhead = forwardVector().multiplyScalar(95).add(aircraft.position);
      camera.lookAt(lookAhead.x, lookAhead.y + 2.5, lookAhead.z);
    }
  }

  function currentNav() {
    const heading = headingDegrees();

    if (!activeMission || activeMission.completed) {
      return {
        heading,
        bearing: null,
        error: 0,
        distance: 0,
        guidance: activeMission && activeMission.completed ? "Missão concluída" : "Sem missão ativa"
      };
    }

    const bearing = bearingBetween(aircraft.position.x, aircraft.position.z, activeMission.to.x, activeMission.to.z);
    const error = wrapDegrees(bearing - heading);
    const absError = Math.abs(error);
    let guidance = "Rumo alinhado";

    if (absError > 9) guidance = "Vire " + (error > 0 ? "direita " : "esquerda ") + Math.round(absError) + "°";
    if (dist2(aircraft.position.x, aircraft.position.z, activeMission.to.x, activeMission.to.z) < 700) {
      guidance = "Aproxime e reduza para pouso";
    }

    return {
      heading,
      bearing,
      error,
      distance: dist2(aircraft.position.x, aircraft.position.z, activeMission.to.x, activeMission.to.z),
      guidance
    };
  }

  function drawMiniMap() {
    const canvas = el("miniMap");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(7, 23, 33, 0.92)";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    const toMap = (x, z) => ({
      x: clamp((x + HALF) / MAP_SIZE, 0, 1) * w,
      y: clamp((z + HALF) / MAP_SIZE, 0, 1) * h
    });

    if (activeMission && !activeMission.completed) {
      const from = toMap(aircraft.position.x, aircraft.position.z);
      const to = toMap(activeMission.to.x, activeMission.to.z);
      ctx.strokeStyle = "rgba(255, 216, 77, 0.75)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }

    AIRPORTS.forEach(a => {
      const p = toMap(a.x, a.z);
      ctx.fillStyle = activeMission && activeMission.to.id === a.id ? "#ffd84d" : "#8cffaa";
      ctx.beginPath();
      ctx.arc(p.x, p.y, activeMission && activeMission.to.id === a.id ? 4.2 : 2.8, 0, Math.PI * 2);
      ctx.fill();
    });

    const planePoint = toMap(aircraft.position.x, aircraft.position.z);
    ctx.save();
    ctx.translate(planePoint.x, planePoint.y);
    ctx.rotate(THREE.Math.degToRad(headingDegrees()));
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(5.5, 7);
    ctx.lineTo(0, 4);
    ctx.lineTo(-5.5, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function updateFlightDirector() {
    const nav = currentNav();
    el("directorHeading").textContent = Math.round(nav.heading).toString().padStart(3, "0") + "°";
    el("directorTarget").textContent = nav.bearing === null ? "--" : Math.round(nav.bearing).toString().padStart(3, "0") + "°";
    el("directorGuidance").textContent = nav.guidance;
    el("directorNeedle").style.left = 50 + clamp(nav.error / 90, -1, 1) * 46 + "%";
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

    el("aircraftName").textContent = aircraftType.name;
    el("fps").textContent = fpsValue;
    el("speed").textContent = Math.round(speedKmh());
    el("stallSpeed").textContent = aircraftType.stallSpeed;
    el("altitude").textContent = Math.round(altitude());
    el("throttle").textContent = Math.round(aircraft.throttle * 100);
    el("boost").textContent = down("shift") ? "On" : "Off";
    el("boost").className = down("shift") ? "warn" : "";
    el("aoa").textContent = THREE.Math.radToDeg(aircraft.aoa).toFixed(1);
    el("vertical").textContent = aircraft.velocity.y.toFixed(1);
    el("heading").textContent = Math.round(headingDegrees()).toString().padStart(3, "0");
    el("health").textContent = Math.max(0, Math.round(aircraft.health));
    updateFlightDirector();
    drawMiniMap();

    let status = "Na pista";

    const lowSpeedWarning = !aircraft.onGround && speedKmh() < aircraftType.stallSpeed * 1.18;

    if (aircraft.exploded) status = "Explodiu! Aperte R";
    else if (aircraft.crashed) status = "Acidente! Aperte R";
    else if (aircraft.stall) status = "STALL abaixo de " + aircraftType.stallSpeed + " km/h";
    else if (lowSpeedWarning) status = "Velocidade baixa";
    else if (altitude() > 12) status = "Voando";
    else if (speedKmh() > aircraftType.takeoff * 0.75) status = "Pronto para decolar";

    if (Math.abs(aircraft.position.x) > HALF || Math.abs(aircraft.position.z) > HALF) {
      status += " / sobre oceano";
    }

    const statusEl = el("status");
    statusEl.textContent = status;
    statusEl.className = aircraft.crashed ? "bad" : aircraft.stall || lowSpeedWarning ? "warn" : altitude() > 12 ? "good" : "";

    const landingEl = el("landingQuality");
    landingEl.textContent = lastLanding ? lastLanding.text : "--";
    landingEl.className = lastLanding ? lastLanding.className : "";

    if (activeMission) {
      const nav = currentNav();

      el("missionTitle").textContent =
        activeMission.data.title + " — " + activeMission.from.name + " → " + activeMission.to.name;

      el("missionText").textContent =
        activeMission.completed ? "Concluída! Aperte N/M para outra." : activeMission.data.text;

      el("missionDistance").textContent = Math.round(nav.distance);
      el("targetBearing").textContent = nav.bearing === null ? "--" : Math.round(nav.bearing).toString().padStart(3, "0") + "°";
    } else {
      el("missionTitle").textContent = "Pressione N para iniciar";
      el("missionText").textContent = "Voe de um aeroporto para outro.";
      el("missionDistance").textContent = "0";
      el("targetBearing").textContent = "--";
    }

    el("money").textContent = fmtMoney(money) + " | Concluídas: " + completed;
  }

  function shortcuts() {
    if (once("1")) switchAircraft(0);
    if (once("2")) switchAircraft(1);
    if (once("3")) switchAircraft(2);

    if (once("r")) {
      if (activeMission) resetToAirport(activeMission.from);
      else resetToAirport(AIRPORTS[0]);
      el("message").innerHTML = "Avião resetado. Segure W para acelerar.";
    }

    if (once("c")) cameraMode = (cameraMode + 1) % 4;

    if (once("q")) {
      qualityIndex = (qualityIndex + 1) % QUALITY.length;
      quality = QUALITY[qualityIndex];
      rebuildDynamicWorld();
    }

    if (once("h")) {
      showHitboxes = !showHitboxes;
      rebuildHitboxHelpers();
      el("message").innerHTML = showHitboxes ? "Hitboxes visíveis." : "Hitboxes ocultas.";
    }

    if (once("n")) randomMission();
    if (once("m")) nextMission();
  }

  addStaticWorld();
  rebuildDynamicWorld();
  makePlaneModel(aircraftType);
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
