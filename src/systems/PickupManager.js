import * as BABYLON from '@babylonjs/core';
import { Pickup } from '../entities/Pickup.js';

export class PickupManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.pickups = [];

    this.spawnWorldPickups();
  }

  spawnWorldPickups() {
    // Ammo pickups scattered around zones
    // Castle area
    this.spawn(new BABYLON.Vector3(5, 0, -10), 'ammo', 'fire');
    this.spawn(new BABYLON.Vector3(-5, 0, -15), 'ammo', 'ice');
    this.spawn(new BABYLON.Vector3(10, 0, -30), 'ammo', 'lightning');
    this.spawn(new BABYLON.Vector3(-10, 0, 5), 'ammo', 'fire');

    // Forest zone
    this.spawn(new BABYLON.Vector3(55, 0, 5), 'ammo', 'fire');
    this.spawn(new BABYLON.Vector3(65, 0, -10), 'ammo', 'ice');
    this.spawn(new BABYLON.Vector3(75, 0, 10), 'ammo', 'lightning');
    this.spawn(new BABYLON.Vector3(85, 0, -5), 'ammo', 'fire');

    // Floating islands zone
    this.spawn(new BABYLON.Vector3(0, 0, -65), 'ammo', 'ice');
    this.spawn(new BABYLON.Vector3(-10, 0, -75), 'ammo', 'lightning');
    this.spawn(new BABYLON.Vector3(10, 0, -85), 'ammo', 'fire');

    // Health potions at key locations
    this.spawn(new BABYLON.Vector3(0, 0, -20), 'potion');
    this.spawn(new BABYLON.Vector3(60, 0, 0), 'potion');
    this.spawn(new BABYLON.Vector3(-5, 0, -75), 'potion');
    this.spawn(new BABYLON.Vector3(15, 0, 20), 'potion');
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
  }

  update(deltaTime, game) {
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
      const collectRange = pickup.type === 'ammo' ? 2.5 : 2.0;

      if (dist < collectRange) {
        this.collectPickup(pickup, game);
      }
    }
  }

  collectPickup(pickup, game) {
    if (pickup.type === 'coin') {
      game.state.totalCoins++;
      localStorage.setItem('totalCoins', game.state.totalCoins.toString());
      game.state.score += 10;
    } else if (pickup.type === 'potion') {
      game.state.health = Math.min(game.state.maxHealth, game.state.health + 35);
      game.hud.showMessage('Health restored! +35 HP');
    } else if (pickup.type === 'ammo') {
      game.state.ammo[pickup.subType] += 10;
      game.hud.showMessage(`+10 ${pickup.subType} ammo`);
    }

    pickup.collect();
    game.hud.update();
  }
}
