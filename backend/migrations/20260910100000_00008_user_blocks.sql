-- User blocking
CREATE TABLE "UserBlock" (
    "blocker_id" text NOT NULL,
    "blocked_id" text NOT NULL,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("blocker_id", "blocked_id"),
    CONSTRAINT "UserBlock_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT "UserBlock_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT "UserBlock_not_self_check" CHECK ("blocker_id" <> "blocked_id")
);

CREATE INDEX "UserBlock_blocked_id_idx" ON "UserBlock" ("blocked_id");