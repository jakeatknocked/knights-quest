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

    // Cooldowns
    this.swordCooldown = 0;
    this.gunCooldown = 0;
  }

  update(deltaTime, inputManager, shieldActive) {
    // Update cooldowns
    if (this.swordCooldown > 0) this.swordCooldown -= deltaTime;
    if (this.gunCooldown > 0) this.gunCooldown -= deltaTime;

    // Always update projectiles (even while shielded)
    this.updateProjectiles(deltaTime);

    // Block new attacks while shield is active
    if (shieldActive) return;

    // Check for combat input
    if (inputManager.isKeyDown('mouseleft') && this.swordCooldown <= 0) {
      this.swordAttack();
    }

    if (inputManager.isKeyDown('mouseright') && this.gunCooldown <= 0) {
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
      if (!enemy.mesh || enemy.dead) return;
      const dist = BABYLON.Vector3.Distance(this.player.mesh.position, enemy.mesh.position);

      if (dist < attackRange) {
        const toEnemy = enemy.mesh.position.subtract(this.player.mesh.position);
        if (toEnemy.length() < 0.01) return;
        toEnemy.normalize();
        const dot = BABYLON.Vector3.Dot(forward, toEnemy);

        if (dot > 0.3) {
          const stealth = enemy.aware ? 1 : 3;
          const hitPos = enemy.mesh.position.clone();
          enemy.takeDamage(25 * (this.gameState.damageMultiplier || 1) * stealth);
          this.createHitEffect(hitPos);
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
    const weapon = this.gameState.selectedWeapon || 'pistol';
    const element = this.gameState.selectedElement;
    if (this.gameState.ammo[element] <= 0) return;

    switch (weapon) {
      case 'shotgun':
        this.shootShotgun(element);
        break;
      case 'rocket':
        this.shootRocket(element);
        break;
      case 'laser':
        this.shootLaser(element);
        break;
      case 'minigun':
        this.shootMinigun(element);
        break;
      default:
        this.shootPistol(element);
        break;
    }
  }

  shootPistol(element) {
    this.gunCooldown = 0.35;
    this.gameState.ammo[element]--;

    const forward = this.getAimDirection();
    const startPos = this.player.mesh.position.clone();
    startPos.y += 1.5;
    startPos.addInPlace(forward.scale(1));

    const projectile = new Projectile(this.scene, startPos, forward, element, false);
    this.projectiles.push(projectile);
    this.createMuzzleFlash(startPos);
  }

  shootShotgun(element) {
    this.gunCooldown = 0.8;
    // Uses 3 ammo but shoots 5 pellets
    this.gameState.ammo[element] = Math.max(0, this.gameState.ammo[element] - 3);

    const forward = this.getAimDirection();
    const startPos = this.player.mesh.position.clone();
    startPos.y += 1.5;
    startPos.addInPlace(forward.scale(1));

    // Shoot 5 pellets in a spread
    for (let i = 0; i < 5; i++) {
      const spread = new BABYLON.Vector3(
        forward.x + (Math.random() - 0.5) * 0.3,
        forward.y + (Math.random() - 0.5) * 0.15,
        forward.z + (Math.random() - 0.5) * 0.3
      );
      spread.normalize();
      const proj = new Projectile(this.scene, startPos.clone(), spread, element, false);
      proj.damage = 12; // Less per pellet but 5 of them
      proj.life = 1.5; // Shorter range
      this.projectiles.push(proj);
    }
    this.createMuzzleFlash(startPos);
  }

  shootRocket(element) {
    this.gunCooldown = 1.5;
    this.gameState.ammo[element] = Math.max(0, this.gameState.ammo[element] - 5);

    const forward = this.getAimDirection();
    const startPos = this.player.mesh.position.clone();
    startPos.y += 1.5;
    startPos.addInPlace(forward.scale(1));

    const proj = new Projectile(this.scene, startPos, forward, element, false);
    proj.damage = 80;
    proj.isRocket = true;
    // Make rocket bigger
    if (proj.mesh) {
      proj.mesh.scaling = new BABYLON.Vector3(2, 2, 2);
    }
    if (proj.light) {
      proj.light.intensity = 4;
      proj.light.range = 10;
    }
    this.projectiles.push(proj);
    this.createMuzzleFlash(startPos);
  }

  shootLaser(element) {
    this.gunCooldown = 0.5;
    this.gameState.ammo[element] -= 2;

    const forward = this.getAimDirection();
    const startPos = this.player.mesh.position.clone();
    startPos.y += 1.5;

    // Instant hit — raycast
    const ray = new BABYLON.Ray(startPos, forward, 100);
    const hits = [];

    // Check all enemies
    this.enemyManager.getAliveEnemies().forEach(enemy => {
      if (!enemy.mesh || enemy.dead) return;
      const hit = ray.intersectsMesh(enemy.mesh, false);
      if (hit.hit) {
        hits.push({ enemy, distance: hit.distance, point: hit.pickedPoint || enemy.mesh.position.clone() });
      }
      // Also check child meshes
      enemy.mesh.getChildMeshes().forEach(child => {
        const childHit = ray.intersectsMesh(child, false);
        if (childHit.hit && !hits.find(h => h.enemy === enemy)) {
          hits.push({ enemy, distance: childHit.distance, point: childHit.pickedPoint || enemy.mesh.position.clone() });
        }
      });
    });

    // Sort by distance and hit the closest
    hits.sort((a, b) => a.distance - b.distance);
    if (hits.length > 0) {
      const hit = hits[0];
      const headY = hit.enemy.mesh.position.y + 1.0;
      const isHeadshot = hit.point && Math.abs(hit.point.y - headY) < 0.4;
      const stealth = hit.enemy.aware ? 1 : 3;
      const multiplier = (this.gameState.damageMultiplier || 1) * (isHeadshot ? 2.0 : 1.0) * stealth;
      hit.enemy.takeDamage(30 * multiplier, element);
      if (isHeadshot) {
        this.createHeadshotEffect(hit.point);
      } else {
        this.createHitEffect(hit.point);
      }
    }

    // Draw laser beam visual
    const endPoint = hits.length > 0 ? hits[0].point : startPos.add(forward.scale(100));
    this.createLaserBeam(startPos, endPoint, element);
    this.createMuzzleFlash(startPos);
  }

  shootMinigun(element) {
    this.gunCooldown = 0.08; // Super fast!
    this.gameState.ammo[element]--;

    const forward = this.getAimDirection();
    // Add a little random spread
    forward.x += (Math.random() - 0.5) * 0.08;
    forward.y += (Math.random() - 0.5) * 0.04;
    forward.z += (Math.random() - 0.5) * 0.08;
    forward.normalize();

    const startPos = this.player.mesh.position.clone();
    startPos.y += 1.5;
    startPos.addInPlace(forward.scale(1));

    const proj = new Projectile(this.scene, startPos, forward, element, false);
    proj.damage = 8; // Less damage per bullet but shoots crazy fast
    this.projectiles.push(proj);
    this.createMuzzleFlash(startPos);
  }

  createLaserBeam(start, end, element) {
    const colors = {
      fire: new BABYLON.Color3(1, 0.3, 0),
      ice: new BABYLON.Color3(0.3, 0.7, 1),
      lightning: new BABYLON.Color3(1, 1, 0.2)
    };
    const color = colors[element] || colors.fire;

    // Create a line mesh for the laser
    const points = [start, end];
    const laser = BABYLON.MeshBuilder.CreateLines('laser', { points }, this.scene);
    laser.color = color;
    laser.enableEdgesRendering();
    laser.edgesWidth = 8;
    laser.edgesColor = new BABYLON.Color4(color.r, color.g, color.b, 1);

    // Also create a bright tube for thickness
    const distance = BABYLON.Vector3.Distance(start, end);
    const tube = BABYLON.MeshBuilder.CreateCylinder('laserTube', {
      height: distance, diameter: 0.15, tessellation: 6
    }, this.scene);
    const mid = start.add(end).scale(0.5);
    tube.position = mid;
    // Rotate to point from start to end
    const dir = end.subtract(start).normalize();
    const up = new BABYLON.Vector3(0, 1, 0);
    const angle = Math.acos(BABYLON.Vector3.Dot(up, dir));
    const axis = BABYLON.Vector3.Cross(up, dir);
    if (axis.length() > 0.001) {
      axis.normalize();
      tube.rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, angle);
    }
    const tubeMat = new BABYLON.StandardMaterial('laserMat', this.scene);
    tubeMat.diffuseColor = color;
    tubeMat.emissiveColor = color;
    tubeMat.alpha = 0.7;
    tube.material = tubeMat;

    // Fade out and remove
    let life = 0.15;
    const obs = this.scene.onBeforeRenderObservable.add(() => {
      const dt = this.scene.getEngine().getDeltaTime() / 1000;
      life -= dt;
      if (life <= 0) {
        laser.dispose();
        tubeMat.dispose();
        tube.dispose();
        this.scene.onBeforeRenderObservable.remove(obs);
      }
    });
  }

  updateProjectiles(deltaTime) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      if (proj.dead) continue;
      proj.update(deltaTime);
      if (!proj.dead) {
        this.checkProjectileWallCollision(proj);
      }
      if (!proj.dead && !proj.isEnemy) {
        this.checkProjectileEnemyCollision(proj);
      }
    }

    // Remove dead projectiles
    this.projectiles = this.projectiles.filter(p => !p.dead);
  }

  checkProjectileWallCollision(projectile) {
    if (projectile.dead || !projectile.mesh) return;

    // Cast a ray in the projectile's direction to check for walls
    const direction = projectile.velocity.clone();
    if (direction.length() < 0.01) return;
    direction.normalize();

    const ray = new BABYLON.Ray(projectile.mesh.position, direction, 0.5);
    const hit = this.scene.pickWithRay(ray, (mesh) => {
      return mesh.name !== 'projectile' &&
        mesh.name !== 'particle' &&
        mesh.name !== 'flash' &&
        mesh.name !== 'emoteBubble' &&
        mesh.name !== 'shield' &&
        mesh !== this.player.mesh &&
        !mesh.isDescendantOf(this.player.mesh) &&
        !this.enemyManager.getAliveEnemies().some(e => e.mesh === mesh || (e.mesh && mesh.isDescendantOf(e.mesh)));
    });

    if (hit && hit.hit) {
      if (projectile.isRocket) {
        this.createExplosion(projectile.mesh.position.clone(), projectile.element, projectile.damage);
      } else {
        this.createHitEffect(projectile.mesh.position.clone());
      }
      projectile.destroy();
    }
  }

  createExplosion(position, element, damage) {
    // Damage all enemies in radius
    const radius = 8;
    this.enemyManager.getAliveEnemies().forEach(enemy => {
      if (!enemy.mesh || enemy.dead) return;
      const dist = BABYLON.Vector3.Distance(position, enemy.mesh.position);
      if (dist < radius) {
        const falloff = 1 - (dist / radius);
        enemy.takeDamage(damage * falloff * (this.gameState.damageMultiplier || 1), element);
      }
    });

    // Big particle explosion
    const colors = {
      fire: new BABYLON.Color3(1, 0.4, 0),
      ice: new BABYLON.Color3(0.3, 0.7, 1),
      lightning: new BABYLON.Color3(1, 1, 0.2)
    };
    const color = colors[element] || colors.fire;

    const mat = new BABYLON.StandardMaterial('explMat', this.scene);
    mat.diffuseColor = color;
    mat.emissiveColor = color;

    const particleCount = 30;
    let disposed = 0;

    for (let i = 0; i < particleCount; i++) {
      const size = 0.15 + Math.random() * 0.2;
      const particle = BABYLON.MeshBuilder.CreateSphere('particle', { diameter: size }, this.scene);
      particle.position = position.clone();
      particle.material = mat;

      const velocity = new BABYLON.Vector3(
        (Math.random() - 0.5) * 12,
        Math.random() * 10,
        (Math.random() - 0.5) * 12
      );

      let life = 0.5 + Math.random() * 0.3;
      const obs = this.scene.onBeforeRenderObservable.add(() => {
        const dt = this.scene.getEngine().getDeltaTime() / 1000;
        life -= dt;
        particle.position.addInPlace(velocity.scale(dt));
        velocity.y -= 10 * dt;
        if (life <= 0) {
          particle.dispose();
          this.scene.onBeforeRenderObservable.remove(obs);
          disposed++;
          if (disposed >= particleCount) mat.dispose();
        }
      });
    }

    // Explosion flash light
    const light = new BABYLON.PointLight('explLight', position, this.scene);
    light.diffuse = color;
    light.intensity = 10;
    light.range = 15;
    let lightLife = 0.3;
    const lightObs = this.scene.onBeforeRenderObservable.add(() => {
      const dt = this.scene.getEngine().getDeltaTime() / 1000;
      lightLife -= dt;
      light.intensity = 10 * (lightLife / 0.3);
      if (lightLife <= 0) {
        light.dispose();
        this.scene.onBeforeRenderObservable.remove(lightObs);
      }
    });
  }

  checkProjectileEnemyCollision(projectile) {
    if (projectile.dead || !projectile.mesh) return;

    this.enemyManager.getAliveEnemies().forEach(enemy => {
      if (projectile.dead || !enemy.mesh) return;
      const dist = BABYLON.Vector3.Distance(projectile.mesh.position, enemy.mesh.position);

      if (dist < 1.5) {
        const hitPos = projectile.mesh.position.clone();

        // Rocket = big explosion
        if (projectile.isRocket) {
          this.createExplosion(hitPos, projectile.element, projectile.damage);
          projectile.destroy();
          return;
        }

        // Headshot: projectile hits near head height (enemy.mesh.position.y + 1.0)
        const headY = enemy.mesh.position.y + 1.0;
        const isHeadshot = Math.abs(projectile.mesh.position.y - headY) < 0.4;
        const stealth = enemy.aware ? 1 : 3;
        const multiplier = (this.gameState.damageMultiplier || 1) * (isHeadshot ? 2.0 : 1.0) * stealth;
        enemy.takeDamage(projectile.damage * multiplier, projectile.element);
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
