-- Friendship system
DO $$
BEGIN
  CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE "Friendship" (
    "id" text NOT NULL,
    "requester_id" text NOT NULL,
    "addressee_id" text NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" timestamp(3) NULL,
    PRIMARY KEY ("id"),
    CONSTRAINT "Friendship_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT "Friendship_addressee_id_fkey" FOREIGN KEY ("addressee_id") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT "Friendship_not_self_check" CHECK ("requester_id" <> "addressee_id")
);

-- One row per unordered pair of users, regardless of who requested whom.
CREATE UNIQUE INDEX "Friendship_pair_key" ON "Friendship" (LEAST("requester_id", "addressee_id"), GREATEST("requester_id", "addressee_id"));
CREATE INDEX "Friendship_requester_id_idx" ON "Friendship" ("requester_id");
CREATE INDEX "Friendship_addressee_id_idx" ON "Friendship" ("addressee_id");
CREATE INDEX "Friendship_status_idx" ON "Friendship" ("status");

-- Direct messages
CREATE TABLE "DirectConversation" (
    "id" text NOT NULL,
    "user_a_id" text NOT NULL,
    "user_b_id" text NOT NULL,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id"),
    CONSTRAINT "DirectConversation_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT "DirectConversation_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT "DirectConversation_not_self_check" CHECK ("user_a_id" <> "user_b_id")
);

-- One conversation per unordered pair of users.
CREATE UNIQUE INDEX "DirectConversation_pair_key" ON "DirectConversation" (LEAST("user_a_id", "user_b_id"), GREATEST("user_a_id", "user_b_id"));
CREATE INDEX "DirectConversation_user_a_id_idx" ON "DirectConversation" ("user_a_id");
CREATE INDEX "DirectConversation_user_b_id_idx" ON "DirectConversation" ("user_b_id");

CREATE TABLE "DirectMessage" (
    "id" text NOT NULL,
    "conversation_id" text NOT NULL,
    "sender_id" text NOT NULL,
    "content" text NOT NULL,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id"),
    CONSTRAINT "DirectMessage_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "DirectConversation" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT "DirectMessage_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX "DirectMessage_conversation_id_idx" ON "DirectMessage" ("conversation_id");
CREATE INDEX "DirectMessage_sender_id_idx" ON "DirectMessage" ("sender_id");
