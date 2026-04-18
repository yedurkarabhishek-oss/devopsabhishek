// backend/controllers/postsController.js
const pool = require('../config/db');

// Helper: create slug
const createSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    + '-' + Date.now();
};

// GET /api/posts — Get all posts (with filters)
const getAllPosts = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 9, sort = 'latest' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, u.username, u.full_name, u.profile_pic,
             COUNT(DISTINCT l.id) AS like_count,
             COUNT(DISTINCT c.id) AS comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON l.post_id = p.id
      LEFT JOIN comments c ON c.post_id = p.id
      WHERE p.status = 'published'
    `;
    const params = [];
    let paramIdx = 1;

    if (category && category !== 'all') {
      query += ` AND p.category = $${paramIdx++}`;
      params.push(category);
    }

    if (search) {
      query += ` AND (p.title ILIKE $${paramIdx} OR p.excerpt ILIKE $${paramIdx} OR p.content ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    query += ` GROUP BY p.id, u.id`;

    if (sort === 'popular') {
      query += ` ORDER BY like_count DESC, p.created_at DESC`;
    } else if (sort === 'views') {
      query += ` ORDER BY p.views DESC`;
    } else {
      query += ` ORDER BY p.created_at DESC`;
    }

    query += ` LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const [postsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(
        `SELECT COUNT(*) FROM posts p WHERE p.status = 'published'
         ${category && category !== 'all' ? `AND p.category = '${category}'` : ''}
         ${search ? `AND (p.title ILIKE '%${search}%' OR p.excerpt ILIKE '%${search}%')` : ''}`
      )
    ]);

    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: postsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all posts error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/posts/featured — Get featured/recent posts for homepage
const getFeaturedPosts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.username, u.full_name, u.profile_pic,
             COUNT(DISTINCT l.id) AS like_count,
             COUNT(DISTINCT c.id) AS comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON l.post_id = p.id
      LEFT JOIN comments c ON c.post_id = p.id
      WHERE p.status = 'published'
      GROUP BY p.id, u.id
      ORDER BY p.views DESC, p.created_at DESC
      LIMIT 3
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get featured posts error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/posts/:slug — Get single post
const getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // Increment view count
    await pool.query('UPDATE posts SET views = views + 1 WHERE slug = $1', [slug]);

    const result = await pool.query(`
      SELECT p.*, u.username, u.full_name, u.profile_pic, u.bio AS author_bio,
             COUNT(DISTINCT l.id) AS like_count,
             COUNT(DISTINCT c.id) AS comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON l.post_id = p.id
      LEFT JOIN comments c ON c.post_id = p.id
      WHERE p.slug = $1 AND p.status = 'published'
      GROUP BY p.id, u.id
    `, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const post = result.rows[0];

    // Get comments with user info
    const commentsResult = await pool.query(`
      SELECT c.*, u.username, u.full_name, u.profile_pic
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [post.id]);

    post.comments = commentsResult.rows;

    // Check if current user liked it
    if (req.user) {
      const likeResult = await pool.query(
        'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2',
        [post.id, req.user.id]
      );
      post.user_liked = likeResult.rows.length > 0;
    } else {
      post.user_liked = false;
    }

    // Related posts
    const relatedResult = await pool.query(`
      SELECT p.id, p.title, p.slug, p.excerpt, p.cover_image, p.category, p.created_at,
             u.username, u.full_name
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.category = $1 AND p.id != $2 AND p.status = 'published'
      ORDER BY p.created_at DESC
      LIMIT 3
    `, [post.category, post.id]);

    post.related_posts = relatedResult.rows;

    res.json({ success: true, data: post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/posts — Create post (auth required)
const createPost = async (req, res) => {
  try {
    const { title, content, excerpt, category, tags, distance_km, duration_minutes } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const slug = createSlug(title);
    const tagsArray = tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [];

    const result = await pool.query(`
      INSERT INTO posts (user_id, title, slug, content, excerpt, category, tags, distance_km, duration_minutes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      req.user.id, title, slug, content,
      excerpt || content.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
      category || 'general',
      tagsArray, distance_km || null, duration_minutes || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Post created successfully!',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/posts/:id — Update post
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, category, tags, distance_km, duration_minutes, status } = req.body;

    // Check ownership
    const check = await pool.query('SELECT user_id FROM posts WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    if (check.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const tagsArray = tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [];

    const result = await pool.query(`
      UPDATE posts
      SET title = $1, content = $2, excerpt = $3, category = $4, tags = $5,
          distance_km = $6, duration_minutes = $7, status = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `, [title, content, excerpt, category, tagsArray, distance_km, duration_minutes, status || 'published', id]);

    res.json({
      success: true,
      message: 'Post updated successfully!',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/posts/:id — Delete post
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const check = await pool.query('SELECT user_id FROM posts WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    if (check.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await pool.query('DELETE FROM posts WHERE id = $1', [id]);

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/posts/user/:userId — Get posts by user
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 9 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(`
      SELECT p.*, u.username, u.full_name, u.profile_pic,
             COUNT(DISTINCT l.id) AS like_count,
             COUNT(DISTINCT c.id) AS comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON l.post_id = p.id
      LEFT JOIN comments c ON c.post_id = p.id
      WHERE p.user_id = $1 AND p.status = 'published'
      GROUP BY p.id, u.id
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, parseInt(limit), parseInt(offset)]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/posts/my-posts — Get current user's posts (including drafts)
const getMyPosts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, COUNT(DISTINCT l.id) AS like_count, COUNT(DISTINCT c.id) AS comment_count
      FROM posts p
      LEFT JOIN likes l ON l.post_id = p.id
      LEFT JOIN comments c ON c.post_id = p.id
      WHERE p.user_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [req.user.id]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get my posts error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/posts/stats — Blog stats for homepage
const getStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM posts WHERE status = 'published') AS total_posts,
        (SELECT COUNT(*) FROM users) AS total_runners,
        (SELECT COALESCE(SUM(views), 0) FROM posts) AS total_views,
        (SELECT COUNT(*) FROM comments) AS total_comments
    `);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getAllPosts, getFeaturedPosts, getPostBySlug, createPost,
  updatePost, deletePost, getUserPosts, getMyPosts, getStats
};
