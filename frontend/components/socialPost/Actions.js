import { useRouter } from "next/router";
import React from "react";
import {
  AiOutlineLike,
  AiTwotoneLike,
  AiOutlineComment,
  AiOutlineShareAlt,
  AiOutlineEye,
} from "react-icons/ai";
// import { GrView } from "react-icons/gr";
import { toast } from "react-toastify";
import { copyTextToClipboard } from "@/utils/copyClipboard";
import { domainConf } from "@/utils/domainConfig";
const Actions = ({
  like,
  handleLike,
  handleViewReply,
  communityId,
  threadId,
  viewOnly,
  numLikes,
  numReplies,
  noReply,
}) => {
  const router = useRouter();
  const handleCopy = (e) => {
    e.preventDefault();
    if (communityId) {
      copyTextToClipboard(
        `${
          domainConf[process.env.NODE_ENV]
        }/community/bought/${communityId}?postId=${threadId}`
      );
    } else {
      copyTextToClipboard(`${domainConf[process.env.NODE_ENV]}`);
    }
    toast("Copied post Link!", { type: "success" });
  };
  const handleViewPost = () => {
    router.push(`/community/bought/${communityId}?postId=${threadId}`);
  };
  if (!viewOnly) {
    return (
      <div className="flex items-center gap-5 text-lg w-full mt-5">
        <button
          className="btn text-black flex items-center mr-4 shadow-none border-none"
          onClick={handleLike}
        >
          {like ? (
            <AiTwotoneLike fill="blue" className="mr-2" />
          ) : (
            <AiOutlineLike className="mr-2" />
          )}
          {numLikes}
        </button>
        {!noReply && (
          <button
            onClick={handleViewReply}
            className="btn text-black flex items-center mr-4 shadow-none border-none"
          >
            <AiOutlineComment className="mr-2" />
            {numReplies}
          </button>
        )}
        <button
          onClick={handleCopy}
          className="btn text-black flex items-center p-3 shadow-none border-none"
        >
          <AiOutlineShareAlt />
        </button>
      </div>
    );
  } else {
    return (
      <div className="flex items-center w-full mt-4">
        <button
          className="btn btn-pink flex items-center mr-4"
          onClick={handleViewPost}
        >
          <AiOutlineEye className="text-black mr-4" />
          View
        </button>
      </div>
    );
  }
};

export default Actions;
