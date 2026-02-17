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

      // Rebirth achievements
      { id: 'rebirth_1', name: 'Born Again', desc: 'Perform your first rebirth', icon: '&#11088;' },
      { id: 'rebirth_3', name: 'Triple Reborn', desc: 'Rebirth 3 times', icon: '&#11088;' },
      { id: 'rebirth_5', name: 'Eternal Knight', desc: 'Rebirth 5 times — true dedication!', icon: '&#127775;' },
      { id: 'rebirth_10', name: 'Rebirth Master', desc: 'Rebirth 10 times!', icon: '&#11088;' },
      { id: 'rebirth_max', name: 'LEGENDARY KNIGHT', desc: 'Reach MAX rebirth (15) — the ultimate achievement!', icon: '&#128081;' },

      // Party achievements
      { id: 'party_time', name: 'Party Animal', desc: 'Enter the party level', icon: '&#x1F389;' },
      { id: 'party_bounce', name: 'Bouncy Boy', desc: 'Use a trampoline at the party', icon: '&#x1F3C0;' },
      { id: 'party_5', name: 'Party Addict', desc: 'Visit the party level 5 times', icon: '&#x1F38A;' },
      { id: 'party_10', name: 'Party Legend', desc: 'Visit the party level 10 times', icon: '&#x1F973;' },
      { id: 'party_dance_floor', name: 'Disco King', desc: 'Stand on the dance floor for 30 seconds', icon: '&#x1F57A;' },
      { id: 'party_all_trampolines', name: 'Bounce Master', desc: 'Use every trampoline at the party', icon: '&#x1F3AA;' },

      // Speed achievements
      { id: 'sprint_marathon', name: 'Marathon Runner', desc: 'Sprint for 5 minutes total', icon: '&#x1F3C3;' },
      { id: 'sprint_10', name: 'Speed Demon', desc: 'Sprint for 10 minutes total', icon: '&#x1F3C3;' },
      { id: 'sprint_30', name: 'Infinite Stamina', desc: 'Sprint for 30 minutes total', icon: '&#x1F4A8;' },
      { id: 'sprint_60', name: 'Sonic Knight', desc: 'Sprint for 60 minutes total', icon: '&#x26A1;' },
      { id: 'jump_100', name: 'Bunny Hop', desc: 'Jump 100 times', icon: '&#x1F407;' },
      { id: 'jump_500', name: 'Moon Bounce', desc: 'Jump 500 times', icon: '&#x1F319;' },
      { id: 'jump_1000', name: 'Kangaroo', desc: 'Jump 1000 times', icon: '&#x1F998;' },
      { id: 'jump_2500', name: 'Trampoline Legs', desc: 'Jump 2500 times', icon: '&#x1F680;' },
      { id: 'jump_5000', name: 'Anti-Gravity', desc: 'Jump 5000 times', icon: '&#x1FA90;' },
      { id: 'jump_10000', name: 'Space Knight', desc: 'Jump 10000 times', icon: '&#x1F30C;' },

      // Combat challenges
      { id: 'no_sword_win', name: 'Guns Only', desc: 'Beat a level without using the sword', icon: '&#x1F52B;' },
      { id: 'no_gun_win', name: 'Swords Only', desc: 'Beat a level without shooting', icon: '&#x2694;&#xFE0F;' },
      { id: 'overkill', name: 'Overkill', desc: 'Deal 500+ damage in one hit', icon: '&#x1F4A5;' },
      { id: 'point_blank', name: 'Point Blank', desc: 'Kill an enemy at very close range with a gun', icon: '&#x1F52B;' },
      { id: 'last_second', name: 'Last Second', desc: 'Kill the boss with under 10 HP', icon: '&#x1F62C;' },
      { id: 'kill_3_elements', name: 'Elemental Chaos', desc: 'Kill enemies with all 3 elements in 10 seconds', icon: '&#x1F300;' },
      { id: 'back_to_back_bosses', name: 'Boss Rush', desc: 'Kill 2 bosses in under 5 minutes', icon: '&#x1F479;' },
      { id: 'one_hp_kill', name: 'Clutch Master', desc: 'Kill an enemy with exactly 1 HP left', icon: '&#x1F494;' },
      { id: 'kill_while_jumping', name: 'Aerial Ace', desc: 'Kill an enemy while in the air', icon: '&#x1F985;' },
      { id: 'kill_while_sprinting', name: 'Drive-By', desc: 'Kill an enemy while sprinting', icon: '&#x1F3CE;&#xFE0F;' },

      // Social / multiplayer
      { id: 'coop_start', name: 'Team Player', desc: 'Start a co-op game', icon: '&#x1F91D;' },
      { id: 'pvp_start', name: 'Challenger', desc: 'Start a PvP match', icon: '&#x1F94A;' },
      { id: 'win_pvp_10', name: 'PvP Legend', desc: 'Win 10 PvP matches', icon: '&#x1F3C6;' },
      { id: 'win_pvp_25', name: 'PvP King', desc: 'Win 25 PvP matches', icon: '&#x1F451;' },
      { id: 'win_pvp_50', name: 'PvP God', desc: 'Win 50 PvP matches', icon: '&#x1F47F;' },
      { id: 'pvp_comeback', name: 'Comeback Kid', desc: 'Win a PvP match after being down 0-3', icon: '&#x1F4AA;' },
      { id: 'emote_all', name: 'Emote Master', desc: 'Use every emote at least once', icon: '&#x1F60E;' },
      { id: 'chat_50', name: 'Chatterbox', desc: 'Send 50 chat messages', icon: '&#x1F4AC;' },
      { id: 'chat_200', name: 'Motormouth', desc: 'Send 200 chat messages', icon: '&#x1F5E3;&#xFE0F;' },

      // Exploration
      { id: 'reach_height_20', name: 'Sky High', desc: 'Reach a height of 20 meters', icon: '&#x2601;&#xFE0F;' },
      { id: 'reach_height_50', name: 'Stratosphere', desc: 'Reach a height of 50 meters', icon: '&#x1F680;' },
      { id: 'reach_height_100', name: 'Orbit', desc: 'Reach a height of 100 meters', icon: '&#x1FA90;' },
      { id: 'edge_of_map', name: 'Explorer', desc: 'Reach the edge of the map', icon: '&#x1F5FA;&#xFE0F;' },
      { id: 'visit_all_levels', name: 'World Traveler', desc: 'Visit every level at least once', icon: '&#x1F30D;' },
      { id: 'walk_1km', name: 'Long Walk', desc: 'Walk 1000 meters total', icon: '&#x1F6B6;' },
      { id: 'walk_5km', name: 'Hiking Knight', desc: 'Walk 5000 meters total', icon: '&#x26F0;&#xFE0F;' },
      { id: 'walk_10km', name: 'Pilgrim', desc: 'Walk 10000 meters total', icon: '&#x1F3DE;&#xFE0F;' },
      { id: 'walk_50km', name: 'World Walker', desc: 'Walk 50000 meters total', icon: '&#x1F30E;' },

      // Skin & fashion
      { id: 'skin_10', name: 'Fashion Icon', desc: 'Own 10 skins', icon: '&#x1F457;' },
      { id: 'skin_15', name: 'Closet Explosion', desc: 'Own 15 skins', icon: '&#x1F45F;' },
      { id: 'skin_20', name: 'Every Color', desc: 'Own 20 skins', icon: '&#x1F308;' },
      { id: 'equip_rainbow', name: 'Taste the Rainbow', desc: 'Equip the Rainbow skin', icon: '&#x1F308;' },
      { id: 'equip_void', name: 'Into the Void', desc: 'Equip the Void skin', icon: '&#x1F573;&#xFE0F;' },
      { id: 'equip_diamond', name: 'Bling Bling', desc: 'Equip the Diamond skin', icon: '&#x1F48E;' },
      { id: 'equip_inferno', name: 'Fire Walk', desc: 'Equip the Inferno skin', icon: '&#x1F525;' },
      { id: 'change_skin_10', name: 'Indecisive', desc: 'Change skins 10 times', icon: '&#x1F504;' },

      // Economy
      { id: 'coins_25000', name: 'Treasure Dragon', desc: 'Collect 25000 coins total', icon: '&#x1F409;' },
      { id: 'coins_50000', name: 'Kingdom Treasury', desc: 'Collect 50000 coins total', icon: '&#x1F3E6;' },
      { id: 'coins_100000', name: 'Gold Mountain', desc: 'Collect 100000 coins total', icon: '&#x1F3D4;&#xFE0F;' },
      { id: 'coins_250000', name: 'Scrooge McDuck', desc: 'Collect 250000 coins total', icon: '&#x1F986;' },
      { id: 'coins_500000', name: 'Half a Million', desc: 'Collect 500000 coins total', icon: '&#x1F4B0;' },
      { id: 'coins_1000000', name: 'MILLIONAIRE', desc: 'Collect 1000000 coins total!', icon: '&#x1F911;' },
      { id: 'buy_50', name: 'Bought the Shop', desc: 'Buy 50 items from the shop', icon: '&#x1F3EA;' },
      { id: 'buy_100', name: 'Shopping Addiction', desc: 'Buy 100 items from the shop', icon: '&#x1F6D2;' },
      { id: 'gift_send_10', name: 'Gift Machine', desc: 'Gift 10 items to others', icon: '&#x1F381;' },
      { id: 'gift_send_25', name: 'Santa\'s Workshop', desc: 'Gift 25 items to others', icon: '&#x1F385;' },
      { id: 'gift_send_50', name: 'Giving Legend', desc: 'Gift 50 items to others', icon: '&#x1F49D;' },
      { id: 'gift_receive_5', name: 'Popular Knight', desc: 'Receive 5 gifts from others', icon: '&#x1F381;' },
      { id: 'gift_receive_25', name: 'Most Loved', desc: 'Receive 25 gifts from others', icon: '&#x1F496;' },
      { id: 'spend_1000', name: 'Big Purchase', desc: 'Spend 1000 coins in one shop visit', icon: '&#x1F4B8;' },
      { id: 'spend_10000', name: 'Whale', desc: 'Spend 10000 coins in one shop visit', icon: '&#x1F433;' },

      // Endurance
      { id: 'play_time_1800', name: 'No Sleep Knight', desc: 'Play for 30 hours total', icon: '&#x1F236;' },
      { id: 'play_time_3600', name: 'Eternal Player', desc: 'Play for 60 hours total', icon: '&#x231B;' },
      { id: 'play_time_6000', name: 'Is This Your Job?', desc: 'Play for 100 hours total', icon: '&#x1F4BC;' },
      { id: 'died_250', name: 'Phoenix', desc: 'Die 250 times and keep going', icon: '&#x1F426;&#x200D;&#x1F525;' },
      { id: 'died_500', name: 'Zombie Knight', desc: 'Die 500 times', icon: '&#x1F9DF;' },
      { id: 'died_1000', name: 'Immortal Soul', desc: 'Die 1000 times — nothing keeps you down!', icon: '&#x1F47B;' },
      { id: 'beat_game_3', name: 'Triple Crown', desc: 'Beat all levels 3 times', icon: '&#x1F451;' },
      { id: 'beat_game_5', name: 'Victory Lap x5', desc: 'Beat all levels 5 times', icon: '&#x1F3C1;' },
      { id: 'beat_game_10', name: 'Obsessed', desc: 'Beat all levels 10 times', icon: '&#x1F92F;' },
      { id: 'beat_game_25', name: 'The Grind', desc: 'Beat all levels 25 times', icon: '&#x1F4AA;' },

      // More kill milestones
      { id: 'kills_7500', name: 'One Man Army', desc: 'Kill 7500 enemies total', icon: '&#x1F4A3;' },
      { id: 'kills_10000', name: 'Kill 10K', desc: 'Kill 10000 enemies total', icon: '&#x2620;&#xFE0F;' },
      { id: 'kills_15000', name: 'Apocalypse', desc: 'Kill 15000 enemies total', icon: '&#x1F525;' },
      { id: 'kills_20000', name: 'Realm Purger', desc: 'Kill 20000 enemies total', icon: '&#x2694;&#xFE0F;' },
      { id: 'kills_25000', name: 'Quarter Million', desc: 'Kill 25000 enemies total', icon: '&#x1F480;' },
      { id: 'kills_50000', name: 'FIFTY THOUSAND', desc: 'Kill 50000 enemies — you monster!', icon: '&#x1F608;' },

      // More sword mastery
      { id: 'sword_500', name: 'Blade Dancer', desc: 'Get 500 sword kills', icon: '&#x2694;&#xFE0F;' },
      { id: 'sword_1000', name: 'Sword Saint', desc: 'Get 1000 sword kills', icon: '&#x1F5E1;&#xFE0F;' },
      { id: 'sword_2500', name: 'Sword Transcended', desc: 'Get 2500 sword kills', icon: '&#x2694;&#xFE0F;' },

      // More headshot mastery
      { id: 'headshot_500', name: 'Headhunter', desc: 'Get 500 headshots', icon: '&#x1F3AF;' },
      { id: 'headshot_1000', name: 'Perfect Aim', desc: 'Get 1000 headshots', icon: '&#x1F52D;' },

      // More boss mastery
      { id: 'boss_75', name: 'Boss Genocide', desc: 'Defeat 75 bosses', icon: '&#x1F9B9;' },
      { id: 'boss_100', name: 'Century Slayer', desc: 'Defeat 100 bosses', icon: '&#x1F451;' },
      { id: 'boss_no_damage', name: 'Perfect Boss', desc: 'Beat a boss without taking damage', icon: '&#x1F31F;' },
      { id: 'boss_sword_only', name: 'Honorable Duel', desc: 'Beat a boss using only the sword', icon: '&#x2694;&#xFE0F;' },
      { id: 'boss_under_30s', name: 'Speed Kill', desc: 'Beat a boss in under 30 seconds', icon: '&#x26A1;' },

      // More shield mastery
      { id: 'shield_100', name: 'Fortress', desc: 'Block 100 attacks with your shield', icon: '&#x1F6E1;&#xFE0F;' },
      { id: 'shield_250', name: 'Castle Wall', desc: 'Block 250 attacks', icon: '&#x1F3F0;' },
      { id: 'shield_500', name: 'Unbreakable', desc: 'Block 500 attacks', icon: '&#x1F6E1;&#xFE0F;' },
      { id: 'shield_save', name: 'Saved!', desc: 'Block a hit that would have killed you', icon: '&#x1F4AA;' },

      // More chests
      { id: 'chests_25', name: 'Chest Addict', desc: 'Open 25 chests', icon: '&#x1F4E6;' },
      { id: 'chests_50', name: 'Treasure Goblin', desc: 'Open 50 chests', icon: '&#x1F9CC;' },
      { id: 'chests_100', name: 'Loot Lord', desc: 'Open 100 chests', icon: '&#x1F451;' },
      { id: 'chests_250', name: 'Chest Obsessed', desc: 'Open 250 chests', icon: '&#x1F4E6;' },

      // More potions
      { id: 'potion_50', name: 'Potion Brewer', desc: 'Use 50 potions total', icon: '&#x1F9EA;' },
      { id: 'potion_100', name: 'Witch Doctor', desc: 'Use 100 potions total', icon: '&#x2697;&#xFE0F;' },
      { id: 'potion_250', name: 'Potion Ocean', desc: 'Use 250 potions total', icon: '&#x1F30A;' },

      // More survival
      { id: 'survive_10', name: 'Survival Veteran', desc: 'Beat survival mode 10 times', icon: '&#x1F3C5;' },
      { id: 'survive_25', name: 'Survival Legend', desc: 'Beat survival mode 25 times', icon: '&#x1F3C6;' },
      { id: 'survive_full_hp', name: 'Not a Scratch', desc: 'Beat survival with full HP', icon: '&#x1F49A;' },
      { id: 'survive_under_10hp', name: 'Barely Alive', desc: 'Beat survival with under 10 HP', icon: '&#x1F480;' },

      // More speed runs
      { id: 'speed_run_45', name: 'Quick Draw', desc: 'Beat a level in under 45 seconds', icon: '&#x23F1;&#xFE0F;' },
      { id: 'speed_run_all_90', name: 'Speed Runner Pro', desc: 'Beat every level in under 90 seconds', icon: '&#x1F3CE;&#xFE0F;' },

      // More weapon-specific kills
      { id: 'shotgun_kills_50', name: 'Shotgun Surgeon', desc: 'Get 50 kills with the shotgun', icon: '&#x1F52B;' },
      { id: 'shotgun_kills_100', name: 'Shotgun Legend', desc: 'Get 100 kills with the shotgun', icon: '&#x1F52B;' },
      { id: 'rocket_kills_50', name: 'Rocket Scientist', desc: 'Get 50 kills with the rocket launcher', icon: '&#x1F680;' },
      { id: 'rocket_kills_100', name: 'Nuke Knight', desc: 'Get 100 kills with the rocket launcher', icon: '&#x2622;&#xFE0F;' },
      { id: 'laser_kills_50', name: 'Laser Show', desc: 'Get 50 kills with the laser', icon: '&#x1F4A0;' },
      { id: 'laser_kills_100', name: 'Laser God', desc: 'Get 100 kills with the laser', icon: '&#x1F4A0;' },
      { id: 'minigun_kills_50', name: 'Lead Rain', desc: 'Get 50 kills with the minigun', icon: '&#x2699;&#xFE0F;' },
      { id: 'minigun_kills_100', name: 'Minigun Maniac', desc: 'Get 100 kills with the minigun', icon: '&#x2699;&#xFE0F;' },
      { id: 'crossbow_kills_50', name: 'Robin Hood', desc: 'Get 50 kills with the crossbow', icon: '&#x1F3F9;' },
      { id: 'crossbow_kills_100', name: 'Legolas', desc: 'Get 100 kills with the crossbow', icon: '&#x1F3F9;' },
      { id: 'flamethrower_kills_50', name: 'Fire Starter', desc: 'Get 50 kills with the flamethrower', icon: '&#x1F525;' },
      { id: 'flamethrower_kills_100', name: 'Hellfire', desc: 'Get 100 kills with the flamethrower', icon: '&#x1F525;' },

      // Element-specific kills
      { id: 'fire_kills_100', name: 'Flame Lord', desc: 'Get 100 kills with fire element', icon: '&#x1F525;' },
      { id: 'fire_kills_500', name: 'Inferno King', desc: 'Get 500 kills with fire element', icon: '&#x1F525;' },
      { id: 'ice_kills_100', name: 'Frost Lord', desc: 'Get 100 kills with ice element', icon: '&#x2744;&#xFE0F;' },
      { id: 'ice_kills_500', name: 'Blizzard King', desc: 'Get 500 kills with ice element', icon: '&#x2744;&#xFE0F;' },
      { id: 'lightning_kills_100', name: 'Thunder Lord', desc: 'Get 100 kills with lightning element', icon: '&#x26A1;' },
      { id: 'lightning_kills_500', name: 'Storm King', desc: 'Get 500 kills with lightning element', icon: '&#x26A1;' },

      // Pet achievements
      { id: 'pet_kills_10', name: 'Good Pet!', desc: 'Your pet has killed 10 enemies', icon: '&#x1F43E;' },
      { id: 'pet_kills_25', name: 'Trained Fighter', desc: 'Your pet has killed 25 enemies', icon: '&#x1F43A;' },
      { id: 'pet_kills_50', name: 'Battle Pet', desc: 'Your pet has killed 50 enemies', icon: '&#x1F409;' },
      { id: 'pet_kills_100', name: 'Pet of Doom', desc: 'Your pet has killed 100 enemies', icon: '&#x1F432;' },
      { id: 'use_wolf', name: 'Wolf Pack', desc: 'Use the Wolf Pup pet', icon: '&#x1F43A;' },
      { id: 'use_dragon', name: 'Dragon Rider', desc: 'Use the Baby Dragon pet', icon: '&#x1F409;' },
      { id: 'use_fairy', name: 'Fairy Friend', desc: 'Use the Healing Fairy pet', icon: '&#x1F9DA;' },
      { id: 'use_ghost', name: 'Ghost Whisperer', desc: 'Use the Ghost Buddy pet', icon: '&#x1F47B;' },
      { id: 'use_phoenix', name: 'Phoenix Bond', desc: 'Use the Baby Phoenix pet', icon: '&#x1F426;&#x200D;&#x1F525;' },
      { id: 'use_golem', name: 'Rock Solid', desc: 'Use the Mini Golem pet', icon: '&#x1FAA8;' },
      { id: 'use_cat', name: 'Cat Person', desc: 'Use the Shadow Cat pet', icon: '&#x1F408;&#x200D;&#x2B1B;' },

      // Level-specific no-damage challenges
      { id: 'no_damage_castle', name: 'Perfect Castle', desc: 'Beat the Castle without taking damage', icon: '&#x1F3F0;' },
      { id: 'no_damage_forest', name: 'Perfect Forest', desc: 'Beat the Forest without taking damage', icon: '&#x1F332;' },
      { id: 'no_damage_sky', name: 'Perfect Sky', desc: 'Beat the Sky Battle without taking damage', icon: '&#x2601;&#xFE0F;' },
      { id: 'no_damage_lava', name: 'Perfect Lava', desc: 'Beat the Lava Fortress without damage', icon: '&#x1F30B;' },
      { id: 'no_damage_ice', name: 'Perfect Ice', desc: 'Beat the Frozen Depths without damage', icon: '&#x2744;&#xFE0F;' },
      { id: 'no_damage_shadow', name: 'Perfect Shadow', desc: 'Beat the Shadow Realm without damage', icon: '&#x1F311;' },
      { id: 'no_damage_storm', name: 'Perfect Storm', desc: 'Beat the Storm Peaks without damage', icon: '&#x26A1;' },
      { id: 'no_damage_swamp', name: 'Perfect Swamp', desc: 'Beat the Poison Swamp without damage', icon: '&#x1F40D;' },
      { id: 'no_damage_crystal', name: 'Perfect Crystal', desc: 'Beat the Crystal Caverns without damage', icon: '&#x1F48E;' },
      { id: 'no_damage_void', name: 'Perfect Void', desc: 'Beat The Void without damage', icon: '&#x1F573;&#xFE0F;' },
      { id: 'no_damage_all', name: 'FLAWLESS', desc: 'Beat every level without taking damage', icon: '&#x1F31F;' },

      // Kill streaks
      { id: 'kill_streak_25', name: 'MASSACRE', desc: 'Kill 25 enemies in 30 seconds', icon: '&#x1F4A2;' },
      { id: 'kill_streak_30', name: 'EXTINCTION', desc: 'Kill 30 enemies in 30 seconds', icon: '&#x1F571;&#xFE0F;' },
      { id: 'double_kill', name: 'Double Kill', desc: 'Kill 2 enemies within 1 second', icon: '&#x1F4A5;' },
      { id: 'triple_kill', name: 'Triple Kill', desc: 'Kill 3 enemies within 2 seconds', icon: '&#x1F4A5;' },
      { id: 'mega_kill', name: 'MEGA KILL', desc: 'Kill 5 enemies within 3 seconds', icon: '&#x1F4A2;' },

      // Fun / secret achievements
      { id: 'spin_around', name: 'Dizzy Knight', desc: 'Spin around in circles 10 times', icon: '&#x1F4AB;' },
      { id: 'stand_still', name: 'Meditation', desc: 'Stand completely still for 60 seconds', icon: '&#x1F9D8;' },
      { id: 'jump_and_spin', name: 'Helicopter', desc: 'Jump and spin at the same time', icon: '&#x1FA81;' },
      { id: 'play_1_min', name: 'Just Started', desc: 'Play for 1 minute', icon: '&#x23F0;' },
      { id: 'play_5_min', name: 'Getting Comfy', desc: 'Play for 5 minutes', icon: '&#x23F0;' },
      { id: 'play_10_min', name: 'Settled In', desc: 'Play for 10 minutes', icon: '&#x23F0;' },
      { id: 'play_midnight', name: 'Night Owl', desc: 'Play at midnight', icon: '&#x1F319;' },
      { id: 'play_morning', name: 'Early Bird', desc: 'Play before 7 AM', icon: '&#x1F305;' },
      { id: 'die_instantly', name: 'Speed Death', desc: 'Die within 5 seconds of starting', icon: '&#x1F480;' },
      { id: 'die_to_boss_1hp', name: 'SO CLOSE', desc: 'Die to a boss that had 1% HP left', icon: '&#x1F62D;' },
      { id: 'open_shop_10', name: 'Window Shopper', desc: 'Open the shop 10 times without buying', icon: '&#x1F440;' },
      { id: 'change_element_50', name: 'Element Switcher', desc: 'Switch elements 50 times', icon: '&#x1F504;' },
      { id: 'change_element_200', name: 'Element Chaos', desc: 'Switch elements 200 times', icon: '&#x1F300;' },

      // Score milestones
      { id: 'score_1000', name: 'Getting Points', desc: 'Reach a score of 1000', icon: '&#x1F4AF;' },
      { id: 'score_5000', name: 'High Scorer', desc: 'Reach a score of 5000', icon: '&#x1F4AF;' },
      { id: 'score_10000', name: 'Score Legend', desc: 'Reach a score of 10000', icon: '&#x1F3C6;' },
      { id: 'score_25000', name: 'Score King', desc: 'Reach a score of 25000', icon: '&#x1F451;' },
      { id: 'score_50000', name: 'Score God', desc: 'Reach a score of 50000', icon: '&#x1F31F;' },
      { id: 'score_100000', name: 'SCORE MASTER', desc: 'Reach a score of 100000!', icon: '&#x1F48E;' },

      // Friend rescue milestones
      { id: 'rescue_10', name: 'True Hero', desc: 'Rescue 10 friends total', icon: '&#x1F9B8;' },
      { id: 'rescue_25', name: 'Knight Savior', desc: 'Rescue 25 friends total', icon: '&#x1F9B8;&#x200D;&#x2642;&#xFE0F;' },
      { id: 'rescue_50', name: 'Rescue Legend', desc: 'Rescue 50 friends total', icon: '&#x1F31F;' },

      // Session achievements
      { id: 'no_death_session', name: 'Deathless', desc: 'Play an entire session without dying', icon: '&#x1F6E1;&#xFE0F;' },
      { id: 'kill_100_session', name: 'Centurion', desc: 'Kill 100 enemies in one session', icon: '&#x2694;&#xFE0F;' },
      { id: 'kill_250_session', name: 'Berserker', desc: 'Kill 250 enemies in one session', icon: '&#x1F608;' },
      { id: 'kill_500_session', name: 'Annihilator', desc: 'Kill 500 enemies in one session', icon: '&#x1F47F;' },
      { id: 'earn_500_coins_session', name: 'Gold Rush', desc: 'Earn 500 coins in one session', icon: '&#x1FA99;' },
      { id: 'earn_1000_coins_session', name: 'Coin Frenzy', desc: 'Earn 1000 coins in one session', icon: '&#x1F4B0;' },

      // More no-damage milestones
      { id: 'no_damage_5', name: 'Untouchable x5', desc: 'Beat 5 levels without taking damage', icon: '&#x1F6E1;&#xFE0F;' },
      { id: 'no_damage_10', name: 'Ghost Knight', desc: 'Beat 10 levels without taking damage', icon: '&#x1F47B;' },

      // Damage dealt milestones
      { id: 'damage_10000', name: 'Pain Dealer', desc: 'Deal 10000 total damage', icon: '&#x1F4A5;' },
      { id: 'damage_50000', name: 'Destruction', desc: 'Deal 50000 total damage', icon: '&#x1F4A2;' },
      { id: 'damage_100000', name: 'Total War', desc: 'Deal 100000 total damage', icon: '&#x2620;&#xFE0F;' },
      { id: 'damage_500000', name: 'Armageddon', desc: 'Deal 500000 total damage', icon: '&#x1F525;' },
      { id: 'damage_1000000', name: 'One Million Damage', desc: 'Deal 1000000 total damage!', icon: '&#x1F4A3;' },

      // Damage taken milestones
      { id: 'damage_taken_10000', name: 'Punching Bag', desc: 'Take 10000 total damage', icon: '&#x1F494;' },
      { id: 'damage_taken_50000', name: 'Damage Sponge', desc: 'Take 50000 total damage', icon: '&#x1F9F1;' },
      { id: 'damage_taken_100000', name: 'Walking Tank', desc: 'Take 100000 total damage', icon: '&#x1F6E1;&#xFE0F;' },

      // Heal milestones
      { id: 'heal_1000', name: 'Healer', desc: 'Heal 1000 HP total', icon: '&#x1F49A;' },
      { id: 'heal_5000', name: 'Medic Knight', desc: 'Heal 5000 HP total', icon: '&#x2695;&#xFE0F;' },
      { id: 'heal_10000', name: 'Restoration Master', desc: 'Heal 10000 HP total', icon: '&#x1F49A;' },

      // Misc rare achievements
      { id: 'own_everything', name: 'Own It All', desc: 'Buy every item in the shop', icon: '&#x1F3EA;' },
      { id: 'max_damage_upgrade', name: 'Max Power', desc: 'Max out the damage upgrade', icon: '&#x1F4AA;' },
      { id: 'max_health_upgrade', name: 'Max Life', desc: 'Max out the health upgrade', icon: '&#x1F49A;' },
      { id: 'max_speed_upgrade', name: 'Max Speed', desc: 'Max out the speed upgrade', icon: '&#x1F3C3;' },
      { id: 'use_all_weapons_level', name: 'Weapon Swap', desc: 'Use every weapon in one level', icon: '&#x1F52B;' },
      { id: 'survive_1hp', name: 'Clutch Survival', desc: 'Beat survival with exactly 1 HP', icon: '&#x1F494;' },
      { id: 'kill_boss_melee', name: 'Sword Boss', desc: 'Kill any boss with only melee attacks', icon: '&#x2694;&#xFE0F;' },
      { id: 'play_every_mode', name: 'Mode Master', desc: 'Play Quest, Survival, Practice, and Party', icon: '&#x1F3AE;' },
      { id: 'first_purchase', name: 'Cha-Ching!', desc: 'Make your very first purchase', icon: '&#x1F4B0;' },
      { id: 'visit_shop', name: 'Just Browsing', desc: 'Open the shop for the first time', icon: '&#x1F6D2;' },
      { id: 'view_achievements', name: 'Achievement Hunter', desc: 'Open the achievements screen', icon: '&#x1F50D;' },
      { id: 'first_jump', name: 'First Leap', desc: 'Jump for the first time', icon: '&#x1F998;' },
      { id: 'first_sprint', name: 'First Sprint', desc: 'Sprint for the first time', icon: '&#x1F3C3;' },
      { id: 'first_shield', name: 'First Block', desc: 'Use your shield for the first time', icon: '&#x1F6E1;&#xFE0F;' },
      { id: 'pick_username', name: 'Identity', desc: 'Set a custom username', icon: '&#x1F3F7;&#xFE0F;' },

      // Practice mode
      { id: 'practice_start', name: 'Target Practice', desc: 'Enter practice mode', icon: '&#x1F3AF;' },
      { id: 'practice_bullseye_5', name: 'Bullseye x5', desc: 'Hit 5 bullseyes in practice', icon: '&#x1F3AF;' },
      { id: 'practice_bullseye_25', name: 'Bullseye Master', desc: 'Hit 25 bullseyes in practice', icon: '&#x1F3AF;' },
      { id: 'practice_bullseye_100', name: 'Never Miss the Center', desc: 'Hit 100 bullseyes in practice', icon: '&#x1F3AF;' },
      { id: 'practice_accuracy_80', name: 'Sharp Shooter', desc: 'Get 80% accuracy in practice (10+ shots)', icon: '&#x1F52B;' },
      { id: 'practice_accuracy_100', name: 'Perfect Aim', desc: 'Get 100% accuracy in practice (10+ shots)', icon: '&#x2B50;' },
      { id: 'practice_50_shots', name: 'Range Day', desc: 'Fire 50 shots in one practice session', icon: '&#x1F4A5;' },
      { id: 'practice_100_shots', name: 'Ammo Dump', desc: 'Fire 100 shots in one practice session', icon: '&#x1F4A3;' },

      // Emote fun
      { id: 'emote_5_session', name: 'Dance Party', desc: 'Use 5 different emotes in one session', icon: '&#x1F483;' },
      { id: 'emote_10', name: 'Emote Fan', desc: 'Use emotes 10 times total', icon: '&#x1F57A;' },
      { id: 'emote_50', name: 'Emote Addict', desc: 'Use emotes 50 times total', icon: '&#x1F483;' },
      { id: 'emote_100', name: 'Dance Machine', desc: 'Use emotes 100 times total', icon: '&#x1F3B6;' },
      { id: 'emote_500', name: 'Dance Legend', desc: 'Use emotes 500 times total', icon: '&#x1F451;' },
      { id: 'buy_emote', name: 'First Moves', desc: 'Buy your first emote from the shop', icon: '&#x1F57A;' },
      { id: 'buy_all_emotes', name: 'Full Repertoire', desc: 'Buy every emote in the shop', icon: '&#x1F3AD;' },

      // Weird / funny achievements
      { id: 'shoot_ceiling', name: 'Aiming Practice?', desc: 'Shoot straight up 10 times', icon: '&#x2B06;&#xFE0F;' },
      { id: 'walk_backwards', name: 'Moonwalker', desc: 'Walk backwards for 30 seconds', icon: '&#x1F31C;' },
      { id: 'spin_100', name: 'Tornado Knight', desc: 'Spin around 100 times total', icon: '&#x1F300;' },
      { id: 'jump_off_map', name: 'Leap of Faith', desc: 'Jump off the edge of the map', icon: '&#x1F3A2;' },
      { id: 'stand_still_5min', name: 'AFK Knight', desc: 'Stand still for 5 minutes', icon: '&#x1F634;' },
      { id: 'sprint_into_wall', name: 'Wall Runner', desc: 'Sprint into a wall 20 times', icon: '&#x1F9F1;' },
      { id: 'die_5_seconds', name: 'Any% Speedrun Death', desc: 'Die within 5 seconds 3 times', icon: '&#x1F4A8;' },
      { id: 'switch_element_rapid', name: 'Can\'t Decide', desc: 'Switch elements 10 times in 10 seconds', icon: '&#x1F500;' },

      // Dedication streaks
      { id: 'play_2_days', name: 'Coming Back', desc: 'Play on 2 different days', icon: '&#x1F4C5;' },
      { id: 'play_5_days', name: 'Loyal Knight', desc: 'Play on 5 different days', icon: '&#x1F4C5;' },
      { id: 'play_10_days', name: 'Devoted Knight', desc: 'Play on 10 different days', icon: '&#x1F4C6;' },
      { id: 'play_30_days', name: 'Monthly Knight', desc: 'Play on 30 different days', icon: '&#x1F4C6;' },
      { id: 'play_100_days', name: '100 Days of Quest', desc: 'Play on 100 different days!', icon: '&#x1F3C5;' },
      { id: 'play_365_days', name: 'Year of the Knight', desc: 'Play on 365 different days!!', icon: '&#x1F389;' },

      // Multi-kill combos
      { id: 'quad_kill', name: 'Quad Kill', desc: 'Kill 4 enemies within 2 seconds', icon: '&#x1F4A2;' },
      { id: 'penta_kill', name: 'PENTA KILL', desc: 'Kill 5 enemies within 3 seconds', icon: '&#x1F525;' },
      { id: 'chain_kill_10', name: 'Chain Reaction', desc: 'Kill 10 enemies without stopping for 5 seconds', icon: '&#x26D3;&#xFE0F;' },
      { id: 'overkill_1000', name: 'MEGA Overkill', desc: 'Deal 1000+ damage in one hit', icon: '&#x1F4A5;' },
      { id: 'overkill_5000', name: 'ULTRA Overkill', desc: 'Deal 5000+ damage in one hit', icon: '&#x2604;&#xFE0F;' },

      // Secret level challenges
      { id: 'beat_castle_sword', name: 'Knight\'s Honor', desc: 'Beat the Castle using only the sword', icon: '&#x2694;&#xFE0F;' },
      { id: 'beat_void_no_potions', name: 'Void Purist', desc: 'Beat The Void without using any potions', icon: '&#x1F573;&#xFE0F;' },
      { id: 'beat_lava_no_shield', name: 'Heat Resistant', desc: 'Beat Lava Fortress without using the shield', icon: '&#x1F30B;' },
      { id: 'beat_ice_fire_only', name: 'Meltdown', desc: 'Beat Frozen Depths using only fire element', icon: '&#x1F525;' },
      { id: 'beat_storm_ice_only', name: 'Frozen Thunder', desc: 'Beat Storm Peaks using only ice element', icon: '&#x2744;&#xFE0F;' },

      // Pet bonding
      { id: 'pet_kills_250', name: 'Pet Warlord', desc: 'Your pets have killed 250 enemies', icon: '&#x1F43E;' },
      { id: 'pet_kills_500', name: 'Pet Army', desc: 'Your pets have killed 500 enemies', icon: '&#x1F43E;' },
      { id: 'pet_kills_1000', name: 'Pet Apocalypse', desc: 'Your pets have killed 1000 enemies', icon: '&#x1F43E;' },
      { id: 'switch_pet_10', name: 'Pet Rotator', desc: 'Switch pets 10 times', icon: '&#x1F504;' },
      { id: 'play_with_all_pets', name: 'Pet Collector', desc: 'Play a level with every pet at least once', icon: '&#x1F3C6;' },

      // Level mastery — beat levels multiple times
      { id: 'beat_castle_5', name: 'Castle Regular', desc: 'Beat the Castle 5 times', icon: '&#x1F3F0;' },
      { id: 'beat_void_5', name: 'Void Veteran', desc: 'Beat The Void 5 times', icon: '&#x1F573;&#xFE0F;' },
      { id: 'beat_void_10', name: 'Void Addict', desc: 'Beat The Void 10 times', icon: '&#x1F30C;' },
      { id: 'beat_all_sword_only', name: 'Sword Legend', desc: 'Beat every level using only the sword', icon: '&#x2694;&#xFE0F;' },
      { id: 'beat_all_no_shield', name: 'No Defense', desc: 'Beat every level without using the shield', icon: '&#x1F4A8;' },

      // Ridiculous milestones
      { id: 'kills_100000', name: 'ONE HUNDRED THOUSAND', desc: 'Kill 100000 enemies — are you okay?!', icon: '&#x1F480;' },
      { id: 'coins_5000000', name: 'BILLIONAIRE', desc: 'Collect 5000000 coins total', icon: '&#x1F4B0;' },
      { id: 'died_2500', name: 'Cat With 2500 Lives', desc: 'Die 2500 times and still come back', icon: '&#x1F408;' },
      { id: 'died_5000', name: 'Eternal Respawner', desc: 'Die 5000 times — death fears YOU', icon: '&#x1F47B;' },
      { id: 'jump_25000', name: 'Left the Atmosphere', desc: 'Jump 25000 times', icon: '&#x1F680;' },
      { id: 'jump_50000', name: 'Reached the Moon', desc: 'Jump 50000 times', icon: '&#x1F315;' },
      { id: 'jump_100000', name: 'Mars Landing', desc: 'Jump 100000 times!!', icon: '&#x1FA90;' },

      // Weapon dedication
      { id: 'sword_5000', name: 'Sword Ascended', desc: 'Get 5000 sword kills', icon: '&#x2694;&#xFE0F;' },
      { id: 'sword_10000', name: 'Sword is Life', desc: 'Get 10000 sword kills', icon: '&#x1F5E1;&#xFE0F;' },
      { id: 'headshot_2500', name: 'Headshot Machine', desc: 'Get 2500 headshots', icon: '&#x1F3AF;' },
      { id: 'headshot_5000', name: 'Headshot God', desc: 'Get 5000 headshots', icon: '&#x1F3AF;' },
      { id: 'shotgun_kills_500', name: 'Shotgun Deity', desc: 'Get 500 kills with the shotgun', icon: '&#x1F52B;' },
      { id: 'rocket_kills_500', name: 'Rocket God', desc: 'Get 500 kills with the rocket launcher', icon: '&#x1F680;' },
      { id: 'minigun_kills_500', name: 'Bullet Hurricane', desc: 'Get 500 kills with the minigun', icon: '&#x1F32A;&#xFE0F;' },

      // Time-of-day fun
      { id: 'play_noon', name: 'High Noon', desc: 'Play at exactly 12:00 PM', icon: '&#x2600;&#xFE0F;' },
      { id: 'play_3am', name: '3 AM Knight', desc: 'Play at 3 AM — go to sleep!', icon: '&#x1F47B;' },
      { id: 'play_friday', name: 'TGIF Knight', desc: 'Play on a Friday', icon: '&#x1F389;' },
      { id: 'play_weekend', name: 'Weekend Warrior', desc: 'Play on both Saturday and Sunday', icon: '&#x1F3D6;&#xFE0F;' },
      { id: 'play_new_year', name: 'New Year Knight', desc: 'Play on January 1st', icon: '&#x1F386;' },
      { id: 'play_halloween', name: 'Spooky Knight', desc: 'Play on October 31st', icon: '&#x1F383;' },
      { id: 'play_christmas', name: 'Christmas Knight', desc: 'Play on December 25th', icon: '&#x1F384;' },

      // Damage taken challenges
      { id: 'tank_500_one_level', name: 'Damage Soak', desc: 'Take 500 damage in one level and still win', icon: '&#x1F6E1;&#xFE0F;' },
      { id: 'tank_1000_one_level', name: 'Meat Shield', desc: 'Take 1000 damage in one level and still win', icon: '&#x1F4AA;' },
      { id: 'survive_1hp_3_times', name: 'Living on the Edge', desc: 'Survive at 1 HP three different times', icon: '&#x1F494;' },
      { id: 'heal_full_3_times', name: 'Yo-Yo Health', desc: 'Go from low HP to full HP 3 times in one level', icon: '&#x1FA79;' },

      // Boss speedruns
      { id: 'boss_under_15s', name: 'Instant Boss Kill', desc: 'Beat a boss in under 15 seconds', icon: '&#x23F1;&#xFE0F;' },
      { id: 'boss_under_10s', name: 'Boss Evaporator', desc: 'Beat a boss in under 10 seconds', icon: '&#x26A1;' },
      { id: 'boss_200', name: 'Boss Farmer', desc: 'Defeat 200 bosses', icon: '&#x1F451;' },
      { id: 'boss_500', name: 'Boss Extinction Event', desc: 'Defeat 500 bosses', icon: '&#x1F480;' },

      // Score madness
      { id: 'score_250000', name: 'Quarter Million', desc: 'Reach a score of 250000', icon: '&#x1F4AF;' },
      { id: 'score_500000', name: 'Half Million', desc: 'Reach a score of 500000', icon: '&#x1F31F;' },
      { id: 'score_1000000', name: 'MILLION POINTS', desc: 'Reach a score of 1000000!!', icon: '&#x1F3C6;' },

      // Walking insanity
      { id: 'walk_100km', name: 'Cross Country', desc: 'Walk 100000 meters total', icon: '&#x1F97E;' },
      { id: 'walk_500km', name: 'Continental Trek', desc: 'Walk 500000 meters total', icon: '&#x1F30D;' },
      { id: 'walk_marathon', name: 'Marathon Complete', desc: 'Walk 42195 meters (a real marathon!)', icon: '&#x1F3C5;' },

      // Rebirth mastery
      { id: 'rebirth_coin_multi_2x', name: 'Double Money', desc: 'Reach 2x coin multiplier from rebirths', icon: '&#x1F4B0;' },
      { id: 'rebirth_coin_multi_3x', name: 'Triple Money', desc: 'Reach 3x coin multiplier from rebirths', icon: '&#x1F4B0;' },
      { id: 'rebirth_under_1hr', name: 'Speed Rebirth', desc: 'Rebirth in under 1 hour of playtime', icon: '&#x23F1;&#xFE0F;' },

      // First time doing stuff
      { id: 'first_fire', name: 'Playing with Fire', desc: 'Shoot a fire bullet for the first time', icon: '&#x1F525;' },
      { id: 'first_ice', name: 'Cold Shot', desc: 'Shoot an ice bullet for the first time', icon: '&#x2744;&#xFE0F;' },
      { id: 'first_lightning', name: 'Shocking!', desc: 'Shoot a lightning bullet for the first time', icon: '&#x26A1;' },
      { id: 'first_pet', name: 'Pet Owner', desc: 'Equip a pet for the first time', icon: '&#x1F436;' },
      { id: 'first_potion', name: 'Bottoms Up', desc: 'Use a potion for the first time', icon: '&#x1F9EA;' },
      { id: 'first_pvp_kill', name: 'PvP Blood', desc: 'Get your first PvP kill', icon: '&#x2694;&#xFE0F;' },
      { id: 'first_coop', name: 'Better Together', desc: 'Start your first co-op game', icon: '&#x1F91D;' },
      { id: 'first_emote', name: 'Express Yourself', desc: 'Use an emote for the first time', icon: '&#x1F57A;' },

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
