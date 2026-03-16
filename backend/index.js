// imports ----------------------------------
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cron = require('node-cron');
const expireUserPoints = require("./scripts/jobs/expireUserPoints");
const checkCatchupRoomUsers = require('./scripts/jobs/checkCatchupRoomUsers');
const { checkCatchupReminders, checkEndedCatchups } = require('./api/catchup/catchup.controller');
const huddleScheduler = require('./services/huddle/huddle-scheduler');
// routes imports ---------------------------
const authRouter = require("./api/auth/auth.route");
const sessionRouter = require("./api/session/session.route");
const userRouter = require("./api/user/user.route");
const partnerRouter = require("./api/partner/partner.route");
const adminRouter = require("./api/admin/admin.route");
const tierRouter = require("./api/sessTier/sessTier.route");
const communityRouter = require("./api/community/community.route");
const expertRouter = require("./api/expert/expert.route");
const paymentRouter = require("./api/payment/payment.route");
const videoRouter = require("./api/video/video.router");
const walletRouter = require("./api/wallet/wallet.route");
const ticketRouter = require("./api/tickets/tickets.route");
const subcommunityRouter = require("./api/subcommunity/subcommunity.route");
const channelRouter = require("./api/channel/channel.route");
const messageRouter = require("./api/message/message.route");
const threadRouter = require("./api/thread/thread.route");
const eventRouter = require("./api/event/event.router");
const searchRouter = require("./api/search/search");
const blogRouter = require("./api/blog/blog.route");
const tagRouter = require("./api/tags/tags");
const couponRouter = require("./api/coupon/coupon.route");
const orderRouter = require("./api/order/order.route");
const catchUpRouter = require("./api/catchup/catchup.route");
const questionsRouter = require("./api/questions/question.route");

const recommendationsRouter = require("./api/recommendations/recommendations.route");
const sessionThreadsRouter = require("./api/sessionThreads/sessionThreads.route");

const resourcesRouter = require("./api/resources/resources.route");
const forms = require("./api/forms/forms.route");
const requestRouter = require("./api/requests/requests.route");
const comRequestRouter = require("./api/comRequest/comRequest.route");
const notifs = require("./api/chatnotifications/chatnotifications.route");
const rewards = require("./api/rewards/rewards.route")
const imageRoutes = require("./api/uploadImage/image.router")
const moodleRoutes = require("./api/moodle/moodle.route");
const competitions = require("./api/competitions/competitions.route")
const connectionRouter = require("./api/connections/connection.route");
const notificationRouter = require("./api/notifications/notification.route");
const analyticsRouter = require("./api/analytics/analytics.route");
const services = require("./api/service/service.route");
const huddleRouter = require("./api/huddle/huddle.route");
const dashboardRouter = require("./api/dashboard/dashboard.route");


// middleware imports -----------------------
const { reportError: errorHandler } = require("./middleware/errorHandling");
const authenticateToken = require("./middleware/authenticateToken");

// const {generateRoomId} = require('./utils/generateRoomId')

// generateRoomId().then(roomId => {
//   console.log("The generated room ID is", roomId);
// }).catch(error => {
//   console.error("Failed to generate room ID:", error);
// });

dotenv.config();

// Validate DATABASE_URL before starting the server
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
  console.error('Please set DATABASE_URL in your .env file.');
  console.error('Format: postgresql://username:password@host:port/database');
  process.exit(1);
}

// Validate DATABASE_URL format
try {
  const url = new URL(DATABASE_URL);
  if (!url.hostname || url.hostname.trim() === '') {
    console.error('❌ ERROR: DATABASE_URL has an empty host!');
    console.error('Current DATABASE_URL:', DATABASE_URL.replace(/:[^:@]+@/, ':****@')); // Hide password
    console.error('Please check your .env file and ensure DATABASE_URL has the correct format:');
    console.error('postgresql://username:password@host:port/database');
    console.error('Example: postgresql://postgres:password@localhost:5432/ifca_db');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ ERROR: DATABASE_URL has an invalid format!');
  console.error('Error:', error.message);
  console.error('Please ensure DATABASE_URL follows this format:');
  console.error('postgresql://username:password@host:port/database');
  console.error('Example: postgresql://postgres:password@localhost:5432/ifca_db');
  process.exit(1);
}

const app = express();

// middleware -------------------------------
// Enable CORS only in development environment
console.log('NODE_ENV:', process.env.NODE_ENV);

if (process.env.NODE_ENV === 'development') {
  // Configure CORS options for development only
  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://localhost:3005',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3005'
      ];
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With', 
      'Accept', 
      'Origin',
      'Cache-Control',
      'Pragma',
      'noLoad'
    ],
    exposedHeaders: ['Content-Length', 'X-Requested-With'],
    optionsSuccessStatus: 200
  };

  app.use(cors(corsOptions));
  console.log('CORS enabled for development');
} else {
  console.log('CORS disabled for production');
}

app.use(express.json());

// MIDDLEWARE --------------
app.use(morgan("dev"));

// Add request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body));
  }
  next();
});

// implement a middleware to check, if not able to reach DB, return;

// routes ---------------------------------
// Test endpoint to verify server is working
app.get("/api/v1/test", (req, res) => {
  res.json({ message: "Server is running!", timestamp: new Date().toISOString() });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/session", sessionRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/partner", partnerRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/tier", tierRouter);
app.use("/api/v1/community", communityRouter);
app.use("/api/v1/subcommunity", subcommunityRouter);
app.use("/api/v1/expert", expertRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/pay", paymentRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/wallet", walletRouter);
app.use("/api/v1/ticket", ticketRouter);
app.use("/api/v1/channel", channelRouter);
app.use("/api/v1/message", messageRouter);
app.use("/api/v1/thread", threadRouter);
app.use("/api/v1/event", eventRouter);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/blog", blogRouter);
app.use("/api/v1/tag", tagRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/coupon", couponRouter);
app.use("/api/v1/recommendation", recommendationsRouter);
app.use("/api/v1/sessionThreads", sessionThreadsRouter);
app.use("/api/v1/resources", resourcesRouter);
app.use("/api/v1/requests", requestRouter);
app.use("/api/v1/comRequest", comRequestRouter);
app.use("/api/v1/catchup", catchUpRouter);
app.use("/api/v1/questions", questionsRouter);
app.use("/api/v1/forms", forms);
app.use("/api/v1/competitions", competitions)
app.use("/api/v1/chatnotfications", notifs);
app.use("/api/v1/rewards", rewards);
app.use('/api/v1/images', imageRoutes);
app.use('/api/v1/course', moodleRoutes);
app.use('/api/v1/connections', connectionRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/service', services)
app.use('/api/v1/huddle', huddleRouter)
app.use('/api/v1/dashboard', dashboardRouter)


// Cron Jobs----------------------
cron.schedule('0 0 * * *', async () => {
  console.log('Running cron job: expireUserPoints');
  await expireUserPoints(); 
});

// Check 100ms catchup rooms every 2 minutes
cron.schedule('*/2 * * * *', async () => {
  console.log('Running cron job: checkCatchupRoomUsers');
  await checkCatchupRoomUsers();
});

// Check for catchup reminders every minute
cron.schedule('* * * * *', async () => {
  console.log('Running cron job: checkCatchupReminders');
  await checkCatchupReminders();
});

// Check for ended catchups every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('Running cron job: checkEndedCatchups');
  await checkEndedCatchups();
});

// ==================== HUDDLE CRON JOBS ====================

// Check for huddle 1-day reminders daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running cron job: checkHuddleReminders1Day');
  await huddleScheduler.checkHuddleReminders1Day();
});

// Check for huddle 2-hour reminders every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('Running cron job: checkHuddleReminders2Hours');
  await huddleScheduler.checkHuddleReminders2Hours();
});

// Check for huddle 10-minute reminders every minute
cron.schedule('* * * * *', async () => {
  console.log('Running cron job: checkHuddleReminders10Min');
  await huddleScheduler.checkHuddleReminders10Min();
});

// Auto-launch scheduled huddles every minute
cron.schedule('* * * * *', async () => {
  console.log('Running cron job: autoLaunchHuddles');
  await huddleScheduler.autoLaunchHuddles();
});

// Check for ended huddles every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('Running cron job: checkEndedHuddles');
  await huddleScheduler.checkEndedHuddles();
});

// Check for streak reminders daily at 10 AM
cron.schedule('0 10 * * *', async () => {
  console.log('Running cron job: checkStreakReminders');
  await huddleScheduler.checkStreakReminders();
});

// Generate AI hooks for live huddles every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('Running cron job: generateAIHooks');
  await huddleScheduler.generateAIHooks();
});

// Cleanup old huddle data weekly on Sunday at 2 AM
cron.schedule('0 2 * * 0', async () => {
  console.log('Running cron job: cleanupOldHuddleData');
  await huddleScheduler.cleanupOldHuddleData();
});

// error Handler --------------------------
app.use(errorHandler);
app.use("*", (req, res) => {
  return res.status(404).json({ status: 404, message: `Route not found` });
});

const { sendEmailHelper } = require("./api/mail/email");
const postSignup = require("./utils/mailtemplates/forsignup");
const { applyAsSpeaker } = require("./api/session/session.controller");

const { sendDailyEmail } = require("./middleware/emailScheduler");


// sendEmailHelper({senderUrl:"reachdarshanv@gmail.com",subject:'Welcome aboard',...postSignup({name:"Darshan V"})})

// server setup ---------------------------
const port = process.env.PORT || 5000;
app.listen(port, (err) => {
  console.log(`Server is running on port ${port}`);
});
