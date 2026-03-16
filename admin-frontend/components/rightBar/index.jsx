import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import VerifiedIcon from '@mui/icons-material/Verified';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import PersonIcon from '@mui/icons-material/Person';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useSelector, useDispatch } from 'react-redux';
import { selectAllUsers, setAllUsers } from '@/store/features/userSlice';
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
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

const RightBar = ({
  comDetails,
  currentCommunityUsers,
  communitySessions,
  posts,
  maxHeight,
  width,
  className = "",
  onMembersChanged,
  onSessionsChanged
}) => {
  const [selectedTab, setSelectedTab] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef();
  // Remove all role management state and handlers
  // Remove showRoleModal, selectedUserForRole, newRole, roleChangeLoading, handleRoleChange, openRoleModal
  // Only keep add member logic
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);

  const dispatch = useDispatch();
  const allUsers = useSelector(selectAllUsers) || {};
  const addMemberSearch = useSelector(selectRightBarAddMemberSearch) || '';
  const memberSearch = useSelector(selectRightBarMemberSearch) || '';
  const notificationPanelOpen = useSelector(selectRightBarNotificationPanelOpen) || false;
  const notificationSearch = useSelector(selectRightBarNotificationSearch) || '';
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addedUserIds, setAddedUserIds] = useState([]);
  const [communityUsers, setCommunityUsers] = useState({
    subscribers: [],
    nonSubscribers: [],
    total: { all: 0, subscribed: 0, nonSubscribed: 0 }
  });
  const searchInputRef = useRef(null);
  const memberSearchInputRef = useRef(null);
  const notificationSearchInputRef = useRef(null);

  // Fetch all users on mount
  useEffect(() => { dispatch(setAllUsers()); }, [dispatch]);

  // Fetch community users function (matching [communityId].js)
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

  // Get addMemberMode for focus effect
  const addMemberMode = useSelector(selectRightBarAddMemberMode) || false;

  // Focus search input when entering add member mode and fetch community users
  useEffect(() => {
    if (addMemberMode && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      // Fetch community users when entering add member mode
      if (comDetails?.id) {
        fetchCommunityUsers(comDetails.id);
      }
    }
  }, [addMemberMode, comDetails?.id]);

  // Compute non-members (matching [communityId].js implementation)
  const filteredNonMembers = (communityUsers.nonSubscribers || [])
    .filter(user =>
      user.userType !== 'partner' && user.userType !== 'expert' && user.userType !== 'admin' &&
      (
        addMemberSearch === '' ||
        user.name?.toLowerCase().includes(addMemberSearch.toLowerCase()) ||
        user.email?.toLowerCase().includes(addMemberSearch.toLowerCase())
      )
    );

  // Add member handler (matching [communityId].js)
  const handleAddMember = async (userId) => {
    setAddMemberLoading(true);
    try {
      const response = await api.post(`/admin/community/${comDetails.id}/subscriptions`, {
        action: 'add',
        userIds: [userId],
        durationInMonths: 12
      });
      if (response.data.success) {
        setAddedUserIds(prev => [...prev, userId]);
        fetchCommunityUsers(comDetails.id);
        if (typeof onMembersChanged === 'function') onMembersChanged();
        setTimeout(() => setShowAddMembersModal(false), 800);
      }
    } catch (error) {
      console.error('Error adding member:', error);
    } finally {
      setAddMemberLoading(false);
    }
  };

  const tabs = [
    { id: 1, label: "About" },
    { id: 2, label: "Notifications" },
    { id: 3, label: "Members" },
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchNotifications = async (pageToFetch = 1) => {
    if (!comDetails?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/community/${comDetails.id}/activities`, {
        params: { page: pageToFetch, limit: 10, type: 'all' },
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

  useEffect(() => {
    if (selectedTab === 2 && (showSidebar || !isMobile)) {
      setPage(1);
      fetchNotifications(1);
    }
  }, [selectedTab, comDetails?.id, showSidebar, isMobile]);

  useEffect(() => {
    if (selectedTab === 2 && page > 1 && (showSidebar || !isMobile)) {
      fetchNotifications(page);
    }
  }, [page, selectedTab, showSidebar, isMobile]);

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

  const getUserInfo = (unifiedUser) => {
    if (!unifiedUser) return { name: 'Unknown User', avatar: 'https://robohash.org/dojo' };
    const user = unifiedUser.user || unifiedUser.expert || unifiedUser.partner || unifiedUser.admin;
    return {
      name: user?.name || 'Unknown User',
      avatar: user?.photoURL || 'https://robohash.org/dojo'
    };
  };

  // Remove all role management state and handlers
  // Remove showRoleModal, selectedUserForRole, newRole, roleChangeLoading, handleRoleChange, openRoleModal
  // Only keep add member logic
  const openAddMemberModal = () => {
    setShowAddMembersModal(true);
  };

  // Get the last 4 most recently joined members (sorted by start date, newest first)
  const recentMembers = [...currentCommunityUsers]
    .sort((a, b) => {
      const startA = new Date(a.startsAt || a.createdAt);
      const startB = new Date(b.startsAt || b.createdAt);
      return startB - startA; // Newest first
    })
    .slice(0, 4);
  const remainingCount = Math.max(0, currentCommunityUsers.length - 4);

  const communityStats = [
    { label: "Members", value: currentCommunityUsers.length, icon: PeopleIcon, color: "text-blue-600", bgColor: "bg-blue-50" },
    { label: "Sessions", value: communitySessions?.length || 0, icon: VideoCallIcon, color: "text-purple-600", bgColor: "bg-purple-50" },
    { label: "Posts", value: posts?.length || 0, icon: ArticleIcon, color: "text-green-600", bgColor: "bg-green-50" }
  ];

  const TabContent = () => {
    switch (selectedTab) {
      case 1:
        return <AboutTab />;
      case 2:
        return <NotificationsTab />;
      case 3:
        return <MembersTab />;
      default:
        return <AboutTab />;
    }
  };

  const AboutTab = () => (
    <div className="space-y-4 overflow-x-hidden w-full">
      <div className="space-y-3 p-4 overflow-x-hidden">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <span className="text-white font-bold text-base">
              {comDetails?.title?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-800 truncate">{comDetails?.title}</h3>
            <p className="text-xs text-gray-500">{communityStats[0].value} members</p>
          </div>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed break-words overflow-wrap-anywhere">{comDetails?.desc}</p>
      </div>
      <div className="flex space-x-2 px-4 overflow-x-hidden w-full">
        {communityStats.map((stat, index) => (
          <div key={index} className="flex-1 text-center p-2 bg-gray-50 rounded-lg border border-gray-200 min-w-0 overflow-hidden">
            <div className="text-sm font-bold text-gray-800 truncate">{stat.value}</div>
            <div className="text-xs text-gray-500 truncate">{stat.label}</div>
          </div>
        ))}
      </div>
      {recentMembers.length > 0 && (
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-800">Recent Members</h4>
            <button onClick={() => setSelectedTab(3)} className="text-xs text-orange-600 hover:text-orange-700 font-medium">View all</button>
          </div>
          <div className="space-y-2">
            {recentMembers.map((member, index) => {
              const userInfo = getUserInfo(member.unifiedUser);
              return (
                <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="relative">
                    <img src={userInfo.avatar} alt={userInfo.name} className="w-8 h-8 rounded-lg object-cover" onError={(e) => { e.target.src = 'https://robohash.org/dojo'; }} />
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
              <button onClick={() => setSelectedTab(3)} className="w-full text-xs text-orange-600 hover:text-orange-700 font-medium text-center py-2 hover:bg-orange-50 rounded-lg transition-colors border border-orange-100 hover:border-orange-200">
                +{remainingCount} more members
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const NotificationsTab = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{notifications.length}</span>
        </div>
      </div>
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

  const MembersTab = () => {
    const [selectedToAdd, setSelectedToAdd] = useState([]);
    const [removingUserId, setRemovingUserId] = useState(null);
    // Context menu state
    const [contextMenu, setContextMenu] = useState(null); // { mouseX, mouseY, user }
    const [roleChangeLoading, setRoleChangeLoading] = useState(false);
    const [hoveredMemberId, setHoveredMemberId] = useState(null);
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
           fetchCommunityUsers(comDetails.id);
           if (typeof onMembersChanged === 'function') onMembersChanged();
         }
      } catch (error) {
        console.error('Error adding members:', error);
      } finally {
        setAddMemberLoading(false);
      }
    };
    // Remove member handler - updated to match community page pattern
    const handleRemoveMember = async (userId) => {
      setRemovingUserId(userId);
      try {
        const response = await api.delete(`/community/${comDetails.id}/members/${userId}`);
        if (response.data.success) {
          if (typeof onMembersChanged === 'function') onMembersChanged();
        }
      } catch (error) {
        console.error('Error removing member:', error);
        // Optionally show error
      } finally {
        setRemovingUserId(null);
      }
    };
    // Role change handler - updated to match community page pattern
    const handleRoleChange = async (userId, newRole) => {
      console.log('handleRoleChange called with:', { userId, newRole });
      setRoleChangeLoading(true);
      try {
        // Find the user in currentCommunityUsers
        const user = currentCommunityUsers.find(u => 
          u.unifiedUser?.user?.id === userId || 
          u.unifiedUser?.expert?.id === userId || 
          u.unifiedUser?.partner?.id === userId || 
          u.unifiedUser?.admin?.id === userId
        );
        
        console.log('Found user:', user);
        
        if (!user || !user.id) {
          console.error('User or subscription not found');
          return;
        }

        // Use the same API pattern as community page
        console.log('Making API call to:', `/community/${comDetails.id}/members/${user.id}/role`);
        console.log('Request body:', { userId: userId, role: newRole });
        console.log('Subscription ID (user.id):', user.id);

        const response = await api.put(`/community/${comDetails.id}/members/${user.id}/role`, {
          userId: userId,
          role: newRole
        });
        
        console.log('API response:', response.data);
        
        if (response.data.success) {
          console.log('Role change successful!');
          if (typeof onMembersChanged === 'function') onMembersChanged();
          setContextMenu(null); // Close context menu after successful role change
        } else {
          console.error('Role change failed:', response.data);
        }
      } catch (error) {
        console.error('Error changing role:', error);
        // Optionally show error toast
      } finally {
        setRoleChangeLoading(false);
      }
    };
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
    // Context menu handlers
    const handleContextMenu = (event, user) => {
      event.preventDefault();
      console.log('Context menu opened for user:', user);
      console.log('User role:', user.role);
      console.log('User unifiedUser:', user.unifiedUser);
      setContextMenu({ mouseX: event.clientX - 2, mouseY: event.clientY - 4, user });
    };
    
    const handleThreeDotClick = (event, user) => {
      event.preventDefault();
      event.stopPropagation();
      console.log('Three dot clicked for user:', user);
      setContextMenu({ mouseX: event.clientX - 2, mouseY: event.clientY - 4, user });
    };
    
    const handleCloseContextMenu = () => {
      setContextMenu(null);
    };
    return (
    <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-800">Members</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{currentCommunityUsers.length}</span>
          </div>
           <button
             className={`px-3 py-1 rounded-lg font-medium text-xs transition ${addMemberMode ? 'bg-orange-100 text-orange-600' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
             onClick={() => dispatch(setRightBarAddMemberMode(!addMemberMode))}
           >
             {addMemberMode ? 'Back to Members' : 'Add Member'}
           </button>
        </div>
      <div className="flex-1 overflow-y-auto">
          {addMemberMode ? (
          <div className="p-3 space-y-2">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mb-2"
                value={addMemberSearch}
                onChange={handleAddMemberSearchChange}
                autoFocus
              />
               <div className="text-xs text-gray-500 mb-2">All contacts ({communityUsers.nonSubscribers?.length || 0})</div>
              {filteredNonMembers.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No users found.</div>
              ) : filteredNonMembers.map(user => (
                <div key={user.id} className="relative flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
                   onClick={() => {
                     // Navigate to user profile
                     if (user.userId) {
                       window.open(`/admin/people/${user.userId}`, '_blank');
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
                  console.log('Member user:', user.name || unified.name, 'Role:', role);
                  
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
                      <div className="relative flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
                      onMouseEnter={() => {
                        const userId = user.unifiedUser?.user?.id || user.unifiedUser?.expert?.id || user.unifiedUser?.partner?.id || user.unifiedUser?.admin?.id;
                        setHoveredMemberId(userId);
                      }}
                      onMouseLeave={() => setHoveredMemberId(null)}
                      onClick={() => {
                        // Navigate to user profile
                        const userId = user.unifiedUser?.user?.id || user.unifiedUser?.expert?.id || user.unifiedUser?.partner?.id || user.unifiedUser?.admin?.id;
                        if (userId) {
                          window.open(`/admin/people/${userId}`, '_blank');
                        }
                      }}
                    >
                      <div className="relative w-8 h-8 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {unified.photoURL ? (
                          <img
                            src={unified.photoURL}
                            alt={unified.name}
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
                            {unified.name}
                          </p>
                        </div>
                        <div className="text-gray-500 text-xs truncate">
                          {role === 'ADMIN' ? 'Administrator' : 
                           role === 'MODERATOR' ? 'Moderator' : 'Member'}
                        </div>
                      </div>
                      {/* 3-dot menu button - only show on hover */}
                      {(() => {
                        const userId = user.unifiedUser?.user?.id || user.unifiedUser?.expert?.id || user.unifiedUser?.partner?.id || user.unifiedUser?.admin?.id;
                        return hoveredMemberId === userId && (
                          <button
                            onClick={(e) => handleThreeDotClick(e, user)}
                            className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 z-10"
                            title="More options"
                          >
                            <MoreVertIcon className="w-4 h-4 text-gray-500" />
                          </button>
                        );
                      })()}
    </div>
                  </React.Fragment>
  );
                })
              ) : (
                <div className="text-center text-gray-500 py-8">No members found.</div>
              )}
              {/* Context Menu */}
              <Menu
                open={!!contextMenu}
                onClose={handleCloseContextMenu}
                anchorReference="anchorPosition"
                anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
              >
                {/* User Header */}
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="font-semibold text-gray-900 text-sm">
                    {contextMenu?.user?.unifiedUser?.user?.name || contextMenu?.user?.unifiedUser?.expert?.name || contextMenu?.user?.unifiedUser?.partner?.name || contextMenu?.user?.unifiedUser?.admin?.name}
          </div>
                  <div className="text-gray-500 text-xs">
                    {contextMenu?.user?.unifiedUser?.user?.email || contextMenu?.user?.unifiedUser?.expert?.email || contextMenu?.user?.unifiedUser?.partner?.email || contextMenu?.user?.unifiedUser?.admin?.email}
          </div>
        </div>

                {/* Role Management Options */}
                {contextMenu?.user?.role === 'ADMIN' ? (
                  <MenuItem 
                    onClick={() => { 
                      // Extract the correct user ID from unified user structure
                      const userId = contextMenu.user.unifiedUser?.user?.id || 
                                   contextMenu.user.unifiedUser?.expert?.id || 
                                   contextMenu.user.unifiedUser?.partner?.id || 
                                   contextMenu.user.unifiedUser?.admin?.id;
                      handleRoleChange(userId, 'MEMBER'); 
                      handleCloseContextMenu(); 
                    }}
                    disabled={roleChangeLoading}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <VerifiedIcon fontSize="small" className="mr-2" style={{ color: '#dc2626' }} />
                    Remove Administrator
                  </MenuItem>
                ) : (
                  <MenuItem 
                    onClick={() => { 
                      // Extract the correct user ID from unified user structure
                      const userId = contextMenu.user.unifiedUser?.user?.id || 
                                   contextMenu.user.unifiedUser?.expert?.id || 
                                   contextMenu.user.unifiedUser?.partner?.id || 
                                   contextMenu.user.unifiedUser?.admin?.id;
                      handleRoleChange(userId, 'ADMIN'); 
                      handleCloseContextMenu(); 
                    }}
                    disabled={roleChangeLoading}
                  >
                    <VerifiedIcon fontSize="small" className="mr-2" style={{ color: '#dc2626' }} />
                    Make Administrator
                  </MenuItem>
                )}

                {contextMenu?.user?.role === 'MODERATOR' ? (
                  <MenuItem 
                    onClick={() => { 
                      // Extract the correct user ID from unified user structure
                      const userId = contextMenu.user.unifiedUser?.user?.id || 
                                   contextMenu.user.unifiedUser?.expert?.id || 
                                   contextMenu.user.unifiedUser?.partner?.id || 
                                   contextMenu.user.unifiedUser?.admin?.id;
                      handleRoleChange(userId, 'MEMBER'); 
                      handleCloseContextMenu(); 
                    }}
                    disabled={roleChangeLoading}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <SupervisorAccountIcon fontSize="small" className="mr-2" style={{ color: '#2563eb' }} />
                    Remove Moderator
                  </MenuItem>
                ) : (
                  <MenuItem 
                    onClick={() => { 
                      // Extract the correct user ID from unified user structure
                      const userId = contextMenu.user.unifiedUser?.user?.id || 
                                   contextMenu.user.unifiedUser?.expert?.id || 
                                   contextMenu.user.unifiedUser?.partner?.id || 
                                   contextMenu.user.unifiedUser?.admin?.id;
                      handleRoleChange(userId, 'MODERATOR'); 
                      handleCloseContextMenu(); 
                    }}
                    disabled={roleChangeLoading}
                  >
                    <SupervisorAccountIcon fontSize="small" className="mr-2" style={{ color: '#2563eb' }} />
                    Make Moderator
                  </MenuItem>
                )}

                <MenuItem 
                onClick={() => {
                    // Extract the correct user ID from unified user structure
                    const userId = contextMenu.user.unifiedUser?.user?.id || 
                                 contextMenu.user.unifiedUser?.expert?.id || 
                                 contextMenu.user.unifiedUser?.partner?.id || 
                                 contextMenu.user.unifiedUser?.admin?.id;
                    handleRemoveMember(userId); 
                    handleCloseContextMenu(); 
                  }}
                  className="text-red-600 hover:bg-red-50"
                >
                  <RemoveCircleIcon fontSize="small" className="mr-2" />
                  Remove from Group
                </MenuItem>
              </Menu>
          </div>
          )}
        </div>
      </div>
    );
  };

const CommunityActivities = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
        case 'post': return <PostAddIcon className="w-4 h-4 text-orange-500" />;
        case 'session': return <VideoLibraryIcon className="w-4 h-4 text-blue-500" />;
        case 'service': return <BusinessIcon className="w-4 h-4 text-green-500" />;
        case 'form': return <DescriptionIcon className="w-4 h-4 text-purple-500" />;
        case 'resource': return <BookIcon className="w-4 h-4 text-indigo-500" />;
        case 'blog': return <ArticleIcon className="w-4 h-4 text-pink-500" />;
        case 'catchup': return <LiveTvIcon className="w-4 h-4 text-red-500" />;
        case 'subscription': return <PersonAddIcon className="w-4 h-4 text-teal-500" />;
        default: return <NotificationsIcon className="w-4 h-4 text-gray-500" />;
      }
    };
    const getActivityColor = (type) => 'bg-gray-50';
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
            <div key={activity.id} className={` ${getActivityColor(activity.type)} hover:shadow-sm transition-colors`}>
            <div className="flex items-start space-x-3 p-3">
                <div className="flex-shrink-0 mt-0.5">{getActivityIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5 mb-1">
                    <img src={userInfo.avatar} alt={userInfo.name} className="w-5 h-5 rounded-full object-cover" onError={(e) => { e.target.src = 'https://robohash.org/dojo'; }} />
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

  // MAIN RETURN (fix for missing return error)
  return (
    <>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className={`w-full h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`} style={{ maxHeight: maxHeight, width: width }}>
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 overflow-x-hidden">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setSelectedTab(tab.id)} className={`flex-1 py-3 text-sm font-medium focus:outline-none transition-colors whitespace-nowrap ${selectedTab === tab.id ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50' : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'}`}>{tab.label}</button>
            ))}
          </div>
          {/* Tab Content */}
          <div className="h-[calc(100%-48px)] overflow-y-auto overflow-x-hidden w-full">
            <TabContent />
          </div>
        </div>
      )}
      {/* Mobile Tab Bar */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex justify-around py-2">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => { setSelectedTab(tab.id); setShowSidebar(true); }} className={`flex-1 flex flex-col items-center text-xs font-medium focus:outline-none transition-colors ${selectedTab === tab.id ? 'text-orange-600' : 'text-gray-500 hover:text-orange-600'}`}>{tab.label}</button>
          ))}
        </div>
      )}
      {/* Mobile Sidebar Drawer */}
      {isMobile && showSidebar && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex">
          <div className="w-4/5 max-w-xs bg-white h-full shadow-lg flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <span className="font-semibold text-gray-800">{tabs.find(t => t.id === selectedTab)?.label}</span>
              <button onClick={() => setShowSidebar(false)} className="text-gray-400 hover:text-orange-500 text-2xl font-bold">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <TabContent />
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowSidebar(false)} />
        </div>
      )}
    </>
  );
};

export default RightBar;
