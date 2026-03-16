const { PrismaClient } = require("@prisma/client");
// const createError=require('http-errors');
const { createCustomError } = require("../../middleware/errorHandling");
const prisma = new PrismaClient();

// returns, [sessions] | error
exports.getTiers = function (ids) {
  let promises = [];
  ids.forEach((communityId) => {
    let session = prisma.sessionTier.findMany({
      where: { communityId: parseInt(communityId) },
      include: {
        community: true,
        sessionSlot: {
          include: {
            session: true,
          },
        },
      },
    });

    promises.push(session);
  });

  return Promise.all(promises);
};

exports.getSessionSlot = function (id) {
  let sessionSlot = prisma.sessionSlot.findUnique({
    where: { id: id },
  });

  return sessionSlot;
};

// returns the list of all sessions, if the title or
// description contains the tag

/*
    if tag===wellness, list of sessions which benefits wellness.
*/
exports.getSessionByTagHelper = function (tag) {
  let sessions = prisma.session.findMany({
    where: {
      OR: [
        {
          title: {
            contains: tag,
            mode: "insensitive",
          },
        },
        {
          desc: {
            contains: tag,
            mode: "insensitive",
          },
        },
      ],
    },
    include: {
      SessionSlot: {
        include: {
          speakers: true,
        },
      },
    },
  });

  return sessions;
};

exports.updateSessionSlotHelper = function (slot) {
  let promises = [];
  /*
        OPS: 
        1. Create slots, which dont exist
        2. Update slots, which are present
        3. DELETE slots, which exist in db, but not in slot input.
    */
  slot.forEach((cur) => {
    const { id } = cur;
    delete cur.id;
    if (id) {
      promises.push(
        prisma.sessionSlot.update({ where: { id: parseInt(id) }, data: cur })
      );
    } else {
      promises.push(prisma.sessionSlot.create({ data: cur }));
    }
  });

  return Promise.all(promises);
};
exports.updateSessionSlotHelper2 = function (slot, existingSession) {
  let sessionId = existingSession.id;
  let promises = [];
  /*
        OPS: 
        1. Create slots, which dont exist
        2. Update slots, which are present
        3. DELETE slots, which exist in db, but not in slot input.
    */
  let map_existing_slots = {};
  existingSession.SessionSlot?.forEach((item) => {
    map_existing_slots[parseInt(item.id)] = 0;
  });
  let countNumOnlineSess = 0;
  slot.forEach((cur) => {
    const { id } = cur;
    if (map_existing_slots[parseInt(id)] === 0) {
      map_existing_slots[parseInt(id)]++;
      delete cur.speakers;
      promises.push(
        prisma.sessionSlot.update({
          where: { id: parseInt(id) },
          data: { ...cur, speakerId: cur.speakerId },
        })
      );
      // edit meeting or create a meeting if already not present
      if (slot.isOnline && slot.location) {
        countNumOnlineSess++;
      }
    } else {
      promises.push(prisma.sessionSlot.create({ data: { ...cur, sessionId } }));
      // create meeting
    }
  });

  let delete_slots = [];
  // delete the slots which are not mentioned
  Object.keys(map_existing_slots).forEach((item) => {
    if (!map_existing_slots[item]) {
      delete_slots.push(parseInt(item));
      console.log(item);
      // delete meetings
    }
  });

  return [promises, delete_slots];
};

// sessions={session:{include:{SessionSlot:{speakers:true}}}}
exports.getSessionStdFormat = function (sessions) {
  let recentSessions = [];
  let completedSessions = [];
  let today = new Date();
  sessions.forEach((item) => {
    let slots = item.SessionSlot;
    let expired = 1;
    let active_slots = [];
    for (let slot of slots) {
      if (new Date(slot.endTime) >= today) {
        expired--;
        active_slots.push(slot);
        // break;
      }
    }

    if (expired === 1) {
      completedSessions.push(item);
    } else {
      recentSessions.push({ ...item, SessionSlot: active_slots });
    }
  });

  return { recentSessions, completedSessions };
};

exports.deleteSlotsHelper = function (ids) {
  return prisma.sessionSlot.deleteMany({ where: { id: { in: ids } } });
};

exports.getNumActiveSessions = function () {
  return new Promise((resolve, reject) => {
    let keys = {};
    let today = new Date();
    prisma.sessionSlot
      .findMany({})
      .then((res) => {
        res.forEach((item) => {
          if (new Date(item.endTime) > today) {
            if (keys[item.sessionId]) {
              keys[item.sessionId]++;
            } else {
              keys[item.sessionId] = 1;
            }
          }
        });

        resolve(Object.keys(keys).length);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

// Meetify helper functions removed - system now uses 100ms for video conferencing
// for await
exports.getSlotExpertHelper = function (slots) {
  let promises = [];
  for (let slot of slots) {
    promises.push(prisma.expert.findUnique({ where: { id: 1 } }));
  }
  return Promise.all(promises);
};

// Meetify EditMeetingHelper and DeleteMeetingHelper removed - system now uses 100ms

exports.createSessionTiersHelper = (communityId, slots) => {
  let promises = [];
  slots.forEach((item) => {
    promises.push(
      prisma.sessionTier.create({
        data: {
          communityId,
          sessionSlotId: item.id,
        },
      })
    );
  });
  return Promise.all(promises);
};
