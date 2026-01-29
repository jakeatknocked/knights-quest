import * as BABYLON from '@babylonjs/core';

export class InputManager {
  constructor(scene, canvas) {
    this.scene = scene;
    this.canvas = canvas;

    this.keys = {};
    this.jumpPressed = false;

    this.setupKeyboard();
    this.setupMouse();
  }
  
  setupKeyboard() {
    // Use window event listeners for more reliable keyboard input
    window.addEventListener('keydown', (evt) => {
      this.keys[evt.key.toLowerCase()] = true;

      if (evt.key === ' ') {
        evt.preventDefault(); // Prevent page scroll
        this.jumpPressed = true;
      }
    });

    window.addEventListener('keyup', (evt) => {
      this.keys[evt.key.toLowerCase()] = false;

      if (evt.key === ' ') {
        this.jumpPressed = false;
      }
    });
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

  setupMouse() {
    // Mouse buttons
    this.canvas.addEventListener('mousedown', (evt) => {
      if (evt.button === 0) {
        this.keys['mouseLeft'] = true;
      } else if (evt.button === 2) {
        this.keys['mouseRight'] = true;
      }
    });

    this.canvas.addEventListener('mouseup', (evt) => {
      if (evt.button === 0) {
        this.keys['mouseLeft'] = false;
      } else if (evt.button === 2) {
        this.keys['mouseRight'] = false;
      }
    });

    // Prevent context menu
    this.canvas.addEventListener('contextmenu', (evt) => {
      evt.preventDefault();
    });
  }
}
