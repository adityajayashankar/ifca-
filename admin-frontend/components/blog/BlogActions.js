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
const BlogActions = ({
  like,
  handleLike,
  handleViewReply,
  numLikes,
  numReplies,
  blogId,
}) => {
  const router = useRouter();
  const handleCopy = (e) => {
    e.preventDefault();
    copyTextToClipboard(`${domainConf[process.env.NODE_ENV]}/blog/${blogId}`);
    toast("Copied post Link!", { type: "success" });
  };

  return (
    <div className="flex items-center w-full mt-4">
      <button
        className="btn btn-pink flex items-center mr-4"
        onClick={handleLike}
      >
        {like ? <AiTwotoneLike /> : <AiOutlineLike />}
        {numLikes}
      </button>
      <button
        onClick={handleViewReply}
        className="btn btn-blue flex items-center mr-4"
      >
        <AiOutlineComment />
        {numReplies}
      </button>
      <button
        onClick={handleCopy}
        className="btn btn-blue flex items-center p-3"
      >
        <AiOutlineShareAlt />
      </button>
    </div>
  );
};

export default BlogActions;
