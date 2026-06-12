import * as THREE from "three";

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function distance2D(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function headingToRadians(degrees) {
  return THREE.MathUtils.degToRad(degrees);
}

export function formatMoney(value) {
  return "$" + Math.round(value).toLocaleString("en-US");
}

export function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

export class Input {
  constructor() {
    this.keys = {};
    this.pressed = {};

    window.addEventListener("keydown", event => {
      const key = event.key.toLowerCase();
      if (!this.keys[key]) this.pressed[key] = true;
      this.keys[key] = true;
    });

    window.addEventListener("keyup", event => {
      this.keys[event.key.toLowerCase()] = false;
    });
  }

  down(key) {
    return !!this.keys[key.toLowerCase()];
  }

  once(key) {
    const k = key.toLowerCase();
    if (this.pressed[k]) {
      this.pressed[k] = false;
      return true;
    }
    return false;
  }
}
