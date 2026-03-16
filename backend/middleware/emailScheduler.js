const moment = require('moment')
const schedule = require('node-schedule');
const { getUserSessionsById, getUsers } = require('../api/user/user.controller');
const mailer = require("../services/email/todaySessionsMailer")

const sendDailyEmail = async () => {
    try {
        const users = await getUsers();

        if (users.length === 0) {
            console.log('No users found.');
            return;
        }
        else {
            for (let user of users) {
                const userSessions = await getUserSessionsById(user.id);
                let sessions = userSessions.session;

                const today = moment().format('YYYY-MM-DD');
                sessions = sessions.filter(session => {
                    return moment(session.SessionSlot[0].startTime).format('YYYY-MM-DD') === today;
                });

                const sessionsFormatted = sessions.map(session => {
                    return {
                        title: session.title,
                        desc: session.desc,
                        startTime: moment(session.SessionSlot[0].startTime).format('LT'),
                        endTime: moment(session.SessionSlot[0].endTime).format('LT'),
                        meetingLink: `https://aluminaries.com/room/${session.roomId}`
                    }
                });

                if (sessionsFormatted.length > 0) {
                    const recipient = user.email;
                    const subject = 'Today\'s Sessions';
                    const body = sessions.length > 0 ? `Hello ${user.name}, here are the sessions for today:` : `Hello ${user.name}, there are no sessions for today.`;
                
                    const sendMailStatus = mailer(recipient, subject, body, sessionsFormatted);
                    if (sendMailStatus.status === 'err') {
                        console.log('Email sent successfully.');
                    }
                }                
            }
        }
    }
    catch (err) {
        console.log(err);
    }
};

const job = schedule.scheduleJob({ hour: 8, minute: 0, second: 0, tz: 'Asia/Kolkata' }, sendDailyEmail);
