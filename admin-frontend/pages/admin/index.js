import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useSelector } from "react-redux"
import { selectUser } from "@/store/features/userSlice"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  MdPeople,
  MdGroups,
  MdEvent,
  MdTrendingUp,
  MdArrowForward,
  MdCalendarToday,
  MdPersonAdd,
  MdAddCircle,
  MdBarChart,
  MdRestaurant,
  MdLocalDining,
  MdKitchen,
  MdFoodBank,
  MdEmojiFoodBeverage,
  MdLocalCafe,
  MdDashboard,
  MdPendingActions,
  MdTrendingDown,
} from "react-icons/md"
import api from "@/utils/apiSetup"
import moment from "moment"
import { Card, CardContent, Box, Typography, Chip } from "@mui/material"
import {
  LineChart,
  Line,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts"

const AdminDashboard = () => {
  const router = useRouter()
  const user = useSelector(selectUser)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [statsData, setStatsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recentActivities, setRecentActivities] = useState([])
  const [recentLoading, setRecentLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  const quickActions = [
    {
      title: "Add User",
      icon: MdPersonAdd,
      color: "saffron",
      gradient: "from-orange-500 to-yellow-500",
      link: "/admin/people/add",
      description: "Register new members",
    },
    {
      title: "Create Community",
      icon: MdAddCircle,
      color: "emerald",
      gradient: "from-emerald-500 to-teal-500",
      link: "/admin/community/add",
      description: "Start new groups",
    },
    {
      title: "Schedule Session",
      icon: MdCalendarToday,
      color: "blue",
      gradient: "from-blue-500 to-indigo-500",
      link: "/admin/session/create",
      description: "Plan activities",
    },
    {
      title: "View Rewards",
      icon: MdBarChart,
      color: "rose",
      gradient: "from-rose-500 to-pink-500",
      link: "/admin/rewardManagement",
      description: "Analytics & insights",
    },
  ]

  const cookingIcons = [MdRestaurant, MdLocalDining, MdKitchen, MdFoodBank, MdEmojiFoodBeverage, MdLocalCafe]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  }

  
  const activityTypeMap = {
    user: {
      icon: MdPeople,
      color: "saffron",
      gradient: "from-orange-500 to-yellow-500",
    },
    expert: {
      icon: MdTrendingUp,
      color: "emerald",
      gradient: "from-emerald-500 to-teal-500",
    },
    community: {
      icon: MdGroups,
      color: "emerald",
      gradient: "from-emerald-500 to-teal-500",
    },
    session: {
      icon: MdEvent,
      color: "blue",
      gradient: "from-blue-500 to-indigo-500",
    },
    request: {
      icon: MdPendingActions,
      color: "rose",
      gradient: "from-rose-500 to-pink-500",
    },
    form: {
      icon: MdBarChart,
      color: "blue",
      gradient: "from-blue-500 to-indigo-500",
    },
    competition: {
      icon: MdDashboard,
      color: "saffron",
      gradient: "from-orange-500 to-yellow-500",
    },
  }

  
  const [chartData, setChartData] = useState({
    usersChart: [],
    communitiesChart: [],
    sessionsChart: [],
    requestsChart: [],
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      api
        .get("/analytics/dashboard")
        .then((res) => {
          const data = res.data
          setStatsData({
            "Total Users": {
              value: data.users.total,
              change: `${data.users.percentChange > 0 ? "+" : ""}${data.users.percentChange.toFixed(1)}%`,
              icon: MdPeople,
              color: "saffron",
              gradient: "from-orange-500 to-yellow-500",
              description: "Active community members",
              thisMonth: data.users.thisMonth,
              lastMonth: data.users.lastMonth,
              active: data.users.active,
              isPositive: data.users.percentChange > 0,
            },
            "Active Communities": {
              value: data.communities.total,
              change: `${data.communities.percentChange > 0 ? "+" : ""}${data.communities.percentChange.toFixed(1)}%`,
              icon: MdGroups,
              color: "emerald",
              gradient: "from-emerald-500 to-teal-500",
              description: "Thriving communities",
              thisMonth: data.communities.thisMonth,
              lastMonth: data.communities.lastMonth,
              active: data.communities.active,
              isPositive: data.communities.percentChange > 0,
            },
            "Active Sessions": {
              value: data.sessions.total,
              change: `${data.sessions.percentChange > 0 ? "+" : ""}${data.sessions.percentChange.toFixed(1)}%`,
              icon: MdEvent,
              color: "blue",
              gradient: "from-blue-500 to-indigo-500",
              description: "Ongoing activities",
              thisMonth: data.sessions.thisMonth,
              lastMonth: data.sessions.lastMonth,
              active: data.sessions.active,
              isPositive: data.sessions.percentChange > 0,
            },
            "Pending Requests": {
              value: data.requests.totalPending,
              change: `${data.requests.percentChange > 0 ? "+" : ""}${data.requests.percentChange.toFixed(1)}%`,
              icon: MdPendingActions,
              color: "rose",
              gradient: "from-rose-500 to-pink-500",
              description: "Awaiting approval",
              thisMonth: data.requests.thisMonth,
              lastMonth: data.requests.lastMonth,
              isPositive: data.requests.percentChange > 0,
            },
          })

          
          setChartData({
           
            usersChart: [
              { month: "Last Month", value: data.users.lastMonth, label: "Last Month" },
              { month: "This Month", value: data.users.thisMonth, label: "This Month" },
              { month: "Total", value: data.users.total, label: "Total Users" },
            ],
            
            communitiesChart: [
              { month: "Last Month", value: data.communities.lastMonth, label: "Last Month" },
              { month: "This Month", value: data.communities.thisMonth, label: "This Month" },
              { month: "Active", value: data.communities.active, label: "Active Now" },
            ],
           
            sessionsChart: [
              { name: "Active Sessions", value: data.sessions.active, fill: "#4caf50" },
              { name: "This Month", value: data.sessions.thisMonth, fill: "#2196f3" },
              { name: "Last Month", value: data.sessions.lastMonth, fill: "#ff9800" },
            ],
            
            requestsChart: [
              { month: "Last Month", value: data.requests.lastMonth, label: "Last Month" },
              { month: "This Month", value: data.requests.thisMonth, label: "This Month" },
              { month: "Pending", value: data.requests.totalPending, label: "Pending" },
            ],
          })
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [mounted])

  useEffect(() => {
    if (mounted) {
      api
        .get("/analytics/recent-activities?limit=10")
        .then((res) => {
          setRecentActivities(res.data.activities || [])
          setRecentLoading(false)
        })
        .catch(() => setRecentLoading(false))
    }
  }, [mounted])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
     
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {cookingIcons.map((Icon, index) => (
          <motion.div
            key={index}
            className="absolute text-gray-200 opacity-10"
            initial={{
              x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1200),
              y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 800),
              scale: Math.random() * 2 + 1,
            }}
            animate={{
              x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1200),
              y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 800),
              rotate: Math.random() * 360,
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
          >
            <Icon className="w-16 h-16" />
          </motion.div>
        ))}
      </div>

      
      <div className="flex-1 relative">
        
        <motion.div
          className="bg-white/90 backdrop-blur-md border-b border-gray-200"
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
                  <p className="text-sm text-gray-500">Welcome back, {user?.name || "Admin"}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="p-4 sm:p-6 lg:p-8">
          
          <motion.div className="mb-8" variants={containerVariants} initial="hidden" animate="visible">
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
                      <div
                        className={`p-4 rounded-lg bg-gradient-to-r ${action.gradient} flex items-center justify-center shadow-md`}
                      >
                        <action.icon className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex flex-col flex-1 ml-4">
                        <h3 className="text-lg m-0 font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
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

          
          <motion.div className="mb-8" variants={containerVariants} initial="hidden" animate="visible">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Analytics Overview</h2>
            {loading ? (
              <div className="col-span-4 text-center text-gray-400 py-20">Loading analytics...</div>
            ) : (
              <div className="space-y-8">
               
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -4 }}>
                    <Card
                      sx={{
                        background: "linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%)",
                        backdropFilter: "blur(10px)",
                        border: "2px solid transparent",
                        borderRadius: "16px",
                        transition: "all 0.3s ease",
                        minHeight: 380,
                        boxShadow: "0 8px 32px rgba(255, 152, 0, 0.1)",
                        "&:hover": {
                          borderColor: "#ff9800",
                          boxShadow: "0 12px 40px rgba(255, 152, 0, 0.2)",
                          transform: "translateY(-4px)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 4 }}>
                        
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: "12px",
                                background: "linear-gradient(135deg, #ff9800 0%, #ffc107 100%)",
                                boxShadow: "0 4px 16px rgba(255, 152, 0, 0.3)",
                              }}
                            >
                              <MdPeople style={{ fontSize: "28px", color: "white" }} />
                            </Box>
                            <Box>
                              <Typography variant="h6" fontWeight="bold" color="#ff9800">
                                Total Users
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Community Growth
                              </Typography>
                            </Box>
                          </Box>
                          <Box textAlign="right">
                            <Typography
                              variant="h3"
                              fontWeight="900"
                              sx={{
                                background: "linear-gradient(135deg, #ff9800 0%, #ffc107 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                              }}
                            >
                              {statsData["Total Users"].value}
                            </Typography>
                            <Chip
                              icon={statsData["Total Users"].isPositive ? <MdTrendingUp /> : <MdTrendingDown />}
                              label={statsData["Total Users"].change}
                              size="small"
                              sx={{
                                backgroundColor: statsData["Total Users"].isPositive ? "#e8f5e8" : "#ffebee",
                                color: statsData["Total Users"].isPositive ? "#4caf50" : "#f44336",
                                fontWeight: "bold",
                              }}
                            />
                          </Box>
                        </Box>
                        
                        <Box height={180} mb={2}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData.usersChart}>
                              <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "#666" }}
                              />
                              <YAxis hide />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#fff",
                                  border: "none",
                                  borderRadius: "12px",
                                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                                  fontSize: "14px",
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#ff9800"
                                strokeWidth={4}
                                dot={{ fill: "#ff9800", strokeWidth: 3, r: 6 }}
                                activeDot={{ r: 8, stroke: "#ff9800", strokeWidth: 2, fill: "#fff" }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                        
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Active Members
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="#ff9800">
                              {statsData["Total Users"].active}
                            </Typography>
                          </Box>
                          <Box textAlign="center">
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              This Month
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="#ff9800">
                              {statsData["Total Users"].thisMonth}
                            </Typography>
                          </Box>
                          <Box textAlign="right">
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Last Month
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="#ff9800">
                              {statsData["Total Users"].lastMonth}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>

                
                  <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -4 }}>
                    <Card
                      sx={{
                        background:
                          "linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(129, 199, 132, 0.05) 100%)",
                        backdropFilter: "blur(10px)",
                        border: "2px solid transparent",
                        borderRadius: "16px",
                        transition: "all 0.3s ease",
                        minHeight: 380,
                        boxShadow: "0 8px 32px rgba(76, 175, 80, 0.1)",
                        "&:hover": {
                          borderColor: "#4caf50",
                          boxShadow: "0 12px 40px rgba(76, 175, 80, 0.2)",
                          transform: "translateY(-4px)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 4 }}>
                        
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: "12px",
                                background: "linear-gradient(135deg, #4caf50 0%, #81c784 100%)",
                                boxShadow: "0 4px 16px rgba(76, 175, 80, 0.3)",
                              }}
                            >
                              <MdGroups style={{ fontSize: "28px", color: "white" }} />
                            </Box>
                            <Box>
                              <Typography variant="h6" fontWeight="bold" color="#4caf50">
                                Communities
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Active Groups
                              </Typography>
                            </Box>
                          </Box>
                          <Box textAlign="right">
                            <Typography
                              variant="h3"
                              fontWeight="900"
                              sx={{
                                background: "linear-gradient(135deg, #4caf50 0%, #81c784 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                              }}
                            >
                              {statsData["Active Communities"].value}
                            </Typography>
                            <Chip
                              icon={statsData["Active Communities"].isPositive ? <MdTrendingUp /> : <MdTrendingDown />}
                              label={statsData["Active Communities"].change}
                              size="small"
                              sx={{
                                backgroundColor: statsData["Active Communities"].isPositive ? "#e8f5e8" : "#ffebee",
                                color: statsData["Active Communities"].isPositive ? "#4caf50" : "#f44336",
                                fontWeight: "bold",
                              }}
                            />
                          </Box>
                        </Box>
                        
                        <Box height={180} mb={2}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData.communitiesChart}>
                              <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "#666" }}
                              />
                              <YAxis hide />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#fff",
                                  border: "none",
                                  borderRadius: "12px",
                                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                                  fontSize: "14px",
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#4caf50"
                                fill="url(#communityGradient)"
                                strokeWidth={3}
                              />
                              <defs>
                                <linearGradient id="communityGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#4caf50" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#4caf50" stopOpacity={0.05} />
                                </linearGradient>
                              </defs>
                            </AreaChart>
                          </ResponsiveContainer>
                        </Box>
                        
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Active Now
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="#4caf50">
                              {statsData["Active Communities"].active}
                            </Typography>
                          </Box>
                          <Box textAlign="center">
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              This Month
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="#4caf50">
                              {statsData["Active Communities"].thisMonth}
                            </Typography>
                          </Box>
                          <Box textAlign="right">
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Last Month
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="#4caf50">
                              {statsData["Active Communities"].lastMonth}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>

                  
                  <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -4 }}>
                    <Card
                      sx={{
                        background:
                          "linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(100, 181, 246, 0.05) 100%)",
                        backdropFilter: "blur(10px)",
                        border: "2px solid transparent",
                        borderRadius: "16px",
                        transition: "all 0.3s ease",
                        minHeight: 380,
                        boxShadow: "0 8px 32px rgba(33, 150, 243, 0.1)",
                        "&:hover": {
                          borderColor: "#2196f3",
                          boxShadow: "0 12px 40px rgba(33, 150, 243, 0.2)",
                          transform: "translateY(-4px)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 4 }}>
                       
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: "12px",
                                background: "linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)",
                                boxShadow: "0 4px 16px rgba(33, 150, 243, 0.3)",
                              }}
                            >
                              <MdEvent style={{ fontSize: "28px", color: "white" }} />
                            </Box>
                            <Box>
                              <Typography variant="h6" fontWeight="bold" color="#2196f3">
                                Sessions
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Activity Status
                              </Typography>
                            </Box>
                          </Box>
                          <Box textAlign="right">
                            <Typography
                              variant="h3"
                              fontWeight="900"
                              sx={{
                                background: "linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                              }}
                            >
                              {statsData["Active Sessions"].value}
                            </Typography>
                            <Chip
                              icon={statsData["Active Sessions"].isPositive ? <MdTrendingUp /> : <MdTrendingDown />}
                              label={statsData["Active Sessions"].change}
                              size="small"
                              sx={{
                                backgroundColor: statsData["Active Sessions"].isPositive ? "#e8f5e8" : "#ffebee",
                                color: statsData["Active Sessions"].isPositive ? "#4caf50" : "#f44336",
                                fontWeight: "bold",
                              }}
                            />
                          </Box>
                        </Box>
                        
                        <Box height={180} mb={2} display="flex" justifyContent="center" alignItems="center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData.sessionsChart}
                                cx="50%"
                                cy="50%"
                                outerRadius={70}
                                innerRadius={30}
                                dataKey="value"
                              >
                                {chartData.sessionsChart.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#fff",
                                  border: "none",
                                  borderRadius: "12px",
                                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                                  fontSize: "14px",
                                }}
                              />
                              <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ fontSize: "12px" }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                        
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Active Now
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="#2196f3">
                              {statsData["Active Sessions"].active}
                            </Typography>
                          </Box>
                          <Box textAlign="center">
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              This Month
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="#2196f3">
                              {statsData["Active Sessions"].thisMonth}
                            </Typography>
                          </Box>
                          <Box textAlign="right">
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Last Month
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="#2196f3">
                              {statsData["Active Sessions"].lastMonth}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  <motion.div variants={itemVariants} whileHover={{ scale: 1.01, y: -2 }}>
                    <Card
                      sx={{
                        background:
                          "linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(239, 154, 154, 0.05) 100%)",
                        backdropFilter: "blur(10px)",
                        border: "2px solid transparent",
                        borderRadius: "16px",
                        transition: "all 0.3s ease",
                        minHeight: 380,
                        boxShadow: "0 8px 32px rgba(244, 67, 54, 0.1)",
                        "&:hover": {
                          borderColor: "#f44336",
                          boxShadow: "0 12px 40px rgba(244, 67, 54, 0.2)",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 4 }}>
                        
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: "12px",
                                background: "linear-gradient(135deg, #f44336 0%, #ef9a9a 100%)",
                                boxShadow: "0 4px 16px rgba(244, 67, 54, 0.3)",
                              }}
                            >
                              <MdPendingActions style={{ fontSize: "28px", color: "white" }} />
                            </Box>
                            <Box>
                              <Typography variant="h6" fontWeight="bold" color="#f44336">
                                Pending Requests
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Awaiting Approval
                              </Typography>
                            </Box>
                          </Box>
                          <Box textAlign="right">
                            <Typography
                              variant="h3"
                              fontWeight="900"
                              sx={{
                                background: "linear-gradient(135deg, #f44336 0%, #ef9a9a 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                              }}
                            >
                              {statsData["Pending Requests"].value}
                            </Typography>
                            <Chip
                              icon={statsData["Pending Requests"].isPositive ? <MdTrendingUp /> : <MdTrendingDown />}
                              label={statsData["Pending Requests"].change}
                              size="small"
                              sx={{
                                backgroundColor: statsData["Pending Requests"].isPositive ? "#e8f5e8" : "#ffebee",
                                color: statsData["Pending Requests"].isPositive ? "#4caf50" : "#f44336",
                                fontWeight: "bold",
                              }}
                            />
                          </Box>
                        </Box>
                        
                        <Box height={150} mb={2}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.requestsChart}>
                              <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "#666" }}
                              />
                              <YAxis hide />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#fff",
                                  border: "none",
                                  borderRadius: "12px",
                                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                                  fontSize: "14px",
                                }}
                              />
                              <Bar dataKey="value" fill="url(#requestGradient)" radius={[8, 8, 0, 0]} />
                              <defs>
                                <linearGradient id="requestGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#f44336" stopOpacity={0.8} />
                                  <stop offset="95%" stopColor="#f44336" stopOpacity={0.4} />
                                </linearGradient>
                              </defs>
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                        
                        <Box display="flex" justifyContent="space-around" alignItems="center">
                          <Box textAlign="center">
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Pending Now
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="#f44336">
                              {statsData["Pending Requests"].value}
                            </Typography>
                          </Box>
                          <Box textAlign="center">
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              This Month
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="#f44336">
                              {statsData["Pending Requests"].thisMonth}
                            </Typography>
                          </Box>
                          <Box textAlign="center">
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Last Month
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="#f44336">
                              {statsData["Pending Requests"].lastMonth}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>

                  
                  <motion.div
                    variants={itemVariants}
                    className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-6 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {recentLoading ? (
                        <div className="text-center text-gray-400">Loading...</div>
                      ) : recentActivities.length === 0 ? (
                        <div className="text-center text-gray-400">No recent activities</div>
                      ) : (
                        recentActivities.map((activity, idx) => {
                          const typeMeta = activityTypeMap[activity.type] || activityTypeMap.user
                          const Icon = typeMeta.icon
                          return (
                            <motion.div
                              key={idx}
                              whileHover={{ x: 6 }}
                              className="flex items-center px-2 py-1 hover:bg-gray-50 rounded-lg transition-colors group shadow-sm bg-white/80 border border-gray-100 min-h-[38px]"
                              style={{ fontSize: "0.92rem" }}
                            >
                              <div
                                className={`p-2 rounded-md bg-gradient-to-r ${typeMeta.gradient} flex items-center justify-center shadow mr-2`}
                              >
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className="truncate text-gray-800 font-medium group-hover:text-orange-600 transition-colors"
                                  style={{ fontSize: "0.97rem" }}
                                >
                                  {activity.title}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">{moment(activity.timestamp).fromNow()}</p>
                              </div>
                            </motion.div>
                          )
                        })
                      )}
                    </div>
                  </motion.div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      
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
                <h2 className="text-xl font-bold text-orange-600">Menu</h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-500 hover:text-orange-500"
                >
                  <MdArrowForward className="h-6 w-6" />
                </motion.button>
              </div>
              <nav className="space-y-4">
                {quickActions.map((action, index) => (
                  <motion.div key={index} whileHover={{ x: 10 }}>
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
  )
}

export default AdminDashboard
















