const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs'); 
const mailer = require("../../services/email/notificationMailer");
const { RewardType, RewardAction } = require('@prisma/client');
const { rewardsManagement } = require('../../services/rewards/rewards.service');

exports.createCompetition = async (req, res) => {
  try {
    const { title, description, startDate, endDate, creatorId, stages, bannerUrl } = req.body;

    const competitionData = {
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      applicationEndsOn: new Date(endDate),
      creatorId,
      bannerUrl,
      Stage: {
        create: await Promise.all(stages.map(async (stage) => {
          let evaluatorId = null;

          if (stage.email) {
            const user = await prisma.unifiedUser.findUnique({
              where: { email: stage.email }
            });

            if (!user) {
              const hashedPassword = await bcrypt.hash('Abcd@123', 10);
              const expert = await prisma.expert.create({
                data: { 
                  email: stage.email,
                  password: hashedPassword,
                }
              });

              const unifiedUser = await prisma.unifiedUser.create({
                data: {
                  email: stage.email,
                  expertId: expert.id, 
                },
              });

              evaluatorId = unifiedUser.id;
            } else {
              evaluatorId = user.id;
            }

              let email = stage.email;
              let subject = "You have been invited to evaluate a competition";
              let body = `Hi ${stage.email}, we'd like to invite you as an evaluator for a competition, Kindly Login as an expert into Aluminaries Portal. Use your email id for login and password is: Abcd@123`;

              const sendMailStatus = mailer(email, subject, body);
              if (sendMailStatus === "err") {
                return res
                  .status(400)
                  .json({ status: 400, message: "Error sending mail" });
              }
          }


          return {
            stageNumber: stage.stageNumber,
            name: stage.name || '',
            unifiedUser: evaluatorId ? { connect: { id: evaluatorId } } : undefined, 
            Field: {
              create: stage.fields.map(field => ({
                question: field.question,
                type: field.answerOptions?.type || "text",
                options: field.answerOptions?.options || null
              }))
            },
            EvaluatorQuestion: {
              create: stage.evaluatorQuestion?.map(question => ({
                question: question.question,
                answerOptions: question.answerOptions ? JSON.stringify(question.answerOptions) : null,
              })) || []
            }
          };
        }))
      }
    };

    const competition = await prisma.competition.create({
      data: competitionData,
      include: {
        Stage: {
          include: {
            unifiedUser: true, 
            Field: true,
            EvaluatorQuestion: true
          }
        }
      }
    });

    res.status(200).json(competition);
  } catch (error) {
    console.error("Error creating competition:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};



exports.getActiveCompetitions = async (req, res) => {
  try {
    const currentDate = new Date();
    const userId = req.query.userId ? parseInt(req.query.userId) : null;

    const competitions = await prisma.competition.findMany({
      where: {
        endDate: {
          gte: currentDate,
        },
      },
      include: {
        Stage: {
          include: {
            Field: true,
            EvaluatorQuestion: true,
          },
        },
      },
    });

    // If userId is provided, check submission status for each competition
    if (userId) {
      const competitionsWithSubmissionStatus = await Promise.all(
        competitions.map(async (competition) => {
          const hasSubmitted = await prisma.fieldResponse.findFirst({
            where: {
              submittedBy: userId,
              Field: {
                Stage: {
                  competitionId: competition.id
                }
              }
            }
          });

          return {
            ...competition,
            userHasSubmitted: !!hasSubmitted
          };
        })
      );

      return res.status(200).json(competitionsWithSubmissionStatus);
    }

    return res.status(200).json(competitions);
  } catch (error) {
    console.error("Error fetching competitions:", error);
    return res.status(500).json({ error: "Failed to fetch active competitions" });
  }
};

exports.getCompetitionById = async (req, res) => {
  const { id } = req.params;
  const userId = req.query.userId ? parseInt(req.query.userId) : null;

  try {
    const competition = await prisma.competition.findUnique({
      where: { id: parseInt(id) },
      include: {
        Stage: {
          include: {
            Field: {
              include: {
                FieldResponse: {
                  select: {
                    submittedBy: true,
                  },
                },
              },
            },
            EvaluatorQuestion: true,
          },
        },
      },
    });

    if (!competition) {
      return res.status(404).json({ error: "Competition not found" });
    }

    // If userId is provided, check submission status
    if (userId) {
      const hasSubmitted = await prisma.fieldResponse.findFirst({
        where: {
          submittedBy: userId,
          Field: {
            Stage: {
              competitionId: parseInt(id)
            }
          }
        }
      });

      const competitionWithSubmissionStatus = {
        ...competition,
        userHasSubmitted: !!hasSubmitted
      };

      return res.status(200).json(competitionWithSubmissionStatus);
    }

    return res.status(200).json(competition);
  } catch (error) {
    console.error("Error fetching competition:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


exports.getcompetitionsByCreatorId = async (req, res) => {
  const { id } = req.params;
  const currentDate = new Date();

  try {
    const competition = await prisma.competition.findMany({
      where: { 
        creatorId: parseInt(id),
        endDate: {
          gte: currentDate,
        },
       },
      include: {
        Stage: {
          include: {
            Field: true,
            EvaluatorQuestion: true,
          },
        },
      },
    });

    if (!competition) {
      return res.status(404).json({ error: "Competition not found" });
    }

    return res.status(200).json(competition);
  } catch (error) {
    console.error("Error fetching competition:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getPastCompetitionsByCreatorId = async (req, res) => {
  const { id } = req.params;
  const currentDate = new Date();

  console.log('id', id)
  try {
    const competition = await prisma.competition.findMany({
      where: { 
        creatorId: parseInt(id),
        endDate: {
                  lt: currentDate,
                },
       },
      include: {
        Stage: {
          include: {
            Field: true,
            EvaluatorQuestion: true,
          },
        },
      },
    });

    if (!competition) {
      return res.status(404).json({ error: "Competition not found" });
    }

    return res.status(200).json(competition);
  } catch (error) {
    console.error("Error fetching competition:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.submitResponse = async (req, res) => {
  const { updatedAnswers, submittedBy } = req.body;

  try {
    const submittedById = parseInt(submittedBy);
    let errors = [];

    const promises = Object.keys(updatedAnswers).map(async (key) => {
      const fieldId = parseInt(key);
      let answerData = updatedAnswers[key];


      if (answerData === undefined || answerData === null) {
        errors.push(`Missing answer for fieldId ${fieldId}`);
        return null;
      }

      let answerString = "";
      let fileType = null;

      if (typeof answerData === "object" && !Array.isArray(answerData)) {
        answerString = answerData.url || "";
        fileType = answerData.type || null;
      } else if (Array.isArray(answerData)) {
        answerString = JSON.stringify(answerData);
      } else {
        answerString = String(answerData);
      }

      if (!answerString) {
        errors.push(`Invalid answer format for fieldId ${fieldId}`);
        return null;
      }

      const existingResponse = await prisma.fieldResponse.findFirst({
        where: {
          fieldId: fieldId,
          submittedBy: submittedById,
        },
      });

      if (existingResponse) {
        errors.push(`Response already submitted for fieldId ${fieldId}`);
        return null;
      }

      return prisma.fieldResponse.create({
        data: {
          fieldId: fieldId,
          answer: answerString, 
          fileType: fileType, 
          submittedBy: submittedById,
        },
      });
    });

    const responses = await Promise.all(promises);

    if (errors.length > 0) {
      return res.status(400).json({ status: 400, message: errors });
    }

    await rewardsManagement({
      userId: submittedById,
      rewardRuleName: RewardAction.ATTEND_COMPETITION,
      type: RewardType.CREDIT
    });


    return res.status(200).json({
      message: "Application submitted successfully",
      responses: responses.filter(Boolean),
    });

  } catch (error) {
    console.error("Error processing application submission:", error);
    return res.status(500).json({
      message: error.message || "An error occurred while submitting the application",
    });
  }
};




exports.getResponsesForEvaluator = async (req, res) => {
  const evaluatorId = parseInt(req.params.id, 10);

  try {
    const stagesWithFieldsAndResponses = await prisma.stage.findMany({
      where: {
        evaluatorId: evaluatorId,
      },
      include: {
        Competition: {
          select: {
            id: true,
            title: true,
          },
        },
        Field: {
          select: {
            id: true,
            question: true,
            options: true,
            stageId: true,
            FieldResponse: {
              select: {
                id: true,
                answer: true,
                fileType: true,
                submittedBy: true,
                unifiedUser: {
                  select: {
                    id: true,
                    userId: true,
                    user: {
                      select: {
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        EvaluatorQuestion: {
          select: {
            id: true,
            question: true,
            answerOptions: true,
          },
        },
      },
    });

    if (!stagesWithFieldsAndResponses || stagesWithFieldsAndResponses.length === 0) {
      return res.status(200).json({ stages: [], message: "No stages found for this evaluator." });
    }


    const evaluatedResults = await prisma.evaluatorResult.findMany({
      select: {
        stageId: true,
        userId: true,
      },
    });

    const evaluatedPairs = new Set(
      evaluatedResults.map(({ stageId, userId }) => `${userId}-${stageId}`)
    );


    const formattedStages = stagesWithFieldsAndResponses.flatMap(stage => {
      const responsesByUser = {};

      stage.Field.forEach(field => {
        field.FieldResponse.forEach(response => {
          if (!response.submittedBy) return;

          const pairKey = `${response.submittedBy}-${field.stageId}`;
          if (evaluatedPairs.has(pairKey)) {
            console.log(`Skipping evaluated response: ${pairKey}`);
            return;
          }

          if (!responsesByUser[response.submittedBy]) {
            responsesByUser[response.submittedBy] = {
              submittedBy: response.submittedBy,
              user: response.unifiedUser?.user
                ? {
                    userId: response.unifiedUser.userId,
                    name: response.unifiedUser.user.name,
                    email: response.unifiedUser.user.email,
                  }
                : { userId: null, name: "Unknown", email: "Unknown" },
              competitionId: stage.Competition?.id || null,
              competitionTitle: stage.Competition?.title || "Unknown Competition",
              stageId: stage.id,
              stageNumber: stage.stageNumber,
              fields: [],
              EvaluatorQuestion:stage.EvaluatorQuestion,
            };
          }

          responsesByUser[response.submittedBy].fields.push({
            fieldId: field.id,
            question: field.question,
            options: field.options || [],
            response: {
              responseId: response.id,
              answer: response.answer,
              fileType: response.fileType || "N/A",
            },
          });
        });
      });

      return Object.values(responsesByUser);
    });


    return res.status(200).json({
      message: "Filtered responses fetched successfully.",
      stages: formattedStages.length > 0 ? formattedStages : [],
    });

  } catch (error) {
    console.error("Error fetching evaluation data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getNextStageForUser = async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const competitionId = parseInt(req.params.competitionId, 10);

  try {
    const stages = await prisma.stage.findMany({
      where: { competitionId },
      orderBy: { stageNumber: 'asc' },
      include: {
        EvaluatorQuestion: true,
        Field: {
          include: {
            FieldResponse: true, 
          },
        },
      },
    });

    if (!stages.length) {
      return res.status(404).json({ message: "No stages found for this competition." });
    }

    const evaluatorResults = await prisma.evaluatorResult.findMany({
      where: {
        userId,
        stageId: { in: stages.map(stage => stage.id) },
      },
    });

    const isNotQualified = evaluatorResults.some(result => result.status === 'NOT_QUALIFIED');

      if (isNotQualified) {
        return res.status(200).json({
          message: "User is not qualified for further stages.",
          stages: [],
        });
      }

    let lastQualifiedStage = null;

    for (const stage of stages) {
      const result = evaluatorResults.find(r => r.stageId === stage.id);
      if (result && result.status === 'QUALIFIED') {
        lastQualifiedStage = stage;
      } else {
        break;
      }
    }

    let nextStage = null;

    if (!lastQualifiedStage) {
      nextStage = stages[0];
    } else {
      const hasSubmittedResponse = lastQualifiedStage.Field.some(field =>
        field.FieldResponse?.some(response => response.submittedBy === userId)
      );

      if (!hasSubmittedResponse) {
        nextStage = lastQualifiedStage;
      } else {
        const nextStageIndex = stages.findIndex(stage => stage.id === lastQualifiedStage.id) + 1;
        nextStage = stages[nextStageIndex] || null;
      }
    }

    if (!nextStage) {
      return res.status(200).json({
        message: "No stages to display.",
        stages: [],
      });
    }

    return res.status(200).json({
      message: "Next stage fetched successfully.",
      nextStage: {
        stage: nextStage,
        questions: nextStage.EvaluatorQuestion,
        fields: nextStage.Field,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



exports.submitEvaluatorResponse = async (req, res) => {
  try {
    const { evaluatorId, userId, score, feedback, stageId, status, competitionId } = req.body;

    const existingResult = await prisma.evaluatorResult.findFirst({
      where: {
        evaluatorId,
        userId,
        stageId,
        competitionId,
      },
    });

    if (existingResult) {
      return res.status(400).json({ status:400, message: "Evaluation result already submitted." });
    }

    const result = await prisma.evaluatorResult.create({
      data: {
        evaluatorId,
        userId,
        score: parseInt(score),
        feedback,
        stageId,
        status,
        competitionId
      },
    });

    res.status(200).json({
      message: "Evaluation result submitted successfully.",
      result,
    });

  } catch (error) {
    console.error("Error submitting evaluator response:", error);
    res.status(500).json({ status:500, error: "Error creating evaluator result", details: error.message });
  }
};

exports.getUserSubmissions = async (req, res) => {
  const { userId } = req.params;

  try {
    const fieldResponses = await prisma.fieldResponse.findMany({
      where: { submittedBy: parseInt(userId) },
      include: {
        Field: {
          include: {
            Stage: {
              include: {
                Competition: true,
              },
            },
          },
        },
      },
    });

    if (!fieldResponses.length) {
      return res.status(200).json([]);
    }

    const stageIds = [...new Set(fieldResponses.map(fr => fr.Field.Stage.id))];
    const competitionIds = [...new Set(fieldResponses.map(fr => fr.Field.Stage.competitionId))];

    const evaluatorResults = await prisma.evaluatorResult.findMany({
      where: {
        userId: parseInt(userId),
        stageId: { in: stageIds },
        competitionId: { in: competitionIds },
      },
      include: {
        Stage: true,
        Competition: true,
      },
    });

    const stageMap = {};

    await Promise.all(
      fieldResponses.map(async (fr) => {
        const stage = fr.Field.Stage;
        const competition = stage.Competition;
        const stageId = stage.id;
        const competitionId = competition?.id || null;
        const competitionName = competition?.title || null;

        if (!stageMap[stageId]) {
          stageMap[stageId] = {
            competitionId,
            competitionName,
            stageId,
            stageName: stage.name,
            stageNumber: stage.stageNumber,
            evaluatorResult: null,
            nextStage: null,
            nextStageNumber: null,
            fieldResponses: [],
          };
        }

        stageMap[stageId].fieldResponses.push({
          id: fr.id,
          fieldId: fr.fieldId,
          question: fr.Field.question,
          answer: fr.answer,
          fileType: fr.fileType,
          createdAt: fr.createdAt,
        });

        const evaluatorResult = evaluatorResults.find(er => er.stageId === stageId);
        if (evaluatorResult) {
          stageMap[stageId].evaluatorResult = {
            id: evaluatorResult.id,
            score: evaluatorResult.score,
            feedback: evaluatorResult.feedback,
            status: evaluatorResult.status,
          };

          if (evaluatorResult.status === "QUALIFIED") {
            const nextStage = await prisma.stage.findFirst({
              where: {
                competitionId: competitionId,
                stageNumber: stage.stageNumber + 1,
              },
            });

            if (nextStage) {
              stageMap[stageId].nextStage = nextStage.name;
              stageMap[stageId].nextStageNumber = nextStage.stageNumber;
            }
          }
        }
      })
    );

    return res.status(200).json(Object.values(stageMap));
  } catch (error) {
    console.error("Error fetching user submissions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


exports.getSubmissionsForCreator = async (req, res) => {
  try {
    const competitionId = parseInt(req.params.competitionId);

    if (isNaN(competitionId)) {
      return res.status(400).json({ error: "Invalid competition ID" });
    }

    const stages = await prisma.stage.findMany({
      where: { competitionId },
    });

    if (stages.length === 0) {
      return res.status(404).json({ error: "No stages found for this competition" });
    }

    const stageIds = stages.map((stage) => stage.id);

    const fieldResponses = await prisma.fieldResponse.findMany({
      where: {
        Field: { stageId: { in: stageIds } },
      },
      select: {
        submittedBy: true,
        Field: { select: { stageId: true } },
        unifiedUser: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const evaluationResults = await prisma.evaluatorResult.findMany({
      where: {
        competitionId,
        stageId: { in: stageIds },
      },
      select: {
        userId: true,
        evaluatorId:true,
        stageId: true,
        score: true,
        feedback: true,
        status: true,
        Stage: true,
        unifiedUser_EvaluatorResult_userIdTounifiedUser: {
          select: {
            userId: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        unifiedUser_EvaluatorResult_evaluatorIdTounifiedUser: { 
          select: {
            id: true,  
            expert: {  
              select: {
                email: true, 
              },
            },
          },
        },
      },
    });

    const userStageMap = new Map();

    fieldResponses.forEach(({ submittedBy, Field, unifiedUser }) => {
      if (submittedBy) {
        const stageDetails = stages.find((stage) => stage.id === Field.stageId);
        const key = `${submittedBy}-${Field.stageId}`;

        if (!userStageMap.has(key)) {
          userStageMap.set(key, {
            userId: submittedBy,
            stage: stageDetails,
            name: unifiedUser?.user?.name || null,
            email: unifiedUser?.user?.email || null,
            evaluations: [],
          });
        }
      }
    });

    evaluationResults.forEach(({ userId, stageId, score, feedback, status, Stage, unifiedUser_EvaluatorResult_userIdTounifiedUser, unifiedUser_EvaluatorResult_evaluatorIdTounifiedUser }) => {
      const key = `${userId}-${stageId}`;

      const userDetails = unifiedUser_EvaluatorResult_userIdTounifiedUser?.user || {};
      const userIdFromUnifiedUser = unifiedUser_EvaluatorResult_userIdTounifiedUser?.userId || userId;

      if (!userStageMap.has(key)) {
        userStageMap.set(key, {
          userId: userIdFromUnifiedUser,
          stage: Stage,
          name: userDetails.name || null,
          email: userDetails.email || null,
          evaluations: [],
        });
      } else {
        const entry = userStageMap.get(key);
        entry.name = entry.name || userDetails.name || null;
        entry.email = entry.email || userDetails.email || null;
      }
      const evaluatorEmail = unifiedUser_EvaluatorResult_evaluatorIdTounifiedUser?.expert?.email || "No Evaluator Email";

      userStageMap.get(key).evaluations.push({ score, feedback, status, evaluatorEmail });
    });

    const result = Array.from(userStageMap.values());

    res.json(result);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.checkUserSubmission = async (req, res) => {
  try {
    const { competitionId, userId } = req.params;

    if (!competitionId || !userId) {
      return res.status(400).json({ 
        error: "Both competitionId and userId are required" 
      });
    }

    const hasSubmitted = await prisma.fieldResponse.findFirst({
      where: {
        submittedBy: parseInt(userId),
        Field: {
          Stage: {
            competitionId: parseInt(competitionId)
          }
        }
      },
      include: {
        Field: {
          include: {
            Stage: {
              select: {
                id: true,
                stageNumber: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (hasSubmitted) {
      return res.status(200).json({
        hasSubmitted: true,
        submissionDetails: {
          stageId: hasSubmitted.Field.Stage.id,
          stageNumber: hasSubmitted.Field.Stage.stageNumber,
          stageName: hasSubmitted.Field.Stage.name,
          submittedAt: hasSubmitted.createdAt
        }
      });
    }

    return res.status(200).json({
      hasSubmitted: false,
      submissionDetails: null
    });

  } catch (error) {
    console.error('Error checking user submission:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getUserSubmissionStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ 
        error: "userId is required" 
      });
    }

    const submissions = await prisma.fieldResponse.findMany({
      where: {
        submittedBy: parseInt(userId)
      },
      include: {
        Field: {
          include: {
            Stage: {
              include: {
                Competition: {
                  select: {
                    id: true,
                    title: true,
                    endDate: true
                  }
                }
              }
            }
          }
        }
      },
      distinct: ['fieldId']
    });

    const submissionStatus = submissions.map(submission => ({
      competitionId: submission.Field.Stage.Competition.id,
      competitionTitle: submission.Field.Stage.Competition.title,
      stageId: submission.Field.Stage.id,
      stageNumber: submission.Field.Stage.stageNumber,
      stageName: submission.Field.Stage.name,
      submittedAt: submission.createdAt,
      competitionEndDate: submission.Field.Stage.Competition.endDate
    }));

    return res.status(200).json({
      userId: parseInt(userId),
      totalSubmissions: submissionStatus.length,
      submissions: submissionStatus
    });

  } catch (error) {
    console.error('Error fetching user submission status:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deleteCompetition = async (req, res) => {
  try {
    const { id } = req.params;

    const competition = await prisma.competition.findUnique({
      where: { id: parseInt(id) },
    });

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    await prisma.competition.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({ message: 'Competition deleted successfully' });
  } catch (error) {
    console.error('Error deleting competition:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};




















