export class HUD {
  constructor(gameState) {
    this.state = gameState;
    this.messageTimer = null;
    this.zoneTimer = null;
    this.currentZone = '';
    this.combatSystem = null; // Will be set by Game
    // Minimap
    this.minimapCanvas = document.getElementById('minimap');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;
  }

  show() {
    document.getElementById('hud').style.display = 'block';
  }

  hide() {
    document.getElementById('hud').style.display = 'none';
  }

  update() {
    const s = this.state;

    // Health
    document.getElementById('health-bar').style.width = (s.health / s.maxHealth * 100) + '%';
    document.getElementById('health-text').textContent = `\u2665 ${Math.ceil(s.health)} / ${s.maxHealth}`;

    // Weapon
    const elNames = { basic: 'BASIC', fire: 'FIRE', ice: 'ICE', lightning: 'LIGHTNING' };
    const el = s.selectedElement;
    let weaponText = '';

    if (this.combatSystem) {
      const mag = this.combatSystem.currentMagazine;
      const total = s.ammo[el];
      const reloading = this.combatSystem.isReloading;

      if (reloading) {
        const reloadPct = Math.ceil((this.combatSystem.reloadTimer / this.combatSystem.reloadTime) * 100);
        weaponText = `Gun: <span class="element-name ${el}">${elNames[el]}</span><br>` +
                     `<span style="color:#ffaa00">RELOADING... ${100 - reloadPct}%</span><br>` +
                     `<small>Magazine: ${mag}/${this.combatSystem.magazineSize} | Total: ${total}</small>`;
      } else {
        weaponText = `Gun: <span class="element-name ${el}">${elNames[el]}</span><br>` +
                     `Magazine: <strong>${mag}/${this.combatSystem.magazineSize}</strong> | Total: ${total}<br>` +
                     `<small>1=Basic 2=Fire 3=Ice 4=Lightning | R=Reload</small>`;
      }
    } else {
      weaponText = `Gun: <span class="element-name ${el}">${elNames[el]} (${s.ammo[el]})</span><br><small>1=Basic 2=Fire 3=Ice 4=Lightning</small>`;
    }

    document.getElementById('weapon-display').innerHTML = weaponText;

    // Shield
    const shieldEl = document.getElementById('shield-indicator');
    if (s.shieldActive) {
      shieldEl.textContent = 'Shield: ACTIVE';
      shieldEl.style.borderColor = '#44aaff';
    } else if (s.shieldCooldown > 0) {
      shieldEl.textContent = 'Shield: RECHARGING';
      shieldEl.style.borderColor = '#aa4444';
    } else {
      shieldEl.textContent = 'Shield: READY';
      shieldEl.style.borderColor = '#4488aa';
    }

    // Enemy count
    document.getElementById('enemy-count').textContent = `Enemies: ${s.enemiesAlive}`;

    // Score & coins
    document.getElementById('score-display').textContent = `Score: ${s.score}`;
    document.getElementById('coin-display').textContent = `Coins: ${s.totalCoins}`;

    // Level
    const levelEl = document.getElementById('level-display');
    if (levelEl && s.levelName) {
      levelEl.textContent = `Level ${s.levelNum}: ${s.levelName}`;
    }

    // Rank
    const rankEl = document.getElementById('rank-display');
    if (rankEl) {
      rankEl.textContent = s.rank;
      rankEl.style.color = s.rankColor || '#aaa';
      if (s.isAdmin) {
        rankEl.style.textShadow = '0 0 10px #ff0000, 0 0 20px #ff4444';
      }
    }

    // Username
    const userEl = document.getElementById('username-display');
    if (userEl && s.username) {
      userEl.textContent = s.username;
    }
  }

  showMessage(text) {
    const el = document.getElementById('message');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(this.messageTimer);
    this.messageTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  showZone(name) {
    if (this.currentZone === name) return;
    this.currentZone = name;
    const el = document.getElementById('zone-name');
    el.textContent = name;
    el.classList.add('show');
    clearTimeout(this.zoneTimer);
    this.zoneTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  updateMinimap(player, enemyManager) {
    const ctx = this.minimapCtx;
    if (!ctx || !player || !player.mesh) return;

    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 1.5; // 1 world unit = 1.5 px
    const radius = w / 2;

    // Clear with circular clip
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
    ctx.clip();

    // Dark background
    ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
    ctx.fillRect(0, 0, w, h);

    const px = player.mesh.position.x;
    const pz = player.mesh.position.z;

    // Draw enemies (red dots)
    const alive = enemyManager.getAliveEnemies();
    alive.forEach(enemy => {
      if (!enemy.mesh) return;
      const dx = (enemy.mesh.position.x - px) * scale;
      const dz = (enemy.mesh.position.z - pz) * scale;
      const sx = cx + dx;
      const sy = cy - dz; // flip Z for screen coords
      // Only draw if within minimap radius
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < radius - 4) {
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ff3333';
        ctx.fill();
      } else {
        // Draw on edge as arrow indicator
        const angle = Math.atan2(-dz, dx);
        const edgeX = cx + Math.cos(angle) * (radius - 6);
        const edgeY = cy + Math.sin(angle) * (radius - 6);
        ctx.beginPath();
        ctx.arc(edgeX, edgeY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff6666';
        ctx.fill();
      }
    });

    // Draw boss (purple dot)
    const boss = enemyManager.getActiveBoss();
    if (boss && !boss.dead && boss.mesh) {
      const dx = (boss.mesh.position.x - px) * scale;
      const dz = (boss.mesh.position.z - pz) * scale;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < radius - 4) {
        const sx = cx + dx;
        const sy = cy - dz;
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff44ff';
        ctx.fill();
      } else {
        const angle = Math.atan2(-dz, dx);
        const edgeX = cx + Math.cos(angle) * (radius - 6);
        const edgeY = cy + Math.sin(angle) * (radius - 6);
        ctx.beginPath();
        ctx.arc(edgeX, edgeY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ff44ff';
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

    // Draw border circle
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
