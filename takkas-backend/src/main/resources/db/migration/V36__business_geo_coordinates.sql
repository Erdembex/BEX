ALTER TABLE business_profiles
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_business_profiles_geo
    ON business_profiles (city, district)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
