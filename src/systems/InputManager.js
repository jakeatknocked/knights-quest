import * as BABYLON from '@babylonjs/core';

export class InputManager {
  constructor(scene, canvas) {
    this.scene = scene;
    this.canvas = canvas;
    
    this.keys = {};
    this.jumpPressed = false;
    
    this.setupKeyboard();
  }
  
  setupKeyboard() {
    this.scene.actionManager = new BABYLON.ActionManager(this.scene);
    
    // Key down
    this.scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnKeyDownTrigger,
        (evt) => {
          this.keys[evt.sourceEvent.key.toLowerCase()] = true;
          
          if (evt.sourceEvent.key === ' ') {
            this.jumpPressed = true;
          }
        }
      )
    );
    
    // Key up
    this.scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnKeyUpTrigger,
        (evt) => {
          this.keys[evt.sourceEvent.key.toLowerCase()] = false;
          
          if (evt.sourceEvent.key === ' ') {
            this.jumpPressed = false;
          }
        }
      )
    );
  }
  
  getMovementVector() {
    const movement = new BABYLON.Vector3(0, 0, 0);
    
    if (this.keys['w']) movement.z += 1;
    if (this.keys['s']) movement.z -= 1;
    if (this.keys['a']) movement.x -= 1;
    if (this.keys['d']) movement.x += 1;
    
    if (movement.length() > 0) {
      movement.normalize();
    }
    
    return movement;
  }
  
  isJumpPressed() {
    const jump = this.jumpPressed;
    this.jumpPressed = false; // One-time trigger
    return jump;
  }
  
  isKeyDown(key) {
    return this.keys[key.toLowerCase()] || false;
  }
}
