import * as BABYLON from '@babylonjs/core';
import * as CANNON from 'cannon';
import { Player } from './entities/Player.js';
import { World } from './world/World.js';
import { InputManager } from './systems/InputManager.js';

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
    this.scene.enablePhysics(
      new BABYLON.Vector3(0, -9.81, 0),
      new BABYLON.CannonJSPlugin()
    );
    
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

    this.camera.attachControl(this.canvas, true);
    this.camera.lowerRadiusLimit = 5;
    this.camera.upperRadiusLimit = 20;
    this.camera.lowerBetaLimit = 0.1;
    this.camera.upperBetaLimit = (Math.PI / 2) * 0.99;

    // Smooth camera movement
    this.camera.inertia = 0.9;
    this.camera.angularSensibilityX = 1000;
    this.camera.angularSensibilityY = 1000;
    this.camera.wheelPrecision = 20;

    // Follow player
    this.camera.lockedTarget = this.player.mesh;
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
    console.log('Knight\'s Quest - Babylon.js Edition');
    console.log('Game starting...');
    
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
    this.player.update(deltaTime, this.inputManager);
    
    // Update world systems
    // (enemies, projectiles, etc. will go here)
  }
}
