"use client"

import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { selectAllSessions } from "@/store/features/sessionSlice"
import { useSelector } from "react-redux"
import { useEffect, useState, useRef } from "react"
import api from "@/utils/apiSetup"
import appConfig from "@/config/appConfig"
import AnimatedButton from "@/components/common/AnimatedButton"
import { 
  FaUsers, 
  FaGraduationCap, 
  FaVideo, 
  FaUserGraduate,
  FaArrowRight,
  FaNetworkWired,
  FaComments,
  FaCertificate,
  FaMobileAlt,
  FaLaptop,
  FaCheckCircle,
  FaPlay,
  FaRocket
} from 'react-icons/fa'
import { SiGoogleplay, SiAppstore } from 'react-icons/si'

// Real-time animated counter component
const AnimatedCounter = ({ value, duration = 2, suffix = "+" }) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime = null
    const startValue = displayValue
    const endValue = value
    const difference = endValue - startValue

    const animate = (currentTime) => {
      if (startTime === null) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / (duration * 1000), 1)
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const current = Math.floor(startValue + difference * easeOutQuart)
      
      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return (
    <span>
      {displayValue}
      {suffix}
    </span>
  )
}

// Live indicator component
const LiveIndicator = () => {
  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="w-2 h-2 bg-red-500 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <span className="text-xs font-semibold text-red-600">LIVE</span>
    </motion.div>
  )
}

// Feature card component with advanced design
const FeatureCard = ({ icon: Icon, title, description, delay = 0, gradient = "from-orange-500 to-orange-600" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -10, scale: 1.02 }}
      viewport={{ once: true }}
      className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden"
    >
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-bl-full"></div>
      
      <div className="relative z-10">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
          <Icon className="text-white text-2xl" />
        </div>
        <h3 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-orange-600 transition-colors">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}

// Step card component
const StepCard = ({ number, title, description, icon: Icon, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all border-2 border-transparent hover:border-orange-400 group"
    >
      <div className="absolute -top-6 left-8 w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-xl z-10">
        {number}
      </div>
      <div className="mt-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
          <Icon className="text-white text-2xl" />
        </div>
      </div>
      <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </motion.div>
  )
}

// Stat card component
const StatCard = ({ icon: Icon, value, label, delay = 0, color = "orange" }) => {
  const colorClasses = {
    orange: "from-orange-500 to-orange-600",
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600"
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.05, y: -5 }}
      viewport={{ once: true }}
      className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all text-center border border-gray-100 group"
    >
      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
        <Icon className="text-white text-3xl" />
      </div>
      <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">{value}</div>
      <div className="text-gray-600 font-medium">{label}</div>
    </motion.div>
  )
}

const Landing = () => {
  const targetRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.5, 0])

  const sessions = useSelector(selectAllSessions)
  const [community, setCommunity] = useState([])
  const [dashboardData, setDashboardData] = useState({
    communities: { total: 0 },
    sessions: { total: 0 },
    experts: { total: 0 },
    users: { total: 0 }
  })

  // Real-time data fetching with public APIs only
  useEffect(() => {
    let mounted = true

    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/dashboard/stats/public')
        if (mounted && res.data) {
          setDashboardData(res.data)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        if (mounted) {
          setDashboardData({
            communities: { total: 50 },
            sessions: { total: 150 },
            experts: { total: 200 },
            users: { total: 5000 }
          })
        }
      }
    }

    const fetchCommunities = async () => {
      try {
        const res = await api.get('/community/public')
        if (mounted && res.data?.success && res.data?.communities) {
          setCommunity(res.data.communities.slice(0, 3))
        }
      } catch (error) {
        console.error('Error fetching communities:', error)
        if (mounted) {
          setCommunity([])
        }
      }
    }

    fetchDashboardData()
    fetchCommunities()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Advanced Textures and Lines */}
      <section ref={targetRef} className="relative min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 overflow-hidden">
        {/* Animated Background Pattern with Lines */}
        <motion.div style={{ y, opacity }} className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-100"></div>
        </motion.div>

        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        {/* Diagonal Lines Texture */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(0,0,0,0.1) 10px,
              rgba(0,0,0,0.1) 20px
            )`
          }}></div>
        </div>

        {/* Animated Geometric Shapes */}
        <motion.div
          className="absolute top-20 right-10 w-72 h-72 bg-orange-200 rounded-full blur-3xl opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 left-10 w-96 h-96 bg-orange-300 rounded-full blur-3xl opacity-15"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Decorative Lines */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
            <motion.path
              d="M0,200 Q300,100 600,200 T1200,200"
              stroke="rgba(251, 146, 60, 0.1)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 3, ease: "easeInOut" }}
            />
            <motion.path
              d="M0,400 Q300,300 600,400 T1200,400"
              stroke="rgba(251, 146, 60, 0.08)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 4, ease: "easeInOut", delay: 0.5 }}
            />
            <motion.path
              d="M0,600 Q300,500 600,600 T1200,600"
              stroke="rgba(251, 146, 60, 0.06)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 5, ease: "easeInOut", delay: 1 }}
            />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between min-h-screen px-4 md:px-20 max-w-7xl mx-auto pt-20">
          {/* Left Content */}
          <div className="md:w-1/2 space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.2,
                ease: [0, 0.71, 0.2, 1.01]
              }}
              className="px-4 py-2 rounded-full bg-orange-50 backdrop-blur-md border border-orange-200 mb-6 inline-flex items-center gap-3 shadow-sm"
            >
              <LiveIndicator />
              <span className="text-sm font-semibold text-orange-700">
                Join <AnimatedCounter value={dashboardData.experts?.total || 200} /> Expert Instructors
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 text-gray-900"
            >
              Connect, Learn & Grow with{" "}
              <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                IFCA
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-700 max-w-lg leading-relaxed mb-8"
            >
              India's Premier Platform for Culinary & Hospitality Professionals
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap gap-4"
            >
              <AnimatedButton
                href="/onBoard"
                variant="primary"
                size="lg"
                className="font-bold px-8 py-4 text-lg shadow-xl hover:shadow-2xl"
              >
                Get Started Free
                <FaArrowRight className="inline-block ml-2" />
              </AnimatedButton>
              <AnimatedButton
                href="/communities"
                variant="outline"
                size="lg"
                className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-bold px-8 py-4 text-lg"
              >
                Explore Communities
              </AnimatedButton>
            </motion.div>
          </div>

          {/* Right Content - Hero Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="md:w-1/2 mt-12 md:mt-0"
          >
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/chef1.png"
                alt="IFCA Platform"
                width={600}
                height={600}
                className="w-full h-auto rounded-3xl shadow-2xl"
                priority
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Section 1: Statistics */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, gray 1px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard
              icon={FaUsers}
              value={<AnimatedCounter value={dashboardData.users?.total || 5000} />}
              label="Active Members"
              delay={0.1}
              color="blue"
            />
            <StatCard
              icon={FaGraduationCap}
              value={<AnimatedCounter value={dashboardData.experts?.total || 200} />}
              label="Expert Instructors"
              delay={0.2}
              color="orange"
            />
            <StatCard
              icon={FaVideo}
              value={<AnimatedCounter value={dashboardData.sessions?.total || 150} />}
              label="Live Sessions"
              delay={0.3}
              color="green"
            />
            <StatCard
              icon={FaNetworkWired}
              value={<AnimatedCounter value={dashboardData.communities?.total || 50} />}
              label="Communities"
              delay={0.4}
              color="purple"
            />
          </div>
        </div>
      </section>

      {/* Section 2: Platform Features */}
      <section className="py-20 px-4 bg-white relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.1) 2px,
              rgba(0,0,0,0.1) 4px
            )`
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Everything You Need in One Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools and features for your culinary journey - from communities and live sessions to expert guidance
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={FaNetworkWired}
              title="Communities"
              description="Join specialized communities, connect with peers, and participate in discussions. Build your professional network in the culinary world."
              delay={0.1}
              gradient="from-orange-500 to-orange-600"
            />
            <FeatureCard
              icon={FaVideo}
              title="Live Video Sessions"
              description="Browse and enroll in live interactive sessions with expert instructors. Attend real-time workshops, masterclasses, Q&A sessions, and courses. Learn directly from industry professionals through scheduled video sessions."
              delay={0.2}
              gradient="from-orange-500 to-orange-600"
            />
            <FeatureCard
              icon={FaGraduationCap}
              title="Expert Instructors"
              description="Learn from industry-leading chefs and culinary experts. Get personalized guidance and mentorship from the best in the field."
              delay={0.3}
              gradient="from-green-500 to-green-600"
            />
            <FeatureCard
              icon={FaComments}
              title="Real-time Chat"
              description="Engage in live conversations during sessions. Ask questions, share insights, and collaborate with fellow members in real-time."
              delay={0.4}
              gradient="from-purple-500 to-purple-600"
            />
            <FeatureCard
              icon={FaPlay}
              title="Huddle Activities"
              description="Participate in interactive activities including quizzes, debates, discussions, and AI-powered learning experiences within communities."
              delay={0.5}
              gradient="from-red-500 to-red-600"
            />
            <FeatureCard
              icon={FaRocket}
              title="Unified Platform"
              description="Access everything in one place - communities, sessions, experts, and activities. A comprehensive platform designed for culinary professionals to learn, network, and grow their careers seamlessly."
              delay={0.6}
              gradient="from-indigo-500 to-indigo-600"
            />
          </div>
        </div>
      </section>

      {/* Section 3: How It Works */}
      <section className="py-20 px-4 bg-gradient-to-br from-orange-50 via-white to-orange-100 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, orange 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in just a few simple steps
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <StepCard
              number={1}
              title="Create Account"
              description="Sign up for free and create your professional profile. Set your interests and expertise areas."
              icon={FaUserGraduate}
              delay={0.1}
            />
            <StepCard
              number={2}
              title="Join Communities"
              description="Explore and join communities that match your interests. Connect with like-minded professionals."
              icon={FaNetworkWired}
              delay={0.2}
            />
            <StepCard
              number={3}
              title="Enroll in Sessions"
              description="Browse upcoming live sessions and courses. Register for sessions taught by expert instructors."
              icon={FaVideo}
              delay={0.3}
            />
            <StepCard
              number={4}
              title="Learn & Network"
              description="Attend sessions, participate in activities, earn certificates, and build your professional network."
              icon={FaCertificate}
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* Section 4: Community Flow */}
      <section className="py-20 px-4 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 mb-6">
                <FaNetworkWired className="text-orange-600 text-xl" />
                <span className="text-sm font-semibold text-orange-700">Community Experience</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                Join Communities & Connect
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Discover and join communities that match your interests. Connect with culinary professionals, participate in discussions, attend live sessions, and grow your network.
              </p>
              <div className="space-y-4">
                {[
                  "Explore diverse culinary communities",
                  "Join communities based on your interests",
                  "Participate in community discussions",
                  "Attend scheduled huddle sessions",
                  "Connect with experts and peers"
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3"
                  >
                    <FaCheckCircle className="text-green-500 text-xl mt-1 flex-shrink-0" />
                    <span className="text-gray-700 text-lg">{feature}</span>
                  </motion.div>
                ))}
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                viewport={{ once: true }}
                className="mt-8"
              >
                <AnimatedButton
                  href="/communities"
                  variant="primary"
                  size="lg"
                  className="font-bold"
                >
                  Explore Communities
                  <FaArrowRight className="inline-block ml-2" />
                </AnimatedButton>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-orange-300 rounded-3xl blur-3xl opacity-20"></div>
              <div className="relative bg-gradient-to-br from-orange-50 to-white rounded-3xl p-12 shadow-2xl border border-orange-100">
                <FaNetworkWired className="text-8xl text-orange-500 mx-auto mb-6" />
                <div className="space-y-4">
                  {[
                    { step: "1", title: "Browse Communities", desc: "Discover communities by category" },
                    { step: "2", title: "Join & Subscribe", desc: "Become a member instantly" },
                    { step: "3", title: "Participate", desc: "Attend sessions & activities" },
                    { step: "4", title: "Network", desc: "Connect with members & experts" }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                      viewport={{ once: true }}
                      className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                          {item.step}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-800 block">{item.title}</span>
                          <span className="text-sm text-gray-600">{item.desc}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 5: Technology & Accessibility */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-purple-300 rounded-3xl blur-3xl opacity-20"></div>
              <div className="relative">
                <Image
                  src="/second1.png"
                  alt="Technology"
                  width={600}
                  height={600}
                  className="rounded-3xl shadow-2xl w-full h-auto"
                />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                Access Anytime, Anywhere
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Our platform works seamlessly across all devices. Learn on your desktop, tablet, or mobile phone with the same great experience.
              </p>
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <FaLaptop className="text-4xl text-orange-600 mb-3" />
                  <h3 className="font-bold text-gray-900 mb-2">Desktop</h3>
                  <p className="text-gray-600 text-sm">Full-featured experience</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <FaMobileAlt className="text-4xl text-orange-600 mb-3" />
                  <h3 className="font-bold text-gray-900 mb-2">Mobile</h3>
                  <p className="text-gray-600 text-sm">Learn on the go</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  "HD video quality for all sessions",
                  "Real-time chat and collaboration",
                  "Interactive learning activities",
                  "Secure and encrypted platform",
                  "Offline access to materials"
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3"
                  >
                    <FaCheckCircle className="text-green-500 text-xl mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 6: CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-orange-50 via-white to-orange-100 relative overflow-hidden border-t border-orange-200">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, gray 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              Ready to Start Your Culinary Journey?
            </h2>
            <p className="text-xl md:text-2xl text-gray-700 mb-10 max-w-3xl mx-auto">
              Join thousands of culinary professionals growing their careers with IFCA
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <AnimatedButton
                href="/onBoard"
                variant="primary"
                size="lg"
                className="px-8 py-4 font-bold text-lg shadow-xl hover:shadow-2xl"
              >
                Get Started Free
                <FaArrowRight className="inline-block ml-2" />
              </AnimatedButton>
              <AnimatedButton
                href="/communities"
                variant="outline"
                size="lg"
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-bold text-lg"
              >
                Explore Communities
              </AnimatedButton>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Landing
