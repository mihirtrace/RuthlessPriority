# Project Specification: Ruthless Priorities

## Overview
A real-time shared focus timer app where teammates enter daily priorities, run timers, see each other's live progress, and send quick encouragement when tasks are completed. Hosted on Render.

## Requirements

### Core
- Users join **named rooms** (e.g., type "trace-team" to join)
- Each user enters a display name on join
- Each user inputs their ruthless priorities for the day (free text, one per line)
- Each priority has a timer with preset durations (5m, 15m, 25m, 45m, 60m)
- Start/Pause/Done/Reset controls per task
- Only one timer active per user at a time

### Real-Time Sync
- All users in a room see each other's task lists and **live timer state**
- Timer progress (elapsed time, which task is active) broadcasts via WebSocket
- When someone marks a task done, all room members see it immediately

### Encouragement
- When a user completes a task, other users in the room get a prompt
- Quick preset tap buttons: "Crushed it", "Let's go", "Beast mode", "On fire", "Keep pushing"
- Encouragement appears as a brief toast/notification on the completer's screen

### Mihir Auto-Load
- Mihir's priorities auto-populate from `Q126_Status.md` "Today's Actions" section
- Server reads the file at startup and exposes an API endpoint
- Client can request auto-load by hitting `/api/priorities/mihir`
- Other users type their priorities manually

### No Persistence Needed
- Room state lives in server memory only
- Rooms are ephemeral — refresh the page, re-enter your tasks
- No database, no auth beyond name + room code

## Technical Approach
- **Server:** Node.js + `express` + `ws` (WebSocket)
- **Client:** Single HTML file served by express, vanilla JS
- **Deploy:** Render web service (free tier works)
- **File:** Server reads Q126_Status.md from disk (or bundled at deploy)

## Architecture
```
Client (browser)
  ↕ WebSocket
Server (Node.js)
  ├── express: serves static HTML + /api/priorities/mihir
  ├── ws: manages rooms, broadcasts state
  └── reads Q126_Status.md for auto-load
```

## UI Design
- Dark theme matching existing priorities.html
- Teal (#18929A) accent
- Left column: your tasks + timers (full controls)
- Right column: teammate task lists + live timers (read-only, with encouragement buttons)
- Mobile-responsive (stacks vertically)

## Validation Plan
- Open two browser tabs in same room, verify real-time sync
- Complete a task in one tab, verify encouragement prompt in the other
- Verify auto-load endpoint returns parsed priorities from status file

## Next Steps
1. Build server.js with express + WebSocket
2. Build client HTML with room join + task entry + timers + encouragement
3. Add Q126_Status.md parser for auto-load
4. Add render.yaml for deployment
5. Test locally with two tabs
