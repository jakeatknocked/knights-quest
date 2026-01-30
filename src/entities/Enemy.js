import * as BABYLON from '@babylonjs/core';

export class Enemy {
  constructor(scene, position, player) {
    this.scene = scene;
    this.player = player;
    this.health = 40;
    this.maxHealth = 40;
    this.speed = 2.5 + Math.random() * 1.5;
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

    // Red enemy material — vibrant crimson
    const material = new BABYLON.StandardMaterial('enemyMat', this.scene);
    material.diffuseColor = new BABYLON.Color3(0.9, 0.1, 0.1);
    material.emissiveColor = new BABYLON.Color3(0.18, 0.02, 0.02);
    material.specularColor = new BABYLON.Color3(0.3, 0.1, 0.1);

    // Dark limb material
    const limbMat = new BABYLON.StandardMaterial('enemyLimbMat', this.scene);
    limbMat.diffuseColor = new BABYLON.Color3(0.5, 0.1, 0.1);
    limbMat.emissiveColor = new BABYLON.Color3(0.08, 0.02, 0.02);

    // Enemy armor material (dark metal)
    const armorMat = new BABYLON.StandardMaterial('enemyArmorMat', this.scene);
    armorMat.diffuseColor = new BABYLON.Color3(0.3, 0.08, 0.08);
    armorMat.emissiveColor = new BABYLON.Color3(0.06, 0.02, 0.02);
    armorMat.specularColor = new BABYLON.Color3(0.4, 0.2, 0.2);
    armorMat.specularPower = 64;

    // Body
    const body = BABYLON.MeshBuilder.CreateBox('enemyBody', {
      width: 0.8, height: 1.0, depth: 0.5
    }, this.scene);
    body.position.y = 0.2;
    body.parent = this.mesh;
    body.material = material;

    // Chest plate
    const chestPlate = BABYLON.MeshBuilder.CreateBox('eChest', {
      width: 0.85, height: 0.6, depth: 0.3
    }, this.scene);
    chestPlate.position.set(0, 0.4, 0.12);
    chestPlate.parent = this.mesh;
    chestPlate.material = armorMat;

    // Head (helmet)
    const head = BABYLON.MeshBuilder.CreateSphere('enemyHead', { diameter: 0.6 }, this.scene);
    head.position.y = 1.0;
    head.parent = this.mesh;
    head.material = armorMat;

    // Helmet top spike
    const helmetSpike = BABYLON.MeshBuilder.CreateCylinder('eHelmetSpike', {
      height: 0.25, diameterTop: 0, diameterBottom: 0.15
    }, this.scene);
    helmetSpike.position.y = 1.4;
    helmetSpike.parent = this.mesh;
    helmetSpike.material = armorMat;

    // Visor (dark slit with glowing eyes behind)
    const visorMat = new BABYLON.StandardMaterial('eVisorMat', this.scene);
    visorMat.diffuseColor = new BABYLON.Color3(0.05, 0.02, 0.02);
    visorMat.emissiveColor = new BABYLON.Color3(0.02, 0, 0);
    const visor = BABYLON.MeshBuilder.CreateBox('eVisor', {
      width: 0.45, height: 0.1, depth: 0.08
    }, this.scene);
    visor.position.set(0, 1.02, 0.28);
    visor.parent = this.mesh;
    visor.material = visorMat;

    // Glowing red eyes (behind visor)
    const eyeMat = new BABYLON.StandardMaterial('eyeMat', this.scene);
    eyeMat.diffuseColor = new BABYLON.Color3(1, 0, 0);
    eyeMat.emissiveColor = new BABYLON.Color3(0.5, 0, 0);

    const eyeL = BABYLON.MeshBuilder.CreateSphere('eyeL', { diameter: 0.08 }, this.scene);
    eyeL.position.set(-0.12, 1.03, 0.3);
    eyeL.parent = this.mesh;
    eyeL.material = eyeMat;

    const eyeR = BABYLON.MeshBuilder.CreateSphere('eyeR', { diameter: 0.08 }, this.scene);
    eyeR.position.set(0.12, 1.03, 0.3);
    eyeR.parent = this.mesh;
    eyeR.material = eyeMat;

    // Shoulder pads
    const shoulderL = BABYLON.MeshBuilder.CreateSphere('eShoulderL', { diameter: 0.3 }, this.scene);
    shoulderL.position.set(-0.5, 0.65, 0);
    shoulderL.scaling = new BABYLON.Vector3(1, 0.7, 1);
    shoulderL.parent = this.mesh;
    shoulderL.material = armorMat;

    const shoulderR = BABYLON.MeshBuilder.CreateSphere('eShoulderR', { diameter: 0.3 }, this.scene);
    shoulderR.position.set(0.5, 0.65, 0);
    shoulderR.scaling = new BABYLON.Vector3(1, 0.7, 1);
    shoulderR.parent = this.mesh;
    shoulderR.material = armorMat;

    // Left arm (armored)
    const armL = BABYLON.MeshBuilder.CreateBox('eArmL', {
      width: 0.25, height: 0.8, depth: 0.25
    }, this.scene);
    armL.position.set(-0.525, 0.2, 0);
    armL.parent = this.mesh;
    armL.material = armorMat;

    // Right arm (armored)
    const armR = BABYLON.MeshBuilder.CreateBox('eArmR', {
      width: 0.25, height: 0.8, depth: 0.25
    }, this.scene);
    armR.position.set(0.525, 0.2, 0);
    armR.parent = this.mesh;
    armR.material = armorMat;

    // Left leg (armored)
    const legL = BABYLON.MeshBuilder.CreateBox('eLegL', {
      width: 0.3, height: 0.7, depth: 0.3
    }, this.scene);
    legL.position.set(-0.2, -0.55, 0);
    legL.parent = this.mesh;
    legL.material = armorMat;

    // Right leg (armored)
    const legR = BABYLON.MeshBuilder.CreateBox('eLegR', {
      width: 0.3, height: 0.7, depth: 0.3
    }, this.scene);
    legR.position.set(0.2, -0.55, 0);
    legR.parent = this.mesh;
    legR.material = armorMat;

    // Shield on left arm (non-gun enemies)
    if (!this.hasGun) {
      const shield = BABYLON.MeshBuilder.CreateBox('eShield', {
        width: 0.05, height: 0.5, depth: 0.4
      }, this.scene);
      shield.position.set(-0.65, 0.25, 0.1);
      shield.parent = this.mesh;
      shield.material = material;
    }

    // Gun mesh (if this enemy has a gun)
    if (this.hasGun) {
      const gun = BABYLON.MeshBuilder.CreateBox('eGun', {
        width: 0.12, height: 0.12, depth: 0.5
      }, this.scene);
      gun.position.set(0.45, 0.2, 0.2);
      gun.parent = this.mesh;
      const gunMat = new BABYLON.StandardMaterial('eGunMat', this.scene);
      gunMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
      gunMat.emissiveColor = new BABYLON.Color3(0.04, 0.04, 0.04);
      gun.material = gunMat;
    }

    // Position enemy
    this.mesh.position = position.clone();
    this.mesh.position.y = 2.0;

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
    barBg.parent = this.mesh;
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
    this.healthBar.parent = this.mesh;
    this.healthBar.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    const barMat = new BABYLON.StandardMaterial('healthBarMat', this.scene);
    barMat.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
    this.healthBar.material = barMat;
  }

  update(deltaTime, game) {
    if (this.dead || !this.mesh || !this.mesh.physicsImpostor || !this.mesh.physicsImpostor.physicsBody) return;
    if (!this.player || !this.player.mesh) return;

    // Decrement cooldowns
    if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
    if (this.shootCooldown > 0) this.shootCooldown -= deltaTime;

    const currentVel = this.mesh.physicsImpostor.getLinearVelocity();
    const distToPlayer = BABYLON.Vector3.Distance(this.mesh.position, this.player.mesh.position);

    // Always chase when alerted (e.g. last enemies remaining)
    if (distToPlayer < 25 || this.alerted) {
      this.aware = true;
      // Chase player
      const direction = this.player.mesh.position.subtract(this.mesh.position);
      direction.y = 0;
      if (direction.length() > 0.01) direction.normalize();
      else return;

      this.mesh.physicsImpostor.setLinearVelocity(
        new BABYLON.Vector3(
          direction.x * this.speed,
          currentVel.y,
          direction.z * this.speed
        )
      );

      // Face player
      const lookTarget = this.player.mesh.position.clone();
      lookTarget.y = this.mesh.position.y;
      this.mesh.lookAt(lookTarget);

      // Melee attack when in range
      if (distToPlayer < 2.5 && this.attackCooldown <= 0 && game) {
        game.damagePlayer(10);
        this.attackCooldown = 1.2;
      }

      // Ranged attack (gun enemies)
      if (this.hasGun && distToPlayer > 5 && distToPlayer < 20 && this.shootCooldown <= 0) {
        this.fireProjectile();
        this.shootCooldown = 2.0 + Math.random();
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

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
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
