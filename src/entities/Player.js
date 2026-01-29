import * as BABYLON from '@babylonjs/core';

export class Player {
  constructor(scene, inputManager) {
    this.scene = scene;
    this.inputManager = inputManager;

    // Player properties
    this.speed = 7;
    this.jumpForce = 300;
    this.health = 100;
    this.isJumping = false;

    // Create player mesh (knight)
    this.createKnight();

    // Position player at spawn (on ground)
    this.mesh.position = new BABYLON.Vector3(0, 1.5, 0);
  }

  createKnight() {
    // Create a parent mesh
    this.mesh = new BABYLON.Mesh('player', this.scene);

    // Main body
    const body = BABYLON.MeshBuilder.CreateBox('body', {
      width: 0.8,
      height: 1.0,
      depth: 0.5
    }, this.scene);
    body.position.y = 0;
    body.parent = this.mesh;

    // Head/helmet
    const head = BABYLON.MeshBuilder.CreateSphere('head', {
      diameter: 0.6
    }, this.scene);
    head.position.y = 0.8;
    head.parent = this.mesh;

    // Material (blue knight)
    const skinColor = localStorage.getItem('knightSkin') || 'silver';
    const colors = {
      silver: new BABYLON.Color3(0.2, 0.4, 0.67),
      gold: new BABYLON.Color3(1, 0.67, 0),
      dark: new BABYLON.Color3(0.2, 0.2, 0.33),
      crystal: new BABYLON.Color3(0.13, 0.87, 0.87)
    };

    const material = new BABYLON.StandardMaterial('playerMat', this.scene);
    material.diffuseColor = colors[skinColor] || colors.silver;
    material.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);

    body.material = material;
    head.material = material;

    // Add capsule physics impostor for better character physics
    this.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
      this.mesh,
      BABYLON.PhysicsImpostor.CylinderImpostor,
      {
        mass: 10,
        friction: 0.5,
        restitution: 0.1
      },
      this.scene
    );

    // Lock rotation to prevent tipping
    this.mesh.physicsImpostor.physicsBody.fixedRotation = true;
    this.mesh.physicsImpostor.physicsBody.updateMassProperties();

    // Add angular damping to prevent spinning
    this.mesh.physicsImpostor.physicsBody.angularDamping = 0.9;
    this.mesh.physicsImpostor.physicsBody.linearDamping = 0.1;
  }

  update(deltaTime, inputManager) {
    if (!this.mesh.physicsImpostor) return;

    // Get current velocity
    const currentVel = this.mesh.physicsImpostor.getLinearVelocity();

    // Get movement input
    const movement = inputManager.getMovementVector();

    if (movement.length() > 0) {
      // Apply horizontal movement
      const moveSpeed = inputManager.isKeyDown('shift') ? this.speed * 1.5 : this.speed;

      this.mesh.physicsImpostor.setLinearVelocity(
        new BABYLON.Vector3(
          movement.x * moveSpeed,
          currentVel.y, // Keep vertical velocity
          movement.z * moveSpeed
        )
      );

      // Rotate to face movement direction
      const angle = Math.atan2(movement.x, movement.z);
      this.mesh.rotation.y = angle;
    } else {
      // Stop horizontal movement when no input
      this.mesh.physicsImpostor.setLinearVelocity(
        new BABYLON.Vector3(0, currentVel.y, 0)
      );
    }

    // Jump
    if (inputManager.isJumpPressed() && this.isGrounded()) {
      this.mesh.physicsImpostor.applyImpulse(
        new BABYLON.Vector3(0, this.jumpForce, 0),
        this.mesh.getAbsolutePosition()
      );
      this.isJumping = true;

      setTimeout(() => {
        this.isJumping = false;
      }, 500);
    }

    // Clamp Y position to prevent falling through world
    if (this.mesh.position.y < -10) {
      this.mesh.position.y = 5;
      this.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 0, 0));
    }
  }

  isGrounded() {
    if (this.isJumping) return false;

    // Raycast down to check if on ground
    const origin = this.mesh.position.clone();
    const direction = new BABYLON.Vector3(0, -1, 0);
    const length = 0.8;

    const ray = new BABYLON.Ray(origin, direction, length);
    const hit = this.scene.pickWithRay(ray, (mesh) => {
      return mesh !== this.mesh && mesh.name !== 'body' && mesh.name !== 'head' && !mesh.parent;
    });

    return hit && hit.hit && hit.distance < 0.8;
  }
}
