// backend/routes/comments.js
const express = require('express');
const router = express.Router();
const { addComment, deleteComment, toggleLike } = require('../controllers/commentsController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, addComment);
router.delete('/:id', authenticateToken, deleteComment);

module.exports = router;

// backend/routes/likes.js — export separately for likes
