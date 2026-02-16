import * as BABYLON from '@babylonjs/core';
import '@babylonjs/core/Physics/v1/physicsEngineComponent';
import { CannonJSPlugin } from '@babylonjs/core/Physics/Plugins/cannonJSPlugin';
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
import { Achievements } from './ui/Achievements.js';
import { TrailerMode } from './TrailerMode.js';
import { Pet } from './entities/Pet.js';
import { PracticeMode } from './modes/PracticeMode.js';
import NetworkManager from './network/NetworkManager.js';
import { RemotePlayer } from './entities/RemotePlayer.js';
import { PvPArena } from './network/PvPArena.js';

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
      new CannonJSPlugin(true, 10, CANNON)
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

    // Load saved progress
    const savedLevel = parseInt(localStorage.getItem('savedLevel') || '0');
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
      totalCoins: 99999,
      ammo: { fire: 0, ice: 0, lightning: 0 },
      selectedElement: 'fire',
      selectedWeapon: 'pistol',
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
    this.combatSystem = new CombatSystem(this.scene, this.player, this.enemyManager, this.state, this);

    // Pickup manager
    this.pickupManager = new PickupManager(this.scene, this.player);

    // Friend manager
    this.friendManager = new FriendManager(this.scene, this.player);

    // Sound manager
    this.soundManager = new SoundManager();

    // HUD
    this.hud = new HUD(this.state);

    // Force coins into localStorage so shop can read them
    localStorage.setItem('totalCoins', '99999');

    // Shop
    this.shop = new Shop();

    // Gift system — wire shop to network (also sends over network if connected)
    this.shop.onGift = (item) => {
      if (this.network && this.network.connected) {
        this.network.send('gi', { itemId: item.id, username: this.state.username, itemName: item.name });
      }
    };
    this.shop.onGiftReceived = (item, fromUsername) => {
      this.hud.showMessage(`${fromUsername} gifted you ${item.name}!`);
      this.chat.systemMsg(`${fromUsername} gifted ${item.name}!`);
    };

    // Chat system
    this.chat = new ChatSystem();

    // Achievements
    this.achievements = new Achievements();

    // Hook chat message achievement
    this.chat.onPlayerMessage = () => {
      this.achievements.unlock('chat_msg', this.hud);
    };

    // Hook shop purchase achievement
    this.shopPurchaseCount = parseInt(localStorage.getItem('shopPurchaseCount') || '0');
    this.shop.onPurchase = (item) => {
      this.achievements.unlock('buy_item', this.hud);
      this.shopPurchaseCount++;
      localStorage.setItem('shopPurchaseCount', this.shopPurchaseCount.toString());
      if (this.shopPurchaseCount >= 5) this.achievements.unlock('buy_5', this.hud);
      if (this.shopPurchaseCount >= 10) this.achievements.unlock('buy_10', this.hud);
      if (this.shopPurchaseCount >= 25) this.achievements.unlock('buy_25', this.hud);
      if (this.shopPurchaseCount >= 50) this.achievements.unlock('buy_50', this.hud);

      // Gift achievements
      const giftsSent = parseInt(localStorage.getItem('giftsSent') || '0');
      if (giftsSent >= 1) this.achievements.unlock('gift_send', this.hud);
      if (giftsSent >= 5) this.achievements.unlock('gift_send_5', this.hud);
      if (giftsSent >= 10) this.achievements.unlock('gift_send_10', this.hud);

      // Collection achievements
      const p = this.shop.purchases;
      // All weapons
      if (p.shotgun && p.rocket && p.minigun && p.laser && p.crossbow && p.flamethrower) {
        this.achievements.unlock('all_weapons', this.hud);
      }
      // Pets
      const pets = ['pet_wolf','pet_dragon','pet_fairy','pet_ghost','pet_phoenix','pet_golem','pet_cat'];
      const ownedPets = pets.filter(id => p[id]).length;
      if (ownedPets >= 2) this.achievements.unlock('pet_2', this.hud);
      if (ownedPets >= 4) this.achievements.unlock('pet_4', this.hud);
      if (ownedPets >= pets.length) this.achievements.unlock('pet_all', this.hud);
      // Skins
      const skins = ['skin_gold','skin_dark','skin_crystal','skin_rainbow','skin_lava','skin_ice','skin_shadow','skin_emerald','skin_royal','skin_candy','skin_galaxy','skin_sunrise','skin_ocean','skin_storm','skin_toxic','skin_blood','skin_sakura','skin_void','skin_copper','skin_diamond','skin_inferno'];
      const ownedSkins = skins.filter(id => p[id]).length;
      if (ownedSkins >= 3) this.achievements.unlock('skin_3', this.hud);
      if (ownedSkins >= 6) this.achievements.unlock('skin_6', this.hud);
      if (ownedSkins >= 10) this.achievements.unlock('skin_10', this.hud);
      if (ownedSkins >= 15) this.achievements.unlock('skin_15', this.hud);
      if (ownedSkins >= 20) this.achievements.unlock('skin_20', this.hud);
      if (ownedSkins >= skins.length) this.achievements.unlock('skin_all', this.hud);
      // Full upgrades
      if (p.dmg3 && p.hp3 && p.speed2) this.achievements.unlock('full_upgrades', this.hud);
    };

    // Achievement tracking per level
    this.gunUsedThisLevel = false;
    this.damageTakenThisLevel = false;
    this.swordKillsTotal = parseInt(localStorage.getItem('swordKills') || '0');
    this.headshotsTotal = parseInt(localStorage.getItem('headshots') || '0');
    this.bossKillsTotal = parseInt(localStorage.getItem('bossKills') || '0');
    this.chestsOpened = parseInt(localStorage.getItem('chestsOpened') || '0');
    this.deathCount = parseInt(localStorage.getItem('deathCount') || '0');
    this.totalPlayTime = parseFloat(localStorage.getItem('totalPlayTime') || '0');
    this.levelStartTime = 0;

    // Kill streak tracking
    this.recentKillTimes = [];

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

    // Multiplayer state
    this.network = new NetworkManager();
    this.remotePlayer = null;
    this.pvpArena = null;
    this._multiplayerMode = null; // 'coop' or 'pvp'
    this._networkSendTimer = 0;
    this._enemySendTimer = 0;
    this.pvpScores = { host: 0, client: 0 };
    this.pvpRespawnTimer = 0;
    this.pvpDead = false;

    // Wire network callbacks
    this.network.onConnected = () => this._onPeerConnected();
    this.network.onDisconnected = () => this._onPeerDisconnected();
    this.network.onMessage = (type, data) => this._onNetworkMessage(type, data);

    // Death replay (killcam) recording
    this.replayBuffer = [];       // stores { px, py, pz, yaw, pitch, time }
    this.replayMaxTime = 5;       // keep last 5 seconds
    this.replayPlaying = false;
    this.replayIndex = 0;
    this.replayTimer = 0;

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

    // Start menu music on first interaction
    const startMenuMusic = () => {
      this.soundManager.init();
      this.soundManager.startMenuMusic();
      document.getElementById('start-screen').removeEventListener('click', startMenuMusic);
    };
    document.getElementById('start-screen').addEventListener('click', startMenuMusic);

    // Start button
    document.getElementById('start-btn').addEventListener('click', () => {
      // Save username
      const nameVal = (usernameInput.value || '').trim() || 'Knight';
      this.state.username = nameVal;
      localStorage.setItem('username', nameVal);

      this.checkGiftInbox();
      document.getElementById('start-screen').style.display = 'none';
      this.state.started = true;
      this.shop.applyUpgrades(this.state, this.player);
      this.soundManager.init();
      this.hud.show();
      this.chat.setUsername(this.state.username);
      this.chat.show();
      this.chat.systemMsg(`${this.state.username} has joined the quest!`);
      this.achievements.unlock('welcome', this.hud);

      this.startLevel(this.state.currentLevel);
      this.hud.update();
      this.canvas.requestPointerLock();
    });

    // Survival mode button
    document.getElementById('survival-btn').addEventListener('click', () => {
      const nameVal = (usernameInput.value || '').trim() || 'Knight';
      this.state.username = nameVal;
      localStorage.setItem('username', nameVal);

      this.checkGiftInbox();
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

    // Trailer mode button
    // Practice mode
    this.practice = new PracticeMode(this);
    document.getElementById('practice-btn').addEventListener('click', () => {
      const nameVal = (usernameInput.value || '').trim() || 'Knight';
      this.state.username = nameVal;
      this.checkGiftInbox();
      document.getElementById('start-screen').style.display = 'none';
      this.state.started = true;
      this.shop.applyUpgrades(this.state, this.player);
      this.soundManager.init();
      this.hud.show();
      this.practice.start();
      this.canvas.requestPointerLock();
    });

    // Party mode button
    document.getElementById('party-btn').addEventListener('click', () => {
      const nameVal = (usernameInput.value || '').trim() || 'Knight';
      this.state.username = nameVal;
      localStorage.setItem('username', nameVal);
      document.getElementById('start-screen').style.display = 'none';
      this.state.started = true;
      this.shop.applyUpgrades(this.state, this.player);
      this.soundManager.init();
      this.hud.show();
      this.chat.setUsername(this.state.username);
      this.chat.show();
      this.chat.systemMsg(`${this.state.username} is celebrating!`);
      this.startPartyLevel();
      this.hud.update();
      this.canvas.requestPointerLock();
    });

    // Multiplayer buttons (lobby)
    document.getElementById('coop-btn').addEventListener('click', () => {
      this._multiplayerMode = 'coop';
      document.getElementById('start-screen').style.display = 'none';
      document.getElementById('multiplayer-lobby').style.display = 'flex';
      document.getElementById('lobby-title').textContent = 'CO-OP MODE';
      document.getElementById('lobby-host-panel').style.display = 'none';
      document.getElementById('lobby-join-panel').style.display = 'none';
      document.getElementById('lobby-buttons').style.display = 'flex';
    });
    document.getElementById('pvp-btn').addEventListener('click', () => {
      this._multiplayerMode = 'pvp';
      document.getElementById('start-screen').style.display = 'none';
      document.getElementById('multiplayer-lobby').style.display = 'flex';
      document.getElementById('lobby-title').textContent = '1v1 PVP';
      document.getElementById('lobby-host-panel').style.display = 'none';
      document.getElementById('lobby-join-panel').style.display = 'none';
      document.getElementById('lobby-buttons').style.display = 'flex';
    });
    document.getElementById('lobby-back-btn').addEventListener('click', () => {
      this.network.disconnect();
      document.getElementById('multiplayer-lobby').style.display = 'none';
      document.getElementById('start-screen').style.display = 'flex';
    });

    // Host button
    document.getElementById('host-btn').addEventListener('click', async () => {
      document.getElementById('lobby-buttons').style.display = 'none';
      document.getElementById('lobby-host-panel').style.display = 'block';
      document.getElementById('lobby-status').textContent = 'Creating room...';
      try {
        const code = await this.network.host(this._multiplayerMode);
        document.getElementById('room-code-display').textContent = code;
        document.getElementById('lobby-status').textContent = 'Waiting for player...';
      } catch (err) {
        document.getElementById('lobby-status').textContent = 'Error: ' + err.message;
      }
    });

    // Join button (show input)
    document.getElementById('join-btn').addEventListener('click', () => {
      document.getElementById('lobby-buttons').style.display = 'none';
      document.getElementById('lobby-join-panel').style.display = 'block';
      document.getElementById('join-status').textContent = '';
    });

    // Join room button
    document.getElementById('join-room-btn').addEventListener('click', async () => {
      const code = document.getElementById('room-code-input').value.trim().toUpperCase();
      if (code.length !== 6) {
        document.getElementById('join-status').textContent = 'Code must be 6 letters!';
        return;
      }
      document.getElementById('join-status').textContent = 'Connecting...';
      try {
        await this.network.join(code, this._multiplayerMode);
        // Connection established — onConnected callback will start the game
      } catch (err) {
        document.getElementById('join-status').textContent = 'Failed: ' + err.message;
      }
    });

    // PvP restart
    document.getElementById('pvp-restart-btn').addEventListener('click', () => {
      location.reload();
    });

    document.getElementById('trailer-btn').addEventListener('click', () => {
      document.getElementById('start-screen').style.display = 'none';
      this.trailerMode = new TrailerMode(this);
      this.onTrailerEnd = () => {
        this.state.started = false;
        this.trailerMode.dispose();
        this.trailerMode = null;
      };
      this.trailerMode.start();
      this.state.started = true;
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

    // Build skin buttons based on what the player owns
    const skinContainer = document.getElementById('skin-buttons');
    if (skinContainer) {
      const purchases = JSON.parse(localStorage.getItem('shopPurchases') || '{}');
      const currentSkin = localStorage.getItem('knightSkin') || 'silver';

      // All available skins — silver is always free
      const allSkins = [
        { id: 'silver', name: 'Silver', shopId: null },
        { id: 'gold', name: 'Gold', shopId: 'skin_gold' },
        { id: 'dark', name: 'Dark', shopId: 'skin_dark' },
        { id: 'crystal', name: 'Crystal', shopId: 'skin_crystal' },
        { id: 'rainbow', name: 'Rainbow', shopId: 'skin_rainbow' },
        { id: 'lava', name: 'Lava', shopId: 'skin_lava' },
        { id: 'ice', name: 'Frost', shopId: 'skin_ice' },
        { id: 'shadow', name: 'Shadow', shopId: 'skin_shadow' },
        { id: 'emerald', name: 'Emerald', shopId: 'skin_emerald' },
        { id: 'royal', name: 'Royal', shopId: 'skin_royal' },
        { id: 'candy', name: 'Candy', shopId: 'skin_candy' },
        { id: 'galaxy', name: 'Galaxy', shopId: 'skin_galaxy' },
        { id: 'sunrise', name: 'Sunrise', shopId: 'skin_sunrise' },
        { id: 'ocean', name: 'Ocean', shopId: 'skin_ocean' },
        { id: 'storm', name: 'Storm', shopId: 'skin_storm' },
        { id: 'toxic', name: 'Toxic', shopId: 'skin_toxic' },
        { id: 'blood', name: 'Blood', shopId: 'skin_blood' },
        { id: 'sakura', name: 'Sakura', shopId: 'skin_sakura' },
        { id: 'void', name: 'Void', shopId: 'skin_void' },
        { id: 'copper', name: 'Copper', shopId: 'skin_copper' },
        { id: 'diamond', name: 'Diamond', shopId: 'skin_diamond' },
        { id: 'inferno', name: 'Inferno', shopId: 'skin_inferno' },
      ];

      // Only show skins the player owns (silver is always owned)
      const ownedSkins = allSkins.filter(s => !s.shopId || purchases[s.shopId]);

      skinContainer.innerHTML = '';
      ownedSkins.forEach(skin => {
        const btn = document.createElement('button');
        btn.className = 'skin-btn';
        btn.setAttribute('data-skin', skin.id);
        btn.textContent = skin.name;
        btn.style.borderColor = skin.id === currentSkin ? '#fff' : 'transparent';
        btn.addEventListener('click', () => {
          localStorage.setItem('knightSkin', skin.id);
          skinContainer.querySelectorAll('.skin-btn').forEach(b => b.style.borderColor = 'transparent');
          btn.style.borderColor = '#fff';
        });
        skinContainer.appendChild(btn);
      });
    }

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

      // Map toggle
      if (evt.code === 'KeyM' && !this.chat.isOpen) {
        this.toggleMap();
        return;
      }

      // Element switching
      if (evt.code === 'Digit1') { this.state.selectedElement = 'fire'; this.hud.update(); }
      if (evt.code === 'Digit2') { this.state.selectedElement = 'ice'; this.hud.update(); }
      if (evt.code === 'Digit3') { this.state.selectedElement = 'lightning'; this.hud.update(); }

      // Weapon switching
      if (evt.code === 'Digit4' && this.state.hasShotgun) { this.state.selectedWeapon = this.state.selectedWeapon === 'shotgun' ? 'pistol' : 'shotgun'; this.hud.update(); }
      if (evt.code === 'Digit5' && this.state.hasRocket) { this.state.selectedWeapon = this.state.selectedWeapon === 'rocket' ? 'pistol' : 'rocket'; this.hud.update(); }
      if (evt.code === 'Digit6' && this.state.hasLaser) { this.state.selectedWeapon = this.state.selectedWeapon === 'laser' ? 'pistol' : 'laser'; this.hud.update(); }
      if (evt.code === 'Digit7' && this.state.hasMinigun) { this.state.selectedWeapon = this.state.selectedWeapon === 'minigun' ? 'pistol' : 'minigun'; this.hud.update(); }
    });
  }

  toggleMap() {
    this.mapOpen = !this.mapOpen;
    const bigMap = document.getElementById('big-map');
    if (bigMap) {
      bigMap.style.display = this.mapOpen ? 'block' : 'none';
    }
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
    this.gunUsedThisLevel = false;
    this.damageTakenThisLevel = false;
    this.levelStartTime = performance.now() / 1000;

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
    this.pickupManager.spawnWorldPickups(levelIndex);
    const config = this.enemyManager.getLevelConfig();
    if (config) {
      this.state.levelName = config.name;
      this.state.levelNum = config.id;
      this.hud.showMessage(`Level ${config.id}: ${config.name}`);
      this.chat.levelMsg(`Level ${config.id}: ${config.name} started!`);
    }
    // Start level music
    this.soundManager.startMusic(levelIndex);

    // No free ammo — find elemental pistols in chests!
    // Heal player
    this.state.health = this.state.maxHealth;

    // Spawn equipped pet
    this._spawnPet();

    // Save progress
    localStorage.setItem('savedLevel', levelIndex.toString());
    localStorage.setItem('savedScore', this.state.score.toString());
    this.hud.update();
  }

  _spawnPet() {
    // Dispose old pet
    if (this.activePet) {
      this.activePet.dispose();
      this.activePet = null;
    }
    // Spawn if player has a pet equipped
    if (this.state.pet) {
      this.activePet = new Pet(this.scene, this.player, this.state.pet);
    }
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

    // Full health, no ammo (can't fight)
    this.state.health = this.state.maxHealth;
    this.state.ammo = { fire: 0, ice: 0, lightning: 0 };

    // Spawn equipped pet
    this._spawnPet();

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

    // Kill milestone achievements
    this.achievements.unlock('first_kill', this.hud);
    if (this.state.totalKills >= 25) this.achievements.unlock('kills_25', this.hud);
    if (this.state.totalKills >= 50) this.achievements.unlock('kills_50', this.hud);
    if (this.state.totalKills >= 100) this.achievements.unlock('kills_100', this.hud);
    if (this.state.totalKills >= 250) this.achievements.unlock('kills_250', this.hud);
    if (this.state.totalKills >= 500) this.achievements.unlock('kills_500', this.hud);
    if (this.state.totalKills >= 1000) this.achievements.unlock('kills_1000', this.hud);
    if (this.state.totalKills >= 2500) this.achievements.unlock('kills_2500', this.hud);
    if (this.state.totalKills >= 5000) this.achievements.unlock('kills_5000', this.hud);

    // Kill streak tracking
    const now = performance.now() / 1000;
    this.recentKillTimes.push(now);
    this.recentKillTimes = this.recentKillTimes.filter(t => now - t < 20);
    const killsIn10s = this.recentKillTimes.filter(t => now - t < 10).length;
    if (killsIn10s >= 5) this.achievements.unlock('kill_streak_5', this.hud);
    if (this.recentKillTimes.length >= 10) this.achievements.unlock('kill_streak_10', this.hud);
    if (this.recentKillTimes.length >= 15) this.achievements.unlock('kill_streak_15', this.hud);
    const killsIn30s = this.recentKillTimes.filter(t => now - t < 30).length;
    if (killsIn30s >= 20) this.achievements.unlock('kill_streak_20', this.hud);

    // Coin achievements
    const coins = parseInt(localStorage.getItem('totalCoins') || '0');
    if (coins >= 100) this.achievements.unlock('coins_100', this.hud);
    if (coins >= 500) this.achievements.unlock('coins_500', this.hud);
    if (coins >= 1000) this.achievements.unlock('coins_1000', this.hud);
    if (coins >= 2500) this.achievements.unlock('coins_2500', this.hud);
    if (coins >= 5000) this.achievements.unlock('coins_5000', this.hud);
    if (coins >= 10000) this.achievements.unlock('coins_10000', this.hud);
    if (coins >= 25000) this.achievements.unlock('coins_25000', this.hud);
    if (coins >= 50000) this.achievements.unlock('coins_50000', this.hud);
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

  async checkGiftInbox() {
    const SUPABASE_URL = 'https://lijeewobwwiupncjfueq.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpamVld29id3dpdXBuY2pmdWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDkwNTQsImV4cCI6MjA4MDI4NTA1NH0.ttSbkrtcHDfu2YWTfDVLGBUOL6gPC97gHoZua_tqQeQ';
    const username = this.state.username.toLowerCase();

    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/gifts?recipient=eq.${encodeURIComponent(username)}&claimed=eq.false&select=id,item_id,item_name,from_username`,
        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
      );
      if (!res.ok) return;
      const gifts = await res.json();
      if (!gifts || gifts.length === 0) return;

      // Add each gifted item to purchases and auto-equip weapons
      const purchases = JSON.parse(localStorage.getItem('shopPurchases') || '{}');
      const giftMessages = [];
      const currentWeapon = localStorage.getItem('equippedWeapon') || 'pistol';
      let bestWeapon = currentWeapon;
      let bestTier = Shop.WEAPON_TIER[currentWeapon] || 0;
      const ids = [];

      for (const gift of gifts) {
        purchases[gift.item_id] = true;
        giftMessages.push(`${gift.item_name} from ${gift.from_username}`);
        ids.push(gift.id);

        // Auto-equip if it's a better weapon
        const weaponTier = Shop.WEAPON_TIER[gift.item_id];
        if (weaponTier !== undefined && weaponTier > bestTier) {
          bestWeapon = gift.item_id;
          bestTier = weaponTier;
        }
      }
      if (bestWeapon !== currentWeapon) {
        localStorage.setItem('equippedWeapon', bestWeapon);
      }
      localStorage.setItem('shopPurchases', JSON.stringify(purchases));
      this.shop.purchases = purchases;

      // Mark as claimed in Supabase
      await fetch(`${SUPABASE_URL}/rest/v1/gifts?id=in.(${ids.join(',')})`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ claimed: true }),
      });

      // Show notification popup
      const popup = document.createElement('div');
      popup.id = 'gift-received-popup';
      popup.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:9999;';
      popup.innerHTML = `
        <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border:3px solid #ffd700;border-radius:16px;padding:30px 40px;text-align:center;max-width:400px;">
          <h2 style="color:#ffd700;font-size:24px;margin-bottom:16px;">&#x1F381; You got gifts!</h2>
          <div style="color:#fff;font-size:16px;margin-bottom:20px;">
            ${giftMessages.map(m => `<div style="margin:8px 0;padding:8px;background:rgba(255,215,0,0.1);border-radius:8px;">${m}</div>`).join('')}
          </div>
          <button id="gift-received-ok" style="padding:10px 30px;font-size:16px;background:#ffd700;color:#000;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">AWESOME!</button>
        </div>
      `;
      document.body.appendChild(popup);
      this.achievements.unlock('gift_receive', this.hud);
      document.getElementById('gift-received-ok').addEventListener('click', () => {
        popup.remove();
      });
    } catch (e) {
      // Silently fail — gifts will be picked up next time
    }
  }

  renderLeaderboard() {
    const lb = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    const listEl = document.getElementById('leaderboard-list');
    if (!listEl) return;
    if (lb.length === 0) {
      listEl.innerHTML = '<div style="color:#666;">No entries yet</div>';
      return;
    }
    listEl.innerHTML = lb.slice(0, 5).map((e, i) =>
      `<div class="lb-entry"><span class="lb-name">${i + 1}. ${e.name}</span><span class="lb-score">${e.kills} kills</span></div>`
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
    this.achievements.unlock('emote_use', this.hud);

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

    // Sword-only achievement: beat a level without firing the gun
    if (!this.gunUsedThisLevel) {
      this.achievements.unlock('sword_only', this.hud);
    }

    // No damage achievement
    if (!this.damageTakenThisLevel) {
      this.achievements.unlock('no_damage', this.hud);
      this.noDamageLevels = (this.noDamageLevels || 0) + 1;
      if (this.noDamageLevels >= 3) this.achievements.unlock('no_damage_3', this.hud);
    }

    // Speed run achievement (under 90 seconds)
    const levelTime = (performance.now() / 1000) - this.levelStartTime;
    if (levelTime < 90) {
      this.achievements.unlock('quick_clear', this.hud);
    }
    if (levelTime < 60) {
      this.achievements.unlock('speed_run_60', this.hud);
    }
    if (levelTime < 30) {
      this.achievements.unlock('speed_run_30', this.hud);
    }

    // Close call — beat level with under 10 HP
    if (this.state.health > 0 && this.state.health < 10) {
      this.achievements.unlock('low_health_win', this.hud);
    }

    // Level progress achievements
    if (this.state.currentLevel >= 2) this.achievements.unlock('level_3', this.hud);
    if (this.state.currentLevel >= 4) this.achievements.unlock('level_5', this.hud);

    // Per-level achievements
    const levelAchievements = [
      'beat_castle', 'beat_forest', 'beat_sky', 'beat_lava', 'beat_ice',
      'beat_shadow', 'beat_storm', 'beat_swamp', 'beat_crystal', 'beat_void'
    ];
    if (levelAchievements[this.state.currentLevel]) {
      this.achievements.unlock(levelAchievements[this.state.currentLevel], this.hud);
    }

    // Boss kill tracking (each level has a boss)
    this.bossKillsTotal++;
    localStorage.setItem('bossKills', this.bossKillsTotal.toString());
    this.achievements.unlock('boss_kill', this.hud);
    if (this.bossKillsTotal >= 3) this.achievements.unlock('boss_3', this.hud);
    if (this.bossKillsTotal >= 5) this.achievements.unlock('boss_5', this.hud);
    if (this.bossKillsTotal >= 10) this.achievements.unlock('boss_10', this.hud);
    if (this.bossKillsTotal >= 25) this.achievements.unlock('boss_25', this.hud);
    if (this.bossKillsTotal >= 50) this.achievements.unlock('boss_50', this.hud);

    const totalLevels = this.enemyManager.getTotalLevels();

    if (this.state.currentLevel >= totalLevels - 1) {
      // Beat the whole game!
      this.achievements.unlock('beat_game', this.hud);
      this.beatGameCount = (parseInt(localStorage.getItem('beatGameCount') || '0')) + 1;
      localStorage.setItem('beatGameCount', this.beatGameCount.toString());
      if (this.beatGameCount >= 3) this.achievements.unlock('beat_game_3', this.hud);
      if (this.beatGameCount >= 5) this.achievements.unlock('beat_game_5', this.hud);
      // Start the bonus party level!
      this.startPartyLevel();
    } else {
      // Show level complete screen
      const config = this.enemyManager.getLevelConfig();
      document.getElementById('level-complete-text').textContent =
        `You cleared ${config ? config.name : 'the level'}!`;
      document.getElementById('level-complete').style.display = 'flex';
      document.exitPointerLock();
    }
  }

  startPartyLevel() {
    this.partyMode = true;
    this.state.levelComplete = true; // Prevent checkLevelComplete from running
    this.survivalMode = false;
    this.practiceMode = false;

    // Clear ALL enemies first
    this.enemyManager.clearAll();
    this.enemyManager.enemies = [];
    this.enemyManager.bossDefeated = true;

    // Build the Castle map (bright green) with party decorations on top
    this.world.buildLevel(0);
    this.world.addPartyDecorations();

    // Teleport player to the arena
    this.player.mesh.position = new BABYLON.Vector3(0, 2, -15);
    if (this.player.mesh.physicsImpostor) {
      this.player.mesh.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
    }

    // Full health and ammo for celebration
    this.state.health = this.state.maxHealth;
    this.state.ammo = { fire: 9999, ice: 9999, lightning: 9999 };

    // Show celebration message
    this.hud.showMessage('YOU BEAT THE GAME! PARTY TIME!');
    this.chat.levelMsg('CONGRATULATIONS! You conquered all levels!');

    // Party achievements
    this.achievements.unlock('party_time', this.hud);
    this.partyVisits = (this.partyVisits || parseInt(localStorage.getItem('partyVisits') || '0')) + 1;
    localStorage.setItem('partyVisits', this.partyVisits.toString());
    if (this.partyVisits >= 5) this.achievements.unlock('party_5', this.hud);

    // Keep pointer locked for exploring
    this.canvas.requestPointerLock();

    // Start firework effects
    this._partyFireworkTimer = 0;
    this._partyFireworks = [];
    this._partyDuration = 0;

    // Spawn dancing NPCs
    this._partyNPCs = [];
    this._spawnDancingNPCs();

    // Create party HUD overlay
    this._createPartyHUD();
  }

  _createPartyHUD() {
    const el = document.createElement('div');
    el.id = 'party-hud';
    el.innerHTML = `
      <div style="position:fixed;top:30px;left:50%;transform:translateX(-50%);
        font-size:48px;font-weight:bold;color:#FFD700;text-shadow:0 0 20px #FF6600,0 0 40px #FF3300;
        font-family:Arial,sans-serif;z-index:100;text-align:center;pointer-events:none;">
        CONGRATULATIONS!<br>
        <span style="font-size:28px;color:#FFF;">You conquered Knights Quest!</span>
      </div>
      <div style="position:fixed;bottom:30px;left:50%;transform:translateX(-50%);
        font-size:18px;color:#FFF;text-shadow:0 0 10px #000;
        font-family:Arial,sans-serif;z-index:100;pointer-events:none;">
        Press ESC to return to menu
      </div>
    `;
    document.body.appendChild(el);
    this._partyHudEl = el;

    // ESC to end party
    this._partyEscHandler = (e) => {
      if (e.code === 'Escape') this._endParty();
    };
    window.addEventListener('keydown', this._partyEscHandler);
  }

  _endParty() {
    this.partyMode = false;

    // Clean up fireworks
    if (this._partyFireworks) {
      this._partyFireworks.forEach(ps => ps.dispose());
      this._partyFireworks = [];
    }

    // Clean up dancing NPCs
    if (this._partyNPCs) {
      this._partyNPCs.forEach(npc => {
        if (npc.root) {
          npc.root.getChildMeshes().forEach(m => {
            if (m.material) m.material.dispose();
            m.dispose();
          });
          npc.root.dispose();
        }
      });
      this._partyNPCs = [];
    }

    // Remove party HUD
    if (this._partyHudEl) {
      this._partyHudEl.remove();
      this._partyHudEl = null;
    }

    // Remove ESC handler
    if (this._partyEscHandler) {
      window.removeEventListener('keydown', this._partyEscHandler);
      this._partyEscHandler = null;
    }

    // Show victory screen
    this.soundManager.stopMusic();
    document.getElementById('victory-score').textContent = this.state.score;
    document.getElementById('victory-screen').style.display = 'flex';
    this.hud.hide();
    document.exitPointerLock();
  }

  _spawnDancingNPCs() {
    const npcConfigs = [
      { pos: [8, 0, 5], color: [1, 0.2, 0.2], name: 'RedDancer', dance: 'bounce' },
      { pos: [-8, 0, 5], color: [0.2, 0.5, 1], name: 'BlueDancer', dance: 'spin' },
      { pos: [5, 0, -8], color: [0.2, 1, 0.3], name: 'GreenDancer', dance: 'wave' },
      { pos: [-5, 0, -8], color: [1, 0.85, 0.1], name: 'GoldDancer', dance: 'bounce' },
      { pos: [12, 0, -3], color: [0.8, 0.2, 1], name: 'PurpleDancer', dance: 'spin' },
      { pos: [-12, 0, -3], color: [1, 0.5, 0.1], name: 'OrangeDancer', dance: 'wave' },
      { pos: [0, 0, 10], color: [0.1, 1, 1], name: 'CyanDancer', dance: 'bounce' },
      { pos: [0, 0, -12], color: [1, 0.3, 0.6], name: 'PinkDancer', dance: 'spin' },
      // More NPCs in a wider circle
      { pos: [15, 0, 10], color: [1, 1, 0.3], name: 'YellowDancer', dance: 'wave' },
      { pos: [-15, 0, 10], color: [0.3, 1, 0.6], name: 'MintDancer', dance: 'bounce' },
      { pos: [18, 0, -8], color: [1, 0.4, 0.4], name: 'CoralDancer', dance: 'spin' },
      { pos: [-18, 0, -8], color: [0.4, 0.4, 1], name: 'IndigoDancer', dance: 'wave' },
    ];

    npcConfigs.forEach((cfg, i) => {
      const npc = this._createDancingNPC(cfg, i);
      this._partyNPCs.push(npc);
    });
  }

  _createDancingNPC(cfg, index) {
    const scene = this.scene;
    const root = new BABYLON.TransformNode('npc_' + cfg.name, scene);
    root.position = new BABYLON.Vector3(cfg.pos[0], cfg.pos[1], cfg.pos[2]);

    const bodyColor = new BABYLON.Color3(cfg.color[0], cfg.color[1], cfg.color[2]);
    const mat = new BABYLON.StandardMaterial('npcMat_' + index, scene);
    mat.diffuseColor = bodyColor;
    mat.emissiveColor = bodyColor.scale(0.3);

    const skinMat = new BABYLON.StandardMaterial('npcSkin_' + index, scene);
    skinMat.diffuseColor = new BABYLON.Color3(0.95, 0.75, 0.6);
    skinMat.emissiveColor = new BABYLON.Color3(0.2, 0.15, 0.1);

    // Body (torso)
    const body = BABYLON.MeshBuilder.CreateBox('npcBody', {
      width: 0.7, height: 0.9, depth: 0.4
    }, scene);
    body.position.y = 1.4;
    body.parent = root;
    body.material = mat;

    // Head
    const head = BABYLON.MeshBuilder.CreateSphere('npcHead', {
      diameter: 0.5, segments: 8
    }, scene);
    head.position.y = 2.15;
    head.parent = root;
    head.material = skinMat;

    // Hat (party hat!)
    const hatMat = new BABYLON.StandardMaterial('npcHat_' + index, scene);
    hatMat.diffuseColor = bodyColor;
    hatMat.emissiveColor = bodyColor.scale(0.5);
    const hat = BABYLON.MeshBuilder.CreateCylinder('npcHat', {
      height: 0.5, diameterTop: 0, diameterBottom: 0.4, tessellation: 8
    }, scene);
    hat.position.y = 2.55;
    hat.parent = root;
    hat.material = hatMat;

    // Left arm
    const leftArm = BABYLON.MeshBuilder.CreateBox('npcLArm', {
      width: 0.2, height: 0.7, depth: 0.2
    }, scene);
    leftArm.position.set(-0.55, 1.5, 0);
    leftArm.parent = root;
    leftArm.material = mat;
    // Pivot at shoulder
    leftArm.setPivotPoint(new BABYLON.Vector3(0, 0.35, 0));

    // Right arm
    const rightArm = BABYLON.MeshBuilder.CreateBox('npcRArm', {
      width: 0.2, height: 0.7, depth: 0.2
    }, scene);
    rightArm.position.set(0.55, 1.5, 0);
    rightArm.parent = root;
    rightArm.material = mat;
    rightArm.setPivotPoint(new BABYLON.Vector3(0, 0.35, 0));

    // Left leg
    const leftLeg = BABYLON.MeshBuilder.CreateBox('npcLLeg', {
      width: 0.25, height: 0.7, depth: 0.25
    }, scene);
    leftLeg.position.set(-0.2, 0.35, 0);
    leftLeg.parent = root;
    leftLeg.material = mat;

    // Right leg
    const rightLeg = BABYLON.MeshBuilder.CreateBox('npcRLeg', {
      width: 0.25, height: 0.7, depth: 0.25
    }, scene);
    rightLeg.position.set(0.2, 0.35, 0);
    rightLeg.parent = root;
    rightLeg.material = mat;

    // Eyes (two small white spheres with black pupils)
    const eyeMat = new BABYLON.StandardMaterial('eyeMat_' + index, scene);
    eyeMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
    eyeMat.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);

    const leftEye = BABYLON.MeshBuilder.CreateSphere('npcLEye', { diameter: 0.1 }, scene);
    leftEye.position.set(-0.1, 2.2, 0.22);
    leftEye.parent = root;
    leftEye.material = eyeMat;

    const rightEye = BABYLON.MeshBuilder.CreateSphere('npcREye', { diameter: 0.1 }, scene);
    rightEye.position.set(0.1, 2.2, 0.22);
    rightEye.parent = root;
    rightEye.material = eyeMat;

    // Smile
    const smileMat = new BABYLON.StandardMaterial('smileMat_' + index, scene);
    smileMat.diffuseColor = new BABYLON.Color3(0.2, 0.1, 0.05);
    smileMat.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0.02);

    const smile = BABYLON.MeshBuilder.CreateTorus('npcSmile', {
      diameter: 0.15, thickness: 0.025, tessellation: 12
    }, scene);
    smile.position.set(0, 2.08, 0.23);
    smile.rotation.x = Math.PI * 0.3;
    smile.parent = root;
    smile.material = smileMat;

    return {
      root,
      head,
      body,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      hat,
      dance: cfg.dance,
      time: Math.random() * Math.PI * 2, // offset so they don't all sync
      speed: 2.5 + Math.random() * 1.5,
    };
  }

  _updateDancingNPCs(deltaTime) {
    if (!this._partyNPCs) return;

    for (const npc of this._partyNPCs) {
      npc.time += deltaTime * npc.speed;
      const t = npc.time;

      if (npc.dance === 'bounce') {
        // Bounce up and down, arms pumping
        npc.root.position.y = Math.abs(Math.sin(t * 2)) * 0.5;
        npc.leftArm.rotation.x = Math.sin(t * 2) * 1.2;
        npc.rightArm.rotation.x = -Math.sin(t * 2) * 1.2;
        npc.leftLeg.rotation.x = Math.sin(t * 2) * 0.3;
        npc.rightLeg.rotation.x = -Math.sin(t * 2) * 0.3;
        npc.root.rotation.y = Math.sin(t * 0.5) * 0.3;
      } else if (npc.dance === 'spin') {
        // Spin around with arms out
        npc.root.rotation.y += deltaTime * 3;
        npc.root.position.y = Math.abs(Math.sin(t * 1.5)) * 0.3;
        npc.leftArm.rotation.z = Math.PI * 0.6 + Math.sin(t * 3) * 0.3;
        npc.rightArm.rotation.z = -(Math.PI * 0.6 + Math.sin(t * 3) * 0.3);
        npc.head.rotation.z = Math.sin(t * 2) * 0.2;
      } else if (npc.dance === 'wave') {
        // Side-to-side sway with one arm waving
        npc.root.position.y = Math.abs(Math.sin(t * 1.8)) * 0.2;
        npc.body.rotation.z = Math.sin(t * 1.8) * 0.15;
        npc.leftArm.rotation.z = Math.sin(t * 3) * 0.8 + 0.5;
        npc.rightArm.rotation.x = Math.sin(t * 2.5) * 1.0;
        npc.leftLeg.rotation.x = Math.sin(t * 1.8) * 0.2;
        npc.rightLeg.rotation.x = -Math.sin(t * 1.8) * 0.2;
        npc.root.rotation.y = Math.sin(t * 0.3) * 0.5;
      }

      // Hat bobble
      npc.hat.rotation.z = Math.sin(t * 4) * 0.15;
    }
  }

  _spawnFirework() {
    const colors = [
      new BABYLON.Color4(1, 0.2, 0.2, 1),    // red
      new BABYLON.Color4(0.2, 0.5, 1, 1),    // blue
      new BABYLON.Color4(0.2, 1, 0.3, 1),    // green
      new BABYLON.Color4(1, 0.85, 0.1, 1),   // gold
      new BABYLON.Color4(0.8, 0.2, 1, 1),    // purple
      new BABYLON.Color4(1, 0.5, 0.1, 1),    // orange
      new BABYLON.Color4(0.1, 1, 1, 1),      // cyan
      new BABYLON.Color4(1, 0.3, 0.6, 1),    // pink
    ];

    const color = colors[Math.floor(Math.random() * colors.length)];
    const color2 = colors[Math.floor(Math.random() * colors.length)];

    const ps = new BABYLON.ParticleSystem('firework', 150, this.scene);
    ps.createPointEmitter(
      new BABYLON.Vector3(-1, -1, -1),
      new BABYLON.Vector3(1, 1, 1)
    );

    // Random position in the sky above the arena
    ps.emitter = new BABYLON.Vector3(
      (Math.random() - 0.5) * 40,
      10 + Math.random() * 15,
      (Math.random() - 0.5) * 40
    );

    ps.color1 = color;
    ps.color2 = color2;
    ps.colorDead = new BABYLON.Color4(color.r * 0.3, color.g * 0.3, color.b * 0.3, 0);

    ps.minSize = 0.2;
    ps.maxSize = 0.6;
    ps.minLifeTime = 0.5;
    ps.maxLifeTime = 1.5;
    ps.emitRate = 0;  // burst mode
    ps.manualEmitCount = 100 + Math.floor(Math.random() * 80);
    ps.gravity = new BABYLON.Vector3(0, -5, 0);
    ps.minEmitPower = 5;
    ps.maxEmitPower = 12;
    ps.updateSpeed = 0.02;
    ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    ps.targetStopDuration = 0.1;
    ps.disposeOnStop = true;

    ps.start();

    // Track for cleanup
    this._partyFireworks.push(ps);

    // Remove disposed ones from the array
    this._partyFireworks = this._partyFireworks.filter(p => !p._stopped);
  }

  damagePlayer(amount) {
    if (this.state.dead) return;
    if (this.partyMode) return; // No damage during party!
    if (this.player && this.player.invincible) return;

    if (this.state.shieldActive) {
      this.achievements.unlock('shield_block', this.hud);
      this.shieldBlocks = (this.shieldBlocks || 0) + 1;
      if (this.shieldBlocks >= 50) this.achievements.unlock('shield_master', this.hud);
      return;
    }

    this.damageTakenThisLevel = true;
    this.state.health = Math.max(0, this.state.health - amount);
    this.soundManager.play('playerHurt');
    this.hud.update();

    if (this.state.health <= 0) {
      this.state.dead = true;

      // PvP mode: auto-respawn after 3 seconds instead of game over
      if (this._multiplayerMode === 'pvp' && this.network.connected) {
        this.pvpDead = true;
        this.pvpRespawnTimer = 3;
        this.hud.showMessage('Respawning in 3...');
        return;
      }

      this.deathCount++;
      localStorage.setItem('deathCount', this.deathCount.toString());
      this.achievements.unlock('died_first', this.hud);
      if (this.deathCount >= 10) this.achievements.unlock('died_10', this.hud);
      if (this.deathCount >= 50) this.achievements.unlock('died_50', this.hud);
      if (this.deathCount >= 100) this.achievements.unlock('died_100', this.hud);
      if (this.deathCount >= 250) this.achievements.unlock('died_250', this.hud);
      this.soundManager.stopMusic();
      if (this.survivalTimerEl) this.survivalTimerEl.style.display = 'none';
      document.exitPointerLock();

      // Start killcam replay if we have recorded frames
      if (this.replayBuffer.length > 10) {
        this.startKillcam();
      } else {
        this.showGameOver();
      }
    }
  }

  showGameOver() {
    document.getElementById('final-score').textContent = this.state.score;
    document.getElementById('game-over').style.display = 'flex';
    this.hud.hide();
    // Hide killcam overlay
    const overlay = document.getElementById('killcam-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  startKillcam() {
    this.replayPlaying = true;
    this.replayIndex = 0;
    this.replayTimer = 0;
    this.replayStartTime = this.replayBuffer[0].time;
    this.replayDuration = this.replayBuffer[this.replayBuffer.length - 1].time - this.replayStartTime;

    // Show killcam overlay
    let overlay = document.getElementById('killcam-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'killcam-overlay';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = '<div class="killcam-text">KILLCAM</div><div class="killcam-bar"><div class="killcam-progress"></div></div>';
    overlay.style.display = 'block';

    // Make player mesh visible during replay so you can see yourself
    this.player.mesh.getChildMeshes().forEach(child => {
      child.isVisible = true;
    });
  }

  updateKillcam(deltaTime) {
    if (!this.replayPlaying) return;

    this.replayTimer += deltaTime;
    const progress = this.replayTimer / this.replayDuration;

    // Update progress bar
    const bar = document.querySelector('.killcam-progress');
    if (bar) bar.style.width = (Math.min(progress, 1) * 100) + '%';

    // Find current frame
    const targetTime = this.replayStartTime + this.replayTimer;
    while (this.replayIndex < this.replayBuffer.length - 1 &&
           this.replayBuffer[this.replayIndex + 1].time <= targetTime) {
      this.replayIndex++;
    }

    const frame = this.replayBuffer[this.replayIndex];
    if (frame) {
      // Position camera behind and above where the player was (3rd person view)
      const behindDist = 6;
      const aboveHeight = 3;
      const camX = frame.px - Math.sin(frame.yaw) * behindDist;
      const camZ = frame.pz - Math.cos(frame.yaw) * behindDist;
      const camY = frame.py + 1.5 + aboveHeight;

      this.camera.position.set(camX, camY, camZ);
      this.camera.setTarget(new BABYLON.Vector3(frame.px, frame.py + 1.0, frame.pz));

      // Move the player mesh to the recorded position
      this.player.mesh.position.set(frame.px, frame.py, frame.pz);
      this.player.mesh.rotation.y = frame.yaw;
    }

    // Replay finished
    if (this.replayTimer >= this.replayDuration) {
      this.replayPlaying = false;
      // Hide player mesh again
      this.player.mesh.getChildMeshes().forEach(child => {
        child.isVisible = false;
      });
      // Short pause then show game over
      setTimeout(() => this.showGameOver(), 500);
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
    // No scene ambient color — let hemispheric + directional lights handle everything
    // (setting ambientColor requires every material to also set ambientColor or they go black)

    // Hemispheric light — good sky + ground fill
    const hemiLight = new BABYLON.HemisphericLight(
      'hemi',
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    );
    hemiLight.intensity = 1.6;
    hemiLight.diffuse = new BABYLON.Color3(1, 1, 1);
    hemiLight.groundColor = new BABYLON.Color3(0.7, 0.7, 0.7);

    // Sun — angled so it lights the ground nicely
    this.sunLight = new BABYLON.DirectionalLight(
      'sun',
      new BABYLON.Vector3(-0.5, -1, -0.3),
      this.scene
    );
    this.sunLight.intensity = 1.5;
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

      if (this.state.started && !this.state.paused && !this.state.dead && (!this.state.levelComplete || this.partyMode)) {
        this.update(deltaTime);
      }

      // Play killcam replay when dead
      if (this.replayPlaying) {
        this.updateKillcam(deltaTime);
      }

      // Trailer mode update
      if (this.trailerMode && this.trailerMode.active) {
        this.trailerMode.update(deltaTime);
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

    // Update enemies (skip during party mode)
    if (!this.partyMode) {
      this.enemyManager.update(deltaTime, this);
    }

    // Update combat (attacks, projectiles — always update projectiles, block new attacks if shielded)
    // In survival mode, block ALL player attacks (sword + gun)
    const blockAttacks = this.state.shieldActive || this.survivalMode;
    this.combatSystem.update(deltaTime, this.inputManager, blockAttacks);

    // Track gun usage for sword-only achievement
    if (this.combatSystem.gunFiredThisFrame) {
      this.gunUsedThisLevel = true;
      this.combatSystem.gunFiredThisFrame = false;
    }

    // Check sword kill achievement
    if (this.combatSystem.swordKilledThisFrame) {
      this.swordKillsTotal++;
      localStorage.setItem('swordKills', this.swordKillsTotal.toString());
      this.achievements.unlock('sword_kill', this.hud);
      if (this.swordKillsTotal >= 10) this.achievements.unlock('sword_10', this.hud);
      if (this.swordKillsTotal >= 25) this.achievements.unlock('sword_25', this.hud);
      if (this.swordKillsTotal >= 50) this.achievements.unlock('sword_50', this.hud);
      if (this.swordKillsTotal >= 100) this.achievements.unlock('sword_100', this.hud);
      if (this.swordKillsTotal >= 250) this.achievements.unlock('sword_250', this.hud);
      this.combatSystem.swordKilledThisFrame = false;
    }

    // Check headshot achievement
    if (this.combatSystem.headshotThisFrame) {
      this.headshotsTotal++;
      localStorage.setItem('headshots', this.headshotsTotal.toString());
      this.achievements.unlock('headshot', this.hud);
      if (this.headshotsTotal >= 10) this.achievements.unlock('headshot_10', this.hud);
      if (this.headshotsTotal >= 25) this.achievements.unlock('headshot_25', this.hud);
      if (this.headshotsTotal >= 50) this.achievements.unlock('headshot_50', this.hud);
      if (this.headshotsTotal >= 100) this.achievements.unlock('headshot_100', this.hud);
      if (this.headshotsTotal >= 250) this.achievements.unlock('headshot_250', this.hud);
      this.combatSystem.headshotThisFrame = false;
    }

    // Update pickups
    this.pickupManager.update(deltaTime, this, this.inputManager);

    // Update friends
    this.friendManager.update(deltaTime, this);

    // Update practice mode
    if (this.practice && this.practice.active) {
      this.practice.update(deltaTime);
    }

    // Height and exploration achievements
    const py = this.player.mesh.position.y;
    if (py >= 20) this.achievements.unlock('reach_height_20', this.hud);
    if (py >= 50) this.achievements.unlock('reach_height_50', this.hud);
    const px = this.player.mesh.position.x;
    const pz = this.player.mesh.position.z;
    if (Math.abs(px) > 120 || Math.abs(pz) > 120) this.achievements.unlock('edge_of_map', this.hud);

    // Update pet
    if (this.activePet) {
      this.activePet.update(deltaTime, this.enemyManager, this.state);
      if (this.activePet.petGotKill) {
        this.activePet.petGotKill = false;
        this.achievements.unlock('pet_kill', this.hud);
      }
    }

    // Track alive enemies
    this.state.enemiesAlive = this.enemyManager.getAliveEnemies().length;

    // Check level complete (not in survival or practice mode)
    if (!this.survivalMode && !this.practiceMode && !this.partyMode) {
      this.checkLevelComplete();
    }

    // Party mode fireworks
    if (this.partyMode) {
      this._partyDuration += deltaTime;
      this._partyFireworkTimer += deltaTime;
      // Spawn firework every 0.4-0.8 seconds
      if (this._partyFireworkTimer > 0.4 + Math.random() * 0.4) {
        this._partyFireworkTimer = 0;
        this._spawnFirework();
      }
      // Keep health and ammo full during party
      this.state.health = this.state.maxHealth;
      // Animate dancing NPCs
      this._updateDancingNPCs(deltaTime);

      // Spin the disco ball
      const discoBall = this.scene.getMeshByName('discoBall');
      if (discoBall) discoBall.rotation.y += deltaTime * 1.5;

      // Spin platforms
      for (let i = 0; i < 3; i++) {
        const plat = this.scene.getMeshByName('spinPlat' + i);
        if (plat) plat.rotation.y += deltaTime * (1.5 + i * 0.5);
        const star = this.scene.getMeshByName('spinStar' + i);
        if (star) star.rotation.y -= deltaTime * (2 + i * 0.5);
      }

      // Bobbing balloons
      for (let i = 0; i < 20; i++) {
        const b = this.scene.getMeshByName('balloon' + i);
        if (b) b.position.y += Math.sin(this._partyDuration * 1.5 + i) * 0.003;
      }

      // Trampoline bounce — if player is near a trampoline, bounce them up!
      const trampolines = [[-15, 15], [15, 15], [-15, -15], [15, -15]];
      const pPos = this.player.mesh.position;
      for (const [tx, tz] of trampolines) {
        const dx = pPos.x - tx;
        const dz = pPos.z - tz;
        if (Math.sqrt(dx * dx + dz * dz) < 2.5 && pPos.y < 2.5) {
          if (this.player.mesh.physicsImpostor) {
            this.player.mesh.physicsImpostor.setLinearVelocity(
              new BABYLON.Vector3(0, 22, 0)
            );
            this.achievements.unlock('party_bounce', this.hud);
          }
        }
      }

      // Height achievements
      if (pPos.y >= 20) this.achievements.unlock('reach_height_20', this.hud);
      if (pPos.y >= 50) this.achievements.unlock('reach_height_50', this.hud);

      // Flickering candle flames
      for (let i = 0; i < 5; i++) {
        const flame = this.scene.getMeshByName('flame' + i);
        if (flame) {
          flame.scaling.y = 0.8 + Math.random() * 0.5;
          flame.scaling.x = 0.8 + Math.random() * 0.3;
        }
      }
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
        document.getElementById('survival-victory').style.display = 'flex';
        this.state.levelComplete = true;
        this.achievements.unlock('survive', this.hud);
        this.survivalWins = (this.survivalWins || 0) + 1;
        if (this.survivalWins >= 3) this.achievements.unlock('survive_3', this.hud);
        if (this.survivalWins >= 5) this.achievements.unlock('survive_5', this.hud);
        if (this.state.health <= this.state.maxHealth * 0.5) this.achievements.unlock('survive_half_hp', this.hud);
        if (!this.damageTakenThisLevel) this.achievements.unlock('survive_no_damage', this.hud);
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
      this.achievements.unlock('fall_death', this.hud);
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
            if (newRank === 'Legend') this.achievements.unlock('max_rank', this.hud);
            this.saveProgress();
          }
          break;
        }
      }
    }

    // Record frame for death replay (killcam)
    this._replayTime = (this._replayTime || 0) + deltaTime;
    this.replayBuffer.push({
      px: playerPos.x, py: playerPos.y, pz: playerPos.z,
      yaw: this._cameraYaw, pitch: this._cameraPitch,
      time: this._replayTime
    });
    // Trim old frames beyond 5 seconds
    const cutoff = this._replayTime - this.replayMaxTime;
    while (this.replayBuffer.length > 0 && this.replayBuffer[0].time < cutoff) {
      this.replayBuffer.shift();
    }

    // Play time tracking
    this.totalPlayTime += deltaTime;
    this._playTimeSaveTimer = (this._playTimeSaveTimer || 0) + deltaTime;
    if (this._playTimeSaveTimer >= 10) {
      this._playTimeSaveTimer = 0;
      localStorage.setItem('totalPlayTime', this.totalPlayTime.toString());
    }
    if (this.totalPlayTime >= 1800) this.achievements.unlock('play_time_30', this.hud);
    if (this.totalPlayTime >= 3600) this.achievements.unlock('play_time_60', this.hud);
    if (this.totalPlayTime >= 10800) this.achievements.unlock('play_time_180', this.hud);
    if (this.totalPlayTime >= 36000) this.achievements.unlock('play_time_600', this.hud);

    // Friend rescue achievements
    const rescued = this.friendManager.getRescuedCount();
    if (rescued >= 1) this.achievements.unlock('rescue_friend', this.hud);
    if (rescued >= 3) this.achievements.unlock('rescue_3', this.hud);
    if (rescued >= 6) this.achievements.unlock('rescue_all', this.hud);

    // Multiplayer: send player state and update remote player
    if (this.network.connected) {
      this._updateMultiplayer(deltaTime);
    }

    // Update HUD
    this.hud.update();
    this.hud.updateMinimap(this.player, this.enemyManager);
  }

  // ==================== MULTIPLAYER ====================

  _onPeerConnected() {
    // Tell shop we're connected so gifting works
    this.shop._networkConnected = true;

    // Hide lobby
    document.getElementById('multiplayer-lobby').style.display = 'none';

    // Send handshake
    this.network.send('hs', {
      username: this.state.username,
      skin: localStorage.getItem('knightSkin') || 'silver',
      mode: this._multiplayerMode,
    });

    if (this._multiplayerMode === 'pvp') {
      this._startPvP();
    } else {
      this._startCoop();
    }
  }

  _onPeerDisconnected() {
    this.shop._networkConnected = false;
    if (this.remotePlayer) {
      this.remotePlayer.dispose();
      this.remotePlayer = null;
    }
    if (this.pvpArena) {
      this.pvpArena.dispose();
      this.pvpArena = null;
    }
    this.hud.showMessage('Other player disconnected!');
    // After 3 seconds, return to menu
    setTimeout(() => {
      document.getElementById('start-screen').style.display = 'flex';
      this.state.started = false;
      this.hud.hide();
      document.exitPointerLock();
      document.getElementById('pvp-score').style.display = 'none';
    }, 3000);
  }

  _onNetworkMessage(type, data) {
    switch (type) {
      case 'hs': // Handshake
        if (!this.remotePlayer) {
          this.remotePlayer = new RemotePlayer(this.scene, data.username, data.skin);
        }
        break;

      case 'ps': // Player state
        if (this.remotePlayer) {
          this.remotePlayer.setTarget(
            { x: data.x, y: data.y, z: data.z },
            data.ry
          );
          this.remotePlayer.health = data.hp;
        }
        break;

      case 'de': // Damage event — other player hit us
        if (this._multiplayerMode === 'pvp') {
          this.damagePlayer(data.amount);
          if (this.state.dead) {
            this.network.send('pd', {});
            this.pvpDead = true;
            this.pvpRespawnTimer = 3;
            // Other player scored
            if (this.network.isHost) {
              this.pvpScores.client++;
            } else {
              this.pvpScores.host++;
            }
            this._updatePvPScore();
            this._checkPvPWin();
          }
        }
        break;

      case 'pd': // Other player died
        if (this.remotePlayer) {
          this.remotePlayer.die();
          // We scored!
          if (this.network.isHost) {
            this.pvpScores.host++;
          } else {
            this.pvpScores.client++;
          }
          this._updatePvPScore();
          this._checkPvPWin();
          this.hud.showMessage('KILL!');
        }
        break;

      case 'pr': // Other player respawned
        if (this.remotePlayer) {
          this.remotePlayer.respawn({ x: data.x, y: data.y, z: data.z });
        }
        break;

      case 'pj': // Remote projectile (visual only)
        this._spawnRemoteProjectile(data);
        break;

      case 'sa': // Remote sword attack (visual only)
        // Could add sword swing animation here
        break;

      case 'ch': // Chat message
        if (this.chat) {
          this.chat.addMessage(data.username, data.text);
        }
        break;

      case 'pw': // PvP win notification
        this._showPvPEnd(false);
        break;

      case 'gi': // Gift received
        if (this.shop) {
          this.shop.receiveGift(data.itemId, data.username);
        }
        break;
    }
  }

  _startPvP() {
    // Reset scores
    this.pvpScores = { host: 0, client: 0 };
    this.pvpDead = false;

    // Build arena
    this.world.dispose();
    this.pvpArena = new PvPArena(this.scene);
    this.pvpArena.build();

    // Start the game
    this.state.started = true;
    this.state.dead = false;
    this.state.health = this.state.maxHealth;
    this.state.ammo = { fire: 9999, ice: 9999, lightning: 9999 };

    // Teleport to spawn
    const spawn = this.network.isHost ? this.pvpArena.spawnA : this.pvpArena.spawnB;
    this.player.mesh.position.copyFrom(spawn);
    if (this.player.mesh.physicsImpostor) {
      this.player.mesh.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
    }

    // Create remote player if not yet
    if (!this.remotePlayer) {
      this.remotePlayer = new RemotePlayer(this.scene, 'Opponent', 'red');
    }
    const remoteSpawn = this.network.isHost ? this.pvpArena.spawnB : this.pvpArena.spawnA;
    this.remotePlayer.respawn(remoteSpawn);

    // Show PvP score
    const pvpScore = document.getElementById('pvp-score');
    pvpScore.style.display = 'block';
    document.getElementById('pvp-host-name').textContent = this.network.isHost ? this.state.username : 'Opponent';
    document.getElementById('pvp-client-name').textContent = this.network.isHost ? 'Opponent' : this.state.username;
    this._updatePvPScore();

    // Show HUD and lock pointer
    this.hud.show();
    this.canvas.requestPointerLock();
    this.hud.showMessage('1v1 PVP — First to 5 kills wins!');
  }

  _startCoop() {
    // Start level 0 together
    this.state.started = true;
    this.state.dead = false;
    this.startLevel(0);

    // Give ammo for co-op
    this.state.ammo = { fire: 50, ice: 50, lightning: 50 };

    // Create remote player if not yet
    if (!this.remotePlayer) {
      this.remotePlayer = new RemotePlayer(this.scene, 'Ally', 'blue');
    }
    this.remotePlayer.respawn(new BABYLON.Vector3(2, 2, 10));

    this.hud.show();
    this.canvas.requestPointerLock();
    this.hud.showMessage('CO-OP MODE — Fight together!');
  }

  _updateMultiplayer(deltaTime) {
    // Send player state at 20Hz (rate limited by NetworkManager)
    this.network.send('ps', {
      x: this.player.mesh.position.x,
      y: this.player.mesh.position.y,
      z: this.player.mesh.position.z,
      ry: this._cameraYaw,
      hp: this.state.health,
    });

    // Update remote player interpolation
    if (this.remotePlayer) {
      this.remotePlayer.update(deltaTime);
    }

    // PvP respawn timer
    if (this.pvpDead && this.pvpRespawnTimer > 0) {
      this.pvpRespawnTimer -= deltaTime;
      if (this.pvpRespawnTimer <= 0) {
        this._pvpRespawn();
      }
    }

    // PvP: check if our projectiles/sword hit the remote player
    if (this._multiplayerMode === 'pvp' && this.remotePlayer && this.remotePlayer.alive) {
      this._checkRemotePlayerHits();
    }
  }

  _checkRemotePlayerHits() {
    if (!this.remotePlayer || !this.remotePlayer.alive) return;

    const remotePos = this.remotePlayer.root.position;

    // Check projectiles
    if (this.combatSystem.projectiles) {
      for (const proj of this.combatSystem.projectiles) {
        if (proj.isRemote) continue; // Don't check remote projectiles
        const dist = BABYLON.Vector3.Distance(proj.mesh.position, remotePos);
        if (dist < 1.5) {
          const damage = proj.damage || 15;
          this.network.send('de', { amount: damage });
          this.remotePlayer.takeDamage(damage);
          // Remove projectile
          if (proj.mesh) proj.mesh.dispose();
          proj.dead = true;
        }
      }
    }

    // Check sword attack
    if (this.combatSystem.swordAnim > 0) {
      const playerPos = this.player.mesh.position;
      const dist = BABYLON.Vector3.Distance(playerPos, remotePos);
      if (dist < 3.0 && !this._swordHitThisSwing) {
        const damage = 25;
        this.network.send('de', { amount: damage });
        this.remotePlayer.takeDamage(damage);
        this._swordHitThisSwing = true;
        // Reset on next frame when not swinging
      }
    } else {
      this._swordHitThisSwing = false;
    }
  }

  _pvpRespawn() {
    this.pvpDead = false;
    this.state.dead = false;
    this.state.health = this.state.maxHealth;
    this.state.ammo = { fire: 9999, ice: 9999, lightning: 9999 };

    // Teleport to spawn
    const spawn = this.network.isHost ? this.pvpArena.spawnA : this.pvpArena.spawnB;
    this.player.mesh.position.copyFrom(spawn);
    if (this.player.mesh.physicsImpostor) {
      this.player.mesh.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
    }

    // Hide game over screen
    document.getElementById('game-over').style.display = 'none';
    this.hud.show();
    this.canvas.requestPointerLock();

    // Tell other player we respawned
    this.network.send('pr', { x: spawn.x, y: spawn.y, z: spawn.z });
    this.hud.showMessage('Respawned!');
  }

  _updatePvPScore() {
    document.getElementById('pvp-host-score').textContent = this.pvpScores.host;
    document.getElementById('pvp-client-score').textContent = this.pvpScores.client;
  }

  _checkPvPWin() {
    const myScore = this.network.isHost ? this.pvpScores.host : this.pvpScores.client;
    const theirScore = this.network.isHost ? this.pvpScores.client : this.pvpScores.host;
    if (myScore >= 5) {
      this.network.send('pw', {});
      this._showPvPEnd(true);
    } else if (theirScore >= 5) {
      this._showPvPEnd(false);
    }
  }

  _showPvPEnd(won) {
    if (won) {
      this.achievements.unlock('win_pvp', this.hud);
      this.pvpWins = (this.pvpWins || parseInt(localStorage.getItem('pvpWins') || '0')) + 1;
      localStorage.setItem('pvpWins', this.pvpWins.toString());
      if (this.pvpWins >= 5) this.achievements.unlock('win_pvp_5', this.hud);
      // Flawless = won 5-0
      const theirScore = this.network.isHost ? this.pvpScores.client : this.pvpScores.host;
      if (theirScore === 0) this.achievements.unlock('win_pvp_flawless', this.hud);
    }
    document.getElementById('pvp-score').style.display = 'none';
    document.getElementById('pvp-result').textContent = won ? 'VICTORY!' : 'DEFEATED!';
    document.getElementById('pvp-final-score').textContent =
      `${this.pvpScores.host} - ${this.pvpScores.client}`;
    document.getElementById('pvp-end').style.display = 'flex';
    this.state.started = false;
    this.hud.hide();
    document.exitPointerLock();
    this.network.disconnect();
  }

  _spawnRemoteProjectile(data) {
    // Create a visual-only projectile from the remote player
    const sphere = BABYLON.MeshBuilder.CreateSphere('remoteProj', { diameter: 0.3 }, this.scene);
    sphere.position = new BABYLON.Vector3(data.x, data.y, data.z);
    const mat = new BABYLON.StandardMaterial('remoteProjMat', this.scene);
    const colors = {
      fire: new BABYLON.Color3(1, 0.3, 0),
      ice: new BABYLON.Color3(0.3, 0.6, 1),
      lightning: new BABYLON.Color3(1, 1, 0.3),
    };
    mat.emissiveColor = colors[data.element] || colors.fire;
    mat.disableLighting = true;
    sphere.material = mat;

    const dir = new BABYLON.Vector3(data.dx, data.dy, data.dz);
    const speed = 40;
    let life = 2;
    const obs = this.scene.onBeforeRenderObservable.add(() => {
      const dt = this.engine.getDeltaTime() / 1000;
      life -= dt;
      sphere.position.addInPlace(dir.scale(speed * dt));
      if (life <= 0) {
        this.scene.onBeforeRenderObservable.remove(obs);
        mat.dispose();
        sphere.dispose();
      }
    });
  }
}
