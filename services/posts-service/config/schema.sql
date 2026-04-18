-- =============================================
-- RUNNERS BLOG - PostgreSQL Database Schema
-- =============================================

-- Drop tables if they exist (for fresh setup)
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    bio TEXT,
    profile_pic VARCHAR(255) DEFAULT 'default-avatar.png',
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- POSTS TABLE
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('training', 'race-report', 'nutrition', 'gear', 'motivation', 'injury', 'general')),
    cover_image VARCHAR(255) DEFAULT 'default-cover.jpg',
    tags TEXT[],
    distance_km DECIMAL(6,2),
    duration_minutes INTEGER,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- COMMENTS TABLE
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LIKES TABLE
CREATE TABLE likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- INDEXES for performance
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);

-- =============================================
-- SEED DATA
-- =============================================

-- Insert sample users (password is 'password123' hashed)
INSERT INTO users (username, email, password_hash, full_name, bio, role) VALUES
('admin', 'admin@runnersblog.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'Blog administrator and passionate marathon runner.', 'admin'),
('john_runs', 'john@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John Smith', 'Ultra marathoner. 10 marathons completed. Training for my first 100K!', 'user'),
('sarah_pace', 'sarah@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah Johnson', '5K to marathon. Running coach and nutrition enthusiast.', 'user');

-- Insert sample posts
INSERT INTO posts (user_id, title, slug, content, excerpt, category, tags, distance_km, duration_minutes, views) VALUES
(1, 'My First Marathon: A Journey of 42.2 KM', 'my-first-marathon-journey', 
'<p>It was a crisp Sunday morning when I stood at the starting line of my first marathon. The crowd buzzed with nervous energy, and my legs felt both heavy and light at the same time. I had trained for 18 weeks, logging over 800 kilometers in preparation for this single day.</p>
<h2>The Training Journey</h2>
<p>Training for a marathon is as much a mental challenge as a physical one. There were days when I wanted to quit, when the early morning runs felt impossible, and when my body screamed for rest. But every step brought me closer to the start line.</p>
<p>My peak week hit 70 kilometers, a number that would have seemed impossible a year earlier. I learned to fuel properly, manage my pace, and most importantly, listen to my body.</p>
<h2>Race Day Experience</h2>
<p>The first 21 kilometers felt incredible. I was running within my target pace, the crowds cheering us on, and the adrenaline carrying me forward. Then came the wall — that infamous marathon wall at kilometer 30.</p>
<p>My legs began to feel like lead. Each step required a conscious decision. But I remembered my training mantra: <em>one step at a time</em>. I slowed my pace, focused on breathing, and kept moving forward.</p>
<h2>Crossing the Finish Line</h2>
<p>When I finally crossed the finish line in 4 hours and 23 minutes, tears streamed down my face. It was not just a physical achievement but a testament to what human determination can accomplish.</p>
<p>If you are considering your first marathon, my advice is simple: believe in your training, trust the process, and never give up when it gets hard. The finish line is worth every painful step.</p>',
'Standing at the starting line of my first marathon, 18 weeks of training had led to this moment. Here is my complete journey from couch to 42.2 kilometers.',
'race-report', ARRAY['marathon', 'first-race', 'training', 'personal-best'], 42.2, 263, 1240),

(2, 'Top 10 Running Shoes for 2025: A Runners Review', 'top-10-running-shoes-2025',
'<p>After testing dozens of running shoes throughout 2024 and 2025, I have narrowed down the absolute best options for runners of all types. Whether you are a beginner just starting out or an elite athlete chasing personal bests, the right shoe makes all the difference.</p>
<h2>1. Nike Vaporfly 3</h2>
<p>Still the gold standard for race day performance. The carbon fiber plate and ZoomX foam combination delivers unmatched energy return. Perfect for marathons and half-marathons when every second counts.</p>
<h2>2. ASICS Gel-Kayano 31</h2>
<p>For overpronators, the Kayano continues to be a reliable workhorse. The new FF Blast+ Eco foam provides excellent cushioning without sacrificing stability. Great for daily training runs.</p>
<h2>3. Saucony Endorphin Speed 4</h2>
<p>The best value carbon-plated shoe on the market. At a lower price point than its competitors, the Endorphin Speed 4 delivers impressive performance for tempo runs and race days alike.</p>
<h2>4. Brooks Ghost 16</h2>
<p>The most universally recommended shoe for beginners and experienced runners alike. Neutral cushioning, reliable durability, and a comfortable fit straight out of the box.</p>
<h2>5. Hoka Clifton 9</h2>
<p>Maximum cushioning for long training runs and recovery days. The Clifton 9 absorbs impact beautifully while maintaining a surprisingly light feel underfoot.</p>
<h2>Choosing the Right Shoe</h2>
<p>Remember that the best shoe is the one that fits your foot correctly and matches your running style. Visit a specialty running store for a proper gait analysis before making your purchase.</p>',
'After testing dozens of pairs throughout 2024-2025, here are the absolute best running shoes for every type of runner — from beginners to elite athletes.',
'gear', ARRAY['shoes', 'gear', 'review', 'equipment'], NULL, NULL, 890),

(3, 'The Science of Running Nutrition: What to Eat and When', 'science-of-running-nutrition',
'<p>Nutrition is the often-overlooked pillar of running performance. You can have perfect form, an ideal training plan, and the best shoes, but without proper fueling, you will consistently underperform your potential.</p>
<h2>Pre-Run Nutrition</h2>
<p>For runs under 60 minutes, your glycogen stores from the previous meal are typically sufficient. For longer runs, consume a meal rich in complex carbohydrates 2-3 hours before, or a small carbohydrate snack 30-60 minutes before.</p>
<p>Ideal pre-run foods include oatmeal with banana, toast with peanut butter, or a simple rice and chicken meal. Avoid high-fiber foods that can cause GI distress during the run.</p>
<h2>During the Run</h2>
<p>For runs exceeding 60-75 minutes, you need to replenish carbohydrates. The standard recommendation is 30-60 grams of carbohydrates per hour. Energy gels, chews, bananas, and sports drinks are all effective options.</p>
<p>Hydration is equally critical. Drink to thirst rather than forcing fluids, and consider electrolyte replacement for runs over 90 minutes in warm conditions.</p>
<h2>Post-Run Recovery</h2>
<p>The 30-60 minute window after a hard run is crucial for recovery. Aim for a 3:1 or 4:1 carbohydrate to protein ratio. Chocolate milk, Greek yogurt with fruit, or a proper recovery shake all work well.</p>
<h2>Daily Nutrition for Runners</h2>
<p>Consistently fuel your training with a diet rich in whole grains, lean proteins, healthy fats, and plenty of fruits and vegetables. Periodize your carbohydrate intake to match your training load — more carbs on hard training days, fewer on easy or rest days.</p>',
'Nutrition is the most overlooked pillar of running performance. Learn exactly what to eat before, during, and after your runs to maximize your training results.',
'nutrition', ARRAY['nutrition', 'diet', 'performance', 'recovery'], NULL, NULL, 567),

(1, '10-Week 5K Training Plan for Absolute Beginners', '10-week-5k-training-plan-beginners',
'<p>Starting your running journey can feel overwhelming. Where do you begin? How far should you run? How do you avoid injury? This 10-week plan answers all of those questions and will take you from walking to completing your first 5K.</p>
<h2>Before You Start</h2>
<p>Invest in a proper pair of running shoes from a specialty store. Get a gait analysis if possible. Wear moisture-wicking clothing. And most importantly — start slow. The biggest mistake beginners make is starting too fast.</p>
<h2>Weeks 1-2: Walk-Run Foundation</h2>
<p>Three sessions per week. Alternate between 1 minute of jogging and 2 minutes of walking for 20 minutes total. This is not as easy as it sounds! Focus on breathing and maintaining a conversational pace during the jogging intervals.</p>
<h2>Weeks 3-4: Building Intervals</h2>
<p>Increase jogging intervals to 2 minutes with 1 minute walking recovery. Total duration 25 minutes. By the end of week 4, you should complete a full 20-minute run without stopping.</p>
<h2>Weeks 5-7: Continuous Running</h2>
<p>Work up to continuous 25-30 minute runs. Pace should still be conversational — if you cannot speak in sentences, you are going too fast. These weeks build aerobic base.</p>
<h2>Weeks 8-10: Race Preparation</h2>
<p>Final three weeks focus on building to 30-35 minute runs and including one parkrun or time trial to simulate race conditions. In the final week, reduce volume to arrive at the start line fresh.</p>
<h2>Race Day Tips</h2>
<p>Start slower than you think you need to. The course will feel different from training. Trust your preparation. And most importantly — enjoy the experience of completing your very first 5K!</p>',
'Go from couch to 5K in just 10 weeks with this beginner-friendly training plan. Includes week-by-week workouts, tips, and race day advice.',
'training', ARRAY['5k', 'beginners', 'training-plan', 'couch-to-5k'], 5.0, NULL, 2100),

(2, 'Overcoming Running Injuries: My Experience with IT Band Syndrome', 'overcoming-it-band-syndrome',
'<p>Six weeks before my goal marathon, my right knee began screaming. Every step sent a sharp pain shooting up my outer thigh. The diagnosis: IT Band Syndrome — the bane of many a runner''s existence.</p>
<h2>What is IT Band Syndrome?</h2>
<p>The iliotibial band is a thick connective tissue running from your hip to your shin along the outside of your leg. When inflamed, it causes sharp pain on the outer side of the knee, particularly when running downhill or on banked surfaces.</p>
<p>Common causes include increasing mileage too quickly, weak hip abductors, running on cambered roads, and worn-out shoes.</p>
<h2>The Road to Recovery</h2>
<p>My physiotherapist put me on a strict protocol. First and most importantly: rest from running for two weeks. This was mentally devastating but physically necessary.</p>
<p>The rehabilitation program included foam rolling (painful but effective), hip strengthening exercises like clamshells and side-lying leg raises, and graduated return-to-run protocols starting with just 5 minutes of easy jogging.</p>
<h2>Prevention Going Forward</h2>
<p>I learned to increase mileage no more than 10% per week. I added hip strengthening to every training week. I replaced my shoes at 700 kilometers rather than pushing them to 1000. And I listen to my body much more carefully now.</p>
<h2>The Comeback</h2>
<p>Six months later, I finished that marathon — a different race, but the same dream. Injury is not the end of your running story. It is often the beginning of a smarter, stronger chapter.</p>',
'IT Band Syndrome stopped me in my tracks 6 weeks before my goal marathon. Here is how I recovered, what I learned, and how I came back stronger.',
'injury', ARRAY['injury', 'it-band', 'recovery', 'rehabilitation'], NULL, NULL, 743);

-- Insert sample comments
INSERT INTO comments (post_id, user_id, content) VALUES
(1, 2, 'This is so inspiring! I am training for my first marathon right now and this gives me so much motivation. Thank you for sharing!'),
(1, 3, 'Congratulations on finishing! The wall at km 30 is no joke. I remember my first marathon vividly. Great advice for beginners.'),
(2, 1, 'Great comprehensive review! I personally run in the Hoka Clifton and totally agree with your assessment. Incredible cushioning.'),
(4, 2, 'I used a similar plan for my first 5K two years ago. Now I am running half marathons! This is the perfect starting point for any beginner.'),
(5, 3, 'IT Band Syndrome is the worst. Hip strengthening exercises were a game changer for me too. Clamshells every day!');

-- Insert sample likes
INSERT INTO likes (post_id, user_id) VALUES
(1, 2), (1, 3), (2, 1), (2, 3), (3, 1), (3, 2), (4, 2), (4, 3), (5, 1), (5, 3);

-- Update view function trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
