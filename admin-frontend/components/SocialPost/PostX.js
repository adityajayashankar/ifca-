import { selectCommunity } from "@/store/features/communitySlice";
import { selectCommunityPosts } from "@/store/features/postsSlice";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { resolveUnifiedUser } from "@/utils/resolveUser";
import React from "react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Actions from "./Actions";
import Content from "./Content";
import Header from "./Header";
import Replies from "./Replies";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SendIcon from "@mui/icons-material/Send";

const PostX = ({
  user,
  media,
  content,
  title,
  threadId,
  tags,
  noReply,
  liked,
  createdAt,
  userCommunity,
  communityId,
  viewOnly,
  numLikes,
  numReplies,
  blogId,
  isPoll,
  pollOptions,
  expiresAt,
  isVoted: _isVoted,
  votedOption: _votedOption,
  deletecb,
  creatorId: _creatorId,
  PollOptions,
  isArchived,
}) => {
  const [like, setLike] = useState(liked || false);
  const [reply, setReply] = useState(false);
  const loggedUser = useSelector(selectUser);
  const [childThreads, setChildThreads] = useState([]);
  const [childLike, setChildLike] = useState({});
  const [replyContent, setReplyContent] = useState("");
  const [unumLikes, setUNumLikes] = useState(numLikes);

  // Compute isVoted and votedOption from PollOptions and UserPollOptionSelect
  let isVoted = false;
  let votedOption = null;
  let creatorId = _creatorId;
  if (isPoll && PollOptions && loggedUser?.unifiedUser?.id) {
    for (const option of PollOptions) {
      if (option.UserPollOptionSelect?.some(sel => sel.unifiedUserId === loggedUser.unifiedUser.id)) {
        isVoted = true;
        votedOption = option.id;
        break;
      }
    }
  }
  if (!creatorId && user && user.id) creatorId = user.id;

  const handleLike = (e) => {
    e?.preventDefault();
    if (!userCommunity) {
      return;
    }
    let config = { headers: { noLoad: true } };
    api
      .patch(
        `/thread/${threadId}/user/${loggedUser?.unifiedUser?.id}`,
        {},
        config
      )
      .then((res) => {
        if (res.data) {
          setLike(res.data.like ? true : false);
          if (res.data.like === 0) {
            setUNumLikes((prev) => prev - 1);
          } else {
            setUNumLikes(res.data.like.post._count.likes);
          }
        }
      });
  };

  const handleViewReply = async (e) => {
    e?.preventDefault();
    if (!userCommunity) {
      return;
    }
    if (!reply) {
      try {
        let config = { headers: { noLoad: true } };
        const res = await api.get(`/thread/${threadId}`, config);
        setChildThreads(res.data.post.childrenPosts);
        setChildLike(res.data.like_map);
        setLike(res.data.liked);
      } catch (error) {
        console.log(error);
      }
    }
    setReply((prev) => !prev);
  };

  const createReply = (e) => {
    e?.preventDefault();
    if (blogId) {
      const obj = {
        content: replyContent,
        assetsData: [],
        creatorId: loggedUser.unifiedUserId.id,
        parentPostId: threadId,
        blogId,
      };
      api.post("/thread", obj).then((res) => {
        toast(`Created Reply!`, { type: "success" });
        setReplyContent("");
      });
    } else {
      const obj = {
        content: replyContent,
        assetsData: [],
        creatorId: loggedUser?.unifiedUser?.id,
        parentPostId: threadId,
        communityId: communityId,
      };
      api.post("/thread", obj).then((res) => {
        toast(`Created Reply!`, { type: "success" });
        setReplyContent("");
      });
    }
  };

  return (
    <div className={`bg-white md:rounded-lg md:shadow p-0 mb-4 relative border border-gray-100 hover:shadow-lg transition-shadow ${isArchived ? 'opacity-75' : ''}`}>
      {/* Archived Indicator */}
      {isArchived && (
        <div className="absolute top-2 right-2 bg-gray-500 text-white text-xs px-2 py-1 rounded-full z-10">
          Archived
        </div>
      )}
      {/* Header Row */}
      <div className="px-4 pt-4 pb-2">
        <Header
          user={resolveUnifiedUser(user)}
          tags={tags}
          threadId={threadId}
          createdAt={createdAt}
          cb={deletecb}
          postData={{ content, title }}
        />
      </div>
      {/* Divider */}
      <div className="border-b-[1px] border-gray-300 mx-4" />
      {/* Post Content */}
      <div className="px-4 py-4">
        <Content
          content={content}
          threadId={threadId}
          media={media}
          title={title}
          isPoll={isPoll}
          pollOptions={pollOptions}
          expiresAt={expiresAt}
          isVoted={isVoted}
          votedOption={votedOption}
          creatorId={creatorId}
        />
        
        {/* Interaction Buttons - Like, Comment, Send */}
        <div className="flex items-center justify-between px-0 py-3 border-b-[1px] border-t-[1px] border-gray-300 mt-4">
          <div className="flex items-center gap-6">
            {/* Like Button */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                like 
                  ? 'text-blue-600 hover:bg-blue-50' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {like ? (
                <ThumbUpIcon fontSize="small" className="text-blue-600" />
              ) : (
                <ThumbUpOffAltIcon fontSize="small" />
              )}
              <span className="text-sm font-medium">Like</span>
            </button>

            {/* Comment Button */}
            <button
              onClick={handleViewReply}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors duration-200"
            >
              <ChatBubbleOutlineIcon fontSize="small" />
              <span className="text-sm font-medium">Comment</span>
            </button>

            {/* Send Button */}
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors duration-200"
            >
              <SendIcon fontSize="small" />
              <span className="text-sm font-medium">Send</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-4 flex items-center justify-between text-gray-500 text-sm">
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
            <span className="flex items-center gap-1">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M7 10v6M12 7v9M17 13v3" />
              </svg>
              {numReplies || 0} Comments
            </span>
            <span className="flex items-center gap-1">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 21v-2a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {unumLikes || 0} Likes
            </span>
          </div>
          <span className="text-xs text-gray-400">{new Date(createdAt).toLocaleString()}</span>
        </div>
      </div>
      
      {/* Replies Section */}
      <Replies
        childThreads={childThreads}
        like_map={childLike}
        noReply={noReply}
        user={resolveUnifiedUser(user)}
        showReplies={reply}
        createReply={createReply}
        replyContent={replyContent}
        setReplyContent={setReplyContent}
        threadId={threadId}
        viewReplies={handleViewReply}
        userCommunity={userCommunity}
        communityId={communityId}
        blogId={blogId}
      />
    </div>
  );
};

export default PostX;
