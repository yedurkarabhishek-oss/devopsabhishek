// backend/routes/posts.js
const express = require('express');
const router = express.Router();
const {
  getAllPosts, getFeaturedPosts, getPostBySlug, createPost,
  updatePost, deletePost, getUserPosts, getMyPosts, getStats
} = require('../controllers/postsController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/stats', getStats);
router.get('/featured', getFeaturedPosts);
router.get('/user/:userId', getUserPosts);
router.get('/', optionalAuth, getAllPosts);
router.get('/:slug', optionalAuth, getPostBySlug);

// Protected routes
router.get('/me/my-posts', authenticateToken, getMyPosts);
router.post('/', authenticateToken, createPost);
router.put('/:id', authenticateToken, updatePost);
router.delete('/:id', authenticateToken, deletePost);

module.exports = router;
