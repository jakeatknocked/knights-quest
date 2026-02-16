import Peer from 'peerjs';

const PEER_ID_PREFIX = 'KQ-';
const ROOM_CODE_LENGTH = 6;
const PLAYER_STATE_INTERVAL = 1000 / 20; // 20Hz = 50ms

const MESSAGE_TYPES = [
    'ps', // player state (position, rotation, health, element, animation)
    'pj', // projectile spawn
    'sa', // sword attack
    'de', // damage event
    'pd', // player death
    'pr', // respawn
    'es', // enemy states (host broadcasts)
    'ek', // enemy kill
    'ch', // chat message
    'sc', // pvp score update
    'pw', // pvp win
    'hs', // handshake (username, skin, mode)
];

function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

class NetworkManager {
    constructor() {
        this.peer = null;
        this.connection = null;
        this.isHost = false;
        this.connected = false;
        this.roomCode = null;
        this._state = 'disconnected'; // disconnected | connecting | connected

        // Callbacks
        this.onConnected = null;
        this.onDisconnected = null;
        this.onMessage = null; // (type, data) => {}

        // Rate limiting for player state updates
        this._lastSendTime = {};
    }

    /**
     * Host a game session. Creates a PeerJS peer and waits for a client to connect.
     * @param {string} mode - The game mode (passed in handshake)
     * @returns {Promise<string>} Resolves with the room code once the peer is open
     */
    host(mode) {
        return new Promise((resolve, reject) => {
            this.isHost = true;
            this.roomCode = generateRoomCode();
            this._state = 'connecting';

            const peerId = PEER_ID_PREFIX + this.roomCode;

            this.peer = new Peer(peerId);

            this.peer.on('open', () => {
                resolve(this.roomCode);
            });

            this.peer.on('connection', (conn) => {
                this.connection = conn;
                this._setupConnection(conn);
            });

            this.peer.on('error', (err) => {
                if (this._state === 'connecting') {
                    this._state = 'disconnected';
                    reject(err);
                } else {
                    console.error('[NetworkManager] Peer error:', err);
                    this._handleDisconnect();
                }
            });

            this.peer.on('disconnected', () => {
                // PeerJS lost connection to signaling server; not necessarily fatal
                console.warn('[NetworkManager] Lost connection to signaling server');
            });
        });
    }

    /**
     * Join an existing game session by room code.
     * @param {string} code - The 6-letter room code
     * @param {string} mode - The game mode (passed in handshake)
     * @returns {Promise<void>} Resolves once the data connection is open
     */
    join(code, mode) {
        return new Promise((resolve, reject) => {
            this.isHost = false;
            this.roomCode = code.toUpperCase();
            this._state = 'connecting';

            this.peer = new Peer();

            this.peer.on('open', () => {
                const hostId = PEER_ID_PREFIX + this.roomCode;
                const conn = this.peer.connect(hostId, { reliable: true });
                this.connection = conn;

                conn.on('open', () => {
                    this._state = 'connected';
                    this.connected = true;
                    if (this.onConnected) this.onConnected();
                    resolve();
                });

                conn.on('data', (raw) => {
                    this._handleData(raw);
                });

                conn.on('close', () => {
                    this._handleDisconnect();
                });

                conn.on('error', (err) => {
                    console.error('[NetworkManager] Connection error:', err);
                    if (this._state === 'connecting') {
                        this._state = 'disconnected';
                        reject(err);
                    } else {
                        this._handleDisconnect();
                    }
                });
            });

            this.peer.on('error', (err) => {
                if (this._state === 'connecting') {
                    this._state = 'disconnected';
                    reject(err);
                } else {
                    console.error('[NetworkManager] Peer error:', err);
                    this._handleDisconnect();
                }
            });
        });
    }

    /**
     * Send a message to the connected peer.
     * Player state ('ps') messages are rate-limited to 20Hz.
     * @param {string} type - One of the known message types
     * @param {object} data - The payload to send
     */
    send(type, data) {
        if (!this.connection || !this.connected) return;

        // Rate limit player state updates to 20Hz
        if (type === 'ps') {
            const now = performance.now();
            const last = this._lastSendTime['ps'] || 0;
            if (now - last < PLAYER_STATE_INTERVAL) return;
            this._lastSendTime['ps'] = now;
        }

        try {
            this.connection.send({ t: type, d: data });
        } catch (err) {
            console.error('[NetworkManager] Send error:', err);
        }
    }

    /**
     * Disconnect and clean up all PeerJS resources.
     */
    disconnect() {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        this.connected = false;
        this._state = 'disconnected';
        this.roomCode = null;
        this.isHost = false;
        this._lastSendTime = {};
    }

    // ---- Internal helpers ----

    /**
     * Wire up event handlers on an incoming connection (host side).
     */
    _setupConnection(conn) {
        conn.on('open', () => {
            this._state = 'connected';
            this.connected = true;
            if (this.onConnected) this.onConnected();
        });

        conn.on('data', (raw) => {
            this._handleData(raw);
        });

        conn.on('close', () => {
            this._handleDisconnect();
        });

        conn.on('error', (err) => {
            console.error('[NetworkManager] Connection error:', err);
            this._handleDisconnect();
        });
    }

    /**
     * Process an incoming message and fire the onMessage callback.
     */
    _handleData(raw) {
        if (!raw || typeof raw !== 'object') return;
        const { t: type, d: data } = raw;
        if (type && this.onMessage) {
            this.onMessage(type, data);
        }
    }

    /**
     * Handle a peer disconnect / connection close.
     */
    _handleDisconnect() {
        const wasConnected = this.connected;
        this.connected = false;
        this._state = 'disconnected';
        this.connection = null;
        if (wasConnected && this.onDisconnected) {
            this.onDisconnected();
        }
    }
}

export default NetworkManager;
