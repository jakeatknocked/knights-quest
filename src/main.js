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
  }
});
