const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

// Create a new room
router.post('/create', roomController.createRoom);

// Join an existing room
router.post('/join', roomController.joinRoom);

// Approve or reject device join request
router.post('/approve-join', roomController.approveJoinRequest);

// Leave a room
router.post('/leave', roomController.leaveRoom);

// Change room sync mode
router.post('/sync-mode', roomController.changeSyncMode);

// Get room information
router.get('/:code', roomController.getRoomInfo);

module.exports = router;