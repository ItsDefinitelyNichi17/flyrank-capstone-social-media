-- INIT ALL MY CUSTOM TYPES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attemptstatus') THEN
        CREATE TYPE attemptstatus AS ENUM ('success', 'failed');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'slotstate') THEN
        CREATE TYPE slotstate AS ENUM ('queue', 'empty', 'complete', 'failed');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform') THEN
        CREATE TYPE platform AS ENUM ('x', 'discord', 'linkedin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sourcetype') THEN
        CREATE TYPE sourcetype AS ENUM ('url', 'markdown');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'poststatus') THEN
        CREATE TYPE poststatus AS ENUM ('draft', 'approved', 'rejected', 'queued', 'published', 'failed');
    END IF;
END $$;
