const express = require('express');
const router = express.Router();
const clipboardController = require('../controllers/clipboardController');

// Sync clipboard data
router.post('/sync', clipboardController.syncClipboard);

// Get last synced clipboard content
router.get('/last/:roomCode', clipboardController.getLastSyncedContent);

module.exports = router;