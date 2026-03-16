import {
  selectCommunity,
  selectCommunitySessions,
  selectCommunityUsers,
  setCommunityUsers,
} from "@/store/features/communitySlice";
import { selectCommunityPosts } from "@/store/features/postsSlice";
import { selectSubscribedCommunities, getUserSubscribedCommunities, selectUser } from "@/store/features/userSlice";
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import RightBar from "../rightBar";
import Sidebar from "../sidebar";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Topbar from "@/components/topbar/Topbar";
import GroupsIcon from "@mui/icons-material/Groups";
import ExploreIcon from "@mui/icons-material/Explore";
import Link from "next/link";
import PostModal from "@/components/post/PostModals";
import Image from "next/image";
import { createPortal } from "react-dom";
import VisibilityIcon from '@mui/icons-material/Visibility';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import LiveTvIcon from '@mui/icons-material/LiveTv';

const Layout = ({ children }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const comDetails = useSelector(selectCommunity);
  const currentCommunityUsers = useSelector(selectCommunityUsers);
  const communitySessions = useSelector(selectCommunitySessions);
  const posts = useSelector(selectCommunityPosts);
  const userCommunities = useSelector(selectSubscribedCommunities);
  const user = useSelector(selectUser);
  console.log("user?????", user);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Load right sidebar state from localStorage on mount - default to closed
  const [showRightSidebar, setShowRightSidebar] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rightSidebarOpen');
      return saved !== null ? JSON.parse(saved) : false;
    }
    return false;
  });
  
  const [isCommunitiesHovered, setIsCommunitiesHovered] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, title: '', top: 0, left: 0 });
  const iconRefs = useRef({});
  const [showCommunityPopup, setShowCommunityPopup] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);

  
  useEffect(() => {
    if (user) {
      dispatch(getUserSubscribedCommunities(user.id));
    }
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 1024);
      if (width < 1024) {
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for member changes from other pages (like comRequest)
  useEffect(() => {
    const handleMembersChanged = (event) => {
      const { communityId } = event.detail;
      if (communityId && comDetails?.id === communityId) {
        dispatch(setCommunityUsers(communityId));
      }
    };

    window.addEventListener('membersChanged', handleMembersChanged);
    return () => {
      window.removeEventListener('membersChanged', handleMembersChanged);
    };
  }, [dispatch, comDetails?.id]);

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const toggleRightSidebar = () => {
    const newState = !showRightSidebar;
    setShowRightSidebar(newState);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('rightSidebarOpen', JSON.stringify(newState));
    }
  };

  // Expose toggle functions to window for access from child components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.toggleRightSidebar = toggleRightSidebar;
      window.showRightSidebar = showRightSidebar;
      window.toggleLeftSidebar = toggleSidebar;
      window.showLeftSidebar = showSidebar;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.toggleRightSidebar;
        delete window.showRightSidebar;
        delete window.toggleLeftSidebar;
        delete window.showLeftSidebar;
      }
    };
  }, [showRightSidebar, showSidebar]);

  const handleCommunityClick = (communityId) => {
    if (communityId && communityId !== 'undefined' && communityId !== 'null' && 
        (typeof communityId === 'string' ? communityId.trim() !== '' : true)) {
      router.push(`/comHome/${communityId}`);
    }
  };

  // Add a handler to open the popup globally
  const openCommunityPopup = (community) => {
    setSelectedCommunity(community);
    setShowCommunityPopup(true);
  };
  const handleViewDetails = () => {
    if (selectedCommunity) {
      router.push(`/communityDetails/${selectedCommunity.id}`);
      setShowCommunityPopup(false);
      setSelectedCommunity(null);
    }
  };
  const handleJoinCommunity = () => {
    if (selectedCommunity) {
      router.push(`/communitySub/${selectedCommunity.id}`);
      setShowCommunityPopup(false);
      setSelectedCommunity(null);
    }
  };

  return (
    <>
      <header className="h-16 bg-white shadow-md z-50">
        <Topbar toggleSidebar={toggleSidebar} showSidebar={showSidebar} />
      </header>
      <div className="h-[calc(100vh-65px)] flex flex-col overflow-hidden bg-gray-50">
        <div className="flex flex-1 overflow-hidden">
          {/* Mobile Open Arrow Button */}
          {!showSidebar && isMobile && (
            <button
              onClick={() => setShowSidebar(true)}
              className="fixed z-50 top-28 left-0 bg-orange-500 text-white p-2 rounded-r-2xl shadow-lg transition-all"
              aria-label="Open sidebar"
            >
              <ArrowForwardIosIcon />
            </button>
          )}

          {/* Mobile Overlay */}
          <div
            className={`fixed inset-0 bg-black transition-opacity duration-300 z-30 lg:hidden
              ${showSidebar ? 'opacity-50' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setShowSidebar(false)}
          />

          {/* Subscribed Communities Sidebar */}
          <aside
            onMouseEnter={() => setIsCommunitiesHovered(true)}
            onMouseLeave={() => setIsCommunitiesHovered(false)}
            className={`fixed lg:relative flex-shrink-0 h-full transition-all duration-300 overflow-hidden ease-in-out bg-white border-r border-gray-200 ${isCommunitiesHovered ? 'z-[70]' : 'z-50'}
              ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              ${isMobile ? (showSidebar ? 'w-full h-full absolute top-16' : 'w-0 h-full') : (showSidebar ? 'w-[64px]' : 'w-[64px]')}`}
          >
            <div className={`h-full py-4 ${isCommunitiesHovered ? 'overflow-y-auto' : 'overflow-y-auto'} scrollbar-thin scrollbar-thumb-orange-200 scrollbar-track-gray-100`} style={{overflowX: 'hidden'}}>
              <div className="px-2">
                <div className="space-y-3">
                  {userCommunities?.map((community) => (
                    <div
                      key={community.id}
                      className="relative group cursor-pointer"
                      onClick={() => handleCommunityClick(community.id)}
                      onMouseEnter={e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({
                          visible: true,
                          title: community.title,
                          top: rect.top + rect.height / 2,
                          left: rect.right + 8
                        });
                      }}
                      onMouseLeave={() => setTooltip({ ...tooltip, visible: false })}
                      ref={el => iconRefs.current[community.id] = el}
                    >
                      {comDetails?.id === community.id && (
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-full transition-all duration-200"></div>
                      )}
                      {/* Community Image */}
                      <div className={`w-10 h-10 mx-auto overflow-hidden transition-all duration-200 border-2 border-transparent group-hover:border-orange-400 ${comDetails?.id === community.id ? 'rounded-2xl border-orange-500' : 'rounded-full group-hover:rounded-2xl'}`}>
                        <img
                          src={community.bannerImg || community.infoImgs?.[0] || "/tablaImgClass.svg"}
                          alt={community.title}
                          className="w-full h-full object-contain bg-black"
                          onError={(e) => {
                            e.target.src = "/tablaImgClass.svg";
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="w-8 mx-auto border-b-2 border-gray-200 my-3"></div>

                  {/* Explore Communities Icon */}
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => router.push('/communities')}
                    onMouseEnter={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({
                        visible: true,
                        title: 'Explore Communities',
                        top: rect.top + rect.height / 2,
                        left: rect.right + 8
                      });
                    }}
                    onMouseLeave={() => setTooltip({ ...tooltip, visible: false })}
                  >
                    <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center hover:bg-orange-100 hover:rounded-2xl transition-all duration-200">
                      <ExploreIcon className="text-orange-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Sidebar */}
          <aside
            className={`fixed lg:relative flex-shrink-0 h-full transition-all duration-300 ease-in-out bg-white border-r border-gray-200 
              ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              ${isMobile ? (showSidebar ? 'w-full h-full absolute top-16 left-0' : 'w-0 h-full') : 'w-60'}`}
            style={isMobile && showSidebar ? { zIndex: 100 } : {}}
          >
            <div className="h-full overflow-hidden">
              <Sidebar
                comDetails={comDetails}
                setShowSidebar={setShowSidebar}
                isCollapsed={!showSidebar}
                isMobile={isMobile}
                openCommunityPopup={openCommunityPopup}
              />
            </div>
            {/* Mobile close button overlay */}
            {isMobile && showSidebar && (
              <button
                onClick={() => setShowSidebar(false)}
                className="absolute top-4 right-4 z-[101] bg-white rounded-full p-2 shadow-lg border border-gray-200"
                aria-label="Close sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-orange-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col xl:flex-row overflow-hidden bg-gray-50  flex-grow">
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
              <div className="max-w-[1600px] mx-auto">
                <div className="flex">
                  <div className={`flex flex-col justify-between min-h-[calc(100vh-77px)] bg-white ${showRightSidebar ? 'border-r border-gray-200' : ''} w-full basis-auto ${showRightSidebar ? 'md:w-[75%] md:basis-[75%]' : 'md:w-full md:basis-full'}`}>
                    <div className=" overflow-y-auto">
                      {children}
                    </div>
                    <div className="flex-shrink-0 sticky bottom-0 bg-white p-[11px] border-t border-gray-200 shadow-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={user?.photoURL || "/notImg.svg"}
                            alt="Profile"
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                        <button
                          onClick={() => setShowPostModal(true)}
                          className="flex-1 text-left rounded-full px-4 py-2 text-base bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer transition-colors"
                          disabled={!userCommunities || userCommunities.length === 0}
                          title={!userCommunities || userCommunities.length === 0 ? "Join a community first to start posting" : "Start a post"}
                        >
                          {!userCommunities || userCommunities.length === 0 ? "Join a community to post..." : "Start a post..."}
                        </button>
                        {/* CatchUp Button - Show on comHome and comThreads pages */}
                        {(router.pathname.includes('/comHome') || router.pathname.includes('/comThreads')) && comDetails?.id && (
                          <button
                            onClick={() => {
                              const comId = router.query.id;
                              if (comId) {
                                router.replace(
                                  {
                                    pathname: `/comHome/[id]`,
                                    query: { id: comId, tab: 'catchup' }
                                  },
                                  `/comHome/${comId}?tab=catchup`,
                                  { shallow: true }
                                );
                              }
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors flex-shrink-0"
                            title="Go to CatchUp"
                          >
                            <LiveTvIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">CatchUp</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Sidebar */}
                  {showRightSidebar && (
                  <div className="w-full flex-shrink-0 h-[calc(100vh-65px)] min-h-[calc(100vh-65px)] sticky top-0 right-0 basis-auto md:w-[25%] md:basis-[25%]">
                    <div className="h-full">
                      <RightBar
                        comDetails={comDetails}
                        currentCommunityUsers={currentCommunityUsers}
                        communitySessions={communitySessions}
                        posts={posts}
                        onMembersChanged={() => {
                          // Refresh community users when members change
                          if (comDetails?.id) {
                            dispatch(setCommunityUsers(comDetails.id));
                          }
                        }}
                      />
                    </div>
                  </div>
                  )}
                  
                  {/* Floating Open Button - Show when sidebar is closed */}
                  {!showRightSidebar && (
                    <button
                      onClick={toggleRightSidebar}
                      className="fixed right-0 top-20 z-50 bg-orange-500 hover:bg-orange-600 text-white rounded-l-full rounded-r-none p-3 shadow-lg border-2 border-white border-r-0 transition-all duration-200 hover:scale-110"
                      aria-label="Open Sidebar"
                      title="Open Sidebar"
                    >
                      <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PostModal
        open={showPostModal}
        onClose={() => { setShowPostModal(false); setEditingPost(null); }}
        user={user}
        userCommunities={userCommunities}
        refreshFeed={() => router.replace(router.asPath)}
        editingPost={editingPost}
        setEditingPost={setEditingPost}
        fixedCommunity={comDetails}
      />
      {/* Community Popup Dialog - now global and full screen */}
      {showCommunityPopup && (
        <div className="fixed inset-0 w-screen h-screen bg-black bg-opacity-40 z-[9999] flex items-center justify-center">
          <div className="bg-white max-w-lg w-full rounded-xl shadow-2xl p-6 relative flex flex-col items-center">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-base bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg z-10"
              onClick={() => {
                setShowCommunityPopup(false);
                setSelectedCommunity(null);
              }}
              aria-label="Close"
            >
              &times;
            </button>
            {/* Content */}
            <div className="w-full flex flex-col items-center justify-center">
              <div className="text-center pb-4 px-4 pt-4 flex-shrink-0">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 shadow-lg">
                    <img
                      src={selectedCommunity?.bannerImg || "/comPic.svg"}
                      alt={selectedCommunity?.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/comPic.svg";
                      }}
                    />
                  </div>
                </div>
                <h2 className="text-base font-bold text-gray-900 mb-2">{selectedCommunity?.title}</h2>
                <p className="text-sm text-gray-600 max-w-md mx-auto">{selectedCommunity?.description}</p>
              </div>
              <div className="text-center px-4 flex-shrink-0">
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200 mb-4 max-w-md mx-auto">
                  <p className="text-base text-orange-800 font-medium">
                    You're not a member of this community yet. Would you like to view details or join?
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-0 justify-center flex-shrink-0 w-full">
                <button
                  onClick={() => {
                    setShowCommunityPopup(false);
                    setSelectedCommunity(null);
                  }}
                  className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-base transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleViewDetails}
                  className="px-6 py-2 border-2 border-orange-300 text-orange-600 rounded-xl hover:bg-orange-50 font-semibold flex items-center justify-center gap-2 text-base transition-colors"
                >
                  <VisibilityIcon className="text-orange-500" /> View Details
                </button>
                <button
                  onClick={handleJoinCommunity}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 text-base transition-colors shadow-lg"
                >
                  <GroupAddIcon className="text-white" /> Join Community
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Tooltip rendered in portal */}
      {typeof window !== 'undefined' && tooltip.visible && createPortal(
        <div
          className="fixed z-[9999] bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap"
          style={{
            top: tooltip.top,
            left: tooltip.left,
            transform: 'translateY(-50%)',
            minWidth: '120px',
          }}
        >
          {tooltip.title}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Layout;
