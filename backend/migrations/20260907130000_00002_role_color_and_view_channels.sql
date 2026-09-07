DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM pg_enum e
		JOIN pg_type t ON t.oid = e.enumtypid
		WHERE t.typname = 'ServerPermissions' AND e.enumlabel = 'VIEW_CHANNEL'
	) AND NOT EXISTS (
		SELECT 1
		FROM pg_enum e
		JOIN pg_type t ON t.oid = e.enumtypid
		WHERE t.typname = 'ServerPermissions' AND e.enumlabel = 'VIEW_CHANNELS'
	) THEN
		ALTER TYPE "ServerPermissions"
		RENAME VALUE 'VIEW_CHANNEL' TO 'VIEW_CHANNELS';
	END IF;
END $$;

ALTER TABLE "ServerRole"
ADD COLUMN IF NOT EXISTS "color" text NOT NULL DEFAULT '#99AAB5';