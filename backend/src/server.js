const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const socketManager = require('./utils/socketManager');
const roomRoutes = require('./routes/roomRoutes');
const clipboardRoutes = require('./routes/clipboardRoutes');

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Initialize Express
const app = express();
const server = http.createServer(app);
const io = socketManager.initialize(server);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/rooms', roomRoutes);
app.use('/api/clipboard', clipboardRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join a room
  socket.on('joinRoom', (roomCode) => {
    socket.join(roomCode);
    console.log(`Client ${socket.id} joined room: ${roomCode}`);
  });

  // Leave a room
  socket.on('leaveRoom', (roomCode) => {
    socket.leave(roomCode);
    console.log(`Client ${socket.id} left room: ${roomCode}`);
  });

  // Handle clipboard sync
  socket.on('syncClipboard', ({ roomCode, data, deviceId, syncMode }) => {
    // If syncMode is one-way, only root device can broadcast
    if (syncMode === 'two-way' || data.isFromRoot) {
      socket.to(roomCode).emit('clipboardUpdate', {
        data: data.content,
        fromDeviceId: deviceId
      });
    }
  });

  // Handle join requests
  socket.on('joinRequest', ({ roomCode, deviceName, deviceId }) => {
    socket.to(roomCode).emit('joinRequestReceived', {
      deviceName,
      deviceId,
      socketId: socket.id
    });
  });

  // Handle join request response
  socket.on('joinRequestResponse', ({ approved, deviceId, roomCode }) => {
    io.to(roomCode).emit('joinRequestProcessed', {
      approved,
      deviceId
    });
  });

  // Disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app };