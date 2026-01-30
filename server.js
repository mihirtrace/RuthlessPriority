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

// --- Helpers ---
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// --- Persistent room state ---
// rooms: { roomName: { members: { memberKey: { name, tasks, online, ws, points, streak, lastCompletedDate } } } }
// memberKey = lowercase name (unique per room)
const rooms = {};

function getRoom(roomName) {
  if (!rooms[roomName]) rooms[roomName] = { members: {} };
  return rooms[roomName];
}

function getMemberKey(name) {
  return name.toLowerCase().trim();
}

function buildRoomPayload(room) {
  return {
    type: 'room_state',
    members: Object.entries(room.members).map(([key, m]) => ({
      key,
      name: m.name,
      tasks: m.tasks,
      online: m.online,
      points: m.points || 0,
      streak: m.streak || 0,
    })),
  };
}

function broadcastRoom(roomName) {
  const room = rooms[roomName];
  if (!room) return;
  const payload = JSON.stringify(buildRoomPayload(room));
  Object.values(room.members).forEach(m => {
    if (m.online && m.ws && m.ws.readyState === 1) {
      m.ws.send(payload);
    }
  });
}

// --- Server-side timer tick ---
setInterval(() => {
  for (const roomName in rooms) {
    const room = rooms[roomName];
    let changed = false;
    for (const key in room.members) {
      const member = room.members[key];
      for (const task of member.tasks) {
        if (task.running && !task.done) {
          task.elapsed++;
          changed = true;
        }
      }
    }
    if (changed) broadcastRoom(roomName);
  }
}, 1000);

// --- WebSocket connections ---
wss.on('connection', (ws) => {
  let currentRoom = null;
  let memberKey = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'join') {
      const roomName = (msg.room || 'default').toLowerCase().trim();
      const name = (msg.name || 'Anonymous').trim();
      const key = getMemberKey(name);
      currentRoom = roomName;
      memberKey = key;

      const room = getRoom(roomName);

      if (room.members[key]) {
        // Returning member — restore state, update ws
        const member = room.members[key];
        member.online = true;
        member.ws = ws;
        member.name = name; // update casing if changed

        // Send back their existing tasks so client can restore
        ws.send(JSON.stringify({
          type: 'joined',
          memberKey: key,
          yourTasks: member.tasks,
        }));
      } else {
        // New member
        room.members[key] = {
          name,
          tasks: [],
          online: true,
          ws,
          points: 0,
          streak: 0,
          lastCompletedDate: null,
        };
        ws.send(JSON.stringify({
          type: 'joined',
          memberKey: key,
          yourTasks: [],
        }));
      }

      broadcastRoom(roomName);
    }

    if (msg.type === 'set_tasks' && currentRoom && memberKey) {
      const room = rooms[currentRoom];
      const member = room?.members[memberKey];
      if (member) {
        member.tasks = msg.tasks.map(t => ({
          name: t.name,
          elapsed: t.elapsed || 0,
          target: t.target || 0,
          running: false,
          done: false,
          encouragements: [],
        }));
        broadcastRoom(currentRoom);
      }
    }

    if (msg.type === 'add_task' && currentRoom && memberKey) {
      const room = rooms[currentRoom];
      const member = room?.members[memberKey];
      if (member && msg.name && msg.name.trim()) {
        member.tasks.push({
          name: msg.name.trim(),
          elapsed: 0,
          target: 0,
          running: false,
          done: false,
          encouragements: [],
        });
        broadcastRoom(currentRoom);
      }
    }

    if (msg.type === 'start_task' && currentRoom && memberKey) {
      const room = rooms[currentRoom];
      const member = room?.members[memberKey];
      if (member) {
        member.tasks.forEach((t, j) => {
          t.running = j === msg.taskIndex && !t.done;
        });
        broadcastRoom(currentRoom);
      }
    }

    if (msg.type === 'pause_task' && currentRoom && memberKey) {
      const room = rooms[currentRoom];
      const member = room?.members[memberKey];
      if (member && member.tasks[msg.taskIndex]) {
        member.tasks[msg.taskIndex].running = false;
        broadcastRoom(currentRoom);
      }
    }

    if (msg.type === 'done_task' && currentRoom && memberKey) {
      const room = rooms[currentRoom];
      const member = room?.members[memberKey];
      if (member && member.tasks[msg.taskIndex]) {
        const task = member.tasks[msg.taskIndex];
        task.running = false;
        task.done = true;

        // Award points for completing a task
        if (!member.points) member.points = 0;
        member.points += 10;

        // Check if all tasks are done
        const allDone = member.tasks.length > 0 && member.tasks.every(t => t.done);
        if (allDone) {
          member.points += 50; // bonus
          const today = todayStr();
          if (member.lastCompletedDate !== today) {
            if (member.lastCompletedDate === yesterdayStr()) {
              member.streak = (member.streak || 0) + 1;
            } else {
              member.streak = 1;
            }
            member.lastCompletedDate = today;
          }

          // Broadcast celebration to all room members
          const celebPayload = JSON.stringify({
            type: 'all_done_celebration',
            memberKey,
            memberName: member.name,
          });
          Object.values(room.members).forEach(m => {
            if (m.online && m.ws && m.ws.readyState === 1) {
              m.ws.send(celebPayload);
            }
          });
        }

        // Notify other online members
        const payload = JSON.stringify({
          type: 'task_completed',
          memberKey,
          memberName: member.name,
          taskName: task.name,
          taskIndex: msg.taskIndex,
        });
        Object.entries(room.members).forEach(([k, m]) => {
          if (k !== memberKey && m.online && m.ws && m.ws.readyState === 1) {
            m.ws.send(payload);
          }
        });
        // Also queue encouragement prompt for offline members when they come back
        Object.entries(room.members).forEach(([k, m]) => {
          if (k !== memberKey && !m.online) {
            if (!m.pendingNotifications) m.pendingNotifications = [];
            m.pendingNotifications.push({
              type: 'task_completed',
              memberKey,
              memberName: member.name,
              taskName: task.name,
              taskIndex: msg.taskIndex,
            });
          }
        });

        broadcastRoom(currentRoom);
      }
    }

    if (msg.type === 'reset_task' && currentRoom && memberKey) {
      const room = rooms[currentRoom];
      const member = room?.members[memberKey];
      if (member && member.tasks[msg.taskIndex]) {
        member.tasks[msg.taskIndex].elapsed = 0;
        member.tasks[msg.taskIndex].target = 0;
        member.tasks[msg.taskIndex].running = false;
        broadcastRoom(currentRoom);
      }
    }

    if (msg.type === 'set_target' && currentRoom && memberKey) {
      const room = rooms[currentRoom];
      const member = room?.members[memberKey];
      if (member && member.tasks[msg.taskIndex]) {
        member.tasks[msg.taskIndex].target = msg.target;
        broadcastRoom(currentRoom);
      }
    }

    if (msg.type === 'kick_user' && currentRoom && memberKey) {
      const room = rooms[currentRoom];
      const kicker = room?.members[memberKey];
      if (kicker && kicker.name.toLowerCase() === 'mihir') {
        const targetKey = msg.targetKey;
        const target = room.members[targetKey];
        if (target) {
          if (target.online && target.ws && target.ws.readyState === 1) {
            target.ws.send(JSON.stringify({ type: 'kicked' }));
            target.ws.close();
          }
          delete room.members[targetKey];
          broadcastRoom(currentRoom);
        }
      }
    }

    if (msg.type === 'encourage' && currentRoom && memberKey) {
      const room = rooms[currentRoom];
      const sender = room?.members[memberKey];
      const targetKey = msg.targetKey;
      const target = room?.members[targetKey];
      if (sender && target && typeof msg.taskIndex === 'number' && target.tasks[msg.taskIndex]) {
        // Persist the encouragement on the task
        target.tasks[msg.taskIndex].encouragements.push({
          from: sender.name,
          message: msg.message,
        });

        // Award +5 points to the recipient
        if (!target.points) target.points = 0;
        target.points += 5;

        // Send live notification if target is online
        if (target.online && target.ws && target.ws.readyState === 1) {
          target.ws.send(JSON.stringify({
            type: 'encouragement',
            from: sender.name,
            message: msg.message,
            taskIndex: msg.taskIndex,
          }));
        }

        broadcastRoom(currentRoom);
      }
    }
  });

  ws.on('close', () => {
    if (currentRoom && rooms[currentRoom] && memberKey) {
      const member = rooms[currentRoom].members[memberKey];
      if (member) {
        member.online = false;
        member.ws = null;
        // Don't delete the member — they persist
      }
      broadcastRoom(currentRoom);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Ruthless Priorities running on http://localhost:${PORT}`);
});
