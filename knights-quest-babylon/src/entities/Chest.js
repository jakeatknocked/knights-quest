import * as BABYLON from '@babylonjs/core';

export class Chest {
  constructor(scene, position, contentType, amount) {
    this.scene = scene;
    this.position = position;
    this.contentType = contentType; // 'basic', 'fire', 'ice', 'lightning', 'coins'
    this.amount = amount;
    this.state = 'closed'; // 'closed', 'opening', 'opened', 'cleared'
    this.openTimer = 0;
    this.openDuration = 1.0; // 1 second animation
    this.glowIntensity = 0;

    this.createChest();
  }

  createChest() {
    // Container for all chest parts
    this.mesh = new BABYLON.TransformNode('chestContainer', this.scene);
    this.mesh.position = this.position;

    // Chest base (bottom part)
    this.base = BABYLON.MeshBuilder.CreateBox('chestBase', {
      width: 1.2, height: 0.6, depth: 0.8
    }, this.scene);
    this.base.position.y = 0.3;
    this.base.parent = this.mesh;

    const baseMat = new BABYLON.StandardMaterial('chestBaseMat', this.scene);
    baseMat.diffuseColor = new BABYLON.Color3(0.4, 0.25, 0.15);
    baseMat.emissiveColor = new BABYLON.Color3(0.16, 0.1, 0.06);
    baseMat.specularColor = new BABYLON.Color3(0.2, 0.15, 0.1);
    this.base.material = baseMat;

    // Chest lid (top part)
    this.lid = BABYLON.MeshBuilder.CreateBox('chestLid', {
      width: 1.2, height: 0.5, depth: 0.8
    }, this.scene);
    this.lid.position.y = 0.85;
    this.lid.parent = this.mesh;

    // Set pivot point at the back edge for rotation
    this.lid.setPivotPoint(new BABYLON.Vector3(0, -0.25, -0.4));

    const lidMat = new BABYLON.StandardMaterial('chestLidMat', this.scene);
    lidMat.diffuseColor = new BABYLON.Color3(0.35, 0.22, 0.12);
    lidMat.emissiveColor = new BABYLON.Color3(0.14, 0.088, 0.048);
    lidMat.specularColor = new BABYLON.Color3(0.2, 0.15, 0.1);
    this.lid.material = lidMat;

    // Lock decoration
    const lock = BABYLON.MeshBuilder.CreateBox('lock', {
      width: 0.2, height: 0.3, depth: 0.15
    }, this.scene);
    lock.position.set(0, 0.3, 0.45);
    lock.parent = this.mesh;

    const lockMat = new BABYLON.StandardMaterial('lockMat', this.scene);
    lockMat.diffuseColor = new BABYLON.Color3(0.7, 0.6, 0.2);
    lockMat.emissiveColor = new BABYLON.Color3(0.28, 0.24, 0.08);
    lockMat.specularColor = new BABYLON.Color3(0.8, 0.7, 0.3);
    lockMat.specularPower = 64;
    lock.material = lockMat;

    // Ambient glow light (subtle when closed, bright when open)
    this.glowLight = new BABYLON.PointLight('chestGlow', this.position.clone(), this.scene);
    this.glowLight.position.y += 1;

    // Color based on content
    const glowColors = {
      basic: new BABYLON.Color3(0.7, 0.7, 0.7),
      fire: new BABYLON.Color3(1, 0.3, 0),
      ice: new BABYLON.Color3(0.3, 0.8, 1),
      lightning: new BABYLON.Color3(1, 0.9, 0),
      coins: new BABYLON.Color3(1, 0.8, 0)
    };
    this.glowLight.diffuse = glowColors[this.contentType] || glowColors.coins;
    this.glowLight.intensity = 0.3;
    this.glowLight.range = 5;

    // Treasure particle (hidden initially)
    this.treasure = null;

    // Pulsing glow animation
    this.glowPhase = 0;
  }

  update(deltaTime) {
    if (this.state === 'closed') {
      // Gentle pulsing glow
      this.glowPhase += deltaTime * 2;
      this.glowLight.intensity = 0.3 + Math.sin(this.glowPhase) * 0.1;
    } else if (this.state === 'opening') {
      this.openTimer += deltaTime;
      const progress = Math.min(this.openTimer / this.openDuration, 1);

      // Rotate lid open (up to 120 degrees)
      this.lid.rotation.x = -progress * (Math.PI * 0.66);

      // Increase glow
      this.glowLight.intensity = 0.3 + progress * 1.2;

      if (progress >= 1) {
        this.state = 'opened';
        this.showTreasure();
      }
    } else if (this.state === 'opened') {
      // Keep glow bright, animate treasure
      if (this.treasure) {
        this.treasure.position.y += Math.sin(Date.now() * 0.003) * 0.001;
        this.treasure.rotation.y += deltaTime * 2;
      }
    }
  }

  open() {
    if (this.state !== 'closed') return false;
    this.state = 'opening';
    this.openTimer = 0;
    return true;
  }

  showTreasure() {
    // Create treasure item based on content type
    const treasureColors = {
      basic: new BABYLON.Color3(0.7, 0.7, 0.7),
      fire: new BABYLON.Color3(1, 0.3, 0),
      ice: new BABYLON.Color3(0.3, 0.8, 1),
      lightning: new BABYLON.Color3(1, 0.9, 0),
      coins: new BABYLON.Color3(1, 0.8, 0)
    };

    const color = treasureColors[this.contentType] || treasureColors.coins;

    // Different shapes for different items
    if (this.contentType === 'coins') {
      this.treasure = BABYLON.MeshBuilder.CreateCylinder('treasure', {
        height: 0.2, diameter: 0.4, tessellation: 12
      }, this.scene);
    } else {
      // Ammo box/crystal
      this.treasure = BABYLON.MeshBuilder.CreateBox('treasure', {
        width: 0.5, height: 0.4, depth: 0.4
      }, this.scene);
    }

    // Parent first, then set relative position
    this.treasure.parent = this.mesh;
    this.treasure.position = new BABYLON.Vector3(0, 1.2, 0);

    const treasureMat = new BABYLON.StandardMaterial('treasureMat', this.scene);
    treasureMat.diffuseColor = color;
    treasureMat.emissiveColor = new BABYLON.Color3(color.r * 0.8, color.g * 0.8, color.b * 0.8);
    treasureMat.specularColor = new BABYLON.Color3(1, 1, 1);
    treasureMat.specularPower = 128;
    this.treasure.material = treasureMat;
  }

  collect() {
    if (this.state !== 'opened') return null;

    this.state = 'cleared';

    // Remove treasure
    if (this.treasure) {
      if (this.treasure.material) this.treasure.material.dispose();
      this.treasure.dispose();
      this.treasure = null;
    }

    // Dim the glow
    this.glowLight.intensity = 0.1;

    return {
      type: this.contentType,
      amount: this.amount
    };
  }

  isNearPlayer(playerPosition) {
    const dist = BABYLON.Vector3.Distance(this.position, playerPosition);
    return dist < 2.5;
  }

  dispose() {
    if (this.glowLight) {
      this.glowLight.dispose();
      this.glowLight = null;
    }
    if (this.treasure) {
      if (this.treasure.material) this.treasure.material.dispose();
      this.treasure.dispose();
      this.treasure = null;
    }
    if (this.mesh) {
      this.mesh.getChildMeshes().forEach(child => {
        if (child.material) child.material.dispose();
        child.dispose();
      });
      this.mesh.dispose();
      this.mesh = null;
    }
  }
}
