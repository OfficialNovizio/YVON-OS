-- 038_venture_local_repo_path.sql
-- Per-venture local filesystem path for the cloned repo.
-- Used when War Room is in "Local" repo mode so agents can use Read/Bash/Glob/Grep
-- directly on the developer's machine instead of GitHub API.

ALTER TABLE ventures ADD COLUMN IF NOT EXISTS local_repo_path TEXT;
