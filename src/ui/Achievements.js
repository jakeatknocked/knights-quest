export class Achievements {
  constructor() {
    this.unlocked = JSON.parse(localStorage.getItem('achievements') || '{}');

    // All achievements
    this.list = [
      // Getting started
      { id: 'welcome', name: 'Welcome, Knight!', desc: 'Start your first quest', icon: '&#x1F3F0;' },
      { id: 'first_kill', name: 'First Blood', desc: 'Kill your first enemy', icon: '&#x1F5E1;&#xFE0F;' },
      { id: 'first_chest', name: 'Treasure Hunter', desc: 'Open your first chest', icon: '&#x1F4E6;' },

      // Sword mastery
      { id: 'sword_kill', name: 'Sword Slayer', desc: 'Kill an enemy with the sword', icon: '&#x2694;&#xFE0F;' },
      { id: 'sword_only', name: 'True Knight', desc: 'Beat a level using only the sword', icon: '&#x1F6E1;&#xFE0F;' },
      { id: 'sword_10', name: 'Blade Master', desc: 'Get 10 sword kills', icon: '&#x1F4AA;' },

      // Gun mastery
      { id: 'headshot', name: 'Sharpshooter', desc: 'Get a headshot', icon: '&#x1F3AF;' },
      { id: 'headshot_10', name: 'Sniper Elite', desc: 'Get 10 headshots', icon: '&#x1F52D;' },

      // Kill milestones
      { id: 'kills_25', name: 'Monster Hunter', desc: 'Kill 25 enemies total', icon: '&#x1F47E;' },
      { id: 'kills_50', name: 'Warrior', desc: 'Kill 50 enemies total', icon: '&#x1F4A5;' },
      { id: 'kills_100', name: 'Unstoppable', desc: 'Kill 100 enemies total', icon: '&#x1F525;' },

      // Bosses
      { id: 'boss_kill', name: 'Boss Slayer', desc: 'Defeat a boss', icon: '&#x1F451;' },
      { id: 'boss_3', name: 'King Crusher', desc: 'Defeat 3 bosses', icon: '&#x1F480;' },

      // Progress
      { id: 'level_3', name: 'Adventurer', desc: 'Reach level 3', icon: '&#x1F5FA;&#xFE0F;' },
      { id: 'level_5', name: 'Explorer', desc: 'Reach level 5', icon: '&#x1F30D;' },
      { id: 'beat_game', name: 'Legendary Knight', desc: 'Beat all 10 levels!', icon: '&#x1F3C6;' },

      // Beat each level
      { id: 'beat_castle', name: 'Castle Conqueror', desc: 'Beat the Castle level', icon: '&#x1F3F0;' },
      { id: 'beat_forest', name: 'Forest Guardian', desc: 'Beat the Forest level', icon: '&#x1F332;' },
      { id: 'beat_sky', name: 'Sky Warrior', desc: 'Beat the Sky Battle level', icon: '&#x2601;&#xFE0F;' },
      { id: 'beat_lava', name: 'Lava Walker', desc: 'Beat the Lava Fortress level', icon: '&#x1F30B;' },
      { id: 'beat_ice', name: 'Frost Breaker', desc: 'Beat the Frozen Depths level', icon: '&#x2744;&#xFE0F;' },
      { id: 'beat_shadow', name: 'Shadow Banisher', desc: 'Beat the Shadow Realm level', icon: '&#x1F311;' },
      { id: 'beat_storm', name: 'Storm Rider', desc: 'Beat the Storm Peaks level', icon: '&#x26A1;' },
      { id: 'beat_swamp', name: 'Swamp Survivor', desc: 'Beat the Poison Swamp level', icon: '&#x1F40D;' },
      { id: 'beat_crystal', name: 'Crystal Champion', desc: 'Beat the Crystal Caverns level', icon: '&#x1F48E;' },
      { id: 'beat_void', name: 'Void Master', desc: 'Beat The Void level', icon: '&#x1F573;&#xFE0F;' },

      // Coins
      { id: 'coins_100', name: 'Coin Collector', desc: 'Collect 100 coins total', icon: '&#x1FA99;' },
      { id: 'coins_500', name: 'Rich Knight', desc: 'Collect 500 coins total', icon: '&#x1F4B0;' },

      // Survival
      { id: 'survive', name: 'Survivor', desc: 'Beat survival mode', icon: '&#x23F1;&#xFE0F;' },

      // Fun / special
      { id: 'shield_block', name: 'Shield Wall', desc: 'Block damage with your shield', icon: '&#x1F6E1;&#xFE0F;' },
      { id: 'buy_item', name: 'Shopkeeper', desc: 'Buy something from the shop', icon: '&#x1F6D2;' },
      { id: 'full_health', name: 'Potion Master', desc: 'Heal to full HP with a potion', icon: '&#x1F9EA;' },
      { id: 'no_damage', name: 'Untouchable', desc: 'Beat a level without taking damage', icon: '&#x2B50;' },

      // More kill milestones
      { id: 'kills_250', name: 'Slaughter Machine', desc: 'Kill 250 enemies total', icon: '&#x1F608;' },
      { id: 'kills_500', name: 'Army Destroyer', desc: 'Kill 500 enemies total', icon: '&#x1F4A2;' },
      { id: 'sword_25', name: 'Sword Legend', desc: 'Get 25 sword kills', icon: '&#x1F5E1;&#xFE0F;' },
      { id: 'sword_50', name: 'Sword God', desc: 'Get 50 sword kills', icon: '&#x2694;&#xFE0F;' },
      { id: 'headshot_25', name: 'Eagle Eye', desc: 'Get 25 headshots', icon: '&#x1F985;' },
      { id: 'headshot_50', name: 'Aimbot', desc: 'Get 50 headshots', icon: '&#x1F916;' },

      // Boss mastery
      { id: 'boss_5', name: 'Boss Breaker', desc: 'Defeat 5 bosses', icon: '&#x1F9B9;' },
      { id: 'boss_10', name: 'Final Boss', desc: 'Defeat 10 bosses', icon: '&#x1F47D;' },

      // Coins & wealth
      { id: 'coins_1000', name: 'Gold Hoarder', desc: 'Collect 1000 coins total', icon: '&#x1F911;' },
      { id: 'coins_2500', name: 'Dragon\'s Treasure', desc: 'Collect 2500 coins total', icon: '&#x1F432;' },
      { id: 'buy_5', name: 'Big Spender', desc: 'Buy 5 items from the shop', icon: '&#x1F4B3;' },

      // Elements
      { id: 'unlock_fire', name: 'Flame Bearer', desc: 'Unlock the Fire Pistol', icon: '&#x1F525;' },
      { id: 'unlock_ice', name: 'Ice Wielder', desc: 'Unlock the Ice Pistol', icon: '&#x2744;&#xFE0F;' },
      { id: 'unlock_lightning', name: 'Thunder Lord', desc: 'Unlock the Lightning Pistol', icon: '&#x26A1;' },
      { id: 'unlock_all', name: 'Elemental Master', desc: 'Unlock all 3 elemental pistols', icon: '&#x1F308;' },

      // Friends
      { id: 'rescue_friend', name: 'Helping Hand', desc: 'Rescue a friend', icon: '&#x1F91D;' },
      { id: 'rescue_3', name: 'Knight Protector', desc: 'Rescue 3 friends', icon: '&#x1F46B;' },
      { id: 'rescue_all', name: 'Hero of the Realm', desc: 'Rescue all 6 friends', icon: '&#x1F468;&#x200D;&#x1F469;&#x200D;&#x1F467;&#x200D;&#x1F466;' },

      // Chest hunting
      { id: 'chests_5', name: 'Chest Looter', desc: 'Open 5 chests', icon: '&#x1F4E6;' },
      { id: 'chests_15', name: 'Treasure King', desc: 'Open 15 chests', icon: '&#x1F4E6;' },
      { id: 'mega_chest', name: 'Jackpot!', desc: 'Open a Mega Chest', icon: '&#x1F7E3;' },
      { id: 'gold_chest', name: 'Gold Rush', desc: 'Open a Gold Chest', icon: '&#x1FA99;' },

      // Speed & style
      { id: 'quick_clear', name: 'Speed Runner', desc: 'Beat a level in under 90 seconds', icon: '&#x23F1;&#xFE0F;' },
      { id: 'kill_streak_5', name: 'On Fire!', desc: 'Kill 5 enemies in 10 seconds', icon: '&#x1F4A5;' },
      { id: 'kill_streak_10', name: 'Rampage!', desc: 'Kill 10 enemies in 20 seconds', icon: '&#x1F4A2;' },
      { id: 'low_health_win', name: 'Close Call', desc: 'Beat a level with under 10 HP', icon: '&#x1F494;' },
      { id: 'died_first', name: 'First Fall', desc: 'Die for the first time', icon: '&#x1FAA6;' },
      { id: 'died_10', name: 'Never Give Up', desc: 'Die 10 times', icon: '&#x1F4AA;' },

      // Exploration
      { id: 'emote_use', name: 'Expressive', desc: 'Use an emote', icon: '&#x1F60E;' },
      { id: 'chat_msg', name: 'Social Knight', desc: 'Send a chat message', icon: '&#x1F4AC;' },
      { id: 'play_time_30', name: 'Dedicated Knight', desc: 'Play for 30 minutes total', icon: '&#x23F0;' },
      { id: 'play_time_60', name: 'Knight Addict', desc: 'Play for 1 hour total', icon: '&#x1F55B;' },

      // Pets
      { id: 'pet_kill', name: 'Good Boy!', desc: 'Your pet killed an enemy', icon: '&#x1F43E;' },
    ];

    this.setupUI();
  }

  setupUI() {
    // Achievements button on start screen
    const btn = document.getElementById('achievements-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('achievements-screen').style.display = 'flex';
        this.render();
      });
    }

    // Back button
    const backBtn = document.getElementById('achievements-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        document.getElementById('achievements-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'flex';
      });
    }
  }

  unlock(id, hud) {
    if (this.unlocked[id]) return; // already got it
    this.unlocked[id] = Date.now();
    localStorage.setItem('achievements', JSON.stringify(this.unlocked));

    const achievement = this.list.find(a => a.id === id);
    if (!achievement) return;

    // Show popup
    this.showPopup(achievement);

    // Also show HUD message
    if (hud) {
      hud.showMessage(`Achievement: ${achievement.name}!`);
    }
  }

  showPopup(achievement) {
    // Remove any existing popup
    const old = document.getElementById('achievement-popup');
    if (old) old.remove();

    const popup = document.createElement('div');
    popup.id = 'achievement-popup';
    popup.innerHTML = `
      <div class="ach-popup-icon">${achievement.icon}</div>
      <div class="ach-popup-text">
        <div class="ach-popup-title">Achievement Unlocked!</div>
        <div class="ach-popup-name">${achievement.name}</div>
      </div>
    `;
    document.body.appendChild(popup);

    // Trigger animation
    requestAnimationFrame(() => popup.classList.add('show'));

    // Remove after 4 seconds
    setTimeout(() => {
      popup.classList.remove('show');
      setTimeout(() => popup.remove(), 500);
    }, 4000);
  }

  render() {
    const container = document.getElementById('achievements-list');
    if (!container) return;

    container.innerHTML = '';
    const total = this.list.length;
    const earned = this.list.filter(a => this.unlocked[a.id]).length;

    // Progress
    const progress = document.createElement('div');
    progress.className = 'ach-progress';
    progress.textContent = `${earned} / ${total} Achievements`;
    container.appendChild(progress);

    this.list.forEach(achievement => {
      const owned = !!this.unlocked[achievement.id];
      const div = document.createElement('div');
      div.className = 'ach-item' + (owned ? ' earned' : ' locked');
      div.innerHTML = `
        <div class="ach-icon">${owned ? achievement.icon : '&#x1F512;'}</div>
        <div class="ach-info">
          <div class="ach-name">${achievement.name}</div>
          <div class="ach-desc">${achievement.desc}</div>
        </div>
        ${owned ? '<div class="ach-check">&#x2714;</div>' : ''}
      `;
      container.appendChild(div);
    });
  }
}
