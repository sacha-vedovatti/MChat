CREATE TABLE "ServerBan" (
    "server_id" text NOT NULL,
    "user_id" text NOT NULL,
    "banned_by" text NOT NULL,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("server_id", "user_id"),
    CONSTRAINT "ServerBan_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "Server" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT "ServerBan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT "ServerBan_banned_by_fkey" FOREIGN KEY ("banned_by") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX "ServerBan_user_id_idx" ON "ServerBan" ("user_id");
