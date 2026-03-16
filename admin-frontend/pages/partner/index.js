import React, { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { selectUser } from "@/store/features/userSlice";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MdPeople, 
  MdGroups, 
  MdEvent, 
  MdTrendingUp,
  MdNotifications,
  MdArrowForward,
  MdCalendarToday,
  MdPersonAdd,
  MdAddCircle,
  MdBarChart,
  MdSettings,
  MdMenu,
  MdRestaurant,
  MdLocalDining,
  MdKitchen,
  MdFoodBank,
  MdEmojiFoodBeverage,
  MdLocalCafe,
  MdDashboard,
  MdPendingActions
} from "react-icons/md";
import api from "@/utils/apiSetup";
import moment from 'moment';

const PartnerPage = () => {
  const router = useRouter();
      const user = useSelector(selectUser);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const upcomingSessions = [
    { id: 1, title: "Community Workshop", date: "2024-03-20", time: "10:00 AM", participants: 25 },
    { id: 2, title: "Expert Panel", date: "2024-03-21", time: "2:00 PM", participants: 15 },
    { id: 3, title: "Training Session", date: "2024-03-22", time: "11:00 AM", participants: 30 }
  ];

  const quickActions = [
    { 
      title: "Add User", 
      icon: MdPersonAdd, 
      color: "saffron",
      gradient: "from-orange-500 to-yellow-500",
      link: "/partner/add",
      description: "Register new members"
    },
    { 
      title: "Create Community", 
      icon: MdAddCircle, 
      color: "emerald",
      gradient: "from-emerald-500 to-teal-500",
      link: "/admin/community/add",
      description: "Start new groups"
    },
    { 
      title: "Schedule Session", 
      icon: MdCalendarToday, 
      color: "blue",
      gradient: "from-blue-500 to-indigo-500",
      link: "/partner/session/create",
      description: "Plan activities"
    },
    // { 
    //   title: "View Rewards", 
    //   icon: MdBarChart, 
    //   color: "rose",
    //   gradient: "from-rose-500 to-pink-500",
    //   link: "/admin/rewardManagement",
    //   description: "Analytics & insights"
    // }
  ];

  const cookingIcons = [
    MdRestaurant,
    MdLocalDining,
    MdKitchen,
    MdFoodBank,
    MdEmojiFoodBeverage,
    MdLocalCafe
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  
  const activityTypeMap = {
    user: {
      icon: MdPeople,
      color: "saffron",
      gradient: "from-orange-500 to-yellow-500"
    },
    expert: {
      icon: MdTrendingUp,
      color: "emerald",
      gradient: "from-emerald-500 to-teal-500"
    },
    community: {
      icon: MdGroups,
      color: "emerald",
      gradient: "from-emerald-500 to-teal-500"
    },
    session: {
      icon: MdEvent,
      color: "blue",
      gradient: "from-blue-500 to-indigo-500"
    },
    request: {
      icon: MdPendingActions,
      color: "rose",
      gradient: "from-rose-500 to-pink-500"
    },
    form: {
      icon: MdBarChart,
      color: "blue",
      gradient: "from-blue-500 to-indigo-500"
    },
    competition: {
      icon: MdDashboard,
      color: "saffron",
      gradient: "from-orange-500 to-yellow-500"
    }
  };

 useEffect(() => {
  api.get("/analytics/partner/dashboard")
    .then(res => {
      const data = res.data;
      setStatsData({
        "Total Partners": {
          value: data.partners?.total ?? 0,
          change: "0%",
          icon: MdPeople,
          color: "saffron",
          gradient: "from-orange-500 to-yellow-500",
          description: "Total partners"
        },
        "Total Communities": {
          value: data.communities?.total ?? 0,
          change: "0%",
          icon: MdGroups,
          color: "emerald",
          gradient: "from-emerald-500 to-teal-500",
          description: "Total communities"
        },
        "Total Sessions": {
          value: data.sessions?.total ?? 0,
          change: "0%",
          icon: MdEvent,
          color: "blue",
          gradient: "from-blue-500 to-indigo-500",
          description: "Total sessions"
        }
      });
      setLoading(false);
    })
    .catch(() => setLoading(false));
}, []);

  useEffect(() => {
    api.get("/analytics/partner/recent-activities?limit=10")
      .then(res => {
        setRecentActivities(res.data.activities || []);
        setRecentLoading(false);
      })
      .catch(() => setRecentLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-white to-green-50 relative overflow-hidden">
      {/* Background Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {cookingIcons.map((Icon, index) => (
          <motion.div
          key={index}
            className="absolute text-gray-200 opacity-10"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 2 + 1
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              rotate: Math.random() * 360
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <Icon className="w-16 h-16" />
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Header */}
        <motion.div 
          className="bg-white/90 backdrop-blur-md  border-b border-gray-200"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-600 bg-clip-text text-transparent">
                    Dashboard
                  </h1>
                  <p className="text-sm text-gray-500">Welcome back, {user?.name || 'Admin'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-400 hover:text-saffron-500 transition-colors"
                >
                  <MdNotifications className="h-6 w-6" />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-400 hover:text-saffron-500 transition-colors"
                >
                  <MdSettings className="h-6 w-6" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Quick Actions */}
          <motion.div
            className="mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`cursor-pointer group transition-all duration-200`}
                >
                  <Link
                    href={action.link}
                    className={`block bg-white/90 backdrop-blur-md rounded-xl shadow-lg px-8 py-6 hover:shadow-2xl border border-gray-200 group-hover:border-${action.color}-400 transition-all min-h-[120px]`}
                    style={{ minWidth: 220 }}
                  >
                    <div className="flex flex-row items-center">
                      <div className={`p-4 rounded-lg bg-gradient-to-r ${action.gradient} flex items-center justify-center shadow-md`}>
                        <action.icon className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex flex-col flex-1 ml-4">
                        <h3 className="text-lg m-0  font-semibold text-gray-800 group-hover:text-saffron-600 transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-500">{action.description}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            className="mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                <div className="col-span-4 text-center text-gray-400">Loading...</div>
              ) : (
                statsData && Object.entries(statsData).map(([title, data], index) => {
                  // Determine color and icon for percentage
                  const percent = parseFloat(data.change);
                  let percentColor = "text-gray-500";
                  let bgPercent = "bg-gray-100";
                  let arrow = null;
                  if (percent > 0) {
                    percentColor = "text-green-600";
                    bgPercent = "bg-green-50";
                    arrow = (
                      <svg className="inline w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    );
                  } else if (percent < 0) {
                    percentColor = "text-red-600";
                    bgPercent = "bg-red-50";
                    arrow = (
                      <svg className="inline w-4 h-4 text-red-500 mr-1" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    );
                  } else {
                    percentColor = "text-gray-500";
                    bgPercent = "bg-gray-100";
                    arrow = (
                      <svg className="inline w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    );
                  }

                  return (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      whileHover={{ scale: 1.03, y: -8 }}
                      className={`bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-7 border-2 border-transparent hover:border-${data.color}-300 transition-all group relative overflow-hidden`}
                      style={{
                        boxShadow: `0 8px 32px 0 rgba(31, 38, 135, 0.10)`,
                        minHeight: 200
                      }}
                    >
                      {/* Decorative background gradient */}
                      <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none bg-gradient-to-br ${data.gradient}`}></div>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-r ${data.gradient} w-fit shadow-md`}>
                          <data.icon className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`flex items-center text-base font-bold px-2 py-1 rounded-lg ${bgPercent} ${percentColor}`}>
                            {arrow}
                            {data.change}
                          </span>
                          <span className="text-xs text-gray-400 mt-1">Compared to last month</span>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 group-hover:text-saffron-600 transition-colors">
                        {title}
                      </h3>
                      <p className={`text-3xl font-extrabold bg-gradient-to-r ${data.gradient} bg-clip-text text-transparent mt-2`}>
                        {data.value}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{data.description}</p>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activities */}
            <motion.div 
              variants={itemVariants}
              className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
                <Link href="/admin/activities" className="text-sm text-saffron-500 hover:text-saffron-600 font-medium">
                  <div>View All</div>
                </Link>
              </div>
              <div className="space-y-2">
                {recentLoading ? (
                  <div className="text-center text-gray-400">Loading...</div>
                ) : recentActivities.length === 0 ? (
                  <div className="text-center text-gray-400">No recent activities</div>
                ) : (
                  recentActivities.map((activity, idx) => {
                    const typeMeta = activityTypeMap[activity.type] || activityTypeMap.user;
                    const Icon = typeMeta.icon;
                    return (
                      <motion.div
                        key={idx}
                        whileHover={{ x: 6 }}
                        className="flex items-center px-2 py-1 hover:bg-gray-50 rounded-lg transition-colors group shadow-sm bg-white/80 border border-gray-100 min-h-[38px]"
                        style={{ fontSize: '0.92rem' }}
                      >
                        <div className={`p-2 rounded-md bg-gradient-to-r ${typeMeta.gradient} flex items-center justify-center shadow mr-2`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-gray-800 font-medium group-hover:text-saffron-600 transition-colors" style={{ fontSize: '0.97rem' }}>
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {moment(activity.timestamp).fromNow()}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>

            {/* Upcoming Sessions */}
            <motion.div 
              variants={itemVariants}
              className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h2>
                <Link href="/admin/sessions" className="text-sm text-saffron-500 hover:text-saffron-600 font-medium">
                  <div>View All</div>
              </Link>
              </div>
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <motion.div 
                    key={session.id}
                    whileHover={{ x: 10 }}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                  >
                    <div>
                      <p className="text-gray-800 font-medium group-hover:text-saffron-600 transition-colors">
                        {session.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {session.date} at {session.time}
                      </p>
                    </div>
                    <div className="text-sm text-saffron-500 font-medium">
                      {session.participants} participants
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-gray-800 bg-opacity-50 z-50"
          >
            <motion.div 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="bg-white h-full w-64 p-4"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-saffron-600">Menu</h2>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-500 hover:text-saffron-500"
                >
                  <MdArrowForward className="h-6 w-6" />
                </motion.button>
              </div>
              <nav className="space-y-4">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ x: 10 }}
                  >
                    <Link
                      href={action.link}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${action.gradient}`}>
                          <action.icon className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-gray-700">{action.title}</span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PartnerPage;
