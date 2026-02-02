// Note frequencies for music
const NOTE = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
  Eb3: 155.56, Bb3: 233.08, Eb4: 311.13, Bb4: 466.16, Ab4: 415.30,
  Fs3: 185.00, Fs4: 369.99,
  Db4: 277.18, Ab3: 207.65, Gb3: 185.00, Gb4: 369.99,
};

// Melodies per level (note, duration in beats)
const LEVEL_MUSIC = [
  // Level 1: Castle Siege — heroic march
  {
    tempo: 140,
    melody: [
      [NOTE.C4, 1], [NOTE.E4, 1], [NOTE.G4, 1], [NOTE.C5, 2],
      [NOTE.B4, 1], [NOTE.G4, 1], [NOTE.E4, 1], [NOTE.G4, 2],
      [NOTE.A4, 1], [NOTE.G4, 1], [NOTE.F4, 1], [NOTE.E4, 2],
      [NOTE.D4, 1], [NOTE.E4, 1], [NOTE.F4, 1], [NOTE.G4, 2],
      [NOTE.C4, 1], [NOTE.D4, 1], [NOTE.E4, 1], [NOTE.G4, 2],
      [NOTE.A4, 1], [NOTE.G4, 1], [NOTE.E4, 1], [NOTE.C4, 2],
      [NOTE.D4, 1], [NOTE.F4, 1], [NOTE.E4, 1], [NOTE.D4, 2],
      [NOTE.C4, 3], [0, 1],
    ],
    bass: [
      [NOTE.C3, 2], [NOTE.G3, 2], [NOTE.C3, 2], [NOTE.E3, 2],
      [NOTE.F3, 2], [NOTE.C3, 2], [NOTE.G3, 2], [NOTE.C3, 2],
      [NOTE.C3, 2], [NOTE.G3, 2], [NOTE.A3, 2], [NOTE.E3, 2],
      [NOTE.F3, 2], [NOTE.G3, 2], [NOTE.C3, 4],
    ],
    melodyType: 'triangle',
    bassType: 'sine',
  },
  // Level 2: Forest Hunt — mysterious and ambient
  {
    tempo: 100,
    melody: [
      [NOTE.E4, 2], [NOTE.G4, 1], [NOTE.A4, 2], [NOTE.G4, 1],
      [NOTE.E4, 2], [NOTE.D4, 1], [NOTE.E4, 3],
      [NOTE.A4, 2], [NOTE.B4, 1], [NOTE.C5, 2], [NOTE.B4, 1],
      [NOTE.A4, 2], [NOTE.G4, 1], [NOTE.E4, 3],
      [NOTE.D4, 2], [NOTE.E4, 1], [NOTE.G4, 2], [NOTE.A4, 1],
      [NOTE.G4, 2], [NOTE.E4, 1], [NOTE.D4, 3],
      [NOTE.E4, 2], [NOTE.G4, 2], [NOTE.A4, 2], [NOTE.E4, 3], [0, 1],
    ],
    bass: [
      [NOTE.A3, 3], [NOTE.E3, 3], [NOTE.A3, 3], [NOTE.G3, 3],
      [NOTE.D3, 3], [NOTE.E3, 3], [NOTE.A3, 3], [NOTE.E3, 3],
    ],
    melodyType: 'sine',
    bassType: 'triangle',
  },
  // Level 3: Sky Battle — intense and dark
  {
    tempo: 160,
    melody: [
      [NOTE.E4, 1], [NOTE.E4, 1], [NOTE.Eb4, 1], [NOTE.E4, 1], [NOTE.G4, 2],
      [NOTE.E4, 1], [NOTE.Eb4, 1], [NOTE.E4, 1], [NOTE.Bb4, 2],
      [NOTE.A4, 1], [NOTE.G4, 1], [NOTE.E4, 1], [NOTE.Eb4, 2],
      [NOTE.E4, 1], [NOTE.G4, 1], [NOTE.A4, 1], [NOTE.E4, 2],
      [NOTE.E4, 1], [NOTE.E4, 1], [NOTE.G4, 1], [NOTE.A4, 1], [NOTE.Bb4, 2],
      [NOTE.A4, 1], [NOTE.G4, 1], [NOTE.E4, 1], [NOTE.G4, 2],
      [NOTE.E4, 1], [NOTE.Eb4, 1], [NOTE.E4, 2], [0, 1],
    ],
    bass: [
      [NOTE.E3, 2], [NOTE.Eb3, 2], [NOTE.E3, 2], [NOTE.Bb3, 2],
      [NOTE.A3, 2], [NOTE.E3, 2], [NOTE.Eb3, 2], [NOTE.E3, 2],
      [NOTE.E3, 2], [NOTE.G3, 2], [NOTE.A3, 2], [NOTE.Bb3, 2],
      [NOTE.A3, 2], [NOTE.G3, 2], [NOTE.E3, 4],
    ],
    melodyType: 'sawtooth',
    bassType: 'square',
  },
  // Level 4: Lava Fortress — heavy and ominous
  {
    tempo: 130,
    melody: [
      [NOTE.E4, 1], [NOTE.G4, 1], [NOTE.A4, 2], [NOTE.G4, 1], [NOTE.E4, 1],
      [NOTE.D4, 2], [NOTE.E4, 1], [NOTE.D4, 1], [NOTE.C4, 2],
      [NOTE.E4, 1], [NOTE.G4, 1], [NOTE.A4, 1], [NOTE.C5, 2],
      [NOTE.A4, 1], [NOTE.G4, 1], [NOTE.E4, 1], [NOTE.D4, 2],
      [NOTE.C4, 1], [NOTE.D4, 1], [NOTE.E4, 2], [0, 1],
    ],
    bass: [
      [NOTE.C3, 2], [NOTE.E3, 2], [NOTE.A3, 2], [NOTE.G3, 2],
      [NOTE.C3, 2], [NOTE.E3, 2], [NOTE.D3, 2], [NOTE.C3, 2],
      [NOTE.A3, 2], [NOTE.G3, 2],
    ],
    melodyType: 'sawtooth',
    bassType: 'sawtooth',
  },
  // Level 5: Frozen Depths — eerie and cold
  {
    tempo: 90,
    melody: [
      [NOTE.E4, 3], [NOTE.D4, 1], [NOTE.C4, 2], [NOTE.D4, 2],
      [NOTE.E4, 2], [NOTE.G4, 2], [NOTE.A4, 3], [NOTE.G4, 1],
      [NOTE.E4, 2], [NOTE.D4, 2], [NOTE.C4, 3], [0, 1],
      [NOTE.E4, 2], [NOTE.Fs4, 2], [NOTE.G4, 3], [NOTE.E4, 1],
      [NOTE.D4, 2], [NOTE.C4, 2], [NOTE.D4, 3], [0, 1],
    ],
    bass: [
      [NOTE.A3, 4], [NOTE.E3, 4], [NOTE.A3, 4], [NOTE.D3, 4],
      [NOTE.E3, 4], [NOTE.A3, 4], [NOTE.G3, 4], [NOTE.E3, 4],
    ],
    melodyType: 'sine',
    bassType: 'sine',
  },
  // Level 6: Shadow Realm — dark and epic final battle
  {
    tempo: 150,
    melody: [
      [NOTE.E4, 1], [NOTE.Eb4, 1], [NOTE.E4, 1], [NOTE.Eb4, 1], [NOTE.E4, 2],
      [NOTE.G4, 1], [NOTE.A4, 1], [NOTE.Bb4, 2], [NOTE.A4, 1], [NOTE.G4, 1],
      [NOTE.E4, 2], [NOTE.Eb4, 1], [NOTE.E4, 1], [NOTE.G4, 2],
      [NOTE.Bb4, 1], [NOTE.A4, 1], [NOTE.G4, 1], [NOTE.E4, 1], [NOTE.Eb4, 2],
      [NOTE.E4, 1], [NOTE.G4, 1], [NOTE.Bb4, 1], [NOTE.C5, 2],
      [NOTE.Bb4, 1], [NOTE.A4, 1], [NOTE.G4, 1], [NOTE.E4, 2], [0, 1],
    ],
    bass: [
      [NOTE.E3, 2], [NOTE.Eb3, 2], [NOTE.E3, 2], [NOTE.G3, 2],
      [NOTE.Bb3, 2], [NOTE.A3, 2], [NOTE.G3, 2], [NOTE.E3, 2],
      [NOTE.E3, 2], [NOTE.G3, 2], [NOTE.Bb3, 2], [NOTE.E3, 2],
      [NOTE.Eb3, 2], [NOTE.E3, 4],
    ],
    melodyType: 'square',
    bassType: 'sawtooth',
  },
  // Level 7: Storm Peaks — electric and driving
  {
    tempo: 170,
    melody: [
      [NOTE.E4, 1], [NOTE.G4, 1], [NOTE.B4, 1], [NOTE.E5, 1], [NOTE.D5, 1], [NOTE.B4, 1],
      [NOTE.G4, 2], [NOTE.A4, 1], [NOTE.B4, 1], [NOTE.C5, 2],
      [NOTE.B4, 1], [NOTE.A4, 1], [NOTE.G4, 1], [NOTE.E4, 1], [NOTE.G4, 2],
      [NOTE.A4, 1], [NOTE.C5, 1], [NOTE.B4, 1], [NOTE.A4, 1], [NOTE.G4, 2],
      [NOTE.E4, 1], [NOTE.G4, 1], [NOTE.A4, 1], [NOTE.B4, 2], [0, 1],
    ],
    bass: [
      [NOTE.E3, 1], [NOTE.E3, 1], [NOTE.G3, 1], [NOTE.G3, 1],
      [NOTE.A3, 1], [NOTE.A3, 1], [NOTE.B3, 1], [NOTE.B3, 1],
      [NOTE.C3, 1], [NOTE.C3, 1], [NOTE.D3, 1], [NOTE.D3, 1],
      [NOTE.E3, 1], [NOTE.G3, 1], [NOTE.A3, 1], [NOTE.B3, 1],
      [NOTE.E3, 2], [NOTE.G3, 2],
    ],
    melodyType: 'sawtooth',
    bassType: 'square',
  },
  // Level 8: Poison Swamp — sickly and unsettling
  {
    tempo: 110,
    melody: [
      [NOTE.Eb4, 2], [NOTE.E4, 1], [NOTE.Eb4, 2], [NOTE.Db4, 1],
      [NOTE.C4, 3], [NOTE.Eb4, 1], [NOTE.E4, 2],
      [NOTE.G4, 2], [NOTE.Ab4, 1], [NOTE.G4, 2], [NOTE.Eb4, 1],
      [NOTE.E4, 3], [0, 1],
      [NOTE.Db4, 2], [NOTE.Eb4, 1], [NOTE.E4, 2], [NOTE.G4, 1],
      [NOTE.Ab4, 2], [NOTE.G4, 1], [NOTE.Eb4, 3], [0, 1],
    ],
    bass: [
      [NOTE.Eb3, 3], [NOTE.C3, 3], [NOTE.Eb3, 3], [NOTE.Gb3, 3],
      [NOTE.Ab3, 3], [NOTE.Eb3, 3], [NOTE.C3, 3], [NOTE.Eb3, 3],
    ],
    melodyType: 'triangle',
    bassType: 'sawtooth',
  },
  // Level 9: Crystal Caverns — shimmering and magical
  {
    tempo: 120,
    melody: [
      [NOTE.C5, 1], [NOTE.B4, 1], [NOTE.A4, 1], [NOTE.G4, 2],
      [NOTE.A4, 1], [NOTE.B4, 1], [NOTE.C5, 2], [NOTE.E5, 1],
      [NOTE.D5, 1], [NOTE.C5, 1], [NOTE.B4, 1], [NOTE.A4, 2],
      [NOTE.G4, 1], [NOTE.A4, 1], [NOTE.B4, 2], [NOTE.C5, 1],
      [NOTE.A4, 1], [NOTE.G4, 2], [NOTE.E4, 1], [NOTE.G4, 1],
      [NOTE.A4, 2], [NOTE.B4, 1], [NOTE.C5, 2], [0, 1],
    ],
    bass: [
      [NOTE.C3, 2], [NOTE.E3, 2], [NOTE.G3, 2], [NOTE.A3, 2],
      [NOTE.E3, 2], [NOTE.G3, 2], [NOTE.C3, 2], [NOTE.D3, 2],
      [NOTE.E3, 2], [NOTE.A3, 2], [NOTE.G3, 2], [NOTE.C3, 2],
    ],
    melodyType: 'sine',
    bassType: 'triangle',
  },
  // Level 10: The Void — final ominous apocalypse
  {
    tempo: 180,
    melody: [
      [NOTE.E4, 1], [NOTE.Eb4, 1], [NOTE.E4, 1], [NOTE.G4, 1], [NOTE.Bb4, 1], [NOTE.C5, 1],
      [NOTE.Bb4, 1], [NOTE.G4, 1], [NOTE.E4, 1], [NOTE.Eb4, 1], [NOTE.E4, 2],
      [NOTE.G4, 1], [NOTE.Bb4, 1], [NOTE.C5, 1], [NOTE.D5, 1], [NOTE.C5, 1], [NOTE.Bb4, 1],
      [NOTE.G4, 1], [NOTE.E4, 1], [NOTE.Eb4, 1], [NOTE.E4, 2],
      [NOTE.Bb4, 1], [NOTE.C5, 1], [NOTE.E5, 1], [NOTE.D5, 1],
      [NOTE.C5, 1], [NOTE.Bb4, 1], [NOTE.G4, 1], [NOTE.E4, 2], [0, 1],
    ],
    bass: [
      [NOTE.E3, 1], [NOTE.E3, 1], [NOTE.Eb3, 1], [NOTE.Eb3, 1],
      [NOTE.E3, 1], [NOTE.G3, 1], [NOTE.Bb3, 1], [NOTE.E3, 1],
      [NOTE.Eb3, 1], [NOTE.E3, 1], [NOTE.G3, 1], [NOTE.Bb3, 1],
      [NOTE.E3, 1], [NOTE.E3, 1], [NOTE.Eb3, 1], [NOTE.Eb3, 1],
      [NOTE.E3, 1], [NOTE.G3, 1], [NOTE.Bb3, 1], [NOTE.C3, 1],
      [NOTE.E3, 2], [NOTE.E3, 2],
    ],
    melodyType: 'sawtooth',
    bassType: 'sawtooth',
  },
];

// Menu music — calm and majestic
const MENU_MUSIC = {
  tempo: 80,
  melody: [
    [NOTE.C4, 2], [NOTE.E4, 2], [NOTE.G4, 3], [NOTE.E4, 1],
    [NOTE.A4, 2], [NOTE.G4, 2], [NOTE.E4, 3], [0, 1],
    [NOTE.D4, 2], [NOTE.F4, 2], [NOTE.A4, 3], [NOTE.G4, 1],
    [NOTE.E4, 2], [NOTE.D4, 2], [NOTE.C4, 3], [0, 1],
    [NOTE.E4, 2], [NOTE.G4, 2], [NOTE.C5, 3], [NOTE.B4, 1],
    [NOTE.A4, 2], [NOTE.G4, 2], [NOTE.E4, 3], [0, 1],
    [NOTE.F4, 2], [NOTE.E4, 2], [NOTE.D4, 3], [NOTE.C4, 1],
    [NOTE.C4, 4], [0, 2],
  ],
  bass: [
    [NOTE.C3, 4], [NOTE.E3, 4], [NOTE.A3, 4], [NOTE.G3, 4],
    [NOTE.D3, 4], [NOTE.F3, 4], [NOTE.A3, 4], [NOTE.G3, 4],
    [NOTE.C3, 4], [NOTE.E3, 4], [NOTE.A3, 4], [NOTE.G3, 4],
    [NOTE.F3, 4], [NOTE.G3, 4], [NOTE.C3, 6],
  ],
  melodyType: 'triangle',
  bassType: 'sine',
};

// Boss fight music — intense and urgent
const BOSS_MUSIC = {
  tempo: 180,
  melody: [
    [NOTE.E4, 1], [NOTE.E4, 1], [NOTE.G4, 1], [NOTE.E4, 1], [NOTE.Bb4, 2],
    [NOTE.A4, 1], [NOTE.G4, 1], [NOTE.E4, 1], [NOTE.Eb4, 1], [NOTE.E4, 2],
    [NOTE.G4, 1], [NOTE.A4, 1], [NOTE.Bb4, 1], [NOTE.C5, 1], [NOTE.Bb4, 1], [NOTE.A4, 1],
    [NOTE.G4, 2], [NOTE.E4, 1], [NOTE.G4, 1], [NOTE.A4, 2],
    [NOTE.E4, 1], [NOTE.Eb4, 1], [NOTE.E4, 1], [NOTE.G4, 1], [NOTE.E4, 2],
    [NOTE.Bb4, 1], [NOTE.A4, 1], [NOTE.G4, 1], [NOTE.E4, 1], [NOTE.Eb4, 2],
    [NOTE.E4, 1], [NOTE.E4, 1], [NOTE.G4, 2], [0, 1],
  ],
  bass: [
    [NOTE.E3, 1], [NOTE.E3, 1], [NOTE.E3, 1], [NOTE.E3, 1],
    [NOTE.Eb3, 1], [NOTE.Eb3, 1], [NOTE.Eb3, 1], [NOTE.Eb3, 1],
    [NOTE.E3, 1], [NOTE.E3, 1], [NOTE.G3, 1], [NOTE.G3, 1],
    [NOTE.Bb3, 1], [NOTE.Bb3, 1], [NOTE.A3, 1], [NOTE.A3, 1],
    [NOTE.E3, 1], [NOTE.E3, 1], [NOTE.E3, 1], [NOTE.E3, 1],
    [NOTE.Eb3, 1], [NOTE.Eb3, 1], [NOTE.Eb3, 1], [NOTE.Eb3, 1],
    [NOTE.E3, 1], [NOTE.G3, 1], [NOTE.E3, 1], [NOTE.G3, 1],
    [NOTE.E3, 2], [NOTE.E3, 2],
  ],
  melodyType: 'sawtooth',
  bassType: 'square',
};

export class SoundManager {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.musicPlaying = false;
    this.musicTimers = [];
    this.musicGain = null;
    this.currentMusicLevel = -1;
    this.isBossMusic = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
      // Master music gain node
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.12;
      this.musicGain.connect(this.ctx.destination);
    } catch (e) {
      // Web Audio not supported
    }
  }

  startMusic(levelIndex) {
    this.stopMusic();
    if (!this.initialized) this.init();
    if (!this.ctx || !this.musicGain) return;

    this.currentMusicLevel = levelIndex;
    this.musicPlaying = true;

    const music = LEVEL_MUSIC[levelIndex];
    if (!music) return;
    this._playMusicData(music);
  }

  _playMusicData(music) {
    const beatDuration = 60 / music.tempo;

    const scheduleLoop = () => {
      if (!this.musicPlaying) return;

      let melodyTime = 0;
      music.melody.forEach(([freq, beats]) => {
        if (freq > 0) {
          const dur = beats * beatDuration;
          const timerId = setTimeout(() => {
            if (!this.musicPlaying) return;
            this._playMusicNote(freq, dur * 0.9, music.melodyType, 0.12);
          }, melodyTime * 1000);
          this.musicTimers.push(timerId);
        }
        melodyTime += beats * beatDuration;
      });

      let bassTime = 0;
      music.bass.forEach(([freq, beats]) => {
        if (freq > 0) {
          const dur = beats * beatDuration;
          const timerId = setTimeout(() => {
            if (!this.musicPlaying) return;
            this._playMusicNote(freq, dur * 0.9, music.bassType, 0.08);
          }, bassTime * 1000);
          this.musicTimers.push(timerId);
        }
        bassTime += beats * beatDuration;
      });

      const loopDuration = Math.max(melodyTime, bassTime);
      const loopTimer = setTimeout(() => {
        scheduleLoop();
      }, loopDuration * 1000);
      this.musicTimers.push(loopTimer);
    };

    scheduleLoop();
  }

  startMenuMusic() {
    this.stopMusic();
    if (!this.initialized) this.init();
    if (!this.ctx || !this.musicGain) return;

    this.musicPlaying = true;
    this._playMusicData(MENU_MUSIC);
  }

  startBossMusic() {
    if (this.isBossMusic) return;
    this.stopMusic();
    if (!this.initialized) this.init();
    if (!this.ctx || !this.musicGain) return;

    this.isBossMusic = true;
    this.musicPlaying = true;
    this._playMusicData(BOSS_MUSIC);
  }

  stopBossMusic(levelIndex) {
    if (!this.isBossMusic) return;
    this.isBossMusic = false;
    // Resume level music
    if (levelIndex !== undefined && levelIndex >= 0) {
      this.startMusic(levelIndex);
    } else {
      this.stopMusic();
    }
  }

  stopMusic() {
    this.musicPlaying = false;
    this.currentMusicLevel = -1;
    this.isBossMusic = false;
    this.musicTimers.forEach(t => clearTimeout(t));
    this.musicTimers = [];
  }

  _playMusicNote(freq, duration, type, volume) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    // Smooth envelope
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.02);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  }

  play(name) {
    if (!this.initialized) this.init();
    if (!this.ctx) return;

    const sounds = {
      sword: () => this.playNoise(0.1, 800, 200, 'sawtooth'),
      fire: () => this.playNoise(0.15, 300, 100, 'sawtooth'),
      ice: () => this.playTone(0.15, 1200, 800, 'sine'),
      lightning: () => this.playNoise(0.1, 2000, 500, 'square'),
      hit: () => this.playNoise(0.08, 400, 100, 'square'),
      pickup: () => this.playTone(0.1, 600, 900, 'sine'),
      shield: () => this.playTone(0.15, 300, 500, 'triangle'),
      jump: () => this.playTone(0.08, 200, 400, 'sine'),
      enemyDie: () => this.playTone(0.2, 400, 100, 'sawtooth'),
      bossRoar: () => this.playNoise(0.4, 100, 50, 'sawtooth'),
      playerHurt: () => this.playTone(0.12, 300, 150, 'square'),
      coin: () => this.playTone(0.08, 800, 1200, 'sine'),
      reload: () => this.playReloadSound(),
      chestOpen: () => this.playChestOpenSound(),
    };

    if (sounds[name]) sounds[name]();
  }

  playTone(duration, startFreq, endFreq, type) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playNoise(duration, startFreq, endFreq, type) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playReloadSound() {
    // Metallic click sound - two parts: magazine out, magazine in
    const now = this.ctx.currentTime;

    // Magazine out - click down
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(200, now);
    osc1.frequency.linearRampToValueAtTime(150, now + 0.05);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.linearRampToValueAtTime(0, now + 0.05);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.05);

    // Magazine in - click up (after a brief pause)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(250, now + 0.15);
    osc2.frequency.linearRampToValueAtTime(300, now + 0.2);
    gain2.gain.setValueAtTime(0.25, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0, now + 0.2);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.2);
  }

  playChestOpenSound() {
    // Creaky wooden chest opening sound - three parts
    const now = this.ctx.currentTime;

    // First creak - lock unlatching
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(150, now);
    osc1.frequency.linearRampToValueAtTime(180, now + 0.08);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.linearRampToValueAtTime(0, now + 0.08);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.08);

    // Second creak - hinges opening
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(120, now + 0.1);
    osc2.frequency.linearRampToValueAtTime(200, now + 0.35);
    gain2.gain.setValueAtTime(0.12, now + 0.1);
    gain2.gain.linearRampToValueAtTime(0, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.35);

    // Third part - magical shimmer as treasure appears
    const osc3 = this.ctx.createOscillator();
    const gain3 = this.ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(800, now + 0.4);
    osc3.frequency.linearRampToValueAtTime(1400, now + 0.7);
    gain3.gain.setValueAtTime(0.15, now + 0.4);
    gain3.gain.linearRampToValueAtTime(0, now + 0.7);
    osc3.connect(gain3);
    gain3.connect(this.ctx.destination);
    osc3.start(now + 0.4);
    osc3.stop(now + 0.7);
  }
}
