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

      // HARD achievements — good luck!
      { id: 'kills_1000', name: 'Genocide', desc: 'Kill 1000 enemies total', icon: '&#x1F571;&#xFE0F;' },
      { id: 'kills_2500', name: 'Extinction Event', desc: 'Kill 2500 enemies total', icon: '&#x2620;&#xFE0F;' },
      { id: 'kills_5000', name: 'Death Incarnate', desc: 'Kill 5000 enemies total', icon: '&#x1F47F;' },
      { id: 'sword_100', name: 'Blade Deity', desc: 'Get 100 sword kills', icon: '&#x1F5E1;&#xFE0F;' },
      { id: 'sword_250', name: 'Sword of Legend', desc: 'Get 250 sword kills', icon: '&#x2694;&#xFE0F;' },
      { id: 'headshot_100', name: 'One Shot Wonder', desc: 'Get 100 headshots', icon: '&#x1F3AF;' },
      { id: 'headshot_250', name: 'Never Miss', desc: 'Get 250 headshots', icon: '&#x1F52B;' },
      { id: 'boss_25', name: 'Boss Nightmare', desc: 'Defeat 25 bosses', icon: '&#x1F479;' },
      { id: 'boss_50', name: 'Boss Extinction', desc: 'Defeat 50 bosses', icon: '&#x1F480;' },
      { id: 'coins_5000', name: 'Millionaire Knight', desc: 'Collect 5000 coins total', icon: '&#x1F4B0;' },
      { id: 'coins_10000', name: 'Jeff Bezos', desc: 'Collect 10000 coins total', icon: '&#x1F48E;' },
      { id: 'play_time_180', name: 'No Life Knight', desc: 'Play for 3 hours total', icon: '&#x1F634;' },
      { id: 'play_time_600', name: 'Touch Grass?', desc: 'Play for 10 hours total', icon: '&#x1F33F;' },
      { id: 'died_50', name: 'Professional Dier', desc: 'Die 50 times', icon: '&#x1FAA6;' },
      { id: 'died_100', name: 'Immortal (Ironic)', desc: 'Die 100 times', icon: '&#x1F47B;' },
      { id: 'kill_streak_15', name: 'UNSTOPPABLE!', desc: 'Kill 15 enemies in 20 seconds', icon: '&#x1F4A2;' },
      { id: 'kill_streak_20', name: 'GODLIKE!', desc: 'Kill 20 enemies in 30 seconds', icon: '&#x1F31F;' },
      { id: 'no_damage_3', name: 'Untouchable x3', desc: 'Beat 3 levels without taking damage', icon: '&#x1F6E1;&#xFE0F;' },
      { id: 'speed_run_60', name: 'Lightning Fast', desc: 'Beat a level in under 60 seconds', icon: '&#x26A1;' },
      { id: 'speed_run_30', name: 'Are You Hacking?!', desc: 'Beat a level in under 30 seconds', icon: '&#x1F3CE;&#xFE0F;' },
      { id: 'buy_10', name: 'Shopping Spree', desc: 'Buy 10 items from the shop', icon: '&#x1F6D2;' },
      { id: 'buy_25', name: 'Own Everything', desc: 'Buy 25 items from the shop', icon: '&#x1F451;' },
      { id: 'beat_game_no_shop', name: 'True Warrior', desc: 'Beat the game with no shop items', icon: '&#x1F9D8;' },
      { id: 'survive_no_damage', name: 'Ghost', desc: 'Beat survival mode without taking damage', icon: '&#x1F47B;' },
      // Weapon mastery
      { id: 'shotgun_kills_25', name: 'Boomstick', desc: 'Get 25 kills with the shotgun', icon: '&#x1F52B;' },
      { id: 'rocket_kills_25', name: 'Rocket Man', desc: 'Get 25 kills with the rocket launcher', icon: '&#x1F680;' },
      { id: 'laser_kills_25', name: 'Pew Pew Pew', desc: 'Get 25 kills with the laser', icon: '&#x1F4A0;' },
      { id: 'minigun_kills_25', name: 'Bullet Storm', desc: 'Get 25 kills with the minigun', icon: '&#x2699;&#xFE0F;' },
      { id: 'crossbow_kills_25', name: 'Crossbow Expert', desc: 'Get 25 kills with the crossbow', icon: '&#x1F3F9;' },
      { id: 'flamethrower_kills_25', name: 'Pyromaniac', desc: 'Get 25 kills with the flamethrower', icon: '&#x1F525;' },
      { id: 'all_weapons', name: 'Arsenal', desc: 'Own every weapon in the shop', icon: '&#x1F52B;' },

      // Pet collection
      { id: 'pet_2', name: 'Pet Lover', desc: 'Own 2 pets', icon: '&#x1F436;' },
      { id: 'pet_4', name: 'Pet Hoarder', desc: 'Own 4 pets', icon: '&#x1F431;' },
      { id: 'pet_all', name: 'Zoo Keeper', desc: 'Own every pet', icon: '&#x1F418;' },

      // Skin collection
      { id: 'skin_3', name: 'Fashionista', desc: 'Own 3 skins', icon: '&#x1F454;' },
      { id: 'skin_6', name: 'Wardrobe King', desc: 'Own 6 skins', icon: '&#x1F451;' },
      { id: 'skin_all', name: 'Fashion Legend', desc: 'Own every skin', icon: '&#x1F48E;' },

      // Combat style
      { id: 'multi_element', name: 'Element Mixer', desc: 'Use all 3 elements in one level', icon: '&#x1F300;' },
      { id: 'shield_master', name: 'Shield Master', desc: 'Block 50 attacks with your shield', icon: '&#x1F6E1;&#xFE0F;' },
      { id: 'dash_kill', name: 'Dash Destroyer', desc: 'Kill an enemy with dash attack', icon: '&#x1F4A8;' },
      { id: 'frost_freeze_10', name: 'Ice Age', desc: 'Freeze 10 enemies with Frost Wave', icon: '&#x2744;&#xFE0F;' },
      { id: 'fire_trail_kill', name: 'Hot Pursuit', desc: 'Kill an enemy with fire trail', icon: '&#x1F525;' },

      // Survival challenges
      { id: 'survive_half_hp', name: 'Half Dead', desc: 'Beat survival with under 50% HP', icon: '&#x1F494;' },
      { id: 'survive_3', name: 'Survivor Pro', desc: 'Beat survival mode 3 times', icon: '&#x1F3C5;' },
      { id: 'survive_5', name: 'Unkillable', desc: 'Beat survival mode 5 times', icon: '&#x1F9BE;' },

      // Miscellaneous fun
      { id: 'fall_death', name: 'Gravity Check', desc: 'Die by falling', icon: '&#x1FA82;' },
      { id: 'max_rank', name: 'LEGEND', desc: 'Reach Legend rank', icon: '&#x1F31F;' },
      { id: 'potion_5', name: 'Potion Addict', desc: 'Use 5 potions total', icon: '&#x1F9EA;' },
      { id: 'potion_20', name: 'Alchemist', desc: 'Use 20 potions total', icon: '&#x2697;&#xFE0F;' },
      { id: 'coin_magnet_500', name: 'Magnet Master', desc: 'Collect 500 coins with coin magnet active', icon: '&#x1F9F2;' },
      { id: 'invisible_kill', name: 'Assassin', desc: 'Kill an enemy while invisible', icon: '&#x1F977;' },
      { id: 'giant_kill', name: 'Fee-Fi-Fo-Fum', desc: 'Kill an enemy while giant', icon: '&#x1F9CC;' },
      { id: 'full_upgrades', name: 'Maxed Out', desc: 'Buy all damage, health, and speed upgrades', icon: '&#x1F4AA;' },
      { id: 'win_pvp', name: 'PvP Victor', desc: 'Win a 1v1 PvP match', icon: '&#x1F94A;' },
      { id: 'win_pvp_5', name: 'PvP Champion', desc: 'Win 5 PvP matches', icon: '&#x1F3C6;' },
      { id: 'win_pvp_flawless', name: 'Flawless Victory', desc: 'Win a PvP match 5-0', icon: '&#x1F947;' },
      { id: 'gift_send', name: 'Generous Knight', desc: 'Gift an item to someone', icon: '&#x1F381;' },
      { id: 'gift_send_5', name: 'Santa Claus', desc: 'Gift 5 items to others', icon: '&#x1F385;' },
      { id: 'gift_receive', name: 'Lucky Knight', desc: 'Receive a gift from someone', icon: '&#x1F381;' },

      { id: 'all_achievements', name: 'Completionist', desc: 'Unlock every other achievement', icon: '&#x1F3C6;' },
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

    // Check if all other achievements are unlocked (completionist)
    const otherAchievements = this.list.filter(a => a.id !== 'all_achievements');
    const allUnlocked = otherAchievements.every(a => this.unlocked[a.id]);
    if (allUnlocked && !this.unlocked['all_achievements']) {
      this.unlocked['all_achievements'] = Date.now();
      localStorage.setItem('achievements', JSON.stringify(this.unlocked));
    }

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
