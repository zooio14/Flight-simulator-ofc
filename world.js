import * as THREE from "three";
import { CONFIG } from "./config.js";
import { headingToRadians } from "./utils.js";

let dynamicObjects = [];

export function clearDynamicWorld(scene) {
  for (const obj of dynamicObjects) {
    scene.remove(obj);
  }
  dynamicObjects = [];
}

export function buildStaticWorld(scene) {
  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(18000, 18000, 1, 1),
    new THREE.MeshLambertMaterial({ color: 0x1e78ba })
  );
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = -0.1;
  scene.add(ocean);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.MAP_SIZE, CONFIG.MAP_SIZE, 32, 32),
    new THREE.MeshLambertMaterial({ color: 0x2f9b42 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  createMountains(scene);

  for (const airport of CONFIG.airports) {
    createAirport(scene, airport);
  }
}

export function rebuildDynamicWorld(scene, quality) {
  clearDynamicWorld(scene);

  dynamicObjects.push(createBuildings(scene, quality.buildings));
  dynamicObjects.push(...createTrees(scene, quality.trees));
  dynamicObjects.push(createClouds(scene, quality.clouds));
}

function createAirport(scene, airport) {
  const group = new THREE.Group();

  const runway = new THREE.Mesh(
    new THREE.PlaneGeometry(90, airport.runwayLength, 1, 1),
    new THREE.MeshLambertMaterial({ color: 0x242424 })
  );
  runway.rotation.x = -Math.PI / 2;
  runway.position.y = 0.035;
  group.add(runway);

  const white = new THREE.MeshBasicMaterial({ color: 0xffffff });

  for (let z = -airport.runwayLength / 2 + 80; z < airport.runwayLength / 2; z += 120) {
    const mark = new THREE.Mesh(new THREE.PlaneGeometry(5, 50, 1, 1), white);
    mark.rotation.x = -Math.PI / 2;
    mark.position.set(0, 0.07, z);
    group.add(mark);
  }

  for (const x of [-48, 48]) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(3, airport.runwayLength, 1, 1), white);
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, 0.06, 0);
    group.add(line);
  }

  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(26, 90, 26),
    new THREE.MeshLambertMaterial({ color: 0xc9d5db })
  );
  tower.position.set(120, 45, 80);
  group.add(tower);

  const terminal = new THREE.Mesh(
    new THREE.BoxGeometry(180, 34, 70),
    new THREE.MeshLambertMaterial({ color: 0x9ca9b2 })
  );
  terminal.position.set(160, 17, -120);
  group.add(terminal);

  const labelPole = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2, 45, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  labelPole.position.set(-120, 22, 0);
  group.add(labelPole);

  group.position.set(airport.position.x, 0, airport.position.z);
  group.rotation.y = -headingToRadians(airport.runwayHeading);
  scene.add(group);
}

function createBuildings(scene, count) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshLambertMaterial({ color: 0xb8c4ca });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 1400 + 1050;
    const z = (Math.random() - 0.5) * 1800 - 500;
    const h = 18 + Math.random() * 155;

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

function createTrees(scene, count) {
  const trunkGeo = new THREE.CylinderGeometry(1.2, 1.6, 10, 6);
  const topGeo = new THREE.ConeGeometry(7, 20, 8);
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x75461f });
  const topMat = new THREE.MeshLambertMaterial({ color: 0x0f642c });

  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
  const tops = new THREE.InstancedMesh(topGeo, topMat, count);
  const dummy = new THREE.Object3D();

  let placed = 0;
  while (placed < count) {
    const x = (Math.random() - 0.5) * 4700;
    const z = (Math.random() - 0.5) * 4700;

    if (CONFIG.airports.some(a => Math.abs(x - a.position.x) < 170 && Math.abs(z - a.position.z) < 900)) {
      continue;
    }

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

  return [trunks, tops];
}

function createClouds(scene, count) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.76,
    depthWrite: false
  });
  const geo = new THREE.SphereGeometry(1, 10, 8);

  for (let i = 0; i < count; i++) {
    const cloud = new THREE.Group();
    const puffs = 3 + Math.floor(Math.random() * 4);

    for (let j = 0; j < puffs; j++) {
      const puff = new THREE.Mesh(geo, mat);
      puff.scale.set(55 + Math.random() * 80, 12 + Math.random() * 10, 35 + Math.random() * 55);
      puff.position.set((j - puffs / 2) * 45, Math.random() * 14, Math.random() * 20);
      cloud.add(puff);
    }

    cloud.position.set((Math.random() - 0.5) * 5800, 520 + Math.random() * 720, (Math.random() - 0.5) * 5800);
    cloud.rotation.y = Math.random() * Math.PI;
    group.add(cloud);
  }

  scene.add(group);
  return group;
}

function createMountains(scene) {
  const mat = new THREE.MeshLambertMaterial({ color: 0x737761 });
  const geo = new THREE.ConeGeometry(1, 1, 6);
  const mountains = new THREE.InstancedMesh(geo, mat, 18);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < 18; i++) {
    const h = 190 + Math.random() * 420;
    const r = 130 + Math.random() * 250;
    const side = Math.random() < 0.5 ? -1 : 1;

    dummy.position.set(
      side * (1600 + Math.random() * 850),
      h / 2,
      -1700 + Math.random() * 1200
    );
    dummy.scale.set(r, h, r);
    dummy.rotation.y = Math.random() * Math.PI;
    dummy.updateMatrix();

    mountains.setMatrixAt(i, dummy.matrix);
  }

  mountains.instanceMatrix.needsUpdate = true;
  scene.add(mountains);
}
