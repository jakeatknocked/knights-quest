import * as BABYLON from '@babylonjs/core';

const BOSS_CONFIGS = {
  darkKnight: {
    name: 'Dark Knight Lord',
    health: 500,
    speed: 3.0,
    scale: 2.5,
    bodyColor: new BABYLON.Color3(0.3, 0, 0.5),
    emissive: new BABYLON.Color3(0.15, 0, 0.25),
    eyeColor: new BABYLON.Color3(1, 0, 1),
    killThreshold: 10,
    attackCooldownBase: 3.0,
    damage: 20,
    projectileColor: new BABYLON.Color3(0.6, 0, 1),
  },
  frostGiant: {
    name: 'Frost Giant',
    health: 750,
    speed: 2.5,
    scale: 3.5,
    bodyColor: new BABYLON.Color3(0.4, 0.6, 0.9),
    emissive: new BABYLON.Color3(0.1, 0.2, 0.4),
    eyeColor: new BABYLON.Color3(0.5, 0.8, 1),
    killThreshold: 20,
    attackCooldownBase: 3.5,
    damage: 25,
    projectileColor: new BABYLON.Color3(0.3, 0.7, 1),
  },
  dragon: {
    name: 'Dragon',
    health: 1000,
    speed: 4.0,
    scale: 4.0,
    bodyColor: new BABYLON.Color3(0.8, 0.2, 0),
    emissive: new BABYLON.Color3(0.4, 0.1, 0),
    eyeColor: new BABYLON.Color3(1, 0.5, 0),
    killThreshold: 30,
    attackCooldownBase: 3.0,
    damage: 30,
    projectileColor: new BABYLON.Color3(1, 0.4, 0),
  },
  infernoKing: {
    name: 'Inferno King',
    health: 1200,
    speed: 3.5,
    scale: 3.5,
    bodyColor: new BABYLON.Color3(0.9, 0.3, 0),
    emissive: new BABYLON.Color3(0.45, 0.15, 0),
    eyeColor: new BABYLON.Color3(1, 0.8, 0),
    killThreshold: 25,
    attackCooldownBase: 2.5,
    damage: 30,
    projectileColor: new BABYLON.Color3(1, 0.6, 0),
  },
  iceWraith: {
    name: 'Ice Wraith',
    health: 1500,
    speed: 4.5,
    scale: 3.0,
    bodyColor: new BABYLON.Color3(0.5, 0.7, 1),
    emissive: new BABYLON.Color3(0.2, 0.3, 0.5),
    eyeColor: new BABYLON.Color3(0.8, 0.95, 1),
    killThreshold: 30,
    attackCooldownBase: 2.0,
    damage: 25,
    projectileColor: new BABYLON.Color3(0.5, 0.8, 1),
  },
  shadowLord: {
    name: 'Shadow Lord',
    health: 2000,
    speed: 5.0,
    scale: 4.5,
    bodyColor: new BABYLON.Color3(0.15, 0.05, 0.2),
    emissive: new BABYLON.Color3(0.1, 0, 0.15),
    eyeColor: new BABYLON.Color3(1, 0, 0.5),
    killThreshold: 35,
    attackCooldownBase: 1.8,
    damage: 40,
    projectileColor: new BABYLON.Color3(0.8, 0, 0.5),
  },
  stormTitan: {
    name: 'Storm Titan',
    health: 2500,
    speed: 4.0,
    scale: 5.0,
    bodyColor: new BABYLON.Color3(0.3, 0.4, 0.7),
    emissive: new BABYLON.Color3(0.1, 0.15, 0.3),
    eyeColor: new BABYLON.Color3(0.5, 0.8, 1),
    killThreshold: 40,
    attackCooldownBase: 2.0,
    damage: 35,
    projectileColor: new BABYLON.Color3(0.4, 0.7, 1),
  },
  plagueQueen: {
    name: 'Plague Queen',
    health: 2800,
    speed: 4.5,
    scale: 3.5,
    bodyColor: new BABYLON.Color3(0.2, 0.5, 0.1),
    emissive: new BABYLON.Color3(0.08, 0.2, 0.04),
    eyeColor: new BABYLON.Color3(0.6, 1, 0.2),
    killThreshold: 45,
    attackCooldownBase: 1.5,
    damage: 30,
    projectileColor: new BABYLON.Color3(0.4, 0.9, 0.1),
  },
  crystalGolem: {
    name: 'Crystal Golem',
    health: 3500,
    speed: 3.0,
    scale: 5.5,
    bodyColor: new BABYLON.Color3(0.6, 0.3, 0.8),
    emissive: new BABYLON.Color3(0.2, 0.1, 0.3),
    eyeColor: new BABYLON.Color3(0.9, 0.5, 1),
    killThreshold: 50,
    attackCooldownBase: 2.5,
    damage: 45,
    projectileColor: new BABYLON.Color3(0.7, 0.3, 1),
  },
  voidEmperor: {
    name: 'Void Emperor',
    health: 5000,
    speed: 5.5,
    scale: 5.0,
    bodyColor: new BABYLON.Color3(0.05, 0.02, 0.08),
    emissive: new BABYLON.Color3(0.03, 0.01, 0.05),
    eyeColor: new BABYLON.Color3(1, 0.2, 0.2),
    killThreshold: 55,
    attackCooldownBase: 1.2,
    damage: 50,
    projectileColor: new BABYLON.Color3(1, 0.1, 0.3),
  },
};

export { BOSS_CONFIGS };

export class Boss {
  constructor(scene, position, player, bossType) {
    this.scene = scene;
    this.player = player;
    this.bossType = bossType;
    this.config = BOSS_CONFIGS[bossType];
    this.health = this.config.health;
    this.maxHealth = this.config.health;
    this.speed = this.config.speed;
    this.dead = false;
    this.scored = false;
    this.deathPosition = null;
    this.attackCooldown = 0;
    this.phase2 = false;
    this.projectiles = [];

    this.createBoss(position);
    this.createArena(position);
  }

  createBoss(position) {
    const s = this.config.scale;

    this.mesh = BABYLON.MeshBuilder.CreateCylinder('bossCollider', {
      height: 2 * s,
      diameter: 0.8 * s
    }, this.scene);
    this.mesh.isVisible = false;

    this.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
      this.mesh,
      BABYLON.PhysicsImpostor.CylinderImpostor,
      { mass: 20, friction: 0.5, restitution: 0.1 },
      this.scene
    );

    // Body
    const body = BABYLON.MeshBuilder.CreateBox('bossBody', {
      width: 0.8 * s, height: 1.0 * s, depth: 0.5 * s
    }, this.scene);
    body.position.y = 0.2 * s;
    body.parent = this.mesh;

    // Head
    const head = BABYLON.MeshBuilder.CreateSphere('bossHead', {
      diameter: 0.6 * s
    }, this.scene);
    head.position.y = 1.0 * s;
    head.parent = this.mesh;

    const mat = new BABYLON.StandardMaterial('bossMat', this.scene);
    mat.diffuseColor = this.config.bodyColor;
    mat.emissiveColor = new BABYLON.Color3(
      this.config.bodyColor.r * 0.2,
      this.config.bodyColor.g * 0.2,
      this.config.bodyColor.b * 0.2
    );
    body.material = mat;
    head.material = mat;

    // Boss limbs
    const bossLimbMat = new BABYLON.StandardMaterial('bossLimbMat', this.scene);
    bossLimbMat.diffuseColor = new BABYLON.Color3(
      this.config.bodyColor.r * 0.7,
      this.config.bodyColor.g * 0.7,
      this.config.bodyColor.b * 0.7
    );
    bossLimbMat.emissiveColor = new BABYLON.Color3(
      this.config.bodyColor.r * 0.1,
      this.config.bodyColor.g * 0.1,
      this.config.bodyColor.b * 0.1
    );

    // Arms
    const bArmL = BABYLON.MeshBuilder.CreateBox('bArmL', {
      width: 0.3 * s, height: 0.9 * s, depth: 0.3 * s
    }, this.scene);
    bArmL.position.set(-0.55 * s, 0.2 * s, 0);
    bArmL.parent = this.mesh;
    bArmL.material = bossLimbMat;

    const bArmR = BABYLON.MeshBuilder.CreateBox('bArmR', {
      width: 0.3 * s, height: 0.9 * s, depth: 0.3 * s
    }, this.scene);
    bArmR.position.set(0.55 * s, 0.2 * s, 0);
    bArmR.parent = this.mesh;
    bArmR.material = bossLimbMat;

    // Legs
    const bLegL = BABYLON.MeshBuilder.CreateBox('bLegL', {
      width: 0.35 * s, height: 0.8 * s, depth: 0.35 * s
    }, this.scene);
    bLegL.position.set(-0.2 * s, -0.6 * s, 0);
    bLegL.parent = this.mesh;
    bLegL.material = bossLimbMat;

    const bLegR = BABYLON.MeshBuilder.CreateBox('bLegR', {
      width: 0.35 * s, height: 0.8 * s, depth: 0.35 * s
    }, this.scene);
    bLegR.position.set(0.2 * s, -0.6 * s, 0);
    bLegR.parent = this.mesh;
    bLegR.material = bossLimbMat;

    // Eyes
    const eyeMat = new BABYLON.StandardMaterial('bossEyeMat', this.scene);
    eyeMat.diffuseColor = this.config.eyeColor;
    eyeMat.emissiveColor = new BABYLON.Color3(
      this.config.eyeColor.r * 0.4,
      this.config.eyeColor.g * 0.4,
      this.config.eyeColor.b * 0.4
    );

    const eyeL = BABYLON.MeshBuilder.CreateSphere('bossEyeL', { diameter: 0.1 * s }, this.scene);
    eyeL.position.set(-0.15 * s, 1.05 * s, 0.25 * s);
    eyeL.parent = this.mesh;
    eyeL.material = eyeMat;

    const eyeR = BABYLON.MeshBuilder.CreateSphere('bossEyeR', { diameter: 0.1 * s }, this.scene);
    eyeR.position.set(0.15 * s, 1.05 * s, 0.25 * s);
    eyeR.parent = this.mesh;
    eyeR.material = eyeMat;

    // Boss-specific decorations
    if (this.bossType === 'darkKnight') {
      // Purple crown
      const crown = BABYLON.MeshBuilder.CreateTorus('crown', {
        diameter: 0.6 * s, thickness: 0.08 * s, tessellation: 16
      }, this.scene);
      crown.position.y = 1.35 * s;
      crown.parent = this.mesh;
      const crownMat = new BABYLON.StandardMaterial('crownMat', this.scene);
      crownMat.diffuseColor = new BABYLON.Color3(0.6, 0, 1);
      crownMat.emissiveColor = new BABYLON.Color3(0.15, 0, 0.25);
      crown.material = crownMat;
    } else if (this.bossType === 'frostGiant') {
      // Ice horns
      for (let side = -1; side <= 1; side += 2) {
        const horn = BABYLON.MeshBuilder.CreateCylinder('horn', {
          height: 0.5 * s, diameterTop: 0, diameterBottom: 0.12 * s
        }, this.scene);
        horn.position.set(side * 0.25 * s, 1.4 * s, 0);
        horn.rotation.z = side * -0.4;
        horn.parent = this.mesh;
        const hornMat = new BABYLON.StandardMaterial('hornMat', this.scene);
        hornMat.diffuseColor = new BABYLON.Color3(0.7, 0.9, 1);
        hornMat.emissiveColor = new BABYLON.Color3(0.14, 0.18, 0.2);
        horn.material = hornMat;
      }
    } else if (this.bossType === 'dragon') {
      // Wings
      for (let side = -1; side <= 1; side += 2) {
        const wing = BABYLON.MeshBuilder.CreatePlane('wing', {
          width: 1.5 * s, height: 1.0 * s
        }, this.scene);
        wing.position.set(side * 0.8 * s, 0.6 * s, -0.2 * s);
        wing.rotation.y = side * 0.5;
        wing.parent = this.mesh;
        const wingMat = new BABYLON.StandardMaterial('wingMat', this.scene);
        wingMat.diffuseColor = new BABYLON.Color3(0.6, 0.1, 0);
        wingMat.emissiveColor = new BABYLON.Color3(0.12, 0.02, 0);
        wingMat.backFaceCulling = false;
        wing.material = wingMat;
      }
    } else if (this.bossType === 'infernoKing') {
      // Flame crown (torus) + shoulder flames
      const crown = BABYLON.MeshBuilder.CreateTorus('flameCrown', {
        diameter: 0.7 * s, thickness: 0.1 * s, tessellation: 16
      }, this.scene);
      crown.position.y = 1.4 * s;
      crown.parent = this.mesh;
      const crownMat = new BABYLON.StandardMaterial('flameCrownMat', this.scene);
      crownMat.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
      crownMat.emissiveColor = new BABYLON.Color3(0.5, 0.2, 0);
      crown.material = crownMat;
      for (let side = -1; side <= 1; side += 2) {
        const flame = BABYLON.MeshBuilder.CreateSphere('shoulderFlame', {
          diameter: 0.35 * s
        }, this.scene);
        flame.position.set(side * 0.65 * s, 0.8 * s, 0);
        flame.parent = this.mesh;
        const fMat = new BABYLON.StandardMaterial('sfMat', this.scene);
        fMat.diffuseColor = new BABYLON.Color3(1, 0.4, 0);
        fMat.emissiveColor = new BABYLON.Color3(0.4, 0.15, 0);
        flame.material = fMat;
      }
    } else if (this.bossType === 'iceWraith') {
      // Ice spikes on shoulders + frozen aura ring
      for (let side = -1; side <= 1; side += 2) {
        const spike = BABYLON.MeshBuilder.CreateCylinder('iceSpike', {
          height: 0.6 * s, diameterTop: 0, diameterBottom: 0.15 * s
        }, this.scene);
        spike.position.set(side * 0.5 * s, 1.2 * s, 0);
        spike.rotation.z = side * -0.3;
        spike.parent = this.mesh;
        const spkMat = new BABYLON.StandardMaterial('iceSpkMat', this.scene);
        spkMat.diffuseColor = new BABYLON.Color3(0.7, 0.9, 1);
        spkMat.emissiveColor = new BABYLON.Color3(0.2, 0.3, 0.4);
        spkMat.alpha = 0.85;
        spike.material = spkMat;
      }
      const aura = BABYLON.MeshBuilder.CreateTorus('iceAura', {
        diameter: 1.2 * s, thickness: 0.06 * s, tessellation: 24
      }, this.scene);
      aura.position.y = 0.1 * s;
      aura.parent = this.mesh;
      const auraMat = new BABYLON.StandardMaterial('iceAuraMat', this.scene);
      auraMat.diffuseColor = new BABYLON.Color3(0.5, 0.8, 1);
      auraMat.emissiveColor = new BABYLON.Color3(0.15, 0.25, 0.4);
      auraMat.alpha = 0.6;
      aura.material = auraMat;
    } else if (this.bossType === 'shadowLord') {
      // Dark wings + glowing rune circle
      for (let side = -1; side <= 1; side += 2) {
        const wing = BABYLON.MeshBuilder.CreatePlane('shadowWing', {
          width: 2.0 * s, height: 1.2 * s
        }, this.scene);
        wing.position.set(side * 0.9 * s, 0.5 * s, -0.2 * s);
        wing.rotation.y = side * 0.6;
        wing.parent = this.mesh;
        const wMat = new BABYLON.StandardMaterial('sWingMat', this.scene);
        wMat.diffuseColor = new BABYLON.Color3(0.2, 0, 0.3);
        wMat.emissiveColor = new BABYLON.Color3(0.08, 0, 0.12);
        wMat.backFaceCulling = false;
        wMat.alpha = 0.8;
        wing.material = wMat;
      }
      const rune = BABYLON.MeshBuilder.CreateTorus('runeCircle', {
        diameter: 1.5 * s, thickness: 0.05 * s, tessellation: 32
      }, this.scene);
      rune.position.y = -0.8 * s;
      rune.parent = this.mesh;
      const runeMat = new BABYLON.StandardMaterial('runeMat', this.scene);
      runeMat.diffuseColor = new BABYLON.Color3(0.8, 0, 0.5);
      runeMat.emissiveColor = new BABYLON.Color3(0.4, 0, 0.25);
      rune.material = runeMat;
    } else if (this.bossType === 'stormTitan') {
      // Lightning horns + storm aura
      for (let side = -1; side <= 1; side += 2) {
        const horn = BABYLON.MeshBuilder.CreateCylinder('stormHorn', {
          height: 0.8 * s, diameterTop: 0, diameterBottom: 0.18 * s
        }, this.scene);
        horn.position.set(side * 0.3 * s, 1.5 * s, 0);
        horn.rotation.z = side * -0.5;
        horn.parent = this.mesh;
        const hMat = new BABYLON.StandardMaterial('stHornMat', this.scene);
        hMat.diffuseColor = new BABYLON.Color3(0.4, 0.7, 1);
        hMat.emissiveColor = new BABYLON.Color3(0.2, 0.35, 0.5);
        horn.material = hMat;
      }
      const stormAura = BABYLON.MeshBuilder.CreateTorus('stormAura', {
        diameter: 1.8 * s, thickness: 0.08 * s, tessellation: 24
      }, this.scene);
      stormAura.position.y = 0.5 * s;
      stormAura.parent = this.mesh;
      const saMat = new BABYLON.StandardMaterial('stormAuraMat', this.scene);
      saMat.diffuseColor = new BABYLON.Color3(0.3, 0.6, 1);
      saMat.emissiveColor = new BABYLON.Color3(0.15, 0.3, 0.5);
      saMat.alpha = 0.5;
      stormAura.material = saMat;
    } else if (this.bossType === 'plagueQueen') {
      // Toxic crown + poison drip spheres
      const crown = BABYLON.MeshBuilder.CreateTorus('plagueCrown', {
        diameter: 0.65 * s, thickness: 0.09 * s, tessellation: 16
      }, this.scene);
      crown.position.y = 1.35 * s;
      crown.parent = this.mesh;
      const pcMat = new BABYLON.StandardMaterial('plagueCrownMat', this.scene);
      pcMat.diffuseColor = new BABYLON.Color3(0.3, 0.8, 0.1);
      pcMat.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.03);
      crown.material = pcMat;
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const drip = BABYLON.MeshBuilder.CreateSphere('poisonDrip', { diameter: 0.2 * s }, this.scene);
        drip.position.set(Math.cos(angle) * 0.5 * s, -0.4 * s, Math.sin(angle) * 0.5 * s);
        drip.parent = this.mesh;
        const dMat = new BABYLON.StandardMaterial('dripMat', this.scene);
        dMat.diffuseColor = new BABYLON.Color3(0.2, 0.7, 0.05);
        dMat.emissiveColor = new BABYLON.Color3(0.08, 0.25, 0.02);
        dMat.alpha = 0.7;
        drip.material = dMat;
      }
    } else if (this.bossType === 'crystalGolem') {
      // Crystal spikes on shoulders and head
      for (let side = -1; side <= 1; side += 2) {
        const spike = BABYLON.MeshBuilder.CreateCylinder('crystalSpike', {
          height: 0.7 * s, diameterTop: 0, diameterBottom: 0.2 * s, tessellation: 6
        }, this.scene);
        spike.position.set(side * 0.6 * s, 1.0 * s, 0);
        spike.rotation.z = side * -0.4;
        spike.parent = this.mesh;
        const csMat = new BABYLON.StandardMaterial('crystSpkMat', this.scene);
        csMat.diffuseColor = new BABYLON.Color3(0.7, 0.4, 1);
        csMat.emissiveColor = new BABYLON.Color3(0.25, 0.12, 0.4);
        csMat.alpha = 0.85;
        spike.material = csMat;
      }
      const headCrystal = BABYLON.MeshBuilder.CreateCylinder('headCrystal', {
        height: 0.5 * s, diameterTop: 0, diameterBottom: 0.15 * s, tessellation: 6
      }, this.scene);
      headCrystal.position.set(0, 1.5 * s, 0);
      headCrystal.parent = this.mesh;
      const hcMat = new BABYLON.StandardMaterial('hcMat', this.scene);
      hcMat.diffuseColor = new BABYLON.Color3(0.9, 0.5, 1);
      hcMat.emissiveColor = new BABYLON.Color3(0.35, 0.2, 0.5);
      headCrystal.material = hcMat;
    } else if (this.bossType === 'voidEmperor') {
      // Massive dark wings + dual rune circles + crown
      for (let side = -1; side <= 1; side += 2) {
        const wing = BABYLON.MeshBuilder.CreatePlane('voidWing', {
          width: 2.5 * s, height: 1.5 * s
        }, this.scene);
        wing.position.set(side * 1.0 * s, 0.6 * s, -0.3 * s);
        wing.rotation.y = side * 0.7;
        wing.parent = this.mesh;
        const vwMat = new BABYLON.StandardMaterial('voidWingMat', this.scene);
        vwMat.diffuseColor = new BABYLON.Color3(0.1, 0, 0.15);
        vwMat.emissiveColor = new BABYLON.Color3(0.05, 0, 0.08);
        vwMat.backFaceCulling = false;
        vwMat.alpha = 0.85;
        wing.material = vwMat;
      }
      for (let i = 0; i < 2; i++) {
        const rune = BABYLON.MeshBuilder.CreateTorus('voidRune', {
          diameter: (1.2 + i * 0.6) * s, thickness: 0.04 * s, tessellation: 32
        }, this.scene);
        rune.position.y = (-0.7 + i * 0.3) * s;
        rune.parent = this.mesh;
        const vrMat = new BABYLON.StandardMaterial('vrMat', this.scene);
        vrMat.diffuseColor = new BABYLON.Color3(1, 0.1, 0.2);
        vrMat.emissiveColor = new BABYLON.Color3(0.5, 0.05, 0.1);
        rune.material = vrMat;
      }
      const crown = BABYLON.MeshBuilder.CreateTorus('voidCrown', {
        diameter: 0.7 * s, thickness: 0.1 * s, tessellation: 16
      }, this.scene);
      crown.position.y = 1.4 * s;
      crown.parent = this.mesh;
      const vcMat = new BABYLON.StandardMaterial('voidCrownMat', this.scene);
      vcMat.diffuseColor = new BABYLON.Color3(1, 0, 0.2);
      vcMat.emissiveColor = new BABYLON.Color3(0.5, 0, 0.1);
      crown.material = vcMat;
    }

    this.mesh.position = position.clone();
    this.mesh.position.y = s + 0.5;

    if (this.mesh.physicsImpostor.physicsBody) {
      this.mesh.physicsImpostor.physicsBody.fixedRotation = true;
      this.mesh.physicsImpostor.physicsBody.updateMassProperties();
      this.mesh.physicsImpostor.physicsBody.angularDamping = 1.0;
      this.mesh.physicsImpostor.physicsBody.linearDamping = 0.95;
    }
  }

  createArena(position) {
    // 12 glowing pillars in a circle
    this.arenaPillars = [];
    const pillarMat = new BABYLON.StandardMaterial('pillarMat', this.scene);
    pillarMat.diffuseColor = this.config.bodyColor;

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const pillar = BABYLON.MeshBuilder.CreateCylinder('arenaPillar', {
        height: 6, diameter: 0.5
      }, this.scene);
      pillar.position.set(
        position.x + Math.cos(angle) * 20,
        3,
        position.z + Math.sin(angle) * 20
      );
      pillar.material = pillarMat;
      this.arenaPillars.push(pillar);
    }
  }

  update(deltaTime, game) {
    if (this.dead || !this.mesh || !this.mesh.physicsImpostor || !this.mesh.physicsImpostor.physicsBody) return;
    if (!this.player || !this.player.mesh) return;

    // Phase 2 check
    if (!this.phase2 && this.health <= this.maxHealth * 0.5) {
      this.phase2 = true;
      this.speed *= 1.3;
      if (game) game.hud.showMessage(`${this.config.name} enters Phase 2!`);
    }

    if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;

    const currentVel = this.mesh.physicsImpostor.getLinearVelocity();
    const distToPlayer = BABYLON.Vector3.Distance(this.mesh.position, this.player.mesh.position);

    if (distToPlayer < 40) {
      // Chase player
      const direction = this.player.mesh.position.subtract(this.mesh.position);
      direction.y = 0;
      if (direction.length() > 0.01) direction.normalize();
      else return;

      this.mesh.physicsImpostor.setLinearVelocity(
        new BABYLON.Vector3(
          direction.x * this.speed,
          currentVel.y,
          direction.z * this.speed
        )
      );

      this.mesh.lookAt(this.player.mesh.position);

      // Melee damage at close range
      if (distToPlayer < 3.5 && this.attackCooldown <= 0 && game) {
        game.damagePlayer(this.config.damage);
        this.attackCooldown = 1.0;
      }

      // Special attack
      if (this.attackCooldown <= 0 && distToPlayer < 30) {
        this.specialAttack(game);
        this.attackCooldown = this.phase2
          ? this.config.attackCooldownBase * 0.6
          : this.config.attackCooldownBase;
      }
    }

    // Update boss health bar in HUD
    if (game) {
      const container = document.getElementById('boss-bar-container');
      container.style.display = 'block';
      document.getElementById('boss-name').textContent = this.config.name;
      const pct = this.health / this.maxHealth * 100;
      document.getElementById('boss-health-bar').style.width = pct + '%';
    }

    // Update projectiles
    this.updateProjectiles(deltaTime, game);
  }

  specialAttack(game) {
    if (this.bossType === 'darkKnight') {
      // Fire dark projectile at player
      this.fireProjectile(this.player.mesh.position);
    } else if (this.bossType === 'frostGiant') {
      // Ice slam AoE — 3 projectiles spread
      for (let i = -1; i <= 1; i++) {
        const target = this.player.mesh.position.clone();
        target.x += i * 5;
        this.fireProjectile(target);
      }
    } else if (this.bossType === 'dragon') {
      // Fire breath — 5 projectiles in a cone
      const rawDir = this.player.mesh.position.subtract(this.mesh.position);
      rawDir.y = 0;
      if (rawDir.length() < 0.01) return;
      const dir = rawDir.normalize();
      for (let i = -2; i <= 2; i++) {
        const angle = Math.atan2(dir.z, dir.x) + i * 0.2;
        const target = this.mesh.position.add(
          new BABYLON.Vector3(Math.cos(angle) * 20, 0, Math.sin(angle) * 20)
        );
        this.fireProjectile(target);
      }
    } else if (this.bossType === 'infernoKing') {
      // Lava eruption — 8 projectiles in all directions
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const target = this.mesh.position.add(
          new BABYLON.Vector3(Math.cos(angle) * 20, 0, Math.sin(angle) * 20)
        );
        this.fireProjectile(target);
      }
    } else if (this.bossType === 'iceWraith') {
      // Frost barrage — 4 rapid shots at player with slight spread
      for (let i = 0; i < 4; i++) {
        const target = this.player.mesh.position.clone();
        target.x += (Math.random() - 0.5) * 6;
        target.z += (Math.random() - 0.5) * 6;
        this.fireProjectile(target);
      }
    } else if (this.bossType === 'shadowLord') {
      // Shadow storm — 5 cone + 6 ring
      const rawDir = this.player.mesh.position.subtract(this.mesh.position);
      rawDir.y = 0;
      if (rawDir.length() < 0.01) return;
      const dir = rawDir.normalize();
      for (let i = -2; i <= 2; i++) {
        const angle = Math.atan2(dir.z, dir.x) + i * 0.15;
        const target = this.mesh.position.add(
          new BABYLON.Vector3(Math.cos(angle) * 25, 0, Math.sin(angle) * 25)
        );
        this.fireProjectile(target);
      }
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const target = this.mesh.position.add(
          new BABYLON.Vector3(Math.cos(angle) * 18, 0, Math.sin(angle) * 18)
        );
        this.fireProjectile(target);
      }
    } else if (this.bossType === 'stormTitan') {
      // Lightning strike — 10 bolts in random positions around player
      for (let i = 0; i < 10; i++) {
        const target = this.player.mesh.position.clone();
        target.x += (Math.random() - 0.5) * 16;
        target.z += (Math.random() - 0.5) * 16;
        this.fireProjectile(target);
      }
    } else if (this.bossType === 'plagueQueen') {
      // Poison spray — 12 projectiles in expanding spiral
      const rawDir = this.player.mesh.position.subtract(this.mesh.position);
      rawDir.y = 0;
      if (rawDir.length() < 0.01) return;
      const baseAngle = Math.atan2(rawDir.z, rawDir.x);
      for (let i = 0; i < 12; i++) {
        const angle = baseAngle + (i / 12) * Math.PI * 2;
        const target = this.mesh.position.add(
          new BABYLON.Vector3(Math.cos(angle) * 22, 0, Math.sin(angle) * 22)
        );
        this.fireProjectile(target);
      }
    } else if (this.bossType === 'crystalGolem') {
      // Crystal shatter — 6 aimed + 8 ring outward
      for (let i = 0; i < 6; i++) {
        const target = this.player.mesh.position.clone();
        target.x += (Math.random() - 0.5) * 8;
        target.z += (Math.random() - 0.5) * 8;
        this.fireProjectile(target);
      }
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const target = this.mesh.position.add(
          new BABYLON.Vector3(Math.cos(angle) * 25, 0, Math.sin(angle) * 25)
        );
        this.fireProjectile(target);
      }
    } else if (this.bossType === 'voidEmperor') {
      // Void annihilation — 8 cone + 12 ring + 6 random
      const rawDir = this.player.mesh.position.subtract(this.mesh.position);
      rawDir.y = 0;
      if (rawDir.length() < 0.01) return;
      const dir = rawDir.normalize();
      for (let i = -3; i <= 4; i++) {
        const angle = Math.atan2(dir.z, dir.x) + i * 0.12;
        const target = this.mesh.position.add(
          new BABYLON.Vector3(Math.cos(angle) * 30, 0, Math.sin(angle) * 30)
        );
        this.fireProjectile(target);
      }
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const target = this.mesh.position.add(
          new BABYLON.Vector3(Math.cos(angle) * 20, 0, Math.sin(angle) * 20)
        );
        this.fireProjectile(target);
      }
      for (let i = 0; i < 6; i++) {
        const target = this.player.mesh.position.clone();
        target.x += (Math.random() - 0.5) * 12;
        target.z += (Math.random() - 0.5) * 12;
        this.fireProjectile(target);
      }
    }
  }

  fireProjectile(targetPos) {
    const proj = BABYLON.MeshBuilder.CreateSphere('bossProj', { diameter: 0.6 }, this.scene);
    proj.position = this.mesh.position.clone();
    proj.position.y += 1.5;

    const mat = new BABYLON.StandardMaterial('bossProjMat', this.scene);
    mat.diffuseColor = this.config.projectileColor;
    proj.material = mat;

    const light = new BABYLON.PointLight('bossProjLight', proj.position.clone(), this.scene);
    light.diffuse = this.config.projectileColor;
    light.intensity = 0.8;
    light.range = 6;

    const direction = targetPos.subtract(this.mesh.position);
    direction.y = 0;
    if (direction.length() > 0.01) direction.normalize();
    else return;

    this.projectiles.push({
      mesh: proj,
      light: light,
      velocity: direction.scale(15),
      lifetime: 3.0
    });
  }

  updateProjectiles(deltaTime, game) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p.mesh) {
        this.projectiles.splice(i, 1);
        continue;
      }
      p.lifetime -= deltaTime;

      if (p.lifetime <= 0) {
        this.disposeProjectile(p);
        this.projectiles.splice(i, 1);
        continue;
      }

      p.mesh.position.addInPlace(p.velocity.scale(deltaTime));
      if (p.light) p.light.position.copyFrom(p.mesh.position);

      // Check player hit
      if (game && this.player && this.player.mesh) {
        const dist = BABYLON.Vector3.Distance(p.mesh.position, this.player.mesh.position);
        if (dist < 2.0) {
          game.damagePlayer(this.config.damage);
          this.disposeProjectile(p);
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  disposeProjectile(p) {
    if (p.light) p.light.dispose();
    if (p.mesh) {
      if (p.mesh.material) p.mesh.material.dispose();
      p.mesh.dispose();
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.dead = true;
    this.deathPosition = this.mesh ? this.mesh.position.clone() : null;

    // Hide boss bar
    document.getElementById('boss-bar-container').style.display = 'none';

    // Dispose projectiles
    this.projectiles.forEach(p => this.disposeProjectile(p));
    this.projectiles = [];

    // Dispose arena pillars (shared material — dispose once after all pillars)
    if (this.arenaPillars && this.arenaPillars.length > 0) {
      const sharedMat = this.arenaPillars[0].material;
      this.arenaPillars.forEach(p => p.dispose());
      if (sharedMat) sharedMat.dispose();
      this.arenaPillars = [];
    }

    // Dispose mesh
    if (this.mesh) {
      this.mesh.getChildMeshes().forEach(child => {
        if (child.material) child.material.dispose();
        child.dispose();
      });
      if (this.mesh.physicsImpostor) {
        this.mesh.physicsImpostor.dispose();
      }
      this.mesh.dispose();
      this.mesh = null;
    }
  }
}
