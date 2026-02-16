export class Shop {
  // Weapon power ranking (higher = better)
  static WEAPON_TIER = {
    pistol: 0,
    shotgun: 1,
    rocket: 2,
    minigun: 3,
    laser: 4,
  };

  constructor() {
    this.coins = parseInt(localStorage.getItem('totalCoins') || '0');
    this.purchases = JSON.parse(localStorage.getItem('shopPurchases') || '{}');

    this.items = {
      weapons: [
        { id: 'shotgun', name: 'Shotgun', desc: '5 pellets per shot! Great close range.', cost: 150, icon: '<div style="font-size:36px">&#x1F52B;</div>' },
        { id: 'rocket', name: 'Rocket Launcher', desc: 'Huge explosion damage! Uses 5 ammo.', cost: 300, icon: '<div style="font-size:36px">&#x1F680;</div>' },
        { id: 'minigun', name: 'Minigun', desc: 'Rapid fire! 5 shots per second.', cost: 400, icon: '<div style="font-size:36px">&#x2699;&#xFE0F;</div>' },
        { id: 'laser', name: 'Laser Beam', desc: 'Instant hit laser! Best weapon.', cost: 500, icon: '<div style="font-size:36px">&#x1F4A0;</div>' },
      ],
      powers: [
        { id: 'doublejump', name: 'Double Jump', desc: 'Jump again in mid-air!', cost: 150, icon: '<div style="font-size:36px">&#x1F998;</div>' },
        { id: 'invisible', name: 'Invisibility Cloak', desc: 'Enemies cant see you for 10s. Press V to activate.', cost: 300, icon: '<div style="font-size:36px">&#x1F47B;</div>' },
        { id: 'magnet', name: 'Coin Magnet', desc: 'Coins fly to you from further away!', cost: 100, icon: '<div style="font-size:36px">&#x1F9F2;</div>' },
        { id: 'firetrail', name: 'Fire Trail', desc: 'Leave fire behind you that burns enemies!', cost: 250, icon: '<div style="font-size:36px">&#x1F525;</div>' },
        { id: 'vampiric', name: 'Vampiric Strike', desc: 'Sword hits heal you for 10 HP!', cost: 200, icon: '<div style="font-size:36px">&#x1F9DB;</div>' },
        { id: 'explosiveammo', name: 'Explosive Ammo', desc: 'Bullets explode on impact!', cost: 300, icon: '<div style="font-size:36px">&#x1F4A3;</div>' },
      ],
      pets: [
        { id: 'pet_wolf', name: 'Wolf Pup', desc: 'Attacks nearby enemies for you!', cost: 250, icon: '<div style="font-size:36px">&#x1F43A;</div>' },
        { id: 'pet_dragon', name: 'Baby Dragon', desc: 'Flies around and breathes fire!', cost: 500, icon: '<div style="font-size:36px">&#x1F409;</div>' },
        { id: 'pet_fairy', name: 'Healing Fairy', desc: 'Slowly heals you over time!', cost: 200, icon: '<div style="font-size:36px">&#x1F9DA;</div>' },
        { id: 'pet_ghost', name: 'Ghost Buddy', desc: 'Scares enemies, making them run away!', cost: 300, icon: '<div style="font-size:36px">&#x1F47B;</div>' },
      ],
      upgrades: [
        { id: 'dmg1', name: 'Damage Boost I', desc: '+25% damage', cost: 50, icon: '<div style="font-size:36px">&#x2694;&#xFE0F;</div>' },
        { id: 'dmg2', name: 'Damage Boost II', desc: '+50% damage', cost: 150, icon: '<div style="font-size:36px">&#x2694;&#xFE0F;&#x2694;&#xFE0F;</div>' },
        { id: 'dmg3', name: 'Damage Boost III', desc: '+100% damage!', cost: 400, icon: '<div style="font-size:36px">&#x2694;&#xFE0F;&#x2694;&#xFE0F;&#x2694;&#xFE0F;</div>' },
        { id: 'hp1', name: 'Max Health Up I', desc: '+25 max HP', cost: 75, icon: '<div style="font-size:36px">&#x2764;&#xFE0F;</div>' },
        { id: 'hp2', name: 'Max Health Up II', desc: '+50 max HP', cost: 200, icon: '<div style="font-size:36px">&#x2764;&#xFE0F;&#x2764;&#xFE0F;</div>' },
        { id: 'hp3', name: 'Max Health Up III', desc: '+100 max HP!', cost: 450, icon: '<div style="font-size:36px">&#x2764;&#xFE0F;&#x2764;&#xFE0F;&#x2764;&#xFE0F;</div>' },
        { id: 'speed', name: 'Speed Boost', desc: '+20% speed', cost: 100, icon: '<div style="font-size:36px">&#x1F3C3;</div>' },
        { id: 'speed2', name: 'Speed Boost II', desc: '+40% speed!', cost: 250, icon: '<div style="font-size:36px">&#x1F3C3;&#x1F4A8;</div>' },
        { id: 'shield', name: 'Shield Upgrade', desc: 'Halved cooldown', cost: 125, icon: '<div style="font-size:36px">&#x1F6E1;&#xFE0F;</div>' },
        { id: 'ammo', name: 'Ammo Boost', desc: '+50% starting ammo each level', cost: 175, icon: '<div style="font-size:36px">&#x1F4E6;</div>' },
      ],
      potions: [
        { id: 'potion', name: 'Health Potion', desc: 'Start with +50 HP', cost: 20, consumable: true, icon: '<div style="font-size:36px">&#x1F9EA;</div>' },
        { id: 'jump', name: 'Super Jump', desc: '+50% jump force', cost: 30, consumable: true, icon: '<div style="font-size:36px">&#x1F680;</div>' },
        { id: 'megapotion', name: 'Mega Potion', desc: 'Start with +100 HP!', cost: 50, consumable: true, icon: '<div style="font-size:36px">&#x1F48A;</div>' },
        { id: 'ammopack', name: 'Ammo Pack', desc: 'Double ammo this round!', cost: 40, consumable: true, icon: '<div style="font-size:36px">&#x1F4E6;&#x1F525;</div>' },
      ],
      skins: [
        { id: 'skin_gold', name: 'Gold Knight', desc: 'Golden armor', cost: 100, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#ffd700,#aa8800);border-radius:4px;border:2px solid #ffee88;position:relative"><div style="width:20px;height:20px;background:#ffd700;border-radius:50%;margin:-12px auto 0;border:2px solid #ffee88"></div></div>' },
        { id: 'skin_dark', name: 'Dark Knight', desc: 'Shadow armor', cost: 150, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#443366,#221133);border-radius:4px;border:2px solid #665599;position:relative"><div style="width:20px;height:20px;background:#332255;border-radius:50%;margin:-12px auto 0;border:2px solid #665599"></div></div>' },
        { id: 'skin_crystal', name: 'Crystal Knight', desc: 'Crystal armor', cost: 200, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#33eedd,#11aa99);border-radius:4px;border:2px solid #66ffee;position:relative"><div style="width:20px;height:20px;background:#22ccbb;border-radius:50%;margin:-12px auto 0;border:2px solid #66ffee"></div></div>' },
        { id: 'skin_rainbow', name: 'Rainbow Knight', desc: 'Color-shifting armor', cost: 500, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(90deg,red,orange,yellow,green,blue,violet);border-radius:4px;border:2px solid #fff;position:relative"><div style="width:20px;height:20px;background:linear-gradient(90deg,red,blue);border-radius:50%;margin:-12px auto 0;border:2px solid #fff"></div></div>' },
        { id: 'skin_lava', name: 'Lava Knight', desc: 'Glowing red-hot armor!', cost: 350, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#ff4400,#aa2200);border-radius:4px;border:2px solid #ff8844;position:relative"><div style="width:20px;height:20px;background:#ff3300;border-radius:50%;margin:-12px auto 0;border:2px solid #ff8844"></div></div>' },
        { id: 'skin_ice', name: 'Frost Knight', desc: 'Icy blue frozen armor!', cost: 350, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#66bbff,#3388cc);border-radius:4px;border:2px solid #99ddff;position:relative"><div style="width:20px;height:20px;background:#55aaee;border-radius:50%;margin:-12px auto 0;border:2px solid #99ddff"></div></div>' },
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
    const equippedWeapon = localStorage.getItem('equippedWeapon') || 'pistol';
    const equippedPet = localStorage.getItem('equippedPet') || '';

    items.forEach(item => {
      const owned = !!this.purchases[item.id];
      const canAfford = this.coins >= item.cost;
      const isWeapon = this.currentTab === 'weapons';
      const isPet = this.currentTab === 'pets';
      const isEquipped = isWeapon && equippedWeapon === item.id;
      const petType = isPet ? item.id.replace('pet_', '') : '';
      const isPetEquipped = isPet && equippedPet === petType;

      const div = document.createElement('div');
      div.className = 'shop-item';

      let btnHtml;
      if (item.info) {
        btnHtml = '';
      } else if (owned && isPet) {
        // Pet: show equip/unequip button
        btnHtml = isPetEquipped
          ? `<button class="buy-btn equipped" data-action="unequip-pet" data-pet="${petType}">EQUIPPED &#10003;</button>`
          : `<button class="buy-btn equip" data-action="equip-pet" data-pet="${petType}">EQUIP</button>`;
      } else if (owned && !item.consumable) {
        btnHtml = `<button class="buy-btn owned">OWNED</button>`;
      } else {
        btnHtml = `<button class="buy-btn ${!canAfford ? 'cant-afford' : ''}">${item.cost} coins</button>`;
      }

      div.innerHTML = `
        ${item.icon ? `<div class="item-icon">${item.icon}</div>` : ''}
        <div class="item-name">${item.name}</div>
        <div class="item-desc">${item.desc}</div>
        ${btnHtml}
      `;

      const btn = div.querySelector('.buy-btn');
      if (btn) {
        if (btn.dataset.action === 'equip-pet') {
          btn.addEventListener('click', () => this.equipPet(btn.dataset.pet));
        } else if (btn.dataset.action === 'unequip-pet') {
          btn.addEventListener('click', () => this.unequipPet());
        } else if (!owned && canAfford && !item.info) {
          btn.addEventListener('click', () => this.buy(item));
        }
      }

      container.appendChild(div);
    });
  }

  equipWeapon(weaponId) {
    localStorage.setItem('equippedWeapon', weaponId);
    this.render();
  }

  equipPet(petType) {
    localStorage.setItem('equippedPet', petType);
    this.render();
  }

  unequipPet() {
    localStorage.removeItem('equippedPet');
    this.render();
  }

  buy(item) {
    if (this.coins < item.cost) return;
    if (this.purchases[item.id] && !item.consumable) return;

    this.coins -= item.cost;
    localStorage.setItem('totalCoins', this.coins.toString());
    this.purchases[item.id] = true;
    localStorage.setItem('shopPurchases', JSON.stringify(this.purchases));

    // Notify listeners (achievements)
    if (this.onPurchase) this.onPurchase(item);

    // Auto-equip weapon if it's better than current
    const isWeapon = this.items.weapons.some(w => w.id === item.id);
    if (isWeapon) {
      const currentWeapon = localStorage.getItem('equippedWeapon') || 'pistol';
      const currentTier = Shop.WEAPON_TIER[currentWeapon] || 0;
      const newTier = Shop.WEAPON_TIER[item.id] || 0;
      if (newTier > currentTier) {
        localStorage.setItem('equippedWeapon', item.id);
      }
    }

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

    // Equip saved weapon (only if owned)
    const equipped = localStorage.getItem('equippedWeapon') || 'pistol';
    if (equipped === 'pistol' || p[equipped]) {
      state.selectedWeapon = equipped;
    } else {
      state.selectedWeapon = 'pistol';
    }

    // Pet — use equipped pet (only 1 at a time)
    const equippedPet = localStorage.getItem('equippedPet') || '';
    if (equippedPet && p['pet_' + equippedPet]) {
      state.pet = equippedPet;
    } else {
      state.pet = null;
    }

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
