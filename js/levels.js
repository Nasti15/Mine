export const LEVELS = [
  // ─── УРОВЕНЬ 1 — ЛЁГКИЙ — 4 алмаза ───
  {
    nameKey: 'level1',
    diffKey: 'easy',
    start: { x: 60, y: 520 },
    hatch: { x: 100, y: 20, w: 60, h: 40 },
    platforms: [
      { x: 0,   y: 560, w: 960, h: 40 },
      { x: 100, y: 460, w: 120, h: 20 },
      { x: 300, y: 370, w: 120, h: 20 },
      { x: 480, y: 460, w: 100, h: 20, type: 'moving', ax: 480, ay: 460, bx: 620, by: 460, period: 4 },
      { x: 700, y: 370, w: 120, h: 20 },
      { x: 880, y: 280, w: 80,  h: 20 },
      { x: 700, y: 190, w: 120, h: 20 },
      { x: 480, y: 190, w: 120, h: 20 },
      { x: 300, y: 140, w: 120, h: 20, type: 'disappearing' },
      { x: 100, y: 60,  w: 120, h: 20 },
    ],
    diamonds: [
      { x: 160, y: 430 },
      { x: 360, y: 340 },
      { x: 760, y: 160 },
      { x: 240, y: 100 },
    ],
    hazards: [
      { x: 350, y: 540, w: 120, h: 20, type: 'lava' },
      { x: 700, y: 540, w: 80,  h: 20, type: 'spike', dir: 'up' },
      { x: 540, y: 320, w: 100, h: 20, type: 'spike', dir: 'down' },
    ],
    fallingRocks: [
      { x: 500, period: 4, delay: 0.5 },
    ],
    lanterns: [
      { x: 200, y: 200 },
      { x: 550, y: 100 },
      { x: 830, y: 200 },
      { x: 100, y: 350 },
    ],
  },

    // ─── УРОВЕНЬ 2 — СРЕДНИЙ — 5 алмазов ───
  {
    nameKey: 'level2',
    diffKey: 'medium',
    start: { x: 60, y: 520 },
    hatch: { x: 860, y: 110, w: 60, h: 40 },
    platforms: [
      { x: 0,   y: 560, w: 960, h: 40 },
      { x: 120, y: 470, w: 100, h: 20 },
      { x: 280, y: 400, w: 100, h: 20 },
      { x: 440, y: 470, w: 100, h: 20, type: 'moving', ax: 440, ay: 470, bx: 580, by: 470, period: 3.5 },
      { x: 680, y: 400, w: 100, h: 20 },
      { x: 680, y: 280, w: 100, h: 20, type: 'moving', ax: 680, ay: 280, bx: 780, by: 280, period: 4 },
      { x: 480, y: 280, w: 100, h: 20, type: 'disappearing' },
      { x: 280, y: 300, w: 100, h: 20 },
      { x: 120, y: 220, w: 100, h: 20 },
      { x: 300, y: 150, w: 100, h: 20, type: 'disappearing' },
      { x: 500, y: 150, w: 100, h: 20 },
      { x: 700, y: 150, w: 260, h: 20 },
    ],
    diamonds: [
      { x: 170, y: 440 },
      { x: 330, y: 370 },
      { x: 730, y: 370 },
      { x: 330, y: 270 },
      { x: 800, y: 120 },
    ],
    hazards: [
      { x: 220, y: 540, w: 100, h: 20, type: 'lava' },
      { x: 600, y: 540, w: 100, h: 20, type: 'lava' },
      { x: 240, y: 220, w: 20, h: 40, type: 'spike', dir: 'right' },
      { x: 420, y: 60, w: 80, h: 20, type: 'spike', dir: 'down' },
    ],
    fallingRocks: [
      { x: 250, period: 3.5, delay: 0 },
      { x: 380, period: 3, delay: 1 },
      { x: 650, period: 4, delay: 2 },
    ],
    lanterns: [
      { x: 200, y: 220 },
      { x: 400, y: 320 },
      { x: 620, y: 220 },
      { x: 300, y: 80 },
      { x: 800, y: 60 },
    ],
  },

      // ─── УРОВЕНЬ 3 — СЛОЖНЫЙ — 6 алмазов ───
  {
    nameKey: 'level3',
    diffKey: 'hard',
    start: { x: 60, y: 520 },
    hatch: { x: 860, y: 90, w: 60, h: 40 },
    platforms: [
      { x: 0,   y: 560, w: 960, h: 40 },
      { x: 100, y: 460, w: 100, h: 20 },
      { x: 260, y: 380, w: 100, h: 20 },
      { x: 420, y: 460, w: 100, h: 20, type: 'moving', ax: 420, ay: 460, bx: 580, by: 460, period: 3 },
      // Правая часть (низ)
      { x: 680, y: 380, w: 100, h: 20 },
      // Вертикальная платформа теперь опускается до 320 (легко запрыгнуть) и поднимается до 200
      { x: 680, y: 320, w: 100, h: 20, type: 'moving', ax: 680, ay: 320, bx: 680, by: 200, period: 4 },
      // Левая часть (центр)
      { x: 480, y: 280, w: 100, h: 20, type: 'disappearing' },
      { x: 280, y: 280, w: 100, h: 20 },
      { x: 120, y: 200, w: 100, h: 20 },
      // Верхняя часть
      { x: 280, y: 130, w: 100, h: 20, type: 'moving', ax: 280, ay: 130, bx: 460, by: 130, period: 3.5 },
      { x: 560, y: 130, w: 80, h: 20, type: 'disappearing' },
      // Финальная площадка (сюда приезжает вертикальная платформа и сюда прыгаешь с левой части)
      { x: 720, y: 130, w: 240, h: 20 },
    ],
    diamonds: [
      { x: 150, y: 430 },
      { x: 310, y: 350 },
      { x: 730, y: 250 }, // Алмаз на пути вертикальной платформы
      { x: 330, y: 250 },
      { x: 170, y: 170 },
      { x: 400, y: 100 },
    ],
    hazards: [
      { x: 200, y: 540, w: 100, h: 20, type: 'lava' },
      { x: 500, y: 540, w: 120, h: 20, type: 'lava' },
      { x: 700, y: 540, w: 80,  h: 20, type: 'spike', dir: 'up' },
      { x: 400, y: 80,  w: 80,  h: 20, type: 'spike', dir: 'down' },
    ],
    fallingRocks: [
      { x: 200, period: 3,   delay: 0 },
      { x: 450, period: 2.5, delay: 0.7 },
      { x: 800, period: 3,   delay: 1.4 }, // Камень падает только на финише
      { x: 900, period: 2.5, delay: 0.3 },
    ],
    lanterns: [
      { x: 160, y: 300 },
      { x: 450, y: 350 },
      { x: 750, y: 250 },
      { x: 300, y: 100 },
      { x: 700, y: 60 },
    ],
  },
];