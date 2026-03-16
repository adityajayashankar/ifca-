-- PostgreSQL Query to Delete User and All Related Details
-- Replace 113 with the actual user ID you want to delete

DO $$
DECLARE
    user_unified_id INTEGER;
    user_id_to_delete INTEGER := 113; -- Replace 113 with actual user ID
BEGIN
    -- First, get the unified user ID associated with this user
    SELECT id INTO user_unified_id 
    FROM "unifiedUser" 
    WHERE "userId" = user_id_to_delete;
    
    -- If user doesn't exist, raise an error
    IF user_unified_id IS NULL THEN
        RAISE EXCEPTION 'User with ID % not found', user_id_to_delete;
    END IF;
    
    -- Start transaction to ensure data consistency
    BEGIN
        -- 1. Clean up followers/following arrays in other unified users
        UPDATE "unifiedUser" 
        SET 
            followers = array_remove(followers, user_unified_id),
            following = array_remove(following, user_unified_id),
            "selectedViewers" = array_remove("selectedViewers", user_unified_id)
        WHERE 
            followers @> ARRAY[user_unified_id] 
            OR following @> ARRAY[user_unified_id] 
            OR "selectedViewers" @> ARRAY[user_unified_id];
        
        -- 2. Delete user activities and rewards
        DELETE FROM "UserActivity" WHERE "userId" = user_unified_id;
        DELETE FROM "UserReward" WHERE "userId" = user_unified_id;
        
        -- 3. Delete user poll selections
        DELETE FROM "UserPollOptionSelect" WHERE "unifiedUserId" = user_unified_id;
        
        -- 4. Delete user connections (both sent and received)
        DELETE FROM "Connection" WHERE "senderId" = user_unified_id OR "receiverId" = user_unified_id;
        
        -- 5. Delete user notifications (both sent and received)
        DELETE FROM "Notification" WHERE "recipientId" = user_unified_id OR "senderId" = user_unified_id;
        
        -- 6. Delete user blog likes
        DELETE FROM "BlogLikes" WHERE "userId" = user_unified_id;
        
        -- 7. Delete user post likes
        DELETE FROM "PostLikes" WHERE "userId" = user_unified_id;
        
        -- 8. Delete user threads and thread assets
        DELETE FROM "threadAssets" WHERE "threadId" IN (SELECT id FROM "Thread" WHERE "creatorId" = user_unified_id);
        DELETE FROM "Thread" WHERE "creatorId" = user_unified_id;
        
        -- 9. Delete user posts and related data
        DELETE FROM "mediaAssets" WHERE "postId" IN (SELECT id FROM "Post" WHERE "creatorId" = user_unified_id);
        DELETE FROM "PostTag" WHERE "postId" IN (SELECT id FROM "Post" WHERE "creatorId" = user_unified_id);
        DELETE FROM "Post" WHERE "creatorId" = user_unified_id;
        
        -- 10. Delete user blogs and related data
        DELETE FROM "BlogLikes" WHERE "blogId" IN (SELECT id FROM "Blog" WHERE "unifiedUserId" = user_unified_id);
        DELETE FROM "BlogTags" WHERE "blogId" IN (SELECT id FROM "Blog" WHERE "unifiedUserId" = user_unified_id);
        DELETE FROM "CommunityBlog" WHERE "blogId" IN (SELECT id FROM "Blog" WHERE "unifiedUserId" = user_unified_id);
        DELETE FROM "Blog" WHERE "unifiedUserId" = user_unified_id;
        
        -- 11. Delete user course subscriptions
        DELETE FROM "CourseSubscription" WHERE "unifiedUserId" = user_unified_id;
        
        -- 12. Delete user event attendance
        DELETE FROM "EventAttendance" WHERE "unifiedUserId" = user_unified_id;
        
        -- 13. Delete user form responses
        DELETE FROM "Response" WHERE "responseId" IN (SELECT id FROM "FormResponse" WHERE "userId" = user_unified_id);
        DELETE FROM "FormResponse" WHERE "userId" = user_unified_id;
        
        -- 14. Delete user field responses
        DELETE FROM "FieldResponse" WHERE "submittedBy" = user_unified_id;
        
        -- 15. Delete user service responses
        DELETE FROM "ServiceResponse" WHERE "userId" = user_unified_id;
        
        -- 16. Delete user submitted projects
        DELETE FROM "SubmittedProjects" WHERE "submittedBy" = user_unified_id;
        
        -- 17. Delete user orders and session order mappings
        DELETE FROM "SessionOrderMapping" WHERE "userId" = user_unified_id;
        DELETE FROM "Order" WHERE "userId" = user_unified_id;
        
        -- 18. Delete user subscriptions and related data
        DELETE FROM "UserChannels" WHERE "userId" IN (SELECT id FROM "Subscription" WHERE "unifiedUserId" = user_unified_id);
        DELETE FROM "userSubCommunity" WHERE "subscriptionId" IN (SELECT id FROM "Subscription" WHERE "unifiedUserId" = user_unified_id);
        DELETE FROM "Message" WHERE "senderId" IN (SELECT id FROM "Subscription" WHERE "unifiedUserId" = user_unified_id) 
                               OR "recvId" IN (SELECT id FROM "Subscription" WHERE "unifiedUserId" = user_unified_id);
        DELETE FROM "Subscription" WHERE "unifiedUserId" = user_unified_id;
        
        -- 19. Delete user communities (if they created any)
        DELETE FROM "Community" WHERE "creatorId" = user_unified_id;
        
        -- 20. Delete user sessions (if they created any)
        DELETE FROM "Session" WHERE "creatorId" = user_unified_id;
        
        -- 21. Delete user catchups (if they created any)
        DELETE FROM "CatchUp" WHERE "creatorId" = user_unified_id;
        
        -- 22. Delete user courses (if they created any)
        DELETE FROM "Course" WHERE "creatorId" = user_unified_id;
        
        -- 23. Delete user forms (if they created any)
        DELETE FROM "Form" WHERE "creatorId" = user_unified_id;
        
        -- 24. Delete user competitions (if they created any)
        DELETE FROM "Competition" WHERE "creatorId" = user_unified_id;
        
        -- 25. Delete user projects (if they created any)
        DELETE FROM "project" WHERE "creatorId" = user_unified_id;
        
        -- 26. Delete user services (if they created any)
        DELETE FROM "Service" WHERE "creatorId" = user_unified_id;
        
        -- 27. Delete user resources (if they created any)
        DELETE FROM "Resource" WHERE "authorId" = user_unified_id;
        
        -- 28. Delete user session slots (if they were speakers)
        UPDATE "SessionSlot" SET "speakerId" = NULL WHERE "speakerId" = user_unified_id;
        
        -- 29. Delete user stage assignments (if they were evaluators)
        UPDATE "Stage" SET "evaluatorId" = NULL WHERE "evaluatorId" = user_unified_id;
        
        -- 30. Delete user requests
        DELETE FROM "requests" WHERE "userId" = user_unified_id;
        
        -- 31. Delete user coupon codes
        DELETE FROM "CouponCode" WHERE "unifiedUserId" = user_unified_id;
        
        -- 32. Delete user transactions and related data
        DELETE FROM "Attendance" WHERE "transactionId" IN (SELECT id FROM "Transaction" WHERE "userId" = user_id_to_delete);
        DELETE FROM "EventAttendance" WHERE "transactionId" IN (SELECT id FROM "Transaction" WHERE "userId" = user_id_to_delete);
        DELETE FROM "CourseSubscription" WHERE "transactionId" IN (SELECT id FROM "Transaction" WHERE "userId" = user_id_to_delete);
        DELETE FROM "Subscription" WHERE "transactionId" IN (SELECT id FROM "Transaction" WHERE "userId" = user_id_to_delete);
        DELETE FROM "Transaction" WHERE "userId" = user_id_to_delete;
        
        -- 33. Delete user attendance records
        DELETE FROM "Attendance" WHERE "userId" = user_id_to_delete;
        
        -- 34. Delete user tickets
        DELETE FROM "Tickets" WHERE "userId" = user_id_to_delete;
        
        -- 35. Delete user wallet
        DELETE FROM "Wallet" WHERE "userId" = user_id_to_delete;
        
        -- 36. Delete user details
        DELETE FROM "UserDetails" WHERE "userId" = user_id_to_delete;
        
        -- 37. Finally, delete the unified user (this will cascade to delete the user)
        DELETE FROM "unifiedUser" WHERE id = user_unified_id;
        
        RAISE NOTICE 'User with ID % and all related data deleted successfully', user_id_to_delete;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Error deleting user: %', SQLERRM;
    END;
    
END $$;