const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getUserCommunitiesHelper } = require("../community/community");
const { getVideosByTagHelper } = require("./video");

// upload video and create video are different
// upload=upload to youtube
// create=make an instance in the database
exports.createVideo = async function (req, res, next) {
  try {
    const { sessionId, ...data } = req.body;
    let video;
    if (!sessionId) {
      video = await prisma.video.create({ data });
    } else {
      video = await prisma.video.create({
        data: {
          ...data,
        },
      });
    }

    return res.status(201).json({ status: 201, video });
  } catch (err) {
    console.log("Error Creating video");
    console.log(err);
    next(err);
  }
};

exports.getOneVideo = async function (req, res, next) {
  const { id } = req.params;
  try {
    const video = await prisma.video.findUnique({
      where: { id: parseInt(id) },
    });
    return res.status(200).json({ status: 200, video });
  } catch (err) {
    console.log(`Error fetching video of id:${id}`);
    console.log(err);
    next(err);
  }
};

// Gets all videos or nothing
exports.getVideos = async function (req, res, next) {
  const { filter } = req.query;
  try {
    let videos;
    if (filter) {
      videos = await getVideosByTagHelper(filter);
    } else {
      videos = await prisma.video.findMany();
    }
    return res.status(200).json({ videos });
  } catch (err) {
    console.log(`Error while fetching videos for ${filter}`);
    console.log(err);
    next(err);
  }
};

// get community Videos
exports.getCommunityVideos = async function (req, res, next) {
  const { communityId } = req.params;
  try {
    let videos = await prisma.video.findMany({
      where: { communityId: parseInt(communityId) },
    });
    return videos;
  } catch (err) {
    console.log(`Error while fetching videos for community:${communityId}`);
    console.log(err);
    next(err);
  }
};

exports.getUserVideos = async function (req, res, next) {
  const { userId } = req.params;
  try {
    let communities = await getUserCommunitiesHelper(parseInt(userId));
    let nestedVideos = await resolveCommunityVideos(communities); // [video[]]
    // flatten videos+filter
    let videos = {}; // id:{...video,community}
    nestedVideos.forEach((communityVideos) => {
      communityVideos.forEach((video) => {
        if (videos[video.id]) {
          videos[video.id].community.push(video.community[0]);
        } else {
          videos[video.id] = video;
        }
      });
    });

    return res.status(200).json({ status: 200, videos: Object.values(videos) });
  } catch (err) {
    console.log(`Error while fetching videos for user:${userId}`);
    console.log(err);
    next(err);
  }
};

// dev
exports.updateVideo = async function (req, res, next) {
  const { id } = req.params;
  try {
    const video = await prisma.video.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    return res.status(201).json({ status: 201, video });
  } catch (err) {
    console.log("Error while updating the video id:" + id);
    console.log(err);
    next(err);
  }
};

// dev
exports.deleteVideo = async function (req, res, next) {
  const { id } = req.params;
  try {
    const video = await prisma.video.delete({ where: { id: parseInt(id) } });
    return res.status(202).json({ status: 202, video });
  } catch (err) {
    console.log("Error while deleting the video id:" + id);
    console.log(err);
    next(err);
  }
};
