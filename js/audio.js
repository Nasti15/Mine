export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.volume = 0.5;
    this.musicTimer = null;
    this.musicStep = 0;
  }

  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    } catch (e) { this.ctx = null; }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this.volume;
  }

  playTone(freq, duration, type = 'sine', vol = 0.2, slideTo = null) {
    if (!this.ctx || this.volume === 0) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + duration);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  jump()    { this.playTone(480, 0.11, 'triangle', 0.14, 720); }
  diamond() {
    this.playTone(880, 0.08, 'sine', 0.18);
    setTimeout(() => this.playTone(1320, 0.13, 'sine', 0.18), 55);
  }
  death()   { this.playTone(340, 0.45, 'sawtooth', 0.22, 80); }
  complete(){
    this.playTone(523, 0.13, 'sine', 0.2);
    setTimeout(() => this.playTone(659, 0.13, 'sine', 0.2), 110);
    setTimeout(() => this.playTone(784, 0.13, 'sine', 0.2), 220);
    setTimeout(() => this.playTone(1047, 0.3, 'sine', 0.22), 330);
  }
  click()   { this.playTone(620, 0.045, 'square', 0.09); }
  rock()    { this.playTone(110, 0.15, 'sawtooth', 0.14, 60); }

  startMusic() {
    if (this.musicTimer || !this.ctx) return;
    const notes = [220, 261.63, 329.63, 392, 440, 392, 329.63, 261.63];
    const playNote = () => {
      if (!this.ctx) return;
      const f = notes[this.musicStep % notes.length];
      this.playTone(f, 0.9, 'sine', 0.045);
      if (this.musicStep % 4 === 0) this.playTone(f / 2, 1.8, 'sine', 0.035);
      this.musicStep++;
    };
    playNote();
    this.musicTimer = setInterval(playNote, 620);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}