export class Shop {
  constructor() {
    this.coins = parseInt(localStorage.getItem('totalCoins') || '0');
    this.purchases = JSON.parse(localStorage.getItem('shopPurchases') || '{}');

    this.items = {
      weapons: [
        { id: 'shotgun', name: 'Shotgun', desc: 'Shoots 5 bullets at once! Wide spread.', cost: 200 },
        { id: 'rocket', name: 'Rocket Launcher', desc: 'Huge explosion, big damage!', cost: 350 },
        { id: 'laser', name: 'Laser Beam', desc: 'Instant hit, no travel time!', cost: 500 },
        { id: 'minigun', name: 'Minigun', desc: 'Super fast fire rate!', cost: 400 },
      ],
      powers: [
        { id: 'doublejump', name: 'Double Jump', desc: 'Jump again in mid-air!', cost: 150 },
        { id: 'invisible', name: 'Invisibility Cloak', desc: 'Enemies cant see you for 10s. Press V to activate.', cost: 300 },
        { id: 'magnet', name: 'Coin Magnet', desc: 'Coins fly to you from further away!', cost: 100 },
        { id: 'firetrail', name: 'Fire Trail', desc: 'Leave fire behind you that burns enemies!', cost: 250 },
        { id: 'vampiric', name: 'Vampiric Strike', desc: 'Sword hits heal you for 10 HP!', cost: 200 },
        { id: 'explosiveammo', name: 'Explosive Ammo', desc: 'Bullets explode on impact!', cost: 300 },
      ],
      pets: [
        { id: 'pet_wolf', name: 'Wolf Pup', desc: 'Attacks nearby enemies for you!', cost: 250 },
        { id: 'pet_dragon', name: 'Baby Dragon', desc: 'Flies around and breathes fire!', cost: 500 },
        { id: 'pet_fairy', name: 'Healing Fairy', desc: 'Slowly heals you over time!', cost: 200 },
        { id: 'pet_ghost', name: 'Ghost Buddy', desc: 'Scares enemies, making them run away!', cost: 300 },
      ],
      upgrades: [
        { id: 'dmg1', name: 'Damage Boost I', desc: '+25% damage', cost: 50 },
        { id: 'dmg2', name: 'Damage Boost II', desc: '+50% damage', cost: 150 },
        { id: 'dmg3', name: 'Damage Boost III', desc: '+100% damage!', cost: 400 },
        { id: 'hp1', name: 'Max Health Up I', desc: '+25 max HP', cost: 75 },
        { id: 'hp2', name: 'Max Health Up II', desc: '+50 max HP', cost: 200 },
        { id: 'hp3', name: 'Max Health Up III', desc: '+100 max HP!', cost: 450 },
        { id: 'speed', name: 'Speed Boost', desc: '+20% speed', cost: 100 },
        { id: 'speed2', name: 'Speed Boost II', desc: '+40% speed!', cost: 250 },
        { id: 'shield', name: 'Shield Upgrade', desc: 'Halved cooldown', cost: 125 },
        { id: 'ammo', name: 'Ammo Boost', desc: '+50% starting ammo each level', cost: 175 },
      ],
      potions: [
        { id: 'potion', name: 'Health Potion', desc: 'Start with +50 HP', cost: 20, consumable: true },
        { id: 'jump', name: 'Super Jump', desc: '+50% jump force', cost: 30, consumable: true },
        { id: 'megapotion', name: 'Mega Potion', desc: 'Start with +100 HP!', cost: 50, consumable: true },
        { id: 'ammopack', name: 'Ammo Pack', desc: 'Double ammo this round!', cost: 40, consumable: true },
      ],
      skins: [
        { id: 'skin_gold', name: 'Gold Knight', desc: 'Golden armor', cost: 100 },
        { id: 'skin_dark', name: 'Dark Knight', desc: 'Shadow armor', cost: 150 },
        { id: 'skin_crystal', name: 'Crystal Knight', desc: 'Crystal armor', cost: 200 },
        { id: 'skin_rainbow', name: 'Rainbow Knight', desc: 'Color-shifting armor', cost: 500 },
        { id: 'skin_lava', name: 'Lava Knight', desc: 'Glowing red-hot armor!', cost: 350 },
        { id: 'skin_ice', name: 'Frost Knight', desc: 'Icy blue frozen armor!', cost: 350 },
      ],
    };

    this.currentTab = 'weapons';
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
    if (p.dmg3) state.damageMultiplier = Math.max(state.damageMultiplier, 2.0);
    else if (p.dmg2) state.damageMultiplier = Math.max(state.damageMultiplier, 1.5);
    else if (p.dmg1) state.damageMultiplier = Math.max(state.damageMultiplier, 1.25);

    // Health
    let hpBonus = 0;
    if (p.hp3) hpBonus = 100;
    else if (p.hp2) hpBonus = 50;
    else if (p.hp1) hpBonus = 25;
    state.maxHealth += hpBonus;
    state.health += hpBonus;

    // Speed
    if (p.speed2) {
      player.speed = player.baseSpeed * 1.4 * (state.speedMultiplier || 1);
    } else if (p.speed) {
      player.speed = player.baseSpeed * 1.2 * (state.speedMultiplier || 1);
    }

    // Shield
    if (p.shield) state.shieldCooldownRate = 0.5;

    // Ammo boost
    if (p.ammo) state.ammoBoost = 1.5;

    // Double jump
    if (p.doublejump) player.canDoubleJump = true;

    // Coin magnet
    if (p.magnet) state.coinMagnet = true;

    // Vampiric strike
    if (p.vampiric) state.vampiric = true;

    // Explosive ammo
    if (p.explosiveammo) state.explosiveAmmo = true;

    // Fire trail
    if (p.firetrail) state.fireTrail = true;

    // Weapons
    if (p.shotgun) state.hasShotgun = true;
    if (p.rocket) state.hasRocket = true;
    if (p.laser) state.hasLaser = true;
    if (p.minigun) state.hasMinigun = true;

    // Pets
    if (p.pet_wolf) state.pet = 'wolf';
    if (p.pet_dragon) state.pet = 'dragon';
    if (p.pet_fairy) state.pet = 'fairy';
    if (p.pet_ghost) state.pet = 'ghost';

    // Potion — start with extra HP
    if (p.potion) {
      state.health = Math.min(state.health + 50, state.maxHealth + 50);
      state.maxHealth = Math.max(state.maxHealth, state.health);
      delete this.purchases.potion;
      localStorage.setItem('shopPurchases', JSON.stringify(this.purchases));
    }

    // Mega potion
    if (p.megapotion) {
      state.health = Math.min(state.health + 100, state.maxHealth + 100);
      state.maxHealth = Math.max(state.maxHealth, state.health);
      delete this.purchases.megapotion;
      localStorage.setItem('shopPurchases', JSON.stringify(this.purchases));
    }

    // Jump boost
    if (p.jump) {
      player.jumpForce *= 1.5;
      delete this.purchases.jump;
      localStorage.setItem('shopPurchases', JSON.stringify(this.purchases));
    }

    // Ammo pack — double ammo this round
    if (p.ammopack) {
      state.ammo.fire *= 2;
      state.ammo.ice *= 2;
      state.ammo.lightning *= 2;
      delete this.purchases.ammopack;
      localStorage.setItem('shopPurchases', JSON.stringify(this.purchases));
    }

    // Skins
    if (p.skin_rainbow) localStorage.setItem('knightSkin', 'rainbow');
    if (p.skin_lava) localStorage.setItem('knightSkin', 'lava');
    if (p.skin_ice) localStorage.setItem('knightSkin', 'ice');
  }
}
