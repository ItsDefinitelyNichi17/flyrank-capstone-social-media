CREATE TABLE IF NOT EXISTS posts(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    source_type sourcetype,
    post_content TEXT,
    created_at TIMESTAMPT DEFAULT NOW(),
    updated_at TIMESTAMPT DEFAULT NOW()
)
