const SUPABASE_URL = 'https://lijeewobwwiupncjfueq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpamVld29id3dpdXBuY2pmdWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDkwNTQsImV4cCI6MjA4MDI4NTA1NH0.ttSbkrtcHDfu2YWTfDVLGBUOL6gPC97gHoZua_tqQeQ';

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
        { id: 'crossbow', name: 'Crossbow', desc: 'Slow but devastating! 3x headshot damage.', cost: 200, icon: '<div style="font-size:36px">&#x1F3F9;</div>' },
        { id: 'flamethrower', name: 'Flamethrower', desc: 'Spray fire in a cone! Burns enemies.', cost: 450, icon: '<div style="font-size:36px">&#x1F525;</div>' },
      ],
      powers: [
        { id: 'doublejump', name: 'Double Jump', desc: 'Jump again in mid-air!', cost: 150, icon: '<div style="font-size:36px">&#x1F998;</div>' },
        { id: 'invisible', name: 'Invisibility Cloak', desc: 'Enemies cant see you for 10s. Press V to activate.', cost: 300, icon: '<div style="font-size:36px">&#x1F47B;</div>' },
        { id: 'magnet', name: 'Coin Magnet', desc: 'Coins fly to you from further away!', cost: 100, icon: '<div style="font-size:36px">&#x1F9F2;</div>' },
        { id: 'firetrail', name: 'Fire Trail', desc: 'Leave fire behind you that burns enemies!', cost: 250, icon: '<div style="font-size:36px">&#x1F525;</div>' },
        { id: 'vampiric', name: 'Vampiric Strike', desc: 'Sword hits heal you for 10 HP!', cost: 200, icon: '<div style="font-size:36px">&#x1F9DB;</div>' },
        { id: 'explosiveammo', name: 'Explosive Ammo', desc: 'Bullets explode on impact!', cost: 300, icon: '<div style="font-size:36px">&#x1F4A3;</div>' },
        { id: 'dashattack', name: 'Dash Attack', desc: 'Double-tap SHIFT to dash forward and damage enemies!', cost: 200, icon: '<div style="font-size:36px">&#x1F4A8;</div>' },
        { id: 'thorns', name: 'Thorns Armor', desc: 'Enemies take 15 damage when they hit you!', cost: 175, icon: '<div style="font-size:36px">&#x1F335;</div>' },
        { id: 'lifesteal', name: 'Life Steal Bullets', desc: 'Gun shots heal you for 5 HP on hit!', cost: 350, icon: '<div style="font-size:36px">&#x1F489;</div>' },
        { id: 'frostwave', name: 'Frost Wave', desc: 'Press G to freeze all nearby enemies for 3s! 30s cooldown.', cost: 400, icon: '<div style="font-size:36px">&#x2744;&#xFE0F;</div>' },
      ],
      pets: [
        { id: 'pet_wolf', name: 'Wolf Pup', desc: 'Attacks nearby enemies for you!', cost: 250, icon: '<div style="font-size:36px">&#x1F43A;</div>' },
        { id: 'pet_dragon', name: 'Baby Dragon', desc: 'Flies around and breathes fire!', cost: 500, icon: '<div style="font-size:36px">&#x1F409;</div>' },
        { id: 'pet_fairy', name: 'Healing Fairy', desc: 'Slowly heals you over time!', cost: 200, icon: '<div style="font-size:36px">&#x1F9DA;</div>' },
        { id: 'pet_ghost', name: 'Ghost Buddy', desc: 'Scares enemies, making them run away!', cost: 300, icon: '<div style="font-size:36px">&#x1F47B;</div>' },
        { id: 'pet_phoenix', name: 'Baby Phoenix', desc: 'Revives you once per level when you die!', cost: 750, icon: '<div style="font-size:36px">&#x1F426;&#x200D;&#x1F525;</div>' },
        { id: 'pet_golem', name: 'Mini Golem', desc: 'Tanks hits for you! Takes damage instead.', cost: 600, icon: '<div style="font-size:36px">&#x1FAA8;</div>' },
        { id: 'pet_cat', name: 'Shadow Cat', desc: 'Finds hidden coins and loot near you!', cost: 350, icon: '<div style="font-size:36px">&#x1F408;&#x200D;&#x2B1B;</div>' },
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
        { id: 'regen', name: 'Health Regen', desc: 'Slowly regenerate 2 HP per second!', cost: 300, icon: '<div style="font-size:36px">&#x1F49A;</div>' },
        { id: 'critchance', name: 'Critical Hit', desc: '20% chance to deal double damage!', cost: 250, icon: '<div style="font-size:36px">&#x1F4A5;</div>' },
        { id: 'armor1', name: 'Armor I', desc: 'Take 15% less damage', cost: 100, icon: '<div style="font-size:36px">&#x1F6E1;&#xFE0F;</div>' },
        { id: 'armor2', name: 'Armor II', desc: 'Take 30% less damage!', cost: 300, icon: '<div style="font-size:36px">&#x1F9CA;</div>' },
        { id: 'xpboost', name: 'XP Boost', desc: '+50% score from all kills!', cost: 200, icon: '<div style="font-size:36px">&#x2B50;</div>' },
        { id: 'luckycharm', name: 'Lucky Charm', desc: 'Enemies drop 2x more coins!', cost: 350, icon: '<div style="font-size:36px">&#x1F340;</div>' },
      ],
      potions: [
        { id: 'potion', name: 'Health Potion', desc: 'Start with +50 HP', cost: 20, consumable: true, icon: '<div style="font-size:36px">&#x1F9EA;</div>' },
        { id: 'jump', name: 'Super Jump', desc: '+50% jump force', cost: 30, consumable: true, icon: '<div style="font-size:36px">&#x1F680;</div>' },
        { id: 'megapotion', name: 'Mega Potion', desc: 'Start with +100 HP!', cost: 50, consumable: true, icon: '<div style="font-size:36px">&#x1F48A;</div>' },
        { id: 'ammopack', name: 'Ammo Pack', desc: 'Double ammo this round!', cost: 40, consumable: true, icon: '<div style="font-size:36px">&#x1F4E6;&#x1F525;</div>' },
        { id: 'rage', name: 'Rage Potion', desc: '+75% damage for 30 seconds!', cost: 60, consumable: true, icon: '<div style="font-size:36px">&#x1F621;</div>' },
        { id: 'shield_potion', name: 'Shield Potion', desc: 'Absorbs next 50 damage!', cost: 35, consumable: true, icon: '<div style="font-size:36px">&#x1F6E1;&#xFE0F;</div>' },
        { id: 'speed_potion', name: 'Speed Potion', desc: '+60% speed for 20 seconds!', cost: 25, consumable: true, icon: '<div style="font-size:36px">&#x26A1;</div>' },
        { id: 'giant_potion', name: 'Giant Potion', desc: 'Become 2x bigger with 2x damage for 15s!', cost: 75, consumable: true, icon: '<div style="font-size:36px">&#x1F9CC;</div>' },
        { id: 'invis_potion', name: 'Invisibility Potion', desc: 'Enemies cant see you for 15 seconds!', cost: 45, consumable: true, icon: '<div style="font-size:36px">&#x1F440;</div>' },
      ],
      emotes: [
        { id: 'emote_robot', name: 'Robot', desc: 'Do the robot! Jerky mechanical moves.', cost: 75, icon: '<div style="font-size:36px">&#x1F916;</div>' },
        { id: 'emote_chicken', name: 'Chicken Dance', desc: 'Bawk bawk! Flap those wings!', cost: 50, icon: '<div style="font-size:36px">&#x1F414;</div>' },
        { id: 'emote_disco', name: 'Disco Fever', desc: 'Saturday night fever moves!', cost: 100, icon: '<div style="font-size:36px">&#x1F57A;</div>' },
        { id: 'emote_twerk', name: 'Twerk', desc: 'Shake it! Shake it!', cost: 100, icon: '<div style="font-size:36px">&#x1F351;</div>' },
        { id: 'emote_salute', name: 'Salute', desc: 'Show respect to your fellow knights!', cost: 50, icon: '<div style="font-size:36px">&#x1FAE1;</div>' },
        { id: 'emote_backflip', name: 'Backflip', desc: 'Epic backflip! Show off your skills!', cost: 200, icon: '<div style="font-size:36px">&#x1F938;</div>' },
        { id: 'emote_celebrate', name: 'Celebrate', desc: 'Jump for joy! Party time!', cost: 75, icon: '<div style="font-size:36px">&#x1F389;</div>' },
        { id: 'emote_cry', name: 'Cry', desc: 'When you get defeated... sad times.', cost: 50, icon: '<div style="font-size:36px">&#x1F62D;</div>' },
        { id: 'emote_laugh', name: 'Laugh', desc: 'Ha ha ha! Too funny!', cost: 50, icon: '<div style="font-size:36px">&#x1F923;</div>' },
        { id: 'emote_sit', name: 'Sit Down', desc: 'Take a rest, you earned it!', cost: 25, icon: '<div style="font-size:36px">&#x1FA91;</div>' },
        { id: 'emote_pushup', name: 'Push-ups', desc: 'Get those gains! Training time!', cost: 75, icon: '<div style="font-size:36px">&#x1F4AA;</div>' },
        { id: 'emote_tornado', name: 'Tornado', desc: 'Spin like a crazy tornado!', cost: 150, icon: '<div style="font-size:36px">&#x1F32A;</div>' },
        { id: 'emote_zombie', name: 'Zombie Walk', desc: 'Rise from the dead! Braaains!', cost: 100, icon: '<div style="font-size:36px">&#x1F9DF;</div>' },
        { id: 'emote_ninja', name: 'Ninja Pose', desc: 'Strike a cool ninja stance!', cost: 125, icon: '<div style="font-size:36px">&#x1F977;</div>' },
        { id: 'emote_worm', name: 'The Worm', desc: 'Hit the floor and worm it out!', cost: 200, icon: '<div style="font-size:36px">&#x1FAB1;</div>' },
        { id: 'emote_moonwalk', name: 'Moonwalk', desc: 'Smooth criminal! Slide backwards!', cost: 250, icon: '<div style="font-size:36px">&#x1F311;</div>' },
        { id: 'emote_breakdance', name: 'Breakdance', desc: 'Drop and spin on the floor!', cost: 300, icon: '<div style="font-size:36px">&#x1F483;</div>' },
        { id: 'emote_rage', name: 'Rage', desc: 'SO MAD! Shake with anger!', cost: 75, icon: '<div style="font-size:36px">&#x1F621;</div>' },
        { id: 'emote_sleep', name: 'Sleep', desc: 'Zzz... take a quick nap!', cost: 25, icon: '<div style="font-size:36px">&#x1F634;</div>' },
        { id: 'emote_clap', name: 'Clap', desc: 'Give a round of applause!', cost: 50, icon: '<div style="font-size:36px">&#x1F44F;</div>' },
        { id: 'emote_bow', name: 'Bow', desc: 'A noble knight bows gracefully.', cost: 50, icon: '<div style="font-size:36px">&#x1F647;</div>' },
        { id: 'emote_kungfu', name: 'Kung Fu', desc: 'Martial arts kicks and chops!', cost: 175, icon: '<div style="font-size:36px">&#x1F94B;</div>' },
        { id: 'emote_t_pose', name: 'T-Pose', desc: 'Assert dominance. T-POSE!', cost: 100, icon: '<div style="font-size:36px">&#x2708;</div>' },
        { id: 'emote_shake', name: 'Shake It Off', desc: 'Shake shake shake it off!', cost: 75, icon: '<div style="font-size:36px">&#x1F3B6;</div>' },
        { id: 'emote_prayer', name: 'Pray', desc: 'A moment of peace before battle.', cost: 50, icon: '<div style="font-size:36px">&#x1F64F;</div>' },
        { id: 'emote_dj', name: 'DJ Mode', desc: 'Drop the beat! Spin those turntables!', cost: 150, icon: '<div style="font-size:36px">&#x1F3A7;</div>' },
        { id: 'emote_sway', name: 'Sway', desc: 'Smooth gentle swaying to music.', cost: 50, icon: '<div style="font-size:36px">&#x1F3B5;</div>' },
        { id: 'emote_victory', name: 'Victory Dance', desc: 'You WON! Epic victory celebration!', cost: 300, icon: '<div style="font-size:36px">&#x1F3C6;</div>' },
        { id: 'emote_cartwheel', name: 'Cartwheel', desc: 'Flip sideways like a gymnast!', cost: 200, icon: '<div style="font-size:36px">&#x1F938;</div>' },
      ],
      skins: [
        { id: 'skin_gold', name: 'Gold Knight', desc: 'Golden armor', cost: 100, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#ffd700,#aa8800);border-radius:4px;border:2px solid #ffee88;position:relative"><div style="width:20px;height:20px;background:#ffd700;border-radius:50%;margin:-12px auto 0;border:2px solid #ffee88"></div></div>' },
        { id: 'skin_dark', name: 'Dark Knight', desc: 'Shadow armor', cost: 150, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#443366,#221133);border-radius:4px;border:2px solid #665599;position:relative"><div style="width:20px;height:20px;background:#332255;border-radius:50%;margin:-12px auto 0;border:2px solid #665599"></div></div>' },
        { id: 'skin_crystal', name: 'Crystal Knight', desc: 'Crystal armor', cost: 200, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#33eedd,#11aa99);border-radius:4px;border:2px solid #66ffee;position:relative"><div style="width:20px;height:20px;background:#22ccbb;border-radius:50%;margin:-12px auto 0;border:2px solid #66ffee"></div></div>' },
        { id: 'skin_rainbow', name: 'Rainbow Knight', desc: 'Color-shifting armor', cost: 500, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(90deg,red,orange,yellow,green,blue,violet);border-radius:4px;border:2px solid #fff;position:relative"><div style="width:20px;height:20px;background:linear-gradient(90deg,red,blue);border-radius:50%;margin:-12px auto 0;border:2px solid #fff"></div></div>' },
        { id: 'skin_lava', name: 'Lava Knight', desc: 'Glowing red-hot armor!', cost: 350, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#ff4400,#aa2200);border-radius:4px;border:2px solid #ff8844;position:relative"><div style="width:20px;height:20px;background:#ff3300;border-radius:50%;margin:-12px auto 0;border:2px solid #ff8844"></div></div>' },
        { id: 'skin_ice', name: 'Frost Knight', desc: 'Icy blue frozen armor!', cost: 350, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#66bbff,#3388cc);border-radius:4px;border:2px solid #99ddff;position:relative"><div style="width:20px;height:20px;background:#55aaee;border-radius:50%;margin:-12px auto 0;border:2px solid #99ddff"></div></div>' },
        { id: 'skin_shadow', name: 'Shadow Knight', desc: 'Pure darkness with glowing red eyes!', cost: 400, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#111,#000);border-radius:4px;border:2px solid #333;position:relative"><div style="width:20px;height:20px;background:#111;border-radius:50%;margin:-12px auto 0;border:2px solid #ff0000"></div></div>' },
        { id: 'skin_emerald', name: 'Emerald Knight', desc: 'Shining green gemstone armor!', cost: 300, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#22cc55,#118833);border-radius:4px;border:2px solid #44ff77;position:relative"><div style="width:20px;height:20px;background:#22bb44;border-radius:50%;margin:-12px auto 0;border:2px solid #44ff77"></div></div>' },
        { id: 'skin_royal', name: 'Royal Knight', desc: 'Purple and gold royal armor!', cost: 450, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#8833cc,#552288);border-radius:4px;border:2px solid #ffd700;position:relative"><div style="width:20px;height:20px;background:#7722bb;border-radius:50%;margin:-12px auto 0;border:2px solid #ffd700"></div></div>' },
        { id: 'skin_candy', name: 'Candy Knight', desc: 'Sweet pink and white candy armor!', cost: 250, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#ff88cc,#ff44aa);border-radius:4px;border:2px solid #ffaadd;position:relative"><div style="width:20px;height:20px;background:#ff66bb;border-radius:50%;margin:-12px auto 0;border:2px solid #ffaadd"></div></div>' },
        { id: 'skin_galaxy', name: 'Galaxy Knight', desc: 'Stars and nebula cosmic armor! LEGENDARY!', cost: 1000, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(135deg,#0a0020,#4400aa,#ff00ff,#0044ff);border-radius:4px;border:2px solid #cc88ff;position:relative"><div style="width:20px;height:20px;background:linear-gradient(135deg,#220066,#ff44ff);border-radius:50%;margin:-12px auto 0;border:2px solid #cc88ff"></div></div>' },
        { id: 'skin_sunrise', name: 'Sunrise Knight', desc: 'Orange and yellow morning glow!', cost: 200, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#ffaa22,#ff6600);border-radius:4px;border:2px solid #ffcc44;position:relative"><div style="width:20px;height:20px;background:#ff8811;border-radius:50%;margin:-12px auto 0;border:2px solid #ffcc44"></div></div>' },
        { id: 'skin_ocean', name: 'Ocean Knight', desc: 'Deep blue sea armor with wave shimmer!', cost: 250, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#0055aa,#003366);border-radius:4px;border:2px solid #2288cc;position:relative"><div style="width:20px;height:20px;background:#004488;border-radius:50%;margin:-12px auto 0;border:2px solid #2288cc"></div></div>' },
        { id: 'skin_storm', name: 'Storm Knight', desc: 'Electric lightning armor!', cost: 350, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#4444aa,#222266);border-radius:4px;border:2px solid #ffff00;position:relative"><div style="width:20px;height:20px;background:#333388;border-radius:50%;margin:-12px auto 0;border:2px solid #ffff00"></div></div>' },
        { id: 'skin_toxic', name: 'Toxic Knight', desc: 'Neon green radioactive armor!', cost: 300, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#33ff00,#118800);border-radius:4px;border:2px solid #66ff33;position:relative"><div style="width:20px;height:20px;background:#22dd00;border-radius:50%;margin:-12px auto 0;border:2px solid #66ff33"></div></div>' },
        { id: 'skin_blood', name: 'Blood Knight', desc: 'Deep crimson battle-worn armor!', cost: 400, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#990000,#550000);border-radius:4px;border:2px solid #cc2222;position:relative"><div style="width:20px;height:20px;background:#880000;border-radius:50%;margin:-12px auto 0;border:2px solid #cc2222"></div></div>' },
        { id: 'skin_sakura', name: 'Sakura Knight', desc: 'Cherry blossom pink armor!', cost: 250, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#ffbbdd,#ee88bb);border-radius:4px;border:2px solid #ffccee;position:relative"><div style="width:20px;height:20px;background:#ffaacc;border-radius:50%;margin:-12px auto 0;border:2px solid #ffccee"></div></div>' },
        { id: 'skin_void', name: 'Void Knight', desc: 'Dark purple void energy armor!', cost: 500, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#220044,#110022);border-radius:4px;border:2px solid #8800ff;position:relative"><div style="width:20px;height:20px;background:#1a0033;border-radius:50%;margin:-12px auto 0;border:2px solid #8800ff"></div></div>' },
        { id: 'skin_copper', name: 'Copper Knight', desc: 'Shiny copper metallic armor!', cost: 150, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#cc7744,#995533);border-radius:4px;border:2px solid #dd9966;position:relative"><div style="width:20px;height:20px;background:#bb6633;border-radius:50%;margin:-12px auto 0;border:2px solid #dd9966"></div></div>' },
        { id: 'skin_diamond', name: 'Diamond Knight', desc: 'Sparkling white diamond armor! LEGENDARY!', cost: 800, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#eeffff,#aaddee);border-radius:4px;border:2px solid #ffffff;position:relative"><div style="width:20px;height:20px;background:#ddeeff;border-radius:50%;margin:-12px auto 0;border:2px solid #ffffff"></div></div>' },
        { id: 'skin_inferno', name: 'Inferno Knight', desc: 'Burning flames all over! LEGENDARY!', cost: 900, icon: '<div style="width:40px;height:50px;margin:0 auto;background:linear-gradient(#ff2200,#ff8800,#ffcc00);border-radius:4px;border:2px solid #ffee00;position:relative"><div style="width:20px;height:20px;background:linear-gradient(#ff4400,#ffaa00);border-radius:50%;margin:-12px auto 0;border:2px solid #ffee00"></div></div>' },
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
      this._checkGiftInboxForShop();
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

      // Gift button (always show on every item)
      const giftHtml = !item.info
        ? `<button class="buy-btn gift-btn ${!canAfford ? 'cant-afford' : ''}" data-action="gift" data-item-id="${item.id}">&#x1F381; GIFT (${item.cost})</button>`
        : '';

      div.innerHTML = `
        ${item.icon ? `<div class="item-icon">${item.icon}</div>` : ''}
        <div class="item-name">${item.name}</div>
        <div class="item-desc">${item.desc}</div>
        <div class="shop-btn-row">
          ${btnHtml}
          ${giftHtml}
        </div>
      `;

      const btn = div.querySelector('.buy-btn:not(.gift-btn)');
      if (btn) {
        if (btn.dataset.action === 'equip-pet') {
          btn.addEventListener('click', () => this.equipPet(btn.dataset.pet));
        } else if (btn.dataset.action === 'unequip-pet') {
          btn.addEventListener('click', () => this.unequipPet());
        } else if (!owned && canAfford && !item.info) {
          btn.addEventListener('click', () => this.buy(item));
        }
      }

      // Gift button handler
      const giftBtn = div.querySelector('.gift-btn');
      if (giftBtn) {
        giftBtn.addEventListener('click', () => this.gift(item));
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

  gift(item) {
    if (this.coins < item.cost) return;
    this._showGiftPopup(item);
  }

  _showGiftPopup(item) {
    let popup = document.getElementById('gift-popup');
    if (popup) popup.remove();

    popup = document.createElement('div');
    popup.id = 'gift-popup';

    popup.innerHTML = `
      <div class="gift-popup-inner">
        <h2>&#x1F381; Gift ${item.name}</h2>
        <p>Send <strong>${item.name}</strong> to a friend!</p>
        <p style="color:#aaa; font-size:12px;">Cost: ${item.cost} coins</p>
        <input type="text" id="gift-recipient-input" placeholder="Enter their username..."
          style="width:80%; padding:10px; font-size:16px; border:2px solid #ffd700; border-radius:8px; background:#222; color:#fff; text-align:center; margin:12px 0;" />
        <br>
        <button id="gift-send-btn">&#x1F381; SEND GIFT</button>
        <button id="gift-cancel-btn">CANCEL</button>
        <p id="gift-status" style="margin-top: 10px;"></p>
      </div>
    `;
    document.body.appendChild(popup);

    // Focus the input
    document.getElementById('gift-recipient-input').focus();

    document.getElementById('gift-send-btn').addEventListener('click', async () => {
      const recipient = (document.getElementById('gift-recipient-input').value || '').trim();
      if (!recipient) {
        document.getElementById('gift-status').style.color = '#ff4444';
        document.getElementById('gift-status').textContent = 'Enter a username!';
        return;
      }

      const sender = localStorage.getItem('username') || 'Knight';
      if (recipient.toLowerCase() === sender.toLowerCase()) {
        document.getElementById('gift-status').style.color = '#ff4444';
        document.getElementById('gift-status').textContent = "You can't gift yourself!";
        return;
      }

      // Deduct coins
      this.coins -= item.cost;
      localStorage.setItem('totalCoins', this.coins.toString());

      // Send gift to Supabase
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/gifts`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient: recipient.toLowerCase(),
            item_id: item.id,
            item_name: item.name,
            from_username: sender,
          }),
        });
        if (!res.ok) throw new Error('Failed to send');
      } catch (e) {
        // Refund coins if send failed
        this.coins += item.cost;
        localStorage.setItem('totalCoins', this.coins.toString());
        document.getElementById('gift-status').style.color = '#ff4444';
        document.getElementById('gift-status').textContent = 'Failed to send gift! Try again.';
        return;
      }

      // Track gift sends
      const giftsSent = parseInt(localStorage.getItem('giftsSent') || '0') + 1;
      localStorage.setItem('giftsSent', giftsSent.toString());

      // Also send over network if connected
      if (this.onGift) this.onGift(item);

      document.getElementById('gift-status').style.color = '#44ff44';
      document.getElementById('gift-status').textContent = `Sent ${item.name} to ${recipient}!`;
      setTimeout(() => { popup.remove(); this.render(); }, 1500);
    });

    document.getElementById('gift-cancel-btn').addEventListener('click', () => {
      popup.remove();
    });
  }

  async _checkGiftInboxForShop() {
    const username = (localStorage.getItem('username') || 'Knight').toLowerCase();
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/gifts?recipient=eq.${encodeURIComponent(username)}&claimed=eq.false&select=id,item_id,item_name,from_username`,
        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
      );
      if (!res.ok) return;
      const gifts = await res.json();
      if (!gifts || gifts.length === 0) return;

      // Add gifted items to purchases
      const ids = [];
      for (const gift of gifts) {
        this.purchases[gift.item_id] = true;
        ids.push(gift.id);
      }
      localStorage.setItem('shopPurchases', JSON.stringify(this.purchases));

      // Mark as claimed
      await fetch(`${SUPABASE_URL}/rest/v1/gifts?id=in.(${ids.join(',')})`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ claimed: true }),
      });

      this.render();
    } catch (e) {
      // Silently fail — gifts will be picked up next time
    }
  }

  receiveGift(itemId, fromUsername) {
    // For network gifts (multiplayer)
    let item = null;
    for (const category of Object.values(this.items)) {
      item = category.find(i => i.id === itemId);
      if (item) break;
    }
    if (!item) return;

    this.purchases[itemId] = true;
    localStorage.setItem('shopPurchases', JSON.stringify(this.purchases));

    if (this.onGiftReceived) {
      this.onGiftReceived(item, fromUsername);
    }
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

    // Armor upgrades
    if (p.armor2) state.armorReduction = 0.3;
    else if (p.armor1) state.armorReduction = 0.15;

    // Crit chance
    if (p.critchance) state.critChance = 0.2;

    // XP boost
    if (p.xpboost) state.scoreMultiplier = 1.5;

    // Lucky charm (double coin drops)
    if (p.luckycharm) state.coinMultiplier = 2;

    // Health regen
    if (p.regen) state.healthRegen = 2;

    // Thorns
    if (p.thorns) state.thorns = 15;

    // Life steal bullets
    if (p.lifesteal) state.lifeSteal = 5;
  }
}
