import * as BABYLON from '@babylonjs/core';
import { Projectile } from '../entities/Projectile.js';

export class CombatSystem {
  constructor(scene, player, enemyManager, gameState) {
    this.scene = scene;
    this.player = player;
    this.enemyManager = enemyManager;
    this.gameState = gameState;
    this.camera = null;
    this.projectiles = [];
    this.soundManager = null; // Will be set by Game

    // Cooldowns
    this.swordCooldown = 0;
    this.gunCooldown = 0;

    // Magazine system
    this.magazineSize = 10;
    this.currentMagazine = 10;
    this.isReloading = false;
    this.reloadTime = 2.0; // 2 seconds to reload
    this.reloadTimer = 0;
  }

  update(deltaTime, inputManager, shieldActive) {
    // Update cooldowns
    if (this.swordCooldown > 0) this.swordCooldown -= deltaTime;
    if (this.gunCooldown > 0) this.gunCooldown -= deltaTime;

    // Handle reloading
    if (this.isReloading) {
      this.reloadTimer -= deltaTime;
      if (this.reloadTimer <= 0) {
        this.finishReload();
      }
    }

    // Always update projectiles (even while shielded)
    this.updateProjectiles(deltaTime);

    // Block new attacks while shield is active
    if (shieldActive) return;

    // Check for reload input (R key)
    if (inputManager.isKeyDown('r') && !this.isReloading) {
      this.startReload();
    }

    // Check for combat input
    if (inputManager.isKeyDown('mouseleft') && this.swordCooldown <= 0) {
      this.swordAttack();
    }

    if (inputManager.isKeyDown('mouseright') && this.gunCooldown <= 0 && !this.isReloading) {
      this.gunShoot();
    }
  }

  swordAttack() {
    this.swordCooldown = 0.5;

    // Use camera aim direction, flattened to XZ for melee
    const forward = this.getAimDirection();
    forward.y = 0;
    if (forward.length() < 0.01) return;
    forward.normalize();
    const attackRange = 3;

    // Check for hits on enemies
    this.enemyManager.getAliveEnemies().forEach(enemy => {
      if (!enemy.mesh) return;
      const dist = BABYLON.Vector3.Distance(this.player.mesh.position, enemy.mesh.position);

      if (dist < attackRange) {
        const toEnemy = enemy.mesh.position.subtract(this.player.mesh.position);
        if (toEnemy.length() < 0.01) return;
        toEnemy.normalize();
        const dot = BABYLON.Vector3.Dot(forward, toEnemy);

        if (dot > 0.3) {
          const stealth = enemy.aware ? 1 : 3;
          enemy.takeDamage(25 * (this.gameState.damageMultiplier || 1) * stealth);
          this.createHitEffect(enemy.mesh.position.clone());
        }
      }
    });

    // Check for hits on boss
    const boss = this.enemyManager.getActiveBoss();
    if (boss && !boss.dead && boss.mesh) {
      const dist = BABYLON.Vector3.Distance(this.player.mesh.position, boss.mesh.position);
      if (dist < attackRange + 1) {
        const toBoss = boss.mesh.position.subtract(this.player.mesh.position);
        if (toBoss.length() < 0.01) return;
        toBoss.normalize();
        const dot = BABYLON.Vector3.Dot(forward, toBoss);
        if (dot > 0.3) {
          boss.takeDamage(25 * (this.gameState.damageMultiplier || 1));
          this.createHitEffect(boss.mesh.position.clone());
        }
      }
    }
  }

  getAimDirection() {
    if (!this.camera) return this.player.forwardVector.clone();

    // Cast a ray from the camera through screen center (crosshair)
    const ray = this.scene.createPickingRay(
      this.scene.getEngine().getRenderWidth() / 2,
      this.scene.getEngine().getRenderHeight() / 2,
      BABYLON.Matrix.Identity(),
      this.camera
    );

    // Pick the scene to find what the crosshair is pointing at
    const hit = this.scene.pickWithRay(ray, (mesh) => {
      // Ignore player, projectiles, particles, HUD elements
      return mesh !== this.player.mesh &&
        !mesh.isDescendantOf(this.player.mesh) &&
        mesh.name !== 'projectile' &&
        mesh.name !== 'particle' &&
        mesh.name !== 'flash';
    });

    const startPos = this.player.mesh.position.clone();
    startPos.y += 1.5;

    let targetPoint;
    if (hit && hit.hit) {
      targetPoint = hit.pickedPoint;
    } else {
      // Nothing hit — aim at a far point along the ray
      targetPoint = ray.origin.add(ray.direction.scale(100));
    }

    const direction = targetPoint.subtract(startPos);
    if (direction.length() < 0.01) return this.player.forwardVector.clone();
    direction.normalize();
    return direction;
  }

  gunShoot() {
    const element = this.gameState.selectedElement;
    // Check both magazine and total ammo
    if (this.gameState.ammo[element] <= 0 || this.currentMagazine <= 0) {
      // Auto-reload if out of magazine ammo but have total ammo
      if (this.currentMagazine <= 0 && this.gameState.ammo[element] > 0) {
        this.startReload();
      }
      return;
    }

    this.gunCooldown = 0.35;
    this.currentMagazine--;
    this.gameState.ammo[element]--;

    const forward = this.getAimDirection();

    const startPos = this.player.mesh.position.clone();
    startPos.y += 1.5;
    startPos.addInPlace(forward.scale(1));

    const projectile = new Projectile(
      this.scene,
      startPos,
      forward,
      element,
      false
    );

    this.projectiles.push(projectile);
    this.createMuzzleFlash(startPos);
  }

  startReload() {
    const element = this.gameState.selectedElement;
    // Can't reload if magazine is full or no ammo left
    if (this.currentMagazine >= this.magazineSize || this.gameState.ammo[element] <= 0) {
      return;
    }

    this.isReloading = true;
    this.reloadTimer = this.reloadTime;

    // Play reload sound
    if (this.soundManager) {
      this.soundManager.play('reload');
    }

    // Show reload indicator
    this.showReloadIndicator();
  }

  showReloadIndicator() {
    const indicator = document.getElementById('reload-indicator');
    if (indicator) {
      indicator.style.display = 'block';
    }
  }

  hideReloadIndicator() {
    const indicator = document.getElementById('reload-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  finishReload() {
    const element = this.gameState.selectedElement;
    const ammoNeeded = this.magazineSize - this.currentMagazine;
    const ammoAvailable = this.gameState.ammo[element];

    // Refill magazine from total ammo
    const ammoToLoad = Math.min(ammoNeeded, ammoAvailable);
    this.currentMagazine += ammoToLoad;

    this.isReloading = false;
    this.reloadTimer = 0;

    // Hide reload indicator
    this.hideReloadIndicator();
  }

  updateProjectiles(deltaTime) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      if (proj.dead) continue;
      proj.update(deltaTime);
      if (!proj.dead && !proj.isEnemy) {
        this.checkProjectileEnemyCollision(proj);
      }
    }

    // Remove dead projectiles
    this.projectiles = this.projectiles.filter(p => !p.dead);
  }

  checkProjectileEnemyCollision(projectile) {
    if (projectile.dead || !projectile.mesh) return;

    this.enemyManager.getAliveEnemies().forEach(enemy => {
      if (projectile.dead || !enemy.mesh) return;
      const dist = BABYLON.Vector3.Distance(projectile.mesh.position, enemy.mesh.position);

      if (dist < 1.5) {
        const hitPos = projectile.mesh.position.clone();
        // Headshot: projectile hits near head height (enemy.mesh.position.y + 1.0)
        const headY = enemy.mesh.position.y + 1.0;
        const isHeadshot = Math.abs(projectile.mesh.position.y - headY) < 0.4;
        const stealth = enemy.aware ? 1 : 3;
        const multiplier = (this.gameState.damageMultiplier || 1) * (isHeadshot ? 2.0 : 1.0) * stealth;
        enemy.takeDamage(projectile.damage * multiplier);
        if (isHeadshot) {
          this.createHeadshotEffect(hitPos);
        } else {
          this.createHitEffect(hitPos);
        }
        projectile.destroy();
      }
    });

    // Check boss hit
    if (projectile.dead) return;
    const boss = this.enemyManager.getActiveBoss();
    if (boss && !boss.dead && boss.mesh && projectile.mesh) {
      const dist = BABYLON.Vector3.Distance(projectile.mesh.position, boss.mesh.position);
      if (dist < 2.5) {
        const hitPos = projectile.mesh.position.clone();
        const s = boss.config ? boss.config.scale : 2.5;
        const headY = boss.mesh.position.y + 1.0 * s;
        const isHeadshot = Math.abs(projectile.mesh.position.y - headY) < 0.5 * s;
        const multiplier = (this.gameState.damageMultiplier || 1) * (isHeadshot ? 2.0 : 1.0);
        boss.takeDamage(projectile.damage * multiplier);
        if (isHeadshot) {
          this.createHeadshotEffect(hitPos);
        } else {
          this.createHitEffect(hitPos);
        }
        projectile.destroy();
      }
    }
  }

  createHitEffect(position) {
    // Create shared material for all particles in this effect
    const mat = new BABYLON.StandardMaterial('particleMat', this.scene);
    mat.diffuseColor = new BABYLON.Color3(1, 0.5, 0);

    const particleCount = 15;
    let disposed = 0;

    for (let i = 0; i < particleCount; i++) {
      const particle = BABYLON.MeshBuilder.CreateSphere('particle', {
        diameter: 0.1
      }, this.scene);

      particle.position = position.clone();
      particle.material = mat;

      // Random velocity
      const velocity = new BABYLON.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 5,
        (Math.random() - 0.5) * 5
      );

      // Animate and dispose
      let life = 0.5;
      const animation = this.scene.onBeforeRenderObservable.add(() => {
        const dt = this.scene.getEngine().getDeltaTime() / 1000;
        life -= dt;

        particle.position.addInPlace(velocity.scale(dt));
        velocity.y -= 10 * dt; // Gravity

        if (life <= 0) {
          particle.dispose();
          this.scene.onBeforeRenderObservable.remove(animation);
          disposed++;
          // Dispose shared material when all particles are gone
          if (disposed >= particleCount) {
            mat.dispose();
          }
        }
      });
    }
  }

  createHeadshotEffect(position) {
    const mat = new BABYLON.StandardMaterial('headshotMat', this.scene);
    mat.diffuseColor = new BABYLON.Color3(1, 1, 0);
    mat.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0);

    const particleCount = 20;
    let disposed = 0;

    for (let i = 0; i < particleCount; i++) {
      const particle = BABYLON.MeshBuilder.CreateSphere('particle', {
        diameter: 0.12
      }, this.scene);
      particle.position = position.clone();
      particle.material = mat;

      const velocity = new BABYLON.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 7,
        (Math.random() - 0.5) * 6
      );

      let life = 0.6;
      const animation = this.scene.onBeforeRenderObservable.add(() => {
        const dt = this.scene.getEngine().getDeltaTime() / 1000;
        life -= dt;
        particle.position.addInPlace(velocity.scale(dt));
        velocity.y -= 10 * dt;
        if (life <= 0) {
          particle.dispose();
          this.scene.onBeforeRenderObservable.remove(animation);
          disposed++;
          if (disposed >= particleCount) mat.dispose();
        }
      });
    }
  }

  createMuzzleFlash(position) {
    const flash = BABYLON.MeshBuilder.CreateSphere('flash', {
      diameter: 0.4
    }, this.scene);

    flash.position = position.clone();

    const mat = new BABYLON.StandardMaterial('flashMat', this.scene);
    mat.diffuseColor = new BABYLON.Color3(1, 0.6, 0);
    flash.material = mat;

    let life = 0.1;
    const observer = this.scene.onBeforeRenderObservable.add(() => {
      const dt = this.scene.getEngine().getDeltaTime() / 1000;
      life -= dt;
      if (life <= 0) {
        mat.dispose();
        flash.dispose();
        this.scene.onBeforeRenderObservable.remove(observer);
      }
    });
  }
}
