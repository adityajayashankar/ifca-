import React from "react";
import ActiveUser from "../activeUser";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import api from "../../utils/apiSetup";
import InfoIcon from "@mui/icons-material/Info";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PeopleIcon from "@mui/icons-material/People";
import CloseIcon from "@mui/icons-material/Close";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ArticleIcon from "@mui/icons-material/Article";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import SettingsIcon from "@mui/icons-material/Settings";
import PostAddIcon from "@mui/icons-material/PostAdd";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import BusinessIcon from "@mui/icons-material/Business";
import DescriptionIcon from "@mui/icons-material/Description";
import BookIcon from "@mui/icons-material/Book";
import LiveTvIcon from "@mui/icons-material/LiveTv";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonIcon from "@mui/icons-material/Person";
import VerifiedIcon from "@mui/icons-material/Verified";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import moment from 'moment';
import { toast } from 'react-toastify';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectRightBarAddMemberMode, 
  selectRightBarAddMemberSearch, 
  setRightBarAddMemberMode, 
  setRightBarAddMemberSearch,
  selectRightBarMemberSearch,
  setRightBarMemberSearch,
  selectRightBarNotificationPanelOpen,
  setRightBarNotificationPanelOpen,
  selectRightBarNotificationSearch,
  setRightBarNotificationSearch
} from '@/store/features/communitySlice';

const RightBar = ({
  comDetails,
  currentCommunityUsers,
  communitySessions,
  posts,
  onMembersChanged,
}) => {
  const [selectedTab, setSelectedTab] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);

  // User role state
  const [userRole, setUserRole] = useState(null);

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef();

  // Redux state management
  const dispatch = useDispatch();
  const addMemberMode = useSelector(selectRightBarAddMemberMode) || false;
  const addMemberSearch = useSelector(selectRightBarAddMemberSearch) || '';
  const memberSearch = useSelector(selectRightBarMemberSearch) || '';
  const notificationPanelOpen = useSelector(selectRightBarNotificationPanelOpen) || false;
  const notificationSearch = useSelector(selectRightBarNotificationSearch) || '';

  // Add member state
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addedUserIds, setAddedUserIds] = useState([]);
  const [communityUsers, setCommunityUsers] = useState({
    subscribers: [],
    nonSubscribers: [],
    total: { all: 0, subscribed: 0, nonSubscribed: 0 }
  });
  const [loadingNonSubscribers, setLoadingNonSubscribers] = useState(false);
  
  // Refs for search inputs
  const searchInputRef = useRef(null);
  const memberSearchInputRef = useRef(null);
  const notificationSearchInputRef = useRef(null);
  
  // Role change confirmation modal state
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
  const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState(null);
  const [newRole, setNewRole] = useState('MEMBER');
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);

  const tabs = [
    { 
      id: 1, 
      label: "About", 
    },
    { 
      id: 2, 
      label: "Notifications", 
    },
    { 
      id: 3, 
      label: "Members", 
    },
  ];

  // Detect mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch notifications
  const fetchNotifications = async (pageToFetch = 1) => {
    if (!comDetails?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/community/${comDetails.id}/activities`, {
        params: {
          page: pageToFetch,
          limit: 10,
          type: 'all' // Get all activities as notifications
        },
      });
      const newActivities = res.data.activities || [];
      setNotifications((prev) =>
        pageToFetch === 1 ? newActivities : [...prev, ...newActivities]
      );
      setHasMore(pageToFetch < res.data.pagination.totalPages);
    } catch (err) {
      console.error("Error fetching community activities:", err);
    }
    setLoading(false);
  };

  // Reset and fetch notifications when tab or community changes
  useEffect(() => {
    if (selectedTab === 2 && (showSidebar || !isMobile)) {
      setPage(1);
      fetchNotifications(1);
    }
  }, [selectedTab, comDetails?.id, showSidebar, isMobile]);

  // Fetch more notifications when page increases
  useEffect(() => {
    if (selectedTab === 2 && page > 1 && (showSidebar || !isMobile)) {
      fetchNotifications(page);
    }
  }, [page, selectedTab, showSidebar, isMobile]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loading || selectedTab !== 2 || (isMobile && !showSidebar)) return;
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [hasMore, loading, selectedTab, showSidebar, isMobile]);

    // Fetch current user's role in the community
  const fetchUserRole = async () => {
    if (!comDetails?.id) return;
    setRoleLoading(true);
    try {
      const res = await api.get(`/community/${comDetails.id}/my-role`);
      if (res.data.success) {
        setUserRole(res.data.data.role);
      } else {
        setUserRole('MEMBER'); // Default to member if API fails
      }
    } catch (err) {
      console.error("Error fetching user role:", err);
      setUserRole('MEMBER'); // Default to member on error
    } finally {
      setRoleLoading(false);
    }
  };

  // Fetch user role when community changes
  useEffect(() => {
    if (comDetails?.id) {
      fetchUserRole();
    }
  }, [comDetails?.id]);


  // Memoized search handlers to prevent focus loss
  const handleAddMemberSearchChange = useCallback((e) => {
    dispatch(setRightBarAddMemberSearch(e.target.value));
  }, [dispatch]);

  const handleMemberSearchChange = useCallback((e) => {
    dispatch(setRightBarMemberSearch(e.target.value));
  }, [dispatch]);

  const handleNotificationSearchChange = useCallback((e) => {
    dispatch(setRightBarNotificationSearch(e.target.value));
  }, [dispatch]);

  // Focus search input when entering add member mode
  useEffect(() => {
    if (addMemberMode && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [addMemberMode]);

  // Fetch community users function (matching admin-frontend)
  const fetchCommunityUsers = async (communityId) => {
    try {
      const response = await api.get(`/community/${communityId}/userss`);
      if (response.data.success) {
        console.log('Fetched community users:', response.data.data);
        console.log('Non-subscribers sample:', response.data.data.nonSubscribers?.slice(0, 3));
        setCommunityUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching community users:', error);
    }
  };

  // Get user info from unifiedUser
  const getUserInfo = (unifiedUser) => {
    if (!unifiedUser) return { name: 'Unknown User', avatar: 'https://robohash.org/dojo' };
    
    const user = unifiedUser.user || unifiedUser.expert || unifiedUser.partner || unifiedUser.admin;
    return {
      name: user?.name || 'Unknown User',
      avatar: user?.photoURL || 'https://robohash.org/dojo'
    };
  };

  // Dynamic filtered non-members based on search (matching admin frontend)
  const filteredNonMembers = (communityUsers.nonSubscribers || [])
    .filter(user =>
      user.userType !== 'partner' && user.userType !== 'expert' && user.userType !== 'admin' &&
      (
    addMemberSearch === '' ||
    user.name?.toLowerCase().includes(addMemberSearch.toLowerCase()) ||
    user.email?.toLowerCase().includes(addMemberSearch.toLowerCase())
      )
  );

  // Get recent members for avatar display
  const recentMembers = [...currentCommunityUsers]
    .sort((a, b) => {
      const startA = new Date(a.startsAt || a.createdAt);
      const startB = new Date(b.startsAt || b.createdAt);
      return startB - startA; // Newest first
    })
    .slice(0, 4);
  const remainingCount = Math.max(0, currentCommunityUsers.length - 4);

  // Community stats
  const communityStats = [
    {
      label: "Members",
      value: currentCommunityUsers.length,
      icon: PeopleIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      label: "Sessions",
      value: communitySessions?.length || 0,
      icon: VideoCallIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      label: "Posts",
      value: posts?.length || 0,
      icon: ArticleIcon,
      color: "text-green-600",
      bgColor: "bg-green-50"
    }
  ];

  // Mobile Sidebar Component
  const MobileSidebar = () => (
    <AnimatePresence>
      {showSidebar && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 lg:hidden"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSidebar(false)}
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-800">
                {tabs.find(t => t.id === selectedTab)?.label}
              </h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="h-full overflow-y-auto">
              <TabContent />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Tab Content Component
  const TabContent = () => {
    switch (selectedTab) {
      case 1:
        return <AboutTab />;
      case 2:
        return <NotificationsTab />;
      case 3:
        return <MembersTab 
          communityUsers={communityUsers}
          loadingNonSubscribers={loadingNonSubscribers}
          fetchCommunityUsers={fetchCommunityUsers}
        />;
      default:
        return <AboutTab />;
    }
  };

  // About Tab Component
  const AboutTab = () => (
    <div className="space-y-4">
      {/* Community Info */}
      <div className="space-y-3 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-base">
              {comDetails?.title?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{comDetails?.title}</h3>
            <p className="text-xs text-gray-500">{communityStats[0].value} members</p>
          </div>
        </div>
        
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{comDetails?.desc}</p>
      </div>

      {/* Stats Row */}
      <div className="flex space-x-2 px-4">
        {communityStats.map((stat, index) => (
          <div key={index} className="flex-1 text-center p-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm font-bold text-gray-800">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Members */}
      {recentMembers.length > 0 && (
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-800">Recent Members</h4>
            <button 
              onClick={() => setSelectedTab(3)}
              className="text-xs text-orange-600 hover:text-orange-700 font-medium"
            >
              View all
            </button>
          </div>
        
          <div className="space-y-2">
            {recentMembers.map((member, index) => {
              const userInfo = getUserInfo(member.unifiedUser);
              return (
                <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                  <div className="relative">
                    <img
                      src={userInfo.avatar}
                      alt={userInfo.name}
                      className="w-8 h-8 rounded-lg object-cover"
                      onError={(e) => {
                        e.target.src = 'https://robohash.org/dojo';
                      }}
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{userInfo.name}</p>
                    <p className="text-xs text-gray-500">Recently joined</p>
                  </div>
                </div>
              );
            })}
            
            {remainingCount > 0 && (
              <div className="text-center py-1">
                <button 
                  onClick={() => setSelectedTab(3)}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  +{remainingCount} more members
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Notifications Tab Component
  const NotificationsTab = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {notifications.length}
          </span>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="p-3">
            <CommunityActivities activities={notifications} />
            {loading && (
              <div className="flex items-center justify-center py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
              </div>
            )}
            <div ref={loaderRef} className="h-1" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full px-4 py-2 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <NotificationsIcon className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-800 mb-1">No notifications</h3>
            <p className="text-xs text-gray-500">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );

  // Role change handlers - MATCHING ADMIN-FRONTEND PATTERN
  const handleMakeAdmin = async (user) => {
    if (!user) return;
    
    const userId = user.unifiedUser?.user?.id || 
                   user.unifiedUser?.expert?.id || 
                   user.unifiedUser?.partner?.id || 
                   user.unifiedUser?.admin?.id;
    
    if (!userId) {
      console.error('Could not identify user ID');
      return;
    }
    
    try {
      setRoleChangeLoading(true);
      
      const response = await api.put(`/community/${comDetails.id}/members/${userId}/role`, {
        userId: userId,
        role: 'ADMIN'
      });

      if (response.data.success) {
        const userName = user.unifiedUser?.user?.name || user.unifiedUser?.expert?.name || user.unifiedUser?.partner?.name || user.unifiedUser?.admin?.name;
        toast.success(`Successfully made ${userName} an Administrator`);
        if (typeof onMembersChanged === 'function') {
          onMembersChanged();
        } else {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error making admin:', error);
      toast.error(error.response?.data?.message || 'Failed to update role');
    } finally {
      setRoleChangeLoading(false);
    }
  };

  const handleMakeModerator = async (user) => {
    if (!user) return;
    
    const userId = user.unifiedUser?.user?.id || 
                   user.unifiedUser?.expert?.id || 
                   user.unifiedUser?.partner?.id || 
                   user.unifiedUser?.admin?.id;
    
    if (!userId) {
      console.error('Could not identify user ID');
      return;
    }
    
    try {
      setRoleChangeLoading(true);
      
      const response = await api.put(`/community/${comDetails.id}/members/${userId}/role`, {
        userId: userId,
        role: 'MODERATOR'
      });

      if (response.data.success) {
        const userName = user.unifiedUser?.user?.name || user.unifiedUser?.expert?.name || user.unifiedUser?.partner?.name || user.unifiedUser?.admin?.name;
        toast.success(`Successfully made ${userName} a Moderator`);
        if (typeof onMembersChanged === 'function') {
          onMembersChanged();
        } else {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error making moderator:', error);
      toast.error(error.response?.data?.message || 'Failed to update role');
    } finally {
      setRoleChangeLoading(false);
    }
  };

  const handleRemoveAdmin = async (user) => {
    if (!user) return;
    
    const userId = user.unifiedUser?.user?.id || 
                   user.unifiedUser?.expert?.id || 
                   user.unifiedUser?.partner?.id || 
                   user.unifiedUser?.admin?.id;
    
    if (!userId) {
      console.error('Could not identify user ID');
      return;
    }

    try {
      setRoleChangeLoading(true);
      
      const response = await api.put(`/community/${comDetails.id}/members/${userId}/role`, {
        userId: userId,
        role: 'MEMBER'
      });

      if (response.data.success) {
        const userName = user.unifiedUser?.user?.name || user.unifiedUser?.expert?.name || user.unifiedUser?.partner?.name || user.unifiedUser?.admin?.name;
        toast.success(`Successfully removed ${userName}'s Administrator role`);
        if (typeof onMembersChanged === 'function') {
          onMembersChanged();
        } else {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error(error.response?.data?.message || 'Failed to update role');
    } finally {
      setRoleChangeLoading(false);
    }
  };

  const handleRemoveModerator = async (user) => {
    if (!user) return;
    
    const userId = user.unifiedUser?.user?.id || 
                   user.unifiedUser?.expert?.id || 
                   user.unifiedUser?.partner?.id || 
                   user.unifiedUser?.admin?.id;
    
    if (!userId) {
      console.error('Could not identify user ID');
      return;
    }

    try {
      setRoleChangeLoading(true);
      
      const response = await api.put(`/community/${comDetails.id}/members/${userId}/role`, {
        userId: userId,
        role: 'MEMBER'
      });

      if (response.data.success) {
        const userName = user.unifiedUser?.user?.name || user.unifiedUser?.expert?.name || user.unifiedUser?.partner?.name || user.unifiedUser?.admin?.name;
        toast.success(`Successfully removed ${userName}'s Moderator role`);
        if (typeof onMembersChanged === 'function') {
          onMembersChanged();
        } else {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error removing moderator:', error);
      toast.error(error.response?.data?.message || 'Failed to update role');
    } finally {
      setRoleChangeLoading(false);
    }
  };

  // Open role change modal
  const openRoleChangeModal = (user, role) => {
    setSelectedUserForRoleChange(user);
    setNewRole(role);
    setShowRoleChangeModal(true);
  };

  // Confirm role change
  const confirmRoleChange = async () => {
    if (!selectedUserForRoleChange) {
      console.error('No user selected for role change');
      return;
    }
    
    const userId = selectedUserForRoleChange.unifiedUser?.user?.id || 
                   selectedUserForRoleChange.unifiedUser?.expert?.id || 
                   selectedUserForRoleChange.unifiedUser?.partner?.id || 
                   selectedUserForRoleChange.unifiedUser?.admin?.id;
    
    if (!userId) {
      console.error('Could not identify user ID from structure:', selectedUserForRoleChange);
      toast.error('Could not identify user ID');
      return;
    }

    try {
      setRoleChangeLoading(true);
      
      const apiUrl = `/community/${comDetails.id}/members/${userId}/role`;
      const requestBody = { 
        userId: userId,
        role: newRole 
      };
      
      const response = await api.put(apiUrl, requestBody);
      
      if (response.data.success) {
        const userName = selectedUserForRoleChange.unifiedUser?.user?.name || 
                        selectedUserForRoleChange.unifiedUser?.expert?.name || 
                        selectedUserForRoleChange.unifiedUser?.partner?.name || 
                        selectedUserForRoleChange.unifiedUser?.admin?.name;
        toast.success(`Successfully updated ${userName}'s role to ${newRole}`);
        if (typeof onMembersChanged === 'function') {
          onMembersChanged();
        } else {
          window.location.reload();
        }
        setShowRoleChangeModal(false);
        setSelectedUserForRoleChange(null);
        setNewRole('MEMBER');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(error.response?.data?.message || 'Failed to update role');
    } finally {
      setRoleChangeLoading(false);
    }
  };

  // Members Tab Component - Updated with Redux and improved design
  const MembersTab = ({ 
    communityUsers, 
    loadingNonSubscribers, 
    fetchCommunityUsers 
  }) => {
    const [selectedToAdd, setSelectedToAdd] = useState([]);
    const [removingUserId, setRemovingUserId] = useState(null);
    const [roleChangeLoading, setRoleChangeLoading] = useState(false);
    
    const toggleAddUser = (userId) => {
      setSelectedToAdd(prev =>
        prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
      );
    };
    
    const handleAddSelectedMembers = async () => {
      if (selectedToAdd.length === 0) return;
      setAddMemberLoading(true);
      try {
        console.log('Adding members with IDs:', selectedToAdd);
        console.log('Selected users:', selectedToAdd.map(unifiedId => {
          const user = communityUsers.nonSubscribers?.find(u => u.id === unifiedId);
          return user ? { unifiedId: user.id, userId: user.userId, name: user.name, email: user.email } : { unifiedId, name: 'Unknown' };
        }));
        
        const response = await api.post(`/admin/community/${comDetails.id}/subscriptions`, {
          action: 'add',
          userIds: selectedToAdd,
          durationInMonths: 12
        });
        
        console.log('API Response:', response.data);
        
        if (response.data.success) {
          setSelectedToAdd([]);
          dispatch(setRightBarAddMemberSearch(''));
          // Refresh community users list
          fetchCommunityUsers(comDetails.id);
          // Call the callback to refresh members if provided
          if (typeof onMembersChanged === 'function') {
            onMembersChanged();
          }
          // Show success message
          toast.success(`${selectedToAdd.length} member(s) added successfully!`);
          dispatch(setRightBarAddMemberMode(false)); // Only close after successful add
        }
      } catch (error) {
        console.error('Error adding members:', error);
        toast.error(error.response?.data?.message || 'Failed to add members');
      } finally {
        setAddMemberLoading(false);
      }
    };
    
    // Remove member handler
    const handleRemoveMember = async (userId) => {
      setRemovingUserId(userId);
      try {
        const response = await api.delete(`/community/${comDetails.id}/members/${userId}`);
        if (response.data.success) {
          // Call the callback to refresh members if provided
          if (typeof onMembersChanged === 'function') {
            onMembersChanged();
          } else {
            // Fallback to page reload
            window.location.reload();
          }
          toast.success('Member removed successfully');
        }
      } catch (error) {
        console.error('Error removing member:', error);
        toast.error(error.response?.data?.message || 'Failed to remove member');
      } finally {
        setRemovingUserId(null);
      }
    };
    
    // Role change handler is now defined globally above
    
    // Filtered and sorted members for search
    const filteredMembers = currentCommunityUsers
      .filter(user => {
      if (!memberSearch) return true;
      const query = memberSearch.toLowerCase();
      const unified = user.unifiedUser?.user || user.unifiedUser?.expert || user.unifiedUser?.partner || user.unifiedUser?.admin || {};
      return (
        (unified.name && unified.name.toLowerCase().includes(query)) ||
        (unified.email && unified.email.toLowerCase().includes(query)) ||
        (unified.phone && unified.phone.toLowerCase().includes(query))
      );
      })
      .sort((a, b) => {
        // First sort by role priority: ADMIN > MODERATOR > MEMBER
        const rolePriority = { 'ADMIN': 3, 'MODERATOR': 2, 'MEMBER': 1 };
        const roleA = rolePriority[a.role] || 1;
        const roleB = rolePriority[b.role] || 1;
        
        if (roleA !== roleB) {
          return roleB - roleA; // Higher priority first
        }
        
        // If same role, sort by start date (newest first)
        const startA = new Date(a.startsAt || a.createdAt);
        const startB = new Date(b.startsAt || b.createdAt);
        return startB - startA;
    });
    

    
    
    return (
    <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-800">Members</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{currentCommunityUsers.length}</span>


          </div>
          {/* Only show Add Member button for ADMIN and MODERATOR roles */}
          {(userRole === 'ADMIN' || userRole === 'MODERATOR') && (
            <button
              className={`px-3 py-1 rounded-lg font-medium text-xs transition ${addMemberMode ? 'bg-orange-100 text-orange-600' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
              onClick={() => {
                const newMode = !addMemberMode;
                dispatch(setRightBarAddMemberMode(newMode));
                
                // Fetch community users when entering add member mode
                if (newMode) {
                  fetchCommunityUsers(comDetails.id);
                }
              }}
            >
              {addMemberMode ? 'Back to Members' : 'Add Member'}
            </button>
          )}
          
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Only allow ADMIN and MODERATOR to access add member mode */}
          {addMemberMode && (userRole === 'ADMIN' || userRole === 'MODERATOR') ? (
            <div className="flex flex-col h-full">
              <div className="p-3 space-y-2 flex-1 overflow-y-auto">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mb-2"
                  value={addMemberSearch}
                  onChange={handleAddMemberSearchChange}
                  autoFocus
                />
                <div className="text-xs text-gray-500 mb-2">
                  All contacts ({communityUsers.nonSubscribers?.length || 0})
                </div>
                {loadingNonSubscribers ? (
                  <div className="text-center text-gray-500 py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2"></div>
                    Loading users...
                  </div>
                ) : filteredNonMembers.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No users found.</div>
                ) : filteredNonMembers.map(user => (
                <div key={user.id} className="relative flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
                  onClick={() => {
                    // Navigate to user profile
                    if (user.userId) {
                      window.open(`/user/${user.userId}`, '_blank');
                    }
                  }}
                >
                  <div className="relative w-8 h-8 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.name}
                        className="w-8 h-8 object-cover rounded-lg"
                      />
                    ) : (
                      <PersonIcon className="w-5 h-5 text-gray-400" />
                    )}
                    {/* Online status indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-medium text-gray-800 group-hover:text-blue-600 truncate">
                        {user.name}
                      </p>
                    </div>
                    <div className="text-gray-500 text-xs truncate">
                      {user.phone || user.email}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedToAdd.includes(user.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      console.log('Selecting user:', user.name, 'with unified ID:', user.id, 'user ID:', user.userId);
                      toggleAddUser(user.id);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="w-5 h-5 text-orange-500 focus:ring-orange-500 rounded"
                  />
                </div>
              ))}
              </div>
              <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 -mx-3 px-3 pt-2 pb-3">
                <div className="flex justify-end">
                  <button
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-60"
                    onClick={handleAddSelectedMembers}
                    disabled={selectedToAdd.length === 0 || addMemberLoading}
                  >
                    {addMemberLoading ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          ) : addMemberMode && userRole === 'MEMBER' ? (
            <div className="p-3 text-center">
              <div className="text-gray-500 py-8">
                <p className="text-sm font-medium mb-2">Access Restricted</p>
                <p className="text-xs">Only administrators and moderators can add new members to this community.</p>
              </div>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              <input
                ref={memberSearchInputRef}
                type="text"
                placeholder="Search members..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mb-2"
                value={memberSearch}
                onChange={handleMemberSearchChange}
              />
              {filteredMembers.length > 0 ? (
                filteredMembers.map((user, index) => {
                  const unified = user.unifiedUser?.user || user.unifiedUser?.expert || user.unifiedUser?.partner || user.unifiedUser?.admin || {};
                  const role = user.role || 'MEMBER';
                  
                  // Add role group header if role changes
                  const showRoleHeader = index === 0 || filteredMembers[index - 1]?.role !== role;
                  
                  return (
                    <React.Fragment key={index}>
                      {showRoleHeader && (
                        <div className="px-2 py-1 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            {role === 'ADMIN' ? 'Administrators' : 
                             role === 'MODERATOR' ? 'Moderators' : 'Members'}
                          </h4>
                        </div>
                      )}
                      <div 
                        className="flex items-center space-x-3 p-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 cursor-pointer group relative"
                        onClick={() => {
                          // Navigate to user profile
                          const userId = user.unifiedUser?.user?.id || 
                                       user.unifiedUser?.expert?.id || 
                                       user.unifiedUser?.partner?.id || 
                                       user.unifiedUser?.admin?.id;
                          if (userId) {
                            window.open(`/user/${userId}`, '_blank');
                          }
                        }}
                      >
                        <div className="relative">
                          {unified.photoURL ? (
                            <img
                              src={unified.photoURL}
                              alt={unified.name}
                              className="w-8 h-8 rounded-lg object-cover"
                              onError={(e) => {
                                e.target.src = 'https://robohash.org/dojo';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 bg-orange-200 rounded-lg flex items-center justify-center">
                              <span className="text-xs font-bold text-gray-800">
                                {unified.name?.charAt(0)?.toUpperCase() || "?"}
                              </span>
                            </div>
                          )}
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{unified.name}</p>
                          <div className="text-gray-500 text-xs truncate flex items-center gap-1">
                            {role === 'ADMIN' ? (
                              <>
                                <VerifiedIcon fontSize="inherit" style={{ fontSize: '10px' }} /> 
                                <span>Administrator</span>
                              </>
                            ) : role === 'MODERATOR' ? (
                              <>
                                <SupervisorAccountIcon fontSize="inherit" style={{ fontSize: '10px' }} /> 
                                <span>Moderator</span>
                              </>
                            ) : (
                              <>
                                <PersonIcon fontSize="inherit" style={{ fontSize: '10px' }} /> 
                                <span>Member</span>
                              </>
                            )}
                          </div>
                        </div>
                        {/* 3-dots menu for administrators and moderators */}
                        {(userRole === 'ADMIN' || userRole === 'MODERATOR') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Open the center modal directly instead of context menu
                              openRoleChangeModal(user, user.role || 'MEMBER');
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded-full"
                          >
                            <MoreVertIcon className="w-4 h-4 text-gray-500" />
                          </button>
                        )}

                      </div>
                    </React.Fragment>
                  );
                })
              ) : (
                <div className="text-center text-gray-500 py-8">No members found.</div>
              )}
                  </div>
        )}
      </div>
    </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-full h-full bg-white border border-gray-200 overflow-hidden flex flex-col">
          {/* Header with Tabs and Close Button */}
          <div className="flex items-center border-b border-gray-200 bg-white">
            {/* Tabs */}
            <div className="flex-1 flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex-1 py-2.5 px-2 text-center text-sm font-medium transition-colors duration-200
                  ${selectedTab === tab.id 
                    ? 'text-orange-600 border-b-2 border-orange-500 bg-white'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
            </div>
            {/* Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window !== 'undefined' && window.toggleRightSidebar) {
                  window.toggleRightSidebar();
                }
              }}
              className="flex-shrink-0 w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors mr-1"
              title="Close Sidebar"
            >
              <CloseIcon className="w-5 h-5 text-gray-600 hover:text-orange-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <TabContent />
          </div>
        </div>
      )}

      {/* Mobile Tab Bar */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 lg:hidden">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedTab(tab.id);
                  setShowSidebar(true);
                }}
                className={`flex-1 py-3 text-center text-sm font-medium transition-colors
                  ${selectedTab === tab.id ? 'text-orange-600' : 'text-gray-600 hover:text-gray-800'}
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Sidebar */}
      <MobileSidebar />

      {/* Role Change Confirmation Modal - Using Portal */}
      {showRoleChangeModal && selectedUserForRoleChange && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Change User Role</h2>
              <button
                onClick={() => {
                  console.log('Modal close clicked');
                  setShowRoleChangeModal(false);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                  {selectedUserForRoleChange.unifiedUser?.user?.photoURL || 
                   selectedUserForRoleChange.unifiedUser?.expert?.photoURL || 
                   selectedUserForRoleChange.unifiedUser?.partner?.photoURL || 
                   selectedUserForRoleChange.unifiedUser?.admin?.photoURL ? (
                    <img
                      src={selectedUserForRoleChange.unifiedUser?.user?.photoURL || 
                           selectedUserForRoleChange.unifiedUser?.expert?.photoURL || 
                           selectedUserForRoleChange.unifiedUser?.partner?.photoURL || 
                           selectedUserForRoleChange.unifiedUser?.admin?.photoURL}
                      alt={selectedUserForRoleChange.unifiedUser?.user?.name || 
                           selectedUserForRoleChange.unifiedUser?.expert?.name || 
                           selectedUserForRoleChange.unifiedUser?.partner?.name || 
                           selectedUserForRoleChange.unifiedUser?.admin?.name}
                      className="w-10 h-10 object-cover rounded-full"
                    />
                  ) : (
                    <PersonIcon style={{ color: '#9ca3af', fontSize: 24 }} />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {selectedUserForRoleChange.unifiedUser?.user?.name || 
                     selectedUserForRoleChange.unifiedUser?.expert?.name || 
                     selectedUserForRoleChange.unifiedUser?.partner?.name || 
                     selectedUserForRoleChange.unifiedUser?.admin?.name}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {selectedUserForRoleChange.unifiedUser?.user?.email || 
                     selectedUserForRoleChange.unifiedUser?.expert?.email || 
                     selectedUserForRoleChange.unifiedUser?.partner?.email || 
                     selectedUserForRoleChange.unifiedUser?.admin?.email}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Role
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                    selectedUserForRoleChange.role === 'ADMIN'
                      ? 'bg-red-100 text-red-700'
                      : selectedUserForRoleChange.role === 'MODERATOR'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                    {selectedUserForRoleChange.role || 'MEMBER'}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="MEMBER">Member</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Role Permissions:</h4>
                {newRole === 'ADMIN' && (
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Full administrative control</li>
                    <li>• Manage members and roles</li>
                    <li>• Control community settings</li>
                    <li>• Access all features</li>
                  </ul>
                )}
                {newRole === 'MODERATOR' && (
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Moderate discussions</li>
                    <li>• Manage posts and comments</li>
                    <li>• Help maintain guidelines</li>
                    <li>• Assist with member management</li>
                  </ul>
                )}
                {newRole === 'MEMBER' && (
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Participate in discussions</li>
                    <li>• Access community resources</li>
                    <li>• Connect with members</li>
                    <li>• Engage in activities</li>
                  </ul>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={() => {
                  console.log('Cancel clicked');
                  setShowRoleChangeModal(false);
                }}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-medium text-white ${
                  roleChangeLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                onClick={() => {
                  console.log('Update Role clicked');
                  confirmRoleChange();
                }}
                disabled={roleChangeLoading}
              >
                {roleChangeLoading ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

// Community Activities Component
const CommunityActivities = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'post':
        return <PostAddIcon className="w-4 h-4 text-orange-500" />;
      case 'session':
        return <VideoLibraryIcon className="w-4 h-4 text-blue-500" />;
      case 'service':
        return <BusinessIcon className="w-4 h-4 text-green-500" />;
      case 'form':
        return <DescriptionIcon className="w-4 h-4 text-purple-500" />;
      case 'resource':
        return <BookIcon className="w-4 h-4 text-indigo-500" />;
      case 'blog':
        return <ArticleIcon className="w-4 h-4 text-pink-500" />;
      case 'catchup':
        return <LiveTvIcon className="w-4 h-4 text-red-500" />;
      case 'subscription':
        return <PersonAddIcon className="w-4 h-4 text-teal-500" />;
      default:
        return <NotificationsIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type) => {
    return 'bg-gray-50';
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getUserInfo = (creator) => {
    if (!creator) return { name: 'Unknown User', avatar: 'https://robohash.org/dojo' };
    
    const user = creator.user || creator.expert || creator.partner || creator.admin;
    return {
      name: user?.name || 'Unknown User',
      avatar: user?.photoURL || 'https://robohash.org/dojo'
    };
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🔔</div>
        <p className="text-sm text-gray-500">No activities yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-[2px]">
      {activities.map((activity) => {
        const userInfo = getUserInfo(activity.creator);
        return (
          <div
            key={activity.id}
            className={` ${getActivityColor(activity.type)} hover:shadow-sm transition-colors`}
          >
            <div className="flex items-start space-x-3 p-3">
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5 mb-1">
                  <img
                    src={userInfo.avatar}
                    alt={userInfo.name}
                    className="w-5 h-5 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://robohash.org/dojo';
                    }}
                  />
                  <span className="text-xs font-medium text-gray-800">{userInfo.name}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{formatTime(activity.createdAt)}</span>
                </div>
                <h4 className="text-xs font-semibold text-gray-800 mb-0.5">{activity.title}</h4>
                <p className="text-xs text-gray-600 line-clamp-2">{activity.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RightBar;
