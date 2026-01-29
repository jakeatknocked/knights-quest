import * as BABYLON from '@babylonjs/core';

export class Player {
  constructor(scene, inputManager) {
    this.scene = scene;
    this.inputManager = inputManager;

    // Player properties
    this.speed = 12;
    this.jumpForce = 50;
    this.health = 100;
    this.isJumping = false;
    this.jumpCooldown = 0;

    // Create player mesh (knight)
    this.createKnight();

    // Position player at spawn (on ground with proper offset)
    this.mesh.position = new BABYLON.Vector3(0, 2.0, 0);

    // Initialize forward vector (custom property)
    this.forwardVector = new BABYLON.Vector3(0, 0, 1);
  }

  createKnight() {
    // Create physics collider as the main mesh (no parent - fixes physics warning)
    this.mesh = BABYLON.MeshBuilder.CreateCylinder('playerCollider', {
      height: 2,
      diameter: 0.8
    }, this.scene);
    this.mesh.isVisible = false;

    // Add physics impostor to the main mesh
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

    // Visual meshes as children — offset upward so feet align with collider bottom
    const body = BABYLON.MeshBuilder.CreateBox('body', {
      width: 0.8,
      height: 1.0,
      depth: 0.5
    }, this.scene);
    body.position.y = 0.2;
    body.parent = this.mesh;

    const head = BABYLON.MeshBuilder.CreateSphere('head', {
      diameter: 0.6
    }, this.scene);
    head.position.y = 1.0;
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

    // Lock rotation to prevent tipping (cannon-es API)
    if (this.mesh.physicsImpostor.physicsBody) {
      this.mesh.physicsImpostor.physicsBody.fixedRotation = true;
      this.mesh.physicsImpostor.physicsBody.updateMassProperties();
      this.mesh.physicsImpostor.physicsBody.angularDamping = 0.9;
      this.mesh.physicsImpostor.physicsBody.linearDamping = 0.1;
    }
  }

  update(deltaTime, inputManager, camera) {
    if (!this.mesh.physicsImpostor || !this.mesh.physicsImpostor.physicsBody) return;

    // Get current velocity
    const currentVel = this.mesh.physicsImpostor.getLinearVelocity();

    // Get movement input
    const input = inputManager.getMovementVector();

    if (input.length() > 0) {
      // Transform movement to be relative to camera direction
      const cameraAngle = camera ? camera.alpha + Math.PI / 2 : 0;
      const sin = Math.sin(cameraAngle);
      const cos = Math.cos(cameraAngle);

      const movement = new BABYLON.Vector3(
        input.x * cos - input.z * sin,
        0,
        input.x * sin + input.z * cos
      );
      movement.normalize();

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

      // Update forward vector
      this.forwardVector = new BABYLON.Vector3(
        Math.sin(angle),
        0,
        Math.cos(angle)
      );
    } else {
      // Stop horizontal movement when no input
      this.mesh.physicsImpostor.setLinearVelocity(
        new BABYLON.Vector3(0, currentVel.y, 0)
      );
    }

    // Jump cooldown timer
    if (this.jumpCooldown > 0) {
      this.jumpCooldown -= deltaTime;
      if (this.jumpCooldown <= 0) {
        this.isJumping = false;
      }
    }

    // Jump — only if not already moving upward significantly
    if (inputManager.isJumpPressed() && this.isGrounded() && currentVel.y < 2) {
      // Reset vertical velocity before applying impulse for consistent jump height
      this.mesh.physicsImpostor.setLinearVelocity(
        new BABYLON.Vector3(currentVel.x, 0, currentVel.z)
      );
      this.mesh.physicsImpostor.applyImpulse(
        new BABYLON.Vector3(0, this.jumpForce, 0),
        this.mesh.getAbsolutePosition()
      );
      this.isJumping = true;
      this.jumpCooldown = 0.5;
    }

    // Clamp Y position to prevent falling through world
    if (this.mesh.position.y < -10) {
      this.mesh.position.y = 5;
      this.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 0, 0));
    }
  }

  isGrounded() {
    if (this.isJumping) return false;

    // Raycast down from collider center — cylinder is height 2, so bottom is 1.0 below center
    const origin = this.mesh.position.clone();
    const direction = new BABYLON.Vector3(0, -1, 0);
    const length = 1.2; // Slightly past the collider bottom to detect ground contact

    const ray = new BABYLON.Ray(origin, direction, length);
    const hit = this.scene.pickWithRay(ray, (mesh) => {
      return mesh !== this.mesh && !mesh.isDescendantOf(this.mesh);
    });

    return hit && hit.hit && hit.distance < 1.2;
  }
}
