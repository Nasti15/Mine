import { Player, PHYS } from './player.js';
import { rectsOverlap } from './collision.js';
import { LEVELS } from './levels.js';

export const PALETTES = {
  dark: {
    bgTop: '#2e1e10',
    bgMid: '#241608',
    bgBottom: '#120a04',
    brickLine: 'rgba(255,180,90,0.06)',
    platform: '#6b4a2e',
    platformTop: '#a07a50',
    platformEdge: '#3a2614',
    platformGlow: 'rgba(255,180,90,0.15)',
    lava: ['#ff9a1a', '#ff5a10', '#c02a08'],
    spike: '#c0c8d0',
    spikeDark: '#6a7078',
    diamond: '#4dd8ff',
    diamondLight: '#d0f6ff',
    diamondDark: '#0a7ba8',
    hatchClosed: '#5a3e22',
    hatchClosedLight: '#8a6038',
    hatchOpen: '#ffe066',
    hatchGlow: 'rgba(255,224,102,0.5)',
    lantern: '#ffcc44',
    lanternGlow: 'rgba(255,190,80,0.35)',
    rock: '#7a5a3a',
    rockDark: '#4a3220',
    dust: 'rgba(255,200,120,0.5)',
    miner: { helmet: '#ffcc33', helmetDark: '#c99a22', face: '#e8b888', body: '#3a5a8a', bodyDark: '#1e3450', leg: '#2a1e14', lantern: '#ffe066' },
  },
  light: {
    bgTop: '#c8b088',
    bgMid: '#b8a078',
    bgBottom: '#a08058',
    brickLine: 'rgba(80,50,20,0.08)',
    platform: '#9a7a55',
    platformTop: '#c9a878',
    platformEdge: '#6a4e30',
    platformGlow: 'rgba(120,80,30,0.15)',
    lava: ['#ff9a1a', '#ff5a10', '#c02a08'],
    spike: '#8a929a',
    spikeDark: '#4a5058',
    diamond: '#1ac0e0',
    diamondLight: '#a0e8ff',
    diamondDark: '#067a9a',
    hatchClosed: '#8a6038',
    hatchClosedLight: '#b88a58',
    hatchOpen: '#ffd700',
    hatchGlow: 'rgba(255,215,0,0.5)',
    lantern: '#ffaa22',
    lanternGlow: 'rgba(255,170,40,0.3)',
    rock: '#9a7a5a',
    rockDark: '#6a4e30',
    dust: 'rgba(80,50,20,0.35)',
    miner: { helmet: '#ffcc33', helmetDark: '#c99a22', face: '#e8b888', body: '#4a6a9a', bodyDark: '#2a4a70', leg: '#3a2a1a', lantern: '#ffe066' },
  }
};

export class Game {
  constructor(canvas, input, audio, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = input;
    this.audio = audio;
    this.cb = callbacks;
    this.theme = 'dark';

    this.state = 'idle';
    this.levelIndex = 0;
    this.totalTime = 0;
    this.levelTime = 0;
    this.deathTimer = 0;
    this.deathHandled = false;

    this.player = null;
    this.platforms = [];
    this.diamonds = [];
    this.hazards = [];
    this.hatch = null;
    this.lanterns = [];
    this.fallingRocks = [];
    this.particles = [];
    this.dust = [];
    this.diamondsCollected = 0;
    this.totalDiamonds = 0;
    this.globalTime = 0;

    this._initDust();
  }

  _initDust() {
    this.dust = [];
    for (let i = 0; i < 30; i++) {
      this.dust.push({
        x: Math.random() * 960,
        y: Math.random() * 600,
        r: 0.5 + Math.random() * 1.8,
        vy: -6 - Math.random() * 14,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  setTheme(theme) { this.theme = theme; }

  get palette() { return PALETTES[this.theme] || PALETTES.dark; }

  loadLevel(index) {
    const lvl = LEVELS[index];
    this.levelIndex = index;
    this.levelTime = 0;
    this.diamondsCollected = 0;
    this.deathTimer = 0;
    this.deathHandled = false;
    this.particles = [];

    this.player = new Player(lvl.start.x, lvl.start.y);

    this.platforms = lvl.platforms.map(p => {
      const plat = { ...p, solid: true };
      if (plat.type === 'moving') {
        plat.t = (plat.phaseOffset || 0) % 1;
        plat.px = plat.x;
        plat.py = plat.y;
      }
      if (plat.type === 'disappearing') {
        plat.state = 'solid';
        plat.timer = 0;
        plat.goneTimer = 0;
      }
      return plat;
    });

    this.diamonds = lvl.diamonds.map(d => ({
      ...d, w: 22, h: 22, collected: false, anim: Math.random() * Math.PI * 2
    }));

    this.hazards = lvl.hazards.map(h => ({ ...h }));

    this.hatch = { ...lvl.hatch, open: false };

    this.lanterns = (lvl.lanterns || []).map(l => ({ ...l, phase: Math.random() * Math.PI * 2 }));

    this.fallingRocks = (lvl.fallingRocks || []).map(r => ({
      x: r.x, y: 0, vy: 0,
      state: 'idle',
      timer: r.delay || 0,
      period: r.period || 3,
    }));

    this.totalDiamonds = this.diamonds.length;
    this.state = 'playing';
  }

  startLevel(index, resetTimer) {
    this.loadLevel(index);
    if (resetTimer) this.totalTime = 0;
  }

  update(dt) {
    if (this.state !== 'playing') return;
    this.globalTime += dt;
    this.levelTime += dt;
    this.totalTime += dt;

    // Обновление платформ
    for (const p of this.platforms) {
      if (p.type === 'moving') {
        p.px = p.x; p.py = p.y;
        p.t = (p.t + dt / p.period) % 1;
        const s = 0.5 - 0.5 * Math.cos(p.t * Math.PI * 2);
        p.x = p.ax + (p.bx - p.ax) * s;
        p.y = p.ay + (p.by - p.ay) * s;
      } else if (p.type === 'disappearing') {
        if (p.state === 'solid') {
          if (this.player.onGround && this.player.groundPlatform === p) {
            p.timer += dt;
            if (p.timer >= 0.5) {
              p.state = 'gone';
              p.solid = false;
              p.goneTimer = 0;
              p.timer = 0;
            }
          } else {
            p.timer = 0;
          }
        } else {
          p.goneTimer += dt;
          if (p.goneTimer >= 2.0) {
            p.state = 'solid';
            p.solid = true;
            p.goneTimer = 0;
          }
        }
      }
    }

    // Перенос игрока движущейся платформой
    const gp = this.player.groundPlatform;
    if (this.player.onGround && gp && gp.type === 'moving') {
      this.player.x += gp.x - gp.px;
      this.player.y += gp.y - gp.py;
    }

    // Обновление игрока
    const status = this.player.update(dt, this.input, this.platforms);
    if (status.jumped) this.audio.jump();

    // Камни
    this._updateRocks(dt);
    this._updateParticles(dt);
    this._updateDust(dt);

    // Проверки
    if (this.player.alive) {
      this._checkHazards();
      this._checkDiamonds();
      this._checkHatch();
      if (this.player.y > this.canvas.height + 120) this._killPlayer();
    } else {
      this.deathTimer += dt;
      if (this.deathTimer > 0.8 && !this.deathHandled) {
        this.deathHandled = true;
        this.state = 'dead';
        this.cb.onDeath && this.cb.onDeath();
      }
    }
  }

  _updateRocks(dt) {
    for (const r of this.fallingRocks) {
      if (r.state === 'idle') {
        r.timer -= dt;
        if (r.timer <= 0) { r.state = 'warning'; r.timer = 0.6; }
      } else if (r.state === 'warning') {
        r.timer -= dt;
        if (r.timer <= 0) {
          r.state = 'falling';
          r.y = 0;
          r.vy = 0;
          this.audio.rock();
        }
      } else if (r.state === 'falling') {
        r.vy += 1600 * dt;
        r.y += r.vy * dt;
        const rockRect = { x: r.x - 12, y: r.y, w: 24, h: 24 };
        if (this.player.alive && rectsOverlap(this.player, rockRect)) {
          this._killPlayer();
        }
        let hit = false;
        for (const p of this.platforms) {
          if (!p.solid) continue;
          if (rectsOverlap(rockRect, p)) { hit = true; break; }
        }
        if (hit || r.y > this.canvas.height) {
          r.state = 'idle';
          r.timer = r.period;
          this._spawnParticles(r.x, Math.min(r.y, this.canvas.height - 20), this.palette.rock, 6);
        }
      }
    }
  }

  _checkHazards() {
    for (const h of this.hazards) {
      if (rectsOverlap(this.player, h)) {
        this._killPlayer();
        return;
      }
    }
  }

  _checkDiamonds() {
    for (const d of this.diamonds) {
      if (d.collected) continue;
      const dr = { x: d.x - d.w / 2, y: d.y - d.h / 2, w: d.w, h: d.h };
      if (rectsOverlap(this.player, dr)) {
        d.collected = true;
        this.diamondsCollected++;
        this.audio.diamond();
        this._spawnParticles(d.x, d.y, this.palette.diamond, 12);
        if (this.diamondsCollected === this.totalDiamonds) {
          this.hatch.open = true;
          this._spawnParticles(this.hatch.x + this.hatch.w / 2, this.hatch.y + this.hatch.h / 2, '#ffe066', 24);
        }
      }
    }
  }

  _checkHatch() {
    if (!this.hatch.open) return;
    if (rectsOverlap(this.player, this.hatch)) {
      this.state = 'complete';
      this.audio.complete();
      this.cb.onLevelComplete && this.cb.onLevelComplete({
        level: this.levelIndex,
        levelTime: this.levelTime,
        totalTime: this.totalTime,
      });
    }
  }

  _killPlayer() {
    if (!this.player.alive) return;
    this.player.alive = false;
    this.player.vy = -450;
    this.audio.death();
    this._spawnParticles(
      this.player.x + this.player.w / 2,
      this.player.y + this.player.h / 2,
      '#ff5050', 20
    );
  }

  _spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 80 + Math.random() * 240;
      this.particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 60,
        life: 0.4 + Math.random() * 0.5,
        maxLife: 0.9,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  _updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 900 * dt;
      p.vx *= 0.97;
    }
  }

  _updateDust(dt) {
    for (const d of this.dust) {
      d.y += d.vy * dt;
      d.x += Math.sin(this.globalTime * 0.7 + d.phase) * 12 * dt;
      if (d.y < -10) { d.y = this.canvas.height + 10; d.x = Math.random() * this.canvas.width; }
    }
  }

  // ============ RENDER ============
  render() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const pal = this.palette;

    // Фон
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, pal.bgTop);
    bg.addColorStop(0.5, pal.bgMid);
    bg.addColorStop(1, pal.bgBottom);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Кирпичная текстура
    this._drawBricks(ctx, W, H, pal);

    // Пылинки
    for (const d of this.dust) {
      ctx.globalAlpha = 0.4 + 0.3 * Math.sin(this.globalTime * 2 + d.phase);
      ctx.fillStyle = pal.dust;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Фонарики
    for (const l of this.lanterns) this._drawLantern(ctx, l, pal);

    // Платформы
    for (const p of this.platforms) {
      if (p.type === 'disappearing' && p.state === 'gone') continue;
      this._drawPlatform(ctx, p, pal);
    }

    // Опасности
    for (const h of this.hazards) this._drawHazard(ctx, h, pal);

    // Камни
    for (const r of this.fallingRocks) this._drawRock(ctx, r, pal);

    // Алмазы
    for (const d of this.diamonds) {
      if (!d.collected) this._drawDiamond(ctx, d, pal);
    }

    // Люк
    if (this.hatch) this._drawHatch(ctx, this.hatch, pal);

    // Игрок
    if (this.player) this._drawPlayer(ctx, this.player, pal);

    // Частицы
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Виньетка
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.9);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  _drawBricks(ctx, W, H, pal) {
    ctx.strokeStyle = pal.brickLine;
    ctx.lineWidth = 1;
    const bw = 80, bh = 40;
    for (let y = 0; y < H; y += bh) {
      const offset = (Math.floor(y / bh) % 2) * (bw / 2);
      for (let x = -bw; x < W + bw; x += bw) {
        ctx.strokeRect(x + offset, y, bw, bh);
      }
    }
  }

  _drawLantern(ctx, l, pal) {
    const t = this.globalTime * 2 + l.phase;
    const flicker = 0.85 + 0.15 * Math.sin(t * 3.1) + 0.05 * Math.sin(t * 7.3);
    // Свечение
    const glow = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, 90 * flicker);
    glow.addColorStop(0, pal.lanternGlow);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(l.x - 100, l.y - 100, 200, 200);
    // Цепочка
    ctx.strokeStyle = 'rgba(60,40,20,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(l.x, 0);
    ctx.lineTo(l.x, l.y - 8);
    ctx.stroke();
    // Корпус фонаря
    ctx.fillStyle = pal.lantern;
    ctx.beginPath();
    ctx.ellipse(l.x, l.y, 8 * flicker, 12 * flicker, 0, 0, Math.PI * 2);
    ctx.fill();
    // Внутренний свет
    ctx.fillStyle = '#fff8d0';
    ctx.beginPath();
    ctx.ellipse(l.x, l.y, 3 * flicker, 5 * flicker, 0, 0, Math.PI * 2);
    ctx.fill();
    // Крышка
    ctx.fillStyle = '#4a3018';
    ctx.fillRect(l.x - 6, l.y - 14, 12, 4);
    ctx.fillRect(l.x - 6, l.y + 10, 12, 4);
  }

  _drawPlatform(ctx, p, pal) {
    const isMoving = p.type === 'moving';
    const isDisappearing = p.type === 'disappearing';
    let alpha = 1;
    let wobbleX = 0;

    if (isDisappearing) {
      if (p.state === 'solid' && p.timer > 0) {
        const k = p.timer / 0.5;
        alpha = 1 - 0.35 * k;
        wobbleX = Math.sin(this.globalTime * 40) * 2 * k;
      }
    }

    ctx.globalAlpha = alpha;

    // Тень/свечение
    if (isMoving) {
      ctx.shadowColor = pal.platformGlow;
      ctx.shadowBlur = 16;
    }

    const x = p.x + wobbleX;
    // Основной блок
    const grad = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    grad.addColorStop(0, pal.platformTop);
    grad.addColorStop(0.4, pal.platform);
    grad.addColorStop(1, pal.platformEdge);
    ctx.fillStyle = grad;
    ctx.fillRect(x, p.y, p.w, p.h);

    // Верхняя подсветка
    ctx.fillStyle = 'rgba(255,220,150,0.35)';
    ctx.fillRect(x, p.y, p.w, 2);

    // Края
    ctx.strokeStyle = pal.platformEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, p.y + 1, p.w - 2, p.h - 2);

    // Трещины/детали
    ctx.strokeStyle = 'rgba(40,20,10,0.4)';
    ctx.lineWidth = 1;
    for (let i = 1; i < p.w / 30; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 30, p.y + 3);
      ctx.lineTo(x + i * 30 - 6, p.y + p.h - 3);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Индикатор исчезающей платформы
    if (isDisappearing && p.state === 'solid' && p.timer > 0) {
      ctx.fillStyle = `rgba(255,80,80,${0.5 * (p.timer / 0.5)})`;
      ctx.fillRect(x, p.y - 4, p.w, 3);
    }
  }

  _drawHazard(ctx, h, pal) {
    if (h.type === 'lava') {
      const grad = ctx.createLinearGradient(0, h.y, 0, h.y + h.h);
      const t = this.globalTime * 3;
      const shift = 0.5 + 0.5 * Math.sin(t);
      grad.addColorStop(0, pal.lava[1]);
      grad.addColorStop(0.3 + 0.2 * shift, pal.lava[0]);
      grad.addColorStop(1, pal.lava[2]);
      ctx.fillStyle = grad;
      ctx.fillRect(h.x, h.y, h.w, h.h);

      // Пузыри
      for (let i = 0; i < 4; i++) {
        const bx = h.x + (h.w / 4) * (i + 0.5);
        const by = h.y + h.h * 0.3 + Math.sin(t * 2 + i * 1.7) * 4;
        ctx.fillStyle = 'rgba(255,240,150,0.7)';
        ctx.beginPath();
        ctx.arc(bx, by, 2 + Math.sin(t * 3 + i) * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // Свечение
      ctx.shadowColor = 'rgba(255,100,20,0.6)';
      ctx.shadowBlur = 20;
      ctx.fillStyle = 'rgba(255,150,40,0.3)';
      ctx.fillRect(h.x, h.y - 4, h.w, 4);
      ctx.shadowBlur = 0;
    } else if (h.type === 'spike') {
      ctx.fillStyle = pal.spike;
      ctx.strokeStyle = pal.spikeDark;
      ctx.lineWidth = 1;
      const dir = h.dir || 'up';
      if (dir === 'up' || dir === 'down') {
        const count = Math.max(2, Math.floor(h.w / 14));
        const w = h.w / count;
        for (let i = 0; i < count; i++) {
          const x0 = h.x + i * w;
          ctx.beginPath();
          if (dir === 'up') {
            ctx.moveTo(x0, h.y + h.h);
            ctx.lineTo(x0 + w / 2, h.y);
            ctx.lineTo(x0 + w, h.y + h.h);
          } else {
            ctx.moveTo(x0, h.y);
            ctx.lineTo(x0 + w / 2, h.y + h.h);
            ctx.lineTo(x0 + w, h.y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      } else {
        const count = Math.max(2, Math.floor(h.h / 14));
        const w = h.h / count;
        for (let i = 0; i < count; i++) {
          const y0 = h.y + i * w;
          ctx.beginPath();
          if (dir === 'right') {
            ctx.moveTo(h.x, y0);
            ctx.lineTo(h.x + h.w, y0 + w / 2);
            ctx.lineTo(h.x, y0 + w);
          } else {
            ctx.moveTo(h.x + h.w, y0);
            ctx.lineTo(h.x, y0 + w / 2);
            ctx.lineTo(h.x + h.w, y0 + w);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
    }
  }

  _drawRock(ctx, r, pal) {
    if (r.state === 'idle') return;

    if (r.state === 'warning') {
      const t = 1 - r.timer / 0.6;
      ctx.globalAlpha = 0.35 + 0.3 * Math.sin(this.globalTime * 20);
      ctx.strokeStyle = '#ff4040';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(r.x, 0);
      ctx.lineTo(r.x, this.canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(255,60,60,${0.4 * t})`;
      ctx.beginPath();
      ctx.arc(r.x, 20, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (r.state === 'falling') {
      ctx.save();
      ctx.translate(r.x, r.y + 12);
      ctx.rotate(this.globalTime * 3);
      ctx.fillStyle = pal.rock;
      ctx.strokeStyle = pal.rockDark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, -10);
      ctx.lineTo(6, -12);
      ctx.lineTo(12, 0);
      ctx.lineTo(8, 10);
      ctx.lineTo(-6, 12);
      ctx.lineTo(-12, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Трещины
      ctx.strokeStyle = pal.rockDark;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-4, -6);
      ctx.lineTo(2, 4);
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawDiamond(ctx, d, pal) {
    const spin = this.globalTime * 2 + d.anim;
    const bob = Math.sin(this.globalTime * 2.2 + d.anim) * 3;
    const cx = d.x;
    const cy = d.y + bob;
    const s = 11 + Math.sin(spin * 2) * 1.5;

    // Свечение
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 32);
    glow.addColorStop(0, 'rgba(120,230,255,0.5)');
    glow.addColorStop(1, 'rgba(120,230,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 32, cy - 32, 64, 64);

    // Алмаз (ромб с бликом)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.sin(spin) * 0.3);

    // Основа
    ctx.fillStyle = pal.diamond;
    ctx.strokeStyle = pal.diamondDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.8, -s * 0.2);
    ctx.lineTo(s * 0.6, s * 0.9);
    ctx.lineTo(0, s * 1.1);
    ctx.lineTo(-s * 0.6, s * 0.9);
    ctx.lineTo(-s * 0.8, -s * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Светлые грани
    ctx.fillStyle = pal.diamondLight;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.8, -s * 0.2);
    ctx.lineTo(0, -s * 0.1);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(-s * 0.8, -s * 0.2);
    ctx.lineTo(0, -s * 0.1);
    ctx.closePath();
    ctx.fill();

    // Блик
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(-s * 0.3, -s * 0.3, s * 0.18, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawHatch(ctx, h, pal) {
    const cx = h.x + h.w / 2;
    const cy = h.y + h.h / 2;
    const t = this.globalTime;

    if (h.open) {
      // Открытый люк — свет наружу
      const glowR = 70 + Math.sin(t * 3) * 8;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      glow.addColorStop(0, 'rgba(255,240,160,0.9)');
      glow.addColorStop(0.5, pal.hatchGlow);
      glow.addColorStop(1, 'rgba(255,220,100,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(cx - glowR, cy - glowR, glowR * 2, glowR * 2);

      // Лучи
      ctx.strokeStyle = 'rgba(255,240,180,0.6)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + t * 0.4;
        const r1 = h.w * 0.55;
        const r2 = h.w * 0.55 + 10 + Math.sin(t * 4 + i) * 6;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
        ctx.stroke();
      }

      // Рамка люка
      ctx.strokeStyle = pal.hatchClosedLight;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, h.w * 0.5, 0, Math.PI * 2);
      ctx.stroke();

      // Внутренний свет
      const inner = ctx.createRadialGradient(cx, cy, 0, cx, cy, h.w * 0.45);
      inner.addColorStop(0, '#fff8d0');
      inner.addColorStop(1, pal.hatchOpen);
      ctx.fillStyle = inner;
      ctx.beginPath();
      ctx.arc(cx, cy, h.w * 0.42, 0, Math.PI * 2);
      ctx.fill();

      // Вверх стрелка
      ctx.fillStyle = '#2a1400';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 10);
      ctx.lineTo(cx + 8, cy + 4);
      ctx.lineTo(cx - 8, cy + 4);
      ctx.closePath();
      ctx.fill();
    } else {
      // Закрытый люк
      ctx.fillStyle = 'rgba(80,60,40,0.5)';
      ctx.beginPath();
      ctx.arc(cx, cy, h.w * 0.52, 0, Math.PI * 2);
      ctx.fill();

      // Рамка
      ctx.strokeStyle = pal.hatchClosedLight;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, h.w * 0.5, 0, Math.PI * 2);
      ctx.stroke();

      // Крышка
      const grad = ctx.createRadialGradient(cx - 6, cy - 6, 0, cx, cy, h.w * 0.5);
      grad.addColorStop(0, pal.hatchClosedLight);
      grad.addColorStop(1, pal.hatchClosed);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, h.w * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Замок
      ctx.fillStyle = '#c9a040';
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4a3018';
      ctx.fillRect(cx - 1, cy, 2, 5);

      // Показываем счётчик
      if (this.totalDiamonds > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(cx - 20, cy + h.h * 0.35, 40, 16);
        ctx.fillStyle = '#ffe066';
        ctx.font = 'bold 12px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${this.diamondsCollected}/${this.totalDiamonds}`, cx, cy + h.h * 0.35 + 8);
      }
    }
  }

  _drawPlayer(ctx, pl, pal) {
    if (!pl.alive) ctx.globalAlpha = Math.max(0, 1 - this.deathTimer / 0.8);

    const x = Math.round(pl.x);
    const y = Math.round(pl.y);
    const w = pl.w;
    const h = pl.h;
    const m = pal.miner;

    // Тень на земле
    if (pl.onGround && pl.groundPlatform) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, pl.groundPlatform.y + 2, w * 0.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const facing = pl.facing;

    // Ноги (анимация ходьбы)
    const walkPhase = pl.onGround && Math.abs(pl.vx) > 20
      ? Math.sin(pl.animTime * 14)
      : 0;
    const legOff = walkPhase * 3;

    ctx.fillStyle = m.leg;
    // левая нога
    ctx.fillRect(x + 4, y + h - 10, 8, 10 + legOff);
    // правая нога
    ctx.fillRect(x + w - 12, y + h - 10, 8, 10 - legOff);

    // Тело
    const bodyGrad = ctx.createLinearGradient(0, y + 14, 0, y + h - 6);
    bodyGrad.addColorStop(0, m.body);
    bodyGrad.addColorStop(1, m.bodyDark);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 14, w - 6, h - 20, 4);
    ctx.fill();

    // Ремень
    ctx.fillStyle = '#8a5030';
    ctx.fillRect(x + 3, y + 22, w - 6, 3);

    // Лицо
    ctx.fillStyle = m.face;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 10, 8, 0, Math.PI * 2);
    ctx.fill();

    // Каска
    ctx.fillStyle = m.helmet;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 7, 9.5, Math.PI, 0);
    ctx.fill();
    // Поля каски
    ctx.fillStyle = m.helmetDark;
    ctx.fillRect(x + w / 2 - 11, y + 6, 22, 2.5);
    // Верх каски
    ctx.fillStyle = m.helmet;
    ctx.fillRect(x + w / 2 - 5, y - 3, 10, 3);

    // Глаза
    ctx.fillStyle = '#1a1010';
    const eyeY = y + 11;
    const eyeX = facing === 1 ? x + w / 2 + 1 : x + w / 2 - 4;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 1.3, 0, Math.PI * 2);
    ctx.arc(eyeX + 5, eyeY, 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Фонарик на каске
    const lantX = x + w / 2 + facing * 6;
    const lantY = y + 2;
    const flicker = 0.7 + 0.3 * Math.sin(this.globalTime * 10);
    const glow = ctx.createRadialGradient(lantX, lantY, 0, lantX, lantY, 40);
    glow.addColorStop(0, `rgba(255,240,140,${0.4 * flicker})`);
    glow.addColorStop(1, 'rgba(255,240,140,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(lantX - 40, lantY - 40, 80, 80);
    ctx.fillStyle = m.lantern;
    ctx.beginPath();
    ctx.arc(lantX, lantY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }
}