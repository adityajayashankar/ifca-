const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createCustomError } = require('../../middleware/errorHandling');
const { findPartnerByIdHelper } = require('../services/getById');
const { getUserCommunitiesHelper } = require('../community/community');
const bcrypt = require("bcryptjs");
const emailService = require("../../services/email.service.js");
const XLSX = require("xlsx");
const generateDefaultPhotoURL = require('../../utils/generateDefaultPhotoURL');

// Helper function to send welcome email to partner
const sendPartnerWelcomeEmail = async (partner, password) => {
  try {
    await emailService.sendEmail({
      to: partner.email,
      subject: 'Welcome to IFCA - Partner Account Created',
      template: 'partner-welcome-email',
      context: {
        email: partner.email,
        recipientName: partner.name,
        password: password,
        actionUrl: `https://pvl.ifcaindia.com/partner/login`,
        partnerDashboardUrl: `https://pvl.ifcaindia.com/partner/dashboard`,
      },
    });
    console.log(`📧 Welcome email sent to partner: ${partner.email}`);
  } catch (error) {
    console.error(`❌ Error sending welcome email to partner ${partner.email}:`, error);
    // Don't throw error, just log it
  }
};

// Helper function to validate partner data
const validatePartnerData = (data) => {
  const errors = [];
  
  if (!data.email || !data.email.includes('@')) {
    errors.push('Valid email is required');
  }
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (!data.phone || data.phone.length < 10) {
    errors.push('Valid phone number is required');
  }
  
  if (!data.address || data.address.trim().length < 5) {
    errors.push('Address must be at least 5 characters long');
  }
  
  if (!data.pincode || data.pincode.length < 5) {
    errors.push('Valid pincode is required');
  }
  
  // Validate photoURL if provided (should be a valid URL)
  if (data.photoURL && data.photoURL !== "https://robohash.org/dojo") {
    try {
      new URL(data.photoURL);
    } catch (error) {
      errors.push('PhotoURL must be a valid URL (S3 link)');
    }
  }
  
  return errors;
};

// Create single partner with proper signup logic
exports.createPartner = async function (req, res, next) {
  try {
    const { 
      email, 
      name, 
      phone, 
      address, 
      pincode, 
      photoURL, 
      desc,
      password: providedPassword 
    } = req.body;

    console.log(`🔐 Creating partner: ${email}`);

    // Validate input data
    const validationErrors = validatePartnerData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }

    // Check if email already exists
    const existingUnifiedUser = await prisma.unifiedUser.findUnique({ 
      where: { email } 
    });
    if (existingUnifiedUser) {
      console.error(`❌ Email already registered: ${email}`);
      return res.status(409).json({ message: 'Email already registered.' });
    }

    // Check if phone already exists across all user types
    const [userPhone, adminPhone, partnerPhone, expertPhone] = await prisma.$transaction([
      prisma.user.findUnique({ where: { phone } }),
      prisma.admin.findUnique({ where: { phone } }),
      prisma.partner.findUnique({ where: { phone } }),
      prisma.expert.findUnique({ where: { phone } }),
    ]);

    if (userPhone || adminPhone || partnerPhone || expertPhone) {
      console.error(`❌ Phone already registered: ${phone}`);
      return res.status(409).json({ message: 'Phone number already registered.' });
    }

    // Generate password if not provided
    const password = providedPassword || "Abcd@123"

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("✅ Password hashed");

    // Create partner record
    const partner = await prisma.partner.create({
      data: {
        email,
        name,
        phone,
        address,
        pincode,
        photoURL: photoURL || generateDefaultPhotoURL(name),
        desc: desc || "Hey there! I am a partner",
        password: hashedPassword,
        credits: 0,
        adminId: 1, // Default admin ID
      },
    });

    console.log(`✅ Partner created with ID: ${partner.id}`);

    // Create unified user record
    await prisma.unifiedUser.create({
      data: {
        email,
        partnerId: partner.id,
        isActive: true,
      },
    });

    console.log(`✅ Unified user created for partner: ${partner.id}`);

    // Send welcome email (non-blocking)
    sendPartnerWelcomeEmail(partner, password);

    return res.status(201).json({
      message: 'Partner created successfully',
      partner: {
        id: partner.id,
        email: partner.email,
        name: partner.name,
        phone: partner.phone,
        photoURL: partner.photoURL,
        credits: partner.credits,
      },
      credentials: {
        email: partner.email,
        password: password, // Return plain password for admin reference
      }
    });

  } catch (error) {
    console.error('❌ Error creating partner:', error);
    return res.status(500).json({ message: 'Something went wrong while creating partner' });
  }
};

// Bulk upload partners from Excel file
exports.bulkUploadPartners = async function (req, res, next) {
  try {
    const file = req.file;
    
    console.log('📁 Processing bulk partner upload');

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Read Excel file
    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const partnersData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (partnersData.length === 0) {
      return res.status(400).json({ message: "Excel file is empty" });
    }

    console.log(`📊 Processing ${partnersData.length} partners from Excel`);

    const createdPartners = [];
    const failedPartners = [];
    const skippedPartners = [];

    for (let i = 0; i < partnersData.length; i++) {
      const partnerData = partnersData[i];
      const rowNumber = i + 2; // Excel rows start from 2 (1 is header)

      try {
        // Normalize data
        partnerData.phone = partnerData.phone?.toString() || '';
        partnerData.pincode = partnerData.pincode?.toString() || '';
        partnerData.email = partnerData.email?.toString().toLowerCase().trim() || '';
        partnerData.name = partnerData.name?.toString().trim() || '';

        const { email, name, phone, address, pincode, photoURL, desc } = partnerData;

        // Validate required fields
        if (!email || !name || !phone || !address || !pincode) {
          failedPartners.push({
            row: rowNumber,
            email: email || 'N/A',
            reason: 'Missing required fields (email, name, phone, address, pincode)'
          });
          continue;
        }

        // Check if email already exists
        const existingUnifiedUser = await prisma.unifiedUser.findUnique({ 
          where: { email } 
        });
        if (existingUnifiedUser) {
          skippedPartners.push({
            row: rowNumber,
            email,
            reason: 'Email already registered'
          });
          continue;
        }

        // Check if phone already exists
        const [userPhone, adminPhone, partnerPhone, expertPhone] = await prisma.$transaction([
          prisma.user.findUnique({ where: { phone } }),
          prisma.admin.findUnique({ where: { phone } }),
          prisma.partner.findUnique({ where: { phone } }),
          prisma.expert.findUnique({ where: { phone } }),
        ]);

        if (userPhone || adminPhone || partnerPhone || expertPhone) {
          skippedPartners.push({
            row: rowNumber,
            email,
            reason: 'Phone number already registered'
          });
          continue;
        }

        // Generate password
        const password = "Abcd@123"

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create partner and unified user in a transaction
        const result = await prisma.$transaction(async (tx) => {
          // Create partner record
          const partner = await tx.partner.create({
            data: {
              email,
              name,
              phone,
              address,
              pincode,
              photoURL: photoURL || generateDefaultPhotoURL(name),
              desc: desc || "Hey there! I am a partner",
              password: hashedPassword,
              credits: 0,
              adminId: 1, // Default admin ID
            },
          });

          console.log(`✅ Partner created with ID: ${partner.id}`);

          // Create unified user record
          const unifiedUser = await tx.unifiedUser.create({
            data: {
              email,
              partnerId: partner.id,
              isActive: true,
            },
          });

          console.log(`✅ Unified user created with ID: ${unifiedUser.id} for partner: ${partner.id}`);

          return { partner, unifiedUser };
        });

        // Send welcome email (non-blocking)
        sendPartnerWelcomeEmail(result.partner, password);

        createdPartners.push({
          row: rowNumber,
          partner: {
            id: result.partner.id,
            email: result.partner.email,
            name: result.partner.name,
            phone: result.partner.phone,
            credits: result.partner.credits,
          },
          credentials: {
            email: result.partner.email,
            password: password,
          }
        });

        console.log(`✅ Partner ${i + 1}/${partnersData.length} created: ${email}`);

      } catch (error) {
        console.error(`❌ Error processing row ${rowNumber}:`, error);
        
        // Provide more specific error messages
        let errorMessage = 'Unknown error';
        if (error.code === 'P2002') {
          if (error.meta?.target?.includes('email')) {
            errorMessage = 'Email already exists';
          } else if (error.meta?.target?.includes('phone')) {
            errorMessage = 'Phone number already exists';
          } else {
            errorMessage = 'Duplicate entry constraint violation';
          }
        } else if (error.code === 'P2003') {
          errorMessage = 'Foreign key constraint violation';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        failedPartners.push({
          row: rowNumber,
          email: partnerData.email || 'N/A',
          reason: errorMessage
        });
      }
    }

    console.log(`📊 Bulk upload completed: ${createdPartners.length} created, ${skippedPartners.length} skipped, ${failedPartners.length} failed`);

    return res.status(200).json({
      message: 'Bulk partner upload completed',
      summary: {
        total: partnersData.length,
        created: createdPartners.length,
        skipped: skippedPartners.length,
        failed: failedPartners.length
      },
      createdPartners,
      skippedPartners,
      failedPartners
    });

  } catch (error) {
    console.error('❌ Error in bulk upload:', error);
    return res.status(500).json({ message: 'Something went wrong during bulk upload' });
  }
};

exports.getPartnerById = async function (req, res, next) {
    const { id } = req.params;

    try {
        // Get partner with unified user
        const partner = await prisma.partner.findUnique({
            where: { id: parseInt(id) },
            include: {
                unifiedUserId: true
            }
        });

        if (!partner) {
            return res.status(404).json({ message: 'Partner not found' });
        }

        let partnerData = {
            partner: partner,
            communities: [],
            resources: [],
            subscribedCommunities: [],
            partnerSessions: []
        };

        // If partner has unified user, get additional data
        if (partner.unifiedUserId) {
            const unifiedUserId = partner.unifiedUserId.id;

            // Get communities created by this partner
            const communities = await prisma.community.findMany({
                where: { creatorId: unifiedUserId },
                include: {
                    creator: true
                }
            });

            // Get resources created by this partner
            const resources = await prisma.resource.findMany({
                where: { authorId: unifiedUserId },
                include: {
                    author: true,
                    community: true
                }
            });

            // Get subscribed communities
            const subscriptions = await prisma.subscription.findMany({
                where: { unifiedUserId: unifiedUserId },
                include: {
                    community: true
                }
            });

            // Get partner sessions
            const partnerSessions = await prisma.partnerSession.findMany({
                where: { partnerId: parseInt(id) },
                include: {
                    sessionSlot: {
                        include: {
                            session: true
                        }
                    },
                    community: true
                }
            });

            partnerData = {
                partner: partner,
                communities: communities,
                resources: resources,
                subscribedCommunities: subscriptions.map(sub => sub.community),
                partnerSessions: partnerSessions
            };
        }

        return res.status(200).json({ partner: partnerData });
    } catch (err) {
        console.log(`Error while getting partner, ${id}`);
        console.log(err);
        next(err);
    }
};

exports.updatePartnerById = async function (req, res, next) {
    const { id } = req.params;
    const data = req.body;
    try {
        await findPartnerByIdHelper(id);
        const partner = await prisma.partner.update({
            where: { id: parseInt(id) },
            data: data
        });

        return res.status(200).json({ partner });
    } catch (err) {
        console.log(`Error while patching partner, ${id}`)
        console.log(err)
        next(err)
    }
}

exports.deletePartnerById = async function (req, res, next) {
    const { id } = req.params;

    try {
        if (id) {
           
            const partner = await findPartnerByIdHelper(id);

            if (!partner || !partner.partner || !partner.partner.id) {
                return res.status(404).json({ msg: 'Partner not found' });
            }

            
            const unifiedUser = await prisma.unifiedUser.findFirst({
                where: { partnerId: parseInt(id) }
            });

            if (!unifiedUser) {
                return res.status(404).json({ msg: 'UnifiedUser for this partner not found' });
            }

            
            await prisma.unifiedUser.update({
                where: { id: unifiedUser.id },
                data: { isActive: false }
            });

            
            
        }

        return res.status(200).json({ msg: 'Partner deactivated successfully' });
    } catch (err) {
        console.log(`Error while deleting partner, ${id}`);
        console.log(err);
        next(err);
    }
};

exports.enablePartnerById = async function (req, res, next) {
  const { id } = req.params;

  try {
    const unifiedUser = await prisma.unifiedUser.findFirst({
      where: { partnerId: parseInt(id) }
    });

    if (!unifiedUser) {
      return res.status(404).json({ msg: 'UnifiedUser not found for this partner' });
    }

    await prisma.unifiedUser.update({
      where: { id: unifiedUser.id },
      data: { isActive: true }
    });

    return res.status(200).json({ msg: 'Partner enabled successfully' });
  } catch (err) {
    console.log(`Error while enabling partner with id ${id}`);
    console.log(err);
    next(err);
  }
};

exports.getPartnerCommunities = async function (req, res, next) {
    const { id } = req.params;
    try {
        // let { skip, take } = req.query;
        const communities = await getUserCommunitiesHelper(parseInt(id));

        if (!communities) { 
            return res.status(404).json({ message: 'Communities not found' });
        }

        // Return response with communities and total count
        return res.status(200).json({
            communities: communities.length > 0 ? communities : [],
            total: communities.length
        });

    } catch (err) {
        console.log(`Error while getting partner communities, ${id}`);
        console.log(err);
        next(err);
    }
}

exports.getPartnerCommunityRequests = async function (req, res, next) {
    const { id } = req.params;

    try {
        const communities = await getUserCommunitiesHelper(parseInt(id));

        if (!communities) {
            return res.status(404).json({ message: 'Partner or community not found' });
        }


        const communityIds = communities.map(c => c.id);

        const communityRequests = await prisma.requests.findMany({
            where: {
                communityId: {
                    in: communityIds
                },
                status: false
            },
            include: {
                Community: true,
                User: true
            }
        });

        return res.status(200).json({ communityRequests });
    } catch (err) {
        console.log(`Error while getting partner community, ${id}`);
        console.log(err);
        next(err);
    }
};

exports.updatePartnerCommunityById = async function (req, res, next) {
    const { id, communityId } = req.params;
    const data = req.body;

    try {
        const partner = await findPartnerByIdHelper(id);

        if (!partner || !partner.Community) {
            return res.status(404).json({ message: 'Partner or community not found' });
        }

        const community = partner.Community.find(c => c.id === parseInt(communityId));

        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        const updatedCommunity = await prisma.community.update({
            where: { id: parseInt(communityId) },
            data: data
        });

        return res.status(200).json({ community: updatedCommunity });
    } catch (err) {
        console.log(`Error while updating partner community, ${id}, ${communityId}`);
        console.log(err);
        next(err);
    }
};

exports.deletePartnerCommunityById = async function (req, res, next) {
    const { id, communityId } = req.params;

    try {
        const partner = await findPartnerByIdHelper(id);

        if (!partner || !partner.Community) {
            return res.status(404).json({ message: 'Partner or community not found' });
        }

        const community = partner.Community.find(c => c.id === parseInt(communityId));

        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        const deletedCommunity = await prisma.community.delete({
            where: { id: parseInt(communityId) }
        });

        return res.status(200).json({ community: deletedCommunity });
    } catch (err) {
        console.log(`Error while deleting partner community, ${id}, ${communityId}`);
        console.log(err);
        next(err);
    }
};

exports.getAllPartners = async function (req, res, next) {
    try {
        
        const partners = await prisma.partner.findMany({
            include: {
                unifiedUserId: true
            }
        });

        // Get additional data for each partner
        const partnersWithStats = await Promise.all(partners.map(async (partner) => {
            let sessionCount = 0;
            let communitiesCreated = 0;
            let resourcesCount = 0;
            let subscribedCommunities = 0;

            if (partner.unifiedUserId) {
                // Get session count (partner sessions)
                const partnerSessions = await prisma.partnerSession.count({
                    where: { partnerId: partner.id }
                });
                sessionCount = partnerSessions;

                // Get communities created by this partner
                const createdCommunities = await prisma.community.count({
                    where: { creatorId: partner.unifiedUserId.id }
                });
                communitiesCreated = createdCommunities;

                // Get resources created by this partner
                const resources = await prisma.resource.count({
                    where: { authorId: partner.unifiedUserId.id }
                });
                resourcesCount = resources;

                // Get subscribed communities count
                const subscriptions = await prisma.subscription.count({
                    where: { unifiedUserId: partner.unifiedUserId.id }
                });
                subscribedCommunities = subscriptions;
            }

            return {
                ...partner,
                statistics: {
                    sessions: {
                        total: sessionCount
                    },
                    communities: {
                        created: communitiesCreated,
                        subscribed: subscribedCommunities
                    },
                    resources: {
                        total: resourcesCount
                    }
                }
            };
        }));

        // Separate active and inactive partners
        const activePartners = [];
        const inactivePartners = [];

        partnersWithStats.forEach(partner => {
            if (partner.unifiedUserId?.isActive) {
                activePartners.push(partner);
            } else {
                inactivePartners.push(partner);
            }
        });

        return res.status(200).json({
            activePartners,
            inactivePartners
        });
        
    } catch (err) {
        console.log(`Error while getting all partners`);
        console.log(err);
        next(err);
    }
};

//get sessions
exports.getPartnerSessions = async function (req, res, next) {
    const { id } = req.params;

    try {
        const partner = await prisma.partner.findUnique({
            where: { id: parseInt(id) },
            include: {
                PartnerSession: true
            }
        })

        if (!partner) {
            throw createCustomError({ status: 404, message: 'Partner not found' })
        }
        return res.status(200).json({ sessions: partner.PartnerSession });
    } catch (err) {
        console.log(`Error while getting partner session`)
        console.log(err)
        next(err)

    }
}

// Get all sessions purchased/participated by the authenticated partner
exports.getAllPartnerSessions = async function (req, res, next) {
    try {
        const partnerId = req.user.partnerId; // From authenticated token
        
        // Try to get unified user ID directly from token first
        let unifiedUserId = req.user.unifiedUserId?.id || req.user.unifiedUser?.id;
        
        // If not available in token, query the partner table
        if (!unifiedUserId) {
            const partner = await prisma.partner.findUnique({
                where: { id: partnerId },
                include: {
                    unifiedUserId: true
                }
            });

            if (!partner || !partner.unifiedUserId) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Partner not found or no unified user associated' 
                });
            }

            unifiedUserId = partner.unifiedUserId.id;
        }
        
        // Get sessions created by this partner
        const sessions = await prisma.session.findMany({
            where: {
                creatorId: unifiedUserId,
                isActive: true
            },
            include: {
                CouponCode: true,
                tags: {
                    include: {
                        tag: true,
                    },
                },
                SessionSlot: {
                    include: { 
                        speakers: true,
                        Attendance: {
                            include: {
                                user: true
                            }
                        }
                    },
                    orderBy: { startTime: "asc" },
                },
                creator: {
                    include: {
                        partner: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Get completed sessions (sessions where all slots have ended)
        const completedSessions = sessions.filter(session => {
            const now = new Date();
            return session.SessionSlot.every(slot => new Date(slot.endTime) < now);
        });

        // Get active sessions (sessions with at least one upcoming slot)
        const activeSessions = sessions.filter(session => {
            const now = new Date();
            return session.SessionSlot.some(slot => new Date(slot.endTime) > now);
        });

        // Calculate statistics
        const totalSessions = sessions.length;
        const activeSessionsCount = activeSessions.length;
        const completedSessionsCount = completedSessions.length;
        const totalSlots = sessions.reduce((sum, session) => sum + session.SessionSlot.length, 0);
        const totalAttendees = sessions.reduce((sum, session) => {
            return sum + session.SessionSlot.reduce((slotSum, slot) => {
                return slotSum + slot.Attendance.length;
            }, 0);
        }, 0);

        return res.status(200).json({
            success: true,
            data: {
                sessions: activeSessions,
                completedSessions: completedSessions,
                statistics: {
                    totalSessions,
                    activeSessions: activeSessionsCount,
                    completedSessions: completedSessionsCount,
                    totalSlots,
                    totalAttendees
                }
            }
        });

    } catch (err) {
        console.log('Error while getting all partner sessions:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch partner sessions',
            error: err.message 
        });
    }
};

// Get specific session by ID that the authenticated partner has created
exports.getPartnerSessionById = async function (req, res, next) {
    try {
        const { sessionId } = req.params;
        const partnerId = req.user.partnerId; // From authenticated token

        // Try to get unified user ID directly from token first
        let unifiedUserId = req.user.unifiedUserId?.id || req.user.unifiedUser?.id;
        
        // If not available in token, query the partner table
        if (!unifiedUserId) {
            const partner = await prisma.partner.findUnique({
                where: { id: partnerId },
                include: {
                    unifiedUserId: true
                }
            });

            if (!partner || !partner.unifiedUserId) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Partner not found or no unified user associated' 
                });
            }

            unifiedUserId = partner.unifiedUserId.id;
        }

        // Check if the partner has created this session
        const session = await prisma.session.findFirst({
            where: {
                id: parseInt(sessionId),
                creatorId: unifiedUserId,
                isActive: true
            },
            include: {
                CouponCode: true,
                tags: {
                    include: {
                        tag: true,
                    },
                },
                SessionSlot: {
                    include: { 
                        speakers: true,
                        Attendance: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        phone: true,
                                        photoURL: true
                                    }
                                }
                            }
                        },
                        SessionTier: {
                            include: {
                                community: true
                            }
                        }
                    },
                    orderBy: { startTime: "asc" },
                },
                creator: {
                    include: {
                        partner: true
                    }
                },
                resource: {
                    include: {
                        author: true
                    }
                }
            }
        });

        if (!session) {
            return res.status(404).json({ 
                success: false, 
                message: 'Session not found or you do not have permission to access it' 
            });
        }

        // Calculate session statistics
        const now = new Date();
        const totalSlots = session.SessionSlot.length;
        const completedSlots = session.SessionSlot.filter(slot => new Date(slot.endTime) < now).length;
        const upcomingSlots = session.SessionSlot.filter(slot => new Date(slot.startTime) > now).length;
        const liveSlots = session.SessionSlot.filter(slot => {
            const startTime = new Date(slot.startTime);
            const endTime = new Date(slot.endTime);
            return startTime <= now && endTime >= now;
        }).length;

        const totalAttendees = session.SessionSlot.reduce((sum, slot) => sum + slot.Attendance.length, 0);
        const totalRevenue = session.SessionSlot.reduce((sum, slot) => {
            return sum + slot.Attendance.reduce((attendanceSum, attendance) => {
                return attendanceSum + (attendance.price || 0);
            }, 0);
        }, 0);

        // Get session status
        let sessionStatus = 'upcoming';
        if (completedSlots === totalSlots) {
            sessionStatus = 'completed';
        } else if (liveSlots > 0) {
            sessionStatus = 'live';
        }

        return res.status(200).json({
            success: true,
            data: {
                session: {
                    ...session,
                    status: sessionStatus,
                    statistics: {
                        totalSlots,
                        completedSlots,
                        upcomingSlots,
                        liveSlots,
                        totalAttendees,
                        totalRevenue
                    }
                }
            }
        });

    } catch (err) {
        console.log('Error while getting partner session by ID:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch partner session',
            error: err.message 
        });
    }
};

// assign session-slot for users
// req.body={users:[{email,name,phone}],sessionSlotId, tierId}
// for the users, create attendance records and setPaymentCompleted=true
// Additionally withdraw amount from the wallet
exports.assignUsersToSession = async function (req, res, next) {

}