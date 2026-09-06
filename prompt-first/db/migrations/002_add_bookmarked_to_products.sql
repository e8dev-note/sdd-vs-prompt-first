ALTER TABLE products ADD COLUMN bookmarked INTEGER NOT NULL DEFAULT 0 CHECK (bookmarked IN (0, 1));
CREATE INDEX idx_products_bookmarked ON products (bookmarked);
