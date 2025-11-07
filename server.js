import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// In-memory storage for blueprints
const blueprints = new Map();

// Helper to get blueprint key
const getBpKey = (author, name) => `${author}:${name}`;

// Initialize with some sample data
blueprints.set(getBpKey('juan', 'plano-1'), {
  author: 'juan',
  name: 'plano-1',
  points: [{ x: 10, y: 10 }, { x: 40, y: 50 }, { x: 100, y: 100 }],
});

// GET all blueprints by author
app.get('/api/blueprints/:author', (req, res) => {
  const { author } = req.params;
  const authorBlueprints = [];
  
  blueprints.forEach((bp, key) => {
    if (bp.author === author) {
      authorBlueprints.push(bp);
    }
  });
  
  res.json(authorBlueprints);
});

// GET specific blueprint
app.get('/api/blueprints/:author/:name', (req, res) => {
  const { author, name } = req.params;
  const key = getBpKey(author, name);
  const bp = blueprints.get(key);
  
  if (bp) {
    res.json(bp);
  } else {
    res.json({ author, name, points: [] });
  }
});

// POST - Create new blueprint
app.post('/api/blueprints', (req, res) => {
  const { author, name, points = [] } = req.body;
  
  if (!author || !name) {
    return res.status(400).json({ error: 'Author and name are required' });
  }
  
  const key = getBpKey(author, name);
  
  if (blueprints.has(key)) {
    return res.status(409).json({ error: 'Blueprint already exists' });
  }
  
  const newBp = { author, name, points };
  blueprints.set(key, newBp);
  
  // Notify all clients about the new blueprint
  io.emit('blueprints-list-update', { author });
  
  res.status(201).json(newBp);
});

// PUT - Update/Save blueprint
app.put('/api/blueprints/:author/:name', (req, res) => {
  const { author, name } = req.params;
  const { points } = req.body;
  
  if (!points || !Array.isArray(points)) {
    return res.status(400).json({ error: 'Points array is required' });
  }
  
  const key = getBpKey(author, name);
  const bp = { author, name, points };
  blueprints.set(key, bp);
  
  // Notify all clients in the room
  const room = `blueprints.${author}.${name}`;
  io.to(room).emit('blueprint-update', { author, name, points });
  
  res.json(bp);
});

// DELETE blueprint
app.delete('/api/blueprints/:author/:name', (req, res) => {
  const { author, name } = req.params;
  const key = getBpKey(author, name);
  
  if (!blueprints.has(key)) {
    return res.status(404).json({ error: 'Blueprint not found' });
  }
  
  blueprints.delete(key);
  
  // Notify all clients about the deletion
  io.emit('blueprints-list-update', { author });
  
  res.status(204).send();
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });
  
  socket.on('draw-event', ({ room, point, author, name }) => {
    const key = getBpKey(author, name);
    const bp = blueprints.get(key) || { author, name, points: [] };
    
    // Add the new point
    bp.points.push(point);
    blueprints.set(key, bp);
    
    // Broadcast to all clients in the room (including sender)
    io.to(room).emit('blueprint-update', { author, name, points: bp.points });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Socket.IO up on :${PORT}`));
