import * as THREE from "three";
import { CONFIG } from "./config.js";
import { distance2D, formatMoney } from "./utils.js";

export class MissionSystem {
  constructor(scene) {
    this.scene = scene;
    this.missions = this.createMissions();
    this.index = -1;
    this.active = null;
    this.completed = 0;
    this.money = 0;

    this.marker = this.createMarker();
    this.marker.visible = false;
    scene.add(this.marker);
  }

  createMissions() {
    const airport = id => CONFIG.airports.find(a => a.id === id);

    return [
      {
        title: "Voo regional OFC → Ilha Azul",
        from: airport("OFC"),
        to: airport("ILHA"),
        reward: 1200,
        description: "Decole do Aeroporto Central e pouse na Ilha Azul."
      },
      {
        title: "Entrega expressa Ilha Azul → Serra Norte",
        from: airport("ILHA"),
        to: airport("SERRA"),
        reward: 1800,
        description: "Leve carga leve até o aeroporto nas montanhas."
      },
      {
        title: "Transporte executivo Serra Norte → Cidade Leste",
        from: airport("SERRA"),
        to: airport("CIDADE"),
        reward: 2400,
        description: "Pouse com suavidade no aeroporto próximo da cidade."
      },
      {
        title: "Rota completa Cidade Leste → Central",
        from: airport("CIDADE"),
        to: airport("OFC"),
        reward: 3200,
        description: "Volte para a base principal e complete o circuito."
      }
    ];
  }

  createMarker() {
    const group = new THREE.Group();

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(80, 5, 8, 48),
      new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );
    ring.rotation.x = Math.PI / 2;

    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(35, 120, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd000, transparent: true, opacity: 0.55 })
    );
    cone.position.y = 90;

    group.add(ring, cone);
    return group;
  }

  nextMission() {
    this.index = (this.index + 1) % this.missions.length;
    this.startMission(this.missions[this.index]);
  }

  randomMission() {
    const next = Math.floor(Math.random() * this.missions.length);
    this.index = next;
    this.startMission(this.missions[this.index]);
  }

  startMission(mission) {
    this.active = {
      ...mission,
      started: false,
      airborne: false,
      completed: false
    };

    this.marker.visible = true;
    this.marker.position.set(mission.to.position.x, 10, mission.to.position.z);
  }

  update(aircraft) {
    if (!this.active) return;

    const pos = aircraft.position;
    const destination = this.active.to.position;
    const dist = distance2D({ x: pos.x, z: pos.z }, destination);

    if (aircraft.altitude > 25) {
      this.active.airborne = true;
    }

    const slowEnough = aircraft.speedKmh < 120;
    const nearDestination = dist < 190;
    const onGround = aircraft.onGround && aircraft.altitude < 6;
    const safe = !aircraft.crashed;

    if (this.active.airborne && nearDestination && onGround && slowEnough && safe) {
      this.completeMission();
    }
  }

  completeMission() {
    if (!this.active || this.active.completed) return;

    this.active.completed = true;
    this.completed++;
    this.money += this.active.reward;
    this.marker.visible = false;
  }

  getHUD() {
    if (!this.active) {
      return {
        title: "Nenhuma missão ativa",
        text: "Pressione N para iniciar uma missão aleatória ou M para próxima missão.",
        distance: "0",
        reward: "$0"
      };
    }

    const status = this.active.completed
      ? "Missão concluída! Pressione N ou M para outra."
      : this.active.description;

    return {
      title: this.active.title,
      text: status + ` | Concluídas: ${this.completed} | Saldo: ${formatMoney(this.money)}`,
      distance: "0",
      reward: formatMoney(this.active.reward)
    };
  }

  distanceToDestination(aircraft) {
    if (!this.active) return 0;
    return distance2D(
      { x: aircraft.position.x, z: aircraft.position.z },
      this.active.to.position
    );
  }
}
