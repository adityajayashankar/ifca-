import React, { useState, useRef, useEffect, useCallback } from "react";
import Layout from "@/components/layout";
import Head from "next/head";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import sessionRoomType from "../../utils/sessionRoomType";
import EventSchedule from "@/components/eventSchedule";
import ClassSchedule from "@/components/classSchedule";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import LinkIcon from "@mui/icons-material/Link";
import BookOutlinedIcon from "@mui/icons-material/BookOutlined";
import ImportContactsOutlinedIcon from "@mui/icons-material/ImportContactsOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import VideoCom from "@/components/videoCom";
import { useSelector, useDispatch } from "react-redux";
import moment from "moment";
import { useRouter } from "next/router";
import companyData from "@/utils/data";
import ClassCard from "@/components/classCard";
import { selectCommunityPosts, setCommunityPosts, selectLikeMap } from "@/store/features/postsSlice";
import { selectCommunityResources, setResourcesCommunity } from "@/store/features/resourceSlice";
import { selectAllVideos, setAllVideos } from "@/store/features/videoSlice";
import {
    selectUser,
    selectUserCommunities,
} from "@/store/features/userSlice";
import { useLayoutEffect } from "react";
import api, { apiSetup } from "@/utils/apiSetup";
import axios from "axios";
import { toast } from "react-toastify";
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Services, { ServiceActions } from "@/components/services";
import ResourceAddModal from "@/components/common/ResourceAddModal";
import PostModal from "@/components/post/PostModals";
import PostX from "@/components/SocialPost/PostX";
import Poll from "@/components/chat/polls";
import JoinConfirmationModal from "@/components/common/JoinConfirmationModal";
import CatchUpModal from "@/components/common/CatchUpModal";
import ScheduledCatchup from "@/components/scheduledCatchup";
import { MdVideocam, MdSchedule, MdGroups } from "react-icons/md";
import { motion } from "framer-motion";
import { useCatchupAttendance } from "@/hooks/useCatchupAttendance";
import Image from "next/image";
import EventIcon from "@mui/icons-material/Event";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import DescriptionIcon from "@mui/icons-material/Description";
import BusinessIcon from "@mui/icons-material/Business";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FolderIcon from "@mui/icons-material/Folder";
import GroupIcon from "@mui/icons-material/Group";
import ScheduleIcon from "@mui/icons-material/Schedule";
import LiveTvIcon from "@mui/icons-material/LiveTv";
import ForumIcon from "@mui/icons-material/Forum";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import TableChartIcon from "@mui/icons-material/TableChart";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SendIcon from "@mui/icons-material/Send";
import StarIcon from "@mui/icons-material/Star";
import GroupsIcon from "@mui/icons-material/Groups";
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArchiveIcon from '@mui/icons-material/Archive';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  checkCatchUpLive,
  resources,
  selectAllCommunities,
  selectCatchUp,
  selectCommunity,
  selectCommunitySessions,
  selectCommunityUsers,
  setCommunityById,
  setCommunityCatchUpOwner,
  setCommunityCatchup,
  setCommunitySessions,
  setCommunityUsers,
  setResources,
  setVerifyCatchupLive,
} from "@/store/features/communitySlice";
import LikesModal from "@/components/post/LikesModal";
import useLikesModal from "@/hooks/useLikesModal";
import PollVotersModal from "@/components/post/PollVotersModal";
import usePollVotersModal from "@/hooks/usePollVotersModal";
import DotsMenu from "@/components/common/DotsMenu";
import ShareModal from "@/components/common/ShareModal";

const comHome = () => {
    const [selectedLink, setSelectedLink] = useState(1);
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
    const router = useRouter();
    const { id } = router.query;
    const comId = id ? parseInt(id) : null;
    const user = useSelector(selectUser);
    const users = useSelector(selectCommunityUsers);
    const [openModal, setOpenModal] = useState(false);
    const allCommunities = useSelector(selectAllCommunities)
  const currentCommunity = useSelector(selectCommunity);
  const posts = useSelector(selectCommunityPosts);
  const likeMap = useSelector(selectLikeMap);
  const communitySessions = useSelector(selectCommunitySessions);
  const currResources = useSelector(selectCommunityResources);
  const dispatch = useDispatch();

  // Navigation tabs data
  const navigationTabs = [
    { id: 1, label: "Updates", icon: EventIcon },
    { id: 2, label: "Sessions", icon: VideoCallIcon },
    { id: 3, label: "Resources", icon: FolderIcon },
    { id: 7, label: "Huddles", icon: ForumIcon },
    { id: 6, label: "Forms", icon: AssignmentIcon },
    { id: 5, label: "Services", icon: BusinessIcon },
    { id: 4, label: "CatchUp", icon: LiveTvIcon },
  ];

  // Add poll modal states
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState([{ text: "" }, { text: "" }]);
  const [pollExpiresAt, setPollExpiresAt] = useState("");
  const [editingPoll, setEditingPoll] = useState(null);

  // Add CatchUp modal states
  const [showCatchUpModal, setShowCatchUpModal] = useState(false);
  const [scheduledCatchups, setScheduledCatchups] = useState([]);
  
  // Add attendance tracking states
  const [catchupAttendees, setCatchupAttendees] = useState([]);
  const [showAttendees, setShowAttendees] = useState(false);
  
  // Add inline form states
  const [showInstantForm, setShowInstantForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDescription, setScheduleDescription] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // const isLive = useSelector(checkCatchUpLive)
  const [showSearch, setShowSearch] = useState(false);
    const [descExpanded, setDescExpanded] = useState(false);
    const [stickyShadow, setStickyShadow] = useState(false);
    const stickyRef = useRef(null);
    const navScrollRef = useRef(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);
    const descRef = useRef(null);
    const [descTruncated, setDescTruncated] = useState(false);

  // Add state for live catchup
  const [liveCatchup, setLiveCatchup] = useState(null);
  const [showJoinConfirmation, setShowJoinConfirmation] = useState(false);
  const [joinConfirmationData, setJoinConfirmationData] = useState(null);
  const [isCheckingLiveCatchup, setIsCheckingLiveCatchup] = useState(false);

  // Add state for huddles
  const [huddles, setHuddles] = useState([]);
  const [loadingHuddles, setLoadingHuddles] = useState(false);
  const [huddleViewMode, setHuddleViewMode] = useState('card'); // 'card' or 'table'
  const [showMoreHuddles, setShowMoreHuddles] = useState(false);
  const [visibleHuddlesCount, setVisibleHuddlesCount] = useState(3);

  // Fetch community huddles - defined early to be available in useEffects
  const fetchCommunityHuddles = useCallback(async (communityId) => {
    try {
      setLoadingHuddles(true);
      const response = await api.get(`/huddle/community/${communityId}`);
      if (response.data && response.data.success) {
        const fetchedHuddles = response.data.huddles || [];
        
        // Sort huddles: Live first, then Upcoming, then Completed last
        // Within each category, sort by date (current to past)
        const sortedHuddles = fetchedHuddles.sort((a, b) => {
          // Priority: Live (3) > Upcoming (2) > Completed (1) > Draft (0)
          const getPriority = (h) => {
            if (h.isLive) return 3;
            if (h.isScheduled && !h.endTime) return 2;
            if (h.endTime) return 1;
            return 0;
          };
          
          const priorityA = getPriority(a);
          const priorityB = getPriority(b);
          
          // First sort by priority (descending - higher priority first)
          if (priorityA !== priorityB) {
            return priorityB - priorityA;
          }
          
          // Within same priority, sort by date (most recent first for live/upcoming, most recent last for completed)
          const dateA = new Date(a.scheduledTime || a.createdAt).getTime();
          const dateB = new Date(b.scheduledTime || b.createdAt).getTime();
          
          // For completed huddles, show most recent first (descending)
          // For live/upcoming, show soonest first (ascending for upcoming, most recent for live)
          if (priorityA === 1) { // Both completed
            return dateB - dateA; // Most recent completed first
          } else if (priorityA === 2) { // Both upcoming
            return dateA - dateB; // Soonest upcoming first
          } else if (priorityA === 3) { // Both live
            return dateB - dateA; // Most recently started live first
          }
          
          return dateB - dateA; // Default: most recent first
        });
        
        setHuddles(sortedHuddles);
        // Reset showMoreHuddles when new huddles are fetched
        setShowMoreHuddles(false);
      } else {
        setHuddles([]);
      }
    } catch (error) {
      console.error('Error fetching community huddles:', error);
      setHuddles([]);
    } finally {
      setLoadingHuddles(false);
    }
  }, []);

  // Add likes modal hook
  const {
    isOpen: likesModalOpen,
    currentPostId: likesModalPostId,
    currentLikeCount: likesModalLikeCount,
    openLikesModal,
    closeLikesModal
  } = useLikesModal();

  // Add poll voters modal hook
  const {
    pollVotersModalOpen,
    pollVotersModalPostId,
    pollVotersModalTotalVotes,
    openPollVotersModal,
    closePollVotersModal
  } = usePollVotersModal();

  // Add state for services at the top
  const [services, setServices] = useState([]);
  // Add state to control add service modal at the top
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [showArchivedPosts, setShowArchivedPosts] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceResponses, setServiceResponses] = useState([]);
  const [shareMenuOpen, setShareMenuOpen] = useState(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showMediumOptions, setShowMediumOptions] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalData, setShareModalData] = useState({});

      // Add missing state variables
    const [showFixedSearch, setShowFixedSearch] = useState(false);
    const [postSearch, setPostSearch] = useState('');
  const [likes, setLikes] = useState({});
  const postRefs = useRef({});
  const [openMenu, setOpenMenu] = useState(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resourceSearch, setResourceSearch] = useState("");
  const [token, setToken] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [catchupDetails, setCatchupDetails] = useState(null);

  // Add comment-related state variables
  const [openComments, setOpenComments] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [openCommentMenu, setOpenCommentMenu] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [postComments, setPostComments] = useState({});
  const [loadingComments, setLoadingComments] = useState({});

  // Add click outside handler for menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside menu containers
      const isMenuClick = event.target.closest('.menu-container');
      const isShareMenuClick = event.target.closest('.share-menu-container');
      const isCommentMenuClick = event.target.closest('.comment-menu-container');
      const isCommentSectionClick = event.target.closest('.comment-section-container');
      
      if (openMenuId && !isMenuClick) {
        setOpenMenuId(null);
      }
      
      if (shareMenuOpen && !isShareMenuClick) {
        setShareMenuOpen(null);
      }

      if (openCommentMenu && !isCommentMenuClick) {
        setOpenCommentMenu(null);
      }

      if (openComments && !isCommentSectionClick) {
        setOpenComments(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMenuId, shareMenuOpen, openCommentMenu, openComments]);
  
  // Add missing state variables that are being used
  const [isLive, setLive] = useState(false);
  const [activeRoom, setActiveRoom] = useState("");
  const allVideos = useSelector(selectAllVideos);
  const [selectedForm, setSelectedForm] = useState(null);

    const thisCommunity = allCommunities?.filter((com) => com.id === comId)[0]
    const userId = user?.unifiedUser?.id
    const communityId = thisCommunity
  const userCommunitiesIds = useSelector(selectUserCommunities)?.map((item) => {
    return item.id;
  });

    // Add scroll event for sticky shadow
    useEffect(() => {
        const handleScroll = () => {
            if (stickyRef.current) {
                const { top } = stickyRef.current.getBoundingClientRect();
                setStickyShadow(top < 10);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (descRef.current) {
            setDescTruncated(descRef.current.scrollWidth > descRef.current.clientWidth);
        }
    }, [currentCommunity?.desc, descExpanded]);

    // Check for live catchup on component mount and when community changes
    useEffect(() => {
        if (comId) {
            checkLiveCatchup();
        }
    }, [comId]);

    // Periodic check for live catchup status (every 30 seconds)
    useEffect(() => {
        if (!comId) return;
        
        const interval = setInterval(() => {
            checkLiveCatchup();
        }, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, [comId]);





  

    // useLayoutEffect(() => {
    //   if (userCommunitiesIds && !userCommunitiesIds.includes(comId)) {
    //     router.push(`/communityDetails/${comId}`);
    //   }
    // }, [userCommunitiesIds, comId, router]);

    const catchup = useSelector(selectCatchUp);

    useEffect(() => {
        if (comId && router.isReady) {
            setIsLoading(true);
            dispatch(setCommunityById({communityId:comId}));
            dispatch(setCommunityUsers(comId));
            dispatch(setCommunitySessions(comId));
            dispatch(setResources(comId));
            dispatch(setCommunityPosts(comId));
            fetchScheduledCatchups(); // Fetch scheduled catchups
            fetchCommunityHuddles(comId); // Fetch huddles
            setIsLoading(false);
        }
    }, [comId, router.isReady, dispatch, fetchCommunityHuddles]);



    // Refresh posts when archived toggle changes
    useEffect(() => {
        if (comId && (user?.userType === 'admin' || user?.unifiedUser?.adminId)) {
            dispatch(setCommunityPosts(comId));
        }
    }, [showArchivedPosts, comId, dispatch, user]);

    // Handle route changes
    useEffect(() => {
        if (router.isReady && id) {
            console.log('Route changed to community:', id);
            // Force re-render when route changes
            const newComId = parseInt(id);
            if (newComId && newComId !== comId) {
                console.log('Dispatching community data for:', newComId);
                dispatch(setCommunityById(newComId));
                dispatch(setCommunityUsers(newComId));
                dispatch(setCommunitySessions(newComId));
                dispatch(setResources(newComId));
                fetchCommunityHuddles(newComId);
            }
        }
    }, [router.isReady, id, comId, dispatch, fetchCommunityHuddles]);

    useEffect(() => {
        dispatch(setAllVideos());
    }, []);

    // Fetch scheduled catchups when community changes
    useEffect(() => {
        console.log("=== useEffect for fetchScheduledCatchups ===");
        console.log("comId:", comId);
        if (comId) {
            console.log("Calling fetchScheduledCatchups...");
            fetchScheduledCatchups();
        } else {
            console.log("comId is not available yet");
        }
    }, [comId]);

    // Check for live catchup periodically
    useEffect(() => {
        if (comId) {
            checkLiveCatchup();
            
            // Check every 30 seconds to keep UI updated
            const interval = setInterval(checkLiveCatchup, 30000);
            
            return () => clearInterval(interval);
        }
    }, [comId]);

    const currentCommunityUsers = useSelector(selectCommunityUsers);

    const expertDetails = currentCommunityUsers.filter((item) => {
        return item.expertId !== null;
    })[0];

    function handleClick() {
        router.push("/room/" + communitySessions[0]?.roomId);
    }

    // Admin action handlers
    const handlePostEdit = (post) => {
        setEditingPost(post);
        setShowPostModal(true);
    };

    const handlePostArchive = async (postId, isArchived) => {
        try {
            const response = await api.patch(`/thread/${postId}/archive`, { isArchived });
            if (response.data) {
                toast.success(`Post ${isArchived ? 'archived' : 'unarchived'} successfully`);
                // Refresh posts
                dispatch(setCommunityPosts(comId));
            }
        } catch (error) {
            toast.error("Failed to archive post");
        }
    };

    const handlePostDelete = async (postId) => {
        const confirmed = confirm("Are you sure you want to delete this post? This action cannot be undone.");
        if (confirmed) {
            try {
                const response = await api.delete(`/thread/${postId}`);
                if (response.data) {
                    toast.success("Post deleted successfully");
                    // Refresh posts
                    dispatch(setCommunityPosts(comId));
                }
            } catch (error) {
                toast.error("Failed to delete post");
            }
        }
    };

    // Add like and comment handlers
    const handleLike = async (postId) => {
        if (!user || !user.unifiedUser?.id) return;
        try {
            const currentLikeState = isPostLiked(postId);
            const newLikeState = !currentLikeState;
            
            // Optimistically update the UI
            setLikes(prev => ({ ...prev, [postId]: newLikeState }));
            
            // Make API call to like/unlike the post
            await api.patch(`/thread/${postId}/user/${user.unifiedUser.id}`);
            
            // Refresh posts to get updated like counts and Redux store
            dispatch(setCommunityPosts(comId));
            
            // Show feedback
            toast.success(newLikeState ? 'Post liked!' : 'Post unliked!', {
                autoClose: 1000,
                hideProgressBar: true,
            });
        } catch (error) {
            // Revert the optimistic update on error
            setLikes(prev => ({ ...prev, [postId]: !prev[postId] }));
            toast.error('Failed to update like status');
            console.error('Error liking/unliking post:', error);
        }
    };

    // Handle like click to open likes modal
    const handleLikeClick = (postId, likeCount) => {
        openLikesModal(postId, likeCount);
    };

    // Sync likes state with Redux store when likeMap changes
    useEffect(() => {
        if (likeMap && Object.keys(likeMap).length > 0) {
            // Initialize likes state from Redux store
            const initialLikes = {};
            Object.keys(likeMap).forEach(postId => {
                if (likeMap[postId] === 1) {
                    initialLikes[postId] = true;
                }
            });
            setLikes(initialLikes);
        }
    }, [likeMap]);

    // Helper function to check if a post is liked
    const isPostLiked = (postId) => {
        return likes[postId] === true || likeMap[postId] === 1;
    };

    // Comment handler (optimistic)
    const handleComment = async (postId) => {
        if (!user || !user.unifiedUser?.id || !commentText[postId]?.trim()) return;
        
        const commentContent = commentText[postId].trim();
        
        try {
            const payload = {
                content: commentContent,
                title: "",
                assetsData: [],
                tagsData: [],
                creatorId: user.unifiedUser.id,
                communityId: comId,
                parentPostId: postId
            };
            
            await api.post('/thread', payload);
            
            // Clear the comment input
            setCommentText(prev => ({ ...prev, [postId]: '' }));
            
            // Refresh posts to show the new comment
            dispatch(setCommunityPosts(comId));
            
            // Show success feedback
            toast.success('Comment posted successfully!', {
                autoClose: 2000,
                hideProgressBar: true,
            });
        } catch (error) {
            console.error('Error posting comment:', error);
            toast.error('Failed to post comment. Please try again.');
        }
    };

    // Comment edit handler
    const handleEditComment = async (commentId, currentContent) => {
        if (!user || !user.unifiedUser?.id) return;
        
        const newContent = prompt("Edit your comment:", currentContent);
        if (!newContent || newContent.trim() === currentContent.trim()) return;
        
        try {
            await api.patch(`/thread/${commentId}`, {
                content: newContent.trim()
            });
            setOpenCommentMenu(null);
            dispatch(setCommunityPosts(comId));
            toast.success('Comment updated successfully!');
        } catch (error) {
            console.error('Error updating comment:', error);
            toast.error('Failed to update comment. Please try again.');
        }
    };

    // Comment delete handler
    const handleDeleteComment = async (commentId) => {
        if (!user || !user.unifiedUser?.id) return;
        
        const confirmed = confirm("Are you sure you want to delete this comment? This action cannot be undone.");
        if (!confirmed) return;
        
        try {
            await api.delete(`/thread/${commentId}`);
            dispatch(setCommunityPosts(comId));
            toast.success('Comment deleted successfully!');
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error('Failed to delete comment. Please try again.');
        }
    };

    // Function to update meta tags for sharing
    const updateMetaTagsForSharing = (post) => {
        if (typeof document !== 'undefined') {
            // Update Open Graph meta tags
            const ogTitle = document.querySelector('meta[property="og:title"]');
            const ogDescription = document.querySelector('meta[property="og:description"]');
            const ogImage = document.querySelector('meta[property="og:image"]');
            const ogUrl = document.querySelector('meta[property="og:url"]');
            
            // Update Twitter meta tags
            const twitterTitle = document.querySelector('meta[name="twitter:title"]');
            const twitterDescription = document.querySelector('meta[name="twitter:description"]');
            const twitterImage = document.querySelector('meta[name="twitter:image"]');
            
            if (ogTitle) ogTitle.setAttribute('content', post.title || 'IFCA Community Post');
            if (ogDescription) ogDescription.setAttribute('content', post.content || 'Check out this post from IFCA Community');
            if (ogUrl) ogUrl.setAttribute('content', `${window.location.origin}/comHome/${comId}`);
            
            if (twitterTitle) twitterTitle.setAttribute('content', post.title || 'IFCA Community Post');
            if (twitterDescription) twitterDescription.setAttribute('content', post.content || 'Check out this post from IFCA Community');
            
            // Set image - use post image if available, otherwise use community banner or logo
            let imageUrl = '/logo.png'; // IFCA application logo as fallback
            if (post.assets && post.assets.length > 0) {
                const imageAsset = post.assets.find(asset => asset.type && asset.type.startsWith('image/'));
                if (imageAsset) {
                    imageUrl = imageAsset.url;
                }
            } else if (currentCommunity?.bannerImg) {
                imageUrl = currentCommunity.bannerImg;
            }
            
            if (ogImage) ogImage.setAttribute('content', imageUrl);
            if (twitterImage) twitterImage.setAttribute('content', imageUrl);
        }
    };



    // Poll vote handler
    const handlePollVote = async (postId, optionId) => {
        if (!user || !user.unifiedUser?.id) return;
        
        // Find the post to check if it's expired
        const posts = useSelector(selectCommunityPosts);
        const post = posts?.find(p => p.id === postId);
        
        if (post?.pollExpiresAt && moment().isAfter(moment(post.pollExpiresAt))) {
            toast.error("This poll has expired. Voting is no longer allowed.");
                return;
        }
        
        try {
            // Optimistic update: (optional, for now just call API and refresh)
            await api.patch(`/thread/${postId}/user/${user.unifiedUser.id}/option/${optionId}`);
            dispatch(setCommunityPosts(comId));
        } catch (error) {
            console.error('Error voting on poll:', error);
            toast.error("Failed to vote on poll");
        }
    };

    // Poll edit handler
    const handleEditPoll = (poll) => {
        setEditingPoll(poll);
        setPollQuestion(poll.title || "");
        setPollOptions(poll.PollOptions?.map(option => ({ text: option.option })) || [{ text: "" }, { text: "" }]);
        setPollExpiresAt(poll.pollExpiresAt ? new Date(poll.pollExpiresAt).toISOString().slice(0, 16) : "");
        setShowPollModal(true);
    };

    // Handle poll update
    const handleUpdatePoll = async () => {
        if (!editingPoll || !pollQuestion.trim()) return;
        
        try {
            const updatedPoll = {
                question: pollQuestion,
                options: pollOptions.filter(option => option.text.trim()),
                expiresAt: pollExpiresAt || null
            };
            
            await api.patch(`/thread/${editingPoll.id}`, updatedPoll);
            
            setShowPollModal(false);
            setEditingPoll(null);
            setPollQuestion("");
            setPollOptions([{ text: "" }, { text: "" }]);
            setPollExpiresAt("");
            
            // Refresh posts
            if (comId) {
                dispatch(setCommunityPosts(comId));
            }
            
            toast.success("Poll updated successfully!");
        } catch (error) {
            console.error('Error updating poll:', error);
            toast.error("Failed to update poll");
        }
    };

    const getCurrentTime = () => {
        const now = new Date();

        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");

        const currentTimeString = `${hours}:${minutes}:${seconds}`;

        return currentTimeString;
    };

    // Poll countdown timer component
    const PollCountdownTimer = ({ expiresAt }) => {
        const [timeLeft, setTimeLeft] = useState('');
        const [isExpired, setIsExpired] = useState(false);

        useEffect(() => {
            if (!expiresAt) return;

            const updateTimer = () => {
                const now = moment();
                const expiry = moment(expiresAt);
                const diff = expiry.diff(now);

                if (diff <= 0) {
                    setTimeLeft('Poll ended');
                    setIsExpired(true);
                } else {
                    const duration = moment.duration(diff);
                    const days = Math.floor(duration.asDays());
                    const hours = duration.hours();
                    const minutes = duration.minutes();
                    const seconds = duration.seconds();

                    let timeString = '';
                    if (days > 0) {
                        timeString = `${days}d ${hours}h ${minutes}m`;
                    } else if (hours > 0) {
                        timeString = `${hours}h ${minutes}m ${seconds}s`;
                    } else if (minutes > 0) {
                        timeString = `${minutes}m ${seconds}s`;
                    } else {
                        timeString = `${seconds}s`;
                    }

                    setTimeLeft(timeString);
                    setIsExpired(false);
                }
            };

            updateTimer();
            const interval = setInterval(updateTimer, 1000);

            return () => clearInterval(interval);
        }, [expiresAt]);

        if (!expiresAt) return null;

        return (
            <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                isExpired 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-orange-100 text-orange-700'
            }`}>
                {isExpired ? 'Poll ended' : `Ends in: ${timeLeft}`}
            </div>
        );
    };



    async function createCatchUp(num) {
            setSelectedLink(num);
        // Simply switch to the CatchUp tab without opening modal
        // The inline forms will be available on the CatchUp page
    }



    const handleCheckLiveCatchUp = async function () {
        if (!comId) {
            console.log('comId is undefined, skipping catchup check');
            return;
        }
        try {
            console.log('CatchUp: Checking live catchup for community', comId);
            const res = await api.get(`/catchup/community/${comId}`);
            console.log('CatchUp: Live catchup response:', res);
            if (res?.data?.success) {
                setLive(true);
                setActiveRoom(res.data.roomId);
                setIsHost(res.data.hostId === user?.unifiedUser?.id);
                setCatchupDetails(res.data);
            } else {
                setLive(false);
                setActiveRoom("");
                setIsHost(false);
                setCatchupDetails(null);
            }
        } catch (error) {
            console.error("Error checking catchup status:", error);
            setLive(false);
            setActiveRoom("");
            setIsHost(false);
            setCatchupDetails(null);
            alert("Failed to check live catchup status.\n" + (error?.message || error));
        }
    };

    console.log("currentCommunity", currentCommunity);

    // Function to check if there's a live catchup
    const checkLiveCatchup = async () => {
        try {
            setIsCheckingLiveCatchup(true);
            const response = await api.get(`/catchup/community/${comId}`);
            
            console.log("checkLiveCatchup response:", response?.data);
            
            if (response?.data?.success && response.data.isLive) {
                // Only treat as live catchup if it's actually marked as live
                const isHost = response.data.creatorId === user?.unifiedUser?.id;
                const catchupData = {
                    roomId: response.data.roomId,
                    creatorId: response.data.creatorId,
                    creatorEmail: response.data.creatorEmail,
                    isHost: isHost
                };
                
                console.log("Setting liveCatchup:", catchupData);
                setLiveCatchup(catchupData);
                setLive(true);
                setActiveRoom(response.data.roomId);
                setIsHost(isHost);
                
                // Fetch attendees for the live catchup
                fetchCatchupAttendees(response.data.roomId);
            } else {
                console.log("No live catchup found, clearing state");
                setLiveCatchup(null);
                setLive(false);
                setActiveRoom("");
                setIsHost(false);
            }
        } catch (error) {
            console.error("Error checking live catchup:", error);
            setLiveCatchup(null);
            setLive(false);
            setActiveRoom("");
            setIsHost(false);
        } finally {
            setIsCheckingLiveCatchup(false);
        }
    };

    // Function to join existing live catchup
    const joinLiveCatchup = async () => {
        if (!liveCatchup) return;
        
        try {
            // Get fresh management token
            const tkn = await api.get("/session/token");
            const management_Token = tkn.data.token;
            
            const response = await axios.post(`https://api.100ms.live/v2/room-codes/room/${liveCatchup.roomId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${management_Token}`,
                        "Content-Type": "application/json",
                    },
                });
            const guestCode = response.data.data.find(item => item.role === 'guest');

            if (guestCode) {
                const redirectUrl = `https://aluminaries.app.100ms.live/meeting/${guestCode.code}`;
                if (typeof window !== "undefined") {
                    window.open(redirectUrl, "_blank");
                }
            }
        } catch (error) {
            console.error("Error joining live catchup:", error);
            alert("Failed to join catchup. Please try again.");
        }
    };

    // Function to create instant catchup
    const createInstantCatchUp = async () => {
        try {
            // Check if there's already a live catchup for this community
            const existingCatchupResponse = await api.get(`/catchup/community/${comId}`);
            console.log("Instant catchup - Existing catchup response:", existingCatchupResponse?.data);
            
            if (existingCatchupResponse?.data?.success && existingCatchupResponse.data.isLive) {
                console.log('Existing live catchup found, joining instead of creating new one');
                console.log('Room ID to join:', existingCatchupResponse.data.roomId);
                
                // Join the existing live catchup with attendance tracking
                await joinExistingCatchup(existingCatchupResponse.data.roomId);
                return;
            }

            // Check if there's a scheduled catchup starting soon (within 30 minutes)
            const now = moment();
            const hasUpcomingScheduledCatchup = scheduledCatchups.some(catchup => {
                const scheduledTime = moment(catchup.scheduledAt);
                const timeUntilStart = scheduledTime.diff(now, 'minutes');
                return timeUntilStart >= 0 && timeUntilStart <= 30; // Within 30 minutes
            });

            if (hasUpcomingScheduledCatchup) {
                alert('There is a scheduled CatchUp starting soon. Please wait for the scheduled CatchUp or schedule a new one for a different time.');
                return;
            }

            // No existing catchup, create a new one
            console.log('No existing live catchup, creating new one');
            console.log('Community ID:', comId);
            
            // Get fresh management token
            const tkn = await api.get("/session/token");
            const management_Token = tkn.data.token;
            
            console.log("Instant catchup - Token response:", tkn.data);
            console.log("Instant catchup - Management token:", management_Token);

            // Debug logging
            console.log('User object:', user);
            console.log('UnifiedUser object:', user?.unifiedUser);
            console.log('UnifiedUser ID:', user?.unifiedUser?.id);

            const payload = {
                unifiedUserId: user?.unifiedUser?.id,
                communityId: comId,
            };
            console.log('API Payload being sent:', payload);
            
            // Save catchup in database with host info
            const sendToDatabase = await api.post(`/catchup/create`, payload);
            console.log("Database response:", sendToDatabase?.data);
            
            if (sendToDatabase?.data?.success) {
                const catchupData = sendToDatabase.data.catchup;
                console.log("Catchup data:", catchupData);
                
                // Use the room ID from the response (which will be the 100ms room ID)
                const fixedRoomId = catchupData.roomId;
                
                // Update local state
                setIsHost(catchupData.isHost);
                setActiveRoom(fixedRoomId);
                setLive(true);
                setLiveCatchup({
                    roomId: fixedRoomId,
                    creatorId: catchupData.creatorId,
                    isHost: catchupData.isHost
                });

                // Update Redux state
                dispatch(setCommunityCatchup({
                    id: fixedRoomId,
                    owner: catchupData.creatorId,
                    isHost: catchupData.isHost
                }));

                // Add creator to attendance tracking
                try {
                    const attendanceResponse = await api.post('/catchup/join-on-enter', {
                        roomId: fixedRoomId,
                        communityId: comId,
                        unifiedUserId: user?.unifiedUser?.id
                    });

                    if (attendanceResponse?.data?.success) {
                        console.log('Creator added to catchup attendance:', attendanceResponse.data.message);
                    } else {
                        console.warn('Failed to add creator to attendance, but continuing with 100ms join');
                    }
                } catch (attendanceError) {
                    console.error('Error adding creator to attendance:', attendanceError);
                }

                // Get room code and redirect
                const res = await axios.post(`https://api.100ms.live/v2/room-codes/room/${fixedRoomId}`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${management_Token}`,
                            "Content-Type": "application/json",
                        },
                    });
                const guestCode = res.data.data.find(item => item.role === 'guest');

                if (guestCode) {
                    const redirectUrl = `https://aluminaries.app.100ms.live/meeting/${guestCode.code}?name=${encodeURIComponent(user?.name || 'User')}`;
                    console.log("Redirecting to:", redirectUrl);
                    if (typeof window !== "undefined") {
                        window.open(redirectUrl, "_blank");
                    }
                } else {
                    console.error("No guest code found in response:", res.data);
                }
            } else {
                console.error("Database response error:", sendToDatabase?.data);
                throw new Error("Failed to create catchup in database");
            }
            
            // Refresh live catchup status after creation
            setTimeout(() => {
                checkLiveCatchup();
            }, 1000); // Small delay to ensure backend has updated
            
            return
        } catch (error) {
            console.error("Error creating catchup:", error);
            alert("Failed to create catchup. Please try again.");
        }
    };

    // Function to create scheduled catchup
    const createScheduledCatchUp = async (scheduleData) => {
        try {
            const payload = {
                unifiedUserId: user?.unifiedUser?.id,
                communityId: comId,
                startTime: scheduleData.scheduledAt,
                endTime: scheduleData.endTime,
                title: scheduleData.title,
                desc: scheduleData.description
            };

            const response = await api.post('/catchup/scheduled/create', payload);
            
            if (response?.data?.success) {
                // Refresh scheduled catchups
                fetchScheduledCatchups();
                // Toast notification is handled in the modal component
            } else {
                toast.error('Failed to schedule CatchUp. Please try again.');
            }
        } catch (error) {
            console.error("Error scheduling catchup:", error);
            toast.error("Failed to schedule catchup. Please try again.");
        }
    };

    // Function to fetch scheduled catchups
    const fetchScheduledCatchups = async () => {
        try {
            console.log("=== fetchScheduledCatchups called ===");
            console.log("comId:", comId);
            const response = await api.get(`/catchup/scheduled/${comId}`);
            console.log("API Response:", response);
            if (response?.data?.success) {
                console.log("Scheduled catchups:", response.data.scheduledCatchups);
                setScheduledCatchups(response.data.scheduledCatchups);
            } else {
                console.log("API response not successful:", response?.data);
            }
        } catch (error) {
            console.error("Error fetching scheduled catchups:", error);
            console.error("Error details:", error.response?.data);
        }
    };

    
    // Reset showMoreHuddles when view mode changes
    useEffect(() => {
        setShowMoreHuddles(false);
    }, [huddleViewMode]);

    // Function to show join confirmation modal
    const showJoinConfirmationModal = (catchup, type = "scheduled") => {
        const title = type === "instant" ? "Join Instant CatchUp" : "Join Scheduled Meeting";
        const message = type === "instant" 
            ? "Join the ongoing instant catchup session" 
            : "Join the scheduled meeting session";
        
        setJoinConfirmationData({
            catchup,
            type,
            title,
            message
        });
        setShowJoinConfirmation(true);
    };

    // Function to handle join confirmation
    const handleJoinConfirmation = () => {
        if (joinConfirmationData) {
            const { catchup, type } = joinConfirmationData;
            if (type === "instant") {
                createInstantCatchUp();
            } else if (catchup) {
                handleJoinScheduledCatchUp(catchup);
            }
        }
        setShowJoinConfirmation(false);
        setJoinConfirmationData(null);
    };

    // Function to end catchup
    const endCatchup = async () => {
        if (!liveCatchup || !liveCatchup.isHost) return;
        
        try {
            await api.patch(`/catchup/leave/${liveCatchup.roomId}/${comId}/${user?.unifiedUser?.id}`);
            setLiveCatchup(null);
            setLive(false);
            setActiveRoom("");
            setIsHost(false);
            // Refresh scheduled catchups
            fetchScheduledCatchups();
        } catch (error) {
            console.error("Error ending catchup:", error);
        }
    };

    // Function to join scheduled catchup
    const handleJoinScheduledCatchUp = async (catchup) => {
        try {
            console.log("Joining scheduled catchup:", catchup);
            
            // Check time-based validation
            const startTime = moment(catchup.startTime);
            const endTime = moment(catchup.endTime);
            const now = moment();
            const timeUntilStart = startTime.diff(now, 'minutes');
            const timeAfterEnd = now.diff(endTime, 'minutes');
            
            console.log("Start time:", startTime.format('YYYY-MM-DD HH:mm:ss'));
            console.log("End time:", endTime.format('YYYY-MM-DD HH:mm:ss'));
            console.log("Current time:", now.format('YYYY-MM-DD HH:mm:ss'));
            console.log("Time until start:", timeUntilStart, "minutes");
            console.log("Time after end:", timeAfterEnd, "minutes");
            
            // Check if it's too early (more than 5 minutes before)
            if (timeUntilStart > 5) {
                alert(`This CatchUp starts in ${Math.ceil(timeUntilStart)} minutes. Please wait until 5 minutes before the scheduled time.`);
                return;
            }
            
            // Check if it's too late (more than 30 minutes after end)
            if (timeAfterEnd > 30) {
                alert("This CatchUp has ended. You can only join within 30 minutes after the scheduled end time.");
                return;
            }

            // If it's a completed catchup, show message
            if (catchup.isCompleted) {
                alert("This CatchUp has already been completed.");
                return;
            }

            // Check if there's already a live catchup for this community
            const liveCatchupResponse = await api.get(`/catchup/community/${comId}`);
            console.log("Live catchup response:", liveCatchupResponse?.data);
            
            if (liveCatchupResponse?.data?.success) {
                console.log("Found existing live catchup, joining instead of creating new one");
                // Join the existing live catchup with attendance tracking
                await joinExistingCatchup(liveCatchupResponse.data.roomId);
                return;
            }

            console.log("No existing live catchup found, starting new scheduled catchup");
            // If it's in progress or upcoming, start the scheduled catchup
            if (catchup.isInProgress || catchup.isUpcoming) {
                console.log("Starting scheduled catchup:", catchup.id);
                
                try {
                    // Start the scheduled catchup using the new endpoint
                    const startResponse = await api.post(`/catchup/scheduled/start/${catchup.id}`);
                    console.log("Start response:", startResponse?.data);
                    
                    if (startResponse?.data?.success) {
                        const liveCatchup = startResponse.data.catchup;
                        
                        // Get fresh management token
                        const tkn = await api.get("/session/token");
                        const management_Token = tkn.data.token;

                        // The backend will create the 100ms room and provide the room ID

                        // For scheduled catchups, the backend will use the community's 100ms room ID
                        const catchupData = startResponse.data.catchup;
                        const fixedRoomId = catchupData.roomId;

                        // Update local state
                        setIsHost(catchupData.isHost);
                        setActiveRoom(fixedRoomId);
                        setLive(true);
                        setLiveCatchup({
                            roomId: fixedRoomId,
                            creatorId: catchupData.creatorId,
                            isHost: catchupData.isHost
                        });

                        // Update Redux state
                        dispatch(setCommunityCatchup({
                            id: fixedRoomId,
                            owner: catchupData.creatorId,
                            isHost: catchupData.isHost
                        }));

                        // Add creator to attendance tracking
                        try {
                            const attendanceResponse = await api.post('/catchup/join-on-enter', {
                                roomId: fixedRoomId,
                                communityId: comId,
                                unifiedUserId: user?.unifiedUser?.id
                            });

                            if (attendanceResponse?.data?.success) {
                                console.log('Creator added to catchup attendance:', attendanceResponse.data.message);
                            } else {
                                console.warn('Failed to add creator to attendance, but continuing with 100ms join');
                            }
                        } catch (attendanceError) {
                            console.error('Error adding creator to attendance:', attendanceError);
                        }

                        // Join the room
                        const res = await axios.post(`https://api.100ms.live/v2/room-codes/room/${fixedRoomId}`,
                            {},
                            {
                                headers: {
                                    Authorization: `Bearer ${management_Token}`,
                                    "Content-Type": "application/json",
                                },
                            });
                        const guestCode = res.data.data.find(item => item.role === 'guest');

                        if (guestCode) {
                            const redirectUrl = `https://aluminaries.app.100ms.live/meeting/${guestCode.code}?name=${encodeURIComponent(user?.name || 'User')}`;
                            if (typeof window !== "undefined") {
                                window.open(redirectUrl, "_blank");
                            }
                        }

                        // Refresh scheduled catchups to show updated status
                        fetchScheduledCatchups();
                        // Refresh live catchup status
                        setTimeout(() => {
                            checkLiveCatchup();
                        }, 1000); // Small delay to ensure backend has updated
                    } else {
                        console.error("Failed to start scheduled catchup:", startResponse?.data);
                        throw new Error("Failed to start scheduled catchup");
                    }
                } catch (startError) {
                    console.error("Error starting scheduled catchup:", startError);
                    throw new Error("Failed to start scheduled catchup");
                }
            }
        } catch (error) {
            console.error("Error joining scheduled catchup:", error);
            console.error("Error details:", error.response?.data || error.message);
            
            let errorMessage = "Failed to join scheduled CatchUp. Please try again.";
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }
            
            alert(errorMessage);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            handleCheckLiveCatchUp();
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    // Helper function to join existing catchup with attendance tracking
    const joinExistingCatchup = async (roomId) => {
        try {
            // First, add user to attendance tracking
            const attendanceResponse = await api.post('/catchup/join-on-enter', {
                roomId: roomId,
                communityId: comId,
                unifiedUserId: user?.unifiedUser?.id
            });

            if (attendanceResponse?.data?.success) {
                console.log('Successfully joined catchup attendance:', attendanceResponse.data.message);
            } else {
                console.warn('Failed to join catchup attendance, but continuing with 100ms join');
            }

            // Then join the 100ms room
            const tkn = await api.get("/session/token");
            const management_Token = tkn.data.token;
            
            const res = await axios.post(`https://api.100ms.live/v2/room-codes/room/${roomId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${management_Token}`,
                        "Content-Type": "application/json",
                    },
                });
            const guestCode = res.data.data.find(item => item.role === 'guest');

            if (guestCode) {
                const redirectUrl = `https://aluminaries.app.100ms.live/meeting/${guestCode.code}?name=${encodeURIComponent(user?.name || 'User')}`;
                console.log("Joining existing catchup room:", redirectUrl);
                if (typeof window !== "undefined") {
                    window.open(redirectUrl, "_blank");
                }
            } else {
                console.error("No guest code found for existing catchup");
            }
        } catch (error) {
            console.error("Error joining existing catchup:", error);
            alert("Failed to join catchup. Please try again.");
        }
    };

    // Helper function to get catchup status with attendees
    const getCatchupStatus = async (roomId) => {
        try {
            const response = await api.get(`/catchup/status/${roomId}/${comId}`);
            if (response?.data?.success) {
                return response.data.catchup;
            }
            return null;
        } catch (error) {
            console.error("Error getting catchup status:", error);
            return null;
        }
    };

    // Function to fetch and display catchup attendees
    const fetchCatchupAttendees = async (roomId) => {
        try {
            const status = await getCatchupStatus(roomId);
            if (status && status.attendees) {
                setCatchupAttendees(status.attendees);
                setShowAttendees(true);
            }
        } catch (error) {
            console.error("Error fetching catchup attendees:", error);
        }
    };

    useEffect(() => {
        return () => {
            if (isHost && activeRoom && comId) {
                // End catchup if host leaves
                endCatchup();
            }
        };
    }, [isHost, activeRoom, comId]);

    // const handleViewResponse = (formId) => {
    //   setSelectedForm(formId); // Set selected form to fetch responses for that form
    //   setOpenModal(true); // Open modal to view responses
    // };

    // const handleCloseModal = () => {
    //   setOpenModal(false); // Close the modal
    // };

    // const handleFormClick = (formId, communityId) => {
    //   router.push(`/forms/${formId}?communityId=${thisCommunity[0]?.id}`);
    // };

    // Handle form responses view
    const handleViewResponses = (formId) => {
        router.push(`/admin/forms/viewResponses/${formId}`);
    };





    // Empty state component
    const EmptyState = ({ icon: Icon, title, description, action }) => (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>
            {action && action}
        </div>
    );



    useEffect(() => {
        const handleScroll = () => {
            const el = navScrollRef.current;
            if (!el) return;
            const isOverflowing = el.scrollWidth > el.clientWidth + 1;
            if (!isOverflowing) {
                setShowLeft(false);
                setShowRight(false);
                return;
            }
            setShowLeft(el.scrollLeft > 0);
            setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
        };
        const el = navScrollRef.current;
        if (el) {
            el.addEventListener('scroll', handleScroll);
            handleScroll();
        }
        return () => {
            if (el) el.removeEventListener('scroll', handleScroll);
        };
    }, [navigationTabs.length]);

    useEffect(() => {
        if (!navScrollRef.current) return;
        const tabButtons = navScrollRef.current.querySelectorAll('button[data-tab-id]');
        const selectedIdx = navigationTabs.findIndex(tab => tab.id === selectedLink);
        if (selectedIdx === -1) return;
        const selectedBtn = tabButtons[selectedIdx];
        if (!selectedBtn) return;
        const container = navScrollRef.current;
        const btnRect = selectedBtn.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const offset = btnRect.left - containerRect.left - (container.clientWidth / 2) + (btnRect.width / 2);
        container.scrollBy({ left: offset, behavior: 'smooth' });
    }, [selectedLink, navigationTabs.length]);



    // Filter and sort resources
    const filteredResources = currResources
        .filter(item => {
            if (!resourceSearch) return true;
            const domain = (() => {
                try {
                    return new URL(item.link).hostname.replace(/^www\./, "");
                } catch { return ""; }
            })();
            return (
                (item.name && item.name.toLowerCase().includes(resourceSearch.toLowerCase())) ||
                (domain && domain.toLowerCase().includes(resourceSearch.toLowerCase()))
            );
        })
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // Sync tab state with URL query
    useEffect(() => {
      if (router.query.tab) {
        setSelectedLink(Number(router.query.tab));
      }
    }, [router.query.tab]);

    const handleTabChange = (tabIndex) => {
      setSelectedLink(tabIndex);
      router.replace(
        {
          pathname: router.pathname,
          query: { ...router.query, tab: tabIndex },
        },
        undefined,
        { shallow: true }
      );
    };

    // Fetch services for the community
    useEffect(() => {
      async function fetchServices() {
        if (!comId) return;
        try {
          const res = await api.get(`/service/getServicesByCommunityId/${comId}`);
          setServices(res.data.data || []);
        } catch (err) {
          setServices([]);
        }
      }
      fetchServices();
    }, [comId]);

    const handleAddServiceOpen = () => setAddServiceOpen(true);
    const handleAddServiceClose = () => {
      setAddServiceOpen(false);
    };

    // Fetch serviceResponses for the community
    useEffect(() => {
      async function fetchServiceResponses() {
        if (!comId) return;
        try {
          const res = await api.get(`/service/getAllResponsesByCommunityId/${comId}`);
          setServiceResponses(res.data.data || []);
        } catch (err) {
          setServiceResponses([]);
        }
      }
      fetchServiceResponses();
    }, [comId]);

    // Fetch scheduled catchups when community changes
    useEffect(() => {
      console.log("=== useEffect for fetchScheduledCatchups ===");
      console.log("comId:", comId);
      if (comId) {
        console.log("Calling fetchScheduledCatchups...");
        fetchScheduledCatchups();
      } else {
        console.log("comId is not available yet");
      }
    }, [comId]);

    // Check for live catchup periodically
    useEffect(() => {
      if (comId) {
        checkLiveCatchup();
        
        // Check every 30 seconds to keep UI updated
        const interval = setInterval(checkLiveCatchup, 30000);
        
        return () => clearInterval(interval);
      }
    }, [comId]);

    // Show loading state if comId is not available or router is not ready
    if (!comId || !router.isReady || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-170px)]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading community...</p>
                </div>
            </div>
        );
    }

    // Show loading state if user is not authenticated
    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-170px)]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading user authentication...</p>
                </div>
            </div>
        );
    }

    return (
        <Layout>
            <Head>
                <title>{thisCommunity && thisCommunity.title}</title>
                {/* Open Graph meta tags for better social media sharing */}
                <meta property="og:title" content={thisCommunity?.title || 'IFCA Community'} />
                <meta property="og:description" content={thisCommunity?.desc || 'Join our community on IFCA'} />
                <meta property="og:image" content={thisCommunity?.bannerImg || '/logo.png'} />
                <meta property="og:url" content={`${typeof window !== 'undefined' ? window.location.href : ''}`} />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="IFCA Application" />
                
                {/* Twitter Card meta tags */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={thisCommunity?.title || 'IFCA Community'} />
                <meta name="twitter:description" content={thisCommunity?.desc || 'Join our community on IFCA'} />
                <meta name="twitter:image" content={thisCommunity?.bannerImg || '/logo.png'} />
            </Head>
            <div className="relative w-full max-w-full mx-auto flex flex-col bg-gray-50 overflow-x-hidden" style={{ height: '100%', maxHeight: '100%' }}>
                {/* Orange Theme Sticky Header - WhatsApp Style */}
                <div ref={stickyRef} className="sticky top-0 z-50 bg-orange-600 shadow-lg w-full max-w-full">
                    {/* Header - WhatsApp Style */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-orange-600">
                        {/* Left Sidebar Toggle Button */}
                        <button
                            onClick={() => {
                                if (typeof window !== 'undefined' && window.toggleLeftSidebar) {
                                    window.toggleLeftSidebar();
                                }
                            }}
                            className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                            title="Toggle Left Sidebar"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <img
                            className="w-10 h-10 rounded-full object-cover border border-white/20"
                            src={currentCommunity?.bannerImg || '/comPic.svg'}
                            alt="Community"
                            onError={(e) => { e.target.src = '/comPic.svg'; }}
                        />
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-semibold text-white truncate">{currentCommunity?.title}</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <div className="w-2 h-2 rounded-full bg-orange-300 flex-shrink-0"></div>
                                <p
                                    ref={descRef}
                                    className={`text-xs text-white/90 ${descExpanded ? 'whitespace-pre-line break-words' : 'truncate'}`}
                                    style={descExpanded ? { maxWidth: '100%', wordBreak: 'break-word' } : { maxWidth: '200px' }}
                                >
                                    {descExpanded ? (currentCommunity?.desc || '') : (currentCommunity?.desc?.substring(0, 30) || '')}
                                </p>
                                {descTruncated && !descExpanded && (
                                    <button
                                        className="text-white/90 text-xs font-medium hover:text-white focus:outline-none"
                                        onClick={() => setDescExpanded(true)}
                                    >
                                        more
                                    </button>
                                )}
                                {descExpanded && (
                                    <button
                                        className="text-white/90 text-xs font-medium hover:text-white focus:outline-none"
                                        onClick={() => setDescExpanded(false)}
                                    >
                                        less
                                    </button>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => setShowPostModal(true)}
                            className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (typeof window !== 'undefined' && window.toggleRightSidebar) {
                                    window.toggleRightSidebar();
                                }
                            }}
                            className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors relative focus:outline-none"
                            title={typeof window !== 'undefined' && window.showRightSidebar ? 'Hide Sidebar' : 'Show Sidebar'}
                        >
                            <SearchIcon className="w-5 h-5 text-white" />
                            {typeof window !== 'undefined' && window.showRightSidebar && (
                                <span className="absolute top-0 right-0 w-2 h-2 bg-orange-300 rounded-full"></span>
                            )}
                        </button>
                    </div>
                    {/* Orange Theme Nav Tabs */}
                    <div className="relative px-4 py-2 bg-orange-100 overflow-hidden w-full max-w-full">
                        {/* Left Arrow */}
                        {showLeft && (
                            <button
                                className="absolute left-0 top-1/2 -translate-y-1/2 z-40 bg-orange-700 hover:bg-orange-800 text-white p-2 rounded-full shadow-lg border border-orange-800 transition"
                                style={{ pointerEvents: 'auto' }}
                                onClick={() => navScrollRef.current.scrollBy({ left: -100, behavior: 'smooth' })}
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                        )}
                        {/* Right Arrow */}
                        {showRight && (
                            <button
                                className="absolute right-0 top-1/2 -translate-y-1/2 z-40 bg-orange-700 hover:bg-orange-800 text-white p-2 rounded-full shadow-lg border border-orange-800 transition"
                                style={{ pointerEvents: 'auto' }}
                                onClick={() => navScrollRef.current.scrollBy({ left: 100, behavior: 'smooth' })}
                            >
                                <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        )}
                        <div className="overflow-x-auto scrollbar-hide px-2 w-full" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x', maxWidth: '100%' }}>
                            <div
                                className="flex gap-2 flex-nowrap w-full"
                                ref={navScrollRef}
                                style={{
                                    paddingLeft: showLeft ? 40 : 0,
                                    paddingRight: showRight ? 40 : 0,
                                    maxWidth: '100%'
                                }}
                            >
                                {navigationTabs.map((tab, idx) => {
                                    const IconComponent = tab.icon;
                                    const isActive = selectedLink === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            data-tab-id={tab.id}
                                            className={`relative px-3 py-1.5 rounded-t-lg transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap font-medium flex-shrink-0
                                                ${isActive
                                                    ? 'bg-white text-orange-600 border-b-2 border-orange-500'
                                                    : 'bg-transparent text-gray-700 hover:text-orange-600 hover:bg-white/50'}
                                                focus:outline-none active:scale-95
                                            `}
                                            style={{ fontSize: '12px' }}
                                            onClick={() => tab.id === 4 ? createCatchUp(4) : handleTabChange(tab.id)}
                                        >
                                            <IconComponent className="w-4 h-4" />
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                                
                                {/* Search Button - Hidden on small screens and moved to dropdown */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (showFixedSearch) {
                                            setShowFixedSearch(false);
                                            setPostSearch('');
                                        } else {
                                            setShowFixedSearch(true);
                                        }
                                    }}
                                    className={`hidden sm:flex relative px-3 py-1.5 rounded-lg transition-all duration-200 items-center gap-1.5 whitespace-nowrap font-semibold
                                    ${showFixedSearch
                                        ? 'bg-orange-700 text-white shadow-md border-b-4 border-orange-800'
                                        : 'bg-gray-50 text-orange-800 hover:bg-orange-100 border border-orange-100'}
                                    focus:ring-2 focus:ring-orange-300 focus:outline-none active:scale-95
                                `}
                                    style={{ fontSize: '12px' }}
                                >
                                    <SearchIcon className="w-4 h-4" />
                                    <span>Search</span>
                                </button>
                                
                                {/* Admin: Show Archived Posts Toggle - Hidden on small screens and moved to dropdown */}
                                {(user?.userType === 'admin' || user?.unifiedUser?.adminId) && (
                                    <button
                                        onClick={() => setShowArchivedPosts(!showArchivedPosts)}
                                        className={`hidden md:flex relative px-3 py-1.5 rounded-lg transition-all duration-200 items-center gap-1.5 whitespace-nowrap font-semibold
                                        ${showArchivedPosts
                                            ? 'bg-orange-700 text-white shadow-md border-b-4 border-orange-800'
                                            : 'bg-gray-50 text-orange-800 hover:bg-orange-100 border border-orange-100'}
                                        focus:ring-2 focus:ring-orange-300 focus:outline-none active:scale-95
                                    `}
                                        style={{ fontSize: '12px' }}
                                    >
                                        <ArchiveIcon className="w-4 h-4" />
                                        <span>
                                            {showArchivedPosts ? 'Hide Archived' : `Show Archived (${posts.filter(p => p.isArchived).length})`}
                                        </span>
                                    </button>
                                )}
                                
                                {/* More Options Dropdown - Visible on small screens */}
                                <div className="relative sm:hidden">
                                    <button
                                        onClick={() => setShowMoreOptions(!showMoreOptions)}
                                        className={`relative px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap font-semibold
                                        ${showMoreOptions
                                            ? 'bg-blue-700 text-white shadow-md border-b-4 border-blue-800'
                                            : 'bg-gray-50 text-blue-800 hover:bg-blue-100 border border-blue-100'}
                                        focus:ring-2 focus:ring-blue-300 focus:outline-none active:scale-95
                                    `}
                                        style={{ fontSize: '12px' }}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                        <span>More</span>
                                    </button>
                                    
                                    {/* Dropdown Menu */}
                                    {showMoreOptions && (
                                        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (showFixedSearch) {
                                                        setShowFixedSearch(false);
                                                        setPostSearch('');
                                                    } else {
                                                        setShowFixedSearch(true);
                                                    }
                                                    setShowMoreOptions(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 focus:outline-none"
                                            >
                                                <SearchIcon className="w-4 h-4" />
                                                Search
                                            </button>
                                            
                                            {(user?.userType === 'admin' || user?.unifiedUser?.adminId) && (
                                                <button
                                                    onClick={() => {
                                                        setShowArchivedPosts(!showArchivedPosts);
                                                        setShowMoreOptions(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                                >
                                                    <ArchiveIcon className="w-4 h-4" />
                                                    {showArchivedPosts ? 'Hide Archived' : `Show Archived (${posts.filter(p => p.isArchived).length})`}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Medium screens dropdown for archived posts only */}
                                <div className="relative hidden sm:block md:hidden">
                                    {(user?.userType === 'admin' || user?.unifiedUser?.adminId) && (
                                        <>
                                            <button
                                                onClick={() => setShowMediumOptions(!showMediumOptions)}
                                                className={`relative px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap font-semibold
                                                ${showMediumOptions
                                                    ? 'bg-blue-700 text-white shadow-md border-b-4 border-blue-800'
                                                    : 'bg-gray-50 text-blue-800 hover:bg-blue-100 border border-blue-100'}
                                                focus:ring-2 focus:ring-blue-300 focus:outline-none active:scale-95
                                            `}
                                                style={{ fontSize: '12px' }}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                </svg>
                                                <span>More</span>
                                            </button>
                                            
                                            {/* Medium screens dropdown */}
                                            {showMediumOptions && (
                                                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
                                                    <button
                                                        onClick={() => {
                                                            setShowArchivedPosts(!showArchivedPosts);
                                                            setShowMediumOptions(false);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                                    >
                                                        <ArchiveIcon className="w-4 h-4" />
                                                        {showArchivedPosts ? 'Hide Archived' : `Show Archived (${posts.filter(p => p.isArchived).length})`}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Fixed Search Bar */}
                {showFixedSearch && (
                    <div className="fixed top-[72px] left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-lg">
                        <div className="max-w-2xl mx-auto px-4 py-3">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search posts..."
                                    value={postSearch}
                                    onChange={(e) => setPostSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }
                                    }}
                                    className="w-full pl-10 pr-12 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowFixedSearch(false);
                                        setPostSearch('');
                                    }}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content - WhatsApp Style Scrollable Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 w-full max-w-full" style={{ maxHeight: 'calc(100vh - 72px - 49px)', height: '100%' }}>
                    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 w-full overflow-x-hidden">
                                        {selectedLink === 1 && (
                                            <>
                                                {/* Welcome Message */}
                                                {/* <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <img
                                                            className="w-12 h-12 rounded-full object-cover"
                                                            src={currentCommunity?.bannerImg || "/comPic.svg"}
                                                            alt="Community"
                                                        />
                                                        <div>
                                                            <h3 className="text-base font-semibold text-gray-900">
                                                                {currentCommunity?.welcomeMsg || "Welcome to the community!"}
                                                            </h3>
                                                            {currentCommunity?.desc && (
                                                                <p className="text-sm text-gray-600 mt-1">{currentCommunity.desc}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div> */}

                                                {/* Events Section */}
                                                {communitySessions.length > 0 && <div className="mb-8">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                                                            <EventIcon className="w-5 h-5 text-white" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h4>
                                                            <p className="text-xs text-gray-500">{communitySessions.length} {communitySessions.length === 1 ? 'session' : 'sessions'}</p>
                                                        </div>
                                                    </div>

                                                    {communitySessions.length > 0 ? (
                                                                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3 text-orange-600">
                                                                    <InfoOutlinedIcon className="w-5 h-5" />
                                                                    <div>
                                                                        <p className="font-semibold text-base">
                                                                            {communitySessions[0]?.SessionSlot[0]?.topicName || "Upcoming Session"}
                                                                        </p>
                                                                        <p className="text-sm text-gray-600">
                                                                            Starting {moment(communitySessions[0]?.SessionSlot[0].startTime).fromNow()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
                                                                    onClick={() => handleClick()}
                                                                >
                                                                    Join Class
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <EmptyState
                                                            icon={ScheduleIcon}
                                                            title="No upcoming sessions"
                                                            description="There are no scheduled sessions at the moment. Check back later for updates."
                                                        />
                                                    )}

                                                    <EventSchedule />
                                                </div>}

                            {/* Posts Section - Card Feed */}
                             {showArchivedPosts && (
                                 <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                                     <div className="flex items-center gap-2 text-orange-800">
                                         <ArchiveIcon className="w-4 h-4" />
                                         <span className="text-sm font-medium">Showing archived posts</span>
                                         <span className="text-xs bg-orange-200 px-2 py-1 rounded-full">
                                             {posts.filter(p => p.isArchived).length} archived
                                         </span>
                                     </div>
                                 </div>
                             )}
                            <div className="flex flex-col gap-6 mt-4 max-w-4xl mx-auto w-full overflow-x-hidden px-2">
                                {(() => {
                                    const highlight = (text, search) => {
                                        if (!search) return text;
                                        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                        const regex = new RegExp(`(${escapedSearch})`, 'gi');
                                        return text.split(regex).map((part, i) =>
                                            regex.test(part) ? <mark key={i} className="bg-yellow-200 px-1 rounded">{part}</mark> : part
                                        );
                                    };
                                    // Debug: Log posts and archived status
                                    console.log('All posts:', posts);
                                    console.log('Show archived posts:', showArchivedPosts);
                                    console.log('Posts with isArchived:', posts.filter(p => p.isArchived));
                                    
                                    const filteredPosts = [...posts]
                                        .filter(item => {
                                            // Filter by search term
                                            const matchesSearch = !postSearch ||
                                            (item.title && item.title.toLowerCase().includes(postSearch.toLowerCase())) ||
                                                (item.content && item.content.toLowerCase().includes(postSearch.toLowerCase()));
                                            
                                            // Filter by archived status
                                            const matchesArchived = showArchivedPosts ? true : !item.isArchived;
                                            
                                            return matchesSearch && matchesArchived;
                                        })
                                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                                    return filteredPosts.length > 0 ? (
                                        filteredPosts.map((item, idx) => {
                                            const userPhoto = item.creator?.photoURL || item.creator?.user?.photoURL || item.creator?.partner?.photoURL || item.creator?.expert?.photoURL || item.creator?.admin?.photoURL || "/t6.svg";
                                            const userName = item.creator?.user?.name || item.creator?.partner?.name || item.creator?.expert?.name || item.creator?.admin?.name || "User";
                                            const isAdmin = !!item.creator?.adminId;
                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`bg-white rounded-2xl border border-gray-100 p-5 min-w-0 lg:min-w-[700px] max-w-full w-full relative overflow-x-hidden shadow-sm hover:shadow-md transition-all duration-200 ${item.isArchived ? 'opacity-75' : ''}`}
                                                >
                                                    {/* Archived Indicator */}
                                                    {item.isArchived && (
                                                        <div className="absolute top-2 right-2 bg-gray-500 text-white text-xs px-2 py-1 rounded-full z-10">
                                                            Archived
                                                        </div>
                                                    )}
                                                    {/* Header Row */}
                                                    <div className="flex items-start gap-3 mb-2">
                                                        <img src={userPhoto} alt={userName} className="w-10 h-10 rounded-full object-cover border border-gray-200" onError={e => { e.target.src = "/t6.svg"; }} />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1 flex-wrap">
                                                                <span className="font-semibold text-sm leading-tight text-gray-900">{userName}</span>
                                                                {isAdmin && <><StarIcon fontSize="inherit" className="text-blue-600 ml-2" /><span className="font-semibold text-blue-600 text-xs">Admin</span></>}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                                                                <span>{moment(item.createdAt).fromNow()}</span>
                                                                {item.updatedAt && item.updatedAt !== item.createdAt && <><span>•</span><span>Edited</span></>}
                                                                <span>•</span>
                                                                <GroupsIcon fontSize="inherit" />
                                                                <span className="ml-2 text-xs text-gray-700 font-normal">{item.isGreeting ? 'Greeting' : (item.isAsk ? 'Ask' : (item.isPoll ? 'Poll' : 'Post'))}</span>
                                                            </div>
                                                        </div>
                                                                                                                 
                                                                                                                  {/* Dots Menu */}
                                                          {(user?.userType === 'admin' || user?.unifiedUser?.adminId) && (
                                                              <div className="flex-shrink-0 relative menu-container">
                                                                  <button
                                                                      onClick={(e) => {
                                                                          e.stopPropagation();
                                                                          setOpenMenuId(openMenuId === item.id ? null : item.id);
                                                                      }}
                                                                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                                                  >
                                                                      <MoreVertIcon fontSize="small" className="text-gray-500" />
                                                                  </button>
                                                                  {openMenuId === item.id && (
                                                                      <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[150px]">
                                                                          <button
                                                                              onClick={() => handlePostEdit(item)}
                                                                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                                                          >
                                                                              <EditIcon fontSize="small" />
                                                                              Edit Post
                                                                          </button>
                                                                          <button
                                                                              onClick={() => handlePostArchive(item.id, !item.isArchived)}
                                                                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                                                          >
                                                                              <ArchiveIcon fontSize="small" />
                                                                              {item.isArchived ? 'Unarchive' : 'Archive'}
                                                                          </button>
                                                                          <button
                                                                              onClick={() => handlePostDelete(item.id)}
                                                                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                                                                          >
                                                                              <DeleteIcon fontSize="small" />
                                                                              Delete Post
                                                                          </button>
                                                                    </div>
                                                                )}
                                                              </div>
                                                          )}
                                                    </div>
                                                    {/* Post Content */}
                                                    <div className="mb-2">
                                                        {item.title && <div className="text-sm font-semibold text-gray-900 mb-1">{highlight(item.title, postSearch)}</div>}
                                                        <p className="text-sm text-gray-900 leading-[1.6] whitespace-pre-line mb-2">{highlight(item.content, postSearch)}</p>
                                                        {/* Render post assets/media below content */}
                                                                {item.assets && item.assets.length > 0 && (
                                                            <div className="mt-3 space-y-3">
                                                                        {item.assets.map((asset, i) => {
                                                                            const type = asset.type || '';
                                                                            if (type.startsWith('image/')) {
                                                                                return (
                                                                            <div key={i} className="relative rounded-lg overflow-hidden bg-gray-50">
                                                                                <img src={asset.url} alt={`Post image`} className="w-full h-auto min-h-[200px] max-h-[500px] object-cover rounded-lg" />
                                                                                    </div>
                                                                                );
                                                                            } else if (type.startsWith('video/')) {
                                                                                return (
                                                                            <div key={i} className="relative rounded-xl overflow-hidden bg-gray-50 shadow-sm">
                                                                                <video controls className="w-full h-auto min-h-[200px] max-h-[500px] object-cover rounded-xl" preload="metadata">
                                                                                            <source src={asset.url} type={type} />
                                                                                            Your browser does not support the video tag.
                                                                                        </video>
                                                                                    </div>
                                                                                );
                                                                            } else if (type === 'application/pdf') {
                                                                                return (
                                                                            <div key={i} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                                                        <div className="flex items-center gap-3">
                                                                                            <div className="flex-shrink-0">
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                                                                                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                                                                                                </svg>
                                                                                            </div>
                                                                                            <div className="flex-1 min-w-0">
                                                                                                <p className="text-xs font-medium text-gray-900 truncate">PDF Document</p>
                                                                                                <p className="text-xs text-gray-500">Click to view or download</p>
                                                                                            </div>
                                                                                            <div className="flex-shrink-0">
                                                                                        <a href={asset.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
                                                                                            Open PDF
                                                                                                </a>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            }
                                                                    // Add more file types as needed
                                                                            return null;
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>

                                                                                                         {/* Interaction Buttons - Like, Comment, Send */}
                                                     <div className="flex items-center justify-between px-0 py-3 border-b-[1px] border-t-[1px] border-gray-300 mt-4">
                                                         <div className="flex items-center gap-6">
                                                                {/* Like Button */}
                                                                <button
                                                                 className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                                                                        isPostLiked(item.id)
                                                                         ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' 
                                                                         : 'text-gray-600 hover:bg-gray-50'
                                                                    }`}
                                                                    onClick={() => handleLike(item.id)}
                                                                >
                                                                    {isPostLiked(item.id) ? (
                                                                     <ThumbUpIcon fontSize="small" />
                                                                    ) : (
                                                                     <ThumbUpOffAltIcon fontSize="small" />
                                                                    )}
                                                                 <span className="text-sm font-medium">
                                                                     {isPostLiked(item.id) ? 'Liked' : 'Like'}
                                                                    </span>
                                                                </button>

                                                                {/* Comment Button */}
                                                                <button
                                                                 className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors duration-200"
                                                                    onClick={() => setOpenComments(openComments === item.id ? null : item.id)}
                                                                >
                                                                 <ChatBubbleOutlineIcon fontSize="small" />
                                                                 <span className="text-sm font-medium">Comment</span>
                                                                </button>

                                                                                                                         {/* Share Button - Using Web Share API */}
                                                                <button
                                                                     className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors duration-200"
                                                                    onClick={() => {
                                                                        setShareModalData({
                                                                            title: item.title || `${currentCommunity?.title} - IFCA India Platform`,
                                                                            text: item.content || 'Check out this post from IFCA India Platform',
                                                                            url: `${window.location.origin}/comHome/${comId}`,
                                                                            hashtags: "#IFCA #Community",
                                                                            communityName: currentCommunity?.title || "IFCA Community",
                                                                            communityDesc: currentCommunity?.desc || "Join our vibrant community",
                                                                            communityImage: currentCommunity?.bannerImg || "/comPic.svg",
                                                                            postId: item.id
                                                                        });
                                                                        setShowShareModal(true);
                                                                    }}
                                                                >
                                                                     <SendIcon fontSize="small" />
                                                                     <span className="text-sm font-medium">Share</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    {/* Poll Options and Interaction */}
                                                    {item.isPoll && item.PollOptions && item.PollOptions.length > 0 && (() => {
                                                        const votesArr = Array.isArray(item.votes) ? item.votes : [];
                                                        const totalVotes = votesArr.reduce((sum, v) => sum + (v.votes || 0), 0);
                                                        const hasVoted = item.UserPollOptionSelect?.some(sel => sel.unifiedUserId === user?.unifiedUser?.id);
                                                        const isPollExpired = item.pollExpiresAt && moment().isAfter(moment(item.pollExpiresAt));
                                                        const shouldShowResults = hasVoted || isPollExpired;
                                                        
                                                        return (
                                                            <div className="mt-2 mb-2">
                                                                {/* Poll Countdown Timer */}
                                                                {item.pollExpiresAt && (
                                                                    <div className="mb-3 flex justify-center">
                                                                        <PollCountdownTimer expiresAt={item.pollExpiresAt} />
                                                    </div>
                                                                )}
                                                                
                                                                {item.PollOptions.map(option => {
                                                                    const voteObj = votesArr.find(v => v.optionId === option.id);
                                                                    const voteCount = voteObj ? voteObj.votes : 0;
                                                                    const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                                                                    const userVoted = item.UserPollOptionSelect?.some(sel => sel.unifiedUserId === user?.unifiedUser?.id && sel.pollOptionsId === option.id);
                                                                    return (
                                                                        <div key={option.id} className="mb-2">
                                                                            <button
                                                                                className={`block w-full text-left px-4 py-2 rounded transition-all relative font-medium flex justify-between items-center
                                                                                  ${userVoted ? 'border-2 border-orange-400  text-orange-700' : 'border border-gray-300  text-gray-800'}
                                                                                  ${shouldShowResults && !userVoted ? 'opacity-70' : 'hover:bg-orange-50'} `}
                                                                                onClick={() => !shouldShowResults && handlePollVote(item.id, option.id)}
                                                                                disabled={shouldShowResults}
                                                                                style={{ position: 'relative', overflow: 'hidden' }}
                                                                            >
                                                                                <span>{option.option}</span>
                                                                                {shouldShowResults && (
                                                                                    <span className="ml-2 text-xs text-orange-700">{percent}% ({voteCount} vote{voteCount !== 1 ? 's' : ''})</span>
                                                                                )}
                                                                                {shouldShowResults && (
                                                                                    <div className="absolute left-0 bottom-0 w-full h-2 bg-orange-100 rounded-b">
                                                                                        <div
                                                                                            className="bg-orange-400 h-2 rounded-b"
                                                                                            style={{ width: `${percent}%` }}
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                                {shouldShowResults && (
                                                                    <div 
                                                                        className="text-xs text-gray-500 mt-1 cursor-pointer hover:text-blue-600 transition-colors"
                                                                        onClick={() => openPollVotersModal(item.id, totalVotes)}
                                                                    >
                                                                        Total votes: {totalVotes}
                                                                    </div>
                                                                )}
                                                                {isPollExpired && !hasVoted && (
                                                                    <div className="text-xs text-red-600 mt-2 text-center italic">
                                                                        This poll has expired. You can no longer vote.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                    {/* Post Stats */}
                                                     <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                                                        <div className="flex items-center gap-4">
                                                             <span className="flex items-center gap-1">
                                                                 <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                     <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                                     <circle cx="9" cy="7" r="4" />
                                                                     <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                                     <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                                 </svg>
                                                                 Group
                                                             </span>
                                                             <span className="flex items-center gap-1 text-gray-500">
                                                                 <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                     <path d="M7 10v6M12 7v9M17 13v3" />
                                                                 </svg>
                                                                 {item.childrenPosts?.filter(child => !child.isArchived).length || 0} Comments
                                                             </span>
                                                             <button 
                                                                 className={`flex items-center gap-1 hover:text-gray-700 transition-colors cursor-pointer ${
                                                                     isPostLiked(item.id) ? 'text-orange-600' : ''
                                                                 }`}
                                                                 onClick={() => handleLikeClick(item.id, item.likes?.length || 0)}
                                                             >
                                                                 <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                     <path d="M6 21v-2a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v2" />
                                                                     <circle cx="12" cy="7" r="4" />
                                                                 </svg>
                                                                 {(item.likes?.length || 0)} Likes
                                                             </button>
                                                        </div>
                                                        <span className="text-xs text-gray-400">{moment(item.createdAt).format("MMM D, YYYY h:mm A")}</span>
                                                    </div>

                                                    {/* Inline Comment Section */}
                                                    {openComments === item.id && (
                                                        <div className="comment-section-container mt-4 border-t border-gray-200 pt-4">
                                                            {/* Comment Input */}
                                                            <div className="mb-4">
                                                                <div className="flex items-start gap-3">
                                                                    <img 
                                                                        src={user?.unifiedUser?.photoURL || user?.unifiedUser?.user?.photoURL || user?.unifiedUser?.partner?.photoURL || user?.unifiedUser?.expert?.photoURL || user?.unifiedUser?.admin?.photoURL || "/t6.svg"} 
                                                                        alt="User" 
                                                                        className="w-8 h-8 rounded-full object-cover border border-gray-200" 
                                                                        onError={e => { e.target.src = "/t6.svg"; }}
                                                                    />
                                                                    <div className="flex-1">
                                                                        <textarea
                                                                            placeholder="Write a comment..."
                                                                            value={commentText[item.id] || ''}
                                                                            onChange={(e) => setCommentText(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                                            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                                                                            rows="3"
                                                                            maxLength="1000"
                                                                        />
                                                                        <div className="flex items-center justify-between mt-2">
                                                                            <span className="text-xs text-gray-500">
                                                                                {(commentText[item.id] || '').length}/1000 characters
                                                                            </span>
                                                                            <button
                                                                                onClick={() => handleComment(item.id)}
                                                                                disabled={!commentText[item.id]?.trim()}
                                                                                className="px-5 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
                                                                            >
                                                                                Post Comment
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Comments List */}
                                                            <div className="space-y-3">
                                                                {item.childrenPosts && item.childrenPosts.length > 0 ? (
                                                                    item.childrenPosts
                                                                        .filter(comment => !comment.isArchived)
                                                                        .map((comment) => {
                                                                            const commentUserPhoto = comment.creator?.photoURL || comment.creator?.user?.photoURL || comment.creator?.partner?.photoURL || comment.creator?.expert?.photoURL || comment.creator?.admin?.photoURL || "/t6.svg";
                                                                            const commentUserName = comment.creator?.user?.name || comment.creator?.partner?.name || comment.creator?.expert?.name || comment.creator?.admin?.name || "User";
                                                                            const isCommentAdmin = !!comment.creator?.adminId;
                                                                            const canEditComment = (user?.userType === 'admin' || user?.unifiedUser?.adminId) || comment.creatorId === user?.unifiedUser?.id;
                                                                            
                                                                            return (
                                                                                <div key={comment.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                                                    <img 
                                                                                        src={commentUserPhoto} 
                                                                                        alt={commentUserName} 
                                                                                        className="w-8 h-8 rounded-full object-cover border border-gray-200" 
                                                                                        onError={e => { e.target.src = "/t6.svg"; }}
                                                                                    />
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <div className="flex items-center gap-1 justify-between mb-1">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <span className="font-medium text-sm text-gray-900">{commentUserName}</span>
                                                                                                {isCommentAdmin && <StarIcon fontSize="small" className="text-blue-600" />}
                                                                                                <span className="text-xs text-gray-500">{moment(comment.createdAt).fromNow()}</span>
                                                                                            </div>
                                                                                            {/* Comment Actions */}
                                                                                            {canEditComment && (
                                                                                                <div className="relative comment-menu-container">
                                                                                                    <button
                                                                                                        onClick={() => setOpenCommentMenu(openCommentMenu === comment.id ? null : comment.id)}
                                                                                                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                                                                                                        aria-label="More options"
                                                                                                    >
                                                                                                        <MoreVertIcon className="w-4 h-4 text-gray-500" />
                                                                                                    </button>
                                                                                                    {openCommentMenu === comment.id && (
                                                                                                        <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                                                                                                            <button
                                                                                                                onClick={() => {
                                                                                                                    handleEditComment(comment.id, comment.content);
                                                                                                                    setOpenCommentMenu(null);
                                                                                                                }}
                                                                                                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                                                            >
                                                                                                                <EditIcon className="w-4 h-4" />
                                                                                                                Edit
                                                                                                            </button>
                                                                                                            <button
                                                                                                                onClick={() => {
                                                                                                                    handleDeleteComment(comment.id);
                                                                                                                    setOpenCommentMenu(null);
                                                                                                                }}
                                                                                                                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                                                                            >
                                                                                                                <DeleteIcon className="w-4 h-4" />
                                                                                                                Delete
                                                                                                            </button>
                                                                                                            {(user?.userType === 'admin' || user?.unifiedUser?.adminId) && (
                                                                                                                <button
                                                                                                                    onClick={() => {
                                                                                                                        handlePostArchive(comment.id, !comment.isArchived);
                                                                                                                        setOpenCommentMenu(null);
                                                                                                                    }}
                                                                                                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                                                                >
                                                                                                                    <ArchiveIcon className="w-4 h-4" />
                                                                                                                    {comment.isArchived ? 'Unarchive' : 'Archive'}
                                                                                                                </button>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                        <p className="text-sm text-gray-700 whitespace-pre-line">{comment.content}</p>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })
                                                                ) : (
                                                                    <div className="text-center py-4 text-gray-500 text-sm">
                                                                        No comments yet. Be the first to comment!
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Archived Comments Section */}
                                                            {item.childrenPosts && item.childrenPosts.filter(comment => comment.isArchived).length > 0 && (
                                                                <div className="mt-4 pt-4 border-t border-gray-200">
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <ArchiveIcon className="w-4 h-4 text-gray-500" />
                                                                        <span className="text-sm font-medium text-gray-600">Archived Comments</span>
                                                                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                                                                            {item.childrenPosts.filter(comment => comment.isArchived).length}
                                                                        </span>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {item.childrenPosts
                                                                            .filter(comment => comment.isArchived)
                                                                            .map((comment) => {
                                                                                const commentUserPhoto = comment.creator?.photoURL || comment.creator?.user?.photoURL || comment.creator?.partner?.photoURL || comment.creator?.expert?.photoURL || comment.creator?.admin?.photoURL || "/t6.svg";
                                                                                const commentUserName = comment.creator?.user?.name || comment.creator?.partner?.name || comment.creator?.expert?.name || comment.creator?.admin?.name || "User";
                                                                                const isCommentAdmin = !!comment.creator?.adminId;
                                                                                const canEditComment = (user?.userType === 'admin' || user?.unifiedUser?.adminId) || comment.creatorId === user?.unifiedUser?.id;
                                                                                
                                                                                return (
                                                                                    <div key={comment.id} className="flex items-start gap-3 p-3 bg-gray-100 rounded-lg opacity-75">
                                                                                        <img 
                                                                                            src={commentUserPhoto} 
                                                                                            alt={commentUserName} 
                                                                                            className="w-8 h-8 rounded-full object-cover border border-gray-200" 
                                                                                            onError={e => { e.target.src = "/t6.svg"; }}
                                                                                        />
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <div className="flex items-center gap-1 justify-between mb-1">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <span className="font-medium text-sm text-gray-600">{commentUserName}</span>
                                                                                                    {isCommentAdmin && <StarIcon fontSize="small" className="text-blue-600" />}
                                                                                                    <span className="text-xs text-gray-400">{moment(comment.createdAt).fromNow()}</span>
                                                                                                    <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">Archived</span>
                                                                                                </div>
                                                                                                {/* Comment Actions for Archived Comments */}
                                                                                                {canEditComment && (
                                                                                                    <div className="relative comment-menu-container">
                                                                                                        <button
                                                                                                            onClick={() => setOpenCommentMenu(openCommentMenu === comment.id ? null : comment.id)}
                                                                                                            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                                                                                                            aria-label="More options"
                                                                                                        >
                                                                                                            <MoreVertIcon className="w-4 h-4 text-gray-400" />
                                                                                                        </button>
                                                                                                        {openCommentMenu === comment.id && (
                                                                                                            <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                                                                                                                <button
                                                                                                                    onClick={() => {
                                                                                                                        handleEditComment(comment.id, comment.content);
                                                                                                                        setOpenCommentMenu(null);
                                                                                                                    }}
                                                                                                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                                                                >
                                                                                                                    <EditIcon className="w-4 h-4" />
                                                                                                                    Edit
                                                                                                                </button>
                                                                                                                <button
                                                                                                                    onClick={() => {
                                                                                                                        handleDeleteComment(comment.id);
                                                                                                                        setOpenCommentMenu(null);
                                                                                                                    }}
                                                                                                                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                                                                                >
                                                                                                                    <DeleteIcon className="w-4 h-4" />
                                                                                                                    Delete
                                                                                                                </button>
                                                                                                                {(user?.userType === 'admin' || user?.unifiedUser?.adminId) && (
                                                                                                                    <button
                                                                                                                        onClick={() => {
                                                                                                                            handlePostArchive(comment.id, !comment.isArchived);
                                                                                                                            setOpenCommentMenu(null);
                                                                                                                        }}
                                                                                                                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                                                                    >
                                                                                                                        <ArchiveIcon className="w-4 h-4" />
                                                                                                                        Unarchive
                                                                                                                    </button>
                                                                                                                )}
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                            <p className="text-sm text-gray-600 whitespace-pre-line">{comment.content}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}


                                                </div>
                                            );
                                        })
                                    ) : (
                                        <EmptyState
                                            icon={DescriptionIcon}
                                             title={showArchivedPosts ? "No archived posts" : "No posts yet"}
                                             description={showArchivedPosts ? "There are no archived posts in this community." : "Be the first to create a post in this community!"}
                                        />
                                    );
                                })()}
                            </div>
                                            </>
                                        )}

                                        {selectedLink === 2 && (
                                            <div className="mb-6">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                                                        <VideoCallIcon className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-semibold text-gray-900">Sessions</h4>
                                                        <p className="text-xs text-gray-500">{communitySessions.length} {communitySessions.length === 1 ? 'session' : 'sessions'}</p>
                                                    </div>
                                                </div>

                                                {communitySessions.length > 0 ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                        {communitySessions.map((item, index) => (
                                                            <ClassCard details={item} users={users} key={index} />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <EmptyState
                                                        icon={VideoCallIcon}
                                                        title="No sessions available"
                                                        description="There are no sessions scheduled at the moment. Sessions will appear here once they're created."
                                                    />
                                                )}
                                            </div>
                                        )}

                                        {selectedLink === 3 && (
                                            <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                        <FolderIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900">Resources</h4>
                        <p className="text-xs text-gray-500">{currResources.length} {currResources.length === 1 ? 'resource' : 'resources'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Rectangular Search Input with icon */}
                    <div className="relative flex items-center">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            id="resource-search-input"
                            type="text"
                            value={resourceSearch}
                            onChange={e => setResourceSearch(e.target.value)}
                            placeholder="Search resources..."
                            className="w-56 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm bg-white text-gray-900 transition-all duration-200"
                            autoComplete="off"
                        />
                        {resourceSearch && (
                            <button
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-500 focus:outline-none"
                                aria-label="Clear search"
                                tabIndex={0}
                                type="button"
                                onClick={() => setResourceSearch("")}
                            >
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    {/* Rectangular Add Resource Button with icon and text */}
                    <button
                        onClick={() => setShowResourceModal(true)}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
                        aria-label="Add Resource"
                        tabIndex={0}
                        title="Add Resource"
                        type="button"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
                        <span>Add Resource</span>
                    </button>
                </div>
            </div>
            {currResources.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                    {currResources.map((item, index) => {
                        let domain = "";
                        try {
                            domain = new URL(item.link).hostname.replace(/^www\./, "");
                        } catch { }
                        const faviconUrl = domain
                            ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
                            : "/link.svg";
                        return (
                            <a
                                key={index}
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block bg-white rounded-xl p-5 border border-gray-100 shadow-md hover:shadow-lg hover:bg-orange-50 transition-all flex-1 basis-1/3 max-w-[31.333%]"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <img
                                        src={faviconUrl}
                                        alt={domain}
                                        className="w-6 h-6 rounded"
                                        style={{ background: "#f3f4f6" }}
                                    />
                                    <h4 className="font-semibold text-base text-gray-900 truncate flex-1">{item.name}</h4>
                                </div>
                                <p className="text-sm text-gray-500 truncate">{domain}</p>
                            </a>
                        );
                    })}
                </div>
            ) : (
                <EmptyState
                    icon={FolderIcon}
                    title="No resources available"
                    description="There are no resources shared yet. Resources will appear here once they're added."
                />
            )}
            {showResourceModal && (
                <ResourceAddModal
                    open={showResourceModal}
                    onClose={() => setShowResourceModal(false)}
                    community={currentCommunity}
                    onSuccess={() => {
                        setShowResourceModal(false);
                        dispatch(setResources(comId));
                        dispatch(setResourcesCommunity(comId));
                        handleTabChange(3); // Ensure Resources tab is selected
                    }}
                />
            )}
        </div>
    )}

                                        {selectedLink === 4 && (
                                            <div className="mb-6">
                                                {/* Scheduled CatchUps Section */}
                                                <ScheduledCatchup 
                                                    scheduledCatchups={scheduledCatchups}
                                                    onJoinCatchUp={(catchup) => {
                                                        if (liveCatchup) {
                                                            showJoinConfirmationModal(liveCatchup, "instant");
                                                        } else {
                                                            showJoinConfirmationModal(catchup, "scheduled");
                                                        }
                                                    }}
                                                    showButtons={!liveCatchup} // Hide creation buttons if there's a live catchup
                                                    onInstantCatchUp={() => showJoinConfirmationModal(null, "instant")}
                                                    onScheduleCatchUp={() => {
                                                        console.log('Schedule CatchUp button clicked!');
                                                        console.log('Setting showCatchUpModal to true');
                                                        setShowCatchUpModal(true);
                                                    }}
                                                    defaultToSchedule={true}
                                                    isCheckingLiveCatchup={isCheckingLiveCatchup}
                                                    liveCatchup={liveCatchup}
                                                    communityId={comId}
                                                />
        </div>
    )}

                                        {selectedLink === 7 && (
                                            <div id="huddles-section" className="mb-6">
                                                {/* Orange Theme Header */}
                                                <div className="flex items-center justify-between mb-4 px-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                                                            <ForumIcon className="w-5 h-5 text-white" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-base font-semibold text-gray-900">Huddles</h4>
                                                            <p className="text-xs text-gray-500">{huddles.length} {huddles.length === 1 ? 'huddle' : 'huddles'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setHuddleViewMode('card')}
                                                            className={`p-2.5 rounded-lg transition-all duration-200 ${
                                                                huddleViewMode === 'card'
                                                                    ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600'
                                                                    : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600 border border-gray-200 hover:border-orange-200'
                                                            }`}
                                                            title="Card View"
                                                        >
                                                            <ViewModuleIcon className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setHuddleViewMode('table')}
                                                            className={`p-2.5 rounded-lg transition-all duration-200 ${
                                                                huddleViewMode === 'table'
                                                                    ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600'
                                                                    : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600 border border-gray-200 hover:border-orange-200'
                                                            }`}
                                                            title="Table View"
                                                        >
                                                            <TableChartIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {loadingHuddles ? (
                                                    <div className="flex items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
                                                        <div className="text-center">
                                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                                                            <p className="text-sm text-gray-600">Loading huddles...</p>
                                                        </div>
                                                    </div>
                                                ) : huddles.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-lg border border-gray-200">
                                                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                                                            <ForumIcon className="w-8 h-8 text-orange-500" />
                                                        </div>
                                                        <h3 className="text-base font-semibold text-gray-900 mb-2">No Huddles Available</h3>
                                                        <p className="text-sm text-gray-500 max-w-sm">
                                                            There are no huddles scheduled at the moment. Huddles will appear here once they're created.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    huddleViewMode === 'card' ? (
                                                    <div className="relative w-full max-w-full overflow-x-hidden">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 w-full">
                                                            {(showMoreHuddles ? huddles : huddles.slice(0, visibleHuddlesCount)).map((huddle, index) => {
                                                                const getHuddleStatus = (h) => {
                                                                    if (h.isLive) return { label: 'Live', color: 'bg-green-100 text-green-700' };
                                                                    if (h.isScheduled) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
                                                                    if (h.endTime) return { label: 'Completed', color: 'bg-gray-100 text-gray-700' };
                                                                    return { label: 'Draft', color: 'bg-yellow-100 text-yellow-700' };
                                                                };

                                                                const formatDate = (dateString) => {
                                                                    if (!dateString) return 'N/A';
                                                                    const date = new Date(dateString);
                                                                    return date.toLocaleDateString('en-US', {
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    });
                                                                };

                                                                const status = getHuddleStatus(huddle);
                                                                const isLive = huddle.isLive;
                                                                const attendeeCount = huddle.attendeesCount || huddle._count?.attendances || 0;
                                                                const bannerImage = huddle.community?.bannerImg || currentCommunity?.bannerImg || "/logoifca.png";
                                                                const imageSrc = bannerImage.startsWith('http') ? bannerImage : bannerImage;
                                                                
                                                                return (
                                                                    <motion.div
                                                                        key={`huddle-${huddle.id}-${index}`}
                                                                        initial={{ opacity: 0, y: 20 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        transition={{ delay: index * 0.05 }}
                                                                        className="group relative h-[280px] sm:h-[300px] md:h-[320px] cursor-pointer"
                                                                        onClick={() => router.push(`/admin/huddle/${huddle.id}`)}
                                                                        style={{ perspective: '1000px' }}
                                                                    >
                                                                        {/* Flip Card Container */}
                                                                        <div className="flip-card-inner relative w-full h-full transition-transform duration-700 transform-style-preserve-3d">
                                                                            {/* Front Side - Image with Name */}
                                                                            <div className="absolute inset-0 w-full h-full backface-hidden rounded-xl overflow-hidden shadow-md border border-gray-200">
                                                                                <div className="relative w-full h-full">
                                                                                    {/* Image */}
                                                                                    <img
                                                                                        src={imageSrc}
                                                                                        alt={huddle.community?.title || 'Huddle'}
                                                                                        className="w-full h-full object-cover"
                                                                                        onError={(e) => {
                                                                                            e.target.src = "/logoifca.png";
                                                                                        }}
                                                                                    />
                                                                                    
                                                                                    {/* Gradient Overlay */}
                                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                                                                    
                                                                                    {/* Date/Time Badge - Top Left */}
                                                                                    <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10">
                                                                                        <div className="bg-white/95 backdrop-blur-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg shadow-md">
                                                                                            <div className="text-[9px] sm:text-[10px] font-semibold text-gray-900 whitespace-nowrap">
                                                                                                {(() => {
                                                                                                    const dateStr = formatDate(huddle.scheduledTime);
                                                                                                    const parts = dateStr.split(',');
                                                                                                    return parts[0] || '';
                                                                                                })()}
                                                                                            </div>
                                                                                            <div className="text-[8px] sm:text-[9px] text-gray-600">
                                                                                                {(() => {
                                                                                                    const dateStr = formatDate(huddle.scheduledTime);
                                                                                                    const parts = dateStr.split(',');
                                                                                                    return parts[1]?.trim() || '';
                                                                                                })()}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    
                                                                                    {/* Status Badge - Top Right */}
                                                                                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
                                                                                        <span className={`inline-flex items-center px-1.5 py-0.5 sm:px-2 rounded-full text-[9px] sm:text-[10px] font-semibold shadow-md ${
                                                                                            isLive ? 'bg-green-500 text-white animate-pulse' :
                                                                                            status.label === 'Upcoming' ? 'bg-orange-500 text-white' :
                                                                                            status.label === 'Completed' ? 'bg-gray-500 text-white' :
                                                                                            'bg-yellow-500 text-white'
                                                                                        }`}>
                                                                                            {isLive && <span className="w-1 h-1 bg-white rounded-full mr-0.5 sm:mr-1"></span>}
                                                                                            <span className="hidden sm:inline">{status.label}</span>
                                                                                            <span className="sm:hidden">{status.label.substring(0, 4)}</span>
                                                                                        </span>
                                                                                    </div>
                                                                                    
                                                                                    {/* Huddle Name - Bottom */}
                                                                                    <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 z-10">
                                                                                        <h3 className="text-white font-bold text-xs sm:text-sm mb-0.5 sm:mb-1 line-clamp-1 drop-shadow-lg">
                                                                                            {huddle.title}
                                                                                        </h3>
                                                                                        {huddle.community?.title && (
                                                                                            <div className="flex items-center gap-1 text-white/90 text-[10px] sm:text-xs">
                                                                                                <MdGroups className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                                                                <span className="truncate">{huddle.community.title}</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            {/* Back Side - Details */}
                                                                            <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white">
                                                                                <div className="h-full flex flex-col p-2 sm:p-3 md:p-4 overflow-y-auto">
                                                                                    {/* Title */}
                                                                                    <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 sm:mb-2 line-clamp-1">
                                                                                        {huddle.title}
                                                                                    </h3>
                                                                                    
                                                                                    {/* Community */}
                                                                                    {huddle.community?.title && (
                                                                                        <div className="flex items-center gap-1 sm:gap-1.5 mb-2 sm:mb-3">
                                                                                            <MdGroups className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600 flex-shrink-0" />
                                                                                            <span className="text-[10px] sm:text-xs text-gray-700 font-medium truncate">{huddle.community.title}</span>
                                                                                        </div>
                                                                                    )}
                                                                                    
                                                                                    {/* Description */}
                                                                                    {huddle.description && (
                                                                                        <p className="text-[10px] sm:text-xs text-gray-600 mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-3 leading-relaxed flex-shrink-0">
                                                                                            {huddle.description}
                                                                                        </p>
                                                                                    )}
                                                                                    
                                                                                    {/* Info Section */}
                                                                                    <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3 flex-shrink-0">
                                                                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                                                                            <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-orange-50 flex items-center justify-center">
                                                                                                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                                                </svg>
                                                                                            </div>
                                                                                            <span className="text-[10px] sm:text-xs text-gray-700 truncate">{formatDate(huddle.scheduledTime)}</span>
                                                                                        </div>
                                                                                        
                                                                                        {huddle.frequency && (
                                                                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                                                                <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-orange-50 flex items-center justify-center">
                                                                                                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                                                    </svg>
                                                                                                </div>
                                                                                                <span className="text-[10px] sm:text-xs text-gray-700 capitalize truncate">{huddle.frequency.toLowerCase()}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        
                                                                                        {huddle.locationType && (
                                                                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                                                                <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-orange-50 flex items-center justify-center">
                                                                                                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                                    </svg>
                                                                                                </div>
                                                                                                <span className="text-[10px] sm:text-xs text-gray-700 capitalize truncate">{huddle.locationType.toLowerCase()}</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                    
                                                                                    {/* Footer */}
                                                                                    <div className="mt-auto pt-1.5 sm:pt-2 border-t border-gray-200">
                                                                                        {attendeeCount > 0 && (
                                                                                            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                                                                                <div className="flex -space-x-1 sm:-space-x-1.5">
                                                                                                    {[...Array(Math.min(attendeeCount, 3))].map((_, i) => (
                                                                                                        <div key={i} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white flex items-center justify-center text-white text-[8px] sm:text-[9px] font-bold shadow-sm">
                                                                                                            {String.fromCharCode(65 + i)}
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>
                                                                                                <span className="text-[9px] sm:text-[10px] text-gray-600 font-medium truncate">
                                                                                                    {attendeeCount} {attendeeCount === 1 ? 'attendee' : 'attendees'}
                                                                                                </span>
                                                                                            </div>
                                                                                        )}
                                                                                        <button className="w-full text-orange-500 hover:text-orange-600 font-bold text-[10px] sm:text-xs uppercase tracking-wide transition-colors text-center py-0.5 sm:py-1">
                                                                                            VIEW DETAILS
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                );
                                                            })}
                                                        </div>
                                                        
                                                        {/* More Huddles Button */}
                                                        {huddles.length > visibleHuddlesCount && !showMoreHuddles && (
                                                            <div className="mt-4 flex justify-center">
                                                                <button
                                                                    onClick={() => setShowMoreHuddles(true)}
                                                                    className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
                                                                >
                                                                    <span>Show More ({huddles.length - visibleHuddlesCount} more)</span>
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        )}
                                                        
                                                        {/* Show Less Button */}
                                                        {showMoreHuddles && huddles.length > visibleHuddlesCount && (
                                                            <div className="mt-4 flex justify-center">
                                                                <button
                                                                    onClick={() => {
                                                                        setShowMoreHuddles(false);
                                                                        // Scroll to top of huddles section
                                                                        const huddlesSection = document.getElementById('huddles-section');
                                                                        if (huddlesSection) {
                                                                            huddlesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                                        }
                                                                    }}
                                                                    className="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                                    </svg>
                                                                    <span>Show Less</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    ) : (
                                                        <div className="bg-white rounded-xl shadow-md overflow-hidden w-full">
                                                            <div className="overflow-x-auto w-full max-w-full">
                                                                <table className="w-full">
                                                                    <thead className="bg-gray-50 border-b border-gray-200">
                                                                        <tr>
                                                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Title</th>
                                                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date & Time</th>
                                                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Frequency</th>
                                                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Attendees</th>
                                                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                                        {huddles.map((huddle) => {
                                                                            const status = huddle.isLive ? 'Live' : huddle.isScheduled ? 'Upcoming' : huddle.endTime ? 'Completed' : 'Draft';
                                                                            const statusColor = huddle.isLive ? 'bg-green-100 text-green-700' : huddle.isScheduled ? 'bg-orange-100 text-orange-700' : huddle.endTime ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700';
                                                                            
                                                                            const formatDate = (dateString) => {
                                                                                if (!dateString) return 'N/A';
                                                                                const date = new Date(dateString);
                                                                                return date.toLocaleDateString('en-US', {
                                                                                    month: 'short',
                                                                                    day: 'numeric',
                                                                                    year: 'numeric'
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

                                                                            return (
                                                                                <tr
                                                                                    key={huddle.id}
                                                                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                                                                    onClick={() => router.push(`/admin/huddle/${huddle.id}`)}
                                                                                >
                                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                                        <div className="text-sm font-medium text-gray-900">{huddle.title}</div>
                                                                                        {huddle.description && (
                                                                                            <div className="text-xs text-gray-500 mt-1 line-clamp-1">{huddle.description}</div>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                                        {huddle.scheduledTime ? (
                                                                                            <div className="text-sm text-gray-900">
                                                                                                <div>{formatDate(huddle.scheduledTime)}</div>
                                                                                                <div className="text-xs text-gray-500">{formatTime(huddle.scheduledTime)}</div>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <span className="text-sm text-gray-500">N/A</span>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                                        <span className="text-sm text-gray-900 capitalize">
                                                                                            {huddle.frequency ? huddle.frequency.toLowerCase() : 'N/A'}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                                                                                            {status}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                                        {huddle.attendeesCount || 0}
                                                                                    </td>
                                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                router.push(`/admin/huddle/${huddle.id}`);
                                                                                            }}
                                                                                            className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-1"
                                                                                        >
                                                                                            View
                                                                                        </button>
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}

                                        {selectedLink === 6 && (
                                            <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                                        <AssignmentIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900">Forms</h4>
                                        <p className="text-xs text-gray-500">{currentCommunity?.forms?.length || 0} {currentCommunity?.forms?.length === 1 ? 'form' : 'forms'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push(`/admin/forms/create?communityId=${id}`)}
                                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-5 py-2.5 flex items-center gap-2 text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
                                    aria-label="Add Form"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
                                    <span>Add Form</span>
                                </button>
                            </div>

                                                {currentCommunity && currentCommunity.forms && currentCommunity.forms.length > 0 ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {currentCommunity.forms.map((form) => (
                                                            <div
                                                                key={form.id}
                                                                className="bg-white rounded-xl border-l-4 border-orange-500 shadow-md hover:shadow-lg hover:bg-orange-50 transition-all p-5 flex flex-col gap-2 group"
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <h3 className="font-bold text-base text-gray-900 group-hover:text-orange-600">{form.formName}</h3>
                                                                    {form.isGlobal && (
                                                                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-600">
                                                                            Global
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center text-xs text-gray-500 gap-2">
                                                                    <span>
                                                                        {new Date(form.createdAt).toLocaleDateString("en-US", {
                                                                            year: "numeric",
                                                                            month: "short",
                                                                            day: "numeric",
                                                                        })}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between mt-2">
                                                                    <button
                                                                        onClick={() => router.push(`/forms/${form.id}`)}
                                                                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-1"
                                                                    >
                                                                        <ArrowForwardIosIcon className="text-white" fontSize="small" />
                                                                        <span>Open Form</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleViewResponses(form.id)}
                                                                        className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                                                                    >
                                                                        <VisibilityIcon className="text-white" fontSize="small" />
                                                                        <span>View Responses</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <EmptyState
                                                        icon={AssignmentIcon}
                                                        title="No forms available"
                                                        description="There are no forms to fill out at the moment. Forms will appear here once they're created."
                                                    />
                                                )}
                                            </div>
                                        )}

                                        {selectedLink === 5 && (
                                            <div className="mb-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                                        <BusinessIcon className="w-5 h-5 text-orange-400" />
                                                        Services
                                                    </h4>
                                                    <ServiceActions
                                                        onAdd={() => setAddServiceOpen(true)}
                                                        onView={() => router.push(`/partner/services/viewInterests?communityId=${comId}`)}
                                                    />
                                                </div>
                                                <Services services={services} serviceResponses={serviceResponses} addServiceOpen={addServiceOpen} setAddServiceOpen={setAddServiceOpen} handleAddServiceOpen={handleAddServiceOpen} handleAddServiceClose={handleAddServiceClose} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                {/* Poll Modal */}
                {showPollModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {editingPoll ? "Edit Poll" : "Create Poll"}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowPollModal(false);
                                        setEditingPoll(null);
                                        setPollQuestion("");
                                        setPollOptions([{ text: "" }, { text: "" }]);
                                        setPollExpiresAt("");
                                    }}
                                    className="text-gray-400 hover:text-orange-500 text-2xl p-1 rounded-full transition"
                                    aria-label="Close"
                                >
                                    &times;
                                </button>
                            </div>
                            <div className="px-6 pb-6">
                                <Poll
                                    showPoll={false}
                                    question={pollQuestion}
                                    setQuestion={setPollQuestion}
                                    options={pollOptions}
                                    setOptions={setPollOptions}
                                    expiresAt={pollExpiresAt}
                                    setExpiresAt={setPollExpiresAt}
                                    onSubmit={handleUpdatePoll}
                                    setShowPoll={() => { }}
                                    onClose={() => setShowPollModal(false)}
                                />
                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        className="px-5 py-2 rounded-lg border border-gray-200 text-gray-600 font-semibold bg-gray-50 hover:bg-gray-100 transition"
                                        onClick={() => {
                                            setShowPollModal(false);
                                            setEditingPoll(null);
                                            setPollQuestion("");
                                            setPollOptions([{ text: "" }, { text: "" }]);
                                            setPollExpiresAt("");
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="px-5 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-orange-400 to-pink-400 shadow hover:opacity-90 transition"
                                        onClick={handleUpdatePoll}
                                    >
                                        Update Poll
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Join Confirmation Modal */}
                <JoinConfirmationModal
                    isOpen={showJoinConfirmation}
                    onClose={() => {
                        setShowJoinConfirmation(false);
                        setJoinConfirmationData(null);
                    }}
                    onConfirm={handleJoinConfirmation}
                    title={joinConfirmationData?.title || "Join Meeting"}
                    message={joinConfirmationData?.message || "Join the meeting session"}
                    type={joinConfirmationData?.type || "scheduled"}
                />

                {/* PostModal and other modals here */}
                <PostModal
                    open={showPostModal}
                    onClose={() => {
                        setShowPostModal(false);
                        setEditingPost(null);
                    }}
                    user={user}
                    userCommunities={userCommunitiesIds.map(id => allCommunities.find(com => com.id === id)).filter(Boolean)}
                    refreshFeed={() => {
                        if (comId) {
                            dispatch(setCommunityPosts(comId));
                        }
                    }}
                    editingPost={editingPost}
                    setEditingPost={setEditingPost}
                    fixedCommunity={currentCommunity}
                />
                <LikesModal
                    open={likesModalOpen}
                    onClose={closeLikesModal}
                    postId={likesModalPostId}
                    likeCount={likesModalLikeCount}
                />
                <PollVotersModal
                    open={pollVotersModalOpen}
                    onClose={closePollVotersModal}
                    postId={pollVotersModalPostId}
                    totalVotes={pollVotersModalTotalVotes}
                />
                
                {/* Share Modal */}
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    shareData={shareModalData}
                />
                
                {/* CatchUp Modal */}
                <CatchUpModal
                    isOpen={showCatchUpModal}
                    onClose={() => setShowCatchUpModal(false)}
                    onInstantCatchUp={createInstantCatchUp}
                    onScheduledCatchUp={createScheduledCatchUp}
                    communityName={currentCommunity?.title || 'Community'}
                    communityId={comId}
                />
            </div>
                </Layout>
    );
};

export default comHome;
