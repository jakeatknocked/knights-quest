import { Enemy } from '../entities/Enemy.js';
import { Boss, BOSS_CONFIGS } from '../entities/Boss.js';
import * as BABYLON from '@babylonjs/core';

const LEVEL_CONFIGS = [
  {
    id: 1,
    name: 'Castle Siege',
    enemyCount: 10,
    bossType: 'darkKnight',
    spawnPositions: [
      new BABYLON.Vector3(8, 0, -25),
      new BABYLON.Vector3(-8, 0, -25),
      new BABYLON.Vector3(0, 0, -40),
      new BABYLON.Vector3(12, 0, 10),
      new BABYLON.Vector3(-12, 0, 8),
      new BABYLON.Vector3(20, 0, 5),
      new BABYLON.Vector3(-15, 0, -10),
      new BABYLON.Vector3(15, 0, 15),
      new BABYLON.Vector3(5, 0, -15),
      new BABYLON.Vector3(-5, 0, 5),
    ],
  },
  {
    id: 2,
    name: 'Forest Hunt',
    enemyCount: 15,
    bossType: 'frostGiant',
    spawnPositions: [
      new BABYLON.Vector3(10, 0, -15),
      new BABYLON.Vector3(-15, 0, 10),
      new BABYLON.Vector3(25, 0, 5),
      new BABYLON.Vector3(-25, 0, -10),
      new BABYLON.Vector3(35, 0, 20),
      new BABYLON.Vector3(-35, 0, 15),
      new BABYLON.Vector3(0, 0, -30),
      new BABYLON.Vector3(20, 0, -25),
      new BABYLON.Vector3(-20, 0, 30),
      new BABYLON.Vector3(40, 0, -5),
      new BABYLON.Vector3(-40, 0, -20),
      new BABYLON.Vector3(15, 0, 35),
      new BABYLON.Vector3(-10, 0, -40),
      new BABYLON.Vector3(30, 0, 10),
      new BABYLON.Vector3(-30, 0, 25),
    ],
  },
  {
    id: 3,
    name: 'Sky Battle',
    enemyCount: 20,
    bossType: 'dragon',
    spawnPositions: [
      // Center island (0, 8, 0)
      new BABYLON.Vector3(3, 10, 2),
      new BABYLON.Vector3(-3, 10, -2),
      new BABYLON.Vector3(5, 10, -3),
      // Left high island (-25, 12, -20)
      new BABYLON.Vector3(-23, 14, -18),
      new BABYLON.Vector3(-27, 14, -22),
      new BABYLON.Vector3(-25, 14, -17),
      // Right mid island (25, 10, -15)
      new BABYLON.Vector3(23, 12, -13),
      new BABYLON.Vector3(27, 12, -17),
      new BABYLON.Vector3(25, 12, -12),
      // Far center island (0, 16, -40)
      new BABYLON.Vector3(2, 18, -38),
      new BABYLON.Vector3(-2, 18, -42),
      new BABYLON.Vector3(0, 18, -37),
      // Left low island (-30, 6, 20)
      new BABYLON.Vector3(-28, 8, 22),
      new BABYLON.Vector3(-32, 8, 18),
      new BABYLON.Vector3(-30, 8, 23),
      // Right high island (30, 14, 25)
      new BABYLON.Vector3(28, 16, 23),
      new BABYLON.Vector3(32, 16, 27),
      // Boss arena island (0, 22, -60)
      new BABYLON.Vector3(1, 24, -58),
      new BABYLON.Vector3(-1, 24, -62),
      new BABYLON.Vector3(0, 24, -57),
    ],
  },
  {
    id: 4,
    name: 'Lava Fortress',
    enemyCount: 25,
    bossType: 'infernoKing',
    spawnPositions: [
      new BABYLON.Vector3(10, 0, -10),
      new BABYLON.Vector3(-10, 0, -15),
      new BABYLON.Vector3(20, 0, 5),
      new BABYLON.Vector3(-20, 0, 10),
      new BABYLON.Vector3(30, 0, -20),
      new BABYLON.Vector3(-30, 0, 20),
      new BABYLON.Vector3(0, 0, -35),
      new BABYLON.Vector3(15, 0, 25),
      new BABYLON.Vector3(-15, 0, -30),
      new BABYLON.Vector3(25, 0, 15),
      new BABYLON.Vector3(-25, 0, -5),
      new BABYLON.Vector3(35, 0, 0),
      new BABYLON.Vector3(-35, 0, -25),
      new BABYLON.Vector3(5, 0, 35),
      new BABYLON.Vector3(-5, 0, -40),
      new BABYLON.Vector3(40, 0, -10),
      new BABYLON.Vector3(-40, 0, 15),
      new BABYLON.Vector3(12, 0, -25),
      new BABYLON.Vector3(-12, 0, 30),
      new BABYLON.Vector3(22, 0, -30),
      new BABYLON.Vector3(-22, 0, 35),
      new BABYLON.Vector3(8, 0, 20),
      new BABYLON.Vector3(-8, 0, -20),
      new BABYLON.Vector3(18, 0, -5),
      new BABYLON.Vector3(-18, 0, 0),
    ],
  },
  {
    id: 5,
    name: 'Frozen Depths',
    enemyCount: 30,
    bossType: 'iceWraith',
    spawnPositions: [
      new BABYLON.Vector3(5, 0, -10),
      new BABYLON.Vector3(-10, 0, 5),
      new BABYLON.Vector3(15, 0, 15),
      new BABYLON.Vector3(-20, 0, -10),
      new BABYLON.Vector3(25, 0, 0),
      new BABYLON.Vector3(-30, 0, 20),
      new BABYLON.Vector3(10, 0, -30),
      new BABYLON.Vector3(-5, 0, 30),
      new BABYLON.Vector3(35, 0, -15),
      new BABYLON.Vector3(-35, 0, 10),
      new BABYLON.Vector3(0, 0, -40),
      new BABYLON.Vector3(20, 0, 25),
      new BABYLON.Vector3(-25, 0, -25),
      new BABYLON.Vector3(40, 0, 5),
      new BABYLON.Vector3(-15, 0, 35),
      new BABYLON.Vector3(30, 0, -10),
      new BABYLON.Vector3(-40, 0, -5),
      new BABYLON.Vector3(8, 0, -20),
      new BABYLON.Vector3(-8, 0, 15),
      new BABYLON.Vector3(12, 0, 40),
      new BABYLON.Vector3(-12, 0, -35),
      new BABYLON.Vector3(22, 0, 10),
      new BABYLON.Vector3(-22, 0, -15),
      new BABYLON.Vector3(18, 0, -25),
      new BABYLON.Vector3(-18, 0, 25),
      new BABYLON.Vector3(28, 0, 20),
      new BABYLON.Vector3(-28, 0, -30),
      new BABYLON.Vector3(38, 0, -20),
      new BABYLON.Vector3(-38, 0, 30),
      new BABYLON.Vector3(0, 0, 0),
    ],
  },
  {
    id: 6,
    name: 'Shadow Realm',
    enemyCount: 35,
    bossType: 'shadowLord',
    spawnPositions: [
      new BABYLON.Vector3(5, 0, -5),
      new BABYLON.Vector3(-5, 0, 5),
      new BABYLON.Vector3(15, 0, -15),
      new BABYLON.Vector3(-15, 0, 15),
      new BABYLON.Vector3(25, 0, 0),
      new BABYLON.Vector3(-25, 0, -10),
      new BABYLON.Vector3(0, 0, -30),
      new BABYLON.Vector3(10, 0, 20),
      new BABYLON.Vector3(-10, 0, -25),
      new BABYLON.Vector3(30, 0, 10),
      new BABYLON.Vector3(-30, 0, 25),
      new BABYLON.Vector3(35, 0, -20),
      new BABYLON.Vector3(-35, 0, -15),
      new BABYLON.Vector3(20, 0, 30),
      new BABYLON.Vector3(-20, 0, 35),
      new BABYLON.Vector3(40, 0, -5),
      new BABYLON.Vector3(-40, 0, 0),
      new BABYLON.Vector3(8, 0, -35),
      new BABYLON.Vector3(-8, 0, -40),
      new BABYLON.Vector3(12, 0, 35),
      new BABYLON.Vector3(-12, 0, 40),
      new BABYLON.Vector3(18, 0, -10),
      new BABYLON.Vector3(-18, 0, 10),
      new BABYLON.Vector3(22, 0, -25),
      new BABYLON.Vector3(-22, 0, 20),
      new BABYLON.Vector3(28, 0, 15),
      new BABYLON.Vector3(-28, 0, -20),
      new BABYLON.Vector3(32, 0, 5),
      new BABYLON.Vector3(-32, 0, -30),
      new BABYLON.Vector3(38, 0, 25),
      new BABYLON.Vector3(-38, 0, -35),
      new BABYLON.Vector3(3, 0, 10),
      new BABYLON.Vector3(-3, 0, -8),
      new BABYLON.Vector3(45, 0, 0),
      new BABYLON.Vector3(-45, 0, -5),
    ],
  },
  {
    id: 7,
    name: 'Storm Peaks',
    enemyCount: 40,
    bossType: 'stormTitan',
    spawnPositions: [
      new BABYLON.Vector3(5, 12, -5), new BABYLON.Vector3(-5, 12, 5),
      new BABYLON.Vector3(15, 8, -15), new BABYLON.Vector3(-15, 8, 15),
      new BABYLON.Vector3(25, 14, 0), new BABYLON.Vector3(-25, 14, -10),
      new BABYLON.Vector3(0, 10, -30), new BABYLON.Vector3(10, 6, 20),
      new BABYLON.Vector3(-10, 6, -25), new BABYLON.Vector3(30, 10, 10),
      new BABYLON.Vector3(-30, 10, 25), new BABYLON.Vector3(35, 16, -20),
      new BABYLON.Vector3(-35, 16, -15), new BABYLON.Vector3(20, 12, 30),
      new BABYLON.Vector3(-20, 12, 35), new BABYLON.Vector3(40, 8, -5),
      new BABYLON.Vector3(-40, 8, 0), new BABYLON.Vector3(8, 14, -35),
      new BABYLON.Vector3(-8, 14, -40), new BABYLON.Vector3(12, 10, 35),
      new BABYLON.Vector3(-12, 10, 40), new BABYLON.Vector3(18, 6, -10),
      new BABYLON.Vector3(-18, 6, 10), new BABYLON.Vector3(22, 14, -25),
      new BABYLON.Vector3(-22, 14, 20), new BABYLON.Vector3(28, 8, 15),
      new BABYLON.Vector3(-28, 8, -20), new BABYLON.Vector3(32, 12, 5),
      new BABYLON.Vector3(-32, 12, -30), new BABYLON.Vector3(38, 10, 25),
      new BABYLON.Vector3(-38, 10, -35), new BABYLON.Vector3(3, 8, 10),
      new BABYLON.Vector3(-3, 8, -8), new BABYLON.Vector3(45, 6, 0),
      new BABYLON.Vector3(-45, 6, -5), new BABYLON.Vector3(7, 16, 15),
      new BABYLON.Vector3(-7, 16, -12), new BABYLON.Vector3(50, 10, -10),
      new BABYLON.Vector3(-50, 10, 10), new BABYLON.Vector3(0, 12, 45),
    ],
  },
  {
    id: 8,
    name: 'Poison Swamp',
    enemyCount: 45,
    bossType: 'plagueQueen',
    spawnPositions: [
      new BABYLON.Vector3(5, 0, -5), new BABYLON.Vector3(-8, 0, 8),
      new BABYLON.Vector3(15, 0, -18), new BABYLON.Vector3(-18, 0, 15),
      new BABYLON.Vector3(25, 0, 0), new BABYLON.Vector3(-25, 0, -12),
      new BABYLON.Vector3(0, 0, -35), new BABYLON.Vector3(12, 0, 22),
      new BABYLON.Vector3(-12, 0, -28), new BABYLON.Vector3(32, 0, 12),
      new BABYLON.Vector3(-32, 0, 28), new BABYLON.Vector3(38, 0, -22),
      new BABYLON.Vector3(-38, 0, -18), new BABYLON.Vector3(22, 0, 32),
      new BABYLON.Vector3(-22, 0, 38), new BABYLON.Vector3(42, 0, -8),
      new BABYLON.Vector3(-42, 0, 5), new BABYLON.Vector3(10, 0, -38),
      new BABYLON.Vector3(-10, 0, -42), new BABYLON.Vector3(15, 0, 38),
      new BABYLON.Vector3(-15, 0, 42), new BABYLON.Vector3(20, 0, -12),
      new BABYLON.Vector3(-20, 0, 12), new BABYLON.Vector3(28, 0, -28),
      new BABYLON.Vector3(-28, 0, 22), new BABYLON.Vector3(35, 0, 18),
      new BABYLON.Vector3(-35, 0, -25), new BABYLON.Vector3(8, 0, 28),
      new BABYLON.Vector3(-8, 0, -32), new BABYLON.Vector3(45, 0, 5),
      new BABYLON.Vector3(-45, 0, -8), new BABYLON.Vector3(3, 0, 12),
      new BABYLON.Vector3(-3, 0, -10), new BABYLON.Vector3(48, 0, -15),
      new BABYLON.Vector3(-48, 0, 15), new BABYLON.Vector3(18, 0, -45),
      new BABYLON.Vector3(-18, 0, 45), new BABYLON.Vector3(52, 0, 0),
      new BABYLON.Vector3(-52, 0, -5), new BABYLON.Vector3(0, 0, 50),
      new BABYLON.Vector3(30, 0, -35), new BABYLON.Vector3(-30, 0, 35),
      new BABYLON.Vector3(40, 0, 25), new BABYLON.Vector3(-40, 0, -30),
      new BABYLON.Vector3(50, 0, -20),
    ],
  },
  {
    id: 9,
    name: 'Crystal Caverns',
    enemyCount: 50,
    bossType: 'crystalGolem',
    spawnPositions: [
      new BABYLON.Vector3(5, 0, -5), new BABYLON.Vector3(-5, 0, 5),
      new BABYLON.Vector3(15, 0, -15), new BABYLON.Vector3(-15, 0, 15),
      new BABYLON.Vector3(25, 0, 0), new BABYLON.Vector3(-25, 0, -10),
      new BABYLON.Vector3(0, 0, -30), new BABYLON.Vector3(10, 0, 20),
      new BABYLON.Vector3(-10, 0, -25), new BABYLON.Vector3(30, 0, 10),
      new BABYLON.Vector3(-30, 0, 25), new BABYLON.Vector3(35, 0, -20),
      new BABYLON.Vector3(-35, 0, -15), new BABYLON.Vector3(20, 0, 30),
      new BABYLON.Vector3(-20, 0, 35), new BABYLON.Vector3(40, 0, -5),
      new BABYLON.Vector3(-40, 0, 0), new BABYLON.Vector3(8, 0, -35),
      new BABYLON.Vector3(-8, 0, -40), new BABYLON.Vector3(12, 0, 35),
      new BABYLON.Vector3(-12, 0, 40), new BABYLON.Vector3(18, 0, -10),
      new BABYLON.Vector3(-18, 0, 10), new BABYLON.Vector3(22, 0, -25),
      new BABYLON.Vector3(-22, 0, 20), new BABYLON.Vector3(28, 0, 15),
      new BABYLON.Vector3(-28, 0, -20), new BABYLON.Vector3(32, 0, 5),
      new BABYLON.Vector3(-32, 0, -30), new BABYLON.Vector3(38, 0, 25),
      new BABYLON.Vector3(-38, 0, -35), new BABYLON.Vector3(3, 0, 10),
      new BABYLON.Vector3(-3, 0, -8), new BABYLON.Vector3(45, 0, 0),
      new BABYLON.Vector3(-45, 0, -5), new BABYLON.Vector3(50, 0, 10),
      new BABYLON.Vector3(-50, 0, -10), new BABYLON.Vector3(7, 0, 45),
      new BABYLON.Vector3(-7, 0, -45), new BABYLON.Vector3(42, 0, -30),
      new BABYLON.Vector3(-42, 0, 30), new BABYLON.Vector3(48, 0, 20),
      new BABYLON.Vector3(-48, 0, -20), new BABYLON.Vector3(55, 0, -5),
      new BABYLON.Vector3(-55, 0, 5), new BABYLON.Vector3(15, 0, -50),
      new BABYLON.Vector3(-15, 0, 50), new BABYLON.Vector3(35, 0, 40),
      new BABYLON.Vector3(-35, 0, -40), new BABYLON.Vector3(0, 0, -55),
    ],
  },
  {
    id: 10,
    name: 'The Void',
    enemyCount: 55,
    bossType: 'voidEmperor',
    spawnPositions: [
      new BABYLON.Vector3(5, 0, -5), new BABYLON.Vector3(-5, 0, 5),
      new BABYLON.Vector3(15, 0, -15), new BABYLON.Vector3(-15, 0, 15),
      new BABYLON.Vector3(25, 0, 0), new BABYLON.Vector3(-25, 0, -10),
      new BABYLON.Vector3(0, 0, -30), new BABYLON.Vector3(10, 0, 20),
      new BABYLON.Vector3(-10, 0, -25), new BABYLON.Vector3(30, 0, 10),
      new BABYLON.Vector3(-30, 0, 25), new BABYLON.Vector3(35, 0, -20),
      new BABYLON.Vector3(-35, 0, -15), new BABYLON.Vector3(20, 0, 30),
      new BABYLON.Vector3(-20, 0, 35), new BABYLON.Vector3(40, 0, -5),
      new BABYLON.Vector3(-40, 0, 0), new BABYLON.Vector3(8, 0, -35),
      new BABYLON.Vector3(-8, 0, -40), new BABYLON.Vector3(12, 0, 35),
      new BABYLON.Vector3(-12, 0, 40), new BABYLON.Vector3(18, 0, -10),
      new BABYLON.Vector3(-18, 0, 10), new BABYLON.Vector3(22, 0, -25),
      new BABYLON.Vector3(-22, 0, 20), new BABYLON.Vector3(28, 0, 15),
      new BABYLON.Vector3(-28, 0, -20), new BABYLON.Vector3(32, 0, 5),
      new BABYLON.Vector3(-32, 0, -30), new BABYLON.Vector3(38, 0, 25),
      new BABYLON.Vector3(-38, 0, -35), new BABYLON.Vector3(3, 0, 10),
      new BABYLON.Vector3(-3, 0, -8), new BABYLON.Vector3(45, 0, 0),
      new BABYLON.Vector3(-45, 0, -5), new BABYLON.Vector3(50, 0, 10),
      new BABYLON.Vector3(-50, 0, -10), new BABYLON.Vector3(7, 0, 45),
      new BABYLON.Vector3(-7, 0, -45), new BABYLON.Vector3(42, 0, -30),
      new BABYLON.Vector3(-42, 0, 30), new BABYLON.Vector3(48, 0, 20),
      new BABYLON.Vector3(-48, 0, -20), new BABYLON.Vector3(55, 0, -5),
      new BABYLON.Vector3(-55, 0, 5), new BABYLON.Vector3(15, 0, -50),
      new BABYLON.Vector3(-15, 0, 50), new BABYLON.Vector3(35, 0, 40),
      new BABYLON.Vector3(-35, 0, -40), new BABYLON.Vector3(0, 0, -55),
      new BABYLON.Vector3(60, 0, 0), new BABYLON.Vector3(-60, 0, 0),
      new BABYLON.Vector3(0, 0, 60), new BABYLON.Vector3(0, 0, -60),
      new BABYLON.Vector3(52, 0, -25), new BABYLON.Vector3(-52, 0, 25),
      new BABYLON.Vector3(25, 0, -52),
    ],
  },
];

export { LEVEL_CONFIGS };

export class EnemyManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.enemies = [];
    this.killCount = 0;
    this.activeBoss = null;
    this.bossDefeated = false;
    this.currentLevel = 0;
  }

  startLevel(levelIndex) {
    this.currentLevel = levelIndex;
    this.killCount = 0;
    this.bossDefeated = false;
    this.activeBoss = null;
    this._alertShown = false;

    // Clear any remaining enemies
    this.enemies.forEach(e => {
      if (e.mesh) {
        e.mesh.getChildMeshes().forEach(c => {
          if (c.material) c.material.dispose();
          c.dispose();
        });
        if (e.mesh.physicsImpostor) e.mesh.physicsImpostor.dispose();
        e.mesh.dispose();
      }
    });
    this.enemies = [];

    // Spawn enemies for this level
    const config = LEVEL_CONFIGS[levelIndex];
    if (!config) return;

    const positions = config.spawnPositions;
    for (let i = 0; i < config.enemyCount; i++) {
      const pos = positions[i % positions.length].clone();
      // Add some randomness so overlapping positions spread out
      if (i >= positions.length) {
        pos.x += (Math.random() - 0.5) * 10;
        pos.z += (Math.random() - 0.5) * 10;
      }
      this.spawnEnemy(pos);
    }
  }

  getLevelConfig() {
    return LEVEL_CONFIGS[this.currentLevel] || null;
  }

  getTotalLevels() {
    return LEVEL_CONFIGS.length;
  }

  spawnEnemy(position) {
    const enemy = new Enemy(this.scene, position, this.player);
    this.enemies.push(enemy);
    return enemy;
  }

  spawnBoss(game) {
    const config = LEVEL_CONFIGS[this.currentLevel];
    if (!config || this.activeBoss) return;

    const playerPos = this.player.mesh.position;
    const spawnPos = new BABYLON.Vector3(playerPos.x + 15, 0, playerPos.z + 15);
    this.activeBoss = new Boss(this.scene, spawnPos, this.player, config.bossType);

    if (game) {
      game.hud.showMessage(`${BOSS_CONFIGS[config.bossType].name} has appeared!`);
      game.soundManager.startBossMusic();
    }
  }

  isLevelComplete() {
    return this.getAliveEnemies().length === 0 && this.bossDefeated;
  }

  update(deltaTime, game) {
    // Update all enemies
    this.enemies.forEach(enemy => {
      if (!enemy.dead) {
        enemy.update(deltaTime, game);
      }
    });

    // Remove dead enemies — award score, track kills, drop loot
    this.enemies.forEach(enemy => {
      if (enemy.dead && !enemy.scored && game) {
        const rm = game.state.rewardMultiplier || 1;
        game.state.score += Math.round(100 * rm);
        game.state.totalCoins += Math.round(5 * rm);
        localStorage.setItem('totalCoins', game.state.totalCoins.toString());
        this.killCount++;
        game.addKill();
        enemy.scored = true;
        if (game.pickupManager && enemy.deathPosition) {
          game.pickupManager.spawnLoot(enemy.deathPosition);
        }
      }
    });
    this.enemies = this.enemies.filter(enemy => !enemy.dead);

    // Alert remaining enemies when only 3 or fewer are left
    const alive = this.getAliveEnemies();
    if (alive.length > 0 && alive.length <= 3) {
      alive.forEach(e => { e.alerted = true; });
      if (game && !this._alertShown) {
        this._alertShown = true;
        game.hud.showMessage('Remaining enemies are hunting you!');
      }
    }

    // Spawn boss when all regular enemies are dead
    if (this.getAliveEnemies().length === 0 && !this.activeBoss && !this.bossDefeated) {
      this.spawnBoss(game);
    }

    // Update boss
    if (this.activeBoss) {
      if (this.activeBoss.dead) {
        if (!this.activeBoss.scored && game) {
          const rm = game.state.rewardMultiplier || 1;
          game.state.score += Math.round(1000 * rm);
          game.state.totalCoins += Math.round(25 * rm);
          localStorage.setItem('totalCoins', game.state.totalCoins.toString());
          game.hud.showMessage(`${this.activeBoss.config.name} defeated! +1000 score`);
          // Drop extra loot
          if (game.pickupManager && this.activeBoss.deathPosition) {
            game.pickupManager.spawnLoot(this.activeBoss.deathPosition);
            game.pickupManager.spawnLoot(this.activeBoss.deathPosition);
            game.pickupManager.spawn(this.activeBoss.deathPosition.add(new BABYLON.Vector3(2, 0, 0)), 'potion');
            game.pickupManager.spawn(this.activeBoss.deathPosition.add(new BABYLON.Vector3(-2, 0, 0)), 'potion');
            game.pickupManager.spawn(this.activeBoss.deathPosition.add(new BABYLON.Vector3(0, 0, 2)), 'potion');
          }
          this.activeBoss.scored = true;
          game.soundManager.stopBossMusic(this.currentLevel);
        }
        this.bossDefeated = true;
        this.activeBoss = null;
      } else {
        this.activeBoss.update(deltaTime, game);
      }
    }
  }

  clearAll() {
    this.enemies.forEach(e => {
      if (e.mesh) {
        e.mesh.getChildMeshes().forEach(c => {
          if (c.material) c.material.dispose();
          c.dispose();
        });
        if (e.mesh.physicsImpostor) e.mesh.physicsImpostor.dispose();
        e.mesh.dispose();
      }
    });
    this.enemies = [];
    if (this.activeBoss) {
      if (this.activeBoss.mesh) this.activeBoss.mesh.dispose();
      this.activeBoss = null;
    }
    this.bossDefeated = true; // Prevent boss from respawning
  }

  getAliveEnemies() {
    return this.enemies.filter(e => !e.dead);
  }

  getActiveBoss() {
    return this.activeBoss;
  }
}
