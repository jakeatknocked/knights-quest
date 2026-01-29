import * as BABYLON from '@babylonjs/core';

export class Projectile {
  constructor(scene, position, direction, element, isEnemy = false) {
    this.scene = scene;
    this.velocity = direction.scale(35);
    this.life = 3;
    this.isEnemy = isEnemy;
    this.element = element;
    this.dead = false;

    const colors = {
      fire: new BABYLON.Color3(1, 0.27, 0),
      ice: new BABYLON.Color3(0.27, 0.8, 1),
      lightning: new BABYLON.Color3(1, 0.93, 0)
    };

    const damage = {
      fire: 20,
      ice: 12,
      lightning: 15
    };

    this.damage = damage[element] || 15;
    const color = colors[element] || colors.fire;

    // Create projectile mesh
    this.mesh = BABYLON.MeshBuilder.CreateSphere('projectile', {
      diameter: 0.3
    }, scene);
    this.mesh.position = position.clone();

    // Material with glow
    const material = new BABYLON.StandardMaterial('projectileMat', scene);
    material.emissiveColor = color;
    material.diffuseColor = color;
    this.mesh.material = material;

    // Add light
    this.light = new BABYLON.PointLight('projectileLight', position, scene);
    this.light.diffuse = color;
    this.light.intensity = 2;
    this.light.range = 5;

    // Trail effect
    this.trail = [];
  }

  update(deltaTime) {
    if (this.dead) return;

    // Move projectile
    const movement = this.velocity.scale(deltaTime);
    this.mesh.position.addInPlace(movement);
    
    if (this.light) {
      this.light.position = this.mesh.position.clone();
    }

    this.life -= deltaTime;

    if (this.life <= 0) {
      this.destroy();
    }
  }

  destroy() {
    this.dead = true;
    if (this.mesh) {
      this.mesh.dispose();
    }
    if (this.light) {
      this.light.dispose();
    }
  }
}
