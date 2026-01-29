const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

// --- Parse Q126_Status.md for Mihir's auto-load ---
function parseMihirPriorities() {
  const candidates = [
    process.env.STATUS_FILE,
    path.join(__dirname, 'Q126_Status.md'),
    path.join(__dirname, '..', 'Q126_Status.md'),
  ].filter(Boolean);
  const filePath = candidates.find(f => fs.existsSync(f));
  if (!filePath) return [];
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/\*\*Today's Actions[^*]*\*\*\s*\n([\s\S]*?)(?=\n###|\n---|\n$)/);
    if (!match) return [];
    const lines = match[1].trim().split('\n');
    return lines
      .map(line => {
        const m = line.match(/\d+\.\s*\[.\]\s*(.*)/);
        return m ? m[1].trim() : null;
      })
      .filter(Boolean);
  } catch (e) {
    console.log('Could not read status file:', e.message);
    return [];
  }
}

app.get('/api/priorities/mihir', (req, res) => {
  res.json({ priorities: parseMihirPriorities() });
});

app.use(express.static(path.join(__dirname, 'public')));

// --- Room state ---
// rooms: { roomName: { users: { odId: { name, tasks, activeTask, ws } } } }
const rooms = {};

function broadcastRoom(roomName) {
  const room = rooms[roomName];
  if (!room) return;
  const payload = JSON.stringify({
    type: 'room_state',
    users: Object.entries(room.users).map(([id, u]) => ({
      id,
      name: u.name,
      tasks: u.tasks,
    })),
  });
  Object.values(room.users).forEach(u => {
    if (u.ws.readyState === 1) u.ws.send(payload);
  });
}

function broadcastEncouragement(roomName, fromName, toId, message) {
  const room = rooms[roomName];
  if (!room) return;
  const target = room.users[toId];
  if (target && target.ws.readyState === 1) {
    target.ws.send(JSON.stringify({
      type: 'encouragement',
      from: fromName,
      message,
    }));
  }
}

let nextId = 1;

wss.on('connection', (ws) => {
  const userId = String(nextId++);
  let currentRoom = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'join') {
      const roomName = (msg.room || 'default').toLowerCase().trim();
      const name = (msg.name || 'Anonymous').trim();
      currentRoom = roomName;

      if (!rooms[roomName]) rooms[roomName] = { users: {} };
      rooms[roomName].users[userId] = {
        name,
        tasks: [],
        ws,
      };

      ws.send(JSON.stringify({ type: 'joined', userId }));
      broadcastRoom(roomName);
    }

    if (msg.type === 'update_tasks' && currentRoom) {
      const user = rooms[currentRoom]?.users[userId];
      if (user) {
        user.tasks = msg.tasks;
        broadcastRoom(currentRoom);
      }
    }

    if (msg.type === 'task_done' && currentRoom) {
      // Notify others that this user finished a task
      const room = rooms[currentRoom];
      if (!room) return;
      const user = room.users[userId];
      if (!user) return;
      user.tasks = msg.tasks;
      const payload = JSON.stringify({
        type: 'task_completed',
        userId,
        userName: user.name,
        taskName: msg.taskName,
      });
      Object.entries(room.users).forEach(([id, u]) => {
        if (id !== userId && u.ws.readyState === 1) {
          u.ws.send(payload);
        }
      });
      broadcastRoom(currentRoom);
    }

    if (msg.type === 'encourage' && currentRoom) {
      const user = rooms[currentRoom]?.users[userId];
      if (user) {
        broadcastEncouragement(currentRoom, user.name, msg.toUserId, msg.message);
      }
    }
  });

  ws.on('close', () => {
    if (currentRoom && rooms[currentRoom]) {
      delete rooms[currentRoom].users[userId];
      if (Object.keys(rooms[currentRoom].users).length === 0) {
        delete rooms[currentRoom];
      } else {
        broadcastRoom(currentRoom);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Ruthless Priorities running on http://localhost:${PORT}`);
});
