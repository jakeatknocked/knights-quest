export class Shop {
  constructor() {
    this.coins = parseInt(localStorage.getItem('totalCoins') || '0');
    this.purchases = JSON.parse(localStorage.getItem('shopPurchases') || '{}');

    this.items = {
      upgrades: [
        { id: 'dmg1', name: 'Damage Boost I', desc: '+25% damage', cost: 50 },
        { id: 'dmg2', name: 'Damage Boost II', desc: '+50% damage', cost: 150 },
        { id: 'hp1', name: 'Max Health Up I', desc: '+25 max HP', cost: 75 },
        { id: 'hp2', name: 'Max Health Up II', desc: '+50 max HP', cost: 200 },
        { id: 'speed', name: 'Speed Boost', desc: '+20% speed', cost: 100 },
        { id: 'shield', name: 'Shield Upgrade', desc: 'Halved cooldown', cost: 125 },
      ],
      potions: [
        { id: 'potion', name: 'Health Potion', desc: 'Start with +50 HP', cost: 20, consumable: true },
        { id: 'jump', name: 'Super Jump', desc: '+50% jump force', cost: 30, consumable: true },
      ],
      skins: [
        { id: 'skin_gold', name: 'Gold Knight', desc: 'Golden armor', cost: 100 },
        { id: 'skin_dark', name: 'Dark Knight', desc: 'Shadow armor', cost: 150 },
        { id: 'skin_crystal', name: 'Crystal Knight', desc: 'Crystal armor', cost: 200 },
        { id: 'skin_rainbow', name: 'Rainbow Knight', desc: 'Color-shifting armor', cost: 500 },
      ],
    };

    this.currentTab = 'upgrades';
    this.setupUI();
  }

  setupUI() {
    // Tab switching
    document.querySelectorAll('.shop-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.currentTab = tab.getAttribute('data-tab');
        document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.render();
      });
    });

    // Back button
    document.getElementById('shop-back-btn').addEventListener('click', () => {
      document.getElementById('shop-screen').style.display = 'none';
      document.getElementById('start-screen').style.display = 'flex';
    });

    // Shop button on start screen
    document.getElementById('shop-btn').addEventListener('click', () => {
      this.coins = parseInt(localStorage.getItem('totalCoins') || '0');
      document.getElementById('start-screen').style.display = 'none';
      document.getElementById('shop-screen').style.display = 'flex';
      this.render();
    });

    this.render();
  }

  render() {
    this.coins = parseInt(localStorage.getItem('totalCoins') || '0');
    document.getElementById('shop-coins').textContent = `Coins: ${this.coins}`;

    const container = document.getElementById('shop-items');
    container.innerHTML = '';

    const items = this.items[this.currentTab] || [];
    items.forEach(item => {
      const owned = !!this.purchases[item.id];
      const canAfford = this.coins >= item.cost;

      const div = document.createElement('div');
      div.className = 'shop-item';
      div.innerHTML = `
        <div class="item-name">${item.name}</div>
        <div class="item-desc">${item.desc}</div>
        <div class="item-cost">${item.cost} coins</div>
        <button class="buy-btn ${owned ? 'owned' : (!canAfford ? 'cant-afford' : '')}">${owned ? 'OWNED' : 'BUY'}</button>
      `;

      const btn = div.querySelector('.buy-btn');
      if (!owned && canAfford) {
        btn.addEventListener('click', () => this.buy(item));
      }

      container.appendChild(div);
    });
  }

  buy(item) {
    if (this.coins < item.cost) return;
    if (this.purchases[item.id] && !item.consumable) return;

    this.coins -= item.cost;
    localStorage.setItem('totalCoins', this.coins.toString());
    this.purchases[item.id] = true;
    localStorage.setItem('shopPurchases', JSON.stringify(this.purchases));
    this.render();
  }

  // Called by Game.js to apply upgrades to game state
  applyUpgrades(state, player) {
    const p = this.purchases;

    // Damage
    if (p.dmg2) state.damageMultiplier = Math.max(state.damageMultiplier, 1.5);
    else if (p.dmg1) state.damageMultiplier = Math.max(state.damageMultiplier, 1.25);

    // Health
    let hpBonus = 0;
    if (p.hp2) hpBonus = 50;
    else if (p.hp1) hpBonus = 25;
    state.maxHealth += hpBonus;
    state.health += hpBonus;

    // Speed
    if (p.speed) {
      player.speed = player.baseSpeed * 1.2 * (state.speedMultiplier || 1);
    }

    // Shield
    if (p.shield) state.shieldCooldownRate = 0.5;

    // Potion — start with extra HP
    if (p.potion) {
      state.health = Math.min(state.health + 50, state.maxHealth + 50);
      state.maxHealth = Math.max(state.maxHealth, state.health);
      // Consumable — remove after use
      delete this.purchases.potion;
      localStorage.setItem('shopPurchases', JSON.stringify(this.purchases));
    }

    // Jump boost
    if (p.jump) {
      player.jumpForce *= 1.5;
      delete this.purchases.jump;
      localStorage.setItem('shopPurchases', JSON.stringify(this.purchases));
    }

    // Skin — set in localStorage for Player to read
    if (p.skin_rainbow) localStorage.setItem('knightSkin', 'rainbow');
    // Other skins just unlock the option on the start screen
  }
}
