ALTER TABLE conversations ALTER COLUMN application_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS conv_direct_pair_uidx
    ON conversations (business_user_id, individual_user_id)
    WHERE application_id IS NULL;
