import * as BABYLON from '@babylonjs/core';
import { Chest } from '../entities/Chest.js';

export class ChestManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.chests = [];
  }

  spawnChestsForLevel(levelIndex) {
    // Clear existing chests
    this.clearChests();

    // Define chest spawn positions and contents for each level
    const chestData = this.getChestDataForLevel(levelIndex);

    chestData.forEach(data => {
      const chest = new Chest(
        this.scene,
        data.position,
        data.contentType,
        data.amount
      );
      this.chests.push(chest);
    });
  }

  getChestDataForLevel(levelIndex) {
    // Each level has 5-8 chests with different contents
    // Positions are strategically placed around the level
    const chestConfigs = [
      // Level 1: Castle Siege
      [
        { position: { x: -15, y: 0.6, z: -25 }, contentType: 'fire', amount: 10 },
        { position: { x: 20, y: 0.6, z: 12 }, contentType: 'basic', amount: 15 },
        { position: { x: -8, y: 0.6, z: 25 }, contentType: 'ice', amount: 8 },
        { position: { x: 15, y: 0.6, z: -10 }, contentType: 'coins', amount: 5 },
        { position: { x: -20, y: 0.6, z: 5 }, contentType: 'lightning', amount: 6 },
        { position: { x: 8, y: 0.6, z: -18 }, contentType: 'basic', amount: 10 },
      ],
      // Level 2: Forest Hunt
      [
        { position: { x: -30, y: 0.6, z: -30 }, contentType: 'ice', amount: 10 },
        { position: { x: 35, y: 0.6, z: 20 }, contentType: 'fire', amount: 12 },
        { position: { x: -15, y: 0.6, z: 35 }, contentType: 'basic', amount: 20 },
        { position: { x: 25, y: 0.6, z: -25 }, contentType: 'lightning', amount: 8 },
        { position: { x: 0, y: 0.6, z: 45 }, contentType: 'coins', amount: 8 },
        { position: { x: 40, y: 0.6, z: -10 }, contentType: 'fire', amount: 8 },
        { position: { x: -25, y: 0.6, z: 0 }, contentType: 'basic', amount: 15 },
      ],
      // Level 3: Sky Battle
      [
        { position: { x: -25, y: 13, z: -20 }, contentType: 'lightning', amount: 12 },
        { position: { x: 25, y: 11, z: -15 }, contentType: 'ice', amount: 10 },
        { position: { x: 0, y: 17, z: -40 }, contentType: 'fire', amount: 15 },
        { position: { x: -30, y: 7, z: 20 }, contentType: 'basic', amount: 20 },
        { position: { x: 30, y: 15, z: 25 }, contentType: 'coins', amount: 10 },
        { position: { x: 0, y: 23, z: -60 }, contentType: 'lightning', amount: 10 },
      ],
      // More levels can be added here...
    ];

    // Return chest data for the level, or default if level not defined
    if (levelIndex < chestConfigs.length) {
      return chestConfigs[levelIndex].map(c => ({
        ...c,
        position: new BABYLON.Vector3(c.position.x, c.position.y, c.position.z)
      }));
    }

    // Default chest configuration for undefined levels
    return this.generateRandomChests(levelIndex);
  }

  generateRandomChests(levelIndex) {
    const chests = [];
    const chestCount = 6 + Math.floor(levelIndex * 0.5);

    const contentTypes = ['basic', 'fire', 'ice', 'lightning', 'coins'];
    const amounts = {
      basic: [15, 20, 25],
      fire: [8, 10, 12],
      ice: [8, 10, 12],
      lightning: [6, 8, 10],
      coins: [5, 8, 10, 15]
    };

    for (let i = 0; i < chestCount; i++) {
      const angle = (i / chestCount) * Math.PI * 2;
      const radius = 20 + Math.random() * 30;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
      const amountOptions = amounts[contentType];
      const amount = amountOptions[Math.floor(Math.random() * amountOptions.length)];

      chests.push({
        position: new BABYLON.Vector3(x, 0.6, z),
        contentType,
        amount
      });
    }

    return chests;
  }

  update(deltaTime, game) {
    this.chests.forEach(chest => {
      chest.update(deltaTime);

      // Check if player is near and can open chest
      if (chest.state === 'closed' && chest.isNearPlayer(this.player.mesh.position)) {
        // Show prompt to player
        game.hud.showMessage('Press E to open chest');
      }
    });
  }

  tryOpenNearbyChest(playerPosition) {
    for (const chest of this.chests) {
      if (chest.state === 'closed' && chest.isNearPlayer(playerPosition)) {
        if (chest.open()) {
          return true; // Successfully opened a chest
        }
      }
    }
    return false;
  }

  tryCollectNearbyChest(playerPosition) {
    for (const chest of this.chests) {
      if (chest.state === 'opened' && chest.isNearPlayer(playerPosition)) {
        const loot = chest.collect();
        if (loot) {
          return loot;
        }
      }
    }
    return null;
  }

  clearChests() {
    this.chests.forEach(chest => chest.dispose());
    this.chests = [];
  }

  dispose() {
    this.clearChests();
  }
}
