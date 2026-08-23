CREATE TABLE listing_favorites (
    id         UUID PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_listing_favorite_user_listing UNIQUE (user_id, listing_id)
);

CREATE INDEX listing_favorites_user_idx ON listing_favorites (user_id, created_at DESC);
