import * as THREE from "three";

export function createRenderer(canvas, quality) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance"
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, quality.pixelRatio));

  return renderer;
}

export function createScene(quality) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x86d8ff);
  scene.fog = new THREE.Fog(0x86d8ff, 1300, quality.fogFar);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x3a7a34, 1.85);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(900, 1800, 900);
  scene.add(sun);

  return scene;
}

export function createCamera() {
  return new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    18000
  );
}

export function createPlane(scene) {
  const group = new THREE.Group();

  const white = new THREE.MeshLambertMaterial({ color: 0xf6f6f6 });
  const red = new THREE.MeshLambertMaterial({ color: 0xe02828 });
  const dark = new THREE.MeshBasicMaterial({ color: 0x121212 });
  const glassMat = new THREE.MeshBasicMaterial({
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

  const glass = new THREE.Mesh(new THREE.SphereGeometry(1.15, 16, 8), glassMat);
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

export function updateCamera(camera, plane, mode, dt) {
  let offset;

  if (mode === 0) offset = new THREE.Vector3(0, 9, 34);
  else if (mode === 1) offset = new THREE.Vector3(0, 2.4, 9);
  else offset = new THREE.Vector3(0, 70, 10);

  offset.applyEuler(plane.rotation);

  const desired = plane.position.clone().add(offset);
  camera.position.lerp(desired, 1 - Math.pow(0.001, dt));

  if (mode === 1) {
    const look = new THREE.Vector3(0, 1.8, -80)
      .applyEuler(plane.rotation)
      .add(plane.position);
    camera.lookAt(look);
  } else {
    camera.lookAt(plane.position.x, plane.position.y + 1.5, plane.position.z - 8);
  }
}
