-- Reset Moodle-related fields to null for all users
-- This query will set all Moodle sync fields to null in the User table

UPDATE "User" 
SET 
    "lastMoodleSync" = NULL,
    "moodlePassword" = NULL,
    "moodleUserId" = NULL,
    "moodleUsername" = NULL
WHERE 
    "lastMoodleSync" IS NOT NULL 
    OR "moodlePassword" IS NOT NULL 
    OR "moodleUserId" IS NOT NULL 
    OR "moodleUsername" IS NOT NULL;

-- Alternative query to reset ALL users (including those with already null values)
-- Uncomment the query below if you want to reset all users regardless of current values:

-- UPDATE "User" 
-- SET 
--     "lastMoodleSync" = NULL,
--     "moodlePassword" = NULL,
--     "moodleUserId" = NULL,
--     "moodleUsername" = NULL;

-- Query to check how many users will be affected before running the update:
-- SELECT COUNT(*) as affected_users
-- FROM "User" 
-- WHERE 
--     "lastMoodleSync" IS NOT NULL 
--     OR "moodlePassword" IS NOT NULL 
--     OR "moodleUserId" IS NOT NULL 
--     OR "moodleUsername" IS NOT NULL;

-- Query to verify the results after running the update:
-- SELECT 
--     COUNT(*) as total_users,
--     COUNT("lastMoodleSync") as users_with_lastMoodleSync,
--     COUNT("moodlePassword") as users_with_moodlePassword,
--     COUNT("moodleUserId") as users_with_moodleUserId,
--     COUNT("moodleUsername") as users_with_moodleUsername
-- FROM "User";
