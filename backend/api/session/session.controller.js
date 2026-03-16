const { PrismaClient } = require("@prisma/client");
const {
  findSessionByIdHelper,
  findSessionSlotByIdHelper,
  exclude,
} = require("../services/getById");
const {
  getSessionByTagHelper,
  updateSessionSlotHelper,
  getSessionStdFormat,
  updateSessionSlotHelper2,
  deleteSlotsHelper,
  getNumActiveSessions,
  getSlotExpertHelper,
  createSessionTiersHelper,
} = require("./session");
const prisma = new PrismaClient();

const { generateRoomId } = require("../../utils/generateRoomId.js");
const axios = require("axios");
var jwt = require("jsonwebtoken");
var uuid4 = require("uuid4");
const mailer = require("../../services/email/notificationMailer");

// Helper function to create 100ms room
async function create100msRoom(roomName, roomDescription) {
  try {
    const app_access_key = process.env.MS_APP_ACCESS_KEY;
    const app_secret_key = process.env.MS_APP_SECRET_KEY;

    if (!app_access_key || !app_secret_key) {
      throw new Error("100ms credentials not configured");
    }

    // Generate management token
    const payload = {
      access_key: app_access_key,
      type: "management",
      version: 2,
      iat: Math.floor(Date.now() / 1000) - 60,
      nbf: Math.floor(Date.now() / 1000) - 60,
    };

    const token = jwt.sign(payload, app_secret_key, {
      algorithm: "HS256",
      expiresIn: "24h",
      jwtid: uuid4(),
    });

    // Create room via 100ms API
    const response = await axios.post('https://api.100ms.live/v2/rooms', {
      name: roomName,
      description: roomDescription
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.id;
  } catch (error) {
    console.error("Error creating 100ms room:", error);
    throw new Error(`Failed to create 100ms room: ${error.message}`);
  }
}

let countNumActiveSessions = 0;
// Helper to get speaker name from unifiedUser
function getSpeakerName(speaker) {
  if (speaker.user) return speaker.user.name;
  if (speaker.admin) return speaker.admin.name;
  if (speaker.expert) return speaker.expert.name;
  if (speaker.partner) return speaker.partner.name;
  return null;
}

// Helper to get speaker info (name, photoURL, email) from unifiedUser
function getSpeakerInfo(speaker) {
  // Handle nested structure (user/admin/expert/partner)
  if (speaker.user) {
    return {
      name: speaker.user.name,
      photoURL: speaker.user.photoURL || null,
      email: speaker.user.email || null,
      type: 'user',
      id: speaker.user.id || null
    };
  }
  if (speaker.admin) {
    return {
      name: speaker.admin.name,
      photoURL: speaker.admin.photoURL || null,
      email: speaker.admin.email || null,
      type: 'admin',
      id: speaker.admin.id || null
    };
  }
  if (speaker.expert) {
    return {
      name: speaker.expert.name,
      photoURL: speaker.expert.photoURL || null,
      email: speaker.expert.email || null,
      type: 'expert',
      id: speaker.expert.id || null
    };
  }
  if (speaker.partner) {
    return {
      name: speaker.partner.name,
      photoURL: speaker.partner.photoURL || null,
      email: speaker.partner.email || null,
      type: 'partner',
      id: speaker.partner.id || null
    };
  }
  // Handle flat structure (direct fields)
  if (speaker && (speaker.name || speaker.email || speaker.photoURL)) {
    return {
      name: speaker.name || null,
      photoURL: speaker.photoURL || null,
      email: speaker.email || null,
      type: speaker.type || null,
      id: speaker.id || null
    };
  }
  // Try to infer name from possible fields
  if (speaker && speaker.id) {
    return {
      name: speaker.name || null,
      photoURL: speaker.photoURL || null,
      email: speaker.email || null,
      type: speaker.type || null,
      id: speaker.id
    };
  }
  return { name: null, photoURL: null, email: null, type: null, id: null };
}

exports.getAllSessions = async function (req, res, next) {
  try {
    // --------------------DISABLE SERVER SIDE PAGINATION
    let { skip, take } = req.query;
    let sessions;
    if (skip) {
      sessions = await prisma.session.findMany({
        where: { isActive: true },
        include: {
          CouponCode: true,
          tags: true,
          SessionSlot: {
            include: {
              speakers: {
                include: {
                  user: { select: { name: true, photoURL: true, email: true, id: true } },
                  admin: { select: { name: true, photoURL: true, email: true, id: true } },
                  expert: { select: { name: true, photoURL: true, email: true, id: true } },
                  partner: { select: { name: true, photoURL: true, email: true, id: true } }
                }
              },
              requests: false,
            },
            orderBy: { startTime: "asc" },
          },
        },
      });
    } else {
      sessions = await prisma.session.findMany({
        where: { isActive: true },
        include: {
          CouponCode: true,
          tags: {
            include: { tag: true },
          },
          SessionSlot: {
            include: {
              speakers: {
                include: {
                  user: { select: { name: true, photoURL: true, email: true, id: true } },
                  admin: { select: { name: true, photoURL: true, email: true, id: true } },
                  expert: { select: { name: true, photoURL: true, email: true, id: true } },
                  partner: { select: { name: true, photoURL: true, email: true, id: true } }
                }
              }
            },
            orderBy: { startTime: "asc" },
          },
        },
      });
    }
    // console.log(await prisma.session.findMany());

    const forCompletedSessions = await prisma.session.findMany({
      where: { isActive: true },
      include: {
        SessionSlot: {
          include: { speakers: true },
          orderBy: { startTime: "asc" },
        },
      },
    });
    if (!countNumActiveSessions) {
      countNumActiveSessions = await getNumActiveSessions();
    }
    let { recentSessions } = getSessionStdFormat(sessions);
    // Add speakerName to each speaker
    recentSessions.forEach(sess => {
      sess.SessionSlot?.forEach(slot => {
        // Ensure slot.speakers is always an array
        let speakersArr = [];
        if (Array.isArray(slot.speakers)) {
          speakersArr = slot.speakers;
        } else if (slot.speakers) {
          speakersArr = [slot.speakers];
        }
        slot.speakers = speakersArr.map(speaker => getSpeakerInfo(speaker));
      });
    });
    let { completedSessions } = getSessionStdFormat(forCompletedSessions);
    // Normalize speakers in completedSessions as well
    completedSessions.forEach(sess => {
      sess.SessionSlot?.forEach(slot => {
        let speakersArr = [];
        if (Array.isArray(slot.speakers)) {
          speakersArr = slot.speakers;
        } else if (slot.speakers) {
          speakersArr = [slot.speakers];
        }
        slot.speakers = speakersArr.filter(Boolean).map(speaker => getSpeakerInfo(speaker));
      });
    });

    return res.status(200).json({
      sessions: Array.isArray(recentSessions)
        ? recentSessions.map((item) => {
            const { speakerRequests, ...otherInfo } = item;
            return otherInfo;
          })
        : [],
      completedSessions: Array.isArray(completedSessions)
        ? completedSessions.map((item) => {
            const { speakerRequests, ...otherInfo } = item;
            return otherInfo;
          })
        : [],
      total: countNumActiveSessions,
    });
  } catch (err) {
    console.log("Error while getting all sessions");
    console.log(err);
    next(err);
  }
};

// NEEDS EFFORT
exports.getTopRatedSessions = async function (req, res, next) {
  try {
    const sessions = await prisma.session.findMany({
      include: { SessionSlot: { include: { speakers: true } } },
    });
    if (!countNumActiveSessions) {
      countNumActiveSessions = await getNumActiveSessions();
    }
    let { recentSessions, completedSessions } = getSessionStdFormat(sessions);
    // Add speakerName to each speaker
    recentSessions.forEach(sess => {
      sess.SessionSlot?.forEach(slot => {
        // Ensure slot.speakers is always an array
        let speakersArr = [];
        if (Array.isArray(slot.speakers)) {
          speakersArr = slot.speakers;
        } else if (slot.speakers) {
          speakersArr = [slot.speakers];
        }
        slot.speakers = speakersArr.map(speaker => ({
          ...speaker,
          speakerName: getSpeakerName(speaker)
        }));
      });
    });
    return res
      .status(200)
      .json({ sessions: recentSessions, total: countNumActiveSessions });
  } catch (err) {
    console.log("Error while getting all sessions");
    console.log(err);
    next(err);
  }
};

exports.applyAsSpeaker = async function (req, res, next) {
  const { sessionId } = req.params;
  const { expertDetails } = req.body;

  try {
    const session = await findSessionByIdHelper(parseInt(sessionId));
    const isAlreadyThere = session.speakerRequests
      .map((item) => {
        return item.id;
      })
      .includes(expertDetails.id);

    if (isAlreadyThere) {
      return res
        .status(400)
        .send({ status: 400, message: "You already have an open request" });
    }
    session.speakerRequests.push(expertDetails);
    await prisma.session.update({
      where: { id: parseInt(sessionId) },
      data: {
        speakerRequests: session.speakerRequests,
      },
    });

    return res
      .status(200)
      .send({ status: 200, message: "Successfully Updated" });
  } catch (err) {
    console.log("Error while creating requests");
    console.log(err);
    next(err);
  }
};

exports.getSpeakerApplications = async function (req, res, next) {
  const { sessionId } = req.params;
  try {
    const session = await findSessionByIdHelper(parseInt(sessionId));
    res.status(200).json({ status: 200, session });
  } catch (err) {
    console.log("Error while creating requests");
    console.log(err);
    next(err);
  }
};

exports.getRecentlyUploadedSessions = async function (req, res, next) {
  try {
    const sessions = await prisma.session.findMany({
      include: { SessionSlot: { include: { speakers: true } } },
      orderBy: { createdAt: "desc" },
    });
    let { recentSessions, completedSessions } = getSessionStdFormat(
      sessions.slice(0, 4)
    );
    // Add speakerName to each speaker
    recentSessions.forEach(sess => {
      sess.SessionSlot?.forEach(slot => {
        // Ensure slot.speakers is always an array
        let speakersArr = [];
        if (Array.isArray(slot.speakers)) {
          speakersArr = slot.speakers;
        } else if (slot.speakers) {
          speakersArr = [slot.speakers];
        }
        slot.speakers = speakersArr.map(speaker => getSpeakerInfo(speaker));
      });
    });
    return res.status(200).json({ sessions: recentSessions });
  } catch (err) {
    console.log("Error while getting all sessions");
    console.log(err);
    next(err);
  }
};

exports.insertSession = async function (req, res, next) {
  const {
    session: { slots, tagsData, infoImgs, ...sessionData },
    resources,
  } = req.body;
  try {
    const getSlotExpert = await getSlotExpertHelper(
      slots.filter((item) => item.isOnline && !item.location)
    );

    let other_linked_slots = slots
      // .filter((item) => item.isOnline && item.location)
      .map((item, index) => {
        return {
          ...item,
          startTime: item.startTime,
          endTime: item.endTime,
          location: item?.location || "",
          expert_link: item.location,
        };
      });
    // let other_slots = slots.filter((item) => !item.isOnline);

    // Ensure infoImgs is always an array of strings (no nulls)
    let safeInfoImgs = Array.isArray(infoImgs) ? infoImgs.filter(img => !!img) : [];

    const createdSession = await prisma.session.create({
      data: {
        ...sessionData,
        ...(safeInfoImgs.length > 0 ? { infoImgs: safeInfoImgs } : { infoImgs: [] }),
        SessionSlot: {
          create: [...other_linked_slots],
        },
      },
    });

    resources.map(async (item) => {
      const resource = await prisma.resource.create({
        data: {
          name: item.name,
          link: item.link,
          isPreSession:item.isPreSession,
          isPostSession:item.isPostSession,
          author: { connect: { id: item.authorId } },
          session: { connect: [{ id: createdSession.id }] },
        },
      });
    });
    const promises = [];

    for (item of tagsData) {
      const existingTag = await prisma.tag.findMany({
        where: {
          name: item.name,
        },
      });

      if (existingTag.length > 0) {
        let tag = existingTag[0];
        promises.push(
          prisma.sessionTags.create({
            data: {
              tag: {
                connect: {
                  id: tag.id,
                },
              },
              session: {
                connect: {
                  id: createdSession.id,
                },
              },
            },
          })
        );
      } else {
        promises.push(
          prisma.sessionTags.create({
            data: {
              tag: {
                create: {
                  name: item.name,
                },
              },
              session: {
                connect: {
                  id: createdSession.id,
                },
              },
            },
          })
        );
      }
    }

    await prisma.$transaction([...promises]);

    const session = await findSessionByIdHelper(createdSession.id);
    if (createdSession.isExclusive) {
      // create session tier for each slot
      await createSessionTiersHelper(
        sessionData.communityId,
        session.SessionSlot
      );
    }

    let slotList = req.body.session.slots;

    for (const slot of slotList) {
      if (
        typeof slot.speakerId !== "undefined" &&
        slot.speakerId !== null
      ) {
        let expertData = await prisma.expert.findUnique({
          where: {
            id: slot.speakerId,
          },
        });
        if (!expertData) {
          console.warn(`No expert found for speakerId: ${slot.speakerId}`);
          continue; // skip this slot
        }
        let email = expertData.email;
        let subject = "You have been invited to speak at a session";
        let body = `Hi ${expertData.name}, we'd like to invite you as a speaker for our upcoming session, ${req.body.session.title}. We look forward to your participation.`;

        const sendMailStatus = mailer(email, subject, body);
        if (sendMailStatus === "err") {
          return res
            .status(400)
            .json({ status: 400, message: "Error sending mail" });
        }
      }
    }

    return res.status(200).json({ session });
  } catch (error) {
    if (error.code === 'P2002' && error.meta && error.meta.target && error.meta.target.includes('roomId')) {
      return res.status(400).json({
        status: 400,
        message: 'A session with this roomId already exists. Please use a unique roomId.'
      });
    }
    console.log("Error while creating session");
    console.log(error);
    next(error);
  }
};

exports.getSessionById = async function (req, res, next) {
  const { id } = req.params;
  try {
    const { speakerRequests, ...session } = await findSessionByIdHelper(id);
    // Normalize speakers in SessionSlot
    session.SessionSlot?.forEach(slot => {
      let speakersArr = [];
      if (Array.isArray(slot.speakers)) {
        speakersArr = slot.speakers;
      } else if (slot.speakers) {
        speakersArr = [slot.speakers];
      }
      slot.speakers = speakersArr.filter(Boolean).map(speaker => getSpeakerInfo(speaker));
      if (!slot.speakers || !Array.isArray(slot.speakers)) {
        slot.speakers = [];
      }
    });
    return res.status(200).json({ session });
  } catch (err) {
    console.log(`Error while getting session: ${id}`);
    console.log(err);
    next(err);
  }
};

exports.updateSessionById = async function (req, res, next) {
  const { id } = req.params;
  const { slots, tagsData, ...session } = req.body;
  try {
    let existingSession = await findSessionByIdHelper(id);
    let updatedSession = prisma.session.update({
      where: { id: parseInt(id) },
      data: session,
    });
    let map_existing_slots = {};
    let map_existing_slots_code = {};
    existingSession.SessionSlot?.forEach((item) => {
      map_existing_slots[parseInt(item.id)] = 0;
      map_existing_slots_code[parseInt(item.id)] = item;
    });
    // create new meetings-----------------------------------
    // const getSlotExpert = await getSlotExpertHelper(
    //   slots.filter(
    //     (item) =>
    //       (item.isOnline && !item.id && !item.location) ||
    //       (item.id && item.isOnline && !item.location)
    //   )
    // );

    // const links = await Promise.all(
    //   slots
    //     .filter(
    //       (item) =>
    //         (item.isOnline && !item.id && !item.location) ||
    //         (item.id && item.isOnline && !item.location)
    //     )
    //     .map((item, index) => {
    //       return createMeetingHelper({
    //         title: `${session.title}-${index + 1}`,
    //         desc: session.desc,
    //         startTime: item.startTime,
    //         endTime: item.endTime,
    //         users: [
    //           {
    //             userId: `conductor-${item.speakerId}`,
    //             name: getSlotExpert[index].name,
    //             email: getSlotExpert[index].email,
    //             privilege: "conductor",
    //           },
    //         ],
    //       });
    //     })
    // );
    const promises = [];

    for (item of tagsData) {
      const existingTag = await prisma.tag.findMany({
        where: {
          name: item.name,
        },
      });

      if (existingTag.length > 0) {
        let tag = existingTag[0];
        const tagId = tag.id;
        const sessionId = id;
        promises.push(
          prisma.sessionTags.create({
            data: {
              tagId: tagId,
              sessionId: sessionId,
              tag: {
                connect: {
                  id: tag.id,
                },
              },
              session: {
                connect: {
                  id: id,
                },
              },
            },
          })
        );
      } else {
        promises.push(
          prisma.sessionTags.create({
            data: {
              tag: {
                create: {
                  name: item.name,
                },
              },
              session: {
                connect: {
                  id: id,
                },
              },
            },
          })
        );
      }
    }

    let linked_slots = slots
      .filter(
        (item) =>
          (item.isOnline && !item.id && !item.location) ||
          (item.id && item.isOnline && !item.location)
      )
      .map((item, index) => {
        if (item.id) {
          delete item.speakers;
          return prisma.sessionSlot.update({
            where: {
              id: item.id,
            },
            data: {
              ...item,
              // location: links[index].meeting.prefixLink,
              sessionId: parseInt(id),
              // expert_link: `${links[index].meeting.prefixLink}token=${links[index].meeting.expert_token}`,
            },
          });
        }
        return prisma.sessionSlot.create({
          data: {
            ...item,
            // location: links[index].meeting.prefixLink,
            sessionId: parseInt(id),
            // expert_link: `${links[index].meeting.prefixLink}token=${links[index].meeting.expert_token}`,
          },
        });
      });

    let other_linked_slots = slots
      .filter(
        (item) =>
          (item.isOnline && !item.id && item.location) ||
          (item.id && item.isOnline && item.location)
      )
      .map((item) => {
        if (item.id) {
          delete item.speakers;
          return prisma.sessionSlot.update({
            where: {
              id: item.id,
            },
            data: {
              ...item,
              location: item.location,
              sessionId: parseInt(id),
              expert_link: item.location,
            },
          });
        }
        return prisma.sessionSlot.create({
          data: { ...item, sessionId: parseInt(id) },
        });
      });

    // edit existing meetings: timings, title,desc------------------------
    let update_promises = [];
    slots
      .filter((item) => item.id)
      .forEach((item) => {
        map_existing_slots[item.id]++;
        console.log("item", item);
        let { speakers, ...slotData } = item;
        update_promises.push(
          prisma.sessionSlot.update({
            where: { id: item.id },
            data: { ...slotData },
          })
        );
      });

    // delete non-existing slots
    let delete_slots = [];
    Object.keys(map_existing_slots).forEach((item) => {
      if (!map_existing_slots[item]) {
        delete_slots.push(
          prisma.sessionSlot.delete({
            where: {
              id: parseInt(item),
            },
          })
        );
      }
    });

    await prisma.$transaction([
      updatedSession,
      ...linked_slots,
      ...other_linked_slots,
      ...update_promises,
      ...delete_slots,
    ]);
    return res.status(200).json({ success: "true" });
  } catch (err) {
    console.log(`Error while updating session: ${id}`);
    console.log(err);
    next(err);
  }
};

exports.deleteSessionById = async function (req, res, next) {
  let { id } = req.params;
  try {
    id = parseInt(id);
    const existingSession = await findSessionByIdHelper(id);
    await prisma.sessionOrderMapping.deleteMany({
      where: {
        sessionId: id,
      },
    });
    let deletedSession = await prisma.session.delete({ where: { id: id } });
    return res.status(200).json({ deletedSession });
  } catch (err) {
    console.log("Error while deleting session with constraints");
    console.log(err);
    next(err);
  }
};

// get all sessions filtered by the keyword
exports.getSessionByTag = async function (req, res, next) {
  const { tag } = req.query; // key-value pair dictionary
  try {
    const sessions = await getSessionByTagHelper(tag); // expects a string: returns an array of sessions
    return res.status(200).json({ sessions });
  } catch (err) {
    console.log(`Error searching for sessions with tag: ${tag}`);
    console.log(err);
    next(err);
  }
};

exports.getSessionSlotById = async function (req, res, next) {
  let { sessionSlotId } = req.params;
  try {
    let sessionSlot = await findSessionSlotByIdHelper(sessionSlotId);
    return res.status(200).json({ sessionSlot });
  } catch (err) {
    console.log(
      `Error while getting sessionSlotId, ${sessionSlotId} @ ${__filename}`
    );
    console.log(err);
    next(err);
  }
};

exports.updateSessionSlotById = async function (req, res, next) {
  let { sessionSlotId } = req.params;
  try {
    await findSessionSlotByIdHelper(sessionSlotId);
    const sessionSlot = await prisma.sessionSlot.update({
      where: { id: parseInt(sessionSlotId) },
      data: req.body,
    });
    return res.status(200).json({ sessionSlot });
  } catch (err) {
    console.log(
      `Error while updating sessionSlotId, ${sessionSlotId} @ ${__filename}`
    );
    console.log(err);
    next(err);
  }
};

exports.deleteSessionSlotById = async function (req, res, next) {
  let { sessionSlotId } = req.params;
  try {
    await findSessionSlotByIdHelper(sessionSlotId);
    let sessionSlot = await prisma.sessionSlot.delete({
      where: { id: parseInt(sessionSlotId) },
    });
    return res.status(200).json({ sessionSlot });
  } catch (err) {
    console.log(
      `Error while deleting sessionSlotId, ${sessionSlotId} @ ${__filename}`
    );
    console.log(err);
    next(err);
  }
};

exports.updateSessionTags = async function (req, res, next) {
  let { sessionId } = req.params;
  sessionId = parseInt(sessionId);
  const { newTags } = req.body;
  try {
    if (newTags == undefined) {
      throw createCustomError({
        status: 400,
        message: "Invalid data! Missing newTags",
      });
    }
    /*
            1. Create tags which exist
            2. Remove tags which dont exist    
        */

    const existingTags = await prisma.sessionTags.findMany({
      where: {
        sessionId,
      },
      include: {
        tag: true,
      },
    });
    let promises = [];
    let delete_promises = [];
    let map_tags = {};
    existingTags.forEach((item) => {
      map_tags[item.tag.name] = 1;
    });

    newTags.forEach((item) => {
      if (!map_tags[item.name]) {
        // create or connect
        if (item.id) {
          promises.push(
            prisma.sessionTags.create({
              data: {
                tag: {
                  connect: {
                    id: item.id,
                  },
                },
                session: {
                  connect: {
                    id: sessionId,
                  },
                },
              },
            })
          );
        } else {
          promises.push(
            prisma.sessionTags.create({
              data: {
                tag: {
                  create: {
                    name: item.name,
                  },
                },
                session: {
                  connect: {
                    id: sessionId,
                  },
                },
              },
            })
          );
        }
      } else {
        map_tags[item.name] = -1;
      }
    });

    existingTags.forEach((item) => {
      if (map_tags[item.tag.name] !== -1) {
        // delete existing tags
        delete_promises.push(
          prisma.sessionTags.delete({
            where: {
              id: item.id,
            },
          })
        );
      }
    });

    const returnedResult = await prisma.$transaction([
      ...promises,
      ...delete_promises,
    ]);
    return res.status(200).json({ tags: returnedResult });
  } catch (error) {
    console.log(`Error occured while updating session tags @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

exports.getTopSessionTagsTemp = async function (req, res, next) {
  try {
    const topTags = await prisma.sessionTags.findMany({
      include: {
        tag: {
          include: {
            sessionTags: {
              include: {
                session: {
                  include: {
                    SessionSlot: {
                      include: {
                        speakers: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const resultTags = [];
    const tag_map = {}; // map: key: tagId, value: 0:absent, 1+: present
    // if tagId is present in map, then dont iterate
    topTags?.forEach((item) => {
      if (!tag_map[item.tagId]) {
        tag_map[item.tagId] = 1;
        const sessions = [];
        item.tag.sessionTags.forEach((sessionTag) => {
          const { recentSessions } = getSessionStdFormat([sessionTag.session]);
          sessions.push(recentSessions[0]);
        });

        resultTags.push({
          tag: { id: item.tag.id, name: item.tag.name },
          sessions: sessions,
        });
      }
    });
    return res.status(200).json({ topTags: resultTags });
  } catch (error) {
    console.log(`Error occured while getting session-tags @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

exports.setSessionTopTags = async function (req, res, next) {
  const { tags } = req.body;
  try {
    const promises = [];
    const delete_promises = [];
    if (!tags) {
      throw createCustomError({
        status: 400,
        message: "Session-tags required",
      });
    }
    /*
        Find existing top-tags
        - if the tag not present in req.body.tags, delete the top-tag item
        - create the tag from body as top-tag item
            - if the tag doesn't exist, results in failure of transaction
    */
    let existingTags_map = {};
    const existingTags = await prisma.topSessionTags.findMany({});
    existingTags?.forEach((item) => {
      existingTags_map[item.tagId] = 1;
    });
    tags?.forEach((item) => {
      if (!existingTags_map[item.id]) {
        promises.push(
          prisma.topSessionTags.create({
            data: {
              tag: {
                connect: {
                  id: item.id,
                },
              },
            },
          })
        );
      } else {
        existingTags_map[item.id] = 0;
      }
    });
    if (existingTags_map && Object.keys(existingTags_map).length > 0) {
      Object.keys(existingTags_map).forEach((key) => {
        if (existingTags_map[key] == 1) {
          // keys not existing in body -> Delete keys
          delete_promises.push(
            prisma.topSessionTags.delete({
              where: {
                tagId: key,
              },
            })
          );
        }
      });
    }
    const newTags = await prisma.$transaction([...promises]);
    await Promise.all(delete_promises);
    return res.status(200).json({ newTags });
  } catch (error) {
    console.log(`Error occured while setting top-session-tags @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

// Check if a meeting is still in progress in 100ms
exports.checkMeetingStatus = async function (req, res, next) {
  try {
    const { roomId } = req.params;
    
    if (!roomId) {
      return res.status(400).json({ 
        error: "Missing roomId parameter" 
      });
    }

    const app_access_key = process.env.MS_APP_ACCESS_KEY;
    const app_secret_key = process.env.MS_APP_SECRET_KEY;

    if (!app_access_key || !app_secret_key) {
      return res.status(500).json({ 
        error: "Server configuration error" 
      });
    }

    // Generate token
    const payload = {
      access_key: app_access_key,
      type: "management",
      version: 2,
      iat: Math.floor(Date.now() / 1000) - 60, // Subtract 60 seconds to ensure token is valid immediately
      nbf: Math.floor(Date.now() / 1000) - 60, // Subtract 60 seconds to ensure token is valid immediately
    };

    const token = jwt.sign(payload, app_secret_key, {
      algorithm: "HS256",
      expiresIn: "24h",
      jwtid: uuid4(),
    });

    // Check room status
    const response = await axios.get(`https://api.100ms.live/v2/rooms/${roomId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const room = response.data;
    const isActive = room && room.state === 'active';
    
    return res.status(200).json({ 
      isActive,
      room: room || null
    });

  } catch (error) {
    console.error("Error checking meeting status:", error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      return res.status(200).json({ 
        isActive: false,
        room: null,
        message: "Room not found"
      });
    }
    
    return res.status(500).json({ 
      error: "Failed to check meeting status",
      message: error.response?.data?.message || error.message
    });
  }
};

exports.getSessionToken = async function (req, res, next) {
  try {
    const app_access_key = process.env.MS_APP_ACCESS_KEY;
    const app_secret_key = process.env.MS_APP_SECRET_KEY;

    if (!app_access_key || !app_secret_key) {
      console.error("Missing 100ms environment variables");
      return res.status(500).json({ 
        error: "Server configuration error", 
        message: "100ms credentials not configured" 
      });
    }

    var payload = {
      access_key: app_access_key,
      type: "management",
      version: 2,
      iat: Math.floor(Date.now() / 1000) - 60, // Subtract 60 seconds to ensure token is valid immediately
      nbf: Math.floor(Date.now() / 1000) - 60, // Subtract 60 seconds to ensure token is valid immediately
    };

    let token = jwt.sign(payload, app_secret_key, {
      algorithm: "HS256",
      expiresIn: "24h",
      jwtid: uuid4(),
    });

    return res.status(200).json({ token: token });
  } catch (error) {
    console.log(`Error occurred while getting session token @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

// Create 100ms room endpoint
exports.create100msRoom = async function (req, res, next) {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Room name is required"
      });
    }

    const roomId = await create100msRoom(name, description || "Room created via API");

    return res.status(200).json({
      success: true,
      message: "100ms room created successfully",
      roomId: roomId
    });

  } catch (error) {
    console.error("Error creating 100ms room:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create 100ms room",
      error: error.message
    });
  }
};

exports.getSessionSlotsByDateRange = async (req, res) => {
  try {
    const { date, startDate, endDate, userId, view } = req.query;
    
    // Parse dates based on whether it's a range or single date
    let queryStartDate, queryEndDate;
    let dateRangeProvided = false;
    
    if (startDate && endDate) {
      // Date range mode - use provided range
      queryStartDate = new Date(startDate);
      queryStartDate.setHours(0, 0, 0, 0); // Start of day
      queryEndDate = new Date(endDate);
      queryEndDate.setHours(23, 59, 59, 999); // End of day
      dateRangeProvided = true;
    } else if (date) {
      // Single date mode
      queryStartDate = new Date(date);
      queryStartDate.setHours(0, 0, 0, 0);
      queryEndDate = new Date(date);
      queryEndDate.setHours(23, 59, 59, 999);
    } else {
      // Default to current date
      queryStartDate = new Date();
      queryStartDate.setHours(0, 0, 0, 0);
      queryEndDate = new Date();
      queryEndDate.setHours(23, 59, 59, 999);
    }

    // Adjust date range based on view (only if no date range was provided)
    if (!dateRangeProvided) {
      switch(view) {
        case 'upcoming':
          queryStartDate = new Date();
          queryEndDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
          break;
        case 'completed':
          // For completed: use provided date range or default to 1 year back
          // If no date range provided, go back 1 year to show all completed sessions
          if (!dateRangeProvided) {
          queryStartDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
          queryEndDate = new Date();
          }
          // If date range is provided, use it (allows filtering)
          break;
        case 'mySchedule':
          // Keep the date range as is, we'll filter for registered sessions
          break;
      }
    }

    // Build the where clause
    const whereClause = {
      AND: [
        {
          session: {
            isArchived: false,
            isActive: true
          }
        }
      ]
    };

    // Add time constraints
    if (view === 'upcoming') {
      whereClause.AND.push({
        startTime: {
          gte: queryStartDate.toISOString()
        }
      });
    } else if (view === 'completed') {
      whereClause.AND.push({
        endTime: {
          lt: queryEndDate.toISOString()
        }
      });
    } else if (view === 'mySchedule') {
      // For mySchedule: show sessions that overlap with the date range
      // Include sessions that start before range but end within/after, or start within range
      whereClause.AND.push({
        OR: [
          {
            // Sessions that start within the range
            startTime: {
              gte: queryStartDate.toISOString(),
              lte: queryEndDate.toISOString()
            }
          },
          {
            // Sessions that start before range but end after range start (ongoing sessions)
            AND: [
              {
                startTime: {
                  lt: queryStartDate.toISOString()
                }
              },
              {
                endTime: {
                  gte: queryStartDate.toISOString()
                }
              }
            ]
          }
        ]
      });
    } else {
      // Default: use the provided date range
      whereClause.AND.push({
        startTime: {
          gte: queryStartDate.toISOString(),
          lte: queryEndDate.toISOString()
        }
      });
    }

    // Add registration filter for mySchedule and completed views using Attendance table
    if ((view === 'mySchedule' || view === 'completed') && userId) {
      whereClause.AND.push({
        Attendance: {
          some: {
            userId: parseInt(userId)
          }
        }
      });
    }

    // Get session slots with comprehensive session information
    const sessionSlots = await prisma.sessionSlot.findMany({
      where: whereClause,
      include: {
        session: {
          include: {
            creator: {
              select: {
                id: true,
                email: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    photoURL: true
                  }
                },
                expert: {
                  select: {
                    id: true,
                    name: true,
                    photoURL: true
                  }
                },
                partner: {
                  select: {
                    id: true,
                    name: true,
                    photoURL: true
                  }
                },
                admin: {
                  select: {
                    id: true,
                    name: true,
                    photoURL: true
                  }
                }
              }
            },
            tags: {
              include: {
                tag: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        speakers: {
          include: {
            user: { select: { name: true, photoURL: true, email: true, id: true } },
            admin: { select: { name: true, photoURL: true, email: true, id: true } },
            expert: { select: { name: true, photoURL: true, email: true, id: true } },
            partner: { select: { name: true, photoURL: true, email: true, id: true } }
          }
        },
        Attendance: userId ? {
          where: {
            userId: parseInt(userId)
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                photoURL: true
              }
            }
          }
        } : false
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // Fetch communities separately since Session model doesn't have a direct community relation
    const communityIds = [...new Set(sessionSlots
      .map(slot => slot.session?.communityId)
      .filter(id => id !== null && id !== undefined)
    )];
    
    const communities = communityIds.length > 0 
      ? await prisma.community.findMany({
          where: { id: { in: communityIds } },
          select: {
            id: true,
            title: true,
            desc: true,
            bannerImg: true
          }
        })
      : [];
    
    // Create a map for quick lookup
    const communityMap = new Map(communities.map(comm => [comm.id, comm]));

    // Process slots to include comprehensive information
    const processedSlots = sessionSlots.map(slot => {
      // Defensive: always treat speakers as an array
      let speakersArr = [];
      if (Array.isArray(slot.speakers)) {
        speakersArr = slot.speakers;
      } else if (slot.speakers) {
        speakersArr = [slot.speakers];
      } // else remains []

      // Defensive: always treat tags as an array
      let tagsArr = [];
      if (slot.session && Array.isArray(slot.session.tags)) {
        tagsArr = slot.session.tags;
      } else if (slot.session && slot.session.tags) {
        tagsArr = [slot.session.tags];
      }

      const isRegistered = userId ? slot.Attendance?.length > 0 : false;
      const now = new Date();
      const slotStartTime = new Date(slot.startTime);
      const slotEndTime = new Date(slot.endTime);
      // Determine if session is live
      const isLive = slotStartTime <= now && slotEndTime >= now;
      const isUpcoming = slotStartTime > now;
      const isCompleted = slotEndTime < now;
      // Get room information for joining
      const roomInfo = {
        roomId: slot.session.roomId, // Session slot ID serves as room ID
        meetingLink: slot.location || null,
        expertLink: slot.expert_link || null,
        isOnline: slot.isOnline || false,
        location: slot.location || null
      };
      // Get session images
      const sessionImages = {
        banner: slot.session.bannerImgs && slot.session.bannerImgs.length > 0 ? slot.session.bannerImgs[0] : null,
        infoImages: slot.session.infoImgs || [],
        primaryImage: (slot.session.bannerImgs && slot.session.bannerImgs.length > 0) 
          ? slot.session.bannerImgs[0] 
          : (slot.session.infoImgs && slot.session.infoImgs.length > 0) 
            ? slot.session.infoImgs[0] 
            : null
      };
      // Get creator information from the appropriate related model
      const getCreatorInfo = () => {
        if (slot.session.creator?.user) {
          return slot.session.creator.user;
        } else if (slot.session.creator?.expert) {
          return slot.session.creator.expert;
        } else if (slot.session.creator?.partner) {
          return slot.session.creator.partner;
        } else if (slot.session.creator?.admin) {
          return slot.session.creator.admin;
        }
        return null;
      };
      const creatorInfo = getCreatorInfo();
      return {
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        topicName: slot.topicName,
        duration: Math.round((slotEndTime - slotStartTime) / (1000 * 60)), // Duration in minutes
        session: {
          id: slot.session.id,
          title: slot.session.title,
          desc: slot.session.desc,
          communityId: slot.session.communityId,
          isExclusive: slot.session.isExclusive,
          isVideoChannel: slot.session.isVideoChannel,
          isCourse: slot.session.isCourse,
          createdAt: slot.session.createdAt,
          updatedAt: slot.session.updatedAt,
          images: sessionImages,
          user: creatorInfo,
          community: slot.session.communityId && communityMap.has(slot.session.communityId) 
            ? communityMap.get(slot.session.communityId)
            : null,
          tags: tagsArr.map(tag => ({
            id: tag.tag.id,
            name: tag.tag.name
          }))
        },
        speakers: speakersArr.map(speaker => getSpeakerInfo(speaker)),
        room: roomInfo,
        isRegistered,
        isLive,
        isUpcoming,
        isCompleted,
        status: isCompleted 
          ? 'completed' 
          : isLive 
            ? 'ongoing' 
            : 'upcoming',
        canJoin: isRegistered && isLive,
        canViewDetails: true
      };
    });

    // Filter slots based on view if needed
    let filteredSlots = processedSlots;
    
    if (view === 'mySchedule') {
      // For mySchedule: show registered sessions that are upcoming or live (not completed)
      filteredSlots = processedSlots.filter(slot => {
        return slot.isRegistered && (slot.isUpcoming || slot.isLive);
      });
    } else if (view === 'completed') {
      // For completed: show only registered and completed sessions
      filteredSlots = processedSlots.filter(slot => slot.isRegistered && slot.isCompleted);
    }
    // For 'upcoming' or other views, show all slots

    // Group slots by date
    const groupedSlots = filteredSlots.reduce((acc, slot) => {
      const date = new Date(slot.startTime).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(slot);
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: {
        slots: filteredSlots,
        groupedSlots,
        total: filteredSlots.length,
        dateRange: {
          start: queryStartDate,
          end: queryEndDate
        },
        summary: {
          totalSessions: filteredSlots.length,
          liveSessions: filteredSlots.filter(slot => slot.isLive).length,
          upcomingSessions: filteredSlots.filter(slot => slot.isUpcoming).length,
          completedSessions: filteredSlots.filter(slot => slot.isCompleted).length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching session slots:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch session slots',
      message: error.message
    });
  }
};
