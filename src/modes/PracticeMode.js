import * as BABYLON from '@babylonjs/core';

export class PracticeMode {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.active = false;
    this.targets = [];
    this.totalShots = 0;
    this.totalHits = 0;
    this._escHandler = null;

    // HUD elements
    this.hudEl = null;
    this._createHUD();
  }

  _createHUD() {
    this.hudEl = document.createElement('div');
    this.hudEl.id = 'practice-hud';
    this.hudEl.innerHTML = `
      <div id="practice-title">PRACTICE MODE</div>
      <div id="practice-stats">
        <span id="practice-hits">Hits: 0</span>
        <span id="practice-accuracy">Accuracy: 0%</span>
      </div>
      <div id="practice-hint">Press ESC to exit</div>
    `;
    this.hudEl.style.display = 'none';
    document.body.appendChild(this.hudEl);
  }

  start() {
    this.active = true;
    this.totalShots = 0;
    this.totalHits = 0;

    // Give infinite ammo and health
    this.game.state.health = this.game.state.maxHealth;
    this.game.state.ammo = { fire: 9999, ice: 9999, lightning: 9999 };
    this.game.practiceMode = true;

    // Build the castle level as a base (open layout for targets)
    this.game.world.buildLevel(0);

    // Teleport player
    this.game.player.mesh.position = new BABYLON.Vector3(0, 2, 10);
    if (this.game.player.mesh.physicsImpostor) {
      this.game.player.mesh.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
    }

    // Clear all enemies — this is practice, no fighting!
    this.game.enemyManager.clearAll();

    // ---- Make it SUPER bright and friendly! ----

    // Beautiful bright blue sky
    this._oldClearColor = this.scene.clearColor.clone();
    this.scene.clearColor = new BABYLON.Color4(0.5, 0.75, 1.0, 1);

    // Disable fog — no spooky darkness
    this._oldFogMode = this.scene.fogMode;
    this.scene.fogMode = BABYLON.Scene.FOGMODE_NONE;

    // Crank up the sun
    if (this.game.sunLight) {
      this._oldSunIntensity = this.game.sunLight.intensity;
      this.game.sunLight.intensity = 3.0;
      this._oldSunColor = this.game.sunLight.diffuse.clone();
      this.game.sunLight.diffuse = new BABYLON.Color3(1, 1, 0.9);
    }

    // Bright ground — override to cheerful green grass
    const ground = this.scene.getMeshByName('ground');
    if (ground && ground.material) {
      this._oldGroundColor = ground.material.diffuseColor.clone();
      this._oldGroundEmissive = ground.material.emissiveColor.clone();
      ground.material.diffuseColor = new BABYLON.Color3(0.3, 0.55, 0.15);
      ground.material.emissiveColor = new BABYLON.Color3(0.08, 0.15, 0.04);
    }

    // Extra bright practice lighting — sunny day vibes!
    this._practiceLight = new BABYLON.HemisphericLight('practiceLight', new BABYLON.Vector3(0, 1, 0), this.scene);
    this._practiceLight.intensity = 2.5;
    this._practiceLight.diffuse = new BABYLON.Color3(1, 1, 0.95);
    this._practiceLight.groundColor = new BABYLON.Color3(0.8, 0.85, 0.7);

    // Spawn targets
    this._spawnTargets();

    // Show HUD
    this.hudEl.style.display = 'block';
    this._updateHUD();

    // ESC listener
    this._escHandler = (e) => {
      if (e.code === 'Escape') this.stop();
    };
    window.addEventListener('keydown', this._escHandler);

    this.game.hud.showMessage('Practice Mode — Shoot the targets!');
  }

  stop() {
    this.active = false;
    this.game.practiceMode = false;
    this.hudEl.style.display = 'none';

    // Restore original scene settings
    if (this._oldClearColor) {
      this.scene.clearColor = this._oldClearColor;
    }
    if (this._oldFogMode !== undefined) {
      this.scene.fogMode = this._oldFogMode;
    }
    if (this.game.sunLight) {
      if (this._oldSunIntensity !== undefined) this.game.sunLight.intensity = this._oldSunIntensity;
      if (this._oldSunColor) this.game.sunLight.diffuse = this._oldSunColor;
    }
    const ground = this.scene.getMeshByName('ground');
    if (ground && ground.material && this._oldGroundColor) {
      ground.material.diffuseColor = this._oldGroundColor;
      ground.material.emissiveColor = this._oldGroundEmissive;
    }

    // Clean up practice light
    if (this._practiceLight) {
      this._practiceLight.dispose();
      this._practiceLight = null;
    }

    // Clean up targets
    this.targets.forEach(t => this._disposeTarget(t));
    this.targets = [];

    window.removeEventListener('keydown', this._escHandler);

    // Return to menu
    document.getElementById('start-screen').style.display = 'flex';
    this.game.state.started = false;
    this.game.hud.hide();
    document.exitPointerLock();
  }

  _spawnTargets() {
    // Spawn targets at various positions and distances
    const positions = [
      // Close range (5-8 units)
      { pos: [5, 0, 5], size: 'large' },
      { pos: [-6, 0, 4], size: 'large' },
      { pos: [3, 0, 8], size: 'medium' },
      // Mid range (10-18 units)
      { pos: [12, 0, 0], size: 'medium' },
      { pos: [-10, 0, 8], size: 'medium' },
      { pos: [8, 0, -12], size: 'small' },
      { pos: [-5, 0, -15], size: 'medium' },
      { pos: [15, 0, 10], size: 'small' },
      // Long range (20-30 units)
      { pos: [25, 0, 5], size: 'small' },
      { pos: [-20, 0, -10], size: 'small' },
      { pos: [10, 0, -25], size: 'small' },
      { pos: [-18, 0, 15], size: 'medium' },
      // Elevated targets
      { pos: [8, 3, -5], size: 'small', elevated: true },
      { pos: [-12, 2, 0], size: 'medium', elevated: true },
      { pos: [0, 4, -20], size: 'small', elevated: true },
    ];

    positions.forEach((cfg, i) => {
      const target = this._createTarget(
        new BABYLON.Vector3(cfg.pos[0], cfg.pos[1], cfg.pos[2]),
        cfg.size,
        cfg.elevated
      );
      this.targets.push(target);
    });
  }

  _createTarget(position, size, elevated) {
    const scales = { small: 0.6, medium: 1.0, large: 1.4 };
    const s = scales[size] || 1.0;

    const root = new BABYLON.TransformNode('target', this.scene);
    root.position = position.clone();
    if (!elevated) root.position.y = 0;

    // Wooden post
    const postMat = new BABYLON.StandardMaterial('postMat', this.scene);
    postMat.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.2);
    postMat.emissiveColor = new BABYLON.Color3(0.15, 0.1, 0.05);

    const post = BABYLON.MeshBuilder.CreateCylinder('post', {
      height: 1.8 * s, diameter: 0.15 * s, tessellation: 8
    }, this.scene);
    post.position.y = 0.9 * s;
    post.parent = root;
    post.material = postMat;

    // Cross beam
    const beam = BABYLON.MeshBuilder.CreateBox('beam', {
      width: 0.8 * s, height: 0.1 * s, depth: 0.1 * s
    }, this.scene);
    beam.position.y = 1.5 * s;
    beam.parent = root;
    beam.material = postMat;

    // Bullseye board (back)
    const boardMat = new BABYLON.StandardMaterial('boardMat', this.scene);
    boardMat.diffuseColor = new BABYLON.Color3(0.95, 0.9, 0.75);
    boardMat.emissiveColor = new BABYLON.Color3(0.25, 0.22, 0.18);

    const board = BABYLON.MeshBuilder.CreateCylinder('board', {
      height: 0.08 * s, diameter: 0.9 * s, tessellation: 24
    }, this.scene);
    board.position.y = 1.5 * s;
    board.rotation.x = Math.PI / 2;
    board.parent = root;
    board.material = boardMat;

    // Red outer ring
    const ringMat = new BABYLON.StandardMaterial('ringMat', this.scene);
    ringMat.diffuseColor = new BABYLON.Color3(1, 0.2, 0.1);
    ringMat.emissiveColor = new BABYLON.Color3(0.4, 0.06, 0.03);

    const ring = BABYLON.MeshBuilder.CreateTorus('ring', {
      diameter: 0.7 * s, thickness: 0.12 * s, tessellation: 24
    }, this.scene);
    ring.position.y = 1.5 * s;
    ring.rotation.x = Math.PI / 2;
    ring.parent = root;
    ring.material = ringMat;

    // White middle ring
    const midMat = new BABYLON.StandardMaterial('midMat', this.scene);
    midMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
    midMat.emissiveColor = new BABYLON.Color3(0.35, 0.35, 0.35);

    const mid = BABYLON.MeshBuilder.CreateTorus('midRing', {
      diameter: 0.45 * s, thickness: 0.08 * s, tessellation: 24
    }, this.scene);
    mid.position.y = 1.5 * s;
    mid.rotation.x = Math.PI / 2;
    mid.parent = root;
    mid.material = midMat;

    // Red bullseye center
    const center = BABYLON.MeshBuilder.CreateCylinder('center', {
      height: 0.1 * s, diameter: 0.2 * s, tessellation: 16
    }, this.scene);
    center.position.y = 1.5 * s;
    center.rotation.x = Math.PI / 2;
    center.parent = root;
    center.material = ringMat;

    // Hitbox (invisible sphere for collision detection)
    const hitbox = BABYLON.MeshBuilder.CreateSphere('targetHitbox', {
      diameter: 1.0 * s
    }, this.scene);
    hitbox.position.y = 1.5 * s;
    hitbox.parent = root;
    hitbox.isVisible = false;
    hitbox.isPickable = true;

    const target = {
      root,
      hitbox,
      board,
      size,
      scale: s,
      position: root.position,
      hitboxWorldPos: () => {
        return new BABYLON.Vector3(
          root.position.x,
          root.position.y + 1.5 * s,
          root.position.z
        );
      },
      wobbleTime: 0,
      wobbling: false,
    };

    return target;
  }

  // Called by CombatSystem when a projectile or sword hits near a target
  checkHit(hitPosition, damage) {
    for (const target of this.targets) {
      const worldPos = target.hitboxWorldPos();
      const dist = BABYLON.Vector3.Distance(hitPosition, worldPos);
      if (dist < 0.6 * target.scale) {
        this._onTargetHit(target, hitPosition, damage, true); // bullseye
        return true;
      } else if (dist < 1.0 * target.scale) {
        this._onTargetHit(target, hitPosition, damage, false);
        return true;
      }
    }
    return false;
  }

  _onTargetHit(target, hitPosition, damage, bullseye) {
    this.totalHits++;

    // Wobble animation
    target.wobbling = true;
    target.wobbleTime = 0;

    // Show floating damage number
    this._showDamageNumber(hitPosition, damage, bullseye);

    // Flash the board
    if (target.board && target.board.material) {
      const origColor = target.board.material.emissiveColor.clone();
      target.board.material.emissiveColor = bullseye
        ? new BABYLON.Color3(0.5, 0.1, 0)
        : new BABYLON.Color3(0.3, 0.3, 0.1);
      setTimeout(() => {
        if (target.board && target.board.material) {
          target.board.material.emissiveColor = origColor;
        }
      }, 200);
    }

    this._updateHUD();
  }

  _showDamageNumber(position, damage, bullseye) {
    const plane = BABYLON.MeshBuilder.CreatePlane('dmgNum', {
      width: 1.2, height: 0.4
    }, this.scene);
    plane.position = position.clone();
    plane.position.y += 0.5;
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    const tex = new BABYLON.DynamicTexture('dmgTex', { width: 256, height: 64 }, this.scene);
    const ctx = tex.getContext();
    ctx.clearRect(0, 0, 256, 64);
    ctx.font = 'bold 42px Arial';
    ctx.fillStyle = bullseye ? '#ff4400' : '#ffdd00';
    ctx.textAlign = 'center';
    ctx.fillText(bullseye ? `${damage} BULLSEYE!` : `${damage}`, 128, 46);
    tex.update();

    const mat = new BABYLON.StandardMaterial('dmgMat', this.scene);
    mat.diffuseTexture = tex;
    mat.emissiveTexture = tex;
    mat.opacityTexture = tex;
    mat.backFaceCulling = false;
    mat.disableLighting = true;
    plane.material = mat;

    // Float up and fade
    let life = 1.0;
    const obs = this.scene.onBeforeRenderObservable.add(() => {
      life -= this.game.engine.getDeltaTime() / 1000;
      plane.position.y += 0.02;
      if (mat) mat.alpha = Math.max(0, life);
      if (life <= 0) {
        this.scene.onBeforeRenderObservable.remove(obs);
        tex.dispose();
        mat.dispose();
        plane.dispose();
      }
    });
  }

  registerShot() {
    if (!this.active) return;
    this.totalShots++;
    this._updateHUD();
  }

  _updateHUD() {
    const hitsEl = document.getElementById('practice-hits');
    const accEl = document.getElementById('practice-accuracy');
    if (hitsEl) hitsEl.textContent = `Hits: ${this.totalHits}`;
    if (accEl) {
      const acc = this.totalShots > 0 ? Math.round((this.totalHits / this.totalShots) * 100) : 0;
      accEl.textContent = `Accuracy: ${acc}%`;
    }
  }

  update(deltaTime) {
    if (!this.active) return;

    // Keep health and ammo full
    this.game.state.health = this.game.state.maxHealth;
    this.game.state.ammo.fire = 9999;
    this.game.state.ammo.ice = 9999;
    this.game.state.ammo.lightning = 9999;

    // Wobble animation on hit targets
    for (const target of this.targets) {
      if (target.wobbling) {
        target.wobbleTime += deltaTime;
        const wobble = Math.sin(target.wobbleTime * 25) * 0.15 * Math.max(0, 1 - target.wobbleTime * 3);
        target.root.rotation.z = wobble;
        if (target.wobbleTime > 0.5) {
          target.wobbling = false;
          target.root.rotation.z = 0;
        }
      }
    }
  }

  _disposeTarget(target) {
    if (target.root) {
      target.root.getChildMeshes().forEach(c => {
        if (c.material) c.material.dispose();
        c.dispose();
      });
      target.root.dispose();
    }
  }

  dispose() {
    this.targets.forEach(t => this._disposeTarget(t));
    this.targets = [];
    if (this.hudEl && this.hudEl.parentNode) {
      this.hudEl.parentNode.removeChild(this.hudEl);
    }
    window.removeEventListener('keydown', this._escHandler);
  }
}
