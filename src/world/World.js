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
    this._buildBorders();

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
    ];
    const c = groundColors[levelIndex] || groundColors[0];

    const ground = this._track(BABYLON.MeshBuilder.CreateBox('ground', {
      width: 200, height: 0.1, depth: 200
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
  _buildBorders() {
    const borderSize = 95;
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const x = Math.cos(angle) * borderSize;
      const z = Math.sin(angle) * borderSize;
      const height = 15 + Math.random() * 20;
      const m = this._track(BABYLON.MeshBuilder.CreateCylinder('mountain', {
        height, diameterTop: 0, diameterBottom: 10 + Math.random() * 8
      }, this.scene));
      m.position = new BABYLON.Vector3(x, height / 2, z);
      m.material = this.materials.mountain;
    }
    // Invisible walls
    const wh = 30;
    this._createWall(0, 0, -100, 200, wh, 2).isVisible = false;
    this._createWall(0, 0, 100, 200, wh, 2).isVisible = false;
    this._createWall(100, 0, 0, 2, wh, 200).isVisible = false;
    this._createWall(-100, 0, 0, 2, wh, 200).isVisible = false;
  }

  // ============================================
  // LEVEL 1: Castle Siege — Castle + Village
  // ============================================
  _buildCastleMap() {
    // Castle
    this._buildCastle(0, -20);
    // Village huts
    [[10, 5], [15, 8], [-10, 3], [-14, 7], [8, 15], [-8, 18]].forEach(([x, z]) => {
      this._createHut(x, z);
    });
    // Some trees around village
    for (let i = 0; i < 15; i++) {
      const x = -30 + Math.random() * 60;
      const z = 20 + Math.random() * 40;
      this._createTree(x, z, 3 + Math.random() * 3);
    }
    // Torches at castle entrance
    this._addTorches([
      new BABYLON.Vector3(2, 0, -13.5),
      new BABYLON.Vector3(-2, 0, -13.5),
    ]);
    // Training dummies (decorative boxes)
    [[-20, -10], [22, -5]].forEach(([x, z]) => {
      const dummy = this._track(BABYLON.MeshBuilder.CreateBox('dummy', {
        width: 0.6, height: 1.8, depth: 0.4
      }, this.scene));
      dummy.position = new BABYLON.Vector3(x, 0.9, z);
      dummy.material = this.materials.hut;
    });
    // Well in village center
    const well = this._track(BABYLON.MeshBuilder.CreateCylinder('well', {
      height: 1.2, diameter: 2, tessellation: 12
    }, this.scene));
    well.position = new BABYLON.Vector3(0, 0.6, 8);
    well.material = this.materials.stone;
    well.physicsImpostor = new BABYLON.PhysicsImpostor(
      well, BABYLON.PhysicsImpostor.CylinderImpostor,
      { mass: 0, friction: 0.5 }, this.scene
    );
  }

  // ============================================
  // LEVEL 2: Forest Hunt — Dense forest + Ruins + River
  // ============================================
  _buildForestMap() {
    // Dense forest — 60 trees
    for (let i = 0; i < 60; i++) {
      const x = -60 + Math.random() * 120;
      const z = -60 + Math.random() * 120;
      this._createTree(x, z, 4 + Math.random() * 6);
    }
    // Ancient ruins complex
    this._createRuins(0, 0);
    this._createRuins(-30, 25);
    // Glowing crystals scattered
    [
      [15, -20], [-25, 10], [35, 30], [-40, -35], [50, -10], [-10, 45]
    ].forEach(([x, z]) => {
      this._createCrystal(new BABYLON.Vector3(x, 0, z));
    });
    // River (long flat blue box)
    const river = this._track(BABYLON.MeshBuilder.CreateBox('river', {
      width: 6, height: 0.05, depth: 160
    }, this.scene));
    river.position = new BABYLON.Vector3(20, 0.06, 0);
    river.material = this.materials.ice;
    // Bridges over river
    [[-15, 0], [0, 30], [0, -30]].forEach(([xOff, z]) => {
      const b = this._track(BABYLON.MeshBuilder.CreateBox('rivBridge', {
        width: 10, height: 0.4, depth: 3
      }, this.scene));
      b.position = new BABYLON.Vector3(20 + xOff, 0.3, z);
      b.material = this.materials.bridge;
      b.physicsImpostor = new BABYLON.PhysicsImpostor(
        b, BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, friction: 0.8 }, this.scene
      );
    });
    // Fallen logs (obstacles)
    for (let i = 0; i < 8; i++) {
      const x = -50 + Math.random() * 100;
      const z = -50 + Math.random() * 100;
      const log = this._track(BABYLON.MeshBuilder.CreateCylinder('log', {
        height: 4 + Math.random() * 3, diameter: 0.6
      }, this.scene));
      log.position = new BABYLON.Vector3(x, 0.3, z);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = Math.random() * Math.PI;
      log.material = this.materials.trunk;
    }
    // Mushroom rocks
    for (let i = 0; i < 5; i++) {
      const x = -40 + Math.random() * 80;
      const z = -40 + Math.random() * 80;
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
  }

  // ============================================
  // LEVEL 3: Sky Battle — Floating islands + Lava below + Dark towers
  // ============================================
  _buildSkyMap() {
    // Lava floor instead of grass (below the islands)
    const lavaFloor = this._track(BABYLON.MeshBuilder.CreateBox('lava', {
      width: 200, height: 0.1, depth: 200
    }, this.scene));
    lavaFloor.position.y = -5;
    lavaFloor.material = this.materials.lava;

    // Main islands
    const islands = [
      { x: 0, y: 8, z: 0, size: 16 },      // Center spawn island
      { x: -25, y: 12, z: -20, size: 10 },  // Left high
      { x: 25, y: 10, z: -15, size: 12 },   // Right mid
      { x: 0, y: 16, z: -40, size: 8 },     // Far center high
      { x: -30, y: 6, z: 20, size: 10 },    // Left low
      { x: 30, y: 14, z: 25, size: 8 },     // Right high
      { x: 0, y: 22, z: -60, size: 6 },     // Boss arena (highest)
    ];
    islands.forEach((island, i) => {
      this._createFloatingIsland(island.x, island.y, island.z, island.size, i);
    });

    // Bridges between islands
    this._createBridge(0, 8, 0, -25, 12, -20);
    this._createBridge(0, 8, 0, 25, 10, -15);
    this._createBridge(-25, 12, -20, 0, 16, -40);
    this._createBridge(25, 10, -15, 0, 16, -40);
    this._createBridge(0, 8, 0, -30, 6, 20);
    this._createBridge(0, 8, 0, 30, 14, 25);
    this._createBridge(0, 16, -40, 0, 22, -60);

    // Dark towers on some islands
    [[-25, 12, -20], [25, 10, -15], [0, 22, -60]].forEach(([x, y, z]) => {
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
    [[0, 9, 0], [-25, 13, -20], [30, 15, 25]].forEach(([x, y, z]) => {
      this._createCrystal(new BABYLON.Vector3(x, y, z));
    });
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
  // LEVEL 4: Lava Fortress — Volcanic fortress with lava rivers
  // ============================================
  _buildLavaFortressMap() {
    // Central obsidian fortress
    this._buildObsidianFortress(0, 0);

    // Lava rivers (glowing strips)
    [[-30, 0], [30, 0], [0, -30], [0, 30]].forEach(([x, z]) => {
      const lava = this._track(BABYLON.MeshBuilder.CreateBox('lavaRiver', {
        width: x === 0 ? 5 : 80, height: 0.08, depth: z === 0 ? 5 : 80
      }, this.scene));
      lava.position = new BABYLON.Vector3(x, 0.06, z);
      lava.material = this.materials.lava;
    });

    // Obsidian pillars scattered
    for (let i = 0; i < 20; i++) {
      const x = -60 + Math.random() * 120;
      const z = -60 + Math.random() * 120;
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

    // Fire pits (glowing circles)
    for (let i = 0; i < 10; i++) {
      const x = -50 + Math.random() * 100;
      const z = -50 + Math.random() * 100;
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

    // Volcanic rocks
    for (let i = 0; i < 15; i++) {
      const x = -55 + Math.random() * 110;
      const z = -55 + Math.random() * 110;
      const rock = this._track(BABYLON.MeshBuilder.CreateSphere('volRock', {
        diameter: 2 + Math.random() * 3
      }, this.scene));
      rock.position = new BABYLON.Vector3(x, 1, z);
      rock.scaling.y = 0.6;
      rock.material = this.materials.darkStone;
    }

    // Torches around fortress
    this._addTorches([
      new BABYLON.Vector3(8, 0, 8), new BABYLON.Vector3(-8, 0, 8),
      new BABYLON.Vector3(8, 0, -8), new BABYLON.Vector3(-8, 0, -8),
    ]);
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
  // LEVEL 5: Frozen Depths — Ice cavern with frozen structures
  // ============================================
  _buildFrozenDepthsMap() {
    // Ice pillars (tall translucent columns)
    for (let i = 0; i < 30; i++) {
      const x = -65 + Math.random() * 130;
      const z = -65 + Math.random() * 130;
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

    // Frozen lake in center
    const lake = this._track(BABYLON.MeshBuilder.CreateBox('frozenLake', {
      width: 30, height: 0.1, depth: 30
    }, this.scene));
    lake.position = new BABYLON.Vector3(0, 0.06, 0);
    lake.material = this.materials.ice;

    // Snow mounds
    for (let i = 0; i < 20; i++) {
      const x = -55 + Math.random() * 110;
      const z = -55 + Math.random() * 110;
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

    // Ice crystal formations
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 20 + Math.random() * 15;
      this._createCrystal(new BABYLON.Vector3(
        Math.cos(angle) * r, 0, Math.sin(angle) * r
      ));
    }

    // Frozen ruins
    this._createRuins(25, -25);
    this._createRuins(-30, 20);

    // Ice walls (cave-like boundaries)
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const r = 60 + Math.random() * 10;
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

    // Frozen trees (white trunks, ice-blue leaves)
    for (let i = 0; i < 12; i++) {
      const x = -45 + Math.random() * 90;
      const z = -45 + Math.random() * 90;
      this._createTree(x, z, 4 + Math.random() * 3);
    }
  }

  // ============================================
  // LEVEL 6: Shadow Realm — Dark void with glowing platforms
  // ============================================
  _buildShadowRealmMap() {
    // Floating dark platforms at ground level
    const platforms = [
      { x: 0, z: 0, size: 20 },
      { x: 25, z: -20, size: 12 },
      { x: -25, z: -15, size: 14 },
      { x: 30, z: 20, size: 10 },
      { x: -30, z: 25, size: 10 },
      { x: 0, z: -40, size: 16 },
      { x: 0, z: 35, size: 12 },
      { x: 45, z: 0, size: 8 },
      { x: -45, z: -5, size: 8 },
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

    // Shadow obelisks
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const r = 35 + Math.random() * 15;
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

    // Dark portals (torus gates)
    [[20, 0], [-20, -30], [0, 30]].forEach(([x, z], i) => {
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
      width: 200, height: 0.1, depth: 200
    }, this.scene));
    fog.position.y = -3;
    const fogMat = new BABYLON.StandardMaterial('fogMat', this.scene);
    fogMat.diffuseColor = new BABYLON.Color3(0.1, 0, 0.15);
    fogMat.emissiveColor = new BABYLON.Color3(0.05, 0, 0.08);
    fogMat.alpha = 0.6;
    fog.material = fogMat;
  }

  // ============================================
  // LEVEL 7: Storm Peaks — Mountain peaks with lightning
  // ============================================
  _buildStormPeaksMap() {
    // Jagged mountain peaks
    const peakPositions = [
      { x: 0, z: 0, h: 15, d: 12 },
      { x: -30, z: -20, h: 20, d: 10 },
      { x: 30, z: -15, h: 18, d: 11 },
      { x: -20, z: 25, h: 12, d: 14 },
      { x: 25, z: 30, h: 22, d: 9 },
      { x: 0, z: -45, h: 25, d: 8 },
      { x: -45, z: 0, h: 16, d: 10 },
      { x: 45, z: 10, h: 14, d: 12 },
      { x: -15, z: -40, h: 18, d: 10 },
      { x: 35, z: -35, h: 20, d: 9 },
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

    // Lightning rods (tall metal poles with glowing tips)
    const stormMat = new BABYLON.StandardMaterial('stormMat', this.scene);
    stormMat.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.9);
    stormMat.emissiveColor = new BABYLON.Color3(0.15, 0.25, 0.4);
    for (let i = 0; i < 12; i++) {
      const x = -55 + Math.random() * 110;
      const z = -55 + Math.random() * 110;
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

    // Dark storm clouds (flat dark planes above)
    for (let i = 0; i < 8; i++) {
      const cloud = this._track(BABYLON.MeshBuilder.CreateBox('stormCloud', {
        width: 15 + Math.random() * 20, height: 1, depth: 15 + Math.random() * 20
      }, this.scene));
      cloud.position = new BABYLON.Vector3(
        -50 + Math.random() * 100, 30 + Math.random() * 10, -50 + Math.random() * 100
      );
      const cMat = new BABYLON.StandardMaterial('cloudMat', this.scene);
      cMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.3);
      cMat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.08);
      cMat.alpha = 0.6;
      cloud.material = cMat;
    }
  }

  // ============================================
  // LEVEL 8: Poison Swamp — Toxic marshland
  // ============================================
  _buildPoisonSwampMap() {
    // Poison lakes (green glowing pools)
    const poisonMat = new BABYLON.StandardMaterial('poisonMat', this.scene);
    poisonMat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.1);
    poisonMat.emissiveColor = new BABYLON.Color3(0.08, 0.25, 0.04);
    poisonMat.alpha = 0.85;

    for (let i = 0; i < 15; i++) {
      const x = -60 + Math.random() * 120;
      const z = -60 + Math.random() * 120;
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

    // Dead trees (no leaves, gnarled trunks)
    for (let i = 0; i < 40; i++) {
      const x = -65 + Math.random() * 130;
      const z = -65 + Math.random() * 130;
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

    // Mushroom clusters (toxic)
    const mushMat = new BABYLON.StandardMaterial('mushMat', this.scene);
    mushMat.diffuseColor = new BABYLON.Color3(0.4, 0.7, 0.1);
    mushMat.emissiveColor = new BABYLON.Color3(0.12, 0.2, 0.03);
    for (let i = 0; i < 25; i++) {
      const x = -55 + Math.random() * 110;
      const z = -55 + Math.random() * 110;
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

    // Bog mounds (raised earth)
    for (let i = 0; i < 12; i++) {
      const x = -50 + Math.random() * 100;
      const z = -50 + Math.random() * 100;
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

    // Hanging vines (vertical cylinders from above)
    for (let i = 0; i < 20; i++) {
      const x = -50 + Math.random() * 100;
      const z = -50 + Math.random() * 100;
      const vine = this._track(BABYLON.MeshBuilder.CreateCylinder('vine', {
        height: 8 + Math.random() * 6, diameter: 0.1
      }, this.scene));
      vine.position = new BABYLON.Vector3(x, 6, z);
      vine.material = this.materials.leaves;
    }

    // Fog layer
    const swampFog = this._track(BABYLON.MeshBuilder.CreateBox('swampFog', {
      width: 200, height: 0.1, depth: 200
    }, this.scene));
    swampFog.position.y = 1.5;
    const sfMat = new BABYLON.StandardMaterial('swampFogMat', this.scene);
    sfMat.diffuseColor = new BABYLON.Color3(0.15, 0.25, 0.08);
    sfMat.emissiveColor = new BABYLON.Color3(0.05, 0.1, 0.03);
    sfMat.alpha = 0.25;
    swampFog.material = sfMat;
  }

  // ============================================
  // LEVEL 9: Crystal Caverns — Underground crystal cave
  // ============================================
  _buildCrystalCavernsMap() {
    // Crystal material (shared for efficiency)
    const crystMat = new BABYLON.StandardMaterial('caveCrystMat', this.scene);
    crystMat.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.8);
    crystMat.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0.35);
    crystMat.specularColor = new BABYLON.Color3(1, 1, 1);
    crystMat.specularPower = 128;
    crystMat.alpha = 0.85;

    // Giant crystal formations
    for (let i = 0; i < 40; i++) {
      const x = -65 + Math.random() * 130;
      const z = -65 + Math.random() * 130;
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

    // Glowing crystal clusters with lights
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const r = 15 + Math.random() * 30;
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
      width: 200, height: 2, depth: 200
    }, this.scene));
    ceiling.position.y = 25;
    ceiling.material = this.materials.darkStone;

    // Stalactites hanging from ceiling
    for (let i = 0; i < 30; i++) {
      const x = -60 + Math.random() * 120;
      const z = -60 + Math.random() * 120;
      const h = 3 + Math.random() * 6;
      const stal = this._track(BABYLON.MeshBuilder.CreateCylinder('stalactite', {
        height: h, diameterTop: 1 + Math.random(), diameterBottom: 0, tessellation: 6
      }, this.scene));
      stal.position = new BABYLON.Vector3(x, 25 - h / 2, z);
      stal.material = this.materials.stone;
    }

    // Underground lake
    const lake = this._track(BABYLON.MeshBuilder.CreateBox('crystLake', {
      width: 25, height: 0.08, depth: 25
    }, this.scene));
    lake.position = new BABYLON.Vector3(0, 0.05, 0);
    const lakeMat = new BABYLON.StandardMaterial('crystLakeMat', this.scene);
    lakeMat.diffuseColor = new BABYLON.Color3(0.3, 0.2, 0.6);
    lakeMat.emissiveColor = new BABYLON.Color3(0.1, 0.06, 0.2);
    lakeMat.alpha = 0.7;
    lake.material = lakeMat;

    // Stone platforms
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 25 + Math.random() * 20;
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
  }

  // ============================================
  // LEVEL 10: The Void — Final arena in nothingness
  // ============================================
  _buildTheVoidMap() {
    // Central massive arena platform
    const arena = this._track(BABYLON.MeshBuilder.CreateCylinder('voidArena', {
      height: 2, diameter: 50, tessellation: 16
    }, this.scene));
    arena.position = new BABYLON.Vector3(0, -0.5, 0);
    arena.material = this.materials.darkStone;
    arena.physicsImpostor = new BABYLON.PhysicsImpostor(
      arena, BABYLON.PhysicsImpostor.CylinderImpostor,
      { mass: 0, friction: 0.8 }, this.scene
    );

    // Outer ring platforms
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const r = 45;
      const plat = this._track(BABYLON.MeshBuilder.CreateCylinder('voidPlat', {
        height: 1.5, diameter: 10, tessellation: 8
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

    // Bridges connecting outer to center
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      this._createBridge(0, 0, 0,
        Math.cos(angle) * 45, 0, Math.sin(angle) * 45
      );
    }

    // Void pillars — tall ominous columns
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const r = 55 + Math.random() * 15;
      const h = 15 + Math.random() * 20;
      const pillar = this._track(BABYLON.MeshBuilder.CreateBox('voidPillar', {
        width: 2, height: h, depth: 2
      }, this.scene));
      pillar.position = new BABYLON.Vector3(
        Math.cos(angle) * r, h / 2, Math.sin(angle) * r
      );
      pillar.material = this.materials.darkStone;
    }

    // Glowing red rune circles on the ground
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 15;
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

    // Dark portals around the edges
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const r = 60;
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
      width: 200, height: 0.1, depth: 200
    }, this.scene));
    abyss.position.y = -10;
    const abyssMat = new BABYLON.StandardMaterial('voidAbyssMat', this.scene);
    abyssMat.diffuseColor = new BABYLON.Color3(0.02, 0, 0.04);
    abyssMat.emissiveColor = new BABYLON.Color3(0.01, 0, 0.02);
    abyss.material = abyssMat;
  }
}
