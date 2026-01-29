import * as BABYLON from '@babylonjs/core';

export class Enemy {
  constructor(scene, position, player) {
    this.scene = scene;
    this.player = player;
    this.health = 40;
    this.maxHealth = 40;
    this.speed = 2.5;
    this.attackCooldown = 0;
    this.dead = false;

    // Create enemy mesh
    this.createEnemy(position);
  }

  createEnemy(position) {
    // Create parent mesh
    this.mesh = new BABYLON.Mesh('enemy', this.scene);

    // Body (red/dark)
    const body = BABYLON.MeshBuilder.CreateBox('enemyBody', {
      width: 0.8,
      height: 1.0,
      depth: 0.5
    }, this.scene);
    body.position.y = 0.5;
    body.parent = this.mesh;

    // Head
    const head = BABYLON.MeshBuilder.CreateSphere('enemyHead', {
      diameter: 0.6
    }, this.scene);
    head.position.y = 1.3;
    head.parent = this.mesh;

    // Red enemy material
    const material = new BABYLON.StandardMaterial('enemyMat', this.scene);
    material.diffuseColor = new BABYLON.Color3(0.8, 0.13, 0.13);
    material.emissiveColor = new BABYLON.Color3(0.2, 0, 0);

    body.material = material;
    head.material = material;

    // Add glowing red eyes
    const eyeL = BABYLON.MeshBuilder.CreateSphere('eyeL', { diameter: 0.08 }, this.scene);
    eyeL.position.set(-0.15, 1.35, 0.25);
    eyeL.parent = this.mesh;

    const eyeR = BABYLON.MeshBuilder.CreateSphere('eyeR', { diameter: 0.08 }, this.scene);
    eyeR.position.set(0.15, 1.35, 0.25);
    eyeR.parent = this.mesh;

    const eyeMat = new BABYLON.StandardMaterial('eyeMat', this.scene);
    eyeMat.emissiveColor = new BABYLON.Color3(1, 0, 0);
    eyeL.material = eyeMat;
    eyeR.material = eyeMat;

    // Position enemy
    this.mesh.position = position.clone();
    this.mesh.position.y = 2.0;

    // Physics
    this.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
      this.mesh,
      BABYLON.PhysicsImpostor.CylinderImpostor,
      { mass: 8, friction: 0.5, restitution: 0.1 },
      this.scene
    );

    this.mesh.physicsImpostor.physicsBody.fixedRotation = true;
    this.mesh.physicsImpostor.physicsBody.updateMassProperties();
    this.mesh.physicsImpostor.physicsBody.angularDamping = 0.9;

    // Health bar
    this.createHealthBar();
  }

  createHealthBar() {
    const barBg = BABYLON.MeshBuilder.CreatePlane('healthBarBg', {
      width: 1.2,
      height: 0.15
    }, this.scene);
    barBg.position.y = 2.2;
    barBg.parent = this.mesh;
    barBg.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    const bgMat = new BABYLON.StandardMaterial('healthBarBgMat', this.scene);
    bgMat.diffuseColor = new BABYLON.Color3(0.2, 0, 0);
    bgMat.emissiveColor = new BABYLON.Color3(0.2, 0, 0);
    barBg.material = bgMat;

    this.healthBar = BABYLON.MeshBuilder.CreatePlane('healthBar', {
      width: 1.1,
      height: 0.1
    }, this.scene);
    this.healthBar.position.y = 2.2;
    this.healthBar.position.z = -0.01;
    this.healthBar.parent = this.mesh;
    this.healthBar.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    const barMat = new BABYLON.StandardMaterial('healthBarMat', this.scene);
    barMat.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
    barMat.emissiveColor = new BABYLON.Color3(1, 0.2, 0.2);
    this.healthBar.material = barMat;
  }

  update(deltaTime) {
    if (this.dead || !this.mesh.physicsImpostor) return;

    const currentVel = this.mesh.physicsImpostor.getLinearVelocity();
    const distToPlayer = BABYLON.Vector3.Distance(this.mesh.position, this.player.mesh.position);

    if (distToPlayer < 25) {
      // Chase player
      const direction = this.player.mesh.position.subtract(this.mesh.position).normalize();
      direction.y = 0;

      this.mesh.physicsImpostor.setLinearVelocity(
        new BABYLON.Vector3(
          direction.x * this.speed,
          currentVel.y,
          direction.z * this.speed
        )
      );

      // Face player
      this.mesh.lookAt(this.player.mesh.position);
    } else {
      // Idle
      this.mesh.physicsImpostor.setLinearVelocity(
        new BABYLON.Vector3(0, currentVel.y, 0)
      );
    }

    // Update health bar scale
    const healthPct = this.health / this.maxHealth;
    this.healthBar.scaling.x = healthPct;
    this.healthBar.position.x = -(1 - healthPct) * 0.55;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.dead = true;
    if (this.mesh) {
      this.mesh.dispose();
    }
  }
}
