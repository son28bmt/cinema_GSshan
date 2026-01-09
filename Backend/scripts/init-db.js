require("../src/config/env");

const pool = require("../src/config/db");

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(120) DEFAULT NULL,
    display_name VARCHAR(120) DEFAULT NULL,
    avatar_url MEDIUMTEXT DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    gender ENUM('male', 'female', 'other') DEFAULT NULL,
    birth_date DATE DEFAULT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_users_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  ,
  `CREATE TABLE IF NOT EXISTS genres (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(140) NOT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_genres_slug (slug)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  ,
  `CREATE TABLE IF NOT EXISTS movies (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    original_title VARCHAR(255) DEFAULT NULL,
    studio VARCHAR(150) DEFAULT NULL,
    total_episodes INT DEFAULT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    status ENUM('ongoing', 'completed', 'upcoming') NOT NULL DEFAULT 'ongoing',
    country VARCHAR(100) DEFAULT NULL,
    release_year INT DEFAULT NULL,
    trailer_url TEXT DEFAULT NULL,
    backdrop_url MEDIUMTEXT DEFAULT NULL,
    poster_url MEDIUMTEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_movies_slug (slug)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  ,
  `CREATE TABLE IF NOT EXISTS movie_genres (
    movie_id BIGINT UNSIGNED NOT NULL,
    genre_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (movie_id, genre_id),
    CONSTRAINT fk_movie_genres_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    CONSTRAINT fk_movie_genres_genre FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  ,
  `CREATE TABLE IF NOT EXISTS episodes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    movie_id BIGINT UNSIGNED NOT NULL,
    episode_number INT NOT NULL,
    title VARCHAR(255) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    video_url TEXT DEFAULT NULL,
    thumbnail_url MEDIUMTEXT DEFAULT NULL,
    status ENUM('published', 'draft') NOT NULL DEFAULT 'draft',
    views BIGINT UNSIGNED NOT NULL DEFAULT 0,
    released_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_episode_movie_number (movie_id, episode_number),
    CONSTRAINT fk_episodes_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  ,
  `CREATE TABLE IF NOT EXISTS servers (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    endpoint_url TEXT NOT NULL,
    load_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
    status ENUM('active', 'maintenance', 'disabled') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  ,
  `CREATE TABLE IF NOT EXISTS comments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED DEFAULT NULL,
    movie_id BIGINT UNSIGNED DEFAULT NULL,
    episode_id BIGINT UNSIGNED DEFAULT NULL,
    parent_id BIGINT UNSIGNED DEFAULT NULL,
    author_name VARCHAR(120) DEFAULT NULL,
    author_ip VARCHAR(45) DEFAULT NULL,
    content TEXT NOT NULL,
    status ENUM('pending', 'approved', 'reported', 'pinned') NOT NULL DEFAULT 'pending',
    report_reason VARCHAR(200) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_comments_status (status),
    KEY idx_comments_created (created_at),
    KEY idx_comments_parent (parent_id),
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_comments_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE SET NULL,
    CONSTRAINT fk_comments_episode FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE SET NULL,
    CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  ,
  `CREATE TABLE IF NOT EXISTS ratings (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    movie_id BIGINT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_ratings_user_movie (user_id, movie_id),
    KEY idx_ratings_movie (movie_id),
    CONSTRAINT fk_ratings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ratings_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  ,
  `CREATE TABLE IF NOT EXISTS favorites (
    user_id BIGINT UNSIGNED NOT NULL,
    movie_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, movie_id),
    KEY idx_favorites_movie (movie_id),
    CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_favorites_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  ,
  `CREATE TABLE IF NOT EXISTS movie_subscriptions (
    user_id BIGINT UNSIGNED NOT NULL,
    movie_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, movie_id),
    KEY idx_movie_subscriptions_movie (movie_id),
    CONSTRAINT fk_movie_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_movie_subscriptions_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  ,
  `CREATE TABLE IF NOT EXISTS user_settings (
    user_id BIGINT UNSIGNED NOT NULL,
    notify_new_movies TINYINT(1) NOT NULL DEFAULT 1,
    notify_new_episodes TINYINT(1) NOT NULL DEFAULT 1,
    marketing_emails TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  ,
  `CREATE TABLE IF NOT EXISTS user_devices (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    device_name VARCHAR(150) DEFAULT NULL,
    user_agent VARCHAR(255) DEFAULT NULL,
    ip_address VARCHAR(64) DEFAULT NULL,
    last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user_devices_user (user_id),
    CONSTRAINT fk_user_devices_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  ,
  `CREATE TABLE IF NOT EXISTS watch_history (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    movie_id BIGINT UNSIGNED NOT NULL,
    episode_id BIGINT UNSIGNED DEFAULT NULL,
    watch_seconds INT UNSIGNED NOT NULL DEFAULT 0,
    watched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_watch_history_user (user_id),
    KEY idx_watch_history_movie (movie_id),
    CONSTRAINT fk_watch_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_watch_history_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    CONSTRAINT fk_watch_history_episode FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  ,
  `CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    audience ENUM('all', 'role', 'user') NOT NULL DEFAULT 'all',
    target_role ENUM('admin', 'user') DEFAULT NULL,
    target_user_id BIGINT UNSIGNED DEFAULT NULL,
    status ENUM('draft', 'sent') NOT NULL DEFAULT 'sent',
    created_by BIGINT UNSIGNED DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_notifications_audience (audience),
    KEY idx_notifications_target_user (target_user_id),
    KEY idx_notifications_status (status),
    CONSTRAINT fk_notifications_user FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_notifications_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  ,
  `CREATE TABLE IF NOT EXISTS user_notifications (
    user_id BIGINT UNSIGNED NOT NULL,
    notification_id BIGINT UNSIGNED NOT NULL,
    read_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (user_id, notification_id),
    KEY idx_user_notifications_notification (notification_id),
    CONSTRAINT fk_user_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_notifications_notification FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
];

const run = async () => {
  try {
    for (const sql of statements) {
      await pool.query(sql);
    }
    console.log("[db] schema ready");
  } catch (err) {
    console.error("[db] schema init failed", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

run();
