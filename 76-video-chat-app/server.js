const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// Configuration
const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Create HTTP server for serving static files
const server = http.createServer((req, res) => {
    let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);

    // Get file extension
    const extname = String(path.extname(filePath)).toLowerCase();

    // MIME types
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found\n', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Sorry, there was an error: ' + error.code + '\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store rooms and their clients
const rooms = new Map();

// Helper function to get room
function getRoom(roomId) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
    }
    return rooms.get(roomId);
}

// Helper function to send message to all clients in a room except sender
function broadcastToRoom(roomId, message, exceptClient) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.forEach(client => {
        if (client !== exceptClient && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

// Helper function to send message to specific client in room
function sendToClient(roomId, targetId, message) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.forEach(client => {
        if (client.id === targetId && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('New client connected');

    // Generate unique client ID
    ws.id = Math.random().toString(36).substring(2, 15);
    ws.roomId = null;

    // Send client their ID
    ws.send(JSON.stringify({
        type: 'id',
        id: ws.id
    }));

    // Handle incoming messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log(`Received message type: ${data.type}`);

            switch (data.type) {
                case 'join':
                    handleJoin(ws, data);
                    break;

                case 'offer':
                    handleOffer(ws, data);
                    break;

                case 'answer':
                    handleAnswer(ws, data);
                    break;

                case 'ice-candidate':
                    handleIceCandidate(ws, data);
                    break;

                case 'leave':
                    handleLeave(ws);
                    break;

                default:
                    console.log(`Unknown message type: ${data.type}`);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    // Handle client disconnect
    ws.on('close', () => {
        console.log(`Client ${ws.id} disconnected`);
        handleLeave(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Handler functions
function handleJoin(ws, data) {
    const roomId = data.roomId;
    ws.roomId = roomId;

    const room = getRoom(roomId);

    // Notify existing clients about new peer
    broadcastToRoom(roomId, {
        type: 'peer-joined',
        peerId: ws.id
    }, ws);

    // Add client to room
    room.add(ws);

    // Send list of existing peers to new client
    const peerIds = Array.from(room)
        .filter(client => client !== ws)
        .map(client => client.id);

    ws.send(JSON.stringify({
        type: 'joined',
        roomId: roomId,
        peerId: ws.id,
        peers: peerIds
    }));

    console.log(`Client ${ws.id} joined room ${roomId}. Room size: ${room.size}`);
}

function handleOffer(ws, data) {
    console.log(`Relaying offer from ${ws.id} to ${data.targetId}`);
    sendToClient(ws.roomId, data.targetId, {
        type: 'offer',
        offer: data.offer,
        senderId: ws.id
    });
}

function handleAnswer(ws, data) {
    console.log(`Relaying answer from ${ws.id} to ${data.targetId}`);
    sendToClient(ws.roomId, data.targetId, {
        type: 'answer',
        answer: data.answer,
        senderId: ws.id
    });
}

function handleIceCandidate(ws, data) {
    console.log(`Relaying ICE candidate from ${ws.id} to ${data.targetId}`);
    sendToClient(ws.roomId, data.targetId, {
        type: 'ice-candidate',
        candidate: data.candidate,
        senderId: ws.id
    });
}

function handleLeave(ws) {
    if (ws.roomId) {
        const room = rooms.get(ws.roomId);
        if (room) {
            room.delete(ws);

            // Notify other clients
            broadcastToRoom(ws.roomId, {
                type: 'peer-left',
                peerId: ws.id
            }, ws);

            console.log(`Client ${ws.id} left room ${ws.roomId}. Room size: ${room.size}`);

            // Clean up empty rooms
            if (room.size === 0) {
                rooms.delete(ws.roomId);
                console.log(`Room ${ws.roomId} is now empty and removed`);
            }
        }
        ws.roomId = null;
    }
}

// Start server
server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   Video Chat Server Started            ║
║                                        ║
║   HTTP Server: http://localhost:${PORT}   ║
║   WebSocket: ws://localhost:${PORT}       ║
║                                        ║
║   Ready to accept connections!         ║
╚════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');

    // Close all WebSocket connections
    wss.clients.forEach(client => {
        client.close();
    });

    // Close server
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
