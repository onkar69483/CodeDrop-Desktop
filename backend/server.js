require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Clipboard = require('./models/Clipboard');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.log('❌ MongoDB Error:', err));

// API Route to Save Clipboard Data
app.post('/api/saveClipboard', async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    try {
        const newClipboard = await Clipboard.create({ text });
        io.emit('newClipboard', newClipboard.text); // Broadcast to all clients
        return res.status(201).json(newClipboard);
    } catch (err) {
        return res.status(500).json({ error: "Failed to save clipboard" });
    }
});

// API Route to Get Recent Clipboard Data
app.get('/api/getClipboard', async (req, res) => {
    try {
        const clipboardData = await Clipboard.find().sort({ timestamp: -1 }).limit(10);
        return res.json(clipboardData);
    } catch (err) {
        return res.status(500).json({ error: "Failed to fetch clipboard data" });
    }
});

// WebSocket Connection for Real-Time Sync
io.on('connection', (socket) => {
    console.log('📡 Client Connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('❌ Client Disconnected:', socket.id);
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));