-- Fix SessionSlot foreign key constraint issue
-- This script sets speakerId to NULL for SessionSlot records where the speakerId doesn't exist in unifiedUser table

-- First, let's see what we're dealing with
SELECT 
    ss.id as session_slot_id,
    ss.speakerId,
    ss.topicName,
    CASE 
        WHEN uu.id IS NULL THEN 'INVALID - Will be fixed'
        ELSE 'VALID'
    END as status
FROM "SessionSlot" ss
LEFT JOIN "unifiedUser" uu ON ss.speakerId = uu.id
WHERE ss.speakerId IS NOT NULL;

-- Now fix the invalid references by setting speakerId to NULL
UPDATE "SessionSlot" 
SET "speakerId" = NULL 
WHERE "speakerId" IS NOT NULL 
AND "speakerId" NOT IN (SELECT id FROM "unifiedUser");

-- Verify the fix
SELECT 
    ss.id as session_slot_id,
    ss.speakerId,
    ss.topicName,
    CASE 
        WHEN uu.id IS NULL AND ss.speakerId IS NOT NULL THEN 'STILL INVALID'
        WHEN ss.speakerId IS NULL THEN 'FIXED - Set to NULL'
        ELSE 'VALID'
    END as status
FROM "SessionSlot" ss
LEFT JOIN "unifiedUser" uu ON ss.speakerId = uu.id
WHERE ss.speakerId IS NOT NULL; 