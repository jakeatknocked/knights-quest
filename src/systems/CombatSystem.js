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
    this.gunFiredThisFrame = false;
    this.swordKilledThisFrame = false;
    this.headshotThisFrame = false;

    // First-person weapon models
    this.swordMesh = null;
    this.gunMesh = null;
    this.swordAnim = 0;   // 0 = idle, >0 = swinging
    this.gunAnim = 0;     // 0 = idle, >0 = recoiling
  }

  createWeaponModels() {
    if (!this.camera) return;

    // Get skin color for weapon tinting
    const skinColor = localStorage.getItem('knightSkin') || 'silver';
    const skinColors = {
      silver: { r: 0.3, g: 0.5, b: 0.8 },
      gold: { r: 1, g: 0.75, b: 0.1 },
      dark: { r: 0.25, g: 0.2, b: 0.4 },
      crystal: { r: 0.2, g: 0.9, b: 0.9 },
      rainbow: { r: 1, g: 0.4, b: 0.4 },
      lava: { r: 1, g: 0.2, b: 0 },
      ice: { r: 0.4, g: 0.7, b: 1 },
    };
    const sc = skinColors[skinColor] || skinColors.silver;

    // --- SWORD (right side, lower) ---
    this.swordMesh = new BABYLON.TransformNode('swordRoot', this.scene);
    this.swordMesh.parent = this.camera;
    this.swordMesh.position = new BABYLON.Vector3(0.35, -0.3, 0.6);

    // Blade (tinted by skin)
    const blade = BABYLON.MeshBuilder.CreateBox('blade', {
      width: 0.04, height: 0.6, depth: 0.08
    }, this.scene);
    blade.position.y = 0.35;
    blade.parent = this.swordMesh;
    const bladeMat = new BABYLON.StandardMaterial('bladeMat', this.scene);
    bladeMat.diffuseColor = new BABYLON.Color3(
      0.6 + sc.r * 0.3, 0.65 + sc.g * 0.3, 0.7 + sc.b * 0.3
    );
    bladeMat.emissiveColor = new BABYLON.Color3(sc.r * 0.15, sc.g * 0.15, sc.b * 0.15);
    bladeMat.specularColor = new BABYLON.Color3(1, 1, 1);
    bladeMat.specularPower = 128;
    blade.material = bladeMat;

    // Blade tip
    const tip = BABYLON.MeshBuilder.CreateBox('bladeTip', {
      width: 0.04, height: 0.1, depth: 0.06
    }, this.scene);
    tip.position.y = 0.7;
    tip.parent = this.swordMesh;
    tip.material = bladeMat;

    // Guard (crosspiece — skin colored)
    const guard = BABYLON.MeshBuilder.CreateBox('guard', {
      width: 0.15, height: 0.03, depth: 0.1
    }, this.scene);
    guard.position.y = 0.05;
    guard.parent = this.swordMesh;
    const guardMat = new BABYLON.StandardMaterial('guardMat', this.scene);
    guardMat.diffuseColor = new BABYLON.Color3(sc.r * 0.8, sc.g * 0.8, sc.b * 0.8);
    guardMat.emissiveColor = new BABYLON.Color3(sc.r * 0.15, sc.g * 0.15, sc.b * 0.15);
    guardMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    guard.material = guardMat;

    // Handle
    const handle = BABYLON.MeshBuilder.CreateCylinder('swordHandle', {
      height: 0.15, diameter: 0.04
    }, this.scene);
    handle.position.y = -0.05;
    handle.parent = this.swordMesh;
    const handleMat = new BABYLON.StandardMaterial('handleMat', this.scene);
    handleMat.diffuseColor = new BABYLON.Color3(sc.r * 0.4, sc.g * 0.4, sc.b * 0.4);
    handleMat.emissiveColor = new BABYLON.Color3(sc.r * 0.08, sc.g * 0.08, sc.b * 0.08);
    handle.material = handleMat;

    // Pommel
    const pommel = BABYLON.MeshBuilder.CreateSphere('pommel', { diameter: 0.06 }, this.scene);
    pommel.position.y = -0.14;
    pommel.parent = this.swordMesh;
    pommel.material = guardMat;

    this.swordMesh.setEnabled(false); // hidden by default

    // Store skin color for gun rebuilds
    this._skinColor = sc;

    // Build gun for current weapon
    this.currentGunType = null;
    this.buildGunModel(this.gameState.selectedWeapon || 'pistol');

    this.weaponModelsCreated = true;
  }

  buildGunModel(weaponType) {
    // Don't rebuild if same type
    if (this.currentGunType === weaponType) return;
    this.currentGunType = weaponType;

    // Dispose old gun mesh
    if (this.gunMesh) {
      this.gunMesh.getChildMeshes().forEach(m => {
        if (m.material) m.material.dispose();
        m.dispose();
      });
      this.gunMesh.dispose();
    }

    const sc = this._skinColor || { r: 0.3, g: 0.5, b: 0.8 };

    this.gunMesh = new BABYLON.TransformNode('gunRoot', this.scene);
    this.gunMesh.parent = this.camera;
    this.gunMesh.position = new BABYLON.Vector3(0.3, -0.25, 0.5);

    // Shared materials
    const gunMat = new BABYLON.StandardMaterial('fpGunMat', this.scene);
    gunMat.diffuseColor = new BABYLON.Color3(
      0.15 + sc.r * 0.2, 0.15 + sc.g * 0.2, 0.18 + sc.b * 0.2
    );
    gunMat.emissiveColor = new BABYLON.Color3(sc.r * 0.06, sc.g * 0.06, sc.b * 0.06);
    gunMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);

    const gripMat = new BABYLON.StandardMaterial('gripMat', this.scene);
    gripMat.diffuseColor = new BABYLON.Color3(sc.r * 0.5, sc.g * 0.5, sc.b * 0.5);
    gripMat.emissiveColor = new BABYLON.Color3(sc.r * 0.08, sc.g * 0.08, sc.b * 0.08);

    const accentMat = new BABYLON.StandardMaterial('accentMat', this.scene);
    accentMat.diffuseColor = new BABYLON.Color3(sc.r, sc.g, sc.b);
    accentMat.emissiveColor = new BABYLON.Color3(sc.r * 0.2, sc.g * 0.2, sc.b * 0.2);

    if (weaponType === 'shotgun') {
      // SHOTGUN — wide double barrel, chunky
      const barrel1 = BABYLON.MeshBuilder.CreateCylinder('sgBarrel1', {
        height: 0.38, diameter: 0.04
      }, this.scene);
      barrel1.rotation.x = Math.PI / 2;
      barrel1.position.set(-0.02, 0.01, 0.2);
      barrel1.parent = this.gunMesh;
      barrel1.material = gunMat;

      const barrel2 = BABYLON.MeshBuilder.CreateCylinder('sgBarrel2', {
        height: 0.38, diameter: 0.04
      }, this.scene);
      barrel2.rotation.x = Math.PI / 2;
      barrel2.position.set(0.02, 0.01, 0.2);
      barrel2.parent = this.gunMesh;
      barrel2.material = gunMat;

      // Wide body
      const sgBody = BABYLON.MeshBuilder.CreateBox('sgBody', {
        width: 0.1, height: 0.08, depth: 0.2
      }, this.scene);
      sgBody.position.set(0, -0.02, 0);
      sgBody.parent = this.gunMesh;
      sgBody.material = gunMat;

      // Pump grip
      const pump = BABYLON.MeshBuilder.CreateBox('sgPump', {
        width: 0.06, height: 0.05, depth: 0.08
      }, this.scene);
      pump.position.set(0, -0.04, 0.12);
      pump.parent = this.gunMesh;
      pump.material = gripMat;

      // Grip
      const sgGrip = BABYLON.MeshBuilder.CreateBox('sgGrip', {
        width: 0.05, height: 0.12, depth: 0.06
      }, this.scene);
      sgGrip.position.set(0, -0.1, -0.04);
      sgGrip.rotation.x = 0.3;
      sgGrip.parent = this.gunMesh;
      sgGrip.material = gripMat;

      // Accent stripe
      const sgStripe = BABYLON.MeshBuilder.CreateBox('sgStripe', {
        width: 0.105, height: 0.02, depth: 0.21
      }, this.scene);
      sgStripe.position.set(0, 0.03, 0);
      sgStripe.parent = this.gunMesh;
      sgStripe.material = accentMat;

    } else if (weaponType === 'rocket') {
      // ROCKET LAUNCHER — big tube on shoulder
      this.gunMesh.position = new BABYLON.Vector3(0.3, -0.2, 0.4);

      const tube = BABYLON.MeshBuilder.CreateCylinder('rlTube', {
        height: 0.5, diameter: 0.1
      }, this.scene);
      tube.rotation.x = Math.PI / 2;
      tube.position.set(0, 0.02, 0.15);
      tube.parent = this.gunMesh;
      tube.material = gunMat;

      // Wide opening at front
      const muzzleRing = BABYLON.MeshBuilder.CreateTorus('rlMuzzle', {
        diameter: 0.1, thickness: 0.015, tessellation: 12
      }, this.scene);
      muzzleRing.position.set(0, 0.02, 0.4);
      muzzleRing.rotation.x = Math.PI / 2;
      muzzleRing.parent = this.gunMesh;
      muzzleRing.material = accentMat;

      // Grip
      const rlGrip = BABYLON.MeshBuilder.CreateBox('rlGrip', {
        width: 0.05, height: 0.14, depth: 0.06
      }, this.scene);
      rlGrip.position.set(0, -0.1, -0.02);
      rlGrip.rotation.x = 0.2;
      rlGrip.parent = this.gunMesh;
      rlGrip.material = gripMat;

      // Sight on top
      const sight = BABYLON.MeshBuilder.CreateBox('rlSight', {
        width: 0.02, height: 0.04, depth: 0.06
      }, this.scene);
      sight.position.set(0, 0.1, 0.05);
      sight.parent = this.gunMesh;
      sight.material = accentMat;

      // Accent bands
      for (let i = 0; i < 3; i++) {
        const band = BABYLON.MeshBuilder.CreateTorus('rlBand', {
          diameter: 0.105, thickness: 0.008, tessellation: 12
        }, this.scene);
        band.position.set(0, 0.02, -0.05 + i * 0.15);
        band.rotation.x = Math.PI / 2;
        band.parent = this.gunMesh;
        band.material = accentMat;
      }

    } else if (weaponType === 'laser') {
      // LASER — sleek sci-fi blaster
      const laserBody = BABYLON.MeshBuilder.CreateBox('lsBody', {
        width: 0.06, height: 0.07, depth: 0.3
      }, this.scene);
      laserBody.position.set(0, 0, 0.05);
      laserBody.parent = this.gunMesh;
      laserBody.material = gunMat;

      // Tapered barrel
      const laserBarrel = BABYLON.MeshBuilder.CreateCylinder('lsBarrel', {
        height: 0.2, diameterTop: 0.02, diameterBottom: 0.05
      }, this.scene);
      laserBarrel.rotation.x = Math.PI / 2;
      laserBarrel.position.set(0, 0.01, 0.3);
      laserBarrel.parent = this.gunMesh;
      laserBarrel.material = gunMat;

      // Glowing core
      const core = BABYLON.MeshBuilder.CreateSphere('lsCore', { diameter: 0.04 }, this.scene);
      core.position.set(0, 0.01, 0.08);
      core.parent = this.gunMesh;
      const coreMat = new BABYLON.StandardMaterial('lsCoreMat', this.scene);
      coreMat.diffuseColor = new BABYLON.Color3(sc.r, sc.g, sc.b);
      coreMat.emissiveColor = new BABYLON.Color3(sc.r * 0.5, sc.g * 0.5, sc.b * 0.5);
      core.material = coreMat;

      // Side fins
      for (let side = -1; side <= 1; side += 2) {
        const fin = BABYLON.MeshBuilder.CreateBox('lsFin', {
          width: 0.01, height: 0.04, depth: 0.12
        }, this.scene);
        fin.position.set(side * 0.04, 0, 0.1);
        fin.parent = this.gunMesh;
        fin.material = accentMat;
      }

      // Grip
      const lsGrip = BABYLON.MeshBuilder.CreateBox('lsGrip', {
        width: 0.04, height: 0.1, depth: 0.05
      }, this.scene);
      lsGrip.position.set(0, -0.08, -0.02);
      lsGrip.rotation.x = 0.25;
      lsGrip.parent = this.gunMesh;
      lsGrip.material = gripMat;

    } else if (weaponType === 'minigun') {
      // MINIGUN — multiple rotating barrels
      this.gunMesh.position = new BABYLON.Vector3(0.3, -0.22, 0.45);

      // 4 barrels in a circle
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const mgBarrel = BABYLON.MeshBuilder.CreateCylinder('mgBarrel' + i, {
          height: 0.4, diameter: 0.025
        }, this.scene);
        mgBarrel.rotation.x = Math.PI / 2;
        mgBarrel.position.set(
          Math.cos(angle) * 0.03,
          Math.sin(angle) * 0.03 + 0.01,
          0.2
        );
        mgBarrel.parent = this.gunMesh;
        mgBarrel.material = gunMat;
      }

      // Barrel housing (cylinder)
      const housing = BABYLON.MeshBuilder.CreateCylinder('mgHousing', {
        height: 0.12, diameter: 0.1
      }, this.scene);
      housing.rotation.x = Math.PI / 2;
      housing.position.set(0, 0.01, 0.05);
      housing.parent = this.gunMesh;
      housing.material = gunMat;

      // Big body
      const mgBody = BABYLON.MeshBuilder.CreateBox('mgBody', {
        width: 0.09, height: 0.1, depth: 0.18
      }, this.scene);
      mgBody.position.set(0, -0.02, -0.05);
      mgBody.parent = this.gunMesh;
      mgBody.material = gunMat;

      // Ammo box hanging below
      const ammoBox = BABYLON.MeshBuilder.CreateBox('mgAmmo', {
        width: 0.06, height: 0.06, depth: 0.08
      }, this.scene);
      ammoBox.position.set(0.03, -0.1, -0.06);
      ammoBox.parent = this.gunMesh;
      ammoBox.material = accentMat;

      // Grip
      const mgGrip = BABYLON.MeshBuilder.CreateBox('mgGrip', {
        width: 0.05, height: 0.12, depth: 0.06
      }, this.scene);
      mgGrip.position.set(0, -0.12, -0.02);
      mgGrip.rotation.x = 0.2;
      mgGrip.parent = this.gunMesh;
      mgGrip.material = gripMat;

      // Front handle
      const frontGrip = BABYLON.MeshBuilder.CreateBox('mgFrontGrip', {
        width: 0.04, height: 0.08, depth: 0.04
      }, this.scene);
      frontGrip.position.set(0, -0.06, 0.08);
      frontGrip.parent = this.gunMesh;
      frontGrip.material = gripMat;

    } else {
      // PISTOL — default small gun
      const barrel = BABYLON.MeshBuilder.CreateBox('barrel', {
        width: 0.05, height: 0.05, depth: 0.35
      }, this.scene);
      barrel.position.z = 0.15;
      barrel.parent = this.gunMesh;
      barrel.material = gunMat;

      const pBody = BABYLON.MeshBuilder.CreateBox('gunBody', {
        width: 0.07, height: 0.1, depth: 0.2
      }, this.scene);
      pBody.position.set(0, -0.02, 0);
      pBody.parent = this.gunMesh;
      pBody.material = gunMat;

      const pGrip = BABYLON.MeshBuilder.CreateBox('gunGrip', {
        width: 0.05, height: 0.12, depth: 0.06
      }, this.scene);
      pGrip.position.set(0, -0.1, -0.04);
      pGrip.rotation.x = 0.3;
      pGrip.parent = this.gunMesh;
      pGrip.material = gripMat;

      // Accent stripe
      const pStripe = BABYLON.MeshBuilder.CreateBox('gunStripe', {
        width: 0.075, height: 0.03, depth: 0.21
      }, this.scene);
      pStripe.position.set(0, 0.04, 0);
      pStripe.parent = this.gunMesh;
      pStripe.material = accentMat;
    }

    // Muzzle tip (colored by element) — all guns get this
    this.gunMuzzle = BABYLON.MeshBuilder.CreateCylinder('gunMuzzle', {
      height: 0.03, diameter: 0.04
    }, this.scene);
    const muzzleZ = weaponType === 'rocket' ? 0.42 : weaponType === 'laser' ? 0.42 : weaponType === 'minigun' ? 0.42 : weaponType === 'shotgun' ? 0.4 : 0.34;
    this.gunMuzzle.position.set(0, weaponType === 'rocket' ? 0.02 : 0, muzzleZ);
    this.gunMuzzle.rotation.x = Math.PI / 2;
    this.gunMuzzle.parent = this.gunMesh;
    this.gunMuzzleMat = new BABYLON.StandardMaterial('muzzleMat', this.scene);
    this.gunMuzzleMat.diffuseColor = new BABYLON.Color3(1, 0.3, 0);
    this.gunMuzzleMat.emissiveColor = new BABYLON.Color3(0.3, 0.1, 0);
    this.gunMuzzle.material = this.gunMuzzleMat;

    this.gunMesh.setEnabled(true);
  }

  updateWeaponModels(deltaTime) {
    if (!this.weaponModelsCreated) return;

    // Rebuild gun model if weapon changed
    const wp = this.gameState.selectedWeapon || 'pistol';
    if (wp !== this.currentGunType) {
      this.buildGunModel(wp);
    }

    // Update muzzle color based on selected element
    const elementColors = {
      fire: { diff: new BABYLON.Color3(1, 0.3, 0), emis: new BABYLON.Color3(0.3, 0.1, 0) },
      ice: { diff: new BABYLON.Color3(0.3, 0.8, 1), emis: new BABYLON.Color3(0.1, 0.2, 0.3) },
      lightning: { diff: new BABYLON.Color3(1, 0.9, 0.2), emis: new BABYLON.Color3(0.3, 0.25, 0.05) }
    };
    const ec = elementColors[this.gameState.selectedElement] || elementColors.fire;
    this.gunMuzzleMat.diffuseColor = ec.diff;
    this.gunMuzzleMat.emissiveColor = ec.emis;

    // Sword swing animation
    if (this.swordAnim > 0) {
      this.swordMesh.setEnabled(true);
      this.gunMesh.setEnabled(false);

      // Swing from right to left: rotation on Z axis
      const t = 1 - this.swordAnim; // 0 to 1
      this.swordMesh.rotation.z = -1.5 + t * 3.0; // swing arc
      this.swordMesh.rotation.x = -0.3 + t * 0.6;
      this.swordMesh.position.x = 0.35 - t * 0.3;

      this.swordAnim -= deltaTime * 3; // swing lasts ~0.33s
      if (this.swordAnim <= 0) {
        this.swordAnim = 0;
        this.swordMesh.setEnabled(false);
        this.gunMesh.setEnabled(true);
        // Reset sword position
        this.swordMesh.rotation.set(0, 0, 0);
        this.swordMesh.position = new BABYLON.Vector3(0.35, -0.3, 0.6);
      }
    }

    // Gun recoil animation
    if (this.gunAnim > 0) {
      const t = this.gunAnim; // 1 to 0
      this.gunMesh.position.z = 0.5 - t * 0.12; // kick back
      this.gunMesh.rotation.x = -t * 0.2;        // tilt up

      this.gunAnim -= deltaTime * 5; // recoil lasts ~0.2s
      if (this.gunAnim <= 0) {
        this.gunAnim = 0;
        this.gunMesh.position.z = 0.5;
        this.gunMesh.rotation.x = 0;
      }
    }
  }

  update(deltaTime, inputManager, shieldActive) {
    // Update cooldowns
    if (this.swordCooldown > 0) this.swordCooldown -= deltaTime;
    if (this.gunCooldown > 0) this.gunCooldown -= deltaTime;

    // Create weapon models once camera is available
    if (!this.weaponModelsCreated && this.camera) {
      this.createWeaponModels();
    }

    // Animate weapon models
    this.updateWeaponModels(deltaTime);

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
    this.swordAnim = 1.0; // trigger swing animation

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
          if (enemy.dead) this.swordKilledThisFrame = true;
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
    this.gunAnim = 1.0; // trigger recoil animation
    this.gunFiredThisFrame = true;

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
        this.headshotThisFrame = true;
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
    this.gunCooldown = 0.2; // ~5 shots per second
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
          this.headshotThisFrame = true;
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
