import * as BABYLON from '@babylonjs/core';
import { Pickup } from '../entities/Pickup.js';

export class PickupManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.pickups = [];

    // Track which elements have been unlocked via chests
    this.unlockedElements = JSON.parse(localStorage.getItem('unlockedElements') || '{}');

    // Timer to spawn ammo for unlocked elements
    this.ammoSpawnTimer = 0;

    this.spawnWorldPickups();
  }

  spawnWorldPickups(levelIndex) {
    // Clear existing pickups
    this.pickups.forEach(p => p.collect());
    this.pickups = [];

    const level = levelIndex || 0;

    // Health potions (4-5 per level, spread across bigger maps)
    for (let i = 0; i < 4 + Math.floor(Math.random() * 2); i++) {
      const x = -60 + Math.random() * 120;
      const z = -60 + Math.random() * 120;
      this.spawn(new BABYLON.Vector3(x, 0, z), 'potion');
    }

    // Spawn ammo pickups for already-unlocked elements
    const unlocked = Object.keys(this.unlockedElements);
    for (let i = 0; i < unlocked.length * 4; i++) {
      const element = unlocked[i % unlocked.length];
      const x = -70 + Math.random() * 140;
      const z = -70 + Math.random() * 140;
      this.spawn(new BABYLON.Vector3(x, 0, z), 'ammo', element);
    }

    // ELEMENTAL PISTOL CHESTS — 3 per level (fire, ice, lightning)
    const pistolTypes = ['fire', 'ice', 'lightning'];
    const chestPositions = [
      // Each level gets 3 chest spawn areas (spread across bigger maps)
      [[-40, 25], [45, -35], [0, -55]],        // Level 0: Castle
      [[-50, 45], [55, -30], [-20, -50]],       // Level 1: Forest
      [[-25, -30], [25, 20], [0, -50]],         // Level 2: Sky
      [[-45, -30], [50, 35], [20, -50]],        // Level 3: Lava
      [[30, -45], [-35, 35], [-55, -15]],       // Level 4: Ice
      [[-30, -35], [35, 30], [0, 45]],          // Level 5: Shadow
      [[-40, -20], [40, 25], [0, -50]],         // Level 6: Storm
      [[-35, 30], [40, -35], [-50, -20]],       // Level 7: Swamp
      [[-45, 35], [35, -40], [50, 15]],         // Level 8: Crystal
      [[-25, 20], [25, -20], [0, 35]],          // Level 9: Void
    ];

    const positions = chestPositions[level] || chestPositions[0];
    // One chest per element type
    positions.forEach(([x, z], i) => {
      const element = pistolTypes[i % pistolTypes.length];
      this.spawn(new BABYLON.Vector3(x, 0, z), 'weaponChest', element);
    });

    // BONUS LOOT CHESTS — 2-4 random loot chests per level
    const lootChestTypes = ['goldChest', 'supplyChest', 'megaChest'];
    const lootChestCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < lootChestCount; i++) {
      const type = lootChestTypes[Math.floor(Math.random() * lootChestTypes.length)];
      const x = -60 + Math.random() * 120;
      const z = -60 + Math.random() * 120;
      this.spawn(new BABYLON.Vector3(x, 0, z), type);
    }

    // HOUSE CHESTS — each house has a 60% chance to contain a chest inside
    const housePositions = this._getHousePositions(level);
    housePositions.forEach(([hx, hz]) => {
      if (Math.random() < 0.6) {
        // Spawn chest inside house (offset slightly from center)
        const cx = hx + (Math.random() - 0.5) * 4;
        const cz = hz + (Math.random() - 0.5) * 4;
        // Pick a random chest type (weighted: 40% supply, 35% gold, 15% weapon, 10% mega)
        const roll = Math.random();
        let type, subType;
        if (roll < 0.4) {
          type = 'supplyChest';
        } else if (roll < 0.75) {
          type = 'goldChest';
        } else if (roll < 0.9) {
          type = 'weaponChest';
          subType = pistolTypes[Math.floor(Math.random() * pistolTypes.length)];
        } else {
          type = 'megaChest';
        }
        this.spawn(new BABYLON.Vector3(cx, 0, cz), type, subType);
      }
    });
  }

  _getHousePositions(level) {
    // House positions per level (matching World.js _createHouse calls)
    const houses = {
      0: [[20, 20], [-20, 20], [30, -30], [-25, -35]],       // Castle
      1: [[-40, -40], [40, 40], [-35, 35]],                    // Forest
      3: [[30, 30], [-35, 25], [40, -40]],                     // Lava
      4: [[-35, -35], [35, 30], [-30, 35]],                    // Frozen
      5: [[-35, -30], [35, 25]],                                // Shadow
      7: [[35, 35], [-40, -30], [30, -35]],                     // Swamp
      8: [[-35, 25], [30, -30]],                                // Crystal
    };
    return houses[level] || [];
  }

  // Called when a chest is opened — unlock that element so ammo spawns for it
  unlockElement(element) {
    if (this.unlockedElements[element]) return;
    this.unlockedElements[element] = true;
    localStorage.setItem('unlockedElements', JSON.stringify(this.unlockedElements));

    // Immediately spawn some ammo pickups for the newly unlocked element
    for (let i = 0; i < 4; i++) {
      const x = -50 + Math.random() * 100;
      const z = -50 + Math.random() * 100;
      this.spawn(new BABYLON.Vector3(x, 0, z), 'ammo', element);
    }
  }

  spawn(position, type, subType) {
    const pickup = new Pickup(this.scene, position, type, subType);
    this.pickups.push(pickup);
    return pickup;
  }

  spawnLoot(position) {
    // Drop 1-3 coins around enemy death position
    const coinCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < coinCount; i++) {
      const coinPos = new BABYLON.Vector3(
        position.x + (Math.random() - 0.5) * 3,
        position.y,
        position.z + (Math.random() - 0.5) * 3
      );
      this.spawn(coinPos, 'coin');
    }

    // Also drop ammo for unlocked elements sometimes
    const unlocked = Object.keys(this.unlockedElements);
    if (unlocked.length > 0 && Math.random() < 0.3) {
      const element = unlocked[Math.floor(Math.random() * unlocked.length)];
      const ammoPos = new BABYLON.Vector3(
        position.x + (Math.random() - 0.5) * 3,
        position.y,
        position.z + (Math.random() - 0.5) * 3
      );
      this.spawn(ammoPos, 'ammo', element);
    }
  }

  update(deltaTime, game, inputManager) {
    if (!this.player || !this.player.mesh) return;
    const playerPos = this.player.mesh.position;

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pickup = this.pickups[i];
      if (pickup.collected) {
        this.pickups.splice(i, 1);
        continue;
      }

      pickup.update(deltaTime);

      // Check proximity for collection
      if (!pickup.mesh) continue;
      const dist = BABYLON.Vector3.Distance(playerPos, pickup.mesh.position);

      if (pickup.needsInteract) {
        // Weapon chests need E key to open
        if (dist < 3.0) {
          if (!pickup._promptShown) {
            game.hud.showMessage('Press E to open chest!');
            pickup._promptShown = true;
          }
          if (inputManager && inputManager.isKeyDown('e')) {
            this.collectPickup(pickup, game);
            pickup._promptShown = false;
          }
        } else {
          pickup._promptShown = false;
        }
      } else {
        const collectRange = pickup.type === 'ammo' ? 2.5 : 2.0;
        if (dist < collectRange) {
          this.collectPickup(pickup, game);
        }
      }
    }
  }

  collectPickup(pickup, game) {
    if (pickup.type === 'coin') {
      game.state.totalCoins++;
      localStorage.setItem('totalCoins', game.state.totalCoins.toString());
      game.state.score += 10;
      if (game.achievements) {
        const coins = game.state.totalCoins;
        if (coins >= 100) game.achievements.unlock('coins_100', game.hud);
        if (coins >= 500) game.achievements.unlock('coins_500', game.hud);
      }
    } else if (pickup.type === 'potion') {
      game.state.health = Math.min(game.state.maxHealth, game.state.health + 35);
      game.hud.showMessage('Health restored! +35 HP');
      if (game.state.health >= game.state.maxHealth && game.achievements) {
        game.achievements.unlock('full_health', game.hud);
      }
    } else if (pickup.type === 'ammo') {
      game.state.ammo[pickup.subType] += 10;
      game.hud.showMessage(`+10 ${pickup.subType} ammo`);
    } else if (pickup.type === 'weaponChest') {
      const elementNames = {
        fire: 'Fire Pistol', ice: 'Ice Pistol', lightning: 'Lightning Pistol'
      };
      const element = pickup.subType;
      game.state.ammo[element] = (game.state.ammo[element] || 0) + 15;
      game.state.selectedElement = element;
      this.unlockElement(element);
      game.hud.showMessage(`Got ${elementNames[element]}! +15 ${element} ammo`);
      if (game.achievements) {
        game.achievements.unlock('first_chest', game.hud);
        // Element unlock achievements
        game.achievements.unlock('unlock_' + element, game.hud);
        const allElements = Object.keys(this.unlockedElements);
        if (allElements.includes('fire') && allElements.includes('ice') && allElements.includes('lightning')) {
          game.achievements.unlock('unlock_all', game.hud);
        }
      }

    } else if (pickup.type === 'goldChest') {
      const coinBonus = 25 + Math.floor(Math.random() * 26);
      game.state.totalCoins += coinBonus;
      localStorage.setItem('totalCoins', game.state.totalCoins.toString());
      game.state.score += coinBonus * 5;
      game.hud.showMessage(`Gold Chest! +${coinBonus} coins & +${coinBonus * 5} score!`);
      if (game.achievements) {
        game.achievements.unlock('first_chest', game.hud);
        game.achievements.unlock('gold_chest', game.hud);
        if (game.state.totalCoins >= 100) game.achievements.unlock('coins_100', game.hud);
        if (game.state.totalCoins >= 500) game.achievements.unlock('coins_500', game.hud);
        if (game.state.totalCoins >= 1000) game.achievements.unlock('coins_1000', game.hud);
        if (game.state.totalCoins >= 2500) game.achievements.unlock('coins_2500', game.hud);
      }

    } else if (pickup.type === 'supplyChest') {
      const healAmount = 40 + Math.floor(Math.random() * 21);
      game.state.health = Math.min(game.state.maxHealth, game.state.health + healAmount);
      const unlocked = Object.keys(this.unlockedElements);
      let ammoMsg = '';
      if (unlocked.length > 0) {
        unlocked.forEach(el => {
          game.state.ammo[el] = (game.state.ammo[el] || 0) + 8;
        });
        ammoMsg = ` +8 ammo each!`;
      }
      game.hud.showMessage(`Supply Crate! +${healAmount} HP${ammoMsg}`);
      if (game.state.health >= game.state.maxHealth && game.achievements) {
        game.achievements.unlock('full_health', game.hud);
      }
      if (game.achievements) game.achievements.unlock('first_chest', game.hud);

    } else if (pickup.type === 'megaChest') {
      const coinBonus = 40 + Math.floor(Math.random() * 31);
      game.state.totalCoins += coinBonus;
      localStorage.setItem('totalCoins', game.state.totalCoins.toString());
      game.state.score += 500;
      game.state.health = game.state.maxHealth;
      ['fire', 'ice', 'lightning'].forEach(el => {
        game.state.ammo[el] = (game.state.ammo[el] || 0) + 15;
      });
      game.hud.showMessage(`MEGA CHEST! +${coinBonus} coins, full heal, +15 all ammo, +500 score!`);
      if (game.achievements) {
        game.achievements.unlock('first_chest', game.hud);
        game.achievements.unlock('mega_chest', game.hud);
        game.achievements.unlock('full_health', game.hud);
        if (game.state.totalCoins >= 100) game.achievements.unlock('coins_100', game.hud);
        if (game.state.totalCoins >= 500) game.achievements.unlock('coins_500', game.hud);
        if (game.state.totalCoins >= 1000) game.achievements.unlock('coins_1000', game.hud);
        if (game.state.totalCoins >= 2500) game.achievements.unlock('coins_2500', game.hud);
      }
    }

    // Track chest opening count for achievements
    if (['weaponChest', 'goldChest', 'supplyChest', 'megaChest'].includes(pickup.type) && game.achievements) {
      game.chestsOpened = (game.chestsOpened || 0) + 1;
      localStorage.setItem('chestsOpened', game.chestsOpened.toString());
      if (game.chestsOpened >= 5) game.achievements.unlock('chests_5', game.hud);
      if (game.chestsOpened >= 15) game.achievements.unlock('chests_15', game.hud);
    }

    pickup.collect();
    game.hud.update();
  }
}
