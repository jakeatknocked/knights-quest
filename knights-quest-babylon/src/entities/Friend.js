import * as BABYLON from '@babylonjs/core';

export class Friend {
  constructor(scene, position, player, name) {
    this.scene = scene;
    this.player = player;
    this.name = name;
    this.rescued = false;
    this.following = false;
    this.attackCooldown = 0;
    this.followOffset = null;

    this.createCaged(position);
  }

  createCaged(position) {
    // Cage
    this.cage = BABYLON.MeshBuilder.CreateBox('cage', {
      width: 2, height: 2.5, depth: 2
    }, this.scene);
    this.cage.position = position.clone();
    this.cage.position.y = 1.25;

    const cageMat = new BABYLON.StandardMaterial('cageMat', this.scene);
    cageMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    cageMat.wireframe = true;
    this.cage.material = cageMat;

    // NPC body inside cage
    this.mesh = BABYLON.MeshBuilder.CreateCylinder('friendCollider', {
      height: 1.8, diameter: 0.6
    }, this.scene);
    this.mesh.isVisible = false;
    this.mesh.position = position.clone();
    this.mesh.position.y = 1.0;

    // Bright blue friend material
    const mat = new BABYLON.StandardMaterial('friendMat', this.scene);
    mat.diffuseColor = new BABYLON.Color3(0.3, 0.6, 1);
    mat.emissiveColor = new BABYLON.Color3(0.06, 0.12, 0.2);

    const limbMat = new BABYLON.StandardMaterial('friendLimbMat', this.scene);
    limbMat.diffuseColor = new BABYLON.Color3(0.9, 0.7, 0.55);
    limbMat.emissiveColor = new BABYLON.Color3(0.15, 0.1, 0.08);

    const body = BABYLON.MeshBuilder.CreateBox('friendBody', {
      width: 0.6, height: 0.8, depth: 0.4
    }, this.scene);
    body.position.y = 0.1;
    body.parent = this.mesh;
    body.material = mat;

    const head = BABYLON.MeshBuilder.CreateSphere('friendHead', { diameter: 0.45 }, this.scene);
    head.position.y = 0.7;
    head.parent = this.mesh;
    head.material = mat;

    // Arms
    const armL = BABYLON.MeshBuilder.CreateBox('fArmL', { width: 0.2, height: 0.6, depth: 0.2 }, this.scene);
    armL.position.set(-0.4, 0.1, 0);
    armL.parent = this.mesh;
    armL.material = limbMat;

    const armR = BABYLON.MeshBuilder.CreateBox('fArmR', { width: 0.2, height: 0.6, depth: 0.2 }, this.scene);
    armR.position.set(0.4, 0.1, 0);
    armR.parent = this.mesh;
    armR.material = limbMat;

    // Legs
    const legL = BABYLON.MeshBuilder.CreateBox('fLegL', { width: 0.22, height: 0.5, depth: 0.22 }, this.scene);
    legL.position.set(-0.15, -0.45, 0);
    legL.parent = this.mesh;
    legL.material = limbMat;

    const legR = BABYLON.MeshBuilder.CreateBox('fLegR', { width: 0.22, height: 0.5, depth: 0.22 }, this.scene);
    legR.position.set(0.15, -0.45, 0);
    legR.parent = this.mesh;
    legR.material = limbMat;

    // "E to rescue" indicator
    this.indicator = BABYLON.MeshBuilder.CreatePlane('indicator', {
      width: 1.5, height: 0.3
    }, this.scene);
    this.indicator.position = position.clone();
    this.indicator.position.y = 3;
    this.indicator.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    const indMat = new BABYLON.StandardMaterial('indMat', this.scene);
    indMat.diffuseColor = new BABYLON.Color3(1, 1, 0.5);
    this.indicator.material = indMat;
  }

  rescue(game) {
    if (this.rescued) return;
    this.rescued = true;
    this.following = true;

    // Remove cage and indicator
    if (this.cage) {
      if (this.cage.material) this.cage.material.dispose();
      this.cage.dispose();
      this.cage = null;
    }
    if (this.indicator) {
      if (this.indicator.material) this.indicator.material.dispose();
      this.indicator.dispose();
      this.indicator = null;
    }

    // Add physics for following
    this.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
      this.mesh,
      BABYLON.PhysicsImpostor.CylinderImpostor,
      { mass: 5, friction: 0.5, restitution: 0.1 },
      this.scene
    );

    if (this.mesh.physicsImpostor.physicsBody) {
      this.mesh.physicsImpostor.physicsBody.fixedRotation = true;
      this.mesh.physicsImpostor.physicsBody.updateMassProperties();
      this.mesh.physicsImpostor.physicsBody.angularDamping = 1.0;
      this.mesh.physicsImpostor.physicsBody.linearDamping = 0.9;
    }

    // Assign random follow offset
    const angle = Math.random() * Math.PI * 2;
    this.followOffset = new BABYLON.Vector3(
      Math.cos(angle) * 3,
      0,
      Math.sin(angle) * 3
    );

    if (game) {
      game.state.score += 50;
      game.hud.showMessage(`${this.name} rescued! +50 score`);
    }
  }

  update(deltaTime, enemyManager) {
    if (!this.following || !this.mesh || !this.mesh.physicsImpostor || !this.mesh.physicsImpostor.physicsBody) return;

    const currentVel = this.mesh.physicsImpostor.getLinearVelocity();

    // Follow player with offset
    const targetPos = this.player.mesh.position.add(this.followOffset);
    const direction = targetPos.subtract(this.mesh.position);
    direction.y = 0;
    const dist = direction.length();

    if (dist > 2) {
      direction.normalize();
      this.mesh.physicsImpostor.setLinearVelocity(
        new BABYLON.Vector3(
          direction.x * 4,
          currentVel.y,
          direction.z * 4
        )
      );
    } else {
      this.mesh.physicsImpostor.setLinearVelocity(
        new BABYLON.Vector3(0, currentVel.y, 0)
      );
    }

    // Attack nearest enemy
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
      return;
    }

    if (!enemyManager) return;

    const enemies = enemyManager.getAliveEnemies();
    let nearest = null;
    let nearestDist = 8;

    enemies.forEach(enemy => {
      if (!enemy.mesh) return;
      const d = BABYLON.Vector3.Distance(this.mesh.position, enemy.mesh.position);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = enemy;
      }
    });

    // Also check boss
    const boss = enemyManager.getActiveBoss();
    if (boss && !boss.dead && boss.mesh) {
      const d = BABYLON.Vector3.Distance(this.mesh.position, boss.mesh.position);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = boss;
      }
    }

    if (nearest && nearestDist < 5) {
      nearest.takeDamage(8);
      this.attackCooldown = 1.5;
    }
  }
}
