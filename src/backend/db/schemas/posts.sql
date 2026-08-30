CREATE TABLE IF NOT EXISTS posts(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type sourcetype,
    post_content TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
)
