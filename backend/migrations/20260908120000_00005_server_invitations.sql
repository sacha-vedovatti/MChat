CREATE TABLE "ServerInvitation" (
    "token" text NOT NULL,
    "server_id" text NOT NULL,
    "created_by" text NOT NULL,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("token"),
    CONSTRAINT "ServerInvitation_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "Server" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT "ServerInvitation_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX "ServerInvitation_server_id_idx" ON "ServerInvitation" ("server_id");
CREATE INDEX "ServerInvitation_expires_at_idx" ON "ServerInvitation" ("expires_at");
