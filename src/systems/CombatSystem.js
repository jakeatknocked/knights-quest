import * as BABYLON from '@babylonjs/core';
import { Projectile } from '../entities/Projectile.js';

export class CombatSystem {
  constructor(scene, player, enemyManager, gameState) {
    this.scene = scene;
    this.player = player;
    this.enemyManager = enemyManager;
    this.gameState = gameState;
    this.projectiles = [];

    // Cooldowns
    this.swordCooldown = 0;
    this.gunCooldown = 0;
  }

  update(deltaTime, inputManager) {
    // Update cooldowns
    if (this.swordCooldown > 0) this.swordCooldown -= deltaTime;
    if (this.gunCooldown > 0) this.gunCooldown -= deltaTime;

    // Update projectiles
    this.updateProjectiles(deltaTime);

    // Check for combat input
    if (inputManager.isKeyDown('mouseLeft') && this.swordCooldown <= 0) {
      this.swordAttack();
    }

    if (inputManager.isKeyDown('mouseRight') && this.gunCooldown <= 0) {
      this.gunShoot();
    }
  }

  swordAttack() {
    this.swordCooldown = 0.5;

    // Get player forward direction
    const forward = this.player.forwardVector;
    const attackRange = 3;

    // Check for hits
    this.enemyManager.getAliveEnemies().forEach(enemy => {
      const dist = BABYLON.Vector3.Distance(this.player.mesh.position, enemy.mesh.position);
      
      if (dist < attackRange) {
        // Check if enemy is in front
        const toEnemy = enemy.mesh.position.subtract(this.player.mesh.position).normalize();
        const dot = BABYLON.Vector3.Dot(forward, toEnemy);

        if (dot > 0.3) {
          enemy.takeDamage(25);
          this.createHitEffect(enemy.mesh.position.clone());
        }
      }
    });
  }

  gunShoot() {
    const element = this.gameState.selectedElement;
    if (this.gameState.ammo[element] <= 0) return;

    this.gunCooldown = 0.35;
    this.gameState.ammo[element]--;

    // Get player position and forward direction
    const startPos = this.player.mesh.position.clone();
    startPos.y += 1.5;

    const forward = this.player.forwardVector.clone();
    startPos.addInPlace(forward.scale(1));

    // Create projectile
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

  updateProjectiles(deltaTime) {
    this.projectiles.forEach(proj => {
      if (!proj.dead) {
        proj.update(deltaTime);

        // Check hits
        if (!proj.isEnemy) {
          this.checkProjectileEnemyCollision(proj);
        }
      }
    });

    // Remove dead projectiles
    this.projectiles = this.projectiles.filter(p => !p.dead);
  }

  checkProjectileEnemyCollision(projectile) {
    this.enemyManager.getAliveEnemies().forEach(enemy => {
      const dist = BABYLON.Vector3.Distance(projectile.mesh.position, enemy.mesh.position);
      
      if (dist < 1.5) {
        enemy.takeDamage(projectile.damage);
        this.createHitEffect(projectile.mesh.position.clone());
        projectile.destroy();
      }
    });
  }

  createHitEffect(position) {
    // Create shared material for all particles in this effect
    const mat = new BABYLON.StandardMaterial('particleMat', this.scene);
    mat.emissiveColor = new BABYLON.Color3(1, 0.5, 0);

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

  createMuzzleFlash(position) {
    const flash = BABYLON.MeshBuilder.CreateSphere('flash', {
      diameter: 0.4
    }, this.scene);

    flash.position = position.clone();

    const mat = new BABYLON.StandardMaterial('flashMat', this.scene);
    mat.emissiveColor = new BABYLON.Color3(1, 0.6, 0);
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
