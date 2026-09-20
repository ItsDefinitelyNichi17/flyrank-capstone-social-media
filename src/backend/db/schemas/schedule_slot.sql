CREATE TABLE IF NOT EXISTS schedule_slots(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL UNIQUE REFERENCES variants(id),
    scheduled_at TIMESTAMP NOT NULL,
    state slotstate DEFAULT 'scheduled',
    last_error TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
