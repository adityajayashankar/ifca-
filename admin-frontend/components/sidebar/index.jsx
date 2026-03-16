import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import PeopleIcon from "@mui/icons-material/People";
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from "@mui/icons-material/Home";
import ArticleIcon from '@mui/icons-material/Article';
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
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { selectCommunity } from "@/store/features/communitySlice";
import { useState } from "react";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import VisibilityIcon from '@mui/icons-material/Visibility';

const Sidebar = ({ comDetails, setShowSidebar, isMobile, setShowSubcommunityPopup, isCollapsed }) => {
  const router = useRouter();
  const location = router.asPath;
  const comId = router.query.comId || location.split("/").pop();

  // Thread submenu state
  const [showThreadSub, setShowThreadSub] = useState(location.includes("comThreads"));
  // Communities submenu state
  const [showCommunitiesSub, setShowCommunitiesSub] = useState(false);

  // Helper function to get icon based on community type and title
  const getCommunityIcon = (community) => {
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
  };

  // Helper function to get community type label
  const getCommunityTypeLabel = (community) => {
    if (community.communityType === 'DEFAULT') {
      return 'Group';
    }
    return 'Subcommunity';
  };

  // Separate child communities by type
  const defaultCommunities = comDetails?.childCommunities?.filter(community => 
    community.communityType === 'DEFAULT'
  ) || [];
  
  const otherCommunities = comDetails?.childCommunities?.filter(community => 
    community.communityType !== 'DEFAULT'
  ) || [];

  // Check if current community is DEFAULT type (hide Add Subcommunity button)
  const isCurrentCommunityDefault = comDetails?.communityType === 'DEFAULT';

  // Menu items
  const menuItems = [
    {
      icon: <HomeIcon fontSize="medium" />, 
      label: "Home", 
      onClick: () => { 
        if (comId) {
          router.push(`/comHome/${comId}`); 
          if (isMobile) setShowSidebar(false); 
        }
      }, 
      isActive: location.includes("comHome")
    },
    {
      icon: <ChatBubbleOutlineOutlinedIcon fontSize="medium" />, 
      label: "Thread", 
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
    // Only show Communities button if there are child communities
    ...(defaultCommunities.length > 0 || otherCommunities.length > 0 ? [{
      icon: <PeopleIcon fontSize="medium" />, 
      label: "Communities", 
      onClick: () => setShowCommunitiesSub((prev) => !prev), 
      isActive: location.includes("communities"),
      children: [
        // Default communities (Groups) first
        ...defaultCommunities.map(community => ({
          icon: getCommunityIcon(community),
          label: community.title,
          image: community.bannerImg,
          type: getCommunityTypeLabel(community),
          onClick: () => { 
            router.push(`/admin/community/${community.id}`); 
            if (isMobile) setShowSidebar(false); 
          },
          isActive: location.includes(`/community/${community.id}`)
        })),
        // Other communities (Subcommunities) second
        ...otherCommunities.map(community => ({
          icon: getCommunityIcon(community),
          label: community.title,
          image: community.bannerImg,
          type: getCommunityTypeLabel(community),
          onClick: () => { 
            router.push(`/admin/community/${community.id}`); 
            if (isMobile) setShowSidebar(false); 
          },
          isActive: location.includes(`/community/${community.id}`)
        }))
      ]
    }] : []),
    {
      icon: <ArticleIcon fontSize="medium" />, 
      label: "Join Requests", 
      onClick: () => { 
        if (comId) {
          router.push(`/comRequest/${comId}`); 
          if (isMobile) setShowSidebar(false); 
        }
      }, 
      isActive: location.includes("comRequest")
    },
  ];

  return (
    <nav className={`h-full flex flex-col bg-white text-gray-700 overflow-hidden z-[40] border-r border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-full'}`}>
      {/* Server Header */}
      <div className={`flex items-center gap-3 px-4 py-3 bg-orange-50 border-b border-orange-200 relative transition-all duration-300 ${isCollapsed ? 'justify-center px-2' : ''}`}>
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
        {!isCollapsed && (
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-orange-800 truncate">{comDetails?.title || "Community"}</div>
          <div className="text-xs text-orange-600 truncate">{comDetails?.description || "Welcome!"}</div>
        </div>
        )}
        {isMobile && !isCollapsed && (
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
              className={`w-full flex items-center gap-3 px-2 py-1.5 rounded text-sm font-medium transition-colors group
                ${item.isActive 
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
                (item.label === "Thread" ? showThreadSub : showCommunitiesSub) ? 
                <ExpandLessIcon fontSize="small" className="text-orange-500 group-hover:text-orange-600" /> : 
                <ExpandMoreIcon fontSize="small" className="text-orange-500 group-hover:text-orange-600" />
              )}
            </button>
            
            {/* Submenu */}
            {!isCollapsed && item.children && ((item.label === "Thread" && showThreadSub) || (item.label === "Communities" && showCommunitiesSub)) && (
              <div className={`ml-4 mt-1 flex flex-col ${item.label === "Communities" ? 'max-h-[280px] overflow-y-auto relative' : ''}`}>
                {/* Communities list with scrollable area */}
                {item.label === "Communities" && (
                  <div className="flex-1 overflow-y-auto pb-16">
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
                        <div className="flex-1 min-w-0 text-left">
                          <div className="truncate">{child.label}</div>
                          {child.type && (
                            <div className={`text-xs ${child.isActive ? 'text-orange-600' : 'text-gray-400 group-hover:text-orange-500'}`}>
                              {child.type}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Thread submenu items */}
                {item.label === "Thread" && item.children.map((child, cidx) => (
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
                    <span className="text-base">{child.icon}</span>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="truncate">{child.label}</div>
                    </div>
                  </button>
                ))}
                
                {/* Sticky Add Subcommunity button for Communities section */}
                {item.label === "Communities" && showCommunitiesSub && !isCurrentCommunityDefault && (
                  <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-orange-200 px-2 py-2">
                    <button
                      onClick={() => {
                        setShowSubcommunityPopup(true);
                        if (isMobile) setShowSidebar(false);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm font-medium transition-colors group text-gray-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                      <div className="relative w-6 h-6 rounded overflow-hidden flex-shrink-0 bg-orange-100 flex items-center justify-center">
                        <AddIcon fontSize="small" className="text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="truncate">Add Subcommunity</div>
                        <div className="text-xs text-gray-400 group-hover:text-orange-500">Action</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
};

export default Sidebar;
