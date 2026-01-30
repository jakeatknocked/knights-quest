export class ChatSystem {
  constructor() {
    this.container = document.getElementById('chat-container');
    this.log = document.getElementById('chat-log');
    this.inputRow = document.getElementById('chat-input-row');
    this.input = document.getElementById('chat-input');
    this.isOpen = false;
    this.username = 'Knight';
    this.messages = [];
    this.maxMessages = 50;

    this.setupInput();
  }

  show() {
    if (this.container) this.container.classList.add('active');
  }

  hide() {
    if (this.container) this.container.classList.remove('active');
    this.closeInput();
  }

  setupInput() {
    if (!this.input) return;

    // Prevent game input while typing
    this.input.addEventListener('keydown', (evt) => {
      evt.stopPropagation();

      if (evt.key === 'Enter') {
        const text = this.input.value.trim();
        if (text) {
          this.addMessage(this.username, text, 'player');
        }
        this.closeInput();
      }
      if (evt.key === 'Escape') {
        this.closeInput();
      }
    });

    // Prevent mouse events from going to game
    this.input.addEventListener('mousedown', (evt) => evt.stopPropagation());
  }

  openInput() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.inputRow.style.display = 'block';
    this.input.value = '';
    this.input.focus();
    // Exit pointer lock so user can type
    document.exitPointerLock();
  }

  closeInput() {
    this.isOpen = false;
    this.inputRow.style.display = 'none';
    this.input.blur();
  }

  setUsername(name) {
    this.username = name || 'Knight';
  }

  addMessage(name, text, type) {
    type = type || 'system';
    this.messages.push({ name, text, type });
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
    this.render();
  }

  // Shorthand methods for system events
  systemMsg(text) {
    this.addMessage('System', text, 'system');
  }

  killMsg(playerName, enemyName) {
    this.addMessage(playerName, `killed ${enemyName}`, 'kill');
  }

  bossMsg(text) {
    this.addMessage('Boss', text, 'boss');
  }

  levelMsg(text) {
    this.addMessage('System', text, 'level');
  }

  render() {
    if (!this.log) return;
    this.log.innerHTML = this.messages.map(m => {
      const nameColor = m.type === 'player' ? '#ffd700'
        : m.type === 'emote' ? '#ffaa44'
        : m.type === 'kill' ? '#ff6666'
        : m.type === 'boss' ? '#ff44ff'
        : m.type === 'level' ? '#44ff88'
        : '#888';
      return `<div class="chat-msg ${m.type}"><span class="chat-name" style="color:${nameColor}">${m.name}:</span> ${this.escapeHtml(m.text)}</div>`;
    }).join('');
    this.log.scrollTop = this.log.scrollHeight;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
