const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createCommunityNotifications() {
  try {
    console.log('Starting to create community notifications...');

    // Get all communities
    const communities = await prisma.community.findMany({
      where: {
        isArchived: false
      }
    });

    console.log(`Found ${communities.length} communities to process`);

    for (const community of communities) {
      console.log(`\nProcessing community: ${community.title} (ID: ${community.id})`);

      // 1. Create notifications for posts
      const posts = await prisma.post.findMany({
        where: {
          communityId: community.id,
          parentPostId: null // Only top-level posts
        },
        include: {
          creator: true
        }
      });

      for (const post of posts) {
        const creatorName = post.creator?.name || post.creator?.username || 'Unknown User';
        await prisma.notification.create({
          data: {
            recipientId: community.creatorId,
            type: 'NEW_POST',
            title: `New Post by ${creatorName}`,
            message: `${creatorName} posted: ${post.title || post.content.substring(0, 50)}...`,
            status: 'READ',
            isRead: true,
            communityId: community.id,
            postId: post.id,
            createdAt: post.createdAt,
            updatedAt: post.createdAt
          }
        });
      }
      console.log(`Created notifications for ${posts.length} posts`);

      // 2. Create notifications for blogs
      const blogs = await prisma.blog.findMany({
        where: {
          communityId: community.id
        },
        include: {
          author: true
        }
      });

      for (const blog of blogs) {
        const authorName = blog.author?.name || blog.author?.username || 'Unknown User';
        await prisma.notification.create({
          data: {
            recipientId: community.creatorId,
            type: 'BLOG_PUBLISHED',
            title: `Blog Published by ${authorName}`,
            message: `${authorName} published a new blog: ${blog.title}`,
            status: 'READ',
            isRead: true,
            communityId: community.id,
            blogId: blog.id,
            createdAt: blog.createdAt,
            updatedAt: blog.createdAt
          }
        });
      }
      console.log(`Created notifications for ${blogs.length} blogs`);

      // 3. Create notifications for catchups
      const catchups = await prisma.catchUp.findMany({
        where: {
          communityId: community.id
        },
        include: {
          creator: true
        }
      });

      for (const catchup of catchups) {
        const creatorName = catchup.creator?.name || catchup.creator?.username || 'Unknown User';
        await prisma.notification.create({
          data: {
            recipientId: community.creatorId,
            type: 'SESSION_REMINDER',
            title: `Catchup Scheduled by ${creatorName}`,
            message: `${creatorName} scheduled a catchup session: ${catchup.title}`,
            status: 'READ',
            isRead: true,
            communityId: community.id,
            createdAt: catchup.createdAt,
            updatedAt: catchup.createdAt,
            metadata: {
              catchupId: catchup.id,
              catchupTitle: catchup.title
            }
          }
        });
      }
      console.log(`Created notifications for ${catchups.length} catchups`);

      // 4. Create notifications for resources
      const resources = await prisma.resource.findMany({
        where: {
          community: {
            some: {
              id: community.id
            }
          }
        },
        include: {
          author: true
        }
      });

      for (const resource of resources) {
        const authorName = resource.author?.name || resource.author?.username || 'Unknown User';
        await prisma.notification.create({
          data: {
            recipientId: community.creatorId,
            type: 'SYSTEM_ANNOUNCEMENT',
            title: `Resource Added by ${authorName}`,
            message: `${authorName} added a new resource: ${resource.name}`,
            status: 'READ',
            isRead: true,
            communityId: community.id,
            createdAt: resource.uploadedAt,
            updatedAt: resource.uploadedAt,
            metadata: {
              resourceId: resource.id,
              resourceName: resource.name
            }
          }
        });
      }
      console.log(`Created notifications for ${resources.length} resources`);

      // 5. Create notifications for courses
      const courses = await prisma.course.findMany({
        where: {
          communities: {
            some: {
              id: community.id
            }
          }
        },
        include: {
          creator: true
        }
      });

      for (const course of courses) {
        const creatorName = course.creator?.name || course.creator?.username || 'Unknown User';
        await prisma.notification.create({
          data: {
            recipientId: community.creatorId,
            type: 'COURSE_UPDATE',
            title: `Course Created by ${creatorName}`,
            message: `${creatorName} created a new course: ${course.name}`,
            status: 'READ',
            isRead: true,
            communityId: community.id,
            courseId: course.id,
            createdAt: course.createdAt,
            updatedAt: course.createdAt
          }
        });
      }
      console.log(`Created notifications for ${courses.length} courses`);

      // 6. Create notifications for service requests
      const services = await prisma.service.findMany({
        where: {
          communityId: community.id
        },
        include: {
          creator: true
        }
      });

      for (const service of services) {
        const creatorName = service.creator?.name || service.creator?.username || 'Unknown User';
        await prisma.notification.create({
          data: {
            recipientId: community.creatorId,
            type: 'FORM_SUBMISSION',
            title: `Service Request by ${creatorName}`,
            message: `${creatorName} submitted a service request: ${service.title}`,
            status: 'READ',
            isRead: true,
            communityId: community.id,
            createdAt: service.createdAt,
            updatedAt: service.createdAt,
            metadata: {
              serviceId: service.id,
              serviceTitle: service.title
            }
          }
        });
      }
      console.log(`Created notifications for ${services.length} services`);

      // 7. Create notifications for new members
      const subscriptions = await prisma.subscription.findMany({
        where: {
          communityId: community.id
        },
        include: {
          unifiedUser: true
        }
      });

      for (const subscription of subscriptions) {
        const memberName = subscription.unifiedUser?.name || subscription.unifiedUser?.username || 'Unknown User';
        await prisma.notification.create({
          data: {
            recipientId: community.creatorId,
            type: 'COMMUNITY_INVITATION',
            title: `New Member: ${memberName}`,
            message: `${memberName} joined the community`,
            status: 'READ',
            isRead: true,
            communityId: community.id,
            createdAt: subscription.createdAt,
            updatedAt: subscription.createdAt,
            metadata: {
              subscriptionId: subscription.id,
              memberId: subscription.unifiedUserId
            }
          }
        });
      }
      console.log(`Created notifications for ${subscriptions.length} new members`);
    }

    console.log('\nFinished creating community notifications!');
  } catch (error) {
    console.error('Error creating community notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createCommunityNotifications(); 