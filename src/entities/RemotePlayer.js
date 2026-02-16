import * as BABYLON from '@babylonjs/core';

export class RemotePlayer {
  constructor(scene, username, skin) {
    this.scene = scene;
    this.username = username || 'Knight';
    this.skin = skin || 'blue';

    // Health
    this.health = 100;
    this.maxHealth = 100;
    this.alive = true;

    // Network interpolation targets
    this.targetPosition = new BABYLON.Vector3(0, 2.0, 0);
    this.targetRotation = 0;

    // Animation state
    this.walkTime = 0;
    this.isMoving = false;
    this.flashTimer = 0;
    this.deathTimer = 0;
    this.dying = false;

    // Store all materials for disposal and flash effects
    this.materials = [];
    this.meshes = [];

    // Build the knight
    this.createKnight();

    // Create floating username label
    this.createUsernameLabel();

    // Create health bar
    this.createHealthBar();

    // Set initial position
    this.root.position = this.targetPosition.clone();
  }

  createKnight() {
    // Root transform node (no physics)
    this.root = new BABYLON.TransformNode('remotePlayer_' + this.username, this.scene);

    // Skin colors
    const colors = {
      blue: new BABYLON.Color3(0.2, 0.35, 0.75),
      silver: new BABYLON.Color3(0.3, 0.5, 0.8),
      gold: new BABYLON.Color3(1, 0.75, 0.1),
      dark: new BABYLON.Color3(0.25, 0.2, 0.4),
      crystal: new BABYLON.Color3(0.2, 0.9, 0.9),
      red: new BABYLON.Color3(0.8, 0.15, 0.15),
      lava: new BABYLON.Color3(1, 0.2, 0),
      ice: new BABYLON.Color3(0.4, 0.7, 1),
    };
    const baseColor = colors[this.skin] || colors.blue;

    // Main material
    const material = new BABYLON.StandardMaterial('remoteMat_' + this.username, this.scene);
    material.diffuseColor = baseColor.clone();
    material.emissiveColor = new BABYLON.Color3(baseColor.r * 0.2, baseColor.g * 0.2, baseColor.b * 0.2);
    material.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    material.specularPower = 80;
    this.materials.push(material);
    this.baseMaterial = material;
    this.baseColor = baseColor.clone();

    // Armor material (slightly darker)
    const armorMat = new BABYLON.StandardMaterial('remoteArmorMat_' + this.username, this.scene);
    armorMat.diffuseColor = new BABYLON.Color3(baseColor.r * 0.7, baseColor.g * 0.7, baseColor.b * 0.7);
    armorMat.emissiveColor = new BABYLON.Color3(baseColor.r * 0.15, baseColor.g * 0.15, baseColor.b * 0.15);
    armorMat.specularColor = new BABYLON.Color3(0.6, 0.6, 0.6);
    armorMat.specularPower = 64;
    this.materials.push(armorMat);
    this.armorMat = armorMat;
    this.armorBaseColor = armorMat.diffuseColor.clone();

    // Visor material
    const visorMat = new BABYLON.StandardMaterial('remoteVisorMat_' + this.username, this.scene);
    visorMat.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.1);
    visorMat.emissiveColor = new BABYLON.Color3(0.02, 0.02, 0.04);
    this.materials.push(visorMat);

    // Body
    const body = BABYLON.MeshBuilder.CreateBox('rBody_' + this.username, {
      width: 0.8, height: 1.0, depth: 0.5
    }, this.scene);
    body.position.y = 0.2;
    body.parent = this.root;
    body.material = material;
    body.isPickable = false;
    this.meshes.push(body);

    // Chest plate
    const chestPlate = BABYLON.MeshBuilder.CreateBox('rChest_' + this.username, {
      width: 0.85, height: 0.6, depth: 0.3
    }, this.scene);
    chestPlate.position.set(0, 0.4, 0.12);
    chestPlate.parent = this.root;
    chestPlate.material = armorMat;
    chestPlate.isPickable = false;
    this.meshes.push(chestPlate);

    // Head (sphere)
    const head = BABYLON.MeshBuilder.CreateSphere('rHead_' + this.username, { diameter: 0.6 }, this.scene);
    head.position.y = 1.0;
    head.parent = this.root;
    head.material = material;
    head.isPickable = false;
    this.meshes.push(head);

    // Helmet top
    const helmetTop = BABYLON.MeshBuilder.CreateCylinder('rHelmet_' + this.username, {
      height: 0.15, diameterTop: 0.35, diameterBottom: 0.6, tessellation: 12
    }, this.scene);
    helmetTop.position.y = 1.32;
    helmetTop.parent = this.root;
    helmetTop.material = armorMat;
    helmetTop.isPickable = false;
    this.meshes.push(helmetTop);

    // Visor (box across face)
    const visor = BABYLON.MeshBuilder.CreateBox('rVisor_' + this.username, {
      width: 0.45, height: 0.1, depth: 0.08
    }, this.scene);
    visor.position.set(0, 1.02, 0.28);
    visor.parent = this.root;
    visor.material = visorMat;
    visor.isPickable = false;
    this.meshes.push(visor);

    // Shoulder pads
    const shoulderL = BABYLON.MeshBuilder.CreateSphere('rShoulderL_' + this.username, { diameter: 0.35 }, this.scene);
    shoulderL.position.set(-0.5, 0.65, 0);
    shoulderL.scaling = new BABYLON.Vector3(1, 0.7, 1);
    shoulderL.parent = this.root;
    shoulderL.material = armorMat;
    shoulderL.isPickable = false;
    this.meshes.push(shoulderL);

    const shoulderR = BABYLON.MeshBuilder.CreateSphere('rShoulderR_' + this.username, { diameter: 0.35 }, this.scene);
    shoulderR.position.set(0.5, 0.65, 0);
    shoulderR.scaling = new BABYLON.Vector3(1, 0.7, 1);
    shoulderR.parent = this.root;
    shoulderR.material = armorMat;
    shoulderR.isPickable = false;
    this.meshes.push(shoulderR);

    // Left arm (cylinder)
    this.armL = BABYLON.MeshBuilder.CreateCylinder('rArmL_' + this.username, {
      height: 0.8, diameter: 0.22, tessellation: 8
    }, this.scene);
    this.armL.position.set(-0.525, 0.2, 0);
    this.armL.parent = this.root;
    this.armL.material = armorMat;
    this.armL.isPickable = false;
    this.meshes.push(this.armL);

    // Right arm (cylinder)
    this.armR = BABYLON.MeshBuilder.CreateCylinder('rArmR_' + this.username, {
      height: 0.8, diameter: 0.22, tessellation: 8
    }, this.scene);
    this.armR.position.set(0.525, 0.2, 0);
    this.armR.parent = this.root;
    this.armR.material = armorMat;
    this.armR.isPickable = false;
    this.meshes.push(this.armR);

    // Left leg (cylinder)
    this.legL = BABYLON.MeshBuilder.CreateCylinder('rLegL_' + this.username, {
      height: 0.7, diameter: 0.26, tessellation: 8
    }, this.scene);
    this.legL.position.set(-0.2, -0.55, 0);
    this.legL.parent = this.root;
    this.legL.material = armorMat;
    this.legL.isPickable = false;
    this.meshes.push(this.legL);

    // Right leg (cylinder)
    this.legR = BABYLON.MeshBuilder.CreateCylinder('rLegR_' + this.username, {
      height: 0.7, diameter: 0.26, tessellation: 8
    }, this.scene);
    this.legR.position.set(0.2, -0.55, 0);
    this.legR.parent = this.root;
    this.legR.material = armorMat;
    this.legR.isPickable = false;
    this.meshes.push(this.legR);

    // Belt
    const belt = BABYLON.MeshBuilder.CreateBox('rBelt_' + this.username, {
      width: 0.82, height: 0.12, depth: 0.52
    }, this.scene);
    belt.position.set(0, -0.1, 0);
    belt.parent = this.root;
    belt.material = armorMat;
    belt.isPickable = false;
    this.meshes.push(belt);

    // Sword (thin box, attached to right arm area)
    const swordMat = new BABYLON.StandardMaterial('rSwordMat_' + this.username, this.scene);
    swordMat.diffuseColor = new BABYLON.Color3(0.75, 0.75, 0.8);
    swordMat.emissiveColor = new BABYLON.Color3(0.15, 0.15, 0.2);
    swordMat.specularColor = new BABYLON.Color3(0.9, 0.9, 0.9);
    swordMat.specularPower = 128;
    this.materials.push(swordMat);

    this.sword = BABYLON.MeshBuilder.CreateBox('rSword_' + this.username, {
      width: 0.06, height: 0.9, depth: 0.02
    }, this.scene);
    this.sword.position.set(0.65, 0.05, 0.15);
    this.sword.parent = this.root;
    this.sword.material = swordMat;
    this.sword.isPickable = false;
    this.meshes.push(this.sword);

    // Sword handle (crossguard)
    const handleMat = new BABYLON.StandardMaterial('rHandleMat_' + this.username, this.scene);
    handleMat.diffuseColor = new BABYLON.Color3(0.4, 0.25, 0.1);
    handleMat.emissiveColor = new BABYLON.Color3(0.05, 0.03, 0.01);
    this.materials.push(handleMat);

    const crossguard = BABYLON.MeshBuilder.CreateBox('rCrossguard_' + this.username, {
      width: 0.2, height: 0.05, depth: 0.05
    }, this.scene);
    crossguard.position.set(0.65, -0.35, 0.15);
    crossguard.parent = this.root;
    crossguard.material = handleMat;
    crossguard.isPickable = false;
    this.meshes.push(crossguard);
  }

  createUsernameLabel() {
    // Dynamic texture for the username text
    const textureWidth = 512;
    const textureHeight = 64;
    const labelTexture = new BABYLON.DynamicTexture('rLabelTex_' + this.username, {
      width: textureWidth, height: textureHeight
    }, this.scene, false);
    labelTexture.hasAlpha = true;

    const ctx = labelTexture.getContext();
    ctx.clearRect(0, 0, textureWidth, textureHeight);
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.username, textureWidth / 2, textureHeight / 2);
    labelTexture.update();

    const labelMat = new BABYLON.StandardMaterial('rLabelMat_' + this.username, this.scene);
    labelMat.diffuseTexture = labelTexture;
    labelMat.emissiveTexture = labelTexture;
    labelMat.opacityTexture = labelTexture;
    labelMat.backFaceCulling = false;
    labelMat.disableLighting = true;
    this.materials.push(labelMat);

    this.labelPlane = BABYLON.MeshBuilder.CreatePlane('rLabel_' + this.username, {
      width: 2.0, height: 0.25
    }, this.scene);
    this.labelPlane.position.y = 1.7;
    this.labelPlane.parent = this.root;
    this.labelPlane.material = labelMat;
    this.labelPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    this.labelPlane.isPickable = false;
    this.meshes.push(this.labelPlane);
  }

  createHealthBar() {
    // Health bar background (red)
    const hbWidth = 1.0;
    const hbHeight = 0.08;

    const bgTexture = new BABYLON.DynamicTexture('rHpBgTex_' + this.username, {
      width: 256, height: 32
    }, this.scene, false);
    bgTexture.hasAlpha = true;
    const bgCtx = bgTexture.getContext();
    bgCtx.fillStyle = '#440000';
    bgCtx.fillRect(0, 0, 256, 32);
    bgTexture.update();

    const bgMat = new BABYLON.StandardMaterial('rHpBgMat_' + this.username, this.scene);
    bgMat.diffuseTexture = bgTexture;
    bgMat.emissiveTexture = bgTexture;
    bgMat.opacityTexture = bgTexture;
    bgMat.backFaceCulling = false;
    bgMat.disableLighting = true;
    this.materials.push(bgMat);

    this.healthBarBg = BABYLON.MeshBuilder.CreatePlane('rHpBg_' + this.username, {
      width: hbWidth, height: hbHeight
    }, this.scene);
    this.healthBarBg.position.y = 1.5;
    this.healthBarBg.parent = this.root;
    this.healthBarBg.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    this.healthBarBg.isPickable = false;
    this.meshes.push(this.healthBarBg);
    this.healthBarBg.material = bgMat;

    // Health bar foreground (green) - uses DynamicTexture updated each frame
    this.hpTexture = new BABYLON.DynamicTexture('rHpTex_' + this.username, {
      width: 256, height: 32
    }, this.scene, false);
    this.hpTexture.hasAlpha = true;

    const hpMat = new BABYLON.StandardMaterial('rHpMat_' + this.username, this.scene);
    hpMat.diffuseTexture = this.hpTexture;
    hpMat.emissiveTexture = this.hpTexture;
    hpMat.opacityTexture = this.hpTexture;
    hpMat.backFaceCulling = false;
    hpMat.disableLighting = true;
    this.materials.push(hpMat);

    this.healthBarFg = BABYLON.MeshBuilder.CreatePlane('rHpFg_' + this.username, {
      width: hbWidth, height: hbHeight
    }, this.scene);
    this.healthBarFg.position.y = 1.5;
    this.healthBarFg.position.z = -0.001; // Slightly in front of bg
    this.healthBarFg.parent = this.root;
    this.healthBarFg.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    this.healthBarFg.isPickable = false;
    this.meshes.push(this.healthBarFg);
    this.healthBarFg.material = hpMat;

    // Initial draw
    this.updateHealthBar();
  }

  updateHealthBar() {
    if (!this.hpTexture) return;

    const ctx = this.hpTexture.getContext();
    const ratio = Math.max(0, this.health / this.maxHealth);
    const width = 256;
    const height = 32;
    const fillWidth = Math.round(width * ratio);

    ctx.clearRect(0, 0, width, height);

    // Green-to-red gradient based on health
    if (fillWidth > 0) {
      const r = Math.round(255 * (1 - ratio));
      const g = Math.round(200 * ratio);
      ctx.fillStyle = `rgb(${r}, ${g}, 20)`;
      ctx.fillRect(0, 0, fillWidth, height);
    }

    this.hpTexture.update();
  }

  update(deltaTime) {
    if (!this.root) return;

    // If dying, play death animation and skip movement
    if (this.dying) {
      this.deathTimer += deltaTime;
      const fallAngle = Math.min(this.deathTimer * 3, Math.PI / 2);
      this.root.rotation.x = fallAngle;
      if (this.deathTimer > 1.5) {
        this.root.setEnabled(false);
      }
      return;
    }

    // If not alive yet (waiting for respawn), skip
    if (!this.alive) return;

    // Smooth position interpolation (lerp toward target)
    const lerpFactor = Math.min(1, 10 * deltaTime);
    this.root.position = BABYLON.Vector3.Lerp(
      this.root.position,
      this.targetPosition,
      lerpFactor
    );

    // Smooth rotation interpolation
    let rotDiff = this.targetRotation - this.root.rotation.y;
    // Normalize angle difference to [-PI, PI]
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
    this.root.rotation.y += rotDiff * lerpFactor;

    // Detect movement for walk animation
    const posDiff = BABYLON.Vector3.Distance(this.root.position, this.targetPosition);
    this.isMoving = posDiff > 0.05;

    // Walk animation: bob legs back and forth
    if (this.isMoving) {
      this.walkTime += deltaTime * 8;
      const legSwing = Math.sin(this.walkTime) * 0.4;
      this.legL.rotation.x = legSwing;
      this.legR.rotation.x = -legSwing;
      // Slight arm swing opposite to legs
      this.armL.rotation.x = -legSwing * 0.5;
      this.armR.rotation.x = legSwing * 0.5;
    } else {
      // Smoothly return to idle pose
      this.walkTime = 0;
      this.legL.rotation.x *= 0.9;
      this.legR.rotation.x *= 0.9;
      this.armL.rotation.x *= 0.9;
      this.armR.rotation.x *= 0.9;
    }

    // Damage flash effect (flash red then return)
    if (this.flashTimer > 0) {
      this.flashTimer -= deltaTime;
      const flashIntensity = Math.max(0, this.flashTimer / 0.3);
      const r = this.baseColor.r + (1 - this.baseColor.r) * flashIntensity;
      const g = this.baseColor.g * (1 - flashIntensity);
      const b = this.baseColor.b * (1 - flashIntensity);
      this.baseMaterial.diffuseColor.set(r, g, b);
      this.armorMat.diffuseColor.set(
        this.armorBaseColor.r + (1 - this.armorBaseColor.r) * flashIntensity,
        this.armorBaseColor.g * (1 - flashIntensity),
        this.armorBaseColor.b * (1 - flashIntensity)
      );

      if (this.flashTimer <= 0) {
        // Restore original colors
        this.baseMaterial.diffuseColor.copyFrom(this.baseColor);
        this.armorMat.diffuseColor.copyFrom(this.armorBaseColor);
      }
    }

    // Update health bar visual
    this.updateHealthBar();
  }

  setTarget(position, rotationY) {
    if (position) {
      this.targetPosition.copyFrom(
        position instanceof BABYLON.Vector3
          ? position
          : new BABYLON.Vector3(position.x, position.y, position.z)
      );
    }
    if (rotationY !== undefined) {
      this.targetRotation = rotationY;
    }
  }

  takeDamage(amount) {
    if (!this.alive) return;

    this.health = Math.max(0, this.health - amount);
    this.flashTimer = 0.3;

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    if (this.dying) return; // Already dying
    this.alive = false;
    this.dying = true;
    this.deathTimer = 0;

    // Hide health bar and label during death
    if (this.healthBarBg) this.healthBarBg.setEnabled(false);
    if (this.healthBarFg) this.healthBarFg.setEnabled(false);
    if (this.labelPlane) this.labelPlane.setEnabled(false);
  }

  respawn(position) {
    this.alive = true;
    this.dying = false;
    this.deathTimer = 0;
    this.health = this.maxHealth;
    this.flashTimer = 0;

    // Reset rotation
    this.root.rotation.x = 0;
    this.root.rotation.y = 0;
    this.root.rotation.z = 0;
    this.root.setEnabled(true);

    // Move to spawn position
    if (position) {
      const pos = position instanceof BABYLON.Vector3
        ? position
        : new BABYLON.Vector3(position.x, position.y, position.z);
      this.root.position.copyFrom(pos);
      this.targetPosition.copyFrom(pos);
    }

    // Restore colors
    this.baseMaterial.diffuseColor.copyFrom(this.baseColor);
    this.armorMat.diffuseColor.copyFrom(this.armorBaseColor);

    // Re-enable UI elements
    if (this.healthBarBg) this.healthBarBg.setEnabled(true);
    if (this.healthBarFg) this.healthBarFg.setEnabled(true);
    if (this.labelPlane) this.labelPlane.setEnabled(true);

    this.updateHealthBar();
  }

  dispose() {
    // Dispose all meshes
    for (const mesh of this.meshes) {
      if (mesh) mesh.dispose();
    }
    this.meshes = [];

    // Dispose all materials (and their textures)
    for (const mat of this.materials) {
      if (mat) {
        if (mat.diffuseTexture) mat.diffuseTexture.dispose();
        if (mat.emissiveTexture && mat.emissiveTexture !== mat.diffuseTexture) {
          mat.emissiveTexture.dispose();
        }
        mat.dispose();
      }
    }
    this.materials = [];

    // Dispose dynamic textures
    if (this.hpTexture) {
      this.hpTexture.dispose();
      this.hpTexture = null;
    }

    // Dispose root node
    if (this.root) {
      this.root.dispose();
      this.root = null;
    }
  }
}
