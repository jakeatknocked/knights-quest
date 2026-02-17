import * as BABYLON from '@babylonjs/core';
import '@babylonjs/core/Physics/v1/physicsImpostor';

export class Player {
  constructor(scene, inputManager) {
    this.scene = scene;
    this.inputManager = inputManager;

    // Player properties (speedMultiplier applied from game state later)
    this.baseSpeed = 12;
    this.speed = 12;
    this.jumpForce = 50;
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

    // Visual root — child of physics mesh, used for emote animations
    // (physics resets rotation on mesh, so we animate this instead)
    this.visualRoot = new BABYLON.TransformNode('playerVisual', this.scene);
    this.visualRoot.parent = this.mesh;

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

    // Material (knight skin)
    const skinColor = localStorage.getItem('knightSkin') || 'silver';
    const colors = {
      silver: new BABYLON.Color3(0.3, 0.5, 0.8),
      gold: new BABYLON.Color3(1, 0.75, 0.1),
      dark: new BABYLON.Color3(0.25, 0.2, 0.4),
      crystal: new BABYLON.Color3(0.2, 0.9, 0.9),
      rainbow: new BABYLON.Color3(1, 0, 0),
      lava: new BABYLON.Color3(1, 0.2, 0),
      ice: new BABYLON.Color3(0.4, 0.7, 1),
      shadow: new BABYLON.Color3(0.05, 0.05, 0.08),
      emerald: new BABYLON.Color3(0.1, 0.75, 0.3),
      royal: new BABYLON.Color3(0.5, 0.15, 0.8),
      candy: new BABYLON.Color3(1, 0.4, 0.7),
      galaxy: new BABYLON.Color3(0.3, 0.0, 0.6),
      sunrise: new BABYLON.Color3(1, 0.6, 0.1),
      ocean: new BABYLON.Color3(0.0, 0.3, 0.7),
      storm: new BABYLON.Color3(0.25, 0.25, 0.65),
      toxic: new BABYLON.Color3(0.2, 1, 0.0),
      blood: new BABYLON.Color3(0.6, 0.0, 0.0),
      sakura: new BABYLON.Color3(1, 0.7, 0.85),
      void: new BABYLON.Color3(0.13, 0.0, 0.27),
      copper: new BABYLON.Color3(0.8, 0.45, 0.2),
      diamond: new BABYLON.Color3(0.85, 0.95, 1),
      inferno: new BABYLON.Color3(1, 0.4, 0.0),
    };
    this.isRainbow = skinColor === 'rainbow';
    const baseColor = colors[skinColor] || colors.silver;

    const material = new BABYLON.StandardMaterial('playerMat', this.scene);
    material.diffuseColor = baseColor;

    material.emissiveColor = new BABYLON.Color3(baseColor.r * 0.2, baseColor.g * 0.2, baseColor.b * 0.2);
    material.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    material.specularPower = 80;

    // Skin color for limbs (slightly darker)
    const limbMat = new BABYLON.StandardMaterial('playerLimbMat', this.scene);
    limbMat.diffuseColor = new BABYLON.Color3(0.9, 0.7, 0.55);

    limbMat.emissiveColor = new BABYLON.Color3(0.15, 0.1, 0.08);

    // Body
    const body = BABYLON.MeshBuilder.CreateBox('body', {
      width: 0.8, height: 1.0, depth: 0.5
    }, this.scene);
    body.position.y = 0.2;
    body.parent = this.visualRoot;
    body.material = material;

    // Armor material (metallic)
    const armorMat = new BABYLON.StandardMaterial('playerArmorMat', this.scene);
    armorMat.diffuseColor = new BABYLON.Color3(baseColor.r * 0.7, baseColor.g * 0.7, baseColor.b * 0.7);

    armorMat.emissiveColor = new BABYLON.Color3(baseColor.r * 0.15, baseColor.g * 0.15, baseColor.b * 0.15);
    armorMat.specularColor = new BABYLON.Color3(0.6, 0.6, 0.6);
    armorMat.specularPower = 64;

    // Head (helmet)
    const head = BABYLON.MeshBuilder.CreateSphere('head', { diameter: 0.6 }, this.scene);
    head.position.y = 1.0;
    head.parent = this.visualRoot;
    head.material = material;

    // Helmet top (flat dome)
    const helmetTop = BABYLON.MeshBuilder.CreateCylinder('helmetTop', {
      height: 0.15, diameterTop: 0.35, diameterBottom: 0.6, tessellation: 12
    }, this.scene);
    helmetTop.position.y = 1.32;
    helmetTop.parent = this.visualRoot;
    helmetTop.material = armorMat;

    // Visor (dark slit across face)
    const visorMat = new BABYLON.StandardMaterial('visorMat', this.scene);
    visorMat.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.1);
    visorMat.emissiveColor = new BABYLON.Color3(0.02, 0.02, 0.04);
    const visor = BABYLON.MeshBuilder.CreateBox('visor', {
      width: 0.45, height: 0.1, depth: 0.08
    }, this.scene);
    visor.position.set(0, 1.02, 0.28);
    visor.parent = this.visualRoot;
    visor.material = visorMat;

    // Chest plate (armor over body)
    const chestPlate = BABYLON.MeshBuilder.CreateBox('chestPlate', {
      width: 0.85, height: 0.6, depth: 0.3
    }, this.scene);
    chestPlate.position.set(0, 0.4, 0.12);
    chestPlate.parent = this.visualRoot;
    chestPlate.material = armorMat;

    // Shoulder pads
    const shoulderL = BABYLON.MeshBuilder.CreateSphere('shoulderL', { diameter: 0.35 }, this.scene);
    shoulderL.position.set(-0.5, 0.65, 0);
    shoulderL.scaling = new BABYLON.Vector3(1, 0.7, 1);
    shoulderL.parent = this.visualRoot;
    shoulderL.material = armorMat;

    const shoulderR = BABYLON.MeshBuilder.CreateSphere('shoulderR', { diameter: 0.35 }, this.scene);
    shoulderR.position.set(0.5, 0.65, 0);
    shoulderR.scaling = new BABYLON.Vector3(1, 0.7, 1);
    shoulderR.parent = this.visualRoot;
    shoulderR.material = armorMat;

    // Left arm (armored)
    const armL = BABYLON.MeshBuilder.CreateBox('armL', {
      width: 0.25, height: 0.8, depth: 0.25
    }, this.scene);
    armL.position.set(-0.525, 0.2, 0);
    armL.parent = this.visualRoot;
    armL.material = armorMat;

    // Right arm (armored)
    const armR = BABYLON.MeshBuilder.CreateBox('armR', {
      width: 0.25, height: 0.8, depth: 0.25
    }, this.scene);
    armR.position.set(0.525, 0.2, 0);
    armR.parent = this.visualRoot;
    armR.material = armorMat;

    // Left leg (armored greave)
    const legL = BABYLON.MeshBuilder.CreateBox('legL', {
      width: 0.3, height: 0.7, depth: 0.3
    }, this.scene);
    legL.position.set(-0.2, -0.55, 0);
    legL.parent = this.visualRoot;
    legL.material = armorMat;

    // Right leg (armored greave)
    const legR = BABYLON.MeshBuilder.CreateBox('legR', {
      width: 0.3, height: 0.7, depth: 0.3
    }, this.scene);
    legR.position.set(0.2, -0.55, 0);
    legR.parent = this.visualRoot;
    legR.material = armorMat;

    // Belt
    const belt = BABYLON.MeshBuilder.CreateBox('belt', {
      width: 0.82, height: 0.12, depth: 0.52
    }, this.scene);
    belt.position.set(0, -0.1, 0);
    belt.parent = this.visualRoot;
    belt.material = limbMat;

    // Belt buckle (gold accent)
    const buckleMat = new BABYLON.StandardMaterial('buckleMat', this.scene);
    buckleMat.diffuseColor = new BABYLON.Color3(1, 0.85, 0.2);
    buckleMat.emissiveColor = new BABYLON.Color3(0.3, 0.25, 0.05);
    buckleMat.specularColor = new BABYLON.Color3(0.8, 0.7, 0.3);
    const buckle = BABYLON.MeshBuilder.CreateBox('buckle', {
      width: 0.15, height: 0.1, depth: 0.08
    }, this.scene);
    buckle.position.set(0, -0.1, 0.27);
    buckle.parent = this.visualRoot;
    buckle.material = buckleMat;

    // Gauntlets (wrist armor)
    const gauntletL = BABYLON.MeshBuilder.CreateBox('gauntletL', {
      width: 0.28, height: 0.15, depth: 0.28
    }, this.scene);
    gauntletL.position.set(-0.525, -0.1, 0);
    gauntletL.parent = this.visualRoot;
    gauntletL.material = material;

    const gauntletR = BABYLON.MeshBuilder.CreateBox('gauntletR', {
      width: 0.28, height: 0.15, depth: 0.28
    }, this.scene);
    gauntletR.position.set(0.525, -0.1, 0);
    gauntletR.parent = this.visualRoot;
    gauntletR.material = material;

    // Knee pads
    const kneeL = BABYLON.MeshBuilder.CreateSphere('kneeL', { diameter: 0.18 }, this.scene);
    kneeL.position.set(-0.2, -0.35, 0.15);
    kneeL.scaling = new BABYLON.Vector3(1, 0.8, 0.7);
    kneeL.parent = this.visualRoot;
    kneeL.material = armorMat;

    const kneeR = BABYLON.MeshBuilder.CreateSphere('kneeR', { diameter: 0.18 }, this.scene);
    kneeR.position.set(0.2, -0.35, 0.15);
    kneeR.scaling = new BABYLON.Vector3(1, 0.8, 0.7);
    kneeR.parent = this.visualRoot;
    kneeR.material = armorMat;

    // Cape (flowing behind)
    const capeMat = new BABYLON.StandardMaterial('capeMat', this.scene);
    capeMat.diffuseColor = new BABYLON.Color3(baseColor.r * 0.6, baseColor.g * 0.4, baseColor.b * 0.5);
    capeMat.emissiveColor = new BABYLON.Color3(baseColor.r * 0.1, baseColor.g * 0.07, baseColor.b * 0.08);
    capeMat.backFaceCulling = false;
    const cape = BABYLON.MeshBuilder.CreateBox('cape', {
      width: 0.7, height: 0.9, depth: 0.05
    }, this.scene);
    cape.position.set(0, 0.15, -0.28);
    cape.parent = this.visualRoot;
    cape.material = capeMat;
    this._cape = cape;

    // Visor glow (subtle colored glow behind the visor)
    const visorGlowMat = new BABYLON.StandardMaterial('visorGlowMat', this.scene);
    visorGlowMat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 1);
    visorGlowMat.emissiveColor = new BABYLON.Color3(0.15, 0.3, 0.6);
    visorGlowMat.alpha = 0.6;
    const visorGlow = BABYLON.MeshBuilder.CreateBox('visorGlow', {
      width: 0.4, height: 0.06, depth: 0.04
    }, this.scene);
    visorGlow.position.set(0, 1.02, 0.3);
    visorGlow.parent = this.visualRoot;
    visorGlow.material = visorGlowMat;

    // Boots (thicker at bottom of legs)
    const bootL = BABYLON.MeshBuilder.CreateBox('bootL', {
      width: 0.32, height: 0.2, depth: 0.38
    }, this.scene);
    bootL.position.set(-0.2, -0.85, 0.03);
    bootL.parent = this.visualRoot;
    bootL.material = material;

    const bootR = BABYLON.MeshBuilder.CreateBox('bootR', {
      width: 0.32, height: 0.2, depth: 0.38
    }, this.scene);
    bootR.position.set(0.2, -0.85, 0.03);
    bootR.parent = this.visualRoot;
    bootR.material = material;

    // Lock rotation to prevent tipping (cannon-es API)
    if (this.mesh.physicsImpostor.physicsBody) {
      this.mesh.physicsImpostor.physicsBody.fixedRotation = true;
      this.mesh.physicsImpostor.physicsBody.updateMassProperties();
      this.mesh.physicsImpostor.physicsBody.angularDamping = 0.9;
      this.mesh.physicsImpostor.physicsBody.linearDamping = 0.1;
    }
  }

  update(deltaTime, inputManager, camera, cameraYaw) {
    if (!this.mesh.physicsImpostor || !this.mesh.physicsImpostor.physicsBody) return;

    // Get current velocity
    const currentVel = this.mesh.physicsImpostor.getLinearVelocity();

    // Get movement input
    const input = inputManager.getMovementVector();

    if (input.length() > 0) {
      // Transform movement to be relative to camera yaw
      const yaw = cameraYaw || 0;
      const sin = Math.sin(yaw);
      const cos = Math.cos(yaw);

      const movement = new BABYLON.Vector3(
        input.x * cos + input.z * sin,
        0,
        -input.x * sin + input.z * cos
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
    } else {
      // Stop horizontal movement when no input
      this.mesh.physicsImpostor.setLinearVelocity(
        new BABYLON.Vector3(0, currentVel.y, 0)
      );
    }

    // Always update forward vector from camera yaw (for aiming/shooting)
    if (cameraYaw !== undefined) {
      this.forwardVector = new BABYLON.Vector3(
        Math.sin(cameraYaw),
        0,
        Math.cos(cameraYaw)
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

    // Rainbow skin color cycle
    if (this.isRainbow && this.mesh) {
      this.rainbowTime = (this.rainbowTime || 0) + deltaTime * 2;
      const r = Math.sin(this.rainbowTime) * 0.5 + 0.5;
      const g = Math.sin(this.rainbowTime + 2.09) * 0.5 + 0.5;
      const b = Math.sin(this.rainbowTime + 4.19) * 0.5 + 0.5;
      this.mesh.getChildMeshes().forEach(child => {
        if (child.material && child.material.diffuseColor) {
          child.material.diffuseColor.set(r, g, b);
        }
      });
    }

    // Prevent falling through the floor
    const minY = 1.0; // Half the collider height (cylinder h=2)
    if (this.mesh.position.y < minY) {
      this.mesh.position.y = minY;
      const vel = this.mesh.physicsImpostor.getLinearVelocity();
      if (vel.y < 0) {
        this.mesh.physicsImpostor.setLinearVelocity(
          new BABYLON.Vector3(vel.x, 0, vel.z)
        );
      }
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
