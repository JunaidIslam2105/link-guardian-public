-- Add deleted_at column to links table for soft deletion
ALTER TABLE links ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index on deleted_at for efficient queries
CREATE INDEX IF NOT EXISTS idx_links_deleted_at ON links (deleted_at);