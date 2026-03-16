const { google } = require("googleapis");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const readline = require("readline");
const EventEmitter = require("events");
const createNewForm = require("../../services/formServices");
const { RewardType, RewardAction } = require("@prisma/client");
const { rewardsManagement } = require("../../services/rewards/rewards.service");

EventEmitter.defaultMaxListeners = 30;
const TOKEN_PATH = "./token.json";
const creds = {
  web: {
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
    project_id: process.env.GOOGLE_OAUTH_PROJECT_ID || "",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
    redirect_uris: [
      process.env.GOOGLE_OAUTH_REDIRECT_URI ||
        "http://localhost:5000/api/v1/forms/sheet-data",
    ],
    javascript_origins: [
      process.env.GOOGLE_OAUTH_JAVASCRIPT_ORIGIN || "http://localhost:5000",
    ],
  },
};

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets.readonly",
  "https://www.googleapis.com/auth/forms.responses.readonly",
];

// Utility function for pagination
const getPaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 10, 100); // Max 100 items per page
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// Utility function for response formatting
const formatPaginatedResponse = (data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

// Google API authorization
async function authorize() {
  console.log("🔐 [GOOGLE_AUTH] Starting authorization...");
  const { client_secret, client_id, redirect_uris } = creds.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0],
  );

  try {
    const token = fs.readFileSync(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
    console.log("✅ [GOOGLE_AUTH] Authorization successful");
    return oAuth2Client;
  } catch (err) {
    console.log("⚠️ [GOOGLE_AUTH] Token file not found, getting new access token...");
    return getAccessToken(oAuth2Client);
  }
}

async function getAccessToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("🔗 [GOOGLE_AUTH] Authorize this app by visiting this url:", authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await new Promise((resolve) => {
    rl.question("Enter the code from that page here: ", (code) => {
      rl.close();
      resolve(code);
    });
  });

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log("✅ [GOOGLE_AUTH] Token stored to", TOKEN_PATH);
    return oAuth2Client;
  } catch (err) {
    console.error("❌ [GOOGLE_AUTH] Error retrieving access token", err);
    throw err;
  }
}

// ========================================
// FORM MANAGEMENT CONTROLLERS
// ========================================

exports.createForm = async (req, res) => {
  console.log("📝 [CREATE_FORM] Request received:", { body: req.body });
  
  const { formName, creatorId, questions, isGlobal, communityIds } = req.body;

  if (!formName || !creatorId || !questions || questions.length === 0) {
    console.log("❌ [CREATE_FORM] Validation failed: Missing required fields");
    return res
      .status(400)
      .json({ error: "Form name, creatorId, and questions are required." });
  }

  try {
    console.log("🔄 [CREATE_FORM] Creating form with data:", { formName, creatorId, isGlobal, communityIds });
    
    const form = await createNewForm(
      formName,
      creatorId,
      questions,
      isGlobal,
      communityIds,
    );

    console.log("✅ [CREATE_FORM] Form created successfully:", { formId: form.id });
    return res.status(201).json({
      message: "Form created successfully!",
      form,
    });
  } catch (error) {
    console.error("❌ [CREATE_FORM] Error creating form:", error);
    return res.status(500).json({ error: "Failed to save the form" });
  }
};

exports.editForm = async (req, res) => {
  console.log("✏️ [EDIT_FORM] Request received:", { params: req.params, body: req.body });
  
  try {
    const { formName, adminId, formLink, formImg, formDesc } = req.body;
    const { formId } = req.params;

    console.log("🔄 [EDIT_FORM] Updating form:", { formId, formName, adminId });

    const updatedForm = await prisma.customForm.update({
      where: { id: parseInt(formId) },
      data: {
        formName,
        adminId,
        formLink,
        formImg,
        formDesc,
      },
    });

    console.log("✅ [EDIT_FORM] Form updated successfully:", { formId: updatedForm.id });
    res.status(200).json(updatedForm);
  } catch (error) {
    console.error("❌ [EDIT_FORM] Error updating form:", error);
    res.status(500).json({ error: "Failed to update form" });
  }
};

exports.deleteForm = async (req, res) => {
  console.log("🗑️ [DELETE_FORM] Request received:", { formId: req.params.formId });
  
  const formId = parseInt(req.params.formId);

  try {
    const form = await prisma.form.findUnique({
      where: { id: formId },
    });

    if (!form) {
      console.log("❌ [DELETE_FORM] Form not found:", { formId });
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }

    console.log("🔄 [DELETE_FORM] Deleting form and related data:", { formId, formName: form.formName });

    // Use transaction for atomic deletion
    await prisma.$transaction([
      prisma.formCommunity.deleteMany({ where: { formId } }),
      prisma.formResponse.deleteMany({ where: { formId } }),
      prisma.question.deleteMany({ where: { formId } }),
      prisma.form.delete({ where: { id: formId } }),
    ]);

    console.log("✅ [DELETE_FORM] Form deleted successfully:", { formId });
    return res
      .status(200)
      .json({ success: true, message: "Form deleted successfully" });
  } catch (error) {
    console.error("❌ [DELETE_FORM] Error deleting form:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateFormByCreator = async (req, res) => {
  console.log("✏️ [UPDATE_FORM_BY_CREATOR] Request received:", { 
    formId: req.params.formId, 
    body: req.body 
  });
  
  const { formId } = req.params;
  const { formName, formFields } = req.body;

  try {
    console.log("🔄 [UPDATE_FORM_BY_CREATOR] Updating form:", { formId, formName });

    const updatedForm = await prisma.form.update({
      where: { id: formId },
      data: {
        formName,
        formFields,
      },
    });

    console.log("✅ [UPDATE_FORM_BY_CREATOR] Form updated successfully:", { formId: updatedForm.id });
    return res.status(200).json(updatedForm);
  } catch (error) {
    console.error("❌ [UPDATE_FORM_BY_CREATOR] Error updating form:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ========================================
// FORM RETRIEVAL CONTROLLERS (OPTIMIZED)
// ========================================

exports.getAllForms = async (req, res) => {
  console.log("📋 [GET_ALL_FORMS] Request received:", { query: req.query });
  
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, creatorId, isGlobal, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build where clause
    const where = {};
    if (search) {
      where.formName = { contains: search, mode: 'insensitive' };
    }
    if (creatorId) {
      where.creatorId = parseInt(creatorId);
    }
    if (isGlobal !== undefined) {
      where.isGlobal = isGlobal === 'true';
    }

    // Validate sort fields
    const allowedSortFields = ['createdAt', 'updatedAt', 'formName', 'creatorId'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';

    console.log("🔄 [GET_ALL_FORMS] Fetching forms with filters:", { 
      where, 
      sortBy: validSortBy, 
      sortOrder: validSortOrder,
      page,
      limit 
    });

    // Parallel execution for better performance
    const [forms, total] = await Promise.all([
      prisma.form.findMany({
        where,
        include: {
          _count: {
            select: {
              Question: true,
              FormResponse: true,
              FormCommunity: true,
            },
          },
          unifiedUser: {
            select: {
              user: { select: { name: true } },
              partner: { select: { name: true } },
              admin: { select: { name: true } },
              expert: { select: { name: true } },
            },
          },
        },
        orderBy: { [validSortBy]: validSortOrder },
        skip,
        take: limit,
      }),
      prisma.form.count({ where }),
    ]);

    console.log("✅ [GET_ALL_FORMS] Retrieved forms:", { count: forms.length, total });

    const response = formatPaginatedResponse(forms, page, limit, total);
    return res.status(200).json(response);
  } catch (error) {
    console.error("❌ [GET_ALL_FORMS] Error fetching forms:", error);
    res.status(500).json({ error: "Failed to fetch forms" });
  }
};

exports.getFormById = async (req, res) => {
  console.log("🔍 [GET_FORM_BY_ID] Request received:", { formId: req.params.formId });
  
  try {
    const { formId } = req.params;

    // Validate formId
    const parsedFormId = parseInt(formId);
    if (isNaN(parsedFormId)) {
      console.log("❌ [GET_FORM_BY_ID] Invalid formId:", formId);
      return res.status(400).json({ error: "Invalid form ID" });
    }

    console.log("🔍 [GET_FORM_BY_ID] Looking for form with ID:", parsedFormId);

    const form = await prisma.form.findUnique({
      where: { id: parsedFormId },
      include: {
        Question: {
          orderBy: { createdAt: 'asc' },
        },
        FormCommunity: {
          include: {
            Community: {
              select: {
                id: true,
                title: true,
                desc: true,
              },
            },
          },
        },
        _count: {
          select: {
            FormResponse: true,
            Question: true,
          },
        },
        unifiedUser: {
          select: {
            user: { select: { name: true, email: true } },
            partner: { select: { name: true, email: true } },
            admin: { select: { name: true, email: true } },
            expert: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!form) {
      console.log("❌ [GET_FORM_BY_ID] Form not found:", { formId });
      return res.status(404).json({ error: "Form not found" });
    }

    const isCommunitySpecific = form.FormCommunity.length > 0;
    const communityData = isCommunitySpecific
      ? form.FormCommunity.map((formCommunity) => ({
          communityId: formCommunity.Community.id,
          communityName: formCommunity.Community.title,
          communityDesc: formCommunity.Community.desc,
        }))
      : [];

    console.log("✅ [GET_FORM_BY_ID] Form retrieved successfully:", { 
      formId, 
      isCommunitySpecific, 
      communityCount: communityData.length,
      questionCount: form._count.Question,
      responseCount: form._count.FormResponse
    });

    res.status(200).json({
      form: {
        ...form,
        communityData,
        isCommunitySpecific,
      },
    });
  } catch (error) {
    console.error("❌ [GET_FORM_BY_ID] Error fetching form:", error);
    res.status(500).json({ error: "Failed to fetch form" });
  }
};

exports.getAllFormsByUserId = async (req, res) => {
  console.log("👤 [GET_FORMS_BY_USER] Request received:", { userId: req.params.id });
  
  try {
    const { id } = req.params;
    const { page, limit, skip } = getPaginationParams(req.query);

    console.log("🔄 [GET_FORMS_BY_USER] Fetching forms for user:", { userId: id, page, limit });

    const [forms, total] = await Promise.all([
      prisma.form.findMany({
        where: { creatorId: Number(id) },
        include: {
          _count: {
            select: {
              Question: true,
              FormResponse: true,
              FormCommunity: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.form.count({ where: { creatorId: Number(id) } }),
    ]);
    
    console.log("✅ [GET_FORMS_BY_USER] Retrieved forms:", { count: forms.length, total });
    
    if (forms.length === 0) {
      return res.status(200).json({ 
        message: "No forms found for this user",
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false }
      });
    }

    const response = formatPaginatedResponse(forms, page, limit, total);
    return res.status(200).json(response);
  } catch (error) {
    console.error("❌ [GET_FORMS_BY_USER] Error fetching forms:", error);
    return res.status(500).json({ error: "Failed to fetch Forms by UserID" });
  }
};

exports.getFormsByCommunityId = async (req, res) => {
  console.log("🏘️ [GET_FORMS_BY_COMMUNITY] Request received:", { communityId: req.params.communityId });
  
  try {
    const communityId = parseInt(req.params.communityId);
    const { page, limit, skip } = getPaginationParams(req.query);

    console.log("🔄 [GET_FORMS_BY_COMMUNITY] Fetching forms for community:", { communityId, page, limit });

    // Step 1: Get formIds linked to the communityId
    const formCommunityLinks = await prisma.formCommunity.findMany({
      where: { communityId },
      select: { formId: true },
    });

    const formIds = formCommunityLinks.map((fc) => fc.formId);
    console.log("📋 [GET_FORMS_BY_COMMUNITY] Forms linked to community:", formIds.length);

    if (formIds.length === 0) {
      return res
        .status(200)
        .json({ 
          message: "No forms found for this community",
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false }
        });
    }

    // Step 2: Get Forms with pagination
    const [forms, total] = await Promise.all([
      prisma.form.findMany({
        where: { id: { in: formIds } },
        include: {
          _count: {
            select: {
              Question: true,
              FormResponse: true,
            },
          },
          unifiedUser: {
            select: {
              user: { select: { name: true } },
              partner: { select: { name: true } },
              admin: { select: { name: true } },
              expert: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.form.count({ where: { id: { in: formIds } } }),
    ]);

    console.log("✅ [GET_FORMS_BY_COMMUNITY] Retrieved forms:", { count: forms.length, total });

    const response = formatPaginatedResponse(forms, page, limit, total);
    return res.status(200).json(response);
  } catch (error) {
    console.error("❌ [GET_FORMS_BY_COMMUNITY] Error fetching forms by communityId:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getAllUsers = async (req, res) => {
  console.log("👥 [GET_ALL_USERS] Request received");
  
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, role } = req.query;

    // Build where clause
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    console.log("🔄 [GET_ALL_USERS] Fetching users:", { where, page, limit });

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          photoURL: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    console.log("✅ [GET_ALL_USERS] Retrieved users:", { count: users.length, total });

    const response = formatPaginatedResponse(users, page, limit, total);
    res.status(200).json(response);
  } catch (error) {
    console.error("❌ [GET_ALL_USERS] Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// ========================================
// FORM RESPONSE CONTROLLERS (OPTIMIZED)
// ========================================

exports.submitFormResponse = async (req, res) => {
  console.log("📝 [SUBMIT_FORM_RESPONSE] Request received:", { 
    params: req.params, 
    body: req.body, 
    user: req.user 
  });
  
  try {
    const { formId } = req.params;
    const { responses, communityId } = req.body;
    const userId = req.user?.unifiedUserId || req.user?.id;

    // Validate formId
    const parsedFormId = parseInt(formId);
    if (isNaN(parsedFormId)) {
      console.log("❌ [SUBMIT_FORM_RESPONSE] Invalid formId:", formId);
      return res.status(400).json({ error: "Invalid form ID" });
    }


    if (!formId || !responses) {
      console.log("❌ [SUBMIT_FORM_RESPONSE] Missing required fields");
      return res
        .status(400)
        .json({ error: "Form ID and responses are required" });
    }

    if (!userId) {
      console.log("❌ [SUBMIT_FORM_RESPONSE] User not authenticated");
      return res
        .status(401)
        .json({ error: "User not authenticated" });
    }

    // Use default communityId if not provided
    const finalCommunityId = communityId || 1;

    console.log("🔄 [SUBMIT_FORM_RESPONSE] Processing submission:", { formId, userId, communityId: finalCommunityId });

    // Check if form is mapped to communities
    const formCommunities = await prisma.formCommunity.findMany({
      where: { formId: parsedFormId },
    });

    console.log("📋 [SUBMIT_FORM_RESPONSE] Form communities found:", formCommunities.length);

    // Check existing responses based on form mapping
    let existingResponse;
    if (formCommunities.length > 0) {
      // Form is mapped to communities - check if user has responded to this specific community
      existingResponse = await prisma.formResponse.findFirst({
        where: {
          formId: parsedFormId,
          userId: parseInt(userId),
          communityId: parseInt(finalCommunityId),
        },
      });
      console.log("🔍 [SUBMIT_FORM_RESPONSE] Checking community-specific response:", { hasExisting: !!existingResponse });
    } else {
      // Form is not mapped to any community - check if user has responded at all
      existingResponse = await prisma.formResponse.findFirst({
        where: {
          formId: parsedFormId,
          userId: parseInt(userId),
        },
      });
      console.log("🔍 [SUBMIT_FORM_RESPONSE] Checking global response:", { hasExisting: !!existingResponse });
    }

    // if (existingResponse) {
    //   console.log("❌ [SUBMIT_FORM_RESPONSE] User has already responded");
    //   return res.status(409).json({
    //     error: "User has already responded to this form",
    //     message: formCommunities.length > 0 
    //       ? "You have already submitted a response for this form in this community"
    //       : "You have already submitted a response for this form",
    //     hasResponded: true,
    //   });
    // }
    if (existingResponse) {
  console.log("❌ [SUBMIT_FORM_RESPONSE] User has already responded");

  const existingFullResponse = await prisma.formResponse.findFirst({
    where: { id: existingResponse.id },
    include: {
      Response: {
        include: {
          Question: {
            select: {
              id: true,
              question: true,
              answerType: true,
              description: true,
              options: true,
            },
          },
        },
      },
    },
  });

  const responseData = existingFullResponse.Response.map((ans) => ({
    questionId: ans.questionId,
    answer: ans.answer,
    question: ans.Question,
  }));

  return res.status(409).json({
    error: "User has already responded to this form",
    message: formCommunities.length > 0 
      ? "You have already submitted a response for this form in this community"
      : "You have already submitted a response for this form",
    hasResponded: true,
    responses: responseData,
    submittedAt: existingFullResponse.createdAt,
  });
}


    console.log("✅ [SUBMIT_FORM_RESPONSE] Creating new response");

    // Use transaction for atomic operation
    const formResponse = await prisma.$transaction(async (tx) => {
      const response = await tx.formResponse.create({
        data: {
          formId: parsedFormId,
          userId: parseInt(userId),
          communityId: parseInt(finalCommunityId),
          Response: {
            create: Object.entries(responses).map(([questionId, answer]) => ({
              questionId: parseInt(questionId),
              answer: typeof answer === "object" ? JSON.stringify(answer) : answer,
            })),
          },
        },
        include: { Response: true },
      });

      // Award rewards
      await rewardsManagement({
        userId: parseInt(userId),
        rewardRuleName: RewardAction.REPLY_TO_FORM,
        type: RewardType.CREDIT,
      });

      return response;
    });

    console.log("✅ [SUBMIT_FORM_RESPONSE] Response submitted successfully");
    res
      .status(200)
      .json({ 
        message: "Responses saved successfully", 
        formResponse,
        hasResponded: true 
      });
  } catch (error) {
    console.error("❌ [SUBMIT_FORM_RESPONSE] Error saving form responses:", error);
    res.status(500).json({ error: "Failed to save form responses" });
  }
};

exports.getUserFormResponseStatus = async (req, res) => {
  console.log("🔍 [GET_USER_RESPONSE_STATUS] Request received:", { 
    query: req.query, 
    user: req.user 
  });
  
  try {
    const { formId, communityId } = req.query;
    const userId = req.user?.unifiedUserId || req.user?.id; // Get userId from authentication token

    console.log("🔍 [GET_USER_RESPONSE_STATUS] Parsed parameters:", { formId, communityId, userId });
    console.log("🔍 [GET_USER_RESPONSE_STATUS] Full user object:", req.user);

    if (!formId) {
      console.log("❌ [GET_USER_RESPONSE_STATUS] Missing formId");
      return res
        .status(400)
        .json({ 
          success: false,
          error: "Form ID is required" 
        });
    }

    if (!userId) {
      console.log("❌ [GET_USER_RESPONSE_STATUS] User not authenticated");
      return res
        .status(401)
        .json({ 
          success: false,
          error: "User not authenticated" 
        });
    }

    // Use default communityId if not provided
    const finalCommunityId = communityId || 1;

    console.log("🔄 [GET_USER_RESPONSE_STATUS] Checking status for:", { formId, userId, communityId: finalCommunityId });

    // Validate formId
    const parsedFormId = parseInt(formId);
    if (isNaN(parsedFormId)) {
      console.log("❌ [GET_USER_RESPONSE_STATUS] Invalid formId:", formId);
      return res.status(400).json({ 
        success: false,
        error: "Invalid form ID" 
      });
    }

    // First, let's check if the form exists
    const formExists = await prisma.form.findUnique({
      where: { id: parsedFormId },
      select: { id: true, formName: true }
    });

    if (!formExists) {
      console.log("❌ [GET_USER_RESPONSE_STATUS] Form not found:", formId);
      return res.status(404).json({
        success: false,
        error: "Form not found"
      });
    }

    console.log("✅ [GET_USER_RESPONSE_STATUS] Form found:", formExists);

    // Now check for user response
    const formResponse = await prisma.formResponse.findFirst({
      where: {
        formId: parsedFormId,
        userId: parseInt(userId),
        communityId: parseInt(finalCommunityId),
      },
      include: {
        Response: {
          include: {
            Question: {
              select: {
                id: true,
                question: true,
                answerType: true,
                description: true,
                options: true,
              },
            },
          },
        },
      },
    });

    console.log("🔍 [GET_USER_RESPONSE_STATUS] Database query result:", !!formResponse);

    if (formResponse) {
      console.log("✅ [GET_USER_RESPONSE_STATUS] User has responded");
      const responseData = formResponse.Response.map((answer) => ({
        questionId: answer.questionId,
        answer: answer.answer,
        question: answer.Question,
      }));

      return res.status(200).json({
        success: true,
        hasResponded: true,
        responses: responseData,
        submittedAt: formResponse.createdAt,
      });
    } else {
      console.log("✅ [GET_USER_RESPONSE_STATUS] User has not responded");
      return res.status(200).json({
        success: true,
        hasResponded: false,
        responses: null,
        submittedAt: null,
      });
    }
  } catch (error) {
    console.error("❌ [GET_USER_RESPONSE_STATUS] Error checking user form response status:", error);
    console.error("❌ [GET_USER_RESPONSE_STATUS] Error stack:", error.stack);
    res.status(500).json({ 
      success: false,
      error: "Failed to check user form response status",
      details: error.message
    });
  }
};

exports.getFormResponsesForUser = async (req, res) => {
  console.log("📊 [GET_FORM_RESPONSES_FOR_USER] Request received:", { query: req.query });
  
  try {
    const { formId, userId, communityId } = req.query;

    if (!formId || !userId) {
      console.log("❌ [GET_FORM_RESPONSES_FOR_USER] Missing required parameters");
      return res
        .status(400)
        .json({ error: "Form ID and User ID are required" });
    }

    // Use default communityId if not provided
    const finalCommunityId = communityId || 1;

    console.log("🔄 [GET_FORM_RESPONSES_FOR_USER] Fetching responses for:", { formId, userId, communityId: finalCommunityId });

    // Validate formId
    const parsedFormId = parseInt(formId);
    if (isNaN(parsedFormId)) {
      console.log("❌ [GET_FORM_RESPONSES_FOR_USER] Invalid formId:", formId);
      return res.status(400).json({ error: "Invalid form ID" });
    }

    const formResponse = await prisma.formResponse.findFirst({
      where: {
        formId: parsedFormId,
        userId: parseInt(userId),
        communityId: parseInt(finalCommunityId),
      },
      include: {
        Response: {
          include: {
            Question: {
              select: {
                id: true,
                question: true,
                answerType: true,
                description: true,
                options: true,
              },
            },
          },
        },
      },
    });

    if (!formResponse) {
      console.log("✅ [GET_FORM_RESPONSES_FOR_USER] No responses found");
      return res
        .status(200)
        .json({
          hasResponded: false,
          message: "No responses found for this form, user, and community",
        });
    }

    console.log("✅ [GET_FORM_RESPONSES_FOR_USER] Responses found");

    const responseData = formResponse.Response.map((answer) => ({
      questionId: answer.questionId,
      answer: answer.answer,
      question: answer.Question,
    }));

    res.status(200).json({
      hasResponded: true,
      message: "Form responses fetched successfully",
      responseCount: responseData.length,
      responses: responseData,
      submittedAt: formResponse.createdAt,
    });
  } catch (error) {
    console.error("❌ [GET_FORM_RESPONSES_FOR_USER] Error fetching form responses:", error);
    res.status(500).json({ error: "Failed to fetch form responses" });
  }
};

exports.getFormResponsesByCreatorId = async (req, res) => {
  console.log("👨‍💼 [GET_FORM_RESPONSES_BY_CREATOR] Request received:", { creatorId: req.params.creatorId });
  
  try {
    const creatorId = parseInt(req.params.creatorId);
    const { page, limit, skip } = getPaginationParams(req.query);

    console.log("🔄 [GET_FORM_RESPONSES_BY_CREATOR] Fetching forms for creator:", { creatorId, page, limit });

    const [forms, total] = await Promise.all([
      prisma.form.findMany({
        where: { creatorId },
        include: {
          _count: {
            select: {
              FormResponse: true,
              Question: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.form.count({ where: { creatorId } }),
    ]);

    console.log("📋 [GET_FORM_RESPONSES_BY_CREATOR] Forms found:", forms.length);

    if (forms.length === 0) {
      return res
        .status(200)
        .json({ 
          message: "No forms found for this creator",
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false }
        });
    }

    // Get form responses for all forms
    const formIds = forms.map(form => form.id);
    const formResponses = await prisma.formResponse.findMany({
      where: {
        formId: { in: formIds },
      },
      include: {
        unifiedUser: {
          select: {
            user: { select: { name: true } },
            partner: { select: { name: true } },
            admin: { select: { name: true } },
            expert: { select: { name: true } },
          },
        },
        Response: {
          include: {
            Question: {
              select: {
                id: true,
                question: true,
              },
            },
          },
        },
      },
    });

    console.log("📊 [GET_FORM_RESPONSES_BY_CREATOR] Responses found:", formResponses.length);

    // Group responses by form
    const groupedResponses = {};
    formResponses.forEach((response) => {
      const form = forms.find((f) => f.id === response.formId);
      if (!groupedResponses[response.formId]) {
        groupedResponses[response.formId] = {
          formId: response.formId,
          formName: form?.formName || "Unknown Form",
          responses: [],
        };
      }

      groupedResponses[response.formId].responses.push({
        userId: response.userId,
        userName: response.unifiedUser?.user?.name || 
                 response.unifiedUser?.partner?.name || 
                 response.unifiedUser?.admin?.name || 
                 response.unifiedUser?.expert?.name || 
                 "Unknown User",
        answers: response.Response.map((answer) => ({
          questionId: answer.Question.id,
          question: answer.Question.question,
          answer: answer.answer,
        })),
        submittedAt: response.createdAt,
      });
    });

    // Ensure forms with no responses are still returned
    forms.forEach((form) => {
      if (!groupedResponses[form.id]) {
        groupedResponses[form.id] = {
          formId: form.id,
          formName: form.formName,
          responses: [],
        };
      }
    });

    const responseData = Object.values(groupedResponses);
    console.log("✅ [GET_FORM_RESPONSES_BY_CREATOR] Successfully grouped responses");
    
    const response = formatPaginatedResponse(responseData, page, limit, total);
    return res.status(200).json(response);
  } catch (error) {
    console.error("❌ [GET_FORM_RESPONSES_BY_CREATOR] Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getQuestionsByCreatorId = async (req, res) => {
  console.log("❓ [GET_QUESTIONS_BY_CREATOR] Request received:", { creatorId: req.params.creatorId });
  
  try {
    const creatorId = parseInt(req.params.creatorId);
    const { page, limit, skip } = getPaginationParams(req.query);

    console.log("🔄 [GET_QUESTIONS_BY_CREATOR] Fetching forms for creator:", { creatorId, page, limit });

    const [forms, total] = await Promise.all([
      prisma.form.findMany({
        where: { creatorId },
        include: {
          Question: {
            select: {
              id: true,
              question: true,
              answerType: true,
              description: true,
              isRequired: true,
              options: true,
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: {
              Question: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.form.count({ where: { creatorId } }),
    ]);

    console.log("📋 [GET_QUESTIONS_BY_CREATOR] Forms found:", forms.length);

    if (forms.length === 0) {
      return res
        .status(404)
        .json({ 
          message: "No forms found for this creator",
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false }
        });
    }

    const formattedForms = forms.map((form) => ({
      formId: form.id,
      formName: form.formName,
      questions: form.Question,
      questionCount: form._count.Question,
    }));

    console.log("✅ [GET_QUESTIONS_BY_CREATOR] Successfully formatted forms");
    
    const response = formatPaginatedResponse(formattedForms, page, limit, total);
    return res.status(200).json(response);
  } catch (error) {
    console.error("❌ [GET_QUESTIONS_BY_CREATOR] Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getFormResponsesById = async (req, res) => {
  console.log("📊 [GET_FORM_RESPONSES_BY_ID] Request received:", { formId: req.params.formId });
  
  const parsedFormId = parseInt(req.params.formId);
  if (isNaN(parsedFormId)) {
    console.log("❌ [GET_FORM_RESPONSES_BY_ID] Invalid formId:", req.params.formId);
    return res.status(400).json({ error: "Invalid form ID" });
  }

  const { page, limit, skip } = getPaginationParams(req.query);

  try {
    console.log("🔄 [GET_FORM_RESPONSES_BY_ID] Fetching form and responses:", { formId: parsedFormId, page, limit });

    // Fetch form and all questions
    const form = await prisma.form.findUnique({
      where: { id: parsedFormId },
      include: { 
        Question: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!form) {
      console.log("❌ [GET_FORM_RESPONSES_BY_ID] Form not found:", { formId });
      return res.status(404).json({ message: "Form not found" });
    }

    console.log("📋 [GET_FORM_RESPONSES_BY_ID] Form found:", { formName: form.formName });

    // Fetch all responses for this form with pagination
    const [formResponses, total] = await Promise.all([
      prisma.formResponse.findMany({
        where: { formId: parsedFormId },
        include: {
          unifiedUser: {
            select: {
              user: { select: { name: true, email: true } },
              partner: { select: { name: true, email: true } },
              admin: { select: { name: true, email: true } },
              expert: { select: { name: true, email: true } },
            },
          },
          Response: {
            include: {
              Question: {
                select: {
                  id: true,
                  question: true,
                  answerType: true,
                  options: true,
                  description: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.formResponse.count({ where: { formId: parsedFormId } }),
    ]);

    console.log("📊 [GET_FORM_RESPONSES_BY_ID] Responses found:", formResponses.length);

    // Format responses for frontend
    const responseData = formResponses.map((response) => ({
      userName: response.unifiedUser?.user?.name || 
               response.unifiedUser?.partner?.name || 
               response.unifiedUser?.admin?.name || 
               response.unifiedUser?.expert?.name || 
               "Unknown User",
      userEmail: response.unifiedUser?.user?.email || 
                response.unifiedUser?.partner?.email || 
                response.unifiedUser?.admin?.email || 
                response.unifiedUser?.expert?.email || 
                "No email",
      answers: Array.isArray(response.Response)
        ? response.Response.map((answer) => ({
            questionId: answer.Question?.id || null,
            question: answer.Question?.question || "Unknown Question",
            answer: answer.answer || "No Answer",
            answerType: answer.Question?.answerType || "text",
            options: answer.Question?.options || [],
          }))
        : [],
      submittedAt: response.createdAt,
    }));

    console.log("✅ [GET_FORM_RESPONSES_BY_ID] Successfully formatted responses");
    
    const response = formatPaginatedResponse(responseData, page, limit, total);
    return res.status(200).json({
      formId: parsedFormId,
      formName: form.formName,
      Question: form.Question,
      ...response,
    });
  } catch (error) {
    console.error("❌ [GET_FORM_RESPONSES_BY_ID] Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ========================================
// GOOGLE INTEGRATION CONTROLLERS
// ========================================

exports.fetchFormResponses = async (req, res) => {
  console.log("📊 [FETCH_FORM_RESPONSES] Request received:", { query: req.query });
  
  try {
    const auth = await authorize();
    const forms = google.forms({ version: "v1", auth });
    const formId = req.query.formId;

    console.log("🔄 [FETCH_FORM_RESPONSES] Fetching responses for formId:", formId);
    
    const response = await forms.forms.responses.list({ formId });
    console.log("✅ [FETCH_FORM_RESPONSES] Successfully fetched responses");
    res.status(200).json(response.data);
  } catch (error) {
    console.error("❌ [FETCH_FORM_RESPONSES] Error fetching form responses:", error);
    res.status(500).json({ error: "Failed to fetch form responses" });
  }
};

exports.fetchSheetData = async (req, res) => {
  console.log("📈 [FETCH_SHEET_DATA] Request received:", { query: req.query });
  
  try {
    const auth = await authorize();
    const sheets = google.sheets({ version: "v4", auth });

    const { spreadsheetId, range } = req.query;

    if (!spreadsheetId || !range) {
      console.log("❌ [FETCH_SHEET_DATA] Missing required parameters");
      throw new Error("Missing required parameters: spreadsheetId, range");
    }

    console.log("🔄 [FETCH_SHEET_DATA] Fetching data:", { spreadsheetId, range });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    console.log("✅ [FETCH_SHEET_DATA] Successfully fetched sheet data");
    res.status(200).json(response.data);
  } catch (error) {
    console.error("❌ [FETCH_SHEET_DATA] Error fetching sheet data:", error);
    res.status(500).json({ error: "Failed to fetch sheet data" });
  }
};

exports.authorizeApp = (req, res) => {
  console.log("🔐 [AUTHORIZE_APP] Request received");
  
  const { client_secret, client_id, redirect_uris } = creds.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0],
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("✅ [AUTHORIZE_APP] Redirecting to auth URL");
  res.redirect(authUrl);
};

exports.oauth2Callback = async (req, res) => {
  console.log("🔄 [OAUTH2_CALLBACK] Request received:", { query: req.query });
  
  const { code } = req.query;
  const { client_secret, client_id, redirect_uris } = creds.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0],
  );

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log("✅ [OAUTH2_CALLBACK] Authorization successful");
    res.send("Authorization successful! You can close this window.");
  } catch (error) {
    console.error("❌ [OAUTH2_CALLBACK] Error retrieving access token", error);
    res.status(500).send("Error retrieving access token");
  }
};
