import * as BABYLON from '@babylonjs/core';
import * as CANNON from 'cannon-es';
import { Player } from './entities/Player.js';
import { World } from './world/World.js';
import { InputManager } from './systems/InputManager.js';
import { EnemyManager } from './systems/EnemyManager.js';
import { CombatSystem } from './systems/CombatSystem.js';
import { HUD } from './ui/HUD.js';
import { PickupManager } from './systems/PickupManager.js';
import { FriendManager } from './systems/FriendManager.js';
import { SoundManager } from './systems/SoundManager.js';
import { Shop } from './ui/Shop.js';
import { ChatSystem } from './ui/ChatSystem.js';
import { ChestManager } from './systems/ChestManager.js';

// Make CANNON available globally for Babylon.js
window.CANNON = CANNON;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;

    // Create engine
    this.engine = new BABYLON.Engine(canvas, true);

    // Create scene
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0.4, 0.6, 0.9, 1);
    this.scene.maxSimultaneousLights = 12;

    // Enable physics
    this.scene.enablePhysics(
      new BABYLON.Vector3(0, -9.81, 0),
      new BABYLON.CannonJSPlugin(true, 10, CANNON)
    );

    // Rank thresholds — reward multiplier increases with rank
    this.ranks = [
      { name: 'Squire', score: 0, color: '#aaaaaa', reward: 1.0 },
      { name: 'Knight', score: 500, color: '#44aaff', reward: 1.25 },
      { name: 'Guardian', score: 1500, color: '#44ff88', reward: 1.5 },
      { name: 'Champion', score: 3000, color: '#ffaa00', reward: 2.0 },
      { name: 'Hero', score: 5000, color: '#ff4488', reward: 2.5 },
      { name: 'Legend', score: 10000, color: '#ff44ff', reward: 3.0 },
    ];

    // Admin mode (activated by secret code on start screen)
    const isAdmin = localStorage.getItem('adminMode') === 'true';

    // Load saved progress — clamp to valid range
    let savedLevel = parseInt(localStorage.getItem('savedLevel') || '0');
    if (isNaN(savedLevel) || savedLevel < 0 || savedLevel > 9) savedLevel = 0;
    const savedScore = parseInt(localStorage.getItem('savedScore') || '0');
    const savedRank = localStorage.getItem('savedRank') || (isAdmin ? 'Admin' : 'Squire');
    const savedRankColor = localStorage.getItem('savedRankColor') || (isAdmin ? '#ff2222' : '#aaaaaa');
    const savedReward = parseFloat(localStorage.getItem('savedReward') || '1.0');

    // Game state
    this.state = {
      started: false,
      paused: false,
      dead: false,
      health: isAdmin ? 150 : 100,
      maxHealth: isAdmin ? 150 : 100,
      score: savedScore,
      totalCoins: parseInt(localStorage.getItem('totalCoins') || '0'),
      ammo: { basic: 10, fire: 0, ice: 0, lightning: 0 },
      selectedElement: 'basic',
      shieldActive: false,
      shieldCooldown: 0,
      enemiesAlive: 0,
      currentLevel: savedLevel,
      levelName: '',
      levelNum: 0,
      levelComplete: false,
      isAdmin: isAdmin,
      rank: savedRank,
      rankColor: savedRankColor,
      damageMultiplier: isAdmin ? 1.5 : 1.0,
      speedMultiplier: isAdmin ? 1.25 : 1.0,
      rewardMultiplier: savedReward,
      username: localStorage.getItem('username') || 'Knight',
      totalKills: parseInt(localStorage.getItem('totalKills') || '0'),
    };

    // Initialize systems
    this.inputManager = new InputManager(this.scene, canvas);

    // Create world
    this.world = new World(this.scene);

    // Create player
    this.player = new Player(this.scene, this.inputManager);
    this.player.speed = this.player.baseSpeed * this.state.speedMultiplier;

    // Hide player mesh in first person
    this.player.mesh.getChildMeshes().forEach(child => {
      child.isVisible = false;
    });

    // Create enemy manager
    this.enemyManager = new EnemyManager(this.scene, this.player);

    // Create combat system
    this.combatSystem = new CombatSystem(this.scene, this.player, this.enemyManager, this.state);

    // Pickup manager
    this.pickupManager = new PickupManager(this.scene, this.player);

    // Friend manager
    this.friendManager = new FriendManager(this.scene, this.player);

    // Chest manager
    this.chestManager = new ChestManager(this.scene, this.player);

    // Sound manager
    this.soundManager = new SoundManager();

    // Link sound manager to combat system
    this.combatSystem.soundManager = this.soundManager;

    // HUD
    this.hud = new HUD(this.state);

    // Link combat system to HUD for magazine display
    this.hud.combatSystem = this.combatSystem;

    // Shop
    this.shop = new Shop();

    // Chat system
    this.chat = new ChatSystem();

    // Setup camera to follow player
    this.setupCamera();

    // Give combat system the camera reference for aiming
    this.combatSystem.camera = this.camera;

    // Setup lighting
    this.setupLighting();

    // Setup UI event listeners
    this.setupUI();

    // Show admin label if active
    if (this.state.isAdmin) {
      const adminLabel = document.getElementById('admin-label');
      if (adminLabel) {
        adminLabel.style.display = 'block';
        adminLabel.textContent = 'ADMIN MODE ACTIVE';
      }
    }

    // Survival mode state
    this.survivalMode = false;
    this.survivalTimer = 0;
    this.survivalTimerEl = document.getElementById('survival-timer');

    // Emote wheel state
    this.emoteWheelOpen = false;
    this.emoteBubble = null;
    this.emoteBubbleTimer = null;
    this.setupEmoteWheel();

    // Handle window resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  setupUI() {
    // Secret admin code — type "admin" on start screen to toggle
    this.adminBuffer = '';
    window.addEventListener('keydown', (evt) => {
      if (this.state.started) return;
      this.adminBuffer += evt.key.toLowerCase();
      if (this.adminBuffer.length > 10) this.adminBuffer = this.adminBuffer.slice(-10);
      if (this.adminBuffer.includes('admin')) {
        this.adminBuffer = '';
        const current = localStorage.getItem('adminMode') === 'true';
        localStorage.setItem('adminMode', current ? 'false' : 'true');
        const adminLabel = document.getElementById('admin-label');
        if (adminLabel) {
          adminLabel.style.display = current ? 'none' : 'block';
          adminLabel.textContent = current ? '' : 'ADMIN MODE ACTIVE';
        }
      }
    });

    // Load saved username into input
    const usernameInput = document.getElementById('username-input');
    if (usernameInput) {
      usernameInput.value = this.state.username;
    }

    // Render leaderboard on start screen
    this.renderLeaderboard();
    this.setupLeaderboardTabs();

    // Start menu music on first interaction
    const startMenuMusic = () => {
      this.soundManager.init();
      this.soundManager.startMenuMusic();
      document.getElementById('start-screen').removeEventListener('click', startMenuMusic);
    };
    document.getElementById('start-screen').addEventListener('click', startMenuMusic);

    // Start button
    document.getElementById('start-btn').addEventListener('click', () => {
      try {
        // Save username
        const nameVal = (usernameInput.value || '').trim() || 'Knight';
        this.state.username = nameVal;
        localStorage.setItem('username', nameVal);

        // Reset to level 0 to always start fresh
        this.state.currentLevel = 0;

        document.getElementById('start-screen').style.display = 'none';
        this.state.started = true;
        this.shop.applyUpgrades(this.state, this.player);
        this.soundManager.init();
        this.hud.show();
        this.chat.setUsername(this.state.username);
        this.chat.show();
        this.chat.systemMsg(`${this.state.username} has joined the quest!`);
        this.startLevel(this.state.currentLevel);
        this.hud.update();
        this.canvas.requestPointerLock();
      } catch (err) {
        console.error('START error:', err);
        alert('Error starting game: ' + err.message);
      }
    });

    // Survival mode button
    document.getElementById('survival-btn').addEventListener('click', () => {
      const nameVal = (usernameInput.value || '').trim() || 'Knight';
      this.state.username = nameVal;
      localStorage.setItem('username', nameVal);

      document.getElementById('start-screen').style.display = 'none';
      this.state.started = true;
      this.survivalMode = true;
      this.survivalTimer = 60;
      this.soundManager.init();
      this.hud.show();
      this.chat.setUsername(this.state.username);
      this.chat.show();
      this.chat.systemMsg(`${this.state.username} entered SURVIVAL MODE! Survive 60 seconds!`);
      // Pick a random level map for variety
      const randomLevel = Math.floor(Math.random() * this.enemyManager.getTotalLevels());
      this.startSurvivalLevel(randomLevel);
      this.hud.update();
      this.canvas.requestPointerLock();
    });

    // Survival victory restart
    document.getElementById('survival-restart-btn').addEventListener('click', () => {
      location.reload();
    });

    // Next level button
    document.getElementById('next-level-btn').addEventListener('click', () => {
      document.getElementById('level-complete').style.display = 'none';
      const nextLevel = this.state.currentLevel + 1;
      this.startLevel(nextLevel);
      this.saveProgress();
      this.canvas.requestPointerLock();
    });

    // Victory restart
    document.getElementById('victory-restart-btn').addEventListener('click', () => {
      location.reload();
    });

    // Skin selection
    document.querySelectorAll('.skin-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const skin = btn.getAttribute('data-skin');
        localStorage.setItem('knightSkin', skin);
        document.querySelectorAll('.skin-btn').forEach(b => b.style.borderColor = 'transparent');
        btn.style.borderColor = '#fff';
      });
    });

    // Restart
    document.getElementById('restart-btn').addEventListener('click', () => {
      location.reload();
    });

    // Pause resume
    document.getElementById('resume-btn').addEventListener('click', () => {
      this.unpause();
    });
    document.getElementById('pause-restart-btn').addEventListener('click', () => {
      location.reload();
    });

    // Pause on Escape/P
    window.addEventListener('keydown', (evt) => {
      if (!this.state.started || this.state.dead) return;

      if (evt.code === 'Escape' || evt.code === 'KeyP') {
        if (this.state.paused) {
          this.unpause();
        } else {
          this.pause();
        }
        return;
      }

      // Chat toggle
      if (evt.code === 'KeyT' && !this.chat.isOpen && !this.emoteWheelOpen) {
        this.chat.openInput();
        return;
      }

      // Emote wheel toggle
      if (evt.code === 'KeyB' && !this.chat.isOpen) {
        this.toggleEmoteWheel();
        return;
      }

      // Element switching
      if (evt.code === 'Digit1') { this.state.selectedElement = 'basic'; this.hud.update(); }
      if (evt.code === 'Digit2') { this.state.selectedElement = 'fire'; this.hud.update(); }
      if (evt.code === 'Digit3') { this.state.selectedElement = 'ice'; this.hud.update(); }
      if (evt.code === 'Digit4') { this.state.selectedElement = 'lightning'; this.hud.update(); }
    });
  }

  pause() {
    this.state.paused = true;
    document.getElementById('pause-screen').style.display = 'flex';
    document.exitPointerLock();
  }

  unpause() {
    this.state.paused = false;
    document.getElementById('pause-screen').style.display = 'none';
    this.canvas.requestPointerLock();
  }

  startLevel(levelIndex) {
    this.state.currentLevel = levelIndex;
    this.state.levelComplete = false;

    // Build the map for this level
    this.world.buildLevel(levelIndex);

    // Teleport player to level spawn point
    const spawnPoints = [
      new BABYLON.Vector3(0, 1, 10),   // Level 1: Village area
      new BABYLON.Vector3(0, 1, 0),    // Level 2: Forest center
      new BABYLON.Vector3(0, 10, 0),   // Level 3: Center island
      new BABYLON.Vector3(0, 1, 15),   // Level 4: Lava Fortress
      new BABYLON.Vector3(0, 1, 0),    // Level 5: Frozen Depths
      new BABYLON.Vector3(0, 1, 0),    // Level 6: Shadow Realm
      new BABYLON.Vector3(0, 16, 0),   // Level 7: Storm Peaks
      new BABYLON.Vector3(0, 1, 10),   // Level 8: Poison Swamp
      new BABYLON.Vector3(0, 1, 0),    // Level 9: Crystal Caverns
      new BABYLON.Vector3(0, 1, 0),    // Level 10: The Void
    ];
    const spawn = spawnPoints[levelIndex] || spawnPoints[0];
    this.player.mesh.position.copyFrom(spawn);
    if (this.player.mesh.physicsImpostor) {
      this.player.mesh.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
    }

    this.enemyManager.startLevel(levelIndex);
    const config = this.enemyManager.getLevelConfig();
    if (config) {
      this.state.levelName = config.name;
      this.state.levelNum = config.id;
      this.hud.showMessage(`Level ${config.id}: ${config.name}`);
      this.chat.levelMsg(`Level ${config.id}: ${config.name} started!`);
    }

    // Spawn chests for this level
    this.chestManager.spawnChestsForLevel(levelIndex);

    // Start level music
    this.soundManager.startMusic(levelIndex);

    // Refill basic ammo each level, but elemental ammo must be found in chests
    this.state.ammo = {
      basic: 30,
      fire: this.state.ammo.fire,
      ice: this.state.ammo.ice,
      lightning: this.state.ammo.lightning
    };
    // Reset magazine
    this.combatSystem.currentMagazine = this.combatSystem.magazineSize;
    this.combatSystem.isReloading = false;
    this.combatSystem.reloadTimer = 0;
    // Heal player
    this.state.health = this.state.maxHealth;
    // Save progress
    localStorage.setItem('savedLevel', levelIndex.toString());
    localStorage.setItem('savedScore', this.state.score.toString());
    this.hud.update();
  }

  startSurvivalLevel(levelIndex) {
    this.state.currentLevel = levelIndex;
    this.state.levelComplete = false;

    // Build the map
    this.world.buildLevel(levelIndex);

    // Teleport player to center
    this.player.mesh.position = new BABYLON.Vector3(0, 3, 0);
    if (this.player.mesh.physicsImpostor) {
      this.player.mesh.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
    }

    // Spawn lots of enemies — all with guns, all alerted
    this.enemyManager.startLevel(levelIndex);
    // Make all enemies aware + alerted + give them guns
    this.enemyManager.getAliveEnemies().forEach(e => {
      e.aware = true;
      e.chasingPlayer = true;
      e.alerted = true;
      e.hasGun = true;
      e.shootCooldown = Math.random() * 2; // Stagger initial shots
    });

    this.state.levelName = 'SURVIVAL MODE';
    this.state.levelNum = 0;
    this.hud.showMessage('SURVIVE FOR 60 SECONDS!');
    this.chat.levelMsg('SURVIVAL MODE — Stay alive!');

    // Start intense music
    this.soundManager.startBossMusic();

    // Full health, no ammo (can't fight in survival mode)
    this.state.health = this.state.maxHealth;
    this.state.ammo = { basic: 0, fire: 0, ice: 0, lightning: 0 };
    // Reset magazine
    this.combatSystem.currentMagazine = 0;
    this.combatSystem.isReloading = false;
    this.combatSystem.reloadTimer = 0;

    // Show survival timer
    if (this.survivalTimerEl) {
      this.survivalTimerEl.style.display = 'block';
      this.survivalTimerEl.textContent = '60';
    }

    this.hud.update();
  }

  saveProgress() {
    localStorage.setItem('savedLevel', this.state.currentLevel.toString());
    localStorage.setItem('savedScore', this.state.score.toString());
    localStorage.setItem('savedRank', this.state.rank);
    localStorage.setItem('savedRankColor', this.state.rankColor);
    localStorage.setItem('savedReward', this.state.rewardMultiplier.toString());
    localStorage.setItem('totalKills', this.state.totalKills.toString());
  }

  addKill() {
    this.state.totalKills++;
    localStorage.setItem('totalKills', this.state.totalKills.toString());
    this.updateLeaderboard();
    this.chat.killMsg(this.state.username, 'an enemy');
  }

  updateLeaderboard() {
    const lb = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    const name = this.state.username || 'Knight';
    const existing = lb.find(e => e.name === name);
    if (existing) {
      existing.kills = Math.max(existing.kills, this.state.totalKills);
      existing.score = Math.max(existing.score, this.state.score);
    } else {
      lb.push({ name, kills: this.state.totalKills, score: this.state.score });
    }
    lb.sort((a, b) => b.kills - a.kills);
    // Keep top 10
    const top = lb.slice(0, 10);
    localStorage.setItem('leaderboard', JSON.stringify(top));
  }

  renderLeaderboard(type) {
    const mode = type || this._activeLbTab || 'quest';
    const titleEl = document.getElementById('leaderboard-title');
    const listEl = document.getElementById('leaderboard-list');
    if (!listEl) return;

    if (mode === 'survival') {
      if (titleEl) titleEl.textContent = 'SURVIVAL LEADERBOARD';
      const lb = JSON.parse(localStorage.getItem('survivalLeaderboard') || '[]');
      if (lb.length === 0) {
        listEl.innerHTML = '<div style="color:#666;">No entries yet</div>';
        return;
      }
      listEl.innerHTML = lb.slice(0, 5).map((e, i) =>
        `<div class="lb-entry"><span class="lb-name">${i + 1}. ${e.name}</span><span class="lb-score">${e.score} pts</span></div>`
      ).join('');
    } else {
      if (titleEl) titleEl.textContent = 'QUEST LEADERBOARD';
      const lb = JSON.parse(localStorage.getItem('leaderboard') || '[]');
      if (lb.length === 0) {
        listEl.innerHTML = '<div style="color:#666;">No entries yet</div>';
        return;
      }
      listEl.innerHTML = lb.slice(0, 5).map((e, i) =>
        `<div class="lb-entry"><span class="lb-name">${i + 1}. ${e.name}</span><span class="lb-score">${e.kills} kills</span></div>`
      ).join('');
    }
  }

  setupLeaderboardTabs() {
    this._activeLbTab = 'quest';
    document.querySelectorAll('.lb-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._activeLbTab = tab.getAttribute('data-lb');
        this.renderLeaderboard(this._activeLbTab);
      });
    });
  }

  updateSurvivalLeaderboard() {
    const lb = JSON.parse(localStorage.getItem('survivalLeaderboard') || '[]');
    const name = this.state.username || 'Knight';
    const score = this.state.score;
    const existing = lb.find(e => e.name === name);
    if (existing) {
      existing.score = Math.max(existing.score, score);
    } else {
      lb.push({ name, score });
    }
    lb.sort((a, b) => b.score - a.score);
    const top = lb.slice(0, 10);
    localStorage.setItem('survivalLeaderboard', JSON.stringify(top));
  }

  renderSurvivalVictoryLeaderboard() {
    const lb = JSON.parse(localStorage.getItem('survivalLeaderboard') || '[]');
    const listEl = document.getElementById('survival-leaderboard-list');
    if (!listEl) return;
    if (lb.length === 0) {
      listEl.innerHTML = '<div style="color:#666;">No entries yet</div>';
      return;
    }
    listEl.innerHTML = lb.slice(0, 5).map((e, i) =>
      `<div class="lb-entry"><span class="lb-name">${i + 1}. ${e.name}</span><span class="lb-score">${e.score} pts</span></div>`
    ).join('');
  }

  setupEmoteWheel() {
    const wheel = document.getElementById('emote-wheel');
    if (!wheel) return;
    wheel.querySelectorAll('.emote-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const emote = btn.getAttribute('data-emote');
        this.useEmote(emote);
        this.closeEmoteWheel();
      });
    });
  }

  toggleEmoteWheel() {
    if (this.emoteWheelOpen) {
      this.closeEmoteWheel();
    } else {
      this.openEmoteWheel();
    }
  }

  openEmoteWheel() {
    this.emoteWheelOpen = true;
    document.getElementById('emote-wheel').style.display = 'block';
    document.exitPointerLock();
  }

  closeEmoteWheel() {
    this.emoteWheelOpen = false;
    document.getElementById('emote-wheel').style.display = 'none';
    if (this.state.started && !this.state.dead && !this.state.paused) {
      this.canvas.requestPointerLock();
    }
  }

  useEmote(emote) {
    // Post to chat
    this.chat.addMessage(this.state.username, emote, 'emote');

    // Show 3D bubble above player
    this.showEmoteBubble(emote);
  }

  showEmoteBubble(text) {
    // Remove previous bubble
    if (this.emoteBubble) {
      if (this.emoteBubble.material) this.emoteBubble.material.dispose();
      if (this.emoteBubble.texture) this.emoteBubble.texture.dispose();
      this.emoteBubble.dispose();
      this.emoteBubble = null;
    }
    clearTimeout(this.emoteBubbleTimer);

    // Create a plane with dynamic texture for the emote text
    const plane = BABYLON.MeshBuilder.CreatePlane('emoteBubble', {
      width: 2, height: 0.6
    }, this.scene);
    plane.parent = this.player.mesh;
    plane.position.y = 2.2;
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    const tex = new BABYLON.DynamicTexture('emoteTex', { width: 256, height: 80 }, this.scene);
    const ctx = tex.getContext();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.roundRect(4, 4, 248, 72, 12);
    ctx.fill();
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 42);
    tex.update();

    const mat = new BABYLON.StandardMaterial('emoteMat', this.scene);
    mat.diffuseTexture = tex;
    mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    mat.backFaceCulling = false;
    mat.useAlphaFromDiffuseTexture = true;
    mat.opacityTexture = tex;
    plane.material = mat;

    this.emoteBubble = plane;
    this.emoteBubble.texture = tex;

    // Remove after 3 seconds
    this.emoteBubbleTimer = setTimeout(() => {
      if (this.emoteBubble) {
        if (this.emoteBubble.material) this.emoteBubble.material.dispose();
        if (this.emoteBubble.texture) this.emoteBubble.texture.dispose();
        this.emoteBubble.dispose();
        this.emoteBubble = null;
      }
    }, 3000);
  }

  checkLevelComplete() {
    if (this.state.levelComplete) return;
    if (!this.enemyManager.isLevelComplete()) return;

    this.state.levelComplete = true;
    this.saveProgress();
    const totalLevels = this.enemyManager.getTotalLevels();

    if (this.state.currentLevel >= totalLevels - 1) {
      // All levels beaten — victory!
      this.soundManager.stopMusic();
      document.getElementById('victory-score').textContent = this.state.score;
      document.getElementById('victory-screen').style.display = 'flex';
      this.hud.hide();
      document.exitPointerLock();
    } else {
      // Show level complete screen
      const config = this.enemyManager.getLevelConfig();
      document.getElementById('level-complete-text').textContent =
        `You cleared ${config ? config.name : 'the level'}!`;
      document.getElementById('level-complete').style.display = 'flex';
      document.exitPointerLock();
    }
  }

  handleChestLoot(loot) {
    if (!loot) return;

    if (loot.type === 'coins') {
      this.state.totalCoins += loot.amount;
      this.state.score += loot.amount * 10;
      localStorage.setItem('totalCoins', this.state.totalCoins.toString());
      this.hud.showMessage(`+${loot.amount} Coins!`);
      this.soundManager.play('coin');
    } else {
      // Ammo
      this.state.ammo[loot.type] += loot.amount;
      const ammoNames = { basic: 'Basic', fire: 'Fire', ice: 'Ice', lightning: 'Lightning' };
      this.hud.showMessage(`+${loot.amount} ${ammoNames[loot.type]} Ammo!`);
      this.soundManager.play('pickup');
    }

    this.hud.update();
  }

  damagePlayer(amount) {
    if (this.state.dead) return;

    if (this.state.shieldActive) {
      return;
    }

    this.state.health = Math.max(0, this.state.health - amount);
    this.soundManager.play('playerHurt');
    this.hud.update();

    if (this.state.health <= 0) {
      this.state.dead = true;
      this.soundManager.stopMusic();
      if (this.survivalTimerEl) this.survivalTimerEl.style.display = 'none';
      document.getElementById('final-score').textContent = this.state.score;
      document.getElementById('game-over').style.display = 'flex';
      this.hud.hide();
      document.exitPointerLock();
    }
  }

  setupCamera() {
    // First-person camera
    this.camera = new BABYLON.UniversalCamera(
      'camera',
      new BABYLON.Vector3(0, 3.5, 0),
      this.scene
    );

    // Look forward by default
    this.camera.setTarget(new BABYLON.Vector3(0, 3.5, 1));

    // Disable all default inputs (we handle everything manually)
    this.camera.inputs.clear();

    // Clamp vertical look
    this.camera.minZ = 0.1;

    // Pointer lock: mouse movement controls camera without clicking
    this.canvas.addEventListener('click', () => {
      if (this.state.started && !this.state.dead && !this.state.paused) {
        this.canvas.requestPointerLock();
      }
    });

    // Manual mouse look with pointer lock
    const sensitivity = 0.002;
    this._cameraYaw = 0;
    this._cameraPitch = 0;

    document.addEventListener('mousemove', (evt) => {
      if (document.pointerLockElement === this.canvas) {
        this._cameraYaw += evt.movementX * sensitivity;
        this._cameraPitch -= evt.movementY * sensitivity;
        // Clamp pitch to avoid flipping
        this._cameraPitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this._cameraPitch));
      }
    });
  }

  setupLighting() {
    // Ambient color so materials are never fully black
    this.scene.ambientColor = new BABYLON.Color3(0.6, 0.6, 0.6);

    // Hemispheric light — bright sky + ground fill
    const hemiLight = new BABYLON.HemisphericLight(
      'hemi',
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    );
    hemiLight.intensity = 2.0;
    hemiLight.diffuse = new BABYLON.Color3(1, 1, 1);
    hemiLight.groundColor = new BABYLON.Color3(0.6, 0.6, 0.6);

    // Sun
    this.sunLight = new BABYLON.DirectionalLight(
      'sun',
      new BABYLON.Vector3(-1, -2, -1),
      this.scene
    );
    this.sunLight.intensity = 1.8;
    this.sunLight.diffuse = new BABYLON.Color3(1, 0.95, 0.85);
  }

  showShieldBubble(show) {
    if (!this.shieldBubble) {
      this.shieldBubble = BABYLON.MeshBuilder.CreateSphere('shield', {
        diameter: 3, segments: 16
      }, this.scene);
      this.shieldBubble.parent = this.player.mesh;
      this.shieldBubble.position.y = 0.3;

      const mat = new BABYLON.StandardMaterial('shieldMat', this.scene);
      mat.diffuseColor = new BABYLON.Color3(0.13, 0.27, 0.67);
      mat.alpha = 0.2;
      mat.specularColor = new BABYLON.Color3(0.5, 0.5, 1);
      mat.specularPower = 64;
      mat.backFaceCulling = false;
      this.shieldBubble.material = mat;
    }
    this.shieldBubble.isVisible = show;
  }

  start() {
    // Run render loop
    this.engine.runRenderLoop(() => {
      const deltaTime = this.engine.getDeltaTime() / 1000;

      if (this.state.started && !this.state.paused && !this.state.dead && !this.state.levelComplete) {
        this.update(deltaTime);
      }

      this.scene.render();
    });
  }

  update(deltaTime) {
    // Update player — pass yaw for movement direction
    this.player.update(deltaTime, this.inputManager, this.camera, this._cameraYaw);

    // Position first-person camera at player's head
    const playerPos = this.player.mesh.position;
    this.camera.position.x = playerPos.x;
    this.camera.position.y = playerPos.y + 1.5;
    this.camera.position.z = playerPos.z;

    // Apply yaw/pitch to camera target
    const lookX = Math.sin(this._cameraYaw) * Math.cos(this._cameraPitch);
    const lookY = Math.sin(this._cameraPitch);
    const lookZ = Math.cos(this._cameraYaw) * Math.cos(this._cameraPitch);
    this.camera.setTarget(new BABYLON.Vector3(
      playerPos.x + lookX,
      playerPos.y + 1.5 + lookY,
      playerPos.z + lookZ
    ));

    // Shield logic
    if (this.inputManager.isKeyDown('f')) {
      if (this.state.shieldCooldown <= 0) {
        this.state.shieldActive = true;
        this.showShieldBubble(true);
      }
    } else {
      if (this.state.shieldActive) {
        this.state.shieldActive = false;
        this.state.shieldCooldown = this.state.shieldCooldownRate || 1.0;
        this.showShieldBubble(false);
      }
    }
    if (this.state.shieldCooldown > 0) {
      this.state.shieldCooldown -= deltaTime;
    }

    // Update enemies
    this.enemyManager.update(deltaTime, this);

    // Update combat (attacks, projectiles — always update projectiles, block new attacks if shielded)
    // In survival mode, block ALL player attacks (sword + gun)
    const blockAttacks = this.state.shieldActive || this.survivalMode;
    this.combatSystem.update(deltaTime, this.inputManager, blockAttacks);

    // Update pickups
    this.pickupManager.update(deltaTime, this);

    // Update friends
    this.friendManager.update(deltaTime, this);

    // Update chests
    this.chestManager.update(deltaTime, this);

    // Handle chest interaction (E key)
    if (this.inputManager.isKeyDown('e')) {
      // Try to open a nearby chest
      const opened = this.chestManager.tryOpenNearbyChest(this.player.mesh.position);
      if (opened) {
        this.soundManager.play('chestOpen');
      } else {
        // Try to collect from an opened chest
        const loot = this.chestManager.tryCollectNearbyChest(this.player.mesh.position);
        if (loot) {
          this.handleChestLoot(loot);
        }
      }
    }

    // Track alive enemies
    this.state.enemiesAlive = this.enemyManager.getAliveEnemies().length;

    // Check level complete (not in survival mode)
    if (!this.survivalMode) {
      this.checkLevelComplete();
    }

    // Survival mode timer
    if (this.survivalMode && this.survivalTimer > 0) {
      this.survivalTimer -= deltaTime;

      // Update timer display
      if (this.survivalTimerEl) {
        const secs = Math.ceil(this.survivalTimer);
        this.survivalTimerEl.textContent = secs > 0 ? secs : '0';
        // Flash red when low
        if (secs <= 10) {
          this.survivalTimerEl.style.color = secs % 2 === 0 ? '#ff0000' : '#ff4444';
        }
      }

      // Survived!
      if (this.survivalTimer <= 0) {
        this.survivalTimer = 0;
        this.soundManager.stopMusic();
        if (this.survivalTimerEl) this.survivalTimerEl.style.display = 'none';
        document.getElementById('survival-score').textContent = this.state.score;
        this.updateSurvivalLeaderboard();
        this.renderSurvivalVictoryLeaderboard();
        document.getElementById('survival-victory').style.display = 'flex';
        this.state.levelComplete = true;
        this.hud.hide();
        document.exitPointerLock();
      }

      // Keep spawning enemies every 10 seconds in survival
      this._survivalSpawnTimer = (this._survivalSpawnTimer || 0) + deltaTime;
      if (this._survivalSpawnTimer >= 10) {
        this._survivalSpawnTimer = 0;
        // Spawn 5 more enemies near the player
        for (let i = 0; i < 5; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 20 + Math.random() * 15;
          const pos = new BABYLON.Vector3(
            this.player.mesh.position.x + Math.cos(angle) * dist,
            0,
            this.player.mesh.position.z + Math.sin(angle) * dist
          );
          const enemy = this.enemyManager.spawnEnemy(pos);
          enemy.aware = true;
          enemy.chasingPlayer = true;
          enemy.alerted = true;
          enemy.hasGun = true;
          enemy.shootCooldown = Math.random() * 2;
        }
        this.chat.systemMsg('More enemies incoming!');
      }
    }

    // Sky Battle: fall off the islands = instant death
    if (this.state.currentLevel === 2 && this.player.mesh.position.y < -3) {
      this.hud.showMessage('You fell into the lava!');
      this.damagePlayer(99999);
    }

    // Health regen (1 HP/s)
    if (this.state.health > 0 && this.state.health < this.state.maxHealth) {
      this.state.health = Math.min(this.state.maxHealth, this.state.health + 1 * deltaTime);
    }

    // Show current level zone
    if (this.state.levelName) {
      this.hud.showZone(this.state.levelName);
    }

    // Update rank based on score
    if (!this.state.isAdmin) {
      for (let i = this.ranks.length - 1; i >= 0; i--) {
        if (this.state.score >= this.ranks[i].score) {
          const newRank = this.ranks[i].name;
          if (this.state.rank !== newRank) {
            this.state.rank = newRank;
            this.state.rankColor = this.ranks[i].color;
            this.state.rewardMultiplier = this.ranks[i].reward;
            this.hud.showMessage(`Rank Up! ${newRank}! (${this.ranks[i].reward}x rewards)`);
            this.saveProgress();
          }
          break;
        }
      }
    }

    // Update HUD
    this.hud.update();
    this.hud.updateMinimap(this.player, this.enemyManager);
  }
}
