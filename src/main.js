import { Game } from './Game.js';
import './style.css';

// Wait for DOM to be ready
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing game...');

  const canvas = document.getElementById('gameCanvas');

  if (!canvas) {
    console.error('Canvas not found!');
    return;
  }

  console.log('Canvas found, creating game...');

  try {
    const game = new Game(canvas);
    console.log('Game created, starting...');
    game.start();
  } catch (error) {
    console.error('Error creating game:', error);
    // Show error on screen so Gavin can see it
    const errDiv = document.createElement('div');
    errDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:red;color:white;padding:30px;font-size:24px;z-index:9999;border-radius:12px;max-width:80%;text-align:center;';
    errDiv.textContent = 'Game crashed: ' + error.message;
    document.body.appendChild(errDiv);
  }
});
