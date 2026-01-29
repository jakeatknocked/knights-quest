import * as BABYLON from '@babylonjs/core';
import * as CANNON from 'cannon-es';
import { Player } from './entities/Player.js';
import { World } from './world/World.js';
import { InputManager } from './systems/InputManager.js';
import { EnemyManager } from './systems/EnemyManager.js';
import { CombatSystem } from './systems/CombatSystem.js';

// Make CANNON available globally for Babylon.js
window.CANNON = CANNON;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;

    // Create Babylon.js engine
    this.engine = new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true
    });

    // Create scene
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.18, 1);

    // Enable physics
    try {
      this.scene.enablePhysics(
        new BABYLON.Vector3(0, -9.81, 0),
        new BABYLON.CannonJSPlugin(true, 10, CANNON)
      );
    } catch (error) {
      console.error('Physics error:', error);
    }
    
    // Game state
    this.state = {
      started: false,
      paused: false,
      health: 100,
      maxHealth: 100,
      coins: parseInt(localStorage.getItem('totalCoins') || '0'),
      ammo: { fire: 30, ice: 20, lightning: 15 },
      selectedElement: 'fire',
    };
    
    // Initialize systems
    this.inputManager = new InputManager(this.scene, canvas);
    
    // Create world
    this.world = new World(this.scene);
    
    // Create player
    this.player = new Player(this.scene, this.inputManager);

    // Create enemy manager
    this.enemyManager = new EnemyManager(this.scene, this.player);

    // Create combat system
    this.combatSystem = new CombatSystem(this.scene, this.player, this.enemyManager, this.state);

    // Setup camera to follow player
    this.setupCamera();
    
    // Setup lighting
    this.setupLighting();
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }
  
  setupCamera() {
    // Third-person follow camera
    this.camera = new BABYLON.ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 3,
      10,
      new BABYLON.Vector3(0, 1.5, 0),
      this.scene
    );

    this.camera.lowerRadiusLimit = 5;
    this.camera.upperRadiusLimit = 20;
    this.camera.lowerBetaLimit = 0.1;
    this.camera.upperBetaLimit = (Math.PI / 2) * 0.99;

    // Smooth camera movement
    this.camera.inertia = 0.9;
    this.camera.wheelPrecision = 20;

    // Follow player
    this.camera.lockedTarget = this.player.mesh;

    // Use pointer lock for camera orbit — frees mouse buttons for combat
    this.camera.attachControl(this.canvas, true);
    this.camera.inputs.attached.pointers.buttons = []; // Disable all click-to-orbit

    // Pointer lock: mouse movement controls camera without clicking
    this.canvas.addEventListener('click', () => {
      this.canvas.requestPointerLock();
    });

    const sensitivity = 0.003;
    document.addEventListener('mousemove', (evt) => {
      if (document.pointerLockElement === this.canvas) {
        this.camera.alpha -= evt.movementX * sensitivity;
        this.camera.beta -= evt.movementY * sensitivity;
        // Clamp beta to limits
        this.camera.beta = Math.max(this.camera.lowerBetaLimit, Math.min(this.camera.upperBetaLimit, this.camera.beta));
      }
    });

    // Scroll to zoom still works via attachControl
    this.canvas.addEventListener('wheel', (evt) => {
      if (document.pointerLockElement === this.canvas) {
        this.camera.radius += evt.deltaY * 0.01;
        this.camera.radius = Math.max(this.camera.lowerRadiusLimit, Math.min(this.camera.upperRadiusLimit, this.camera.radius));
      }
    });
  }
  
  setupLighting() {
    // Skybox
    const skybox = BABYLON.MeshBuilder.CreateBox('skyBox', { size: 1000.0 }, this.scene);
    const skyboxMaterial = new BABYLON.StandardMaterial('skyBox', this.scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;
    skybox.infiniteDistance = true;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.18);

    // Fog for depth
    this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
    this.scene.fogDensity = 0.005;
    this.scene.fogColor = new BABYLON.Color3(0.1, 0.1, 0.18);

    // Ambient light
    const ambientLight = new BABYLON.HemisphericLight(
      'ambient',
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    );
    ambientLight.intensity = 0.7;
    ambientLight.diffuse = new BABYLON.Color3(0.8, 0.8, 1);
    ambientLight.groundColor = new BABYLON.Color3(0.3, 0.3, 0.4);

    // Directional sunlight
    this.sunLight = new BABYLON.DirectionalLight(
      'sun',
      new BABYLON.Vector3(-1, -2, -1),
      this.scene
    );
    this.sunLight.intensity = 1.5;
    this.sunLight.diffuse = new BABYLON.Color3(1, 0.95, 0.9);

    // Enable shadows
    this.shadowGenerator = new BABYLON.ShadowGenerator(2048, this.sunLight);
    this.shadowGenerator.useBlurExponentialShadowMap = true;
    this.shadowGenerator.blurKernel = 32;
  }
  
  start() {
    // Run render loop
    this.engine.runRenderLoop(() => {
      const deltaTime = this.engine.getDeltaTime() / 1000; // Convert to seconds
      
      if (!this.state.paused) {
        this.update(deltaTime);
      }
      
      this.scene.render();
    });
  }
  
  update(deltaTime) {
    // Update player
    this.player.update(deltaTime, this.inputManager, this.camera);

    // Update enemies
    this.enemyManager.update(deltaTime);

    // Update combat (attacks, projectiles)
    this.combatSystem.update(deltaTime, this.inputManager);

    // Update world systems
    // (pickups, etc. will go here)
  }
}
