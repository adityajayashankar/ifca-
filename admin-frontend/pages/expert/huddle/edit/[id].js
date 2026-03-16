import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "@/utils/apiSetup";
import { MdHome, MdChevronRight, MdSave, MdCancel, MdClose } from "react-icons/md";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import Head from "next/head";

const ACTIVITY_TYPES = [
  { value: 'AI_SLIDESHOW', label: 'AI Slideshow' },
  { value: 'AI_VIDEO_MESSAGE', label: 'AI Video Message' },
  { value: 'DISCUSSION_TOPIC', label: 'Discussion Topic' },
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'DEBATE', label: 'Debate' },
  { value: 'CONTEST', label: 'Contest' },
  { value: 'VOTING_SURVEY', label: 'Voting/Survey' },
  { value: 'REFLECTION', label: 'Reflection' },
  { value: 'GUIDED_SESSION', label: 'Guided Session' },
  { value: 'STORY_SPOTLIGHT', label: 'Story Spotlight' },
  { value: 'ANNOUNCEMENT', label: 'Announcement' },
];

const FREQUENCY_OPTIONS = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'FORTNIGHTLY', label: 'Fortnightly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'ONE_TIME', label: 'One Time' },
];

const AUDIENCE_TYPES = [
  { value: 'ALL_MEMBERS', label: 'All Members' },
  { value: 'SELECTED_MEMBERS', label: 'Selected Members' },
];

const LOCATION_TYPES = [
  { value: 'DIGITAL', label: 'Digital' },
  { value: 'OFFLINE', label: 'Offline' },
];

const LEADER_SELECTION_TYPES = [
  { value: 'USER', label: 'Specific User' },
  { value: 'RANDOM', label: 'Random' },
  { value: 'ROUNDROBIN', label: 'Round Robin' },
];

function EditExpertHuddlePage() {
  const router = useRouter();
  const { id } = router.query;
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [communities, setCommunities] = useState([]);
  const [communityMembers, setCommunityMembers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    communityId: '',
    frequency: 'WEEKLY',
    scheduledTime: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    selectedActivities: [],
    audienceType: 'ALL_MEMBERS',
    selectedMemberIds: [],
    locationType: 'DIGITAL',
    offlineLocation: '',
    leaderId: '',
    leaderSelectionType: 'USER',
  });

  useEffect(() => {
    if (id) {
      fetchHuddleData();
      fetchCommunities();
    }
  }, [id]);

  useEffect(() => {
    if (formData.communityId && formData.audienceType === 'SELECTED_MEMBERS') {
      fetchCommunityMembers();
    }
  }, [formData.communityId, formData.audienceType]);

  const fetchHuddleData = async () => {
    try {
      setFetching(true);
      const response = await api.get(`/huddle/${id}`);
      if (response.data && response.data.success && response.data.huddle) {
        const huddle = response.data.huddle;
        
        const scheduledTime = huddle.scheduledTime || huddle.startTime;
        const formattedTime = scheduledTime 
          ? new Date(scheduledTime).toISOString().slice(0, 16)
          : '';

        // Get activity types - prefer selectedActivities field, fallback to activities array
        const activities = huddle.selectedActivities && huddle.selectedActivities.length > 0
          ? huddle.selectedActivities
          : (huddle.activities?.map(a => a.activityType) || []);

        setFormData({
          title: huddle.title || '',
          description: huddle.description || '',
          communityId: huddle.communityId?.toString() || '',
          frequency: huddle.frequency || 'WEEKLY',
          scheduledTime: formattedTime,
          timezone: huddle.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          selectedActivities: activities,
          audienceType: huddle.audienceType || 'ALL_MEMBERS',
          selectedMemberIds: huddle.selectedMemberIds || [],
          locationType: huddle.locationType || 'DIGITAL',
          offlineLocation: huddle.offlineLocation || '',
          leaderId: huddle.leaderId?.toString() || '',
          leaderSelectionType: huddle.leaderSelectionType || 'USER',
        });
      } else {
        toast.error('Failed to load huddle data');
        router.push('/expert/huddle');
      }
    } catch (error) {
      console.error('Error fetching huddle:', error);
      toast.error('Failed to load huddle data');
      router.push('/expert/huddle');
    } finally {
      setFetching(false);
    }
  };

  const fetchCommunities = async () => {
    try {
      const response = await api.get(`/expert/${user?.id}/community`);
      console.log('Expert communities response:', response.data);
      if (response.data) {
        // Handle both response structures
        const communitiesList = response.data.communities || response.data || [];
        setCommunities(Array.isArray(communitiesList) ? communitiesList : []);
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast.error('Failed to load communities');
    }
  };

  const fetchCommunityMembers = async () => {
    try {
      const response = await api.get(`/community/${formData.communityId}/users`);
      console.log('Community members response:', response.data);
      if (response.data && response.data.users) {
        // Transform the data to extract user info from unifiedUser
        const transformedMembers = response.data.users.map(subscription => {
          const unifiedUser = subscription.unifiedUser;
          let name = '';
          let email = '';
          let userId = null;

          let photoURL = '';

          if (unifiedUser?.user) {
            name = unifiedUser.user.name || '';
            email = unifiedUser.user.email || '';
            userId = unifiedUser.user.id;
            photoURL = unifiedUser.user.photoURL || '';
          } else if (unifiedUser?.expert) {
            name = unifiedUser.expert.name || '';
            email = unifiedUser.expert.email || '';
            userId = unifiedUser.expert.id;
            photoURL = unifiedUser.expert.photoURL || '';
          } else if (unifiedUser?.partner) {
            name = unifiedUser.partner.name || '';
            email = unifiedUser.partner.email || '';
            userId = unifiedUser.partner.id;
            photoURL = unifiedUser.partner.photoURL || '';
          } else if (unifiedUser?.admin) {
            name = unifiedUser.admin.name || '';
            email = unifiedUser.admin.email || '';
            userId = unifiedUser.admin.id;
            photoURL = unifiedUser.admin.photoURL || '';
          } else {
            email = unifiedUser?.email || '';
          }

          return {
            id: unifiedUser?.id || subscription.id,
            userId: userId,
            name: name,
            email: email,
            photoURL: photoURL,
            unifiedUser: unifiedUser
          };
        });
        setCommunityMembers(transformedMembers);
      }
    } catch (error) {
      console.error('Error fetching community members:', error);
      toast.error('Failed to load community members');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleActivityToggle = (activity) => {
    setFormData(prev => ({
      ...prev,
      selectedActivities: prev.selectedActivities.includes(activity)
        ? prev.selectedActivities.filter(a => a !== activity)
        : [...prev.selectedActivities, activity],
    }));
  };

  const handleMemberToggle = (memberId) => {
    setFormData(prev => ({
      ...prev,
      selectedMemberIds: prev.selectedMemberIds.includes(memberId)
        ? prev.selectedMemberIds.filter(id => id !== memberId)
        : [...prev.selectedMemberIds, memberId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!formData.communityId) {
      toast.error('Please select a community');
      return;
    }
    if (!formData.scheduledTime) {
      toast.error('Please select a scheduled time');
      return;
    }
    if (formData.selectedActivities.length === 0) {
      toast.error('Please select at least one activity');
      return;
    }
    if (formData.audienceType === 'SELECTED_MEMBERS' && formData.selectedMemberIds.length === 0) {
      toast.error('Please select at least one member');
      return;
    }
    if (formData.locationType === 'OFFLINE' && !formData.offlineLocation.trim()) {
      toast.error('Please enter offline location');
      return;
    }
    if (formData.leaderSelectionType === 'USER' && !formData.leaderId) {
      toast.error('Please select a leader');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: formData.title,
        description: formData.description,
        frequency: formData.frequency,
        scheduledTime: new Date(formData.scheduledTime).toISOString(),
        timezone: formData.timezone,
        selectedActivities: formData.selectedActivities,
        audienceType: formData.audienceType,
        selectedMemberIds: formData.selectedMemberIds,
        locationType: formData.locationType,
        offlineLocation: formData.offlineLocation || null,
        leaderSelectionType: formData.leaderSelectionType,
        leaderId: formData.leaderSelectionType === 'USER' ? parseInt(formData.leaderId) : undefined,
      };

      const response = await api.put(`/huddle/${id}`, payload);
      
      if (response.data && response.data.success) {
        toast.success('Huddle updated successfully!');
        router.push(`/expert/huddle/${id}`);
      } else {
        toast.error(response.data?.message || 'Failed to update huddle');
      }
    } catch (error) {
      console.error('Error updating huddle:', error);
      toast.error(error.response?.data?.message || 'Failed to update huddle');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading huddle data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Huddle</title>
      </Head>

      <div className="bg-white border-b border-gray-200 py-2">
        <div className="max-w-[1920px] mx-auto px-4 flex items-center space-x-2 text-sm">
          <button
            onClick={() => router.push('/expert')}
            className="flex items-center hover:text-orange-700"
          >
            <MdHome className="w-4 h-4" />
          </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => router.push('/expert/huddle')}
            className="text-gray-500 hover:text-orange-700"
          >
            Huddles
          </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 font-medium">Edit Huddle</span>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Huddle</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Community <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="communityId"
                    value={formData.communityId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50"
                    required
                    disabled
                  >
                    <option value="">Select a community</option>
                    {communities.length > 0 ? (
                      communities.map(community => (
                        <option key={community.id} value={community.id}>
                          {community.title}
                        </option>
                      ))
                    ) : (
                      <option value={formData.communityId} disabled>
                        {formData.communityId ? 'Loading...' : 'No community selected'}
                      </option>
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Community cannot be changed after creation</p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Schedule</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scheduled Date & Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="scheduledTime"
                      value={formData.scheduledTime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequency <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="frequency"
                      value={formData.frequency}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      {FREQUENCY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <input
                    type="text"
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50"
                    readOnly
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Activities</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ACTIVITY_TYPES.map(activity => (
                    <label
                      key={activity.value}
                      className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-orange-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedActivities.includes(activity.value)}
                        onChange={() => handleActivityToggle(activity.value)}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        {activity.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Audience</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Audience Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="audienceType"
                    value={formData.audienceType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  >
                    {AUDIENCE_TYPES.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.audienceType === 'SELECTED_MEMBERS' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Members <span className="text-red-500">*</span>
                    </label>
                    <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                      {communityMembers.length > 0 ? (
                        communityMembers.map(member => (
                          <label
                            key={member.id}
                            className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.selectedMemberIds.includes(member.id)}
                              onChange={() => handleMemberToggle(member.id)}
                              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                            />
                            <div className="ml-3 flex items-center gap-2 flex-1">
                              <img
                                src={member.photoURL || 'https://via.placeholder.com/32'}
                                alt={member.name || 'User'}
                                className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/32';
                                }}
                              />
                              <span className="text-sm text-gray-700">
                                {member.name || member.email || 'Unknown User'}
                              </span>
                            </div>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No members found. Please select a community first.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Location</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="locationType"
                    value={formData.locationType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  >
                    {LOCATION_TYPES.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.locationType === 'OFFLINE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Offline Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="offlineLocation"
                      value={formData.offlineLocation}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required={formData.locationType === 'OFFLINE'}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Leader Selection</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Leader Selection Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="leaderSelectionType"
                    value={formData.leaderSelectionType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  >
                    {LEADER_SELECTION_TYPES.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.leaderSelectionType === 'USER' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Leader <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="leaderId"
                        value={formData.leaderId}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
                        required={formData.leaderSelectionType === 'USER'}
                      >
                        <option value="">Select a leader</option>
                        {communityMembers.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.name || member.email || 'Unknown User'}
                          </option>
                        ))}
                      </select>
                      {formData.leaderId && communityMembers.find(m => m.id === formData.leaderId) && (
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <img
                            src={communityMembers.find(m => m.id === formData.leaderId)?.photoURL || 'https://via.placeholder.com/40'}
                            alt="Leader"
                            className="w-8 h-8 rounded-full object-cover border-2 border-orange-200"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/40';
                            }}
                          />
                        </div>
                      )}
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <MdChevronRight className="w-5 h-5 text-gray-400 rotate-90" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => router.push(`/expert/huddle/${id}`)}
                  className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <MdCancel className="w-5 h-5" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MdSave className="w-5 h-5" />
                  {loading ? 'Updating...' : 'Update Huddle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default EditExpertHuddlePage;
