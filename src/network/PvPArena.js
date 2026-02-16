import * as BABYLON from '@babylonjs/core';

export class PvPArena {
  constructor(scene) {
    this.scene = scene;
    this.meshes = [];
    this.lights = [];
    this.spawnA = new BABYLON.Vector3(-25, 2, 0);
    this.spawnB = new BABYLON.Vector3(25, 2, 0);
  }

  build() {
    // Ground
    const ground = BABYLON.MeshBuilder.CreateGround('pvpGround', {
      width: 60, height: 60
    }, this.scene);
    const groundMat = new BABYLON.StandardMaterial('pvpGroundMat', this.scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.25);
    groundMat.emissiveColor = new BABYLON.Color3(0.03, 0.03, 0.04);
    groundMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    ground.material = groundMat;
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(
      ground, BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 0.1 }, this.scene
    );
    this.meshes.push(ground);

    // Boundary walls (4 sides)
    const wallH = 4, wallThick = 0.5;
    const wallMat = new BABYLON.StandardMaterial('pvpWallMat', this.scene);
    wallMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.2);
    wallMat.emissiveColor = new BABYLON.Color3(0.02, 0.02, 0.03);

    const wallConfigs = [
      { w: 60, d: wallThick, x: 0, z: 30 },
      { w: 60, d: wallThick, x: 0, z: -30 },
      { w: wallThick, d: 60, x: 30, z: 0 },
      { w: wallThick, d: 60, x: -30, z: 0 },
    ];
    wallConfigs.forEach((cfg, i) => {
      const wall = BABYLON.MeshBuilder.CreateBox(`pvpWall${i}`, {
        width: cfg.w, height: wallH, depth: cfg.d
      }, this.scene);
      wall.position.set(cfg.x, wallH / 2, cfg.z);
      wall.material = wallMat;
      wall.physicsImpostor = new BABYLON.PhysicsImpostor(
        wall, BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, restitution: 0.1 }, this.scene
      );
      this.meshes.push(wall);
    });

    // Cover walls (cross pattern around center)
    const coverMat = new BABYLON.StandardMaterial('pvpCoverMat', this.scene);
    coverMat.diffuseColor = new BABYLON.Color3(0.3, 0.25, 0.2);
    coverMat.emissiveColor = new BABYLON.Color3(0.04, 0.03, 0.02);

    const covers = [
      { x: 0, z: 10, rotY: 0 },
      { x: 0, z: -10, rotY: 0 },
      { x: 10, z: 0, rotY: Math.PI / 2 },
      { x: -10, z: 0, rotY: Math.PI / 2 },
    ];
    covers.forEach((cfg, i) => {
      const cover = BABYLON.MeshBuilder.CreateBox(`pvpCover${i}`, {
        width: 6, height: 1.5, depth: 0.5
      }, this.scene);
      cover.position.set(cfg.x, 0.75, cfg.z);
      cover.rotation.y = cfg.rotY;
      cover.material = coverMat;
      cover.physicsImpostor = new BABYLON.PhysicsImpostor(
        cover, BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, restitution: 0.1 }, this.scene
      );
      this.meshes.push(cover);
    });

    // Corner pillars
    const pillarMat = new BABYLON.StandardMaterial('pvpPillarMat', this.scene);
    pillarMat.diffuseColor = new BABYLON.Color3(0.35, 0.3, 0.25);
    pillarMat.emissiveColor = new BABYLON.Color3(0.04, 0.03, 0.03);

    const pillars = [
      { x: 20, z: 20 }, { x: -20, z: 20 },
      { x: 20, z: -20 }, { x: -20, z: -20 },
    ];
    pillars.forEach((cfg, i) => {
      const pillar = BABYLON.MeshBuilder.CreateCylinder(`pvpPillar${i}`, {
        height: 5, diameter: 1.5, tessellation: 12
      }, this.scene);
      pillar.position.set(cfg.x, 2.5, cfg.z);
      pillar.material = pillarMat;
      pillar.physicsImpostor = new BABYLON.PhysicsImpostor(
        pillar, BABYLON.PhysicsImpostor.CylinderImpostor,
        { mass: 0, restitution: 0.1 }, this.scene
      );
      this.meshes.push(pillar);
    });

    // Atmospheric lighting
    const hemiLight = new BABYLON.HemisphericLight('pvpHemi', new BABYLON.Vector3(0, 1, 0), this.scene);
    hemiLight.intensity = 0.4;
    hemiLight.diffuse = new BABYLON.Color3(0.6, 0.6, 0.7);
    this.lights.push(hemiLight);

    // Red light on one side (spawn A)
    const redLight = new BABYLON.PointLight('pvpRedLight', new BABYLON.Vector3(-25, 6, 0), this.scene);
    redLight.diffuse = new BABYLON.Color3(1, 0.2, 0.1);
    redLight.intensity = 1.5;
    redLight.range = 35;
    this.lights.push(redLight);

    // Blue light on other side (spawn B)
    const blueLight = new BABYLON.PointLight('pvpBlueLight', new BABYLON.Vector3(25, 6, 0), this.scene);
    blueLight.diffuse = new BABYLON.Color3(0.1, 0.3, 1);
    blueLight.intensity = 1.5;
    blueLight.range = 35;
    this.lights.push(blueLight);
  }

  dispose() {
    this.meshes.forEach(m => {
      if (m.physicsImpostor) m.physicsImpostor.dispose();
      if (m.material) m.material.dispose();
      m.dispose();
    });
    this.meshes = [];
    this.lights.forEach(l => l.dispose());
    this.lights = [];
  }
}
