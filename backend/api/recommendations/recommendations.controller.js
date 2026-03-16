const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createRecommendation = async function (req, res, next) {
  try {
    if (!req.body.expertId) {
      return res
        .status(400)
        .json({ status: 400, message: "Expert ID is compulsory!!" });
    }
    const savedRecommendation = await prisma.SpeakerRecommendation.create({
      data: req.body,
    });
    return res.status(201).json({ status: 201, savedRecommendation });
  } catch (err) {
    next(err);
    console.log("Error while creating recommendation", err);
  }
};

exports.getAllRecommendations = async function (req, res, next) {
  try {
    const recommendations = await prisma.SpeakerRecommendation.findMany({
      include: {
        speakerDetails: true,
      },
    });
    return res.status(200).json({ status: 201, recommendations });
  } catch (err) {
    next(err);
    console.log("Error while fetching recommendation", err);
  }
};

exports.getAllRecommendationsByExpert = async function (req, res, next) {
  const expertId = parseInt(req.params.id);

  try {
    const recommendationsBySpeaker =
      await prisma.speakerRecommendation.findMany({
        where: {
          expertId: expertId,
        },
        include: {
          speakerDetails: true,
        },
      });
    return res.status(200).json({ status: 201, recommendationsBySpeaker });
  } catch (err) {
    next(err);
    console.log("Error while fetching recommendation by expert", err);
  }
};
