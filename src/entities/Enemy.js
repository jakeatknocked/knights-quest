import * as BABYLON from '@babylonjs/core';

export class Enemy {
  constructor(scene, position, player) {
    this.scene = scene;
    this.player = player;
    this.health = 150;
    this.maxHealth = 150;
    this.speed = 5 + Math.random() * 3;
    this.attackCooldown = 0;
    this.dead = false;
    this.spawnPosition = position.clone();
    this.patrolAngle = Math.random() * Math.PI * 2;

    // 30% chance to have a gun
    this.hasGun = Math.random() < 0.3;
    this.shootCooldown = 0;
    this.projectiles = [];

    // Awareness — unaware enemies take extra damage (stealth bonus)
    this.aware = false;
    this.chasingPlayer = false;
    this.lastSeenPlayerPos = null;
    this.loseInterestTimer = 0;

    // Elemental status effects
    this.frozen = false;
    this.frozenTimer = 0;
    this.onFire = false;
    this.fireTimer = 0;
    this.fireDamageTimer = 0;
    this.slowed = false;
    this.slowedTimer = 0;
    this.baseSpeed = this.speed;

    // Create enemy mesh
    this.createEnemy(position);
  }

  createEnemy(position) {
    // Create physics collider as main mesh (no parent - fixes physics warning)
    this.mesh = BABYLON.MeshBuilder.CreateCylinder('enemyCollider', {
      height: 2,
      diameter: 0.8
    }, this.scene);
    this.mesh.isVisible = false;

    // Physics on main mesh
    this.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
      this.mesh,
      BABYLON.PhysicsImpostor.CylinderImpostor,
      { mass: 8, friction: 0.5, restitution: 0.1 },
      this.scene
    );

    // Dark blood-red material
    const material = new BABYLON.StandardMaterial('enemyMat', this.scene);
    material.diffuseColor = new BABYLON.Color3(0.7, 0.05, 0.05);
    material.emissiveColor = new BABYLON.Color3(0.2, 0.02, 0.02);
    material.specularColor = new BABYLON.Color3(0.3, 0.1, 0.1);

    // Dark flesh/skin
    const limbMat = new BABYLON.StandardMaterial('enemyLimbMat', this.scene);
    limbMat.diffuseColor = new BABYLON.Color3(0.35, 0.08, 0.08);
    limbMat.emissiveColor = new BABYLON.Color3(0.1, 0.02, 0.02);

    // Black spiked armor
    const armorMat = new BABYLON.StandardMaterial('enemyArmorMat', this.scene);
    armorMat.diffuseColor = new BABYLON.Color3(0.15, 0.05, 0.05);
    armorMat.emissiveColor = new BABYLON.Color3(0.08, 0.02, 0.02);
    armorMat.specularColor = new BABYLON.Color3(0.5, 0.2, 0.2);
    armorMat.specularPower = 64;

    // Glowing evil material (for eyes, runes)
    const glowMat = new BABYLON.StandardMaterial('eGlowMat', this.scene);
    glowMat.diffuseColor = new BABYLON.Color3(1, 0, 0);
    glowMat.emissiveColor = new BABYLON.Color3(0.8, 0, 0);

    // Visual container — offset up so body sits above ground properly
    this.visualRoot = new BABYLON.TransformNode('enemyVisual', this.scene);
    this.visualRoot.parent = this.mesh;
    this.visualRoot.position.y = 0.5;

    // Body (wider, more intimidating)
    const body = BABYLON.MeshBuilder.CreateBox('enemyBody', {
      width: 0.9, height: 1.1, depth: 0.55
    }, this.scene);
    body.position.y = 0.2;
    body.parent = this.visualRoot;
    body.material = material;

    // Spiked chest plate
    const chestPlate = BABYLON.MeshBuilder.CreateBox('eChest', {
      width: 0.95, height: 0.65, depth: 0.35
    }, this.scene);
    chestPlate.position.set(0, 0.4, 0.12);
    chestPlate.parent = this.visualRoot;
    chestPlate.material = armorMat;

    // Chest spikes (3 spikes sticking out)
    for (let i = -1; i <= 1; i++) {
      const spike = BABYLON.MeshBuilder.CreateCylinder('eChestSpike', {
        height: 0.2, diameterTop: 0, diameterBottom: 0.08
      }, this.scene);
      spike.position.set(i * 0.2, 0.45, 0.35);
      spike.rotation.x = -Math.PI / 4;
      spike.parent = this.visualRoot;
      spike.material = armorMat;
    }

    // Head — skull-like (slightly squashed sphere)
    const head = BABYLON.MeshBuilder.CreateSphere('enemyHead', { diameter: 0.65 }, this.scene);
    head.position.y = 1.05;
    head.scaling = new BABYLON.Vector3(1, 0.9, 1);
    head.parent = this.visualRoot;
    head.material = armorMat;

    // HORNS — two curved horns on the helmet
    const hornMat = new BABYLON.StandardMaterial('eHornMat', this.scene);
    hornMat.diffuseColor = new BABYLON.Color3(0.2, 0.05, 0.02);
    hornMat.emissiveColor = new BABYLON.Color3(0.06, 0.02, 0.01);

    const hornL = BABYLON.MeshBuilder.CreateCylinder('eHornL', {
      height: 0.4, diameterTop: 0, diameterBottom: 0.12, tessellation: 8
    }, this.scene);
    hornL.position.set(-0.22, 1.35, -0.05);
    hornL.rotation.z = 0.5;
    hornL.rotation.x = -0.3;
    hornL.parent = this.visualRoot;
    hornL.material = hornMat;

    const hornR = BABYLON.MeshBuilder.CreateCylinder('eHornR', {
      height: 0.4, diameterTop: 0, diameterBottom: 0.12, tessellation: 8
    }, this.scene);
    hornR.position.set(0.22, 1.35, -0.05);
    hornR.rotation.z = -0.5;
    hornR.rotation.x = -0.3;
    hornR.parent = this.visualRoot;
    hornR.material = hornMat;

    // Helmet ridge (central spine on top)
    const ridge = BABYLON.MeshBuilder.CreateBox('eRidge', {
      width: 0.06, height: 0.15, depth: 0.4
    }, this.scene);
    ridge.position.set(0, 1.38, 0);
    ridge.parent = this.visualRoot;
    ridge.material = armorMat;

    // Visor — angry V-shaped slit
    const visorMat = new BABYLON.StandardMaterial('eVisorMat', this.scene);
    visorMat.diffuseColor = new BABYLON.Color3(0.02, 0.01, 0.01);
    visorMat.emissiveColor = new BABYLON.Color3(0.01, 0, 0);
    const visor = BABYLON.MeshBuilder.CreateBox('eVisor', {
      width: 0.5, height: 0.08, depth: 0.08
    }, this.scene);
    visor.position.set(0, 1.05, 0.3);
    visor.parent = this.visualRoot;
    visor.material = visorMat;

    // Glowing evil eyes (bigger, brighter)
    const eyeL = BABYLON.MeshBuilder.CreateSphere('eyeL', { diameter: 0.1 }, this.scene);
    eyeL.position.set(-0.13, 1.06, 0.31);
    eyeL.parent = this.visualRoot;
    eyeL.material = glowMat;

    const eyeR = BABYLON.MeshBuilder.CreateSphere('eyeR', { diameter: 0.1 }, this.scene);
    eyeR.position.set(0.13, 1.06, 0.31);
    eyeR.parent = this.visualRoot;
    eyeR.material = glowMat;

    // Eye glow — use emissive instead of PointLight for performance

    // Spiked shoulder pads (bigger, with spikes)
    const shoulderL = BABYLON.MeshBuilder.CreateSphere('eShoulderL', { diameter: 0.4 }, this.scene);
    shoulderL.position.set(-0.55, 0.7, 0);
    shoulderL.scaling = new BABYLON.Vector3(1, 0.7, 1);
    shoulderL.parent = this.visualRoot;
    shoulderL.material = armorMat;

    // Shoulder spikes
    const spikeLS = BABYLON.MeshBuilder.CreateCylinder('eSpkLS', {
      height: 0.25, diameterTop: 0, diameterBottom: 0.08
    }, this.scene);
    spikeLS.position.set(-0.6, 0.9, 0);
    spikeLS.parent = this.visualRoot;
    spikeLS.material = armorMat;

    const shoulderR = BABYLON.MeshBuilder.CreateSphere('eShoulderR', { diameter: 0.4 }, this.scene);
    shoulderR.position.set(0.55, 0.7, 0);
    shoulderR.scaling = new BABYLON.Vector3(1, 0.7, 1);
    shoulderR.parent = this.visualRoot;
    shoulderR.material = armorMat;

    const spikeRS = BABYLON.MeshBuilder.CreateCylinder('eSpkRS', {
      height: 0.25, diameterTop: 0, diameterBottom: 0.08
    }, this.scene);
    spikeRS.position.set(0.6, 0.9, 0);
    spikeRS.parent = this.visualRoot;
    spikeRS.material = armorMat;

    // Left arm (bulkier)
    const armL = BABYLON.MeshBuilder.CreateBox('eArmL', {
      width: 0.28, height: 0.85, depth: 0.28
    }, this.scene);
    armL.position.set(-0.55, 0.15, 0);
    armL.parent = this.visualRoot;
    armL.material = armorMat;

    // Claw on left hand
    for (let i = -1; i <= 1; i++) {
      const claw = BABYLON.MeshBuilder.CreateCylinder('eClawL', {
        height: 0.15, diameterTop: 0, diameterBottom: 0.04
      }, this.scene);
      claw.position.set(-0.55 + i * 0.06, -0.18, 0.1);
      claw.rotation.x = -Math.PI / 3;
      claw.parent = this.visualRoot;
      claw.material = hornMat;
    }

    // Right arm (bulkier)
    const armR = BABYLON.MeshBuilder.CreateBox('eArmR', {
      width: 0.28, height: 0.85, depth: 0.28
    }, this.scene);
    armR.position.set(0.55, 0.15, 0);
    armR.parent = this.visualRoot;
    armR.material = armorMat;

    // Claw on right hand
    for (let i = -1; i <= 1; i++) {
      const claw = BABYLON.MeshBuilder.CreateCylinder('eClawR', {
        height: 0.15, diameterTop: 0, diameterBottom: 0.04
      }, this.scene);
      claw.position.set(0.55 + i * 0.06, -0.18, 0.1);
      claw.rotation.x = -Math.PI / 3;
      claw.parent = this.visualRoot;
      claw.material = hornMat;
    }

    // Left leg (armored, thicker)
    const legL = BABYLON.MeshBuilder.CreateBox('eLegL', {
      width: 0.32, height: 0.75, depth: 0.32
    }, this.scene);
    legL.position.set(-0.2, -0.55, 0);
    legL.parent = this.visualRoot;
    legL.material = armorMat;

    // Knee spikes
    const kneeL = BABYLON.MeshBuilder.CreateCylinder('eKneeL', {
      height: 0.12, diameterTop: 0, diameterBottom: 0.06
    }, this.scene);
    kneeL.position.set(-0.2, -0.4, 0.18);
    kneeL.rotation.x = -Math.PI / 4;
    kneeL.parent = this.visualRoot;
    kneeL.material = armorMat;

    // Right leg
    const legR = BABYLON.MeshBuilder.CreateBox('eLegR', {
      width: 0.32, height: 0.75, depth: 0.32
    }, this.scene);
    legR.position.set(0.2, -0.55, 0);
    legR.parent = this.visualRoot;
    legR.material = armorMat;

    const kneeR = BABYLON.MeshBuilder.CreateCylinder('eKneeR', {
      height: 0.12, diameterTop: 0, diameterBottom: 0.06
    }, this.scene);
    kneeR.position.set(0.2, -0.4, 0.18);
    kneeR.rotation.x = -Math.PI / 4;
    kneeR.parent = this.visualRoot;
    kneeR.material = armorMat;

    // Glowing rune on chest (scary symbol)
    const rune = BABYLON.MeshBuilder.CreateBox('eRune', {
      width: 0.15, height: 0.15, depth: 0.01
    }, this.scene);
    rune.position.set(0, 0.45, 0.32);
    rune.rotation.z = Math.PI / 4; // diamond shape
    rune.parent = this.visualRoot;
    rune.material = glowMat;

    // Shield on left arm (non-gun enemies) — spiked shield
    if (!this.hasGun) {
      const shield = BABYLON.MeshBuilder.CreateBox('eShield', {
        width: 0.06, height: 0.55, depth: 0.45
      }, this.scene);
      shield.position.set(-0.7, 0.25, 0.1);
      shield.parent = this.visualRoot;
      shield.material = material;

      // Shield spike
      const shieldSpike = BABYLON.MeshBuilder.CreateCylinder('eShieldSpk', {
        height: 0.25, diameterTop: 0, diameterBottom: 0.1
      }, this.scene);
      shieldSpike.position.set(-0.78, 0.25, 0.1);
      shieldSpike.rotation.z = Math.PI / 2;
      shieldSpike.parent = this.visualRoot;
      shieldSpike.material = armorMat;
    }

    // Gun mesh (if this enemy has a gun) — bigger, meaner
    if (this.hasGun) {
      const gun = BABYLON.MeshBuilder.CreateBox('eGun', {
        width: 0.14, height: 0.14, depth: 0.55
      }, this.scene);
      gun.position.set(0.5, 0.2, 0.25);
      gun.parent = this.visualRoot;
      const gunMat = new BABYLON.StandardMaterial('eGunMat', this.scene);
      gunMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15);
      gunMat.emissiveColor = new BABYLON.Color3(0.04, 0.04, 0.04);
      gun.material = gunMat;

      // Gun barrel glow
      const gunTip = BABYLON.MeshBuilder.CreateSphere('eGunTip', { diameter: 0.08 }, this.scene);
      gunTip.position.set(0.5, 0.2, 0.55);
      gunTip.parent = this.visualRoot;
      gunTip.material = glowMat;
    }

    // Position enemy (spawn above ground so physics can settle)
    this.mesh.position = position.clone();
    this.mesh.position.y = 3.0;

    if (this.mesh.physicsImpostor.physicsBody) {
      this.mesh.physicsImpostor.physicsBody.fixedRotation = true;
      this.mesh.physicsImpostor.physicsBody.updateMassProperties();
      this.mesh.physicsImpostor.physicsBody.angularDamping = 1.0;
      this.mesh.physicsImpostor.physicsBody.linearDamping = 0.95;
    }

    // Health bar
    this.createHealthBar();
  }

  createHealthBar() {
    const barBg = BABYLON.MeshBuilder.CreatePlane('healthBarBg', {
      width: 1.2,
      height: 0.15
    }, this.scene);
    barBg.position.y = 1.5;
    barBg.parent = this.visualRoot;
    barBg.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    const bgMat = new BABYLON.StandardMaterial('healthBarBgMat', this.scene);
    bgMat.diffuseColor = new BABYLON.Color3(0.2, 0, 0);
    barBg.material = bgMat;

    this.healthBar = BABYLON.MeshBuilder.CreatePlane('healthBar', {
      width: 1.1,
      height: 0.1
    }, this.scene);
    this.healthBar.position.y = 1.5;
    this.healthBar.position.z = -0.01;
    this.healthBar.parent = this.visualRoot;
    this.healthBar.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    const barMat = new BABYLON.StandardMaterial('healthBarMat', this.scene);
    barMat.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
    this.healthBar.material = barMat;
  }

  update(deltaTime, game) {
    if (this.dead || !this.mesh || !this.mesh.physicsImpostor || !this.mesh.physicsImpostor.physicsBody) return;
    if (!this.player || !this.player.mesh) return;

    // Update status effects (fire damage, freeze timer, slow timer)
    this.updateStatusEffects(deltaTime);
    if (this.dead) return;

    // Frozen enemies can't do anything
    if (this.frozen) {
      this.mesh.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
      this.updateProjectiles(deltaTime, game);
      return;
    }

    // Decrement cooldowns
    if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
    if (this.shootCooldown > 0) this.shootCooldown -= deltaTime;

    const currentVel = this.mesh.physicsImpostor.getLinearVelocity();
    const distToPlayer = BABYLON.Vector3.Distance(this.mesh.position, this.player.mesh.position);

    // Detection: can see player within 50 units, or hear them within 15
    const canSeePlayer = distToPlayer < 50 && this._hasLineOfSight();
    const canHearPlayer = distToPlayer < 15;

    // Start chasing if player detected or alerted
    if (canSeePlayer || canHearPlayer || this.alerted) {
      this.aware = true;
      this.chasingPlayer = true;
      this.lastSeenPlayerPos = this.player.mesh.position.clone();
      this.loseInterestTimer = 8; // Keep chasing for 8s after losing sight
    }

    // Count down lose-interest timer when can't see player
    if (this.chasingPlayer && !canSeePlayer && !canHearPlayer && !this.alerted) {
      this.loseInterestTimer -= deltaTime;
      if (this.loseInterestTimer <= 0) {
        this.chasingPlayer = false;
        this.aware = false;
      }
    }

    if (this.chasingPlayer) {
      // Chase player (or last known position)
      const target = (canSeePlayer || canHearPlayer)
        ? this.player.mesh.position
        : this.lastSeenPlayerPos;

      const direction = target.subtract(this.mesh.position);
      direction.y = 0;
      if (direction.length() > 0.01) direction.normalize();
      else return;

      // Run faster when chasing
      const chaseSpeed = this.speed * 1.3;

      this.mesh.physicsImpostor.setLinearVelocity(
        new BABYLON.Vector3(
          direction.x * chaseSpeed,
          currentVel.y,
          direction.z * chaseSpeed
        )
      );

      // Face player
      const lookTarget = target.clone();
      lookTarget.y = this.mesh.position.y;
      this.mesh.lookAt(lookTarget);

      // Melee attack when in range
      if (distToPlayer < 2.5 && this.attackCooldown <= 0 && game) {
        game.damagePlayer(10);
        this.attackCooldown = 1.2;
      }

      // Ranged attack (gun enemies) — further range when aware
      if (this.hasGun && distToPlayer > 5 && distToPlayer < 35 && this.shootCooldown <= 0) {
        this.fireProjectile();
        this.shootCooldown = 1.5 + Math.random();
      }
    } else {
      // Patrol in circle around spawn point
      this.patrolAngle += deltaTime * 0.5;
      const patrolX = this.spawnPosition.x + Math.cos(this.patrolAngle) * 5;
      const patrolZ = this.spawnPosition.z + Math.sin(this.patrolAngle) * 5;
      const patrolDir = new BABYLON.Vector3(patrolX - this.mesh.position.x, 0, patrolZ - this.mesh.position.z);
      if (patrolDir.length() > 0.01) patrolDir.normalize();
      else return;

      this.mesh.physicsImpostor.setLinearVelocity(
        new BABYLON.Vector3(
          patrolDir.x * this.speed * 0.5,
          currentVel.y,
          patrolDir.z * this.speed * 0.5
        )
      );
    }

    // Update health bar scale
    if (this.healthBar) {
      const healthPct = this.health / this.maxHealth;
      this.healthBar.scaling.x = healthPct;
      this.healthBar.position.x = -(1 - healthPct) * 0.55;
    }

    // Update projectiles
    this.updateProjectiles(deltaTime, game);
  }

  fireProjectile() {
    if (!this.mesh || !this.player || !this.player.mesh) return;

    const proj = BABYLON.MeshBuilder.CreateSphere('eProj', { diameter: 0.3 }, this.scene);
    proj.position = this.mesh.position.clone();
    proj.position.y += 1.2;

    const mat = new BABYLON.StandardMaterial('eProjMat', this.scene);
    mat.diffuseColor = new BABYLON.Color3(1, 0.3, 0);
    mat.emissiveColor = new BABYLON.Color3(0.3, 0.08, 0);
    proj.material = mat;

    const direction = this.player.mesh.position.subtract(this.mesh.position);
    direction.y = 0;
    if (direction.length() > 0.01) direction.normalize();
    else return;

    this.projectiles.push({
      mesh: proj,
      velocity: direction.scale(12),
      lifetime: 3.0,
    });
  }

  updateProjectiles(deltaTime, game) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p.mesh) { this.projectiles.splice(i, 1); continue; }

      p.lifetime -= deltaTime;
      if (p.lifetime <= 0) {
        if (p.mesh.material) p.mesh.material.dispose();
        p.mesh.dispose();
        this.projectiles.splice(i, 1);
        continue;
      }

      p.mesh.position.addInPlace(p.velocity.scale(deltaTime));

      // Hit wall — destroy projectile
      const dir = p.velocity.clone();
      if (dir.length() > 0.01) {
        dir.normalize();
        const ray = new BABYLON.Ray(p.mesh.position, dir, 0.5);
        const wallHit = this.scene.pickWithRay(ray, (mesh) => {
          return mesh.name !== 'eProj' &&
            mesh.name !== 'projectile' &&
            mesh.name !== 'particle' &&
            mesh.name !== 'flash' &&
            mesh !== this.mesh &&
            !mesh.isDescendantOf(this.mesh) &&
            mesh !== this.player.mesh &&
            !mesh.isDescendantOf(this.player.mesh);
        });
        if (wallHit && wallHit.hit) {
          if (p.mesh.material) p.mesh.material.dispose();
          p.mesh.dispose();
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Hit player
      if (game && this.player && this.player.mesh) {
        const dist = BABYLON.Vector3.Distance(p.mesh.position, this.player.mesh.position);
        if (dist < 1.5) {
          game.damagePlayer(8);
          if (p.mesh.material) p.mesh.material.dispose();
          p.mesh.dispose();
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  _hasLineOfSight() {
    if (!this.mesh || !this.player || !this.player.mesh) return false;

    const origin = this.mesh.position.clone();
    origin.y += 1.0; // Eye height
    const target = this.player.mesh.position.clone();
    target.y += 1.0;

    const dir = target.subtract(origin);
    const dist = dir.length();
    if (dist < 0.1) return true;
    dir.normalize();

    const ray = new BABYLON.Ray(origin, dir, dist);
    const hit = this.scene.pickWithRay(ray, (mesh) => {
      // Only block line of sight with world geometry (static physics objects)
      return mesh.physicsImpostor &&
        mesh.physicsImpostor.mass === 0 &&
        mesh !== this.mesh &&
        mesh !== this.player.mesh &&
        !mesh.isDescendantOf(this.mesh) &&
        !mesh.isDescendantOf(this.player.mesh);
    });

    // If nothing blocks the view, we can see the player
    return !hit || !hit.hit;
  }

  applyElementEffect(element) {
    if (this.dead || !this.mesh) return;
    if (element === 'ice') {
      // Freeze for 5 seconds — enemy can't move
      this.frozen = true;
      this.frozenTimer = 5;
      this.speed = 0;
      // Turn enemy blue
      this._setTint(new BABYLON.Color3(0.3, 0.6, 1));
    } else if (element === 'fire') {
      // Set on fire — burns for 4 seconds doing damage over time
      this.onFire = true;
      this.fireTimer = 4;
      this.fireDamageTimer = 0;
      // Turn enemy orange
      this._setTint(new BABYLON.Color3(1, 0.4, 0));
    } else if (element === 'lightning') {
      // Slow down for 6 seconds
      this.slowed = true;
      this.slowedTimer = 6;
      this.speed = this.baseSpeed * 0.3;
      // Turn enemy yellow
      this._setTint(new BABYLON.Color3(1, 1, 0.2));
    }
  }

  _setTint(color) {
    if (!this.mesh || this.dead) return;
    try {
      this.mesh.getChildMeshes().forEach(child => {
        if (child.material && child.material.emissiveColor) {
          child.material.emissiveColor = new BABYLON.Color3(color.r * 0.4, color.g * 0.4, color.b * 0.4);
        }
      });
    } catch (e) { /* mesh disposed */ }
  }

  _clearTint() {
    if (!this.mesh || this.dead) return;
    try {
      this.mesh.getChildMeshes().forEach(child => {
        if (child.material && child.material.emissiveColor) {
          child.material.emissiveColor = new BABYLON.Color3(0.06, 0.02, 0.02);
        }
      });
    } catch (e) { /* mesh disposed */ }
  }

  updateStatusEffects(deltaTime) {
    // Frozen
    if (this.frozen) {
      this.frozenTimer -= deltaTime;
      if (this.frozenTimer <= 0) {
        this.frozen = false;
        this.speed = this.slowed ? this.baseSpeed * 0.3 : this.baseSpeed;
        if (!this.onFire && !this.slowed) this._clearTint();
      }
    }

    // On fire — deal 5 damage per second
    if (this.onFire) {
      this.fireTimer -= deltaTime;
      this.fireDamageTimer -= deltaTime;
      if (this.fireDamageTimer <= 0) {
        this.fireDamageTimer = 0.5;
        this.health -= 5;
        if (this.health <= 0) {
          this.die();
          return;
        }
      }
      if (this.fireTimer <= 0) {
        this.onFire = false;
        if (!this.frozen && !this.slowed) this._clearTint();
      }
    }

    // Slowed
    if (this.slowed) {
      this.slowedTimer -= deltaTime;
      if (this.slowedTimer <= 0) {
        this.slowed = false;
        if (!this.frozen) this.speed = this.baseSpeed;
        if (!this.frozen && !this.onFire) this._clearTint();
      }
    }
  }

  takeDamage(amount, element) {
    if (this.dead) return;
    this.health -= amount;
    // Getting hit always alerts the enemy
    this.aware = true;
    this.chasingPlayer = true;
    this.loseInterestTimer = 10;
    if (this.player && this.player.mesh) {
      this.lastSeenPlayerPos = this.player.mesh.position.clone();
    }
    if (this.health <= 0) {
      this.die();
      return;
    }
    // Apply elemental effect only if still alive
    if (element) {
      this.applyElementEffect(element);
    }
  }

  die() {
    this.dead = true;
    // Clean up projectiles
    if (this.projectiles) {
      this.projectiles.forEach(p => {
        if (p.mesh) {
          if (p.mesh.material) p.mesh.material.dispose();
          p.mesh.dispose();
        }
      });
      this.projectiles = [];
    }
    if (this.eyeLight) {
      this.eyeLight.dispose();
      this.eyeLight = null;
    }
    if (this.mesh) {
      this.deathPosition = this.mesh.position.clone();
      this.mesh.getChildMeshes().forEach(child => {
        if (child.material) child.material.dispose();
        child.dispose();
      });
      if (this.healthBar && this.healthBar.material) {
        this.healthBar.material.dispose();
      }
      if (this.mesh.physicsImpostor) {
        this.mesh.physicsImpostor.dispose();
      }
      this.mesh.dispose();
      this.mesh = null;
    }
    this.healthBar = null;
  }
}
