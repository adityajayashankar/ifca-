import {
  selectCommunity,
  selectCommunitySessions,
  selectCommunityUsers,
  selectAllCommunities,
  setCommunities,
  setCommunityUsers,
  setCommunitySessions,
} from "@/store/features/communitySlice";
import { selectCommunityPosts } from "@/store/features/postsSlice";
import { selectUser } from "@/store/features/userSlice";
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import RightBar from "../rightBar";
import Sidebar from "../sidebar";
import Topbar from "../topbar/Topbar";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CreateCommunityForm from "../community/CreateCommunityForm";
import GroupsIcon from "@mui/icons-material/Groups";
import CloseIcon from '@mui/icons-material/Close';
import PostModal from "@/components/post/PostModals";
import Image from "next/image";
import { createPortal } from "react-dom";

const Layout = ({ children }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const comDetails = useSelector(selectCommunity);
  const currentCommunityUsers = useSelector(selectCommunityUsers);
  const communitySessions = useSelector(selectCommunitySessions);
  const posts = useSelector(selectCommunityPosts);
  const userCommunities = useSelector(selectAllCommunities);
  const user = useSelector(selectUser);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [showSubcommunityPopup, setShowSubcommunityPopup] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postModalType, setPostModalType] = useState('post');
  const [editingPost, setEditingPost] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, title: '', top: 0, left: 0 });
  const iconRefs = useRef({});

  useEffect(() => {
    if (user) {
      dispatch(setCommunities());
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

  useEffect(() => {
    const openModal = (e) => {
      if (e && e.detail && e.detail.postType) {
        setPostModalType(e.detail.postType);
      } else {
        setPostModalType('post');
      }
      setShowPostModal(true);
    };
    window.addEventListener('openPostModal', openModal);
    return () => window.removeEventListener('openPostModal', openModal);
  }, []);

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const toggleRightSidebar = () => {
    setShowRightSidebar(!showRightSidebar);
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

  const handleClosePopup = () => {
    setShowSubcommunityPopup(false);
  };

  const handleCommunityCreated = () => {
    setShowSubcommunityPopup(false);
    // Optionally refresh the community data or redirect
    window.location.reload();
  };

  return (
    <>
      {/* <header className="h-16 bg-white shadow-md z-50">
        <Topbar toggleSidebar={toggleSidebar} showSidebar={showSidebar} />
      </header> */}
      <div className="h-[calc(100vh-78px)] flex flex-col overflow-hidden bg-gray-50" style={{ maxHeight: 'calc(100vh - 78px)', height: 'calc(100vh - 78px)' }}>
        <div className="flex flex-1 overflow-hidden" style={{ maxHeight: '100%', height: '100%' }}>
          {/* Mobile Open Arrow Button */}
          {!showSidebar && isMobile && (
            <button
              onClick={() => setShowSidebar(true)}
              className="fixed z-50 top-28 left-0 bg-orange-500 text-white p-2 rounded-r-2xl shadow-lg transition-all hover:bg-orange-600"
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

          {/* Main Sidebar */}
          <aside 
            onMouseEnter={() => !isMobile && !showSidebar && setIsHovered(true)}
            onMouseLeave={() => !isMobile && setIsHovered(false)}
            className={`fixed lg:relative flex-shrink-0 h-full transition-all duration-300 ease-in-out bg-white border-r border-gray-200 z-30
              ${showSidebar ? 'translate-x-0' : (isMobile ? '-translate-x-full' : 'translate-x-0')}
              ${isMobile ? (showSidebar ? 'w-full h-full absolute top-16 left-0' : 'w-0 h-full') : (showSidebar ? 'w-60' : 'w-16')}`}
            style={isMobile && showSidebar ? { zIndex: 100 } : {}}
          >
            <div className="h-full overflow-hidden">
              <Sidebar 
                comDetails={comDetails} 
                setShowSidebar={setShowSidebar} 
                isCollapsed={!showSidebar && !isHovered}
                isMobile={isMobile}
                setShowSubcommunityPopup={setShowSubcommunityPopup}
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
          <div className="flex-1 flex flex-col xl:flex-row overflow-hidden bg-gray-50 w-full max-w-full" style={{ maxHeight: '100%', height: '100%' }}>
            <div className="flex-1 overflow-hidden min-w-0 w-full max-w-full flex flex-col" style={{ maxHeight: '100%', height: '100%' }}>
              <div className="max-w-[1600px] mx-auto w-full h-full flex flex-col">
                <div className="flex w-full max-w-full overflow-x-hidden h-full flex-1 min-h-0">
                  <div className="flex-1 flex flex-col justify-between bg-white border-r border-gray-200 min-w-0 overflow-x-hidden" style={{ maxHeight: '100%', height: '100%' }}>
                    <div className="flex-grow overflow-y-auto overflow-x-hidden w-full" style={{ maxHeight: 'calc(100% - 73px)', overflowY: 'auto' }}>
                      {children}
                    </div>
                    <div className="flex-shrink-0 bg-white p-3 border-t border-gray-200 shadow-lg overflow-x-hidden w-full" style={{ minHeight: '73px' }}>
                      <div className="flex items-center space-x-3 w-full min-w-0">
                        <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-orange-200">
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
                          className="flex-1 text-left rounded-full px-4 py-2.5 text-sm bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600 cursor-pointer transition-all duration-200 min-w-0 truncate shadow-sm border border-gray-200 hover:border-orange-200"
                          disabled={!userCommunities || userCommunities.length === 0}
                          title={!userCommunities || userCommunities.length === 0 ? "No communities available to post to" : "Start a post"}
                        >
                          {!userCommunities || userCommunities.length === 0 ? "No communities available..." : "Start a post..."}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Sidebar */}
                  {showRightSidebar && (
                    <div className="hidden xl:block w-72 flex-shrink-0 overflow-x-hidden bg-white border-l border-gray-200" style={{ maxHeight: '100%', height: '100%' }}>
                      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
                        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full" style={{ maxHeight: '100%', overflowY: 'auto' }}>
                        <RightBar
                          comDetails={comDetails}
                          currentCommunityUsers={currentCommunityUsers}
                          communitySessions={communitySessions}
                          posts={posts}
                          onMembersChanged={() => dispatch(setCommunityUsers(comDetails?.id))}
                          onSessionsChanged={() => dispatch(setCommunitySessions(comDetails?.id))}
                        />
                      </div>
                    </div>
                  </div>
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
        postType={postModalType}
      />

      {/* Subcommunity Creation Popup */}
      {showSubcommunityPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
              <div className="flex items-center gap-3">
                <GroupsIcon className="text-2xl text-orange-500" />
                <h2 className="text-2xl font-bold text-gray-900">Create Subcommunity</h2>
              </div>
              <button
                onClick={handleClosePopup}
                className="p-2 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-600 transition-colors"
              >
                <CloseIcon fontSize="medium" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="p-6">
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold text-blue-800">Parent Community</span>
                  </div>
                  <p className="text-blue-700 text-sm">
                    Creating a subcommunity for: <strong>{comDetails?.title}</strong>
                  </p>
                </div>
                
                <CreateCommunityForm 
                  isEdit={false} 
                  baseURL="admin"
                  parentCommunityId={comDetails?.id}
                  onSuccess={handleCommunityCreated}
                  onCancel={handleClosePopup}
                  isPopup={true}
                />
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
