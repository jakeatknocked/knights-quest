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
      // Don't capture keys when typing in input fields (chat, admin panel, etc.)
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (!evt.key) return;
      this.keys[evt.key.toLowerCase()] = true;

      if (evt.key === ' ') {
        evt.preventDefault(); // Prevent page scroll
        this.jumpPressed = true;
      }
    });

    window.addEventListener('keyup', (evt) => {
      if (!evt.key) return;
      this.keys[evt.key.toLowerCase()] = false;

      if (evt.key === ' ') {
        this.jumpPressed = false;
      }
    });

    // Clear all keys when window loses focus
    window.addEventListener('blur', () => {
      this.keys = {};
      this.jumpPressed = false;
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
    // Mouse buttons — only register when pointer is locked (in-game)
    // This prevents UI button clicks from triggering combat
    document.addEventListener('mousedown', (evt) => {
      if (document.pointerLockElement !== this.canvas) return;
      if (evt.button === 0) {
        this.keys['mouseleft'] = true;
      } else if (evt.button === 2) {
        this.keys['mouseright'] = true;
      }
    });

    document.addEventListener('mouseup', (evt) => {
      if (evt.button === 0) {
        this.keys['mouseleft'] = false;
      } else if (evt.button === 2) {
        this.keys['mouseright'] = false;
      }
    });

    // Clear ALL input state when pointer lock changes
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement !== this.canvas) {
        this.keys = {};
        this.jumpPressed = false;
      }
    });

    // Prevent context menu
    this.canvas.addEventListener('contextmenu', (evt) => {
      evt.preventDefault();
    });
    document.addEventListener('contextmenu', (evt) => {
      if (document.pointerLockElement === this.canvas) {
        evt.preventDefault();
      }
    });
  }
}
