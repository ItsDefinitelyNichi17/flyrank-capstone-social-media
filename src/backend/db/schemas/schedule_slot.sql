CREATE TABLE IF NOT EXISTS schedule_slots(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID REFERENCES variants(id),
    schedule_slots TIMESTAMP,
    state slotstate DEFAULT 'queue',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
