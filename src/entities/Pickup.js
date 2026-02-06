import * as BABYLON from '@babylonjs/core';

export class Pickup {
  constructor(scene, position, type, subType) {
    this.scene = scene;
    this.type = type;         // 'coin', 'potion', 'ammo'
    this.subType = subType;   // for ammo: 'fire', 'ice', 'lightning'
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
      this.mesh.material = mat;

      this.light = new BABYLON.PointLight('ammoLight', position.clone(), this.scene);
      this.light.diffuse = c.light;
      this.light.intensity = 0.4;
      this.light.range = 3;
    }

    this.mesh.position = position.clone();
    this.mesh.position.y = 1.0;
  }

  update(deltaTime) {
    if (this.collected || !this.mesh) return;

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
