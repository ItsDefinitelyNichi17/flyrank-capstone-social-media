CREATE TABLE IF NOT EXIST variants(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(variant_id),
    status variantstatus DEFAULT 'draft',
    hashtags TEXT[],
    platform platform,
    variant_content TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
)
