CREATE TABLE IF NOT EXISTS publish_attempts(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID REFERENCES variants(id),
    status attemptstatus,
    executed_at TIMESTAMP DEFAULT NOW()
);
