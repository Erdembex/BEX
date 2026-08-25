CREATE TABLE user_blocks (
    id              UUID PRIMARY KEY,
    blocker_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_block_pair UNIQUE (blocker_user_id, blocked_user_id),
    CONSTRAINT chk_user_block_not_self CHECK (blocker_user_id <> blocked_user_id)
);

CREATE INDEX user_blocks_blocker_idx ON user_blocks (blocker_user_id, created_at DESC);
CREATE INDEX user_blocks_blocked_idx ON user_blocks (blocked_user_id);
