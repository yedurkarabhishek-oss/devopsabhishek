// frontend/js/api.js
// =============================================
// RUNNERS BLOG - API Client & Utilities
// =============================================

const API_BASE = 'http://localhost:5000/api';

// =============================================
// API CLIENT
// =============================================
const api = {
  // Get auth token from localStorage
  getToken() {
    return localStorage.getItem('rb_token');
  },

  // Default headers
  headers(withAuth = false) {
    const h = { 'Content-Type': 'application/json' };
    if (withAuth) {
      const token = this.getToken();
      if (token) h['Authorization'] = `Bearer ${token}`;
    }
    return h;
  },

  // Generic fetch wrapper
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: options.headers || this.headers(true)
      });
      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (error) {
      console.error('API Error:', error);
      return { ok: false, status: 0, data: { message: 'Network error. Please check your connection.' } };
    }
  },

  // GET
  get(endpoint, auth = false) {
    return this.request(endpoint, {
      method: 'GET',
      headers: this.headers(auth)
    });
  },

  // POST
  post(endpoint, body, auth = false) {
    return this.request(endpoint, {
      method: 'POST',
      headers: this.headers(auth),
      body: JSON.stringify(body)
    });
  },

  // PUT
  put(endpoint, body, auth = true) {
    return this.request(endpoint, {
      method: 'PUT',
      headers: this.headers(auth),
      body: JSON.stringify(body)
    });
  },

  // DELETE
  delete(endpoint, auth = true) {
    return this.request(endpoint, {
      method: 'DELETE',
      headers: this.headers(auth)
    });
  }
};

// =============================================
// AUTH STATE MANAGEMENT
// =============================================
const auth = {
  currentUser: null,

  async init() {
    const token = localStorage.getItem('rb_token');
    const userData = localStorage.getItem('rb_user');
    if (token && userData) {
      this.currentUser = JSON.parse(userData);
      // Verify token is still valid
      const result = await api.get('/auth/me', true);
      if (result.ok) {
        this.currentUser = result.data.data;
        localStorage.setItem('rb_user', JSON.stringify(this.currentUser));
      } else {
        this.logout();
      }
    }
    this.updateNavUI();
    return this.currentUser;
  },

  async login(email, password) {
    const result = await api.post('/auth/login', { email, password });
    if (result.ok) {
      this.currentUser = result.data.data.user;
      localStorage.setItem('rb_token', result.data.data.token);
      localStorage.setItem('rb_user', JSON.stringify(this.currentUser));
      this.updateNavUI();
    }
    return result;
  },

  async register(username, email, password, fullName) {
    const result = await api.post('/auth/register', { username, email, password, full_name: fullName });
    if (result.ok) {
      this.currentUser = result.data.data.user;
      localStorage.setItem('rb_token', result.data.data.token);
      localStorage.setItem('rb_user', JSON.stringify(this.currentUser));
      this.updateNavUI();
    }
    return result;
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem('rb_token');
    localStorage.removeItem('rb_user');
    this.updateNavUI();
  },

  isLoggedIn() {
    return !!this.currentUser;
  },

  updateNavUI() {
    const guestActions = document.getElementById('guestActions');
    const userActions = document.getElementById('userActions');
    const userAvatarText = document.getElementById('userAvatarText');
    const writeBtn = document.getElementById('writeBtnNav');

    if (this.currentUser) {
      if (guestActions) guestActions.classList.add('hidden');
      if (userActions) userActions.classList.remove('hidden');
      if (userAvatarText) userAvatarText.textContent = this.currentUser.username?.[0]?.toUpperCase() || 'U';
      if (writeBtn) writeBtn.classList.remove('hidden');
    } else {
      if (guestActions) guestActions.classList.remove('hidden');
      if (userActions) userActions.classList.add('hidden');
      if (writeBtn) writeBtn.classList.add('hidden');
    }
  }
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

// Format date
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Format number (1234 -> 1.2K)
function formatNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n || 0;
}

// Format duration (minutes -> "1h 23m")
function formatDuration(mins) {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Category display names & colors
const CATEGORIES = {
  'training': { label: 'Training', class: 'cat-training' },
  'race-report': { label: 'Race Report', class: 'cat-race-report' },
  'nutrition': { label: 'Nutrition', class: 'cat-nutrition' },
  'gear': { label: 'Gear', class: 'cat-gear' },
  'motivation': { label: 'Motivation', class: 'cat-motivation' },
  'injury': { label: 'Injury', class: 'cat-injury' },
  'general': { label: 'General', class: 'cat-general' }
};

function getCategoryBadge(category) {
  const cat = CATEGORIES[category] || CATEGORIES['general'];
  return `<span class="post-card-category ${cat.class}">${cat.label}</span>`;
}

// Generate avatar initials HTML
function avatarInitials(name, size = 'md') {
  const initial = (name || 'U')[0].toUpperCase();
  return `<div class="author-avatar-sm" style="background: var(--primary);">${initial}</div>`;
}

// Toast notification
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  toast.innerHTML = `<span>${icons[type] || icons.info}</span> ${message}`;

  container.appendChild(toast);

  toast.addEventListener('click', () => toast.remove());

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = '0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Build post card HTML
function buildPostCard(post) {
  const cat = CATEGORIES[post.category] || CATEGORIES['general'];
  const initial = (post.full_name || post.username || 'U')[0].toUpperCase();
  const runData = post.distance_km || post.duration_minutes ? `
    <div class="run-stats-box" style="padding: 16px 20px; margin: 0;">
      ${post.distance_km ? `<div class="run-stat"><span class="run-stat-num" style="font-size:1.4rem">${post.distance_km}km</span><span class="run-stat-label">Distance</span></div>` : ''}
      ${post.duration_minutes ? `<div class="run-stat"><span class="run-stat-num" style="font-size:1.4rem">${formatDuration(post.duration_minutes)}</span><span class="run-stat-label">Time</span></div>` : ''}
    </div>` : '';

  return `
    <article class="post-card reveal" onclick="window.location.href='post.html?slug=${post.slug}'">
      <div class="post-card-image">
        <div style="width:100%;height:100%;background:linear-gradient(135deg,${getCategoryGradient(post.category)});display:flex;align-items:center;justify-content:center;font-size:3rem;">
          ${getCategoryEmoji(post.category)}
        </div>
        ${getCategoryBadge(post.category)}
      </div>
      <div class="post-card-body">
        <div class="post-card-meta">
          <span class="post-card-author">
            <div class="author-avatar-sm">${initial}</div>
            ${post.full_name || post.username}
          </span>
          <span>·</span>
          <span>${formatDate(post.created_at)}</span>
        </div>
        <h3 class="post-card-title">${escapeHtml(post.title)}</h3>
        <p class="post-card-excerpt">${escapeHtml(post.excerpt || '')}</p>
      </div>
      <div class="post-card-footer">
        <div class="post-card-stats">
          <span class="stat-item">❤️ ${formatNum(post.like_count)}</span>
          <span class="stat-item">💬 ${formatNum(post.comment_count)}</span>
          <span class="stat-item">👁 ${formatNum(post.views)}</span>
        </div>
        <span style="font-size:0.8rem;color:var(--text-light);">${cat.label}</span>
      </div>
    </article>
  `;
}

function getCategoryGradient(cat) {
  const gradients = {
    'training': '#1d4ed8,#3b82f6',
    'race-report': '#be185d,#ec4899',
    'nutrition': '#065f46,#10b981',
    'gear': '#92400e,#f59e0b',
    'motivation': '#5b21b6,#8b5cf6',
    'injury': '#991b1b,#ef4444',
    'general': '#374151,#9ca3af'
  };
  return gradients[cat] || gradients['general'];
}

function getCategoryEmoji(cat) {
  const emojis = {
    'training': '🏃', 'race-report': '🏅', 'nutrition': '🥗',
    'gear': '👟', 'motivation': '💪', 'injury': '🩹', 'general': '📝'
  };
  return emojis[cat] || '📝';
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// Scroll reveal observer
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// =============================================
// NAVBAR SHARED COMPONENT
// =============================================
function initNavbar() {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  const mobileNavClose = document.getElementById('mobileNavClose');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => mobileNav.classList.add('open'));
    if (mobileNavClose) mobileNavClose.addEventListener('click', () => mobileNav.classList.remove('open'));
  }

  // User dropdown
  const navAvatar = document.getElementById('navAvatar');
  const userDropdown = document.getElementById('userDropdown');

  if (navAvatar && userDropdown) {
    navAvatar.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('open');
    });

    document.addEventListener('click', () => userDropdown.classList.remove('open'));
  }

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.logout();
      showToast('Logged out successfully', 'info');
      setTimeout(() => window.location.href = 'index.html', 800);
    });
  }

  // Active nav link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
}

// Init on every page
document.addEventListener('DOMContentLoaded', async () => {
  await auth.init();
  initNavbar();
  setTimeout(initScrollReveal, 100);
});
