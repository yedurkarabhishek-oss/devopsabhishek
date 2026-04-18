# 🏃 RunnersBlog — Final Year Project

A full-stack **3-Tier Runners Blog Website** built with:
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js + Express.js (REST API)
- **Database**: PostgreSQL

---

## 📁 Project Structure

```
runners-blog/
├── backend/
│   ├── config/
│   │   ├── db.js              ← PostgreSQL connection pool
│   │   └── schema.sql         ← Database schema + seed data
│   ├── controllers/
│   │   ├── authController.js  ← Register, login, profile
│   │   ├── postsController.js ← CRUD for blog posts
│   │   └── commentsController.js ← Comments & likes
│   ├── middleware/
│   │   └── auth.js            ← JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js
│   │   ├── posts.js
│   │   ├── comments.js
│   │   └── likes.js
│   ├── .env.example           ← Copy to .env and configure
│   ├── package.json
│   └── server.js              ← Main Express server
│
└── frontend/
    ├── css/
    │   └── style.css          ← Complete stylesheet
    ├── js/
    │   └── api.js             ← API client + utilities
    ├── index.html             ← Homepage
    ├── blog.html              ← Blog listing with filters
    ├── post.html              ← Single post + comments
    ├── create-post.html       ← Rich text post editor
    ├── dashboard.html         ← User dashboard & profile
    ├── login.html             ← Login page
    ├── register.html          ← Registration page
    └── about.html             ← About / tech stack page
```

---

## 🚀 Setup Instructions

### Step 1 — Prerequisites

Make sure you have installed:
- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/) (v14+)
- npm (comes with Node.js)

### Step 2 — Create PostgreSQL Database

```bash
# Open psql terminal
psql -U postgres

# Create the database
CREATE DATABASE runners_blog;

# Exit psql
\q
```

### Step 3 — Run the Database Schema

```bash
# Run the SQL schema (creates tables + inserts sample data)
psql -U postgres -d runners_blog -f backend/config/schema.sql
```

### Step 4 — Configure Environment Variables

```bash
# Go to backend folder
cd backend

# Copy the example env file
cp .env.example .env

# Edit .env with your database credentials
nano .env   # or open in your text editor
```

Edit these values in `.env`:
```
DB_PASSWORD=your_actual_postgres_password
JWT_SECRET=any_long_random_string_here
```

### Step 5 — Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 6 — Start the Server

```bash
# Development mode (auto-restart)
npm run dev

# OR production mode
npm start
```

You should see:
```
🏃 =====================================
🏃 RUNNERS BLOG SERVER STARTED
🏃 =====================================
📡 API Server: http://localhost:5000
🌐 Frontend:   http://localhost:5000
✅ Connected to PostgreSQL database
```

### Step 7 — Open the Website

Open your browser and go to: **http://localhost:5000**

---

## 🔑 Demo Accounts

| Role  | Email                    | Password    |
|-------|--------------------------|-------------|
| Admin | admin@runnersblog.com    | password123 |
| User  | john@example.com         | password123 |
| User  | sarah@example.com        | password123 |

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint              | Auth | Description           |
|--------|-----------------------|------|-----------------------|
| POST   | /api/auth/register    | No   | Register new user     |
| POST   | /api/auth/login       | No   | Login & get JWT token |
| GET    | /api/auth/me          | Yes  | Get current user info |
| PUT    | /api/auth/profile     | Yes  | Update profile        |
| PUT    | /api/auth/change-password | Yes | Change password   |

### Posts
| Method | Endpoint               | Auth | Description              |
|--------|------------------------|------|--------------------------|
| GET    | /api/posts             | No   | Get all posts (paginated)|
| GET    | /api/posts/featured    | No   | Get featured/popular posts|
| GET    | /api/posts/stats       | No   | Get blog statistics      |
| GET    | /api/posts/:slug       | No   | Get single post by slug  |
| GET    | /api/posts/me/my-posts | Yes  | Get current user's posts |
| GET    | /api/posts/user/:id    | No   | Get posts by user ID     |
| POST   | /api/posts             | Yes  | Create new post          |
| PUT    | /api/posts/:id         | Yes  | Update post              |
| DELETE | /api/posts/:id         | Yes  | Delete post              |

### Comments & Likes
| Method | Endpoint           | Auth | Description      |
|--------|--------------------|------|------------------|
| POST   | /api/comments      | Yes  | Add a comment    |
| DELETE | /api/comments/:id  | Yes  | Delete a comment |
| POST   | /api/likes/toggle  | Yes  | Toggle like      |

---

## 🏗️ 3-Tier Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTATION TIER                     │
│              HTML + CSS + JavaScript                    │
│         (index.html, blog.html, post.html, etc.)        │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP REST API (JSON)
                        │ Bearer JWT Token
┌───────────────────────▼─────────────────────────────────┐
│                   APPLICATION TIER                      │
│                Node.js + Express.js                     │
│        Routes → Controllers → Middleware                │
│           JWT Auth, CORS, Input Validation              │
└───────────────────────┬─────────────────────────────────┘
                        │ SQL Queries (pg pool)
┌───────────────────────▼─────────────────────────────────┐
│                     DATA TIER                           │
│                    PostgreSQL                           │
│         users, posts, comments, likes tables            │
│           Indexes, Foreign Keys, Constraints            │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ Features

- ✅ User registration & login with JWT
- ✅ Create, edit, delete blog posts
- ✅ Rich text editor with formatting toolbar
- ✅ Categories: Training, Race Report, Nutrition, Gear, Injury, Motivation
- ✅ Running stats per post (distance, duration, pace)
- ✅ Like / unlike posts
- ✅ Comment on posts
- ✅ Search & filter posts
- ✅ Sort by latest, most liked, most viewed
- ✅ User dashboard with post management
- ✅ Edit profile & change password
- ✅ Save drafts
- ✅ Related posts
- ✅ Responsive mobile design
- ✅ Scroll reveal animations
- ✅ Toast notifications
- ✅ Pagination

---

## 🎓 Final Year Project Notes

This project demonstrates:
1. **3-Tier Architecture** — clear separation of presentation, application, and data layers
2. **RESTful API Design** — proper HTTP methods, status codes, and JSON responses
3. **Authentication & Authorization** — JWT tokens, bcrypt password hashing, middleware guards
4. **Database Design** — normalized schema, foreign keys, indexes, seed data
5. **Frontend Development** — responsive CSS, async JS, DOM manipulation
6. **Security** — password hashing, JWT verification, CORS configuration, input validation

---

*Built with ❤️ for the running community*
