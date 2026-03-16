import ClassSchedule from "@/components/classSchedule";
import Footer from "@/components/footer";
import Topbar from "@/components/topbar/Topbar";
import Head from "next/head";
import GroupsIcon from "@mui/icons-material/Groups";
import WifiIcon from "@mui/icons-material/Wifi";
import ScheduleIcon from "@mui/icons-material/Schedule";
import LanguageIcon from "@mui/icons-material/Language";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import StarIcon from "@mui/icons-material/Star";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SchoolIcon from "@mui/icons-material/School";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import { useSelector } from "react-redux";
import {
  selectCommunity,
  selectCommunitySessions,
  selectCommunityUsers,
  setCommunityById,
  setCommunitySessions,
  setCommunityUsers,
} from "@/store/features/communitySlice";
import moment from "moment";
import { useDispatch } from "react-redux";
import { useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/router";
import { selectUserCommunities, selectUser } from "@/store/features/userSlice";
import { setSessions } from "@/store/features/sessionSlice";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/apiSetup";

export default function CommunityDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);

  const dispatch = useDispatch();
  
  const userCommunitiesIds = useSelector(selectUserCommunities)?.map((item) => item.id);
  const communitySessions = useSelector(selectCommunitySessions);
  const communityUsers = useSelector(selectCommunityUsers);
  const currentCommunity = useSelector(selectCommunity);
  const user = useSelector(selectUser);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  // Move all useEffect hooks to the top level
  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderSticky(window.scrollY > 600); // Increased threshold to prevent hiding topbar
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Empty dependency array since we only want to set up the listener once

  // First useEffect to fetch community data
  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          dispatch(setCommunitySessions(id)),
          dispatch(setCommunityUsers(id)),
          dispatch(setCommunityById(id)),
          dispatch(setSessions())
        ]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Check if user is already a member (old logic)
  useEffect(() => {
    if (!userCommunitiesIds || !id) return;

    const communityId = parseInt(id);
    if (userCommunitiesIds.includes(communityId)) {
      router.replace(`/comHome/${communityId}`);
    }
  }, [userCommunitiesIds, id, router]);

  // Check subscription status for button display only
  useEffect(() => {
    if (!user || !user.id || !id) return;

    const checkButtonStatus = async () => {
      try {
        // Check if user is already subscribed using the new API
        const subscriptionResponse = await api.get(`/user/${user.id}/community/${id}/subscribed`);
        setIsSubscribed(!!subscriptionResponse.data.subscribed);
        
        // Check if they have a pending request
        const requestResponse = await api.get(`/user/${user.id}/community/${id}/requested`);
        setIsRequested(!!requestResponse.data.requested);
        
      } catch (err) {
        console.error('Error checking subscription status:', err);
        setIsSubscribed(false);
        setIsRequested(false);
      }
    };

    checkButtonStatus();
  }, [user, id]);

  // Handle case where API shows subscribed but not in Redux store
  useEffect(() => {
    if (isSubscribed && userCommunitiesIds && !userCommunitiesIds.includes(parseInt(id))) {
      // User is subscribed according to API but not in Redux store
      // This might happen if Redux store is not updated yet
      // We can either navigate them or wait for Redux to update
      router.replace(`/comHome/${id}`);
    }
  }, [isSubscribed, userCommunitiesIds, id, router]);

  // Join handler
  const handleJoin = async () => {
    setJoinLoading(true);
    try {
      await api.post(`/community/${id}/subscriptions`, {
        userId: user.unifiedUser.id,
        action: 'subscribe',
      });
      setIsRequested(true);
    } catch (err) {
      // Optionally show error
    }
    setJoinLoading(false);
  };

  // Loading state
  if (loading || !userCommunitiesIds || !currentCommunity) {
    return (
      <>
        <Head>
          <title>Loading... | IFCA</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center">
          <div className="text-center px-6">
            {/* Clean loading animation */}
            <div className="relative mb-8">
              {/* Main loading circle */}
              <div className="w-20 h-20 mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full animate-pulse"></div>
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                  <GroupsIcon className="text-orange-500 text-2xl animate-bounce" />
                </div>
                {/* Rotating border */}
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 animate-spin"></div>
              </div>
            </div>
            
            {/* Loading text */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-gray-800">Loading Community</h2>
              <p className="text-gray-600 text-sm">Preparing your community experience</p>
              
              {/* Simple progress dots */}
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const getImageUrl = () => {
    if (imageError) return "/tablaImgClass.svg";
    return currentCommunity?.bannerImg || currentCommunity?.infoImgs?.[0] || "/tablaImgClass.svg";
  };

  return (
    <>
      <Head>
        <title>{currentCommunity?.title || 'Community Details'} | IFCA</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div className="font-['Inter'] bg-gradient-to-br from-gray-50 via-white to-orange-50 min-h-screen">
        <header>
          <Topbar />
        </header>

        {/* Hero Section */}
        <div className="relative mt-16 overflow-hidden">
          {/* Background Image */}
          <div className={`absolute inset-0 bg-gradient-to-r from-orange-200 to-orange-300 `}>
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
          
          {/* Background Line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"></div>
          
          {/* Hero Content */}
          <div className="relative z-10 container mx-auto px-4 md:px-8 py-16 md:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left side - Text content */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="max-w-2xl"
              >
                <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="px-3 py-1 bg-orange-200 backdrop-blur-sm rounded-full border border-orange-500/30">
                      <span className="text-orang-600 font-semibold text-[12px]">Community</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <GroupsIcon className="text-[14px]" />
                      <span className="font-medium text-[14px]">{communityUsers?.length || 0} members</span>
                    </div>
                  </div>
                  {/* Status Badge */}
                  {isRequested && !isSubscribed && (
                    <span className="bg-yellow-400 text-yellow-900 text-xs sm:text-sm font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full whitespace-nowrap flex-shrink-0 shadow-md">
                      Request Pending
                    </span>
                  )}
                  {isSubscribed && (
                    <span className="bg-green-500 text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full whitespace-nowrap flex-shrink-0 shadow-md">
                      Member
                    </span>
                  )}
                  {!isRequested && !isSubscribed && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs sm:text-sm font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full whitespace-nowrap flex-shrink-0 shadow-md">
                      Not a Member
                    </span>
                  )}
                </div>
                
                <h1 className="text-[32px] md:text-[40px] font-bold text-white mb-6 leading-tight">
                  {currentCommunity?.title}
                </h1>
                
                <p className="text-[16px] md:text-[18px] text-white/90 mb-8 leading-relaxed">
                  {currentCommunity?.desc}
                </p>
                
                <div className="flex flex-wrap items-center gap-6 text-white/80">
                  <div className="flex items-center gap-2">
                    <CalendarTodayIcon className="text-orange-400 text-[14px]" />
                    <span className="text-[14px]">Updated {moment(currentCommunity?.updatedAt).format("MMM YYYY")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LanguageIcon className="text-orange-400 text-[14px]" />
                    <span className="text-[14px]">English</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AccessTimeIcon className="text-orange-400 text-[14px]" />
                    <span className="text-[14px]">Flexible Schedule</span>
                  </div>
                </div>
              </motion.div>

              {/* Right side - Community Image */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="relative p-4"
              >
                <div className="relative h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={getImageUrl()}
                    alt={currentCommunity?.title}
                    className="w-full h-full object-contain bg-white"
                    onError={() => setImageError(true)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Sticky Header */}
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: isHeaderSticky ? 0 : -100 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-16 left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg z-40 border-b border-gray-100 transform ${
            isHeaderSticky ? 'translate-y-0' : '-translate-y-full'
          }`}
          style={{ 
            transform: isHeaderSticky ? 'translateY(0)' : 'translateY(-100%)',
            top: '64px' // Ensure it's below the topbar
          }}
        >
          <div className="container mx-auto px-4 md:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h2 className="text-[16px] font-bold text-gray-900 truncate">{currentCommunity?.title}</h2>
                <div className="flex items-center gap-4 text-[12px] text-gray-600 mt-1">
                  <span className="flex items-center gap-1">
                    <GroupsIcon className="text-orange-500 text-[12px]" />
                    {communityUsers?.length || 0} members
                  </span>
                </div>
              </div>
              <motion.button
                whileHover={!isRequested && !isSubscribed ? { scale: 1.02 } : {}}
                whileTap={!isRequested && !isSubscribed ? { scale: 0.98 } : {}}
                className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-[14px] transition-all duration-200 shadow-lg flex items-center gap-2 ${
                  isSubscribed 
                    ? 'bg-orange-500 text-white cursor-default' 
                    : isRequested 
                      ? 'bg-yellow-400 text-yellow-900 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-orange-500/25'
                }`}
                onClick={() => {
                  if (!isSubscribed && !isRequested) {
                    router.push(`/communitySub/${id}`);
                  }
                }}
                disabled={isSubscribed || isRequested}
              >
                {isSubscribed ? (
                  '✓ Joined'
                ) : isRequested ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Request Pending
                  </>
                ) : (
                  'Join Now'
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="container mx-auto px-4 md:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* What You'll Learn Section */}
              <motion.section
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
              >
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <SchoolIcon className="text-white text-xl" />
                    </div>
                    <h2 className="text-[24px] font-bold text-gray-900">What you'll learn</h2>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {[
                      "Access to communities with like-minded peers",
                      "Learn at your own pace, 100% online",
                      "Connect with professors and peers",
                      "Broaden your learning experience",
                      "Get personalized feedback and guidance",
                      "Build a strong professional network"
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200/50"
                      >
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-[12px] font-bold">✓</span>
                        </div>
                        <p className="text-[14px] text-gray-700 font-medium">{item}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.section>

              {/* Course Schedule Section */}
              {communitySessions?.length > 0 && (
                <motion.section
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                >
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <CalendarTodayIcon className="text-white text-xl" />
                      </div>
                      <h2 className="text-[24px] font-bold text-gray-900">Course Schedule</h2>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="p-6 rounded-xl bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200/50">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                            <CalendarTodayIcon className="text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-[14px] text-gray-900">Start Date</p>
                            <p className="text-orange-600 font-medium text-[14px]">
                              {communitySessions?.length > 0
                                ? moment(communitySessions[0].SessionSlot[0].startTime).format("MMM DD, YYYY")
                                : "---"}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6 rounded-xl bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200/50">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                            <WorkspacePremiumIcon className="text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-[14px] text-gray-900">End Date</p>
                            <p className="text-orange-600 font-medium text-[14px]">
                              {communitySessions.length > 0
                                ? moment(communitySessions[0].SessionSlot[
                                  communitySessions[0].SessionSlot.length - 1
                                ].endTime).format("MMM DD, YYYY")
                                : "---"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* Session Schedule Section */}
              {communitySessions?.length > 0 && (
                <motion.section
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                >
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <ScheduleIcon className="text-white text-xl" />
                      </div>
                      <h2 className="text-[24px] font-bold text-gray-900">Session Schedule</h2>
                    </div>
                    
                    <ClassSchedule
                      sessionSlots={communitySessions[0]?.SessionSlot}
                      isExclusive={true}
                      isButtonOnly={false}
                      communityId={id}
                    />
                  </div>
                </motion.section>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-32">
                <motion.div
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
                >
                  {/* Content */}
                  <div className="p-6">
                    {/* Join Button */}
                    {!isSubscribed && (
                      <div className="mb-6">
                        {isRequested ? (
                          <button
                            className="w-full py-4 rounded-xl font-semibold text-base sm:text-[16px] bg-yellow-400 text-yellow-900 cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                            disabled
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Request Pending
                          </button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 rounded-xl font-semibold text-base sm:text-[16px] bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 transition-all duration-200"
                            onClick={() => router.push(`/communitySub/${id}`)}
                            disabled={joinLoading}
                          >
                            {joinLoading ? (
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Joining...
                              </div>
                            ) : (
                              'Join Community'
                            )}
                          </motion.button>
                        )}
                      </div>
                    )}

                    {/* Community Features */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-[18px] text-gray-900 mb-4">This community includes:</h3>
                      
                      {[
                        { icon: WifiIcon, text: "100% online learning" },
                        { icon: GroupsIcon, text: `${communityUsers?.length || 0} active members` },
                        { icon: ScheduleIcon, text: "Flexible schedule" },
                        { icon: LanguageIcon, text: "English language" },
                        { icon: SchoolIcon, text: "Expert guidance" }
                      ].map((feature, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                            <feature.icon className="text-white" />
                          </div>
                          <p className="text-[14px] text-gray-700 font-medium">{feature.text}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Community Stats */}
                    <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200/50">
                      <div className="grid grid-cols-1 gap-4 text-center">
                        <div>
                          <p className="text-[24px] font-bold text-orange-600">{communityUsers?.length || 0}</p>
                          <p className="text-[12px] text-gray-600">Members</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        <footer>
          <Footer />
        </footer>
      </div>
    </>
  );
}
