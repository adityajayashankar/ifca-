import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import { MdThumbUp, MdComment, MdSend } from "react-icons/md";
import api from "@/utils/apiSetup";
import moment from "moment";

export default function AnnouncementActivity({ activity, activityData, isModerator }) {
  const user = useSelector(selectUser);
  const [post, setPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [likes, setLikes] = useState({});
  const [commentText, setCommentText] = useState("");
  const [openComments, setOpenComments] = useState(false);
  const [comments, setComments] = useState([]);
  const previousCommentsRef = useRef([]);
  const previousLikesRef = useRef([]);
  const pollingIntervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const isPollingRef = useRef(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Abort any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Clear any existing interval first
    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    isPollingRef.current = false;

    if (activityData.postId) {
      // Initial load with loader
      fetchPostData(true);
      
      // Poll for real-time updates once after 2 minutes without loader
      // Only poll if component is still mounted
      pollingIntervalRef.current = setTimeout(() => {
        if (isMountedRef.current && !isPollingRef.current && activityData.postId) {
          isPollingRef.current = true;
          fetchPostData(false).finally(() => {
            isPollingRef.current = false;
          });
        }
      }, 120000); // 2 minutes = 120 seconds
      
      return () => {
        if (pollingIntervalRef.current) {
          clearTimeout(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        isPollingRef.current = false;
      };
    } else {
      // If no postId, use activityData directly
      setPost({
        content: activityData.content || "",
        title: activityData.title || "Announcement",
        likes: [],
        childrenPosts: []
      });
    }
  }, [activityData.postId]);

  const fetchPostData = async (showLoading = true) => {
    if (!activityData.postId || !isMountedRef.current) return;
    try {
      if (showLoading) {
        setLoadingPost(true);
      }
      
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();
      
      // Add noLoad header for polling requests to prevent global loader
      const config = showLoading ? { signal: abortControllerRef.current.signal } : { 
        headers: { noLoad: true },
        signal: abortControllerRef.current.signal
      };
      const response = await api.get(`/thread/${activityData.postId}`, config);
      
      // Only update if component still mounted
      if (!isMountedRef.current) return;
      
      if (response.data && response.data.post) {
        const newPost = response.data.post;
        const newComments = newPost?.childrenPosts || [];
        const newLikes = newPost?.likes || [];
        
        // Only update if data actually changed to prevent blinking
        const commentsChanged = JSON.stringify(newComments.map(c => c.id)) !== 
                                JSON.stringify(previousCommentsRef.current.map(c => c.id));
        const likesChanged = JSON.stringify(newLikes.map(l => l.userId)) !== 
                            JSON.stringify(previousLikesRef.current.map(l => l.userId));
        
        setPost(newPost);
        
        if (commentsChanged) {
          setComments(newComments);
          previousCommentsRef.current = newComments;
        }
        
        if (likesChanged && user?.unifiedUser?.id) {
          const userLiked = response.data.liked || newLikes.some(
            like => like.userId === user.unifiedUser.id
          );
          setLikes({ [activityData.postId]: userLiked || false });
          previousLikesRef.current = newLikes;
        } else if (user?.unifiedUser?.id && !likes[activityData.postId]) {
          // Only set initial like state if not already set
          const userLiked = response.data.liked || newLikes.some(
            like => like.userId === user.unifiedUser.id
          );
          if (userLiked !== undefined) {
            setLikes({ [activityData.postId]: userLiked || false });
          }
        }
      }
    } catch (error) {
      // Silently ignore abort errors (expected during cleanup)
      if (error.code === 'ECONNABORTED' || error.message === 'Request aborted') {
        return;
      }
      console.error('Error fetching post:', error);
    } finally {
      if (showLoading) {
        setLoadingPost(false);
      }
      abortControllerRef.current = null;
    }
  };

  const handleLike = async () => {
    if (!user?.unifiedUser?.id || !activityData.postId) {
      toast.error('Please login to like announcements');
      return;
    }

    try {
      const currentLikeState = likes[activityData.postId] || false;
      const newLikeState = !currentLikeState;

      // Optimistic update
      setLikes({ [activityData.postId]: newLikeState });

      await api.patch(`/thread/${activityData.postId}/user/${user.unifiedUser.id}`);

      // Refresh post data (polling will also update it, but this ensures immediate update)
      await fetchPostData(false);
      
      toast.success(newLikeState ? 'Announcement liked!' : 'Like removed');
    } catch (error) {
      // Revert on error
      setLikes({ [activityData.postId]: !likes[activityData.postId] });
      toast.error('Failed to update like');
      console.error('Error liking announcement:', error);
    }
  };

  const handleComment = async () => {
    if (!user?.unifiedUser?.id || !activityData.postId) {
      toast.error('Please login to comment');
      return;
    }

    if (!commentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    const tempCommentText = commentText;
    setCommentText(''); // Clear immediately for better UX

    try {
      const payload = {
        content: tempCommentText.trim(),
        title: "",
        assetsData: [],
        tagsData: [],
        creatorId: user.unifiedUser.id,
        communityId: activityData.communityId || activity?.huddle?.communityId,
        parentPostId: activityData.postId
      };

      await api.post('/thread', payload);
      
      // Refresh post data (polling will also update it, but this ensures immediate update)
      await fetchPostData(false);
      toast.success('Comment posted successfully!');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
      // Restore comment text on error
      setCommentText(tempCommentText);
    }
  };

  const likeCount = post?.likes?.length || 0;
  const commentCount = comments?.length || 0;
  const isLiked = likes[activityData.postId] || false;

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 overflow-y-auto">
      {/* Announcement Header */}
      <div className="bg-gray-800 px-6 py-6 border-b border-gray-700">
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
          {activityData.title || post?.title || "Announcement"}
        </h3>
        <p className="text-gray-300 whitespace-pre-wrap text-lg">
          {activityData.content || post?.content || ""}
        </p>
      </div>

      {/* Reactions and Comments Row */}
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 font-medium px-4 py-2 rounded-lg transition ${
                isLiked ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <MdThumbUp className="w-5 h-5" />
              <span>Like</span>
              {likeCount > 0 && (
                <span className="ml-1">({likeCount})</span>
              )}
            </button>
            <button
              onClick={() => setOpenComments(!openComments)}
              className="flex items-center gap-2 font-medium px-4 py-2 rounded-lg transition bg-gray-700 text-gray-300 hover:bg-gray-600"
            >
              <MdComment className="w-5 h-5" />
              <span>Comment</span>
              {commentCount > 0 && (
                <span className="ml-1">({commentCount})</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {openComments && (
        <div className="flex-1 overflow-y-auto p-6 bg-gray-900">
          {/* Comment Input */}
          <div className="mb-6">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="w-full p-4 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none border border-gray-700 resize-none"
              rows={3}
            />
            <button
              onClick={handleComment}
              disabled={!commentText.trim()}
              className="mt-3 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <MdSend className="w-5 h-5" />
              Post Comment
            </button>
          </div>

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => {
                const commentUser = comment.creator?.user || comment.creator?.expert || comment.creator?.partner || comment.creator?.admin;
                
                return (
                  <div key={comment.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      {commentUser?.photoURL ? (
                        <img
                          src={commentUser.photoURL}
                          alt={commentUser.name}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => { e.target.src = "/t6.svg"; }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {commentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-white">
                            {commentUser?.name || comment.creator?.email || 'Anonymous'}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {moment(comment.createdAt).fromNow()}
                          </p>
                        </div>
                        <p className="text-gray-300 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No comments yet. Be the first to comment!</p>
          )}
        </div>
      )}
    </div>
  );
}

