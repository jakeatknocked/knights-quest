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
    const rebirthCount = parseInt(localStorage.getItem('rebirthCount') || '0');
    const rebirthMulti = 1 + (rebirthCount * 0.25);
    const savedReward = Math.max(parseFloat(localStorage.getItem('savedReward') || '1.0'), rebirthMulti);

    // Game state
    this.state = {
      started: false,
      paused: false,
      dead: false,
      health: isAdmin ? 150 : 100,
      maxHealth: isAdmin ? 150 : 100,
      score: savedScore,
      totalCoins: parseInt(localStorage.getItem('totalCoins') || '0'),
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

    // Sync coins to localStorage so shop can read them
    localStorage.setItem('totalCoins', this.state.totalCoins.toString());

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

    // Trophy button — opens the trophy room
    document.getElementById('trophy-btn').addEventListener('click', () => {
      this._openTrophyRoom();
    });
    document.getElementById('trophy-back-btn').addEventListener('click', () => {
      document.getElementById('trophy-screen').style.display = 'none';
      document.getElementById('start-screen').style.display = 'flex';
    });

    // Rebirth button — opens the rebirth menu
    document.getElementById('rebirth-btn').addEventListener('click', () => {
      this._openRebirthMenu();
    });
    document.getElementById('rebirth-cancel-btn').addEventListener('click', () => {
      document.getElementById('rebirth-screen').style.display = 'none';
      document.getElementById('start-screen').style.display = 'flex';
    });
    document.getElementById('rebirth-confirm-btn').addEventListener('click', () => {
      this._doRebirth();
    });

    // Show rebirth info on start screen
    this._updateRebirthInfo();

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

  _openTrophyRoom() {
    const kills = parseInt(localStorage.getItem('totalKills') || '0');
    const coins = parseInt(localStorage.getItem('totalCoins') || '0');
    const rebirths = parseInt(localStorage.getItem('rebirthCount') || '0');
    const score = parseInt(localStorage.getItem('savedScore') || '0');
    const level = parseInt(localStorage.getItem('savedLevel') || '0') + 1;
    const bossKills = parseInt(localStorage.getItem('totalBossKills') || '0');
    const survivalWins = parseInt(localStorage.getItem('survivalWins') || '0');
    const pvpWins = parseInt(localStorage.getItem('pvpWins') || '0');
    const achCount = Object.keys(this.achievements.unlocked).length;
    const achTotal = this.achievements.list.length;
    const swordKills = parseInt(localStorage.getItem('swordKills') || '0');
    const headshots = parseInt(localStorage.getItem('headshots') || '0');
    const deaths = parseInt(localStorage.getItem('totalDeaths') || '0');
    const chestsOpened = parseInt(localStorage.getItem('chestsOpened') || '0');
    const friendsRescued = parseInt(localStorage.getItem('friendsRescued') || '0');
    const playTime = parseInt(localStorage.getItem('playTime') || '0');
    const jumps = parseInt(localStorage.getItem('totalJumps') || '0');
    const shieldBlocks = parseInt(localStorage.getItem('shieldBlocks') || '0');
    const purchases = JSON.parse(localStorage.getItem('shopPurchases') || '{}');
    const pets = ['pet_wolf','pet_dragon','pet_fairy','pet_ghost','pet_phoenix','pet_golem','pet_cat'];
    const ownedPets = pets.filter(id => purchases[id]).length;
    const totalPurchases = Object.keys(purchases).length;
    const beatGameCount = parseInt(localStorage.getItem('beatGameCount') || '0');
    const partyVisits = parseInt(localStorage.getItem('partyVisits') || '0');
    const playHours = Math.floor(playTime / 3600);

    // Special knight trophies — big goals!
    const trophies = [
      // --- KILL TROPHIES ---
      { name: 'BRONZE KNIGHT', desc: 'Kill 100 enemies', icon: '&#x1F3C6;', color: '#cd7f32', met: kills >= 100, progress: `${Math.min(kills,100)} / 100 kills` },
      { name: 'SILVER KNIGHT', desc: 'Kill 500 enemies', icon: '&#x1F3C6;', color: '#c0c0c0', met: kills >= 500, progress: `${Math.min(kills,500)} / 500 kills`, silver: true },
      { name: 'GOLD KNIGHT', desc: 'Kill 1,000 enemies', icon: '&#x1F3C6;', color: '#ffd700', met: kills >= 1000, progress: `${Math.min(kills,1000).toLocaleString()} / 1,000 kills` },
      { name: 'DIAMOND SLAYER', desc: 'Kill 5,000 enemies', icon: '&#x1F3C6;', color: '#88ddff', met: kills >= 5000, progress: `${Math.min(kills,5000).toLocaleString()} / 5,000 kills`, rank: 'rare', diamond: true },
      { name: 'DEATH KNIGHT', desc: 'Kill 25,000 enemies', icon: '&#x1F3C6;', color: '#880000', met: kills >= 25000, progress: `${Math.min(kills,25000).toLocaleString()} / 25,000`, rank: 'epic' },
      { name: 'GOD OF WAR', desc: 'Kill 50,000 enemies', icon: '&#x1F3C6;', color: '#ff0000', met: kills >= 50000, progress: `${Math.min(kills,50000).toLocaleString()} / 50,000`, rank: 'legendary' },

      // --- BOSS TROPHIES ---
      { name: 'BOSS SLAYER', desc: 'Defeat 10 bosses', icon: '&#x1F3C6;', color: '#ff6600', met: bossKills >= 10, progress: `${Math.min(bossKills,10)} / 10 bosses` },
      { name: 'BOSS DESTROYER', desc: 'Defeat 50 bosses', icon: '&#x1F3C6;', color: '#ff4444', met: bossKills >= 50, progress: `${Math.min(bossKills,50)} / 50 bosses`, rank: 'rare' },
      { name: 'BOSS NIGHTMARE', desc: 'Defeat 100 bosses', icon: '&#x1F3C6;', color: '#aa0000', met: bossKills >= 100, progress: `${Math.min(bossKills,100)} / 100 bosses`, rank: 'epic' },

      // --- COIN TROPHIES ---
      { name: 'RICH KNIGHT', desc: 'Collect 10,000 coins', icon: '&#x1F3C6;', color: '#ffcc00', met: coins >= 10000, progress: `${Math.min(coins,10000).toLocaleString()} / 10,000` },
      { name: 'TREASURE LORD', desc: 'Collect 100,000 coins', icon: '&#x1F3C6;', color: '#ffaa00', met: coins >= 100000, progress: `${Math.min(coins,100000).toLocaleString()} / 100,000`, rank: 'epic' },
      { name: 'MILLIONAIRE', desc: 'Collect 1,000,000 coins', icon: '&#x1F3C6;', color: '#ffd700', met: coins >= 1000000, progress: `${Math.min(coins,1000000).toLocaleString()} / 1,000,000`, rank: 'legendary' },

      // --- SWORD TROPHIES ---
      { name: 'BLADE APPRENTICE', desc: 'Get 50 sword kills', icon: '&#x1F3C6;', color: '#aaaacc', met: swordKills >= 50, progress: `${Math.min(swordKills,50)} / 50` },
      { name: 'BLADE MASTER', desc: 'Get 250 sword kills', icon: '&#x1F3C6;', color: '#88aaff', met: swordKills >= 250, progress: `${Math.min(swordKills,250)} / 250`, rank: 'rare' },
      { name: 'SWORD SAINT', desc: 'Get 1,000 sword kills', icon: '&#x1F3C6;', color: '#4488ff', met: swordKills >= 1000, progress: `${Math.min(swordKills,1000).toLocaleString()} / 1,000`, rank: 'epic' },

      // --- HEADSHOT TROPHIES ---
      { name: 'SHARPSHOOTER', desc: 'Get 50 headshots', icon: '&#x1F3C6;', color: '#ff8844', met: headshots >= 50, progress: `${Math.min(headshots,50)} / 50` },
      { name: 'SNIPER ELITE', desc: 'Get 250 headshots', icon: '&#x1F3C6;', color: '#ff6622', met: headshots >= 250, progress: `${Math.min(headshots,250)} / 250`, rank: 'rare' },
      { name: 'PERFECT AIM', desc: 'Get 1,000 headshots', icon: '&#x1F3C6;', color: '#ff4400', met: headshots >= 1000, progress: `${Math.min(headshots,1000).toLocaleString()} / 1,000`, rank: 'epic' },

      // --- LEVEL TROPHIES ---
      { name: 'ADVENTURER', desc: 'Beat level 5', icon: '&#x1F3C6;', color: '#66cc66', met: level >= 5, progress: `Level ${level} / 5` },
      { name: 'CONQUEROR', desc: 'Beat all 10 levels', icon: '&#x1F3C6;', color: '#44ff44', met: level >= 10, progress: `Level ${level} / 10` },
      { name: 'LEGEND', desc: 'Beat all levels 5 times', icon: '&#x1F3C6;', color: '#00ff88', met: beatGameCount >= 5, progress: `${Math.min(beatGameCount,5)} / 5 completions`, rank: 'epic' },
      { name: 'ETERNAL CHAMPION', desc: 'Beat all levels 25 times', icon: '&#x1F3C6;', color: '#00ffcc', met: beatGameCount >= 25, progress: `${Math.min(beatGameCount,25)} / 25 completions`, rank: 'legendary' },

      // --- SURVIVAL TROPHIES ---
      { name: 'SURVIVOR', desc: 'Beat survival mode', icon: '&#x1F3C6;', color: '#ff6666', met: survivalWins >= 1, progress: `${Math.min(survivalWins,1)} / 1 win` },
      { name: 'SURVIVOR KNIGHT', desc: 'Beat survival 5 times', icon: '&#x1F3C6;', color: '#ff4444', met: survivalWins >= 5, progress: `${Math.min(survivalWins,5)} / 5 wins` },
      { name: 'SURVIVAL KING', desc: 'Beat survival 25 times', icon: '&#x1F3C6;', color: '#cc0000', met: survivalWins >= 25, progress: `${Math.min(survivalWins,25)} / 25 wins`, rank: 'epic' },

      // --- PVP TROPHIES ---
      { name: 'PVP WARRIOR', desc: 'Win 5 PvP matches', icon: '&#x1F3C6;', color: '#cc44cc', met: pvpWins >= 5, progress: `${Math.min(pvpWins,5)} / 5 wins` },
      { name: 'PVP CHAMPION', desc: 'Win 10 PvP matches', icon: '&#x1F3C6;', color: '#ff44ff', met: pvpWins >= 10, progress: `${Math.min(pvpWins,10)} / 10 wins`, rank: 'rare' },
      { name: 'PVP GOD', desc: 'Win 50 PvP matches', icon: '&#x1F3C6;', color: '#ff00ff', met: pvpWins >= 50, progress: `${Math.min(pvpWins,50)} / 50 wins`, rank: 'legendary' },

      // --- SCORE TROPHIES ---
      { name: 'HIGH SCORER', desc: 'Reach score 10,000', icon: '&#x1F3C6;', color: '#6688ff', met: score >= 10000, progress: `${score.toLocaleString()} / 10,000` },
      { name: 'SCORE LEGEND', desc: 'Reach score 50,000', icon: '&#x1F3C6;', color: '#44aaff', met: score >= 50000, progress: `${score.toLocaleString()} / 50,000`, rank: 'rare' },
      { name: 'SCORE GOD', desc: 'Reach score 100,000', icon: '&#x1F3C6;', color: '#2288ff', met: score >= 100000, progress: `${score.toLocaleString()} / 100,000`, rank: 'epic' },

      // --- SHIELD TROPHIES ---
      { name: 'SHIELD WALL', desc: 'Block 100 attacks', icon: '&#x1F3C6;', color: '#8888aa', met: shieldBlocks >= 100, progress: `${Math.min(shieldBlocks,100)} / 100 blocks` },
      { name: 'FORTRESS', desc: 'Block 500 attacks', icon: '&#x1F3C6;', color: '#aaaacc', met: shieldBlocks >= 500, progress: `${Math.min(shieldBlocks,500)} / 500 blocks`, rank: 'rare' },

      // --- CHEST TROPHIES ---
      { name: 'TREASURE HUNTER', desc: 'Open 50 chests', icon: '&#x1F3C6;', color: '#bb8844', met: chestsOpened >= 50, progress: `${Math.min(chestsOpened,50)} / 50 chests` },
      { name: 'LOOT LORD', desc: 'Open 250 chests', icon: '&#x1F3C6;', color: '#ddaa44', met: chestsOpened >= 250, progress: `${Math.min(chestsOpened,250)} / 250 chests`, rank: 'rare' },

      // --- FRIEND TROPHIES ---
      { name: 'HERO', desc: 'Rescue 10 friends', icon: '&#x1F3C6;', color: '#44ddaa', met: friendsRescued >= 10, progress: `${Math.min(friendsRescued,10)} / 10 friends` },
      { name: 'SAVIOR', desc: 'Rescue 50 friends', icon: '&#x1F3C6;', color: '#22ffaa', met: friendsRescued >= 50, progress: `${Math.min(friendsRescued,50)} / 50 friends`, rank: 'rare' },

      // --- PET TROPHIES ---
      { name: 'PET OWNER', desc: 'Own 3 pets', icon: '&#x1F3C6;', color: '#cc88ff', met: ownedPets >= 3, progress: `${Math.min(ownedPets,3)} / 3 pets` },
      { name: 'ZOO KEEPER', desc: 'Own all 7 pets', icon: '&#x1F3C6;', color: '#aa44ff', met: ownedPets >= 7, progress: `${Math.min(ownedPets,7)} / 7 pets`, rank: 'epic' },

      // --- SHOPPING TROPHIES ---
      { name: 'SHOPPER', desc: 'Buy 10 shop items', icon: '&#x1F3C6;', color: '#66bb66', met: totalPurchases >= 10, progress: `${Math.min(totalPurchases,10)} / 10 items` },
      { name: 'OWN IT ALL', desc: 'Buy 50 shop items', icon: '&#x1F3C6;', color: '#44dd44', met: totalPurchases >= 50, progress: `${Math.min(totalPurchases,50)} / 50 items`, rank: 'epic' },

      // --- JUMP TROPHIES ---
      { name: 'KANGAROO', desc: 'Jump 1,000 times', icon: '&#x1F3C6;', color: '#bb8866', met: jumps >= 1000, progress: `${Math.min(jumps,1000).toLocaleString()} / 1,000 jumps` },
      { name: 'ANTI-GRAVITY', desc: 'Jump 10,000 times', icon: '&#x1F3C6;', color: '#dd9944', met: jumps >= 10000, progress: `${Math.min(jumps,10000).toLocaleString()} / 10,000 jumps`, rank: 'rare' },

      // --- TIME TROPHIES ---
      { name: 'DEDICATED', desc: 'Play for 1 hour', icon: '&#x1F3C6;', color: '#8888bb', met: playHours >= 1, progress: `${playHours} / 1 hour` },
      { name: 'ADDICTED', desc: 'Play for 10 hours', icon: '&#x1F3C6;', color: '#6666dd', met: playHours >= 10, progress: `${playHours} / 10 hours`, rank: 'rare' },
      { name: 'NO LIFE', desc: 'Play for 100 hours', icon: '&#x1F3C6;', color: '#4444ff', met: playHours >= 100, progress: `${playHours} / 100 hours`, rank: 'legendary' },

      // --- DEATH TROPHIES ---
      { name: 'PHOENIX', desc: 'Die 100 times', icon: '&#x1F3C6;', color: '#ff8844', met: deaths >= 100, progress: `${Math.min(deaths,100)} / 100 deaths` },
      { name: 'IMMORTAL SOUL', desc: 'Die 1,000 times', icon: '&#x1F3C6;', color: '#ff6622', met: deaths >= 1000, progress: `${Math.min(deaths,1000).toLocaleString()} / 1,000 deaths`, rank: 'epic' },

      // --- PARTY TROPHIES ---
      { name: 'PARTY ANIMAL', desc: 'Visit the party 5 times', icon: '&#x1F3C6;', color: '#ff88cc', met: partyVisits >= 5, progress: `${Math.min(partyVisits,5)} / 5 visits` },
      { name: 'PARTY LEGEND', desc: 'Visit the party 25 times', icon: '&#x1F3C6;', color: '#ff44aa', met: partyVisits >= 25, progress: `${Math.min(partyVisits,25)} / 25 visits`, rank: 'rare' },

      // --- REBIRTH TROPHIES ---
      { name: 'REBORN', desc: 'Rebirth once', icon: '&#x1F3C6;', color: '#ffaa44', met: rebirths >= 1, progress: `${Math.min(rebirths,1)} / 1 rebirth` },
      { name: 'REBORN KNIGHT', desc: 'Rebirth 5 times', icon: '&#x1F3C6;', color: '#ffcc00', met: rebirths >= 5, progress: `${Math.min(rebirths,5)} / 5 rebirths`, rank: 'epic' },
      { name: 'LEGENDARY REBORN', desc: 'MAX rebirth (15)', icon: '&#x1F3C6;', color: '#ff44ff', met: rebirths >= 15, progress: `${Math.min(rebirths,15)} / 15 rebirths`, rank: 'legendary' },

      // --- ACHIEVEMENT TROPHIES ---
      { name: 'COLLECTOR', desc: 'Earn 25 achievements', icon: '&#x1F3C6;', color: '#88bb88', met: achCount >= 25, progress: `${Math.min(achCount,25)} / 25` },
      { name: 'HUNTER', desc: 'Earn 50 achievements', icon: '&#x1F3C6;', color: '#66dd66', met: achCount >= 50, progress: `${Math.min(achCount,50)} / 50`, rank: 'rare' },
      { name: 'PLATINUM KNIGHT', desc: 'Earn 100 achievements', icon: '&#x1F3C6;', color: '#c0c0c0', met: achCount >= 100, progress: `${Math.min(achCount,100)} / 100`, rank: 'epic', silver: true },
      { name: 'DIAMOND KNIGHT', desc: 'Earn 200 achievements', icon: '&#x1F3C6;', color: '#88ddff', met: achCount >= 200, progress: `${Math.min(achCount,200)} / 200`, rank: 'epic', diamond: true },
      { name: 'GOLDEN KNIGHT', desc: 'Earn ALL achievements!', icon: '&#x1F3C6;', color: '#ffd700', met: achCount >= achTotal, progress: `${achCount} / ${achTotal} achievements`, rank: 'legendary', isUltimate: true },
    ];

    const container = document.getElementById('trophy-content');
    container.innerHTML = '';

    // Summary
    const earnedCount = trophies.filter(t => t.met).length;
    const summary = document.createElement('div');
    summary.style.cssText = 'width:100%;text-align:center;margin-bottom:15px;';
    summary.innerHTML = `
      <div style="font-size:16px;color:#aaa;">Trophies Earned: <span style="color:#ffd700;font-size:22px;font-weight:bold;">${earnedCount} / ${trophies.length}</span></div>
    `;
    container.appendChild(summary);

    // Render each trophy
    trophies.forEach(t => {
      const card = document.createElement('div');
      const rank = t.met ? (t.rank || '') : '';
      card.className = 'trophy-card' + (rank ? ' ' + rank : '') + (t.met ? '' : ' trophy-locked');
      const glow = t.met && t.isUltimate ? 'filter:drop-shadow(0 0 15px #ffd700);' : t.met ? `filter:drop-shadow(0 0 8px ${t.color});` : '';

      card.innerHTML = `
        <div style="${glow}">
          <div style="font-size:50px;color:${t.met ? t.color : '#333'};${t.met ? '' : 'opacity:0.25;'}${t.met && t.silver ? 'filter:saturate(0) brightness(1.8);' : ''}${t.met && t.diamond ? 'filter:hue-rotate(180deg) saturate(2) brightness(1.3);' : ''}">${t.met ? t.icon : '&#x1F512;'}</div>
        </div>
        <div class="trophy-name" style="color:${t.met ? t.color : '#555'};">${t.name}</div>
        <div class="trophy-sub">${t.desc}</div>
        <div style="margin-top:6px;font-size:11px;color:${t.met ? '#44ff44' : '#888'};">
          ${t.met ? '&#9989; EARNED!' : t.progress}
        </div>
        ${t.met && t.isUltimate ? '<div style="font-size:12px;color:#ffd700;margin-top:4px;font-weight:bold;">THE ULTIMATE TROPHY</div>' : ''}
      `;
      container.appendChild(card);
    });

    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('trophy-screen').style.display = 'flex';
  }

  saveProgress() {
    localStorage.setItem('savedLevel', this.state.currentLevel.toString());
    localStorage.setItem('savedScore', this.state.score.toString());
    localStorage.setItem('savedRank', this.state.rank);
    localStorage.setItem('savedRankColor', this.state.rankColor);
    localStorage.setItem('savedReward', this.state.rewardMultiplier.toString());
    localStorage.setItem('totalKills', this.state.totalKills.toString());
  }

  _getRebirthRequirements(rebirthNum) {
    // 15 rebirths total — each one harder! Rebirth 15 = MAX
    const reqs = [
      { level: 5,  coins: 500,    kills: 0 },      // Rebirth 1
      { level: 8,  coins: 1500,   kills: 0 },      // Rebirth 2
      { level: 10, coins: 3000,   kills: 0 },      // Rebirth 3
      { level: 10, coins: 5000,   kills: 200 },    // Rebirth 4
      { level: 10, coins: 10000,  kills: 500 },    // Rebirth 5
      { level: 10, coins: 15000,  kills: 750 },    // Rebirth 6
      { level: 10, coins: 20000,  kills: 1000 },   // Rebirth 7
      { level: 10, coins: 30000,  kills: 1500 },   // Rebirth 8
      { level: 10, coins: 40000,  kills: 2000 },   // Rebirth 9
      { level: 10, coins: 50000,  kills: 3000 },   // Rebirth 10
      { level: 10, coins: 75000,  kills: 4000 },   // Rebirth 11
      { level: 10, coins: 100000, kills: 5000 },   // Rebirth 12
      { level: 10, coins: 150000, kills: 7500 },   // Rebirth 13
      { level: 10, coins: 200000, kills: 10000 },  // Rebirth 14
      { level: 10, coins: 500000, kills: 25000 },  // Rebirth 15 — THE FINAL ONE
    ];
    if (rebirthNum >= 15) return null; // MAX reached!
    return reqs[Math.min(rebirthNum, reqs.length - 1)];
  }

  _openRebirthMenu() {
    const rebirths = parseInt(localStorage.getItem('rebirthCount') || '0');
    const coins = parseInt(localStorage.getItem('totalCoins') || '0');
    const level = parseInt(localStorage.getItem('savedLevel') || '0') + 1; // 1-based for display
    const kills = parseInt(localStorage.getItem('totalKills') || '0');
    const purchases = JSON.parse(localStorage.getItem('shopPurchases') || '{}');
    const pets = ['pet_wolf','pet_dragon','pet_fairy','pet_ghost','pet_phoenix','pet_golem','pet_cat'];
    const ownedPets = pets.filter(id => purchases[id]).length;
    const weapons = ['weapon_crossbow','weapon_cannon','weapon_staff','weapon_dual'];
    const ownedWeapons = weapons.filter(id => purchases[id]).length;
    const currentMulti = 1 + (rebirths * 0.25);

    const infoEl = document.getElementById('rebirth-current-info');
    const req = this._getRebirthRequirements(rebirths);

    // ===== MAX REBIRTH REACHED =====
    if (!req) {
      infoEl.innerHTML = `
        <div style="font-size:32px; margin-bottom:8px;">&#128081;&#11088;&#128081;</div>
        <div style="color:#ff44ff; font-size:22px; font-weight:bold; text-shadow:0 0 15px #ff00ff;">
          MAX REBIRTH — LEGENDARY KNIGHT
        </div>
        <div style="color:#ffcc00; font-size:16px; margin-top:8px;">
          ${'&#11088;'.repeat(15)}
        </div>
        <div style="margin-top:8px;">Coin multiplier: <span style="color:#ff44ff; font-size:20px; font-weight:bold;">${currentMulti.toFixed(2)}x</span></div>
        <div style="color:#aaa; margin-top:8px;">
          You have reached the ULTIMATE rebirth.<br>
          There is nothing left to prove. You are a LEGEND.
        </div>
      `;

      // Hide rewards/costs/requirements — not needed
      document.getElementById('rebirth-rewards').style.display = 'none';
      document.getElementById('rebirth-costs').style.display = 'none';
      const reqEl = document.getElementById('rebirth-requirements');
      if (reqEl) reqEl.style.display = 'none';

      const confirmBtn = document.getElementById('rebirth-confirm-btn');
      confirmBtn.disabled = true;
      confirmBtn.style.opacity = '0.4';
      confirmBtn.style.cursor = 'default';
      confirmBtn.innerHTML = '&#128081; MAX REBIRTH REACHED &#128081;';

      document.getElementById('start-screen').style.display = 'none';
      document.getElementById('rebirth-screen').style.display = 'flex';
      return;
    }

    // ===== NORMAL REBIRTH MENU =====
    // Show sections in case they were hidden by MAX
    document.getElementById('rebirth-rewards').style.display = '';
    document.getElementById('rebirth-costs').style.display = '';

    const nextMulti = 1 + ((rebirths + 1) * 0.25);
    const levelOk = level >= req.level;
    const coinsOk = coins >= req.coins;
    const killsOk = kills >= req.kills;
    const canRebirth = levelOk && coinsOk && killsOk;

    // Is this the FINAL rebirth?
    const isFinal = (rebirths === 14);

    // Build requirements checklist HTML
    const check = '&#9989;';
    const cross = '&#10060;';
    let reqHTML = isFinal
      ? `<h3 style="color:#ff44ff;">&#128081; THE FINAL REBIRTH &#128081;</h3>`
      : `<h3>Requirements for Rebirth ${rebirths + 1}:</h3>`;
    reqHTML += `<div class="rebirth-req ${levelOk ? 'done' : 'not-done'}">${levelOk ? check : cross} Beat Level ${req.level} <span style="color:#aaa;">(You: Level ${level})</span></div>`;
    reqHTML += `<div class="rebirth-req ${coinsOk ? 'done' : 'not-done'}">${coinsOk ? check : cross} Earn ${req.coins.toLocaleString()} coins <span style="color:#aaa;">(You: ${coins.toLocaleString()})</span></div>`;
    if (req.kills > 0) {
      reqHTML += `<div class="rebirth-req ${killsOk ? 'done' : 'not-done'}">${killsOk ? check : cross} Get ${req.kills.toLocaleString()} kills <span style="color:#aaa;">(You: ${kills.toLocaleString()})</span></div>`;
    }

    // Star display (show all 15 slots, filled ones gold, empty ones grey)
    let starHTML = '';
    for (let i = 0; i < 15; i++) {
      if (i < rebirths) {
        starHTML += '<span style="font-size:18px;">&#11088;</span>';
      } else {
        starHTML += '<span style="font-size:18px; opacity:0.2;">&#11088;</span>';
      }
    }

    infoEl.innerHTML = `
      <div style="color:#ffcc00; font-size:18px; margin-bottom:6px;">
        ${rebirths > 0 ? 'Rebirth ' + rebirths + ' / 15' : 'No rebirths yet'}
      </div>
      <div>${starHTML}</div>
      <div style="margin-top:6px;">Current: <span style="color:#ffcc00;">${currentMulti.toFixed(2)}x</span> &rarr; After: <span style="color:#44ff44;">${nextMulti.toFixed(2)}x</span></div>
      <div style="margin-top:6px; color:#aaa; font-size:13px;">
        Coins: <span style="color:#ffcc00;">${coins.toLocaleString()}</span> |
        Pets: <span style="color:#ff8888;">${ownedPets}</span> |
        Weapons: <span style="color:#ff8888;">${ownedWeapons}</span>
      </div>
    `;

    // Show/update requirements section
    let reqEl = document.getElementById('rebirth-requirements');
    if (!reqEl) {
      reqEl = document.createElement('div');
      reqEl.id = 'rebirth-requirements';
      const costsEl = document.getElementById('rebirth-costs');
      costsEl.parentNode.insertBefore(reqEl, costsEl);
    }
    reqEl.style.display = '';
    reqEl.innerHTML = reqHTML;
    reqEl.style.cssText = 'text-align:left;margin:8px 0;padding:10px;border-radius:10px;background:rgba(255,200,0,0.08);border:1px solid rgba(255,200,0,0.3);';
    if (isFinal) {
      reqEl.style.border = '2px solid #ff44ff';
      reqEl.style.background = 'rgba(255,0,255,0.08)';
    }

    // Enable/disable confirm button
    const confirmBtn = document.getElementById('rebirth-confirm-btn');
    if (canRebirth) {
      confirmBtn.disabled = false;
      confirmBtn.style.opacity = '1';
      confirmBtn.style.cursor = 'pointer';
      confirmBtn.innerHTML = isFinal
        ? '&#128081; FINAL REBIRTH!! &#128081;'
        : '&#11088; DO IT! REBIRTH! &#11088;';
    } else {
      confirmBtn.disabled = true;
      confirmBtn.style.opacity = '0.4';
      confirmBtn.style.cursor = 'not-allowed';
      confirmBtn.innerHTML = '&#128274; NOT READY YET';
    }

    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('rebirth-screen').style.display = 'flex';
  }

  _doRebirth() {
    const rebirths = parseInt(localStorage.getItem('rebirthCount') || '0');
    const newRebirths = rebirths + 1;
    const newMulti = 1 + (newRebirths * 0.25);

    // Hide the rebirth panel so animation takes over
    document.getElementById('rebirth-panel').style.display = 'none';

    // ===== EPIC REBIRTH ANIMATION =====
    const overlay = document.getElementById('rebirth-screen');
    overlay.style.background = 'rgba(0,0,0,1)';

    // Create animation container
    const animDiv = document.createElement('div');
    animDiv.id = 'rebirth-anim';
    animDiv.style.cssText = 'position:fixed;inset:0;z-index:1001;pointer-events:none;overflow:hidden;';
    document.body.appendChild(animDiv);

    // --- Giant spinning star in the center ---
    const bigStar = document.createElement('div');
    bigStar.textContent = '\u2B50';
    bigStar.style.cssText = `
      position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);
      font-size:20px;opacity:0;transition:none;z-index:10;
      filter:drop-shadow(0 0 40px rgba(255,200,0,0.8));
    `;
    animDiv.appendChild(bigStar);

    // --- Star explosion particles ---
    const starEmojis = ['\u2B50','\u2728','\u1F31F','\u26A1','\u1F4AB','\u2604\uFE0F','\u1F525'];
    const particles = [];
    for (let i = 0; i < 60; i++) {
      const p = document.createElement('div');
      const emoji = starEmojis[Math.floor(Math.random() * starEmojis.length)];
      p.textContent = emoji;
      p.style.cssText = `
        position:absolute;top:50%;left:50%;
        font-size:${16 + Math.random() * 32}px;
        opacity:0;transform:translate(-50%,-50%) scale(0);
        z-index:5;pointer-events:none;
      `;
      animDiv.appendChild(p);
      particles.push({
        el: p,
        angle: (Math.PI * 2 * i) / 60 + (Math.random() - 0.5) * 0.3,
        speed: 200 + Math.random() * 600,
        rotSpeed: (Math.random() - 0.5) * 720,
        delay: Math.random() * 0.3,
        size: 0.5 + Math.random() * 1.5,
      });
    }

    // --- Shockwave ring ---
    const ring = document.createElement('div');
    ring.style.cssText = `
      position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
      width:10px;height:10px;border-radius:50%;
      border:4px solid #ffcc00;opacity:0;z-index:4;
      box-shadow:0 0 30px #ffcc00, inset 0 0 30px rgba(255,200,0,0.3);
    `;
    animDiv.appendChild(ring);

    // --- Second shockwave ---
    const ring2 = document.createElement('div');
    ring2.style.cssText = `
      position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
      width:10px;height:10px;border-radius:50%;
      border:3px solid #ff6600;opacity:0;z-index:3;
      box-shadow:0 0 20px #ff6600;
    `;
    animDiv.appendChild(ring2);

    // --- Rebirth text that fades in ---
    const rebirthText = document.createElement('div');
    rebirthText.innerHTML = `\u2B50 REBORN \u2B50<br><span style="font-size:28px;color:#ffcc00;">${newMulti.toFixed(2)}x Coins</span>`;
    rebirthText.style.cssText = `
      position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);
      font-size:64px;font-weight:bold;color:#fff;text-align:center;
      text-shadow:0 0 30px #ffcc00,0 0 60px #ff6600,0 0 100px #ff4400;
      z-index:12;opacity:0;white-space:nowrap;font-family:sans-serif;
    `;
    animDiv.appendChild(rebirthText);

    // --- Screen flash ---
    const flash = document.createElement('div');
    flash.style.cssText = `
      position:absolute;inset:0;background:#fff;opacity:0;z-index:15;
    `;
    animDiv.appendChild(flash);

    // --- Vertical light beams ---
    for (let i = 0; i < 8; i++) {
      const beam = document.createElement('div');
      const hue = (i / 8) * 360;
      beam.style.cssText = `
        position:absolute;top:0;left:${10 + (i / 8) * 80}%;
        width:3px;height:100%;opacity:0;z-index:2;
        background:linear-gradient(to bottom, transparent, hsla(${hue},100%,60%,0.6), transparent);
        transform:scaleY(0);transform-origin:center;
      `;
      animDiv.appendChild(beam);
      // Animate beams
      setTimeout(() => {
        beam.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
        beam.style.transform = 'scaleY(1)';
        beam.style.opacity = '0.7';
        setTimeout(() => {
          beam.style.transition = 'opacity 0.6s ease-in';
          beam.style.opacity = '0';
        }, 600);
      }, 200 + i * 80);
    }

    // ===== ANIMATION TIMELINE =====
    const startTime = performance.now();
    const animate = () => {
      const t = (performance.now() - startTime) / 1000; // seconds

      // Phase 1 (0-0.8s): Star grows and spins in center
      if (t < 0.8) {
        const progress = t / 0.8;
        const scale = progress * 8;
        const rot = progress * 720;
        bigStar.style.transform = `translate(-50%,-50%) scale(${scale}) rotate(${rot}deg)`;
        bigStar.style.opacity = Math.min(1, progress * 2);
        bigStar.style.fontSize = '20px';
      }

      // Phase 2 (0.8s): WHITE FLASH + particles explode out
      if (t >= 0.8 && t < 0.9) {
        flash.style.opacity = String(1 - (t - 0.8) / 0.1 * 0.7);
        if (!animDiv._exploded) {
          animDiv._exploded = true;
          flash.style.opacity = '1';
          bigStar.style.opacity = '0';
        }
      }
      if (t >= 0.9 && t < 1.5) {
        flash.style.opacity = String(Math.max(0, 0.3 - (t - 0.9) * 0.5));
      }

      // Phase 2-3 (0.8-2.5s): Particles fly outward
      if (t >= 0.8) {
        const pt = t - 0.8;
        particles.forEach(p => {
          const localT = Math.max(0, pt - p.delay);
          if (localT <= 0) return;
          const dist = p.speed * localT * (1 - localT * 0.3);
          const x = Math.cos(p.angle) * dist;
          const y = Math.sin(p.angle) * dist;
          const rot = p.rotSpeed * localT;
          const scale = p.size * Math.max(0, 1 - localT * 0.5);
          const opacity = Math.max(0, 1 - localT * 0.6);
          p.el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale}) rotate(${rot}deg)`;
          p.el.style.opacity = String(opacity);
        });
      }

      // Phase 2 (0.8-1.6s): Shockwave expands
      if (t >= 0.8 && t < 1.8) {
        const st = (t - 0.8) / 1.0;
        const size = st * 1200;
        ring.style.width = size + 'px';
        ring.style.height = size + 'px';
        ring.style.opacity = String(Math.max(0, 1 - st));
        ring.style.borderWidth = Math.max(1, 4 - st * 3) + 'px';
      }
      // Second shockwave (delayed)
      if (t >= 1.0 && t < 2.0) {
        const st = (t - 1.0) / 1.0;
        const size = st * 900;
        ring2.style.width = size + 'px';
        ring2.style.height = size + 'px';
        ring2.style.opacity = String(Math.max(0, 0.8 - st));
      }

      // Phase 3 (1.5-3.5s): "REBORN" text scales in with bounce
      if (t >= 1.5 && t < 3.5) {
        const tt = (t - 1.5) / 0.6;
        let scale;
        if (tt < 1) {
          // Elastic bounce in
          scale = 1 - Math.pow(1 - tt, 3) * Math.cos(tt * Math.PI * 3) * (1 - tt);
        } else {
          scale = 1 + Math.sin((t - 2.1) * 2) * 0.05; // gentle pulse
        }
        rebirthText.style.transform = `translate(-50%,-50%) scale(${Math.max(0, scale)})`;
        rebirthText.style.opacity = String(Math.min(1, (t - 1.5) * 3));
      }

      // Phase 4 (3.5-4.2s): Everything fades out
      if (t >= 3.5 && t < 4.2) {
        const fadeT = (t - 3.5) / 0.7;
        rebirthText.style.opacity = String(Math.max(0, 1 - fadeT));
        animDiv.style.opacity = String(Math.max(0, 1 - fadeT));
      }

      // Done (4.2s): Clean up and apply rebirth
      if (t >= 4.2) {
        animDiv.remove();
        this._applyRebirthReset(newRebirths, newMulti);
        return;
      }

      requestAnimationFrame(animate);
    };

    // Kick off the animation!
    requestAnimationFrame(animate);
  }

  _applyRebirthReset(newRebirths, newMulti) {
    // Reset coins
    localStorage.setItem('totalCoins', '0');
    this.state.totalCoins = 0;

    // Remove pets and weapons from purchases (keep skins, upgrades, potions)
    const purchases = JSON.parse(localStorage.getItem('shopPurchases') || '{}');
    const keysToRemove = Object.keys(purchases).filter(k => k.startsWith('pet_') || k.startsWith('weapon_'));
    keysToRemove.forEach(k => delete purchases[k]);
    localStorage.setItem('shopPurchases', JSON.stringify(purchases));

    // Clear equipped pet
    localStorage.removeItem('equippedPet');
    this.state.pet = null;
    if (this.activePet) {
      this.activePet.dispose();
      this.activePet = null;
    }

    // Reset level progress
    localStorage.setItem('savedLevel', '0');
    localStorage.setItem('savedScore', '0');
    this.state.currentLevel = 0;
    this.state.score = 0;

    // Save rebirth count
    localStorage.setItem('rebirthCount', newRebirths.toString());

    // Apply new coin multiplier
    localStorage.setItem('rebirthMultiplier', newMulti.toString());
    this.state.rewardMultiplier = newMulti;
    localStorage.setItem('savedReward', newMulti.toString());

    // Unlock rebirth achievements
    this.achievements.unlock('rebirth_1', this.hud);
    if (newRebirths >= 3) this.achievements.unlock('rebirth_3', this.hud);
    if (newRebirths >= 5) this.achievements.unlock('rebirth_5', this.hud);
    if (newRebirths >= 10) this.achievements.unlock('rebirth_10', this.hud);
    if (newRebirths >= 15) this.achievements.unlock('rebirth_max', this.hud);

    // Update displays
    this._updateRebirthInfo();
    document.getElementById('shop-coins').textContent = 'Coins: 0';

    // Restore rebirth panel for next time
    document.getElementById('rebirth-panel').style.display = '';

    // Close rebirth screen, show start screen
    document.getElementById('rebirth-screen').style.display = 'none';
    document.getElementById('rebirth-screen').style.background = '';
    document.getElementById('start-screen').style.display = 'flex';

    // Flash a message
    this.hud.showMessage('REBORN! Coin multiplier: ' + newMulti.toFixed(2) + 'x', 3000);
  }

  _updateRebirthInfo() {
    const rebirths = parseInt(localStorage.getItem('rebirthCount') || '0');
    const infoEl = document.getElementById('rebirth-info');
    const req = this._getRebirthRequirements(rebirths);
    if (rebirths >= 15) {
      infoEl.innerHTML = '&#128081; <span style="color:#ff44ff;">MAX REBIRTH — LEGENDARY KNIGHT</span> &#128081; | ' + (1 + rebirths * 0.25).toFixed(2) + 'x';
    } else if (rebirths > 0) {
      const multi = 1 + (rebirths * 0.25);
      infoEl.innerHTML = '&#11088;'.repeat(rebirths) + ' Rebirth ' + rebirths + '/15 | Coins: ' + multi.toFixed(2) + 'x';
    } else {
      infoEl.textContent = `Reach Level ${req.level} + ${req.coins.toLocaleString()} coins to rebirth!`;
    }
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
    // All emotes — first 8 are free, rest require shop purchase
    this._allEmotes = [
      { id: 'dance', name: '💃 Dance', free: true },
      { id: 'spin', name: '🌀 Spin', free: true },
      { id: 'wave', name: '👋 Wave', free: true },
      { id: 'jump', name: '⭐ Jump', free: true },
      { id: 'flex', name: '💪 Flex', free: true },
      { id: 'dab', name: '🤦 Dab', free: true },
      { id: 'headbang', name: '🎤 Headbang', free: true },
      { id: 'floss', name: '🙂 Floss', free: true },
      { id: 'robot', name: '🤖 Robot', shopId: 'emote_robot' },
      { id: 'chicken', name: '🐔 Chicken', shopId: 'emote_chicken' },
      { id: 'disco', name: '🕺 Disco', shopId: 'emote_disco' },
      { id: 'twerk', name: '🍑 Twerk', shopId: 'emote_twerk' },
      { id: 'salute', name: '🫡 Salute', shopId: 'emote_salute' },
      { id: 'backflip', name: '🤸 Backflip', shopId: 'emote_backflip' },
      { id: 'celebrate', name: '🎉 Celebrate', shopId: 'emote_celebrate' },
      { id: 'cry', name: '😭 Cry', shopId: 'emote_cry' },
      { id: 'laugh', name: '🤣 Laugh', shopId: 'emote_laugh' },
      { id: 'sit', name: '🪑 Sit', shopId: 'emote_sit' },
      { id: 'pushup', name: '💪 Push-ups', shopId: 'emote_pushup' },
      { id: 'tornado', name: '🌪️ Tornado', shopId: 'emote_tornado' },
      { id: 'zombie', name: '🧟 Zombie', shopId: 'emote_zombie' },
      { id: 'ninja', name: '🥷 Ninja', shopId: 'emote_ninja' },
      { id: 'worm', name: '🪱 Worm', shopId: 'emote_worm' },
      { id: 'moonwalk', name: '🌑 Moonwalk', shopId: 'emote_moonwalk' },
      { id: 'breakdance', name: '💃 Breakdance', shopId: 'emote_breakdance' },
      { id: 'rage', name: '😡 Rage', shopId: 'emote_rage' },
      { id: 'sleep', name: '😴 Sleep', shopId: 'emote_sleep' },
      { id: 'clap', name: '👏 Clap', shopId: 'emote_clap' },
      { id: 'bow', name: '🙇 Bow', shopId: 'emote_bow' },
      { id: 'kungfu', name: '🥋 Kung Fu', shopId: 'emote_kungfu' },
      { id: 't_pose', name: '✈ T-Pose', shopId: 'emote_t_pose' },
      { id: 'shake', name: '🎶 Shake', shopId: 'emote_shake' },
      { id: 'prayer', name: '🙏 Pray', shopId: 'emote_prayer' },
      { id: 'dj', name: '🎧 DJ', shopId: 'emote_dj' },
      { id: 'sway', name: '🎵 Sway', shopId: 'emote_sway' },
      { id: 'victory', name: '🏆 Victory', shopId: 'emote_victory' },
      { id: 'cartwheel', name: '🤸 Cartwheel', shopId: 'emote_cartwheel' },
    ];
    this._emotePage = 0;
    this._emotesPerPage = 8;

    // Scroll buttons
    document.getElementById('emote-scroll-left')?.addEventListener('click', () => {
      this._emotePage = Math.max(0, this._emotePage - 1);
      this._renderEmoteWheel();
    });
    document.getElementById('emote-scroll-right')?.addEventListener('click', () => {
      const owned = this._getOwnedEmotes();
      const maxPage = Math.floor((owned.length - 1) / this._emotesPerPage);
      this._emotePage = Math.min(maxPage, this._emotePage + 1);
      this._renderEmoteWheel();
    });
  }

  _getOwnedEmotes() {
    const purchases = JSON.parse(localStorage.getItem('shopPurchases') || '{}');
    return this._allEmotes.filter(e => e.free || purchases[e.shopId]);
  }

  _renderEmoteWheel() {
    const container = document.getElementById('emote-wheel-page');
    const dotsContainer = document.getElementById('emote-page-dots');
    if (!container) return;

    const owned = this._getOwnedEmotes();
    const totalPages = Math.ceil(owned.length / this._emotesPerPage);
    const start = this._emotePage * this._emotesPerPage;
    const pageEmotes = owned.slice(start, start + this._emotesPerPage);

    container.innerHTML = '';
    pageEmotes.forEach(emote => {
      const btn = document.createElement('div');
      btn.className = 'emote-option';
      btn.setAttribute('data-emote', emote.id);
      btn.textContent = emote.name;
      btn.addEventListener('click', () => {
        this.useEmote(emote.id);
        this.closeEmoteWheel();
      });
      container.appendChild(btn);
    });

    // Page dots
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement('div');
        dot.className = 'emote-dot' + (i === this._emotePage ? ' active' : '');
        dotsContainer.appendChild(dot);
      }
    }

    // Show/hide scroll buttons and nav
    const leftBtn = document.getElementById('emote-scroll-left');
    const rightBtn = document.getElementById('emote-scroll-right');
    const nav = document.getElementById('emote-nav');
    if (nav) nav.style.display = totalPages > 1 ? 'flex' : 'none';
    if (leftBtn) {
      leftBtn.style.opacity = this._emotePage > 0 ? '1' : '0.3';
      leftBtn.style.pointerEvents = this._emotePage > 0 ? 'all' : 'none';
    }
    if (rightBtn) {
      rightBtn.style.opacity = this._emotePage < totalPages - 1 ? '1' : '0.3';
      rightBtn.style.pointerEvents = this._emotePage < totalPages - 1 ? 'all' : 'none';
    }
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
    this._renderEmoteWheel();
    document.getElementById('emote-wheel').style.display = 'flex';
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
    // Show emote name in chat and above player
    const emoteNames = {
      dance: '💃 Dance', spin: '🌀 Spin', wave: '👋 Wave', jump: '⭐ Jump',
      flex: '💪 Flex', dab: '🤦 Dab', headbang: '🎤 Headbang', floss: '🙂 Floss'
    };
    const displayName = emoteNames[emote] || emote;
    this.chat.addMessage(this.state.username, displayName, 'emote');
    this.achievements.unlock('emote_use', this.hud);

    // Show 3D bubble above player
    this.showEmoteBubble(displayName);

    // Play the dance animation on the player mesh
    this._playEmoteAnimation(emote);
  }

  _stopEmoteAnimation() {
    if (this._emoteObs) {
      this.scene.onBeforeRenderObservable.remove(this._emoteObs);
      this._emoteObs = null;
    }
    // Reset visual root transforms (not the physics mesh!)
    const vr = this.player.visualRoot;
    if (vr) {
      vr.rotation.x = 0;
      vr.rotation.y = 0;
      vr.rotation.z = 0;
      vr.scaling.set(1, 1, 1);
    }
    // Return to first person
    this._emoteCamera = false;
    this._emoteCamLerp = 0;
  }

  _playEmoteAnimation(emote) {
    // Stop any existing emote animation
    this._stopEmoteAnimation();

    // Switch to third-person camera so you can see yourself!
    this._emoteCamera = true;
    this._emoteCamLerp = 0;

    // Animate the visualRoot (child of physics mesh) so physics doesn't override it
    const vr = this.player.visualRoot;
    if (!vr) return;
    const physBody = this.player.mesh; // the physics mesh for jump/velocity

    // All emotes use a unified animation loop — BIG movements so you can see them!
    const animations = {
      dance:    { dur: 4.0, fn: (t) => { vr.rotation.z = Math.sin(t * 8) * 0.3; } },
      spin:     { dur: 2.0, fn: (t, d, sy) => { vr.rotation.y = sy + (t / d) * Math.PI * 6; } },
      wave:     { dur: 2.5, fn: (t) => { vr.rotation.z = Math.sin(t * 5) * 0.25; } },
      jump:     { dur: 3.0, fn: (t) => { if (physBody.physicsImpostor && Math.sin(t * 4) > 0.9) physBody.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 5, 0)); vr.rotation.z = Math.sin(t * 8) * 0.1; } },
      flex:     { dur: 3.0, fn: (t) => { const p = 1 + Math.sin(t * 3) * 0.15; vr.scaling.set(p, 1 + Math.sin(t * 6) * 0.05, p); } },
      dab:      { dur: 2.0, fn: (t) => { const pr = Math.min(t / 0.3, 1); const h = t > 0.3 && t < 1.5 ? 1 : (t >= 1.5 ? Math.max(0, 1 - (t - 1.5) / 0.5) : pr); vr.rotation.z = h * 0.4; vr.rotation.x = h * -0.2; } },
      headbang: { dur: 3.0, fn: (t) => { vr.rotation.x = Math.sin(t * 12) * 0.25; } },
      floss:    { dur: 3.5, fn: (t) => { vr.rotation.z = Math.sin(t * 10) * 0.35; } },
      robot:    { dur: 3.0, fn: (t) => { vr.rotation.z = Math.round(Math.sin(t * 3) * 3) / 3 * 0.2; vr.rotation.x = Math.round(Math.cos(t * 2.5) * 3) / 3 * 0.15; } },
      chicken:  { dur: 3.0, fn: (t) => { vr.rotation.x = Math.sin(t * 10) * 0.2; vr.rotation.z = Math.sin(t * 5) * 0.1; } },
      disco:    { dur: 3.5, fn: (t) => { vr.rotation.z = Math.sin(t * 6) * 0.35; const s = 1 + Math.sin(t * 12) * 0.06; vr.scaling.set(s, 1, s); } },
      twerk:    { dur: 3.0, fn: (t) => { vr.rotation.x = Math.sin(t * 14) * 0.2; } },
      salute:   { dur: 2.5, fn: (t) => { const h = t < 0.4 ? t / 0.4 : (t > 2.0 ? Math.max(0, 1 - (t - 2.0) / 0.5) : 1); vr.rotation.x = h * -0.15; } },
      backflip: { dur: 1.8, fn: (t, d) => { vr.rotation.x = -(t / d) * Math.PI * 2; if (physBody.physicsImpostor && t < 0.1) physBody.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 8, 0)); } },
      celebrate:{ dur: 3.5, fn: (t) => { vr.rotation.z = Math.sin(t * 7) * 0.25; if (physBody.physicsImpostor && Math.sin(t * 3) > 0.9) physBody.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 5, 0)); } },
      cry:      { dur: 3.0, fn: (t) => { vr.rotation.x = 0.25; vr.rotation.z = Math.sin(t * 18) * 0.06; } },
      laugh:    { dur: 3.0, fn: (t) => { vr.rotation.x = -0.1 + Math.sin(t * 14) * 0.12; vr.scaling.set(1, 1 + Math.sin(t * 14) * 0.05, 1); } },
      sit:      { dur: 5.0, fn: (t) => { vr.rotation.x = 0.15; } },
      pushup:   { dur: 3.5, fn: (t) => { vr.rotation.x = 0.4 + Math.sin(t * 4) * 0.35; } },
      tornado:  { dur: 3.0, fn: (t, d, sy) => { vr.rotation.y = sy + t * 20; vr.rotation.z = Math.sin(t * 6) * 0.3; } },
      zombie:   { dur: 4.0, fn: (t) => { vr.rotation.x = 0.2; vr.rotation.z = Math.sin(t * 2) * 0.15; } },
      ninja:    { dur: 2.5, fn: (t) => { const h = t < 0.5 ? t / 0.5 : 1; vr.rotation.z = h * -0.3; vr.rotation.x = h * -0.1; } },
      worm:     { dur: 3.5, fn: (t) => { vr.rotation.x = 0.5 + Math.sin(t * 8) * 0.4; vr.rotation.z = Math.sin(t * 4) * 0.1; } },
      moonwalk: { dur: 3.0, fn: (t) => { vr.rotation.z = Math.sin(t * 3) * 0.1; vr.rotation.x = -0.05; } },
      breakdance: { dur: 3.5, fn: (t, d, sy) => { vr.rotation.x = 0.5; vr.rotation.y = sy + t * 12; } },
      rage:     { dur: 2.5, fn: (t) => { vr.rotation.z = Math.sin(t * 30) * 0.15; vr.rotation.x = -0.15; const s = 1 + Math.sin(t * 8) * 0.08; vr.scaling.set(s, s, s); } },
      sleep:    { dur: 5.0, fn: (t) => { vr.rotation.x = 0.3; vr.rotation.z = Math.sin(t * 1.5) * 0.05; } },
      clap:     { dur: 2.5, fn: (t) => { vr.rotation.x = Math.sin(t * 8) * 0.08; vr.scaling.set(1, 1 + Math.abs(Math.sin(t * 8)) * 0.04, 1); } },
      bow:      { dur: 2.5, fn: (t) => { const h = t < 0.6 ? t / 0.6 : (t > 2.0 ? Math.max(0, 1 - (t - 2.0) / 0.5) : 1); vr.rotation.x = h * 0.5; } },
      kungfu:   { dur: 3.0, fn: (t) => { vr.rotation.z = Math.sin(t * 6) * 0.3; vr.rotation.x = Math.sin(t * 4) * 0.2; if (physBody.physicsImpostor && Math.sin(t * 3) > 0.95) physBody.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 4, 0)); } },
      t_pose:   { dur: 4.0, fn: (t) => { const h = t < 0.5 ? t / 0.5 : 1; vr.scaling.set(1 + h * 0.3, 1, 1); } },
      shake:    { dur: 3.0, fn: (t) => { vr.rotation.z = Math.sin(t * 10) * 0.3; vr.rotation.x = Math.sin(t * 7) * 0.1; } },
      prayer:   { dur: 3.5, fn: (t) => { const h = t < 0.5 ? t / 0.5 : 1; vr.rotation.x = h * 0.15; } },
      dj:       { dur: 3.5, fn: (t) => { vr.rotation.z = Math.sin(t * 6) * 0.2; vr.rotation.y += Math.sin(t * 3) * 0.01; } },
      sway:     { dur: 4.0, fn: (t) => { vr.rotation.z = Math.sin(t * 3) * 0.2; } },
      victory:  { dur: 4.0, fn: (t) => { vr.rotation.z = Math.sin(t * 8) * 0.3; if (physBody.physicsImpostor && Math.sin(t * 4) > 0.9) physBody.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 6, 0)); const s = 1 + Math.sin(t * 6) * 0.06; vr.scaling.set(s, s, s); } },
      cartwheel:{ dur: 2.0, fn: (t, d) => { vr.rotation.z = (t / d) * Math.PI * 2; if (physBody.physicsImpostor && t < 0.1) physBody.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(3, 5, 0)); } },
    };

    const anim = animations[emote];
    if (!anim) return;

    const startY = vr.rotation.y;
    let t = 0;
    this._emoteObs = this.scene.onBeforeRenderObservable.add(() => {
      t += this.engine.getDeltaTime() / 1000;
      if (t > anim.dur) {
        this._stopEmoteAnimation();
        return;
      }
      anim.fn(t, anim.dur, startY);
    });
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

    // Position camera — third-person during emotes, first-person otherwise
    const playerPos = this.player.mesh.position;

    if (this._emoteCamera) {
      // Smoothly lerp the camera zoom
      this._emoteCamLerp = Math.min(1, (this._emoteCamLerp || 0) + deltaTime * 3);
      const t = this._emoteCamLerp;
      // Position camera behind and above the player
      const behindX = -Math.sin(this._cameraYaw) * 4;
      const behindZ = -Math.cos(this._cameraYaw) * 4;
      this.camera.position.x = playerPos.x + behindX * t;
      this.camera.position.y = playerPos.y + 1.5 + 2.0 * t;
      this.camera.position.z = playerPos.z + behindZ * t;
      // Look at the player
      this.camera.setTarget(new BABYLON.Vector3(
        playerPos.x,
        playerPos.y + 0.8,
        playerPos.z
      ));
      // Make player mesh visible during emote
      this.player.mesh.getChildMeshes().forEach(m => { m.isVisible = true; });
    } else {
      // Hide player mesh in first person (camera is inside the head)
      this.player.mesh.getChildMeshes().forEach(m => { m.isVisible = false; });

      // First-person camera at player's head
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
    }

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
