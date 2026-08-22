CREATE TABLE IF NOT EXISTS application_submission_attachments (
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    attachment_url VARCHAR(2048) NOT NULL
);

CREATE INDEX IF NOT EXISTS application_submission_attachments_app_idx
    ON application_submission_attachments(application_id);

CREATE TABLE IF NOT EXISTS application_submission_links (
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    link_url VARCHAR(2048) NOT NULL
);

CREATE INDEX IF NOT EXISTS application_submission_links_app_idx
    ON application_submission_links(application_id);
