import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import PeopleIcon from "@mui/icons-material/People";
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import GroupsIcon from '@mui/icons-material/Groups';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BusinessIcon from '@mui/icons-material/Business';
import HandshakeIcon from '@mui/icons-material/Handshake';
import PublicIcon from '@mui/icons-material/Public';
import TPolls from "./TPolls";
import TGreet from "./TGreet";
import TQues from "./TQues";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { selectCommunity } from "@/store/features/communitySlice";
import { selectUser, selectUserCommunities } from "@/store/features/userSlice";
import HomeIcon from "@mui/icons-material/Home";
import VisibilityIcon from '@mui/icons-material/Visibility';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import ArticleIcon from '@mui/icons-material/Article';
import EventIcon from "@mui/icons-material/Event";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import FolderIcon from "@mui/icons-material/Folder";
import ForumIcon from "@mui/icons-material/Forum";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SearchIcon from '@mui/icons-material/Search';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import api from "@/utils/apiSetup";

const Sidebar = ({ comDetails, setShowSidebar, isCollapsed, isMobile, openCommunityPopup }) => {
  const user = useSelector(selectUser);
  const currentCommunity = useSelector(selectCommunity);
  const userCommunities = useSelector(selectUserCommunities);
  const router = useRouter();
  const location = router.asPath;
  
  // User role state for role-based access control
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  
  // Extract comId with proper validation
  const getComId = () => {
    // First try to get from Redux store (most reliable)
    if (currentCommunity?.id) {
      return currentCommunity.id;
    }
    
    // Then try query parameter
    const queryComId = router.query.id;
    if (queryComId && queryComId !== 'undefined' && queryComId !== 'null' && queryComId.trim() !== '') {
      return queryComId;
    }
    
    // For /ritual/:huddleId or /comHome/:id/huddle/:huddleId, extract from comDetails
    if (comDetails?.id) {
      return comDetails.id;
    }
    
    // Last resort: try to extract from path
    const pathParts = location.split("/").filter(p => p);
    // Find comHome or ritual in path and get the ID after it
    const comHomeIndex = pathParts.indexOf("comHome");
    const ritualIndex = pathParts.indexOf("ritual");
    
    if (comHomeIndex !== -1 && comHomeIndex + 1 < pathParts.length) {
      const id = pathParts[comHomeIndex + 1];
      if (id && id !== 'undefined' && id !== 'null' && id.trim() !== '') {
        return id;
      }
    }
    
    if (ritualIndex !== -1 && ritualIndex - 1 >= 0) {
      // For /ritual/:huddleId, we need the community ID which should come from Redux or comDetails
      return comDetails?.id || null;
    }
    
    return null;
  };
  
  const comId = getComId();

  // Thread submenu state: closed by default
  const [showThreadSub, setShowThreadSub] = useState(false);
  // Communities submenu state
  const [showCommunitiesSub, setShowCommunitiesSub] = useState(false);
  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Helper function to get icon based on community type and title
  const getCommunityIcon = useCallback((community) => {
    if (community.communityType === 'DEFAULT') {
      // Return specific icons for default communities based on title
      const title = community.title?.toLowerCase();
      if (title?.includes('governance')) return <AdminPanelSettingsIcon fontSize="small" />;
      if (title?.includes('approval')) return <AdminPanelSettingsIcon fontSize="small" />;
      if (title?.includes('commercial')) return <BusinessIcon fontSize="small" />;
      if (title?.includes('partnership')) return <HandshakeIcon fontSize="small" />;
      return <GroupsIcon fontSize="small" />;
    }
    return <PublicIcon fontSize="small" />;
  }, []);

  // Helper function to get community type label
  const getCommunityTypeLabel = useCallback((community) => {
    if (community.communityType === 'DEFAULT') {
      return 'Group';
    }
    return 'Subcommunity';
  }, []);

  // Separate child communities by type
  const defaultCommunities = useMemo(() => 
    currentCommunity?.childCommunities?.filter(community => 
      community.communityType === 'DEFAULT'
    ) || [], [currentCommunity?.childCommunities]
  );
  
  const otherCommunities = useMemo(() => 
    currentCommunity?.childCommunities?.filter(community => 
      community.communityType !== 'DEFAULT'
    ) || [], [currentCommunity?.childCommunities]
  );

  // Check if user is member of a community
  const isMemberOfCommunity = useCallback((communityId) => {
    return userCommunities?.some(community => community.id === communityId);
  }, [userCommunities]);

  // Handle community click
  const handleCommunityClick = useCallback(async (community) => {
    if (!user || !user.id) {
      if (openCommunityPopup) openCommunityPopup(community);
      return;
    }
    try {
      const res = await api.get(`/user/${user.id}/community/${community.id}/subscribed`);
      if (res.data && res.data.subscribed) {
        router.push(`/comHome/${community.id}`);
        if (isMobile) setShowSidebar(false);
      } else {
        if (openCommunityPopup) openCommunityPopup(community);
      }
    } catch (err) {
      if (openCommunityPopup) openCommunityPopup(community);
    }
  }, [user, router, isMobile, setShowSidebar, openCommunityPopup]);

  // Handle view community details
  const handleViewDetails = useCallback(() => {
    // if (selectedCommunity) { // Removed
    //   router.push(`/communityDetails/${selectedCommunity.id}`); // Removed
    //   setShowCommunityPopup(false); // Removed
    //   setSelectedCommunity(null); // Removed
    //   if (isMobile) setShowSidebar(false); // Removed
    // }
  }, []);

  // Handle join community
  const handleJoinCommunity = useCallback(() => {
    // if (selectedCommunity) { // Removed
    //   router.push(`/communitySub/${selectedCommunity.id}`); // Removed
    //   setShowCommunityPopup(false); // Removed
    //   setSelectedCommunity(null); // Removed
    //   if (isMobile) setShowSidebar(false); // Removed
    // }
  }, []);

  // Fetch user role in the community
  const fetchUserRole = useCallback(async () => {
    if (!comId) {
      console.log('Sidebar: No comId available yet, skipping role fetch');
      return;
    }
    
    console.log('Sidebar: Fetching role for comId:', comId);
    try {
      setRoleLoading(true);
      const res = await api.get(`/community/${comId}/my-role`);
      console.log('Sidebar: Role response:', res.data);
      if (res.data.success) {
        setUserRole(res.data.data.role);
      }
    } catch (error) {
      console.error('Sidebar: Error fetching user role:', error);
    } finally {
      setRoleLoading(false);
    }
  }, [comId]);

  // Fetch user role when comId changes
  useEffect(() => {
    // Only fetch role when router is ready and comId is available
    if (router.isReady && comId) {
      fetchUserRole();
    }
  }, [router.isReady, comId, fetchUserRole]);

  // Sync search state with URL
  useEffect(() => {
    if (router.query.search === 'true') {
      setShowSearch(true);
      if (router.query.q) {
        setSearchQuery(router.query.q);
      }
    } else {
      setShowSearch(false);
      setSearchQuery('');
    }
  }, [router.query.search, router.query.q]);

  // Helper function to check if current tab is active
  const isTabActive = useCallback((tabName) => {
    if (!location.includes("comHome")) return false;
    const queryTab = router.query.tab;
    const tabMap = {
      'updates': 'updates',
      'sessions': 'sessions',
      'resources': 'resources',
      'huddles': 'huddles',
      'forms': 'forms',
      'services': 'services',
      'catchup': 'catchup',
    };
    return queryTab === tabMap[tabName];
  }, [location, router.query.tab]);

  // Helper function to navigate with proper query parameter handling
  const navigateToTab = useCallback((tabName, additionalParams = {}) => {
    if (!comId) return;
    
    // Build clean query object - always start fresh with just the tab and additional params
    const query = {
      tab: tabName,
      ...additionalParams
    };
    
    // Remove undefined, null, empty string values, and route parameters (id)
    Object.keys(query).forEach(key => {
      if (query[key] === undefined || query[key] === null || query[key] === '' || key === 'id') {
        delete query[key];
      }
    });
    
    // Use replace with as parameter to ensure clean URL without id in query string
    router.replace(
      {
        pathname: `/comHome/[id]`,
        query: { id: comId, ...query }
      },
      `/comHome/${comId}${Object.keys(query).length > 0 ? '?' + new URLSearchParams(query).toString() : ''}`,
      { shallow: true }
    );
    
    if (isMobile) setShowSidebar(false);
  }, [comId, router, isMobile, setShowSidebar]);

  const menuItems = useMemo(() => [
    {
      icon: <HomeIcon fontSize="medium" />, 
      label: "Home", 
      onClick: () => { 
        navigateToTab('updates');
      }, 
      isActive: location.includes("comHome") && !location.includes('/huddle/') && !location.includes('/ritual/') && (!router.query.tab || router.query.tab === 'updates')
    },
    {
      icon: <ChatBubbleOutlineOutlinedIcon fontSize="medium" />, 
      label: "Threads", 
      onClick: () => setShowThreadSub((prev) => !prev), 
      isActive: location.includes("comThreads"),
      children: [
        {
          icon: <CampaignOutlinedIcon fontSize="small" />, 
          label: "Announcements", 
          onClick: () => { 
            if (comId) {
              router.push(`/comThreads/${comId}`); 
              if (isMobile) setShowSidebar(false); 
            }
          }, 
          isActive: location.includes("comThreads") && !location.includes("asks") && !location.includes("greetings") && !location.includes("polls")
        },
        {
          icon: <TPolls black={location.includes("polls")} />, 
          label: "Polls", 
          onClick: () => { 
            if (comId) {
              router.push(`/comThreads/polls/${comId}`); 
              if (isMobile) setShowSidebar(false); 
            }
          }, 
          isActive: location.includes("polls")
        },
        {
          icon: <TGreet black={location.includes("greetings")} />, 
          label: "Greetings", 
          onClick: () => { 
            if (comId) {
              router.push(`/comThreads/greetings/${comId}`); 
              if (isMobile) setShowSidebar(false); 
            }
          }, 
          isActive: location.includes("greetings")
        },
        {
          icon: <TQues black={location.includes("asks")} />, 
          label: "Asks", 
          onClick: () => { 
            if (comId) {
              router.push(`/comThreads/asks/${comId}`); 
              if (isMobile) setShowSidebar(false); 
            }
          }, 
          isActive: location.includes("asks")
        },
      ]
    },
    // Only show Subcommunities button if there are child communities
    ...(defaultCommunities.length > 0 || otherCommunities.length > 0 ? [{
      icon: <PeopleIcon fontSize="medium" />, 
      label: "Subcommunities", 
      onClick: () => setShowCommunitiesSub((prev) => !prev), 
      isActive: location.includes("communities"),
      children: [
        // Default communities (Groups) first
        ...defaultCommunities.map(community => ({
          icon: getCommunityIcon(community),
          label: community.title,
          image: community.bannerImg,
          type: getCommunityTypeLabel(community),
          onClick: () => handleCommunityClick(community),
          isActive: location.includes(`/comHome/${community.id}`)
        })),
        // Other communities (Subcommunities) second
        ...otherCommunities.map(community => ({
          icon: getCommunityIcon(community),
          label: community.title,
          image: community.bannerImg,
          type: getCommunityTypeLabel(community),
          onClick: () => handleCommunityClick(community),
          isActive: location.includes(`/comHome/${community.id}`)
        }))
      ]
    }] : []),
    {
      icon: <VideoCallIcon fontSize="medium" />, 
      label: "Sessions", 
      onClick: () => { 
        navigateToTab('sessions');
      }, 
      isActive: isTabActive('sessions')
    },
    {
      icon: <FolderIcon fontSize="medium" />, 
      label: "Resources", 
      onClick: () => { 
        navigateToTab('resources');
      }, 
      isActive: isTabActive('resources')
    },
    {
      icon: <ForumIcon fontSize="medium" />, 
      label: "Huddles", 
      onClick: () => { 
        navigateToTab('huddles');
      }, 
      isActive: isTabActive('huddles') || location.includes('/huddle/')
    },
    {
      icon: <AssignmentIcon fontSize="medium" />, 
      label: "Forms", 
      onClick: () => { 
        navigateToTab('forms');
      }, 
      isActive: isTabActive('forms')
    },
    {
      icon: <BusinessIcon fontSize="medium" />, 
      label: "Services", 
      onClick: () => { 
        navigateToTab('services');
      }, 
      isActive: isTabActive('services')
    },
    {
      icon: <LiveTvIcon fontSize="medium" />, 
      label: "CatchUp", 
      onClick: () => { 
        navigateToTab('catchup');
      }, 
      isActive: isTabActive('catchup')
    },
    {
      icon: <SearchIcon fontSize="medium" />, 
      label: "Search", 
      onClick: () => {
        setShowSearch(!showSearch);
        if (!showSearch) {
          setSearchQuery('');
          // Navigate to comHome with search enabled
          if (comId) {
            navigateToTab(router.query.tab || 'updates', { search: 'true' });
          }
        } else {
          // Clear search from URL
          if (comId) {
            const currentTab = router.query.tab || 'updates';
            navigateToTab(currentTab);
          }
        }
      }, 
      isActive: showSearch || router.query.search === 'true'
    },
    // Join Requests tab - only visible for ADMIN and MODERATOR
    ...(userRole === 'ADMIN' || userRole === 'MODERATOR' ? [{
      icon: <ArticleIcon fontSize="medium" />, 
      label: "Join Requests", 
      onClick: () => { 
        if (comId) {
          router.push(`/comRequest/${comId}`); 
          if (isMobile) setShowSidebar(false); 
        }
      }, 
      isActive: location.includes("comRequest")
    }] : roleLoading ? [{
      icon: <ArticleIcon fontSize="medium" />, 
      label: "Join Requests", 
      onClick: () => {}, 
      isActive: false,
      disabled: true
    }] : [])
  ], [comId, router, isMobile, setShowSidebar, location, defaultCommunities, otherCommunities, getCommunityIcon, getCommunityTypeLabel, handleCommunityClick, userRole, roleLoading, showSearch, router.query.tab, isTabActive, navigateToTab]);

  return (
    <nav className="h-full w-full flex flex-col bg-white text-gray-700 overflow-hidden z-[40] border-r border-gray-200">
      {/* Server Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 border-b border-orange-200 relative">
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
          <img
            src={comDetails?.bannerImg || "/comPic.svg"}
            alt="Community Avatar"
            className="w-full h-full rounded-full object-cover"
            onError={(e) => {
              e.target.src = "/comPic.svg";
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-orange-800 truncate">{comDetails?.title || "Community"}</div>
          <div className="text-xs text-orange-600 truncate">
            {comDetails?.parentCommunities?.length > 0 
              ? 
              <div className="flex items-center gap-1">
                {comDetails?.parentCommunities?.map(parent => (
                  <button 
                    key={parent.id} 
                    onClick={() => router.push(`/comHome/${parent.id}`)} 
                    className="text-orange-600 hover:text-orange-800 hover:bg-orange-100 transition hover:underline"
                  >
                    {parent.title}
                  </button>
                ))}
              </div>
              : (comDetails?.description || "Welcome!")
            }
          </div>
        </div>
        {isMobile && (
          <button onClick={() => setShowSidebar(false)} className="p-1.5 rounded text-orange-600 hover:text-orange-800 hover:bg-orange-100 transition">
            <CloseIcon fontSize="small" />
          </button>
        )}
      </div>

      {/* Menu Items */}
      <div className="flex-1 flex flex-col px-2 py-2 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item, idx) => (
          <div key={idx} className="mb-1">
            <button
              onClick={item.onClick}
              disabled={item.disabled}
              className={`w-full flex items-center gap-3 px-2 py-1.5 rounded text-sm font-medium transition-colors group
                ${item.disabled 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : item.isActive 
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-600 hover:text-orange-700 hover:bg-orange-50'
                }
              `}
            >
              <span className={`text-lg ${item.isActive ? 'text-white' : 'text-orange-500 group-hover:text-orange-600'}`}>
                {item.icon}
              </span>
              <span className="truncate flex-1 text-left">{item.label}</span>
              {item.children && (
                ((item.label === "Threads" && showThreadSub) || (item.label === "Subcommunities" && showCommunitiesSub)) ? 
                <ExpandLessIcon fontSize="small" className="text-orange-500 group-hover:text-orange-600" /> : 
                <ExpandMoreIcon fontSize="small" className="text-orange-500 group-hover:text-orange-600" />
              )}
            </button>
            
            {/* Search Input */}
            {item.label === "Search" && (showSearch || router.query.search === 'true') && (
              <div className="ml-4 mt-1 px-2 py-2">
                <div className="relative">
                  <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search threads, posts, sessions, resources..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      // Update URL with search query
                      if (comId) {
                        const currentTab = router.query.tab || 'updates';
                        const query = e.target.value.trim();
                        if (query) {
                          navigateToTab(currentTab, { search: 'true', q: query });
                        } else {
                          navigateToTab(currentTab, { search: 'true' });
                        }
                      }
                    }}
                    className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        if (comId) {
                          const currentTab = router.query.tab || 'updates';
                          navigateToTab(currentTab, { search: 'true' });
                        }
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Submenu */}
            {item.children && ((item.label === "Threads" && showThreadSub) || (item.label === "Subcommunities" && showCommunitiesSub)) && (
              <div className={`ml-4 mt-1 flex flex-col ${item.label === "Subcommunities" ? 'max-h-[300px] overflow-y-auto' : ''}`}>
                {item.children.map((child, cidx) => (
                  <button
                    key={cidx}
                    onClick={child.onClick}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm font-medium transition-colors group
                      ${child.isActive 
                        ? 'bg-orange-100 text-orange-800 border-l-2 border-orange-500' 
                        : 'text-gray-600 hover:text-orange-700 hover:bg-orange-50'
                      }
                    `}
                  >
                    {item.label === "Subcommunities" ? (
                      <div className="relative w-6 h-6 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={child.image || "/comPic.svg"}
                          alt={child.label}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/comPic.svg";
                          }}
                        />
                      </div>
                    ) : (
                      <span className="text-base">{child.icon}</span>
                    )}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="truncate">{child.label}</div>
                      {item.label === "Subcommunities" && child.type && (
                        <div className={`text-xs ${child.isActive ? 'text-orange-600' : 'text-gray-400 group-hover:text-orange-500'}`}>
                          {child.type}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* User Status Bar (Discord-like) */}
      <div className="px-2 py-2 bg-orange-50 border-t border-orange-200">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-white hover:bg-orange-50 transition-colors cursor-pointer border border-orange-200">
          <div className="relative w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
            <img
              src={user?.photoURL || ''}
              alt={user?.name?.charAt(0) || 'U'}
              className="w-full h-full rounded-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            {!user?.photoURL && (
              <span className="text-white text-sm font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            )}
            {/* <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div> */}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-orange-800 truncate">{user?.name || "Guest User"}</div>
            {/* <div className="text-xs text-green-600 font-semibold">Online</div> */}
          </div>
        </div>
      </div>

      {/* Community Popup Dialog */}
      {/* Removed Community Popup Dialog and related state/handlers from here */}
    </nav>
  );
};

export default Sidebar;
