const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDatabaseConstraint() {
  try {
    console.log('🔍 Checking for SessionSlot foreign key constraint issues...');
    
    // First, let's see what we're dealing with
    const invalidSlots = await prisma.$queryRaw`
      SELECT 
        ss.id as session_slot_id,
        ss."speakerId",
        ss."topicName",
        CASE 
          WHEN uu.id IS NULL THEN 'INVALID - Will be fixed'
          ELSE 'VALID'
        END as status
      FROM "SessionSlot" ss
      LEFT JOIN "unifiedUser" uu ON ss."speakerId" = uu.id
      WHERE ss."speakerId" IS NOT NULL
    `;
    
    console.log('📋 Current SessionSlot records with speakerId:');
    console.table(invalidSlots);
    
    // Count invalid references
    const invalidCount = invalidSlots.filter(slot => slot.status === 'INVALID - Will be fixed').length;
    console.log(`\n❌ Found ${invalidCount} invalid speakerId references`);
    
    if (invalidCount > 0) {
      console.log('\n🔧 Fixing invalid speakerId references...');
      
      // Fix the invalid references by setting speakerId to NULL
      const result = await prisma.$executeRaw`
        UPDATE "SessionSlot" 
        SET "speakerId" = NULL 
        WHERE "speakerId" IS NOT NULL 
        AND "speakerId" NOT IN (SELECT id FROM "unifiedUser")
      `;
      
      console.log(`✅ Fixed ${result} SessionSlot records`);
      
      // Verify the fix
      const remainingInvalid = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM "SessionSlot" ss
        LEFT JOIN "unifiedUser" uu ON ss."speakerId" = uu.id
        WHERE ss."speakerId" IS NOT NULL AND uu.id IS NULL
      `;
      
      console.log(`\n🔍 Verification: ${remainingInvalid[0].count} invalid references remaining`);
      
      if (remainingInvalid[0].count === 0) {
        console.log('🎉 All foreign key constraint issues have been resolved!');
        console.log('\n💡 You can now run: npx prisma db push');
      } else {
        console.log('⚠️ Some issues may still remain. Please check manually.');
      }
    } else {
      console.log('✅ No invalid speakerId references found!');
      console.log('\n💡 You can now run: npx prisma db push');
    }
    
  } catch (error) {
    console.error('❌ Error fixing database constraint:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDatabaseConstraint(); 