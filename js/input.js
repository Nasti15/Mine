export class Input {
  constructor() {
    this.keys = { left: false, right: false, jump: false };
    this.jumpJustPressed = false;
    this.enabled = false;
    this._bind();
  }

  _bind() {
    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      const c = e.code;
      if (c === 'ArrowLeft' || c === 'KeyA') { this.keys.left = true; e.preventDefault(); }
      else if (c === 'ArrowRight' || c === 'KeyD') { this.keys.right = true; e.preventDefault(); }
      else if (c === 'Space' || c === 'KeyW' || c === 'ArrowUp') {
        if (!this.keys.jump) this.jumpJustPressed = true;
        this.keys.jump = true;
        e.preventDefault();
      }
    }, { passive: false });

    window.addEventListener('keyup', (e) => {
      const c = e.code;
      if (c === 'ArrowLeft' || c === 'KeyA') this.keys.left = false;
      else if (c === 'ArrowRight' || c === 'KeyD') this.keys.right = false;
      else if (c === 'Space' || c === 'KeyW' || c === 'ArrowUp') this.keys.jump = false;
    });

    window.addEventListener('blur', () => this.clear());
  }

  setKey(name, val) {
    if (name === 'jump' && val && !this.keys.jump) this.jumpJustPressed = true;
    this.keys[name] = !!val;
  }

  consumeJump() {
    const j = this.jumpJustPressed;
    this.jumpJustPressed = false;
    return j;
  }

  clear() {
    this.keys.left = this.keys.right = this.keys.jump = false;
    this.jumpJustPressed = false;
  }
}