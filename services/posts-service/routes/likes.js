// backend/routes/likes.js
const express = require('express');
const router = express.Router();
const { toggleLike } = require('../controllers/commentsController');
const { authenticateToken } = require('../middleware/auth');

router.post('/toggle', authenticateToken, toggleLike);

module.exports = router;
