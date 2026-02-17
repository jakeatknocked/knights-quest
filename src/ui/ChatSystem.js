const SUPABASE_URL = 'https://lijeewobwwiupncjfueq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpamVld29id3dpdXBuY2pmdWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDkwNTQsImV4cCI6MjA4MDI4NTA1NH0.ttSbkrtcHDfu2YWTfDVLGBUOL6gPC97gHoZua_tqQeQ';

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
    this._lastChatId = 0;
    this.stealthMode = false;

    this.setupInput();
  }

  show() {
    if (this.container) this.container.classList.add('active');
    // Auto-start polling when chat is shown
    if (!this._pollingStarted) this.startPolling();
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
          if (this.onPlayerMessage) this.onPlayerMessage(text);
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

    // Send player messages to Supabase so everyone can see them (unless stealth)
    if (type === 'player' && !this.stealthMode) {
      this._sendToSupabase(name, text);
    }
  }

  async _sendToSupabase(username, message) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/chat_messages`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ username, message })
      });
    } catch (e) { /* silent */ }
  }

  startPolling() {
    if (this._pollingStarted) return;
    this._pollingStarted = true;
    // Poll for new messages every 2 seconds
    this._pollInterval = setInterval(() => this._pollMessages(), 2000);
    this._pollMessages();
  }

  async _pollMessages() {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/chat_messages?id=gt.${this._lastChatId}&order=id.asc&limit=20`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        for (const msg of data) {
          // Don't show our own messages again (we already added them locally)
          if (msg.username !== this.username) {
            this.messages.push({ name: msg.username, text: msg.message, type: 'player' });
            if (this.messages.length > this.maxMessages) this.messages.shift();
          }
          this._lastChatId = msg.id;
        }
        this.render();
      }
    } catch (e) { /* silent */ }
  }

  // Get recent messages for admin spy panel
  async getRecentMessages(limit = 50) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/chat_messages?order=id.desc&limit=${limit}`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      return await res.json();
    } catch (e) { return []; }
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
