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
import { Projectile } from './entities/Projectile.js';
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
    this.scene.maxSimultaneousLights = 4;
    // Performance: skip light sorting and limit active lights
    this.scene.autoClear = false;
    this.scene.blockMaterialDirtyMechanism = true;

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

    // Admin panel (Ctrl key)
    this._godMode = false;
    this._setupAdminPanel();

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

      // Admin boost for Gavin's accounts only
      const _adminNames = ['ggamer', 'weclyfrec', 'forchen alt'];
      if (_adminNames.includes(nameVal.toLowerCase())) {
        localStorage.setItem('totalCoins', '25000000');
        localStorage.setItem('totalKills', '1000000');
        localStorage.setItem('savedLevel', '9');
        this.state.coins = parseInt(localStorage.getItem('totalCoins'));
        this.state.totalKills = 1000000;
        this.state.currentLevel = 9;
      }

      this.checkGiftInbox();
      document.getElementById('start-screen').style.display = 'none';
      this.state.started = true;
      this.shop.applyUpgrades(this.state, this.player);
      this.soundManager.init();
      this.hud.show();
      this.chat.setUsername(this.state.username);
      this.chat.show();
      this.chat.startPolling();
      this.chat.systemMsg(`${this.state.username} has joined the quest!`);
      this.achievements.unlock('welcome', this.hud);

      this.startLevel(this.state.currentLevel);
      this.hud.update();
      this._startBroadcastPolling();
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
      this.chat.startPolling();
      this.chat.systemMsg(`${this.state.username} entered SURVIVAL MODE! Survive 60 seconds!`);
      // Pick a random level map for variety
      const randomLevel = Math.floor(Math.random() * this.enemyManager.getTotalLevels());
      this.startSurvivalLevel(randomLevel);
      this.hud.update();
      this._startBroadcastPolling();
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
      this.chat.setUsername(this.state.username);
      this.chat.show();
      this.chat.startPolling();
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
      this.chat.startPolling();
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

      // Don't capture keys when typing in an input field (admin panel, etc.)
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

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

  // ==================== ADMIN PANEL ====================
  _setupAdminPanel() {
    const ADMIN_NAMES = ['ggamer', 'weclyfrec', 'forchen alt'];
    this._adminPanelOpen = false;
    this._adminTab = 'spawn';

    // Ctrl or Backtick (`) opens admin panel (only for admin usernames)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'ControlLeft' || e.code === 'ControlRight' || e.code === 'Backquote') {
        if (!this.state.started) return;
        if (!ADMIN_NAMES.includes((this.state.username || '').toLowerCase())) return;
        e.preventDefault();
        if (this._adminPanelOpen) {
          this._closeAdminPanel();
        } else {
          this._openAdminPanel();
        }
      }
    });

    // Tab switching
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._adminTab = tab.dataset.tab;
        this._renderAdminTab();
      });
    });

    // Close button
    document.getElementById('admin-close-btn').addEventListener('click', () => {
      this._closeAdminPanel();
    });

    // Admin Abuse mega button
    this._abuseActive = false;
    const abuseBtn = document.getElementById('admin-abuse-btn');
    if (abuseBtn) {
      abuseBtn.addEventListener('click', () => {
        this._abuseActive = !this._abuseActive;
        this._toggleGlobalAbuse(this._abuseActive);
        abuseBtn.className = this._abuseActive ? 'admin-abuse-on' : 'admin-abuse-off';
        abuseBtn.innerHTML = this._abuseActive
          ? '&#9989; ADMIN ABUSE ACTIVE — CLICK TO STOP'
          : '&#128520; START ADMIN ABUSE';
      });
    }
  }

  _openAdminPanel() {
    this._adminPanelOpen = true;
    document.getElementById('admin-panel').style.display = 'flex';
    document.exitPointerLock();
    // Freeze the game so you don't die while in admin panel
    this._adminFrozenScene = true;
    this.scene.physicsEnabled = false;
    this._renderAdminTab();
    this.achievements.unlock('admin_panel', this.hud);
  }

  _closeAdminPanel() {
    this._adminPanelOpen = false;
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('admin-status').textContent = '';
    // Unfreeze the game
    this._adminFrozenScene = false;
    this.scene.physicsEnabled = true;
    // Re-lock pointer for gameplay
    const canvas = document.getElementById('gameCanvas');
    if (canvas) canvas.requestPointerLock();
  }

  _adminStatus(msg) {
    const el = document.getElementById('admin-status');
    if (el) {
      el.textContent = msg;
      setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 3000);
    }
  }

  _renderAdminTab() {
    const content = document.getElementById('admin-content');
    if (!content) return;

    switch (this._adminTab) {
      case 'spawn': this._renderAdminSpawn(content); break;
      case 'give': this._renderAdminGive(content); break;
      case 'player': this._renderAdminPlayer(content); break;
      case 'world': this._renderAdminWorld(content); break;
      case 'powers': this._renderAdminPowers(content); break;
      case 'events': this._renderAdminEvents(content); break;
      case 'chatspy': this._renderAdminChatSpy(content); break;
      case 'broadcast': this._renderAdminBroadcast(content); break;
      case 'players': this._renderAdminPlayers(content); break;
    }
  }

  _renderAdminSpawn(el) {
    el.innerHTML = `
      <div class="admin-row">
        <div class="admin-row-label">Enemy <small>(spawns near you)</small></div>
        <input class="admin-input" id="admin-spawn-count" type="number" value="1" min="1" max="50">
        <button class="admin-btn" id="admin-spawn-enemy">SPAWN</button>
      </div>
      <div class="admin-row">
        <div class="admin-row-label">Boss <small>(big boss enemy)</small></div>
        <button class="admin-btn" id="admin-spawn-boss">SPAWN BOSS</button>
      </div>
      <div class="admin-row">
        <div class="admin-row-label">Coins <small>(drop near you)</small></div>
        <input class="admin-input" id="admin-coin-amount" type="number" value="1000" min="1">
        <button class="admin-btn gold" id="admin-spawn-coins">DROP</button>
      </div>
      <div class="admin-row">
        <div class="admin-row-label">Health Pickup</div>
        <button class="admin-btn green" id="admin-spawn-health">SPAWN</button>
      </div>
      <div class="admin-row">
        <div class="admin-row-label">Ammo Crate</div>
        <button class="admin-btn green" id="admin-spawn-ammo">SPAWN</button>
      </div>
    `;

    document.getElementById('admin-spawn-enemy').onclick = () => {
      const count = parseInt(document.getElementById('admin-spawn-count').value) || 1;
      const pos = this.player.mesh.position;
      for (let i = 0; i < Math.min(count, 50); i++) {
        const offset = new BABYLON.Vector3((Math.random()-0.5)*10, 0, (Math.random()-0.5)*10);
        this.enemyManager.spawnEnemy(pos.add(offset));
      }
      this._adminStatus(`Spawned ${Math.min(count,50)} enemies!`);
    };

    document.getElementById('admin-spawn-boss').onclick = () => {
      this.enemyManager.spawnBoss(this);
      this._adminStatus('Boss spawned!');
    };

    document.getElementById('admin-spawn-coins').onclick = () => {
      const amount = parseInt(document.getElementById('admin-coin-amount').value) || 1000;
      this.state.coins += amount;
      localStorage.setItem('totalCoins', this.state.coins.toString());
      this.hud.update();
      this._adminStatus(`Added ${amount.toLocaleString()} coins!`);
    };

    document.getElementById('admin-spawn-health').onclick = () => {
      this.state.health = this.state.maxHealth;
      this.hud.update();
      this._adminStatus('Health fully restored!');
    };

    document.getElementById('admin-spawn-ammo').onclick = () => {
      this.state.ammo = { fire: 999, ice: 999, lightning: 999 };
      this.hud.update();
      this._adminStatus('Ammo maxed out!');
    };
  }

  _renderAdminGive(el) {
    // Build list of all shop items
    const allItems = [];
    for (const cat of Object.keys(this.shop.items)) {
      for (const item of this.shop.items[cat]) {
        if (!item.consumable) {
          allItems.push({ ...item, category: cat });
        }
      }
    }

    let html = `
      <div class="admin-row">
        <div class="admin-row-label">Give ALL shop items</div>
        <button class="admin-btn gold" id="admin-give-all">GIVE ALL</button>
      </div>
      <div class="admin-row">
        <div class="admin-row-label">Give ALL skins</div>
        <button class="admin-btn gold" id="admin-give-skins">ALL SKINS</button>
      </div>
      <div class="admin-row">
        <div class="admin-row-label">Give ALL emotes</div>
        <button class="admin-btn gold" id="admin-give-emotes">ALL EMOTES</button>
      </div>
      <div style="color:#888;font-size:12px;padding:8px;margin-top:6px;">Individual Items:</div>
    `;

    allItems.forEach(item => {
      const owned = !!this.shop.purchases[item.id];
      html += `
        <div class="admin-row">
          <div class="admin-row-label">${item.name} <small>(${item.category})</small></div>
          <button class="admin-btn ${owned ? 'green' : ''}" data-give-id="${item.id}">${owned ? 'OWNED' : 'GIVE'}</button>
        </div>
      `;
    });

    el.innerHTML = html;

    // Give all
    document.getElementById('admin-give-all').onclick = () => {
      allItems.forEach(item => { this.shop.purchases[item.id] = true; });
      localStorage.setItem('shopPurchases', JSON.stringify(this.shop.purchases));
      this.shop.applyUpgrades(this.state, this.player);
      this._adminStatus('All shop items unlocked!');
      this._renderAdminTab();
    };

    // Give all skins
    document.getElementById('admin-give-skins').onclick = () => {
      const skinIds = ['skin_silver','skin_gold','skin_dark','skin_crystal','skin_rainbow','skin_lava','skin_frost','skin_shadow','skin_emerald','skin_royal','skin_candy','skin_galaxy','skin_neon','skin_sunset','skin_ocean','skin_void','skin_diamond','skin_chrome','skin_inferno'];
      skinIds.forEach(id => { this.shop.purchases[id] = true; });
      localStorage.setItem('shopPurchases', JSON.stringify(this.shop.purchases));
      this._adminStatus('All skins unlocked!');
      this._renderAdminTab();
    };

    // Give all emotes
    document.getElementById('admin-give-emotes').onclick = () => {
      const emoteItems = this.shop.items.emotes || [];
      emoteItems.forEach(item => { this.shop.purchases[item.id] = true; });
      localStorage.setItem('shopPurchases', JSON.stringify(this.shop.purchases));
      this._adminStatus('All emotes unlocked!');
      this._renderAdminTab();
    };

    // Individual give buttons
    el.querySelectorAll('[data-give-id]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.giveId;
        this.shop.purchases[id] = true;
        localStorage.setItem('shopPurchases', JSON.stringify(this.shop.purchases));
        this.shop.applyUpgrades(this.state, this.player);
        btn.textContent = 'OWNED';
        btn.classList.add('green');
        this._adminStatus(`Gave ${id}!`);
      };
    });
  }

  _renderAdminPlayer(el) {
    el.innerHTML = `
      <div class="admin-row">
        <div class="admin-row-label">Health</div>
        <input class="admin-input" id="admin-health" type="number" value="${this.state.health}" min="1">
        <button class="admin-btn green" id="admin-set-health">SET</button>
      </div>
      <div class="admin-row">
        <div class="admin-row-label">Max Health</div>
        <input class="admin-input" id="admin-max-health" type="number" value="${this.state.maxHealth}" min="1">
        <button class="admin-btn green" id="admin-set-max-health">SET</button>
      </div>
      <div class="admin-row">
        <div class="admin-row-label">Coins</div>
        <input class="admin-input" id="admin-coins" type="number" value="${this.state.coins}" min="0">
        <button class="admin-btn gold" id="admin-set-coins">SET</button>
      </div>
      <div class="admin-row">
        <div class="admin-row-label">Score</div>
        <input class="admin-input" id="admin-score" type="number" value="${this.state.score}" min="0">
        <button class="admin-btn" id="admin-set-score">SET</button>
      </div>
      <div class="admin-row">
        <div class="admin-row-label">God Mode <small>(invincible)</small></div>
        <button class="admin-btn ${this._godMode ? 'green' : ''}" id="admin-god">${this._godMode ? 'ON' : 'OFF'}</button>
      </div>
      <div class="admin-row">
        <div class="admin-row-label">Speed Multiplier</div>
        <input class="admin-input" id="admin-speed" type="number" value="${this.state.speedMultiplier || 1}" min="0.5" max="10" step="0.25">
        <button class="admin-btn" id="admin-set-speed">SET</button>
      </div>
      <div class="admin-row">
        <div class="admin-row-label">Damage Multiplier</div>
        <input class="admin-input" id="admin-dmg" type="number" value="${this.state.damageMultiplier || 1}" min="0.5" max="100" step="0.5">
        <button class="admin-btn" id="admin-set-dmg">SET</button>
      </div>
      <div class="admin-row">
        <div class="admin-row-label">Teleport to Spawn</div>
        <button class="admin-btn" id="admin-tp-spawn">TELEPORT</button>
      </div>
      <div class="admin-row">
        <div class="admin-row-label">Kill All Enemies</div>
        <button class="admin-btn" id="admin-kill-all">KILL ALL</button>
      </div>
    `;

    document.getElementById('admin-set-health').onclick = () => {
      this.state.health = parseInt(document.getElementById('admin-health').value) || 100;
      this.hud.update();
      this._adminStatus(`Health set to ${this.state.health}`);
    };

    document.getElementById('admin-set-max-health').onclick = () => {
      this.state.maxHealth = parseInt(document.getElementById('admin-max-health').value) || 100;
      this.state.health = Math.min(this.state.health, this.state.maxHealth);
      this.hud.update();
      this._adminStatus(`Max health set to ${this.state.maxHealth}`);
    };

    document.getElementById('admin-set-coins').onclick = () => {
      this.state.coins = parseInt(document.getElementById('admin-coins').value) || 0;
      localStorage.setItem('totalCoins', this.state.coins.toString());
      this.hud.update();
      this._adminStatus(`Coins set to ${this.state.coins.toLocaleString()}`);
    };

    document.getElementById('admin-set-score').onclick = () => {
      this.state.score = parseInt(document.getElementById('admin-score').value) || 0;
      this.hud.update();
      this._adminStatus(`Score set to ${this.state.score.toLocaleString()}`);
    };

    document.getElementById('admin-god').onclick = () => {
      this._godMode = !this._godMode;
      this._adminStatus(`God Mode: ${this._godMode ? 'ON' : 'OFF'}`);
      if (this._godMode) this.achievements.unlock('admin_god_mode', this.hud);
      this._renderAdminTab();
    };

    document.getElementById('admin-set-speed').onclick = () => {
      this.state.speedMultiplier = parseFloat(document.getElementById('admin-speed').value) || 1;
      this._adminStatus(`Speed set to ${this.state.speedMultiplier}x`);
    };

    document.getElementById('admin-set-dmg').onclick = () => {
      this.state.damageMultiplier = parseFloat(document.getElementById('admin-dmg').value) || 1;
      this._adminStatus(`Damage set to ${this.state.damageMultiplier}x`);
    };

    document.getElementById('admin-tp-spawn').onclick = () => {
      this.player.mesh.position = new BABYLON.Vector3(0, 2, 0);
      if (this.player.mesh.physicsImpostor) {
        this.player.mesh.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
      }
      this._adminStatus('Teleported to spawn!');
    };

    document.getElementById('admin-kill-all').onclick = () => {
      const count = this.enemyManager.enemies.length;
      this.enemyManager.clearAll();
      this._adminStatus(`Killed ${count} enemies!`);
    };
  }

  _renderAdminWorld(el) {
    const levels = ['Castle', 'Forest', 'Sky Battle', 'Lava Fortress', 'Frozen Depths', 'Shadow Realm', 'Storm Peaks', 'Poison Swamp', 'Crystal Caverns', 'The Void'];
    let html = '<div style="color:#888;font-size:12px;padding:8px;">Jump to Level:</div>';
    levels.forEach((name, i) => {
      html += `
        <div class="admin-row">
          <div class="admin-row-label">${i+1}. ${name}</div>
          <button class="admin-btn" data-level="${i}">GO</button>
        </div>
      `;
    });

    html += `
      <div style="color:#888;font-size:12px;padding:8px;margin-top:10px;">Other:</div>
      <div class="admin-row">
        <div class="admin-row-label">Complete Current Level</div>
        <button class="admin-btn green" id="admin-complete-level">COMPLETE</button>
      </div>
      <div class="admin-row">
        <div class="admin-row-label">Time of Day</div>
        <select class="admin-input" id="admin-time" style="width:120px;">
          <option value="day">Day</option>
          <option value="sunset">Sunset</option>
          <option value="night">Night</option>
          <option value="bright">Super Bright</option>
        </select>
        <button class="admin-btn" id="admin-set-time">SET</button>
      </div>
      <div class="admin-row">
        <div class="admin-row-label">Fog</div>
        <button class="admin-btn" id="admin-fog-off">OFF</button>
        <button class="admin-btn" id="admin-fog-on">ON</button>
      </div>
    `;

    el.innerHTML = html;

    // Level jump buttons
    el.querySelectorAll('[data-level]').forEach(btn => {
      btn.onclick = () => {
        const lvl = parseInt(btn.dataset.level);
        this._closeAdminPanel();
        this.startLevel(lvl);
        this._adminStatus(`Jumped to level ${lvl + 1}!`);
      };
    });

    document.getElementById('admin-complete-level').onclick = () => {
      this.enemyManager.clearAll();
      this.state.enemiesRemaining = 0;
      this._adminStatus('Level completed!');
      this.checkLevelComplete();
    };

    document.getElementById('admin-set-time').onclick = () => {
      const time = document.getElementById('admin-time').value;
      if (this.sunLight) {
        switch (time) {
          case 'day':
            this.sunLight.intensity = 1.5;
            this.sunLight.diffuse = new BABYLON.Color3(1, 0.95, 0.8);
            this.scene.clearColor = new BABYLON.Color4(0.5, 0.7, 1.0, 1);
            break;
          case 'sunset':
            this.sunLight.intensity = 1.0;
            this.sunLight.diffuse = new BABYLON.Color3(1, 0.5, 0.2);
            this.scene.clearColor = new BABYLON.Color4(0.8, 0.4, 0.2, 1);
            break;
          case 'night':
            this.sunLight.intensity = 0.3;
            this.sunLight.diffuse = new BABYLON.Color3(0.3, 0.3, 0.5);
            this.scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.08, 1);
            break;
          case 'bright':
            this.sunLight.intensity = 4.0;
            this.sunLight.diffuse = new BABYLON.Color3(1, 1, 1);
            this.scene.clearColor = new BABYLON.Color4(0.6, 0.8, 1.0, 1);
            break;
        }
      }
      this._adminStatus(`Time set to ${time}!`);
    };

    document.getElementById('admin-fog-off').onclick = () => {
      this.scene.fogMode = BABYLON.Scene.FOGMODE_NONE;
      this._adminStatus('Fog disabled!');
    };

    document.getElementById('admin-fog-on').onclick = () => {
      this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
      this._adminStatus('Fog enabled!');
    };
  }

  _renderAdminPowers(el) {
    // Initialize powers state if not yet
    if (!this._adminPowers) {
      this._adminPowers = {
        killAura: false,
        killAuraRange: 15,
        flyMode: false,
        infiniteAmmo: false,
        oneHitKill: false,
        freezeEnemies: false,
        invisible: false,
        speedHack: false,
        speedMultiplier: 3,
        giantMode: false,
        tinyMode: false,
        lowGravity: false,
        autoHeal: false,
        magnetMode: false,
        rainCoins: false,
        timeSlow: false,
        explodeAura: false,
        laserEyes: false,
      };
    }
    const p = this._adminPowers;

    const toggle = (key, label, desc) => {
      const on = p[key];
      return `<div class="admin-row">
        <div class="admin-row-label">${label}<br><small style="color:#888;">${desc}</small></div>
        <button class="admin-btn ${on ? 'green' : ''} power-toggle" data-power="${key}">${on ? 'ON' : 'OFF'}</button>
      </div>`;
    };

    el.innerHTML = `
      <div style="color:#ff4444;font-size:13px;padding:6px 8px;text-align:center;">ADMIN POWERS - Toggle abilities</div>
      ${toggle('killAura', 'KILL AURA', 'Auto-kill enemies within range')}
      ${toggle('explodeAura', 'EXPLODE AURA', 'Enemies near you EXPLODE')}
      ${toggle('flyMode', 'FLY MODE', 'Float and fly around freely')}
      ${toggle('infiniteAmmo', 'INFINITE AMMO', 'Never run out of ammo')}
      ${toggle('oneHitKill', 'ONE-HIT KILL', 'Everything dies in one hit')}
      ${toggle('freezeEnemies', 'FREEZE ENEMIES', 'All enemies stop moving')}
      ${toggle('invisible', 'INVISIBLE', 'Enemies cant see you')}
      ${toggle('speedHack', 'SPEED HACK', '3x movement speed')}
      ${toggle('giantMode', 'GIANT MODE', 'Become HUGE')}
      ${toggle('tinyMode', 'TINY MODE', 'Become tiny')}
      ${toggle('lowGravity', 'LOW GRAVITY', 'Moon jump!')}
      ${toggle('autoHeal', 'AUTO HEAL', 'Regenerate health constantly')}
      ${toggle('magnetMode', 'MAGNET MODE', 'Pickups fly to you')}
      ${toggle('rainCoins', 'RAIN COINS', 'Coins rain from the sky')}
      ${toggle('timeSlow', 'TIME SLOW', 'Everything in slow motion')}
      ${toggle('laserEyes', 'LASER EYES', 'Shoot lasers constantly')}
      <div style="color:#888;font-size:11px;padding:8px;">Instant Actions:</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;padding:0 8px 8px;">
        <button class="admin-btn" id="ap-killall">KILL ALL</button>
        <button class="admin-btn" id="ap-explodeall">EXPLODE ALL</button>
        <button class="admin-btn" id="ap-lightning">LIGHTNING STORM</button>
        <button class="admin-btn" id="ap-nuke">NUKE</button>
        <button class="admin-btn green" id="ap-healfull">FULL HEAL</button>
        <button class="admin-btn green" id="ap-coinbomb">COIN BOMB x100</button>
        <button class="admin-btn" id="ap-teleport">TELEPORT TO ENEMY</button>
        <button class="admin-btn" id="ap-yeet">YEET ENEMIES</button>
      </div>
    `;

    // Toggle buttons
    el.querySelectorAll('.power-toggle').forEach(btn => {
      btn.onclick = () => {
        const key = btn.dataset.power;
        p[key] = !p[key];
        this._applyAdminPower(key, p[key]);
        this._renderAdminPowers(el);
        this._adminStatus(`${key}: ${p[key] ? 'ON' : 'OFF'}`);

        // Admin power achievements
        if (p[key]) {
          const powerAchievements = {
            killAura: 'admin_kill_aura',
            flyMode: 'admin_fly',
            giantMode: 'admin_giant',
            tinyMode: 'admin_tiny',
            laserEyes: 'admin_laser_eyes',
          };
          if (powerAchievements[key]) this.achievements.unlock(powerAchievements[key], this.hud);

          // Check 5 powers active
          const activeCount = Object.values(p).filter(v => v === true).length;
          if (activeCount >= 5) this.achievements.unlock('admin_5_powers', this.hud);
          if (activeCount >= 16) this.achievements.unlock('admin_all_powers', this.hud);
        }
      };
    });

    // Instant actions
    document.getElementById('ap-killall').onclick = () => {
      const alive = this.enemyManager.getAliveEnemies();
      alive.forEach(e => { e.health = 0; e.die(); });
      this.state.score += alive.length * 10;
      this._adminStatus(`Killed ${alive.length} enemies!`);
    };

    document.getElementById('ap-explodeall').onclick = () => {
      const alive = this.enemyManager.getAliveEnemies();
      alive.forEach(e => {
        if (e.mesh) this.combatSystem.createExplosion(e.mesh.position.clone(), 'fire');
        e.health = 0; e.die();
      });
      this.state.score += alive.length * 10;
      this._adminStatus(`Exploded ${alive.length} enemies!`);
    };

    document.getElementById('ap-lightning').onclick = () => {
      const alive = this.enemyManager.getAliveEnemies();
      alive.forEach(e => {
        if (e.mesh) {
          this._spawnLightningBolt(e.mesh.position.clone());
          e.takeDamage(9999);
        }
      });
      this._adminStatus('LIGHTNING STORM!');
    };

    document.getElementById('ap-nuke').onclick = () => {
      // Giant explosion at player position
      const pos = this.player.mesh.position.clone();
      for (let i = 0; i < 8; i++) {
        const offset = new BABYLON.Vector3(
          (Math.random() - 0.5) * 20,
          Math.random() * 5,
          (Math.random() - 0.5) * 20
        );
        setTimeout(() => {
          this.combatSystem.createExplosion(pos.add(offset), 'fire');
        }, i * 100);
      }
      const alive = this.enemyManager.getAliveEnemies();
      alive.forEach(e => { e.health = 0; e.die(); });
      this.state.score += alive.length * 50;
      this._adminStatus('NUKE LAUNCHED! ☢');
      this.achievements.unlock('admin_nuke', this.hud);
    };

    document.getElementById('ap-healfull').onclick = () => {
      this.state.health = this.state.maxHealth;
      this._adminStatus('Fully healed!');
    };

    document.getElementById('ap-coinbomb').onclick = () => {
      const pos = this.player.mesh.position.clone();
      for (let i = 0; i < 100; i++) {
        const offset = new BABYLON.Vector3(
          (Math.random() - 0.5) * 15,
          0,
          (Math.random() - 0.5) * 15
        );
        this.pickupManager.spawn(pos.add(offset), 'coin');
      }
      this._adminStatus('100 coins spawned!');
    };

    document.getElementById('ap-teleport').onclick = () => {
      const alive = this.enemyManager.getAliveEnemies();
      if (alive.length > 0) {
        const target = alive[Math.floor(Math.random() * alive.length)];
        if (target.mesh) {
          this.player.mesh.position.copyFrom(target.mesh.position);
          this.player.mesh.position.y += 2;
          this._adminStatus('Teleported to enemy!');
        }
      } else {
        this._adminStatus('No enemies to teleport to!');
      }
    };

    document.getElementById('ap-yeet').onclick = () => {
      const alive = this.enemyManager.getAliveEnemies();
      alive.forEach(e => {
        if (e.mesh && e.mesh.physicsImpostor) {
          const dir = new BABYLON.Vector3(
            (Math.random() - 0.5) * 2, 3, (Math.random() - 0.5) * 2
          );
          e.mesh.physicsImpostor.applyImpulse(dir.scale(80), e.mesh.position);
        }
      });
      this._adminStatus(`Yeeted ${alive.length} enemies into the sky!`);
      this.achievements.unlock('admin_yeet', this.hud);
    };
  }

  _applyAdminPower(key, on) {
    switch (key) {
      case 'flyMode':
        if (this.player.mesh.physicsImpostor) {
          if (on) {
            this.player.mesh.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
            this._savedGravity = this.scene.getPhysicsEngine().gravity.clone();
            this.player.mesh.physicsImpostor.setMass(0);
          } else {
            this.player.mesh.physicsImpostor.setMass(1);
          }
        }
        break;
      case 'speedHack':
        this.player.speed = on ? 36 : 12;
        break;
      case 'giantMode':
        if (on) {
          this._adminPowers.tinyMode = false;
          this.player.mesh.scaling = new BABYLON.Vector3(3, 3, 3);
        } else {
          this.player.mesh.scaling = new BABYLON.Vector3(1, 1, 1);
        }
        break;
      case 'tinyMode':
        if (on) {
          this._adminPowers.giantMode = false;
          this.player.mesh.scaling = new BABYLON.Vector3(0.3, 0.3, 0.3);
        } else {
          this.player.mesh.scaling = new BABYLON.Vector3(1, 1, 1);
        }
        break;
      case 'lowGravity':
        if (this.scene.getPhysicsEngine()) {
          const g = on ? new BABYLON.Vector3(0, -2, 0) : new BABYLON.Vector3(0, -9.81, 0);
          this.scene.getPhysicsEngine().setGravity(g);
        }
        break;
      case 'oneHitKill':
        if (on) {
          this._savedDamageMultiplier = this.state.damageMultiplier || 1;
          this.state.damageMultiplier = 9999;
        } else {
          this.state.damageMultiplier = this._savedDamageMultiplier || 1;
        }
        break;
      case 'freezeEnemies':
        // Handled in update loop
        break;
      case 'invisible':
        // Make player mesh invisible to enemies (handled in update)
        break;
    }
  }

  _updateAdminPowers(deltaTime) {
    const p = this._adminPowers;
    if (!p) return;

    // Kill Aura — kill nearest enemies within range
    if (p.killAura) {
      const alive = this.enemyManager.getAliveEnemies();
      const pp = this.player.mesh.position;
      for (let i = 0; i < alive.length; i++) {
        const e = alive[i];
        if (!e.mesh) continue;
        const dist = BABYLON.Vector3.Distance(pp, e.mesh.position);
        if (dist < p.killAuraRange) {
          e.health = 0;
          e.die();
          this.state.score += 10;
          this.state.totalKills = (this.state.totalKills || 0) + 1;
          this._adminKills = (this._adminKills || 0) + 1;
          if (this._adminKills >= 1000) this.achievements.unlock('admin_abuse_1000', this.hud);
        }
      }
    }

    // Explode Aura — enemies near you explode
    if (p.explodeAura) {
      this._explodeAuraTimer = (this._explodeAuraTimer || 0) + deltaTime;
      if (this._explodeAuraTimer > 0.3) {
        this._explodeAuraTimer = 0;
        const alive = this.enemyManager.getAliveEnemies();
        const pp = this.player.mesh.position;
        for (let i = 0; i < alive.length; i++) {
          const e = alive[i];
          if (!e.mesh) continue;
          if (BABYLON.Vector3.Distance(pp, e.mesh.position) < 10) {
            this.combatSystem.createExplosion(e.mesh.position.clone(), 'fire');
            e.health = 0; e.die();
            this.state.score += 15;
            this._adminKills = (this._adminKills || 0) + 1;
            if (this._adminKills >= 1000) this.achievements.unlock('admin_abuse_1000', this.hud);
          }
        }
      }
    }

    // Fly mode — move position directly (physics mass=0 ignores velocity)
    if (p.flyMode && this.player.mesh) {
      const flySpeed = 25 * deltaTime;
      const move = new BABYLON.Vector3(0, 0, 0);
      if (this.inputManager.isKeyDown('w')) {
        move.x += Math.sin(this._cameraYaw) * flySpeed;
        move.z += Math.cos(this._cameraYaw) * flySpeed;
      }
      if (this.inputManager.isKeyDown('s')) {
        move.x -= Math.sin(this._cameraYaw) * flySpeed;
        move.z -= Math.cos(this._cameraYaw) * flySpeed;
      }
      if (this.inputManager.isKeyDown('a')) {
        move.x += Math.cos(this._cameraYaw) * flySpeed;
        move.z -= Math.sin(this._cameraYaw) * flySpeed;
      }
      if (this.inputManager.isKeyDown('d')) {
        move.x -= Math.cos(this._cameraYaw) * flySpeed;
        move.z += Math.sin(this._cameraYaw) * flySpeed;
      }
      if (this.inputManager.isKeyDown(' ')) move.y = flySpeed;
      if (this.inputManager.isKeyDown('shift')) move.y = -flySpeed;
      this.player.mesh.position.addInPlace(move);
    }

    // Infinite ammo
    if (p.infiniteAmmo) {
      this.state.ammo.fire = 999;
      this.state.ammo.ice = 999;
      this.state.ammo.lightning = 999;
    }

    // Freeze enemies — set velocity to zero
    if (p.freezeEnemies) {
      const alive = this.enemyManager.getAliveEnemies();
      for (let i = 0; i < alive.length; i++) {
        const e = alive[i];
        if (e.mesh && e.mesh.physicsImpostor) {
          e.mesh.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
        }
        e._frozen = true;
      }
    }

    // Invisible — enemies lose aggro
    if (p.invisible) {
      const alive = this.enemyManager.getAliveEnemies();
      for (let i = 0; i < alive.length; i++) {
        alive[i].aggroRange = 0;
      }
    } else {
      // Restore aggro when turned off
      if (this._wasInvisible) {
        const alive = this.enemyManager.getAliveEnemies();
        for (let i = 0; i < alive.length; i++) {
          alive[i].aggroRange = alive[i].baseAggroRange || 25;
        }
      }
    }
    this._wasInvisible = p.invisible;

    // Auto heal
    if (p.autoHeal) {
      this.state.health = Math.min(this.state.maxHealth, this.state.health + 50 * deltaTime);
    }

    // Magnet mode — pickups fly toward player
    if (p.magnetMode && this.pickupManager) {
      const pp = this.player.mesh.position;
      const pickups = this.pickupManager.pickups || [];
      for (let i = 0; i < pickups.length; i++) {
        const pk = pickups[i];
        if (pk.collected || !pk.mesh) continue;
        const dir = pp.subtract(pk.mesh.position);
        const dist = dir.length();
        if (dist > 0.5 && dist < 50) {
          dir.normalize();
          pk.mesh.position.addInPlace(dir.scale(deltaTime * 30));
        }
      }
    }

    // Rain coins
    if (p.rainCoins) {
      this._rainCoinTimer = (this._rainCoinTimer || 0) + deltaTime;
      if (this._rainCoinTimer > 0.15) {
        this._rainCoinTimer = 0;
        const pp = this.player.mesh.position;
        const offset = new BABYLON.Vector3(
          (Math.random() - 0.5) * 20,
          0,
          (Math.random() - 0.5) * 20
        );
        this.pickupManager.spawn(pp.add(offset), 'coin');
      }
    }

    // Time slow
    if (p.timeSlow) {
      // Enemies move at 0.25x speed — handled by scaling their deltaTime
      // We just set a flag the enemy manager can check
      this._timeSlowFactor = 0.25;
    } else {
      this._timeSlowFactor = 1.0;
    }

    // Laser eyes — auto-fire at nearest enemy
    if (p.laserEyes) {
      this._laserTimer = (this._laserTimer || 0) + deltaTime;
      if (this._laserTimer > 0.08) {
        this._laserTimer = 0;
        const alive = this.enemyManager.getAliveEnemies();
        if (alive.length > 0) {
          const pp = this.player.mesh.position.clone();
          pp.y += 1.5;
          let nearest = null;
          let nearDist = Infinity;
          for (let i = 0; i < alive.length; i++) {
            if (!alive[i].mesh) continue;
            const d = BABYLON.Vector3.Distance(pp, alive[i].mesh.position);
            if (d < nearDist) { nearDist = d; nearest = alive[i]; }
          }
          if (nearest && nearest.mesh && nearDist < 60) {
            const dir = nearest.mesh.position.subtract(pp).normalize();
            const elements = ['fire', 'ice', 'lightning'];
            const el = elements[Math.floor(Math.random() * 3)];
            const proj = new Projectile(this.scene, pp, dir, el, false);
            this.combatSystem.projectiles.push(proj);
          }
        }
      }
    }
  }

  _spawnLightningBolt(position) {
    // Visual lightning bolt effect
    const points = [];
    const top = position.clone();
    top.y += 30;
    const segments = 8;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const p = BABYLON.Vector3.Lerp(top, position, t);
      if (i > 0 && i < segments) {
        p.x += (Math.random() - 0.5) * 3;
        p.z += (Math.random() - 0.5) * 3;
      }
      points.push(p);
    }
    const bolt = BABYLON.MeshBuilder.CreateLines('lightning', { points }, this.scene);
    bolt.color = new BABYLON.Color3(1, 1, 0.3);
    bolt.alpha = 1;

    // Flash + fade
    let life = 0.4;
    const obs = this.scene.onBeforeRenderObservable.add(() => {
      const dt = this.scene.getEngine().getDeltaTime() / 1000;
      life -= dt;
      bolt.alpha = life / 0.4;
      if (life <= 0) {
        bolt.dispose();
        this.scene.onBeforeRenderObservable.remove(obs);
      }
    });

    // Ground explosion
    this.combatSystem.createExplosion(position, 'lightning');
  }

  _renderAdminEvents(el) {
    if (!this._activeEvents) this._activeEvents = {};
    const ev = this._activeEvents;

    const eventBtn = (id, icon, name, desc, active) => `
      <div class="admin-row">
        <div class="admin-row-label">${icon} ${name}<br><small style="color:#888;">${desc}</small></div>
        <button class="admin-btn ${active ? 'green' : ''} event-toggle" data-event="${id}">${active ? 'ACTIVE' : 'START'}</button>
      </div>`;

    el.innerHTML = `
      <div style="color:#ffd700;font-size:13px;padding:6px 8px;text-align:center;">
        SERVER EVENTS - Affects ALL players!
      </div>
      ${eventBtn('coinRain', '🪙', 'COIN RAIN', 'Coins rain from the sky for everyone!', ev.coinRain)}
      ${eventBtn('doubleXP', '⭐', 'DOUBLE XP', '2x score for all kills!', ev.doubleXP)}
      ${eventBtn('enemyInvasion', '👹', 'ENEMY INVASION', 'Spawn a massive wave of enemies!', ev.enemyInvasion)}
      ${eventBtn('bossRush', '💀', 'BOSS RUSH', 'Spawn a boss right now!', ev.bossRush)}
      ${eventBtn('lootExplosion', '🎁', 'LOOT EXPLOSION', 'Spawn tons of loot everywhere!', ev.lootExplosion)}
      ${eventBtn('chaos', '🌪', 'CHAOS MODE', 'Low gravity + speed boost + explosions!', ev.chaos)}
      ${eventBtn('disco', '🪩', 'DISCO PARTY', 'Rave lights and colors everywhere!', ev.disco)}
      ${eventBtn('supplyDrop', '📦', 'SUPPLY DROP', 'Drop potions and ammo everywhere!', ev.supplyDrop)}
      ${eventBtn('fireworks', '🎆', 'FIREWORKS SHOW', 'Fireworks display for everyone!', ev.fireworks)}
      ${eventBtn('zombie', '🧟', 'ZOMBIE HORDE', 'Endless enemy spawns!', ev.zombie)}
    `;

    el.querySelectorAll('.event-toggle').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.event;
        ev[id] = !ev[id];
        this._triggerEvent(id, ev[id]);
        this._renderAdminEvents(el);
      };
    });
  }

  _triggerEvent(eventId, active) {
    if (active) {
      this._sendBroadcast(this._getEventMessage(eventId));

      // Event achievements
      const eventAchievements = { chaos: 'admin_chaos', disco: 'admin_disco', zombie: 'admin_zombie' };
      if (eventAchievements[eventId]) this.achievements.unlock(eventAchievements[eventId], this.hud);

      // Track unique events triggered for Event Planner achievement
      if (!this._triggeredEvents) this._triggeredEvents = new Set();
      this._triggeredEvents.add(eventId);
      if (this._triggeredEvents.size >= 3) this.achievements.unlock('admin_event_3', this.hud);
    }

    switch (eventId) {
      case 'coinRain':
        if (active) {
          this._adminPowers = this._adminPowers || {};
          this._adminPowers.rainCoins = true;
          this._adminStatus('COIN RAIN activated!');
        } else {
          if (this._adminPowers) this._adminPowers.rainCoins = false;
          this._adminStatus('Coin Rain stopped.');
        }
        break;

      case 'doubleXP':
        if (active) {
          this._savedRewardMultiplier = this.state.rewardMultiplier || 1;
          this.state.rewardMultiplier = (this._savedRewardMultiplier || 1) * 2;
          this._adminStatus('DOUBLE XP activated!');
        } else {
          this.state.rewardMultiplier = this._savedRewardMultiplier || 1;
          this._adminStatus('Double XP ended.');
        }
        break;

      case 'enemyInvasion':
        if (active) {
          // Spawn 30 enemies around the player
          for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 10 + Math.random() * 20;
            const pos = this.player.mesh.position.clone();
            pos.x += Math.cos(angle) * dist;
            pos.z += Math.sin(angle) * dist;
            this.enemyManager.spawnEnemy(pos);
          }
          this._adminStatus('ENEMY INVASION! 30 enemies spawned!');
        }
        this._activeEvents.enemyInvasion = false;
        break;

      case 'bossRush':
        if (active) {
          this.enemyManager.spawnBoss(this);
          this._adminStatus('BOSS SPAWNED!');
        }
        this._activeEvents.bossRush = false;
        break;

      case 'lootExplosion':
        if (active) {
          const pp = this.player.mesh.position.clone();
          const types = ['coin', 'coin', 'coin', 'potion', 'ammo'];
          const subs = ['fire', 'ice', 'lightning'];
          for (let i = 0; i < 50; i++) {
            const offset = new BABYLON.Vector3(
              (Math.random() - 0.5) * 30, 0, (Math.random() - 0.5) * 30
            );
            const type = types[Math.floor(Math.random() * types.length)];
            const sub = type === 'ammo' ? subs[Math.floor(Math.random() * subs.length)] : undefined;
            this.pickupManager.spawn(pp.add(offset), type, sub);
          }
          this._adminStatus('LOOT EXPLOSION! 50 items spawned!');
        }
        this._activeEvents.lootExplosion = false;
        break;

      case 'chaos':
        if (active) {
          this._adminPowers = this._adminPowers || {};
          this._adminPowers.lowGravity = true;
          this._adminPowers.speedHack = true;
          this.player.speed = 36;
          if (this.scene.getPhysicsEngine()) {
            this.scene.getPhysicsEngine().setGravity(new BABYLON.Vector3(0, -2, 0));
          }
          this._adminStatus('CHAOS MODE activated!');
        } else {
          if (this._adminPowers) {
            this._adminPowers.lowGravity = false;
            this._adminPowers.speedHack = false;
          }
          this.player.speed = 12;
          if (this.scene.getPhysicsEngine()) {
            this.scene.getPhysicsEngine().setGravity(new BABYLON.Vector3(0, -9.81, 0));
          }
          this._adminStatus('Chaos Mode ended.');
        }
        break;

      case 'disco':
        if (active) {
          this._discoInterval = setInterval(() => {
            if (!this._activeEvents.disco) {
              clearInterval(this._discoInterval);
              this.scene.clearColor = new BABYLON.Color4(0.5, 0.7, 1.0, 1);
              if (this.sunLight) this.sunLight.diffuse = new BABYLON.Color3(1, 0.95, 0.8);
              return;
            }
            const r = Math.random();
            const g = Math.random();
            const b = Math.random();
            this.scene.clearColor = new BABYLON.Color4(r * 0.5, g * 0.5, b * 0.5, 1);
            if (this.sunLight) {
              this.sunLight.diffuse = new BABYLON.Color3(r, g, b);
              this.sunLight.intensity = 1.5 + Math.random() * 2;
            }
          }, 200);
          this._adminStatus('DISCO PARTY!');
        } else {
          clearInterval(this._discoInterval);
          this.scene.clearColor = new BABYLON.Color4(0.5, 0.7, 1.0, 1);
          if (this.sunLight) {
            this.sunLight.diffuse = new BABYLON.Color3(1, 0.95, 0.8);
            this.sunLight.intensity = 1.5;
          }
          this._adminStatus('Disco ended.');
        }
        break;

      case 'supplyDrop':
        if (active) {
          const pp = this.player.mesh.position.clone();
          for (let i = 0; i < 20; i++) {
            const offset = new BABYLON.Vector3(
              (Math.random() - 0.5) * 25, 0, (Math.random() - 0.5) * 25
            );
            this.pickupManager.spawn(pp.add(offset), 'potion');
          }
          const subs = ['fire', 'ice', 'lightning'];
          for (let i = 0; i < 15; i++) {
            const offset = new BABYLON.Vector3(
              (Math.random() - 0.5) * 25, 0, (Math.random() - 0.5) * 25
            );
            this.pickupManager.spawn(pp.add(offset), 'ammo', subs[Math.floor(Math.random() * 3)]);
          }
          this._adminStatus('SUPPLY DROP! 20 potions + 15 ammo packs!');
        }
        this._activeEvents.supplyDrop = false;
        break;

      case 'fireworks':
        if (active) {
          this._fireworkInterval = setInterval(() => {
            if (!this._activeEvents.fireworks) {
              clearInterval(this._fireworkInterval);
              return;
            }
            const pp = this.player.mesh.position.clone();
            const pos = new BABYLON.Vector3(
              pp.x + (Math.random() - 0.5) * 30,
              pp.y + 10 + Math.random() * 15,
              pp.z + (Math.random() - 0.5) * 30
            );
            const elements = ['fire', 'ice', 'lightning'];
            this.combatSystem.createExplosion(pos, elements[Math.floor(Math.random() * 3)], 0);
          }, 300);
          this._adminStatus('FIREWORKS SHOW!');
        } else {
          clearInterval(this._fireworkInterval);
          this._adminStatus('Fireworks ended.');
        }
        break;

      case 'zombie':
        if (active) {
          this._zombieInterval = setInterval(() => {
            if (!this._activeEvents.zombie) {
              clearInterval(this._zombieInterval);
              return;
            }
            const angle = Math.random() * Math.PI * 2;
            const dist = 15 + Math.random() * 15;
            const pos = this.player.mesh.position.clone();
            pos.x += Math.cos(angle) * dist;
            pos.z += Math.sin(angle) * dist;
            this.enemyManager.spawnEnemy(pos);
          }, 800);
          this._adminStatus('ZOMBIE HORDE activated!');
        } else {
          clearInterval(this._zombieInterval);
          this._adminStatus('Zombie Horde ended.');
        }
        break;
    }
  }

  _getEventMessage(eventId) {
    const msgs = {
      coinRain: 'COIN RAIN EVENT! Coins are falling from the sky!',
      doubleXP: 'DOUBLE XP EVENT! All kills give 2x score!',
      enemyInvasion: 'ENEMY INVASION! A massive wave of enemies has appeared!',
      bossRush: 'BOSS RUSH! A boss has been summoned!',
      lootExplosion: 'LOOT EXPLOSION! Free loot everywhere!',
      chaos: 'CHAOS MODE ACTIVATED! Low gravity + speed boost!',
      disco: 'DISCO PARTY! Time to dance!',
      supplyDrop: 'SUPPLY DROP! Potions and ammo incoming!',
      fireworks: 'FIREWORKS SHOW! Look up!',
      zombie: 'ZOMBIE HORDE! Endless enemies incoming!'
    };
    return msgs[eventId] || 'A new event has started!';
  }

  async _renderAdminChatSpy(el) {
    const stealth = this.chat.stealthMode;
    el.innerHTML = `
      <div style="color:#44aaff;font-size:13px;padding:6px 8px;text-align:center;">
        SPY ON ALL PLAYER MESSAGES
      </div>
      <div class="admin-row">
        <div class="admin-row-label">STEALTH MODE<br><small style="color:#888;">You see them, they can't see you</small></div>
        <button class="admin-btn ${stealth ? 'green' : ''}" id="chatspy-stealth">${stealth ? 'ON' : 'OFF'}</button>
      </div>
      <div id="chatspy-log" style="padding:8px;font-size:13px;color:#ccc;">Loading...</div>
      <div style="padding:8px;display:flex;gap:6px;">
        <button class="admin-btn" id="chatspy-refresh">REFRESH</button>
        <button class="admin-btn" id="chatspy-auto">AUTO-REFRESH: OFF</button>
      </div>
    `;

    const loadMessages = async () => {
      const logEl = document.getElementById('chatspy-log');
      if (!logEl) return;
      const msgs = await this.chat.getRecentMessages(50);
      if (msgs.length === 0) {
        logEl.innerHTML = '<div style="color:#666;">No messages yet.</div>';
        return;
      }
      // Reverse so newest is at bottom
      logEl.innerHTML = msgs.reverse().map(m => {
        const time = new Date(m.created_at);
        const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isAdmin = ['ggamer', 'weclyfrec', 'forchen alt'].includes((m.username || '').toLowerCase());
        const nameColor = isAdmin ? '#ff4444' : '#ffd700';
        return `<div style="padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
          <span style="color:#666;font-size:11px;">[${timeStr}]</span>
          <span style="color:${nameColor};font-weight:bold;">${m.username}:</span>
          <span style="color:#ddd;">${m.message}</span>
        </div>`;
      }).join('');
      logEl.scrollTop = logEl.scrollHeight;
    };

    await loadMessages();

    document.getElementById('chatspy-stealth').onclick = () => {
      this.chat.stealthMode = !this.chat.stealthMode;
      this._adminStatus(`Stealth Mode: ${this.chat.stealthMode ? 'ON — invisible' : 'OFF — visible'}`);
      // Hide/show on leaderboard
      if (this.chat.stealthMode) {
        // Remove from leaderboard when going stealth
        const lb = JSON.parse(localStorage.getItem('leaderboard') || '[]');
        const filtered = lb.filter(e => e.name !== this.state.username);
        localStorage.setItem('leaderboard', JSON.stringify(filtered));
      } else {
        // Re-add to leaderboard when leaving stealth
        this.updateLeaderboard();
      }
      this._renderAdminChatSpy(el);
    };

    document.getElementById('chatspy-refresh').onclick = () => loadMessages();

    let autoRefresh = false;
    let autoInterval = null;
    document.getElementById('chatspy-auto').onclick = () => {
      autoRefresh = !autoRefresh;
      const btn = document.getElementById('chatspy-auto');
      if (autoRefresh) {
        btn.textContent = 'AUTO-REFRESH: ON';
        btn.classList.add('green');
        autoInterval = setInterval(loadMessages, 3000);
      } else {
        btn.textContent = 'AUTO-REFRESH: OFF';
        btn.classList.remove('green');
        clearInterval(autoInterval);
      }
    };
  }

  _renderAdminBroadcast(el) {
    el.innerHTML = `
      <div style="color:#ff4444;font-size:14px;padding:8px;text-align:center;">
        Send a message to ALL players in the game!
      </div>
      <div class="admin-row" style="flex-direction:column;gap:8px;">
        <input type="text" id="admin-broadcast-msg" class="admin-input"
          placeholder="Type your message..." maxlength="200"
          style="width:100%;padding:10px;font-size:16px;">
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="admin-btn green" id="admin-send-broadcast" style="flex:1;">SEND TO ALL</button>
        </div>
      </div>
      <div style="color:#888;font-size:11px;padding:8px;">
        Quick messages:
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;padding:0 8px;">
        <button class="admin-btn quick-msg" data-msg="Server restarting soon!">Restart Warning</button>
        <button class="admin-btn quick-msg" data-msg="Admin is watching you...">I See You</button>
        <button class="admin-btn quick-msg" data-msg="FREE COINS EVENT! Play now!">Free Coins</button>
        <button class="admin-btn quick-msg" data-msg="BOW DOWN TO YOUR ADMIN">Bow Down</button>
        <button class="admin-btn quick-msg" data-msg="You have been BLESSED by the admin!">Blessing</button>
        <button class="admin-btn quick-msg" data-msg="ADMIN ABUSE TIME!!! >:D">Admin Abuse</button>
      </div>
    `;

    const msgInput = document.getElementById('admin-broadcast-msg');
    document.getElementById('admin-send-broadcast').onclick = () => {
      const msg = msgInput.value.trim();
      if (!msg) { this._adminStatus('Type a message first!'); return; }
      this._sendBroadcast(msg);
      msgInput.value = '';
    };

    el.querySelectorAll('.quick-msg').forEach(btn => {
      btn.onclick = () => {
        this._sendBroadcast(btn.dataset.msg);
      };
    });
  }

  async _renderAdminPlayers(el) {
    const SUPABASE_URL = 'https://lijeewobwwiupncjfueq.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpamVld29id3dpdXBuY2pmdWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDkwNTQsImV4cCI6MjA4MDI4NTA1NH0.ttSbkrtcHDfu2YWTfDVLGBUOL6gPC97gHoZua_tqQeQ';

    el.innerHTML = '<div style="color:#888;padding:12px;text-align:center;">Loading players...</div>';

    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/player_sessions?order=joined_at.desc&limit=100`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      const data = await res.json();

      if (!data || data.length === 0) {
        el.innerHTML = '<div style="color:#888;padding:12px;text-align:center;">No players yet — waiting for data!</div>';
        return;
      }

      // Count unique players
      const uniquePlayers = new Set(data.map(d => d.username.toLowerCase()));
      const today = new Date().toDateString();
      const todayCount = new Set(data.filter(d => new Date(d.joined_at).toDateString() === today).map(d => d.username.toLowerCase())).size;

      el.innerHTML = `
        <div style="padding:8px;display:flex;gap:12px;justify-content:center;">
          <div style="background:rgba(255,215,0,0.15);padding:8px 16px;border-radius:8px;text-align:center;">
            <div style="color:#ffd700;font-size:20px;font-weight:bold;">${uniquePlayers.size}</div>
            <div style="color:#888;font-size:10px;">Total Players</div>
          </div>
          <div style="background:rgba(68,255,136,0.15);padding:8px 16px;border-radius:8px;text-align:center;">
            <div style="color:#44ff88;font-size:20px;font-weight:bold;">${todayCount}</div>
            <div style="color:#888;font-size:10px;">Today</div>
          </div>
          <div style="background:rgba(68,136,255,0.15);padding:8px 16px;border-radius:8px;text-align:center;">
            <div style="color:#4488ff;font-size:20px;font-weight:bold;">${data.length}</div>
            <div style="color:#888;font-size:10px;">Total Sessions</div>
          </div>
        </div>
        <div style="max-height:250px;overflow-y:auto;padding:4px 8px;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <tr style="color:#888;border-bottom:1px solid rgba(255,255,255,0.1);">
              <th style="text-align:left;padding:4px;">Player</th>
              <th style="text-align:left;padding:4px;">Mode</th>
              <th style="text-align:left;padding:4px;">Skin</th>
              <th style="text-align:right;padding:4px;">Time</th>
            </tr>
            ${data.map(d => {
              const time = new Date(d.joined_at);
              const timeStr = time.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
              const isAdmin = ['ggamer', 'weclyfrec', 'forchen alt'].includes((d.username || '').toLowerCase());
              const nameColor = isAdmin ? '#ff4444' : '#ffd700';
              return `<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:3px 4px;color:${nameColor};">${d.username}</td>
                <td style="padding:3px 4px;color:#aaa;">${d.game_mode}</td>
                <td style="padding:3px 4px;color:#aaa;">${d.knight_skin || '?'}</td>
                <td style="padding:3px 4px;color:#666;text-align:right;">${timeStr}</td>
              </tr>`;
            }).join('')}
          </table>
        </div>
        <div style="padding:8px;text-align:center;">
          <button class="admin-btn green" id="players-refresh">Refresh</button>
        </div>
      `;

      document.getElementById('players-refresh').onclick = () => this._renderAdminPlayers(el);
    } catch (e) {
      el.innerHTML = '<div style="color:#ff4444;padding:12px;">Failed to load players</div>';
    }
  }

  async _sendBroadcast(message) {
    const SUPABASE_URL = 'https://lijeewobwwiupncjfueq.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpamVld29id3dpdXBuY2pmdWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDkwNTQsImV4cCI6MjA4MDI4NTA1NH0.ttSbkrtcHDfu2YWTfDVLGBUOL6gPC97gHoZua_tqQeQ';

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/broadcasts`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          message,
          from_username: this.state.username || 'ADMIN'
        })
      });
      this._adminStatus(`Broadcast sent: "${message}"`);
      this.achievements.unlock('admin_broadcast', this.hud);
    } catch (e) {
      this._adminStatus('Failed to send broadcast!');
    }
  }

  _startBroadcastPolling() {
    this._lastBroadcastId = 0;
    this._broadcastBanner = document.getElementById('broadcast-banner');
    this._broadcastTimer = null;
    this._abuseOverlay = document.getElementById('abuse-overlay');
    this._globalAbuseActive = false;

    // Poll every 5 seconds for broadcasts AND admin abuse state
    this._broadcastInterval = setInterval(() => {
      this._pollBroadcasts();
      this._pollAdminAbuse();
    }, 5000);
    this._pollBroadcasts();
    this._pollAdminAbuse();
  }

  async _toggleGlobalAbuse(active) {
    const SUPABASE_URL = 'https://lijeewobwwiupncjfueq.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpamVld29id3dpdXBuY2pmdWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDkwNTQsImV4cCI6MjA4MDI4NTA1NH0.ttSbkrtcHDfu2YWTfDVLGBUOL6gPC97gHoZua_tqQeQ';

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/server_events?id=eq.admin_abuse`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          active,
          started_by: this.state.username || 'ADMIN',
          started_at: active ? new Date().toISOString() : null
        })
      });

      if (active) {
        this._sendBroadcast('ADMIN ABUSE HAS BEGUN! BRACE YOURSELVES!');
        this._adminStatus('ADMIN ABUSE STARTED GLOBALLY!');
      } else {
        this._sendBroadcast('Admin abuse has ended. You are safe... for now.');
        this._adminStatus('Admin abuse stopped.');
      }
    } catch (e) {
      this._adminStatus('Failed to toggle admin abuse!');
    }
  }

  async _pollAdminAbuse() {
    const SUPABASE_URL = 'https://lijeewobwwiupncjfueq.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpamVld29id3dpdXBuY2pmdWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDkwNTQsImV4cCI6MjA4MDI4NTA1NH0.ttSbkrtcHDfu2YWTfDVLGBUOL6gPC97gHoZua_tqQeQ';

    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/server_events?id=eq.admin_abuse&select=active,started_by`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        // Admins are immune to abuse effects — they dish it out, not receive it
        const adminNames = ['ggamer', 'weclyfrec', 'forchen alt'];
        const isAdmin = adminNames.includes((this.state.username || '').toLowerCase());
        if (isAdmin) return;

        const wasActive = this._globalAbuseActive;
        this._globalAbuseActive = data[0].active;

        // State changed — apply or remove effects
        if (this._globalAbuseActive && !wasActive) {
          this._startAbuseEffects();
        } else if (!this._globalAbuseActive && wasActive) {
          this._stopAbuseEffects();
        }
      }
    } catch (e) { /* silent */ }
  }

  _startAbuseEffects() {
    // Screen overlay
    if (this._abuseOverlay) this._abuseOverlay.classList.add('active');

    // Disco sky colors
    this._abuseDiscoInterval = setInterval(() => {
      if (!this._globalAbuseActive) return;
      const r = Math.random(), g = Math.random(), b = Math.random();
      this.scene.clearColor = new BABYLON.Color4(r * 0.4, g * 0.4, b * 0.4, 1);
      if (this.sunLight) {
        this.sunLight.diffuse = new BABYLON.Color3(r, g, b);
        this.sunLight.intensity = 1 + Math.random() * 3;
      }
    }, 300);

    // Spawn extra enemies around the player periodically
    this._abuseEnemyInterval = setInterval(() => {
      if (!this._globalAbuseActive) return;
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 10 + Math.random() * 15;
        const pos = this.player.mesh.position.clone();
        pos.x += Math.cos(angle) * dist;
        pos.z += Math.sin(angle) * dist;
        this.enemyManager.spawnEnemy(pos);
      }
    }, 3000);

    // Rain coins
    this._abuseCoinInterval = setInterval(() => {
      if (!this._globalAbuseActive) return;
      const pp = this.player.mesh.position;
      const offset = new BABYLON.Vector3(
        (Math.random() - 0.5) * 20, 0, (Math.random() - 0.5) * 20
      );
      this.pickupManager.spawn(pp.add(offset), 'coin');
    }, 200);

    // Fireworks
    this._abuseFireworkInterval = setInterval(() => {
      if (!this._globalAbuseActive) return;
      const pp = this.player.mesh.position.clone();
      const pos = new BABYLON.Vector3(
        pp.x + (Math.random() - 0.5) * 30,
        pp.y + 10 + Math.random() * 15,
        pp.z + (Math.random() - 0.5) * 30
      );
      const elements = ['fire', 'ice', 'lightning'];
      this.combatSystem.createExplosion(pos, elements[Math.floor(Math.random() * 3)], 0);
    }, 500);

    // Low gravity
    if (this.scene.getPhysicsEngine()) {
      this._abuseOldGravity = this.scene.getPhysicsEngine().gravity.clone();
      this.scene.getPhysicsEngine().setGravity(new BABYLON.Vector3(0, -2, 0));
    }

    // Screen shake effect
    this._abuseShakeInterval = setInterval(() => {
      if (!this._globalAbuseActive || !this.camera) return;
      this._cameraPitch += (Math.random() - 0.5) * 0.02;
      this._cameraYaw += (Math.random() - 0.5) * 0.02;
    }, 50);

    this.hud.showMessage('ADMIN ABUSE ACTIVATED!');
  }

  _stopAbuseEffects() {
    // Remove overlay
    if (this._abuseOverlay) this._abuseOverlay.classList.remove('active');

    // Clear all intervals
    clearInterval(this._abuseDiscoInterval);
    clearInterval(this._abuseEnemyInterval);
    clearInterval(this._abuseCoinInterval);
    clearInterval(this._abuseFireworkInterval);
    clearInterval(this._abuseShakeInterval);

    // Restore sky and lighting
    this.scene.clearColor = new BABYLON.Color4(0.5, 0.7, 1.0, 1);
    if (this.sunLight) {
      this.sunLight.diffuse = new BABYLON.Color3(1, 0.95, 0.8);
      this.sunLight.intensity = 1.5;
    }

    // Restore gravity
    if (this.scene.getPhysicsEngine() && this._abuseOldGravity) {
      this.scene.getPhysicsEngine().setGravity(this._abuseOldGravity);
    }

    this.hud.showMessage('Admin abuse has ended.');
  }

  async _pollBroadcasts() {
    const SUPABASE_URL = 'https://lijeewobwwiupncjfueq.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpamVld29id3dpdXBuY2pmdWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDkwNTQsImV4cCI6MjA4MDI4NTA1NH0.ttSbkrtcHDfu2YWTfDVLGBUOL6gPC97gHoZua_tqQeQ';

    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/broadcasts?id=gt.${this._lastBroadcastId}&expires_at=gt.${new Date().toISOString()}&order=id.desc&limit=1`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const bc = data[0];
        if (bc.id > this._lastBroadcastId) {
          this._lastBroadcastId = bc.id;
          this._showBroadcast(bc.message, bc.from_username);
        }
      }
    } catch (e) { /* silent fail */ }
  }

  _showBroadcast(message, from) {
    const banner = this._broadcastBanner;
    if (!banner) return;

    banner.innerHTML = `<div class="broadcast-from">From: ${from}</div><div>${message}</div>`;
    banner.classList.add('show');

    clearTimeout(this._broadcastTimer);
    this._broadcastTimer = setTimeout(() => {
      banner.classList.remove('show');
    }, 8000);
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
      { name: 'PRESTIGE KNIGHT', desc: 'Rebirth 15 times', icon: '&#x1F3C6;', color: '#ff44ff', met: rebirths >= 15, progress: `${Math.min(rebirths,15)} / 15 rebirths`, rank: 'legendary' },
      { name: 'MYTHIC KNIGHT', desc: 'Rebirth 20 times', icon: '&#x1F3C6;', color: '#aa00ff', met: rebirths >= 20, progress: `${Math.min(rebirths,20)} / 20 rebirths`, rank: 'legendary' },
      { name: 'GODLIKE KNIGHT', desc: 'Rebirth 25 times', icon: '&#x1F3C6;', color: '#ff0066', met: rebirths >= 25, progress: `${Math.min(rebirths,25)} / 25 rebirths`, rank: 'legendary' },
      { name: 'ETERNAL LEGEND', desc: 'MAX rebirth (30)', icon: '&#x1F3C6;', color: '#00ffcc', met: rebirths >= 30, progress: `${Math.min(rebirths,30)} / 30 rebirths`, rank: 'legendary' },

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
    // 30 rebirths total — each one harder! Rebirth 30 = MAX
    const reqs = [
      { level: 5,  coins: 500,      kills: 0 },       // Rebirth 1
      { level: 8,  coins: 1500,     kills: 0 },       // Rebirth 2
      { level: 10, coins: 3000,     kills: 0 },       // Rebirth 3
      { level: 10, coins: 5000,     kills: 200 },     // Rebirth 4
      { level: 10, coins: 10000,    kills: 500 },     // Rebirth 5
      { level: 10, coins: 15000,    kills: 750 },     // Rebirth 6
      { level: 10, coins: 20000,    kills: 1000 },    // Rebirth 7
      { level: 10, coins: 30000,    kills: 1500 },    // Rebirth 8
      { level: 10, coins: 40000,    kills: 2000 },    // Rebirth 9
      { level: 10, coins: 50000,    kills: 3000 },    // Rebirth 10
      { level: 10, coins: 75000,    kills: 4000 },    // Rebirth 11
      { level: 10, coins: 100000,   kills: 5000 },    // Rebirth 12
      { level: 10, coins: 150000,   kills: 7500 },    // Rebirth 13
      { level: 10, coins: 200000,   kills: 10000 },   // Rebirth 14
      { level: 10, coins: 500000,   kills: 25000 },   // Rebirth 15
      // === PRESTIGE REBIRTHS (16-20) ===
      { level: 10, coins: 600000,   kills: 30000 },   // Rebirth 16
      { level: 10, coins: 750000,   kills: 40000 },   // Rebirth 17
      { level: 10, coins: 900000,   kills: 50000 },   // Rebirth 18
      { level: 10, coins: 1200000,  kills: 65000 },   // Rebirth 19
      { level: 10, coins: 1500000,  kills: 80000 },   // Rebirth 20
      // === MYTHIC REBIRTHS (21-25) ===
      { level: 10, coins: 2000000,  kills: 100000 },  // Rebirth 21
      { level: 10, coins: 2500000,  kills: 125000 },  // Rebirth 22
      { level: 10, coins: 3000000,  kills: 150000 },  // Rebirth 23
      { level: 10, coins: 4000000,  kills: 200000 },  // Rebirth 24
      { level: 10, coins: 5000000,  kills: 250000 },  // Rebirth 25
      // === GODLIKE REBIRTHS (26-30) ===
      { level: 10, coins: 6000000,  kills: 300000 },  // Rebirth 26
      { level: 10, coins: 7500000,  kills: 400000 },  // Rebirth 27
      { level: 10, coins: 10000000, kills: 500000 },  // Rebirth 28
      { level: 10, coins: 15000000, kills: 750000 },  // Rebirth 29
      { level: 10, coins: 25000000, kills: 1000000 }, // Rebirth 30 — THE ULTIMATE
    ];
    if (rebirthNum >= 30) return null; // MAX reached!
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
        <div style="color:#00ffcc; font-size:22px; font-weight:bold; text-shadow:0 0 15px #00ffcc;">
          MAX REBIRTH — ETERNAL LEGEND
        </div>
        <div style="color:#ffcc00; font-size:16px; margin-top:8px;">
          ${'&#11088;'.repeat(30)}
        </div>
        <div style="margin-top:8px;">Coin multiplier: <span style="color:#00ffcc; font-size:20px; font-weight:bold;">${currentMulti.toFixed(2)}x</span></div>
        <div style="color:#aaa; margin-top:8px;">
          You have reached the ULTIMATE rebirth.<br>
          There is nothing left to prove. You are an ETERNAL LEGEND.
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
      confirmBtn.innerHTML = '&#128081; MAX REBIRTH — ETERNAL LEGEND &#128081;';

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
    const isFinal = (rebirths === 29);

    // Determine tier label
    let tierLabel = '';
    if (rebirths >= 25) tierLabel = '<span style="color:#00ffcc;">GODLIKE</span> ';
    else if (rebirths >= 20) tierLabel = '<span style="color:#aa00ff;">MYTHIC</span> ';
    else if (rebirths >= 15) tierLabel = '<span style="color:#ff44ff;">PRESTIGE</span> ';

    // Build requirements checklist HTML
    const check = '&#9989;';
    const cross = '&#10060;';
    let reqHTML = isFinal
      ? `<h3 style="color:#00ffcc;">&#128081; THE FINAL REBIRTH &#128081;</h3>`
      : `<h3>Requirements for Rebirth ${rebirths + 1}:</h3>`;
    reqHTML += `<div class="rebirth-req ${levelOk ? 'done' : 'not-done'}">${levelOk ? check : cross} Beat Level ${req.level} <span style="color:#aaa;">(You: Level ${level})</span></div>`;
    reqHTML += `<div class="rebirth-req ${coinsOk ? 'done' : 'not-done'}">${coinsOk ? check : cross} Earn ${req.coins.toLocaleString()} coins <span style="color:#aaa;">(You: ${coins.toLocaleString()})</span></div>`;
    if (req.kills > 0) {
      reqHTML += `<div class="rebirth-req ${killsOk ? 'done' : 'not-done'}">${killsOk ? check : cross} Get ${req.kills.toLocaleString()} kills <span style="color:#aaa;">(You: ${kills.toLocaleString()})</span></div>`;
    }

    // Star display — show tier rows for 30 rebirths
    let starHTML = '';
    const tierColors = ['#ffcc00', '#ffcc00', '#ffcc00', '#aa00ff', '#aa00ff', '#00ffcc'];
    const tierLabels = ['', '', '', 'PRESTIGE ', 'MYTHIC ', 'GODLIKE '];
    for (let tier = 0; tier < 6; tier++) {
      const start = tier * 5;
      const end = start + 5;
      if (rebirths >= start || tier === 0) {
        for (let i = start; i < end; i++) {
          if (i < rebirths) {
            starHTML += `<span style="font-size:16px;color:${tierColors[tier]};">&#11088;</span>`;
          } else {
            starHTML += '<span style="font-size:16px; opacity:0.2;">&#11088;</span>';
          }
        }
        if (tier < 5) starHTML += ' ';
      }
    }

    // Rebirth tier title
    let tierTitle = 'No rebirths yet';
    if (rebirths >= 26) tierTitle = `&#x1F31F; GODLIKE ${rebirths} / 30`;
    else if (rebirths >= 21) tierTitle = `&#x2728; MYTHIC ${rebirths} / 30`;
    else if (rebirths >= 16) tierTitle = `&#x1F4AB; PRESTIGE ${rebirths} / 30`;
    else if (rebirths > 0) tierTitle = `Rebirth ${rebirths} / 30`;

    infoEl.innerHTML = `
      <div style="color:#ffcc00; font-size:18px; margin-bottom:6px;">
        ${tierTitle}
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
      reqEl.style.border = '2px solid #00ffcc';
      reqEl.style.background = 'rgba(0,255,200,0.08)';
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
    if (newRebirths >= 15) this.achievements.unlock('rebirth_15', this.hud);
    if (newRebirths >= 20) this.achievements.unlock('rebirth_20', this.hud);
    if (newRebirths >= 25) this.achievements.unlock('rebirth_25', this.hud);
    if (newRebirths >= 30) this.achievements.unlock('rebirth_max', this.hud);

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
    if (rebirths >= 30) {
      infoEl.innerHTML = '&#128081; <span style="color:#00ffcc;">MAX REBIRTH — ETERNAL LEGEND</span> &#128081; | ' + (1 + rebirths * 0.25).toFixed(2) + 'x';
    } else if (rebirths >= 26) {
      const multi = 1 + (rebirths * 0.25);
      infoEl.innerHTML = '&#11088;'.repeat(Math.min(rebirths, 10)) + ' <span style="color:#00ffcc;">GODLIKE</span> ' + rebirths + '/30 | Coins: ' + multi.toFixed(2) + 'x';
    } else if (rebirths >= 21) {
      const multi = 1 + (rebirths * 0.25);
      infoEl.innerHTML = '&#11088;'.repeat(Math.min(rebirths, 10)) + ' <span style="color:#aa00ff;">MYTHIC</span> ' + rebirths + '/30 | Coins: ' + multi.toFixed(2) + 'x';
    } else if (rebirths >= 16) {
      const multi = 1 + (rebirths * 0.25);
      infoEl.innerHTML = '&#11088;'.repeat(Math.min(rebirths, 10)) + ' <span style="color:#ff44ff;">PRESTIGE</span> ' + rebirths + '/30 | Coins: ' + multi.toFixed(2) + 'x';
    } else if (rebirths > 0) {
      const multi = 1 + (rebirths * 0.25);
      infoEl.innerHTML = '&#11088;'.repeat(rebirths) + ' Rebirth ' + rebirths + '/30 | Coins: ' + multi.toFixed(2) + 'x';
    } else {
      infoEl.textContent = `Reach Level ${req.level} + ${req.coins.toLocaleString()} coins to rebirth!`;
    }
  }

  addKill() {
    this.state.totalKills++;
    localStorage.setItem('totalKills', this.state.totalKills.toString());
    // Don't update leaderboard if stealth mode is on (hide admin from leaderboard)
    if (!this.chat.stealthMode) {
      this.updateLeaderboard();
    }
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

  async _logPlayerSession() {
    try {
      const SUPABASE_URL = 'https://lijeewobwwiupncjfueq.supabase.co';
      const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpamVld29id3dpdXBuY2pmdWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDkwNTQsImV4cCI6MjA4MDI4NTA1NH0.ttSbkrtcHDfu2YWTfDVLGBUOL6gPC97gHoZua_tqQeQ';
      const mode = this.practice && this.practice._active ? 'practice'
        : this._partyMode ? 'party'
        : this._survivalMode ? 'survival'
        : 'quest';
      await fetch(`${SUPABASE_URL}/rest/v1/player_sessions`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          username: this.state.username || 'Knight',
          game_mode: mode,
          knight_skin: this.state.knightSkin || 'Silver'
        })
      });
    } catch (e) { /* silent */ }
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

    // Cache party meshes so we don't call getMeshByName every frame
    this._partyCached = {};

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

    // God mode — admin invincibility
    if (this._godMode) return;

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
    // Freeze everything when admin panel is open
    if (this._adminFrozenScene) return;

    // Track player session after 1 second of gameplay
    if (!this._sessionLogged) {
      this._sessionTimer = (this._sessionTimer || 0) + deltaTime;
      if (this._sessionTimer >= 1) {
        this._sessionLogged = true;
        this._logPlayerSession();
      }
    }

    // Update player — pass yaw for movement direction
    // Skip normal player movement when fly mode is active (fly handles its own movement)
    if (!(this._adminPowers && this._adminPowers.flyMode)) {
      this.player.update(deltaTime, this.inputManager, this.camera, this._cameraYaw);
    }

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
      // Make player mesh visible during emote (cache child meshes)
      if (!this._playerChildMeshes) this._playerChildMeshes = this.player.mesh.getChildMeshes();
      for (let i = 0; i < this._playerChildMeshes.length; i++) this._playerChildMeshes[i].isVisible = true;
    } else {
      // Hide player mesh in first person (camera is inside the head)
      if (!this._playerChildMeshes) this._playerChildMeshes = this.player.mesh.getChildMeshes();
      for (let i = 0; i < this._playerChildMeshes.length; i++) this._playerChildMeshes[i].isVisible = false;

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

    // Admin powers processing
    this._updateAdminPowers(deltaTime);

    // Apply time slow factor for enemies
    const enemyDt = deltaTime * (this._timeSlowFactor || 1.0);

    // Update enemies (skip during party mode)
    if (!this.partyMode) {
      this.enemyManager.update(enemyDt, this);
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

      // Cache party meshes on first frame
      const pc = this._partyCached;
      if (!pc._loaded) {
        pc._loaded = true;
        pc.discoBall = this.scene.getMeshByName('discoBall');
        pc.spinPlats = [];
        pc.spinStars = [];
        for (let i = 0; i < 3; i++) {
          pc.spinPlats[i] = this.scene.getMeshByName('spinPlat' + i);
          pc.spinStars[i] = this.scene.getMeshByName('spinStar' + i);
        }
        pc.balloons = [];
        for (let i = 0; i < 20; i++) {
          pc.balloons[i] = this.scene.getMeshByName('balloon' + i);
        }
        pc.flames = [];
        for (let i = 0; i < 5; i++) {
          pc.flames[i] = this.scene.getMeshByName('flame' + i);
        }
      }

      // Spin the disco ball
      if (pc.discoBall) pc.discoBall.rotation.y += deltaTime * 1.5;

      // Spin platforms
      for (let i = 0; i < 3; i++) {
        if (pc.spinPlats[i]) pc.spinPlats[i].rotation.y += deltaTime * (1.5 + i * 0.5);
        if (pc.spinStars[i]) pc.spinStars[i].rotation.y -= deltaTime * (2 + i * 0.5);
      }

      // Bobbing balloons
      for (let i = 0; i < 20; i++) {
        if (pc.balloons[i]) pc.balloons[i].position.y += Math.sin(this._partyDuration * 1.5 + i) * 0.003;
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

      // Flickering candle flames (using cached refs)
      for (let i = 0; i < 5; i++) {
        if (pc.flames[i]) {
          pc.flames[i].scaling.y = 0.8 + Math.random() * 0.5;
          pc.flames[i].scaling.x = 0.8 + Math.random() * 0.3;
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

    // Update rank based on score — only check when score changes
    if (!this.state.isAdmin && this.state.score !== this._lastRankScore) {
      this._lastRankScore = this.state.score;
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
    // Trim old frames beyond 5 seconds (use splice instead of shift for efficiency)
    const cutoff = this._replayTime - this.replayMaxTime;
    if (this.replayBuffer.length > 0 && this.replayBuffer[0].time < cutoff) {
      let trimIdx = 0;
      while (trimIdx < this.replayBuffer.length && this.replayBuffer[trimIdx].time < cutoff) trimIdx++;
      if (trimIdx > 0) this.replayBuffer.splice(0, trimIdx);
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
