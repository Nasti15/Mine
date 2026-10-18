export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

export function resolveX(ent, platforms, dx) {
  ent.x += dx;
  for (const p of platforms) {
    if (!p.solid) continue;
    if (rectsOverlap(ent, p)) {
      if (dx > 0) ent.x = p.x - ent.w;
      else if (dx < 0) ent.x = p.x + p.w;
      ent.vx = 0;
      return true;
    }
  }
  return false;
}

export function resolveY(ent, platforms, dy) {
  ent.y += dy;
  let onGround = false;
  let ground = null;
  for (const p of platforms) {
    if (!p.solid) continue;
    if (rectsOverlap(ent, p)) {
      if (dy > 0) {
        ent.y = p.y - ent.h;
        ent.vy = 0;
        onGround = true;
        ground = p;
      } else if (dy < 0) {
        ent.y = p.y + p.h;
        ent.vy = 0;
      }
    }
  }
  return { onGround, ground };
}