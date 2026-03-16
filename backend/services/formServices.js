const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createNewForm = async (formName, creatorId, questions = [], isGlobal = false, communityIds = []) => {
  try {
    // console.log('Creating form with:', { formName, creatorId, questions, isGlobal, communityIds });

    const userExists = await prisma.unifiedUser.findUnique({
      where: { id: creatorId },
    });

    if (!userExists) {
      throw new Error(`User with id ${creatorId} does not exist.`);
    }

    const form = await prisma.form.create({
      data: {
        formName,
        creatorId,
        isGlobal,
        Question: {
          create: questions.map((q) => ({
            question: q.question,
            options: q.answerType.options || [],
            answerType: q.answerType.type || "",
            description: q.description || "",
            isRequired: q.isRequired ?? false,
          })),
        },
        FormCommunity: {
          create: Array.isArray(communityIds)
            ? communityIds.map((communityId) => ({
                communityId,
              }))
            : [],
        },
      },
      include: {
        Question: true,
        FormCommunity: true,
      },
    });

    console.log('Form created successfully:', form);
    return form;
  } catch (error) {
    console.error('Error saving form:', error);
    throw new Error('Error saving form');
  }
};

module.exports = createNewForm;
