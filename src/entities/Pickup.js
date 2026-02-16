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

      mat.emissiveColor = new BABYLON.Color3(0.4, 0.3, 0);
      mat.specularColor = new BABYLON.Color3(1, 1, 0.5);
      mat.specularPower = 64;
      this.mesh.material = mat;

      // Point light for glow
      this.light = new BABYLON.PointLight('coinLight', position.clone(), this.scene);
      this.light.diffuse = new BABYLON.Color3(1, 0.85, 0.2);
      this.light.intensity = 0.5;
      this.light.range = 4;

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

      mat.emissiveColor = new BABYLON.Color3(0.4, 0.05, 0.1);
      mat.alpha = 0.85;
      this.mesh.material = mat;
      cap.material = mat;

      this.light = new BABYLON.PointLight('potionLight', position.clone(), this.scene);
      this.light.diffuse = new BABYLON.Color3(1, 0.2, 0.2);
      this.light.intensity = 0.4;
      this.light.range = 3;

    } else if (this.type === 'ammo') {
      this.mesh = BABYLON.MeshBuilder.CreateSphere('ammo', { diameter: 0.5 }, this.scene);
      const mat = new BABYLON.StandardMaterial('ammoMat', this.scene);

      const colors = {
        fire: { diff: new BABYLON.Color3(1, 0.3, 0), emis: new BABYLON.Color3(0.5, 0.1, 0), light: new BABYLON.Color3(1, 0.4, 0) },
        ice: { diff: new BABYLON.Color3(0.3, 0.8, 1), emis: new BABYLON.Color3(0, 0.2, 0.5), light: new BABYLON.Color3(0.3, 0.7, 1) },
        lightning: { diff: new BABYLON.Color3(1, 0.9, 0), emis: new BABYLON.Color3(0.5, 0.4, 0), light: new BABYLON.Color3(1, 1, 0.3) }
      };
      const c = colors[this.subType] || colors.fire;
      mat.diffuseColor = c.diff;

      mat.emissiveColor = c.emis;
      this.mesh.material = mat;

      this.light = new BABYLON.PointLight('ammoLight', position.clone(), this.scene);
      this.light.diffuse = c.light;
      this.light.intensity = 0.4;
      this.light.range = 3;

    } else if (this.type === 'weaponChest') {
      // Treasure chest with a weapon inside!
      const elementColors = {
        fire: { r: 1, g: 0.3, b: 0 },
        ice: { r: 0.3, g: 0.7, b: 1 },
        lightning: { r: 1, g: 0.9, b: 0.2 },
      };
      const wc = elementColors[this.subType] || { r: 0.5, g: 0.35, b: 0.15 };

      // Chest body (box)
      this.mesh = BABYLON.MeshBuilder.CreateBox('chest', {
        width: 0.8, height: 0.5, depth: 0.6
      }, this.scene);
      const chestMat = new BABYLON.StandardMaterial('chestMat', this.scene);
      chestMat.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.1);
      chestMat.emissiveColor = new BABYLON.Color3(0.1, 0.06, 0.02);
      this.mesh.material = chestMat;

      // Chest lid (rounded top)
      const lid = BABYLON.MeshBuilder.CreateCylinder('chestLid', {
        height: 0.8, diameter: 0.6, tessellation: 8
      }, this.scene);
      lid.scaling = new BABYLON.Vector3(1, 0.35, 0.75);
      lid.position.y = 0.3;
      lid.parent = this.mesh;
      lid.material = chestMat;

      // Gold trim bands
      const trimMat = new BABYLON.StandardMaterial('chestTrimMat', this.scene);
      trimMat.diffuseColor = new BABYLON.Color3(1, 0.78, 0.1);
      trimMat.emissiveColor = new BABYLON.Color3(0.3, 0.2, 0.03);
      trimMat.specularColor = new BABYLON.Color3(1, 1, 0.5);

      // Horizontal band
      const band = BABYLON.MeshBuilder.CreateBox('chestBand', {
        width: 0.85, height: 0.06, depth: 0.65
      }, this.scene);
      band.position.y = 0.15;
      band.parent = this.mesh;
      band.material = trimMat;

      // Lock
      const lock = BABYLON.MeshBuilder.CreateBox('chestLock', {
        width: 0.1, height: 0.12, depth: 0.05
      }, this.scene);
      lock.position.set(0, 0.15, 0.33);
      lock.parent = this.mesh;
      lock.material = trimMat;

      // Weapon glow on top (shows what weapon is inside)
      const glow = BABYLON.MeshBuilder.CreateSphere('chestGlow', { diameter: 0.3 }, this.scene);
      glow.position.y = 0.6;
      glow.parent = this.mesh;
      const glowMat = new BABYLON.StandardMaterial('chestGlowMat', this.scene);
      glowMat.diffuseColor = new BABYLON.Color3(wc.r, wc.g, wc.b);
      glowMat.emissiveColor = new BABYLON.Color3(wc.r * 0.5, wc.g * 0.5, wc.b * 0.5);
      glowMat.alpha = 0.7;
      glow.material = glowMat;

      // Weapon name label isn't possible in 3D easily, so use the glow color

      this.light = new BABYLON.PointLight('chestLight', position.clone(), this.scene);
      this.light.diffuse = new BABYLON.Color3(wc.r, wc.g, wc.b);
      this.light.intensity = 0.8;
      this.light.range = 6;

      this.needsInteract = true; // requires E to open

    } else if (this.type === 'goldChest') {
      // Gold treasure chest — shiny gold with sparkle
      this.mesh = BABYLON.MeshBuilder.CreateBox('goldChest', {
        width: 0.9, height: 0.55, depth: 0.65
      }, this.scene);
      const goldBodyMat = new BABYLON.StandardMaterial('goldChestMat', this.scene);
      goldBodyMat.diffuseColor = new BABYLON.Color3(1, 0.78, 0.1);
      goldBodyMat.emissiveColor = new BABYLON.Color3(0.3, 0.2, 0);
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

      // Diamond on top
      const diamond = BABYLON.MeshBuilder.CreateSphere('goldGem', { diameter: 0.25 }, this.scene);
      diamond.position.y = 0.55;
      diamond.parent = this.mesh;
      const diamondMat = new BABYLON.StandardMaterial('diamondMat', this.scene);
      diamondMat.diffuseColor = new BABYLON.Color3(0.2, 1, 0.8);
      diamondMat.emissiveColor = new BABYLON.Color3(0.1, 0.4, 0.3);
      diamondMat.alpha = 0.8;
      diamond.material = diamondMat;

      this.light = new BABYLON.PointLight('goldChestLight', position.clone(), this.scene);
      this.light.diffuse = new BABYLON.Color3(1, 0.85, 0.2);
      this.light.intensity = 1.0;
      this.light.range = 7;
      this.needsInteract = true;

    } else if (this.type === 'supplyChest') {
      // Green supply crate
      this.mesh = BABYLON.MeshBuilder.CreateBox('supplyChest', {
        width: 0.8, height: 0.5, depth: 0.6
      }, this.scene);
      const supplyMat = new BABYLON.StandardMaterial('supplyMat', this.scene);
      supplyMat.diffuseColor = new BABYLON.Color3(0.2, 0.55, 0.2);
      supplyMat.emissiveColor = new BABYLON.Color3(0.05, 0.15, 0.05);
      this.mesh.material = supplyMat;

      // Red cross on top
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
      crossMat.emissiveColor = new BABYLON.Color3(0.4, 0.05, 0.05);
      crossH.material = crossMat;
      crossV.material = crossMat;

      this.light = new BABYLON.PointLight('supplyLight', position.clone(), this.scene);
      this.light.diffuse = new BABYLON.Color3(0.3, 1, 0.3);
      this.light.intensity = 0.6;
      this.light.range = 5;
      this.needsInteract = true;

    } else if (this.type === 'megaChest') {
      // Purple mega chest — rare and awesome
      this.mesh = BABYLON.MeshBuilder.CreateBox('megaChest', {
        width: 1.0, height: 0.6, depth: 0.7
      }, this.scene);
      const megaMat = new BABYLON.StandardMaterial('megaMat', this.scene);
      megaMat.diffuseColor = new BABYLON.Color3(0.6, 0.1, 0.8);
      megaMat.emissiveColor = new BABYLON.Color3(0.2, 0.05, 0.3);
      megaMat.specularColor = new BABYLON.Color3(1, 0.5, 1);
      this.mesh.material = megaMat;

      const megaLid = BABYLON.MeshBuilder.CreateCylinder('megaLid', {
        height: 1.0, diameter: 0.7, tessellation: 8
      }, this.scene);
      megaLid.scaling = new BABYLON.Vector3(1, 0.35, 0.75);
      megaLid.position.y = 0.35;
      megaLid.parent = this.mesh;
      megaLid.material = megaMat;

      // Gold trim
      const megaTrim = new BABYLON.StandardMaterial('megaTrim', this.scene);
      megaTrim.diffuseColor = new BABYLON.Color3(1, 0.78, 0.1);
      megaTrim.emissiveColor = new BABYLON.Color3(0.3, 0.2, 0);
      const megaBand = BABYLON.MeshBuilder.CreateBox('megaBand', {
        width: 1.05, height: 0.07, depth: 0.75
      }, this.scene);
      megaBand.position.y = 0.18;
      megaBand.parent = this.mesh;
      megaBand.material = megaTrim;

      // Floating star on top
      const star = BABYLON.MeshBuilder.CreateSphere('megaStar', { diameter: 0.3 }, this.scene);
      star.position.y = 0.75;
      star.parent = this.mesh;
      const starMat = new BABYLON.StandardMaterial('starMat', this.scene);
      starMat.diffuseColor = new BABYLON.Color3(1, 1, 0.3);
      starMat.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.1);
      starMat.alpha = 0.8;
      star.material = starMat;

      this.light = new BABYLON.PointLight('megaLight', position.clone(), this.scene);
      this.light.diffuse = new BABYLON.Color3(0.8, 0.3, 1);
      this.light.intensity = 1.2;
      this.light.range = 8;
      this.needsInteract = true;
    }

    this.mesh.position = position.clone();
    const isChest = ['weaponChest', 'goldChest', 'supplyChest', 'megaChest'].includes(this.type);
    this.mesh.position.y = isChest ? 0.25 : 1.0;
  }

  update(deltaTime) {
    if (this.collected || !this.mesh) return;

    if (['weaponChest', 'goldChest', 'supplyChest', 'megaChest'].includes(this.type)) {
      // Chests just glow, no bobbing
      this.bobTime += deltaTime * 2;
      return;
    }

    // Bob up and down
    this.bobTime += deltaTime * 3;
    this.mesh.position.y = 1.0 + Math.sin(this.bobTime) * 0.2;

    // Rotate
    this.mesh.rotation.y += deltaTime * 2;

    // Update light position
    if (this.light) {
      this.light.position.copyFrom(this.mesh.position);
    }
  }

  collect() {
    this.collected = true;
    if (this.light) {
      this.light.dispose();
    }
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
