import * as BABYLON from '@babylonjs/core';

export class World {
  constructor(scene) {
    this.scene = scene;
    
    this.buildWorld();
  }
  
  buildWorld() {
    // Create shared materials
    this.materials = {};

    this.materials.wall = new BABYLON.StandardMaterial('wallMat', this.scene);
    this.materials.wall.diffuseColor = new BABYLON.Color3(0.53, 0.53, 0.53);

    this.materials.tower = new BABYLON.StandardMaterial('towerMat', this.scene);
    this.materials.tower.diffuseColor = new BABYLON.Color3(0.47, 0.47, 0.47);

    this.materials.towerRoof = new BABYLON.StandardMaterial('roofMat', this.scene);
    this.materials.towerRoof.diffuseColor = new BABYLON.Color3(0.67, 0.2, 0.2);

    this.materials.hut = new BABYLON.StandardMaterial('hutMat', this.scene);
    this.materials.hut.diffuseColor = new BABYLON.Color3(0.53, 0.4, 0.27);

    this.materials.hutRoof = new BABYLON.StandardMaterial('hutRoofMat', this.scene);
    this.materials.hutRoof.diffuseColor = new BABYLON.Color3(0.67, 0.27, 0.13);

    this.materials.trunk = new BABYLON.StandardMaterial('trunkMat', this.scene);
    this.materials.trunk.diffuseColor = new BABYLON.Color3(0.4, 0.27, 0.13);

    this.materials.leaves = new BABYLON.StandardMaterial('leavesMat', this.scene);
    this.materials.leaves.diffuseColor = new BABYLON.Color3(0.13, 0.53, 0.2);

    // Create ground - using a box for more reliable physics
    const ground = BABYLON.MeshBuilder.CreateBox('ground', {
      width: 200,
      height: 0.1,
      depth: 200
    }, this.scene);

    ground.position.y = 0;

    const groundMaterial = new BABYLON.StandardMaterial('groundMat', this.scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.23, 0.35, 0.16);
    ground.material = groundMaterial;
    ground.receiveShadows = true;
    ground.checkCollisions = true;

    // Add physics to ground - static (mass = 0)
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(
      ground,
      BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0.8, restitution: 0 },
      this.scene
    );

    // Build castle
    this.buildCastle(0, -30);

    // Build village
    this.buildVillage();

    // Add some trees
    this.addTrees();
  }
  
  buildCastle(x, z) {
    // Castle walls (hollow for entering)
    const wallHeight = 10;
    const wallThickness = 1;
    
    // North wall
    this.createWall(x, 0, z - 6, 12, wallHeight, wallThickness);
    
    // South wall with doorway
    this.createWall(x - 4, 0, z + 6, 4, wallHeight, wallThickness);
    this.createWall(x + 4, 0, z + 6, 4, wallHeight, wallThickness);
    
    // West wall
    this.createWall(x - 6, 0, z, wallThickness, wallHeight, 12);
    
    // East wall  
    this.createWall(x + 6, 0, z, wallThickness, wallHeight, 12);
    
    // Castle floor (interior)
    const floor = BABYLON.MeshBuilder.CreateGround('castleFloor', {
      width: 11,
      height: 11
    }, this.scene);
    floor.position = new BABYLON.Vector3(x, 0.01, z);
    
    const floorMat = new BABYLON.StandardMaterial('floorMat', this.scene);
    floorMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    floor.material = floorMat;
    
    // Towers
    this.createTower(x - 7, 0, z - 7);
    this.createTower(x + 7, 0, z - 7);
    this.createTower(x - 7, 0, z + 7);
    this.createTower(x + 7, 0, z + 7);
  }
  
  createWall(x, y, z, width, height, depth) {
    const wall = BABYLON.MeshBuilder.CreateBox('wall', {
      width,
      height,
      depth
    }, this.scene);
    
    wall.position = new BABYLON.Vector3(x, y + height / 2, z);
    wall.material = this.materials.wall;
    wall.receiveShadows = true;
    wall.checkCollisions = true;
    
    // Add physics
    wall.physicsImpostor = new BABYLON.PhysicsImpostor(
      wall,
      BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0.5 },
      this.scene
    );
    
    return wall;
  }
  
  createTower(x, y, z) {
    const tower = BABYLON.MeshBuilder.CreateCylinder('tower', {
      height: 14,
      diameter: 4
    }, this.scene);
    
    tower.position = new BABYLON.Vector3(x, y + 7, z);
    tower.material = this.materials.tower;
    tower.receiveShadows = true;
    
    // Tower roof (cone)
    const roof = BABYLON.MeshBuilder.CreateCylinder('roof', {
      height: 4,
      diameterTop: 0,
      diameterBottom: 3
    }, this.scene);
    
    roof.position = new BABYLON.Vector3(x, y + 15, z);
    roof.material = this.materials.towerRoof;
    
    // Physics
    tower.physicsImpostor = new BABYLON.PhysicsImpostor(
      tower,
      BABYLON.PhysicsImpostor.CylinderImpostor,
      { mass: 0, friction: 0.5 },
      this.scene
    );
  }
  
  buildVillage() {
    const positions = [
      [10, 5], [15, 8], [-10, 3], [-14, 7], [8, 12], [-8, 14]
    ];
    
    positions.forEach(([x, z]) => {
      this.createHut(x, z);
    });
  }
  
  createHut(x, z) {
    // Hut walls
    const hut = BABYLON.MeshBuilder.CreateBox('hut', {
      width: 3,
      height: 2.5,
      depth: 3
    }, this.scene);
    
    hut.position = new BABYLON.Vector3(x, 1.25, z);
    hut.material = this.materials.hut;
    hut.receiveShadows = true;
    
    // Roof
    const roof = BABYLON.MeshBuilder.CreateCylinder('roof', {
      height: 2,
      diameterTop: 0,
      diameterBottom: 4.2,
      tessellation: 4
    }, this.scene);
    
    roof.position = new BABYLON.Vector3(x, 3.5, z);
    roof.rotation.y = Math.PI / 4;
    roof.material = this.materials.hutRoof;
  }
  
  addTrees() {
    // Add some trees in the forest area
    for (let i = 0; i < 20; i++) {
      const x = 50 + Math.random() * 50;
      const z = -30 + Math.random() * 60;
      this.createTree(x, z);
    }
  }
  
  createTree(x, z) {
    // Trunk
    const trunk = BABYLON.MeshBuilder.CreateCylinder('trunk', {
      height: 3,
      diameter: 0.5
    }, this.scene);
    
    trunk.position = new BABYLON.Vector3(x, 1.5, z);
    trunk.material = this.materials.trunk;
    trunk.receiveShadows = true;
    
    // Leaves
    const leaves = BABYLON.MeshBuilder.CreateSphere('leaves', {
      diameter: 2.5
    }, this.scene);
    
    leaves.position = new BABYLON.Vector3(x, 3.5, z);
    leaves.material = this.materials.leaves;
    
    // Physics for trunk
    trunk.physicsImpostor = new BABYLON.PhysicsImpostor(
      trunk,
      BABYLON.PhysicsImpostor.CylinderImpostor,
      { mass: 0, friction: 0.5 },
      this.scene
    );
  }
}
