import * as BABYLON from '@babylonjs/core';

const PET_CONFIGS = {
  wolf: {
    name: 'Wolf Pup',
    bodyColor: new BABYLON.Color3(0.45, 0.35, 0.25),
    emissive: new BABYLON.Color3(0.08, 0.06, 0.04),
    speed: 6,
    behavior: 'attack',     // attacks nearby enemies
    attackDamage: 12,
    attackRange: 6,
    attackCooldown: 1.2,
  },
  dragon: {
    name: 'Baby Dragon',
    bodyColor: new BABYLON.Color3(0.8, 0.2, 0.05),
    emissive: new BABYLON.Color3(0.2, 0.04, 0.01),
    speed: 5,
    behavior: 'attack',     // breathes fire at enemies
    attackDamage: 18,
    attackRange: 10,
    attackCooldown: 2.0,
  },
  fairy: {
    name: 'Healing Fairy',
    bodyColor: new BABYLON.Color3(0.4, 1, 0.6),
    emissive: new BABYLON.Color3(0.1, 0.3, 0.15),
    speed: 4,
    behavior: 'heal',       // heals player over time
    healRate: 3,             // HP per second
  },
  ghost: {
    name: 'Ghost Buddy',
    bodyColor: new BABYLON.Color3(0.8, 0.85, 0.9),
    emissive: new BABYLON.Color3(0.2, 0.22, 0.25),
    speed: 5,
    behavior: 'scare',      // scares enemies away
    scareRange: 8,
    scareCooldown: 4.0,
  },
};

export class Pet {
  constructor(scene, player, petType) {
    this.scene = scene;
    this.player = player;
    this.type = petType;
    this.config = PET_CONFIGS[petType];
    this.attackCooldown = 0;
    this.scareCooldown = 0;
    this.bobTime = 0;
    this.projectiles = [];

    this.buildMesh();
  }

  buildMesh() {
    const cfg = this.config;

    // Root node for the pet (no physics — just follows player smoothly)
    this.mesh = new BABYLON.TransformNode('pet_' + this.type, this.scene);

    const mat = new BABYLON.StandardMaterial('petMat', this.scene);
    mat.diffuseColor = cfg.bodyColor;
    mat.emissiveColor = cfg.emissive;

    const accentMat = new BABYLON.StandardMaterial('petAccent', this.scene);

    if (this.type === 'wolf') {
      this._buildWolf(mat, accentMat);
    } else if (this.type === 'dragon') {
      this._buildDragon(mat, accentMat);
    } else if (this.type === 'fairy') {
      this._buildFairy(mat, accentMat);
    } else if (this.type === 'ghost') {
      this._buildGhost(mat, accentMat);
    }

    // Position near player
    if (this.player && this.player.mesh) {
      this.mesh.position = this.player.mesh.position.clone();
      this.mesh.position.x += 2;
    }
  }

  _buildWolf(mat, accentMat) {
    // Cute puppy! Rounder, chubbier, big head, stubby legs

    // Chubby round body
    const body = BABYLON.MeshBuilder.CreateSphere('wolfBody', {
      diameter: 0.55
    }, this.scene);
    body.scaling = new BABYLON.Vector3(0.9, 0.75, 1.1);
    body.position.y = 0.45;
    body.parent = this.mesh;
    body.material = mat;

    // Big round puppy head (oversized = cute)
    const head = BABYLON.MeshBuilder.CreateSphere('wolfHead', {
      diameter: 0.42
    }, this.scene);
    head.position.set(0, 0.7, 0.32);
    head.parent = this.mesh;
    head.material = mat;

    // Little round snout
    const snout = BABYLON.MeshBuilder.CreateSphere('wolfSnout', {
      diameter: 0.18
    }, this.scene);
    snout.scaling = new BABYLON.Vector3(1, 0.7, 1.2);
    snout.position.set(0, 0.63, 0.52);
    snout.parent = this.mesh;
    snout.material = mat;

    // Nose (shiny black dot)
    const noseMat = new BABYLON.StandardMaterial('wolfNoseMat', this.scene);
    noseMat.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.05);
    noseMat.emissiveColor = new BABYLON.Color3(0.02, 0.02, 0.02);
    noseMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    const nose = BABYLON.MeshBuilder.CreateSphere('wolfNose', { diameter: 0.06 }, this.scene);
    nose.position.set(0, 0.65, 0.6);
    nose.parent = this.mesh;
    nose.material = noseMat;

    // Big floppy ears (cute droopy triangles)
    const earMat = new BABYLON.StandardMaterial('wolfEarMat', this.scene);
    earMat.diffuseColor = new BABYLON.Color3(0.35, 0.25, 0.18);
    earMat.emissiveColor = new BABYLON.Color3(0.05, 0.03, 0.02);
    for (let side = -1; side <= 1; side += 2) {
      const ear = BABYLON.MeshBuilder.CreateBox('wolfEar', {
        width: 0.12, height: 0.2, depth: 0.08
      }, this.scene);
      ear.position.set(side * 0.15, 0.82, 0.25);
      ear.rotation.z = side * 0.4;  // floppy angle outward
      ear.rotation.x = 0.3;         // droop forward
      ear.parent = this.mesh;
      ear.material = earMat;
    }

    // Big sparkly puppy eyes
    const eyeWhiteMat = new BABYLON.StandardMaterial('wolfEyeWhite', this.scene);
    eyeWhiteMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
    eyeWhiteMat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    const eyeMat = new BABYLON.StandardMaterial('wolfEyeMat', this.scene);
    eyeMat.diffuseColor = new BABYLON.Color3(0.3, 0.2, 0.1);
    eyeMat.emissiveColor = new BABYLON.Color3(0.08, 0.05, 0.02);
    const pupilMat = new BABYLON.StandardMaterial('wolfPupilMat', this.scene);
    pupilMat.diffuseColor = new BABYLON.Color3(0.02, 0.02, 0.02);
    pupilMat.emissiveColor = new BABYLON.Color3(0.01, 0.01, 0.01);
    const shineMat = new BABYLON.StandardMaterial('wolfShineMat', this.scene);
    shineMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
    shineMat.emissiveColor = new BABYLON.Color3(0.6, 0.6, 0.6);

    for (let side = -1; side <= 1; side += 2) {
      // Eye white
      const eyeW = BABYLON.MeshBuilder.CreateSphere('wolfEyeW', { diameter: 0.12 }, this.scene);
      eyeW.position.set(side * 0.11, 0.74, 0.48);
      eyeW.parent = this.mesh;
      eyeW.material = eyeWhiteMat;
      // Iris
      const eye = BABYLON.MeshBuilder.CreateSphere('wolfEye', { diameter: 0.08 }, this.scene);
      eye.position.set(side * 0.11, 0.74, 0.53);
      eye.parent = this.mesh;
      eye.material = eyeMat;
      // Pupil
      const pupil = BABYLON.MeshBuilder.CreateSphere('wolfPupil', { diameter: 0.04 }, this.scene);
      pupil.position.set(side * 0.11, 0.74, 0.555);
      pupil.parent = this.mesh;
      pupil.material = pupilMat;
      // Shine highlight (makes eyes look sparkly)
      const shine = BABYLON.MeshBuilder.CreateSphere('wolfShine', { diameter: 0.025 }, this.scene);
      shine.position.set(side * 0.095, 0.76, 0.56);
      shine.parent = this.mesh;
      shine.material = shineMat;
    }

    // Stubby little legs
    const legMat = new BABYLON.StandardMaterial('wolfLegMat', this.scene);
    legMat.diffuseColor = new BABYLON.Color3(0.35, 0.25, 0.18);
    legMat.emissiveColor = new BABYLON.Color3(0.05, 0.03, 0.02);
    const legPositions = [
      [-0.14, 0.28, 0.22], [0.14, 0.28, 0.22],
      [-0.14, 0.28, -0.22], [0.14, 0.28, -0.22],
    ];
    legPositions.forEach(([x, y, z]) => {
      const leg = BABYLON.MeshBuilder.CreateCylinder('wolfLeg', {
        height: 0.35, diameterTop: 0.14, diameterBottom: 0.1, tessellation: 8
      }, this.scene);
      leg.position.set(x, y, z);
      leg.parent = this.mesh;
      leg.material = legMat;
    });

    // Cute little wagging tail (curled up)
    const tail = BABYLON.MeshBuilder.CreateCylinder('wolfTail', {
      height: 0.22, diameterTop: 0.03, diameterBottom: 0.08, tessellation: 6
    }, this.scene);
    tail.position.set(0, 0.55, -0.35);
    tail.rotation.x = Math.PI / 2.5;
    tail.rotation.z = 0.3; // slight curl
    tail.parent = this.mesh;
    tail.material = mat;
    this._tail = tail;

    // Tongue sticking out (pink)
    const tongueMat = new BABYLON.StandardMaterial('wolfTongueMat', this.scene);
    tongueMat.diffuseColor = new BABYLON.Color3(1, 0.45, 0.5);
    tongueMat.emissiveColor = new BABYLON.Color3(0.2, 0.08, 0.1);
    const tongue = BABYLON.MeshBuilder.CreateBox('wolfTongue', {
      width: 0.06, height: 0.02, depth: 0.1
    }, this.scene);
    tongue.position.set(0.02, 0.58, 0.6);
    tongue.rotation.x = 0.3;
    tongue.parent = this.mesh;
    tongue.material = tongueMat;
  }

  _buildDragon(mat, accentMat) {
    // Body
    const body = BABYLON.MeshBuilder.CreateSphere('dragonBody', {
      diameter: 0.6
    }, this.scene);
    body.scaling = new BABYLON.Vector3(1, 0.8, 1.3);
    body.position.y = 1.2;
    body.parent = this.mesh;
    body.material = mat;

    // Head
    const head = BABYLON.MeshBuilder.CreateSphere('dragonHead', {
      diameter: 0.35
    }, this.scene);
    head.position.set(0, 1.4, 0.35);
    head.parent = this.mesh;
    head.material = mat;

    // Snout
    const snout = BABYLON.MeshBuilder.CreateBox('dragonSnout', {
      width: 0.15, height: 0.1, depth: 0.2
    }, this.scene);
    snout.position.set(0, 1.35, 0.55);
    snout.parent = this.mesh;
    snout.material = mat;

    // Eyes (fiery)
    const eyeMat = new BABYLON.StandardMaterial('dragonEyeMat', this.scene);
    eyeMat.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
    eyeMat.emissiveColor = new BABYLON.Color3(0.5, 0.2, 0);
    for (let side = -1; side <= 1; side += 2) {
      const eye = BABYLON.MeshBuilder.CreateSphere('dragonEye', { diameter: 0.06 }, this.scene);
      eye.position.set(side * 0.1, 1.44, 0.48);
      eye.parent = this.mesh;
      eye.material = eyeMat;
    }

    // Horns
    const hornMat = new BABYLON.StandardMaterial('dragonHornMat', this.scene);
    hornMat.diffuseColor = new BABYLON.Color3(0.3, 0.15, 0.05);
    hornMat.emissiveColor = new BABYLON.Color3(0.05, 0.02, 0.01);
    for (let side = -1; side <= 1; side += 2) {
      const horn = BABYLON.MeshBuilder.CreateCylinder('dragonHorn', {
        height: 0.2, diameterTop: 0, diameterBottom: 0.06, tessellation: 6
      }, this.scene);
      horn.position.set(side * 0.12, 1.58, 0.28);
      horn.rotation.z = side * -0.3;
      horn.parent = this.mesh;
      horn.material = hornMat;
    }

    // Wings
    const wingMat = new BABYLON.StandardMaterial('dragonWingMat', this.scene);
    wingMat.diffuseColor = new BABYLON.Color3(0.9, 0.3, 0.05);
    wingMat.emissiveColor = new BABYLON.Color3(0.15, 0.05, 0.01);
    wingMat.backFaceCulling = false;
    for (let side = -1; side <= 1; side += 2) {
      const wing = BABYLON.MeshBuilder.CreatePlane('dragonWing', {
        width: 0.6, height: 0.4
      }, this.scene);
      wing.position.set(side * 0.4, 1.3, -0.1);
      wing.rotation.y = side * 0.5;
      wing.parent = this.mesh;
      wing.material = wingMat;
    }

    // Tail
    const tail = BABYLON.MeshBuilder.CreateCylinder('dragonTail', {
      height: 0.5, diameterTop: 0.04, diameterBottom: 0.12, tessellation: 6
    }, this.scene);
    tail.position.set(0, 1.1, -0.4);
    tail.rotation.x = Math.PI / 3;
    tail.parent = this.mesh;
    tail.material = mat;

    // Belly glow via emissive — no PointLight for performance
  }

  _buildFairy(mat, accentMat) {
    // Tiny glowing body
    const body = BABYLON.MeshBuilder.CreateSphere('fairyBody', {
      diameter: 0.3
    }, this.scene);
    body.position.y = 1.5;
    body.parent = this.mesh;
    body.material = mat;

    // Head
    const head = BABYLON.MeshBuilder.CreateSphere('fairyHead', {
      diameter: 0.2
    }, this.scene);
    head.position.set(0, 1.72, 0);
    head.parent = this.mesh;
    head.material = mat;

    // Wings (4 translucent)
    const wingMat = new BABYLON.StandardMaterial('fairyWingMat', this.scene);
    wingMat.diffuseColor = new BABYLON.Color3(0.5, 1, 0.7);
    wingMat.emissiveColor = new BABYLON.Color3(0.2, 0.5, 0.3);
    wingMat.alpha = 0.5;
    wingMat.backFaceCulling = false;

    for (let side = -1; side <= 1; side += 2) {
      // Upper wing
      const wingU = BABYLON.MeshBuilder.CreateDisc('fairyWingU', {
        radius: 0.2, tessellation: 8
      }, this.scene);
      wingU.position.set(side * 0.22, 1.6, -0.05);
      wingU.rotation.y = side * 0.6;
      wingU.parent = this.mesh;
      wingU.material = wingMat;

      // Lower wing
      const wingL = BABYLON.MeshBuilder.CreateDisc('fairyWingL', {
        radius: 0.15, tessellation: 8
      }, this.scene);
      wingL.position.set(side * 0.2, 1.45, -0.05);
      wingL.rotation.y = side * 0.6;
      wingL.parent = this.mesh;
      wingL.material = wingMat;
    }

    // Fairy glow via emissive — no PointLight for performance

    // Sparkle particles around fairy
    const sparkMat = new BABYLON.StandardMaterial('sparkMat', this.scene);
    sparkMat.diffuseColor = new BABYLON.Color3(0.5, 1, 0.7);
    sparkMat.emissiveColor = new BABYLON.Color3(0.3, 0.6, 0.4);
    this._sparkles = [];
    for (let i = 0; i < 6; i++) {
      const spark = BABYLON.MeshBuilder.CreateSphere('spark', { diameter: 0.05 }, this.scene);
      spark.parent = this.mesh;
      spark.material = sparkMat;
      spark._angle = (i / 6) * Math.PI * 2;
      spark._radius = 0.35;
      spark._speed = 1.5 + Math.random();
      this._sparkles.push(spark);
    }
  }

  _buildGhost(mat, accentMat) {
    // Main body — ghostly tapered shape
    const body = BABYLON.MeshBuilder.CreateSphere('ghostBody', {
      diameter: 0.5
    }, this.scene);
    body.scaling = new BABYLON.Vector3(1, 1.4, 1);
    body.position.y = 1.3;
    body.parent = this.mesh;

    const ghostMat = new BABYLON.StandardMaterial('ghostMat', this.scene);
    ghostMat.diffuseColor = new BABYLON.Color3(0.8, 0.85, 0.95);
    ghostMat.emissiveColor = new BABYLON.Color3(0.2, 0.22, 0.28);
    ghostMat.alpha = 0.7;
    body.material = ghostMat;

    // Tail wisp (bottom taper)
    const tail = BABYLON.MeshBuilder.CreateCylinder('ghostTail', {
      height: 0.3, diameterTop: 0.25, diameterBottom: 0, tessellation: 8
    }, this.scene);
    tail.position.y = 0.9;
    tail.parent = this.mesh;
    tail.material = ghostMat;

    // Eyes (spooky)
    const eyeMat = new BABYLON.StandardMaterial('ghostEyeMat', this.scene);
    eyeMat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1);
    eyeMat.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.5);
    for (let side = -1; side <= 1; side += 2) {
      const eye = BABYLON.MeshBuilder.CreateSphere('ghostEye', { diameter: 0.08 }, this.scene);
      eye.position.set(side * 0.1, 1.4, 0.22);
      eye.parent = this.mesh;
      eye.material = eyeMat;
    }

    // Mouth
    const mouth = BABYLON.MeshBuilder.CreateSphere('ghostMouth', { diameter: 0.08 }, this.scene);
    mouth.scaling = new BABYLON.Vector3(1, 1.5, 0.5);
    mouth.position.set(0, 1.22, 0.22);
    mouth.parent = this.mesh;
    const mouthMat = new BABYLON.StandardMaterial('ghostMouthMat', this.scene);
    mouthMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.15);
    mouthMat.emissiveColor = new BABYLON.Color3(0.02, 0.02, 0.04);
    mouth.material = mouthMat;

    // Ghost glow via emissive — no PointLight for performance
  }

  update(deltaTime, enemyManager, gameState) {
    if (!this.mesh || !this.player || !this.player.mesh) return;

    this.bobTime += deltaTime;

    // Smoothly follow player (offset to the right and slightly behind)
    const playerPos = this.player.mesh.position;
    const targetX = playerPos.x + 2;
    const targetZ = playerPos.z - 1;

    // Floating pets hover higher
    const isFlying = this.type === 'dragon' || this.type === 'fairy' || this.type === 'ghost';
    const baseY = isFlying ? playerPos.y + 1.5 : playerPos.y;
    const bob = Math.sin(this.bobTime * 2.5) * (isFlying ? 0.3 : 0.1);
    const targetY = baseY + bob;

    // Smooth lerp toward target
    const lerpSpeed = this.config.speed * deltaTime;
    this.mesh.position.x += (targetX - this.mesh.position.x) * Math.min(lerpSpeed, 1);
    this.mesh.position.y += (targetY - this.mesh.position.y) * Math.min(lerpSpeed * 1.5, 1);
    this.mesh.position.z += (targetZ - this.mesh.position.z) * Math.min(lerpSpeed, 1);

    // Face the direction of movement / toward player forward
    const dx = playerPos.x - this.mesh.position.x;
    const dz = playerPos.z - this.mesh.position.z;
    if (Math.abs(dx) > 0.1 || Math.abs(dz) > 0.1) {
      this.mesh.rotation.y = Math.atan2(dx, dz);
    }

    // Wag tail for wolf pup
    if (this._tail) {
      this._tail.rotation.z = Math.sin(this.bobTime * 8) * 0.5;
    }

    // Update sparkles for fairy
    if (this._sparkles) {
      this._sparkles.forEach(s => {
        s._angle += s._speed * deltaTime;
        s.position.set(
          Math.cos(s._angle) * s._radius,
          1.5 + Math.sin(s._angle * 1.5) * 0.2,
          Math.sin(s._angle) * s._radius
        );
      });
    }

    // Pet behaviors
    if (this.config.behavior === 'attack') {
      this._updateAttack(deltaTime, enemyManager);
    } else if (this.config.behavior === 'heal') {
      this._updateHeal(deltaTime, gameState);
    } else if (this.config.behavior === 'scare') {
      this._updateScare(deltaTime, enemyManager);
    }

    // Update projectiles (dragon fire)
    this._updateProjectiles(deltaTime, enemyManager);
  }

  _updateAttack(deltaTime, enemyManager) {
    if (!enemyManager) return;
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
      return;
    }

    const enemies = enemyManager.getAliveEnemies();
    let nearest = null;
    let nearestDist = this.config.attackRange;

    enemies.forEach(enemy => {
      if (!enemy.mesh) return;
      const d = BABYLON.Vector3.Distance(this.mesh.position, enemy.mesh.position);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = enemy;
      }
    });

    // Check boss too
    const boss = enemyManager.getActiveBoss();
    if (boss && !boss.dead && boss.mesh) {
      const d = BABYLON.Vector3.Distance(this.mesh.position, boss.mesh.position);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = boss;
      }
    }

    if (nearest) {
      if (this.type === 'dragon') {
        // Shoot fire projectile
        this._shootFire(nearest);
      } else {
        // Wolf direct attack
        const wasDead = nearest.dead;
        nearest.takeDamage(this.config.attackDamage);
        if (!wasDead && nearest.dead) this.petGotKill = true;
      }
      this.attackCooldown = this.config.attackCooldown;
    }
  }

  _shootFire(target) {
    const fireMat = new BABYLON.StandardMaterial('petFireMat', this.scene);
    fireMat.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
    fireMat.emissiveColor = new BABYLON.Color3(0.5, 0.2, 0);

    const ball = BABYLON.MeshBuilder.CreateSphere('petFire', { diameter: 0.2 }, this.scene);
    ball.position = this.mesh.position.clone();
    ball.position.y += 1.3;
    ball.material = fireMat;

    // Pet fire glow via emissive — no PointLight for performance

    const dir = target.mesh.position.subtract(ball.position).normalize();
    this.projectiles.push({
      mesh: ball,
      velocity: dir.scale(15),
      life: 2,
      damage: this.config.attackDamage,
    });
  }

  _updateProjectiles(deltaTime, enemyManager) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= deltaTime;
      if (p.life <= 0 || !p.mesh) {
        if (p.mesh) { if (p.mesh.material) p.mesh.material.dispose(); p.mesh.dispose(); }
        this.projectiles.splice(i, 1);
        continue;
      }
      p.mesh.position.addInPlace(p.velocity.scale(deltaTime));

      // Check hits against enemies
      if (enemyManager) {
        const allTargets = [...enemyManager.getAliveEnemies()];
        const boss = enemyManager.getActiveBoss();
        if (boss && !boss.dead && boss.mesh) allTargets.push(boss);
        for (const enemy of allTargets) {
          if (!enemy.mesh || enemy.dead) continue;
          const d = BABYLON.Vector3.Distance(p.mesh.position, enemy.mesh.position);
          if (d < 1.2) {
            const wasDead = enemy.dead;
            enemy.takeDamage(p.damage);
            if (!wasDead && enemy.dead) this.petGotKill = true;
            // Destroy projectile
            p.life = 0;
            break;
          }
        }
      }
    }
  }

  _updateHeal(deltaTime, gameState) {
    if (!gameState) return;
    if (gameState.health < gameState.maxHealth) {
      gameState.health = Math.min(gameState.maxHealth, gameState.health + this.config.healRate * deltaTime);
    }
  }

  _updateScare(deltaTime, enemyManager) {
    if (!enemyManager) return;
    if (this.scareCooldown > 0) {
      this.scareCooldown -= deltaTime;
      return;
    }

    const enemies = enemyManager.getAliveEnemies();
    let scared = false;

    enemies.forEach(enemy => {
      if (!enemy.mesh || !enemy.mesh.physicsImpostor) return;
      const d = BABYLON.Vector3.Distance(this.mesh.position, enemy.mesh.position);
      if (d < this.config.scareRange) {
        // Push enemy away from ghost
        const away = enemy.mesh.position.subtract(this.mesh.position).normalize();
        const currentVel = enemy.mesh.physicsImpostor.getLinearVelocity();
        enemy.mesh.physicsImpostor.setLinearVelocity(
          new BABYLON.Vector3(away.x * 12, currentVel.y + 3, away.z * 12)
        );
        scared = true;
      }
    });

    if (scared) {
      this.scareCooldown = this.config.scareCooldown;
    }
  }

  dispose() {
    // Clean up projectiles
    this.projectiles.forEach(p => {
      if (p.mesh) { if (p.mesh.material) p.mesh.material.dispose(); p.mesh.dispose(); }
    });
    this.projectiles = [];

    // Clean up sparkles
    if (this._sparkles) {
      this._sparkles.forEach(s => { if (s.material) s.material.dispose(); s.dispose(); });
      this._sparkles = [];
    }

    // Clean up light

    // Dispose all children then the root
    if (this.mesh) {
      this.mesh.getChildMeshes().forEach(c => {
        if (c.material) c.material.dispose();
        c.dispose();
      });
      this.mesh.dispose();
      this.mesh = null;
    }
  }
}
