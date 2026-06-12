import * as THREE from "three";
import { CONFIG } from "./config.js";
import { clamp } from "./utils.js";

export class AircraftPhysics {
  constructor(plane) {
    this.plane = plane;
    this.params = CONFIG.aircraft;
    this.reset();
  }

  reset(position = { x: 0, z: 850 }, heading = Math.PI) {
    this.throttle = 0;
    this.crashed = false;

    this.position = new THREE.Vector3(position.x, 3, position.z);
    this.velocity = new THREE.Vector3(0, 0, -2);

    this.pitch = 0;
    this.yaw = heading;
    this.roll = 0;

    this.angularPitch = 0;
    this.angularYaw = 0;
    this.angularRoll = 0;

    this.aoa = 0;
    this.lift = 0;
    this.drag = 0;
    this.stall = false;
    this.onGround = true;

    this.syncPlane();
  }

  update(input, dt) {
    if (this.crashed) {
      this.velocity.multiplyScalar(Math.pow(0.2, dt));
      this.throttle *= Math.pow(0.1, dt);
      this.syncPlane();
      return;
    }

    if (input.down("w")) this.throttle += 0.38 * dt;
    if (input.down("s")) this.throttle -= 0.65 * dt;
    this.throttle = clamp(this.throttle, 0, 1);

    const elevator = (input.down("arrowup") ? 1 : 0) - (input.down("arrowdown") ? 1 : 0);
    const aileron = (input.down("arrowleft") ? 1 : 0) - (input.down("arrowright") ? 1 : 0);
    const rudder = (input.down("a") ? 1 : 0) - (input.down("d") ? 1 : 0);

    const speed = this.velocity.length();

    const forward = new THREE.Vector3(0, 0, -1)
      .applyEuler(new THREE.Euler(this.pitch, this.yaw, this.roll, "YXZ"))
      .normalize();

    const up = new THREE.Vector3(0, 1, 0)
      .applyEuler(new THREE.Euler(this.pitch, this.yaw, this.roll, "YXZ"))
      .normalize();

    const velDir = this.velocity.clone().normalize();

    let aoa = Math.asin(clamp(forward.y - velDir.y, -1, 1));
    if (speed < 8) aoa = this.pitch;
    this.aoa = aoa;

    const aoaDeg = THREE.MathUtils.radToDeg(aoa);
    const absAoaDeg = Math.abs(aoaDeg);

    let cl = 0.25 + 4.8 * aoa;
    this.stall = speed > 32 && absAoaDeg > this.params.stallAngleDeg;

    if (this.stall) {
      cl *= clamp(1 - (absAoaDeg - this.params.stallAngleDeg) / 20, 0.18, 1);
    }

    cl = clamp(cl, -1.1, 1.55);

    const rho = 1.225 * Math.exp(-Math.max(0, this.position.y) / 8500);
    const dynamicPressure = 0.5 * rho * speed * speed;

    const liftMag = dynamicPressure * this.params.wingArea * cl;
    const dragCoeff = this.params.dragArea + this.params.inducedDrag * cl * cl;
    const dragMag = dynamicPressure * dragCoeff;

    this.lift = liftMag;
    this.drag = dragMag;

    const gravity = new THREE.Vector3(0, -9.81 * this.params.mass, 0);
    const thrust = forward.clone().multiplyScalar(this.throttle * this.params.maxThrust);
    const lift = up.clone().multiplyScalar(liftMag);
    const drag = this.velocity.clone().multiplyScalar(-1).normalize().multiplyScalar(dragMag);

    const force = new THREE.Vector3();
    force.add(gravity);
    force.add(thrust);
    force.add(lift);
    force.add(drag);

    const acceleration = force.multiplyScalar(1 / this.params.mass);
    this.velocity.addScaledVector(acceleration, dt);

    const controlAuthority = clamp(speed / 55, 0.18, 1.35);

    this.angularPitch += elevator * 0.95 * controlAuthority * dt;
    this.angularRoll += aileron * 1.9 * controlAuthority * dt;
    this.angularYaw += rudder * 0.7 * controlAuthority * dt;
    this.angularYaw += Math.sin(this.roll) * 0.24 * controlAuthority * dt;

    if (this.stall) {
      this.angularPitch -= 0.75 * dt;
      this.angularRoll += Math.sin(performance.now() * 0.006) * 0.9 * dt;
      this.angularYaw += Math.cos(performance.now() * 0.005) * 0.35 * dt;
    }

    this.angularPitch *= Math.pow(0.22, dt);
    this.angularRoll *= Math.pow(0.16, dt);
    this.angularYaw *= Math.pow(0.28, dt);

    this.pitch += this.angularPitch * dt;
    this.roll += this.angularRoll * dt;
    this.yaw += this.angularYaw * dt;

    this.pitch = clamp(this.pitch, -1.05, 1.05);
    this.roll = clamp(this.roll, -1.45, 1.45);

    this.position.addScaledVector(this.velocity, dt);

    this.handleGround(speed, rudder);
    this.syncPlane();
  }

  handleGround(speed, rudder) {
    const groundY = 3;

    if (this.position.y < groundY) {
      const verticalImpact = Math.abs(this.velocity.y);
      const bank = Math.abs(this.roll);
      const nose = Math.abs(this.pitch);

      if (verticalImpact > 6.8 || bank > 0.75 || nose > 0.55 || speed > 82) {
        this.crashed = true;
        this.velocity.multiplyScalar(0.12);
      } else {
        this.position.y = groundY;
        this.velocity.y = 0;
        this.onGround = true;

        const groundFriction = this.throttle > 0.05 ? 0.985 : 0.94;
        this.velocity.x *= Math.pow(groundFriction, 1);
        this.velocity.z *= Math.pow(groundFriction, 1);

        this.pitch *= 0.985;
        this.roll *= 0.95;

        this.yaw += rudder * clamp(speed / 35, 0.1, 1) * 0.012;
      }
    } else {
      this.onGround = false;
    }
  }

  syncPlane() {
    this.plane.position.copy(this.position);
    this.plane.rotation.order = "YXZ";
    this.plane.rotation.y = this.yaw;
    this.plane.rotation.x = this.pitch;
    this.plane.rotation.z = this.roll;

    if (this.plane.userData.prop) {
      this.plane.userData.prop.rotation.z += 0.1 + this.throttle * 0.9;
    }

    const shadow = this.plane.userData.shadow;
    if (shadow) {
      shadow.position.x = this.position.x;
      shadow.position.z = this.position.z;
      shadow.material.opacity = clamp(0.22 - this.position.y / 850, 0.02, 0.18);
      shadow.scale.setScalar(clamp(1 + this.position.y / 180, 1, 8));
    }
  }

  get speedKmh() {
    return this.velocity.length() * 3.6;
  }

  get altitude() {
    return Math.max(0, this.position.y - 3);
  }
}
