-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    auth0_id TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- States table (Malaysian states)
CREATE TABLE IF NOT EXISTS states (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    passport_booklet_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Places of Interest table
CREATE TABLE IF NOT EXISTS places_of_interest (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    state_id TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    radius INTEGER NOT NULL DEFAULT 100, -- in meters
    image_url TEXT,
    stamp_image_url TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (state_id) REFERENCES states(id)
);

-- User Passports table (purchased state passports)
CREATE TABLE IF NOT EXISTS user_passports (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    state_id TEXT NOT NULL,
    purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    completion_percentage REAL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (state_id) REFERENCES states(id),
    UNIQUE(user_id, state_id)
);

-- User Stamps table (collected stamps)
CREATE TABLE IF NOT EXISTS user_stamps (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    place_of_interest_id TEXT NOT NULL,
    collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    image_url TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (place_of_interest_id) REFERENCES places_of_interest(id),
    UNIQUE(user_id, place_of_interest_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth0_id ON users(auth0_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_places_of_interest_state_id ON places_of_interest(state_id);
CREATE INDEX IF NOT EXISTS idx_places_of_interest_location ON places_of_interest(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_user_passports_user_id ON user_passports(user_id);
CREATE INDEX IF NOT EXISTS idx_user_passports_state_id ON user_passports(state_id);
CREATE INDEX IF NOT EXISTS idx_user_stamps_user_id ON user_stamps(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stamps_place_id ON user_stamps(place_of_interest_id);
CREATE INDEX IF NOT EXISTS idx_user_stamps_collected_at ON user_stamps(collected_at);

-- Insert sample Malaysian states
INSERT OR IGNORE INTO states (id, name, code, description, image_url, passport_booklet_url) VALUES
('johor', 'Johor', 'JHR', 'The southern gateway to Malaysia', 'https://example.com/johor.jpg', 'https://example.com/johor-passport.pdf'),
('kedah', 'Kedah', 'KDH', 'The rice bowl of Malaysia', 'https://example.com/kedah.jpg', 'https://example.com/kedah-passport.pdf'),
('kelantan', 'Kelantan', 'KTN', 'The cradle of Malay culture', 'https://example.com/kelantan.jpg', 'https://example.com/kelantan-passport.pdf'),
('melaka', 'Melaka', 'MLK', 'The historic state', 'https://example.com/melaka.jpg', 'https://example.com/melaka-passport.pdf'),
('negeri-sembilan', 'Negeri Sembilan', 'NSN', 'The cultural heritage state', 'https://example.com/negeri-sembilan.jpg', 'https://example.com/negeri-sembilan-passport.pdf'),
('pahang', 'Pahang', 'PHG', 'The largest state in Peninsular Malaysia', 'https://example.com/pahang.jpg', 'https://example.com/pahang-passport.pdf'),
('perak', 'Perak', 'PRK', 'The silver state', 'https://example.com/perak.jpg', 'https://example.com/perak-passport.pdf'),
('perlis', 'Perlis', 'PLS', 'The smallest state in Malaysia', 'https://example.com/perlis.jpg', 'https://example.com/perlis-passport.pdf'),
('penang', 'Penang', 'PNG', 'The Pearl of the Orient', 'https://example.com/penang.jpg', 'https://example.com/penang-passport.pdf'),
('sabah', 'Sabah', 'SBH', 'Land below the wind', 'https://example.com/sabah.jpg', 'https://example.com/sabah-passport.pdf'),
('sarawak', 'Sarawak', 'SWK', 'Land of the hornbills', 'https://example.com/sarawak.jpg', 'https://example.com/sarawak-passport.pdf'),
('selangor', 'Selangor', 'SGR', 'The most developed state', 'https://example.com/selangor.jpg', 'https://example.com/selangor-passport.pdf'),
('terengganu', 'Terengganu', 'TRG', 'The state of turtles', 'https://example.com/terengganu.jpg', 'https://example.com/terengganu-passport.pdf'),
('kuala-lumpur', 'Kuala Lumpur', 'KUL', 'The capital city', 'https://example.com/kuala-lumpur.jpg', 'https://example.com/kuala-lumpur-passport.pdf'),
('labuan', 'Labuan', 'LBN', 'The duty-free island', 'https://example.com/labuan.jpg', 'https://example.com/labuan-passport.pdf'),
('putrajaya', 'Putrajaya', 'PJY', 'The administrative capital', 'https://example.com/putrajaya.jpg', 'https://example.com/putrajaya-passport.pdf');

-- Insert sample places of interest for Kuala Lumpur
INSERT OR IGNORE INTO places_of_interest (id, name, description, state_id, latitude, longitude, radius, image_url, stamp_image_url, category) VALUES
('petronas-towers', 'Petronas Twin Towers', 'Iconic twin towers and symbol of Malaysia', 'kuala-lumpur', 3.1578, 101.7119, 100, 'https://example.com/petronas.jpg', 'https://example.com/petronas-stamp.jpg', 'Landmark'),
('batu-caves', 'Batu Caves', 'Limestone caves with Hindu temples', 'kuala-lumpur', 3.2370, 101.6840, 150, 'https://example.com/batu-caves.jpg', 'https://example.com/batu-caves-stamp.jpg', 'Religious'),
('kl-tower', 'KL Tower', 'Telecommunications tower with observation deck', 'kuala-lumpur', 3.1529, 101.7029, 100, 'https://example.com/kl-tower.jpg', 'https://example.com/kl-tower-stamp.jpg', 'Landmark'),
('central-market', 'Central Market', 'Cultural and arts market', 'kuala-lumpur', 3.1423, 101.6966, 50, 'https://example.com/central-market.jpg', 'https://example.com/central-market-stamp.jpg', 'Culture'),
('merdeka-square', 'Merdeka Square', 'Historic square where independence was declared', 'kuala-lumpur', 3.1478, 101.6936, 75, 'https://example.com/merdeka-square.jpg', 'https://example.com/merdeka-square-stamp.jpg', 'Historical');

-- Insert sample places of interest for Penang
INSERT OR IGNORE INTO places_of_interest (id, name, description, state_id, latitude, longitude, radius, image_url, stamp_image_url, category) VALUES
('george-town', 'George Town', 'UNESCO World Heritage Site', 'penang', 5.4164, 100.3327, 200, 'https://example.com/george-town.jpg', 'https://example.com/george-town-stamp.jpg', 'Historical'),
('penang-hill', 'Penang Hill', 'Hill station with panoramic views', 'penang', 5.4205, 100.2695, 150, 'https://example.com/penang-hill.jpg', 'https://example.com/penang-hill-stamp.jpg', 'Nature'),
('kek-lok-si', 'Kek Lok Si Temple', 'Largest Buddhist temple in Malaysia', 'penang', 5.3977, 100.2723, 100, 'https://example.com/kek-lok-si.jpg', 'https://example.com/kek-lok-si-stamp.jpg', 'Religious'),
('gurney-drive', 'Gurney Drive', 'Famous seafront promenade', 'penang', 5.4376, 100.3103, 100, 'https://example.com/gurney-drive.jpg', 'https://example.com/gurney-drive-stamp.jpg', 'Recreation'),
('clan-houses', 'Clan Houses', 'Traditional Chinese clan houses', 'penang', 5.4141, 100.3315, 75, 'https://example.com/clan-houses.jpg', 'https://example.com/clan-houses-stamp.jpg', 'Culture');