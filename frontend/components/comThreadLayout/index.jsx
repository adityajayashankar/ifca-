import Layout from "@/components/layout";
import Head from "next/head";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCommunity,
  selectCommunityUsers,
  setCommunityById,
  setCommunityUsers,
} from "@/store/features/communitySlice";
import { useRouter } from "next/router";
import { selectUser, selectUserCommunities } from "@/store/features/userSlice";
import moment from "moment";
import {
  selectCommunityPosts,
  selectLikeMap,
  selectTags,
  selectVoteMap,
  setCommunityPosts,
} from "@/store/features/postsSlice";
import TagsInput from "@/components/common/Tags";
import MultiFileInput from "@/components/common/FileUpload";
import { MdOutlinePoll } from "react-icons/md";
import { BiImageAdd, BiArrowBack } from "react-icons/bi";
import AWS from "aws-sdk";
import api from "@/utils/apiSetup";
import { toast } from "react-toastify";
import Poll from "@/components/chat/polls";
// import PostX from "@/components/SocialPost/PostX";
import { useLayoutEffect } from "react";
import Image from "next/image";
import { ThumbUpOffAlt as ThumbUpOffAltIcon, ChatBubbleOutline as ChatBubbleOutlineIcon, Send as SendIcon, Star as StarIcon, Groups as GroupsIcon, MoreVert as MoreVertIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useRef, useCallback, useMemo } from "react";
import LikesModal from "@/components/post/LikesModal";
import useLikesModal from "@/hooks/useLikesModal";
import PostModal from "@/components/post/PostModals";
import Tooltip from "@mui/material/Tooltip";
import ShareModal from "@/components/common/ShareModal";

const ACCESS_KEY = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "";
const SECRET_ACCESS_KEY = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || "";
const REGION = process.env.NEXT_PUBLIC_AWS_REGION || "ap-south-1";

AWS.config.update({
  accessKeyId: ACCESS_KEY,
  secretAccessKey: SECRET_ACCESS_KEY,
});

const ComThreadLayout = ({
  blogId,
  sessionId,
  replyPostId,
  isAsk,
  isPoll,
  isGreeting,
  isAnnouncements,
}) => {
  const router = useRouter();
  const { id } = router.query;
  const comId = id ? parseInt(id, 10) : null;
  console.log(comId);

  const [open, setOpen] = useState(false);

  // Add event listener for openPostModal
  useEffect(() => {
    const handleOpenPostModal = (e) => {
      setOpen(true);
    };
    window.addEventListener('openPostModal', handleOpenPostModal);
    return () => window.removeEventListener('openPostModal', handleOpenPostModal);
  }, []);

  // Add click outside handler for comment dropdown menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openCommentMenu && !event.target.closest('.comment-dropdown-menu')) {
        setOpenCommentMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openCommentMenu]);

  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState(true);
  const [prefixPost, setPrefixPost] = useState({});

  const [showpoll, setShowpoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState([{ text: "" }, { text: "" }]);
  const [pollExpiresAt, setPollExpiresAt] = useState("");

  const [media, setMedia] = useState([]);
  const [pdf, setPdf] = useState([]);
  const user = useSelector(selectUser);
  const suggestionTags = useSelector(selectTags);
  const community = useSelector(selectCommunity);
  const users = useSelector(selectCommunityUsers);

  useEffect(() => {
    user == null && router.push("/onBoard");
  }, [router]);

  const userCommunitiesIds = useSelector(selectUserCommunities).map((item) => {
      return item.id;
    });

  const post = useSelector(selectCommunityPosts);
  // Filter posts based on the current route
  let posts = [];
  if (router.pathname.includes('/comThreads/asks/')) {
    posts = post?.filter((data) => data.isAsk && !data.isArchived);
  } else if (router.pathname.includes('/comThreads/greetings/')) {
    posts = post?.filter((data) => data.isGreeting && !data.isArchived);
  } else if (router.pathname.includes('/comThreads/polls/')) {
    posts = post?.filter((data) => data.isPoll && !data.isArchived);
  } else {
    // Default: /comThreads/:id
    posts = post?.filter((data) => !data.isPoll && !data.isGreeting && !data.isAsk && !data.isArchived);
  }

  // const [suggestions, setSuggestions] = useState(suggestionTags || []);
  const [tags, setTags] = useState([]);
  const likeMap = useSelector(selectLikeMap);
  const dispatch = useDispatch();
  const userCommunity = useSelector(selectUserCommunities);
  const voteMap = useSelector(selectVoteMap);

  const handleClearPost = () => {
    setTitle("");
    setContent("");
    setTags([]);
    setMedia([]);
  };

  useEffect(() => {
    if(comId && user){
    dispatch(setCommunityById(comId ));
    dispatch(setCommunityUsers(comId));
    dispatch(setCommunityPosts(comId));
    }
  }, [comId,user]);

  // useEffect(() => {
  //   const getPostById = (threadId) => {
  //     api.get(`/thread/${threadId}`).then((res) => {
  //       setPrefixPost(res.data.post);
  //     });
  //   };
  //   getPostById()
  // },[router])

  const currentUser = useSelector(selectUser);

  //tags must be set properly

  const noTitle = false;

  const findOptionIndex = (options, optionId) => {
    let result = -1;
    options?.every((item, index) => {
      if (item.optionId === optionId) {
        result = index;
        return false;
      }
      return true;
    });
    return result;
  };

  const handleUploadImages = async (items) => {
    let urls = [];

    for (const asset of items) {
      try {
        // Step 1: Get a presigned URL from the backend
        const response = await api.post("/images/generate-presigned-url", {
          fileName: asset.name,
          fileType: asset.file.type,
          folder: "posts",
        });

        const { uploadUrl, fileUrl } = response.data;

        // Step 2: Upload the file directly to S3 using the presigned URL
        await fetch(uploadUrl, {
          method: "PUT",
          body: asset.file,
          headers: {
            "Content-Type": asset.file.type,
          },
        });

        urls.push({
          url: fileUrl,
          index: asset.index,
          type: asset.file.type,
        });
      } catch (error) {
        toast(`Error uploading`, { type: "error" });
        console.log(error);
      }
    }

    return urls;
  };

  const handleMediaChange = (files) => {
    let limitedFiles = files;
    if (files.length > 3) {
      if (typeof toast === 'function') toast('You can only upload up to 3 files.', { type: 'error' });
      limitedFiles = files.slice(0, 3);
    }
    setMedia(limitedFiles);
  };

  const handleCreatePost = async () => {
    let assetsData = [];
    if (media.length > 0) {
      assetsData = media;
    } else {
      assetsData = pdf;
    }

    // console.log(media);
    const massets = await handleUploadImages(media);
    // console.log(massets);
    // console.log(tags);
    let tempTags = tags?.map((item) => {
      if (!isNaN(parseInt(item.id.split("-")[1]))) {
        return { id: parseInt(item.id.split("-")[1]), name: item.text };
      } else {
        return { name: item.text };
      }
    });
    // console.log(tempTags);
    if (blogId) {
      console.log("hi");
      let obj = {
        content,
        title,
        assetsData: massets,
        tagsData: tempTags,
        creatorId: user.unifiedUser.id,
        blogId,
      };
      console.log(obj);
      if (showpoll) {
        if (pollOptions?.length < 2) {
          toast(`Poll should contain atleast 2 options !`, { type: "error" });
          return;
        }
        if (
          pollQuestion.trim().length === 0 ||
          pollExpiresAt.trim().length === 0 ||
          pollOptions[0].text.trim().length === 0 ||
          pollOptions[1].text.trim().length === 0
        ) {
          toast(`Poll question , options, expires at should not be empty !`, {
            type: "error",
          });
          return;
        }
        obj = {
          ...obj,
          title: pollQuestion,
          isPoll: true,
          optionsData: pollOptions?.map(({ text }) => ({ option: text })),
          pollExpiresAt: new Date(pollExpiresAt).toISOString(),
        };
      }
      // console.log(obj);
      if (replyPostId) {
        api
          .post(`/thread`, {
            ...obj,
            parentPostId: parseInt(replyPostId),
          })
          .then((res) => {
            console.log(res.data);
            // dispatch(setCommunityPosts(community.id));
            toast(`Created Post!`, { type: "success" });
            setOpen(false);
            if (cb) {
              cb();
            }
          });
      } else {
        api.post(`/thread`, { ...obj }).then((res) => {
          console.log(res.data);
          // dispatch(setCommunityPosts(community.id));
          toast(`Created Post!`, { type: "success" });
          setOpen(false);
          if (cb) {
            cb();
          }
        });
      }
    } else if (sessionId) {
      console.log("hi 2");

      let obj = {
        content,
        title,
        assetsData: massets,
        tagsData: tempTags,
        creatorId: user.unifiedUser.id,
        sessionId,
      };
      console.log(obj);
      if (showpoll) {
        console.log(pollQuestion);
        console.log(pollOptions);
        if (pollOptions?.length < 2) {
          toast(`Poll should contain atleast 2 options !`, { type: "error" });
          return;
        }
        if (
          pollQuestion.trim().length === 0 ||
          pollExpiresAt.trim().length === 0 ||
          pollOptions[0].text.trim().length === 0 ||
          pollOptions[1].text.trim().length === 0
        ) {
          toast(`Poll question , options, expires at should not be empty !`, {
            type: "error",
          });
          return;
        }
        obj = {
          ...obj,
          title: pollQuestion,
          isPoll: true,
          optionsData: pollOptions?.map(({ text }) => ({ option: text })),
          pollExpiresAt: new Date(pollExpiresAt).toISOString(),
        };
      }
      // console.log(obj);
      if (replyPostId) {
        api
          .post(`/thread`, {
            ...obj,
            parentPostId: parseInt(replyPostId),
          })
          .then((res) => {
            console.log(res.data);
            // dispatch(setCommunityPosts(community.id));
            toast(`Created Announcement!`, { type: "success" });
            setOpen(false);
            if (cb) {
              cb();
            }
          });
      } else {
        api.post(`/thread`, { ...obj }).then((res) => {
          console.log(res.data);
          // dispatch(setCommunityPosts(community.id));
          toast(`Created Announcement!`, { type: "success" });
          setOpen(false);
          if (cb) {
            cb();
          }
        });
      }
    } else {
      console.log("hi 3");
      let obj = {
        content,
        title,
        assetsData: massets,
        tagsData: tempTags,
        creatorId: user?.unifiedUser?.id,
        communityId: community.id,
        isAsk: isAsk,
        isGreeting: isGreeting,
      };

      if (showpoll) {
        console.log(pollQuestion);
        console.log(pollOptions);
        if (pollOptions?.length < 2) {
          toast(`Poll should contain atleast 2 options !`, { type: "error" });
          return;
        }
        if (
          pollQuestion.trim().length === 0 ||
          pollExpiresAt.trim().length === 0 ||
          pollOptions[0].text.trim().length === 0 ||
          pollOptions[1].text.trim().length === 0
        ) {
          toast(`Poll question , options, expires at should not be empty !`, {
            type: "error",
          });
          return;
        }
        obj = {
          ...obj,
          title: pollQuestion,
          isPoll: true,
          optionsData: pollOptions?.map(({ text }) => ({ option: text })),
          pollExpiresAt: new Date(pollExpiresAt).toISOString(),
        };
      }

      if (replyPostId) {
        api
          .post(`/thread`, {
            ...obj,
            parentPostId: parseInt(replyPostId),
          })
          .then((res) => {
            console.log(res.data);
            dispatch(setCommunityPosts(community.id));
            toast(`Created Post!`, { type: "success" });
            setOpen(false);
          });
      } else {
        api.post(`/thread`, { ...obj }).then((res) => {
          console.log(res.data);
          dispatch(setCommunityPosts(community.id));
          toast(`Created Post!`, { type: "success" });
          setOpen(false);
        });
      }

      // handleClearPost();
      // if (cb) {
      //   cb();
      // }
    }
    handleClearPost();

    // e.preventDefault();
  };

  console.log(currentUser);

  // --- FEEDCONTENT-LIKE STATE & HANDLERS ---
  const [openComments, setOpenComments] = useState(null);
  const [likes, setLikes] = useState({});
  const [commentText, setCommentText] = useState({});
  const postRefs = useRef({});
  
  // Add comment dropdown menu state
  const [openCommentMenu, setOpenCommentMenu] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [carouselIndices, setCarouselIndices] = useState({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalData, setShareModalData] = useState({});
  // Video play/pause/mute state for carousels
  const [playingVideos, setPlayingVideos] = useState({});
  const [mutedVideos, setMutedVideos] = useState({});
  const videoRefs = useRef({});

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

  // Like handler (optimistic)
  const handleLike = async (postId) => {
    if (!user || !user.unifiedUser?.id) return;
    try {
      const currentLikeState = isPostLiked(postId);
      const newLikeState = !currentLikeState;
      setLikes(prev => ({ ...prev, [postId]: newLikeState }));
      // Optimistically update likes in posts (if needed)
      await api.patch(`/thread/${postId}/user/${user.unifiedUser.id}`);
      // Refresh posts to get updated like counts and Redux store
      dispatch(setCommunityPosts(community.id));
    } catch (error) {
      setLikes(prev => ({ ...prev, [postId]: !prev[postId] }));
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
        communityId: community.id,
        parentPostId: postId
      };
      const response = await api.post('/thread', payload);
      
      if (response.data) {
      setCommentText(prev => ({ ...prev, [postId]: '' }));
      dispatch(setCommunityPosts(community.id));
        // Show success feedback
        alert('Comment posted successfully!');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    }
  };

  // Poll vote handler (FeedContent style)
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
      dispatch(setCommunityPosts(community.id));
    } catch (error) {
      console.error('Error voting on poll:', error);
      toast.error("Failed to vote on poll");
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
        dispatch(setCommunityPosts(community.id));
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
        dispatch(setCommunityPosts(community.id));
        alert('Comment deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
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

  // --- FEEDCONTENT-LIKE POST CARD RENDERING ---
  const {
    isOpen: likesModalOpen,
    currentPostId: likesModalPostId,
    currentLikeCount: likesModalLikeCount,
    openLikesModal,
    closeLikesModal
  } = useLikesModal();
  return (
    <>
      <Head>
        <title>{community?.title || 'IFCA Community'} - Threads</title>
        {/* Open Graph meta tags for better social media sharing */}
        <meta property="og:title" content={community?.title || 'IFCA Community'} />
        <meta property="og:description" content={community?.desc || 'Join our community on IFCA'} />
        <meta property="og:image" content={community?.bannerImg || '/comPic.svg'} />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="IFCA Application" />
        
        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={community?.title || 'IFCA Community'} />
        <meta name="twitter:description" content={community?.desc || 'Join our community on IFCA'} />
        <meta name="twitter:image" content={community?.bannerImg || '/comPic.svg'} />
      </Head>
      <PostModal
        open={open}
        onClose={() => setOpen(false)}
        user={user}
        userCommunities={userCommunitiesIds.map(id => ({ id, title: "" }))}
        refreshFeed={() => dispatch(setCommunityPosts(comId))}
        editingPost={null}
        setEditingPost={() => {}}
        fixedCommunity={community}
      />
      <Layout>
        {/* <div className="bg-white rounded-xl  px-4 md:px-0 mb-5 pt-2 md:pt-0 border-t-2 md:border-t-0  border-orange-100 flex items-center md:gap-5 gap-2 fixed md:sticky -bottom-4 md:bottom-auto md:top-0 w-full md:w-auto z-30 ">
          <img
            src={(currentUser && currentUser[0]?.photoURL) || currentUser?.userType === "admin" ? "/logoifca.png" : "/comPic.svg"}
            className="rounded-full md:h-[50px] md:w-[50px] h-[30px] w-[30px] object-contain bg-orange-50"
            alt=""
          />
          <input
            type="text"
            placeholder={"Speak your mind, Create a post!"}
            readOnly
            className="rounded-xl md:p-4 p-2  bg-orange-50 border-2 border-orange-100 w-full text-black"
            onClick={() => setOpen(!open)}
          />
        </div> */}
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 py-6">
          {/* Loading Skeletons */}
          {post === undefined ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white md:rounded-lg md:shadow p-0 mb-2 relative border border-gray-100 animate-pulse">
                  <div className="px-4 pt-4 pb-2">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-gray-200" style={{ width: 48, height: 48 }} />
                      <div className="flex-1">
                        <div className="bg-gray-200 h-5 w-2/5 mb-2 rounded" />
                        <div className="bg-gray-200 h-4 w-3/5 mb-1 rounded" />
                        <div className="bg-gray-200 h-3 w-1/3 rounded" />
                      </div>
                    </div>
                  </div>
                  <div className="border-b border-gray-300 mx-4" />
                  <div className="px-4 py-4">
                    <div className="bg-gray-200 h-5 w-4/5 mb-2 rounded" />
                    <div className="bg-gray-200 h-4 w-full mb-1 rounded" />
                    <div className="bg-gray-200 h-4 w-11/12 mb-1 rounded" />
                    <div className="bg-gray-200 h-4 w-2/3 mb-3 rounded" />
                    <div className="flex justify-between">
                      <div className="bg-gray-200 h-4 w-1/5 rounded" />
                      <div className="bg-gray-200 h-4 w-1/5 rounded" />
                      <div className="bg-gray-200 h-4 w-1/5 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts?.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="text-gray-400 text-2xl" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M7 10v6M12 7v9M17 13v3" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-600 mb-4">Be the first to share something in this community!</p>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    let postType = 'post';
                    if (router.pathname.includes('/comThreads/asks/')) postType = 'ask';
                    else if (router.pathname.includes('/comThreads/greetings/')) postType = 'greeting';
                    else if (router.pathname.includes('/comThreads/polls/')) postType = 'poll';
                    window.dispatchEvent(new CustomEvent('openPostModal', { detail: { postType } }));
                  }
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Create Your First Post
              </button>
          </div>
          ) : (
            posts?.map((item, idx) => {
              const isCreator = user && (item.creator?.id === user?.unifiedUser?.id);
              const userPhoto = item.creator?.user?.photoURL || item.creator?.partner?.photoURL || item.creator?.expert?.photoURL || item.creator?.admin?.photoURL || "/t6.svg";
              const userName = item.creator?.user?.name || item.creator?.partner?.name || item.creator?.expert?.name || item.creator?.admin?.name || "User";
              const userSubtitle = item.creator?.user?.subtitle || item.creator?.partner?.subtitle || item.creator?.expert?.subtitle || item.creator?.admin?.subtitle || community?.title || "";
              const isAdmin = !!item.creator?.adminId;
              const isDefaultPost = typeof item.id === 'string' && item.id.startsWith('default-');
              return (
                <div
                  key={item.id}
                  ref={el => postRefs.current[item.id] = el}
                  className={`bg-white md:rounded-lg md:shadow p-0 mb-2 relative border border-gray-100 hover:shadow-lg transition-shadow`}
                >
                  {/* Header Row */}
                  <div className="flex items-start gap-3 px-4 pt-4 pb-2">
                    <img src={userPhoto} alt={userName} className="w-10 h-10 rounded-full object-cover border border-gray-200" onError={e => { e.target.src = "/t6.svg"; }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-semibold text-[16px] leading-tight text-gray-900">{userName}</span>
                        {isAdmin && <><StarIcon fontSize="inherit" className="text-blue-600 ml-2" /><span className="font-semibold text-blue-600">Admin</span></>}
                      </div>
                      {/* Community name/subtitle removed */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                        <span>{moment(item.createdAt).fromNow()}</span>
                        {item.updatedAt && item.updatedAt !== item.createdAt && <><span>•</span><span>Edited</span></>}
                        <span>•</span>
                        <GroupsIcon fontSize="inherit" />
                        <span className="ml-2 text-xs text-gray-700 font-normal">{item.isGreeting ? 'Greeting' : (item.isAsk ? 'Ask' : (item.isPoll ? 'Poll' : 'Post'))}</span>
                      </div>
                    </div>
                  </div>
                  {/* Divider */}
                  <div className="border-b-[1px] border-gray-300 mx-4" />
                  {/* Post Content */}
                  <div className="px-4 py-4">
                    {item.title && <div className="text-lg font-semibold text-gray-900 mb-1">{item.title}</div>}
                    <p className="text-[15px] text-gray-900 leading-[1.6] whitespace-pre-line mb-2">{item.content}</p>
                    {/* Render post assets/media below content, as in FeedContent */}
                    {item.assets && item.assets.length > 0 && (
                      <div className="mt-3 space-y-3">
                        {item.assets.length === 1 ? (
                          (() => {
                            const asset = item.assets[0];
                            const type = asset.type || '';
                            if (type.startsWith('image/')) {
                              return (
                                <div key={asset.id || 0} className="relative rounded-lg overflow-hidden bg-gray-50">
                                  <img
                                    src={asset.url}
                                    alt={`Post image`}
                                    className="w-full h-auto min-h-[200px] max-h-[500px] object-cover rounded-lg"
                                  />
                                </div>
                              );
                            } else if (type.startsWith('video/')) {
                              return (
                                <div key={asset.id || 0} className="relative rounded-lg overflow-hidden bg-gray-50">
                                  <video
                                    controls
                                    className="w-full h-auto min-h-[200px] max-h-[500px] object-cover rounded-lg"
                                    preload="metadata"
                                  >
                                    <source src={asset.url} type={type} />
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              );
                            } else if (type === 'application/pdf') {
                              return (
                                <div key={asset.id || 0} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                  <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">PDF Document</p>
                                      <p className="text-xs text-gray-500">Click to view or download</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                      <a
                                        href={asset.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                      >
                                        Open PDF
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div key={asset.id || 0} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                  <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{asset.name || 'Document'}</p>
                                      <p className="text-xs text-gray-500">{type}</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                      <a
                                        href={asset.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                                      >
                                        Download
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          })()
                        ) : (
                          (() => {
                            const currentAssetIndex = carouselIndices[item.id] || 0;
                            const currentAsset = item.assets[currentAssetIndex];
                            const type = currentAsset.type || '';
                            const nextAsset = () => {
                              setCarouselIndices(prev => ({
                                ...prev,
                                [item.id]: (currentAssetIndex + 1) % item.assets.length
                              }));
                            };
                            const prevAsset = () => {
                              setCarouselIndices(prev => ({
                                ...prev,
                                [item.id]: (currentAssetIndex - 1 + item.assets.length) % item.assets.length
                              }));
                            };
                            return (
                              <div key={`carousel-${item.id}`} className="relative">
                                {/* Asset Display */}
                                <div className="relative rounded-lg overflow-hidden bg-gray-50">
                                  {type.startsWith('image/') && (
                                    <img
                                      src={currentAsset.url}
                                      alt={`Post image ${currentAssetIndex + 1} of ${item.assets.length}`}
                                      className="w-full h-auto min-h-[200px] max-h-[500px] object-contain rounded-lg"
                                    />
                                  )}
                                  {type.startsWith('video/') && (
                                    <div className="group relative">
                                      <video
                                        ref={el => videoRefs.current[`${item.id}-${currentAssetIndex}`] = el}
                                        className="w-full h-auto min-h-[200px] max-h-[500px] object-contain rounded-lg"
                                        preload="metadata"
                                        loop
                                        muted={mutedVideos[`${item.id}-${currentAssetIndex}`] ?? true}
                                        onPlay={() => setPlayingVideos(prev => ({ ...prev, [`${item.id}-${currentAssetIndex}`]: true }))}
                                        onPause={() => setPlayingVideos(prev => ({ ...prev, [`${item.id}-${currentAssetIndex}`]: false }))}
                                      >
                                        <source src={currentAsset.url} type={type} />
                                        Your browser does not support the video tag.
                                      </video>
                                      {/* Play/Pause Button */}
                                      <button
                                        onClick={e => {
                                          e.stopPropagation();
                                          const video = videoRefs.current[`${item.id}-${currentAssetIndex}`];
                                          if (video) {
                                            if (video.paused) {
                                              video.play();
                                            } else {
                                              video.pause();
                                            }
                                          }
                                        }}
                                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-3 hover:bg-opacity-70 transition-all opacity-0 group-hover:opacity-100"
                                        style={{ zIndex: 2 }}
                                        tabIndex={0}
                                      >
                                        {/* Play Icon */}
                                        {!playingVideos[`${item.id}-${currentAssetIndex}`] ? (
                                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                        ) : (
                                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                        )}
                                      </button>
                                      {/* Mute/Unmute Button */}
                                      <button
                                        onClick={e => {
                                          e.stopPropagation();
                                          const video = videoRefs.current[`${item.id}-${currentAssetIndex}`];
                                          if (video) {
                                            video.muted = !video.muted;
                                            setMutedVideos(prev => ({ ...prev, [`${item.id}-${currentAssetIndex}`]: video.muted }));
                                          }
                                        }}
                                        className="absolute top-3 right-3 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all opacity-0 group-hover:opacity-100"
                                        style={{ zIndex: 2 }}
                                        tabIndex={0}
                                      >
                                        {/* Mute Icon */}
                                        {(mutedVideos[`${item.id}-${currentAssetIndex}`] ?? true) ? (
                                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                                        ) : (
                                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                                        )}
                                      </button>
                                    </div>
                                  )}
                                  {type === 'application/pdf' && (
                                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                      <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-900 truncate">PDF Document</p>
                                          <p className="text-xs text-gray-500">Click to view or download</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                          <a
                                            href={currentAsset.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                          >
                                            Open PDF
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {!type.startsWith('image/') && !type.startsWith('video/') && type !== 'application/pdf' && (
                                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                      <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-900 truncate">{currentAsset.name || 'Document'}</p>
                                          <p className="text-xs text-gray-500">{type}</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                          <a
                                            href={currentAsset.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                                          >
                                            Download
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {/* Navigation Arrows */}
                                <button
                                  onClick={prevAsset}
                                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all z-10"
                                  aria-label="Previous asset"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={nextAsset}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all z-10"
                                  aria-label="Next asset"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                                {/* Asset Counter */}
                                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full z-10">
                                  {currentAssetIndex + 1} / {item.assets.length}
                                </div>
                                {/* Asset Indicators */}
                                <div className="flex justify-center mt-2 space-x-1">
                                  {item.assets.map((_, index) => (
                                    <button
                                      key={index}
                                      onClick={() => setCarouselIndices(prev => ({
                                        ...prev,
                                        [item.id]: index
                                      }))}
                                      className={`w-2 h-2 rounded-full transition-all ${
                                        index === currentAssetIndex 
                                          ? 'bg-orange-500' 
                                          : 'bg-gray-300 hover:bg-gray-400'
                                      }`}
                                      aria-label={`Go to asset ${index + 1}`}
                                    />
                                  ))}
                </div>
                </div>
                            );
                          })()
                        )}
              </div>
                    )}
                    {/* Poll Options and Interaction (FeedContent style) */}
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
                    <div className="flex items-center justify-between px-0 py-2 border-b-[1px] border-t-[1px] border-gray-300">
                      <button
                        className={`flex items-center gap-2 font-medium px-2 py-1 rounded transition ${likes?.[item.id] || likeMap?.[item.id] === 1 ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-700`}
                        onClick={() => handleLike(item.id)}
                      >
                        <ThumbUpOffAltIcon fontSize="small" className={likes?.[item.id] || likeMap?.[item.id] === 1 ? 'text-blue-600' : ''} />
                        Like
                      </button>
                      <button
                        className="flex items-center gap-2 font-medium px-2 py-1 rounded transition text-gray-600 hover:text-blue-700"
                        onClick={() => setOpenComments(openComments === item.id ? null : item.id)}
                      >
                        <ChatBubbleOutlineIcon fontSize="small" /> Comment
                      </button>
                        <button
                          className="flex items-center gap-2 text-gray-600 font-medium px-2 py-1 rounded transition hover:text-blue-700"
                        onClick={() => {
                                                      setShareModalData({
                              title: item.title || `${community?.title} - IFCA India Platform`,
                              text: item.content || 'Check out this post from IFCA India Platform',
                              url: `${window.location.origin}/comThreads/${comId}`,
                              hashtags: "#IFCA #Community",
                              communityName: community?.title || "IFCA Community",
                              communityDesc: community?.desc || "Join our vibrant community",
                              communityImage: community?.bannerImg || "/comPic.svg",
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
                          ) : item.childrenPosts && item.childrenPosts
                            .filter(child => !child.isArchived) // Don't show archived comments
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
                          })}
                        </div>
                      </>
                    )}
                    {/* Post Stats */}
                    <div className="mt-4 flex items-center justify-between text-gray-500 text-sm">
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
                </div>
                );
              })
            )}
          </div>
          {/* <form className="flex center justify-between py-[15px] px-[30px] w-full bg-[#d9d9d9] rounded-[10px]">
            <input
              className="outline-none border-none bg-transparent w-4/5 placeholder:text-base"
              type="text"
              placeholder="Type something here..."
            />
            <button type="submit">
              <SendOutlinedIcon />
            </button>
          </form> */}
      </Layout>
      <LikesModal
        open={likesModalOpen}
        onClose={closeLikesModal}
        postId={likesModalPostId}
        likeCount={likesModalLikeCount}
      />
    </>
  );
};

export default ComThreadLayout;
