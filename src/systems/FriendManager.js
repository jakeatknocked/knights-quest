import * as BABYLON from '@babylonjs/core';
import { Friend } from '../entities/Friend.js';

export class FriendManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.friends = [];

    this.spawnFriends();
  }

  spawnFriends() {
    const friendData = [
      { pos: new BABYLON.Vector3(15, 0, -35), name: 'Sir Lancelot' },
      { pos: new BABYLON.Vector3(-20, 0, 10), name: 'Lady Elara' },
      { pos: new BABYLON.Vector3(65, 0, -5), name: 'Wizard Merlin' },
      { pos: new BABYLON.Vector3(75, 0, 20), name: 'Archer Robin' },
      { pos: new BABYLON.Vector3(-5, 0, -80), name: 'Dwarf Gimli' },
      { pos: new BABYLON.Vector3(10, 0, -95), name: 'Healer Aria' },
    ];

    friendData.forEach(data => {
      this.friends.push(new Friend(this.scene, data.pos, this.player, data.name));
    });
  }

  update(deltaTime, game) {
    this.friends.forEach(friend => {
      // Check rescue proximity
      if (!friend.rescued) {
        const dist = BABYLON.Vector3.Distance(
          this.player.mesh.position,
          friend.mesh.position
        );
        if (dist < 3 && game.inputManager.isKeyDown('e')) {
          friend.rescue(game);
        }
      }

      // Update following friends
      if (friend.following) {
        friend.update(deltaTime, game.enemyManager);
      }
    });
  }

  getRescuedCount() {
    return this.friends.filter(f => f.rescued).length;
  }
}
