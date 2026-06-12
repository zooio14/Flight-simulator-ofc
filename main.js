import { CONFIG } from "./config.js";
import { Input } from "./utils.js";
import { createRenderer, createScene, createCamera, createPlane, updateCamera } from "./graphics.js";
import { buildStaticWorld, rebuildDynamicWorld } from "./world.js";
import { AircraftPhysics } from "./physics.js";
import { MissionSystem } from "./missions.js";
import { HUD } from "./hud.js";

const canvas = document.getElementById("game");

let qualityIndex = 2;
let quality = CONFIG.qualities[qualityIndex];

const renderer = createRenderer(canvas, quality);
const scene = createScene(quality);
const camera = createCamera();

buildStaticWorld(scene);
rebuildDynamicWorld(scene, quality);

const plane = createPlane(scene);
const aircraft = new AircraftPhysics(plane);
const input = new Input();
const missions = new MissionSystem(scene);
const hud = new HUD();

let camMode = 0;
let last = performance.now();

function resetToAirport(airport = CONFIG.airports[0]) {
  const headingRad = Math.PI;
  aircraft.reset(airport.position, headingRad);
}

function changeQuality() {
  qualityIndex = (qualityIndex + 1) % CONFIG.qualities.length;
  quality = CONFIG.qualities[qualityIndex];

  scene.fog.far = quality.fogFar;
  renderer.setPixelRatio(Math.min(devicePixelRatio, quality.pixelRatio));
  rebuildDynamicWorld(scene, quality);
}

function handleShortcuts() {
  if (input.once("r")) {
    resetToAirport(CONFIG.airports[0]);
  }

  if (input.once("c")) {
    camMode = (camMode + 1) % 3;
  }

  if (input.once("q")) {
    changeQuality();
  }

  if (input.once("m")) {
    missions.nextMission();
    resetToAirport(missions.active.from);
  }

  if (input.once("n")) {
    missions.randomMission();
    resetToAirport(missions.active.from);
  }
}

function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now;

  handleShortcuts();
  aircraft.update(input, dt);
  missions.update(aircraft);
  updateCamera(camera, plane, camMode, dt);
  hud.update(aircraft, missions, quality.name);

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
