import React from "react";
import { useState } from "react";
import PostX from "./PostX";
import CreatePost from "../community/home/CreatePost";
const Replies = ({
  childThreads,
  index,
  noReply,
  showReplies,
  createReply,
  replyContent,
  setReplyContent,
  threadId,
  user,
  like_map,
}) => {
  // const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);

  if (!showReplies) return null;
  return (
    <div className="flex flex-col w-full">
      {/* <textarea
        rows={5}
        cols={50}
        className={"bg-white rounded p-4 my-8"}
        value={replyContent}
        onChange={(e) => setReplyContent(e.target.value)}
        placeholder="Reply with love"
      /> */}
      {/* <div className="flex items-center justify-end p-6 border-t border-solid border-gray-200 rounded-b"> */}
      <input
        type="text"
        placeholder={`Reply to ${user.name}`}
        readOnly
        className="m-4 border-gray rounded-full p-4 bg-slate-100  text-black"
        onClick={() => setOpen((prev) => !prev)}
      />
      <>
        <CreatePost
          showModal={open}
          setShowModal={setOpen}
          replyPostId={threadId}
        />
      </>
      {/* <button
          className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
          type="button"
          onClick={createReply}
        >
          Post Reply
        </button> */}
      {/* </div> */}
      {!noReply &&
        childThreads?.map((item, index) => (
          <PostX
            noReply
            createdAt={item.createdAt}
            key={`post-${index}`}
            user={item.creator}
            content={item.content}
            threadId={item.id}
            tags={item.tags}
            media={item.assets}
            liked={like_map[item.id] ? true : false}
          />
        ))}
    </div>
  );
};

export default Replies;
