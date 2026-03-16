const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// Helper function to safely delete from a table
async function safeDelete(tx, tableName, deleteFunction, description) {
  try {
    console.log(`${description}...`);
    await deleteFunction();
    console.log(`✅ ${description} - completed`);
  } catch (error) {
    if (error.code === 'P2021') {
      console.log(`⚠️  ${description} - table does not exist, skipping`);
    } else {
      console.log(`❌ ${description} - error: ${error.message}`);
      throw error;
    }
  }
}

async function clearDataExceptAdminRewards() {
  console.log('🚀 Starting data clearing process (preserving admin accounts and rewards)...');
  
  try {
    // Start transaction
    await prisma.$transaction(async (tx) => {
      console.log('📊 Clearing data in the following order:');
      
      // 1. Clear user activities and rewards (but keep reward rules)
      await safeDelete(tx, 'UserActivity', () => tx.userActivity.deleteMany({}), '1. Clearing user activities');
      await safeDelete(tx, 'UserReward', () => tx.userReward.deleteMany({}), '2. Clearing user rewards');
      
      // 3. Clear notifications
      await safeDelete(tx, 'Notification', () => tx.notification.deleteMany({}), '3. Clearing notifications');
      
      // 4. Clear connections
      await safeDelete(tx, 'Connection', () => tx.connection.deleteMany({}), '4. Clearing connections');
      
      // 5. Clear form responses and related data
      await safeDelete(tx, 'FormResponse', () => tx.formResponse.deleteMany({}), '5. Clearing form responses');
      await safeDelete(tx, 'FieldResponse', () => tx.fieldResponse.deleteMany({}), '6. Clearing field responses');
      await safeDelete(tx, 'Response', () => tx.response.deleteMany({}), '7. Clearing responses');
      await safeDelete(tx, 'FormCommunity', () => tx.formCommunity.deleteMany({}), '8. Clearing form communities');
      await safeDelete(tx, 'Form', () => tx.form.deleteMany({}), '9. Clearing forms');
      await safeDelete(tx, 'Field', () => tx.field.deleteMany({}), '10. Clearing fields');
      await safeDelete(tx, 'Question', () => tx.question.deleteMany({}), '11. Clearing questions');
      await safeDelete(tx, 'Stage', () => tx.stage.deleteMany({}), '12. Clearing stages');
      await safeDelete(tx, 'customForm', () => tx.customForm.deleteMany({}), '13. Clearing custom forms');
      
      // 14. Clear competition data
      await safeDelete(tx, 'EvaluatorResult', () => tx.evaluatorResult.deleteMany({}), '14. Clearing evaluator results');
      await safeDelete(tx, 'EvaluatorQuestion', () => tx.evaluatorQuestion.deleteMany({}), '15. Clearing evaluator questions');
      await safeDelete(tx, 'Competition', () => tx.competition.deleteMany({}), '16. Clearing competitions');
      
      // 17. Clear course data
      await safeDelete(tx, 'CourseSubscription', () => tx.courseSubscription.deleteMany({}), '17. Clearing course subscriptions');
      await safeDelete(tx, 'Course', () => tx.course.deleteMany({}), '18. Clearing courses');
      
      // 19. Clear blog data
      await safeDelete(tx, 'BlogLikes', () => tx.blogLikes.deleteMany({}), '19. Clearing blog likes');
      await safeDelete(tx, 'BlogTags', () => tx.blogTags.deleteMany({}), '20. Clearing blog tags');
      await safeDelete(tx, 'CommunityBlog', () => tx.communityBlog.deleteMany({}), '21. Clearing community blogs');
      await safeDelete(tx, 'Blog', () => tx.blog.deleteMany({}), '22. Clearing blogs');
      
      // 23. Clear event data
      await safeDelete(tx, 'EventAttendance', () => tx.eventAttendance.deleteMany({}), '23. Clearing event attendance');
      await safeDelete(tx, 'Event', () => tx.event.deleteMany({}), '24. Clearing events');
      
      // 25. Clear post data
      await safeDelete(tx, 'PostLikes', () => tx.postLikes.deleteMany({}), '25. Clearing post likes');
      await safeDelete(tx, 'PostTag', () => tx.postTag.deleteMany({}), '26. Clearing post tags');
      await safeDelete(tx, 'Post', () => tx.post.deleteMany({}), '27. Clearing posts');
      
      // 28. Clear project data
      await safeDelete(tx, 'SubmittedProjects', () => tx.submittedProjects.deleteMany({}), '28. Clearing submitted projects');
      await safeDelete(tx, 'project', () => tx.project.deleteMany({}), '29. Clearing projects');
      
      // 30. Clear thread data
      await safeDelete(tx, 'threadAssets', () => tx.threadAssets.deleteMany({}), '30. Clearing thread assets');
      await safeDelete(tx, 'Thread', () => tx.thread.deleteMany({}), '31. Clearing threads');
      
      // 32. Clear media assets
      await safeDelete(tx, 'mediaAssets', () => tx.mediaAssets.deleteMany({}), '32. Clearing media assets');
      
      // 33. Clear poll data
      await safeDelete(tx, 'UserPollOptionSelect', () => tx.userPollOptionSelect.deleteMany({}), '33. Clearing user poll selections');
      await safeDelete(tx, 'PollOptions', () => tx.pollOptions.deleteMany({}), '34. Clearing poll options');
      
      // 35. Clear order data
      await safeDelete(tx, 'SessionOrderMapping', () => tx.sessionOrderMapping.deleteMany({}), '35. Clearing session order mappings');
      await safeDelete(tx, 'Order', () => tx.order.deleteMany({}), '36. Clearing orders');
      
      // 37. Clear transaction data
      await safeDelete(tx, 'Transaction', () => tx.transaction.deleteMany({}), '37. Clearing transactions');
      
      // 38. Clear subscription data
      await safeDelete(tx, 'Subscription', () => tx.subscription.deleteMany({}), '38. Clearing subscriptions');
      
      // 39. Clear attendance data
      await safeDelete(tx, 'Attendance', () => tx.attendance.deleteMany({}), '39. Clearing attendance');
      
      // 40. Clear session data
      await safeDelete(tx, 'SessionSlot', () => tx.sessionSlot.deleteMany({}), '40. Clearing session slots');
      await safeDelete(tx, 'SessionTier', () => tx.sessionTier.deleteMany({}), '41. Clearing session tiers');
      await safeDelete(tx, 'PartnerSession', () => tx.partnerSession.deleteMany({}), '42. Clearing partner sessions');
      await safeDelete(tx, 'Session', () => tx.session.deleteMany({}), '43. Clearing sessions');
      
      // 44. Clear catchup data
      await safeDelete(tx, 'CatchUp', () => tx.catchUp.deleteMany({}), '44. Clearing catchups');
      
      // 45. Clear speaker recommendations
      await safeDelete(tx, 'SpeakerRecommendation', () => tx.speakerRecommendation.deleteMany({}), '45. Clearing speaker recommendations');
      
      // 46. Clear session tags
      await safeDelete(tx, 'SessionTags', () => tx.sessionTags.deleteMany({}), '46. Clearing session tags');
      await safeDelete(tx, 'TopSessionTags', () => tx.topSessionTags.deleteMany({}), '47. Clearing top session tags');
      
      // 48. Clear video data
      await safeDelete(tx, 'Video', () => tx.video.deleteMany({}), '48. Clearing videos');
      
      // 49. Clear service data
      await safeDelete(tx, 'ServiceResponse', () => tx.serviceResponse.deleteMany({}), '49. Clearing service responses');
      await safeDelete(tx, 'Service', () => tx.service.deleteMany({}), '50. Clearing services');
      
      // 51. Clear resource data
      await safeDelete(tx, 'Resource', () => tx.resource.deleteMany({}), '51. Clearing resources');
      
      // 52. Clear requests data
      await safeDelete(tx, 'requests', () => tx.requests.deleteMany({}), '52. Clearing requests');
      
      // 53. Clear subcommunity data
      await safeDelete(tx, 'userSubCommunity', () => tx.userSubCommunity.deleteMany({}), '53. Clearing user subcommunities');
      await safeDelete(tx, 'SubCommunity', () => tx.subCommunity.deleteMany({}), '54. Clearing subcommunities');
      
      // 55. Clear channel data
      await safeDelete(tx, 'UserChannels', () => tx.userChannels.deleteMany({}), '55. Clearing user channels');
      await safeDelete(tx, 'Channels', () => tx.channels.deleteMany({}), '56. Clearing channels');
      
      // 57. Clear message data
      await safeDelete(tx, 'Message', () => tx.message.deleteMany({}), '57. Clearing messages');
      
      // 58. Clear community data
      await safeDelete(tx, 'CommunityMapping', () => tx.communityMapping.deleteMany({}), '58. Clearing community mappings');
      await safeDelete(tx, 'CommunityTags', () => tx.communityTags.deleteMany({}), '59. Clearing community tags');
      await safeDelete(tx, 'Community', () => tx.community.deleteMany({}), '60. Clearing communities');
      
      // 61. Clear coupon data
      await safeDelete(tx, 'CouponCode', () => tx.couponCode.deleteMany({}), '61. Clearing coupon codes');
      
      // 62. Clear user details and questions
      await safeDelete(tx, 'UserDetails', () => tx.userDetails.deleteMany({}), '62. Clearing user details');
      await safeDelete(tx, 'UserQuestions', () => tx.userQuestions.deleteMany({}), '63. Clearing user questions');
      
      // 64. Clear wallet data
      await safeDelete(tx, 'Wallet', () => tx.wallet.deleteMany({}), '64. Clearing wallets');
      
      // 65. Clear tickets
      await safeDelete(tx, 'Tickets', () => tx.tickets.deleteMany({}), '65. Clearing tickets');
      
      // 66. Clear tags
      await safeDelete(tx, 'Tag', () => tx.tag.deleteMany({}), '66. Clearing tags');
      
      // 67. Clear regular users, partners, and experts (but keep admins)
      await safeDelete(tx, 'User', () => tx.user.deleteMany({}), '67. Clearing regular users');
      await safeDelete(tx, 'Partner', () => tx.partner.deleteMany({}), '68. Clearing partners');
      await safeDelete(tx, 'Expert', () => tx.expert.deleteMany({}), '69. Clearing experts');
      
      // 70. Clear unified users (but keep admin unified users)
      try {
        console.log('70. Clearing unified users (except admin ones)...');
        await tx.unifiedUser.deleteMany({
          where: {
            admin: null // Keep only admin unified users
          }
        });
        console.log('✅ 70. Clearing unified users (except admin ones) - completed');
      } catch (error) {
        if (error.code === 'P2021') {
          console.log('⚠️  70. Clearing unified users - table does not exist, skipping');
        } else {
          console.log(`❌ 70. Clearing unified users - error: ${error.message}`);
          throw error;
        }
      }
      
      console.log('✅ All data cleared successfully!');
      console.log('📋 Preserved:');
      console.log('   - Admin accounts');
      console.log('   - Reward rules');
      console.log('   - Admin unified users');
    });
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  clearDataExceptAdminRewards()
    .then(() => {
      console.log('🎉 Data clearing completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Data clearing failed:', error);
      process.exit(1);
    });
}

module.exports = { clearDataExceptAdminRewards }; 