CREATE TABLE IF NOT EXISTS variants(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id),
    status poststatus DEFAULT 'draft',
    hashtags TEXT[],
    platform platform,
    variant_content TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
