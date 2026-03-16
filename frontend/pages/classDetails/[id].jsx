import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Head from "next/head";
import Topbar from "@/components/topbar/Topbar";
import Footer from "@/components/footer";
import CourseList from "@/components/courseList";
import { useRouter } from "next/router";
import moment from "moment";
import axios from "axios";
import { toast } from "react-hot-toast";
import PersonIcon from "@mui/icons-material/Person";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  VideoCameraIcon,
  MapPinIcon,
  BookOpenIcon,
  CheckCircleIcon,
  PlayIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  StarIcon,
  AcademicCapIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

import {
  selectAllSessions,
  setSessions,
  selectSession,
  setSelectedSessionById,
  selectAllCompletedSessions,
} from "@/store/features/sessionSlice";
import { 
  selectUserSessions, 
  checkUserSubscribedToSession,
  selectSessionSubscriptionStatus,
  selectUser,
  checkUserSubscribedToCommunity
} from "@/store/features/userSlice";
import api from "@/utils/apiSetup";

const ClassDetails = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showJoinCommunityModal, setShowJoinCommunityModal] = useState(false);
  const [isCommunitySubscribed, setIsCommunitySubscribed] = useState(false);
  const [isCommunityRequested, setIsCommunityRequested] = useState(false);
  const [registeredUsersCount, setRegisteredUsersCount] = useState(0);
  const [isLoadingCommunityStatus, setIsLoadingCommunityStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [communityData, setCommunityData] = useState(null);
  const [showSuccessBlast, setShowSuccessBlast] = useState(false);
  const [timeUntilSession, setTimeUntilSession] = useState(null);
  const router = useRouter();
  const { id } = router.query;
  const sessionId = id ? parseInt(id) : null;

  const dispatch = useDispatch();
  const selectedSession = useSelector(selectSession);
  const sessions = useSelector(selectAllSessions);
  const completedSessions = useSelector(selectAllCompletedSessions);
  const user = useSelector(selectUser);
  const sessionSubscriptionStatus = useSelector(selectSessionSubscriptionStatus);

  useEffect(() => {
    dispatch(setSessions());
  }, [dispatch]);

  useEffect(() => {
    if (sessionId) {
      dispatch(setSelectedSessionById(sessionId));
      setLoading(false);
    }
  }, [sessionId, dispatch]);

  useEffect(() => {
         if (sessionId && user?.id) {
       dispatch(checkUserSubscribedToSession({ userId: user.unifiedUserId || user.id, sessionId }));
     }
  }, [sessionId, user?.id, dispatch]);

  // Fetch community data
  useEffect(() => {
    const fetchCommunityData = async () => {
      let sessionData = sessions?.find(item => item?.id === sessionId);
      if (!sessionData) {
        sessionData = completedSessions?.find(item => item?.id === sessionId);
      }
      if (selectedSession && selectedSession.id === sessionId) {
        sessionData = selectedSession;
      }
      
      if (sessionData?.communityId) {
        try {
          const response = await api.get(`/community/${sessionData.communityId}`);
          setCommunityData(response.data?.community || response.data);
        } catch (error) {
          console.error("Error fetching community data:", error);
        }
      }
    };

    if (sessionId) {
      fetchCommunityData();
    }
  }, [sessionId, sessions, completedSessions, selectedSession]);

  // Check community subscription status
  useEffect(() => {
    const checkCommunityStatus = async () => {
      if (!user?.id || !sessionId) return;
      
      let sessionData = sessions?.find(item => item?.id === sessionId);
      if (!sessionData) {
        sessionData = completedSessions?.find(item => item?.id === sessionId);
      }
      if (selectedSession && selectedSession.id === sessionId) {
        sessionData = selectedSession;
      }
      
      if (!sessionData?.communityId) return;
      
      setIsLoadingCommunityStatus(true);
      try {
        const subscriptionResponse = await axios.get(`/api/v1/user/${user.unifiedUserId || user.id}/community/${sessionData.communityId}/subscribed`);
        setIsCommunitySubscribed(subscriptionResponse.data.subscribed);
        
        const requestResponse = await axios.get(`/api/v1/user/${user.unifiedUserId || user.id}/community/${sessionData.communityId}/requested`);
        setIsCommunityRequested(requestResponse.data.requested);
      } catch (error) {
        console.error("Error checking community status:", error);
        setIsCommunitySubscribed(false);
        setIsCommunityRequested(false);
      } finally {
        setIsLoadingCommunityStatus(false);
      }
    };

    checkCommunityStatus();
  }, [user?.id, sessionId, sessions, completedSessions, selectedSession]);

  // Get registered users count
  useEffect(() => {
    const getRegisteredUsersCount = async () => {
      if (!sessionId) return;
      
      try {
        const response = await axios.get(`/api/v1/analytics/session/${sessionId}/people/num`);
        setRegisteredUsersCount(response.data.numPeople?._count?.userId || 0);
      } catch (error) {
        console.error("Error getting registered users count:", error);
        setRegisteredUsersCount(0);
      }
    };

    getRegisteredUsersCount();
  }, [sessionId]);

  useEffect(() => {
    if (router.isReady && id) {
      const newSessionId = parseInt(id);
      if (newSessionId && newSessionId !== sessionId) {
        dispatch(setSelectedSessionById(newSessionId));
                 if (user?.id) {
           dispatch(checkUserSubscribedToSession({ userId: user.unifiedUserId || user.id, sessionId: newSessionId }));
         }
      }
    }
  }, [router.isReady, id, sessionId, user?.id, dispatch]);

  let currentSession = sessions?.filter(
    (item) => item?.id === sessionId
  )[0];

  if (!currentSession) {
    currentSession = completedSessions?.filter(
      (item) => item?.id === sessionId
    )[0];
  }

  if (selectedSession && selectedSession.id === sessionId) {
    currentSession = selectedSession;
  }

  const preSessionContent = currentSession?.resource?.filter((res) => res.isPreSession) || [];
  const postSessionContent = currentSession?.resource?.filter((res) => res.isPostSession) || [];

  const isUserSubscribed = sessionSubscriptionStatus?.subscribed || false;
  const userSessions = useSelector(selectUserSessions)?.sessions?.filter(
    (item) => item?.id === currentSession?.id
  );
  const isUser = isUserSubscribed || userSessions?.length > 0;
  const isExclusive = currentSession?.isExclusive;

  // Handle community joining
  const handleJoinCommunity = () => {
    if (currentSession?.communityId) {
      setShowJoinCommunityModal(true);
    } else {
      toast.error("Community information not available");
    }
  };

  // Handle view community page
  const handleViewCommunityPage = () => {
    setShowJoinCommunityModal(false);
    router.push(`/comHome/${currentSession.communityId}`);
  };

  // Handle join community from modal
  const handleJoinCommunityFromModal = () => {
    setShowJoinCommunityModal(false);
    router.push(`/communitySub/${currentSession.communityId}`);
  };

  // Handle session registration
  const handleRegisterForSession = async () => {
    if (!user) {
      toast.error("Please login to register for this session");
      router.push("/auth");
      return;
    }

    setIsRegistering(true);
    try {
             const response = await axios.post(`/api/v1/user/${user.id}/sessions`, {
         sessionId: currentSession.id,
         price: currentSession.SessionSlot?.[0]?.price || 0
       });

      if (response.status === 201) {
        setShowSuccessBlast(true);
        toast.success("🎉 Successfully enrolled in course!", {
          duration: 4000,
        });
                 dispatch(checkUserSubscribedToSession({ userId: user.id, sessionId: currentSession.id }));
        setShowRegistrationModal(false);
        const countResponse = await axios.get(`/api/v1/analytics/session/${currentSession.id}/people/num`);
        setRegisteredUsersCount(countResponse.data.numPeople?._count?.userId || 0);
        
        // Hide success blast after 4 seconds
        setTimeout(() => {
          setShowSuccessBlast(false);
        }, 4000);
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.response?.data?.message || "Failed to register for session");
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle joining 100ms session
  const handleJoinSession = async () => {
    try {
      const tokenResponse = await api.get("/session/token");
      const management_Token = tokenResponse.data.token;

      const response = await axios.post(
        `https://api.100ms.live/v2/room-codes/room/${currentSession?.roomId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${management_Token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      const guestCode = response.data.data.find(item => item.role === 'guest');
      
      if (guestCode) {
        const redirectUrl = `https://aluminaries.app.100ms.live/meeting/${guestCode.code}`;
        if (typeof window !== "undefined") {
          window.open(redirectUrl, "_blank");
          toast.success(`Joining session as ${user?.name}`);
        }
      } else {
        toast.error("Failed to join session. Please try again.");
      }
    } catch (error) {
      console.error("Error joining session:", error);
      toast.error("Failed to join session. Please try again.");
    }
  };
  
  // Check if session is completed
  const isSessionCompleted = () => {
    if (!currentSession?.SessionSlot || currentSession.SessionSlot.length === 0) {
      return false;
    }
    // Check if all session slots have ended
    const now = moment();
    const allSlotsCompleted = currentSession.SessionSlot.every(slot => 
      moment(slot.endTime).isBefore(now)
    );
    return allSlotsCompleted;
  };

  // Determine what button to show
  const getActionButton = () => {
    // Check if session is completed first
    if (isSessionCompleted()) {
      return {
        type: 'completed',
        text: 'Session Completed',
        onClick: null,
        disabled: true
      };
    }

    if (!user) {
      return {
        type: 'login',
        text: 'Login to Enroll',
        onClick: () => router.push("/auth")
      };
    }

    if (currentSession?.communityId && !isCommunitySubscribed) {
      if (isCommunityRequested) {
        return {
          type: 'requested_community',
          text: 'Request Pending',
          onClick: null,
          disabled: true
        };
      }
      
      return {
        type: 'join_community',
        text: 'Join Community',
        onClick: handleJoinCommunity
      };
    }

    if (!isUserSubscribed) {
      return {
        type: 'register_session',
        text: 'Enroll Now',
        onClick: () => setShowRegistrationModal(true)
      };
    }

    if (isUserSubscribed && currentSession?.roomId) {
      return {
        type: 'join_session',
        text: 'Join Session',
        onClick: handleJoinSession
      };
    }

    return {
      type: 'registered',
      text: 'Enrolled',
      onClick: null,
      disabled: true
    };
  };

  const actionButton = getActionButton();

  // Get session image with fallback
  const getSessionImage = () => {
    return currentSession?.bannerImgs?.[0] || 
           currentSession?.infoImgs?.[0] || 
           communityData?.bannerImg ||
           "/default-session.jpg";
  };

  // Get speaker info
  const getSpeakerInfo = () => {
    const speaker = currentSession?.SessionSlot?.[0]?.speakers?.[0];
    return {
      name: speaker?.name || speaker?.speakerName || currentSession?.creator?.name || 'Instructor',
      photoURL: speaker?.photoURL || speaker?.photoUrl || currentSession?.creator?.photoURL || currentSession?.creator?.photoUrl
    };
  };

  const speakerInfo = getSpeakerInfo();

  // Calculate total duration
  const getTotalDuration = () => {
    if (!currentSession?.SessionSlot?.length) return 0;
    const firstSlot = currentSession.SessionSlot[0];
    const lastSlot = currentSession.SessionSlot[currentSession.SessionSlot.length - 1];
    return Math.round(moment.duration(
      moment(lastSlot.endTime).diff(moment(firstSlot.startTime))
    ).asHours() * 10) / 10;
  };

  // Get next upcoming session slot
  const getNextUpcomingSession = () => {
    if (!currentSession?.SessionSlot?.length) return null;
    const now = moment();
    const upcomingSlots = currentSession.SessionSlot.filter(slot => 
      moment(slot.startTime).isAfter(now)
    );
    if (upcomingSlots.length === 0) return null;
    return upcomingSlots.sort((a, b) => 
      moment(a.startTime).diff(moment(b.startTime))
    )[0];
  };

  // Countdown timer effect
  useEffect(() => {
    const nextSession = getNextUpcomingSession();
    if (!nextSession) {
      setTimeUntilSession(null);
      return;
    }

    const updateTimer = () => {
      const now = moment();
      const startTime = moment(nextSession.startTime);
      const diff = startTime.diff(now);

      if (diff <= 0) {
        setTimeUntilSession(null);
        return;
      }

      const duration = moment.duration(diff);
      const days = Math.floor(duration.asDays());
      const hours = duration.hours();
      const minutes = duration.minutes();
      const seconds = duration.seconds();

      setTimeUntilSession({
        days: String(days).padStart(2, '0'),
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0')
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [currentSession?.SessionSlot]);

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading... - IFCA</title>
        </Head>
        <header>
          <Topbar />
        </header>
        <main className="min-h-screen bg-white mt-[72px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading course details...</p>
          </div>
        </main>
      </>
    );
  }

  if (!currentSession) {
    return (
      <>
        <Head>
          <title>Session Not Found - IFCA</title>
        </Head>
        <header>
          <Topbar />
        </header>
        <main className="min-h-screen bg-white mt-[72px] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Not Found</h1>
            <p className="text-gray-600 mb-4">The session you're looking for doesn't exist.</p>
                <button
              onClick={() => router.push('/allSessions')}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
              Browse All Sessions
                </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{currentSession?.title || "Course Details"} - IFCA</title>
        <meta name="description" content={currentSession?.desc || "Join this amazing course"} />
      </Head>
      
      <header>
        <Topbar />
      </header>
      
      <main className="min-h-screen bg-white mt-[72px]">
        {/* Top Banner - Udemy Style */}
        <div className="bg-gray-900 text-white py-4 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-4">
                <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-white hover:text-orange-400 transition-colors group"
              >
                <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Back</span>
                </button>
              <span className="text-gray-500">•</span>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-orange-400 font-medium">{currentSession?.title}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400">Course Details</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Udemy Layout */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
                         {/* Left Column - Main Content */}
            <div className="flex-1 space-y-8">
              
              {/* Course Title Section */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {currentSession?.title}
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  {currentSession?.desc}
                </p>
                       </div>

              {/* Instructor Section */}
              <div className="border-t border-b border-gray-200 py-6">
                <div className="flex items-center gap-4">
                  {speakerInfo.photoURL ? (
                    <img 
                      src={speakerInfo.photoURL}
                      alt={speakerInfo.name}
                      className="w-16 h-16 rounded-full object-cover"
                             onError={(e) => {
                               e.target.style.display = 'none';
                        if (e.target.nextElementSibling) {
                          e.target.nextElementSibling.style.display = 'flex';
                        }
                             }}
                           />
                  ) : null}
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xl font-bold ${speakerInfo.photoURL ? 'hidden' : 'flex'}`}>
                    {speakerInfo.name.charAt(0).toUpperCase()}
                           </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Instructor</p>
                    <p className="text-lg font-semibold text-gray-900">{speakerInfo.name}</p>
                         </div>
                       </div>
                      </div>

              {/* Course Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                      <ClockIcon className="w-6 h-6 text-white" />
                      </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide">Duration</p>
                      <p className="text-lg font-bold text-gray-900">{getTotalDuration()}h</p>
                    </div>
                  </div>
                  </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                      <VideoCameraIcon className="w-6 h-6 text-white" />
                </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide">Sessions</p>
                      <p className="text-lg font-bold text-gray-900">{currentSession?.SessionSlot?.length || 0}</p>
              </div>
                </div>
                     </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                       <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                      <UserGroupIcon className="w-6 h-6 text-white" />
                         </div>
                         <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide">Registered</p>
                      <p className="text-lg font-bold text-gray-900">
                        {registeredUsersCount} / {currentSession?.SessionSlot?.[0]?.participantLimit || '∞'}
                           </p>
                         </div>
                       </div>
                     </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                       <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                      <BookOpenIcon className="w-6 h-6 text-white" />
                         </div>
                         <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide">Resources</p>
                      <p className="text-lg font-bold text-gray-900">{currentSession?.resource?.length || 0}</p>
                         </div>
                       </div>
                     </div>
                   </div>

              {/* Community Request Pending */}
              {currentSession?.communityId && isCommunityRequested && !isCommunitySubscribed && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ClockIcon className="w-6 h-6 text-white" />
                 </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Community Request Pending
                      </h3>
                      <p className="text-gray-700 text-sm leading-relaxed mb-3">
                        Your request to join the community is under review. You'll be able to enroll once approved.
                      </p>
                      <div className="flex items-center gap-2 text-orange-600 text-sm">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        <span>Request submitted on {moment().format('MMM DD, YYYY')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Course Content Section */}
              {(currentSession?.isCourse || currentSession?.isVideoChannel) && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                    <h2 className="text-xl font-bold text-gray-900">Course Content</h2>
                  </div>
                 <div className="p-6">
                    <CourseList
                      sessionSlots={currentSession?.SessionSlot}
                      isCourse={currentSession?.isCourse}
                      isExclusive={isExclusive}
                      isUser={isUserSubscribed}
                    />
                     </div>
                   </div>
              )}

              {/* Curriculum Section - Udemy Style */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                  <h2 className="text-xl font-bold text-gray-900">Course Curriculum</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentSession?.SessionSlot?.length || 0} sessions • {getTotalDuration()} total hours
                  </p>
                </div>
                <div className="divide-y divide-gray-200">
                     {currentSession?.SessionSlot?.length > 0 ? (
                       currentSession.SessionSlot.map((slot, index) => {
                         const startTime = moment(slot.startTime);
                         const endTime = moment(slot.endTime);
                         const duration = moment.duration(endTime.diff(startTime));
                         const isUpcoming = moment().isBefore(startTime);
                         const isCompleted = moment().isAfter(endTime);
                         
                         return (
                           <div 
                             key={slot.id}
                          className="px-6 py-4 hover:bg-gray-50 transition-colors"
                           >
                               <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mt-1">
                              <span className="text-sm font-semibold text-orange-600">{index + 1}</span>
                                   </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-gray-900 mb-1">
                                     {slot.topicName || `Session ${index + 1}`}
                                   </h3>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="w-4 h-4" />
                                  <span>{startTime.format('MMM DD, YYYY')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ClockIcon className="w-4 h-4" />
                                     <span>{startTime.format('hh:mm A')} - {endTime.format('hh:mm A')}</span>
                                   </div>
                                <div className="flex items-center gap-1">
                                  <ClockIcon className="w-4 h-4" />
                                  <span>{Math.round(duration.asHours() * 10) / 10}h</span>
                                 </div>
                                <div className="flex items-center gap-1">
                                  {slot.isOnline ? (
                                    <VideoCameraIcon className="w-4 h-4" />
                                  ) : (
                                    <MapPinIcon className="w-4 h-4" />
                                  )}
                                  <span>{slot.isOnline ? 'Online' : slot.location || 'In-Person'}</span>
                               </div>
                              </div>
                              {slot.speakers?.[0] && (
                                <p className="text-sm text-gray-500">
                                  Instructor: {slot.speakers[0].name || slot.speakers[0].speakerName}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              {isUpcoming ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                  Upcoming
                                     </span>
                              ) : isCompleted ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                  Completed
                                     </span>
                                   ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                  Available
                                     </span>
                                   )}
                               </div>
                             </div>
                           </div>
                         );
                       })
                     ) : (
                    <div className="px-6 py-12 text-center">
                      <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No curriculum available for this course.</p>
                       </div>
                     )}
                   </div>
                     </div>

                                   {/* Resources Section */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                  <h2 className="text-xl font-bold text-gray-900">Course Resources</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Access materials, downloads, and additional resources
                  </p>
                </div>
                 <div className="p-6">
                     {!isUserSubscribed && (
                    <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-orange-700 font-medium text-sm">
                           {currentSession?.communityId && !isCommunitySubscribed 
                          ? 'Join the community to access course resources'
                          : 'Enroll in this course to access all resources'
                           }
                         </p>
                       </div>
                     )}
                     
                     {currentSession?.resource?.length > 0 ? (
                    <div className="space-y-6">
                         {preSessionContent.length > 0 && (
                           <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <ArrowRightIcon className="w-5 h-5 text-orange-500" />
                            Pre-Course Resources
                          </h3>
                             <div className="grid gap-3">
                               {preSessionContent.map((item, index) => (
                                 <div
                                   key={index}
                                className={`p-4 border-2 rounded-lg transition-all ${
                                     isUserSubscribed 
                                    ? 'border-gray-200 hover:border-orange-300 hover:bg-orange-50' 
                                       : 'border-gray-100 bg-gray-50'
                                   }`}
                                 >
                                <h4 className="text-base font-semibold text-gray-900 mb-2">{item.name}</h4>
                                   {isUserSubscribed ? (
                                     <a
                                       href={item.link}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                    className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-2 group"
                                  >
                                    <span>Download Resource</span>
                                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                     </a>
                                   ) : (
                                     <span className="text-sm text-gray-500">
                                    Enroll to access
                                     </span>
                                   )}
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}

                         {currentSession?.SessionSlot?.length > 0 && 
                          moment().isAfter(moment(currentSession.SessionSlot[currentSession.SessionSlot.length - 1].endTime)) && 
                          postSessionContent.length > 0 && (
                           <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <ArrowRightIcon className="w-5 h-5 text-orange-500" />
                            Post-Course Resources
                          </h3>
                             <div className="grid gap-3">
                               {postSessionContent.map((item, index) => (
                                 <div
                                   key={index}
                                className={`p-4 border-2 rounded-lg transition-all ${
                                     isUserSubscribed 
                                    ? 'border-gray-200 hover:border-orange-300 hover:bg-orange-50' 
                                       : 'border-gray-100 bg-gray-50'
                                   }`}
                                 >
                                <h4 className="text-base font-semibold text-gray-900 mb-2">{item.name}</h4>
                                   {isUserSubscribed ? (
                                     <a
                                       href={item.link}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                    className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-2 group"
                                  >
                                    <span>Download Resource</span>
                                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                     </a>
                                   ) : (
                                     <span className="text-sm text-gray-500">
                                    Enroll to access
                                     </span>
                                   )}
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}

                         {currentSession?.resource?.filter(res => !res.isPreSession && !res.isPostSession).length > 0 && (
                           <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <BookOpenIcon className="w-5 h-5 text-orange-500" />
                            Course Materials
                          </h3>
                             <div className="grid gap-3">
                               {currentSession?.resource?.filter(res => !res.isPreSession && !res.isPostSession).map((item, index) => (
                                 <div
                                   key={index}
                                className={`p-4 border-2 rounded-lg transition-all ${
                                     isUserSubscribed 
                                    ? 'border-gray-200 hover:border-orange-300 hover:bg-orange-50' 
                                       : 'border-gray-100 bg-gray-50'
                                   }`}
                                 >
                                <h4 className="text-base font-semibold text-gray-900 mb-2">{item.name}</h4>
                                   {isUserSubscribed ? (
                                     <a
                                       href={item.link}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                    className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-2 group"
                                  >
                                    <span>Download Resource</span>
                                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                     </a>
                                   ) : (
                                     <span className="text-sm text-gray-500">
                                    Enroll to access
                                     </span>
                                   )}
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}
                       </div>
                     ) : (
                    <div className="text-center py-12">
                      <BookOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No resources available for this course.</p>
                       </div>
                     )}
                   </div>
                 </div>
               </div>

            {/* Right Column - Sticky Sidebar - Udemy Style */}
            <div className="w-full lg:w-96 flex-shrink-0">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* Course Image */}
                <div className="relative rounded-lg overflow-hidden border border-gray-200 shadow-lg bg-gray-50">
                  <img
                    src={getSessionImage()}
                    alt={currentSession?.title}
                    className="w-full h-64 object-contain p-2"
                    onError={(e) => {
                      e.target.src = "/default-session.jpg";
                    }}
                  />
                </div>

                {/* Price & Enroll Card */}
                <div className="border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  <div className="p-6 bg-white">
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-gray-900">
                          ₹{currentSession?.SessionSlot?.[0]?.price || 0}
                         </span>
                        {currentSession?.SessionSlot?.[0]?.price > 0 && (
                          <span className="text-sm text-gray-500 line-through">₹{Math.round((currentSession?.SessionSlot?.[0]?.price || 0) * 1.5)}</span>
                        )}
                       </div>
                      {currentSession?.SessionSlot?.[0]?.price === 0 && (
                        <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-sm font-semibold rounded-full">
                          FREE
                        </span>
                      )}
                     </div>

                    {/* Action Button */}
                    <div className="space-y-3">
                      {actionButton.type === 'login' && (
                        <button
                          onClick={actionButton.onClick}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg text-base transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          {actionButton.text}
                        </button>
                      )}
                      
                      {actionButton.type === 'join_community' && (
                        <button
                          onClick={actionButton.onClick}
                          disabled={isLoadingCommunityStatus}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg text-base transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isLoadingCommunityStatus ? (
                            <>
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Checking...
                            </>
                          ) : (
                            actionButton.text
                          )}
                        </button>
                      )}
                      
                      {actionButton.type === 'requested_community' && (
                        <button
                          disabled={actionButton.disabled}
                          className="w-full bg-orange-300 text-white font-bold py-4 px-6 rounded-lg text-base cursor-not-allowed"
                        >
                          ⏳ {actionButton.text}
                        </button>
                      )}
                      
                      {actionButton.type === 'register_session' && (
                        <button
                          onClick={actionButton.onClick}
                          disabled={isRegistering}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg text-base transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isRegistering ? (
                            <>
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                     </svg>
                              Enrolling...
                            </>
                          ) : (
                            actionButton.text
                          )}
                        </button>
                      )}
                      
                      {actionButton.type === 'join_session' && (
                        <div className="space-y-3">
                          {timeUntilSession && (
                            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                              <p className="text-xs text-gray-600 uppercase tracking-wide text-center mb-2">Session starts in</p>
                              <div className="flex items-center justify-center gap-2">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-orange-600">{timeUntilSession.days}</div>
                                  <div className="text-xs text-gray-500">Days</div>
                               </div>
                                <span className="text-xl font-bold text-orange-600">:</span>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-orange-600">{timeUntilSession.hours}</div>
                                  <div className="text-xs text-gray-500">Hours</div>
                               </div>
                                <span className="text-xl font-bold text-orange-600">:</span>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-orange-600">{timeUntilSession.minutes}</div>
                                  <div className="text-xs text-gray-500">Minutes</div>
                               </div>
                                <span className="text-xl font-bold text-orange-600">:</span>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-orange-600">{timeUntilSession.seconds}</div>
                                  <div className="text-xs text-gray-500">Seconds</div>
                     </div>
                   </div>
                 </div>
               )}
                          <button
                            onClick={actionButton.onClick}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg text-base transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                          >
                            <PlayIcon className="w-5 h-5" />
                            {actionButton.text}
                          </button>
            </div>
                      )}
                      
                      {actionButton.type === 'registered' && (
                        <button
                          disabled={actionButton.disabled}
                          className="w-full bg-gray-400 text-white font-bold py-4 px-6 rounded-lg text-base cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                          {actionButton.text}
                        </button>
                      )}
                      
                      {actionButton.type === 'completed' && (
                        <div className="w-full bg-gray-100 border-2 border-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-lg text-base flex items-center justify-center gap-2">
                          <CheckCircleIcon className="w-5 h-5 text-gray-600" />
                          {actionButton.text}
                                  </div>
                      )}
                                </div>
                                
                    {/* Course Includes */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">This course includes:</h3>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2">
                          <CheckCircleIcon className="w-5 h-5 text-orange-500 flex-shrink-0" />
                          <span>{currentSession?.SessionSlot?.length || 0} on-demand sessions</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircleIcon className="w-5 h-5 text-orange-500 flex-shrink-0" />
                          <span>{getTotalDuration()} hours of content</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircleIcon className="w-5 h-5 text-orange-500 flex-shrink-0" />
                          <span>{currentSession?.resource?.length || 0} downloadable resources</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircleIcon className="w-5 h-5 text-orange-500 flex-shrink-0" />
                          <span>Full lifetime access</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircleIcon className="w-5 h-5 text-orange-500 flex-shrink-0" />
                          <span>Certificate of completion</span>
                        </li>
                      </ul>
                                </div>
                              </div>
                            </div>

                {/* Community Card */}
                {communityData && (
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                        <UserGroupIcon className="w-6 h-6 text-white" />
                          </div>
                      <h3 className="text-lg font-bold text-gray-900">Community</h3>
                    </div>
                    <h4 className="text-base font-semibold text-gray-900 mb-2">{communityData.title}</h4>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{communityData.desc}</p>
                    <button
                      onClick={() => router.push(`/comHome/${currentSession.communityId}`)}
                      className="w-full py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <span>View Community</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Registration Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Enroll in Course</h3>
              <p className="text-gray-600 mb-6">
                Join "{currentSession?.title}" and get access to all resources and sessions.
              </p>
              
              <div className="space-y-3 mb-6">
                                 {currentSession?.communityId && !isCommunitySubscribed && (
                  <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                    <p className="text-orange-700 text-sm mb-2 font-medium">
                      ⚠️ This course requires community membership.
                     </p>
                     <button
                      onClick={() => router.push(`/comHome/${currentSession.communityId}`)}
                      className="text-orange-800 underline text-sm hover:text-orange-900 font-medium"
                     >
                       Click here to join the community
                     </button>
                   </div>
                 )}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600 font-medium">Course Price</span>
                  <span className="text-xl font-bold text-gray-900">
                    ₹{currentSession?.SessionSlot?.[0]?.price || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600 font-medium">Sessions</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {currentSession?.SessionSlot?.length || 0} sessions
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600 font-medium">Registered</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {registeredUsersCount} / {currentSession?.SessionSlot?.[0]?.participantLimit || '∞'} enrolled
                  </span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRegistrationModal(false)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={currentSession?.communityId && !isCommunitySubscribed 
                    ? () => router.push(`/comHome/${currentSession.communityId}`)
                    : handleRegisterForSession
                  }
                  disabled={isRegistering}
                  className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  {isRegistering ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enrolling...
                    </>
                  ) : (
                    <>
                      {currentSession?.communityId && !isCommunitySubscribed 
                     ? 'Join Community First' 
                        : 'Enroll Now'
                  }
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
             )}

       {/* Join Community Modal */}
       {showJoinCommunityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
             <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserGroupIcon className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Join Community</h3>
               <p className="text-gray-600 mb-6">
                This course requires community membership. Choose an option below.
               </p>
               
               <div className="space-y-3">
                 <button
                   onClick={handleViewCommunityPage}
                  className="w-full py-3 px-4 rounded-lg border-2 border-orange-200 text-orange-600 font-semibold hover:bg-orange-50 transition-all duration-200 flex items-center justify-center gap-3"
                 >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                   </svg>
                   View Community Page
                 </button>

                 <button
                   onClick={handleJoinCommunityFromModal}
                  className="w-full py-3 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-3"
                 >
                  <UserGroupIcon className="w-5 h-5" />
                   Join Community
                 </button>
               </div>

              <div className="mt-6">
                 <button
                   onClick={() => setShowJoinCommunityModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                 >
                   Cancel
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

      {/* Success Blast Animation */}
      <AnimatePresence>
        {showSuccessBlast && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] pointer-events-none flex items-center justify-center"
          >
            {/* Confetti Particles */}
            {[...Array(50)].map((_, i) => {
              const colors = ['#f97316', '#fb923c', '#fdba74', '#ffedd5', '#fff7ed'];
              const color = colors[Math.floor(Math.random() * colors.length)];
              const left = Math.random() * 100;
              const delay = Math.random() * 0.5;
              const duration = 2 + Math.random() * 1;
              
              return (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: color,
                    left: `${left}%`,
                    top: '50%',
                  }}
                  initial={{
                    y: 0,
                    x: 0,
                    opacity: 1,
                    scale: 1,
                  }}
                  animate={{
                    y: [0, -Math.random() * 500 - 200],
                    x: [0, (Math.random() - 0.5) * 400],
                    opacity: [1, 1, 0],
                    scale: [1, 1.2, 0.5],
                    rotate: [0, Math.random() * 360],
                  }}
                  transition={{
                    duration: duration,
                    delay: delay,
                    ease: "easeOut",
                  }}
                />
              );
            })}

            {/* Success Message Card */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md mx-4 border-4 border-orange-500 relative z-10 pointer-events-auto"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircleIcon className="w-12 h-12 text-white" />
              </motion.div>
              
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4"
              >
                🎉 Success!
              </motion.h2>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-gray-700 text-center mb-2"
              >
                You've successfully enrolled in
              </motion.p>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xl font-semibold text-orange-600 text-center mb-6"
              >
                {currentSession?.title}
              </motion.p>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <CheckCircleIcon className="w-5 h-5 text-orange-500" />
                  <span>Full access to all sessions</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <CheckCircleIcon className="w-5 h-5 text-orange-500" />
                  <span>Downloadable resources</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <CheckCircleIcon className="w-5 h-5 text-orange-500" />
                  <span>Certificate of completion</span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

       <footer>
         <Footer />
       </footer>
     </>
   );
 };

export default ClassDetails;
