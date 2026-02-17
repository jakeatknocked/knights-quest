import { Game } from './Game.js';
import './style.css';

// Loading screen tips
const tips = [
  'Tip: Use SHIFT to sprint faster!',
  'Tip: Press F to activate your shield!',
  'Tip: Switch elements with 1, 2, 3!',
  'Tip: Right-click to shoot your gun!',
  'Tip: Press E near friends to rescue them!',
  'Tip: Ice slows enemies down!',
  'Tip: Lightning chains between enemies!',
  'Tip: Check out the shop for new gear!',
  'Tip: Each level has different enemies!',
  'Tip: Press B to open the emote wheel!',
  'Tip: Sprint + Jump to cover more distance!',
  'Tip: Rebirth for permanent coin bonuses!',
  'Tip: Collect all achievements for epic trophies!',
];

// Helper to move both bar and bullet together
function setLoadProgress(bar, bullet, pct) {
  if (bar) bar.style.width = pct + '%';
  if (bullet) bullet.style.left = pct + '%';
}

// Wait for DOM to be ready
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing game...');

  const canvas = document.getElementById('gameCanvas');
  const loadingBar = document.getElementById('loading-bar');
  const loadingBullet = document.getElementById('loading-bullet');
  const loadingText = document.getElementById('loading-text');
  const loadingTips = document.getElementById('loading-tips');
  const loadingScreen = document.getElementById('loading-screen');

  // Draw the knight on a temp canvas, then convert to image
  const knightImg = document.getElementById('loading-knight');
  if (knightImg) {
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = 80;
    tmpCanvas.height = 60;
    const ctx = tmpCanvas.getContext('2d');
    // Helmet
    ctx.fillStyle = '#5588cc';
    ctx.beginPath();
    ctx.ellipse(20, 12, 11, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eyes (facing right toward enemy)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(23, 10, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(28, 10, 2, 0, Math.PI * 2);
    ctx.fill();
    // Pupils (looking right)
    ctx.fillStyle = '#111122';
    ctx.beginPath();
    ctx.arc(24.5, 10, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(29.5, 10, 1, 0, Math.PI * 2);
    ctx.fill();
    // Left arm (hanging down at side)
    ctx.fillStyle = '#3a66aa';
    ctx.beginPath();
    ctx.roundRect(4, 28, 6, 18, 3);
    ctx.fill();
    // Body
    ctx.fillStyle = '#5588cc';
    ctx.beginPath();
    ctx.roundRect(8, 24, 24, 20, 3);
    ctx.fill();
    // Right arm
    ctx.fillStyle = '#4477bb';
    ctx.beginPath();
    ctx.roundRect(30, 30, 22, 6, 3);
    ctx.fill();
    // Gun barrel
    ctx.fillStyle = '#bbbbbb';
    ctx.beginPath();
    ctx.roundRect(52, 28, 22, 5, 2);
    ctx.fill();
    // Gun handle
    ctx.fillStyle = '#aa8833';
    ctx.save();
    ctx.translate(56, 33);
    ctx.rotate(0.17);
    ctx.beginPath();
    ctx.roundRect(-2, 0, 5, 9, 2);
    ctx.fill();
    ctx.restore();
    // Legs
    ctx.fillStyle = '#4477bb';
    ctx.beginPath();
    ctx.roundRect(12, 44, 8, 14, 3);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(22, 44, 8, 14, 3);
    ctx.fill();
    // Set as background image on the div
    knightImg.style.backgroundImage = `url(${tmpCanvas.toDataURL('image/png')})`;
    knightImg.style.backgroundSize = 'contain';
    knightImg.style.backgroundRepeat = 'no-repeat';
  }

  // Show a random tip
  if (loadingTips) {
    loadingTips.textContent = tips[Math.floor(Math.random() * tips.length)];
  }

  // Rotate tips every 2.5 seconds
  const tipInterval = setInterval(() => {
    if (loadingTips) {
      loadingTips.textContent = tips[Math.floor(Math.random() * tips.length)];
    }
  }, 2500);

  if (!canvas) {
    console.error('Canvas not found!');
    if (loadingText) loadingText.textContent = 'Error: Canvas not found!';
    return;
  }

  // Loading phases — the bar fills slowly over ~4 seconds
  const phases = [
    { pct: 8,  text: 'Forging your destiny...' },
    { pct: 18, text: 'Summoning the engine...' },
    { pct: 30, text: 'Building the world...' },
    { pct: 42, text: 'Spawning enemies...' },
    { pct: 55, text: 'Polishing armor...' },
    { pct: 65, text: 'Sharpening swords...' },
    { pct: 75, text: 'Lighting the torches...' },
    { pct: 85, text: 'Rallying the knights...' },
  ];

  let phaseIndex = 0;
  const loadStartTime = Date.now();
  const MIN_LOAD_TIME = 4000; // Minimum 4 seconds of loading screen

  // Advance loading bar phases every 500ms (slower fill)
  const phaseInterval = setInterval(() => {
    if (phaseIndex < phases.length) {
      const p = phases[phaseIndex];
      setLoadProgress(loadingBar, loadingBullet, p.pct);
      if (loadingText) loadingText.textContent = p.text;
      phaseIndex++;
    }
  }, 500);

  console.log('Canvas found, creating game...');

  // Use setTimeout to let the loading screen render first
  setTimeout(() => {
    try {
      const game = new Game(canvas);
      console.log('Game created, starting...');
      game.start();

      // Game is ready — but wait for the minimum load time
      const elapsed = Date.now() - loadStartTime;
      const remaining = Math.max(0, MIN_LOAD_TIME - elapsed);

      // Slowly finish the bar over the remaining time
      clearInterval(phaseInterval);
      setLoadProgress(loadingBar, loadingBullet, 90);
      if (loadingText) loadingText.textContent = 'Almost ready...';

      setTimeout(() => {
        setLoadProgress(loadingBar, loadingBullet, 100);
        if (loadingText) loadingText.textContent = 'Ready!';

        // Fade out after bar hits 100%
        setTimeout(() => {
          clearInterval(tipInterval);
          if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
              loadingScreen.style.display = 'none';
            }, 800);
          }
        }, 600);
      }, remaining);

    } catch (error) {
      console.error('Error creating game:', error);
      clearInterval(phaseInterval);
      clearInterval(tipInterval);
      const errDiv = document.createElement('div');
      errDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:red;color:white;padding:30px;font-size:24px;z-index:9999;border-radius:12px;max-width:80%;text-align:center;';
      errDiv.textContent = 'Game crashed: ' + error.message;
      document.body.appendChild(errDiv);
    }
  }, 100);
});
