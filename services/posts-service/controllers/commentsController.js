// backend/controllers/commentsController.js
const pool = require('../config/db');

// POST /api/comments — Add comment
const addComment = async (req, res) => {
  try {
    const { post_id, content } = req.body;

    if (!post_id || !content) {
      return res.status(400).json({ success: false, message: 'Post ID and content are required' });
    }

    if (content.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Comment must be at least 3 characters' });
    }

    // Check post exists
    const postCheck = await pool.query('SELECT id FROM posts WHERE id = $1', [post_id]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const result = await pool.query(`
      INSERT INTO comments (post_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [post_id, req.user.id, content.trim()]);

    // Return comment with user info
    const commentWithUser = await pool.query(`
      SELECT c.*, u.username, u.full_name, u.profile_pic
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [result.rows[0].id]);

    res.status(201).json({
      success: true,
      message: 'Comment added!',
      data: commentWithUser.rows[0]
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/comments/:id — Delete comment
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const check = await pool.query('SELECT user_id FROM comments WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    if (check.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [id]);

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/likes/toggle — Toggle like on a post
const toggleLike = async (req, res) => {
  try {
    const { post_id } = req.body;

    if (!post_id) {
      return res.status(400).json({ success: false, message: 'Post ID is required' });
    }

    // Check if already liked
    const existing = await pool.query(
      'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2',
      [post_id, req.user.id]
    );

    let liked;
    if (existing.rows.length > 0) {
      // Unlike
      await pool.query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2', [post_id, req.user.id]);
      liked = false;
    } else {
      // Like
      await pool.query('INSERT INTO likes (post_id, user_id) VALUES ($1, $2)', [post_id, req.user.id]);
      liked = true;
    }

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM likes WHERE post_id = $1',
      [post_id]
    );

    res.json({
      success: true,
      data: {
        liked,
        like_count: parseInt(countResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { addComment, deleteComment, toggleLike };
