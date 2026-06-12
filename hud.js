import * as THREE from "three";
import { CONFIG } from "./config.js";
import { setText } from "./utils.js";

export class HUD {
  constructor() {
    this.fpsValue = 60;
    this.fpsLast = performance.now();
    this.fpsFrames = 0;
  }

  updateFPS() {
    this.fpsFrames++;
    const now = performance.now();

    if (now - this.fpsLast > 500) {
      this.fpsValue = Math.round(this.fpsFrames * 1000 / (now - this.fpsLast));
      this.fpsFrames = 0;
      this.fpsLast = now;
    }
  }

  update(aircraft, missionSystem, qualityName) {
    this.updateFPS();

    setText("fps", this.fpsValue);
    setText("quality", qualityName);
    setText("speed", Math.round(aircraft.speedKmh));
    setText("altitude", Math.round(aircraft.altitude));
    setText("throttle", Math.round(aircraft.throttle * 100));
    setText("aoa", THREE.MathUtils.radToDeg(aircraft.aoa).toFixed(1));
    setText("verticalSpeed", aircraft.velocity.y.toFixed(1));

    let status = "Na pista";

    if (aircraft.crashed) status = "Acidente! Aperte R";
    else if (aircraft.stall) status = "STALL! Baixe o nariz e ganhe velocidade";
    else if (aircraft.altitude > 12) status = "Voando";
    else if (aircraft.speedKmh > 95) status = "Decolando";

    if (Math.abs(aircraft.position.x) > CONFIG.HALF_MAP || Math.abs(aircraft.position.z) > CONFIG.HALF_MAP) {
      status += " / fora do mapa, sobre oceano";
    }

    const statusEl = document.getElementById("status");
    statusEl.textContent = status;
    statusEl.className = aircraft.crashed ? "bad" : aircraft.stall ? "warn" : aircraft.altitude > 12 ? "good" : "";

    const mission = missionSystem.getHUD();
    setText("missionTitle", mission.title);
    setText("missionText", mission.text);
    setText("missionDistance", Math.round(missionSystem.distanceToDestination(aircraft)));
    setText("missionReward", mission.reward);
  }
}
