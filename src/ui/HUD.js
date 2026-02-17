export class HUD {
  constructor(gameState) {
    this.state = gameState;
    this.messageTimer = null;
    this.zoneTimer = null;
    this.currentZone = '';
    this._frameCount = 0;

    // Cache ALL DOM elements once — never query again
    this._els = {
      hud: document.getElementById('hud'),
      healthBar: document.getElementById('health-bar'),
      healthText: document.getElementById('health-text'),
      weaponDisplay: document.getElementById('weapon-display'),
      shieldIndicator: document.getElementById('shield-indicator'),
      enemyCount: document.getElementById('enemy-count'),
      scoreDisplay: document.getElementById('score-display'),
      coinDisplay: document.getElementById('coin-display'),
      petDisplay: document.getElementById('pet-display'),
      playtimeDisplay: document.getElementById('playtime-display'),
      levelDisplay: document.getElementById('level-display'),
      rankDisplay: document.getElementById('rank-display'),
      usernameDisplay: document.getElementById('username-display'),
      message: document.getElementById('message'),
      zoneName: document.getElementById('zone-name'),
    };

    // Minimap
    this.minimapCanvas = document.getElementById('minimap');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;
    // Big map
    this.bigMapCanvas = document.getElementById('big-map');
    this.bigMapCtx = this.bigMapCanvas ? this.bigMapCanvas.getContext('2d') : null;

    // Cache last values to skip unnecessary DOM writes
    this._lastHealth = -1;
    this._lastMaxHealth = -1;
    this._lastElement = '';
    this._lastWeapon = '';
    this._lastAmmo = -1;
    this._lastShieldState = '';
    this._lastEnemyCount = -1;
    this._lastScore = -1;
    this._lastCoins = -1;
    this._lastPet = '';
    this._lastLevel = '';
    this._lastRank = '';
    this._lastUsername = '';
  }

  show() {
    this._els.hud.style.display = 'block';
  }

  hide() {
    this._els.hud.style.display = 'none';
  }

  update() {
    const s = this.state;

    // Health — only update DOM if changed
    if (s.health !== this._lastHealth || s.maxHealth !== this._lastMaxHealth) {
      this._lastHealth = s.health;
      this._lastMaxHealth = s.maxHealth;
      this._els.healthBar.style.width = (s.health / s.maxHealth * 100) + '%';
      this._els.healthText.textContent = `\u2665 ${Math.ceil(s.health)} / ${s.maxHealth}`;
    }

    // Weapon — only update if changed
    const ammoVal = s.ammo[s.selectedElement];
    if (s.selectedElement !== this._lastElement || s.selectedWeapon !== this._lastWeapon || ammoVal !== this._lastAmmo) {
      this._lastElement = s.selectedElement;
      this._lastWeapon = s.selectedWeapon;
      this._lastAmmo = ammoVal;
      const elNames = { fire: 'FIRE', ice: 'ICE', lightning: 'LIGHTNING' };
      const weaponNames = { pistol: 'Pistol', shotgun: 'Shotgun', rocket: 'Rocket', laser: 'Laser', minigun: 'Minigun' };
      this._els.weaponDisplay.innerHTML =
        `${weaponNames[s.selectedWeapon || 'pistol']}: <span class="element-name ${s.selectedElement}">${elNames[s.selectedElement]} (${ammoVal})</span><br><small>1-3=Element 4-7=Weapon</small>`;
    }

    // Shield — only update if state changed
    let shieldState = 'ready';
    if (s.shieldActive) shieldState = 'active';
    else if (s.shieldCooldown > 0) shieldState = 'cooldown';
    if (shieldState !== this._lastShieldState) {
      this._lastShieldState = shieldState;
      const el = this._els.shieldIndicator;
      if (shieldState === 'active') {
        el.textContent = 'Shield: ACTIVE';
        el.style.borderColor = '#44aaff';
      } else if (shieldState === 'cooldown') {
        el.textContent = 'Shield: RECHARGING';
        el.style.borderColor = '#aa4444';
      } else {
        el.textContent = 'Shield: READY';
        el.style.borderColor = '#4488aa';
      }
    }

    // Enemy count
    if (s.enemiesAlive !== this._lastEnemyCount) {
      this._lastEnemyCount = s.enemiesAlive;
      this._els.enemyCount.textContent = `Enemies: ${s.enemiesAlive}`;
    }

    // Score & coins
    if (s.score !== this._lastScore) {
      this._lastScore = s.score;
      this._els.scoreDisplay.textContent = `Score: ${s.score}`;
    }
    if (s.totalCoins !== this._lastCoins) {
      this._lastCoins = s.totalCoins;
      this._els.coinDisplay.textContent = `Coins: ${s.totalCoins}`;
    }

    // Pet display — only on change
    const petKey = s.pet || '';
    if (petKey !== this._lastPet) {
      this._lastPet = petKey;
      const petEl = this._els.petDisplay;
      if (petEl) {
        if (s.pet) {
          const petIcons = { wolf: '\u{1F43A}', dragon: '\u{1F409}', fairy: '\u{1F9DA}', ghost: '\u{1F47B}' };
          const petNames = { wolf: 'Wolf Pup', dragon: 'Baby Dragon', fairy: 'Healing Fairy', ghost: 'Ghost Buddy' };
          petEl.textContent = `${petIcons[s.pet] || ''} ${petNames[s.pet] || s.pet}`;
          petEl.style.display = 'block';
        } else {
          petEl.style.display = 'none';
        }
      }
    }

    // Level — only on change
    const levelKey = s.levelName || '';
    if (levelKey !== this._lastLevel) {
      this._lastLevel = levelKey;
      if (this._els.levelDisplay && s.levelName) {
        this._els.levelDisplay.textContent = `Level ${s.levelNum}: ${s.levelName}`;
      }
    }

    // Rank — only on change
    if (s.rank !== this._lastRank) {
      this._lastRank = s.rank;
      const rankEl = this._els.rankDisplay;
      if (rankEl) {
        rankEl.textContent = s.rank;
        rankEl.style.color = s.rankColor || '#aaa';
        if (s.isAdmin) {
          rankEl.style.textShadow = '0 0 10px #ff0000, 0 0 20px #ff4444';
        }
      }
    }

    // Username — only on change
    if (s.username !== this._lastUsername) {
      this._lastUsername = s.username;
      if (this._els.usernameDisplay && s.username) {
        this._els.usernameDisplay.textContent = s.username;
      }
    }

    // Play time — only check every 60 frames
    this._frameCount++;
    if (this._frameCount % 60 === 0) {
      const ptEl = this._els.playtimeDisplay;
      if (ptEl) {
        const totalSec = parseFloat(localStorage.getItem('totalPlayTime') || '0');
        const targetSec = 3600;
        if (totalSec < targetSec) {
          const remaining = targetSec - totalSec;
          const mins = Math.floor(remaining / 60);
          const secs = Math.floor(remaining % 60);
          ptEl.textContent = `\u{23F0} Knight Addict: ${mins}m ${secs < 10 ? '0' : ''}${secs}s left`;
          ptEl.style.display = 'block';
        } else {
          ptEl.style.display = 'none';
        }
      }
    }
  }

  showMessage(text) {
    const el = this._els.message;
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(this.messageTimer);
    this.messageTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  showZone(name) {
    if (this.currentZone === name) return;
    this.currentZone = name;
    const el = this._els.zoneName;
    el.textContent = name;
    el.classList.add('show');
    clearTimeout(this.zoneTimer);
    this.zoneTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  updateMinimap(player, enemyManager) {
    // Only render minimap every 3rd frame
    if (this._frameCount % 3 !== 0) return;

    this._renderMap(this.minimapCtx, this.minimapCanvas, player, enemyManager, 1.5, true);
    // Render big map if visible
    if (this.bigMapCanvas && this.bigMapCanvas.style.display !== 'none') {
      this._renderMap(this.bigMapCtx, this.bigMapCanvas, player, enemyManager, 3.0, false);
    }
  }

  _renderMap(ctx, canvas, player, enemyManager, scale, circular) {
    if (!ctx || !player || !player.mesh) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = w / 2;

    // Clear
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    if (circular) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
      ctx.clip();
    }

    // Dark background
    ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
    ctx.fillRect(0, 0, w, h);

    const px = player.mesh.position.x;
    const pz = player.mesh.position.z;

    // Draw enemies (red dots)
    const alive = enemyManager.getAliveEnemies();
    const radiusM4 = radius - 4;
    const radiusM6 = radius - 6;
    ctx.fillStyle = '#ff3333';
    for (let i = 0; i < alive.length; i++) {
      const enemy = alive[i];
      if (!enemy.mesh) continue;
      const dx = (enemy.mesh.position.x - px) * scale;
      const dz = (enemy.mesh.position.z - pz) * scale;
      const sx = cx + dx;
      const sy = cy - dz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < radiusM4) {
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const angle = Math.atan2(-dz, dx);
        ctx.fillStyle = '#ff6666';
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * radiusM6, cy + Math.sin(angle) * radiusM6, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff3333';
      }
    }

    // Draw boss (purple dot)
    const boss = enemyManager.getActiveBoss();
    if (boss && !boss.dead && boss.mesh) {
      const dx = (boss.mesh.position.x - px) * scale;
      const dz = (boss.mesh.position.z - pz) * scale;
      const dist = Math.sqrt(dx * dx + dz * dz);
      ctx.fillStyle = '#ff44ff';
      if (dist < radiusM4) {
        ctx.beginPath();
        ctx.arc(cx + dx, cy - dz, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const angle = Math.atan2(-dz, dx);
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * radiusM6, cy + Math.sin(angle) * radiusM6, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw player (green dot in center)
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#44ff44';
    ctx.fill();

    // Player direction indicator
    const fwd = player.forwardVector;
    if (fwd) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + fwd.x * 12, cy - fwd.z * 12);
      ctx.strokeStyle = '#44ff44';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();

    // Draw border
    if (circular) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 1, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Label for big map
    if (!circular) {
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 16px Segoe UI, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('MAP (press M to close)', cx, 24);
    }
  }
}
