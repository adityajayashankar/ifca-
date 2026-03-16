import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "@/utils/apiSetup";
import { MdHome, MdChevronRight, MdGroups, MdPerson, MdCalendarToday, MdLocationOn, MdAccessTime, MdRefresh, MdPeople, MdDescription } from "react-icons/md";
import { toast } from "react-toastify";
import Head from "next/head";

function PartnerHuddleDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [huddle, setHuddle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchHuddleDetails();
    }
  }, [id]);

  const fetchHuddleDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/huddle/${id}`);
      if (response.data && response.data.success) {
        setHuddle(response.data.huddle);
      } else {
        toast.error('Failed to load huddle details');
        router.push('/partner/huddle');
      }
    } catch (error) {
      console.error('Error fetching huddle:', error);
      toast.error('Failed to load huddle details');
      router.push('/partner/huddle');
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
            onClick={() => router.push('/partner/huddle')}
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
            onClick={() => router.push('/partner')}
            className="flex items-center hover:text-orange-700"
          >
            <MdHome className="w-4 h-4" />
          </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => router.push('/partner/huddle')}
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

              {/* Activities Card */}
              {huddle.activities && huddle.activities.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Activities</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {huddle.activities.map((activity, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {activity.activityType?.replace(/_/g, ' ').toLowerCase()}
                        </p>
                        {activity.linkUrl && (
                          <a
                            href={activity.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-orange-600 hover:text-orange-700 mt-1 inline-block"
                          >
                            View Activity →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                        onClick={() => router.push(`/partner/community/${huddle.community.id}`)}
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PartnerHuddleDetailPage;
