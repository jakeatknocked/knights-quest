import { Enemy } from '../entities/Enemy.js';
import * as BABYLON from '@babylonjs/core';

export class EnemyManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.enemies = [];

    this.spawnInitialEnemies();
  }

  spawnInitialEnemies() {
    const positions = [
      new BABYLON.Vector3(8, 0, -25),
      new BABYLON.Vector3(-8, 0, -25),
      new BABYLON.Vector3(0, 0, -40),
      new BABYLON.Vector3(12, 0, 10),
      new BABYLON.Vector3(-12, 0, 8),
      new BABYLON.Vector3(20, 0, 5),
      new BABYLON.Vector3(-15, 0, -10),
      new BABYLON.Vector3(15, 0, 15),
    ];

    positions.forEach(pos => {
      this.spawnEnemy(pos);
    });
  }

  spawnEnemy(position) {
    const enemy = new Enemy(this.scene, position, this.player);
    this.enemies.push(enemy);
    return enemy;
  }

  update(deltaTime) {
    // Update all enemies
    this.enemies.forEach(enemy => {
      if (!enemy.dead) {
        enemy.update(deltaTime);
      }
    });

    // Remove dead enemies
    this.enemies = this.enemies.filter(enemy => !enemy.dead);
  }

  getAliveEnemies() {
    return this.enemies.filter(e => !e.dead);
  }
}
