CREATE TABLE "ServerUserRole" (
    "server_id" text NOT NULL,
    "user_id" text NOT NULL,
    "role_id" integer NOT NULL,
    PRIMARY KEY ("server_id", "user_id", "role_id"),
    CONSTRAINT "ServerUserRole_server_id_user_id_fkey" FOREIGN KEY ("server_id", "user_id") REFERENCES "ServerUser" ("server_id", "user_id") ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT "ServerUserRole_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "ServerRole" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);

INSERT INTO "ServerUserRole" (server_id, user_id, role_id)
SELECT server_id, user_id, role_id
FROM "ServerUser"
WHERE role_id IS NOT NULL;

CREATE INDEX "ServerUserRole_role_id_idx" ON "ServerUserRole" ("role_id");
CREATE INDEX "ServerUserRole_user_id_idx" ON "ServerUserRole" ("user_id");

ALTER TABLE "ServerUser" DROP CONSTRAINT IF EXISTS "ServerUser_role_id_fkey";
DROP INDEX IF EXISTS "ServerUser_role_id_idx";
ALTER TABLE "ServerUser" DROP COLUMN IF EXISTS "role_id";