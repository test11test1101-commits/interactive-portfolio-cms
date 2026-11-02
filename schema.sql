-- ============================================================================
-- TiDB / MySQL Schema for Interactive Portfolio CMS
-- Compatible with TiDB Serverless, MySQL 8.0+, and SQLite3
-- ============================================================================

-- 1. Brand & Rail Physics Configuration
CREATE TABLE IF NOT EXISTS portfolio_config (
  id INT PRIMARY KEY DEFAULT 1,
  monogram VARCHAR(10) NOT NULL DEFAULT 'W.',
  brand_name VARCHAR(100) NOT NULL DEFAULT 'LYRCH // STUDIO',
  role_title VARCHAR(100) NOT NULL DEFAULT 'Creative Engineer',
  status_text VARCHAR(100) NOT NULL DEFAULT 'Available Q4 2026',
  status_active BOOLEAN NOT NULL DEFAULT TRUE,
  contact_email VARCHAR(150) NOT NULL DEFAULT 'contact@portfolio.dev',
  wire_tension DECIMAL(3, 2) NOT NULL DEFAULT 0.55,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Projects Suspended on the Clothesline Rail
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(80) PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  tagline VARCHAR(255) NOT NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'Creative & 3D',
  year VARCHAR(20) NOT NULL DEFAULT '2026',
  badge VARCHAR(80) NOT NULL DEFAULT 'FEATURED',
  image VARCHAR(255) NOT NULL,
  tech JSON,
  metrics JSON,
  overview TEXT,
  architecture TEXT,
  highlights JSON,
  demo_url VARCHAR(255),
  github_url VARCHAR(255),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Architectural Capabilities Bento Grid
CREATE TABLE IF NOT EXISTS capabilities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  icon VARCHAR(20) NOT NULL DEFAULT '⚡',
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- 4. Career Journey & Milestones Timeline
CREATE TABLE IF NOT EXISTS timeline (
  id INT AUTO_INCREMENT PRIMARY KEY,
  period VARCHAR(60) NOT NULL,
  location VARCHAR(120) NOT NULL,
  role_title VARCHAR(150) NOT NULL,
  company VARCHAR(150) NOT NULL,
  summary TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);
