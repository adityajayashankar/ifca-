-- Generate unifiedUser records for Users without existing unifiedUser record
INSERT INTO "unifiedUser" ("email", "userId", "privacyType", "followers", "following", "selectedViewers")
SELECT 
    COALESCE(u.email, CONCAT('user_', u.id, '@default.ifca.com')) as email,
    u.id,
    'all' as privacyType,
    '{}'::int[] as followers,
    '{}'::int[] as following,
    '{}'::int[] as selectedViewers
FROM "User" u
WHERE NOT EXISTS (
    SELECT 1 FROM "unifiedUser" uu WHERE uu."userId" = u.id
)
ON CONFLICT ("email") DO NOTHING;

-- Generate unifiedUser records for Partners without existing unifiedUser record
INSERT INTO "unifiedUser" ("email", "partnerId", "privacyType", "followers", "following", "selectedViewers")
SELECT 
    COALESCE(p.email, CONCAT('partner_', p.id, '@default.ifca.com')) as email,
    p.id,
    'all' as privacyType,
    '{}'::int[] as followers,
    '{}'::int[] as following,
    '{}'::int[] as selectedViewers
FROM "Partner" p
WHERE NOT EXISTS (
    SELECT 1 FROM "unifiedUser" uu WHERE uu."partnerId" = p.id
)
ON CONFLICT ("email") DO NOTHING;

-- Generate unifiedUser records for Experts without existing unifiedUser record
INSERT INTO "unifiedUser" ("email", "expertId", "privacyType", "followers", "following", "selectedViewers")
SELECT 
    COALESCE(e.email, CONCAT('expert_', e.id, '@default.ifca.com')) as email,
    e.id,
    'all' as privacyType,
    '{}'::int[] as followers,
    '{}'::int[] as following,
    '{}'::int[] as selectedViewers
FROM "Expert" e
WHERE NOT EXISTS (
    SELECT 1 FROM "unifiedUser" uu WHERE uu."expertId" = e.id
)
ON CONFLICT ("email") DO NOTHING;

-- Generate unifiedUser records for Admins without existing unifiedUser record
INSERT INTO "unifiedUser" ("email", "adminId", "privacyType", "followers", "following", "selectedViewers")
SELECT 
    COALESCE(a.email, CONCAT('admin_', a.id, '@default.ifca.com')) as email,
    a.id,
    'all' as privacyType,
    '{}'::int[] as followers,
    '{}'::int[] as following,
    '{}'::int[] as selectedViewers
FROM "Admin" a
WHERE NOT EXISTS (
    SELECT 1 FROM "unifiedUser" uu WHERE uu."adminId" = a.id
)
ON CONFLICT ("email") DO NOTHING;

-- Verification queries to check results
SELECT 'Users without unifiedUser record' as check_type, COUNT(*) as count 
FROM "User" u 
WHERE NOT EXISTS (SELECT 1 FROM "unifiedUser" uu WHERE uu."userId" = u.id)
UNION ALL
SELECT 'Partners without unifiedUser record' as check_type, COUNT(*) as count 
FROM "Partner" p 
WHERE NOT EXISTS (SELECT 1 FROM "unifiedUser" uu WHERE uu."partnerId" = p.id)
UNION ALL
SELECT 'Experts without unifiedUser record' as check_type, COUNT(*) as count 
FROM "Expert" e 
WHERE NOT EXISTS (SELECT 1 FROM "unifiedUser" uu WHERE uu."expertId" = e.id)
UNION ALL
SELECT 'Admins without unifiedUser record' as check_type, COUNT(*) as count 
FROM "Admin" a 
WHERE NOT EXISTS (SELECT 1 FROM "unifiedUser" uu WHERE uu."adminId" = a.id);

-- Show summary of created records
SELECT 'Total unifiedUser records created' as summary, COUNT(*) as count FROM "unifiedUser"; 