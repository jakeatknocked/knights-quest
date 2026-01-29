import { Game } from './Game.js';
import './style.css';

// Initialize game when DOM is ready
const canvas = document.getElementById('gameCanvas');
const game = new Game(canvas);

// Start game loop
game.start();
