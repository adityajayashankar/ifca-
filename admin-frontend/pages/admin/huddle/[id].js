import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "@/utils/apiSetup";
import { MdHome, MdChevronRight, MdGroups, MdPerson, MdCalendarToday, MdLocationOn, MdAccessTime, MdRefresh, MdPeople, MdDescription, MdEvent, MdEdit, MdDelete, MdQuiz, MdVideoLibrary, MdChat, MdPoll, MdEmojiEvents, MdRecordVoiceOver, MdLightbulb, MdSchool, MdAutoStories, MdCampaign, MdSlideshow, MdOpenInNew, MdPlayArrow } from "react-icons/md";
import { toast } from "react-toastify";
import Head from "next/head";

function HuddleDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [huddle, setHuddle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [loadingDelete, setLoadingDelete] = useState(false);

  useEffect(() => {
    if (id) {
      fetchHuddleDetails();
    }
  }, [id]);

  // Refresh huddle details when router query changes (e.g., after edit)
  useEffect(() => {
    if (id && router.isReady) {
      fetchHuddleDetails();
    }
  }, [router.isReady]);

  const fetchHuddleDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/huddle/${id}`);
      if (response.data && response.data.success) {
        console.log('Huddle data:', response.data.huddle);
        console.log('Activities:', response.data.huddle?.activities);
        console.log('Selected Activities:', response.data.huddle?.selectedActivities);
        setHuddle(response.data.huddle);
      } else {
        toast.error('Failed to load huddle details');
        // Only navigate if not already on the target page
        const targetPath = '/admin/huddle';
        if (router.asPath.split('?')[0] !== targetPath) {
          router.push(targetPath);
        }
      }
    } catch (error) {
      console.error('Error fetching huddle:', error);
      toast.error('Failed to load huddle details');
      // Only navigate if not already on the target page
      const targetPath = '/admin/huddle';
      if (router.asPath.split('?')[0] !== targetPath) {
        router.push(targetPath);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteClick = () => {
    setDeleteInput('');
    setShowDeleteModal(true);
  };

  const confirmDeleteHuddle = async () => {
    if (deleteInput !== huddle.title) {
      toast.error('Huddle name does not match');
      return;
    }

    try {
      setLoadingDelete(true);
      const response = await api.delete(`/huddle/${id}`);
      if (response.data && response.data.success) {
        toast.success('Huddle deleted successfully');
        // Only navigate if not already on the target page
        const targetPath = '/admin/huddle';
        if (router.asPath.split('?')[0] !== targetPath) {
          router.push(targetPath);
        }
      } else {
        toast.error(response.data?.message || 'Failed to delete huddle');
      }
    } catch (error) {
      console.error('Error deleting huddle:', error);
      toast.error(error.response?.data?.message || 'Failed to delete huddle');
    } finally {
      setLoadingDelete(false);
      setShowDeleteModal(false);
      setDeleteInput('');
    }
  };

  const getStatusBadge = () => {
    if (huddle?.isLive) {
      return (
        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-green-500 text-white animate-pulse">
          <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
          LIVE
        </span>
      );
    }
    if (huddle?.isScheduled) {
      return (
        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-orange-500 text-white">
          UPCOMING
        </span>
      );
    }
    if (huddle?.endTime) {
      return (
        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gray-500 text-white">
          COMPLETED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-yellow-500 text-white">
        DRAFT
      </span>
    );
  };

  const getActivityIcon = (activityType) => {
    const iconMap = {
      'AI_SLIDESHOW': MdSlideshow,
      'AI_VIDEO_MESSAGE': MdVideoLibrary,
      'DISCUSSION_TOPIC': MdChat,
      'QUIZ': MdQuiz,
      'DEBATE': MdRecordVoiceOver,
      'CONTEST': MdEmojiEvents,
      'VOTING_SURVEY': MdPoll,
      'REFLECTION': MdLightbulb,
      'GUIDED_SESSION': MdSchool,
      'STORY_SPOTLIGHT': MdAutoStories,
      'ANNOUNCEMENT': MdCampaign,
    };
    return iconMap[activityType] || MdEvent;
  };

  const getActivityColor = (activityType) => {
    const colorMap = {
      'AI_SLIDESHOW': 'bg-gradient-to-br from-purple-500 to-purple-600',
      'AI_VIDEO_MESSAGE': 'bg-gradient-to-br from-blue-500 to-blue-600',
      'DISCUSSION_TOPIC': 'bg-gradient-to-br from-green-500 to-green-600',
      'QUIZ': 'bg-gradient-to-br from-yellow-500 to-yellow-600',
      'DEBATE': 'bg-gradient-to-br from-red-500 to-red-600',
      'CONTEST': 'bg-gradient-to-br from-pink-500 to-pink-600',
      'VOTING_SURVEY': 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      'REFLECTION': 'bg-gradient-to-br from-orange-500 to-orange-600',
      'GUIDED_SESSION': 'bg-gradient-to-br from-teal-500 to-teal-600',
      'STORY_SPOTLIGHT': 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      'ANNOUNCEMENT': 'bg-gradient-to-br from-gray-500 to-gray-600',
    };
    return colorMap[activityType] || 'bg-gradient-to-br from-gray-400 to-gray-500';
  };

  const formatActivityName = (activityType) => {
    const nameMap = {
      'AI_SLIDESHOW': 'AI Slideshow',
      'AI_VIDEO_MESSAGE': 'AI Video Message',
      'DISCUSSION_TOPIC': 'Discussion Topic',
      'QUIZ': 'Quiz',
      'DEBATE': 'Debate',
      'CONTEST': 'Contest',
      'VOTING_SURVEY': 'Voting & Survey',
      'REFLECTION': 'Reflection',
      'GUIDED_SESSION': 'Guided Session',
      'STORY_SPOTLIGHT': 'Story Spotlight',
      'ANNOUNCEMENT': 'Announcement',
    };
    return nameMap[activityType] || activityType?.replace(/_/g, ' ');
  };

  const getActivityDescription = (activityType) => {
    const descMap = {
      'AI_SLIDESHOW': 'Interactive AI-powered presentation',
      'AI_VIDEO_MESSAGE': 'Personalized video message from AI',
      'DISCUSSION_TOPIC': 'Engage in meaningful conversations',
      'QUIZ': 'Test knowledge and understanding',
      'DEBATE': 'Exchange ideas and perspectives',
      'CONTEST': 'Compete and showcase skills',
      'VOTING_SURVEY': 'Share opinions and vote',
      'REFLECTION': 'Thoughtful self-reflection exercise',
      'GUIDED_SESSION': 'Structured learning experience',
      'STORY_SPOTLIGHT': 'Share and highlight stories',
      'ANNOUNCEMENT': 'Important updates and news',
    };
    return descMap[activityType] || 'Interactive activity';
  };

  // Get activities from huddle - prioritize activities array, fallback to selectedActivities
  const activities = (() => {
    // First check if activities relation exists and has data
    if (huddle?.activities && Array.isArray(huddle.activities) && huddle.activities.length > 0) {
      console.log('Using activities from relation:', huddle.activities);
      return huddle.activities;
    }
    // Fallback to selectedActivities if activities array is empty or not available
    if (huddle?.selectedActivities && Array.isArray(huddle.selectedActivities) && huddle.selectedActivities.length > 0) {
      console.log('Using selectedActivities as fallback:', huddle.selectedActivities);
      return huddle.selectedActivities.map(type => ({ activityType: type }));
    }
    console.log('No activities found');
    return [];
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading huddle details...</p>
        </div>
      </div>
    );
  }

  if (!huddle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Huddle Not Found</h1>
          <p className="text-gray-600 mb-4">The huddle you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/admin/huddle')}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Back to Huddles
          </button>
        </div>
      </div>
    );
  }

  const bannerImage = huddle.community?.bannerImg || "/logoifca.png";
  const imageSrc = bannerImage.startsWith('http') ? bannerImage : bannerImage;

  return (
    <>
      <Head>
        <title>{huddle.title || "Huddle Details"}</title>
      </Head>
      
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 py-2">
        <div className="max-w-[1920px] mx-auto px-4 flex items-center space-x-2 text-sm">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center hover:text-orange-700"
          >
            <MdHome className="w-4 h-4" />
          </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => router.push('/admin/huddle')}
            className="text-gray-500 hover:text-orange-700"
          >
            Huddles
          </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 font-medium truncate max-w-xs" title={huddle.title}>
            {huddle.title}
          </span>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="relative w-full h-64 sm:h-80 overflow-hidden">
          <img
            src={imageSrc}
            alt={huddle.community?.title || 'Huddle'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "/logoifca.png";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
          
          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <div className="max-w-[1920px] mx-auto">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                    {huddle.title}
                  </h1>
                  {huddle.community?.title && (
                    <div className="flex items-center gap-2 text-white/90">
                      <MdGroups className="w-5 h-5" />
                      <span className="text-lg">{huddle.community.title}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1920px] mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Activities Card - Main Focus */}
              {activities && activities.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">Activities</h2>
                      <p className="text-gray-600">Explore the interactive activities planned for this huddle</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full">
                      <MdEvent className="w-5 h-5 text-orange-600" />
                      <span className="text-sm font-semibold text-orange-600">{activities.length}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activities.map((activity, index) => {
                      const ActivityIcon = getActivityIcon(activity.activityType);
                      const activityColor = getActivityColor(activity.activityType);
                      const activityName = formatActivityName(activity.activityType);
                      const activityDesc = getActivityDescription(activity.activityType);
                      const activityData = activity.activityData || {};
                      const status = activityData.status || 'pending';
                      const isGenerated = activity.isGenerated || false;
                      
                      const getStatusBadge = () => {
                        switch (status) {
                          case 'completed':
                            return (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                ✓ Generated
                              </span>
                            );
                          case 'generating':
                            return (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-800 mr-1"></span>
                                Generating...
                              </span>
                            );
                          case 'failed':
                            return (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                ✗ Failed
                              </span>
                            );
                          default:
                            return (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                                Pending
                              </span>
                            );
                        }
                      };

                      const getContentPreview = () => {
                        if (status !== 'completed') return null;

                        switch (activity.activityType) {
                          case 'AI_SLIDESHOW':
                            return activityData.images?.length > 0 ? (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 mb-2">Preview: {activityData.images.length} slides</p>
                                <div className="flex gap-2">
                                  {activityData.images.slice(0, 3).map((img, idx) => (
                                    <img key={idx} src={img} alt={`Slide ${idx + 1}`} className="w-16 h-16 object-cover rounded" />
                                  ))}
                                </div>
                              </div>
                            ) : null;
                          case 'AI_VIDEO_MESSAGE':
                            return activityData.videoUrl ? (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 mb-2">Video ready</p>
                                {activityData.script && (
                                  <p className="text-xs text-gray-600 line-clamp-2">{activityData.script.substring(0, 100)}...</p>
                                )}
                              </div>
                            ) : null;
                          case 'QUIZ':
                            return activityData.questions?.length > 0 ? (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500">{activityData.totalQuestions || activityData.questions.length} questions</p>
                              </div>
                            ) : null;
                          case 'VOTING_SURVEY':
                            return activityData.question ? (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 mb-1">Question:</p>
                                <p className="text-xs text-gray-700 line-clamp-2">{activityData.question}</p>
                                {activityData.totalVotes !== undefined && (
                                  <p className="text-xs text-gray-500 mt-1">{activityData.totalVotes} votes</p>
                                )}
                              </div>
                            ) : null;
                          case 'DISCUSSION_TOPIC':
                            return activityData.topic ? (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 mb-1">Topic:</p>
                                <p className="text-xs text-gray-700 line-clamp-2">{activityData.topic}</p>
                              </div>
                            ) : null;
                          case 'ANNOUNCEMENT':
                            return activityData.title ? (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 mb-1">Title:</p>
                                <p className="text-xs text-gray-700 line-clamp-2">{activityData.title}</p>
                              </div>
                            ) : null;
                          default:
                            return null;
                        }
                      };
                      
                      return (
                        <div
                          key={activity.id || index}
                          className="group relative bg-white border-2 border-gray-100 rounded-xl p-5 hover:border-orange-200 hover:shadow-lg transition-all duration-300"
                        >
                          <div className="flex items-start gap-4">
                            <div className={`${activityColor} p-3 rounded-xl shadow-md flex-shrink-0`}>
                              <ActivityIcon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                                  {activityName}
                                </h3>
                                {getStatusBadge()}
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{activityDesc}</p>
                              
                              {getContentPreview()}
                              
                              {status === 'failed' && activityData.error && (
                                <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-700">
                                  Error: {activityData.error}
                                </div>
                              )}
                              
                              {activity.linkUrl && status === 'completed' && (
                                <a
                                  href={activity.linkUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View Activity
                                  <MdOpenInNew className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Description Card */}
              {huddle.description && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MdDescription className="w-5 h-5 text-orange-600" />
                    <h2 className="text-xl font-bold text-gray-900">Description</h2>
                  </div>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {huddle.description}
                  </p>
                </div>
              )}

              {/* Schedule & Location Card */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Schedule & Location</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                      <MdCalendarToday className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">Scheduled Date & Time</p>
                      <p className="text-gray-900 font-medium">{formatDate(huddle.scheduledTime || huddle.startTime)}</p>
                    </div>
                  </div>

                  {huddle.frequency && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                        <MdRefresh className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-1">Frequency</p>
                        <p className="text-gray-900 font-medium capitalize">{huddle.frequency.toLowerCase()}</p>
                      </div>
                    </div>
                  )}

                  {huddle.locationType && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                        <MdLocationOn className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-1">Location Type</p>
                        <p className="text-gray-900 font-medium capitalize">{huddle.locationType.toLowerCase()}</p>
                        {huddle.offlineLocation && (
                          <p className="text-gray-600 mt-1">{huddle.offlineLocation}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {huddle.timezone && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                        <MdAccessTime className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-1">Timezone</p>
                        <p className="text-gray-900 font-medium">{huddle.timezone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Community Card */}
              {huddle.community && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Community</h2>
                  <div className="flex items-start gap-3">
                    {huddle.community.bannerImg && (
                      <img
                        src={huddle.community.bannerImg}
                        alt={huddle.community.title}
                        className="w-16 h-16 rounded-lg object-cover"
                        onError={(e) => {
                          e.target.src = "/logoifca.png";
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{huddle.community.title}</h3>
                      {huddle.community.desc && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{huddle.community.desc}</p>
                      )}
                      <button
                        onClick={() => router.push(`/admin/community/${huddle.community.id}`)}
                        className="text-orange-600 hover:text-orange-700 text-sm font-medium mt-2"
                      >
                        View Community →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Creator & Leader Card */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Organizers</h2>
                <div className="space-y-4">
                  {huddle.creator && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Creator</p>
                      <div className="flex items-center gap-2">
                        {huddle.creator.user?.photoURL ? (
                          <img
                            src={huddle.creator.user.photoURL}
                            alt={huddle.creator.user.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <MdPerson className="w-4 h-4 text-orange-600" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {huddle.creator.user?.name || huddle.creator.email}
                        </span>
                      </div>
                    </div>
                  )}

                  {huddle.leader && huddle.leader.id !== huddle.creator?.id && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Leader</p>
                      <div className="flex items-center gap-2">
                        {huddle.leader.user?.photoURL ? (
                          <img
                            src={huddle.leader.user.photoURL}
                            alt={huddle.leader.user.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <MdPerson className="w-4 h-4 text-orange-600" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {huddle.leader.user?.name || huddle.leader.email}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Attendees Card */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Attendees</h2>
                  <span className="text-sm text-gray-500">
                    {huddle.attendances?.length || 0} {huddle.attendances?.length === 1 ? 'person' : 'people'}
                  </span>
                </div>
                {huddle.attendances && huddle.attendances.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {huddle.attendances.map((attendance, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {attendance.user?.user?.photoURL ? (
                          <img
                            src={attendance.user.user.photoURL}
                            alt={attendance.user.user.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <MdPerson className="w-4 h-4 text-orange-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {attendance.user?.user?.name || attendance.user?.email}
                          </p>
                          {attendance.joinedAt && (
                            <p className="text-xs text-gray-500">
                              Joined {formatTime(attendance.joinedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No attendees yet</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="space-y-2">
                  {(huddle?.isLive || huddle?.isScheduled) && (
                    <button
                      onClick={() => router.push(`/admin/ritual/${id}`)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      <MdPlayArrow className="w-4 h-4" />
                      {huddle?.isLive ? 'Join Ritual' : 'Launch Ritual'}
                    </button>
                  )}
                  <button
                    onClick={() => router.push(`/admin/huddle/edit/${id}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <MdEdit className="w-4 h-4" />
                    Edit Huddle
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <MdDelete className="w-4 h-4" />
                    Delete Huddle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-auto flex flex-col gap-6 relative">
            <button 
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteInput('');
              }} 
              className="absolute top-3 right-3 text-gray-400 hover:text-orange-500 text-2xl font-bold"
            >
              &times;
            </button>
            <h2 className="text-16px font-bold text-orange-700">Delete Huddle</h2>
            <p className="text-14px text-gray-700">To confirm deletion, please type the huddle name below:</p>
            <div 
              className="bg-orange-50 text-orange-700 px-3 py-2 rounded font-semibold text-center select-all cursor-pointer" 
              onClick={() => {
                if (huddle?.title) {
                  navigator.clipboard.writeText(huddle.title);
                }
              }}
            >
              {huddle?.title || ''}
            </div>
            <input
              type="text"
              className="border border-orange-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
              placeholder="Type huddle name to confirm..."
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteInput('');
                }}
                disabled={loadingDelete}
              >
                Cancel
              </button>
              <button
                className={`relative overflow-hidden group bg-gradient-to-r from-pink-500 to-orange-500 hover:from-orange-600 hover:to-pink-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-pink-300 ${loadingDelete || deleteInput !== huddle?.title ? 'cursor-not-allowed opacity-60' : ''}`}
                onClick={confirmDeleteHuddle}
                disabled={loadingDelete || deleteInput !== huddle?.title}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                <span className="relative flex items-center justify-center z-10">
                  {loadingDelete ? 'Deleting...' : 'Delete'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default HuddleDetailPage;
