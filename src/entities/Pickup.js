import * as BABYLON from '@babylonjs/core';

export class Pickup {
  constructor(scene, position, type, subType) {
    this.scene = scene;
    this.type = type;         // 'coin', 'potion', 'ammo', 'weaponChest', 'goldChest', 'supplyChest', 'megaChest'
    this.subType = subType;   // for ammo: 'fire','ice','lightning'; for weaponChest: element id
    this.collected = false;
    this.bobTime = Math.random() * Math.PI * 2;

    this.createMesh(position);
  }

  createMesh(position) {
    if (this.type === 'coin') {
      this.mesh = BABYLON.MeshBuilder.CreateCylinder('coin', {
        height: 0.08,
        diameter: 0.6
      }, this.scene);
      const mat = new BABYLON.StandardMaterial('coinMat', this.scene);
      mat.diffuseColor = new BABYLON.Color3(1, 0.84, 0);
      mat.emissiveColor = new BABYLON.Color3(0.5, 0.4, 0);
      mat.specularColor = new BABYLON.Color3(1, 1, 0.5);
      mat.specularPower = 64;
      this.mesh.material = mat;

    } else if (this.type === 'potion') {
      // Red bottle shape: cylinder body + sphere top
      this.mesh = BABYLON.MeshBuilder.CreateCylinder('potion', {
        height: 0.6,
        diameterTop: 0.2,
        diameterBottom: 0.4
      }, this.scene);
      const cap = BABYLON.MeshBuilder.CreateSphere('potionCap', { diameter: 0.3 }, this.scene);
      cap.position.y = 0.35;
      cap.parent = this.mesh;

      const mat = new BABYLON.StandardMaterial('potionMat', this.scene);
      mat.diffuseColor = new BABYLON.Color3(1, 0.13, 0.27);
      mat.emissiveColor = new BABYLON.Color3(0.5, 0.08, 0.15);
      mat.alpha = 0.85;
      this.mesh.material = mat;
      cap.material = mat;

    } else if (this.type === 'ammo') {
      this.mesh = BABYLON.MeshBuilder.CreateSphere('ammo', { diameter: 0.5 }, this.scene);
      const mat = new BABYLON.StandardMaterial('ammoMat', this.scene);

      const colors = {
        fire: { diff: new BABYLON.Color3(1, 0.3, 0), emis: new BABYLON.Color3(0.6, 0.15, 0) },
        ice: { diff: new BABYLON.Color3(0.3, 0.8, 1), emis: new BABYLON.Color3(0.1, 0.3, 0.6) },
        lightning: { diff: new BABYLON.Color3(1, 0.9, 0), emis: new BABYLON.Color3(0.6, 0.5, 0) }
      };
      const c = colors[this.subType] || colors.fire;
      mat.diffuseColor = c.diff;
      mat.emissiveColor = c.emis;
      this.mesh.material = mat;

    } else if (this.type === 'weaponChest') {
      const elementColors = {
        fire: { r: 1, g: 0.3, b: 0 },
        ice: { r: 0.3, g: 0.7, b: 1 },
        lightning: { r: 1, g: 0.9, b: 0.2 },
      };
      const wc = elementColors[this.subType] || { r: 0.5, g: 0.35, b: 0.15 };

      this.mesh = BABYLON.MeshBuilder.CreateBox('chest', {
        width: 0.8, height: 0.5, depth: 0.6
      }, this.scene);
      const chestMat = new BABYLON.StandardMaterial('chestMat', this.scene);
      chestMat.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.1);
      chestMat.emissiveColor = new BABYLON.Color3(0.1, 0.06, 0.02);
      this.mesh.material = chestMat;

      const lid = BABYLON.MeshBuilder.CreateCylinder('chestLid', {
        height: 0.8, diameter: 0.6, tessellation: 8
      }, this.scene);
      lid.scaling = new BABYLON.Vector3(1, 0.35, 0.75);
      lid.position.y = 0.3;
      lid.parent = this.mesh;
      lid.material = chestMat;

      const trimMat = new BABYLON.StandardMaterial('chestTrimMat', this.scene);
      trimMat.diffuseColor = new BABYLON.Color3(1, 0.78, 0.1);
      trimMat.emissiveColor = new BABYLON.Color3(0.3, 0.2, 0.03);
      trimMat.specularColor = new BABYLON.Color3(1, 1, 0.5);

      const band = BABYLON.MeshBuilder.CreateBox('chestBand', {
        width: 0.85, height: 0.06, depth: 0.65
      }, this.scene);
      band.position.y = 0.15;
      band.parent = this.mesh;
      band.material = trimMat;

      const lock = BABYLON.MeshBuilder.CreateBox('chestLock', {
        width: 0.1, height: 0.12, depth: 0.05
      }, this.scene);
      lock.position.set(0, 0.15, 0.33);
      lock.parent = this.mesh;
      lock.material = trimMat;

      const glow = BABYLON.MeshBuilder.CreateSphere('chestGlow', { diameter: 0.3 }, this.scene);
      glow.position.y = 0.6;
      glow.parent = this.mesh;
      const glowMat = new BABYLON.StandardMaterial('chestGlowMat', this.scene);
      glowMat.diffuseColor = new BABYLON.Color3(wc.r, wc.g, wc.b);
      glowMat.emissiveColor = new BABYLON.Color3(wc.r * 0.6, wc.g * 0.6, wc.b * 0.6);
      glowMat.alpha = 0.7;
      glow.material = glowMat;

      this.needsInteract = true;

    } else if (this.type === 'goldChest') {
      this.mesh = BABYLON.MeshBuilder.CreateBox('goldChest', {
        width: 0.9, height: 0.55, depth: 0.65
      }, this.scene);
      const goldBodyMat = new BABYLON.StandardMaterial('goldChestMat', this.scene);
      goldBodyMat.diffuseColor = new BABYLON.Color3(1, 0.78, 0.1);
      goldBodyMat.emissiveColor = new BABYLON.Color3(0.4, 0.25, 0);
      goldBodyMat.specularColor = new BABYLON.Color3(1, 1, 0.5);
      goldBodyMat.specularPower = 32;
      this.mesh.material = goldBodyMat;

      const goldLid = BABYLON.MeshBuilder.CreateCylinder('goldLid', {
        height: 0.9, diameter: 0.65, tessellation: 8
      }, this.scene);
      goldLid.scaling = new BABYLON.Vector3(1, 0.35, 0.75);
      goldLid.position.y = 0.32;
      goldLid.parent = this.mesh;
      goldLid.material = goldBodyMat;

      const diamond = BABYLON.MeshBuilder.CreateSphere('goldGem', { diameter: 0.25 }, this.scene);
      diamond.position.y = 0.55;
      diamond.parent = this.mesh;
      const diamondMat = new BABYLON.StandardMaterial('diamondMat', this.scene);
      diamondMat.diffuseColor = new BABYLON.Color3(0.2, 1, 0.8);
      diamondMat.emissiveColor = new BABYLON.Color3(0.15, 0.5, 0.4);
      diamondMat.alpha = 0.8;
      diamond.material = diamondMat;

      this.needsInteract = true;

    } else if (this.type === 'supplyChest') {
      this.mesh = BABYLON.MeshBuilder.CreateBox('supplyChest', {
        width: 0.8, height: 0.5, depth: 0.6
      }, this.scene);
      const supplyMat = new BABYLON.StandardMaterial('supplyMat', this.scene);
      supplyMat.diffuseColor = new BABYLON.Color3(0.2, 0.55, 0.2);
      supplyMat.emissiveColor = new BABYLON.Color3(0.08, 0.2, 0.08);
      this.mesh.material = supplyMat;

      const crossH = BABYLON.MeshBuilder.CreateBox('crossH', {
        width: 0.4, height: 0.05, depth: 0.12
      }, this.scene);
      crossH.position.y = 0.28;
      crossH.parent = this.mesh;
      const crossV = BABYLON.MeshBuilder.CreateBox('crossV', {
        width: 0.12, height: 0.05, depth: 0.4
      }, this.scene);
      crossV.position.y = 0.28;
      crossV.parent = this.mesh;
      const crossMat = new BABYLON.StandardMaterial('crossMat', this.scene);
      crossMat.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
      crossMat.emissiveColor = new BABYLON.Color3(0.5, 0.08, 0.08);
      crossH.material = crossMat;
      crossV.material = crossMat;

      this.needsInteract = true;

    } else if (this.type === 'megaChest') {
      this.mesh = BABYLON.MeshBuilder.CreateBox('megaChest', {
        width: 1.0, height: 0.6, depth: 0.7
      }, this.scene);
      const megaMat = new BABYLON.StandardMaterial('megaMat', this.scene);
      megaMat.diffuseColor = new BABYLON.Color3(0.6, 0.1, 0.8);
      megaMat.emissiveColor = new BABYLON.Color3(0.3, 0.08, 0.4);
      megaMat.specularColor = new BABYLON.Color3(1, 0.5, 1);
      this.mesh.material = megaMat;

      const megaLid = BABYLON.MeshBuilder.CreateCylinder('megaLid', {
        height: 1.0, diameter: 0.7, tessellation: 8
      }, this.scene);
      megaLid.scaling = new BABYLON.Vector3(1, 0.35, 0.75);
      megaLid.position.y = 0.35;
      megaLid.parent = this.mesh;
      megaLid.material = megaMat;

      const megaTrim = new BABYLON.StandardMaterial('megaTrim', this.scene);
      megaTrim.diffuseColor = new BABYLON.Color3(1, 0.78, 0.1);
      megaTrim.emissiveColor = new BABYLON.Color3(0.3, 0.2, 0);
      const megaBand = BABYLON.MeshBuilder.CreateBox('megaBand', {
        width: 1.05, height: 0.07, depth: 0.75
      }, this.scene);
      megaBand.position.y = 0.18;
      megaBand.parent = this.mesh;
      megaBand.material = megaTrim;

      const star = BABYLON.MeshBuilder.CreateSphere('megaStar', { diameter: 0.3 }, this.scene);
      star.position.y = 0.75;
      star.parent = this.mesh;
      const starMat = new BABYLON.StandardMaterial('starMat', this.scene);
      starMat.diffuseColor = new BABYLON.Color3(1, 1, 0.3);
      starMat.emissiveColor = new BABYLON.Color3(0.6, 0.6, 0.15);
      starMat.alpha = 0.8;
      star.material = starMat;

      this.needsInteract = true;
    }

    this.mesh.position = position.clone();
    const isChest = ['weaponChest', 'goldChest', 'supplyChest', 'megaChest'].includes(this.type);
    this.mesh.position.y = isChest ? 0.25 : 1.0;
  }

  update(deltaTime) {
    if (this.collected || !this.mesh) return;

    if (['weaponChest', 'goldChest', 'supplyChest', 'megaChest'].includes(this.type)) {
      this.bobTime += deltaTime * 2;
      return;
    }

    // Bob up and down
    this.bobTime += deltaTime * 3;
    this.mesh.position.y = 1.0 + Math.sin(this.bobTime) * 0.2;

    // Rotate
    this.mesh.rotation.y += deltaTime * 2;
  }

  collect() {
    this.collected = true;
    if (this.mesh) {
      this.mesh.getChildMeshes().forEach(child => {
        if (child.material) child.material.dispose();
        child.dispose();
      });
      if (this.mesh.material) this.mesh.material.dispose();
      this.mesh.dispose();
    }
  }
}
