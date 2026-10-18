import { resolveX, resolveY } from './collision.js';

export const PHYS = {
  GRAVITY: 2200,
  MOVE_SPEED: 300,
  JUMP_VELOCITY: -820,
  MAX_FALL: 1200,
  COYOTE_TIME: 0.1,
  JUMP_BUFFER: 0.12,
};

export class Player {
  constructor(x, y) {
    this.w = 28;
    this.h = 40;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.groundPlatform = null;
    this.facing = 1;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.alive = true;
    this.animTime = 0;
  }

  update(dt, input, platforms) {
    this.animTime += dt;

    if (!this.alive) {
      this.vy += PHYS.GRAVITY * dt;
      this.y += this.vy * dt;
      return { jumped: false };
    }

    // Horizontal
    let dir = 0;
    if (input.keys.left) dir -= 1;
    if (input.keys.right) dir += 1;
    if (dir !== 0) {
      this.facing = dir;
      const target = dir * PHYS.MOVE_SPEED;
      const accel = this.onGround ? 3200 : 1800;
      const diff = target - this.vx;
      if (Math.abs(diff) <= accel * dt) this.vx = target;
      else this.vx += Math.sign(diff) * accel * dt;
    } else {
      const fr = (this.onGround ? 3400 : 500) * dt;
      if (Math.abs(this.vx) <= fr) this.vx = 0;
      else this.vx -= Math.sign(this.vx) * fr;
    }

    // Coyote & jump buffer
    if (this.onGround) this.coyote = PHYS.COYOTE_TIME;
    else this.coyote = Math.max(0, this.coyote - dt);

    if (input.consumeJump()) this.jumpBuffer = PHYS.JUMP_BUFFER;
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);

    let jumped = false;
    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.vy = PHYS.JUMP_VELOCITY;
      this.onGround = false;
      this.coyote = 0;
      this.jumpBuffer = 0;
      this.groundPlatform = null;
      jumped = true;
    }

    // Variable jump height
    const ascendingSlow = this.vy < 0 && !input.keys.jump;
    const grav = ascendingSlow ? PHYS.GRAVITY * 2.1 : PHYS.GRAVITY;
    this.vy += grav * dt;
    if (this.vy > PHYS.MAX_FALL) this.vy = PHYS.MAX_FALL;

    // Move
    resolveX(this, platforms, this.vx * dt);
    const res = resolveY(this, platforms, this.vy * dt);
    this.onGround = res.onGround;
    this.groundPlatform = res.ground;

    return { jumped };
  }
}