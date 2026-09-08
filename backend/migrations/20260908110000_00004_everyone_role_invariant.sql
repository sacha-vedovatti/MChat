-- Keep exactly one immutable default role per server.
UPDATE "ServerRole"
SET is_default = false
WHERE is_default = true;

WITH chosen AS (
    SELECT DISTINCT ON (server_id) id, server_id
    FROM "ServerRole"
    ORDER BY server_id, (name = '@everyone') DESC, position ASC, id ASC
)
UPDATE "ServerRole" role
SET name = '@everyone', is_default = true
FROM chosen
WHERE role.id = chosen.id;

CREATE UNIQUE INDEX IF NOT EXISTS "ServerRole_one_default_per_server_idx"
ON "ServerRole" (server_id)
WHERE is_default = true;

INSERT INTO "ServerUserRole" (server_id, user_id, role_id)
SELECT su.server_id, su.user_id, sr.id
FROM "ServerUser" su
JOIN "ServerRole" sr ON sr.server_id = su.server_id AND sr.is_default = true
WHERE NOT EXISTS (
    SELECT 1
    FROM "ServerUserRole" existing
    WHERE existing.server_id = su.server_id
      AND existing.user_id = su.user_id
      AND existing.role_id = sr.id
);