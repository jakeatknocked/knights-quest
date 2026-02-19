import * as BABYLON from '@babylonjs/core';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.meshes = [];
    this.lights = [];
    this.materials = {};
  }

  // Track meshes and lights for cleanup
  _track(mesh) { this.meshes.push(mesh); return mesh; }
  _trackLight(light) { this.lights.push(light); return light; }

  dispose() {
    // Dispose all tracked meshes
    this.meshes.forEach(m => {
      if (m.physicsImpostor) m.physicsImpostor.dispose();
      if (m.material && !m.material._shared) m.material.dispose();
      m.dispose();
    });
    this.meshes = [];
    // Dispose lights
    this.lights.forEach(l => l.dispose());
    this.lights = [];
    // Dispose shared materials
    Object.values(this.materials).forEach(m => { if (m.dispose) m.dispose(); });
    this.materials = {};
  }

  buildLevel(levelIndex) {
    this.dispose();
    this._createMaterials();
    this._createGround(levelIndex);
    this._buildBorders(levelIndex);

    if (levelIndex === 0) {
      this._buildCastleMap();
    } else if (levelIndex === 1) {
      this._buildForestMap();
    } else if (levelIndex === 2) {
      this._buildSkyMap();
    } else if (levelIndex === 3) {
      this._buildLavaFortressMap();
    } else if (levelIndex === 4) {
      this._buildFrozenDepthsMap();
    } else if (levelIndex === 5) {
      this._buildShadowRealmMap();
    } else if (levelIndex === 6) {
      this._buildStormPeaksMap();
    } else if (levelIndex === 7) {
      this._buildPoisonSwampMap();
    } else if (levelIndex === 8) {
      this._buildCrystalCavernsMap();
    } else if (levelIndex === 9) {
      this._buildTheVoidMap();
    } else if (levelIndex === 10) {
      this._buildPartyMap();
    }
  }

  // --- Materials ---
  _createMaterials() {
    const makeMat = (name, r, g, b) => {
      const mat = new BABYLON.StandardMaterial(name, this.scene);
      mat.diffuseColor = new BABYLON.Color3(r, g, b);
      mat.emissiveColor = new BABYLON.Color3(r * 0.2, g * 0.2, b * 0.2);
      mat._shared = true;
      return mat;
    };
    this.materials.wall = makeMat('wallMat', 0.4, 0.33, 0.27);
    this.materials.wall.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);
    this.materials.tower = makeMat('towerMat', 0.38, 0.35, 0.32);
    this.materials.towerRoof = makeMat('roofMat', 0.67, 0.2, 0.2);
    this.materials.hut = makeMat('hutMat', 0.47, 0.33, 0.2);
    this.materials.hutRoof = makeMat('hutRoofMat', 0.67, 0.27, 0.13);
    this.materials.trunk = makeMat('trunkMat', 0.4, 0.27, 0.13);
    this.materials.leaves = makeMat('leavesMat', 0.13, 0.53, 0.2);
    this.materials.stone = makeMat('stoneMat', 0.6, 0.53, 0.47);
    this.materials.crystal = makeMat('crystalMat', 0.3, 0.8, 1);
    this.materials.crystal.alpha = 0.8;
    this.materials.crystal.specularColor = new BABYLON.Color3(1, 1, 1);
    this.materials.crystal.specularPower = 128;
    this.materials.island = makeMat('islandMat', 0.27, 0.67, 0.27);
    this.materials.bridge = makeMat('bridgeMat', 0.53, 0.4, 0.27);
    this.materials.mountain = makeMat('mountainMat', 0.45, 0.35, 0.5);
    this.materials.sand = makeMat('sandMat', 0.76, 0.7, 0.5);
    this.materials.lava = makeMat('lavaMat', 0.9, 0.25, 0.05);
    this.materials.lava.emissiveColor = new BABYLON.Color3(0.4, 0.1, 0.02);
    this.materials.ice = makeMat('iceMat', 0.6, 0.8, 0.95);
    this.materials.ice.specularColor = new BABYLON.Color3(1, 1, 1);
    this.materials.ice.specularPower = 128;
    this.materials.ice.alpha = 0.85;
    this.materials.darkStone = makeMat('darkStoneMat', 0.25, 0.22, 0.3);
    // House furniture materials
    this.materials.wood = makeMat('woodMat', 0.45, 0.3, 0.15);
    this.materials.fabric = makeMat('fabricMat', 0.5, 0.15, 0.15);
    this.materials.gold = makeMat('goldMat', 0.85, 0.7, 0.2);
    this.materials.gold.specularColor = new BABYLON.Color3(1, 0.9, 0.4);
    this.materials.metal = makeMat('metalMat', 0.35, 0.35, 0.4);
    this.materials.metal.specularColor = new BABYLON.Color3(0.8, 0.8, 0.8);
  }

  // --- Ground ---
  _createGround(levelIndex) {
    const groundColors = [
      { r: 0.16, g: 0.29, b: 0.1 },  // green grass
      { r: 0.12, g: 0.2, b: 0.08 },   // dark forest floor
      { r: 0.3, g: 0.25, b: 0.35 },    // purple void
      { r: 0.25, g: 0.1, b: 0.05 },    // scorched earth
      { r: 0.5, g: 0.6, b: 0.7 },      // ice/snow
      { r: 0.08, g: 0.04, b: 0.12 },   // shadow void
      { r: 0.3, g: 0.35, b: 0.45 },    // storm grey
      { r: 0.15, g: 0.25, b: 0.08 },   // swamp green
      { r: 0.35, g: 0.2, b: 0.45 },    // crystal purple
      { r: 0.03, g: 0.01, b: 0.05 },   // void black
      { r: 0.95, g: 0.85, b: 0.2 },     // party gold
    ];
    const c = groundColors[levelIndex] || groundColors[0];

    const ground = this._track(BABYLON.MeshBuilder.CreateBox('ground', {
      width: 300, height: 0.1, depth: 300
    }, this.scene));
    ground.position.y = 0;

    const mat = new BABYLON.StandardMaterial('groundMat', this.scene);
    mat.diffuseColor = new BABYLON.Color3(c.r, c.g, c.b);
    mat.emissiveColor = new BABYLON.Color3(c.r * 0.2, c.g * 0.2, c.b * 0.2);
    mat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.02);
    ground.material = mat;

    ground.physicsImpostor = new BABYLON.PhysicsImpostor(
      ground, BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0.8, restitution: 0 }, this.scene
    );
  }

  // --- Borders ---
  _buildBorders(levelIndex) {
    // Shadow Realm and The Void: skip visible mountains — fog hides the edges
    if (levelIndex === 5 || levelIndex === 9) {
      const wh = 30;
      this._createWall(0, 0, -150, 300, wh, 2).isVisible = false;
      this._createWall(0, 0, 150, 300, wh, 2).isVisible = false;
      this._createWall(150, 0, 0, 2, wh, 300).isVisible = false;
      this._createWall(-150, 0, 0, 2, wh, 300).isVisible = false;
      return;
    }

    const borderSize = 140;
    // Choose border material based on level theme
    const borderMats = {
      3: this.materials.lava,       // Lava Fortress
      4: this.materials.ice,        // Frozen Depths
    };
    const borderMat = borderMats[levelIndex] || this.materials.mountain;

    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2;
      const x = Math.cos(angle) * borderSize;
      const z = Math.sin(angle) * borderSize;
      const height = 15 + Math.random() * 20;
      const m = this._track(BABYLON.MeshBuilder.CreateCylinder('mountain', {
        height, diameterTop: 0, diameterBottom: 10 + Math.random() * 8
      }, this.scene));
      m.position = new BABYLON.Vector3(x, height / 2, z);
      m.material = borderMat;
    }
    // Invisible walls
    const wh = 30;
    this._createWall(0, 0, -150, 300, wh, 2).isVisible = false;
    this._createWall(0, 0, 150, 300, wh, 2).isVisible = false;
    this._createWall(150, 0, 0, 2, wh, 300).isVisible = false;
    this._createWall(-150, 0, 0, 2, wh, 300).isVisible = false;
  }

  // ============================================
  // LEVEL 1: Castle Siege -- Castle + Village
  // ============================================
  _buildCastleMap() {
    // Castle
    this._buildCastle(0, -26);
    // Village huts (scaled 1.3x outward)
    [[13, 6.5], [19.5, 10.4], [-13, 3.9], [-18.2, 9.1], [10.4, 19.5], [-10.4, 23.4]].forEach(([x, z]) => {
      this._createHut(x, z);
    });
    // Some trees around village (scaled spread)
    for (let i = 0; i < 15; i++) {
      const x = -39 + Math.random() * 78;
      const z = 26 + Math.random() * 52;
      this._createTree(x, z, 3 + Math.random() * 3);
    }
    // Torches at castle entrance
    this._addTorches([
      new BABYLON.Vector3(2, 0, -19.5),
      new BABYLON.Vector3(-2, 0, -19.5),
    ]);
    // Training dummies (decorative boxes) (scaled 1.3x)
    [[-26, -13], [28.6, -6.5]].forEach(([x, z]) => {
      const dummy = this._track(BABYLON.MeshBuilder.CreateBox('dummy', {
        width: 0.6, height: 1.8, depth: 0.4
      }, this.scene));
      dummy.position = new BABYLON.Vector3(x, 0.9, z);
      dummy.material = this.materials.hut;
    });
    // Well in village center (scaled 1.3x)
    const well = this._track(BABYLON.MeshBuilder.CreateCylinder('well', {
      height: 1.2, diameter: 2, tessellation: 12
    }, this.scene));
    well.position = new BABYLON.Vector3(0, 0.6, 10.4);
    well.material = this.materials.stone;
    well.physicsImpostor = new BABYLON.PhysicsImpostor(
      well, BABYLON.PhysicsImpostor.CylinderImpostor,
      { mass: 0, friction: 0.5 }, this.scene
    );

    // Enterable houses
    this._createHouse(20, 20, 'tavern', 'large');
    this._createHouse(-20, 20, 'armory', 'medium');
    this._createHouse(30, -30, 'bedroom', 'small');
    this._createHouse(-25, -35, 'library', 'medium');
  }

  // ============================================
  // LEVEL 2: Forest Hunt -- Dense forest + Ruins + River
  // ============================================
  _buildForestMap() {
    // Dense forest -- 60 trees (scaled 1.3x spread)
    for (let i = 0; i < 60; i++) {
      const x = -78 + Math.random() * 156;
      const z = -78 + Math.random() * 156;
      this._createTree(x, z, 4 + Math.random() * 6);
    }
    // Ancient ruins complex (scaled 1.3x)
    this._createRuins(0, 0);
    this._createRuins(-39, 32.5);
    // Glowing crystals scattered (scaled 1.3x)
    [
      [19.5, -26], [-32.5, 13], [45.5, 39], [-52, -45.5], [65, -13], [-13, 58.5]
    ].forEach(([x, z]) => {
      this._createCrystal(new BABYLON.Vector3(x, 0, z));
    });
    // River (long flat blue box) (scaled 1.3x)
    const river = this._track(BABYLON.MeshBuilder.CreateBox('river', {
      width: 6, height: 0.05, depth: 208
    }, this.scene));
    river.position = new BABYLON.Vector3(26, 0.06, 0);
    river.material = this.materials.ice;
    // Bridges over river (scaled 1.3x)
    [[-15, 0], [0, 39], [0, -39]].forEach(([xOff, z]) => {
      const b = this._track(BABYLON.MeshBuilder.CreateBox('rivBridge', {
        width: 10, height: 0.4, depth: 3
      }, this.scene));
      b.position = new BABYLON.Vector3(26 + xOff, 0.3, z);
      b.material = this.materials.bridge;
      b.physicsImpostor = new BABYLON.PhysicsImpostor(
        b, BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, friction: 0.8 }, this.scene
      );
    });
    // Fallen logs (obstacles) (scaled 1.3x)
    for (let i = 0; i < 8; i++) {
      const x = -65 + Math.random() * 130;
      const z = -65 + Math.random() * 130;
      const log = this._track(BABYLON.MeshBuilder.CreateCylinder('log', {
        height: 4 + Math.random() * 3, diameter: 0.6
      }, this.scene));
      log.position = new BABYLON.Vector3(x, 0.3, z);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = Math.random() * Math.PI;
      log.material = this.materials.trunk;
    }
    // Mushroom rocks (scaled 1.3x)
    for (let i = 0; i < 5; i++) {
      const x = -52 + Math.random() * 104;
      const z = -52 + Math.random() * 104;
      const stem = this._track(BABYLON.MeshBuilder.CreateCylinder('mStem', {
        height: 2, diameter: 0.8
      }, this.scene));
      stem.position = new BABYLON.Vector3(x, 1, z);
      stem.material = this.materials.stone;
      const cap = this._track(BABYLON.MeshBuilder.CreateCylinder('mCap', {
        height: 0.6, diameterTop: 0.3, diameterBottom: 2.5
      }, this.scene));
      cap.position = new BABYLON.Vector3(x, 2.3, z);
      cap.material = this.materials.leaves;
    }

    // Enterable houses
    this._createHouse(-40, -40, 'library', 'small');
    this._createHouse(40, 40, 'bedroom', 'large');
    this._createHouse(-35, 35, 'kitchen', 'medium');
  }

  // ============================================
  // LEVEL 3: Sky Battle -- Floating islands + Lava below + Dark towers
  // ============================================
  _buildSkyMap() {
    // Lava floor instead of grass (below the islands)
    const lavaFloor = this._track(BABYLON.MeshBuilder.CreateBox('lava', {
      width: 300, height: 0.1, depth: 300
    }, this.scene));
    lavaFloor.position.y = -5;
    lavaFloor.material = this.materials.lava;

    // Main islands (scaled 1.3x positions)
    const islands = [
      { x: 0, y: 8, z: 0, size: 16 },
      { x: -32.5, y: 12, z: -26, size: 10 },
      { x: 32.5, y: 10, z: -19.5, size: 12 },
      { x: 0, y: 16, z: -52, size: 8 },
      { x: -39, y: 6, z: 26, size: 10 },
      { x: 39, y: 14, z: 32.5, size: 8 },
      { x: 0, y: 22, z: -78, size: 6 },
    ];
    islands.forEach((island, i) => {
      this._createFloatingIsland(island.x, island.y, island.z, island.size, i);
    });

    // Bridges between islands
    this._createBridge(0, 8, 0, -32.5, 12, -26);
    this._createBridge(0, 8, 0, 32.5, 10, -19.5);
    this._createBridge(-32.5, 12, -26, 0, 16, -52);
    this._createBridge(32.5, 10, -19.5, 0, 16, -52);
    this._createBridge(0, 8, 0, -39, 6, 26);
    this._createBridge(0, 8, 0, 39, 14, 32.5);
    this._createBridge(0, 16, -52, 0, 22, -78);

    // Dark towers on some islands
    [[-32.5, 12, -26], [32.5, 10, -19.5], [0, 22, -78]].forEach(([x, y, z]) => {
      const tower = this._track(BABYLON.MeshBuilder.CreateCylinder('dTower', {
        height: 8, diameter: 2
      }, this.scene));
      tower.position = new BABYLON.Vector3(x, y + 5, z);
      tower.material = this.materials.darkStone;
      const roof = this._track(BABYLON.MeshBuilder.CreateCylinder('dRoof', {
        height: 3, diameterTop: 0, diameterBottom: 2.5
      }, this.scene));
      roof.position = new BABYLON.Vector3(x, y + 10.5, z);
      roof.material = this.materials.towerRoof;
    });

    // Crystals on islands
    [[0, 9, 0], [-32.5, 13, -26], [39, 15, 32.5]].forEach(([x, y, z]) => {
      this._createCrystal(new BABYLON.Vector3(x, y, z));
    });

    // No houses on sky map
  }

  // ============================================
  // Building helpers
  // ============================================
  _createWall(x, y, z, width, height, depth) {
    const wall = this._track(BABYLON.MeshBuilder.CreateBox('wall', {
      width, height, depth
    }, this.scene));
    wall.position = new BABYLON.Vector3(x, y + height / 2, z);
    wall.material = this.materials.wall;
    wall.physicsImpostor = new BABYLON.PhysicsImpostor(
      wall, BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0.5 }, this.scene
    );
    return wall;
  }

  _buildCastle(x, z) {
    const h = 10, t = 1;
    this._createWall(x, 0, z - 6, 12, h, t);
    this._createWall(x - 4, 0, z + 6, 4, h, t);
    this._createWall(x + 4, 0, z + 6, 4, h, t);
    this._createWall(x - 6, 0, z, t, h, 12);
    this._createWall(x + 6, 0, z, t, h, 12);

    const floor = this._track(BABYLON.MeshBuilder.CreateGround('castleFloor', {
      width: 11, height: 11
    }, this.scene));
    floor.position = new BABYLON.Vector3(x, 0.01, z);
    const floorMat = new BABYLON.StandardMaterial('floorMat', this.scene);
    floorMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    floorMat.emissiveColor = new BABYLON.Color3(0.06, 0.06, 0.06);
    floor.material = floorMat;

    // Towers at corners
    [[-7, -7], [7, -7], [-7, 7], [7, 7]].forEach(([tx, tz]) => {
      const tower = this._track(BABYLON.MeshBuilder.CreateCylinder('tower', {
        height: 14, diameter: 4
      }, this.scene));
      tower.position = new BABYLON.Vector3(x + tx, 7, z + tz);
      tower.material = this.materials.tower;
      tower.physicsImpostor = new BABYLON.PhysicsImpostor(
        tower, BABYLON.PhysicsImpostor.CylinderImpostor,
        { mass: 0, friction: 0.5 }, this.scene
      );
      const roof = this._track(BABYLON.MeshBuilder.CreateCylinder('roof', {
        height: 4, diameterTop: 0, diameterBottom: 3
      }, this.scene));
      roof.position = new BABYLON.Vector3(x + tx, 15, z + tz);
      roof.material = this.materials.towerRoof;
    });
  }

  _createHut(x, z) {
    const hut = this._track(BABYLON.MeshBuilder.CreateBox('hut', {
      width: 3, height: 2.5, depth: 3
    }, this.scene));
    hut.position = new BABYLON.Vector3(x, 1.25, z);
    hut.material = this.materials.hut;
    const roof = this._track(BABYLON.MeshBuilder.CreateCylinder('roof', {
      height: 2, diameterTop: 0, diameterBottom: 4.2, tessellation: 4
    }, this.scene));
    roof.position = new BABYLON.Vector3(x, 3.5, z);
    roof.rotation.y = Math.PI / 4;
    roof.material = this.materials.hutRoof;
  }

  // ============================================
  // Enterable House helper
  // ============================================
  _createHouse(x, z, theme, size) {
    // Size presets: 'small', 'medium', 'large' (default medium)
    const sizes = {
      small:  { W: 6,  H: 3,  doorW: 1.6, doorH: 2.6 },
      medium: { W: 8,  H: 4,  doorW: 2,   doorH: 3   },
      large:  { W: 12, H: 5,  doorW: 2.5, doorH: 3.5 },
    };
    const s = sizes[size] || sizes.medium;
    const W = s.W;
    const H = s.H;
    const T = 0.3;   // wall thickness
    const doorW = s.doorW;
    const doorH = s.doorH;

    // Floor
    const floor = this._track(BABYLON.MeshBuilder.CreateBox('houseFloor', {
      width: W, height: 0.1, depth: W
    }, this.scene));
    floor.position = new BABYLON.Vector3(x, 0.05, z);
    floor.material = this.materials.stone;

    // Back wall (solid)
    const backWall = this._track(BABYLON.MeshBuilder.CreateBox('houseBackWall', {
      width: W, height: H, depth: T
    }, this.scene));
    backWall.position = new BABYLON.Vector3(x, H / 2, z - W / 2);
    backWall.material = this.materials.hut;
    backWall.physicsImpostor = new BABYLON.PhysicsImpostor(
      backWall, BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0.5 }, this.scene
    );

    // Left wall (solid)
    const leftWall = this._track(BABYLON.MeshBuilder.CreateBox('houseLeftWall', {
      width: T, height: H, depth: W
    }, this.scene));
    leftWall.position = new BABYLON.Vector3(x - W / 2, H / 2, z);
    leftWall.material = this.materials.hut;
    leftWall.physicsImpostor = new BABYLON.PhysicsImpostor(
      leftWall, BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0.5 }, this.scene
    );

    // Right wall (solid)
    const rightWall = this._track(BABYLON.MeshBuilder.CreateBox('houseRightWall', {
      width: T, height: H, depth: W
    }, this.scene));
    rightWall.position = new BABYLON.Vector3(x + W / 2, H / 2, z);
    rightWall.material = this.materials.hut;
    rightWall.physicsImpostor = new BABYLON.PhysicsImpostor(
      rightWall, BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0.5 }, this.scene
    );

    // Front wall -- split into two pieces with door opening in center
    // Left piece of front wall
    const frontLeftW = (W - doorW) / 2;
    const frontLeft = this._track(BABYLON.MeshBuilder.CreateBox('houseFrontL', {
      width: frontLeftW, height: H, depth: T
    }, this.scene));
    frontLeft.position = new BABYLON.Vector3(x - W / 2 + frontLeftW / 2, H / 2, z + W / 2);
    frontLeft.material = this.materials.hut;
    frontLeft.physicsImpostor = new BABYLON.PhysicsImpostor(
      frontLeft, BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0.5 }, this.scene
    );

    // Right piece of front wall
    const frontRight = this._track(BABYLON.MeshBuilder.CreateBox('houseFrontR', {
      width: frontLeftW, height: H, depth: T
    }, this.scene));
    frontRight.position = new BABYLON.Vector3(x + W / 2 - frontLeftW / 2, H / 2, z + W / 2);
    frontRight.material = this.materials.hut;
    frontRight.physicsImpostor = new BABYLON.PhysicsImpostor(
      frontRight, BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0.5 }, this.scene
    );

    // Top piece above door (lintel)
    const lintelH = H - doorH;
    if (lintelH > 0) {
      const lintel = this._track(BABYLON.MeshBuilder.CreateBox('houseLintel', {
        width: doorW, height: lintelH, depth: T
      }, this.scene));
      lintel.position = new BABYLON.Vector3(x, doorH + lintelH / 2, z + W / 2);
      lintel.material = this.materials.hut;
      lintel.physicsImpostor = new BABYLON.PhysicsImpostor(
        lintel, BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, friction: 0.5 }, this.scene
      );
    }

    // Roof (pyramid shape using tessellation 4 cylinder)
    const roofH = W * 0.375;  // proportional roof height
    const roof = this._track(BABYLON.MeshBuilder.CreateCylinder('houseRoof', {
      height: roofH, diameterTop: 0, diameterBottom: W * 1.3, tessellation: 4
    }, this.scene));
    roof.position = new BABYLON.Vector3(x, H + roofH / 2, z);
    roof.rotation.y = Math.PI / 4;
    roof.material = this.materials.hutRoof;

    // Interior warm point light
    const light = this._trackLight(new BABYLON.PointLight('houseLight',
      new BABYLON.Vector3(x, H - 0.5, z), this.scene));
    light.diffuse = new BABYLON.Color3(1, 0.85, 0.6);
    light.intensity = 0.8;
    light.range = W * 1.5;

    // Add furniture based on theme (scale factor relative to default W=8)
    const furnScale = W / 8;
    this._addHouseFurniture(x, z, theme, furnScale);
  }

  _addHouseFurniture(x, z, theme, sc) {
    // sc = scale factor (0.75 for small, 1.0 for medium, 1.5 for large)
    sc = sc || 1;
    switch (theme) {
      case 'tavern': {
        // Table in center
        const table = this._track(BABYLON.MeshBuilder.CreateBox('tavernTable', {
          width: 2.5 * sc, height: 0.15, depth: 1.5 * sc
        }, this.scene));
        table.position = new BABYLON.Vector3(x, 1.0, z - 0.5 * sc);
        table.material = this.materials.wood;
        // Table legs
        [[-1, -0.5], [1, -0.5], [-1, 0.5], [1, 0.5]].forEach(([lx, lz]) => {
          const leg = this._track(BABYLON.MeshBuilder.CreateBox('tableLeg', {
            width: 0.15, height: 0.9, depth: 0.15
          }, this.scene));
          leg.position = new BABYLON.Vector3(x + lx * sc, 0.45, z - 0.5 * sc + lz * sc);
          leg.material = this.materials.wood;
        });
        // Chairs around table
        [[-1.8, -0.5], [1.8, -0.5], [0, -1.5], [0, 0.5]].forEach(([cx, cz]) => {
          const chair = this._track(BABYLON.MeshBuilder.CreateBox('chair', {
            width: 0.5, height: 0.7, depth: 0.5
          }, this.scene));
          chair.position = new BABYLON.Vector3(x + cx * sc, 0.35, z - 0.5 * sc + cz * sc);
          chair.material = this.materials.wood;
          const back = this._track(BABYLON.MeshBuilder.CreateBox('chairBack', {
            width: 0.5, height: 0.5, depth: 0.08
          }, this.scene));
          back.position = new BABYLON.Vector3(x + cx * sc, 0.95, z - 0.5 * sc + cz * sc + (cz >= 0 ? 0.21 : -0.21));
          back.material = this.materials.wood;
        });
        // Barrel in corner
        const barrel = this._track(BABYLON.MeshBuilder.CreateCylinder('barrel', {
          height: 1.4, diameter: 0.9, tessellation: 12
        }, this.scene));
        barrel.position = new BABYLON.Vector3(x - 3 * sc, 0.7, z - 3 * sc);
        barrel.material = this.materials.trunk;
        const barrel2 = this._track(BABYLON.MeshBuilder.CreateCylinder('barrel2', {
          height: 1.4, diameter: 0.9, tessellation: 12
        }, this.scene));
        barrel2.position = new BABYLON.Vector3(x - 2.2 * sc, 0.7, z - 3.2 * sc);
        barrel2.material = this.materials.trunk;
        // Extra barrels in large houses
        if (sc > 1.2) {
          const barrel3 = this._track(BABYLON.MeshBuilder.CreateCylinder('barrel3', {
            height: 1.4, diameter: 0.9, tessellation: 12
          }, this.scene));
          barrel3.position = new BABYLON.Vector3(x + 3 * sc, 0.7, z - 3 * sc);
          barrel3.material = this.materials.trunk;
        }
        // Mugs on table
        [[-0.6, -0.3], [0.5, 0.2], [-0.2, 0.4]].forEach(([mx, mz]) => {
          const mug = this._track(BABYLON.MeshBuilder.CreateCylinder('mug', {
            height: 0.2, diameter: 0.15, tessellation: 8
          }, this.scene));
          mug.position = new BABYLON.Vector3(x + mx * sc, 1.2, z - 0.5 * sc + mz * sc);
          mug.material = this.materials.wood;
        });
        break;
      }
      case 'armory': {
        // Weapon rack against back wall
        const rack = this._track(BABYLON.MeshBuilder.CreateBox('weaponRack', {
          width: 2.5 * sc, height: 3, depth: 0.3
        }, this.scene));
        rack.position = new BABYLON.Vector3(x, 1.5, z - 3.5 * sc);
        rack.material = this.materials.wood;
        // Weapons on rack
        const weaponCount = sc > 1.2 ? 6 : 4;
        for (let i = 0; i < weaponCount; i++) {
          const weapon = this._track(BABYLON.MeshBuilder.CreateCylinder('weapon', {
            height: 2.2, diameter: 0.08, tessellation: 6
          }, this.scene));
          weapon.position = new BABYLON.Vector3(x - 0.8 * sc + i * 0.55 * sc, 1.8, z - 3.3 * sc);
          weapon.material = this.materials.metal;
        }
        // Armor stands
        const armorBody = this._track(BABYLON.MeshBuilder.CreateCylinder('armorStand', {
          height: 1.8, diameter: 0.6, tessellation: 8
        }, this.scene));
        armorBody.position = new BABYLON.Vector3(x + 2.5 * sc, 0.9, z - 1 * sc);
        armorBody.material = this.materials.metal;
        const armorHead = this._track(BABYLON.MeshBuilder.CreateSphere('armorHead', {
          diameter: 0.5
        }, this.scene));
        armorHead.position = new BABYLON.Vector3(x + 2.5 * sc, 2.1, z - 1 * sc);
        armorHead.material = this.materials.metal;
        const armorBody2 = this._track(BABYLON.MeshBuilder.CreateCylinder('armorStand2', {
          height: 1.8, diameter: 0.6, tessellation: 8
        }, this.scene));
        armorBody2.position = new BABYLON.Vector3(x - 2.5 * sc, 0.9, z - 1 * sc);
        armorBody2.material = this.materials.metal;
        const armorHead2 = this._track(BABYLON.MeshBuilder.CreateSphere('armorHead2', {
          diameter: 0.5
        }, this.scene));
        armorHead2.position = new BABYLON.Vector3(x - 2.5 * sc, 2.1, z - 1 * sc);
        armorHead2.material = this.materials.metal;
        // Extra armor stand in large houses
        if (sc > 1.2) {
          const armorBody3 = this._track(BABYLON.MeshBuilder.CreateCylinder('armorStand3', {
            height: 1.8, diameter: 0.6, tessellation: 8
          }, this.scene));
          armorBody3.position = new BABYLON.Vector3(x, 0.9, z + 2 * sc);
          armorBody3.material = this.materials.metal;
          const armorHead3 = this._track(BABYLON.MeshBuilder.CreateSphere('armorHead3', {
            diameter: 0.5
          }, this.scene));
          armorHead3.position = new BABYLON.Vector3(x, 2.1, z + 2 * sc);
          armorHead3.material = this.materials.metal;
        }
        // Chest with gold trim
        const chest = this._track(BABYLON.MeshBuilder.CreateBox('chest', {
          width: 1.2, height: 0.8, depth: 0.8
        }, this.scene));
        chest.position = new BABYLON.Vector3(x, 0.4, z + 2 * sc);
        chest.material = this.materials.wood;
        const chestTrim = this._track(BABYLON.MeshBuilder.CreateBox('chestTrim', {
          width: 1.3, height: 0.1, depth: 0.85
        }, this.scene));
        chestTrim.position = new BABYLON.Vector3(x, 0.8, z + 2 * sc);
        chestTrim.material = this.materials.gold;
        break;
      }
      case 'library': {
        // Bookshelves along back wall
        const shelfPositions = sc > 1.2
          ? [[-4, -3.5], [-1.5, -3.5], [1.5, -3.5], [4, -3.5]]
          : [[-2.5, -3.5], [0, -3.5], [2.5, -3.5]];
        shelfPositions.forEach(([bx, bz]) => {
          const shelf = this._track(BABYLON.MeshBuilder.CreateBox('bookshelf', {
            width: 2, height: 3.2, depth: 0.6
          }, this.scene));
          shelf.position = new BABYLON.Vector3(x + bx * sc, 1.6, z + bz * sc);
          shelf.material = this.materials.wood;
          for (let row = 0; row < 3; row++) {
            const bookBlock = this._track(BABYLON.MeshBuilder.CreateBox('books', {
              width: 1.6, height: 0.3, depth: 0.4
            }, this.scene));
            bookBlock.position = new BABYLON.Vector3(x + bx * sc, 0.5 + row * 1.0, z + bz * sc + 0.05);
            const bookMat = new BABYLON.StandardMaterial('bookMat', this.scene);
            const colors = [[0.5, 0.15, 0.1], [0.1, 0.3, 0.5], [0.15, 0.4, 0.15]];
            const c = colors[row];
            bookMat.diffuseColor = new BABYLON.Color3(c[0], c[1], c[2]);
            bookMat.emissiveColor = new BABYLON.Color3(c[0] * 0.15, c[1] * 0.15, c[2] * 0.15);
            bookBlock.material = bookMat;
          }
        });
        // Bookshelf along left wall
        const sideShelf = this._track(BABYLON.MeshBuilder.CreateBox('sideBookshelf', {
          width: 0.6, height: 3.2, depth: 3 * sc
        }, this.scene));
        sideShelf.position = new BABYLON.Vector3(x - 3.5 * sc, 1.6, z);
        sideShelf.material = this.materials.wood;
        // Desk in center
        const desk = this._track(BABYLON.MeshBuilder.CreateBox('desk', {
          width: 2 * sc, height: 0.12, depth: 1.2 * sc
        }, this.scene));
        desk.position = new BABYLON.Vector3(x + 0.5 * sc, 1.0, z + 1 * sc);
        desk.material = this.materials.wood;
        [[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]].forEach(([lx, lz]) => {
          const leg = this._track(BABYLON.MeshBuilder.CreateBox('deskLeg', {
            width: 0.1, height: 0.9, depth: 0.1
          }, this.scene));
          leg.position = new BABYLON.Vector3(x + 0.5 * sc + lx * sc, 0.45, z + 1 * sc + lz * sc);
          leg.material = this.materials.wood;
        });
        // Candle on desk
        const candle = this._track(BABYLON.MeshBuilder.CreateCylinder('candle', {
          height: 0.3, diameter: 0.1, tessellation: 8
        }, this.scene));
        candle.position = new BABYLON.Vector3(x + 0.5 * sc, 1.25, z + 1 * sc);
        candle.material = this.materials.sand;
        const candleFlame = this._track(BABYLON.MeshBuilder.CreateSphere('candleFlame', {
          diameter: 0.12
        }, this.scene));
        candleFlame.position = new BABYLON.Vector3(x + 0.5 * sc, 1.46, z + 1 * sc);
        const flameMat = new BABYLON.StandardMaterial('candleFlameMat', this.scene);
        flameMat.diffuseColor = new BABYLON.Color3(1, 0.8, 0.2);
        flameMat.emissiveColor = new BABYLON.Color3(0.5, 0.4, 0.1);
        candleFlame.material = flameMat;
        const candleLight = this._trackLight(new BABYLON.PointLight('candleLight',
          new BABYLON.Vector3(x + 0.5 * sc, 1.6, z + 1 * sc), this.scene));
        candleLight.diffuse = new BABYLON.Color3(1, 0.85, 0.5);
        candleLight.intensity = 0.4;
        candleLight.range = 5 * sc;
        break;
      }
      case 'bedroom': {
        // Bed
        const bed = this._track(BABYLON.MeshBuilder.CreateBox('bed', {
          width: 2, height: 0.5, depth: 3.5
        }, this.scene));
        bed.position = new BABYLON.Vector3(x - 2.5 * sc, 0.35, z - 1.5 * sc);
        bed.material = this.materials.fabric;
        const bedFrame = this._track(BABYLON.MeshBuilder.CreateBox('bedFrame', {
          width: 2.2, height: 0.2, depth: 3.7
        }, this.scene));
        bedFrame.position = new BABYLON.Vector3(x - 2.5 * sc, 0.1, z - 1.5 * sc);
        bedFrame.material = this.materials.wood;
        const pillow = this._track(BABYLON.MeshBuilder.CreateSphere('pillow', {
          diameter: 0.6
        }, this.scene));
        pillow.position = new BABYLON.Vector3(x - 2.5 * sc, 0.7, z - 2.8 * sc);
        pillow.scaling = new BABYLON.Vector3(1.2, 0.5, 0.8);
        const pillowMat = new BABYLON.StandardMaterial('pillowMat', this.scene);
        pillowMat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.85);
        pillowMat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.12);
        pillow.material = pillowMat;
        const blanket = this._track(BABYLON.MeshBuilder.CreateBox('blanket', {
          width: 1.8, height: 0.08, depth: 2.2
        }, this.scene));
        blanket.position = new BABYLON.Vector3(x - 2.5 * sc, 0.65, z - 0.8 * sc);
        const blanketMat = new BABYLON.StandardMaterial('blanketMat', this.scene);
        blanketMat.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.5);
        blanketMat.emissiveColor = new BABYLON.Color3(0.04, 0.06, 0.1);
        blanket.material = blanketMat;
        // Wardrobe
        const wardrobe = this._track(BABYLON.MeshBuilder.CreateBox('wardrobe', {
          width: 1.5, height: 3, depth: 0.8
        }, this.scene));
        wardrobe.position = new BABYLON.Vector3(x + 3 * sc, 1.5, z - 3 * sc);
        wardrobe.material = this.materials.wood;
        // Nightstand
        const nightstand = this._track(BABYLON.MeshBuilder.CreateBox('nightstand', {
          width: 0.7, height: 0.6, depth: 0.7
        }, this.scene));
        nightstand.position = new BABYLON.Vector3(x - 0.8 * sc, 0.3, z - 2.5 * sc);
        nightstand.material = this.materials.wood;
        const candle = this._track(BABYLON.MeshBuilder.CreateCylinder('bedroomCandle', {
          height: 0.25, diameter: 0.08, tessellation: 8
        }, this.scene));
        candle.position = new BABYLON.Vector3(x - 0.8 * sc, 0.75, z - 2.5 * sc);
        candle.material = this.materials.sand;
        // Second bed in large bedrooms
        if (sc > 1.2) {
          const bed2 = this._track(BABYLON.MeshBuilder.CreateBox('bed2', {
            width: 2, height: 0.5, depth: 3.5
          }, this.scene));
          bed2.position = new BABYLON.Vector3(x + 2.5 * sc, 0.35, z - 1.5 * sc);
          bed2.material = this.materials.fabric;
          const bedFrame2 = this._track(BABYLON.MeshBuilder.CreateBox('bedFrame2', {
            width: 2.2, height: 0.2, depth: 3.7
          }, this.scene));
          bedFrame2.position = new BABYLON.Vector3(x + 2.5 * sc, 0.1, z - 1.5 * sc);
          bedFrame2.material = this.materials.wood;
        }
        break;
      }
      case 'kitchen': {
        // Oven against back wall
        const oven = this._track(BABYLON.MeshBuilder.CreateBox('oven', {
          width: 1.5, height: 1.5, depth: 1.5
        }, this.scene));
        oven.position = new BABYLON.Vector3(x + 2.5 * sc, 0.75, z - 3 * sc);
        oven.material = this.materials.stone;
        const ovenHole = this._track(BABYLON.MeshBuilder.CreateBox('ovenHole', {
          width: 0.8, height: 0.6, depth: 0.05
        }, this.scene));
        ovenHole.position = new BABYLON.Vector3(x + 2.5 * sc, 0.6, z - 2.24 * sc);
        ovenHole.material = this.materials.darkStone;
        const ovenGlow = this._trackLight(new BABYLON.PointLight('ovenGlow',
          new BABYLON.Vector3(x + 2.5 * sc, 0.6, z - 2.8 * sc), this.scene));
        ovenGlow.diffuse = new BABYLON.Color3(1, 0.4, 0.1);
        ovenGlow.intensity = 0.3;
        ovenGlow.range = 3;
        // Counter along left wall
        const counter = this._track(BABYLON.MeshBuilder.CreateBox('counter', {
          width: 0.8, height: 1.0, depth: 4 * sc
        }, this.scene));
        counter.position = new BABYLON.Vector3(x - 3.2 * sc, 0.5, z - 0.5 * sc);
        counter.material = this.materials.stone;
        const counterTop = this._track(BABYLON.MeshBuilder.CreateBox('counterTop', {
          width: 1.0, height: 0.08, depth: 4.2 * sc
        }, this.scene));
        counterTop.position = new BABYLON.Vector3(x - 3.2 * sc, 1.04, z - 0.5 * sc);
        counterTop.material = this.materials.wood;
        // Pots on counter
        [[-1.2], [0], [1.0]].forEach(([pz]) => {
          const pot = this._track(BABYLON.MeshBuilder.CreateCylinder('pot', {
            height: 0.3, diameter: 0.35, tessellation: 10
          }, this.scene));
          pot.position = new BABYLON.Vector3(x - 3.2 * sc, 1.23, z - 0.5 * sc + pz * sc);
          pot.material = this.materials.metal;
        });
        // Table in center
        const table = this._track(BABYLON.MeshBuilder.CreateBox('kitchenTable', {
          width: 1.8 * sc, height: 0.1, depth: 1.2 * sc
        }, this.scene));
        table.position = new BABYLON.Vector3(x + 0.5 * sc, 0.9, z + 1 * sc);
        table.material = this.materials.wood;
        [[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]].forEach(([lx, lz]) => {
          const leg = this._track(BABYLON.MeshBuilder.CreateBox('tLeg', {
            width: 0.1, height: 0.85, depth: 0.1
          }, this.scene));
          leg.position = new BABYLON.Vector3(x + 0.5 * sc + lx * sc, 0.42, z + 1 * sc + lz * sc);
          leg.material = this.materials.wood;
        });
        // Hanging pot rack
        const rack = this._track(BABYLON.MeshBuilder.CreateCylinder('potRack', {
          height: 2.5 * sc, diameter: 0.06, tessellation: 6
        }, this.scene));
        rack.position = new BABYLON.Vector3(x + 0.5 * sc, 3.2, z + 1 * sc);
        rack.rotation.z = Math.PI / 2;
        rack.material = this.materials.metal;
        // Second oven in large kitchens
        if (sc > 1.2) {
          const oven2 = this._track(BABYLON.MeshBuilder.CreateBox('oven2', {
            width: 1.5, height: 1.5, depth: 1.5
          }, this.scene));
          oven2.position = new BABYLON.Vector3(x - 2.5 * sc, 0.75, z - 3 * sc);
          oven2.material = this.materials.stone;
        }
        break;
      }
      default:
        break;
    }
  }

  _createTree(x, z, height) {
    height = height || 3;
    const trunk = this._track(BABYLON.MeshBuilder.CreateCylinder('trunk', {
      height, diameter: 0.5
    }, this.scene));
    trunk.position = new BABYLON.Vector3(x, height / 2, z);
    trunk.material = this.materials.trunk;
    trunk.physicsImpostor = new BABYLON.PhysicsImpostor(
      trunk, BABYLON.PhysicsImpostor.CylinderImpostor,
      { mass: 0, friction: 0.5 }, this.scene
    );
    const leaves = this._track(BABYLON.MeshBuilder.CreateSphere('leaves', {
      diameter: 1.5 + height * 0.3
    }, this.scene));
    leaves.position = new BABYLON.Vector3(x, height + 0.5, z);
    leaves.material = this.materials.leaves;
  }

  _createCrystal(position) {
    const crystal = this._track(BABYLON.MeshBuilder.CreateCylinder('crystal', {
      height: 2.5, diameterTop: 0, diameterBottom: 0.8, tessellation: 6
    }, this.scene));
    crystal.position = position.clone();
    crystal.position.y += 1.25;
    crystal.material = this.materials.crystal;
    const light = this._trackLight(new BABYLON.PointLight('crystalLight', crystal.position.clone(), this.scene));
    light.diffuse = new BABYLON.Color3(0.3, 0.7, 1);
    light.intensity = 0.8;
    light.range = 8;
  }

  _createRuins(x, z) {
    const base = this._track(BABYLON.MeshBuilder.CreateBox('ruinBase', {
      width: 12, height: 0.5, depth: 12
    }, this.scene));
    base.position = new BABYLON.Vector3(x, 0.25, z);
    base.material = this.materials.stone;
    base.physicsImpostor = new BABYLON.PhysicsImpostor(
      base, BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0.5 }, this.scene
    );
    [[-4, -4], [4, -4], [-4, 4], [4, 4], [0, -4], [0, 4]].forEach(([px, pz]) => {
      const h = 2 + Math.random() * 4;
      const pillar = this._track(BABYLON.MeshBuilder.CreateCylinder('ruinPillar', {
        height: h, diameter: 0.8
      }, this.scene));
      pillar.position = new BABYLON.Vector3(x + px, h / 2 + 0.5, z + pz);
      pillar.material = this.materials.stone;
      pillar.physicsImpostor = new BABYLON.PhysicsImpostor(
        pillar, BABYLON.PhysicsImpostor.CylinderImpostor,
        { mass: 0, friction: 0.5 }, this.scene
      );
    });
  }

  _createFloatingIsland(x, y, z, size, index) {
    const top = this._track(BABYLON.MeshBuilder.CreateCylinder('island', {
      height: 2, diameter: size, tessellation: 8
    }, this.scene));
    top.position = new BABYLON.Vector3(x, y, z);
    top.material = this.materials.island;
    top.physicsImpostor = new BABYLON.PhysicsImpostor(
      top, BABYLON.PhysicsImpostor.CylinderImpostor,
      { mass: 0, friction: 0.8 }, this.scene
    );
    const bottom = this._track(BABYLON.MeshBuilder.CreateCylinder('islandBottom', {
      height: 3, diameterTop: size, diameterBottom: size * 0.3, tessellation: 6
    }, this.scene));
    bottom.position = new BABYLON.Vector3(x, y - 2.5, z);
    bottom.material = this.materials.stone;
    if (index < 5) {
      this._createTree(x + 1, z + 1, 3);
    }
  }

  _createBridge(x1, y1, z1, x2, y2, z2) {
    const start = new BABYLON.Vector3(x1, y1, z1);
    const end = new BABYLON.Vector3(x2, y2, z2);
    const mid = BABYLON.Vector3.Center(start, end);
    const length = BABYLON.Vector3.Distance(start, end);
    const bridge = this._track(BABYLON.MeshBuilder.CreateBox('bridge', {
      width: 2.5, height: 0.4, depth: length
    }, this.scene));
    bridge.position = mid;
    bridge.material = this.materials.bridge;
    bridge.lookAt(end);
    bridge.physicsImpostor = new BABYLON.PhysicsImpostor(
      bridge, BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0.8 }, this.scene
    );
  }

  _addTorches(positions) {
    const torchMat = new BABYLON.StandardMaterial('torchMat', this.scene);
    torchMat.diffuseColor = new BABYLON.Color3(0.3, 0.2, 0.1);
    positions.forEach(pos => {
      const pole = this._track(BABYLON.MeshBuilder.CreateCylinder('torch', {
        height: 3, diameter: 0.15
      }, this.scene));
      pole.position = pos.clone();
      pole.position.y = 1.5;
      pole.material = torchMat;
      const flame = this._track(BABYLON.MeshBuilder.CreateSphere('flame', { diameter: 0.35 }, this.scene));
      flame.position = pos.clone();
      flame.position.y = 3.2;
      const flameMat = new BABYLON.StandardMaterial('flameMat', this.scene);
      flameMat.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
      flameMat.emissiveColor = new BABYLON.Color3(0.3, 0.12, 0);
      flame.material = flameMat;
      const light = this._trackLight(new BABYLON.PointLight('torchLight', flame.position.clone(), this.scene));
      light.diffuse = new BABYLON.Color3(1, 0.6, 0.2);
      light.intensity = 1.0;
      light.range = 12;
    });
  }

  // ============================================
  // LEVEL 4: Lava Fortress -- Volcanic fortress with lava rivers
  // ============================================
  _buildLavaFortressMap() {
    // Central obsidian fortress
    this._buildObsidianFortress(0, 0);

    // Lava rivers (glowing strips) (scaled 1.3x)
    [[-39, 0], [39, 0], [0, -39], [0, 39]].forEach(([x, z]) => {
      const lava = this._track(BABYLON.MeshBuilder.CreateBox('lavaRiver', {
        width: x === 0 ? 5 : 104, height: 0.08, depth: z === 0 ? 5 : 104
      }, this.scene));
      lava.position = new BABYLON.Vector3(x, 0.06, z);
      lava.material = this.materials.lava;
    });

    // Obsidian pillars scattered (scaled 1.3x)
    for (let i = 0; i < 20; i++) {
      const x = -78 + Math.random() * 156;
      const z = -78 + Math.random() * 156;
      const h = 3 + Math.random() * 8;
      const pillar = this._track(BABYLON.MeshBuilder.CreateCylinder('obsPillar', {
        height: h, diameter: 1.2 + Math.random()
      }, this.scene));
      pillar.position = new BABYLON.Vector3(x, h / 2, z);
      pillar.material = this.materials.darkStone;
      pillar.physicsImpostor = new BABYLON.PhysicsImpostor(
        pillar, BABYLON.PhysicsImpostor.CylinderImpostor,
        { mass: 0, friction: 0.5 }, this.scene
      );
    }

    // Fire pits (glowing circles) (scaled 1.3x)
    for (let i = 0; i < 10; i++) {
      const x = -65 + Math.random() * 130;
      const z = -65 + Math.random() * 130;
      const pit = this._track(BABYLON.MeshBuilder.CreateCylinder('firePit', {
        height: 0.3, diameter: 3 + Math.random() * 2, tessellation: 12
      }, this.scene));
      pit.position = new BABYLON.Vector3(x, 0.15, z);
      pit.material = this.materials.lava;
      const light = this._trackLight(new BABYLON.PointLight('firePitLight', new BABYLON.Vector3(x, 1, z), this.scene));
      light.diffuse = new BABYLON.Color3(1, 0.4, 0);
      light.intensity = 0.6;
      light.range = 8;
    }

    // Volcanic rocks (scaled 1.3x)
    for (let i = 0; i < 15; i++) {
      const x = -71.5 + Math.random() * 143;
      const z = -71.5 + Math.random() * 143;
      const rock = this._track(BABYLON.MeshBuilder.CreateSphere('volRock', {
        diameter: 2 + Math.random() * 3
      }, this.scene));
      rock.position = new BABYLON.Vector3(x, 1, z);
      rock.scaling.y = 0.6;
      rock.material = this.materials.darkStone;
    }

    // Torches around fortress (scaled 1.3x)
    this._addTorches([
      new BABYLON.Vector3(10.4, 0, 10.4), new BABYLON.Vector3(-10.4, 0, 10.4),
      new BABYLON.Vector3(10.4, 0, -10.4), new BABYLON.Vector3(-10.4, 0, -10.4),
    ]);

    // Enterable houses
    this._createHouse(30, 30, 'armory', 'large');
    this._createHouse(-35, 25, 'tavern', 'small');
    this._createHouse(40, -40, 'armory', 'medium');
  }

  _buildObsidianFortress(x, z) {
    // Dark stone walls
    const h = 8;
    this._createWall(x - 7, 0, z, 1, h, 14);
    this._createWall(x + 7, 0, z, 1, h, 14);
    this._createWall(x, 0, z - 7, 14, h, 1);
    this._createWall(x - 3, 0, z + 7, 6, h, 1);
    this._createWall(x + 3, 0, z + 7, 6, h, 1);

    // Override wall material to dark stone
    this.meshes.slice(-5).forEach(m => { m.material = this.materials.darkStone; });

    // Towers at corners
    [[-7, -7], [7, -7], [-7, 7], [7, 7]].forEach(([tx, tz]) => {
      const tower = this._track(BABYLON.MeshBuilder.CreateCylinder('obsTower', {
        height: 12, diameter: 3.5
      }, this.scene));
      tower.position = new BABYLON.Vector3(x + tx, 6, z + tz);
      tower.material = this.materials.darkStone;
      tower.physicsImpostor = new BABYLON.PhysicsImpostor(
        tower, BABYLON.PhysicsImpostor.CylinderImpostor,
        { mass: 0, friction: 0.5 }, this.scene
      );
      // Fire on top
      const flame = this._track(BABYLON.MeshBuilder.CreateSphere('towerFlame', { diameter: 1.5 }, this.scene));
      flame.position = new BABYLON.Vector3(x + tx, 13, z + tz);
      flame.material = this.materials.lava;
      const l = this._trackLight(new BABYLON.PointLight('tFire', flame.position.clone(), this.scene));
      l.diffuse = new BABYLON.Color3(1, 0.4, 0);
      l.intensity = 1.0;
      l.range = 15;
    });
  }

  // ============================================
  // LEVEL 5: Frozen Depths -- Ice cavern with frozen structures
  // ============================================
  _buildFrozenDepthsMap() {
    // Ice pillars (tall translucent columns) (scaled 1.3x)
    for (let i = 0; i < 30; i++) {
      const x = -84.5 + Math.random() * 169;
      const z = -84.5 + Math.random() * 169;
      const h = 5 + Math.random() * 12;
      const pillar = this._track(BABYLON.MeshBuilder.CreateCylinder('icePillar', {
        height: h, diameter: 1 + Math.random() * 2
      }, this.scene));
      pillar.position = new BABYLON.Vector3(x, h / 2, z);
      pillar.material = this.materials.ice;
      pillar.physicsImpostor = new BABYLON.PhysicsImpostor(
        pillar, BABYLON.PhysicsImpostor.CylinderImpostor,
        { mass: 0, friction: 0.2 }, this.scene
      );
    }

    // Frozen lake in center (scaled 1.3x)
    const lake = this._track(BABYLON.MeshBuilder.CreateBox('frozenLake', {
      width: 39, height: 0.1, depth: 39
    }, this.scene));
    lake.position = new BABYLON.Vector3(0, 0.06, 0);
    lake.material = this.materials.ice;

    // Snow mounds (scaled 1.3x)
    for (let i = 0; i < 20; i++) {
      const x = -71.5 + Math.random() * 143;
      const z = -71.5 + Math.random() * 143;
      const mound = this._track(BABYLON.MeshBuilder.CreateSphere('snowMound', {
        diameter: 3 + Math.random() * 4
      }, this.scene));
      mound.position = new BABYLON.Vector3(x, 0.5, z);
      mound.scaling.y = 0.4;
      const snowMat = new BABYLON.StandardMaterial('snowMat', this.scene);
      snowMat.diffuseColor = new BABYLON.Color3(0.85, 0.9, 0.95);
      snowMat.emissiveColor = new BABYLON.Color3(0.1, 0.12, 0.14);
      mound.material = snowMat;
    }

    // Ice crystal formations (scaled 1.3x)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 26 + Math.random() * 19.5;
      this._createCrystal(new BABYLON.Vector3(
        Math.cos(angle) * r, 0, Math.sin(angle) * r
      ));
    }

    // Frozen ruins (scaled 1.3x)
    this._createRuins(32.5, -32.5);
    this._createRuins(-39, 26);

    // Ice walls (cave-like boundaries) (scaled 1.3x)
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const r = 78 + Math.random() * 13;
      const h = 10 + Math.random() * 10;
      const iceWall = this._track(BABYLON.MeshBuilder.CreateBox('iceWall', {
        width: 8 + Math.random() * 4, height: h, depth: 3
      }, this.scene));
      iceWall.position = new BABYLON.Vector3(
        Math.cos(angle) * r, h / 2, Math.sin(angle) * r
      );
      iceWall.rotation.y = angle + Math.PI / 2;
      iceWall.material = this.materials.ice;
    }

    // Frozen trees (white trunks, ice-blue leaves) (scaled 1.3x)
    for (let i = 0; i < 12; i++) {
      const x = -58.5 + Math.random() * 117;
      const z = -58.5 + Math.random() * 117;
      this._createTree(x, z, 4 + Math.random() * 3);
    }

    // Enterable houses
    this._createHouse(-35, -35, 'bedroom', 'small');
    this._createHouse(35, 30, 'kitchen', 'large');
    this._createHouse(-30, 35, 'library', 'medium');
  }

  // ============================================
  // LEVEL 6: Shadow Realm -- Dark void with glowing platforms
  // ============================================
  _buildShadowRealmMap() {
    // Floating dark platforms at ground level (scaled 1.3x)
    const platforms = [
      { x: 0, z: 0, size: 26 },
      { x: 32.5, z: -26, size: 15.6 },
      { x: -32.5, z: -19.5, size: 18.2 },
      { x: 39, z: 26, size: 13 },
      { x: -39, z: 32.5, size: 13 },
      { x: 0, z: -52, size: 20.8 },
      { x: 0, z: 45.5, size: 15.6 },
      { x: 58.5, z: 0, size: 10.4 },
      { x: -58.5, z: -6.5, size: 10.4 },
    ];

    platforms.forEach((p, i) => {
      const plat = this._track(BABYLON.MeshBuilder.CreateCylinder('shadowPlat', {
        height: 1.5, diameter: p.size, tessellation: 8
      }, this.scene));
      plat.position = new BABYLON.Vector3(p.x, -0.5, p.z);
      plat.material = this.materials.darkStone;
      plat.physicsImpostor = new BABYLON.PhysicsImpostor(
        plat, BABYLON.PhysicsImpostor.CylinderImpostor,
        { mass: 0, friction: 0.8 }, this.scene
      );

      // Glowing edge ring
      const ring = this._track(BABYLON.MeshBuilder.CreateTorus('platRing', {
        diameter: p.size + 0.5, thickness: 0.15, tessellation: 24
      }, this.scene));
      ring.position = new BABYLON.Vector3(p.x, 0.3, p.z);
      const ringMat = new BABYLON.StandardMaterial('ringMat' + i, this.scene);
      ringMat.diffuseColor = new BABYLON.Color3(0.6, 0, 0.8);
      ringMat.emissiveColor = new BABYLON.Color3(0.3, 0, 0.4);
      ring.material = ringMat;
    });

    // Shadow obelisks (scaled 1.3x)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const r = 45.5 + Math.random() * 19.5;
      const h = 8 + Math.random() * 10;
      const obelisk = this._track(BABYLON.MeshBuilder.CreateBox('obelisk', {
        width: 1.5, height: h, depth: 1.5
      }, this.scene));
      obelisk.position = new BABYLON.Vector3(
        Math.cos(angle) * r, h / 2, Math.sin(angle) * r
      );
      obelisk.rotation.y = Math.random() * Math.PI;
      obelisk.material = this.materials.darkStone;
      obelisk.physicsImpostor = new BABYLON.PhysicsImpostor(
        obelisk, BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, friction: 0.5 }, this.scene
      );

      // Glowing rune on top
      const rune = this._track(BABYLON.MeshBuilder.CreateSphere('runeGlow', {
        diameter: 0.8
      }, this.scene));
      rune.position = new BABYLON.Vector3(
        Math.cos(angle) * r, h + 0.5, Math.sin(angle) * r
      );
      const runeMat = new BABYLON.StandardMaterial('runeMat' + i, this.scene);
      runeMat.diffuseColor = new BABYLON.Color3(0.8, 0, 0.5);
      runeMat.emissiveColor = new BABYLON.Color3(0.4, 0, 0.25);
      rune.material = runeMat;
      const l = this._trackLight(new BABYLON.PointLight('runeLight', rune.position.clone(), this.scene));
      l.diffuse = new BABYLON.Color3(0.6, 0, 0.4);
      l.intensity = 0.6;
      l.range = 8;
    }

    // Dark portals (torus gates) (scaled 1.3x)
    [[26, 0], [-26, -39], [0, 39]].forEach(([x, z], i) => {
      const portal = this._track(BABYLON.MeshBuilder.CreateTorus('portal', {
        diameter: 6, thickness: 0.4, tessellation: 24
      }, this.scene));
      portal.position = new BABYLON.Vector3(x, 3.5, z);
      const portalMat = new BABYLON.StandardMaterial('portalMat' + i, this.scene);
      portalMat.diffuseColor = new BABYLON.Color3(0.5, 0, 1);
      portalMat.emissiveColor = new BABYLON.Color3(0.25, 0, 0.5);
      portalMat.alpha = 0.7;
      portal.material = portalMat;
      const l = this._trackLight(new BABYLON.PointLight('portalLight', portal.position.clone(), this.scene));
      l.diffuse = new BABYLON.Color3(0.5, 0, 1);
      l.intensity = 1.0;
      l.range = 12;
    });

    // Void fog floor (dark translucent plane below ground)
    const fog = this._track(BABYLON.MeshBuilder.CreateBox('voidFog', {
      width: 300, height: 0.1, depth: 300
    }, this.scene));
    fog.position.y = -3;
    const fogMat = new BABYLON.StandardMaterial('fogMat', this.scene);
    fogMat.diffuseColor = new BABYLON.Color3(0.1, 0, 0.15);
    fogMat.emissiveColor = new BABYLON.Color3(0.05, 0, 0.08);
    fogMat.alpha = 0.6;
    fog.material = fogMat;

    // Enterable houses
    this._createHouse(-35, -30, 'library', 'large');
    this._createHouse(35, 25, 'armory', 'small');
  }

  // ============================================
  // LEVEL 7: Storm Peaks -- Mountain peaks with lightning
  // ============================================
  _buildStormPeaksMap() {
    // Jagged mountain peaks (scaled 1.3x)
    const peakPositions = [
      { x: 0, z: 0, h: 15, d: 12 },
      { x: -39, z: -26, h: 20, d: 10 },
      { x: 39, z: -19.5, h: 18, d: 11 },
      { x: -26, z: 32.5, h: 12, d: 14 },
      { x: 32.5, z: 39, h: 22, d: 9 },
      { x: 0, z: -58.5, h: 25, d: 8 },
      { x: -58.5, z: 0, h: 16, d: 10 },
      { x: 58.5, z: 13, h: 14, d: 12 },
      { x: -19.5, z: -52, h: 18, d: 10 },
      { x: 45.5, z: -45.5, h: 20, d: 9 },
    ];
    peakPositions.forEach(p => {
      const peak = this._track(BABYLON.MeshBuilder.CreateCylinder('stormPeak', {
        height: p.h, diameterTop: 2, diameterBottom: p.d, tessellation: 6
      }, this.scene));
      peak.position = new BABYLON.Vector3(p.x, p.h / 2, p.z);
      peak.material = this.materials.stone;
      peak.physicsImpostor = new BABYLON.PhysicsImpostor(
        peak, BABYLON.PhysicsImpostor.CylinderImpostor,
        { mass: 0, friction: 0.8 }, this.scene
      );
      // Flat walkable top
      const top = this._track(BABYLON.MeshBuilder.CreateCylinder('peakTop', {
        height: 0.5, diameter: p.d * 0.6, tessellation: 8
      }, this.scene));
      top.position = new BABYLON.Vector3(p.x, p.h + 0.25, p.z);
      top.material = this.materials.stone;
      top.physicsImpostor = new BABYLON.PhysicsImpostor(
        top, BABYLON.PhysicsImpostor.CylinderImpostor,
        { mass: 0, friction: 0.8 }, this.scene
      );
    });

    // Bridges between peaks
    for (let i = 0; i < peakPositions.length - 1; i++) {
      const a = peakPositions[i];
      const b = peakPositions[i + 1];
      this._createBridge(a.x, a.h, a.z, b.x, b.h, b.z);
    }
    // Extra connections
    this._createBridge(peakPositions[0].x, peakPositions[0].h, peakPositions[0].z,
      peakPositions[3].x, peakPositions[3].h, peakPositions[3].z);
    this._createBridge(peakPositions[2].x, peakPositions[2].h, peakPositions[2].z,
      peakPositions[4].x, peakPositions[4].h, peakPositions[4].z);

    // Lightning rods (tall metal poles with glowing tips) (scaled 1.3x)
    const stormMat = new BABYLON.StandardMaterial('stormMat', this.scene);
    stormMat.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.9);
    stormMat.emissiveColor = new BABYLON.Color3(0.15, 0.25, 0.4);
    for (let i = 0; i < 12; i++) {
      const x = -71.5 + Math.random() * 143;
      const z = -71.5 + Math.random() * 143;
      const rod = this._track(BABYLON.MeshBuilder.CreateCylinder('lightRod', {
        height: 12, diameter: 0.3
      }, this.scene));
      rod.position = new BABYLON.Vector3(x, 6, z);
      rod.material = this.materials.stone;
      const tip = this._track(BABYLON.MeshBuilder.CreateSphere('lightTip', { diameter: 0.8 }, this.scene));
      tip.position = new BABYLON.Vector3(x, 12.5, z);
      tip.material = stormMat;
      const l = this._trackLight(new BABYLON.PointLight('stormLight', tip.position.clone(), this.scene));
      l.diffuse = new BABYLON.Color3(0.4, 0.6, 1);
      l.intensity = 0.8;
      l.range = 10;
    }

    // Dark storm clouds (flat dark planes above) (scaled 1.3x)
    for (let i = 0; i < 8; i++) {
      const cloud = this._track(BABYLON.MeshBuilder.CreateBox('stormCloud', {
        width: 15 + Math.random() * 20, height: 1, depth: 15 + Math.random() * 20
      }, this.scene));
      cloud.position = new BABYLON.Vector3(
        -65 + Math.random() * 130, 30 + Math.random() * 10, -65 + Math.random() * 130
      );
      const cMat = new BABYLON.StandardMaterial('cloudMat', this.scene);
      cMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.3);
      cMat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.08);
      cMat.alpha = 0.6;
      cloud.material = cMat;
    }

    // No houses on storm peaks map
  }

  // ============================================
  // LEVEL 8: Poison Swamp -- Toxic marshland
  // ============================================
  _buildPoisonSwampMap() {
    // Poison lakes (green glowing pools)
    const poisonMat = new BABYLON.StandardMaterial('poisonMat', this.scene);
    poisonMat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.1);
    poisonMat.emissiveColor = new BABYLON.Color3(0.08, 0.25, 0.04);
    poisonMat.alpha = 0.85;

    // (scaled 1.3x)
    for (let i = 0; i < 15; i++) {
      const x = -78 + Math.random() * 156;
      const z = -78 + Math.random() * 156;
      const pool = this._track(BABYLON.MeshBuilder.CreateCylinder('poisonPool', {
        height: 0.1, diameter: 5 + Math.random() * 8, tessellation: 12
      }, this.scene));
      pool.position = new BABYLON.Vector3(x, 0.06, z);
      pool.material = poisonMat;
      const l = this._trackLight(new BABYLON.PointLight('poolGlow', new BABYLON.Vector3(x, 0.5, z), this.scene));
      l.diffuse = new BABYLON.Color3(0.2, 0.8, 0.1);
      l.intensity = 0.4;
      l.range = 6;
    }

    // Dead trees (no leaves, gnarled trunks) (scaled 1.3x)
    for (let i = 0; i < 40; i++) {
      const x = -84.5 + Math.random() * 169;
      const z = -84.5 + Math.random() * 169;
      const h = 3 + Math.random() * 5;
      const trunk = this._track(BABYLON.MeshBuilder.CreateCylinder('deadTree', {
        height: h, diameterTop: 0.1, diameterBottom: 0.6
      }, this.scene));
      trunk.position = new BABYLON.Vector3(x, h / 2, z);
      trunk.rotation.z = (Math.random() - 0.5) * 0.3;
      trunk.material = this.materials.trunk;
      trunk.physicsImpostor = new BABYLON.PhysicsImpostor(
        trunk, BABYLON.PhysicsImpostor.CylinderImpostor,
        { mass: 0, friction: 0.5 }, this.scene
      );
    }

    // Mushroom clusters (toxic) (scaled 1.3x)
    const mushMat = new BABYLON.StandardMaterial('mushMat', this.scene);
    mushMat.diffuseColor = new BABYLON.Color3(0.4, 0.7, 0.1);
    mushMat.emissiveColor = new BABYLON.Color3(0.12, 0.2, 0.03);
    for (let i = 0; i < 25; i++) {
      const x = -71.5 + Math.random() * 143;
      const z = -71.5 + Math.random() * 143;
      const stem = this._track(BABYLON.MeshBuilder.CreateCylinder('mushStem', {
        height: 1.5, diameter: 0.5
      }, this.scene));
      stem.position = new BABYLON.Vector3(x, 0.75, z);
      stem.material = this.materials.stone;
      const cap = this._track(BABYLON.MeshBuilder.CreateCylinder('mushCap', {
        height: 0.5, diameterTop: 0.2, diameterBottom: 2 + Math.random()
      }, this.scene));
      cap.position = new BABYLON.Vector3(x, 1.75, z);
      cap.material = mushMat;
    }

    // Bog mounds (raised earth) (scaled 1.3x)
    for (let i = 0; i < 12; i++) {
      const x = -65 + Math.random() * 130;
      const z = -65 + Math.random() * 130;
      const mound = this._track(BABYLON.MeshBuilder.CreateSphere('bogMound', {
        diameter: 6 + Math.random() * 6
      }, this.scene));
      mound.position = new BABYLON.Vector3(x, 0.5, z);
      mound.scaling.y = 0.3;
      mound.material = this.materials.hut;
      mound.physicsImpostor = new BABYLON.PhysicsImpostor(
        mound, BABYLON.PhysicsImpostor.SphereImpostor,
        { mass: 0, friction: 0.5 }, this.scene
      );
    }

    // Hanging vines (vertical cylinders from above) (scaled 1.3x)
    for (let i = 0; i < 20; i++) {
      const x = -65 + Math.random() * 130;
      const z = -65 + Math.random() * 130;
      const vine = this._track(BABYLON.MeshBuilder.CreateCylinder('vine', {
        height: 8 + Math.random() * 6, diameter: 0.1
      }, this.scene));
      vine.position = new BABYLON.Vector3(x, 6, z);
      vine.material = this.materials.leaves;
    }

    // Fog layer
    const swampFog = this._track(BABYLON.MeshBuilder.CreateBox('swampFog', {
      width: 300, height: 0.1, depth: 300
    }, this.scene));
    swampFog.position.y = 1.5;
    const sfMat = new BABYLON.StandardMaterial('swampFogMat', this.scene);
    sfMat.diffuseColor = new BABYLON.Color3(0.15, 0.25, 0.08);
    sfMat.emissiveColor = new BABYLON.Color3(0.05, 0.1, 0.03);
    sfMat.alpha = 0.25;
    swampFog.material = sfMat;

    // Enterable houses
    this._createHouse(35, 35, 'kitchen', 'medium');
    this._createHouse(-40, -30, 'tavern', 'large');
    this._createHouse(30, -35, 'bedroom', 'small');
  }

  // ============================================
  // LEVEL 9: Crystal Caverns -- Underground crystal cave
  // ============================================
  _buildCrystalCavernsMap() {
    // Crystal material (shared for efficiency)
    const crystMat = new BABYLON.StandardMaterial('caveCrystMat', this.scene);
    crystMat.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.8);
    crystMat.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0.35);
    crystMat.specularColor = new BABYLON.Color3(1, 1, 1);
    crystMat.specularPower = 128;
    crystMat.alpha = 0.85;

    // Giant crystal formations (scaled 1.3x)
    for (let i = 0; i < 40; i++) {
      const x = -84.5 + Math.random() * 169;
      const z = -84.5 + Math.random() * 169;
      const h = 4 + Math.random() * 12;
      const crystal = this._track(BABYLON.MeshBuilder.CreateCylinder('caveCrystal', {
        height: h, diameterTop: 0, diameterBottom: 1 + Math.random() * 2, tessellation: 6
      }, this.scene));
      crystal.position = new BABYLON.Vector3(x, h / 2, z);
      crystal.rotation.z = (Math.random() - 0.5) * 0.4;
      crystal.rotation.x = (Math.random() - 0.5) * 0.4;
      crystal.material = crystMat;
      crystal.physicsImpostor = new BABYLON.PhysicsImpostor(
        crystal, BABYLON.PhysicsImpostor.CylinderImpostor,
        { mass: 0, friction: 0.5 }, this.scene
      );
    }

    // Glowing crystal clusters with lights (scaled 1.3x)
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const r = 19.5 + Math.random() * 39;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      // Cluster of 3 crystals
      for (let j = 0; j < 3; j++) {
        const cx = x + (Math.random() - 0.5) * 3;
        const cz = z + (Math.random() - 0.5) * 3;
        const ch = 2 + Math.random() * 4;
        const c = this._track(BABYLON.MeshBuilder.CreateCylinder('clusterCryst', {
          height: ch, diameterTop: 0, diameterBottom: 0.6 + Math.random() * 0.6, tessellation: 6
        }, this.scene));
        c.position = new BABYLON.Vector3(cx, ch / 2, cz);
        c.rotation.z = (Math.random() - 0.5) * 0.5;
        c.material = crystMat;
      }
      const l = this._trackLight(new BABYLON.PointLight('crystClusterLight', new BABYLON.Vector3(x, 3, z), this.scene));
      l.diffuse = new BABYLON.Color3(0.6, 0.3, 1);
      l.intensity = 0.6;
      l.range = 10;
    }

    // Cave ceiling (dark rock above)
    const ceiling = this._track(BABYLON.MeshBuilder.CreateBox('caveCeiling', {
      width: 300, height: 2, depth: 300
    }, this.scene));
    ceiling.position.y = 25;
    ceiling.material = this.materials.darkStone;

    // Stalactites hanging from ceiling (scaled 1.3x)
    for (let i = 0; i < 30; i++) {
      const x = -78 + Math.random() * 156;
      const z = -78 + Math.random() * 156;
      const h = 3 + Math.random() * 6;
      const stal = this._track(BABYLON.MeshBuilder.CreateCylinder('stalactite', {
        height: h, diameterTop: 1 + Math.random(), diameterBottom: 0, tessellation: 6
      }, this.scene));
      stal.position = new BABYLON.Vector3(x, 25 - h / 2, z);
      stal.material = this.materials.stone;
    }

    // Underground lake (scaled 1.3x)
    const lake = this._track(BABYLON.MeshBuilder.CreateBox('crystLake', {
      width: 32.5, height: 0.08, depth: 32.5
    }, this.scene));
    lake.position = new BABYLON.Vector3(0, 0.05, 0);
    const lakeMat = new BABYLON.StandardMaterial('crystLakeMat', this.scene);
    lakeMat.diffuseColor = new BABYLON.Color3(0.3, 0.2, 0.6);
    lakeMat.emissiveColor = new BABYLON.Color3(0.1, 0.06, 0.2);
    lakeMat.alpha = 0.7;
    lake.material = lakeMat;

    // Stone platforms (scaled 1.3x)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 32.5 + Math.random() * 26;
      const plat = this._track(BABYLON.MeshBuilder.CreateCylinder('cavePlat', {
        height: 1, diameter: 8 + Math.random() * 6, tessellation: 8
      }, this.scene));
      plat.position = new BABYLON.Vector3(
        Math.cos(angle) * r, 0.5, Math.sin(angle) * r
      );
      plat.material = this.materials.stone;
      plat.physicsImpostor = new BABYLON.PhysicsImpostor(
        plat, BABYLON.PhysicsImpostor.CylinderImpostor,
        { mass: 0, friction: 0.8 }, this.scene
      );
    }

    // Enterable houses
    this._createHouse(-35, 25, 'library', 'small');
    this._createHouse(30, -30, 'armory', 'large');
  }

  // ============================================
  // LEVEL 10: The Void -- Final arena in nothingness
  // ============================================
  _buildTheVoidMap() {
    // Central massive arena platform (scaled 1.3x)
    const arena = this._track(BABYLON.MeshBuilder.CreateCylinder('voidArena', {
      height: 2, diameter: 65, tessellation: 16
    }, this.scene));
    arena.position = new BABYLON.Vector3(0, -0.5, 0);
    arena.material = this.materials.darkStone;
    arena.physicsImpostor = new BABYLON.PhysicsImpostor(
      arena, BABYLON.PhysicsImpostor.CylinderImpostor,
      { mass: 0, friction: 0.8 }, this.scene
    );

    // Outer ring platforms (scaled 1.3x)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const r = 58.5;
      const plat = this._track(BABYLON.MeshBuilder.CreateCylinder('voidPlat', {
        height: 1.5, diameter: 13, tessellation: 8
      }, this.scene));
      plat.position = new BABYLON.Vector3(
        Math.cos(angle) * r, -0.5, Math.sin(angle) * r
      );
      plat.material = this.materials.darkStone;
      plat.physicsImpostor = new BABYLON.PhysicsImpostor(
        plat, BABYLON.PhysicsImpostor.CylinderImpostor,
        { mass: 0, friction: 0.8 }, this.scene
      );
    }

    // Bridges connecting outer to center (scaled 1.3x)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      this._createBridge(0, 0, 0,
        Math.cos(angle) * 58.5, 0, Math.sin(angle) * 58.5
      );
    }

    // Void pillars -- tall ominous columns (scaled 1.3x)
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const r = 71.5 + Math.random() * 19.5;
      const h = 15 + Math.random() * 20;
      const pillar = this._track(BABYLON.MeshBuilder.CreateBox('voidPillar', {
        width: 2, height: h, depth: 2
      }, this.scene));
      pillar.position = new BABYLON.Vector3(
        Math.cos(angle) * r, h / 2, Math.sin(angle) * r
      );
      pillar.material = this.materials.darkStone;
    }

    // Glowing red rune circles on the ground (scaled 1.3x)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 19.5;
      const rune = this._track(BABYLON.MeshBuilder.CreateTorus('voidRune', {
        diameter: 6, thickness: 0.12, tessellation: 24
      }, this.scene));
      rune.position = new BABYLON.Vector3(
        Math.cos(angle) * r, 0.6, Math.sin(angle) * r
      );
      const runeMat = new BABYLON.StandardMaterial('vRuneMat' + i, this.scene);
      runeMat.diffuseColor = new BABYLON.Color3(1, 0.1, 0.2);
      runeMat.emissiveColor = new BABYLON.Color3(0.5, 0.05, 0.1);
      rune.material = runeMat;
      const l = this._trackLight(new BABYLON.PointLight('vRuneLight', rune.position.clone(), this.scene));
      l.diffuse = new BABYLON.Color3(1, 0.1, 0.2);
      l.intensity = 0.7;
      l.range = 8;
    }

    // Central void eye (giant glowing sphere above)
    const eye = this._track(BABYLON.MeshBuilder.CreateSphere('voidEye', {
      diameter: 8
    }, this.scene));
    eye.position = new BABYLON.Vector3(0, 30, 0);
    const eyeMat = new BABYLON.StandardMaterial('voidEyeMat', this.scene);
    eyeMat.diffuseColor = new BABYLON.Color3(1, 0, 0.2);
    eyeMat.emissiveColor = new BABYLON.Color3(0.5, 0, 0.1);
    eye.material = eyeMat;
    const eyeLight = this._trackLight(new BABYLON.PointLight('voidEyeLight', eye.position.clone(), this.scene));
    eyeLight.diffuse = new BABYLON.Color3(1, 0.1, 0.2);
    eyeLight.intensity = 2.0;
    eyeLight.range = 50;

    // Dark portals around the edges (scaled 1.3x)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const r = 78;
      const portal = this._track(BABYLON.MeshBuilder.CreateTorus('voidPortal', {
        diameter: 8, thickness: 0.5, tessellation: 24
      }, this.scene));
      portal.position = new BABYLON.Vector3(
        Math.cos(angle) * r, 4, Math.sin(angle) * r
      );
      portal.rotation.y = angle;
      const pMat = new BABYLON.StandardMaterial('vPortalMat' + i, this.scene);
      pMat.diffuseColor = new BABYLON.Color3(0.3, 0, 0.5);
      pMat.emissiveColor = new BABYLON.Color3(0.15, 0, 0.25);
      pMat.alpha = 0.7;
      portal.material = pMat;
    }

    // Void abyss below
    const abyss = this._track(BABYLON.MeshBuilder.CreateBox('voidAbyss', {
      width: 300, height: 0.1, depth: 300
    }, this.scene));
    abyss.position.y = -10;
    const abyssMat = new BABYLON.StandardMaterial('voidAbyssMat', this.scene);
    abyssMat.diffuseColor = new BABYLON.Color3(0.02, 0, 0.04);
    abyssMat.emissiveColor = new BABYLON.Color3(0.01, 0, 0.02);
    abyss.material = abyssMat;

    // No houses on void map
  }

  // ===================== PARTY DECORATIONS (added on top of any map) =====================
  addPartyDecorations() {
    // Remove any existing dark lights from The Void
    this.scene.lights.forEach(l => { l.intensity = 0; });

    // Bright overhead light
    const partyLight = this._trackLight(new BABYLON.HemisphericLight(
      'partyHemi', new BABYLON.Vector3(0, 1, 0), this.scene
    ));
    partyLight.intensity = 3.0;
    partyLight.diffuse = new BABYLON.Color3(1, 1, 1);
    partyLight.groundColor = new BABYLON.Color3(0.9, 0.85, 0.7);

    // Extra directional light so everything is visible
    const dirLight = this._trackLight(new BABYLON.DirectionalLight(
      'partyDir', new BABYLON.Vector3(-1, -2, 1), this.scene
    ));
    dirLight.intensity = 1.5;
    dirLight.diffuse = new BABYLON.Color3(1, 0.95, 0.9);

    // Colorful spinning point lights around the arena
    const lightColors = [
      new BABYLON.Color3(1, 0.2, 0.2),   // red
      new BABYLON.Color3(0.2, 0.5, 1),   // blue
      new BABYLON.Color3(0.2, 1, 0.3),   // green
      new BABYLON.Color3(1, 0.8, 0.1),   // gold
      new BABYLON.Color3(0.8, 0.2, 1),   // purple
      new BABYLON.Color3(1, 0.5, 0.1),   // orange
    ];

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const pl = this._trackLight(new BABYLON.PointLight(
        'partyPL' + i, new BABYLON.Vector3(Math.cos(angle) * 20, 8, Math.sin(angle) * 20), this.scene
      ));
      pl.diffuse = lightColors[i];
      pl.intensity = 3.0;
      pl.range = 50;
    }

    // Giant golden trophy in the center
    const trophyBase = this._track(BABYLON.MeshBuilder.CreateCylinder('trophyBase', {
      height: 2, diameterTop: 3, diameterBottom: 4, tessellation: 24
    }, this.scene));
    trophyBase.position.y = 1;
    const goldMat = new BABYLON.StandardMaterial('goldMat', this.scene);
    goldMat.diffuseColor = new BABYLON.Color3(1, 0.85, 0.1);
    goldMat.emissiveColor = new BABYLON.Color3(0.5, 0.4, 0.05);
    goldMat.specularColor = new BABYLON.Color3(1, 1, 0.8);
    trophyBase.material = goldMat;

    const trophyCup = this._track(BABYLON.MeshBuilder.CreateCylinder('trophyCup', {
      height: 3, diameterTop: 4, diameterBottom: 1.5, tessellation: 24
    }, this.scene));
    trophyCup.position.y = 4.5;
    trophyCup.material = goldMat;

    // Star on top of trophy
    const star = this._track(BABYLON.MeshBuilder.CreateTorus('trophyStar', {
      diameter: 2, thickness: 0.4, tessellation: 5
    }, this.scene));
    star.position.y = 7;
    const starMat = new BABYLON.StandardMaterial('starMat', this.scene);
    starMat.diffuseColor = new BABYLON.Color3(1, 1, 0.3);
    starMat.emissiveColor = new BABYLON.Color3(0.8, 0.7, 0.1);
    star.material = starMat;

    // Colorful pillars around the arena like a celebration hall
    const pillarColors = [
      { r: 1, g: 0.2, b: 0.2 },
      { r: 0.2, g: 0.6, b: 1 },
      { r: 0.2, g: 1, b: 0.3 },
      { r: 1, g: 0.8, b: 0.1 },
      { r: 0.8, g: 0.2, b: 1 },
      { r: 1, g: 0.5, b: 0.1 },
      { r: 0.1, g: 1, b: 1 },
      { r: 1, g: 0.3, b: 0.6 },
    ];

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 25;
      const pillar = this._track(BABYLON.MeshBuilder.CreateCylinder('partyPillar' + i, {
        height: 12, diameter: 2, tessellation: 12
      }, this.scene));
      pillar.position = new BABYLON.Vector3(Math.cos(angle) * r, 6, Math.sin(angle) * r);
      const pMat = new BABYLON.StandardMaterial('pillarMat' + i, this.scene);
      const pc = pillarColors[i];
      pMat.diffuseColor = new BABYLON.Color3(pc.r, pc.g, pc.b);
      pMat.emissiveColor = new BABYLON.Color3(pc.r * 0.4, pc.g * 0.4, pc.b * 0.4);
      pillar.material = pMat;

      // Glowing orb on top of each pillar
      const orb = this._track(BABYLON.MeshBuilder.CreateSphere('pillarOrb' + i, {
        diameter: 1.5, segments: 12
      }, this.scene));
      orb.position = new BABYLON.Vector3(Math.cos(angle) * r, 13, Math.sin(angle) * r);
      const orbMat = new BABYLON.StandardMaterial('orbMat' + i, this.scene);
      orbMat.diffuseColor = new BABYLON.Color3(pc.r, pc.g, pc.b);
      orbMat.emissiveColor = new BABYLON.Color3(pc.r * 0.8, pc.g * 0.8, pc.b * 0.8);
      orbMat.alpha = 0.85;
      orb.material = orbMat;
    }

    // Confetti-like colored boxes scattered on the ground
    for (let i = 0; i < 80; i++) {
      const confetti = this._track(BABYLON.MeshBuilder.CreateBox('confetti' + i, {
        width: 0.3 + Math.random() * 0.3,
        height: 0.05,
        depth: 0.3 + Math.random() * 0.3
      }, this.scene));
      confetti.position = new BABYLON.Vector3(
        (Math.random() - 0.5) * 50,
        0.1,
        (Math.random() - 0.5) * 50
      );
      confetti.rotation.y = Math.random() * Math.PI * 2;
      const cMat = new BABYLON.StandardMaterial('confettiMat' + i, this.scene);
      cMat.diffuseColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
      cMat.emissiveColor = cMat.diffuseColor.scale(0.5);
      confetti.material = cMat;
    }

    // Festive arches between pillars
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 8;
      const r = 25;
      const arch = this._track(BABYLON.MeshBuilder.CreateTorus('partyArch' + i, {
        diameter: 8, thickness: 0.6, tessellation: 24
      }, this.scene));
      arch.position = new BABYLON.Vector3(Math.cos(angle) * r, 10, Math.sin(angle) * r);
      arch.rotation.z = Math.PI / 2;
      arch.rotation.y = angle;
      const archMat = new BABYLON.StandardMaterial('archMat' + i, this.scene);
      archMat.diffuseColor = new BABYLON.Color3(1, 0.85, 0.1);
      archMat.emissiveColor = new BABYLON.Color3(0.5, 0.4, 0.05);
      arch.material = archMat;
    }

    // === DISCO BALL ===
    const discoBall = this._track(BABYLON.MeshBuilder.CreateSphere('discoBall', {
      diameter: 4, segments: 16
    }, this.scene));
    discoBall.position.y = 25;
    const discoMat = new BABYLON.StandardMaterial('discoMat', this.scene);
    discoMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.95);
    discoMat.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.55);
    discoMat.specularColor = new BABYLON.Color3(1, 1, 1);
    discoMat.specularPower = 128;
    discoBall.material = discoMat;

    // Disco ball string
    const discoString = this._track(BABYLON.MeshBuilder.CreateCylinder('discoString', {
      height: 8, diameter: 0.1, tessellation: 6
    }, this.scene));
    discoString.position.y = 31;
    discoString.material = discoMat;

    // Disco spotlight beams (colored point lights orbiting)
    const discoColors = [
      new BABYLON.Color3(1, 0, 0.3),
      new BABYLON.Color3(0, 0.5, 1),
      new BABYLON.Color3(0, 1, 0.3),
      new BABYLON.Color3(1, 1, 0),
    ];
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const dl = this._trackLight(new BABYLON.PointLight(
        'discoLight' + i, new BABYLON.Vector3(Math.cos(angle) * 3, 24, Math.sin(angle) * 3), this.scene
      ));
      dl.diffuse = discoColors[i];
      dl.intensity = 2.5;
      dl.range = 60;
    }

    // === DANCE FLOOR (colored tiles in a grid) ===
    const floorColors = [
      [1, 0.2, 0.2], [0.2, 0.5, 1], [0.2, 1, 0.3], [1, 0.8, 0.1],
      [0.8, 0.2, 1], [1, 0.5, 0.1], [0.1, 1, 1], [1, 0.3, 0.6],
    ];
    for (let x = -3; x <= 3; x++) {
      for (let z = -3; z <= 3; z++) {
        const tile = this._track(BABYLON.MeshBuilder.CreateBox('dTile_' + x + '_' + z, {
          width: 1.8, height: 0.15, depth: 1.8
        }, this.scene));
        tile.position = new BABYLON.Vector3(x * 2, 0.08, z * 2);
        const fc = floorColors[(Math.abs(x) + Math.abs(z)) % floorColors.length];
        const tileMat = new BABYLON.StandardMaterial('tileMat_' + x + '_' + z, this.scene);
        tileMat.diffuseColor = new BABYLON.Color3(fc[0], fc[1], fc[2]);
        tileMat.emissiveColor = new BABYLON.Color3(fc[0] * 0.6, fc[1] * 0.6, fc[2] * 0.6);
        tileMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        tile.material = tileMat;
      }
    }

    // === BALLOONS (floating spheres with strings) ===
    const balloonColors = [
      [1, 0.2, 0.2], [0.2, 0.6, 1], [0.2, 1, 0.3],
      [1, 0.85, 0.1], [0.8, 0.2, 1], [1, 0.4, 0.7],
      [1, 0.5, 0.1], [0.1, 1, 1], [1, 1, 0.3],
    ];
    for (let i = 0; i < 20; i++) {
      const bc = balloonColors[i % balloonColors.length];
      const bx = (Math.random() - 0.5) * 50;
      const bz = (Math.random() - 0.5) * 50;
      const by = 8 + Math.random() * 12;

      const balloon = this._track(BABYLON.MeshBuilder.CreateSphere('balloon' + i, {
        diameter: 1.2 + Math.random() * 0.6, segments: 8
      }, this.scene));
      balloon.position = new BABYLON.Vector3(bx, by, bz);
      const bMat = new BABYLON.StandardMaterial('balloonMat' + i, this.scene);
      bMat.diffuseColor = new BABYLON.Color3(bc[0], bc[1], bc[2]);
      bMat.emissiveColor = new BABYLON.Color3(bc[0] * 0.3, bc[1] * 0.3, bc[2] * 0.3);
      bMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
      balloon.material = bMat;

      // String
      const str = this._track(BABYLON.MeshBuilder.CreateCylinder('bStr' + i, {
        height: 2 + Math.random() * 2, diameter: 0.03, tessellation: 4
      }, this.scene));
      str.position = new BABYLON.Vector3(bx, by - 1.8, bz);
      const strMat = new BABYLON.StandardMaterial('strMat' + i, this.scene);
      strMat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
      str.material = strMat;
    }

    // === GIFT BOXES ===
    const giftColors = [
      [1, 0, 0], [0, 0.6, 1], [0, 0.8, 0.2], [1, 0.8, 0], [0.8, 0, 1],
    ];
    for (let i = 0; i < 10; i++) {
      const gc = giftColors[i % giftColors.length];
      const gx = (Math.random() - 0.5) * 40;
      const gz = (Math.random() - 0.5) * 40;

      // Box
      const gift = this._track(BABYLON.MeshBuilder.CreateBox('gift' + i, {
        width: 0.8 + Math.random() * 0.4,
        height: 0.8 + Math.random() * 0.4,
        depth: 0.8 + Math.random() * 0.4
      }, this.scene));
      gift.position = new BABYLON.Vector3(gx, 0.5, gz);
      gift.rotation.y = Math.random() * Math.PI * 2;
      const gMat = new BABYLON.StandardMaterial('giftMat' + i, this.scene);
      gMat.diffuseColor = new BABYLON.Color3(gc[0], gc[1], gc[2]);
      gMat.emissiveColor = new BABYLON.Color3(gc[0] * 0.3, gc[1] * 0.3, gc[2] * 0.3);
      gift.material = gMat;

      // Ribbon on top
      const ribbon = this._track(BABYLON.MeshBuilder.CreateBox('ribbon' + i, {
        width: 0.1, height: 0.5, depth: 1.0
      }, this.scene));
      ribbon.position = new BABYLON.Vector3(gx, 1.1, gz);
      ribbon.rotation.y = gift.rotation.y;
      const rMat = new BABYLON.StandardMaterial('ribbonMat' + i, this.scene);
      rMat.diffuseColor = new BABYLON.Color3(1, 0.85, 0.1);
      rMat.emissiveColor = new BABYLON.Color3(0.5, 0.4, 0.05);
      ribbon.material = rMat;
    }

    // === CAKE (center piece near trophy) ===
    // Bottom tier
    const cakeMat1 = new BABYLON.StandardMaterial('cakeMat1', this.scene);
    cakeMat1.diffuseColor = new BABYLON.Color3(1, 0.85, 0.7);
    cakeMat1.emissiveColor = new BABYLON.Color3(0.3, 0.25, 0.2);

    const cakeBot = this._track(BABYLON.MeshBuilder.CreateCylinder('cakeBot', {
      height: 1, diameterTop: 3, diameterBottom: 3, tessellation: 24
    }, this.scene));
    cakeBot.position = new BABYLON.Vector3(8, 0.5, 0);
    cakeBot.material = cakeMat1;

    // Middle tier
    const cakeMid = this._track(BABYLON.MeshBuilder.CreateCylinder('cakeMid', {
      height: 0.8, diameterTop: 2.2, diameterBottom: 2.2, tessellation: 24
    }, this.scene));
    cakeMid.position = new BABYLON.Vector3(8, 1.4, 0);
    cakeMid.material = cakeMat1;

    // Top tier
    const cakeTop = this._track(BABYLON.MeshBuilder.CreateCylinder('cakeTop', {
      height: 0.6, diameterTop: 1.4, diameterBottom: 1.4, tessellation: 24
    }, this.scene));
    cakeTop.position = new BABYLON.Vector3(8, 2.1, 0);
    cakeTop.material = cakeMat1;

    // Frosting (pink layer on each tier)
    const frostMat = new BABYLON.StandardMaterial('frostMat', this.scene);
    frostMat.diffuseColor = new BABYLON.Color3(1, 0.5, 0.7);
    frostMat.emissiveColor = new BABYLON.Color3(0.4, 0.15, 0.25);

    const frost1 = this._track(BABYLON.MeshBuilder.CreateTorus('frost1', {
      diameter: 2.8, thickness: 0.2, tessellation: 24
    }, this.scene));
    frost1.position = new BABYLON.Vector3(8, 1.0, 0);
    frost1.material = frostMat;

    const frost2 = this._track(BABYLON.MeshBuilder.CreateTorus('frost2', {
      diameter: 2.0, thickness: 0.18, tessellation: 24
    }, this.scene));
    frost2.position = new BABYLON.Vector3(8, 1.8, 0);
    frost2.material = frostMat;

    // Candles on top
    const candleMat = new BABYLON.StandardMaterial('candleMat', this.scene);
    candleMat.diffuseColor = new BABYLON.Color3(1, 1, 0.8);
    candleMat.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.2);
    const flameMat = new BABYLON.StandardMaterial('flameMat', this.scene);
    flameMat.diffuseColor = new BABYLON.Color3(1, 0.6, 0);
    flameMat.emissiveColor = new BABYLON.Color3(1, 0.4, 0);

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const cx = 8 + Math.cos(angle) * 0.4;
      const cz = Math.sin(angle) * 0.4;

      const candle = this._track(BABYLON.MeshBuilder.CreateCylinder('candle' + i, {
        height: 0.4, diameter: 0.08, tessellation: 6
      }, this.scene));
      candle.position = new BABYLON.Vector3(cx, 2.6, cz);
      candle.material = candleMat;

      // Flame
      const flame = this._track(BABYLON.MeshBuilder.CreateSphere('flame' + i, {
        diameter: 0.15, segments: 6
      }, this.scene));
      flame.position = new BABYLON.Vector3(cx, 2.85, cz);
      flame.material = flameMat;
    }

    // === TRAMPOLINES (bouncy pads — big and glowing!) ===
    const trampPositions = [
      [-15, 0, 15], [15, 0, 15], [-15, 0, -15], [15, 0, -15]
    ];
    const trampMat = new BABYLON.StandardMaterial('trampMat', this.scene);
    trampMat.diffuseColor = new BABYLON.Color3(0.1, 0.6, 1);
    trampMat.emissiveColor = new BABYLON.Color3(0.1, 0.4, 0.8);

    const trampRingMat = new BABYLON.StandardMaterial('trampRingMat', this.scene);
    trampRingMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);
    trampRingMat.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);

    const trampLegMat = new BABYLON.StandardMaterial('trampLegMat', this.scene);
    trampLegMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.5);
    trampLegMat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.15);

    trampPositions.forEach((tp, i) => {
      // 4 legs
      for (let l = 0; l < 4; l++) {
        const la = (l / 4) * Math.PI * 2;
        const leg = this._track(BABYLON.MeshBuilder.CreateCylinder('trampLeg' + i + '_' + l, {
          height: 1, diameter: 0.2, tessellation: 8
        }, this.scene));
        leg.position = new BABYLON.Vector3(tp[0] + Math.cos(la) * 1.8, 0.5, tp[2] + Math.sin(la) * 1.8);
        leg.material = trampLegMat;
      }

      // Bouncy pad (bigger, raised on legs)
      const pad = this._track(BABYLON.MeshBuilder.CreateCylinder('tramp' + i, {
        height: 0.2, diameter: 4.5, tessellation: 24
      }, this.scene));
      pad.position = new BABYLON.Vector3(tp[0], 1.0, tp[2]);
      pad.material = trampMat;

      // Glowing ring
      const ring = this._track(BABYLON.MeshBuilder.CreateTorus('trampRing' + i, {
        diameter: 4.5, thickness: 0.25, tessellation: 24
      }, this.scene));
      ring.position = new BABYLON.Vector3(tp[0], 1.0, tp[2]);
      ring.material = trampRingMat;

      // Glow light under each trampoline
      const tl = this._trackLight(new BABYLON.PointLight(
        'trampLight' + i, new BABYLON.Vector3(tp[0], 1.5, tp[2]), this.scene
      ));
      tl.diffuse = new BABYLON.Color3(0.2, 0.5, 1);
      tl.intensity = 2;
      tl.range = 10;

      // "BOUNCE!" sign floating above
      const sign = this._track(BABYLON.MeshBuilder.CreatePlane('trampSign' + i, {
        width: 3, height: 0.8
      }, this.scene));
      sign.position = new BABYLON.Vector3(tp[0], 3.5, tp[2]);
      sign.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
      const signTex = new BABYLON.DynamicTexture('trampTex' + i, { width: 256, height: 64 }, this.scene);
      const ctx = signTex.getContext();
      ctx.clearRect(0, 0, 256, 64);
      ctx.font = 'bold 40px Arial';
      ctx.fillStyle = '#00ccff';
      ctx.textAlign = 'center';
      ctx.fillText('BOUNCE!', 128, 46);
      signTex.update();
      const signMat = new BABYLON.StandardMaterial('trampSignMat' + i, this.scene);
      signMat.diffuseTexture = signTex;
      signMat.emissiveTexture = signTex;
      signMat.opacityTexture = signTex;
      signMat.backFaceCulling = false;
      signMat.disableLighting = true;
      sign.material = signMat;
    });

    // === SPINNING PLATFORMS ===
    const spinColors = [
      new BABYLON.Color3(1, 0.3, 0.3),
      new BABYLON.Color3(0.3, 1, 0.3),
      new BABYLON.Color3(0.3, 0.3, 1),
    ];
    const spinPositions = [
      [-20, 3, 0], [20, 3, 0], [0, 3, 20]
    ];
    spinPositions.forEach((sp, i) => {
      const platform = this._track(BABYLON.MeshBuilder.CreateCylinder('spinPlat' + i, {
        height: 0.3, diameter: 4, tessellation: 6
      }, this.scene));
      platform.position = new BABYLON.Vector3(sp[0], sp[1], sp[2]);
      const sMat = new BABYLON.StandardMaterial('spinMat' + i, this.scene);
      sMat.diffuseColor = spinColors[i];
      sMat.emissiveColor = spinColors[i].scale(0.4);
      platform.material = sMat;

      // Stars on top of platforms
      const star = this._track(BABYLON.MeshBuilder.CreateTorus('spinStar' + i, {
        diameter: 1.5, thickness: 0.2, tessellation: 5
      }, this.scene));
      star.position = new BABYLON.Vector3(sp[0], sp[1] + 0.3, sp[2]);
      star.material = sMat;
    });

    // === BANNER POLES WITH FLAGS ===
    const flagColors = [
      [1, 0, 0], [1, 0.5, 0], [1, 1, 0], [0, 1, 0], [0, 0.5, 1], [0.5, 0, 1]
    ];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const r = 35;
      const px = Math.cos(angle) * r;
      const pz = Math.sin(angle) * r;

      // Pole
      const pole = this._track(BABYLON.MeshBuilder.CreateCylinder('flagPole' + i, {
        height: 10, diameter: 0.15, tessellation: 6
      }, this.scene));
      pole.position = new BABYLON.Vector3(px, 5, pz);
      pole.material = trampRingMat;

      // Flag
      const flag = this._track(BABYLON.MeshBuilder.CreateBox('flag' + i, {
        width: 2.5, height: 1.5, depth: 0.05
      }, this.scene));
      flag.position = new BABYLON.Vector3(px + 1.3, 9, pz);
      const fMat = new BABYLON.StandardMaterial('flagMat' + i, this.scene);
      const fc = flagColors[i];
      fMat.diffuseColor = new BABYLON.Color3(fc[0], fc[1], fc[2]);
      fMat.emissiveColor = new BABYLON.Color3(fc[0] * 0.4, fc[1] * 0.4, fc[2] * 0.4);
      fMat.backFaceCulling = false;
      flag.material = fMat;
    }
  }
}
