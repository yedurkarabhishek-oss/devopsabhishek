// backend/server.js
// =============================================
// RUNNERS BLOG - Express Server
// =============================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());

const PORT = process.env.PORT || 5000;

// =============================================
// MIDDLEWARE
// =============================================
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:5000',
    '*'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// =============================================
// API ROUTES
// =============================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/likes', require('./routes/likes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Runners Blog API is running! 🏃',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// =============================================
// SERVE FRONTEND (SPA fallback)
// =============================================
app.get('*', (req, res) => {
  // Only serve HTML for non-API routes
  if (!req.path.startsWith('/api')) {
    const page = req.path === '/' ? 'index.html' : req.path.slice(1);
    const frontendPath = path.join(__dirname, '../frontend', page);
    
    // Try to serve the specific page, fallback to index
    const fs = require('fs');
    if (fs.existsSync(frontendPath)) {
      res.sendFile(frontendPath);
    } else {
      res.sendFile(path.join(__dirname, '../frontend/index.html'));
    }
  }
});

// =============================================
// ERROR HANDLING
// =============================================
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// =============================================
// START SERVER
// =============================================
app.listen(PORT, () => {
  console.log('\n🏃 =====================================');
  console.log('🏃 RUNNERS BLOG SERVER STARTED');
  console.log('🏃 =====================================');
  console.log(`📡 API Server: http://localhost:${PORT}`);
  console.log(`🌐 Frontend:   http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🏃 =====================================\n');
});

module.exports = app;
