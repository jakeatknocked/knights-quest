import * as BABYLON from '@babylonjs/core';

export class TrailerMode {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.time = 0;
    this.currentSegment = -1;

    // Camera keyframes: each segment has level, duration, keyframes, and text overlays
    this.segments = [
      {
        level: 0, duration: 12,
        keyframes: [
          { t: 0,  pos: [0, 25, 60],   look: [0, 5, 0] },
          { t: 4,  pos: [30, 15, 30],   look: [0, 3, 0] },
          { t: 8,  pos: [20, 8, -10],   look: [-10, 4, -20] },
          { t: 12, pos: [-30, 12, -20], look: [0, 3, 0] },
        ],
        texts: [
          { t: 0, duration: 4, text: "KNIGHT'S QUEST", size: 'huge' },
          { t: 5, duration: 5, text: '10 Epic Levels to Conquer', size: 'big' },
        ],
      },
      {
        level: 1, duration: 10,
        keyframes: [
          { t: 0,  pos: [-40, 6, -40],  look: [0, 3, 0] },
          { t: 3,  pos: [-20, 8, -20],  look: [10, 2, 10] },
          { t: 6,  pos: [10, 5, 0],     look: [30, 3, 20] },
          { t: 10, pos: [40, 10, 30],   look: [0, 3, -10] },
        ],
        texts: [
          { t: 1, duration: 4, text: 'Explore Vast Worlds', size: 'big' },
          { t: 6, duration: 3, text: 'Ancient Forests & Ruins', size: 'medium' },
        ],
      },
      {
        level: 2, duration: 12,
        keyframes: [
          { t: 0,  pos: [0, 25, 40],   look: [0, 12, 0] },
          { t: 4,  pos: [30, 18, 10],  look: [0, 10, -10] },
          { t: 8,  pos: [-20, 30, -20], look: [10, 8, 10] },
          { t: 12, pos: [0, 15, -30],  look: [0, 10, 0] },
        ],
        texts: [
          { t: 1, duration: 4, text: 'Defy Gravity', size: 'huge' },
          { t: 6, duration: 4, text: 'Battle in the Sky', size: 'big' },
        ],
      },
      {
        level: 3, duration: 14, combat: true,
        keyframes: [
          { t: 0,  pos: [0, 12, 40],   look: [0, 3, 0] },
          { t: 4,  pos: [25, 6, 15],   look: [10, 2, -10] },
          { t: 7,  pos: [10, 5, 0],    look: [0, 2, -15] },
          { t: 10, pos: [-15, 8, -20], look: [5, 3, 5] },
          { t: 14, pos: [-30, 15, 30], look: [0, 3, 0] },
        ],
        texts: [
          { t: 1, duration: 4, text: '3 Elemental Weapons', size: 'big' },
          { t: 6, duration: 3, text: 'Fire / Ice / Lightning', size: 'medium' },
          { t: 10, duration: 3, text: 'Sword & Gun Combat', size: 'big' },
        ],
      },
      {
        level: 8, duration: 12,
        keyframes: [
          { t: 0,  pos: [-30, 8, -30], look: [0, 3, 0] },
          { t: 4,  pos: [0, 5, -20],   look: [15, 4, 10] },
          { t: 8,  pos: [20, 10, 10],  look: [-10, 3, -10] },
          { t: 12, pos: [0, 15, 30],   look: [0, 3, 0] },
        ],
        texts: [
          { t: 1, duration: 4, text: 'Discover Hidden Treasures', size: 'big' },
          { t: 6, duration: 4, text: 'Crystal Caverns Await', size: 'medium' },
        ],
      },
      {
        level: 9, duration: 12,
        keyframes: [
          { t: 0,  pos: [0, 20, 50],   look: [0, 5, 0] },
          { t: 4,  pos: [35, 12, 20],  look: [0, 5, 0] },
          { t: 8,  pos: [-25, 8, -15], look: [0, 5, 0] },
          { t: 12, pos: [0, 30, 0],    look: [0, 3, 0] },
        ],
        texts: [
          { t: 1, duration: 4, text: 'Face the Ultimate Challenge', size: 'huge' },
          { t: 6, duration: 4, text: 'The Void Awaits...', size: 'big' },
        ],
      },
      {
        level: -1, duration: 6, // Outro (no level change)
        keyframes: [],
        texts: [
          { t: 0, duration: 2, text: 'Achievements / Friends / Shops', size: 'medium' },
          { t: 2.5, duration: 3, text: 'PLAY NOW', size: 'huge' },
        ],
      },
    ];

    this._createOverlay();
  }

  _createOverlay() {
    // Main overlay container
    this.overlay = document.createElement('div');
    this.overlay.id = 'trailer-overlay';
    this.overlay.innerHTML = `
      <div class="trailer-letterbox top"></div>
      <div class="trailer-letterbox bottom"></div>
      <div class="trailer-text-container">
        <div class="trailer-text"></div>
      </div>
      <div class="trailer-skip">Press ESC to skip</div>
    `;
    this.overlay.style.display = 'none';
    document.body.appendChild(this.overlay);

    this.textEl = this.overlay.querySelector('.trailer-text');
  }

  start() {
    this.active = true;
    this.time = 0;
    this.currentSegment = -1;
    this.segmentTime = 0;
    this.combatTimer = 0;
    this.combatElementIndex = 0;

    // Show overlay
    this.overlay.style.display = 'block';

    // Hide HUD
    this.game.hud.hide();

    // Hide player mesh
    this.game.player.mesh.getChildMeshes().forEach(c => { c.isVisible = false; });
    this.game.player.mesh.isVisible = false;

    // Start music
    this.game.soundManager.init();
    this.game.soundManager.startMusic(0);

    // Start ESC listener
    this._escHandler = (e) => {
      if (e.code === 'Escape') this.stop();
    };
    window.addEventListener('keydown', this._escHandler);

    // Trigger first segment
    this._advanceSegment();
  }

  stop() {
    this.active = false;
    this.overlay.style.display = 'none';
    this.textEl.textContent = '';
    this.textEl.className = 'trailer-text';

    window.removeEventListener('keydown', this._escHandler);

    // Stop music
    this.game.soundManager.stopMusic();

    // Clean up enemies
    this.game.enemyManager.clearAll();

    // Show start screen again
    document.getElementById('start-screen').style.display = 'flex';

    if (this.game.onTrailerEnd) this.game.onTrailerEnd();
  }

  _advanceSegment() {
    this.currentSegment++;
    this.segmentTime = 0;

    if (this.currentSegment >= this.segments.length) {
      this.stop();
      return;
    }

    const seg = this.segments[this.currentSegment];

    // Build level if specified
    if (seg.level >= 0) {
      this.game.world.buildLevel(seg.level);
      this.game.enemyManager.clearAll();

      // Spawn some enemies for visual effect
      if (seg.combat) {
        this._spawnDemoEnemies(seg.level);
      }

      // Change music for variety
      this.game.soundManager.startMusic(seg.level);
    }
  }

  _spawnDemoEnemies(level) {
    // Spawn enemies near where the camera will be looking
    const positions = [
      new BABYLON.Vector3(10, 0, -10),
      new BABYLON.Vector3(-8, 0, -5),
      new BABYLON.Vector3(5, 0, -18),
      new BABYLON.Vector3(-12, 0, -15),
    ];
    positions.forEach(pos => {
      const enemy = this.game.enemyManager.spawnEnemy(pos);
      if (enemy) {
        enemy.aware = true;
        enemy.chasingPlayer = true;
        enemy.alerted = true;
      }
    });
  }

  update(deltaTime) {
    if (!this.active) return;

    this.time += deltaTime;
    this.segmentTime += deltaTime;

    const seg = this.segments[this.currentSegment];
    if (!seg) return;

    // Check if segment is done
    if (this.segmentTime >= seg.duration) {
      this._advanceSegment();
      return;
    }

    // Update camera position (lerp between keyframes)
    if (seg.keyframes.length >= 2) {
      this._updateCamera(seg.keyframes, this.segmentTime);
    }

    // Update text overlays
    this._updateText(seg.texts, this.segmentTime);

    // Combat demo: auto-fire weapons
    if (seg.combat) {
      this._updateCombatDemo(deltaTime);
    }

    // Update enemies so they animate
    this.game.enemyManager.update(deltaTime, this.game);
  }

  _updateCamera(keyframes, t) {
    // Find the two keyframes we're between
    let k0 = keyframes[0];
    let k1 = keyframes[1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (t >= keyframes[i].t && t <= keyframes[i + 1].t) {
        k0 = keyframes[i];
        k1 = keyframes[i + 1];
        break;
      }
    }

    // If past last keyframe, hold at last
    if (t >= keyframes[keyframes.length - 1].t) {
      k0 = keyframes[keyframes.length - 1];
      k1 = k0;
    }

    // Smooth interpolation factor
    const segDuration = k1.t - k0.t;
    const alpha = segDuration > 0 ? Math.min(1, (t - k0.t) / segDuration) : 0;

    // Smooth step for nicer motion
    const smooth = alpha * alpha * (3 - 2 * alpha);

    const px = k0.pos[0] + (k1.pos[0] - k0.pos[0]) * smooth;
    const py = k0.pos[1] + (k1.pos[1] - k0.pos[1]) * smooth;
    const pz = k0.pos[2] + (k1.pos[2] - k0.pos[2]) * smooth;

    const lx = k0.look[0] + (k1.look[0] - k0.look[0]) * smooth;
    const ly = k0.look[1] + (k1.look[1] - k0.look[1]) * smooth;
    const lz = k0.look[2] + (k1.look[2] - k0.look[2]) * smooth;

    this.game.camera.position.set(px, py, pz);
    this.game.camera.setTarget(new BABYLON.Vector3(lx, ly, lz));
  }

  _updateText(texts, t) {
    let activeText = null;
    let activeSize = 'big';

    for (const txt of texts) {
      if (t >= txt.t && t < txt.t + txt.duration) {
        activeText = txt.text;
        activeSize = txt.size || 'big';
        break;
      }
    }

    if (activeText) {
      if (this.textEl.textContent !== activeText) {
        this.textEl.textContent = activeText;
        this.textEl.className = 'trailer-text ' + activeSize + ' show';
      }
    } else {
      if (this.textEl.classList.contains('show')) {
        this.textEl.classList.remove('show');
      }
    }
  }

  _updateCombatDemo(deltaTime) {
    this.combatTimer += deltaTime;

    // Auto-fire every 1.5 seconds, cycling elements
    if (this.combatTimer >= 1.5) {
      this.combatTimer = 0;
      const elements = ['fire', 'ice', 'lightning'];
      const element = elements[this.combatElementIndex % elements.length];
      this.combatElementIndex++;

      // Set element and give ammo
      this.game.state.ammo[element] = 99;
      this.game.state.selectedElement = element;

      // Position player near action for projectile origin
      const seg = this.segments[this.currentSegment];
      if (seg && seg.keyframes.length > 0) {
        // Find current camera look target and place player there
        const kf = seg.keyframes[Math.min(Math.floor(this.segmentTime / 3), seg.keyframes.length - 1)];
        this.game.player.mesh.position.set(kf.look[0], kf.look[1] + 1, kf.look[2]);
      }

      // Create a visual projectile manually toward an enemy
      const enemies = this.game.enemyManager.getAliveEnemies();
      if (enemies.length > 0) {
        const target = enemies[Math.floor(Math.random() * enemies.length)];
        this._createDemoProjectile(this.game.player.mesh.position, target.mesh.position, element);
      }
    }
  }

  _createDemoProjectile(from, to, element) {
    const colors = {
      fire: new BABYLON.Color3(1, 0.3, 0),
      ice: new BABYLON.Color3(0.3, 0.7, 1),
      lightning: new BABYLON.Color3(1, 0.9, 0.2),
    };

    const projectile = BABYLON.MeshBuilder.CreateSphere('demoProj', { diameter: 0.3 }, this.game.scene);
    const mat = new BABYLON.StandardMaterial('demoProjMat', this.game.scene);
    mat.diffuseColor = colors[element] || colors.fire;
    mat.emissiveColor = mat.diffuseColor.scale(0.5);
    projectile.material = mat;
    projectile.position = from.clone();
    projectile.position.y += 1;

    // Light trail
    const light = new BABYLON.PointLight('demoProjLight', from.clone(), this.game.scene);
    light.diffuse = colors[element] || colors.fire;
    light.intensity = 1.0;
    light.range = 8;

    // Animate toward target
    const dir = to.subtract(from).normalize();
    const speed = 30;
    let life = 0;

    const obs = this.game.scene.onBeforeRenderObservable.add(() => {
      const dt = this.game.engine.getDeltaTime() / 1000;
      life += dt;
      projectile.position.addInPlace(dir.scale(speed * dt));
      light.position.copyFrom(projectile.position);

      if (life > 1.5) {
        projectile.dispose();
        mat.dispose();
        light.dispose();
        this.game.scene.onBeforeRenderObservable.remove(obs);
      }
    });
  }

  dispose() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}
