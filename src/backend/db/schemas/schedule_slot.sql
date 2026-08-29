CREATE TABLE IF NOT EXISTS schedule_slots(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID REFERENCES variants(variant_id),
    schedule_slots TIMESTAMP,
    state slotstate DEFAULT 'queue',
    created_at TIMESTAMPT DEFAULT NOW(),
    updated_at TIMESTAMPT DEFAULT NOW()
);
