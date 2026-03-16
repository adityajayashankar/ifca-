const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createCustomError } = require("../../middleware/errorHandling");
const { getExpertCommunitiesHelper } = require("../community/community");
const { findCommunityByIdHelper } = require("../services/getById");
const { getExpertByTagHelper } = require("./expert");
const bcrypt = require("bcryptjs");
const generatePassword = require("generate-password");
const emailService = require("../../services/email.service.js");
const XLSX = require("xlsx");
const generateDefaultPhotoURL = require('../../utils/generateDefaultPhotoURL');

// Helper function to send welcome email to expert
const sendExpertWelcomeEmail = async (expert, password) => {
  try {
    await emailService.sendEmail({
      to: expert.email,
      subject: 'Welcome to IFCA - Expert Account Created',
      template: 'expert-welcome-email',
      context: {
        email: expert.email,
        recipientName: expert.name,
        password: password,
        actionUrl: `https://pvl.ifcaindia.com/expert/login`,
        expertDashboardUrl: `https://pvl.ifcaindia.com/expert/dashboard`,
      },
    });
    console.log(`📧 Welcome email sent to expert: ${expert.email}`);
  } catch (error) {
    console.error(`❌ Error sending welcome email to expert ${expert.email}:`, error);
    // Don't throw error, just log it
  }
};

// Helper function to validate expert data
const validateExpertData = (data) => {
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

// Create single expert with proper signup logic
exports.createExpert = async function (req, res, next) {
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

    console.log(`🔐 Creating expert: ${email}`);
    console.log("📦 Desc received from request:", desc);

    // Validate input data
    const validationErrors = validateExpertData(req.body);
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
    


    // Create expert record
    const expert = await prisma.expert.create({
      data: {
        email,
        name,
        phone,
        address,
        pincode,
        photoURL: photoURL || generateDefaultPhotoURL(name),
        desc: desc?.trim() ? desc : "Hey there! I am an expert",

        password: hashedPassword,
        isActive: true,
      },
    });

    console.log(`✅ Expert created with ID: ${expert.id}`);

    // Create unified user record
    await prisma.unifiedUser.create({
      data: {
        email,
        expertId: expert.id,
        isActive: true,
      },
    });

    console.log(`✅ Unified user created for expert: ${expert.id}`);

    // Send welcome email (non-blocking)
    sendExpertWelcomeEmail(expert, password);

    return res.status(201).json({
      message: 'Expert created successfully',
      expert: {
        id: expert.id,
        email: expert.email,
        name: expert.name,
        phone: expert.phone,
        photoURL: expert.photoURL,
        isActive: expert.isActive,
      },
      credentials: {
        email: expert.email,
        password: password, // Return plain password for admin reference
      }
    });

  } catch (error) {
    console.error('❌ Error creating expert:', error);
    return res.status(500).json({ message: 'Something went wrong while creating expert' });
  }
};

// Bulk upload experts from Excel file
exports.bulkUploadExperts = async function (req, res, next) {
  try {
    const file = req.file;
    
    console.log('📁 Processing bulk expert upload');

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Read Excel file
    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const expertsData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (expertsData.length === 0) {
      return res.status(400).json({ message: "Excel file is empty" });
    }

    console.log(`📊 Processing ${expertsData.length} experts from Excel`);

    const createdExperts = [];
    const failedExperts = [];
    const skippedExperts = [];

    for (let i = 0; i < expertsData.length; i++) {
      const expertData = expertsData[i];
      const rowNumber = i + 2; // Excel rows start from 2 (1 is header)

      try {
        // Normalize data
        expertData.phone = expertData.phone?.toString() || '';
        expertData.pincode = expertData.pincode?.toString() || '';
        expertData.email = expertData.email?.toString().toLowerCase().trim() || '';
        expertData.name = expertData.name?.toString().trim() || '';

        const { email, name, phone, address, pincode, photoURL, desc } = expertData;

        // Validate required fields
        if (!email || !name || !phone || !address || !pincode) {
          failedExperts.push({
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
          skippedExperts.push({
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
          skippedExperts.push({
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

        // Create expert and unified user in a transaction
        const result = await prisma.$transaction(async (tx) => {
          // Create expert record
          const expert = await tx.expert.create({
            data: {
              email,
              name,
              phone,
              address,
              pincode,
              photoURL: photoURL || generateDefaultPhotoURL(name),
              desc: desc || "Hey there! I am an expert",
              password: hashedPassword,
              isActive: true,
            },
          });

          console.log(`✅ Expert created with ID: ${expert.id}`);

          // Create unified user record
          const unifiedUser = await tx.unifiedUser.create({
            data: {
              email,
              expertId: expert.id,
              isActive: true,
            },
          });

          console.log(`✅ Unified user created with ID: ${unifiedUser.id} for expert: ${expert.id}`);

          return { expert, unifiedUser };
        });

        // Send welcome email (non-blocking)
        sendExpertWelcomeEmail(result.expert, password);

        createdExperts.push({
          row: rowNumber,
          expert: {
            id: result.expert.id,
            email: result.expert.email,
            name: result.expert.name,
            phone: result.expert.phone,
          },
          credentials: {
            email: result.expert.email,
            password: password,
          }
        });

        console.log(`✅ Expert ${i + 1}/${expertsData.length} created: ${email}`);

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
        
        failedExperts.push({
          row: rowNumber,
          email: expertData.email || 'N/A',
          reason: errorMessage
        });
      }
    }

    console.log(`📊 Bulk upload completed: ${createdExperts.length} created, ${skippedExperts.length} skipped, ${failedExperts.length} failed`);

    return res.status(200).json({
      message: 'Bulk expert upload completed',
      summary: {
        total: expertsData.length,
        created: createdExperts.length,
        skipped: skippedExperts.length,
        failed: failedExperts.length
      },
      createdExperts,
      skippedExperts,
      failedExperts
    });

  } catch (error) {
    console.error('❌ Error in bulk upload:', error);
    return res.status(500).json({ message: 'Something went wrong during bulk upload' });
  }
};

// getAllExperts
exports.getAllExperts = async function (req, res, next) {
  try {
    // Fetch all experts with their unifiedUserId
    const experts = await prisma.expert.findMany({
      include: {
        unifiedUserId: true,
      },
    });

    // For each expert, fetch their session slots using unifiedUserId
    const expertsWithSessions = await Promise.all(
      experts.map(async (expert) => {
        let sessionSlots = [];
        if (expert.unifiedUserId && expert.unifiedUserId.id) {
          sessionSlots = await prisma.sessionSlot.findMany({
            where: { speakerId: expert.unifiedUserId.id },
            include: {
              session: {
                select: {
                  id: true,
                  title: true,
                  createdAt: true,
                },
              },
            },
          });
        }
        return { ...expert, sessionSlots };
      })
    );

    // Filter experts based on unifiedUser.isActive status
    const activeExperts = expertsWithSessions.filter(
      (expert) => expert.unifiedUserId && expert.unifiedUserId.isActive === true
    );

    const disabledExperts = expertsWithSessions.filter(
      (expert) => !expert.unifiedUserId || expert.unifiedUserId.isActive === false
    );

    // Add statistics to each expert
    const addStatsToExpert = (expert) => {
      const today = new Date();
      const totalSessions = expert.sessionSlots?.length || 0;
      const upcomingSessions = expert.sessionSlots?.filter(item => 
        new Date(item.endTime) >= today
      ).length || 0;
      const completedSessions = totalSessions - upcomingSessions;

      return {
        ...expert,
        statistics: {
          sessions: {
            total: totalSessions,
            upcoming: upcomingSessions,
            completed: completedSessions
          }
        }
      };
    };

    const activeExpertsWithStats = activeExperts.map(addStatsToExpert);
    const disabledExpertsWithStats = disabledExperts.map(addStatsToExpert);

    return res.status(200).json({ 
      activeExperts: activeExpertsWithStats,
      disabledExperts: disabledExpertsWithStats,
      summary: {
        totalExperts: expertsWithSessions.length,
        activeExperts: activeExperts.length,
        disabledExperts: disabledExperts.length
      }
    });

  } catch (error) {
    console.log(`Error while fetching all experts @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

// getExpertById
exports.getExpertById = async function (req, res, next) {
  const { id } = req.params;
  if (isNaN(Number(id))) {
    return res.status(400).json({ status: 400, message: "Invalid expert ID" });
  }
  try {
    const expert = await prisma.expert.findUnique({
      where: { id: Number(id) },
      include: {
        unifiedUserId: {
          include: {
            subscriptions: {
              include: {
                community: {
                  select: {
                    id: true,
                    title: true,
                    desc: true,
                    bannerImg: true,
                    price: true,
                    createdAt: true,
                    updatedAt: true
                  }
                }
              },
              orderBy: { createdAt: "desc" }
            },
            resource: {
              include: {
                community: {
                  select: { id: true, title: true }
                }
              },
              orderBy: { uploadedAt: "desc" }
            },
            post: {
              include: {
                community: { select: { id: true, title: true } },
                session: { select: { id: true, title: true } }
              },
              orderBy: { createdAt: "desc" }
            }
          }
        },
        SpeakerRecommendations: true,
        Transaction: true
      }
    });

    if (!expert) {
      return res.status(404).json({ status: 404, message: "Expert not found" });
    }

    let sessionSlots = [];
    if (expert.unifiedUserId && expert.unifiedUserId.id) {
      sessionSlots = await prisma.sessionSlot.findMany({
        where: { speakerId: expert.unifiedUserId.id },
        include: {
          session: {
            select: {
              id: true,
              title: true,
              desc: true,
              bannerImgs: true,
              createdAt: true,
              updatedAt: true
            }
          },
          speakers: {
            select: {
              id: true,
              email: true,
              expert: { select: { photoURL: true, name: true } },
              user: { select: { photoURL: true, name: true } },
              partner: { select: { photoURL: true, name: true } },
              admin: { select: { photoURL: true, name: true } }
            }
          }
        }
      });
    }

    res.json({ expert, sessionSlots });
  } catch (error) {
    console.error("Error in getExpertById:", error);
    next(error);
  }
};

// getExpertByIdForEdit
exports.getExpertByIdForEdit = async function (req, res, next) {
  const { id } = req.params;
  try {
    const expert = await prisma.expert.findUnique({
      where: { id: Number(id) },
      include: {
        unifiedUserId: {
          include: {
            subscriptions: {
              include: {
                community: {
                  select: {
                    id: true,
                    title: true,
                    bannerImg: true,
                    price: true
                  }
                }
              }
            },
            resource: {
              include: {
                community: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              }
            },
            post: {
              include: {
                community: {
                  select: {
                    id: true,
                    title: true
                  }
                },
                session: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              },
              orderBy: {
                createdAt: 'desc'
              }
            }
          }
        }
      },
    });

    if (!expert) {
      return res.status(404).json({ 
        status: 404, 
        message: "Expert not found" 
      });
    }

    let sessionSlots = [];
    if (expert.unifiedUserId && expert.unifiedUserId.id) {
      sessionSlots = await prisma.sessionSlot.findMany({
        where: { speakerId: expert.unifiedUserId.id },
        include: {
          session: {
            select: {
              id: true,
              title: true,
              createdAt: true
            }
          },
          speakers: {
            select: {
              id: true,
              email: true,
              expert: { select: { photoURL: true, name: true } },
              user: { select: { photoURL: true, name: true } },
              partner: { select: { photoURL: true, name: true } },
              admin: { select: { photoURL: true, name: true } }
            }
          }
        }
      });
    }

    return res.status(200).json({ 
      status: 200, 
      expert,
      sessionSlots,
      summary: {
        totalSessions: sessionSlots.length,
        totalPosts: expert.unifiedUserId?.post?.length || 0,
        totalResources: expert.unifiedUserId?.resource?.length || 0,
        totalCommunities: expert.unifiedUserId?.subscriptions?.length || 0
      }
    });
  } catch (error) {
    console.log(`Error while fetching expert for edit id: ${id}`);
    console.log(error);
    next(error);
  }
};

exports.updateExpertById = async function (req, res, next) {
  const { id } = req.params;
  try {
    const updatedExpert = await prisma.expert.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    return res.status(202).json({ status: 202, expert: updatedExpert });
  } catch (error) {
    console.log(`Error while updating expert id: ${id}`);
    console.log(error);
    next(error);
  }
};

exports.deleteExpertById = async function (req, res, next) {
  const { id } = req.params;

  try {

    const unifiedUser = await prisma.unifiedUser.findUnique({
      where: { expertId: parseInt(id) },
      // select: { expertId: true },
    });

    console.log('expert hereee---', unifiedUser)

    if (!unifiedUser || !unifiedUser.id) {
      return res.status(404).json({ status: 404, message: "Expert not found" });
    }

    const expertId = unifiedUser.id;

    await prisma.session.updateMany({
      where: { creatorId: expertId },
      data: { isActive: false },
    });

    const updatedExpert = await prisma.expert.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });

    await prisma.unifiedUser.update({
      where: { id: expertId },
      data: { isActive: false }
    });

    return res.status(200).json({ status: 200, expert: updatedExpert });
  } catch (error) {
    console.log(`Error while deleting expert id: ${id}`);
    console.log(error);
    next(error);
  }
};

exports.enableExpertById = async function (req, res, next) {
  const { id } = req.params;

  try {
    const unifiedUser = await prisma.unifiedUser.findUnique({
      where: { expertId: parseInt(id) },
    });

    if (!unifiedUser || !unifiedUser.id) {
      return res.status(404).json({ status: 404, message: "Expert not found" });
    }

    
    const updatedUnifiedUser = await prisma.unifiedUser.update({
      where: { id: unifiedUser.id },
      data: { isActive: true },
    });

    return res.status(200).json({ status: 200, unifiedUser: updatedUnifiedUser });
  } catch (error) {
    console.log(`Error while enabling expert id: ${id}`);
    console.log(error);
    next(error);
  }
};

// for assigning speakers
exports.getExpertByTag = async function (req, res, next) {
  const { tag } = req.query;
  try {
    const experts = await getExpertByTagHelper(tag);
    return res.status(200).json({ expert: experts });
  } catch (error) {
    console.log(`Error while fetching expert by name:${name}`);
    console.log(error);
    next(error);
  }
};

// getExpertSessions
exports.getExpertSessions = async function (req, res, next) {
  const { id } = req.params;
  try {
    const expert = await prisma.expert.findUnique({
      where: { id: Number(id) },
      include: {
        unifiedUserId: true
      }
    });

    if (!expert) {
      return res.status(404).json({ 
        status: 404, 
        message: "Expert not found" 
      });
    }

    let sessionSlots = [];
    if (expert.unifiedUserId && expert.unifiedUserId.id) {
      sessionSlots = await prisma.sessionSlot.findMany({
        where: { speakerId: expert.unifiedUserId.id },
        include: {
          session: {
            include: {
              community: {
                select: {
                  id: true,
                  title: true,
                  bannerImg: true
                }
              }
            }
          },
          speakers: {
            select: {
              id: true,
              email: true,
              expert: { select: { photoURL: true, name: true } },
              user: { select: { photoURL: true, name: true } },
              partner: { select: { photoURL: true, name: true } },
              admin: { select: { photoURL: true, name: true } }
            }
          }
        },
      });
    }

    // Get session counts
    const today = new Date();
    const sessions = [],
      completedSessions = [],
      slots = [];

    sessionSlots.forEach((item) => {
      if (new Date(item.endTime) >= today) {
        slots.push(item);
        let temp = JSON.parse(JSON.stringify(item));
        delete temp.session;
        sessions.push({
          ...item.session,
          SessionSlot: [{ ...temp, link: item.link }],
        });
      } else {
        completedSessions.push({ ...item.session, SessionSlot: [item] });
      }
    });

    // Get session counts
    const totalSessions = sessionSlots.length;
    const upcomingSessions = sessions.length;
    const completedSessionsCount = completedSessions.length;

    return res.status(200).json({ 
      sessions, 
      completedSessions,
      counts: {
        totalSessions,
        upcomingSessions,
        completedSessions: completedSessionsCount
      }
    });
  } catch (error) {
    console.log(`Error while fetching expert sessions:${id}`);
    console.log(error);
    next(error);
  }
};

// to buy a subscription for a community
exports.createPaymentExpert = async function (req, res, next) {
  const {
    expertId,
    communityId,
    expiresAt,
    amount,
    transactionId,
    paymentId,
    category,
    startsAt,
  } = req.body;

  try {
    let transactionObject = { expertId, amount, transactionId, paymentId };

    const community = await findCommunityByIdHelper(communityId);
    if (amount !== community.price) {
      throw createCustomError({ status: 400, message: "Invalid amount" });
    }

    let subObject = { expiresAt, category, startsAt };
    const subscription = await prisma.subscription.create({
      data: {
        ...subObject,
        community: {
          connect: {
            id: communityId,
          },
        },

        expert: {
          connect: {
            id: expertId,
          },
        },
        transaction: {
          create: transactionObject,
        },
      },
    });

    return res.status(200).json({ subscription });
  } catch (err) {
    console.log(
      `Error while processing payment for: ${expertId} @ ${__filename}`
    );
    console.log(err);
    next(err);
  }
};

// get expert communities
exports.getExpertCommunities = async function (req, res, next) {
  const { id } = req.params;

  try {
    // First check if expert exists
    const expert = await prisma.expert.findUnique({
      where: { id: parseInt(id) },
      include: {
        unifiedUserId: true
      }
    });

    if (!expert) {
      return res.status(404).json({ 
        status: 404, 
        message: "Expert not found" 
      });
    }

    const communities = await getExpertCommunitiesHelper(parseInt(id));
    
    // Get community counts
    const totalCommunities = communities.length;
    const activeCommunities = communities.filter(community => 
      community.subscription && new Date(community.subscription.expiresAt) > new Date()
    ).length;
    const expiredCommunities = totalCommunities - activeCommunities;

    return res.status(200).json({ 
      status: 200, 
      communities,
      counts: {
        totalCommunities,
        activeCommunities,
        expiredCommunities
      }
    });
  } catch (err) {
    console.log(`Error while fetching communities of expert:${id}`);
    console.log(err);
    next(err);
  }
};

// get expert statistics (sessions and communities count)
exports.getExpertStats = async function (req, res, next) {
  const { id } = req.params;

  try {
    const expert = await prisma.expert.findUnique({
      where: { id: Number(id) },
      include: {
        unifiedUserId: true
      }
    });

    if (!expert) {
      return res.status(404).json({ 
        status: 404, 
        message: "Expert not found" 
      });
    }

    let sessionSlots = [];
    if (expert.unifiedUserId && expert.unifiedUserId.id) {
      sessionSlots = await prisma.sessionSlot.findMany({
        where: { speakerId: expert.unifiedUserId.id },
        include: {
          session: {
            select: {
              id: true,
              title: true,
              createdAt: true
            }
          },
        },
      });
    }

    // Get session statistics
    const today = new Date();
    const totalSessions = sessionSlots.length;
    const upcomingSessions = sessionSlots.filter(item => 
      new Date(item.endTime) >= today
    ).length || 0;
    const completedSessions = totalSessions - upcomingSessions;

    // Get community statistics
    const communities = await getExpertCommunitiesHelper(Number(id));
    const totalCommunities = communities.length;
    const activeCommunities = communities.filter(community => 
      community.subscription && new Date(community.subscription.expiresAt) > new Date()
    ).length;
    const expiredCommunities = totalCommunities - activeCommunities;

    // Get recent sessions (last 5)
    const recentSessions = sessionSlots
      ?.sort((a, b) => new Date(b.session.createdAt) - new Date(a.session.createdAt))
      .slice(0, 5)
      .map(slot => ({
        id: slot.session.id,
        title: slot.session.title,
        startTime: slot.startTime,
        endTime: slot.endTime,
        community: slot.session.community
      })) || [];

    return res.status(200).json({ 
      status: 200,
      expert: {
        id: expert.id,
        name: expert.name,
        email: expert.email,
        photoURL: expert.photoURL,
        desc: expert.desc,
        isActive: expert.isActive
      },
      statistics: {
        sessions: {
          total: totalSessions,
          upcoming: upcomingSessions,
          completed: completedSessions
        },
        communities: {
          total: totalCommunities,
          active: activeCommunities,
          expired: expiredCommunities
        }
      },
      recentSessions
    });
  } catch (err) {
    console.log(`Error while fetching expert statistics:${id}`);
    console.log(err);
    next(err);
  }
};
