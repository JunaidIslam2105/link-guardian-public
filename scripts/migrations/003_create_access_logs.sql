-- Create access_logs table to track link access data
CREATE TABLE IF NOT EXISTS access_logs (
    id BIGSERIAL PRIMARY KEY,
    link_id BIGINT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    accessed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip_address VARCHAR(45) NOT NULL,  -- Supports both IPv4 and IPv6 addresses
    user_agent TEXT,                  -- Client's browser/device information
    referer TEXT,                     -- Where the visitor came from
    country VARCHAR(2),               -- ISO country code (can be populated later)
    city VARCHAR(100),                -- City name (can be populated later)
    device_type VARCHAR(20),          -- Mobile, desktop, tablet, etc.
    browser VARCHAR(50),              -- Chrome, Firefox, Safari, etc.
    os VARCHAR(50)                    -- Windows, macOS, iOS, Android, etc.
);

-- Create index on link_id for efficient queries
CREATE INDEX IF NOT EXISTS idx_access_logs_link_id ON access_logs (link_id);

-- Create index on accessed_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_access_logs_accessed_at ON access_logs (accessed_at);