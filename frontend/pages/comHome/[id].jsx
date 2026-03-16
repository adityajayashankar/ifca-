import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Layout from "@/components/layout";
import Head from "next/head";
import { toast } from "react-toastify";
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
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import moment from "moment";
import { useRouter } from "next/router";
import companyData from "@/utils/data";
import ClassCard from "@/components/classCard";
import { selectCommunityPosts, setCommunityPosts, selectLikeMap } from "@/store/features/postsSlice";
import {
  selectUser,
  selectUserCommunities,
  selectUserSessions,
  setUserSessions,
} from "@/store/features/userSlice";
import { selectAllVideos, setAllVideos } from "@/store/features/videoSlice";
import { useLayoutEffect } from "react";
import api from "@/utils/apiSetup";
import axios from "axios";
import FormResponsesModal from "@/components/forms/formResponses";
import Services from "@/components/services";
import PostModal from "@/components/post/PostModals";
import PostX from "@/components/socialPost/PostX";
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
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SendIcon from "@mui/icons-material/Send";
import StarIcon from "@mui/icons-material/Star";
import GroupsIcon from "@mui/icons-material/Groups";
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Poll from "@/components/chat/polls";
import CatchUpModal from "@/components/catchupModal";
import ScheduledCatchup from "@/components/scheduledCatchup";
import JoinConfirmationModal from "@/components/JoinConfirmationModal";
import { useCatchupAttendance } from "@/hooks/useCatchupAttendance";

import { MdVideocam, MdSchedule } from 'react-icons/md';
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
import ShareModal from "@/components/common/ShareModal";

const comHome = () => {
  const router = useRouter();
  const { id, tab, q } = router.query;
  const comId = id ? parseInt(id) : null;
  
  // Map tab query parameter values to tab IDs
  const tabMap = {
    'updates': 1,
    'sessions': 2,
    'resources': 3,
    'catchup': 4,
    'services': 5,
    'forms': 6,
    'huddles': 7,
  };
  
  // Reverse map: tab ID to query parameter value
  const tabIdToQuery = {
    1: 'updates',
    2: 'sessions',
    3: 'resources',
    4: 'catchup',
    5: 'services',
    6: 'forms',
    7: 'huddles',
  };
  
  // Initialize selectedLink from query parameter or default to 1
  const getInitialTab = () => {
    if (tab && typeof tab === 'string' && tabMap[tab.toLowerCase()]) {
      return tabMap[tab.toLowerCase()];
    }
    return 1; // Default to Updates tab
  };
  
  const [selectedLink, setSelectedLink] = useState(getInitialTab());
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const user = useSelector(selectUser);
  const users = useSelector(selectCommunityUsers);
  const [openModal, setOpenModal] = useState(false);
  const allCommunities = useSelector(selectAllCommunities)

  // Add poll modal states
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState([{ text: "" }, { text: "" }]);
  const [pollExpiresAt, setPollExpiresAt] = useState("");
  const [editingPoll, setEditingPoll] = useState(null);

  // Add CatchUp states
  const [scheduledCatchups, setScheduledCatchups] = useState([]);
  const [showCatchUpModal, setShowCatchUpModal] = useState(false);

  // Debug: Log modal state changes
  useEffect(() => {
    console.log('showCatchUpModal state changed to:', showCatchUpModal);
  }, [showCatchUpModal]);

  const userId = user?.unifiedUser?.id
  const communityId = allCommunities?.filter((com) => com.id === comId)[0]?.id

  // const isLive = useSelector(checkCatchUpLive)
  const [isLive, setLive] = useState(false);
  const [activeRoom, setActiveRoom] = useState("");
  const allVideos = useSelector(selectAllVideos);
  const [selectedForm, setSelectedForm] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [stickyShadow, setStickyShadow] = useState(false);
  const stickyRef = useRef(null);

  // Add state for live catchup
  const [liveCatchup, setLiveCatchup] = useState(null);
  const [showJoinConfirmation, setShowJoinConfirmation] = useState(false);
  const [joinConfirmationData, setJoinConfirmationData] = useState(null);
  const [isCheckingLiveCatchup, setIsCheckingLiveCatchup] = useState(false);
  const [catchupAttendees, setCatchupAttendees] = useState([]);
  const [showAttendees, setShowAttendees] = useState(false);
  
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


  // Clean up malformed URLs with multiple tab parameters or URL-encoded issues
  useEffect(() => {
    if (router.isReady && router.query) {
      const asPath = router.asPath;
      const hasMalformedUrl = asPath.includes('%3F') || asPath.match(/\?.*\?/) || 
                             (typeof router.query.tab === 'object' && Array.isArray(router.query.tab));
      
      if (hasMalformedUrl) {
        // Extract valid tab from query or use default
        let validTab = 'updates';
        
        // Try to get the last valid tab parameter
        if (router.query.tab) {
          if (Array.isArray(router.query.tab)) {
            // If tab is an array, get the last valid one
            const validTabs = router.query.tab.filter(t => t && typeof t === 'string' && tabMap[t.toLowerCase()]);
            if (validTabs.length > 0) {
              validTab = validTabs[validTabs.length - 1].toLowerCase();
            }
          } else if (typeof router.query.tab === 'string') {
            const normalizedTab = router.query.tab.toLowerCase();
            if (tabMap[normalizedTab]) {
              validTab = normalizedTab;
            }
          }
        }
        
        // Build clean query object
        const cleanQuery = {
          tab: validTab
        };
        
        // Preserve other valid query parameters (like search, q), but exclude id
        Object.keys(router.query).forEach(key => {
          // Skip malformed keys, duplicate tab params, and route parameters (id)
          if (key === 'tab' || key === 'id' || key.includes('?') || key.includes('%3F') || key.includes('=')) {
            return;
          }
          
          const value = router.query[key];
          // Only add valid, non-array values (unless it's intentional)
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              // For arrays, take the last valid value
              cleanQuery[key] = value[value.length - 1];
            } else {
              cleanQuery[key] = value;
            }
          }
        });
        
        // Use replace with as parameter to ensure clean URL without id in query string
        const queryString = Object.keys(cleanQuery).length > 0 
          ? '?' + new URLSearchParams(cleanQuery).toString() 
          : '';
        router.replace(
        {
            pathname: `/comHome/[id]`,
            query: { id: comId, ...cleanQuery }
        },
          `/comHome/${comId}${queryString}`,
          { shallow: true }
        );
      }
    }
  }, [router.isReady, router.asPath, comId, tabMap]);

  // Sync selectedLink with query parameter when route changes or on initial load
  useEffect(() => {
    if (router.isReady) {
      if (tab && typeof tab === 'string') {
        const tabId = tabMap[tab.toLowerCase()];
        if (tabId && tabId !== selectedLink) {
          setSelectedLink(tabId);
        }
      } else if (!tab && selectedLink !== 1) {
        // If no tab query param and not on default tab, set to default
        // But don't update URL if we're already on the default tab
        setSelectedLink(1);
      }
    }
  }, [router.isReady, tab]);


  const userCommunitiesIds = useSelector(selectUserCommunities)?.map((item) => {
    return item.id;
  });

  const [services, setServices] = useState([]);
  const [token, setToken] = useState("");
  const [serviceResponses, setServiceResponses] = useState([]);

  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [openComments, setOpenComments] = useState(null);
  const [likes, setLikes] = useState({});
  const [commentText, setCommentText] = useState({});
  const postRefs = useRef({});

  // Add dropdown menu state
  const [openMenu, setOpenMenu] = useState(null);

  // Add comment dropdown menu state
  const [openCommentMenu, setOpenCommentMenu] = useState(null);
  const [editingComment, setEditingComment] = useState(null);

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalData, setShareModalData] = useState({});

  // Add click outside handler for dropdown menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenu && !event.target.closest('.dropdown-menu')) {
        setOpenMenu(null);
      }
      if (openCommentMenu && !event.target.closest('.comment-dropdown-menu')) {
        setOpenCommentMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenu, openCommentMenu]);

  // Search state - sync with URL query
  const [postSearch, setPostSearch] = useState(q || '');
  
  // Sync postSearch with URL query parameter
  useEffect(() => {
    if (q !== undefined) {
      setPostSearch(q);
    } else {
      setPostSearch('');
    }
  }, [q]);

  // Add like and comment handlers
  const handleLike = async (postId) => {
    if (!user || !user.unifiedUser?.id) return;
    try {
      const currentLikeState = likes[postId] || likeMap[postId] === 1;
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

  // Comment handler (optimistic)
  const handleComment = async (postId) => {
    if (!user || !user.unifiedUser?.id || !commentText[postId]) return;
    
    const commentContent = commentText[postId].trim();
    if (!commentContent) {
      alert('Comment cannot be empty');
      return;
    }
    
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
      const response = await api.post('/thread', payload);
      
      if (response.data) {
      setCommentText(prev => ({ ...prev, [postId]: '' }));
      dispatch(setCommunityPosts(comId));
        // Show success feedback
        alert('Comment posted successfully!');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    }
  };

  // Comment edit handler
  const handleEditComment = async (commentId, newContent) => {
    if (!user || !user.unifiedUser?.id || !newContent) return;
    
    const trimmedContent = newContent.trim();
    if (!trimmedContent) {
      alert('Comment cannot be empty');
      return;
    }
    
    try {
      const response = await api.patch(`/thread/${commentId}`, {
        content: trimmedContent,
        title: "",
        assetsData: [],
        tagsData: []
      });
      
      if (response.data) {
      setEditingComment(null);
      dispatch(setCommunityPosts(comId));
        // Show success feedback
        alert('Comment updated successfully!');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment. Please try again.');
    }
  };

  // Comment delete handler
  const handleDeleteComment = async (commentId) => {
    if (!user || !user.unifiedUser?.id) return;
    
    const confirmed = confirm("Are you sure you want to delete this comment? This action cannot be undone.");
    if (!confirmed) return;
    
    try {
      const response = await api.delete(`/thread/${commentId}`);
      if (response.data) {
        dispatch(setCommunityPosts(comId));
        alert('Comment deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
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

  // Poll update handler
  const handleUpdatePoll = async () => {
    if (!editingPoll || !user?.unifiedUser?.id) return;

    try {
      const updatedPoll = {
        title: pollQuestion,
        content: editingPoll.content,
        PollOptions: pollOptions.map(option => ({ option: option.text })),
        pollExpiresAt: new Date(pollExpiresAt).toISOString(),
        isPoll: true
      };

      await api.patch(`/thread/${editingPoll.id}`, updatedPoll);
      dispatch(setCommunityPosts(comId));
      setShowPollModal(false);
      setEditingPoll(null);
      setPollQuestion("");
      setPollOptions([{ text: "" }, { text: "" }]);
      setPollExpiresAt("");
    } catch (error) {
      console.error("Error updating poll:", error);
    }
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

  useEffect(() => {
    user == null && router.push("/onBoard");
    // Get JWT from localStorage or cookies (adjust as needed)
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      if (storedToken) setToken(storedToken);
    }
  }, [router, user]);

  const dispatch = useDispatch();
  const posts = useSelector(selectCommunityPosts);
  const likeMap = useSelector(selectLikeMap);
  const currentCommunity = useSelector(selectCommunity);
  const catchup = useSelector(selectCatchUp);

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

  useLayoutEffect(() => {
    if (comId) {
      dispatch(setCommunityById(comId));
      dispatch(setCommunityUsers(comId));
      dispatch(setCommunitySessions(comId));
      dispatch(setResources(comId));
      dispatch(setCommunityPosts(comId));
      fetchCommunityHuddles(comId);
      
      // Fetch user sessions to check registration status
      if (user?.id) {
        dispatch(setUserSessions(user.id));
    }
    }
  }, [comId, fetchCommunityHuddles, user?.id, dispatch]);


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

  // Handle route changes
  useEffect(() => {
    if (router.isReady && id) {
      console.log('Route changed to community:', id);
      // Force re-render when route changes
      const newComId = parseInt(id);
      if (newComId && newComId !== comId) {
        dispatch(setCommunityById(newComId));
        dispatch(setCommunityUsers(newComId));
        dispatch(setCommunitySessions(newComId));
        dispatch(setResources(newComId));
        dispatch(setCommunityPosts(newComId));
        fetchCommunityHuddles(newComId);
      }
    }
  }, [router.isReady, id, comId, fetchCommunityHuddles]);

  const communitySessions = useSelector(selectCommunitySessions);
  const userSessions = useSelector(selectUserSessions);

  const currentCommunityUsers = useSelector(selectCommunityUsers);

  const currResources = useSelector(resources);

  const expertDetails = currentCommunityUsers.filter((item) => {
    return item.expertId !== null;
  })[0];

  // Helper function to join 100ms session directly
  const handleJoin100ms = async (session) => {
    try {
      if (!session?.roomId) {
        toast.error("Session room not available");
        return;
      }

      const tokenResponse = await api.get("/session/token");
      const management_Token = tokenResponse.data.token;
      
      const response = await axios.post(
        `https://api.100ms.live/v2/room-codes/room/${session.roomId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${management_Token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      const guestCode = response.data.data.find(item => item.role === 'guest');
      if (guestCode) {
        const redirectUrl = `https://aluminaries.app.100ms.live/meeting/${guestCode.code}?name=${encodeURIComponent(user?.name || 'User')}`;
        if (typeof window !== "undefined") {
          window.open(redirectUrl, "_blank");
          toast.success(`Joining session as ${user?.name || 'User'}`);
        }
      } else {
        toast.error("Failed to get room access code");
      }
    } catch (error) {
      console.error("Error joining session:", error);
      toast.error("Failed to join session. Please try again.");
    }
  };

  function handleClick() {
    const firstRegisteredSession = registeredUpcomingSessions[0];
    if (firstRegisteredSession?.roomId) {
      handleJoin100ms(firstRegisteredSession);
    } else {
    router.push("/room/" + communitySessions[0]?.roomId);
  }
  }

  // Filter to show only registered upcoming sessions
  const registeredUpcomingSessions = useMemo(() => {
    if (!communitySessions?.length || !userSessions?.sessions?.length) {
      return [];
    }
    
    const registeredSessionIds = new Set(userSessions.sessions.map(s => s.id));
    const now = moment();
    
    return communitySessions.filter(session => {
      const isRegistered = registeredSessionIds.has(session.id);
      const hasUpcomingSlot = session.SessionSlot?.some(slot => 
        moment(slot.startTime).isAfter(now)
      );
      return isRegistered && hasUpcomingSlot;
    });
  }, [communitySessions, userSessions]);

  const getCurrentTime = () => {
    const now = new Date();

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const currentTimeString = `${hours}:${minutes}:${seconds}`;

    return currentTimeString;
  };

  const [isHost, setIsHost] = useState(false);
  const [catchupDetails, setCatchupDetails] = useState(null);
  console.log("user comm ids---", userCommunitiesIds)

  async function createInstantCatchUp() {
    try {
      // Check if there's already a live catchup for this community
      const existingCatchupResponse = await api.get(`/catchup/community/${comId}`);
      console.log("Instant catchup - Existing catchup response:", existingCatchupResponse?.data);
      
      if (existingCatchupResponse?.data?.success) {
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

      // The backend will create the 100ms room and provide the room ID

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
  }

  async function createScheduledCatchUp(scheduleData) {
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
  }

  async function fetchScheduledCatchups() {
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
  }

  async function handleJoinScheduledCatchUp(catchup) {
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
                console.log('Creator added to scheduled catchup attendance:', attendanceResponse.data.message);
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
              const redirectUrl = `https://aluminaries.app.100ms.live/meeting/${guestCode.code}`;
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
  }

  async function createCatchUp(num) {
    setSelectedLink(num);
    // Simply switch to the CatchUp tab without opening modal
    // The inline forms will be available on the CatchUp page
  }
  const handleCheckLiveCatchUp = async function () {
    try {
      const res = await api.get(`/catchup/community/${comId}`);
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
    }
  };

  // Debug function to check catchup state
  const debugCatchupState = async () => {
    try {
      const response = await api.get(`/catchup/debug/${comId}`);
      console.log("Debug catchup state:", response?.data);
      alert(JSON.stringify(response?.data?.debug, null, 2));
    } catch (error) {
      console.error("Error debugging catchup state:", error);
      alert("Error checking catchup state");
    }
  };

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
      if (isHost && activeRoom) {
        // End catchup if host leaves
        endCatchup();
      }
    };
  }, [isHost, activeRoom, comId]);

  const handleViewResponse = (formId) => {
    setSelectedForm(formId); // Set selected form to fetch responses for that form
    setOpenModal(true); // Open modal to view responses
  };

  const handleCloseModal = () => {
    setOpenModal(false); // Close the modal
  };

  const handleFormClick = (formId, communityId) => {
    router.push(`/forms/${formId}?communityId=${communityId}`);
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

  const {
    isOpen: likesModalOpen,
    currentPostId: likesModalPostId,
    currentLikeCount: likesModalLikeCount,
    openLikesModal,
    closeLikesModal
  } = useLikesModal();

  // Add event listener for openPostModal
  useEffect(() => {
    const handleOpenPostModal = (e) => {
      setShowPostModal(true);
      // Optionally, you can set post type here if your PostModal supports it
      // setPostType(e.detail?.postType || 'post');
    };
    window.addEventListener('openPostModal', handleOpenPostModal);
    return () => window.removeEventListener('openPostModal', handleOpenPostModal);
  }, []);

  // Scroll to specific post when postId is in URL
  useEffect(() => {
    if (router.isReady && router.query.postId && posts.length > 0) {
      const targetPostId = parseInt(router.query.postId);
      const targetPost = posts.find(post => post.id === targetPostId);
      
      if (targetPost && postRefs.current[targetPostId]) {
        // Wait for posts to render, then scroll
        setTimeout(() => {
          postRefs.current[targetPostId]?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          
          // Highlight the post briefly
          const postElement = postRefs.current[targetPostId];
          if (postElement) {
            postElement.style.transition = 'box-shadow 0.3s ease';
            postElement.style.boxShadow = '0 0 0 4px rgba(249, 115, 22, 0.3)';
            setTimeout(() => {
              postElement.style.boxShadow = '';
            }, 2000);
          }
        }, 500);
      }
    }
  }, [router.isReady, router.query.postId, posts]);

  // Check if a meeting is still in progress and get join link
  const checkMeetingStatus = async (roomId) => {
    try {
      const response = await api.get(`/session/meeting-status/${roomId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking meeting status:', error);
      return { isActive: false, room: null };
    }
  };

  return (
    <Layout>
      <Head>
        <title>{currentCommunity?.title || 'IFCA Community'}</title>
        {/* Open Graph meta tags for better social media sharing */}
        <meta property="og:title" content={currentCommunity?.title || 'IFCA Community'} />
        <meta property="og:description" content={currentCommunity?.desc || 'Join our community on IFCA'} />
        <meta property="og:image" content={currentCommunity?.bannerImg || '/comPic.svg'} />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="IFCA Application" />
        
        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={currentCommunity?.title || 'IFCA Community'} />
        <meta name="twitter:description" content={currentCommunity?.desc || 'Join our community on IFCA'} />
        <meta name="twitter:image" content={currentCommunity?.bannerImg || '/comPic.svg'} />
      </Head>
      

      
      <div className="relative w-full mx-auto flex flex-col gap-4">
        {/* Main Content */}
        <div className="mx-auto flex flex-col gap-4 px-2 w-full">
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

              {/* Events Section - Only Registered Upcoming Sessions */}
              {registeredUpcomingSessions.length > 0 && <div className="mb-8">
                <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <EventIcon className="w-5 h-5 text-orange-400" />
                  Upcoming Sessions
                </h4>

                <EventSchedule registeredSessions={registeredUpcomingSessions} />
              </div>}

              {/* Posts Section - Card Feed */}
              <div className="flex flex-col gap-6 mt-4 max-w-7xl mx-auto">
                {(() => {
                  const highlight = (text, search) => {
                    if (!search) return text;
                    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                    return text.split(regex).map((part, i) =>
                      regex.test(part) ? <mark key={i} className="bg-yellow-200 px-1 rounded">{part}</mark> : part
                    );
                  };
                  const filteredPosts = [...posts]
                    .filter(item => !item.isArchived) // Don't show archived posts
                    .filter(item =>
                      !postSearch ||
                      (item.title && item.title.toLowerCase().includes(postSearch.toLowerCase())) ||
                      (item.content && item.content.toLowerCase().includes(postSearch.toLowerCase()))
                    )
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                  return filteredPosts.length > 0 ? (
                    filteredPosts.map((item, idx) => {
                      const isCreator = user && (item.creator?.id === user?.unifiedUser?.id);
                      const userPhoto = item.creator?.user?.photoURL || item.creator?.partner?.photoURL || item.creator?.expert?.photoURL || item.creator?.admin?.photoURL || "/t6.svg";
                      const userName = item.creator?.user?.name || item.creator?.partner?.name || item.creator?.expert?.name || item.creator?.admin?.name || "User";
                      const isAdmin = !!item.creator?.adminId;
                      return (
                        <div
                          key={item.id}
                          ref={el => postRefs.current[item.id] = el}
                          className="bg-white border border-gray-100 p-5 min-w-[320px] lg:min-w-[700px] max-w-[700px] w-full"
                        >
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
                            {/* 3-dots menu for post authors */}
                            {isCreator && (
                              <div className="relative">
                                <button
                                  onClick={() => setOpenMenu(openMenu === item.id ? null : item.id)}
                                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                                  aria-label="More options"
                                >
                                  <MoreVertIcon className="w-5 h-5 text-gray-500" />
                                </button>
                                {openMenu === item.id && (
                                  <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px] dropdown-menu">
                                    {!item.isPoll && (
                                      <button
                                        onClick={() => {
                                          setEditingPost(item);
                                          setShowPostModal(true);
                                          setOpenMenu(null);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                      >
                                        <EditIcon className="w-4 h-4" />
                                        Edit
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        // TODO: Add delete functionality
                                        setOpenMenu(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                      <DeleteIcon className="w-4 h-4" />
                                      Delete
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
                                      <div key={i} className="relative rounded-lg overflow-hidden bg-gray-50">
                                        <video controls className="w-full h-auto min-h-[200px] max-h-[500px] object-cover rounded-lg" preload="metadata">
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
                                  <div className="text-xs text-gray-500 mt-1">Total votes: {totalVotes}</div>
                                )}
                                {isPollExpired && !hasVoted && (
                                  <div className="text-xs text-red-600 mt-2 text-center italic">
                                    This poll has expired. You can no longer vote.
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                          {/* Actions Row */}
                          <div className="flex items-center justify-between border-t border-gray-200 pt-2 mt-2">
                            <button
                              className={`flex items-center gap-2 font-medium px-2 py-1 rounded transition text-xs ${likes?.[item.id] || likeMap?.[item.id] === 1 ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-200`}
                              onClick={() => handleLike(item.id)}
                            >
                              <ThumbUpOffAltIcon fontSize="small" className={likes?.[item.id] || likeMap?.[item.id] === 1 ? 'text-blue-600' : ''} />
                              Like
                            </button>
                            <button
                              className="flex items-center gap-2 font-medium px-2 py-1 rounded transition text-xs text-gray-600 hover:text-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-200"
                              onClick={() => setOpenComments(openComments === item.id ? null : item.id)}
                            >
                              <ChatBubbleOutlineIcon fontSize="small" /> Comment
                            </button>
                            <button
                              className="flex items-center gap-2 text-xs text-gray-600 font-medium px-2 py-1 rounded transition hover:text-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-200"
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
                              <SendIcon fontSize="small" /> Share
                            </button>
                          </div>
                          {/* Comments Section */}
                          {openComments === item.id && (
                            <>
                              <div className="flex items-center gap-2 px-0 py-2 border-b border-gray-100">
                                <input
                                  className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                  placeholder="Add a comment..."
                                  value={commentText?.[item.id] || ''}
                                  onChange={e => setCommentText(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  maxLength="1000"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleComment(item.id);
                                    }
                                  }}
                                />
                                <button
                                  className={`text-gray-500 hover:text-blue-600 transition-colors ${!commentText?.[item.id]?.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  onClick={() => handleComment(item.id)}
                                  disabled={!commentText?.[item.id]?.trim()}
                                >
                                  <SendIcon fontSize="small" />
                                </button>
                              </div>
                              {/* Comments List */}
                              <div className="px-0 py-2">
                                {item.childrenPosts && item.childrenPosts.length === 0 ? (
                                  <div className="text-gray-400 text-sm">No comments yet.</div>
                                ) : (
                                  item.childrenPosts && item.childrenPosts
                                    .filter(child => !child.isArchived)
                                  .map(child => {
                                  const isCreator = child.creatorId === user?.unifiedUser?.id;
                                  const childUser = child.creator?.user || child.creator?.partner || child.creator?.expert || child.creator?.admin;
                                  const isEditing = editingComment === child.id;
                                  return (
                                    <div key={child.id} className="flex gap-2 mb-4 items-start pl-4 border-l-[2px] border-gray-200 relative">
                                      <img
                                        src={childUser?.photoURL || "/t6.svg"}
                                        className="w-8 h-8 rounded-full object-cover"
                                        onError={e => { e.target.src = "/t6.svg"; }}
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-1 justify-between">
                                          <div className="flex items-center gap-1">
                                            <span className="font-semibold">{childUser?.name || 'User'}</span>
                                            {isCreator && <span className="bg-gray-200 text-xs px-2 py-0.5 rounded font-semibold">Author</span>}
                                            <span className="text-xs text-gray-500">{moment(child.createdAt).fromNow()}</span>
                                          </div>
                                          {/* 3-dots menu for comment authors */}
                                          {isCreator && (
                                            <div className="relative">
                                              <button
                                                onClick={() => setOpenCommentMenu(openCommentMenu === child.id ? null : child.id)}
                                                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                                                aria-label="More options"
                                              >
                                                <MoreVertIcon className="w-4 h-4 text-gray-500" />
                                              </button>
                                              {openCommentMenu === child.id && (
                                                <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[100px] comment-dropdown-menu">
                                                  <button
                                                    onClick={() => {
                                                      setEditingComment(child.id);
                                                      setOpenCommentMenu(null);
                                                    }}
                                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                  >
                                                    <EditIcon className="w-4 h-4" />
                                                    Edit
                                                  </button>
                                                  <button
                                                    onClick={() => {
                                                      handleDeleteComment(child.id);
                                                      setOpenCommentMenu(null);
                                                    }}
                                                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                  >
                                                    <DeleteIcon className="w-4 h-4" />
                                                    Delete
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        {isEditing ? (
                                          <div className="mt-2">
                                            <textarea
                                              className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
                                              rows="2"
                                              defaultValue={child.content}
                                              data-comment-id={child.id}
                                              maxLength="1000"
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                  e.preventDefault();
                                                  const textarea = document.querySelector(`textarea[data-comment-id="${child.id}"]`);
                                                  handleEditComment(child.id, textarea?.value || child.content);
                                                }
                                                if (e.key === 'Escape') {
                                                  setEditingComment(null);
                                                }
                                              }}
                                              autoFocus
                                            />
                                            <div className="flex items-center justify-between mt-2">
                                              <div className="flex gap-2">
                                              <button
                                                onClick={() => {
                                                  const textarea = document.querySelector(`textarea[data-comment-id="${child.id}"]`);
                                                  handleEditComment(child.id, textarea?.value || child.content);
                                                }}
                                                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                                              >
                                                Save
                                              </button>
                                              <button
                                                onClick={() => setEditingComment(null)}
                                                  className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400 transition-colors"
                                              >
                                                Cancel
                                              </button>
                                              </div>
                                              <span className="text-xs text-gray-500">
                                                {document.querySelector(`textarea[data-comment-id="${child.id}"]`)?.value?.length || child.content.length}/1000
                                              </span>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-sm text-gray-800 whitespace-pre-line">
                                            {child.content}
                                            {child.updatedAt !== child.createdAt && (
                                              <span className="ml-2 text-xs text-gray-400">(Edited)</span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                    })
                                )}
                              </div>
                            </>
                          )}
                          {/* Post Stats */}
                          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1"><GroupsIcon fontSize="small" className="text-gray-400" /> Group</span>
                              <span className="flex items-center gap-1"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M7 10v6M12 7v9M17 13v3" /></svg> {item.childrenPosts?.filter(child => !child.isArchived).length || 0} Comments</span>
                              <span className="flex items-center gap-1 cursor-pointer text-blue-600 hover:underline" onClick={() => openLikesModal(item.id, item.likes?.length || 0)}>
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 21v-2a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v2" /><circle cx="12" cy="7" r="4" /></svg> {(item.likes?.length || 0)} Likes
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">{moment(item.createdAt).format("MMM D, YYYY h:mm A")}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <EmptyState
                      icon={DescriptionIcon}
                      title="No posts yet"
                      description="Be the first to create a post in this community!"
                      action={
                        <button
                          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                          onClick={() => setShowPostModal(true)}
                        >
                          Create Your First Post
                        </button>
                      }
                    />
                  );
                })()}
              </div>
              {/* Floating Create Post Button (FAB) for mobile */}
              {userCommunitiesIds.includes(comId) && (
                <button
                  onClick={() => setShowPostModal(true)}
                  className="fixed bottom-6 right-6 z-40 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg p-4 flex items-center gap-2 transition-all duration-200"
                  aria-label="Create Post"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
                </button>
              )}
            </>
          )}

          {selectedLink === 2 && (
            <div className="mb-6">
              <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <VideoCallIcon className="w-5 h-5 text-orange-400" />
                Sessions
              </h4>

              {communitySessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {communitySessions.map((item, index) => {
                    const isRegistered = userSessions?.sessions?.some(session => session.id === item.id) || false;
                    return (
                      <ClassCard 
                        details={item} 
                        users={users} 
                        communityImage={currentCommunity?.bannerImg}
                        isRegistered={isRegistered}
                        key={index} 
                      />
                    );
                  })}
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
              <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FolderIcon className="w-5 h-5 text-orange-400" />
                Resources
              </h4>

              {currResources.length > 0 ? (
                <div className="flex flex-wrap gap-6">
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
                        className="block bg-white rounded-xl p-5 border border-gray-100 shadow-md hover:shadow-lg hover:bg-orange-50 transition-all basis-full sm:basis-[48%] lg:basis-[23%] max-w-full"
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
            </div>
          )}

          {selectedLink === 6 && (
            <div className="mb-6">
              <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AssignmentIcon className="w-5 h-5 text-orange-400" />
                Forms
              </h4>

              {currentCommunity && currentCommunity.forms && currentCommunity.forms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentCommunity.forms.map((form) => (
                    <div
                      key={form.id}
                      onClick={() => router.push(`/forms/${form.id}`)}
                      className="cursor-pointer bg-white rounded-xl border-l-4 border-orange-500 shadow-md hover:shadow-lg hover:bg-orange-50 transition-all p-5 flex flex-col gap-2 group"
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
                      <div className="flex items-center justify-end mt-2">
                        <ArrowForwardIosIcon className="text-orange-400 group-hover:text-orange-600" fontSize="small" />
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

          {selectedLink === 7 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <ForumIcon className="w-5 h-5 text-orange-400" />
                  Huddles
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHuddleViewMode('card')}
                    className={`p-2 rounded-lg transition-colors ${
                      huddleViewMode === 'card'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title="Card View"
                  >
                    <ViewModuleIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setHuddleViewMode('table')}
                    className={`p-2 rounded-lg transition-colors ${
                      huddleViewMode === 'table'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title="Table View"
                  >
                    <TableChartIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {loadingHuddles ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                </div>
              ) : huddles.length === 0 ? (
                <EmptyState
                  icon={ForumIcon}
                  title="No huddles available"
                  description="There are no huddles scheduled at the moment. Huddles will appear here once they're created."
                />
              ) : (
                huddleViewMode === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {huddles.map((huddle) => {
                    const status = huddle.isLive ? 'Live' : huddle.isScheduled ? 'Upcoming' : huddle.endTime ? 'Completed' : 'Draft';
                    const statusColor = huddle.isLive ? 'bg-green-500' : huddle.isScheduled ? 'bg-orange-500' : huddle.endTime ? 'bg-gray-500' : 'bg-yellow-500';
                    const bannerImage = huddle.community?.bannerImg || currentCommunity?.bannerImg || "/logoifca.png";
                    
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
                      <div
                        key={huddle.id}
                        onClick={() => router.push(`/comHome/${comId}/huddle/${huddle.id}`)}
                        className="cursor-pointer bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden border border-gray-100 group"
                      >
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={bannerImage}
                            alt={huddle.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.src = "/logoifca.png";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                          <div className="absolute top-2 right-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white ${statusColor}`}>
                              {status}
                            </span>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="text-white font-bold text-lg mb-1 line-clamp-2 drop-shadow-lg">
                              {huddle.title}
                            </h3>
                          </div>
                        </div>
                        <div className="p-4">
                          {huddle.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {huddle.description}
                            </p>
                          )}
                          <div className="space-y-2">
                            {huddle.scheduledTime && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <ScheduleIcon className="w-4 h-4 text-orange-500" />
                                <span>{formatDate(huddle.scheduledTime)} at {formatTime(huddle.scheduledTime)}</span>
                              </div>
                            )}
                            {huddle.frequency && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <EventIcon className="w-4 h-4 text-orange-500" />
                                <span className="capitalize">{huddle.frequency.toLowerCase()}</span>
                              </div>
                            )}
                            {huddle.attendeesCount !== undefined && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <GroupsIcon className="w-4 h-4 text-orange-500" />
                                <span>{huddle.attendeesCount || 0} attendees</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                ) : (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
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
                              onClick={() => router.push(`/comHome/${comId}/huddle/${huddle.id}`)}
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
                                    router.push(`/comHome/${comId}/huddle/${huddle.id}`);
                                  }}
                                  className="text-orange-600 hover:text-orange-900"
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

          {selectedLink === 5 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BusinessIcon className="w-6 h-6 text-orange-400" />
                  <span className="text-xl font-semibold text-gray-900">Services</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push('/viewInterests')}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow hover:bg-orange-600 transition"
                  >
                    View your Services & Responses
                  </button>
                  <button
                    onClick={() => setAddServiceOpen(true)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow hover:bg-orange-600 transition"
                  >
                    Add Service
                  </button>
                </div>
              </div>
              <Services
                services={services}
                user={user}
                token={token}
                serviceResponses={serviceResponses}
                addServiceOpen={addServiceOpen}
                handleAddServiceOpen={() => setAddServiceOpen(true)}
                handleAddServiceClose={() => setAddServiceOpen(false)}
              />
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
                showButtons={!liveCatchup} // Show buttons if there's no active live catchup
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

              {/* Live Catchup Attendees Display - Hidden */}
              {/* {liveCatchup && showAttendees && (
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <GroupsIcon className="w-5 h-5 text-orange-400" />
                      Live CatchUp Attendees ({catchupAttendees.length})
                    </h4>
                    <button
                      onClick={() => fetchCatchupAttendees(liveCatchup.roomId)}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Refresh
                    </button>
                  </div>
                  
                  {catchupAttendees.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {catchupAttendees.map((attendee, index) => (
                        <div key={attendee.id || index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <img
                            src={attendee.photoURL || "/t6.svg"}
                            alt={attendee.name}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={e => { e.target.src = "/t6.svg"; }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{attendee.name}</p>
                            <p className="text-xs text-gray-500 truncate">{attendee.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No attendees yet</p>
                  )}
                </div>
              )} */}
            </div>
          )}

          {selectedForm && (
            <FormResponsesModal
              open={openModal}
              handleClose={handleCloseModal}
              formId={selectedForm}
              userId={userId}
              communityId={communityId}
            />
          )}
        </div>
      </div>
      {/* Poll Modal for editing polls */}
      {
        showPollModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto p-0 relative">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <h2 className="text-xl font-bold text-orange-700">
                  Edit Poll
                </h2>
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
        )
      }
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
      
      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareData={shareModalData}
      />
      
      {/* CatchUp Modal */}
      <CatchUpModal
        isOpen={showCatchUpModal}
        onClose={() => {
          console.log('Closing CatchUp modal');
          setShowCatchUpModal(false);
        }}
        onInstantCatchUp={createInstantCatchUp}
        onScheduledCatchUp={createScheduledCatchUp}
        communityName={currentCommunity?.title || 'Community'}
        communityId={comId}
        scheduledCatchups={scheduledCatchups}
      />
    </Layout >
  );
};

export default comHome;
