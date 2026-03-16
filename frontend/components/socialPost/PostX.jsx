import { selectCommunity } from "@/store/features/communitySlice";
import { selectCommunityPosts } from "@/store/features/postsSlice";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { getUserPhotoURL } from "@/utils/userUtils";
import React from "react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Actions from "./Actions";
import Content from "./Content";
import Header from "./Header";
import Replies from "./Replies";

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
  isVoted,
  votedOption,
  deletecb,
  community
}) => {
  const [like, setLike] = useState(liked || false);
  const [reply, setReply] = useState(false);
  const loggedUser = useSelector(selectUser);
  const [childThreads, setChildThreads] = useState([]);
  const [childLike, setChildLike] = useState({});
  const [replyContent, setReplyContent] = useState("");
  const [unumLikes, setUNumLikes] = useState(numLikes);
  const handleLike = (e) => {
    e?.preventDefault();
    // console.log(threadId);
    // api call to like message
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
          // console.log(res.data);
          setLike(res.data.like ? true : false);
          if (res.data.like === 0) {
            // decrement like count
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
    // api call to fetch replies
  };

  const createReply = (e) => {
    e?.preventDefault();

    if (blogId) {
      const obj = {
        content: replyContent,
        assetsData: [],
        creatorId: loggedUser?.unifiedUser?.id,
        parentPostId: threadId,
        blogId,
      };
      api.post("/thread", obj).then((res) => {
        toast(`Created Reply!`, { type: "success" });
        setReplyContent("");
        // setChildThreads((prev) => [res.data.createdPost, ...prev]);
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
        // setChildThreads((prev) => [res.data.createdPost, ...prev]);
      });
    }
  };

  return (
    <div className="rounded-xl border-2 border-gray-200 flex flex-col items-center justify-center p-4 m-4">
      <Header
        user={user}
        tags={tags}
        threadId={threadId}
        createdAt={createdAt}
        cb={deletecb}
        community={community}
      />
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
      />

      <Actions
        like={like}
        handleLike={handleLike}
        handleViewReply={handleViewReply}
        communityId={communityId}
        threadId={threadId}
        viewOnly={viewOnly}
        numLikes={unumLikes}
        numReplies={numReplies}
        noReply={noReply}
      />
      <Replies
        childThreads={childThreads}
        like_map={childLike}
        noReply={noReply}
        user={user}
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
