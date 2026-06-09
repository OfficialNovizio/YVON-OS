-- Add thumbnail/preview image URL to social posts (captured from scraper displayUrl).
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
