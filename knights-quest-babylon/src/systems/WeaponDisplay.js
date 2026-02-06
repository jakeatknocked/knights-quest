import * as BABYLON from '@babylonjs/core';

export class WeaponDisplay {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.currentWeapon = null;
    this.recoilAnimation = 0;
    this.muzzleFlash = null;
    this.weaponMeshes = {};
    this.swordMesh = null;
    this.swordSwingAnimation = 0;

    this.createWeapons();
    this.createSword();
  }

  createWeapons() {
    // Create weapon models for each ammo type
    const weaponConfigs = {
      basic: { color: new BABYLON.Color3(0.4, 0.4, 0.4), emissive: 0.1 },
      fire: { color: new BABYLON.Color3(0.8, 0.2, 0.05), emissive: 0.3 },
      ice: { color: new BABYLON.Color3(0.2, 0.6, 0.9), emissive: 0.3 },
      lightning: { color: new BABYLON.Color3(0.9, 0.85, 0.1), emissive: 0.3 }
    };

    Object.keys(weaponConfigs).forEach(type => {
      const weapon = this.createWeaponMesh(type, weaponConfigs[type]);
      weapon.isVisible = false;
      this.weaponMeshes[type] = weapon;
    });
  }

  createWeaponMesh(type, config) {
    // Container for the entire weapon
    const weaponContainer = new BABYLON.TransformNode(`weapon_${type}`, this.scene);
    weaponContainer.parent = this.camera;

    // Position in front of camera (right side, slightly down)
    weaponContainer.position = new BABYLON.Vector3(0.3, -0.25, 0.5);
    weaponContainer.rotation = new BABYLON.Vector3(0, 0, 0);

    // Gun barrel (main body)
    const barrel = BABYLON.MeshBuilder.CreateBox('barrel', {
      width: 0.08, height: 0.08, depth: 0.4
    }, this.scene);
    barrel.position.z = 0.2;
    barrel.parent = weaponContainer;

    // Gun handle
    const handle = BABYLON.MeshBuilder.CreateBox('handle', {
      width: 0.06, height: 0.15, depth: 0.06
    }, this.scene);
    handle.position.set(0, -0.1, 0);
    handle.parent = weaponContainer;

    // Trigger guard
    const trigger = BABYLON.MeshBuilder.CreateBox('trigger', {
      width: 0.05, height: 0.03, depth: 0.08
    }, this.scene);
    trigger.position.set(0, -0.05, 0.05);
    trigger.parent = weaponContainer;

    // Barrel tip (glowing)
    const tip = BABYLON.MeshBuilder.CreateCylinder('tip', {
      height: 0.1, diameter: 0.06
    }, this.scene);
    tip.rotation.x = Math.PI / 2;
    tip.position.z = 0.42;
    tip.parent = weaponContainer;

    // Sight (top of gun)
    const sight = BABYLON.MeshBuilder.CreateBox('sight', {
      width: 0.04, height: 0.06, depth: 0.04
    }, this.scene);
    sight.position.set(0, 0.07, 0.15);
    sight.parent = weaponContainer;

    // Material for weapon
    const material = new BABYLON.StandardMaterial(`weaponMat_${type}`, this.scene);
    material.diffuseColor = config.color;
    material.emissiveColor = new BABYLON.Color3(
      config.color.r * config.emissive,
      config.color.g * config.emissive,
      config.color.b * config.emissive
    );
    material.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    material.specularPower = 32;

    // Apply material to all parts
    barrel.material = material;
    handle.material = material;
    trigger.material = material;
    sight.material = material;

    // Glowing tip material
    const tipMaterial = new BABYLON.StandardMaterial(`tipMat_${type}`, this.scene);
    tipMaterial.diffuseColor = config.color;
    tipMaterial.emissiveColor = new BABYLON.Color3(
      config.color.r * 0.6,
      config.color.g * 0.6,
      config.color.b * 0.6
    );
    tipMaterial.specularColor = new BABYLON.Color3(0.8, 0.8, 0.8);
    tipMaterial.specularPower = 64;
    tip.material = tipMaterial;

    // Store references for animation
    weaponContainer._barrel = barrel;
    weaponContainer._tip = tip;
    weaponContainer._basePosition = weaponContainer.position.clone();

    return weaponContainer;
  }

  switchWeapon(weaponType) {
    // Hide current weapon
    if (this.currentWeapon && this.weaponMeshes[this.currentWeapon]) {
      this.weaponMeshes[this.currentWeapon].isVisible = false;
    }

    // Show new weapon
    this.currentWeapon = weaponType;
    if (this.weaponMeshes[weaponType]) {
      this.weaponMeshes[weaponType].isVisible = true;
    }
  }

  createSword() {
    // Container for sword (left hand)
    const swordContainer = new BABYLON.TransformNode('sword', this.scene);
    swordContainer.parent = this.camera;

    // Position in front of camera (left side, slightly down)
    swordContainer.position = new BABYLON.Vector3(-0.3, -0.3, 0.4);
    swordContainer.rotation = new BABYLON.Vector3(0, 0, 0);

    // Sword blade
    const blade = BABYLON.MeshBuilder.CreateBox('blade', {
      width: 0.05, height: 0.6, depth: 0.02
    }, this.scene);
    blade.position.y = 0.3;
    blade.parent = swordContainer;

    // Blade material (silver/steel)
    const bladeMat = new BABYLON.StandardMaterial('bladeMat', this.scene);
    bladeMat.diffuseColor = new BABYLON.Color3(0.7, 0.75, 0.8);
    bladeMat.emissiveColor = new BABYLON.Color3(0.2, 0.22, 0.25);
    bladeMat.specularColor = new BABYLON.Color3(0.9, 0.9, 0.9);
    bladeMat.specularPower = 128;
    blade.material = bladeMat;

    // Cross-guard
    const guard = BABYLON.MeshBuilder.CreateBox('guard', {
      width: 0.2, height: 0.03, depth: 0.03
    }, this.scene);
    guard.position.y = 0;
    guard.parent = swordContainer;
    guard.material = bladeMat;

    // Handle
    const handle = BABYLON.MeshBuilder.CreateCylinder('handle', {
      height: 0.15, diameter: 0.04
    }, this.scene);
    handle.position.y = -0.075;
    handle.parent = swordContainer;

    const handleMat = new BABYLON.StandardMaterial('handleMat', this.scene);
    handleMat.diffuseColor = new BABYLON.Color3(0.3, 0.2, 0.15);
    handleMat.emissiveColor = new BABYLON.Color3(0.1, 0.07, 0.05);
    handle.material = handleMat;

    // Pommel
    const pommel = BABYLON.MeshBuilder.CreateSphere('pommel', {
      diameter: 0.06
    }, this.scene);
    pommel.position.y = -0.16;
    pommel.parent = swordContainer;
    pommel.material = bladeMat;

    // Store references
    swordContainer._basePosition = swordContainer.position.clone();
    swordContainer._baseRotation = swordContainer.rotation.clone();
    this.swordMesh = swordContainer;
  }

  playSwordSwingAnimation() {
    // Trigger sword swing
    this.swordSwingAnimation = 1.0;
  }

  playShootAnimation() {
    if (!this.currentWeapon) return;

    // Trigger recoil
    this.recoilAnimation = 1.0;

    // Show muzzle flash
    this.showMuzzleFlash();
  }

  showMuzzleFlash() {
    const weapon = this.weaponMeshes[this.currentWeapon];
    if (!weapon) return;

    // Remove old flash
    if (this.muzzleFlash) {
      this.muzzleFlash.dispose();
    }

    // Create muzzle flash
    this.muzzleFlash = BABYLON.MeshBuilder.CreateSphere('muzzleFlash', {
      diameter: 0.15
    }, this.scene);

    this.muzzleFlash.parent = weapon;
    this.muzzleFlash.position = new BABYLON.Vector3(0, 0, 0.5);

    const flashMat = new BABYLON.StandardMaterial('flashMat', this.scene);
    flashMat.emissiveColor = new BABYLON.Color3(1, 0.8, 0.2);
    flashMat.disableLighting = true;
    this.muzzleFlash.material = flashMat;

    // Auto-remove after a short time
    setTimeout(() => {
      if (this.muzzleFlash) {
        this.muzzleFlash.dispose();
        this.muzzleFlash = null;
      }
    }, 50);
  }

  update(deltaTime) {
    // Update gun
    if (this.currentWeapon) {
      const weapon = this.weaponMeshes[this.currentWeapon];
      if (weapon) {
        // Recoil animation
        if (this.recoilAnimation > 0) {
          this.recoilAnimation -= deltaTime * 8;

          // Move weapon back and up slightly
          const recoilAmount = Math.max(0, this.recoilAnimation);
          weapon.position.z = weapon._basePosition.z - recoilAmount * 0.08;
          weapon.position.y = weapon._basePosition.y + recoilAmount * 0.05;
          weapon.rotation.x = -recoilAmount * 0.15;
        } else {
          // Return to base position smoothly
          weapon.position.z += (weapon._basePosition.z - weapon.position.z) * deltaTime * 10;
          weapon.position.y += (weapon._basePosition.y - weapon.position.y) * deltaTime * 10;
          weapon.rotation.x += (0 - weapon.rotation.x) * deltaTime * 10;
        }

        // Subtle weapon sway when moving (breathing effect)
        const time = Date.now() * 0.001;
        const swayAmount = 0.002;
        weapon.position.x = weapon._basePosition.x + Math.sin(time * 2) * swayAmount;
        weapon.position.y += Math.cos(time * 1.5) * swayAmount;
      }
    }

    // Update sword
    if (this.swordMesh) {
      // Sword swing animation
      if (this.swordSwingAnimation > 0) {
        this.swordSwingAnimation -= deltaTime * 6;

        // Swing from right to left (arc motion)
        const swingAmount = Math.max(0, this.swordSwingAnimation);
        const progress = 1 - swingAmount;

        // Arc swing motion
        this.swordMesh.rotation.y = this.swordMesh._baseRotation.y + Math.sin(progress * Math.PI) * 1.5;
        this.swordMesh.rotation.z = this.swordMesh._baseRotation.z - progress * 0.8;
        this.swordMesh.position.x = this.swordMesh._basePosition.x + Math.sin(progress * Math.PI) * 0.3;
        this.swordMesh.position.y = this.swordMesh._basePosition.y + Math.sin(progress * Math.PI * 0.5) * 0.2;
      } else {
        // Return to base position smoothly
        this.swordMesh.rotation.y += (this.swordMesh._baseRotation.y - this.swordMesh.rotation.y) * deltaTime * 8;
        this.swordMesh.rotation.z += (this.swordMesh._baseRotation.z - this.swordMesh.rotation.z) * deltaTime * 8;
        this.swordMesh.position.x += (this.swordMesh._basePosition.x - this.swordMesh.position.x) * deltaTime * 8;
        this.swordMesh.position.y += (this.swordMesh._basePosition.y - this.swordMesh.position.y) * deltaTime * 8;
      }

      // Subtle sword sway
      const time = Date.now() * 0.001;
      const swayAmount = 0.003;
      this.swordMesh.position.z = this.swordMesh._basePosition.z + Math.cos(time * 1.8) * swayAmount;
    }
  }

  dispose() {
    Object.values(this.weaponMeshes).forEach(weapon => {
      if (weapon) {
        weapon.getChildMeshes().forEach(child => {
          if (child.material) child.material.dispose();
          child.dispose();
        });
        weapon.dispose();
      }
    });

    if (this.swordMesh) {
      this.swordMesh.getChildMeshes().forEach(child => {
        if (child.material) child.material.dispose();
        child.dispose();
      });
      this.swordMesh.dispose();
    }

    if (this.muzzleFlash) {
      this.muzzleFlash.dispose();
    }
  }
}
